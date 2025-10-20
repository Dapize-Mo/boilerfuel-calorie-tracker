# Async Scraper Fix

## Problem
The menu scraper was timing out in production because:
1. Many platforms have a **30-second timeout** for HTTP requests (platform limitation)
2. Scraping all 5 dining courts takes **30-60 seconds** total
3. Even with increased gunicorn timeout, platform timeouts often take precedence

## Solution
Made the scraper **asynchronous** using background threading:

### Backend Changes (`backend/app.py`)

1. **New `/api/scrape-menus` endpoint** - Starts scraping in background thread, returns immediately (HTTP 202)
2. **New `/api/scrape-status` endpoint** - Check scraping progress/results
3. **New `/api/scrape-menus-sync` endpoint** - Original blocking version (backup)

### How It Works

1. User clicks "Scrape Purdue Menus"
2. Frontend calls `/api/scrape-menus` (returns immediately with "started" message)
3. Backend starts scraping in a background thread
4. Frontend polls `/api/scrape-status` every 2 seconds
5. When complete, frontend shows results and reloads food list

### Additional Optimizations

- Removed rate limiting delays (scraper now runs faster)
- Increased gunicorn timeout to 120s (`backend/Procfile`)
- Reduced sleep from 0.5s to 0s (no delays between nutrition fetches)

## Usage

### Start Scraping
```bash
POST /api/scrape-menus
Authorization: Bearer <admin_token>

Response (HTTP 202):
{
  "message": "Scraping started in background. Check /api/scrape-status for progress."
}
```

### Check Status
```bash
GET /api/scrape-status
Authorization: Bearer <admin_token>

Responses:
- In Progress: { "status": "in_progress", "message": "..." }
- Complete: { "status": "complete", "message": "...", "items_added": X, ... }
- Error: { "status": "error", "error": "..." }
- Idle: { "status": "idle", "message": "..." }
```

## Benefits

✅ No more timeouts - scraping runs as long as needed
✅ Immediate user feedback - button click returns instantly
✅ Real-time progress - frontend polls for updates
✅ Works within typical 30s HTTP timeout limits
✅ Faster scraping - removed unnecessary delays

## Files Modified

- `backend/app.py` - Added async scraping with threading
- `backend/Procfile` - Increased timeout to 120s
- `scraper/menu_scraper.py` - Removed sleep delays
- `frontend/pages/admin.jsx` - Added status polling

## Testing

1. Deploy to production
2. Log into admin panel
3. Click "Scrape Purdue Menus"
4. Should see "Scraping in progress..." message
5. After ~30-60 seconds, should show success with item counts
6. Food list should automatically refresh with new items
