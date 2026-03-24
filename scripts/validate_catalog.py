#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import sys
from pathlib import Path
from datetime import datetime

if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

PROJECT_ROOT = Path(__file__).parent.parent
CATALOG_FILE = PROJECT_ROOT / "data" / "products" / "collections.json"
REPORTS_DIR = PROJECT_ROOT / "reports"

VALIDATION_RULES = {
    "id": {"required": True, "type": str, "min_length": 1},
    "size": {"enum": ["A2", "A3", "custom"], "required": False},
    "price": {"required": False, "type": (int, float), "min": 0, "exclusive_min": True},
    "edition": {"required": False, "type": int, "min": 1, "max": 999},
    "totalEditions": {"required": False, "type": int, "min": 1, "max": 999},
    "status": {"enum": ["available", "reserved", "sold_out", "active", "draft"], "required": False},
    "description": {"required": False, "type": str, "min_length": 20, "max_length": 2000}
}

class CatalogValidator:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.stats = {"total_collections": 0, "total_products": 0, "valid_products": 0, "invalid_products": 0}

    def validate_field(self, product, field_name, rules, sku="Unknown"):
        value = product.get(field_name)
        if rules.get("required") and value is None:
            self.errors.append(f"[{sku}] Отсутствует обязательное поле '{field_name}'")
            return False
        if value is None:
            return True
        if "type" in rules and not isinstance(value, rules["type"]):
            self.errors.append(f"[{sku}] Поле '{field_name}': неверный тип")
            return False
        if "enum" in rules and value not in rules["enum"]:
            self.errors.append(f"[{sku}] Поле '{field_name}': недопустимое значение '{value}'")
            return False
        if "min_length" in rules and isinstance(value, str) and len(value) < rules["min_length"]:
            self.errors.append(f"[{sku}] Поле '{field_name}': слишком короткое ({len(value)} < {rules['min_length']})")
            return False
        if "max_length" in rules and isinstance(value, str) and len(value) > rules["max_length"]:
            self.errors.append(f"[{sku}] Поле '{field_name}': слишком длинное ({len(value)} > {rules['max_length']})")
            return False
        if "min" in rules and isinstance(value, (int, float)):
            if rules.get("exclusive_min") and value <= rules["min"]:
                self.errors.append(f"[{sku}] Поле '{field_name}': значение {value} должно быть > {rules['min']}")
                return False
            elif not rules.get("exclusive_min") and value < rules["min"]:
                self.errors.append(f"[{sku}] Поле '{field_name}': значение {value} < {rules['min']}")
                return False
        if "max" in rules and isinstance(value, (int, float)) and value > rules["max"]:
            self.errors.append(f"[{sku}] Поле '{field_name}': значение {value} > {rules['max']}")
            return False
        return True

    def validate_product(self, product, collection_id="Unknown"):
        sku = product.get("sku") or product.get("id") or "NO_SKU"
        is_valid = True
        if not self.validate_field(product, "id", VALIDATION_RULES["id"], sku):
            is_valid = False
        if not (product.get("title") or product.get("name")):
            self.errors.append(f"[{sku}] Отсутствует поле 'title' или 'name'")
            is_valid = False
        if "size" in product and not self.validate_field(product, "size", VALIDATION_RULES["size"], sku):
            is_valid = False
        price_field = "price_eur" if "price_eur" in product else "price" if "price" in product else None
        if price_field and not self.validate_field(product, price_field, VALIDATION_RULES["price"], sku):
            is_valid = False
        if "description" in product and not self.validate_field(product, "description", VALIDATION_RULES["description"], sku):
            is_valid = False
        return is_valid

    def validate_catalog(self):
        print(f"[VALIDATION] {CATALOG_FILE}")
        if not CATALOG_FILE.exists():
            self.errors.append("Файл каталога не найден")
            return False
        try:
            with open(CATALOG_FILE, "r", encoding="utf-8") as f:
                catalog = json.load(f)
        except Exception as e:
            self.errors.append(f"Ошибка чтения файла: {e}")
            return False
        if "collections" not in catalog:
            self.errors.append("Отсутствует поле 'collections'")
            return False
        collections = catalog["collections"]
        self.stats["total_collections"] = len(collections)
        for collection in collections:
            if "products" not in collection:
                continue
            for product in collection["products"]:
                self.stats["total_products"] += 1
                if self.validate_product(product, collection.get("id", "Unknown")):
                    self.stats["valid_products"] += 1
                else:
                    self.stats["invalid_products"] += 1
        print(f"\n[STATS]")
        print(f"  Коллекций: {self.stats['total_collections']}")
        print(f"  Продуктов: {self.stats['total_products']}")
        print(f"  Валидных: {self.stats['valid_products']}")
        print(f"  Невалидных: {self.stats['invalid_products']}")
        return len(self.errors) == 0

    def generate_report(self):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_path = REPORTS_DIR / f"catalog_validation_{timestamp}.txt"
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)
        with open(report_path, "w", encoding="utf-8") as f:
            f.write("=" * 70 + "\n")
            f.write("CATALOG VALIDATION REPORT\n")
            f.write("=" * 70 + "\n\n")
            f.write(f"Дата: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write(f"Коллекций: {self.stats['total_collections']}\n")
            f.write(f"Продуктов: {self.stats['total_products']}\n")
            f.write(f"Валидных: {self.stats['valid_products']}\n")
            f.write(f"Невалидных: {self.stats['invalid_products']}\n\n")
            if self.errors:
                f.write("-" * 70 + "\n")
                f.write("ОШИБКИ\n")
                f.write("-" * 70 + "\n")
                for i, error in enumerate(self.errors, 1):
                    f.write(f"{i}. {error}\n")
                f.write("\n")
            f.write("-" * 70 + "\n")
            f.write("ВАЛИДАЦИЯ ПРОЙДЕНА\n" if not self.errors else "ВАЛИДАЦИЯ НЕ ПРОЙДЕНА\n")
            f.write("-" * 70 + "\n")
        print(f"\n[REPORT] {report_path}")
        return report_path

if __name__ == "__main__":
    validator = CatalogValidator()
    is_valid = validator.validate_catalog()
    validator.generate_report()
    if validator.errors:
        print(f"\n[ERRORS] {len(validator.errors)} ошибок")
        for e in validator.errors[:5]:
            print(f"  - {e}")
    sys.exit(0 if is_valid else 1)
