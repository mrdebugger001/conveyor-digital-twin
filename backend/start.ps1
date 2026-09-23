Set-Location $PSScriptRoot

Write-Host "============================================" -ForegroundColor DarkCyan
Write-Host " Iron Ore Conveyor Digital Twin - Backend  " -ForegroundColor DarkCyan
Write-Host "============================================" -ForegroundColor DarkCyan

Write-Host "`nInstalling dependencies..." -ForegroundColor Cyan
pip install -e . --quiet

Write-Host "`nStarting backend on http://localhost:8000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop.`n" -ForegroundColor Yellow

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
