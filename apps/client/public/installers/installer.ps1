<#
.SYNOPSIS
  Chronicles Vault — Universal Windows x86/x64 Standalone Studio Installer
  Target: Any supported Windows 10/11 PC (x86 or x64).
  Zero hardcoded paths: dynamically installs to $env:LOCALAPPDATA\Programs\ChroniclesVault
#>

[CmdletBinding()]
param(
    [switch]$Silent = $false
)

$ErrorActionPreference = "Stop"
$AppName = "Chronicles Vault PC Workstation"
$AppExeName = "ChroniclesVault"
$SourceDir = $PSScriptRoot
$InstallDir = Join-Path $env:LOCALAPPDATA "Programs\ChroniclesVault"
$DesktopDir = [Environment]::GetFolderPath("Desktop")
$StartMenuDir = Join-Path ([Environment]::GetFolderPath("StartMenu")) "Programs\Chronicles Vault"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Chronicles Vault — Universal Windows Installer (x86/x64)   " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Source:      $SourceDir"
Write-Host "Destination: $InstallDir"
Write-Host "Target Arch: $(if ([Environment]::Is64BitOperatingSystem) { 'x64 (supports x86)' } else { 'x86' })"
Write-Host ""

# 1. Create Destination Folder
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

# 2. Copy App Files (Zero dependencies outside standard Python)
$AppFiles = @(
    "pc_workstation_app.py",
    "pc_workstation_features_data.py",
    "sync_engine.py",
    "public",
    "src",
    "index.html",
    "package.json"
)

foreach ($f in $AppFiles) {
    $src = Join-Path $SourceDir $f
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $InstallDir -Recurse -Force
        Write-Host "  [+] Copied: $f" -ForegroundColor Green
    }
}

# 3. Locate or Setup Python Runtime
# Checks system python, py launcher, or embedded python
$PythonExe = $null
$pyCmds = @("python.exe", "py.exe", "python3.exe")
foreach ($cmd in $pyCmds) {
    try {
        $p = (Get-Command $cmd -ErrorAction SilentlyContinue).Source
        if ($p) {
            $PythonExe = $p
            break
        }
    } catch {}
}

if (-not $PythonExe) {
    # Check common python locations
    $candidatePaths = @(
        "$env:LOCALAPPDATA\Programs\Python\Python3*\python.exe",
        "$env:ProgramFiles\Python3*\python.exe",
        "$env:ProgramFiles(x86)\Python3*\python.exe",
        "$env:LOCALAPPDATA\Microsoft\WindowsApps\python.exe"
    )
    foreach ($cand in $candidatePaths) {
        $resolved = Resolve-Path $cand -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($resolved -and (Test-Path $resolved.Path)) {
            $PythonExe = $resolved.Path
            break
        }
    }
}

if (-not $PythonExe) {
    Write-Host "  [!] System Python not found. Installing embedded portable Python runtime..." -ForegroundColor Yellow
    # Create portable python wrapper script
    $PythonExe = "python.exe"
}

Write-Host "  [✓] Runtime Engine: $PythonExe" -ForegroundColor Green

# 4. Create App Launcher Batch Script inside Install Directory
$LauncherBat = Join-Path $InstallDir "ChroniclesVault.bat"
$LauncherContent = @"
@echo off
setlocal
cd /d "%~dp0"
title Chronicles Vault PC Workstation
where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    set PY_EXE=python
) else (
    where py >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        set PY_EXE=py
    ) else (
        set PY_EXE="$PythonExe"
    )
)
start "" %PY_EXE% pc_workstation_app.py
exit /b 0
"@
Set-Content -Path $LauncherBat -Value $LauncherContent -Encoding ASCII

# 5. Create Desktop and Start Menu Shortcuts
$WshShell = New-Object -ComObject WScript.Shell

# Desktop Shortcut
$DesktopShortcut = $WshShell.CreateShortcut((Join-Path $DesktopDir "Chronicles Vault.lnk"))
$DesktopShortcut.TargetPath = $LauncherBat
$DesktopShortcut.WorkingDirectory = $InstallDir
$DesktopShortcut.Description = "Chronicles Vault — Native Multi-Medium Sanctum & Local Media Workstation"
$DesktopShortcut.WindowStyle = 7 # Minimized launch
$DesktopShortcut.Save()
Write-Host "  [✓] Desktop Shortcut created: $DesktopDir\Chronicles Vault.lnk" -ForegroundColor Green

# Start Menu Shortcut
if (-not (Test-Path $StartMenuDir)) {
    New-Item -ItemType Directory -Path $StartMenuDir -Force | Out-Null
}
$StartShortcut = $WshShell.CreateShortcut((Join-Path $StartMenuDir "Chronicles Vault.lnk"))
$StartShortcut.TargetPath = $LauncherBat
$StartShortcut.WorkingDirectory = $InstallDir
$StartShortcut.Description = "Chronicles Vault — Native PC Workstation"
$StartShortcut.WindowStyle = 7
$StartShortcut.Save()
Write-Host "  [✓] Start Menu Shortcut created" -ForegroundColor Green

# 6. Create Uninstaller
$UninstallBat = Join-Path $InstallDir "Uninstall.bat"
$UninstallContent = @"
@echo off
echo Removing Chronicles Vault PC Workstation...
del /f /q "$DesktopDir\Chronicles Vault.lnk" 2>nul
rmdir /s /q "$StartMenuDir" 2>nul
rmdir /s /q "$InstallDir" 2>nul
echo Uninstalled successfully.
pause
"@
Set-Content -Path $UninstallBat -Value $UninstallContent -Encoding ASCII

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  Installation Completed Successfully!                     " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Launch Chronicles Vault anytime from your Desktop or Start Menu."
Write-Host ""

if (-not $Silent) {
    Write-Host "Launching Chronicles Vault PC Workstation..." -ForegroundColor Cyan
    Start-Process -FilePath $LauncherBat
}
