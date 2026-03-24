#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json, sys, shutil, re
from pathlib import Path
from datetime import datetime

if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

PROJECT_ROOT = Path(__file__).parent.parent
CATALOG_FILE = PROJECT_ROOT / "data" / "products" / "collections.json"
REPORTS_DIR = PROJECT_ROOT / "reports"

def load_catalog():
    with open(CATALOG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def determine_series_from_id(product_id):
    if not product_id: return "DEFAULT"
    pid_upper = product_id.upper()
    if "ECLIPSE" in pid_upper: return "ECLIPSE"
    elif "LUMIN" in pid_upper: return "LUMIN SPIRIT"
    elif "BLOOM" in pid_upper: return "FLUO BLOOM"
    return "DEFAULT"

def extract_number_from_id(product_id, series):
    if not product_id: return None
    if series == "ECLIPSE":
        match = re.search(r'ECLIPSE-(\d+)', product_id, re.I)
    elif series == "LUMIN SPIRIT":
        match = re.search(r'LUMIN-(\d+)', product_id, re.I)
    elif series == "FLUO BLOOM":
        match = re.search(r'BLOOM-(\d+)', product_id, re.I)
    else:
        match = re.search(r'HV-\d{6}-(\d+)', product_id)
    return match.group(1) if match else None

def generate_title(product):
    if product.get("title") or product.get("name"): return None
    product_id = product.get("id", "")
    series = determine_series_from_id(product_id)
    number = extract_number_from_id(product_id, series)
    if series == "ECLIPSE" and number: return f"ECLIPSE // {number}"
    elif series == "LUMIN SPIRIT" and number: return f"LUMIN SPIRIT // {number}"
    elif series == "FLUO BLOOM" and number: return f"FLUO BLOOM // {number}"
    elif product_id: return f"HAORI VISION // {product_id}"
    return None

def apply_auto_names(dry_run=False):
    label = "[DRY-RUN]" if dry_run else "[APPLY]"
    print(f"{label} Автогенерация названий")
    catalog = load_catalog()
    stats = {"total": 0, "with_title": 0, "without_title": 0, "generated": 0, "skipped": 0}
    changes = []
    for collection in catalog.get("collections", []):
        cid = collection.get("id", "Unknown")
        for product in collection.get("products", []):
            stats["total"] += 1
            if product.get("title") or product.get("name"):
                stats["with_title"] += 1
                stats["skipped"] += 1
            else:
                stats["without_title"] += 1
                new_title = generate_title(product)
                if new_title:
                    if not dry_run: product["title"] = new_title
                    changes.append({"collection": cid, "sku": product.get("sku","?"), "id": product.get("id","?"), "title": new_title})
                    stats["generated"] += 1
                else:
                    stats["skipped"] += 1
    print(f"\n{label} Статистика: всего={stats['total']}, сгенерировано={stats['generated']}")
    if changes:
        for c in changes: print(f"  [{c['sku']}] {c['title']}")
    if not dry_run and changes:
        backup_dir = CATALOG_FILE.parent / "backups"
        backup_dir.mkdir(exist_ok=True)
        backup = backup_dir / f"collections_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.json"
        shutil.copy2(CATALOG_FILE, backup)
        with open(CATALOG_FILE, "w", encoding="utf-8") as f:
            json.dump(catalog, f, indent=2, ensure_ascii=False)
        print(f"[SAVE] {CATALOG_FILE}")
    report = REPORTS_DIR / f"auto_name_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    REPORTS_DIR.mkdir(exist_ok=True)
    with open(report, "w", encoding="utf-8") as f:
        f.write(f"AUTO-NAME REPORT\n{'='*70}\n")
        f.write(f"Сгенерировано: {stats['generated']}\n")
        for c in changes: f.write(f"{c['sku']}: {c['title']}\n")
    print(f"[REPORT] {report}")
    return stats, changes

if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    apply_auto_names(dry_run)
