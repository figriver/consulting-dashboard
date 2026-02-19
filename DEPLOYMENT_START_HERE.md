# 🚀 DEPLOYMENT START HERE

## Timeline: ~45-60 minutes total

---

## Phase 1: Railway PostgreSQL Setup (Michael - 15 mins)

**Location:** RAILWAY_SETUP.md (read it!)

### Your Tasks:

1. ✅ Create new Railway account (free tier, takes 5 mins)
2. ✅ Create PostgreSQL database
3. ✅ Copy `DATABASE_URL` from Railway Variables tab
4. ✅ **Paste the DATABASE_URL in this chat**

**Time:** ~15 minutes  
**Difficulty:** Very Easy (clicking buttons)

---

## Phase 2: Database Migrations & Seed Data (Agent - 10 mins)

**Once you provide DATABASE_URL**, the agent will:

```bash
export DATABASE_URL="postgresql://..."
cd /home/superman/.openclaw/workspace/projects/consulting-dashboard
npx prisma migrate deploy    # Apply all schema migrations
npx ts-node prisma/seed.ts   # Load test data
```

**What gets created:**
- ✅ All database tables (User, Client, MetricsRaw, SheetsConfig, etc.)
- ✅ 2 clients: "Acme Consulting", "HealthCare Partners"
- ✅ 3 test users with ADMIN + CLIENT roles
- ✅ 400+ test metrics (daily data for past 90 days)
- ✅ Coaching configs & Sheets integration setup

**Time:** ~5-10 minutes  
**Status:** Agent handles automatically

---

## Phase 3: Vercel Deployment (Michael - 20 mins)

**Location:** VERCEL_DEPLOYMENT.md (read it!)

### Your Tasks:

1. ✅ Gather OAuth credentials:
   - Go to Vercel → "move-or-improve-assessment" project
   - Copy `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
   - (Or create new ones via Google Cloud Console)

2. ✅ Deploy on Vercel:
   - Go to vercel.com
   - Click "Add New → Project"
   - Import GitHub: `github.com/figriver/consulting-dashboard`
   - Configure 5 environment variables (see checklist below)
   - Click "Deploy"
   - Wait 2-3 minutes for build

3. ✅ Test the live dashboard:
   - Click the Vercel URL
   - Test Google OAuth login
   - Verify metrics table loads
   - Check admin panel & Data Sources tab

**Time:** ~15-20 minutes  
**Difficulty:** Easy (clicking buttons + copying values)

---

## Phase 4: Verification & Handoff (Agent - 5 mins)

Once Vercel deployment completes:

✅ Verify live URL is accessible  
✅ Check database connectivity  
✅ Test OAuth login  
✅ Confirm metrics display  
✅ Report any issues  

---

## 🎯 Environment Variables Needed for Vercel

**Gather these 5 values before deploying to Vercel:**

| Variable | Example | Source |
|----------|---------|--------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/railway` | **From Railway** |
| `NEXTAUTH_SECRET` | `Sk3tvyBJE8o9pkUR1ylY/RPfwCCucTKuIaV/r4uZWgg=` | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://consulting-dashboard-abc123.vercel.app` | Vercel shows this during deploy |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | **Move or Improve Vercel project** |
| `GOOGLE_CLIENT_SECRET` | `gcp_xxxxx` | **Move or Improve Vercel project** |

---

## 📋 Quick Checklist

### Before Starting
- [ ] Read RAILWAY_SETUP.md
- [ ] Read VERCEL_DEPLOYMENT.md
- [ ] Have Vercel account ready (you already have one ✅)
- [ ] Have access to Move or Improve project on Vercel

### Phase 1 (Michael)
- [ ] Create Railway account
- [ ] Create PostgreSQL
- [ ] Copy DATABASE_URL
- [ ] Paste DATABASE_URL in chat → agent proceeds

### Phase 2 (Agent - automatic)
- [ ] Run migrations
- [ ] Load seed data
- [ ] Verify database
- [ ] Report status

### Phase 3 (Michael)
- [ ] Get GOOGLE_CLIENT_ID from Move or Improve project
- [ ] Get GOOGLE_CLIENT_SECRET from Move or Improve project
- [ ] Go to Vercel dashboard
- [ ] Import GitHub repo
- [ ] Set 5 environment variables
- [ ] Click Deploy
- [ ] Wait 2-3 minutes
- [ ] Get live URL

### Phase 4 (Verification)
- [ ] Verify app loads
- [ ] Test Google OAuth
- [ ] Check metrics display
- [ ] Check admin panel
- [ ] All working? ✅ Done!

---

## 🆘 Need Help?

### For Railway issues:
- See troubleshooting in RAILWAY_SETUP.md

### For Vercel issues:
- See troubleshooting in VERCEL_DEPLOYMENT.md
- Check Vercel deployment logs
- Verify all 5 environment variables are set

### For Database issues:
- Agent will handle and report

### For OAuth issues:
- Make sure Google OAuth redirect URI includes your Vercel URL
- Check VERCEL_DEPLOYMENT.md → Troubleshooting → "OAuth error"

---

## 🎬 Ready to Start?

**Next Step for Michael:**

1. Open RAILWAY_SETUP.md
2. Follow steps 1-3
3. Paste the `DATABASE_URL` when done

**Agent is standing by!** ✅

---

**Status:** ⏳ Waiting for DATABASE_URL from Railway  
**Estimated Total Time:** 45-60 minutes  
**Start Time:** 2026-02-19 04:13 UTC  
