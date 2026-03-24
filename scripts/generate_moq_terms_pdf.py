#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
HAORI VISION — MOQ Terms PDF Generator

Generates professional MOQ Terms PDF document with:
- Minimum Order Quantities
- Lead Times
- Payment Terms
- Packing Specifications
- Shipping Terms

Usage:
    python scripts/generate_moq_terms_pdf.py
"""

import json
import sys
from datetime import datetime
from pathlib import Path

# Force UTF-8 output on Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors

# Paths
ROOT_DIR = Path(__file__).resolve().parent.parent
CATALOG_FILE = ROOT_DIR / "data" / "buyers_catalog.json"
OUTPUT_DIR = ROOT_DIR / "buyers" / "docs"
OUTPUT_FILE = OUTPUT_DIR / f"MOQ_Terms_{datetime.now().strftime('%Y%m%d')}.pdf"

def load_catalog():
    """Load buyers catalog data"""
    if not CATALOG_FILE.exists():
        raise FileNotFoundError(f"Catalog file not found: {CATALOG_FILE}")

    with open(CATALOG_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_moq_terms_pdf(catalog):
    """Generate MOQ Terms PDF"""

    # Create PDF document
    doc = SimpleDocTemplate(
        str(OUTPUT_FILE),
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    # Styles
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=24,
        textColor=colors.HexColor('#000000'),
        spaceAfter=0.3*cm,
        alignment=TA_CENTER,
    )

    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#666666'),
        spaceAfter=1*cm,
        alignment=TA_CENTER,
    )

    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading1'],
        fontSize=14,
        textColor=colors.HexColor('#000000'),
        spaceAfter=0.3*cm,
        spaceBefore=0.5*cm,
        leftIndent=0,
    )

    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#333333'),
        spaceAfter=0.3*cm,
        alignment=TA_JUSTIFY,
    )

    # Build document content
    content = []

    # Header
    content.append(Paragraph("HAORI VISION", title_style))
    content.append(Paragraph(f"Wholesale MOQ Terms & Conditions", subtitle_style))
    content.append(Paragraph(f"Effective Date: {datetime.now().strftime('%B %d, %Y')}", subtitle_style))
    content.append(Spacer(1, 0.5*cm))

    # Introduction
    content.append(Paragraph("1. Minimum Order Quantities (MOQ)", heading_style))

    wholesale = catalog.get("wholesale", {})
    min_order = wholesale.get("minimumOrder", {})
    min_value = min_order.get("value", 0)
    currency = min_order.get("currency", "EUR")

    content.append(Paragraph(
        f"HAORI VISION requires a minimum order value of <b>{currency} {min_value:,.2f}</b> for all wholesale purchases. "
        f"This minimum ensures efficient production runs and maintains our quality standards while providing "
        f"competitive wholesale pricing to our partners.",
        body_style
    ))

    content.append(Spacer(1, 0.3*cm))

    # Product-specific MOQs table
    content.append(Paragraph("Product-Specific MOQs:", body_style))
    content.append(Spacer(1, 0.2*cm))

    products = catalog.get("products", [])
    moq_data = [["SKU", "Product Name", "MOQ (Units)", "Wholesale Price"]]

    for product in products:
        moq_data.append([
            product.get("sku", "N/A"),
            product.get("name", "N/A"),
            str(product.get("moq", "N/A")),
            f"{product.get('currency', 'EUR')} {product.get('wholesalePrice', 0):,.2f}"
        ])

    moq_table = Table(moq_data, colWidths=[3*cm, 7*cm, 3*cm, 3.5*cm])
    moq_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#000000')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (2, 0), (2, -1), 'CENTER'),
        ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CCCCCC')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')]),
    ]))

    content.append(moq_table)
    content.append(Spacer(1, 0.5*cm))

    # Lead Times
    content.append(Paragraph("2. Lead Times & Production", heading_style))
    content.append(Paragraph(
        "All HAORI VISION products are made-to-order to ensure the highest quality and minimize waste. "
        "Lead times vary by product and current production capacity:",
        body_style
    ))

    content.append(Spacer(1, 0.2*cm))

    lead_data = [["Product", "Standard Lead Time", "Rush Available"]]
    for product in products:
        lead_data.append([
            product.get("name", "N/A"),
            product.get("leadTime", "N/A"),
            "Yes (+ 30% fee)"
        ])

    lead_table = Table(lead_data, colWidths=[7*cm, 5*cm, 4.5*cm])
    lead_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#000000')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CCCCCC')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')]),
    ]))

    content.append(lead_table)
    content.append(Spacer(1, 0.5*cm))

    # Payment Terms
    content.append(Paragraph("3. Payment Terms", heading_style))
    payment_terms = wholesale.get("paymentTerms", "Net 30")
    content.append(Paragraph(
        f"<b>Standard Terms:</b> {payment_terms} days from invoice date.<br/><br/>"
        f"<b>Payment Methods:</b> Bank transfer (SWIFT), PayPal (for orders under EUR 10,000), "
        f"Credit Card (via Stripe, 3% processing fee applies).<br/><br/>"
        f"<b>Early Payment Discount:</b> 2% discount for payment within 10 days of invoice.<br/><br/>"
        f"<b>First-Time Customers:</b> 50% deposit required with order, balance due before shipping.",
        body_style
    ))

    content.append(Spacer(1, 0.5*cm))

    # Shipping & Packing
    content.append(Paragraph("4. Shipping & Packing Specifications", heading_style))
    shipping_terms = wholesale.get("shippingTerms", "FOB Stockholm")
    content.append(Paragraph(
        f"<b>Shipping Terms:</b> {shipping_terms}<br/><br/>"
        f"<b>Packing:</b> Each garment is individually packaged in branded dust bags, then packed in "
        f"reinforced shipping cartons (max 10 units per carton). All boxes are labeled with SKU, "
        f"quantity, and care instructions.<br/><br/>"
        f"<b>Carriers:</b> DHL Express (default), FedEx, or UPS available upon request.<br/><br/>"
        f"<b>Insurance:</b> All shipments are insured for full product value.",
        body_style
    ))

    content.append(Spacer(1, 0.2*cm))

    # Shipping rates table
    shipping = catalog.get("shipping", {})
    regions = shipping.get("regions", [])

    ship_data = [["Region", "Standard Rate", "Free Shipping Threshold", "Delivery Time"]]
    for region in regions:
        ship_data.append([
            region.get("name", "N/A"),
            f"EUR {region.get('shippingCost', 0):,.2f}",
            f"EUR {region.get('freeShippingThreshold', 0):,.2f}",
            region.get("estimatedDays", "N/A")
        ])

    ship_table = Table(ship_data, colWidths=[4*cm, 4*cm, 4.5*cm, 4*cm])
    ship_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#000000')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CCCCCC')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')]),
    ]))

    content.append(ship_table)
    content.append(Spacer(1, 0.5*cm))

    # Volume Discounts
    content.append(Paragraph("5. Volume Discount Structure", heading_style))
    content.append(Paragraph(
        "Volume discounts are automatically applied based on total order value:",
        body_style
    ))

    content.append(Spacer(1, 0.2*cm))

    discount_tiers = wholesale.get("discountTiers", [])
    discount_data = [["Order Value", "Discount", "Benefits"]]

    for i, tier in enumerate(discount_tiers):
        min_amt = tier.get("minAmount", 0)
        discount = tier.get("discount", 0)

        # Add benefits based on tier
        benefits = ""
        if discount == 0:
            benefits = "Standard wholesale pricing"
        elif discount == 5:
            benefits = "Priority customer service"
        elif discount == 10:
            benefits = "Dedicated account manager"
        else:
            benefits = "Regional exclusivity available"

        if i < len(discount_tiers) - 1:
            max_amt = discount_tiers[i + 1].get("minAmount", 0) - 1
            order_range = f"EUR {min_amt:,} - EUR {max_amt:,}"
        else:
            order_range = f"EUR {min_amt:,}+"

        discount_data.append([
            order_range,
            f"{discount}%",
            benefits
        ])

    discount_table = Table(discount_data, colWidths=[5*cm, 3*cm, 8.5*cm])
    discount_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#000000')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CCCCCC')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')]),
    ]))

    content.append(discount_table)
    content.append(Spacer(1, 0.5*cm))

    # Returns & Policies
    content.append(Paragraph("6. Returns & Quality Assurance", heading_style))
    terms = catalog.get("terms", {})
    content.append(Paragraph(
        f"<b>Returns Policy:</b> {terms.get('returnsPolicy', 'N/A')}<br/><br/>"
        f"<b>Cancellations:</b> {terms.get('cancelPolicy', 'N/A')}<br/><br/>"
        f"<b>Damage Claims:</b> {terms.get('damagePolicy', 'N/A')}<br/><br/>"
        f"<b>Quality Guarantee:</b> All garments undergo rigorous quality inspection before shipping. "
        f"We guarantee proper UV-reactive functionality and construction quality for 12 months from delivery.",
        body_style
    ))

    content.append(Spacer(1, 0.8*cm))

    # Footer
    footer_text = Paragraph(
        "<b>HAORI VISION</b><br/>"
        "Stockholm, Sweden<br/>"
        "Email: wholesale@haorivision.com<br/>"
        "Website: https://haorivision.com/buyers<br/><br/>"
        f"Document Version: {catalog.get('version', '1.0.0')} | "
        f"Generated: {datetime.now().strftime('%Y-%m-%d')}",
        ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#666666'),
            alignment=TA_CENTER,
        )
    )
    content.append(footer_text)

    # Build PDF
    doc.build(content)

def main():
    """Main execution"""
    print("")
    print("=" * 80)
    print("  HAORI VISION - MOQ Terms PDF Generator")
    print("=" * 80)
    print("")

    try:
        # Load catalog
        print(f"[1/3] Loading catalog from: {CATALOG_FILE}")
        catalog = load_catalog()
        print(f"      OK Loaded catalog version {catalog.get('version', 'N/A')}")
        print("")

        # Generate PDF
        print("[2/3] Generating MOQ Terms PDF...")
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        generate_moq_terms_pdf(catalog)
        print(f"      OK Generated PDF document")
        print("")

        # Save output
        print(f"[3/3] Saving to: {OUTPUT_FILE}")
        print(f"      OK Saved successfully ({OUTPUT_FILE.stat().st_size} bytes)")
        print("")

        # Summary
        print("=" * 80)
        print("  SUCCESS: MOQ Terms PDF Generated")
        print("=" * 80)
        print("")
        print(f"Output file: {OUTPUT_FILE}")
        print("")
        print("Document includes:")
        print("  - Minimum Order Quantities (MOQ)")
        print("  - Product-specific lead times")
        print("  - Payment terms and options")
        print("  - Packing and shipping specifications")
        print("  - Volume discount structure")
        print("  - Returns and quality policies")
        print("")

        return 0

    except FileNotFoundError as e:
        print(f"ERROR: {e}")
        return 1
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit(main())
