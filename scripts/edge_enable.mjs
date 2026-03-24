#!/usr/bin/env node
/**
 * HAORI VISION — Enable Edge Cache Middleware (P25)
 *
 * Скрипт для включения edge-cache middleware в backend/server.js
 *
 * Usage:
 *   npm run edge:enable
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// Configuration
// ============================================================

const SERVER_PATH = path.resolve(__dirname, '../backend/server.js');
const EDGE_HEADERS_PATH = '../scripts/edge_headers.ts';

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('[EdgeEnable] Enabling edge cache middleware...');

  // Проверяем существование server.js
  if (!fs.existsSync(SERVER_PATH)) {
    console.error(`❌ [EdgeEnable] Server file not found: ${SERVER_PATH}`);
    process.exit(1);
  }

  // Читаем server.js
  let serverContent = fs.readFileSync(SERVER_PATH, 'utf-8');

  // Проверяем, не установлен ли уже
  if (serverContent.includes('edgeCacheMiddleware')) {
    console.log('✅ [EdgeEnable] Edge cache middleware is already enabled');
    process.exit(0);
  }

  // Ищем место для вставки import
  const importMatch = serverContent.match(/import\s+.*?\s+from\s+['"].*?['"];?\n/g);
  if (!importMatch || importMatch.length === 0) {
    console.error('❌ [EdgeEnable] Could not find import statements in server.js');
    process.exit(1);
  }

  // Находим последний import
  const lastImportIndex = serverContent.lastIndexOf(importMatch[importMatch.length - 1]);
  const insertAfterImports = lastImportIndex + importMatch[importMatch.length - 1].length;

  // Добавляем import
  const edgeCacheImport = `import { edgeCacheMiddleware, edgeCacheAgeMiddleware } from '${EDGE_HEADERS_PATH}';\n`;
  serverContent =
    serverContent.slice(0, insertAfterImports) +
    edgeCacheImport +
    serverContent.slice(insertAfterImports);

  // Ищем место для вставки middleware (после helmet)
  const helmetMatch = serverContent.match(/app\.use\(helmet\(\)\);?\n/);
  if (!helmetMatch) {
    console.warn('⚠️  [EdgeEnable] Could not find helmet middleware, adding after express initialization');
    // Добавляем после app = express()
    const appMatch = serverContent.match(/const\s+app\s*=\s*express\(\);?\n/);
    if (!appMatch) {
      console.error('❌ [EdgeEnable] Could not find app initialization');
      process.exit(1);
    }
    const insertAfterApp = serverContent.indexOf(appMatch[0]) + appMatch[0].length;
    const edgeCacheMiddlewareCode = `\n// P25 Edge Cache\napp.use(edgeCacheMiddleware);\napp.use(edgeCacheAgeMiddleware);\n`;
    serverContent =
      serverContent.slice(0, insertAfterApp) +
      edgeCacheMiddlewareCode +
      serverContent.slice(insertAfterApp);
  } else {
    const insertAfterHelmet = serverContent.indexOf(helmetMatch[0]) + helmetMatch[0].length;
    const edgeCacheMiddlewareCode = `\n// P25 Edge Cache\napp.use(edgeCacheMiddleware);\napp.use(edgeCacheAgeMiddleware);\n`;
    serverContent =
      serverContent.slice(0, insertAfterHelmet) +
      edgeCacheMiddlewareCode +
      serverContent.slice(insertAfterHelmet);
  }

  // Сохраняем
  fs.writeFileSync(SERVER_PATH, serverContent, 'utf-8');

  console.log('✅ [EdgeEnable] Edge cache middleware enabled successfully');
  console.log('   Import added:', edgeCacheImport.trim());
  console.log('   Middleware added: app.use(edgeCacheMiddleware)');
  console.log('');
  console.log('   Next steps:');
  console.log('   1. Restart your server (npm start)');
  console.log('   2. Check /admin/edge_dashboard.html for monitoring');
  console.log('   3. Test with: curl -I http://localhost:3010/');
}

// ============================================================
// Run
// ============================================================

main().catch((error) => {
  console.error('[EdgeEnable] Fatal error:', error);
  process.exit(1);
});
