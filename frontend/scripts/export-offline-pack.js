#!/usr/bin/env node

/**
 * 📦 EXPORT OFFLINE PACK
 *
 * Создание оффлайн-пакета для ноута на месте
 * Включает: build, assets, venues, Service Worker
 */

import { execSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = path.join(__dirname, "../..");
const outputDir = path.join(projectRoot, "offline-pack");

console.log("╔═══════════════════════════════════════════════════════════╗");
console.log("║                                                           ║");
console.log("║        HAORI VISION — OFFLINE PACK EXPORT                 ║");
console.log("║                                                           ║");
console.log("╚═══════════════════════════════════════════════════════════╝");
console.log("");

async function createOfflinePack() {
  try {
    // 1. Clean output directory
    console.log("[1/6] Cleaning output directory...");
    await fs.rm(outputDir, { recursive: true, force: true });
    await fs.mkdir(outputDir, { recursive: true });

    // 2. Build production
    console.log("[2/6] Building production bundle...");
    execSync("npm run build", {
      cwd: path.join(projectRoot, "frontend"),
      stdio: "inherit",
    });

    // 3. Copy dist
    console.log("[3/6] Copying build files...");
    const distDir = path.join(projectRoot, "frontend", "dist");
    await copyDir(distDir, path.join(outputDir, "app"));

    // 4. Copy data
    console.log("[4/6] Copying show data...");
    const dataDir = path.join(projectRoot, "data");
    await copyDir(dataDir, path.join(outputDir, "data"));

    // 5. Copy public assets
    console.log("[5/6] Copying public assets...");
    const publicDir = path.join(projectRoot, "frontend", "public");
    await copyDir(publicDir, path.join(outputDir, "app", "public"));

    // 6. Create README
    console.log("[6/6] Creating README...");
    const readme = `# HAORI VISION — Offline Pack

## Содержимое

- \`app/\` — Frontend build (HTML/CSS/JS)
- \`data/\` — Show data (timeline, venues, scripts)
- \`app/public/\` — Media assets

## Запуск

### Windows:
1. Открыть \`app/index.html\` в Chrome/Edge
2. Разрешить загрузку локальных файлов если спросит

### Linux/Mac:
\`\`\`bash
cd app
python3 -m http.server 3012
\`\`\`

Открыть: http://localhost:3012

## Режимы

- **Gallery Mode**: Интерактивный осмотр
- **Show Mode**: Автоматический timeline (5 минут)
- **Kiosk Mode**: Автоцикл без управления

## Требования

- Chrome 100+ (для Multi-Screen API)
- 4 GB RAM
- 2 GB свободного места

## Venue Profiles

В \`data/show/venues/\`:
- \`default_venue.json\` — одиночный проектор
- \`triple_wall_projection.json\` — тройная стена

Для выбора venue — открыть /admin/calibration

## Service Worker

Кэш активируется автоматически при первом запуске.
Проверить: DevTools → Application → Service Workers

## Поддержка

HAORI VISION
Email: support@haori.vision
Web: https://haori.vision

---

Created: ${new Date().toISOString()}
Version: 1.0.0
`;

    await fs.writeFile(path.join(outputDir, "README.md"), readme, "utf-8");

    // Create package.json for offline pack
    const packageJson = {
      name: "haori-vision-offline-pack",
      version: "1.0.0",
      description: "HAORI VISION — Eclipse of Light (Offline Pack)",
      scripts: {
        start: "cd app && python3 -m http.server 3012",
      },
    };

    await fs.writeFile(
      path.join(outputDir, "package.json"),
      JSON.stringify(packageJson, null, 2),
      "utf-8",
    );

    console.log("");
    console.log("[✓] Offline pack created successfully!");
    console.log("");
    console.log(`Output: ${outputDir}`);
    console.log("");
    console.log("To deploy:");
    console.log(`  1. Copy ${outputDir} to venue laptop`);
    console.log(`  2. Open app/index.html in Chrome`);
    console.log("  3. Load venue profile in /admin/calibration");
    console.log("");
  } catch (error) {
    console.error("[!] Export failed:", error);
    process.exit(1);
  }
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

createOfflinePack();
