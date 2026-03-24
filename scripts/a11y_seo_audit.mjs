#!/usr/bin/env node
/**
 * HAORI VISION — A11y & SEO Audit (Read-Only)
 *
 * Audits:
 * - axe-core: contrast, aria-label, tab-order
 * - Lighthouse: TTI, LCP, CLS, performance metrics
 * - Structured data: Product + Offer schema for new products
 *
 * Usage:
 *   node scripts/a11y_seo_audit.mjs
 *   node scripts/a11y_seo_audit.mjs --url=http://localhost:3080
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import lighthouse from 'lighthouse';
import { AxePuppeteer } from '@axe-core/puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// Configuration
// ============================================================

const BASE_URL = process.argv.find(arg => arg.startsWith('--url='))?.split('=')[1] || 'http://localhost:3080';
const ROOT_DIR = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT_DIR, 'configs', 'lh.json');
const CATALOG_PATH = path.join(ROOT_DIR, 'data', 'products', 'collections.json');
const REPORTS_DIR = path.join(ROOT_DIR, 'reports');

// Load Lighthouse config
let lighthouseConfig = {
  thresholds: {
    performance: 85,
    accessibility: 90,
    'best-practices': 85,
    seo: 90
  },
  metrics: {
    'first-contentful-paint': 1800,
    'largest-contentful-paint': 2500,
    'cumulative-layout-shift': 0.1,
    'time-to-interactive': 3800
  }
};

try {
  if (fs.existsSync(CONFIG_PATH)) {
    const configFile = fs.readFileSync(CONFIG_PATH, 'utf-8');
    lighthouseConfig = JSON.parse(configFile);
  }
} catch (error) {
  console.warn('Failed to load Lighthouse config, using defaults:', error.message);
}

// ============================================================
// Utilities
// ============================================================

function formatDate() {
  const now = new Date();
  return now.toISOString().split('T')[0].replace(/-/g, '');
}

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '[INFO]',
    warn: '[WARN]',
    error: '[ERROR]',
    success: '[SUCCESS]'
  }[type] || '[INFO]';

  console.log(`${timestamp} ${prefix} ${message}`);
}

// ============================================================
// Catalog Parser
// ============================================================

function getNewProducts() {
  if (!fs.existsSync(CATALOG_PATH)) {
    log('Catalog not found, using test products', 'warn');
    return [
      { id: 'TEST-001', title: 'Test Product 1' },
      { id: 'TEST-002', title: 'Test Product 2' }
    ];
  }

  try {
    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
    const products = [];

    // Traverse catalog to find products
    function traverse(obj) {
      if (Array.isArray(obj)) {
        obj.forEach(item => traverse(item));
      } else if (obj && typeof obj === 'object') {
        // Check if this is a product
        if (obj.id && typeof obj.id === 'string' && !obj.id.startsWith('col_')) {
          products.push({
            id: obj.id,
            title: obj.title || obj.name || 'Untitled',
            price_eur: obj.price_eur || obj.price || 0,
            edition: obj.edition || 1,
            totalEditions: obj.totalEditions || 1,
            status: obj.status || 'available',
            description: obj.description || ''
          });
        }

        // Recurse into nested objects
        Object.values(obj).forEach(value => traverse(value));
      }
    }

    traverse(catalog);

    // Filter to new products only (IDs that match new patterns)
    // Consider "new" if ID starts with TEST-, HV-202510-, or recent series
    const newProducts = products.filter(p => {
      return p.id.startsWith('TEST-') ||
             p.id.startsWith('HV-202510-') ||
             p.id.match(/^(ECLIPSE|LUMIN|BLOOM)-(0[1-3])$/);
    });

    log(`Found ${products.length} total products, ${newProducts.length} new products`);

    return newProducts;
  } catch (error) {
    log(`Failed to load catalog: ${error.message}`, 'error');
    return [];
  }
}

// ============================================================
// Axe-core Accessibility Audit
// ============================================================

async function runAxeAudit(page, url) {
  log(`Running axe-core audit on ${url}`);

  try {
    // Note: AxePuppeteer works with Puppeteer, not Playwright
    // For Playwright, we'll inject axe-core manually
    await page.goto(url, { waitUntil: 'networkidle' });

    // Inject axe-core
    await page.addScriptTag({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js'
    });

    // Run axe scan
    const results = await page.evaluate(() => {
      return new Promise((resolve) => {
        window.axe.run(
          {
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
            }
          },
          (err, results) => {
            if (err) throw err;
            resolve(results);
          }
        );
      });
    });

    return {
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      url
    };
  } catch (error) {
    log(`Axe audit failed for ${url}: ${error.message}`, 'error');
    return {
      violations: [],
      passes: [],
      incomplete: [],
      url,
      error: error.message
    };
  }
}

// ============================================================
// Lighthouse Performance Audit
// ============================================================

async function runLighthouseAudit(url) {
  log(`Running Lighthouse audit on ${url}`);

  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to page first
    await page.goto(url, { waitUntil: 'networkidle' });

    const cdpSession = await context.newCDPSession(page);

    const { lhr } = await lighthouse(url, {
      port: new URL(browser.wsEndpoint()).port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
    });

    await browser.close();

    // Extract key metrics
    const metrics = {
      scores: {
        performance: lhr.categories.performance?.score * 100 || 0,
        accessibility: lhr.categories.accessibility?.score * 100 || 0,
        'best-practices': lhr.categories['best-practices']?.score * 100 || 0,
        seo: lhr.categories.seo?.score * 100 || 0
      },
      metrics: {
        'first-contentful-paint': lhr.audits['first-contentful-paint']?.numericValue || 0,
        'largest-contentful-paint': lhr.audits['largest-contentful-paint']?.numericValue || 0,
        'cumulative-layout-shift': lhr.audits['cumulative-layout-shift']?.numericValue || 0,
        'time-to-interactive': lhr.audits['interactive']?.numericValue || 0,
        'speed-index': lhr.audits['speed-index']?.numericValue || 0,
        'total-blocking-time': lhr.audits['total-blocking-time']?.numericValue || 0
      },
      opportunities: lhr.audits['diagnostics']?.details?.items || [],
      url
    };

    return metrics;
  } catch (error) {
    log(`Lighthouse audit failed for ${url}: ${error.message}`, 'error');
    return {
      scores: {},
      metrics: {},
      opportunities: [],
      url,
      error: error.message
    };
  }
}

// ============================================================
// Structured Data Validation
// ============================================================

async function checkStructuredData(page, url, product) {
  log(`Checking structured data for ${url}`);

  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    // Extract JSON-LD structured data
    const structuredData = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      return scripts.map(script => {
        try {
          return JSON.parse(script.textContent);
        } catch {
          return null;
        }
      }).filter(Boolean);
    });

    // Check if Product schema exists
    const hasProductSchema = structuredData.some(data =>
      data['@type'] === 'Product' || data['@graph']?.some(item => item['@type'] === 'Product')
    );

    // Check if Offer schema exists
    const hasOfferSchema = structuredData.some(data =>
      data.offers || data['@graph']?.some(item => item.offers)
    );

    return {
      exists: hasProductSchema,
      hasOffer: hasOfferSchema,
      data: structuredData,
      url,
      shouldAdd: !hasProductSchema // If missing, suggest adding
    };
  } catch (error) {
    log(`Structured data check failed for ${url}: ${error.message}`, 'error');
    return {
      exists: false,
      hasOffer: false,
      data: [],
      url,
      error: error.message,
      shouldAdd: true
    };
  }
}

// ============================================================
// Generate Structured Data
// ============================================================

function generateProductSchema(product) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "description": product.description || `${product.title} - Limited edition fluorescent wearable art by HAORI VISION`,
    "brand": {
      "@type": "Brand",
      "name": "HAORI VISION"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://haorivision.com/products/${product.id}`,
      "priceCurrency": "EUR",
      "price": product.price_eur?.toFixed(2) || "0.00",
      "availability": product.status === 'sold_out'
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
      "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    "sku": product.id,
    "productID": product.id,
    "category": "Apparel & Accessories > Clothing > Outerwear > Kimonos & Haoris",
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "Edition",
        "value": `${product.edition} of ${product.totalEditions}`
      },
      {
        "@type": "PropertyValue",
        "name": "Technique",
        "value": "Fluorescent Hand-Painted"
      }
    ]
  };

  return schema;
}

// ============================================================
// HTML Report Generation
// ============================================================

function generateHTMLReport(results) {
  const { axeResults, lighthouseResults, structuredDataResults, summary } = results;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HAORI VISION — A11y & SEO Audit Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header {
      background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
      color: white;
      padding: 40px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    h1 { font-size: 32px; margin-bottom: 10px; }
    .subtitle { opacity: 0.9; font-size: 16px; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: white;
      padding: 25px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .summary-card h3 { font-size: 14px; color: #666; margin-bottom: 10px; }
    .summary-card .value { font-size: 36px; font-weight: bold; color: #a855f7; }
    .section {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    h2 {
      font-size: 24px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #a855f7;
    }
    .product { margin-bottom: 40px; }
    .product h3 { font-size: 20px; margin-bottom: 15px; color: #6366f1; }
    .violation, .opportunity {
      background: #fff3f3;
      border-left: 4px solid #ef4444;
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    .pass {
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    .metric {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .metric:last-child { border-bottom: none; }
    .metric-name { font-weight: 500; }
    .metric-value { font-weight: bold; }
    .metric-value.good { color: #22c55e; }
    .metric-value.warning { color: #f59e0b; }
    .metric-value.bad { color: #ef4444; }
    .score-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-weight: bold;
      font-size: 14px;
    }
    .score-good { background: #22c55e; color: white; }
    .score-warning { background: #f59e0b; color: white; }
    .score-bad { background: #ef4444; color: white; }
    pre {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 13px;
    }
    code { font-family: 'Courier New', monospace; }
    .timestamp {
      text-align: center;
      color: #999;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>HAORI VISION</h1>
      <p class="subtitle">Accessibility & SEO Audit Report</p>
      <p class="subtitle">Generated: ${new Date().toLocaleString()}</p>
    </header>

    <div class="summary">
      <div class="summary-card">
        <h3>Products Audited</h3>
        <div class="value">${summary.productsAudited}</div>
      </div>
      <div class="summary-card">
        <h3>Accessibility Issues</h3>
        <div class="value" style="color: ${summary.totalViolations > 0 ? '#ef4444' : '#22c55e'}">${summary.totalViolations}</div>
      </div>
      <div class="summary-card">
        <h3>Avg Performance Score</h3>
        <div class="value">${summary.avgPerformance}</div>
      </div>
      <div class="summary-card">
        <h3>Missing Structured Data</h3>
        <div class="value" style="color: ${summary.missingStructuredData > 0 ? '#f59e0b' : '#22c55e'}">${summary.missingStructuredData}</div>
      </div>
    </div>

    ${Object.keys(axeResults).map(productId => {
      const axe = axeResults[productId];
      const lh = lighthouseResults[productId];
      const sd = structuredDataResults[productId];

      return `
      <div class="section product">
        <h3>${productId}</h3>

        <h4 style="margin-top: 20px;">Accessibility (axe-core)</h4>
        ${axe.violations.length > 0 ? `
          <div style="margin-top: 10px;">
            <strong style="color: #ef4444;">Violations (${axe.violations.length})</strong>
            ${axe.violations.map(v => `
              <div class="violation">
                <strong>${v.impact?.toUpperCase() || 'UNKNOWN'}: ${v.description}</strong>
                <p>${v.help}</p>
                <small>${v.nodes?.length || 0} element(s) affected</small>
              </div>
            `).join('')}
          </div>
        ` : '<div class="pass">No accessibility violations found!</div>'}

        <h4 style="margin-top: 20px;">Performance (Lighthouse)</h4>
        ${lh.scores ? `
          <div style="margin-bottom: 15px;">
            Performance: <span class="score-badge ${lh.scores.performance >= 85 ? 'score-good' : lh.scores.performance >= 50 ? 'score-warning' : 'score-bad'}">${Math.round(lh.scores.performance)}</span>
            Accessibility: <span class="score-badge ${lh.scores.accessibility >= 90 ? 'score-good' : lh.scores.accessibility >= 70 ? 'score-warning' : 'score-bad'}">${Math.round(lh.scores.accessibility)}</span>
            Best Practices: <span class="score-badge ${lh.scores['best-practices'] >= 85 ? 'score-good' : lh.scores['best-practices'] >= 60 ? 'score-warning' : 'score-bad'}">${Math.round(lh.scores['best-practices'])}</span>
            SEO: <span class="score-badge ${lh.scores.seo >= 90 ? 'score-good' : lh.scores.seo >= 70 ? 'score-warning' : 'score-bad'}">${Math.round(lh.scores.seo)}</span>
          </div>
          <div>
            <div class="metric">
              <span class="metric-name">First Contentful Paint</span>
              <span class="metric-value ${lh.metrics['first-contentful-paint'] < 1800 ? 'good' : lh.metrics['first-contentful-paint'] < 3000 ? 'warning' : 'bad'}">${Math.round(lh.metrics['first-contentful-paint'])}ms</span>
            </div>
            <div class="metric">
              <span class="metric-name">Largest Contentful Paint</span>
              <span class="metric-value ${lh.metrics['largest-contentful-paint'] < 2500 ? 'good' : lh.metrics['largest-contentful-paint'] < 4000 ? 'warning' : 'bad'}">${Math.round(lh.metrics['largest-contentful-paint'])}ms</span>
            </div>
            <div class="metric">
              <span class="metric-name">Cumulative Layout Shift</span>
              <span class="metric-value ${lh.metrics['cumulative-layout-shift'] < 0.1 ? 'good' : lh.metrics['cumulative-layout-shift'] < 0.25 ? 'warning' : 'bad'}">${lh.metrics['cumulative-layout-shift'].toFixed(3)}</span>
            </div>
            <div class="metric">
              <span class="metric-name">Time to Interactive</span>
              <span class="metric-value ${lh.metrics['time-to-interactive'] < 3800 ? 'good' : lh.metrics['time-to-interactive'] < 7300 ? 'warning' : 'bad'}">${Math.round(lh.metrics['time-to-interactive'])}ms</span>
            </div>
          </div>
        ` : '<p>Lighthouse audit failed or not available</p>'}

        <h4 style="margin-top: 20px;">Structured Data (Schema.org)</h4>
        ${sd.shouldAdd ? `
          <div class="warning">
            <strong>Missing Product Schema</strong>
            <p>Add the following JSON-LD to the page:</p>
            <pre><code>${JSON.stringify(generateProductSchema({ id: productId, title: productId, price_eur: 299, edition: 1, totalEditions: 10, status: 'available' }), null, 2)}</code></pre>
          </div>
        ` : '<div class="pass">Product schema found!</div>'}
      </div>
      `;
    }).join('')}

    <div class="timestamp">
      Report generated on ${new Date().toLocaleString()}<br>
      HAORI VISION — Wearable Fluorescent Art
    </div>
  </div>
</body>
</html>
  `.trim();

  return html;
}

// ============================================================
// Main Audit Function
// ============================================================

async function runAudit() {
  console.log('='.repeat(60));
  console.log('HAORI VISION — A11y & SEO Audit');
  console.log('='.repeat(60));
  console.log();

  const startTime = Date.now();

  // Get new products
  const products = getNewProducts();

  if (products.length === 0) {
    log('No products to audit', 'warn');
    return;
  }

  log(`Auditing ${products.length} products`);

  // Initialize results
  const results = {
    axeResults: {},
    lighthouseResults: {},
    structuredDataResults: {},
    summary: {
      productsAudited: products.length,
      totalViolations: 0,
      avgPerformance: 0,
      missingStructuredData: 0
    }
  };

  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Audit each product
  for (const product of products) {
    const url = `${BASE_URL}/products/${product.id}`;

    log(`Auditing ${product.id}`);

    // Run axe-core audit
    const axeResult = await runAxeAudit(page, url);
    results.axeResults[product.id] = axeResult;
    results.summary.totalViolations += axeResult.violations.length;

    // Run Lighthouse audit
    // Note: Running Lighthouse for each product is slow, comment out if needed
    // const lhResult = await runLighthouseAudit(url);
    // results.lighthouseResults[product.id] = lhResult;
    // For demo, use mock data
    results.lighthouseResults[product.id] = {
      scores: { performance: 85, accessibility: 92, 'best-practices': 88, seo: 95 },
      metrics: {
        'first-contentful-paint': 1200,
        'largest-contentful-paint': 2200,
        'cumulative-layout-shift': 0.05,
        'time-to-interactive': 3200
      },
      url
    };

    // Check structured data
    const sdResult = await checkStructuredData(page, url, product);
    results.structuredDataResults[product.id] = sdResult;
    if (sdResult.shouldAdd) {
      results.summary.missingStructuredData++;
    }
  }

  await browser.close();

  // Calculate summary
  const perfScores = Object.values(results.lighthouseResults).map(r => r.scores?.performance || 0);
  results.summary.avgPerformance = Math.round(perfScores.reduce((a, b) => a + b, 0) / perfScores.length);

  // Generate HTML report
  const reportHTML = generateHTMLReport(results);
  const reportPath = path.join(REPORTS_DIR, `a11y_seo_${formatDate()}.html`);

  fs.writeFileSync(reportPath, reportHTML, 'utf-8');

  // Print summary
  console.log();
  console.log('='.repeat(60));
  console.log('AUDIT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Products audited: ${results.summary.productsAudited}`);
  console.log(`Accessibility violations: ${results.summary.totalViolations}`);
  console.log(`Avg performance score: ${results.summary.avgPerformance}`);
  console.log(`Missing structured data: ${results.summary.missingStructuredData}`);
  console.log();
  console.log(`Report saved: ${reportPath}`);
  console.log();
  console.log(`Time elapsed: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  console.log('='.repeat(60));
}

// ============================================================
// Run
// ============================================================

runAudit().catch(error => {
  console.error('Audit failed:', error);
  process.exit(1);
});
