# AUDITORÍA DE LA ARQUITECTURA ACTUAL - PUNTO CERO LEGAL

**Fecha:** 26 de Junio, 2025
**Alcance:** Radiografía técnica del estado actual del proyecto
**Nota:** Este documento describe únicamente lo que existe. No contiene recomendaciones ni propuestas de cambio.

---

## 1. ESTRUCTURA GENERAL DEL PROYECTO

El proyecto está organizado como una aplicación monolítica con separación clara frontend/backend:

```
proyecto-root/
├── frontend/          (React con Create React App / CRACO)
├── backend/           (FastAPI + MongoDB + Motor)
└── otros/            (configuración, documentación)
```

### Tecnologías Principales

**Frontend:**
- React 19.0.0
- React Router DOM 7.5.1
- TypeScript (opcional, parece ser JavaScript)
- Radix UI (componentes headless)
- Lucide Icons
- Axios (HTTP client)
- Framer Motion (animaciones)
- TailwindCSS (estilos)

**Backend:**
- FastAPI (framework web async)
- Motor + MongoDB (base de datos NoSQL async)
- Pydantic (validación de datos)
- Python 3.8+
- Async/Await (operaciones no-bloqueantes)

---

## 2. FRONTEND - ESTRUCTURA Y MÓDULOS

### 2.1 Estructura de Carpetas

```
frontend/src/
├── pages/              (Páginas públicas y de entrada)
├── modules/            (Módulos temáticos con páginas y componentes)
├── components/         (Componentes reutilizables)
│   ├── ui/            (Componentes UI primitivos - Radix UI)
│   ├── layout/        (Headers, sidebars, layouts)
│   ├── admin/         (Componentes específicos de admin)
│   ├── commerce/      (Componentes de comercio/upgrade)
│   ├── legal/         (Componentes legales)
│   ├── security/      (Componentes de seguridad)
│   └── otros/
├── contexts/          (Context API para estado global)
├── config/            (Configuración)
├── index.js           (Entry point)
└── App.jsx            (Componente raíz)
```

### 2.2 Páginas Principales (nivel raíz - pages/)

| Página | Archivo | Propósito |
|--------|---------|----------|
| Landing | `LandingPage.jsx` | Página principal pública |
| Landing V2 | `LandingPageV2.jsx` | Versión alternativa de landing |
| Login | `LoginPage.jsx` | Formulario de inicio de sesión |
| Registro | `RegisterPage.jsx` | Formulario de registro público |
| Admin Panel | `AdminPanel.jsx` | Panel de administración |
| Dashboard Home | `DashboardHome.jsx` | Dashboard principal |
| Firmas Directory | `FirmsDirectory.jsx` | Directorio de firmas registradas |
| Checkout | `CheckoutPage.jsx` | Página de pago/checkout |
| Portal | `PortalPage.jsx` | Portal público/de clientes |
| Perfil Público | `PublicFirmProfile.jsx` | Perfil público de una firma |
| Activar Firma | `ActivateFirmPage.jsx` | Página de activación de firma |
| Activar Abogado | `ActivateLawyerPage.jsx` | Página de activación de abogado |
| Verificación Pendiente | `VerificacionPendiente.jsx` | Estado de verificación |

### 2.3 Módulos (modules/)

Cada módulo contiene:
- `/pages` - Páginas del módulo
- `/components` - Componentes específicos del módulo
- Rutas internas propias

#### Módulos Identificados:

| Módulo | Ubicación | Propósito |
|--------|-----------|----------|
| **Admin OS** | `admin/` | Sistema administrativo maestro |
| **Firm OS** | `firm-os/` | Sistema operativo para firmas |
| **Firms** | `firms/` | Gestión y directorio de firmas |
| **Analytics** | `analytics/` | Analítica y reportes |
| **Billing** | `billing/` | Facturación y gestión de pagos |
| **Subscriptions** | `subscriptions/` | Gestión de suscripciones |
| **Implementations** | `implementations/` | Seguimiento de implementaciones |
| **Organizations** | `organizations/` | Gestión de organizaciones |
| **Partners** | `partners/` | Gestión de partners/agentes |
| **Permissions** | `permissions/` | Control de permisos y roles |
| **Plans** | `plans/` | Gestión de planes |
| **Referrals** | `referrals/` | Programa de referidos |
| **Roles** | `roles/` | Gestión de roles |
| **Users** | `users/` | Gestión de usuarios |
| **Verticals** | `verticals/` | Gestión de verticales (industrias) |
| **Notifications** | `notifications/` | Centro de notificaciones |
| **Security** | `security/` | Dashboard de seguridad |
| **Landing** | `landing/` | Componentes de landing page |
| **Inventory** | `inventory/` | Gestión de inventario |
| **Commercial AI** | `commercialAi/` | IA comercial |

### 2.4 Páginas dentro de Módulos (Ejemplos)

#### Admin OS (`admin/pages/`)
- `ExecutiveDashboard.jsx` - Panel ejecutivo principal
- `FirmsOverview.jsx` - Vista general de firmas (actualizado con trial)
- `UsersDashboard.jsx` - Gestión de usuarios
- `FirmsDashboard.jsx` - Dashboard de firmas
- `FinancialDashboard.jsx` - Financiero
- `PendingFirmsCenter.jsx` - Centro de firmas pendientes
- `SalesCommandCenter.jsx` - Centro de ventas
- `AICommandCenter.jsx` - Centro de control IA
- `MasterControl.jsx` - Control maestro
- Y 15+ dashboards más

#### Firm OS (`firm-os/pages/`)
- `FirmDashboard.jsx` - Dashboard de firma
- `FirmCases.jsx` - Casos de la firma
- `FirmLawyers.jsx` - Abogados de la firma
- `FirmFinance.jsx` - Finanzas de la firma
- `FirmAnalytics.jsx` - Análisis de la firma
- `FirmSettings.jsx` - Configuración de firma
- `FirmTeam.jsx` - Equipo de la firma
- `BillingEnterprise.jsx` - Facturación empresarial
- `CRMEnterprise.jsx` - CRM empresarial
- `OnboardingWizardFirm.jsx` - Wizard de onboarding

### 2.5 Contextos Globales

| Contexto | Archivo | Estado Manejado |
|----------|---------|-----------------|
| **AuthContext** | `AuthContext.jsx` | Usuario, autenticación, JWT |
| **CaseContext** | `CaseContext.jsx` | Casos seleccionados, filtros |
| **SubscriptionContext** | `SubscriptionContext.jsx` | Suscripción, plan actual |
| **ContentProvider** | `ContentProvider.jsx` | Contenido dinámico |
| **OSDataProvider** | `OSDataProvider.jsx` | Datos de OS |
| **TenantContext** | `TenantContext.jsx` | Tenant actual (multi-tenant) |

### 2.6 Componentes UI Principales

#### Layout
- `DashboardLayout.jsx` - Layout base de dashboard
- `Sidebar.jsx` - Barra lateral de navegación
- `ActionBar.jsx` - Barra de acciones
- `HeaderAlerts.jsx` - Alertas en encabezado
- `NotificationBell.jsx` - Campana de notificaciones

#### Seguridad
- `ProtectedRoute.jsx` - Ruta protegida por autenticación
- `RoleRoute.jsx` - Ruta protegida por rol
- `TenantRoute.jsx` - Ruta protegida por tenant
- `SupportAccessGate.jsx` - Gate de acceso de soporte
- `TrialAgreementGate.jsx` - Gate de acuerdo de trial
- `SecuritySeals.jsx` - Sellos de seguridad visual

#### Modales y Formularios
- `FirmRegistrationModal.jsx` - Modal de registro de firma (aparentemente obsoleto)
- `FirmRegistrationStreamlined.jsx` - Registro simplificado de firma (obsoleto según auditoría anterior)
- `FirmOSPreviewBlock.jsx` - Bloque de preview de Firm OS (con trial integrado)
- `InviteLawyerModal.jsx` - Modal de invitación de abogado

#### Componentes Comerciales
- `CommercialAssistant.jsx` - Asistente comercial
- `UpgradeModal.jsx` - Modal de upgrade
- `FeatureGate.jsx` - Puerta de características pagadas

#### Otros
- `ChatWidget.jsx` - Widget de chat
- `ExpedienteDrawer.jsx` - Drawer del expediente

### 2.7 UI Components (Radix UI - primitivos)

Existe una carpeta `components/ui/` con componentes primitivos de Radix UI sin customizar:
- Button, Input, Select, Dialog, Dropdown Menu
- Accordion, Tabs, Cards, Badges
- Alerts, Tooltips, Popovers
- Tables, Forms, etc.

---

## 3. BACKEND - ESTRUCTURA Y RUTAS

### 3.1 Estructura de Carpetas

```
backend/
├── routes/           (Endpoints organizados por módulo)
├── models/           (Modelos Pydantic de datos)
├── services/         (Servicios de negocio)
├── utils/            (Utilidades y helpers)
├── security/         (Seguridad, tenant scoping)
├── middleware/       (Middleware de FastAPI)
├── migrations/       (Migraciones de BD)
├── seeds/            (Datos iniciales)
├── tests/            (Tests unitarios)
├── server.py         (Entrypoint, configuración FastAPI)
└── .env              (Variables de entorno)
```

### 3.2 Modelos de Datos (backend/models/)

| Modelo | Archivo | Descripción |
|--------|---------|-------------|
| **User** | `user.py` | Usuarios del sistema (abogados, admins, firm_owner) |
| **Firm** | `firm.py` | Firmas jurídicas (con campos trial añadidos) |
| **Case** | `case.py` | Casos jurídicos |
| **Lead** | `lead.py` | Leads/prospectos del CRM |
| **Organization** | `organization.py` | Organizaciones (Punto Cero OS - multi-tenant) |
| **OSSubscription** | `os_subscription.py` | Suscripciones de OS (multi-tenant) |
| **Subscription** | `subscription.py` | Suscripciones de abogado (legacy) |
| **Partner** | `partner.py` | Partners/agentes comerciales |
| **Implementation** | `implementation.py` | Implementaciones/onboarding |
| **RBAC** | `rbac.py` | Roles, permisos, control de acceso |
| **FirmConfig** | `firm_config.py` | Configuración de firma (áreas práctica, etc) |
| **Invoice** | `invoice.py` | Facturas |
| **Commission** | `commission.py` | Comisiones |
| **Billing** | `billing.py` | Facturación |
| **Analytics** | `analytics.py` | Modelos de analítica |
| **Appointment** | `appointment.py` | Citas/eventos |
| **Meeting** | `meeting.py` | Reuniones |
| **Message** | `message.py` | Mensajes |
| **Document** | `document.py` | Documentos |
| **TimelineEvent** | `timeline_event.py` | Eventos de timeline |
| **CaseActivity** | `case_activity.py` | Actividades dentro de casos |
| **GlobalConfig** | `global_config.py` | Configuración global del sistema |

### 3.3 Rutas API (backend/routes/)

**Total de archivos de rutas: 41**

#### Rutas de Autenticación y Usuarios
- `auth.py` - Login, logout, refresh token, cambio contraseña
- `users.py` - CRUD de usuarios, listar usuarios

#### Rutas de Entidades Jurídicas
- `firms.py` - Registro, gestión y aprobación de firmas (CON TRIAL integrado)
- `cases.py` - CRUD de casos, búsqueda de conflictos
- `leads.py` - Gestión de leads/prospectos
- `appointments.py` - Citas y eventos
- `meetings.py` - Reuniones
- `clients.py` - Directorio de clientes
- `invoices.py` - Gestión de facturas
- `commissions.py` - Gestión de comisiones

#### Rutas de Administración
- `admin.py` - Endpoints de admin general
- `admin_master.py` - Control maestro del administrador (auditoría, control completo)
- `admin_ops.py` - Operaciones administrativas
- `rbac.py` - Gestión de roles y permisos
- `team.py` - Gestión de equipo
- `users.py` - Usuarios

#### Rutas de Multi-Tenancy (Punto Cero OS)
- `organizations.py` - Organizaciones (multi-tenant)
- `partners.py` - Partners (multi-tenant)
- `implementations.py` - Implementaciones
- `subscriptions.py` - Suscripciones OS
- `billing.py` - Facturación OS
- `billing_admin.py` - Admin de facturación/suscripciones

#### Rutas de Negocio y Ventas
- `sales_analytics.py` - Analítica de ventas global
- `referrals.py` - Programa de referidos
- `commissions.py` - Comisiones y splits de ingresos
- `payment.py` - Pagos (Mercado Pago, PayPal, etc)
- `financial.py` - Finanzas y splits

#### Rutas de IA y Automación
- `ai.py` - Chat y copiloto IA (Gemini)
- `ai_operations.py` - Operaciones de IA (scoring, recomendaciones)
- `ai_autopilot.py` - Autopilot IA (asignación automática de leads)
- `autonomous.py` - Sistema autónomo (toma de decisiones)

#### Rutas de Datos y Análisis
- `dashboard.py` - Endpoints de dashboard (métricas)
- `analytics.py` - Analítica consolidada
- `timeline.py` - Timeline de eventos
- `documents.py` - Gestión de documentos

#### Rutas de Configuración y Firmamento
- `firm_config.py` - Configuración de firma (onboarding, áreas)
- `firm_os.py` - Firma OS (dashboard, settings)
- `firm_management.py` - Gestión de firmas (abogados, equipos)
- `legal_os.py` - Legal OS (sistema operativo autónomo)
- `global_network.py` - Red global (routing internacional)

#### Rutas de Servicios Específicos
- `accounting.py` - Contabilidad
- `public_intake.py` - Formulario de intake público (consultas)
- `portal.py` - Portal de clientes
- `chatbot.py` - Chatbot integrado
- `integration.py` - Integración entre módulos (CRM↔Casos↔Docs)
- `messages.py` - Mensajería
- `documents.py` - Documentos (Drive, almacenamiento)
- `backup.py` - Backups (Google Drive)

---

## 4. AUTENTICACIÓN Y SEGURIDAD

### 4.1 Flujo de Autenticación

```
Frontend: Usuario escribe credenciales
    ↓
POST /api/auth/login (email, password)
    ↓
Backend: Valida en DB
    ↓
Retorna JWT (en cookie o token)
    ↓
Frontend: Almacena en localStorage (cifrado opcional)
    ↓
Siguientes requests: Authorization: Bearer <JWT>
    ↓
Middleware: get_current_user valida JWT
```

### 4.2 Tokens y Sesiones

- **JWT (JSON Web Token):** Token Bearer enviado en header Authorization
- **LocalStorage:** Token almacenado en frontend (con encriptación AES-GCM opcional)
- **Refresh tokens:** Soportados en auth.py
- **Expiración:** Configurable en .env

### 4.3 Roles Encontrados

#### Roles Globales (sistema)
- `admin_general` - Administrador maestro (acceso total)
- `admin` - Administrador regular
- `super_admin` - Super administrador (mencionado en utils/tenant.py)

#### Roles de Firma (Firm OS - FirmRole)
- `firm_owner` - Propietario de firma (acceso total a su firma)
- `partner` - Socio de firma
- `senior_lawyer` - Abogado sénior
- `lawyer` - Abogado regular
- `paralegal` - Auxiliar jurídico
- `assistant` - Asistente
- `finance` - Personal de finanzas
- `hr` - Personal de RRHH

### 4.4 Control de Acceso

**Sistema de RBAC (Role-Based Access Control):**
- Definido en `models/rbac.py`
- Matriz de permisos por rol
- Módulos asociados a cada rol
- Middleware en `routes/auth.py` que valida permisos

**Protección de Rutas:**
- `ProtectedRoute` - Requiere autenticación
- `RoleRoute` - Requiere rol específico
- `TenantRoute` - Requiere tenant específico
- Multi-tenancy con scoping en security/tenant_scope.py

### 4.5 Seguridad Adicional

- **CORS:** Configurado en server.py
- **Rate Limiting:** En utils/rate_limiter.py (por operación)
- **Audit Logging:** En utils/audit.py (auditoría maestro)
- **Error Tracking:** En utils/error_tracker.py
- **Ownership checks:** En security/ownership.py
- **Tenant isolation:** En security/tenant_scope.py

---

## 5. BASE DE DATOS - MONGODB

### 5.1 Conexión

- **Driver:** Motor (AsyncIO Motor Client)
- **Base de datos:** Configurada en .env (DB_NAME)
- **URL:** MONGO_URL en .env

### 5.2 Colecciones Principales

| Colección | Documentos | Propósito |
|-----------|-----------|----------|
| **users** | Usuarios | Abogados, admins, propietarios de firma |
| **firms** | Firmas jurídicas | Con campos trial_status, trial_started_at, trial_ends_at |
| **cases** | Casos jurídicos | Asignados a abogados |
| **leads** | Leads/prospectos | Del CRM |
| **organizations** | Organizaciones | Punto Cero OS (multi-tenant) |
| **os_subscriptions** | Suscripciones | De organizaciones (Punto Cero OS) |
| **partners** | Partners | Agentes comerciales |
| **implementations** | Implementaciones | Onboarding de clientes |
| **invoices** | Facturas | Generadas por abogados/firmas |
| **clients** | Clientes | Directorio de clientes por abogado |
| **appointments** | Citas | Eventos de agenda |
| **meetings** | Reuniones | Reuniones completadas |
| **messages** | Mensajes | Comunicación interna |
| **documents** | Documentos | Metadatos (archivos en Drive) |
| **commissions** | Comisiones | Splits de ingresos |
| **transactions** | Transacciones de pago | Pagos procesados |
| **receipts** | Comprobantes | Pagos manuales |
| **refunds** | Reembolsos | Devoluciones de pagos |
| **webhook_events** | Webhooks | Eventos de gateways (Mercado Pago, PayPal) |
| **webhook_logs** | Logs de webhooks | Registro de procesamiento |
| **audit_logs** | Auditoría | Acciones de admin maestro |
| **notifications** | Notificaciones | Alertas en app |
| **case_activities** | Actividades | Acciones dentro de casos |
| **timeline_events** | Timeline | Eventos del ecosistema |
| **firm_registrations** | Registros | Historial de registros de firma |
| **backups** | Backups | Registros de backups a Drive |
| **leads** | Leads | Prospectos de CRM |
| **kpi_metrics** | KPIs | Métricas consolidadas |

### 5.3 Índices Críticos

Creados en server.py (on_event startup):

```python
# Transacciones de pago
transactions.payment_id (unique)
transactions.user_email
transactions.status
transactions.created_at
transactions.plan_id
transactions.type

# Usuarios
users.email (unique)
users.plan_id
users.subscription_status
users.created_at

# Comprobantes de pago
receipts.user_id
receipts.status
receipts.created_at

# Auditoría
audit_logs.action
audit_logs.created_at

# Webhooks
webhook_events.event_id (unique)
webhook_events.type
webhook_events.processed
webhook_events.created_at
webhook_logs.event_id
webhook_logs.type
webhook_logs.result_status
webhook_logs.created_at

# Reembolsos
refunds.refund_id (unique)
refunds.payment_id
refunds.created_at
```

---

## 6. SERVICIOS DE NEGOCIO (backend/services/)

| Servicio | Archivo | Responsabilidad |
|----------|---------|-----------------|
| **Suscripción** | `subscription_service.py` | Gestión de suscripciones (Punto Cero OS) |
| **Facturación** | `billing_service.py` | Lógica de facturación |
| **Comisiones** | `commission_service.py` | Cálculo y distribución de comisiones |
| **Renovación** | `renewal_service.py` | Renovación automática de suscripciones |
| **Pagos** | `payment_provider_service.py` | Integración con gateways (Mercado Pago, PayPal, Stripe) |
| **Cron Jobs** | `cron_jobs.py` | Tareas programadas (renovaciones diarias, expiración de trials) |
| **Organización** | `organization_service.py` | Gestión de organizaciones (multi-tenant) |
| **Partners** | `partner_service.py` | Gestión de partners |
| **Implementación** | `implementation_service.py` | Seguimiento de implementaciones |
| **Analítica** | `analytics_service.py` | Cálculo de métricas |
| **IA - Engines** | `ai_engines.py` | Motores de IA (scoring, recomendaciones) |
| **IA - Scoring** | `ai_scoring_engine.py` | Scoring de leads |
| **IA - Optimización** | `ai_optimization_engine.py` | Optimización de procesos |
| **IA - Asignación** | `autonomous_decision_engine.py` | Decisiones autónomas |
| **IA - Orquestación** | `autonomous_orchestrator.py` | Orquestación de procesos autónomos |
| **Red Global** | `global_network_service.py` | Routing internacional |
| **OS Legal** | `legal_os_core.py` | Core del sistema operativo legal |
| **IA Engines Legal** | `legal_os_engines.py` | Motores para Legal OS |
| **Trial** | `trial_service.py` | Gestión de trials de 7 días (nuevo) |
| **Webhooks** | `webhook_handler.py` | Manejo de webhooks de pagos |

---

## 7. UTILIDADES (backend/utils/)

| Utilidad | Archivo | Función |
|----------|---------|---------|
| **Autenticación** | `auth.py` | Hash de contraseña, JWT, validación |
| **RBAC** | `rbac.py` | Validación de permisos, decoradores |
| **Tenant** | `tenant.py` | Multi-tenancy, scoping de queries |
| **Notificador** | `notifier.py` | Envío de emails, SMS, notificaciones app |
| **Expediente** | `expediente.py` | Gestión de expedientes (carpetas de Google Drive) |
| **Auditoría** | `audit.py` | Logging de acciones de admin |
| **Respuestas** | `responses.py` | Helpers para respuestas HTTP |
| **Rate Limiter** | `rate_limiter.py` | Límite de requests por operación |
| **Error Tracker** | `error_tracker.py` | Tracking de errores |
| **Drive Service** | `drive_service.py` | Integración con Google Drive |
| **Case Number** | `case_number_generator.py` | Generación de números de caso |

---

## 8. MIDDLEWARE

| Middleware | Archivo | Función |
|-----------|---------|---------|
| **Mode Resolver** | `middleware/mode_resolver.py` | Detecta modo (demo, producción) |
| **Permission Layer** | `middleware/permission_layer.py` | Validación de permisos (capa global) |

---

## 9. CRON JOBS Y AUTOMATIZACIÓN

**Archivo:** `backend/services/cron_jobs.py`

**Scheduler:** `CronScheduler` - Async event loop

**Tareas Programadas:**

| Frecuencia | Tarea |
|-----------|-------|
| Diariamente (00:00 UTC) | Renovación automática de suscripciones |
| Diariamente (00:00 UTC) | Reintento de renovaciones fallidas |
| Diariamente (00:00 UTC) | **Marcar suscripciones expiradas** |
| Diariamente (00:00 UTC) | **Expiración de trials (NUEVO)** |
| Cada 6 horas | Notificación de vencimiento próximo (7 días) |
| Semanalmente (lunes 02:00 UTC) | Limpieza de webhooks antiguos |

---

## 10. AUTENTICACIÓN Y ACCESO A DATOS

### 10.1 Flujo de Acceso Típico

```
1. Usuario hace login
2. Backend valida credenciales en DB
3. Backend genera JWT
4. Frontend almacena JWT en localStorage
5. Siguientes requests incluyen Authorization: Bearer <JWT>
6. Middleware get_current_user valida JWT
7. Extrae user_id, role, firm_id, organization_id
8. Queries se filtran por tenant/firma/usuario (según contexto)
```

### 10.2 Protección a Nivel de Ruta

```python
# Requiere autenticación
@router.get("/my-data")
async def get_data(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    # current_user contiene: _id, email, role, firm_id, organization_id, etc.
    pass

# Requiere rol específico
if current_user.get("role") not in ["admin", "admin_general"]:
    raise HTTPException(403, "Acceso denegado")

# Requiere tenant
if not current_user.get("organization_id"):
    raise HTTPException(400, "Operación sin tenant no permitida")
```

### 10.3 Scoping de Datos

Cada query se filtra automáticamente por:
- `user_id` - Si es abogado, ve solo sus datos
- `firm_id` - Si es firm_owner, ve solo su firma
- `organization_id` - Si es multi-tenant, ve solo su organización

---

## 11. FLUJOS PRINCIPALES IDENTIFICADOS

### 11.1 Flujo de Registro Público de Firma

```
Landing Page → Formulario FirmOSPreviewBlock
    ↓
POST /api/firms/register (sin autenticación)
    ↓
Backend:
  1. Valida duplicados (email, NIT)
  2. Crea documento en colección firms
  3. Crea usuario firm_owner (status PENDING_ACTIVATION)
  4. Crea trial automático (trial_status: "active", 7 días)
  5. Envía email de confirmación (menciona trial)
  6. Retorna FirmResponse con datos de trial
    ↓
Frontend: Muestra éxito
    ↓
Admin Dashboard:
  - Firma aparece en FirmsOverview (estado PENDING_VERIFICATION)
  - Columna Trial muestra "Activo"
  - Columna "Días Restantes" muestra 7 días
    ↓
Admin hace click "Aprobar"
    ↓
POST /api/firms/{id}/approve
    ↓
Backend:
  - Firma: status = ACTIVE
  - User: activation_token generado (válido 24h)
  - Email enviado con token de activación
    ↓
firm_owner recibe email → Activa firma
    ↓
Frontend: /activate-firm?token=XXX
    ↓
Frontend crea contraseña
    ↓
POST /api/firms/activate-account
    ↓
Backend:
  - User: password_hash = hashed(password)
  - User: status = ACTIVE
  - Firma: status = ACTIVE
    ↓
firm_owner puede hacer login
    ↓
Acceso a Firm OS (dashboard, casos, abogados, etc)
```

### 11.2 Flujo de Trial Automático

```
Firma se registra
    ↓
trial_status = "active"
trial_started_at = NOW
trial_ends_at = NOW + 7 días
    ↓
Cron Job Diario (00:00 UTC):
  ↓
  check_and_expire_trials() ejecuta
  ↓
  Busca: trial_status="active" Y trial_ends_at <= NOW
  ↓
  Para cada trial vencido:
    - UPDATE: trial_status = "expired"
    - UPDATE: subscription_status = "expired"
  ↓
Dashboard Admin:
  - Automáticamente muestra "Expirado"
  - Columna "Días Restantes" muestra 0
  - Logs en servidor
```

### 11.3 Flujo de Login

```
LoginPage → Ingresa email + password
    ↓
POST /api/auth/login
    ↓
Backend:
  1. Busca usuario por email
  2. Valida contraseña con hash
  3. Genera JWT
  4. Retorna JWT + datos de usuario
    ↓
Frontend:
  - Almacena JWT en localStorage (cifrado)
  - Extrae role, firm_id, organization_id
  - Redirige a dashboard según rol
    ↓
Siguientes requests:
  - Header: Authorization: Bearer <JWT>
  - Middleware: get_current_user valida JWT
  - Datos filtrados según contexto
```

### 11.4 Flujo de Pago (Mercado Pago/PayPal)

```
Usuario en CheckoutPage
    ↓
Selecciona plan + país + ciclo
    ↓
POST /api/payment/init
    ↓
Backend:
  - Calcula precio localizado (COP, USD, etc)
  - Crea preferencia en Mercado Pago o genera checkout PayPal
  - Retorna URL de checkout
    ↓
Frontend: Redirige a gateway (Mercado Pago / PayPal)
    ↓
Usuario completa pago
    ↓
Gateway: Webhook POST → backend
    ↓
Backend:
  - Valida webhook signature
  - Crea documento en transactions
  - Actualiza user: subscription_status = "active"
  - Envía email de confirmación
    ↓
Siguiente login: Usuario ve "PAGADO" en dashboard
```

---

## 12. COMPONENTES Y PATRONES REUTILIZABLES

### 12.1 Componentes UI más usados

- **DashboardLayout** - Layout base de todos los dashboards
- **Sidebar** - Navegación lateral (módulos, menú)
- **ProtectedRoute** - Validación de autenticación en rutas
- **Dialog** / **Modal** - Diálogos de Radix UI
- **Table** - Tablas de datos
- **Button**, **Input**, **Select**, **Checkbox** - Primitivos

### 12.2 Patrones de API

**Patrón de respuesta exitosa:**
```python
{
  "success": True,
  "data": {...}
}
```

**Patrón de error:**
```python
HTTPException(status_code=400, detail="Mensaje de error")
```

**Patrón de paginación:**
```python
{
  "data": [...],
  "total": 100,
  "page": 1,
  "per_page": 20
}
```

---

## 13. MAPEO COMPLETO DE RUTAS API

### Prefijo Base
Todas las rutas: `GET/POST/PATCH/DELETE /api/{ruta}`

### Rutas de Autenticación
```
POST   /api/auth/login              → Login
POST   /api/auth/logout             → Logout
POST   /api/auth/refresh            → Refresh token
POST   /api/auth/change-password    → Cambiar contraseña
```

### Rutas de Firmas (CON TRIAL)
```
POST   /api/firms/register          → Registrar firma con trial automático
POST   /api/firms/register-lead     → Registrar como lead (flujo alternativo)
GET    /api/firms                   → Listar todas (admin)
GET    /api/firms/{id}              → Obtener firma
PATCH  /api/firms/{id}              → Actualizar firma
POST   /api/firms/{id}/approve      → Aprobar firma
POST   /api/firms/{id}/reject       → Rechazar firma
POST   /api/firms/{id}/activate-account → Activar cuenta con token
GET    /api/firms/trial/summary     → Resumen de trials (admin)
GET    /api/firms/{id}/trial        → Estado del trial de una firma
GET    /api/firms/{id}/lawyers      → Abogados de la firma
GET    /api/firms/{id}/cases        → Casos de la firma
GET    /api/firms/{id}/clients      → Clientes de la firma
GET    /api/firms/{id}/financial    → Finanzas de la firma
```

### Rutas de Casos
```
POST   /api/cases                   → Crear caso
GET    /api/cases                   → Listar casos
GET    /api/cases/{id}              → Obtener caso
PATCH  /api/cases/{id}              → Actualizar caso
DELETE /api/cases/{id}              → Eliminar caso
POST   /api/cases/{id}/activities   → Agregar actividad
GET    /api/cases/{id}/activities   → Listar actividades
```

### Rutas de Usuarios
```
GET    /api/users                   → Listar usuarios (admin)
GET    /api/users/{id}              → Obtener usuario
PATCH  /api/users/{id}              → Actualizar usuario
```

### Rutas de Pagos
```
GET    /api/payment/config          → Configuración de pagos (planes, precios)
POST   /api/payment/init            → Iniciar pago
GET    /api/payment/status          → Estado de suscripción
POST   /api/payment/process         → Procesar pago
POST   /api/payment/webhook         → Webhook de Mercado Pago
```

### Rutas de Suscripciones (Punto Cero OS)
```
GET    /api/subscriptions           → Listar suscripciones
POST   /api/subscriptions           → Crear suscripción
GET    /api/subscriptions/{id}      → Obtener suscripción
PATCH  /api/subscriptions/{id}      → Actualizar suscripción
```

### Rutas de Análisis
```
GET    /api/analytics/dashboard     → Dashboard de análisis
GET    /api/analytics/metrics       → Métricas consolidadas
GET    /api/analytics/revenue       → Ingresos
```

### Rutas Admin Maestro
```
GET    /api/admin/audit-logs        → Logs de auditoría
POST   /api/admin/action            → Ejecutar acción de admin
GET    /api/admin/system-status     → Estado del sistema
```

### Rutas de IA
```
POST   /api/ai/chat                 → Chat con IA (Gemini)
POST   /api/ai/analyze              → Análisis de IA
GET    /api/ai-autopilot/assign-lead/{id} → Asignar lead a abogado automáticamente
GET    /api/ai-operations/recommend-lawyers/{id} → Recomendar abogados
```

### Rutas de Documentos
```
POST   /api/documents               → Crear documento
GET    /api/documents               → Listar documentos
GET    /api/documents/{id}          → Obtener documento
DELETE /api/documents/{id}          → Eliminar documento
```

(Total: 40+ rutas endpoints)

---

## 14. DASHBOARDS IDENTIFICADOS

### 14.1 Dashboards en Admin OS

| Dashboard | Archivo | Propósito |
|-----------|---------|----------|
| **Executive Dashboard** | `ExecutiveDashboard.jsx` | Panel ejecutivo (KPIs, gráficos) |
| **Firms Overview** | `FirmsOverview.jsx` | Vista general de firmas (actualizado con trial) |
| **Users Dashboard** | `UsersDashboard.jsx` | Gestión de usuarios |
| **Financial Dashboard** | `FinancialDashboard.jsx` | Finanzas consolidadas |
| **Pending Firms Center** | `PendingFirmsCenter.jsx` | Firmas pendientes de aprobación |
| **Sales Command Center** | `SalesCommandCenter.jsx` | Centro de ventas |
| **AI Command Center** | `AICommandCenter.jsx` | Control de IA |
| **Autonomous Control** | `AutonomousControl.jsx` | Control autónomo |
| **Cases Portal** | `CasesPortal.jsx` | Portal de casos |
| **Global Network** | `GlobalNetwork.jsx` | Red global |
| **LegalOS** | `LegalOS.jsx` | Sistema operativo legal |
| **Master Control** | `MasterControl.jsx` | Control maestro |
| **Implementation Dashboard** | (en implementations/) | Seguimiento de implementaciones |
| **Analytics Dashboard** | `AnalyticsDashboard.jsx` | Analítica consolidada |
| **Billing Dashboard** | `BillingDashboard.jsx` | Facturación |
| **Subscriptions Dashboard** | `SubscriptionsDashboard.jsx` | Suscripciones |
| **Organizations Dashboard** | `OrganizationsDashboard.jsx` | Organizaciones (multi-tenant) |
| **Partners Dashboard** | `PartnersDashboard.jsx` | Partners |
| **Notifications Dashboard** | `NotificationsDashboard.jsx` | Notificaciones |
| **Commercial AI Dashboard** | `CommercialAIDashboard.jsx` | IA comercial |

### 14.2 Dashboards en Firm OS

| Dashboard | Archivo | Propósito |
|-----------|---------|----------|
| **Firm Dashboard** | `FirmDashboard.jsx` | Dashboard principal de firma |
| **Firm Cases** | `FirmCases.jsx` | Casos de la firma |
| **Firm Lawyers** | `FirmLawyers.jsx` | Abogados de la firma |
| **Firm Finance** | `FirmFinance.jsx` | Finanzas de la firma |
| **Firm Analytics** | `FirmAnalytics.jsx` | Análisis de la firma |
| **Firm Settings** | `FirmSettings.jsx` | Configuración de firma |
| **Firm Team** | `FirmTeam.jsx` | Equipo de la firma |
| **Billing Enterprise** | `BillingEnterprise.jsx` | Facturación empresarial |
| **CRM Enterprise** | `CRMEnterprise.jsx` | CRM empresarial |
| **Onboarding Wizard** | `OnboardingWizardFirm.jsx` | Wizard de onboarding |

---

## 15. CONTEXTO DE MULTI-TENANCY

### 15.1 Niveles de Tenancy

**Nivel 1: Abogado Individual**
- Datos propios: casos, clientes, facturas, leads
- Acceso: Solo él

**Nivel 2: Firma (Firm OS)**
- Datos de la firma: abogados, equipos, configuración
- Acceso: firm_owner + abogados de la firma

**Nivel 3: Organización (Punto Cero OS)**
- Datos de la organización: suscripciones, facturación, partners
- Acceso: Usuarios de la organización

**Nivel 4: Sistema Global (Admin Maestro)**
- Acceso a todo: firmas, organizaciones, usuarios
- Auditoría completa

### 15.2 Scoping en Queries

```python
# Abogado: ve solo sus datos
query = {"lawyer_id": str(current_user["_id"])}

# Firm owner: ve solo su firma
query = {"firm_id": firm_id}

# Organization user: ve solo su organización
query = {"organization_id": str(current_user["organization_id"])}

# Admin: ve todo (o filtra por parámetro)
```

---

## 16. INTEGRACIONES EXTERNAS

### 16.1 Pasarelas de Pago
- **Mercado Pago** - Pagos en Latinoamérica
- **PayPal** - Pagos globales
- **Stripe** - Mencionado pero no claramente integrado

### 16.2 Servicios de Comunicación
- **Email (SMTP)** - Mediante notifier.py
- **WhatsApp (Meta)** - Mediante notifier.py
- **SMS** - Disponible mediante notifier.py

### 16.3 IA y LLMs
- **Gemini (Google)** - Chat IA, análisis
- **API Key configurada** - En .env

### 16.4 Almacenamiento
- **Google Drive** - Para documentos y expedientes
- **Service Account** - Autenticación automática

### 16.5 Webhooks
- **Mercado Pago webhooks** - Confirmación de pago
- **PayPal webhooks** - Confirmación de pago

---

## 17. CONFIGURACIÓN Y VARIABLES DE ENTORNO

### Frontend (.env)
```
REACT_APP_API_URL         - URL del API backend
REACT_APP_STORAGE_KEY     - Clave para encriptar token (opcional)
```

### Backend (.env)
```
MONGO_URL                 - Conexión a MongoDB
DB_NAME                   - Nombre de la BD
JWT_SECRET                - Clave para firmar JWT
ADMIN_EMAIL               - Email del admin principal
ADMIN_WHATSAPP_NUMBER     - Número WhatsApp del admin
GOOGLE_DRIVE_CREDENTIALS  - JSON de service account Drive
MERCADO_PAGO_TOKEN        - Token de Mercado Pago
PAYPAL_CLIENT_ID          - Client ID de PayPal
GEMINI_API_KEY            - API Key de Google Gemini
```

---

## 18. ESTADO ACTUAL DE IMPLEMENTACIÓN DE TRIAL

### Cambios Realizados (último sprint)

**Backend:**
- Modelo `Firm`: +5 campos (trial_status, trial_started_at, trial_ends_at, subscription_status, subscription_plan)
- Endpoint `POST /firms/register`: Crea trial automático (7 días)
- Nuevos endpoints: `GET /firms/trial/summary`, `GET /firms/{id}/trial`
- Servicio `trial_service.py`: Lógica de cálculo y expiración
- Cron job: `check_and_expire_trials()` ejecuta diariamente (00:00 UTC)

**Frontend:**
- Dashboard `FirmsOverview.jsx`: +2 columnas (Trial, Días Restantes)
- Dashboard `FirmsOverview.jsx`: +2 KPIs (Trials Activos, Próximos a Vencer)
- Cálculo automático: `trial_remaining_days` desde `trial_ends_at`

**Base de Datos:**
- Colección `firms`: Nuevos campos añadidos
- No se requieren índices especiales

**Email:**
- Template actualizado: Menciona "Prueba Gratuita de 7 Días Activada"

---

## 19. ARCHIVOS PRINCIPALES DEL PROYECTO

### Frontend
- `frontend/src/App.jsx` - Componente raíz
- `frontend/src/index.js` - Entry point
- `frontend/src/config/api.js` - Configuración de API
- `frontend/src/contexts/AuthContext.jsx` - Autenticación global
- `frontend/src/modules/admin/AdminModule.jsx` - Módulo Admin
- `frontend/src/modules/firm-os/FirmOSModule.jsx` - Módulo Firm OS

### Backend
- `backend/server.py` - FastAPI app, rutas principales
- `backend/routes/auth.py` - Autenticación
- `backend/routes/firms.py` - Firmas (con trial)
- `backend/models/firm.py` - Modelo de firma
- `backend/models/rbac.py` - Roles y permisos
- `backend/services/trial_service.py` - Gestión de trials
- `backend/services/cron_jobs.py` - Tareas automáticas
- `backend/utils/auth.py` - Helpers de autenticación
- `backend/security/tenant_scope.py` - Multi-tenancy

---

## 20. RESUMEN EJECUTIVO

### Arquitectura Actual

**Punto Cero Legal** es una plataforma multi-tenant SaaS con:

1. **Frontend:** React 19 con 40+ módulos UI/UX
2. **Backend:** FastAPI async con 41 archivos de rutas
3. **BD:** MongoDB con 25+ colecciones
4. **Autenticación:** JWT con RBAC y multi-tenancy
5. **Pagos:** Integración con Mercado Pago y PayPal
6. **IA:** Gemini para chat y scoring
7. **Almacenamiento:** Google Drive para documentos
8. **Automatización:** Cron jobs diarios (renovaciones, expiración de trials)

### Módulos Principales

- **Admin OS:** Control maestro del sistema
- **Firm OS:** Sistema operativo para firmas jurídicas
- **Multi-Tenant:** Organizaciones, partners, implementaciones
- **Pagos:** Facturación y comisiones
- **IA:** Asignación automática, scoring, recomendaciones
- **Docs:** Expedientes en Google Drive

### Capacidades Actuales

✅ Registro de usuarios (abogados, admins, propietarios)
✅ Registro público de firmas (con trial de 7 días)
✅ Sistema de casos con clientes y documentos
✅ Facturación e invoices
✅ Pagos integrados (Mercado Pago, PayPal)
✅ Control de acceso multi-nivel (RBAC)
✅ Multi-tenancy (organizaciones, partners)
✅ IA para scoring y recomendaciones
✅ Backup automático a Google Drive
✅ Auditoría de acciones de admin
✅ Webhooks para eventos de pago

### Trial de 7 Días (Implementado)

✅ Creación automática al registrar firma
✅ Almacenamiento en BD (trial_status, fechas)
✅ Visualización en dashboard (columnas, KPIs)
✅ Expiración automática diariamente (00:00 UTC)
✅ Cálculo automático de días restantes
✅ Email de confirmación menciona trial

---

## CONCLUSIÓN

El proyecto **Punto Cero Legal** es una plataforma compleja y madura con múltiples módulos, integraciones y capacidades avanzadas. La arquitectura está bien estructurada con separación clara de responsabilidades (routes, models, services, utils). La seguridad incluye JWT, RBAC, multi-tenancy y auditoría.

La implementación del Trial de 7 días sigue los patrones existentes del proyecto y está completamente integrada sin crear duplicaciones ni nuevos sistemas.

