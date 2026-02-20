# BoilerFuel Calorie Tracker

BoilerFuel is a privacy-first calorie and fitness tracking application designed for Purdue University students. Browse real-time dining hall menus, log meals, track gym activities, and monitor daily macros—all without creating an account.

## Key Features

- **Live Dining Menus** — Real-time menus from 7 Purdue dining courts with 1000+ foods
- **Purdue Food Co** — 20+ retail locations including Panera, Qdoba, Jersey Mike's, Starbucks
- **Meal Logging** — Log meals with automatic calorie and macro (protein/carbs/fats) calculation
- **Fitness Tracking** — Track workouts, calculate calories burned, and monitor PRs
- **Custom Foods** — Add your own foods with custom nutrition data for home-cooked meals
- **Smart Dashboard** — Net calorie tracking, daily stats, weight charts, and streak tracking
- **Beautiful UI** — Dark mode, multiple view options, mobile-responsive design
- **Privacy First** — No account required; data stored securely in browser cookies
- **Admin Panel** — Manage food catalog, verify accuracy, trigger menu updates
- **Responsive** — Optimized for phones, tablets, and desktops

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 14+ (or SQLite for local dev)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Dapize-Mo/boilerfuel-calorie-tracker.git
cd boilerfuel-calorie-tracker

# 2. Backend setup
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1      # Windows
# source .venv/bin/activate        # macOS/Linux
pip install -r requirements.txt

# 3. Frontend setup
cd ../frontend
npm install

# 4. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Edit .env files with your DATABASE_URL and ADMIN_PASSWORD

# 5. Initialize database
createdb boilerfuel
psql boilerfuel < db/schema.sql
psql boilerfuel < db/seed.sql
psql boilerfuel < db/retail_menu_seed.sql

# 6. Run services (terminal 1: backend)
cd backend && flask --app app run --debug

# 7. Run services (terminal 2: frontend)
cd frontend && npm run dev
```

**Visit <http://localhost:3000>**

## Project Structure

```text
boilerfuel-calorie-tracker/
├── frontend/                 # Next.js web app
│   ├── pages/               # Dashboard, gym, admin, food search
│   ├── components/          # React components (StatCard, WaterTracker, etc.)
│   ├── styles/              # Tailwind CSS + theme variables
│   └── utils/               # Auth, cookies, formatting helpers
├── backend/                 # Flask REST API
│   ├── app.py              # Main application
│   ├── errors.py           # Custom error handling
│   ├── tests/              # pytest test suite
│   └── requirements.txt     # Dependencies
├── scraper/                 # Menu scraping engine (Selenium)
├── db/                      # Database schemas & seeds
├── tools/                   # Maintenance & utility scripts
└── .github/workflows/       # GitHub Actions CI/CD
```

## API Reference

```bash
# Get foods (with filters)
GET /api/foods?dining_court=Earhart&meal_time=lunch

# Get custom foods (authentication required)
GET /api/custom-foods

# Create custom food
POST /api/custom-foods { "name": "...", "calories": 300, "macros": {...} }

# Get activities
GET /api/activities

# Admin login
POST /api/admin/login { "password": "YOUR_PASSWORD" }

# Trigger menu scraping
POST /api/admin/scrape-menus (bearerToken required)
```

## Purdue Food Co Integration

BoilerFuel includes 20+ retail dining locations across campus:

### Chain Restaurants (Full Nutrition Data)

- **Panera Bread** — 32 menu items with complete nutrition
- **Qdoba Mexican Eats** — 24 items (burritos, bowls, tacos)
- **Jersey Mike's Subs** — 24 items (hot & cold subs)
- **Starbucks** (MSEE & Winifred Parker) — 46 items each
- **Walk On's Sports Bistreaux** — 70+ items with calories
- **Freshens Fresh Food Studio** — Frozen yogurt & smoothies

### Campus Cafés & Markets (Placeholder Data)

- Centennial Station
- Atlas Family Marketplace
- Boilermaker Markets (5 locations)
- Famous Frank's, Java House, Saxbys, and more

**Total:** 350+ Food Co menu items

### Custom Foods

Create your own foods for home-cooked meals, meal prep, and recipes:

- Add custom nutrition data (calories, protein, carbs, fats)
- Specify serving sizes
- Add notes and recipe details
- Full CRUD interface at `/custom-foods`

## Tech Stack

**Frontend**: Next.js 14 + React 18 + Tailwind CSS + Recharts
**Backend**: Flask 2.2 + SQLAlchemy 1.4 + PostgreSQL 14+
**Scraping**: Selenium 4 + BeautifulSoup
**Testing**: pytest + Jest + pytest-flask
**Deployment**: Vercel (frontend) + Railway/Render (backend) + GitHub Actions

## Testing

```bash
# Run backend tests
pytest backend/tests -v

# Run frontend tests
npm test

# Check test coverage
pytest backend/tests --cov=backend

# Production build check
npm run build
```

All tests pass: **20/20 backend tests**

## Deployment

### Free Stack (Recommended)

- **Frontend**: Vercel (free tier with unlimited deployments)
- **Database**: Neon.tech or Supabase (free PostgreSQL)
- **Backend**: Vercel Serverless or Railway (free tier $5/month)
- **Scraper**: GitHub Actions (free)

**Total monthly cost**: $0-10

### Steps

1. Connect GitHub repo to Vercel
2. Create PostgreSQL on Neon/Supabase
3. Set environment variables in Vercel Settings
4. Enable GitHub Actions in repository settings
5. Deploy!

## Troubleshooting

**Database connection error?**

Check DATABASE_URL is set correctly:

```bash
psql -c "SELECT version();"
```

**Port 5000 already in use?**

```bash
lsof -ti:5000 | xargs kill -9    # macOS/Linux
Get-Process -Name python | Stop-Process  # Windows
```

**Scraper timeouts?**

```bash
python tools/maintenance/auto_sync_menus.py --days 1
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and add tests
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

## Roadmap

- [ ] User accounts (optional, for sync across devices)
- [ ] Social features (share meals, meal prep ideas)
- [ ] Multi-institution support (other universities)
- [ ] Mobile apps (iOS/Android)
- [ ] Export data (CSV/PDF reports)
- [ ] Apple Health integration
- [ ] Recipe builder

## Changelog

### Recent Updates

- **fix**: Load `retail_menu_seed.sql` in `init_db` for static beverage data
- **feat**: Add beverages to Quick Bites locations and Lawson On-the-GO!
- **feat**: Group logged foods, two-column profile layout, yellow accents
- **fix**: Improve expanded panel layout, add Late Lunch, fix select styling
- **fix**: Ensure calories visible on mobile and fix tablet sidebar overlap
- **fix**: Prevent mobile horizontal overflow clipping content
- **fix**: Disable hover tooltip on mobile to prevent horizontal overflow
- **feat**: Add offline support with service worker and menu caching
- **feat**: Add line charts to stats, macro trends, and feedback form
- **fix**: Filter out Water item from drinks list to avoid duplication
- **feat**: Group beverages into milk/non-milk, move water tracker to sidebar
- **feat**: Add cross-device sync with encrypted data relay
- **feat**: Add favorites, search, filters, stats, water/weight tracking, barcode scanner
- **feat**: Add live scraper progress tracking to admin panel
- **feat**: Add full macro goals editing + profile accessible from landing

## Community

- [Report bugs](https://github.com/Dapize-Mo/boilerfuel-calorie-tracker/issues)
- [Request features](https://github.com/Dapize-Mo/boilerfuel-calorie-tracker/issues)
- [Discuss ideas](https://github.com/Dapize-Mo/boilerfuel-calorie-tracker/discussions)

## License

MIT License — see [LICENSE](LICENSE)

## Acknowledgments

- Purdue HFS for the menu API
- Next.js, Flask, PostgreSQL communities
- All contributors who improve this project

---

**Built for Purdue students** | [GitHub](https://github.com/Dapize-Mo/boilerfuel-calorie-tracker)
