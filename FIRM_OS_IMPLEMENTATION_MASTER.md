# FIRM_OS_IMPLEMENTATION_MASTER.md
## Inventario Maestro de Implementación Real — Firm OS
**Única fuente oficial para cerrar Firm OS antes del Go-Live.**

- **Método:** inspección directa de código + historial git + build. Cero suposiciones. Cada conclusión cita `archivo:línea`, endpoint o commit.
- **NO verificado en esta pasada:** ejecución runtime del backend. Existe un bloqueante P0 documentado (API autenticada devuelve 500 por Tenant Kernel/GuardedDB). Todos los veredictos "A" son **operativos a nivel de código, cableados extremo a extremo**; su funcionamiento real en producción depende de resolver ese P0 (ver Sprint F0).
- **Rama auditada:** `main` (la que Vercel despliega en producción).

---

## 0. MAPA DE VERDAD (routing real)

- Shell: [FirmShell.jsx](frontend/src/shells/firm/FirmShell.jsx) — define las rutas `/firm-os/*`.
- Registry: [firmRegistry.js](frontend/src/shells/firm/firmRegistry.js) — mapea rutas → componentes.
- Sidebar: [FirmOSSidebar.jsx](frontend/src/modules/firm-os/FirmOSSidebar.jsx) — lo que el usuario **ve**.
- Backend global: `api_router = APIRouter(prefix="/api")` (backend/server.py:144), montado en server.py:557. Todos los routers Firm OS montados (server.py:181-215).
- Dato clave: las páginas CRM/Casos/Clientes/Agenda/IA/Meetings/Facturación/Documentos son **componentes compartidos con Lawyer OS** (`@/pages/dashboard/*`), reusados por Firm OS vía firmRegistry. Por eso son las más maduras.

**Sidebar actual (visible):** Centro de Operaciones, CRM Jurídico, Portal de Casos, Directorio Clientes, Agenda, IA Jurídica, Documentos, Sala de Conferencias, Facturación, Centro de Alertas, Equipo Jurídico, Control de Abogados, Indicadores, Centro de Automatización, Configuración (FirmOSSidebar.jsx:37-56).
**Rutas existentes pero NO en sidebar (solo por URL):** workflow-builder, scheduler, intelligence, mission-control, autonomous-operations, governance.
**Rutas eliminadas (ni ruta ni sidebar):** structure, expedientes, offices, departments, assignments, **communication** — commit `b2aa893`.

---

## 1. DASHBOARD
- **Objetivo funcional:** panel de estado de la firma (KPIs de equipo, casos, clientes, alertas).
- **Pantalla / Componente:** [FirmDashboard.jsx](frontend/src/modules/firm-os/pages/FirmDashboard.jsx) · **Ruta:** `/firm-os` (index) · **Sidebar:** "Centro de Operaciones".
- **Backend/Endpoints:** vía `useFirmCoreData` → `GET /api/firms/{firmId}/lawyers|cases|clients` (firms.py:959/1017/1070). **[DB-READ]** sobre colecciones reales `users`+`cases` (firms.py:981,989,1046,1099). Los datos SÍ son reales.
- **Hooks/Context:** useFirmCoreData (HTTP real), useAuth, useSubscription; useAutomation/useNotifications (**localStorage, no backend**).
- **Botones / Acciones / Persistencia:**
  - "Actualizar Plan" (FirmDashboard.jsx:136-138) — **SIN onClick → MUERTO**.
  - "Administrar Equipo" (FirmDashboard.jsx:149-151) — **SIN onClick → MUERTO**.
  - "Mission Control" (L212-219) — onClick navega. Vivo.
  - Secciones "Centro Inteligente / Inteligencia de Negocios" — alimentadas por motores en memoria/localStorage (useAutomation.js:35,84).
- **Resultado REAL:** muestra datos reales, pero sus 2 botones primarios están muertos y el "cerebro" BI es simulado.
- **CLASIFICACIÓN:** **B (parcial)** — lectura real A; acciones C/muertas.

## 2. PERFIL
- **Objetivo:** editar datos personales del usuario y foto.
- **Pantalla/Componente:** [SettingsPage.jsx](frontend/src/pages/dashboard/SettingsPage.jsx) tab "Perfil" · **Ruta:** `/firm-os/settings` · **Sidebar:** "Configuración".
- **Backend/Endpoints:** **NINGUNO consumido**. No existe endpoint de update de perfil de usuario ni de avatar (agente backend: no hay `/avatar|/photo`; único `/upload` es documentos cifrados).
- **Botones/Persistencia:**
  - "Guardar Cambios" (SettingsPage.jsx:122) → `handleSave` (L57-60): **solo `setSaved(true)` 2s. Cero HTTP. No persiste.**
  - "Cambiar foto" (L92) — **SIN onClick, sin input file, sin upload → MUERTO**.
- **Resultado REAL:** simulación. Nada se guarda.
- **CLASIFICACIÓN:** **C (mock)**.

## 3. EQUIPO
- **Objetivo:** listar equipo, suspender/reactivar/editar miembros.
- **Pantalla/Componente:** [FirmTeam.jsx](frontend/src/modules/firm-os/pages/FirmTeam.jsx) + [TeamMemberModal.jsx](frontend/src/modules/firm-os/components/TeamMemberModal.jsx) · **Ruta:** `/firm-os/team` · **Sidebar:** "Equipo Jurídico".
- **Backend/Endpoints:**
  - Cargar equipo: `GET /api/rbac/team/{firmId}` (FirmTeam.jsx:39) → **EXISTE** (rbac.py:249, [DB-READ]). ✅
  - Suspender/Reactivar: `PATCH /api/rbac/users/{id}/status` (FirmTeam.jsx:81,107) → **NO EXISTE** en rbac.py. El endpoint real es `PATCH /api/team/{id}/status` (team.py:17) o `PATCH /api/firm-management/lawyers/{id}/status` (firm_management.py:67). **Mismatch de ruta → 404.** ❌
  - Áreas de práctica: `GET /api/firm-config/{firmId}/practice-areas` (FirmTeam.jsx:58) → existe pero es **STUB estático** (firm_config.py:259, lista hardcodeada 265-273).
- **Botones/Acciones:**
  - "Invitar Miembro" (FirmTeam.jsx:182-185) — **SIN onClick → MUERTO** (ni siquiera importa un modal de invitación).
  - Suspender/Reactivar/Editar (L74-136) — vivos, pero suspender/reactivar pegan a ruta inexistente.
- **Resultado REAL:** carga el equipo; las acciones de escritura fallan (404) o están muertas.
- **CLASIFICACIÓN:** **B (roto)** — motivo: URL de estado equivocada (`/rbac/users/{id}/status` no existe).

## 4. CONFIGURACIÓN (Despacho / Seguridad / Notificaciones / Integraciones)
- **Pantalla/Componente:** [SettingsPage.jsx](frontend/src/pages/dashboard/SettingsPage.jsx) tabs firm/security/notifications/integrations · **Ruta:** `/firm-os/settings`.
- **Nota:** existe [FirmSettings.jsx](frontend/src/modules/firm-os/pages/FirmSettings.jsx) pero **NO está importado en ningún lado → HUÉRFANO**. Lo que se renderiza es el SettingsPage genérico.
- **Backend disponible pero NO usado por esta pantalla:** `PUT /api/firm-os/settings` (firm_os.py:133, [DB-WRITE] real). La UI no lo llama.
- **Botones/Persistencia:**
  - "Guardar" Despacho (SettingsPage.jsx:185) → `handleSave` falso; inputs sin `value`/`onChange` (L180-184). No persiste.
  - "Activar 2FA" (L152) — **SIN onClick**; no existe backend 2FA (grep TOTP/2fa → 0 en routes/).
  - Integraciones Google Calendar/Outlook/Stripe/WhatsApp (L238-253) — array **hardcodeado**, botones "Conectar" **sin onClick**.
- **CLASIFICACIÓN:** **C (mock)**. (FirmSettings.jsx → **D huérfano**; backend `PUT /firm-os/settings` existe pero desconectado.)

## 5. FACTURACIÓN
- **Pantalla/Componente:** [InvoicesPage.jsx](frontend/src/pages/dashboard/InvoicesPage.jsx) · **Ruta:** `/firm-os/invoices` · **Sidebar:** "Facturación".
- **Endpoints (todos existentes, [DB-WRITE/READ] reales, invoices.py):** GET `/api/invoices/` (L39/106); POST crear (L57/123); PATCH (L112/172); DELETE (L105/213); POST pay-link MercadoPago (L81/305); POST mark-paid (L96/343); POST attach-payment (L130/232). Colección `invoices`.
- **Persistencia:** CRUD completo real + link de cobro + comprobante.
- **CLASIFICACIÓN:** **A** — CRUD real con pasarela de pago. (Único defecto: varios endpoints invoices sin auth — riesgo, ver §Roles/Permisos.)

## 6. CRM
- **Pantalla/Componente:** [CRMPage.jsx](frontend/src/pages/dashboard/CRMPage.jsx) · **Ruta:** `/firm-os/crm` · **Sidebar:** "CRM Jurídico".
- **Endpoints (leads.py, reales):** GET `/api/leads/` (L43); PATCH (L67); POST crear (L84); DELETE (L95); POST convert-to-case (L106).
- **Persistencia:** CRUD real + conversión a caso. Sin mocks.
- **CLASIFICACIÓN:** **A**.

## 7. CASOS
- **Pantalla/Componente:** [CasesPage.jsx](frontend/src/pages/dashboard/CasesPage.jsx) · **Ruta:** `/firm-os/cases` · **Sidebar:** "Portal de Casos".
- **Endpoints (cases.py):** GET (L63/248); POST crear (L85/132, insert_one cases:201); PATCH (L126/503); DELETE (L142/680); accept (L157/588); decline (L174/620). Genera facturas derivadas (POST /invoices L102-107).
- **Persistencia:** CRUD + transiciones de estado + expediente. Real.
- **CLASIFICACIÓN:** **A**. ⚠️ Riesgo: accept/decline/delete/timeline en cases.py **sin autenticación** (agente backend, hallazgo #5).

## 8. DOCUMENTOS
- **Pantalla/Componente:** [DocumentsPage.jsx](frontend/src/pages/dashboard/DocumentsPage.jsx) · **Ruta:** `/firm-os/documents` · **Sidebar:** "Documentos".
- **Endpoints (documents.py):** GET listar (L45/83); POST upload cifrado (L97/151, insert_one:198); GET content (L124/203); PATCH (L167/253); DELETE (L140/268); + storage/backup (/integration, /backup/manual).
- **Persistencia:** subida cifrada Zero-Knowledge (`lib/zkcrypto`) + CRUD real.
- **CLASIFICACIÓN:** **A**. ⚠️ create-meta/edit/delete/folders sin auth (hallazgo backend #5).

## 9. AGENDA
- **Pantalla/Componente:** [AgendaPage.jsx](frontend/src/pages/dashboard/AgendaPage.jsx) · **Ruta:** `/firm-os/agenda` · **Sidebar:** "Agenda Inteligente".
- **Endpoints (appointments):** GET `/api/appointments/` (L51); POST crear (L82). Reales.
- **Botones:** crear/listar/navegar mes vivos. "Conectar" (Google Calendar/Outlook, L196) **SIN onClick → muerto** (sin backend OAuth).
- **CLASIFICACIÓN:** **A** (crear/listar citas real). Sub-acción integración calendario: **F (no existe)**.

## 10. IA
- **Pantalla/Componente:** [AIPage.jsx](frontend/src/pages/dashboard/AIPage.jsx) · **Ruta:** `/firm-os/ai` · **Sidebar:** "IA Jurídica".
- **Endpoints (ai.py):** POST `/api/ai/chat` (L111 → ai.py:217, [DB-WRITE] ai_sessions/ai_usage + Gemini/Claude); GET usage (L65); contexto expediente vía `/integration`.
- **Persistencia:** conversación con `session_id` persistida. Real.
- **CLASIFICACIÓN:** **A**. (`GET /ai/templates` es stub estático, ai.py:309 — irrelevante, plantillas son de UI.)

## 11. ALERTAS
- **Pantalla/Componente:** [AlertsCenter.jsx](frontend/src/modules/firm-os/pages/AlertsCenter.jsx) · **Ruta:** `/firm-os/alerts` · **Sidebar:** "Centro de Alertas".
- **Datos:** `useFirmCoreData` (backend real) → `buildAlertsViewModel` en memoria (L48). Solo lectura.
- **CLASIFICACIÓN:** **A (solo lectura)** — vista funcional sobre datos reales; no persiste (correcto, es derivada).

## 12. AUTOMATIZACIONES
- **Pantalla/Componente:** [AutomationCenterPage.jsx](frontend/src/modules/firm-os/pages/AutomationCenterPage.jsx) (+ WorkflowBuilder, Scheduler, Intelligence, MissionControl, AutonomousOperations, Governance) · **Ruta:** `/firm-os/automation` (visible); resto solo por URL.
- **Backend:** **NINGUNO**. Motores calculan en memoria y persisten **solo en localStorage** (useAutomation.js:84, useScheduler.js:49, useWorkflows.js:57, useAutonomousEngine.js:104, useGovernance.js:83). EnterpriseGovernance se auto-declara "Client-side only" (L123-124).
- **Botones muertos/falsos:** WorkflowBuilder "Guardar" sin onClick (L136-143); Scheduler refresh falso (`setTimeout`, L31), edición muerta (L69), modal de creación inexistente; IntelligenceCenter se rotula "heurísticos puros sin IA externa" (L35).
- **CLASIFICACIÓN:** **C (mock/simulado)** — todo el clúster "enterprise/autónomo".

## 13. COMUNICACIONES
- **Archivo:** [CommunicationPage.jsx](frontend/src/modules/firm-os/pages/CommunicationPage.jsx) — **existe en disco**.
- **Eliminación:** commit **`b2aa893`** *"retirar módulos no listos"* borró `<Route path="communication">` de FirmShell.jsx y el enlace `{ label:'Comunicación', path:'/firm-os/communication' }` de FirmOSSidebar.jsx. Motivo declarado: "módulos no listos". → **ruta y menú ELIMINADOS; inaccesible** (cae en catch-all FirmShell.jsx:41).
- **Contenido:** aunque se reconecte, es **100% mock**: `conversationGroups` hardcodeado (L35-80), botones Enviar/Nueva/Buscar sin onClick (L184,97,149), banner "preparada para integración futura con WebSockets" (L169). Sin backend.
- **CLASIFICACIÓN:** **E (eliminado del enrutado, commit b2aa893)** + contenido subyacente **C (mock)**.

## 14. SUSCRIPCIÓN
- **Pantalla:** [SettingsPage.jsx](frontend/src/pages/dashboard/SettingsPage.jsx) tab "Suscripción" (muestra plan real vía `useSubscription`, L197-201).
- **Backend (existe y robusto, payment.py):** `POST /api/payment/change-plan` (L1228, [DB-WRITE] con prorrateo); renew (1135); cancel (1377); reactivate (1433); `GET /my-plan` (665); status (1082). CRUD OS en subscriptions.py (delegado a `subscription_service`).
- **Botón:** "Cambiar Plan" (SettingsPage.jsx:203) — **SIN onClick → MUERTO**. No conecta con el backend que sí existe.
- **CLASIFICACIÓN:** **B** — backend A, display A-lectura, pero acción de cambio **no cableada** en la UI de Firm OS. (El flujo de compra real vive en `/checkout`, separado.)

## 15. PLANES
- **Fuente:** `@/modules/plans/mockData` (CURRENCIES, catálogo oficial) + `GET /api/payment/plans|catalog` (payment.py:714/656, estáticos de constantes). Usado por Landing/Settings/Checkout.
- **Resultado:** catálogo de planes se muestra correctamente desde fuente única; precios/monedas reales.
- **CLASIFICACIÓN:** **A (catálogo/display)** — es dato de configuración, no CRUD. Consistente y funcional.

## 16. INVITACIONES
- **Invitar Abogado:** [FirmLawyers.jsx:176-179](frontend/src/modules/firm-os/pages/FirmLawyers.jsx#L176) onClick → [InviteLawyerModal.jsx:22](frontend/src/modules/firm-os/components/InviteLawyerModal.jsx#L22) → `POST /api/firm-os/invite-lawyer` (firm_os.py:493, [DB-WRITE] lawyer_invitations:529). **Ruta `/firm-os/lawyers` visible ("Control de Abogados").** → **A** (cableado E2E).
- **Invitar Miembro:** FirmTeam.jsx:182-185 **muerto**. → **C**.
- **Activación:** `POST /api/firm-os/activate-lawyer` (firm_os.py:584) existe. Página `/activate-lawyer` ruteada en App.js.
- **CLASIFICACIÓN:** **B** — un camino A, otro muerto.

## 17. ROLES
- **Backend (rbac.py):** GET roles (L21), roles/{id}/permissions (L45), matrix (L219) → **derivan de la constante `ROLE_PERMISSIONS`** (models/rbac), **no de BD** [NO-DB]. `POST /users/{id}/assign-role` (L67) sí escribe `users.role` [DB-WRITE].
- **Frontend:** roles se muestran en FirmTeam (solo lectura). **No hay UI de gestión de roles** en Firm OS.
- **CLASIFICACIÓN:** **B/parcial** — backend basado en constantes (no gestionable), sin UI de administración.

## 18. PERMISOS
- **Backend (rbac.py):** get-user-permissions (L131), check-permission (L176) — calculados de constantes; enforcement depende del middleware/kernel.
- **Frontend:** sin pantalla de gestión de permisos.
- **CLASIFICACIÓN:** **B/parcial** — lógica de constantes, sin administración; efectividad ligada al Tenant Kernel (P0).

---

## 2. MATRIZ

| Funcionalidad | Frontend | Backend | Mongo | Persistencia | Visible | Operativa | Estado | Prioridad | Horas |
|---|---|---|---|---|---|---|---|---|---|
| CRM | ✅ | ✅ leads | ✅ | ✅ CRUD | ✅ | ✅ | **A** | — | 0 |
| Casos | ✅ | ✅ cases | ✅ | ✅ CRUD | ✅ | ✅ | **A** | Sec.auth | 6 |
| Documentos | ✅ | ✅ documents | ✅ | ✅ upload cifrado | ✅ | ✅ | **A** | Sec.auth | 6 |
| Agenda | ✅ | ✅ appointments | ✅ | ✅ crear | ✅ | ✅ | **A** | — | 2 |
| IA | ✅ | ✅ ai_sessions | ✅ | ✅ sesión | ✅ | ✅ | **A** | — | 0 |
| Facturación | ✅ | ✅ invoices | ✅ | ✅ CRUD+pago | ✅ | ✅ | **A** | Sec.auth | 6 |
| Alertas | ✅ | ✅ (lectura) | ✅ | n/a (derivada) | ✅ | ✅ | **A** | — | 0 |
| Planes (catálogo) | ✅ | ✅ estático | n/a | n/a | ✅ | ✅ | **A** | — | 0 |
| Dashboard | ✅ display | ✅ firms | ✅ | lectura | ✅ | ⚠️ | **B** | ALTA | 8 |
| Equipo | ✅ | ⚠️ ruta mala | ✅ | ❌ 404 write | ✅ | ❌ | **B(roto)** | ALTA | 6 |
| Invitaciones | ✅ (abogado) | ✅ invite | ✅ | ✅ / ❌ miembro | ✅ | ⚠️ | **B** | ALTA | 4 |
| Suscripción | ⚠️ botón muerto | ✅ change-plan | ✅ | backend sí | ✅ | ⚠️ | **B** | ALTA | 6 |
| Roles | ❌ sin UI | ⚠️ constantes | parcial | assign sí | ❌ | ⚠️ | **B/C** | MEDIA | 16 |
| Permisos | ❌ sin UI | ⚠️ constantes | parcial | n/a | ❌ | ⚠️ | **B/C** | MEDIA | 16 |
| Perfil | ✅ | ❌ | ❌ | ❌ falso | ✅ | ❌ | **C** | ALTA | 8 |
| Configuración | ✅ | ⚠️ PUT existe, no usado | ⚠️ | ❌ falso | ✅ | ❌ | **C** | ALTA | 10 |
| Automatizaciones (+enterprise) | ✅ | ❌ | ❌ localStorage | ❌ | parcial | ❌ | **C** | BAJA | 40+ |
| Comunicaciones | ✅ mock | ❌ | ❌ | ❌ | ❌ eliminado | ❌ | **E+C** | MEDIA | 24 |

Sub-acciones **F (no existe):** 2FA, subida de foto/avatar, sincronización Google Calendar/Outlook (OAuth). Confirmado por grep en backend/routes/ (0 coincidencias reales).

---

## 3. BACKLOG DEFINITIVO (ordenado por impacto de venta)

> Criterio único: **qué desbloquea poder vender/operar el sistema**. No hay prioridades inventadas; el orden sigue "sin esto no se puede cobrar ni demostrar el producto".

### Sprint F0 — DESBLOQUEO (sin esto nada funciona en prod) · ~2-3 días
1. **Resolver P0 runtime:** API autenticada devuelve 500 (Tenant Kernel/GuardedDB). Levantar backend con uvicorn y validar login + los endpoints "A" respondiendo 200. **Sin esto, los 8 módulos A no funcionan en producción.** (memoria: staging-runtime-blocker)
2. Corregir `check_ports.py`/arranque ya hecho; validar `firm_id` presente en el token para que `useFirmCoreData` cargue.
3. Fix `cases.py:423` posible `NameError` (`os` sin import).

### Sprint F1 — REPARAR LO QUE YA EXISTE (barato, alto impacto visual) · ~3-4 días
4. **Equipo:** corregir URL `PATCH /rbac/users/{id}/status` → `/team/{id}/status` (FirmTeam.jsx:82,108). Desbloquea suspender/reactivar.
5. **Dashboard:** cablear "Actualizar Plan" → `/checkout` o `/firm-os/settings`; "Administrar Equipo" → `/firm-os/team` (FirmDashboard.jsx:136,149).
6. **Invitar Miembro** (FirmTeam.jsx:182): conectar al `InviteLawyerModal` ya existente + `POST /firm-os/invite-lawyer`.
7. **Suscripción:** cablear "Cambiar Plan" (SettingsPage.jsx:203) → flujo `/checkout` / `POST /payment/change-plan`.

### Sprint F2 — CONVERTIR MOCKS EN REAL (Perfil/Config: lo que un abogado edita a diario) · ~1 semana
8. **Perfil:** `handleSave` real → nuevo `PUT /api/users/me` (crear) + persistencia; controlar inputs.
9. **Cambiar foto:** endpoint de avatar (`POST /users/me/avatar`) + input file + storage.
10. **Configuración Despacho:** conectar a `PUT /api/firm-os/settings` (ya existe, firm_os.py:133); controlar inputs.
11. **Integraciones/2FA:** decidir — ocultar los toggles falsos (Calendar/Outlook/2FA) hasta implementarlos, o implementarlos. Vender un toggle falso es riesgo reputacional.

### Sprint F3 — GOBIERNO Y LIMPIEZA · ~1-2 semanas
12. **Roles/Permisos:** UI de administración + persistencia real (hoy son constantes).
13. **Seguridad:** añadir `get_current_user` a endpoints sin auth en cases/documents/invoices/meetings (riesgo IDOR, hallazgo backend #5).
14. **Eliminar código muerto/huérfano:** `FirmSettings.jsx` (huérfano), y decidir destino de `CommunicationPage`, `OrganizationalStructure`, `Expedientes`, `Offices`, `Departments`, `Assignments` (retirados en b2aa893).

### Roadmap 2.0 — DIFERIDO (no bloquea venta) 
15. Clúster "Enterprise/Autónomo" (Automatización, WorkflowBuilder, Scheduler, IntelligenceCenter, MissionControl, AutonomousOps, Governance): hoy son simulaciones localStorage. Reconstruir con backend real **solo si hay demanda comercial** — es la parte más cara (40h+) y la menos crítica para operar un despacho.
16. Módulo Comunicaciones real (WebSockets/mensajería).
17. Integraciones OAuth reales (Google Calendar, Outlook).

---

## 4. RESPUESTAS

**1. ¿Qué necesita un despacho para trabajar a diario?**
Clientes (CRM), Casos/Expedientes, Documentos, Agenda/Citas, Facturación/Cobros, Comunicación con el cliente, Gestión de equipo/roles, y Perfil/Configuración de la firma. Lo "enterprise/autónomo" (workflows, governance, autopilot) **no** es lo que se usa cada día.

**2. ¿Cuáles ya funcionan (A, código E2E real)?**
CRM, Casos, Documentos, Agenda, IA, Facturación, Alertas (lectura), Planes (catálogo). **Invitar Abogado** también (subconjunto de Invitaciones). → **8 funcionalidades**, sujetas a resolver el P0 de runtime.

**3. ¿Cuáles son falsas (aparentan y no hacen nada)?**
Perfil ("Guardar Cambios" falso), Configuración/Despacho ("Guardar" falso), "Activar 2FA", "Cambiar foto", "Cambiar Plan", "Conectar" Calendar/Outlook — todos botones sin handler o `handleSave` simulado (SettingsPage.jsx:57-60,92,152,203,239-249; AgendaPage.jsx:196; FirmDashboard.jsx:136,149; FirmTeam.jsx:182).

**4. ¿Cuáles son simuladas (mock/localStorage)?**
Todo el clúster Automatizaciones/WorkflowBuilder/Scheduler/IntelligenceCenter/MissionControl/AutonomousOps/Governance (persisten solo en localStorage) y Comunicaciones (datos hardcodeados).

**5. ¿Cuáles son componentes muertos/huérfanos?**
`FirmSettings.jsx` (no importado). Botones muertos: Actualizar Plan, Administrar Equipo, Invitar Miembro, Cambiar foto, Activar 2FA, Cambiar Plan, Conectar Calendar/Outlook, "Guardar" de WorkflowBuilder.

**6. ¿Cuáles deben eliminarse?**
`FirmSettings.jsx` (huérfano). Toggles falsos de 2FA/Calendar/Outlook (o marcarlos "Próximamente"). Páginas retiradas por b2aa893 que no se reconstruirán (decidir: Offices, Departments, Assignments, OrganizationalStructure, Expedientes). El clúster Enterprise si no hay demanda comercial.

**7. ¿Cuáles deben reconstruirse?**
Perfil (persistencia real), Configuración/Despacho (conectar a `PUT /firm-os/settings`), Equipo (fix URL de estado), Suscripción/Cambiar Plan (cablear al backend existente), Comunicaciones (si se vende), Roles/Permisos (UI + persistencia).

**8. ¿% REAL de Firm OS terminado?**
Contando **solo funcionalidades completamente operativas (A), cableadas extremo a extremo con persistencia real**: **8 de 18 = 44%** a nivel de código.
- ⚠️ **Ajuste por runtime:** este 44% asume que el backend responde 200. Con el **P0 de 500 sin resolver, el % operativo real en producción hoy tiende a ~0%** hasta que F0 se cierre. La cifra honesta de venta es: **"44% construido y cableado; 0% verificado operando en producción hasta cerrar el bloqueante de runtime (F0)."**

---
*Documento generado por inspección de código, git y build. Toda afirmación es trazable a archivo:línea/endpoint/commit citado.*
