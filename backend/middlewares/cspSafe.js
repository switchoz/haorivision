import fs from "fs";
import path from "path";
import helmet from "helmet";

const CONFIG_PATH = path.join(process.cwd(), "backend", "configs", "csp.json");

export default function cspSafe() {
  let cfg = {
    reportOnly: false,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "blob:"],
      "font-src": ["'self'", "data:"],
      "connect-src": ["'self'"],
      "frame-src": ["'self'"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
    },
  };
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
      cfg = JSON.parse(raw);
    } else {
      console.warn("[CSP] configs/csp.json not found — using safe fallback");
    }
  } catch (e) {
    console.warn("[CSP] invalid config — using safe fallback", e?.message);
  }
  return helmet.contentSecurityPolicy({
    directives: cfg.directives,
    reportOnly: cfg.reportOnly,
  });
}
