import { createBrowserRouter } from "react-router-dom";
import Register from "../Features/auth/Pages/Register.jsx";
import Login from "../Features/auth/Pages/Login.jsx";
import Home from "../Features/Home/Pages/Home.jsx";
import CompleteProfile from "../Features/auth/Pages/CompleteProfile.jsx";
import Protected from "../Features/auth/components/Protected.jsx";


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
    path:"/",
    element: <Protected><Home/></Protected>
  },
  {
    path: "/complete-profile",
    element: <Protected><CompleteProfile /></Protected>
  }
 
]);
