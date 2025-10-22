# Auto-Update Meals Script

This script automatically scrapes all dining courts and updates the database with all available meals, including meal times (Breakfast, Lunch, Late Lunch, Dinner).

## Usage

### Local Development

1. Make sure your virtual environment is activated:
   ```powershell
   .venv\Scripts\Activate.ps1
   ```

2. Set your DATABASE_URL environment variable (if not already set):
   ```powershell
   $env:DATABASE_URL="your-database-url-here"
   ```

3. Run the script:
   ```powershell
   python auto_update_meals.py
   ```

### Scheduled Execution

You can set up this script to run automatically:

#### Windows Task Scheduler
1. Open Task Scheduler
2. Create a new task
3. Set the trigger (e.g., daily at midnight)
4. Set the action to run: `python C:\path\to\auto_update_meals.py`
5. Make sure to set the DATABASE_URL in the environment variables

#### Linux/macOS Cron
Add to your crontab:
```bash
0 0 * * * cd /path/to/project && /path/to/python auto_update_meals.py
```

## What It Does

1. **Scrapes all dining courts** using the Purdue API
2. **Extracts meal times** for each menu item (breakfast, lunch, late lunch, dinner)
3. **Saves to database** with smart updates:
   - Adds new menu items
   - Updates existing items that have no nutrition data
   - Skips duplicates
4. **Provides detailed output** showing what was scraped and saved

## Output

The script will show:
- Total items scraped
- Breakdown by meal time
- Number of items added, updated, and skipped
- Any errors encountered

## Notes

- The scraper uses the Purdue Dining API for reliable data
- Nutrition data is cached to reduce API calls
- Meal times are normalized (lowercase) for consistency
- The script is safe to run multiple times - it won't create duplicates
