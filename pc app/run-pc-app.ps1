# Chronicles Vault — Standalone Native PC Workstation GUI App Launcher (`pc app/run-pc-app.ps1`)
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $Here
$VenvActivate = Join-Path $RepoRoot "venv\activate-env.ps1"
if (Test-Path $VenvActivate) { . $VenvActivate }

$VenvPython = Join-Path $RepoRoot "venv\Scripts\python.exe"
$AppScript  = Join-Path $Here "pc_workstation_app.py"

Write-Host "Starting Chronicles Vault PC Workstation GUI App (Loading Your Room + 3-Pane Desktop UI + 32 Features in Help)..." -ForegroundColor Cyan
& $VenvPython $AppScript
