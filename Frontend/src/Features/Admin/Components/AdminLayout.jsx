import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AdminNavbar from "./AdminNavbar";
import { useAuth } from "../../auth/Hooks/useAuth";
import { useActiveHeartbeat } from "../../../Hooks/useActiveHeartbeat.js";
import { useLenis } from "../../../Hooks/useLenis.js";

const AdminLayout = () => {
  useLenis();
  useActiveHeartbeat();
  const { handleLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("admin_sidebar_collapsed") === "true";
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("admin_sidebar_collapsed", String(next));
      return next;
    });
  };

  const onLogout = async () => {
    await handleLogout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased flex">
      {/* Left Sidebar */}
      <AdminNavbar
        onLogout={onLogout}
        isCollapsed={isCollapsed}
        setIsCollapsed={toggleCollapse}
      />

      {/* Main Admin Workspace with Smooth Animated Left Margin */}
      <main
        className={`flex-1 w-full min-w-0 pt-20 sm:pt-24 lg:pt-5 transition-all duration-300 ease-in-out ${
          isCollapsed ? "lg:ml-[6.5rem]" : "lg:ml-[17.5rem]"
        } p-4 sm:p-6 md:p-8`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.99 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminLayout;
