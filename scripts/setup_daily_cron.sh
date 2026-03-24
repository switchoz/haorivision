#!/bin/bash

###############################################################################
# HAORI VISION — Daily Light Report Cron Setup
#
# Настройка крон-задачи для ежедневной генерации отчёта в 09:00 Europe/Stockholm
#
# Usage:
#   bash scripts/setup_daily_cron.sh
###############################################################################

set -e

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║     HAORI VISION — Daily Light Report Cron Setup     ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Get project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "📁 Project Root: $PROJECT_ROOT"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"
echo ""

# Check reportlab
echo "🔍 Checking reportlab..."
if python3 -c "import reportlab" 2>/dev/null; then
    echo "✅ reportlab installed"
else
    echo "⚠️  reportlab not installed"
    echo "   Installing reportlab..."
    pip install reportlab
fi

echo ""

# Cron schedule (09:00 Europe/Stockholm)
# Stockholm is UTC+1 (winter) or UTC+2 (summer)
# Using 07:00 UTC for winter, 08:00 UTC for summer
# Or use 08:00 UTC as compromise

CRON_TIME="0 8 * * *"  # 08:00 UTC = 09:00 Stockholm (winter) / 10:00 Stockholm (summer)
CRON_COMMAND="cd $PROJECT_ROOT && python3 scripts/daily_light_report.py >> logs/daily_light_cron.log 2>&1"

echo "⏰ Cron Schedule: $CRON_TIME (08:00 UTC)"
echo "📝 Command: $CRON_COMMAND"
echo ""

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Check if cron job already exists
EXISTING_CRON=$(crontab -l 2>/dev/null | grep -F "daily_light_report.py" || true)

if [ -n "$EXISTING_CRON" ]; then
    echo "⚠️  Cron job already exists:"
    echo "   $EXISTING_CRON"
    echo ""
    read -p "Replace existing cron job? (y/n): " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cancelled"
        exit 0
    fi

    # Remove existing cron job
    crontab -l 2>/dev/null | grep -vF "daily_light_report.py" | crontab -
    echo "✅ Removed existing cron job"
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_TIME $CRON_COMMAND") | crontab -

echo ""
echo "✅ Cron job added successfully!"
echo ""
echo "📊 Current crontab:"
crontab -l | grep "daily_light_report.py"
echo ""

# Test run
echo "🧪 Running test report..."
cd "$PROJECT_ROOT"
python3 scripts/daily_light_report.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Test report generated successfully!"
    echo ""
    echo "📄 Check: reports/daily_light_*.pdf"
    echo "📝 Cron logs will be saved to: logs/daily_light_cron.log"
    echo ""
    echo "⏰ Next scheduled run: Tomorrow at 09:00 Europe/Stockholm (08:00 UTC)"
else
    echo ""
    echo "❌ Test report failed. Check the error above."
    exit 1
fi

echo ""
echo "✨ Setup complete!"
echo ""
