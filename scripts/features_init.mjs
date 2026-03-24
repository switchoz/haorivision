#!/usr/bin/env node
/**
 * HAORI VISION — Initialize Feature Flags (P27)
 *
 * Проверяет конфигурацию feature flags и выводит текущее состояние.
 *
 * Usage:
 *   node scripts/features_init.mjs
 *   npm run features:init
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
// Main
// ============================================================

async function main() {
  console.log('🚀 [Features] Initializing Feature Flags System...\n');

  // Check config file
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error('❌ Configuration file not found:', CONFIG_FILE);
    process.exit(1);
  }

  // Load config
  let config;
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    config = JSON.parse(data);
  } catch (error) {
    console.error('❌ Failed to load configuration:', error.message);
    process.exit(1);
  }

  console.log('✅ Configuration loaded successfully\n');

  // Display summary
  console.log('📊 Summary:');
  console.log(`   Version: ${config.version}`);
  console.log(`   Last Updated: ${config.last_updated}`);
  console.log(`   Total Features: ${config.meta.total_features}`);
  console.log(`   Enabled: ${config.meta.enabled_features}`);
  console.log(`   Disabled: ${config.meta.disabled_features}`);
  console.log('');

  // Display features by category
  const categorized = {};
  for (const [name, feature] of Object.entries(config.features)) {
    if (!categorized[feature.category]) {
      categorized[feature.category] = [];
    }
    categorized[feature.category].push({ name, ...feature });
  }

  console.log('📋 Features by Category:\n');
  for (const [category, features] of Object.entries(categorized)) {
    const categoryInfo = config.categories[category];
    console.log(`${categoryInfo.icon}  ${categoryInfo.name} (${features.length}):`);
    for (const feature of features) {
      const status = feature.enabled ? '✅' : '❌';
      console.log(`   ${status} ${feature.name}`);
    }
    console.log('');
  }

  // Check environment variables
  console.log('🔧 Environment Variable Overrides:');
  let hasOverrides = false;
  for (const [name, feature] of Object.entries(config.features)) {
    if (feature.env_override) {
      const envValue = process.env[feature.env_override];
      if (envValue !== undefined) {
        console.log(`   ${name}: ${envValue} (from ${feature.env_override})`);
        hasOverrides = true;
      }
    }
  }
  if (!hasOverrides) {
    console.log('   (none detected)');
  }
  console.log('');

  // Next steps
  console.log('📖 Next Steps:');
  console.log('   1. Use features in components:');
  console.log('      import { useFeature } from "@/hooks/useFeature";');
  console.log('      const isEnabled = useFeature("LAZY_HYDRATION");');
  console.log('');
  console.log('   2. Open admin console:');
  console.log('      http://localhost:3010/admin/feature_console.html');
  console.log('');
  console.log('   3. Toggle features via CLI:');
  console.log('      npm run features:toggle -- --name LAZY_HYDRATION --value false');
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
