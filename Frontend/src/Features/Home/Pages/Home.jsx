import React from "react";
import Hero from "../Components/Hero";
import AllProducts from "../../Products/Pages/AllProducts";

const Home = () => {
  return (
    <div className="w-full min-h-screen bg-background">
      <Hero />
      <AllProducts />
    </div>
  );
};

export default Home;