# RELEASE 1.0 — DATABASE MIGRATIONS
**Date:** 2026-07-07  
**Status:** AUDIT ONLY (NO EXECUTION YET)  
**Scope:** All MongoDB migrations for production  

---

## EXECUTIVE SUMMARY

**Total migrations:** 3  
**Order:** Fixed sequence (must run in order)  
**Safety:** All idempotent (safe to run multiple times)  
**Estimated time:** 5-10 minutes total  
**Risk level:** LOW (read-heavy, only adds indexes and fields)  

---

## MIGRATION CATALOG

### MIGRATION 1: 001_add_organization_support

**File:** `backend/migrations/001_add_organization_support.py`  
**Sequence:** RUN FIRST  
**Status:** Idempotent ✅  

**Purpose:** Add organization support to users (preparation for multi-tenant)

**What it does:**
1. Creates sparse index on `users.organizationId`
2. Validates no conflicts exist
3. Logs migration status

**Collections affected:**
- `users` — adds index only (no data changes)
- `migrations_log` — tracks migration status

**Execution:**
```bash
python -m backend.migrations.001_add_organization_support --apply
```

**Rollback:**
```bash
python -m backend.migrations.001_add_organization_support --rollback
```

**Time:** < 1 minute  
**Risk:** MINIMAL (adds index, no data modifications)

**Verification:**
```bash
python -m backend.migrations.001_add_organization_support --status
# Expected output: "001_add_organization_support: APPLIED"
```

---

### MIGRATION 2: 002_align_tenant_fields

**File:** `backend/migrations/002_align_tenant_fields.py`  
**Sequence:** RUN SECOND  
**Status:** Idempotent ✅  

**Purpose:** Align `firm_id` and `tenant_id` on all user records (blocker from RC audit)

**What it does:**
1. Scans all users
2. For each user, if missing `firm_id` or `tenant_id`:
   - Copies present field to missing field
3. Reports users with neither (audit action required)
4. Logs migration status

**Collections affected:**
- `users` — modifies up to N records
- `migrations_log` — tracks migration status

**Execution:**
```bash
python -m backend.migrations.002_align_tenant_fields --apply
```

**Status check:**
```bash
python -m backend.migrations.002_align_tenant_fields --status
# Expected output: 
# 002_align_tenant_fields: APPLIED
# Applied at: 2026-07-07T...
# Changes: {
#   'total_users': N,
#   'aligned': M,
#   'updated': K,
#   'missing_both': 0  # Should be 0 or documented
# }
```

**Time:** 1-2 minutes (depends on user count)  
**Risk:** LOW (only copies existing values)  
**Data safety:** No deletions, only copies within record

**Possible outcome:**
- ✅ All users aligned (ideal)
- ⚠️ Some users `missing_both` (requires manual review in Mongo)

**If users are missing both:**
Action: Manually set `firm_id` and `tenant_id` for affected users
```bash
# In MongoDB shell:
db.users.updateOne(
  {"_id": ObjectId("...")},
  {"$set": {"firm_id": "...", "tenant_id": "..."}}
)
```

---

### MIGRATION 3: run_migration.py (AI Security Hardening Indexes)

**File:** `backend/migrations/run_migration.py`  
**Sequence:** RUN THIRD  
**Status:** Idempotent ✅  

**Purpose:** Create MongoDB indexes for AI, rate limiting, SOC, conversation logging

**What it does:**
Creates 13 indexes across 5 collections:

| Collection | Index | Purpose |
|-----------|-------|---------|
| **ai_sessions** | session_id | Quick lookup by session ID |
| | (owner_user_id, tenant_id) | Isolation by user + tenant |
| | (tenant_id, updated_at DESC) | Recent sessions per tenant |
| | (session_id, owner_user_id) | Ownership validation |
| **ai_usage** | (user_id, period) UNIQUE | Rate limiting, unique constraint |
| | (tenant_id, period) | Multi-tenant usage tracking |
| **rate_limit_logs** | (user_id, timestamp DESC) | User rate limit history |
| | (tenant_id, severity) | Security event filtering |
| **soc_events** | (user_id, timestamp DESC) | Security event search |
| | (event_type, severity) | Event filtering for dashboard |
| **ai_conversation_logs** | (user_id, timestamp DESC) | Conversation history |
| | (tenant_id, timestamp DESC) | Tenant isolation in logs |

**Execution:**
```bash
python backend/migrations/run_migration.py
```

**Output:**
- ✓ Lists all indexes created
- ✗ Lists any failures (with errors)
- Summarizes results

**Time:** 2-5 minutes (depends on existing data)  
**Risk:** MINIMAL (indexes don't modify data)  
**Performance impact:** Index creation may temporarily increase Mongo CPU

**Verification:**
```bash
# MongoDB shell:
db.ai_sessions.getIndexes()
# Should show all 4 indexes

db.ai_usage.getIndexes()
# Should show all 2 indexes (one UNIQUE)
```

**Important notes:**
- If index already exists, creation is skipped (idempotent)
- If index fails, logged but doesn't block other indexes
- Safe to run multiple times

---

## MIGRATION EXECUTION SEQUENCE

### Phase 1: Pre-Migration Checks (Before running any migrations)

**Checklist:**
- [ ] MongoDB connection verified: `mongodb+srv://...`
- [ ] MONGO_URL environment variable set
- [ ] DB_NAME environment variable set to `puntocero_legal`
- [ ] Write permissions confirmed (can create indexes)
- [ ] Backup of MongoDB taken (optional but recommended for production)
- [ ] Migration scripts are available in `backend/migrations/`

**Quick test:**
```bash
python -c "from pymongo import MongoClient; c = MongoClient('$MONGO_URL'); print(c.server_info())"
# Should print MongoDB version info
```

---

### Phase 2: Execute Migrations (In exact order)

#### Step 1: Run Migration 001
```bash
cd backend
python -m migrations.001_add_organization_support --apply

# Expected:
# [timestamp] Iniciando 001_add_organization_support...
# → Creando índice en users.organizationId...
# → Usuarios sin organizationId: N (esperado: N)
# [timestamp] 001_add_organization_support aplicada exitosamente.
```

**Verify:**
```bash
python -m migrations.001_add_organization_support --status
# Should output: "001_add_organization_support: APPLIED"
```

---

#### Step 2: Run Migration 002
```bash
cd backend
python -m migrations.002_align_tenant_fields --apply

# Expected:
# [timestamp] Iniciando 002_align_tenant_fields...
# → Total usuarios: N
# → Con firm_id y tenant_id: M
# → Actualizados en esta pasada: K
# → Sin ninguno (requerirán acción manual): 0
# [timestamp] 002_align_tenant_fields aplicada exitosamente.
```

**Verify:**
```bash
python -m migrations.002_align_tenant_fields --status
# Should output: "002_align_tenant_fields: APPLIED"
# With changes summary
```

**If any users have `missing_both`:**
```bash
# The output will list them:
# ⚠️ ACCIÓN REQUERIDA: N usuarios sin firma/tenant:
#   - <user_id_1>
#   - <user_id_2>

# Manually fix:
db.users.updateOne({"_id": ObjectId("<user_id_1>")}, {"$set": {"firm_id": "xxx", "tenant_id": "yyy"}})
```

---

#### Step 3: Run Migration 003 (Indexes)
```bash
cd backend
python migrations/run_migration.py

# Expected:
# Connecting to MongoDB: mongodb+srv://...
# Database: puntocero_legal
# ✓ Connected to MongoDB
#
# MIGRATION: AI Security Hardening
# ============================================================
# Creating indexes for ai_sessions collection...
#   ✓ Created index on ai_sessions.session_id
#   ✓ Created index on ai_sessions(owner_user_id, tenant_id)
#   ✓ Created index on ai_sessions(tenant_id, updated_at)
#   ✓ Created index on ai_sessions(session_id, owner_user_id)
#
# Creating indexes for ai_usage collection...
#   ✓ Created UNIQUE index on ai_usage(user_id, period)
#   ✓ Created index on ai_usage(tenant_id, period)
#
# ... (more collections) ...
#
# MIGRATION RESULTS
# ============================================================
# ✓ Indexes created: 13
#   • ai_sessions.session_id
#   • ai_sessions(owner_user_id, tenant_id)
#   ... (all indexes) ...
#
# ============================================================
# ✓ MIGRATION COMPLETE - ALL INDEXES CREATED
# ============================================================
```

---

### Phase 3: Post-Migration Verification

#### Check all migrations applied:
```bash
# In MongoDB shell:
db.migrations_log.find()

# Expected:
# {
#   "_id": ObjectId(...),
#   "name": "001_add_organization_support",
#   "applied_at": ISODate(...),
#   "status": "applied",
#   ...
# }
# {
#   "_id": ObjectId(...),
#   "name": "002_align_tenant_fields",
#   "applied_at": ISODate(...),
#   "status": "applied",
#   ...
# }
```

#### Verify indexes exist:
```bash
# In MongoDB shell:
db.ai_sessions.getIndexes()  # Should have 4 indexes + _id_
db.ai_usage.getIndexes()     # Should have 2 indexes + _id_
db.soc_events.getIndexes()   # Should have 2 indexes + _id_
```

#### Check tenant alignment:
```bash
# In MongoDB shell:
db.users.countDocuments({"firm_id": {$exists: false}})  # Should be 0
db.users.countDocuments({"tenant_id": {$exists: false}})  # Should be 0
```

**If either returns > 0:** Some users need manual alignment (see above)

---

## ROLLBACK PROCEDURES

### If Migration 001 fails:
```bash
python -m migrations.001_add_organization_support --rollback

# This will:
# 1. Drop the index
# 2. Log rollback status
# 3. Return to pre-migration state
```

### If Migration 002 fails:
⚠️ **Cannot automatically rollback** (would require tracking which records were updated)

**Manual recovery:**
1. Check MongoDB for last good backup
2. Restore from backup if needed
3. Run migration again (idempotent)

### If Migration 003 fails:
Individual indexes can be dropped and recreated:
```bash
# In MongoDB shell:
db.ai_sessions.dropIndex("session_id_1")
db.ai_sessions.dropIndex("owner_user_id_1_tenant_id_1")
# ... drop all failed indexes ...

# Then re-run: python migrations/run_migration.py
```

---

## SAFETY GUARANTEES

✅ **Idempotent:** All migrations can be run multiple times safely  
✅ **No data loss:** Only adds indexes and copies existing values  
✅ **Reversible:** Migrations 001 can be rolled back; 002/003 use index creation  
✅ **Transactional:** Each index creation is atomic in MongoDB  
✅ **Non-blocking:** Can run while app is live (indexes created in background)  

---

## MIGRATION DEPENDENCIES

```
Migration 001 ─────────────────┐
(Add organization index)        │
                                ├──> Migration 002 ─┐
                                │    (Align tenants)│
                                │                   ├──> Migration 003
                                │                   │    (Create indexes)
                                │                   │
                                └───────────────────┘
```

**Execution must be sequential** (not parallel)

---

## TIMING EXPECTATIONS

| Migration | Count | Estimated Time |
|-----------|-------|-----------------|
| 001 | N/A | < 1 min |
| 002 | 1000 users | 1-2 min |
| 002 | 10000 users | 3-5 min |
| 002 | 100000 users | 10-15 min |
| 003 (13 indexes) | N/A | 2-5 min |
| **Total** | **1000 users** | **5-10 min** |
| **Total** | **10000 users** | **10-15 min** |

**Do not interrupt migrations while running.**

---

## PRODUCTION DEPLOYMENT CHECKLIST

Before running migrations:

- [ ] Backup MongoDB (Atlas: automated, or manual export)
- [ ] Test migration locally first (or on staging)
- [ ] Notify team: "Migrations running for 10-15 minutes"
- [ ] Schedule during low-traffic period (if possible)
- [ ] Monitor MongoDB CPU during index creation

After running migrations:

- [ ] All 3 migrations report APPLIED
- [ ] No users with `missing_both` (or manually fixed)
- [ ] All 13 indexes visible in MongoDB
- [ ] App still healthy: `/api/health` returns 200

---

## NEXT STEP

After migrations are verified in production:
→ See `.builder/RENDER_DEPLOY_GUIDE.md` for Render configuration

---

**Status:** Migrations audit complete.  
**Ready for production execution when scheduled.**
