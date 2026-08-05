import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "../Hooks/useWishlist";
import { useCart } from "../../Cart/Hooks/useCart";
import ProductCard from "../../Products/Components/ProductCard";
import WishlistSkeleton from "../Components/Skeletons/WishlistSkeleton";
import { PrimaryBtn } from "../../../Shared/Buttons";

const Wishlist = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { wishlist, loading } = useSelector((state) => state.wishlist);
  const { getWishlist, toggleWishlist } = useWishlist();
  const { handleAddToCart } = useCart();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!wishlist) {
      getWishlist();
    }
  }, [user, wishlist]);

  const handleMoveToCart = async (e, product) => {
    e.stopPropagation();
    try {
      await handleAddToCart(product, 1);
      await toggleWishlist(product._id);
    } catch (err) {
      console.error("Error moving item to cart:", err);
    }
  };

  if (loading && !wishlist) {
    return <WishlistSkeleton count={8} />;
  }

  const wishlistProducts = wishlist?.products || [];

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-20 px-4 md:px-10 max-w-[1400px] mx-auto">
      {/* Header Banner */}
      <header className="mb-12 border-b border-border-theme/40 pb-6">
        <span className="text-[10px] font-black tracking-[0.4em] uppercase text-accent mb-1 block">
          Your Saved Vault
        </span>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-foreground">
          My Wishlist
        </h1>
        <p className="text-foreground/50 text-sm mt-2 font-medium">
          Saved drops and exclusive pieces ready for checkout.
        </p>
      </header>

      {wishlistProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {wishlistProducts.map((product) => {
            if (!product || typeof product !== "object") return null;
            return (
              <div key={product._id} className="relative group">
                <ProductCard product={product} />

                {/* Quick Action Overlay inside wishlist card */}
                <div className="mt-2.5 px-1">
                  <button
                    type="button"
                    onClick={(e) => handleMoveToCart(e, product)}
                    className="w-full py-2 px-3 rounded-full bg-accent text-accent-content text-[10px] font-black tracking-widest uppercase hover:opacity-90 transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <i className="ri-shopping-bag-line text-xs" />
                    Move to Bag
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface/50 border border-dashed border-border-theme rounded-3xl p-16 text-center max-w-xl mx-auto flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <i className="ri-heart-line text-4xl" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1">Your wishlist is empty</h3>
            <p className="text-foreground/50 text-sm">
              Save items to your vault while browsing our latest drops and
              releases.
            </p>
          </div>
          <PrimaryBtn
            onClick={() => navigate("/shop")}
            className="mt-2"
            icon="ri-arrow-right-line"
          >
            Discover Products
          </PrimaryBtn>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
