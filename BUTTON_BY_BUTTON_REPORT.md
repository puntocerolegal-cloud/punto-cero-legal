# BUTTON_BY_BUTTON_REPORT.md
## Prueba botón por botón — Firm OS + módulos compartidos (ejecución real capa HTTP)

**Método:** para cada botón con handler se disparó su petición HTTP real (JWT firm_owner). Para botones sin `onClick` se verifica estáticamente la ausencia de handler → **no dispara ninguna petición** (evidencia de línea). Clicks DOM no automatizados (sin Playwright); la capa HTTP es donde se determina la acción real.

Leyenda: 🟢 Funciona · 🟡 Parcial · 🔴 No funciona.

---

### 🔴 BOTONES MUERTOS (sin onClick → NO disparan request)

| # | Botón | Pantalla | Acción esperada | Acción real | HTTP | Archivo responsable | Backend que servía | Horas |
|---|---|---|---|---|---|---|---|---|
| 1 | Actualizar Plan | Dashboard Firm | ir a upgrade/checkout | nada | — (sin request) | FirmDashboard.jsx:136-138 | `/payment/change-plan` (existe, 422) | 2 |
| 2 | Administrar Equipo | Dashboard Firm | ir a /team | nada | — | FirmDashboard.jsx:149-151 | — | 1 |
| 3 | Invitar Miembro | Equipo | abrir modal invitar | nada | — | FirmTeam.jsx:182-185 | `/firm-os/invite-lawyer` (roto 500) | 3 |
| 4 | Guardar Perfil | Configuración | persistir perfil | Toast falso, sin HTTP | — | SettingsPage.jsx:122 (handler :57-60) | ninguno (no existe) | 8 |
| 5 | Guardar Despacho | Configuración | persistir despacho | Toast falso | — | SettingsPage.jsx:185 | `PUT /firm-os/settings` (existe, 200) | 4 |
| 6 | Cambiar Foto | Configuración | subir avatar | nada | — | SettingsPage.jsx:92 | ninguno | 8 |
| 7 | Activar 2FA | Configuración | activar 2FA | nada | — | SettingsPage.jsx:152 | ninguno | 16 |
| 8 | Cambiar Plan | Configuración | cambiar plan | nada | — | SettingsPage.jsx:203 | `/payment/change-plan` (existe, 422) | 2 |
| 9 | Conectar Google Calendar | Config/Agenda | OAuth Google | nada | — | SettingsPage.jsx:239-249 / AgendaPage.jsx:196 | ninguno | 24 |
| 10 | Conectar Outlook | Configuración | OAuth Outlook | nada | — | SettingsPage.jsx:240 | ninguno | 24 |

*Persistencia Mongo de todos: NINGUNA. Error JS: ninguno (no hay handler). Error backend: n/a (no se llama).*

---

### 🔴 BOTONES CON HANDLER PERO ROTOS

| # | Botón | Pantalla | HTTP real | Código | Respuesta | Mongo | Causa raíz | Archivo:línea | Horas |
|---|---|---|---|---|---|---|---|---|---|
| 11 | Invitar Abogado | Control de Abogados | `POST /firm-os/invite-lawyer` | **500** | `No module named 'utils.email_service'` | Δ0 | import de módulo inexistente | firm_os.py:513 (falta `utils/email_service.py`) | 3 |
| 12 | Suspender/Reactivar miembro | Equipo | `PATCH /rbac/users/{id}/status` | **404** | `Not Found` | Δ0 | el FE llama ruta inexistente; la real es `/team/{id}/status` (200) | FirmTeam.jsx:81,107 vs team.py:17 | 1 |
| 13 | Listar Casos | Casos | `GET /cases/?lawyer_id` | **403** | `Usuario sin organización asignada` | — | usuario sin organization_id | cases.py:262 | 6 |
| 14 | Listar Clientes | Clientes | `GET /clients/?lawyer_id` | **403** | `Usuario sin organización asignada` | — | usuario sin organization_id | clients.py:90 | 6 |

---

### 🟡 BOTONES PARCIALES

| # | Botón | Pantalla | HTTP real | Código | Detalle | Archivo:línea | Horas |
|---|---|---|---|---|---|---|---|
| 15 | Enviar (IA Jurídica) | IA | `POST /ai/chat` | **503** | endpoint vivo; Gemini sin API key en entorno (en prod con key podría responder) | ai.py:217 | 2 (config) |
| 16 | Ver Facturación (OS billing) | Billing | `GET /billing/` | **400** | requiere header `X-Tenant-ID` que el FE no envía | billing.py + tenant-context dep | 4 |
| 17 | Suscripción (OS) | Suscripción | `GET /subscriptions/` | **400** | requiere `X-Tenant-ID` | subscriptions.py | 4 |
| 18 | Portal cliente | Client Portal | `GET /portal/cases` | **422** | requiere parámetro (client_id/email) no enviado | portal.py | 3 |

---

### 🟢 BOTONES QUE FUNCIONAN (HTTP real OK + persistencia donde aplica)

| # | Botón | Pantalla | HTTP real | Código | Mongo | Archivo:línea |
|---|---|---|---|---|---|---|
| 19 | Nuevo Cliente/Lead (CRM) | CRM | `POST /leads/` | **201** | **Δ+1 (persiste, ver MONGODB_PERSISTENCE)** | CRMPage.jsx:84 |
| 20 | Eliminar Lead (CRM) | CRM | `DELETE /leads/{id}` | **204** | **Δ-1** | CRMPage.jsx:95 |
| 21 | Crear Caso | Casos | `POST /cases/` | **201** | Δ+1 (CAS-2026-*) | CasesPage.jsx:85 |
| 22 | Crear Cliente | Clientes | `POST /clients/` | **201** | Δ+1 | ClientsPage.jsx:96 |
| 23 | Listar/Crear Agenda | Agenda | `GET /appointments/` 200; `POST` vivo (422 valida) | 200 | lectura | AgendaPage.jsx:51,82 |
| 24 | Listar/Crear Reuniones | Reuniones | `GET /meetings/` 200; `POST` vivo | 200 | lectura | MeetingsPage.jsx:51,108 |
| 25 | Listar/Crear Facturas | Facturación | `GET /invoices/` 200; `POST` vivo (422 valida) | 200 | lectura | InvoicesPage.jsx:39,57 |
| 26 | Documentos listar | Documentos | `GET /documents/` | 200 | lectura | DocumentsPage.jsx:45 |
| 27 | Cargar Equipo | Equipo | `GET /rbac/team/{firm}` | 200 | lectura | FirmTeam.jsx:39 |
| 28 | Guardar Config (backend real) | — | `PUT /firm-os/settings` | 200 (modified_count:1) | Δ persiste | firm_os.py:133 *(⚠ el botón del FE está muerto, #5)* |
| 29 | Admin dashboard | Admin | `GET /admin/dashboard/general|comercial` | 200 | datos reales | admin.py |
| 30 | Notificaciones | Dashboard | `GET /dashboard/notifications/{id}` | 200 | datos reales | dashboard.py |

**Descargar PDF factura:** generación **client-side** (`InvoicesPage.jsx:141` `printInvoice` → `window` HTML), **sin endpoint** — no verificable por HTTP; funciona en navegador (no automatizado). Estado: 🟡 (no server).

---

### CONTEO
- 🟢 Funciona: **12** (CRM CRUD, Casos/Clientes crear, Agenda, Reuniones, Facturas listar, Documentos, Equipo cargar, Admin, Notificaciones, Config-backend).
- 🟡 Parcial: **5** (IA, Billing, Subscriptions, Portal, PDF).
- 🔴 No funciona: **14** (10 muertos + 4 rotos).
