# BoilerFuel Calorie Tracker

BoilerFuel helps Purdue students browse dining hall menus, log meals, track gym activities, and monitor daily macros and net calories. The project is split into a Next.js frontend and a Flask backend with a PostgreSQL database and a simple scraping utility.

## Features

- **Public food catalog:** Students can browse and filter menu items served on campus.
- **Activity tracking:** Log gym and exercise activities to track calories burned throughout the day.
- **Net calorie tracking:** Dashboard shows calories consumed, calories burned, and net calories for the day.
- **Privacy-first dashboard:** Meals and activities are logged in cookies stored locally in each browser—no personal accounts required.
- **Admin-only management:** A single admin password unlocks CRUD access to the shared food and activity catalogs.
- **Seeding utility:** Quickly bootstrap the database with sample foods and activities via an authenticated endpoint.
- **Next.js + Flask stack:** Modern frontend paired with a lightweight API, ready for local dev or hosted deployment.

## Project Structure

```text
boilerfuel-calorie-tracker/
├── start_services.sh
├── backend/
│   ├── app.py
│   └── requirements.txt
├── frontend/
│   ├── package.json
│   └── next.config.js
├── scraper/
│   └── menu_scraper.py
├── db/
│   ├── schema.sql
│   └── seed.sql
```

## Prerequisites

- Node.js 18+
- Python 3.11+ (project uses 3.13 locally)
- PostgreSQL 14+

## Quick Start

### 1. Environment setup

1. Create and activate the Python virtual environment:

   ```powershell
   cd backend
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   ```

2. Install Python dependencies:

   ```powershell
   pip install -r requirements.txt
   ```

3. Install frontend dependencies:

   ```powershell
   cd ../frontend
   npm install
   ```

### 2. Configure environment variables

Copy the provided examples and adjust values for your setup:

```powershell
Copy-Item frontend/.env.example frontend/.env.local
Copy-Item backend/.env.example backend/.env
```

Key variables to update:

- `backend/.env`
   - `DATABASE_URL` (or discrete `POSTGRES_*` vars) with your PostgreSQL connection string
   - `JWT_SECRET_KEY` with a strong random value
   - `ADMIN_PASSWORD` with an admin-only shared secret
   - `FRONTEND_ORIGIN` pointing to the Next.js site (default `http://localhost:3000`)
- `frontend/.env.local`
   - `NEXT_PUBLIC_API_URL` pointing to the Flask backend (default `http://127.0.0.1:5000`)

Restart the frontend dev server after changing environment variables so the new values take effect.

### 3. Database

1. Create the database:

   ```powershell
   createdb boilerfuel
   ```

2. Apply the schema (run from repo root):

   ```powershell
   psql boilerfuel < db/schema.sql
   ```

3. Optionally seed initial foods:

   ```powershell
   psql boilerfuel < db/seed.sql
   ```

### 4. Run the services

- **Backend API:**

   ```powershell
   cd backend
   flask --app app run --debug
   ```

- **Frontend:**

   ```powershell
   cd frontend
   npm run dev
   ```

Visit <http://localhost:3000> to use the app. The dashboard stores logs locally, while the admin page lets you update the shared food list once you enter the configured admin password.

## Testing & Quality Checks

- **Backend tests:** `python -m pytest backend/tests`
- **Frontend build (lint + type check):** `npm run build`
- **Scraper dry-run:** `python scraper/menu_scraper.py --once`

CI runs these checks automatically on every push and pull request.

## Deployment Notes

- Frontend is ready for Vercel or any Node hosting provider; ensure environment variables match backend.
- Backend can be deployed on services like Railway/Render; set `DATABASE_URL` and `JWT_SECRET_KEY`.
- Add a scheduled job to run the scraper regularly (e.g., GitHub Actions cron or external scheduler).

## Next Steps

- Add rate limiting + password complexity rules.
- Expand tests to cover authentication and logging edge cases.
- Implement pagination/history for past days' totals.
