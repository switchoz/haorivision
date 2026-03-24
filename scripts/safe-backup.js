#!/usr/bin/env node

/**
 * HAORI VISION — Safe Backup & Rollback System
 *
 * Создаёт безопасные резервные копии критических данных перед выполнением
 * любых операций изменения (валидация, авто-именование, транскодинг и т.д.)
 *
 * Features:
 * - Автоматический backup перед каждой операцией
 * - Дата-маркированные копии (никогда не перезаписывает)
 * - Backup collections.json, *.db, media files
 * - Проверка целостности (checksum)
 * - Rollback к любой дате
 *
 * Usage:
 *   node scripts/safe-backup.js
 *   node scripts/safe-backup.js --verify
 *   node scripts/safe-backup.js rollback --to 20251008
 *   node scripts/safe-backup.js list
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  copyFileSync,
} from "fs";
import { join, dirname, basename, extname, relative } from "path";
import { createHash } from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================
// Configuration
// ============================================================

const PROJECT_ROOT = join(__dirname, "..");
const BACKUP_DIR = join(PROJECT_ROOT, "backup");

// Критические файлы для backup
const CRITICAL_FILES = [
  // Collections
  "data/products/collections.json",
  "COLLECTIONS.json",
  "frontend/src/data/collections.json",

  // Databases (если есть)
  "data/clients.db",
  "data/orders.db",
  "backend/data/clients.db",

  // Config files
  ".env",
  "backend/.env",
];

// Директории для backup (опционально, только при --all)
const CRITICAL_DIRS = ["data/products", "data/media"];

// ============================================================
// Helper Functions
// ============================================================

/**
 * Get current date/time for backup naming
 */
function getBackupTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * Get date for backup directory (YYYYMMDD)
 */
function getBackupDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

/**
 * Calculate file checksum (MD5)
 */
function calculateChecksum(filePath) {
  try {
    const content = readFileSync(filePath);
    return createHash("md5").update(content).digest("hex");
  } catch (error) {
    return null;
  }
}

/**
 * Get file size in human-readable format
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Recursively get all files in directory
 */
function getAllFiles(dirPath, fileList = []) {
  if (!existsSync(dirPath)) return fileList;

  const files = readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = join(dirPath, file);
    try {
      const stat = statSync(filePath);

      if (stat.isDirectory()) {
        getAllFiles(filePath, fileList);
      } else {
        fileList.push(filePath);
      }
    } catch (error) {
      // Skip files we can't access
    }
  });

  return fileList;
}

// ============================================================
// Backup Functions
// ============================================================

/**
 * Create backup directory structure
 */
function createBackupDir() {
  const date = getBackupDate();
  const backupPath = join(BACKUP_DIR, date);

  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }

  if (!existsSync(backupPath)) {
    mkdirSync(backupPath, { recursive: true });
  }

  return backupPath;
}

/**
 * Backup a single file
 */
function backupFile(filePath, backupDir, preservePath = false) {
  if (!existsSync(filePath)) {
    return null;
  }

  const timestamp = getBackupTimestamp();

  let backupPath;

  if (preservePath) {
    // Preserve directory structure
    const relativePath = relative(PROJECT_ROOT, filePath);
    const targetDir = join(backupDir, dirname(relativePath));

    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    const fileName = basename(filePath);
    const fileExt = extname(fileName);
    const fileBase = basename(fileName, fileExt);

    backupPath = join(targetDir, `${fileBase}_${timestamp}${fileExt}`);
  } else {
    // Flat structure
    const fileName = basename(filePath);
    const fileExt = extname(fileName);
    const fileBase = basename(fileName, fileExt);

    backupPath = join(backupDir, `${fileBase}_${timestamp}${fileExt}`);
  }

  try {
    // Copy file
    copyFileSync(filePath, backupPath);

    // Calculate checksums
    const originalChecksum = calculateChecksum(filePath);
    const backupChecksum = calculateChecksum(backupPath);

    // Verify integrity
    if (originalChecksum !== backupChecksum) {
      throw new Error("Checksum mismatch - backup corrupted");
    }

    const stat = statSync(filePath);

    return {
      original: filePath,
      backup: backupPath,
      size: stat.size,
      checksum: originalChecksum,
      timestamp,
    };
  } catch (error) {
    console.error(`Failed to backup ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Backup all critical files
 */
function backupAll(options = {}) {
  const backupDir = createBackupDir();
  const results = {
    success: [],
    failed: [],
    skipped: [],
    totalSize: 0,
    timestamp: getBackupTimestamp(),
    date: getBackupDate(),
  };

  console.log("\n╔═══════════════════════════════════════════════════════╗");
  console.log("║                                                       ║");
  console.log("║     HAORI VISION — Safe Backup System                ║");
  console.log("║                                                       ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");

  console.log(`📦 Backup directory: ${backupDir}\n`);
  console.log("⏳ Creating backups...\n");

  // Backup individual files
  CRITICAL_FILES.forEach((pattern) => {
    const filePath = join(PROJECT_ROOT, pattern);

    if (!existsSync(filePath)) {
      results.skipped.push(pattern);
      return;
    }

    const result = backupFile(filePath, backupDir, false);

    if (result) {
      results.success.push(result);
      results.totalSize += result.size;
      console.log(
        `✅ ${pattern} → ${basename(result.backup)} (${formatFileSize(result.size)})`,
      );
    } else {
      results.failed.push(filePath);
    }
  });

  // Backup directories (if requested)
  if (options.includeDirs) {
    console.log("\n📂 Backing up directories...\n");

    CRITICAL_DIRS.forEach((dirPattern) => {
      const dirPath = join(PROJECT_ROOT, dirPattern);

      if (!existsSync(dirPath)) {
        results.skipped.push(dirPattern);
        return;
      }

      const files = getAllFiles(dirPath);

      files.forEach((filePath) => {
        const result = backupFile(filePath, backupDir, true);

        if (result) {
          results.success.push(result);
          results.totalSize += result.size;
          const relativePath = relative(PROJECT_ROOT, filePath);
          console.log(`✅ ${relativePath} (${formatFileSize(result.size)})`);
        } else {
          results.failed.push(filePath);
        }
      });
    });
  }

  // Save backup manifest
  const manifestPath = join(
    backupDir,
    `backup_manifest_${results.timestamp}.json`,
  );
  writeFileSync(manifestPath, JSON.stringify(results, null, 2));

  // Print summary
  console.log("\n" + "═".repeat(60));
  console.log("\n📊 Backup Summary:\n");
  console.log(`✅ Successful: ${results.success.length} files`);
  console.log(`❌ Failed: ${results.failed.length} files`);
  console.log(`⏭️  Skipped: ${results.skipped.length} patterns`);
  console.log(`📦 Total size: ${formatFileSize(results.totalSize)}`);
  console.log(`📄 Manifest: ${basename(manifestPath)}`);
  console.log(`\n✨ Backup complete: ${backupDir}\n`);

  if (results.failed.length > 0) {
    console.log("\n⚠️  Failed backups:");
    results.failed.forEach((file) => console.log(`   - ${file}`));
  }

  return results;
}

/**
 * Verify backup integrity
 */
function verifyBackup(backupDate) {
  const backupDir = join(BACKUP_DIR, backupDate);

  if (!existsSync(backupDir)) {
    console.error(`❌ Backup not found: ${backupDate}`);
    return false;
  }

  console.log(`\n🔍 Verifying backup: ${backupDate}\n`);

  // Find manifest
  const files = readdirSync(backupDir);
  const manifestFile = files.find((f) => f.startsWith("backup_manifest_"));

  if (!manifestFile) {
    console.error("❌ Backup manifest not found");
    return false;
  }

  const manifestPath = join(backupDir, manifestFile);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

  let verified = 0;
  let corrupted = 0;

  manifest.success.forEach((entry) => {
    if (!existsSync(entry.backup)) {
      corrupted++;
      console.log(`❌ ${basename(entry.backup)} (file missing)`);
      return;
    }

    const backupChecksum = calculateChecksum(entry.backup);

    if (backupChecksum === entry.checksum) {
      verified++;
      console.log(`✅ ${basename(entry.backup)} (checksum OK)`);
    } else {
      corrupted++;
      console.log(`❌ ${basename(entry.backup)} (checksum MISMATCH)`);
    }
  });

  console.log("\n" + "═".repeat(60));
  console.log(`\n✅ Verified: ${verified} files`);
  console.log(`❌ Corrupted: ${corrupted} files\n`);

  return corrupted === 0;
}

/**
 * List all available backups
 */
function listBackups() {
  if (!existsSync(BACKUP_DIR)) {
    console.log("\n❌ No backups found.\n");
    return;
  }

  const backups = readdirSync(BACKUP_DIR)
    .filter((dir) => {
      const stat = statSync(join(BACKUP_DIR, dir));
      return stat.isDirectory();
    })
    .sort()
    .reverse();

  if (backups.length === 0) {
    console.log("\n❌ No backups found.\n");
    return;
  }

  console.log("\n📦 Available backups:\n");

  backups.forEach((backupDate) => {
    const backupPath = join(BACKUP_DIR, backupDate);
    const files = readdirSync(backupPath);
    const manifestFile = files.find((f) => f.startsWith("backup_manifest_"));

    if (manifestFile) {
      const manifest = JSON.parse(
        readFileSync(join(backupPath, manifestFile), "utf-8"),
      );
      console.log(`📅 ${backupDate}`);
      console.log(`   Files: ${manifest.success.length}`);
      console.log(`   Size: ${formatFileSize(manifest.totalSize)}`);
      console.log(`   Time: ${manifest.timestamp}\n`);
    } else {
      console.log(`📅 ${backupDate} (no manifest)\n`);
    }
  });
}

/**
 * Rollback to a specific backup
 */
function rollback(backupDate, options = {}) {
  const backupDir = join(BACKUP_DIR, backupDate);

  if (!existsSync(backupDir)) {
    console.error(`\n❌ Backup not found: ${backupDate}\n`);
    console.log("Available backups:");
    listBackups();
    return false;
  }

  console.log("\n╔═══════════════════════════════════════════════════════╗");
  console.log("║                                                       ║");
  console.log("║     HAORI VISION — Rollback System                   ║");
  console.log("║                                                       ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");

  console.log(`⏪ Rolling back to: ${backupDate}\n`);

  // Find manifest
  const files = readdirSync(backupDir);
  const manifestFile = files.find((f) => f.startsWith("backup_manifest_"));

  if (!manifestFile) {
    console.error("❌ Backup manifest not found");
    return false;
  }

  const manifestPath = join(backupDir, manifestFile);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

  // Verify backup first
  if (!options.skipVerify) {
    console.log("🔍 Verifying backup integrity...\n");

    const valid = verifyBackup(backupDate);

    if (!valid) {
      console.error("\n❌ Backup verification failed. Aborting rollback.\n");
      return false;
    }

    console.log("\n✅ Backup verified. Proceeding with rollback...\n");
  }

  // Create pre-rollback backup
  if (!options.skipPreBackup) {
    console.log("📦 Creating pre-rollback backup...\n");

    const preRollbackResults = backupAll({ includeDirs: false });

    if (preRollbackResults.failed.length > 0) {
      console.error(
        "\n⚠️  Pre-rollback backup had failures. Continue? (Ctrl+C to cancel)\n",
      );

      if (!options.force) {
        return false;
      }
    }

    console.log("\n✅ Pre-rollback backup complete.\n");
  }

  // Perform rollback
  let restored = 0;
  let failed = 0;

  console.log("⏳ Restoring files...\n");

  manifest.success.forEach((entry) => {
    try {
      // Check if backup file exists
      if (!existsSync(entry.backup)) {
        throw new Error("Backup file missing");
      }

      // Verify checksum
      const backupChecksum = calculateChecksum(entry.backup);

      if (backupChecksum !== entry.checksum) {
        throw new Error("Checksum mismatch");
      }

      // Restore file
      const targetDir = dirname(entry.original);

      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
      }

      copyFileSync(entry.backup, entry.original);

      // Verify restored file
      const restoredChecksum = calculateChecksum(entry.original);

      if (restoredChecksum !== entry.checksum) {
        throw new Error("Restored file checksum mismatch");
      }

      restored++;
      console.log(`✅ ${relative(PROJECT_ROOT, entry.original)}`);
    } catch (error) {
      failed++;
      console.log(
        `❌ ${relative(PROJECT_ROOT, entry.original)} (${error.message})`,
      );
    }
  });

  // Summary
  console.log("\n" + "═".repeat(60));
  console.log("\n📊 Rollback Summary:\n");
  console.log(`✅ Restored: ${restored} files`);
  console.log(`❌ Failed: ${failed} files\n`);

  if (failed === 0) {
    console.log("✨ Rollback complete!\n");
    return true;
  } else {
    console.log("⚠️  Rollback completed with errors.\n");
    return false;
  }
}

// ============================================================
// CLI
// ============================================================

const args = process.argv.slice(2);
const command = args[0];

if (command === "rollback") {
  const toDateIndex = args.indexOf("--to");

  if (toDateIndex === -1) {
    console.error("\n❌ Missing --to parameter\n");
    console.log("Usage: node scripts/safe-backup.js rollback --to 20251008\n");
    process.exit(1);
  }

  const backupDate = args[toDateIndex + 1];

  if (!backupDate || !backupDate.match(/^\d{8}$/)) {
    console.error("\n❌ Invalid date format. Use YYYYMMDD (e.g., 20251008)\n");
    process.exit(1);
  }

  const options = {
    force: args.includes("--force"),
    skipVerify: args.includes("--skip-verify"),
    skipPreBackup: args.includes("--skip-pre-backup"),
  };

  const success = rollback(backupDate, options);
  process.exit(success ? 0 : 1);
} else if (command === "verify") {
  const backupDate = args[1] || getBackupDate();
  const valid = verifyBackup(backupDate);
  process.exit(valid ? 0 : 1);
} else if (command === "list") {
  listBackups();
} else if (command === "help" || command === "--help" || command === "-h") {
  console.log(`
HAORI VISION — Safe Backup & Rollback System

Usage:
  node scripts/safe-backup.js                 Create backup (files only)
  node scripts/safe-backup.js --all           Create backup (files + directories)
  node scripts/safe-backup.js verify          Verify today's backup
  node scripts/safe-backup.js verify DATE     Verify specific backup (e.g., 20251008)
  node scripts/safe-backup.js list            List all available backups
  node scripts/safe-backup.js rollback --to DATE  Rollback to specific backup

Rollback Options:
  --force              Continue rollback even if pre-backup fails
  --skip-verify        Skip backup verification (faster, less safe)
  --skip-pre-backup    Skip creating pre-rollback backup (not recommended)

Examples:
  node scripts/safe-backup.js
  node scripts/safe-backup.js --all
  node scripts/safe-backup.js verify 20251008
  node scripts/safe-backup.js list
  node scripts/safe-backup.js rollback --to 20251008
  node scripts/safe-backup.js rollback --to 20251008 --force
  `);
} else {
  const options = {
    includeDirs: args.includes("--all"),
    verify: args.includes("--verify"),
  };

  const results = backupAll(options);

  if (options.verify) {
    console.log("\n🔍 Verifying backup...\n");
    const valid = verifyBackup(results.date);

    if (valid) {
      console.log("✅ Backup verified successfully\n");
      process.exit(0);
    } else {
      console.log("❌ Backup verification failed\n");
      process.exit(1);
    }
  }

  process.exit(results.failed.length === 0 ? 0 : 1);
}
