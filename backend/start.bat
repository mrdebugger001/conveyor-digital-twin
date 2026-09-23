@echo off
echo ============================================
echo  Iron Ore Conveyor Digital Twin - Backend
echo ============================================
cd /d "%~dp0"

echo.
echo Starting backend server on http://localhost:8000
echo Interactive API docs at http://localhost:8000/docs
echo Press Ctrl+C to stop.
echo.
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
