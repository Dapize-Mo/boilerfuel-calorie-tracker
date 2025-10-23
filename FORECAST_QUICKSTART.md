# 7-Day Forecast Quick Start

Get your meal availability forecasting up and running in 3 steps!

## Step 1: Add the Column (30 seconds)

```powershell
# Windows PowerShell
$env:DATABASE_URL = "your_database_url_here"
.\add_next_available.ps1
```

```bash
# Linux/Mac
export DATABASE_URL="your_database_url_here"
python add_next_available_migration.py
```

## Step 2: Scrape 7 Days (2-3 minutes)

```powershell
# Windows
python scraper/menu_scraper.py --days 7
```

```bash
# Linux/Mac
python scraper/menu_scraper.py --days 7
```

## Step 3: View the Dashboard

Open your app and go to **Food Dashboard** (`/food-dashboard`)

You'll now see:
- 📅 **Today - breakfast, Tomorrow - lunch, Friday - dinner**

Under each food item!

## What You Get

✅ 7-day meal availability forecast  
✅ See when foods are coming up next  
✅ Plan your meals ahead of time  
✅ Track your favorite foods  

## Keep It Fresh

Run the scraper daily to keep forecast data updated:

```powershell
# Add to Windows Task Scheduler (runs daily at 3 AM)
$action = New-ScheduledTaskAction -Execute 'python' -Argument 'C:\path\to\scraper\menu_scraper.py --days 7'
$trigger = New-ScheduledTaskTrigger -Daily -At 3am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "DiningForecast"
```

```bash
# Add to crontab (runs daily at 3 AM)
0 3 * * * cd /path/to/project && python scraper/menu_scraper.py --days 7
```

## Troubleshooting

**Not seeing forecast data?**
- Run the scraper: `python scraper/menu_scraper.py --days 7`
- Check that foods have `next_available` data in the API response

**Forecast is outdated?**
- Re-run the scraper
- Set up automated daily scraping

For more details, see [FORECAST_FEATURE.md](FORECAST_FEATURE.md)
