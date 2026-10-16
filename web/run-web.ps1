# Chronicles Vault — Standalone Web Browser App Launcher (`web/run-web.ps1`)
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $Here
$VenvActivate = Join-Path $Root "venv\activate-env.ps1"
if (Test-Path $VenvActivate) { . $VenvActivate }

$env:VITE_PLATFORM_MODE = "web"
Write-Host "Starting Chronicles Vault Web App (Full Sanctum Homepage + 32 Features Guide + 24 Popular Portals)..." -ForegroundColor Cyan
if (Test-Path (Join-Path $Here "node_modules")) {
    Set-Location $Here
    pnpm run dev --host 0.0.0.0 --port 5173
} else {
    Set-Location $Root
    pnpm --filter @chronicles-vault/client dev --host 0.0.0.0 --port 5173
}
