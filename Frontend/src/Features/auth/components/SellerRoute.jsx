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
    return null;
  }

  // Admins are also granted access to seller tools for moderation
  if (!user || (user.role !== "seller" && user.role !== "admin")) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default SellerRoute;
