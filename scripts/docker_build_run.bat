@echo off
echo ==============================================================================
echo   Building and Running Conveyor C01 Digital Twin Docker Container
echo ==============================================================================

cd /d "%~dp0\.."

echo [1/3] Building production multi-stage Docker image...
docker build -t conveyor-digital-twin:latest .
if %errorlevel% neq 0 (
    echo Error building Docker image. Please check Docker Desktop is running.
    exit /b %errorlevel%
)

echo [2/3] Stopping any previous conveyor-digital-twin containers...
docker stop conveyor-digital-twin 2>nul
docker rm conveyor-digital-twin 2>nul

echo [3/3] Running container on port 8000...
docker run -d --name conveyor-digital-twin -p 8000:8000 --restart unless-stopped conveyor-digital-twin:latest

echo ==============================================================================
echo   Conveyor Digital Twin is running!
echo   Open in browser: http://localhost:8000
echo ==============================================================================
pause
