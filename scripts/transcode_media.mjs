#!/usr/bin/env node
/**
 * HAORI VISION  Media Transcode Node.js Wrapper
 *
 * Cross-platform wrapper for transcode_media.sh
 * Handles ffmpeg installation check and execution
 *
 * Usage:
 *   node scripts/transcode_media.mjs
 *   node scripts/transcode_media.mjs public/media/raw public/media/optimized
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { platform } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = dirname(__dirname);

// ============================================================
// Configuration
// ============================================================

const INPUT_DIR = process.argv[2] || join(ROOT_DIR, 'public', 'media', 'raw');
const OUTPUT_DIR = process.argv[3] || join(ROOT_DIR, 'public', 'media', 'optimized');
const BASH_SCRIPT = join(__dirname, 'transcode_media.sh');

// ============================================================
// Colors for output
// ============================================================

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(level, message) {
  const timestamp = new Date().toISOString();
  const color = {
    INFO: colors.blue,
    SUCCESS: colors.green,
    WARN: colors.yellow,
    ERROR: colors.red
  }[level] || colors.reset;

  console.log(`${color}[${level}]${colors.reset} ${timestamp} ${message}`);
}

// ============================================================
// Dependency Check
// ============================================================

function checkCommand(cmd) {
  return new Promise((resolve) => {
    const proc = spawn(platform() === 'win32' ? 'where' : 'which', [cmd], {
      stdio: 'pipe'
    });

    proc.on('close', (code) => {
      resolve(code === 0);
    });

    proc.on('error', () => {
      resolve(false);
    });
  });
}

async function checkDependencies() {
  log('INFO', 'Checking dependencies...');

  const hasFFmpeg = await checkCommand('ffmpeg');
  const hasBash = await checkCommand(platform() === 'win32' ? 'bash' : 'sh');

  if (!hasFFmpeg) {
    log('ERROR', 'ffmpeg not found!');
    console.log('\nInstallation instructions:');
    console.log('');

    if (platform() === 'win32') {
      console.log('Windows:');
      console.log('  1. Download ffmpeg from https://ffmpeg.org/download.html');
      console.log('  2. Extract to C:\\ffmpeg');
      console.log('  3. Add C:\\ffmpeg\\bin to PATH');
      console.log('  OR use chocolatey: choco install ffmpeg');
    } else if (platform() === 'darwin') {
      console.log('macOS:');
      console.log('  brew install ffmpeg');
    } else {
      console.log('Linux:');
      console.log('  sudo apt-get install ffmpeg   # Debian/Ubuntu');
      console.log('  sudo yum install ffmpeg       # RedHat/CentOS');
    }

    console.log('');
    return false;
  }

  if (!hasBash) {
    log('ERROR', 'bash/sh not found!');

    if (platform() === 'win32') {
      console.log('\nWindows: Install Git Bash or WSL');
      console.log('  https://git-scm.com/downloads');
    }

    return false;
  }

  log('SUCCESS', 'All dependencies found');
  return true;
}

// ============================================================
// Execute Bash Script
// ============================================================

function runBashScript() {
  return new Promise((resolve, reject) => {
    log('INFO', 'Launching transcode script...');

    const shell = platform() === 'win32' ? 'bash' : 'sh';

    const proc = spawn(shell, [BASH_SCRIPT, INPUT_DIR, OUTPUT_DIR], {
      stdio: 'inherit',
      cwd: ROOT_DIR
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('============================================================');
  console.log('HAORI VISION  Media Transcode Wrapper');
  console.log('============================================================');
  console.log('');

  // Check if bash script exists
  if (!existsSync(BASH_SCRIPT)) {
    log('ERROR', `Bash script not found: ${BASH_SCRIPT}`);
    process.exit(1);
  }

  // Check dependencies
  const depsOk = await checkDependencies();
  if (!depsOk) {
    log('ERROR', 'Missing dependencies. Please install and try again.');
    process.exit(1);
  }

  console.log('');

  // Run transcode
  try {
    await runBashScript();
    log('SUCCESS', 'Transcoding completed successfully');
    process.exit(0);
  } catch (err) {
    log('ERROR', `Transcoding failed: ${err.message}`);
    process.exit(1);
  }
}

main();
