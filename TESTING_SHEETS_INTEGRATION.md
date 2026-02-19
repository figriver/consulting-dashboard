# Testing Guide: Google Sheets Integration

## Prerequisites

Before testing, ensure:

1. **Application running:**
   ```bash
   npm run dev
   # or
   npm start
   ```
   App should be at http://localhost:3000

2. **Database running:**
   - PostgreSQL must be accessible (check `DATABASE_URL` in `.env.local`)
   - Run migrations if needed: `npx prisma migrate deploy`

3. **Google Sheet ID ready:**
   - You need a real Google Sheet ID (e.g., `1a2b3c4d5e6f7g8h9i...`)
   - The sheet should have some tabs with data
   - Ideally both a medical and non-medical example

4. **Google OAuth Token:**
   - Set `GOOGLE_SHEETS_ACCESS_TOKEN` environment variable
   - Token must have Google Sheets API read permission

5. **Admin user:**
   - Sign in with an admin account
   - Verify user.role = 'ADMIN' in database

## Test Scenario 1: Add Non-Medical Client Sheet

### Steps:
1. Navigate to Admin Panel → Data Sources tab
2. Click "Add Sheet" button
3. Fill form:
   - **Client:** Select a non-medical client (or create one first)
   - **Sheet ID:** Paste your test Google Sheet ID
   - **Sheet Name:** "Q1 2024 Metrics" (or any name)
   - **Tab Names:** "January" (or exact tab names in your sheet)
4. Click "Add Sheet"

### Expected Outcomes:
- ✅ Form disappears
- ✅ New row appears in "Data Sources" list
- ✅ Status shows "PENDING"
- ✅ Audit logs show action "SHEETS_CONFIG_CREATED"

### Database Verification:
```sql
SELECT * FROM sheets_config 
WHERE client_id = '<your-client-id>' 
ORDER BY created_at DESC LIMIT 1;
```

Should show:
- sheetId = your sheet ID
- tabNames = ["January"]
- syncStatus = PENDING

---

## Test Scenario 2: Manual Sync (Non-Medical)

### Prerequisites:
- Complete Test Scenario 1
- Google Sheet must exist and be accessible
- Tab names must match exactly
- GOOGLE_SHEETS_ACCESS_TOKEN must be set

### Steps:
1. In Data Sources table, find your newly added sheet
2. Click "Sync" button
3. Watch status change: PENDING → SYNCING → SUCCESS (or FAILED)

### Expected Outcomes:
- ✅ Status changes to SYNCING
- ✅ Button shows "Syncing..." and is disabled
- ✅ After ~5-15 seconds: Status becomes SUCCESS
- ✅ "Last Synced" shows current timestamp
- ✅ No last error displayed

### Database Verification:
```sql
-- Check metrics were imported
SELECT COUNT(*) as row_count FROM metrics_raw 
WHERE client_id = '<your-client-id>'
AND created_at >= NOW() - INTERVAL '5 minutes';

-- Should be > 0

-- Check sync log
SELECT * FROM audit_logs 
WHERE client_id = '<your-client-id>'
AND action = 'SYNC_COMPLETED'
ORDER BY created_at DESC LIMIT 1;

-- Details should show rowsSynced > 0
```

### Troubleshooting:
- **Status = FAILED:** Check lastError field in Data Sources
- **0 rows synced:** Verify sheet tab names match exactly
- **"Access token not configured":** Set GOOGLE_SHEETS_ACCESS_TOKEN env var

---

## Test Scenario 3: Add Medical Client Sheet

### Prerequisites:
- Medical client must exist with `isMedical = true`
- Create one in Admin Panel → Clients & Sync if needed

### Steps:
1. Click "Add Sheet" in Data Sources
2. Select your **medical client**
3. Fill in sheet details (real medical data sheet)
4. **Note:** Form shows "(Medical - PII will be stripped)" next to client name
5. Click "Add Sheet"

### Expected Outcomes:
- ✅ Sheet config created
- ✅ Status = PENDING

### Database Verification:
```sql
SELECT * FROM sheets_config 
WHERE client_id = (
  SELECT id FROM clients WHERE is_medical = true LIMIT 1
) 
ORDER BY created_at DESC LIMIT 1;
```

---

## Test Scenario 4: Manual Sync with PII Stripping

### Prerequisites:
- Complete Test Scenario 3 (medical sheet config)
- Medical sheet must have columns: "First Name", "Last Name", "Phone", "Email"

### Steps:
1. Click "Sync" on the medical sheet config
2. Wait for status → SUCCESS
3. Check audit logs for PII stripping evidence

### Expected Outcomes:
- ✅ Sync completes successfully
- ✅ Status = SUCCESS
- ✅ Data imported but with PII removed

### Database Verification:
```sql
-- Check that PII was stripped
SELECT * FROM audit_logs 
WHERE client_id = '<medical-client-id>'
AND action = 'PII_STRIPPED'
ORDER BY created_at DESC LIMIT 1;

-- Details should list stripped columns:
-- { "sheetName": "...", "strippedColumns": ["First Name", "Last Name", "Phone", "Email"], "rowCount": 123 }

-- Verify the imported data doesn't have those columns
SELECT * FROM metrics_raw 
WHERE client_id = '<medical-client-id>'
ORDER BY created_at DESC LIMIT 1;

-- raw_data_json should NOT contain First Name, Last Name, Phone, Email values
```

---

## Test Scenario 5: Delete Sheet Config

### Prerequisites:
- At least one sheet config exists

### Steps:
1. Find a sheet config in the Data Sources table
2. Click "Delete" button
3. Confirm the deletion dialog

### Expected Outcomes:
- ✅ Dialog appears asking for confirmation
- ✅ After confirm, row disappears from table
- ✅ Audit log shows action "SHEETS_CONFIG_DELETED"

### Database Verification:
```sql
-- Verify config is gone
SELECT COUNT(*) FROM sheets_config 
WHERE id = '<deleted-config-id>';
-- Should return 0

-- Verify audit log
SELECT * FROM audit_logs 
WHERE action = 'SHEETS_CONFIG_DELETED'
ORDER BY created_at DESC LIMIT 1;
```

---

## Test Scenario 6: API Direct Testing

### Test sheets-config GET
```bash
curl http://localhost:3000/api/admin/sheets-config \
  -H "Authorization: Bearer <your-session-token>"
```

Expected response:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "clientId": "...",
      "sheetId": "1a2b3c...",
      "sheetName": "Q1 2024",
      "tabNames": ["January", "February"],
      "lastSyncedAt": "2024-02-19T10:30:00Z",
      "syncStatus": "SUCCESS",
      "lastError": null,
      "client": {
        "name": "Acme Corp",
        "isMedical": false
      }
    }
  ]
}
```

### Test sync-all endpoint
```bash
curl -X POST http://localhost:3000/api/admin/sync-all
```

Expected response:
```json
{
  "success": true,
  "message": "Synced X of Y clients",
  "summary": {
    "totalClients": 2,
    "successCount": 2,
    "failureCount": 0,
    "totalRowsSynced": 450,
    "totalErrors": 0
  },
  "results": [
    {
      "clientId": "...",
      "success": true,
      "rowsSynced": 225,
      "errors": [],
      "startTime": "2024-02-19T10:30:00Z",
      "endTime": "2024-02-19T10:30:15Z"
    }
  ]
}
```

---

## Test Scenario 7: Error Handling

### Test with invalid sheet ID
1. Add sheet config with fake/invalid sheet ID
2. Click "Sync"
3. Status should become FAILED
4. Last Error should display the error message

**Expected error:** "Failed to read sheet: 404 - Sheet not found"

### Test with wrong tab names
1. Add sheet config with correct sheet ID but wrong tab names
2. Click "Sync"
3. Status should become FAILED

**Expected error:** "Failed to read sheet: 404 - Sheet tab not found"

### Test with invalid Google token
1. Set GOOGLE_SHEETS_ACCESS_TOKEN to a fake/expired token
2. Try to sync
3. Should get error about "invalid_grant" or "unauthorized"

---

## Test Scenario 8: Concurrent Syncs

### Steps:
1. Add multiple sheet configs for the same client
2. Click "Sync" on multiple sheets simultaneously
3. All should show SYNCING status

### Expected Outcomes:
- ✅ All syncs complete independently
- ✅ Each gets its own status and error (if any)
- ✅ No data corruption or race conditions

---

## Monitoring Checklist

After completing all tests, verify:

- [ ] Admin Panel loads without errors
- [ ] Data Sources tab is visible and functional
- [ ] Add sheet form submits correctly
- [ ] Sheet list displays all configs
- [ ] Manual sync triggers successfully
- [ ] Status badges update in real-time
- [ ] Delete button removes configs
- [ ] Audit logs capture all actions
- [ ] Database metrics_raw has imported data
- [ ] Medical clients show PII stripping in audit logs
- [ ] Non-medical clients do NOT have PII stripping
- [ ] Errors are captured and displayed clearly

---

## Performance Notes

- Sync time depends on sheet size: ~10-50 rows/second
- Large sheets (10k+ rows) may take 1-2 minutes
- Network latency affects sync speed (Google Sheets API calls)
- Database upserts are batched for efficiency

---

## Cleanup

After testing, you can:

1. **Keep test data:** Leave sheets and metrics in database for manual review
2. **Delete test data:**
   ```sql
   DELETE FROM metrics_raw WHERE client_id IN (SELECT id FROM clients WHERE name LIKE '%test%');
   DELETE FROM sheets_config WHERE client_id IN (SELECT id FROM clients WHERE name LIKE '%test%');
   DELETE FROM clients WHERE name LIKE '%test%';
   ```

3. **Reset sync status:**
   ```sql
   UPDATE sheets_config SET sync_status = 'PENDING', last_error = NULL;
   ```

---

## Next Steps

Once testing is complete:
1. Configure OpenClaw cron job (see CRON_SETUP.md)
2. Set up Telegram/email notifications for sync results
3. Monitor sync performance in production
4. Consider upgrading to per-user token storage
