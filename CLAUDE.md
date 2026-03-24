# HAORI VISION — Project Instructions

## Общие правила

- Общайся на русском
- **Не меняй порты!** Frontend: **3012**, Backend: **3010**
- Не изменяй существующие формы и эндпоинты без явного запроса

## Проект

HAORI VISION — e-commerce платформа носимого светового искусства.
Художник **Елизавета Федькина (LiZa)** — основной и единственный художник бренда.
Каждое хаори расписано вручную UV-реактивными красками.

### Стек

- **Frontend:** React 19 + Vite 7 + TailwindCSS 4 + Framer Motion + Three.js (@react-three/fiber)
- **Backend:** Express + MongoDB (Mongoose) + Stripe + Anthropic Claude SDK
- **Порты:** Frontend 3012, Backend 3010, WebSocket 8080

### Запуск

```bash
cd C:\haorivision\backend && PORT=3010 node server.js
cd C:\haorivision\frontend && npx vite --port 3012 --host
```

### Ключевые директории

```
frontend/src/pages/        — страницы (Home, Shop, About, Contact, Checkout, Haori3DStudio, ARTryOn...)
frontend/src/components/   — компоненты (HikariChat, HaoriModelViewer, Footer, Navigation...)
frontend/public/artist/    — 84 фото художника из PDF портфолио
backend/routes/            — API роуты (products, orders, chat, contact, telegram, haori3d, payments, bespoke...)
backend/models/            — Mongoose модели (Product, Order, Customer, TelegramPost...)
backend/services/          — Бизнес-логика (telegramBotService, emailService, paymentService...)
backend/cron/              — Cron задачи (telegramAutoPost, aiDirector, aiFeedbackLoop...)
data/artist.json           — Структурированные данные художника
```

### Важные решения (не менять без запроса)

- **NFT/blockchain/OpenSea** — полностью удалены из проекта. Не добавлять обратно.
- **Сертификат подлинности** — заменён на "подпись художника LiZa"
- **Токио/студия** — заменено на "мастерская художника в Москве" (домашняя мастерская)
- **Картины/холст/Twin Artwork** — пока убраны. Только хаори. В будущем будет функция с картинами.
- **Telegram Bot** — интегрирован (routes, cron autopost, miniapp, webhook)
- **Hikari Chat** — подключён к Claude API (backend/routes/chat.js)
- **Contact форма** — подключена к backend (отправка email)
- **Checkout** — подключён к /api/orders (реальные заказы в MongoDB)
- **3D Studio** — /3d-studio, загрузка фото хаори → 3D визуализация (HaoriModelViewer)
- **Stripe** — PaymentIntent endpoint + webhook обновляет Order в БД

### Production-ready фиксы (уже сделаны)

- XSS санитизация в contact.js (escapeHtml)
- Compression middleware (gzip)
- Rate-limit на /api/contact, /api/chat, /api/telegram/generate (10 req/15min)
- CORS whitelist (не hardcoded localhost)
- Database indexes (Order, Product, Customer)
- SEO meta tags + Open Graph в index.html
- Stripe webhook обновляет Order status в БД

### .env (backend) — что нужно заполнить для production

```
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID
ANTHROPIC_API_KEY
JWT_SECRET, SESSION_SECRET
EMAIL_HOST, EMAIL_PASSWORD
VK_APP_ID, YANDEX_CLIENT_ID (OAuth)
```

## Безопасность

- Соблюдай robots.txt и права авторов
- Ограничь частоту запросов (rate-limit)
- Очисти HTML (XSS-safe)
- Веди лог аудита
