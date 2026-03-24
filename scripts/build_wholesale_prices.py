#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
HAORI VISION — Wholesale Price List Generator

Reads buyers_catalog.json and generates formatted wholesale price lists
with MOQ, price breakpoints, and volume discounts.

Usage:
    python scripts/build_wholesale_prices.py
    npm run buyers:wholesale_prices
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Force UTF-8 output on Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

# Paths
ROOT_DIR = Path(__file__).resolve().parent.parent
CATALOG_FILE = ROOT_DIR / "data" / "buyers_catalog.json"
OUTPUT_DIR = ROOT_DIR / "buyers" / "price"
OUTPUT_FILE = OUTPUT_DIR / f"Wholesale_Price_List_{datetime.now().strftime('%Y%m%d')}.txt"

def load_catalog():
    """Load buyers catalog data"""
    if not CATALOG_FILE.exists():
        raise FileNotFoundError(f"Catalog file not found: {CATALOG_FILE}")

    with open(CATALOG_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def calculate_discount_price(base_price, discount_percent):
    """Calculate price after discount"""
    return base_price * (1 - discount_percent / 100)

def format_price(price, currency="EUR"):
    """Format price with currency symbol"""
    return f"EUR {price:,.2f}" if currency == "EUR" else f"{price:,.2f} {currency}"

def generate_price_list(catalog):
    """Generate formatted wholesale price list"""
    output = []

    # Header
    output.append("=" * 80)
    output.append("HAORI VISION - WHOLESALE PRICE LIST")
    output.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    output.append(f"Version: {catalog.get('version', 'N/A')}")
    output.append("=" * 80)
    output.append("")

    # Wholesale Terms
    wholesale = catalog.get("wholesale", {})
    min_order = wholesale.get("minimumOrder", {})

    output.append("WHOLESALE TERMS")
    output.append("-" * 80)
    output.append(f"Minimum Order Value: {format_price(min_order.get('value', 0), min_order.get('currency', 'EUR'))}")
    output.append(f"Payment Terms: {wholesale.get('paymentTerms', 'N/A')}")
    output.append(f"Shipping Terms: {wholesale.get('shippingTerms', 'N/A')}")
    output.append("")

    # Discount Tiers
    output.append("VOLUME DISCOUNT TIERS")
    output.append("-" * 80)
    discount_tiers = wholesale.get("discountTiers", [])
    for tier in discount_tiers:
        min_amt = tier.get("minAmount", 0)
        discount = tier.get("discount", 0)
        output.append(f"  {format_price(min_amt)}+ : {discount}% discount")
    output.append("")

    # Products
    output.append("PRODUCT CATALOG")
    output.append("-" * 80)
    output.append("")

    products = catalog.get("products", [])
    for product in products:
        sku = product.get("sku", "N/A")
        name = product.get("name", "N/A")
        collection = product.get("collection", "N/A")
        wholesale_price = product.get("wholesalePrice", 0)
        retail_price = product.get("retailPrice", 0)
        currency = product.get("currency", "EUR")
        moq = product.get("moq", "N/A")
        lead_time = product.get("leadTime", "N/A")
        colors = ", ".join(product.get("colors", []))
        sizes = ", ".join(product.get("availableSizes", []))

        output.append(f"[{sku}] {name}")
        output.append(f"  Collection: {collection}")
        output.append(f"  Wholesale Price: {format_price(wholesale_price, currency)}")
        output.append(f"  Retail Price: {format_price(retail_price, currency)} (50% margin)")
        output.append(f"  MOQ: {moq} units")
        output.append(f"  Lead Time: {lead_time}")
        output.append(f"  Colors: {colors}")
        output.append(f"  Sizes: {sizes}")

        # Volume pricing examples
        output.append("")
        output.append("  Volume Pricing Examples:")
        for tier in discount_tiers:
            discount = tier.get("discount", 0)
            if discount > 0:
                discounted_price = calculate_discount_price(wholesale_price, discount)
                output.append(f"    At {discount}% discount: {format_price(discounted_price, currency)}/unit")

        output.append("")
        output.append("-" * 80)
        output.append("")

    # Shipping Information
    shipping = catalog.get("shipping", {})
    regions = shipping.get("regions", [])

    output.append("SHIPPING RATES BY REGION")
    output.append("-" * 80)
    for region in regions:
        name = region.get("name", "N/A")
        cost = region.get("shippingCost", 0)
        free_threshold = region.get("freeShippingThreshold", 0)
        days = region.get("estimatedDays", "N/A")

        output.append(f"{name}:")
        output.append(f"  Standard Rate: {format_price(cost)}")
        output.append(f"  FREE shipping on orders over {format_price(free_threshold)}")
        output.append(f"  Estimated Delivery: {days}")
        output.append("")

    # Terms & Conditions
    terms = catalog.get("terms", {})
    output.append("TERMS & CONDITIONS")
    output.append("-" * 80)
    output.append(f"Returns: {terms.get('returnsPolicy', 'N/A')}")
    output.append(f"Cancellations: {terms.get('cancelPolicy', 'N/A')}")
    output.append(f"Damage Claims: {terms.get('damagePolicy', 'N/A')}")
    output.append(f"Exclusivity: {terms.get('exclusivity', 'N/A')}")
    output.append("")

    # Footer
    output.append("=" * 80)
    output.append("HAORI VISION")
    output.append("Email: wholesale@haorivision.com")
    output.append("Website: https://haorivision.com/buyers")
    output.append("=" * 80)

    return "\n".join(output)

def main():
    """Main execution"""
    print("")
    print("=" * 80)
    print("  HAORI VISION - Wholesale Price List Generator")
    print("=" * 80)
    print("")

    try:
        # Load catalog
        print(f"[1/3] Loading catalog from: {CATALOG_FILE}")
        catalog = load_catalog()
        print(f"      OK Loaded {len(catalog.get('products', []))} products")
        print("")

        # Generate price list
        print("[2/3] Generating wholesale price list...")
        price_list = generate_price_list(catalog)
        print(f"      OK Generated price list ({len(price_list.splitlines())} lines)")
        print("")

        # Save output
        print(f"[3/3] Saving to: {OUTPUT_FILE}")
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            f.write(price_list)
        print(f"      OK Saved successfully")
        print("")

        # Summary
        print("=" * 80)
        print("  SUCCESS: Wholesale Price List Generated")
        print("=" * 80)
        print("")
        print(f"Output file: {OUTPUT_FILE}")
        print("")
        print("Next steps:")
        print("  1. Review the generated price list")
        print("  2. Share with wholesale buyers via Buyers Lounge")
        print("  3. Update buyers/index.html to link to new price list")
        print("")

        return 0

    except FileNotFoundError as e:
        print(f"ERROR: {e}")
        return 1
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON in catalog file: {e}")
        return 1
    except Exception as e:
        print(f"ERROR: Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    exit(main())
