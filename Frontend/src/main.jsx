import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App/App.jsx";
import "remixicon/fonts/remixicon.css";
import { Provider } from "react-redux";
import {store} from './App/App.store.js';

createRoot(document.getElementById("root")).render(
<Provider store = {store}>
<App />
</Provider>
);
