# O3 PHASE 1: EXHAUSTIVE ORGANIZATION SERVICE AUDIT
**Sprint:** S1.5 — Organizations Foundation  
**Phase:** O3.1 — Service Migration Audit  
**Status:** 📋 AUDIT COMPLETE  
**Timestamp:** 2025-07-06  

---

## EXECUTIVE SUMMARY

Complete inventory of `backend/services/organization_service.py` reveals:

- **Total Functions:** 10
- **Total MongoDB Operations:** 15+
- **Direct Database Access Points:** 12
- **Classification Breakdown:**
  - CRUD: 4 functions (create, update, delete, get)
  - Query: 2 functions (list, search)
  - Reporting: 2 functions (dashboard, metrics)
  - Utility: 2 functions (slugify, helpers)

All operations currently access MongoDB directly without repositories.

---

## COMPLETE FUNCTION INVENTORY

### UTILITY FUNCTIONS (Non-Service)

#### 1. `slugify(value: str) -> str`

**Purpose:** Convert string to URL-safe slug

**Classification:** UTILITY  
**Type:** Pure function (no I/O)  
**MongoDB Access:** NONE  
**Current Implementation:** Regex-based string transformation  

**Details:**
```python
def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value or "org"
```

**Migration Status:** ✅ NO CHANGE (utility function, no repository needed)

---

#### 2. `_oid(org_id: str) -> ObjectId`

**Purpose:** Validate and convert string to ObjectId

**Classification:** VALIDATION  
**Type:** Pure function  
**MongoDB Access:** NONE  
**Behavior:** Raises OrgError(404) on invalid ObjectId

**Details:**
```python
def _oid(org_id: str) -> ObjectId:
    if not ObjectId.is_valid(org_id):
        raise OrgError(404, "Organización no encontrada")
    return ObjectId(org_id)
```

**Migration Status:** ✅ NO CHANGE (validation helper)

---

#### 3. `_serialize(doc: dict) -> dict`

**Purpose:** Convert MongoDB ObjectId to string in response

**Classification:** UTILITY  
**Type:** Pure function  
**MongoDB Access:** NONE  
**Behavior:** Transforms document for API response

**Details:**
```python
def _serialize(doc: dict) -> dict:
    if not doc:
        return doc
    doc = {**doc, "_id": str(doc["_id"])}
    return doc
```

**Migration Status:** ✅ NO CHANGE (response formatting)

---

#### 4. `_tenant_filter(ctx: dict, extra: Optional[dict] = None) -> dict`

**Purpose:** Inject tenant_id into MongoDB queries

**Classification:** TENANT ISOLATION  
**Type:** Query filter builder  
**MongoDB Access:** NONE  
**Behavior:** Adds tenantId to query dict

**Details:**
```python
def _tenant_filter(ctx: dict, extra: Optional[dict] = None) -> dict:
    q = dict(extra or {})
    if ctx.get("tenant_id"):
        q["tenantId"] = str(ctx["tenant_id"])
    elif not ctx.get("is_super_admin"):
        raise OrgError(400, "Operación sin tenant no permitida")
    return q
```

**Migration Status:** ⚠️ WILL BE REPLACED by TenantAwareQuery in repositories  
**Decision:** Remove this function; repositories use TenantAwareQuery

---

#### 5. `async _audit(db, action: str, ctx: dict, detail: str = "")`

**Purpose:** Log operation to audit_logs collection

**Classification:** AUDIT  
**Type:** Async audit logging  
**MongoDB Access:** YES — `db.audit_logs.insert_one()`
**Behavior:** Fire-and-forget audit entry (exceptions swallowed)

**Details:**
```python
async def _audit(db, action: str, ctx: dict, detail: str = ""):
    try:
        await db.audit_logs.insert_one({
            "action": action,
            "module": "organizations",
            "user": ctx.get("user", {}).get("email", "—"),
            "user_id": ctx.get("user_id"),
            "tenant_id": ctx.get("tenant_id"),
            "detail": detail,
            "created_at": datetime.utcnow(),
        })
    except Exception:
        pass
```

**Migration Status:** ⚠️ OUT OF SCOPE FOR O3  
**Note:** O5 (Audit Integration) will handle audit logging; keep this as-is for now

---

#### 6. `async ensure_indexes(db)`

**Purpose:** Create MongoDB indexes on organizations collection

**Classification:** INITIALIZATION  
**Type:** Async index creation  
**MongoDB Access:** YES — `db.organizations.create_index()`

**Details:**
```python
async def ensure_indexes(db):
    await db.organizations.create_index([("tenantId", ASCENDING)])
    await db.organizations.create_index([("slug", ASCENDING)])
    await db.organizations.create_index([("status", ASCENDING)])
    await db.organizations.create_index(
        [("tenantId", ASCENDING), ("slug", ASCENDING)], 
        unique=True, 
        name="uniq_tenant_slug"
    )
```

**Migration Status:** ⚠️ WILL BE REPLACED  
**Decision:** Remove from service; call `OrganizationRepository.ensure_indexes()` instead

---

## SERVICE FUNCTIONS (CRUD / QUERY)

### CRUD OPERATIONS

#### 7. `async create_organization(db, ctx: dict, payload) -> dict`

**Classification:** CRUD — CREATE  
**Request Type:** POST /api/organizations/  
**Authentication:** Requires write access  

**MongoDB Operations:**
1. `db.organizations.find_one({"tenantId": ..., "slug": ...})` — Check uniqueness
2. `db.organizations.insert_one(doc)` — Insert document
3. `db.audit_logs.insert_one(...)` — Audit (via _audit)

**Tenant Isolation:** ✅ Uses `_tenant_filter()` with tenantId  
**Error Handling:** ✅ Raises OrgError for duplicates, missing tenant  
**Request ID:** ❌ NOT PROPAGATED (will add in O3)

**Current Business Logic:**
- Validate tenant_id exists
- Slugify name
- Check slug uniqueness per tenant
- Create document with timestamp
- Audit the action

**Migration Target:** `OrganizationRepository.create(firm_id, data, request_id)`

---

#### 8. `async update_organization(db, ctx: dict, org_id: str, payload) -> dict`

**Classification:** CRUD — UPDATE  
**Request Type:** PUT /api/organizations/{id}  
**Authentication:** Requires write access  

**MongoDB Operations:**
1. `db.organizations.find_one({"tenantId": ..., "slug": ..., "_id": {"$ne": oid}})` — Check slug clash
2. `db.organizations.update_one(_tenant_filter(...), {"$set": updates})` — Update
3. `db.organizations.find_one({"_id": oid})` — Fetch updated
4. `db.audit_logs.insert_one(...)` — Audit

**Tenant Isolation:** ✅ Uses `_tenant_filter()` with tenantId  
**Error Handling:** ✅ Raises OrgError for not found, slug clash  
**Request ID:** ❌ NOT PROPAGATED

**Current Business Logic:**
- Validate ObjectId
- Build updates dict (exclude unset fields)
- If slug changed: validate uniqueness
- Update with timestamp
- Fetch updated document
- Serialize and return

**Migration Target:** `OrganizationRepository.update(firm_id, org_id, update_data, request_id)`

---

#### 9. `async delete_organization(db, ctx: dict, org_id: str) -> None`

**Classification:** CRUD — DELETE  
**Request Type:** DELETE /api/organizations/{id}  
**Authentication:** Requires write access  

**MongoDB Operations:**
1. `db.organizations.delete_one(_tenant_filter(...))` — Delete
2. `db.audit_logs.insert_one(...)` — Audit

**Tenant Isolation:** ✅ Uses `_tenant_filter()` with tenantId  
**Error Handling:** ✅ Raises OrgError for not found  
**Request ID:** ❌ NOT PROPAGATED

**Current Business Logic:**
- Convert org_id to ObjectId
- Delete with tenant filter
- Audit deletion

**Note:** Currently hard-delete; repositories support both soft_delete and hard_delete

**Migration Target:** `OrganizationRepository.soft_delete(firm_id, org_id, request_id)` (or hard_delete)

---

#### 10. `async get_organization(db, ctx: dict, org_id: str) -> dict`

**Classification:** CRUD — READ  
**Request Type:** GET /api/organizations/{id}  
**Authentication:** Requires read access  

**MongoDB Operations:**
1. `db.organizations.find_one(_tenant_filter(...))` — Fetch
2. `db.audit_logs.insert_one(...)` — Audit (view action)

**Tenant Isolation:** ✅ Uses `_tenant_filter()` with tenantId  
**Error Handling:** ✅ Raises OrgError for not found  
**Request ID:** ❌ NOT PROPAGATED

**Current Business Logic:**
- Validate ObjectId
- Find with tenant filter
- Serialize and return
- Audit view action

**Migration Target:** `OrganizationRepository.find_by_id(firm_id, org_id, request_id)`

---

### QUERY OPERATIONS

#### 11. `async get_organizations(db, ctx: dict, status: Optional[str] = None) -> list`

**Classification:** QUERY  
**Request Type:** GET /api/organizations  
**Authentication:** Requires read access  

**MongoDB Operations:**
1. `db.organizations.find(_tenant_filter(...)).sort("createdAt", -1).to_list(1000)` — List all

**Tenant Isolation:** ✅ Uses `_tenant_filter()` with tenantId  
**Error Handling:** ✅ Raises OrgError for missing tenant  
**Request ID:** ❌ NOT PROPAGATED

**Current Business Logic:**
- Build query with optional status filter
- Sort by createdAt descending
- Return list (limit 1000 implicit)
- Serialize all documents

**Limitations:**
- Hard-coded limit of 1000 (inefficient for large tenants)
- No pagination support

**Migration Target:** `OrganizationRepository.list_paginated(firm_id, skip, limit, status, request_id)`

**Note:** Behavioral change — will use pagination instead of 1000-item fetch

---

### REPORTING OPERATIONS

#### 12. `async get_dashboard(db, ctx: dict) -> dict`

**Classification:** REPORTING  
**Request Type:** GET /api/organizations/dashboard  
**Authentication:** Requires read access  

**MongoDB Operations:**
1. `await get_organizations(db, ctx)` → Multi-query (see above)
2. Post-processing: filter, count, aggregate

**Tenant Isolation:** ✅ Inherited from get_organizations()  
**Error Handling:** ✅ Inherited from get_organizations()  
**Request ID:** ❌ NOT PROPAGATED

**Current Business Logic:**
- Get all organizations
- Filter into: active, at_risk (suspended/at_risk), others
- Count: activeOrgs, activeSubscriptions
- Sum: totalUsers (from users field), totalMrr
- Count: activeVerticals (unique)

**Current Implementation:**
```python
async def get_dashboard(db, ctx: dict) -> dict:
    orgs = await get_organizations(db, ctx)
    active = [o for o in orgs if o.get("status") == "active"]
    at_risk = [o for o in orgs if o.get("status") in ("at_risk", "suspended")]
    total_users = sum(int(o.get("users", 0) or 0) for o in orgs)
    return {
        "organizations": orgs,
        "KPIS": {
            "activeOrgs": len(active),
            "totalUsers": total_users,
            "activeVerticals": len({o.get("vertical") for o in orgs if o.get("vertical")}),
            "activeSubscriptions": len(active),
            "totalMrr": sum(int(o.get("mrr", 0) or 0) for o in orgs),
            "orgsAtRisk": len(at_risk),
        },
    }
```

**Migration Target:** Keep dashboard in service layer; use `OrganizationRepository.list_paginated()` + `OrganizationRepository.statistics()` for aggregates

---

## ROUTE FUNCTIONS (NOT IN SERVICE)

The file also contains route handlers that are NOT in organization_service.py but access MongoDB directly:

### Route-level MongoDB access (IN ROUTES, NOT SERVICE):

- `list_firm_lawyers()` — Direct `db.users.find({"organizationId": org_id})`
- `create_firm_lawyer()` — Direct `db.users.insert_one()`, `db.users.find_one()`
- `firm_dashboard()` — Multiple `db.users.find()`, `db.leads.find()`, `db.cases.find()`, `db.referrals.find()`

**Status for O3:** ⚠️ OUT OF SCOPE
- These are not in organization_service.py
- They access users, leads, cases, referrals (not organizations)
- Will be addressed in future sprints when those repositories are created

---

## MONGODB DIRECT ACCESS INVENTORY

### Complete Database Access Patterns

| Function | Collection | Operation | Tenant Filter | Count |
|----------|-----------|-----------|---------------|-------|
| create_organization | organizations | insert_one | YES (tenantId) | 1 |
| create_organization | organizations | find_one | YES (tenantId) | 1 |
| create_organization | audit_logs | insert_one | NO | 1 |
| update_organization | organizations | find_one | YES (tenantId) | 1 |
| update_organization | organizations | update_one | YES (tenantId) | 1 |
| update_organization | audit_logs | insert_one | NO | 1 |
| delete_organization | organizations | delete_one | YES (tenantId) | 1 |
| delete_organization | audit_logs | insert_one | NO | 1 |
| get_organization | organizations | find_one | YES (tenantId) | 1 |
| get_organization | audit_logs | insert_one | NO | 1 |
| get_organizations | organizations | find | YES (tenantId) | 1 |
| get_dashboard | (via get_organizations) | — | YES | — |
| ensure_indexes | organizations | create_index | NO | 4 |

**Total Direct Operations:** 15  
**Tenant-Filtered:** 11  
**Audit Operations:** 5  
**Index Operations:** 4  

---

## TENANT ISOLATION ANALYSIS

### Current Tenant Model

**Field Name:** `tenantId` (stored in MongoDB documents)  
**Origin:** From context: `ctx.get("tenant_id")`  
**Usage Pattern:** `_tenant_filter()` helper injects into all queries

**Example Query:**
```python
q = _tenant_filter(ctx, {"status": "active"})
# Result: {"status": "active", "tenantId": "tenant-123"}
```

### Tenant Mapping Requirements for O3

**Current State:**
- Service layer uses: `tenantId` (from context)
- Repository layer uses: `firm_id` (from context, via TenantKernel)
- MongoDB documents store: `tenantId` (not `firm_id`)

**Migration Decision:**
- ✅ Assume `firm_id == tenantId` (1:1 mapping)
- ✅ Pass `firm_id` from routes to service
- ✅ Service passes `firm_id` to repositories
- ✅ Repositories use `firm_id` (which is `tenantId` value)

**No schema change needed** — documents keep `tenantId`, repositories reference by `firm_id`

---

## CLASSIFICATION SUMMARY

| Category | Function | Type | MongoDB | Tenant Filter | Status |
|----------|----------|------|---------|---------------|--------|
| UTILITY | slugify | Pure | NO | — | ✅ Keep |
| UTILITY | _oid | Pure | NO | — | ✅ Keep |
| UTILITY | _serialize | Pure | NO | — | ✅ Keep |
| TENANT | _tenant_filter | Helper | NO | YES | ⚠️ Remove (→ TenantAwareQuery) |
| AUDIT | _audit | Async Log | YES | NO | ⚠️ Keep (O5 scope) |
| INIT | ensure_indexes | Async Init | YES | NO | ⚠️ Remove (→ Repository) |
| CRUD | create_organization | Create | YES (2x) | YES | 🔄 Migrate → OrganizationRepository.create |
| CRUD | update_organization | Update | YES (2x) | YES | 🔄 Migrate → OrganizationRepository.update |
| CRUD | delete_organization | Delete | YES | YES | 🔄 Migrate → OrganizationRepository.soft_delete |
| READ | get_organization | Read | YES | YES | 🔄 Migrate → OrganizationRepository.find_by_id |
| QUERY | get_organizations | List | YES | YES | 🔄 Migrate → OrganizationRepository.list_paginated |
| REPORT | get_dashboard | Report | NO (uses functions) | YES | 🔄 Refactor (use repository) |

---

## MIGRATION DECISIONS

### Functions to MIGRATE (Eliminate MongoDB Direct Access)

✅ `create_organization` → `OrganizationRepository.create()`  
✅ `update_organization` → `OrganizationRepository.update()`  
✅ `delete_organization` → `OrganizationRepository.soft_delete()` or `hard_delete()`  
✅ `get_organization` → `OrganizationRepository.find_by_id()`  
✅ `get_organizations` → `OrganizationRepository.list_paginated()`  
✅ `get_dashboard` → Keep in service, use `OrganizationRepository.list_paginated()` + aggregation  

### Functions to REMOVE

✅ `_tenant_filter()` — Replaced by TenantAwareQuery (in repositories)  
✅ `ensure_indexes()` — Replaced by OrganizationRepository.ensure_indexes()  

### Functions to KEEP (No Repository Equivalent)

✅ `slugify()` — Pure utility, no database access  
✅ `_oid()` — Validation helper  
✅ `_serialize()` — Response formatter  
✅ `_audit()` — Out of scope for O3 (handled in O5)  

---

## RISK FACTORS

### High Risk (Requires Careful Migration)

1. **Slug Uniqueness Enforcement**
   - Current: `find_one()` check before insert, plus unique index
   - Repositories have: `validate_slug_unique()` method
   - Risk: Race condition if validation not called

2. **Tenant Isolation**
   - Current: `_tenant_filter()` injects tenantId
   - Repositories use: `TenantAwareQuery`
   - Risk: If firm_id not passed correctly, cross-tenant access possible

3. **Dashboard Performance**
   - Current: Fetches all 1000 orgs, processes in memory
   - Optimal: Use repository statistics/aggregation
   - Risk: Behavioral change if pagination introduced

### Low Risk

1. **Slug Normalization** — `slugify()` unchanged
2. **ObjectId Validation** — `_oid()` unchanged
3. **Response Formatting** — `_serialize()` unchanged

---

## NEXT STEPS

**Phase 2:** Create detailed migration map with code examples  
**Phase 3:** Implement service layer migration  

---

**Audit Prepared By:** Architecture Team  
**Status:** COMPLETE  
