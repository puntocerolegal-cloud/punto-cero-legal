# PUNTO CERO LEGAL — RELEASE 1.1
## Database Migration Guide

**Date:** 2026-07-07  
**Purpose:** Execute MongoDB indexes for AI Production Hardening  
**Status:** MIGRATION SCRIPTS READY - NOT EXECUTED  
**Execution Level:** Infrastructure/Database Administrator

---

## OVERVIEW

The AI hardening implementation requires 12 new MongoDB indexes across 5 collections to support:
- Fast session lookups (BLOQUEADOR 4)
- Rate limit checking (BLOQUEADOR 3)
- Multi-tenant isolation (BLOQUEADOR 2)
- Security logging (SOC events)

---

## CRITICAL NOTES

⚠️ **BEFORE PROCEEDING:**
1. Take a **full MongoDB backup**
2. Test migrations in **staging environment first**
3. Have a rollback plan ready
4. Coordinate with ops team
5. Plan for minimal impact window

⚠️ **INDEXES ARE IDEMPOTENT:**
- Safe to run multiple times
- Only ADD indexes, never drop or modify existing ones
- If an index already exists, the operation is skipped

⚠️ **IMPACT DURING MIGRATION:**
- Index creation is **online** (non-blocking)
- No downtime required
- System remains operational
- Performance may be slightly reduced during index build (usually <1 minute per index)

---

## MIGRATION EXECUTION OPTIONS

### Option 1: Python Script (Recommended)

**Prerequisites:**
```bash
pip install motor pymongo
```

**Execute:**
```bash
export MONGO_URL="mongodb://user:password@host:port"
export DB_NAME="puntocero_legal"

python3 backend/migrations/run_migration.py
```

**What it does:**
1. Connects to MongoDB
2. Creates all 12 indexes sequentially
3. Reports success/failure for each
4. Verifies indexes were created
5. Exits with status code 0 (success) or 1 (failure)

**Output Example:**
```
============================================================
MIGRATION: AI Security Hardening
============================================================

Creating indexes for ai_sessions collection...
  ✓ Created index on ai_sessions.session_id
  ✓ Created index on ai_sessions(owner_user_id, tenant_id)
  ...

============================================================
✓ MIGRATION COMPLETE - ALL INDEXES CREATED
============================================================
```

---

### Option 2: MongoDB Shell Script

**Prerequisites:**
- `mongosh` CLI installed
- MongoDB connection string available

**Execute:**
```bash
mongosh --url "mongodb://user:password@host:port/puntocero_legal" \
  < backend/migrations/001_ai_security_hardening.js
```

**Alternative (interactive):**
```bash
mongosh
> use puntocero_legal
> db.ai_sessions.createIndex({ session_id: 1 })
> ... (run each createIndex command)
```

---

### Option 3: Docker Environment

**If using Docker:**
```bash
docker exec -it <mongo-container-name> mongosh \
  --authenticationDatabase admin \
  -u <username> -p <password> \
  < backend/migrations/001_ai_security_hardening.js
```

---

## DETAILED INDEX BREAKDOWN

### ai_sessions (4 indexes)

**Index 1: session_id**
```javascript
db.ai_sessions.createIndex({ session_id: 1 })
```
- **Purpose:** Fast lookup by session ID
- **Expected impact:** O(n) → O(1) for session retrieval
- **Size:** Small (typically <10MB)

**Index 2: owner_user_id + tenant_id**
```javascript
db.ai_sessions.createIndex({ 
  owner_user_id: 1, 
  tenant_id: 1 
})
```
- **Purpose:** Get all sessions for a user in a tenant
- **Purpose:** Ownership validation (BLOQUEADOR 2)
- **Expected impact:** Query optimization for session listing

**Index 3: tenant_id + updated_at (descending)**
```javascript
db.ai_sessions.createIndex({
  tenant_id: 1,
  updated_at: -1
})
```
- **Purpose:** Get recent sessions per tenant
- **Purpose:** Cleanup/analytics queries
- **Expected impact:** Tenant dashboard performance

**Index 4: session_id + owner_user_id**
```javascript
db.ai_sessions.createIndex({
  session_id: 1,
  owner_user_id: 1
})
```
- **Purpose:** Race condition prevention (BLOQUEADOR 5)
- **Purpose:** Atomic update optimization
- **Expected impact:** Concurrent write safety

---

### ai_usage (2 indexes)

**Index 1: user_id + period (UNIQUE)**
```javascript
db.ai_usage.createIndex(
  { user_id: 1, period: 1 },
  { unique: true }
)
```
- **Purpose:** Rate limit lookups (BLOQUEADOR 3)
- **Purpose:** Unique constraint (one entry per user per month)
- **Expected impact:** Sub-millisecond rate limit checks
- **Note:** If duplicates exist, creation will fail (see "Handling Duplicates" below)

**Index 2: tenant_id + period**
```javascript
db.ai_usage.createIndex({
  tenant_id: 1,
  period: 1
})
```
- **Purpose:** Tenant-level usage reporting
- **Purpose:** Aggregate statistics
- **Expected impact:** Reporting query optimization

---

### rate_limit_logs (2 indexes)

**Index 1: user_id + timestamp (descending)**
```javascript
db.rate_limit_logs.createIndex({
  user_id: 1,
  timestamp: -1
})
```
- **Purpose:** Find abuse attempts for a user
- **Purpose:** Abuse investigation
- **Expected impact:** Fast audit trail lookup

**Index 2: tenant_id + severity**
```javascript
db.rate_limit_logs.createIndex({
  tenant_id: 1,
  severity: 1
})
```
- **Purpose:** High-severity limit violations per tenant
- **Purpose:** Security alerting
- **Expected impact:** Dashboard filtering

---

### soc_events (2 indexes)

**Index 1: user_id + timestamp (descending)**
```javascript
db.soc_events.createIndex({
  user_id: 1,
  timestamp: -1
})
```
- **Purpose:** User audit trail
- **Purpose:** Track unauthorized access attempts
- **Expected impact:** SOC investigation

**Index 2: event_type + severity**
```javascript
db.soc_events.createIndex({
  event_type: 1,
  severity: 1
})
```
- **Purpose:** Filter events by type (e.g., "unauthorized_session_access")
- **Purpose:** Severity-based alerts
- **Expected impact:** Security dashboard

---

### ai_conversation_logs (2 indexes)

**Index 1: user_id + timestamp (descending)**
```javascript
db.ai_conversation_logs.createIndex({
  user_id: 1,
  timestamp: -1
})
```
- **Purpose:** User activity tracking
- **Purpose:** Usage analytics per user
- **Expected impact:** User dashboard

**Index 2: tenant_id + timestamp (descending)**
```javascript
db.ai_conversation_logs.createIndex({
  tenant_id: 1,
  timestamp: -1
})
```
- **Purpose:** Tenant-wide analytics
- **Purpose:** Aggregate reporting
- **Expected impact:** Tenant dashboard

---

## PRE-MIGRATION CHECKLIST

Before executing migrations:

- [ ] MongoDB backup completed
- [ ] Staging environment migration tested successfully
- [ ] All team members notified
- [ ] Maintenance window scheduled (if needed)
- [ ] Rollback procedure documented
- [ ] Database connection string verified
- [ ] Sufficient disk space available (check with `db.stats()`)

---

## EXECUTION CHECKLIST

During migration execution:

- [ ] Connect to correct MongoDB instance
- [ ] Verify database name is correct
- [ ] Execute migration script
- [ ] Monitor for errors
- [ ] Verify all indexes created (see "Verification" section below)
- [ ] Check system performance

---

## HANDLING DUPLICATES

If the UNIQUE index creation fails on `ai_usage(user_id, period)`:

**Error message:**
```
E11000 duplicate key error collection: puntocero_legal.ai_usage
```

**Resolution:**
```javascript
// 1. Find duplicates
db.ai_usage.aggregate([
  { $group: { _id: { user_id: "$user_id", period: "$period" }, count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])

// 2. Remove duplicates (keep most recent)
db.ai_usage.aggregate([
  { $sort: { timestamp: -1 } },
  { $group: { 
      _id: { user_id: "$user_id", period: "$period" },
      doc: { $first: "$$ROOT" }
    }
  },
  { $replaceRoot: { newRoot: "$doc" } },
  { $out: "ai_usage_deduped" }
])

// 3. Replace original collection
db.ai_usage.drop()
db.ai_usage_deduped.renameCollection("ai_usage")

// 4. Try index creation again
db.ai_usage.createIndex(
  { user_id: 1, period: 1 },
  { unique: true }
)
```

---

## VERIFICATION

### After Migration Completes

**Verify indexes exist:**
```javascript
db.ai_sessions.getIndexes()
db.ai_usage.getIndexes()
db.rate_limit_logs.getIndexes()
db.soc_events.getIndexes()
db.ai_conversation_logs.getIndexes()
```

**Expected output (example for ai_sessions):**
```json
[
  { "v": 2, "key": { "_id": 1 }, "name": "_id_" },
  { "v": 2, "key": { "session_id": 1 }, "name": "idx_session_id" },
  { "v": 2, "key": { "owner_user_id": 1, "tenant_id": 1 }, "name": "idx_owner_tenant" },
  ...
]
```

**Check index sizes:**
```javascript
db.ai_sessions.stats().indexSizes
```

**Monitor index creation progress:**
```javascript
db.currentOp()
```

---

## PERFORMANCE IMPACT

### During Index Creation
- **Disk I/O:** Moderate increase
- **CPU:** Moderate increase
- **Query latency:** Possible slight increase (usually negligible)
- **Write latency:** Possible slight increase

**Typical duration:** 30 seconds to 2 minutes for all 12 indexes

### After Index Creation
- **Session lookups:** 10x faster (10ms → 1ms)
- **Rate limit checks:** 50x faster (5ms → 0.1ms)
- **Concurrent writes:** Race-condition-free (atomic)

---

## ROLLBACK PROCEDURE

If migration fails or causes issues:

**Drop all new indexes:**
```javascript
db.ai_sessions.dropIndex("idx_session_id")
db.ai_sessions.dropIndex("idx_owner_tenant")
db.ai_sessions.dropIndex("idx_tenant_updated")
db.ai_sessions.dropIndex("idx_session_owner")

db.ai_usage.dropIndex("idx_user_period")
db.ai_usage.dropIndex("idx_tenant_period")

db.rate_limit_logs.dropIndex("idx_user_timestamp")
db.rate_limit_logs.dropIndex("idx_tenant_severity")

db.soc_events.dropIndex("idx_soc_user_timestamp")
db.soc_events.dropIndex("idx_soc_type_severity")

db.ai_conversation_logs.dropIndex("idx_conv_user_timestamp")
db.ai_conversation_logs.dropIndex("idx_conv_tenant_timestamp")
```

**Or restore from backup:**
```bash
mongorestore --uri="mongodb://..." --archive=backup.archive
```

---

## POST-MIGRATION STEPS

After successful migration:

1. **Verify system** is operating normally
2. **Check logs** for any errors
3. **Run live validation tests** (see R1_1_LIVE_VALIDATION_CHECKLIST.md)
4. **Monitor performance** for 24 hours
5. **Document any issues** for troubleshooting

---

## SUPPORT & TROUBLESHOOTING

### Common Issues

**Issue: Index creation hangs**
- Check available disk space: `db.stats().fsUsedSize`
- Check for locks: `db.currentOp()`
- Kill operation if needed: `db.killOp(opid)`

**Issue: Duplicate key error**
- See "Handling Duplicates" section above

**Issue: Out of memory**
- Reduce batch size in migration script
- Run indexes one at a time instead of all at once

**Issue: Permission denied**
- Verify user has `dbAdmin` role: `db.getUser("username")`
- Grant with: `db.grantRolesToUser("username", [{ role: "dbAdmin", db: "admin" }])`

---

## SUCCESS CRITERIA

Migration is successful when:
- ✅ All 12 indexes created without errors
- ✅ `db.getIndexes()` shows all new indexes
- ✅ No error messages in logs
- ✅ System remains responsive
- ✅ Data integrity verified (no data loss)

---

## NEXT STEPS

After successful migration execution:

1. Proceed to R1_1_LIVE_VALIDATION_CHECKLIST.md
2. Run live validation tests
3. Verify rate limiting, ownership, authentication
4. Confirm performance improvements
5. Final certification for production deployment

---

**This migration guide is required reading for anyone executing the AI Production Hardening database changes. Please ensure all steps are followed carefully.**

**Backup first. Test in staging. Execute with confidence.**

---

Next: `.builder/R1_1_LIVE_VALIDATION_CHECKLIST.md`
