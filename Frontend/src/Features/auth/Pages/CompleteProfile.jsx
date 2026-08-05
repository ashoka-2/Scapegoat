import React, { useState } from "react";
import { useAuth } from "../Hooks/useAuth";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { PrimaryBtn } from "../../../Shared/Buttons.jsx";

const appName = "ScapeGoat";

const CompleteProfile = () => {
  const { handleCompleteProfile } = useAuth();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    contactNumber: "",
    password: "",
    confirmPassword: "",
    isSeller: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setError("");
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.contactNumber.length !== 10) {
      setError("Contact number must be 10 digits");
      return;
    }

    try {
      await handleCompleteProfile({
        contact: `+91${formData.contactNumber}`,
        password: formData.password,
        isSeller: formData.isSeller,
      });
      navigate("/");
    } catch (error) {
      console.error("Profile completion failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-accent-content flex flex-col lg:flex-row transition-colors duration-500">
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface items-center justify-center overflow-hidden border-r border-border-theme">
        <img
          src="/snitch_editorial.png"
          alt={`${appName} Fashion Editorial`}
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity hover:scale-105 transition-transform duration-[20s] ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background opacity-90"></div>

        <div className="relative z-10 p-16 flex flex-col h-full justify-between w-full max-w-2xl">
          <h2 className="text-accent text-xl font-bold tracking-widest uppercase">
            {appName}.
          </h2>
          <div className="mt-auto">
            <p className="text-5xl lg:text-6xl font-bold tracking-tighter leading-[1.1] text-foreground mb-6">
              Complete your <br />
              <span className="text-accent">profile.</span>
            </p>
            <p className="text-gray-500 dark:text-gray-400 max-w-md text-lg leading-relaxed">
              We just need a few more details to set up your account.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 min-h-screen overflow-y-auto z-10 bg-background">
        <div className="w-full max-w-md bg-surface lg:bg-transparent p-10 md:p-14 lg:p-6 rounded-2xl lg:rounded-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] lg:shadow-none transition-shadow border border-border-theme lg:border-none">
          <div className="mb-12">
            <h2 className="text-sm uppercase tracking-widest text-accent font-medium mb-3">
              Almost there
            </h2>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground">
              Final Steps
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500 text-red-500 rounded text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex flex-col">
              <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium">
                Contact Number
              </label>
              <div className="flex items-center gap-3 border-b-2 border-border-theme focus-within:border-accent transition-colors duration-300">
                <div className="flex items-center gap-1.5 px-3 py-3 bg-surface/30 text-gray-400 min-w-[75px]">
                  <span className="text-lg">🇮🇳</span>
                  <span className="text-sm font-bold tracking-tighter cursor-default">
                    +91
                  </span>
                </div>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full bg-transparent text-foreground outline-none py-3 disabled:opacity-50"
                  placeholder="98765 43210"
                />
              </div>
              <p className="mt-2 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                10 Digits Required
              </p>
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium">
                Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full bg-background text-foreground border-b-2 border-border-theme focus:border-accent outline-none px-4 py-3 transition-colors duration-300 focus:bg-surface lg:focus:bg-surface disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-accent transition-colors"
                >
                  <i
                    className={showPassword ? "ri-eye-off-line" : "ri-eye-line"}
                  ></i>
                </button>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium">
                Confirm Password
              </label>
              <div className="relative group">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full bg-background text-foreground border-b-2 border-border-theme focus:border-accent outline-none px-4 py-3 transition-colors duration-300 focus:bg-surface lg:focus:bg-surface disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-accent transition-colors"
                >
                  <i
                    className={
                      showConfirmPassword ? "ri-eye-off-line" : "ri-eye-line"
                    }
                  ></i>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-2 group w-max cursor-pointer">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  name="isSeller"
                  id="isSeller"
                  checked={formData.isSeller}
                  onChange={handleChange}
                  disabled={loading}
                  className="peer appearance-none w-6 h-6 border border-border-theme rounded bg-background checked:bg-accent checked:border-accent cursor-pointer transition-colors duration-300 group-hover:border-accent disabled:opacity-50"
                />
                <svg
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-0 peer-checked:opacity-100 text-accent-content"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <label
                htmlFor="isSeller"
                className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-accent cursor-pointer select-none transition-colors duration-300"
              >
                Register as Seller
              </label>
            </div>

            <PrimaryBtn
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              className="mt-6"
            >
              {loading ? "Completing Profile..." : "Complete Profile"}
            </PrimaryBtn>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
