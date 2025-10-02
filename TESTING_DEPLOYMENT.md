# Testing Branch Deployment Guide

## Overview
You now have two branches:
- **`master`** - Production branch (stable, public-facing)
- **`testing`** - Testing branch (for new features and experiments)

## Deployment Setup

### Option 1: Vercel (Recommended)

Vercel automatically creates preview deployments for all branches. Here's how to set it up:

1. **Go to your Vercel Dashboard**
   - Navigate to your project: `boilerfuel-calorie-tracker`

2. **Production Deployment (master branch)**
   - Your main domain will automatically deploy from `master`
   - Example: `boilerfuel-calorie-tracker.vercel.app`

3. **Testing Deployment (testing branch)**
   - Vercel automatically creates a deployment for each branch
   - Your testing branch will be available at: `boilerfuel-calorie-tracker-git-testing-your-username.vercel.app`
   - Find the exact URL in your Vercel dashboard under "Deployments"

4. **Configure Branch Settings** (Optional)
   - Go to Project Settings → Git
   - Set Production Branch: `master`
   - Enable "Automatic Deployments" for all branches
   - Each push to `testing` will auto-deploy to the testing URL

### Option 2: Railway (If using Railway)

1. **Create a Second Service for Testing**
   - In Railway dashboard, create a new service
   - Connect to the same GitHub repo
   - Set the branch to `testing` instead of `master`
   - Use the same environment variables and database

2. **Or Use Railway Environments**
   - Create a new environment called "Testing"
   - Set it to deploy from the `testing` branch
   - Production environment stays on `master`

## Workflow

### Making Changes to Testing

```powershell
# Switch to testing branch
git checkout testing

# Make your changes to files
# ...

# Commit and push
git add .
git commit -m "Your change description"
git push origin testing
```

The testing site will automatically update in a few minutes.

### When Testing is Ready, Merge to Production

```powershell
# Switch to master
git checkout master

# Merge testing into master
git merge testing

# Push to production
git push origin master
```

### Keeping Testing Up-to-Date with Master

```powershell
# Switch to testing
git checkout testing

# Pull latest from master
git merge master

# Push updated testing branch
git push origin testing
```

## Current Changes in Testing Branch

✅ **Grouped Menu Display**
- Foods are now organized by station (LA FONDA, ROMEO & PARMESAN, CLASSIC FLAVORS, etc.)
- Each station has its own card with a header
- Quick "+" button next to each food item to add 1 serving instantly
- No more dropdown menus - just click to add!

## Quick Reference

| Branch | Purpose | Deploy On Push |
|--------|---------|----------------|
| `master` | Production (stable) | ✅ Auto-deploy |
| `testing` | New features/testing | ✅ Auto-deploy |

## URLs

After deployment, you'll have:
- **Production**: Your main Vercel URL (from master)
- **Testing**: Your testing branch URL (from testing)

Both will use the same database, so data is shared. The only difference is the UI/features being tested.

## Tips

1. **Always test on the testing branch first** before merging to master
2. **Keep testing branch in sync** with master regularly to avoid conflicts
3. **Use descriptive commit messages** so you know what changes are where
4. **Share the testing URL** with team members for feedback before going live
5. **Monitor both deployments** in your hosting dashboard

## Troubleshooting

**If testing deployment isn't showing up:**
- Check your hosting dashboard (Vercel/Railway) for deployment logs
- Ensure branch deployments are enabled in project settings
- Verify the branch was pushed: `git branch -a`

**If you see merge conflicts:**
```powershell
# On testing branch
git checkout testing
git merge master

# Fix conflicts in files
git add .
git commit -m "Resolve merge conflicts"
git push origin testing
```
