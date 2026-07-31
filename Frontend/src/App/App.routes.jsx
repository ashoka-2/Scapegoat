import { createBrowserRouter } from "react-router-dom";
import Register from "../Features/auth/Pages/Register.jsx";
import Login from "../Features/auth/Pages/Login.jsx";
import Home from "../Features/Home/Pages/Home.jsx";
import Profile from "../Features/auth/Pages/Profile.jsx";
import CompleteProfile from "../Features/auth/Pages/CompleteProfile.jsx";
import Protected from "../Features/auth/components/Protected.jsx";
import SellerRoute from "../Features/auth/components/SellerRoute.jsx";
import MainLayout from "./MainLayout.jsx";
import SellerLayout from "../Components/SellerLayout.jsx";
import CreateProduct from "../Features/Products/Pages/CreateProduct.jsx";
import SellerDashboard from "../Features/Products/Pages/SellerDashboard.jsx";
import SellerCatalog from "../Features/Products/Pages/SellerCatalog.jsx";
import SellerMetadataManager from "../Features/Products/Pages/SellerMetadataManager.jsx";

export const routes = createBrowserRouter([
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/login",
    element: <Login />,
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
    path: "/",
    element: (
      <Protected>
        <MainLayout />
      </Protected>
    ),
    children: [
      {
        index: true,
        element: <Home />,
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
