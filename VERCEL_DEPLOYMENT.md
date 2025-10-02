# Vercel Deployment Guide

This guide walks you through deploying the BoilerFuel Calorie Tracker frontend to Vercel.

## Prerequisites

- A [Vercel account](https://vercel.com/signup) (free tier works fine)
- Your backend API already deployed and accessible via HTTPS
- Git repository pushed to GitHub, GitLab, or Bitbucket

## Step 1: Install Vercel CLI (Optional)

You can deploy via the Vercel dashboard or use the CLI:

```powershell
npm install -g vercel
```

## Step 2: Deploy via Vercel Dashboard

### Option A: Import from Git (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Project"
3. Select your Git provider and repository
4. Configure the project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

5. Add Environment Variables:
   - Click "Environment Variables"
   - Add the following:
     - **Name:** `NEXT_PUBLIC_API_URL`
     - **Value:** Your backend API URL (e.g., `https://your-backend.railway.app`)
     - **Environments:** Production, Preview, Development (check all)
   
   - (Optional) Add `NEXT_PUBLIC_BYPASS_AUTH`:
     - **Name:** `NEXT_PUBLIC_BYPASS_AUTH`
     - **Value:** `false`
     - **Environments:** Production, Preview, Development

6. Click "Deploy"

### Option B: Deploy via CLI

1. Navigate to the project root:
   ```powershell
   cd "c:\Users\dolan\Code\Web 5\boilerfuel-calorie-tracker"
   ```

2. Run the Vercel CLI:
   ```powershell
   vercel
   ```

3. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name? `boilerfuel-calorie-tracker` (or your preference)
   - In which directory is your code located? `./frontend`
   - Want to override the settings? **N**

4. Add environment variables:
   ```powershell
   vercel env add NEXT_PUBLIC_API_URL
   ```
   - Enter the value: Your backend API URL (e.g., `https://your-backend.railway.app`)
   - Select environments: Production, Preview, Development (use arrow keys and space to select)

5. Deploy to production:
   ```powershell
   vercel --prod
   ```

## Step 3: Configure Backend CORS

Update your backend to allow requests from your Vercel domain:

1. Edit `backend/.env` or your production environment variables:
   ```
   FRONTEND_ORIGIN=https://your-app.vercel.app
   ```

2. If you have multiple domains (production + preview), update your backend CORS configuration in `backend/app.py` to allow multiple origins.

## Step 4: Test the Deployment

1. Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Verify that the frontend loads correctly
3. Test API connectivity:
   - Browse the food catalog on the homepage
   - Try logging meals on the dashboard
   - Check that data loads from your backend

## Automatic Deployments

Vercel automatically deploys:
- **Production:** When you push to your main/master branch
- **Preview:** When you push to any other branch or open a pull request

## Custom Domain (Optional)

1. Go to your project settings on Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Troubleshooting

### Build fails with "Command not found"

Make sure your `vercel.json` has the correct root directory set to `frontend`.

### API calls fail with CORS errors

1. Check that `NEXT_PUBLIC_API_URL` is set correctly in Vercel environment variables
2. Verify your backend's `FRONTEND_ORIGIN` includes your Vercel domain
3. Ensure your backend CORS configuration allows your Vercel domain

### Environment variables not updating

After changing environment variables in Vercel:
1. Go to the Deployments tab
2. Click the three dots on the latest deployment
3. Select "Redeploy"

### Pages show 404 errors

Ensure the build completed successfully and the output directory is set to `.next`.

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Environment Variables in Vercel](https://vercel.com/docs/concepts/projects/environment-variables)

## Quick Commands

```powershell
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployment logs
vercel logs

# List environment variables
vercel env ls

# Pull environment variables to local
vercel env pull
```
