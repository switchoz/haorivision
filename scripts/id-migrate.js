/**
 * 🆔 ID MIGRATION CLI
 *
 * CLI команды для управления ID в collections.json
 *
 * Usage:
 *   node scripts/id-migrate.js dry    # Dry run (без изменений)
 *   node scripts/id-migrate.js apply  # Применить изменения
 */

import IDGenerator from "./id-generator.js";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLLECTIONS_PATH = path.join(
  __dirname,
  "../data/products/collections.json",
);

async function runMigration(mode) {
  const dryRun = mode !== "apply";

  console.log("🆔 ID MIGRATION TOOL");
  console.log("===================\n");

  if (dryRun) {
    console.log("⚠️  Режим: DRY RUN (изменения НЕ будут применены)");
  } else {
    console.log("✍️  Режим: APPLY (изменения БУДУТ применены)");
    console.log("\n💾 Создание резервной копии...");

    try {
      // Create backup before applying
      execSync("node scripts/backup.js", {
        cwd: path.join(__dirname, ".."),
        stdio: "inherit",
      });
      console.log("✅ Резервная копия создана\n");
    } catch (error) {
      console.error("❌ Ошибка создания резервной копии:", error.message);
      console.error("   Миграция прервана.");
      process.exit(1);
    }
  }

  try {
    const generator = new IDGenerator(COLLECTIONS_PATH);

    // Load and analyze
    generator.loadCollections();

    // Assign IDs
    const report = generator.assignIDs(dryRun);

    // Save if not dry run
    if (!dryRun) {
      generator.saveCollections();
    }

    // Generate report
    const reportPath = generator.generateReport(report, dryRun);

    // Print summary
    generator.printSummary(report, dryRun);

    if (dryRun) {
      console.log("💡 Чтобы применить изменения, запустите:");
      console.log("   node scripts/id-migrate.js apply\n");
    } else {
      console.log("✅ Миграция успешно завершена!");
      console.log(`📄 Отчёт: ${reportPath}\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error("\n❌ ОШИБКА:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Parse command
const args = process.argv.slice(2);
const mode = args[0] || "dry";

if (!["dry", "apply"].includes(mode)) {
  console.error("❌ Неверная команда. Используйте: dry или apply");
  process.exit(1);
}

runMigration(mode);
