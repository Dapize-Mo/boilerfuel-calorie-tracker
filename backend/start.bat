@echo off
cd /d "%~dp0"
set "DATABASE_URL=postgresql://postgres:REDACTED_PASSWORD@shortline.proxy.rlwy.net:43527/railway"
set "DATABASE_SSLMODE=require"
set "JWT_SECRET_KEY=change-me-to-random-secret-key-12345"
set "ADMIN_PASSWORD=admin123"
set "FRONTEND_ORIGIN=http://localhost:3000"
python app.py
