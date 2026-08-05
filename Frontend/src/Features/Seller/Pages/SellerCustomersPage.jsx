import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useSeller } from "../Hooks/useSeller";
import SellerTableSkeleton from "../Components/Skeletons/SellerTableSkeleton";

const SellerCustomersPage = () => {
  const navigate = useNavigate();
  const { fetchDashboardData } = useSeller();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { allCarts, allWishlists, allOrders, users, loading } = useSelector((state) => state.seller);
  const [searchVal, setSearchVal] = useState("");

  useEffect(() => {
    fetchDashboardData(currentUser);
  }, []);

  const customers = useMemo(() => {
    const activeUserIds = new Set();

    allCarts?.forEach((c) => c.user?._id && activeUserIds.add(String(c.user._id)));
    allWishlists?.forEach((w) => w.user?._id && activeUserIds.add(String(w.user._id)));
    allOrders?.forEach((o) => o.user?._id && activeUserIds.add(String(o.user._id)));

    const myId = String(currentUser?._id || currentUser?.id || "");
    const list = users || [];
    return list.filter((u) => {
      const uId = String(u._id || u.id);
      return uId !== myId && u.role !== "admin" && activeUserIds.has(uId);
    });
  }, [allCarts, allWishlists, allOrders, users, currentUser]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (!searchVal.trim()) return true;
      const q = searchVal.toLowerCase();
      return (
        c.fullname?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.contact?.includes(q)
      );
    });
  }, [customers, searchVal]);

  if (loading && (!users || users.length === 0)) {
    return <SellerTableSkeleton />;
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface border border-border-theme p-6 rounded-3xl shadow-lg">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
            My Customers
          </h1>
          <p className="text-xs text-foreground/60">
            Clients permanently linked through purchases, carts, and wishlists
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40 text-sm" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border-theme text-xs font-medium text-foreground outline-none focus:border-accent"
          />
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="bg-surface border border-border-theme p-12 rounded-3xl text-center space-y-3">
          <i className="ri-user-heart-line text-5xl text-foreground/30" />
          <h2 className="text-lg font-black uppercase text-foreground">No active customers found</h2>
          <p className="text-xs text-foreground/50">Clients interacting with your store will appear here permanently.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border-theme rounded-3xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-theme text-[10px] font-black uppercase tracking-widest text-foreground/50 bg-background/50">
                  <th className="p-4">Customer</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Account Type</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme/40 font-semibold">
                {filteredCustomers.map((usr) => (
                  <tr key={usr._id} className="hover:bg-background/40 transition">
                    <td className="p-4">
                      <div
                        onClick={() => navigate(`/seller/users/${usr._id}`)}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-border-theme shrink-0 bg-background flex items-center justify-center font-bold text-accent group-hover:border-accent transition">
                          {usr.profilePic ? (
                            <img src={usr.profilePic} alt={usr.fullname} className="w-full h-full object-cover" />
                          ) : (
                            <span>{(usr.fullname || "C")[0].toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-foreground group-hover:text-accent transition">
                            {usr.fullname || "Customer"}
                          </p>
                          <p className="text-[11px] text-foreground/50">{usr.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-foreground/80">{usr.contact || "N/A"}</td>
                    <td className="p-4">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border bg-accent/10 text-accent border-accent/20">
                        {usr.role}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => navigate(`/seller/users/${usr._id}`)}
                        className="px-3 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-xl text-xs font-bold uppercase hover:bg-accent hover:text-accent-content transition cursor-pointer"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerCustomersPage;
