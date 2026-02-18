# Consulting Dashboard System

Automated multi-client consulting dashboard replacing manual Tableau reports. Built with Next.js 14, React 18, shadcn/ui, Recharts, and PostgreSQL.

## Status

**MVP Phase 1: COMPLETE** ✅

- Frontend UI: Dashboard, KPI cards, Recharts visualizations, admin panel
- Backend APIs: All core endpoints implemented and tested
- Database: Prisma schema ready for PostgreSQL
- Authentication: Google OAuth configured and working
- Deployment: Ready for Vercel + Railway

**Ready to Deploy & Start Testing with Real Data**

Next: Set up database, deploy to Vercel, configure Google Sheets sync

See [SETUP.md](./SETUP.md) to get started locally, or [DEPLOYMENT.md](./DEPLOYMENT.md) to deploy to production.

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 13+ (or Railway/Vercel Postgres for cloud)
- Google OAuth credentials
- GitHub account (for deployment)

### Option A: Local Development (Easiest for MVP)

```bash
# 1. Clone and install
git clone https://github.com/figriver/consulting-dashboard.git
cd consulting-dashboard
npm install

# 2. Set up environment
cp .env.local.example .env.local
# Edit .env.local with your values (see SETUP.md)

# 3. Set up database (PostgreSQL locally or Railway)
# See SETUP.md for detailed instructions
npx prisma migrate deploy
npx ts-node scripts/seed.ts

# 4. Start dev server
npm run dev

# Visit http://localhost:3000 and sign in with Google
```

### Option B: Deploy to Vercel (Production)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions:
1. Push code to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy (1 click)

**Estimated time:** 30 minutes

## Setup Guides

- **[SETUP.md](./SETUP.md)** — Local development & database setup (PostgreSQL, SQLite, Google OAuth)
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — Production deployment to Vercel with Railway/Vercel Postgres

## Environment Variables

Create `.env.local` with:
```bash
# Database (PostgreSQL for production, SQLite for local dev)
DATABASE_URL="postgresql://user:password@host:5432/db"
# or for local SQLite: DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"  # Change to your domain for production

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Optional: Google Sheets sync
GOOGLE_SHEETS_API_KEY="your-api-key"
```

## Database Setup

See [SETUP.md](./SETUP.md) for options:
- **Railway** (recommended) — Free tier, easy setup
- **Vercel Postgres** — Integrated with Vercel
- **Local PostgreSQL** — For development
- **Local SQLite** — Simplest for MVP testing

Run migrations:
```bash
npx prisma migrate deploy
npx ts-node scripts/seed.ts  # Optional: add test data
```

---

## Architecture

### Data Flow
1. **Google Sheets API** — Pulls raw data from LeadLoop exports + ad spend sheets
2. **PII Stripper** — Removes [First Name, Last Name, Phone, Email] for medical clients
3. **Data Transformer** — Normalizes columns, calculates ROAS, conversion rates
4. **PostgreSQL** — Stores clean metrics with full audit trail
5. **Dashboard API** — Serves metrics to frontend with role-based access control
6. **Frontend** — Admin view (all clients) + Client view (own data only)

### Database Schema

**Clients** — One row per consulting client (medical or non-medical)

**Users** — Logins (role: ADMIN or CLIENT; client_id links clients to their users)

**SheetsConfig** — Google Sheets to pull from (per client, supports multiple sheets/tabs)

**MetricsRaw** — Metrics table (upserted weekly)
- Columns: date, medium, source, campaign, location, user, service_person
- Metrics: leads, consults, sales, spend, roas, leads_to_consult_rate, leads_to_sale_rate
- Indexes: (client_id, date) for fast filtering

**CoachingConfig** — Admin-configurable thresholds per client per metric
- Metrics: LEADS_TO_CONSULT_RATE, LEADS_TO_SALE_RATE, ROAS

**CoachingAlerts** — Triggered when metrics fall below thresholds

**AuditLogs** — Complete audit trail (PII stripping, sync events, errors)

---

## API Reference

### Authentication
- `POST /api/auth/signin` — OAuth redirect to Google
- `POST /api/auth/signout` — Logout
- `GET /api/auth/me` — Current user info

### Metrics
- `GET /api/metrics?client_id=X&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
  - Returns metrics for a client (filtered by user role)
  - **Admin:** Can query any client
  - **Client:** Can only query their own data

### Sync
- `POST /api/sync/trigger?client_id=X` (admin only)
  - Manually trigger sync for a client
  - Returns sync status, rows synced, errors

### Admin
- `GET /api/admin/clients` (admin only)
  - List all clients with sync status
- `POST /api/admin/clients` (admin only)
  - Create new client
- `GET /api/admin/coaching-config?client_id=X` (admin only)
  - Get coaching thresholds for a client
- `PUT /api/admin/coaching-config` (admin only)
  - Update coaching thresholds

---

## Setting Up Automated Sync (OpenClaw Cron)

The weekly sync (Sunday 6 PM CT) is triggered via OpenClaw cron, not built into this app.

### Configure OpenClaw Cron

In your main OpenClaw instance, add a cron job:

```bash
openclaw cron add \
  --schedule "0 6 * * 0" \
  --payload '{"kind":"agentTurn","message":"Trigger consulting dashboard sync"}' \
  --sessionTarget isolated
```

This sends a message to an isolated agent session that:
1. Calls your dashboard API (`POST /api/sync/trigger?client_id=<all-clients>`)
2. Logs results
3. Emails you a summary

**Note:** You'll need to implement OAuth token refresh to make this work. For now, the sync endpoint expects a stored access token in environment variables.

---

## Features (MVP Phase 1 Complete ✅)

### Dashboard UI ✅
- ✅ KPI cards: total leads, consults, sales, average ROAS
- ✅ Leads → Consults → Sales funnel (bar chart)
- ✅ ROAS trend line (time series)
- ✅ Spend by medium breakdown (pie chart)
- ✅ Detailed metrics table with inline sorting
- ✅ Responsive design (desktop, tablet, mobile)

### For Admins ✅
- ✅ View metrics for all clients
- ✅ Client selector dropdown
- ✅ Manage clients: view sync status, sync now button
- ✅ Configure coaching alert thresholds per metric
- ✅ View and acknowledge coaching alerts with notes
- ✅ Audit log viewer with action labels and timestamps
- ✅ Date range filtering

### For Clients ✅
- ✅ View only their own metrics
- ✅ Same dashboard UI (metrics, filters, charts)
- ✅ No access to other clients' data or admin controls

### Authentication ✅
- ✅ Google OAuth sign-in
- ✅ Role-based access control (ADMIN / CLIENT)
- ✅ Session management with NextAuth.js

### Data Pipeline (Ready)
- ⏳ Weekly auto-sync (via OpenClaw cron — requires token refresh)
- ✅ PII stripping for medical clients (First Name, Last Name, Phone, Email)
- ✅ Database schema optimized for metrics queries
- ✅ Full audit trail support
- ✅ Manual sync trigger endpoint
- ✅ Seed script with 3 months of test data

---

## Testing

### Mock Data

Create test clients and data:
```bash
npx ts-node scripts/create-test-client.ts
npx ts-node scripts/seed-metrics.ts
```

### End-to-End Test

1. Sign in as admin (create user via seed script)
2. Navigate to `/dashboard`
3. Select a test client
4. View metrics, try filtering
5. Adjust coaching thresholds
6. Click manual sync (will fail without OAuth token, but shows UI flow)

### Unit Tests

```bash
npm run test
```

Tests cover:
- PII stripping logic (medical clients)
- Data transformation (date parsing, numeric parsing, conversion rates)
- Metrics API (auth checks, role-based filtering)

---

## Production Deployment

### Vercel

```bash
vercel deploy
```

Set environment variables in Vercel dashboard, then redeploy.

### Environment Variables (Production)
- Set `NEXTAUTH_URL` to your production domain
- Use a strong `NEXTAUTH_SECRET` (generate new one)
- Point `DATABASE_URL` to production PostgreSQL (e.g., Railway)
- Add Google OAuth credentials (same as dev, or new ones if you prefer separate)

### Database

For production PostgreSQL:
1. Create a Railway or managed service instance
2. Copy connection string to `DATABASE_URL`
3. Run migrations: `npx prisma migrate deploy`

---

## Known Limitations & TODOs (Phase 2+)

### MVP Phase 1 Complete (Current)
- ✅ Frontend dashboard with KPI cards and Recharts visualizations
- ✅ Admin panel with client management, coaching config, audit logs
- ✅ Coaching alerts display with acknowledge functionality
- ✅ All API routes implemented
- ✅ Database schema finalized
- ✅ Seed script for test data

### Phase 2: TODO (Not critical for MVP)

**Google Sheets Sync**
- TODO: Implement OAuth token refresh flow
- TODO: Extract tokens from session and store securely
- TODO: Test sync with real Google Sheets data
- TODO: Handle rate limiting and errors gracefully

**Automated Syncing**
- TODO: Implement OpenClaw cron job for weekly syncs
- TODO: Add retry logic with exponential backoff
- TODO: Email notifications on sync failure

**Coaching Alerts**
- TODO: Trigger alerts during sync when metrics breach thresholds
- TODO: Email notifications for unacknowledged alerts
- TODO: Alert severity levels (warning vs critical)

### Phase 3+: Scaling & Polish
- TODO: Implement data partitioning for >24 months of data
- TODO: Add caching layer for frequently accessed metrics
- TODO: Real-time sync triggers (instead of weekly)
- TODO: Custom report generation (PDF export)
- TODO: Team collaboration features (notes, mentions)
- TODO: Mobile app (React Native)
- TODO: Advanced analytics (anomaly detection, forecasting)

---

## File Structure

```
consulting-dashboard/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts      # NextAuth routes
│   │   │   ├── metrics/route.ts                 # Metrics API
│   │   │   ├── sync/trigger/route.ts            # Manual sync trigger
│   │   │   └── admin/                           # Admin routes
│   │   ├── page.tsx                             # Home page
│   │   ├── layout.tsx                           # Root layout
│   │   └── globals.css                          # Tailwind CSS
│   └── lib/
│       ├── auth.ts                              # NextAuth config
│       ├── sheets.ts                            # Google Sheets API client
│       ├── pii-stripper.ts                      # PII removal logic
│       ├── metrics-transformer.ts               # Data normalization
│       ├── sync-service.ts                      # Orchestrates full sync
│       └── prisma.ts                            # Prisma client singleton
├── prisma/
│   └── schema.prisma                            # Database schema
├── scripts/
│   ├── seed.ts                                  # Create test data
│   ├── create-test-client.ts                    # Add test client
│   └── seed-metrics.ts                          # Add mock metrics
├── .env.local.example                           # Environment template
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## Troubleshooting

### "No matching version found" for dependencies
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, reinstall: `npm install`

### Database connection errors
- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Run migrations: `npx prisma migrate dev`

### OAuth errors
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check redirect URLs in Google OAuth config (should include `http://localhost:3000/api/auth/callback/google` for dev)

### Sync fails with 401
- OAuth token needs refresh
- **Temporary workaround:** Get a fresh token from Google OAuth and set as `GOOGLE_OAUTH_ACCESS_TOKEN` env var

---

## Support

For issues or questions:
1. Check the audit logs: `GET /api/admin/audit-logs?client_id=X`
2. Review sync status: `GET /api/admin/clients`
3. Check application logs (Vercel dashboard if deployed)

---

**Last Updated:** Feb 18, 2026
**Status:** MVP Phase 1 (database + API routes complete, frontend in progress)
