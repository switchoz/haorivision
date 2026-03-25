import express from "express";
import Product from "../models/Product.js";
import { baseLogger } from "../middlewares/logger.js";

const router = express.Router();

/**
 * HAORI VISION — Dynamic Sitemap Generator
 *
 * Generates XML sitemaps for:
 * - Main sitemap (index)
 * - Products sitemap (only published products)
 * - Legal pages sitemap
 * - Static pages sitemap
 *
 * Routes:
 * - GET /sitemap.xml - Main sitemap index
 * - GET /sitemap-products.xml - Products sitemap
 * - GET /sitemap-legal.xml - Legal pages sitemap
 * - GET /sitemap-static.xml - Static pages sitemap
 */

// ============================================================
// Configuration
// ============================================================

const BASE_URL = process.env.BASE_URL || "https://haorivision.com";

// Priority values (0.0 - 1.0)
const PRIORITY = {
  homepage: 1.0,
  products: 0.8,
  collections: 0.7,
  legal: 0.5,
  static: 0.6,
};

// Change frequency
const CHANGEFREQ = {
  homepage: "daily",
  products: "weekly",
  collections: "weekly",
  legal: "monthly",
  static: "monthly",
};

// ============================================================
// Helper Functions
// ============================================================

/**
 * Generate XML sitemap header
 */
function generateXMLHeader() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;
}

/**
 * Generate XML sitemap footer
 */
function generateXMLFooter() {
  return `</urlset>`;
}

/**
 * Generate URL entry
 */
function generateURL(loc, lastmod, changefreq, priority, images = []) {
  let xml = `  <url>
    <loc>${BASE_URL}${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
`;

  // Add image entries if provided
  if (images && images.length > 0) {
    images.forEach((img) => {
      xml += `    <image:image>
      <image:loc>${BASE_URL}${img.url}</image:loc>
      <image:title>${escapeXML(img.title || "")}</image:title>
      <image:caption>${escapeXML(img.caption || "")}</image:caption>
    </image:image>
`;
    });
  }

  xml += `  </url>
`;
  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXML(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Format date to ISO 8601
 */
function formatDate(date) {
  return new Date(date).toISOString().split("T")[0];
}

// ============================================================
// Main Sitemap Index
// ============================================================

router.get("/sitemap.xml", async (req, res) => {
  try {
    const now = formatDate(new Date());

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap-static.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-products.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-legal.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;

    res.set("Content-Type", "application/xml");
    res.send(xml);
  } catch (error) {
    baseLogger.error({ err: error }, "Sitemap index error");
    res.status(500).send("Error generating sitemap index");
  }
});

// ============================================================
// Products Sitemap
// ============================================================

router.get("/sitemap-products.xml", async (req, res) => {
  try {
    // Fetch only published products
    const products = await Product.find({ published: true })
      .select("id name description images updatedAt")
      .sort({ updatedAt: -1 })
      .lean();

    let xml = generateXMLHeader();

    // Add each product
    products.forEach((product) => {
      const loc = `/product/${product.id}`;
      const lastmod = formatDate(product.updatedAt);
      const images =
        product.images?.slice(0, 5).map((img) => ({
          url: img.startsWith("http") ? img : `/media/products/${img}`,
          title: product.name,
          caption: product.description || product.name,
        })) || [];

      xml += generateURL(
        loc,
        lastmod,
        CHANGEFREQ.products,
        PRIORITY.products,
        images,
      );
    });

    xml += generateXMLFooter();

    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    res.send(xml);
  } catch (error) {
    baseLogger.error({ err: error }, "Products sitemap error");
    res.status(500).send("Error generating products sitemap");
  }
});

// ============================================================
// Legal Pages Sitemap
// ============================================================

router.get("/sitemap-legal.xml", async (req, res) => {
  try {
    const now = formatDate(new Date());

    const legalPages = [
      {
        loc: "/legal/returns.html",
        title: "Возврат и обмен",
        lastmod: "2025-10-17",
      },
      {
        loc: "/legal/care.html",
        title: "Уход за изделиями",
        lastmod: "2025-10-17",
      },
      {
        loc: "/legal/uv_safety.html",
        title: "Безопасность UV",
        lastmod: "2025-10-17",
      },
    ];

    let xml = generateXMLHeader();

    legalPages.forEach((page) => {
      xml += generateURL(
        page.loc,
        page.lastmod,
        CHANGEFREQ.legal,
        PRIORITY.legal,
      );
    });

    xml += generateXMLFooter();

    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
    res.send(xml);
  } catch (error) {
    baseLogger.error({ err: error }, "Legal sitemap error");
    res.status(500).send("Error generating legal sitemap");
  }
});

// ============================================================
// Static Pages Sitemap
// ============================================================

router.get("/sitemap-static.xml", async (req, res) => {
  try {
    const now = formatDate(new Date());

    const staticPages = [
      {
        loc: "/",
        priority: PRIORITY.homepage,
        changefreq: CHANGEFREQ.homepage,
      },
      {
        loc: "/shop",
        priority: PRIORITY.products,
        changefreq: CHANGEFREQ.products,
      },
      {
        loc: "/collections",
        priority: PRIORITY.collections,
        changefreq: CHANGEFREQ.collections,
      },
      {
        loc: "/gallery",
        priority: PRIORITY.collections,
        changefreq: CHANGEFREQ.collections,
      },
      {
        loc: "/presentation",
        priority: PRIORITY.static,
        changefreq: CHANGEFREQ.static,
      },
      {
        loc: "/bespoke",
        priority: PRIORITY.static,
        changefreq: CHANGEFREQ.static,
      },
      {
        loc: "/about",
        priority: PRIORITY.static,
        changefreq: CHANGEFREQ.static,
      },
      {
        loc: "/contact",
        priority: PRIORITY.static,
        changefreq: CHANGEFREQ.static,
      },
      {
        loc: "/faq",
        priority: PRIORITY.static,
        changefreq: CHANGEFREQ.static,
      },
      {
        loc: "/journal",
        priority: PRIORITY.static,
        changefreq: CHANGEFREQ.products,
      },
    ];

    let xml = generateXMLHeader();

    staticPages.forEach((page) => {
      xml += generateURL(page.loc, now, page.changefreq, page.priority);
    });

    xml += generateXMLFooter();

    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
    res.send(xml);
  } catch (error) {
    baseLogger.error({ err: error }, "Static sitemap error");
    res.status(500).send("Error generating static sitemap");
  }
});

// ============================================================
// Sitemap Statistics (for monitoring)
// ============================================================

router.get("/sitemap/stats", async (req, res) => {
  try {
    const publishedProducts = await Product.countDocuments({ published: true });
    const totalProducts = await Product.countDocuments();
    const recentProducts = await Product.countDocuments({
      published: true,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    res.json({
      success: true,
      stats: {
        products: {
          total: totalProducts,
          published: publishedProducts,
          unpublished: totalProducts - publishedProducts,
          recentlyAdded: recentProducts,
        },
        sitemaps: {
          main: `${BASE_URL}/sitemap.xml`,
          products: `${BASE_URL}/sitemap-products.xml`,
          legal: `${BASE_URL}/sitemap-legal.xml`,
          static: `${BASE_URL}/sitemap-static.xml`,
        },
        lastGenerated: new Date().toISOString(),
      },
    });
  } catch (error) {
    baseLogger.error({ err: error }, "Sitemap stats error");
    res.status(500).json({
      success: false,
      error: "Error fetching sitemap statistics",
    });
  }
});

export default router;
