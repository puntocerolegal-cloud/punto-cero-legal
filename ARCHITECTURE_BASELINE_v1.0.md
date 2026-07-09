# PUNTO CERO SYSTEM OS
## ARCHITECTURE BASELINE v1.0
### Official Architectural Constitution

**Version**: 1.0  
**Date**: 2024  
**Authority**: Architecture Governance Board  
**Status**: FROZEN - OFFICIAL REFERENCE

---

## PREAMBLE

This document consolidates the official architectural foundation of Punto Cero System OS. It represents the cumulative knowledge from:
- Architecture Freeze v1.0
- Sprint S1-01 through S1-05 (Payment Core Certification)
- Golden Repository Template v1.0
- TenantKernel v1.0
- ExternalTenantResolver v1.0
- BaseRepository Foundation

This constitution is binding on all future development and cannot be contradicted without formal Architecture Review Board approval.

---

## PARTE I: SYSTEM OVERVIEW

### Core Mission
Punto Cero System OS is a **multi-tenant, enterprise-grade legal technology platform** that provides:
- Workflow management for legal professionals
- Case processing and client management
- AI-assisted document analysis
- Secure payment processing
- Multi-country compliance

### Architectural Paradigm
- **Multi-Tenant First**: Every operation scoped by firm_id
- **Repository Pattern**: No direct MongoDB access
- **Event-Driven**: Webhook-based external integration
- **Audit-Centric**: Complete traceability of all operations
- **Security-First**: HMAC validation, tenant spoofing prevention
- **Zero-Breaking-Changes**: Backward compatibility as law

### Technology Stack
- **Runtime**: Python 3.11+
- **Framework**: FastAPI (async HTTP)
- **Database**: MongoDB (motor async driver)
- **Infrastructure**: Docker, Render.io
- **Observability**: Logging, Audit Trails, Request Tracing

---

## PARTE II: ARCHITECTURAL LAYERS

### Layer 1: HTTP Entry Point (FastAPI Routes)
- **Responsibility**: HTTP request parsing, validation, response formatting
- **Pattern**: FastAPI routers with dependency injection
- **Constraints**:
  - Never perform business logic directly
  - Always delegate to handlers/services
  - Always validate authentication/authorization
  - Always use dependency injection for repositories

### Layer 2: Handler Layer (Service Functions)
- **Responsibility**: Business logic orchestration
- **Pattern**: Async functions receiving repositories via dependency injection
- **Constraints**:
  - Receive repositories as optional parameters
  - Support legacy fallback paths (for backward compatibility)
  - Pass firm_id and request_id to all repositories
  - Never instantiate repositories directly
  - Never access MongoDB directly in primary path

### Layer 3: Repository Layer
- **Responsibility**: Data access abstraction
- **Pattern**: BaseRepository inheritance with specialized repositories
- **Constraints**:
  - Enforce firm_id filtering on all queries
  - Require request_id for all operations
  - Integrate with AuditLogRepository
  - Provide TYPE_CHECKING type hints
  - No business logic, only data access

### Layer 4: Database (MongoDB)
- **Responsibility**: Persistent data storage
- **Pattern**: Document-oriented collections
- **Constraints**:
  - Only accessed through Repository Layer
  - Never directly accessed from routes or handlers
  - Multi-tenant separation via firm_id field
  - Atomic transactions at MongoDB level

### Layer 5: External Integration (Webhooks)
- **Responsibility**: Async event processing from MercadoPago, external systems
- **Pattern**: ExternalTenantResolver for tenant mapping
- **Constraints**:
  - HMAC validation mandatory
  - Idempotency key-based deduplication
  - Always resolve firm_id from transaction data
  - Never trust firm_id from webhook payload

---

## PARTE III: ARCHITECTURAL STANDARDS (FROZEN)

### Standard 1: Golden Repository Template v1.0

**Definition**: Universal base pattern for all repository implementations

**Requirements**:
- ✅ Inherit from BaseRepository
- ✅ All methods require firm_id parameter
- ✅ All methods require request_id parameter
- ✅ All write operations log to AuditLogRepository
- ✅ All queries filter by firm_id at database level
- ✅ TYPE_CHECKING imports for type safety
- ✅ Docstrings for public methods

**Example Pattern**:
```python
class EntityRepository(BaseRepository):
    async def find_by_identifier(
        self, 
        firm_id: str, 
        identifier: str, 
        request_id: str
    ) -> Optional[Dict[str, Any]]:
        """Find entity scoped to firm_id."""
        return await self.db.find_one({
            "firm_id": firm_id,
            "identifier": identifier
        })
```

**Enforcement**: Mandatory for all repositories created S1+

---

### Standard 2: TenantKernel v1.0

**Definition**: The system's tenant context and isolation mechanism

**Core Responsibility**:
- Establish firm_id as the authoritative tenant identifier
- Propagate firm_id through all layers (routes → handlers → repositories)
- Enforce multi-tenant isolation at database level
- Prevent cross-tenant data access

**Key Components**:
- `get_tenant_context_from_request()`: Extract firm_id from authenticated request
- `TenantContext`: Immutable tenant information container
- Dependency injection: Automatic firm_id propagation

**Frozen Rules**:
- ✅ firm_id is immutable once set
- ✅ firm_id is never user-provided (always system-derived)
- ✅ firm_id comes from authentication context or transaction lookup
- ✅ No operation exists without firm_id

**Cannot Be Modified**: ✅ FROZEN v1.0

---

### Standard 3: ExternalTenantResolver v1.0

**Definition**: Maps external webhook events to internal firm_id

**Use Cases**:
- MercadoPago payment events → resolve to transaction firm_id
- External API notifications → resolve via transaction reference

**Resolution Path**:
1. Extract external reference from webhook (payment_id, order_id, etc.)
2. Query TransactionRepository with external reference
3. Return firm_id from transaction
4. Fallback to "system" if unresolvable (logged as warning)

**Frozen Rules**:
- ✅ Never manually construct firm_id
- ✅ Always lookup from existing transaction
- ✅ "system" fallback only for documented edge cases
- ✅ Always log resolution attempts

**Cannot Be Modified**: ✅ FROZEN v1.0

---

### Standard 4: BaseRepository Foundation

**Definition**: Universal data access abstraction for all repositories

**Core Methods** (inherited by all):
- `find_by_id(firm_id, _id, request_id)`: Find by MongoDB _id
- `create(firm_id, data, request_id)`: Create entity
- `update(firm_id, _id, data, request_id)`: Update by _id
- `delete(firm_id, _id, request_id)`: Soft delete

**Guarantees**:
- ✅ All queries include firm_id filter
- ✅ All operations are audited
- ✅ All operations are request-traced
- ✅ All operations are type-safe

**Cannot Be Modified**: ✅ FROZEN v1.0

---

### Standard 5: Repository Pattern

**Definition**: All data access goes through Repository Layer

**Constraints**:
- ✅ No `db.collection.operation()` in primary code paths
- ✅ All queries go through repository methods
- ✅ All writes go through repository methods
- ✅ Legacy fallback paths permitted (backward compatibility)
- ✅ Fallback paths must be identical to pre-migration behavior

**Enforcement**: Code review mandatory for all db.* references

---

### Standard 6: Dependency Injection Pattern

**Definition**: Repositories injected via FastAPI Depends()

**Mechanism**:
```python
@router.post("/endpoint")
async def handler(
    db: AsyncIOMotorDatabase = Depends(get_db),
    repo: SomeRepository = Depends(get_some_repo)
):
    # repo is automatically available
```

**Constraints**:
- ✅ All repositories are optional parameters (for backward compatibility)
- ✅ Fallback to direct MongoDB if repo is None
- ✅ Dependency resolution guaranteed by FastAPI

**Cannot Be Modified**: ✅ FROZEN v1.0

---

### Standard 7: Audit Pattern

**Definition**: Complete traceability of all state-changing operations

**Requirements**:
- ✅ Every write operation generates an audit entry
- ✅ Audit includes: action, firm_id, user_id, details, timestamp
- ✅ Audit entries immutable once written
- ✅ AuditLogRepository is singleton repository
- ✅ Audit entries queryable per firm_id

**Entry Format**:
```python
await audit_repo.log_action(
    firm_id="acme-law",
    action="payment_processed",
    user_id="system",  # for automated operations
    details={...},
    request_id="webhook_evt_123",
    ip_address="192.168.1.1"
)
```

**Cannot Be Modified**: ✅ FROZEN v1.0

---

### Standard 8: Request Trace Pattern

**Definition**: End-to-end request identification for debugging

**Mechanism**:
- Generate request_id at entry point
- Propagate through all layers
- Include in all audit/log entries
- Enable complete request history reconstruction

**Pattern**:
- HTTP requests: UUID or operation-specific ID
- Webhooks: `f"webhook_{event_id}"`

**Cannot Be Modified**: ✅ FROZEN v1.0

---

### Standard 9: Observability Pattern

**Definition**: Complete visibility into system behavior

**Three Pillars**:
1. **Logging**: INFO, WARNING, ERROR, DEBUG levels
2. **Audit Trail**: Immutable operation records
3. **Metrics**: Event processing counts, latencies, error rates

**Constraints**:
- ✅ All errors logged
- ✅ All validations logged
- ✅ All state changes audited
- ✅ All requests traceable

**Cannot Be Modified**: ✅ FROZEN v1.0

---

### Standard 10: Architecture Governance

**Definition**: Process for managing architecture changes

**Review Gates**:
1. Architecture Review: Does it follow v1.0 principles?
2. Security Review: Does it introduce vulnerabilities?
3. Repository Review: Does it use Repository Pattern?
4. Certification Review: Does it require module re-certification?
5. Deployment Approval: Is it ready for production?

**Cannot Be Modified**: ✅ FROZEN v1.0

---

## PARTE IV: ARCHITECTURAL PRINCIPLES

### Principle 1: Single Responsibility
**Statement**: Each component has one reason to change.  
**Application**:
- Handlers orchestrate, don't compute
- Repositories abstract, don't validate
- Routes route, don't process

### Principle 2: Single Source of Truth
**Statement**: One authoritative source for each data point.  
**Application**:
- firm_id from authentication/transaction lookup, never from request
- Transaction state from TransactionRepository, never replicated
- Audit trail in AuditLogRepository, never in logs alone

### Principle 3: Immutable Context
**Statement**: Tenant context doesn't change during request.  
**Application**:
- firm_id resolved once at entry, propagated unchanged
- request_id generated once, never modified
- TenantContext is read-only reference

### Principle 4: Fail Secure
**Statement**: System fails in a safe state, not a compromised one.  
**Application**:
- If firm_id unresolvable, reject or fallback to "system" (logged)
- If authentication fails, deny access
- If audit write fails, operation fails (not silent failure)

### Principle 5: Repository First
**Statement**: All data access through Repository Layer.  
**Application**:
- No direct MongoDB access in primary paths
- Repositories enforce multi-tenant rules
- No business logic in query strings

### Principle 6: No Direct MongoDB
**Statement**: MongoDB is an implementation detail, never accessed directly.  
**Application**:
- Only repositories access db.* 
- Primary code paths use repositories
- Legacy fallback paths use db.* (permitted for compatibility)

### Principle 7: No Cross-Tenant
**Statement**: Data from one firm never visible to another.  
**Application**:
- All queries include firm_id filter
- All results filtered by firm_id
- No admin bypass for data access

### Principle 8: Audit First
**Statement**: If operation isn't audited, it didn't happen.  
**Application**:
- All state changes generate audit entries
- Audit entries immutable
- Audit entries queryable per firm_id

### Principle 9: Security First
**Statement**: Security is not optional, not an afterthought.  
**Application**:
- HMAC validation on webhooks
- Tenant spoofing prevention
- No information leakage in error messages
- Type safety via TYPE_CHECKING

### Principle 10: Zero Breaking Changes
**Statement**: Once deployed, API contracts are law.  
**Application**:
- REST endpoints don't change
- JSON responses don't change in breaking ways
- HTTP status codes don't change meaning
- Event contracts immutable

### Principle 11: Backward Compatibility
**Statement**: Old code continues to work.  
**Application**:
- Legacy fallback paths preserved
- Deprecated features have sunset dates
- Migration paths provided for breaking requirements

---

## PARTE V: SYSTEM STATE AS OF v1.0

### Certified Components
- ✅ Payment Core (S1-01 through S1-05)
  - Webhook processing
  - Payment state management
  - Subscription handling
  - Refund/chargeback processing

### Foundation Components (Locked)
- ✅ TenantKernel v1.0
- ✅ BaseRepository Foundation
- ✅ Golden Repository Template v1.0
- ✅ ExternalTenantResolver v1.0
- ✅ AuditLogRepository
- ✅ WebhookEventRepository

### Pending Certification
- ⏳ Billing Module
- ⏳ Organizations
- ⏳ Financial Management
- ⏳ Notifications
- ⏳ Referrals System
- ⏳ AI Isolation
- ⏳ Cron Jobs
- ⏳ Background Workers
- ⏳ Analytics
- ⏳ Legal Framework

### Certification Progress
**Completed**: 1/11 modules = **9.1%**

---

## EFFECTIVE DATE

This Architecture Baseline v1.0 is effective immediately.

All future development must comply with these standards and principles. No exceptions without formal Architecture Review Board approval.

---

**This document is FROZEN. It cannot be modified without a formal review process.**

**Next: SYSTEM_MODULE_MAP.md**
