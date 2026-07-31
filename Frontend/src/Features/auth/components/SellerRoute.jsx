import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

/**
 * SellerRoute Guard Component
 * Restricts access to Sellers and Admins.
 * Redirects buyers to home page.
 */
const SellerRoute = ({ children }) => {
  const { user, loading } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest text-accent animate-pulse">
            Verifying Seller Permissions...
          </span>
        </div>
      </div>
    );
  }

  // Admins are also granted access to seller tools for moderation
  if (!user || (user.role !== "seller" && user.role !== "admin")) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default SellerRoute;
