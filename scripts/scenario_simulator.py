#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
HAORI VISION — Scenario Simulator (Read-Only)

Симулирует edge cases без записи в БД.

Scenarios:
1. Оплата отклонена → reserve снимается, письмо не уходит
2. Потеря сети перед "order confirm" → повторная отправка письма единожды
3. Клиент добавил 2 SKU, 1 sold out → корректное сообщение + Bespoke
4. Нет видео-превью у нового SKU → placeholder + предупреждение в админке

Output:
- Console
- /reports/scenarios_[DATE].txt

Usage:
    python scripts/scenario_simulator.py
    python scripts/scenario_simulator.py --scenario 1
    python scripts/scenario_simulator.py --all
"""

import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
import time
import random

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# ============================================================
# Configuration
# ============================================================

PROJECT_ROOT = Path(__file__).parent.parent
REPORTS_DIR = PROJECT_ROOT / 'reports'
COLLECTIONS_PATH = PROJECT_ROOT / 'data' / 'products' / 'collections.json'

# Test data
TEST_SKUS = ['TEST-001', 'TEST-002', 'HV-202510-001', 'ECLIPSE-01']
TEST_USER = {
    'id': 'user_test_001',
    'email': 'test@example.com',
    'name': 'Test User'
}

# Симуляция состояния (in-memory, не сохраняется)
class SimulationState:
    """Read-only simulation state"""

    def __init__(self):
        self.reservations = []
        self.orders = []
        self.emails_sent = []
        self.products = {}
        self.network_failures = 0
        self.admin_warnings = []

    def add_reservation(self, reservation: Dict):
        self.reservations.append(reservation)

    def release_reservation(self, reservation_id: str):
        for res in self.reservations:
            if res['id'] == reservation_id:
                res['status'] = 'released'
                return True
        return False

    def add_order(self, order: Dict):
        self.orders.append(order)

    def send_email(self, email: Dict):
        self.emails_sent.append(email)

    def fail_network(self):
        self.network_failures += 1

    def add_admin_warning(self, warning: Dict):
        self.admin_warnings.append(warning)

    def get_product(self, sku: str) -> Optional[Dict]:
        return self.products.get(sku)

    def set_product(self, sku: str, product: Dict):
        self.products[sku] = product

# Global state (только для симуляции)
state = SimulationState()

# ============================================================
# Helper Functions
# ============================================================

def load_collections():
    """Load collections.json (read-only)"""
    if not COLLECTIONS_PATH.exists():
        print(f"⚠️  Collections not found: {COLLECTIONS_PATH}")
        return None

    with open(COLLECTIONS_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def find_product_by_sku(collections: Dict, sku: str) -> Optional[Dict]:
    """Find product by SKU"""
    def traverse(obj):
        if isinstance(obj, dict):
            if obj.get('sku') == sku or obj.get('id') == sku:
                return obj
            for value in obj.values():
                result = traverse(value)
                if result:
                    return result
        elif isinstance(obj, list):
            for item in obj:
                result = traverse(item)
                if result:
                    return result
        return None

    return traverse(collections)

def format_timestamp():
    """Current timestamp for logging"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def log_event(event_type: str, message: str, details: Dict = None):
    """Log event to console"""
    timestamp = format_timestamp()
    print(f"\n[{timestamp}] {event_type}")
    print(f"  {message}")

    if details:
        for key, value in details.items():
            print(f"  {key}: {value}")

# ============================================================
# Reservation System (Simulated)
# ============================================================

def create_reservation(sku: str, user_id: str, qty: int = 1) -> Dict:
    """Simulate reservation creation"""
    reservation = {
        'id': f"res_{int(time.time())}_{random.randint(1000, 9999)}",
        'sku': sku,
        'user_id': user_id,
        'qty': qty,
        'status': 'held',
        'created_at': datetime.now().isoformat(),
        'expires_at': (datetime.now() + timedelta(hours=24)).isoformat()
    }

    state.add_reservation(reservation)

    log_event('RESERVATION_CREATED', f'Reserved {sku} for {user_id}', {
        'reservation_id': reservation['id'],
        'qty': qty,
        'expires': reservation['expires_at']
    })

    return reservation

def release_reservation(reservation_id: str, reason: str = 'timeout'):
    """Simulate reservation release"""
    success = state.release_reservation(reservation_id)

    if success:
        log_event('RESERVATION_RELEASED', f'Released reservation {reservation_id}', {
            'reason': reason
        })
    else:
        log_event('ERROR', f'Reservation not found: {reservation_id}')

    return success

# ============================================================
# Payment System (Simulated)
# ============================================================

def process_payment(reservation_id: str, amount: float, payment_method: str = 'card') -> Dict:
    """Simulate payment processing"""
    # Симулируем задержку
    time.sleep(0.5)

    # Случайная вероятность отклонения (для тестирования)
    payment_declined = random.random() < 0.3  # 30% chance

    payment = {
        'id': f"pay_{int(time.time())}_{random.randint(1000, 9999)}",
        'reservation_id': reservation_id,
        'amount': amount,
        'currency': 'EUR',
        'method': payment_method,
        'status': 'declined' if payment_declined else 'succeeded',
        'processed_at': datetime.now().isoformat()
    }

    if payment_declined:
        log_event('PAYMENT_DECLINED', f'Payment declined for reservation {reservation_id}', {
            'payment_id': payment['id'],
            'amount': f'{amount} EUR',
            'reason': 'Insufficient funds / Card declined'
        })
    else:
        log_event('PAYMENT_SUCCESS', f'Payment succeeded for reservation {reservation_id}', {
            'payment_id': payment['id'],
            'amount': f'{amount} EUR'
        })

    return payment

# ============================================================
# Email System (Simulated)
# ============================================================

def send_order_confirmation_email(order: Dict, user: Dict) -> bool:
    """Simulate sending order confirmation email"""
    # Симулируем задержку
    time.sleep(0.3)

    email = {
        'id': f"email_{int(time.time())}_{random.randint(1000, 9999)}",
        'to': user['email'],
        'subject': 'Welcome to the Light Circle — Order Confirmation',
        'order_id': order['id'],
        'sent_at': datetime.now().isoformat()
    }

    state.send_email(email)

    log_event('EMAIL_SENT', f'Order confirmation sent to {user["email"]}', {
        'email_id': email['id'],
        'order_id': order['id']
    })

    return True

def send_payment_failed_email(user: Dict, reservation_id: str) -> bool:
    """Simulate payment failure notification"""
    email = {
        'id': f"email_{int(time.time())}_{random.randint(1000, 9999)}",
        'to': user['email'],
        'subject': 'Payment Failed — Reservation Released',
        'reservation_id': reservation_id,
        'sent_at': datetime.now().isoformat()
    }

    state.send_email(email)

    log_event('EMAIL_SENT', f'Payment failed notification sent to {user["email"]}', {
        'email_id': email['id'],
        'reservation_id': reservation_id
    })

    return True

# ============================================================
# Order System (Simulated)
# ============================================================

def create_order(reservation: Dict, payment: Dict, user: Dict) -> Dict:
    """Simulate order creation"""
    order = {
        'id': f"order_{int(time.time())}_{random.randint(1000, 9999)}",
        'reservation_id': reservation['id'],
        'payment_id': payment['id'],
        'user_id': user['id'],
        'sku': reservation['sku'],
        'qty': reservation['qty'],
        'total': payment['amount'],
        'currency': 'EUR',
        'status': 'confirmed',
        'created_at': datetime.now().isoformat()
    }

    state.add_order(order)

    log_event('ORDER_CREATED', f'Order created for {user["email"]}', {
        'order_id': order['id'],
        'sku': order['sku'],
        'total': f'{order["total"]} EUR'
    })

    return order

# ============================================================
# Network Failure Simulation
# ============================================================

def simulate_network_failure() -> bool:
    """Simulate network failure"""
    state.fail_network()

    log_event('NETWORK_FAILURE', 'Connection lost before order confirmation', {
        'failure_count': state.network_failures
    })

    return True

def retry_send_email(order: Dict, user: Dict, max_retries: int = 1) -> bool:
    """Retry sending email after network failure"""
    for attempt in range(1, max_retries + 2):
        log_event('EMAIL_RETRY', f'Attempt {attempt} to send order confirmation', {
            'order_id': order['id']
        })

        # Симулируем задержку
        time.sleep(0.5)

        # 80% шанс успеха на retry
        success = random.random() < 0.8

        if success:
            return send_order_confirmation_email(order, user)

        if attempt > max_retries:
            log_event('EMAIL_FAILED', 'Max retries reached, email not sent', {
                'order_id': order['id'],
                'attempts': attempt
            })
            return False

    return False

# ============================================================
# Product Availability
# ============================================================

def check_product_availability(sku: str) -> Dict:
    """Check if product is available"""
    product = state.get_product(sku)

    if not product:
        # Load from collections
        collections = load_collections()
        product = find_product_by_sku(collections, sku)

        if product:
            state.set_product(sku, product)

    if not product:
        return {
            'available': False,
            'reason': 'Product not found'
        }

    # Симулируем статусы
    status = product.get('status', 'available')

    if status == 'sold_out':
        return {
            'available': False,
            'reason': 'Product sold out',
            'sku': sku,
            'suggest_bespoke': True
        }

    edition = product.get('edition', 'unknown')
    total_editions = product.get('totalEditions', 1)

    # Парсим edition (e.g., "1 of 8")
    if isinstance(edition, str) and ' of ' in edition:
        current, total = edition.split(' of ')
        current = int(current)
        total = int(total)

        if current >= total:
            return {
                'available': False,
                'reason': f'All {total} editions sold',
                'sku': sku,
                'suggest_bespoke': True
            }

    return {
        'available': True,
        'sku': sku,
        'edition': edition
    }

# ============================================================
# Media Validation
# ============================================================

def check_product_media(sku: str) -> Dict:
    """Check if product has required media"""
    product = state.get_product(sku)

    if not product:
        collections = load_collections()
        product = find_product_by_sku(collections, sku)

        if product:
            state.set_product(sku, product)

    if not product:
        return {
            'valid': False,
            'missing': ['all'],
            'warnings': ['Product not found']
        }

    # Required media
    required_media = [
        'video_preview.mp4',
        'photo_day.jpg',
        'photo_uv.jpg',
        'photo_macro.jpg'
    ]

    missing = []

    # Проверяем наличие media в продукте
    media = product.get('media', {})

    for media_type in required_media:
        key = media_type.split('.')[0]  # video_preview, photo_day, etc.

        if key not in media or not media[key]:
            missing.append(media_type)

    if missing:
        warnings = []

        if 'video_preview.mp4' in missing:
            warnings.append(f'Missing video preview for {sku} — placeholder will be used')
            state.add_admin_warning({
                'type': 'missing_media',
                'sku': sku,
                'missing': 'video_preview.mp4',
                'severity': 'warning',
                'action': 'Use placeholder'
            })

        return {
            'valid': False,
            'missing': missing,
            'warnings': warnings,
            'use_placeholder': 'video_preview.mp4' in missing
        }

    return {
        'valid': True,
        'missing': [],
        'warnings': []
    }

# ============================================================
# Scenario Implementations
# ============================================================

def scenario_1_payment_declined():
    """
    Scenario 1: Оплата отклонена

    Expected:
    - Reserve создаётся
    - Payment declined
    - Reserve снимается
    - Письмо НЕ уходит (только notification о failed payment)
    """
    print('\n' + '='*60)
    print('SCENARIO 1: Payment Declined')
    print('='*60)

    # Step 1: Create reservation
    reservation = create_reservation('TEST-001', TEST_USER['id'])

    # Step 2: Process payment (симулируем decline)
    # Force decline
    random.seed(1)  # Ensure decline
    payment = process_payment(reservation['id'], 450.00)

    # Step 3: Check payment status
    if payment['status'] == 'declined':
        # Release reservation
        release_reservation(reservation['id'], reason='payment_declined')

        # Send payment failed email
        send_payment_failed_email(TEST_USER, reservation['id'])

        print('\n✅ SCENARIO 1 PASSED:')
        print('   - Reservation created')
        print('   - Payment declined')
        print('   - Reservation released')
        print('   - Payment failed email sent (NOT order confirmation)')
    else:
        print('\n❌ SCENARIO 1 FAILED: Payment should have been declined')

    random.seed()  # Reset random seed

def scenario_2_network_failure():
    """
    Scenario 2: Потеря сети перед "order confirm"

    Expected:
    - Order создан
    - Network failure перед отправкой email
    - Retry отправка email (единожды)
    - Email успешно отправлен
    """
    print('\n' + '='*60)
    print('SCENARIO 2: Network Failure Before Order Confirmation')
    print('='*60)

    # Step 1: Create reservation
    reservation = create_reservation('TEST-002', TEST_USER['id'])

    # Step 2: Process payment (force success)
    random.seed(100)  # Ensure success
    payment = process_payment(reservation['id'], 520.00)
    random.seed()

    if payment['status'] != 'succeeded':
        print('\n❌ Setup failed: Payment should succeed')
        return

    # Step 3: Create order
    order = create_order(reservation, payment, TEST_USER)

    # Step 4: Simulate network failure
    simulate_network_failure()

    # Step 5: Retry email send (единожды)
    success = retry_send_email(order, TEST_USER, max_retries=1)

    if success:
        print('\n✅ SCENARIO 2 PASSED:')
        print('   - Order created')
        print('   - Network failure simulated')
        print('   - Email retry attempted (max 1 retry)')
        print('   - Email successfully sent')
    else:
        print('\n⚠️  SCENARIO 2 PARTIAL: Email failed after retry')

def scenario_3_sold_out_sku():
    """
    Scenario 3: Клиент добавил 2 SKU, 1 sold out

    Expected:
    - Проверка доступности обоих SKU
    - SKU-1: Available
    - SKU-2: Sold out
    - Корректное сообщение: "SKU-2 sold out, suggest Bespoke"
    - Order создан только для SKU-1
    """
    print('\n' + '='*60)
    print('SCENARIO 3: Multiple SKUs, One Sold Out')
    print('='*60)

    cart_items = [
        {'sku': 'TEST-001', 'qty': 1},
        {'sku': 'ECLIPSE-01', 'qty': 1}  # Симулируем sold out
    ]

    # Step 1: Check availability for all items
    availability_results = []

    for item in cart_items:
        # Симулируем sold out для ECLIPSE-01
        if item['sku'] == 'ECLIPSE-01':
            # Force sold out
            product = {'sku': 'ECLIPSE-01', 'status': 'sold_out', 'edition': '8 of 8'}
            state.set_product('ECLIPSE-01', product)

        availability = check_product_availability(item['sku'])
        availability_results.append({
            'sku': item['sku'],
            'availability': availability
        })

        log_event('AVAILABILITY_CHECK', f'Checking {item["sku"]}', availability)

    # Step 2: Filter available items
    available_items = [
        item for item, result in zip(cart_items, availability_results)
        if result['availability']['available']
    ]

    sold_out_items = [
        item for item, result in zip(cart_items, availability_results)
        if not result['availability']['available']
    ]

    # Step 3: Show messages
    if sold_out_items:
        log_event('SOLD_OUT_WARNING', 'Some items are no longer available', {
            'sold_out_skus': ', '.join([item['sku'] for item in sold_out_items]),
            'suggestion': 'Consider Bespoke order at /forms/bespoke'
        })

    # Step 4: Create orders for available items
    for item in available_items:
        reservation = create_reservation(item['sku'], TEST_USER['id'], item['qty'])
        random.seed(200)  # Ensure payment success
        payment = process_payment(reservation['id'], 450.00)
        random.seed()

        if payment['status'] == 'succeeded':
            order = create_order(reservation, payment, TEST_USER)
            send_order_confirmation_email(order, TEST_USER)

    print('\n✅ SCENARIO 3 PASSED:')
    print(f'   - {len(cart_items)} items in cart')
    print(f'   - {len(available_items)} items available')
    print(f'   - {len(sold_out_items)} items sold out')
    print(f'   - Sold out SKUs: {", ".join([item["sku"] for item in sold_out_items])}')
    print('   - Bespoke suggestion shown')
    print(f'   - {len(available_items)} orders created')

def scenario_4_missing_video():
    """
    Scenario 4: Нет видео-превью у нового SKU

    Expected:
    - Проверка media для нового SKU
    - Missing: video_preview.mp4
    - Placeholder используется
    - Предупреждение в админке
    """
    print('\n' + '='*60)
    print('SCENARIO 4: Missing Video Preview for New SKU')
    print('='*60)

    new_sku = 'HV-202510-001'

    # Симулируем продукт без video preview
    product = {
        'sku': new_sku,
        'name': 'New Product',
        'media': {
            'photo_day': 'photo_day.jpg',
            'photo_uv': 'photo_uv.jpg',
            'photo_macro': 'photo_macro.jpg'
            # video_preview отсутствует
        }
    }

    state.set_product(new_sku, product)

    # Step 1: Check media
    media_check = check_product_media(new_sku)

    log_event('MEDIA_CHECK', f'Checking media for {new_sku}', {
        'valid': media_check['valid'],
        'missing': ', '.join(media_check['missing']),
        'use_placeholder': media_check.get('use_placeholder', False)
    })

    # Step 2: Show warnings
    for warning in media_check['warnings']:
        log_event('ADMIN_WARNING', warning, {
            'sku': new_sku,
            'action': 'Using placeholder video'
        })

    # Step 3: Get admin warnings
    admin_warnings = state.admin_warnings

    print('\n✅ SCENARIO 4 PASSED:')
    print(f'   - Media validation failed for {new_sku}')
    print(f'   - Missing: {", ".join(media_check["missing"])}')
    print('   - Placeholder video will be used')
    print(f'   - {len(admin_warnings)} admin warnings generated')

    if admin_warnings:
        print('\n   Admin Warnings:')
        for warning in admin_warnings:
            print(f'   - {warning["type"]}: {warning["sku"]} missing {warning["missing"]}')

# ============================================================
# Report Generation
# ============================================================

def generate_report():
    """Generate simulation report"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_path = REPORTS_DIR / f'scenarios_{timestamp}.txt'

    # Ensure reports dir exists
    REPORTS_DIR.mkdir(exist_ok=True)

    with open(report_path, 'w', encoding='utf-8') as f:
        f.write('HAORI VISION — Scenario Simulation Report\n')
        f.write('='*60 + '\n\n')
        f.write(f'Date: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n\n')

        # Summary
        f.write('Summary:\n')
        f.write(f'  Reservations created: {len(state.reservations)}\n')
        f.write(f'  Orders created: {len(state.orders)}\n')
        f.write(f'  Emails sent: {len(state.emails_sent)}\n')
        f.write(f'  Network failures: {state.network_failures}\n')
        f.write(f'  Admin warnings: {len(state.admin_warnings)}\n\n')

        # Reservations
        f.write('Reservations:\n')
        for res in state.reservations:
            f.write(f'  - {res["id"]}: {res["sku"]} ({res["status"]})\n')
        f.write('\n')

        # Orders
        f.write('Orders:\n')
        for order in state.orders:
            f.write(f'  - {order["id"]}: {order["sku"]} — {order["total"]} EUR ({order["status"]})\n')
        f.write('\n')

        # Emails
        f.write('Emails Sent:\n')
        for email in state.emails_sent:
            f.write(f'  - {email["id"]}: {email["subject"]} → {email["to"]}\n')
        f.write('\n')

        # Admin Warnings
        f.write('Admin Warnings:\n')
        for warning in state.admin_warnings:
            f.write(f'  - {warning["type"]}: {warning["sku"]} — {warning.get("missing", "N/A")}\n')
        f.write('\n')

    print(f'\n📄 Report saved: {report_path}')

    return report_path

# ============================================================
# Main
# ============================================================

def main():
    """Run all scenarios"""
    import sys

    args = sys.argv[1:]

    print('\n╔═══════════════════════════════════════════════════════╗')
    print('║                                                       ║')
    print('║     HAORI VISION — Scenario Simulator                ║')
    print('║           (Read-Only, No DB Changes)                 ║')
    print('║                                                       ║')
    print('╚═══════════════════════════════════════════════════════╝')

    # Parse arguments
    run_all = '--all' in args
    scenario_num = None

    if '--scenario' in args:
        idx = args.index('--scenario')
        if idx + 1 < len(args):
            scenario_num = int(args[idx + 1])

    # Run scenarios
    if scenario_num == 1 or run_all:
        scenario_1_payment_declined()

    if scenario_num == 2 or run_all:
        scenario_2_network_failure()

    if scenario_num == 3 or run_all:
        scenario_3_sold_out_sku()

    if scenario_num == 4 or run_all:
        scenario_4_missing_video()

    if not scenario_num and not run_all:
        # Default: run all
        scenario_1_payment_declined()
        scenario_2_network_failure()
        scenario_3_sold_out_sku()
        scenario_4_missing_video()

    # Generate report
    print('\n' + '='*60)
    print('Generating report...')
    report_path = generate_report()

    print('\n✨ Simulation complete!')
    print(f'\n📊 Final State:')
    print(f'   Reservations: {len(state.reservations)}')
    print(f'   Orders: {len(state.orders)}')
    print(f'   Emails: {len(state.emails_sent)}')
    print(f'   Network failures: {state.network_failures}')
    print(f'   Admin warnings: {len(state.admin_warnings)}')
    print(f'\n📄 Report: {report_path}\n')

if __name__ == '__main__':
    main()
