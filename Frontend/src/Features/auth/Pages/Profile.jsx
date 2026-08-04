import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Hooks/useAuth";
import { useDispatch } from "react-redux";
import { addToast } from "../../../utils/toast.slice";
import Modal from "../../../Components/Modal";

const inputClass =
  "w-full bg-background border border-border-theme focus:border-accent rounded-xl px-4 py-3 text-foreground outline-none transition-all duration-300 focus:ring-4 focus:ring-accent/10 text-sm";

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSelector((state) => state.auth);
  const { handleLogout, handleUpdateProfile, handleChangePassword } = useAuth();

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    contact: "",
    pincode: "",
    street: "",
    city: "",
    state: "",
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passData, setPassData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    if (user) {
      const defaultAddr = user.addresses?.[0] || {};
      setFormData({
        fullname: user.fullname || user.username || "",
        email: user.email || "",
        contact: user.contact || "",
        pincode: defaultAddr.pincode || "",
        street: defaultAddr.street || "",
        city: defaultAddr.city || "",
        state: defaultAddr.state || "",
      });
    }
  }, [user]);

  if (authLoading) {
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

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    await handleUpdateProfile({
      fullname: formData.fullname,
      contact: formData.contact,
      address: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        country: "India",
      },
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      dispatch(addToast({ message: "New password and confirm password do not match!", type: "error" }));
      return;
    }
    const res = await handleChangePassword({
      currentPassword: passData.currentPassword,
      newPassword: passData.newPassword,
    });
    if (res?.success) {
      setShowPasswordModal(false);
      setPassData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8 selection:bg-accent selection:text-accent-content">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Sleek User Header Card */}
        <div className="bg-surface border border-border-theme/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center space-x-5 relative z-10">
            <div className="w-20 h-20 rounded-full border-4 border-accent/20 overflow-hidden bg-background flex items-center justify-center font-black text-3xl text-accent shadow-lg shrink-0">
              {user?.profilePic ? (
                <img
                  src={user.profilePic}
                  alt={user.fullname || user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{(user?.fullname || user?.username || "U")[0].toUpperCase()}</span>
              )}
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

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end relative z-10">
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2.5 rounded-xl bg-background border border-border-theme hover:border-accent text-foreground text-xs font-extrabold transition cursor-pointer"
            >
              🔒 Password
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-extrabold transition cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Main Personal Information & Address Form */}
        <form onSubmit={handleUpdateSubmit} className="bg-surface border border-border-theme/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border-theme/50 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-foreground">Personal Information & Address</h2>
              <p className="text-xs text-foreground/60">Update your name, contact, and default shipping address.</p>
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-accent text-accent-content font-extrabold text-xs shadow-md hover:opacity-90 transition cursor-pointer"
            >
              Save Profile Changes
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-foreground/80 mb-1.5 block">
                Full Name / Username
              </label>
              <input
                type="text"
                value={formData.fullname}
                onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/80 mb-1.5 block">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-foreground/80 mb-1.5 flex justify-between">
                <span>Email Address</span>
                <span className="text-[10px] text-foreground/40 font-normal">🔒 Locked for security</span>
              </label>
              <input
                type="email"
                value={formData.email}
                readOnly
                disabled
                className={`${inputClass} opacity-50 bg-background/40 cursor-not-allowed`}
              />
            </div>
          </div>

          {/* Shipping Address Section */}
          <div className="pt-6 border-t border-border-theme/50 space-y-4">
            <h3 className="text-sm font-extrabold text-foreground">
              📍 Default Shipping Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-foreground/80 mb-1 block">Street / Flat / House</label>
                <input
                  type="text"
                  placeholder="123 Main St, Apartment 4B"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground/80 mb-1 block">City</label>
                <input
                  type="text"
                  placeholder="Mumbai"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground/80 mb-1 block">Pincode / ZIP</label>
                <input
                  type="text"
                  placeholder="400001"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="🔒 Change Password">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground/80 mb-1 block">Current Password</label>
              <input
                type="password"
                required
                value={passData.currentPassword}
                onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/80 mb-1 block">New Password</label>
              <input
                type="password"
                required
                value={passData.newPassword}
                onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/80 mb-1 block">Confirm New Password</label>
              <input
                type="password"
                required
                value={passData.confirmPassword}
                onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 rounded-xl bg-surface border border-border-theme text-xs font-bold text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-accent text-accent-content text-xs font-extrabold cursor-pointer"
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
