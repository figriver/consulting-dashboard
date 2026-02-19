# Quick Reference - Google Sheets Integration

## Quick Links
- **Admin UI:** http://localhost:3000/dashboard/admin (Data Sources tab)
- **Test Sheet API:** `curl -X POST http://localhost:3000/api/admin/sync-all`
- **Docs:**
  - Setup: `CRON_SETUP.md`
  - Testing: `TESTING_SHEETS_INTEGRATION.md`
  - Summary: `IMPLEMENTATION_SUMMARY.md`

---

## Environment Setup

```bash
# Required environment variable
export GOOGLE_SHEETS_ACCESS_TOKEN="<your-google-oauth-token>"

# Optional: Custom dashboard port
export PORT=3000
```

---

## API Quick Test

### List all sheet configs
```bash
curl http://localhost:3000/api/admin/sheets-config
```

### Create sheet config
```bash
curl -X POST http://localhost:3000/api/admin/sheets-config \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client-uuid",
    "sheetId": "1a2b3c4d...",
    "sheetName": "Q1 2024",
    "tabNames": ["January", "February", "March"]
  }'
```

### Trigger manual sync (all pending)
```bash
curl -X POST http://localhost:3000/api/admin/sync-all
```

### Trigger sync for specific client
```bash
curl -X POST "http://localhost:3000/api/admin/sync-all?client_id=<uuid>"
```

---

## Database Quick Queries

### View all sheet configs
```sql
SELECT 
  sc.id, 
  c.name as client,
  sc.sheet_id,
  sc.sheet_name,
  sc.tab_names,
  sc.sync_status,
  sc.last_synced_at,
  sc.last_error
FROM sheets_config sc
JOIN clients c ON sc.client_id = c.id
ORDER BY sc.created_at DESC;
```

### Check sync results
```sql
SELECT 
  a.id,
  a.client_id,
  a.action,
  a.details,
  a.created_at
FROM audit_logs a
WHERE a.action IN ('SYNC_COMPLETED', 'SYNC_FAILED', 'PII_STRIPPED')
ORDER BY a.created_at DESC
LIMIT 20;
```

### Count imported metrics
```sql
SELECT 
  c.name,
  COUNT(*) as metric_count,
  MAX(mr.created_at) as latest_import
FROM metrics_raw mr
JOIN clients c ON mr.client_id = c.id
GROUP BY c.id, c.name
ORDER BY metric_count DESC;
```

### Verify PII stripping worked
```sql
SELECT 
  a.details,
  a.created_at
FROM audit_logs a
WHERE a.action = 'PII_STRIPPED'
ORDER BY a.created_at DESC
LIMIT 5;
```

---

## Common Commands

### Start development server
```bash
cd /home/superman/.openclaw/workspace/projects/consulting-dashboard
npm run dev
```

### Build for production
```bash
npm run build
npm start
```

### Run TypeScript check
```bash
npx tsc --noEmit
```

### Prisma database commands
```bash
# View data
npx prisma studio

# Run migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

---

## UI Walkthrough (50 seconds)

1. **Go to Admin Panel**
   - Click "Dashboard" menu → "Admin Panel"
   - Verify you see 4 tabs: Clients & Sync, Data Sources, Coaching Config, Audit Logs

2. **Go to Data Sources tab**
   - Click "Data Sources" tab

3. **Add a sheet**
   - Click "Add Sheet" button
   - Select client
   - Paste Google Sheet ID
   - Enter tab names (comma-separated)
   - Click "Add Sheet"
   - Sheet appears in list with status PENDING

4. **Trigger sync**
   - Click "Sync" button on the sheet
   - Status changes to SYNCING
   - Wait 10-30 seconds
   - Status becomes SUCCESS (or FAILED if error)

5. **Check results**
   - Go to "Audit Logs" tab
   - Look for SYNC_COMPLETED or SYNC_FAILED action
   - For medical clients: look for PII_STRIPPED action

---

## Troubleshooting Flow

### Problem: Sync fails with "access token not configured"
```
→ Check: Is GOOGLE_SHEETS_ACCESS_TOKEN set?
  export GOOGLE_SHEETS_ACCESS_TOKEN="..."
→ Restart app: npm run dev
→ Try sync again
```

### Problem: Sync shows 0 rows imported
```
→ Check: Is Google Sheet ID correct?
→ Check: Do tab names match EXACTLY (case-sensitive)?
→ Check: Does Google account have read access to sheet?
→ Check: Is the sheet data in cells, not a table?
→ Try: Manually test in Google Sheets API explorer
```

### Problem: Medical client data still has names/emails
```
→ Check: Is client marked as isMedical = true?
  SELECT name, is_medical FROM clients WHERE id = '<id>';
→ Check: Are column names exactly these?
  - "First Name" (case-sensitive)
  - "Last Name"
  - "Phone"
  - "Email"
→ Check: Does data have these columns in the sheet?
```

### Problem: Cron job not running
```
→ Check: Is OpenClaw cron configured? (see CRON_SETUP.md)
→ Check: Is dashboard app running? (http://localhost:3000)
→ Check: Manual test: curl -X POST http://localhost:3000/api/admin/sync-all
→ Check: Is GOOGLE_SHEETS_ACCESS_TOKEN set?
→ Check: Dashboard logs for errors
```

---

## Performance Baseline

| Metric | Value | Notes |
|--------|-------|-------|
| Sync speed | 10-50 rows/sec | Depends on Google API latency |
| Small sheet | < 5 sec | < 100 rows |
| Medium sheet | 10-30 sec | 100-1000 rows |
| Large sheet | 1-2 min | 1000-10000 rows |
| UI poll interval | 5 sec | Real-time status updates |
| Cron job | ~5 min | Weekly Sunday 6 PM CT |

---

## Admin Responsibilities

### Weekly
- [ ] Check Data Sources tab on Monday morning
- [ ] Verify "Last Synced" is recent (Sunday ~6 PM CT)
- [ ] Check Audit Logs for errors
- [ ] Monitor metrics_raw row count for unexpected drops

### Monthly
- [ ] Review PII stripping logs for medical clients
- [ ] Test manual sync on at least one sheet
- [ ] Check error trends (failed syncs increasing?)

### As Needed
- [ ] Add new Google Sheet sources (client provides sheet ID)
- [ ] Delete old/invalid sheet configs
- [ ] Update tab names if client reorganizes sheets
- [ ] Fix Google OAuth token if it expires (quarterly)

---

## Key Files

| File | Purpose | Owner |
|------|---------|-------|
| `DataSources.tsx` | Admin UI component | Frontend team |
| `sheets-config/route.ts` | CRUD API | Backend team |
| `sync-all/route.ts` | Sync trigger API | Backend team |
| `CRON_SETUP.md` | Cron configuration | DevOps |
| `TESTING_SHEETS_INTEGRATION.md` | Testing guide | QA |
| `.env.local` | Environment variables | All |

---

## Slack Announcement Template

```
🎉 Google Sheets Integration Now Live!

Admins can now configure automated weekly Google Sheets syncing:

✅ Add Google Sheets data sources via Admin Panel
✅ Automatic sync every Sunday 6 PM CT
✅ Manual sync anytime (just click a button)
✅ PII automatically stripped for medical clients

Quick start:
1. Go to Admin Panel → Data Sources tab
2. Click "Add Sheet"
3. Enter your Google Sheet ID
4. System syncs automatically

Questions? Check TESTING_SHEETS_INTEGRATION.md or ask in #engineering
```

---

## Rollback Plan

If something goes wrong:

### Step 1: Disable syncing
```bash
# Stop the OpenClaw cron job
# (Ask DevOps to disable scheduled sync)
```

### Step 2: Revert code (if needed)
```bash
git revert <commit-hash>
npm run build
npm start
```

### Step 3: Clear bad data (if needed)
```bash
# Backup first!
pg_dump $DATABASE_URL > backup.sql

# Remove recent synced metrics
DELETE FROM metrics_raw 
WHERE created_at >= NOW() - INTERVAL '7 days'
AND client_id = '<affected-client-id>';

# Mark configs as PENDING to retry later
UPDATE sheets_config 
SET sync_status = 'PENDING', last_error = NULL
WHERE client_id = '<affected-client-id>';
```

### Step 4: Communicate
- Notify team of rollback
- Post incident summary
- Plan fix before re-enabling

---

## Key Contacts

- **Google Sheets API issues:** Check Google Cloud Console logs
- **Database issues:** DBA or database team
- **Cron setup:** DevOps / OpenClaw maintainer (Michael)
- **UI issues:** Frontend team
- **Logic issues:** Backend / Data team

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-02-19 | Initial release |

---

## Related Docs

- Architecture: `IMPLEMENTATION_SUMMARY.md`
- Detailed Testing: `TESTING_SHEETS_INTEGRATION.md`
- Cron Setup: `CRON_SETUP.md`
- Project Plan: `SHEETS_INTEGRATION_PLAN.md`
