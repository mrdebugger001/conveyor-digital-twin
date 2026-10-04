@echo off
title Conveyor C01 Digital Twin - Full Dev Launcher
echo ==============================================================================
echo   Iron Ore Conveyor Digital Twin - Full Development Environment
echo ==============================================================================
echo.

:: 1. Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found on PATH. Please install Python 3.10+.
    pause
    exit /b 1
)

:: 2. Check Node
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [NOTICE] Node.js/npm not found. Launching via unified portable runner instead...
    call "%~dp0run-portable.bat"
    exit /b %errorlevel%
)

:: Ensure backend dependencies
echo [1/3] Checking backend Python dependencies...
cd /d "%~dp0backend"
python -m pip install -r requirements.txt --quiet

:: Ensure frontend dependencies if node_modules missing
echo [2/3] Checking frontend npm dependencies...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo Installing npm packages (first time setup, please wait)...
    call npm install
)

:: Start backend in separate window
echo [3/3] Launching Backend & Frontend services...
start "Conveyor Backend (Port 8000)" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: Wait for backend to initialize
timeout /t 2 /nobreak >nul

:: Start frontend in separate window
start "Conveyor Frontend (Port 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

:: Open browser
timeout /t 3 /nobreak >nul
start "" "http://localhost:3000"

echo ==============================================================================
echo   Services are running!
echo   Frontend HMI: http://localhost:3000
echo   Backend API:  http://localhost:8000/docs
echo ==============================================================================
