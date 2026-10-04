@echo off
title Enable Virtual Machine Platform for Docker
echo ==============================================================================
echo   ENABLING VIRTUAL MACHINE PLATFORM FOR DOCKER DESKTOP
echo ==============================================================================
echo.
echo Enabling VirtualMachinePlatform...
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
echo.
echo Enabling Microsoft-Windows-Subsystem-Linux...
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
echo.
echo ==============================================================================
echo   [SUCCESS] Windows Virtualization features are now ENABLED!
echo.
echo   CRITICAL: You MUST RESTART YOUR PC now for Windows to load the
echo   virtualization hypervisor drivers.
echo.
echo   After restarting your PC:
echo   1. Open Docker Desktop (whale icon will turn GREEN "Engine Running").
echo   2. Run: scripts\docker_build_run.bat
echo ==============================================================================
echo.
pause
