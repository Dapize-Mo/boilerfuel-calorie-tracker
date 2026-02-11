# 🔥 BoilerFuel Calorie Tracker

BoilerFuel is a privacy-first calorie and fitness tracking application designed for Purdue University students. Browse real-time dining hall menus, log meals, track gym activities, and monitor daily macros—all without creating an account.

## ✨ Key Features

- 📋 **Live Dining Menus** — Real-time menus from 7 Purdue dining courts with 1000+ foods
- 🍽️ **Meal Logging** — Log meals with automatic calorie and macro (protein/carbs/fats) calculation
- 🏋️ **Fitness Tracking** — Track workouts, calculate calories burned, and monitor PRs
- 📊 **Smart Dashboard** — Net calorie tracking, daily stats, weight charts, and streak tracking
- 🎨 **Beautiful UI** — Dark mode, multiple view options, mobile-responsive design
- 🔐 **Privacy First** — No account required; data stored securely in browser cookies
- ⚡ **Admin Panel** — Manage food catalog, verify accuracy, trigger menu updates
- 📱 **Responsive** — Optimized for phones, tablets, and desktops

## 🚀 Quick Start (5 Minutes)

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

# 6. Run services (terminal 1: backend)
cd backend && flask --app app run --debug

# 7. Run services (terminal 2: frontend)
cd frontend && npm run dev
```

**Visit http://localhost:3000** 🎉

## 📁 Project Structure

```
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
├── docs/                    # Full documentation
└── .github/workflows/       # GitHub Actions CI/CD
```

## 🔗 Quick API Reference

```bash
# Get foods (with filters)
GET /api/foods?dining_court=Earhart&meal_time=lunch

# Get activities
GET /api/activities

# Admin login
POST /api/admin/login { "password": "YOUR_PASSWORD" }

# Trigger menu scraping
POST /api/admin/scrape-menus (bearerToken required)
```

See [docs/API.md](docs/API.md) for complete reference.

## 🛠️ Tech Stack

**Frontend**: Next.js 14 + React 18 + Tailwind CSS + Recharts  
**Backend**: Flask 2.2 + SQLAlchemy 1.4 + PostgreSQL 14+  
**Scraping**: Selenium 4 + BeautifulSoup  
**Testing**: pytest + Jest + pytest-flask  
**Deployment**: Vercel (frontend) + Railway/Render (backend) + GitHub Actions

## 📚 Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — System design & data flow  
- [API.md](docs/API.md) — REST API reference  
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) — Production setup guide  
- [SETUP_LOCAL.md](docs/SETUP_LOCAL.md) — Local development  
- [SETUP_DOCKER.md](docs/SETUP_DOCKER.md) — Docker setup  
- [CONTRIBUTING.md](docs/CONTRIBUTING.md) — How to contribute  
- [SECURITY.md](SECURITY.md) — Security guidelines  

## 🧪 Testing

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

All tests pass: **20/20 backend tests ✓**

## 🚀 Deployment

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
5. Deploy! 🚀

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

## 🐛 Troubleshooting

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

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for more solutions.

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository  
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and add tests  
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`  
6. Open a Pull Request  

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

## 🗺️ Roadmap

- [ ] User accounts (optional, for sync across devices)
- [ ] Social features (share meals, meal prep ideas)
- [ ] Multi-institution support (other universities)
- [ ] Mobile apps (iOS/Android)
- [ ] Export data (CSV/PDF reports)
- [ ] Apple Health integration
- [ ] Recipe builder

## 👥 Community

- 🐛 [Report bugs](https://github.com/Dapize-Mo/boilerfuel-calorie-tracker/issues)
- 💡 [Request features](https://github.com/Dapize-Mo/boilerfuel-calorie-tracker/issues)
- 💬 [Discuss ideas](https://github.com/Dapize-Mo/boilerfuel-calorie-tracker/discussions)

## 📄 License

MIT License — see [LICENSE](LICENSE)

## 🙏 Acknowledgments

- Purdue HFS for the menu API
- Next.js, Flask, PostgreSQL communities
- All contributors who improve this project

---

**Built with ❤️ for Purdue students** | [GitHub](https://github.com/Dapize-Mo/boilerfuel-calorie-tracker)
