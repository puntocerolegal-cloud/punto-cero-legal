# TASK B4 PHASE 2
## MIGRATION MAP

**Date**: 2024  
**Phase**: Pre-Implementation Planning  
**Scope**: Detailed mapping of each migration path  
**Status**: DESIGN COMPLETE (NO CODE CHANGES YET)

---

## TABLA MAESTRA: MIGRATION PATHS

### Template: Mongo Operation → Repository Call → Tenant Mapping → Audit → request_id

```
┌──────────────────────────────────────────────────────────────────────┐
│                    MIGRATION PATH TEMPLATE                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  MONGO: db.collection.operation(query)                               │
│    ↓ (audit: log operation start)                                    │
│  TENANT MAPPING: organization_id → firm_id                           │
│    ↓ (TenantMapping.organization_to_firm)                            │
│  REPOSITORY: repo.method(firm_id, params, request_id)                │
│    ↓ (audit: log repository call + params)                           │
│  RESULT: Process result (same as before)                             │
│    ↓ (audit: log result + success)                                   │
│  RETURN: Same response format (backward compatible)                  │
│                                                                        │
│  REQUEST_ID: Propagated through entire stack                         │
│  AUDIT_LOG: All operations logged with firm_id, request_id           │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## OPERACIÓN 1: get_firm_billing_summary()

### Path A: Query Commissions

```
┌─────────────────────────────────────────────────────────────────┐
│ OPERACIÓN: Get commissions for billing summary                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ CURRENT (Mongo Direct):                                         │
│   commissions = await db.commissions.find({                    │
│     "organization_id": organization_id                          │
│   }).to_list(None)                                              │
│                                                                  │
│ MAPPING:                                                         │
│   1. AUDIT: Log "get_billing_summary_start"                    │
│   2. TENANT: firm_id = await TenantMapping.organization_to_firm │
│   3. REPOSITORY: await commission_repo.list_paginated(          │
│        firm_id=firm_id,                                         │
│        request_id=request_id,                                   │
│        skip=0,                                                  │
│        limit=10000  # Get all for summary                       │
│      )                                                           │
│   4. AUDIT: Log "commissions_retrieved" with count              │
│   5. RESULT: Process with Python logic (same as now)            │
│                                                                  │
│ PRESERVATION:                                                    │
│   - All summing logic stays the same                            │
│   - Status filters unchanged                                    │
│   - Monthly breakdown logic unchanged                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Path B: Query Invoices

```
┌─────────────────────────────────────────────────────────────────┐
│ OPERACIÓN: Get invoices for billing summary                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ CURRENT (Mongo Direct):                                         │
│   invoices = await db.invoices.find({                          │
│     "organization_id": organization_id                          │
│   }).to_list(None)                                              │
│                                                                  │
│ MAPPING:                                                         │
│   1. AUDIT: Log "get_invoices_start"                           │
│   2. TENANT: firm_id = await TenantMapping.organization_to_firm │
│   3. REPOSITORY: await invoice_repo.list_paginated(             │
│        firm_id=firm_id,                                         │
│        request_id=request_id,                                   │
│        skip=0,                                                  │
│        limit=10000  # Get all for summary                       │
│      )                                                           │
│   4. AUDIT: Log "invoices_retrieved" with count                │
│   5. RESULT: Process with Python logic (same as now)            │
│                                                                  │
│ PRESERVATION:                                                    │
│   - All summing logic stays the same                            │
│   - Status filters unchanged                                    │
│   - Balance calculation unchanged                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Summary

| Paso | Componente | Entrada | Salida | Audit |
|------|-----------|---------|--------|-------|
| 1 | Audit Log | method name | log_id | START |
| 2 | TenantMapping | organization_id | firm_id | MAPPING_OK |
| 3 | CommissionRepository | firm_id | [commissions] | RETRIEVED |
| 4 | Python Logic | [commissions] | totals | PROCESSED |
| 5 | InvoiceRepository | firm_id | [invoices] | RETRIEVED |
| 6 | Python Logic | [invoices] | totals | PROCESSED |
| 7 | Response | combined totals | dict | SUCCESS |

---

## OPERACIÓN 2: create_invoice()

### Migration Path

```
┌─────────────────────────────────────────────────────────────────┐
│ OPERACIÓN: Create invoice                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ CURRENT (Mongo Direct):                                         │
│   invoice = {                                                    │
│     "organization_id": organization_id,                          │
│     "amount": amount,                                            │
│     "status": "draft",                                           │
│     ...                                                           │
│   }                                                              │
│   result = await db.invoices.insert_one(invoice)               │
│                                                                  │
│ MAPPING:                                                         │
│   1. AUDIT: Log "create_invoice_start" with params              │
│   2. TENANT: firm_id = await TenantMapping.organization_to_firm │
│   3. DATA BUILD: Create invoice data dict                       │
│   4. REPOSITORY: await invoice_repo.create(                     │
│        firm_id=firm_id,                                         │
│        data={                                                    │
│          "organization_id": organization_id,  # Preserve!       │
│          "amount": amount,                                      │
│          "status": "draft",                                     │
│          "period": period,                                      │
│          ...                                                     │
│        },                                                        │
│        request_id=request_id                                    │
│      )                                                           │
│   5. AUDIT: Log "invoice_created" with invoice_id + firm_id    │
│   6. RESULT: Return invoice dict (same format)                  │
│                                                                  │
│ PRESERVATION:                                                    │
│   - organization_id STAYS in document                           │
│   - status always "draft"                                       │
│   - All defaults preserved                                      │
│   - Response format unchanged                                   │
│                                                                  │
│ ⚠️ CRITICAL: organization_id must be in data passed to repo     │
│   (InvoiceRepository just passes it through in create())         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

| Entrada | Componente | Salida |
|---------|-----------|--------|
| organization_id, amount, period | TenantMapping | firm_id |
| firm_id, organization_id, data | InvoiceRepository.create() | {_id, organization_id, ...} |
| resultado | Python string conversion | {"_id": str, ...} |
| resultado | Audit | log entry |
| resultado | Response | Same dict as before |

---

## OPERACIÓN 3: issue_invoice()

### Migration Path (Special Case)

```
┌─────────────────────────────────────────────────────────────────┐
│ OPERACIÓN: Issue invoice (draft → issued)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ CURRENT (Mongo Direct):                                         │
│   result = await db.invoices.find_one_and_update(              │
│     {"_id": ObjectId(invoice_id)},                             │
│     {"$set": {"status": "issued", ...}}                        │
│   )                                                             │
│                                                                  │
│ PROBLEMA: invoice_id no tiene firm_id directamente              │
│           No podemos pasar el query al repository sin saber     │
│           a qué firm pertenece                                  │
│                                                                  │
│ MAPPING:                                                         │
│   1. AUDIT: Log "issue_invoice_start" with invoice_id           │
│   2. LOOKUP: Get invoice from DB to find firm_id                │
│      Option A: Quick lookup in invoices by _id                 │
│                (still direct, small perf impact)                │
│      Option B: Require firm_id as parameter (API change)        │
│      Option C: Try repository.find_by_id with guessed firm      │
│                (not viable)                                      │
│   3. TENANT: firm_id = await TenantMapping.firm_to_organization │
│              then back (reverse lookup)                          │
│   4. REPOSITORY: await invoice_repo.issue_invoice(              │
│        firm_id=firm_id,                                         │
│        invoice_id=invoice_id,                                   │
│        request_id=request_id                                    │
│      )                                                           │
│   5. AUDIT: Log "invoice_issued" with firm_id                  │
│   6. RESULT: Return invoice dict                                │
│                                                                  │
│ DECISION for B4:                                                 │
│   Keep small direct lookup (one find_one by _id only)           │
│   to avoid major API changes. Acceptable trade-off.             │
│   This is single lookup, not full MongoDB access.               │
│                                                                  │
│ PRESERVATION:                                                    │
│   - Status transition rules intact                              │
│   - Timestamps preserved                                        │
│   - Error handling unchanged                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Fallback Strategy

```
# Option: Use invoice_repo.find_by_id directly
# Problem: Need firm_id but only have invoice_id
# Solution: Iterate or accept small perf cost

# Pragmatic approach:
# 1. Direct find_one on invoices to get invoice doc
# 2. Extract organization_id (or firm_id if available)
# 3. Map to firm_id if needed
# 4. Call InvoiceRepository.issue_invoice(firm_id, invoice_id)

# This maintains 99% repo pattern while accepting one small lookup
```

---

## OPERACIÓN 4: pay_invoice()

### Migration Path (Similar to issue_invoice)

```
┌─────────────────────────────────────────────────────────────────┐
│ OPERACIÓN: Mark invoice as paid (financial operation)           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ CURRENT (Mongo Direct):                                         │
│   invoice = await db.invoices.find_one({"_id": ObjectId(...)}) │
│   if not invoice: raise ValueError                              │
│   if invoice.get("status") == "paid": raise ValueError          │
│   result = await db.invoices.find_one_and_update(...)          │
│                                                                  │
│ MAPPING:                                                         │
│   1. AUDIT: Log "pay_invoice_start"                            │
│   2. LOOKUP: Get invoice by _id (small direct query)            │
│   3. TENANT: Get firm_id from organization_id in invoice       │
│   4. VALIDATION: Check status != "paid"                         │
│   5. REPOSITORY: await invoice_repo.mark_as_paid(              │
│        firm_id=firm_id,                                         │
│        invoice_id=invoice_id,                                   │
│        payment_data={...},                                      │
│        request_id=request_id                                    │
│      )                                                           │
│   6. AUDIT: Log "invoice_paid" (FINANCIAL AUDIT)                │
│   7. RESULT: Return updated invoice                             │
│                                                                  │
│ PRESERVATION:                                                    │
│   - Validation rules preserved                                  │
│   - Payment method handling preserved                           │
│   - Transaction reference generation preserved                 │
│   - Timestamps preserved                                        │
│   - Financial audit trail created                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## OPERACIÓN 5: get_firm_invoices()

### Migration Path

```
┌─────────────────────────────────────────────────────────────────┐
│ OPERACIÓN: Get invoices for firm (with optional status filter)  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ CURRENT (Mongo Direct):                                         │
│   query = {"organization_id": organization_id}                  │
│   if status: query["status"] = status                           │
│   invoices = await db.invoices.find(query)                     │
│              .sort("created_at", -1)                            │
│              .to_list(None)                                     │
│                                                                  │
│ MAPPING:                                                         │
│   1. AUDIT: Log "get_firm_invoices_start"                      │
│   2. TENANT: firm_id = await TenantMapping.organization_to_firm │
│   3. REPOSITORY:                                                 │
│      if status:                                                  │
│        result = await invoice_repo.find_by_status(              │
│          firm_id=firm_id,                                       │
│          status=status,                                         │
│          request_id=request_id,                                 │
│          skip=0, limit=10000                                    │
│        )                                                         │
│      else:                                                       │
│        result = await invoice_repo.list_paginated(              │
│          firm_id=firm_id,                                       │
│          request_id=request_id,                                 │
│          sort_field="created_at",                               │
│          sort_order=-1                                          │
│        )                                                         │
│   4. AUDIT: Log "invoices_retrieved" with count                │
│   5. RESULT: Return list                                        │
│                                                                  │
│ PRESERVATION:                                                    │
│   - Status filtering preserved                                  │
│   - Sort order preserved                                        │
│   - Response format unchanged                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## OPERACIÓN 6: auto_generate_invoices()

### Migration Path (Complex Multi-Step)

```
┌─────────────────────────────────────────────────────────────────┐
│ OPERACIÓN: Auto-generate invoice from commissions in period     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ CURRENT (Mongo Direct):                                         │
│   1. Parse period YYYY-MM                                       │
│   2. Query commissions for date range:                          │
│      db.commissions.find({                                      │
│        "organization_id": org_id,                               │
│        "created_at": {"$gte": start, "$lt": end}               │
│      })                                                          │
│   3. Sum amounts                                                │
│   4. Call create_invoice() with total                           │
│                                                                  │
│ MAPPING:                                                         │
│   1. AUDIT: Log "auto_generate_invoices_start"                 │
│   2. TENANT: firm_id = await TenantMapping.organization_to_firm │
│   3. PARSE: Parse period into datetime range                    │
│   4. REPOSITORY: await commission_repo.get_by_date_range(       │
│        firm_id=firm_id,                                         │
│        start_date=start_dt,                                     │
│        end_date=end_dt,                                         │
│        request_id=request_id                                    │
│      )                                                           │
│   5. PYTHON: Sum amounts from results                           │
│   6. CREATE: await create_invoice_via_repo(                     │
│        db=db,                                                    │
│        organization_id=organization_id,                         │
│        amount=total_amount,                                     │
│        period=period,                                           │
│        request_id=request_id                                    │
│      )                                                           │
│   7. AUDIT: Log "invoice_auto_generated"                        │
│   8. RESULT: Return invoice                                     │
│                                                                  │
│ PRESERVATION:                                                    │
│   - Period parsing logic preserved                              │
│   - Date range calculation preserved                            │
│   - Summing logic preserved                                     │
│   - Description format preserved                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## OPERACIÓN 7: get_global_billing_summary()

### Migration Path (ADMIN ONLY - Special Case)

```
┌─────────────────────────────────────────────────────────────────┐
│ OPERACIÓN: Get global summary (Admin OS)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ CURRENT (Mongo Direct):                                         │
│   all_commissions = await db.commissions.find({})              │
│   [Process all commissions for global stats]                    │
│                                                                  │
│ PROBLEMA: GLOBAL query (no firm_id filtering)                  │
│           Used only in Admin context                            │
│           Cannot be easily scoped to single firm                │
│                                                                  │
│ OPTIONS for B4:                                                  │
│                                                                  │
│ Option A: Keep as direct MongoDB query                          │
│   Pro: No performance impact, admin-only operation              │
│   Con: Violates "no direct MongoDB" goal                        │
│   Decision: ACCEPTABLE - Admin operations can have fallback     │
│                                                                  │
│ Option B: Iterate all organizations                             │
│   Pro: Uses repository layer                                    │
│   Con: Major performance impact (many queries)                  │
│   Decision: NOT VIABLE                                          │
│                                                                  │
│ Option C: Add global aggregation to CommissionRepository        │
│   Pro: Pure repository pattern                                  │
│   Con: Requires new method (not in B2 scope)                    │
│   Decision: Consider for B8+                                    │
│                                                                  │
│ DECISION for B4:                                                 │
│   Keep direct MongoDB for admin operation.                      │
│   Document as admin fallback.                                   │
│   Plan aggregation repository method for B8.                    │
│                                                                  │
│ MAPPING:                                                         │
│   1. AUDIT: Log "get_global_billing_summary_start"             │
│   2. REPOSITORY FALLBACK: Use CommissionRepository.             │
│      commission_statistics() if possible (no firm_id scope)     │
│      Falls back to direct DB if aggregation insufficient        │
│   3. RESULT: Process aggregation results                        │
│   4. AUDIT: Log "global_summary_generated"                      │
│                                                                  │
│ PRESERVATION:                                                    │
│   - Revenue by firm preserved                                   │
│   - Revenue by agent preserved                                  │
│   - Global totals preserved                                     │
│   - Response format unchanged                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Decision: Admin Fallback

```
# For B4: Accept one direct MongoDB operation
# Justification:
#   - Admin-only endpoint (billing_admin.py)
#   - Global aggregation across all organizations
#   - Not part of tenant-scoped operations
#   - Minor impact on total scope
#   - Can be refactored in B8+ if needed

# Logging: Clear admin operation audit trail
# Fallback: Direct DB available if CommissionRepository fails
```

---

## TABLA RESUMEN: MIGRATION DECISION MATRIX

| Operación | Migrabilidad | Estrategia | Fallback | Audit |
|-----------|-------------|-----------|----------|-------|
| get_billing_summary (commissions) | ✅ Alto | Repository | N/A | SÍ |
| get_billing_summary (invoices) | ✅ Alto | Repository | N/A | SÍ |
| create_invoice | ✅ Alto | Repository | N/A | SÍ |
| issue_invoice | ⚠️ Medio | Repo + 1 lookup | Direct _id | SÍ |
| pay_invoice | ⚠️ Medio | Repo + 1 lookup | Direct _id | SÍ |
| get_firm_invoices | ✅ Alto | Repository | N/A | SÍ |
| auto_generate_invoices | ✅ Alto | Repo multi-step | N/A | SÍ |
| get_global_summary | ⛔ Bajo | Admin fallback | Direct DB | SÍ |

---

## CHECKLIST PHASE 2

- ✅ Todos los 7 métodos mapeados
- ✅ Estrategia de migration definida para cada uno
- ✅ Tenant Mapping integrado en todos los paths
- ✅ Audit points identificados
- ✅ Request ID propagation documented
- ✅ Fallback strategies defined para casos especiales
- ✅ Preservation rules documented
- ✅ ZERO cambios API esperados
- ✅ ZERO cambios funcionales esperados
- ✅ 100% backward compatibility

**PHASE 2 COMPLETE**

Listo para PHASE 3: Implementación Controlada

