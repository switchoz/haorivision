#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json, sys
from pathlib import Path
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont

if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

PROJECT_ROOT = Path(__file__).parent.parent
CATALOG_FILE = PROJECT_ROOT / "data" / "products" / "collections.json"
MEDIA_DIR = PROJECT_ROOT / "public" / "media" / "products"

REQUIRED_MEDIA = {
    "video_preview.mp4": (1920, 1080),
    "photo_day.jpg": (1200, 1600),
    "photo_uv.jpg": (1200, 1600),
    "photo_macro.jpg": (1200, 1200),
    "photo_on_model.jpg": (1200, 1600)
}

def load_catalog():
    with open(CATALOG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def create_placeholder_image(width, height, text, output_path):
    """Создать placeholder изображение"""
    # Создать изображение
    img = Image.new('RGB', (width, height), color=(30, 30, 30))
    draw = ImageDraw.Draw(img)
    
    # Попробовать использовать системный шрифт
    try:
        font_large = ImageFont.truetype("arial.ttf", 60)
        font_small = ImageFont.truetype("arial.ttf", 30)
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Центрировать текст
    bbox = draw.textbbox((0, 0), text, font=font_large)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (width - text_width) // 2
    y = (height - text_height) // 2 - 50
    
    # Нарисовать текст
    draw.text((x, y), text, fill=(150, 150, 150), font=font_large)
    
    # Добавить подпись
    subtitle = "HAORI VISION"
    bbox2 = draw.textbbox((0, 0), subtitle, font=font_small)
    sub_width = bbox2[2] - bbox2[0]
    x2 = (width - sub_width) // 2
    y2 = y + text_height + 30
    
    draw.text((x2, y2), subtitle, fill=(100, 100, 100), font=font_small)
    
    # Сохранить
    img.save(output_path, quality=85)

def create_placeholder_video(output_path):
    """Создать placeholder для видео (пустой файл с комментарием)"""
    # Создаём простой текстовый файл-маркер вместо видео
    # В реальности здесь можно использовать ffmpeg для генерации видео
    with open(output_path.with_suffix('.txt'), 'w') as f:
        f.write("Video placeholder: Awaiting Master Shot\n")
        f.write("This is a temporary marker. Replace with actual video.\n")

def generate_placeholders(dry_run=False):
    """Сгенерировать placeholder'ы для отсутствующих медиафайлов"""
    label = "[DRY-RUN]" if dry_run else "[GENERATE]"
    print(f"{label} Генерация placeholder'ов")
    print("-" * 70)
    
    catalog = load_catalog()
    
    stats = {
        "total_products": 0,
        "placeholders_created": 0,
        "already_exists": 0,
        "directories_created": 0
    }
    
    created_files = []
    
    for collection in catalog.get("collections", []):
        for product in collection.get("products", []):
            stats["total_products"] += 1
            
            product_id = product.get("id", "")
            sku = product.get("sku", "Unknown")
            
            if not product_id:
                continue
            
            # Путь к директории продукта
            product_media_dir = MEDIA_DIR / product_id
            
            # Создать директорию если нужно
            if not product_media_dir.exists() and not dry_run:
                product_media_dir.mkdir(parents=True, exist_ok=True)
                stats["directories_created"] += 1
                print(f"[DIR] Создана директория: {product_id}")
            
            # Проверка и создание каждого файла
            for media_file, (width, height) in REQUIRED_MEDIA.items():
                file_path = product_media_dir / media_file
                
                if file_path.exists():
                    stats["already_exists"] += 1
                else:
                    if not dry_run:
                        # Создать placeholder
                        if media_file.endswith('.mp4'):
                            create_placeholder_video(file_path)
                            print(f"[PLACEHOLDER] {product_id}/{media_file} (видео-маркер)")
                        else:
                            create_placeholder_image(width, height, "Awaiting\nMaster Shot", file_path)
                            print(f"[PLACEHOLDER] {product_id}/{media_file} ({width}x{height})")
                    else:
                        print(f"[WOULD CREATE] {product_id}/{media_file}")
                    
                    stats["placeholders_created"] += 1
                    created_files.append({
                        "product_id": product_id,
                        "sku": sku,
                        "file": media_file,
                        "path": str(file_path)
                    })
    
    # Вывод статистики
    print("\n" + "=" * 70)
    print(f"{label} Статистика:")
    print(f"  Продуктов обработано: {stats['total_products']}")
    print(f"  Директорий создано: {stats['directories_created']}")
    print(f"  Placeholder'ов создано: {stats['placeholders_created']}")
    print(f"  Файлов уже существует: {stats['already_exists']}")
    
    if not dry_run and created_files:
        print(f"\n[SUCCESS] Создано {stats['placeholders_created']} placeholder'ов")
    
    return stats, created_files

if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    
    try:
        stats, created = generate_placeholders(dry_run)
        sys.exit(0)
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
