# O5 PHASE 1: AUDIT OPERATIONS INVENTORY
**Sprint:** S1.5 — Organizations Foundation  
**Phase:** O5.1 — Audit Operations Audit  
**Status:** 📋 COMPLETE  
**Timestamp:** 2025-07-06  

---

## WRITE OPERATIONS REQUIRING AUDIT

### ORGANIZATION OPERATIONS

| Operation | Repository | Method | Criticality | Impact |
|-----------|-----------|--------|-------------|--------|
| Create Organization | OrganizationRepository | create() | **HIGH** | New organization added to system |
| Update Organization | OrganizationRepository | update() | **HIGH** | Organization configuration changed |
| Soft Delete Organization | OrganizationRepository | soft_delete() | **HIGH** | Organization marked as deleted |
| Activate Organization | OrganizationRepository | activate() | **MEDIUM** | Organization status changed to active |
| Deactivate Organization | OrganizationRepository | deactivate() | **MEDIUM** | Organization suspended |
| Change Plan | OrganizationRepository | change_plan() | **HIGH** | Billing plan changed |
| Update Limits | OrganizationRepository | update_limits() | **MEDIUM** | Organization resource limits adjusted |

---

### OFFICE OPERATIONS

| Operation | Repository | Method | Criticality | Impact |
|-----------|-----------|--------|-------------|--------|
| Create Office | OfficeRepository | create() | **MEDIUM** | New office location added |
| Update Office | OfficeRepository | update() | **MEDIUM** | Office details modified |
| Soft Delete Office | OfficeRepository | soft_delete() | **MEDIUM** | Office marked as deleted |

---

### DEPARTMENT OPERATIONS

| Operation | Repository | Method | Criticality | Impact |
|-----------|-----------|--------|-------------|--------|
| Create Department | DepartmentRepository | create() | **MEDIUM** | New department created |
| Update Department | DepartmentRepository | update() | **MEDIUM** | Department details changed |
| Soft Delete Department | DepartmentRepository | soft_delete() | **MEDIUM** | Department deleted |

---

### ROLE OPERATIONS

| Operation | Repository | Method | Criticality | Impact |
|-----------|-----------|--------|-------------|--------|
| Create Role | RoleRepository | create() | **HIGH** | New access control role defined |
| Update Role | RoleRepository | update() | **HIGH** | Role permissions may change |
| Soft Delete Role | RoleRepository | soft_delete() | **HIGH** | Role no longer available |

---

### MEMBERSHIP OPERATIONS

| Operation | Repository | Method | Criticality | Impact |
|-----------|-----------|--------|-------------|--------|
| Create Membership | MembershipRepository | create() | **HIGH** | User added to organization |
| Update Membership | MembershipRepository | update() | **MEDIUM** | Membership details changed |
| Soft Delete Membership | MembershipRepository | soft_delete() | **HIGH** | User removed from organization |
| Assign Role | MembershipRepository | assign_role() | **HIGH** | User role assigned |
| Remove Role | MembershipRepository | remove_role() | **HIGH** | User role revoked |
| Change Role | MembershipRepository | change_role() | **HIGH** | User role changed |

---

### PERMISSION OPERATIONS

| Operation | Repository | Method | Criticality | Impact |
|-----------|-----------|--------|-------------|--------|
| Create Permission | PermissionRepository | create() | **HIGH** | New system permission defined |
| Update Permission | PermissionRepository | update() | **HIGH** | Permission definition changed |
| Soft Delete Permission | PermissionRepository | soft_delete() | **HIGH** | Permission revoked |

---

## TOTAL WRITE OPERATIONS

| Category | Count | Criticality | Note |
|----------|-------|------------|------|
| Organizations | 7 | HIGH/MEDIUM | Core domain |
| Offices | 3 | MEDIUM | Location management |
| Departments | 3 | MEDIUM | Org structure |
| Roles | 3 | HIGH | Access control |
| Memberships | 6 | HIGH | User access |
| Permissions | 3 | HIGH | Access control |
| **TOTAL** | **25** | Mixed | Comprehensive coverage |

---

## AUDIT REQUIREMENTS PER OPERATION

### Required Audit Fields

| Field | Type | Source | Example |
|-------|------|--------|---------|
| `firm_id` | string | TenantContext | "org-123" |
| `request_id` | string | TenantContext | "req-456" |
| `user_id` | string | TenantContext | "user-789" |
| `action` | string | Operation type | "create_organization" |
| `resource` | string | Entity type | "organization" |
| `resource_id` | string | Document _id | "507f1f77bcf86cd799439011" |
| `timestamp` | datetime | System clock | datetime.utcnow() |
| `status` | string | Success/Error | "success" or "error" |
| `details` | dict | Operation-specific | {"name": "ACME Corp", "plan": "pro"} |
| `before_state` | dict | For updates | Previous values |
| `after_state` | dict | For updates | New values |
| `ip_address` | string | Request header | "192.168.1.1" |

---

## AUDIT FLOW PATTERN

```
Service Layer (organization_service.py)
  ↓
  Operation starts
  ↓
  Extract: firm_id, request_id, user_id, ip_address from context
  ↓
  Call Repository method
  ↓
  Capture: before_state (for updates), operation_result
  ↓
  Call AuditLogRepository.log_action()
  ↓
  Audit recorded with full context
  ↓
  Return result to client
```

---

## IMPLEMENTATION PATTERN

### Pattern Used in Payment Core

```python
async def process_payment(db, ctx: dict, payment_id: str, payload) -> dict:
    firm_id = ctx.get("tenant_id")
    request_id = ctx.get("request_id")
    user_id = ctx.get("user_id")
    ip_address = ctx.get("ip_address", "unknown")
    
    try:
        # Fetch before state
        repo = PaymentRepository(db.payments)
        before_state = await repo.find_by_id(firm_id, payment_id, request_id)
        
        # Execute operation
        result = await repo.update(firm_id, payment_id, updates, request_id)
        
        # Audit success
        audit_repo = AuditLogRepository(db.audit_logs)
        await audit_repo.log_action(
            firm_id=firm_id,
            action="process_payment",
            user_id=user_id,
            details={
                "resource": "payment",
                "resource_id": payment_id,
                "before_state": before_state,
                "after_state": result,
                "status": "success"
            },
            request_id=request_id,
            ip_address=ip_address
        )
        
        return result
    except Exception as e:
        # Audit error
        audit_repo = AuditLogRepository(db.audit_logs)
        await audit_repo.log_action(
            firm_id=firm_id,
            action="process_payment",
            user_id=user_id,
            details={
                "resource": "payment",
                "resource_id": payment_id,
                "status": "error",
                "error": str(e)
            },
            request_id=request_id,
            ip_address=ip_address
        )
        raise
```

---

## CRITICALITY CLASSIFICATION

### HIGH CRITICALITY (Must audit immediately)

- Organization: create, update, soft_delete, change_plan
- Role: create, update, soft_delete
- Membership: create, soft_delete, assign_role, remove_role, change_role
- Permission: create, update, soft_delete

**Reason:** Affects security, billing, or system-wide access

### MEDIUM CRITICALITY (Should audit)

- Organization: activate, deactivate, update_limits
- Office: all operations
- Department: all operations

**Reason:** Affects operational state but not critical

---

## CONTEXT EXTRACTION FROM REQUEST

### Required Context Fields

**From TenantContext (TenantKernel):**
- `tenant_id` → firm_id
- `user_id` → actor
- `request_id` → tracing
- `ip_address` → source tracking

**Extraction Pattern:**
```python
firm_id = ctx.get("tenant_id")
request_id = ctx.get("request_id", "no-request-id")
user_id = ctx.get("user_id", "system")
ip_address = ctx.get("ip_address", "unknown")
```

---

## NEXT STEPS

**Phase 2:** Create audit map with detailed flow  
**Phase 3:** Implement AuditLogRepository integration  

