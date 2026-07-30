import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import { RouterProvider } from "react-router-dom";

import { routes } from "./App.routes.jsx";
import PageLoader from "../Components/PageLoader.jsx";
import Preloader from "../Components/Preloader.jsx";

import {ToastContainer} from "../Components/Toast.jsx";

import {
  AuthSkeleton,
  HomeSkeleton,
  NavbarSkeleton,
  ProfileSkeleton,
} from "../Components/Skeletons.jsx";
import { useAuth } from "../Features/auth/Hooks/useAuth.js";

const App = () => {

  const { fetchMe } = useAuth();
  const [showApp, setShowApp] = useState(false);


const [hasSeenPreloader, setHasSeenPreloader] = useState(() => {
    return sessionStorage.getItem('snitch_preloader_seen') === 'true';
  });
  const [isServerReady, setIsServerReady] = useState(false);



  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved ? saved === "dark" : true;
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  const handlePreloaderComplete = () => {
    sessionStorage.setItem("snitch_preloader_seen", "true");
    setHasSeenPreloader(true);
    setShowApp(true);
  };

   useEffect(() => {
    if (isServerReady) return;
    let intervalId;

    const checkServer = async () => {
      try {
        await axios.get('/api/auth/getMe');
        console.log("Server active.");
        await fetchMe();
        setIsServerReady(true);
        
        // If they've seen the preloader before, show the app immediately once server is ready
        if (hasSeenPreloader) {
            setShowApp(true);
        }
      } catch (error) {
        if (error.response) {
            await fetchMe();
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

      {/* 2. Show Skeletons ONLY on reloads when server isn't ready yet */}
      {hasSeenPreloader &&
        !showApp &&
        (() => {
          const path = window.location.pathname;
          const isAuthPage = path === "/login" || path === "/register";

          return (
            <div
              className={`min-h-screen bg-background text-foreground ${isAuthPage ? "" : "p-4 md:p-8"}`}
            >
              {!isAuthPage && <NavbarSkeleton />}
              <div className={isAuthPage ? "" : "pt-20"}>
                {path === "/profile" ? (
                  <PageLoader skeleton={ProfileSkeleton} />
                ) : isAuthPage ? (
                  <PageLoader skeleton={AuthSkeleton} />
                ) : (
                  <PageLoader skeleton={HomeSkeleton} />
                )}
              </div>
            </div>
          );
        })()}

      {showApp && <RouterProvider router={routes} />}
    </>
  );
};

export default App;
