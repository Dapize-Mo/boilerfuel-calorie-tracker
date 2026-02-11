# Architecture & System Design

This document provides a detailed overview of BoilerFuel's architecture, data flow, and key components.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      User's Browser                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Next.js Frontend (React 18)                    │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ Pages: Dashboard, Gym, Food Search, Admin Panel     │ │   │
│  │  ├─────────────────────────────────────────────────────┤ │   │
│  │  │ Components: StatCard, WaterTracker, WeightChart     │ │   │
│  │  ├─────────────────────────────────────────────────────┤ │   │
│  │  │ State: Context API + Cookies (privacy-first)        │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↕↕↕ (HTTPS)                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌──────────────────────────────────────────┐
        │   Flask REST API (Python)                │
        │  ┌────────────────────────────────────┐  │
        │  │ /api/foods         (GET/POST)      │  │
        │  │ /api/activities    (GET/POST)      │  │
        │  │ /api/admin/*       (Admin routes)  │  │
        │  │ /health, /ready    (K8s probes)    │  │
        │  └────────────────────────────────────┘  │
        └──────────────────────────────────────────┘
                      ↕↕↕ (SQLAlchemy ORM)
        ┌──────────────────────────────────────────┐
        │   PostgreSQL Database                    │
        │  ├─ foods        (name, macros, etc.)    │
        │  ├─ activities   (name, calories, etc.)  │
        │  ├─ menu_snapshots (caching layer)       │
        │  └─ users*       (*planned feature)      │
        └──────────────────────────────────────────┘
                              ↑
        ┌──────────────────────────────────────────┐
        │   Menu Scraper (Selenium/BeautifulSoup)  │
        │  ┌────────────────────────────────────┐  │
        │  │ Fetch from Purdue HFS API (daily)  │  │
        │  │ Parse menu items                   │  │
        │  │ Enrich with nutrition data         │  │
        │  │ Store snapshots for comparison     │  │
        │  └────────────────────────────────────┘  │
        └──────────────────────────────────────────┘
```

## Component Overview

### Frontend (Next.js)

**Technology Stack:**
- Framework: Next.js 14.2 with React 18.3
- Styling: Tailwind CSS 3.4 with CSS variables for themeing
- State: Context API + Cookies (no accounts = no server storage)
- Charts: Recharts 3.4.1
- Data Fetching: SWR 2.3 (client-side caching)

**Key Pages:**
- `/dashboard` — Main tracking interface (meals, water, weight, stats)
- `/gym` — Exercise tracking with workout templates and PRs
- `/food-dashboard` — Search and browse available foods
- `/admin` — Admin panel for content management
- `/profile` — User preferences and settings
- `/about` — Information page
- `/changelog` — Version history

**Data Flow (Frontend):**
1. User logs meal → Cookie stored locally
2. Component reads cookie → Renders stats
3. User clicks "View Purdue Menus" → Fetches `/api/foods` → Displays results
4. Background: Every 5 min check for menu updates via `/api/foods/latest`

### Backend (Flask)

**Technology Stack:**
- Framework: Flask 2.2.3
- ORM: SQLAlchemy 1.4.52
- Auth: Flask-JWT-Extended 4.4.4
- Validation: (Manual currently, can upgrade to Marshmallow)
- Error Handling: Custom error classes (see `errors.py`)

**Key Routes:**
```
GET  /health              — Health check (simple "ok")
GET  /ready               — Ready check (includes DB status)
GET  /api/foods           — List foods with filters
POST /api/foods           — Add food (admin only)
GET  /api/activities      — List activities
POST /api/activities      — Add activity (admin only)
POST /api/admin/login     — Get JWT token
POST /api/admin/scrape-menus — Trigger manual scrape
GET  /api/admin/menu-compare — Accuracy report
```

**Error Handling:**
- Custom exception classes for standard HTTP errors
- Central error handler middleware (`@app.errorhandler`)
- All errors return JSON: `{ "error": "message", "status": 400 }`

### Database (PostgreSQL)

**Schema:**
```sql
-- Core tables
foods
├── id (PK)
├── name (indexed)
├── dining_court (indexed)
├── meal_time (indexed)
├── calories
├── macros (JSONB: protein, carbs, fats)
└── next_available (JSONB: 7-day forecast)

activities
├── id (PK)
├── name
├── calories_burned
└── category

menu_snapshots (cache layer)
├── id (PK)
├── location
├── meal_date
├── meal_time
├── items (JSONB array)
└── created_at

-- Planned: User tables
users (future)
├── id (PK)
├── email (unique)
├── password_hash
├── preferences (JSONB)
└── created_at
```

**Indexing Strategy:**
- GIN index on `foods.next_available` for JSON queries
- B-tree indexes on `dining_court`, `meal_time` for filtering
- Unique constraint on `(location, meal_date, meal_time)` in snapshots

### Scraper (Selenium + BeautifulSoup)

**Workflow:**
1. **Daily Schedule** (GitHub Actions): Runs at 2 AM UTC
2. **Fetch Menu**: Call `https://api.hfs.purdue.edu/menus/v2/locations/{location}/{date}`
3. **Parse Items**: Extract food names, prices, and attributes
4. **Enrich**: Fetch nutrition details from separate endpoint
5. **Store**: Insert/update foods, create snapshot for comparison
6. **Validate**: Check for accuracy against previous snapshot

**Files:**
- `scraper/menu_scraper.py` — Main scraping logic
- `scraper/dining_locations.py` — Hardcoded list of dining courts (✓ should be DB-driven)
- `tools/maintenance/auto_sync_menus.py` — CLI wrapper for scheduled runs
- `.github/workflows/scrape.yml` — GitHub Actions trigger

## Data Flow Diagrams

### User Meal Logging Flow

```
User enters meal in dashboard
         ↓
Component validates input
         ↓
Serialize to JSON
         ↓
Store in browser cookie (localStorage)
         ↓
Component re-renders showing calories/macros
         ↓
(No backend call required—privacy first!)
```

### Menu Update Flow

```
[Daily 2 AM] GitHub Actions triggered
         ↓
Run `auto_sync_menus.py`
         ↓
For each dining court:
   - Fetch from Purdue HFS API
   - Parse menu items
   - Fetch nutrition details
   ↓
Compare with existing foods in DB
   ↓
Update foods table
Create menu_snapshot
   ↓
Log results
Test completes ✓
```

### Admin Verification Flow

```
Admin opens /admin → Accuracy tab
         ↓
Frontend fetches /api/admin/menu-compare
         ↓
Backend queries recent snapshots
         ↓
Compare live API data vs. DB foods
         ↓
Return differences (added/removed/changed)
         ↓
Admin reviews and can trigger fixes
```

## Deployment Architectures

### Local Development
```
Windows Machine
├── Python venv (Flask)
├── Node.js (Next.js dev server)
└── PostgreSQL (local or docker)
```

### Vercel + Neon (Free Tier - Recommended)
```
GitHub Repo
├─ Push to main
├─ Vercel builds & deploys frontend
├─ Vercel serverless includes backend API routes
├─ Neon PostgreSQL stores data
└─ GitHub Actions runs daily scraper
```

### Traditional VPS (Heroku/Railway)
```
Vercel (Frontend)
└─ Vercel Serverless API Routes
    └─ Railway Postgres (backend DB)
    └─ Railway Python Service (scraper worker)
```

## Key Design Decisions

### Why No User Accounts (by default)?
- **Privacy first**: Data never leaves the browser unless exported
- **No server load**: No user table to maintain
- **No auth burden**: Avoids password resets, 2FA complexity
- **Future-compatible**: Can add accounts as optional feature flag

### Why Cookies for Storage?
- **No backend required** for meal logging
- **Automatic sync** across browser tabs (via storage events)
- **GDPR friendly** (no personal data on server)
- **User control**: Delete cookies = delete all logs

### Why PostgreSQL + JSON Columns (JSONB)?
- **Flexible schema** for food attributes (dietary, allergens, etc.)
- **Next_available field** stores 7-day forecast efficiently
- **Macro breakdown** as JSON object (protein, carbs, fats)
- **Scalable**: GIN indexes support fast JSON filtering
- **vs SQLite**: Better for production multi-user access

### Why Separate Scraper from API?
- **Decoupled scaling**: Scraper can be resource-intensive
- **Scheduled job**: GitHub Actions = no server required
- **Isolation**: Menu updates don't impact API uptime
- **Flexibility**: Can use async queue (BullMQ, Celery) later

## Security Considerations

### Current Status ✓
- JWT tokens signed with secret key
- CORS validation (configurable origins)
- SQL injection protected (ORM parameterization)
- No sensitive data in cookies (only food IDs, amounts)

### Future Improvements
- [ ] Rate limiting on all endpoints
- [ ] Input validation (Zod/Marshmallow)
- [ ] CSRF protection (add state tokens)
- [ ] Password hashing (bcrypt) for user accounts
- [ ] Audit logging for admin actions
- [ ] API versioning (`/api/v1/`)

## Performance Optimizations

### Current
- Pagination on food lists (50 items default)
- Index-driven queries on high-volume tables
- Snapshot caching to avoid re-scraping
- Client-side SWR caching (5 min default)

### Opportunities
- Redis layer for session/food cache
- Materialized views for admin dashboards
- Batch API calls (GraphQL as alternative)
- Service worker for offline support
- Image optimization (WebP, srcset)

## Testing Strategy

### Backend (pytest)
- Unit tests for error classes ✓
- API endpoint tests ✓
- Database ORM tests
- Integration tests (auth flow)
- E2E tests (meal logging → stats calc)

### Frontend (Jest)
- Component rendering tests
- User interaction tests (clicking, typing)
- Cookie serialization tests
- Responsive layout tests

## Future Architecture Improvements

### Phase: User Accounts (Optional)
- Add `users` table
- Implement registration/login flow
- Migrate cookies → database records
- Enable cross-device sync

### Phase: Multi-Institution
- Add `institutions` table
- Support for other universities
- Adapter pattern for different menu APIs
- Institution-specific branding

### Phase: Microservices (if needed)
- Separate scraper service (Python worker)
- Separate API service (Flask)
- Separate analytics service
- Message queue for async jobs (RabbitMQ/Redis)

## Monitoring & Observability

### Current
- Application logs (Flask debug + print statements)
- GitHub Actions logs for scraper

### Recommended
- Structured logging (Python logging module)
- Sentry for error tracking
- Datadog/New Relic for performance
- CloudWatch for AWS deployments
- Prometheus metrics for scaling

---

**Last Updated**: February 2025 | Version 1.5.0
