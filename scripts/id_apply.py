#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ID Apply - Применение сгенерированных ID к продуктам
Non-Destructive: применяет ID только к продуктам без существующего ID
"""

import json
import sys
import shutil
from pathlib import Path
from datetime import datetime
import pytz

# Установить UTF-8 для stdout в Windows
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

# Импорт функций из next_id.py
import importlib.util
spec = importlib.util.spec_from_file_location("next_id", Path(__file__).parent / "next_id.py")
next_id_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(next_id_module)

# Пути
PROJECT_ROOT = Path(__file__).parent.parent
CATALOG_FILE = PROJECT_ROOT / "data" / "products" / "collections.json"
REPORTS_DIR = PROJECT_ROOT / "reports"

def create_backup():
    """Создать бэкап перед изменениями"""
    backup_dir = CATALOG_FILE.parent / "backups"
    backup_dir.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    backup_file = backup_dir / f"collections_{timestamp}.json"

    shutil.copy2(CATALOG_FILE, backup_file)

    print(f"[BACKUP] Создан бэкап: {backup_file}")
    return backup_file

def apply_ids(dry_run=False):
    """Применить ID к продуктам без ID"""

    mode_label = "[DRY-RUN]" if dry_run else "[APPLY]"

    print(f"{mode_label} {'Анализ' if dry_run else 'Применение'} ID к каталогу")
    print("-" * 70)

    # Загрузить каталог
    catalog = next_id_module.load_catalog()
    existing_ids = next_id_module.extract_existing_ids(catalog)

    # Статистика
    stats = {
        "total_products": 0,
        "with_id": 0,
        "without_id": 0,
        "applied": 0,
        "skipped": 0
    }

    # Список изменений
    changes = []

    # Обработка продуктов
    for collection in catalog.get("collections", []):
        collection_id = collection.get("id", "Unknown")

        for product in collection.get("products", []):
            stats["total_products"] += 1

            if product.get("id"):
                stats["with_id"] += 1
                stats["skipped"] += 1
            else:
                stats["without_id"] += 1

                # Генерация ID
                id_info = next_id_module.generate_next_id(product, existing_ids)

                if id_info:
                    # Применить ID (если не dry-run)
                    if not dry_run:
                        product["id"] = id_info["next_id"]

                    # Добавить в список изменений
                    changes.append({
                        "collection": collection_id,
                        "sku": id_info["sku"],
                        "name": id_info["name"],
                        "series": id_info["series"],
                        "new_id": id_info["next_id"]
                    })

                    # Добавить в существующие ID
                    existing_ids.add(id_info["next_id"])

                    stats["applied"] += 1

    # Вывод статистики
    print(f"\n{mode_label} Статистика:")
    print(f"  Продуктов всего: {stats['total_products']}")
    print(f"  С ID: {stats['with_id']}")
    print(f"  Без ID: {stats['without_id']}")
    print(f"  Применено ID: {stats['applied']}")
    print(f"  Пропущено (уже есть ID): {stats['skipped']}")

    # Вывод изменений
    if changes:
        print(f"\n{mode_label} Изменения:")
        print("-" * 70)

        for change in changes:
            print(f"[{change['collection']}] {change['sku']}")
            print(f"  Название: {change['name']}")
            print(f"  Серия: {change['series']}")
            print(f"  Новый ID: {change['new_id']}")
            print()
    else:
        print(f"\n{mode_label} Нет продуктов без ID")

    # Сохранение изменений (если не dry-run)
    if not dry_run and changes:
        # Создать бэкап
        backup_file = create_backup()

        # Сохранить обновлённый каталог
        with open(CATALOG_FILE, "w", encoding="utf-8") as f:
            json.dump(catalog, f, indent=2, ensure_ascii=False)

        print(f"\n[SAVE] Изменения сохранены в: {CATALOG_FILE}")
        print(f"[BACKUP] Бэкап: {backup_file}")

    # Создать отчёт
    report_path = create_report(stats, changes, dry_run)

    return stats, changes, report_path

def create_report(stats, changes, dry_run):
    """Создать отчёт о применении ID"""

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    mode = "dry_run" if dry_run else "applied"
    report_path = REPORTS_DIR / f"id_apply_{mode}_{timestamp}.txt"

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("=" * 70 + "\n")
        f.write("HAORI VISION - AUTO-ID REPORT\n")
        f.write("=" * 70 + "\n\n")

        f.write(f"Дата: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Режим: {'DRY-RUN (без изменений)' if dry_run else 'ПРИМЕНЕНИЕ (с изменениями)'}\n")
        f.write(f"Файл: {CATALOG_FILE}\n")
        f.write("\n")

        # Статистика
        f.write("-" * 70 + "\n")
        f.write("СТАТИСТИКА\n")
        f.write("-" * 70 + "\n")
        f.write(f"Продуктов всего: {stats['total_products']}\n")
        f.write(f"С ID: {stats['with_id']}\n")
        f.write(f"Без ID: {stats['without_id']}\n")
        f.write(f"Применено ID: {stats['applied']}\n")
        f.write(f"Пропущено (уже есть ID): {stats['skipped']}\n")
        f.write("\n")

        # Изменения
        if changes:
            f.write("-" * 70 + "\n")
            f.write("ПРИМЕНЁННЫЕ ID\n")
            f.write("-" * 70 + "\n")

            for change in changes:
                f.write(f"Коллекция: {change['collection']}\n")
                f.write(f"SKU: {change['sku']}\n")
                f.write(f"Название: {change['name']}\n")
                f.write(f"Серия: {change['series']}\n")
                f.write(f"Новый ID: {change['new_id']}\n")
                f.write("\n")

        # Результат
        f.write("-" * 70 + "\n")
        if dry_run:
            f.write("DRY-RUN ЗАВЕРШЁН (изменения не применены)\n")
        else:
            f.write(f"ПРИМЕНЕНИЕ ЗАВЕРШЕНО ({stats['applied']} ID присвоено)\n")
        f.write("-" * 70 + "\n")

    print(f"\n[REPORT] Отчёт сохранён: {report_path}")
    return report_path

if __name__ == "__main__":
    # Проверка режима dry-run
    dry_run = "--dry-run" in sys.argv or "--dry_run" in sys.argv or "dry" in sys.argv

    try:
        stats, changes, report_path = apply_ids(dry_run=dry_run)

        # Код возврата
        sys.exit(0)

    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
