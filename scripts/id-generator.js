/**
 * 🆔 ID GENERATOR
 *
 * Система генерации уникальных ID для товаров в collections.json
 *
 * Правила:
 * A) Известные серии (ECLIPSE, LUMIN SPIRIT, FLUO BLOOM):
 *    Формат: <PREFIX>-NN (двузначный порядковый номер)
 *    Примеры: ECLIPSE-01, LUMIN-03, BLOOM-11
 *
 * B) Неизвестные серии:
 *    Формат: HV-<YYYYMM>-<XXX>
 *    YYYYMM = текущая дата (Europe/Stockholm)
 *    XXX = порядковый номер в месяце (001-999)
 *
 * C) Номер = минимальный свободный (заполняет пропуски)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Известные серии
const KNOWN_SERIES = {
  ECLIPSE: "ECLIPSE",
  "LUMIN SPIRIT": "LUMIN",
  LUMIN: "LUMIN",
  "FLUO BLOOM": "BLOOM",
  BLOOM: "BLOOM",
};

class IDGenerator {
  constructor(collectionsPath) {
    this.collectionsPath = collectionsPath;
    this.collections = null;
    this.usedIDs = new Set();
    this.prefixCounters = {}; // { ECLIPSE: Set([1, 2, 5]), LUMIN: Set([1, 3]), HV-202510: Set([1, 2]) }
  }

  loadCollections() {
    const content = fs.readFileSync(this.collectionsPath, "utf-8");
    this.collections = JSON.parse(content);
    this.analyzeExistingIDs();
  }

  analyzeExistingIDs() {
    console.log("\n📊 Анализ существующих ID...\n");

    const traverse = (obj, path = "") => {
      if (!obj || typeof obj !== "object") return;

      if (obj.id) {
        this.usedIDs.add(obj.id);

        // Parse ID to extract prefix and number
        const match = obj.id.match(/^([A-Z]+)-(\d+)$/);
        if (match) {
          const prefix = match[1];
          const number = parseInt(match[2], 10);

          if (!this.prefixCounters[prefix]) {
            this.prefixCounters[prefix] = new Set();
          }
          this.prefixCounters[prefix].add(number);
        }

        // Parse HV-YYYYMM-XXX format
        const hvMatch = obj.id.match(/^HV-(\d{6})-(\d{3})$/);
        if (hvMatch) {
          const prefix = `HV-${hvMatch[1]}`;
          const number = parseInt(hvMatch[2], 10);

          if (!this.prefixCounters[prefix]) {
            this.prefixCounters[prefix] = new Set();
          }
          this.prefixCounters[prefix].add(number);
        }
      }

      if (Array.isArray(obj)) {
        obj.forEach((item, i) => traverse(item, `${path}[${i}]`));
      } else {
        Object.keys(obj).forEach((key) => {
          traverse(obj[key], path ? `${path}.${key}` : key);
        });
      }
    };

    traverse(this.collections);

    console.log(`   Всего уникальных ID: ${this.usedIDs.size}`);
    console.log(`   Префиксы:`);
    Object.keys(this.prefixCounters)
      .sort()
      .forEach((prefix) => {
        const numbers = Array.from(this.prefixCounters[prefix]).sort(
          (a, b) => a - b,
        );
        console.log(`      ${prefix}: ${numbers.join(", ")}`);
      });
  }

  detectSeries(item) {
    // Check in title, series, name fields
    const searchFields = [
      item.title,
      item.series,
      item.name,
      item.concept?.title,
    ]
      .filter(Boolean)
      .join(" ")
      .toUpperCase();

    for (const [seriesName, prefix] of Object.entries(KNOWN_SERIES)) {
      if (searchFields.includes(seriesName)) {
        return prefix;
      }
    }

    return null;
  }

  getNextNumber(prefix, maxDigits = 2) {
    const usedNumbers = this.prefixCounters[prefix] || new Set();

    // Find minimum available number starting from 1
    let number = 1;
    const maxNumber = Math.pow(10, maxDigits) - 1;

    while (number <= maxNumber) {
      if (!usedNumbers.has(number)) {
        return number;
      }
      number++;
    }

    // If we've exhausted all numbers, increment beyond max
    return number;
  }

  getCurrentYearMonth() {
    // Use Europe/Stockholm timezone
    const date = new Date();
    const options = {
      timeZone: "Europe/Stockholm",
      year: "numeric",
      month: "2-digit",
    };
    const formatter = new Intl.DateTimeFormat("sv-SE", options);
    const parts = formatter.format(date).split("-");

    return `${parts[0]}${parts[1]}`; // YYYYMM
  }

  generateID(item) {
    // A) Check for known series
    const seriesPrefix = this.detectSeries(item);

    if (seriesPrefix) {
      const nextNumber = this.getNextNumber(seriesPrefix, 2);
      const id = `${seriesPrefix}-${String(nextNumber).padStart(2, "0")}`;

      // Reserve this ID
      if (!this.prefixCounters[seriesPrefix]) {
        this.prefixCounters[seriesPrefix] = new Set();
      }
      this.prefixCounters[seriesPrefix].add(nextNumber);
      this.usedIDs.add(id);

      return id;
    }

    // B) Universal format: HV-YYYYMM-XXX
    const yearMonth = this.getCurrentYearMonth();
    const prefix = `HV-${yearMonth}`;

    const nextNumber = this.getNextNumber(prefix, 3);
    const id = `${prefix}-${String(nextNumber).padStart(3, "0")}`;

    // Reserve this ID
    if (!this.prefixCounters[prefix]) {
      this.prefixCounters[prefix] = new Set();
    }
    this.prefixCounters[prefix].add(nextNumber);
    this.usedIDs.add(id);

    return id;
  }

  assignIDs(dryRun = true) {
    console.log(
      `\n${dryRun ? "🔍 DRY RUN" : "✍️  ПРИМЕНЕНИЕ"}: Присвоение ID...\n`,
    );

    const report = {
      processed: 0,
      assigned: [],
      skipped: [],
      errors: [],
    };

    const assignIDsRecursive = (obj, path = "") => {
      if (!obj || typeof obj !== "object") return;

      // Check if this is a product/item that needs an ID
      if (
        obj.hasOwnProperty("name") ||
        obj.hasOwnProperty("sku") ||
        obj.hasOwnProperty("title")
      ) {
        report.processed++;

        if (obj.id) {
          // Already has ID, skip
          report.skipped.push({
            path: path,
            name: obj.name || obj.title || "Unknown",
            existingID: obj.id,
            reason: "Already has ID",
          });
        } else {
          // Needs ID
          try {
            const newID = this.generateID(obj);

            report.assigned.push({
              path: path,
              name: obj.name || obj.title || "Unknown",
              newID: newID,
              series: this.detectSeries(obj) || "universal",
            });

            if (!dryRun) {
              obj.id = newID;
            }

            console.log(
              `   ${dryRun ? "→" : "✓"} ${newID} : ${obj.name || obj.title || "Unknown"}`,
            );
          } catch (error) {
            report.errors.push({
              path: path,
              name: obj.name || obj.title || "Unknown",
              error: error.message,
            });
            console.log(`   ✗ ERROR: ${obj.name} - ${error.message}`);
          }
        }
      }

      // Recurse
      if (Array.isArray(obj)) {
        obj.forEach((item, i) => assignIDsRecursive(item, `${path}[${i}]`));
      } else {
        Object.keys(obj).forEach((key) => {
          if (key !== "id") {
            // Don't recurse into ID field itself
            assignIDsRecursive(obj[key], path ? `${path}.${key}` : key);
          }
        });
      }
    };

    assignIDsRecursive(this.collections);

    return report;
  }

  saveCollections() {
    const json = JSON.stringify(this.collections, null, 2);
    fs.writeFileSync(this.collectionsPath, json, "utf-8");
    console.log(`\n✅ Сохранено: ${this.collectionsPath}`);
  }

  generateReport(report, dryRun) {
    const timestamp = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const reportsDir = path.join(__dirname, "../reports");

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, `id_migration_${timestamp}.txt`);

    let content = "";
    content += "========================================\n";
    content += `ID MIGRATION REPORT${dryRun ? " (DRY RUN)" : ""}\n`;
    content += "========================================\n\n";
    content += `Date: ${new Date().toLocaleString("ru-RU")}\n`;
    content += `Mode: ${dryRun ? "DRY RUN (no changes made)" : "APPLIED"}\n\n`;

    content += "--- SUMMARY ---\n";
    content += `Total processed: ${report.processed}\n`;
    content += `IDs assigned: ${report.assigned.length}\n`;
    content += `Skipped (already have ID): ${report.skipped.length}\n`;
    content += `Errors: ${report.errors.length}\n\n`;

    if (report.assigned.length > 0) {
      content += "--- ASSIGNED IDs ---\n";
      report.assigned.forEach((item) => {
        content += `${item.newID} : ${item.name} [${item.series}]\n`;
        content += `  Path: ${item.path}\n\n`;
      });
    }

    if (report.skipped.length > 0) {
      content += "--- SKIPPED (Already have ID) ---\n";
      report.skipped.forEach((item) => {
        content += `${item.existingID} : ${item.name}\n`;
        content += `  Path: ${item.path}\n\n`;
      });
    }

    if (report.errors.length > 0) {
      content += "--- ERRORS ---\n";
      report.errors.forEach((item) => {
        content += `ERROR: ${item.name}\n`;
        content += `  Path: ${item.path}\n`;
        content += `  Error: ${item.error}\n\n`;
      });
    }

    content += "========================================\n";
    content += "END OF REPORT\n";
    content += "========================================\n";

    fs.writeFileSync(reportPath, content, "utf-8");

    console.log(`\n📋 Отчёт создан: ${reportPath}`);

    return reportPath;
  }

  printSummary(report, dryRun) {
    console.log("\n");
    console.log("========================================");
    console.log(`ID MIGRATION ${dryRun ? "DRY RUN" : "COMPLETE"}`);
    console.log("========================================");
    console.log("\nИтоги:");
    console.log(`  📊 Обработано: ${report.processed}`);
    console.log(`  ✅ ID присвоено: ${report.assigned.length}`);
    console.log(`  ⏭️  Пропущено (уже есть ID): ${report.skipped.length}`);
    console.log(`  ❌ Ошибок: ${report.errors.length}`);

    if (report.assigned.length > 0) {
      console.log("\n✅ Присвоенные ID:");
      report.assigned.slice(0, 10).forEach((item) => {
        console.log(`   ${item.newID} → ${item.name}`);
      });
      if (report.assigned.length > 10) {
        console.log(`   ... ещё ${report.assigned.length - 10} записей`);
      }
    }

    console.log("\n");
  }
}

export default IDGenerator;
