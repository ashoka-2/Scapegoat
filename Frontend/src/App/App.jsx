import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import { RouterProvider } from "react-router-dom";

import { routes } from "./App.routes.jsx";
import PageLoader from "../Components/PageLoader.jsx";
import Preloader from "../Components/Preloader.jsx";

import { ToastContainer } from "../Components/Toast.jsx";

import {
  AuthSkeleton,
  HomeSkeleton,
  NavbarSkeleton,
  ProfileSkeleton,
  ShopSkeleton,
  CartSkeleton,
  WishlistSkeleton,
  SingleProductSkeleton,
  CreateProductSkeleton,
  SellerSkeleton,
} from "../Components/Skeletons/index.js";
import { useAuth } from "../Features/auth/Hooks/useAuth.js";

const getPageSkeleton = (path) => {
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
  if (path.startsWith("/product/")) return SingleProductSkeleton;
  if (path.startsWith("/products/edit")) return CreateProductSkeleton;
  if (path.startsWith("/seller")) return SellerSkeleton;
  return HomeSkeleton;
};

const App = () => {
  const { fetchMe } = useAuth();
  const [showApp, setShowApp] = useState(false);

  const [hasSeenPreloader, setHasSeenPreloader] = useState(() => {
    return sessionStorage.getItem("scapegoat_preloader_seen") === "true";
  });
  const [isServerReady, setIsServerReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved ? saved === "dark" : true;
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  const handlePreloaderComplete = () => {
    sessionStorage.setItem("scapegoat_preloader_seen", "true");
    setHasSeenPreloader(true);
    setShowApp(true);
  };

  useEffect(() => {
    if (isServerReady) return;
    let intervalId;

    const checkServer = async () => {
      try {
        await fetchMe();
        setIsServerReady(true);
        if (hasSeenPreloader) {
          setShowApp(true);
        }
      } catch (error) {
        if (error.response) {
          setIsServerReady(true);
          if (hasSeenPreloader) setShowApp(true);
        } else {
          intervalId = setTimeout(checkServer, 2000);
        }
      }
    };

    checkServer();
    return () => clearTimeout(intervalId);
  }, [isServerReady, fetchMe, hasSeenPreloader]);

  return (
    <>
      <ToastContainer />

      {/* 1. Show Cinematic Preloader ONLY on first session visit */}
      {!hasSeenPreloader && (
        <Preloader
          isReady={isServerReady}
          onComplete={handlePreloaderComplete}
        />
      )}

      {/* 2. Show Dedicated Page Skeleton ONLY on reloads when server isn't ready yet */}
      {hasSeenPreloader &&
        !showApp &&
        (() => {
          const path = window.location.pathname;
          const isAuthPage =
            path === "/login" ||
            path === "/register" ||
            path === "/forgot-password" ||
            path === "/reset-password" ||
            path === "/complete-profile";

          const TargetSkeleton = getPageSkeleton(path);

          return (
            <div className="min-h-screen bg-background text-foreground">
              {!isAuthPage && <NavbarSkeleton />}
              <div className={isAuthPage ? "" : "pt-20 md:pt-24"}>
                <PageLoader skeleton={TargetSkeleton} />
              </div>
            </div>
          );
        })()}

      {showApp && <RouterProvider router={routes} />}
    </>
  );
};

export default App;
