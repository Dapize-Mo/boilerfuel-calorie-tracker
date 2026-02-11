# Deployment Guide

Guide for deploying BoilerFuel to production across different platforms.

## Quickstart: Free Stack (Recommended)

**Total cost**: $0-10/month
**Setup time**: 15 minutes

### 1. Create Free PostgreSQL

**Option A: Neon.tech**
- Go to https://neon.tech
- Sign up with GitHub
- Create project → Copy connection string
- Add to environment variables

**Option B: Supabase**
- Go to https://supabase.com
- Create project
- Settings → Database → Copy connection string
- Add to environment variables

### 2. Deploy Frontend to Vercel

```bash
# 1. Push to GitHub
git push origin main

# 2. Go to https://vercel.com
# 3. Import project from GitHub
# 4. Add environment variables:
#    NEXT_PUBLIC_API_URL = https://api.yourdomain.com
# 5. Click Deploy!
```

### 3. Configure Backend

**Option A: Deploy backend to Vercel (Recommended)**
- Uses serverless API routes in `frontend/pages/api/`
- No additional infrastructure needed
- Set environment variables in Vercel Settings:
  - `DATABASE_URL`
  - `JWT_SECRET_KEY`
  - `ADMIN_PASSWORD`
  - `FRONTEND_ORIGIN`

**Option B: Deploy to Railway**
```bash
# 1. Sign up at railway.app with GitHub
# 2. New Project → From Repo
# 3. Select this repository
# 4. Add PostgreSQL plugin
# 5. Set environment variables (copy from Railway Postgres plugin)
# 6. Deploy!
```

### 4. Enable Scheduled Menu Scraping

```bash
# 1. Go to GitHub repo → Settings → Secrets and variables → Actions
# 2. New repository secret:
#    Name: DATABASE_URL
#    Value: [paste PostgreSQL connection string]
# 3. Workflow runs automatically daily at 2 AM UTC
```

**Done!** Your app is now live. 🎉

---

## Traditional Deployment

### Heroku (No Free Tier in 2024)

```bash
# Create app
heroku create your-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:standard-0

# Set environment variables
heroku config:set JWT_SECRET_KEY=your-secret
heroku config:set ADMIN_PASSWORD=your-password

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Docker Deployment

**Build image:**
```bash
docker build -t boilerfuel .
docker run -p 5000:5000 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET_KEY=... \
  boilerfuel
```

**Docker Compose (local development):**
```bash
docker-compose up
# Includes PostgreSQL, Flask backend, Next.js frontend
```

---

## Environment Variables Reference

### Backend (.env or platform secrets)

```env
# Database Connection
DATABASE_URL=postgresql://user:password@host:5432/boilerfuel
# or discrete components:
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=boilerfuel_user
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=boilerfuel

# Security
JWT_SECRET_KEY=your-very-secret-key-change-in-production
ADMIN_PASSWORD=your-admin-password-change-this

# CORS (define allowed origins)
FRONTEND_ORIGIN=https://yourdomain.com
# Multiple origins: https://yourdomain.com,https://preview.yourdomain.com

# Database SSL (set for production)
DATABASE_SSLMODE=require
```

### Frontend (.env.local or platform secrets)

```env
# API endpoint
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
# Local dev: http://127.0.0.1:5000
```

---

## Production Checklist

- [ ] **Database**: Automatic backups enabled
- [ ] **Secrets**: All environment variables set (never in code)
- [ ] **CORS**: Frontend origin configured correctly
- [ ] **JWT**: Strong secret key (32+ characters, random)
- [ ] **Admin Password**: Changed from default
- [ ] **SSL/TLS**: HTTPS enforced (automatic on Vercel)
- [ ] **Monitoring**: Error tracking enabled (Sentry recommended)
- [ ] **Logging**: Structured logs configured
- [ ] **Backups**: Database backup strategy in place
- [ ] **Testing**: All tests pass locally
- [ ] **Docs**: README and API docs up-to-date

---

## Monitoring & Support

### Application Health

**Health checks:**
```bash
curl https://yourdomain.com/health
# Returns: { "status": "ok" }

curl https://yourdomain.com/ready
# Returns: { "app": "ok", "db": "ok" }
```

### Error Tracking

**Setup Sentry (optional but recommended):**

1. Sign up at sentry.io
2. Create project
3. Install SDK:
   ```bash
   pip install sentry-sdk
   npm install @sentry/react
   ```
4. Configure in app:
   ```python
   import sentry_sdk
   sentry_sdk.init("your-sentry-dsn")
   ```

### Logs

- **Vercel**: Logs visible in dashboard
- **Railway**: Real-time logs in dashboard
- **Heroku**: `heroku logs --tail`
- **Docker**: `docker logs -f container_id`

---

## Troubleshooting Deployments

### Database Connection Failed

```
Error: could not connect to server
```

**Check:**
1. DATABASE_URL format: `postgresql://user:pass@host:port/db`
2. Network access (firewall rules, IP whitelist)
3. Database credentials correct
4. Database exists and is running

### API Returns 502 Bad Gateway

Usually means backend crashed:
1. Check logs for errors
2. Verify environment variables set
3. Ensure database is accessible
4. Restart application

### Static assets not loading

Check `NEXT_PUBLIC_API_URL` - should NOT be set for static assets. Only for API calls.

### Scraper fails silently

```bash
# Test manually
python tools/maintenance/auto_sync_menus.py --days 1

# Check GitHub Actions logs
# Settings → Actions → Most recent run
```

---

## Scaling

### When to Scale Up

- **Database**: > 80% CPU or memory → upgrade to larger tier
- **Backend**: API response time > 2 seconds → add caching layer
- **Frontend**: Lighthouse score < 85 → optimize bundle size

### Scaling Options

1. **Increase DB resources** (Neon/Supabase upsell)
2. **Add Redis cache** (quick win for menu lookups)
3. **Migrate to traditional VPS** (better control, higher cost)
4. **Implement CDN** (faster static asset delivery)

---

## Rollback Procedure

**If deployment breaks:**

1. **Frontend (Vercel)**:
   - Settings → Deployments → Select previous working version
   - Click "Promote to Production"

2. **Backend (Railway/Heroku)**:
   - View previous deploys
   - Trigger redeploy from last known-good commit

3. **Database**:
   - Restore from latest backup (1-day old typical)
   - Neon/Supabase: Recover to specific point-in-time

---

## Cost Optimization

### Free Resources Used
- Vercel (free frontended + serverless functions)
- Neon (0.5GB free database)
- GitHub Actions (free tier for public repos)
- Supabase (1GB free database)

### Typical Progression
- **Startup**: $0-5/month (free tiers)
- **Growing**: $10-50/month (upsize database + API calls)
- **Established**: $100+/month (dedicated servers, pro tools)

### Cost-Saving Tips
1. **Cache heavily** (reduce database queries)
2. **Compress assets** (reduce bandwidth)
3. **Use free tiers** as long as possible
4. **Monitor usage** (alert on unexpected spikes)
5. **Choose simple architecture** (fewer moving parts = lower cost)

---

## Support

Need help?

1. Check [docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Search GitHub Issues
3. Ask in GitHub Discussions
4. File an issue with error logs

---

**Last Updated**: February 2025
