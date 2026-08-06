import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../Hooks/useAdmin";
import AdminProductsSkeleton from "../Components/Skeletons/AdminProductsSkeleton";

const AdminProductsPage = () => {
  const navigate = useNavigate();
  const {
    products,
    productsTotal,
    productsPage,
    productsPages,
    loading,
    fetchAdminProducts,
  } = useAdmin();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchAdminProducts({
      search: searchTerm,
      status: statusFilter,
      page: 1,
    });
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAdminProducts({
      search: searchTerm,
      status: statusFilter,
      page: 1,
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">
            Global Catalog
          </span>
          <h1 className="text-2xl font-black text-foreground">Catalog Products ({productsTotal})</h1>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-background/50 p-4 rounded-2xl border border-border-theme">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40 text-sm" />
            <input
              type="text"
              placeholder="Search product title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-border-theme rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-accent text-accent-content font-bold text-xs hover:opacity-90 transition cursor-pointer shrink-0"
          >
            Search
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface border border-border-theme rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-accent cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published / Active</option>
          <option value="draft">Drafts</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Products Table */}
      {loading ? (
        <AdminProductsSkeleton />
      ) : (
        <div className="bg-surface border border-border-theme rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-theme bg-background/50 text-[10px] font-black uppercase tracking-wider text-foreground/50">
                  <th className="py-3.5 px-4">Product Info</th>
                  <th className="py-3.5 px-4">Seller</th>
                  <th className="py-3.5 px-4">Category & Brand</th>
                  <th className="py-3.5 px-4">Base Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme/40 text-xs font-semibold">
                {products?.length > 0 ? (
                  products.map((p) => {
                    const primaryImg = p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url;
                    const priceVal =
                      typeof p.price === "number"
                        ? p.price
                        : p.price?.amount ??
                          p.price?.salePrice ??
                          p.price?.mrp ??
                          p.sellingPrice?.amount ??
                          p.maxPrice?.amount ??
                          p.variants?.[0]?.price?.amount ??
                          p.variants?.[0]?.price?.salePrice ??
                          (typeof p.variants?.[0]?.price === "number" ? p.variants[0].price : 0);
                    return (
                      <tr key={p._id} className="hover:bg-background/40 transition">
                        <td className="py-3.5 px-4">
                          <div
                            onClick={() => navigate(`/admin/products/${p._id}`)}
                            className="flex items-center gap-3 cursor-pointer group"
                          >
                            <div className="w-12 h-14 rounded-xl overflow-hidden border border-border-theme shrink-0 bg-background">
                              {primaryImg ? (
                                <img src={primaryImg} alt={p.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-foreground/30">
                                  <i className="ri-image-line" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-foreground group-hover:text-accent transition truncate max-w-[200px]">
                                {p.title}
                              </p>
                              <p className="text-[10px] text-foreground/50 font-mono">
                                ID: {p._id.slice(-6).toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-foreground">
                          {p.seller?.fullname || "Unknown Seller"}
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="text-foreground">{p.category?.name || "N/A"}</p>
                          <p className="text-[10px] text-foreground/50">{p.brand?.name || "No Brand"}</p>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-black text-foreground">
                          ₹{priceVal.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`font-mono font-bold ${
                              p.stock > 0 ? "text-foreground" : "text-red-500 font-black"
                            }`}
                          >
                            {p.stock} units
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              p.status === "published" || p.status === "active"
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            }`}
                          >
                            {p.status || "published"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => navigate(`/admin/products/${p._id}`)}
                            title="Inspect Details & Reviews"
                            className="px-3 py-1.5 rounded-xl bg-background hover:bg-accent hover:text-accent-content border border-border-theme text-xs font-bold transition cursor-pointer"
                          >
                            Inspect <i className="ri-arrow-right-line" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-foreground/40 italic">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {productsPages > 1 && (
            <div className="p-4 border-t border-border-theme flex items-center justify-between text-xs">
              <span className="text-foreground/50 font-bold">
                Page {productsPage} of {productsPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={productsPage <= 1}
                  onClick={() =>
                    fetchAdminProducts({
                      search: searchTerm,
                      status: statusFilter,
                      page: productsPage - 1,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-background border border-border-theme font-bold disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={productsPage >= productsPages}
                  onClick={() =>
                    fetchAdminProducts({
                      search: searchTerm,
                      status: statusFilter,
                      page: productsPage + 1,
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

export default AdminProductsPage;
