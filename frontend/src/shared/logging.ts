type Level = "debug" | "info" | "warn" | "error";

const API = import.meta.env.VITE_API_URL || "";
const SAMPLE = Number(import.meta.env.VITE_LOG_SAMPLE_RATE ?? 0.1);

function shouldSend(sample = SAMPLE) {
  return Math.random() < sample;
}

async function send(level: Level, message: string, data?: any) {
  try {
    if (!shouldSend()) return;
    await fetch(`${API}/api/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, message, data }),
    });
  } catch (_e) {
    /* no-op */
  }
}

export const log = {
  debug: (msg: string, data?: any) => {
    console.debug("[DEBUG]", msg, data);
    send("debug", msg, data);
  },
  info: (msg: string, data?: any) => {
    console.info("[INFO]", msg, data);
    send("info", msg, data);
  },
  warn: (msg: string, data?: any) => {
    console.warn("[WARN]", msg, data);
    send("warn", msg, data);
  },
  error: (msg: string, data?: any) => {
    console.error("[ERROR]", msg, data);
    send("error", msg, data);
  },
};

export function wireGlobalErrorHandlers() {
  window.addEventListener("error", (e) => {
    log.error("window.error", {
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
    });
  });

  window.addEventListener("unhandledrejection", (e) => {
    log.error("unhandledrejection", {
      reason: e.reason?.message || String(e.reason),
    });
  });
}
