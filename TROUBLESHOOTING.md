# Troubleshooting: Failed to Fetch Error

## Current Issues Detected:

### 1. Backend Returns 500 Error ⚠️
Your backend (e.g., `https://api.your-domain.com`) may be returning Internal Server Error (500).

**Fix:**
1. Go to your hosting dashboard → Your project → Logs
2. Check the Runtime Logs for error messages
3. Common causes:
   - Database connection issues (check `DATABASE_URL`)
   - Missing environment variables
   - Backend code errors

### 2. Vercel Environment Variable Missing ⚠️
The Vercel deployment needs the backend API URL set as an environment variable.

**Fix:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → Settings → Environment Variables
3. Add a new variable:
   - **Variable name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://api.your-domain.com` (your backend URL)
   - **Environments:** Check all (Production, Preview, Development)
4. Click "Save"
5. Go to Deployments tab → Click the latest deployment → Click "Redeploy"

### 3. CORS Configuration ⚠️
Backend needs to allow requests from your Vercel domain.

**Fix:**
1. Go to your hosting provider → Your backend service → Variables
2. Update or add:
   - **Variable name:** `FRONTEND_ORIGIN`
   - **Value:** `https://your-app.vercel.app` (your Vercel frontend URL)
3. Click "Deploy" to redeploy

## Quick Test Commands:

```powershell
# Test if backend is running
Invoke-WebRequest -Uri "https://api.your-domain.com/api/foods"

# Test if backend accepts requests from Vercel
Invoke-WebRequest -Uri "https://api.your-domain.com/api/foods" -Headers @{"Origin"="https://your-app.vercel.app"}
```

## Step-by-Step Fix:


### Step 1: Check Backend Logs

```text
1. Go to your hosting provider dashboard (Render/Fly/Heroku/etc.)
2. Select your backend service
3. Open the runtime logs
4. Look for error messages
```

Common errors to look for:

- `psycopg2.OperationalError` - Database connection failed
- `KeyError` - Missing environment variable
- `ModuleNotFoundError` - Missing Python package

### Step 2: Verify Backend Environment Variables

Ensure these are set in your backend environment:

- ✅ `DATABASE_URL` (e.g., from your managed Postgres)
- ✅ `DATABASE_SSLMODE=require` (if your provider requires SSL)
- ✅ `JWT_SECRET_KEY` (any secret string)
- ✅ `ADMIN_PASSWORD` (your admin password)
- ✅ `FRONTEND_ORIGIN=https://your-app.vercel.app` (your Vercel URL)

### Step 3: Set Vercel Environment Variable

1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `NEXT_PUBLIC_API_URL=https://api.your-domain.com` (your backend URL)
3. Redeploy

### Step 4: Test Your Live Site
Visit your Vercel deployment URL (e.g., `https://your-app.vercel.app`)

Open browser Developer Tools (F12) → Console tab
Look for errors like:

- `CORS error` - Backend CORS not configured
- `Failed to fetch` - Backend not responding
- `Network error` - Backend URL wrong

## Expected Flow

1. User visits Vercel site → Frontend loads ✅
2. Frontend requests data from backend → Backend responds with data ✅
3. Backend checks CORS origin → Allows Vercel domain ✅
4. Data displays on frontend ✅

## Current Status

- ❌ Backend returning 500 error
- ⚠️ Need to add environment variable to Vercel
- ⚠️ Verify FRONTEND_ORIGIN matches your Vercel URL

## Next Steps

1. Check backend logs (on your hosting provider)
2. Add environment variable to Vercel
3. Update FRONTEND_ORIGIN to match Vercel URL
4. Test again
