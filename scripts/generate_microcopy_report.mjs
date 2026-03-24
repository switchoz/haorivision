#!/usr/bin/env node
/**
 * HAORI VISION — Microcopy A/B Test Report Generator (P26)
 *
 * Генерирует CSV отчет по A/B тесту микрокопии.
 * Включает CTR, время до взаимодействия, статистическую значимость.
 *
 * Usage:
 *   node scripts/generate_microcopy_report.mjs
 *   npm run ab:report
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// Configuration
// ============================================================

const STATS_FILE = path.resolve(__dirname, '../data/ab/microcopy_stats.json');
const REPORTS_DIR = path.resolve(__dirname, '../reports');

// ============================================================
// Helper Functions
// ============================================================

/**
 * Загружает статистику из файла
 */
function loadStats() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      const data = fs.readFileSync(STATS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[Report] Failed to load stats:', error);
  }

  return null;
}

/**
 * Форматирует дату для имени файла
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Считает статистическую значимость (z-test для пропорций)
 */
function calculateZTest(p1, n1, p2, n2) {
  if (n1 === 0 || n2 === 0) return { z: 0, pValue: 1, significant: false };

  const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));

  if (se === 0) return { z: 0, pValue: 1, significant: false };

  const z = (p1 - p2) / se;
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));
  const significant = pValue < 0.05;

  return { z, pValue, significant };
}

/**
 * Приближенное вычисление CDF нормального распределения
 */
function normalCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

/**
 * Вычисляет доверительный интервал для CTR (биномиальное распределение)
 */
function calculateConfidenceInterval(p, n, confidence = 0.95) {
  if (n === 0) return { lower: 0, upper: 0 };

  const z = 1.96; // 95% confidence
  const se = Math.sqrt((p * (1 - p)) / n);
  const lower = Math.max(0, p - z * se);
  const upper = Math.min(1, p + z * se);

  return { lower, upper };
}

/**
 * Генерирует CSV отчет
 */
function generateCSV(stats) {
  const variantA = stats.variants.A;
  const variantB = stats.variants.B;

  // Z-test для CTR
  const zTest = calculateZTest(
    variantA.ctr,
    variantA.views,
    variantB.ctr,
    variantB.views
  );

  // Доверительные интервалы
  const ciA = calculateConfidenceInterval(variantA.ctr, variantA.views);
  const ciB = calculateConfidenceInterval(variantB.ctr, variantB.views);

  // Определяем победителя
  let winner = 'None';
  if (zTest.significant) {
    winner = variantA.ctr > variantB.ctr ? 'A' : 'B';
  }

  // Улучшение в процентах
  const improvement =
    variantB.ctr > 0 ? ((variantA.ctr - variantB.ctr) / variantB.ctr) * 100 : 0;

  // CSV заголовок
  const csvLines = [
    'Metric,Variant A,Variant B,Difference,Significant,Winner',
    '',
    '# Summary',
    `Experiment ID,${stats.experiment_id},,,,`,
    `Last Updated,${stats.last_updated},,,,`,
    `Total Events,${stats.events.length},,,,`,
    `Winner,${winner},,,,`,
    `Statistically Significant,${zTest.significant ? 'Yes' : 'No'},,,,`,
    '',
    '# Metrics',
    `Views,${variantA.views},${variantB.views},${variantA.views - variantB.views},,`,
    `Clicks,${variantA.clicks},${variantB.clicks},${variantA.clicks - variantB.clicks},,`,
    `Interactions,${variantA.interactions},${variantB.interactions},${variantA.interactions - variantB.interactions},,`,
    '',
    '# Click-Through Rate (CTR)',
    `CTR,${(variantA.ctr * 100).toFixed(2)}%,${(variantB.ctr * 100).toFixed(2)}%,${improvement.toFixed(2)}%,${zTest.significant ? 'Yes' : 'No'},${winner}`,
    `CTR (95% CI),${(ciA.lower * 100).toFixed(2)}% - ${(ciA.upper * 100).toFixed(2)}%,${(ciB.lower * 100).toFixed(2)}% - ${(ciB.upper * 100).toFixed(2)}%,,,`,
    '',
    '# Time Metrics (ms)',
    `Avg Time to Click,${variantA.avg_time_to_click},${variantB.avg_time_to_click},${variantA.avg_time_to_click - variantB.avg_time_to_click},,`,
    `Avg Time to Interaction,${variantA.avg_time_to_interaction},${variantB.avg_time_to_interaction},${variantA.avg_time_to_interaction - variantB.avg_time_to_interaction},,`,
    '',
    '# Statistical Test',
    `Z-Score,${zTest.z.toFixed(4)},,,,`,
    `P-Value,${zTest.pValue.toFixed(4)},,,,`,
    `Significance Level,0.05,,,,`,
    `Result,${zTest.significant ? 'Significant' : 'Not Significant'},,,,`,
  ];

  return csvLines.join('\n');
}

/**
 * Генерирует детальный CSV с событиями
 */
function generateDetailedCSV(stats) {
  const csvLines = [
    'Timestamp,Experiment ID,Variant,Event Type,Session ID,Time to Event (ms)',
  ];

  for (const event of stats.events) {
    csvLines.push(
      `${event.timestamp},${event.experiment_id},${event.variant},${event.event_type},${event.session_id},${event.time_to_event || ''}`
    );
  }

  return csvLines.join('\n');
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('[Report] Generating Microcopy A/B Test Report...');

  // Загружаем статистику
  const stats = loadStats();

  if (!stats) {
    console.error('[Report] No stats found. Run some tests first.');
    process.exit(1);
  }

  // Создаем директорию для отчетов
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  // Генерируем имя файла с датой
  const date = formatDate(new Date());
  const summaryFile = path.join(REPORTS_DIR, `microcopy_stats_${date}.csv`);
  const detailFile = path.join(REPORTS_DIR, `microcopy_events_${date}.csv`);

  // Генерируем CSV
  const summaryCSV = generateCSV(stats);
  const detailCSV = generateDetailedCSV(stats);

  // Сохраняем
  fs.writeFileSync(summaryFile, summaryCSV, 'utf-8');
  fs.writeFileSync(detailFile, detailCSV, 'utf-8');

  console.log('✅ [Report] Summary report saved:', summaryFile);
  console.log('✅ [Report] Detailed events saved:', detailFile);
  console.log('');

  // Показываем краткую статистику
  console.log('📊 Summary:');
  console.log(`   Variant A: ${stats.variants.A.views} views, ${stats.variants.A.clicks} clicks (CTR: ${(stats.variants.A.ctr * 100).toFixed(2)}%)`);
  console.log(`   Variant B: ${stats.variants.B.views} views, ${stats.variants.B.clicks} clicks (CTR: ${(stats.variants.B.ctr * 100).toFixed(2)}%)`);

  const zTest = calculateZTest(
    stats.variants.A.ctr,
    stats.variants.A.views,
    stats.variants.B.ctr,
    stats.variants.B.views
  );

  if (zTest.significant) {
    const winner = stats.variants.A.ctr > stats.variants.B.ctr ? 'A' : 'B';
    console.log(`   🏆 Winner: Variant ${winner} (p-value: ${zTest.pValue.toFixed(4)})`);
  } else {
    console.log(`   ⚠️  No statistically significant difference (p-value: ${zTest.pValue.toFixed(4)})`);
  }

  process.exit(0);
}

// ============================================================
// Run
// ============================================================

main().catch((error) => {
  console.error('[Report] Fatal error:', error);
  process.exit(1);
});
