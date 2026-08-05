import { createBrowserRouter } from "react-router-dom";
import Register from "../Features/auth/Pages/Register.jsx";
import Login from "../Features/auth/Pages/Login.jsx";
import Home from "../Features/Home/Pages/Home.jsx";
import Profile from "../Features/auth/Pages/Profile.jsx";
import CompleteProfile from "../Features/auth/Pages/CompleteProfile.jsx";
import Protected from "../Features/auth/components/Protected.jsx";
import SellerRoute from "../Features/auth/components/SellerRoute.jsx";
import GuestRoute from "../Features/auth/components/GuestRoute.jsx";
import MainLayout from "./MainLayout.jsx";
import SellerLayout from "../Features/Seller/Components/SellerLayout.jsx";

// Product & Seller Pages
import CreateProduct from "../Features/Products/Pages/CreateProduct.jsx";
import SingleProduct from "../Features/Products/Pages/SingleProduct.jsx";
import Shop from "../Features/Products/Pages/Shop.jsx";
import SellerDashboard from "../Features/Seller/Pages/SellerDashboard.jsx";
import SellerCatalog from "../Features/Seller/Pages/SellerCatalog.jsx";
import SellerMetadataManager from "../Features/Seller/Pages/SellerMetadataManager.jsx";
import CartPage from "../Features/Cart/Pages/CartPage.jsx";
import Wishlist from "../Features/Wishlist/Pages/Wishlist.jsx";
import ForgotPassword from "../Features/auth/Pages/ForgotPassword.jsx";
import ResetPassword from "../Features/auth/Pages/ResetPassword.jsx";

// Home & Info Pages
import About from "../Features/Home/Pages/About.jsx";
import Contact from "../Features/Home/Pages/Contact.jsx";
import LegalPrivacy from "../Features/Home/Pages/LegalPrivacy.jsx";
import LegalReturns from "../Features/Home/Pages/LegalReturns.jsx";
import LegalTerms from "../Features/Home/Pages/LegalTerms.jsx";

// Order Pages
import Checkout from "../Features/Orders/Pages/Checkout.jsx";
import MyOrders from "../Features/Orders/Pages/MyOrders.jsx";
import OrderDetails from "../Features/Orders/Pages/OrderDetails.jsx";

export const routes = createBrowserRouter([
  {
    path: "/register",
    element: (
      <GuestRoute>
        <Register />
      </GuestRoute>
    ),
  },
  {
    path: "/login",
    element: (
      <GuestRoute>
        <Login />
      </GuestRoute>
    ),
  },
  {
    path: "/complete-profile",
    element: (
      <Protected>
        <CompleteProfile />
      </Protected>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <GuestRoute>
        <ForgotPassword />
      </GuestRoute>
    ),
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "shop",
        element: <Shop />,
      },
      {
        path: "about",
        element: <About />,
      },
      {
        path: "contact",
        element: <Contact />,
      },
      {
        path: "privacy-policy",
        element: <LegalPrivacy />,
      },
      {
        path: "returns-policy",
        element: <LegalReturns />,
      },
      {
        path: "terms-of-service",
        element: <LegalTerms />,
      },
      {
        path: "checkout",
        element: (
          <Protected>
            <Checkout />
          </Protected>
        ),
      },
      {
        path: "my-orders",
        element: (
          <Protected>
            <MyOrders />
          </Protected>
        ),
      },
      {
        path: "orders/:id",
        element: (
          <Protected>
            <OrderDetails />
          </Protected>
        ),
      },
      {
        path: "cart",
        element: (
          <Protected>
            <CartPage />
          </Protected>
        ),
      },
      {
        path: "wishlist",
        element: (
          <Protected>
            <Wishlist />
          </Protected>
        ),
      },
      {
        path: "profile",
        element: (
          <Protected>
            <Profile />
          </Protected>
        ),
      },
      {
        path: "product/:id",
        element: <SingleProduct />,
      },
      {
        path: "product/:id/variant/:variantId",
        element: <SingleProduct />,
      },
      {
        path: "products/create",
        element: (
          <Protected>
            <SellerRoute>
              <CreateProduct />
            </SellerRoute>
          </Protected>
        ),
      },
      {
        path: "products/edit/:id",
        element: (
          <Protected>
            <SellerRoute>
              <CreateProduct />
            </SellerRoute>
          </Protected>
        ),
      },
      {
        path: "seller",
        element: (
          <Protected>
            <SellerRoute>
              <SellerLayout />
            </SellerRoute>
          </Protected>
        ),
        children: [
          {
            path: "dashboard",
            element: <SellerDashboard />,
          },
          {
            path: "catalog",
            element: <SellerCatalog />,
          },
          {
            path: "metadata",
            element: <SellerMetadataManager />,
          },
        ],
      },
    ],
  },
]);
