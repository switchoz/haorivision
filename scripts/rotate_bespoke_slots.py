#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
HAORI VISION — Bespoke Slots Rotation Script (P20)

Automatically creates new bespoke slots file for the current month.
Designed to run on the 1st of each month at 03:33 Europe/Stockholm time.

Features:
- Creates 3 slots per month
- Generates delivery windows (2-8 weeks from creation)
- Sets initial status to 'free'
- Archives previous month's slots (if completed)

Usage:
    python scripts/rotate_bespoke_slots.py
    npm run bespoke:init_month
"""

import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
import pytz

# Force UTF-8 output on Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

# Paths
ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data" / "bespoke"
ARCHIVE_DIR = DATA_DIR / "archive"

# Timezone
TIMEZONE = pytz.timezone('Europe/Stockholm')

def get_current_month():
    """Get current month in YYYYMM format"""
    now = datetime.now(TIMEZONE)
    return now.strftime('%Y%m')

def get_delivery_windows(base_date):
    """
    Generate 3 delivery windows starting from base_date.

    Windows:
    - Slot 1: 4-6 weeks from base date
    - Slot 2: 6-8 weeks from base date
    - Slot 3: 8-10 weeks from base date
    """
    windows = []

    # Slot 1: 4-6 weeks
    start1 = base_date + timedelta(weeks=4)
    end1 = base_date + timedelta(weeks=6)
    windows.append({'start': start1.strftime('%Y-%m-%d'), 'end': end1.strftime('%Y-%m-%d')})

    # Slot 2: 6-8 weeks
    start2 = base_date + timedelta(weeks=6)
    end2 = base_date + timedelta(weeks=8)
    windows.append({'start': start2.strftime('%Y-%m-%d'), 'end': end2.strftime('%Y-%m-%d')})

    # Slot 3: 8-10 weeks
    start3 = base_date + timedelta(weeks=8)
    end3 = base_date + timedelta(weeks=10)
    windows.append({'start': start3.strftime('%Y-%m-%d'), 'end': end3.strftime('%Y-%m-%d')})

    return windows

def create_slots_file(year_month, creation_time):
    """Create slots JSON file for specified month"""

    year = int(year_month[:4])
    month = int(year_month[4:])

    # Generate delivery windows based on creation date
    delivery_windows = get_delivery_windows(creation_time)

    slots_data = {
        "month": f"{year}-{month:02d}",
        "generated_at": creation_time.isoformat(),
        "timezone": "Europe/Stockholm",
        "version": "1.0.0",
        "slots": []
    }

    # Create 3 slots
    for i in range(1, 4):
        slot = {
            "slot_id": f"BESPOKE-{year_month}-{i:02d}",
            "slot_number": i,
            "status": "free",
            "delivery_window": delivery_windows[i - 1],
            "hold_expires_at": None,
            "held_by": None,
            "booked_at": None,
            "customer": None,
            "deposit_paid": False,
            "price_eur": 3000,
            "created_at": creation_time.isoformat()
        }
        slots_data["slots"].append(slot)

    # Add schema and rules
    slots_data["schema"] = {
        "slot_id": "Unique identifier (BESPOKE-YYYYMM-NN)",
        "slot_number": "Slot number (1-3)",
        "status": "free | hold | booked",
        "delivery_window": {
            "start": "Earliest delivery date (YYYY-MM-DD)",
            "end": "Latest delivery date (YYYY-MM-DD)"
        },
        "hold_expires_at": "ISO 8601 timestamp when hold expires (24h from hold)",
        "held_by": "Session ID or email of person holding slot",
        "booked_at": "ISO 8601 timestamp when slot was booked",
        "customer": {
            "name": "Customer full name",
            "email": "Customer email",
            "country": "Customer country",
            "preferences": "Energy/colors/measurements from bespoke form"
        },
        "deposit_paid": "Boolean - has 50% deposit been received",
        "price_eur": "Bespoke commission price in EUR",
        "created_at": "ISO 8601 timestamp when slot was created"
    }

    slots_data["rules"] = {
        "total_slots_per_month": 3,
        "hold_duration_hours": 24,
        "minimum_price_eur": 3000,
        "production_time_weeks": "2-4 weeks",
        "deposit_percentage": 50,
        "auto_release_hold": "Automatically release hold after 24 hours",
        "booking_requires": ["customer_info", "deposit_payment"]
    }

    slots_data["meta"] = {
        "description": "Bespoke commission slots for HAORI VISION",
        "contact": "bespoke@haorivision.com",
        "capacity_note": "Limited to 3 slots per month to ensure quality and exclusivity"
    }

    return slots_data

def archive_previous_month(current_year_month):
    """Archive previous month's slots file (if all slots are completed)"""

    # Calculate previous month
    year = int(current_year_month[:4])
    month = int(current_year_month[4:])

    if month == 1:
        prev_year = year - 1
        prev_month = 12
    else:
        prev_year = year
        prev_month = month - 1

    prev_year_month = f"{prev_year}{prev_month:02d}"
    prev_file = DATA_DIR / f"slots_{prev_year_month}.json"

    if not prev_file.exists():
        return None

    # Read previous month's data
    with open(prev_file, 'r', encoding='utf-8') as f:
        prev_data = json.load(f)

    # Check if all slots are booked or completed
    all_completed = all(
        slot['status'] == 'booked' and slot['deposit_paid']
        for slot in prev_data['slots']
    )

    if all_completed:
        # Archive the file
        ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
        archive_path = ARCHIVE_DIR / f"slots_{prev_year_month}_completed.json"

        with open(archive_path, 'w', encoding='utf-8') as f:
            json.dump(prev_data, f, indent=2, ensure_ascii=False)

        print(f"      OK Archived previous month: {archive_path.name}")
        return archive_path

    return None

def main():
    """Main execution"""
    print("")
    print("=" * 80)
    print("  HAORI VISION - Bespoke Slots Rotation")
    print("=" * 80)
    print("")

    try:
        # Get current date in Stockholm timezone
        now = datetime.now(TIMEZONE)
        year_month = now.strftime('%Y%m')
        month_name = now.strftime('%B %Y')

        print(f"[1/4] Generating slots for: {month_name}")
        print(f"      Timezone: {TIMEZONE}")
        print(f"      Current time: {now.strftime('%Y-%m-%d %H:%M:%S %Z')}")
        print("")

        # Check if file already exists
        slots_file = DATA_DIR / f"slots_{year_month}.json"

        if slots_file.exists():
            print(f"[!] NOTICE: Slots file already exists for {month_name}")
            print(f"    File: {slots_file}")
            print("")
            print("    Options:")
            print("      1. Keep existing file (recommended if slots are in use)")
            print("      2. Overwrite (WARNING: will reset all slots to 'free')")
            print("")

            response = input("    Keep existing file? [Y/n]: ").strip().lower()

            if response == '' or response == 'y' or response == 'yes':
                print("")
                print("=" * 80)
                print("  Keeping existing file. No changes made.")
                print("=" * 80)
                print("")
                return 0
            else:
                print("")
                print("    Creating new file (overwriting existing)...")

        # Archive previous month (if completed)
        print("[2/4] Checking previous month for archiving...")
        archived = archive_previous_month(year_month)
        if archived:
            print(f"      Archived to: {archived}")
        else:
            print("      No archiving needed")
        print("")

        # Create slots data
        print(f"[3/4] Creating {3} slots for {month_name}...")
        slots_data = create_slots_file(year_month, now)
        print("      OK Created slot data")
        print("")

        # Write to file
        print(f"[4/4] Writing to: {slots_file}")
        DATA_DIR.mkdir(parents=True, exist_ok=True)

        with open(slots_file, 'w', encoding='utf-8') as f:
            json.dump(slots_data, f, indent=2, ensure_ascii=False)

        print(f"      OK Saved successfully ({slots_file.stat().st_size} bytes)")
        print("")

        # Summary
        print("=" * 80)
        print("  SUCCESS: Bespoke Slots Initialized")
        print("=" * 80)
        print("")
        print(f"File: {slots_file}")
        print("")
        print(f"Slots created: {len(slots_data['slots'])}")
        for slot in slots_data['slots']:
            print(f"  - Slot #{slot['slot_number']}: {slot['slot_id']}")
            print(f"    Delivery: {slot['delivery_window']['start']} to {slot['delivery_window']['end']}")
        print("")

        return 0

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit(main())
