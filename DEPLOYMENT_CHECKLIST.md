# Deployment Checklist - Google Sheets Integration

## Pre-Deployment (Development)

- [x] **Code Complete**
  - Backend API endpoints: ✅
  - Frontend UI component: ✅
  - Admin panel integration: ✅

- [x] **Build Verification**
  - TypeScript compilation: ✅ PASSED
  - No errors or warnings: ✅
  - All endpoints registered: ✅

- [x] **Code Quality**
  - Admin auth checks: ✅ (all endpoints)
  - Error handling: ✅
  - Audit logging: ✅
  - Database transactions: ✅

- [x] **Documentation**
  - API contracts: ✅
  - Setup guide: ✅
  - Testing guide: ✅
  - Troubleshooting: ✅

---

## Staging Deployment

### Pre-Deployment Tasks
- [ ] Backup production database
- [ ] Verify staging environment has clean data
- [ ] Set `GOOGLE_SHEETS_ACCESS_TOKEN` in staging .env

### Deployment Steps
1. [ ] Pull latest code
2. [ ] Run `npm install` (if dependencies changed)
3. [ ] Run `npm run build`
4. [ ] Verify build succeeds (0 errors)
5. [ ] Start app: `npm start`
6. [ ] Verify app loads at http://localhost:3000

### Post-Deployment Verification
- [ ] Admin panel loads without errors
- [ ] Data Sources tab visible
- [ ] Can access `/api/admin/sheets-config` endpoint
- [ ] Can access `/api/admin/sync-all` endpoint

### Test Scenarios (Staging)
- [ ] Add test sheet config via UI
- [ ] Verify appears in list
- [ ] Manual sync: click "Sync" button
- [ ] Status changes: PENDING → SYNCING → SUCCESS
- [ ] Check audit logs for SYNC_COMPLETED
- [ ] Delete sheet config
- [ ] Verify data in metrics_raw table

---

## Production Deployment

### Pre-Deployment (Done by DevOps)
- [ ] Backup production database (must-have)
- [ ] Verify all environment variables set:
  - `GOOGLE_SHEETS_ACCESS_TOKEN`
  - `DATABASE_URL`
  - `NEXTAUTH_SECRET`
- [ ] Schedule deployment for low-traffic window (e.g., Sunday morning)

### Deployment Steps
1. [ ] Tag release: `git tag -a v1.1.0-sheets-integration -m "Add Google Sheets integration"`
2. [ ] Push tag: `git push origin v1.1.0-sheets-integration`
3. [ ] Deploy to production:
   ```bash
   git pull
   npm install
   npm run build
   npm start
   ```
4. [ ] Monitor app logs for errors (first 5 minutes)

### Production Verification (First 30 minutes)
- [ ] App loads without errors
- [ ] Admin panel accessible
- [ ] No 500 errors in logs
- [ ] Database connections healthy
- [ ] Manual test sync works
- [ ] Metrics imported successfully

### Post-Production Monitoring (First Week)
- [ ] Check daily for cron job runs
- [ ] Verify data quality in metrics_raw
- [ ] Monitor error logs for PII stripping issues
- [ ] Watch for any failed syncs (check Audit Logs)
- [ ] Check disk space usage (imported data grows weekly)

---

## Cron Job Setup (Production)

### Prerequisites
- [ ] Production dashboard app running (port 3000)
- [ ] GOOGLE_SHEETS_ACCESS_TOKEN set
- [ ] OpenClaw daemon running in main session

### Configuration Steps
1. [ ] Read CRON_SETUP.md
2. [ ] Choose cron implementation (Option A, B, or C)
3. [ ] Configure in appropriate location:
   - Option A: Update HEARTBEAT.md
   - Option B: System crontab
   - Option C: OpenClaw cron subsystem
4. [ ] Test cron (manually call endpoint)
5. [ ] Monitor first scheduled run (Sunday 6 PM CT)

### Cron Verification
- [ ] Check audit logs Monday morning for SYNC_COMPLETED
- [ ] Verify metrics_raw updated with new data
- [ ] No errors in logs
- [ ] All configs marked SUCCESS (or FAILED with error details)

---

## Rollback Plan

If critical issues discovered:

### Immediate Rollback
```bash
# Revert code
git revert <deployment-commit>
npm run build
npm start

# OR use previous release
git checkout v1.0.0
npm run build
npm start
```

### Data Cleanup (if needed)
```bash
# Stop the app first!

# Restore from backup
psql $DATABASE_URL < backup.sql

# OR selective cleanup
DELETE FROM metrics_raw 
WHERE created_at >= '2024-02-19'::date;

DELETE FROM sheets_config 
WHERE created_at >= '2024-02-19'::date;
```

### Notification
- [ ] Slack: Announce rollback
- [ ] Jira: Create incident ticket
- [ ] Team: Post-mortem within 24 hours

---

## Success Metrics

After deployment, target these metrics:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Sync success rate | > 95% | Audit logs |
| Sync time | < 1 min (small sheets) | Timestamps in results |
| Data accuracy | 100% | Manual spot checks |
| PII stripping | 100% for medical | Audit logs |
| Admin UX | No errors | User feedback |
| Cron reliability | 100% | Weekly run verification |

---

## Documentation Handoff

### For Admins
- [ ] Distribute QUICK_REFERENCE.md
- [ ] Distribute TESTING_SHEETS_INTEGRATION.md (relevant sections)
- [ ] Send Slack announcement with link to docs

### For DevOps
- [ ] CRON_SETUP.md
- [ ] DEPLOYMENT_CHECKLIST.md (this file)
- [ ] Production environment config

### For Support
- [ ] QUICK_REFERENCE.md (troubleshooting section)
- [ ] Common issues from TESTING_SHEETS_INTEGRATION.md
- [ ] Contact info for escalation

### For Developers
- [ ] IMPLEMENTATION_SUMMARY.md
- [ ] All code comments and inline documentation
- [ ] Database schema (prisma/schema.prisma)

---

## Future Tasks (Post-Deployment)

### High Priority
- [ ] Configure per-user Google OAuth token storage (see CRON_SETUP.md TODO)
- [ ] Add Telegram/email notifications for sync failures
- [ ] Set up monitoring alerts for failed syncs

### Medium Priority
- [ ] Add column mapping UI for custom metric fields
- [ ] Implement data validation before import
- [ ] Add sheet preview feature

### Low Priority
- [ ] Real-time sync status via WebSocket
- [ ] Manual data correction UI
- [ ] Custom sync schedules per sheet

---

## Contact Information

### Deployment Support
- **DevOps Lead:** [Name]
- **Database Admin:** [Name]
- **Infrastructure:** [Name]

### Product Ownership
- **Feature Owner:** [Name]
- **Backend Lead:** [Name]
- **Frontend Lead:** [Name]

### Support & Escalation
- **On-Call:** [On-call schedule]
- **Slack:** #engineering
- **Issues:** Jira project DASH

---

## Sign-Off

### Implementation Owner
- **Name:** [Subagent]
- **Date:** 2024-02-19
- **Status:** ✅ COMPLETE

### Testing Owner
- **Name:** [To be assigned]
- **Status:** ⏳ PENDING

### Deployment Owner
- **Name:** [DevOps, Michael]
- **Status:** ⏳ PENDING

### Product Owner Sign-Off
- **Name:** [To be assigned]
- **Status:** ⏳ PENDING

---

## Final Notes

1. **No schema migrations needed** - All database tables already exist
2. **Backward compatible** - No breaking changes to existing APIs
3. **Audit trail complete** - All actions logged to audit_logs
4. **Error handling robust** - Failures don't cascade or corrupt data
5. **Admin auth enforced** - All endpoints check user role

**Ready for deployment: YES ✅**

---

## Appendix: Quick Commands

### Development Start
```bash
cd /home/superman/.openclaw/workspace/projects/consulting-dashboard
export GOOGLE_SHEETS_ACCESS_TOKEN="your-token"
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Database Backup (Pre-deployment)
```bash
pg_dump $DATABASE_URL > consulting-dashboard-backup-$(date +%Y%m%d).sql
```

### Verify Endpoints
```bash
curl http://localhost:3000/api/admin/sheets-config
curl -X POST http://localhost:3000/api/admin/sync-all
```

### Monitor Logs
```bash
# Dashboard logs
tail -f /var/log/consulting-dashboard.log

# Audit events
psql $DATABASE_URL -c "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20;"
```

---

**Last Updated:** 2024-02-19  
**Version:** 1.0  
**Status:** Ready for Deployment
