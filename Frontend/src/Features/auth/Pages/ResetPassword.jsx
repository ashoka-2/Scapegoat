import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../Hooks/useAuth";
import { useSelector, useDispatch } from "react-redux";
import { addToast } from "../../../utils/toast.slice";
import { PrimaryBtn } from "../../../Components/Buttons";
import PasswordRequirementChecker, {
  isPasswordValid,
} from "../components/PasswordRequirementChecker.jsx";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { handleResetPassword } = useAuth();
  const { loading } = useSelector((state) => state.auth);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      dispatch(addToast({ message: "Invalid or missing reset token.", type: "error" }));
      return;
    }
    if (!isPasswordValid(newPassword)) {
      dispatch(addToast({ message: "Please satisfy all password strength requirements.", type: "error" }));
      return;
    }
    if (newPassword !== confirmPassword) {
      dispatch(addToast({ message: "Passwords do not match.", type: "error" }));
      return;
    }

    try {
      await handleResetPassword({ token, newPassword });
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 selection:bg-accent selection:text-accent-content">
      <div className="w-full max-w-md bg-surface border border-border-theme/80 rounded-3xl p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center justify-center text-2xl mx-auto mb-4">
            🔒
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Set New Password</h1>
          <p className="text-xs text-foreground/60">
            Create a secure new password for your account below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password Input */}
          <div>
            <label className="text-xs font-bold text-foreground/80 mb-1.5 flex items-center justify-between">
              <span>
                New Password <span className="text-red-500 font-bold ml-0.5">*</span>
              </span>
              <span className="text-[10px] text-red-500 font-semibold">* Required</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onFocus={() => setIsFocused(true)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full bg-background border border-border-theme focus:border-accent rounded-xl px-4 py-3 text-foreground outline-none transition text-xs pr-10 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-accent text-sm"
              >
                <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"} />
              </button>
            </div>

            {/* Password Requirement Checker Popup */}
            <PasswordRequirementChecker password={newPassword} isFocused={isFocused || Boolean(newPassword)} />
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="text-xs font-bold text-foreground/80 mb-1.5 flex items-center justify-between">
              <span>
                Confirm New Password <span className="text-red-500 font-bold ml-0.5">*</span>
              </span>
              <span className="text-[10px] text-red-500 font-semibold">* Required</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full bg-background border border-border-theme focus:border-accent rounded-xl px-4 py-3 text-foreground outline-none transition text-xs pr-10 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-accent text-sm"
              >
                <i className={showConfirmPassword ? "ri-eye-off-line" : "ri-eye-line"} />
              </button>
            </div>
          </div>

          <PrimaryBtn type="submit" loading={loading} fullWidth size="lg">
            Update Password
          </PrimaryBtn>
        </form>

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

export default ResetPassword;
