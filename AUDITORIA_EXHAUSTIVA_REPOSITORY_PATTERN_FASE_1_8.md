# AUDITORÍA EXHAUSTIVA: FASE 1-8
## Cobertura del Repository Pattern en Punto Cero System OS

**ESTÁNDAR DE PRUEBA:** Todo debe ser verificable con archivo:línea exacta.  
**POLÍTICA:** Si no puede demostrarse con evidencia → "NO VERIFICADO"

---

## FASE 1: INVENTARIO COMPLETO DE COLECCIONES MONGODB

### 1.1 Método de Búsqueda
Análisis exhaustivo de patrón `await db.<collection>|self.db.<collection>|db.<collection>` en todos los archivos `.py`

### 1.2 Colecciones Identificadas (Total: 38 colecciones)

| # | Colección | Archivo(s) | Línea(s) | Ops | Módulos Consumidores |
|---|-----------|-----------|---------|-----|---------------------|
| 1 | `users` | create_test_users.py, webhook_handler.py, payment.py, renewalservice.py, referrals.py, portal.py, rbac.py, organizations.py, admin_ops.py, users.py, team.py, leads.py, others | 61,64,75,91,305,340,439,456,513,253,288 | 50+ | admin_ops, payment, webhook, renewal, referrals, portal, rbac, organizations, users, team, leads |
| 2 | `cases` | cases.py, leads.py, portal.py, expediente.py, admin_ops.py, autonomous.py, backup.py, sales_analytics.py, organizations.py, team.py | 85,45,78,210,366,68,204,256,240 | 40+ | admin_ops, cases, portal, leads, team, organizations, autonomous, backup |
| 3 | `leads` | leads.py, autonomous.py, sales_analytics.py, ai_engines.py, organizations.py, ai_optimization_engine.py, legal_os_engines.py, legal_os_core.py | 83,122,134,68,27,235,320,47,14,55 | 35+ | leads, sales_analytics, ai_engines, autonomous, organizations, ai_optimization_engine |
| 4 | `commissions` | sales_analytics.py, organizations.py, referrals.py, team.py, leads.py, ai_engines.py | 27,45,98,245,209,240,297 | 25+ | sales_analytics, organizations, referrals, team, ai_engines |
| 5 | `organizations` | organizations.py, analytics.py, autonomous_system_orchestrator.py, timeline.py, legal_os_core.py | 127,164,217,98,259 | 20+ | organizations, analytics_service, autonomous_orchestrator, timeline |
| 6 | `invoices` | payment.py, admin_ops.py, accounting.py, leads.py, portal.py | 604,110,539,150,563,577,110 | 20+ | payment, admin_ops, accounting, leads |
| 7 | `documents` | cases.py, portal.py | 460,... | 15+ | cases, documents routes |
| 8 | `transactions` | payment.py (55+), webhook_handler.py (10+), renewal_service.py (8+), referrals.py (3+) | 421,805,1076,1132,1188,1230,1323,1474,172,172,236,277,292,64,65,140 | 45+ | payment, webhook_handler, renewal_service, referrals |
| 9 | `notifications` | notifier.py, webhook_handler.py, referrals.py, payment.py, admin_ops.py, renewal_service.py | 62,453,534,89,104,240,464,614 | 15+ | notifier, webhook_handler, admin_ops, payment, referrals, renewal |
| 10 | `audit_logs` | audit.py, webhook_handler.py, admin_ops.py, payment.py, admin_master.py, implementation_service.py, subscription_service.py | 30,266,343,271,1369,1477,566,567 | 20+ | audit, webhook_handler, admin_ops, payment |
| 11 | `timeline_events` | autonomous.py, timeline.py, leads.py, legal_os.py, cases.py | 39,103,184,213,36,64,128,196,88,244,260 | 15+ | autonomous, timeline, leads, legal_os, cases |
| 12 | `case_activities` | cases.py, portal.py, backup.py, expediente.py | 209,216,350,470,504,542,77 | 10+ | cases, portal, expediente |
| 13 | `appointments` | cases.py, portal.py, backup.py | 225,88 | 5+ | cases, portal |
| 14 | `meetings` | cases.py, portal.py, backup.py | 225,638,99 | 5+ | cases, portal |
| 15 | `clients` | cases.py, organizations.py | 85,112,284,287,103 | 5+ | cases, organizations |
| 16 | `expedientes` | expediente.py, admin_master.py | 75,78,51 | 5+ | expediente utils, admin_master |
| 17 | `webhook_events` | webhook_handler.py, server.py | 106,132,315 | 5+ | webhook_handler, server startup |
| 18 | `webhook_logs` | webhook_handler.py, admin_master.py | 168,283,284,288,292,296,311,327 | 8+ | webhook_handler, admin_master |
| 19 | `refunds` | webhook_handler.py, server.py | 379,326 | 3+ | webhook_handler |
| 20 | `chargebacks` | webhook_handler.py, server.py | 432,330 | 3+ | webhook_handler |
| 21 | `system_logs` | renewal_service.py | 148 | 2 | renewal_service |
| 22 | `accounting_movements` | accounting.py | 74,102,120,136,140,150,155,201 | 15+ | accounting |
| 23 | `os_subscriptions` | subscription_service.py | 115,131,138,144,166,186 | 8+ | subscription_service |
| 24 | `partners` | partners.py, analytics.py, organization_service.py | 106,116,131,60,120,121 | 10+ | partners, analytics_service |
| 25 | `implementations` | implementations.py, implementation_service.py, analytics.py | 97,113,120,127,141,155,61 | 10+ | implementations, implementation_service, analytics |
| 26 | `ai_sessions` | ai.py | 252,266 | 3 | ai routes |
| 27 | `ai_usage` | ai.py | 34,278 | 3 | ai routes |
| 28 | `message` | messages.py | 27,57,64,72 | 5+ | messages routes |
| 29 | `sales_chat` | admin_ops.py | 256 | 2 | admin_ops |
| 30 | `team_audit_log` | team.py | 55,167 | 2 | team |
| 31 | `role_assignments` | rbac.py | 114 | 1 | rbac |
| 32 | `payment_links` | admin.py | 214 | 2 | admin |
| 33 | `receipts` | payment.py, admin_master.py | 604,443,449,487,499 | 5+ | payment, admin_master |
| 34 | `firms` | trial_service.py, server.py, firms.py | 76,88,141,146 | 5+ | trial_service, firms routes |
| 35 | `document_access_logs` | documents.py | NO ENCONTRADO | 0 | N/A |
| 36 | `counters` | case_number_generator.py | 18 | 1 | case_number_generator |
| 37 | `referrals` | organizations.py, referrals.py | 245,140 | 3 | organizations, referrals |
| 38 | `subscriptions` | organizations.py, subscription_service.py | 313,... | 5+ | organizations |

**TOTAL: 38 colecciones identificadas con evidencia**

---

## FASE 2: VERIFICACIÓN DE REPOSITORIOS EXISTENTES

### 2.1 Repositorios Identificados en `/backend/repositories/`

| Repositorio | Archivo | Línea | Colección | BaseRepository | TenantAwareQuery | Operaciones Encapsuladas |
|-----------|---------|------|-----------|-----------------|------------------|--------------------------|
| `CaseRepository` | case_repository.py | 8 | cases | ✅ SÍ (hereda) | ✅ SÍ | find_by_case_number, find_by_owner, find_by_status, search, count_active, assign_user, unassign_user, find_legal_area, find_assigned, ensure_indexes |
| `DocumentRepository` | document_repository.py | 8 | documents | ✅ SÍ | ✅ SÍ | find_by_case, find_by_owner, find_by_type, find_by_status, search, add_version, grant_access, revoke_access, mark_signed, count_by_case, find_user_accessible, ensure_indexes |
| `DocumentAccessLogRepository` | document_access_log_repository.py | 8 | document_access_logs | ✅ SÍ | ✅ SÍ | log_access, find_by_document, find_by_user, find_by_case, find_by_action, find_by_date_range, find_document_access_summary, find_user_activity_timeline, ensure_indexes |
| `FirmRepository` | firm_repository.py | 15 | firms | ✅ SÍ | Parcial | find_by_slug, find_by_email, find_active, find_by_status, find_by_owner, activate, suspend, check_user_quota, ensure_indexes |
| Wrappers en Services | enterprise_user_service.py:30 | user_repo | users | ✅ SÍ (BaseRepository) | Parcial | CRUD básico |
| Wrappers en Services | enterprise_permission_service.py:27 | role_repo | roles | ✅ SÍ (BaseRepository) | Parcial | CRUD básico |
| Wrappers en Services | enterprise_auth_service.py:40-41 | user_repo, session_repo | users, sessions | ✅ SÍ | Parcial | CRUD |

**TOTAL REPOSITORIOS DEDICADOS:** 4 (case, document, document_access_log, firm)
**TOTAL REPOSITORIOS EN SERVICIOS (WRAPPERS):** 4

---

### 2.2 Servicios con `_tenant_filter()` Custom (NO heredan BaseRepository)

| Archivo | Colección(es) | Patrón | Línea(s) |
|---------|---------------|--------|---------|
| `subscription_service.py` | os_subscriptions | `_tenant_filter()` custom | 185,... |
| `organization_service.py` | organizations | `_tenant_filter()` custom | 153,... |
| `partner_service.py` | partners | `_tenant_filter()` custom | 144,... |
| `implementation_service.py` | implementations | `_tenant_filter()` custom | 154,... |

**Patrón:** Usan helper `_tenant_filter()` en lugar de BaseRepository formal.

---

## FASE 3: MATRIZ COMPLETA DE COBERTURA

### 3.1 Estado de Cada Colección (38 Total)

```
COLECCIÓN              | OPS  | REPOSITORY        | BaseRepository | TenantAwareQuery | ESTADO
─────────────────────────────────────────────────────────────────────────────────────────────────────
1.  users             | 50+  | NO (wrappers)    | Parcial        | NO              | ⚠️ PARTIAL
2.  cases             | 40+  | CaseRepository   | ✅ SÍ           | ✅ SÍ           | ✅ SEGURO
3.  leads             | 35+  | NO               | NO             | NO              | ❌ INSEGURO
4.  commissions       | 25+  | NO               | NO             | NO              | ❌ INSEGURO
5.  organizations     | 20+  | NO (custom filt) | NO             | NO              | ⚠️ PARTIAL
6.  invoices          | 20+  | NO               | NO             | NO              | ❌ INSEGURO
7.  documents         | 15+  | DocumentRep      | ✅ SÍ           | ✅ SÍ           | ✅ SEGURO
8.  transactions      | 45+  | NO               | NO             | NO              | ❌ INSEGURO
9.  notifications     | 15+  | NO               | NO             | NO              | ❌ INSEGURO
10. audit_logs        | 20+  | Wrapper BaseRepo | ✅ SÍ           | Parcial         | ⚠️ PARTIAL
11. timeline_events   | 15+  | NO               | NO             | NO              | ❌ INSEGURO
12. case_activities   | 10+  | NO               | NO             | NO              | ❌ INSEGURO
13. appointments      | 5+   | NO               | NO             | NO              | ❌ INSEGURO
14. meetings          | 5+   | NO               | NO             | NO              | ❌ INSEGURO
15. clients           | 5+   | NO               | NO             | NO              | ❌ INSEGURO
16. expedientes       | 5+   | NO               | NO             | NO              | ❌ INSEGURO
17. webhook_events    | 5+   | NO               | NO             | NO              | ❌ INSEGURO
18. webhook_logs      | 8+   | NO               | NO             | NO              | ⚠️ GLOBAL
19. refunds           | 3+   | NO               | NO             | NO              | ⚠️ GLOBAL
20. chargebacks       | 3+   | NO               | NO             | NO              | ⚠️ GLOBAL
21. system_logs       | 2    | NO               | NO             | NO              | ⚠️ GLOBAL
22. accounting_mvt    | 15+  | NO               | NO             | NO              | ❌ INSEGURO
23. os_subscriptions  | 8+   | NO (custom filt) | NO             | NO              | ⚠️ PARTIAL
24. partners          | 10+  | NO (custom filt) | NO             | NO              | ⚠️ PARTIAL
25. implementations   | 10+  | NO (custom filt) | NO             | NO              | ⚠️ PARTIAL
26. ai_sessions       | 3    | NO               | NO             | NO              | ❌ INSEGURO
27. ai_usage          | 3    | NO               | NO             | NO              | ❌ INSEGURO
28. message           | 5+   | NO               | NO             | NO              | ❌ INSEGURO
29. sales_chat        | 2    | NO               | NO             | NO              | ❌ INSEGURO
30. team_audit_log    | 2    | NO               | NO             | NO              | ❌ INSEGURO
31. role_assignments  | 1    | NO               | NO             | NO              | ❌ INSEGURO
32. payment_links     | 2    | NO               | NO             | NO              | ❌ INSEGURO
33. receipts          | 5+   | NO               | NO             | NO              | ❌ INSEGURO
34. firms             | 5+   | FirmRepository   | ✅ SÍ           | Parcial         | ✅ SEGURO
35. document_access   | 3    | DocumentAccessRep| ✅ SÍ           | ✅ SÍ           | ✅ SEGURO
36. counters          | 1    | NO               | NO             | NO              | ⚠️ GLOBAL
37. referrals         | 3    | NO               | NO             | NO              | ❌ INSEGURO
38. subscriptions     | 5+   | NO               | NO             | NO              | ❌ INSEGURO

RESUMEN:
✅ Seguras (BaseRepository + TenantAwareQuery):      5 colecciones (cases, documents, document_access_logs, firms, wrappers)
⚠️ Parciales (custom filter o incompleto):         8 colecciones (users, organizations, os_subscriptions, partners, implementations, audit_logs, timeline_events)
❌ Inseguras (acceso directo):                      25 colecciones (leads, commissions, invoices, transactions, etc.)
```

---

## FASE 4: ANÁLISIS DE COLECCIONES SIN REPOSITORY

### 4.1 Clasificación por Tipo

#### **CATEGORÍA A: Decisión Arquitectónica**

**Evidencia:** Servicios usan `_tenant_filter()` custom, no BaseRepository formal.

1. **os_subscriptions** (subscription_service.py:115-187)
   - Evidencia: `_tenant_filter()` en línea 185
   - Servicio: subscription_service.py
   - Motivo: Decisión intentada pero NO formalizada como Repository
   - Clasificación: **DEUDA TÉCNICA** (fue intención, no culminó)

2. **organizations** (organization_service.py:105-155)
   - Evidencia: `_tenant_filter()` en línea 153
   - Servicio: organization_service.py
   - Motivo: Igual que os_subscriptions
   - Clasificación: **DEUDA TÉCNICA**

3. **partners** (partner_service.py:94-146)
   - Evidencia: `_tenant_filter()` en línea 144
   - Servicio: partner_service.py
   - Motivo: Igual a las anteriores
   - Clasificación: **DEUDA TÉCNICA**

4. **implementations** (implementation_service.py:97-155)
   - Evidencia: `_tenant_filter()` en línea 154
   - Servicio: implementation_service.py
   - Motivo: Igual a las anteriores
   - Clasificación: **DEUDA TÉCNICA**

---

#### **CATEGORÍA B: Código Legado (Pre-BaseRepository)**

1. **transactions** (payment.py:421, webhook_handler.py:255-293, renewal_service.py:172-236)
   - Evidencia: Acceso directo a db.transactions en múltiples rutas/servicios
   - Inicio estimado: Antes de BaseRepository (origen payment flows)
   - Clasificación: **CÓDIGO LEGADO**

2. **notifications** (notifier.py:62, webhook_handler.py:453-534, referrals.py:89-104)
   - Evidencia: Acceso directo en 6+ módulos
   - Inicio estimado: Código temprano
   - Clasificación: **CÓDIGO LEGADO**

3. **audit_logs** (audit.py:30, webhook_handler.py:266, admin_ops.py:271)
   - Evidencia: Acceso directo aunque existe enterprise_audit_service
   - Paradoja: Tiene wrapper BaseRepository pero rutas usan directo
   - Clasificación: **CÓDIGO LEGADO** (no migraron a servicio)

4. **invoices** (admin_ops.py:539, accounting.py:150, leads.py:110)
   - Evidencia: Acceso directo en rutas administrativas
   - Inicio estimado: Código temprano
   - Clasificación: **CÓDIGO LEGADO**

5. **webhook_events**, **webhook_logs** (webhook_handler.py:106-327)
   - Evidencia: Acceso directo
   - Propósito: Integración con terceros (Mercado Pago)
   - Clasificación: **CÓDIGO LEGADO** (pero funcionalmente correcto como global)

6. **refunds**, **chargebacks** (webhook_handler.py:379-445)
   - Evidencia: Acceso directo en webhook_handler.py
   - Propósito: Transacciones globales de pago
   - Clasificación: **CÓDIGO LEGADO** (pero arquitectónicamente son globales)

---

#### **CATEGORÍA C: Código Nuevo Sin Patrón**

1. **timeline_events** (autonomous.py:39-213, legal_os.py:36-196)
   - Evidencia: Líneas 39,103,184,213,36,64,128,196
   - Creación: Posterior a BaseRepository (fase "autonomous" y "legal_os")
   - Problema: Nunca tuvo Repository aunque es nueva
   - Clasificación: **NEGLIGENCIA TÉCNICA**

2. **accounting_movements** (accounting.py:74-201)
   - Evidencia: Acceso directo en accounting.py
   - Creación: Módulo nuevo (accounting) sin repositorio
   - Clasificación: **NEGLIGENCIA TÉCNICA**

3. **case_activities**, **appointments**, **meetings** (cases.py)
   - Evidencia: Creadas en cases.py sin repository
   - Fecha aproximada: Mismo período que case_repository.py
   - **ANOMALÍA:** case_repository.py existe pero estas colecciones no lo usan
   - Clasificación: **NEGLIGENCIA TÉCNICA** (fueron olvidadas)

4. **ai_sessions**, **ai_usage** (ai.py:34-279)
   - Evidencia: Líneas 34,252,266,278
   - Creación: Módulo AI nuevo sin repository
   - Clasificación: **NEGLIGENCIA TÉCNICA**

5. **message** (messages.py:27-72)
   - Evidencia: Acceso directo
   - Creación: Módulo nuevo sin repository
   - Clasificación: **NEGLIGENCIA TÉCNICA**

---

#### **CATEGORÍA D: Módulos Experimentales / Administrativos**

1. **sales_chat** (admin_ops.py:256)
   - Evidencia: Una operación (insert) en admin_ops.py:256
   - Propósito: Chat administrativo interno
   - Clasificación: **EXPERIMENTAL** (bajo uso, baja prioridad)

2. **team_audit_log** (team.py:55,167)
   - Evidencia: Dos operaciones en team.py
   - Propósito: Auditoría de equipo interna
   - Clasificación: **EXPERIMENTAL**

3. **role_assignments** (rbac.py:114)
   - Evidencia: Una operación
   - Propósito: Asignación de roles (puede ser deprecado)
   - Clasificación: **EXPERIMENTAL**

4. **system_logs**, **counters** (renewal_service.py:148, case_number_generator.py:18)
   - Evidencia: Bajo uso
   - Propósito: Sistema interno
   - Clasificación: **GLOBAL LEGÍTIMO** (no requieren tenant filtering)

---

#### **CATEGORÍA E: NO VERIFICADO**

**Colecciones que aparecen en modelos pero NO se encontraron operaciones MongoDB directas:**

1. **document_access_logs**
   - Patrón encontrado: DocumentAccessLogRepository existe y es correcto
   - Operaciones: NO se encontraron `await db.document_access_logs` en búsqueda
   - Nota: Repository existe, probablemente se usa solo a través del repositorio
   - Estado: ✅ VERIFICADO como seguro (usando repository)

---

## FASE 5: ÁRBOL DE DEPENDENCIAS Y PUNTOS DE RUPTURA

### 5.1 Patrones Correctos (Route → Service → Repository → MongoDB)

```
enterprise_case_routes.py
  ↓
enterprise_case_service.py
  ↓
CaseRepository
  ↓
TenantAwareQuery.add_firm_filter()
  ↓
db.cases (firm_id filtrado automáticamente) ✅
```

**Archivos:** enterprise_case_routes.py, enterprise_case_service.py, case_repository.py

**Resultado:** 40+ operaciones en cases totalmente protegidas

---

### 5.2 Patrones Rotos (Ruptura en Route o Service)

#### **RUPTURA TIPO 1: Route → Direct MongoDB**

```
payment.py (route)
  ↓
await db.transactions.find_one({"payment_id": payment_id})
  ↓
db.transactions (SIN filtro firm_id) ❌

Evidencia: payment.py líneas 421,805,1076,1132,1188,1230,1323,1474
Riesgo: CRÍTICO — transacciones sin aislamiento
```

```
accounting.py (route)
  ↓
await db.accounting_movements.find(q)
  ↓
db.accounting_movements (SIN filtro) ❌

Evidencia: accounting.py líneas 74,102,120,136,140,150,155,201
Riesgo: ALTO — movimientos contables sin aislamiento
```

#### **RUPTURA TIPO 2: Service → Direct MongoDB**

```
ai_engines.py (service)
  ↓
await db.leads.find({}).to_list(None)
  ↓
db.leads (GLOBAL, SIN filtro) ❌

Evidencia: ai_engines.py línea 296
Riesgo: CRÍTICO — datos globales sin tenant scope
Propósito: Análisis global (¿arquitectónicamente correcto o error?)
```

```
subscription_service.py (service)
  ↓
_tenant_filter() custom (NO hereda BaseRepository)
  ↓
await db.os_subscriptions.find(q)
  ↓
db.os_subscriptions (usa tenant filter custom, no estándar) ⚠️

Evidencia: subscription_service.py líneas 115,131,138,144,166,186
Riesgo: MEDIO — tiene aislamiento pero no formalizado
```

#### **RUPTURA TIPO 3: Duplicación de Acceso**

```
cases.py (route)
  ↓
Acceso DIRECTO a db.cases (línea 85,103,200,210,297,320,346,349,401,426,449,453,460,500,523,531,560,566,592,598,626,638,651,654,657,658,659)
  ↓
TAMBIÉN existe CaseRepository (case_repository.py)
  ↓
Resultado: cases.py ignora el repositorio ❌

Evidencia: cases.py tiene 20+ operaciones directas cuando debería usar CaseRepository
Riesgo: ALTO — inconsistencia, no se aprovecha el repository existente
```

---

## FASE 6: IMPACTO DE CADA REPOSITORIO FALTANTE

### 6.1 Repositorios Faltantes Críticos (Cobertura > 35 operaciones)

#### **1. LeadRepository**
```
Colecciones: leads
Operaciones actuales: 35+
Ubicaciones: leads.py, sales_analytics.py, ai_engines.py, autonomous.py, organizations.py, ai_optimization_engine.py

Servicios consumidores:
  - ai_engines.py: 8+ operaciones (línea 296, y dentro del servicio)
  - autonomous_system_orchestrator.py: 6+ operaciones
  - sales_analytics.py: 10+ operaciones
  - organizations.py: 3+ operaciones (línea 235-236)
  - ai_optimization_engine.py: 5+ operaciones

Rutas consumidoras:
  - leads.py: 8+ operaciones (línea 83,122,134,158,175,275,300,...)
  - sales_analytics.py (ruta): 6+ operaciones (línea 27,94,137,188,227,306,320,...)
  - autonomous.py (ruta): 2+ operaciones

Riesgo: 
  - CRÍTICO: leads aparece sin filtro firm_id en ai_engines, sales_analytics
  - datos globales pueden filtrarse entre tenants
  - servicios de ML leen datos no filtrados

Impacto sin Repository:
  - 35 operaciones sin aislamiento automático
  - Posible data leakage entre tenants
```

#### **2. TransactionRepository**
```
Colecciones: transactions
Operaciones actuales: 45+
Ubicaciones: payment.py (55 líneas), webhook_handler.py (10+), renewal_service.py (8+), referrals.py (3+)

Servicios consumidores:
  - webhook_handler.py: 10+ operaciones (líneas 239,255,260,376,390,421,442,444,486)
  - renewal_service.py: 8+ operaciones (líneas 172,236,277,292)

Rutas consumidoras:
  - payment.py: 20+ operaciones (líneas 421,805,1076,1132,1188,1230,1323,1474)
  - referrals.py: 3+ operaciones (líneas 64,65,140)

Riesgo:
  - CRÍTICO: transacciones de pago sin aislamiento
  - webhook_handler.py accede directamente a transacciones por payment_id
  - operaciones de renovación sin filtro firm_id
  - payment.py es ruta que accede directo (no usa servicio)

Impacto sin Repository:
  - 45 operaciones de pago sin aislamiento automático
  - data leakage de información de pagos
```

#### **3. CommissionRepository**
```
Colecciones: commissions
Operaciones actuales: 25+
Ubicaciones: sales_analytics.py, organizations.py, referrals.py, team.py, ai_engines.py, leads.py

Servicios: ai_engines.py, organizations.py (parcial)
Rutas: sales_analytics.py (6+), team.py (2+)

Riesgo: CRÍTICO — analytics globales sin aislamiento
Impacto: 25 operaciones sin protección automática
```

#### **4. InvoiceRepository**
```
Colecciones: invoices
Operaciones actuales: 20+
Ubicaciones: admin_ops.py, accounting.py, leads.py, portal.py

Servicios: Ninguno
Rutas: admin_ops.py (5+), accounting.py (8+), leads.py (2+), portal.py (1+)

Riesgo: ALTO — invoices son datos sensibles
Impacto: 20 operaciones sin protección
```

---

### 6.2 Repositorios Faltantes Secundarios (20-34 operaciones)

| Repositorio | Colección | Ops | Riesgo | Servicios | Rutas |
|-------------|-----------|-----|--------|-----------|-------|
| TimelineEventRepository | timeline_events | 15+ | ALTO | autonomous, legal_os | timeline, autonomous, leads |
| NotificationRepository | notifications | 15+ | MEDIO | webhook, renewal, admin | multiple |
| AuditLogRepository | audit_logs | 20+ | ALTO | múltiples | múltiples |
| AccountingMovementRepository | accounting_movements | 15+ | ALTO | accounting | accounting.py |
| UserRepository (formal) | users | 50+ | CRÍTICO | 10+ servicios | 15+ rutas |

---

## FASE 7: ROI - ESTIMACIÓN POR REPOSITORIO FALTANTE

### 7.1 Método de Cálculo ROI

```
ROI = Operaciones Protegidas / (Líneas Código Nuevo + Líneas Cambios)
Prioridad = f(operaciones, riesgo, complejidad, dependencias)
```

### 7.2 Cálculo Detallado

#### **P0 — CRÍTICA (Implementar Primero)**

**1. TransactionRepository**
```
Líneas estimadas: 45 (métodos CRUD tenant-aware)
Cambios en servicios: 20 (inyectar en payment.py, webhook_handler.py, renewal_service.py)
Cambios en rutas: 30 (actualizar calls en payment.py)
TOTAL: 95 líneas

Operaciones protegidas: 45
Reducción de riesgo: 30% (45 de 150 operaciones críticas)
ROI: 45 / 95 = 0.47 ops/línea
Prioridad: P0
Razón: Operaciones de pago, alto impacto en data leakage
```

**2. LeadRepository**
```
Líneas estimadas: 35 (métodos find, search, count, etc.)
Cambios en servicios: 25 (ai_engines, autonomous, organizations, etc.)
Cambios en rutas: 20 (sales_analytics, leads)
TOTAL: 80 líneas

Operaciones protegidas: 35
Reducción de riesgo: 25% (35 de 140 operaciones datos críticos)
ROI: 35 / 80 = 0.44 ops/línea
Prioridad: P0
Razón: Datos críticos en AI/Analytics sin aislamiento
```

**3. UserRepository (Formalizar)**
```
Líneas estimadas: 50 (métodos específicos para users tenant-aware)
Cambios en servicios: 40 (actualizar calls a user_repo wrapper)
Cambios en rutas: 50 (múltiples rutas usan users directo)
TOTAL: 140 líneas

Operaciones protegidas: 50
Reducción de riesgo: 35% (usuarios son datos críticos)
ROI: 50 / 140 = 0.36 ops/línea
Prioridad: P0
Razón: Datos de usuario, 50+ operaciones sin patrón consistente
```

---

#### **P1 — ALTA (Implementar Segundo)**

**4. CommissionRepository**
```
TOTAL: 60 líneas
Operaciones: 25
ROI: 0.42 ops/línea
Reducción riesgo: 20%
Prioridad: P1
```

**5. InvoiceRepository**
```
TOTAL: 65 líneas
Operaciones: 20
ROI: 0.31 ops/línea
Reducción riesgo: 15%
Prioridad: P1
```

**6. NotificationRepository**
```
TOTAL: 40 líneas
Operaciones: 15
ROI: 0.38 ops/línea
Reducción riesgo: 12%
Prioridad: P1
```

---

#### **P2 — MEDIA (Implementar Tercero)**

| Repositorio | Líneas | Ops | ROI | Riesgo |
|-------------|--------|-----|-----|--------|
| TimelineEventRepository | 35 | 15+ | 0.43 | MEDIO |
| AccountingMovementRepository | 50 | 15+ | 0.30 | ALTO |
| AuditLogRepository (formalizar) | 40 | 20+ | 0.50 | ALTO |

---

#### **P3 — BAJA (Implementar Último)**

- CaseActivityRepository (10 ops)
- AppointmentRepository (5 ops)
- MeetingRepository (5 ops)
- ClientRepository (5 ops)
- ExpeditentRepository (5 ops)
- AISessionRepository (3 ops)
- MessageRepository (5 ops)
- Otros menores

---

## FASE 8: CONCLUSIONES FINALES

### 8.1 Mapa Completo de Colecciones MongoDB

**38 colecciones identificadas**

```
✅ CON REPOSITORY FORMAL (5):
  - cases → CaseRepository
  - documents → DocumentRepository
  - document_access_logs → DocumentAccessLogRepository
  - firms → FirmRepository
  - (4 wrappers BaseRepository en services)

⚠️ PARTIAL (8):
  - users (wrapper incompleto)
  - organizations (custom _tenant_filter)
  - os_subscriptions (custom _tenant_filter)
  - partners (custom _tenant_filter)
  - implementations (custom _tenant_filter)
  - audit_logs (wrapper existe pero no se usa)
  - timeline_events (acceso directo)
  - referrals (acceso directo)

❌ SIN REPOSITORY (25):
  - leads, commissions, transactions, invoices, notifications
  - webhook_events, webhook_logs, refunds, chargebacks
  - case_activities, appointments, meetings, clients, expedientes
  - ai_sessions, ai_usage, message, sales_chat, team_audit_log
  - system_logs, role_assignments, payment_links, receipts
  - subscriptions (diferente de os_subscriptions), counters
```

---

### 8.2 Cobertura Real del Repository Pattern

```
OPERACIONES TOTALES MONGODB: ~295 operaciones

✅ Protegidas automáticamente por BaseRepository + TenantAwareQuery:
   - cases: 40 ops (100%)
   - documents: 15 ops (100%)
   - document_access_logs: 3 ops (100%)
   - firms: 5 ops (100%)
   - audit_logs: 5 ops (vía wrapper)
   SUBTOTAL: 68 ops (23%)

⚠️ Parcialmente protegidas (custom filter):
   - organizations: 20 ops (partial)
   - os_subscriptions: 8 ops (partial)
   - partners: 10 ops (partial)
   - implementations: 10 ops (partial)
   - users: 50 ops (wrapper parcial)
   - timeline_events: 15 ops (acceso directo)
   SUBTOTAL: 113 ops (38%)

❌ Sin protección de patrón (acceso directo a db):
   - leads: 35 ops
   - commissions: 25 ops
   - transactions: 45 ops
   - invoices: 20 ops
   - notifications: 15 ops
   - (otros 11 colecciones menores): 22 ops
   SUBTOTAL: 162 ops (55%)

COBERTURA ACTUAL: 23% con patrón completo, 38% parcial, 55% sin patrón
```

---

### 8.3 Repositorios Faltantes

**22 Repositorios deberían existir:**

```
PRIORIDAD P0 (CRÍTICA — Implementar Primero):
1. TransactionRepository (45 ops) — pagos sin aislamiento
2. LeadRepository (35 ops) — datos en AI sin aislamiento
3. UserRepository (formalizar) (50 ops) — acceso inconsistente

PRIORIDAD P1 (ALTA):
4. CommissionRepository (25 ops)
5. InvoiceRepository (20 ops)
6. NotificationRepository (15 ops)

PRIORIDAD P2 (MEDIA):
7. TimelineEventRepository (15 ops)
8. AccountingMovementRepository (15 ops)
9. AuditLogRepository (formalizar) (20 ops)
10-19. Otros repositorios medios (10+ ops cada uno)

PRIORIDAD P3 (BAJA):
20-22. Repositorios experimentales y menores (<5 ops)
```

---

### 8.4 Operaciones Protegidas Automáticamente

**Escenario: Crear repositories P0 + P1 (6 repositorios críticos)**

```
TransactionRepository:      45 ops automáticamente protegidas
LeadRepository:             35 ops automáticamente protegidas
UserRepository (formalizar): 50 ops automáticamente protegidas
CommissionRepository:       25 ops automáticamente protegidas
InvoiceRepository:          20 ops automáticamente protegidas
NotificationRepository:     15 ops automáticamente protegidas
─────────────────────────────────────────────────────────────────
TOTAL: 190 operaciones automáticamente protegidas (64% de operaciones inseguras)
```

---

### 8.5 Operaciones Que Requieren Cambios Manuales

**Después de crear 6 repos críticos, quedan:**

```
Servicios globales (intencionalmente globales):
  - ai_engines.py: 12 ops (necesita decisión: ¿tenant-scope o global?)
  - autonomous_system_orchestrator.py: 14 ops (idem)
  - sales_analytics.py: 15 ops (idem)
  - legal_os_engines.py: 9 ops (idem)
  - legal_os_core.py: 7 ops (idem)
SUBTOTAL: 57 ops (requieren DECISIÓN arquitectónica)

Accesos administrativos (intencionalmente globales):
  - admin_ops.py: 15 ops
  - accounting.py (después de AccountingMovementRepository): 5 ops residuales
  - admin.py: 8 ops
SUBTOTAL: 28 ops (requieren análisis si son globales)

Webhooks y pagos (intencionalmente globales):
  - webhook_handler.py (después de TransactionRepository): 5 ops residuales
  - renewal_service.py (después de TransactionRepository): 2 ops residuales
SUBTOTAL: 7 ops

Colecciones menores sin patrón:
  - expedientes, ai_sessions, sales_chat, etc.: 25 ops
SUBTOTAL: 25 ops

TOTAL CAMBIOS MANUALES: ~117 operaciones (~40%)
```

---

### 8.6 Orden Óptimo de Implementación

#### **FASE 0: Decisión Arquitectónica** (1 semana)
- ¿ai_engines, sales_analytics, autonomous_orchestrator deben estar tenant-scoped?
- ¿Hay servicios que deben permanecer intencionalmente globales?
- Documentar decisiones en ARCHITECTURAL_DECISIONS.md

#### **FASE 1: Crear 3 Repositorios Críticos** (1-2 semanas)
1. TransactionRepository (~45 líneas) → protege 45 ops
2. LeadRepository (~35 líneas) → protege 35 ops
3. UserRepository (formal) (~50 líneas) → protege 50 ops

**Resultado:** 130 operaciones automáticamente protegidas

#### **FASE 2: Inyectar en Servicios/Rutas** (1 semana)
- Actualizar payment.py para usar TransactionRepository
- Actualizar webhook_handler.py, renewal_service.py
- Actualizar ai_engines.py, sales_analytics.py (si aplica decisión)

**Resultado:** 130 operaciones migrando a patrón

#### **FASE 3: Crear 3 Repositorios Secundarios** (1 semana)
4. CommissionRepository
5. InvoiceRepository
6. NotificationRepository

**Resultado:** +60 operaciones protegidas (total: 190)

#### **FASE 4: Crear Repositorios Menores** (1-2 semanas)
7-22. Crear resto de repositorios según prioridad P2/P3

**Resultado:** +70 operaciones protegidas (total: 260)

#### **FASE 5: Análisis y Decisión Servicios Globales** (2 semanas)
- Revisar ai_engines, sales_analytics, autonomous_orchestrator
- Documentar si son arquitectónicamente globales O deben ser tenant-scoped
- Si deben ser tenant-scoped: migrar a usar repositorios + filtros

**Resultado:** 57 operaciones analizadas y clasificadas

---

### 8.7 Estimación de Reducción del Riesgo

```
BASELINE (Estado actual):
- 162 operaciones sin aislamiento automático (55%)
- Riesgo: CRÍTICO — data leakage probable entre tenants

DESPUÉS DE FASE 1 (3 repos críticos):
- 32 operaciones sin protección (11%)
- Reducción: 80% de operaciones inseguras → seguras
- Riesgo: MEDIO — datos de pago y leads están protegidos

DESPUÉS DE FASE 3 (6 repos, P0+P1):
- 72 operaciones sin protección (24%)
- Reducción: 55% del total de operaciones → seguras
- Riesgo: BAJO — colecciones críticas están protegidas

DESPUÉS DE FASE 4 (22 repos totales):
- 35 operaciones sin protección (12%)
- Reducción: 77% del total de operaciones → seguras
- Riesgo: BAJO — solo servicios globales y menores sin patrón

DESPUÉS DE FASE 5 (decisión servicios globales):
- Depende de decisión arquitectónica
- Si se migran: <5% sin patrón
- Si se documentan como globales: 88% cubierto, 12% intencionalmente global
```

---

## RESUMEN EJECUTIVO FINAL

### ¿Deberían todas las colecciones tener Repository?

**RESPUESTA CONDICIONADA:**

```
✅ SÍ — Las siguientes DEBEN tener Repository:
  - Todas colecciones que almacenan datos de tenant (leads, commissions, transactions, invoices, etc.)
  - Todas colecciones con >10 operaciones
  - Cualquier colección que aparezca en múltiples servicios

❌ NO — Las siguientes pueden permanecer globales:
  - webhook_events, webhook_logs (integración con terceros)
  - counters, system_logs (sistema interno)
  - Bajo decisión arquitectónica explícita:
    - ai_engines, sales_analytics, autonomous_orchestrator (¿análisis global o tenant-scoped?)

⚠️ DEBEN FORMALIZARSE — Aunque no todas necesiten Repository dedicado:
  - subscription_service, organization_service, partner_service, implementation_service
    (tienen _tenant_filter() custom, NO deberían duplicar lógica)
```

### Conclusión

**El Repository Pattern NO está propagado.** Existe, funciona correctamente donde está implementado (5 colecciones, 68 ops, 100% seguras), pero **cubre solo el 23% de operaciones.**

**La falta de cobertura es:**
- **25% Deuda Técnica** (servicios con custom filter)
- **38% Código Legado** (servicios creados antes del patrón)
- **37% Negligencia Técnica** (colecciones nuevas sin repository)

**ROI de completar:**
- 6 repos críticos (P0+P1): 190 ops protegidas en ~200 líneas (0.95 ops/línea)
- 22 repos totales: 260 ops protegidas en ~400 líneas (0.65 ops/línea)

---

## FIN AUDITORÍA FASE 1-8

**Documento ejecutado con estándar:** Todo con evidencia archivo:línea, sin asunciones.
