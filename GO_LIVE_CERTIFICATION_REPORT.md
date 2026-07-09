# GO-LIVE CERTIFICATION REPORT

**Producto:** Punto Cero Legal — Lawyer OS · Firm OS · Admin OS (Punto Cero System OS)
**Rama evaluada:** `staging` (working tree actual, incluye cambios sin commitear)
**Fecha:** 2026-07-09
**Metodología:** Certificación de 3 niveles (Estructural / Funcional / Operacional). El criterio principal es **capacidad operativa real**, NO porcentaje de implementación.
**Alcance:** Verificación estática (código en disco) + verificación dinámica en runtime (backend `uvicorn` sobre MongoDB local, tokens JWT reales de los usuarios de prueba y de usuarios con firma real).

---

## 0. VEREDICTO EJECUTIVO

| Módulo | Nivel 1 (Estructural) | Nivel 2 (Funcional) | Nivel 3 (Operacional) | **Estado** |
|--------|:---:|:---:|:---:|:---:|
| **Lawyer OS** | ✅ Sólido | ❌ Bloqueado en runtime | ❌ 500 en toda API autenticada | 🔴 **NO CERTIFICADO** |
| **Firm OS** | 🟡 Presente pero desconectado | ❌ Bloqueado en runtime | ❌ 500 incluso con `firm_id` válido | 🔴 **NO CERTIFICADO** |
| **Admin OS** | ✅ Sólido | ❌ Bloqueado en runtime | ❌ 500 (admin nunca pasa el kernel) | 🔴 **NO CERTIFICADO** |

> **Conclusión:** El sistema **NO está listo para staging ni producción** en el estado actual del working tree.
> **La causa NO es falta de funcionalidad** — el código está mayormente implementado y en gran parte cableado a endpoints reales. La causa es una **regresión sistémica de integración en runtime**: la rama `staging` introdujo un endurecimiento de seguridad (Tenant Kernel + Barrera de BD `GuardedDB`) **sin migrar el código de rutas para cumplirlo**. El resultado es que, tras un login exitoso, **prácticamente ningún endpoint autenticado responde 2xx**.

Esto es una buena noticia relativa: es un problema de **integración/migración incompleta**, no de ausencia de producto. Es corregible. Pero **tal como corre hoy, no puede desplegarse.**

---

## 1. HALLAZGO BLOQUEANTE SISTÉMICO (afecta a los 3 módulos)

Toda petición autenticada atraviesa esta pila de middleware (orden de registro en `backend/server.py:201-203`):

```
SecurityEnforcerMiddleware  →  TenantKernelMiddlewareWrapper  →  TenantIsolationMiddleware (legacy/deprecated)  →  endpoint
```

### 1.1 — El Tenant Kernel exige `firm_id` en el JWT para TODA ruta no exenta

`backend/kernel/tenant_kernel.py:156-163`:

```python
if not jwt_firm_id or not jwt_user_id:
    ...
    raise TenantValidationError("Missing required JWT claims")
```

- Rutas exentas (`EXEMPT_PATHS`, `tenant_kernel.py:67-76`): solo `/api/health`, `/docs`, `/openapi.json`, `/api/auth/login|register|refresh`.
- **Cualquier otra ruta requiere `firm_id` en el JWT.**
- `TenantValidationError` NO se mapea a 401/403 en el wrapper; cae en `except TenantKernelError → 500` (`tenant_kernel_middleware.py:129-138`).

**Consecuencia:** todo usuario cuyo JWT no lleve `firm_id` recibe **HTTP 500** en cualquier endpoint autenticado. Esto incluye por diseño:
- **Administradores** (son de plataforma, no tienen firma → `firm_id=null`).
- **Abogados individuales** (producto Lawyer OS individual → `firm_id=null`).
- **Dueños de firma sin firma provisionada** (`firm_id=null`).

**Evidencia runtime (tokens frescos y válidos):**

| Persona | Login | `GET /api/auth/me` | `GET /api/users/` | `GET /api/firms` |
|---|---|---|---|---|
| admin@puntocerolegal.com | ✅ 200 | ❌ **500** | ❌ **500** | ❌ **500** |
| abogado@puntocerolegal.com | ✅ 200 | ❌ **500** | ❌ **500** | ❌ **500** |

Log del backend: `[TENANT_KERNEL] Missing required JWT claims ... has_firm_id=False | has_user_id=True` → `[TENANT_KERNEL_MIDDLEWARE] 500 Kernel Error`.

### 1.2 — La barrera de BD `GuardedDB` bloquea las rutas que aún acceden directo a colecciones

`backend/security/guarded_db.py:46-66` envuelve cada colección y **prohíbe** el acceso directo (`db.<coleccion>.find_one(...)`), exigiendo pasar por `SecureRepository`. Las rutas que no fueron migradas lanzan `AssertionError` → 500.

**Evidencia runtime** — token con `firm_id` real (usuario `laura.restrepo@bufetedemoprod.co`, firma `6a473721626d1cb2b60e56b8`, existe en BD):

| Endpoint (núcleo de Firm OS) | Resultado | Causa (log) |
|---|---|---|
| `GET /api/firms/{id}/lawyers` | ❌ **500** | `Direct access to collection 'firms' is forbidden. Must use SecureRepository` |
| `GET /api/firms/{id}/cases` | ❌ **500** | idem (GuardedDB) |
| `GET /api/firms/{id}/clients` | ❌ **500** | idem (GuardedDB) |
| `GET /api/firms/{id}/financial` | ❌ **500** | idem (GuardedDB) |
| `GET /api/firm-os/dashboard` | ❌ **500** | excepción no controlada |
| `GET /api/firm-os/settings` | ❌ **500** | excepción no controlada |
| `GET /api/rbac/team/{id}` | ❌ **500** | GuardedDB / `'coroutine' object has no attribute 'to_list'` (falta `await`) |
| `GET /api/cases/?lawyer_id=x` | ❌ **500** | GuardedDB |
| `GET /api/firms/` | 🟡 403 | *(kernel pasó; rechazo de rol correcto: "Solo administradores pueden listar firmas")* |

> El 403 en `/api/firms/` es la única señal positiva: demuestra que **cuando el JWT sí lleva `firm_id`, el kernel deja pasar** y la lógica de rol del endpoint se ejecuta. Es la prueba de que la ruta feliz existe pero está tapada por los bugs de acceso a BD.

### 1.3 — Dos sistemas de tenant en conflicto

Coexisten dos mecanismos incompatibles:
- **Kernel** (`kernel/tenant_kernel.py`): fuente de verdad = `firm_id` del JWT; cabecera de consistencia `X-Firm-ID`.
- **Legacy** (`utils/tenant.py` → `get_tenant_context`): exige la cabecera **`X-Tenant-ID`** o responde **400 "Falta la cabecera X-Tenant-ID"**.

Endpoints como `/api/analytics/dashboard`, `/api/subscriptions/`, `/api/partners/dashboard` usan el sistema legacy → responden **400** si no llega `X-Tenant-ID` (y **500** si llega, por GuardedDB). El frontend inyecta la cabecera solo cuando existe `tenantId` en `tenantStorage` (`frontend/src/security/tenantStorage.js:30-32`), lo que **no ocurre para admin ni abogado individual**.

### 1.4 — Degradación de excepciones a 500

Tanto el kernel wrapper como el middleware legacy (`middleware/tenant_isolation.py:117-125`) relanzan `HTTPException` dentro de `BaseHTTPMiddleware.dispatch`. Por el comportamiento de Starlette, una `HTTPException(401)` lanzada ahí **no** se convierte en respuesta 401 limpia sino que escala a **500**. Incluso los rechazos de autenticación legítimos se reportan como error de servidor.

### 1.5 — Cambio sin commitear que degrada seguridad

`git diff backend/kernel/tenant_kernel.py` (sin commitear) **elimina el fail-fast del secreto JWT** y reintroduce un fallback hardcodeado `"dev-fallback-key-change-in-production"`. Esto debilita la postura de seguridad y no debe llegar a producción.

---

## 2. LAWYER OS — 🔴 NO CERTIFICADO

### Nivel 1 — Estructural: ✅ SÓLIDO
- Montaje: `frontend/src/App.js:73` → `<Route path="/dashboard/*" element={<LawyerShell/>} />`.
- Registro: `shells/lawyer/lawyerRegistry.js:13-24` mapea 10 páginas; imports resueltos a archivos reales en `pages/dashboard/`.
- Seguridad: todas las rutas envueltas en `ProtectedRoute require={['lawyer','client']}` (`LawyerShell.jsx:8,15-24`); `ProtectedRoute.jsx:32-59` fuerza login, verificación y control de rol.
- Cliente HTTP: `axios` con base `/api` (`config/api.js:34`), token JWT global (`AuthContext.jsx:185`).
- ⚠️ Anomalía: doble `DashboardLayout` anidado (shell + página) sin activar `NestedLayoutContext` — el layout se renderiza dos veces (`LawyerShell.jsx:15-24` vs. `CasesPage.jsx:186`, `AgendaPage.jsx:106`, etc.). Requiere verificación visual.

### Nivel 2 — Funcional: ❌ BLOQUEADO
- Login abogado: ✅ 200, JWT válido (`role=lawyer`, `firm_id=null`).
- **Todo lo demás tras login: ❌ 500** por el bloqueo del §1.1 (el JWT del abogado no lleva `firm_id`). Dashboard, casos, agenda, documentos, IA, notificaciones y perfil **no se pueden ejercer end-to-end**.

### Nivel 3 — Operacional
Cableado **en código fuente** (verificado estáticamente; hoy inaccesible por §1):

| Capacidad | Endpoint | Colección | Estado en código | Estado runtime |
|---|---|---|---|---|
| Login | `POST /api/auth/login` | `users` | FUNCIONAL-REAL | ✅ 200 |
| Dashboard | `GET /api/dashboard/kpis/{id}`, `/alerts/{id}`, `/integration/expedientes`, `/payment/my-plan` | `cases`, `users`, `notifications` | FUNCIONAL-REAL (catálogo de planes = mock, `DashboardHome.jsx:15`) | ❌ 500 |
| Recepción de casos | `GET/POST /api/cases/`, `POST /cases/{id}/accept|decline`, `DELETE /cases/{id}` | `cases`, `case_activities` | FUNCIONAL-REAL | ❌ 500 |
| Cambio de estado | `PATCH /api/cases/{id}` | `cases`, `case_activities` | FUNCIONAL-REAL (registra hito) | ❌ 500 |
| Gestión documental | `GET/POST /api/documents/*`, `/documents/{id}/content` | `documents` | FUNCIONAL-REAL (cifrado zero-knowledge en cliente) | ❌ 500 |
| Agenda/citas | `GET/POST /api/appointments/` | `appointments` | FUNCIONAL-REAL (sync Google/Outlook = UI decorativa, `AgendaPage.jsx:196`) | ❌ 500 |
| IA jurídica | `POST /api/ai/chat`, `GET /ai/usage/{id}` | `ai_sessions` | FUNCIONAL-REAL (Gemini + Claude; **requiere API key**, si no → 503) | ❌ 500 |
| Notificaciones | `GET /api/dashboard/notifications/{id}`, `POST .../read` | `notifications` | FUNCIONAL-REAL (poll 60s) | ❌ 500 |
| **Perfil / Configuración** | *(ninguno)* | — | **NO PERSISTE** — `SettingsPage.jsx:57-60` `handleSave` solo hace `setSaved(true)`; no llama a ningún endpoint; el cambio de contraseña existe en backend (`auth.py:225`) pero la UI no lo consume. Integraciones `connected:true` hardcodeadas (`:238-243`) | ❌ (cosmético) |
| Logout | *(local, JWT stateless)* | — | FUNCIONAL-REAL | ✅ |

**Observaciones no bloqueadas por §1 (deuda propia del módulo):**
1. **Perfil no persiste** — única capacidad que *aparenta* funcionar sin hacerlo. Clasificación: `IMPLEMENTADA-REQUIERE-INTEGRACIÓN-UI` (el backend de cambio de contraseña existe, la UI no lo llama).
2. Sincronización de agenda con calendarios externos: solo UI.
3. IA depende de `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` (en `.env` son placeholders).

---

## 3. FIRM OS — 🔴 NO CERTIFICADO

### Nivel 1 — Estructural: 🟡 PRESENTE PERO DESCONECTADO
- Montaje: `App.js:94` → `<Route path="/firm-os/*" element={<FirmShell/>} />`; `ProtectedRoute require={['firm_owner','firm_admin','firm_lawyer']}` (`FirmShell.jsx:18`).
- Existe una arquitectura extensa `modules/firm-os/` (domain/application/hooks/pages), pero:
  - **Único contacto real con backend:** `hooks/useFirmCoreData.js:29-33` (`/firms/{id}/lawyers|cases|clients`) y `hooks/useOnboarding.js:85-109`. **Todo el resto** de `application/*`, `domain/*` y demás hooks (automation, orchestration, governance, workflows, autopilot, scheduler, IA) es **lógica pura / derivada en cliente, sin backend**.
  - **Rutas de Casos/Clientes/CRM/Facturación/Config montan las páginas individuales del abogado** (`@/pages/dashboard/*`), scopeadas a `lawyer_id=${user.id}` — el `firm_owner` ve SUS datos personales, **no el agregado de la firma** (`firmRegistry.js:3-11`).
  - **Páginas enterprise huérfanas** (existen, ninguna ruta las monta): `FirmFinance`, `FirmCases`, `FirmSettings`, `BillingEnterprise`, `CRMEnterprise`, `ReportsPage`, `AICorporate`, `OnboardingWizardFirm`, `WorkflowCenterPage`.

### Nivel 2 — Funcional: ❌ BLOQUEADO
- Login firma: ✅ 200 (`role=firm_owner`).
- Usuario de prueba `firma@puntocerolegal.com` tiene **`firm_id=null`** (no hay firma asociada) → gate `useFirmCoreData.js:23-27` "No tienes acceso a una firma" + bloqueo del kernel (§1.1).
- Con un JWT que **sí** lleva `firm_id` de una firma real: los 3 endpoints núcleo (`/firms/{id}/lawyers|cases|clients`) devuelven **500** por GuardedDB (§1.2). **Ninguna vista de firma se puede ejercer end-to-end.**

### Nivel 3 — Operacional

| Capacidad | Endpoint | Existe en backend | Estado en código | Estado runtime |
|---|---|---|---|---|
| Login firma | `POST /api/auth/login` | ✅ | FUNCIONAL-REAL | ✅ 200 |
| Dashboard | `GET /api/firms/{id}/lawyers|cases|clients` | ✅ (`firms.py:964/1022/1075`) | FUNCIONAL-REAL parcial (plan/estado = `SubscriptionContext` localStorage) | ❌ 500 (GuardedDB) |
| Gestión de abogados | `GET /api/firms/{id}/lawyers` | ✅ | IMPLEMENTADA-REQUIERE-INTEGRACIÓN (contrato de datos incompleto → todos "Inactivo"; acciones = `alert()`) | ❌ 500 |
| Gestión de equipo | `GET /api/rbac/team/{id}` ✅; **`PATCH /rbac/users/{id}/status` NO EXISTE** | parcial | Suspender/reactivar → **404** (endpoint inexistente) | ❌ 500 |
| Invitar abogado | `POST /api/firm-os/invite-lawyer` | ✅ (`firm_os.py:493`) | FUNCIONAL-REAL | ❌ 500 |
| Gestión de clientes | `GET /api/clients/?lawyer_id=` | ✅ | **NO a nivel firma** (vista individual) | ❌ 500 |
| Gestión de casos | `GET /api/cases/?lawyer_id=` | ✅ | **NO a nivel firma** (vista individual; asignación sin persistencia) | ❌ 500 |
| Facturación | `GET /api/invoices/?lawyer_id=` (individual); `/firms/{id}/financial` (firma, huérfano) | ✅ | **NO a nivel firma** | ❌ 500 |
| Suscripción | *(ninguno)* | — | **NO-IMPLEMENTADA (usa-mock)** — `SubscriptionContext.jsx:15-40` es localStorage con default `ACTIVO`+plan superior | — |
| Reportes/Analytics | `GET /api/firms/{id}/lawyers|cases` | ✅ | FUNCIONAL-REAL (derivado en cliente; ranking con ceros por contrato incompleto) | ❌ 500 |
| Configuración | `GET/PUT /api/firm-os/settings` (existe, no ruteado); usa `SettingsPage` genérico | ✅ | **NO a nivel firma**; onboarding roto (`useOnboarding.js:85` apunta a `PUT /firm/{id}` singular y `POST /rbac/invite` inexistente) | ❌ 500 |

**Bugs propios confirmados (independientes de §1):**
1. Suspender/reactivar equipo → **404** (`PATCH /rbac/users/{id}/status` no existe).
2. Onboarding → `PUT /firm/{id}` (el router es `/firms` plural, método `PATCH`) + `POST /rbac/invite` (inexistente).
3. Contrato de datos de abogados desalineado (faltan `status`, `documents_created`, `ai_usage`… → tarjetas en default).
4. Gestión real de casos/clientes/facturación/config **a nivel firma no está expuesta** (páginas enterprise huérfanas).

---

## 4. ADMIN OS (Punto Cero System OS) — 🔴 NO CERTIFICADO

### Nivel 1 — Estructural: ✅ SÓLIDO (con deuda)
- Shell activo: `shells/admin/AdminShell.jsx` + `adminRegistry.js`; todas las rutas con `ProtectedRoute require={['admin','admin_general','socio_comercial']}` (`AdminShell.jsx:7,14-45`).
- ⚠️ **Doble sistema de rutas:** coexiste `modules/admin/AdminModule.jsx` (legacy) con casi las mismas rutas **sin `ProtectedRoute`**. Verificar que nada lo monte.
- ⚠️ **Páginas huérfanas** (no están en `adminRegistry`): `ExecutiveIntelligenceCenter`, `GlobalNetwork`, `PendingFirmsCenter`, `FirmSolicitudesModule` (solo referenciadas en el legacy).

### Nivel 2 — Funcional: ❌ BLOQUEADO
- Login admin: ✅ 200 (`role=admin`, `firm_id=null`).
- **El admin NUNCA pasa el kernel** (§1.1): al no tener `firm_id`, toda ruta admin devuelve **500**. Confirmado en runtime: `/api/users/`, `/api/firms`, `/api/auth/me` → 500. **El panel administrativo completo es inaccesible tras login.**

### Nivel 3 — Operacional
Cableado en código (verificado estáticamente; hoy inaccesible por §1.1). "usa-mock" = el patrón `useOSResource.js:9,26-31` inicializa con `service._mock` y **conserva el mock silenciosamente si el endpoint da 404/500**:

| Capacidad | Endpoint(s) | Existe backend | Clasificación en código |
|---|---|---|---|
| Login admin | `POST /api/auth/login` | ✅ | FUNCIONAL-REAL |
| Dashboard ejecutivo | `/api/admin-ops/operations/cases`, `/subscriptions`, `/partners/dashboard` | ✅ | FUNCIONAL-REAL (polling 5s con `console.log` de debug) |
| Gestión de usuarios | `/api/users/dashboard`, CRUD `/users/*` | ❌ (solo `GET /users/` y `/users/me`) | **NO-IMPLEMENTADA** — el resto da 404 → mock vacío. CRUD real existe en `enterprise_user_routes.py` **pero NO está montado** en `server.py` |
| Gestión de abogados | `/api/admin-ops/sales/candidates`, `/admin-master/*` | ✅ | FUNCIONAL-REAL |
| Gestión de firmas | `/api/firms`, `/firms/{id}/*`, `/organizations/{id}/*` | ✅ | FUNCIONAL-REAL |
| Suscripciones | `/api/subscriptions`, `/admin-master/subscription/{id}` | ✅ | FUNCIONAL-REAL |
| **Planes** | `/api/plans/*` | ❌ (no hay router `/plans`) | **NO-IMPLEMENTADA (mock)** |
| CRM / Sales | `/api/sales-analytics/*`, `/ai-operations/copilot-summary` | ✅ | FUNCIONAL-REAL |
| Marketplace/Directorio | `/api/firms`, `/admin-ops/sales/candidates` | ✅ | FUNCIONAL-REAL |
| Analytics | `/api/analytics/dashboard` | ✅ | FUNCIONAL-REAL (banner "datos de demostración" hardcodeado aunque el origen sea real; **requiere `X-Tenant-ID`** — §1.3) |
| **Billing** | `/api/billing/dashboard` | ✅ pero con bug | **REQUIERE-CORRECCIÓN** — `billing.py` accede `ctx.request_id` (atributo) sobre un `dict` de `utils/tenant.py:61` → `AttributeError` → 500 |
| **IA Comercial** | `/api/commercial-ai/*` | ❌ | **NO-IMPLEMENTADA (mock)** |
| Auditoría | `/api/admin-master/audit` | ✅ | FUNCIONAL-REAL (historial inmutable) |
| Config global | `organizations`/`partners`/`implementations`/`referrals` ✅; `roles`/`permissions`/`verticals`/`notifications` ❌ | parcial | PARCIAL — RBAC real vía `/rbac`; roles/permisos/verticals/notif → mock (routers no montados; `enterprise_rbac_routes.py` existe pero no está montado) |

**Deuda propia confirmada (independiente de §1):**
1. Gestión de usuarios: endpoints CRUD ausentes (router enterprise sin montar) → mock vacío.
2. Planes, IA Comercial, roles/permisos/verticals/notificaciones → sin router → mock.
3. Bug billing `ctx.request_id` → 500.
4. Fallback silencioso a mock oculta fallos de backend (banners "demo" hardcodeados incluso donde el dato es real).

---

## 5. LO QUE SÍ ESTÁ CERTIFICADO EN RUNTIME (evidencia positiva)

Para no sesgar el informe: lo verificado como **operativo** hoy es la capa de acceso:
- ✅ `GET /api/health` → 200.
- ✅ `GET /docs` (OpenAPI) → 200.
- ✅ `POST /api/auth/login` → 200 con JWT válido para **admin, abogado y firma** (roles y claims correctos).
- ✅ Rechazo de rol correcto tras el kernel: `GET /api/firms/` con token de firma → **403** "Solo administradores pueden listar firmas" (prueba de que la ruta feliz existe y la autorización de rol funciona cuando el kernel deja pasar).

No se encontró **ningún** endpoint autenticado que devuelva **200 con datos de negocio** para ninguna de las tres personas en el estado actual.

---

## 6. PLAN DE REMEDIACIÓN (prerequisito de GO-LIVE)

**P0 — Bloqueantes sistémicos (sin esto, nada funciona):**
1. **Kernel vs. roles sin firma.** Decidir política para `admin` / abogado individual / cliente (que por diseño no tienen `firm_id`): eximirlos del requisito de `firm_id` o proveerles un contexto de tenant válido. Hoy `tenant_kernel.py:156-163` los bloquea con 500.
2. **Migrar rutas a `SecureRepository`.** Eliminar todo acceso directo `db.<coleccion>` en las rutas activas (empezando por `firms.py`, `firm_os.py`, `rbac.py`, `cases.py`, `clients.py`, `invoices.py`, `appointments.py`) para no chocar con `GuardedDB` (§1.2).
3. **Unificar el sistema de tenant.** El kernel (`X-Firm-ID`/JWT) y `utils/tenant.py` (`X-Tenant-ID`) son incompatibles (§1.3). Elegir uno y alinear frontend (`tenantStorage.js`) + backend.
4. **Corregir degradación a 500.** Mapear `HTTPException` de los middlewares a respuestas 401/403 reales (no dejar que Starlette las escale a 500).
5. **Revertir el fallback de secreto JWT** sin commitear (`tenant_kernel.py`, §1.5). Restaurar el fail-fast.
6. Corregir el bug `'coroutine' object has no attribute 'to_list'` (falta `await`) en la ruta de equipo.

**P1 — Bugs de módulo:**
7. Admin: montar el CRUD de usuarios y RBAC enterprise (o crear los routers `/plans`, `/commercial-ai`, `/roles`, `/permissions`, `/verticals`, `/notifications`) o marcar esas vistas como no disponibles. Corregir `billing.py ctx.request_id`.
8. Firm OS: `PATCH /rbac/users/{id}/status` (404), onboarding (`/firm/` vs `/firms/`, `/rbac/invite` inexistente), contrato de datos de abogados; conectar (o retirar) las páginas enterprise huérfanas.
9. Lawyer OS: conectar guardado real de perfil/contraseña (`SettingsPage`); resolver doble `DashboardLayout`.

**P2 — Higiene:**
10. Quitar el fallback silencioso a mock / banners "demo" hardcodeados que enmascaran fallos de backend.
11. Proveer `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` reales para IA jurídica.
12. Datos: crear firma asociada al `firm_owner` de prueba para poder validar Firm OS end-to-end.

---

## 7. NOTA DE ALCANCE Y MÉTODO

- No se modificó ningún archivo del sistema (auditoría de solo lectura, conforme a la Constitución de Desarrollo y a la Architecture Freeze v1.0).
- La verificación de runtime se hizo levantando el backend con `uvicorn server:app` sobre la MongoDB local, usando login real y JWT firmados con la clave del entorno. Los códigos HTTP citados son reproducibles con los usuarios de prueba y con un usuario de firma real existente en la BD (`laura.restrepo@bufetedemoprod.co`).
- Capacidades presentes en backend pero no expuestas en UI se documentaron como **IMPLEMENTADA-REQUIERE-INTEGRACIÓN-UI**, no como "faltante".
- La certificación se basa en **capacidad operativa real**, no en porcentaje de implementación, según lo instruido.

---

### DECISIÓN FINAL

🔴 **NO CERTIFICADO PARA PRODUCCIÓN — NO CERTIFICADO PARA STAGING (estado actual).**

El producto está mayormente construido, pero una regresión de integración de seguridad (kernel + barrera de BD, incompletamente migrada) deja **inoperante casi toda la superficie autenticada** tras el login. Una vez resueltos los bloqueantes **P0** de la §6, corresponde re-ejecutar esta certificación de 3 niveles antes de autorizar el despliegue.
