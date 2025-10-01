# Detailed Railway Test with Error Info
$railwayUrl = "https://jubilant-mindfulness-production-34d2.up.railway.app"

Write-Host "🔍 Detailed Railway Database Test" -ForegroundColor Green
Write-Host "URL: $railwayUrl" -ForegroundColor Cyan
Write-Host ""

function Test-EndpointDetailed {
    param([string]$Url, [string]$Name)
    
    Write-Host "Testing $Name..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 15
        $content = $response.Content | ConvertFrom-Json
        Write-Host "   ✅ Success: $($content | ConvertTo-Json -Compress)" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "   Status Code: $statusCode" -ForegroundColor Red
            
            # Try to get error details
            try {
                $errorStream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($errorStream)
                $errorBody = $reader.ReadToEnd()
                Write-Host "   Error Details: $errorBody" -ForegroundColor Red
            }
            catch {
                Write-Host "   Could not read error details" -ForegroundColor Red
            }
        }
        return $false
    }
}

# Test each endpoint
Test-EndpointDetailed "$railwayUrl/health" "Health Check"
Test-EndpointDetailed "$railwayUrl/ready" "Database Ready Check" 
Test-EndpointDetailed "$railwayUrl/init-db" "Database Initialization"
Test-EndpointDetailed "$railwayUrl/api/foods" "Get Foods"

Write-Host ""
Write-Host "💡 Next steps:" -ForegroundColor Cyan
Write-Host "1. Check Railway logs for detailed error messages" -ForegroundColor White
Write-Host "2. Verify DATABASE_URL environment variable is set" -ForegroundColor White
Write-Host "3. Ensure PostgreSQL service is running and accessible" -ForegroundColor White