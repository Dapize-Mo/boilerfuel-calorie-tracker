# PowerShell script to add next_available column to foods table
# This enables 7-day meal availability forecasting

Write-Host "Adding next_available column to foods table..." -ForegroundColor Cyan

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "ERROR: DATABASE_URL environment variable is not set" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please set your DATABASE_URL first:" -ForegroundColor Yellow
    Write-Host '  $env:DATABASE_URL = "postgresql://user:password@host:port/database"' -ForegroundColor White
    exit 1
}

# Run the Python migration script
python add_next_available_migration.py

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Migration completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To populate the forecast data, run:" -ForegroundColor Cyan
    Write-Host "  python scraper/menu_scraper.py --days 7" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "✗ Migration failed" -ForegroundColor Red
    exit 1
}
