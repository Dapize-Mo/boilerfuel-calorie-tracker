# Initialize Railway Database

This guide shows you how to set up the database tables on Railway.

## Option 1: Using Railway CLI (Recommended)

### Install Railway CLI

```powershell
# Install Railway CLI
iwr https://railway.app/install.ps1 | iex
```

### Login and Initialize Database

```powershell
# Login to Railway
railway login

# Link to your project
railway link

# Run the initialization script
railway run psql $DATABASE_URL -f db/init_railway.sql
```

## Option 2: Using psql Directly

If you have PostgreSQL installed locally:

```powershell
# Get your DATABASE_URL from Railway dashboard
# It looks like: postgresql://postgres:password@hostname.railway.app:5432/railway

# Run the init script
psql "your-database-url-here" -f db/init_railway.sql
```

## Option 3: Using Railway Web Console

1. Go to your Railway project dashboard
2. Click on your Postgres service
3. Click "Data" tab
4. Click "Query" or open the query console
5. Copy and paste the contents of `db/init_railway.sql`
6. Click "Run" or "Execute"

## Option 4: Using Python Script

```powershell
cd backend
python init_railway_db.py
```

## Verify Tables Created

After running the initialization, verify with:

```powershell
railway run psql $DATABASE_URL -c "\dt"
```

You should see:
- `foods` table
- `activities` table

## Check Data

```powershell
# Check foods
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM foods;"

# Check activities
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM activities;"
```

Expected results:
- 10 foods
- 8 activities

## Troubleshooting

### "railway: command not found"

Install the Railway CLI first using the command above.

### "No project linked"

Run `railway link` and select your project.

### Permission denied

Make sure you're logged in with `railway login`.

### SSL/TLS issues

Your Railway DATABASE_URL should include `?sslmode=require` at the end.
