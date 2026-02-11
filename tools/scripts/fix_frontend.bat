@echo off
echo Fixing Frontend Configuration...
echo ===============================

REM Navigate to frontend directory
cd /d "%~dp0frontend"

REM Set environment variable to point to backend
set "NEXT_PUBLIC_API_URL=http://127.0.0.1:5000"

echo Starting frontend with backend API configuration...
npm run dev

pause
