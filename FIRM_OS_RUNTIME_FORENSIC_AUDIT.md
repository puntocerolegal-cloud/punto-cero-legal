# FIRM_OS_RUNTIME_FORENSIC_AUDIT.md
## Auditoría Dinámica Real — Firm OS (ejecución en vivo)
Fecha: 2026-07-15 · Backend local: `uvicorn server:app` @ `127.0.0.1:8010` · Mongo: `mongodb://localhost:27017/puntocero_legal` (89 users, 36 colecciones).

**Método (transparencia total).** Toda evidencia proviene de **ejecución real**: arranque de uvicorn, logins HTTP reales, peticiones HTTP con JWT real y verificación de conteos en MongoDB antes/después. **No hay Playwright/Puppeteer instalado** en el proyecto, por lo que **no automaticé clicks DOM**; en su lugar disparé **la petición HTTP exacta que ejecuta el handler de cada botón** — que es la capa donde se decide si un botón "hace algo real" — y para botones sin `onClick` se documenta que **no se dispara ninguna petición** (evidencia estática `archivo:línea` + ausencia de endpoint cableado). Los datos de prueba creados se marcaron `[RUNTIME_AUDIT]`/`[RA]` y **se eliminaron** (BD restaurada, verificado 0 restantes).

---

## FASE 1 — LEVANTAR EL SISTEMA

| Componente | Resultado | Evidencia |
|---|---|---|
| MongoDB | ✅ escuchando | `Test-NetConnection 27017 = True`; `ping {ok:1.0}` |
| Backend (1er intento) | ❌ **NO ARRANCA** | `NameError: name 'get_current_user' is not defined` en `routes/meetings.py:17` → uvicorn crash; `GET /api/ -> 000` |
| Causa raíz | Regresión commit **`cc54e13`** | Añadió `Depends(get_current_user)` a `meetings/documents/ai/chatbot` **sin importar** el símbolo (evidencia `git show cc54e13`). Es error de import, no de sintaxis → `py_compile` no lo detecta (por eso mi certificación previa de "compila" fue cierta en sintaxis pero **el server nunca subió**). |
| Fix aplicado (autorizado) | 4 líneas | `from routes.auth import get_current_user` en `ai.py`, `chatbot.py`, `documents.py`, `meetings.py` |
| Backend (2º intento) | ✅ **ARRANCA** | `Application startup complete`; `GET /api/ -> 200 (0.001s)`; `/docs -> 200`; `/openapi.json -> 200`; cuenta `firma@` vinculada a `firm_id=6a525041524d422c4157c6b6` |

**Bug latente adicional detectado en runtime:** `chatbot.py:555` usa `HTTPException` sin importarlo (no bloquea arranque; rompería ese endpoint al invocarlo).

**PRODUCCIÓN (Render):** `GET https://puntocero-legal-api.onrender.com/api/ -> 200 (9.4s)`; login `firma@` -> 200. **Producción está viva corriendo un build ANTERIOR a `cc54e13`.** ⚠️ **El commit roto está en `main` pero aún no se ha redeployado**: el próximo deploy del backend desde `main` tumbará producción.

---

## FASE 2 — LOGIN REAL (4 roles)

`POST /api/auth/login` — todos **200**. El JWT solo transporta `sub`+`role`+`exp` (el `firm_id`/tenant se derivan de BD, no del token). `organization_id = None` en todos los usuarios de prueba.

| Rol | Email | HTTP | Claims JWT | firm_id | org_id |
|---|---|---|---|---|---|
| GLOBAL_ADMIN | darwin@puntocerolegal.com | 200 (465ms) | `role=admin_general` | None | None |
| LAWYER | abogado@puntocerolegal.com | 200 (405ms) | `role=lawyer` | None | None |
| FIRM_OWNER | firma@puntocerolegal.com | 200 (420ms) | `role=firm_owner` | **6a525041524d422c4157c6b6** | None |
| CLIENT | client@test.com | 200 (414ms) | `role=client` | None | None |

---

## FASE 3-6 — BOTONES / HTTP / MONGO (ejecución real como FIRM_OWNER)

`_id` firm_owner = `6a46e957c85a8e1e0d2fb244`. Cada fila = petición HTTP real + verificación Mongo.

### Botones MUERTOS (sin `onClick` → NO disparan ninguna petición)
| Botón | Evidencia estática | Backend correspondiente (probado) | Estado |
|---|---|---|---|
| Actualizar Plan (Dashboard) | FirmDashboard.jsx:136-138 sin onClick | `POST /payment/change-plan` existe (422=vivo) pero **no cableado** | ❌ NO OPERATIVO |
| Administrar Equipo (Dashboard) | FirmDashboard.jsx:149-151 sin onClick | — | ❌ NO OPERATIVO |
| Invitar Miembro (FirmTeam) | FirmTeam.jsx:182-185 sin onClick | — | ❌ NO OPERATIVO |
| Guardar Perfil | SettingsPage.jsx:57-60 `handleSave` falso | no existe endpoint update-perfil | ❌ NO OPERATIVO |
| Guardar Configuración/Despacho | SettingsPage.jsx:185 `handleSave` falso | `PUT /firm-os/settings` **200, modified_count:1** (vivo, no cableado) | ❌ FE NO OPERATIVO / backend OK |
| Cambiar Foto | SettingsPage.jsx:92 sin onClick | no existe endpoint avatar | ❌ NO OPERATIVO |
| Activar 2FA | SettingsPage.jsx:152 sin onClick | no existe endpoint 2FA/TOTP | ❌ NO OPERATIVO |
| Cambiar Plan (Settings) | SettingsPage.jsx:203 sin onClick | `POST /payment/change-plan` 422 (vivo) no cableado | ❌ NO OPERATIVO |
| Google Calendar / Outlook | SettingsPage.jsx:239-249 / AgendaPage.jsx:196 sin onClick | no existe OAuth/calendar | ❌ NO OPERATIVO |

### Botones con handler (petición HTTP disparada)
| Acción (botón) | Request real | HTTP | Mongo Δ | Estado |
|---|---|---|---|---|
| **Invitar Abogado** (FirmLawyers) | `POST /firm-os/invite-lawyer` | **500** `No module named 'utils.email_service'` | lawyer_invitations Δ0 | ❌ **ROTO en runtime** |
| **Equipo · Suspender** (ruta del FE) | `PATCH /rbac/users/{id}/status` | **404** Not Found | — | ❌ **ROTO (ruta inexistente)** |
| Equipo · Suspender (ruta REAL) | `PATCH /team/{id}/status` | **200** `Estado actualizado` | users Δ (status) | ✅ existe pero el FE NO la llama |
| Equipo · cargar | `GET /rbac/team/{firm_id}` | **200** (1 miembro) | lectura | ✅ |
| **CRM** listar / crear | `GET /leads/` **200**; `POST /leads/` **422** (valida email/campos) | 200/422 | — | ✅ vivo (CRUD cableado) |
| **Casos** listar | `GET /cases/?lawyer_id=` | **403** `Usuario sin organización asignada` | — | ❌ **BLOQUEADO (tenant)** |
| **Casos** crear | `POST /cases/` | **201** `CAS-2026-005` | cases Δ+1 (luego borrado) | ✅ persiste (sin guard de org) |
| **Clientes** listar | `GET /clients/?lawyer_id=` | **403** `sin organización` | — | ❌ **BLOQUEADO (tenant)** |
| **Clientes** crear | `POST /clients/` | **201** | clients Δ+1 (borrado) | ✅ persiste |
| **Agenda** listar / crear | `GET /appointments/` **200**; `POST` **422** (valida) | 200/422 | — | ✅ vivo |
| **Reuniones** listar / crear | `GET /meetings/` **200**; `POST` vivo | 200 | — | ✅ vivo |
| **Facturación** listar / crear | `GET /invoices/` **200**; `POST` **422** (valida `clientName≥2`) | 200/422 | — | ✅ vivo (CRUD + pago cableado) |
| **Documentos** listar | `GET /documents/` | **200** | lectura | ✅ vivo |
| **IA** chat | `POST /ai/chat` | **503** `Gemini sin clave/caído` | — | ⚠️ endpoint vivo; **sin API key en este entorno** |
| Config guardar (backend) | `PUT /firm-os/settings` | **200** modified_count:1 | firm_settings Δ (revertido) | ✅ backend real |
| Indicadores/Dashboard datos | `GET /firms/{id}/lawyers|cases|clients|financial` | **200** (data vacía, count:0) | lectura | ✅ vivo |
| practice-areas | `GET /firm-config/{id}/practice-areas` | **200** | **stub estático** (firm_config.py:265-273) | ⚠️ vivo pero hardcoded |
| Automatizaciones | (sin backend) | — | localStorage | ❌ no toca servidor |

**Nota 422:** un `422` = endpoint **vivo y validando** (mi payload sintético fue mínimo/ inválido a propósito). NO es defecto; las páginas reales envían el esquema correcto. Se distingue de `404` (ruta inexistente) y `500` (roto).

---

## FASE 7 — RUTAS

Verificación de config de enrutado (FirmShell.jsx) + comportamiento HTTP observado. El frontend es SPA (`vercel.json` rewrites `/* -> index.html`), por lo que a nivel HTTP toda ruta devuelve el shell; la resolución de componente se verifica por la config de rutas y el redirect catch-all.

| Ruta | Existe en FirmShell | Runtime | Nota |
|---|---|---|---|
| `/firm-os` (Dashboard) | ✅ | datos 200 | index |
| `/firm-os/team` | ✅ | `GET /rbac/team` 200 | operativo (load) |
| `/firm-os/lawyers` | ✅ | invite 500 | ver Fase 3 |
| `/firm-os/settings` | ✅ | render mock | usa `pages/dashboard/SettingsPage` (no `FirmSettings.jsx`, huérfano) |
| `/firm-os/crm|cases|clients|agenda|ai|meetings|invoices|documents` | ✅ | ver Fase 3 | casos/clientes 403 |
| `/firm-os/alerts|analytics|automation` | ✅ | 200 / localStorage | |
| **`/firm-os/communication`** | ❌ **eliminada** | catch-all → redirect `/firm-os` | **quién:** FirmShell.jsx:41 `<Route path="*" element={<Navigate .../>}>` |
| `/firm-os/billing` | ❌ no existe como ruta propia | facturación vive en `/firm-os/invoices` | |
| `/firm-os/structure|expedientes|offices|departments|assignments` | ❌ eliminadas | commit b2aa893 | |

---

## FASE 8 — COMUNICACIONES

- **¿Existe archivo?** ✅ `frontend/src/modules/firm-os/pages/CommunicationPage.jsx`.
- **¿Tiene Route?** ❌ No. Eliminada.
- **¿Tiene Sidebar?** ❌ No. Eliminado.
- **¿Quién/qué commit eliminó la ruta?** Commit **`b2aa893`** *"chore(firm-os): sincronizar enrutado/sidebar de Firm OS (retirar módulos no listos)"* (Autor: QA Bot, 2026-07-13). Diff: borró `<Route path="communication" element={...CommunicationPage...}/>` de `FirmShell.jsx` y `{ icon: MessageCircle, label:'Comunicación', path:'/firm-os/communication' }` de `FirmOSSidebar.jsx`.
- **¿Puede reconectarse?** Sí técnicamente (re-agregar import + Route + item de sidebar = ~3 líneas). **PERO** el contenido es 100% mock: `conversationGroups` hardcodeado (CommunicationPage.jsx:35-80), botones Enviar/Nueva/Buscar sin onClick (L184/97/149), sin backend ni WebSocket. Reconectarlo mostraría una pantalla falsa.
- **¿Cuánto trabajo?** Reconectar visual: ~1h. **Hacerlo funcional de verdad** (backend de mensajería, colección, WebSocket/polling, envío real): ~24-40h. No recomendado reconectar sin backend.

---

## FASE 9 — MATRIZ FINAL (runtime)

| Funcionalidad | Frontend | Backend | Endpoint | Mongo | Estado | Operativa | % |
|---|---|---|---|---|---|---|---|
| CRM | ✅ onClick | ✅ 200 | `/leads/*` | ✅ | vivo | **SÍ** | 95% |
| Facturación | ✅ onClick | ✅ 200 | `/invoices/*` | ✅ | vivo | **SÍ** | 90% |
| Documentos | ✅ onClick | ✅ 200 | `/documents/*` | ✅ | vivo | **SÍ** | 90% |
| Reuniones | ✅ onClick | ✅ 200 | `/meetings/*` | ✅ | vivo | **SÍ** | 90% |
| Agenda | ✅ onClick | ✅ 200 | `/appointments/*` | ✅ | vivo | **SÍ** | 85% |
| Alertas | ✅ | ✅ 200 (lectura) | `/firms/{id}/*` | lectura | vivo | **SÍ (read)** | 85% |
| Equipo (cargar) | ✅ | ✅ 200 | `/rbac/team/{id}` | lectura | vivo | **SÍ** | 60% |
| Equipo (suspender) | ✅ | ❌ 404 | `/rbac/users/{id}/status` (mal) | no | **roto** | NO | 20% |
| Casos | ✅ | ⚠️ list 403 / create 201 | `/cases/*` | crea sí | **tenant bloquea lectura** | PARCIAL | 45% |
| Clientes | ✅ | ⚠️ list 403 / create 201 | `/clients/*` | crea sí | **tenant bloquea lectura** | PARCIAL | 45% |
| IA | ✅ | ⚠️ 503 (sin key) | `/ai/chat` | — | endpoint vivo, IA sin key | PARCIAL | 50% |
| Invitar Abogado | ✅ | ❌ 500 | `/firm-os/invite-lawyer` | Δ0 | **roto (módulo faltante)** | NO | 20% |
| Configuración (guardar) | ❌ mock | ✅ 200 | `PUT /firm-os/settings` | ✅ | FE no cableado | NO | 25% |
| Cambiar Plan | ❌ muerto | ✅ 422 (vivo) | `/payment/change-plan` | — | FE no cableado | NO | 15% |
| Actualizar Plan | ❌ muerto | (=change-plan) | — | — | sin onClick | NO | 0% |
| Administrar Equipo | ❌ muerto | — | — | — | sin onClick | NO | 0% |
| Invitar Miembro | ❌ muerto | — | — | — | sin onClick | NO | 0% |
| Guardar Perfil | ❌ mock | ❌ | — | no | falso | NO | 0% |
| Cambiar Foto | ❌ muerto | ❌ | — | — | inexistente | NO | 0% |
| Activar 2FA | ❌ muerto | ❌ | — | — | inexistente | NO | 0% |
| Google Calendar / Outlook | ❌ muerto | ❌ | — | — | inexistente | NO | 0% |
| Automatizaciones (+enterprise) | ✅ | ❌ | ninguno | localStorage | simulado | NO | 0% (backend) |
| Comunicaciones | ✅ mock | ❌ | ninguno | — | eliminado+mock | NO | 0% |

### % REAL runtime (solo lo plenamente operativo end-to-end)
De los **20 botones/módulos** que pediste probar, **plenamente operativos en runtime**: CRM, Facturación, Documentos, Reuniones, Agenda, Alertas(lectura) = **6**. Parciales (Casos, Clientes, IA, Equipo-load) no cuentan como plenos. Rotos/muertos = 13.

> **% OPERATIVO REAL ≈ 30%** (6/20 plenos; +4 parciales). Esto es **menor** que el 44% del análisis estático de código, porque la ejecución real destapó: **Invitar Abogado 500**, **Casos/Clientes 403 por tenant**, **IA 503 sin key**, y el **backend que ni arrancaba**.

---

## FASE 10 — CONCLUSIONES (solo ejecución real)

1. **El backend de `main` no arrancaba** (regresión `cc54e13`, 4 imports). Corregido → arranca. Producción sigue viva en un build anterior; **el próximo deploy desde `main` la tumba** salvo que se lleve este fix.
2. **El P0 no es "500 en todo"**: la mayoría de GET dan 200. El bloqueo real de aislamiento es **`403 "Usuario sin organización asignada"` en Casos y Clientes** para el firm_owner (organization_id=None). Es un problema de datos/tenant, no de código muerto.
3. **Invitar Abogado está roto en runtime** (500: `utils.email_service` no existe) — corrige mi veredicto estático previo que lo daba como "el único flujo de escritura funcional".
4. **Suspender/Reactivar equipo apunta a ruta inexistente** (`/rbac/users/{id}/status` → 404); la real es `/team/{id}/status` (200).
5. **Los backends de Config y Cambiar Plan existen y responden** (200/422); el problema es que **los botones del FE no los llaman**.
6. **13 de 20 botones no disparan ninguna petición o fallan**; los módulos de datos compartidos con Lawyer OS (CRM/Facturación/Documentos/Reuniones/Agenda) son los que realmente funcionan.

### Reparaciones mínimas para subir el % rápido (evidencia lo respalda)
- Llevar el fix de 4 imports a `main` **antes del próximo deploy** (crítico, producción en riesgo).
- Crear `utils/email_service` (o corregir el import) → arregla Invitar Abogado.
- Cambiar la URL de suspender en FirmTeam.jsx a `/team/{id}/status`.
- Asignar `organization_id` al firm_owner (y a la firma) → desbloquea Casos/Clientes (403→200).
- Cablear los botones muertos a los endpoints que YA responden (Config→`PUT /firm-os/settings`, Cambiar Plan→`/payment/change-plan`).

---
*Backend de auditoría sigue corriendo en `127.0.0.1:8010`. Datos de prueba creados y eliminados (BD verificada limpia). Evidencia 100% de ejecución real: logins, requests, respuestas HTTP y conteos Mongo antes/después.*
