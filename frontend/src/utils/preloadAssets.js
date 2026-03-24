/**
 * HAORI VISION  Preload & Preconnect Utilities
 *
 * Optimizes critical resource loading with:
 * - DNS prefetch for external domains
 * - Preconnect for critical third-party resources
 * - Preload for fonts, images, videos
 * - Resource hints for improved performance
 *
 * Usage:
 *   import { preconnectDomains, preloadFonts, preloadCriticalAssets } from '@/utils/preloadAssets';
 *
 *   preconnectDomains();
 *   preloadFonts();
 *   preloadCriticalAssets();
 */

// ============================================================
// Configuration
// ============================================================

const PRELOAD_CONFIG = {
  // External domains to preconnect
  domains: [
    "https://fonts.googleapis.com",
    "https://fonts.gstatic.com",
    "https://cdn.jsdelivr.net",
  ],

  // Critical fonts to preload
  fonts: [
    {
      href: "/fonts/Inter-Regular.woff2",
      type: "font/woff2",
      crossOrigin: "anonymous",
    },
    {
      href: "/fonts/Inter-Bold.woff2",
      type: "font/woff2",
      crossOrigin: "anonymous",
    },
  ],

  // Critical images to preload
  images: [
    // Hero image
    { href: "/images/hero-bg.webp", as: "image", type: "image/webp" },
    // Logo
    { href: "/images/logo.svg", as: "image", type: "image/svg+xml" },
  ],

  // Critical videos to preload
  videos: [
    // Hero video (only metadata, not full video)
    { href: "/videos/hero_720p.mp4", as: "video", type: "video/mp4" },
  ],

  // Critical styles
  styles: [{ href: "/css/critical.css", as: "style" }],
};

// ============================================================
// Link Element Creation
// ============================================================

/**
 * Create a <link> element and append to <head>
 */
function createLinkElement(rel, attributes) {
  // Check if already exists
  const selector = `link[rel="${rel}"][href="${attributes.href}"]`;
  if (document.querySelector(selector)) {
    console.log(`[Preload] Already exists: ${rel} ${attributes.href}`);
    return null;
  }

  const link = document.createElement("link");
  link.rel = rel;

  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (key === "crossOrigin") {
        link.crossOrigin = value;
      } else {
        link.setAttribute(key, value);
      }
    }
  });

  document.head.appendChild(link);
  console.log(`[Preload] Added: ${rel} ${attributes.href}`);

  return link;
}

// ============================================================
// DNS Prefetch
// ============================================================

/**
 * Add DNS prefetch for external domains
 * Resolves DNS before resource is requested
 */
export function dnsPrefetch(domains = PRELOAD_CONFIG.domains) {
  domains.forEach((domain) => {
    createLinkElement("dns-prefetch", { href: domain });
  });

  console.log(`[Preload] DNS prefetch: ${domains.length} domains`);
}

// ============================================================
// Preconnect
// ============================================================

/**
 * Preconnect to external domains
 * Establishes early connection (DNS + TCP + TLS)
 */
export function preconnectDomains(domains = PRELOAD_CONFIG.domains) {
  domains.forEach((domain) => {
    // Add preconnect
    createLinkElement("preconnect", {
      href: domain,
      crossOrigin: "anonymous",
    });

    // Also add dns-prefetch as fallback
    createLinkElement("dns-prefetch", { href: domain });
  });

  console.log(`[Preload] Preconnect: ${domains.length} domains`);
}

// ============================================================
// Preload Fonts
// ============================================================

/**
 * Preload critical fonts
 */
export function preloadFonts(fonts = PRELOAD_CONFIG.fonts) {
  fonts.forEach((font) => {
    createLinkElement("preload", {
      href: font.href,
      as: "font",
      type: font.type,
      crossOrigin: font.crossOrigin || "anonymous",
    });
  });

  console.log(`[Preload] Fonts: ${fonts.length} files`);
}

// ============================================================
// Preload Images
// ============================================================

/**
 * Preload critical images
 */
export function preloadImages(images = PRELOAD_CONFIG.images) {
  images.forEach((image) => {
    createLinkElement("preload", {
      href: image.href,
      as: image.as || "image",
      type: image.type,
      imagesrcset: image.srcset,
      imagesizes: image.sizes,
    });
  });

  console.log(`[Preload] Images: ${images.length} files`);
}

// ============================================================
// Preload Videos
// ============================================================

/**
 * Preload video metadata (not full video)
 */
export function preloadVideos(videos = PRELOAD_CONFIG.videos) {
  videos.forEach((video) => {
    createLinkElement("preload", {
      href: video.href,
      as: video.as || "video",
      type: video.type,
    });
  });

  console.log(`[Preload] Videos: ${videos.length} files`);
}

// ============================================================
// Preload Styles
// ============================================================

/**
 * Preload critical CSS
 */
export function preloadStyles(styles = PRELOAD_CONFIG.styles) {
  styles.forEach((style) => {
    createLinkElement("preload", {
      href: style.href,
      as: style.as || "style",
    });
  });

  console.log(`[Preload] Styles: ${styles.length} files`);
}

// ============================================================
// Preload All Critical Assets
// ============================================================

/**
 * Preload all critical resources
 */
export function preloadCriticalAssets() {
  console.log("[Preload] Loading critical assets...");

  // Preconnect first (fastest)
  preconnectDomains();

  // Preload resources in priority order
  preloadFonts();
  preloadImages();
  preloadVideos();
  preloadStyles();

  console.log("[Preload] All critical assets queued");
}

// ============================================================
// Prefetch (low-priority)
// ============================================================

/**
 * Prefetch resources for next page navigation
 */
export function prefetchResources(resources) {
  resources.forEach((resource) => {
    createLinkElement("prefetch", {
      href: resource.href,
      as: resource.as,
    });
  });

  console.log(`[Preload] Prefetch: ${resources.length} resources`);
}

// ============================================================
// Prerender (very aggressive)
// ============================================================

/**
 * Prerender entire page for instant navigation
 * Use sparingly! Only for high-confidence next pages
 */
export function prerenderPage(url) {
  createLinkElement("prerender", { href: url });
  console.log(`[Preload] Prerender: ${url}`);
}

// ============================================================
// Dynamic Asset Preloading
// ============================================================

/**
 * Preload asset dynamically (e.g., on user interaction)
 */
export function preloadAsset(url, options = {}) {
  const {
    as = "fetch",
    type,
    crossOrigin = "anonymous",
    priority = "auto",
  } = options;

  createLinkElement("preload", {
    href: url,
    as,
    type,
    crossOrigin,
    fetchpriority: priority,
  });

  console.log(`[Preload] Dynamic preload: ${url}`);
}

// ============================================================
// Fetch Priority Hints
// ============================================================

/**
 * Set fetch priority on existing elements
 */
export function setFetchPriority(selector, priority) {
  const elements = document.querySelectorAll(selector);

  elements.forEach((el) => {
    el.setAttribute("fetchpriority", priority);
  });

  console.log(
    `[Preload] Set priority "${priority}" on ${elements.length} elements`,
  );
}

// ============================================================
// Auto-initialize
// ============================================================

/**
 * Initialize all preload strategies
 */
export function initPreload() {
  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      preloadCriticalAssets();
    });
  } else {
    preloadCriticalAssets();
  }
}

// ============================================================
// Performance Monitoring
// ============================================================

/**
 * Log Resource Timing API data for preloaded assets
 */
export function logPreloadPerformance() {
  if (!window.performance || !window.performance.getEntriesByType) {
    console.warn("[Preload] Performance API not available");
    return;
  }

  const resources = window.performance
    .getEntriesByType("resource")
    .filter((entry) => {
      return (
        entry.initiatorType === "link" ||
        entry.name.includes("/fonts/") ||
        entry.name.includes("/images/")
      );
    });

  console.table(
    resources.map((r) => ({
      name: r.name.split("/").pop(),
      type: r.initiatorType,
      duration: `${r.duration.toFixed(2)}ms`,
      size: `${(r.transferSize / 1024).toFixed(2)}KB`,
    })),
  );
}

// ============================================================
// Export configuration for customization
// ============================================================

export { PRELOAD_CONFIG };
