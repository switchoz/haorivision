#!/usr/bin/env node
/**
 * HAORI VISION — Toggle Feature Flag (P27)
 *
 * Переключает feature flag в конфигурации.
 *
 * Usage:
 *   node scripts/features_toggle.mjs --name LAZY_HYDRATION --value false
 *   npm run features:toggle -- --name MICROCOPY_AB --value false
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// Configuration
// ============================================================

const CONFIG_FILE = path.resolve(__dirname, '../configs/features.json');

// ============================================================
// CLI Argument Parsing
// ============================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--name' && args[i + 1]) {
      options.name = args[i + 1];
      i++;
    } else if (arg === '--value' && args[i + 1]) {
      const value = args[i + 1].toLowerCase();
      options.value = value === 'true' || value === '1';
      i++;
    } else if (arg === '--help') {
      options.help = true;
    }
  }

  return options;
}

// ============================================================
// Main
// ============================================================

async function main() {
  const options = parseArgs();

  if (options.help) {
    console.log(`
HAORI VISION — Toggle Feature Flag

Usage:
  node scripts/features_toggle.mjs --name <feature> --value <true|false>
  npm run features:toggle -- --name LAZY_HYDRATION --value false

Options:
  --name <feature>       Feature name (e.g., LAZY_HYDRATION)
  --value <true|false>   New value (true to enable, false to disable)
  --help                 Show this help

Examples:
  npm run features:toggle -- --name MICROCOPY_AB --value false
  npm run features:toggle -- --name LAZY_HYDRATION --value true
    `);
    process.exit(0);
  }

  if (!options.name) {
    console.error('❌ Missing --name parameter');
    console.error('   Usage: npm run features:toggle -- --name LAZY_HYDRATION --value false');
    process.exit(1);
  }

  if (options.value === undefined) {
    console.error('❌ Missing --value parameter');
    console.error('   Usage: npm run features:toggle -- --name LAZY_HYDRATION --value false');
    process.exit(1);
  }

  console.log(`🎛️  [Features] Toggling ${options.name} to ${options.value}...\n`);

  // Load config
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error('❌ Configuration file not found:', CONFIG_FILE);
    process.exit(1);
  }

  let config;
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    config = JSON.parse(data);
  } catch (error) {
    console.error('❌ Failed to load configuration:', error.message);
    process.exit(1);
  }

  // Check if feature exists
  if (!config.features[options.name]) {
    console.error(`❌ Unknown feature: ${options.name}`);
    console.error('');
    console.error('Available features:');
    for (const name of Object.keys(config.features)) {
      console.error(`   - ${name}`);
    }
    process.exit(1);
  }

  const feature = config.features[options.name];
  const oldValue = feature.enabled;

  // Update value
  feature.enabled = options.value;

  // Update meta
  if (oldValue !== options.value) {
    if (options.value) {
      config.meta.enabled_features++;
      config.meta.disabled_features--;
    } else {
      config.meta.enabled_features--;
      config.meta.disabled_features++;
    }
  }

  config.last_updated = new Date().toISOString().split('T')[0];

  // Save config
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('❌ Failed to save configuration:', error.message);
    process.exit(1);
  }

  console.log('✅ Feature toggled successfully\n');
  console.log('📊 Status:');
  console.log(`   Feature: ${options.name}`);
  console.log(`   Previous: ${oldValue ? '✅ enabled' : '❌ disabled'}`);
  console.log(`   Current:  ${options.value ? '✅ enabled' : '❌ disabled'}`);
  console.log(`   Category: ${feature.category}`);
  console.log(`   Description: ${feature.description}`);

  if (feature.dependencies && feature.dependencies.length > 0) {
    console.log(`   Dependencies: ${feature.dependencies.join(', ')}`);
  }

  console.log('');

  // Check dependent features
  const dependents = [];
  for (const [name, f] of Object.entries(config.features)) {
    if (f.dependencies && f.dependencies.includes(options.name)) {
      dependents.push(name);
    }
  }

  if (dependents.length > 0 && !options.value) {
    console.log('⚠️  Warning: The following features depend on this feature:');
    for (const dep of dependents) {
      console.log(`   - ${dep} (may be affected)`);
    }
    console.log('');
  }

  console.log('📖 Next Steps:');
  console.log('   1. Restart your application to apply changes');
  console.log('   2. Check admin console: http://localhost:3010/admin/feature_console.html');
  console.log('');

  process.exit(0);
}

// ============================================================
// Run
// ============================================================

main().catch((error) => {
  console.error('[Features] Fatal error:', error);
  process.exit(1);
});
