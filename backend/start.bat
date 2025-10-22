@echo off
cd /d "%~dp0"
REM Railway Database Connection
REM TODO: Replace RAILWAY_TCP_PROXY_HOST and RAILWAY_TCP_PROXY_PORT with values from Railway dashboard
REM Find these in: Railway Dashboard > Postgres Service > Connect > TCP Proxy
REM Example: railway.proxy.rlwy.net:12345
set "DATABASE_URL=postgresql://postgres:TpWlYEnWWsDfRgDsObuOPLvWmwUQxThz@RAILWAY_TCP_PROXY_HOST:RAILWAY_TCP_PROXY_PORT/railway"
set "DATABASE_SSLMODE=require"
set "JWT_SECRET_KEY=2cec215fe9fe4caab23c5f2e4164db800894b18b59634547a75517445953db920704208ebef843fc998e5ada573dd3bf902cf144e8ab4e5eaf47511f833ae88c"
set "ADMIN_PASSWORD=admin123"
set "FRONTEND_ORIGIN=http://localhost:3000"
python app.py
