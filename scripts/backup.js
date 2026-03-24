/**
 * 💾 BACKUP SCRIPT
 *
 * Автоматическое резервное копирование критичных данных:
 * - /data/products/collections.json → /backup/[date]_collections.json
 * - MongoDB collections → /backup/[date]_mongodb/
 *
 * Запускается перед любыми критическими изменениями
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BackupManager {
  constructor() {
    this.rootDir = path.join(__dirname, "..");
    this.backupDir = path.join(this.rootDir, "backup");
    this.timestamp = this.getTimestamp();
    this.results = {
      success: [],
      failed: [],
      skipped: [],
    };
  }

  getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }

  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`📁 Создана директория: ${this.backupDir}`);
    }
  }

  async backupFile(sourcePath, fileName) {
    try {
      const fullSourcePath = path.join(this.rootDir, sourcePath);

      if (!fs.existsSync(fullSourcePath)) {
        this.results.skipped.push({
          file: sourcePath,
          reason: "Файл не существует",
        });
        console.log(`⚠️  ПРОПУЩЕНО: ${sourcePath} (файл не найден)`);
        return false;
      }

      const backupFileName = `${this.timestamp}_${fileName}`;
      const backupPath = path.join(this.backupDir, backupFileName);

      // Copy file
      fs.copyFileSync(fullSourcePath, backupPath);

      // Verify backup
      const sourceStats = fs.statSync(fullSourcePath);
      const backupStats = fs.statSync(backupPath);

      if (sourceStats.size === backupStats.size) {
        this.results.success.push({
          source: sourcePath,
          backup: backupPath,
          size: sourceStats.size,
        });
        console.log(
          `✅ УСПЕШНО: ${sourcePath} → ${backupFileName} (${this.formatBytes(sourceStats.size)})`,
        );
        return true;
      } else {
        this.results.failed.push({
          file: sourcePath,
          reason: "Размер файлов не совпадает",
        });
        console.log(`❌ ОШИБКА: ${sourcePath} (размер не совпадает)`);
        return false;
      }
    } catch (error) {
      this.results.failed.push({
        file: sourcePath,
        reason: error.message,
      });
      console.log(`❌ ОШИБКА: ${sourcePath} - ${error.message}`);
      return false;
    }
  }

  async backupMongoDB() {
    console.log("\n📊 Резервное копирование MongoDB...");

    try {
      // Check if MongoDB is available
      const mongoUri =
        process.env.MONGODB_URI || "mongodb://localhost:27017/haorivision";

      // Create backup directory for MongoDB
      const mongoBackupDir = path.join(
        this.backupDir,
        `${this.timestamp}_mongodb`,
      );

      if (!fs.existsSync(mongoBackupDir)) {
        fs.mkdirSync(mongoBackupDir, { recursive: true });
      }

      // Try to use mongodump
      try {
        const { stdout, stderr } = await execAsync(
          `mongodump --uri="${mongoUri}" --out="${mongoBackupDir}"`,
        );

        if (stderr && !stderr.includes("done")) {
          throw new Error(stderr);
        }

        this.results.success.push({
          source: "MongoDB (все коллекции)",
          backup: mongoBackupDir,
          size: this.getDirectorySize(mongoBackupDir),
        });

        console.log(`✅ УСПЕШНО: MongoDB → ${path.basename(mongoBackupDir)}`);
        return true;
      } catch (execError) {
        // mongodump not available or failed
        console.log(`⚠️  ПРОПУЩЕНО: MongoDB backup (${execError.message})`);
        this.results.skipped.push({
          file: "MongoDB",
          reason: "mongodump не установлен или MongoDB недоступна",
        });
        return false;
      }
    } catch (error) {
      this.results.failed.push({
        file: "MongoDB",
        reason: error.message,
      });
      console.log(`❌ ОШИБКА: MongoDB - ${error.message}`);
      return false;
    }
  }

  getDirectorySize(dirPath) {
    let size = 0;

    if (!fs.existsSync(dirPath)) {
      return 0;
    }

    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        size += this.getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    }

    return size;
  }

  formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }

  async createBackupManifest() {
    const manifest = {
      timestamp: this.timestamp,
      date: new Date().toISOString(),
      results: this.results,
      summary: {
        success: this.results.success.length,
        failed: this.results.failed.length,
        skipped: this.results.skipped.length,
        total:
          this.results.success.length +
          this.results.failed.length +
          this.results.skipped.length,
      },
    };

    const manifestPath = path.join(
      this.backupDir,
      `${this.timestamp}_manifest.json`,
    );
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

    console.log(`\n📋 Манифест создан: ${this.timestamp}_manifest.json`);

    return manifest;
  }

  printSummary() {
    console.log("\n");
    console.log("========================================");
    console.log("💾 РЕЗЕРВНОЕ КОПИРОВАНИЕ ЗАВЕРШЕНО");
    console.log("========================================");
    console.log(`\n📅 Дата: ${new Date().toLocaleString("ru-RU")}`);
    console.log(`📁 Директория: ${this.backupDir}`);
    console.log("\nРезультаты:");
    console.log(`  ✅ Успешно: ${this.results.success.length}`);
    console.log(`  ❌ Ошибки: ${this.results.failed.length}`);
    console.log(`  ⚠️  Пропущено: ${this.results.skipped.length}`);

    if (this.results.success.length > 0) {
      console.log("\n✅ Успешные резервные копии:");
      this.results.success.forEach((item) => {
        console.log(`  • ${item.source} (${this.formatBytes(item.size)})`);
      });
    }

    if (this.results.failed.length > 0) {
      console.log("\n❌ Ошибки:");
      this.results.failed.forEach((item) => {
        console.log(`  • ${item.file}: ${item.reason}`);
      });
    }

    if (this.results.skipped.length > 0) {
      console.log("\n⚠️  Пропущено:");
      this.results.skipped.forEach((item) => {
        console.log(`  • ${item.file}: ${item.reason}`);
      });
    }

    console.log("\n");

    return this.results.failed.length === 0;
  }

  async run() {
    console.log("💾 Запуск резервного копирования...\n");

    this.ensureBackupDir();

    // Список файлов для резервного копирования
    const filesToBackup = [
      {
        source: "data/products/collections.json",
        name: "collections.json",
      },
      {
        source: "COLLECTIONS.json",
        name: "collections_root.json",
      },
      {
        source: "frontend/src/data/collections.json",
        name: "collections_frontend.json",
      },
    ];

    console.log("📄 Копирование файлов...\n");

    for (const file of filesToBackup) {
      await this.backupFile(file.source, file.name);
    }

    // MongoDB backup (optional, won't fail if not available)
    await this.backupMongoDB();

    // Create manifest
    await this.createBackupManifest();

    // Print summary
    const success = this.printSummary();

    if (success) {
      console.log("✅ Все критические файлы успешно скопированы.");
      console.log("   Можно продолжать работу.\n");
      process.exit(0);
    } else {
      console.log("⚠️  ВНИМАНИЕ: Некоторые файлы не удалось скопировать!");
      console.log("   Проверьте ошибки выше перед продолжением.\n");
      process.exit(1);
    }
  }
}

// Run backup
const backup = new BackupManager();
backup.run().catch((error) => {
  console.error("❌ КРИТИЧЕСКАЯ ОШИБКА:", error);
  process.exit(1);
});
