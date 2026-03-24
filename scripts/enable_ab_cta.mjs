#!/usr/bin/env node

/**
 * HAORI VISION — Enable A/B CTA Test (P18)
 *
 * This script provides information about the A/B test setup and checks configuration.
 *
 * Usage:
 *   node scripts/enable_ab_cta.mjs
 *   npm run marketing:enable_ab_cta
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const EXPERIMENT_CONFIG = path.join(ROOT_DIR, 'data', 'experiments', 'cta_v1.json');
const PUBLIC_EXPERIMENT_CONFIG = path.join(ROOT_DIR, 'frontend', 'public', 'experiments', 'cta_v1.json');
const HOC_FILE = path.join(ROOT_DIR, 'frontend', 'src', 'ab', 'withCTAExperiment.jsx');

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  HAORI VISION — Enable A/B CTA Test');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// Check experiment config
console.log('[1/4] Checking experiment configuration...');
if (!fs.existsSync(EXPERIMENT_CONFIG)) {
  console.error('[ERROR] Experiment config not found:', EXPERIMENT_CONFIG);
  process.exit(1);
}
console.log('[OK] Config found:', EXPERIMENT_CONFIG);

// Check public config
console.log('[2/4] Checking public experiment config...');
if (!fs.existsSync(PUBLIC_EXPERIMENT_CONFIG)) {
  console.log('[INFO] Public config not found, copying...');
  const publicDir = path.dirname(PUBLIC_EXPERIMENT_CONFIG);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.copyFileSync(EXPERIMENT_CONFIG, PUBLIC_EXPERIMENT_CONFIG);
  console.log('[OK] Config copied to:', PUBLIC_EXPERIMENT_CONFIG);
} else {
  console.log('[OK] Public config found');
}

// Check HOC
console.log('[3/4] Checking HOC component...');
if (!fs.existsSync(HOC_FILE)) {
  console.error('[ERROR] HOC not found:', HOC_FILE);
  process.exit(1);
}
console.log('[OK] HOC found:', HOC_FILE);

// Load and display experiment details
console.log('[4/4] Loading experiment details...');
const experimentData = JSON.parse(fs.readFileSync(EXPERIMENT_CONFIG, 'utf-8'));

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  Experiment Configuration');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log(`Name:        ${experimentData.experiment.name}`);
console.log(`Status:      ${experimentData.experiment.status}`);
console.log(`ID:          ${experimentData.experiment.id}`);
console.log('');
console.log('Variants:');
console.log(`  A (Control):   "${experimentData.variants.A.cta_text.en}" / "${experimentData.variants.A.cta_text.ru}"`);
console.log(`  B (Test):      "${experimentData.variants.B.cta_text.en}" / "${experimentData.variants.B.cta_text.ru}"`);
console.log('');
console.log('Split:       50% / 50%');
console.log('Sticky:      Yes (30 days)');
console.log('');
console.log('Target Products:');
experimentData.targeting.product_ids.forEach(id => {
  console.log(`  - ${id}`);
});
console.log('');

console.log('═══════════════════════════════════════════════════════════');
console.log('  Implementation Guide');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('To use the A/B test in your product page components:');
console.log('');
console.log('1. Import the HOC:');
console.log('   import withCTAExperiment from \'./ab/withCTAExperiment\';');
console.log('');
console.log('2. Create your CTA button component:');
console.log('   function BuyButton({ ctaText, variant, onClick }) {');
console.log('     return <button onClick={onClick}>{ctaText}</button>;');
console.log('   }');
console.log('');
console.log('3. Wrap with HOC:');
console.log('   export default withCTAExperiment(BuyButton);');
console.log('');
console.log('4. Use in your product page:');
console.log('   <BuyButton productId="ECLIPSE-01" language="en" />');
console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  Testing');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('1. Clear your cookies to reset variant assignment');
console.log('2. Visit a new product page (e.g., /product/ECLIPSE-01)');
console.log('3. Refresh multiple times - you should see the SAME variant (sticky)');
console.log('4. Check cookie: cta_experiment_variant (should be A or B)');
console.log('5. Check localStorage: cta_experiment_events');
console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  Tracking Events');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('Events tracked automatically:');
console.log('  • cta_view         - CTA rendered on page');
console.log('  • cta_click        - User clicked CTA button');
console.log('');
console.log('Events you should track manually:');
console.log('  import { trackCTAEvent } from \'./ab/withCTAExperiment\';');
console.log('  trackCTAEvent(\'add_to_cart\', productId);');
console.log('  trackCTAEvent(\'checkout_started\', productId);');
console.log('  trackCTAEvent(\'order_completed\', productId);');
console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  Important Notes');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('✓ Experiment ONLY applies to new products');
console.log('✓ Legacy products (P001-P006) keep existing CTAs');
console.log('✓ User variant is stored in cookie for 30 days');
console.log('✓ Events stored in localStorage (client-side)');
console.log('✓ Integrates with UTM tracking via utm_session_id cookie');
console.log('');
console.log('[OK] A/B CTA test is configured and ready!');
console.log('');
