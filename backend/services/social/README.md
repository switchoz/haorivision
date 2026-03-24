# Social Media Services

Автоматическая интеграция с TikTok Shop и Instagram Shopping.

## Файлы

### `tiktokService.js`

- ✅ Загрузка видео на TikTok
- ✅ Product tagging в видео
- ✅ Создание/обновление продуктов в TikTok Shop
- ✅ Получение analytics (views, likes, shares)
- ✅ Генерация hashtags

**Пример использования:**

```javascript
import tiktokService from "./tiktokService.js";

// Загрузить видео
const result = await tiktokService.uploadVideo("/path/to/video.mp4", {
  title: "Mycelium Dreams",
  description: "UV reactive haori #haorivision #wearlight",
});

// Тегировать продукт
await tiktokService.tagProductInVideo(result.publishId, tiktokProductId);
```

### `instagramService.js`

- ✅ Загрузка фото на Instagram
- ✅ Загрузка Reels с product tags
- ✅ Создание/обновление продуктов в Facebook Catalog
- ✅ Получение insights (impressions, reach, engagement)
- ✅ Генерация hashtags и captions

**Пример использования:**

```javascript
import instagramService from "./instagramService.js";

// Загрузить Reel
const result = await instagramService.uploadReel(
  "https://your-cdn.com/video.mp4", // Публичный URL!
  "Caption with #hashtags",
  [
    { productId: "catalog_id", x: 0.5, y: 0.8 }, // Product tag
  ],
);

console.log(result.permalink); // Instagram URL
```

### `autoPublisher.js`

- ✅ Автоматическая публикация из `/public/media/reels/` и `/posts/`
- ✅ Извлечение product ID из имени файла
- ✅ Публикация на обе платформы одновременно
- ✅ Синхронизация всех продуктов с магазинами
- ✅ Scheduled publishing (ежедневно в 12:00)

**Структура файлов:**

```
public/media/
├── reels/
│   └── {product-id}_reel{N}.mp4
└── posts/
    └── {product-id}_post{N}.jpg
```

**Пример:**

```
twin-001-mycelium_reel1.mp4 → продукт "twin-001-mycelium"
```

**Запуск:**

```javascript
import autoPublisher from "./autoPublisher.js";

// Опубликовать всё pending media
await autoPublisher.publishPendingMedia();

// Синхронизировать продукты
await autoPublisher.syncAllProducts();
```

## Analytics Service

**Файл:** `backend/services/analytics/analyticsService.js`

- ✅ Синхронизация статистики со всех платформ
- ✅ Агрегация данных по периодам
- ✅ Топ-performers анализ
- ✅ Статистика по продуктам

**Использование:**

```javascript
import analyticsService from "../analytics/analyticsService.js";

// Обновить статистику
await analyticsService.syncAllPostsAnalytics();

// Получить недельный отчёт
const stats = await analyticsService.getWeeklyStats();
console.log(stats.byPlatform.tiktok.totalViews);
```

## Notion Service

**Файл:** `backend/services/notionService.js`

- ✅ Создание "Glow Pulse" отчётов в Notion
- ✅ Красивое форматирование с блоками
- ✅ Автоматическая агрегация метрик

**Использование:**

```javascript
import notionService from "../notionService.js";

const weeklyStats = await analyticsService.getWeeklyStats();
const result = await notionService.createGlowPulseReport(weeklyStats);

console.log(result.url); // Notion page URL
```

## Weekly Report Scheduler

**Файл:** `backend/cron/weeklyReport.js`

- ✅ Запускается каждый понедельник в 09:00
- ✅ Синхронизирует analytics
- ✅ Создаёт отчёт в Notion
- ✅ Отправляет email администраторам

**Запуск вручную:**

```bash
node backend/cron/weeklyReport.js
```

## Environment Variables

Добавьте в `.env`:

```env
# TikTok
TIKTOK_ACCESS_TOKEN=your_token
TIKTOK_APP_KEY=your_key
TIKTOK_APP_SECRET=your_secret
TIKTOK_SHOP_ID=your_shop_id

# Instagram
INSTAGRAM_ACCESS_TOKEN=your_long_lived_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_account_id
FACEBOOK_CATALOG_ID=your_catalog_id

# Notion
NOTION_API_TOKEN=secret_xxxxx
NOTION_DATABASE_ID=your_database_id

# Admin emails
ADMIN_EMAILS=admin@haorivision.com,marketing@haorivision.com
```

## Quick Start

1. **Установить зависимости:**

   ```bash
   npm install
   ```

2. **Добавить медиа файлы:**

   ```bash
   cp video.mp4 public/media/reels/twin-001-mycelium_reel1.mp4
   ```

3. **Опубликовать:**
   ```javascript
   import autoPublisher from "./backend/services/social/autoPublisher.js";
   await autoPublisher.publishPendingMedia();
   ```

## Полная документация

См. `/SOCIAL_MEDIA_SETUP_GUIDE.md` для детальной настройки API ключей и Notion integration.
