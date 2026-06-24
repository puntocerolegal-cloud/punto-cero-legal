# FASE 6 — TECHNICAL REFERENCE

Quick technical reference for implementation details and API specifications.

---

## Backend Endpoints

### Law Firms Management

#### List Firm Lawyers
```
GET /api/organizations/{org_id}/lawyers
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "ObjectId",
      "full_name": "Dr. Name",
      "email": "email@firm.com",
      "specialty": "Corporate",
      "bar_number": "ABC123",
      "status": "ACTIVE",
      "is_verified": true
    }
  ],
  "message": "Abogados de la firma obtenidos (5 total)"
}
```

**Error Responses:**
- 404: Organization not found
- 403: User not authorized (not firm owner or admin)
- 401: No authorization header

---

#### Create Firm Lawyer
```
POST /api/organizations/{org_id}/lawyers
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newlawyer@firm.com",
  "full_name": "Dra. María García",
  "specialty": "Family Law",
  "bar_number": "XYZ789"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "ObjectId",
    "email": "newlawyer@firm.com",
    "full_name": "Dra. María García",
    "role": "lawyer",
    "organizationId": "org_id",
    "status": "PENDING_VERIFICATION",
    "is_verified": false,
    "specialty": "Family Law",
    "bar_number": "XYZ789"
  },
  "message": "Abogado creado exitosamente"
}
```

**Error Responses:**
- 400: Email already registered
- 403: User not authorized
- 404: Organization not found
- 401: No authorization header

---

#### Firm Consolidation Dashboard
```
GET /api/organizations/{org_id}/dashboard
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "firm_id": "ObjectId",
    "firm_name": "García & Asociados",
    "lawyers_count": 5,
    "leads_count": 42,
    "cases_count": 28,
    "commissions_total": 15000.50,
    "lawyers": [
      {
        "_id": "ObjectId",
        "full_name": "Dr. Juan",
        "email": "juan@firm.com"
      }
    ]
  },
  "message": "Dashboard de firma obtenido"
}
```

---

### Commercial Agents

#### Get Agent Leads
```
GET /api/leads
Authorization: Bearer {token}
?status={status_filter}
```

**Query Logic (Internal):**
```python
# Now includes agent_id in addition to lawyer_id
query = {
  "$or": [
    {"lawyer_id": user_id},
    {"agent_id": user_id}
  ]
}
```

**Response:** Same as before (backward compatible)

---

#### Get Agent Commissions
```
GET /api/referrals/agents/{agent_id}/commissions
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "agent_id": "agent_uuid",
  "total_commissions": 5000.00,
  "total_paid": 3000.00,
  "pending": 2000.00,
  "commissions": [
    {
      "_id": "ObjectId",
      "commission_amount": 500.00,
      "paid": true,
      "amount_paid": 500.00,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Error Responses:**
- 403: Agent trying to access other agent's commissions
- 401: No authorization header

---

## Database Schema Changes

### Models Modified

#### Lead Model
```python
class LeadBase(BaseModel):
    lawyer_id: str          # Existing
    agent_id: Optional[str] = None  # NEW in FASE 6
    client_name: str        # Existing
    client_email: EmailStr  # Existing
    client_phone: str       # Existing
    legal_area: str         # Existing
    description: str        # Existing
    status: Literal[...]    # Existing
    source: Optional[str]   # Existing
```

**Migration Notes:**
- No migration needed
- Existing leads have `agent_id: null`
- New leads can have `agent_id` set

---

## Frontend Changes

### Module Registry Update

**Before:**
```javascript
{ key: "sales-room", label: "Sala de Ventas", to: "/admin/sales-room", ... }
```

**After:**
```javascript
{
  key: "sales-room",
  label: "Sala de Ventas",
  to: "/admin/sales-room",
  visibleToRoles: ["admin", "admin_general", "socio_comercial"]
}
```

### Sidebar Filtering

**Filter Chain:**
```javascript
const visible = getOsModules()
  .filter((m) => canAccess(m.requiredFeature))      // Plan entitlement
  .filter((m) => !m.requiresSupportToken || supportActive)  // Token check
  .filter((m) => !m.visibleToRoles || m.visibleToRoles.includes(user?.role));  // NEW
```

---

## Role-Based Module Visibility

### Admin (`admin`)
All 23 modules visible

### Firm Admin (`admin_general`)
```javascript
[
  "cases-portal",
  "analytics",
  "subscriptions",
  "plans",
  "subscription-center",
  "upgrade",
  "billing",
  "commercial-ai",
  "notifications",
  "users",
  "referrals"
]
```

### Commercial Agent (`socio_comercial`)
```javascript
[
  "sales-room",
  "subscription-center",
  "upgrade",
  "commercial-ai",
  "notifications",
  "referrals"
]
```

### Lawyer (`lawyer`)
```javascript
[
  "cases-portal",
  "subscription-center",
  "upgrade",
  "notifications",
  "referrals"
]
```

### Client (`client`)
```javascript
[] // No admin modules
```

---

## Authorization Model

### Firm Lawyer Endpoints

**Authorization Rule:**
```python
if str(org.ownerId) != user_id and user_role not in ["admin", "admin_general"]:
    raise HTTPException(403, "No autorizado")
```

**Meaning:**
- Only firm owner can manage firm's lawyers
- Super admins can manage any firm
- Other users get 403 Forbidden

---

### Agent Commissions Endpoint

**Authorization Rule:**
```python
if current_user_id != agent_id and user_role not in ["admin", "admin_general"]:
    raise HTTPException(403, "No autorizado")
```

**Meaning:**
- Agents see only their own commissions
- Admins can see any agent's commissions
- Other users get 403 Forbidden

---

## Error Handling

### Standard Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Description of success"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": { ... }
}
```

### Common Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input (email exists, etc) |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Authenticated but no permission |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unexpected error |

---

## Performance Considerations

### Indexes to Create (Optional)

```javascript
// For agent lead filtering
db.leads.createIndex({ "agent_id": 1 })
db.leads.createIndex({ "agent_id": 1, "status": 1 })

// For firm queries
db.users.createIndex({ "organizationId": 1, "role": 1 })

// Already exist (FASE 1)
db.users.createIndex({ "organizationId": 1 })
```

### Query Performance

| Query | Indexed? | Notes |
|-------|----------|-------|
| Find leads by lawyer_id | Yes | Already indexed |
| Find leads by agent_id | No (optional) | Single field, low cardinality |
| Find leads by agent_id + status | No (optional) | Compound query optimization |
| Find lawyers by organizationId | Yes | Indexed in FASE 1 |
| Find firm by _id | Yes | Always indexed |

---

## Testing Scenarios

### Scenario 1: Firm Lawyer Management
```bash
# 1. Admin creates organization
POST /api/organizations
{ "name": "García & Asociados", ... }

# 2. Firm owner adds lawyer
POST /api/organizations/{org_id}/lawyers
{ "email": "lawyer@firma.com", "full_name": "Dr. Juan" }

# 3. List firm lawyers
GET /api/organizations/{org_id}/lawyers

# 4. View firm dashboard
GET /api/organizations/{org_id}/dashboard
```

**Expected: Dashboard shows 1 lawyer, 0 leads, 0 cases**

---

### Scenario 2: Agent Lead Assignment
```bash
# 1. Agent logs in, gets their leads
GET /api/leads
# Response: [] (no leads yet)

# 2. Admin assigns lead to agent
PATCH /api/leads/{lead_id}
{ "agent_id": "agent_uuid" }

# 3. Agent checks leads again
GET /api/leads
# Response: [{ lead_id, agent_id: "agent_uuid", ... }]
```

**Expected: Agent sees lead in their list**

---

### Scenario 3: Commission Tracking
```bash
# 1. Agent creates lead → converts to case
# 2. Transaction creates referral with agent_id
# 3. Agent checks commissions
GET /api/referrals/agents/{agent_id}/commissions

# Response: { 
#   total_commissions: 500.00,
#   total_paid: 250.00,
#   pending: 250.00,
#   commissions: [...]
# }
```

**Expected: Commission amounts visible and correct**

---

### Scenario 4: Sidebar Visibility
```javascript
// Admin user
user.role = "admin"
// Sidebar shows: 23 modules

// Firm admin user
user.role = "admin_general"
// Sidebar shows: 11 modules

// Agent user
user.role = "socio_comercial"
// Sidebar shows: 6 modules

// Lawyer user
user.role = "lawyer"
// Sidebar shows: 5 modules
```

**Expected: Correct modules visible per role**

---

## Backward Compatibility Verification

### Check 1: Existing Leads Still Work
```python
# Old code
leads = db.leads.find({"lawyer_id": lawyer_id})

# Still works! agent_id is null for old leads
# Query returns: [{..., agent_id: null}, ...]
```

### Check 2: Independent Lawyers Unaffected
```python
# Lawyer without organizationId (independent)
user = {"_id": "...", "organizationId": null}

# Can still create/query leads
# organizationId not required for leads
```

### Check 3: Sidebar Graceful Degradation
```javascript
// Old module without visibleToRoles
const m = { key: "sales-room", ... }
!m.visibleToRoles || m.visibleToRoles.includes(user.role)
// Evaluates: !undefined || ... → true (visible)
```

---

## Deployment Checklist

- [ ] Backend code changes reviewed
- [ ] Frontend code changes reviewed
- [ ] No database migrations needed
- [ ] No feature flags needed
- [ ] Indexes documented (for later optimization)
- [ ] Error handling tested
- [ ] Authorization verified
- [ ] Backward compatibility confirmed
- [ ] Documentation updated
- [ ] Ready to deploy

---

## Version Info

- **FASE:** 6
- **Implementation Date:** Current
- **Status:** Complete
- **Breaking Changes:** 0
- **Backward Compatible:** Yes
- **Production Ready:** Yes
