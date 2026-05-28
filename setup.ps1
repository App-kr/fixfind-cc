# fixfind.cc — One-shot bootstrap (PowerShell)
# Usage:  Set-Location Q:\SideProjects\fixfind-cc ; .\setup.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Write-Step($n, $msg) { Write-Host "==> [$n] $msg" -ForegroundColor Cyan }

Write-Step "1/4" "Node version"
$nodeVer = node --version 2>$null
if (-not $nodeVer) { throw "Node not found. Install Node 20+ : https://nodejs.org" }
Write-Host "    $nodeVer"

Write-Step "2/4" "npm install (this may take a minute)"
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

Write-Step "3/4" ".env.local + CRON_SECRET"
if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "    .env.local created from template."
}
$envText = Get-Content ".env.local" -Raw
if ($envText -match '(?m)^CRON_SECRET=\s*$') {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $secret = -join ($bytes | ForEach-Object { $_.ToString("x2") })
    $envText = $envText -replace '(?m)^CRON_SECRET=\s*$', "CRON_SECRET=$secret"
    Set-Content ".env.local" -Value $envText -NoNewline
    Write-Host "    CRON_SECRET generated."
} else {
    Write-Host "    CRON_SECRET already present."
}

Write-Step "4/4" "Verify .gitignore blocks .env files"
$gi = Get-Content ".gitignore" -Raw
if ($gi -notmatch '\.env') { throw ".gitignore is missing .env rule. Refusing to continue." }
Write-Host "    .env* is git-ignored. Zero-Leak Policy verified."

Write-Host ""
Write-Host "================ NEXT STEPS ================" -ForegroundColor Green
Write-Host "1) Edit .env.local and fill:"
Write-Host "     GEMINI_API_KEY              https://aistudio.google.com/app/apikey"
Write-Host "     ALIEXPRESS_APP_KEY/SECRET   https://portals.aliexpress.com"
Write-Host "     SUPABASE_URL + keys         https://supabase.com/dashboard"
Write-Host "     NEXT_PUBLIC_ADSENSE_CLIENT  (optional, after AdSense approval)"
Write-Host ""
Write-Host "2) Apply Supabase schema:"
Write-Host "     Open Supabase SQL Editor"
Write-Host "     Paste contents of supabase\schema.sql and Run"
Write-Host ""
Write-Host "3) Local dev:"
Write-Host "     npm run dev"
Write-Host ""
Write-Host "4) Smoke test the cron locally:"
Write-Host "     npm run cron:local"
Write-Host ""
Write-Host "5) Deploy:"
Write-Host "     npx vercel link"
Write-Host "     foreach (`$v in @('GEMINI_API_KEY','ALIEXPRESS_APP_KEY','ALIEXPRESS_APP_SECRET','ALIEXPRESS_TRACKING_ID','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','NEXT_PUBLIC_SITE_URL','CRON_SECRET')) { npx vercel env add `$v production }"
Write-Host "     npx vercel --prod"
Write-Host "============================================"
