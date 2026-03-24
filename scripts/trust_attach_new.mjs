#!/usr/bin/env node
/**
 * HAORI VISION — Trust Blocks Attachment Script (P16)
 *
 * Validates and reports Trust Blocks integration status.
 * Checks which products have Trust Blocks enabled.
 *
 * Usage:
 *   npm run trust:attach_new
 *   node scripts/trust_attach_new.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(text) {
  console.log();
  log('='.repeat(60), 'cyan');
  log(text, 'bright');
  log('='.repeat(60), 'cyan');
  console.log();
}

function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function loadJSONFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    log(`[ERROR] Failed to load ${filePath}: ${error.message}`, 'red');
    return null;
  }
}

function validateTrustBlocksFiles() {
  header('P16 Trust Blocks — File Validation');

  const requiredFiles = [
    {
      path: 'configs/trust_blocks.json',
      description: 'Trust Blocks configuration',
    },
    {
      path: 'data/reviews.json',
      description: 'Customer reviews data',
    },
    {
      path: 'public/media/how_made/clip.mp4',
      description: 'How Made video placeholder',
    },
    {
      path: 'public/media/avatars/placeholder_01.svg',
      description: 'Review avatar placeholder 1',
    },
    {
      path: 'public/media/avatars/placeholder_02.svg',
      description: 'Review avatar placeholder 2',
    },
    {
      path: 'public/media/avatars/placeholder_03.svg',
      description: 'Review avatar placeholder 3',
    },
    {
      path: 'public/media/avatars/default.svg',
      description: 'Default avatar fallback',
    },
    {
      path: 'frontend/src/components/HowMade.tsx',
      description: 'HowMade component',
    },
    {
      path: 'frontend/src/components/MiniReviews.tsx',
      description: 'MiniReviews component',
    },
    {
      path: 'frontend/src/pages/ProductDetailWithTrustBlocks.jsx',
      description: 'Enhanced ProductDetail wrapper',
    },
  ];

  let allFilesExist = true;

  for (const file of requiredFiles) {
    const fullPath = path.join(ROOT_DIR, file.path);
    const exists = checkFileExists(fullPath);

    if (exists) {
      log(`[OK] ${file.description}`, 'green');
      log(`     ${file.path}`, 'reset');
    } else {
      log(`[MISSING] ${file.description}`, 'red');
      log(`          ${file.path}`, 'reset');
      allFilesExist = false;
    }
  }

  console.log();
  return allFilesExist;
}

function analyzeConfiguration() {
  header('P16 Trust Blocks — Configuration Analysis');

  const configPath = path.join(ROOT_DIR, 'configs/trust_blocks.json');
  const config = loadJSONFile(configPath);

  if (!config) {
    log('[ERROR] Cannot load Trust Blocks configuration', 'red');
    return false;
  }

  // Display configuration status
  log(`Enabled: ${config.enabled ? 'YES' : 'NO'}`, config.enabled ? 'green' : 'yellow');
  console.log();

  // New products (with Trust Blocks)
  log('Products WITH Trust Blocks:', 'bright');
  if (config.new_products && config.new_products.length > 0) {
    config.new_products.forEach((productId) => {
      log(`  - ${productId}`, 'green');
    });
  } else {
    log('  (none)', 'yellow');
  }
  console.log();

  // Legacy products (without Trust Blocks)
  log('Products WITHOUT Trust Blocks (legacy):', 'bright');
  if (config.legacy_products && config.legacy_products.length > 0) {
    config.legacy_products.forEach((productId) => {
      log(`  - ${productId}`, 'reset');
    });
  } else {
    log('  (none)', 'reset');
  }
  console.log();

  // Trust Blocks status
  log('Trust Blocks Configuration:', 'bright');
  log(`  HowMade Video: ${config.trust_blocks?.how_made?.enabled ? 'Enabled' : 'Disabled'}`, 'cyan');
  log(`  Mini Reviews: ${config.trust_blocks?.mini_reviews?.enabled ? 'Enabled' : 'Disabled'}`, 'cyan');
  console.log();

  return true;
}

function generateInstructions() {
  header('P16 Trust Blocks — Usage Instructions');

  log('To add Trust Blocks to a new product:', 'bright');
  log('  1. Edit configs/trust_blocks.json', 'reset');
  log('  2. Add product ID to "new_products" array', 'reset');
  log('  3. Product page will automatically show Trust Blocks', 'reset');
  console.log();

  log('To use ProductDetailWithTrustBlocks component:', 'bright');
  log('  import ProductDetailWithTrustBlocks from "@/pages/ProductDetailWithTrustBlocks";', 'cyan');
  log('  <Route path="product/:productId" element={<ProductDetailWithTrustBlocks />} />', 'cyan');
  console.log();

  log('Component will automatically:', 'bright');
  log('  - Check if product is in new_products list', 'reset');
  log('  - Show Trust Blocks only for new products', 'reset');
  log('  - Keep legacy products unchanged', 'reset');
  console.log();

  log('Current routing note:', 'yellow');
  log('  App.jsx still uses original ProductDetail component', 'reset');
  log('  To enable Trust Blocks, update route to use ProductDetailWithTrustBlocks', 'reset');
  console.log();
}

function main() {
  console.clear();
  header('HAORI VISION — P16 Trust Blocks Validation');

  let success = true;

  // Step 1: Validate files
  if (!validateTrustBlocksFiles()) {
    log('[ERROR] Some required files are missing', 'red');
    success = false;
  }

  // Step 2: Analyze configuration
  if (!analyzeConfiguration()) {
    log('[ERROR] Configuration validation failed', 'red');
    success = false;
  }

  // Step 3: Show instructions
  generateInstructions();

  // Final status
  header('Validation Result');
  if (success) {
    log('[OK] All Trust Blocks files are present and configured', 'green');
    log('     Trust Blocks are ready to use!', 'green');
    console.log();
    process.exit(0);
  } else {
    log('[ERROR] Trust Blocks validation failed', 'red');
    log('        Please fix the issues above', 'red');
    console.log();
    process.exit(1);
  }
}

main();
