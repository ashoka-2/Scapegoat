import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAdmin } from "../Hooks/useAdmin";
import AdminReviewCard from "../Components/AdminReviewCard";
import AdminProductDetailSkeleton from "../Components/Skeletons/AdminProductDetailSkeleton";

const AdminProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProduct, loading, fetchProductDetailAdmin } = useAdmin();
  const [activeImg, setActiveImg] = useState("");
  const [expandedVariants, setExpandedVariants] = useState({});

  useEffect(() => {
    if (id) {
      fetchProductDetailAdmin(id);
    }
  }, [id]);

  useEffect(() => {
    if (currentProduct?.product?.images?.length > 0) {
      const primary = currentProduct.product.images.find((i) => i.isPrimary);
      setActiveImg(primary ? primary.url : currentProduct.product.images[0].url);
    }
  }, [currentProduct]);

  const toggleVariantExpand = (idx) => {
    setExpandedVariants((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  if (loading || !currentProduct || currentProduct.product?._id !== id) {
    return <AdminProductDetailSkeleton />;
  }

  const { product, reviews } = currentProduct;

  const basePriceVal =
    typeof product.price === "number"
      ? product.price
      : product.price?.amount ??
        product.price?.salePrice ??
        product.price?.mrp ??
        product.sellingPrice?.amount ??
        product.maxPrice?.amount ??
        product.variants?.[0]?.price?.amount ??
        product.variants?.[0]?.price?.salePrice ??
        (typeof product.variants?.[0]?.price === "number" ? product.variants[0].price : 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Back Link */}
      <button
        onClick={() => navigate("/admin/products")}
        className="flex items-center gap-2 text-xs font-bold text-accent hover:underline cursor-pointer"
      >
        <i className="ri-arrow-left-line text-sm" /> Back to Products Catalog
      </button>

      {/* Main Product Overview Grid */}
      <div className="bg-surface border border-border-theme rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Images Gallery */}
          <div className="space-y-4">
            <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-border-theme bg-background">
              {activeImg ? (
                <img src={activeImg} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-foreground/30">
                  <i className="ri-image-line text-4xl" />
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images?.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImg(img.url)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                      activeImg === img.url ? "border-accent scale-105" : "border-border-theme opacity-70"
                    }`}
                  >
                    <img src={img.url} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info & Specs */}
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">
                {product.category?.name || "Uncategorized"} • {product.brand?.name || "No Brand"}
              </span>
              <h1 className="text-2xl font-black text-foreground mt-1">{product.title}</h1>
              <p className="text-xs font-mono text-foreground/50 mt-0.5">
                SKU / ID: {product._id}
              </p>
            </div>

            {/* Pricing Summary */}
            <div className="p-4 bg-background/60 border border-border-theme rounded-2xl space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-foreground/50">Base Price</span>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-mono font-black text-foreground">
                  ₹{basePriceVal.toLocaleString()}
                </span>
                {product.price?.mrp > basePriceVal && (
                  <span className="text-sm font-mono text-foreground/40 line-through">
                    ₹{product.price.mrp.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Seller & Stock Meta */}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="p-3 bg-background/40 border border-border-theme/40 rounded-xl space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-foreground/50">Seller Partner</span>
                <p className="font-bold text-foreground">{product.seller?.fullname || "Unknown"}</p>
                <p className="text-[10px] text-foreground/50">{product.seller?.email}</p>
              </div>

              <div className="p-3 bg-background/40 border border-border-theme/40 rounded-xl space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-foreground/50">Stock Quantity</span>
                <p className="font-bold font-mono text-foreground">{product.stock} units</p>
                <span className={`text-[9px] font-black uppercase ${product.stock > 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {product.stock > 0 ? "In Stock" : "Out of Stock"}
                </span>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground/60">Product Description</h3>
                <div
                  className="prose dark:prose-invert max-w-none text-xs text-foreground/90 leading-relaxed bg-background/40 p-4 rounded-2xl border border-border-theme/40 space-y-2 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Variants & Attributes Table with Collapsible Variant Images */}
      {product.variants?.length > 0 && (
        <div className="bg-surface border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
              <i className="ri-stack-line text-accent" /> Product Variations & Pricing ({product.variants.length})
            </h2>
          </div>

          <div className="space-y-3">
            {product.variants.map((v, idx) => {
              const variantPrice =
                typeof v.price === "number"
                  ? v.price
                  : v.price?.amount ?? v.price?.salePrice ?? v.price?.mrp ?? basePriceVal;
              const variantMrp = typeof v.price === "object" ? v.price?.mrp : null;
              const isExpanded = !!expandedVariants[idx];
              const variantImages = v.images || (v.image ? [{ url: v.image }] : []);

              return (
                <div key={idx} className="bg-background/40 border border-border-theme/60 rounded-2xl p-4 space-y-3 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-accent/10 text-accent font-mono font-black flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-extrabold text-foreground">{v.name || `Variant ${idx + 1}`}</p>
                        {v.attributes && Object.keys(v.attributes).length > 0 ? (
                          <div className="flex gap-1.5 flex-wrap mt-1">
                            {Object.entries(v.attributes).map(([k, val]) => (
                              <span key={k} className="text-[10px] font-extrabold bg-accent/10 text-accent border border-accent/20 px-2.5 py-0.5 rounded-full">
                                {k}: {String(val)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-foreground/40 text-[10px] italic">Default Option</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="font-mono font-black text-foreground text-sm">
                          ₹{variantPrice.toLocaleString()}
                          {variantMrp && variantMrp > variantPrice && (
                            <span className="text-[10px] text-foreground/40 line-through ml-1.5 font-normal">
                              ₹{variantMrp.toLocaleString()}
                            </span>
                          )}
                        </p>
                        <p className={`text-[10px] font-bold ${v.stock > 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {v.stock ?? product.stock} in stock
                        </p>
                      </div>

                      {variantImages.length > 0 ? (
                        <button
                          onClick={() => toggleVariantExpand(idx)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/20 text-accent font-bold text-xs hover:bg-accent hover:text-accent-content transition cursor-pointer"
                        >
                          <i className="ri-image-line" />
                          <span>{variantImages.length} {variantImages.length === 1 ? "Image" : "Images"}</span>
                          <i className={isExpanded ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} />
                        </button>
                      ) : (
                        <span className="text-[10px] text-foreground/40 italic px-2 py-1 bg-surface rounded-lg">
                          No Variant Images
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Collapsible Gallery Component */}
                  {isExpanded && variantImages.length > 0 && (
                    <div className="pt-3 border-t border-border-theme/40 animate-in fade-in space-y-2">
                      <p className="text-[10px] font-black uppercase text-foreground/50 tracking-wider">
                        Uploaded Variant Gallery ({variantImages.length})
                      </p>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {variantImages.map((imgObj, imgIdx) => {
                          const imgUrl = typeof imgObj === "string" ? imgObj : imgObj.url;
                          const isPrimary = typeof imgObj === "object" && imgObj.isPrimary;

                          return (
                            <div
                              key={imgIdx}
                              onClick={() => setActiveImg(imgUrl)}
                              className="relative group w-20 h-24 rounded-xl overflow-hidden border border-border-theme shrink-0 bg-background cursor-pointer hover:border-accent transition"
                            >
                              <img src={imgUrl} alt={`Variant ${idx} Img ${imgIdx}`} className="w-full h-full object-cover" />
                              {isPrimary && (
                                <span className="absolute top-1 left-1 text-[8px] font-black bg-accent text-accent-content px-1.5 py-0.5 rounded shadow">
                                  Primary
                                </span>
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">
                                Preview
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer Reviews Section */}
      <div className="bg-surface border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
          <i className="ri-star-fill text-amber-500" /> Verified Customer Reviews ({reviews?.length || 0})
        </h2>

        <div className="space-y-3">
          {reviews?.length > 0 ? (
            reviews.map((rev) => (
              <AdminReviewCard
                key={rev._id}
                review={rev}
                onUpdateSuccess={() => fetchProductDetailAdmin(id)}
              />
            ))
          ) : (
            <p className="text-xs text-foreground/40 italic py-4 text-center">No reviews submitted for this product yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProductDetailPage;
