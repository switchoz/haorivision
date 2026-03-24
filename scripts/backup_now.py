#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Backup Now - Safe Backup Script
Создаёт резервную копию критических файлов с timestamp
"""

import os
import shutil
import sqlite3
import sys
from datetime import datetime
from pathlib import Path
import json

# Установить UTF-8 для stdout в Windows
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

# Пути
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
BACKUP_DIR = PROJECT_ROOT / "backup"

# Файлы для бэкапа
FILES_TO_BACKUP = [
    DATA_DIR / "products" / "collections.json",
    DATA_DIR / "clients.db",
    DATA_DIR / "buyers_catalog.json",
    DATA_DIR / "press_manifest.json"
]

def create_backup():
    """Создать резервную копию всех критических файлов"""

    # Создать timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_folder = BACKUP_DIR / timestamp

    print(f"[BACKUP] Создание бэкапа: {timestamp}")
    print(f"[PATH] Директория: {backup_folder}")
    print("-" * 60)

    # Создать директорию для бэкапа
    backup_folder.mkdir(parents=True, exist_ok=True)

    backed_up_files = []
    skipped_files = []

    # Бэкап каждого файла
    for file_path in FILES_TO_BACKUP:
        if file_path.exists():
            try:
                # Создать поддиректории если нужно
                relative_path = file_path.relative_to(DATA_DIR)
                backup_file = backup_folder / relative_path
                backup_file.parent.mkdir(parents=True, exist_ok=True)

                # Копировать файл
                shutil.copy2(file_path, backup_file)

                # Получить размер файла
                size = file_path.stat().st_size
                size_kb = size / 1024

                backed_up_files.append({
                    "file": str(relative_path),
                    "size": f"{size_kb:.2f} KB",
                    "original": str(file_path)
                })

                print(f"[OK] {relative_path} ({size_kb:.2f} KB)")

            except Exception as e:
                print(f"[ERROR] Ошибка при бэкапе {file_path}: {e}")
                skipped_files.append(str(file_path))
        else:
            print(f"[SKIP] Файл не найден: {file_path}")
            skipped_files.append(str(file_path))

    # Создать манифест бэкапа
    manifest = {
        "timestamp": timestamp,
        "date": datetime.now().isoformat(),
        "backed_up_files": backed_up_files,
        "skipped_files": skipped_files,
        "total_files": len(backed_up_files),
        "backup_location": str(backup_folder)
    }

    manifest_path = backup_folder / "manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print("-" * 60)
    print(f"[OK] Бэкап завершён: {len(backed_up_files)} файлов")
    if skipped_files:
        print(f"[SKIP] Пропущено: {len(skipped_files)} файлов")
    print(f"[MANIFEST] {manifest_path}")
    print(f"\n[BACKUP] Полный путь бэкапа: {backup_folder}")

    return manifest

def verify_backup(backup_folder):
    """Проверить целостность бэкапа"""

    manifest_path = backup_folder / "manifest.json"
    if not manifest_path.exists():
        print("[ERROR] Манифест не найден")
        return False

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    print(f"\n[VERIFY] Проверка бэкапа от {manifest['date']}")

    all_ok = True
    for file_info in manifest["backed_up_files"]:
        backup_file = backup_folder / file_info["file"]
        if backup_file.exists():
            print(f"[OK] {file_info['file']}")
        else:
            print(f"[MISSING] {file_info['file']} - ОТСУТСТВУЕТ")
            all_ok = False

    return all_ok

def list_backups():
    """Показать список всех бэкапов"""

    if not BACKUP_DIR.exists():
        print("[INFO] Директория бэкапов пуста")
        return []

    backups = sorted([d for d in BACKUP_DIR.iterdir() if d.is_dir()], reverse=True)

    if not backups:
        print("[INFO] Бэкапы не найдены")
        return []

    print(f"\n[BACKUPS] Доступные бэкапы ({len(backups)}):")
    print("-" * 60)

    for backup in backups[:10]:  # Показать последние 10
        manifest_path = backup / "manifest.json"
        if manifest_path.exists():
            with open(manifest_path, "r", encoding="utf-8") as f:
                manifest = json.load(f)

            date = manifest.get("date", "Unknown")
            total = manifest.get("total_files", 0)
            print(f"[FOLDER] {backup.name}")
            print(f"   Дата: {date}")
            print(f"   Файлов: {total}")
            print()

    return backups

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "list":
        list_backups()
    elif len(sys.argv) > 1 and sys.argv[1] == "verify":
        if len(sys.argv) > 2:
            backup_folder = BACKUP_DIR / sys.argv[2]
            verify_backup(backup_folder)
        else:
            # Проверить последний бэкап
            backups = list_backups()
            if backups:
                verify_backup(backups[0])
    else:
        manifest = create_backup()

        # Автоматическая проверка
        backup_folder = Path(manifest["backup_location"])
        print("\n[VERIFY] Автоматическая проверка...")
        if verify_backup(backup_folder):
            print("[OK] Бэкап валиден!")
        else:
            print("[WARNING] Обнаружены проблемы с бэкапом")
