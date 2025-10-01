# Security Notice

## Credential Rotation Required

**IMPORTANT:** On October 1st, 2025, PostgreSQL database credentials were accidentally exposed in the Git history.

### Immediate Actions Required:

1. **Rotate the exposed Railway PostgreSQL database credentials**
   - Go to your Railway dashboard
   - Navigate to your PostgreSQL service
   - Generate new credentials or create a new database instance
   - Update the `DATABASE_URL` in your Railway environment variables

2. **Rotate JWT Secret Key**
   - Generate a new secret: `python -c "import secrets; print(secrets.token_hex(32))"`
   - Update it in your Railway environment variables

3. **Update local `.env` file**
   - Copy `backend/.env.example` to `backend/.env`
   - Add your new credentials (this file is gitignored and won't be committed)

### Files Fixed:
- `backend/.env` - Removed exposed credentials (this file should never be committed)
- `backend/start.bat` - Removed exposed credentials (now gitignored)
- `.gitignore` - Added `*.bat` to prevent future commits of batch files with credentials

### Prevention:
- The `.gitignore` file now includes:
  - `.env*` (all environment files)
  - `backend/.env` (explicitly)
  - `*.bat` (batch files that might contain credentials)
  
- Use `.env.example` or `start.bat.example` as templates
- Never commit files containing real credentials

### For Contributors:
Always check that your credentials are in `.gitignore` before committing. Use environment variables or `.env` files for sensitive data.
