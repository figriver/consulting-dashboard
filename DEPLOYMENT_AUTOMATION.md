# Consulting Dashboard - Deployment Automation Guide

## Status
**Current:** ✅ Code complete, build passing, ready for deployment
**Blocker:** Browser/network access required for external service configuration
**Timeline:** 45 minutes total (once services are configured)

---

## What This Document Covers

This guide provides:
1. **Automated deployment steps** you can run locally
2. **Manual browser-based steps** that require user interaction
3. **Verification procedures** to confirm each phase works
4. **Troubleshooting** for common issues

---

## Prerequisites

```bash
# Verify you're in the right directory
cd /home/superman/.openclaw/workspace/projects/consulting-dashboard

# Verify Node is installed
node --version  # Should be v18+
npm --version   # Should be v10+

# Verify Git is configured
git config user.email  # Should return your email
git config user.name   # Should return your name
```

---

## Phase 1: GitHub (MANUAL - 5 minutes)

### Step 1.1: Create Repository
1. Go to https://github.com/new
2. Enter:
   - **Name:** `consulting-dashboard`
   - **Owner:** `figriver`
   - **Description:** "Automated multi-client consulting dashboard with Google Sheets integration"
   - **Visibility:** Public
   - **Initialize repository:** No (code already exists locally)
3. Click "Create repository"

### Step 1.2: Push Code (AUTOMATED)
Once the GitHub repo exists, run:

```bash
cd /home/superman/.openclaw/workspace/projects/consulting-dashboard

# Verify remote is set correctly
git remote -v
# Should show: origin https://github.com/figriver/consulting-dashboard.git

# Push code
git push origin master

# Verify push succeeded
git log --oneline -5
```

**Success:** You can see all code at github.com/figriver/consulting-dashboard

---

## Phase 2: Railway PostgreSQL (MANUAL + AUTOMATED)

### Step 2.1: Create Railway Database (MANUAL - 8 minutes)
1. Go to https://railway.app
2. Click "Start Free" or sign up
3. Create a new project
4. Click "Add Service" → "Database" → "PostgreSQL"
5. Wait 2-3 minutes for deployment
6. Click the PostgreSQL service
7. Click "Connect" tab
8. Copy the "Postgres Connection URL" (should look like):
   ```
   postgresql://user:password@host:port/railway
   ```

### Step 2.2: Set Environment & Run Migrations (AUTOMATED)
```bash
cd /home/superman/.openclaw/workspace/projects/consulting-dashboard

# Set the DATABASE_URL from Railway
export DATABASE_URL="postgresql://user:password@host:port/railway"

# (Optional) Verify connection works
npx prisma db execute --stdin <<EOF
SELECT version();
EOF

# Run migrations (creates all tables)
npx prisma migrate deploy

# Seed test data (creates 2 clients, 3 users, ~400 metrics)
npx ts-node prisma/seed.ts

# Verify data was created
npx prisma studio
```

**Success:** 
- ✅ All migrations applied
- ✅ Tables created: Users, Clients, MetricsRaw, CoachingConfig, CoachingAlerts, AuditLogs, SheetsConfig
- ✅ Seed data loaded: 2 clients, 3 users, 400+ metrics

---

## Phase 3: Google OAuth (MANUAL - 10 minutes)

### Step 3.1: Create Google OAuth Credentials (MANUAL)

**Option A: Create New Credentials (Recommended)**

1. Go to https://console.cloud.google.com
2. Create a new project: Name it `consulting-dashboard-prod`
3. Enable the Google+ API:
   - Go to "APIs & Services"
   - Click "Enable APIs and Services"
   - Search for "Google+ API"
   - Click "Enable"
4. Create OAuth Consent Screen:
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External"
   - Fill in:
     - App name: `Consulting Dashboard`
     - User support email: Your email
     - Developer contact email: Your email
   - Click "Create"
5. Create OAuth Client ID:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth Client ID"
   - Choose "Web application"
   - Add Authorized JavaScript origins:
     - `https://localhost:3000` (for testing)
     - `https://consulting-dashboard-XXXXX.vercel.app` (add after Vercel deployment)
   - Add Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for testing)
     - `https://consulting-dashboard-XXXXX.vercel.app/api/auth/callback/google` (add after Vercel)
   - Click "Create"
6. Copy and save:
   - **GOOGLE_CLIENT_ID** = Copy from "Client ID" field
   - **GOOGLE_CLIENT_SECRET** = Copy from "Client Secret" field

**Option B: Use Existing Credentials**
- If you already have Google OAuth credentials, use those instead

### Step 3.2: Save Credentials Securely
```bash
# Create a temporary file to store credentials (don't commit this!)
cat > /tmp/oauth_credentials.txt << 'EOF'
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
EOF

# Keep this file safe - you'll need it for Vercel deployment
cat /tmp/oauth_credentials.txt
```

**Success:** You have GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

---

## Phase 4: Vercel Deployment (MANUAL + AUTOMATED)

### Step 4.1: Create Vercel Project (MANUAL - 5 minutes)
1. Go to https://vercel.com
2. Sign in or create account
3. Click "Add New..." → "Project"
4. Click "Import Git Repository"
5. Search for "consulting-dashboard"
6. Click to select the repo
7. You'll be on "Configure Project" screen

### Step 4.2: Set Environment Variables (MANUAL - 3 minutes)
On the Vercel "Configure Project" screen:

1. Scroll down to "Environment Variables" section
2. Add each variable:

| Name | Value |
|------|-------|
| `DATABASE_URL` | From Railway (Step 2.1) |
| `NEXTAUTH_SECRET` | `Sk3tvyBJE8o9pkUR1ylY/RPfwCCucTKuIaV/r4uZWgg=` |
| `NEXTAUTH_URL` | Leave empty for now - add after deploy |
| `GOOGLE_CLIENT_ID` | From Google Cloud (Step 3.1) |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud (Step 3.1) |

3. Click "Deploy"
4. Wait 2-3 minutes for deployment to complete

### Step 4.3: Update NEXTAUTH_URL (MANUAL - 2 minutes)
Once deployment finishes:

1. Vercel will show your production URL (looks like):
   ```
   https://consulting-dashboard-abc123.vercel.app
   ```
2. Copy this URL
3. Go to your Vercel project settings
4. Go to "Environment Variables"
5. Edit `NEXTAUTH_URL` and set it to your URL
6. Click "Save"
7. Click "Redeploy" button
8. Wait for redeployment to finish

**Success:**
- ✅ Deployment completed without errors
- ✅ Production URL is live
- ✅ NEXTAUTH_URL matches production URL

---

## Phase 5: Testing (AUTOMATED - 5 minutes)

### Step 5.1: Test Basic Access
```bash
# Set your Vercel URL (from Step 4.3)
VERCEL_URL="https://consulting-dashboard-abc123.vercel.app"

# Test that the app responds
curl -I "$VERCEL_URL"  # Should return HTTP 200
```

### Step 5.2: Test OAuth Login (MANUAL)
1. Open your Vercel URL in a browser
2. You should see the login page
3. Click "Sign In with Google"
4. Sign in with your Google account
5. You should be redirected to the dashboard

### Step 5.3: Test Dashboard (MANUAL)
After signing in:
1. ✅ You should see the dashboard page
2. ✅ Metrics table should have data
3. ✅ Charts should display
4. ✅ KPI cards should show numbers (revenue, clients, etc.)
5. ✅ If you're an admin, you should see a "Client" dropdown
6. ✅ Try changing the client - metrics should update
7. ✅ Try the date filter - metrics should filter

### Step 5.4: Check Logs
If something doesn't work:

```bash
# Check Vercel build logs
echo "Go to: https://vercel.com/[your-username]/consulting-dashboard/deployments"
echo "Click the latest deployment"
echo "Go to 'Build Logs' tab and look for errors"

# Check runtime logs
echo "Go to 'Runtime Logs' tab and look for error messages"
```

---

## Automated Deployment Script

For convenience, here's a one-command deployment summary:

```bash
#!/bin/bash
set -e

echo "=== Consulting Dashboard Deployment ==="
echo ""
echo "✅ Phase 1: GitHub"
echo "  Repo: github.com/figriver/consulting-dashboard"
git remote -v | grep origin
echo ""

echo "✅ Phase 2: Railway"
echo "  1. Go to railway.app and create PostgreSQL"
echo "  2. Copy the connection string"
echo "  3. Run: export DATABASE_URL='<your-connection-string>'"
echo ""

echo "✅ Phase 3: Google OAuth"
echo "  1. Go to console.cloud.google.com"
echo "  2. Create OAuth credentials"
echo "  3. Save CLIENT_ID and CLIENT_SECRET"
echo ""

echo "✅ Phase 4: Run Migrations (after Railway is ready)"
echo "  export DATABASE_URL='postgresql://...'"
echo "  npx prisma migrate deploy"
echo "  npx ts-node prisma/seed.ts"
echo ""

echo "✅ Phase 5: Vercel"
echo "  1. Go to vercel.com"
echo "  2. Import github.com/figriver/consulting-dashboard"
echo "  3. Set 5 environment variables"
echo "  4. Click Deploy"
echo "  5. Update NEXTAUTH_URL with your URL"
echo "  6. Redeploy"
echo ""

echo "✅ Phase 6: Test"
echo "  1. Visit your Vercel URL"
echo "  2. Sign in with Google"
echo "  3. Verify dashboard loads"
echo ""

echo "Total time: 45 minutes"
```

---

## Credential Checklist

Print this out and check off as you go:

```
GitHub:
  - [ ] Repository created at github.com/figriver/consulting-dashboard
  - [ ] Code pushed to master branch

Railway PostgreSQL:
  - [ ] Account created at railway.app
  - [ ] PostgreSQL database created
  - [ ] DATABASE_URL copied
  - [ ] Migrations ran successfully
  - [ ] Seed data created (400+ metrics)

Google OAuth:
  - [ ] Credentials created in Google Cloud Console
  - [ ] GOOGLE_CLIENT_ID copied
  - [ ] GOOGLE_CLIENT_SECRET copied
  - [ ] Redirect URIs configured for Vercel URL

Vercel:
  - [ ] Project created and imported
  - [ ] All 5 environment variables set
  - [ ] Build successful
  - [ ] NEXTAUTH_URL updated with Vercel URL
  - [ ] Redeployment successful

Testing:
  - [ ] Vercel URL accessible
  - [ ] Google OAuth login works
  - [ ] Dashboard loads with metrics
  - [ ] Admin client selector works
  - [ ] Date filters work
  - [ ] No console errors
```

---

## Troubleshooting

### Can't Push to GitHub
```bash
# Check SSH key
ssh -T git@github.com
# If failed: Use HTTPS instead
git remote set-url origin https://github.com/figriver/consulting-dashboard.git
git push origin master
```

### Database Connection Fails
```bash
# Verify DATABASE_URL is set
echo $DATABASE_URL

# Test connection
npx prisma db execute --stdin <<EOF
SELECT 1;
EOF

# If fails: Check Railway dashboard that PostgreSQL is running
```

### Vercel Build Fails
1. Check Vercel Build Logs for errors
2. Common causes:
   - Missing DATABASE_URL environment variable
   - Wrong environment variable names (case-sensitive)
   - Node version mismatch
3. Solution: Fix environment variables and click "Redeploy"

### OAuth Sign-In Fails
1. Check that GOOGLE_CLIENT_ID and SECRET are correct
2. Verify redirect URI in Google Console matches EXACTLY:
   - Should be: `https://[your-vercel-url]/api/auth/callback/google`
3. Verify NEXTAUTH_SECRET is set in Vercel
4. Verify NEXTAUTH_URL matches your Vercel URL
5. Solution: Fix credentials/URLs in Vercel and redeploy

### Metrics Don't Load
1. Check Vercel Runtime Logs for database errors
2. Verify migrations ran: `npx prisma migrate status`
3. Verify seed data exists: `npx prisma studio`
4. Check database connection: `DATABASE_URL=... npx prisma db execute --stdin < query.sql`

---

## After Deployment

### Success Verification
```bash
# Your app is live at: https://consulting-dashboard-XXXXX.vercel.app
# 
# Verify you can:
# - [ ] Visit the URL
# - [ ] Click "Sign In with Google"
# - [ ] Sign in with your Google account
# - [ ] See the dashboard with metrics
# - [ ] Switch clients (if admin)
# - [ ] Filter by date
# - [ ] No console errors
```

### Next Steps (Optional Enhancements)
1. **Google Sheets Sync** - Connect actual Google Sheets for metrics
2. **Real Data** - Replace test metrics with client data
3. **Alerts** - Configure coaching alerts thresholds
4. **Email Notifications** - Set up alert emails
5. **Custom Reports** - Add more visualizations

---

## Support Resources

All documentation is in `/home/superman/.openclaw/workspace/projects/consulting-dashboard/`:

- **NEXT_STEPS.md** - Quick action guide
- **DEPLOYMENT_CHECKLIST.md** - Detailed step-by-step
- **DEPLOYMENT_READY.md** - Status and reference
- **SETUP.md** - Local development
- **This file** - Automation guide

---

## Summary

1. **Phase 1 (GitHub):** 5 minutes - Manual repo creation + push
2. **Phase 2 (Railway):** 10 minutes - Manual DB setup + automated migrations
3. **Phase 3 (Google):** 10 minutes - Manual OAuth credential creation
4. **Phase 4 (Vercel):** 12 minutes - Manual project setup + automated deployment
5. **Phase 5 (Testing):** 5 minutes - Manual testing

**Total: ~45 minutes**

All code is ready. All you need to do is:
- Create the external services (GitHub, Railway, Vercel, Google)
- Set the connection strings and credentials
- Let the automated steps handle the rest

**Ready to deploy? Start with Phase 1 above! 🚀**
