# Script to update Railway database with dining court columns
# Run this after deploying the new code

Write-Host "`n=== Railway Database Migration ===" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
try {
    railway --version | Out-Null
    Write-Host "✓ Railway CLI found" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Railway CLI not found" -ForegroundColor Red
    Write-Host "Install it with: npm install -g @railway/cli" -ForegroundColor Yellow
    Write-Host "Or manually run the migration SQL in Railway dashboard" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Running database migration..." -ForegroundColor Yellow
Write-Host ""

# Run the migration
railway run psql -f db/add_dining_courts.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Database migration complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next: Go to your website's /admin page and click 'Scrape Purdue Menus'" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Migration failed. You can run it manually:" -ForegroundColor Yellow
    Write-Host "1. Go to Railway dashboard" -ForegroundColor White
    Write-Host "2. Open your Postgres database" -ForegroundColor White
    Write-Host "3. Go to 'Query' tab" -ForegroundColor White
    Write-Host "4. Run this SQL:" -ForegroundColor White
    Write-Host ""
    Get-Content db\add_dining_courts.sql
}
