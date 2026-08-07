import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../Hooks/useAdmin";
import AdminUsersSkeleton from "../Components/Skeletons/AdminUsersSkeleton";
import AdminSearchFilterHeader from "../Components/AdminSearchFilterHeader";

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const {
    users,
    usersTotal,
    usersPage,
    usersPages,
    loading,
    fetchAdminUsers,
    changeUserRole,
    toggleBan,
  } = useAdmin();

  const [roleFilter, setRoleFilter] = useState("all");
  const [bannedFilter, setBannedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateMode, setDateMode] = useState("all"); // "all" | "single" | "range"
  const [singleDate, setSingleDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchAdminUsers({
      role: roleFilter,
      isBanned: bannedFilter,
      search: searchQuery,
      page: 1,
    });
  }, [roleFilter, bannedFilter, searchQuery]);

  const filteredUsers = users.filter((u) => {
    if (u.createdAt) {
      const uDate = new Date(u.createdAt).toISOString().split("T")[0];
      if (dateMode === "single" && singleDate) {
        if (uDate !== singleDate) return false;
      } else if (dateMode === "range") {
        if (startDate && uDate < startDate) return false;
        if (endDate && uDate > endDate) return false;
      }
    }
    return true;
  });

  const handleClearFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setBannedFilter("all");
    setDateMode("all");
    setSingleDate("");
    setStartDate("");
    setEndDate("");
  };

  const handleRoleChange = async (userId, newRole) => {
    if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      await changeUserRole(userId, newRole);
    }
  };

  const handleBanToggle = async (userId, isCurrentlyBanned) => {
    const action = isCurrentlyBanned ? "unban" : "ban";
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      await toggleBan(userId);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Search and Date Filter Header */}
      <AdminSearchFilterHeader
        title="User Directory & Administration"
        subtitle="Search users by name, email, contact & filter by registration date"
        icon="ri-user-settings-line"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        dateMode={dateMode}
        onDateModeChange={setDateMode}
        singleDate={singleDate}
        onSingleDateChange={setSingleDate}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        onClearFilters={handleClearFilters}
        totalCount={usersTotal || users.length}
        filteredCount={filteredUsers.length}
        placeholder="Search name, email, contact..."
        extraControls={
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-background border border-border-theme rounded-xl px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="buyer">Buyers Only</option>
              <option value="seller">Sellers Only</option>
              <option value="admin">Admins Only</option>
            </select>

            <select
              value={bannedFilter}
              onChange={(e) => setBannedFilter(e.target.value)}
              className="bg-background border border-border-theme rounded-xl px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="banned">Banned Only</option>
            </select>
          </div>
        }
      />

      {/* Users Table */}
      {loading ? (
        <AdminUsersSkeleton />
      ) : (
        <div className="bg-surface border border-border-theme rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-border-theme bg-background/50 text-[10px] font-black uppercase tracking-wider text-foreground/50">
                  <th className="py-3.5 px-4 whitespace-nowrap">User</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Contact & Email</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Role</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Account Status</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Joined Date</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme/40 text-xs font-semibold">
                {filteredUsers?.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-background/40 transition">
                      {/* Avatar + Full Name */}
                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => navigate(`/admin/users/${u._id}`)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-border-theme shrink-0 bg-background flex items-center justify-center font-black text-accent">
                            {u.profilePic ? (
                              <img src={u.profilePic} alt={u.fullname} className="w-full h-full object-cover" />
                            ) : (
                              <span>{(u.fullname || "U")[0].toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-extrabold text-foreground group-hover:text-accent transition">
                              {u.fullname || "Unnamed User"}
                            </p>
                            <p className="text-[10px] text-foreground/50">ID: {u._id.slice(-6)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact & Email */}
                      <td className="py-3.5 px-4">
                        <p className="text-foreground">{u.email}</p>
                        <p className="text-[10px] text-foreground/50 font-mono">{u.contact || "No contact"}</p>
                      </td>

                      {/* Role Selector */}
                      <td className="py-3.5 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border cursor-pointer ${
                            u.role === "admin"
                              ? "bg-red-500/10 text-red-500 border-red-500/30"
                              : u.role === "seller"
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                              : "bg-blue-500/10 text-blue-500 border-blue-500/30"
                          }`}
                        >
                          <option value="buyer">BUYER</option>
                          <option value="seller">SELLER</option>
                          <option value="admin">ADMIN</option>
                        </select>
                      </td>

                      {/* Banned Status */}
                      <td className="py-3.5 px-4">
                        {u.isBanned ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-red-500/10 text-red-500 border border-red-500/20 flex items-center gap-1 w-fit">
                            <i className="ri-error-warning-line" /> Banned
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1 w-fit">
                            <i className="ri-checkbox-circle-line" /> Active
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-foreground/50 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/admin/users/${u._id}`)}
                            title="View Full Profile"
                            className="p-1.5 rounded-lg bg-background hover:bg-accent hover:text-accent-content text-foreground/70 border border-border-theme transition cursor-pointer"
                          >
                            <i className="ri-eye-line text-sm" />
                          </button>

                          <button
                            onClick={() => handleBanToggle(u._id, u.isBanned)}
                            title={u.isBanned ? "Unban User" : "Ban User"}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              u.isBanned
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500 hover:text-white"
                                : "bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white"
                            }`}
                          >
                            <i className={u.isBanned ? "ri-user-follow-line" : "ri-user-unfollow-line"} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-foreground/40 italic">
                      No users found matching query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {usersPages > 1 && (
            <div className="p-4 border-t border-border-theme flex items-center justify-between text-xs">
              <span className="text-foreground/50 font-bold">
                Page {usersPage} of {usersPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={usersPage <= 1}
                  onClick={() =>
                    fetchAdminUsers({
                      role: roleFilter,
                      isBanned: bannedFilter,
                      search: searchTerm,
                      page: usersPage - 1,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-background border border-border-theme font-bold disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={usersPage >= usersPages}
                  onClick={() =>
                    fetchAdminUsers({
                      role: roleFilter,
                      isBanned: bannedFilter,
                      search: searchTerm,
                      page: usersPage + 1,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-background border border-border-theme font-bold disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
