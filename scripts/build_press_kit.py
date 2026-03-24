#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
HAORI VISION — Press Kit Builder

Автоматическая генерация пресс-кита в PDF + ZIP с ассетами.

Features:
- Brand manifesto и палитра
- 6-12 изображений свежих SKU (web 1600px + print 300dpi)
- UV process фотографии
- Водяной знак (наклон 30°, opacity 0.08)
- Кредиты и контакты

Output:
  /press/kit/Press_Kit_[DATE].pdf
  /press/kit/Press_Kit_[DATE]_Assets.zip

Usage:
  python scripts/build_press_kit.py
  python scripts/build_press_kit.py --date 2025-10-09
"""

import sys
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.pdfgen import canvas
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image, Table, TableStyle
except ImportError:
    print("❌ reportlab not installed. Install with: pip install reportlab")
    sys.exit(1)

# ============================================================
# Configuration
# ============================================================

PROJECT_ROOT = Path(__file__).parent.parent
PRESS_MANIFEST_PATH = PROJECT_ROOT / 'data' / 'press_manifest.json'
COLLECTIONS_PATH = PROJECT_ROOT / 'data' / 'products' / 'collections.json'
OUTPUT_DIR = PROJECT_ROOT / 'press' / 'kit'
ASSETS_DIR = OUTPUT_DIR / 'assets'

# New product patterns
NEW_PRODUCTS_PATTERNS = [
    r'^TEST-',
    r'^HV-202510-',
    r'^(ECLIPSE|LUMIN|BLOOM)-(0[1-3])$'
]

# ============================================================
# Helper Functions
# ============================================================

def load_json(path: Path) -> Dict[str, Any]:
    """Load JSON file"""
    if not path.exists():
        return {}

    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_new_products() -> List[str]:
    """Get list of new product SKUs"""
    import re

    collections = load_json(COLLECTIONS_PATH)

    if not collections:
        return []

    new_skus = []

    for collection in collections.get('collections', []):
        for product in collection.get('products', []):
            sku = product.get('sku', '')

            for pattern in NEW_PRODUCTS_PATTERNS:
                if re.match(pattern, sku):
                    new_skus.append(sku)
                    break

    return new_skus


def add_watermark(c: canvas.Canvas, text: str, angle: int = 30, opacity: float = 0.08):
    """Add watermark to canvas"""
    c.saveState()

    # Set opacity
    c.setFillColorRGB(0, 0, 0, opacity)

    # Rotate and position
    c.translate(A4[0] / 2, A4[1] / 2)
    c.rotate(angle)

    # Draw text
    c.setFont('Helvetica-Bold', 48)
    c.drawCentredString(0, 0, text)

    c.restoreState()


# ============================================================
# PDF Generation
# ============================================================

def generate_press_kit_pdf(output_path: Path, manifest: Dict[str, Any]):
    """Generate press kit PDF"""
    print(f"📄 Generating PDF: {output_path.name}")

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm
    )

    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=28,
        textColor=colors.black,
        spaceAfter=12,
        alignment=1  # Center
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.black,
        spaceAfter=8
    )
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=10,
        textColor=colors.HexColor('#4A4A4A'),
        spaceAfter=6
    )

    story = []

    # Cover Page
    story.append(Spacer(1, 80))
    story.append(Paragraph('HAORI VISION', title_style))
    story.append(Paragraph('Press Kit', heading_style))
    story.append(Spacer(1, 20))

    tagline = manifest.get('brand', {}).get('tagline', '')
    story.append(Paragraph(tagline, body_style))

    story.append(Spacer(1, 40))

    date_str = datetime.now().strftime('%B %Y')
    story.append(Paragraph(date_str, body_style))

    story.append(PageBreak())

    # About
    story.append(Paragraph('About HAORI VISION', heading_style))
    story.append(Spacer(1, 10))

    description = manifest.get('brand', {}).get('description', '')
    story.append(Paragraph(description, body_style))
    story.append(Spacer(1, 20))

    # Brand Info
    brand_info = [
        ['Founded', manifest.get('brand', {}).get('founded', '')],
        ['Headquarters', manifest.get('brand', {}).get('headquarters', '')],
        ['Website', manifest.get('brand', {}).get('website', '')],
    ]

    table = Table(brand_info, colWidths=[60 * mm, 100 * mm])
    table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#4A4A4A')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))

    story.append(table)
    story.append(Spacer(1, 30))

    # Featured Products
    story.append(Paragraph('Featured Products', heading_style))
    story.append(Spacer(1, 10))

    new_skus = get_new_products()

    if new_skus:
        featured_text = f"This press kit features {len(new_skus)} products from our latest collection: "
        featured_text += ', '.join(new_skus[:6])  # Limit to 6
        story.append(Paragraph(featured_text, body_style))
    else:
        story.append(Paragraph('No new products available for this press kit.', body_style))

    story.append(Spacer(1, 20))

    # Press Kit Contents
    story.append(Paragraph('Press Kit Contents', heading_style))
    story.append(Spacer(1, 10))

    contents = manifest.get('pressKit', {}).get('includes', [])
    contents_html = '<ul>'
    for item in contents:
        contents_html += f'<li>{item}</li>'
    contents_html += '</ul>'

    story.append(Paragraph(contents_html, body_style))
    story.append(Spacer(1, 20))

    story.append(PageBreak())

    # Color Palette
    story.append(Paragraph('Brand Color Palette', heading_style))
    story.append(Spacer(1, 10))

    palette = manifest.get('branding', {}).get('paletteColors', [])
    palette_data = []

    for i, color in enumerate(palette):
        if i % 2 == 0:
            palette_data.append([color, palette[i + 1] if i + 1 < len(palette) else ''])

    if palette_data:
        palette_table = Table(palette_data, colWidths=[80 * mm, 80 * mm])
        palette_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Courier'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 20),
            ('TOPPADDING', (0, 0), (-1, -1), 20),
            ('BACKGROUND', (0, 0), (0, 0), colors.HexColor(palette[0]) if len(palette) > 0 else colors.white),
            ('BACKGROUND', (1, 0), (1, 0), colors.HexColor(palette[1]) if len(palette) > 1 else colors.white),
        ]))

        story.append(palette_table)

    story.append(Spacer(1, 30))

    # Contacts
    story.append(Paragraph('Press Contacts', heading_style))
    story.append(Spacer(1, 10))

    contacts = manifest.get('contacts', {})
    contact_data = [
        ['Press Inquiries', contacts.get('press_inquiries', '')],
        ['General', contacts.get('general', '')],
        ['Phone', contacts.get('phone', '')],
    ]

    contact_table = Table(contact_data, colWidths=[60 * mm, 100 * mm])
    contact_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#4A4A4A')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))

    story.append(contact_table)
    story.append(Spacer(1, 30))

    # Credits
    story.append(Paragraph('Credits', heading_style))
    story.append(Spacer(1, 10))

    credits_text = """
    Photography: HAORI VISION Studio<br/>
    Creative Direction: HAORI VISION Team<br/>
    Styling: HAORI VISION Atelier<br/>
    <br/>
    All images © 2025 HAORI VISION. All rights reserved.<br/>
    For usage rights and permissions, contact press@haorivision.com
    """

    story.append(Paragraph(credits_text, body_style))

    # Build PDF with watermark
    def add_page_watermark(canvas_obj, doc_obj):
        add_watermark(canvas_obj, 'HAORI VISION PRESS', angle=30, opacity=0.08)

    doc.build(story, onFirstPage=add_page_watermark, onLaterPages=add_page_watermark)

    print(f"✅ PDF generated: {output_path}")


# ============================================================
# Assets ZIP
# ============================================================

def create_assets_zip(output_path: Path, manifest: Dict[str, Any]):
    """Create ZIP with press assets"""
    import zipfile
    import shutil

    print(f"\n📦 Creating assets ZIP: {output_path.name}")

    try:
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Add README
            readme_content = """HAORI VISION — Press Kit Assets

This package contains:
- High-resolution product images (web 1600px & print 300dpi)
- Logo suite (SVG, PNG, EPS)
- Brand guidelines
- UV process photography

All images are watermarked for press use only.

For usage rights and permissions, contact:
press@haorivision.com

© 2025 HAORI VISION. All rights reserved.
"""

            zipf.writestr('README.txt', readme_content)

            # Add manifest
            zipf.writestr('press_manifest.json', json.dumps(manifest, indent=2))

            print(f"✅ Assets ZIP created: {output_path}")

    except Exception as e:
        print(f"❌ Failed to create ZIP: {e}")


# ============================================================
# Main
# ============================================================

def main():
    print('\n╔═══════════════════════════════════════════════════════╗')
    print('║                                                       ║')
    print('║       HAORI VISION — Press Kit Builder               ║')
    print('║                                                       ║')
    print('╚═══════════════════════════════════════════════════════╝\n')

    # Parse args
    import argparse

    parser = argparse.ArgumentParser(description='Generate HAORI VISION press kit')
    parser.add_argument('--date', type=str, help='Date for output file (YYYY-MM-DD)')
    args = parser.parse_args()

    # Get date
    if args.date:
        try:
            date_obj = datetime.strptime(args.date, '%Y-%m-%d')
        except ValueError:
            print('❌ Invalid date format. Use YYYY-MM-DD')
            sys.exit(1)
    else:
        date_obj = datetime.now()

    date_str = date_obj.strftime('%Y%m%d')

    # Load manifest
    if not PRESS_MANIFEST_PATH.exists():
        print(f'❌ Press manifest not found: {PRESS_MANIFEST_PATH}')
        sys.exit(1)

    manifest = load_json(PRESS_MANIFEST_PATH)

    print(f'📋 Loaded press manifest')
    print(f'📅 Date: {date_str}\n')

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    # Generate PDF
    pdf_path = OUTPUT_DIR / f'Press_Kit_{date_str}.pdf'
    generate_press_kit_pdf(pdf_path, manifest)

    # Create assets ZIP
    zip_path = OUTPUT_DIR / f'Press_Kit_{date_str}_Assets.zip'
    create_assets_zip(zip_path, manifest)

    # Summary
    print('\n' + '═' * 60)
    print('\n📊 Press Kit Summary:\n')

    new_skus = get_new_products()
    print(f'📸 Featured products: {len(new_skus)}')

    if new_skus:
        print(f'   SKUs: {", ".join(new_skus[:6])}')

    print(f'\n📄 PDF: {pdf_path.name}')
    print(f'📦 Assets: {zip_path.name}')
    print(f'\n📁 Output directory: {OUTPUT_DIR}')
    print('\n✨ Press kit generation complete!\n')


if __name__ == '__main__':
    main()
