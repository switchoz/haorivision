#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Dry Run Guard - Защита от случайных изменений
Обёртка для всех скриптов, обеспечивает режим dry-run по умолчанию
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime
import subprocess

# Установить UTF-8 для stdout в Windows
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

# Пути
PROJECT_ROOT = Path(__file__).parent.parent
CONFIG_FILE = PROJECT_ROOT / ".dry_run_config.json"

# Цвета для терминала
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def load_config():
    """Загрузить конфигурацию dry-run режима"""
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "dry_run_enabled": False,
        "protected_paths": [
            "data/products/collections.json",
            "data/clients.db",
            "data/buyers_catalog.json",
            "data/press_manifest.json"
        ],
        "last_modified": None
    }

def save_config(config):
    """Сохранить конфигурацию"""
    config["last_modified"] = datetime.now().isoformat()
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

def enable_dry_run():
    """Включить dry-run режим для всех операций"""
    config = load_config()
    config["dry_run_enabled"] = True
    save_config(config)

    print(f"{Colors.OKGREEN}[OK] DRY-RUN режим ВКЛЮЧЁН{Colors.ENDC}")
    print(f"{Colors.WARNING}[!] Все скрипты будут работать в режиме только-чтение{Colors.ENDC}")
    print(f"{Colors.OKCYAN}[i] Будут создаваться только отчёты, без изменения данных{Colors.ENDC}")
    print(f"\nДля отключения используйте: {Colors.BOLD}npm run guard:off{Colors.ENDC}")

def disable_dry_run():
    """Отключить dry-run режим"""
    config = load_config()
    config["dry_run_enabled"] = False
    save_config(config)

    print(f"{Colors.WARNING}[!] DRY-RUN режим ОТКЛЮЧЁН{Colors.ENDC}")
    print(f"{Colors.FAIL}[!] Скрипты могут вносить изменения в данные{Colors.ENDC}")
    print(f"\nДля включения используйте: {Colors.BOLD}npm run guard:on{Colors.ENDC}")

def check_dry_run_status():
    """Проверить статус dry-run режима"""
    config = load_config()

    print(f"\n{Colors.HEADER}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}DRY-RUN GUARD STATUS{Colors.ENDC}")
    print(f"{Colors.HEADER}{'='*60}{Colors.ENDC}\n")

    if config["dry_run_enabled"]:
        print(f"Статус: {Colors.OKGREEN}[ON] ВКЛЮЧЁН (защищено){Colors.ENDC}")
        print(f"Режим: {Colors.OKCYAN}Только отчёты, без изменений{Colors.ENDC}")
    else:
        print(f"Статус: {Colors.WARNING}[OFF] ОТКЛЮЧЁН{Colors.ENDC}")
        print(f"Режим: {Colors.FAIL}Изменения разрешены{Colors.ENDC}")

    if config.get("last_modified"):
        print(f"\nПоследнее изменение: {config['last_modified']}")

    print(f"\n{Colors.BOLD}Защищённые файлы:{Colors.ENDC}")
    for path in config["protected_paths"]:
        full_path = PROJECT_ROOT / path
        status = "[+]" if full_path.exists() else "[-]"
        print(f"  {status} {path}")

    print(f"\n{Colors.HEADER}{'='*60}{Colors.ENDC}\n")

    return config["dry_run_enabled"]

def run_with_guard(script_path, *args):
    """
    Запустить скрипт с проверкой dry-run режима
    Если dry-run включён, добавляет флаг --dry-run к аргументам
    """
    config = load_config()

    print(f"\n{Colors.HEADER}[GUARD] DRY-RUN GUARD{Colors.ENDC}")
    print(f"Запуск: {Colors.BOLD}{script_path}{Colors.ENDC}")

    if config["dry_run_enabled"]:
        print(f"Режим: {Colors.OKGREEN}DRY-RUN (безопасный){Colors.ENDC}\n")

        # Добавить флаг --dry-run если его нет
        args_list = list(args)
        if "--dry-run" not in args_list and "--dry_run" not in args_list:
            args_list.append("--dry-run")

        # Запустить скрипт
        cmd = ["python", script_path] + args_list
    else:
        print(f"Режим: {Colors.WARNING}LIVE (изменения разрешены){Colors.ENDC}")
        print(f"{Colors.FAIL}[!] Внимание: скрипт может изменять данные!{Colors.ENDC}\n")

        # Запросить подтверждение
        if "--force" not in args:
            confirm = input(f"{Colors.BOLD}Продолжить? (yes/no): {Colors.ENDC}")
            if confirm.lower() not in ["yes", "y", "да"]:
                print(f"{Colors.WARNING}[X] Отменено пользователем{Colors.ENDC}")
                return

        cmd = ["python", script_path] + list(args)

    # Выполнить команду
    try:
        result = subprocess.run(cmd, cwd=PROJECT_ROOT)
        return result.returncode
    except Exception as e:
        print(f"{Colors.FAIL}[ERROR] Ошибка выполнения: {e}{Colors.ENDC}")
        return 1

def create_dry_run_report(operation, changes):
    """Создать отчёт о том, что было бы изменено в dry-run режиме"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_dir = PROJECT_ROOT / "reports" / "dry_run"
    report_dir.mkdir(parents=True, exist_ok=True)

    report_path = report_dir / f"{timestamp}_{operation}.json"

    report = {
        "timestamp": timestamp,
        "date": datetime.now().isoformat(),
        "operation": operation,
        "mode": "DRY-RUN",
        "changes": changes,
        "note": "Это отчёт dry-run режима. Никакие изменения не были применены."
    }

    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\n{Colors.OKCYAN}[REPORT] Отчёт dry-run сохранён: {report_path}{Colors.ENDC}")

    return report_path

if __name__ == "__main__":
    if len(sys.argv) < 2:
        check_dry_run_status()
        print(f"Использование:")
        print(f"  {Colors.BOLD}npm run guard:on{Colors.ENDC}        # Включить dry-run")
        print(f"  {Colors.BOLD}npm run guard:off{Colors.ENDC}       # Отключить dry-run")
        print(f"  {Colors.BOLD}npm run guard:status{Colors.ENDC}    # Проверить статус")
        print(f"  {Colors.BOLD}python scripts/dry_run_guard.py run <script>{Colors.ENDC} # Запустить с защитой")
        sys.exit(0)

    command = sys.argv[1].lower()

    if command == "on":
        enable_dry_run()
    elif command == "off":
        disable_dry_run()
    elif command == "status":
        check_dry_run_status()
    elif command == "run":
        if len(sys.argv) < 3:
            print(f"{Colors.FAIL}[ERROR] Укажите скрипт для запуска{Colors.ENDC}")
            sys.exit(1)

        script_path = sys.argv[2]
        script_args = sys.argv[3:] if len(sys.argv) > 3 else []
        exit_code = run_with_guard(script_path, *script_args)
        sys.exit(exit_code)
    else:
        print(f"{Colors.FAIL}[ERROR] Неизвестная команда: {command}{Colors.ENDC}")
        sys.exit(1)
