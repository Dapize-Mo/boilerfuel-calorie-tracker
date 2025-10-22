# Quick Branch Switching Guide

## View Your Deployments

**If using Vercel:**
1. Go to https://vercel.com/dashboard
2. Click on your `boilerfuel-calorie-tracker` project
3. You'll see two deployments:
   - **Production** (master branch) - Your main URL
   - **Preview** (testing branch) - Your testing URL (will have `-git-testing-` in the URL)

## Common Commands

### Switch to Testing Branch (Make Changes)
```powershell
git checkout testing
```

### Switch Back to Master (Stable Version)
```powershell
git checkout master
```

### Check Which Branch You're On
```powershell
git branch
```
(The one with * is your current branch)

### Push Your Testing Changes (Auto-Deploys)
```powershell
git add .
git commit -m "Describe your changes"
git push origin testing
```

### Merge Testing → Master (When Ready for Production)
```powershell
git checkout master
git merge testing
git push origin master
```

## Current Status

✅ **Testing Branch Created**: `testing`
✅ **Pushed to GitHub**: Yes
✅ **Changes Included**: Grouped menu display with station sections and quick add buttons

## Next Steps

1. **Find your testing URL**:
   - Go to your Vercel dashboard
   - Look for the deployment from the `testing` branch
   - Copy that URL and bookmark it

2. **Make more changes**:
   ```powershell
   git checkout testing
   # Edit files
   git add .
   git commit -m "Your change"
   git push origin testing
   # Wait ~2 minutes, then refresh your testing URL
   ```

3. **When satisfied, merge to production**:
   ```powershell
   git checkout master
   git merge testing
   git push origin master
   ```

## Tips

- 💡 Always work on `testing` branch for new features
- 💡 Only push to `master` when you're sure it works
- 💡 Vercel auto-deploys both branches - just wait ~2 minutes after pushing
- 💡 Both URLs use the same database, so data is shared
