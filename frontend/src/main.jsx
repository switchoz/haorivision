import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { wireGlobalErrorHandlers, log } from "./shared/logging.ts";

wireGlobalErrorHandlers();
log.info("app_start", { ts: Date.now(), env: import.meta.env.MODE });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Web Vitals
if (typeof window !== "undefined") {
  import("web-vitals")
    .then(({ onCLS, onFID, onLCP, onFCP, onTTFB }) => {
      const report = (metric) =>
        console.debug("[WebVital]", metric.name, metric.value.toFixed(1));
      onCLS(report);
      onFID(report);
      onLCP(report);
      onFCP(report);
      onTTFB(report);
    })
    .catch(() => {});
}
