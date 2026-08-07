import React from "react";
import Hero from "../Components/Hero";
import BannerCarousel from "../Components/BannerCarousel";
import AllProducts from "../../Products/Pages/AllProducts";
import { motion } from "framer-motion";

const Home = () => {
  return (
    <div className="w-full min-h-screen bg-background">
      {/* Hero Carousel Banners */}
      <motion.div layout transition={{ duration: 0.5, ease: "easeInOut" }}>
        <BannerCarousel page="home" placement="hero" />
      </motion.div>

      {/* Original Hero Section */}
      <Hero />

      {/* Inline Grid Banners */}
      <motion.div layout transition={{ duration: 0.4, ease: "easeInOut" }}>
        <BannerCarousel page="home" placement="inline" />
      </motion.div>

      <motion.div layout transition={{ duration: 0.4, ease: "easeInOut" }}>
        <AllProducts />
      </motion.div>
    </div>
  );
};

export default Home;