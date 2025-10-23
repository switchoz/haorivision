# HAORI VISION — Security Middleware

## Overview

Comprehensive security middleware для Express-сервера с non-destructive подходом.

**Features:**

- Security Headers (CSP, X-Frame-Options, HSTS, etc.)
- Rate Limiting (60 req/min на API, строже на auth/checkout)
- CSRF Protection (double-submit cookie pattern)
- Origin Validation
- Logging security events

## Quick Reference

### Import

```javascript
import {
  securityHeaders, // All security headers (CSP, X-Frame-Options, etc.)
  apiRateLimiter, // 60 req/min for /api/*
  authRateLimiter, // 5 req/15min for auth endpoints
  checkoutRateLimiter, // 10 req/5min for checkout
  csrfProtection, // CSRF token generation + verification
  validateOrigin, // Origin whitelist validation
  logSecurityEvent, // Log suspicious activity
} from "./middlewares/security.js";
```

### Basic Usage

```javascript
import express from "express";
import {
  securityHeaders,
  apiRateLimiter,
  csrfProtection,
} from "./middlewares/security.js";

const app = express();

// Apply security headers globally
app.use(securityHeaders);

// Rate limit API routes
app.use("/api/", apiRateLimiter);

// Protect POST forms with CSRF
app.post("/api/checkout", csrfProtection, handleCheckout);
```

## Components

### 1. Security Headers (`securityHeaders`)

Применяет comprehensive набор security headers через Helmet.

**Headers added:**

- `Content-Security-Policy` — Ограничивает источники скриптов/стилей/медиа
- `X-Frame-Options: DENY` — Запрещает embedding в iframe (защита от clickjacking)
- `X-Content-Type-Options: nosniff` — Запрещает MIME type sniffing
- `Referrer-Policy: strict-origin-when-cross-origin` — Ограничивает referrer
- `Strict-Transport-Security` — Принудительный HTTPS (HSTS)
- `X-DNS-Prefetch-Control: off` — Отключает DNS prefetch
- `X-Permitted-Cross-Domain-Policies: none` — Ограничивает cross-domain policies

**Usage:**

```javascript
app.use(securityHeaders);
```

**CSP Configuration:**

По умолчанию разрешены:

- Images/Media: `self`, `cdn.haorivision.com`, `media.haorivision.com`
- Scripts: `self`, `js.stripe.com`, Google Analytics
- Styles: `self`, `fonts.googleapis.com`
- Fonts: `self`, `fonts.gstatic.com`
- Connect: `self`, `api.haorivision.com`, WebSocket sync server, Stripe

**Customization:**

Измените allow-list в `backend/middleware/security.js`:

```javascript
const ALLOWED_CDN_DOMAINS = [
  "'self'",
  "https://cdn.haorivision.com",
  "https://your-new-cdn.com", // Добавить сюда
];
```

### 2. Rate Limiting

#### `apiRateLimiter` — Общий API rate limit

**Limits:** 60 requests/минута на IP

**Usage:**

```javascript
app.use("/api/", apiRateLimiter);
```

**Headers returned:**

- `RateLimit-Limit: 60`
- `RateLimit-Remaining: 45`
- `RateLimit-Reset: 1633024800`

**Response при превышении (429):**

```json
{
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": "60 seconds"
}
```

#### `authRateLimiter` — Auth endpoints

**Limits:** 5 requests/15 минут на IP

**Usage:**

```javascript
app.use("/api/auth/login", authRateLimiter);
app.use("/api/auth/register", authRateLimiter);
```

**Purpose:** Защита от brute force атак на логин/регистрацию

#### `checkoutRateLimiter` — Checkout/Payment

**Limits:** 10 requests/5 минут на IP

**Usage:**

```javascript
app.use("/api/checkout", checkoutRateLimiter);
app.use("/api/orders", checkoutRateLimiter);
```

**Purpose:** Защита от payment spam и fraud

**Customization:**

```javascript
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100, // Изменить лимит
  message: { error: "Custom message" },
});
```

### 3. CSRF Protection

#### Double-Submit Cookie Pattern

**How it works:**

1. Server генерирует CSRF token и устанавливает в cookie (`csrf-token`)
2. Client отправляет токен в header `X-CSRF-Token` при POST/PUT/DELETE
3. Server проверяет, что токены совпадают

#### `csrfProtection` — Combined middleware

Включает:

- `generateCsrfToken` — Генерирует токен
- `verifyCsrfToken` — Проверяет токен на POST/PUT/DELETE

**Usage:**

```javascript
import cookieParser from "cookie-parser";

app.use(cookieParser()); // Обязательно до CSRF
app.post("/api/checkout", csrfProtection, handleCheckout);
```

**Response при отсутствии токена (403):**

```json
{
  "error": "Invalid CSRF token",
  "message": "CSRF token missing or invalid. Please refresh the page and try again."
}
```

#### Backend: Endpoint для получения токена

```javascript
import { generateCsrfToken } from "./middlewares/security.js";

app.get("/api/csrf-token", generateCsrfToken, (req, res) => {
  res.json({ csrfToken: req.csrfToken });
});
```

#### Frontend: Получение и отправка токена

```typescript
// Получить токен
const response = await fetch("http://localhost:3010/api/csrf-token", {
  credentials: "include",
});
const { csrfToken } = await response.json();

// Отправить с токеном
await fetch("http://localhost:3010/api/checkout", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-CSRF-Token": csrfToken,
  },
  credentials: "include",
  body: JSON.stringify(orderData),
});
```

### 4. Origin Validation (`validateOrigin`)

Проверяет, что запросы приходят с разрешённых доменов.

**Allowed origins:**

- `http://localhost:3012` (frontend dev)
- `http://localhost:3010` (backend dev)
- `https://haorivision.com`
- `https://www.haorivision.com`
- `https://shop.haorivision.com`

**Usage:**

```javascript
app.use(validateOrigin);
```

**Response при неразрешённом origin (403):**

```json
{
  "error": "Forbidden",
  "message": "Request origin not allowed"
}
```

**Customization:**

Измените в `backend/middleware/security.js`:

```javascript
const allowedOrigins = [
  "http://localhost:3012",
  "https://your-new-domain.com", // Добавить сюда
];
```

### 5. Security Event Logging (`logSecurityEvent`)

Логирует подозрительную активность.

**Usage:**

```javascript
import { logSecurityEvent } from "./middlewares/security.js";

app.use((req, res, next) => {
  if (suspicious(req)) {
    logSecurityEvent(req, "suspicious_activity", {
      reason: "Multiple failed attempts",
      details: "User tried to access admin panel",
    });
  }
  next();
});
```

**Log format:**

```json
{
  "timestamp": "2025-10-08T16:45:00.000Z",
  "event": "suspicious_activity",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "url": "/api/admin",
  "method": "POST",
  "reason": "Multiple failed attempts"
}
```

### 6. Input Sanitization (`sanitizeInput`)

Базовая санитизация XSS (для production используйте `dompurify` или `xss`).

**Usage:**

```javascript
import { sanitizeInput } from "./middlewares/security.js";

app.post("/api/bespoke", (req, res) => {
  const name = sanitizeInput(req.body.name);
  const email = sanitizeInput(req.body.email);

  // Process sanitized input
});
```

**What it removes:**

- `<` and `>` (HTML tags)
- `javascript:` protocol
- Event handlers (`onclick=`, etc.)

## Integration Guide

### Step-by-Step Integration

#### 1. Install Dependencies

```bash
cd backend
npm install express-rate-limit helmet cookie-parser
```

#### 2. Import Middleware

```javascript
// backend/server.js
import cookieParser from "cookie-parser";
import {
  securityHeaders,
  apiRateLimiter,
  authRateLimiter,
  checkoutRateLimiter,
  csrfProtection,
  validateOrigin,
} from "./middlewares/security.js";
```

#### 3. Apply Middleware (Order Matters!)

```javascript
const app = express();

// 1. Security headers (apply first)
app.use(securityHeaders);

// 2. Origin validation (optional)
app.use(validateOrigin);

// 3. Cookie parser (needed for CSRF)
app.use(cookieParser());

// 4. Standard middleware
app.use(cors({ origin: "http://localhost:3012", credentials: true }));
app.use(express.json());

// 5. Rate limiting (per route group)
app.use("/api/", apiRateLimiter);
app.use("/api/auth/", authRateLimiter);

// 6. Routes with CSRF protection
app.get("/api/csrf-token", generateCsrfToken, (req, res) => {
  res.json({ csrfToken: req.csrfToken });
});

app.post("/api/checkout", checkoutRateLimiter, csrfProtection, handleCheckout);
app.post("/api/bespoke", csrfProtection, handleBespoke);
```

### Non-Destructive Approach

Если хотите оставить существующий middleware и добавить новый:

```javascript
// Существующий (оставляем)
app.use(helmet());
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// Новый (добавляем дополнительно)
app.use(securityHeaders); // Расширенный CSP
app.use('/api/auth/', authRateLimiter); // Строгие лимиты для auth
app.post('/api/checkout', csrfProtection, ...); // CSRF только на checkout
```

## Testing

### Manual Testing

#### Test Security Headers

```bash
curl -I http://localhost:3010/api/health
```

**Expected headers:**

- `content-security-policy: ...`
- `x-frame-options: DENY`
- `x-content-type-options: nosniff`
- `referrer-policy: strict-origin-when-cross-origin`

#### Test Rate Limiting

```bash
# Send 70 requests (should block after 60)
for i in {1..70}; do
  curl http://localhost:3010/api/health
done
```

**Expected:** После 60-го запроса вернёт `429 Too Many Requests`

#### Test CSRF Protection

```bash
# 1. Get CSRF token
TOKEN=$(curl -s http://localhost:3010/api/csrf-token | jq -r '.csrfToken')

# 2. Send POST with token (should succeed)
curl -X POST http://localhost:3010/api/bespoke \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $TOKEN" \
  -b "csrf-token=$TOKEN" \
  -d '{"name": "Test"}'

# 3. Send POST without token (should fail with 403)
curl -X POST http://localhost:3010/api/bespoke \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'
```

#### Test Origin Validation

```bash
# Allowed origin (should succeed)
curl -X POST http://localhost:3010/api/health \
  -H "Origin: http://localhost:3012"

# Disallowed origin (should fail with 403)
curl -X POST http://localhost:3010/api/health \
  -H "Origin: https://evil.com"
```

### Automated Testing

Run test suite:

```bash
# Make sure server is running
cd backend && npm start

# In another terminal
node tests/security.test.js
```

**Test coverage:**

- Security headers presence
- Rate limiting enforcement
- CSRF token generation/verification
- Origin validation
- Integration tests
- Performance tests

## Production Checklist

Before deploying to production:

- [ ] `NODE_ENV=production` environment variable set
- [ ] HTTPS enabled (Let's Encrypt)
- [ ] Cookie `secure: true` in production (checks `process.env.NODE_ENV`)
- [ ] CSP allow-list updated with production CDN domains
- [ ] Rate limits tested under expected load
- [ ] CSRF tokens working with production frontend
- [ ] Origin validation includes production domains
- [ ] Security event logging integrated with monitoring (Sentry, LogRocket)
- [ ] HSTS preload submitted (optional): https://hstspreload.org/
- [ ] Trusted IPs configured for monitoring/CI servers

## Troubleshooting

### Issue: CORS errors after adding security headers

**Solution:**

Убедитесь, что CORS применяется после security headers:

```javascript
app.use(securityHeaders);
app.use(cors({ ... })); // После security headers
```

### Issue: CSP blocks inline scripts/styles

**Option 1:** Allow unsafe-inline (not recommended):

```javascript
const ALLOWED_SCRIPT_SOURCES = ["'self'", "'unsafe-inline'"];
```

**Option 2:** Use nonce (recommended):

```javascript
import crypto from 'crypto';

app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

// В CSP:
scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`]

// В HTML:
<script nonce="<%= nonce %>">...</script>
```

### Issue: Rate limiter too aggressive

**Solution:**

Increase limits:

```javascript
export const apiRateLimiter = rateLimit({
  max: 100, // Вместо 60
  ...
});
```

Or add trusted IPs:

```javascript
skip: (req) => {
  const trustedIPs = ["127.0.0.1", "::1", "192.168.1.100"];
  return trustedIPs.includes(req.ip);
};
```

### Issue: CSRF token not working

**Solution:**

1. Ensure `cookie-parser` installed and applied before CSRF middleware
2. Frontend sends `credentials: 'include'`
3. Token sent in both cookie and header

```javascript
// Backend
app.use(cookieParser()); // BEFORE CSRF
app.use(generateCsrfToken);

// Frontend
fetch(url, {
  credentials: "include", // Important!
  headers: { "X-CSRF-Token": token },
});
```

## Advanced Configuration

### Custom CSP for Different Routes

```javascript
import helmet from "helmet";

// Stricter CSP for admin routes
const adminCSP = helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"], // No external scripts
    styleSrc: ["'self'"],
  },
});

app.use("/api/admin", adminCSP, adminRoutes);
```

### Rate Limiting by User ID (Authenticated Routes)

```javascript
import rateLimit from "express-rate-limit";

const userRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => {
    // Use user ID instead of IP
    return req.user?.id || req.ip;
  },
});

app.use("/api/user/", authenticate, userRateLimiter, userRoutes);
```

### CSRF with Session-Based Tokens (Alternative)

For production, consider using `csurf` package:

```bash
npm install csurf
```

```javascript
import csrf from "csurf";

const csrfMiddleware = csrf({ cookie: true });

app.use(csrfMiddleware);

app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

## Security Best Practices

### 1. Defense in Depth

Применяйте multiple layers:

```javascript
app.use(securityHeaders);        // Layer 1: Headers
app.use(validateOrigin);         // Layer 2: Origin check
app.use(apiRateLimiter);         // Layer 3: Rate limiting
app.post('/checkout', csrfProtection, ...); // Layer 4: CSRF
```

### 2. Least Privilege

Применяйте middleware только где нужно:

```javascript
// Public API (no CSRF)
app.get("/api/products", getProducts);

// Protected (CSRF required)
app.post("/api/checkout", csrfProtection, checkout);
```

### 3. Logging & Monitoring

Логируйте security events:

```javascript
app.use((req, res, next) => {
  if (isHighRiskRequest(req)) {
    logSecurityEvent(req, "high_risk_request", {
      reason: "Suspicious pattern detected",
    });
  }
  next();
});
```

### 4. Regular Updates

Обновляйте dependencies:

```bash
npm audit
npm update express-rate-limit helmet
```

### 5. Security Headers Testing

Используйте онлайн-инструменты:

- https://securityheaders.com/
- https://observatory.mozilla.org/

## References

- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [MDN CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)
- [CSRF Protection](https://owasp.org/www-community/attacks/csrf)

---

**HAORI VISION** — Comprehensive security with zero breaking changes.
