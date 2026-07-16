# MONGODB_PERSISTENCE_REPORT.md
## Verificación de persistencia real en MongoDB — ejecución 2026-07-15
DB: `mongodb://localhost:27017/puntocero_legal` (36 colecciones, 89 users). Método: conteo de documentos **antes/después** de cada operación + re-fetch por HTTP + consulta directa a Mongo. "No basta el Toast."

---

## 1. PRUEBA DE PERSISTENCIA END-TO-END (CRM lead) — ✅ PERSISTE REAL

| Paso | Acción | Resultado | Evidencia |
|---|---|---|---|
| 1 | `POST /api/leads/` (email `persist_audit@example.com`) | **201** | `Δleads = +1` |
| 2 | `GET /api/leads/?lawyer_id=…` (nueva petición) | lead presente | `re-fetch aparece: True` → **persiste tras nueva request, no es estado React** |
| 3 | Consulta directa Mongo `db.leads.count({client_email})` | **1** | confirmado en la colección |
| 4 | `DELETE /api/leads/{id}` | **204** | `Δleads = -1` |
| 5 | Mongo tras delete | **0** | ciclo CRUD completo verificado |

**Conclusión:** el CRM escribe, lee y borra **realmente** en Mongo. No es simulación.

---

## 2. OPERACIONES QUE SÍ PERSISTEN (Δ Mongo verificado)

| Operación | Endpoint | Colección | Δ | Nota |
|---|---|---|---|---|
| Crear lead | POST /leads/ | leads | +1 | ✅ + borrado -1 |
| Crear caso | POST /cases/ | cases | +1 | ✅ (CAS-2026-005; auto-crea client) |
| Crear cliente | POST /clients/ | clients | +1 | ✅ |
| Cambiar estado usuario (ruta real) | PATCH /team/{id}/status | users | modificado | ✅ `status→ACTIVE` |
| Guardar config firma | PUT /firm-os/settings | firm_settings | modified_count:1 | ✅ backend persiste (⚠ botón FE muerto) |

*Todos los datos de prueba fueron eliminados; BD restaurada (verificado 0 restantes).*

---

## 3. OPERACIONES QUE NO PERSISTEN (Toast falso o error)

| "Acción" | Qué ocurre realmente | Persistencia |
|---|---|---|
| Guardar Perfil (SettingsPage) | `handleSave` solo hace `setSaved(true)` 2s (SettingsPage.jsx:57-60) | ❌ **cero HTTP, cero Mongo** |
| Guardar Despacho | mismo `handleSave` falso; inputs sin `value/onChange` | ❌ (el backend `PUT /firm-os/settings` existe pero el botón no lo llama) |
| Invitar Abogado | `POST /firm-os/invite-lawyer` → 500 | ❌ `Δlawyer_invitations = 0` (no inserta) |
| Suspender miembro (ruta FE) | `PATCH /rbac/users/{id}/status` → 404 | ❌ no modifica |
| Activar 2FA / Cambiar Foto / Cambiar Plan / Calendar | sin onClick | ❌ no dispara nada |

---

## 4. HALLAZGO DE AISLAMIENTO (multi-tenant)

- **`organization_id = None` en todos los usuarios** (incl. firm_owner). Verificado en Mongo y en respuesta de login.
- `GET /cases/` y `GET /clients/` exigen organization_id → **403** (cases.py:262, clients.py:90). **La LECTURA de casos/clientes está bloqueada para todos los roles probados.**
- Asimetría: `POST /cases/` y `POST /clients/` **sí crean (201)** — los endpoints de escritura **no** aplican el guard de organización que sí aplican los de lectura. Inconsistencia de seguridad/tenant.
- `firms/{firm}/cases|clients|lawyers` (usados por el dashboard) devuelven 200 pero **count 0**: leen por `lawyer_id` pertenecientes a la firma y ésta no tiene miembros/datos vinculados.

---

## 5. ESTADO DE COLECCIONES (muestra relevante)
36 colecciones presentes, incluidas: `users`(89), `firms`, `firm_settings`, `firm_configurations`, `lawyer_invitations`, `leads`, `cases`, `clients`, `documents`, `appointments`, `meetings`, `invoices`, `transactions`, `ai_sessions`, `ai_usage`, `notifications`, `roles`, `permissions`, `organizations`. **Nota:** `firm_os.py` cuenta sobre colecciones propias (`firm_lawyers/firm_clients/firm_cases`) distintas de las operativas (`cases/clients/users`) — el dashboard `firm_os/dashboard` mostraría 0 aunque hubiera datos en las colecciones estándar.
