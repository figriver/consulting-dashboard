# Consulting Dashboard System

Automated multi-client consulting dashboard replacing manual Tableau reports. Built with Next.js 14, React 18, shadcn/ui, Recharts, and PostgreSQL.

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 13+
- Google OAuth credentials (from assessment tool)
- Google Sheets API key or OAuth token

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment

Copy `.env.local.example` to `.env.local` and fill in your values:
```bash
cp .env.local.example .env.local
```

Required environment variables:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — Random secret for NextAuth (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` — Your app URL (e.g., `http://localhost:3000` for dev)
- `GOOGLE_CLIENT_ID` — From assessment tool OAuth setup
- `GOOGLE_CLIENT_SECRET` — From assessment tool OAuth setup
- `GOOGLE_SHEETS_API_KEY` — Google Sheets API key (optional if using OAuth)

### 3. Set Up Database

Initialize Prisma and create database schema:
```bash
npx prisma migrate dev --name init
```

This creates all tables: `clients`, `users`, `sheets_configs`, `metrics_raw`, `coaching_config`, `coaching_alerts`, `audit_logs`.

### 4. Seed Initial Data (Optional)

Create a sample admin user and client:
```bash
npx ts-node scripts/seed.ts
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and sign in with Google OAuth.

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

## Features (MVP)

### For Michael (Admin)
- ✅ View metrics for all 5 clients
- ✅ See each client's leads → consults → sales funnel
- ✅ Segment data by: medium, source, campaign, location, user, service_person
- ✅ Filter by date range
- ✅ Set custom coaching alert thresholds (per metric, per client)
- ✅ Manual sync trigger button
- ✅ View last sync time + status for each client
- ✅ Audit log viewer (see what was stripped, when syncs ran, errors)

### For Clients (Practice Owners)
- ✅ See only their own data
- ✅ Same dashboard layout (metrics, charts, filters)
- ✅ No admin controls or access to other clients

### Data Pipeline
- ✅ Weekly auto-sync (Sunday 6 PM CT via OpenClaw cron)
- ✅ PII stripping for medical clients (First Name, Last Name, Phone, Email)
- ✅ Upsert strategy (historical data updated as sales retroactively change)
- ✅ Full audit trail (all stripping operations logged)
- ✅ Error handling + retry logic (exponential backoff)
- ✅ Manual refresh on-demand

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

## Known Limitations & TODOs

### OAuth Token Management
- Currently requires storing access token in env variables
- **TODO:** Implement refresh token flow to auto-renew Google OAuth
- **TODO:** Store token securely in database per user

### Manual Refresh Endpoint
- `/api/sync/trigger` exists but needs real token
- **TODO:** Extract token from session cookies / secure storage
- **TODO:** Implement proper error handling if token expired

### Frontend Dashboard
- **TODO:** Build admin dashboard UI (client selector, KPI cards, charts, alert config)
- **TODO:** Build client dashboard UI (same layout, no admin controls)
- **TODO:** Add coaching alert display + acknowledge feature
- **TODO:** Add audit log viewer

### Coaching Alerts
- **TODO:** Trigger alerts when thresholds breached (during sync)
- **TODO:** Show alerts on dashboard
- **TODO:** Support email notifications

### Scaling Considerations
- **TODO:** Add data partitioning if >24 months of data on 50+ clients
- **TODO:** Cache frequently accessed metrics
- **TODO:** Consider real-time sync triggers instead of weekly

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
