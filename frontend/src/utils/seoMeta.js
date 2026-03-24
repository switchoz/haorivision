/**
 * HAORI VISION — SEO Meta Tags Generator
 *
 * Generates Open Graph and Twitter Card meta tags for pages.
 * Ensures consistent social media previews across platforms.
 *
 * Usage:
 *   import { generateMetaTags } from '@/utils/seoMeta';
 *
 *   // In component or page:
 *   const metaTags = generateMetaTags({
 *     title: 'Product Name',
 *     description: 'Product description',
 *     image: '/media/product.jpg',
 *     type: 'product'
 *   });
 *
 *   // Then inject into <head> using Helmet or similar
 */

// ============================================================
// Configuration
// ============================================================

const DEFAULT_CONFIG = {
  siteName: "HAORI VISION",
  siteUrl: process.env.REACT_APP_SITE_URL || "https://haorivision.com",
  defaultImage: "/media/og-default.jpg",
  defaultDescription:
    "Premium Japanese-inspired fashion with integrated UV LED technology. Handcrafted silk, cotton, and techno-fabrics.",
  twitterHandle: "@haorivision",
  locale: "ru_RU",
  localeAlternate: ["en_US", "fr_FR"],
};

// ============================================================
// Meta Tags Generator
// ============================================================

/**
 * Generate complete meta tags object
 * @param {Object} options - Meta tag options
 * @returns {Object} Meta tags for head injection
 */
export function generateMetaTags(options = {}) {
  const {
    title,
    description = DEFAULT_CONFIG.defaultDescription,
    image = DEFAULT_CONFIG.defaultImage,
    type = "website", // website, article, product
    url,
    author,
    publishedTime,
    modifiedTime,
    tags = [],
    price,
    currency = "EUR",
    availability = "in stock",
    noIndex = false,
  } = options;

  // Construct full URLs
  const fullUrl = url
    ? `${DEFAULT_CONFIG.siteUrl}${url}`
    : DEFAULT_CONFIG.siteUrl;
  const fullImage = image.startsWith("http")
    ? image
    : `${DEFAULT_CONFIG.siteUrl}${image}`;

  // Full title with site name
  const fullTitle = title
    ? `${title} — ${DEFAULT_CONFIG.siteName}`
    : DEFAULT_CONFIG.siteName;

  // Meta tags object
  const metaTags = {
    // Basic meta tags
    title: fullTitle,
    description,
    canonical: fullUrl,

    // Open Graph (Facebook, LinkedIn)
    "og:site_name": DEFAULT_CONFIG.siteName,
    "og:title": title || DEFAULT_CONFIG.siteName,
    "og:description": description,
    "og:type": type,
    "og:url": fullUrl,
    "og:image": fullImage,
    "og:image:width": "1200",
    "og:image:height": "630",
    "og:image:alt": title || DEFAULT_CONFIG.siteName,
    "og:locale": DEFAULT_CONFIG.locale,

    // Twitter Card
    "twitter:card": "summary_large_image",
    "twitter:site": DEFAULT_CONFIG.twitterHandle,
    "twitter:creator": DEFAULT_CONFIG.twitterHandle,
    "twitter:title": title || DEFAULT_CONFIG.siteName,
    "twitter:description": description,
    "twitter:image": fullImage,
    "twitter:image:alt": title || DEFAULT_CONFIG.siteName,
  };

  // Add locale alternates
  DEFAULT_CONFIG.localeAlternate.forEach((locale) => {
    metaTags[`og:locale:alternate:${locale}`] = locale;
  });

  // Add article-specific tags
  if (type === "article") {
    if (author) metaTags["article:author"] = author;
    if (publishedTime) metaTags["article:published_time"] = publishedTime;
    if (modifiedTime) metaTags["article:modified_time"] = modifiedTime;
    if (tags.length > 0) {
      tags.forEach((tag, index) => {
        metaTags[`article:tag:${index}`] = tag;
      });
    }
  }

  // Add product-specific tags
  if (type === "product") {
    metaTags["og:type"] = "product";
    if (price) {
      metaTags["product:price:amount"] = price;
      metaTags["product:price:currency"] = currency;
    }
    if (availability) {
      metaTags["product:availability"] = availability;
    }
  }

  // Add robots meta
  if (noIndex) {
    metaTags["robots"] = "noindex, nofollow";
  } else {
    metaTags["robots"] =
      "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";
  }

  return metaTags;
}

// ============================================================
// React Helmet Helper
// ============================================================

/**
 * Generate meta tags array for React Helmet
 * @param {Object} options - Meta tag options
 * @returns {Array} Array of meta tag objects
 */
export function generateHelmetMeta(options = {}) {
  const metaTags = generateMetaTags(options);
  const helmetMeta = [];

  // Convert object to array of { name/property, content }
  Object.entries(metaTags).forEach(([key, value]) => {
    if (key === "title" || key === "canonical") return; // Handled separately in Helmet

    const isOG =
      key.startsWith("og:") ||
      key.startsWith("article:") ||
      key.startsWith("product:");
    const isTwitter = key.startsWith("twitter:");

    helmetMeta.push({
      [isOG || isTwitter ? "property" : "name"]: key,
      content: value,
    });
  });

  return helmetMeta;
}

// ============================================================
// HTML String Generator
// ============================================================

/**
 * Generate meta tags as HTML string (for SSR)
 * @param {Object} options - Meta tag options
 * @returns {String} HTML string of meta tags
 */
export function generateMetaHTML(options = {}) {
  const metaTags = generateMetaTags(options);
  let html = "";

  // Title
  html += `<title>${metaTags.title}</title>\n`;

  // Canonical
  html += `<link rel="canonical" href="${metaTags.canonical}" />\n`;

  // Meta tags
  Object.entries(metaTags).forEach(([key, value]) => {
    if (key === "title" || key === "canonical") return;

    const isOG =
      key.startsWith("og:") ||
      key.startsWith("article:") ||
      key.startsWith("product:");
    const isTwitter = key.startsWith("twitter:");
    const attr = isOG || isTwitter ? "property" : "name";

    html += `<meta ${attr}="${key}" content="${escapeHTML(value)}" />\n`;
  });

  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================
// Page-Specific Helpers
// ============================================================

/**
 * Generate meta tags for product page
 */
export function generateProductMeta(product) {
  return generateMetaTags({
    title: product.name,
    description:
      product.description ||
      `${product.name} — Premium ${product.category} from HAORI VISION`,
    image: product.images?.[0] || DEFAULT_CONFIG.defaultImage,
    type: "product",
    url: `/products/${product.sku}`,
    price: product.price,
    currency: product.currency || "EUR",
    availability: product.stock > 0 ? "in stock" : "out of stock",
    tags: product.tags || [],
  });
}

/**
 * Generate meta tags for collection page
 */
export function generateCollectionMeta(collection) {
  return generateMetaTags({
    title: collection.name,
    description:
      collection.description ||
      `${collection.name} collection — Premium fashion from HAORI VISION`,
    image: collection.image || DEFAULT_CONFIG.defaultImage,
    type: "website",
    url: `/collections/${collection.slug}`,
  });
}

/**
 * Generate meta tags for homepage
 */
export function generateHomepageMeta() {
  return generateMetaTags({
    title: null, // Will use site name only
    description: DEFAULT_CONFIG.defaultDescription,
    image: DEFAULT_CONFIG.defaultImage,
    type: "website",
    url: "/",
  });
}

/**
 * Generate meta tags for legal pages
 */
export function generateLegalMeta(page) {
  const titles = {
    returns: "Return Policy",
    care: "Care Instructions",
    uv_safety: "UV Safety",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
  };

  const descriptions = {
    returns:
      "14-day return policy for ready-made items. Bespoke items non-returnable except for defects.",
    care: "Care instructions for silk, cotton, techno-fabrics, and UV LED system.",
    uv_safety:
      "UV safety guidelines: distance, frequency ≤3 Hz, epilepsy warnings.",
    privacy: "How we collect, use, and protect your personal data.",
    terms: "Terms and conditions for using HAORI VISION services.",
  };

  return generateMetaTags({
    title: titles[page] || page,
    description: descriptions[page] || "",
    image: DEFAULT_CONFIG.defaultImage,
    type: "website",
    url: `/legal/${page}.html`,
  });
}

// ============================================================
// JSON-LD Structured Data
// ============================================================

/**
 * Generate JSON-LD structured data for product
 */
export function generateProductJSONLD(product) {
  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image:
      product.images?.map((img) =>
        img.startsWith("http")
          ? img
          : `${DEFAULT_CONFIG.siteUrl}/media/products/${img}`,
      ) || [],
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: "HAORI VISION",
    },
    offers: {
      "@type": "Offer",
      url: `${DEFAULT_CONFIG.siteUrl}/products/${product.sku}`,
      priceCurrency: product.currency || "EUR",
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
  };
}

/**
 * Generate JSON-LD structured data for organization
 */
export function generateOrganizationJSONLD() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "HAORI VISION",
    url: DEFAULT_CONFIG.siteUrl,
    logo: `${DEFAULT_CONFIG.siteUrl}/logo.png`,
    description: DEFAULT_CONFIG.defaultDescription,
    sameAs: [
      "https://instagram.com/haorivision",
      "https://twitter.com/haorivision",
      "https://facebook.com/haorivision",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+33-1-234-56-789",
      contactType: "Customer Service",
      email: "support@haorivision.com",
      availableLanguage: ["Russian", "English", "French"],
    },
  };
}

/**
 * Generate JSON-LD breadcrumb list
 */
export function generateBreadcrumbJSONLD(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${DEFAULT_CONFIG.siteUrl}${item.url}`,
    })),
  };
}

// ============================================================
// Export Default Config (for overriding)
// ============================================================

export const DEFAULT_SEO_CONFIG = DEFAULT_CONFIG;
