# 🎨 HAORI VISION — Brand Assets

Полная библиотека визуальных элементов бренда HAORI VISION.

---

## 📁 Структура файлов

```
brand-assets/
├── logos/
│   ├── haori-vision-primary.svg       # Основной логотип (полная версия)
│   ├── haori-vision-short.svg         # Короткий логотип (HV + иконка)
│   ├── haori-vision-monogram.svg      # Монограмма (только Light Mark)
│   └── haori-vision-white-bg.svg      # Версия для белого фона
│
├── patterns/
│   ├── mycelium-network.svg           # Паттерн "Сеть мицелия"
│   ├── void-bloom.svg                 # Паттерн "Цветение из пустоты"
│   ├── light-rays.svg                 # Паттерн "Лучи света"
│   └── kanji-grid.svg                 # Паттерн "Сетка с иероглифом 光"
│
├── brand-system.css                   # Полная CSS-система бренда
├── brandbook.html                     # Интерактивный брендбук (12 страниц)
└── README.md                          # Этот файл
```

---

## 📖 Документация

### Основной Style Guide

Полная документация находится в корне проекта:

- **`BRAND_STYLE_GUIDE.md`** — Complete brand guidelines (40+ страниц)

---

## 🎨 Использование логотипов

### Основной логотип (`haori-vision-primary.svg`)

**Когда использовать:**

- Website header
- Packaging (коробки, этикетки)
- Gallery walls
- Презентации

**Минимальный размер:** 120px ширина

**Clear space:** 50% высоты логотипа со всех сторон

---

### Короткий логотип (`haori-vision-short.svg`)

**Когда использовать:**

- Social media profile pictures
- Favicons
- Мелкие принты (до 5см)

**Минимальный размер:** 48px × 48px

---

### Монограмма (`haori-vision-monogram.svg`)

**Когда использовать:**

- Labels на одежде (вышивка)
- Watermarks на фото/видео
- Buttons, pins, badges

---

### Версия для белого фона (`haori-vision-white-bg.svg`)

**Когда использовать:**

- Печатные материалы на белой бумаге
- Документы, contracts
- Email подписи (light mode)

---

## 🌈 Цветовая палитра

### Primary Colors

| Color                | HEX       | RGB           | Usage               |
| -------------------- | --------- | ------------- | ------------------- |
| **Void Black**       | `#000000` | 0, 0, 0       | Основной фон        |
| **Hikari Purple**    | `#B026FF` | 176, 38, 255  | Акценты, Light Mark |
| **Light White**      | `#FFFFFF` | 255, 255, 255 | Текст на чёрном     |
| **Moonlight Silver** | `#C0C0C0` | 192, 192, 192 | Вторичный текст     |

### UV Spectrum (только для UV-контекста)

| Color         | HEX       | Usage                  |
| ------------- | --------- | ---------------------- |
| **UV Pink**   | `#FF10F0` | UV-фото, флюоресценция |
| **UV Cyan**   | `#00D4FF` | UV-фото, digital UI    |
| **UV Green**  | `#39FF14` | UV-фото, органика      |
| **UV Orange** | `#FF6600` | UV-фото, традиция      |

⚠️ **Важно:** UV-цвета нельзя использовать в печати (кроме UV-реактивных красок).

---

## ✍️ Типографика

### Primary Typeface

**Neue Haas Grotesk Display** (лицензионный)

**Alternatives (free):**

- Helvetica Neue
- Inter (Google Fonts)
- Space Grotesk (Google Fonts)

**Использование:**

- Headings (Extra Bold, 900)
- Body text (Light, 300)
- Labels (Regular, 400, uppercase, +15% tracking)

---

### Secondary Typeface

**Shippori Mincho** (Google Fonts, free)

**Использование:**

- Japanese characters (光, 闇)
- Quotes from Hikari
- Poetic phrases
- Credits

---

## 🌀 Паттерны

### Mycelium Network

**Концепция:** Органическая сеть связей

**Использование:**

- Packaging tissue paper (silver print)
- Website background (subtle, 5% opacity)
- Exhibition walls (UV projection)

---

### Void Bloom

**Концепция:** Концентрические круги, цветение из пустоты

**Использование:**

- NFT certificate backgrounds
- Product photography backdrops
- Social media story templates

---

### Light Rays

**Концепция:** Радиальные лучи от источника света

**Использование:**

- Logo backdrop (subtle)
- Presentation slides
- Email headers

---

### Kanji Grid

**Концепция:** Иероглиф 光 (hikari) как watermark

**Использование:**

- Packaging interiors
- Certificate backgrounds
- High-end print materials

**Правило:** Всегда opacity 5%, rotation 45°

---

## 📄 Экспорт Brandbook в PDF

### Вариант 1: Через браузер (рекомендуется)

1. Открой `brandbook.html` в браузере (Chrome или Firefox)
2. Нажми `Ctrl+P` (Windows) или `Cmd+P` (Mac)
3. Выбери "Save as PDF"
4. **Настройки:**
   - Paper size: A4
   - Margins: None
   - Background graphics: ON ✓
   - Scale: 100%
5. Save → `HAORI_VISION_Brandbook.pdf`

---

### Вариант 2: Через Node.js (программный)

Если нужна автоматизация, используй **Puppeteer**:

```bash
npm install puppeteer

node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('file://' + __dirname + '/brand-assets/brandbook.html', {waitUntil: 'networkidle0'});
  await page.pdf({
    path: 'HAORI_VISION_Brandbook.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  await browser.close();
})();
"
```

---

## 🛠️ Интеграция CSS-системы

### В HTML-проекте:

```html
<link rel="stylesheet" href="brand-assets/brand-system.css" />
```

### В React-проекте:

```jsx
import "../brand-assets/brand-system.css";
```

### Использование классов:

```html
<!-- Buttons -->
<button class="btn btn-primary">Shop Now</button>

<!-- Text with glow -->
<h1 class="glow-purple">HAORI VISION</h1>

<!-- Cards -->
<div class="card">
  <h3>Mycelium Dreams</h3>
  <p>$5,400</p>
</div>

<!-- Japanese text -->
<span class="japanese">光</span>
```

---

## ✅ Checklist перед использованием

Перед тем как использовать любой брендовый элемент, проверь:

- [ ] Использую официальные файлы из `brand-assets/`?
- [ ] Цвета соответствуют палитре (не изменены)?
- [ ] Логотип не искажён (пропорции сохранены)?
- [ ] Clear space вокруг логотипа соблюдён?
- [ ] Типографика из брендовой системы?
- [ ] Паттерны используются с правильной opacity (3-10%)?
- [ ] Дизайн выглядит minimal, mystical (не commercial)?
- [ ] Хикари бы одобрил? (WWHS test)

---

## 📞 Контакты

**Для вопросов о бренде:**
→ brand@haori-vision.com

**Для запроса высококачественных файлов:**
→ Request via Google Drive (team access only)

---

## 🔒 Права использования

- **Internal use:** Unlimited для команды HAORI VISION
- **Partners:** Требуется согласование каждого использования
- **Press:** Можно использовать логотип + фото продуктов (с указанием авторства)
- **Запрещено:** Модификация, воссоздание, неавторизованный мерч

---

**Version:** 1.0.0
**Created:** October 2025
**Last Updated:** October 2025

🌟

_"Логотип — это не просто картинка. Это сигнатура света."_

— HAORI VISION
