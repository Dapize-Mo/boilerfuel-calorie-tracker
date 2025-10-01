# PowerShell script to test Railway database deployment
# Replace YOUR_RAILWAY_URL with your actual Railway URL

param(
    [Parameter(Mandatory=$true)]
    [string]$RailwayUrl
)

Write-Host "🧪 Testing Database Endpoints on Railway" -ForegroundColor Green
Write-Host "Base URL: $RailwayUrl" -ForegroundColor Cyan

function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "`n🔍 Testing $Method $Url" -ForegroundColor Yellow
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = 10
        }
        
        if ($Body -and $Method -eq "POST") {
            $params.Body = ($Body | ConvertTo-Json)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "   ✅ Status: 200 (Success)" -ForegroundColor Green
        Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor White
        return $response
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   ❌ Status: $statusCode" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Test 1: Health Check
Test-Endpoint "$RailwayUrl/health"

# Test 2: Database Connectivity 
Test-Endpoint "$RailwayUrl/ready"

# Test 3: Initialize Database
Write-Host "`n📊 Initializing Database..." -ForegroundColor Magenta
Test-Endpoint "$RailwayUrl/init-db"

# Test 4: Get Foods
Write-Host "`n🍎 Getting Foods..." -ForegroundColor Magenta
$foods = Test-Endpoint "$RailwayUrl/api/foods"
if ($foods) {
    Write-Host "   Found $($foods.Count) foods in database" -ForegroundColor Green
}

# Test 5: Add New Food
Write-Host "`n➕ Adding New Food..." -ForegroundColor Magenta
$newFood = @{
    name = "PowerShell Test Food"
    calories = 125
    macros = @{
        protein = 12
        carbs = 18
        fats = 4
    }
}
Test-Endpoint "$RailwayUrl/api/foods" -Method "POST" -Body $newFood -ExpectedStatus 201

# Test 6: Get Foods Again
Write-Host "`n🔄 Getting Foods Again..." -ForegroundColor Magenta
$updatedFoods = Test-Endpoint "$RailwayUrl/api/foods"
if ($updatedFoods) {
    Write-Host "   Now found $($updatedFoods.Count) foods in database" -ForegroundColor Green
}

Write-Host "`n🏁 Database testing complete!" -ForegroundColor Green
Write-Host "If all tests passed, your database is working correctly! 🎉" -ForegroundColor Green