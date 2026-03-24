#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Next ID Generator - Генерация следующего доступного ID
Логика присвоения ID для продуктов без идентификатора
"""

import json
import sys
import re
from pathlib import Path
from datetime import datetime
import pytz

# Установить UTF-8 для stdout в Windows
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

# Пути
PROJECT_ROOT = Path(__file__).parent.parent
CATALOG_FILE = PROJECT_ROOT / "data" / "products" / "collections.json"

# Правила генерации ID
ID_PATTERNS = {
    "ECLIPSE": "ECLIPSE-{:02d}",
    "LUMIN SPIRIT": "LUMIN-{:02d}",
    "FLUO BLOOM": "BLOOM-{:02d}",
    "DEFAULT": "HV-{}-{:03d}"  # HV-YYYYMM-XXX
}

def load_catalog():
    """Загрузить каталог"""
    if not CATALOG_FILE.exists():
        raise FileNotFoundError(f"Каталог не найден: {CATALOG_FILE}")

    with open(CATALOG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def extract_existing_ids(catalog):
    """Извлечь все существующие ID из каталога"""
    ids = set()

    for collection in catalog.get("collections", []):
        # ID коллекции
        if collection.get("id"):
            ids.add(collection["id"])

        # ID концепта
        if "concept" in collection and collection["concept"].get("id"):
            ids.add(collection["concept"]["id"])

        # ID продуктов
        for product in collection.get("products", []):
            if product.get("id"):
                ids.add(product["id"])

    return ids

def extract_series_from_name(product):
    """Определить серию продукта из названия"""
    name = product.get("name", "") or product.get("title", "")
    name_upper = name.upper()

    if "ECLIPSE" in name_upper:
        return "ECLIPSE"
    elif "LUMIN" in name_upper:
        return "LUMIN SPIRIT"
    elif "BLOOM" in name_upper or "FLUO" in name_upper:
        return "FLUO BLOOM"

    return "DEFAULT"

def get_next_id_for_series(series, existing_ids):
    """Получить следующий доступный ID для серии"""

    if series == "DEFAULT":
        # Для DEFAULT используем формат HV-YYYYMM-XXX
        stockholm_tz = pytz.timezone('Europe/Stockholm')
        now = datetime.now(stockholm_tz)
        year_month = now.strftime("%Y%m")

        # Найти все ID с текущим годом-месяцем
        pattern = re.compile(rf"HV-{year_month}-(\d{{3}})")
        used_numbers = []

        for existing_id in existing_ids:
            match = pattern.match(existing_id)
            if match:
                used_numbers.append(int(match.group(1)))

        # Найти минимальный свободный номер
        next_num = 1
        while next_num in used_numbers:
            next_num += 1

        return ID_PATTERNS["DEFAULT"].format(year_month, next_num)

    else:
        # Для именованных серий (ECLIPSE, LUMIN, BLOOM)
        pattern_template = ID_PATTERNS[series]
        prefix = series.split()[0]  # ECLIPSE, LUMIN, BLOOM

        # Найти все номера для этой серии
        pattern = re.compile(rf"{prefix}-(\d{{2}})")
        used_numbers = []

        for existing_id in existing_ids:
            match = pattern.match(existing_id)
            if match:
                used_numbers.append(int(match.group(1)))

        # Найти минимальный свободный номер
        next_num = 1
        while next_num in used_numbers:
            next_num += 1

        return pattern_template.format(next_num)

def generate_next_id(product, existing_ids):
    """Сгенерировать следующий ID для продукта"""

    # Если ID уже есть - не трогаем
    if product.get("id"):
        return None

    # Определить серию
    series = extract_series_from_name(product)

    # Сгенерировать ID
    next_id = get_next_id_for_series(series, existing_ids)

    return {
        "series": series,
        "next_id": next_id,
        "sku": product.get("sku", "Unknown"),
        "name": product.get("name") or product.get("title", "Unknown")
    }

def analyze_catalog():
    """Проанализировать каталог и показать, какие ID будут присвоены"""
    print("[ANALYZE] Анализ каталога для генерации ID")
    print("-" * 70)

    catalog = load_catalog()
    existing_ids = extract_existing_ids(catalog)

    print(f"[INFO] Найдено существующих ID: {len(existing_ids)}")
    print()

    # Статистика
    stats = {
        "total_products": 0,
        "with_id": 0,
        "without_id": 0,
        "by_series": {}
    }

    # Список продуктов без ID
    products_without_id = []

    for collection in catalog.get("collections", []):
        for product in collection.get("products", []):
            stats["total_products"] += 1

            if product.get("id"):
                stats["with_id"] += 1
            else:
                stats["without_id"] += 1

                # Генерация ID
                id_info = generate_next_id(product, existing_ids)
                if id_info:
                    products_without_id.append(id_info)

                    # Добавить в существующие для следующих итераций
                    existing_ids.add(id_info["next_id"])

                    # Статистика по сериям
                    series = id_info["series"]
                    if series not in stats["by_series"]:
                        stats["by_series"][series] = 0
                    stats["by_series"][series] += 1

    # Вывод статистики
    print(f"[STATS] Продуктов всего: {stats['total_products']}")
    print(f"[STATS] С ID: {stats['with_id']}")
    print(f"[STATS] Без ID: {stats['without_id']}")
    print()

    if products_without_id:
        print(f"[GENERATE] Будут сгенерированы следующие ID:")
        print("-" * 70)

        for info in products_without_id:
            print(f"[{info['sku']}] {info['name']}")
            print(f"  Серия: {info['series']}")
            print(f"  Новый ID: {info['next_id']}")
            print()

        print("[INFO] По сериям:")
        for series, count in stats["by_series"].items():
            print(f"  {series}: {count}")
    else:
        print("[OK] Все продукты уже имеют ID")

    return products_without_id

if __name__ == "__main__":
    try:
        analyze_catalog()
    except Exception as e:
        print(f"[ERROR] {e}")
        sys.exit(1)
