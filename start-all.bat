@echo off
echo ================================================
echo  Iron Ore Conveyor Digital Twin - Quick Start
echo ================================================
echo.

:: Start backend
echo [1/2] Starting backend on http://localhost:8000 ...
start "Conveyor Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: Wait for backend to initialize
timeout /t 3 /nobreak >nul

:: Start frontend
echo [2/2] Starting frontend on http://localhost:3000 ...
start "Conveyor Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ================================================
echo  Both services launched!
echo  Frontend HMI: http://localhost:3000
echo  Backend API:  http://localhost:8000/docs
echo ================================================
echo.
pause
