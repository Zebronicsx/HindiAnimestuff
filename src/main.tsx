import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// The source HTML watchdog uses this to distinguish a running Vite bundle
// from an unbuilt source folder uploaded to a plain static host.
document.documentElement.dataset.afApp = "booting";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
