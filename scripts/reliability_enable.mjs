#!/usr/bin/env node
/**
 * HAORI VISION — Reliability Kit Enabler
 *
 * Validates and enables Reliability Kit features.
 * Checks configuration, dependencies, and provides setup instructions.
 *
 * Usage:
 *   node scripts/reliability_enable.mjs
 *   npm run reliability:enable
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
const RELIABILITY_CONFIG = path.join(PROJECT_ROOT, 'configs', 'reliability.json');
const REPORT_DIR = path.join(PROJECT_ROOT, 'reports');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const REPORT_FILE = path.join(REPORT_DIR, `reliability_kit_${TIMESTAMP}.txt`);

const REQUIRED_FILES = [
  'frontend/src/lib/ErrorBoundary.tsx',
  'frontend/src/lib/FallbackUI.tsx',
  'frontend/src/lib/logger.ts',
  'frontend/src/hoc/withBoundary.tsx',
  'configs/reliability.json',
];

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

// ============================================================
// Validation
// ============================================================

function validateFiles() {
  log('Validating Reliability Kit files...', 'info');
  let allValid = true;

  REQUIRED_FILES.forEach(file => {
    const filePath = path.join(PROJECT_ROOT, file);
    if (fs.existsSync(filePath)) {
      log(`  ${file} - OK`, 'success');
    } else {
      log(`  ${file} - NOT FOUND`, 'error');
      allValid = false;
    }
  });

  return allValid;
}

function validateConfig() {
  log('', 'info');
  log('Validating reliability.json...', 'info');

  if (!fs.existsSync(RELIABILITY_CONFIG)) {
    log('  Config file NOT FOUND', 'error');
    return false;
  }

  try {
    const content = fs.readFileSync(RELIABILITY_CONFIG, 'utf-8');
    const config = JSON.parse(content);

    if (!config.features) {
      log('  Missing "features" section', 'error');
      return false;
    }

    log('  Config is valid', 'success');
    log(`  Error Boundaries: ${config.features.errorBoundaries?.enabled ? 'Enabled' : 'Disabled'}`, 'info');
    log(`  Logging: ${config.features.logging?.enabled ? 'Enabled' : 'Disabled'}`, 'info');
    log(`  Fallbacks: ${config.features.fallbacks?.showContactOptions ? 'With contacts' : 'Minimal'}`, 'info');

    return true;
  } catch (error) {
    log(`  JSON parse error: ${error.message}`, 'error');
    return false;
  }
}

// ============================================================
// Setup Instructions
// ============================================================

function generateInstructions() {
  log('', 'info');
  log('============================================================', 'info');
  log('RELIABILITY KIT SETUP INSTRUCTIONS', 'info');
  log('============================================================', 'info');
  log('', 'info');

  log('1. Enable Feature Flag', 'info');
  log('   Add to .env:', 'info');
  log('', 'info');
  log('   REACT_APP_RELIABILITY_KIT=1', 'info');
  log('   REACT_APP_LOG_LEVEL=info', 'info');
  log('   REACT_APP_REMOTE_LOGGING=0', 'info');
  log('', 'info');

  log('2. Wrap NEW Components with Error Boundaries', 'info');
  log('   Example for Shop component:', 'info');
  log('', 'info');
  log('   import { withBoundary } from \'@/hoc/withBoundary\';', 'info');
  log('   const SafeShop = withBoundary(Shop, {', 'info');
  log('     fallbackType: \'cart\'', 'info');
  log('   });', 'info');
  log('', 'info');

  log('3. Add Action Logging', 'info');
  log('   In your components:', 'info');
  log('', 'info');
  log('   import { logAction } from \'@/lib/logger\';', 'info');
  log('', 'info');
  log('   // Log user actions', 'info');
  log('   logAction.addToCart(productId, quantity, price);', 'info');
  log('   logAction.checkoutStarted(cartTotal, itemCount);', 'info');
  log('   logAction.dmOpened(productId);', 'info');
  log('', 'info');

  log('4. Setup Error Tracking (Optional)', 'info');
  log('   In your main App component:', 'info');
  log('', 'info');
  log('   import { setupErrorTracking } from \'@/lib/logger\';', 'info');
  log('   setupErrorTracking(); // Call on mount', 'info');
  log('', 'info');

  log('5. Test Error Boundaries', 'info');
  log('   Create a test component that throws:', 'info');
  log('', 'info');
  log('   const BrokenComponent = () => { throw new Error(\'Test\'); };', 'info');
  log('   const SafeBroken = withBoundary(BrokenComponent);', 'info');
  log('', 'info');
}

function generateExamples() {
  log('============================================================', 'info');
  log('USAGE EXAMPLES', 'info');
  log('============================================================', 'info');
  log('', 'info');

  log('Example 1: Wrap Checkout Component', 'info');
  log('', 'info');
  log('  import { withCheckoutBoundary } from \'@/hoc/withBoundary\';', 'info');
  log('  import Checkout from \'./Checkout\';', 'info');
  log('', 'info');
  log('  const SafeCheckout = withCheckoutBoundary(Checkout);', 'info');
  log('  export default SafeCheckout;', 'info');
  log('', 'info');

  log('Example 2: Wrap Product Page', 'info');
  log('', 'info');
  log('  import { withProductBoundary } from \'@/hoc/withBoundary\';', 'info');
  log('  import ProductPage from \'./ProductPage\';', 'info');
  log('', 'info');
  log('  const SafeProductPage = withProductBoundary(ProductPage, productId);', 'info');
  log('  export default SafeProductPage;', 'info');
  log('', 'info');

  log('Example 3: Log Shopping Actions', 'info');
  log('', 'info');
  log('  import { logAction, logger } from \'@/lib/logger\';', 'info');
  log('', 'info');
  log('  function addToCart(product, quantity) {', 'info');
  log('    // Your logic...', 'info');
  log('    logAction.addToCart(product.id, quantity, product.price);', 'info');
  log('  }', 'info');
  log('', 'info');
  log('  function handleCheckout() {', 'info');
  log('    logAction.checkoutStarted(cart.total, cart.items.length);', 'info');
  log('    // Checkout logic...', 'info');
  log('  }', 'info');
  log('', 'info');
}

// ============================================================
// Main
// ============================================================

async function main() {
  try {
    fs.writeFileSync(REPORT_FILE, `HAORI VISION — Reliability Kit Setup Report\n`);
    fs.appendFileSync(REPORT_FILE, `Date: ${new Date().toISOString()}\n\n`);

    log('============================================================');
    log('HAORI VISION — Reliability Kit Setup');
    log('============================================================');
    log('');

    // Validate files
    const filesValid = validateFiles();
    const configValid = validateConfig();

    if (!filesValid || !configValid) {
      log('', 'info');
      log('Validation failed! Please ensure all files are created.', 'error');
      log('', 'info');
      log(`Report saved to: ${REPORT_FILE}`, 'info');
      process.exit(1);
    }

    // Generate instructions
    generateInstructions();
    generateExamples();

    // Summary
    log('============================================================', 'info');
    log('SUMMARY', 'info');
    log('============================================================', 'info');
    log('', 'info');
    log('Reliability Kit is ready to use!', 'success');
    log('', 'info');
    log('Next steps:', 'info');
    log('  1. Set REACT_APP_RELIABILITY_KIT=1 in .env', 'info');
    log('  2. Wrap new components with withBoundary HOC', 'info');
    log('  3. Add action logging to key user flows', 'info');
    log('  4. Test error boundaries with broken components', 'info');
    log('', 'info');
    log(`Full report saved to: ${REPORT_FILE}`, 'info');
    log('============================================================');

    process.exit(0);

  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    log(error.stack, 'error');
    process.exit(1);
  }
}

main();
