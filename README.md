# BoilerFuel Calorie Tracker

BoilerFuel helps Purdue students browse dining hall menus, log meals, and track daily macros. The project is split into a Next.js frontend and a Flask backend with a PostgreSQL database and a simple scraping utility.

## Features

- **Menu Browser:** Browse daily menus grouped by meal with live search and nutrient details.
- **Dashboard:** View logged foods and aggregated calorie/macro totals for the current day.
- **Authentication:** Email + password signup and login backed by JWT tokens stored client-side.
- **Meal Logging:** Record servings for any menu item and instantly recalculate totals.
- **Data Pipeline:** Scraper ingests menu data into PostgreSQL; REST API exposes meals and logs.
- **CI Pipeline:** GitHub Actions workflow installs dependencies, runs tests, and builds the frontend.

## Project Structure

```
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
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

Update database connection strings and JWT secrets accordingly.

To skip the login flow while prototyping, set the following in `frontend/.env.local`:

```bash
NEXT_PUBLIC_BYPASS_AUTH=true
# NEXT_PUBLIC_BYPASS_EMAIL=your.name@example.com  # optional
```

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

Visit <http://localhost:3000> to use the app. The frontend proxies API requests to the Flask server via the configured environment variables.

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