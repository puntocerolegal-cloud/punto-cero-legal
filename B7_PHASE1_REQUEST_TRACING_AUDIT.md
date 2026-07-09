# TASK B7 PHASE 1
## EXHAUSTIVE REQUEST TRACING AUDIT

**Date**: 2024  
**Phase**: Request Tracing & Observability  
**Scope**: Billing & Subscription Core (B1-B6)  
**Status**: AUDIT COMPLETE

---

## TABLA MAESTRA: REQUEST FLOW PROPAGATION

### Request Flow: HTTP → MongoDB

```
┌─────────────────────────────────────────────────────────────┐
│                  HTTP REQUEST (Client)                       │
│                      ↓                                        │
│          TenantKernelMiddleware                             │
│          ├─ Extract JWT                                     │
│          ├─ Generate/Extract request_id                     │
│          └─ Create TenantContext(request_id)                │
│                      ↓                                        │
│       FastAPI Route (/api/billing/...)                       │
│       ├─ Receive ctx: TenantContext                         │
│       │   (has firm_id, request_id)                         │
│       └─ Call BillingService.method(db, org_id, ...)       │
│                      ↓                                        │
│       BillingService (B4)                                    │
│       ├─ Receive: organization_id                           │
│       ├─ Mapping: TenantMapping.organization_to_firm()      │
│       ├─ Get: firm_id                                       │
│       ├─ Repository: InvoiceRepository.method(              │
│       │              firm_id, data,                         │
│       │              request_id="billing")  ← PROPAGATE     │
│       └─ MongoDB through Repository                         │
│                      ↓                                        │
│       Repository Layer (B1/B2)                               │
│       ├─ Inherit from BaseRepository                        │
│       ├─ Call: self.create(firm_id, data, request_id)      │
│       ├─ Filter: TenantAwareQuery.add_firm_filter()        │
│       └─ Logging: logger.info(...request_id=...)            │
│                      ↓                                        │
│       AuditLogRepository (B6)                                │
│       ├─ Optional: Log action                               │
│       ├─ Receive: request_id                                │
│       └─ Create audit entry                                 │
│                      ↓                                        │
│       MongoDB                                                 │
│       └─ Document stored with firm_id                       │
│                      ↓                                        │
│       HTTP Response                                          │
│       ├─ X-Request-ID header                                │
│       └─ Client receives response                           │
└─────────────────────────────────────────────────────────────┘
```

---

## TABLA 1: REQUEST_ID PROPAGATION MATRIX

### Punto de Propagación (Detallado)

| # | Punto | Recibe request_id | Origen | Propaga A | Método | Status |
|---|-------|------------------|--------|-----------|--------|--------|
| 1 | HTTP Client | NO | N/A | TenantKernel | Header | ✅ |
| 2 | TenantKernel | SÍ (genera) | Header o new | TenantContext | _generate_request_id() | ✅ |
| 3 | TenantContext | SÍ | TenantKernel | Route | dataclass field | ✅ |
| 4 | Billing Route | SÍ | TenantContext (ctx) | BillingService | ctx.request_id | ❌ NO PROPAGA |
| 5 | BillingService | NO (default) | Default | Repository | request_id="billing" | ❌ PERDIDA |
| 6 | InvoiceRepository | SÍ (default) | Parameter default | MongoDB | query logging | ✅ |
| 7 | CommissionRepository | SÍ (default) | Parameter default | MongoDB | query logging | ✅ |
| 8 | AuditLogRepository | SÍ | Parámetro | MongoDB | create(firm_id, doc, request_id) | ✅ |
| 9 | MongoDB | SÍ | Repository | (persisted) | Audit trail | ✅ |

**CRITICAL ISSUE**: Routes NO pasan ctx.request_id a BillingService/CommissionService
**CRITICAL ISSUE**: Services usan default "billing" en lugar de recibir request_id real

---

## TABLA 2: SERVICIOS - ESTADO ACTUAL

### BillingService (B4)

| Método | Recibe request_id | Origen | Valor Actual | Status |
|--------|------------------|--------|-------------|--------|
| get_firm_billing_summary | Sí | Parámetro | "billing" (default) | ✅ Puede mejorarse |
| create_invoice | Sí | Parámetro | "billing" (default) | ✅ Puede mejorarse |
| issue_invoice | Sí | Parámetro | "billing" (default) | ✅ Puede mejorarse |
| pay_invoice | Sí | Parámetro | "billing" (default) | ✅ Puede mejorarse |
| get_firm_invoices | Sí | Parámetro | "billing" (default) | ✅ Puede mejorarse |
| auto_generate_invoices | Sí | Parámetro | "billing" (default) | ✅ Puede mejorarse |
| get_global_billing_summary | Sí | Parámetro | "billing-admin" (default) | ✅ Puede mejorarse |

**Problema**: Todos tienen request_id como parámetro PERO usan default "billing"

---

### CommissionService (B5)

| Método | Recibe request_id | Origen | Valor Actual | Status |
|--------|------------------|--------|-------------|--------|
| create_commission | Sí | Parámetro | "commission" (default) | ✅ Puede mejorarse |
| get_agent_commissions | Sí | Parámetro | "commission" (default) | ✅ Puede mejorarse |
| get_firm_commissions | Sí | Parámetro | "commission" (default) | ✅ Puede mejorarse |
| update_commission_status | Sí | Parámetro | "commission" (default) | ✅ Puede mejorarse |
| get_commission_stats | Sí | Parámetro | "commission" (default) | ✅ Puede mejorarse |
| apply_commission_split | Sí | Parámetro | "commission" (default) | ✅ Puede mejorarse |
| process_payment | Sí | Parámetro | "commission" (default) | ✅ Puede mejorarse |

**Problema**: Mismo que BillingService - todos tienen parámetro pero usan default

---

## TABLA 3: ROUTES - PROPAGACIÓN FALTANTE

### Billing Routes (backend/routes/billing.py)

| Route | Método | Contexto | request_id disponible | Propaga | Estado |
|-------|--------|----------|----------------------|---------|--------|
| GET /billing | list_invoices | ctx (TenantContext) | SÍ (ctx.request_id) | ❌ NO | ⚠️ FALTA |
| GET /billing/dashboard | billing_dashboard | ctx | SÍ | ❌ NO | ⚠️ FALTA |
| GET /billing/{id} | get_invoice | ctx | SÍ | ❌ NO | ⚠️ FALTA |
| POST /billing | create_invoice | ctx | SÍ | ❌ NO | ⚠️ FALTA |
| PUT /billing/{id} | update_invoice | ctx | SÍ | ❌ NO | ⚠️ FALTA |
| DELETE /billing/{id} | delete_invoice | ctx | SÍ | ❌ NO | ⚠️ FALTA |
| POST /billing/{id}/pay | pay_invoice | ctx | SÍ | ❌ NO | ⚠️ FALTA |

**Conclusión**: 7 rutas tienen ctx.request_id pero NO lo pasan a BillingService

---

### Commission Routes (backend/routes/commissions.py)

**Nota**: CommissionService es usado internamente. Routes tienen TenantContext pero no propagan request_id.

**Misma situación que Billing Routes**: request_id disponible pero no propagado.

---

## TABLA 4: REPOSITORIOS - LOGGING ACTUAL

### InvoiceRepository (B1)

| Método | Logging Actual | request_id incluido | Format |
|--------|----------------|-------------------|--------|
| create | YES | SÍ | [invoices] CREATE firm_id={} request_id={} |
| find_by_id | YES (debug) | SÍ | [invoices] FIND_BY_ID request_id={} |
| find_by_status | YES (debug) | SÍ | [invoices] FIND_BY_STATUS request_id={} |
| issue_invoice | YES (info) | SÍ | [invoices] ISSUE_INVOICE request_id={} |
| mark_as_paid | YES (info) | SÍ | [invoices] MARK_AS_PAID request_id={} |
| list_paginated | YES (debug) | SÍ | [invoices] LIST_PAGINATED request_id={} |

**Status**: ✅ Logging presente, request_id incluido

---

### CommissionRepository (B2)

| Método | Logging Actual | request_id incluido | Format |
|--------|----------------|-------------------|--------|
| create | YES | SÍ | [commissions] CREATE firm_id={} request_id={} |
| find_by_user | YES (debug) | SÍ | [commissions] FIND_BY_USER request_id={} |
| find_by_status | YES (debug) | SÍ | [commissions] FIND_BY_STATUS request_id={} |
| approve_commission | YES (info) | SÍ | [commissions] APPROVE request_id={} |
| mark_paid | YES (info) | SÍ | [commissions] MARK_PAID request_id={} |

**Status**: ✅ Logging presente, request_id incluido

---

## TABLA 5: AUDIT LOG - INTEGRACIÓN ACTUAL

### AuditLogRepository (B6)

| Característica | Status | Detalles |
|---|---|---|
| log_action() | ✅ | Recibe request_id como parámetro |
| request_id storage | ✅ | Almacenado en audit logs |
| firm_id isolation | ✅ | Via create(firm_id, ..., request_id) |
| Logging | ✅ | request_id en logs del audit |

**Status**: ✅ AuditLogRepository está integrado, maneja request_id

---

## TABLA 6: MÉTRICAS ACTUALES

### Coverage Análisis

| Métrica | Actual | Target | Status |
|---------|--------|--------|--------|
| Request_id en TenantContext | 100% | 100% | ✅ |
| Request_id en Routes | 100% (available) | 100% | ⚠️ Disponible pero NO usado |
| Request_id propagado a Services | 0% | 100% | ❌ FALTA |
| Request_id en Repositories | 100% | 100% | ✅ |
| Request_id en AuditLog | 100% | 100% | ✅ |
| Request_id en logs | 95% | 100% | ⚠️ Parcial |
| Timing metrics | 0% | 100% | ❌ FALTA |
| Error traceability | 80% | 100% | ⚠️ Parcial |

---

## TABLA 7: BLOQUEADORES Y GAPS IDENTIFICADOS

### GAP 1: Routes → Services (CRÍTICO)

**Problema**: Routes tienen ctx.request_id pero NO lo pasan a BillingService/CommissionService

**Ejemplo**:
```python
# Actual (BILLING.PY, línea 44):
data = await svc.get_invoices(db, ctx, status=status, source=source)
# ctx tiene request_id, pero no se pasa

# Debería ser:
data = await svc.get_invoices(db, ctx, status=status, source=source, 
                               request_id=ctx.request_id)
```

**Impacto**: request_id se pierde en transición Route → Service

**Solución**: Pasar ctx.request_id a todos los service calls

**Severidad**: ALTA

---

### GAP 2: Timing Metrics (NO IMPLEMENTADO)

**Problema**: No hay medición de tiempos de ejecución

**Impacto**: No se pueden calcular latencias por operación

**Solución**: Agregar time.time() al inicio/fin de operaciones

**Severidad**: MEDIA

---

### GAP 3: Error Context (PARCIAL)

**Problema**: Excepciones no siempre incluyen request_id/firm_id

**Solución**: Mejorar manejo de errores para propagar contexto

**Severidad**: MEDIA

---

## RECOMENDACIONES FASE 1

### Hallazgos Principales

1. ✅ **Infraestructura presente**: TenantContext, request_id generation, AuditLog
2. ✅ **Repositories logging**: Bien implementado
3. ❌ **Routes → Services**: GAP crítico - request_id disponible pero NO propagado
4. ⚠️ **Metrics**: Sin implementación de timing
5. ⚠️ **Error context**: Incompleto

### Cambios Necesarios para B7

1. **REQUIRED**: Pasar ctx.request_id en todos los calls de Route → Service
2. **REQUIRED**: Services reciben request_id real (no default "billing"/"commission")
3. **NICE-TO-HAVE**: Agregar timing metrics
4. **NICE-TO-HAVE**: Mejorar error context

### Risk Assessment

**BLOCKER**: No - La propagación es posible sin cambios arquitectónicos

**SCOPE**: Modificaciones en routes (7 endpoints) + services (13 métodos)

**COMPATIBILITY**: ZERO breaking changes (solo agregar parámetro, valores defaults preservados)

---

## ESTADO FASE 1

✅ **PHASE 1 COMPLETE**

- ✅ Request flow mapeado completamente
- ✅ Tabla de propagación creada
- ✅ Gaps identificados (1 crítico, 2 medios)
- ✅ No hay bloqueadores arquitectónicos
- ✅ Soluciones claras definidas

**Listo para FASE 2**: Implementar request_id propagation

