import React, { useState } from "react";
import { useAuth } from "../Hooks/useAuth.js";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import ContinueWithGoogle from "../components/ContinueWithGoogle.jsx";
import { useSelector } from "react-redux";
import { PrimaryBtn } from "../../../Shared/Buttons.jsx";

const appName = "ScapeGoat";

const Login = () => {
  const { handleLogin } = useAuth();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let identifier = formData.identifier;
      if (/^\d{10}$/.test(identifier)) {
        identifier = `+91${identifier}`;
      }

      const loggedInUser = await handleLogin({
        identifier: identifier,
        password: formData.password,
      });
      if (loggedInUser?.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.log("Login failed", error);
    }
  };

  return (
    <div className="h-screen w-full bg-background text-foreground font-sans selection:bg-accent selection:text-accent-content flex flex-col lg:flex-row overflow-hidden">
      {/* ── Left Editorial Section ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-neutral-900 text-white flex-col justify-between overflow-hidden border-r border-border-theme/40 p-10 xl:p-14 select-none">
        {/* Background Editorial Image - 100% Visible & Crisp */}
        <img
          src="/snitch_editorial.png"
          alt={`${appName} Editorial`}
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
            Exclusive Drops
          </span>
        </div>

        {/* Bottom Hero Card in Frosted Glass */}
        <div className="relative z-10 p-6 rounded-3xl bg-black/40 backdrop-blur-md border border-white/15 shadow-2xl space-y-4 max-w-lg">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent block mb-1">
              Authentication Portal
            </span>
            <h2 className="text-3xl xl:text-4xl font-black uppercase tracking-tight text-white leading-tight">
              Welcome <span className="text-accent">back.</span>
            </h2>
            <p className="text-white/80 text-xs mt-1.5 font-medium leading-relaxed">
              Step back into your curated vault of limited drops, verified designer pieces, and order history.
            </p>
          </div>

          {/* Social Proof Mini Bar */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-accent/25 border border-accent/40 flex items-center justify-center text-accent text-sm">
                <i className="ri-shield-check-line" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-white">100% Authenticated</p>
                <p className="text-[9px] text-white/60">Curated & Verified Drops</p>
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs font-black text-accent">50K+</span>
              <p className="text-[9px] text-white/50 uppercase">Members</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Form Section (Perfect viewport fit, no scroll) ── */}
      <div className="w-full lg:w-1/2 h-full flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 overflow-y-auto scrollbar-hide bg-background">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between pb-4 border-b border-border-theme/40">
          <Link to="/" className="text-base font-black tracking-widest text-accent uppercase">
            {appName}
          </Link>
          <Link to="/register" className="text-xs font-bold text-foreground/60 hover:text-accent">
            Create Account
          </Link>
        </div>

        {/* Centered Form Wrapper */}
        <div className="w-full max-w-md mx-auto my-auto space-y-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">
              Member Sign In
            </span>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-foreground">
              Enter The Vault
            </h1>
            <p className="text-xs text-foreground/60">
              Enter your credentials or use social sign-in to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identifier Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground/80 flex items-center justify-between">
                <span>Email or Phone Number</span>
                <span className="text-accent text-[10px]">*</span>
              </label>
              <div className="relative flex items-center">
                <i className="ri-user-line absolute left-3.5 text-foreground/40 text-sm pointer-events-none" />
                <input
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="name@example.com or 10-digit mobile"
                  className="w-full bg-surface border border-border-theme focus:border-accent rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold text-foreground outline-none transition focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground/80 flex items-center gap-1">
                  <span>Password</span>
                  <span className="text-accent text-[10px]">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-bold text-foreground/60 hover:text-accent transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <i className="ri-lock-line absolute left-3.5 text-foreground/40 text-sm pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Enter your password"
                  className="w-full bg-surface border border-border-theme focus:border-accent rounded-2xl pl-10 pr-10 py-3 text-xs font-semibold text-foreground outline-none transition focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
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
            </div>

            {/* Sign In CTA Button */}
            <PrimaryBtn
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              className="mt-2"
            >
              {loading ? "Authenticating..." : "Sign In to Account"}
            </PrimaryBtn>

            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-theme/60" />
              </div>
              <span className="relative bg-background px-3 text-[10px] font-bold uppercase text-foreground/40 tracking-wider">
                Or Continue With
              </span>
            </div>

            <ContinueWithGoogle />
          </form>

          {/* Switch to Register */}
          <div className="text-center pt-2">
            <p className="text-xs text-foreground/60 font-medium">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-black text-accent hover:underline transition"
              >
                Create an account
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

export default Login;
