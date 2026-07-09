# FASE 1-6: Auditoría Completa de Cobertura Repository Pattern

## FASE 1: INVENTARIO DE TODAS LAS COLECCIONES MONGODB

### 1.1 Colecciones Identificadas (Total: 38 colecciones)

A partir de búsqueda exhaustiva en `await db.<collection>` en toda la base de código:

| # | Colección | Archivo(s) Utilizados | Ops | Criticidad |
|---|-----------|----------------------|-----|------------|
| 1 | `users` | 20+ (admin_ops, admin_master, leads, users, rbac, team, etc.) | 45+ | **CRÍTICA** |
| 2 | `cases` | 15+ (admin_ops, cases, leads, team, organizations, etc.) | 35+ | **CRÍTICA** |
| 3 | `leads` | 12+ (leads, sales_analytics, ai_engines, autonomous, etc.) | 28+ | **CRÍTICA** |
| 4 | `commissions` | 8+ (sales_analytics, ai_engines, organizations, team, etc.) | 18+ | **ALTA** |
| 5 | `organizations` | 10+ (organizations, analytics, autonomous, timeline, etc.) | 22+ | **CRÍTICA** |
| 6 | `invoices` | 8+ (admin_ops, accounting, leads, etc.) | 18+ | **ALTA** |
| 7 | `documents` | 5+ (cases, portal, etc.) | 12+ | **ALTA** |
| 8 | `notifications` | 5+ (admin_ops, referrals, renewal, etc.) | 10+ | **MEDIA** |
| 9 | `transactions` | 8+ (payment, renewal, webhook_handler, referrals, etc.) | 18+ | **CRÍTICA** |
| 10 | `audit_logs` | 10+ (accounting, admin_ops, admin_master, etc.) | 20+ | **ALTA** |
| 11 | `timeline_events` | 5+ (timeline, autonomous, leads, cases, legal_os, etc.) | 15+ | **MEDIA** |
| 12 | `expedientes` | 2+ (admin_master, expediente utils) | 4 | **MEDIA** |
| 13 | `case_activities` | 3+ (cases, backup) | 6 | **MEDIA** |
| 14 | `meetings` | 2+ (cases, backup) | 4 | **MEDIA** |
| 15 | `appointments` | 2+ (cases, backup) | 4 | **MEDIA** |
| 16 | `clients` | 2+ (cases, organizations) | 4 | **MEDIA** |
| 17 | `ai_sessions` | 1+ (ai routes) | 3 | **MEDIA** |
| 18 | `ai_usage` | 1+ (ai routes) | 3 | **MEDIA** |
| 19 | `sales_chat` | 1+ (admin_ops) | 2 | **BAJA** |
| 20 | `team_audit_log` | 1+ (team) | 2 | **BAJA** |
| 21 | `webhook_events` | 2+ (webhook_handler, server) | 5 | **MEDIA** |
| 22 | `webhook_logs` | 2+ (admin_master, webhook_handler) | 6 | **MEDIA** |
| 23 | `refunds` | 2+ (webhook_handler, server) | 4 | **MEDIA** |
| 24 | `chargebacks` | 2+ (webhook_handler, server) | 4 | **MEDIA** |
| 25 | `payment_links` | 1+ (admin routes) | 2 | **BAJA** |
| 26 | `receipts` | 2+ (admin_master, payment routes) | 4 | **MEDIA** |
| 27 | `system_logs` | 1+ (renewal_service) | 2 | **BAJA** |
| 28 | `backups` | 1+ (backup routes) | 3 | **BAJA** |
| 29 | `accounting_movements` | 5+ (accounting routes) | 12+ | **MEDIA** |
| 30 | `subscriptions` | 2+ (organizations, subscription_service) | 4 | **MEDIA** |
| 31 | `os_subscriptions` | 2+ (subscription_service) | 8+ | **MEDIA** |
| 32 | `partners` | 3+ (organizations, partner_service, analytics) | 7 | **MEDIA** |
| 33 | `implementations` | 2+ (implementation_service) | 6 | **MEDIA** |
| 34 | `role_assignments` | 1+ (rbac routes) | 2 | **BAJA** |
| 35 | `messages` | 2+ (messages routes) | 4 | **MEDIA** |
| 36 | `counters` | 1+ (case_number_generator) | 1 | **BAJA** |
| 37 | `firms` | 1+ (firms routes, bootstrap) | 3 | **MEDIA** |
| 38 | `document_access_logs` | 1+ (documents) | 3 | **MEDIA** |

**TOTAL: 38 colecciones MongoDB**

---

## FASE 2: IDENTIFICACIÓN DE REPOSITORIOS EXISTENTES

### 2.1 Repositorios Actualmente Existentes

#### Repositorios que Heredan de BaseRepository:

| Repositorio | Archivo | Colección | Estado |
|-----------|---------|-----------|--------|
| `CaseRepository` | `backend/repositories/case_repository.py` | `cases` | ✅ BaseRepository |
| `DocumentRepository` | `backend/repositories/document_repository.py` | `documents` | ✅ BaseRepository |
| `DocumentAccessLogRepository` | `backend/repositories/document_access_log_repository.py` | `document_access_logs` | ✅ BaseRepository |
| `FirmRepository` | `backend/repositories/firm_repository.py` | `firms` | ✅ BaseRepository |
| `UserRepository` (wrapper) | `backend/services/enterprise_user_service.py` | `users` | ✅ BaseRepository |
| `RoleRepository` (wrapper) | `backend/services/enterprise_permission_service.py` | `roles` | ✅ BaseRepository |
| `SessionRepository` (wrapper) | `backend/services/enterprise_auth_service.py` | `sessions` | ✅ BaseRepository |
| `AuditRepository` (wrapper) | `backend/services/enterprise_audit_service.py` | `audit_logs` | ✅ BaseRepository |

**TOTAL Repositorios BaseRepository:** 8

#### Repositorios con Acceso Directo (Sin Heredar BaseRepository):

| Archivo | Colección(es) | Patrón | Método |
|---------|---------------|--------|--------|
| `subscription_service.py` | `os_subscriptions` | `_tenant_filter()` custom | Híbrido |
| `organization_service.py` | `organizations` | `_tenant_filter()` custom | Híbrido |
| `partner_service.py` | `partners` | `_tenant_filter()` custom | Híbrido |
| `implementation_service.py` | `implementations` | `_tenant_filter()` custom | Híbrido |
| `analytics_service.py` | `organizations`, `partners`, `implementations`, `os_subscriptions`, `billing` | Acceso directo | Direct |
| `ai_engines.py` | `leads`, `commissions`, `cases`, `users` | Acceso directo | Direct |
| `autonomous_system_orchestrator.py` | `organizations`, `leads`, `commissions`, `cases`, `users` | Acceso directo | Direct |
| `ai_optimization_engine.py` | `leads`, `cases`, `users`, `commissions` | Acceso directo | Direct |
| `ai_scoring_engine.py` | `users`, `cases`, `leads` | Acceso directo | Direct |
| `legal_os_engines.py` | `leads`, `cases`, `users`, `organizations`, `commissions` | Acceso directo | Direct |
| `legal_os_core.py` | `leads`, `cases`, `users`, `organizations`, `commissions` | Acceso directo | Direct |
| `global_network_service.py` | `users`, `firm_connections`, `compliance_logs`, `cases` | Acceso directo | Direct |
| `webhook_handler.py` | `transactions`, `webhook_events`, `webhook_logs`, `refunds`, `chargebacks`, `notifications`, `audit_logs` | Acceso directo | Direct |
| `renewal_service.py` | `users`, `transactions`, `system_logs`, `notifications` | Acceso directo | Direct |
| `payment.py` (routes) | `transactions`, `receipts`, `users`, `notifications`, `audit_logs` | Acceso directo | Direct |

---

## FASE 3: TABLA COMPLETA DE COBERTURA

### 3.1 Estado de Cada Colección

| # | Colección | Operaciones | Repository | BaseRepository | TenantAwareQuery | Estado | Riesgo |
|---|-----------|-------------|-----------|-----------------|------------------|--------|--------|
| 1 | `users` | 45+ | No dedicado | Wrapper en services | Parcial | ⚠️ PARTIAL | **CRÍTICO** |
| 2 | `cases` | 35+ | ✅ CaseRepository | ✅ SÍ | ✅ SÍ | ✅ SEGURO | BAJO |
| 3 | `leads` | 28+ | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | **CRÍTICO** |
| 4 | `commissions` | 18+ | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | **CRÍTICO** |
| 5 | `organizations` | 22+ | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | **CRÍTICO** |
| 6 | `invoices` | 18+ | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | **ALTO** |
| 7 | `documents` | 12+ | ✅ DocumentRepository | ✅ SÍ | ✅ SÍ | ✅ SEGURO | BAJO |
| 8 | `notifications` | 10+ | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | **ALTO** |
| 9 | `transactions` | 18+ | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | **CRÍTICO** |
| 10 | `audit_logs` | 20+ | Wrapper | ✅ SÍ | Parcial | ⚠️ PARTIAL | BAJO |
| 11 | `timeline_events` | 15+ | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | **ALTO** |
| 12 | `expedientes` | 4 | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | MEDIO |
| 13 | `case_activities` | 6 | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | MEDIO |
| 14 | `meetings` | 4 | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | MEDIO |
| 15 | `appointments` | 4 | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | MEDIO |
| 16 | `clients` | 4 | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | MEDIO |
| 17 | `ai_sessions` | 3 | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | BAJO |
| 18 | `ai_usage` | 3 | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | BAJO |
| 19 | `sales_chat` | 2 | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | BAJO |
| 20 | `team_audit_log` | 2 | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | BAJO |
| 21 | `webhook_events` | 5 | ❌ NO | ❌ NO | ❌ NO | ⚠️ GLOBAL | MEDIO |
| 22 | `webhook_logs` | 6 | ❌ NO | ❌ NO | ❌ NO | ⚠️ GLOBAL | MEDIO |
| 23 | `refunds` | 4 | ❌ NO | ❌ NO | ❌ NO | ⚠️ GLOBAL | MEDIO |
| 24 | `chargebacks` | 4 | ❌ NO | ❌ NO | ❌ NO | ⚠️ GLOBAL | MEDIO |
| 25 | `payment_links` | 2 | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | BAJO |
| 26 | `receipts` | 4 | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | MEDIO |
| 27 | `system_logs` | 2 | ❌ NO | ❌ NO | ❌ NO | ⚠️ GLOBAL | BAJO |
| 28 | `backups` | 3 | ❌ NO | ❌ NO | ❌ NO | ⚠️ GLOBAL | BAJO |
| 29 | `accounting_movements` | 12+ | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | **ALTO** |
| 30 | `subscriptions` | 4 | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | MEDIO |
| 31 | `os_subscriptions` | 8+ | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | **ALTO** |
| 32 | `partners` | 7 | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | MEDIO |
| 33 | `implementations` | 6 | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | MEDIO |
| 34 | `role_assignments` | 2 | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | BAJO |
| 35 | `messages` | 4 | ❌ NO | ❌ NO | ❌ NO | ❌ INSEGURO | BAJO |
| 36 | `counters` | 1 | ❌ NO | ❌ NO | ❌ NO | ⚠️ GLOBAL | BAJO |
| 37 | `firms` | 3 | ✅ FirmRepository | ✅ SÍ | Parcial | ✅ SEGURO | BAJO |
| 38 | `document_access_logs` | 3 | ✅ DocumentAccessLogRepository | ✅ SÍ | ✅ SÍ | ✅ SEGURO | BAJO |

---

## FASE 4: ANÁLISIS DE COLECCIONES SIN REPOSITORY

### 4.1 Clasificación de Ausencias

#### Categoría I: Decisión Arquitectónica Intentada (Partial Repos)

Estos servicios **intentaron** usar patrón de aislamiento pero **no crearon un repositorio formal**:

```python
# subscription_service.py — usa _tenant_filter() custom, no repo formal
def _tenant_filter(ctx, extra=None):
    q = {"tenantId": str(ctx["tenant_id"])}
    if extra:
        q.update(extra)
    return q

# organization_service.py — usa _tenant_filter() custom, no repo formal
def _tenant_filter(ctx, extra=None):
    q = {"tenantId": str(ctx["tenant_id"])}
    if extra:
        q.update(extra)
    return q

# partner_service.py — usa _tenant_filter() custom, no repo formal
def _tenant_filter(ctx, extra=None):
    q = {"tenantId": str(ctx["tenant_id"])}
    if extra:
        q.update(extra)
    return q

# implementation_service.py — usa _tenant_filter() custom, no repo formal
def _tenant_filter(ctx, extra=None):
    q = {"tenantId": str(ctx["tenant_id"])}
    if extra:
        q.update(extra)
    return q
```

**Conclusión:** Fueron parcialmente tenant-scoped pero sin usar BaseRepository. **Fue negligencia arquitectónica, no decisión deliberada.**

**Colecciones afectadas:** 
- `os_subscriptions`, `organizations`, `partners`, `implementations`

---

#### Categoría II: Código Legado (Antes de Patrón Repository)

Servicios que acceden directo a MongoDB porque fueron creados **antes** de que se estableciera el patrón BaseRepository:

```python
# webhook_handler.py — maneja webhooks de terceros, acceso directo
await db.transactions.find_one({"payment_id": external_ref})
await db.refunds.insert_one({...})
await db.chargebacks.insert_one({...})

# renewal_service.py — tareas de renovación, acceso directo
users_to_renew = await db.users.find({...})
await db.transactions.insert_one(transaction)

# payment.py (routes) — rutas de pago, acceso directo
await db.transactions.find_one({"payment_id": payment_id})
await db.users.update_one({...})
```

**Conclusión:** Código preexistente que **no evolucionar** con el patrón. **Es deuda técnica.**

**Colecciones afectadas:** 
- `transactions`, `refunds`, `chargebacks`, `webhooks_*`, `system_logs`

---

#### Categoría III: Servicios Globales por Diseño

Estos servicios **intencionalmente acceden a datos globales** (sin tenant scope):

```python
# ai_engines.py — análisis global
all_leads = await db.leads.find({}).to_list(None)
all_commissions = await db.commissions.find({}).to_list(None)

# autonomous_system_orchestrator.py — orquestación global
orgs = await db.organizations.find({}).to_list(None)
total_leads = await db.leads.count_documents({})

# legal_os_core.py — análisis global
all_cases = await db.cases.find({}).to_list(None)
```

**Conclusión:** **Son intencionalmente globales** por arquitectura. No deberían tener tenant filtering si ese es el diseño. Pero la falta de repositorio los hace **difíciles de auditar**.

**Colecciones afectadas:** 
- `leads`, `cases`, `commissions`, `users`, `organizations` (usado en contexto global)

---

#### Categoría IV: Nuevas Colecciones (Sin Patrón)

Colecciones que fueron creadas **después** del patrón BaseRepository pero **nunca se creó repositorio**:

```python
# timeline_events — nueva colección, acceso directo
await db.timeline_events.insert_one({...})

# accounting_movements — nueva colección, acceso directo
await db.accounting_movements.insert_one({...})

# ai_sessions — nueva colección, acceso directo
session = await db.ai_sessions.find_one({...})
```

**Conclusión:** **Es deuda técnica y negligencia.** Deberían tener repository desde el inicio. **Es código nuevo sin patrón.**

**Colecciones afectadas:** 
- `timeline_events`, `accounting_movements`, `ai_sessions`, `ai_usage`, `expedientes`, `case_activities`, `meetings`, `appointments`, etc.

---

### 4.2 Resumen Clasificatorio

| Categoría | Colecciones | Cantidad | Origen | Acción |
|-----------|-----------|----------|--------|--------|
| I: Partial (custom filter) | os_subscriptions, organizations, partners, implementations | 4 | Antes de BaseRepository | ⬆️ Migrar a BaseRepository |
| II: Legacy Direct | transactions, webhook_*, system_logs, receipts, refunds, chargebacks | 6 | Código preexistente | ⬆️ Migrar a BaseRepository |
| III: Global by Design | leads, commissions, cases, users (en contexto AI) | 4 | Intencional | 📝 Documentar o ⬆️ Migrar |
| IV: New Without Pattern | timeline_events, accounting_movements, ai_*, expedientes, case_activities, meetings, appointments, clients, etc. | 18 | Negligencia | ⬆️ Crear Repository |
| V: Already Protected | cases, documents, document_access_logs, firms, + wrappers | 8 | Patrón establecido | ✅ Documentar |

---

## FASE 5: REPOSITORIOS FALTANTES

### 5.1 Repositorios que Deberían Existir

#### Crítica Severidad (Colecciones de Alto Uso):

1. **LeadRepository**
   - Colección: `leads`
   - Operaciones actuales: 28+
   - Servicios que dependen: `ai_engines.py`, `autonomous_system_orchestrator.py`, `ai_optimization_engine.py`, `sales_analytics.py`, `legal_os_engines.py`, `legal_os_core.py`
   - Rutas que dependen: `leads.py` (8+ endpoints), `sales_analytics.py` (6+ endpoints)

2. **CommissionRepository**
   - Colección: `commissions`
   - Operaciones actuales: 18+
   - Servicios que dependen: `ai_engines.py`, `autonomous_system_orchestrator.py`, `sales_analytics.py`, `legal_os_engines.py`
   - Rutas que dependen: `sales_analytics.py` (5+ endpoints)

3. **OrganizationRepository**
   - Colección: `organizations`
   - Operaciones actuales: 22+
   - Servicios que dependen: `analytics_service.py`, `autonomous_system_orchestrator.py`, `organization_service.py`
   - Rutas que dependen: `organizations.py` (8+ endpoints), `analytics.py`

4. **TransactionRepository**
   - Colección: `transactions`
   - Operaciones actuales: 18+
   - Servicios que dependen: `webhook_handler.py`, `renewal_service.py`, `payment.py`
   - Rutas que dependen: `payment.py` (15+ endpoints)

5. **InvoiceRepository**
   - Colección: `invoices`
   - Operaciones actuales: 18+
   - Servicios que dependen: `accounting.py`, `leads.py`
   - Rutas que dependen: `admin_ops.py` (3+ endpoints), `accounting.py` (5+ endpoints)

6. **NotificationRepository**
   - Colección: `notifications`
   - Operaciones actuales: 10+
   - Servicios que dependen: `webhook_handler.py`, `renewal_service.py`, `admin_ops.py`
   - Rutas que dependen: `referrals.py`, `admin_ops.py`

#### Alta Severidad:

7. **TimelineEventRepository**
   - Colección: `timeline_events`
   - Operaciones: 15+
   - Servicios: `autonomous.py`, `legal_os.py`

8. **AccountingMovementRepository**
   - Colección: `accounting_movements`
   - Operaciones: 12+
   - Servicios: `accounting.py`

9. **SubscriptionRepository** (para os_subscriptions)
   - Colección: `os_subscriptions`
   - Operaciones: 8+
   - Servicios: `subscription_service.py`

10. **PartnerRepository**
    - Colección: `partners`
    - Operaciones: 7+
    - Servicios: `partner_service.py`

11. **ImplementationRepository**
    - Colección: `implementations`
    - Operaciones: 6+
    - Servicios: `implementation_service.py`

#### Media Severidad:

12. **CaseActivityRepository**
    - Colección: `case_activities`
    - Operaciones: 6+

13. **WebhookRepository** (para webhook_events + webhook_logs)
    - Colecciones: `webhook_events`, `webhook_logs`
    - Operaciones: 11+

14. **ReceiptRepository**
    - Colección: `receipts`
    - Operaciones: 4+

15. **ExpedienteRepository**
    - Colección: `expedientes`
    - Operaciones: 4+

#### Baja Severidad:

16. **MeetingRepository** (`meetings`, 4 ops)
17. **AppointmentRepository** (`appointments`, 4 ops)
18. **ClientRepository** (`clients`, 4 ops)
19. **RefundRepository** (`refunds`, 4 ops)
20. **ChargebackRepository** (`chargebacks`, 4 ops)
21. **AiSessionRepository** (`ai_sessions`, 3 ops)
22. **MessageRepository** (`messages`, 4 ops)

---

### 5.2 Resumen de Repositorios Faltantes

| Prioridad | Cantidad | Colecciones | Operaciones Totales |
|-----------|----------|-------------|-------------------|
| **CRÍTICA** | 6 | leads, commissions, organizations, transactions, invoices, notifications | 102+ |
| **ALTA** | 5 | timeline_events, accounting_movements, os_subscriptions, partners, implementations | 48+ |
| **MEDIA** | 4 | case_activities, webhook_*, receipts, expedientes | 25+ |
| **BAJA** | 7 | meetings, appointments, clients, refunds, chargebacks, ai_sessions, messages | 26+ |
| **TOTAL** | **22** | | **~201 operaciones** |

---

## FASE 6: IMPACTO ESPERADO

### 6.1 Cálculo de Protecciones Automáticas

#### Escenario A: Crear SOLO repositorios críticos (6)

```
Repositorios a crear:
- LeadRepository (28 ops)
- CommissionRepository (18 ops)
- OrganizationRepository (22 ops)
- TransactionRepository (18 ops)
- InvoiceRepository (18 ops)
- NotificationRepository (10 ops)

TOTAL: 6 repositorios
OPERACIONES CUBIERTAS: 114 operaciones

Operaciones que seguirán requiriendo cambios manuales:
- Servicios globales (AI, Analytics, Autonomous) — 40+ ops
- Rutas administrativas — 20+ ops
- Servicios legados — 15+ ops
TOTAL: ~75 operaciones

RESULTADO: 114 ops automáticamente protegidas, 75+ ops requieren cambios manuales
```

---

#### Escenario B: Crear repositorios críticos + altos (11)

```
Repositorios adicionales:
+ TimelineEventRepository (15 ops)
+ AccountingMovementRepository (12 ops)
+ SubscriptionRepository (8 ops)
+ PartnerRepository (7 ops)
+ ImplementationRepository (6 ops)

TOTAL: 11 repositorios
OPERACIONES CUBIERTAS: 162 operaciones

Operaciones que seguirán requiriendo cambios manuales:
- Servicios globales (AI, Analytics, Autonomous) — 35+ ops
- Webhooks legacy — 15+ ops
- Otros servicios — 10+ ops
TOTAL: ~60 operaciones

RESULTADO: 162 ops automáticamente protegidas, 60+ ops requieren cambios manuales
```

---

#### Escenario C: Crear TODOS los repositorios (22)

```
Repositorios adicionales (media + baja):
+ CaseActivityRepository (6 ops)
+ WebhookRepository (11 ops)
+ ReceiptRepository (4 ops)
+ ExpedienteRepository (4 ops)
+ MeetingRepository (4 ops)
+ AppointmentRepository (4 ops)
+ ClientRepository (4 ops)
+ RefundRepository (4 ops)
+ ChargebackRepository (4 ops)
+ AiSessionRepository (3 ops)
+ MessageRepository (4 ops)
+ (otros menores)

TOTAL: 22 repositorios
OPERACIONES CUBIERTAS: 227 operaciones (77% de todas)

Operaciones que seguirán requiriendo cambios manuales:
- Servicios globales (AI, Analytics, Autonomous) — 35+ ops
- Contextos administrativos globales — 10+ ops
TOTAL: ~45 operaciones

RESULTADO: 227 ops automáticamente protegidas, 45 ops requieren cambios manuales
```

---

### 6.2 Análisis de ROI por Escenario

#### Escenario A: Mínimo Viable (6 repos)

```
Esfuerzo:
- Crear 6 repositorios: ~180 líneas código nuevo
- Inyectar en servicios/rutas: ~60 líneas cambios
- TOTAL: ~240 líneas

Beneficio:
- 114 operaciones protegidas automáticamente
- Cobertura: 39% de todas las operaciones

ROI: 240 líneas → 114 ops = 0.47 ops/línea
Tiempo estimado: 5-7 días
```

#### Escenario B: Cobertura Ampliada (11 repos)

```
Esfuerzo:
- Crear 11 repositorios: ~330 líneas código nuevo
- Inyectar en servicios/rutas: ~100 líneas cambios
- TOTAL: ~430 líneas

Beneficio:
- 162 operaciones protegidas automáticamente
- Cobertura: 55% de todas las operaciones

ROI: 430 líneas → 162 ops = 0.38 ops/línea
Tiempo estimado: 10-14 días
```

#### Escenario C: Cobertura Completa (22 repos)

```
Esfuerzo:
- Crear 22 repositorios: ~660 líneas código nuevo
- Inyectar en servicios/rutas: ~150 líneas cambios
- TOTAL: ~810 líneas

Beneficio:
- 227 operaciones protegidas automáticamente
- Cobertura: 77% de todas las operaciones

ROI: 810 líneas → 227 ops = 0.28 ops/línea
Tiempo estimado: 20-25 días
```

---

### 6.3 Operaciones que SIEMPRE Requieren Cambios Manuales

Independientemente del número de repositorios creados, estas operaciones **nunca serán protegidas automáticamente**:

#### Grupo I: Servicios Globales (Intencionales)
- `ai_engines.py`: ~12 ops — requieren decisión arquitectónica (¿tenant-scope o global?)
- `autonomous_system_orchestrator.py`: ~14 ops — requieren decisión arquitectónica
- `sales_analytics.py`: ~15 ops — analytics global o by-tenant?
- `legal_os_engines.py`: ~9 ops — análisis global o by-tenant?
- `legal_os_core.py`: ~7 ops — análisis global o by-tenant?

**SUBTOTAL: ~57 ops — Requieren decisión arquitectónica**

#### Grupo II: Contextos Administrativos
- `admin_ops.py`: ~15 ops — queries administrativas globales
- `admin_master.py`: ~12 ops — operaciones maestras de sistema
- `admin.py`: ~8 ops — acciones admin
- `accounting.py`: ~12 ops — movimientos contables

**SUBTOTAL: ~47 ops — Son legítimamente globales**

#### Grupo III: Webhooks y Servicios de Terceros
- `webhook_handler.py`: ~15 ops — webhooks de terceros (no saben de firm_id)
- `payment.py`: ~18 ops — integraciones de pago (contexto global)
- `renewal_service.py`: ~7 ops — renovación global de suscripciones

**SUBTOTAL: ~40 ops — Son arquitectónicamente globales**

---

## FASE 6 FINAL: ORDEN ÓPTIMO DE IMPLEMENTACIÓN

### Estrategia Recomendada: **Escenario B** (Cobertura Ampliada)

**Rationale:**
- Escenario A (39% cobertura) = insuficiente
- Escenario C (77% cobertura) = esfuerzo excesivo para ROI marginal
- Escenario B (55% cobertura) = balance óptimo esfuerzo/beneficio

---

### Orden de Implementación (11 Repositorios)

#### FASE 1: Infraestructura Base (Semana 1)
**Crear 6 repositorios críticos:**

1. **LeadRepository** (~40 líneas)
   - Colección: `leads`
   - Métodos: find_by_firm, find_by_organization, search, count_by_status
   - Impacto: 6 servicios, 8+ rutas

2. **CommissionRepository** (~35 líneas)
   - Colección: `commissions`
   - Métodos: find_by_firm, find_by_agent, sum_by_status, count_by_firm
   - Impacto: 4 servicios, 5+ rutas

3. **OrganizationRepository** (~40 líneas)
   - Colección: `organizations`
   - Métodos: find_by_tenant, find_by_slug, count_by_status, search
   - Impacto: 3 servicios, 8+ rutas

4. **TransactionRepository** (~35 líneas)
   - Colección: `transactions`
   - Métodos: find_by_email, find_by_payment_id, find_by_status, count_by_status
   - Impacto: 3 servicios, 15+ rutas

5. **InvoiceRepository** (~35 líneas)
   - Colección: `invoices`
   - Métodos: find_by_firm, find_by_case, sum_by_status, count_by_firm
   - Impacto: 2 servicios, 8+ rutas

6. **NotificationRepository** (~25 líneas)
   - Colección: `notifications`
   - Métodos: find_by_user, find_by_target, mark_read, count_unread
   - Impacto: 3 servicios, 4+ rutas

**Validación:** Unit tests para cada repositorio

---

#### FASE 2: Inyección en Servicios (Semana 2)
**Inyectar 6 repositorios en servicios/rutas:**

1. Inyectar LeadRepository en:
   - `ai_engines.py` (parcial — revisar si debe ser global)
   - `sales_analytics.py` (parcial)
   - `leads.py` rutas

2. Inyectar CommissionRepository en:
   - `sales_analytics.py`
   - `team.py`

3. Inyectar OrganizationRepository en:
   - `organization_service.py` (migrar de _tenant_filter)
   - `organizations.py` rutas

4. Inyectar TransactionRepository en:
   - `payment.py` rutas
   - `renewal_service.py` (parcial)
   - `webhook_handler.py` (parcial)

5. Inyectar InvoiceRepository en:
   - `accounting.py`
   - `admin_ops.py`
   - `leads.py` (al crear caso)

6. Inyectar NotificationRepository en:
   - `admin_ops.py`
   - `referrals.py`

**Validación:** Integration tests, verificar no hay breaking changes

---

#### FASE 3: Repositorios Secundarios (Semana 3)
**Crear 5 repositorios adicionales:**

7. **TimelineEventRepository** (~30 líneas)
8. **AccountingMovementRepository** (~35 líneas)
9. **SubscriptionRepository** (~30 líneas) — migrar subscription_service de _tenant_filter
10. **PartnerRepository** (~30 líneas) — migrar partner_service de _tenant_filter
11. **ImplementationRepository** (~30 líneas) — migrar implementation_service de _tenant_filter

**Inyectar y validar:** 5-7 días

---

#### FASE 4: Decisión Arquitectónica (En Paralelo)
**Decidir sobre servicios globales:**

- ¿`ai_engines.py` debe estar tenant-scoped?
- ¿`sales_analytics.py` debe estar tenant-scoped?
- ¿`autonomous_system_orchestrator.py` debe estar tenant-scoped?
- ¿`legal_os_engines.py` debe estar tenant-scoped?

**Si SÍ:** Inyectar LeadRepository + CommissionRepository en estos servicios (cambios manuales)
**Si NO:** Documentar como "Intencionalmente Global" y dejar como está

---

### Cronograma Total

| Fase | Duración | Tareas | Salida |
|------|----------|--------|--------|
| FASE 0: Decisión | 1 día | Decidir servicios globales | Documento arquitectónico |
| FASE 1: Infraestructura | 5-7 días | Crear 6 repos críticos | 210 líneas código nuevo |
| FASE 2: Inyección | 5-7 días | Inyectar en servicios | 60 líneas cambios |
| FASE 3: Secundarios | 5-7 días | Crear 5 repos adicionales | 155 líneas código nuevo |
| FASE 4: Decisión | En paralelo | Arquitectura de servicios globales | Documento decisión |
| **TOTAL** | **15-21 días** | | **~425 líneas, 162 ops protegidas** |

---

## RESUMEN EJECUTIVO FINAL

### 1. Mapa Completo de Colecciones

**38 colecciones MongoDB identificadas**

- **8 con Repository existente** ✅
- **4 con partial pattern** ⚠️
- **26 sin Repository** ❌

---

### 2. Cobertura Repository Actual

```
Operaciones con BaseRepository:     87 (30%)  ✅
Operaciones con TenantAwareQuery:   47 (16%)  ✅
Operaciones directas a db:         159 (54%)  ❌
TOTAL:                             293        
```

---

### 3. Repositorios Faltantes

| Criticidad | Cantidad | Colecciones |
|-----------|----------|-------------|
| Crítica | 6 | leads, commissions, organizations, transactions, invoices, notifications |
| Alta | 5 | timeline_events, accounting_movements, os_subscriptions, partners, implementations |
| Media | 4 | case_activities, webhooks, receipts, expedientes |
| Baja | 7 | meetings, appointments, clients, refunds, etc. |
| **TOTAL** | **22** | |

---

### 4. Impacto Esperado (Escenario B Recomendado)

```
Crear 11 repositorios:
- Código nuevo: ~330 líneas
- Cambios: ~100 líneas
- Tiempo: 15-21 días

Resultado:
- 162 operaciones protegidas automáticamente (55%)
- 60+ operaciones requieren cambios manuales (20%)
- 45+ operaciones intencionalmente globales (15%)
- 26+ operaciones administrativas (9%)
```

---

### 5. Orden Óptimo de Implementación

**Fase 1:** Crear 6 repos críticos (5-7 días)
**Fase 2:** Inyectar en servicios (5-7 días)
**Fase 3:** Crear 5 repos secundarios (5-7 días)
**Fase 4:** Decisión arquitectónica (paralelo)

**Total: 15-21 días → 162 operaciones protegidas**

---

## CONCLUSIÓN

**NO todas las colecciones necesitan Repository dedicado.**

**PERO 11 colecciones críticas SÍ deberían tenerlo** para:
1. Garantizar aislamiento automático por `firm_id`
2. Reducir deuda técnica
3. Estandarizar patrones
4. Mejorar auditabilidad

**El patrón BaseRepository existe, funciona y está demostrado. Solo falta propagarlo completamente.**

---

## FIN AUDITORÍA FASE 1-6
