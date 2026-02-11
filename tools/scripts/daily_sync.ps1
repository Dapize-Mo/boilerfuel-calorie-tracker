# Daily Menu Sync Script
# Run this daily to keep menu data in sync with Purdue Dining API

Write-Host "BoilerFuel - Daily Menu Sync" -ForegroundColor Cyan
Write-Host "============================`n" -ForegroundColor Cyan

# Activate virtual environment if it exists
if (Test-Path ".venv\Scripts\Activate.ps1") {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & .\.venv\Scripts\Activate.ps1
}

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "ERROR: DATABASE_URL environment variable not set" -ForegroundColor Red
    Write-Host "Set it using: `$env:DATABASE_URL = 'your_database_url'" -ForegroundColor Yellow
    exit 1
}

# Run the sync
Write-Host "Running menu sync for next 7 days...`n" -ForegroundColor Green
python auto_sync_menus.py --days 7

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSync completed successfully!" -ForegroundColor Green
    
    # Optionally verify accuracy
    $verify = Read-Host "`nWould you like to verify accuracy? (y/n)"
    if ($verify -eq 'y') {
        Write-Host "`nRunning verification...`n" -ForegroundColor Yellow
        python debug_menu_mismatch.py
    }
} else {
    Write-Host "`nSync failed with error code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}
