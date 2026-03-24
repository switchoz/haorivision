# 🤖 Idea Crawler Scheduler

Система автоматического мониторинга и обновления идей из внешних источников.

## Возможности

### ✅ Ежедневный re-crawl

- Автоматическая проверка изменений каждую ночь в 3:00 AM
- Обновление статусов идей без ручного вмешательства
- Rate-limiting для соблюдения этики парсинга

### 🔍 Отслеживание изменений

Система отслеживает изменения в:

- **Evidence Level** (уровень доказательств)
- **Certainty Level** (уровень уверенности)
- **Описание** (текстовое содержание)
- **Изображения** (добавление/удаление)
- **Заголовок** страницы

### 📬 Уведомления

Автоматические уведомления при:

- Значимых изменениях (high-severity)
- Изменении уровней доказательств
- Изменении статуса идеи
- Подтверждении/опровержении активной позиции

### 🔒 Безопасность и этика

- ✅ Проверка `robots.txt` перед каждым запросом
- ✅ Rate-limiting (2 секунды между запросами)
- ✅ XSS-защита (очистка HTML)
- ✅ Audit log всех операций
- ✅ Retry логика при ошибках
- ✅ User-Agent идентификация

---

## Использование

### Запуск вручную (для тестирования)

```bash
# Разовый запуск
node backend/schedulers/ideaCrawler.js --run-now

# Запуск scheduler (ждёт 3:00 AM)
node backend/schedulers/ideaCrawler.js
```

### Настройка Cron (Linux/Mac)

```bash
# Редактировать crontab
crontab -e

# Добавить строку (запуск каждый день в 3:00 AM)
0 3 * * * /usr/bin/node /path/to/haorivision/backend/schedulers/ideaCrawler.js >> /var/log/haori-crawler.log 2>&1
```

### Windows Task Scheduler

1. Открыть Task Scheduler
2. Create Basic Task → "HAORI Idea Crawler"
3. Trigger: Daily, 3:00 AM
4. Action: Start a program
   - Program: `node.exe`
   - Arguments: `C:\haorivision\backend\schedulers\ideaCrawler.js`
5. Save

### PM2 (рекомендуется для production)

```bash
# Установить PM2
npm install -g pm2

# Запустить scheduler
pm2 start backend/schedulers/ideaCrawler.js --name "haori-crawler"

# Автозапуск при перезагрузке
pm2 startup
pm2 save

# Мониторинг
pm2 logs haori-crawler
pm2 monit
```

---

## Конфигурация

### Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/haorivision

# Rate Limiting
CRAWLER_RATE_LIMIT=2000  # ms between requests (default: 2000)
CRAWLER_MAX_RETRIES=3    # max retry attempts (default: 3)

# Notifications (optional)
NOTIFICATION_EMAIL=admin@haorivision.com
NOTIFICATION_SLACK_WEBHOOK=https://hooks.slack.com/...
```

### Настройки в коде

```javascript
// backend/schedulers/ideaCrawler.js

// Изменить расписание (cron format)
const CRON_SCHEDULE = "0 3 * * *"; // 3:00 AM daily

// Частота запросов
const RATE_LIMIT_DELAY = 2000; // 2 секунды

// Количество повторов при ошибках
const MAX_RETRIES = 3;

// Путь к audit log
const AUDIT_LOG_PATH = "../../data/logs/crawler-audit.log";
```

---

## Примеры использования

### 1. Разовый тест

```bash
# Запустить сейчас и выйти
node backend/schedulers/ideaCrawler.js --run-now
```

**Вывод:**

```
======================================================================
🔄 HAORI VISION — Idea Crawler Started
======================================================================
✅ Connected to MongoDB
📊 Found 15 ideas to crawl

🔍 Crawling: https://example.com/idea-1
✅ Updated (2 changes)

🔍 Crawling: https://example.com/idea-2
✓ No changes

...

======================================================================
✅ CRAWLER TASK COMPLETED
======================================================================
📊 Summary:
   Total ideas: 15
   Updated: 3
   Unchanged: 11
   Failed: 1
======================================================================
```

### 2. Постоянный мониторинг

```bash
# Запустить как фоновый процесс
nohup node backend/schedulers/ideaCrawler.js &

# Или с PM2
pm2 start backend/schedulers/ideaCrawler.js --name haori-crawler
```

### 3. Мониторинг логов

```bash
# Просмотр audit log
tail -f data/logs/crawler-audit.log
```

**Пример лога:**

```
[2025-10-08T06:30:00.123Z] [START] Crawler task initiated
[2025-10-08T06:30:01.456Z] [CRAWL] https://example.com/idea-1 - Changes detected
[2025-10-08T06:30:01.789Z] [NOTIFICATION] High-severity changes for https://example.com/idea-1
[2025-10-08T06:30:03.012Z] [CRAWL] https://example.com/idea-2 - No changes
[2025-10-08T06:30:05.234Z] [SKIP] robots.txt disallows crawling: https://blocked.com/page
[2025-10-08T06:30:07.456Z] [ERROR] Failed to crawl https://timeout.com: ETIMEDOUT
[2025-10-08T06:30:10.789Z] [COMPLETE] Crawler task finished - Updated: 3, Unchanged: 11, Failed: 1
```

---

## Структура данных

### Idea Model (пример)

```javascript
{
  _id: "507f1f77bcf86cd799439011",
  url: "https://example.com/research-paper",
  title: "New Evidence for Light-Reactive Materials",
  description: "Research shows...",
  evidenceLevel: 3,      // 1-5 scale
  certaintyLevel: 4,     // 1-5 scale
  images: [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  status: "active",
  lastCrawled: "2025-10-08T03:00:00.000Z",
  crawlHistory: [
    {
      date: "2025-10-08T03:00:00.000Z",
      changes: [
        {
          field: "evidenceLevel",
          oldValue: 2,
          newValue: 3,
          severity: "high"
        }
      ]
    }
  ],
  addedBy: "user_id_123",
  createdAt: "2025-10-01T12:00:00.000Z",
  updatedAt: "2025-10-08T03:00:00.000Z"
}
```

### Change Object

```javascript
{
  field: "evidenceLevel",
  oldValue: 2,
  newValue: 3,
  severity: "high"  // low | medium | high
}
```

### Notification Object

```javascript
{
  title: "⚠️ Idea Updated: New Evidence for Light-Reactive Materials",
  message: "Significant changes detected:\n\n- evidenceLevel: 2 → 3\n\nURL: https://example.com/...",
  ideaId: "507f1f77bcf86cd799439011",
  timestamp: "2025-10-08T03:00:00.000Z"
}
```

---

## Безопасность

### Robots.txt Compliance

```javascript
// Автоматическая проверка перед каждым запросом
async function checkRobotsTxt(url) {
  const robotsUrl = `${protocol}//${host}/robots.txt`;
  const robots = robotsParser(robotsUrl, robotsContent);
  return robots.isAllowed(url, "HaoriVisionBot");
}
```

**Пример robots.txt:**

```
User-agent: HaoriVisionBot
Disallow: /private/
Disallow: /api/
Crawl-delay: 2
```

### Rate Limiting

```javascript
// 2 секунды между запросами
const RATE_LIMIT_DELAY = 2000;

for (const idea of ideas) {
  await sleep(RATE_LIMIT_DELAY);
  await crawlIdea(idea);
}
```

### XSS Protection

```javascript
// Удаление опасных элементов
$("script, iframe, object, embed").remove();

// Очистка текста
function sanitizeText(text) {
  return text
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&[^;]+;/g, "") // Remove entities
    .trim()
    .substring(0, 1000); // Limit length
}
```

### Audit Logging

```javascript
// Каждое действие логируется
auditLog("[CRAWL] https://example.com - Changes detected");
auditLog("[SKIP] robots.txt disallows: https://blocked.com");
auditLog("[ERROR] Failed to crawl: ETIMEDOUT");
```

**Формат лога:**

```
[ISO-8601-TIMESTAMP] [LEVEL] Message
```

---

## Настройка уведомлений

### 1. Email (через emailService)

```javascript
import { sendCustomEmail } from "../services/emailService.js";

async function sendChangeNotification(idea, changes) {
  const email = {
    to: process.env.NOTIFICATION_EMAIL,
    subject: `⚠️ Idea Updated: ${idea.title}`,
    html: `<h2>Changes detected:</h2>
           <ul>${changes.map((c) => `<li>${c.field}: ${c.oldValue} → ${c.newValue}</li>`).join("")}</ul>
           <p><a href="${idea.url}">View source</a></p>`,
  };

  await sendCustomEmail(email.to, email.subject, email.html);
}
```

### 2. Slack Webhook

```javascript
async function sendSlackNotification(idea, changes) {
  await axios.post(process.env.SLACK_WEBHOOK, {
    text: `⚠️ *Idea Updated:* ${idea.title}`,
    attachments: [
      {
        color: "warning",
        fields: changes.map((c) => ({
          title: c.field,
          value: `${c.oldValue} → ${c.newValue}`,
          short: true,
        })),
      },
    ],
  });
}
```

### 3. Discord Webhook

```javascript
async function sendDiscordNotification(idea, changes) {
  await axios.post(process.env.DISCORD_WEBHOOK, {
    embeds: [
      {
        title: `⚠️ Idea Updated: ${idea.title}`,
        url: idea.url,
        color: 0xff9900,
        fields: changes.map((c) => ({
          name: c.field,
          value: `${c.oldValue} → ${c.newValue}`,
          inline: true,
        })),
        timestamp: new Date(),
      },
    ],
  });
}
```

### 4. In-App Notifications (WebSocket)

```javascript
import { io } from "../websocket.js";

async function sendInAppNotification(idea, changes) {
  io.emit("idea:updated", {
    ideaId: idea._id,
    title: idea.title,
    changes: changes,
    timestamp: new Date(),
  });
}
```

---

## Troubleshooting

### Crawler не запускается

```bash
# Проверить MongoDB
mongo --eval "db.runCommand({ ping: 1 })"

# Проверить зависимости
npm install node-cron robots-parser cheerio

# Проверить права на запись лога
touch data/logs/crawler-audit.log
```

### Ошибки парсинга

```javascript
// Добавить debug логирование
console.log("HTML Preview:", $.html().substring(0, 500));

// Проверить селекторы
console.log("Title:", $("title").text());
console.log("Meta:", $('meta[name="description"]').attr("content"));
```

### robots.txt блокирует

```bash
# Проверить robots.txt вручную
curl https://example.com/robots.txt

# Обойти проверку для тестирования (не для production!)
const isAllowed = true; // Force allow
```

### Слишком медленный

```javascript
// Уменьшить rate limit (осторожно!)
const RATE_LIMIT_DELAY = 1000; // 1 секунда

// Параллельный crawling (требует очереди)
const promises = ideas.map(crawlIdea);
await Promise.all(promises);
```

---

## Расширенные возможности

### Diff изменений с подробностями

```javascript
function detectChanges(oldIdea, newData) {
  const changes = [];

  // Text diff (показать конкретные изменения)
  if (oldIdea.description !== newData.description) {
    const diff = require("diff");
    const textDiff = diff.diffWords(oldIdea.description, newData.description);

    changes.push({
      field: "description",
      diff: textDiff,
      severity: "medium",
    });
  }

  return changes;
}
```

### Приоритеты crawling

```javascript
// Сначала активные идеи, потом monitoring
const ideas = await Idea.find({
  status: { $in: ["active", "monitoring"] },
}).sort({
  status: -1, // active перед monitoring
  lastCrawled: 1, // старые перед новыми
});
```

### Conditional crawling

```javascript
// Пропустить, если crawled недавно
const RECRAWL_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

if (Date.now() - idea.lastCrawled < RECRAWL_INTERVAL) {
  console.log(`Skipping ${idea.url} (crawled recently)`);
  continue;
}
```

---

## Best Practices

1. **Используй PM2** для автоматического перезапуска
2. **Мониторь логи** регулярно
3. **Настрой alerts** для критических ошибок
4. **Бэкапь данные** перед массовыми обновлениями
5. **Тестируй селекторы** на новых источниках
6. **Соблюдай robots.txt** всегда
7. **Используй rate limiting** для вежливости
8. **Логируй всё** для отладки

---

## FAQ

**Q: Как часто запускается crawler?**
A: По умолчанию каждый день в 3:00 AM. Можно изменить в `CRON_SCHEDULE`.

**Q: Можно ли запустить вручную?**
A: Да, используй флаг `--run-now`.

**Q: Что если сайт блокирует crawler?**
A: Проверь `robots.txt`, уменьши частоту запросов, добавь правильный User-Agent.

**Q: Как добавить новые поля для отслеживания?**
A: Обнови `detectChanges()` функцию и добавь селекторы в `crawlIdea()`.

**Q: Как получать уведомления?**
A: Раскомментируй нужный метод в `sendChangeNotification()` (Email/Slack/Discord).

---

**Создано для HAORI VISION**
_Idea Crawler Scheduler — Version 1.0_
