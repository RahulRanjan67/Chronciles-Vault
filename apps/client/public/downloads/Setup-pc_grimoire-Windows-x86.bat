@echo off
title Grimoire — Universal Windows x86/x64 Setup
setlocal
cd /d "%~dp0"
echo ==============================================================
echo    GRIMOIRE — UNIVERSAL PC WORKSTATION INSTALLER
echo ==============================================================
echo Target Architecture: Windows x86 / x64
echo This installer installs Grimoire Studio onto your PC.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0installer.ps1"
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Installation encountered an issue.
    pause
)
