import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { motion } from "framer-motion";
import Lottie from "lottie-react";

// Safe export resolution for Lottie in React 19 / Vite ESM
const LottiePlayer = Lottie?.default || Lottie;

// Animated Space & Satellite 2D Lottie Object
const spaceLottieData = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 120,
  w: 500,
  h: 500,
  nm: "404 Cosmic Radar",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Orbit Ring",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 0, s: [40] }, { t: 60, s: [90] }, { t: 120, s: [40] }] },
        r: { a: 1, k: [{ t: 0, s: [0] }, { t: 120, s: [360] }] },
        p: { a: 0, k: [250, 250, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [90, 90] }, { t: 60, s: [105, 105] }, { t: 120, s: [90, 90] }] }
      },
      shapes: [
        {
          ty: "el",
          d: 1,
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [320, 320] }
        },
        {
          ty: "st",
          c: { a: 0, k: [0.98, 0.73, 0.01, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 2 },
          lc: 2,
          lj: 2,
          d: [{ n: "d", v: { a: 0, k: [8, 12] } }]
        }
      ]
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Planet Core",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 1, k: [{ t: 0, s: [250, 250, 0] }, { t: 60, s: [250, 240, 0] }, { t: 120, s: [250, 250, 0] }] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100] }
      },
      shapes: [
        {
          ty: "el",
          d: 1,
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [180, 180] }
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.12, 0.12, 0.18, 1] },
          o: { a: 0, k: 100 }
        },
        {
          ty: "st",
          c: { a: 0, k: [0.98, 0.73, 0.01, 0.4] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 4 }
        }
      ]
    }
  ]
};

const NotFound = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const starsRef = useRef(null);
  const [searchVal, setSearchVal] = useState("");

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Title Glitch & Stagger
      gsap.fromTo(
        ".digit-404",
        { y: 60, opacity: 0, scale: 0.8 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.2,
          stagger: 0.15,
          ease: "back.out(1.7)",
        }
      );

      // 2. Floating Star Field
      const stars = gsap.utils.toArray(".star-particle");
      stars.forEach((star) => {
        gsap.to(star, {
          y: "random(-40, 40)",
          x: "random(-30, 30)",
          opacity: "random(0.2, 1)",
          scale: "random(0.6, 1.4)",
          duration: "random(2.5, 5)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

      // 3. Mouse Parallax
      const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        const xPos = (clientX / window.innerWidth - 0.5) * 30;
        const yPos = (clientY / window.innerHeight - 0.5) * 30;

        gsap.to(".parallax-bg", {
          x: xPos * 0.5,
          y: yPos * 0.5,
          duration: 1,
          ease: "power2.out",
        });

        gsap.to(".parallax-fg", {
          x: -xPos * 1.2,
          y: -yPos * 1.2,
          duration: 1,
          ease: "power2.out",
        });
      };

      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full bg-background text-foreground flex flex-col items-center justify-center overflow-hidden font-sans px-4 py-12 select-none"
    >
      {/* Background Cosmic Glow Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="parallax-bg absolute -top-40 -left-40 w-96 h-96 bg-accent/15 rounded-full blur-[120px]" />
        <div className="parallax-bg absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[180px]" />
      </div>

      {/* Floating Star Field */}
      <div ref={starsRef} className="absolute inset-0 pointer-events-none">
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="star-particle absolute rounded-full bg-foreground/60"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              boxShadow: "0 0 8px currentColor",
            }}
          />
        ))}
      </div>

      {/* Main Container Card */}
      <div className="relative z-10 max-w-4xl w-full flex flex-col items-center text-center space-y-8">
        {/* 2D Lottie Animation & Glowing 404 Hero */}
        <div className="relative flex items-center justify-center w-full max-w-md h-64 sm:h-72">
          {/* Lottie 2D Canvas */}
          <div className="absolute inset-0 flex items-center justify-center opacity-85">
            <LottiePlayer
              animationData={spaceLottieData}
              loop={true}
              className="w-full h-full max-w-[320px]"
            />
          </div>

          {/* Floating Orbiting Rocket Graphic */}
          <motion.div
            animate={{
              y: [-12, 12, -12],
              rotate: [-4, 4, -4],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="parallax-fg z-10 flex items-center justify-center"
          >
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-surface/90 border border-accent/40 backdrop-blur-2xl flex items-center justify-center shadow-2xl shadow-accent/20 group-hover:border-accent transition duration-500">
                <i className="ri-rocket-2-line text-5xl sm:text-6xl text-accent animate-pulse" />
              </div>
              <div className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-black uppercase tracking-widest shadow-md">
                LOST IN SPACE
              </div>
            </div>
          </motion.div>
        </div>

        {/* Animated 404 Typography */}
        <div ref={titleRef} className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-7xl sm:text-9xl font-black font-mono tracking-tighter text-foreground">
            <span className="digit-404 text-accent drop-shadow-[0_0_25px_rgba(250,189,0,0.3)]">4</span>
            <span className="digit-404 text-foreground/20 drop-shadow-lg">0</span>
            <span className="digit-404 text-accent drop-shadow-[0_0_25px_rgba(250,189,0,0.3)]">4</span>
          </div>

          <h1 className="text-xl sm:text-3xl font-black uppercase tracking-wider text-foreground">
            Page Navigated Into Deep Orbit
          </h1>
          <p className="text-xs sm:text-sm text-foreground/60 max-w-lg mx-auto leading-relaxed">
            The page or catalog route you are looking for has either expired, moved, or never existed in our cosmic database.
          </p>
        </div>

        {/* Interactive Search Bar */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          onSubmit={handleSearchSubmit}
          className="w-full max-w-md flex items-center gap-2 bg-surface/80 border border-border-theme p-1.5 rounded-2xl shadow-xl backdrop-blur-xl focus-within:border-accent transition"
        >
          <div className="relative flex-1">
            <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40 text-sm" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search products, brands, categories..."
              className="w-full pl-9 pr-3 py-2 bg-transparent text-xs font-semibold text-foreground placeholder:text-foreground/40 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-accent text-accent-content font-bold text-xs hover:opacity-90 transition cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <span>Search</span>
            <i className="ri-arrow-right-line text-sm" />
          </button>
        </motion.form>

        {/* Quick Navigation Destination Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-3 pt-2"
        >
          <Link
            to="/"
            className="px-5 py-2.5 rounded-2xl bg-accent text-accent-content font-black text-xs hover:scale-105 transition shadow-lg shadow-accent/20 flex items-center gap-2 active:scale-95"
          >
            <i className="ri-home-5-line text-sm" />
            <span>Return to Home</span>
          </Link>

          <Link
            to="/shop"
            className="px-5 py-2.5 rounded-2xl bg-surface border border-border-theme hover:border-accent text-foreground font-bold text-xs transition flex items-center gap-2 hover:bg-background active:scale-95"
          >
            <i className="ri-shopping-bag-3-line text-sm text-accent" />
            <span>Explore Catalog</span>
          </Link>

          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-2xl bg-surface border border-border-theme hover:border-border-theme/80 text-foreground/70 font-bold text-xs transition flex items-center gap-2 hover:text-foreground active:scale-95 cursor-pointer"
          >
            <i className="ri-arrow-left-line text-sm" />
            <span>Go Back</span>
          </button>
        </motion.div>
      </div>

      {/* Footer Branding Accent */}
      <div className="absolute bottom-4 text-[10px] font-mono font-bold uppercase tracking-widest text-foreground/30 flex items-center gap-2">
        <span>ScapeGoat Control Center</span>
        <span>•</span>
        <span>Error Code: 404_NOT_FOUND</span>
      </div>
    </div>
  );
};

export default NotFound;
