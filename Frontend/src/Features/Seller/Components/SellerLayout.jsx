import React from "react";
import { Outlet } from "react-router-dom";
import SellerNavbar from "./SellerNavbar";

const SellerLayout = () => {
  return (
    <div className="w-full text-foreground py-2">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 items-start">
        {/* Seller Left Sidebar */}
        <SellerNavbar />

        {/* Scrollable Seller Content Pane */}
        <main className="flex-1 w-full min-w-0 bg-surface/50 border border-border-theme rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-sm">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SellerLayout;
