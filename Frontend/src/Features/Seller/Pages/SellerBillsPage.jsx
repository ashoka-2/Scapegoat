import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import customAxios, { API_BASE_URL, AUTH_TOKEN_KEY } from "../../../utils/axios";
import socket from "../../../utils/socket";
import { printInvoiceDocument } from "../../../utils/printInvoice";

const inputClass = "w-full rounded-2xl border border-border-theme bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const productPrice = (product, variant) => Number(variant?.price?.amount ?? product?.sellingPrice?.amount ?? product?.maxPrice?.amount ?? 0);
const productImage = (product) => product?.images?.find((image) => image.isPrimary)?.url || product?.images?.[0]?.url || "";

const SellerBillsPage = () => {
  const { id: billId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [activeBill, setActiveBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [productsHasMore, setProductsHasMore] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsPage, setProductsPage] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [guest, setGuest] = useState({ name: "Walk-in customer", phone: "" });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [noPhotoMatch, setNoPhotoMatch] = useState(false);
  const [paidEdit, setPaidEdit] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [includeImages, setIncludeImages] = useState(true);
  const [paperSize, setPaperSize] = useState("A4");
  const fileRef = useRef(null);
  const customerSearchRef = useRef(null);
  const activeBillRef = useRef(null);

  useEffect(() => { activeBillRef.current = activeBill; }, [activeBill]);

  useEffect(() => {
    const closeCustomerSearch = (event) => {
      if (!customerSearchRef.current?.contains(event.target)) setCustomerSearchOpen(false);
    };
    document.addEventListener("pointerdown", closeCustomerSearch);
    return () => document.removeEventListener("pointerdown", closeCustomerSearch);
  }, []);

  useEffect(() => {
    const removeEmptyDraft = () => {
      const bill = activeBillRef.current;
      const emptyGuest = !bill?.guestCustomer?.phone && (!bill?.guestCustomer?.name || bill.guestCustomer.name === "Walk-in customer");
      if (!bill || bill.status !== "draft" || bill.customer || bill.items?.length || !emptyGuest) return;
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      fetch(`${API_BASE_URL}/api/bills/${bill._id}`, {
        method: "DELETE",
        keepalive: true,
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch(() => {});
    };
    window.addEventListener("pagehide", removeEmptyDraft);
    return () => {
      window.removeEventListener("pagehide", removeEmptyDraft);
      removeEmptyDraft();
    };
  }, [billId]);

  const subtotal = useMemo(() => (activeBill?.items || []).reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0), [activeBill?.items]);
  const canEditLines = activeBill?.status === "draft" || paidEdit;

  const replaceBill = (next) => {
    setActiveBill(next);
    if (next.customer && typeof next.customer === "object") {
      setSelectedCustomer((current) => current?._id === next.customer._id ? { ...current, ...next.customer } : next.customer);
    } else if (!next.customer) setSelectedCustomer(null);
  };
  const editBill = (transform) => {
    setActiveBill((current) => current ? transform(current) : current);
    if (activeBill?.status === "draft") setDirty(true);
    else setPaidEdit(true);
  };

  const flushDraft = async () => {
    if (!dirty || !activeBill || activeBill.status !== "draft") return;
    const { data } = await customAxios.put(`/api/bills/${activeBill._id}`, {
      items: activeBill.items,
      customerId: selectedCustomer?._id || null,
      guestCustomer: guest,
    });
    replaceBill({ ...data.data, customer: selectedCustomer });
    setDirty(false);
  };

  useEffect(() => {
    setLoading(true);
    setActiveBill(null);
    setSelectedCustomer(null);
    setCustomerQuery("");
    let mounted = true;
    customAxios.get(`/api/bills/${billId}`).then(({ data }) => {
      if (mounted) {
        setActiveBill(data.data);
        setSelectedCustomer(data.data.customer && typeof data.data.customer === "object" ? data.data.customer : null);
        setGuest(data.data.guestCustomer || { name: "Walk-in customer", phone: "" });
      }
    }).catch((error) => setNotice(error.response?.data?.message || "Could not load this bill."))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [billId]);

  useEffect(() => {
    if (!dirty || !activeBill || activeBill.status !== "draft") return undefined;
    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        const { data } = await customAxios.put(`/api/bills/${activeBill._id}`, {
          items: activeBill.items,
          customerId: selectedCustomer?._id || null,
          guestCustomer: guest,
        });
        replaceBill({ ...data.data, customer: selectedCustomer });
        setDirty(false);
        setNotice("Draft saved automatically.");
      } catch (error) {
        setNotice(error.response?.data?.message || "Could not save this bill. Your edits are still on screen.");
      } finally { setSaving(false); }
    }, 650);
    return () => clearTimeout(timer);
  }, [dirty, activeBill?.items, activeBill?._id, activeBill?.status, selectedCustomer?._id, guest.name, guest.phone]);

  useEffect(() => {
    if (!query.trim()) {
      const timer = setTimeout(async () => {
        setProductsLoading(true);
        try {
          const { data } = await customAxios.get("/api/bills/catalog", { params: { page: 1, limit: 10 } });
          setProducts(data.data || []);
          setProductsHasMore(Boolean(data.hasMore));
          setProductsPage(1);
        } catch { setProducts([]); setProductsHasMore(false); }
        finally { setProductsLoading(false); }
      }, 150);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(async () => {
      setProductsLoading(true);
      try {
        const { data } = await customAxios.get("/api/bills/catalog", { params: { q: query.trim(), page: 1, limit: 10 } });
        setProducts(data.data || []);
        setProductsHasMore(Boolean(data.hasMore));
        setProductsPage(1);
      } catch { setProducts([]); setProductsHasMore(false); }
      finally { setProductsLoading(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const loadMoreProducts = async () => {
    if (productsLoading || !productsHasMore) return;
    const nextPage = productsPage + 1;
    setProductsLoading(true);
    try {
      const { data } = await customAxios.get("/api/bills/catalog", { params: { ...(query.trim() ? { q: query.trim() } : {}), page: nextPage, limit: 10 } });
      setProducts((current) => [...current, ...(data.data || [])]);
      setProductsHasMore(Boolean(data.hasMore));
      setProductsPage(nextPage);
    } catch (error) { setNotice(error.response?.data?.message || "Could not load more products."); }
    finally { setProductsLoading(false); }
  };

  useEffect(() => {
    if (!customerSearchOpen) return undefined;
    const timer = setTimeout(async () => {
      try {
        const { data } = await customAxios.get("/api/bills/customers", { params: customerQuery.trim() ? { q: customerQuery.trim() } : {} });
        setCustomerResults(data.data || []);
      } catch { setCustomerResults([]); }
    }, 250);
    return () => clearTimeout(timer);
  }, [customerQuery, customerSearchOpen]);

  useEffect(() => {
    if (!user?._id) return undefined;
    const token = localStorage.getItem("scapegoat_token");
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    const refresh = () => customAxios.get(`/api/bills/${billId}`).then(({ data }) => replaceBill(data.data)).catch(() => {});
    socket.on("bill_updated", refresh);
    socket.on("bill_change_requested", refresh);
    return () => { socket.off("bill_updated", refresh); socket.off("bill_change_requested", refresh); };
  }, [user?._id, billId]);

  const createNewBill = async () => {
    setBusy(true);
    try {
      const { data } = await customAxios.post("/api/bills", {});
      navigate(`/seller/bill/${data.data._id}`, { replace: true });
    } catch (error) { setNotice(error.response?.data?.message || "Could not start a bill."); }
    finally { setBusy(false); }
  };

  const addProduct = (product) => {
    if (!activeBill || !canEditLines) return;
    const variantId = selectedVariants[product._id] || null;
    const variant = variantId ? product.variants?.find((row) => row._id === variantId) : null;
    const key = `${product._id}:${variantId || ""}`;
    editBill((bill) => {
      const items = [...bill.items];
      const index = items.findIndex((item) => `${item.product?._id || item.product}:${item.variantId || ""}` === key);
      if (index >= 0) items[index] = { ...items[index], quantity: Number(items[index].quantity) + 1 };
      else items.push({ product: product._id, variantId, name: variant?.name ? `${product.title} · ${variant.name}` : product.title, image: productImage(product), price: productPrice(product, variant), quantity: 1 });
      return { ...bill, items };
    });
    setNotice(`${product.title} added.`);
  };

  const onImageSearch = async (file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setImagePreview((old) => { if (old) URL.revokeObjectURL(old); return preview; });
    setNoPhotoMatch(false);
    setBusy(true);
    setNotice("Matching this photo against your product catalogue…");
    try {
      const form = new FormData();
      form.append("images", file);
      const { data: matches } = await customAxios.post("/api/products/search/visual/seller", form, { headers: { "Content-Type": "multipart/form-data" } });
      const ids = (matches.data || []).map((product) => product._id).filter(Boolean);
      if (!ids.length) { setProducts([]); setProductsHasMore(false); setNoPhotoMatch(true); setNotice("No close product match was found."); return; }
      const { data } = await customAxios.get("/api/bills/catalog", { params: { ids: ids.join(",") } });
      const order = new Map(ids.map((id, index) => [String(id), index]));
      const ownProducts = (data.data || []).sort((a, b) => (order.get(String(a._id)) ?? 999) - (order.get(String(b._id)) ?? 999));
      setProducts(ownProducts);
      setProductsHasMore(false);
      setNoPhotoMatch(!ownProducts.length);
      setNotice(ownProducts.length ? `${ownProducts.length} matching item${ownProducts.length === 1 ? "" : "s"} found in your catalogue.` : "No matching item from your catalogue was found.");
    } catch (error) { setNotice(error.response?.data?.message || "Photo matching failed. Try a clearer product photo."); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const completePayment = async () => {
    if (!activeBill || !window.confirm("Mark this bill as paid and deduct tracked stock?")) return;
    const paymentMethod = document.getElementById("bill-payment-method")?.value || "cash";
    setBusy(true);
    try {
      await flushDraft();
      const { data } = await customAxios.post(`/api/bills/${activeBill._id}/pay`, { paymentMethod });
      replaceBill({ ...data.data, customer: activeBill.customer });
      setNotice("Payment recorded. Opening a fresh bill…");
      const next = await customAxios.post("/api/bills", {});
      navigate(`/seller/bill/${next.data.data._id}`, { replace: true });
    } catch (error) { setNotice(error.response?.data?.message || "Could not complete payment."); }
    finally { setBusy(false); }
  };

  const requestPaidChange = async () => {
    if (!activeBill || !window.confirm("Send this proposed change to the customer for approval?")) return;
    setBusy(true);
    try {
      const { data } = await customAxios.post(`/api/bills/${activeBill._id}/change-request`, { items: activeBill.items });
      replaceBill({ ...data.data, customer: activeBill.customer });
      setPaidEdit(false);
      setNotice("Change request sent. The bill updates after the customer approves it.");
    } catch (error) { setNotice(error.response?.data?.message || "Could not send the change request."); }
    finally { setBusy(false); }
  };

  const printBill = () => {
    if (!activeBill) return;
    printInvoiceDocument({
      order: { orderId: activeBill.billNumber, createdAt: activeBill.createdAt, isPaid: activeBill.status === "paid", paymentMethod: activeBill.paymentMethod, totalPrice: subtotal, user: { fullname: selectedCustomer?.fullname || guest.name, contact: selectedCustomer?.contact || guest.phone, email: selectedCustomer?.email },
        orderItems: activeBill.items.map((item) => ({ name: item.name, image: item.image || "", price: item.price, quantity: item.quantity })) },
      sellerUser: user,
      customer: selectedCustomer || guest,
      includeImages,
      paperSize,
    });
  };

  if (loading) return <div className="grid min-h-screen place-items-center bg-background text-sm text-foreground/60" role="status">Loading bill…</div>;
  if (!activeBill) return <main className="min-h-screen bg-background p-8 text-sm text-foreground/60">{notice || "Bill is unavailable."}<Link className="ml-3 text-accent underline" to="/seller/bills">Back to dashboard</Link></main>;

  return (
    <main className="min-h-screen bg-background px-3 py-4 text-foreground sm:px-6 sm:py-6 lg:px-10"><section className="mx-auto max-w-7xl space-y-5" aria-labelledby="seller-bills-title">
      <header className="flex flex-col gap-4 border-b border-border-theme pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3"><Link to="/seller/bills" className="grid min-h-11 min-w-11 place-items-center rounded-full border border-border-theme hover:border-accent" aria-label="Back to bill dashboard"><i className="ri-arrow-left-line" /></Link><div><p className="text-xs font-semibold text-accent">Seller counter</p><h1 id="seller-bills-title" className="mt-1 text-2xl font-semibold tracking-tight">Make a bill</h1><p className="mt-1 text-sm text-foreground/60">Saved as you work · {activeBill.billNumber}</p></div></div>
        <button type="button" onClick={createNewBill} disabled={busy || saving} className="min-h-11 rounded-full bg-accent px-5 text-sm font-semibold text-accent-content transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50">＋ New bill</button>
      </header>

      {notice && <p className="rounded-2xl border border-border-theme bg-background px-4 py-3 text-sm text-foreground/75" role="status" aria-live="polite">{notice}</p>}
      <div className="min-w-0 space-y-5">
          <section className="rounded-3xl border border-border-theme bg-background p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-foreground/50">{activeBill.billNumber}</p><h2 className="mt-1 text-lg font-semibold">{activeBill.status === "paid" ? "Paid bill" : "Current bill"}</h2></div><div className="flex flex-wrap items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-medium ${activeBill.status === "paid" ? "bg-emerald-500/10 text-emerald-600" : "bg-accent/10 text-accent"}`}>{activeBill.status === "paid" ? `Paid · ${activeBill.paymentMethod?.toUpperCase()}` : "Draft"}</span><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={includeImages} onChange={(event) => setIncludeImages(event.target.checked)} />Include photos</label><select aria-label="Receipt paper size" value={paperSize} onChange={(event) => setPaperSize(event.target.value)} className="min-h-10 rounded-full border border-border-theme bg-background px-3 text-xs"><option value="A4">A4</option><option value="thermal">Thermal</option></select><button type="button" onClick={printBill} className="min-h-10 rounded-full border border-border-theme px-4 text-xs font-semibold hover:border-accent">Print / Save</button></div></div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="relative" ref={customerSearchRef}>
                <label htmlFor="bill-customer-search" className="mb-1.5 block text-xs font-medium text-foreground/70">Regular customer</label>
                <input id="bill-customer-search" className={inputClass} value={selectedCustomer ? `${selectedCustomer.fullname} · ${selectedCustomer.contact || selectedCustomer.email}` : customerQuery} disabled={activeBill.status !== "draft" || busy || saving} onFocus={() => setCustomerSearchOpen(true)} onChange={(event) => { const value = event.target.value; setCustomerSearchOpen(true); setSelectedCustomer(null); setCustomerQuery(value); if (activeBill.customer) { const nextGuest = { name: "Walk-in customer", phone: "" }; setGuest(nextGuest); editBill((bill) => ({ ...bill, customer: null, guestCustomer: nextGuest })); } }} placeholder="Search name, phone, or email" />
                {customerSearchOpen && customerResults.length > 0 && !selectedCustomer && activeBill.status === "draft" && <div className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-border-theme bg-surface p-1 shadow-xl">{customerResults.map((customer) => <button type="button" key={customer._id} onClick={() => { setSelectedCustomer(customer); setCustomerQuery(""); setCustomerSearchOpen(false); setCustomerResults([]); setGuest({ name: "", phone: "" }); editBill((bill) => ({ ...bill, customer: customer._id, guestCustomer: {} })); }} className="block w-full rounded-xl px-3 py-2 text-left hover:bg-accent/10"><span className="block text-sm font-medium">{customer.fullname}</span><span className="text-xs text-foreground/55">{customer.contact || customer.email} · {customer.role}</span></button>)}</div>}
                {(selectedCustomer || activeBill.customer) && activeBill.status === "draft" && <button type="button" className="mt-1 text-xs text-accent underline" onClick={() => { setSelectedCustomer(null); setCustomerQuery(""); setGuest({ name: "Walk-in customer", phone: "" }); editBill((bill) => ({ ...bill, customer: null, guestCustomer: { name: "Walk-in customer", phone: "" } })); }}>Clear customer</button>}
              </div>
              {!selectedCustomer && <div className="grid grid-cols-2 gap-2"><div><label htmlFor="walkin-name" className="mb-1.5 block text-xs font-medium text-foreground/70">Walk-in name</label><input id="walkin-name" className={inputClass} value={guest.name || ""} disabled={activeBill.status !== "draft" || busy || saving} onChange={(event) => { const next = { ...guest, name: event.target.value }; setGuest(next); editBill((bill) => ({ ...bill, guestCustomer: next, customer: null })); }} /></div><div><label htmlFor="walkin-phone" className="mb-1.5 block text-xs font-medium text-foreground/70">Phone (optional)</label><input id="walkin-phone" className={inputClass} value={guest.phone || ""} disabled={activeBill.status !== "draft" || busy || saving} onChange={(event) => { const next = { ...guest, phone: event.target.value }; setGuest(next); editBill((bill) => ({ ...bill, guestCustomer: next, customer: null })); }} /></div></div>}
            </div>
          </section>

          {canEditLines && <section className="rounded-3xl border border-border-theme bg-background p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="product-search">Search your products</label><input id="product-search" className={inputClass} value={query} onChange={(event) => { setQuery(event.target.value); setNoPhotoMatch(false); }} placeholder="Search title, description, short description, SKU" /><button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="min-h-11 shrink-0 rounded-full border border-border-theme px-4 text-sm font-medium hover:border-accent focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50"><i className="ri-camera-line mr-2" />Scan photo</button><input ref={fileRef} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => onImageSearch(event.target.files?.[0])} /></div>
            {imagePreview && <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border-theme p-3"><img src={imagePreview} alt="Uploaded product to match" className="h-20 w-20 rounded-xl object-cover" /><div><p className="text-sm font-medium">{busy ? "Matching your photo…" : "Photo ready"}</p><p className="mt-1 text-xs text-foreground/55" role="status">{busy ? "Finding the closest products in your catalogue." : notice}</p></div><button type="button" className="ml-auto text-xs text-foreground/60 underline" onClick={() => { URL.revokeObjectURL(imagePreview); setImagePreview(""); }}>Remove photo</button></div>}
            {products.length > 0 && <div className="mt-4 grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">{products.map((product) => <article key={product._id} className="flex min-w-0 gap-3 rounded-2xl border border-border-theme p-3"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface">{productImage(product) ? <img src={productImage(product)} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-foreground/30"><i className="ri-image-line" /></div>}</div><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-medium">{product.title}</h3><p className="mt-1 text-xs text-foreground/55">{product.manageStock ? `${product.stock} in stock` : "Stock not tracked"} · {money(productPrice(product))}</p>{product.variants?.length > 0 && <select aria-label={`Choose ${product.title} variant`} className="mt-2 max-w-full rounded-xl border border-border-theme bg-background px-2 py-1 text-xs" value={selectedVariants[product._id] || ""} onChange={(event) => setSelectedVariants((current) => ({ ...current, [product._id]: event.target.value }))}><option value="">Choose option</option>{product.variants.map((variant) => <option key={variant._id} value={variant._id}>{variant.name || "Variant"} · {money(variant.price?.amount)}</option>)}</select>}</div><button type="button" aria-label={`Add ${product.title}`} disabled={product.variants?.length > 0 && !selectedVariants[product._id]} onClick={() => addProduct(product)} className="min-h-11 min-w-11 self-center rounded-full bg-accent/10 text-lg text-accent hover:bg-accent hover:text-accent-content focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40">＋</button></article>)}</div>}
            {productsHasMore && <div className="mt-4 text-center"><button type="button" onClick={loadMoreProducts} disabled={productsLoading} className="min-h-10 rounded-full border border-border-theme px-5 text-xs font-semibold hover:border-accent disabled:opacity-50">{productsLoading ? "Loading…" : "Load more products"}</button></div>}
            {noPhotoMatch && <div className="mt-4 rounded-2xl border border-border-theme p-4"><p className="text-sm text-foreground/70">No match found in your catalogue.</p><Link to="/products/create" className="mt-2 inline-flex min-h-10 items-center rounded-full bg-accent px-4 text-xs font-semibold text-accent-content">Create product</Link></div>}
          </section>}

          <section className="overflow-hidden rounded-3xl border border-border-theme bg-background">
            <div className="flex items-center justify-between border-b border-border-theme px-4 py-4 sm:px-5"><h2 className="text-sm font-semibold">Items <span className="ml-1 text-foreground/45">{activeBill.items?.length || 0}</span></h2>{saving && <span className="text-xs text-foreground/50" role="status">Saving…</span>}</div>
            {!activeBill.items?.length ? <p className="px-5 py-10 text-center text-sm text-foreground/50">Search or scan a product to add it.</p> : <div className="divide-y divide-border-theme">{activeBill.items.map((item, index) => <div key={`${item.product?._id || item.product}-${item.variantId || ""}-${index}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_110px_130px_auto] sm:px-5"><div className="flex min-w-0 items-center gap-3">{item.image && <img src={item.image} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />}<div className="min-w-0"><p className="truncate text-sm font-medium">{item.name}</p><p className="mt-1 text-xs text-foreground/55">{money(item.price)} each</p></div></div><label className="flex items-center gap-2 text-xs text-foreground/55 sm:justify-center">Qty<input aria-label={`Quantity for ${item.name}`} type="number" min="1" max="9999" value={item.quantity} disabled={!canEditLines} onChange={(event) => { const quantity = Math.max(1, Math.min(9999, Number(event.target.value) || 1)); editBill((bill) => ({ ...bill, items: bill.items.map((row, i) => i === index ? { ...row, quantity } : row) })); }} className="w-20 rounded-xl border border-border-theme bg-surface px-2 py-2 text-center text-sm text-foreground disabled:opacity-60" /></label><label className="flex items-center gap-2 text-xs text-foreground/55 sm:justify-center">Price<input aria-label={`Price for ${item.name}`} type="number" min="0" step="0.01" value={item.price} disabled={!canEditLines} onChange={(event) => { const price = Math.max(0, Number(event.target.value) || 0); editBill((bill) => ({ ...bill, items: bill.items.map((row, i) => i === index ? { ...row, price } : row) })); }} className="w-24 rounded-xl border border-border-theme bg-surface px-2 py-2 text-right text-sm text-foreground disabled:opacity-60" /></label><div className="flex items-center justify-end gap-3"><span className="min-w-20 text-right text-sm font-semibold">{money(item.price * item.quantity)}</span>{canEditLines && <button type="button" aria-label={`Remove ${item.name}`} onClick={() => editBill((bill) => ({ ...bill, items: bill.items.filter((_, i) => i !== index) }))} className="min-h-11 min-w-11 rounded-full text-foreground/50 hover:bg-red-500/10 hover:text-red-500 focus-visible:outline-2 focus-visible:outline-accent"><i className="ri-delete-bin-line" /></button>}</div></div>)}</div>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-theme px-4 py-4 sm:px-5"><div><p className="text-xs text-foreground/55">Subtotal</p><p className="text-xl font-semibold">{money(subtotal)}</p></div><div className="flex flex-wrap items-center gap-2">{activeBill.status === "draft" ? <><label htmlFor="bill-payment-method" className="sr-only">Payment method</label><select id="bill-payment-method" className="min-h-11 rounded-full border border-border-theme bg-surface px-4 text-sm"><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="other">Other</option></select><button type="button" disabled={busy || !activeBill.items?.length} onClick={completePayment} className="min-h-11 rounded-full bg-accent px-5 text-sm font-semibold text-accent-content hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50">Mark paid</button></> : <>{!paidEdit ? <button type="button" disabled={activeBill.changeRequest?.state === "pending"} onClick={() => setPaidEdit(true)} className="min-h-11 rounded-full border border-border-theme px-4 text-sm font-medium hover:border-accent disabled:opacity-50">Edit paid bill</button> : <button type="button" disabled={busy} onClick={requestPaidChange} className="min-h-11 rounded-full bg-accent px-5 text-sm font-semibold text-accent-content hover:opacity-90 disabled:opacity-50">Request customer approval</button>}{activeBill.changeRequest?.state === "pending" && <span className="text-xs text-amber-600">Waiting for customer approval</span>}</>}</div></div>
          </section>
        </div>
    </section></main>
  );
};

export default SellerBillsPage;
