import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAdmin } from "../Hooks/useAdmin";

const AdminProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProduct, loading, fetchProductDetailAdmin } = useAdmin();
  const [activeImg, setActiveImg] = useState("");

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

  if (loading || !currentProduct || currentProduct.product?._id !== id) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { product, reviews } = currentProduct;

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
                  ₹{(typeof product.price === "number" ? product.price : (product.price?.amount ?? product.price?.salePrice ?? product.price?.mrp ?? 0)).toLocaleString()}
                </span>
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

      {/* Product Variants & Attributes Table */}
      {product.variants?.length > 0 && (
        <div className="bg-surface border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
            <i className="ri-stack-line text-accent" /> Product Variations & Pricing ({product.variants.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-theme bg-background/50 text-[10px] font-black uppercase tracking-wider text-foreground/50">
                  <th className="py-3 px-4">Variant Name</th>
                  <th className="py-3 px-4">Attributes / Options</th>
                  <th className="py-3 px-4">Available Stock</th>
                  <th className="py-3 px-4">Variant Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme/40 text-xs font-semibold">
                {product.variants.map((v, idx) => {
                  const variantPrice = typeof v.price === "number" ? v.price : (v.price?.salePrice || v.price?.mrp || product.price?.salePrice || 0);
                  const variantMrp = typeof v.price === "object" ? v.price?.mrp : null;
                  return (
                    <tr key={idx} className="hover:bg-background/40">
                      <td className="py-3 px-4 font-bold text-foreground">{v.name || `Variant #${idx + 1}`}</td>
                      <td className="py-3 px-4">
                        {v.attributes && Object.keys(v.attributes).length > 0 ? (
                          <div className="flex gap-1.5 flex-wrap">
                            {Object.entries(v.attributes).map(([k, val]) => (
                              <span key={k} className="text-[10px] font-extrabold bg-accent/10 text-accent border border-accent/20 px-2.5 py-0.5 rounded-full">
                                {k}: {String(val)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-foreground/40 text-[10px] italic">Default Option</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span className={v.stock > 0 ? "text-emerald-500" : "text-red-500"}>
                          {v.stock ?? product.stock} units
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-foreground">
                        ₹{variantPrice.toLocaleString()}
                        {variantMrp && variantMrp > variantPrice && (
                          <span className="text-[10px] text-foreground/40 line-through ml-1.5 font-normal">
                            ₹{variantMrp.toLocaleString()}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
              <div key={rev._id} className="p-4 bg-background/50 border border-border-theme/40 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent font-black text-xs">
                      {(rev.user?.fullname || "U")[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-foreground">{rev.user?.fullname || "Verified Buyer"}</span>
                  </div>
                  <span className="text-xs font-mono font-black text-amber-500">
                    {"★".repeat(rev.rating)} ({rev.rating}/5)
                  </span>
                </div>
                <p className="text-xs font-bold text-foreground">{rev.title}</p>
                <p className="text-xs text-foreground/80">{rev.comment}</p>
              </div>
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
