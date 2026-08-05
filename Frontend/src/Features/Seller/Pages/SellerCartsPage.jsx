import React, { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useSeller } from "../Hooks/useSeller";
import SellerTableSkeleton from "../Components/Skeletons/SellerTableSkeleton";

const SellerCartsPage = () => {
  const { fetchDashboardData } = useSeller();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { allCarts, loading } = useSelector((state) => state.seller);

  useEffect(() => {
    fetchDashboardData(currentUser);
  }, []);

  const cartItems = useMemo(() => {
    const list = [];
    allCarts?.forEach((cart) => {
      const userObj = cart.user;
      cart.items?.forEach((item) => {
        if (item.product) {
          list.push({
            _id: item._id || `${cart._id}-${item.product?._id || item.product}`,
            product: item.product,
            quantity: item.quantity,
            user: userObj,
            updatedAt: cart.updatedAt || cart.createdAt,
          });
        }
      });
    });
    return list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [allCarts]);

  if (loading && (!allCarts || allCarts.length === 0)) {
    return <SellerTableSkeleton />;
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-surface border border-border-theme p-6 rounded-3xl shadow-lg">
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
          Active Cart Items
        </h1>
        <p className="text-xs text-foreground/60">
          Real-time view of products currently sitting in customer shopping bags
        </p>
      </div>

      {cartItems.length === 0 ? (
        <div className="bg-surface border border-border-theme p-12 rounded-3xl text-center space-y-3">
          <i className="ri-shopping-bag-line text-5xl text-foreground/30" />
          <h2 className="text-lg font-black uppercase text-foreground">No active carts found</h2>
          <p className="text-xs text-foreground/50">No customer currently has items in their shopping cart.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border-theme rounded-3xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-theme text-[10px] font-black uppercase tracking-widest text-foreground/50 bg-background/50">
                  <th className="p-4">Product</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Qty</th>
                  <th className="p-4">Subtotal</th>
                  <th className="p-4">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme/40 font-semibold">
                {cartItems.map((item) => {
                  const prod = item.product || {};
                  const price = prod.sellingPrice?.amount || prod.maxPrice?.amount || 0;
                  const imgUrl = prod.images?.[0]?.url || (typeof prod.images?.[0] === "string" ? prod.images[0] : "") || "";

                  return (
                    <tr key={item._id} className="hover:bg-background/40 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {imgUrl && (
                            <img
                              src={imgUrl}
                              alt={prod.title}
                              className="w-10 h-12 object-cover rounded-xl border border-border-theme shrink-0"
                            />
                          )}
                          <div>
                            <p className="font-bold text-foreground max-w-[200px] truncate">
                              {prod.title || "Product"}
                            </p>
                            <p className="text-[11px] text-foreground/50">₹{price.toLocaleString()} each</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {item.user ? (
                          <div>
                            <p className="font-bold text-foreground">{item.user.fullname}</p>
                            <p className="text-[11px] text-foreground/50">{item.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-foreground/40 italic">Guest</span>
                        )}
                      </td>
                      <td className="p-4 font-mono font-bold text-foreground">{item.quantity}</td>
                      <td className="p-4 font-mono font-black text-accent">₹{(price * item.quantity).toLocaleString()}</td>
                      <td className="p-4 text-foreground/60 font-mono text-[11px]">
                        {new Date(item.updatedAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerCartsPage;
