# HAORI VISION — Daily Light Report Task Scheduler Setup (Windows)
#
# Настройка задачи для ежедневной генерации отчёта в 09:00 Europe/Stockholm
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\setup_daily_task.ps1

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║                                                       ║" -ForegroundColor Magenta
Write-Host "║   HAORI VISION — Daily Light Report Task Setup       ║" -ForegroundColor Magenta
Write-Host "║                                                       ║" -ForegroundColor Magenta
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# Get project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Write-Host "📁 Project Root: $ProjectRoot" -ForegroundColor Cyan
Write-Host ""

# Check Python
$PythonPath = (Get-Command python -ErrorAction SilentlyContinue).Source

if (-not $PythonPath) {
    Write-Host "❌ Python not found. Please install Python 3." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Python found: $PythonPath" -ForegroundColor Green
Write-Host ""

# Check reportlab
Write-Host "🔍 Checking reportlab..." -ForegroundColor Cyan

$ReportlabCheck = python -c "import reportlab" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ reportlab installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  reportlab not installed" -ForegroundColor Yellow
    Write-Host "   Installing reportlab..." -ForegroundColor Yellow
    pip install reportlab
}

Write-Host ""

# Task details
$TaskName = "HAORI_VISION_Daily_Light_Report"
$TaskDescription = "Generate daily light report at 09:00 Europe/Stockholm"
$TaskTime = "09:00"  # Stockholm time
$ScriptPath = Join-Path $ProjectRoot "scripts\daily_light_report.py"
$LogPath = Join-Path $ProjectRoot "logs\daily_light_task.log"

# Create logs directory
$LogsDir = Join-Path $ProjectRoot "logs"
if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir | Out-Null
}

Write-Host "⏰ Task Schedule: Daily at $TaskTime" -ForegroundColor Cyan
Write-Host "📝 Script: $ScriptPath" -ForegroundColor Cyan
Write-Host ""

# Check if task already exists
$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($ExistingTask) {
    Write-Host "⚠️  Task already exists: $TaskName" -ForegroundColor Yellow
    Write-Host ""

    $Response = Read-Host "Replace existing task? (y/n)"

    if ($Response -ne 'y' -and $Response -ne 'Y') {
        Write-Host "❌ Cancelled" -ForegroundColor Red
        exit 0
    }

    # Remove existing task
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "✅ Removed existing task" -ForegroundColor Green
}

# Create scheduled task action
$Action = New-ScheduledTaskAction `
    -Execute $PythonPath `
    -Argument "$ScriptPath" `
    -WorkingDirectory $ProjectRoot

# Create scheduled task trigger (daily at 09:00)
$Trigger = New-ScheduledTaskTrigger -Daily -At $TaskTime

# Create scheduled task settings
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable

# Register scheduled task
Register-ScheduledTask `
    -TaskName $TaskName `
    -Description $TaskDescription `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -RunLevel Limited

Write-Host ""
Write-Host "✅ Task registered successfully!" -ForegroundColor Green
Write-Host ""

# Show task info
Write-Host "📊 Task Details:" -ForegroundColor Cyan
Get-ScheduledTask -TaskName $TaskName | Select-Object TaskName, State, TaskPath

Write-Host ""

# Test run
Write-Host "🧪 Running test report..." -ForegroundColor Cyan
Set-Location $ProjectRoot
python scripts\daily_light_report.py

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Test report generated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📄 Check: reports\daily_light_*.pdf" -ForegroundColor Cyan
    Write-Host "📝 Task logs: Task Scheduler > Task History" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⏰ Next scheduled run: Tomorrow at $TaskTime" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Test report failed. Check the error above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✨ Setup complete!" -ForegroundColor Magenta
Write-Host ""
Write-Host "To manage the task:" -ForegroundColor Yellow
Write-Host "  - Open Task Scheduler" -ForegroundColor Yellow
Write-Host "  - Navigate to Task Scheduler Library" -ForegroundColor Yellow
Write-Host "  - Find: $TaskName" -ForegroundColor Yellow
Write-Host ""
