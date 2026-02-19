# Weekly Google Sheets Sync - OpenClaw Cron Setup

## Overview
This document describes how to configure the OpenClaw cron job for weekly Google Sheets syncing.

## What the Cron Does
- Runs every Sunday at 6 PM CT (18:00 CT / 23:00 UTC)
- Calls the internal sync endpoint: `POST /api/admin/sync-all`
- Syncs all pending/failed sheet configurations
- Logs results to audit_logs table
- Optionally sends notification (Telegram or email)

## Setup Instructions

### 1. Environment Variable
Ensure `GOOGLE_SHEETS_ACCESS_TOKEN` is set in the deployment environment:
```bash
export GOOGLE_SHEETS_ACCESS_TOKEN="your-google-service-account-token-or-oauth-token"
```

**Note:** Currently uses a single token. For production, upgrade to per-user token storage in database (see TODO below).

### 2. OpenClaw Cron Job Configuration

Add the following cron job to your OpenClaw instance (in the main agent's session or heartbeat):

**Option A: Via Heartbeat (Recommended)**
Add to `/home/superman/.openclaw/workspace/HEARTBEAT.md`:

```markdown
## Weekly Google Sheets Sync
- **Schedule:** Sunday 6 PM CT (every week)
- **Action:** POST to http://localhost:3000/api/admin/sync-all
- **Expected response:** { success: boolean, results: SyncResult[] }
```

**Option B: Direct Cron Command**
Use OpenClaw's cron subsystem:
```
0 23 * * 0 curl -X POST http://localhost:3000/api/admin/sync-all
```
(23:00 UTC = 18:00 CT)

**Option C: Via OpenClaw systemEvent**
If using a scheduled task framework:
```bash
openclaw systemEvent --target=main --event=sheets-sync-trigger
```

### 3. Post-Sync Notification (Optional)

To send Telegram notification after sync, add to your main agent's notification handler:

```typescript
// After sync completes
const results = await fetch('http://localhost:3000/api/admin/sync-all', { method: 'POST' });
const data = await results.json();

// Send summary to Telegram
await message({
  action: 'send',
  channel: 'telegram',
  target: '@your-admin-channel',
  message: `✅ Weekly Sheets Sync Complete\n${data.summary.successCount}/${data.summary.totalClients} clients synced\n${data.summary.totalRowsSynced} rows imported`,
});
```

## Monitoring

### Check Sync Status
1. Go to Admin Panel → Data Sources tab
2. Look at "Status" column for each sheet config:
   - ✅ SUCCESS = Last sync successful
   - ❌ FAILED = Last sync had errors (see "Last Error")
   - ⏳ SYNCING = Currently syncing (shouldn't last long)
   - ⏹️ PENDING = Never synced or awaiting next scheduled sync

### Review Audit Logs
1. Go to Admin Panel → Audit Logs tab
2. Filter by action: "SYNC_COMPLETED" or "SYNC_FAILED"
3. Check details for row counts and error messages

### Verify Data Import
```sql
-- Check latest synced data
SELECT COUNT(*) FROM metrics_raw 
WHERE createdAt >= NOW() - INTERVAL '7 days';

-- Check for PII stripping events
SELECT * FROM audit_logs 
WHERE action = 'PII_STRIPPED' 
ORDER BY createdAt DESC 
LIMIT 10;
```

## Troubleshooting

### "Google Sheets access token not configured"
- Ensure GOOGLE_SHEETS_ACCESS_TOKEN environment variable is set
- Token must be a valid Google OAuth access token with Sheets API permission

### Sync runs but syncs 0 rows
- Check that sheet configs exist in Data Sources tab
- Verify Google Sheet IDs are correct
- Check that tab names match exactly (case-sensitive)
- Review last sync error in Data Sources list

### "Failed to read sheet" errors
- Verify Google Sheet ID is valid
- Confirm service account has read access to the sheet
- Check tab names are spelled exactly as they appear in the sheet
- Review the sheet's sharing settings

### Medical client data still has PII
- Verify client is marked as "Medical" in Admin Panel
- Check audit logs for "PII_STRIPPED" action
- Confirm column names match the DEFAULT_MEDICAL_RULES in pii-stripper.ts:
  - "First Name", "Last Name", "Phone", "Email"
  - (Column name matching is case-insensitive)

## Database Schema
See `/prisma/schema.prisma` for:
- **SheetsConfig** - stores sheet configuration
- **MetricsRaw** - stores imported metrics
- **AuditLog** - stores sync events and PII stripping logs

## Future Improvements

### TODO: Per-User Token Storage
Currently uses a single GOOGLE_SHEETS_ACCESS_TOKEN for all syncs.

**Better approach:**
1. Store per-user Google OAuth tokens in `users` table
2. Refresh tokens automatically before sync
3. Allow each admin to manage their own sheet sources

**Implementation:**
```prisma
model User {
  // ... existing fields ...
  googleAccessToken String?
  googleRefreshToken String?
  googleTokenExpiresAt DateTime?
}
```

Then in sync-all endpoint:
```typescript
const user = await getAdminUser(); // get current admin
const accessToken = user.googleAccessToken;
// Refresh if expired
```

### TODO: Notification Integration
Add Telegram/email alerts on sync failure:
```typescript
if (!data.success) {
  await notifyAdmins(`Sheets sync failed: ${data.summary.totalErrors} errors`);
}
```

## API Contract

### POST /api/admin/sync-all
```
Query Params (optional):
  ?client_id=<uuid>     // Sync only one client (default: all pending)

Response:
{
  "success": boolean,
  "message": string,
  "summary": {
    "totalClients": number,
    "successCount": number,
    "failureCount": number,
    "totalRowsSynced": number,
    "totalErrors": number
  },
  "results": [
    {
      "clientId": string,
      "success": boolean,
      "rowsSynced": number,
      "errors": string[],
      "startTime": ISO8601,
      "endTime": ISO8601
    }
  ]
}

Status Code 500 if critical error (token not configured, etc.)
```

## Questions?

If cron setup fails or has questions, check:
1. Is the dashboard app running on port 3000?
2. Is GOOGLE_SHEETS_ACCESS_TOKEN set in the environment?
3. Are there any errors in the dashboard logs?
4. Can you manually test: `curl -X POST http://localhost:3000/api/admin/sync-all`
