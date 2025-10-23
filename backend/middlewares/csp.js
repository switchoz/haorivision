/**
 * HAORI VISION — Content Security Policy Middleware (P21)
 *
 * Loads CSP configuration from /configs/csp.json and applies headers.
 *
 * Features:
 * - Configurable whitelist for domains
 * - Development vs Production mode
 * - Report-Only mode for testing
 * - Automatic CSP header generation
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_PATH = path.resolve(__dirname, "../../configs/csp.json");

/**
 * Load CSP configuration from JSON file
 */
function loadCSPConfig() {
  try {
    const configData = fs.readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(configData);
  } catch (error) {
    console.error("[CSP] Error loading CSP config:", error.message);
    console.error("[CSP] Using default fallback policy");

    // Fallback minimal CSP
    return {
      policy: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "https:"],
        "font-src": ["'self'", "data:"],
        "connect-src": ["'self'"],
        "object-src": ["'none'"],
      },
      reportOnly: false,
    };
  }
}

/**
 * Build CSP header string from policy object
 */
function buildCSPHeader(policy, isProduction = false) {
  const directives = [];

  for (const [directive, sources] of Object.entries(policy)) {
    // Skip boolean directives
    if (typeof sources === "boolean") {
      if (sources && directive === "upgrade-insecure-requests") {
        directives.push("upgrade-insecure-requests");
      }
      continue;
    }

    if (Array.isArray(sources) && sources.length > 0) {
      // Filter out development-only sources in production
      let filteredSources = sources;

      if (isProduction) {
        filteredSources = sources.filter((source) => {
          // Remove localhost, unsafe-eval in production
          if (source.includes("localhost")) return false;
          if (source === "'unsafe-eval'") return false;
          if (source.startsWith("ws://localhost")) return false;
          if (source.startsWith("wss://localhost")) return false;
          return true;
        });
      }

      if (filteredSources.length > 0) {
        directives.push(`${directive} ${filteredSources.join(" ")}`);
      }
    }
  }

  return directives.join("; ");
}

/**
 * CSP Middleware
 */
export function cspMiddleware(req, res, next) {
  try {
    const config = loadCSPConfig();
    const isProduction = process.env.NODE_ENV === "production";

    // Build CSP header
    const cspHeader = buildCSPHeader(config.policy, isProduction);

    // Set header (Report-Only or enforcing)
    const headerName = config.reportOnly
      ? "Content-Security-Policy-Report-Only"
      : "Content-Security-Policy";

    res.setHeader(headerName, cspHeader);

    // Log in development
    if (!isProduction && req.path === "/") {
      console.log(
        `[CSP] Applied policy (${config.reportOnly ? "Report-Only" : "Enforcing"})`,
      );
    }
  } catch (error) {
    console.error("[CSP] Error applying CSP middleware:", error);
  }

  next();
}

/**
 * Validate CSP configuration (for testing)
 */
export function validateCSPConfig() {
  try {
    const config = loadCSPConfig();

    console.log("\n=== CSP Configuration Validation ===\n");

    // Check required directives
    const requiredDirectives = [
      "default-src",
      "script-src",
      "style-src",
      "img-src",
      "connect-src",
      "object-src",
    ];

    let valid = true;

    for (const directive of requiredDirectives) {
      if (config.policy[directive]) {
        console.log(
          `✓ ${directive}: ${config.policy[directive].length} sources`,
        );
      } else {
        console.log(`✗ ${directive}: MISSING`);
        valid = false;
      }
    }

    console.log("\n=== Whitelisted Domains ===\n");
    if (config.whitelisted_domains) {
      for (const [category, domains] of Object.entries(
        config.whitelisted_domains,
      )) {
        console.log(`${category}:`);
        domains.forEach((domain) => console.log(`  - ${domain}`));
      }
    }

    console.log("\n=== CSP Header Preview ===\n");
    const headerDev = buildCSPHeader(config.policy, false);
    const headerProd = buildCSPHeader(config.policy, true);

    console.log("Development:");
    console.log(headerDev.substring(0, 200) + "...\n");

    console.log("Production:");
    console.log(headerProd.substring(0, 200) + "...\n");

    if (valid) {
      console.log("✅ CSP configuration is valid\n");
      return true;
    } else {
      console.log("❌ CSP configuration has missing directives\n");
      return false;
    }
  } catch (error) {
    console.error("❌ Error validating CSP config:", error);
    return false;
  }
}

export default {
  cspMiddleware,
  validateCSPConfig,
};
