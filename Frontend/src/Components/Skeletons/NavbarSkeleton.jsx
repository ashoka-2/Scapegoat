import React from "react";

/**
 * NavbarSkeleton Component
 * Matches exact fixed position, top-0, height and responsive paddings of Navbar.jsx
 */
const NavbarSkeleton = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[1000] px-4 md:px-12 py-3 flex items-center justify-between bg-background/80 backdrop-blur-2xl border-b border-border-theme/40 animate-pulse">
      {/* Left Links & Mobile Hamburger Skeleton */}
      <div className="flex items-center gap-6">
        {/* Mobile Hamburger Skeleton */}
        <div className="md:hidden w-10 h-10 rounded-full bg-foreground/10 border border-border-theme/40" />

        {/* Desktop Nav Links Skeleton */}
        <div className="hidden md:flex items-center gap-6">
          <div className="w-14 h-3 bg-foreground/15 rounded-md" />
          <div className="w-14 h-3 bg-foreground/15 rounded-md" />
          <div className="w-14 h-3 bg-foreground/15 rounded-md" />
        </div>
      </div>

      {/* Brand Logo Skeleton */}
      <div className="w-32 md:w-40 h-7 bg-foreground/20 rounded-xl" />

      {/* Right Controls Skeleton */}
      <div className="flex items-center gap-3">
        {/* Search Bar Skeleton */}
        <div className="hidden sm:block w-44 md:w-60 h-9 bg-surface border border-border-theme/50 rounded-full" />

        {/* Theme Toggle Skeleton */}
        <div className="hidden md:block w-10 h-10 rounded-full bg-foreground/10" />

        {/* Wishlist Skeleton */}
        <div className="hidden md:block w-10 h-10 rounded-full bg-foreground/10" />

        {/* User Profile / Account Skeleton */}
        <div className="hidden md:block w-10 h-10 rounded-full bg-foreground/15 border border-border-theme/40" />

        {/* Cart Button Skeleton */}
        <div className="w-16 h-10 rounded-full bg-accent/20 border-2 border-accent/30" />
      </div>
    </nav>
  );
};

export default NavbarSkeleton;
