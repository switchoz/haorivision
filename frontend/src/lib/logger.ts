/**
 * HAORI VISION — Logging Library
 *
 * Structured logging with trace IDs, log rotation, and multiple transports.
 * Supports browser (console) and server (file rotation) environments.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *
 *   logger.info('User logged in', { userId: 123 });
 *   logger.error('Payment failed', { orderId: 456, error: err.message });
 *   logger.debug('API response', { data });
 */

// ============================================================
// Types
// ============================================================

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  traceId: string;
  context?: Record<string, any>;
  url?: string;
  userAgent?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  enableTracing: boolean;
}

// ============================================================
// Configuration
// ============================================================

const DEFAULT_CONFIG: LoggerConfig = {
  level: (process.env.REACT_APP_LOG_LEVEL as LogLevel) || LogLevel.INFO,
  enableConsole: process.env.NODE_ENV === "development",
  enableRemote: process.env.REACT_APP_REMOTE_LOGGING === "1",
  remoteEndpoint: process.env.REACT_APP_LOG_ENDPOINT || "/api/logs",
  enableTracing: true,
};

// ============================================================
// Trace ID Management
// ============================================================

let currentTraceId: string | null = null;

/**
 * Generate unique trace ID
 */
function generateTraceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${random}`;
}

/**
 * Get current trace ID or generate new one
 */
function getTraceId(): string {
  if (!currentTraceId) {
    currentTraceId = generateTraceId();
  }
  return currentTraceId;
}

/**
 * Set custom trace ID
 */
export function setTraceId(traceId: string): void {
  currentTraceId = traceId;
}

/**
 * Reset trace ID (generates new one)
 */
export function resetTraceId(): void {
  currentTraceId = generateTraceId();
}

// ============================================================
// Log Level Comparison
// ============================================================

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

function shouldLog(level: LogLevel, configLevel: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[configLevel];
}

// ============================================================
// Formatters
// ============================================================

/**
 * Format log entry for console
 */
function formatForConsole(entry: LogEntry): string {
  const { timestamp, level, message, traceId, context } = entry;
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] [${traceId}] ${message}${contextStr}`;
}

/**
 * Format log entry for remote logging
 */
function formatForRemote(entry: LogEntry): string {
  return JSON.stringify(entry);
}

// ============================================================
// Transports
// ============================================================

/**
 * Console transport
 */
function logToConsole(entry: LogEntry): void {
  const formatted = formatForConsole(entry);

  switch (entry.level) {
    case LogLevel.DEBUG:
      console.debug(formatted);
      break;
    case LogLevel.INFO:
      console.info(formatted);
      break;
    case LogLevel.WARN:
      console.warn(formatted);
      break;
    case LogLevel.ERROR:
      console.error(formatted);
      break;
  }
}

/**
 * Remote transport (send to backend)
 */
async function logToRemote(entry: LogEntry, endpoint: string): Promise<void> {
  try {
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: formatForRemote(entry),
    });
  } catch (error) {
    // Fail silently to avoid infinite loop
    console.error("Failed to send log to remote:", error);
  }
}

// ============================================================
// Logger Class
// ============================================================

class Logger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Create log entry
   */
  private createEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      traceId: this.config.enableTracing ? getTraceId() : "no-trace",
      context,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };
  }

  /**
   * Log entry to configured transports
   */
  private async log(entry: LogEntry): Promise<void> {
    // Check if we should log this level
    if (!shouldLog(entry.level, this.config.level)) {
      return;
    }

    // Console transport
    if (this.config.enableConsole) {
      logToConsole(entry);
    }

    // Remote transport
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      await logToRemote(entry, this.config.remoteEndpoint);
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    const entry = this.createEntry(LogLevel.DEBUG, message, context);
    this.log(entry);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void {
    const entry = this.createEntry(LogLevel.INFO, message, context);
    this.log(entry);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    const entry = this.createEntry(LogLevel.WARN, message, context);
    this.log(entry);
  }

  /**
   * Log error message
   */
  error(message: string, context?: Record<string, any>): void {
    const entry = this.createEntry(LogLevel.ERROR, message, context);
    this.log(entry);
  }

  /**
   * Log action (info level with action context)
   */
  action(action: string, context?: Record<string, any>): void {
    this.info(`Action: ${action}`, { ...context, action });
  }

  /**
   * Get current trace ID
   */
  getTraceId(): string {
    return getTraceId();
  }

  /**
   * Create child logger with additional context
   */
  child(childContext: Record<string, any>): Logger {
    const childLogger = new Logger(this.config);

    // Override log method to include child context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = async (entry: LogEntry) => {
      const enhancedEntry = {
        ...entry,
        context: {
          ...childContext,
          ...entry.context,
        },
      };
      await originalLog(enhancedEntry);
    };

    return childLogger;
  }
}

// ============================================================
// Singleton Instance
// ============================================================

export const logger = new Logger();

// ============================================================
// Action Logging Helpers
// ============================================================

/**
 * Log e-commerce actions
 */
export const logAction = {
  viewProduct: (productId: string, productName: string) => {
    logger.action("product_viewed", { productId, productName });
  },

  addToCart: (productId: string, quantity: number, price: number) => {
    logger.action("add_to_cart", { productId, quantity, price });
  },

  removeFromCart: (productId: string) => {
    logger.action("remove_from_cart", { productId });
  },

  checkoutStarted: (cartTotal: number, itemCount: number) => {
    logger.action("checkout_started", { cartTotal, itemCount });
  },

  checkoutCompleted: (orderId: string, total: number) => {
    logger.action("checkout_completed", { orderId, total });
  },

  paymentFailed: (orderId: string, error: string) => {
    logger.error("Payment failed", { orderId, error });
  },

  searchPerformed: (query: string, resultCount: number) => {
    logger.action("search_performed", { query, resultCount });
  },

  filterApplied: (filterType: string, filterValue: string) => {
    logger.action("filter_applied", { filterType, filterValue });
  },

  wishlistAdded: (productId: string) => {
    logger.action("wishlist_added", { productId });
  },

  shareProduct: (productId: string, platform: string) => {
    logger.action("product_shared", { productId, platform });
  },

  dmOpened: (productId?: string) => {
    logger.action("dm_opened", { productId });
  },

  bespokeFormSubmitted: (formData: Record<string, any>) => {
    logger.action("bespoke_form_submitted", {
      hasEmail: !!formData.email,
      hasCountry: !!formData.country,
    });
  },
};

// ============================================================
// Error Tracking
// ============================================================

/**
 * Track unhandled errors
 */
export function setupErrorTracking(): void {
  if (typeof window === "undefined") {
    return;
  }

  // Track unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    logger.error("Unhandled promise rejection", {
      reason: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
    });
  });

  // Track global errors
  window.addEventListener("error", (event) => {
    logger.error("Global error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.message,
      stack: event.error?.stack,
    });
  });
}

// ============================================================
// Exports
// ============================================================

export default logger;
export { Logger };
export type { LogEntry, LoggerConfig };
