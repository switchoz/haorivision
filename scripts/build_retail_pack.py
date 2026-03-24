#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""HAORI VISION — Retail Pack Builder

Full implementation:
- Generate QR codes with shortlinks
- Fill SVG templates with product data
- Convert SVG → PDF/PNG at 300 DPI
- Package all materials into ZIP
"""

import sys
import csv
import json
import subprocess
import zipfile
import qrcode
from pathlib import Path
from datetime import datetime
from xml.etree import ElementTree as ET

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = Path(__file__).parent.parent
RETAIL_DIR = PROJECT_ROOT / 'retail'
TEMPLATES_DIR = RETAIL_DIR / 'templates'
DATA_DIR = RETAIL_DIR / 'data'
OUT_DIR = RETAIL_DIR / 'out'
SHORTLINKS_FILE = DATA_DIR / 'shortlinks.json'

# Product catalog (mock data)
PRODUCTS_CATALOG = {
    'ECLIPSE-01': {
        'name': 'Eclipse Haori',
        'price': 650,
        'description': ['Photochromic fabric changes color', 'in different lighting conditions.', 'UV-reactive patterns reveal hidden details.'],
        'features': ['UV-reactive coating', 'Photochromic fabric', 'Limited edition']
    },
    'ECLIPSE-02': {
        'name': 'Eclipse Haori Dark',
        'price': 650,
        'description': ['Deep black base with vibrant', 'UV-reactive accents.', 'Premium cotton blend.'],
        'features': ['UV-reactive coating', 'Premium cotton', 'Hand-crafted']
    },
    'LUMIN-01': {
        'name': 'Luminescence Jacket',
        'price': 720,
        'description': ['High-tech streetwear with', 'embedded photochromic fibers.', 'Adaptive to ambient light.'],
        'features': ['Photochromic fibers', 'Water-resistant', 'Reflective details']
    },
    'BLOOM-01': {
        'name': 'Bloom Haori',
        'price': 680,
        'description': ['Floral patterns that bloom', 'under UV light.', 'Organic cotton canvas.'],
        'features': ['UV-reactive print', 'Organic cotton', 'Botanical design']
    },
    'BLOOM-02': {
        'name': 'Bloom Haori Night',
        'price': 680,
        'description': ['Midnight edition with subtle', 'UV floral patterns.', 'Soft brushed cotton.'],
        'features': ['UV-reactive print', 'Brushed cotton', 'Night garden theme']
    }
}

def load_shortlinks():
    """Load existing shortlinks or create new file"""
    if not SHORTLINKS_FILE.exists():
        return {'links': []}
    with open(SHORTLINKS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_shortlinks(data):
    """Save shortlinks to JSON"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(SHORTLINKS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def generate_shortlink_for_sku(sku, campaign):
    """Generate shortlink using qr_shortlink.mjs"""
    import hashlib
    hash_str = f"{sku}-{campaign}-{datetime.now().timestamp()}"
    hash_hex = hashlib.sha256(hash_str.encode()).hexdigest()[:8]

    short_url = f"https://haorivision.com/p/{hash_hex}"
    utm_params = f"utm_source=popup&utm_medium=qr&utm_campaign={campaign}&utm_content={sku}"
    long_url = f"https://haorivision.com/product/{sku}?{utm_params}"

    link = {
        'hash': hash_hex,
        'shortUrl': short_url,
        'longUrl': long_url,
        'sku': sku,
        'campaign': campaign,
        'createdAt': datetime.now().isoformat(),
        'clicks': 0
    }

    # Save to shortlinks.json
    data = load_shortlinks()
    data['links'].append(link)
    save_shortlinks(data)

    return link

def generate_qr_code(url, output_path):
    """Generate QR code image"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    img.save(output_path)

def fill_svg_template(template_path, output_path, replacements):
    """Fill SVG template with data"""
    with open(template_path, 'r', encoding='utf-8') as f:
        svg_content = f.read()

    for key, value in replacements.items():
        svg_content = svg_content.replace(f'{{{{{key}}}}}', str(value))

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)

def svg_to_png(svg_path, png_path, dpi=300):
    """Convert SVG to PNG at specified DPI (requires Inkscape or cairosvg)"""
    try:
        # Try using cairosvg (Python library)
        import cairosvg
        cairosvg.svg2png(
            url=str(svg_path),
            write_to=str(png_path),
            dpi=dpi
        )
        return True
    except ImportError:
        # Fallback: Try Inkscape command line
        try:
            subprocess.run([
                'inkscape',
                str(svg_path),
                '--export-filename=' + str(png_path),
                '--export-dpi=' + str(dpi)
            ], check=True, capture_output=True)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            print(f"⚠️  Could not convert {svg_path.name} to PNG (install cairosvg or Inkscape)")
            return False

def build_price_tag(sku, product, link, campaign_date):
    """Build price tag A7 for a SKU"""
    template = TEMPLATES_DIR / 'price_tag_A7.svg'
    filled_svg = OUT_DIR / f'price_tag_{sku}.svg'
    png_output = OUT_DIR / f'price_tag_{sku}.png'
    qr_path = OUT_DIR / f'qr_{sku}.png'

    # Generate QR code
    generate_qr_code(link['shortUrl'], qr_path)

    # Fill template
    replacements = {
        'PRODUCT_NAME': product['name'],
        'SKU': sku,
        'PRICE': product['price']
    }

    fill_svg_template(template, filled_svg, replacements)

    # Convert to PNG
    svg_to_png(filled_svg, png_output, dpi=300)

    return filled_svg, png_output, qr_path

def build_qr_card(sku, product, link, campaign_date):
    """Build QR card A6 for a SKU"""
    template = TEMPLATES_DIR / 'qr_card_A6.svg'
    filled_svg = OUT_DIR / f'qr_card_{sku}.svg'
    png_output = OUT_DIR / f'qr_card_{sku}.png'

    # Fill template
    replacements = {
        'PRODUCT_NAME': product['name'],
        'DESCRIPTION_LINE1': product['description'][0],
        'DESCRIPTION_LINE2': product['description'][1],
        'DESCRIPTION_LINE3': product['description'][2],
        'FEATURE_1': product['features'][0],
        'FEATURE_2': product['features'][1],
        'FEATURE_3': product['features'][2],
        'SHORT_CODE': link['hash']
    }

    fill_svg_template(template, filled_svg, replacements)

    # Convert to PNG
    svg_to_png(filled_svg, png_output, dpi=300)

    return filled_svg, png_output

def build_care_instructions():
    """Copy care instructions (no dynamic data)"""
    care_ru_svg = TEMPLATES_DIR / 'care_A6_ru.svg'
    care_en_svg = TEMPLATES_DIR / 'care_A6_en.svg'

    care_ru_png = OUT_DIR / 'care_instructions_RU.png'
    care_en_png = OUT_DIR / 'care_instructions_EN.png'

    svg_to_png(care_ru_svg, care_ru_png, dpi=300)
    svg_to_png(care_en_svg, care_en_png, dpi=300)

    return [care_ru_png, care_en_png]

def build_uv_safety():
    """Copy UV safety cards (no dynamic data)"""
    uv_ru_svg = TEMPLATES_DIR / 'uv_safety_A5_ru.svg'
    uv_en_svg = TEMPLATES_DIR / 'uv_safety_A5_en.svg'

    uv_ru_png = OUT_DIR / 'uv_safety_RU.png'
    uv_en_png = OUT_DIR / 'uv_safety_EN.png'

    svg_to_png(uv_ru_svg, uv_ru_png, dpi=300)
    svg_to_png(uv_en_svg, uv_en_png, dpi=300)

    return [uv_ru_png, uv_en_png]

def create_zip_package(files, campaign_date):
    """Package all files into ZIP"""
    zip_path = OUT_DIR / f'Retail_Pack_{campaign_date}.zip'

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file_path in files:
            if file_path.exists():
                zipf.write(file_path, file_path.name)

    return zip_path

def main():
    print('\n🏪 HAORI VISION — Retail Pack Builder\n')

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Load SKUs
    sku_file = DATA_DIR / 'sku_pop_up.csv'
    if not sku_file.exists():
        print('❌ sku_pop_up.csv not found')
        return

    with open(sku_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        skus = list(reader)

    print(f'📦 Found {len(skus)} SKUs for pop-up\n')

    campaign_date = datetime.now().strftime('%Y-%m-%d')
    campaign = f'stockholm-popup-{campaign_date}'

    all_files = []

    # Build materials for each SKU
    for sku_data in skus:
        sku = sku_data['sku']
        qty = int(sku_data['quantity'])

        if sku not in PRODUCTS_CATALOG:
            print(f'⚠️  {sku} not found in catalog, skipping')
            continue

        product = PRODUCTS_CATALOG[sku]

        print(f'🔨 Building materials for {sku} (qty: {qty})')

        # Generate shortlink
        link = generate_shortlink_for_sku(sku, campaign)
        print(f'   🔗 Shortlink: {link["shortUrl"]}')

        # Build price tag
        price_tag_svg, price_tag_png, qr_path = build_price_tag(sku, product, link, campaign_date)
        print(f'   ✅ Price tag: {price_tag_png.name}')
        all_files.extend([price_tag_svg, price_tag_png, qr_path])

        # Build QR card
        qr_card_svg, qr_card_png = build_qr_card(sku, product, link, campaign_date)
        print(f'   ✅ QR card: {qr_card_png.name}')
        all_files.extend([qr_card_svg, qr_card_png])

        print()

    # Build care instructions (once)
    print('📋 Building care instructions...')
    care_files = build_care_instructions()
    all_files.extend(care_files)
    print('   ✅ Care instructions (RU/EN)')

    # Build UV safety (once)
    print('⚠️  Building UV safety cards...')
    uv_files = build_uv_safety()
    all_files.extend(uv_files)
    print('   ✅ UV safety cards (RU/EN)')

    # Create README
    readme = OUT_DIR / 'README.txt'
    readme.write_text(f'''HAORI VISION — Retail Pack
Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}
Campaign: {campaign}

Contents:
- Price tags (A7) for each SKU with QR codes
- QR cards (A6) with product information
- Care instructions (A6 RU/EN)
- UV safety cards (A5 RU/EN)

Print Settings:
- Format: PNG (300 DPI)
- Color: RGB → Convert to CMYK before print
- Paper: Premium matte, 250gsm
- Finish: Matte lamination recommended

QR Shortlinks:
All shortlinks stored in: retail/data/shortlinks.json
Track analytics at: /admin/retail_dashboard.html

Notes:
- Price tags: 1 per SKU quantity
- QR cards: 1-2 per display location
- Care instructions: 2-3 copies at checkout
- UV safety: 1-2 at entrance/display

Support: haorivision.com/retail-support
''', encoding='utf-8')

    all_files.append(readme)

    # Create ZIP package
    print(f'\n📦 Creating ZIP package...')
    zip_path = create_zip_package(all_files, campaign_date)
    print(f'   ✅ Package created: {zip_path.name}')

    print(f'\n✅ Retail pack complete!')
    print(f'📁 Output directory: {OUT_DIR}')
    print(f'📊 Shortlinks saved: {SHORTLINKS_FILE}')
    print(f'\n💡 Next steps:')
    print(f'   1. Review files in {OUT_DIR}')
    print(f'   2. Convert PNG to CMYK if needed')
    print(f'   3. Send to print shop')
    print(f'   4. Track QR analytics in retail dashboard\n')

if __name__ == '__main__':
    main()
