/**
 * HAORI VISION — Security Middleware (Non-Destructive)
 *
 * Добавляет security headers, rate limiting, CSRF protection.
 * Не изменяет существующие маршруты — только добавляет новые слои.
 *
 * Features:
 * - Content-Security-Policy (CSP)
 * - X-Frame-Options: DENY
 * - Referrer-Policy: strict-origin-when-cross-origin
 * - X-Content-Type-Options: nosniff
 * - Rate limiting: 60 req/min per IP on /api/*
 * - CSRF protection for POST forms
 *
 * Usage:
 *   import { securityHeaders, apiRateLimiter, csrfProtection } from './middlewares/security.js';
 *
 *   app.use(securityHeaders);
 *   app.use('/api/', apiRateLimiter);
 *   app.post('/checkout', csrfProtection, ...);
 */

import rateLimit from "express-rate-limit";
import helmet from "helmet";

// ============================================================
// Configuration
// ============================================================

// Allowed CDN domains for images/media
const ALLOWED_CDN_DOMAINS = [
  "'self'",
  "https://cdn.haorivision.com",
  "https://media.haorivision.com",
  "https://images.unsplash.com", // If using Unsplash
  "https://res.cloudinary.com", // If using Cloudinary
  "data:", // For inline images/SVG
];

// Allowed script sources (if needed)
const ALLOWED_SCRIPT_SOURCES = [
  "'self'",
  // TODO: implement nonce-based CSP for scripts instead of 'unsafe-inline'
  "https://js.stripe.com", // Stripe SDK
  "https://www.google-analytics.com", // Google Analytics
  "https://www.googletagmanager.com",
];

// Allowed style sources
const ALLOWED_STYLE_SOURCES = [
  "'self'",
  "'unsafe-inline'", // For inline styles (use nonce in production)
  "https://fonts.googleapis.com",
];

// Allowed font sources
const ALLOWED_FONT_SOURCES = ["'self'", "https://fonts.gstatic.com", "data:"];

// Allowed connect sources (API, WebSocket)
const ALLOWED_CONNECT_SOURCES = [
  "'self'",
  "https://api.haorivision.com",
  "ws://localhost:8080", // WebSocket Sync Server
  "wss://sync.haorivision.com",
  "https://api.stripe.com",
];

// ============================================================
// Security Headers Middleware
// ============================================================

/**
 * Apply comprehensive security headers using Helmet
 *
 * Headers added:
 * - Content-Security-Policy (CSP)
 * - X-Frame-Options: DENY
 * - X-Content-Type-Options: nosniff
 * - Referrer-Policy: strict-origin-when-cross-origin
 * - Strict-Transport-Security (HSTS)
 * - X-DNS-Prefetch-Control
 * - X-Download-Options
 * - X-Permitted-Cross-Domain-Policies
 */
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ALLOWED_SCRIPT_SOURCES,
      styleSrc: ALLOWED_STYLE_SOURCES,
      imgSrc: ALLOWED_CDN_DOMAINS,
      mediaSrc: ALLOWED_CDN_DOMAINS,
      fontSrc: ALLOWED_FONT_SOURCES,
      connectSrc: ALLOWED_CONNECT_SOURCES,
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"], // Equivalent to X-Frame-Options: DENY
      upgradeInsecureRequests: [], // Force HTTPS
    },
  },

  // Deny embedding in frames/iframes
  frameguard: {
    action: "deny",
  },

  // Prevent MIME type sniffing
  noSniff: true,

  // Referrer policy
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },

  // HTTP Strict Transport Security (HSTS)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // DNS prefetch control
  dnsPrefetchControl: {
    allow: false,
  },

  // IE8+ download options
  ieNoOpen: true,

  // Cross-domain policies
  permittedCrossDomainPolicies: {
    permittedPolicies: "none",
  },
});

// ============================================================
// Rate Limiting
// ============================================================

/**
 * Rate limiter for /api/* routes
 *
 * Limits: 60 requests per minute per IP
 * Prevents brute force, DoS, and API abuse
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "60 seconds",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers

  // Skip rate limiting for certain IPs (e.g., internal monitoring)
  skip: (req) => {
    const trustedIPs = [
      "127.0.0.1",
      "::1",
      // Add your monitoring service IPs here
    ];
    return trustedIPs.includes(req.ip);
  },

  // Custom key generator (use forwarded IP if behind proxy)
  keyGenerator: (req) => {
    return req.headers["x-forwarded-for"] || req.ip;
  },
});

/**
 * Stricter rate limiter for authentication endpoints
 *
 * Limits: 5 attempts per 15 minutes per IP
 * Prevents brute force attacks on login/register
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: {
    error: "Too many authentication attempts, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * Rate limiter for checkout/payment endpoints
 *
 * Limits: 10 requests per 5 minutes per IP
 * Prevents payment spam and fraud
 */
export const checkoutRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 requests per 5 minutes
  message: {
    error: "Too many checkout attempts, please try again later.",
    retryAfter: "5 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================
// CSRF Protection
// ============================================================

/**
 * Simple CSRF token middleware (stateless)
 *
 * Uses double-submit cookie pattern:
 * 1. Client receives CSRF token in cookie
 * 2. Client sends token in X-CSRF-Token header
 * 3. Server verifies both match
 *
 * For production, consider using 'csurf' package for session-based CSRF.
 */

import crypto from "crypto";

/**
 * Generate CSRF token and set in cookie
 */
export function generateCsrfToken(req, res, next) {
  // Skip if token already exists
  if (req.cookies && req.cookies["csrf-token"]) {
    req.csrfToken = req.cookies["csrf-token"];
    return next();
  }

  // Generate new token
  const token = crypto.randomBytes(32).toString("hex");

  // Set cookie (httpOnly prevents JavaScript access)
  res.cookie("csrf-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  req.csrfToken = token;
  next();
}

/**
 * Verify CSRF token on POST/PUT/DELETE requests
 */
export function verifyCsrfToken(req, res, next) {
  // Skip for GET/HEAD/OPTIONS
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Get token from cookie
  const cookieToken = req.cookies && req.cookies["csrf-token"];

  // Get token from header or body
  const headerToken = req.headers["x-csrf-token"] || req.body._csrf;

  // Verify tokens match
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      error: "Invalid CSRF token",
      message:
        "CSRF token missing or invalid. Please refresh the page and try again.",
    });
  }

  next();
}

/**
 * Combined CSRF protection middleware
 *
 * Usage:
 *   app.post('/checkout', csrfProtection, handleCheckout);
 */
export const csrfProtection = [generateCsrfToken, verifyCsrfToken];

// ============================================================
// Additional Security Utilities
// ============================================================

/**
 * Sanitize user input to prevent XSS
 *
 * Basic sanitization - for production use 'dompurify' or 'xss' package
 */
export function sanitizeInput(input) {
  if (typeof input !== "string") return input;

  return input
    .replace(/[<>]/g, "") // Remove < and >
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers (onclick=, etc.)
    .trim();
}

/**
 * Validate request origin
 *
 * Ensures requests come from allowed origins
 */
export function validateOrigin(req, res, next) {
  const allowedOrigins = [
    "http://localhost:3012", // Frontend dev
    "http://localhost:3010", // Backend dev
    "https://haorivision.com",
    "https://www.haorivision.com",
    "https://shop.haorivision.com",
  ];

  const origin = req.headers.origin || req.headers.referer;

  // Allow requests with no origin (e.g., Postman, curl)
  if (!origin) {
    return next();
  }

  // Check if origin is allowed
  const isAllowed = allowedOrigins.some((allowed) =>
    origin.startsWith(allowed),
  );

  if (!isAllowed) {
    return res.status(403).json({
      error: "Forbidden",
      message: "Request origin not allowed",
    });
  }

  next();
}

/**
 * Log security events
 *
 * Logs suspicious activity for monitoring
 */
export function logSecurityEvent(req, event, details = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ip: req.headers["x-forwarded-for"] || req.ip,
    userAgent: req.headers["user-agent"],
    url: req.originalUrl,
    method: req.method,
    ...details,
  };

  console.warn("[SECURITY]", JSON.stringify(logEntry));

  // In production, send to logging service (Sentry, LogRocket, etc.)
  // if (process.env.NODE_ENV === 'production') {
  //   sendToLoggingService(logEntry);
  // }
}

// ============================================================
// Export All Middleware
// ============================================================

export default {
  securityHeaders,
  apiRateLimiter,
  authRateLimiter,
  checkoutRateLimiter,
  csrfProtection,
  generateCsrfToken,
  verifyCsrfToken,
  sanitizeInput,
  validateOrigin,
  logSecurityEvent,
};
