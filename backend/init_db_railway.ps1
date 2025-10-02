# Railway Database Initialization Script
# Run this with: railway run powershell -File init_db_railway.ps1

Write-Host "Initializing Railway Database..." -ForegroundColor Green

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "ERROR: DATABASE_URL not found!" -ForegroundColor Red
    Write-Host "This script should be run with: railway run powershell -File init_db_railway.ps1"
    exit 1
}

Write-Host "DATABASE_URL found, connecting to database..."

# Run the Python initialization script
python init_railway_db.py

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Database initialized successfully!" -ForegroundColor Green
    Write-Host "Your backend should now work properly." -ForegroundColor Green
} else {
    Write-Host "`n❌ Initialization failed. Check the error above." -ForegroundColor Red
    exit 1
}
