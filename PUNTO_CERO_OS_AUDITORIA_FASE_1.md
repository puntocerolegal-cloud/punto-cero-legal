# PUNTO CERO OS — AUDITORÍA FASE 1

**Proyecto:** Punto Cero Legal
**Fecha:** 2026-06-11
**Tipo:** Auditoría arquitectónica y de seguridad (read-only — sin cambios de código)
**Estado del sistema:** Desplegado y operativo (Vercel + Render)

---

> ## ⚠️ Corrección de premisa
> El contexto declara *React 19 + CRA/CRACO + React Router 7* (frontend) y *FastAPI + MongoDB + JWT* (backend) — **esto es correcto**.
> Sin embargo, prompts previos de esta misma iniciativa asumieron **Next.js / TypeScript / Supabase**, que **no existen** en este repositorio. Toda esta auditoría se basa exclusivamente en el código real verificado.

---

## 1. MAPA COMPLETO DEL SISTEMA

### Diagrama jerárquico

```
punto-cero-legal/  (monorepo)
│
├── frontend/                         React 19 · CRA 5 · CRACO · Tailwind
│   ├── craco.config.js               alias "@"→src · carga de env por precedencia
│   ├── vercel.json                   framework: create-react-app
│   ├── .npmrc                        legacy-peer-deps (React 19 vs react-day-picker 8)
│   └── src/
│       ├── App.js                    BrowserRouter · 19 rutas · AuthProvider
│       ├── config/
│       │   └── api.js                ★ PUNTO ÚNICO de URL backend (guard anti-localhost)
│       ├── contexts/
│       │   └── AuthContext.jsx       sesión JWT · login/register/logout/refreshUser
│       ├── components/
│       │   ├── ProtectedRoute.jsx    gating por rol + verificación (frontend)
│       │   ├── DashboardLayout.jsx   layout + NotificationBell
│       │   └── ui/                   ~45 componentes Radix/shadcn
│       ├── hooks/
│       │   └── use-toast.js
│       ├── lib/
│       │   ├── utils.js              cn() + getErrorMessage() (i18n de errores)
│       │   └── zkcrypto.js           cifrado zero-knowledge de documentos (cliente)
│       ├── mock/data.js
│       └── pages/                    Landing, Login, Register, Verificación,
│           ├── (públicas/auth)       Checkout, Portal, AdminPanel
│           └── dashboard/            CRM, Cases, Clients, Agenda, AI, Meetings,
│                                     Invoices, Documents, Settings
│
└── backend/                          FastAPI · MongoDB (motor async)
    ├── server.py                     app + APIRouter("/api") · CORS · 20 routers
    │                                 · init de cuentas maestras en startup
    ├── render.yaml / requirements.txt
    ├── utils/
    │   ├── auth.py                   JWT HS256 · bcrypt · 24h expiry
    │   ├── notifier.py               WhatsApp/Meta + SMTP
    │   ├── drive_service.py          Google Drive (backups/docs)
    │   └── case_number_generator.py  contador atómico
    ├── models/                       10 modelos Pydantic
    └── routes/                       20 routers · 132 endpoints
```

### Inventario de routers FastAPI (132 endpoints)

| Router | Líneas | Router | Líneas |
|--------|-------:|--------|-------:|
| payment | 721 | dashboard | 276 |
| admin_ops | 712 | documents | 245 |
| chatbot | 598 | ai | 224 |
| cases | 528 | accounting | 202 |
| invoices | 367 | public_intake | 181 |
| admin | 291 | appointments | 159 |
| meetings | 151 | leads / backup | 147 |
| auth | 142 | portal | 132 |
| referrals | 118 | clients | 100 |
| messages | 73 | | |

**Verbos:** 57 GET · 54 POST · 8 PATCH · 8 DELETE · 5 PUT

### Contextos / Hooks / Servicios

- **Contextos:** `AuthContext` (único — sesión global, headers `Authorization`).
- **Hooks:** `use-toast` (notificaciones UI). El resto son hooks locales por página (`useState/useEffect/useCallback`).
- **"Servicios":** No existe capa de servicios formal. Las llamadas son `axios.<verb>(\`${API}/...\`)` dispersas en cada página, todas resolviendo la base desde `@/config/api`.

### Integraciones externas

| Integración | Uso | Variables |
|-------------|-----|-----------|
| Google Gemini | IA legal / chatbot | `GEMINI_API_KEY`, `GEMINI_MODEL` |
| Anthropic Claude | IA legal / chatbot | `ANTHROPIC_API_KEY` |
| Meta WhatsApp Cloud API | Notificaciones + webhook | `META_*` (7 vars) |
| SMTP Gmail | Correo transaccional | `SMTP_*` (5 vars) |
| Google Drive | Backups/documentos (opcional) | `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_DRIVE_FOLDER_ID` |
| MercadoPago | Pagos (opcional → links simulados) | `MP_ACCESS_TOKEN` |
| Twilio WhatsApp | Alternativa (opcional, comentada) | `TWILIO_*` |
| Jitsi (meet.jit.si) | Videollamadas (frontend) | — |

---

## 2. MAPA DE BASE DE DATOS

### Colecciones MongoDB detectadas (por frecuencia de uso)

| Colección | Refs | Propósito |
|-----------|-----:|-----------|
| `users` | 54 | Usuarios (5 roles) + candidatos de landing |
| `cases` | 53 | Casos legales |
| `invoices` | 32 | Facturación |
| `notifications` | 16 | Notificaciones in-app |
| `appointments` | 15 | Agenda/citas |
| `clients` | 14 | Clientes de abogados |
| `case_activities` | 14 | Timeline de casos |
| `documents` | 13 | Documentos (cifrados ZK) |
| `meetings` | 12 | Reuniones/videollamadas |
| `leads` | 12 | CRM / prospectos |
| `chat_sessions` | 9 | Sesiones chatbot WhatsApp |
| `accounting_movements` | 9 | Contabilidad |
| `transactions` | 5 | Pagos |
| `messages` | 5 | Mensajería |
| `backups` | 4 | Respaldo |
| `sales_chat` | 2 | Chat de ventas (admin_ops) |
| `audit_logs` | 2 | Auditoría |
| `ai_usage` / `ai_sessions` | 2/2 | Uso de IA |
| `receipts`, `payment_links`, `kpi_metrics`, `counters`, `chatbot_reports` | 1 c/u | Auxiliares |

**Total: ~24 colecciones.**

### Relaciones (referencias por campo, no FK — MongoDB)

```
users (_id) ──< cases.lawyer_id
users (_id) ──< clients.lawyer_id ──< cases.client_id
cases (_id) ──< case_activities.case_id
cases (_id) ──< invoices.case_id
cases (_id) ──< documents.case_id
cases (_id) ──< meetings.case_id / appointments.case_id
users (_id) ──< leads.lawyer_id
users (_id) ──  subscription_id  (1:1 lógico)
counters         ── generador atómico de número de caso
```

### Índices y dependencias

- 🔴 **NO existe ningún índice definido en código** (`create_index`/`ensure_index` = 0 ocurrencias).
  Las consultas filtran por `email`, `lawyer_id`, `client_id`, `case_id` sin índice → **degradación de rendimiento garantizada a escala** y riesgo en `users.email` (login hace `find_one({"email": ...})` sin índice único).
- **Dependencia crítica:** `users.email` debería ser único + indexado (hoy la unicidad solo se valida por código en `register`, sin constraint de DB → condición de carrera posible).

---

## 3. ANÁLISIS DE SEGURIDAD

| Severidad | Hallazgo |
|-----------|----------|
| 🔴 **CRÍTICO** | **IDOR / Broken Object-Level Authorization.** Solo **5 de 20 routers** usan `Depends(get_current_user)` (auth, backup, payment, referrals, admin). Los routers de negocio —**cases, documents, dashboard, ai, clients, invoices, leads, appointments, messages, portal**— reciben `lawyer_id`/`client_id`/`user_id` como **parámetro del cliente** y confían en él. Un usuario puede leer/editar datos de otro cambiando el ID. Varios endpoints no exigen token alguno. |
| 🔴 **CRÍTICO** | **`SECRET_KEY` con fallback inseguro** (`"your-secret-key-change-this-in-production"`) si falta la env var → tokens JWT falsificables. |
| 🟠 **ALTO** | **CORS:** default `allow_origins="*"` **junto a `allow_credentials=True`** — combinación inválida por especificación y permisiva. Debe fijarse a la URL exacta de Vercel. |
| 🟠 **ALTO** | **RBAC sin enforcement en backend** para rutas no-admin. La validación de roles vive casi solo en `ProtectedRoute` (frontend), evadible llamando la API directamente. |
| 🟠 **ALTO** | **Sin índice único en `users.email`** → posible registro duplicado por carrera + enumeración. |
| 🟡 **MEDIO** | **Token en `localStorage`** → expuesto a XSS. El cifrado AES-GCM (`zkcrypto`) no protege si la passphrase está en el bundle. |
| 🟡 **MEDIO** | **Exposición de datos en respuestas:** `login`/`get_me` devuelven `id_document`, `bar_number`, `phone`, etc. sin filtrado por rol del solicitante. |
| 🟡 **MEDIO** | **JWT sin refresh ni revocación.** Expiración fija 24h; logout solo borra localStorage (el token sigue válido). |
| 🟢 **BAJO** | bcrypt trunca a 72 bytes — **ya manejado correctamente** en `utils/auth.py`. |
| 🟢 **BAJO** | Webhook de WhatsApp usa `META_VERIFY_TOKEN` — verificar que valide firma de payload, no solo el token de handshake. |

---

## 4. MAPA DE AUTENTICACIÓN

### Flujos

| Flujo | Backend | Frontend | Notas |
|-------|---------|----------|-------|
| **Login** | `POST /api/auth/login` — verifica bcrypt, devuelve JWT + user | `AuthContext.login` guarda token/user (AES-GCM opcional) | `is_verified` se fuerza `True` para roles admin |
| **Registro** | `POST /api/auth/register` — crea user, hash bcrypt | `RegisterPage` → `AuthContext.register` | Roles admin → `ACTIVE`; resto → `PENDING_VERIFICATION` |
| **Verificación** | Campo `is_verified`/`status`; `GET /api/auth/me` como fuente de verdad | `ProtectedRoute` redirige a `/verificacion-pendiente` | Aprobación manual vía `admin_ops` |
| **Sesión** | JWT Bearer HS256, `sub`=email, exp 24h | header `Authorization` global en axios | Sin refresh token |

### Roles y permisos

```
admin · admin_general · socio_comercial   → /admin (auto-verificados)
lawyer · client                            → /dashboard o /portal (requieren is_verified)
```

### Dependencia front vs back

| Aspecto | Dónde se decide | Robustez |
|---------|----------------|----------|
| Autenticación (¿hay token válido?) | **Backend** (`get_current_user`) — pero solo en 5 routers | Parcial |
| Autorización por rol | **Frontend** (`ProtectedRoute`) | ⚠️ Evadible |
| Autorización por objeto (¿es *mi* dato?) | **Cliente envía el ID** | 🔴 Inexistente |
| Verificación de cuenta | Backend (campo) + Frontend (gating) | OK funcional |

> **Conclusión:** la seguridad efectiva depende hoy mayoritariamente del frontend. El backend no es una frontera de confianza para la mayoría de los datos de negocio.

---

## 5. MAPA DE MÓDULOS EXISTENTES

| Módulo | Router / Página | Estado |
|--------|-----------------|--------|
| CRM (Leads) | `leads` · `CRMPage` | ✅ Operativo |
| Clientes | `clients` · `ClientsPage` | ✅ Operativo |
| Casos | `cases` (528 ln) · `CasesPage` | ✅ Operativo (módulo central) |
| Documentos | `documents` · `DocumentsPage` + `zkcrypto` | ✅ Operativo (cifrado ZK) |
| Facturación | `invoices` · `InvoicesPage` | ✅ Operativo |
| Pagos | `payment` (721 ln) · `CheckoutPage` | ✅ Operativo (MercadoPago opcional / links simulados) |
| Chatbot | `chatbot` (598 ln) | ✅ Operativo vía **WhatsApp webhook** (no widget web) |
| WhatsApp Meta | `notifier` + webhook | ✅ Operativo (depende de tokens Meta válidos) |
| IA | `ai` · `AIPage` (Gemini + Claude) | ✅ Operativo |
| Portal Cliente | `portal` · `PortalPage` | ⚠️ Operativo pero **sin token** (acceso por `client_id`/code) |
| Panel Admin | `admin` + `admin_ops` (712 ln) · `AdminPanel` | ✅ Operativo (usa `get_current_user`) |
| Agenda | `appointments` · `AgendaPage` | ✅ Operativo |
| Reuniones | `meetings` · `MeetingsPage` (Jitsi) | ✅ Operativo |
| Mensajes | `messages` | ✅ Operativo |
| Contabilidad | `accounting` · vista en AdminPanel | ✅ Operativo |
| Backups | `backup` · Google Drive | ✅ Operativo (opcional; fallback a MongoDB) |

**Estado global:** todos los módulos funcionalmente completos. La deuda es **transversal (seguridad/índices)**, no por módulo.

---

## 6. PUNTO CERO OS — COMPATIBILITY REPORT

> Análisis de viabilidad de reutilizar la arquitectura actual. **No implementar.**

| Módulo OS | Viabilidad | Justificación |
|-----------|-----------|---------------|
| **Centro de Comunicaciones** | 🟢 **ALTA** | Ya existen `messages`, `notifier` (WhatsApp/SMTP), `chatbot`. Unificar en un hub es natural. |
| **Centro Financiero** | 🟢 **ALTA** | `invoices` + `payment` + `accounting` + `transactions` ya cubren el núcleo; falta consolidar reporting. |
| **Ventas** | 🟢 **ALTA** | `leads` (CRM) + `sales_chat` + `referrals` ya son una base de ventas. |
| **Marketing** | 🟡 **MEDIA** | No hay módulo de campañas; reutilizaría `leads` + `notifier`, pero requiere modelos nuevos. |
| **Departamentos** | 🟡 **MEDIA** | El modelo de roles existe pero es plano (5 roles fijos en `Literal`). Departamentos exigen jerarquía/grupos no modelados. |
| **Organizaciones / Multi-Tenant** | 🔴 **BAJA (bloqueante)** | **No hay `organization_id`/`tenant_id` en ningún modelo.** El aislamiento de datos hoy es por `lawyer_id` informal y, peor, **vulnerable a IDOR**. Multi-tenant real exige: (1) modelo de tenant, (2) scoping por tenant en TODA query, (3) corregir IDOR primero. |
| **Inventario Inteligente** | 🔴 **BAJA** | Dominio ajeno al actual (legal). Requiere modelos, lógica y UI nuevos; reutilizaría solo auth/infra. |

**Prerrequisito absoluto para Punto Cero OS:** cerrar el IDOR y añadir scoping multi-tenant **antes** de cualquier módulo nuevo. Construir sobre el modelo de acceso actual propagaría la vulnerabilidad a todo el OS.

---

## 7. LANDING PAGE REVIEW (`LandingPage.jsx`, ~2500 líneas)

| Elemento | Qué funciona | Qué requiere atención |
|----------|--------------|----------------------|
| **Formulario Clientes** | `POST /api/public/case-intake` cableado, con manejo de estado y errores i18n | Endpoint público sin rate-limit visible → riesgo de spam/abuso |
| **Formulario Abogados** | `POST /api/public/lawyer-application` (`lawyer-application-form`), crea candidato (`password_hash=None`) | Igual: público, sin rate-limit/captcha |
| **Planes** | 4 planes (75k/140k/195k/275k COP) con ciclo mensual/anual (12×11), CTA → `/register?plan=X&cycle=Y` | Precios **hardcodeados en el frontend**, no provienen de `payment/catalog` → riesgo de desincronización con el backend de pagos |
| **Métodos de Pago** | Flujo real en `CheckoutPage` (catalog/methods/init/confirm/receipt) | La landing solo enlaza a registro; el pago real ocurre tras login |
| **Footer** | Completo y accesible (`role="contentinfo"`, `aria-labelledby`): contacto, WhatsApp (`wa.me/573028322083`, `wa.me/584246487378`), email, legal, redes | `Instagram`/`Facebook` (lucide) marcados **deprecados** (hint IDE, no rompe build) |
| **Chatbot Meta** | Integración por **WhatsApp** (enlaces `wa.me` + webhook backend `/webhook/whatsapp`) | **No hay widget de chat embebido** en la SPA. Si se espera un chat web in-page, **no existe** — solo deep-links a WhatsApp |

**Veredicto Landing:** funcional y bien estructurada. Correcciones recomendadas (no urgentes): (1) rate-limit/captcha en formularios públicos, (2) servir precios desde el backend, (3) decidir si "Chatbot Meta" debe ser widget web o seguir como deep-link WhatsApp.

---

## RESUMEN EJECUTIVO

✅ **Fortalezas:** funcionalidad de negocio completa (16 módulos operativos), conexión front↔back ya centralizada y endurecida, despliegue estable, cifrado ZK de documentos, tests pytest base (auth_rbac, admin_ops, public_intake).

🔴 **Bloqueantes para evolucionar a OS:**
1. **IDOR generalizado** — identidad derivada del cliente, no del token (15/20 routers).
2. **Sin multi-tenancy** — no hay `tenant_id`/`organization_id`.
3. **Sin índices MongoDB** — incluido `users.email` (riesgo de rendimiento y unicidad).
4. **`SECRET_KEY` y CORS** con defaults inseguros.

🧭 **Orden recomendado (Fase 2, cuando se autorice cambiar código):**
1. Cerrar IDOR: dependencia `get_current_user` + derivar `lawyer_id` del JWT en todos los routers.
2. Dependencia RBAC en backend (`require_roles`).
3. Índices MongoDB (único en `users.email`; compuestos por `lawyer_id`).
4. Endurecer `SECRET_KEY` (fail-fast) y `CORS_ORIGINS`.
5. Recién entonces: modelo multi-tenant → Punto Cero OS.

---

*Documento generado en modo auditoría. No se modificó ningún archivo de código, modelo ni configuración.*
