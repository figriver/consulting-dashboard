# Consulting Dashboard - Deployment Guide

This guide walks through deploying the Consulting Dashboard MVP to Vercel with PostgreSQL.

## Prerequisites

- GitHub account
- Vercel account (free tier is fine)
- PostgreSQL instance (Railway, Vercel Postgres, or other)
- Google OAuth credentials configured for your domain

## Step 1: Set Up PostgreSQL Database

### Option A: Railway (Recommended for simplicity)

1. Go to [railway.app](https://railway.app)
2. Sign up (free tier available)
3. Create a new project
4. Add PostgreSQL from the marketplace
5. Wait for initialization (2-3 minutes)
6. Click the database, go to Connect tab
7. Copy the full connection string (looks like `postgresql://user:password@host:port/db`)
8. Save this as your `DATABASE_URL`

**Cost:** Free tier includes $5/month credit. Most MVPs stay within this.

### Option B: Vercel Postgres

1. Go to [Vercel Dashboard](https://vercel.com)
2. Create a project (you can do this before connecting GitHub)
3. Go to Storage → Postgres → Create Database
4. Copy the connection string
5. Save as `DATABASE_URL`

**Cost:** Included in Vercel free tier ($0.25 per 100 requests, very cheap)

### Option C: Other Providers

- [Aiven](https://aiven.io) — Free 20GB PostgreSQL
- [Render.com](https://render.com) — Free PostgreSQL
- [Neon](https://neon.tech) — Serverless Postgres with free tier

## Step 2: Push Code to GitHub

### Create Repository

```bash
cd /path/to/consulting-dashboard

# Initialize git (if not already done)
git init

# Add all files
git add -A
git commit -m "Initial commit: Consulting Dashboard MVP"

# Create repo on GitHub and push
# Go to github.com/new, create "consulting-dashboard" repo
git remote add origin https://github.com/YOUR-USERNAME/consulting-dashboard.git
git branch -M main
git push -u origin main
```

### Verify Build

Before deploying, ensure the app builds locally:

```bash
npm run build
```

If there are errors, fix them locally and push the fix to GitHub.

## Step 3: Deploy to Vercel

### Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Select "Import Git Repository"
4. Search for and select "consulting-dashboard"
5. Click Import

### Configure Environment Variables

In the Vercel dashboard, before deploying, add these environment variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | Your PostgreSQL connection string | From Railway or Vercel Postgres |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` | **Must be different from dev!** |
| `NEXTAUTH_URL` | Your Vercel deployment URL | e.g., `https://consulting-dashboard.vercel.app` |
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Client Secret | From Google Cloud Console |
| `GOOGLE_SHEETS_API_KEY` | (Optional) Your Google Sheets API key | For automated syncing |

**Important:** After deployment, you'll get your actual Vercel URL. Update `NEXTAUTH_URL` in Vercel settings to match it.

### Deploy

1. Click "Deploy"
2. Vercel will start building and deploying
3. Wait for the deployment to complete (~2-3 minutes)
4. You'll get a URL like `https://consulting-dashboard-xxx.vercel.app`

## Step 4: Set Up Production Database

### Run Migrations

Once deployed, run migrations on your production database:

```bash
DATABASE_URL="your-production-postgresql-url" npx prisma migrate deploy
```

Or use Vercel's terminal:

```bash
vercel env pull  # Pulls environment variables from Vercel
npx prisma migrate deploy
```

### Seed Production Data

You can seed production with test data (optional):

```bash
vercel env pull
npx ts-node scripts/seed.ts
```

**Warning:** This creates test users and metrics. For production, you may want to seed with real client data instead.

## Step 5: Configure Google OAuth for Production

### Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Find your OAuth consent screen
3. Add your Vercel URL as an authorized redirect URI:
   - `https://your-vercel-domain.vercel.app/api/auth/callback/google`
4. Save and download new credentials if needed
5. Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Vercel dashboard

### Test OAuth Flow

1. Go to your Vercel deployment URL
2. Click "Sign In with Google"
3. You should be redirected to Google OAuth
4. After signing in, you should be logged into the dashboard

## Step 6: Verify Production Deployment

### Test Dashboard

1. Visit `https://your-vercel-domain.vercel.app/dashboard`
2. Ensure you're logged in
3. Check that metrics load correctly
4. If admin, verify the admin panel works
5. Test date filtering
6. Verify charts render

### Check Logs

If something goes wrong:

1. Go to Vercel dashboard
2. Select your project
3. Go to Deployments
4. Click the deployment
5. Go to "Runtime logs" to see server errors
6. Go to "Build logs" for deployment errors

### Common Issues

**401 Unauthorized on OAuth:**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check redirect URI in Google Console matches exactly
- Ensure `NEXTAUTH_URL` matches your Vercel domain

**Database Connection Failed:**
- Verify `DATABASE_URL` is correct and accessible from Vercel
- Check PostgreSQL instance is running and accepting connections
- Ensure firewall allows Vercel's IP addresses (Railway allows all by default)

**Metrics not loading:**
- Ensure database migrations ran successfully: `npx prisma migrate status`
- Check if seed data exists: `npx prisma studio`
- Look at runtime logs for SQL errors

## Step 7: Set Up Automated Syncing (Optional)

For weekly automated syncing from Google Sheets, see the README.md section "Setting Up Automated Sync (OpenClaw Cron)".

## Step 8: Ongoing Maintenance

### Update Deployment

After making code changes:

```bash
git commit -am "Your changes"
git push origin main
```

Vercel automatically redeploys on every push to main.

### Database Migrations

If you add new fields to the database:

```bash
npx prisma migrate dev --name add_new_field
git push  # Vercel will run migrations automatically
```

### View Live Logs

```bash
vercel logs  # Stream logs from production
```

### Rollback Deployment

Go to Vercel dashboard → Deployments → Click the previous deployment → Click "Redeploy"

## Monitoring & Alerts

### Vercel Analytics

1. Go to Vercel dashboard
2. Select your project
3. View real-time metrics:
   - Page views
   - Edge requests
   - Serverless function calls
   - Database operations

### Error Tracking

Vercel automatically logs all unhandled errors. Check the Runtime logs tab for any issues.

### Database Monitoring

Use Prisma Studio to inspect production database:

```bash
vercel env pull
npx prisma studio
```

## Cost Breakdown (Monthly)

| Service | Free Tier | Notes |
|---------|-----------|-------|
| **Vercel** | Unlimited | $0 for hobby/small projects |
| **Railway Postgres** | $5 credit | $0 if under 5GB and ~100GB transfer |
| **Vercel Postgres** | Included | Included in Vercel free tier |
| **Google OAuth** | Unlimited | $0 (no API calls) |
| **Total** | **$0-5/month** | Depends on database choice |

## Production Checklist

Before going live with real client data:

- [ ] Database set up and accessible
- [ ] Migrations run successfully
- [ ] OAuth working with production credentials
- [ ] Environment variables all set
- [ ] Admin dashboard accessible and functional
- [ ] Client filtering working
- [ ] Date filters working correctly
- [ ] Metrics loading without errors
- [ ] Charts rendering properly
- [ ] PII stripping enabled for medical clients
- [ ] Audit logs recording events
- [ ] Backup strategy in place (Railway auto-backups daily)
- [ ] Team members added to Vercel project
- [ ] Production domain configured (optional)

## Next Steps After Deployment

1. **Configure Google Sheets Sync** — Add client sheet IDs
2. **Set Coaching Thresholds** — Configure alert limits per client
3. **Test with Real Data** — Seed with actual client metrics
4. **Enable Email Alerts** — Configure notifications (if implementing)
5. **Train Users** — Show team how to use the dashboard

## Support

For issues:

1. Check Vercel Runtime Logs
2. Review this guide's troubleshooting section
3. Check README.md for API documentation
4. Review SETUP.md for local development issues

---

**Deployment time estimate:** 30-45 minutes (mostly waiting for services to initialize)

**After first deployment:** Code changes auto-deploy in ~1-2 minutes
