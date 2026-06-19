# PUNTO CERO — AUDITORÍA DE IDOR Y AUTORIZACIÓN (FASE 2A.1)

**Proyecto:** Punto Cero Legal · Backend FastAPI + MongoDB
**Fecha:** 2026-06-11
**Alcance:** `backend/routes/` — 20 routers · 132 endpoints
**Tipo:** Auditoría read-only — **no se modificó código, no se crearon commits**

---

## RESUMEN EJECUTIVO

| Métrica | Valor |
|---------|------:|
| Endpoints totales | 132 |
| Protegidos con auth (`get_current_user`/`get_current_admin`/`get_admin`) | 47 |
| **Sin autenticación que operan sobre datos privados** | **~70** |
| Públicos por diseño (landing, webhooks, validación) | ~15 |
| Routers de negocio con **CERO** autenticación | **11 de 20** |

> **Hallazgo central:** El panel administrativo está correctamente protegido (admin, admin_ops, accounting: 100% con dependencia de admin). **Toda la superficie de datos de abogados y clientes (cases, documents, clients, leads, invoices, dashboard, ai, appointments, messages, meetings, portal) NO tiene autenticación** y deriva la identidad de parámetros enviados por el frontend (`lawyer_id`, `client_id`, `case_id`). Esto constituye un **IDOR sistémico CRÍTICO**: cualquiera con la URL del backend puede leer, modificar y borrar datos de cualquier abogado o cliente sin token.

---

## TAREA 1 — INVENTARIO DE ENDPOINTS Y AUTENTICACIÓN

> Todos los paths llevan el prefijo global `/api`. Leyenda Auth:
> ❌ **Ninguna** · ✅ `get_current_user` · 🛡️ `get_current_admin`/`get_admin` (admin)

### Routers de NEGOCIO (sin autenticación) — 🔴

| Método | Ruta | Auth | Roles | Archivo |
|--------|------|------|-------|---------|
| POST | /api/cases/ | ❌ | — | cases.py |
| GET | /api/cases/ | ❌ | — | cases.py |
| GET | /api/cases/{case_id} | ❌ | — | cases.py |
| GET | /api/cases/{case_id}/timeline | ❌ | — | cases.py |
| POST | /api/cases/{case_id}/timeline-entry | ❌ | — | cases.py |
| POST | /api/cases/{case_id}/send-timeline | ❌ | — | cases.py |
| POST | /api/cases/{case_id}/request-client-form | ❌ | — | cases.py |
| GET | /api/cases/form/{token} | ❌ (token) | — | cases.py |
| POST | /api/cases/form/{token} | ❌ (token) | — | cases.py |
| PATCH | /api/cases/{case_id} | ❌ | — | cases.py |
| POST | /api/cases/{case_id}/start-meeting | ❌ | — | cases.py |
| DELETE | /api/cases/{case_id} | ❌ | — | cases.py |
| GET | /api/documents/ | ❌ | — | documents.py |
| GET | /api/documents/storage/{lawyer_id} | ❌ | — | documents.py |
| GET | /api/documents/folders/{lawyer_id} | ❌ | — | documents.py |
| POST | /api/documents/ | ❌ | — | documents.py |
| POST | /api/documents/upload | ❌ | — | documents.py |
| GET | /api/documents/{document_id}/content | ❌ | — | documents.py |
| PATCH | /api/documents/{document_id} | ❌ | — | documents.py |
| DELETE | /api/documents/{document_id} | ❌ | — | documents.py |
| GET | /api/clients/ | ❌ | — | clients.py |
| POST | /api/clients/ | ❌ | — | clients.py |
| PATCH | /api/clients/{client_id} | ❌ | — | clients.py |
| DELETE | /api/clients/{client_id} | ❌ | — | clients.py |
| POST | /api/leads/ | ❌ | — | leads.py |
| GET | /api/leads/ | ❌ | — | leads.py |
| GET | /api/leads/{lead_id} | ❌ | — | leads.py |
| PATCH | /api/leads/{lead_id} | ❌ | — | leads.py |
| POST | /api/leads/{lead_id}/convert | ❌ | — | leads.py |
| DELETE | /api/leads/{lead_id} | ❌ | — | leads.py |
| GET | /api/invoices/ | ❌ | — | invoices.py |
| POST | /api/invoices/ | ❌ | — | invoices.py |
| PATCH | /api/invoices/{invoice_id} | ❌ | — | invoices.py |
| DELETE | /api/invoices/{invoice_id} | ❌ | — | invoices.py |
| POST | /api/invoices/{invoice_id}/attach-payment | ❌ | — | invoices.py |
| GET | /api/invoices/{invoice_id}/proof | ❌ | — | invoices.py |
| POST | /api/invoices/{invoice_id}/pay-link | ❌ | — | invoices.py |
| POST | /api/invoices/{invoice_id}/mark-paid | ❌ | — | invoices.py |
| POST | /api/invoices/webhook/mercadopago | ❌ (webhook) | — | invoices.py |
| GET | /api/dashboard/kpis/{lawyer_id} | ❌ | — | dashboard.py |
| GET | /api/dashboard/alerts/{lawyer_id} | ❌ | — | dashboard.py |
| GET | /api/dashboard/crm-report/{lawyer_id} | ❌ | — | dashboard.py |
| GET | /api/dashboard/notifications/{lawyer_id} | ❌ | — | dashboard.py |
| POST | /api/dashboard/notifications/{notification_id}/read | ❌ | — | dashboard.py |
| POST | /api/dashboard/notifications/{lawyer_id}/read-all | ❌ | — | dashboard.py |
| GET | /api/ai/usage/{lawyer_id} | ❌ | — | ai.py |
| POST | /api/ai/chat | ❌ | — | ai.py |
| GET | /api/ai/templates | ❌ (estático) | — | ai.py |
| POST | /api/appointments/ | ❌ | — | appointments.py |
| POST | /api/appointments/run-reminders | ❌ (cron) | — | appointments.py |
| GET | /api/appointments/ | ❌ | — | appointments.py |
| GET | /api/appointments/{appointment_id} | ❌ | — | appointments.py |
| PATCH | /api/appointments/{appointment_id} | ❌ | — | appointments.py |
| DELETE | /api/appointments/{appointment_id} | ❌ | — | appointments.py |
| POST | /api/meetings/ | ❌ | — | meetings.py |
| GET | /api/meetings/ | ❌ | — | meetings.py |
| GET | /api/meetings/{meeting_id} | ❌ | — | meetings.py |
| PATCH | /api/meetings/{meeting_id} | ❌ | — | meetings.py |
| POST | /api/meetings/{meeting_id}/complete | ❌ | — | meetings.py |
| POST | /api/messages/ | ❌ | — | messages.py |
| GET | /api/messages/ | ❌ | — | messages.py |
| PATCH | /api/messages/{message_id}/mark-read | ❌ | — | messages.py |
| GET | /api/portal/cases | ❌ | — | portal.py |
| GET | /api/portal/timeline/{case_id} | ❌ | — | portal.py |

### Routers PÚBLICOS por diseño — 🟢

| Método | Ruta | Auth | Archivo |
|--------|------|------|---------|
| POST | /api/public/case-intake | ❌ (público) | public_intake.py |
| POST | /api/public/lawyer-application | ❌ (público) | public_intake.py |
| GET | /api/webhook/whatsapp | ❌ (verify token) | chatbot.py |
| POST | /api/webhook/whatsapp | ❌ (webhook Meta) | chatbot.py |
| POST | /api/chatbot/simulate | ❌ | chatbot.py |
| GET | /api/chatbot/session/{case_id} | ❌ | chatbot.py |
| POST | /api/chatbot/run-followups | ❌ (cron) | chatbot.py |
| POST | /api/public/case/{case_id}/timeline-advance | ❌ | chatbot.py |
| GET | /api/referrals/validate/{code} | ❌ (público) | referrals.py |
| GET | /api/payment/detect-gateway | ❌ | payment.py |
| GET | /api/payment/methods | ❌ | payment.py |
| GET | /api/payment/catalog | ❌ | payment.py |
| GET | /api/payment/plans | ❌ | payment.py |
| POST | /api/payment/init | ❌ ⚠️ | payment.py |
| POST | /api/payment/confirm/{payment_id} | ❌ ⚠️ | payment.py |

### Routers AUTENTICADOS — ✅ / 🛡️

| Método | Ruta | Auth | Roles | Archivo |
|--------|------|------|-------|---------|
| GET | /api/auth/me | ✅ | cualquiera | auth.py |
| POST | /api/auth/register | ❌ (alta) | — | auth.py |
| POST | /api/auth/login | ❌ (login) | — | auth.py |
| GET | /api/referrals/my-code | ✅ | cualquiera | referrals.py |
| GET | /api/referrals/my-rewards | ✅ | cualquiera | referrals.py |
| GET | /api/referrals/notifications | ✅ | cualquiera | referrals.py |
| POST | /api/referrals/notifications/{id}/read | ✅ | cualquiera | referrals.py |
| POST | /api/payment/receipt | ✅ | cualquiera | payment.py |
| GET | /api/payment/my-plan | ✅ | cualquiera | payment.py |
| GET | /api/backup/manual | ✅ | cualquiera | backup.py |
| GET | /api/backup/status | ✅ | cualquiera | backup.py |
| POST | /api/backup/run-daily | ❌ (cron) | — | backup.py |
| GET | /api/admin/me | 🛡️ | admin | admin.py |
| GET | /api/admin/dashboard/general | 🛡️ | admin, admin_general | admin.py |
| GET | /api/admin/dashboard/comercial | 🛡️ | admin, admin_general, socio_comercial | admin.py |
| POST | /api/admin/payment-links | 🛡️ | admin, admin_general, socio_comercial | admin.py |
| GET | /api/admin/access-audit/pending | 🛡️ | admin | admin.py |
| POST | /api/admin/access-audit/{user_id}/approve | 🛡️ | admin, admin_general | admin.py |
| POST | /api/admin/access-audit/{user_id}/reject | 🛡️ | admin, admin_general | admin.py |
| (28 endpoints) | /api/admin-ops/** | 🛡️ | admin (algunos `require_admin_general`) | admin_ops.py |
| (6 endpoints) | /api/admin-ops/accounting/** | 🛡️ | admin | accounting.py |

> **admin_ops (28/28)**, **admin (7/7)** y **accounting (6/6)** aplican dependencia de admin en el 100% de sus endpoints. ✅

---

## TAREA 2 — ENDPOINTS QUE RECIBEN IDENTIDAD/RECURSO POR PARÁMETRO

| Endpoint | Parámetro | Cómo se usa | Riesgo |
|----------|-----------|-------------|--------|
| GET /api/cases/ | `lawyer_id`, `client_id` (query) | Filtra casos por dueño suministrado | 🔴 Lee casos ajenos |
| GET/PATCH/DELETE /api/cases/{case_id} | `case_id` (path) | Acceso directo por ID sin verificar dueño | 🔴 CRUD sobre caso ajeno |
| POST /api/cases/ | `lawyer_id` (body dict) | Asigna dueño del caso | 🔴 Crear caso a nombre de otro |
| GET /api/documents/ | `lawyer_id` (query) | Lista documentos del abogado | 🔴 Lee documentos ajenos |
| GET /api/documents/{id}/content | `document_id` (path) | Devuelve contenido cifrado + metadatos | 🔴 Exfiltración de documentos |
| GET /api/documents/storage|folders/{lawyer_id} | `lawyer_id` (path) | Métricas/carpetas del abogado | 🟠 Enumeración |
| GET /api/clients/ | `lawyer_id` (query) | Lista clientes del abogado | 🔴 Lee cartera de clientes ajena |
| PATCH/DELETE /api/clients/{client_id} | `client_id` (path) | Edita/borra cliente | 🔴 Modifica cliente ajeno |
| GET /api/leads/ | `lawyer_id` (query) | Lista leads (CRM) | 🔴 Lee pipeline comercial ajeno |
| PATCH/DELETE/convert /api/leads/{lead_id} | `lead_id` (path) | Edita/borra/convierte lead | 🔴 Modifica lead ajeno |
| GET /api/invoices/ | `lawyer_id` (query) | Lista facturas | 🔴 Lee facturación ajena |
| PATCH/DELETE /api/invoices/{invoice_id} | `invoice_id` (path) | Edita/borra/mark-paid factura | 🔴 Manipula facturación ajena |
| GET /api/dashboard/kpis|alerts|crm-report/{lawyer_id} | `lawyer_id` (path) | KPIs y reportes del abogado | 🔴 Espía métricas ajenas |
| GET /api/ai/usage/{lawyer_id} | `lawyer_id` (path) | Consumo de IA | 🟠 Enumeración de uso |
| POST /api/ai/chat | `lawyer_id` (body) | Imputa consumo/IA a un abogado | 🟠 Consumo a costa de otro |
| GET/POST/PATCH/DELETE /api/appointments | `lawyer_id`/`appointment_id` | Agenda del abogado | 🔴 CRUD agenda ajena |
| GET/PATCH /api/meetings | `lawyer_id`/`meeting_id` | Reuniones | 🔴 CRUD reuniones ajenas |
| GET/POST /api/messages | `user_id`/`message_id` | Mensajería | 🔴 Lee/marca mensajes ajenos |
| GET /api/portal/cases | `client_id` (query) | Casos del cliente | 🔴 Lee casos de cualquier cliente |
| GET /api/portal/timeline/{case_id} | `case_id`, `client_id` (query) | Timeline del caso | 🔴 Lee timeline de cualquier caso |

---

## TAREA 3 — IDENTIDAD PROVENIENTE DEL FRONTEND (listado completo)

Todos estos endpoints derivan la identidad del parámetro del cliente, **no** de `current_user`:

```
cases.py          → create_case(payload["lawyer_id"]), get_cases(lawyer_id, client_id),
                    get/patch/delete por case_id sin verificación de dueño
documents.py      → list/storage/folders(lawyer_id), content/edit/delete por document_id
clients.py        → list_clients(lawyer_id), update/delete por client_id
leads.py          → get_leads(lawyer_id), get/update/delete/convert por lead_id
invoices.py       → list_invoices(lawyer_id), update/delete/mark-paid/pay-link por invoice_id
dashboard.py      → kpis/alerts/crm-report/notifications(lawyer_id), read-all(lawyer_id)
ai.py             → get_ai_usage(lawyer_id), chat_with_ai(request.lawyer_id)
appointments.py   → get_appointments(lawyer_id), CRUD por appointment_id
meetings.py       → get_meetings(lawyer_id), CRUD por meeting_id
messages.py       → get_messages(user_id), create_message(...), mark-read por message_id
portal.py         → portal_cases(client_id), portal_timeline(case_id, client_id)
```

**Patrón observado (anti-patrón):**
```python
# ACTUAL (inseguro) — la identidad la pone el cliente
async def get_cases(lawyer_id: str = None, db = Depends(get_db)):
    return await db.cases.find({"lawyer_id": lawyer_id})

# DEBERÍA SER — la identidad sale del token
async def get_cases(current = Depends(get_current_user), db = Depends(get_db)):
    return await db.cases.find({"lawyer_id": str(current["_id"])})
```

> Refuerzo: la única barrera real hoy es `ProtectedRoute` en el **frontend**, que es trivialmente evadible llamando a la API directamente (curl/Postman). El backend **no es una frontera de confianza** para estos datos.

---

## TAREA 4 — VULNERABILIDADES IDOR CLASIFICADAS

### 🔴 CRÍTICO — leer / modificar / eliminar información ajena

- **cases**: `GET/PATCH/DELETE /cases/{case_id}` y `GET /cases/?lawyer_id=` → leer, editar y **borrar** cualquier caso legal. Incluye datos sensibles de clientes (descripción del caso, contacto).
- **documents**: `GET /documents/{id}/content` y `DELETE /documents/{id}` → **exfiltrar o borrar documentos**. (El cifrado ZK protege el contenido solo si la clave no viaja; los metadatos y el blob quedan expuestos.)
- **clients**: `GET /clients/?lawyer_id=`, `PATCH/DELETE /clients/{id}` → robar/alterar la cartera de clientes (PII: email, teléfono, dirección).
- **invoices**: `PATCH/DELETE/mark-paid /invoices/{id}` → manipular facturación (marcar pagada/impaga, borrar).
- **leads**: `PATCH/DELETE/convert /leads/{id}` → sabotear el pipeline comercial.
- **appointments / meetings / messages**: CRUD completo sobre agenda, reuniones y mensajería ajenas.
- **portal**: `GET /portal/cases?client_id=` y `/portal/timeline/{case_id}` → cualquiera consulta los casos de cualquier cliente cambiando el ID.

### 🟠 ALTO — consultar información sensible / recursos parcialmente protegidos

- **dashboard**: `kpis/alerts/crm-report/{lawyer_id}` → inteligencia de negocio ajena (ingresos, conversión, alertas).
- **documents**: `storage/folders/{lawyer_id}` → enumeración de estructura documental.
- **ai**: `usage/{lawyer_id}` + `POST /ai/chat` → enumerar consumo y **gastar cuota/IA a nombre de otro** (coste económico).
- **payment**: `POST /payment/confirm/{payment_id}` sin auth → marcar una transacción como `paid` (hoy mitigado porque el cobro real es por comprobante manual, pero permite ensuciar el estado de transacciones).

### 🟡 MEDIO — problemas indirectos de autorización

- **cases/form/{token}**: acceso por token sin caducidad verificada (revisar expiración/uso único del token).
- **SECRET_KEY** con fallback inseguro → si falta en el entorno, los JWT son falsificables (amplifica todo lo anterior).
- **register**: permite registrar rol `lawyer`/`client` libremente; el rol llega en el body de `UserCreate` (verificar que no se pueda auto-asignar `admin`).
- **CORS** `*` + `allow_credentials=True` (config) — facilita abuso desde sitios de terceros.

---

## TAREA 5 — MAPA DE CORRECCIÓN

> Patrón general de solución: introducir `Depends(get_current_user)` y **derivar el `owner_id` del token**, ignorando el parámetro del cliente. Para acceso por ID de recurso, **verificar pertenencia** (`recurso.lawyer_id == current.id`) antes de devolver/mutar.

### cases.py (todos los endpoints de dueño)
- **Problema:** identidad por `lawyer_id`/`case_id` sin verificar pertenencia.
- **Solución:** `current=Depends(get_current_user)`; en list, filtrar por `current["_id"]`; en `{case_id}`, cargar el caso y `403` si `case["lawyer_id"] != current["_id"]` (salvo rol admin).
- **Riesgo de romper funcionalidad:** 🟠 **Medio** — el frontend hoy envía `lawyer_id`; al cambiar, hay que quitar ese query param en las 7 páginas que lo usan (ya centralizadas vía `@/config/api`).

### documents.py
- **Problema:** lectura/borrado de documentos por ID sin dueño.
- **Solución:** auth + verificación de pertenencia del documento (vía `lawyer_id` o `case_id` del doc).
- **Riesgo:** 🟠 Medio.

### clients.py / leads.py / invoices.py
- **Problema:** CRUD por `{id}` sin verificar dueño; list por `lawyer_id` de query.
- **Solución:** auth + `owner == current`; list filtrado por token.
- **Riesgo:** 🟢 Bajo-Medio (patrón homogéneo, fácil de aplicar).

### dashboard.py / ai.py
- **Problema:** reportes y consumo por `{lawyer_id}` de path.
- **Solución:** eliminar `lawyer_id` del path; usar `current["_id"]`.
- **Riesgo:** 🟠 Medio — cambia la firma de la ruta (el frontend debe dejar de pasar el id).

### appointments.py / meetings.py / messages.py
- **Problema:** CRUD por `lawyer_id`/`{id}` sin auth.
- **Solución:** auth + pertenencia.
- **Riesgo:** 🟢 Bajo (módulos pequeños).

### portal.py
- **Problema:** `client_id` por query → cualquiera ve casos de cualquier cliente.
- **Solución:** requiere repensar el modelo de acceso del cliente (token de cliente o magic-link firmado por `case_id`). 
- **Riesgo:** 🔴 **Alto** — el portal hoy no tiene login de cliente; corregirlo implica diseñar autenticación de clientes (tokens/links firmados).

### payment.py confirm
- **Problema:** `confirm/{payment_id}` público marca `paid`.
- **Solución:** restringir a webhook firmado del proveedor real (cuando se integre PayPal/MP) o a admin.
- **Riesgo:** 🟢 Bajo (hoy es simulado).

### Transversal (habilitadores)
- `SECRET_KEY` obligatorio (fail-fast). **Riesgo:** 🟢 Bajo.
- `CORS_ORIGINS` = URL de Vercel. **Riesgo:** 🟢 Bajo.
- `register`: forzar rol no-privilegiado en alta pública. **Riesgo:** 🟢 Bajo.

---

## TAREA 6 — TABLA FINAL PRIORIZADA (de más a menos peligroso)

| # | Prioridad | Endpoint(s) | Riesgo | Acción |
|---|-----------|-------------|--------|--------|
| 1 | 🔴 P0 | DELETE/PATCH /cases/{id}, /clients/{id}, /invoices/{id}, /documents/{id} | CRÍTICO — borra/edita datos ajenos | Auth + verificación de pertenencia |
| 2 | 🔴 P0 | GET /documents/{id}/content | CRÍTICO — exfiltración de documentos | Auth + pertenencia |
| 3 | 🔴 P0 | GET /portal/cases?client_id, /portal/timeline/{case_id} | CRÍTICO — datos de cualquier cliente | Diseñar auth de cliente (token/link firmado) |
| 4 | 🔴 P0 | GET /cases/, /clients/, /leads/, /invoices/ (?lawyer_id) | CRÍTICO — lee datos ajenos | Filtrar por token, ignorar query |
| 5 | 🔴 P1 | POST /cases/, /leads/, /clients/, /invoices/ | CRÍTICO — crea a nombre de otro | owner = current["_id"] |
| 6 | 🔴 P1 | CRUD /appointments, /meetings, /messages | CRÍTICO — agenda/mensajería ajena | Auth + pertenencia |
| 7 | 🟠 P1 | GET /dashboard/{kpis,alerts,crm-report}/{lawyer_id} | ALTO — BI ajena | Quitar lawyer_id del path; usar token |
| 8 | 🟠 P2 | POST /ai/chat, GET /ai/usage/{lawyer_id} | ALTO — coste/cuota ajena | Auth + imputar a current |
| 9 | 🟠 P2 | POST /payment/confirm/{payment_id} | ALTO — marca pagado | Webhook firmado / admin |
| 10 | 🟡 P2 | cases/form/{token} | MEDIO — token sin caducidad clara | Expiración + uso único |
| 11 | 🟡 P3 | SECRET_KEY fallback, CORS `*`, register rol | MEDIO — habilitadores | Fail-fast + origin fijo + rol forzado |

---

## CONCLUSIÓN

El sistema tiene **dos mitades de seguridad opuestas**:

- ✅ **Panel administrativo** (admin, admin_ops, accounting): autenticación y RBAC **correctos al 100%**.
- 🔴 **Plataforma de abogados/clientes** (11 routers, ~63 endpoints): **sin autenticación**, identidad tomada del cliente → **IDOR sistémico CRÍTICO**.

**Recomendación de secuencia (Fase 2A.2, cuando se autoricen cambios):**
1. Crear dependencia reutilizable `get_current_user` ya existente → aplicarla router por router (P0 → P3).
2. Añadir verificación de pertenencia (`owner == current`) en accesos por `{id}`.
3. Rediseñar el acceso del **portal de clientes** (es el más complejo: hoy no hay login de cliente).
4. Endurecer habilitadores (`SECRET_KEY`, CORS, rol en `register`).
5. Cubrir con tests (`tests/test_auth_rbac.py` ya existe como base) **antes** de tocar el frontend, que deberá dejar de enviar `lawyer_id`/`client_id`.

> **No realizar la corrección en un solo cambio masivo:** el frontend depende hoy de estos parámetros en ~16 archivos. La migración debe ser router-por-router con su contraparte de frontend y pruebas de regresión.

---

*Documento generado en modo auditoría. No se modificó ningún archivo, no se crearon commits, no se implementaron cambios.*
