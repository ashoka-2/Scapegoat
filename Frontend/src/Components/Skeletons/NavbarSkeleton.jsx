import React from "react";

/**
 * NavbarSkeleton Component
 * Matches the CURRENT Navbar layout: hamburger + logo LEFT, links MIDDLE,
 * search bar (lg) / search icon (mobile) + theme + wishlist + profile + cart RIGHT.
 */
const NavbarSkeleton = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[1000] px-4 md:px-12 py-3 flex items-center justify-between bg-background/80 backdrop-blur-2xl border-b border-border-theme/40 animate-pulse">
      {/* Left: Mobile Hamburger + Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="md:hidden w-10 h-10 rounded-full bg-foreground/10 border border-border-theme/40" />
        <div className="w-24 md:w-36 h-7 bg-foreground/20 rounded-xl" />
      </div>

      {/* Middle: Desktop Nav Links (Home / Shop / About / Contact) */}
      <div className="hidden md:flex items-center gap-4 lg:gap-8 flex-1 justify-center ml-6 lg:ml-10">
        <div className="w-12 h-3 bg-foreground/15 rounded-md" />
        <div className="w-12 h-3 bg-foreground/15 rounded-md" />
        <div className="w-14 h-3 bg-foreground/15 rounded-md" />
        <div className="w-16 h-3 bg-foreground/15 rounded-md" />
      </div>

      {/* Right: Search + Controls */}
      <div className="flex items-center gap-2.5 md:gap-3">
        {/* Desktop Search Bar Skeleton */}
        <div className="hidden lg:block w-44 lg:w-60 h-9 bg-surface border border-border-theme/50 rounded-full" />

        {/* Mobile Search Icon Skeleton */}
        <div className="lg:hidden w-10 h-10 rounded-full bg-foreground/10 border border-border-theme/40" />

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
