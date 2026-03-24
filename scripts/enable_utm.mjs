#!/usr/bin/env node

/**
 * HAORI VISION — Enable UTM Tracking (P18)
 *
 * This script integrates UTM capture middleware into the backend server.
 *
 * Usage:
 *   node scripts/enable_utm.mjs
 *   npm run marketing:enable_utm
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const SERVER_FILE = path.join(ROOT_DIR, 'backend', 'server.js');
const MIDDLEWARE_PATH = './middlewares/utmCapture.js';

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  HAORI VISION — Enable UTM Tracking');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// Check if server.js exists
if (!fs.existsSync(SERVER_FILE)) {
  console.error('[ERROR] Server file not found:', SERVER_FILE);
  process.exit(1);
}

// Read server.js
console.log('[1/3] Reading server.js...');
let serverCode = fs.readFileSync(SERVER_FILE, 'utf-8');

// Check if UTM middleware is already imported
if (serverCode.includes('utmCaptureMiddleware')) {
  console.log('[INFO] UTM middleware already enabled in server.js');
  console.log('');
  console.log('[OK] UTM tracking is active!');
  console.log('');
  console.log('Session data will be saved to: /data/utm_sessions.json');
  console.log('');
  process.exit(0);
}

// Add import statement
console.log('[2/3] Adding UTM middleware import...');
const importLine = `import { utmCaptureMiddleware } from '${MIDDLEWARE_PATH}';\n`;

// Find the line with "import { cacheHeadersMiddleware }" and add after it
const cacheImportRegex = /import { cacheHeadersMiddleware }[^;]*;/;
if (cacheImportRegex.test(serverCode)) {
  serverCode = serverCode.replace(
    cacheImportRegex,
    (match) => `${match}\n${importLine}`
  );
} else {
  // Fallback: add after other middleware imports
  const middlewareCommentRegex = /\/\/ Import middleware\n/;
  if (middlewareCommentRegex.test(serverCode)) {
    serverCode = serverCode.replace(
      middlewareCommentRegex,
      (match) => `${match}${importLine}`
    );
  } else {
    console.error('[ERROR] Could not find suitable location for import');
    process.exit(1);
  }
}

// Add middleware usage
console.log('[3/3] Adding UTM middleware to request pipeline...');
const useLine = `\n// UTM Capture Middleware (P18)\napp.use(utmCaptureMiddleware);\n`;

// Add after cacheHeadersMiddleware
const cacheUseRegex = /app\.use\(cacheHeadersMiddleware\);/;
if (cacheUseRegex.test(serverCode)) {
  serverCode = serverCode.replace(
    cacheUseRegex,
    (match) => `${match}${useLine}`
  );
} else {
  console.error('[ERROR] Could not find suitable location for middleware usage');
  process.exit(1);
}

// Also need to add cookie-parser if not present
if (!serverCode.includes('cookie-parser')) {
  console.log('[INFO] Adding cookie-parser dependency...');
  const cookieImport = `import cookieParser from 'cookie-parser';\n`;

  serverCode = serverCode.replace(
    /import dotenv from 'dotenv';/,
    (match) => `${match}\n${cookieImport}`
  );

  serverCode = serverCode.replace(
    /app\.use\(express\.urlencoded\({ extended: true }\)\);/,
    (match) => `${match}\napp.use(cookieParser());`
  );
}

// Write updated server.js
fs.writeFileSync(SERVER_FILE, serverCode);

console.log('[OK] UTM tracking enabled!');
console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  Configuration');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('✓ Middleware: /backend/middlewares/utmCapture.js');
console.log('✓ Sessions DB: /data/utm_sessions.json');
console.log('✓ Cookie name: utm_session_id');
console.log('✓ Cookie duration: 30 days');
console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  Next Steps');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('1. Install cookie-parser if needed:');
console.log('   cd backend && npm install cookie-parser');
console.log('');
console.log('2. Restart backend server:');
console.log('   cd backend && npm start');
console.log('');
console.log('3. Test with UTM parameters:');
console.log('   http://localhost:3012/product/ECLIPSE-01?utm_source=instagram&utm_medium=social&utm_campaign=test');
console.log('');
console.log('4. Check session data:');
console.log('   cat data/utm_sessions.json');
console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
