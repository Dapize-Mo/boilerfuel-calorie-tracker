# BoilerFuel Menu Scraper - PowerShell Script
# This script runs the menu scraper to fetch dining hall menus from Purdue

Write-Host "BoilerFuel Menu Scraper" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "ERROR: DATABASE_URL environment variable is not set." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please set your database URL first:" -ForegroundColor Yellow
    Write-Host '  $env:DATABASE_URL = "postgresql://username:password@host:port/database"' -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or load from .env file in backend directory" -ForegroundColor Yellow
    exit 1
}

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Using: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if required packages are installed
Write-Host ""
Write-Host "Checking required packages..." -ForegroundColor Yellow

$packages = @("requests", "beautifulsoup4", "psycopg2-binary")
$missingPackages = @()

foreach ($package in $packages) {
    $checkResult = python -c "import importlib.util; print('installed' if importlib.util.find_spec('$($package.Replace('-', '_'))') else 'missing')" 2>&1
    if ($checkResult -notmatch "installed") {
        $missingPackages += $package
    }
}

if ($missingPackages.Count -gt 0) {
    Write-Host ""
    Write-Host "Installing missing packages: $($missingPackages -join ', ')" -ForegroundColor Yellow
    pip install $missingPackages
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install required packages" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Starting scraper..." -ForegroundColor Green
Write-Host ""

# Run the scraper
python scraper\menu_scraper.py

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Scraper completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now view the dining court menus in your app." -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Scraper encountered an error." -ForegroundColor Red
    Write-Host "Check the output above for details." -ForegroundColor Yellow
}
