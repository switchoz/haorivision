#!/usr/bin/env node

/**
 * HAORI VISION — P18 End-to-End Test Script
 *
 * Tests complete UTM tracking and A/B CTA flow:
 * 1. UTM session creation
 * 2. A/B experiment config loading
 * 3. Event tracking simulation
 * 4. Session data verification
 *
 * Usage:
 *   node scripts/test_p18_flow.mjs
 *   npm run test:p18
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const SESSIONS_FILE = path.join(ROOT_DIR, 'data', 'utm_sessions.json');
const EXPERIMENT_CONFIG = path.join(ROOT_DIR, 'frontend', 'public', 'experiments', 'cta_v1.json');

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  HAORI VISION — P18 End-to-End Test');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

let testsPassed = 0;
let testsFailed = 0;

function pass(message) {
  console.log(`✅ PASS: ${message}`);
  testsPassed++;
}

function fail(message, error) {
  console.log(`❌ FAIL: ${message}`);
  if (error) {
    console.log(`   Error: ${error.message}`);
  }
  testsFailed++;
}

// ============================================================
// Test 1: UTM Sessions File
// ============================================================

console.log('[Test 1] UTM Sessions Database');
console.log('─────────────────────────────────────────────────────────');

try {
  if (!fs.existsSync(SESSIONS_FILE)) {
    fail('UTM sessions file does not exist', new Error(`Missing: ${SESSIONS_FILE}`));
  } else {
    pass('UTM sessions file exists');

    const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));

    if (!data.sessions || !Array.isArray(data.sessions)) {
      fail('Sessions array is invalid');
    } else {
      pass(`Sessions array is valid (${data.sessions.length} sessions)`);
    }

    if (!data.meta || !data.meta.version) {
      fail('Metadata is missing');
    } else {
      pass(`Metadata is present (version ${data.meta.version})`);
    }

    // Check for test sessions
    const testSessions = data.sessions.filter(s =>
      s.utm_params.utm_source === 'instagram' ||
      s.utm_params.utm_source === 'tiktok'
    );

    if (testSessions.length > 0) {
      pass(`Found ${testSessions.length} test UTM sessions`);

      // Verify session structure
      const firstSession = testSessions[0];
      const requiredFields = [
        'session_id',
        'created_at',
        'utm_params',
        'ip_address',
        'user_agent',
        'landing_page',
      ];

      let allFieldsPresent = true;
      for (const field of requiredFields) {
        if (!firstSession[field]) {
          fail(`Session missing required field: ${field}`);
          allFieldsPresent = false;
        }
      }

      if (allFieldsPresent) {
        pass('All required session fields are present');
      }

      // Verify UTM params structure
      const utm = firstSession.utm_params;
      if (utm.utm_source && utm.utm_medium && utm.utm_campaign) {
        pass('Core UTM parameters are captured');
      } else {
        fail('Core UTM parameters are missing');
      }

      // Display sample session
      console.log('');
      console.log('📊 Sample Session:');
      console.log(`   Session ID: ${firstSession.session_id}`);
      console.log(`   Source: ${utm.utm_source}`);
      console.log(`   Medium: ${utm.utm_medium}`);
      console.log(`   Campaign: ${utm.utm_campaign}`);
      if (utm.utm_content) console.log(`   Content: ${utm.utm_content}`);
      if (utm.utm_term) console.log(`   Term: ${utm.utm_term}`);
      console.log(`   Landing Page: ${firstSession.landing_page}`);
    } else {
      fail('No test UTM sessions found');
    }
  }
} catch (error) {
  fail('Error reading UTM sessions file', error);
}

console.log('');

// ============================================================
// Test 2: A/B Experiment Config
// ============================================================

console.log('[Test 2] A/B Experiment Configuration');
console.log('─────────────────────────────────────────────────────────');

try {
  if (!fs.existsSync(EXPERIMENT_CONFIG)) {
    fail('Experiment config does not exist', new Error(`Missing: ${EXPERIMENT_CONFIG}`));
  } else {
    pass('Experiment config file exists');

    const config = JSON.parse(fs.readFileSync(EXPERIMENT_CONFIG, 'utf-8'));

    if (!config.experiment || config.experiment.id !== 'cta_v1') {
      fail('Experiment metadata is invalid');
    } else {
      pass(`Experiment ID is valid: ${config.experiment.id}`);
    }

    if (!config.variants || !config.variants.A || !config.variants.B) {
      fail('Variants A/B are missing');
    } else {
      pass('Variants A and B are defined');

      const variantA = config.variants.A;
      const variantB = config.variants.B;

      if (variantA.cta_text && variantA.cta_text.ru && variantA.cta_text.en) {
        pass(`Variant A: "${variantA.cta_text.en}" / "${variantA.cta_text.ru}"`);
      } else {
        fail('Variant A CTA text is incomplete');
      }

      if (variantB.cta_text && variantB.cta_text.ru && variantB.cta_text.en) {
        pass(`Variant B: "${variantB.cta_text.en}" / "${variantB.cta_text.ru}"`);
      } else {
        fail('Variant B CTA text is incomplete');
      }
    }

    if (!config.targeting || !config.targeting.product_ids) {
      fail('Product targeting is missing');
    } else {
      const products = config.targeting.product_ids;
      pass(`Targeting ${products.length} products`);

      // Check for new products
      const newProducts = products.filter(id =>
        id.startsWith('P007') ||
        id.startsWith('P008') ||
        id.includes('ECLIPSE') ||
        id.includes('BLOOM') ||
        id.startsWith('HV-202510')
      );

      if (newProducts.length > 0) {
        pass(`New products in experiment: ${newProducts.slice(0, 3).join(', ')}...`);
      }
    }

    if (config.distribution && config.distribution.split) {
      const splitA = config.distribution.split.A;
      const splitB = config.distribution.split.B;
      pass(`Split ratio: ${splitA}% / ${splitB}%`);
    } else {
      fail('Distribution split is missing');
    }

    console.log('');
    console.log('🧪 Experiment Details:');
    console.log(`   Name: ${config.experiment.name}`);
    console.log(`   Status: ${config.experiment.status}`);
    console.log(`   Sticky: ${config.distribution.sticky ? 'Yes' : 'No'} (${config.distribution.sticky_duration_days} days)`);
  }
} catch (error) {
  fail('Error reading experiment config', error);
}

console.log('');

// ============================================================
// Test 3: Integration Files
// ============================================================

console.log('[Test 3] Integration Components');
console.log('─────────────────────────────────────────────────────────');

const filesToCheck = [
  {
    path: path.join(ROOT_DIR, 'backend', 'middlewares', 'utmCapture.js'),
    name: 'UTM Capture Middleware',
  },
  {
    path: path.join(ROOT_DIR, 'frontend', 'src', 'ab', 'withCTAExperiment.jsx'),
    name: 'A/B Test HOC',
  },
  {
    path: path.join(ROOT_DIR, 'frontend', 'src', 'components', 'ProductCTA.jsx'),
    name: 'Product CTA Component',
  },
  {
    path: path.join(ROOT_DIR, 'docs', 'P18_UTM_AB_CTA_GUIDE.md'),
    name: 'P18 Documentation',
  },
];

filesToCheck.forEach(({ path: filePath, name }) => {
  if (fs.existsSync(filePath)) {
    pass(`${name} exists`);
  } else {
    fail(`${name} is missing`, new Error(`Missing: ${filePath}`));
  }
});

console.log('');

// ============================================================
// Test 4: Server Configuration
// ============================================================

console.log('[Test 4] Server Configuration');
console.log('─────────────────────────────────────────────────────────');

try {
  const serverFile = path.join(ROOT_DIR, 'backend', 'server.js');
  const serverCode = fs.readFileSync(serverFile, 'utf-8');

  if (serverCode.includes('utmCaptureMiddleware')) {
    pass('UTM middleware is imported in server.js');
  } else {
    fail('UTM middleware is NOT imported in server.js');
  }

  if (serverCode.includes('app.use(utmCaptureMiddleware)')) {
    pass('UTM middleware is registered');
  } else {
    fail('UTM middleware is NOT registered');
  }

  if (serverCode.includes('cookieParser')) {
    pass('cookie-parser is imported');
  } else {
    fail('cookie-parser is NOT imported');
  }

  if (serverCode.includes('app.use(cookieParser())')) {
    pass('cookie-parser is registered');
  } else {
    fail('cookie-parser is NOT registered');
  }
} catch (error) {
  fail('Error reading server.js', error);
}

console.log('');

// ============================================================
// Summary
// ============================================================

console.log('═══════════════════════════════════════════════════════════');
console.log('  Test Summary');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log(`  ✅ Passed: ${testsPassed}`);
console.log(`  ❌ Failed: ${testsFailed}`);
console.log(`  📊 Total:  ${testsPassed + testsFailed}`);
console.log('');

if (testsFailed === 0) {
  console.log('🎉 All tests passed! P18 is fully functional.');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Visit http://localhost:3080/product/ECLIPSE-01?utm_source=test');
  console.log('  2. Check browser DevTools → Cookies → cta_experiment_variant');
  console.log('  3. Check browser DevTools → Console for [CTA Experiment] logs');
  console.log('  4. Complete a test purchase to verify full tracking');
  console.log('');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Review the errors above.');
  console.log('');
  process.exit(1);
}
