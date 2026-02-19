# Google Sheets Integration Implementation Plan

## Task Overview
Add Google Sheets data source management to consulting dashboard admin panel + wire up weekly sync via OpenClaw cron.

## Current State
- ✅ Database schema: SheetsConfig model exists with all fields
- ✅ Google Sheets client library: GoogleSheetsClient class ready
- ✅ Sync service: syncClientData() function exists
- ✅ PII stripping: stripPII() with medical client detection working
- ✅ Admin panel structure: Tabs already in place
- ✅ Auth patterns: Admin checks established

## Implementation Checklist

### Phase 1: Backend API Endpoints
- [ ] Create `/api/admin/sheets-config/route.ts`
  - POST: Create new sheet config (with client validation)
  - GET: List all sheet configs (with status)
  - PUT: Update sheet config
  - DELETE: Delete sheet config
- [ ] Create `/api/admin/sync-all/route.ts`
  - Internal endpoint for scheduled sync
  - Accepts optional `client_id` for single-client sync
  - Loops all/selected configs
  - Returns summary with status per config

### Phase 2: Frontend UI Component
- [ ] Create `DataSources.tsx` component
  - Add sheet form: client selector, sheet ID, tabs, medical checkbox
  - Sheet list: show client, sheet ID, tabs, medical flag, last synced
  - Sync status badges: PENDING/SYNCING/SUCCESS/FAILED
  - Delete button with confirmation
  - Manual sync button (shows loading state)
  - Error display (last_error field)
- [ ] Update `admin/page.tsx`
  - Add "Data Sources" tab
  - Import and render DataSources component
  - Pass selectedClientId and refetch callback

### Phase 3: OpenClaw Cron Setup
- [ ] Create cron configuration entry
  - Schedule: Sunday 6 PM CT (0 18 * * 0 UTC = 0 23 * * 0 UTC, or use cron format)
  - Action: POST to /api/admin/sync-all (no auth, or internal token)
  - Capture response: log success/failure

### Phase 4: Testing
- [ ] Manual test via UI
  - Add test sheet config (client dropdown, sheet ID, tabs)
  - Verify appears in list
  - Click manual sync → check loading state
  - Verify audit logs show sync event
  - Check metrics_raw table for new data
  - For medical client: verify PII columns removed
- [ ] Verify database
  - SheetsConfig record created
  - SyncStatus transitions: PENDING → SYNCING → SUCCESS/FAILED
  - MetricsRaw populated with synced data
  - AuditLog shows PII_STRIPPED events
- [ ] Cron verification
  - (Requires Michael's main instance setup)
  - Should run Sunday 6 PM CT
  - Should populate audit logs with weekly sync results

## Files to Create/Update
```
Create:
  src/components/DataSources.tsx
  src/app/api/admin/sheets-config/route.ts
  src/app/api/admin/sync-all/route.ts

Update:
  src/app/dashboard/admin/page.tsx
```

## Blockers & Decisions
- **Google OAuth token**: Using env var `GOOGLE_SHEETS_ACCESS_TOKEN` for now
  - Production: Need per-user token storage + refresh logic
  - Ticket: Update to DB-based token management later
- **OpenClaw cron format**: Will use POST endpoint with internal/no-auth
  - Requires cron job in main instance (Michael's setup)
- **Test data**: Need actual Google Sheet IDs from Michael

## API Contracts

### POST /api/admin/sheets-config
```json
{
  "clientId": "string",
  "sheetId": "string (Google Sheet ID)",
  "sheetName": "string (human-readable name)",
  "tabNames": ["string", "string"]
}
```

### GET /api/admin/sheets-config?client_id=xxx
Returns list of configs with:
- id, clientId, sheetId, sheetName, tabNames
- lastSyncedAt, syncStatus, lastError
- client.name, client.isMedical

### PUT /api/admin/sheets-config/:id
Same request body as POST

### DELETE /api/admin/sheets-config/:id
No body

### POST /api/admin/sync-all?client_id=xxx (optional)
Internal endpoint, no auth check
Returns: { success: boolean, results: SyncResult[] }

## Timeline
- Phase 1 (API): ~30 min
- Phase 2 (UI): ~30 min
- Phase 3 (Cron): ~15 min (depends on Michael)
- Phase 4 (Testing): ~15 min
- **Total**: ~90 min (1.5 hours)
