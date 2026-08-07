import React from "react";
import Hero from "../Components/Hero";
import BannerCarousel from "../Components/BannerCarousel";
import AllProducts from "../../Products/Pages/AllProducts";
import { motion } from "framer-motion";

const Home = () => {
  return (
    <div className="w-full min-h-screen bg-background">
      {/* Original Hero Section */}
      <Hero />

      {/* Banner Carousel — appears below Hero when admin adds banners */}
      {/* Smooth layout transition: if banner carousel height differs, content below animates smoothly */}
      <motion.div
        layout
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <BannerCarousel />
      </motion.div>

      <motion.div
        layout
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <AllProducts />
      </motion.div>
    </div>
  );
};

export default Home;