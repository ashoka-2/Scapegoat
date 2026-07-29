import React, { useState } from "react";
import { useAuth } from "../Hooks/useAuth.js";
import { useNavigate } from "react-router-dom";
import ContinueWithGoogle from "../components/ContinueWithGoogle.jsx";
import { useSelector } from "react-redux";
import { PrimaryBtn, TertiaryBtn } from "../../../Components/Buttons.jsx";

const Login = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-accent-content flex flex-col lg:flex-row transition-colors duration-500">
      {/* Split Screen - Left Image Section */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface items-center justify-center overflow-hidden border-r border-border-theme">
        <img
          src="/snitch_editorial.png"
          alt="Snitch Fashion Editorial"
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity hover:scale-105 transition-transform duration-[20s] ease-out"
        />

        {/* Gradient overlays to merge image nicely into the background */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background opacity-90"></div>

        <div className="relative z-10 p-16 flex flex-col h-full justify-between w-full max-w-2xl">
          <h2 className="text-accent text-xl font-bold tracking-widest uppercase">
            Snitch.
          </h2>

          <div className="mt-auto">
            <p className="text-5xl lg:text-6xl font-bold tracking-tighter leading-[1.1] text-foreground mb-6">
              Welcome <br />
              <span className="text-accent">back.</span>
            </p>
            <p className="text-gray-500 dark:text-gray-400 max-w-md text-lg leading-relaxed">
              Sign in to explore the latest exclusive drops and manage your
              aesthetic.
            </p>
          </div>
        </div>
      </div>

      {/* Split Screen - Right Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 min-h-screen overflow-y-auto z-10 bg-background">
        <div className="w-full max-w-md bg-surface lg:bg-transparent p-10 md:p-14 lg:p-6 rounded-2xl lg:rounded-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] lg:shadow-none transition-shadow border border-border-theme lg:border-none">
          <div className="mb-12">
            <h2 className="text-sm uppercase tracking-widest text-accent font-medium mb-3">
              Sign in to Snitch
            </h2>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground">
              Enter the Vault
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            {/* Identifier (Email or Contact) */}
            <div className="flex flex-col">
              <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium">
                Email or Contact Number
              </label>
              <input
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                required
                disabled={loading}
                className="bg-background text-foreground border-b-2 border-border-theme focus:border-accent outline-none px-4 py-3 transition-colors duration-300 focus:bg-surface lg:focus:bg-surface disabled:opacity-50"
                placeholder="Email or Phone Number"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs text-gray-400 hover:text-accent transition-colors"
                >
                  Forgot password?
                </a>
              </div>
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

            {/* Submit Button */}
            <PrimaryBtn
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              className="mt-6"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </PrimaryBtn>

            <ContinueWithGoogle />

            <div className="text-center mt-6">
              <a
                href="/register"
                className="text-sm text-gray-400 hover:text-accent transition-colors border-b border-transparent hover:border-accent py-0.5"
              >
                Don't have an account? Sign up
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
