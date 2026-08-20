import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { numberToWords } from "../../../utils/numberToWords";
import { printInvoiceDocument } from "../../../utils/printInvoice";

const MarketTaxInvoice = ({ order, sellerUser, onClose }) => {
  const [includeImages, setIncludeImages] = useState(false);
  const [paperFormat, setPaperFormat] = useState("A4"); // "A4" or "thermal"
  const scrollContainerRef = useRef(null);

  // Lock background body and html scroll completely while modal is open
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalDocOverflow = document.documentElement.style.overflow;
    
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Auto focus scroll container
    if (scrollContainerRef.current) {
      scrollContainerRef.current.focus();
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalDocOverflow;
    };
  }, []);

  if (!order) return null;

  const handlePrint = () => {
    printInvoiceDocument({
      order,
      sellerUser,
      includeImages,
      paperSize: paperFormat,
    });
  };

  const user = order.user || {};
  const shippingAddress = order.shippingAddress || {};
  const allItems = order.orderItems || order.items || [];

  const sellerId = sellerUser?._id?.toString();
  const sellerItems = sellerId
    ? allItems.filter(
        (item) =>
          item.seller?._id?.toString() === sellerId ||
          item.seller?.toString() === sellerId
      )
    : allItems;

  const displayItems = sellerItems.length > 0 ? sellerItems : allItems;
  const itemsSubtotal = displayItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  const shippingCharges = 0;
  const grandTotal = itemsSubtotal + shippingCharges;

  const invoiceNumber = `INV-${new Date(order.createdAt || Date.now()).getFullYear()}-${String(
    order.orderId || order._id?.slice(-6) || "000000"
  ).padStart(6, "0").toUpperCase()}`;

  const isPaid = order.isPaid;
  const paymentMethod = (order.paymentMethod || "COD").toUpperCase();
  const paymentId =
    order.paymentResult?.razorpayPaymentId ||
    order.paymentResult?.id ||
    "";

  const invoiceDateStr = new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const storeName = sellerUser?.storeName || sellerUser?.fullname || "Official Store";
  const storeContact = sellerUser?.contact || "N/A";
  const storeEmail = sellerUser?.email || "seller@scapegoat.com";

  const modalContent = (
    <div
      className="fixed inset-0 z-[999999] bg-black/90 backdrop-blur-md flex flex-col h-screen w-screen overflow-hidden text-white font-sans antialiased"
      onWheel={(e) => e.stopPropagation()}
    >
      
      {/* Top Header Bar (Fixed & Full Width) */}
      <div className="shrink-0 w-full bg-[#121214] border-b border-white/10 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-base">
            <i className="ri-file-text-line" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white uppercase tracking-wide">
                Invoice Preview
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-amber-400">
                #{order.orderId || order._id?.slice(-6).toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-white/50 hidden sm:block">
              {paperFormat === "A4" ? "Standard A4 Sheet Format" : "POS Thermal Receipt (80mm Mall Bill)"}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Format Selector: A4 vs Thermal Receipt */}
          <div className="flex items-center bg-black/50 border border-white/15 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setPaperFormat("A4")}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                paperFormat === "A4"
                  ? "bg-white text-black shadow font-extrabold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <i className="ri-file-paper-2-line text-sm" /> A4 Sheet
            </button>
            <button
              type="button"
              onClick={() => setPaperFormat("thermal")}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                paperFormat === "thermal"
                  ? "bg-amber-400 text-black shadow font-extrabold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <i className="ri-receipt-line text-sm" /> Small Thermal Bill
            </button>
          </div>

          {/* Photo Toggle pill */}
          <div className="flex items-center bg-black/50 border border-white/15 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setIncludeImages(false)}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                !includeImages
                  ? "bg-white/20 text-white font-extrabold"
                  : "text-white/50 hover:text-white"
              }`}
            >
              No Photos
            </button>
            <button
              type="button"
              onClick={() => setIncludeImages(true)}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                includeImages
                  ? "bg-amber-400 text-black font-extrabold"
                  : "text-white/50 hover:text-white"
              }`}
            >
              With Photos
            </button>
          </div>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 sm:px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-400/20 active:scale-95"
          >
            <i className="ri-printer-fill text-sm" />
            <span>Print {paperFormat === "thermal" ? "Thermal Bill" : "A4 Bill"}</span>
          </button>

          {/* Close Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center text-lg transition cursor-pointer"
              title="Close Preview"
            >
              <i className="ri-close-line" />
            </button>
          )}
        </div>
      </div>

      {/* Main Viewport Container (Smooth Scrollable Area) */}
      <div
        ref={scrollContainerRef}
        tabIndex={0}
        onWheel={(e) => e.stopPropagation()}
        className="flex-1 overflow-y-scroll h-[calc(100vh-65px)] w-full p-4 sm:p-8 flex flex-col items-center bg-[#0a0a0c] overscroll-contain outline-none"
      >
        
        {paperFormat === "thermal" ? (
          // ==========================================================
          // POS THERMAL RECEIPT PREVIEW (80mm MALL COMPACT BILL)
          // ==========================================================
          <div className="bg-white text-black p-6 w-full max-w-[340px] rounded-lg shadow-2xl border border-neutral-300 my-4 font-mono text-xs">
            <div className="text-center space-y-0.5 border-b border-dashed border-black pb-3 mb-3">
              <h1 className="text-xl font-black uppercase tracking-wider">
                SCAPEGOAT
              </h1>
              <p className="text-[11px] font-bold">RETAIL POS BILL</p>
              <p className="text-[10px] text-neutral-700">Seller: {storeName}</p>
              <p className="text-[9px] text-neutral-600">Ph: {storeContact} | {storeEmail}</p>
            </div>

            <div className="text-[10px] space-y-0.5 border-b border-dashed border-black pb-2 mb-2">
              <div className="flex justify-between">
                <span>Bill No:</span>
                <span className="font-bold">{invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{invoiceDateStr}</span>
              </div>
              <div className="flex justify-between">
                <span>Order Ref:</span>
                <span className="font-bold">#{order.orderId || order._id?.slice(-6).toUpperCase()}</span>
              </div>
            </div>

            <div className="text-[10px] border-b border-dashed border-black pb-2 mb-2 space-y-0.5">
              <div className="font-bold">CUSTOMER:</div>
              <div className="truncate">{user.fullname || shippingAddress.fullname || "Customer"}</div>
              <div>Phone: {user.contact || shippingAddress.phone || "N/A"}</div>
              <div className="text-[9px] text-neutral-600 truncate">
                ${shippingAddress.city || ""}, ${shippingAddress.state || ""} - ${shippingAddress.pincode || ""}
              </div>
            </div>

            <div className="font-bold text-[10px] uppercase border-b-2 border-black pb-1 mb-2">
              ITEMS ORDERED
            </div>

            <div className="space-y-3 border-b border-dashed border-black pb-3 mb-3">
              {displayItems.map((item, idx) => {
                const title = item.name || item.product?.title || "Product";
                const price = Number(item.price || 0);
                const qty = Number(item.quantity || 1);
                const itemGross = price * qty;
                const selectedAttrs = item.selectedAttributes || {};
                const imgUrl = item.image || item.product?.images?.[0]?.url || item.product?.images?.[0] || "";

                return (
                  <div key={idx} className="border-b border-dashed border-neutral-200 pb-2 last:border-none">
                    <div className="flex gap-2.5 items-start">
                      {includeImages && imgUrl && (
                        <img
                          src={imgUrl}
                          alt={title}
                          className="w-11 h-11 object-cover rounded border border-neutral-300 shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        {/* Title with Ellipsis Truncation */}
                        <div
                          className="font-bold text-[11px] leading-snug truncate"
                          title={title}
                        >
                          {idx + 1}. {title}
                        </div>

                        {/* Variant with Ellipsis Truncation */}
                        {Object.keys(selectedAttrs).length > 0 && (
                          <div className="text-[9px] text-neutral-600 truncate mt-0.5">
                            ({Object.entries(selectedAttrs).map(([k, v]) => `${k}:${v}`).join(", ")})
                          </div>
                        )}

                        <div className="flex justify-between text-[10.5px] pt-1">
                          <span className="text-neutral-600">{qty} x ₹${price.toFixed(2)}</span>
                          <span className="font-bold text-neutral-950">₹${itemGross.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-1 border-b-2 border-black pb-2 mb-2 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{itemsSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span>{shippingCharges === 0 ? "FREE" : `₹${shippingCharges.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-1 border-t border-dashed border-black">
                <span>TOTAL:</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-[10px] space-y-0.5 border-b border-dashed border-black pb-2 mb-3">
              <div className="flex justify-between">
                <span className="font-bold">Payment:</span>
                <span className="font-bold">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-bold">{isPaid ? "PAID ONLINE" : "CASH ON DELIVERY"}</span>
              </div>
              {paymentId && (
                <div className="text-[9px] text-neutral-600 truncate">Txn: {paymentId}</div>
              )}
            </div>

            <div className="text-center text-[9px] text-neutral-600 space-y-1">
              <p className="font-bold text-neutral-800">THANK YOU FOR SHOPPING!</p>
              <p>Scapegoat Multi-Vendor Marketplace</p>
              <p className="text-[8px] pt-1">*** End of Receipt ***</p>
            </div>
          </div>
        ) : (
          // ==========================================================
          // STANDARD A4 SHEET PREVIEW
          // ==========================================================
          <div className="bg-white text-neutral-900 p-6 sm:p-10 max-w-[800px] w-full rounded-xl shadow-2xl border border-neutral-200 my-4 font-sans text-xs">
            
            {/* Header */}
            <div className="flex flex-wrap justify-between items-start gap-4 border-b-2 border-neutral-900 pb-5 mb-5">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-neutral-950 uppercase">
                  SCAPEGOAT
                </h1>
                <p className="text-xs font-bold text-neutral-800 mt-1">
                  Seller: <span className="font-extrabold">{storeName}</span>
                </p>
                <p className="text-[11px] text-neutral-600">
                  Email: {storeEmail} • Phone: {storeContact}
                </p>
                <p className="text-[11px] text-neutral-500">
                  Platform: Scapegoat Multi-Vendor Marketplace
                </p>
              </div>

              <div className="text-right">
                <div className="inline-block bg-neutral-950 text-white px-3 py-1 text-xs font-black uppercase tracking-wider rounded mb-1.5">
                  RETAIL BILL / INVOICE
                </div>
                <p className="font-mono font-bold text-xs text-neutral-950">
                  {invoiceNumber}
                </p>
                <p className="text-[11px] text-neutral-600">
                  Date: <span className="font-semibold text-neutral-900">{invoiceDateStr}</span>
                </p>
                <p className="text-[11px] text-neutral-600">
                  Order ID: <span className="font-semibold text-neutral-900">#{order.orderId || order._id?.slice(-6).toUpperCase()}</span>
                </p>
              </div>
            </div>

            {/* Customer & Shipping Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div className="p-3.5 rounded-lg border border-neutral-200 bg-neutral-50 space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-neutral-500 border-b border-neutral-200 pb-1 mb-1.5">
                  Billed To (Customer)
                </div>
                <p className="font-bold text-sm text-neutral-950">
                  {user.fullname || shippingAddress.fullname || "Customer"}
                </p>
                <p className="text-neutral-600">{user.email || "N/A"}</p>
                <p className="text-neutral-600">
                  Phone: <span className="font-bold text-neutral-900">{user.contact || shippingAddress.phone || "N/A"}</span>
                </p>
                <p className="text-neutral-700 pt-0.5">
                  {shippingAddress.street}, {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-neutral-200 bg-neutral-50 space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-neutral-500 border-b border-neutral-200 pb-1 mb-1.5">
                  Shipped To (Delivery Address)
                </div>
                <p className="font-bold text-sm text-neutral-950">
                  {shippingAddress.fullname || user.fullname || "Recipient"}
                </p>
                <p className="text-neutral-600">{shippingAddress.street || "Delivery Destination"}</p>
                <p className="text-neutral-600">
                  {shippingAddress.city}, {shippingAddress.state} - <span className="font-bold text-neutral-900">{shippingAddress.pincode}</span>
                </p>
                <p className="text-neutral-700 pt-0.5">
                  Country: {shippingAddress.country || "India"}
                </p>
              </div>
            </div>

            {/* Itemized Table */}
            <table className="w-full border-collapse border border-neutral-200 text-xs mb-5">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-700 text-[10px] font-black uppercase tracking-wider">
                  <th className="p-2 text-center w-8 border-r border-neutral-200">#</th>
                  {includeImages && <th className="p-2 text-center w-14 border-r border-neutral-200">Photo</th>}
                  <th className="p-2 text-left border-r border-neutral-200">Item Description</th>
                  <th className="p-2 text-center w-12 border-r border-neutral-200">Qty</th>
                  <th className="p-2 text-right w-24 border-r border-neutral-200">Unit Price</th>
                  <th className="p-2 text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {displayItems.map((item, idx) => {
                  const title = item.name || item.product?.title || "Product";
                  const price = Number(item.price || 0);
                  const qty = Number(item.quantity || 1);
                  const itemGross = price * qty;
                  const selectedAttrs = item.selectedAttributes || {};
                  const imgUrl = item.image || item.product?.images?.[0]?.url || item.product?.images?.[0] || "";

                  return (
                    <tr key={idx} className="hover:bg-neutral-50/60">
                      <td className="p-2 text-center font-mono text-neutral-500 border-r border-neutral-200">{idx + 1}</td>
                      {includeImages && (
                        <td className="p-2 text-center border-r border-neutral-200">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={title}
                              className="w-10 h-10 object-cover rounded border border-neutral-300 mx-auto"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-neutral-100 border border-neutral-300 text-[8px] flex items-center justify-center text-neutral-400 mx-auto">
                              N/A
                            </div>
                          )}
                        </td>
                      )}
                      <td className="p-2 border-r border-neutral-200">
                        <p className="font-bold text-neutral-950">{title}</p>
                        {Object.keys(selectedAttrs).length > 0 && (
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            {Object.entries(selectedAttrs).map(([k, v]) => (
                              <span
                                key={k}
                                className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-700 border border-neutral-200"
                              >
                                {k}: {String(v)}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-2 text-center font-mono font-bold text-neutral-900 border-r border-neutral-200">{qty}</td>
                      <td className="p-2 text-right font-mono text-neutral-700 border-r border-neutral-200">₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="p-2 text-right font-mono font-black text-neutral-950">₹{itemGross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Financial Summary & Amount in Words */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 border border-neutral-200 rounded-lg p-4 mb-5 bg-neutral-50">
              <div className="sm:col-span-7 space-y-2.5">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 block">
                    Amount in Words
                  </span>
                  <p className="font-extrabold text-xs text-neutral-900 italic mt-0.5">
                    {numberToWords(grandTotal)}
                  </p>
                </div>

                <div className="pt-2 border-t border-neutral-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-neutral-600">Payment:</span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                        isPaid
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-amber-50 text-amber-800 border-amber-300"
                      }`}
                    >
                      {isPaid ? "PAID ONLINE" : paymentMethod === "COD" ? "CASH ON DELIVERY" : "PAYMENT PENDING"}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500 font-bold">({paymentMethod})</span>
                  </div>
                  {paymentId && (
                    <p className="text-[10px] text-neutral-500 font-mono">
                      Txn Reference: <span className="font-bold text-neutral-800">{paymentId}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-5 space-y-1.5 font-mono text-xs pt-2 sm:pt-0 sm:border-l sm:border-neutral-200 sm:pl-4">
                <div className="flex justify-between text-neutral-600">
                  <span>Items Subtotal:</span>
                  <span>₹{itemsSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Shipping & Delivery:</span>
                  <span className="text-emerald-700 font-bold">{shippingCharges === 0 ? "FREE" : `₹${shippingCharges.toFixed(2)}`}</span>
                </div>
                <div className="pt-2 border-t-2 border-neutral-900 flex justify-between text-sm font-black text-neutral-950">
                  <span>GRAND TOTAL:</span>
                  <span>₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Footer Terms & Signatory */}
            <div className="pt-2 flex flex-wrap justify-between items-end gap-4 text-[10px] text-neutral-500">
              <div className="space-y-0.5 max-w-sm">
                <p className="font-bold uppercase text-neutral-700">Thank you for your order!</p>
                <p>This is a computer-generated retail invoice and requires no physical signature.</p>
              </div>

              <div className="text-right space-y-3">
                <p className="font-bold text-neutral-900 uppercase">
                  For SCAPEGOAT / {storeName}
                </p>
                <div className="pt-3 border-t border-dashed border-neutral-400 font-bold uppercase text-neutral-400">
                  Authorized Signatory
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );

  return createPortal(modalContent, document.body);
};

export default MarketTaxInvoice;
