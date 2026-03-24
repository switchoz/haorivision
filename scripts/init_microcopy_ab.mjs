#!/usr/bin/env node
/**
 * HAORI VISION — Initialize Microcopy A/B Test (P26)
 *
 * Инициализирует структуру данных для A/B теста микрокопии.
 * Создает необходимые директории и файлы.
 *
 * Usage:
 *   node scripts/init_microcopy_ab.mjs
 *   npm run ab:microcopy_init
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// Configuration
// ============================================================

const DATA_AB_DIR = path.resolve(__dirname, '../data/ab');
const EXPERIMENTS_DIR = path.resolve(__dirname, '../data/experiments');
const REPORTS_DIR = path.resolve(__dirname, '../reports');
const STATS_FILE = path.join(DATA_AB_DIR, 'microcopy_stats.json');
const EXPERIMENT_FILE = path.join(EXPERIMENTS_DIR, 'microcopy_v1.json');

// ============================================================
// Initial Data
// ============================================================

const INITIAL_STATS = {
  experiment_id: 'microcopy_v1',
  last_updated: new Date().toISOString(),
  variants: {
    A: {
      views: 0,
      clicks: 0,
      interactions: 0,
      ctr: 0,
      avg_time_to_click: 0,
      avg_time_to_interaction: 0,
    },
    B: {
      views: 0,
      clicks: 0,
      interactions: 0,
      ctr: 0,
      avg_time_to_click: 0,
      avg_time_to_interaction: 0,
    },
  },
  events: [],
};

// ============================================================
// Helper Functions
// ============================================================

/**
 * Создает директорию если не существует
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
    return true;
  }
  console.log(`   Directory already exists: ${dir}`);
  return false;
}

/**
 * Создает файл если не существует
 */
function ensureFile(filePath, content) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');
    console.log(`✅ Created file: ${filePath}`);
    return true;
  }
  console.log(`   File already exists: ${filePath}`);
  return false;
}

/**
 * Проверяет существование эксперимента
 */
function checkExperiment() {
  if (fs.existsSync(EXPERIMENT_FILE)) {
    console.log(`✅ Experiment config found: ${EXPERIMENT_FILE}`);
    try {
      const data = fs.readFileSync(EXPERIMENT_FILE, 'utf-8');
      const config = JSON.parse(data);
      console.log(`   Variants: ${Object.keys(config.variants).join(', ')}`);
      console.log(`   Status: ${config.status}`);
      return true;
    } catch (error) {
      console.error(`❌ Invalid experiment config: ${error.message}`);
      return false;
    }
  } else {
    console.error(`❌ Experiment config not found: ${EXPERIMENT_FILE}`);
    return false;
  }
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('🚀 [Init] Initializing Microcopy A/B Test...\n');

  let changes = 0;

  // 1. Создаем директории
  console.log('📁 Creating directories...');
  if (ensureDir(DATA_AB_DIR)) changes++;
  if (ensureDir(EXPERIMENTS_DIR)) changes++;
  if (ensureDir(REPORTS_DIR)) changes++;
  console.log('');

  // 2. Проверяем эксперимент
  console.log('🔬 Checking experiment configuration...');
  const hasExperiment = checkExperiment();
  console.log('');

  if (!hasExperiment) {
    console.error('❌ Cannot initialize without experiment config.');
    console.error('   Expected file: /data/experiments/microcopy_v1.json');
    process.exit(1);
  }

  // 3. Создаем файл статистики
  console.log('📊 Creating stats file...');
  if (ensureFile(STATS_FILE, INITIAL_STATS)) {
    changes++;
    console.log('   Initial stats created with 0 events');
  } else {
    // Показываем текущую статистику
    try {
      const data = fs.readFileSync(STATS_FILE, 'utf-8');
      const stats = JSON.parse(data);
      console.log(`   Current stats:`);
      console.log(`     Variant A: ${stats.variants.A.views} views, ${stats.variants.A.clicks} clicks`);
      console.log(`     Variant B: ${stats.variants.B.views} views, ${stats.variants.B.clicks} clicks`);
      console.log(`     Total events: ${stats.events.length}`);
    } catch (error) {
      console.error(`   Warning: Could not read stats file: ${error.message}`);
    }
  }
  console.log('');

  // 4. Итоги
  if (changes === 0) {
    console.log('✅ All files and directories already initialized.');
    console.log('   A/B test is ready to run.\n');
  } else {
    console.log(`✅ Initialization complete! (${changes} changes made)\n`);
  }

  // 5. Инструкции
  console.log('📖 Next steps:');
  console.log('   1. Add API routes to backend/server.js:');
  console.log('      import abRoutes from \'./routes/ab.js\';');
  console.log('      app.use(\'/api/ab\', abRoutes);');
  console.log('');
  console.log('   2. Wrap your components with withMicrocopy HOC:');
  console.log('      import { withMicrocopy } from \'@/ab/withMicrocopy\';');
  console.log('      const ProductHero = withMicrocopy(BaseProductHero);');
  console.log('');
  console.log('   3. Deploy and let users interact with your site');
  console.log('');
  console.log('   4. Generate reports:');
  console.log('      npm run ab:microcopy_report');
  console.log('');

  process.exit(0);
}

// ============================================================
// Run
// ============================================================

main().catch((error) => {
  console.error('[Init] Fatal error:', error);
  process.exit(1);
});
