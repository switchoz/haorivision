#!/usr/bin/env node
/**
 * HAORI VISION — Critical CSS Builder
 *
 * Extracts critical (above-the-fold) CSS for homepage and catalog.
 * Generates inline <style data-critical> blocks for faster initial render.
 *
 * Usage:
 *   node scripts/build_critical_css.mjs
 *   npm run perf:build_critical
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// Configuration
// ============================================================

const PROJECT_ROOT = path.resolve(__dirname, '..');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3012';
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'frontend', 'public', 'critical-css');
const REPORT_DIR = path.join(PROJECT_ROOT, 'reports');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const REPORT_FILE = path.join(REPORT_DIR, `critical_css_${TIMESTAMP}.txt`);

const PAGES = [
  { path: '/', name: 'homepage' },
  { path: '/catalog', name: 'catalog' },
];

const VIEWPORT = {
  width: 1920,
  height: 1080,
  deviceScaleFactor: 1,
};

// ============================================================
// Helpers
// ============================================================

function log(message, level = 'info') {
  const prefix = {
    info: '[i]',
    success: '[✓]',
    error: '[✗]',
    warning: '[!]'
  }[level] || '[i]';

  console.log(`${prefix} ${message}`);

  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
  fs.appendFileSync(REPORT_FILE, `${prefix} ${message}\n`);
}

/**
 * Extract critical CSS using Coverage API
 */
async function extractCriticalCSS(page, url) {
  log(`  Navigating to ${url}...`);

  // Start CSS coverage
  // Reset coverage if already running
  try { await page.coverage.stopCSSCoverage(); } catch {}

  await page.coverage.startCSSCoverage();

  // Navigate to page
  await page.goto(url, {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });

  // Wait a bit for animations/lazy loads
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Stop coverage and get results
  const cssCoverage = await page.coverage.stopCSSCoverage();

  // Extract used CSS
  let criticalCSS = '';

  for (const entry of cssCoverage) {
    const css = entry.text;

    // Get only used ranges
    for (const range of entry.ranges) {
      criticalCSS += css.slice(range.start, range.end) + '\n';
    }
  }

  return criticalCSS;
}

/**
 * Minify CSS (basic)
 */
function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ')              // Collapse whitespace
    .replace(/\s*([{}:;,])\s*/g, '$1') // Remove spaces around punctuation
    .trim();
}

/**
 * Generate HTML snippet for inline critical CSS
 */
function generateInlineSnippet(css, pageName) {
  const minified = minifyCSS(css);

  return `<!-- Critical CSS for ${pageName} (${(minified.length / 1024).toFixed(2)} KB) -->
<style data-critical="${pageName}">
${minified}
</style>`;
}

// ============================================================
// Main Extraction
// ============================================================

async function extractCriticalCSSForPages() {
  log('============================================================');
  log('HAORI VISION — Critical CSS Extraction');
  log('============================================================');
  log('');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    log(`Created output directory: ${OUTPUT_DIR}`, 'success');
  }

  log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);

    const results = [];

    for (const pageConfig of PAGES) {
      log('');
      log(`Processing: ${pageConfig.name} (${pageConfig.path})`);

      const url = `${FRONTEND_URL}${pageConfig.path}`;

      try {
        const criticalCSS = await extractCriticalCSS(page, url);

        if (!criticalCSS || criticalCSS.trim().length === 0) {
          log(`  Warning: No critical CSS extracted`, 'warning');
          continue;
        }

        // Save full CSS
        const cssFile = path.join(OUTPUT_DIR, `${pageConfig.name}.css`);
        fs.writeFileSync(cssFile, criticalCSS);
        log(`  Saved full CSS: ${cssFile}`, 'success');
        log(`  Size: ${(criticalCSS.length / 1024).toFixed(2)} KB`);

        // Save minified CSS
        const minifiedCSS = minifyCSS(criticalCSS);
        const minFile = path.join(OUTPUT_DIR, `${pageConfig.name}.min.css`);
        fs.writeFileSync(minFile, minifiedCSS);
        log(`  Saved minified: ${minFile}`, 'success');
        log(`  Size: ${(minifiedCSS.length / 1024).toFixed(2)} KB`);

        // Generate inline snippet
        const snippet = generateInlineSnippet(criticalCSS, pageConfig.name);
        const snippetFile = path.join(OUTPUT_DIR, `${pageConfig.name}.snippet.html`);
        fs.writeFileSync(snippetFile, snippet);
        log(`  Saved snippet: ${snippetFile}`, 'success');

        results.push({
          page: pageConfig.name,
          path: pageConfig.path,
          fullSize: criticalCSS.length,
          minifiedSize: minifiedCSS.length,
          success: true,
        });

      } catch (error) {
        log(`  Error: ${error.message}`, 'error');
        results.push({
          page: pageConfig.name,
          path: pageConfig.path,
          success: false,
          error: error.message,
        });
      }
    }

    // Generate summary
    log('');
    log('============================================================');
    log('EXTRACTION SUMMARY');
    log('============================================================');
    log('');

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    log(`Total pages: ${PAGES.length}`);
    log(`Successful: ${successful.length}`, successful.length > 0 ? 'success' : 'info');
    log(`Failed: ${failed.length}`, failed.length > 0 ? 'error' : 'info');
    log('');

    if (successful.length > 0) {
      log('Successfully extracted:');
      successful.forEach(r => {
        const reduction = ((1 - r.minifiedSize / r.fullSize) * 100).toFixed(1);
        log(`  - ${r.page}: ${(r.fullSize / 1024).toFixed(2)} KB → ${(r.minifiedSize / 1024).toFixed(2)} KB (${reduction}% smaller)`);
      });
      log('');
    }

    if (failed.length > 0) {
      log('Failed extractions:', 'error');
      failed.forEach(r => {
        log(`  - ${r.page}: ${r.error}`, 'error');
      });
      log('');
    }

    // Save results manifest
    const manifestFile = path.join(OUTPUT_DIR, 'manifest.json');
    fs.writeFileSync(manifestFile, JSON.stringify({
      generatedAt: new Date().toISOString(),
      results,
      viewport: VIEWPORT,
      frontendUrl: FRONTEND_URL,
    }, null, 2));

    log(`Manifest saved: ${manifestFile}`, 'success');
    log('');
    log('NEXT STEPS:', 'info');
    log('  1. Review snippets in frontend/public/critical-css/', 'info');
    log('  2. Add <style data-critical> to page <head> sections', 'info');
    log('  3. Use feature flag PERF_PRELOADS=1 for conditional loading', 'info');
    log('  4. Test page load times before/after', 'info');
    log('');
    log(`Full report saved to: ${REPORT_FILE}`, 'info');
    log('============================================================');

    return successful.length === PAGES.length;

  } finally {
    await browser.close();
    log('');
    log('Browser closed.');
  }
}

// ============================================================
// Main
// ============================================================

async function main() {
  try {
    fs.writeFileSync(REPORT_FILE, `HAORI VISION — Critical CSS Extraction Report\n`);
    fs.appendFileSync(REPORT_FILE, `Date: ${new Date().toISOString()}\n\n`);

    const success = await extractCriticalCSSForPages();

    process.exit(success ? 0 : 1);

  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    log(error.stack, 'error');
    process.exit(1);
  }
}

main();
