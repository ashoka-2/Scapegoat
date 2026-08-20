import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../Hooks/useAuth";
import { addToast } from "../../../utils/toast.slice";
import Modal from "../../../Components/Modal";
import PasswordRequirementChecker, {
  isPasswordValid,
} from "../components/PasswordRequirementChecker";
import * as reviewApi from "../../Reviews/Services/review.api";

import ProfileSkeleton from "../components/Skeletons/ProfileSkeleton";

const inputClass =
  "w-full bg-background border border-border-theme focus:border-accent rounded-xl px-4 py-3 text-foreground outline-none transition-all duration-200 focus:ring-2 focus:ring-accent/20 text-sm";

const RequiredLabel = ({ children, locked = false }) => (
  <label className="text-xs font-semibold text-foreground/80 mb-1.5 flex items-center justify-between">
    <span className="flex items-center gap-1">
      {children}
      {!locked && <span className="text-accent font-bold">*</span>}
    </span>
    {locked && (
      <span className="text-[10px] text-foreground/40 font-normal flex items-center gap-1">
        <i className="ri-lock-line text-xs" /> Locked
      </span>
    )}
  </label>
);

const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "Japan", "Singapore", "UAE", "Other"
];

const TABS = [
  { id: "personal", label: "Personal Info", icon: "ri-user-3-line" },
  { id: "actions", label: "Quick Actions", icon: "ri-apps-2-line" },
  { id: "reviews", label: "My Reviews", icon: "ri-star-line" },
  { id: "security", label: "Security", icon: "ri-shield-keyhole-line" },
];

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSelector((state) => state.auth);
  const { myOrders } = useSelector((state) => state.orders || { myOrders: [] });
  const { wishlist } = useSelector((state) => state.wishlist || { wishlist: { products: [] } });
  const { handleLogout, handleUpdateProfile, handleChangePassword, handleBecomeSeller } = useAuth();

  const avatarInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    contact: "",
    street: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
  });

  const [passData, setPassData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // User reviews state
  const [userReviews, setUserReviews] = useState([]);
  const [loadingUserReviews, setLoadingUserReviews] = useState(false);

  // Sell on Scapegoat modal states
  const [showSellerWarningModal, setShowSellerWarningModal] = useState(false);
  const [showSellerSuccessModal, setShowSellerSuccessModal] = useState(false);
  const [upgradingSeller, setUpgradingSeller] = useState(false);

  const loadUserReviews = async () => {
    setLoadingUserReviews(true);
    try {
      const data = await reviewApi.fetchUserReviewsApi();
      setUserReviews(data.reviews || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUserReviews(false);
    }
  };

  useEffect(() => {
    if (user) {
      const defaultAddr = user.addresses?.find((a) => a.isDefault) || user.addresses?.[0] || {};
      setFormData({
        fullname: user.fullname || user.username || "",
        email: user.email || "",
        contact: user.contact || "",
        street: defaultAddr.street || "",
        city: defaultAddr.city || "",
        state: defaultAddr.state || "",
        country: defaultAddr.country || "India",
        pincode: defaultAddr.pincode || "",
      });
      loadUserReviews();
    }
  }, [user]);

  if (authLoading && !user) {
    return <ProfileSkeleton />;
  }

  const roleLabel =
    user?.role === "admin"
      ? "Administrator"
      : user?.role === "seller"
      ? "Verified Seller Partner"
      : "Member Account";

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      dispatch(addToast({ message: "Please upload a valid image file.", type: "error" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      dispatch(addToast({ message: "Image must be under 5MB.", type: "error" }));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      fullname: formData.fullname,
      contact: formData.contact,
      address: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        country: formData.country || "India",
        pincode: formData.pincode,
        isDefault: true,
      },
    };
    if (avatarPreview) {
      payload.profilePic = avatarPreview;
    }
    await handleUpdateProfile(payload);
    setAvatarPreview(null);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid(passData.newPassword)) {
      dispatch(addToast({ message: "New password must meet security rules.", type: "error" }));
      return;
    }
    if (passData.newPassword !== passData.confirmPassword) {
      dispatch(addToast({ message: "New password and confirm password do not match!", type: "error" }));
      return;
    }
    const res = await handleChangePassword({
      currentPassword: passData.currentPassword,
      newPassword: passData.newPassword,
    });
    if (res?.success !== false) {
      setPassData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }
  };

  const handleConfirmBecomeSeller = async () => {
    setUpgradingSeller(true);
    try {
      await handleBecomeSeller();
      setShowSellerWarningModal(false);
      setShowSellerSuccessModal(true);
    } catch (e) {
      console.error(e);
    } finally {
      setUpgradingSeller(false);
    }
  };

  const handleDeleteUserReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await reviewApi.deleteReviewApi(reviewId);
      dispatch(addToast({ message: "Review deleted successfully.", type: "success" }));
      loadUserReviews();
    } catch (e) {
      dispatch(addToast({ message: "Failed to delete review.", type: "error" }));
    }
  };

  const currentAvatar = avatarPreview || user?.profilePic;
  const ordersCount = myOrders?.length || 0;
  const wishlistCount = wishlist?.products?.length || 0;

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-accent selection:text-accent-content">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Header Section ── */}
        <div className="bg-surface border border-border-theme/80 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div
                onClick={() => avatarInputRef.current?.click()}
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border-2 border-border-theme overflow-hidden bg-background flex items-center justify-center font-bold text-2xl text-accent shadow-sm cursor-pointer group-hover:border-accent transition-colors"
              >
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt={user?.fullname || "Avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{(user?.fullname || user?.username || "U")[0].toUpperCase()}</span>
                )}
              </div>

              <div
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[11px] font-semibold gap-0.5"
              >
                <i className="ri-camera-line text-lg" />
                <span>Change</span>
              </div>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* User Meta */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                  {user?.fullname || user?.username}
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20">
                  {roleLabel}
                </span>
              </div>

              <p className="text-xs text-foreground/60">{user?.email}</p>

              {/* Minimal Stats */}
              <div className="flex items-center gap-3 pt-1 text-xs text-foreground/70 justify-center sm:justify-start">
                <span><strong className="text-foreground">{ordersCount}</strong> Orders</span>
                <span className="text-foreground/30">•</span>
                <span><strong className="text-foreground">{wishlistCount}</strong> Wishlist</span>
                <span className="text-foreground/30">•</span>
                <span><strong className="text-foreground">{userReviews.length}</strong> Reviews</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
            {avatarPreview && (
              <button
                type="button"
                onClick={() => setAvatarPreview(null)}
                className="px-3.5 py-2 rounded-xl bg-background border border-border-theme text-foreground/80 hover:text-foreground text-xs font-semibold transition cursor-pointer"
              >
                Discard
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-logout-box-r-line" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* ── Minimalist Clean Tab Bar ── */}
        <div className="flex items-center gap-1.5 bg-surface border border-border-theme/80 p-1.5 rounded-2xl overflow-x-auto scrollbar-none shadow-sm relative">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap z-10 ${
                  isActive
                    ? "text-accent-content"
                    : "text-foreground/70 hover:text-foreground hover:bg-background/40"
                }`}
              >
                <i className={`${tab.icon} text-sm relative z-10`} />
                <span className="relative z-10">{tab.label}</span>
                {tab.id === "reviews" && userReviews.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black relative z-10 ${
                    isActive ? "bg-accent-content text-accent" : "bg-accent/15 text-accent"
                  }`}>
                    {userReviews.length}
                  </span>
                )}

                {/* Smooth Spring Bubble Background */}
                {isActive && (
                  <motion.div
                    layoutId="activeProfileTabBubble"
                    className="absolute inset-0 bg-accent rounded-xl shadow-md shadow-accent/25 z-0"
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 35,
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* ── Smooth Animated Tab Views ── */}
        <AnimatePresence mode="wait">
          {/* TAB 1: Personal Info & Address */}
          {activeTab === "personal" && (
            <motion.form
              key="personal"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleUpdateSubmit}
              className="bg-surface border border-border-theme/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-border-theme/50 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-foreground">Personal Details</h2>
                  <p className="text-xs text-foreground/50">Manage your name, phone, and default delivery address</p>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-accent text-accent-content font-bold text-xs shadow hover:opacity-90 transition cursor-pointer flex items-center gap-1.5"
                >
                  <i className="ri-save-line text-sm" />
                  <span>Save Changes</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <RequiredLabel>Full Name / Username</RequiredLabel>
                  <input
                    type="text"
                    required
                    value={formData.fullname}
                    onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                    className={inputClass}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <RequiredLabel>Phone Number</RequiredLabel>
                  <input
                    type="tel"
                    required
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className={inputClass}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="sm:col-span-2">
                  <RequiredLabel locked>Email Address</RequiredLabel>
                  <input
                    type="email"
                    value={formData.email}
                    readOnly
                    disabled
                    className={`${inputClass} opacity-50 bg-background/50 cursor-not-allowed`}
                  />
                </div>
              </div>

              {/* Shipping Address */}
              <div className="pt-6 border-t border-border-theme/50 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/70 flex items-center gap-1.5">
                  <i className="ri-map-pin-line text-accent" /> Default Shipping Address
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <RequiredLabel>Street / House No.</RequiredLabel>
                    <input
                      type="text"
                      required
                      placeholder="123 Main St, Apartment 4B"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <RequiredLabel>City</RequiredLabel>
                    <input
                      type="text"
                      required
                      placeholder="Mumbai"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <RequiredLabel>State / Province</RequiredLabel>
                    <input
                      type="text"
                      required
                      placeholder="Maharashtra"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <RequiredLabel>Country</RequiredLabel>
                    <select
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className={inputClass}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <RequiredLabel>Pincode / ZIP Code</RequiredLabel>
                    <input
                      type="text"
                      required
                      placeholder="400001"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </motion.form>
          )}

          {/* TAB 2: Quick Actions */}
          {activeTab === "actions" && (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {/* Manage Orders */}
              <div
                onClick={() => navigate(user?.role === "seller" ? "/my-orders" : "/my-orders")}
                className="bg-surface border border-border-theme/80 hover:border-accent rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all shadow-sm group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                    <i className="ri-receipt-line" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-accent transition">
                      Manage Orders
                    </h3>
                    <p className="text-xs text-foreground/50">Track & view purchase history</p>
                  </div>
                </div>
                <i className="ri-arrow-right-s-line text-lg text-foreground/40 group-hover:text-accent group-hover:translate-x-1 transition-transform" />
              </div>

              {/* View Wishlist */}
              <div
                onClick={() => navigate("/wishlist")}
                className="bg-surface border border-border-theme/80 hover:border-accent rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all shadow-sm group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                    <i className="ri-heart-line" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-accent transition">
                      View Wishlist
                    </h3>
                    <p className="text-xs text-foreground/50">{wishlistCount} saved products</p>
                  </div>
                </div>
                <i className="ri-arrow-right-s-line text-lg text-foreground/40 group-hover:text-accent group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Seller Dashboard or Sell on Scapegoat */}
              {user?.role === "seller" ? (
                <div
                  onClick={() => navigate("/seller/dashboard")}
                  className="bg-surface border border-accent/40 hover:border-accent rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent text-accent-content flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                      <i className="ri-store-3-line" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-accent">
                        Seller Dashboard
                      </h3>
                      <p className="text-xs text-foreground/50">Manage inventory & orders</p>
                    </div>
                  </div>
                  <i className="ri-arrow-right-s-line text-lg text-accent group-hover:translate-x-1 transition-transform" />
                </div>
              ) : (
                <div
                  onClick={() => setShowSellerWarningModal(true)}
                  className="bg-surface border border-emerald-500/40 hover:border-emerald-500 rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                      <i className="ri-rocket-line" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-emerald-500">
                        Sell on ScapeGoat
                      </h3>
                      <p className="text-xs text-foreground/50">Upgrade account to seller partner</p>
                    </div>
                  </div>
                  <i className="ri-arrow-right-s-line text-lg text-emerald-500 group-hover:translate-x-1 transition-transform" />
                </div>
              )}

              {/* Help Center */}
              <div
                onClick={() => navigate("/contact")}
                className="bg-surface border border-border-theme/80 hover:border-accent rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all shadow-sm group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                    <i className="ri-customer-service-2-line" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-accent transition">
                      Help Center
                    </h3>
                    <p className="text-xs text-foreground/50">24/7 Customer support</p>
                  </div>
                </div>
                <i className="ri-arrow-right-s-line text-lg text-foreground/40 group-hover:text-accent group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          )}

          {/* TAB 3: My Published Reviews */}
          {activeTab === "reviews" && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-surface border border-border-theme/80 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-border-theme/50 pb-3">
                <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <i className="ri-star-line text-accent" /> My Published Reviews
                </h2>
                <span className="text-xs font-semibold text-foreground/50">{userReviews.length} Reviews</span>
              </div>

              {loadingUserReviews ? (
                <div className="p-8 text-center text-xs font-bold text-foreground/50 animate-pulse">
                  Loading your product reviews...
                </div>
              ) : userReviews.length === 0 ? (
                <div className="p-8 text-center bg-background/50 border border-dashed border-border-theme rounded-xl space-y-2">
                  <i className="ri-chat-smile-2-line text-4xl text-foreground/30" />
                  <p className="text-xs font-semibold text-foreground/70">No reviews published yet</p>
                  <p className="text-[11px] text-foreground/40 max-w-sm mx-auto">
                    Reviews you post on purchased products will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userReviews.map((rev) => {
                    const prod = rev.product || {};
                    const imgUrl = prod.images?.[0]?.url || prod.images?.[0] || "https://via.placeholder.com/150";

                    return (
                      <div
                        key={rev._id}
                        className="p-4 bg-background/50 border border-border-theme/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
                      >
                        <div
                          onClick={() => prod._id && navigate(`/product/${prod._id}`)}
                          className="flex items-center gap-3 cursor-pointer group min-w-0"
                        >
                          <img src={imgUrl} alt={prod.title} className="w-12 h-14 object-cover rounded-lg border border-border-theme shrink-0 group-hover:border-accent transition" />
                          <div className="min-w-0 space-y-0.5">
                            <p className="font-bold text-foreground group-hover:text-accent transition truncate max-w-xs">{prod.title || "Product"}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex text-amber-400 text-xs">
                                {Array.from({ length: rev.rating }).map((_, i) => (
                                  <i key={i} className="ri-star-fill" />
                                ))}
                              </div>
                              <span className="font-semibold text-foreground truncate">{rev.title}</span>
                            </div>
                            <p className="text-[11px] text-foreground/60 line-clamp-1">{rev.comment}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteUserReview(rev._id)}
                          className="px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold transition cursor-pointer shrink-0 self-end sm:self-center"
                        >
                          Delete
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: Security */}
          {activeTab === "security" && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-surface border border-border-theme/80 rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm max-w-xl mx-auto"
            >
              <div className="border-b border-border-theme/50 pb-3">
                <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <i className="ri-shield-keyhole-line text-accent" /> Security & Password
                </h2>
                <p className="text-xs text-foreground/50">Update your account login password</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <RequiredLabel>Current Password</RequiredLabel>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? "text" : "password"}
                      required
                      value={passData.currentPassword}
                      onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                      className={`${inputClass} pr-10`}
                      placeholder="Current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-accent text-sm cursor-pointer"
                    >
                      <i className={showCurrentPass ? "ri-eye-off-line" : "ri-eye-line"} />
                    </button>
                  </div>
                </div>

                <div>
                  <RequiredLabel>New Password</RequiredLabel>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      required
                      value={passData.newPassword}
                      onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                      onFocus={() => setPasswordFocused(true)}
                      className={`${inputClass} pr-10`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-accent text-sm cursor-pointer"
                    >
                      <i className={showNewPass ? "ri-eye-off-line" : "ri-eye-line"} />
                    </button>
                  </div>
                  <PasswordRequirementChecker
                    password={passData.newPassword}
                    isFocused={passwordFocused || Boolean(passData.newPassword)}
                  />
                </div>

                <div>
                  <RequiredLabel>Confirm New Password</RequiredLabel>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      required
                      value={passData.confirmPassword}
                      onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                      className={`${inputClass} pr-10 ${
                        passData.confirmPassword && passData.newPassword !== passData.confirmPassword
                          ? "border-red-500/50 focus:border-red-500"
                          : passData.confirmPassword && passData.newPassword === passData.confirmPassword
                          ? "border-emerald-500/50 focus:border-emerald-500"
                          : ""
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-accent text-sm cursor-pointer"
                    >
                      <i className={showConfirmPass ? "ri-eye-off-line" : "ri-eye-line"} />
                    </button>
                  </div>
                  {passData.confirmPassword && passData.newPassword !== passData.confirmPassword && (
                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-semibold">
                      <i className="ri-close-circle-fill" /> Passwords do not match
                    </p>
                  )}
                  {passData.confirmPassword && passData.newPassword === passData.confirmPassword && (
                    <p className="text-[11px] text-emerald-500 mt-1 flex items-center gap-1 font-semibold">
                      <i className="ri-checkbox-circle-fill" /> Passwords match
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-accent text-accent-content font-bold text-xs shadow hover:opacity-90 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="ri-lock-password-line text-sm" />
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Sell on Scapegoat Warning Modal ── */}
      {showSellerWarningModal && (
        <Modal
          isOpen={showSellerWarningModal}
          onClose={() => setShowSellerWarningModal(false)}
          title="Become a ScapeGoat Seller Partner"
          showFooterActions={false}
        >
          <div className="space-y-6 text-sm font-sans">
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2 text-amber-500">
              <div className="flex items-center gap-2 font-black text-base uppercase">
                <i className="ri-error-warning-fill text-xl" />
                <span>Irreversible Account Action</span>
              </div>
              <p className="text-xs leading-relaxed text-foreground/90">
                Upgrading your account to a <strong className="text-amber-500">Seller Partner</strong> is a permanent change. Once upgraded, your account will be granted full access to list products, manage catalog stock, process buyer orders, and view sales analytics.
              </p>
              <p className="text-xs font-bold text-amber-500">
                ⚠️ You cannot revert back to a standard normal buyer account after this upgrade.
              </p>
            </div>

            <div className="space-y-3 bg-background/50 p-4 rounded-2xl border border-border-theme">
              <h3 className="text-xs font-black uppercase text-accent tracking-wider">What you will get:</h3>
              <ul className="space-y-2 text-xs text-foreground/80 font-medium">
                <li className="flex items-center gap-2">
                  <i className="ri-checkbox-circle-fill text-emerald-500" /> Dedicated Seller Dashboard & Real-time Fulfillment Station
                </li>
                <li className="flex items-center gap-2">
                  <i className="ri-checkbox-circle-fill text-emerald-500" /> Product Catalog & Inventory Stock Management
                </li>
                <li className="flex items-center gap-2">
                  <i className="ri-checkbox-circle-fill text-emerald-500" /> Real-time Customer & Cart Analytics
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSellerWarningModal(false)}
                className="px-4 py-2.5 rounded-xl bg-surface border border-border-theme text-xs font-bold text-foreground hover:border-accent transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={upgradingSeller}
                onClick={handleConfirmBecomeSeller}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-lg transition cursor-pointer flex items-center gap-2"
              >
                {upgradingSeller ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Upgrading Account...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-rocket-line" />
                    <span>I Understand, Upgrade Me to Seller!</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Seller Upgrade Success Celebration Modal ── */}
      {showSellerSuccessModal && (
        <Modal
          isOpen={showSellerSuccessModal}
          onClose={() => setShowSellerSuccessModal(false)}
          title="Congratulations!"
          showFooterActions={false}
        >
          <div className="text-center space-y-5 p-4 font-sans">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center text-4xl animate-bounce">
              <i className="ri-verified-badge-fill" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase text-foreground">Welcome, Seller Partner!</h2>
              <p className="text-xs text-foreground/70 max-w-md mx-auto">
                Your account has been successfully upgraded to a verified ScapeGoat Seller. You can now start listing products and growing your brand!
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowSellerSuccessModal(false);
                navigate("/seller/dashboard");
              }}
              className="px-8 py-3 bg-accent text-accent-content font-black text-xs uppercase tracking-wider rounded-full shadow-xl hover:opacity-90 transition cursor-pointer"
            >
              Open Seller Dashboard 🚀
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Profile;
