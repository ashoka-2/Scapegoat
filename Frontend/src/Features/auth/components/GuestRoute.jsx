import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

/**
 * GuestRoute Guard:
 * Prevents logged-in users from accessing /login or /register.
 * Redirects authenticated users back to "/" (Home) or dashboard.
 */
const GuestRoute = ({ children }) => {
  const { user, loading } = useSelector((state) => state.auth);

  if (loading) {
    return null;
  }

  if (user) {
    if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === "seller") {
      return <Navigate to="/seller/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default GuestRoute;
