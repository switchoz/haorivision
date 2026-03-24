#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json, sys
from pathlib import Path
from datetime import datetime

if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

PROJECT_ROOT = Path(__file__).parent.parent
CATALOG_FILE = PROJECT_ROOT / "data" / "products" / "collections.json"
MEDIA_DIR = PROJECT_ROOT / "public" / "media" / "products"
REPORTS_DIR = PROJECT_ROOT / "reports"

# Требуемые медиафайлы для каждого продукта
REQUIRED_MEDIA = [
    "video_preview.mp4",
    "photo_day.jpg",
    "photo_uv.jpg",
    "photo_macro.jpg",
    "photo_on_model.jpg"
]

def load_catalog():
    with open(CATALOG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def check_media():
    """Проверить наличие медиафайлов для всех продуктов"""
    print("[MEDIA CHECK] Проверка медиафайлов")
    print("-" * 70)
    
    catalog = load_catalog()
    
    stats = {
        "total_products": 0,
        "products_with_full_media": 0,
        "products_with_partial_media": 0,
        "products_with_no_media": 0,
        "total_missing_files": 0
    }
    
    missing_files = []
    
    for collection in catalog.get("collections", []):
        for product in collection.get("products", []):
            stats["total_products"] += 1
            
            product_id = product.get("id", "")
            sku = product.get("sku", "Unknown")
            
            if not product_id:
                print(f"[SKIP] {sku}: нет ID")
                continue
            
            # Путь к директории продукта
            product_media_dir = MEDIA_DIR / product_id
            
            # Проверка каждого файла
            missing_count = 0
            product_missing = []
            
            for media_file in REQUIRED_MEDIA:
                file_path = product_media_dir / media_file
                
                if not file_path.exists():
                    missing_count += 1
                    stats["total_missing_files"] += 1
                    product_missing.append(media_file)
            
            # Категоризация продукта
            if missing_count == 0:
                stats["products_with_full_media"] += 1
                print(f"[OK] {sku} ({product_id}): все файлы на месте")
            elif missing_count == len(REQUIRED_MEDIA):
                stats["products_with_no_media"] += 1
                print(f"[MISSING] {sku} ({product_id}): нет медиафайлов")
                missing_files.append({
                    "sku": sku,
                    "id": product_id,
                    "missing": product_missing,
                    "status": "no_media"
                })
            else:
                stats["products_with_partial_media"] += 1
                print(f"[PARTIAL] {sku} ({product_id}): отсутствует {missing_count}/{len(REQUIRED_MEDIA)}")
                for mf in product_missing:
                    print(f"    - {mf}")
                missing_files.append({
                    "sku": sku,
                    "id": product_id,
                    "missing": product_missing,
                    "status": "partial"
                })
    
    # Вывод статистики
    print("\n" + "=" * 70)
    print("[STATS] Статистика:")
    print(f"  Продуктов всего: {stats['total_products']}")
    print(f"  С полным набором медиа: {stats['products_with_full_media']}")
    print(f"  С частичным набором: {stats['products_with_partial_media']}")
    print(f"  Без медиа: {stats['products_with_no_media']}")
    print(f"  Отсутствует файлов: {stats['total_missing_files']}")
    
    # Создать отчёт
    report_path = create_report(stats, missing_files)
    
    return stats, missing_files, report_path

def create_report(stats, missing_files):
    """Создать отчёт о проверке медиафайлов"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_path = REPORTS_DIR / f"media_check_{timestamp}.txt"
    
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("=" * 70 + "\n")
        f.write("HAORI VISION - MEDIA CHECK REPORT\n")
        f.write("=" * 70 + "\n\n")
        
        f.write(f"Дата: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Медиа-директория: {MEDIA_DIR}\n\n")
        
        # Статистика
        f.write("-" * 70 + "\n")
        f.write("СТАТИСТИКА\n")
        f.write("-" * 70 + "\n")
        f.write(f"Продуктов всего: {stats['total_products']}\n")
        f.write(f"С полным набором медиа: {stats['products_with_full_media']}\n")
        f.write(f"С частичным набором: {stats['products_with_partial_media']}\n")
        f.write(f"Без медиа: {stats['products_with_no_media']}\n")
        f.write(f"Отсутствует файлов: {stats['total_missing_files']}\n\n")
        
        # Отсутствующие файлы
        if missing_files:
            f.write("-" * 70 + "\n")
            f.write("ОТСУТСТВУЮЩИЕ МЕДИАФАЙЛЫ\n")
            f.write("-" * 70 + "\n")
            
            for item in missing_files:
                f.write(f"\nSKU: {item['sku']}\n")
                f.write(f"ID: {item['id']}\n")
                f.write(f"Статус: {item['status']}\n")
                f.write(f"Отсутствует:\n")
                for mf in item['missing']:
                    f.write(f"  - {mf}\n")
        
        # Результат
        f.write("\n" + "-" * 70 + "\n")
        if stats['total_missing_files'] == 0:
            f.write("ВСЕ МЕДИАФАЙЛЫ НА МЕСТЕ\n")
        else:
            f.write(f"ОБНАРУЖЕНО {stats['total_missing_files']} ОТСУТСТВУЮЩИХ ФАЙЛОВ\n")
        f.write("-" * 70 + "\n")
    
    print(f"\n[REPORT] Отчёт сохранён: {report_path}")
    return report_path

if __name__ == "__main__":
    try:
        stats, missing, report = check_media()
        sys.exit(0 if stats['total_missing_files'] == 0 else 1)
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
