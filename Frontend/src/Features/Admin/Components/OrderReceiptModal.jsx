import React from "react";

const OrderReceiptModal = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const user = order.user || {};
  const shippingAddress = order.shippingAddress || {};
  const items = order.items || order.orderItems || [];

  // Group items by seller to calculate seller payouts
  const sellerPayouts = items.reduce((acc, item) => {
    const sellerObj = item.seller || item.product?.seller;
    const sellerId =
      typeof sellerObj === "object" && sellerObj?._id
        ? sellerObj._id.toString()
        : typeof sellerObj === "string"
        ? sellerObj
        : "unassigned";

    const sellerName =
      typeof sellerObj === "object"
        ? sellerObj.storeName || sellerObj.fullname || "Marketplace Seller"
        : "Marketplace Seller";

    const sellerEmail =
      typeof sellerObj === "object" ? sellerObj.email || "" : "";
    const sellerContact =
      typeof sellerObj === "object" ? sellerObj.contact || "" : "";

    const itemTotal = (item.price || item.unitPrice || 0) * (item.quantity || 1);

    if (!acc[sellerId]) {
      acc[sellerId] = {
        sellerId,
        sellerName,
        sellerEmail,
        sellerContact,
        items: [],
        payoutAmount: 0,
      };
    }

    acc[sellerId].items.push({
      name: item.name || item.product?.title || item.title || "Product",
      quantity: item.quantity || 1,
      price: item.price || item.unitPrice || 0,
      total: itemTotal,
    });
    acc[sellerId].payoutAmount += itemTotal;

    return acc;
  }, {});

  const sellerPayoutList = Object.values(sellerPayouts);
  const isDelivered = order.status === "Delivered";
  const isCancelled = order.status === "Cancelled";

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
      <div className="bg-surface border border-border-theme rounded-3xl p-6 sm:p-8 max-w-3xl w-full space-y-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col font-sans print:border-none print:shadow-none print:max-h-none print:p-0 print:bg-white print:text-black">
        
        {/* Receipt Header */}
        <div className="flex items-center justify-between border-b border-border-theme pb-4 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-lg">
              <i className="ri-receipt-line" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-accent">
                  ADMIN ORDER AUDIT & INVOICE
                </span>
                <span className="text-xs font-mono font-black text-foreground">
                  #{order.orderId || order._id?.slice(-8).toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-foreground/50">
                Placed on {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-accent text-accent-content text-xs font-bold hover:brightness-110 transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-accent/20"
            >
              <i className="ri-printer-line text-sm" /> Print Invoice
            </button>
            <button
              onClick={onClose}
              className="p-2 text-foreground/40 hover:text-foreground hover:bg-background rounded-xl text-lg transition cursor-pointer"
            >
              <i className="ri-close-line" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="overflow-y-auto space-y-6 pr-1 flex-1 text-xs print:overflow-visible print:p-6 print:text-black">
          
          {/* Status & Payment Overview Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-background/60 border border-border-theme/50 rounded-2xl print:bg-gray-50 print:border-gray-300">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-foreground/50 print:text-gray-500">
                Order Status:
              </span>
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                  order.status === "Delivered"
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                    : order.status === "Shipped"
                    ? "bg-blue-500/10 text-blue-500 border-blue-500/30"
                    : order.status === "Cancelled"
                    ? "bg-red-500/10 text-red-500 border-red-500/30"
                    : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                }`}
              >
                {order.status}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-foreground/50 print:text-gray-500">
                Payment:
              </span>
              <span className="font-mono font-bold text-foreground print:text-black bg-surface px-2 py-0.5 rounded border border-border-theme/60">
                {order.paymentMethod || "COD"}
              </span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  order.isPaid
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                }`}
              >
                {order.isPaid ? "PAID" : "PENDING"}
              </span>
            </div>

            {order.paymentResult?.razorpayPaymentId && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-foreground/50 print:text-gray-500">
                  Razorpay ID:
                </span>
                <span className="font-mono text-[10px] text-foreground/70 print:text-gray-700">
                  {order.paymentResult.razorpayPaymentId}
                </span>
              </div>
            )}
          </div>

          {/* Customer & Shipping Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-background/50 border border-border-theme/40 rounded-2xl print:bg-gray-50 print:border-gray-300">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-foreground/50 print:text-gray-500">
                Billed To (Customer)
              </span>
              <p className="font-extrabold text-sm text-foreground print:text-black">
                {user.fullname || shippingAddress.fullname || "Customer"}
              </p>
              <p className="text-foreground/70 print:text-gray-700">{user.email}</p>
              <p className="text-foreground/70 print:text-gray-700">Phone: {user.contact || shippingAddress.phone || "N/A"}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-foreground/50 print:text-gray-500">
                Shipping Destination
              </span>
              <p className="font-bold text-foreground print:text-black">
                {shippingAddress.street || shippingAddress.address || "Standard Delivery"}
              </p>
              <p className="text-foreground/70 print:text-gray-700">
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.pincode || shippingAddress.zipCode}
              </p>
              <p className="text-foreground/70 print:text-gray-700">{shippingAddress.country || "India"}</p>
            </div>
          </div>

          {/* Items Table with Seller Attribution */}
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 print:text-gray-500">
              Purchased Items & Seller Attribution
            </span>
            <div className="border border-border-theme/40 rounded-2xl overflow-hidden print:border-gray-300">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-background/80 border-b border-border-theme/40 text-[10px] uppercase font-extrabold text-foreground/50 print:bg-gray-100 print:text-gray-700">
                  <tr>
                    <th className="p-3">Item Details</th>
                    <th className="p-3">Seller / Vendor</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Price</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-theme/40 print:divide-gray-200 font-medium">
                  {items.map((item, idx) => {
                    const title = item.product?.title || item.name || item.title || "Product";
                    const price = item.price || item.unitPrice || 0;
                    const qty = item.quantity || 1;
                    const sellerObj = item.seller || item.product?.seller;
                    const sellerDisplayName =
                      typeof sellerObj === "object"
                        ? sellerObj.storeName || sellerObj.fullname || "Seller"
                        : "Seller";

                    return (
                      <tr key={idx} className="hover:bg-background/30 print:hover:bg-transparent">
                        <td className="p-3 font-bold text-foreground print:text-black">
                          {title}
                          {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                            <span className="block text-[10px] font-normal text-foreground/50 print:text-gray-500">
                              {Object.entries(item.selectedAttributes).map(([k, v]) => `${k}: ${v}`).join(", ")}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-accent print:text-black block">
                            {sellerDisplayName}
                          </span>
                          {typeof sellerObj === "object" && sellerObj.email && (
                            <span className="text-[10px] text-foreground/50 print:text-gray-500 block">
                              {sellerObj.email}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono">{qty}</td>
                        <td className="p-3 text-right font-mono">₹{price.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-bold">₹{(price * qty).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Seller Payout Settlement Card */}
          <div className="space-y-3 p-4 bg-background/40 border border-border-theme/50 rounded-2xl print:border-gray-300 print:bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-foreground/60 flex items-center gap-1.5">
                <i className="ri-hand-coin-line text-accent" />
                Seller Payout Breakdown ({sellerPayoutList.length} Seller{sellerPayoutList.length > 1 ? "s" : ""})
              </span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  isDelivered
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                    : isCancelled
                    ? "bg-red-500/10 text-red-500 border-red-500/30"
                    : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                }`}
              >
                {isDelivered
                  ? "✅ DELIVERED — READY FOR PAYOUT"
                  : isCancelled
                  ? "❌ CANCELLED — NO PAYOUT"
                  : "⏳ IN PROGRESS — PAYOUT ON HOLD"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sellerPayoutList.map((sp, sIdx) => (
                <div
                  key={sIdx}
                  className="p-3 rounded-xl bg-surface border border-border-theme/60 space-y-1.5 print:bg-white print:border-gray-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-foreground print:text-black">
                      {sp.sellerName}
                    </span>
                    <span className="font-mono font-black text-accent text-sm">
                      ₹{sp.payoutAmount.toLocaleString()}
                    </span>
                  </div>
                  {sp.sellerEmail && (
                    <p className="text-[10px] text-foreground/50 print:text-gray-500 truncate">
                      {sp.sellerEmail} {sp.sellerContact ? `• ${sp.sellerContact}` : ""}
                    </p>
                  )}
                  <p className="text-[10px] text-foreground/70 print:text-gray-600">
                    Items: {sp.items.map((i) => `${i.name} (x${i.quantity})`).join(", ")}
                  </p>
                  <div className="text-[9px] font-bold text-foreground/50 pt-1 border-t border-border-theme/30 flex justify-between">
                    <span>Payout Eligibility:</span>
                    <span className={isDelivered ? "text-emerald-500 font-black" : "text-amber-500"}>
                      {isDelivered ? "Disbursable Now" : isCancelled ? "Cancelled" : "Upon Delivery"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Breakdown Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-2">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-foreground">
                Payment Method: <span className="font-mono text-accent uppercase">{order.paymentMethod || "COD / Online"}</span>
              </p>
              <p className="text-[11px] font-bold text-foreground">
                Payment Status:{" "}
                <span className={`font-black uppercase ${order.isPaid ? "text-emerald-500" : "text-amber-500"}`}>
                  {order.isPaid ? "Paid" : "Pending"}
                </span>
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 p-4 bg-background/50 border border-border-theme/40 rounded-2xl text-right font-mono print:bg-gray-50 print:border-gray-300">
              <div className="flex justify-between text-foreground/70 text-xs">
                <span>Subtotal:</span>
                <span>₹{(order.itemsPrice || order.totalPrice || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-foreground/70 text-xs">
                <span>Tax:</span>
                <span>₹{(order.taxPrice || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-foreground/70 text-xs">
                <span>Shipping:</span>
                <span>₹{(order.shippingPrice || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-foreground pt-1.5 border-t border-border-theme print:border-gray-300">
                <span>Grand Total:</span>
                <span className="text-accent">₹{(order.totalPrice || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-border-theme flex justify-end shrink-0 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-accent text-accent-content font-bold text-xs cursor-pointer hover:brightness-110 transition"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderReceiptModal;

