# PRODUCTION_BLOCKERS_FINAL.md
## Bloqueadores de producción — radiografía operativa final (evidencia de ejecución real)
Ordenados por severidad/impacto para Go-Live. Cada bloqueador con formato completo. NO se reparó nada (solo evidencia).

---

### 🔴 P0-1 · El backend de `main` no arranca (regresión)
- **Estado:** CRÍTICO / activo en `main`.
- **Prioridad:** máxima.
- **Causa raíz:** commit `cc54e13` añadió `Depends(get_current_user)` a meetings/documents/ai/chatbot sin importar el símbolo → `NameError` al importar. `py_compile` no lo detecta.
- **Evidencia:** 1er `uvicorn` abortó con `NameError: get_current_user` (meetings.py:17); `GET /api/ -> 000`. Tras añadir 4 imports (fix local, no commiteado) → arranca `GET /api/ -> 200`.
- **Endpoint/HTTP:** todos (server caído).
- **Archivo:línea:** routes/meetings.py:17, documents.py, ai.py, chatbot.py.
- **Impacto:** el próximo deploy del backend desde `main` tumba producción. (Producción Render está viva con build ANTERIOR: `GET onrender.com/api/ -> 200`.)
- **Horas:** 0.2 (4 imports). **Riesgo:** bajo (fix mecánico); alto si no se aplica antes del deploy.

---

### 🔴 P0-2 · Aislamiento roto: Casos y Clientes 403 para todos
- **Estado:** CRÍTICO.
- **Prioridad:** máxima (bloquea el core de un despacho: ver casos/clientes).
- **Causa raíz:** `organization_id = None` en todos los usuarios; los GET exigen organización.
- **Evidencia:** `GET /cases/?lawyer_id` y `GET /clients/?lawyer_id` → **403 "Usuario sin organización asignada"** para LAWYER y FIRM.
- **Endpoint/HTTP:** GET /api/cases/, /api/clients/ → 403.
- **Archivo:línea:** cases.py:262, clients.py:90.
- **Impacto:** ningún usuario puede LISTAR casos/clientes. Asimetría grave: `POST` sí crea (201) → datos entran pero no se pueden leer.
- **Horas:** 6 (asignar organization_id en registro/seed + revisar guard de escritura). **Riesgo:** medio (toca tenant; no modificar el kernel).

---

### 🔴 P0-3 · Invitar Abogado — 500 (módulo inexistente)
- **Estado:** CRÍTICO (única vía de crecimiento de la firma).
- **Causa raíz:** `from utils.email_service import send_email` — `utils/email_service.py` **no existe** (solo `utils/notifier.py`).
- **Evidencia:** `POST /firm-os/invite-lawyer -> 500 "No module named 'utils.email_service'"`, `Δlawyer_invitations = 0`.
- **Endpoint/HTTP:** POST /api/firm-os/invite-lawyer → 500.
- **Archivo:línea:** firm_os.py:513 (y 201, 258).
- **Impacto:** no se puede invitar abogados; la invitación no persiste.
- **Horas:** 3 (crear módulo o cambiar import a `utils.notifier`). **Riesgo:** bajo.

---

### 🟠 P1-1 · 14 botones no operativos (10 muertos + 4 rotos)
- **Estado:** MAYOR.
- **Evidencia:** ver BUTTON_BY_BUTTON_REPORT. Muertos sin onClick: Actualizar Plan, Administrar Equipo, Invitar Miembro, Guardar Perfil, Guardar Despacho, Cambiar Foto, Activar 2FA, Cambiar Plan, Google Calendar, Outlook. Rotos: Invitar Abogado (500), Suspender (404), Casos/Clientes listar (403).
- **Impacto:** la UI aparenta funciones que no existen (riesgo comercial/legal).
- **Horas:** ~30 agregadas. **Riesgo:** medio.

---

### 🟠 P1-2 · Suspender/Reactivar equipo apunta a ruta inexistente
- **Estado:** MAYOR. **Causa raíz:** FE llama `PATCH /rbac/users/{id}/status` (no existe); la real es `PATCH /team/{id}/status`.
- **Evidencia:** 404 (FE) vs 200 (real). **Archivo:** FirmTeam.jsx:81,107 vs team.py:17.
- **Horas:** 1. **Riesgo:** bajo.

---

### 🟠 P1-3 · Persistencia falsa en Perfil/Configuración
- **Estado:** MAYOR. **Causa raíz:** `handleSave` solo cambia estado React (SettingsPage.jsx:57-60); backend `PUT /firm-os/settings` existe (200) pero no se llama.
- **Evidencia:** guardar perfil/despacho → 0 HTTP, 0 Mongo; `PUT /firm-os/settings -> 200 modified_count:1` cuando se llama directo.
- **Horas:** 12. **Riesgo:** bajo.

---

### 🟡 P2-1 · Billing/Suscripciones OS exigen X-Tenant-ID no enviado
- **Estado:** MEDIO. **Evidencia:** `GET /billing/`, `/subscriptions/` → **400 "Falta X-Tenant-ID"**. **Archivo:** billing.py/subscriptions.py + dependencia de tenant-context.
- **Impacto:** sistema de billing OS inalcanzable desde el FE (existe paralelo `invoices.py` que sí funciona).
- **Horas:** 4. **Riesgo:** medio.

---

### 🟡 P2-2 · IA Jurídica 503 (sin API key)
- **Estado:** MEDIO (config, no código). **Evidencia:** `POST /ai/chat -> 503 "Gemini sin clave/caído"`. **Archivo:** ai.py:217.
- **Impacto:** IA no responde sin `GEMINI_API_KEY`/`ANTHROPIC_API_KEY`. En prod con key debe verificarse.
- **Horas:** 0.5 (config) + verificación. **Riesgo:** bajo.

---

### 🟡 P2-3 · Client Portal requiere parámetro
- **Estado:** MEDIO. **Evidencia:** `GET /portal/cases -> 422 Field required` (falta client_id/email). **Archivo:** portal.py.
- **Horas:** 3. **Riesgo:** bajo.

---

### 🟢 P3 · Higiene / no bloqueantes
- No hay refresh token (`/auth/refresh` 404): re-login al expirar. Horas: 8.
- `chatbot.py:555` usa HTTPException sin import (bug latente en endpoints chatbot). Horas: 0.1.
- Clúster Enterprise/Automatización solo localStorage (sin backend): decidir ocultar o reconstruir. Horas: 40+.
- Módulos huérfanos/eliminados (Communication, FirmSettings, Structure…): limpiar o reconectar. Ver DISCONNECTED_MODULES_REPORT.

---

## VEREDICTO GO-LIVE
**NO-GO** hasta cerrar P0-1/2/3.
- Lo que YA funciona en runtime (🟢): CRM (CRUD persistente verificado), Agenda, Facturación (invoices), Documentos, Reuniones, KPIs/Notificaciones, Admin dashboard, Equipo (carga).
- **% operativo real** (módulos plenamente funcionales end-to-end sobre los probados) ≈ **30-35%**. Los 3 P0 (arranque, aislamiento casos/clientes, invitar abogado) son baratos en horas (~9h) pero **imprescindibles** para vender/operar.

**Orden recomendado de cierre:** P0-1 (llevar fix a main antes de deploy) → P0-2 (organization_id) → P0-3 (email_service) → P1-2 (URL suspender) → P1-3 (persistencia perfil/config) → P2 (billing/IA/portal). Fecha de este análisis: 2026-07-15.
