# Chronicles Vault — Standalone Mobile Device App Launcher (`mobile app/run-mobile-app.ps1`)
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $Here
$VenvActivate = Join-Path $Root "venv\activate-env.ps1"
if (Test-Path $VenvActivate) { . $VenvActivate }

$env:VITE_PLATFORM_MODE = "mobile"
Write-Host "Starting Chronicles Vault Mobile Device App (Samsung Galaxy A14 LAN Server on port 5174)..." -ForegroundColor Magenta
if (Test-Path (Join-Path $Here "node_modules")) {
    Set-Location $Here
    pnpm run dev --host 0.0.0.0 --port 5174
} else {
    Set-Location $Root
    pnpm --filter @chronicles-vault/client dev --host 0.0.0.0 --port 5174
}
