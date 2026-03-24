#!/usr/bin/env node

/**
 * HAORI VISION — Enable CSP Script (P21)
 *
 * Validates CSP configuration and provides instructions for enabling CSP middleware.
 *
 * Usage:
 *   node scripts/enable_csp.mjs
 *   npm run security:csp_enable
 */

import { validateCSPConfig } from '../backend/middlewares/csp.js';

console.log('\n');
console.log('═'.repeat(80));
console.log('  HAORI VISION — Enable Content Security Policy');
console.log('═'.repeat(80));
console.log('\n');

// Validate configuration
const isValid = validateCSPConfig();

if (!isValid) {
  console.log('❌ CSP configuration is invalid. Fix errors above before enabling.\n');
  process.exit(1);
}

console.log('═'.repeat(80));
console.log('  How to Enable CSP');
console.log('═'.repeat(80));
console.log('\n');

console.log('CSP middleware is ready to be enabled. To activate it:\n');
console.log('1. Open backend/server.js');
console.log('2. Add import at the top:');
console.log('   import { cspMiddleware } from \'./middlewares/csp.js\';');
console.log('\n');
console.log('3. Add middleware after helmet() and before routes:');
console.log('   app.use(cspMiddleware);');
console.log('\n');
console.log('4. Restart your server:');
console.log('   npm start');
console.log('\n');
console.log('─'.repeat(80));
console.log('Testing CSP');
console.log('─'.repeat(80));
console.log('\n');
console.log('After enabling, test with browser DevTools:');
console.log('1. Open your app in browser');
console.log('2. Open DevTools → Network tab');
console.log('3. Refresh page');
console.log('4. Click any request → Headers');
console.log('5. Look for "Content-Security-Policy" header');
console.log('\n');
console.log('─'.repeat(80));
console.log('Report-Only Mode (Recommended for Testing)');
console.log('─'.repeat(80));
console.log('\n');
console.log('To test without blocking requests:');
console.log('1. Open configs/csp.json');
console.log('2. Set "reportOnly": true');
console.log('3. CSP violations will be logged but not blocked');
console.log('4. Check browser console for CSP warnings');
console.log('\n');

console.log('═'.repeat(80));
console.log('  ✅ CSP Configuration Valid - Ready to Enable');
console.log('═'.repeat(80));
console.log('\n');
