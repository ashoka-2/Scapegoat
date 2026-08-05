# ScapeGoat — Frontend Implementation & Real-time Features Checklist

This document preserves all backend architectural decisions, Socket.io event hooks, AI features, and user experience flows for reference when building the Frontend.

---

## 1. ⚡ Real-Time Socket.io Events & Behaviors

### A. Product Publishing (`product_published`)
- **Backend Trigger:** `createProduct` or `restoreProduct` when `status === "published"`.
- **Frontend Action:**
  - Display a live **"Just Dropped!"** toast notification in the screen corner: *"🔥 New Arrival: [Product Title] just dropped!"* with a *"View Product"* link.
  - Automatically slide the new product into the homepage **New Arrivals** grid without a page refresh.

### B. Product Updating (`product_updated`)
- **Backend Trigger:** `updateProduct` when price, stock, or status changes.
- **Frontend Action:**
  - If a user is currently viewing the single product detail page, live-update the price, stock badge (*"Only 2 Left!"* / *"Out of Stock"*), and details.

### C. Product Deletion / Unlisting (`product_deleted`)
- **Backend Trigger:** `deleteProduct` (when moved to trash).
- **Frontend Action:**
  - If a customer is currently viewing the single product page of that item, show a modal/toast: *"This product has been unlisted or removed by the seller."*
  - Automatically redirect the user back to `/shop` or homepage smoothly.

### D. Private Cart & Wishlist Sync (`cart_updated` & `wishlist_updated`)
- **Backend Trigger:** `emitToUser(userId, "cart_updated")` and `emitToUser(userId, "wishlist_updated")`.
- **Frontend Action:**
  - Syncs cart and wishlist badge counters in real-time across all open tabs/devices of the logged-in user.

### E. Seller Order Alert (`seller_new_order`)
- **Backend Trigger:** `emitToSeller(sellerId, "new_order")`.
- **Frontend Action:**
  - Plays a audio notification chime on the seller's dashboard: *"Ding! You received a new order!"* and updates their active orders list.

---

## 2. 🧠 AI & Advanced Features

### A. Local AI Vector Search (Semantic Text Search)
- **Model:** `@xenova/transformers` (`all-MiniLM-L6-v2`, 384 dimensions).
- **Frontend Bar:** Smart search input that understands prompt intent (e.g. *"cool outfit for summer party"*).
- **Backend Utility:** `aiEmbedding.js` -> `generateTextEmbedding()`.

### B. Photo / Camera Visual Search (Google Lens Style)
- **Model:** `CLIP` (`clip-vit-base-patch32`).
- **Frontend UI:** Camera icon button in search bar allowing users to snap/upload a photo from their camera/gallery.
- **Backend Utility:** `aiEmbedding.js` -> `generateImageEmbedding()`.

### C. Snap2Bill (In-Store POS Quick Billing)
- **Frontend UI:** Seller tab in Dashboard with live camera scanner.
- **Workflow:** Seller snaps a photo of a physical item on their counter -> backend matches image embedding in <50ms -> adds to active bill draft -> 1-tap PDF / WhatsApp invoice -> auto-decrements MongoDB stock.

### D. High-Scale AI Vector Indexing (`$vectorSearch`)
- **Per-Image & Variant Embeddings:** Every image in `product.images` (up to 7) and `variant.images` (up to 7 per variant) stores its own visual vector embedding for granular matching.
- **Root-Level `imageEmbedding`:** Serves as a fast primary cover photo vector shortcut.
- **High-Scale Performance (MongoDB Atlas `$vectorSearch`):** When scaling to 100,000+ products, MongoDB Atlas `$vectorSearch` uses HNSW (Hierarchical Navigable Small World) spatial graph indexing to return top matching items in <15ms ($O(\log N)$ time) directly on the database engine.

---

## 3. 📜 Storefront UX Best Practices

### A. Infinite Scroll
- **APIs:** `GET /api/products`, `/category/:id`, `/brand/:id`, `/seller/:id`.
- **Metadata:** `{ count, total, page, pages, data }`.
- **Frontend Logic:** Detect bottom scroll threshold -> request `?page=N` -> append `[...prev, ...newProducts]`.

### B. Image Constraints
- Max **7 images** for main product.
- Max **7 images** per product variant.
- Hosted on ImageKit CDN via `imageKit.service.js`.
