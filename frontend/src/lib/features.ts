/**
 * HAORI VISION — Feature Flags Library (P27)
 *
 * Централизованная система управления feature flags.
 * Читает конфигурацию из features.json и environment variables.
 *
 * Features:
 * - JSON конфигурация + .env override
 * - Dependency checking
 * - Environment-specific overrides
 * - LocalStorage overrides (для разработки)
 * - TypeScript типизация
 *
 * Usage:
 *   import { getFeature, isFeatureEnabled } from '@/lib/features';
 *
 *   if (isFeatureEnabled('LAZY_HYDRATION')) {
 *     // Код для lazy hydration
 *   }
 */

// ============================================================
// Types
// ============================================================

export interface FeatureConfig {
  enabled: boolean;
  description: string;
  category: string;
  added: string;
  dependencies: string[];
  env_override?: string;
}

export interface FeaturesConfig {
  version: string;
  description: string;
  last_updated: string;
  features: Record<string, FeatureConfig>;
  categories: Record<
    string,
    {
      name: string;
      description: string;
      icon: string;
    }
  >;
  environments: {
    development: EnvironmentConfig;
    staging: EnvironmentConfig;
    production: EnvironmentConfig;
  };
  meta: {
    total_features: number;
    enabled_features: number;
    disabled_features: number;
    author: string;
    project: string;
  };
}

export interface EnvironmentConfig {
  override_all: boolean;
  force_enabled: string[];
  force_disabled: string[];
}

export type FeatureName =
  | "LAZY_HYDRATION"
  | "EDGE_CACHE"
  | "MICROCOPY_AB"
  | "PERF_PRELOADS"
  | "RELIABILITY_KIT"
  | "CSP_HEADERS"
  | "UTM_TRACKING"
  | "AB_CTA"
  | "WHOLESALE_PRICING"
  | "BESPOKE_SLOTS"
  | "PRODUCT_VIDEOS"
  | "GALLERY_3D"
  | "SOCIAL_SHARING"
  | "NEWSLETTER"
  | "LIVE_CHAT"
  | "DARK_MODE"
  | "EXPERIMENTAL_ANIMATIONS";

// ============================================================
// Configuration
// ============================================================

let configCache: FeaturesConfig | null = null;
let configLoadPromise: Promise<FeaturesConfig> | null = null;

const LOCAL_STORAGE_KEY = "haori_feature_flags_override";
const CONFIG_URL = "/configs/features.json";

// ============================================================
// Environment Detection
// ============================================================

/**
 * Определяет текущее окружение
 */
function getCurrentEnvironment(): "development" | "staging" | "production" {
  if (typeof window === "undefined") {
    return "production";
  }

  const hostname = window.location.hostname;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "development";
  }

  if (hostname.includes("staging") || hostname.includes("preview")) {
    return "staging";
  }

  return "production";
}

// ============================================================
// Configuration Loading
// ============================================================

/**
 * Загружает конфигурацию из JSON файла
 */
async function loadConfig(): Promise<FeaturesConfig> {
  // Если уже загружено — возвращаем из кэша
  if (configCache) {
    return configCache;
  }

  // Если загрузка уже в процессе — ждем её завершения
  if (configLoadPromise) {
    return configLoadPromise;
  }

  // Запускаем загрузку
  configLoadPromise = (async () => {
    try {
      const response = await fetch(CONFIG_URL);
      if (!response.ok) {
        throw new Error(`Failed to load features config: ${response.status}`);
      }
      const config: FeaturesConfig = await response.json();
      configCache = config;
      console.log(
        "[Features] Configuration loaded:",
        config.meta.total_features,
        "features",
      );
      return config;
    } catch (error) {
      console.error("[Features] Failed to load config:", error);
      // Fallback config
      return createFallbackConfig();
    }
  })();

  return configLoadPromise;
}

/**
 * Создает fallback конфигурацию (если загрузка не удалась)
 */
function createFallbackConfig(): FeaturesConfig {
  return {
    version: "1.0.0",
    description: "Fallback configuration",
    last_updated: new Date().toISOString(),
    features: {
      LAZY_HYDRATION: {
        enabled: true,
        description: "Lazy Hydration",
        category: "performance",
        added: "2025-10-17",
        dependencies: [],
      },
      EDGE_CACHE: {
        enabled: true,
        description: "Edge Cache",
        category: "performance",
        added: "2025-10-17",
        dependencies: [],
      },
      MICROCOPY_AB: {
        enabled: true,
        description: "Microcopy A/B",
        category: "optimization",
        added: "2025-10-17",
        dependencies: [],
      },
    },
    categories: {},
    environments: {
      development: {
        override_all: false,
        force_enabled: [],
        force_disabled: [],
      },
      staging: { override_all: false, force_enabled: [], force_disabled: [] },
      production: {
        override_all: false,
        force_enabled: [],
        force_disabled: [],
      },
    },
    meta: {
      total_features: 3,
      enabled_features: 3,
      disabled_features: 0,
      author: "Claude Code",
      project: "HAORI VISION",
    },
  };
}

// ============================================================
// Environment Variable Overrides
// ============================================================

/**
 * Проверяет override из environment variables
 */
function getEnvOverride(
  featureName: string,
  config: FeatureConfig,
): boolean | null {
  if (!config.env_override) return null;

  // Vite environment variables
  const envKey = config.env_override;
  const envValue = import.meta.env?.[envKey];

  if (envValue === undefined) return null;

  // Преобразуем в boolean
  if (
    envValue === "true" ||
    envValue === "1" ||
    envValue === 1 ||
    envValue === true
  ) {
    return true;
  }

  if (
    envValue === "false" ||
    envValue === "0" ||
    envValue === 0 ||
    envValue === false
  ) {
    return false;
  }

  return null;
}

// ============================================================
// LocalStorage Overrides
// ============================================================

/**
 * Получает override из localStorage (для разработки/тестирования)
 */
function getLocalStorageOverride(featureName: string): boolean | null {
  if (typeof window === "undefined") return null;

  try {
    const overrides = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!overrides) return null;

    const parsed = JSON.parse(overrides);
    if (featureName in parsed) {
      return Boolean(parsed[featureName]);
    }
  } catch (error) {
    console.error("[Features] Failed to read localStorage override:", error);
  }

  return null;
}

/**
 * Устанавливает override в localStorage
 */
export function setFeatureOverride(
  featureName: string,
  enabled: boolean,
): void {
  if (typeof window === "undefined") return;

  try {
    const overrides = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = overrides ? JSON.parse(overrides) : {};
    parsed[featureName] = enabled;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
    console.log(`[Features] Override set: ${featureName} = ${enabled}`);
  } catch (error) {
    console.error("[Features] Failed to set localStorage override:", error);
  }
}

/**
 * Очищает override из localStorage
 */
export function clearFeatureOverride(featureName: string): void {
  if (typeof window === "undefined") return;

  try {
    const overrides = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!overrides) return;

    const parsed = JSON.parse(overrides);
    delete parsed[featureName];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
    console.log(`[Features] Override cleared: ${featureName}`);
  } catch (error) {
    console.error("[Features] Failed to clear localStorage override:", error);
  }
}

/**
 * Очищает все overrides
 */
export function clearAllFeatureOverrides(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    console.log("[Features] All overrides cleared");
  } catch (error) {
    console.error("[Features] Failed to clear all overrides:", error);
  }
}

// ============================================================
// Environment-Specific Overrides
// ============================================================

/**
 * Применяет environment-specific overrides
 */
function applyEnvironmentOverrides(
  featureName: string,
  enabled: boolean,
  config: FeaturesConfig,
): boolean {
  const env = getCurrentEnvironment();
  const envConfig = config.environments[env];

  if (!envConfig) return enabled;

  // Force enabled
  if (envConfig.force_enabled.includes(featureName)) {
    return true;
  }

  // Force disabled
  if (envConfig.force_disabled.includes(featureName)) {
    return false;
  }

  // Override all
  if (envConfig.override_all) {
    return false; // По умолчанию выключаем все при override_all
  }

  return enabled;
}

// ============================================================
// Dependency Checking
// ============================================================

/**
 * Проверяет зависимости feature
 */
function checkDependencies(
  featureName: string,
  config: FeaturesConfig,
  checkedFeatures = new Set<string>(),
): boolean {
  // Предотвращаем циклические зависимости
  if (checkedFeatures.has(featureName)) {
    console.warn(`[Features] Circular dependency detected: ${featureName}`);
    return false;
  }

  checkedFeatures.add(featureName);

  const feature = config.features[featureName];
  if (!feature) return true;

  if (!feature.dependencies || feature.dependencies.length === 0) {
    return true;
  }

  // Проверяем все зависимости
  for (const dep of feature.dependencies) {
    const depFeature = config.features[dep];
    if (!depFeature) {
      console.warn(`[Features] Missing dependency: ${dep} for ${featureName}`);
      return false;
    }

    // Рекурсивно проверяем зависимости
    if (!checkDependencies(dep, config, checkedFeatures)) {
      return false;
    }

    // Проверяем что зависимость включена
    if (!depFeature.enabled) {
      console.warn(`[Features] Disabled dependency: ${dep} for ${featureName}`);
      return false;
    }
  }

  return true;
}

// ============================================================
// Core Functions
// ============================================================

/**
 * Получает конфигурацию feature
 */
export async function getFeature(
  featureName: string,
): Promise<FeatureConfig | null> {
  const config = await loadConfig();
  return config.features[featureName] || null;
}

/**
 * Проверяет, включен ли feature
 */
export async function isFeatureEnabled(featureName: string): Promise<boolean> {
  const config = await loadConfig();
  const feature = config.features[featureName];

  if (!feature) {
    console.warn(`[Features] Unknown feature: ${featureName}`);
    return false;
  }

  // 1. LocalStorage override (highest priority)
  const localOverride = getLocalStorageOverride(featureName);
  if (localOverride !== null) {
    console.log(
      `[Features] ${featureName} = ${localOverride} (localStorage override)`,
    );
    return localOverride;
  }

  // 2. Environment variable override
  const envOverride = getEnvOverride(featureName, feature);
  if (envOverride !== null) {
    console.log(`[Features] ${featureName} = ${envOverride} (env override)`);
    return envOverride;
  }

  // 3. Environment-specific override
  let enabled = feature.enabled;
  enabled = applyEnvironmentOverrides(featureName, enabled, config);

  // 4. Dependency check
  if (enabled) {
    enabled = checkDependencies(featureName, config);
  }

  return enabled;
}

/**
 * Синхронная версия isFeatureEnabled (использует кэш)
 */
export function isFeatureEnabledSync(featureName: string): boolean {
  if (!configCache) {
    console.warn("[Features] Config not loaded yet, using default: false");
    return false;
  }

  const feature = configCache.features[featureName];
  if (!feature) {
    return false;
  }

  // LocalStorage override
  const localOverride = getLocalStorageOverride(featureName);
  if (localOverride !== null) {
    return localOverride;
  }

  // Environment variable override
  const envOverride = getEnvOverride(featureName, feature);
  if (envOverride !== null) {
    return envOverride;
  }

  // Environment-specific override
  let enabled = feature.enabled;
  enabled = applyEnvironmentOverrides(featureName, enabled, configCache);

  // Dependency check
  if (enabled) {
    enabled = checkDependencies(featureName, configCache);
  }

  return enabled;
}

/**
 * Получает все features
 */
export async function getAllFeatures(): Promise<Record<string, FeatureConfig>> {
  const config = await loadConfig();
  return config.features;
}

/**
 * Получает enabled features
 */
export async function getEnabledFeatures(): Promise<string[]> {
  const config = await loadConfig();
  const enabled: string[] = [];

  for (const [name, feature] of Object.entries(config.features)) {
    if (await isFeatureEnabled(name)) {
      enabled.push(name);
    }
  }

  return enabled;
}

// ============================================================
// Initialization
// ============================================================

/**
 * Инициализирует feature flags (вызывается при старте приложения)
 */
export async function initFeatureFlags(): Promise<void> {
  console.log("[Features] Initializing feature flags...");
  await loadConfig();
  const enabled = await getEnabledFeatures();
  console.log("[Features] Enabled features:", enabled.join(", "));
}

// Auto-init в браузере
if (typeof window !== "undefined") {
  initFeatureFlags();
}

// ============================================================
// Exports
// ============================================================

export default {
  getFeature,
  isFeatureEnabled,
  isFeatureEnabledSync,
  getAllFeatures,
  getEnabledFeatures,
  setFeatureOverride,
  clearFeatureOverride,
  clearAllFeatureOverrides,
  initFeatureFlags,
};
