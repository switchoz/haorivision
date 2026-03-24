#!/usr/bin/env node
/**
 * HAORI VISION — Apply Cache Headers
 *
 * Validates cache_headers.json configuration and provides testing tools.
 * Also checks that middleware is properly registered in server.js.
 *
 * Usage:
 *   node scripts/apply_cache_headers.mjs
 *   npm run perf:apply_headers
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// Configuration
// ============================================================

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONFIG_FILE = path.join(PROJECT_ROOT, 'configs', 'cache_headers.json');
const MIDDLEWARE_FILE = path.join(PROJECT_ROOT, 'backend', 'middlewares', 'cacheHeaders.js');
const SERVER_FILE = path.join(PROJECT_ROOT, 'backend', 'server.js');
const REPORT_DIR = path.join(PROJECT_ROOT, 'reports');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const REPORT_FILE = path.join(REPORT_DIR, `cache_headers_${TIMESTAMP}.txt`);

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

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

// ============================================================
// Validation Functions
// ============================================================

function validateConfig() {
  log('Validating cache_headers.json...', 'info');

  if (!checkFileExists(CONFIG_FILE)) {
    log('  Config file NOT FOUND', 'error');
    return false;
  }

  try {
    const content = readFile(CONFIG_FILE);
    const config = JSON.parse(content);

    // Check structure
    if (!config.rules || !Array.isArray(config.rules)) {
      log('  Missing or invalid "rules" array', 'error');
      return false;
    }

    log(`  Found ${config.rules.length} rules`, 'info');

    // Validate each rule
    const errors = [];
    config.rules.forEach((rule, index) => {
      if (!rule.pattern) {
        errors.push(`Rule ${index}: missing "pattern"`);
      }
      if (!rule.headers) {
        errors.push(`Rule ${index}: missing "headers"`);
      }

      // Test regex validity
      if (rule.pattern) {
        try {
          new RegExp(rule.pattern);
        } catch (e) {
          errors.push(`Rule ${index}: invalid regex pattern "${rule.pattern}"`);
        }
      }
    });

    if (errors.length > 0) {
      log('  Validation errors:', 'error');
      errors.forEach(err => log(`    - ${err}`, 'error'));
      return false;
    }

    log('  cache_headers.json is valid', 'success');
    return true;

  } catch (error) {
    log(`  JSON parse error: ${error.message}`, 'error');
    return false;
  }
}

function validateMiddleware() {
  log('Validating cache headers middleware...', 'info');

  if (!checkFileExists(MIDDLEWARE_FILE)) {
    log('  Middleware file NOT FOUND', 'error');
    return false;
  }

  const content = readFile(MIDDLEWARE_FILE);

  const requiredElements = [
    'cacheHeadersMiddleware',
    'loadCacheConfig',
    'findMatchingRule',
  ];

  const missing = requiredElements.filter(el => !content.includes(el));

  if (missing.length > 0) {
    log('  Missing elements:', 'error');
    missing.forEach(el => log(`    - ${el}`, 'error'));
    return false;
  }

  log('  Middleware file is valid', 'success');
  return true;
}

function validateServerIntegration() {
  log('Checking server.js integration...', 'info');

  if (!checkFileExists(SERVER_FILE)) {
    log('  server.js NOT FOUND', 'error');
    return false;
  }

  const content = readFile(SERVER_FILE);

  // Check if middleware is imported
  if (!content.includes('cacheHeaders')) {
    log('  Warning: Middleware not imported in server.js', 'warning');
    log('  Add this line to server.js:', 'info');
    log('    import { cacheHeadersMiddleware } from \'./middlewares/cacheHeaders.js\';', 'info');
    log('    app.use(cacheHeadersMiddleware);', 'info');
    return false;
  }

  log('  Middleware registered in server.js', 'success');
  return true;
}

// ============================================================
// Testing Functions
// ============================================================

function testPathMatching() {
  log('', 'info');
  log('Testing path matching...', 'info');

  try {
    const content = readFile(CONFIG_FILE);
    const config = JSON.parse(content);

    const testPaths = [
      '/',
      '/catalog',
      '/products/P001',
      '/api/products',
      '/media/products/P001.jpg',
      '/css/main.abc12345.css',
      '/js/bundle.js',
      '/favicon.ico',
      '/sitemap.xml',
      '/robots.txt',
      '/legal/returns.html',
      '/admin/metrics',
    ];

    log('  Testing paths:', 'info');

    testPaths.forEach(testPath => {
      const matchingRule = config.rules.find(rule => {
        const regex = new RegExp(rule.pattern);
        return regex.test(testPath);
      });

      if (matchingRule) {
        const cacheControl = matchingRule.headers['Cache-Control'] || 'multiple headers';
        log(`    ${testPath} → ${cacheControl}`, 'success');
      } else {
        log(`    ${testPath} → NO MATCH`, 'warning');
      }
    });

  } catch (error) {
    log(`  Error testing paths: ${error.message}`, 'error');
    return false;
  }

  return true;
}

// ============================================================
// Generate Integration Instructions
// ============================================================

function generateIntegrationInstructions() {
  log('', 'info');
  log('============================================================', 'info');
  log('INTEGRATION INSTRUCTIONS', 'info');
  log('============================================================', 'info');
  log('', 'info');

  log('1. Backend Integration (server.js):', 'info');
  log('   Add the following to backend/server.js:', 'info');
  log('', 'info');
  log('   import { cacheHeadersMiddleware } from \'./middlewares/cacheHeaders.js\';', 'info');
  log('', 'info');
  log('   // Add BEFORE routes', 'info');
  log('   app.use(cacheHeadersMiddleware);', 'info');
  log('', 'info');

  log('2. Frontend Integration (PerfPreloads):', 'info');
  log('   For NEW pages only, add:', 'info');
  log('', 'info');
  log('   import PerfPreloads from \'@/components/PerfPreloads\';', 'info');
  log('', 'info');
  log('   // In <head> or layout:', 'info');
  log('   <PerfPreloads page="/" />', 'info');
  log('', 'info');

  log('3. Environment Variables:', 'info');
  log('   Add to .env:', 'info');
  log('', 'info');
  log('   REACT_APP_PERF_PRELOADS=1', 'info');
  log('   DEBUG_CACHE_HEADERS=0', 'info');
  log('', 'info');

  log('4. Test Cache Headers:', 'info');
  log('   Start backend and test with curl:', 'info');
  log('', 'info');
  log('   curl -I http://localhost:3010/media/products/P001.jpg', 'info');
  log('   curl -I http://localhost:3010/api/products', 'info');
  log('', 'info');

  log('5. Build Critical CSS:', 'info');
  log('   npm run perf:build_critical', 'info');
  log('', 'info');

  log('6. Add Critical CSS to Pages:', 'info');
  log('   Copy snippets from frontend/public/critical-css/*.snippet.html', 'info');
  log('   Paste into <head> of corresponding page layouts', 'info');
  log('', 'info');
}

// ============================================================
// Main
// ============================================================

async function main() {
  try {
    fs.writeFileSync(REPORT_FILE, `HAORI VISION — Cache Headers Validation Report\n`);
    fs.appendFileSync(REPORT_FILE, `Date: ${new Date().toISOString()}\n\n`);

    log('============================================================');
    log('HAORI VISION — Cache Headers Setup & Validation');
    log('============================================================');
    log('');

    let allValid = true;

    // Validate files
    if (!validateConfig()) allValid = false;
    if (!validateMiddleware()) allValid = false;

    const serverIntegrated = validateServerIntegration();
    if (!serverIntegrated) {
      log('  Note: Middleware not yet integrated in server.js', 'warning');
    }

    // Test path matching
    testPathMatching();

    // Generate integration instructions
    generateIntegrationInstructions();

    // Summary
    log('============================================================');
    log('VALIDATION SUMMARY');
    log('============================================================');
    log('');

    if (allValid) {
      log('All cache header files validated successfully!', 'success');
      if (!serverIntegrated) {
        log('Next step: Integrate middleware in server.js', 'warning');
      } else {
        log('Cache headers ready to use!', 'success');
      }
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
