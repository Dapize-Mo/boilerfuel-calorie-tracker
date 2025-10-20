# Django Backend (replacement for Flask)

This Django project mirrors the existing Flask API so the Next.js frontend keeps working without changes.

Endpoints match the Flask routes (same paths and JSON):
- GET /health, GET /ready, POST/GET /init-db
- POST /api/admin/login, GET /api/admin/session
- GET/POST /api/foods, DELETE /api/foods/:id
- GET/POST /api/activities, DELETE /api/activities/:id
- GET /api/dining-courts
- POST /api/scrape-menus, GET /api/scrape-status, POST /api/scrape-menus-sync
- DELETE /api/admin/clear-placeholders

## Configure

Environment variables (compatible with current setup):
- DATABASE_URL or POSTGRES_* parts (same resolution as Flask)
- JWT_SECRET_KEY (default: change-me)
- ADMIN_PASSWORD (set to enable admin endpoints)
- FRONTEND_ORIGIN (comma-separated origins or "*")

## Quick start (Windows PowerShell)

```powershell
# Create venv (optional)
python -m venv .venv; .\.venv\Scripts\Activate.ps1

# Install deps
pip install -r .\django_backend\requirements.txt

# Run migrations
python .\django_backend\manage.py migrate

# Start server on port 5000 to match Flask dev default
$env:PORT="5000"; python .\django_backend\manage.py runserver 0.0.0.0:5000
```

Point your frontend to this server by setting NEXT_PUBLIC_API_URL=http://127.0.0.1:5000.

