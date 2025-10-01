# Quick setup script for Railway database connection
# Run this after copying your DATABASE_URL from Railway

Write-Host "=== BoilerFuel Backend Setup ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please provide your Railway database connection details:" -ForegroundColor Yellow
Write-Host ""

# Read DATABASE_URL from user
Write-Host "1. Go to Railway > Postgres > Variables tab" -ForegroundColor Green
Write-Host "2. Copy the DATABASE_URL value" -ForegroundColor Green
Write-Host ""
$databaseUrl = Read-Host "Paste your DATABASE_URL here"

# Read admin password
Write-Host ""
$adminPassword = Read-Host "Set an admin password for the app (e.g., 'admin123')"

# Read JWT secret
Write-Host ""
Write-Host "Generating a random JWT secret key..." -ForegroundColor Gray
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Create .env file
$envContent = @"
# Database Configuration from Railway
DATABASE_URL=$databaseUrl

# SSL Mode for PostgreSQL
DATABASE_SSLMODE=require

# JWT Secret Key (auto-generated)
JWT_SECRET_KEY=$jwtSecret

# Admin Password
ADMIN_PASSWORD=$adminPassword

# Frontend Origin (for CORS)
FRONTEND_ORIGIN=http://localhost:3000
"@

$envPath = Join-Path $PSScriptRoot ".env"
$envContent | Out-File -FilePath $envPath -Encoding UTF8

Write-Host ""
Write-Host "✓ .env file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Your configuration:" -ForegroundColor Cyan
Write-Host "  Database: Connected to Railway Postgres" -ForegroundColor Gray
Write-Host "  Admin Password: $adminPassword" -ForegroundColor Gray
Write-Host "  JWT Secret: (hidden)" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run: python app.py" -ForegroundColor White
Write-Host "  2. Visit: http://127.0.0.1:5000/init-db to initialize the database" -ForegroundColor White
Write-Host "  3. Start your frontend in another terminal" -ForegroundColor White
Write-Host ""
