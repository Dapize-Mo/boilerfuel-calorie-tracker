# Simple Railway Test Script
# Usage: .\simple_test.ps1

Write-Host "🚀 Railway Database Test" -ForegroundColor Green
Write-Host ""

# Use the provided Railway URL
$railwayUrl = "https://jubilant-mindfulness-production-34d2.up.railway.app"

# Remove trailing slash if present
$railwayUrl = $railwayUrl.TrimEnd('/')

Write-Host ""
Write-Host "Testing: $railwayUrl" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$railwayUrl/health" -Method GET -TimeoutSec 10
    Write-Host "   ✅ Health: $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Database Ready
Write-Host "2. Testing Database Connectivity..." -ForegroundColor Yellow
try {
    $ready = Invoke-RestMethod -Uri "$railwayUrl/ready" -Method GET -TimeoutSec 10
    Write-Host "   ✅ Ready: $($ready | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Ready check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Initialize Database
Write-Host "3. Initializing Database..." -ForegroundColor Yellow
try {
    $init = Invoke-RestMethod -Uri "$railwayUrl/init-db" -Method GET -TimeoutSec 15
    Write-Host "   ✅ Init: $($init | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Init failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Get Foods
Write-Host "4. Getting Foods..." -ForegroundColor Yellow
try {
    $foods = Invoke-RestMethod -Uri "$railwayUrl/api/foods" -Method GET -TimeoutSec 10
    Write-Host "   ✅ Found $($foods.Count) foods" -ForegroundColor Green
    if ($foods.Count -gt 0) {
        Write-Host "   Sample food: $($foods[0].name) - $($foods[0].calories) calories" -ForegroundColor White
    }
} catch {
    Write-Host "   ❌ Get foods failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🏁 Test Complete!" -ForegroundColor Green