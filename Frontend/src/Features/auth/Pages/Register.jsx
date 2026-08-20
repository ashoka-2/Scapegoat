import React, { useState } from "react";
import { useAuth } from "../Hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import ContinueWithGoogle from "../components/ContinueWithGoogle.jsx";
import { PrimaryBtn, SecondaryBtn } from "../../../Shared/Buttons.jsx";
import PasswordRequirementChecker, {
  isPasswordValid,
} from "../components/PasswordRequirementChecker.jsx";
import { addToast } from "../../../utils/toast.slice.js";

const appName = "ScapeGoat";

const Register = () => {
  const { handleRegister } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  // 2-Step Form Wizard State: step 1 = Profile & Contact, step 2 = Password & Role
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    fullName: "",
    contactNumber: "",
    email: "",
    password: "",
    isSeller: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "contactNumber") {
      const cleaned = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        [name]: cleaned,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      dispatch(addToast({ message: "Please enter your full name.", type: "error" }));
      return;
    }
    if (formData.contactNumber.length !== 10) {
      dispatch(addToast({ message: "Please enter a valid 10-digit mobile number.", type: "error" }));
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      dispatch(addToast({ message: "Please enter a valid email address.", type: "error" }));
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid(formData.password)) {
      dispatch(
        addToast({
          message: "Please meet all password requirements before submitting.",
          type: "error",
        }),
      );
      return;
    }
    try {
      await handleRegister({
        email: formData.email,
        contact: `+91${formData.contactNumber}`,
        password: formData.password,
        isSeller: formData.isSeller,
        fullname: formData.fullName,
      });
      navigate("/login");
    } catch (error) {
      console.error("Registration failed", error);
    }
  };

  return (
    <div className="h-screen w-full bg-background text-foreground font-sans selection:bg-accent selection:text-accent-content flex flex-col lg:flex-row overflow-hidden">
      {/* ── Left Editorial Section ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-neutral-900 text-white flex-col justify-between overflow-hidden border-r border-border-theme/40 p-10 xl:p-14 select-none">
        {/* Background Editorial Image - 100% Visible & Crisp */}
        <img
          src="/snitch_editorial.png"
          alt={`${appName} Fashion Editorial`}
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        />

        {/* Soft Minimalist Vignette (Keeps image bright and visible) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/35 pointer-events-none" />

        {/* Top Branding Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-black uppercase tracking-[0.2em] text-white hover:text-accent transition group"
          >
            <span className="w-8 h-8 rounded-xl bg-accent text-accent-content flex items-center justify-center font-black text-xs shadow-lg shadow-accent/30 group-hover:rotate-6 transition-transform">
              SG
            </span>
            <span className="drop-shadow-md">{appName}</span>
          </Link>

          <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white shadow-sm">
            Join the Movement
          </span>
        </div>

        {/* Bottom Hero Card in Frosted Glass */}
        <div className="relative z-10 p-6 rounded-3xl bg-black/40 backdrop-blur-md border border-white/15 shadow-2xl space-y-4 max-w-lg">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent block mb-1">
              New Member Registration
            </span>
            <h2 className="text-3xl xl:text-4xl font-black uppercase tracking-tight text-white leading-tight">
              Define your <span className="text-accent">aesthetic.</span>
            </h2>
            <p className="text-white/80 text-xs mt-1.5 font-medium leading-relaxed">
              Join thousands of creators, collectors, and verified designer brands shaping modern luxury streetwear.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/10">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
              <div className="flex items-center gap-1.5 text-accent">
                <i className="ri-flashlight-line text-xs" />
                <span className="text-[10px] font-black uppercase tracking-wider">Priority Access</span>
              </div>
              <p className="text-[9px] text-white/60">Early access to limited drops.</p>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <i className="ri-store-2-line text-xs" />
                <span className="text-[10px] font-black uppercase tracking-wider">Seller Portal</span>
              </div>
              <p className="text-[9px] text-white/60">List & sell designer fashion.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Form Section (Compact 2-Step Wizard, Zero Vertical Scroll) ── */}
      <div className="w-full lg:w-1/2 h-full flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 overflow-y-auto scrollbar-hide bg-background">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between pb-4 border-b border-border-theme/40">
          <Link to="/" className="text-base font-black tracking-widest text-accent uppercase">
            {appName}
          </Link>
          <Link to="/login" className="text-xs font-bold text-foreground/60 hover:text-accent">
            Already Member? Sign In
          </Link>
        </div>

        {/* Centered Form Wrapper */}
        <div className="w-full max-w-md mx-auto my-auto space-y-5">
          {/* Header & Step Wizard Indicator */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">
                  Create Account
                </span>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
                  {step === 1 ? "Personal Identity" : "Security & Account"}
                </h1>
              </div>

              {/* Step indicator pill */}
              <div className="flex items-center gap-1.5 bg-surface border border-border-theme px-3 py-1 rounded-full text-xs font-mono font-black">
                <span className={step === 1 ? "text-accent" : "text-foreground/40"}>01</span>
                <span className="text-foreground/30">/</span>
                <span className={step === 2 ? "text-accent" : "text-foreground/40"}>02</span>
              </div>
            </div>

            {/* Step Progress Line */}
            <div className="w-full h-1 bg-border-theme rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent"
                initial={{ width: "50%" }}
                animate={{ width: step === 1 ? "50%" : "100%" }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* ── STEP 1: IDENTITY & CONTACT ── */}
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleNextStep}
                className="space-y-4"
              >
                {/* Full Name Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground/80 flex items-center justify-between">
                    <span>Full Name</span>
                    <span className="text-accent text-[10px]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <i className="ri-user-smile-line absolute left-3.5 text-foreground/40 text-sm pointer-events-none" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Alex Rivera"
                      className="w-full bg-surface border border-border-theme focus:border-accent rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-foreground outline-none transition focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>

                {/* Mobile Contact Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground/80 flex items-center justify-between">
                    <span>Mobile Contact</span>
                    <span className="text-foreground/40 font-mono text-[10px]">10 Digits</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-3 py-2.5 rounded-2xl bg-surface border border-border-theme text-xs font-bold text-foreground shrink-0 select-none">
                      <span>🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      required
                      placeholder="9876543210"
                      className="w-full bg-surface border border-border-theme focus:border-accent rounded-2xl px-4 py-2.5 text-xs font-mono font-semibold text-foreground outline-none transition focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground/80 flex items-center justify-between">
                    <span>Email Address</span>
                    <span className="text-accent text-[10px]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <i className="ri-mail-line absolute left-3.5 text-foreground/40 text-sm pointer-events-none" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="alex@example.com"
                      className="w-full bg-surface border border-border-theme focus:border-accent rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-foreground outline-none transition focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>

                {/* Next Step CTA */}
                <PrimaryBtn
                  type="submit"
                  fullWidth
                  size="lg"
                  className="mt-4 flex items-center justify-center gap-2"
                >
                  <span>Continue to Security</span>
                  <i className="ri-arrow-right-line" />
                </PrimaryBtn>

                <div className="relative my-3 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border-theme/60" />
                  </div>
                  <span className="relative bg-background px-3 text-[10px] font-bold uppercase text-foreground/40 tracking-wider">
                    Or Sign Up With
                  </span>
                </div>

                <ContinueWithGoogle />
              </motion.form>
            )}

            {/* ── STEP 2: PASSWORD & ROLE ── */}
            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Password Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground/80 flex items-center justify-between">
                    <span>Set Password</span>
                    <span className="text-accent text-[10px]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <i className="ri-lock-password-line absolute left-3.5 text-foreground/40 text-sm pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      required
                      disabled={loading}
                      placeholder="Enter strong password"
                      className="w-full bg-surface border border-border-theme focus:border-accent rounded-2xl pl-10 pr-10 py-2.5 text-xs font-semibold text-foreground outline-none transition focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-foreground/40 hover:text-accent transition cursor-pointer"
                      tabIndex={-1}
                    >
                      <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"} />
                    </button>
                  </div>

                  {/* Password Requirement Checker */}
                  <PasswordRequirementChecker
                    password={formData.password}
                    isFocused={passwordFocused || Boolean(formData.password)}
                  />
                </div>

                {/* Seller Option Box */}
                <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-surface border border-border-theme hover:border-accent/40 transition cursor-pointer group">
                  <input
                    type="checkbox"
                    name="isSeller"
                    id="isSeller"
                    checked={formData.isSeller}
                    onChange={handleChange}
                    disabled={loading}
                    className="mt-0.5 w-4 h-4 rounded border-border-theme text-accent focus:ring-accent cursor-pointer"
                  />
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-foreground group-hover:text-accent transition">
                      Register as Merchant / Seller
                    </p>
                    <p className="text-[11px] text-foreground/50">
                      Enable merchant store dashboard to list and sell designer apparel.
                    </p>
                  </div>
                </label>

                {/* Action Buttons: Back + Submit */}
                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 rounded-2xl bg-surface border border-border-theme hover:bg-background text-xs font-bold text-foreground transition cursor-pointer flex items-center gap-1"
                  >
                    <i className="ri-arrow-left-line" />
                    <span>Back</span>
                  </button>

                  <PrimaryBtn
                    type="submit"
                    loading={loading}
                    fullWidth
                    size="lg"
                    className="flex-1"
                  >
                    {loading ? "Creating Account..." : "Complete Sign Up"}
                  </PrimaryBtn>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Switch to Login */}
          <div className="text-center pt-2">
            <p className="text-xs text-foreground/60 font-medium">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-black text-accent hover:underline transition"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-[10px] text-foreground/40 font-mono">
          Protected by ScapeGoat Security & Encryption
        </div>
      </div>
    </div>
  );
};

export default Register;
