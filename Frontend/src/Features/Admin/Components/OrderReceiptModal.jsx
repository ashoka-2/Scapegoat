import React from "react";

const OrderReceiptModal = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const user = order.user || {};
  const shippingAddress = order.shippingAddress || {};
  const items = order.items || order.orderItems || [];

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border-theme rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col font-sans">
        {/* Receipt Header */}
        <div className="flex items-center justify-between border-b border-border-theme pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">
                OFFICIAL RECEIPT
              </span>
              <span className="text-xs font-mono font-black text-foreground">
                #{order.orderId || order._id?.slice(-8).toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-foreground/50">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-accent/10 text-accent border border-accent/20 text-xs font-bold hover:bg-accent hover:text-accent-content transition cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-printer-line" /> Print Invoice
            </button>
            <button
              onClick={onClose}
              className="text-foreground/40 hover:text-foreground text-xl cursor-pointer"
            >
              <i className="ri-close-line" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="overflow-y-auto space-y-6 pr-1 flex-1 text-xs">
          {/* Customer & Shipping Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-background/50 border border-border-theme/40 rounded-2xl">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-foreground/50">Billed To</span>
              <p className="font-extrabold text-foreground">{user.fullname || shippingAddress.fullname || "Customer"}</p>
              <p className="text-foreground/70">{user.email}</p>
              <p className="text-foreground/70">{user.contact || shippingAddress.phone || "N/A"}</p>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase text-foreground/50">Shipping Address</span>
              <p className="font-bold text-foreground">{shippingAddress.street || shippingAddress.address || "Standard Delivery"}</p>
              <p className="text-foreground/70">
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.pincode || shippingAddress.zipCode}
              </p>
              <p className="text-foreground/70">{shippingAddress.country || "India"}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50">
              Purchased Items
            </span>
            <div className="border border-border-theme/40 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-background/80 border-b border-border-theme/40 text-[10px] uppercase font-extrabold text-foreground/50">
                  <tr>
                    <th className="p-3">Item</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Price</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-theme/40 font-medium">
                  {items.map((item, idx) => {
                    const title = item.product?.title || item.title || "Product";
                    const price = item.price || item.unitPrice || 0;
                    const qty = item.quantity || 1;
                    return (
                      <tr key={idx} className="hover:bg-background/30">
                        <td className="p-3 font-bold text-foreground">
                          {title}
                          {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                            <span className="block text-[10px] font-normal text-foreground/50">
                              {Object.entries(item.selectedAttributes).map(([k, v]) => `${k}: ${v}`).join(", ")}
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

            <div className="w-full sm:w-64 space-y-1.5 p-4 bg-background/50 border border-border-theme/40 rounded-2xl text-right font-mono">
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
              <div className="flex justify-between text-sm font-black text-foreground pt-1.5 border-t border-border-theme">
                <span>Grand Total:</span>
                <span className="text-accent">₹{(order.totalPrice || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-border-theme flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-accent text-accent-content font-bold text-xs cursor-pointer"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderReceiptModal;
