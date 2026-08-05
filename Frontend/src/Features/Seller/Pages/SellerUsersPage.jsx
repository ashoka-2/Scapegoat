import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useSeller } from "../Hooks/useSeller";
import SellerTableSkeleton from "../Components/Skeletons/SellerTableSkeleton";

const SellerUsersPage = () => {
  const navigate = useNavigate();
  const { fetchDashboardData } = useSeller();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { users, loading } = useSelector((state) => state.seller);
  const [searchVal, setSearchVal] = useState("");

  useEffect(() => {
    fetchDashboardData(currentUser);
  }, []);

  const filteredUsers = useMemo(() => {
    const list = users || [];
    return list.filter((u) => {
      if (u.role === "admin") return false;
      if (u._id === currentUser?._id) return false;
      if (!searchVal.trim()) return true;
      const q = searchVal.toLowerCase();
      return (
        u.fullname?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.contact?.includes(q)
      );
    });
  }, [users, searchVal, currentUser]);

  if (loading && (!users || users.length === 0)) {
    return <SellerTableSkeleton />;
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface border border-border-theme p-6 rounded-3xl shadow-lg">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
            User Directory
          </h1>
          <p className="text-xs text-foreground/60">
            Registered platform accounts & seller partners
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40 text-sm" />
          <input
            type="text"
            placeholder="Search by name, email..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border-theme text-xs font-medium text-foreground outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="bg-surface border border-border-theme rounded-3xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border-theme text-[10px] font-black uppercase tracking-widest text-foreground/50 bg-background/50">
                <th className="p-4">User</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-theme/40 font-semibold">
              {filteredUsers.map((usr) => (
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
                          <span>{(usr.fullname || "U")[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-foreground group-hover:text-accent transition">
                          {usr.fullname || "Unnamed"}
                        </p>
                        <p className="text-[11px] text-foreground/50">{usr.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-foreground/80">{usr.contact || "N/A"}</td>
                  <td className="p-4">
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        usr.role === "seller"
                          ? "bg-accent/10 text-accent border-accent/20"
                          : "bg-foreground/10 text-foreground/60 border-border-theme"
                      }`}
                    >
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
    </div>
  );
};

export default SellerUsersPage;
