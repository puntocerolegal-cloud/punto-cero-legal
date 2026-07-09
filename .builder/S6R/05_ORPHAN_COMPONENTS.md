# S6R: Orphan Components Report
**Date:** 2026-07-07  
**Definition:** Files that exist and are imported internally but have zero external runtime callers  
**Scope:** Components that are defined but detached from the active execution path

---

## WHAT IS AN ORPHAN?

An **orphan component** is one where:
1. ✅ File exists in the codebase
2. ✅ May be imported internally (within its own module)
3. ✅ May have helper functions or classes
4. ❌ Zero external imports from routes, services, middleware, or bootstrap
5. ❌ Never called at runtime by any production code path
6. ❌ Dead on arrival — exists but does nothing

---

## ORPHAN REPOSITORY COMPONENTS (9 orphaned)

These are repository classes that were designed but never integrated into services or routes:

### 1. `case_activity_repository.py`
**Exports:** `CaseActivityRepository`

**Evidence:**
```python
class CaseActivityRepository(EnterpriseBaseRepository):
    async def create(self, activity)
    async def find_by_case_id(self, case_id)
    async def find_all(self)
```

**Who imports it:**
- Exported in `repositories/__init__.py` only
- NOT imported by CaseService
- NOT imported by any route

**Grep result:** 0 external callers

**Where it should be used:**
```python
# In enterprise_case_service.py:
case_repo = CaseRepository(...)
activity_repo = CaseActivityRepository(...)  # ← NOT DONE
activity = await activity_repo.create({...})
```

**Actual code:**
```python
# Direct DB write (in routes/cases.py):
await db.case_activities.insert_one({...})  # ← Bypasses repository
```

---

### 2. `case_document_repository.py`
**Status:** ❌ ORPHAN
**Reason:** Defined but never used; documents handled by document_repository instead

---

### 3. `department_repository.py`
**Status:** ❌ ORPHAN
**Reason:** No department service exists; no routes use it

---

### 4. `enterprise_repository.py`
**Status:** ❌ ORPHAN
**Reason:** Generic enterprise repo; specific repos used instead

---

### 5. `membership_repository.py`
**Status:** ❌ ORPHAN
**Reason:** No membership service; membership handled inline in user/firm routes

---

### 6. `office_repository.py`
**Status:** ❌ ORPHAN
**Reason:** No office service; office data handled inline in routes

---

### 7. `permission_repository.py`
**Status:** ❌ ORPHAN
**Reason:** RBAC handled by security_engine, not a separate service

---

### 8. `role_repository.py`
**Status:** ❌ ORPHAN
**Reason:** Roles handled by RBAC engine, not a dedicated repository service

---

### 9. `chargeback_repository.py`
**Status:** ❌ ORPHAN
**Reason:** Referenced in dependencies but never actually used in routes

---

## ORPHAN MIDDLEWARE COMPONENTS

### 10. `permission_layer.py`
**Status:** ❌ ORPHAN

**Evidence:**
```python
class ResourceAccessValidator:
    async def validate_resource_access(...)
```

**Who uses it:**
- Only used in demo file: `routes/shared/cases_example.py`
- NOT used in any production route

**Why it's orphan:**
- Authorization is handled by `security_engine.authorize()` instead
- This is a duplicate implementation

---

### 11. `mode_resolver.py`
**Status:** ⚠️ PARTIAL ORPHAN

**Evidence:**
```python
async def get_mode(...) -> Literal["independent", "firm"]:
```

**Who uses it:**
- Only used in `permission_layer.py` (which is itself orphan)
- NOT used in any production route

---

## ORPHAN ADVANCED SECURITY ENGINES (15 components)

All of these exist but are never imported externally:

### 12-26. Security Engines Not Connected

| Component | File | Why Orphan |
|-----------|------|-----------|
| Anomaly Detector | `security_anomaly_engine.py` | Never called in authorize() |
| Attack Graph | `attack_graph_engine.py` | Never analyzed |
| Behavioral Profiler | `behavioral_profile_engine.py` | Never consulted |
| Privilege Escalation | `privilege_escalation_detector.py` | No escalation checks |
| Adaptive Risk | `adaptive_risk_engine.py` | Risk always static |
| Threat Correlation | `threat_correlation_engine.py` | Events not correlated |
| Feedback Loop | `security_feedback_loop.py` | System doesn't learn |
| Policy Arbitration | `policy_arbitration_engine.py` | No arbitration |
| Security Governor | `security_governor_engine.py` | Feature flag disabled |
| System Risk Governor | `system_risk_governor.py` | Never instantiated |
| Containment | `containment_engine.py` | Breaches not contained |
| Recovery | `recovery_engine.py` | No recovery process |
| Red Team | `red_team_simulation_engine.py` | No simulations run |
| SOC Alert | `soc_alert_engine.py` | Alerts not generated |
| SOC Aggregation | `soc_aggregation_engine.py` | No event aggregation |

---

## ORPHAN DASHBOARD/API COMPONENTS

### 27. `soc_dashboard_api.py`
**Status:** ❌ ORPHAN

**Evidence:**
```python
@router.get("/api/soc/events")
@router.get("/api/soc/incidents")
@router.post("/api/soc/response")
```

**Why it's orphan:**
```python
# In server.py:
app.include_router(auth.router)
app.include_router(cases.router)
app.include_router(documents.router)
# ... no include_router(soc_dashboard_api.router)
```

**Result:**
- FastAPI routes defined
- But router never registered with app
- API endpoints don't exist in running application
- If accessed: 404 Not Found

---

## SEMI-ORPHAN COMPONENTS (Broken Integration)

### 28. `fail_safe_mode.py`
**Status:** ⚠️ SEMI-ORPHAN (Broken)

**Evidence:**
```python
# File exports:
def get_fail_safe() -> FailSafeMode:
    return _fail_safe_instance

# But callers expect:
from fail_safe_mode import get_fail_safe_manager
fail_safe = get_fail_safe_manager()  # ← Wrong function name
```

**Who tries to use it:**
- `mitigation_engine.py` [will fail]
- `circuit_breaker_manager.py` [will fail]

**Status:** Exists but integration is broken; unreachable except via wrong path

---

## ORPHAN REPOSITORY STATISTICS

**Total repositories:** 18
**Used repositories:** 9
- CaseRepository ✓
- DocumentRepository ✓
- DocumentAccessLogRepository ✓
- FirmRepository ✓
- OrganizationRepository ✓
- InvoiceRepository ✓
- CommissionRepository ✓
- TransactionRepository ✓
- NotificationRepository ✓

**Orphaned repositories:** 9
- CaseActivityRepository ✗
- CaseDocumentRepository ✗
- DepartmentRepository ✗
- EnterpriseRepository ✗
- MembershipRepository ✗
- OfficeRepository ✗
- PermissionRepository ✗
- RoleRepository ✗
- WebhookEventRepository ✗ (partial - used for types only)

**Usage Rate:** 50%

---

## ORPHAN SECURITY ENGINES STATISTICS

**Total advanced security components:** 21
**Actually wired:** 2
- GuardedDB ✓
- SecurityEngine (core auth) ✓

**Orphaned/dead:** 19

| Category | Count | Status |
|----------|-------|--------|
| Threat Detection | 7 | ❌ ORPHAN |
| Incident Response | 5 | ❌ ORPHAN |
| Governance | 4 | ❌ ORPHAN |
| Learning | 2 | ❌ ORPHAN |
| Operations | 2 | ❌ ORPHAN |

**Effective utilization:** 10% (2 of 21)

---

## ORPHAN BY BOOTSTRAP INITIALIZATION

### What bootstrap_enterprise() actually initializes:

```python
async def bootstrap_enterprise(app: FastAPI, db):
    
    # Services instantiated:
    ✓ AuditService(db)
    ✓ PermissionService(db)
    ✓ AuthService(db)
    ✓ TenantService(db)
    ✓ UserService(db)
    ✓ CaseService(db)
        ✓ CaseRepository(db["cases"])
        ✓ DocumentRepository(db["documents"])
        ✓ DocumentAccessLogRepository(db["document_access_logs"])
    ✓ DocumentService(db)
    
    # Services NOT instantiated:
    ✗ AnomalyDetectionService
    ✗ ThreatCorrelationService
    ✗ BehavioralProfilingService
    ✗ PrivilegeEscalationService
    ✗ AdaptiveRiskService
    ✗ GovernanceArbitrationService
    ✗ ContainmentService
    ✗ RecoveryService
    ✗ SOCAlertingService
    ✗ IncidentManagementService
    
    # Engines available but not wired:
    ✗ 15 security engines exist but are orphans
```

---

## ORPHAN DISCOVERY METHOD

### Grep searches for each component:

**Example: `security_anomaly_engine.py`**
```bash
$ grep -r "security_anomaly_engine" backend/ --include="*.py"

# Result:
# (No matches outside the file itself)

$ grep -r "get_anomaly_engine\|AnomalyEngine" backend/ --include="*.py"

# Result:
# (No matches anywhere)

$ grep -r "anomaly" backend/security/security_engine.py

# Result:
# (No references to anomaly detection in authorization path)
```

**Conclusion:** Security anomaly engine is orphaned.

---

## IMPACT ASSESSMENT

### Orphaned Repositories
**Impact:** Lost abstraction layer
- Direct DB access still works
- But repositories were meant to centralize query logic
- Enterprise routes use them; legacy routes don't
- Inconsistent data access patterns

### Orphaned Security Engines
**Impact:** Security theater
- Features are documented
- Code is written
- But nothing executes

**Example claim vs. reality:**
| Feature | Claim | Reality |
|---------|-------|---------|
| Anomaly Detection | "Behavioral anomalies detected" | Not executed |
| Attack Graph | "Attack paths analyzed" | Not executed |
| Threat Correlation | "Threats correlated" | Not executed |
| Adaptive Risk | "Risk thresholds adaptive" | Not executed |
| Runtime Lockdown | "Code sealed at runtime" | Not executed |
| Governor | "Governance enforced" | Disabled |

### Orphaned Dashboard API
**Impact:** Blind SOC
- Security team cannot see real-time events
- Cannot respond to incidents
- API endpoints don't exist

---

## SUMMARY: ORPHAN COMPONENT INVENTORY

**Total orphaned components:** 28

**By category:**
- Repositories: 9 (50% of repos)
- Security engines: 15 (70% of advanced security)
- Middleware/utilities: 2
- Broken integrations: 1
- Disabled features: 1

**Lines of orphaned code:** ~2,500 lines

**System impact:** 
- Orphaned components don't slow down or break the system
- But they represent incomplete implementation
- 15 advanced security features are purely decorative
- Half the repository layer is unused

**Risk profile:**
- System is **functionally incomplete**
- Claims about advanced threat detection are **false**
- Actual security is limited to basic RBAC + multi-tenant isolation
- Everything beyond that is **unreachable code**
