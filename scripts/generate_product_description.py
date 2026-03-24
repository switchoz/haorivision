#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HAORI VISION — Auto Product Description Generator

Автоматически генерирует премиум-описания для новых товаров в collections.json
в фирменном стиле HAORI VISION: поэтично, кратко, с упоминанием света, лимита, ручной росписи.

Использование:
    python scripts/generate_product_description.py

Что делает:
    - Сканирует /data/products/collections.json
    - Находит товары без поля "description" (или с пустым значением)
    - Генерирует описание в стиле HAORI VISION
    - Обновляет JSON файл (создаёт бэкап перед изменением)

Пример сгенерированного описания:
    "Хаори ручной росписи, свечение в UV, лимитированная серия. Свет, который носишь."
"""

import json
import os
import sys
import re
from datetime import datetime
from pathlib import Path


# ============================================================================
# CONFIGURATION
# ============================================================================

COLLECTIONS_JSON_PATH = Path("data/products/collections.json")
BACKUP_DIR = Path("data/products/backups")

# Фирменный тон HAORI VISION
BRAND_TONE_KEYWORDS = [
    "свет", "света", "свечение", "световой", "светится",
    "ручная роспись", "ручной работы", "вручную расписано",
    "лимитированная серия", "лимит", "эксклюзив", "уникальный",
    "UV", "ультрафиолет", "флюоресцентный",
    "носишь", "станешь", "становишься",
    "искусство", "арт", "премиум"
]

# Шаблоны описаний (random choice для разнообразия)
DESCRIPTION_TEMPLATES = [
    # Краткие, энергичные
    "{material}. {light_effect}. {edition}. {tagline}",
    "{light_effect}. {material}, {edition}. {tagline}",
    "{edition}. {material} с {light_effect}. {tagline}",

    # Поэтичные
    "{tagline} {material}, {light_effect}. {edition}.",
    "{light_effect} — {material}. {edition}. {tagline}",

    # С акцентом на уникальность
    "{edition}. {material}. {light_effect}. {tagline}",
]

# Компоненты описания
MATERIAL_PHRASES = [
    "Хаори ручной росписи",
    "Шёлковое хаори, расписанное вручную",
    "Авторское хаори, ручная работа",
    "Хаори премиум-качества, ручная роспись",
]

LIGHT_EFFECT_PHRASES = [
    "свечение в UV",
    "световые эффекты в ультрафиолете",
    "UV-реактивные пигменты",
    "флюоресцентные акценты",
    "проявляется в UV-свете",
    "скрытые световые паттерны",
]

EDITION_PHRASES_TEMPLATE = [
    "лимитированная серия {edition_number}",
    "лимит {edition_number} экземпляров",
    "эксклюзивная серия {edition_number}",
    "{edition_number} в мире",
]

TAGLINE_PHRASES = [
    "Свет, который носишь",
    "Стань искусством",
    "Носи свет внутри",
    "Искусство на теле",
    "Ты — произведение искусства",
    "Световая магия в каждом мазке",
    "Твоё сияние",
    "Дыхание света",
]


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def create_backup(filepath):
    """Создаёт бэкап JSON файла перед изменением"""
    if not filepath.exists():
        print(f"WARNING: File not found: {filepath}")
        return None

    # Создать папку backups если её нет
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    # Имя бэкапа: collections_2025-10-08_14-30-15.json
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    backup_filename = f"{filepath.stem}_{timestamp}{filepath.suffix}"
    backup_path = BACKUP_DIR / backup_filename

    # Копировать файл
    import shutil
    shutil.copy2(filepath, backup_path)

    print(f"OK: Backup created: {backup_path}")
    return backup_path


def load_collections_json(filepath):
    """Загружает collections.json"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        print(f"ERROR: File not found: {filepath}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"ERROR: JSON parsing error: {e}")
        sys.exit(1)


def save_collections_json(filepath, data):
    """Сохраняет collections.json с красивым форматированием"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"OK: File updated: {filepath}")


def extract_edition_number(product):
    """Извлекает номер серии (например, '1 of 10' → 10)"""
    edition_str = product.get("edition", "")
    match = re.search(r'of (\d+)', edition_str)
    if match:
        return int(match.group(1))

    # Если не найдено в edition, ищем в totalEditions
    total_editions = product.get("totalEditions")
    if total_editions:
        return total_editions

    return None


def generate_description(product, collection_name):
    """
    Генерирует премиум-описание в стиле HAORI VISION

    Args:
        product: dict с данными товара
        collection_name: название коллекции

    Returns:
        str: сгенерированное описание
    """
    import random

    # 1. Material phrase
    material = random.choice(MATERIAL_PHRASES)

    # 2. Light effect phrase
    light_effect = random.choice(LIGHT_EFFECT_PHRASES)

    # 3. Edition phrase
    edition_number = extract_edition_number(product)
    if edition_number:
        edition_template = random.choice(EDITION_PHRASES_TEMPLATE)
        edition = edition_template.format(edition_number=edition_number)
    else:
        edition = "лимитированная серия"

    # 4. Tagline
    tagline = random.choice(TAGLINE_PHRASES)

    # 5. Выбрать шаблон и заполнить
    template = random.choice(DESCRIPTION_TEMPLATES)
    description = template.format(
        material=material,
        light_effect=light_effect,
        edition=edition,
        tagline=tagline
    )

    # 6. Добавить упоминание коллекции (опционально, для уникальности)
    # Например: "Из коллекции ECLIPSE & BLOOM."
    # (Можно включить/выключить)

    return description


def needs_description(product):
    """Проверяет, нужно ли товару описание"""
    # Проверяем поле "description"
    desc = product.get("description")

    # Если поля нет, или оно пустое, или None
    if not desc or desc.strip() == "":
        return True

    return False


# ============================================================================
# MAIN LOGIC
# ============================================================================

def main():
    print("\n" + "="*70)
    print("HAORI VISION - Auto Product Description Generator")
    print("="*70 + "\n")

    # 1. Проверить существование файла
    if not COLLECTIONS_JSON_PATH.exists():
        print(f"ERROR: File not found: {COLLECTIONS_JSON_PATH}")
        print(f"       Make sure you run the script from project root.")
        sys.exit(1)

    # 2. Создать бэкап
    backup_path = create_backup(COLLECTIONS_JSON_PATH)
    if not backup_path:
        sys.exit(1)

    # 3. Загрузить JSON
    data = load_collections_json(COLLECTIONS_JSON_PATH)

    # 4. Сканировать коллекции и товары
    collections = data.get("collections", [])
    if not collections:
        print("WARNING: No collections found in JSON.")
        sys.exit(0)

    total_products = 0
    updated_products = 0

    for collection in collections:
        collection_id = collection.get("id", "unknown")
        collection_name = collection.get("name", "Unknown Collection")
        products = collection.get("products", [])

        print(f"\nCollection: {collection_name} ({collection_id})")
        print(f"   Products: {len(products)}")

        for product in products:
            total_products += 1

            # Проверить, нужно ли описание
            if needs_description(product):
                product_id = product.get("id", product.get("sku", "unknown"))
                product_name = product.get("name", "Unnamed Product")

                # Генерировать описание
                new_description = generate_description(product, collection_name)

                # Обновить товар
                product["description"] = new_description
                updated_products += 1

                print(f"   [+] {product_name} ({product_id})")
                print(f"       -> \"{new_description}\"")
            else:
                product_name = product.get("name", "Unnamed Product")
                print(f"   [-] {product_name} - already has description, skipping")

    # 5. Сохранить обновлённый JSON
    if updated_products > 0:
        save_collections_json(COLLECTIONS_JSON_PATH, data)

        print("\n" + "="*70)
        print(f"DONE!")
        print(f"   Total products: {total_products}")
        print(f"   Updated: {updated_products}")
        print(f"   Backup: {backup_path}")
        print("="*70 + "\n")
    else:
        print("\n" + "="*70)
        print(f"INFO: All products already have descriptions.")
        print(f"   Total products: {total_products}")
        print(f"   Updated: 0")
        print("="*70 + "\n")


if __name__ == "__main__":
    main()
