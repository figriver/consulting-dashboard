# Vercel Deployment Guide

## Prerequisites

✅ Railway PostgreSQL live and DATABASE_URL ready  
✅ Database migrations completed  
✅ Seed data loaded (2 clients, 3 users, 400+ metrics)  

---

## Step 1: Get Google OAuth Credentials

The OAuth credentials should come from your existing **Move or Improve Assessment tool** setup on Vercel.

### Option A: Copy from Vercel (Recommended)

1. Go to https://vercel.com/dashboard
2. Click on **"move-or-improve-assessment"** project (existing deployment)
3. Go to **Settings → Environment Variables**
4. Look for:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
5. **Copy both values**

### Option B: Get from Google Cloud Console

If Option A doesn't work, create new credentials:

1. Go to https://console.cloud.google.com/
2. Select project (or create new one)
3. Go to **APIs & Services → Credentials**
4. Create **OAuth 2.0 Client ID**
5. Type: **Web application**
6. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://consulting-dashboard.vercel.app/api/auth/callback/google` (adjust project name)
7. Copy the **Client ID** and **Client Secret**

---

## Step 2: Deploy to Vercel

### 2a. Import Project

1. Go to https://vercel.com/dashboard
2. Click **"Add New" → "Project"**
3. Click **"Import Git Repository"**
4. Paste: `https://github.com/figriver/consulting-dashboard`
5. Click **"Import"**

Vercel will:
- Detect Next.js automatically
- Show the "Configure Project" page

### 2b. Configure Environment Variables

On the "Configure Project" page, scroll to **Environment Variables** section:

| Variable | Value | Source |
|----------|-------|--------|
| `DATABASE_URL` | `postgresql://...` | From Railway (Step 1 in RAILWAY_SETUP.md) |
| `NEXTAUTH_SECRET` | See below | Generate new |
| `NEXTAUTH_URL` | `https://consulting-dashboard-<random>.vercel.app` | Copy from Vercel (shown during deploy) |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | From Move or Improve project OR Google Cloud |
| `GOOGLE_CLIENT_SECRET` | `gcp_...` | From Move or Improve project OR Google Cloud |

### Generate NEXTAUTH_SECRET

Run this command and copy the output:

```bash
openssl rand -base64 32
```

Example output:
```
Sk3tvyBJE8o9pkUR1ylY/RPfwCCucTKuIaV/r4uZWgg=
```

### 2c. Click "Deploy"

1. Fill in all environment variables above
2. Click **"Deploy"** button
3. **Wait 2-3 minutes** for deployment

You'll see:
- Build logs scrolling
- "Creating deployment..."
- Finally: "✅ Deployment Complete!"
- Your live URL will be shown (e.g., `https://consulting-dashboard-xyz.vercel.app`)

---

## Step 3: Update Google OAuth Redirect URI

If you created new OAuth credentials in Step 1 Option B:

1. Go to Google Cloud Console
2. Click your OAuth 2.0 credential
3. Add your new Vercel URL to **Authorized redirect URIs**:
   ```
   https://consulting-dashboard-xyz.vercel.app/api/auth/callback/google
   ```
4. Save

---

## Step 4: Verify Deployment

### Check the Live URL

1. Click the Vercel deployment URL or go to:
   ```
   https://consulting-dashboard-[random-string].vercel.app
   ```

2. You should see the **Consulting Dashboard login page**

### Test OAuth Login

1. Click **"Sign in with Google"** button
2. Enter your Google email
3. You should:
   - Be redirected back to the app
   - See the **Dashboard** page
   - See your email in top right

### Verify Dashboard Features

✅ **Metrics Table** - Should show 400+ test metrics from database  
✅ **Admin Panel** - Should appear if you're ADMIN role  
✅ **Client Selector** - Dropdown to switch between "Acme Consulting" and "HealthCare Partners"  
✅ **Date Filters** - Start/End date filters working  
✅ **Data Sources Tab** - Should show 1 test sheet config  
✅ **Manual Sync Button** - Click to test Google Sheets sync  

---

## Troubleshooting

### "Database connection failed"
- **Cause:** DATABASE_URL not set or incorrect
- **Fix:** 
  1. Go to Vercel project Settings → Environment Variables
  2. Verify DATABASE_URL is correct (from Railway)
  3. Redeploy: click "..." → "Redeploy"

### "OAuth error: Invalid redirect_uri"
- **Cause:** Redirect URI not registered in Google Cloud
- **Fix:**
  1. Go to Google Cloud Console
  2. Add `https://[your-vercel-url]/api/auth/callback/google` to OAuth credential
  3. Wait 10 minutes for changes to propagate
  4. Try login again

### "500 error on /api/auth/signin"
- **Cause:** NEXTAUTH_SECRET or NEXTAUTH_URL not set
- **Fix:**
  1. Vercel → Settings → Environment Variables
  2. Check NEXTAUTH_SECRET is set
  3. Check NEXTAUTH_URL matches your Vercel domain
  4. Redeploy

### "Metrics table shows no data"
- **Cause:** Seed data didn't load or DATABASE_URL points to empty database
- **Fix:**
  1. Check that `./DEPLOY.sh` was run with correct DATABASE_URL
  2. Verify seed completed without errors
  3. Query database directly: `psql $DATABASE_URL -c "SELECT COUNT(*) FROM MetricsRaw"`

### "Can't see admin panel / Data Sources tab"
- **Cause:** Your user role isn't ADMIN
- **Fix:**
  1. Go to database directly
  2. Update your user: `UPDATE "User" SET role='ADMIN' WHERE email='your-email@example.com'`
  3. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

---

## Environment Variables Checklist

Before deploying, gather these:

```
☐ DATABASE_URL from Railway
☐ NEXTAUTH_SECRET (generate with openssl rand -base64 32)
☐ NEXTAUTH_URL (will get from Vercel during deploy)
☐ GOOGLE_CLIENT_ID (from Move or Improve OR Google Cloud)
☐ GOOGLE_CLIENT_SECRET (from Move or Improve OR Google Cloud)
```

---

## Post-Deployment (First Week)

Monitor these items:

1. **Application Health**
   - Check Vercel logs for errors
   - Verify no 500 errors in production

2. **OAuth Login**
   - Test with different Google accounts
   - Verify users are created in database

3. **Dashboard Functionality**
   - Spot-check metrics display
   - Test filters and sorting
   - Try manual sync to Google Sheets

4. **Database**
   - Monitor connection pool usage
   - Check for slow queries
   - Verify data quality

---

## Support

If issues arise during deployment:

1. Check Vercel dashboard → Deployments → Failed deployment → View logs
2. Check Vercel → Settings → Environment Variables (all set correctly?)
3. Check Google Cloud Console → OAuth credentials (redirect URIs updated?)
4. Check Railway dashboard → PostgreSQL → Logs for connection errors

---

**Status:** ⏳ Waiting for Michael to gather OAuth credentials and proceed with deployment

**Estimated Time:** 10 minutes for Vercel deployment (excluding Railway setup)
