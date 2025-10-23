# HAORI VISION — Security Middleware Integration

## Overview

Инструкция по интеграции security middleware в существующий Express-сервер.

**Ключевые принципы:**

- Не изменяет существующие маршруты
- Добавляет новые слои безопасности
- Можно применять выборочно (per-route или globally)
- Совместим с существующим helmet() и rateLimit()

## Quick Start

### 1. Импорт Middleware

```javascript
// В начале backend/server.js
import {
  securityHeaders,
  apiRateLimiter,
  authRateLimiter,
  checkoutRateLimiter,
  csrfProtection,
  validateOrigin,
  logSecurityEvent,
} from "./middlewares/security.js";
```

### 2. Применение Security Headers (Global)

**Вариант A:** Заменить существующий `helmet()` на новый `securityHeaders`:

```javascript
// До:
app.use(helmet());

// После:
app.use(securityHeaders);
```

**Вариант B:** Добавить дополнительно (если хотите оставить существующий):

```javascript
app.use(helmet()); // Оставляем существующий
app.use(securityHeaders); // Добавляем новый с расширенным CSP
```

### 3. Применение Rate Limiting

**Замена существующего rate limiter:**

```javascript
// До:
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use("/api/", limiter);

// После (более строгий):
app.use("/api/", apiRateLimiter); // 60 req/min вместо 100 req/15min
```

**Добавление специализированных лимитов:**

```javascript
// Для аутентификации (строже)
app.use("/api/auth/login", authRateLimiter);
app.use("/api/auth/register", authRateLimiter);

// Для checkout (средняя строгость)
app.use("/api/checkout", checkoutRateLimiter);
app.use("/api/orders", checkoutRateLimiter);

// Для остальных API (стандартно)
app.use("/api/", apiRateLimiter);
```

### 4. Применение CSRF Protection

**Для конкретных POST-маршрутов:**

```javascript
// В маршрутах bespoke
app.post("/api/bespoke", csrfProtection, bespokeRoutes);

// В маршрутах checkout
app.post("/api/checkout", csrfProtection, checkoutRoutes);

// В маршрутах orders
app.post("/api/orders", csrfProtection, orderRoutes);
```

**Или применить глобально для всех POST/PUT/DELETE:**

```javascript
import { generateCsrfToken, verifyCsrfToken } from "./middlewares/security.js";
import cookieParser from "cookie-parser";

app.use(cookieParser()); // Нужен для CSRF cookies
app.use(generateCsrfToken); // Генерирует токен для всех запросов
app.use(verifyCsrfToken); // Проверяет токен на POST/PUT/DELETE
```

### 5. Валидация Origin (опционально)

```javascript
// Проверка origin для всех запросов
app.use(validateOrigin);
```

## Полный Пример Интеграции

```javascript
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./config/database.js";

// Import security middleware
import {
  securityHeaders,
  apiRateLimiter,
  authRateLimiter,
  checkoutRateLimiter,
  csrfProtection,
  validateOrigin,
} from "./middlewares/security.js";

// Import routes
import brandAnalysisRoutes from "./routes/brandAnalysis.js";
import venuesRoutes from "./routes/venues.js";
import guestsRoutes from "./routes/guests.js";
import showRoutes from "./routes/show.js";
import bespokeRoutes from "./routes/bespoke.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3010;

// Connect to MongoDB
connectDB();

// ============================================================
// Security Middleware (Apply FIRST, before routes)
// ============================================================

// 1. Security Headers (CSP, X-Frame-Options, etc.)
app.use(securityHeaders);

// 2. Origin Validation
app.use(validateOrigin);

// 3. Cookie Parser (needed for CSRF)
app.use(cookieParser());

// ============================================================
// Standard Middleware
// ============================================================

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3012",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// Rate Limiting (Apply per route group)
// ============================================================

// General API rate limit
app.use("/api/", apiRateLimiter);

// Stricter limits for authentication
app.use("/api/auth/", authRateLimiter);

// ============================================================
// Routes
// ============================================================

// Health check (no CSRF needed)
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
  });
});

// Public routes (no CSRF)
app.use("/api/brand-analysis", brandAnalysisRoutes);
app.use("/api/venues", venuesRoutes);
app.use("/api/guests", guestsRoutes);
app.use("/api/show", showRoutes);

// Protected routes (with CSRF for POST/PUT/DELETE)
app.use("/api/bespoke", csrfProtection, bespokeRoutes);
app.use("/api/checkout", checkoutRateLimiter, csrfProtection, checkoutRoutes);
app.use("/api/orders", checkoutRateLimiter, csrfProtection, orderRoutes);

// ============================================================
// Error Handling
// ============================================================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`[✓] Server running on: http://localhost:${PORT}`);
  console.log(`[🛡️] Security middleware enabled`);
});

export default app;
```

## Пошаговая Интеграция (Non-Destructive)

### Этап 1: Security Headers

```javascript
// Замените строку 38 в backend/server.js
// До:
app.use(helmet());

// После:
import { securityHeaders } from "./middlewares/security.js";
app.use(securityHeaders);
```

**Результат:**

- Content-Security-Policy с allow-list для CDN
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin
- X-Content-Type-Options: nosniff
- HSTS (Strict-Transport-Security)

### Этап 2: Rate Limiting

```javascript
// Замените строки 47-52 в backend/server.js
// До:
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use("/api/", limiter);

// После:
import {
  apiRateLimiter,
  authRateLimiter,
  checkoutRateLimiter,
} from "./middlewares/security.js";

app.use("/api/", apiRateLimiter); // 60 req/min
app.use("/api/auth/", authRateLimiter); // 5 req/15min (если есть auth routes)
```

**Результат:**

- API: 60 запросов/минуту
- Auth: 5 попыток/15 минут
- Checkout: 10 запросов/5 минут

### Этап 3: CSRF Protection

```javascript
// Добавьте после express.json() middleware
import cookieParser from "cookie-parser";
import { generateCsrfToken, verifyCsrfToken } from "./middlewares/security.js";

app.use(cookieParser());
app.use(generateCsrfToken); // Генерирует токен

// Примените на POST-маршруты
app.post("/api/bespoke", verifyCsrfToken, bespokeRoutes);
app.post("/api/checkout", verifyCsrfToken, checkoutRoutes);
```

**Результат:**

- Защита от CSRF-атак на формы заказа и checkout
- Токен в cookie + header verification

### Этап 4: Origin Validation (опционально)

```javascript
import { validateOrigin } from "./middlewares/security.js";

app.use(validateOrigin); // Применить рано, после security headers
```

**Результат:**

- Блокирует запросы с неразрешённых доменов
- Allow-list: localhost, haorivision.com

## Frontend Integration (CSRF Token)

### React/Vite Frontend

**1. Получение CSRF токена:**

```typescript
// src/utils/csrf.ts
export async function getCsrfToken(): Promise<string | null> {
  // Токен уже в cookie (httpOnly)
  // Нужно получить его через API endpoint
  const response = await fetch("http://localhost:3010/api/csrf-token", {
    credentials: "include",
  });
  const data = await response.json();
  return data.csrfToken;
}
```

**2. Добавление CSRF токена в запросы:**

```typescript
// src/utils/api.ts
import { getCsrfToken } from "./csrf";

export async function postWithCsrf(url: string, body: any) {
  const csrfToken = await getCsrfToken();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken || "",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  return response.json();
}
```

**3. Использование в компонентах:**

```typescript
// src/pages/Checkout.tsx
import { postWithCsrf } from "../utils/api";

async function handleCheckout(orderData: any) {
  try {
    const result = await postWithCsrf(
      "http://localhost:3010/api/checkout",
      orderData,
    );
    console.log("Order placed:", result);
  } catch (error) {
    console.error("Checkout failed:", error);
  }
}
```

### Backend Endpoint для CSRF Token

**Добавьте в backend/server.js:**

```javascript
import { generateCsrfToken } from "./middlewares/security.js";

// Endpoint для получения CSRF токена (GET request)
app.get("/api/csrf-token", generateCsrfToken, (req, res) => {
  res.json({
    csrfToken: req.csrfToken,
  });
});
```

## Testing Security Middleware

### Test 1: Security Headers

```bash
# Проверка CSP и других заголовков
curl -I http://localhost:3010/api/health

# Ожидаемые заголовки:
# Content-Security-Policy: ...
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Referrer-Policy: strict-origin-when-cross-origin
```

### Test 2: Rate Limiting

```bash
# Отправить 70 запросов за минуту (должен заблокировать после 60)
for i in {1..70}; do
  curl http://localhost:3010/api/health
done

# После 60-го запроса должен вернуть:
# { "error": "Too many requests from this IP, please try again later." }
```

### Test 3: CSRF Protection

```bash
# Без CSRF токена (должен вернуть 403)
curl -X POST http://localhost:3010/api/bespoke \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'

# Ожидаемый ответ:
# { "error": "Invalid CSRF token" }

# С CSRF токеном (успешно)
# 1. Получить токен
TOKEN=$(curl -s http://localhost:3010/api/csrf-token | jq -r '.csrfToken')

# 2. Отправить с токеном
curl -X POST http://localhost:3010/api/bespoke \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $TOKEN" \
  -b "csrf-token=$TOKEN" \
  -d '{"name": "Test"}'
```

### Test 4: Origin Validation

```bash
# С неразрешённого origin (должен блокировать)
curl -X POST http://localhost:3010/api/bespoke \
  -H "Origin: https://evil.com" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'

# Ожидаемый ответ:
# { "error": "Forbidden", "message": "Request origin not allowed" }
```

## Customization

### 1. Добавление CDN в CSP Allow-List

**Измените в `backend/middleware/security.js`:**

```javascript
const ALLOWED_CDN_DOMAINS = [
  "'self'",
  "https://cdn.haorivision.com",
  "https://media.haorivision.com",
  "https://your-new-cdn.com", // Добавить сюда
  "data:",
];
```

### 2. Изменение Rate Limits

**Для более строгих лимитов:**

```javascript
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30, // Вместо 60
  message: { error: "Too many requests" },
});
```

### 3. Отключение CSRF для Определённых Маршрутов

**Применить CSRF только на checkout:**

```javascript
// Без CSRF (public API)
app.use("/api/brand-analysis", brandAnalysisRoutes);

// С CSRF (protected)
app.use("/api/checkout", csrfProtection, checkoutRoutes);
```

### 4. Добавление Trusted IPs (Skip Rate Limit)

**Измените в `backend/middleware/security.js`:**

```javascript
skip: (req) => {
  const trustedIPs = [
    "127.0.0.1",
    "::1",
    "192.168.1.100", // Ваш мониторинг
    "10.0.0.5", // CI/CD сервер
  ];
  return trustedIPs.includes(req.ip);
};
```

## Security Checklist

После интеграции проверьте:

- [ ] Security headers применены (check с `curl -I`)
- [ ] Rate limiting работает на /api/\* маршрутах
- [ ] CSRF protection на POST-формах (checkout, bespoke)
- [ ] Origin validation (если требуется)
- [ ] HTTPS включён в production (для HSTS)
- [ ] Cookie secure flag включён в production
- [ ] CSP allow-list содержит все необходимые CDN
- [ ] Rate limits настроены под нагрузку
- [ ] Логирование security events работает
- [ ] Frontend интегрирован с CSRF токенами

## Troubleshooting

### Проблема: CORS ошибки после добавления security headers

**Решение:**

```javascript
// Убедитесь, что CORS применяется ПОСЛЕ security headers
app.use(securityHeaders);
app.use(cors({ origin: "http://localhost:3012", credentials: true }));
```

### Проблема: CSRF токен не работает

**Решение:**

```javascript
// 1. Убедитесь, что cookie-parser установлен
npm install cookie-parser

// 2. Применён до CSRF middleware
app.use(cookieParser());
app.use(generateCsrfToken);

// 3. Frontend отправляет credentials
fetch(url, { credentials: 'include' });
```

### Проблема: Rate limiter блокирует слишком агрессивно

**Решение:**

```javascript
// Увеличьте лимиты
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100, // Вместо 60
  ...
});
```

### Проблема: CSP блокирует inline scripts/styles

**Решение:**

```javascript
// Вариант 1: Добавить 'unsafe-inline' (не рекомендуется)
const ALLOWED_SCRIPT_SOURCES = ["'self'", "'unsafe-inline'"];

// Вариант 2: Использовать nonce (рекомендуется)
import crypto from "crypto";

app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64");
  next();
});

// В CSP:
scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`];
```

## Production Checklist

Перед деплоем:

- [ ] `NODE_ENV=production`
- [ ] HTTPS включён (Let's Encrypt)
- [ ] Cookie `secure: true` в production
- [ ] Sentry/logging настроен для security events
- [ ] Rate limits протестированы под нагрузкой
- [ ] CSP allow-list обновлён для production CDN
- [ ] CSRF токены работают с production frontend
- [ ] Origin validation включает production домены
- [ ] HSTS preload добавлен в hstspreload.org (опционально)

---

**HAORI VISION** — Non-destructive security hardening with zero breaking changes.
