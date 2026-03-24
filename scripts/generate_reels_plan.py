#!/usr/bin/env python3
"""
HAORI VISION — P17 Reels Auto-Plan Generator

Автоматически генерирует 10-дневный контент-план для Reels из последних добавленных товаров.

Логика:
- Берёт N последних SKU по полю artisan.creationDate
- Формирует /data/media/plan_10days_YYYY-MM-DD.json со сценариями
- Не переписывает существующие планы (Add-Only принцип)
- Генерирует концепции UV-трансформации, шоты, подсказки текста

Usage:
    python scripts/generate_reels_plan.py
    npm run content:reels_plan
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).parent.parent
COLLECTIONS_FILE = ROOT_DIR / "data" / "products" / "collections.json"
OUTPUT_DIR = ROOT_DIR / "data" / "media"
OUTPUT_FILE = OUTPUT_DIR / "plan_10days.json"

# Configuration
N_PRODUCTS = 4  # Количество продуктов в плане (4 продукта = 10 дней, ~2-3 дня на продукт)
PLAN_DURATION_DAYS = 10


def load_collections():
    """Загружает все коллекции и продукты из collections.json"""
    if not COLLECTIONS_FILE.exists():
        print(f"[ERROR] Файл не найден: {COLLECTIONS_FILE}")
        return None

    with open(COLLECTIONS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    return data.get('collections', [])


def extract_all_products(collections):
    """Извлекает все продукты из всех коллекций с датами создания"""
    all_products = []

    for collection in collections:
        collection_id = collection.get('id', '')
        collection_name = collection.get('name', '')
        release_date = collection.get('releaseDate', '')

        for product in collection.get('products', []):
            # Добавляем метаданные коллекции к продукту
            product_with_meta = {
                **product,
                'collection_id': collection_id,
                'collection_name': collection_name,
                'collection_release_date': release_date
            }
            all_products.append(product_with_meta)

    return all_products


def sort_products_by_date(products):
    """Сортирует продукты по дате создания (новые → старые)"""
    def get_creation_date(product):
        # Пробуем получить дату из artisan.creationDate
        creation_date = product.get('artisan', {}).get('creationDate')
        if creation_date:
            try:
                return datetime.strptime(creation_date, '%Y-%m-%d')
            except ValueError:
                pass

        # Fallback: используем releaseDate коллекции
        collection_date = product.get('collection_release_date')
        if collection_date:
            try:
                return datetime.strptime(collection_date, '%Y-%m-%d')
            except ValueError:
                pass

        # Fallback: очень старая дата
        return datetime(2000, 1, 1)

    return sorted(products, key=get_creation_date, reverse=True)


def check_existing_plan():
    """Проверяет существование plan_10days.json"""
    return OUTPUT_FILE.exists()


def get_products_with_existing_plans():
    """Получает список product IDs, которые уже есть в существующих планах"""
    existing_product_ids = set()

    # Проверяем все файлы plan_10days*.json
    if OUTPUT_DIR.exists():
        for file in OUTPUT_DIR.glob("plan_10days*.json"):
            try:
                with open(file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    products = data.get('contentPlan', {}).get('products', [])
                    for prod in products:
                        prod_id = prod.get('id')
                        if prod_id:
                            existing_product_ids.add(prod_id)
            except Exception as e:
                print(f"[WARNING] Не удалось прочитать {file}: {e}")

    return existing_product_ids


def filter_new_products(products, existing_product_ids):
    """Фильтрует продукты, исключая те, что уже есть в планах"""
    return [p for p in products if p.get('id') not in existing_product_ids]


def generate_uv_concept(product, day_number):
    """Генерирует концепцию UV-трансформации для продукта"""
    product_name = product.get('name', 'Продукт')
    sku = product.get('sku', '')

    concepts = [
        {
            "theme": "Первое впечатление",
            "ru": f"Знакомство с {product_name}: от классического чёрного к взрыву UV-красок",
            "en": f"Meet {product_name}: from classic black to UV color explosion"
        },
        {
            "theme": "Процесс создания",
            "ru": f"Как создаётся {product_name}: 12+ часов ручной работы с UV-пигментами",
            "en": f"Behind the scenes of {product_name}: 12+ hours of handcrafted UV artistry"
        },
        {
            "theme": "Детали и текстуры",
            "ru": f"Детали {product_name}: каждая линия светится по-своему под UV",
            "en": f"{product_name} details: every line glows uniquely under UV light"
        },
        {
            "theme": "В контексте",
            "ru": f"Как носить {product_name}: образы для дня и вечеринки с UV",
            "en": f"How to wear {product_name}: day looks and UV party styling"
        }
    ]

    # Выбираем концепцию в зависимости от дня
    concept = concepts[(day_number - 1) % len(concepts)]

    return concept


def generate_keyframes(product, concept):
    """Генерирует ключевые кадры для видео"""
    product_name = product.get('name', 'Продукт')

    keyframes = [
        f"0-3s: {product_name} в дневном свете — классический чёрный текстиль",
        f"3-6s: Камера приближается, показывает детали вышивки",
        f"6-10s: UV-свет включается постепенно — появляются первые яркие линии",
        f"10-15s: Полная UV-трансформация — взрыв цвета и паттернов",
        f"15-18s: Деталь: крупный план светящегося узора",
        f"18-22s: Модель в хаори двигается — игра света и тени",
        f"22-25s: Финальный кадр с логотипом и призывом к действию"
    ]

    return keyframes


def generate_caption(product, concept, language='ru'):
    """Генерирует подпись для поста"""
    product_name = product.get('name', 'Продукт')
    sku = product.get('sku', '')

    if language == 'ru':
        return f"""✨ {concept['ru']}

{product_name} ({sku}) — это не просто одежда. Это портал между мирами: днём классический чёрный, ночью — взрыв UV-красок.

🎨 12+ часов ручной работы
🔬 Эксклюзивные UV-пигменты
🌈 Уникальный паттерн (1 of 1)

Каждое хаори создаётся вручную и существует в единственном экземпляре.

👉 Посмотреть все детали: haori.vision/shop"""
    else:
        return f"""✨ {concept['en']}

{product_name} ({sku}) is not just clothing. It's a portal between worlds: classic black by day, UV color burst by night.

🎨 12+ hours of handwork
🔬 Exclusive UV pigments
🌈 Unique pattern (1 of 1)

Each haori is handcrafted and exists as a one-of-one piece.

👉 See all details: haori.vision/shop"""


def generate_hashtags(product):
    """Генерирует хэштеги для поста"""
    return [
        "#HaoriVision",
        "#UVArt",
        "#ReactiveClothing",
        "#HandmadeJapan",
        "#UVReactive",
        "#Streetwear",
        "#FashionArt",
        "#UniqueClothing",
        "#BlackLight",
        "#NeonFashion",
        "#OneOfOne",
        "#WearableArt"
    ]


def generate_post(product, day_number, start_date):
    """Генерирует запись контент-плана для одного дня"""
    post_date = start_date + timedelta(days=day_number - 1)
    concept = generate_uv_concept(product, day_number)
    keyframes = generate_keyframes(product, concept)

    return {
        "day": day_number,
        "date": post_date.strftime('%Y-%m-%d'),
        "product": product.get('id'),
        "contentType": "Reels Video + 4 Photos",
        "reelsVideo": {
            "duration": "20-25s",
            "concept": concept['ru'],
            "keyFrames": keyframes,
            "music": "Trending audio (check Instagram Reels trends)",
            "callToAction": "Swipe up → haori.vision/shop"
        },
        "photos": [
            {
                "number": 1,
                "description": f"{product.get('name')} в дневном свете (детальный фронтальный)"
            },
            {
                "number": 2,
                "description": f"{product.get('name')} под UV (полная трансформация)"
            },
            {
                "number": 3,
                "description": "Крупный план UV-паттерна (детали вышивки)"
            },
            {
                "number": 4,
                "description": "Модель в хаори (контекст/стайлинг)"
            }
        ],
        "caption": {
            "ru": generate_caption(product, concept, 'ru'),
            "en": generate_caption(product, concept, 'en')
        },
        "hashtags": generate_hashtags(product),
        "platforms": ["Instagram", "TikTok", "YouTube Shorts"],
        "postingTime": {
            "instagram": "19:00 MSK",
            "tiktok": "20:00 MSK",
            "youtube": "21:00 MSK"
        }
    }


def distribute_posts(products, start_date):
    """Распределяет продукты по 10 дням (2-3 дня на продукт)"""
    posts = []
    days_per_product = PLAN_DURATION_DAYS // len(products)
    extra_days = PLAN_DURATION_DAYS % len(products)

    current_day = 1

    for i, product in enumerate(products):
        # Первые продукты получают дополнительные дни
        days_for_this_product = days_per_product + (1 if i < extra_days else 0)

        for day_offset in range(days_for_this_product):
            post = generate_post(product, current_day, start_date)
            posts.append(post)
            current_day += 1

    return posts


def generate_content_plan(products):
    """Генерирует полный контент-план"""
    if not products:
        print("[ERROR] Нет продуктов для генерации плана")
        return None

    # Дата начала плана — завтра
    start_date = datetime.now() + timedelta(days=1)
    end_date = start_date + timedelta(days=PLAN_DURATION_DAYS - 1)

    # Получаем информацию о коллекции первого продукта
    first_product = products[0]
    collection_id = first_product.get('collection_id', 'unknown')
    collection_name = first_product.get('collection_name', 'Latest Products')

    # Генерируем посты
    posts = distribute_posts(products, start_date)

    # Формируем структуру плана
    plan = {
        "contentPlan": {
            "title": f"HAORI VISION — 10-Day Content Plan ({collection_name})",
            "description": "Автоматически сгенерированный контент-план для Reels на основе последних добавленных продуктов",
            "generatedAt": datetime.now().isoformat(),
            "dateRange": {
                "start": start_date.strftime('%Y-%m-%d'),
                "end": end_date.strftime('%Y-%m-%d')
            },
            "collection": {
                "id": collection_id,
                "name": collection_name
            },
            "products": [
                {
                    "id": p.get('id'),
                    "sku": p.get('sku'),
                    "name": p.get('name'),
                    "creationDate": p.get('artisan', {}).get('creationDate')
                }
                for p in products
            ],
            "posts": posts
        }
    }

    return plan


def save_plan(plan):
    """Сохраняет план в файл (Add-Only: не перезаписывает существующие)"""
    # Создаём директорию если не существует
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Проверяем существование plan_10days.json
    if OUTPUT_FILE.exists():
        # Создаём файл с датой
        today = datetime.now().strftime('%Y-%m-%d')
        output_file = OUTPUT_DIR / f"plan_10days_{today}.json"
        print(f"[INFO] Файл {OUTPUT_FILE.name} уже существует")
        print(f"[INFO] Создаю новый план: {output_file.name}")
    else:
        output_file = OUTPUT_FILE
        print(f"[INFO] Создаю план: {output_file.name}")

    # Сохраняем JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(plan, f, ensure_ascii=False, indent=2)

    print(f"[OK] План сохранён: {output_file}")
    return output_file


def main():
    print("=" * 60)
    print("HAORI VISION — P17 Reels Auto-Plan Generator")
    print("=" * 60)
    print()

    # Шаг 1: Загружаем коллекции
    print("[1/6] Загружаю коллекции...")
    collections = load_collections()
    if not collections:
        print("[ERROR] Не удалось загрузить коллекции")
        return
    print(f"[OK] Загружено коллекций: {len(collections)}")

    # Шаг 2: Извлекаем все продукты
    print("[2/6] Извлекаю продукты...")
    all_products = extract_all_products(collections)
    print(f"[OK] Всего продуктов: {len(all_products)}")

    # Шаг 3: Сортируем по дате
    print("[3/6] Сортирую по дате создания...")
    sorted_products = sort_products_by_date(all_products)
    if sorted_products:
        latest = sorted_products[0]
        print(f"[OK] Последний продукт: {latest.get('name')} ({latest.get('artisan', {}).get('creationDate')})")

    # Шаг 4: Фильтруем продукты с существующими планами
    print("[4/6] Проверяю существующие планы...")
    existing_product_ids = get_products_with_existing_plans()
    if existing_product_ids:
        print(f"[INFO] Продукты с планами: {', '.join(existing_product_ids)}")

    new_products = filter_new_products(sorted_products, existing_product_ids)
    print(f"[OK] Продукты без планов: {len(new_products)}")

    # Берём N последних продуктов
    selected_products = new_products[:N_PRODUCTS]

    if len(selected_products) < N_PRODUCTS:
        print(f"[WARNING] Найдено только {len(selected_products)} новых продуктов (требуется {N_PRODUCTS})")
        if len(selected_products) == 0:
            print("[INFO] Все продукты уже имеют планы. Нечего генерировать.")
            return

    print(f"[OK] Выбрано продуктов для плана: {len(selected_products)}")
    for p in selected_products:
        print(f"     - {p.get('name')} ({p.get('id')})")

    # Шаг 5: Генерируем контент-план
    print("[5/6] Генерирую контент-план...")
    plan = generate_content_plan(selected_products)
    if not plan:
        return

    posts_count = len(plan['contentPlan']['posts'])
    date_range = plan['contentPlan']['dateRange']
    print(f"[OK] Сгенерировано постов: {posts_count}")
    print(f"     Период: {date_range['start']} - {date_range['end']}")

    # Шаг 6: Сохраняем план
    print("[6/6] Сохраняю план...")
    output_file = save_plan(plan)

    print()
    print("=" * 60)
    print("[OK] Контент-план успешно создан!")
    print("=" * 60)
    print()
    print(f"Файл: {output_file}")
    print(f"Продукты: {len(selected_products)}")
    print(f"Посты: {posts_count} дней")
    print()


if __name__ == "__main__":
    main()
