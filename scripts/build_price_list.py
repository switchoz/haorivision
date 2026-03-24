#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
HAORI VISION — Wholesale Price List Builder

Генерация приватного прайс-листа для байеров с водяным знаком.

Features:
- Оптовые цены из buyers_catalog.json
- Водяной знак "CONFIDENTIAL — BUYERS ONLY" (30°, opacity 0.08)
- MOQ, lead times, условия
- Версионированные файлы (никогда не перезаписывать)

Output:
  /buyers/price/Price_List_[DATE].pdf

Usage:
  python scripts/build_price_list.py
  python scripts/build_price_list.py --date 2025-10-09
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
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
except ImportError:
    print("❌ reportlab not installed. Install with: pip install reportlab")
    sys.exit(1)

# ============================================================
# Configuration
# ============================================================

PROJECT_ROOT = Path(__file__).parent.parent
BUYERS_CATALOG_PATH = PROJECT_ROOT / 'data' / 'buyers_catalog.json'
OUTPUT_DIR = PROJECT_ROOT / 'buyers' / 'price'

# ============================================================
# Helper Functions
# ============================================================

def load_json(path: Path) -> Dict[str, Any]:
    """Load JSON file"""
    if not path.exists():
        return {}

    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def add_watermark(c: canvas.Canvas, text: str, angle: int = 30, opacity: float = 0.08):
    """Add watermark to canvas"""
    c.saveState()

    # Set opacity
    c.setFillColorRGB(0.8, 0, 0, opacity)  # Red tint for confidential

    # Rotate and position
    c.translate(A4[0] / 2, A4[1] / 2)
    c.rotate(angle)

    # Draw text
    c.setFont('Helvetica-Bold', 42)
    c.drawCentredString(0, 0, text)

    c.restoreState()


def format_currency(amount: float, currency: str = 'EUR') -> str:
    """Format currency"""
    symbol = '€' if currency == 'EUR' else currency
    return f'{symbol}{amount:,.2f}'


# ============================================================
# PDF Generation
# ============================================================

def generate_price_list_pdf(output_path: Path, catalog: Dict[str, Any]):
    """Generate wholesale price list PDF"""
    print(f"📄 Generating price list: {output_path.name}")

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm
    )

    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.black,
        spaceAfter=8,
        alignment=1  # Center
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.black,
        spaceAfter=6
    )
    subheading_style = ParagraphStyle(
        'CustomSubheading',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=colors.HexColor('#4A4A4A'),
        spaceAfter=4
    )
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=9,
        textColor=colors.HexColor('#4A4A4A'),
        spaceAfter=4
    )
    confidential_style = ParagraphStyle(
        'Confidential',
        parent=styles['BodyText'],
        fontSize=8,
        textColor=colors.HexColor('#C62828'),
        spaceAfter=8,
        alignment=1
    )

    story = []

    # Header
    story.append(Spacer(1, 40))
    story.append(Paragraph('HAORI VISION', title_style))
    story.append(Paragraph('Wholesale Price List', heading_style))
    story.append(Spacer(1, 10))

    date_str = datetime.now().strftime('%B %d, %Y')
    story.append(Paragraph(f'Effective: {date_str}', body_style))
    story.append(Paragraph('CONFIDENTIAL — FOR APPROVED BUYERS ONLY', confidential_style))
    story.append(Spacer(1, 20))

    # Wholesale Terms
    story.append(Paragraph('Wholesale Terms', heading_style))
    story.append(Spacer(1, 8))

    wholesale = catalog.get('wholesale', {})
    min_order = wholesale.get('minimumOrder', {})

    terms_data = [
        ['Minimum Order', format_currency(min_order.get('value', 0), min_order.get('currency', 'EUR'))],
        ['Payment Terms', wholesale.get('paymentTerms', 'Net 30')],
        ['Shipping Terms', wholesale.get('shippingTerms', 'FOB Stockholm')],
    ]

    terms_table = Table(terms_data, colWidths=[60 * mm, 120 * mm])
    terms_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#4A4A4A')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))

    story.append(terms_table)
    story.append(Spacer(1, 15))

    # Discount Tiers
    story.append(Paragraph('Volume Discounts', subheading_style))
    story.append(Spacer(1, 6))

    discount_tiers = wholesale.get('discountTiers', [])
    discount_data = [['Order Value', 'Discount']]

    for tier in discount_tiers:
        order_value = format_currency(tier.get('minAmount', 0))
        discount = f"{tier.get('discount', 0)}%"
        discount_data.append([order_value, discount])

    discount_table = Table(discount_data, colWidths=[90 * mm, 90 * mm])
    discount_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E8E8E8')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D0D0D0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))

    story.append(discount_table)
    story.append(Spacer(1, 20))

    story.append(PageBreak())

    # Product Pricing
    story.append(Paragraph('Product Pricing', heading_style))
    story.append(Spacer(1, 10))

    products = catalog.get('products', [])

    if products:
        # Group by collection
        collections = {}
        for product in products:
            collection = product.get('collection', 'Unknown')
            if collection not in collections:
                collections[collection] = []
            collections[collection].append(product)

        for collection_name, collection_products in collections.items():
            story.append(Paragraph(f'Collection: {collection_name}', subheading_style))
            story.append(Spacer(1, 6))

            product_data = [['SKU', 'Product', 'Retail', 'Wholesale', 'MOQ', 'Lead Time']]

            for product in collection_products:
                sku = product.get('sku', '')
                name = product.get('name', '')
                retail = format_currency(product.get('retailPrice', 0))
                wholesale = format_currency(product.get('wholesalePrice', 0))
                moq = str(product.get('moq', 1))
                lead_time = product.get('leadTime', 'N/A')

                product_data.append([sku, name, retail, wholesale, moq, lead_time])

            product_table = Table(
                product_data,
                colWidths=[25 * mm, 60 * mm, 25 * mm, 25 * mm, 15 * mm, 30 * mm]
            )
            product_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E8E8E8')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (2, 0), (5, -1), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D0D0D0')),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ]))

            story.append(product_table)
            story.append(Spacer(1, 15))

    else:
        story.append(Paragraph('No products available.', body_style))

    story.append(PageBreak())

    # Shipping Information
    story.append(Paragraph('Shipping Information', heading_style))
    story.append(Spacer(1, 10))

    shipping = catalog.get('shipping', {})
    regions = shipping.get('regions', [])

    if regions:
        shipping_data = [['Region', 'Shipping Cost', 'Free Shipping Over', 'Estimated Days']]

        for region in regions:
            name = region.get('name', '')
            cost = format_currency(region.get('shippingCost', 0))
            threshold = format_currency(region.get('freeShippingThreshold', 0))
            days = region.get('estimatedDays', 'N/A')

            shipping_data.append([name, cost, threshold, days])

        shipping_table = Table(shipping_data, colWidths=[45 * mm, 35 * mm, 45 * mm, 55 * mm])
        shipping_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E8E8E8')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (1, 0), (2, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D0D0D0')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))

        story.append(shipping_table)

    story.append(Spacer(1, 20))

    # Terms & Conditions
    story.append(Paragraph('Terms & Conditions', heading_style))
    story.append(Spacer(1, 8))

    terms = catalog.get('terms', {})

    terms_text = f"""
    <b>Returns Policy:</b> {terms.get('returnsPolicy', 'N/A')}<br/>
    <br/>
    <b>Cancellation Policy:</b> {terms.get('cancelPolicy', 'N/A')}<br/>
    <br/>
    <b>Damage Policy:</b> {terms.get('damagePolicy', 'N/A')}<br/>
    <br/>
    <b>Exclusivity:</b> {terms.get('exclusivity', 'N/A')}
    """

    story.append(Paragraph(terms_text, body_style))
    story.append(Spacer(1, 30))

    # Footer
    story.append(Paragraph('Contact Information', subheading_style))
    story.append(Spacer(1, 6))

    contact_text = """
    <b>Buyer Inquiries:</b> buyers@haorivision.com<br/>
    <b>Phone:</b> +46 (0) 8 123 4567<br/>
    <b>Address:</b> Stockholm, Sweden
    """

    story.append(Paragraph(contact_text, body_style))
    story.append(Spacer(1, 20))

    confidential_footer = """
    CONFIDENTIAL — This price list is intended for approved wholesale buyers only.
    Unauthorized distribution or reproduction is prohibited.
    All prices and terms are subject to change without notice.
    """

    story.append(Paragraph(confidential_footer, confidential_style))

    # Build PDF with watermark
    def add_page_watermark(canvas_obj, doc_obj):
        add_watermark(canvas_obj, 'CONFIDENTIAL — BUYERS ONLY', angle=30, opacity=0.08)

    doc.build(story, onFirstPage=add_page_watermark, onLaterPages=add_page_watermark)

    print(f"✅ Price list generated: {output_path}")


# ============================================================
# Main
# ============================================================

def main():
    print('\n╔═══════════════════════════════════════════════════════╗')
    print('║                                                       ║')
    print('║       HAORI VISION — Price List Builder              ║')
    print('║                                                       ║')
    print('╚═══════════════════════════════════════════════════════╝\n')

    # Parse args
    import argparse

    parser = argparse.ArgumentParser(description='Generate HAORI VISION wholesale price list')
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

    # Load catalog
    if not BUYERS_CATALOG_PATH.exists():
        print(f'❌ Buyers catalog not found: {BUYERS_CATALOG_PATH}')
        sys.exit(1)

    catalog = load_json(BUYERS_CATALOG_PATH)

    print(f'📋 Loaded buyers catalog')
    print(f'📅 Date: {date_str}\n')

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Generate PDF
    pdf_path = OUTPUT_DIR / f'Price_List_{date_str}.pdf'
    generate_price_list_pdf(pdf_path, catalog)

    # Summary
    products = catalog.get('products', [])

    print('\n' + '═' * 60)
    print('\n📊 Price List Summary:\n')
    print(f'📦 Products: {len(products)}')

    wholesale = catalog.get('wholesale', {})
    min_order = wholesale.get('minimumOrder', {})
    print(f'💰 Minimum order: {format_currency(min_order.get("value", 0))}')

    print(f'\n📄 Output: {pdf_path.name}')
    print(f'📁 Directory: {OUTPUT_DIR}')
    print('\n✨ Price list generation complete!\n')


if __name__ == '__main__':
    main()
