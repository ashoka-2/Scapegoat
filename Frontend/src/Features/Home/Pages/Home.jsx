import React from "react";
import Hero from "../Components/Hero";
import BannerCarousel from "../Components/BannerCarousel";
import AllProducts from "../../Products/Pages/AllProducts";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const StorePromises = () => (
  <section className="max-w-[1300px] mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-3xl border border-border-theme bg-border-theme/50 mb-8">
    {[
      ["ri-truck-line", "Thoughtful delivery", "Order tracking from checkout"],
      ["ri-shield-check-line", "Secure checkout", "Protected Razorpay payments"],
      ["ri-refresh-line", "Easy returns", "Clear return-policy support"],
      ["ri-customer-service-2-line", "Need help?", "Support when you need it"],
    ].map(([icon, title, body]) => (
      <div key={title} className="bg-surface px-4 sm:px-6 py-5 flex gap-3 items-start">
        <i className={`${icon} text-xl text-accent`} aria-hidden="true" />
        <div><p className="font-black text-[11px] uppercase tracking-wide">{title}</p><p className="text-[11px] text-foreground/55 mt-1">{body}</p></div>
      </div>
    ))}
  </section>
);

const ShopCallout = () => (
  <section className="max-w-[1300px] mx-auto px-4 sm:px-6 py-4 mb-4">
    <div className="rounded-[32px] bg-foreground text-background px-6 sm:px-10 py-9 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
      <div className="absolute -right-10 -top-20 w-64 h-64 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative"><p className="text-[10px] font-black tracking-[.35em] uppercase text-accent">The ScapeGoat edit</p><h2 className="mt-2 text-2xl sm:text-4xl font-black uppercase tracking-tight">Find the next thing<br />you’ll wear on repeat.</h2></div>
      <Link to="/shop" className="relative shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-accent text-accent-content text-xs font-black uppercase tracking-widest hover:opacity-90 transition"><span>Shop the collection</span><i className="ri-arrow-right-line" /></Link>
    </div>
  </section>
);

const Home = () => {
  return (
    <div className="w-full min-h-screen bg-background">
      {/* Hero Carousel Banners */}
      <motion.div layout transition={{ duration: 0.5, ease: "easeInOut" }}>
        <BannerCarousel page="home" placement="hero" />
      </motion.div>

      <StorePromises />

      {/* Original Hero Section */}
      <Hero />

      {/* Inline Grid Banners */}
      <motion.div layout transition={{ duration: 0.4, ease: "easeInOut" }}>
        <BannerCarousel page="home" placement="inline" />
      </motion.div>

      <ShopCallout />

      <motion.div layout transition={{ duration: 0.4, ease: "easeInOut" }}>
        <AllProducts />
      </motion.div>
    </div>
  );
};

export default Home;
