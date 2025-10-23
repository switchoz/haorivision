/**
 * HAORI VISION — Cache Headers Middleware
 *
 * Applies Cache-Control headers based on configs/cache_headers.json
 * Works with Express.js
 *
 * Usage:
 *   import { cacheHeadersMiddleware } from './middlewares/cacheHeaders.js';
 *   app.use(cacheHeadersMiddleware);
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// Configuration
// ============================================================

const CONFIG_PATH = path.resolve(__dirname, "../../configs/cache_headers.json");
let cacheConfig = null;

/**
 * Load cache headers configuration
 */
function loadCacheConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      console.warn(`[Cache Headers] Config not found: ${CONFIG_PATH}`);
      return null;
    }

    const data = fs.readFileSync(CONFIG_PATH, "utf-8");
    const config = JSON.parse(data);

    // Compile regex patterns
    config.rules = config.rules.map((rule) => ({
      ...rule,
      regex: new RegExp(rule.pattern),
    }));

    console.log(
      `[Cache Headers] Loaded ${config.rules.length} rules from ${CONFIG_PATH}`,
    );
    return config;
  } catch (error) {
    console.error(`[Cache Headers] Error loading config: ${error.message}`);
    return null;
  }
}

/**
 * Find matching rule for a path
 */
function findMatchingRule(path, rules) {
  if (!rules || rules.length === 0) {
    return null;
  }

  for (const rule of rules) {
    if (rule.regex.test(path)) {
      return rule;
    }
  }

  return null;
}

// ============================================================
// Middleware
// ============================================================

/**
 * Cache headers middleware
 */
export function cacheHeadersMiddleware(req, res, next) {
  // Load config on first request (lazy loading)
  if (!cacheConfig) {
    cacheConfig = loadCacheConfig();
  }

  // Skip if config failed to load
  if (!cacheConfig || !cacheConfig.rules) {
    return next();
  }

  const requestPath = req.path || req.url;

  // Find matching rule
  const matchingRule = findMatchingRule(requestPath, cacheConfig.rules);

  if (matchingRule && matchingRule.headers) {
    // Apply headers
    Object.entries(matchingRule.headers).forEach(
      ([headerName, headerValue]) => {
        res.setHeader(headerName, headerValue);
      },
    );

    // Debug logging (optional, controlled by env var)
    if (process.env.DEBUG_CACHE_HEADERS === "1") {
      console.log(
        `[Cache Headers] ${requestPath} -> ${matchingRule.headers["Cache-Control"] || "multiple headers"}`,
      );
    }
  }

  next();
}

/**
 * Reload cache configuration (for testing or hot-reload)
 */
export function reloadCacheConfig() {
  cacheConfig = loadCacheConfig();
  return cacheConfig !== null;
}

/**
 * Get current cache configuration (for debugging)
 */
export function getCacheConfig() {
  if (!cacheConfig) {
    cacheConfig = loadCacheConfig();
  }
  return cacheConfig;
}

/**
 * Test what headers would be applied to a path
 */
export function testPath(path) {
  if (!cacheConfig) {
    cacheConfig = loadCacheConfig();
  }

  if (!cacheConfig || !cacheConfig.rules) {
    return null;
  }

  const matchingRule = findMatchingRule(path, cacheConfig.rules);

  return matchingRule
    ? {
        pattern: matchingRule.pattern,
        comment: matchingRule.comment,
        headers: matchingRule.headers,
      }
    : null;
}

// Load config immediately on module import
cacheConfig = loadCacheConfig();

export default cacheHeadersMiddleware;
