/**
 * HAORI VISION — Edge Cache Headers Middleware (P25)
 *
 * Middleware для добавления edge-cache заголовков на основе конфигурации.
 * Поддерживает Vercel, Netlify, Cloudflare и кастомные CDN.
 *
 * Features:
 * - Автоматическое определение CDN провайдера
 * - Мержинг существующих заголовков (не перезаписывает)
 * - Логирование hits/miss/bypass
 * - Проверка exclusions (cookies, query params, headers)
 * - Поддержка stale-while-revalidate
 *
 * Usage:
 *   import { edgeCacheMiddleware } from './scripts/edge_headers';
 *   app.use(edgeCacheMiddleware);
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Request, Response, NextFunction } from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// Types
// ============================================================

interface EdgeCacheRule {
  path: string;
  ttl: number;
  stale_while_revalidate?: number;
  cache?: boolean;
  immutable?: boolean;
  priority?: string;
  description?: string;
}

interface EdgeCacheConfig {
  enabled: boolean;
  rules: EdgeCacheRule[];
  global_settings: {
    default_ttl: number;
    default_stale_while_revalidate: number;
    enable_compression: boolean;
    enable_etag: boolean;
    vary_headers: string[];
  };
  exclusions: {
    no_cache_cookies: string[];
    no_cache_query_params: string[];
    no_cache_headers: string[];
    no_cache_methods: string[];
  };
  providers: Record<string, any>;
  logging: {
    enabled: boolean;
    log_hits: boolean;
    log_misses: boolean;
    log_bypasses: boolean;
    log_path: string;
    max_entries: number;
  };
}

interface CacheLogEntry {
  timestamp: string;
  path: string;
  method: string;
  status: "HIT" | "MISS" | "BYPASS" | "STALE";
  ttl: number;
  age?: number;
  provider?: string;
}

// ============================================================
// Configuration
// ============================================================

let config: EdgeCacheConfig | null = null;
let logEntries: CacheLogEntry[] = [];

/**
 * Загружает конфигурацию из /configs/edge_cache.json
 */
function loadConfig(): EdgeCacheConfig {
  if (config) return config;

  try {
    const configPath = path.resolve(__dirname, "../configs/edge_cache.json");
    const configData = fs.readFileSync(configPath, "utf-8");
    config = JSON.parse(configData);
    console.log(
      "[EdgeCache] Configuration loaded:",
      config.rules.length,
      "rules",
    );
    return config;
  } catch (error) {
    console.error("[EdgeCache] Failed to load config:", error);
    // Fallback config
    return {
      enabled: false,
      rules: [],
      global_settings: {
        default_ttl: 60,
        default_stale_while_revalidate: 300,
        enable_compression: true,
        enable_etag: true,
        vary_headers: ["Accept-Encoding"],
      },
      exclusions: {
        no_cache_cookies: [],
        no_cache_query_params: [],
        no_cache_headers: [],
        no_cache_methods: ["POST", "PUT", "DELETE", "PATCH"],
      },
      providers: {},
      logging: {
        enabled: false,
        log_hits: false,
        log_misses: false,
        log_bypasses: false,
        log_path: "/logs/edge_cache.log",
        max_entries: 1000,
      },
    };
  }
}

/**
 * Определяет CDN провайдера по заголовкам запроса
 */
function detectProvider(req: Request): string | null {
  if (req.headers["x-vercel-id"] || req.headers["x-vercel-cache"]) {
    return "vercel";
  }
  if (req.headers["x-nf-request-id"]) {
    return "netlify";
  }
  if (req.headers["cf-ray"] || req.headers["cf-cache-status"]) {
    return "cloudflare";
  }
  return null;
}

/**
 * Проверяет, нужно ли исключить запрос из кэширования
 */
function shouldBypassCache(req: Request, config: EdgeCacheConfig): boolean {
  // HTTP метод
  if (config.exclusions.no_cache_methods.includes(req.method)) {
    return true;
  }

  // Cookies
  const cookies = req.headers.cookie || "";
  for (const cookieName of config.exclusions.no_cache_cookies) {
    if (cookies.includes(cookieName)) {
      return true;
    }
  }

  // Query параметры
  for (const param of config.exclusions.no_cache_query_params) {
    if (req.query[param]) {
      return true;
    }
  }

  // Headers
  for (const header of config.exclusions.no_cache_headers) {
    if (req.headers[header.toLowerCase()]) {
      return true;
    }
  }

  return false;
}

/**
 * Находит правило кэширования для пути
 */
function findCacheRule(
  pathname: string,
  config: EdgeCacheConfig,
): EdgeCacheRule | null {
  // Сначала ищем точное совпадение
  for (const rule of config.rules) {
    if (rule.path === pathname) {
      return rule;
    }
  }

  // Затем ищем wildcard совпадения
  for (const rule of config.rules) {
    if (rule.path.includes("*")) {
      const regex = new RegExp("^" + rule.path.replace(/\*/g, ".*") + "$");
      if (regex.test(pathname)) {
        return rule;
      }
    }
  }

  return null;
}

/**
 * Генерирует Cache-Control заголовок
 */
function generateCacheControl(
  rule: EdgeCacheRule,
  config: EdgeCacheConfig,
): string {
  if (rule.cache === false || rule.ttl === 0) {
    return "no-store, no-cache, must-revalidate, proxy-revalidate";
  }

  const parts: string[] = ["public"];

  // max-age
  parts.push(`max-age=${rule.ttl}`);

  // stale-while-revalidate
  const swr =
    rule.stale_while_revalidate ||
    config.global_settings.default_stale_while_revalidate;
  if (swr > 0) {
    parts.push(`stale-while-revalidate=${swr}`);
  }

  // immutable
  if (rule.immutable) {
    parts.push("immutable");
  }

  return parts.join(", ");
}

/**
 * Логирует событие кэширования
 */
function logCacheEvent(entry: CacheLogEntry, config: EdgeCacheConfig): void {
  if (!config.logging.enabled) return;

  // Добавляем в память
  logEntries.push(entry);

  // Ограничиваем размер лога
  if (logEntries.length > config.logging.max_entries) {
    logEntries = logEntries.slice(-config.logging.max_entries);
  }

  // Логируем в консоль
  const shouldLog =
    (entry.status === "HIT" && config.logging.log_hits) ||
    (entry.status === "MISS" && config.logging.log_misses) ||
    (entry.status === "BYPASS" && config.logging.log_bypasses);

  if (shouldLog) {
    console.log(
      `[EdgeCache] ${entry.status} ${entry.method} ${entry.path} (TTL: ${entry.ttl}s, Provider: ${entry.provider || "none"})`,
    );
  }

  // Сохраняем в файл (опционально)
  if (config.logging.log_path) {
    try {
      const logPath = path.resolve(__dirname, "..", config.logging.log_path);
      const logDir = path.dirname(logPath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      fs.appendFileSync(logPath, JSON.stringify(entry) + "\n", "utf-8");
    } catch (error) {
      console.error("[EdgeCache] Failed to write log file:", error);
    }
  }
}

/**
 * Возвращает последние N записей лога
 */
export function getRecentLogs(limit: number = 50): CacheLogEntry[] {
  return logEntries.slice(-limit);
}

/**
 * Очищает лог
 */
export function clearLogs(): void {
  logEntries = [];
  console.log("[EdgeCache] Logs cleared");
}

// ============================================================
// Middleware
// ============================================================

/**
 * Express middleware для добавления edge-cache заголовков
 */
export function edgeCacheMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const config = loadConfig();

  // Если отключено — пропускаем
  if (!config.enabled) {
    return next();
  }

  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  const provider = detectProvider(req);

  // Проверяем exclusions
  if (shouldBypassCache(req, config)) {
    logCacheEvent(
      {
        timestamp: new Date().toISOString(),
        path: pathname,
        method: req.method,
        status: "BYPASS",
        ttl: 0,
        provider: provider || undefined,
      },
      config,
    );
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("x-edge-cache", "BYPASS");
    return next();
  }

  // Находим правило
  const rule = findCacheRule(pathname, config);

  if (!rule) {
    // Используем дефолтные настройки
    const cacheControl = `public, max-age=${config.global_settings.default_ttl}, stale-while-revalidate=${config.global_settings.default_stale_while_revalidate}`;
    if (!res.getHeader("Cache-Control")) {
      res.setHeader("Cache-Control", cacheControl);
    }
    res.setHeader("x-edge-cache", "MISS");
    logCacheEvent(
      {
        timestamp: new Date().toISOString(),
        path: pathname,
        method: req.method,
        status: "MISS",
        ttl: config.global_settings.default_ttl,
        provider: provider || undefined,
      },
      config,
    );
    return next();
  }

  // Генерируем Cache-Control
  const cacheControl = generateCacheControl(rule, config);

  // Мержим с существующими заголовками (не перезаписываем)
  if (!res.getHeader("Cache-Control")) {
    res.setHeader("Cache-Control", cacheControl);
  }

  // Добавляем провайдер-специфичные заголовки
  if (provider && config.providers[provider]) {
    const providerConfig = config.providers[provider];
    if (providerConfig.enabled) {
      // Surrogate-Control (Vercel)
      if (
        providerConfig.headers.surrogate_control &&
        !res.getHeader(providerConfig.headers.surrogate_control)
      ) {
        res.setHeader(providerConfig.headers.surrogate_control, cacheControl);
      }
      // CDN-Cache-Control (Netlify)
      if (
        providerConfig.headers.cdn_cache &&
        !res.getHeader(providerConfig.headers.cdn_cache)
      ) {
        res.setHeader(providerConfig.headers.cdn_cache, cacheControl);
      }
    }
  }

  // Vary заголовок
  if (config.global_settings.vary_headers.length > 0) {
    const existingVary = res.getHeader("Vary");
    const varyValue = config.global_settings.vary_headers.join(", ");
    if (!existingVary) {
      res.setHeader("Vary", varyValue);
    } else if (
      typeof existingVary === "string" &&
      !existingVary.includes(varyValue)
    ) {
      res.setHeader("Vary", `${existingVary}, ${varyValue}`);
    }
  }

  // ETag (если включено)
  if (config.global_settings.enable_etag && !res.getHeader("ETag")) {
    // ETag будет установлен Express автоматически
  }

  // Кастомный заголовок статуса
  res.setHeader("x-edge-cache", rule.cache === false ? "BYPASS" : "HIT");
  res.setHeader("x-edge-cache-ttl", rule.ttl.toString());

  // Логируем
  logCacheEvent(
    {
      timestamp: new Date().toISOString(),
      path: pathname,
      method: req.method,
      status: rule.cache === false ? "BYPASS" : "HIT",
      ttl: rule.ttl,
      provider: provider || undefined,
    },
    config,
  );

  next();
}

/**
 * Middleware для логирования cache age (на основе заголовков CDN)
 */
export function edgeCacheAgeMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const provider = detectProvider(req);
  let age: number | undefined;

  // Vercel
  if (provider === "vercel" && req.headers["x-vercel-cache"]) {
    const cacheStatus = req.headers["x-vercel-cache"] as string;
    if (cacheStatus === "HIT" && req.headers["age"]) {
      age = parseInt(req.headers["age"] as string, 10);
    }
  }

  // Cloudflare
  if (provider === "cloudflare" && req.headers["cf-cache-status"]) {
    const cacheStatus = req.headers["cf-cache-status"] as string;
    if (cacheStatus === "HIT" && req.headers["age"]) {
      age = parseInt(req.headers["age"] as string, 10);
    }
  }

  // Netlify
  if (provider === "netlify" && req.headers["x-nf-request-id"]) {
    if (req.headers["age"]) {
      age = parseInt(req.headers["age"] as string, 10);
    }
  }

  if (age !== undefined) {
    res.setHeader("x-edge-cache-age", age.toString());
  }

  next();
}

// ============================================================
// Exports
// ============================================================

export default edgeCacheMiddleware;
export { loadConfig, detectProvider };
