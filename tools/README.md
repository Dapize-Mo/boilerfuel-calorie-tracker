# Tools Directory

This directory contains utility scripts for maintaining and managing the BoilerFuel application.

## Directory Structure

### `maintenance/`
Scripts for ongoing maintenance and data synchronization:
- **`auto_sync_menus.py`** - Lightweight menu synchronization; syncs upcoming dining court menus

## Usage

### Running Maintenance Scripts

Sync menus for the next N days (from repo root, with venv active):
```bash
python tools/maintenance/auto_sync_menus.py --days 7
```

Scraper hint in the troubleshooting docs:
```bash
python tools/maintenance/auto_sync_menus.py --days 1
```

## Notes

- Python scripts require the virtual environment to be activated (`backend/.venv`)
- `DATABASE_URL` must be set before running any script that writes to the database
- The main automated scrape is handled by `.github/workflows/scrape.yml` via `scripts/scrape_to_db.py`
