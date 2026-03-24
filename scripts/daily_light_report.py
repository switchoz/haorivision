#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
HAORI VISION — Daily Light Report

Ежедневный отчёт в 09:00 Europe/Stockholm.

Metrics (только для НОВЫХ товаров):
- Просмотры карточек и CTR Buy Now
- Доля досмотров Reels до вау-момента
- Конверсия checkout
- Средний чек
- Среднее время ответа в DM

Output:
- /reports/daily_light_[DATE].pdf

Usage:
    python scripts/daily_light_report.py
    python scripts/daily_light_report.py --date 2025-10-08
"""

import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
import json

# PDF generation
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    print("⚠️  ReportLab not installed. Install with: pip install reportlab")

# ============================================================
# Configuration
# ============================================================

PROJECT_ROOT = Path(__file__).parent.parent
REPORTS_DIR = PROJECT_ROOT / 'reports'
COLLECTIONS_PATH = PROJECT_ROOT / 'data' / 'products' / 'collections.json'

# Timezone
TIMEZONE = 'Europe/Stockholm'

# New products filter (same as other scripts)
NEW_PRODUCTS_PATTERNS = [
    r'^TEST-',
    r'^HV-202510-',
    r'^(ECLIPSE|LUMIN|BLOOM)-(0[1-3])$'
]

# Mock analytics data (replace with real analytics in production)
MOCK_ANALYTICS = {
    'product_views': {
        'TEST-001': 1250,
        'TEST-002': 980,
        'HV-202510-001': 1450,
        'ECLIPSE-01': 2100,
        'ECLIPSE-02': 1890,
        'LUMIN-01': 1320,
        'BLOOM-01': 1100
    },
    'buy_now_clicks': {
        'TEST-001': 145,
        'TEST-002': 98,
        'HV-202510-001': 178,
        'ECLIPSE-01': 294,
        'ECLIPSE-02': 245,
        'LUMIN-01': 158,
        'BLOOM-01': 132
    },
    'reels_views': {
        'TEST-001': 8500,
        'TEST-002': 6200,
        'HV-202510-001': 9800,
        'ECLIPSE-01': 15200,
        'ECLIPSE-02': 13400
    },
    'reels_wow_completions': {
        'TEST-001': 4250,  # 50%
        'TEST-002': 3720,  # 60%
        'HV-202510-001': 5880,  # 60%
        'ECLIPSE-01': 10640,  # 70%
        'ECLIPSE-02': 9380   # 70%
    },
    'checkout_started': 89,
    'checkout_completed': 67,
    'orders': [
        {'id': 'order_001', 'total': 450.00, 'sku': 'TEST-001'},
        {'id': 'order_002', 'total': 520.00, 'sku': 'ECLIPSE-01'},
        {'id': 'order_003', 'total': 480.00, 'sku': 'LUMIN-01'},
        {'id': 'order_004', 'total': 450.00, 'sku': 'TEST-002'},
        {'id': 'order_005', 'total': 520.00, 'sku': 'ECLIPSE-02'}
    ],
    'dm_response_times': [
        5,   # 5 minutes
        12,  # 12 minutes
        8,   # 8 minutes
        15,  # 15 minutes
        6,   # 6 minutes
        10,  # 10 minutes
        7,   # 7 minutes
        20,  # 20 minutes
        9    # 9 minutes
    ]
}

# ============================================================
# Helper Functions
# ============================================================

def get_date_string(date: datetime = None) -> str:
    """Get date string YYYYMMDD"""
    if date is None:
        date = datetime.now()
    return date.strftime('%Y%m%d')

def load_collections() -> Optional[Dict]:
    """Load collections.json"""
    if not COLLECTIONS_PATH.exists():
        return None

    with open(COLLECTIONS_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def is_new_product(sku: str) -> bool:
    """Check if product is new"""
    import re

    for pattern in NEW_PRODUCTS_PATTERNS:
        if re.match(pattern, sku):
            return True

    return False

def get_new_products() -> List[str]:
    """Get list of new product SKUs"""
    collections = load_collections()

    if not collections:
        return []

    products = []

    def traverse(obj):
        if isinstance(obj, dict):
            if 'sku' in obj and is_new_product(obj['sku']):
                products.append(obj['sku'])
            for value in obj.values():
                traverse(value)
        elif isinstance(obj, list):
            for item in obj:
                traverse(item)

    traverse(collections)

    return list(set(products))

# ============================================================
# Analytics Functions
# ============================================================

def calculate_ctr(views: int, clicks: int) -> float:
    """Calculate CTR (Click-Through Rate)"""
    if views == 0:
        return 0.0
    return (clicks / views) * 100

def calculate_completion_rate(total_views: int, completions: int) -> float:
    """Calculate completion rate"""
    if total_views == 0:
        return 0.0
    return (completions / total_views) * 100

def calculate_conversion_rate(started: int, completed: int) -> float:
    """Calculate conversion rate"""
    if started == 0:
        return 0.0
    return (completed / started) * 100

def calculate_average_order_value(orders: List[Dict]) -> float:
    """Calculate average order value"""
    if not orders:
        return 0.0

    total = sum(order['total'] for order in orders)
    return total / len(orders)

def calculate_average_dm_response_time(response_times: List[int]) -> float:
    """Calculate average DM response time in minutes"""
    if not response_times:
        return 0.0

    return sum(response_times) / len(response_times)

# ============================================================
# Metrics Collection
# ============================================================

def collect_metrics(date: datetime = None) -> Dict[str, Any]:
    """Collect all metrics for the report"""
    if date is None:
        date = datetime.now()

    new_products = get_new_products()

    # Product views and CTR (only new products)
    product_metrics = []

    for sku in new_products:
        views = MOCK_ANALYTICS['product_views'].get(sku, 0)
        clicks = MOCK_ANALYTICS['buy_now_clicks'].get(sku, 0)
        ctr = calculate_ctr(views, clicks)

        product_metrics.append({
            'sku': sku,
            'views': views,
            'clicks': clicks,
            'ctr': ctr
        })

    # Sort by views (descending)
    product_metrics.sort(key=lambda x: x['views'], reverse=True)

    # Reels completion rate (only new products with reels)
    reels_metrics = []

    for sku in new_products:
        if sku in MOCK_ANALYTICS['reels_views']:
            views = MOCK_ANALYTICS['reels_views'][sku]
            completions = MOCK_ANALYTICS['reels_wow_completions'].get(sku, 0)
            completion_rate = calculate_completion_rate(views, completions)

            reels_metrics.append({
                'sku': sku,
                'views': views,
                'completions': completions,
                'completion_rate': completion_rate
            })

    # Sort by completion rate (descending)
    reels_metrics.sort(key=lambda x: x['completion_rate'], reverse=True)

    # Checkout conversion
    checkout_started = MOCK_ANALYTICS['checkout_started']
    checkout_completed = MOCK_ANALYTICS['checkout_completed']
    checkout_conversion = calculate_conversion_rate(checkout_started, checkout_completed)

    # Average order value (only new products)
    new_product_orders = [
        order for order in MOCK_ANALYTICS['orders']
        if is_new_product(order['sku'])
    ]
    avg_order_value = calculate_average_order_value(new_product_orders)

    # Average DM response time
    avg_dm_response_time = calculate_average_dm_response_time(
        MOCK_ANALYTICS['dm_response_times']
    )

    return {
        'date': date.strftime('%Y-%m-%d'),
        'new_products': new_products,
        'product_metrics': product_metrics,
        'reels_metrics': reels_metrics,
        'checkout': {
            'started': checkout_started,
            'completed': checkout_completed,
            'conversion_rate': checkout_conversion
        },
        'avg_order_value': avg_order_value,
        'avg_dm_response_time': avg_dm_response_time,
        'total_orders': len(new_product_orders)
    }

# ============================================================
# PDF Generation
# ============================================================

def generate_pdf_report(metrics: Dict[str, Any], output_path: Path):
    """Generate PDF report"""
    if not REPORTLAB_AVAILABLE:
        print("❌ ReportLab not available. Cannot generate PDF.")
        return False

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm
    )

    # Styles
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#a855f7'),
        alignment=TA_CENTER,
        spaceAfter=20
    )

    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#6b7280'),
        alignment=TA_CENTER,
        spaceAfter=30
    )

    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#a855f7'),
        spaceAfter=10
    )

    # Story
    story = []

    # Title
    story.append(Paragraph('HAORI VISION', title_style))
    story.append(Paragraph(f'Daily Light Report — {metrics["date"]}', subtitle_style))
    story.append(Spacer(1, 10*mm))

    # Summary Box
    summary_data = [
        ['Metric', 'Value'],
        ['New Products', len(metrics['new_products'])],
        ['Total Orders', metrics['total_orders']],
        ['Average Order Value', f"€{metrics['avg_order_value']:.2f}"],
        ['Checkout Conversion', f"{metrics['checkout']['conversion_rate']:.1f}%"],
        ['Avg DM Response', f"{metrics['avg_dm_response_time']:.1f} min"]
    ]

    summary_table = Table(summary_data, colWidths=[80*mm, 60*mm])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#a855f7')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f9fafb')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
    ]))

    story.append(summary_table)
    story.append(Spacer(1, 10*mm))

    # Product Views & CTR
    story.append(Paragraph('Product Views & CTR (New Products)', heading_style))

    if metrics['product_metrics']:
        product_data = [['SKU', 'Views', 'Buy Now Clicks', 'CTR']]

        for p in metrics['product_metrics'][:10]:  # Top 10
            product_data.append([
                p['sku'],
                f"{p['views']:,}",
                f"{p['clicks']:,}",
                f"{p['ctr']:.1f}%"
            ])

        product_table = Table(product_data, colWidths=[40*mm, 35*mm, 35*mm, 30*mm])
        product_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6366f1')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
        ]))

        story.append(product_table)
    else:
        story.append(Paragraph('No data available', styles['Normal']))

    story.append(Spacer(1, 8*mm))

    # Reels Completion Rate
    story.append(Paragraph('Reels — Completion Rate to Wow Moment', heading_style))

    if metrics['reels_metrics']:
        reels_data = [['SKU', 'Total Views', 'Wow Completions', 'Completion %']]

        for r in metrics['reels_metrics']:
            reels_data.append([
                r['sku'],
                f"{r['views']:,}",
                f"{r['completions']:,}",
                f"{r['completion_rate']:.1f}%"
            ])

        reels_table = Table(reels_data, colWidths=[40*mm, 35*mm, 35*mm, 30*mm])
        reels_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8b5cf6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
        ]))

        story.append(reels_table)
    else:
        story.append(Paragraph('No Reels data available', styles['Normal']))

    story.append(Spacer(1, 8*mm))

    # Checkout Conversion
    story.append(Paragraph('Checkout Conversion', heading_style))

    checkout_data = [
        ['Metric', 'Value'],
        ['Checkout Started', metrics['checkout']['started']],
        ['Checkout Completed', metrics['checkout']['completed']],
        ['Conversion Rate', f"{metrics['checkout']['conversion_rate']:.1f}%"]
    ]

    checkout_table = Table(checkout_data, colWidths=[80*mm, 60*mm])
    checkout_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
    ]))

    story.append(checkout_table)
    story.append(Spacer(1, 10*mm))

    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#9ca3af'),
        alignment=TA_CENTER
    )

    story.append(Spacer(1, 10*mm))
    story.append(Paragraph(
        f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} {TIMEZONE}',
        footer_style
    ))
    story.append(Paragraph('HAORI VISION — Wear the Light. Become the Art.', footer_style))

    # Build PDF
    doc.build(story)

    return True

# ============================================================
# Main
# ============================================================

def main():
    """Generate daily light report"""
    import argparse

    parser = argparse.ArgumentParser(description='Generate Daily Light Report')
    parser.add_argument('--date', help='Date in YYYY-MM-DD format (default: today)')
    args = parser.parse_args()

    # Parse date
    if args.date:
        try:
            report_date = datetime.strptime(args.date, '%Y-%m-%d')
        except ValueError:
            print(f"❌ Invalid date format: {args.date}")
            print("   Use YYYY-MM-DD format")
            sys.exit(1)
    else:
        report_date = datetime.now()

    print('\n╔═══════════════════════════════════════════════════════╗')
    print('║                                                       ║')
    print('║     HAORI VISION — Daily Light Report                ║')
    print('║                                                       ║')
    print('╚═══════════════════════════════════════════════════════╝\n')

    print(f'📅 Report Date: {report_date.strftime("%Y-%m-%d")}\n')
    print('⏳ Collecting metrics...\n')

    # Collect metrics
    metrics = collect_metrics(report_date)

    # Print summary
    print('📊 Metrics Summary:\n')
    print(f'  New Products: {len(metrics["new_products"])}')
    print(f'  Total Orders: {metrics["total_orders"]}')
    print(f'  Avg Order Value: €{metrics["avg_order_value"]:.2f}')
    print(f'  Checkout Conversion: {metrics["checkout"]["conversion_rate"]:.1f}%')
    print(f'  Avg DM Response: {metrics["avg_dm_response_time"]:.1f} min\n')

    # Generate PDF
    REPORTS_DIR.mkdir(exist_ok=True)

    date_str = get_date_string(report_date)
    pdf_path = REPORTS_DIR / f'daily_light_{date_str}.pdf'

    print(f'📄 Generating PDF: {pdf_path}\n')

    success = generate_pdf_report(metrics, pdf_path)

    if success:
        print(f'✅ Report generated successfully!\n')
        print(f'📄 Report: {pdf_path}\n')
    else:
        print(f'❌ Failed to generate PDF report\n')
        sys.exit(1)

if __name__ == '__main__':
    main()
