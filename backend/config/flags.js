/**
 * Feature Flags Configuration
 *
 * Управление фича-флагами из переменных окружения
 */

const env = (key, defaultValue = "false") => process.env[key] || defaultValue;

const parseBool = (value) => String(value).toLowerCase() === "true";

/**
 * @typedef {Object} Flags
 * @property {boolean} AI_ANALYSIS - Включить AI-анализ и генерацию контента
 * @property {boolean} CRON_JOBS - Включить фоновые задачи и планировщики
 * @property {boolean} RATE_LIMIT - Включить rate limiting для API
 */

/** @type {Flags} */
export const flags = {
  AI_ANALYSIS: parseBool(env("FLAG_AI_ANALYSIS", "true")),
  CRON_JOBS: parseBool(env("FLAG_CRON_JOBS", "false")),
  RATE_LIMIT: parseBool(env("FLAG_RATE_LIMIT", "true")),
};

/**
 * Мутабельная копия флагов для runtime изменений из админки
 * @type {Flags}
 */
export const serverFlags = {
  AI_ANALYSIS: flags.AI_ANALYSIS,
  CRON_JOBS: flags.CRON_JOBS,
  RATE_LIMIT: flags.RATE_LIMIT,
};

/**
 * Проверить статус feature flag
 * @param {keyof Flags} key - Название флага
 * @returns {boolean}
 */
export function isEnabled(key) {
  return flags[key] === true;
}

/**
 * Выполнить код только если флаг включен
 * @param {keyof Flags} key - Название флага
 * @param {Function} fn - Функция для выполнения
 * @returns {*}
 */
export function ifEnabled(key, fn) {
  return isEnabled(key) ? fn() : undefined;
}

// Логирование активных флагов при старте
if (process.env.NODE_ENV !== "test") {
  console.log("[Flags] Feature flags:", flags);
}
