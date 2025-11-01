# Vercel Deployment Guide for Google OAuth

Your code has been pushed to GitHub! Follow these steps to deploy to Vercel and configure Google OAuth authorization.

## Step 1: Deploy to Vercel

### Option A: Using Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account

2. Click **"Add New..."** → **"Project"**

3. Import your repository:
   - Find **"Dapize-Mo/boilerfuel-calorie-tracker"**
   - Click **"Import"**

4. Configure your project:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - Click **"Deploy"**

5. Wait for the initial deployment to complete
   - You'll get a URL like: `https://boilerfuel-calorie-tracker.vercel.app`
   - **Save this URL** - you'll need it for Google OAuth setup

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - What's your project's name? boilerfuel-calorie-tracker
# - In which directory is your code located? ./
# - Want to override settings? No

# Deploy to production
vercel --prod
```

## Step 2: Add Environment Variables in Vercel

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**

2. Add the following variables (one at a time):

### Required Variables:

| Variable Name | Value |
|---------------|-------|
| `GOOGLE_CLIENT_ID` | Your Google Client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Your Google Client Secret from Google Cloud Console |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-deployment-url.vercel.app` |
| `NEXT_PUBLIC_API_URL` | Your backend API URL (if different from local) |

**Important**:
- For each variable, select **"Production"**, **"Preview"**, and **"Development"**
- Replace `your-deployment-url.vercel.app` with your actual Vercel URL

3. Click **"Save"** for each variable

## Step 3: Update Google OAuth Authorized Redirect URIs

This is the **critical step** for authorization!

1. Go to [Google Cloud Console](https://console.cloud.google.com/)

2. Navigate to **"APIs & Services"** → **"Credentials"**

3. Click on your OAuth 2.0 Client ID (the one ending in `.apps.googleusercontent.com`)

4. Under **"Authorized redirect URIs"**, click **"+ ADD URI"** and add:

   ```
   https://your-deployment-url.vercel.app/api/auth/callback/google
   ```

   **Example**:
   ```
   https://boilerfuel-calorie-tracker.vercel.app/api/auth/callback/google
   ```

5. Keep your localhost URI for development:
   ```
   http://localhost:3000/api/auth/callback/google
   ```

6. Under **"Authorized JavaScript origins"**, add:
   ```
   https://your-deployment-url.vercel.app
   ```

7. Click **"Save"**

**Important Notes**:
- The redirect URI **must match exactly** (including https://, no trailing slash)
- Changes may take a few minutes to propagate
- Make sure you're using `https://` for production, not `http://`

## Step 4: Redeploy Your Application

After adding environment variables:

1. In Vercel Dashboard:
   - Go to **"Deployments"**
   - Click the **"⋯"** menu on the latest deployment
   - Click **"Redeploy"**
   - Or simply push a new commit to trigger redeployment

2. Or via CLI:
   ```bash
   vercel --prod
   ```

## Step 5: Test Your Deployment

1. Visit your Vercel URL: `https://your-deployment-url.vercel.app`

2. Navigate to the admin page: `https://your-deployment-url.vercel.app/admin`

3. Click **"Sign in with Google"**

4. You should be redirected to Google's sign-in page

5. After signing in, you should be redirected back to your admin panel

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Cause**: The redirect URI in Google Cloud Console doesn't match your Vercel URL

**Solution**:
1. Check the error message for the actual redirect URI being used
2. Copy that exact URI
3. Add it to Google Cloud Console under "Authorized redirect URIs"
4. Make sure there are no typos, extra spaces, or trailing slashes

### Error: "invalid_client"

**Cause**: Environment variables not set correctly in Vercel

**Solution**:
1. Go to Vercel → Settings → Environment Variables
2. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
3. Make sure they're applied to Production, Preview, and Development
4. Redeploy after fixing

### Error: "NEXTAUTH_URL environment variable is not set"

**Cause**: Missing NEXTAUTH_URL in Vercel environment variables

**Solution**:
1. Add `NEXTAUTH_URL` with your Vercel URL
2. Make sure it starts with `https://` (not `http://`)
3. Redeploy

### Sign-in works locally but not on Vercel

**Checklist**:
- [ ] Environment variables are set in Vercel (not just .env.local)
- [ ] NEXTAUTH_URL points to your Vercel domain
- [ ] Google OAuth redirect URI includes your Vercel domain
- [ ] You redeployed after adding environment variables

## Advanced: Custom Domain

If you want to use a custom domain:

1. Add the domain in Vercel:
   - Settings → Domains → Add domain

2. Update environment variables:
   - Change `NEXTAUTH_URL` to `https://yourdomain.com`

3. Update Google OAuth:
   - Add `https://yourdomain.com/api/auth/callback/google` to authorized redirect URIs

4. Redeploy

## Backend Deployment (Optional)

If you need to deploy your Flask backend:

### Option 1: Railway.app
1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your backend directory
4. Add environment variables (DATABASE_URL, JWT_SECRET_KEY, etc.)

### Option 2: Render.com
1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect your GitHub repo
4. Set root directory to `backend`
5. Add environment variables

### Option 3: Heroku
```bash
heroku create your-backend-name
heroku config:set JWT_SECRET_KEY=your-secret
heroku config:set ADMIN_PASSWORD=your-password
git subtree push --prefix backend heroku master
```

After deploying backend, update `NEXT_PUBLIC_API_URL` in Vercel to point to your backend URL.

## Security Checklist

Before going live:

- [ ] All environment variables are set in Vercel
- [ ] NEXTAUTH_SECRET is a strong random string
- [ ] Google OAuth redirect URIs only include your domains
- [ ] Remove any test/debug console.logs
- [ ] HTTPS is enabled (Vercel does this automatically)
- [ ] Backend API has CORS configured for your Vercel domain

## Need Help?

If you encounter issues:

1. Check Vercel deployment logs:
   - Go to your project → Deployments → Click on deployment → View Function Logs

2. Check browser console for errors (F12)

3. Verify environment variables in Vercel dashboard

4. Test Google OAuth locally first to ensure it works

## Quick Reference

**Your Current Setup**:
- GitHub Repo: `Dapize-Mo/boilerfuel-calorie-tracker`
- Frontend Directory: `frontend`
- Backend Directory: `backend`

**What needs to be added in Google Cloud Console**:
- Authorized redirect URI: `https://YOUR-VERCEL-URL.vercel.app/api/auth/callback/google`
- Authorized JavaScript origin: `https://YOUR-VERCEL-URL.vercel.app`

**Replace `YOUR-VERCEL-URL` with your actual Vercel deployment URL!**
