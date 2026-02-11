# Tools Directory

This directory contains utility scripts and tools for maintaining and managing the BoilerFuel application.

## Directory Structure

### `maintenance/`
Scripts for ongoing maintenance and data synchronization:
- **`auto_sync_menus.py`** - Lightweight daily menu synchronization
- **`auto_update_meals.py`** - Update meal information in the database
- **`verify_menus.py`** - Verify menu accuracy against source data

### `migrations/`
Database migration scripts:
- **`migrate_db.py`** - Database migration utility

### `scripts/`
Platform-specific helper scripts:
- **PowerShell scripts** (`.ps1`) - Windows automation helpers
- **Batch files** (`.bat`) - Windows command scripts
- Includes: `add_meal_time.ps1`, `add_next_available.ps1`, `run_scraper.ps1`, `daily_sync.ps1`, etc.

### `analysis/`
Analysis and diagnostic tools:
- **`count-tokens.js`** - Token counting utility for API usage analysis

## Usage

### Running Maintenance Scripts

Example - Daily menu sync:
```powershell
python tools/maintenance/auto_sync_menus.py --days 7
```

Example - Verify menu accuracy:
```powershell
python tools/maintenance/verify_menus.py
```

### Running Migrations

```powershell
python tools/migrations/migrate_db.py
```

### Using Helper Scripts

Windows (PowerShell):
```powershell
.\tools\scripts\run_scraper.ps1
```

## Notes

- Most Python scripts require the virtual environment to be activated
- Ensure environment variables (DATABASE_URL, etc.) are set before running scripts
- Some scripts may require admin authentication
