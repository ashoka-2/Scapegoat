import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import customAxios from "../../../utils/axios";
import socket from "../../../utils/socket";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const MyBills = () => {
  const { user } = useSelector((state) => state.auth);
  const [bills, setBills] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const activeBill = useMemo(() => bills.find((bill) => bill._id === activeId), [bills, activeId]);

  const refresh = useCallback(async () => {
    const { data } = await customAxios.get("/api/bills/my");
    const rows = data.data || [];
    setBills(rows);
    setActiveId((current) => rows.some((bill) => bill._id === current) ? current : rows.find((bill) => bill.changeRequest?.state === "pending")?._id || rows[0]?._id || "");
  }, []);

  useEffect(() => {
    let mounted = true;
    refresh().catch((error) => setNotice(error.response?.data?.message || "Could not load your bills."))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [refresh]);

  useEffect(() => {
    const token = localStorage.getItem("scapegoat_token");
    socket.auth = { token };
    if (socket.connected) { socket.disconnect(); socket.connect(); }
    const onUpdated = () => refresh().catch(() => {});
    const onChangeRequest = (event) => {
      if (event.billId) setActiveId(event.billId);
      setNotice(`The seller has requested a change to bill ${event.billNumber}. Review it below.`);
      refresh().catch(() => {});
    };
    socket.on("bill_updated", onUpdated);
    socket.on("bill_change_requested", onChangeRequest);
    return () => { socket.off("bill_updated", onUpdated); socket.off("bill_change_requested", onChangeRequest); };
  }, [user?._id, refresh]);

  const decide = async (approve) => {
    const requestId = activeBill?.changeRequest?.requestId;
    if (!requestId) return;
    setLoading(true);
    try {
      await customAxios.post(`/api/bills/${activeBill._id}/change-request/${requestId}/decision`, { approve });
      setNotice(approve ? "You approved the change. The bill has been updated." : "You declined the change. The original bill remains unchanged.");
      await refresh();
    } catch (error) { setNotice(error.response?.data?.message || "Could not record your decision."); }
    finally { setLoading(false); }
  };

  return (
    <section aria-labelledby="my-bills-title" className="mx-auto max-w-5xl space-y-5 px-4 py-8 text-foreground sm:px-6">
      <header><p className="text-xs font-semibold text-accent">Your account</p><h1 id="my-bills-title" className="mt-1 text-2xl font-semibold tracking-tight">My shop bills</h1><p className="mt-1 text-sm text-foreground/60">Bills created for you by ScapeGoat sellers.</p></header>
      {notice && <p className="rounded-2xl border border-border-theme bg-surface px-4 py-3 text-sm" role="status" aria-live="polite">{notice}</p>}
      {loading ? <div className="rounded-3xl border border-border-theme bg-surface p-8 text-sm text-foreground/60" role="status">Loading bills…</div> : bills.length === 0 ? <div className="rounded-3xl border border-border-theme bg-surface p-8 text-sm text-foreground/60">You don’t have any shop bills yet.</div> : <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <nav aria-label="Bills" className="space-y-2">{bills.map((bill) => <button type="button" key={bill._id} onClick={() => setActiveId(bill._id)} className={`min-h-16 w-full rounded-2xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-accent ${activeId === bill._id ? "border-accent bg-accent/10" : "border-border-theme bg-surface hover:border-accent/50"}`}><span className="block text-sm font-semibold">{bill.billNumber}</span><span className="mt-1 flex justify-between gap-2 text-xs text-foreground/55"><span>{bill.seller?.fullname || "ScapeGoat seller"}</span><span>{bill.status}</span></span></button>)}</nav>
        {activeBill && <article className="min-w-0 overflow-hidden rounded-3xl border border-border-theme bg-surface">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border-theme p-5"><div><p className="text-xs text-foreground/55">{new Date(activeBill.createdAt).toLocaleString("en-IN")}</p><h2 className="mt-1 text-lg font-semibold">{activeBill.billNumber}</h2><p className="mt-1 text-sm text-foreground/60">From {activeBill.seller?.fullname || "ScapeGoat seller"}</p></div><span className={`rounded-full px-3 py-1 text-xs font-medium ${activeBill.status === "paid" ? "bg-emerald-500/10 text-emerald-600" : "bg-accent/10 text-accent"}`}>{activeBill.status === "paid" ? `Paid · ${activeBill.paymentMethod?.toUpperCase()}` : "Draft"}</span></header>
          <div className="divide-y divide-border-theme">{activeBill.items.map((item, index) => <div key={`${item.product}-${item.variantId || ""}-${index}`} className="flex items-center gap-3 px-5 py-4">{item.image && <img src={item.image} alt="" className="h-12 w-12 rounded-xl object-cover" />}<div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.name}</p><p className="mt-1 text-xs text-foreground/55">{item.quantity} × {money(item.price)}</p></div><p className="text-sm font-semibold">{money(item.quantity * item.price)}</p></div>)}</div>
          <div className="flex items-center justify-between border-t border-border-theme px-5 py-4"><span className="text-sm text-foreground/60">Subtotal</span><span className="text-lg font-semibold">{money(activeBill.subtotal)}</span></div>
          {activeBill.changeRequest?.state === "pending" && <section className="m-4 rounded-2xl border border-accent/30 bg-accent/5 p-4" aria-labelledby="change-request-heading"><h3 id="change-request-heading" className="text-sm font-semibold">Seller requested a bill change</h3><p className="mt-1 text-xs text-foreground/60">Review the proposed items and total below. Your original bill stays unchanged until you decide.</p><div className="mt-3 space-y-2">{activeBill.changeRequest.items?.map((item, index) => <div key={`${item.product}-${index}`} className="flex justify-between gap-3 text-xs"><span>{item.quantity} × {item.name}</span><span>{money(item.quantity * item.price)}</span></div>)}</div><p className="mt-3 flex justify-between border-t border-border-theme pt-3 text-sm font-semibold"><span>Proposed total</span><span>{money(activeBill.changeRequest.subtotal)}</span></p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => decide(true)} className="min-h-11 rounded-full bg-accent px-5 text-sm font-semibold text-accent-content focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Approve change</button><button type="button" onClick={() => decide(false)} className="min-h-11 rounded-full border border-border-theme px-5 text-sm font-medium hover:border-red-500 hover:text-red-500 focus-visible:outline-2 focus-visible:outline-accent">Decline</button></div></section>}
          {activeBill.changeRequest?.state && activeBill.changeRequest.state !== "pending" && <p className="px-5 pb-5 text-xs text-foreground/55">Last requested change: {activeBill.changeRequest.state}.</p>}
        </article>}
      </div>}
    </section>
  );
};

export default MyBills;
