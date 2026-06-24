# FASE 6 — IMPACT REPORT

## Overview
Minimal viable implementation for law firm monetization and agent commercialization. No architecture refactoring. 0 breaking changes. 100% backward compatible.

---

## A. LAW FIRMS (Firmas Jurídicas)

### Task: Utilize existing `organizationId` and add minimal endpoints

**Current State:**
- `organizationId` already exists in `backend/models/user.py:33` (nullable, added in FASE 1)
- Exposed in `/auth/me` response at `backend/routes/auth.py:51`
- Already indexed in database schema via migrations

**New Endpoints Required:**

| Endpoint | Method | Purpose | Auth | Changes |
|----------|--------|---------|------|---------|
| `/api/organizations/{orgId}/lawyers` | GET | List lawyers in firm | Bearer | **NEW route in `organizations.py`** |
| `/api/organizations/{orgId}/lawyers` | POST | Create associated lawyer | Bearer | **NEW route in `organizations.py`** |
| `/api/organizations/{orgId}/dashboard` | GET | Firm consolidation dashboard | Bearer | **NEW route in `organizations.py`** |

**Implementation Details:**

1. **GET `/api/organizations/{orgId}/lawyers`**
   - Query `users` collection where `organizationId == orgId`
   - Filter by role: `lawyer` only
   - Return: list of lawyers with basic info (id, name, email, specialty, bar_number)
   - Authorization: Only firm admin (owner, admin_general) OR super_admin
   - **File to modify:** `backend/routes/organizations.py`

2. **POST `/api/organizations/{orgId}/lawyers`**
   - Input: `{ email, full_name, specialty, bar_number }`
   - Create new user with `role: "lawyer"` and `organizationId: orgId`
   - Set `status: "PENDING_VERIFICATION"` (standard flow)
   - Return: newly created user object
   - Authorization: Only firm admin
   - **File to modify:** `backend/routes/organizations.py`

3. **GET `/api/organizations/{orgId}/dashboard`**
   - Aggregate metrics: total lawyers, total leads, total cases, commissions
   - Query leads where lawyer_id IN (firm lawyers), cases, transactions
   - Return: { lawyers_count, leads_count, cases_count, commissions_total }
   - Authorization: Only firm admin
   - **File to modify:** `backend/routes/organizations.py`

---

## B. COMMERCIAL AGENTS (Agentes Comerciales)

### Task: Reuse existing SalesRoom, extend for leads/clients/commissions

**Current State:**
- SalesRoom exists at `frontend/src/modules/admin/pages/SalesRoomModule.jsx`
- Loads data from `/admin-ops/sales/stats` and `/admin-ops/sales/candidates`
- Backend endpoint exists in `backend/routes/admin_ops.py`
- Leads system exists at `backend/routes/leads.py` (owned by lawyer_id)

**Changes Required:**

1. **Backend: Extend Leads model to support agents**
   - Current: `lawyer_id` field in leads (FASE 1 design)
   - Add: `agent_id` field (nullable) to support agent ownership
   - Query logic: leads where `lawyer_id == user_id` OR `agent_id == user_id`
   - **File to modify:** `backend/models/lead.py` (add optional `agent_id`)
   - **File to modify:** `backend/routes/leads.py` (extend query logic)

2. **Backend: Extend Clients model**
   - Current: clients linked to lawyer via cases
   - Add: minimal clients endpoint that groups by `created_by` or `lawyer_id`
   - **File to modify:** `backend/routes/clients.py` (create if missing, add agent support)

3. **Backend: Commissions endpoint**
   - Reutilize existing referrals/commissions data
   - Create GET `/api/agents/{agentId}/commissions`
   - Query transactions where `agent_id == agentId` OR referral-based
   - **File to modify:** `backend/routes/referrals.py` (add agent commission logic)

4. **Frontend: SalesRoom remains unchanged**
   - No visual changes
   - Sidebar filtering handles role-based visibility
   - Existing KPIs and charts work as-is

---

## C. SIDEBAR INTELLIGENT VISIBILITY (Sidebar Inteligente)

### Task: Implement dynamic role-based visibility for 5 user types

**Current State:**
- Sidebar: `frontend/src/components/layout/Sidebar.jsx`
- Module Registry: `frontend/src/core/registry/moduleRegistry.js`
- Uses `canAccess()` from `useEntitlement` hook (plan-based filtering)
- Filters by `requiresSupportToken` for technical routes

**Visibility Map (No route changes needed):**

| Module | Admin OS | Firm Admin | Agent | Partner | Independent Lawyer |
|--------|----------|-----------|-------|---------|---------------------|
| Punto Cero System OS | ✓ | ✗ | ✗ | ✗ | ✗ |
| Control Maestro | ✓ | ✗ | ✗ | ✗ | ✗ |
| Portal de Casos | ✓ | ✓ | ✗ | ✗ | ✓ |
| Sala de Ventas | ✓ | ✓ | ✓ | ✓ | ✗ |
| Segmentación por Países | ✓ | ✗ | ✗ | ✗ | ✗ |
| Suscripciones | ✓ | ✓ | ✗ | ✗ | ✗ |
| Planes | ✓ | ✓ | ✗ | ✗ | ✗ |
| Centro de Suscripción | ✓ | ✓ | ✓ | ✓ | ✓ |
| Actualizar Plan | ✓ | ✓ | ✓ | ✓ | ✓ |
| Facturación | ✓ | ✓ | ✗ | ✗ | ✗ |
| IA Comercial | ✓ | ✗ | ✓ | ✓ | ✗ |
| Notificaciones | ✓ | ✓ | ✓ | ✓ | ✓ |
| Socios Comerciales | ✓ | ✓ | ✗ | ✗ | ✗ |
| Organizaciones | ✓ | ✗ | ✗ | ✗ | ✗ |
| Usuarios | ✓ | ✓ | ✗ | ✗ | ✗ |
| Referidos | ✓ | ✓ | ✓ | ✓ | ✓ |
| Implementaciones | ✓ | ✗ | ✗ | ✗ | ✗ |
| Verticales | ✓ | ✗ | ✗ | ✗ | ✗ |
| Roles | ✓ | ✗ | ✗ | ✗ | ✗ |
| Permisos | ✓ | ✗ | ✗ | ✗ | ✗ |
| Inventario SaaS | ✓ | ✗ | ✗ | ✗ | ✗ |
| Seguridad | ✓ | ✗ | ✗ | ✗ | ✗ |
| Accesos de Soporte | ✓ | ✗ | ✗ | ✗ | ✗ |
| Analytics | ✓ | ✓ | ✗ | ✗ | ✗ |

**Implementation Strategy:**
1. Add `visibleToRoles` property to each module in `moduleRegistry.js`
2. In `SidebarNav.jsx`, add filter: `visible.filter(m => m.visibleToRoles.includes(user.role))`
3. No route changes, no file moves, no layout changes

---

## File Change Summary

### Backend Files to Modify:

| File | Changes | Impact | Breaking? |
|------|---------|--------|-----------|
| `backend/models/lead.py` | Add `agent_id: Optional[str]` field | Leads can now be owned by agents | No (nullable) |
| `backend/routes/leads.py` | Extend query to support agent_id filtering | Agents can query their leads | No (additive) |
| `backend/routes/organizations.py` | Add 3 new endpoints (list lawyers, create lawyer, dashboard) | Firms can manage lawyers | No (new endpoints) |
| `backend/routes/clients.py` | Add agent support to client queries | Agents see their clients | No (additive) |
| `backend/routes/referrals.py` | Add agent commission queries | Agents see commissions | No (additive) |

### Frontend Files to Modify:

| File | Changes | Impact | Breaking? |
|------|---------|--------|-----------|
| `frontend/src/core/registry/moduleRegistry.js` | Add `visibleToRoles` to each module | Sidebar filters by role | No (additive) |
| `frontend/src/components/layout/Sidebar.jsx` | Add role-based filtering logic | Sidebar visibility dynamic | No (extends existing filter) |

### No Changes Required:
- AdminModule.jsx (routes unchanged)
- AdminOSLayout.jsx (layout unchanged)
- SalesRoomModule.jsx (no changes)
- Any component files (no moves)
- Design/CSS (no visual changes)

---

## Backward Compatibility Checklist

- ✓ Existing lawyers with `organizationId: null` → independent (no change)
- ✓ Existing leads with `lawyer_id` only → backward compatible (agent_id optional)
- ✓ Existing sidebar filtering by plan → still works (new role filter is additive)
- ✓ Existing user auth flow → unchanged (organizationId already exposed)
- ✓ Existing routes → all preserved
- ✓ Existing modules → no visual/layout changes
- ✓ Existing admin flows → unchanged

---

## Risk Assessment

**Low Risk Items:**
- Adding nullable fields to models ✓
- Adding new endpoints ✓
- Adding role-based filtering to sidebar ✓

**Mitigation:**
- All new fields are optional/nullable
- All new endpoints follow existing patterns
- All filtering is read-only

---

## Summary

**Total Files to Modify:** 7
- Backend: 5 files
- Frontend: 2 files

**New Endpoints:** 3
**New Fields:** 1 (agent_id in leads)
**New Filters:** 1 (role-based visibility in sidebar)
**Breaking Changes:** 0
**Visual Changes:** 0
**Route Changes:** 0
**File Moves:** 0

**Estimated Complexity:** Low
**Estimated Time:** 4-6 hours
**Confidence in Backward Compatibility:** 100%
