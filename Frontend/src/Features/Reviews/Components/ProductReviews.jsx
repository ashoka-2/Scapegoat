import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import * as api from "../Services/review.api";
import { addToast } from "../../../utils/toast.slice";
import Modal from "../../../Components/Modal";
import socket from "../../../utils/socket";

const StarRating = ({ rating, setRating, interactive = false, size = "sm" }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const stars = [1, 2, 3, 4, 5];
  const starSizeClass = size === "lg" ? "text-2xl" : size === "md" ? "text-lg" : "text-sm";

  return (
    <div className="flex items-center gap-1">
      {stars.map((star) => {
        const isFilled = (hoverRating || rating) >= star;

        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`${starSizeClass} ${
              interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
            } transition-transform ${
              isFilled ? "text-amber-400 fill-amber-400" : "text-foreground/20"
            }`}
          >
            <i className={isFilled ? "ri-star-fill" : "ri-star-line"} />
          </button>
        );
      })}
    </div>
  );
};

const ProductReviews = ({ productId, sellerId }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [reviewsData, setReviewsData] = useState({
    total: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    canReview: false,
    userReview: null,
    reviews: [],
  });
  const [loading, setLoading] = useState(true);

  // Review Form Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState("");
  const [formComment, setFormComment] = useState("");
  const [formImages, setFormImages] = useState([]);
  const fileInputRef = useRef(null);

  // Lightbox photo preview state
  const [previewImage, setPreviewImage] = useState(null);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await api.fetchProductReviewsApi(productId);
      setReviewsData(data);
      if (data.userReview) {
        setFormRating(data.userReview.rating);
        setFormTitle(data.userReview.title);
        setFormComment(data.userReview.comment);
        setFormImages(data.userReview.images || []);
      }
    } catch (e) {
      console.error("Failed to load reviews:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      loadReviews();

      const onRealtimeUpdate = (payload) => {
        if (
          payload?.type === "review_updated" ||
          payload?.data?.type === "review_updated"
        ) {
          loadReviews();
        }
      };

      socket.on("realtime_update", onRealtimeUpdate);
      socket.on("review_updated", loadReviews);

      return () => {
        socket.off("realtime_update", onRealtimeUpdate);
        socket.off("review_updated", loadReviews);
      };
    }
  }, [productId, user]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (formImages.length + files.length > 3) {
      dispatch(addToast({ message: "You can upload a maximum of 3 photos.", type: "error" }));
      return;
    }

    files.forEach(async (file) => {
      if (!file.type.startsWith("image/")) {
        dispatch(addToast({ message: "Please select valid image files.", type: "error" }));
        return;
      }

      // Compress image to max 1000px and 75% quality JPEG
      const compressedDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let { width, height } = img;
            const maxDim = 1000;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.75));
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      });

      setFormImages((prev) => [...prev, compressedDataUrl].slice(0, 3));
    });
  };

  const handleRemoveImage = (index) => {
    setFormImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formComment.trim()) {
      dispatch(addToast({ message: "Headline and review comment are required.", type: "error" }));
      return;
    }

    setSubmitting(true);
    try {
      await api.submitReviewApi({
        productId,
        rating: formRating,
        title: formTitle.trim(),
        comment: formComment.trim(),
        images: formImages,
      });
      dispatch(addToast({ message: "Review posted successfully! 🎉", type: "success" }));
      setShowReviewModal(false);
      loadReviews();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit review.";
      dispatch(addToast({ message: msg, type: "error" }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await api.deleteReviewApi(reviewId);
      dispatch(addToast({ message: "Review deleted successfully.", type: "success" }));
      loadReviews();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete review.";
      dispatch(addToast({ message: msg, type: "error" }));
    }
  };

  const avgRating =
    reviewsData.total > 0
      ? (
          Object.entries(reviewsData.breakdown).reduce((acc, [star, cnt]) => acc + star * cnt, 0) /
          reviewsData.total
        ).toFixed(1)
      : "0.0";

  const userId = user?._id || user?.id;
  const isSellerOfProduct = sellerId && String(sellerId) === String(userId);
  const isAdmin = user?.role === "admin";

  return (
    <section className="space-y-8 font-sans pt-12 border-t border-border-theme/60">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase text-foreground tracking-tight">
            Customer Ratings & Reviews
          </h2>
          <p className="text-xs text-foreground/60">
            Real feedback from verified buyers on ScapeGoat
          </p>
        </div>

        {/* Write Review Button */}
        {user ? (
          reviewsData.canReview || reviewsData.userReview ? (
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-6 py-3 bg-accent text-accent-content font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:opacity-90 transition cursor-pointer flex items-center gap-2"
            >
              <i className="ri-pencil-line text-sm" />
              <span>{reviewsData.userReview ? "Edit Your Review" : "Write a Product Review"}</span>
            </button>
          ) : (
            <span className="text-xs font-semibold text-foreground/50 bg-background/50 border border-border-theme px-4 py-2 rounded-xl flex items-center gap-1.5">
              <i className="ri-lock-line text-amber-500" />
              Only verified buyers who purchased this item can review
            </span>
          )
        ) : (
          <span className="text-xs font-semibold text-foreground/50 bg-background/50 border border-border-theme px-4 py-2 rounded-xl">
            Log in to leave a review
          </span>
        )}
      </div>

      {/* Rating Summary Breakdown Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-surface border border-border-theme p-6 md:p-8 rounded-3xl shadow-lg">
        {/* Left: Overall Rating Score */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-border-theme/50 space-y-2">
          <span className="text-5xl font-mono font-black text-foreground">{avgRating}</span>
          <StarRating rating={Math.round(Number(avgRating))} size="lg" />
          <p className="text-xs font-bold text-foreground/60 uppercase tracking-wider">
            Based on {reviewsData.total} {reviewsData.total === 1 ? "Review" : "Reviews"}
          </p>
        </div>

        {/* Right: Star Distribution Bars */}
        <div className="md:col-span-8 space-y-2.5 flex flex-col justify-center">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviewsData.breakdown[star] || 0;
            const pct = reviewsData.total > 0 ? (count / reviewsData.total) * 100 : 0;

            return (
              <div key={star} className="flex items-center gap-3 text-xs font-bold">
                <span className="w-8 text-foreground/70 font-mono flex items-center justify-end gap-1">
                  {star} <i className="ri-star-fill text-amber-400 text-xs" />
                </span>
                <div className="flex-1 h-3 bg-background rounded-full overflow-hidden border border-border-theme/40">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 text-right font-mono text-foreground/50">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      {reviewsData.reviews.length === 0 ? (
        <div className="bg-surface border border-border-theme p-12 rounded-3xl text-center space-y-3">
          <i className="ri-chat-smile-2-line text-5xl text-foreground/30" />
          <h3 className="text-lg font-black uppercase text-foreground">No customer reviews yet</h3>
          <p className="text-xs text-foreground/50">
            Be the first verified buyer to share your opinion on this product!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviewsData.reviews.map((rev) => {
            const isAuthor = userId && rev.user?._id?.toString() === userId.toString();
            const canDelete = isAuthor || isAdmin || isSellerOfProduct;

            return (
              <div
                key={rev._id}
                className="bg-surface border border-border-theme p-6 rounded-3xl space-y-4 shadow-md transition hover:border-accent/30"
              >
                {/* Header: User avatar, name, verified badge & actions */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-accent/30 bg-background flex items-center justify-center font-bold text-accent shrink-0">
                      {rev.user?.profilePic ? (
                        <img src={rev.user.profilePic} alt={rev.user.fullname} className="w-full h-full object-cover" />
                      ) : (
                        <span>{(rev.user?.fullname || "U")[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          {rev.user?.fullname || "Verified Buyer"}
                        </span>
                        {rev.isVerifiedPurchase && (
                          <span className="text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <i className="ri-checkbox-circle-fill text-xs" /> Verified Buyer
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-foreground/50">
                        {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StarRating rating={rev.rating} />
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteReview(rev._id)}
                        className="text-foreground/40 hover:text-red-500 text-sm p-1.5 rounded-xl hover:bg-background transition cursor-pointer"
                        title="Delete Review"
                      >
                        <i className="ri-delete-bin-line" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Review Headline & Body */}
                <div className="space-y-1.5 text-xs">
                  <h4 className="font-black text-sm text-foreground">{rev.title}</h4>
                  <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{rev.comment}</p>
                </div>

                {/* Photos Gallery */}
                {rev.images && rev.images.length > 0 && (
                  <div className="flex gap-2 pt-2">
                    {rev.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Review photo ${idx + 1}`}
                        onClick={() => setPreviewImage(img)}
                        className="w-16 h-16 object-cover rounded-xl border border-border-theme hover:border-accent cursor-pointer transition"
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewModal && (
        <Modal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          title={reviewsData.userReview ? "Edit Your Review" : "Write a Product Review"}
          showFooterActions={false}
        >
          <form onSubmit={handleSubmitReview} className="space-y-5 font-sans">
            <div>
              <label className="text-xs font-bold text-foreground block mb-2">Overall Rating *</label>
              <StarRating rating={formRating} setRating={setFormRating} interactive size="lg" />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Review Headline *</label>
              <input
                type="text"
                required
                maxLength={120}
                placeholder="What's most important to know? (e.g. Excellent quality & fit!)"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full bg-background border border-border-theme rounded-xl px-4 py-2.5 text-xs text-foreground outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Detailed Review *</label>
              <textarea
                required
                rows={4}
                maxLength={1000}
                placeholder="What did you like or dislike? What did you use this product for?"
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                className="w-full bg-background border border-border-theme rounded-xl px-4 py-2.5 text-xs text-foreground outline-none focus:border-accent resize-none"
              />
            </div>

            {/* Photo Uploader (Max 3) */}
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                Upload Photos <span className="text-foreground/40 font-normal">(Max 3)</span>
              </label>

              <div className="flex items-center gap-3">
                {formImages.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-border-theme group">
                    <img src={img} alt="Upload preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                    >
                      <i className="ri-close-line" />
                    </button>
                  </div>
                ))}

                {formImages.length < 3 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-xl border-2 border-dashed border-border-theme hover:border-accent text-foreground/40 hover:text-accent flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition cursor-pointer"
                  >
                    <i className="ri-camera-add-line text-lg" />
                    <span>Add Photo</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border-theme">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2.5 rounded-xl border border-border-theme text-xs font-bold text-foreground hover:bg-background transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-accent text-accent-content text-xs font-black uppercase tracking-wider shadow-md hover:opacity-90 transition cursor-pointer flex items-center gap-2"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Photo Lightbox Preview Modal */}
      {previewImage && (
        <Modal isOpen={Boolean(previewImage)} onClose={() => setPreviewImage(null)} showFooterActions={false}>
          <div className="p-2 text-center">
            <img src={previewImage} alt="Review Preview" className="max-h-[75vh] w-auto mx-auto rounded-2xl border border-border-theme shadow-2xl" />
          </div>
        </Modal>
      )}
    </section>
  );
};

export default ProductReviews;
