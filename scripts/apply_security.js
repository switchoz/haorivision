#!/usr/bin/env node

/**
 * HAORI VISION — Security Hardening Application
 *
 * Применяет security middleware к существующему backend.
 * Не изменяет существующие маршруты — только добавляет новые слои.
 *
 * Features:
 * - Verify backend/middleware/security.js exists
 * - Check dependencies (helmet, express-rate-limit)
 * - Generate integration instructions
 * - Create example usage
 *
 * Usage:
 *   node scripts/apply_security.js
 *   node scripts/apply_security.js --check
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");

// ============================================================
// Configuration
// ============================================================

const SECURITY_MIDDLEWARE_PATH = join(
  PROJECT_ROOT,
  "backend",
  "middleware",
  "security.js",
);
const BACKEND_INDEX_PATH = join(PROJECT_ROOT, "backend", "index.js");
const BACKEND_SERVER_PATH = join(PROJECT_ROOT, "backend", "server.js");

// ============================================================
// Check Functions
// ============================================================

function checkSecurityMiddleware() {
  console.log("\n📋 Checking security middleware...\n");

  if (!existsSync(SECURITY_MIDDLEWARE_PATH)) {
    console.log("❌ Security middleware not found");
    console.log(`   Expected: ${SECURITY_MIDDLEWARE_PATH}\n`);
    return false;
  }

  console.log("✅ Security middleware found\n");
  return true;
}

function checkDependencies() {
  console.log("📦 Checking dependencies...\n");

  const packageJsonPath = join(PROJECT_ROOT, "package.json");

  if (!existsSync(packageJsonPath)) {
    console.log("❌ package.json not found\n");
    return false;
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  const allDeps = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
  };

  const required = ["helmet", "express-rate-limit"];
  const missing = required.filter((dep) => !allDeps[dep]);

  if (missing.length > 0) {
    console.log("❌ Missing dependencies:");
    missing.forEach((dep) => console.log(`   - ${dep}`));
    console.log("\nInstall with:");
    console.log(`   npm install ${missing.join(" ")}\n`);
    return false;
  }

  console.log("✅ All dependencies installed\n");
  return true;
}

function findBackendEntry() {
  console.log("🔍 Finding backend entry point...\n");

  if (existsSync(BACKEND_INDEX_PATH)) {
    console.log(`✅ Found: ${BACKEND_INDEX_PATH}\n`);
    return BACKEND_INDEX_PATH;
  }

  if (existsSync(BACKEND_SERVER_PATH)) {
    console.log(`✅ Found: ${BACKEND_SERVER_PATH}\n`);
    return BACKEND_SERVER_PATH;
  }

  console.log("❌ Backend entry point not found\n");
  console.log("Expected one of:");
  console.log("   - backend/index.js");
  console.log("   - backend/server.js\n");
  return null;
}

// ============================================================
// Application Functions
// ============================================================

function generateIntegrationInstructions() {
  console.log("\n📝 Integration Instructions:\n");

  console.log(`
To apply security hardening to your backend:

1️⃣  Import security middleware in your backend entry point:

   import {
     securityHeaders,
     apiRateLimiter,
     authRateLimiter,
     checkoutRateLimiter,
     csrfProtection
   } from './middleware/security.js';

2️⃣  Apply global security headers:

   app.use(securityHeaders);

3️⃣  Apply rate limiting to API routes:

   app.use('/api/*', apiRateLimiter);

4️⃣  Apply rate limiting to auth routes:

   app.use('/auth/*', authRateLimiter);

5️⃣  Apply rate limiting to checkout:

   app.use('/checkout', checkoutRateLimiter);

6️⃣  Add CSRF protection to POST routes:

   app.post('/checkout', csrfProtection, (req, res) => {
     // Your checkout handler
   });

   app.post('/bespoke', csrfProtection, (req, res) => {
     // Your bespoke order handler
   });

7️⃣  Add CSRF token endpoint:

   app.get('/api/csrf-token', (req, res) => {
     res.json({ csrfToken: req.csrfToken() });
   });

8️⃣  In frontend, include CSRF token in POST requests:

   const response = await fetch('/api/csrf-token');
   const { csrfToken } = await response.json();

   await fetch('/checkout', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'X-CSRF-Token': csrfToken
     },
     body: JSON.stringify(checkoutData)
   });

`);
}

function createExampleIntegration() {
  const exampleCode = `// Example: backend/index.js with security middleware

import express from 'express';
import {
  securityHeaders,
  apiRateLimiter,
  authRateLimiter,
  checkoutRateLimiter,
  csrfProtection
} from './middleware/security.js';

const app = express();

// 1. Apply security headers globally
app.use(securityHeaders);

// 2. Body parsing
app.use(express.json());

// 3. Rate limiting
app.use('/api/*', apiRateLimiter);
app.use('/auth/*', authRateLimiter);
app.use('/checkout', checkoutRateLimiter);

// 4. CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// 5. Protected routes with CSRF
app.post('/checkout', csrfProtection, async (req, res) => {
  // Checkout logic
  res.json({ success: true });
});

app.post('/bespoke', csrfProtection, async (req, res) => {
  // Bespoke order logic
  res.json({ success: true });
});

// 6. Other routes
app.get('/', (req, res) => {
  res.json({ message: 'HAORI VISION API' });
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
  console.log(\`✅ Server running on port \${PORT}\`);
  console.log('🔒 Security middleware active');
});
`;

  const examplePath = join(
    PROJECT_ROOT,
    "backend",
    "example_security_integration.js",
  );
  writeFileSync(examplePath, exampleCode);

  console.log(`📄 Example integration saved: ${examplePath}\n`);
}

// ============================================================
// Main Function
// ============================================================

async function applySecurity(checkOnly = false) {
  console.log("\n╔═══════════════════════════════════════════════════════╗");
  console.log("║                                                       ║");
  console.log("║       HAORI VISION — Security Hardening              ║");
  console.log("║                                                       ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");

  // Step 1: Check security middleware exists
  const middlewareExists = checkSecurityMiddleware();

  if (!middlewareExists) {
    console.log("⚠️  Security middleware not found. Please create it first.\n");
    process.exit(1);
  }

  // Step 2: Check dependencies
  const depsInstalled = checkDependencies();

  if (!depsInstalled) {
    console.log("⚠️  Please install missing dependencies first.\n");
    process.exit(1);
  }

  // Step 3: Find backend entry point
  const backendEntry = findBackendEntry();

  if (!backendEntry && !checkOnly) {
    console.log("⚠️  Backend entry point not found.\n");
    console.log("Manual integration required. See instructions below.\n");
  }

  // Step 4: Generate instructions
  generateIntegrationInstructions();

  // Step 5: Create example integration
  if (!checkOnly) {
    createExampleIntegration();
  }

  console.log("\n" + "═".repeat(60));
  console.log("\n✅ Security hardening ready to apply!\n");
  console.log("📖 Follow the integration instructions above.\n");
  console.log("📄 Example code: backend/example_security_integration.js\n");
  console.log("🔒 Features:");
  console.log("   - Content-Security-Policy");
  console.log("   - X-Frame-Options: DENY");
  console.log("   - Referrer-Policy: strict-origin-when-cross-origin");
  console.log("   - X-Content-Type-Options: nosniff");
  console.log("   - Rate limiting (60 req/min on /api/*)");
  console.log("   - CSRF protection for POST forms\n");
}

// ============================================================
// CLI
// ============================================================

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");

applySecurity(checkOnly).catch((error) => {
  console.error(`\n❌ Failed to apply security: ${error.message}\n`);
  process.exit(1);
});
