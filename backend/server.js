import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import csp from "./middlewares/cspSafe.js";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/database.js";
import SyncServer from "./websocket/sync-server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import brandAnalysisRoutes from "./routes/brandAnalysis.js";
import venuesRoutes from "./routes/venues.js";
import guestsRoutes from "./routes/guests.js";
import showRoutes from "./routes/show.js";
import bespokeRoutes from "./routes/bespoke.js";
import metricsRoutes from "./routes/metrics.js";
import bespokeSlotsRoutes from "./routes/bespokeSlots.js";
import sitemapRoutes from "./routes/sitemap.js";
import payments from "./routes/payments.js";
import logsRoute from "./routes/logs.js";
import adminAuth from "./routes/admin.auth.js";
import adminCore from "./routes/admin.core.js";
import adminProducts from "./routes/admin.products.js";
import adminFlags from "./routes/admin.flags.js";
import adminOrders from "./routes/admin.orders.js";
import adminOAuth from "./routes/admin/oauth.js";
import { passport } from "./config/passport.js";

// Import middleware
import { cacheHeadersMiddleware } from "./middlewares/cacheHeaders.js";
import { utmCaptureMiddleware } from "./middlewares/utmCapture.js";
import requestId from "./middlewares/requestId.js";
import httpLogger from "./middlewares/logger.js";
import errorHandler from "./middlewares/errorHandler.js";

import telegramRoutes from "./routes/telegram.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import contactRoutes from "./routes/contact.js";
import chatRoutes from "./routes/chat.js";
import haori3dRoutes from "./routes/haori3d.js";
import eventsRoutes from "./routes/events.js";
import {
  edgeCacheMiddleware,
  edgeCacheAgeMiddleware,
} from "../scripts/edge_headers.ts";

// Import cron jobs
import "./cron/aiFeedbackLoop.js";
import "./cron/weeklyReport.js";
import "./cron/weeklyAnalyticsReport.js";
import "./cron/aiDirector.js";
import "./cron/artisticEvolution.js";
import "./cron/telegramAutoPost.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3010;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(compression());
app.use(requestId);
app.use(httpLogger());

// P25 Edge Cache
app.use(edgeCacheMiddleware);
app.use(edgeCacheAgeMiddleware);
app.use(csp()); // P21 Content Security Policy
app.use(
  cors({
    origin: function (origin, callback) {
      const allowed = [
        process.env.CLIENT_URL || "http://localhost:3012",
        "https://haorivision.com",
        "https://www.haorivision.com",
      ];
      // Include localhost only in development
      if (process.env.NODE_ENV !== "production") {
        allowed.push("http://localhost:3012");
      }
      // Deduplicate
      const uniqueAllowed = [...new Set(allowed.filter(Boolean))];
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || uniqueAllowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Passport initialization
app.use(passport.initialize());

// Cache headers middleware (P14)
app.use(cacheHeadersMiddleware);
// UTM Capture Middleware (P18)
app.use(utmCaptureMiddleware);

// Serve static files
app.use("/configs", express.static(path.join(__dirname, "..", "configs")));
app.use("/admin", express.static(path.join(__dirname, "..", "admin")));
app.use("/miniapp", express.static(path.join(__dirname, "public", "miniapp")));
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// Serve favicon
app.get("/favicon.ico", (req, res) => {
  res.setHeader("Content-Type", "image/svg+xml");
  res.sendFile(path.join(__dirname, "public", "favicon.svg"));
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use("/api/", limiter);

// Strict rate-limit for sensitive endpoints
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many requests, please try again later" },
});
app.use("/api/contact", strictLimiter);
app.use("/api/chat", strictLimiter);
app.use("/api/telegram/generate", strictLimiter);

// Basic routes
app.get("/", (req, res) => {
  res.json({
    message: "HAORI VISION E-Commerce API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      products: "/api/products",
      orders: "/api/orders",
      customers: "/api/customers",
      admin: "/api/admin",
    },
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
  });
});

// Artist data
import { readFileSync } from "fs";
const artistData = JSON.parse(
  readFileSync(path.join(__dirname, "..", "data", "artist.json"), "utf-8"),
);
app.get("/api/artist", (req, res) => {
  // Exclude private contact info from public API
  const { phone, email, ...publicData } = artistData;
  res.json(publicData);
});

// Routes
app.use("/api/brand-analysis", brandAnalysisRoutes);
app.use("/api/venues", venuesRoutes);
app.use("/api/guests", guestsRoutes);
app.use("/api/show", showRoutes);
app.use("/api/bespoke", bespokeRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/bespoke-slots", bespokeSlotsRoutes);
app.use("/api/payments", payments);
app.use("/api/logs", logsRoute);
app.use("/api/telegram", telegramRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/haori-3d", haori3dRoutes);
app.use("/api/events", eventsRoutes);
app.use("/", sitemapRoutes); // Sitemap routes (no /api prefix)

// Admin routes
app.use("/api/admin/auth", adminAuth);
app.use("/api/admin/auth", adminOAuth); // OAuth routes
app.use("/api/admin", adminCore);
app.use("/api/admin/products", adminProducts);
app.use("/api/admin/flags", adminFlags);
app.use("/api/admin/orders", adminOrders);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// Start WebSocket Sync Server
const syncServer = new SyncServer(8080);
syncServer.start();

// Start server
app.listen(PORT, () => {
  console.log("\n");
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║                                                           ║");
  console.log("║        HAORI VISION E-COMMERCE BACKEND                    ║");
  console.log("║                                                           ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");
  console.log("");
  console.log(`[✓] Server running on: http://localhost:${PORT}`);
  console.log(`[◇] WebSocket Sync: ws://localhost:8080`);
  console.log(`[◆] Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `[●] Database: ${mongoose.connection.readyState === 1 ? "Connected" : "Connecting..."}`,
  );
  console.log("");
  console.log("[▸] API Endpoints:");
  console.log(`    GET  http://localhost:${PORT}/`);
  console.log(`    GET  http://localhost:${PORT}/api/health`);
  console.log(`    GET  http://localhost:${PORT}/api/venues`);
  console.log(`    GET  http://localhost:${PORT}/api/venues/:venueId`);
  console.log(`    POST http://localhost:${PORT}/api/venues/save`);
  console.log("");
  console.log("[◇] AI Intelligence & Brand Analysis:");
  console.log(`    POST http://localhost:${PORT}/api/brand-analysis/analyze`);
  console.log(`    POST http://localhost:${PORT}/api/brand-analysis/optimize`);
  console.log(
    `    GET  http://localhost:${PORT}/api/brand-analysis/haori-light-index`,
  );
  console.log(
    `    POST http://localhost:${PORT}/api/brand-analysis/premium-test`,
  );
  console.log(
    `    POST http://localhost:${PORT}/api/brand-analysis/ai-feedback-loop/run`,
  );
  console.log(
    `    GET  http://localhost:${PORT}/api/brand-analysis/ai-feedback-loop/status`,
  );
  console.log("");
  console.log("[△] AI Director (Autonomous Creative Director):");
  console.log(
    `    POST http://localhost:${PORT}/api/brand-analysis/ai-director/run`,
  );
  console.log(
    `    GET  http://localhost:${PORT}/api/brand-analysis/ai-director/status`,
  );
  console.log(
    `    GET  http://localhost:${PORT}/api/brand-analysis/ai-director/report/:iteration`,
  );
  console.log("");
  console.log("[✦] Light Intelligence & Haori Light Index:");
  console.log(
    `    GET  http://localhost:${PORT}/api/brand-analysis/haori-light-index/current`,
  );
  console.log(
    `    GET  http://localhost:${PORT}/api/brand-analysis/ai-director/pdf/latest`,
  );
  console.log("");
  console.log("[◆] Artistic Evolution (Monthly Collection Concepts):");
  console.log(
    `    POST http://localhost:${PORT}/api/brand-analysis/artistic-evolution/run`,
  );
  console.log(
    `    GET  http://localhost:${PORT}/api/brand-analysis/artistic-evolution/status`,
  );
  console.log(
    `    GET  http://localhost:${PORT}/api/brand-analysis/artistic-evolution/concepts/:month`,
  );
  console.log(
    `    POST http://localhost:${PORT}/api/brand-analysis/artistic-evolution/approve`,
  );
  console.log(
    `    GET  http://localhost:${PORT}/api/brand-analysis/artistic-evolution/pdf/latest`,
  );
  console.log("");
  console.log("[!] Press Ctrl+C to stop");
  console.log("");
});

export default app;
