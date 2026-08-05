import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../Hooks/useAuth";
import { useSelector } from "react-redux";
import { PrimaryBtn } from "../../../Shared/Buttons";

const ForgotPassword = () => {
  const { handleForgotPassword } = useAuth();
  const { loading } = useSelector((state) => state.auth);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      await handleForgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 selection:bg-accent selection:text-accent-content">
      <div className="w-full max-w-md bg-surface border border-border-theme/80 rounded-3xl p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center justify-center text-2xl mx-auto mb-4">
            🔑
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Forgot Password?
          </h1>
          <p className="text-xs text-foreground/60">
            Enter your account email address and we'll send you an instant link
            to reset your password.
          </p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
            <i className="ri-mail-send-fill text-3xl text-emerald-500" />
            <p className="text-xs font-bold text-emerald-500">
              Reset link sent! Please check your email inbox (and spam folder).
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-[11px] font-extrabold underline text-foreground/70 hover:text-accent cursor-pointer"
            >
              Resend to another email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-foreground/80 mb-1.5 flex items-center justify-between">
                <span>
                  Email Address{" "}
                  <span className="text-red-500 font-bold ml-0.5">*</span>
                </span>
                <span className="text-[10px] text-red-500 font-semibold">
                  * Required
                </span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="registered-email@example.com"
                disabled={loading}
                className="w-full bg-background border border-border-theme focus:border-accent rounded-xl px-4 py-3 text-foreground outline-none transition text-xs disabled:opacity-50"
              />
            </div>

            <PrimaryBtn type="submit" loading={loading} fullWidth size="lg">
              Send Reset Link
            </PrimaryBtn>
          </form>
        )}

        <div className="text-center pt-2 border-t border-border-theme/50">
          <Link
            to="/login"
            className="text-xs font-bold text-foreground/60 hover:text-accent transition flex items-center justify-center gap-1.5"
          >
            <i className="ri-arrow-left-line" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
