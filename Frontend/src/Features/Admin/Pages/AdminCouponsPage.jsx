import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import customAxios from "../../../utils/axios";
import { useDispatch } from "react-redux";
import { addToast } from "../../../utils/toast.slice";

const CODE_PRESETS = ["SCAPE10", "SCAPE20", "FLAT500", "MEGASALE", "VIPBUYER", "BULKSAVE"];

const AdminCouponsPage = () => {
  const dispatch = useDispatch();

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [stats, setStats] = useState({
    totalCoupons: 0,
    activeCoupons: 0,
    tieredCoupons: 0,
    fixedCoupons: 0,
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [couponType, setCouponType] = useState("fixed"); // "fixed" | "tiered"
  const [discountType, setDiscountType] = useState("percentage"); // "percentage" | "flat"
  const [discountValue, setDiscountValue] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [perUserLimit, setPerUserLimit] = useState("1");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [isActive, setIsActive] = useState(true);

  // Tiered discounts state: [{ minQuantity: 3, discountType: 'percentage', discountValue: 10 }]
  const [tiers, setTiers] = useState([
    { minQuantity: 3, discountType: "percentage", discountValue: 10 },
    { minQuantity: 6, discountType: "percentage", discountValue: 20 },
  ]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (typeFilter !== "all") params.type = typeFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      const { data } = await customAxios.get("/api/coupons", { params });
      if (data?.success) {
        setCoupons(data.coupons || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Fetch coupons error:", err);
      dispatch(addToast({ message: "Failed to load coupons list.", type: "error" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [search, typeFilter, statusFilter]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setCode("");
    setDescription("");
    setCouponType("fixed");
    setDiscountType("percentage");
    setDiscountValue("");
    setMaxDiscount("");
    setMinPurchase("");
    setUsageLimit("");
    setPerUserLimit("1");
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setIsActive(true);
    setTiers([
      { minQuantity: 3, discountType: "percentage", discountValue: 10 },
      { minQuantity: 6, discountType: "percentage", discountValue: 20 },
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon) => {
    setEditingId(coupon._id);
    setCode(coupon.code);
    setDescription(coupon.description || "");
    setCouponType(coupon.couponType || "fixed");
    setDiscountType(coupon.discountType || "percentage");
    setDiscountValue(coupon.discountValue !== undefined ? String(coupon.discountValue) : "");
    setMaxDiscount(coupon.maxDiscount ? String(coupon.maxDiscount) : "");
    setMinPurchase(coupon.minPurchase ? String(coupon.minPurchase) : "");
    setUsageLimit(coupon.usageLimit ? String(coupon.usageLimit) : "");
    setPerUserLimit(coupon.perUserLimit ? String(coupon.perUserLimit) : "1");
    setStartDate(new Date(coupon.startDate).toISOString().slice(0, 10));
    setEndDate(new Date(coupon.endDate).toISOString().slice(0, 10));
    setIsActive(coupon.isActive);
    if (coupon.tiers && coupon.tiers.length > 0) {
      setTiers(coupon.tiers);
    } else {
      setTiers([{ minQuantity: 3, discountType: "percentage", discountValue: 10 }]);
    }
    setIsModalOpen(true);
  };

  const handleAddTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const nextQty = lastTier ? lastTier.minQuantity + 3 : 3;
    setTiers([...tiers, { minQuantity: nextQty, discountType: "percentage", discountValue: 15 }]);
  };

  const handleRemoveTier = (index) => {
    if (tiers.length <= 1) {
      dispatch(addToast({ message: "Tiered coupons require at least one tier.", type: "error" }));
      return;
    }
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleTierChange = (index, field, value) => {
    const next = [...tiers];
    next[index][field] = field === "discountType" ? value : Number(value);
    setTiers(next);
  };

  const handleSubmitCoupon = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      dispatch(addToast({ message: "Coupon code is required.", type: "error" }));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        description: description.trim(),
        couponType,
        discountType: couponType === "fixed" ? discountType : undefined,
        discountValue: couponType === "fixed" ? Number(discountValue) : undefined,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        tiers: couponType === "tiered" ? tiers : [],
        minPurchase: minPurchase ? Number(minPurchase) : 0,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        perUserLimit: perUserLimit ? Number(perUserLimit) : 1,
        startDate,
        endDate,
        isActive,
      };

      if (editingId) {
        await customAxios.put(`/api/coupons/${editingId}`, payload);
        dispatch(addToast({ message: `Coupon "${payload.code}" updated successfully!`, type: "success" }));
      } else {
        await customAxios.post("/api/coupons", payload);
        dispatch(addToast({ message: `Coupon "${payload.code}" created successfully!`, type: "success" }));
      }

      setIsModalOpen(false);
      fetchCoupons();
    } catch (err) {
      dispatch(
        addToast({
          message: err.response?.data?.message || err.message || "Failed to save coupon.",
          type: "error",
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const { data } = await customAxios.patch(`/api/coupons/${id}/toggle`);
      if (data?.success) {
        dispatch(addToast({ message: data.message, type: "success" }));
        fetchCoupons();
      }
    } catch (err) {
      dispatch(addToast({ message: "Failed to update coupon status.", type: "error" }));
    }
  };

  const handleDeleteCoupon = async (id, couponCode) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${couponCode}"?`)) return;
    try {
      const { data } = await customAxios.delete(`/api/coupons/${id}`);
      if (data?.success) {
        dispatch(addToast({ message: `Coupon "${couponCode}" deleted.`, type: "success" }));
        fetchCoupons();
      }
    } catch (err) {
      dispatch(addToast({ message: "Failed to delete coupon.", type: "error" }));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    dispatch(addToast({ message: `📋 Copied "${text}" to clipboard!`, type: "success" }));
  };

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-accent/10 text-accent text-xl flex items-center justify-center">
              <i className="ri-coupon-3-line" />
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-foreground">
              Discount Coupons Manager
            </h1>
          </div>
          <p className="text-xs md:text-sm text-foreground/60 mt-1">
            Create fixed discount codes or tiered volume discounts with minimum order requirements & usage limits.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-2.5 rounded-2xl bg-accent text-accent-content font-black text-xs uppercase tracking-wider shadow-lg hover:opacity-90 active:scale-95 transition cursor-pointer flex items-center gap-2"
        >
          <i className="ri-add-circle-fill text-base" />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-surface border border-border-theme space-y-1 shadow-sm">
          <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Total Coupons</p>
          <p className="text-2xl font-mono font-black text-foreground">{stats.totalCoupons}</p>
        </div>
        <div className="p-5 rounded-3xl bg-surface border border-border-theme space-y-1 shadow-sm">
          <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Active Campaigns</p>
          <p className="text-2xl font-mono font-black text-emerald-500">{stats.activeCoupons}</p>
        </div>
        <div className="p-5 rounded-3xl bg-surface border border-border-theme space-y-1 shadow-sm">
          <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Fixed Discount Codes</p>
          <p className="text-2xl font-mono font-black text-accent">{stats.fixedCoupons}</p>
        </div>
        <div className="p-5 rounded-3xl bg-surface border border-border-theme space-y-1 shadow-sm">
          <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Tiered / Volume Deals</p>
          <p className="text-2xl font-mono font-black text-purple-500">{stats.tieredCoupons}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-3xl bg-surface border border-border-theme flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code or description..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-background border border-border-theme text-xs text-foreground focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background border border-border-theme text-xs font-bold text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="fixed">Fixed Single Discounts</option>
            <option value="tiered">Tiered Volume Discounts</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background border border-border-theme text-xs font-bold text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="expired">Expired</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      {/* Coupons Visual Grid */}
      {loading ? (
        <div className="py-20 flex items-center justify-center text-foreground/50 text-xs">
          <i className="ri-loader-4-line animate-spin text-2xl mr-2 text-accent" /> Loading coupons...
        </div>
      ) : coupons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {coupons.map((coupon) => {
            const isExpired = new Date(coupon.endDate) < new Date();
            const isUpcoming = new Date(coupon.startDate) > new Date();

            return (
              <div
                key={coupon._id}
                className="relative bg-surface rounded-3xl border border-border-theme p-5 space-y-4 shadow-sm hover:shadow-md transition group overflow-hidden"
              >
                {/* Perforated edge styling effect */}
                <div className="flex items-start justify-between gap-2 border-b border-dashed border-border-theme pb-3.5">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-base text-foreground tracking-wider uppercase">
                        {coupon.code}
                      </span>
                      <button
                        onClick={() => copyToClipboard(coupon.code)}
                        className="text-foreground/40 hover:text-accent p-1 transition cursor-pointer"
                        title="Copy Code"
                      >
                        <i className="ri-file-copy-line text-sm" />
                      </button>
                    </div>
                    <p className="text-[11px] text-foreground/60 line-clamp-1">
                      {coupon.description || "Special promotional discount coupon."}
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                      !coupon.isActive
                        ? "bg-neutral-500/10 text-neutral-500 border border-neutral-500/20"
                        : isExpired
                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                        : isUpcoming
                        ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                        : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    }`}
                  >
                    {!coupon.isActive ? "Disabled" : isExpired ? "Expired" : isUpcoming ? "Upcoming" : "Active"}
                  </span>
                </div>

                {/* Discount Display */}
                <div className="space-y-2">
                  {coupon.couponType === "fixed" ? (
                    <div className="p-3 rounded-2xl bg-background border border-border-theme/60 flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground/60">Discount:</span>
                      <span className="font-black text-sm text-accent">
                        {coupon.discountType === "percentage"
                          ? `${coupon.discountValue}% OFF`
                          : `₹${coupon.discountValue?.toLocaleString()} FLAT`}
                        {coupon.maxDiscount && (
                          <span className="text-[10px] text-foreground/50 font-normal ml-1">
                            (Max ₹{coupon.maxDiscount})
                          </span>
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-background border border-border-theme/60 space-y-1.5">
                      <span className="text-[11px] font-black text-purple-400 uppercase tracking-wider flex items-center gap-1">
                        <i className="ri-stack-line text-xs" /> Volume Tier Discounts:
                      </span>
                      <div className="space-y-1">
                        {coupon.tiers?.map((t, idx) => (
                          <div key={idx} className="flex justify-between text-xs font-semibold text-foreground/80">
                            <span>Buy {t.minQuantity}+ Items</span>
                            <span className="text-accent font-black">
                              {t.discountType === "percentage" ? `${t.discountValue}% OFF` : `₹${t.discountValue} FLAT`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rules summary */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-foreground/60">
                    <div>
                      <span className="font-bold text-foreground/40 block">Min Purchase:</span>
                      <span className="font-semibold text-foreground">
                        {coupon.minPurchase ? `₹${coupon.minPurchase.toLocaleString()}` : "No Minimum"}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-foreground/40 block">Redemptions:</span>
                      <span className="font-semibold text-foreground font-mono">
                        {coupon.usedCount} / {coupon.usageLimit || "∞"}
                      </span>
                    </div>
                    <div className="col-span-2 text-[10px] text-foreground/40 font-mono">
                      Valid: {new Date(coupon.startDate).toLocaleDateString()} — {new Date(coupon.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-border-theme/60">
                  <button
                    onClick={() => handleToggleStatus(coupon._id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      coupon.isActive
                        ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                        : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                    }`}
                  >
                    {coupon.isActive ? "Disable" : "Enable"}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(coupon)}
                      className="w-8 h-8 rounded-xl bg-background border border-border-theme text-foreground/70 hover:text-accent hover:border-accent/40 flex items-center justify-center transition cursor-pointer"
                      title="Edit Coupon"
                    >
                      <i className="ri-edit-line text-sm" />
                    </button>
                    <button
                      onClick={() => handleDeleteCoupon(coupon._id, coupon.code)}
                      className="w-8 h-8 rounded-xl bg-background border border-border-theme text-foreground/70 hover:text-red-500 hover:border-red-500/40 flex items-center justify-center transition cursor-pointer"
                      title="Delete Coupon"
                    >
                      <i className="ri-delete-bin-line text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 rounded-3xl bg-surface border border-dashed border-border-theme text-center space-y-3">
          <i className="ri-coupon-line text-4xl text-accent/40 block" />
          <h3 className="text-base font-bold text-foreground">No coupons found</h3>
          <p className="text-xs text-foreground/50">Create your first promotional discount code to boost sales!</p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-2xl bg-accent text-accent-content font-bold text-xs cursor-pointer hover:opacity-90 transition"
          >
            Create Coupon Now
          </button>
        </div>
      )}

      {/* Create / Edit Coupon Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-surface border border-border-theme p-6 sm:p-7 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-border-theme pb-4">
                <div>
                  <h2 className="text-base font-black text-foreground">
                    {editingId ? "Edit Coupon Campaign" : "Create New Coupon"}
                  </h2>
                  <p className="text-xs text-foreground/50">Configure discount value, usage limits, and validity.</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-background border border-border-theme text-foreground/50 hover:text-foreground flex items-center justify-center transition cursor-pointer"
                >
                  <i className="ri-close-line text-lg" />
                </button>
              </div>

              <form onSubmit={handleSubmitCoupon} className="space-y-4 text-xs">
                {/* Coupon Code Input with Quick Presets */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-foreground">Coupon Code *</label>
                    <div className="flex gap-1">
                      {CODE_PRESETS.slice(0, 3).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCode(p)}
                          className="px-2 py-0.5 rounded-lg bg-background border border-border-theme text-[10px] font-mono text-foreground/70 hover:text-accent cursor-pointer"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SUMMER50"
                    maxLength={30}
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-background border border-border-theme font-mono font-bold text-foreground focus:outline-none focus:border-accent tracking-widest uppercase"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Campaign Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. 20% off on all streetwear drops"
                    className="w-full px-4 py-2 rounded-2xl bg-background border border-border-theme text-foreground focus:outline-none focus:border-accent"
                  />
                </div>

                {/* Coupon Type: Fixed vs Tiered */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Discount Structure</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCouponType("fixed")}
                      className={`py-2.5 px-3 rounded-2xl border font-bold text-center transition cursor-pointer ${
                        couponType === "fixed"
                          ? "bg-accent text-accent-content border-accent shadow-sm"
                          : "bg-background border-border-theme text-foreground/70"
                      }`}
                    >
                      🏷️ Fixed Single Discount
                    </button>
                    <button
                      type="button"
                      onClick={() => setCouponType("tiered")}
                      className={`py-2.5 px-3 rounded-2xl border font-bold text-center transition cursor-pointer ${
                        couponType === "tiered"
                          ? "bg-accent text-accent-content border-accent shadow-sm"
                          : "bg-background border-border-theme text-foreground/70"
                      }`}
                    >
                      📦 Tiered Volume Discount
                    </button>
                  </div>
                </div>

                {/* Fixed Type Config */}
                {couponType === "fixed" ? (
                  <div className="p-4 rounded-2xl bg-background border border-border-theme space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-foreground">Discount Type</label>
                        <select
                          value={discountType}
                          onChange={(e) => setDiscountType(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-surface border border-border-theme text-foreground font-bold cursor-pointer"
                        >
                          <option value="percentage">Percentage (% OFF)</option>
                          <option value="flat">Flat Amount (₹ FLAT)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-foreground">Discount Value *</label>
                        <input
                          type="number"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          placeholder={discountType === "percentage" ? "e.g. 20" : "e.g. 500"}
                          min="1"
                          max={discountType === "percentage" ? "100" : undefined}
                          required={couponType === "fixed"}
                          className="w-full px-3 py-2 rounded-xl bg-surface border border-border-theme text-foreground font-mono focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>

                    {discountType === "percentage" && (
                      <div className="space-y-1">
                        <label className="font-bold text-foreground">Maximum Discount Cap (₹) (Optional)</label>
                        <input
                          type="number"
                          value={maxDiscount}
                          onChange={(e) => setMaxDiscount(e.target.value)}
                          placeholder="e.g. 1000 (Maximum discount amount)"
                          className="w-full px-3 py-2 rounded-xl bg-surface border border-border-theme text-foreground font-mono focus:outline-none focus:border-accent"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  /* Tiered Volume Discount Builder */
                  <div className="p-4 rounded-2xl bg-background border border-border-theme space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-foreground">Volume Discount Tiers</label>
                      <button
                        type="button"
                        onClick={handleAddTier}
                        className="px-2.5 py-1 rounded-lg bg-accent text-accent-content font-bold text-[10px] cursor-pointer hover:opacity-90"
                      >
                        + Add Tier
                      </button>
                    </div>

                    <div className="space-y-2">
                      {tiers.map((tier, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-surface p-2.5 rounded-xl border border-border-theme">
                          <div className="w-24">
                            <span className="text-[10px] text-foreground/40 block">Min Qty</span>
                            <input
                              type="number"
                              min="1"
                              value={tier.minQuantity}
                              onChange={(e) => handleTierChange(idx, "minQuantity", e.target.value)}
                              className="w-full px-2 py-1 rounded-lg bg-background border border-border-theme font-mono text-xs text-foreground"
                            />
                          </div>
                          <div className="w-28">
                            <span className="text-[10px] text-foreground/40 block">Type</span>
                            <select
                              value={tier.discountType}
                              onChange={(e) => handleTierChange(idx, "discountType", e.target.value)}
                              className="w-full px-2 py-1 rounded-lg bg-background border border-border-theme text-xs font-bold text-foreground"
                            >
                              <option value="percentage">%</option>
                              <option value="flat">₹</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <span className="text-[10px] text-foreground/40 block">Value</span>
                            <input
                              type="number"
                              min="1"
                              value={tier.discountValue}
                              onChange={(e) => handleTierChange(idx, "discountValue", e.target.value)}
                              className="w-full px-2 py-1 rounded-lg bg-background border border-border-theme font-mono text-xs text-foreground"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveTier(idx)}
                            className="mt-3.5 text-foreground/40 hover:text-red-500 p-1 cursor-pointer"
                          >
                            <i className="ri-delete-bin-line text-sm" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Min Purchase & Usage Limits */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-foreground">Min Purchase (₹)</label>
                    <input
                      type="number"
                      value={minPurchase}
                      onChange={(e) => setMinPurchase(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border-theme font-mono text-foreground focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-foreground">Total Usage Limit</label>
                    <input
                      type="number"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                      placeholder="Unlimited"
                      min="1"
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border-theme font-mono text-foreground focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-foreground">Per User Limit</label>
                    <input
                      type="number"
                      value={perUserLimit}
                      onChange={(e) => setPerUserLimit(e.target.value)}
                      placeholder="1"
                      min="1"
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border-theme font-mono text-foreground focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                {/* Validity Window Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-foreground">Start Date *</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border-theme text-foreground font-mono focus:outline-none focus:border-accent cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-foreground">End Date *</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border-theme text-foreground font-mono focus:outline-none focus:border-accent cursor-pointer"
                    />
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveCoupon"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-accent cursor-pointer"
                  />
                  <label htmlFor="isActiveCoupon" className="font-bold text-foreground cursor-pointer">
                    Enable and activate coupon immediately
                  </label>
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-theme">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl bg-background border border-border-theme font-bold text-foreground/70 hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-2xl bg-accent text-accent-content font-black uppercase tracking-wider shadow-lg hover:opacity-90 active:scale-95 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <i className="ri-loader-4-line animate-spin" />
                    ) : (
                      <i className="ri-check-line" />
                    )}
                    <span>{submitting ? "Saving..." : editingId ? "Update Coupon" : "Create Coupon"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCouponsPage;
