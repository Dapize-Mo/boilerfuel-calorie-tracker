# PowerShell script to add meal_time column to database
Write-Host "Adding meal_time column to database..." -ForegroundColor Cyan

# Activate Python environment if needed and run migration
python add_meal_time_migration.py

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Migration completed successfully!" -ForegroundColor Green
    Write-Host "The meal_time column has been added to the foods table." -ForegroundColor Green
} else {
    Write-Host "`n✗ Migration failed. Please check the error messages above." -ForegroundColor Red
    exit 1
}
