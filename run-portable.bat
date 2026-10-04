@echo off
title Conveyor C01 Digital Twin - Unified Server
echo ==============================================================================
echo   CONVEYOR C01 DIGITAL TWIN - 1-CLICK STANDALONE LAUNCHER
echo ==============================================================================
echo.

cd /d "%~dp0backend"

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found on your system PATH!
    echo Please install Python 3.10+ from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

echo [1/3] Verifying Python runtime...
python -c "import sys; print('Python ' + sys.version.split()[0] + ' detected.')"

echo [2/3] Checking required packages...
python -m pip install -r requirements.txt --quiet

echo [3/3] Starting Unified Digital Twin Server on http://localhost:8000 ...
echo.
echo ==============================================================================
echo   Web Application: http://localhost:8000
echo   WebSocket Stream: ws://localhost:8000/ws/realtime
echo   API Docs:        http://localhost:8000/docs
echo ==============================================================================
echo.

:: Automatically open default browser after 2 seconds
start "" "http://localhost:8000"

:: Launch Uvicorn serving both REST API, WebSocket, and 3D React UI
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

pause
