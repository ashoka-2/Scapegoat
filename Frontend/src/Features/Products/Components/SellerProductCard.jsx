import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const SellerProductCard = ({ product, onEdit, onDelete, onPublish }) => {
  const navigate = useNavigate();
  const cardRef = useRef(null);

  useGSAP(
    () => {
      gsap.from(cardRef.current, {
        opacity: 0,
        scale: 0.9,
        y: 20,
        duration: 0.5,
        ease: "back.out(1.7)",
      });
    },
    { scope: cardRef }
  );

  const handleCardClick = () => {
    const tl = gsap.timeline();
    tl.to(cardRef.current, {
      scale: 1.05,
      duration: 0.2,
      ease: "power2.out",
    }).to(cardRef.current, {
      scale: 1,
      duration: 0.4,
      ease: "elastic.out(1, 0.3)",
    });
    setTimeout(() => {
      navigate(`/product/${product?._id || product?.slug}`);
    }, 150);
  };

  const amount =
    product?.sellingPrice?.amount || product?.maxPrice?.amount || product?.price?.amount || 0;
  const currency =
    product?.sellingPrice?.currency || product?.maxPrice?.currency || product?.price?.currency || "INR";

  const formatPrice = (amt, currCode = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currCode,
      maximumFractionDigits: 0,
    }).format(amt);
  };

  const isPublished = product?.status === "published" || product?.status === "active";
  const displayImage =
    product?.images?.[0]?.url ||
    (typeof product?.images?.[0] === "string" ? product.images[0] : null) ||
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&q=80";

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      className="group relative bg-surface border border-border-theme rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 transform"
    >
      {/* Image Section */}
      <div className="relative w-full aspect-square overflow-hidden bg-background">
        <img
          src={displayImage}
          alt={product?.title || "Product"}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Status Badge */}
        <div className="absolute top-2 left-2 z-10">
          <span
            className={`text-[8px] font-black tracking-widest uppercase px-2 py-1 rounded-lg backdrop-blur-md border ${
              isPublished
                ? "bg-green-500/20 text-green-500 border-green-500/20"
                : "bg-amber-500/20 text-amber-500 border-amber-500/20"
            }`}
          >
            {isPublished ? "✅ Published" : "📝 Draft"}
          </span>
        </div>

        {/* Actions Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          {!isPublished && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (typeof onPublish === "function") {
                  onPublish(product._id);
                }
              }}
              className="w-10 h-10 rounded-full bg-accent text-accent-content flex items-center justify-center hover:scale-110 transition-transform shadow-lg active:scale-90"
              title="Publish Now"
            >
              <i className="ri-checkbox-circle-line text-xl"></i>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (typeof onEdit === "function") onEdit(product);
              else navigate(`/products/edit/${product._id}`);
            }}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-accent hover:text-accent-content transition-colors shadow-lg active:scale-90"
            title="Edit Product"
          >
            <i className="ri-pencil-line text-lg"></i>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (typeof onDelete === "function") onDelete(product._id);
            }}
            className="w-10 h-10 rounded-full bg-white text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors shadow-lg active:scale-90"
            title="Delete Product"
          >
            <i className="ri-delete-bin-line text-lg"></i>
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3 bg-surface/80 backdrop-blur-md">
        <h4 className="font-bold text-xs truncate mb-1 text-foreground">{product?.title}</h4>
        <div className="flex justify-between items-center">
          <span className="text-accent font-black text-[10px] tracking-wider uppercase">
            {formatPrice(amount, currency)}
          </span>
          <span className="text-[9px] text-foreground/50 font-bold px-2 py-0.5 bg-background rounded-full">
            {product?.stock !== undefined ? `${product.stock} left` : "In stock"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SellerProductCard;
