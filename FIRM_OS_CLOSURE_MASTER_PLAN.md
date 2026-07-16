# FIRM_OS_CLOSURE_MASTER_PLAN.md
## Plan Maestro Definitivo de Cierre — Firm OS · Punto Cero Legal
**Fecha de consolidación:** 2026-07-15 · **Fuente:** ejecución real (uvicorn @127.0.0.1:8010 + Mongo local + logins/requests HTTP + conteos Mongo).

> Este documento **reemplaza y consolida** todas las auditorías previas (DYNAMIC_RUNTIME_AUDIT, BUTTON_BY_BUTTON_REPORT, HTTP_TRACE_REPORT, MONGODB_PERSISTENCE_REPORT, DISCONNECTED_MODULES_REPORT, PRODUCTION_BLOCKERS_FINAL, FIRM_OS_IMPLEMENTATION_MASTER, BACKEND_BOOT_AUDIT). Es la **única referencia oficial** hasta la certificación de producción. Toda afirmación proviene de ejecución real; cada tarea cita archivo/endpoint. No hay duplicados ni tareas repetidas.

---

# 1. ESTADO GENERAL

**Estado real:** el núcleo de datos (compartido con Lawyer OS) **funciona y persiste**; la capa específica de firma tiene botones muertos, un arranque roto en `main` y tres bloqueos P0 baratos pero imprescindibles.

- **% operativo real (verificado end-to-end):** ~**35%**.
- **% pendiente para "Firm OS cerrado" (sin roadmap diferido):** ~**65%** del trabajo de cierre, pero concentrado en pocas tareas de bajo costo.

| Categoría | Módulos |
|---|---|
| ✅ **Terminados y operativos** (HTTP 200 + persistencia verificada) | CRM (CRUD probado), Agenda, Facturación (`/invoices`), Documentos, Reuniones, Dashboard KPIs, Notificaciones, Admin Dashboard, Equipo (solo lectura) |
| 🟡 **Incompletos** (existe pero roto/parcial) | Casos/Clientes (403 org), Invitar Abogado (500), Suspender miembro (404 ruta), Perfil/Configuración (guardado falso), Billing/Suscripciones OS (400 X-Tenant-ID), IA (503 sin key), Portal (422 param) |
| 🔴 **Muertos** (sin onClick, no hacen nada) | Actualizar Plan, Administrar Equipo, Invitar Miembro, Guardar Perfil, Guardar Despacho, Cambiar Foto, Activar 2FA, Cambiar Plan, Conectar Google Calendar, Conectar Outlook |
| ⛔ **Retirados** (commit `b2aa893` "retirar módulos no listos") | Comunicaciones, Estructura Organizacional, Expedientes, Oficinas, Departamentos, Asignaciones (archivos en disco, sin ruta ni sidebar) |
| ↩️ **Revertidos** | Tarjeta de plan + contador de trial en Dashboard (commit `c1dc11a` revirtió `fe6cacb`) |
| 👻 **Huérfanos / simulados** | `FirmSettings.jsx` (no importado); clúster Enterprise (Automatización, WorkflowBuilder, Scheduler, IntelligenceCenter, MissionControl, AutonomousOps, Governance) = solo localStorage, sin backend |

---

# 2. ARQUITECTURA DE DEPENDENCIAS (qué bloquea qué)

```
[BOOT] backend arranca (fix 4 imports get_current_user)   ← P0-1 · sin esto NADA corre
        │
        ▼
[JWT] login OK (ya funciona; sin refresh token)
        │
        ▼
[organization_id]  ← P0-2 · RAÍZ del aislamiento (hoy = None en todos)
        ├──► Casos (GET 403 hasta resolver)          cases.py:262
        ├──► Clientes (GET 403 hasta resolver)        clients.py:90
        ├──► Equipo (métricas por org)
        ├──► RBAC efectivo (scoping por tenant)
        └──► Facturación por firma / reporting
        │
        ▼
[EMAIL service]  ← P0-3 · utils/email_service falta
        └──► Invitar Abogado / Invitar Miembro / activación
        │
        ▼
[PERSISTENCIA UI]  ← P1 · cablear botones a endpoints que YA existen
        ├──► Perfil / Configuración (PUT /firm-os/settings ya responde 200)
        ├──► Suspender/Reactivar (usar /team/{id}/status, no /rbac/users/…)
        └──► Actualizar/Cambiar Plan (→ /payment/change-plan / checkout)
        │
        ▼
[TENANT HEADER]  ← P2 · X-Tenant-ID para Billing/Subscriptions OS
        │
        ▼
[PORTAL + IA]  ← P2 · param portal, API key IA
        │
        ▼
[INTEGRACIONES]  ← ROADMAP (NO Go-Live): Calendar, Outlook, 2FA, Comunicaciones
```

**Regla de oro:** no tocar botones/UI antes de resolver `organization_id`; de lo contrario se reparan flujos que igual devolverán 403. El orden correcto es Boot → org_id → email → persistencia UI → tenant/portal/IA.

---

# 3. BACKLOG CONSOLIDADO (por módulo, sin duplicados)

| Módulo | Estado | Prioridad | Horas | Dependencias |
|---|---|---|---|---|
| **Arranque backend** | 🔴 roto en `main` | P0 | 0.2 | — |
| **Aislamiento / organization_id** | 🔴 bloquea lectura | P0 | 6 | Boot |
| **Invitaciones** (Abogado/Miembro) | 🔴 500 + botón muerto | P0/P1 | 4 | email_service |
| **Casos** | 🟡 list 403 / create 201 | P0 | (incl. org_id) | organization_id |
| **Clientes** | 🟡 list 403 / create 201 | P0 | (incl. org_id) | organization_id |
| **Equipo** | 🟡 carga OK, suspender 404, invitar muerto | P1 | 4 | org_id, email |
| **Perfil** | 🔴 guardado falso, sin avatar | P1 | 12 | endpoint update-user (nuevo) |
| **Configuración/Despacho** | 🔴 guardado falso | P1 | 4 | cablear a PUT /firm-os/settings (existe) |
| **Planes** (Actualizar/Cambiar) | 🔴 botones muertos | P1 | 4 | cablear a /payment/change-plan (existe) |
| **Facturación** (`/invoices`) | ✅ operativo | P2 | 2 | — (solo QA/PDF) |
| **Billing/Suscripciones OS** | 🟡 400 X-Tenant-ID | P2 | 4 | tenant header |
| **CRM** | ✅ CRUD persistente | — | 0 | — |
| **Documentos** | ✅ listar/subir | P2 | 2 | QA cifrado |
| **Agenda** | ✅ crear/listar | P2 | 1 | — |
| **Reuniones (Jitsi)** | ✅ listar/crear | P2 | 2 | QA video |
| **IA Jurídica** | 🟡 503 sin key | P2 | 2 | GEMINI/ANTHROPIC key |
| **Portal cliente** | 🟡 422 param | P2 | 3 | — |
| **Notificaciones/Alertas** | ✅ operativo | — | 0 | — |
| **Comunicaciones** | ⛔ retirado + mock | P3/Roadmap | 24 | backend mensajería |
| **Automatizaciones/Enterprise** | 👻 localStorage | P3/Roadmap | 40+ | backend nuevo |
| **Refresh token** | 🟡 no existe | P3 | 8 | — |
| **Endurecimiento auth** (endpoints sin guard) | 🟡 IDOR | P1 | 6 | — |

---

# 4. PRIORIZACIÓN DEFINITIVA

### P0 — Bloqueadores absolutos (sistema no usable/deployable sin esto)
| Tarea | Archivo | Endpoint | FE | BE | Mongo | JWT | Tenant | RBAC |
|---|---|---|---|---|---|---|---|---|
| Fix arranque (4 imports) | routes/meetings.py:17, documents.py, ai.py, chatbot.py | todos | — | ✅ | — | — | — | — |
| Asignar organization_id | cases.py:262, clients.py:90, registro/seed de users | GET /cases/, /clients/ | — | ✅ | users.organization_id | — | ✅ | ✅ |
| Crear utils/email_service (o usar notifier) | routes/firm_os.py:513 | POST /firm-os/invite-lawyer | — | ✅ | lawyer_invitations | — | — | — |

### P1 — Mayores (funciones core aparentan existir y no funcionan)
| Tarea | Archivo | Endpoint | FE | BE | Mongo |
|---|---|---|---|---|---|
| Corregir URL suspender | FirmTeam.jsx:81,107 | PATCH /team/{id}/status | ✅ | (existe) | users |
| Cablear Perfil a persistencia real | SettingsPage.jsx:57-60,122 | (nuevo PUT /users/me) | ✅ | ✅ | users |
| Cablear Configuración/Despacho | SettingsPage.jsx:185 | PUT /firm-os/settings (existe 200) | ✅ | — | firm_settings |
| Cablear botones muertos de plan/equipo | FirmDashboard.jsx:136,149; FirmTeam.jsx:182; SettingsPage.jsx:203 | /payment/change-plan, navegación /team | ✅ | — | — |
| Endurecer auth en endpoints sin guard | cases/documents/invoices/meetings (writes sin current_user) | varios | — | ✅ | — |

### P2 — Medios (config/parámetros/segundo sistema)
| Tarea | Archivo | Endpoint | Nota |
|---|---|---|---|
| Enviar X-Tenant-ID desde FE | cliente axios + billing.py/subscriptions.py | GET /billing/, /subscriptions/ | 400→200 |
| Parámetro Portal | portal.py | GET /portal/cases | 422→200 |
| API key IA | .env (GEMINI/ANTHROPIC) | POST /ai/chat | 503→200 |
| QA Facturación/PDF/Documentos/Jitsi | InvoicesPage.jsx:141, DocumentsPage, MeetingsPage | — | validación funcional |

### P3 — Higiene (no bloquea Go-Live)
Refresh token; `chatbot.py:555` HTTPException import; limpieza de huérfanos/eliminados; decisión sobre clúster Enterprise.

---

# 5. ORDEN EXACTO DE IMPLEMENTACIÓN (secuencia, no lista)

```
FASE A — CIMIENTOS
  A1 Arranque (4 imports)           → sin backend no hay nada que probar
  A2 JWT (ya OK) + verificar claims  → base de identidad
  A3 organization_id en users/seed  → desbloquea el 80% de las lecturas
  A4 Tenant/RBAC scoping coherente   → una vez hay org, el aislamiento aplica
        ↓
FASE B — PERSISTENCIA REAL
  B1 email_service (invitaciones)    → crecimiento de la firma
  B2 Cablear Perfil/Config/Planes    → los endpoints ya existen; solo conectar
  B3 Corregir URL suspender          → 1 línea
  B4 Endurecer auth (IDOR)           → seguridad antes de exponer
        ↓
FASE C — SUPERFICIE DE FIRMA
  C1 Billing/Subscriptions (X-Tenant-ID)
  C2 Portal (param) + IA (key)
  C3 QA integral de módulos ✅ (CRM/Casos/Clientes/Docs/Agenda/Facturación/Reuniones)
        ↓
FASE D — INTEGRACIONES (ROADMAP, fuera de Go-Live)
  Calendar / Outlook / 2FA / Comunicaciones / Enterprise
```

**Por qué este orden evita retrabajo:**
1. Reparar botones (FASE B) **antes** de `organization_id` (A3) sería inútil: seguirían dando 403.
2. Endurecer auth (B4) **después** de que existan los flujos, pero **antes** de exponer billing/portal (FASE C), evita re-tocar los mismos endpoints.
3. Las integraciones (FASE D) dependen de que el core esté cerrado; hacerlas antes multiplica el costo de QA.

---

# 6. CHECKLIST POR SPRINT

## Sprint C0 — DESBLOQUEO (Fase A)
- **Objetivo:** que el sistema arranque, se despliegue sin romper prod, y que Casos/Clientes se puedan leer.
- **Tareas:** fix 4 imports → commit seguro a `main` (antes del próximo deploy); asignar `organization_id` a usuarios/firmas (registro + migración de existentes); revisar guard org en lectura vs escritura.
- **Horas:** ~10.
- **Riesgos:** tocar tenant sin romper el kernel (no modificar `kernel/tenant_kernel.py`); migración de datos existentes.
- **Resultado esperado:** backend arranca en `main`; `GET /cases/` y `/clients/` → 200; producción a salvo del deploy.

## Sprint C1 — REPARAR LO EXISTENTE (Fase B)
- **Objetivo:** que ningún botón visible mienta.
- **Tareas:** email_service (invitaciones 500→200); cablear Perfil/Config/Despacho/Planes a sus endpoints; URL suspender; endurecer auth en endpoints sin `current_user`.
- **Horas:** ~28.
- **Riesgos:** crear endpoint de perfil/avatar (nuevo, mínimo); regresiones en RBAC al añadir guards.
- **Resultado esperado:** 14 botones muertos/rotos → funcionales o correctamente ocultos; toda acción persiste en Mongo.

## Sprint C2 — SUPERFICIE DE FIRMA (Fase C)
- **Objetivo:** billing/portal/IA operativos + QA integral.
- **Tareas:** enviar X-Tenant-ID; parámetro portal; API key IA + verificación; QA funcional de CRM/Casos/Clientes/Docs/Agenda/Facturación/Reuniones/Jitsi/PDF.
- **Horas:** ~16.
- **Riesgos:** IA depende de proveedor externo (Gemini/Claude); Jitsi depende de red.
- **Resultado esperado:** todos los módulos del Go-Live respondiendo 200 con persistencia; checklist §7 verde.

## Sprint C3 — HIGIENE Y CIERRE (Fase D parcial)
- **Objetivo:** limpieza y certificación.
- **Tareas:** refresh token (opcional); limpiar huérfanos/eliminados; decidir ocultar clúster Enterprise; regression suite; certificación §7.
- **Horas:** ~14.
- **Riesgos:** bajo.
- **Resultado esperado:** Firm OS cumple la Definición de Cerrado; roadmap posterior separado.

---

# 7. DEFINICIÓN DE "FIRM OS CERRADO" (criterios medibles)

| # | Criterio | Verificación |
|---|---|---|
| 1 | Todos los botones visibles disparan una acción real | 0 botones sin onClick en pantallas de Firm OS |
| 2 | Toda acción de escritura persiste en Mongo | Δ documento verificado + re-fetch tras refresh |
| 3 | No existen endpoints 404 invocados por el FE | grep de rutas FE vs OpenAPI = 0 faltantes (ej. suspender) |
| 4 | No existen 500 en flujos del FE | invite-lawyer y demás → 200/201 |
| 5 | `organization_id` presente en todos los usuarios | Mongo: 0 users con org_id None en firmas |
| 6 | JWT válido en todos los roles | login 4 roles 200 (refresh opcional para cierre) |
| 7 | Equipo operativo | cargar + invitar + suspender/reactivar + rol → 200 y persiste |
| 8 | Perfil operativo | guardar perfil → PUT 200 + persiste tras refresh |
| 9 | Configuración persistente | guardar despacho → PUT /firm-os/settings 200 |
| 10 | Invitaciones funcionales | POST /firm-os/invite-lawyer 200 + Δlawyer_invitations |
| 11 | Billing funcional | GET /billing/ 200 (con X-Tenant-ID) |
| 12 | Dashboard consistente | KPIs reales, sin botones muertos, datos de la firma visibles |
| 13 | Casos/Clientes legibles | GET /cases/, /clients/ 200 para roles de firma |
| 14 | Sin endpoints de escritura sin auth | writes exigen `current_user` |

**Firm OS = CERRADO** cuando 1-14 son ✔ (integraciones Calendar/Outlook/2FA/Comunicaciones NO forman parte de este criterio).

---

# 8. GO-LIVE

**¿Qué falta exactamente para producción?**
1. Arranque en `main` (fix 4 imports + deploy seguro). **Obligatorio.**
2. `organization_id` en usuarios/firmas → desbloquea Casos/Clientes. **Obligatorio.**
3. `utils/email_service` → Invitar Abogado/Miembro. **Obligatorio.**
4. Cablear Perfil/Configuración/Planes + URL suspender. **Obligatorio** (o ocultar lo que no se cablee).
5. Endurecer auth en endpoints de escritura sin guard. **Obligatorio** (seguridad).
6. X-Tenant-ID (billing), param portal, API key IA. **Obligatorio para el módulo respectivo.**

**¿Cuántas horas reales?** **≈ 55–65 h** de desarrollo (obligatorio Go-Live), + ~10 h de QA/deploy. Total **~65–75 h**.

**Tareas obligatorias:** C0 completo, C1 completo, C2 (billing/portal/IA/QA).

**Tareas que pueden diferirse:** refresh token, limpieza de huérfanos, PDF server-side, y todo el §9.

---

# 9. ROADMAP POSTERIOR (NO ES GO-LIVE)

Fuera del backlog crítico — no bloquean producción:
- Google Calendar (OAuth) — ~24 h
- Outlook Calendar (OAuth) — ~24 h
- 2FA/TOTP — ~16 h
- Comunicaciones real (mensajería + WebSocket) — ~24-40 h
- White Label avanzado
- Marketplace
- Clúster Enterprise/Automatización con backend real (hoy localStorage) — ~40+ h
- Integraciones futuras

*Recomendación: en el Go-Live, estos botones/toggles se OCULTAN o marcan "Próximamente" (no dejar toggles falsos visibles).*

---

# 10. DICTAMEN FINAL

- **¿Firm OS está al 30/60/80/90%?** → **~35% operativo real hoy** (núcleo de datos compartido con Lawyer OS funciona y persiste; la capa de firma está mayormente muerta/bloqueada).
- **¿Qué falta realmente?** Tres bloqueos P0 baratos (arranque, `organization_id`, `email_service`) + cablear ~14 botones a endpoints que **en su mayoría ya existen** + endurecer auth + config de tenant/IA.
- **¿Puede cerrarse en un solo ciclo de desarrollo?** **SÍ.** No requiere nueva arquitectura ni módulos nuevos; el backend y la persistencia ya existen y funcionan. Es trabajo de conexión, configuración y datos, no de construcción.
- **¿Cuántas horas reales quedan?** **~65–75 h** (≈ 1 sprint de 2 semanas con 1 dev enfocado, o ~1 semana con 2 devs), excluyendo el Roadmap §9.

**Veredicto:** Firm OS es **cerrable en un ciclo**. El mayor riesgo no es técnico sino de **orden**: si se reparan botones antes de `organization_id`, se pierde tiempo. Seguir la secuencia §5 (Cimientos → Persistencia → Superficie → Integraciones diferidas).

---
*Documento maestro consolidado. Sin código, sin modificaciones, sin nuevas auditorías. Evidencia base: ejecución real 2026-07-15 sobre backend local (127.0.0.1:8010) + MongoDB (puntocero_legal). Supersede todas las auditorías previas como referencia oficial de cierre.*
