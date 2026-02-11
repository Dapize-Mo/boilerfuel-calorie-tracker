@echo off
echo Fixing BoilerFuel Scraper Configuration...
echo ==========================================

REM Stop any running backend processes
taskkill /f /im python.exe 2>nul

REM Navigate to backend directory
cd /d "%~dp0backend"

REM Set environment variables for SQLite
set "DATABASE_URL=sqlite:///boilerfuel.db"
set "ADMIN_PASSWORD=admin123"
set "JWT_SECRET_KEY=2cec215fe9fe4caab23c5f2e4164db800894b18b59634547a75517445953db920704208ebef843fc998e5ada573dd3bf902cf144e8ab4e5eaf47511f833ae88c"
set "FRONTEND_ORIGIN=http://localhost:3000"

REM Remove any existing PostgreSQL environment variables
set "DATABASE_SSLMODE="
set "POSTGRES_HOST="
set "POSTGRES_PORT="
set "POSTGRES_USER="
set "POSTGRES_PASSWORD="
set "POSTGRES_DB="

echo Starting backend with SQLite configuration...
python app.py

pause
