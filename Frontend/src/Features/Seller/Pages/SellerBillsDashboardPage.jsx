import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import customAxios from "../../../utils/axios";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const SellerBillsDashboardPage = () => {
  const [bills, setBills] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const loadBills = async () => {
    try {
      const { data } = await customAxios.get("/api/bills/seller");
      setBills(data.data || []);
    } catch (error) {
      setNotice(error.response?.data?.message || "Could not load shop bills.");
    } finally { setLoading(false); }
  };

  useEffect(() => { loadBills(); }, []);

  const createBill = async () => {
    try {
      const { data } = await customAxios.post("/api/bills", {});
      window.location.assign(`/seller/bill/${data.data._id}`);
    } catch (error) { setNotice(error.response?.data?.message || "Could not start a bill."); }
  };

  const deleteBill = async (bill) => {
    if (!window.confirm(`Delete ${bill.billNumber}? This removes it from active bill history.`)) return;
    try {
      await customAxios.delete(`/api/bills/${bill._id}`);
      setBills((current) => current.filter((row) => row._id !== bill._id));
      setNotice("Bill removed from your active list.");
    } catch (error) { setNotice(error.response?.data?.message || "Could not delete this bill."); }
  };

  const filtered = bills.filter((bill) => {
    const customer = bill.customer || bill.guestCustomer || {};
    const haystack = [bill.billNumber, customer.fullname, customer.name, customer.email, customer.contact, customer.phone, bill.status, bill.paymentMethod].join(" ").toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  return <section className="space-y-5" aria-labelledby="shop-bills-title">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold text-accent">Seller workspace</p><h1 id="shop-bills-title" className="mt-1 text-2xl font-semibold tracking-tight">Shop bills</h1><p className="mt-1 text-sm text-foreground/60">Find counter sales, continue drafts, and manage customer receipts.</p></div>
      <button type="button" onClick={createBill} className="min-h-11 rounded-full bg-accent px-5 text-sm font-semibold text-accent-content hover:opacity-90">＋ Quick make a bill</button>
    </header>
    {notice && <p role="status" className="rounded-2xl border border-border-theme bg-background px-4 py-3 text-sm">{notice}</p>}
    <label className="block"><span className="sr-only">Search bills or customers</span><input className="w-full rounded-2xl border border-border-theme bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search bill number, customer name, email, or contact" /></label>
    <div className="overflow-hidden rounded-3xl border border-border-theme bg-background">
      {loading ? <p className="p-8 text-sm text-foreground/60">Loading bills…</p> : filtered.length ? <div className="divide-y divide-border-theme">{filtered.map((bill) => {
        const customer = bill.customer || bill.guestCustomer || {};
        const name = customer.fullname || customer.name || "Walk-in customer";
        return <article key={bill._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <Link to={`/seller/bill/${bill._id}`} className="min-w-0 flex-1 rounded-xl focus-visible:outline-2 focus-visible:outline-accent"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{bill.billNumber}</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${bill.status === "paid" ? "bg-emerald-500/10 text-emerald-600" : "bg-accent/10 text-accent"}`}>{bill.status}</span></div><p className="mt-1 truncate text-sm text-foreground/65">{name} · {customer.contact || customer.phone || customer.email || "No contact details"}</p><p className="mt-1 text-xs text-foreground/45">{new Date(bill.updatedAt || bill.createdAt).toLocaleString()}</p></Link>
          <div className="flex items-center justify-between gap-4 sm:justify-end"><strong className="text-sm">{money(bill.subtotal)}</strong><Link to={`/seller/bill/${bill._id}`} className="rounded-full border border-border-theme px-4 py-2 text-xs font-semibold hover:border-accent">{bill.status === "draft" ? "Continue" : "View"}</Link><button type="button" onClick={() => deleteBill(bill)} className="rounded-full px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-500/10">Delete</button></div>
        </article>;
      })}</div> : <div className="p-10 text-center"><p className="text-sm text-foreground/60">{query ? "No bills match that search." : "No bills yet."}</p><button type="button" onClick={createBill} className="mt-4 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-content">Make your first bill</button></div>}
    </div>
  </section>;
};

export default SellerBillsDashboardPage;
