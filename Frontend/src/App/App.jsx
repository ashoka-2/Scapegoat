import { useEffect, useState } from "react";
import customAxios from "../utils/axios.js";
import "./App.css";
import { RouterProvider } from "react-router-dom";

import { routes } from "./App.routes.jsx";
import PageLoader from "../Shared/PageLoader.jsx";
import Preloader from "../Shared/Preloader.jsx";
import { ToastContainer } from "../Components/Toast.jsx";
import { NavbarSkeleton } from "../Components/Skeletons/index.js";
import {
  getPageSkeleton,
  shouldHideNavbarSkeleton,
} from "../Components/Skeletons/skeletonRouter.js";

import { useAuth } from "../Features/auth/Hooks/useAuth.js";
import { useActiveHeartbeat } from "../Hooks/useActiveHeartbeat.js";

const App = () => {
  useActiveHeartbeat();
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
        await customAxios.get("/api/auth/getMe", {
          timeout: 2000,
        });
        setIsServerReady(true);
        fetchMe();
        if (hasSeenPreloader) setShowApp(true);
      } catch (err) {
        if (err.response) {
          setIsServerReady(true);
          fetchMe();
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
          const hideNavbarSkeleton = shouldHideNavbarSkeleton(path);
          const TargetSkeleton = getPageSkeleton(path);

          return (
            <div className="min-h-screen bg-background text-foreground">
              {!hideNavbarSkeleton && <NavbarSkeleton />}
              <div className={hideNavbarSkeleton ? "" : "pt-20 md:pt-24"}>
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
