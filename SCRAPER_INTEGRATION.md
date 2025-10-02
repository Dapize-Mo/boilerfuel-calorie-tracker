# Scraper Integration - Complete! ✅

## What's Been Implemented

Your BoilerFuel calorie tracker now has full integration with the Purdue dining menu scraper! Users can select a dining court and see actual foods from Purdue's dining halls.

### Backend Changes ✅

1. **Database Schema Updated** (`db/schema.sql`)
   - Added `dining_court` column (VARCHAR 100)
   - Added `station` column (VARCHAR 255)
   - Added index on `dining_court` for faster filtering

2. **API Endpoints** (`backend/app.py`)
   - `GET /api/dining-courts` - Returns list of available dining courts
   - `GET /api/foods?dining_court=earhart` - Filters foods by dining court
   - `POST /api/scrape-menus` - Admin endpoint to trigger menu scraping

3. **Food Model Updated**
   - Includes `dining_court` and `station` fields
   - Returns these fields in API responses

### Frontend Changes ✅

1. **Dashboard** (`frontend/pages/dashboard.jsx`)
   - Added dining court dropdown selector
   - Filters food list based on selected dining court
   - Displays dining court and station information for each food
   - Shows count of available items per dining court

2. **Admin Panel** (`frontend/pages/admin.jsx`)
   - Added "Scrape Purdue Menus" button
   - Shows progress while scraping
   - Displays success message with item counts
   - Automatically refreshes food list after scraping

### Scraper Features ✅

1. **Menu Scraper** (`scraper/menu_scraper.py`)
   - Fetches data from Purdue's official API
   - Supports all 5 dining courts: Earhart, Ford, Hillenbrand, Wiley, Windsor
   - Extracts: name, calories, protein, carbs, fats, station, dining court
   - Handles all meal periods: breakfast, lunch, dinner
   - Avoids duplicate entries
   - Error handling for network issues

2. **Scripts Available**
   - `run_scraper.ps1` - PowerShell script with dependency checking
   - `test_scraper.py` - Test script to verify API connection
   - Can also run directly: `python scraper/menu_scraper.py`

## How to Use

### For Users (Dashboard)

1. Open the dashboard
2. In "Log a Meal" section, select a dining court from dropdown
3. Choose from foods available at that dining court
4. Each food shows which station it's from
5. Log meals as usual!

### For Admins

1. Log into admin panel at `/admin`
2. Click **"Scrape Purdue Menus"** button
3. Wait 10-30 seconds for scraping to complete
4. See success message: "Successfully scraped X new items!"
5. Foods are immediately available on dashboard

### Command Line

```powershell
# Quick test (no database save)
python scraper\menu_scraper.py --test

# Full scrape (saves to database)
# Set DATABASE_URL first!
$env:DATABASE_URL = "your-database-url"
python scraper\menu_scraper.py

# Or use the convenience script
.\run_scraper.ps1
```

## What Users See

### Before Selecting Dining Court
- "All Dining Courts" selected (default)
- Shows all available foods from all dining courts

### After Selecting Dining Court
- Only foods from selected court appear
- Dropdown shows: "Select a food from earhart..."
- Food count displayed: "(45 items available)"
- Each food item shows:
  - Name and calories
  - Station name (e.g., "Grill", "Home Plates")
  - Dining court name (when viewing logs)

## Example Data Structure

When scraper runs, it creates entries like:

```javascript
{
  name: "Grilled Chicken Breast",
  calories: 165,
  macros: {
    protein: 31,
    carbs: 0,
    fats: 3.6
  },
  dining_court: "earhart",
  station: "Grill"
}
```

## Dining Courts Supported

- **earhart** - Earhart Dining Court
- **ford** - Ford Dining Court
- **hillenbrand** - Hillenbrand Dining Court
- **wiley** - Wiley Dining Court
- **windsor** - Windsor Dining Court

## Database Migration

If upgrading an existing database, run this SQL:

```sql
ALTER TABLE foods 
ADD COLUMN IF NOT EXISTS dining_court VARCHAR(100),
ADD COLUMN IF NOT EXISTS station VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_foods_dining_court ON foods(dining_court);
```

Or run the migration file:
```bash
psql $DATABASE_URL < db/add_dining_courts.sql
```

## Testing

1. **Test API Connection**
   ```bash
   python test_scraper.py
   ```

2. **Test Scraper (No Database)**
   ```bash
   python scraper/menu_scraper.py --test
   ```

3. **Test via Admin Panel**
   - Login to `/admin`
   - Click "Scrape Purdue Menus"
   - Check for success message

4. **Test User Experience**
   - Go to dashboard
   - Select a dining court
   - Verify foods are filtered
   - Log a meal and verify station info appears

## Troubleshooting

### No Dining Courts Showing
- Run the scraper first to populate foods with dining court data
- Check that `dining_court` column exists in database
- Verify API endpoint: `curl http://localhost:5000/api/dining-courts`

### Foods Not Filtering
- Clear browser cache
- Check browser console for errors
- Verify `dining_court` parameter in network requests

### Scraper Fails
- Check internet connection
- Verify Purdue API is accessible: https://api.hfs.purdue.edu/menus/v2/locations/earhart
- Check DATABASE_URL is set correctly
- Ensure required packages are installed

## Next Steps (Optional Enhancements)

1. **Auto-refresh menus daily** - Set up cron job or scheduled task
2. **Show meal period** - Add filter for breakfast/lunch/dinner
3. **Cache API responses** - Reduce API calls to Purdue servers
4. **Show photos** - If available in API, display food images
5. **Favorite dining courts** - Remember user's preferred court

## Files Modified/Created

### Modified
- `backend/app.py` - Added scrape endpoint, dining courts endpoint
- `frontend/pages/dashboard.jsx` - Added dining court selector
- `frontend/pages/admin.jsx` - Added scrape button
- `db/schema.sql` - Added dining court columns

### Already Existed (Verified)
- `scraper/menu_scraper.py` - Core scraping logic
- `run_scraper.ps1` - PowerShell convenience script
- `db/add_dining_courts.sql` - Migration file

### New
- `test_scraper.py` - Testing utility
- `SCRAPER_INTEGRATION.md` - This file

## Success Criteria ✅

- [x] Users can select a dining court
- [x] Foods filter by selected dining court
- [x] Station information displays with each food
- [x] Admin can trigger scraping from web UI
- [x] Scraper fetches from Purdue's official API
- [x] Duplicate prevention works
- [x] All 5 dining courts supported
- [x] Command-line scraping works
- [x] Database schema updated

## Ready to Use! 🚀

Your BoilerFuel app is now fully integrated with Purdue dining menus. Users can:
1. Choose their dining court
2. See what's actually being served
3. Track accurate nutrition from real menu items
4. Know which station serves each food

Admins can keep menus fresh by clicking "Scrape Purdue Menus" whenever needed!
