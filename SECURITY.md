# Security Notice

## ✅ Credential Exposure Incident - GIT HISTORY CLEANED

**IMPORTANT:** On October 1st, 2025, PostgreSQL database credentials were accidentally exposed in the Git history.

**Status:** ✅ Git history has been cleaned! All exposed credentials have been removed from all commits using git-filter-repo.

---

## 🚨 CRITICAL: Immediate Actions Required

### 1. Rotate Database Credentials (DO THIS FIRST!)

The exposed Railway PostgreSQL credentials are still active and must be changed immediately:

**Railway Dashboard Steps:**
1. Log into your Railway dashboard at https://railway.app
2. Navigate to your project: `boilerfuel-calorie-tracker`
3. Click on your PostgreSQL service
4. Go to the "Variables" tab
5. You have two options:

   **Option A: Reset Database Password (Recommended)**
   - Delete and recreate the PostgreSQL service
   - This generates completely new credentials
   - Update your services to use the new `DATABASE_URL`

   **Option B: Update Password Manually**
   - If Railway provides a reset password option, use it
   - Update the `DATABASE_URL` environment variable with new credentials

6. Restart all services that connect to the database

### 2. Rotate JWT Secret Key

Generate a new JWT secret:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Update it in:
- Railway environment variables (for production)
- Your local `backend/.env` file (for development)

### 3. Update Local Environment

After rotating credentials:
1. Copy the template: `cp backend/.env.example backend/.env`
2. Edit `backend/.env` with your new credentials
3. If using `start.bat`, copy `backend/start.bat.example` to `backend/start.bat` and update

---

## 📋 What Was Fixed

### Sanitized Files
- ✅ `backend/.env` - Removed exposed credentials (placeholder values only)
- ✅ `backend/start.bat` - Removed exposed credentials (placeholder values only)
- ✅ `.gitignore` - Updated to prevent future credential commits

### Added Protection
- ✅ Created `SECURITY.md` - This security documentation
- ✅ Created `backend/start.bat.example` - Safe template file
- ✅ Updated `.gitignore` to exclude `*.bat` files

### Git Status
- ✅ Sanitized commit pushed to GitHub
- ✅ **Git history cleaned with git-filter-repo on October 1st, 2025**
- ✅ **Force pushed to origin - all exposed credentials removed from history**

---

## ✅ Git History Successfully Cleaned

**Completed on October 1st, 2025**

The Git history has been completely cleaned using git-filter-repo. All exposed credentials have been replaced with `REDACTED_PASSWORD` in every commit.

### What Was Done:

1. ✅ Installed git-filter-repo: `pip install git-filter-repo`
2. ✅ Created replacements file with exposed password patterns
3. ✅ Ran git-filter-repo to rewrite all 31 commits
4. ✅ Verified credentials were removed from historical commits
5. ✅ Force-pushed cleaned history to GitHub

### Commands Used:

```powershell
# Install tool
pip install git-filter-repo

# Create replacement patterns
echo "TpWlYEnWWsDfRgDsObuOPLvWmwUQxThz==>REDACTED_PASSWORD" > replacements.txt

# Rewrite history
python -m git_filter_repo --replace-text replacements.txt --force

# Re-add remote and force push
git remote add origin https://github.com/Dapize-Mo/boilerfuel-calorie-tracker.git
git push origin master --force
```

### Verification:

You can verify the cleanup by checking any old commit:
```powershell
git show 0294657:backend/start.bat
# Shows: REDACTED_PASSWORD instead of real password
```

⚠️ **Note for Collaborators:** If others have cloned this repository, they need to re-clone it fresh as the history has been rewritten!

---

## 🛡️ Prevention Guidelines

### For All Contributors

**Before Committing:**
1. Never commit files with real credentials
2. Always use `.env.example` as a template
3. Check that sensitive files are in `.gitignore`
4. Run `git status` to verify what will be committed

**Files That Should NEVER Be Committed:**
- `backend/.env` (actual environment file)
- `backend/start.bat` (contains credentials)
- Any file with real API keys, passwords, or tokens

**Safe to Commit:**
- `backend/.env.example` (template with placeholders)
- `backend/start.bat.example` (template with placeholders)
- Configuration files without secrets

### Current `.gitignore` Protection

The repository now excludes:
- `.env*` - All environment files
- `backend/.env` - Explicitly excluded
- `*.bat` - All batch files (may contain credentials)
- `__pycache__/` - Python cache
- `node_modules/` - Node dependencies

---

## 📞 Questions?

If you need help rotating credentials or cleaning Git history, refer to:
- [Railway Documentation](https://docs.railway.app/)
- [Git Secrets Guide](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)

---

**Last Updated:** October 1st, 2025  
**Incident Status:** Sanitized (awaiting credential rotation and history cleanup)
