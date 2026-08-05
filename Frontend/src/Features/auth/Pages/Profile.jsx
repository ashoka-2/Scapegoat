import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Hooks/useAuth";
import { addToast } from "../../../utils/toast.slice";
import Modal from "../../../Components/Modal";
import PasswordRequirementChecker, {
  isPasswordValid,
} from "../components/PasswordRequirementChecker";

const inputClass =
  "w-full bg-background border border-border-theme focus:border-accent rounded-xl px-4 py-3 text-foreground outline-none transition-all duration-300 focus:ring-4 focus:ring-accent/10 text-sm";

const RequiredLabel = ({ children, locked = false }) => (
  <label className="text-xs font-semibold text-foreground/80 mb-1.5 flex items-center justify-between">
    <span className="flex items-center gap-1">
      {children}
      {!locked && <span className="text-red-500 font-bold">*</span>}
    </span>
    {locked && (
      <span className="text-[10px] text-foreground/40 font-normal flex items-center gap-1">
        <i className="ri-lock-line text-xs" /> Locked for security
      </span>
    )}
  </label>
);

const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "Japan", "Singapore", "UAE", "Other"
];

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSelector((state) => state.auth);
  const { handleLogout, handleUpdateProfile, handleChangePassword, handleBecomeSeller } = useAuth();

  const avatarInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

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

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passData, setPassData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Sell on Scapegoat modal states
  const [showSellerWarningModal, setShowSellerWarningModal] = useState(false);
  const [showSellerSuccessModal, setShowSellerSuccessModal] = useState(false);
  const [upgradingSeller, setUpgradingSeller] = useState(false);

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
    }
  }, [user]);

  if (authLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const roleLabel =
    user?.role === "admin"
      ? "Administrator"
      : user?.role === "seller"
      ? "Verified Seller Partner"
      : "Member Account";

  // Handle avatar image selection
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
      dispatch(addToast({ message: "New password must meet all requirements.", type: "error" }));
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
      setShowPasswordModal(false);
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

  const currentAvatar = avatarPreview || user?.profilePic;

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8 selection:bg-accent selection:text-accent-content font-sans">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ── User Header Card ── */}
        <div className="bg-surface border border-border-theme/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center space-x-5 relative z-10">
            {/* Clickable Avatar */}
            <div className="relative group shrink-0">
              <div
                className="w-20 h-20 rounded-full border-4 border-accent/20 overflow-hidden bg-background flex items-center justify-center font-black text-3xl text-accent shadow-lg cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}
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
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}
              >
                <i className="ri-camera-fill text-white text-lg" />
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                {user?.fullname || user?.username}
              </h1>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
                  {roleLabel}
                </span>
              </div>
              <p className="text-xs text-foreground/60">{user?.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end relative z-10">
            {avatarPreview && (
              <button
                type="button"
                onClick={() => setAvatarPreview(null)}
                className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-extrabold transition cursor-pointer"
              >
                Discard Photo
              </button>
            )}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-camera-line" /> Change Photo
            </button>
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2.5 rounded-xl bg-background border border-border-theme hover:border-accent text-foreground text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-lock-line" /> Password
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-logout-box-line" /> Log Out
            </button>
          </div>
        </div>

        {/* ── Quick Action Command Bar ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Manage My Orders */}
          <button
            type="button"
            onClick={() => navigate(user?.role === "seller" ? "/seller/orders" : "/orders/my-orders")}
            className="p-4 bg-surface border border-border-theme/80 hover:border-accent rounded-2xl flex flex-col items-center justify-center text-center space-y-2 group transition shadow-sm cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
              <i className="ri-receipt-line text-lg" />
            </div>
            <span className="text-xs font-bold text-foreground group-hover:text-accent transition">
              Manage Orders
            </span>
          </button>

          {/* View Wishlist */}
          <button
            type="button"
            onClick={() => navigate("/wishlist")}
            className="p-4 bg-surface border border-border-theme/80 hover:border-accent rounded-2xl flex flex-col items-center justify-center text-center space-y-2 group transition shadow-sm cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
              <i className="ri-heart-3-line text-lg" />
            </div>
            <span className="text-xs font-bold text-foreground group-hover:text-accent transition">
              View Wishlist
            </span>
          </button>

          {/* Seller Panel or Sell on Scapegoat */}
          {user?.role === "seller" ? (
            <button
              type="button"
              onClick={() => navigate("/seller/dashboard")}
              className="p-4 bg-accent/10 border border-accent/30 hover:border-accent rounded-2xl flex flex-col items-center justify-center text-center space-y-2 group transition shadow-sm cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-accent text-accent-content flex items-center justify-center group-hover:scale-110 transition-transform">
                <i className="ri-store-3-line text-lg" />
              </div>
              <span className="text-xs font-black text-accent group-hover:underline transition">
                Seller Dashboard
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowSellerWarningModal(true)}
              className="p-4 bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 group transition shadow-sm cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <i className="ri-rocket-line text-lg" />
              </div>
              <span className="text-xs font-black text-emerald-500 group-hover:underline transition">
                Sell on ScapeGoat
              </span>
            </button>
          )}

          {/* Help Center */}
          <button
            type="button"
            onClick={() => navigate("/contact")}
            className="p-4 bg-surface border border-border-theme/80 hover:border-accent rounded-2xl flex flex-col items-center justify-center text-center space-y-2 group transition shadow-sm cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
              <i className="ri-customer-service-2-line text-lg" />
            </div>
            <span className="text-xs font-bold text-foreground group-hover:text-accent transition">
              Help Center
            </span>
          </button>
        </div>

        {/* ── Personal Information & Address Form ── */}
        <form
          onSubmit={handleUpdateSubmit}
          className="bg-surface border border-border-theme/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-border-theme/50 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-foreground">Personal Information</h2>
              <p className="text-xs text-foreground/60 flex items-center gap-1 mt-0.5">
                <span className="text-red-500 font-bold">*</span> Required fields
              </p>
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-accent text-accent-content font-extrabold text-xs shadow-md hover:opacity-90 transition cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-save-line" /> Save Changes
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                className={`${inputClass} opacity-50 bg-background/40 cursor-not-allowed`}
              />
            </div>
          </div>

          {/* Default Shipping Address */}
          <div className="pt-6 border-t border-border-theme/50 space-y-4">
            <div className="flex items-center gap-2">
              <i className="ri-map-pin-2-fill text-accent text-base" />
              <h3 className="text-sm font-extrabold text-foreground">Default Shipping Address</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <RequiredLabel>Street / Flat / House No.</RequiredLabel>
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
        </form>

        {/* ── My Reviews Section ── */}
        <div className="bg-surface border border-border-theme/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border-theme/50 pb-3">
            <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <i className="ri-star-smile-line text-accent" /> My Product Reviews
            </h2>
            <span className="text-xs font-bold text-foreground/50">0 Published Reviews</span>
          </div>

          <div className="p-8 text-center bg-background/40 border border-dashed border-border-theme rounded-2xl space-y-2">
            <i className="ri-chat-check-line text-4xl text-foreground/30" />
            <p className="text-xs font-bold text-foreground/70">No reviews published yet</p>
            <p className="text-[11px] text-foreground/40 max-w-sm mx-auto">
              Reviews you post after purchasing products will appear here.
            </p>
          </div>
        </div>
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

      {/* ── Change Password Modal ── */}
      {showPasswordModal && (
        <Modal
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false);
            setPassData({ currentPassword: "", newPassword: "", confirmPassword: "" });
          }}
          title="Change Password"
        >
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <p className="text-[10px] text-foreground/50 flex items-center gap-1">
              <span className="text-red-500 font-bold">*</span> All fields required
            </p>

            <div>
              <label className="text-xs font-semibold text-foreground/80 mb-1.5 flex items-center gap-1 block">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? "text" : "password"}
                  required
                  value={passData.currentPassword}
                  onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                  className={`${inputClass} pr-10`}
                  placeholder="Your current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-accent text-sm"
                >
                  <i className={showCurrentPass ? "ri-eye-off-line" : "ri-eye-line"} />
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/80 mb-1.5 flex items-center gap-1 block">
                New Password <span className="text-red-500">*</span>
              </label>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-accent text-sm"
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
              <label className="text-xs font-semibold text-foreground/80 mb-1.5 flex items-center gap-1 block">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-accent text-sm"
                >
                  <i className={showConfirmPass ? "ri-eye-off-line" : "ri-eye-line"} />
                </button>
              </div>
              {passData.confirmPassword && passData.newPassword !== passData.confirmPassword && (
                <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                  <i className="ri-close-circle-fill" /> Passwords do not match
                </p>
              )}
              {passData.confirmPassword && passData.newPassword === passData.confirmPassword && (
                <p className="text-[11px] text-emerald-500 mt-1 flex items-center gap-1">
                  <i className="ri-checkbox-circle-fill" /> Passwords match
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                }}
                className="px-4 py-2 rounded-xl bg-surface border border-border-theme text-xs font-bold text-foreground cursor-pointer hover:border-accent transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-accent text-accent-content text-xs font-extrabold cursor-pointer hover:opacity-90 transition"
              >
                Update Password
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Profile;
