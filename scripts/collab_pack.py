#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""HAORI VISION — Influencer Collab Pack Builder

Генерация полного пакета для коллаборации:
- Персонализированное соглашение
- Креативный бриф
- Контент-план
- UTM/QR ссылки
- Handover form
"""

import sys
import csv
import json
import subprocess
from pathlib import Path
from datetime import datetime, timedelta

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = Path(__file__).parent.parent
COLLAB_DIR = PROJECT_ROOT / 'collab'
TEMPLATES_DIR = COLLAB_DIR / 'templates'
DATA_DIR = COLLAB_DIR / 'data'
AGREEMENTS_DIR = COLLAB_DIR / 'agreements'
CONTENT_PLANS_DIR = COLLAB_DIR / 'content_plans'

# Mock influencer database (в продакшене — из influencers.csv)
INFLUENCERS_DB = {
    'dj_aurora': {
        'name': 'Aurora Lindström',
        'email': 'aurora@example.com',
        'platform': 'Instagram',
        'followers': 85000,
        'engagement_rate': 7.2,
        'niche': 'Music/Fashion',
        'address': 'Stockholm, Sweden'
    },
    'urban_nomad': {
        'name': 'Marcus Chen',
        'email': 'marcus@example.com',
        'platform': 'TikTok',
        'followers': 120000,
        'engagement_rate': 9.1,
        'niche': 'Streetwear',
        'address': 'Copenhagen, Denmark'
    }
}

# Products catalog
PRODUCTS_CATALOG = {
    'ECLIPSE-01': {'name': 'Eclipse Haori', 'price': 650, 'category': 'UV-reactive'},
    'ECLIPSE-02': {'name': 'Eclipse Haori Dark', 'price': 650, 'category': 'UV-reactive'},
    'LUMIN-01': {'name': 'Luminescence Jacket', 'price': 720, 'category': 'Photochromic'},
    'BLOOM-01': {'name': 'Bloom Haori', 'price': 680, 'category': 'UV-reactive'},
    'BLOOM-02': {'name': 'Bloom Haori Night', 'price': 680, 'category': 'UV-reactive'}
}

def generate_agreement_id():
    """Generate unique agreement ID"""
    year = datetime.now().year
    count = len(list(AGREEMENTS_DIR.glob('COLLAB-*'))) + 1 if AGREEMENTS_DIR.exists() else 1
    return f"COLLAB-{year}-{count:03d}"

def fill_template(template_path, output_path, replacements):
    """Fill template with data"""
    with open(template_path, 'r', encoding='utf-8') as f:
        content = f.read()

    for key, value in replacements.items():
        content = content.replace(f'{{{{{key}}}}}', str(value))

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)

def generate_collab_links(handle, skus, campaign):
    """Generate UTM links using collab_links.mjs"""
    skus_str = ','.join(skus)
    cmd = [
        'node',
        str(PROJECT_ROOT / 'scripts' / 'collab_links.mjs'),
        f'--handle={handle}',
        f'--skus={skus_str}',
        f'--campaign={campaign}'
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    print(result.stdout)

    # Load generated links
    links_file = COLLAB_DIR / 'data' / 'collab_links.json'
    if links_file.exists():
        with open(links_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Get last N links (where N = len(skus))
            return data['links'][-len(skus):]

    return []

def create_agreement(handle, skus, sizes, agreement_id, campaign):
    """Create personalized agreement"""
    influencer = INFLUENCERS_DB.get(handle, {})

    # Calculate total value
    total_value = sum(PRODUCTS_CATALOG[sku]['price'] for sku in skus)

    # Dates
    today = datetime.now()
    return_deadline = today + timedelta(days=45)
    content_deadline = today + timedelta(days=30)

    replacements = {
        'DATE': today.strftime('%Y-%m-%d'),
        'AGREEMENT_ID': agreement_id,
        'BRAND_ADDRESS': 'Stockholm, Sweden',
        'BRAND_EMAIL': 'partnerships@haorivision.com',
        'BRAND_REP': 'Brand Manager',
        'INFLUENCER_NAME': influencer.get('name', 'Influencer Name'),
        'PLATFORM': influencer.get('platform', 'Instagram'),
        'HANDLE': handle,
        'INFLUENCER_EMAIL': influencer.get('email', ''),
        'SHIPPING_ADDRESS': influencer.get('address', ''),
        'PHONE': '+46 XXX XXX XXX',
        'SKU_1': skus[0] if len(skus) > 0 else '',
        'PRODUCT_1': PRODUCTS_CATALOG.get(skus[0], {}).get('name', '') if len(skus) > 0 else '',
        'SIZE_1': sizes[0] if len(sizes) > 0 else '',
        'PRICE_1': PRODUCTS_CATALOG.get(skus[0], {}).get('price', 0) if len(skus) > 0 else 0,
        'QTY_1': 1,
        'SKU_2': skus[1] if len(skus) > 1 else '',
        'PRODUCT_2': PRODUCTS_CATALOG.get(skus[1], {}).get('name', '') if len(skus) > 1 else '',
        'SIZE_2': sizes[1] if len(sizes) > 1 else '',
        'PRICE_2': PRODUCTS_CATALOG.get(skus[1], {}).get('price', 0) if len(skus) > 1 else 0,
        'QTY_2': 1 if len(skus) > 1 else 0,
        'TOTAL_VALUE': total_value,
        'POSTS_COUNT': '5-7',
        'FORMATS': '2-3 Reels, 2 Stories, 1 Carousel',
        'CONTENT_DEADLINE': content_deadline.strftime('%Y-%m-%d'),
        'APPROVAL_DAYS': 3,
        'LICENSE_DURATION': '12 months',
        'EXCLUSIVITY_PERIOD': '60 days',
        'COMPETITOR_CATEGORIES': 'UV-reactive fashion, photochromic apparel',
        'REPORTING_DAYS': 7,
        'REPORT_FORMAT': 'PDF with screenshots',
        'REPORT_DEADLINE': (content_deadline + timedelta(days=7)).strftime('%Y-%m-%d'),
        'RETURN_DEADLINE': return_deadline.strftime('%Y-%m-%d'),
        'RETURN_METHOD': 'Courier (organized by brand)',
        'RETURN_ADDRESS': 'HAORI VISION, Stockholm, Sweden',
        'CLEANING_REQUIRED': 'No (допустимы следы носки)',
        'LOSS_PENALTY': 70,
        'DAMAGE_PENALTY': 50,
        'BUYOUT_PRICE': '50% от MSRP',
        'BUYOUT_DEADLINE': return_deadline.strftime('%Y-%m-%d'),
        'FEE_AMOUNT': 'N/A (barter)',
        'CPA_AMOUNT': '',
        'PROMO_CODE': '',
        'PAYMENT_METHOD': 'N/A',
        'PAYMENT_TERMS': 'N/A',
        'FORCE_MAJEURE_NOTICE': 7,
        'GOVERNING_LAW': 'Swedish law',
        'NEGOTIATION_PERIOD': 14,
        'DISPUTE_RESOLUTION': 'Arbitration in Stockholm',
        'BRAND_SIGNATORY': 'Brand Manager',
        'BRAND_TITLE': 'Partnerships Lead',
        'E_SIGNATURE_LAW': 'EU eIDAS Regulation'
    }

    agreement_dir = AGREEMENTS_DIR / agreement_id
    agreement_dir.mkdir(parents=True, exist_ok=True)

    agreement_file = agreement_dir / 'agreement.md'
    fill_template(TEMPLATES_DIR / 'agreement_template.md', agreement_file, replacements)

    return agreement_file

def create_brief(handle, campaign, agreement_id):
    """Create creative brief"""
    influencer = INFLUENCERS_DB.get(handle, {})

    today = datetime.now()
    shooting_date = today + timedelta(days=7)
    editing_date = today + timedelta(days=14)
    approval_date = today + timedelta(days=21)
    publication_date = today + timedelta(days=25)

    replacements = {
        'INFLUENCER_NAME': influencer.get('name', 'Influencer Name'),
        'HANDLE': handle,
        'DATE': today.strftime('%Y-%m-%d'),
        'CAMPAIGN_NAME': campaign,
        'POSTS_COUNT': '5-7',
        'EXCLUSIVITY_PERIOD': '60 days',
        'SHORT_URL': f'haorivision.com/c/{handle[:8]}',
        'CONTENT_DEADLINE': (today + timedelta(days=30)).strftime('%Y-%m-%d'),
        'SHOOTING_DATE': shooting_date.strftime('%Y-%m-%d'),
        'EDITING_DATE': editing_date.strftime('%Y-%m-%d'),
        'APPROVAL_DATE': approval_date.strftime('%Y-%m-%d'),
        'PUBLICATION_DATE': publication_date.strftime('%Y-%m-%d'),
        'APPROVAL_DAYS': 3,
        'TARGET_ENGAGEMENT': '5-8',
        'TARGET_IMPRESSIONS': '50k+',
        'TARGET_CLICKS': '500+',
        'TARGET_UGC': '10+',
        'REPORT_DEADLINE': (publication_date + timedelta(days=7)).strftime('%Y-%m-%d'),
        'BRAND_MANAGER': 'Brand Manager',
        'BRAND_EMAIL': 'partnerships@haorivision.com',
        'BRAND_PHONE': '+46 XXX XXX XXX',
        'PRODUCT_EMAIL': 'product@haorivision.com',
        'RESPONSE_TIME': '24 hours',
        'PARTNER_TAGS': '@partner1 @partner2 (если применимо)'
    }

    agreement_dir = AGREEMENTS_DIR / agreement_id
    brief_file = agreement_dir / 'brief.md'
    fill_template(TEMPLATES_DIR / 'brief_template.md', brief_file, replacements)

    return brief_file

def create_content_plan(handle, skus, campaign, agreement_id):
    """Create content plan"""
    influencer = INFLUENCERS_DB.get(handle, {})

    today = datetime.now()

    content_plan = f"""# HAORI VISION — Content Plan

**Инфлюенсер:** {influencer.get('name', 'Influencer Name')} (@{handle})
**Платформа:** {influencer.get('platform', 'Instagram')}
**Кампания:** {campaign}
**Agreement ID:** {agreement_id}
**Дата:** {today.strftime('%Y-%m-%d')}

---

## 📦 Товары для коллаборации

"""

    for sku in skus:
        product = PRODUCTS_CATALOG.get(sku, {})
        content_plan += f"- **{sku}:** {product.get('name', '')} (€{product.get('price', 0)})\n"

    content_plan += f"""
---

## 🎬 Контент-план (5-7 постов)

### 1. Reel: "Daylight → UV Transition" (MUST-HAVE)

**Формат:** Instagram Reel / TikTok (15-30 сек)

**Концепция:**
- Начало: Дневной свет, показать базовый цвет хаори (элегантный, минималистичный)
- 0:05-0:10: Переход к UV-освещению (резкий, драматичный)
- 0:10-0:25: Крупные планы UV-паттернов, движение, танец
- 0:25-0:30: Финальный кадр с логотипом @haorivision

**Музыка:** Ambient / Downtempo House (без авторских проблем)

**Текст:**
"Свет меняет всё. 🌌 @haorivision #haorivision #wearlight #uvart"

**Дедлайн:** {(today + timedelta(days=10)).strftime('%Y-%m-%d')}

**UTM-ссылка:** Bio link (см. collab_links.json)

---

### 2. Carousel: "Детали и крупные планы" (5-10 фото)

**Формат:** Instagram Carousel

**Концепция:**
- Фото 1: Полный образ (daylight)
- Фото 2-4: Крупные планы UV-паттернов
- Фото 5-7: Детали кроя, ткани
- Фото 8-10: UV-освещение, магия света

**Текст:**
"Искусство, которое можно носить. Каждый паттерн — это история света. ✨ @haorivision #haorivision #artfashion #photochromicfashion"

**Дедлайн:** {(today + timedelta(days=15)).strftime('%Y-%m-%d')}

---

### 3. Story: "Behind-the-Scenes" (серия 3-5 Stories)

**Формат:** Instagram Stories

**Концепция:**
- Story 1: Unboxing (распаковка, первые впечатления)
- Story 2: Процесс съёмки (setup, UV-лампы)
- Story 3: Реакция на UV-эффект ("Wow moment!")
- Story 4: Poll/Question sticker ("Какой цвет круче?")
- Story 5: Swipe-up / Link sticker (UTM-ссылка)

**Дедлайн:** {(today + timedelta(days=7)).strftime('%Y-%m-%d')}

---

### 4. Reel: "Стилизация и образ"

**Формат:** Instagram Reel / TikTok (15-20 сек)

**Концепция:**
- Показать, как хаори сочетается с разными стилями (streetwear, minimal, avant-garde)
- Быстрый монтаж, смена образов
- UV-акцент в финале

**Текст:**
"Одна вещь — бесконечные образы. От дня к ночи. 🔮 @haorivision #haorivision #futuristicfashion"

**Дедлайн:** {(today + timedelta(days=20)).strftime('%Y-%m-%d')}

---

### 5. Static Post: "Философия бренда"

**Формат:** Instagram Static Post (1 фото)

**Концепция:**
- Портретное фото в хаори (UV-свет)
- Эмоциональный, личный текст (почему это важно)

**Текст (пример):**
"Мода для меня — это не просто одежда. Это способ выражения. HAORI VISION создаёт вещи, которые живут в двух мирах — дневном и ночном. Это магия, которую я могу носить каждый день. 🌌 @haorivision #haorivision #wearlight"

**Дедлайн:** {(today + timedelta(days=25)).strftime('%Y-%m-%d')}

---

### 6. Story: "Care & Sustainability"

**Формат:** Instagram Stories

**Концепция:**
- Показать care instructions (как ухаживать за UV-покрытием)
- Sustainable message (японское мастерство, долговечность)

**Дедлайн:** {(today + timedelta(days=30)).strftime('%Y-%m-%d')}

---

### 7. Reel/TikTok: "User Reaction" (опционально)

**Формат:** TikTok (15 сек)

**Концепция:**
- Показать реакцию друзей/фанатов на UV-эффект
- Аутентичное "wow", удивление

**Текст:**
"Их реакции — бесценны. 😂✨ @haorivision #haorivision #uvreactive"

**Дедлайн:** {(today + timedelta(days=35)).strftime('%Y-%m-%d')}

---

## ✅ Обязательные элементы (каждый пост)

- [ ] @haorivision упомянут
- [ ] #haorivision (обязательно)
- [ ] Минимум 2 дополнительных хэштега (#wearlight, #uvart, #artfashion)
- [ ] #ad / #sponsored (FTC compliance)
- [ ] UTM-ссылка в био или swipe-up (Stories)

---

## 📊 Метрики и отчётность

**Дедлайн отчёта:** {(today + timedelta(days=37)).strftime('%Y-%m-%d')} (7 дней после последней публикации)

**Требуемые данные:**
- Impressions (охват)
- Engagement rate (лайки, комментарии, сохранения)
- Клики по ссылке (UTM)
- Screenshots инсайтов

**Формат:** PDF или Google Sheet

---

## 🔗 UTM-ссылки

См. `collab/links/{handle}_{campaign}_pack.json`

Короткие ссылки для каждого SKU:
"""

    # Add links for each SKU
    for sku in skus:
        content_plan += f"- **{sku}:** `haorivision.com/c/[hash]` (см. JSON)\n"

    content_plan += f"""
---

## 📞 Контакты

**Вопросы по контенту:**
- Email: partnerships@haorivision.com
- Telegram: @haori_team

**Срочные вопросы:**
- Время ответа: 24 часа (рабочие дни)

---

**Спасибо за партнёрство! 🌌✨**

**HAORI VISION Creative Team**
"""

    content_plan_file = CONTENT_PLANS_DIR / f'{handle}_{campaign}.md'
    CONTENT_PLANS_DIR.mkdir(parents=True, exist_ok=True)
    content_plan_file.write_text(content_plan, encoding='utf-8')

    return content_plan_file

def create_handover_form(handle, skus, sizes, agreement_id):
    """Create handover form"""
    influencer = INFLUENCERS_DB.get(handle, {})

    total_value = sum(PRODUCTS_CATALOG[sku]['price'] for sku in skus)
    return_deadline = (datetime.now() + timedelta(days=45)).strftime('%Y-%m-%d')

    replacements = {
        'AGREEMENT_ID': agreement_id,
        'INFLUENCER_NAME': influencer.get('name', ''),
        'PLATFORM': influencer.get('platform', ''),
        'HANDLE': handle,
        'EMAIL': influencer.get('email', ''),
        'PHONE': '+46 XXX XXX XXX',
        'SHIPPING_ADDRESS': influencer.get('address', ''),
        'SKU_1': skus[0] if len(skus) > 0 else '',
        'PRODUCT_1': PRODUCTS_CATALOG.get(skus[0], {}).get('name', '') if len(skus) > 0 else '',
        'SIZE_1': sizes[0] if len(sizes) > 0 else '',
        'COLOR_1': 'Black',
        'PRICE_1': PRODUCTS_CATALOG.get(skus[0], {}).get('price', 0) if len(skus) > 0 else 0,
        'QTY_1': 1,
        'SKU_2': skus[1] if len(skus) > 1 else '',
        'PRODUCT_2': PRODUCTS_CATALOG.get(skus[1], {}).get('name', '') if len(skus) > 1 else '',
        'SIZE_2': sizes[1] if len(sizes) > 1 else '',
        'COLOR_2': 'Navy',
        'PRICE_2': PRODUCTS_CATALOG.get(skus[1], {}).get('price', 0) if len(skus) > 1 else 0,
        'QTY_2': 1 if len(skus) > 1 else 0,
        'SKU_3': '',
        'PRODUCT_3': '',
        'SIZE_3': '',
        'COLOR_3': '',
        'PRICE_3': 0,
        'QTY_3': 0,
        'TOTAL_VALUE': total_value,
        'PHOTO_LINK': 'https://drive.google.com/...',
        'ACCESSORIES_1': 'Care card, branded packaging',
        'ACCESSORIES_2': 'Care card, branded packaging',
        'ACCESSORIES_3': '',
        'RETURN_DEADLINE': return_deadline,
        'COURIER_SERVICE': 'DHL Express',
        'POSTAL_SERVICE': '',
        'TRACKING_NUMBER': 'DHL123456789',
        'SHIPPING_COST': 0,
        'INSURANCE_VALUE': total_value,
        'POSTS_COUNT': '5-7',
        'FORMATS': '2-3 Reels, 2 Stories, 1 Carousel',
        'CONTENT_DEADLINE': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
        'HANDLE': handle,
        'DATE': datetime.now().strftime('%Y-%m-%d'),
        'RETURN_ADDRESS': 'HAORI VISION, Stockholm, Sweden',
        'LOSS_PENALTY': 70,
        'DAMAGE_PENALTY': 50,
        'BUYOUT_PRICE': '50% от MSRP',
        'BUYOUT_DISCOUNT': 50,
        'BUYOUT_DEADLINE': return_deadline,
        'BRAND_REP': 'Brand Manager',
        'BRAND_TITLE': 'Partnerships Lead'
    }

    agreement_dir = AGREEMENTS_DIR / agreement_id
    handover_file = agreement_dir / 'handover_form.md'
    fill_template(TEMPLATES_DIR / 'handover_form.md', handover_file, replacements)

    return handover_file

def main():
    import argparse

    parser = argparse.ArgumentParser(description='HAORI VISION — Influencer Collab Pack Builder')
    parser.add_argument('--handle', required=True, help='Influencer handle (e.g., dj_aurora)')
    parser.add_argument('--skus', required=True, help='Comma-separated SKUs (e.g., ECLIPSE-01,LUMIN-01)')
    parser.add_argument('--sizes', required=True, help='Comma-separated sizes (e.g., M,L)')
    parser.add_argument('--campaign', default=None, help='Campaign name (default: auto-generated)')

    args = parser.parse_args()

    handle = args.handle.replace('@', '')
    skus = args.skus.split(',')
    sizes = args.sizes.split(',')
    campaign = args.campaign or f'collab-{handle}-{datetime.now().strftime("%Y%m%d")}'

    print('\n🎨 HAORI VISION — Influencer Collab Pack Builder\n')
    print(f'Influencer: @{handle}')
    print(f'SKUs: {", ".join(skus)}')
    print(f'Campaign: {campaign}\n')

    # Generate agreement ID
    agreement_id = generate_agreement_id()
    print(f'📝 Agreement ID: {agreement_id}')

    # Create agreement
    print('\n📄 Creating agreement...')
    agreement_file = create_agreement(handle, skus, sizes, agreement_id, campaign)
    print(f'   ✅ {agreement_file.name}')

    # Create brief
    print('\n📋 Creating creative brief...')
    brief_file = create_brief(handle, campaign, agreement_id)
    print(f'   ✅ {brief_file.name}')

    # Create content plan
    print('\n🎬 Creating content plan...')
    content_plan_file = create_content_plan(handle, skus, campaign, agreement_id)
    print(f'   ✅ {content_plan_file.name}')

    # Generate UTM links
    print('\n🔗 Generating UTM/QR links...')
    links = generate_collab_links(handle, skus, campaign)
    print(f'   ✅ {len(links)} links generated')

    # Create handover form
    print('\n📦 Creating handover form...')
    handover_file = create_handover_form(handle, skus, sizes, agreement_id)
    print(f'   ✅ {handover_file.name}')

    print(f'\n✅ Collab pack complete!')
    print(f'📁 All files saved to: {AGREEMENTS_DIR / agreement_id}')
    print(f'\n💡 Next steps:')
    print(f'   1. Review agreement: {agreement_file}')
    print(f'   2. Send to influencer for signature')
    print(f'   3. Ship items (track in loan_log.md)')
    print(f'   4. Monitor content plan execution\n')

if __name__ == '__main__':
    main()
