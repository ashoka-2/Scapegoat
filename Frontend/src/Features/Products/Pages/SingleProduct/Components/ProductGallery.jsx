import React from "react";

/**
 * ProductGallery — main image with hover zoom + thumbnail strip.
 * The gallery images are derived by the parent (selected variant / color
 * inheritance), so this component is purely presentational.
 */
export default function ProductGallery({
  product,
  galleryImages,
  activeImageIndex,
  setActiveImageIndex,
  isZoomed,
  setIsZoomed,
  zoomPos,
  handleMouseMoveZoom,
  discountPercent,
  isWishlisted,
  handleToggleWishlist,
}) {
  return (
    <div className="lg:col-span-6 space-y-4">
      <div
        className="relative w-full h-[450px] sm:h-[520px] rounded-3xl overflow-hidden bg-background border border-border-theme shadow-lg group cursor-crosshair"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMoveZoom}
      >
        <img
          src={galleryImages[activeImageIndex]}
          alt={product.title}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            isZoomed ? "scale-200" : "scale-100"
          }`}
          style={isZoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
        />

        {/* Badges & Wishlist Overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
          <div className="flex flex-col gap-2 items-start max-w-[80%] pointer-events-auto">
            {discountPercent > 0 && (
              <span className="w-fit inline-flex items-center px-3.5 py-1.5 rounded-full bg-accent text-accent-content text-xs font-black tracking-wider uppercase shadow-md whitespace-nowrap">
                -{discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Wishlist Heart Button Overlay */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all pointer-events-auto cursor-pointer ${
              isWishlisted
                ? "bg-red-500/20 text-red-500 border border-red-500/40"
                : "bg-background/80 hover:bg-background text-foreground/60"
            }`}
            title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
          >
            <i className={isWishlisted ? "ri-heart-fill text-lg text-red-500" : "ri-heart-line text-lg"} />
          </button>
        </div>
      </div>

      {/* Thumbnails Carousel (Shows ONLY Selected Variant / Color Photos) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase text-foreground/50 tracking-wider">
            Product Photos ({galleryImages.length})
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {galleryImages.map((imgUrl, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImageIndex(idx)}
              className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                activeImageIndex === idx
                  ? "border-accent ring-4 ring-accent/20 scale-105 shadow-md"
                  : "border-border-theme hover:border-foreground/40 opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={imgUrl}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
