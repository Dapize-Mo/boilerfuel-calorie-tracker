# Quick Credential Rotation Guide

## 🚨 DO THIS NOW!

Your PostgreSQL credentials were exposed. Follow these steps immediately:

---

## Step 1: Rotate Railway Database Credentials

### Go to Railway Dashboard

1. Open: https://railway.app/dashboard
2. Select project: **boilerfuel-calorie-tracker**
3. Click on your **PostgreSQL** service

### Option A: Create New Database (Safest)

1. Click "Settings" tab on PostgreSQL service
2. Scroll to bottom → Click "Delete Service"
3. Confirm deletion
4. Click "New" → "Database" → "Add PostgreSQL"
5. Copy the new `DATABASE_URL` from Variables tab
6. Update all services that use the database

### Option B: Change Password

If Railway provides password rotation:
1. Look for "Reset Credentials" or "Generate New Credentials"
2. Copy the new `DATABASE_URL`
3. Update all services

---

## Step 2: Update Environment Variables in Railway

### For Your Backend Service:

1. Click on your **backend/app** service in Railway
2. Go to "Variables" tab
3. Update these variables with new values:
   - `DATABASE_URL` → Your new PostgreSQL URL
   - `JWT_SECRET_KEY` → Generate new: `python -c "import secrets; print(secrets.token_hex(32))"`
4. Click "Deploy" to restart with new credentials

---

## Step 3: Update Local Development Environment

### Create Local .env File

```powershell
cd backend
cp .env.example .env
```

### Edit backend/.env

Replace with your NEW credentials:
```
DATABASE_URL=postgresql://postgres:NEW_PASSWORD@shortline.proxy.rlwy.net:43527/railway
JWT_SECRET_KEY=your-new-secret-key-here
```

### If Using start.bat

```powershell
cd backend
cp start.bat.example start.bat
```

Edit `backend/start.bat` with your new credentials.

---

## Step 4: Test the Changes

### Test Railway Deployment

1. Go to your Railway app URL
2. Try to log in / access the app
3. Check Railway logs for any database connection errors

### Test Local Development

```powershell
cd backend
python app.py
```

Visit: http://localhost:5000

---

## Step 5: Verify Old Credentials Are Dead

Try connecting with the OLD credentials to verify they no longer work:

```powershell
# This should FAIL
psql "postgresql://postgres:REDACTED_PASSWORD@shortline.proxy.rlwy.net:43527/railway"
```

If it still works, the old credentials are still active! Go back to Step 1.

---

## ✅ Verification Checklist

- [ ] New PostgreSQL database created OR password changed in Railway
- [ ] Railway backend service updated with new `DATABASE_URL`
- [ ] Railway backend service updated with new `JWT_SECRET_KEY`
- [ ] Railway backend service redeployed successfully
- [ ] Local `backend/.env` updated with new credentials
- [ ] Local app tested and working
- [ ] Old credentials verified as inactive

---

## 🆘 Need Help?

- **Railway Support**: https://railway.app/help
- **Railway Docs**: https://docs.railway.app/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

**Time Sensitive:** Complete this within 24 hours!
