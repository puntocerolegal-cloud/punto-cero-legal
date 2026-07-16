# DYNAMIC_RUNTIME_AUDIT.md
## Auditoría Dinámica Operativa — Punto Cero Legal (ejecución real)
Fecha: 2026-07-15 · Backend: `uvicorn server:app @ 127.0.0.1:8010` · Mongo: `localhost:27017/puntocero_legal` (89 users, 36 colecciones, 293 rutas).

**Método.** 100% ejecución real: uvicorn + Mongo + logins HTTP + peticiones con JWT real + conteos Mongo antes/después. **Bloqueo de método declarado:** no hay Playwright/Puppeteer instalado → **no se automatizaron clicks DOM**. Se ejecutó **la petición HTTP exacta que dispara cada handler** (capa donde se decide la persistencia real) y para botones sin `onClick` se registra "no dispara request" con evidencia estática de línea. **Siguiente paso para clicks DOM:** `npm i -D @playwright/test && npx playwright install chromium`, servir el frontend apuntando a `:8010`, y guionar los flujos. NO se instaló porque FASE 10 prohíbe modificar archivos.

**Restricción cumplida:** no se reparó, escribió código de negocio ni commiteó nada. Solo se generaron los 6 informes. Datos de prueba creados con marca `[AUDIT]`/`@example.com` y **eliminados** (verificado).

---

## FASE 1 — ARRANQUE ✅
| Check | Resultado | Evidencia |
|---|---|---|
| Backend inicia | ✅ | `Application startup complete` / `Uvicorn running on 127.0.0.1:8010` |
| Mongo conecta | ✅ | `MongoDB client initialized` · indexes creados · cuentas oficiales verificadas |
| Swagger responde | ✅ | `GET /docs -> 200` · `/openapi.json -> 200` (293 paths) |
| API responde | ✅ | `GET /api/ -> 200 (0.001s)` |
| JWT funciona | ✅ | tokens HS256 válidos, `GET /auth/me -> 200` con Bearer |
| Login funciona | ✅ | 4/4 roles `POST /auth/login -> 200` |

---

## FASE 2 — LOGIN / JWT / TENANT
| Rol | HTTP | role (claim) | firm_id | organization_id | /auth/me |
|---|---|---|---|---|---|
| ADMIN (darwin@) | 200 | admin_general | None | None | 200 |
| LAWYER (abogado@) | 200 | lawyer | None | None | 200 |
| FIRM (firma@) | 200 | firm_owner | **6a525041524d422c4157c6b6** | None | 200 |
| CLIENT (client@) | 200 | client | None | None | 200 |

**Hallazgos:**
- El **JWT solo contiene `sub`+`role`+`exp`** (sin firm_id/tenant). El tenant se re-deriva de BD en `get_current_user`.
- **NO existe refresh token:** `POST /api/auth/refresh -> 404`. Solo access token (exp ~7 días). Riesgo de sesión: al expirar, re-login obligatorio.
- **`organization_id = None` en TODOS los usuarios**, incluido firm_owner → causa raíz del bloqueo 403 de Casos/Clientes (ver abajo).

---

## FASE 3 — RECORRIDO POR MÓDULO (alcanzabilidad runtime)

| Módulo | Rol | Endpoint | HTTP | Estado |
|---|---|---|---|---|
| Admin · Panel | ADMIN | `GET /admin/me`, `/admin/dashboard/general`, `/admin/dashboard/comercial` | 200 / 200 / 200 | 🟢 datos reales (mrr 39.105.000, 395 users, pipeline) |
| CRM (leads) | LAWYER/FIRM | `GET /leads/?lawyer_id` | 200 | 🟢 |
| **Casos** | LAWYER/FIRM | `GET /cases/?lawyer_id` | **403** `sin organización` | 🔴 bloqueado (cases.py:262) |
| **Clientes** | LAWYER/FIRM | `GET /clients/?lawyer_id` | **403** `sin organización` | 🔴 bloqueado (clients.py:90) |
| Agenda | LAWYER | `GET /appointments/?lawyer_id` | 200 | 🟢 |
| Facturación | LAWYER/FIRM | `GET /invoices/?lawyer_id` | 200 | 🟢 |
| Documentos | LAWYER | `GET /documents/?lawyer_id` | 200 | 🟢 |
| Dashboard KPIs | LAWYER | `GET /dashboard/kpis/{id}` | 200 | 🟢 datos reales |
| Notificaciones | LAWYER | `GET /dashboard/notifications/{id}` | 200 | 🟢 datos reales (agenda_event) |
| IA usage | LAWYER/FIRM | `GET /ai/usage/{id}` | 200 | 🟢 |
| Firm · datos | FIRM | `GET /firms/{firm}/lawyers|cases|financial` | 200 | 🟢 (data vacía, count 0) |
| Equipo | FIRM | `GET /rbac/team/{firm}` | 200 | 🟢 |
| Config | FIRM | `GET /firm-os/settings` | 200 | 🟢 |
| Plan | FIRM | `GET /payment/my-plan`, `/payment/catalog` | 200 | 🟢 |
| **Billing (OS)** | FIRM | `GET /billing/` | **400** `Falta X-Tenant-ID` | 🟡 requiere header no enviado por FE |
| **Suscripciones (OS)** | FIRM | `GET /subscriptions/` | **400** `Falta X-Tenant-ID` | 🟡 requiere header |
| **Client Portal** | CLIENT | `GET /portal/cases` | **422** `Field required` | 🟡 requiere parámetro |
| IA chat | FIRM | `POST /ai/chat` | **503** `Gemini sin clave` | 🟡 endpoint vivo, sin API key en entorno |
| Automatizaciones | FIRM | (ningún backend) | — | 🔴 solo localStorage |
| Comunicaciones | FIRM | (ruta eliminada) | — | 🔴 ver DISCONNECTED_MODULES_REPORT |

**Resumen operativo runtime:** de los módulos de datos, los compartidos con Lawyer OS (CRM, Agenda, Facturación, Documentos, KPIs, Notificaciones) responden 200. Los bloqueos reales: **Casos/Clientes 403 (org)**, **Billing/Subscriptions 400 (X-Tenant-ID)**, **Portal 422 (param)**, **IA 503 (key)**. Ver informes específicos.

Detalle completo en: `BUTTON_BY_BUTTON_REPORT.md`, `HTTP_TRACE_REPORT.md`, `MONGODB_PERSISTENCE_REPORT.md`, `DISCONNECTED_MODULES_REPORT.md`, `PRODUCTION_BLOCKERS_FINAL.md`.
