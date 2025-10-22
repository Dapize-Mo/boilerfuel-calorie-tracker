# Menu Scraper Guide

This guide explains how to use the menu scraper to populate your BoilerFuel app with dining hall menus from Purdue.

## Overview

The scraper fetches menu data from Purdue's dining services API and adds it to your database. It includes:
- Food names
- Nutritional information (calories, protein, carbs, fats)
- Dining court information (Earhart, Ford, Hillenbrand, Wiley, Windsor)
- Station information (where available)

## Quick Start

### 1. Set Up Your Database URL

The scraper needs access to your database. Set the `DATABASE_URL` environment variable:

**PowerShell:**
```powershell
$env:DATABASE_URL = "postgresql://username:password@localhost:5432/boilerfuel"
```

**Or load from backend/.env:**
```powershell
cd backend
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
}
cd ..
```

### 2. Run the Scraper

**Option A: Use the PowerShell script (Recommended)**
```powershell
.\run_scraper.ps1
```

This script will:
- Check for required dependencies
- Install missing packages automatically
- Run the scraper
- Show you the results

**Option B: Run Python directly**
```powershell
python scraper\menu_scraper.py
```

**Option C: Test mode (scrape without saving)**
```powershell
python scraper\menu_scraper.py --test
```

## Features

### Dining Court Selection
Once you've run the scraper, your dashboard will show a "Dining Court" dropdown that lets you filter foods by location:
- Earhart
- Ford
- Hillenbrand
- Wiley
- Windsor

### Smart Duplicate Detection
The scraper automatically avoids adding duplicate items, so you can run it multiple times safely.

### Station Information
Foods are organized by station (e.g., "Grill", "Home Plate", "Pizza") when available.

## Troubleshooting

### "No DATABASE_URL provided"
Make sure you've set the `DATABASE_URL` environment variable. See step 1 above.

### "Failed to connect to database"
Check that:
1. Your database is running
2. The DATABASE_URL credentials are correct
3. The database exists

### "No items found to save"
This could mean:
1. The Purdue dining API is temporarily unavailable
2. The API structure has changed
3. There's a network connectivity issue

Try running with `--test` flag to see if data is being fetched:
```powershell
python scraper\menu_scraper.py --test
```

### Missing Python packages
The run_scraper.ps1 script will automatically install:
- requests
- beautifulsoup4
- psycopg2-binary

If you run into issues, manually install them:
```powershell
pip install requests beautifulsoup4 psycopg2-binary
```

## Database Schema

The scraper adds two new columns to the `foods` table:
- `dining_court` (VARCHAR 100) - The dining court name
- `station` (VARCHAR 255) - The station within the dining court

To manually apply the schema changes:
```powershell
# Connect to your database and run:
# db\add_dining_courts.sql
```

## Usage in the App

After running the scraper:

1. **Dashboard** - Use the "Dining Court" dropdown to filter foods
2. **Food List** - Shows station info next to each food item
3. **Logged Meals** - Displays which dining court the food came from

## Scheduling Regular Updates

To keep menus fresh, you can schedule the scraper to run daily:

### Windows Task Scheduler
1. Open Task Scheduler
2. Create a new task
3. Set trigger to daily at 6 AM
4. Set action to run: `powershell.exe -File "C:\path\to\run_scraper.ps1"`

### Manual Updates
Simply run the scraper whenever you want to refresh the menu:
```powershell
.\run_scraper.ps1
```

## API Information

The scraper uses Purdue's official dining services API:
```
https://api.hfs.purdue.edu/menus/v2/locations/{dining_court}
```

This is a public API that provides current menu information.

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your DATABASE_URL is correct
3. Make sure your database has the latest schema
4. Try running in test mode to isolate the issue
