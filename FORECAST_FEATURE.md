# 7-Day Meal Availability Forecasting

## Overview

This feature provides **7-day meal availability forecasting** for Purdue Dining foods. When you browse the menu, you'll see when each food item will be available next, showing upcoming dates, days of the week, and meal times (breakfast, lunch, dinner, late lunch).

## What You'll See

Each food item now displays:
- **Food name** and nutrition info (calories, macros)
- **📅 Next Available**: Upcoming meal times for the next 7 days
  - Example: `Today - breakfast, Tomorrow - lunch, Friday - dinner`

## Database Changes

### New Column: `next_available`

A JSONB column has been added to the `foods` table to store forecast data:

```sql
ALTER TABLE foods ADD COLUMN IF NOT EXISTS next_available JSONB;
```

The structure is an array of objects:
```json
[
  {
    "date": "2025-10-23",
    "day_name": "Thursday",
    "meal_time": "breakfast"
  },
  {
    "date": "2025-10-24",
    "day_name": "Friday",
    "meal_time": "lunch"
  }
]
```

## Setup Instructions

### Step 1: Run the Migration

Choose one of these methods:

#### Option A: PowerShell Script (Recommended for Windows)
```powershell
# Set your database URL first
$env:DATABASE_URL = "postgresql://user:password@host:port/database"

# Run the migration
.\add_next_available.ps1
```

#### Option B: Python Script
```bash
# Set your database URL first
export DATABASE_URL="postgresql://user:password@host:port/database"  # Linux/Mac
$env:DATABASE_URL = "postgresql://user:password@host:port/database"   # Windows PowerShell

# Run the migration
python add_next_available_migration.py
```

#### Option C: SQL File (Direct)
```bash
psql $DATABASE_URL -f db/add_next_available.sql
```

### Step 2: Populate Forecast Data

Run the scraper to collect 7 days of menu data:

```bash
# Scrape 7 days ahead (default)
python scraper/menu_scraper.py --days 7

# Or use the PowerShell script
.\run_scraper.ps1 -days 7
```

**What this does:**
- Fetches menus from Purdue Dining for the next 7 days
- For each food item, records when it will appear
- Stores the schedule in the `next_available` column
- Updates existing items with new forecast data

### Step 3: Set Up Auto-Updates (Optional)

To keep forecast data fresh, set up automatic scraping:

#### Windows Task Scheduler
```powershell
# Create a scheduled task to run daily at 3 AM
$action = New-ScheduledTaskAction -Execute 'python' -Argument 'C:\path\to\scraper\menu_scraper.py --days 7'
$trigger = New-ScheduledTaskTrigger -Daily -At 3am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "PurdueDiningForecast" -Description "Update 7-day meal forecast"
```

#### Linux/Mac Cron Job
```bash
# Add to crontab: Run daily at 3 AM
0 3 * * * cd /path/to/project && python scraper/menu_scraper.py --days 7
```

## API Changes

### GET /api/foods

The foods endpoint now returns `next_available` data:

**Request:**
```
GET /api/foods?dining_court=Wiley
```

**Response:**
```json
[
  {
    "id": 123,
    "name": "Scrambled Eggs",
    "calories": 180,
    "macros": {
      "protein": 12,
      "carbs": 2,
      "fats": 14
    },
    "dining_court": "Wiley",
    "station": "Grill",
    "meal_time": "breakfast",
    "next_available": [
      {
        "date": "2025-10-23",
        "day_name": "Thursday",
        "meal_time": "breakfast"
      },
      {
        "date": "2025-10-24",
        "day_name": "Friday",
        "meal_time": "breakfast"
      }
    ]
  }
]
```

## Frontend Changes

### Food Dashboard (`/food-dashboard`)

Foods now display their upcoming availability:

```
┌─────────────────────────────────────┐
│ Scrambled Eggs                  [+] │
│ 180 cal                             │
│ P: 12g • C: 2g • F: 14g             │
│ 📅 Today - breakfast, Tomorrow -    │
│    breakfast, Friday - breakfast    │
└─────────────────────────────────────┘
```

### Formatting Logic

- Shows up to 3 upcoming occurrences
- Displays relative dates: "Today", "Tomorrow", or day name
- Includes meal time for each occurrence

## How It Works

### 1. Scraper (`scraper/menu_scraper.py`)

The scraper has been enhanced to:
- Accept a `--days` parameter (default: 7)
- Iterate through multiple dates
- Track when each food appears across all days
- Store schedule data in `next_appearances`

**Key Functions:**
- `scrape_multiple_days(days_ahead=7)`: Main function to collect multi-day data
- Tracks food schedules: `{(name, dining_court): [(date, meal_time)]}`
- Deduplicates items while preserving schedule information

### 2. Database Storage

- `next_available` column stores JSONB array
- Indexed with GIN index for efficient queries
- Updated whenever scraper runs
- Old forecast data is replaced with fresh data

### 3. Backend API (`backend/app.py`)

- `Food` model includes `next_available` field
- API automatically returns forecast data
- No special filtering required

### 4. Frontend Display (`frontend/pages/food-dashboard.jsx`)

- `formatNextAvailable()` utility function
- Formats dates as "Today", "Tomorrow", or day name
- Shows up to 3 upcoming occurrences
- Styled with emerald-green color for visibility

## Usage Examples

### Example 1: Find Breakfast Foods for Tomorrow

```javascript
// Frontend code
const tomorrowBreakfast = foods.filter(food => {
  const nextAvail = food.next_available || [];
  return nextAvail.some(slot => {
    const date = new Date(slot.date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString() && 
           slot.meal_time === 'breakfast';
  });
});
```

### Example 2: Check If Food Is Available Today

```javascript
function isAvailableToday(food) {
  const nextAvail = food.next_available || [];
  const today = new Date().toDateString();
  return nextAvail.some(slot => 
    new Date(slot.date).toDateString() === today
  );
}
```

### Example 3: Get All Occurrences

```javascript
function getAllOccurrences(food) {
  return (food.next_available || []).map(slot => ({
    date: new Date(slot.date),
    dayName: slot.day_name,
    mealTime: slot.meal_time
  }));
}
```

## Troubleshooting

### Issue: `next_available` is null or empty

**Solutions:**
1. Run the scraper: `python scraper/menu_scraper.py --days 7`
2. Check scraper output for errors
3. Verify dining court data exists for future dates

### Issue: Forecast data is outdated

**Solutions:**
1. Run scraper more frequently
2. Set up automated scraping (cron/Task Scheduler)
3. Increase `--days` parameter if you need more than 7 days

### Issue: Some foods show no forecast

**Possible causes:**
- Food is not on any upcoming menus
- Food name changed (new name won't match old data)
- Dining court is closed/not publishing menus

### Issue: Migration fails

**Error:** `column "next_available" already exists`
- **Solution:** Column already added, safe to ignore

**Error:** `permission denied`
- **Solution:** Ensure database user has ALTER TABLE permissions

## Performance Considerations

### Database Indexing

The GIN index on `next_available` enables efficient JSONB queries:
```sql
CREATE INDEX IF NOT EXISTS idx_foods_next_available 
ON foods USING GIN (next_available);
```

### Scraping Frequency

- **Recommended:** Daily at 3 AM
- **Minimum:** Every 3 days
- **Maximum:** Every 12 hours (avoid excessive API calls)

### Data Size

- Each food item: ~200-500 bytes of forecast data
- 1,000 foods × 7 days ≈ 500 KB total
- Negligible impact on database size

## Future Enhancements

Possible additions:
1. **Filter by availability**: Show only foods available today
2. **Meal planning**: "Save for later" based on forecast
3. **Alerts**: Notify when favorite foods are coming up
4. **Extended forecast**: Support 14 or 30-day lookahad
5. **Historical data**: Track food appearance patterns

## Files Modified

### Database
- `db/add_next_available.sql` - SQL migration
- `add_next_available_migration.py` - Python migration script
- `add_next_available.ps1` - PowerShell migration script

### Backend
- `backend/app.py` - Added `next_available` to Food model and API

### Frontend
- `frontend/pages/food-dashboard.jsx` - Added forecast display

### Scraper
- `scraper/menu_scraper.py` - Already had multi-day support and schedule tracking

## Support

If you encounter issues:
1. Check scraper logs for errors
2. Verify database connection
3. Ensure frontend is fetching latest API data
4. Clear browser cache if forecast doesn't update

## Summary

The 7-day forecasting feature gives you visibility into when foods will be available next, helping you:
- **Plan meals ahead** - Know what's coming
- **Track favorites** - See when they return
- **Make better choices** - Browse full weekly options

Just run the migration, scrape the data, and enjoy the enhanced food dashboard! 🎉
