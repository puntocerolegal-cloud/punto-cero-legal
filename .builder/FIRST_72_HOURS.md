# RELEASE 1.0 — FIRST 72 HOURS MONITORING
**Date:** 2026-07-07  
**Duration:** Hour 1 → Hour 72 (3 days)  
**Status:** MONITORING PROCEDURES  

---

## EXECUTIVE SUMMARY

**Critical period:** First 72 hours post-launch  
**Team required:** 1 DevOps engineer (on-call), 1 support person  
**Update frequency:** Continuous logs, hourly manual checks  
**Escalation threshold:** See section "When to Alert"  

---

## PHASE 1: FIRST HOUR (Hours 0-1)

### Immediate Deployment Tasks

**At T+0 (Deployment starts):**
- [ ] Monitor Render build logs in real-time
- [ ] Watch for "Application startup complete"
- [ ] Verify no 500 errors in logs

**At T+5 min:**
- [ ] Smoke Test 1-4: Health, Register, Login, Auth
- [ ] Verify database connection
- [ ] Check JWT handling

**At T+10 min:**
- [ ] Smoke Test 5-7: Firm, Case, Document
- [ ] Verify tenant isolation
- [ ] Check file upload

**At T+20 min:**
- [ ] Smoke Test 8-12: AI, Usage, Payment, Email, Logs
- [ ] Full end-to-end flow

**At T+30 min:**
- [ ] Complete all smoke tests (must PASS)
- [ ] Notify team: "Go-live approved"
- [ ] Enable monitoring dashboards

**At T+60 min:**
- [ ] First manual health check
- [ ] Review first batch of logs
- [ ] Verify no regressions

### Metrics to Watch (Hour 1)

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| Response time | < 500ms | 500-2000ms | > 2000ms |
| Error rate | < 1% | 1-5% | > 5% |
| Memory usage | < 300MB | 300-450MB | > 450MB |
| CPU usage | < 30% | 30-70% | > 70% |
| 500 errors | 0 | 1-5 | > 5 |
| Database latency | < 100ms | 100-500ms | > 500ms |

---

## PHASE 2: FIRST 8 HOURS (Hours 1-8)

### Hourly Checks

**Every hour:**
1. Check Render logs for errors
2. Verify health endpoint
3. Monitor resource usage (CPU, memory)
4. Check error rate
5. Look for patterns in errors

**Checklist per hour:**
- [ ] No new 500 errors
- [ ] Response times < 1 second (normal)
- [ ] Memory < 400MB
- [ ] CPU < 50%
- [ ] Logs show normal operations

### Key Events to Monitor

**First 30 minutes:**
- Payment flows (test webhook if possible)
- Email sending (from payment confirmations)
- AI requests (Gemini API responsiveness)
- Database indexes (from migrations)

**Hour 1-4:**
- Concurrent users (simulate traffic if possible)
- Rate limiting (slowapi working?)
- JWT expiration (token refreshing?)
- Tenant isolation (headers being enforced?)

**Hour 4-8:**
- Scheduled jobs (if any)
- Cron tasks (notifications, renewals)
- Background processes (none currently, but monitor)

### Resources to Monitor

**Render Dashboard:**
- Real-time logs
- Memory/CPU graphs
- Request count
- Response time graph
- Error logs

**MongoDB Atlas:**
- Connection count
- Query performance
- Index usage
- Network I/O

**Gmail:**
- Sent emails count (if sending alerts)
- Bounced emails
- Failed sends

---

## PHASE 3: FIRST DAY (Hours 8-24)

### 8-Hour Checks

- [ ] Summary of errors from 0-8h
- [ ] Any patterns identified?
- [ ] User feedback received?
- [ ] Performance stable?
- [ ] Any spikes or anomalies?

### Daily Tasks (Day 1)

**Morning (Hour 0-12):**
- [ ] Monitor logs continuously
- [ ] Stand-by for user reports
- [ ] Watch AI endpoint (Gemini API load)
- [ ] Watch payment webhook (timing issues?)
- [ ] Watch email sending (SMTP reliability)

**Evening (Hour 12-24):**
- [ ] Check database size growth
- [ ] Verify backups running (MongoDB Atlas)
- [ ] Review error logs for patterns
- [ ] Performance summary
- [ ] Prepare Day 2 checklist

### Metrics Summary (After 24h)

Record these metrics:

```
FIRST 24 HOURS SUMMARY:
- Total requests: ___
- Successful (200): ___%
- Errors (4xx): ___%
- Errors (5xx): ___%
- Average response time: ___ms
- Peak memory: ___MB
- Peak CPU: ___%
- Unique users: ___
- Failed transactions: ___
- Failed emails: ___
- Total data written: ___MB
```

---

## PHASE 4: DAYS 2-3 (Hours 24-72)

### Daily Checklist

**Each morning:**
- [ ] Review logs from previous 24h
- [ ] Check for new errors or patterns
- [ ] Verify backup completed
- [ ] Check database size (growth rate normal?)
- [ ] Review metrics summary

**Each evening:**
- [ ] Prepare incident report (if any issues)
- [ ] Update monitoring alerts
- [ ] Adjust thresholds if needed
- [ ] Brief team on status

### Specific Events to Monitor (Days 2-3)

**Day 2 focus:**
- Billing cycle processing (if scheduled)
- Subscription renewals
- Long-running users (session persistence)
- Peak hour traffic patterns
- Cache effectiveness

**Day 3 focus:**
- Weekend traffic (if applicable)
- 72-hour stability (no memory leaks?)
- Error trend analysis
- Feature usage patterns
- Performance baseline established

---

## CRITICAL THRESHOLDS: WHEN TO ALERT

### 🔴 IMMEDIATE ESCALATION (Alert now)

**Stop the world — this requires immediate action:**

| Issue | Threshold | Action |
|-------|-----------|--------|
| App won't start | Any 500 on `/api/health` | ROLLBACK |
| Database unavailable | No MongoDB connection | ROLLBACK |
| Authentication broken | > 20% 401 errors | ROLLBACK |
| Widespread 500s | > 50 errors/hour | ROLLBACK |
| Memory leak detected | > 500MB used | Restart service |
| Complete payment failure | > 3 consecutive failures | Alert team |
| All emails failing | > 50% send failures | Alert team |

**When to rollback (see ROLLBACK_PLAN.md):**
- App crashes on startup
- Database unreachable
- Authentication completely broken
- > 50% of requests return 5xx errors
- Complete feature outage (e.g., all payments fail)

### 🟡 WATCH & REPORT (Alert within 30 min)

| Issue | Threshold | Action |
|-------|-----------|--------|
| High error rate | > 5% requests are errors | Monitor trend |
| Slow responses | > 2 sec average latency | Check DB query |
| Memory growing | > 50MB per hour | Monitor for leak |
| CPU spiking | > 80% sustained | Check for loop |
| Rate limit hit | > 10 users rate-limited | Monitor usage |

**Report to team:**
- Screenshot of metric
- Timeline of when it started
- Current status (still happening?)
- Potential causes
- Recommended action

### 🟢 NORMAL (Log and move on)

| Metric | Normal Range |
|--------|--------------|
| Response time | 100-1000ms |
| Error rate | < 2% |
| Memory usage | 200-400MB |
| CPU usage | 10-60% |
| Requests/min | < 100 |
| Rate limit hits | 0-5/hour |
| Email failures | < 2/hour |

---

## ISSUE RESPONSE GUIDE

### If seeing 500 errors:

```
1. Check error logs: What's the error message?
2. Is it widespread (all requests) or specific (one endpoint)?
3. If widespread → ROLLBACK
4. If specific → Debug that endpoint
5. Possible causes:
   - Database connection lost
   - Missing environment variable
   - Unhandled exception
   - Third-party API down
```

### If database is slow:

```
1. Check MongoDB CPU in Atlas dashboard
2. Run slow query log analysis
3. Verify indexes are being used
4. Check for large table scans
5. Possible causes:
   - Missing index
   - Full collection scan
   - External connection spike
```

### If payments are failing:

```
1. Check MP webhook logs
2. Verify MP_ACCESS_TOKEN is correct
3. Check webhook URL in MP dashboard
4. Verify APP_PUBLIC_URL is set
5. Possible causes:
   - Token expired
   - Webhook URL wrong
   - Network timeout
   - API version mismatch
```

### If emails not sending:

```
1. Check SMTP logs in Render
2. Verify SMTP_USER and SMTP_PASS
3. Test Gmail credentials locally
4. Check Gmail "App passwords" (not regular password)
5. Possible causes:
   - Wrong password
   - Gmail security block
   - Network timeout
   - SMTP port blocked
```

### If AI responses are slow:

```
1. Check Gemini API status
2. Verify GEMINI_API_KEY is valid
3. Check token usage quota
4. Monitor API response times
5. Possible causes:
   - Gemini API down/slow
   - Large conversations (token count)
   - Claude fallback active (slower)
   - Network latency
```

---

## MONITORING DASHBOARDS

### Render Dashboard

**Check every hour:**
- Logs → Filter by ERROR
- Metrics → CPU, Memory graph
- Events → Any deployments/errors

### MongoDB Atlas

**Check every 4 hours:**
- Network → Ops/sec, latency
- Databases → Storage usage
- Alerts → Any triggered?

### Gmail Monitoring

**Check every 8 hours (if email critical):**
- Google Workspace Admin → Gmail → Security
- Gmail admin → Reports
- Check bounce rate, failed sends

---

## INCIDENT RESPONSE ESCALATION

### Level 1 (On-call engineer)

**Can handle:**
- Configuration issues (env vars)
- Simple rollback
- Restarting service
- Monitoring alerts

**Call Level 2 if:**
- Needs code changes
- Database-level issue
- Third-party API issue

### Level 2 (Lead engineer)

**Can handle:**
- Code debugging
- Hot fixes
- Architecture review
- Third-party coordination

**Call Level 3 if:**
- Major incident (> 30 min downtime)
- Data corruption suspected
- Security issue
- Need external help

### Level 3 (Management)

**Handles:**
- Customer communication
- Executive updates
- External coordination
- Post-incident review

---

## 72-HOUR COMPLETION CHECKLIST

**After 72 hours, assess:**

- [ ] No 500 errors in last 24h
- [ ] Response times < 1 sec
- [ ] Error rate < 2%
- [ ] Memory stable (not growing)
- [ ] No unexplained CPU spikes
- [ ] Database performing well
- [ ] Payments processing normally
- [ ] Emails sending normally
- [ ] AI responding normally
- [ ] No security issues detected
- [ ] Data integrity verified
- [ ] Backups are working
- [ ] Logs are clean (no warnings)
- [ ] Monitoring alerts configured
- [ ] Team trained on escalation

**If all checks pass:**
- ✅ GRADUATION TO NORMAL OPERATIONS
- Enable extended monitoring (automated)
- Reduce on-call presence to normal
- Schedule post-launch review

**If any checks fail:**
- 🔴 Investigate before graduation
- Keep enhanced monitoring
- Schedule followup review
- Plan fixes for Release 1.1

---

## TEMPLATE: HOURLY STATUS REPORT

```
╔═══════════════════════════════════════════════════════════════╗
║ PUNTO CERO LEGAL — RELEASE 1.0 HOURLY STATUS                 ║
║ Hour: X-Y (Report time: HH:MM)                                 ║
╚═══════════════════════════════════════════════════════════════╝

📊 METRICS:
  Response time: ___ms (prev hour: ___ms)  ✅/⚠️
  Error rate: _._% (prev hour: _._%)  ✅/⚠️
  Memory: ___MB / 512MB (utilization: _._%)  ✅/⚠️
  CPU: _._% (peak: _._%)  ✅/⚠️
  Requests: ___ (avg ___ req/min)  ✅/⚠️

🔴 CRITICAL ISSUES:
  [none reported / list any]

🟡 WARNINGS:
  [none reported / list any]

✅ OPERATIONAL NOTES:
  [Any interesting observations]

👥 USERS ACTIVE:
  Current: ___ | Total: ___

💰 PAYMENT ACTIVITY:
  Success: ___ | Failed: ___ | Pending: ___

📧 EMAIL ACTIVITY:
  Sent: ___ | Failed: ___ | Bounced: ___

🤖 AI ACTIVITY:
  Requests: ___ | Avg latency: ___ms

🗄️ DATABASE:
  Connections: ___ | Ops/sec: ___ | Avg latency: ___ms

🚨 ESCALATIONS:
  [none / describe if any]

SIGNED: _________________________ Time: ________
```

---

## NEXT STEP

At Hour 72 (if all checks pass):
→ See `.builder/RELEASE_GO_NO_GO.md` for final decision

---

**Status:** First 72 hours monitoring procedures documented.  
**Ready to monitor after launch.**
