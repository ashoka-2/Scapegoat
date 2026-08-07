import {
  AuthSkeleton,
  HomeSkeleton,
  ProfileSkeleton,
  ShopSkeleton,
  CartSkeleton,
  WishlistSkeleton,
  SingleProductSkeleton,
  SellerSkeleton,
  ContactSkeleton,
  AboutSkeleton,
  LegalSkeleton,
  CheckoutSkeleton,
  OrdersSkeleton,
  OrderDetailsSkeleton,
} from "./index.js";

// Dedicated Admin Skeletons
import AdminDashboardSkeleton from "../../Features/Admin/Components/Skeletons/AdminDashboardSkeleton.jsx";
import AdminUsersSkeleton from "../../Features/Admin/Components/Skeletons/AdminUsersSkeleton.jsx";
import AdminUserDetailSkeleton from "../../Features/Admin/Components/Skeletons/AdminUserDetailSkeleton.jsx";
import AdminProductsSkeleton from "../../Features/Admin/Components/Skeletons/AdminProductsSkeleton.jsx";
import AdminProductDetailSkeleton from "../../Features/Admin/Components/Skeletons/AdminProductDetailSkeleton.jsx";
import AdminOrdersSkeleton from "../../Features/Admin/Components/Skeletons/AdminOrdersSkeleton.jsx";
import AdminCategoriesSkeleton from "../../Features/Admin/Components/Skeletons/AdminCategoriesSkeleton.jsx";
import AdminBrandsSkeleton from "../../Features/Admin/Components/Skeletons/AdminBrandsSkeleton.jsx";
import AdminUnitsSkeleton from "../../Features/Admin/Components/Skeletons/AdminUnitsSkeleton.jsx";
import AdminInboxSkeleton from "../../Features/Admin/Components/Skeletons/AdminInboxSkeleton.jsx";
import AdminSettingsSkeleton from "../../Features/Admin/Components/Skeletons/AdminSettingsSkeleton.jsx";
import AdminBannersSkeleton from "../../Features/Admin/Components/Skeletons/AdminBannersSkeleton.jsx";
import AdminBannerEditorSkeleton from "../../Features/Admin/Components/Skeletons/AdminBannerEditorSkeleton.jsx";

export const getPageSkeleton = (path) => {
  if (
    path === "/login" ||
    path === "/register" ||
    path === "/forgot-password" ||
    path === "/reset-password" ||
    path === "/complete-profile"
  ) {
    return AuthSkeleton;
  }
  if (path === "/profile") return ProfileSkeleton;
  if (path === "/shop") return ShopSkeleton;
  if (path === "/cart") return CartSkeleton;
  if (path === "/wishlist") return WishlistSkeleton;
  if (path === "/about") return AboutSkeleton;
  if (path === "/contact") return ContactSkeleton;
  if (
    path === "/privacy-policy" ||
    path === "/returns-policy" ||
    path === "/terms-of-service"
  ) {
    return LegalSkeleton;
  }
  if (path === "/checkout") return CheckoutSkeleton;
  if (path === "/my-orders") return OrdersSkeleton;
  if (path.startsWith("/orders/")) return OrderDetailsSkeleton;
  if (path.startsWith("/product/")) return SingleProductSkeleton;
  if (path.startsWith("/seller")) return SellerSkeleton;

  // Dedicated Admin Route Skeletons
  if (path === "/admin" || path === "/admin/dashboard") return AdminDashboardSkeleton;
  if (path === "/admin/users") return AdminUsersSkeleton;
  if (path.startsWith("/admin/users/")) return AdminUserDetailSkeleton;
  if (path === "/admin/products") return AdminProductsSkeleton;
  if (path.startsWith("/admin/products/")) return AdminProductDetailSkeleton;
  if (path === "/admin/orders") return AdminOrdersSkeleton;
  if (path === "/admin/categories") return AdminCategoriesSkeleton;
  if (path === "/admin/brands") return AdminBrandsSkeleton;
  if (path === "/admin/units") return AdminUnitsSkeleton;
  if (path === "/admin/inbox") return AdminInboxSkeleton;
  if (path === "/admin/settings") return AdminSettingsSkeleton;
  if (path === "/admin/banners/create" || path.startsWith("/admin/banners/edit/")) return AdminBannerEditorSkeleton;
  if (path === "/admin/banners") return AdminBannersSkeleton;

  return HomeSkeleton;
};

export const shouldHideNavbarSkeleton = (path) => {
  const isAuthPage =
    path === "/login" ||
    path === "/register" ||
    path === "/forgot-password" ||
    path === "/reset-password" ||
    path === "/complete-profile";
  const isAdminPage = path.startsWith("/admin");
  const isSellerPage = path.startsWith("/seller");

  return isAuthPage || isAdminPage || isSellerPage;
};
