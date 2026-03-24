#!/usr/bin/env node

/**
 * HAORI VISION — Secret Scanner (P21)
 *
 * Scans codebase for potential secrets and API keys that should not be in git.
 *
 * Features:
 * - Pattern-based detection (API keys, passwords, tokens)
 * - File exclusion (node_modules, .git, etc.)
 * - Detailed reporting with file:line locations
 * - Exit code 1 if secrets found (CI/CD integration)
 *
 * Usage:
 *   node scripts/secret_scan.mjs
 *   npm run security:secret_scan
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(ROOT_DIR, 'reports');
const REPORT_FILE = path.join(REPORTS_DIR, `secrets_${new Date().toISOString().split('T')[0]}.txt`);

// Patterns to detect secrets
const SECRET_PATTERNS = [
  // API Keys
  { name: 'Anthropic API Key', pattern: /sk-ant-api\d{2}-[A-Za-z0-9_-]{93}/g, severity: 'CRITICAL' },
  { name: 'OpenAI API Key', pattern: /sk-[A-Za-z0-9]{48}/g, severity: 'CRITICAL' },
  { name: 'Stripe Secret Key', pattern: /sk_(test|live)_[0-9a-zA-Z]{24,}/g, severity: 'CRITICAL' },
  { name: 'Stripe Publishable Key', pattern: /pk_(test|live)_[0-9a-zA-Z]{24,}/g, severity: 'HIGH' },

  // Generic API Keys
  { name: 'Generic API Key', pattern: /api[_-]?key['"]?\s*[:=]\s*['""][a-zA-Z0-9_-]{20,}['"]/gi, severity: 'HIGH' },
  { name: 'Authorization Bearer', pattern: /authorization:\s*bearer\s+[a-zA-Z0-9_-]{20,}/gi, severity: 'HIGH' },

  // AWS
  { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g, severity: 'CRITICAL' },
  { name: 'AWS Secret Key', pattern: /aws[_-]?secret[_-]?access[_-]?key['"]?\s*[:=]\s*['""][a-zA-Z0-9/+=]{40}['"]/gi, severity: 'CRITICAL' },

  // Passwords
  { name: 'Password in Code', pattern: /password['"]?\s*[:=]\s*['""][^'"]{8,}['"]/gi, severity: 'HIGH' },
  { name: 'DB Password', pattern: /db[_-]?pass(word)?['"]?\s*[:=]\s*['""][^'"]{6,}['"]/gi, severity: 'CRITICAL' },

  // Tokens
  { name: 'JWT Token', pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, severity: 'HIGH' },
  { name: 'GitHub Token', pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/g, severity: 'CRITICAL' },

  // MongoDB
  { name: 'MongoDB URI', pattern: /mongodb(\+srv)?:\/\/[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+@/g, severity: 'CRITICAL' },

  // Private Keys
  { name: 'Private Key', pattern: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g, severity: 'CRITICAL' },

  // Email credentials
  { name: 'SMTP Password', pattern: /smtp[_-]?pass(word)?['"]?\s*[:=]\s*['""][^'"]{6,}['"]/gi, severity: 'HIGH' },

  // Generic secrets
  { name: 'Secret Key', pattern: /secret[_-]?key['"]?\s*[:=]\s*['""][a-zA-Z0-9_-]{20,}['"]/gi, severity: 'HIGH' },
];

// Files and directories to exclude
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /\.next/,
  /dist/,
  /build/,
  /coverage/,
  /\.env\.example/,
  /env\.template/,
  /\.md$/,
  /package-lock\.json/,
  /yarn\.lock/,
  /\.log$/,
  /\.svg$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  /\.ico$/,
  /\.woff$/,
  /\.woff2$/,
  /\.ttf$/,
  /\.eot$/,
  /reports\//,
  /secret_scan\.mjs$/,  // Don't scan this file itself
];

// Whitelist: Known false positives or example values
const WHITELIST = [
  'your_api_key_here',
  'your_secret_here',
  'example_key',
  'test_key',
  'sk-ant-api03-YOUR_KEY_HERE',
  'mongodb://localhost:27017',
  'mongodb://username:password@localhost', // Template example
  'password: process.env',
  'apiKey: process.env',
];

let findings = [];
let filesScanned = 0;

/**
 * Check if file should be excluded
 */
function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * Check if match is whitelisted
 */
function isWhitelisted(match) {
  return WHITELIST.some(wl => match.toLowerCase().includes(wl.toLowerCase()));
}

/**
 * Scan a single file for secrets
 */
async function scanFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const { name, pattern, severity } of SECRET_PATTERNS) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(content)) !== null) {
        const matchText = match[0];

        // Skip if whitelisted
        if (isWhitelisted(matchText)) {
          continue;
        }

        // Find line number
        let lineNumber = 1;
        let charCount = 0;
        for (let i = 0; i < lines.length; i++) {
          charCount += lines[i].length + 1; // +1 for newline
          if (charCount > match.index) {
            lineNumber = i + 1;
            break;
          }
        }

        findings.push({
          file: path.relative(ROOT_DIR, filePath),
          line: lineNumber,
          type: name,
          severity: severity,
          match: matchText.substring(0, 100), // Limit to 100 chars
        });
      }
    }

    filesScanned++;
  } catch (error) {
    // Ignore binary files or read errors
    if (error.code !== 'EISDIR') {
      console.error(`Error scanning ${filePath}:`, error.message);
    }
  }
}

/**
 * Recursively scan directory
 */
async function scanDirectory(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (shouldExclude(fullPath)) {
        continue;
      }

      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (entry.isFile()) {
        await scanFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }
}

/**
 * Generate report
 */
async function generateReport() {
  const lines = [];

  lines.push('═'.repeat(80));
  lines.push('HAORI VISION — Secret Scanner Report');
  lines.push('═'.repeat(80));
  lines.push('');
  lines.push(`Scan Date: ${new Date().toISOString()}`);
  lines.push(`Files Scanned: ${filesScanned}`);
  lines.push(`Secrets Found: ${findings.length}`);
  lines.push('');

  if (findings.length === 0) {
    lines.push('✅ NO SECRETS FOUND');
    lines.push('');
    lines.push('All files are clean. No potential secrets detected in the codebase.');
  } else {
    lines.push('❌ SECRETS DETECTED');
    lines.push('');
    lines.push('The following potential secrets were found in your codebase:');
    lines.push('');

    // Group by severity
    const critical = findings.filter(f => f.severity === 'CRITICAL');
    const high = findings.filter(f => f.severity === 'HIGH');

    if (critical.length > 0) {
      lines.push('─'.repeat(80));
      lines.push(`CRITICAL SEVERITY (${critical.length})`);
      lines.push('─'.repeat(80));
      lines.push('');

      critical.forEach(finding => {
        lines.push(`[${finding.type}]`);
        lines.push(`  File: ${finding.file}:${finding.line}`);
        lines.push(`  Match: ${finding.match}`);
        lines.push('');
      });
    }

    if (high.length > 0) {
      lines.push('─'.repeat(80));
      lines.push(`HIGH SEVERITY (${high.length})`);
      lines.push('─'.repeat(80));
      lines.push('');

      high.forEach(finding => {
        lines.push(`[${finding.type}]`);
        lines.push(`  File: ${finding.file}:${finding.line}`);
        lines.push(`  Match: ${finding.match}`);
        lines.push('');
      });
    }

    lines.push('═'.repeat(80));
    lines.push('REMEDIATION STEPS');
    lines.push('═'.repeat(80));
    lines.push('');
    lines.push('1. Remove all secrets from code immediately');
    lines.push('2. Move secrets to .env file (ensure .env is in .gitignore)');
    lines.push('3. Rotate all compromised credentials/keys');
    lines.push('4. Use environment variables: process.env.API_KEY');
    lines.push('5. Never commit .env files to git');
    lines.push('6. Use configs/env.template for documentation');
    lines.push('');
  }

  lines.push('═'.repeat(80));

  const report = lines.join('\n');

  // Write to file
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  await fs.writeFile(REPORT_FILE, report, 'utf-8');

  return report;
}

/**
 * Main execution
 */
async function main() {
  console.log('');
  console.log('═'.repeat(80));
  console.log('  HAORI VISION — Secret Scanner');
  console.log('═'.repeat(80));
  console.log('');

  console.log('[1/3] Scanning codebase...');
  await scanDirectory(ROOT_DIR);
  console.log(`      Scanned ${filesScanned} files`);
  console.log('');

  console.log('[2/3] Analyzing findings...');
  console.log(`      Found ${findings.length} potential secrets`);
  console.log('');

  console.log('[3/3] Generating report...');
  const report = await generateReport();
  console.log(`      Report saved to: ${path.relative(ROOT_DIR, REPORT_FILE)}`);
  console.log('');

  // Output summary
  console.log('═'.repeat(80));
  console.log('  Summary');
  console.log('═'.repeat(80));
  console.log('');

  if (findings.length === 0) {
    console.log('✅ NO SECRETS FOUND');
    console.log('');
    console.log('Your codebase is clean! No potential secrets detected.');
    console.log('');
    return 0;
  } else {
    const critical = findings.filter(f => f.severity === 'CRITICAL').length;
    const high = findings.filter(f => f.severity === 'HIGH').length;

    console.log('❌ SECRETS DETECTED');
    console.log('');
    console.log(`  Critical: ${critical}`);
    console.log(`  High:     ${high}`);
    console.log(`  Total:    ${findings.length}`);
    console.log('');
    console.log('⚠️  ACTION REQUIRED:');
    console.log('  1. Review report: ' + path.relative(ROOT_DIR, REPORT_FILE));
    console.log('  2. Remove secrets from code');
    console.log('  3. Move secrets to .env file');
    console.log('  4. Rotate compromised credentials');
    console.log('');

    return 1; // Exit code 1 for CI/CD failure
  }
}

// Run
main()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
