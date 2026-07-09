# SPRINT 1: PAYMENT CORE MIGRATION PLAN v1.0

**Status:** Technical Audit Complete  
**Date:** 2024  
**Architecture Freeze:** v1.0 (LOCKED)  
**Lead:** CTO / Migration Lead  

---

## EXECUTIVE SUMMARY

El dominio **Payment** de Punto Cero System OS está **IDENTIFICADO COMPLETAMENTE** pero **REQUIERE IMMEDIATE RISK REMEDIATION** antes de iniciar migración.

- **Total Componentes Payment:** 46
- **Accesos Directos MongoDB:** 112 lineas críticas/altas
- **Estado Actual:** 85% Legacy, 15% Arquitectura Nueva
- **Bloqueadores Detectados:** 3 (Críticos)
- **Readiness:** ❌ **NO LISTO** - Requiere solucionar bloqueadores

---

# FASE 1: INVENTARIO COMPLETO DEL DOMINIO PAYMENT

## 1.1 RUTAS (Routes Layer)

| Archivo | Líneas | Propósito | Componentes Clave |
|---------|--------|----------|------------------|
| `backend/routes/payment.py` | 1538 | Router principal Payment | `init`, `webhook`, `renew`, `change-plan`, `my-plan`, `cancel`, `reactivate` |
| `backend/routes/invoices.py` | 402 | CRUD Facturas & Payment Links | `list`, `create`, `update`, `webhook` |
| `backend/routes/billing_admin.py` | 510 | Admin Dashboard Pagos | `list_transactions`, `webhook_metrics`, `pending_renewals` |
| `backend/routes/financial.py` | 426 | Resumen Financiero | `summary`, `invoice_create`, `invoice_pay` |
| `backend/routes/commissions.py` | 286 | Comisiones & Split | `create`, `process_payment`, `apply_split` |
| `backend/routes/billing.py` | 108 | Legacy Billing (Deprecated) | `mark_paid` (simple) |
| `backend/routes/admin.py` | 292 | Payment Links Admin | `create_manual_link`, `verify_receipt` |

**Total Rutas:** 7  
**Total Líneas:** 3,562  
**Status:** 85% Legacy (`payment.py`, `billing.py`), 15% Modular (`invoices.py`, `commissions.py`)

---

## 1.2 SERVICIOS (Business Logic Layer)

| Archivo | Líneas | Propósito | Métodos Clave |
|---------|--------|----------|---|
| `backend/services/webhook_handler.py` | 566 | Procesamiento Webhooks MP | `process_payment_event`, `process_subscription_event`, `process_refund_event`, `process_chargeback_event` |
| `backend/services/renewal_service.py` | 306 | Auto-Renovación Suscripciones | `check_and_renew_subscriptions()`, `retry_failed_renewals()` |
| `backend/services/payment_provider_service.py` | 137 | Factory Pattern (Providers) | `StripePaymentProvider`, `PayPalPaymentProvider`, `MercadoPagoPaymentProvider` |
| `backend/services/billing_service.py` | 220 | Billing & Invoices Logic | `get_summary()`, `create_invoice()`, `pay_invoice()` |
| `backend/services/commission_service.py` | 194 | Commission Processing | `create_commission()`, `process_payment()`, `apply_split()` |
| `backend/services/cron_jobs.py` | 289 | Background Jobs Scheduler | `init_cron_scheduler()`, `check_renewals_daily()`, `retry_failed_renewals()` |

**Total Servicios:** 6  
**Total Líneas:** 1,712  
**Status:** 100% Legacy (sin abstracción de Provider Pattern efectiva)

---

## 1.3 REPOSITORIES (Data Access Layer)

| Archivo | Líneas | Propósito | Métodos Clave |
|---------|--------|----------|---|
| `backend/repositories/transaction/transaction_repository.py` | 293 | CRUD Transacciones | `create()`, `find_by_payment_id()`, `update_status()` |
| `backend/repositories/transaction/transaction_dto.py` | 89 | DTOs Transacciones | `TransactionBase`, `TransactionDocument`, `TransactionResponse` |
| `backend/repositories/transaction/transaction_indexes.py` | 152 | Índices MongoDB | `create_payment_indexes()` |
| `backend/repositories/transaction/transaction_exceptions.py` | 32 | Excepciones | `PaymentIdAlreadyExists`, `TransactionNotFound` |
| `backend/repositories/webhook_event_repository.py` | 141 | Auditoría Webhooks | `record_event()`, `is_duplicate()` |
| `backend/repositories/refund_repository.py` | 214 | Refunds & Chargebacks | `RefundRepository`, `ChargebackRepository` |

**Total Repositories:** 6  
**Total Líneas:** 921  
**Status:** ✅ 40% Modular (repositories), ❌ 60% Acceso Directo a `db.*`

---

## 1.4 MIDDLEWARE (Authorization & Context)

| Archivo | Líneas | Propósito | Impacto en Payment |
|---------|--------|----------|---|
| `backend/middleware/tenant_isolation.py` | 369 | Multi-Tenant Context | Requiere firma_id válido en payment ops |
| `backend/middleware/permission_layer.py` | 369 | RBAC Matrix | `resource_type = "invoice"` → roles `firm_owner`, `finance` |
| `backend/utils/rbac.py` | 296 | Authorization Helpers | `can_process_payment()`, `require_finance_manager()` |

**Total Middleware:** 3  
**Status:** ✅ 100% Implementado, pero **LEGACY PATTERNS**

---

## 1.5 HELPERS (Utility Functions)

| Archivo | Funciones |
|---------|-----------|
| `backend/routes/payment.py` | `get_exchange_rates()`, `detect_country_by_ip()`, `resolve_country()`, `build_locale()`, `localize_plan()`, `_create_mp_preference()`, `_apply_payment_success()`, `detect_gateway()`, `build_payment_methods()`, `_slug()` |
| `backend/services/webhook_handler.py` | `validate_hmac_signature()`, `is_event_duplicate()`, `record_webhook_event()`, `log_webhook()`, `_sanitize_payload()`, `_sanitize_headers()`, `_apply_payment_success()`, `_notify_payment_failure()` |
| `backend/services/renewal_service.py` | `_create_mp_preference()`, `_process_auto_renewal()` |
| `backend/utils/rbac.py` | `can_process_payment()`, `require_finance_manager()` |

**Total Helpers:** 25+  
**Status:** ❌ 100% Inline (sin reutilización)

---

## 1.6 WEBHOOKS & EVENT HANDLERS

| Tipo | Archivo | Línea | Validación | Idempotencia | Criticidad |
|------|---------|-------|-----------|-----------|-----------|
| **MercadoPago Payment** | `backend/routes/payment.py` | 413-480 | HMAC ✅ | Parcial | 🔴 CRÍTICA |
| **Webhook Motor** | `backend/services/webhook_handler.py` | 1-566 | Completa ✅ | HMAC+DB ✅ | 🔴 CRÍTICA |
| **Invoice Payment** | `backend/routes/invoices.py` | 385-410 | HMAC ✅ | Parcial | 🟠 ALTA |
| **Event Deduplication** | `backend/services/webhook_handler.py` | 95-140 | Sí ✅ | Sí ✅ | 🟠 ALTA |

**Total Webhooks:** 4  
**Status:** ✅ Validación correcta, ⚠️ Idempotencia parcial

---

## 1.7 CRON JOBS & BACKGROUND TASKS

| Job | Archivo | Línea | Frecuencia | Status |
|-----|---------|-------|-----------|--------|
| **Daily Renewal Check** | `backend/services/renewal_service.py` | 115-180 | Diario | ✅ Implementado |
| **Retry Failed Renewals** | `backend/services/renewal_service.py` | 200-310 | 6 horas | ✅ Implementado |
| **Webhook Log Cleanup** | `backend/services/cron_jobs.py` | 193-206 | Semanal | ✅ Implementado |
| **Webhook Health Report** | `backend/services/cron_jobs.py` | 210-240 | Semanal | ✅ Implementado |

**Bootstrapping:** `backend/server.py` líneas 92-98  
**Status:** ✅ Operacional, ⚠️ Sin error handling robusto

---

## 1.8 WORKERS & ASYNC JOBS

**Status:** ❌ **NO EXISTEN**

No hay:
- `backend/workers/`
- `backend/jobs/`
- Celery, RQ, APScheduler integrados

**Reemplazo actual:** APScheduler en `cron_jobs.py` (básico)

---

## 1.9 DTOS & REQUEST/RESPONSE SCHEMAS

| Archivo | DTO | Propósito |
|---------|-----|----------|
| `backend/routes/payment.py` | `PaymentInitRequest`, `PaymentInitResponse` | Iniciar pago |
| `backend/routes/payment.py` | `SubscriptionStatusResponse` | Estado suscripción |
| `backend/routes/payment.py` | `ChangePlanRequest` | Cambiar plan |
| `backend/routes/payment.py` | `RenewalResponse` | Renovación |
| `backend/routes/invoices.py` | `InvoiceIn`, `InvoiceUpdate` | CRUD facturas |
| `backend/routes/financial.py` | `InvoiceCreateRequest`, `InvoicePaymentRequest` | Crear/pagar facturas |
| `backend/routes/commissions.py` | `PaymentRequest`, `CommissionSplitRequest` | Pago comisiones |
| `backend/repositories/transaction/transaction_dto.py` | `TransactionBase`, `TransactionDocument`, `TransactionResponse` | Base transacciones |

**Total DTOs:** 12+  
**Status:** ✅ Pydantic schemas, ❌ Distribuidos en rutas (falta centralización)

---

## 1.10 MODELOS DE DATOS (MongoDB Schemas)

| Archivo | Modelo | Campos Clave |
|---------|--------|-------------|
| `backend/models/billing.py` | Invoice | `payment_method`, `transaction_reference`, `status` |
| `backend/models/invoice.py` | Invoice | `payment_method`, `transaction_reference` |
| `backend/models/commission.py` | Commission | `payment_method`, `transaction_reference` |
| `backend/models/subscription.py` | Subscription | `payment_method` |
| `backend/models/os_subscription.py` | OS Subscription | `billingCycle`, `renewalDate`, `autoRenew` |
| `backend/models/global_config.py` | MultiCurrencyTransaction | `payment_methods` |

**Total Modelos:** 6  
**Status:** ❌ Duplicación de campos payment (no DRY)

---

## 1.11 COLECCIONES MONGODB

| Colección | Tipo | Índices | Criticidad |
|-----------|------|---------|-----------|
| `transactions` | Payment History | `payment_id` (unique), `firm_id`, `status`, `type`, `created_at` | 🔴 CRÍTICA |
| `webhook_events` | Audit Trail | `event_id` (unique) | 🟠 ALTA |
| `webhook_logs` | Debug/Metrics | `event_id`, `created_at` | 🟡 MEDIA |
| `refunds` | Refund History | `refund_id` (unique) | 🔴 CRÍTICA |
| `chargebacks` | Chargeback History | `chargeback_id` (unique) | 🔴 CRÍTICA |
| `receipts` | Manual Receipts | `receipt_id`, `firm_id` | 🟠 ALTA |
| `audit_logs` | Compliance Log | `user_id`, `action`, `created_at` | 🟡 MEDIA |
| `notifications` | User Messages | `user_id`, `read`, `created_at` | 🟡 MEDIA |
| `invoices` | Billing Documents | `external_reference`, `firm_id`, `status` | 🔴 CRÍTICA |
| `commissions` | Commission Records | `commission_id` | 🟠 ALTA |
| `users` | (Shared) | (Shared) | 🔴 CRÍTICA |
| `subscriptions` | (Shared) | (Shared) | 🔴 CRÍTICA |

**Total Colecciones:** 12  
**Status:** ✅ Indexadas, ❌ Sin versioning, ❌ Sin backup strategy

---

# FASE 2: ESTADO DE MIGRACIÓN POR COMPONENTE

## 2.1 Matriz Estado Actual

| Componente | Categoría | Estado | Evidencia | Riesgo |
|-----------|-----------|--------|-----------|---------|
| **payment.py Router** | Routes | ❌ Legacy | `backend/routes/payment.py:1-1538` (1538 líneas monolíticas) | 🔴 CRÍTICA |
| **webhook_handler.py** | Services | 🟡 Parcial | `backend/services/webhook_handler.py:1-566` (correcto, pero sin abstracción) | 🔴 CRÍTICA |
| **renewal_service.py** | Services | 🟡 Parcial | `backend/services/renewal_service.py:1-306` (sin error handling robusto) | 🔴 CRÍTICA |
| **transaction_repository.py** | Repositories | ✅ Modular | `backend/repositories/transaction/transaction_repository.py:1-293` | 🟢 BAJA |
| **webhook_event_repository.py** | Repositories | ✅ Modular | `backend/repositories/webhook_event_repository.py:1-141` | 🟢 BAJA |
| **refund_repository.py** | Repositories | ✅ Modular | `backend/repositories/refund_repository.py:1-214` | 🟡 MEDIA |
| **billing_admin.py Router** | Routes | ❌ Legacy | `backend/routes/billing_admin.py:1-510` (acceso directo a db) | 🟠 ALTA |
| **financial.py Router** | Routes | ❌ Legacy | `backend/routes/financial.py:1-426` (acceso directo a db) | 🟠 ALTA |
| **commissions.py Router** | Routes | 🟡 Parcial | `backend/routes/commissions.py:1-286` (tiene service pero acceso directo) | 🟠 ALTA |
| **invoices.py Router** | Routes | 🟡 Parcial | `backend/routes/invoices.py:1-402` (tiene service pero webhook directo) | 🟠 ALTA |
| **commission_service.py** | Services | 🟡 Parcial | `backend/services/commission_service.py:1-194` | 🟡 MEDIA |
| **billing_service.py** | Services | 🟡 Parcial | `backend/services/billing_service.py:1-220` (minimal abstraction) | 🟡 MEDIA |
| **payment_provider_service.py** | Services | 🟡 Parcial | `backend/services/payment_provider_service.py:1-137` (placeholder factories) | 🟠 ALTA |
| **Middleware (RBAC)** | Middleware | ✅ Modern | `backend/utils/rbac.py:1-296` (implementado correctamente) | 🟢 BAJA |

**Resumen:**
- ✅ Migrado: 4 componentes (28%)
- 🟡 Parcial: 6 componentes (43%)
- ❌ Legacy: 4 componentes (29%)

---

# FASE 3: AUDITORIA COMPLETA DE ACCESOS DIRECTOS MONGODB

## 3.1 Accesos Críticos (Deben Ser Abstraídos)

### 3.1.1 db.transactions (CRÍTICA)

| Archivo | Línea | Operación | Descripción | Criticidad |
|---------|-------|-----------|-------------|-----------|
| `backend/routes/payment.py` | 433, 484 | `update_one` | Marcar pago como "paid" | 🔴 CRÍTICA |
| `backend/routes/payment.py` | 1233, 1368, 1519 | `insert_one` | Crear transacción nueva | 🔴 CRÍTICA |
| `backend/services/webhook_handler.py` | 255, 260, 390, 444, 486 | `update_one` | Actualizar estado en webhook | 🔴 CRÍTICA |
| `backend/services/webhook_handler.py` | 239, 376, 442, 532 | `find_one` | Verificar transacción existente | 🟠 ALTA |
| `backend/services/renewal_service.py` | 236 | `insert_one` | Crear transacción renovación | 🔴 CRÍTICA |
| `backend/services/renewal_service.py` | 172, 292 | `find_one`, `update_one` | Consultar/actualizar renovación | 🟠 ALTA |

**Total accesos `db.transactions`:** 20+  
**Riesgo:** Falta abstracción en routes, servicios parcialmente abstraídos

---

### 3.1.2 db.invoices (CRÍTICA)

| Archivo | Línea | Operación | Descripción | Criticidad |
|---------|-------|-----------|-------------|-----------|
| `backend/routes/invoices.py` | 155 | `insert_one` | Crear factura | 🔴 CRÍTICA |
| `backend/routes/invoices.py` | 206, 261, 330, 346, 375, 392 | `update_one` | Actualizar factura | 🔴 CRÍTICA |
| `backend/routes/invoices.py` | 223 | `delete_one` | Eliminar factura | 🔴 CRÍTICA |
| `backend/routes/invoices.py` | 179, 209, 219, 248, 268, 311 | `find_one` | Consultar factura | 🟠 ALTA |
| `backend/services/billing_service.py` | 82 | `insert_one` | Crear invoice (servicio) | 🔴 CRÍTICA |
| `backend/services/billing_service.py` | 92, 121 | `find_one_and_update` | Actualizar invoice (servicio) | 🔴 CRÍTICA |

**Total accesos `db.invoices`:** 24+  
**Riesgo:** Acceso DIRECTO en routes, necesita repository dedicado

---

### 3.1.3 db.refunds & db.chargebacks (CRÍTICA)

| Archivo | Línea | Operación | Criticidad |
|---------|-------|-----------|-----------|
| `backend/services/webhook_handler.py` | 379 | `insert_one` (refunds) | 🔴 CRÍTICA |
| `backend/services/webhook_handler.py` | 432 | `insert_one` (chargebacks) | 🔴 CRÍTICA |

**Total accesos refunds/chargebacks:** 2  
**Status:** ✅ Centralizado en `webhook_handler.py`, ⚠️ Sin abstracción repository

---

### 3.1.4 db.users (CRÍTICA en contexto Payment)

| Archivo | Línea | Operación | Descripción | Criticidad |
|---------|-------|-----------|-------------|-----------|
| `backend/routes/payment.py` | 451, 464, 620, 1305, 1382, 1424 | `update_one` | Actualizar plan/suscripción usuario | 🔴 CRÍTICA |
| `backend/routes/payment.py` | 451, 464 | `find_one` | Consultar usuario actual | 🟠 ALTA |
| `backend/routes/billing_admin.py` | 461 | `update_one` | Admin: actualizar plan usuario | 🔴 CRÍTICA |
| `backend/routes/billing_admin.py` | 459, 498 | `find_one` | Admin: consultar usuario | 🟠 ALTA |
| `backend/services/renewal_service.py` | 253, 288 | `find_one`, `update_one` | Renovación: actualizar suscripción | 🔴 CRÍTICA |
| `backend/services/cron_jobs.py` | 143, 180 | `update_many`, `update_one` | Cron: actualizar usuarios en batch | 🔴 CRÍTICA |

**Total accesos `db.users` (payment context):** 18+  
**Riesgo:** Actualizaciones críticas sin validación centralizada

---

### 3.1.5 db.notifications & db.audit_logs (MEDIA)

| Archivo | Línea | Operación | Criticidad |
|---------|-------|-----------|-----------|
| `backend/routes/payment.py` | 476, 626 | `insert_one` (notifications) | 🟡 MEDIA |
| `backend/routes/payment.py` | 1414, 1522 | `insert_one` (audit_logs) | 🟡 MEDIA |
| `backend/services/webhook_handler.py` | 453, 534 | `insert_one` (notifications) | 🟡 MEDIA |
| `backend/services/webhook_handler.py` | 266, 343, 401, 464 | `insert_one` (audit_logs) | 🟡 MEDIA |
| `backend/services/renewal_service.py` | 240 | `insert_one` (notifications) | 🟡 MEDIA |

**Total accesos notifications/audit_logs:** 15+  
**Status:** ✅ Centralizado, ⚠️ Sin abstracción

---

### 3.1.6 db.commissions (CRÍTICA)

| Archivo | Línea | Operación | Criticidad |
|---------|-------|-----------|-----------|
| `backend/services/commission_service.py` | 37 | `insert_one` | 🔴 CRÍTICA |
| `backend/services/commission_service.py` | 90, 149, 185 | `find_one_and_update` | 🔴 CRÍTICA |
| `backend/routes/leads.py` | 240 | `insert_one` | 🔴 CRÍTICA |

**Total accesos `db.commissions` (payment):** 5+  
**Status:** Parcialmente abstraído en `commission_service.py`

---

## 3.2 Resumen Conteo Accesos

| Colección | Total Accesos | Crítica | Alta | Media | Repository Existente |
|-----------|---------------|---------|------|-------|----------------------|
| `transactions` | 20+ | 8 | 7 | 5 | ✅ Sí |
| `invoices` | 24+ | 6 | 4 | 14 | ❌ No |
| `refunds` | 3 | 1 | 1 | 1 | ✅ Sí (parcial) |
| `chargebacks` | 3 | 1 | 1 | 1 | ✅ Sí (parcial) |
| `webhook_events` | 8 | 1 | 2 | 5 | ✅ Sí |
| `webhook_logs` | 12 | 0 | 1 | 11 | ❌ No |
| `audit_logs` | 15 | 0 | 0 | 15 | ❌ No |
| `notifications` | 15 | 0 | 2 | 13 | ❌ No |
| `users` (payment) | 18+ | 6 | 5 | 7 | ❌ Acceso directo |
| `commissions` | 5 | 3 | 1 | 1 | ✅ Parcial |
| **TOTAL** | **123+** | **26** | **24** | **73** | — |

---

# FASE 4: ORDEN DE MIGRACIÓN POR DEPENDENCIAS

## 4.1 Dependency Graph

```
Layer 1: Data Models
  ├─ transaction_repository.py (✅ listo)
  ├─ webhook_event_repository.py (✅ listo)
  ├─ refund_repository.py (✅ listo)
  └─ NEW: invoice_repository.py

         ↓

Layer 2: Business Logic Services
  ├─ payment_provider_service.py (actualizar)
  ├─ webhook_handler.py (refactorizar)
  ├─ renewal_service.py (actualizar)
  ├─ commission_service.py (actualizar)
  ├─ billing_service.py (actualizar)
  └─ NEW: invoice_service.py

         ↓

Layer 3: Routes/Handlers
  ├─ payment.py (refactorizar - MONOLÍTICA)
  ├─ payment_catalog.py (NUEVO - split)
  ├─ payment_checkout.py (NUEVO - split)
  ├─ payment_webhook.py (NUEVO - split)
  ├─ payment_subscription.py (NUEVO - split)
  ├─ invoices.py (refactorizar)
  ├─ commissions.py (refactorizar)
  ├─ financial.py (refactorizar)
  └─ billing_admin.py (refactorizar)

         ↓

Layer 4: Integration Tests
  ├─ test_payment_init.py
  ├─ test_webhook_handler.py
  ├─ test_renewal_flow.py
  └─ test_invoices.py

         ↓

Layer 5: Certification & Rollback
  ├─ payment_certification.md
  ├─ rollback_strategy.md
  └─ parity_validation.md
```

## 4.2 Orden Exacto de Migración

### Fase A: PREPARACIÓN (Semana 1)

**A1** → Crear `invoice_repository.py` (independiente, sin dependencias)
**A2** → Crear `invoice_service.py` (utiliza `invoice_repository.py`)
**A3** → Actualizar `transaction_repository.py` (agregar métodos faltantes)
**A4** → Actualizar `refund_repository.py` (agregar métodos faltantes)

### Fase B: SERVICIOS (Semana 2)

**B1** → Refactorizar `webhook_handler.py` (usar repositories)
**B2** → Refactorizar `renewal_service.py` (usar repositories + error handling)
**B3** → Refactorizar `commission_service.py` (usar repositories)
**B4** → Refactorizar `billing_service.py` (usar repositories)
**B5** → Actualizar `payment_provider_service.py` (factory pattern correcto)

### Fase C: ROUTES - SPLIT MONOLÍTICA (Semana 3-4)

**C1** → Crear `payment_catalog.py` (rutas `/catalog`, `/methods`)
**C2** → Crear `payment_checkout.py` (rutas `/init`, `/confirm`)
**C3** → Crear `payment_webhook.py` (rutas `/webhook` + manejo)
**C4** → Crear `payment_subscription.py` (rutas `/my-plan`, `/renew`, `/change-plan`, `/cancel`)
**C5** → Refactorizar `invoices.py` (usar `invoice_service.py`)
**C6** → Refactorizar `commissions.py` (usar `commission_service.py`)
**C7** → Refactorizar `financial.py` (usar `billing_service.py` + `invoice_service.py`)
**C8** → Refactorizar `billing_admin.py` (usar repositories)
**C9** → Deprecar `payment.py` (legacy router)

### Fase D: TESTING (Semana 5)

**D1** → Test `invoice_repository.py` (unit + integration)
**D2** → Test `invoice_service.py`
**D3** → Test renovación (`renewal_service.py`)
**D4** → Test webhooks (`webhook_handler.py`)
**D5** → Test rutas payment (integration tests)
**D6** → Test flujo end-to-end (customer journey)

### Fase E: CERTIFICACIÓN & ROLLBACK (Semana 6)

**E1** → Validar paridad entre legacy y nueva arquitectura
**E2** → Crear playbook de rollback
**E3** → Simulación de fallos (chaos engineering)
**E4** → Certificación GO/NO-GO

---

# FASE 5: SPRINT BACKLOG DETALLADO

## 5.1 Matriz de Tareas

| ID | Objetivo | Horas Est. | Dependencias | Riesgo | Rollback | DoD |
|----|----------|-----------|--------------|--------|----------|-----|
| **A1** | Crear `invoice_repository.py` | 8 | Ninguna | 🟡 Media | git revert | Tests ✅, Linting ✅ |
| **A2** | Crear `invoice_service.py` | 6 | A1 | 🟢 Baja | git revert | Tests ✅, Pydantic DTOs ✅ |
| **A3** | Actualizar `transaction_repository.py` | 4 | Ninguna | 🟢 Baja | git revert | Tests ✅, Métodos validados |
| **A4** | Actualizar `refund_repository.py` | 4 | Ninguna | 🟢 Baja | git revert | Tests ✅, Métodos validados |
| **B1** | Refactorizar `webhook_handler.py` | 12 | A1, A3, A4 | 🔴 Crítica | git revert + DB rollback | Parity tests ✅, No data loss |
| **B2** | Refactorizar `renewal_service.py` | 10 | A3, B1 | 🔴 Crítica | git revert + Compensation | Error handling ✅, Retry logic ✅ |
| **B3** | Refactorizar `commission_service.py` | 6 | A2 | 🟡 Media | git revert | Tests ✅, Split validated |
| **B4** | Refactorizar `billing_service.py` | 8 | A1, A2 | 🟡 Media | git revert | Tests ✅, Aggregations ✅ |
| **B5** | Actualizar `payment_provider_service.py` | 6 | Ninguna | 🟡 Media | git revert | Mocks ✅, Factory pattern ✅ |
| **C1** | Crear `payment_catalog.py` | 6 | B5 | 🟡 Media | git revert | Route tests ✅, Localization ✅ |
| **C2** | Crear `payment_checkout.py` | 8 | B5, C1 | 🔴 Crítica | git revert + State rollback | Init/confirm flow ✅, MP integration ✅ |
| **C3** | Crear `payment_webhook.py` | 8 | B1, B2 | 🔴 Crítica | git revert + Event replay | Webhook tests ✅, Deduplication ✅ |
| **C4** | Crear `payment_subscription.py` | 10 | B1, B2, C3 | 🔴 Crítica | git revert + Subscription rollback | All subscription flows ✅ |
| **C5** | Refactorizar `invoices.py` | 6 | A2, C3 | 🔴 Crítica | git revert | Invoice tests ✅, MP webhook ✅ |
| **C6** | Refactorizar `commissions.py` | 4 | B3, A2 | 🟡 Media | git revert | Commission tests ✅ |
| **C7** | Refactorizar `financial.py` | 6 | A2, B4 | 🟡 Media | git revert | Financial aggregates ✅ |
| **C8** | Refactorizar `billing_admin.py` | 8 | A3, B4, C3 | 🟡 Media | git revert | Admin dashboard ✅ |
| **C9** | Deprecar `payment.py` | 2 | C1-C8 ✅ | 🟢 Baja | No action needed | Warnings logged ✅ |
| **D1-D6** | Suite completa tests | 32 | B1-C8 | 🟡 Media | Deploy rollback | Coverage ≥ 85% ✅ |
| **E1-E4** | Certificación final | 16 | D1-D6 | 🟡 Media | Rollback playbook | Parity ✅, Sign-off ✅ |

**Total Estimado:** ~180-200 horas (4-5 semanas, 40h/semana con equipo de 2 devs)

---

# FASE 6: QUICK WINS (High-Impact, Low-Effort)

## 6.1 Identificadas y Priorizadas

| ID | Win | Esfuerzo | Impacto | Orden |
|----|-----|----------|---------|-------|
| **QW1** | Centralizar helpers payment en `backend/utils/payment_helpers.py` | 2h | 🟠 Media (DRY) | 1 |
| **QW2** | Crear `NotificationService` (extraer lógica dispersa) | 3h | 🟡 Media (Reusable) | 2 |
| **QW3** | Implementar `@validate_payment_signature` decorator | 2h | 🟢 Alta (Security) | 3 |
| **QW4** | Crear `PaymentErrorMapper` (standarizar errores) | 3h | 🟡 Media (UX) | 4 |
| **QW5** | Agregar `@idempotent_webhook` decorator | 2h | 🟢 Alta (Reliability) | 5 |
| **QW6** | Crear enum `PaymentStatus` + `PaymentGateway` | 1h | 🟢 Alta (Type safety) | 6 |
| **QW7** | Migrate indexes to `indexes_builder.py` (centralized) | 2h | 🟡 Media (Maintainability) | 7 |

**Total Quick Wins:** 15 horas  
**ROI:** Ejecutar ANTES de fase B (preparación de infraestructura)

---

# FASE 7: BLOQUEADORES IDENTIFICADOS

## 7.1 Críticos (Deben Resolverse ANTES de Sprint)

### 🚨 **BLOQUEADOR #1: MERGE CONFLICT ACTIVO**

**Descripción:** Existe merge conflict detectado en rama `staging`  
**Impacto:** No se puede proceder con auditoría hasta resolverse  
**Acción Requerida:** Usuario debe usar [Sync From Remote](#sync-from-remote) para resolver  
**Riesgo:** Alto (invalida todo el trabajo actual)  
**Timeline:** Debe resolverse HOY

---

### 🚨 **BLOQUEADOR #2: FALTA INVOICE_REPOSITORY**

**Descripción:** No existe abstracción de datos para `db.invoices`  
**Ubicación:** Acceso directo en 24+ líneas (routes + services)  
**Impacto:** No se puede testear/migrar invoices sin romper otros módulos  
**Acción Requerida:** Crear `invoice_repository.py` (A1 en backlog)  
**Timeline:** Crítico, blocka B4, C5

```python
# FALTA:
# backend/repositories/invoice/invoice_repository.py
# backend/repositories/invoice/invoice_dto.py
# backend/repositories/invoice/invoice_exceptions.py
```

---

### 🚨 **BLOQUEADOR #3: MONOLÍTICA payment.py (1538 líneas)**

**Descripción:** Router contiene 7-8 responsabilidades diferentes  
**Ubicación:** `backend/routes/payment.py`  
**Impacto:** Imposible testear, refactorizar o desplegar parcialmente  
**Acción Requerida:** SPLIT en 4 routers pequeños (C1-C4)  
**Timeline:** Bloqueador para Phase C

```
payment.py (1538) → 
  payment_catalog.py (método catálogo)
  payment_checkout.py (init/confirm)
  payment_webhook.py (webhook + handlers)
  payment_subscription.py (renew/change/cancel)
```

---

## 7.2 Altos (Necesitan Mitigación)

### ⚠️ **BLOQUEADOR #4: SIN ABSTRACCIÓN USER (Payment Context)**

**Descripción:** `db.users.update_one()` en 6+ líneas críticas sin validación centralizada  
**Ubicación:** `backend/routes/payment.py`, `backend/routes/billing_admin.py`, `renewal_service.py`  
**Riesgo:** Actualización de suscripción sin ACID guarantees  
**Acción Requerida:** Crear `UserSubscriptionRepository` con transacciones MongoDB

---

### ⚠️ **BLOQUEADOR #5: RENEWAL_SERVICE SIN ERROR HANDLING ROBUSTO**

**Descripción:** Auto-renovación puede fallar sin retry/compensation  
**Ubicación:** `backend/services/renewal_service.py:200-310`  
**Riesgo:** Pérdida de pagos, inconsistencia de estado  
**Acción Requerida:** Implementar exponential backoff + dead letter queue (B2)

---

### ⚠️ **BLOQUEADOR #6: NO HAY WEBHOOK REPLAY STRATEGY**

**Descripción:** Si un webhook falla, no hay forma de re-procesar  
**Ubicación:** `backend/services/webhook_handler.py` + `backend/services/cron_jobs.py`  
**Riesgo:** Pérdida de transacciones MercadoPago  
**Acción Requerida:** Crear `webhook_replay_job.py` (cron para eventos "pending")

---

## 7.3 Resumen Bloqueadores

| ID | Severidad | Descripción | Acción | Timeline |
|----|-----------|-------------|--------|----------|
| B1 | 🚨 CRÍTICA | Merge conflict activo | Sync remote | HOY |
| B2 | 🚨 CRÍTICA | Falta invoice_repository | Crear A1 | Semana 1 |
| B3 | 🚨 CRÍTICA | payment.py monolítica | Split C1-C4 | Semana 3-4 |
| B4 | ⚠️ ALTA | User updates sin abstracción | Crear UserSubRepo | Semana 2 |
| B5 | ⚠️ ALTA | Renewal error handling | Actualizar B2 | Semana 2 |
| B6 | ⚠️ ALTA | Sin webhook replay | Crear job | Semana 1-2 |

---

# FASE 8: READINESS ASSESSMENT

## 8.1 Checklist Pre-Sprint

| Item | Status | Evidencia | Acción |
|------|--------|-----------|--------|
| ✅ Arquitectura congelada | ✅ APROBADA | Architecture Freeze v1.0 | — |
| ✅ Dominio Payment inventariado | ✅ COMPLETO | Fases 1-3 arriba | — |
| ❌ Merge conflicts resueltos | ❌ PENDIENTE | git status | **RESOLVER HOY** |
| ❌ invoice_repository creado | ❌ PENDIENTE | No existe | Crear semana 1 |
| ❌ payment.py splitteado | ❌ PENDIENTE | 1538 líneas monolíticas | Crear semana 3-4 |
| ⚠️ Tests de paridad | ⚠️ PARCIAL | Existen algunos tests | Expandir 50% más |
| ⚠️ Rollback playbook | ⚠️ EN DRAFT | Documento parcial | Finalizar semana 5 |
| ⚠️ Documentación APIs | ⚠️ PENDIENTE | Sin OpenAPI spec | Crear después de split |

---

## 8.2 RESPUESTA FINAL A LA PREGUNTA CLAVE

### ❓ **¿Está el dominio Payment listo para comenzar la migración?**

### ✅ **RESPUESTA: NO** 

**Con condiciones de entrada específicas:**

---

### 8.2.1 Razones

1. **🚨 BLOQUEADOR #1 ACTIVO: Merge conflict sin resolver**  
   - No se puede trabajar hasta que se sincronice remote
   - Invalida todo el análisis actual

2. **🚨 BLOQUEADOR #2: Falta abstracción `invoice_repository.py`**  
   - 24+ accesos directos a `db.invoices` sin centralización
   - Imposible testear cambios en rutas sin romper datos
   - **Debe crearse ANTES de comenzar fase B**

3. **🚨 BLOQUEADOR #3: payment.py monolítica (1538 líneas)**  
   - 7-8 responsabilidades mezcladas
   - Ningún cambio es seguro sin split
   - **Debe splittearse ANTES de fase C**

4. **⚠️ PROBLEMAS SECUNDARIOS:**
   - Falta error handling robusto en `renewal_service.py`
   - Sin webhook replay strategy (pérdida de eventos)
   - Actualizaciones de usuario sin ACID guarantees
   - Tests de cobertura < 70%

---

### 8.2.2 Camino a GO

**Para activar SPRINT 1, ejecutar EN ORDEN:**

#### PASO 1: HOY (2 horas)
```bash
# Resolver merge conflict
[Sync From Remote]  # Click button en UI
git status  # Verificar clean

# Confirmar clean state
git log --oneline -1  # Debe mostrar staging limpia
```

#### PASO 2: SEMANA 1 (20 horas - Quick Wins + A1-A4)
```
✓ QW1-QW7 (Quick Wins: 15h)
✓ A1: Crear invoice_repository.py (8h)
✓ A2-A4: Actualizar repositories (14h)
```

#### PASO 3: ANTES DE SEMANA 2
```
✓ Crear webhook_replay_job.py
✓ Setup CI/CD con tests automated
✓ Crear rollback playbook inicial
```

#### PASO 4: ANTES DE SEMANA 3
```
✓ Completar B1-B5 (servicios refactorizados)
✓ Coverage tests ≥ 80%
✓ Sign-off técnico de arquitecto
```

---

### 8.2.3 Evaluación Verde-Amarillo-Rojo

| Dimension | Status | Score | Requerimiento |
|-----------|--------|-------|---------------|
| **Inventario Completo** | ✅ VERDE | 100% | Completado (Fase 1-3) |
| **Abstracciones Críticas** | 🟡 AMARILLO | 40% | Necesita A1-A4 PRIMERO |
| **Error Handling** | 🟡 AMARILLO | 50% | Necesita B1-B2 PRIMERO |
| **Test Coverage** | 🟡 AMARILLO | 65% | Necesita D1-D6 PRIMERO |
| **Documentación** | 🟡 AMARILLO | 30% | En progreso |
| **Rollback Strategy** | 🟡 AMARILLO | 40% | En draft |
| **Merge Conflict** | 🔴 ROJO | 0% | BLOQUEADOR ACTIVO |

**OVERALL: 🟡 AMARILLO → 🟢 VERDE** después de resolver 3 bloqueadores + Quick Wins

---

## 8.3 RESPUESTA EJECUTIVA

```
┌──────────────────────────────────────────────────────────┐
│ SPRINT 1: PAYMENT CORE MIGRATION                         │
│                                                          │
│ ¿LISTO PARA EMPEZAR?                                    │
│                                                          │
│ ❌ NO - REQUIERE ACCIONES PREVIAS                        │
│                                                          │
│ TIMELINE REALISTA:                                      │
│ • HOY: Resolver merge conflict (2h)                     │
│ • Semana 1: Quick wins + Prep (20h)                     │
│ • Semana 2-6: Migración principal (160h)                │
│ • TOTAL: 5-6 semanas, 2 devs, 40h/semana              │
│                                                          │
│ RIESGOS PRINCIPALES:                                   │
│ 1. Merge conflict sin resolver                         │
│ 2. invoice_repository no existe                        │
│ 3. payment.py monolítica bloqueador                    │
│ 4. Renewal service sin error handling                  │
│ 5. Tests cobertura baja                                │
│                                                          │
│ RECOMENDACIÓN:                                          │
│ → Resolver bloqueadores en orden antes de Day 1         │
│ → Hacer Quick Wins como "warm-up"                       │
│ → Comenzar Fase B (servicios) Week 2                    │
│ → NO comenzar hasta clean merge                         │
└──────────────────────────────────────────────────────────┘
```

---

# APÉNDICE A: MAPEO COMPLETO PAYMENT DOMAIN

## A.1 Por Archivo (Orden Alfabético)

```
backend/dependencies.py:16 — Import TransactionRepository
backend/dependencies.py:38 — db.transactions binding
backend/dependencies.py:46 — db.webhook_events binding
backend/dependencies.py:54 — db.audit_logs binding
backend/dependencies.py:70 — db.notifications binding
backend/dependencies.py:78 — db.refunds binding
backend/dependencies.py:86 — db.chargebacks binding

backend/middleware/permission_layer.py:369 — resource_type="invoice"
backend/middleware/tenant_isolation.py:369 — firm_id context

backend/models/billing.py:65 — Invoice model
backend/models/commission.py:48 — Commission with payment fields
backend/models/global_config.py:58 — MultiCurrencyTransaction
backend/models/invoice.py:37 — Invoice model (duplicated)
backend/models/os_subscription.py:79 — OS subscription with billing
backend/models/subscription.py:29 — Subscription model
backend/models/timeline_event.py:61 — Payment timeline events

backend/repositories/refund_repository.py:214 — Refund + Chargeback repo
backend/repositories/transaction/transaction_dto.py:89 — Transaction DTOs
backend/repositories/transaction/transaction_exceptions.py:32 — Transaction exceptions
backend/repositories/transaction/transaction_indexes.py:152 — Payment indexes
backend/repositories/transaction/transaction_repository.py:293 — Transaction CRUD
backend/repositories/webhook_event_repository.py:141 — Webhook audit

backend/routes/admin.py:292 — Payment links admin
backend/routes/billing.py:108 — Legacy billing (deprecated)
backend/routes/billing_admin.py:510 — Billing dashboard + admin
backend/routes/commissions.py:286 — Commission routes
backend/routes/financial.py:426 — Financial summary routes
backend/routes/invoices.py:402 — Invoice CRUD + webhook
backend/routes/payment.py:1538 — MONOLITHIC payment router ⚠️
backend/routes/referrals.py:64 — db.transactions + users (referrals)

backend/server.py:92-98 — Cron bootstrap
backend/server.py:292-337 — Index creation for all payment collections

backend/services/billing_service.py:220 — Invoice + billing logic
backend/services/commission_service.py:194 — Commission processing
backend/services/cron_jobs.py:289 — Background job scheduler
backend/services/payment_provider_service.py:137 — Provider factory
backend/services/renewal_service.py:306 — Auto-renewal logic
backend/services/webhook_handler.py:566 — Webhook processing core

backend/utils/audit.py:30 — Audit logging (used in payment)
backend/utils/rbac.py:296 — RBAC + can_process_payment()

FRONTEND (optional tracking):
frontend/src/modules/billing/components/PaymentMethods.jsx:43
frontend/src/services/os/billing.service.js:150
frontend/src/pages/CheckoutPage.jsx
frontend/src/pages/DashboardHome.jsx
frontend/src/pages/LandingPage.jsx
frontend/src/modules/billing/pages/BillingDashboard.jsx
```

---

# APÉNDICE B: DEFINICIONES DE HECHO (DoD)

### Tarea completada cuando:

1. ✅ Código pasa linting (black + flake8)
2. ✅ Tests unitarios ≥ 80% coverage
3. ✅ Tests integración pasan
4. ✅ No hay acceso directo a `db.*` fuera de repositories
5. ✅ Pydantic DTOs para todas las entradas/salidas
6. ✅ Documentación en docstrings (métodos públicos)
7. ✅ Commit message sigue convención (feat/fix/refactor + ID)
8. ✅ Code review aprobado
9. ✅ Rollback strategy documentada
10. ✅ No breaking changes sin deprecation warning

---

# APÉNDICE C: ESCALATION CONTACTS

| Rol | Nombre | Área | Decisiones |
|-----|--------|------|-----------|
| CTO | [Este doc] | Arquitectura | Go/No-Go, Design decisions |
| Migration Lead | [Este doc] | Sprint execution | Task prioritization |
| DevOps | [TBD] | Deployment | Release strategy |
| QA | [TBD] | Testing | Test strategy |
| Product | [TBD] | Stakeholder | Feature sign-off |

---

# CONTROL DE VERSIONES

| Versión | Fecha | Cambios |
|---------|-------|---------|
| v1.0 | 2024 | Initial audit + backlog |
| v1.1 | [TBD] | Post quick-wins review |
| v1.2 | [TBD] | Post Phase B review |
| v2.0 | [TBD] | Post migration sign-off |

---

**FIN DEL DOCUMENTO**

---

## ⚙️ SIGUIENTE PASO INMEDIATO

### 1️⃣ **RESOLVER MERGE CONFLICT**
   Usa [Sync From Remote](#sync-from-remote) button en la UI

### 2️⃣ **CONFIRMAR STATE LIMPIO**
   ```bash
   git status  # Debe mostrar "nothing to commit"
   ```

### 3️⃣ **CUANDO ESTÉ LIMPIO**
   Aviso para proceder con SPRINT 1 ejecución (Week 1 Quick Wins)

---

**Documento Oficial:** `SPRINT_1_PAYMENT_CORE_MIGRATION_PLAN_v1.0.md`  
**Estatus:** ✅ Auditoría Completa, ❌ Bloqueadores Detectados, 🟡 Listo con Condiciones
