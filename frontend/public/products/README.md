# Product Pages — ECLIPSE & BLOOM Collection

Созданы индивидуальные страницы для 4 новых товаров из коллекции ECLIPSE & BLOOM.

## 📁 Структура

```
frontend/public/products/
├── eclipse-01.html    — ECLIPSE // 01 (€1,200, A3)
├── eclipse-02.html    — ECLIPSE // 02 (€1,800, A2)
├── lumin-01.html      — LUMIN SPIRIT // 01 (€1,800, A2)
└── bloom-01.html      — FLUO BLOOM // 01 (€1,200, A3)
```

## ✅ Что включено в каждую страницу

### 1. **Шапка (Header)**

- Логотип HAORI VISION
- Навигация назад к магазину

### 2. **Hero секция**

- Video preview с переключением Daylight/UV
- Название товара
- Описание (из `collections.json`)
- Цена
- Две кнопки CTA:
  - **Buy Now** → `mailto:shop@haorivision.com`
  - **Book Bespoke** → `/bespoke`
- Edition note (лимит 1 of 10)

### 3. **What's Included** (4 блока)

- Hand-Painted Haori
- Companion Painting
- UV LED Panel
- Certificates & Packaging

### 4. **Care Instructions** (2 колонки)

- Haori Care
- UV Effect & Painting Care

### 5. **FAQ** (3 вопроса с аккордеоном)

- How does the UV effect work?
- What is the NFT Certificate?
- Can I commission a bespoke piece?

### 6. **Reviews** (3 placeholder отзыва)

- 5-звёздочные отзывы с именами
- Verified Purchase метки

### 7. **Footer**

- Ссылки на About, Shop, Bespoke, Immersive, Contact
- Copyright

## 🎨 Уникальные цветовые схемы

Каждая страница использует акцентные цвета, соответствующие товару:

| Товар      | Accent Color          | Secondary Color          |
| ---------- | --------------------- | ------------------------ |
| ECLIPSE-01 | `#8A2BE2` (violet)    | `#00BFFF` (cyan)         |
| ECLIPSE-02 | `#8A2BE2` (violet)    | `#00CED1` (turquoise)    |
| LUMIN-01   | `#FFD700` (gold)      | `#FFA500` (orange)       |
| BLOOM-01   | `#FF1493` (deep pink) | `#00FF7F` (spring green) |

## 🎬 Видео (placeholder)

Страницы ожидают видеофайлы в `/assets/videos/`:

```
/assets/videos/
├── eclipse-01-daylight.mp4
├── eclipse-01-uv.mp4
├── eclipse-02-daylight.mp4
├── eclipse-02-uv.mp4
├── lumin-01-daylight.mp4
├── lumin-01-uv.mp4
├── bloom-01-daylight.mp4
└── bloom-01-uv.mp4
```

**Примечание:** Пока видео нет, плеер покажет чёрный экран. Кнопки переключения работают корректно.

## 🖼️ Open Graph изображения (placeholder)

Для соцсетей нужны OG-изображения в `/assets/products/`:

```
/assets/products/
├── eclipse-01-og.jpg
├── eclipse-02-og.jpg
├── lumin-01-og.jpg
└── bloom-01-og.jpg
```

## 📱 Responsive дизайн

- Desktop: Grid 2 колонки (видео + инфо)
- Mobile (<968px): Stack 1 колонка
- Все блоки адаптивны

## 🔗 Ссылки

Все страницы доступны по URL:

- `http://localhost:3012/products/eclipse-01.html`
- `http://localhost:3012/products/eclipse-02.html`
- `http://localhost:3012/products/lumin-01.html`
- `http://localhost:3012/products/bloom-01.html`

## 📊 Данные из collections.json

Страницы используют реальные данные из `/data/products/collections.json`:

- Названия товаров
- Описания (сгенерированные скриптом)
- Цены
- Материалы
- Размеры
- Часы работы художника
- Edition numbers

## 🛠️ Следующие шаги

1. **Добавить видео:**
   - Снять 8 видео (daylight + UV для каждого товара)
   - Загрузить в `/frontend/public/assets/videos/`

2. **Добавить OG-изображения:**
   - Создать превью для соцсетей
   - Размер: 1200x630px
   - Загрузить в `/frontend/public/assets/products/`

3. **Интегрировать с магазином:**
   - Добавить ссылки на эти страницы в каталог
   - Создать `/shop` страницу с grid товаров
   - Добавить навигацию между товарами

4. **Настроить e-commerce:**
   - Заменить `mailto:` на реальную корзину/checkout
   - Интегрировать с платёжной системой
   - Добавить inventory tracking

## 📝 Как создать новую страницу товара

1. Используй `/templates/product_template.html` как основу
2. Замени все `{{VARIABLE}}` на данные товара из `collections.json`
3. Обнови цветовую схему (`:root` в `<style>`)
4. Сохрани как `/frontend/public/products/{product-id}.html`

---

**Создано для HAORI VISION**
_Product Pages — Version 1.0_
