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


## Next Steps


## Free-only deployment (no Render/Railway)

This repo now supports a free stack using Vercel for both the frontend and API, plus a free Postgres and a scheduled scraper on GitHub Actions:

- Frontend + API: Next.js on Vercel (serverless API routes in `frontend/pages/api/*`)
- Database: Neon, Supabase, or Vercel Postgres (free hobby tier)
- Scraper: GitHub Actions workflow (`.github/workflows/scrape.yml`) runs daily and writes to the DB

Steps:

1. Create a free Postgres

   - Neon: create a project and copy the connection string (starts with postgresql://)
   - Supabase: create a project, Settings → Database → Connection string
   - Vercel Postgres: add the Integration to your Vercel project (gives POSTGRES_URL envs)

2. Configure environment variables

   - On Vercel project → Settings → Environment Variables:
   - DATABASE_URL (or POSTGRES_URL): your Postgres connection string
   - ADMIN_PASSWORD: a secret used for admin login
   - JWT_SECRET_KEY: any random secret (optional; falls back to ADMIN_PASSWORD)

3. Deploy

   - Push to your repo; Vercel will build and the API routes will deploy with the app
   - The frontend uses same-origin API by default; no separate API host needed

4. Enable scheduled scraping (optional)

   - In GitHub: Settings → Secrets and variables → Actions → New repository secret
   - Name: DATABASE_URL, Value: same connection string as above
   - The daily job runs via `.github/workflows/scrape.yml` and fills `foods` from Purdue menus

Notes

- Admin endpoints require the bearer token from `/api/admin/login` (password = ADMIN_PASSWORD)
- Tables are created automatically on first API call; schema matches `foods` and `activities`
- Selenium is not used in serverless; the heavy scraping runs in GitHub Actions
