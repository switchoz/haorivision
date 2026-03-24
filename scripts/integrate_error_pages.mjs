#!/usr/bin/env node

/**
 * HAORI VISION — Error Pages Integration Script (P22)
 *
 * Provides instructions for integrating branded 404/500 error pages.
 *
 * Usage:
 *   node scripts/integrate_error_pages.mjs
 *   npm run pages:errors_brand
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const APP_FILE = path.join(ROOT_DIR, 'frontend', 'src', 'App.jsx');
const NOT_FOUND_PAGE = path.join(ROOT_DIR, 'frontend', 'src', 'pages', 'NotFound.jsx');
const SERVER_ERROR_PAGE = path.join(ROOT_DIR, 'frontend', 'src', 'pages', 'ServerError.jsx');

console.log('\n');
console.log('═'.repeat(80));
console.log('  HAORI VISION — Branded Error Pages Integration');
console.log('═'.repeat(80));
console.log('\n');

// Check if error pages exist
console.log('[1/3] Checking error page files...\n');

let allFilesExist = true;

if (fs.existsSync(NOT_FOUND_PAGE)) {
  console.log('  ✓ NotFound.jsx exists');
} else {
  console.log('  ✗ NotFound.jsx NOT FOUND');
  allFilesExist = false;
}

if (fs.existsSync(SERVER_ERROR_PAGE)) {
  console.log('  ✓ ServerError.jsx exists');
} else {
  console.log('  ✗ ServerError.jsx NOT FOUND');
  allFilesExist = false;
}

console.log('\n');

if (!allFilesExist) {
  console.log('❌ Error page files are missing. Please create them first.\n');
  process.exit(1);
}

// Check App.jsx
console.log('[2/3] Checking App.jsx...\n');

let appContent = '';
try {
  appContent = fs.readFileSync(APP_FILE, 'utf-8');
  console.log(`  ✓ App.jsx found (${appContent.split('\n').length} lines)\n`);
} catch (error) {
  console.log(`  ✗ Cannot read App.jsx: ${error.message}\n`);
  process.exit(1);
}

// Check if already integrated
const hasNotFoundImport = appContent.includes('NotFound');
const hasServerErrorImport = appContent.includes('ServerError');

if (hasNotFoundImport && hasServerErrorImport) {
  console.log('  ℹ  Error pages already appear to be integrated in App.jsx\n');
} else {
  console.log('  ! Error pages need to be integrated\n');
}

// Provide integration instructions
console.log('[3/3] Integration Instructions\n');
console.log('═'.repeat(80));
console.log('  How to Integrate Error Pages into App.jsx');
console.log('═'.repeat(80));
console.log('\n');

console.log('Step 1: Add imports at the top of App.jsx');
console.log('─'.repeat(80));
console.log('\n');
console.log('  Add these lines after other page imports:\n');
console.log('  import NotFound from \'./pages/NotFound\';');
console.log('  import ServerError from \'./pages/ServerError\';');
console.log('\n');

console.log('Step 2: Add routes in the Routes section');
console.log('─'.repeat(80));
console.log('\n');
console.log('  Add these routes AFTER all other routes, but BEFORE the closing </Route>:\n');
console.log('  {/* Error Pages */}');
console.log('  <Route path="/500" element={<ServerError />} />');
console.log('  <Route path="*" element={<NotFound />} />  {/* 404 Catch-all */}');
console.log('\n');

console.log('Step 3: Test the error pages');
console.log('─'.repeat(80));
console.log('\n');
console.log('  After integration, test the pages:');
console.log('  1. Visit http://localhost:3012/nonexistent-page → Should show 404');
console.log('  2. Visit http://localhost:3012/500 → Should show 500 error page');
console.log('\n');

console.log('═'.repeat(80));
console.log('  Example Integration');
console.log('═'.repeat(80));
console.log('\n');
console.log('  Your App.jsx Routes section should look like this:\n');
console.log('  <Routes>');
console.log('    <Route path="/" element={<Layout />}>');
console.log('      <Route index element={<Home />} />');
console.log('      <Route path="gallery" element={<Gallery />} />');
console.log('      {/* ... other routes ... */}');
console.log('');
console.log('      {/* Error Pages (P22) */}');
console.log('      <Route path="/500" element={<ServerError />} />');
console.log('      <Route path="*" element={<NotFound />} />');
console.log('    </Route>');
console.log('  </Routes>');
console.log('\n');

console.log('═'.repeat(80));
console.log('  Error Boundary (Optional Advanced Setup)');
console.log('═'.repeat(80));
console.log('\n');
console.log('  For catching runtime errors and showing 500 page automatically:');
console.log('\n');
console.log('  1. Create ErrorBoundary.jsx component');
console.log('  2. Wrap your app with <ErrorBoundary>');
console.log('  3. Redirect to /500 on error');
console.log('\n');
console.log('  Reference: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary');
console.log('\n');

console.log('═'.repeat(80));
console.log('  Files Created');
console.log('═'.repeat(80));
console.log('\n');
console.log('  ✓ frontend/src/pages/NotFound.jsx (404 page)');
console.log('  ✓ frontend/src/pages/ServerError.jsx (500 page)');
console.log('\n');

console.log('═'.repeat(80));
console.log('  Next Steps');
console.log('═'.repeat(80));
console.log('\n');
console.log('  1. Follow the integration instructions above');
console.log('  2. Add imports and routes to App.jsx');
console.log('  3. Restart frontend: npm run dev');
console.log('  4. Test both error pages');
console.log('  5. (Optional) Set up ErrorBoundary for runtime errors');
console.log('\n');

if (!hasNotFoundImport || !hasServerErrorImport) {
  console.log('⚠️  MANUAL INTEGRATION REQUIRED\n');
  console.log('  Error pages created but not yet integrated into App.jsx');
  console.log('  Follow the instructions above to complete the integration.\n');
  process.exit(0);
} else {
  console.log('✅ Error pages appear to be integrated!\n');
  console.log('  Test them by visiting:');
  console.log('  - http://localhost:3012/nonexistent-page (404)');
  console.log('  - http://localhost:3012/500 (500 error page)');
  console.log('\n');
  process.exit(0);
}
