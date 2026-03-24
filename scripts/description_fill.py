#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json, sys, shutil
from pathlib import Path
from datetime import datetime

if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

PROJECT_ROOT = Path(__file__).parent.parent
CATALOG_FILE = PROJECT_ROOT / "data" / "products" / "collections.json"
REPORTS_DIR = PROJECT_ROOT / "reports"

# Шаблоны описаний в тоне бренда HAORI VISION
DESCRIPTION_TEMPLATES = {
    "haori": [
        "Авторское хаори ручной работы с флюоресцентной росписью, которая проявляется в UV-свете. Каждая деталь создана вручную с использованием светящихся пигментов высочайшего качества.\n\nЛимитированная серия. В комплекте с картиной-компаньоном, создающей единое художественное пространство. Дыхание света, заключённое в ткань.",
        
        "Уникальное хаори с ручной UV-росписью. При дневном свете — минималистичная элегантность, в ультрафиолете — взрыв скрытой энергии.\n\nКаждый экземпляр пронумерован и подписан автором. В паре с авторской картиной формирует целостный арт-объект. Ограниченный тираж.",
        
        "Хаори ручной работы с флюоресцентными пигментами. Скрытые световые узоры раскрываются только под UV-излучением, создавая эффект живой картины на ткани.\n\nЧасть лимитированной коллекции. Поставляется с картиной-компаньоном для создания полного художественного опыта."
    ],
    
    "companion_painting": [
        "Авторская картина-компаньон, созданная теми же флюоресцентными пигментами. Визуальное продолжение паттерна хаори в формате настенного искусства.\n\nПри включении UV-подсветки превращается в живую световую инсталляцию. Ограниченная серия, каждая работа уникальна.",
        
        "Картина-компаньон к хаори, выполненная вручную с использованием UV-активных красок. Под обычным светом — утончённая графика, под ультрафиолетом — пульсирующий световой космос.\n\nВходит в комплект с хаори, создавая единое пространство света и цвета. Лимитированный выпуск.",
        
        "Авторская работа на холсте с флюоресцентными пигментами. Дополняет и расширяет визуальную концепцию хаори, создавая диалог между одеждой и искусством.\n\nВключает UV-подсветку для полного раскрытия скрытых световых слоёв."
    ],
    
    "default": [
        "Уникальное произведение ручной работы с использованием UV-активных пигментов. Скрытая красота, проявляющаяся в ультрафиолете.\n\nЛимитированная серия. Каждый экземпляр пронумерован и несёт в себе философию света и тьмы, видимого и скрытого.",
        
        "Авторская работа с флюоресцентной росписью. Два состояния: утончённый минимализм при дневном свете и световая феерия под UV.\n\nЧасть ограниченной коллекции HAORI VISION. Ручная работа, уникальные световые эффекты."
    ]
}

def load_catalog():
    with open(CATALOG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def get_product_type(product):
    """Определить тип продукта"""
    ptype = product.get("type", "").lower()
    if "haori" in ptype: return "haori"
    elif "painting" in ptype or "canvas" in ptype: return "companion_painting"
    return "default"

def generate_description(product):
    """Сгенерировать описание для продукта"""
    # Если description уже есть - не трогаем
    if product.get("description"):
        return None
    
    # Определить тип продукта
    product_type = get_product_type(product)
    
    # Выбрать шаблон (первый для простоты, можно сделать ротацию по номеру)
    templates = DESCRIPTION_TEMPLATES.get(product_type, DESCRIPTION_TEMPLATES["default"])
    
    # Использовать первый шаблон
    return templates[0]

def apply_descriptions(dry_run=False):
    label = "[DRY-RUN]" if dry_run else "[APPLY]"
    print(f"{label} Заполнение описаний")
    
    catalog = load_catalog()
    stats = {"total": 0, "with_desc": 0, "without_desc": 0, "filled": 0, "skipped": 0}
    changes = []
    
    for collection in catalog.get("collections", []):
        cid = collection.get("id", "Unknown")
        for product in collection.get("products", []):
            stats["total"] += 1
            
            if product.get("description"):
                stats["with_desc"] += 1
                stats["skipped"] += 1
            else:
                stats["without_desc"] += 1
                new_desc = generate_description(product)
                
                if new_desc:
                    if not dry_run:
                        product["description"] = new_desc
                    
                    changes.append({
                        "collection": cid,
                        "sku": product.get("sku", "?"),
                        "name": product.get("name") or product.get("title", "?"),
                        "type": product.get("type", "?"),
                        "description": new_desc[:100] + "..." if len(new_desc) > 100 else new_desc
                    })
                    
                    stats["filled"] += 1
                else:
                    stats["skipped"] += 1
    
    print(f"\n{label} Статистика: всего={stats['total']}, заполнено={stats['filled']}")
    
    if changes:
        print(f"\n{label} Заполненные описания:")
        for c in changes:
            print(f"  [{c['sku']}] {c['name']}")
            print(f"    Тип: {c['type']}")
            print(f"    Описание: {c['description']}")
            print()
    
    if not dry_run and changes:
        backup_dir = CATALOG_FILE.parent / "backups"
        backup_dir.mkdir(exist_ok=True)
        backup = backup_dir / f"collections_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.json"
        shutil.copy2(CATALOG_FILE, backup)
        
        with open(CATALOG_FILE, "w", encoding="utf-8") as f:
            json.dump(catalog, f, indent=2, ensure_ascii=False)
        
        print(f"[SAVE] {CATALOG_FILE}")
        print(f"[BACKUP] {backup}")
    
    # Создать отчёт
    report = REPORTS_DIR / f"description_fill_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    REPORTS_DIR.mkdir(exist_ok=True)
    
    with open(report, "w", encoding="utf-8") as f:
        f.write("DESCRIPTION FILL REPORT\n" + "="*70 + "\n\n")
        f.write(f"Дата: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Режим: {'DRY-RUN' if dry_run else 'ПРИМЕНЕНИЕ'}\n\n")
        f.write(f"Заполнено: {stats['filled']}\n\n")
        
        for c in changes:
            f.write(f"SKU: {c['sku']}\n")
            f.write(f"Название: {c['name']}\n")
            f.write(f"Тип: {c['type']}\n")
            f.write(f"Описание:\n{changes[0]['description'] if changes else ''}\n")
            f.write("-" * 70 + "\n")
    
    print(f"[REPORT] {report}")
    return stats, changes

if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    apply_descriptions(dry_run)
