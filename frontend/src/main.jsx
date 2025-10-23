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
