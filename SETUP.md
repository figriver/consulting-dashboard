# Consulting Dashboard - Setup Guide

## Option 1: PostgreSQL on Railway (Recommended)

### 1. Create Railway Account & Database

1. Go to [railway.app](https://railway.app) and sign up (free tier available)
2. Create a new project
3. Add a PostgreSQL database from the marketplace
4. Wait for the database to initialize (2-3 minutes)
5. Copy the database URL from the Railway dashboard

### 2. Set Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in:
- `DATABASE_URL` — PostgreSQL connection string from Railway
- `NEXTAUTH_SECRET` — Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` for dev
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` — From Google OAuth (see below)

### 3. Run Migrations

```bash
npx prisma migrate deploy
```

This creates all tables: `users`, `clients`, `sheets_configs`, `metrics_raw`, `coaching_config`, `coaching_alerts`, `audit_logs`.

### 4. Seed Test Data

```bash
npx ts-node scripts/seed.ts
```

This creates:
- 1 medical client (Coastal Dental) with PII-sensitive fields
- 1 non-medical client (Tech Startup)
- 3 test user accounts
- 3 months of mock metrics data

---

## Option 2: PostgreSQL Locally (Development Only)

### 1. Install PostgreSQL

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

**Windows:** Download from [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Create Database

```bash
createdb consulting_dashboard
```

### 3. Set Up Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/consulting_dashboard"
NEXTAUTH_SECRET="dev-secret-key-12345"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### 4. Run Migrations & Seed

```bash
npx prisma migrate deploy
npx ts-node scripts/seed.ts
```

---

## Google OAuth Setup

### Get OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials (OAuth consent screen → Create credentials → OAuth client ID)
5. Set redirect URI: `http://localhost:3000/api/auth/callback/google` (for dev)
6. Copy Client ID and Client Secret to `.env.local`

**For Production:**
- Redirect URI: `https://your-domain.vercel.app/api/auth/callback/google`
- Update `NEXTAUTH_URL` to your production domain

---

## Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and sign in with Google OAuth.

---

## Test Accounts (After Seeding)

| Email | Role | Client |
|-------|------|--------|
| admin@example.com | Admin | All |
| owner@coastaldental.com | Client | Coastal Dental (Medical) |
| owner@techstartup.com | Client | Tech Startup (Non-Medical) |

**Note:** Since OAuth is required for sign-in, you need to use a Gmail account or link the test emails to a Google account.

---

## Production Deployment (Vercel)

### 1. Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/consulting-dashboard.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Set environment variables:
   - `DATABASE_URL` — Production PostgreSQL (Railway)
   - `NEXTAUTH_SECRET` — Generate new: `openssl rand -base64 32`
   - `NEXTAUTH_URL` — Your Vercel domain
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
4. Deploy

### 3. Run Migrations on Production

After deployment, run:
```bash
npx prisma migrate deploy
npx ts-node scripts/seed.ts
```

---

## Troubleshooting

### "Database connection refused"
- Check `DATABASE_URL` is correct
- Verify PostgreSQL is running
- Test with: `psql $DATABASE_URL`

### "PrismaClient generation failed"
```bash
npx prisma generate
```

### "NextAuth errors"
- Ensure `NEXTAUTH_SECRET` is set (not empty)
- Check Google OAuth redirect URIs match your domain
- Verify `NEXTAUTH_URL` matches your deployment domain

### "Migrations failed"
```bash
# Reset database (development only!)
npx prisma migrate reset
```

---

## Architecture

**Data Pipeline:**
1. Google Sheets API → Raw data
2. PII Stripper (for medical clients)
3. Data Transformer → Normalize & calculate metrics
4. PostgreSQL → Persistent storage with audit trail
5. API Routes → Role-based access control
6. Frontend → React components with Recharts visualizations

**PII Stripping (Medical Clients):**
- Removes: First Name, Last Name, Phone, Email
- Logs all stripping operations in audit log
- Non-medical clients' data stored unmodified

---

## Next Steps

1. **Configure Google Sheets Sync** — Add sheet IDs to dashboard
2. **Set Up Coaching Alerts** — Configure thresholds per metric
3. **Enable Email Notifications** — Set up email alerts (optional)
4. **Configure Weekly Auto-Sync** — Set up OpenClaw cron job

See README.md for full API documentation.
