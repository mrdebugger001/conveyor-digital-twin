# Conveyor C01 Digital Twin - Standalone Unified Launcher
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$ScriptDir\..\backend"

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  Launching Conveyor C01 Digital Twin (Unified Server)" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan

Write-Host "[1/2] Verifying Python dependencies..." -ForegroundColor Yellow
python -m pip install -r requirements.txt --quiet

Write-Host "[2/2] Starting server on http://localhost:8000..." -ForegroundColor Green
Start-Process "http://localhost:8000"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
