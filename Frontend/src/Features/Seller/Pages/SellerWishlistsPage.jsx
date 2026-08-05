import React, { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useSeller } from "../Hooks/useSeller";
import SellerTableSkeleton from "../Components/Skeletons/SellerTableSkeleton";

const SellerWishlistsPage = () => {
  const { fetchDashboardData } = useSeller();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { allWishlists, loading } = useSelector((state) => state.seller);

  useEffect(() => {
    fetchDashboardData(currentUser);
  }, []);

  const wishlistedItems = useMemo(() => {
    const list = [];
    allWishlists?.forEach((wishlist) => {
      const userObj = wishlist.user;
      wishlist.products?.forEach((prod) => {
        if (prod) {
          list.push({
            _id: `${wishlist._id}-${prod._id || prod}`,
            product: prod,
            user: userObj,
            updatedAt: wishlist.updatedAt || wishlist.createdAt,
          });
        }
      });
    });
    return list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [allWishlists]);

  if (loading && (!allWishlists || allWishlists.length === 0)) {
    return <SellerTableSkeleton />;
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-surface border border-border-theme p-6 rounded-3xl shadow-lg">
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
          Customer Wishlists
        </h1>
        <p className="text-xs text-foreground/60">
          Real-time view of garments wishlisted by platform shoppers
        </p>
      </div>

      {wishlistedItems.length === 0 ? (
        <div className="bg-surface border border-border-theme p-12 rounded-3xl text-center space-y-3">
          <i className="ri-heart-line text-5xl text-foreground/30" />
          <h2 className="text-lg font-black uppercase text-foreground">No wishlists found</h2>
          <p className="text-xs text-foreground/50">No customer has wishlisted products yet.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border-theme rounded-3xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-theme text-[10px] font-black uppercase tracking-widest text-foreground/50 bg-background/50">
                  <th className="p-4">Product</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme/40 font-semibold">
                {wishlistedItems.map((item) => {
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
                          <p className="font-bold text-foreground max-w-[200px] truncate">
                            {prod.title || "Product"}
                          </p>
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
                      <td className="p-4 font-mono font-black text-accent">₹{price.toLocaleString()}</td>
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

export default SellerWishlistsPage;
