import React from "react";

export { default as ProductCardSkeleton } from "../Features/Products/Components/Skeletons/ProductCardSkeleton";
export { default as ProductCarouselSkeleton } from "../Features/Products/Components/Skeletons/ProductCarouselSkeleton";
export { default as ProductGridSkeleton } from "../Features/Products/Components/Skeletons/ProductGridSkeleton";
export { default as SingleProductSkeleton } from "../Features/Products/Components/Skeletons/SingleProductSkeleton";
export { default as WishlistSkeleton } from "../Features/Wishlist/Components/Skeletons/WishlistSkeleton";
export { default as SellerTableSkeleton } from "../Features/Seller/Components/Skeletons/SellerTableSkeleton";
export { default as CartItemSkeleton } from "../Features/Cart/Components/Skeletons/CartItemSkeleton";

export const NavbarSkeleton = () => (
  <div className="w-full h-16 bg-surface/50 border-b border-border-theme/40 animate-pulse" />
);

export const HomeSkeleton = () => (
  <div className="min-h-screen p-8 space-y-8 animate-pulse">
    <div className="h-64 bg-surface rounded-3xl" />
    <div className="h-48 bg-surface rounded-3xl" />
  </div>
);

export const AuthSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <div className="w-full max-w-md h-96 bg-surface rounded-3xl animate-pulse" />
  </div>
);

export const ProfileSkeleton = () => (
  <div className="min-h-screen p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
    <div className="h-20 bg-surface rounded-2xl" />
    <div className="h-64 bg-surface rounded-3xl" />
  </div>
);
