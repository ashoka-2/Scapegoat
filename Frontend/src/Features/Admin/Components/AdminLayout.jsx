import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import { useAuth } from "../../auth/Hooks/useAuth";
import { useActiveHeartbeat } from "../../../Hooks/useActiveHeartbeat.js";
import ThemeToggle from "../../../Components/ThemeToggle";

const AdminLayout = () => {
  useActiveHeartbeat();
  const { handleLogout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await handleLogout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Top Admin Status Bar */}
      <header className="sticky top-0 z-50 bg-surface/90 border-b border-border-theme backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center font-black text-accent text-sm">
            SG
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-foreground tracking-wide flex items-center gap-2">
              ScapeGoat Control Center
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                Admin Panel
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <ThemeToggle />

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 text-xs font-bold transition cursor-pointer"
          >
            <i className="ri-logout-box-r-line text-sm" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Admin Workspace */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col lg:flex-row gap-6 items-start">
        {/* Isolated Left Sidebar */}
        <AdminNavbar />

        {/* Scrollable Content Pane */}
        <main className="flex-1 w-full min-w-0 bg-surface/80 border border-border-theme rounded-3xl p-6 md:p-8 shadow-sm">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
