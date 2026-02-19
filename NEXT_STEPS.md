# 🎯 Consulting Dashboard - NEXT STEPS FOR DEPLOYMENT

**Date:** February 19, 2026  
**Current Status:** Code complete, build passing, ready for deployment  
**Your Role:** Execute these 4 phases in order

---

## Phase 1: Create GitHub Repository (5 minutes)

### What to Do
1. Go to https://github.com/new
2. Create repository:
   - **Name:** `consulting-dashboard`
   - **Owner:** `figriver`
   - **Description:** "Automated multi-client consulting dashboard"
   - **Public:** Yes
   - **Initialize:** No (code already exists)
3. Click "Create repository"

### Then Push Code
```bash
cd /home/superman/.openclaw/workspace/projects/consulting-dashboard
git push origin master
```

### Verify
- Go to github.com/figriver/consulting-dashboard
- Should see all code files

---

## Phase 2: Set Up Railway PostgreSQL (10 minutes)

### Create Database
1. Go to https://railway.app
2. Sign up (free account)
3. Create New Project
4. Click "Add Service" → Database → PostgreSQL
5. Wait 2-3 minutes for database to initialize
6. Click the PostgreSQL instance
7. Go to "Connect" tab
8. Copy the full connection string (PostgreSQL URL)

### Run Migrations & Seed Data
```bash
# Set environment variable
export DATABASE_URL="paste_your_connection_string_here"

# Navigate to project
cd /home/superman/.openclaw/workspace/projects/consulting-dashboard

# Run migrations
npx prisma migrate deploy

# Seed test data (creates 2 clients, 3 users, ~400 metrics)
npx ts-node scripts/seed.ts
```

### Verify Database
```bash
# Open Prisma Studio (visual database viewer)
npx prisma studio

# Should show:
# - 2 Clients (Coastal Dental, Tech Startup)
# - 3 Users (admin@example.com, owner@coastaldental.com, owner@techstartup.com)
# - ~400 MetricsRaw records
# - 3 CoachingConfig records per client
```

---

## Phase 3: Deploy to Vercel (15 minutes)

### Create Vercel Project
1. Go to https://vercel.com
2. Sign in (or create account - link to GitHub recommended)
3. Click "Add New..." → "Project"
4. Click "Import Git Repository"
5. Search for "consulting-dashboard"
6. Click the repo to import it

### Set Environment Variables
**Important:** Do this BEFORE deploying

1. You'll see "Configure Project" screen
2. Click "Environment Variables" to expand
3. Add these 5 variables:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql://...` (from Railway Step 2) |
| `NEXTAUTH_SECRET` | `Sk3tvyBJE8o9pkUR1ylY/RPfwCCucTKuIaV/r4uZWgg=` |
| `NEXTAUTH_URL` | **Leave blank for now** (will update after deploy) |
| `GOOGLE_CLIENT_ID` | **See instructions below** |
| `GOOGLE_CLIENT_SECRET` | **See instructions below** |

### Set Up Google OAuth (Choose One)

**Option A: Create New OAuth App (Recommended)**
1. Go to https://console.cloud.google.com
2. Create a new project (name it: `consulting-dashboard-prod`)
3. In left menu: APIs & Services → OAuth consent screen
4. Choose "External" user type
5. Fill in:
   - App name: `Consulting Dashboard`
   - User support email: Your email
   - Developer contact email: Your email
6. Click "Create" on OAuth consent screen
7. Go to APIs & Services → Credentials
8. Click "Create Credentials" → "OAuth Client ID"
9. Choose "Web application"
10. Add Authorized Redirect URIs:
    - `https://localhost:3000/api/auth/callback/google`
    - `https://consulting-dashboard-XXXXX.vercel.app/api/auth/callback/google`
    - (Replace XXXXX with what Vercel assigns)
11. Click "Create"
12. Copy "Client ID" and "Client Secret"
13. Paste into Vercel environment variables

**Option B: Use Existing OAuth Credentials**
- If you have existing Google OAuth credentials, use those instead
- Just paste the Client ID and Secret

**Option C: Deploy First, Add OAuth Later**
- If you don't have OAuth credentials yet:
  - Set `GOOGLE_CLIENT_ID="temp"`
  - Set `GOOGLE_CLIENT_SECRET="temp"`
  - Deploy first, add real credentials later
  - Dashboard will work but sign-in will fail

### Deploy
1. All environment variables filled in?
2. Click "Deploy"
3. Wait 2-3 minutes for deployment to complete
4. You'll get a URL like: `https://consulting-dashboard-abc123.vercel.app`
5. **Save this URL** - you'll need it next

### Update NEXTAUTH_URL
1. Go back to Vercel project settings
2. Go to Environment Variables
3. Edit `NEXTAUTH_URL` and set it to your Vercel URL (from above)
4. Click "Redeploy"
5. Wait for redeployment to complete

---

## Phase 4: Test & Verify (5 minutes)

### Test OAuth Login
1. Visit your Vercel URL: `https://consulting-dashboard-abc123.vercel.app`
2. Click "Sign In with Google"
3. You should be redirected to Google login
4. Sign in with your Google account
5. After signing in, you should land on the dashboard

### Test Admin Features
1. If you signed in with an admin account:
   - You should see "Admin" label in header
   - You should see a "Client" dropdown to select different clients
2. Try selecting a different client - metrics should change
3. Try the date filter - should filter metrics

### Test Client Features
Sign in as a client user:
1. Sign out from admin account
2. Sign in as: `owner@coastaldental.com` (password: none, it's OAuth-based)
   - This requires adding this as a test account in Google or signing in with a different Google account
   - For now, just verify that the interface doesn't show the client selector
3. Verify you only see metrics for that client

### Check Data Displays
1. ✅ Metrics table shows data
2. ✅ Charts display (trending data)
3. ✅ KPI cards show numbers
4. ✅ Date filter works
5. ✅ Client selector works (if admin)

### Check Vercel Logs (if issues)
1. Go to Vercel project
2. Click "Deployments"
3. Click the latest deployment
4. Go to "Runtime Logs" tab
5. Look for any error messages

---

## 🎯 Success Checklist

When you complete all 4 phases, verify:

- [ ] GitHub repo created with all code
- [ ] Railway PostgreSQL running with tables
- [ ] Seed data created (2 clients, 3 users, 400+ metrics)
- [ ] Vercel project deployed
- [ ] Environment variables set correctly
- [ ] Vercel build successful (green checkmark)
- [ ] Can visit Vercel URL and see landing page
- [ ] Google OAuth sign-in works
- [ ] Dashboard loads after sign-in
- [ ] Metrics display with data
- [ ] Admin can switch between clients
- [ ] Charts and visualizations render
- [ ] No errors in Vercel runtime logs

---

## ⚠️ If Something Goes Wrong

### Can't Push to GitHub
- Verify Git remote: `git remote -v` should show `github.com/figriver/consulting-dashboard`
- If SSH fails, try HTTPS: `git remote set-url origin https://github.com/figriver/consulting-dashboard.git`
- If still fails, check SSH keys or GitHub credentials

### PostgreSQL Connection Fails
- Verify DATABASE_URL is correct: `postgresql://user:password@host:port/db`
- Verify Railway PostgreSQL is running in Railway dashboard
- Ensure you can connect locally: Check connection string works

### Vercel Deployment Fails
- Check Vercel build logs: Go to deployment → Build Logs tab
- Common issues:
  - Missing environment variables (check all 5 are set)
  - DATABASE_URL incorrect
  - Node version mismatch (should be 18+)

### OAuth Sign-In Fails
- Verify Google Client ID and Secret are correct
- Verify redirect URI in Google Console matches EXACTLY:
  - Should be: `https://your-vercel-url/api/auth/callback/google`
- Check NEXTAUTH_SECRET and NEXTAUTH_URL are set
- Redeploy after changing OAuth credentials

### Metrics Don't Load
- Check Vercel runtime logs
- Verify migrations ran: `DATABASE_URL=... npx prisma migrate status`
- Verify seed data exists: `DATABASE_URL=... npx prisma studio`
- Check database connection: `DATABASE_URL=... npx prisma db execute --stdin < query.sql`

---

## 📚 Reference Documents

- **[DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md)** - Current status & deployment checklist
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Detailed step-by-step guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Original comprehensive deployment guide
- **[SETUP.md](./SETUP.md)** - Local development setup
- **[README.md](./README.md)** - Overview and quick start

---

## 💡 Pro Tips

1. **Take screenshots** of your Vercel URL and Railway connection string - you'll refer to them
2. **Copy NEXTAUTH_SECRET** exactly - it must match between local and Vercel
3. **Save your credentials** - Google Client ID/Secret, DATABASE_URL, Vercel URL
4. **Redeploy is free** - If you change environment variables, just click "Redeploy"
5. **Check logs** - Vercel logs are your best friend for debugging

---

## ⏱️ Timeline

| Phase | Time | What Gets Done |
|-------|------|-----------------|
| 1: GitHub | 5 min | Code in GitHub, ready to deploy |
| 2: Railway | 10 min | Database live with test data |
| 3: Vercel | 15 min | App deployed to production URL |
| 4: Testing | 5 min | Verify everything works |
| **Total** | **35 min** | **Live in production** |

---

## 🎉 After Deployment

You now have:
- ✅ Production app running on Vercel
- ✅ Database live on Railway with test data
- ✅ Google OAuth authentication working
- ✅ Admin and client views functional
- ✅ Metrics dashboard displaying data

### Next (Optional Enhancements)
1. **Google Sheets Sync** - Connect your client Google Sheets
2. **Real Data** - Replace test metrics with actual client data
3. **Coaching Alerts** - Adjust alert thresholds
4. **Email Notifications** - Set up alert delivery
5. **Custom Reports** - Add more visualizations

---

## 🆘 Need Help?

1. Check error messages in Vercel runtime logs
2. Verify environment variables are set correctly
3. Ensure DATABASE_URL works locally: `npx prisma studio`
4. Review the troubleshooting section above
5. Check [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for more details

---

**You're ready! Start with Phase 1 above. ✨**

Questions? Check the reference documents or look at the error messages in Vercel/Railway dashboards.
