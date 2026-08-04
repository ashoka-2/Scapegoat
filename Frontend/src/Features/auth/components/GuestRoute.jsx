import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

/**
 * GuestRoute Guard:
 * Prevents logged-in users from accessing /login or /register.
 * Redirects authenticated users back to "/" (Home).
 */
const GuestRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default GuestRoute;
