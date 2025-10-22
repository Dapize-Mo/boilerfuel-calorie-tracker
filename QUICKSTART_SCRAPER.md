# Quick Start - Dining Court Menu Integration

## Setup Complete! ✅

Your BoilerFuel app now supports Purdue dining court menus!

## Quick Start (3 Steps)

### 1. Update Database Schema

If you have an existing database, run this migration:

```powershell
# Using psql
$env:DATABASE_URL = "your-database-url-here"
psql $env:DATABASE_URL -f db\add_dining_courts.sql

# Or manually in your database:
# ALTER TABLE foods ADD COLUMN IF NOT EXISTS dining_court VARCHAR(100);
# ALTER TABLE foods ADD COLUMN IF NOT EXISTS station VARCHAR(255);
# CREATE INDEX IF NOT EXISTS idx_foods_dining_court ON foods(dining_court);
```

### 2. Scrape Menus

**Option A: Via Admin Panel (Easiest)**
1. Start your backend and frontend
2. Go to `http://localhost:3000/admin`
3. Login with admin password
4. Click "Scrape Purdue Menus" button
5. Wait for success message!

**Option B: Via Command Line**
```powershell
# Make sure DATABASE_URL is set
$env:DATABASE_URL = "postgresql://username:password@host:port/database"

# Run scraper
python scraper\menu_scraper.py
```

### 3. Use It!

1. Go to dashboard at `http://localhost:3000/dashboard`
2. In "Log a Meal" section, select a dining court
3. Choose foods from that dining court
4. Log your meal!

## Testing

Verify everything works:

```powershell
# Test API connection (no database)
python test_scraper.py

# Test scraper (no database save)
python scraper\menu_scraper.py --test
```

## What's New

### For Users
- **Dining Court Selector**: Choose from Earhart, Ford, Hillenbrand, Wiley, or Windsor
- **Filtered Foods**: Only see foods from your selected dining court
- **Station Info**: See which station serves each food
- **Real Menus**: All data comes from Purdue's official dining API

### For Admins
- **Scrape Button**: One-click menu updates from admin panel
- **Status Messages**: See how many items were added/skipped
- **Auto-refresh**: Food list updates after scraping

## Dining Courts Available

- **Earhart** (earhart)
- **Ford** (ford)
- **Hillenbrand** (hillenbrand)
- **Wiley** (wiley)
- **Windsor** (windsor)

## Troubleshooting

**No dining courts showing?**
- Run the scraper first to populate menus
- Check that foods have `dining_court` values in database

**Scraper failing?**
- Check `DATABASE_URL` is set: `echo $env:DATABASE_URL`
- Verify internet connection
- Install dependencies: `pip install requests beautifulsoup4 psycopg2-binary`

**Foods not filtering?**
- Clear browser cache
- Check browser console for errors

## Need Help?

See detailed documentation:
- `SCRAPER_INTEGRATION.md` - Complete integration guide
- `SCRAPER_GUIDE.md` - Detailed scraper documentation (if exists)
- `scraper/menu_scraper.py` - Source code with comments

## That's It!

You're ready to track meals from actual Purdue dining courts! 🎉
