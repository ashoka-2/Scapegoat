<div align="center">

# ⚡ SCAPEGOAT
### Real-Time Multimodal E-Commerce Platform & Multi-Agent AI Shopping System

[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js_20+-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB_9-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF)](https://razorpay.com/)

<p align="center">
  <b>Smart Search. Instant Drops. Seamless Checkout.</b><br />
  A state-of-the-art full-stack e-commerce marketplace powered by LangGraph AI agents, CLIP visual image search, real-time WebSocket state synchronization, Snap2Bill counter POS billing, and Redis-cached high-throughput APIs.
</p>

---

</div>

## 📑 Table of Contents
- [✨ Core Highlights](#-core-highlights)
- [🧠 Advanced AI & Multimodal Search](#-advanced-ai--multimodal-search)
- [⚡ Real-Time Socket.io System](#-real-time-socketio-system)
- [📸 Snap2Bill: Camera POS Quick-Billing](#-snap2bill-camera-pos-quick-billing)
- [🛒 Full E-Commerce Capabilities](#-full-e-commerce-capabilities)
- [🌐 System Architecture](#-system-architecture)
- [🔐 Authentication & Role-Based Security](#-authentication--role-based-security)
- [💳 Payment Gateway & Order Lifecycle](#-payment-gateway--order-lifecycle)
- [💻 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Environment Variables](#backend-environment-variables)
  - [Frontend Environment Variables](#frontend-environment-variables)
  - [Running Locally](#running-locally)
- [📁 Project Structure](#-project-structure)
- [📄 License](#-license)

---

## ✨ Core Highlights

- **🤖 LangGraph & Multi-Agent AI Shopping Concierge**: Conversational shopping agent with real-time SSE streaming, product recommendation tool calling, AI Review Insights synthesis, and direct 1-click bundle-to-cart actions.
- **👁️ Google Lens-Style Visual Search**: Upload or capture a camera photo of any clothing or product to instantly find visually identical or similar catalogue items via OpenAI CLIP (`clip-vit-base-patch32`) embeddings.
- **⚡ Real-Time Live Catalog Sync**: WebSockets powered by Socket.io notify shoppers of live product drops (*"🔥 New Arrival Just Dropped!"*), update out-of-stock badges on open product pages, and chime seller dashboards on new orders.
- **🔄 Multi-Tab Cart & Wishlist Sync**: Cart and wishlist badge counts update instantly across all open browser tabs and devices for the authenticated user without page refreshing.
- **🧾 Snap2Bill POS System**: Revolutionary in-store counter tool allowing retail sellers to snap a photo of a physical item to match embeddings in <50ms, generate a digital bill draft, and produce instant PDF / WhatsApp invoices while automatically decrementing MongoDB inventory.
- **💳 Razorpay Payment Integration**: End-to-end checkout flow supporting UPI, Cards, NetBanking, and Wallets with cryptographic HMAC signature verification and automated stock reservation.
- **🎨 Modern Responsive Storefront**: Built on React 19, Vite, and Tailwind CSS with smooth infinite scroll, multi-variant selectors (sizes, colors, materials), and high-density product carousels.

---

## 🧠 Advanced AI & Multimodal Search

ScapeGoat combines multi-provider LLMs with high-dimensional vector search to eliminate friction between customer intent and checkout:

| Feature | Model / Technology | Description |
|---|---|---|
| **Semantic Natural Language Search** | `@xenova/transformers` (`all-MiniLM-L6-v2`) | Understands descriptive, contextual shopping queries (e.g., *"breathable oversized linen shirt for beach vacation"*). |
| **Visual / Photo Search** | OpenAI CLIP (`clip-vit-base-patch32`) | Generates 512-dimension visual embeddings from uploaded images or live camera snaps to match products by appearance, pattern, and silhouette. |
| **Streaming AI Agent Concierge** | LangGraph + Google Gemini & Groq LLaMA 3.3 | Multi-turn streaming assistant (`/api/ai/chat/stream`) with memory, intent classification, and automated tool execution (`addBundleToCartAction`, `getReviewInsightsAction`). |
| **Vector Indexing Engine** | Pinecone & MongoDB Atlas `$vectorSearch` | HNSW (Hierarchical Navigable Small World) spatial graph indexing achieving sub-15ms nearest-neighbor vector retrieval at scale. |
| **Granular Image Vectors** | Multi-Image Embeddings | Stores separate vector embeddings for every product image (up to 7) and variant image (up to 7 per variant) for high-precision visual matches. |

---

## ⚡ Real-Time Socket.io System

ScapeGoat eliminates stale e-commerce states through bi-directional WebSocket event channels:

```text
┌─────────────────┐       Socket.io Event       ┌────────────────────────┐
│  Seller Action  │ ──────────────────────────► │   Customer Browsing    │
└─────────────────┘                             └────────────────────────┘
  • Publish Product  ────► product_published  ────► "Just Dropped!" Live Toast & Grid Slide
  • Stock Update     ────► product_updated    ────► Live PDP Price & "Only 2 Left!" Badge
  • Unlist Product   ────► product_deleted    ────► Modal Alert & Redirect to Shop

┌─────────────────┐       User Private Sync     ┌────────────────────────┐
│  Mobile Device  │ ──────────────────────────► │    Desktop Browser     │
└─────────────────┘                             └────────────────────────┘
  • Add to Cart      ────► cart_updated       ────► Cart Badge Counter Updates Live
  • Save Wishlist    ────► wishlist_updated   ────► Wishlist Heart Counter Updates Live

┌─────────────────┐       Order Placement       ┌────────────────────────┐
│ Customer Order  │ ──────────────────────────► │    Seller Dashboard    │
└─────────────────┘                             └────────────────────────┘
  • Checkout Paid    ────► seller_new_order   ────► Live Audio Ding + Order Table Refresh
```

---

## 📸 Snap2Bill: Camera POS Quick-Billing

Built specifically for brick-and-mortar stores and hybrid retailers:
1. **Live Camera Scanner**: The seller accesses the dedicated **Snap2Bill** console on their phone, tablet, or POS terminal.
2. **Instant Visual Matching**: Snapping a photo of a physical garment or item queries the visual embedding index in `<50ms`.
3. **Bill Draft Generation**: The matched product, variant, tax, and price are instantly appended to the active billing slip.
4. **1-Tap Invoice & Fulfillment**:
   - Generates an instant printable PDF invoice and WhatsApp receipt link.
   - Automatically decrements online and in-store MongoDB stock counts in real time.

---

## 🛒 Full E-Commerce Capabilities

### 🛍️ Storefront & Customer Experience
- **Infinite Scroll Catalog**: High-performance paginated storefront with dynamic category, brand, and price filters.
- **Multi-Variant Configurations**: Support for dynamic SKU matrices with individual variant pricing, stock counts, and dedicated ImageKit CDN photo galleries.
- **Smart Cart & Wishlist**: Persistent cart with coupon discounts, shipping calculators, and 1-click wishlist migrations.
- **Verified Reviews & Ratings**: Image-enabled product reviews with sentiment breakdown and AI-generated review summaries.
- **In-App Direct Chat**: Live customer-to-seller messaging for inquiries and negotiations.

### 🏢 Seller & Merchant Hub
- **Product Lifecycle Management**: Draft, published, and trash states with bulk photo uploads via ImageKit CDN (up to 7 images per product and variant).
- **Live Sales & Order Dashboard**: Real-time sales telemetry, revenue charts, order status transitions (Pending, Processing, Shipped, Delivered, Cancelled).
- **Inventory & Low Stock Warnings**: Automatic threshold indicators preventing overselling.

### 👑 Super Admin Command Center
- **Merchant & Customer Governance**: Ban/unban controls, role promotion, and session revocation.
- **Banner & Promotion Manager**: Dynamic hero banners and seasonal flash sale tickers.
- **Platform Analytics**: Total GMV, platform fees, active seller metrics, and API quota tracking.

---

## 🌐 System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                    SCAPEGOAT CLIENT (REACT 19 + VITE)                  │
│   Storefront  •  AI Visual Search  •  Seller POS (Snap2Bill)  •  Admin │
│         │                     │                         │              │
│         ▼                     ▼                         ▼              │
│    Redux Store         Socket.io Client           Axios Interceptors   │
└─────────┬─────────────────────┬─────────────────────────┬──────────────┘
          │                     │ WebSocket               │ HTTP / SSE
          ▼                     ▼                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    EXPRESS 5 BACKEND (NODE.JS ESM)                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Middlewares: Auth, RBAC, Helmet, RateLimiter, AI Quotas, Morgan  │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ Controllers: Auth, Products, Orders, AI, Cart, Wishlist, Sellers │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ AI Services: LangGraph Agent, CLIP Embeddings, MiniLM Search     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│         │               │                │               │             │
│         ▼               ▼                ▼               ▼             │
│    MongoDB 9        Redis Cache      ImageKit CDN     Razorpay Gateway │
│ (Atlas Vectors)   (Sessions/Sync)   (Product Photos)  (UPI/Cards/NetB) │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication & Role-Based Security

- **Google OAuth 2.0 & Passwords**: Integrated with Passport.js for 1-tap Google sign-in and salted bcrypt password security.
- **Secure httpOnly Cookie Sessions**: Access and refresh tokens stored in hardened `httpOnly`, `Secure`, `SameSite=Lax` cookies to prevent XSS credential theft.
- **Multi-Role RBAC**: Granular permissions separating `customer`, `seller`, and `admin` API routes.
- **Device & Activity Tracking**: `ua-parser-js` device fingerprinting with Redis-backed session tracking and guest visitor identification.
- **API Defense**: Configured with `helmet`, IP-based `express-rate-limit`, CORS origin validation, and AI daily token quotas.

---

## 💳 Payment Gateway & Order Lifecycle

- **Razorpay Orders API**: Server-side order creation calculating item prices, taxes, and applied coupons securely.
- **HMAC SHA-256 Verification**: Verifies `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` before confirming payment status.
- **Automated Inventory Reservation**: Safely reserves stock upon checkout initiation and rolls back on payment failure.
- **Live Notifications**: Emits web-push and in-app alerts to buyers and audio notifications to merchants upon successful checkout.

---

## 💻 Getting Started

### Prerequisites
- **Node.js**: v20.x or higher
- **MongoDB**: v7.0+ or MongoDB Atlas Cluster (Atlas required for native `$vectorSearch`)
- **Redis**: v6.0+ or Redis Cloud instance

---

### Backend Environment Variables

Create a `.env` file in `Backend/.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

# Database & Cache
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/scapegoat?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Google OAuth 2.0 & Gmail
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
GOOGLE_USER=your_email@gmail.com

# Media CDN (ImageKit)
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

# Payments (Razorpay)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Web Push Notifications (VAPID)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:support@scapegoat.com

# AI Foundation Models & Vectors (Optional / Recommended)
GEMINI_API_KEY=your_google_gemini_api_key
GROQ_API_KEY=your_groq_api_key
MISTRAL_API_KEY=your_mistral_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
PINECONE_API_KEY=your_pinecone_api_key
```

---

### Frontend Environment Variables

Create a `.env` file in `Frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:3000
VITE_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

---

### Running Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ashoka-2/Scapegoat.git
   cd Scapegoat
   ```

2. **Start the Backend**:
   ```bash
   cd Backend
   npm install
   npm run dev
   ```

3. **Start the Frontend**:
   ```bash
   cd ../Frontend
   npm install
   npm run dev
   ```

4. **Access the Application**:
   - Storefront UI: `http://localhost:5173`
   - Backend API: `http://localhost:3000`

---

## 📁 Project Structure

```text
Scapegoat/
├── Backend/
│   ├── src/
│   │   ├── config/          # Passport, Redis, ImageKit, Database configurations
│   │   ├── controllers/     # Auth, Products, Orders, AI, Cart, Wishlist, Sellers
│   │   ├── middlewares/     # Auth, RBAC, AI Quotas, Rate Limiter, Error handler
│   │   ├── models/          # User, Product, Order, Review, Coupon, Category, Brand
│   │   ├── routes/          # Express route definitions for all features
│   │   ├── services/        # LangGraph agents, CLIP embedding, Razorpay, ImageKit
│   │   ├── utils/           # Socket.io emitters, Redis helpers, Error wrappers
│   │   └── validators/      # Express-validator schema sanitizers
│   ├── package.json
│   └── server.js            # Server entry point with Socket.io attachment
│
├── Frontend/
│   ├── src/
│   │   ├── App/             # Router setup, Redux store, Error Boundary
│   │   ├── Components/      # Navigation, Modals, Toast, Footer, Skeletons
│   │   ├── Features/
│   │   │   ├── AI/          # Streaming shopping agent & visual search modal
│   │   │   ├── Admin/       # Analytics dashboard & management tables
│   │   │   ├── Cart/        # Cart drawer, checkout summary, coupon input
│   │   │   ├── Home/        # Hero banners, new arrivals, trending categories
│   │   │   ├── Orders/      # Order tracking, payment status, invoice downloads
│   │   │   ├── Products/    # Product grid, filters, PDP with variant switcher
│   │   │   ├── Seller/      # Seller console, inventory editor, Snap2Bill POS
│   │   │   └── auth/        # Login, registration, Google OAuth callback
│   │   ├── Hooks/           # Custom React hooks (useSocket, useCart, useAuth)
│   │   ├── services/        # Axios API clients & Socket.io listeners
│   │   └── utils/           # Formatting helpers & theme utilities
│   ├── package.json
│   └── vite.config.js
│
├── FRONTEND_FEATURES_CHECKLIST.md  # Architectural event & feature specs
└── README.md                       # Comprehensive platform documentation
```

---

## 📄 License

This project is licensed under the **MIT License**.

<div align="center">
  <sub>Engineered by Ashok Kumar & the ScapeGoat Team.</sub>
</div>
