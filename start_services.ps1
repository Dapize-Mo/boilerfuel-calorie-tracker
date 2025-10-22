# Windows helper to initialize the DB and start backend/frontend in separate terminals
param(
    [string]$DatabaseUrl = "postgresql://postgres:password@127.0.0.1:5432/boilerfuel",
    [string]$JwtSecret   = "change-me",
    [switch]$SkipInit
)

$ErrorActionPreference = 'Stop'

function Ensure-Venv {
    Write-Host "[backend] Ensuring virtual environment..." -ForegroundColor Cyan
    if (-not (Test-Path -Path "backend/.venv")) {
        python -m venv "backend/.venv"
    }
    & "backend/.venv/Scripts/Activate.ps1"
    Write-Host "[backend] Installing Python dependencies (if needed)..." -ForegroundColor Cyan
    python -m pip install -r "backend/requirements.txt" | Out-Host
}

function Init-Database {
    param([string]$Url)
    if ($SkipInit) {
        Write-Host "[db] Skipping schema/seed initialization per --SkipInit" -ForegroundColor Yellow
        return
    }
    Write-Host "[db] Applying schema and seed using backend/init_db.py" -ForegroundColor Cyan
    $env:DATABASE_URL = $Url
    python "backend/init_db.py"
}

function Start-Backend {
    param([string]$Url, [string]$Secret)
    Write-Host "[backend] Starting Flask API..." -ForegroundColor Green
    $escapedUrl = $Url -replace "'", "''"
    $escapedSecret = $Secret -replace "'", "''"
    $backendCmd = @"
cd '$PWD/backend'; .\.venv\Scripts\Activate.ps1; `$env:FLASK_APP='app'; `$env:DATABASE_URL='$escapedUrl'; `$env:JWT_SECRET_KEY='$escapedSecret'; python -m flask run --debug
"@
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd | Out-Null
}

function Start-Frontend {
    Write-Host "[frontend] Starting Next.js dev server..." -ForegroundColor Green
    $frontendCmd = @"
cd '$PWD/frontend'; `$env:NEXT_PUBLIC_API_URL='http://127.0.0.1:5000'; npm install; npm run dev
"@
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd | Out-Null
}

# Main
Push-Location $PSScriptRoot
try {
    Ensure-Venv
    Init-Database -Url $DatabaseUrl
    Start-Backend -Url $DatabaseUrl -Secret $JwtSecret
    Start-Frontend
    Write-Host "\nAll set! Two terminals were opened: one for Flask (port 5000) and one for Next.js (port 3000)." -ForegroundColor Green
    Write-Host "Open http://localhost:3000 and hit http://127.0.0.1:5000/health to verify." -ForegroundColor Green
}
finally {
    Pop-Location
}
