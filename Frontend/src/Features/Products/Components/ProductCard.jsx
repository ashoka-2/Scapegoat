import React, { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, useAnimation } from "framer-motion";
import { addToast } from "../../../utils/toast.slice";
import { useCart } from "../../Cart/Hooks/useCart";
import { useWishlist } from "../../Wishlist/Hooks/useWishlist";

gsap.registerPlugin(ScrollTrigger);

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);
  const cardRef = useRef(null);
  const dragContainerRef = useRef(null);

  // States for the Draggable Cart
  const [isDragged, setIsDragged] = useState(false);
  const controls = useAnimation();

  // Ensure arrow starts at left: 0 on mount
  useEffect(() => {
    controls.set({ x: 0 });
  }, [controls]);

  useGSAP(
    () => {
      if (cardRef.current) {
        gsap.fromTo(
          cardRef.current,
          { opacity: 0, y: 30, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: cardRef.current,
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    },
    { scope: cardRef }
  );

  const { handleAddToCart: addToCartFn } = useCart();

  const handleAddToCart = async () => {
    if (!user) {
      dispatch(addToast({ message: "Please log in to add items to your cart", type: "info" }));
      navigate("/login");
      return;
    }

    if (!isDragged && product) {
      try {
        await addToCartFn(product);
        setIsDragged(true);
        setTimeout(() => {
          setIsDragged(false);
          controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
        }, 2000);
      } catch (error) {
        console.error("Cart error", error);
      }
    }
  };

  const { toggleWishlist } = useWishlist();
  const wishlist = useSelector((state) => state.wishlist?.wishlist);
  const isWishlisted = Boolean(
    wishlist?.products?.some((p) => {
      const id = typeof p === "object" ? p?._id || p?.id : p;
      return String(id) === String(product?._id);
    })
  );

  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    if (!user) {
      dispatch(addToast({ message: "Please log in to save to wishlist", type: "info" }));
      navigate("/login");
      return;
    }
    await toggleWishlist(product._id);
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

  // Price calculations supporting ScapeGoat schema
  const saleAmount =
    product?.sellingPrice?.amount ||
    product?.price?.saleAmount ||
    (product?.discount ? product.sellingPrice?.amount : null);

  const maxAmount = product?.maxPrice?.amount || product?.price?.amount || 0;
  const currency = product?.sellingPrice?.currency || product?.maxPrice?.currency || product?.price?.currency || "INR";

  const hasDiscount = saleAmount && maxAmount && Number(saleAmount) < Number(maxAmount);
  const currentPrice = saleAmount || maxAmount;

  const isOutOfStock =
    product?.stockStatus === "outofstock" || (product?.stock !== undefined && product.stock <= 0);

  const defaultImage =
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

  const title = product?.title || "Premium Apparel";
  const categoryName = product?.category?.name || product?.brand?.name || "ScapeGoat Drop";
  const image =
    product?.images?.[0]?.url ||
    (typeof product?.images?.[0] === "string" ? product.images[0] : null) ||
    defaultImage;

  const formatPrice = (amt, currCode = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currCode,
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  return (
    <div
      ref={cardRef}
      onClick={() => navigate(`/product/${product?._id || product?.slug}`)}
      className="group relative bg-surface dark:bg-[#121212] border border-border-theme/30 rounded-[2.2rem] w-full max-w-[240px] mx-auto shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex-shrink-0 cursor-pointer p-2.5"
    >
      {/* Image Container with Inset Padding */}
      <div className="relative w-full aspect-[4/5] rounded-[1.6rem] overflow-hidden bg-background-alt">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
          loading="lazy"
        />

        {/* Top Badges & Wishlist Heart */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-20">
          <div
            className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-[0.2em] backdrop-blur-md border ${
              !isOutOfStock
                ? "bg-green-500/10 text-green-500 border-green-500/20"
                : "bg-red-500/10 text-red-500 border-red-500/20"
            }`}
          >
            {!isOutOfStock
              ? product?.stock !== undefined && product.stock > 0
                ? `${product.stock} IN STOCK`
                : "IN STOCK"
              : "OUT OF STOCK"}
          </div>

          <button
            onClick={handleToggleWishlist}
            className={`w-7 h-7 rounded-full backdrop-blur-md flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all ${
              isWishlisted
                ? "bg-red-500/15 text-red-500 border border-red-500/30"
                : "bg-background/80 hover:bg-background text-foreground/45"
            }`}
          >
            <i className={isWishlisted ? "ri-heart-fill text-xs text-red-500" : "ri-heart-line text-xs"} />
          </button>
        </div>
      </div>

      <div className="px-2 pt-3 pb-1">
        <div className="flex flex-col mb-3">
          <h4 className="font-bold text-[11px] mb-0.5 tracking-tight truncate uppercase leading-none text-foreground">
            {title}
          </h4>
          <p className="text-[8px] text-accent font-bold tracking-[0.25em] uppercase truncate h-3">
            {categoryName}
          </p>
        </div>

        {/* Original Style Refined Slide to Cart */}
        <div
          ref={dragContainerRef}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-background border border-border-theme/40 rounded-full flex items-center w-full shadow-sm overflow-hidden h-9 touch-none"
          style={{ transition: "background-color 0.3s" }}
        >
          <div
            className={`absolute inset-0 bg-accent transition-opacity duration-300 ${
              isDragged ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Text Background (Price Refresh) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {isDragged ? (
              <span className="font-bold text-[8px] text-accent-content tracking-[0.3em] uppercase animate-pulse">
                Added to Bag
              </span>
            ) : (
              <div className="ml-10 flex items-center gap-2 overflow-hidden px-2 w-full justify-center">
                {/* Desktop: Dynamic Reveal */}
                <div className="hidden lg:flex items-center gap-2 transition-all duration-500">
                  {!hasDiscount ? (
                    <span className="font-bold text-[8px] text-foreground/40 tracking-[0.25em] uppercase whitespace-nowrap">
                      Slide to Bag • {formatPrice(currentPrice, currency)}
                    </span>
                  ) : (
                    <div className="relative h-4 overflow-hidden flex items-center justify-center min-w-[100px]">
                      {/* Default State: Just Sale Price */}
                      <span className="absolute inset-0 flex items-center justify-center font-bold text-[8px] tracking-[0.25em] transition-all duration-500 uppercase group-hover:translate-y-[-100%] group-hover:opacity-0 text-accent">
                        Sale • {formatPrice(currentPrice, currency)}
                      </span>
                      {/* Hover State: Struck MRP + Sale Price */}
                      <div className="absolute inset-0 flex items-center justify-center translate-y-[100%] group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                        <span className="text-foreground/30 line-through text-[7px] mr-1 uppercase">
                          {formatPrice(maxAmount, currency)}
                        </span>
                        <span className="text-foreground/80 font-black text-[8px] tracking-widest uppercase">
                          {formatPrice(currentPrice, currency)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile/Tablet: Direct Price */}
                <div className="lg:hidden flex items-center gap-2">
                  {hasDiscount ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-foreground/30 line-through text-[7px] font-bold uppercase">
                        {formatPrice(maxAmount, currency)}
                      </span>
                      <span className="text-foreground/80 font-black text-[8px] tracking-[0.25em] uppercase">
                        {formatPrice(currentPrice, currency)}
                      </span>
                    </div>
                  ) : (
                    <span className="font-bold text-[8px] text-foreground/40 tracking-[0.25em] uppercase">
                      {formatPrice(currentPrice, currency)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Draggable Circle */}
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
                isDragged
                  ? "ri-check-line text-lg font-black"
                  : "ri-arrow-right-s-line text-lg font-bold pointer-events-none"
              }
            ></i>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
