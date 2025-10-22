# Manual Database Test Instructions

Your backend deployment should be working now. Here's how to test it manually:

## Step 1: Find Your Backend URL

1. Go to your hosting provider dashboard (Render/Fly/Heroku/etc.)
2. Click on your backend service/project
3. Look for the public URL (e.g., `https://your-backend.example.com`)

## Step 2: Test Each Endpoint

### Test Health Check

Open in browser: `{YOUR_URL}/health`
Expected: `{"status": "ok"}`

### Test Database Connectivity

Open in browser: `{YOUR_URL}/ready`
Expected: `{"app": "ok", "db": "ok"}`

### Test Database Initialization

Open in browser: `{YOUR_URL}/init-db`
Expected: `{"message": "Database initialized successfully!", "foods_added": 5}`

### Test Get Foods

Open in browser: `{YOUR_URL}/api/foods`
Expected: Array of 5 food items with name, calories, and macros

## Step 3: Test with cURL (if you have it)

```bash
# Health check
curl {YOUR_URL}/health

# Ready check  
curl {YOUR_URL}/ready

# Initialize database
curl {YOUR_URL}/init-db

# Get foods
curl {YOUR_URL}/api/foods

# Add a new food
curl -X POST {YOUR_URL}/api/foods \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Food", "calories": 150, "macros": {"protein": 15, "carbs": 20, "fats": 3}}'
```

## What to Look For

✅ **Success**: All endpoints return JSON responses with appropriate data

❌ **Issues**:

- 500 errors = Server/database issues
- 404 errors = Wrong URL or deployment issues
- Connection timeouts = Backend deployment not running

## Troubleshooting

- If `/init-db` returns "already initialized", that's normal on subsequent calls
- If `/api/foods` returns `[]` (empty array), run `/init-db` first
- Check your hosting provider's logs for detailed error information

Replace `{YOUR_URL}` with your actual backend URL and test each endpoint!
