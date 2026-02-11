# Menu Accuracy Fix - Summary

## Problem Identified  
Menu verification showed mismatches between the Purdue Dining API and the database:

### Original Issues (2026-02-11)
- **Earhart**: Missing 1 item - "Mango Habanero Sauce (lunch / Heartland Classics)"
- **Ford**: 
  - Missing 2 items - "Mango Chunks" (breakfast & lunch / Salads)
  - Extra 2 items - "Tropical Fruit Mix" (breakfast & lunch / Salads)

**Total**: 6 missing, 4 extra items across all locations

## Root Cause
The database contained stale menu data that didn't reflect recent changes in the Purdue Dining menus. The `next_available` schedule for food items wasn't being kept in sync with actual API data.

## Solution Implemented

### 1. Created Diagnostic Tools
- **`debug_menu_mismatch.py`** - Identifies mismatches between API and database
- **`fix_targeted_mismatches.py`** - Fixes specific identified issues
- **`remove_stale_tropical.py`** - Removes outdated schedule entries

### 2. Created Automated Sync Tool
- **`auto_sync_menus.py`** - Daily sync script that:
  - Compares API data with database schedules
  - Adds missing items to schedules
  - Removes items from dates when they're no longer served
  - Runs quickly without full nutrition fetch (enrichment done by main scraper)

### 3. Fixed All Mismatches
All 12 dining locations now show **100% accuracy** for 2026-02-11:
```
✓ Earhart           - 147/147 items match
✓ Ford              - 111/111 items match
✓ Hillenbrand       - 136/136 items match
✓ Wiley             - 86/86 items match
✓ Windsor           - 114/114 items match
✓ All other locations - 100% match
```

## Recommendations

### Daily Maintenance
Run the auto-sync script daily to keep schedules accurate:
```powershell
python auto_sync_menus.py --days 7
```

This script:
- Runs in ~30 seconds
- Only updates schedules (no heavy nutrition fetching)
- Shows exact changes made
- Safe to run multiple times per day

### Weekly Full Scrape
Run the full scraper weekly to enrich nutrition data:
```powershell
python -m scraper.menu_scraper --days 7
```

This takes longer (~5-10 minutes) but fetches complete nutrition info.

### Verification
Check menu accuracy anytime:
```powershell
python debug_menu_mismatch.py
```

Or use the admin panel's "Menu Accuracy" tab and click "Run Comparison".

## Files Created

1. **`auto_sync_menus.py`** - Main sync tool (recommended for daily use)
2. **`debug_menu_mismatch.py`** - Diagnostic tool
3. **`fix_targeted_mismatches.py`** - Targeted fix tool
4. **`remove_stale_tropical.py`** - Cleanup utility

## Technical Details

### How Matching Works
Items are matched using a composite key:
- Normalized name (lowercase, alphanumeric only)
- Normalized meal time (breakfast/lunch/dinner/late lunch)
- Normalized station name

Example:
- "Mango Chunks" at "Salads" for "lunch" → `mango chunks|lunch|salads`

### Database Structure
- `foods` table contains all food items
- `next_available` JSONB column stores appearance schedule:
  ```json
  [
    {"date": "2026-02-11", "day_name": "Wednesday", "meal_time": "lunch"},
    {"date": "2026-02-12", "day_name": "Thursday", "meal_time": "lunch"}
  ]
  ```

### Comparison Logic
The verification system (in `/api/admin/menu-compare`):
1. For each date in range, fetches API menu
2. Queries `foods` where `next_available` contains that date
3. Builds keys and compares sets
4. Reports missing (in API, not DB) and extra (in DB, not API) items

## Prevention

To prevent future mismatches:

1. **Schedule daily sync** (GitHub Actions, cron, or task scheduler):
   ```yaml
   # Example GitHub Action
   - name: Sync Menus
     run: python auto_sync_menus.py --days 7
   ```

2. **Monitor accuracy dashboard** regularly via admin panel

3. **Run full scraper** weekly to refresh nutrition data

## Status
✅ All menu mismatches resolved
✅ Automated sync tool created
✅ 100% accuracy achieved for all locations
