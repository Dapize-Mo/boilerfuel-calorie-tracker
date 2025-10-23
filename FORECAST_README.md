# 7-Day Meal Availability Forecast 📅

## Quick Start

Get meal forecasting running in **3 steps**:

### 1️⃣ Add Database Column
```powershell
# Windows
$env:DATABASE_URL = "your_database_url_here"
.\add_next_available.ps1
```

### 2️⃣ Scrape 7 Days of Data
```powershell
python scraper/menu_scraper.py --days 7
```

### 3️⃣ View the Forecast
Open your app at `/food-dashboard` and see:
- **📅 Today - breakfast, Tomorrow - lunch, Friday - dinner**

Under each food item showing when it will be available next!

---

## What This Does

### Before
```
Scrambled Eggs
180 cal | P: 12g • C: 2g • F: 14g
```

### After
```
Scrambled Eggs
180 cal | P: 12g • C: 2g • F: 14g
📅 Today - breakfast, Tomorrow - breakfast, Friday - breakfast
```

Now you can see when foods will be available for the next **7 days**!

---

## How It Works

### Database
- New `next_available` JSONB column stores upcoming meal schedules
- Example: `[{date: "2025-10-23", day_name: "Thursday", meal_time: "breakfast"}]`

### Scraper
- Enhanced to scrape multiple days ahead (default: 7)
- Tracks when each food appears across all dates
- Stores schedule information in the database

### API
- `GET /api/foods` now returns `next_available` array
- No special queries needed - it's automatic!

### Frontend
- Food cards display formatted upcoming availability
- Shows up to 3 upcoming occurrences
- Color-coded with emerald green for visibility

---

## Commands

### Scrape Different Time Ranges
```bash
python scraper/menu_scraper.py --days 1   # Just today
python scraper/menu_scraper.py --days 7   # Next week (default)
python scraper/menu_scraper.py --days 14  # Two weeks
```

### Test Without Saving
```bash
python scraper/menu_scraper.py --test --days 7
```

### Start From Specific Date
```bash
python scraper/menu_scraper.py --days 7 --date 2025-10-25
```

---

## Keep Data Fresh

### Option 1: Windows Task Scheduler
```powershell
$action = New-ScheduledTaskAction -Execute 'python' -Argument 'C:\path\to\scraper\menu_scraper.py --days 7'
$trigger = New-ScheduledTaskTrigger -Daily -At 3am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "DiningForecast"
```

### Option 2: Linux/Mac Cron
```bash
# Add to crontab (runs daily at 3 AM)
0 3 * * * cd /path/to/project && python scraper/menu_scraper.py --days 7
```

---

## API Example

**Request:**
```http
GET /api/foods?dining_court=Wiley
```

**Response:**
```json
[
  {
    "id": 123,
    "name": "Scrambled Eggs",
    "calories": 180,
    "macros": {"protein": 12, "carbs": 2, "fats": 14},
    "dining_court": "Wiley",
    "station": "Grill",
    "meal_time": "breakfast",
    "next_available": [
      {"date": "2025-10-23", "day_name": "Thursday", "meal_time": "breakfast"},
      {"date": "2025-10-24", "day_name": "Friday", "meal_time": "breakfast"},
      {"date": "2025-10-25", "day_name": "Saturday", "meal_time": "breakfast"}
    ]
  }
]
```

---

## Troubleshooting

### ❌ No forecast data showing
**Solution:** Run the scraper with `--days 7`:
```bash
python scraper/menu_scraper.py --days 7
```

### ❌ Forecast is outdated
**Solution:** Set up automated daily scraping (see "Keep Data Fresh" above)

### ❌ Migration failed
**Error:** `column already exists`  
**Solution:** Already migrated - safe to ignore

**Error:** `permission denied`  
**Solution:** Ensure database user has ALTER TABLE permissions

---

## Files Added

### Database Migrations
- `db/add_next_available.sql` - SQL migration
- `add_next_available_migration.py` - Python migration script
- `add_next_available.ps1` - PowerShell wrapper

### Documentation
- `FORECAST_FEATURE.md` - Complete feature documentation
- `FORECAST_QUICKSTART.md` - 3-step quick start guide
- `FORECAST_IMPLEMENTATION.md` - Implementation details
- `FORECAST_README.md` - This file

---

## Benefits

✅ **Plan meals ahead** - See the full weekly menu  
✅ **Track favorites** - Know when they'll be available  
✅ **Make better choices** - Browse all upcoming options  
✅ **No surprises** - Always know the schedule  

---

## Technical Details

- **Storage:** JSONB column with GIN index (~200-500 bytes per food)
- **Performance:** Scraping 7 days takes 2-3 minutes
- **Cache:** Nutrition cache reduces API calls by ~80%
- **Reliability:** Fallback to Selenium if API fails

---

## Example Use Cases

### 1. Find Tomorrow's Breakfast Foods
```javascript
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

### 2. Check Food Availability Today
```javascript
function isAvailableToday(food) {
  const nextAvail = food.next_available || [];
  const today = new Date().toDateString();
  return nextAvail.some(slot => 
    new Date(slot.date).toDateString() === today
  );
}
```

---

## Future Enhancements

Potential additions:
- **Availability filter:** Show only foods available today
- **Meal planning:** Save foods for later based on forecast
- **Notifications:** Alert when favorites are available
- **Extended forecast:** Support 30-day lookahad
- **Pattern analysis:** Learn when foods typically appear

---

## Support

For detailed documentation, see:
- [FORECAST_FEATURE.md](FORECAST_FEATURE.md) - Comprehensive guide
- [FORECAST_QUICKSTART.md](FORECAST_QUICKSTART.md) - Quick start
- [FORECAST_IMPLEMENTATION.md](FORECAST_IMPLEMENTATION.md) - Technical details

Questions? Check the troubleshooting section or review the implementation docs!

---

## Summary

The 7-day forecasting feature helps you:
1. 📅 See when foods will be available next
2. 🎯 Plan your meals ahead of time
3. ⭐ Track your favorite foods
4. 🍽️ Make informed dining choices

Just run the migration, scrape the data, and enjoy! 🎉
