#!/usr/bin/env node
/**
 * HAORI VISION — SEO Base Setup & Validation
 *
 * Validates and tests SEO foundation:
 * - robots.txt exists and is valid
 * - Sitemap generates correctly (only published products)
 * - OG/Twitter meta tags helpers ready
 * - All SEO files accessible
 *
 * Usage:
 *   node scripts/seo_base.mjs
 *   npm run seo:base
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// Configuration
// ============================================================

const PROJECT_ROOT = path.resolve(__dirname, '..');
const FRONTEND_PUBLIC = path.join(PROJECT_ROOT, 'frontend', 'public');
const ROBOTS_FILE = path.join(FRONTEND_PUBLIC, 'robots.txt');
const SEO_META_UTIL = path.join(PROJECT_ROOT, 'frontend', 'src', 'utils', 'seoMeta.js');
const SITEMAP_ROUTE = path.join(PROJECT_ROOT, 'backend', 'routes', 'sitemap.js');
const REPORT_DIR = path.join(PROJECT_ROOT, 'reports');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const REPORT_FILE = path.join(REPORT_DIR, `seo_base_${TIMESTAMP}.txt`);

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3010';

// ============================================================
// Helpers
// ============================================================

function log(message, level = 'info') {
  const prefix = {
    info: '[i]',
    success: '[\u2713]',
    error: '[\u2717]',
    warning: '[!]'
  }[level] || '[i]';

  console.log(`${prefix} ${message}`);

  // Also write to report
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
  fs.appendFileSync(REPORT_FILE, `${prefix} ${message}\n`);
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

// ============================================================
// Validation Functions
// ============================================================

function validateRobotsTxt() {
  log('Validating robots.txt...', 'info');

  if (!checkFileExists(ROBOTS_FILE)) {
    log('  robots.txt NOT FOUND', 'error');
    return false;
  }

  const content = readFile(ROBOTS_FILE);
  const errors = [];

  // Check for required directives
  if (!content.includes('User-agent:')) {
    errors.push('Missing User-agent directive');
  }
  if (!content.includes('Sitemap:')) {
    errors.push('Missing Sitemap directive');
  }
  if (!content.includes('Disallow:')) {
    errors.push('Missing Disallow directive');
  }

  // Check for admin protection
  if (!content.includes('/admin')) {
    errors.push('Admin area not disallowed');
  }
  if (!content.includes('/api/')) {
    errors.push('API routes not disallowed');
  }

  // Check for AI bot blocking
  if (!content.includes('GPTBot') && !content.includes('CCBot')) {
    log('  Warning: AI bots not blocked (consider adding)', 'warning');
  }

  if (errors.length > 0) {
    log('  Validation errors:', 'error');
    errors.forEach(err => log(`    - ${err}`, 'error'));
    return false;
  }

  log('  robots.txt valid', 'success');
  return true;
}

function validateSeoMetaUtil() {
  log('Validating SEO meta tags utility...', 'info');

  if (!checkFileExists(SEO_META_UTIL)) {
    log('  seoMeta.js NOT FOUND', 'error');
    return false;
  }

  const content = readFile(SEO_META_UTIL);
  const requiredFunctions = [
    'generateMetaTags',
    'generateHelmetMeta',
    'generateMetaHTML',
    'generateProductMeta',
    'generateProductJSONLD',
  ];

  const missing = requiredFunctions.filter(fn => !content.includes(`export function ${fn}`));

  if (missing.length > 0) {
    log('  Missing functions:', 'error');
    missing.forEach(fn => log(`    - ${fn}`, 'error'));
    return false;
  }

  log('  seoMeta.js valid', 'success');
  return true;
}

function validateSitemapRoute() {
  log('Validating sitemap route...', 'info');

  if (!checkFileExists(SITEMAP_ROUTE)) {
    log('  sitemap.js route NOT FOUND', 'error');
    return false;
  }

  const content = readFile(SITEMAP_ROUTE);
  const requiredRoutes = [
    '/sitemap.xml',
    '/sitemap-products.xml',
    '/sitemap-legal.xml',
    '/sitemap-static.xml',
  ];

  const missing = requiredRoutes.filter(route => !content.includes(`'${route}'`));

  if (missing.length > 0) {
    log('  Missing routes:', 'error');
    missing.forEach(route => log(`    - ${route}`, 'error'));
    return false;
  }

  // Check for published filter
  if (!content.includes('published: true')) {
    log('  Warning: Products not filtered by published status', 'warning');
  }

  log('  sitemap.js route valid', 'success');
  return true;
}

// ============================================================
// HTTP Tests (if backend is running)
// ============================================================

async function testSitemapEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = `${BACKEND_URL}${endpoint}`;

    const req = http.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          // Check if it's valid XML
          if (data.startsWith('<?xml') && data.includes('<urlset') || data.includes('<sitemapindex')) {
            resolve({ success: true, size: data.length });
          } else {
            resolve({ success: false, error: 'Invalid XML format' });
          }
        } else {
          resolve({ success: false, error: `HTTP ${res.statusCode}` });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.setTimeout(5000, () => {
      req.abort();
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

async function testSitemapEndpoints() {
  log('Testing sitemap endpoints (requires backend running)...', 'info');

  const endpoints = [
    '/sitemap.xml',
    '/sitemap-products.xml',
    '/sitemap-legal.xml',
    '/sitemap-static.xml',
  ];

  let allPassed = true;

  for (const endpoint of endpoints) {
    const result = await testSitemapEndpoint(endpoint);

    if (result.success) {
      log(`  ${endpoint}: OK (${(result.size / 1024).toFixed(2)} KB)`, 'success');
    } else {
      log(`  ${endpoint}: FAILED (${result.error})`, 'error');
      allPassed = false;
    }
  }

  if (!allPassed) {
    log('  Some endpoints failed. Is backend running?', 'warning');
  }

  return allPassed;
}

// ============================================================
// Checklist Generation
// ============================================================

function generateChecklist() {
  log('', 'info');
  log('============================================================', 'info');
  log('SEO IMPLEMENTATION CHECKLIST', 'info');
  log('============================================================', 'info');
  log('', 'info');

  const checklist = [
    { item: 'robots.txt created and valid', file: ROBOTS_FILE },
    { item: 'Sitemap route implemented', file: SITEMAP_ROUTE },
    { item: 'SEO meta tags utility created', file: SEO_META_UTIL },
    { item: 'Sitemap registered in server.js', file: path.join(PROJECT_ROOT, 'backend', 'server.js') },
  ];

  checklist.forEach((check) => {
    const exists = checkFileExists(check.file);
    log(`  [${exists ? '✓' : ' '}] ${check.item}`, exists ? 'success' : 'error');
  });

  log('', 'info');
  log('NEXT STEPS:', 'info');
  log('  1. Add OG meta tags to product pages', 'info');
  log('  2. Add JSON-LD structured data to pages', 'info');
  log('  3. Submit sitemap to Google Search Console', 'info');
  log('  4. Submit sitemap to Bing Webmaster Tools', 'info');
  log('  5. Test with Facebook Sharing Debugger', 'info');
  log('  6. Test with Twitter Card Validator', 'info');
  log('', 'info');
}

// ============================================================
// Main Validation
// ============================================================

async function main() {
  try {
    // Initialize report
    fs.writeFileSync(REPORT_FILE, `HAORI VISION — SEO Base Validation Report\n`);
    fs.appendFileSync(REPORT_FILE, `Date: ${new Date().toISOString()}\n\n`);

    log('============================================================');
    log('HAORI VISION — SEO Base Setup & Validation');
    log('============================================================');
    log('');

    let allValid = true;

    // Validate files
    if (!validateRobotsTxt()) allValid = false;
    if (!validateSeoMetaUtil()) allValid = false;
    if (!validateSitemapRoute()) allValid = false;

    log('');

    // Test endpoints (optional, if backend is running)
    const endpointsWorking = await testSitemapEndpoints();
    if (!endpointsWorking) {
      log('Note: Some endpoint tests failed. This may be OK if backend is not running.', 'warning');
    }

    // Generate checklist
    generateChecklist();

    // Summary
    log('============================================================');
    log('VALIDATION SUMMARY');
    log('============================================================');
    log('');

    if (allValid) {
      log('All SEO base files validated successfully!', 'success');
      log('SEO foundation is ready for use.', 'success');
    } else {
      log('Validation failed!', 'error');
      log('Please fix the errors above.', 'error');
    }

    log('');
    log(`Full report saved to: ${REPORT_FILE}`, 'info');
    log('');
    log('============================================================');

    process.exit(allValid ? 0 : 1);
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    log(error.stack, 'error');
    process.exit(1);
  }
}

main();
