import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useDispatch, useSelector } from "react-redux";
import { motion, useAnimation } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useProduct } from "../../Products/Hooks/useProduct";
import { addToast } from "../../../utils/toast.slice";

const ProductCardItem = ({ product }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const dragContainerRef = useRef(null);
  const [isDragged, setIsDragged] = useState(false);
  const controls = useAnimation();

  // Lock arrow to left: 0 on mount
  useEffect(() => {
    controls.set({ x: 0 });
  }, [controls, product]);

  const handleAddToCart = async () => {
    if (!isDragged && product) {
      setIsDragged(true);
      try {
        dispatch(
          addToast({
            message: `🛒 ${product.title || "Product"} added to your cart!`,
            type: "success",
          })
        );
      } catch (err) {
        console.error(err);
      } finally {
        setTimeout(() => {
          setIsDragged(false);
          controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
        }, 1500);
      }
    }
  };

  const handleDragEnd = (event, info) => {
    if (info.offset.x > 100) {
      handleAddToCart();
      if (dragContainerRef.current) {
        controls.start({ x: dragContainerRef.current.clientWidth - 40 });
      }
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 25 } });
    }
  };

  const saleP = product?.sellingPrice?.amount || product?.price?.saleAmount;
  const origP = product?.maxPrice?.amount || product?.price?.amount;

  const hasDiscount = saleP && origP && Number(saleP) < Number(origP);
  const isOutOfStock = product?.stock !== undefined ? product.stock <= 0 : product?.stockStatus === "outofstock";
  const badgeText = hasDiscount ? "SALE" : isOutOfStock ? "OUT OF STOCK" : "NEW DROP";

  const displayImage =
    product?.images?.[0]?.url ||
    (typeof product?.images?.[0] === "string" ? product.images[0] : null) ||
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

  const displaySubtitle = product?.shortDescription
    ? product.shortDescription.length > 28
      ? product.shortDescription.slice(0, 28) + "..."
      : product.shortDescription
    : product?.description
    ? product.description.length > 28
      ? product.description.slice(0, 28) + "..."
      : product.description
    : "Premium urban drop.";

  const priceVal = saleP || origP || 0;
  const displayPrice = `₹${Number(priceVal).toLocaleString("en-IN")}`;

  return (
    <div
      onClick={() => navigate(`/product/${product?._id || product?.slug}`)}
      className={`bg-surface dark:bg-[#1C1C1E] text-foreground p-3 rounded-[2.5rem] w-[240px] shadow-md lg:shadow-2xl relative border border-white/10 dark:border-white/10 transition-colors flex-shrink-0 snap-center cursor-pointer group`}
    >
      <div className="w-full h-auto rounded-[1.7rem] overflow-hidden mb-4 bg-background relative">
        <img
          src={displayImage}
          alt={product?.title || "Product"}
          className="w-full h-[180px] object-cover object-top transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 bg-white/90 dark:bg-accent text-[#131313] dark:text-accent-content text-[10px] font-black px-2 py-1 rounded-lg shadow-sm">
          {badgeText}
        </div>
      </div>
      <div className="px-2 pb-2 text-center" onClick={(e) => e.stopPropagation()}>
        <h4 className="font-bold text-sm mb-0.5 tracking-tight truncate text-foreground">{product?.title || "Product"}</h4>
        <p className="text-[10px] text-foreground/60 font-serif italic mb-4 truncate">{displaySubtitle}</p>

        {/* Draggable Slide-to-Cart Button */}
        <div
          ref={dragContainerRef}
          className="relative border border-accent/30 rounded-full flex items-center w-full shadow-sm overflow-hidden h-10 touch-none"
          style={{
            backgroundColor: isDragged ? "var(--color-accent)" : "transparent",
            transition: "background-color 0.3s",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {isDragged ? (
              <span className="font-black text-xs text-accent-content tracking-widest uppercase animate-pulse">
                Added
              </span>
            ) : (
              <span className="font-black text-xs text-accent/70 dark:text-accent/60 tracking-widest pointer-events-none ml-6">
                SLIDE • {displayPrice}
              </span>
            )}
          </div>
          <motion.div
            drag={isDragged ? false : "x"}
            initial={{ x: 0 }}
            dragConstraints={dragContainerRef}
            dragElastic={0}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            animate={controls}
            className="h-full aspect-square bg-accent text-accent-content rounded-full shadow-md z-10 flex items-center justify-center cursor-grab active:cursor-grabbing absolute left-0"
          >
            <i
              className={
                isDragged ? "ri-check-line text-lg font-black" : "ri-arrow-right-s-line text-lg pointer-events-none"
              }
            ></i>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = () => {
  const { handleFetchAllProducts } = useProduct();
  const reduxProducts = useSelector((state) => state.product.products) || [];
  const [localProducts, setLocalProducts] = useState([]);

  useEffect(() => {
    if (!reduxProducts || reduxProducts.length === 0) {
      handleFetchAllProducts();
    }
  }, [handleFetchAllProducts, reduxProducts]);

  const allProducts = reduxProducts.length > 0 ? reduxProducts : localProducts;
  const featuredProducts = allProducts.slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const desktopCardRef = useRef(null);

  useEffect(() => {
    if (featuredProducts.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % featuredProducts.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [featuredProducts.length]);

  useGSAP(() => {
    if (desktopCardRef.current && featuredProducts.length > 0) {
      gsap.fromTo(
        desktopCardRef.current,
        { opacity: 0, y: 15, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }
      );
    }
  }, [currentIndex, featuredProducts.length]);

  if (featuredProducts.length === 0) {
    return (
      <div className="flex flex-col items-center lg:items-end mt-auto relative z-20 pb-8 lg:pb-0 w-full overflow-hidden">
        <div className="w-[240px] p-6 text-center border border-dashed border-white/20 rounded-[2.5rem]">
          <p className="text-[10px] text-foreground/50 font-bold uppercase tracking-widest">Loading Drops...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center lg:items-end mt-auto relative z-20 pb-8 lg:pb-0 w-full overflow-hidden">
      <div className="w-full text-left lg:text-right px-6 lg:px-0 mb-3 lg:mb-2">
        <p className="font-black tracking-[0.1em] text-foreground/80 lg:text-white/50 dark:text-accent uppercase text-lg mt-5 lg:mt-0 lg:text-[10px] lg:mr-4">
          Featured Products
        </p>
      </div>

      {/* Desktop View: Auto-carousel with single card */}
      <div className="hidden lg:flex flex-col items-end">
        <div ref={desktopCardRef}>
          <ProductCardItem product={featuredProducts[currentIndex]} />
        </div>
        <div className="flex gap-2 mt-4 justify-center w-[240px]">
          {featuredProducts.map((_, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex
                  ? "bg-accent w-4 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  : "bg-foreground/30 hover:bg-foreground/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Mobile View: Horizontal Scroll */}
      <div className="flex lg:hidden w-full overflow-x-auto snap-x snap-mandatory gap-4 px-6 pb-6 pt-2 scrollbar-hide">
        {featuredProducts.map((product, idx) => (
          <ProductCardItem key={product._id || idx} product={product} />
        ))}
      </div>
    </div>
  );
};

const RightInfo = ({
  features = [
    { title: "Future\nThreads", iconClass: "ri-price-tag-3-line" },
    { title: "Unique\nDesigns", iconClass: "ri-quill-pen-line" },
    { title: "Limited\nDrops", iconClass: "ri-time-line" },
  ],
}) => {
  return (
    <div className="w-full flex flex-col lg:text-white text-foreground z-10 relative lg:items-end">
      <div className="flex justify-center lg:justify-between gap-10 sm:gap-14 lg:gap-0 mt-0 lg:mt-0 mb-4 lg:mb-4 px-2 lg:px-0 lg:w-[240px]">
        {features.map((feature, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2 group cursor-pointer lg:w-1/3">
            <div className="lg:bg-white/10 bg-accent/10 dark:bg-accent/10 w-16 h-16 lg:w-11 lg:h-11 rounded-[16px] lg:rounded-full group-hover:bg-white/20 transition-colors backdrop-blur-md shadow-sm border border-border-theme flex items-center justify-center">
              <i className={`${feature.iconClass} text-2xl lg:text-lg lg:text-white text-accent dark:text-accent`}></i>
            </div>
            <p className="text-[9px] lg:text-[7px] text-center font-black opacity-80 lg:text-white/80 dark:text-gray-400 tracking-[0.2em] whitespace-pre-line uppercase">
              {feature.title}
            </p>
          </div>
        ))}
      </div>

      <FeatureCard />
    </div>
  );
};

export default RightInfo;
