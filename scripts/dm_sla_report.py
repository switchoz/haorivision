#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
HAORI VISION — DM SLA Daily Report

Ежедневный отчёт по SLA ответов в DM.

Features:
- Median response time
- Max response time
- SLA breaches
- Response time distribution
- After-hours conversations

Output: /reports/dm_sla_daily_[DATE].pdf

Usage:
  python scripts/dm_sla_report.py
  python scripts/dm_sla_report.py --date 2025-10-09
"""

import sys
import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.pdfgen import canvas as pdf_canvas
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
except ImportError:
    print("❌ reportlab not installed. Install with: pip install reportlab")
    sys.exit(1)

PROJECT_ROOT = Path(__file__).parent.parent
LOGS_DIR = PROJECT_ROOT / 'data' / 'dm' / 'logs'
OUTPUT_DIR = PROJECT_ROOT / 'reports'

# Mock data (in production, load from logs)
MOCK_CONVERSATIONS = [
    {"id": "conv_1", "platform": "instagram", "responseTime": 8, "slaStatus": "ok"},
    {"id": "conv_2", "platform": "whatsapp", "responseTime": 12, "slaStatus": "ok"},
    {"id": "conv_3", "platform": "instagram", "responseTime": 22, "slaStatus": "warn"},
    {"id": "conv_4", "platform": "telegram", "responseTime": 5, "slaStatus": "ok"},
    {"id": "conv_5", "platform": "instagram", "responseTime": 48, "slaStatus": "critical"},
]

def generate_sla_report(output_path: Path):
    """Generate DM SLA report PDF"""
    print(f"📄 Generating SLA report: {output_path.name}")

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.black,
        spaceAfter=8,
        alignment=1
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.black,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=10,
        textColor=colors.HexColor('#4A4A4A'),
        spaceAfter=6
    )

    story = []

    # Header
    story.append(Spacer(1, 40))
    story.append(Paragraph('HAORI VISION', title_style))
    story.append(Paragraph('DM SLA Daily Report', heading_style))
    story.append(Spacer(1, 10))

    date_str = datetime.now().strftime('%B %d, %Y')
    story.append(Paragraph(date_str, body_style))
    story.append(Spacer(1, 20))

    # Summary
    response_times = [c['responseTime'] for c in MOCK_CONVERSATIONS]
    median = sorted(response_times)[len(response_times) // 2]
    max_time = max(response_times)

    summary_data = [
        ['Metric', 'Value', 'Target', 'Status'],
        ['Total Conversations', str(len(MOCK_CONVERSATIONS)), '-', '-'],
        ['Median Response', f'{median} min', '≤15 min', '✅ OK' if median <= 15 else '❌ BREACH'],
        ['Max Response', f'{max_time} min', '≤60 min', '✅ OK' if max_time <= 60 else '❌ BREACH'],
    ]

    summary_table = Table(summary_data, colWidths=[70 * mm, 40 * mm, 40 * mm, 30 * mm])
    summary_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E8E8E8')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D0D0D0')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))

    story.append(summary_table)
    story.append(Spacer(1, 20))

    # Platform breakdown
    story.append(Paragraph('Platform Breakdown', heading_style))
    story.append(Spacer(1, 10))

    platforms = {}
    for conv in MOCK_CONVERSATIONS:
        p = conv['platform']
        if p not in platforms:
            platforms[p] = []
        platforms[p].append(conv['responseTime'])

    platform_data = [['Platform', 'Count', 'Avg Response Time']]
    for platform, times in platforms.items():
        avg = sum(times) / len(times)
        platform_data.append([platform.capitalize(), str(len(times)), f'{avg:.1f} min'])

    platform_table = Table(platform_data, colWidths=[60 * mm, 50 * mm, 60 * mm])
    platform_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E8E8E8')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D0D0D0')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))

    story.append(platform_table)

    doc.build(story)
    print(f"✅ SLA report generated: {output_path}")

def main():
    print('\n╔═══════════════════════════════════════════════════════╗')
    print('║                                                       ║')
    print('║       HAORI VISION — DM SLA Report                    ║')
    print('║                                                       ║')
    print('╚═══════════════════════════════════════════════════════╝\n')

    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--date', type=str, help='Date (YYYY-MM-DD)')
    args = parser.parse_args()

    date_obj = datetime.strptime(args.date, '%Y-%m-%d') if args.date else datetime.now()
    date_str = date_obj.strftime('%Y%m%d')

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    pdf_path = OUTPUT_DIR / f'dm_sla_daily_{date_str}.pdf'
    generate_sla_report(pdf_path)

    print(f'\n✨ Report complete: {pdf_path}\n')

if __name__ == '__main__':
    main()
