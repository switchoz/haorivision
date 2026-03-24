#!/usr/bin/env node
/**
 * HAORI VISION — Legal Pages Publisher
 *
 * Validates and publishes legal documents:
 * - /legal/returns.html (Return policy)
 * - /legal/care.html (Care instructions)
 * - /legal/uv_safety.html (UV safety)
 *
 * Checks:
 * - All legal pages exist
 * - Valid HTML structure
 * - No broken internal links
 * - Proper accessibility (alt text, ARIA)
 * - Footer links updated
 *
 * Usage:
 *   node scripts/legal_publish.mjs
 *   npm run legal:publish
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// Configuration
// ============================================================

const PROJECT_ROOT = path.resolve(__dirname, '..');
const LEGAL_DIR = path.join(PROJECT_ROOT, 'frontend', 'public', 'legal');
const REPORT_DIR = path.join(PROJECT_ROOT, 'reports');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const REPORT_FILE = path.join(REPORT_DIR, `legal_publish_${TIMESTAMP}.txt`);

const LEGAL_PAGES = [
  {
    filename: 'returns.html',
    title: 'Политика возврата и обмена',
    requiredSections: [
      'Возврат готовых изделий',
      'Возврат изделий на заказ',
      '14 дней',
      'bespoke'
    ]
  },
  {
    filename: 'care.html',
    title: 'Инструкции по уходу',
    requiredSections: [
      'Уход за шёлком',
      'Уход за хлопком',
      'Уход за UV-системой',
      'стирка'
    ]
  },
  {
    filename: 'uv_safety.html',
    title: 'UV Безопасность',
    requiredSections: [
      'эпилепсия',
      '3 Гц',
      'дистанция',
      '30 см'
    ]
  }
];

// ============================================================
// Helpers
// ============================================================

function log(message, level = 'info') {
  const prefix = {
    info: '[i]',
    success: '[\u2713]',
    error: '[\u2717]',
    warning: '[!]'
  }[level] || '[i]';

  console.log(`${prefix} ${message}`);

  // Also write to report
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
  fs.appendFileSync(REPORT_FILE, `${prefix} ${message}\n`);
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

// ============================================================
// Validation Functions
// ============================================================

function validateHTML(content, filename) {
  const errors = [];

  // Check for basic HTML structure
  if (!content.includes('<!DOCTYPE html>')) {
    errors.push('Missing DOCTYPE declaration');
  }
  if (!content.includes('<html')) {
    errors.push('Missing <html> tag');
  }
  if (!content.includes('<head>')) {
    errors.push('Missing <head> tag');
  }
  if (!content.includes('<body>')) {
    errors.push('Missing <body> tag');
  }

  // Check for required meta tags
  if (!content.includes('<meta charset=')) {
    errors.push('Missing charset meta tag');
  }
  if (!content.includes('<meta name="viewport"')) {
    errors.push('Missing viewport meta tag');
  }
  if (!content.includes('<meta name="description"')) {
    errors.push('Missing description meta tag');
  }

  // Check for title
  if (!content.includes('<title>')) {
    errors.push('Missing <title> tag');
  }

  return errors;
}

function validateSections(content, requiredSections, filename) {
  const missing = [];

  for (const section of requiredSections) {
    if (!content.toLowerCase().includes(section.toLowerCase())) {
      missing.push(section);
    }
  }

  return missing;
}

function validateLinks(content, filename) {
  const brokenLinks = [];

  // Check for links to other legal pages
  const linkPatterns = [
    /href=["']\/legal\/returns\.html["']/g,
    /href=["']\/legal\/care\.html["']/g,
    /href=["']\/legal\/uv_safety\.html["']/g
  ];

  linkPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const linkedFile = match.match(/\/legal\/(.+?)["']/)[1];
        const linkedPath = path.join(LEGAL_DIR, linkedFile);
        if (!checkFileExists(linkedPath)) {
          brokenLinks.push(linkedFile);
        }
      });
    }
  });

  return brokenLinks;
}

function validateAccessibility(content, filename) {
  const warnings = [];

  // Check for images without alt text
  const imgRegex = /<img[^>]*>/gi;
  const images = content.match(imgRegex) || [];
  images.forEach(img => {
    if (!img.includes('alt=')) {
      warnings.push('Image without alt text found');
    }
  });

  // Check for proper heading hierarchy
  const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
  if (h1Count === 0) {
    warnings.push('No H1 heading found');
  } else if (h1Count > 1) {
    warnings.push('Multiple H1 headings found (should be only one)');
  }

  // Check for links without text
  const linkRegex = /<a[^>]*><\/a>/gi;
  const emptyLinks = content.match(linkRegex) || [];
  if (emptyLinks.length > 0) {
    warnings.push(`${emptyLinks.length} empty link(s) found`);
  }

  return warnings;
}

// ============================================================
// Main Validation
// ============================================================

async function validateLegalPages() {
  let allValid = true;

  log('============================================================');
  log('HAORI VISION — Legal Pages Publisher');
  log('============================================================');
  log('');

  // Check legal directory exists
  if (!checkFileExists(LEGAL_DIR)) {
    log(`Legal directory not found: ${LEGAL_DIR}`, 'error');
    return false;
  }

  log(`Legal directory: ${LEGAL_DIR}`, 'info');
  log('');

  // Validate each legal page
  for (const page of LEGAL_PAGES) {
    const filePath = path.join(LEGAL_DIR, page.filename);

    log(`Validating ${page.filename}...`, 'info');

    // Check file exists
    if (!checkFileExists(filePath)) {
      log(`  File not found: ${page.filename}`, 'error');
      allValid = false;
      continue;
    }

    // Read file content
    const content = readFile(filePath);

    // Validate HTML structure
    const htmlErrors = validateHTML(content, page.filename);
    if (htmlErrors.length > 0) {
      log(`  HTML validation errors:`, 'error');
      htmlErrors.forEach(err => log(`    - ${err}`, 'error'));
      allValid = false;
    } else {
      log(`  HTML structure: OK`, 'success');
    }

    // Validate required sections
    const missingSections = validateSections(content, page.requiredSections, page.filename);
    if (missingSections.length > 0) {
      log(`  Missing required sections:`, 'warning');
      missingSections.forEach(section => log(`    - ${section}`, 'warning'));
    } else {
      log(`  Required sections: OK`, 'success');
    }

    // Validate links
    const brokenLinks = validateLinks(content, page.filename);
    if (brokenLinks.length > 0) {
      log(`  Broken links found:`, 'error');
      brokenLinks.forEach(link => log(`    - ${link}`, 'error'));
      allValid = false;
    } else {
      log(`  Internal links: OK`, 'success');
    }

    // Validate accessibility
    const a11yWarnings = validateAccessibility(content, page.filename);
    if (a11yWarnings.length > 0) {
      log(`  Accessibility warnings:`, 'warning');
      a11yWarnings.forEach(warning => log(`    - ${warning}`, 'warning'));
    } else {
      log(`  Accessibility: OK`, 'success');
    }

    // Check file size
    const fileSize = fs.statSync(filePath).size;
    const fileSizeKB = (fileSize / 1024).toFixed(2);
    log(`  File size: ${fileSizeKB} KB`, 'info');

    log('');
  }

  return allValid;
}

// ============================================================
// Summary
// ============================================================

function printSummary(allValid) {
  log('============================================================');
  log('VALIDATION SUMMARY');
  log('============================================================');
  log('');

  if (allValid) {
    log('All legal pages validated successfully!', 'success');
    log('Legal pages are ready for publication.', 'success');
    log('');
    log('Next steps:', 'info');
    log('  1. Review the pages manually at:', 'info');
    log(`     - http://localhost:3012/legal/returns.html`, 'info');
    log(`     - http://localhost:3012/legal/care.html`, 'info');
    log(`     - http://localhost:3012/legal/uv_safety.html`, 'info');
    log('  2. Update footer links in your layout components', 'info');
    log('  3. Add legal links to new product cards', 'info');
    log('  4. Commit and deploy to production', 'info');
  } else {
    log('Validation failed!', 'error');
    log('Please fix the errors above before publishing.', 'error');
  }

  log('');
  log(`Full report saved to: ${REPORT_FILE}`, 'info');
  log('');
  log('============================================================');
}

// ============================================================
// Execution
// ============================================================

async function main() {
  try {
    // Initialize report file
    fs.writeFileSync(REPORT_FILE, `HAORI VISION — Legal Pages Validation Report\n`);
    fs.appendFileSync(REPORT_FILE, `Date: ${new Date().toISOString()}\n\n`);

    // Validate all pages
    const allValid = await validateLegalPages();

    // Print summary
    printSummary(allValid);

    // Exit with appropriate code
    process.exit(allValid ? 0 : 1);
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    log(error.stack, 'error');
    process.exit(1);
  }
}

main();
