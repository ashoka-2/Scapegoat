import React, { useState } from "react";
import { updateReviewAdminApi, deleteReviewAdminApi } from "../Services/admin.api";
import { useDispatch } from "react-redux";
import { addToast } from "../../../utils/toast.slice";

const AdminReviewCard = ({ review, onUpdateSuccess }) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit form state
  const [rating, setRating] = useState(review.rating || 5);
  const [title, setTitle] = useState(review.title || "");
  const [comment, setComment] = useState(review.comment || "");

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateReviewAdminApi(review._id, { rating, title, comment });
      if (res.success) {
        dispatch(addToast({ message: "Review updated successfully", type: "success" }));
        setIsEditing(false);
        if (onUpdateSuccess) onUpdateSuccess();
      }
    } catch (err) {
      dispatch(addToast({ message: err.response?.data?.message || "Failed to update review", type: "error" }));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this customer review?")) return;
    setLoading(true);
    try {
      const res = await deleteReviewAdminApi(review._id);
      if (res.success) {
        dispatch(addToast({ message: "Review deleted successfully", type: "success" }));
        if (onUpdateSuccess) onUpdateSuccess();
      }
    } catch (err) {
      dispatch(addToast({ message: err.response?.data?.message || "Failed to delete review", type: "error" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-background/50 border border-border-theme/60 rounded-2xl space-y-3 transition hover:border-accent">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-black text-xs shrink-0">
            {review.user?.profilePic ? (
              <img src={review.user.profilePic} alt={review.user?.fullname} className="w-full h-full object-cover rounded-full" />
            ) : (
              <span>{(review.user?.fullname || "U")[0].toUpperCase()}</span>
            )}
          </div>
          <div>
            <span className="text-xs font-extrabold text-foreground">{review.user?.fullname || "Customer"}</span>
            {review.user?.email && <p className="text-[10px] text-foreground/50">{review.user.email}</p>}
          </div>
        </div>

        {/* Rating Stars & Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
            {"★".repeat(review.rating)} ({review.rating}/5)
          </span>

          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 rounded-lg bg-surface border border-border-theme text-foreground/70 hover:text-accent hover:border-accent transition cursor-pointer text-xs"
            title="Edit Review"
          >
            <i className="ri-edit-line" />
          </button>

          <button
            onClick={handleDelete}
            disabled={loading}
            className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition cursor-pointer text-xs"
            title="Delete Review"
          >
            <i className="ri-delete-bin-line" />
          </button>
        </div>
      </div>

      {review.product && (
        <div className="text-[10px] font-bold text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
          <i className="ri-box-3-line" /> Product: {typeof review.product === "object" ? review.product.title : "Product"}
        </div>
      )}

      <div className="space-y-1">
        <h4 className="text-xs font-extrabold text-foreground">{review.title}</h4>
        <p className="text-xs text-foreground/80 leading-relaxed">{review.comment}</p>
      </div>

      {/* Edit Review Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-theme rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border-theme pb-3">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <i className="ri-edit-2-line text-accent" /> Edit Customer Review
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-foreground/40 hover:text-foreground text-lg cursor-pointer">
                <i className="ri-close-line" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground/70">Rating (1 to 5 Stars)</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full bg-background border border-border-theme rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-accent"
                >
                  <option value={5}>5 Stars ★★★★★</option>
                  <option value={4}>4 Stars ★★★★☆</option>
                  <option value={3}>3 Stars ★★★☆☆</option>
                  <option value={2}>2 Stars ★★☆☆☆</option>
                  <option value={1}>1 Star ★☆☆☆☆</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground/70">Review Headline / Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-background border border-border-theme rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground/70">Review Body Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full bg-background border border-border-theme rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-accent resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-background border border-border-theme text-xs font-bold text-foreground/70 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-accent text-accent-content text-xs font-bold hover:opacity-90 transition cursor-pointer"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewCard;
