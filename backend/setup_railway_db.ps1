# Manual Railway Database Setup
# 
# Step 1: Get your DATABASE_URL from Railway
# 1. Go to https://railway.app
# 2. Open your project
# 3. Click on the Postgres service
# 4. Go to "Variables" tab
# 5. Copy the DATABASE_URL value
#
# Step 2: Run this script and paste the URL when prompted

Write-Host "=== Railway Database Initialization ===" -ForegroundColor Cyan
Write-Host ""

# Prompt for DATABASE_URL
Write-Host "Please paste your Railway DATABASE_URL:" -ForegroundColor Yellow
Write-Host "(Get it from: Railway Dashboard > Postgres > Variables > DATABASE_URL)" -ForegroundColor Gray
$databaseUrl = Read-Host "DATABASE_URL"

if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    Write-Host "ERROR: DATABASE_URL cannot be empty!" -ForegroundColor Red
    exit 1
}

# Set environment variable
$env:DATABASE_URL = $databaseUrl

Write-Host ""
Write-Host "Connecting to database and initializing tables..." -ForegroundColor Green

# Run the initialization
python init_railway_db.py

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ SUCCESS! Database is ready!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Go to your Vercel dashboard and add environment variable:" -ForegroundColor White
    Write-Host "   NEXT_PUBLIC_API_URL = https://jubilant-mindfulness-production-34d2.up.railway.app" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Go to your Railway dashboard and update:" -ForegroundColor White
    Write-Host "   FRONTEND_ORIGIN = https://frontend-khaki-seven-44.vercel.app" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Test your site: https://frontend-khaki-seven-44.vercel.app" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Initialization failed. Check the error above." -ForegroundColor Red
    exit 1
}
