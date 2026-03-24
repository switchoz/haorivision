#!/usr/bin/env node
/**
 * HAORI VISION — Edge Cache Purge Script (P25)
 *
 * Скрипт для очистки edge-cache по пути или SKU.
 * Поддерживает Vercel, Netlify, Cloudflare.
 *
 * Features:
 * - Purge по конкретному пути
 * - Purge по SKU (автоматически находит пути)
 * - Wildcard purge (очистка всех подпутей)
 * - Batch purge (несколько путей)
 * - Автоматическое определение провайдера
 *
 * Usage:
 *   node scripts/edge_purge.ts --path /catalog
 *   node scripts/edge_purge.ts --sku ECLIPSE-01
 *   node scripts/edge_purge.ts --all
 *   npm run edge:purge -- --path /catalog
 */

import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// Types
// ============================================================

interface EdgeCacheConfig {
  enabled: boolean;
  providers: {
    vercel?: {
      enabled: boolean;
      purge_endpoint: string;
      purge_token_env: string;
    };
    netlify?: {
      enabled: boolean;
      purge_endpoint: string;
      purge_token_env: string;
    };
    cloudflare?: {
      enabled: boolean;
      purge_endpoint: string;
      purge_token_env: string;
      zone_id_env: string;
    };
  };
  auto_purge?: {
    enabled: boolean;
    triggers: Array<{
      event: string;
      paths: string[];
    }>;
  };
}

interface PurgeOptions {
  paths?: string[];
  sku?: string;
  all?: boolean;
  provider?: "vercel" | "netlify" | "cloudflare" | "auto";
  dryRun?: boolean;
}

interface PurgeResult {
  success: boolean;
  provider: string;
  paths: string[];
  message?: string;
  error?: string;
}

// ============================================================
// Configuration
// ============================================================

/**
 * Загружает конфигурацию из /configs/edge_cache.json
 */
function loadConfig(): EdgeCacheConfig {
  try {
    const configPath = path.resolve(__dirname, "../configs/edge_cache.json");
    const configData = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(configData);
  } catch (error) {
    console.error("[EdgePurge] Failed to load config:", error);
    process.exit(1);
  }
}

/**
 * Определяет активный провайдер
 */
function detectProvider(config: EdgeCacheConfig): string | null {
  // Проверяем env переменные
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    return "vercel";
  }
  if (process.env.NETLIFY || process.env.NETLIFY_BUILD_BASE) {
    return "netlify";
  }
  if (process.env.CF_PAGES || process.env.CLOUDFLARE_ZONE_ID) {
    return "cloudflare";
  }

  // Проверяем, какой провайдер включен в конфиге
  if (config.providers.vercel?.enabled) return "vercel";
  if (config.providers.netlify?.enabled) return "netlify";
  if (config.providers.cloudflare?.enabled) return "cloudflare";

  return null;
}

/**
 * Преобразует SKU в пути
 */
function skuToPaths(sku: string): string[] {
  return [
    `/product/${sku}`,
    `/catalog`, // Catalog тоже нужно очистить
    `/catalog/*`, // Все страницы каталога
  ];
}

// ============================================================
// Purge Functions
// ============================================================

/**
 * Очищает кэш на Vercel
 */
async function purgeVercel(
  paths: string[],
  config: EdgeCacheConfig,
): Promise<PurgeResult> {
  const providerConfig = config.providers.vercel;
  if (!providerConfig) {
    return {
      success: false,
      provider: "vercel",
      paths: [],
      error: "Vercel config not found",
    };
  }

  const token = process.env[providerConfig.purge_token_env];
  if (!token) {
    return {
      success: false,
      provider: "vercel",
      paths: [],
      error: `Missing ${providerConfig.purge_token_env} environment variable`,
    };
  }

  const teamId = process.env.VERCEL_TEAM_ID || process.env.VERCEL_ORG_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!teamId || !projectId) {
    return {
      success: false,
      provider: "vercel",
      paths: [],
      error: "Missing VERCEL_TEAM_ID or VERCEL_PROJECT_ID",
    };
  }

  try {
    const url = `https://api.vercel.com/v1/purge?teamId=${teamId}&projectId=${projectId}`;
    const body = JSON.stringify({ paths });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        provider: "vercel",
        paths: [],
        error: `Vercel API error: ${response.status} ${errorText}`,
      };
    }

    return {
      success: true,
      provider: "vercel",
      paths,
      message: `Purged ${paths.length} paths on Vercel`,
    };
  } catch (error: any) {
    return {
      success: false,
      provider: "vercel",
      paths: [],
      error: error.message,
    };
  }
}

/**
 * Очищает кэш на Netlify
 */
async function purgeNetlify(
  paths: string[],
  config: EdgeCacheConfig,
): Promise<PurgeResult> {
  const providerConfig = config.providers.netlify;
  if (!providerConfig) {
    return {
      success: false,
      provider: "netlify",
      paths: [],
      error: "Netlify config not found",
    };
  }

  const token = process.env[providerConfig.purge_token_env];
  if (!token) {
    return {
      success: false,
      provider: "netlify",
      paths: [],
      error: `Missing ${providerConfig.purge_token_env} environment variable`,
    };
  }

  const siteId = process.env.NETLIFY_SITE_ID;
  if (!siteId) {
    return {
      success: false,
      provider: "netlify",
      paths: [],
      error: "Missing NETLIFY_SITE_ID",
    };
  }

  try {
    const url = `https://api.netlify.com/api/v1/sites/${siteId}/purge`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cache_paths: paths }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        provider: "netlify",
        paths: [],
        error: `Netlify API error: ${response.status} ${errorText}`,
      };
    }

    return {
      success: true,
      provider: "netlify",
      paths,
      message: `Purged ${paths.length} paths on Netlify`,
    };
  } catch (error: any) {
    return {
      success: false,
      provider: "netlify",
      paths: [],
      error: error.message,
    };
  }
}

/**
 * Очищает кэш на Cloudflare
 */
async function purgeCloudflare(
  paths: string[],
  config: EdgeCacheConfig,
): Promise<PurgeResult> {
  const providerConfig = config.providers.cloudflare;
  if (!providerConfig) {
    return {
      success: false,
      provider: "cloudflare",
      paths: [],
      error: "Cloudflare config not found",
    };
  }

  const token = process.env[providerConfig.purge_token_env];
  const zoneId = process.env[providerConfig.zone_id_env];

  if (!token || !zoneId) {
    return {
      success: false,
      provider: "cloudflare",
      paths: [],
      error: `Missing ${providerConfig.purge_token_env} or ${providerConfig.zone_id_env}`,
    };
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`;

    // Cloudflare требует полные URLs
    const domain = process.env.CLOUDFLARE_DOMAIN || "haorivision.com";
    const files = paths.map((p) => `https://${domain}${p}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ files }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        provider: "cloudflare",
        paths: [],
        error: `Cloudflare API error: ${response.status} ${errorText}`,
      };
    }

    return {
      success: true,
      provider: "cloudflare",
      paths,
      message: `Purged ${paths.length} paths on Cloudflare`,
    };
  } catch (error: any) {
    return {
      success: false,
      provider: "cloudflare",
      paths: [],
      error: error.message,
    };
  }
}

/**
 * Очищает кэш (автоматически определяет провайдера)
 */
async function purgeCache(options: PurgeOptions): Promise<PurgeResult> {
  const config = loadConfig();

  if (!config.enabled) {
    return {
      success: false,
      provider: "none",
      paths: [],
      error: "Edge cache is disabled in config",
    };
  }

  // Определяем пути для очистки
  let paths: string[] = [];

  if (options.all) {
    // Очищаем все основные пути
    paths = [
      "/",
      "/catalog",
      "/catalog/*",
      "/product/*",
      "/gallery",
      "/experience",
    ];
  } else if (options.sku) {
    // SKU → пути
    paths = skuToPaths(options.sku);
  } else if (options.paths) {
    paths = options.paths;
  } else {
    return {
      success: false,
      provider: "none",
      paths: [],
      error: "No paths, SKU, or --all flag provided",
    };
  }

  // Dry run
  if (options.dryRun) {
    console.log("[EdgePurge] Dry run mode — would purge:", paths);
    return {
      success: true,
      provider: "dry-run",
      paths,
      message: "Dry run completed",
    };
  }

  // Определяем провайдера
  let provider = options.provider || "auto";
  if (provider === "auto") {
    const detected = detectProvider(config);
    if (!detected) {
      return {
        success: false,
        provider: "none",
        paths: [],
        error: "No CDN provider detected or enabled",
      };
    }
    provider = detected as any;
  }

  // Вызываем purge для провайдера
  switch (provider) {
    case "vercel":
      return purgeVercel(paths, config);
    case "netlify":
      return purgeNetlify(paths, config);
    case "cloudflare":
      return purgeCloudflare(paths, config);
    default:
      return {
        success: false,
        provider: "unknown",
        paths: [],
        error: `Unknown provider: ${provider}`,
      };
  }
}

// ============================================================
// CLI
// ============================================================

async function main() {
  const args = process.argv.slice(2);

  const options: PurgeOptions = {
    paths: [],
    dryRun: false,
    provider: "auto",
  };

  // Парсим аргументы
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--path":
        if (args[i + 1]) {
          options.paths!.push(args[i + 1]);
          i++;
        }
        break;
      case "--sku":
        if (args[i + 1]) {
          options.sku = args[i + 1];
          i++;
        }
        break;
      case "--all":
        options.all = true;
        break;
      case "--provider":
        if (args[i + 1]) {
          options.provider = args[i + 1] as any;
          i++;
        }
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--help":
        console.log(`
HAORI VISION — Edge Cache Purge Script (P25)

Usage:
  node scripts/edge_purge.ts --path <path>
  node scripts/edge_purge.ts --sku <sku>
  node scripts/edge_purge.ts --all
  npm run edge:purge -- --path /catalog

Options:
  --path <path>        Purge specific path (can be used multiple times)
  --sku <sku>          Purge by product SKU (e.g., ECLIPSE-01)
  --all                Purge all main paths
  --provider <name>    Force specific provider (vercel|netlify|cloudflare|auto)
  --dry-run            Show what would be purged without actually purging
  --help               Show this help

Examples:
  node scripts/edge_purge.ts --path /catalog
  node scripts/edge_purge.ts --sku ECLIPSE-01
  node scripts/edge_purge.ts --all
  node scripts/edge_purge.ts --path /product/ECLIPSE-01 --dry-run
        `);
        process.exit(0);
    }
  }

  console.log("[EdgePurge] Starting edge cache purge...");

  const result = await purgeCache(options);

  if (result.success) {
    console.log(`✅ [EdgePurge] ${result.message}`);
    console.log(`   Provider: ${result.provider}`);
    console.log(`   Paths: ${result.paths.join(", ")}`);
    process.exit(0);
  } else {
    console.error(`❌ [EdgePurge] Failed to purge cache`);
    console.error(`   Error: ${result.error}`);
    process.exit(1);
  }
}

// ============================================================
// Run
// ============================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("[EdgePurge] Fatal error:", error);
    process.exit(1);
  });
}

// ============================================================
// Exports
// ============================================================

export { purgeCache, skuToPaths, detectProvider };
export type { PurgeOptions, PurgeResult };
