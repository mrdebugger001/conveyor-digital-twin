@echo off
echo ==============================================================================
echo   Launching Conveyor C01 Digital Twin (Unified Server)
echo ==============================================================================

cd /d "%~dp0\..\backend"

echo [1/2] Checking Python dependencies...
python -m pip install -r requirements.txt --quiet

echo [2/2] Launching unified backend and 3D web application on port 8000...
start "" "http://localhost:8000"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

pause
