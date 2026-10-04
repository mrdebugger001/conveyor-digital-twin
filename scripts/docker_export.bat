@echo off
echo ==============================================================================
echo   Exporting Conveyor Digital Twin to a Standalone Shareable Image (.tar)
echo ==============================================================================

cd /d "%~dp0\.."

echo Saving Docker image 'conveyor-digital-twin:latest' to conveyor-digital-twin.tar...
docker save -o conveyor-digital-twin.tar conveyor-digital-twin:latest

if %errorlevel% equ 0 (
    echo ==============================================================================
    echo   SUCCESS! File exported: conveyor-digital-twin.tar
    echo   You can share this single file with anyone.
    echo.
    echo   To run it on any other computer:
    echo     1. docker load -i conveyor-digital-twin.tar
    echo     2. docker run -d -p 8000:8000 conveyor-digital-twin:latest
    echo     3. Open browser at: http://localhost:8000
    echo ==============================================================================
) else (
    echo Error exporting image. Please make sure you built the image first with docker_build_run.bat.
)
pause
