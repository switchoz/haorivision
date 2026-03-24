#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""HAORI VISION — Collab Compliance Audit

Автоматическая проверка соблюдения:
- FTC/ASA disclosure requirements (#ad, #sponsored)
- Brand guidelines (@haorivision mention, hashtags)
- Content plan execution (дедлайны, форматы)
- Safety requirements (UV safety warnings)
- Contract compliance (эксклюзивность, запрет конкурентов)
"""

import sys
import json
import re
from pathlib import Path
from datetime import datetime, timedelta

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = Path(__file__).parent.parent
COLLAB_DIR = PROJECT_ROOT / 'collab'

class ComplianceAuditor:
    def __init__(self, handle, campaign):
        self.handle = handle
        self.campaign = campaign
        self.violations = []
        self.warnings = []
        self.passed = []

    def load_content_plan(self):
        """Load content plan"""
        content_plan_file = COLLAB_DIR / 'content_plans' / f'{self.handle}_{self.campaign}.md'

        if not content_plan_file.exists():
            print(f'❌ Content plan not found: {content_plan_file}')
            return None

        with open(content_plan_file, 'r', encoding='utf-8') as f:
            return f.read()

    def load_published_posts(self):
        """Load published posts data (mock)"""
        # В продакшене — парсинг через Instagram API, TikTok API
        return [
            {
                'id': 1,
                'type': 'Reel',
                'title': 'Daylight → UV Transition',
                'published_date': '2025-10-10',
                'planned_date': '2025-10-10',
                'caption': 'Свет меняет всё. 🌌 @haorivision #haorivision #wearlight #uvart #sponsored',
                'hashtags': ['haorivision', 'wearlight', 'uvart', 'sponsored'],
                'mentions': ['haorivision'],
                'has_paid_partnership_tag': True,
                'link_in_bio': 'haorivision.com/c/b61340b3',
                'competitor_mentions': []
            },
            {
                'id': 2,
                'type': 'Carousel',
                'title': 'Детали и крупные планы',
                'published_date': '2025-10-15',
                'planned_date': '2025-10-15',
                'caption': 'Искусство, которое можно носить. ✨ @haorivision #haorivision #artfashion',
                'hashtags': ['haorivision', 'artfashion'],
                'mentions': ['haorivision'],
                'has_paid_partnership_tag': False,  # VIOLATION!
                'link_in_bio': 'haorivision.com/c/c120d577',
                'competitor_mentions': []
            },
            {
                'id': 3,
                'type': 'Story',
                'title': 'Behind-the-Scenes',
                'published_date': '2025-10-07',
                'planned_date': '2025-10-07',
                'caption': 'BTS съёмки для @haorivision 🎬',
                'hashtags': [],
                'mentions': ['haorivision'],
                'has_paid_partnership_tag': True,
                'link_sticker': 'haorivision.com/c/x12345',
                'competitor_mentions': []
            },
            {
                'id': 4,
                'type': 'Reel',
                'title': 'Стилизация и образ',
                'published_date': '2025-10-25',  # LATE!
                'planned_date': '2025-10-20',
                'caption': 'Одна вещь — бесконечные образы. 🔮 @haorivision @competitorbrand #haorivision',
                'hashtags': ['haorivision'],
                'mentions': ['haorivision', 'competitorbrand'],  # VIOLATION!
                'has_paid_partnership_tag': True,
                'link_in_bio': 'haorivision.com/c/y67890',
                'competitor_mentions': ['competitorbrand']
            }
        ]

    def audit_ftc_disclosure(self, posts):
        """Audit FTC/ASA disclosure compliance"""
        print('\n🔍 Auditing FTC/ASA Disclosure...\n')

        for post in posts:
            post_id = f"Post #{post['id']} ({post['type']})"

            # Check paid partnership tag (Instagram/TikTok)
            if not post.get('has_paid_partnership_tag', False):
                # Check for manual disclosure in caption
                caption_lower = post.get('caption', '').lower()
                has_ad_tag = any(tag in caption_lower for tag in ['#ad', '#sponsored', '#paidpartnership'])

                if not has_ad_tag:
                    self.violations.append({
                        'post': post_id,
                        'category': 'FTC Disclosure',
                        'severity': 'CRITICAL',
                        'finding': 'Missing FTC disclosure (no #ad, #sponsored, or Paid Partnership tag)',
                        'requirement': 'FTC 16 CFR Part 255, ASA CAP Code',
                        'action': 'Update caption with #ad or #sponsored, or add Paid Partnership tag',
                        'risk': 'Legal liability, platform penalty, brand reputation damage'
                    })
                else:
                    self.warnings.append({
                        'post': post_id,
                        'category': 'FTC Disclosure',
                        'severity': 'MEDIUM',
                        'finding': 'Manual disclosure (#ad/#sponsored) used instead of Paid Partnership tag',
                        'recommendation': 'Use built-in Paid Partnership tag for better compliance'
                    })
            else:
                self.passed.append(f'{post_id}: FTC Disclosure ✓')

    def audit_brand_guidelines(self, posts):
        """Audit brand guidelines compliance"""
        print('🔍 Auditing Brand Guidelines...\n')

        for post in posts:
            post_id = f"Post #{post['id']} ({post['type']})"

            # Check @haorivision mention
            if 'haorivision' not in post.get('mentions', []):
                self.violations.append({
                    'post': post_id,
                    'category': 'Brand Mention',
                    'severity': 'HIGH',
                    'finding': 'Missing @haorivision mention',
                    'requirement': 'Creative Brief section "Обязательные элементы"',
                    'action': 'Update caption to include @haorivision'
                })
            else:
                self.passed.append(f'{post_id}: @haorivision mention ✓')

            # Check #haorivision hashtag
            hashtags = post.get('hashtags', [])
            if 'haorivision' not in hashtags:
                self.violations.append({
                    'post': post_id,
                    'category': 'Brand Hashtag',
                    'severity': 'HIGH',
                    'finding': 'Missing #haorivision hashtag',
                    'requirement': 'Creative Brief section "Хэштеги"',
                    'action': 'Add #haorivision hashtag'
                })
            else:
                self.passed.append(f'{post_id}: #haorivision hashtag ✓')

            # Check additional hashtags (recommended: #wearlight, #uvart, #artfashion)
            recommended_hashtags = ['wearlight', 'uvart', 'artfashion', 'photochromicfashion']
            has_recommended = any(tag in hashtags for tag in recommended_hashtags)

            if not has_recommended:
                self.warnings.append({
                    'post': post_id,
                    'category': 'Brand Hashtags',
                    'severity': 'LOW',
                    'finding': 'Missing recommended hashtags (#wearlight, #uvart, etc.)',
                    'recommendation': 'Add at least 2 recommended hashtags for better discoverability'
                })

            # Check UTM link
            has_link = post.get('link_in_bio') or post.get('link_sticker')
            if not has_link:
                self.warnings.append({
                    'post': post_id,
                    'category': 'UTM Link',
                    'severity': 'MEDIUM',
                    'finding': 'Missing UTM link in bio or link sticker',
                    'recommendation': 'Add UTM link for tracking conversions'
                })
            else:
                self.passed.append(f'{post_id}: UTM link ✓')

    def audit_exclusivity(self, posts):
        """Audit exclusivity clause compliance"""
        print('🔍 Auditing Exclusivity...\n')

        competitors = ['competitorbrand', 'rival', 'otherbrand']  # Mock list

        for post in posts:
            post_id = f"Post #{post['id']} ({post['type']})"

            competitor_mentions = post.get('competitor_mentions', [])
            if competitor_mentions:
                self.violations.append({
                    'post': post_id,
                    'category': 'Exclusivity Violation',
                    'severity': 'CRITICAL',
                    'finding': f'Mention of competitor brand(s): {", ".join(competitor_mentions)}',
                    'requirement': 'Agreement Section 4 (Эксклюзивность)',
                    'action': 'Remove competitor mentions or negotiate breach penalty',
                    'risk': 'Contract breach, possible termination'
                })
            else:
                self.passed.append(f'{post_id}: No competitor mentions ✓')

    def audit_deadlines(self, posts):
        """Audit content plan deadline compliance"""
        print('🔍 Auditing Deadlines...\n')

        for post in posts:
            post_id = f"Post #{post['id']} ({post['type']})"

            published = datetime.strptime(post['published_date'], '%Y-%m-%d')
            planned = datetime.strptime(post['planned_date'], '%Y-%m-%d')

            delay_days = (published - planned).days

            if delay_days > 0:
                severity = 'HIGH' if delay_days > 7 else 'MEDIUM'
                self.violations.append({
                    'post': post_id,
                    'category': 'Deadline Violation',
                    'severity': severity,
                    'finding': f'Published {delay_days} days late (planned: {planned.strftime("%Y-%m-%d")}, actual: {published.strftime("%Y-%m-%d")})',
                    'requirement': 'Content Plan deadlines',
                    'action': 'Discuss timeline adjustment or penalty with influencer'
                })
            elif delay_days < -3:
                self.warnings.append({
                    'post': post_id,
                    'category': 'Early Publication',
                    'severity': 'LOW',
                    'finding': f'Published {abs(delay_days)} days early',
                    'recommendation': 'Generally okay, но check campaign coordination'
                })
            else:
                self.passed.append(f'{post_id}: Published on time ✓')

    def audit_uv_safety(self, posts):
        """Audit UV safety compliance (for UV-reactive content)"""
        print('🔍 Auditing UV Safety...\n')

        uv_keywords = ['uv', 'blacklight', 'ultraviolet', 'strobe', 'flashing']

        for post in posts:
            post_id = f"Post #{post['id']} ({post['type']})"

            caption_lower = post.get('caption', '').lower()
            has_uv_content = any(keyword in caption_lower for keyword in uv_keywords)

            if has_uv_content:
                # Check if UV safety warning is present (should be in Stories or caption)
                has_safety_warning = 'safety' in caption_lower or 'epilepsy' in caption_lower

                if not has_safety_warning and post['type'] in ['Reel', 'Video']:
                    self.warnings.append({
                        'post': post_id,
                        'category': 'UV Safety',
                        'severity': 'MEDIUM',
                        'finding': 'UV content без предупреждения (рекомендуется для Reels/Videos)',
                        'recommendation': 'Add UV safety disclaimer in caption or Story slide'
                    })

    def generate_report(self):
        """Generate compliance audit report"""
        print('\n' + '='*70)
        print('📋 COMPLIANCE AUDIT REPORT')
        print('='*70 + '\n')

        print(f'Influencer: @{self.handle}')
        print(f'Campaign: {self.campaign}')
        print(f'Audit Date: {datetime.now().strftime("%Y-%m-%d %H:%M")}\n')

        print('='*70)
        print('SUMMARY')
        print('='*70 + '\n')

        print(f'✅ Passed Checks: {len(self.passed)}')
        print(f'⚠️  Warnings: {len(self.warnings)}')
        print(f'❌ Violations: {len(self.violations)}\n')

        critical_violations = [v for v in self.violations if v.get('severity') == 'CRITICAL']
        high_violations = [v for v in self.violations if v.get('severity') == 'HIGH']

        if critical_violations:
            print(f'🚨 CRITICAL VIOLATIONS: {len(critical_violations)}')
        if high_violations:
            print(f'⚠️  HIGH SEVERITY: {len(high_violations)}')

        print()

        # Violations
        if self.violations:
            print('='*70)
            print('❌ VIOLATIONS')
            print('='*70 + '\n')

            for i, v in enumerate(self.violations, 1):
                severity_emoji = {'CRITICAL': '🚨', 'HIGH': '⚠️ ', 'MEDIUM': '⚠️ '}.get(v['severity'], '•')
                print(f'{severity_emoji} {i}. [{v["severity"]}] {v["post"]}')
                print(f'   Category: {v["category"]}')
                print(f'   Finding: {v["finding"]}')
                print(f'   Requirement: {v["requirement"]}')
                print(f'   Action Required: {v["action"]}')
                if 'risk' in v:
                    print(f'   Risk: {v["risk"]}')
                print()

        # Warnings
        if self.warnings:
            print('='*70)
            print('⚠️  WARNINGS')
            print('='*70 + '\n')

            for i, w in enumerate(self.warnings, 1):
                print(f'⚠️  {i}. [{w["severity"]}] {w["post"]}')
                print(f'   Category: {w["category"]}')
                print(f'   Finding: {w["finding"]}')
                print(f'   Recommendation: {w["recommendation"]}')
                print()

        # Passed
        if self.passed:
            print('='*70)
            print('✅ PASSED CHECKS')
            print('='*70 + '\n')
            for p in self.passed[:10]:  # Show first 10
                print(f'  {p}')
            if len(self.passed) > 10:
                print(f'  ... and {len(self.passed) - 10} more')
            print()

        # Final recommendation
        print('='*70)
        print('RECOMMENDATION')
        print('='*70 + '\n')

        if critical_violations:
            print('🚨 IMMEDIATE ACTION REQUIRED')
            print('   Critical violations detected. Contact influencer within 24 hours.')
            print('   Consider contract breach procedures if not resolved.')
        elif high_violations:
            print('⚠️  ACTION REQUIRED')
            print('   High severity issues detected. Contact influencer within 3 days.')
        elif self.warnings:
            print('✅ GENERALLY COMPLIANT')
            print('   Minor warnings detected. Address in next communication.')
        else:
            print('✅ FULLY COMPLIANT')
            print('   All checks passed. No action required.')

        print()

def main():
    import argparse

    parser = argparse.ArgumentParser(description='HAORI VISION — Collab Compliance Audit')
    parser.add_argument('--handle', required=True, help='Influencer handle (e.g., dj_aurora)')
    parser.add_argument('--campaign', required=True, help='Campaign name (e.g., test-collab-2025)')

    args = parser.parse_args()

    print('\n🔍 HAORI VISION — Compliance Audit\n')

    auditor = ComplianceAuditor(args.handle, args.campaign)

    # Load content plan
    content_plan = auditor.load_content_plan()
    if not content_plan:
        print('⚠️  Content plan not found. Using mock data.\n')

    # Load published posts
    posts = auditor.load_published_posts()

    # Run audits
    auditor.audit_ftc_disclosure(posts)
    auditor.audit_brand_guidelines(posts)
    auditor.audit_exclusivity(posts)
    auditor.audit_deadlines(posts)
    auditor.audit_uv_safety(posts)

    # Generate report
    auditor.generate_report()

    print(f'✅ Audit complete\n')

if __name__ == '__main__':
    main()
