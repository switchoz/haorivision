#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json, sys, os
from pathlib import Path
from datetime import datetime
from string import Template

if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

PROJECT_ROOT = Path(__file__).parent.parent
CATALOG_FILE = PROJECT_ROOT / "data" / "products" / "collections.json"
TEMPLATE_FILE = PROJECT_ROOT / "templates" / "product_template.html"
PAGES_DIR = PROJECT_ROOT / "public" / "products"
RELEASE_TRACKER = PROJECT_ROOT / ".last_pages_build.json"
REPORTS_DIR = PROJECT_ROOT / "reports"

def load_catalog():
    with open(CATALOG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def load_template():
    """Загрузить HTML шаблон"""
    if not TEMPLATE_FILE.exists():
        raise FileNotFoundError(f"Шаблон не найден: {TEMPLATE_FILE}")
    with open(TEMPLATE_FILE, "r", encoding="utf-8") as f:
        return f.read()

def load_release_tracker():
    """Загрузить информацию о последнем релизе"""
    if RELEASE_TRACKER.exists():
        with open(RELEASE_TRACKER, "r") as f:
            return json.load(f)
    return {"last_build": None, "built_skus": []}

def save_release_tracker(data):
    """Сохранить информацию о релизе"""
    with open(RELEASE_TRACKER, "w") as f:
        json.dump(data, f, indent=2)

def is_new_product(product, tracker):
    """Проверить, является ли продукт новым"""
    sku = product.get("sku", "")
    
    # Если это первый запуск - все продукты новые
    if not tracker.get("last_build"):
        return True
    
    # Если SKU уже был построен - пропускаем
    if sku in tracker.get("built_skus", []):
        return False
    
    return True

def render_product_page(product, template):
    """Отрендерить страницу продукта"""
    # Подготовка данных для шаблона
    product_id = product.get("id", "")
    sku = product.get("sku", "Unknown")
    name = product.get("name") or product.get("title", "Unnamed Product")
    description = product.get("description", "Описание отсутствует")
    
    # Цена
    price = product.get("price_eur") or product.get("price", 0)
    
    # Медиа
    media_path = f"/media/products/{product_id}"
    
    # Размеры
    dimensions = product.get("dimensions", {})
    size = f"{dimensions.get('length', 'N/A')} x {dimensions.get('width', 'N/A')}" if dimensions else "N/A"
    
    # Материалы
    materials = product.get("materials", {})
    fabric = materials.get("fabric", "Silk")
    
    # Простой шаблон для замены (используем базовые замены вместо сложного Template)
    html = template
    html = html.replace("{{PRODUCT_ID}}", product_id)
    html = html.replace("{{PRODUCT_NAME}}", name)
    html = html.replace("{{PRODUCT_SKU}}", sku)
    html = html.replace("{{PRODUCT_DESCRIPTION}}", description)
    html = html.replace("{{PRODUCT_PRICE}}", str(price))
    html = html.replace("{{MEDIA_PATH}}", media_path)
    html = html.replace("{{PRODUCT_SIZE}}", size)
    html = html.replace("{{PRODUCT_FABRIC}}", fabric)
    
    return html

def build_pages(dry_run=False):
    """Построить страницы продуктов"""
    label = "[DRY-RUN]" if dry_run else "[BUILD]"
    print(f"{label} Генерация страниц продуктов")
    print("-" * 70)
    
    # Загрузить данные
    catalog = load_catalog()
    template = load_template()
    tracker = load_release_tracker()
    
    stats = {
        "total_products": 0,
        "new_products": 0,
        "existing_skipped": 0,
        "pages_built": 0
    }
    
    built_pages = []
    
    # Создать директорию для страниц
    if not dry_run:
        PAGES_DIR.mkdir(parents=True, exist_ok=True)
    
    # Обработка продуктов
    for collection in catalog.get("collections", []):
        for product in collection.get("products", []):
            stats["total_products"] += 1
            
            sku = product.get("sku", "")
            product_id = product.get("id", "")
            
            if not sku or not product_id:
                continue
            
            # Путь к файлу страницы
            page_file = PAGES_DIR / f"{sku}.html"
            
            # Проверка: новый продукт?
            if not is_new_product(product, tracker):
                stats["existing_skipped"] += 1
                print(f"[SKIP] {sku}: уже существует")
                continue
            
            # Проверка: файл уже существует?
            if page_file.exists():
                stats["existing_skipped"] += 1
                print(f"[SKIP] {sku}: файл {page_file.name} уже существует")
                continue
            
            stats["new_products"] += 1
            
            # Генерация страницы
            if not dry_run:
                html = render_product_page(product, template)
                
                with open(page_file, "w", encoding="utf-8") as f:
                    f.write(html)
                
                print(f"[CREATED] {sku} -> {page_file.name}")
            else:
                print(f"[WOULD CREATE] {sku} -> {page_file.name}")
            
            stats["pages_built"] += 1
            built_pages.append({
                "sku": sku,
                "product_id": product_id,
                "name": product.get("name") or product.get("title", "?"),
                "file": str(page_file)
            })
    
    # Обновить tracker (если не dry-run)
    if not dry_run and built_pages:
        new_skus = [p["sku"] for p in built_pages]
        tracker["last_build"] = datetime.now().isoformat()
        tracker["built_skus"] = tracker.get("built_skus", []) + new_skus
        save_release_tracker(tracker)
        print(f"\n[TRACKER] Обновлён: {len(new_skus)} новых SKU")
    
    # Вывод статистики
    print("\n" + "=" * 70)
    print(f"{label} Статистика:")
    print(f"  Продуктов всего: {stats['total_products']}")
    print(f"  Новых продуктов: {stats['new_products']}")
    print(f"  Пропущено (уже есть): {stats['existing_skipped']}")
    print(f"  Страниц построено: {stats['pages_built']}")
    
    # Создать отчёт
    create_report(stats, built_pages, dry_run)
    
    return stats, built_pages

def create_report(stats, built_pages, dry_run):
    """Создать отчёт о генерации страниц"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_path = REPORTS_DIR / f"product_pages_build_{timestamp}.txt"
    
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("=" * 70 + "\n")
        f.write("PRODUCT PAGES BUILD REPORT\n")
        f.write("=" * 70 + "\n\n")
        
        f.write(f"Дата: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Режим: {'DRY-RUN' if dry_run else 'BUILD'}\n\n")
        
        f.write(f"Продуктов всего: {stats['total_products']}\n")
        f.write(f"Новых: {stats['new_products']}\n")
        f.write(f"Пропущено: {stats['existing_skipped']}\n")
        f.write(f"Построено: {stats['pages_built']}\n\n")
        
        if built_pages:
            f.write("-" * 70 + "\n")
            f.write("ПОСТРОЕННЫЕ СТРАНИЦЫ\n")
            f.write("-" * 70 + "\n")
            for page in built_pages:
                f.write(f"SKU: {page['sku']}\n")
                f.write(f"ID: {page['product_id']}\n")
                f.write(f"Название: {page['name']}\n")
                f.write(f"Файл: {page['file']}\n\n")
    
    print(f"\n[REPORT] {report_path}")

if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    
    try:
        stats, pages = build_pages(dry_run)
        sys.exit(0)
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
