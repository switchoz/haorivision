/**
 * HAORI VISION — Performance Preloads Component
 *
 * Generates <link rel="preload"> tags for critical resources.
 * Only loads resources that exist and respects feature flags.
 *
 * Usage:
 *   import PerfPreloads from '@/components/PerfPreloads';
 *
 *   // In new page/layout:
 *   <PerfPreloads page="/" />
 *
 * IMPORTANT: Only use on NEW pages. Do NOT modify existing layouts.
 */

import React, { useEffect, useState } from "react";

// ============================================================
// Configuration
// ============================================================

const PRELOADS_CONFIG_URL = "/configs/preloads.json";
const FEATURE_FLAG = process.env.REACT_APP_PERF_PRELOADS === "1";

// Cache for config to avoid re-fetching
let configCache = null;
let configPromise = null;

// ============================================================
// Config Loading
// ============================================================

/**
 * Load preloads configuration
 */
async function loadPreloadsConfig() {
  if (configCache) {
    return configCache;
  }

  if (configPromise) {
    return configPromise;
  }

  configPromise = fetch(PRELOADS_CONFIG_URL)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to load preloads config: ${res.status}`);
      }
      return res.json();
    })
    .then((config) => {
      configCache = config;
      return config;
    })
    .catch((error) => {
      console.warn("[PerfPreloads] Failed to load config:", error.message);
      return null;
    })
    .finally(() => {
      configPromise = null;
    });

  return configPromise;
}

/**
 * Check if a file exists
 */
async function checkFileExists(href) {
  try {
    const response = await fetch(href, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get matching page config
 */
function getPageConfig(config, page) {
  if (!config || !config.pages) {
    return null;
  }

  // Exact match
  if (config.pages[page]) {
    return config.pages[page];
  }

  // Wildcard match (e.g., /products/* matches /products/P001)
  const wildcardMatch = Object.keys(config.pages).find((pattern) => {
    if (pattern.includes("*")) {
      const regex = new RegExp("^" + pattern.replace("*", ".*") + "$");
      return regex.test(page);
    }
    return false;
  });

  return wildcardMatch ? config.pages[wildcardMatch] : null;
}

/**
 * Resolve resources to preload
 */
async function resolvePreloads(config, page) {
  if (!config) {
    return [];
  }

  const resources = [];

  // Global resources
  if (config.global && config.global.resources) {
    resources.push(...config.global.resources);
  }

  // Page-specific resources
  const pageConfig = getPageConfig(config, page);
  if (pageConfig && pageConfig.resources) {
    resources.push(...pageConfig.resources);
  }

  // Conditional resources (feature flags)
  if (config.conditionalPreloads && FEATURE_FLAG) {
    Object.entries(config.conditionalPreloads).forEach(
      ([flagName, flagConfig]) => {
        if (flagConfig.enabled && flagConfig.resources) {
          resources.push(...flagConfig.resources);
        }
      },
    );
  }

  // Validate file existence
  if (config.validation && config.validation.checkFileExists) {
    const validatedResources = [];

    for (const resource of resources) {
      const exists = await checkFileExists(resource.href);

      if (exists) {
        validatedResources.push(resource);
      } else if (config.validation.logMissing) {
        console.warn(`[PerfPreloads] Resource not found: ${resource.href}`);
      }
    }

    return validatedResources;
  }

  return resources;
}

// ============================================================
// Component
// ============================================================

/**
 * PerfPreloads Component
 * @param {string} page - Current page path (e.g., '/', '/catalog')
 */
export default function PerfPreloads({ page = "/" }) {
  const [preloads, setPreloads] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Skip if feature flag disabled
    if (!FEATURE_FLAG) {
      if (import.meta.env.DEV)
        console.info(
          "[PerfPreloads] Feature disabled (REACT_APP_PERF_PRELOADS != 1)",
        );
      setLoaded(true);
      return;
    }

    let mounted = true;

    async function loadPreloads() {
      try {
        const config = await loadPreloadsConfig();
        if (!config || !mounted) {
          return;
        }

        const resources = await resolvePreloads(config, page);

        if (mounted) {
          setPreloads(resources);
          setLoaded(true);

          if (process.env.NODE_ENV === "development") {
            console.log("[PerfPreloads] Loaded preloads:", resources);
          }
        }
      } catch (error) {
        console.error("[PerfPreloads] Error loading preloads:", error);
        setLoaded(true);
      }
    }

    loadPreloads();

    return () => {
      mounted = false;
    };
  }, [page]);

  // Don't render anything until loaded
  if (!loaded) {
    return null;
  }

  // Don't render if no preloads
  if (preloads.length === 0) {
    return null;
  }

  return (
    <>
      {preloads.map((resource, index) => (
        <link
          key={`preload-${index}`}
          rel="preload"
          href={resource.href}
          as={resource.as}
          type={resource.type}
          crossOrigin={resource.crossorigin}
          data-comment={resource.comment}
        />
      ))}
    </>
  );
}

// ============================================================
// Utility Exports
// ============================================================

/**
 * Generate preload links as HTML string (for SSR)
 */
export async function generatePreloadHTML(page = "/") {
  const config = await loadPreloadsConfig();
  if (!config) {
    return "";
  }

  const resources = await resolvePreloads(config, page);
  if (resources.length === 0) {
    return "";
  }

  return resources
    .map((resource) => {
      const attrs = [
        'rel="preload"',
        `href="${resource.href}"`,
        `as="${resource.as}"`,
        resource.type ? `type="${resource.type}"` : null,
        resource.crossorigin ? `crossorigin="${resource.crossorigin}"` : null,
      ]
        .filter(Boolean)
        .join(" ");

      const comment = resource.comment
        ? `<!-- ${resource.comment} -->\n  `
        : "";
      return `${comment}<link ${attrs} />`;
    })
    .join("\n  ");
}

/**
 * Preload resources imperatively (for dynamic loading)
 */
export async function preloadResources(page = "/") {
  const config = await loadPreloadsConfig();
  if (!config) {
    return [];
  }

  const resources = await resolvePreloads(config, page);

  resources.forEach((resource) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = resource.href;
    link.as = resource.as;
    if (resource.type) link.type = resource.type;
    if (resource.crossorigin) link.crossOrigin = resource.crossorigin;

    document.head.appendChild(link);
  });

  return resources;
}
