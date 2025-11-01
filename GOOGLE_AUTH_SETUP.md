# Google Authentication Setup Guide

This guide will walk you through setting up Google sign-in for your BoilerFuel Calorie Tracker application.

## Prerequisites

- A Google account
- Your application running locally or deployed

## Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)

2. Create a new project or select an existing one:
   - Click the project dropdown at the top
   - Click "New Project"
   - Name it something like "BoilerFuel Calorie Tracker"
   - Click "Create"

3. Enable the Google+ API:
   - In the left sidebar, go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click on it and click "Enable"

4. Create OAuth Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - If prompted, configure the OAuth consent screen:
     - Choose "External" for User Type
     - Fill in the required fields (App name, User support email, Developer email)
     - Click "Save and Continue"
     - Skip the "Scopes" section for now
     - Add test users if needed (your email address)
     - Click "Save and Continue"

5. Configure OAuth Client:
   - Application type: "Web application"
   - Name: "BoilerFuel Web Client"
   - Authorized JavaScript origins:
     - For local development: `http://localhost:3000`
     - For production: `https://your-production-domain.com`
   - Authorized redirect URIs:
     - For local development: `http://localhost:3000/api/auth/callback/google`
     - For production: `https://your-production-domain.com/api/auth/callback/google`
   - Click "Create"

6. Save your credentials:
   - You'll see a modal with your **Client ID** and **Client Secret**
   - Copy these values - you'll need them in the next step

## Step 2: Configure Environment Variables

### Frontend Environment Variables

Create or update `frontend/.env.local` with the following:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# NextAuth
NEXTAUTH_SECRET=your-random-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# API URL (optional, for production)
# NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

#### Generate NEXTAUTH_SECRET

You can generate a secure random secret using one of these methods:

```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# Visit https://generate-secret.vercel.app/32
```

### Production Environment Variables

When deploying to production (e.g., Vercel, Netlify):

1. Add the same environment variables in your hosting provider's dashboard
2. Update `NEXTAUTH_URL` to your production URL:
   ```bash
   NEXTAUTH_URL=https://your-production-domain.com
   ```

## Step 3: Update Google OAuth Redirect URIs for Production

When you deploy to production:

1. Go back to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Click on your OAuth 2.0 Client ID
4. Add your production redirect URI:
   ```
   https://your-production-domain.com/api/auth/callback/google
   ```
5. Click "Save"

## Step 4: Test the Integration

1. Start your development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to `http://localhost:3000/admin`

3. Click the "Sign in with Google" button

4. You should be redirected to Google's sign-in page

5. After signing in, you'll be redirected back to the admin panel

## Step 5: Create Database Tables (Optional)

The User model has been added to the backend, but the table needs to be created in your database.

### For Development (SQLite):

The table will be created automatically when you start the Flask backend if you have database initialization enabled.

### For Production (PostgreSQL):

You may need to run a migration or manually create the table:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
```

Or use Flask-Migrate:

```bash
cd backend
flask db migrate -m "Add users table"
flask db upgrade
```

## Troubleshooting

### "Error 400: redirect_uri_mismatch"

- Make sure your redirect URI in Google Cloud Console exactly matches the one being used
- Check that there are no trailing slashes
- Verify the protocol (http vs https) matches

### "Error 401: invalid_client"

- Double-check your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Make sure there are no extra spaces or quotes in your `.env.local` file

### Session not persisting

- Make sure `NEXTAUTH_SECRET` is set
- Clear your browser cookies and try again
- Check that `NEXTAUTH_URL` matches your current URL

### "This app is blocked"

- This happens if your OAuth consent screen is not verified
- For development, add your email as a test user in the OAuth consent screen
- For production, you'll need to verify your app with Google

## Security Best Practices

1. **Never commit** your `.env.local` file to version control
2. Use different OAuth credentials for development and production
3. Regularly rotate your `NEXTAUTH_SECRET`
4. Keep your `GOOGLE_CLIENT_SECRET` secure
5. Use HTTPS in production (required by Google)

## Features

### Current Implementation

- Google sign-in alongside traditional password authentication
- Session management using NextAuth.js
- 7-day session expiration (matching your existing JWT expiration)
- User data stored in database (email, name, Google ID)

### Future Enhancements

You can extend this implementation to:

- Store user-specific calorie tracking data
- Add role-based access control (admin vs regular users)
- Implement user profiles
- Add more OAuth providers (GitHub, Facebook, etc.)
- Sync user data with your backend Flask API

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
