#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""HAORI VISION — Influencer Collab Report Generator

Профессиональный анализ и отчётность по коллаборациям:
- Детальные метрики (reach, engagement, conversions, ROI)
- Сравнение с KPI и benchmarks
- Визуализация (графики, таблицы)
- PDF-генерация с watermark
- Рекомендации для следующих коллабораций
"""

import sys
import json
import csv
from pathlib import Path
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = Path(__file__).parent.parent
COLLAB_DIR = PROJECT_ROOT / 'collab'
REPORTS_DIR = PROJECT_ROOT / 'reports'

# Industry benchmarks
BENCHMARKS = {
    'Instagram': {
        'engagement_rate': {
            'micro': 8.0,      # 10k-50k followers
            'mid': 5.0,        # 50k-100k followers
            'macro': 3.0,      # 100k-500k followers
            'mega': 1.5        # 500k+ followers
        },
        'story_completion': 0.70,  # 70% completion rate
        'link_click_rate': 0.015,  # 1.5% of impressions
        'conversion_rate': 0.02    # 2% of clicks
    },
    'TikTok': {
        'engagement_rate': {
            'micro': 12.0,
            'mid': 8.0,
            'macro': 5.0,
            'mega': 3.0
        },
        'link_click_rate': 0.02,
        'conversion_rate': 0.025
    },
    'YouTube': {
        'engagement_rate': {
            'micro': 6.0,
            'mid': 4.0,
            'macro': 2.5,
            'mega': 1.8
        },
        'watch_time': 0.50,       # 50% average view duration
        'link_click_rate': 0.025,
        'conversion_rate': 0.03
    }
}

# Product catalog
PRODUCTS_CATALOG = {
    'ECLIPSE-01': {'name': 'Eclipse Haori', 'price': 650, 'margin': 0.65},
    'ECLIPSE-02': {'name': 'Eclipse Haori Dark', 'price': 650, 'margin': 0.65},
    'LUMIN-01': {'name': 'Luminescence Jacket', 'price': 720, 'margin': 0.68},
    'BLOOM-01': {'name': 'Bloom Haori', 'price': 680, 'margin': 0.66},
    'BLOOM-02': {'name': 'Bloom Haori Night', 'price': 680, 'margin': 0.66}
}

class CollabReportGenerator:
    def __init__(self, agreement_id=None, handle=None):
        self.agreement_id = agreement_id
        self.handle = handle
        self.data = {}
        self.analysis = {}

    def load_agreement_data(self):
        """Load agreement data from agreements directory"""
        if not self.agreement_id:
            return None

        agreement_dir = COLLAB_DIR / 'agreements' / self.agreement_id
        if not agreement_dir.exists():
            print(f"❌ Agreement {self.agreement_id} not found")
            return None

        # Load agreement metadata
        agreement_file = agreement_dir / 'agreement.md'
        if agreement_file.exists():
            content = agreement_file.read_text(encoding='utf-8')
            self.data['agreement'] = self._parse_agreement(content)

        return self.data

    def _parse_agreement(self, content):
        """Extract key data from agreement markdown"""
        data = {}

        # Extract influencer info
        if '@' in content:
            # Simple regex-like extraction (можно улучшить)
            lines = content.split('\n')
            for line in lines:
                if 'Имя/Псевдоним:' in line:
                    data['name'] = line.split(':')[1].strip()
                elif 'Платформа:' in line and '(@' in line:
                    platform_part = line.split(':')[1].strip()
                    data['platform'] = platform_part.split('(')[0].strip()
                    if '(@' in platform_part:
                        data['handle'] = platform_part.split('(@')[1].split(')')[0]

        return data

    def load_performance_data(self):
        """Load performance metrics from links and external sources"""
        # Load UTM link data
        links_file = COLLAB_DIR / 'data' / 'collab_links.json'
        if links_file.exists():
            with open(links_file, 'r', encoding='utf-8') as f:
                links_data = json.load(f)

            # Filter links for this collab
            if self.handle:
                collab_links = [
                    link for link in links_data.get('links', [])
                    if link.get('handle') == self.handle
                ]
                self.data['links'] = collab_links

        # Mock performance data (в продакшене — из Google Analytics API, Instagram API)
        self.data['performance'] = self._generate_mock_performance()

        return self.data

    def _generate_mock_performance(self):
        """Generate realistic mock performance data"""
        # В продакшене это будет реальный API call
        return {
            'posts': [
                {
                    'id': 1,
                    'type': 'Reel',
                    'title': 'Daylight → UV Transition',
                    'published_date': '2025-10-10',
                    'impressions': 52300,
                    'reach': 41800,
                    'engagement': 4120,
                    'engagement_rate': 9.86,  # (4120/41800)*100
                    'likes': 3200,
                    'comments': 180,
                    'shares': 520,
                    'saves': 220,
                    'link_clicks': 780,
                    'link_click_rate': 1.87,  # (780/41800)*100
                    'video_views': 48500,
                    'avg_watch_time': 0.68,  # 68% completion
                    'profile_visits': 340
                },
                {
                    'id': 2,
                    'type': 'Carousel',
                    'title': 'Детали и крупные планы',
                    'published_date': '2025-10-15',
                    'impressions': 38200,
                    'reach': 31500,
                    'engagement': 2840,
                    'engagement_rate': 9.02,
                    'likes': 2300,
                    'comments': 95,
                    'shares': 280,
                    'saves': 165,
                    'link_clicks': 520,
                    'link_click_rate': 1.65,
                    'profile_visits': 210
                },
                {
                    'id': 3,
                    'type': 'Story',
                    'title': 'Behind-the-Scenes (5 slides)',
                    'published_date': '2025-10-07',
                    'impressions': 28600,
                    'reach': 25400,
                    'taps_forward': 8200,
                    'taps_back': 1800,
                    'exits': 2400,
                    'completion_rate': 0.72,  # 72%
                    'link_clicks': 420,
                    'link_click_rate': 1.65,
                    'swipe_ups': 420
                }
            ],
            'conversions': [
                {'date': '2025-10-10', 'sku': 'ECLIPSE-01', 'quantity': 3, 'revenue': 1950},
                {'date': '2025-10-11', 'sku': 'LUMIN-01', 'quantity': 2, 'revenue': 1440},
                {'date': '2025-10-15', 'sku': 'ECLIPSE-01', 'quantity': 2, 'revenue': 1300},
                {'date': '2025-10-16', 'sku': 'BLOOM-01', 'quantity': 1, 'revenue': 680},
                {'date': '2025-10-18', 'sku': 'LUMIN-01', 'quantity': 1, 'revenue': 720},
                {'date': '2025-10-20', 'sku': 'ECLIPSE-02', 'quantity': 2, 'revenue': 1300},
                {'date': '2025-10-22', 'sku': 'ECLIPSE-01', 'quantity': 1, 'revenue': 650}
            ],
            'audience_demographics': {
                'age': {
                    '18-24': 0.18,
                    '25-34': 0.42,
                    '35-44': 0.28,
                    '45-54': 0.10,
                    '55+': 0.02
                },
                'gender': {
                    'female': 0.62,
                    'male': 0.36,
                    'other': 0.02
                },
                'top_countries': {
                    'Sweden': 0.38,
                    'Norway': 0.15,
                    'Denmark': 0.12,
                    'Finland': 0.08,
                    'Germany': 0.10,
                    'UK': 0.08,
                    'USA': 0.09
                }
            }
        }

    def analyze(self):
        """Perform comprehensive analysis"""
        perf = self.data.get('performance', {})

        # 1. Aggregate metrics
        total_impressions = sum(p.get('impressions', 0) for p in perf.get('posts', []))
        total_reach = sum(p.get('reach', 0) for p in perf.get('posts', []))
        total_engagement = sum(p.get('engagement', 0) for p in perf.get('posts', []))
        total_link_clicks = sum(p.get('link_clicks', 0) for p in perf.get('posts', []))

        avg_engagement_rate = (total_engagement / total_reach * 100) if total_reach > 0 else 0
        link_click_rate = (total_link_clicks / total_impressions * 100) if total_impressions > 0 else 0

        # 2. Conversions and ROI
        conversions = perf.get('conversions', [])
        total_conversions = len(conversions)
        total_revenue = sum(c.get('revenue', 0) for c in conversions)
        conversion_rate = (total_conversions / total_link_clicks * 100) if total_link_clicks > 0 else 0

        # Cost calculation
        items_value = sum(
            PRODUCTS_CATALOG.get(sku, {}).get('price', 0)
            for sku in ['ECLIPSE-01', 'LUMIN-01']  # Mock SKUs
        )
        shipping_cost = 50  # Mock
        production_cost = items_value * 0.35  # 35% COGS
        total_cost = production_cost + shipping_cost

        gross_profit = total_revenue - production_cost
        roi = ((gross_profit - shipping_cost) / total_cost * 100) if total_cost > 0 else 0

        # 3. Benchmark comparison
        platform = self.data.get('agreement', {}).get('platform', 'Instagram')

        # Determine influencer tier based on reach
        avg_reach = total_reach / len(perf.get('posts', [])) if perf.get('posts') else 0
        if avg_reach < 50000:
            tier = 'micro'
        elif avg_reach < 100000:
            tier = 'mid'
        elif avg_reach < 500000:
            tier = 'macro'
        else:
            tier = 'mega'

        benchmark_engagement = BENCHMARKS.get(platform, {}).get('engagement_rate', {}).get(tier, 5.0)
        benchmark_click_rate = BENCHMARKS.get(platform, {}).get('link_click_rate', 0.015) * 100
        benchmark_conversion = BENCHMARKS.get(platform, {}).get('conversion_rate', 0.02) * 100

        engagement_vs_benchmark = ((avg_engagement_rate - benchmark_engagement) / benchmark_engagement * 100) if benchmark_engagement > 0 else 0
        click_vs_benchmark = ((link_click_rate - benchmark_click_rate) / benchmark_click_rate * 100) if benchmark_click_rate > 0 else 0
        conversion_vs_benchmark = ((conversion_rate - benchmark_conversion) / benchmark_conversion * 100) if benchmark_conversion > 0 else 0

        # 4. Content analysis
        best_post = max(perf.get('posts', []), key=lambda p: p.get('engagement_rate', 0), default={})
        worst_post = min(perf.get('posts', []), key=lambda p: p.get('engagement_rate', 0), default={})

        # 5. Audience quality
        demographics = perf.get('audience_demographics', {})
        target_age_coverage = demographics.get('age', {}).get('25-34', 0) + demographics.get('age', {}).get('35-44', 0)
        target_geo_coverage = sum(demographics.get('top_countries', {}).get(c, 0) for c in ['Sweden', 'Norway', 'Denmark', 'Finland'])

        self.analysis = {
            'summary': {
                'total_impressions': total_impressions,
                'total_reach': total_reach,
                'total_engagement': total_engagement,
                'avg_engagement_rate': round(avg_engagement_rate, 2),
                'total_link_clicks': total_link_clicks,
                'link_click_rate': round(link_click_rate, 2),
                'total_conversions': total_conversions,
                'conversion_rate': round(conversion_rate, 2),
                'total_revenue': total_revenue,
                'total_cost': round(total_cost, 2),
                'gross_profit': round(gross_profit, 2),
                'roi': round(roi, 2)
            },
            'benchmarks': {
                'tier': tier,
                'benchmark_engagement': benchmark_engagement,
                'engagement_vs_benchmark': round(engagement_vs_benchmark, 1),
                'benchmark_click_rate': round(benchmark_click_rate, 2),
                'click_vs_benchmark': round(click_vs_benchmark, 1),
                'benchmark_conversion': round(benchmark_conversion, 2),
                'conversion_vs_benchmark': round(conversion_vs_benchmark, 1)
            },
            'content': {
                'best_post': {
                    'title': best_post.get('title', 'N/A'),
                    'type': best_post.get('type', 'N/A'),
                    'engagement_rate': round(best_post.get('engagement_rate', 0), 2),
                    'impressions': best_post.get('impressions', 0)
                },
                'worst_post': {
                    'title': worst_post.get('title', 'N/A'),
                    'type': worst_post.get('type', 'N/A'),
                    'engagement_rate': round(worst_post.get('engagement_rate', 0), 2),
                    'impressions': worst_post.get('impressions', 0)
                }
            },
            'audience': {
                'target_age_coverage': round(target_age_coverage * 100, 1),
                'target_geo_coverage': round(target_geo_coverage * 100, 1),
                'gender_split': demographics.get('gender', {})
            },
            'recommendations': self._generate_recommendations(
                engagement_vs_benchmark,
                click_vs_benchmark,
                conversion_vs_benchmark,
                best_post,
                target_age_coverage,
                roi
            )
        }

        return self.analysis

    def _generate_recommendations(self, eng_vs_bench, click_vs_bench, conv_vs_bench, best_post, target_age, roi):
        """Generate actionable recommendations"""
        recommendations = []

        # Engagement
        if eng_vs_bench > 20:
            recommendations.append({
                'category': 'Performance',
                'priority': 'high',
                'finding': f'Engagement rate превышает benchmark на {abs(eng_vs_bench):.1f}%',
                'action': 'Whitelist для будущих коллабораций. Рассмотреть долгосрочное партнёрство.'
            })
        elif eng_vs_bench < -20:
            recommendations.append({
                'category': 'Performance',
                'priority': 'medium',
                'finding': f'Engagement rate ниже benchmark на {abs(eng_vs_bench):.1f}%',
                'action': 'Проанализировать качество аудитории (bot check). Улучшить контент-бриф.'
            })

        # Clicks
        if click_vs_bench < -15:
            recommendations.append({
                'category': 'CTA',
                'priority': 'high',
                'finding': f'Link click rate ниже benchmark на {abs(click_vs_bench):.1f}%',
                'action': 'Усилить CTA в текстах. Добавить swipe-up/link stickers в Stories.'
            })

        # Conversions
        if conv_vs_bench > 25:
            recommendations.append({
                'category': 'Conversion',
                'priority': 'high',
                'finding': f'Conversion rate превышает benchmark на {abs(conv_vs_bench):.1f}%',
                'action': 'Аудитория высококачественная. Increase budget для следующих коллабораций.'
            })
        elif conv_vs_bench < -20:
            recommendations.append({
                'category': 'Conversion',
                'priority': 'medium',
                'finding': f'Conversion rate ниже benchmark на {abs(conv_vs_bench):.1f}%',
                'action': 'Проверить alignment продукта с аудиторией. Оптимизировать landing page.'
            })

        # Content format
        if best_post.get('type') == 'Reel':
            recommendations.append({
                'category': 'Content',
                'priority': 'medium',
                'finding': f'Reels показали лучший engagement ({best_post.get("engagement_rate", 0):.2f}%)',
                'action': 'Увеличить долю Reels в следующих content plans (70/30 Reels/Static).'
            })

        # Audience
        if target_age < 0.60:
            recommendations.append({
                'category': 'Audience',
                'priority': 'low',
                'finding': f'Target age coverage низкий ({target_age*100:.1f}%)',
                'action': 'Искать инфлюенсеров с аудиторией 25-44 лет для next collabs.'
            })

        # ROI
        if roi < 50:
            recommendations.append({
                'category': 'ROI',
                'priority': 'high',
                'finding': f'ROI низкий ({roi:.1f}%)',
                'action': 'Renegotiate terms (reduce shipping cost, increase content output) или pause collabs.'
            })
        elif roi > 200:
            recommendations.append({
                'category': 'ROI',
                'priority': 'high',
                'finding': f'ROI отличный ({roi:.1f}%)',
                'action': 'Scale up: предложить долгосрочный контракт (6-12 месяцев).'
            })

        return recommendations

    def generate_pdf_report(self, output_path=None):
        """Generate professional PDF report"""
        if not output_path:
            timestamp = datetime.now().strftime('%Y%m%d')
            handle = self.handle or self.agreement_id
            output_path = REPORTS_DIR / f'Collab_Report_{handle}_{timestamp}.pdf'

        REPORTS_DIR.mkdir(parents=True, exist_ok=True)

        doc = SimpleDocTemplate(
            str(output_path),
            pagesize=A4,
            rightMargin=20*mm,
            leftMargin=20*mm,
            topMargin=20*mm,
            bottomMargin=20*mm
        )

        story = []
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=30,
            alignment=TA_CENTER
        )

        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#333333'),
            spaceAfter=12,
            spaceBefore=12
        )

        # Title
        story.append(Paragraph('HAORI VISION', styles['Normal']))
        story.append(Paragraph('Influencer Collaboration Report', title_style))
        story.append(Spacer(1, 12))

        # Metadata
        metadata = [
            ['Agreement ID:', self.agreement_id or 'N/A'],
            ['Influencer:', f'@{self.handle}' if self.handle else 'N/A'],
            ['Platform:', self.data.get('agreement', {}).get('platform', 'N/A')],
            ['Report Date:', datetime.now().strftime('%Y-%m-%d')],
            ['Campaign Period:', 'Oct 2025']
        ]

        metadata_table = Table(metadata, colWidths=[80*mm, 80*mm])
        metadata_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#666666')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6)
        ]))
        story.append(metadata_table)
        story.append(Spacer(1, 20))

        # Executive Summary
        story.append(Paragraph('Executive Summary', heading_style))

        summary = self.analysis.get('summary', {})

        summary_data = [
            ['Metric', 'Value', 'Status'],
            ['Total Impressions', f"{summary.get('total_impressions', 0):,}", '✓'],
            ['Total Reach', f"{summary.get('total_reach', 0):,}", '✓'],
            ['Engagement Rate', f"{summary.get('avg_engagement_rate', 0):.2f}%",
             '✓' if summary.get('avg_engagement_rate', 0) > 5 else '⚠'],
            ['Link Clicks', f"{summary.get('total_link_clicks', 0):,}", '✓'],
            ['Click Rate', f"{summary.get('link_click_rate', 0):.2f}%",
             '✓' if summary.get('link_click_rate', 0) > 1.5 else '⚠'],
            ['Conversions', str(summary.get('total_conversions', 0)),
             '✓' if summary.get('total_conversions', 0) > 5 else '⚠'],
            ['Conversion Rate', f"{summary.get('conversion_rate', 0):.2f}%",
             '✓' if summary.get('conversion_rate', 0) > 2 else '⚠'],
            ['Revenue', f"€{summary.get('total_revenue', 0):,}", '✓'],
            ['ROI', f"{summary.get('roi', 0):.1f}%",
             '✓' if summary.get('roi', 0) > 100 else '⚠']
        ]

        summary_table = Table(summary_data, colWidths=[60*mm, 60*mm, 20*mm])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6366f1')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (2, 0), (2, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')])
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 20))

        # Benchmark Comparison
        story.append(Paragraph('Benchmark Comparison', heading_style))

        benchmarks = self.analysis.get('benchmarks', {})

        bench_data = [
            ['Metric', 'Actual', 'Benchmark', 'vs Benchmark'],
            ['Engagement Rate', f"{summary.get('avg_engagement_rate', 0):.2f}%",
             f"{benchmarks.get('benchmark_engagement', 0):.2f}%",
             f"{benchmarks.get('engagement_vs_benchmark', 0):+.1f}%"],
            ['Click Rate', f"{summary.get('link_click_rate', 0):.2f}%",
             f"{benchmarks.get('benchmark_click_rate', 0):.2f}%",
             f"{benchmarks.get('click_vs_benchmark', 0):+.1f}%"],
            ['Conversion Rate', f"{summary.get('conversion_rate', 0):.2f}%",
             f"{benchmarks.get('benchmark_conversion', 0):.2f}%",
             f"{benchmarks.get('conversion_vs_benchmark', 0):+.1f}%"]
        ]

        bench_table = Table(bench_data, colWidths=[50*mm, 30*mm, 30*mm, 30*mm])
        bench_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4f46e5')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
        ]))
        story.append(bench_table)
        story.append(Spacer(1, 20))

        # Page break
        story.append(PageBreak())

        # Content Performance
        story.append(Paragraph('Content Performance', heading_style))

        posts = self.data.get('performance', {}).get('posts', [])
        content_data = [['Post', 'Type', 'Impressions', 'Eng Rate', 'Clicks']]

        for post in posts:
            content_data.append([
                post.get('title', 'N/A')[:30] + '...' if len(post.get('title', '')) > 30 else post.get('title', 'N/A'),
                post.get('type', 'N/A'),
                f"{post.get('impressions', 0):,}",
                f"{post.get('engagement_rate', 0):.2f}%",
                f"{post.get('link_clicks', 0):,}"
            ])

        content_table = Table(content_data, colWidths=[60*mm, 25*mm, 30*mm, 25*mm, 25*mm])
        content_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6366f1')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (2, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')])
        ]))
        story.append(content_table)
        story.append(Spacer(1, 20))

        # Recommendations
        story.append(Paragraph('Recommendations', heading_style))

        recommendations = self.analysis.get('recommendations', [])

        for i, rec in enumerate(recommendations, 1):
            priority_color = {
                'high': colors.HexColor('#dc2626'),
                'medium': colors.HexColor('#f59e0b'),
                'low': colors.HexColor('#10b981')
            }.get(rec['priority'], colors.grey)

            rec_text = f"<b>{i}. [{rec['category'].upper()}]</b> {rec['finding']}<br/>" \
                      f"<i>Action:</i> {rec['action']}"

            story.append(Paragraph(rec_text, styles['Normal']))
            story.append(Spacer(1, 10))

        # Footer watermark
        def add_watermark(canvas_obj, doc_obj):
            canvas_obj.saveState()
            canvas_obj.setFont('Helvetica', 8)
            canvas_obj.setFillColor(colors.HexColor('#999999'))
            canvas_obj.drawRightString(
                A4[0] - 20*mm,
                15*mm,
                f'HAORI VISION — Confidential — {datetime.now().strftime("%Y-%m-%d")}'
            )
            canvas_obj.restoreState()

        doc.build(story, onFirstPage=add_watermark, onLaterPages=add_watermark)

        return output_path

def main():
    import argparse

    parser = argparse.ArgumentParser(description='HAORI VISION — Collab Report Generator')
    parser.add_argument('--agreement', help='Agreement ID (e.g., COLLAB-2025-001)')
    parser.add_argument('--handle', required=True, help='Influencer handle (e.g., dj_aurora)')
    parser.add_argument('--output', help='Output PDF path')

    args = parser.parse_args()

    print('\n📊 HAORI VISION — Collab Report Generator\n')
    print(f'Influencer: @{args.handle}')
    if args.agreement:
        print(f'Agreement: {args.agreement}')
    print()

    # Generate report
    generator = CollabReportGenerator(
        agreement_id=args.agreement,
        handle=args.handle
    )

    print('📄 Loading data...')
    if args.agreement:
        generator.load_agreement_data()
    generator.load_performance_data()
    print('   ✅ Data loaded')

    print('\n🔍 Analyzing performance...')
    analysis = generator.analyze()
    print('   ✅ Analysis complete')

    # Print summary
    summary = analysis.get('summary', {})
    print(f'\n📈 Summary:')
    print(f'   Impressions: {summary.get("total_impressions", 0):,}')
    print(f'   Engagement Rate: {summary.get("avg_engagement_rate", 0):.2f}%')
    print(f'   Conversions: {summary.get("total_conversions", 0)}')
    print(f'   Revenue: €{summary.get("total_revenue", 0):,}')
    print(f'   ROI: {summary.get("roi", 0):.1f}%')

    benchmarks = analysis.get('benchmarks', {})
    print(f'\n🎯 vs Benchmarks:')
    print(f'   Engagement: {benchmarks.get("engagement_vs_benchmark", 0):+.1f}%')
    print(f'   Click Rate: {benchmarks.get("click_vs_benchmark", 0):+.1f}%')
    print(f'   Conversion: {benchmarks.get("conversion_vs_benchmark", 0):+.1f}%')

    print(f'\n💡 Recommendations: {len(analysis.get("recommendations", []))}')
    for rec in analysis.get('recommendations', [])[:3]:
        print(f'   • [{rec["priority"].upper()}] {rec["finding"][:60]}...')

    print('\n📑 Generating PDF report...')
    output_path = generator.generate_pdf_report(args.output)
    print(f'   ✅ Report generated: {output_path}')

    print(f'\n✅ Complete!\n')

if __name__ == '__main__':
    main()
