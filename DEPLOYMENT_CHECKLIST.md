# 🚀 Consulting Dashboard - Deployment Checklist

**Status:** Ready to deploy | Build: ✅ PASSING | Database: Ready | Code: Committed

## QUICK START - 45 Minutes to Live

### Phase 1: GitHub Repository (5 minutes)

**Manual Steps Required:**

1. Go to [github.com/new](https://github.com/new)
2. Create repository:
   - Name: `consulting-dashboard`
   - Owner: `figriver`
   - Description: "Automated multi-client consulting dashboard"
   - Public (recommended for Vercel integration)
   - Initialize with: **No** (we'll push existing repo)
3. Copy the repository URL: `https://github.com/figriver/consulting-dashboard.git`

**Then run locally:**

```bash
cd /home/superman/.openclaw/workspace/projects/consulting-dashboard

# Verify remote is set correctly
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/figriver/consulting-dashboard.git

# Push code to GitHub
git push -u origin master

# Verify: Go to github.com/figriver/consulting-dashboard - should see all code
```

### Phase 2: Railway PostgreSQL Database (10 minutes)

**Manual Steps:**

1. Go to [railway.app](https://railway.app)
2. Sign up (free account, requires email)
3. Create New Project
4. Add → Database → PostgreSQL
5. Wait 2-3 minutes for initialization
6. Click the PostgreSQL instance
7. Go to **Connect** tab
8. Copy the connection string (look for `PostgreSQL` section):
   ```
   postgresql://user:password@host:port/railway
   ```
9. Save this as your **DATABASE_URL**

**Then run locally:**

```bash
# Set the DATABASE_URL environment variable
export DATABASE_URL="postgresql://user:password@host:port/railway"

# Run migrations
cd /home/superman/.openclaw/workspace/projects/consulting-dashboard
npx prisma migrate deploy

# Seed test data (creates 2 clients, 3 users, 3 months of metrics)
npx ts-node scripts/seed.ts

# Verify (optional - opens Prisma Studio UI)
npx prisma studio
# Should show: 2 Clients, 3 Users, ~400+ MetricsRaw records
```

**Database is now LIVE with test data ✅**

### Phase 3: Vercel Deployment (15 minutes)

**Manual Steps:**

1. Go to [vercel.com](https://vercel.com)
2. Sign in (or create account with GitHub)
3. Click **"Add New..." → "Project"**
4. Select **"Import Git Repository"**
5. Search for `consulting-dashboard` (should find your GitHub repo)
6. Click **"Import"**
7. You'll see **"Configure Project"** screen
8. Expand **"Environment Variables"** section and add these:

| Variable | Value | Get From |
|----------|-------|----------|
| `DATABASE_URL` | `postgresql://...` | Railway (Step 2 above) |
| `NEXTAUTH_SECRET` | `UPwWW7CF1HnHtSRsRspUQKWgm7UdaWN/CiSfRmV100Q=` | Generated (see below) |
| `NEXTAUTH_URL` | `https://consulting-dashboard-XXX.vercel.app` | Will show after first deploy |
| `GOOGLE_CLIENT_ID` | ⚠️ **(See below - ACTION REQUIRED)** | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | ⚠️ **(See below - ACTION REQUIRED)** | Google Cloud Console |

**IMPORTANT: Google OAuth Setup (Required for Sign-In)**

You need to create Google OAuth credentials. Two options:

**Option A: Create New Google OAuth App** (5 minutes)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing): `consulting-dashboard-prod`
3. Enable APIs: Go to **APIs & Services** → **OAuth consent screen**
4. Choose "External" and fill in:
   - App name: `Consulting Dashboard`
   - User support email: your email
   - Developer contact: your email
5. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
6. Choose **Web application**
7. Add Authorized Redirect URIs:
   ```
   https://consulting-dashboard-XXX.vercel.app/api/auth/callback/google
   https://localhost:3000/api/auth/callback/google
   ```
8. Copy **Client ID** and **Client Secret**

**Option B: Reuse Assessment Tool Credentials** (Already have them?)
- Check your assessment tool configuration for existing Google OAuth credentials
- Reuse the same Client ID and Secret

**Option C: Manual OAuth Setup** (For later)
- Leave blank for now: `GOOGLE_CLIENT_ID="temp"` and `GOOGLE_CLIENT_SECRET="temp"`
- Dashboard will work but sign-in will fail
- Add real credentials after initial deploy

9. Click **"Deploy"**
10. Wait 2-3 minutes for deployment to complete
11. You'll get a URL like: `https://consulting-dashboard-abc123.vercel.app`

**⚠️ After Deploy - Update NEXTAUTH_URL:**

1. Go back to Vercel project settings
2. Go to **Environment Variables**
3. Edit `NEXTAUTH_URL` and set it to your actual Vercel URL (from deployment)
4. Redeploy: **Deployments** → Last deploy → **Redeploy**

### Phase 4: Testing (5 minutes)

**Verify OAuth Login:**

```bash
# Visit your Vercel URL (e.g., https://consulting-dashboard-abc123.vercel.app)
# Click "Sign In with Google"
# You should be redirected to Google login
# After signing in, should land on /dashboard
```

**Test Admin Dashboard:**

1. Sign in with admin account: `admin@example.com`
2. You should see **"Admin" label** in header
3. You should see a **Client Selector** dropdown
4. Select a client and see their metrics
5. Try date filtering
6. Verify charts and data load correctly

**Test Client View:**

1. Sign out
2. Sign in as: `owner@coastaldental.com`
3. You should see **only their client data**
4. No client selector visible (clients only see their own data)
5. Metrics should load

## Environment Variables Reference

```bash
# Database (from Railway)
DATABASE_URL="postgresql://user:password@host:port/railway"

# NextAuth Secret (generate new one)
NEXTAUTH_SECRET="UPwWW7CF1HnHtSRsRspUQKWgm7UdaWN/CiSfRmV100Q="

# NextAuth URL (your Vercel deployment URL)
NEXTAUTH_URL="https://consulting-dashboard-abc123.vercel.app"

# Google OAuth (from Google Cloud Console or assessment tool)
GOOGLE_CLIENT_ID="xxxx-xxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxx"

# Optional: Google Sheets API (for future automation)
GOOGLE_SHEETS_API_KEY="AIzaSyDxxxx"
GOOGLE_SHEETS_CREDENTIALS_JSON='{"type":"service_account",...}'
```

## 🎯 Definition of Done

✅ **When deployment is complete, verify:**

- [ ] GitHub repo created with all code pushed
- [ ] Railway PostgreSQL database live with tables
- [ ] Seed data created (2 clients, 3 users, ~400 metrics)
- [ ] Vercel deployment successful and live
- [ ] Google OAuth sign-in working
- [ ] Admin user can see all clients and filter data
- [ ] Client users see only their own data
- [ ] Charts and metrics display correctly
- [ ] Date filtering works
- [ ] No console errors in Vercel logs

## ⚠️ Troubleshooting

**Issue: "Database connection failed"**
- Verify `DATABASE_URL` is correct
- Check Railway PostgreSQL is still running
- Ensure Railway IP whitelist allows external connections (usually default)

**Issue: "OAuth login shows error"**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Verify redirect URI in Google Cloud Console matches your Vercel URL exactly
- Verify `NEXTAUTH_URL` in Vercel matches your actual deployment URL

**Issue: "Metrics not loading"**
- Check Vercel Runtime Logs: **Deployments** → **Logs**
- Verify migrations ran: `DATABASE_URL=... npx prisma migrate status`
- Verify seed data exists: `DATABASE_URL=... npx prisma studio`

**Issue: "Build failed"**
- Check Vercel Build Logs
- Common: Missing environment variables
- Solution: Ensure all vars in Phase 3 are set

## 📊 Next Steps After Deployment

1. **Configure Real Google Sheets**
   - Get client Google Sheets IDs
   - Add to database via admin panel (future feature)
   
2. **Set Up Automated Sync**
   - Create OpenClaw cron job for Sunday 6 PM CT
   - Syncs from Google Sheets → Database → Dashboard

3. **Add Real Client Data**
   - Replace seed data with actual metrics
   - Test PII stripping for medical clients

4. **Enable Alerts**
   - Configure coaching thresholds for each client
   - Set up email notifications (if implementing)

## Support

- **Build issues?** Check Vercel build logs
- **Database issues?** Check Railway dashboard
- **OAuth issues?** Check Google Cloud Console settings
- **Runtime errors?** Check Vercel runtime logs

---

**Estimated total time:** 45 minutes  
**Most time spent waiting for:** Railway PostgreSQL initialization, Vercel build  
**Cost:** $0-5/month (Railway free tier)
