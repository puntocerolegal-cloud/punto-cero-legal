# MAPA ARQUITECTÓNICO UNIFICADO - PUNTO CERO LEGAL

**Fecha:** 26 de Junio, 2025
**Propósito:** Visión consolidada del sistema como todo integrado
**Alcance:** Análisis de estructura sin modificaciones

---

## 1. ARQUITECTURA GLOBAL DEL SISTEMA

### Diagrama Conceptual de Capas

```
┌────────────────────────────────────────────────────────────┐
│                     INTERNET / USUARIOS                     │
└────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────┐
│                  FRONTEND (React 19)                        │
│  ┌─────────────┬─────────────┬─────────────┬──────────────┐│
│  │  Landing    │   Login     │  Dashboard  │   Modules    ││
│  │   Page      │   Page      │   Home      │  (40+ UI)    ││
│  └─────────────┴─────────────┴─────────────┴──────────────┘│
│                        ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Auth Context │ Case Context │ Subscription Context      ││
│  │  (JWT Token) │  (Casos)     │  (Plan actual)            ││
│  └─────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────┘
                              ↓ Axios
                        API GATEWAY
                         /api/v1
                              ↓
┌────────────────────────────────────────────────────────────┐
│              BACKEND (FastAPI Async)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 41 Routes (auth, firms, cases, users, payments, etc)│  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Middleware: Auth, RBAC, Tenant Scoping, Rate Limit  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Services (20): Subscription, Billing, IA, Cron      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Models (20): User, Firm, Case, Lead, Payment, etc   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────┐
│           DATA LAYER (MongoDB + Motor)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 25+ Colecciones (users, firms, cases, leads, etc)   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Índices estratégicos (email, status, created_at)    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────┐
│         EXTERNAL SERVICES & INTEGRATIONS                    │
│ ┌──────────────┬──────────────┬──────────────┬───────────┐ │
│ │ Mercado Pago │ Google Drive  │ Google Gemini│  WhatsApp │ │
│ │  (Pagos)     │  (Documentos) │    (IA)      │ (Alertas) │ │
│ └──────────────┴──────────────┴──────────────┴───────────┘ │
└────────────────────────────────────────────────────────────┘
```

### Separación Frontend / Backend

```
FRONTEND (React 19)                    BACKEND (FastAPI)
├── Pages (13)                         ├── Routes (41)
├── Modules (14+)                      ├── Models (20)
├── Components (200+)                  ├── Services (20)
├── Contexts (4)                       ├── Middlewares (2)
├── UI Components (Radix)              ├── Utils (11)
└── Static Assets                      └── Security Layer
      ↓                                       ↓
  /public/              Axios            MongoDB
                        /api/            (Colecciones)
```

---

## 2. ENTIDADES PRINCIPALES Y RELACIONES

### 2.1 Usuario (BASE - Core Entity)

**Dónde vive:**
- Colección: `users` (MongoDB)
- Modelo: `User` (backend/models/user.py)
- Contexto: `AuthContext` (frontend)

**Propiedades:**
```
{
  _id: ObjectId
  email: String (unique)
  password_hash: String
  full_name: String
  role: "admin_general" | "admin" | "super_admin"
  status: "ACTIVE" | "PENDING_ACTIVATION"
  is_verified: Boolean
  created_at: DateTime
  updated_at: DateTime
  
  # Multi-tenant fields:
  organization_id: String (si pertenece a Punto Cero OS)
  firm_id: String (si es abogado o firm_owner)
}
```

**Usado por:**
- AuthContext (login)
- Dashboard (mostrar usuario actual)
- RBAC (control de permisos)
- Auditoría (logs de acciones)

**Relaciones:**
```
Usuario ────owns───→ Casos (si es abogado)
Usuario ────owns───→ Firma (si es firm_owner)
Usuario ────belongs_to───→ Organización (si es multi-tenant)
Usuario ────has───→ Rol (RBAC)
```

---

### 2.2 Abogado (Lawyer - Specialized User)

**Dónde vive:**
- Colección: `users` (con role="lawyer" o similar)
- Modelo: Usa modelo `User` con extensiones
- Dashboard: `DashboardHome.jsx`, módulo admin

**Propiedades Adicionales:**
```
{
  ...User fields...
  role: "lawyer" | "senior_lawyer" | "paralegal"
  bar_number: String (número de colegiación)
  specialty: String (especialidad)
  organization_id: String (si es de una organización)
}
```

**Usado por:**
- Casos (asignación de abogados)
- Clientes (asociación)
- Invoices (generación de facturas)
- Comisiones (tracking de ingresos)
- IA (scoring y recomendación)

**Relaciones:**
```
Abogado ────manages───→ Casos (1:N)
Abogado ────owns───→ Clientes (1:N)
Abogado ────generates───→ Invoices (1:N)
Abogado ────receives───→ Comisiones (1:N)
Abogado ────belongs_to───→ Firma (N:1)
```

---

### 2.3 Firma (Firm - Business Entity)

**Dónde vive:**
- Colección: `firms` (MongoDB)
- Modelo: `Firm` (backend/models/firm.py) - **ACTUALIZADO CON TRIAL**
- Dashboard: `FirmsOverview.jsx`, módulo admin

**Propiedades:**
```
{
  _id: ObjectId
  name: String
  nit: String (unique)
  email: String
  phone: String
  address: String
  city: String
  country: String
  
  # Plan & Status
  plan: "firm_growth" | "firm_enterprise"
  status: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "REJECTED"
  is_verified: Boolean
  
  # Ownership
  owner_id: String (referencias a User)
  owner_name: String
  owner_email: String
  
  # Trial (IMPLEMENTADO)
  trial_status: "active" | "expired" | "not_started"
  trial_started_at: DateTime
  trial_ends_at: DateTime
  subscription_status: "trial" | "paid" | "expired"
  subscription_plan: "trial" | "firm_growth" | "firm_enterprise"
  
  # Timestamps
  created_at: DateTime
  updated_at: DateTime
  approval_date: DateTime
  
  # Metadata
  max_lawyers: Number (5 o 10 según plan)
  active_lawyers_count: Number
}
```

**Usado por:**
- FirmsOverview (listado y gestión)
- Firm OS (dashboard y settings)
- Trial Service (expiración automática)
- Email (confirmación de registro)

**Relaciones:**
```
Firma ────has_owner───→ Usuario (1:1)
Firma ────has_lawyers───→ Abogados (1:N)
Firma ────manages───→ Casos (1:N)
Firma ────has_trial───→ Trial (1:1)
```

---

### 2.4 Admin (Admin User - Global Entity)

**Dónde vive:**
- Colección: `users` (con role="admin" o "admin_general")
- Modelo: `User` con role específico
- Dashboard: `ExecutiveDashboard.jsx`, `MasterControl.jsx`

**Propiedades Especiales:**
```
{
  ...User fields...
  role: "admin" | "admin_general"
  can_manage_firms: Boolean
  can_manage_payments: Boolean
  can_access_audit_logs: Boolean
}
```

**Acciones Posibles:**
- Aprobar/rechazar firmas
- Gestionar usuarios
- Ver auditoría completa
- Controlar IA
- Procesar pagos
- Resetear datos

**Relaciones:**
```
Admin ────approves───→ Firmas
Admin ────manages───→ Usuarios
Admin ────executes───→ Cron Jobs
Admin ────logs───→ Audit Logs
```

---

### 2.5 Suscripción (Subscription)

**Dónde vive (DOS MODELOS):**

**A) Punto Cero OS Subscriptions**
- Colección: `os_subscriptions`
- Modelo: `OSSubscription` (backend/models/os_subscription.py)
- Nivel: Organizaciones multi-tenant

**B) Trial de Firma (NUEVO)**
- Colección: `firms` (campos dentro)
- Modelo: Campos en `Firm`
- Nivel: Firmas individuales

**Propiedades (OS Subscription):**
```
{
  _id: ObjectId
  tenantId: String
  organizationId: String
  companyName: String
  vertical: String
  
  plan: "essential" | "professional" | "enterprise"
  status: "trial" | "active" | "pending" | "suspended" | "cancelled" | "expired"
  billingCycle: "monthly" | "quarterly" | "annual"
  
  usersIncluded: Number
  usersUsed: Number
  monthlyAmount: Float
  annualAmount: Float
  
  startDate: DateTime
  renewalDate: DateTime
  expirationDate: DateTime
  
  autoRenew: Boolean
}
```

**Propiedades (Trial de Firma):**
```
{
  trial_status: "active" | "expired"
  trial_started_at: DateTime
  trial_ends_at: DateTime
  subscription_status: "trial" | "paid"
  subscription_plan: "trial"
}
```

**Usado por:**
- Payment (validación)
- Billing (facturación)
- Renewal Service (renovación)
- Trial Service (expiración)
- Dashboard (visualización)

---

### 2.6 Caso (Case)

**Dónde vive:**
- Colección: `cases`
- Modelo: `Case` (backend/models/case.py)
- Dashboard: Módulo admin, Firm OS

**Propiedades:**
```
{
  _id: ObjectId
  case_number: String (unique)
  
  # Assignment
  lawyer_id: String
  firm_id: String
  organization_id: String
  
  # Client Info
  client_id: String
  client_name: String
  client_email: String
  client_phone: String
  
  # Case Details
  matter: String (descripción)
  status: "open" | "in_progress" | "closed"
  priority: "low" | "medium" | "high"
  
  # Financial
  billable_hours: Number
  hourly_rate: Float
  estimated_cost: Float
  
  # Timestamps
  created_at: DateTime
  updated_at: DateTime
  closed_at: DateTime
}
```

**Usado por:**
- Dashboard (listado)
- Expediente (almacenamiento docs en Drive)
- Invoices (generación de facturas)
- IA (análisis y scoring)

---

### 2.7 Pago (Payment / Transaction)

**Dónde vive:**
- Colección: `transactions`
- Modelo: Implícito en payment.py
- Proceso: Mercado Pago / PayPal

**Propiedades:**
```
{
  _id: ObjectId
  payment_id: String (unique)
  
  # Payer
  user_email: String
  user_id: String
  
  # Payment Details
  plan_id: String
  amount: Float
  currency: String
  billing_cycle: String
  
  # Status
  status: "pending" | "completed" | "failed" | "cancelled"
  
  # Gateway
  gateway: "mercado_pago" | "paypal"
  gateway_payment_id: String
  
  # Timestamps
  created_at: DateTime
  processed_at: DateTime
  
  # Type
  type: "new_subscription" | "renewal" | "plan_change"
}
```

**Usado por:**
- Payment router (procesamiento)
- Webhook handler (confirmación)
- Billing (reportes)
- Auditoría (tracking)

---

### 2.8 Trial (Trial - Estado en Firma)

**Estado Actual:** **EXISTE COMO CAMPOS EN FIRMA**, NO COMO ENTIDAD SEPARADA

**Dónde vive:**
- Dentro de colección `firms`
- Campos: `trial_status`, `trial_started_at`, `trial_ends_at`, `subscription_status`
- Servicio: `trial_service.py`

**Ciclo de Vida:**
```
1. CREACIÓN: Al registrar firma
   trial_status = "active"
   trial_started_at = NOW
   trial_ends_at = NOW + 7 días
   
2. MONITOREO: Dashboard muestra estado
   Columna "Trial" = "Activo"
   Columna "Días Restantes" = calculado dinámicamente
   
3. EXPIRACIÓN: Cron diaria (00:00 UTC)
   Si trial_ends_at <= NOW:
     trial_status = "expired"
     subscription_status = "expired"
   
4. VISUALIZACIÓN: Admin ve cambio automático
```

**Relación con Firma:**
```
Firma ────has_embedded───→ Trial
(No es relación 1:1 separada, está dentro del documento)
```

---

## 3. FLUJOS PRINCIPALES UNIFICADOS

### 3.1 FLUJO USUARIO ESTÁNDAR (Abogado Individual)

```
┌─────────────────────────────────────────────────────────────┐
│ START: Usuario descubre Punto Cero Legal                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Landing Page (LandingPage.jsx)                              │
│ - Información del sistema                                   │
│ - Botón: "Registrarse" o "Iniciar Sesión"                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
        ┌───────────────────────────────────┐
        │   RAMA A: REGISTRO NUEVO          │   RAMA B: LOGIN
        │                                   │
        ↓                                   ↓
┌──────────────────────┐      ┌────────────────────────┐
│ RegisterPage.jsx     │      │ LoginPage.jsx          │
│ POST /api/auth/      │      │ POST /api/auth/login   │
│   register           │      │                        │
│                      │      │ Email + Password       │
│ Email, Password,     │      └────────────────────────┘
│ Full Name            │             ↓
└──────────────────────┘      ┌──────────────────────┐
         ↓                    │ Backend Valida en BD │
┌──────────────────────┐      │ Genera JWT           │
│ Backend valida       │      └──────────────────────┘
│ - Email único        │             ↓
│ - Contraseña segura  │      ┌──────────────────────┐
│ - Hash y almacena    │      │ Frontend:            │
│ Usuario creado       │      │ localStorage.token   │
└──────────────────────┘      │ AuthContext.setUser  │
         ↓                    └──────────────────────┘
┌──────────────────────┐             ↓
│ Email de bienvenida  │      ┌──────────────────────┐
│ (sin trial)          │      │ DashboardHome.jsx    │
└──────────────────────┘      │ (Abogado)            │
         ↓                    │                      │
┌──────────────────────┐      │ - Casos (0)          │
│ Redirige a Login     │      │ - Clientes (0)       │
└──────────────────────┘      │ - Invoices (0)       │
         ↓                    │ - Leads (0)          │
    (Confluye aquí)           └──────────────────────┘
         │                           ↓
         └───────────────┬───────────┘
                         ↓
        ┌─────────────────────────────────┐
        │ AuthContext: Usuario autenticado│
        │ Token en localStorage            │
        │ Role: lawyer / admin / firm_owner│
        └─────────────────────────────────┘
                         ↓
        ┌─────────────────────────────────┐
        │ Dashboard Workflow Comienza      │
        │                                 │
        │ Abogado puede:                  │
        │ - Ver sus casos                 │
        │ - Crear nuevo caso              │
        │ - Ver clientes                  │
        │ - Generar invoices              │
        │ - Registrar horas (billable)    │
        │ - Ver comisiones                │
        └─────────────────────────────────┘
                         ↓
        ┌─────────────────────────────────┐
        │ Si necesita pago:                │
        │ CheckoutPage.jsx                │
        │ → Mercado Pago/PayPal           │
        │ → Webhook confirma              │
        │ → subscription_status: "active" │
        └─────────────────────────────────┘
```

---

### 3.2 FLUJO FIRMA (PUBLIC REGISTRATION CON TRIAL)

```
┌────────────────────────────────────────────────────────────┐
│ START: Firma descubre landing page                         │
└────────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────┐
│ LandingPage.jsx                                            │
│ - "Programa para Firmas Jurídicas"                         │
│ - FirmOSPreviewBlock (con Trial de 7 días mencionado)     │
│ - Botón: "Registrar mi firma"                             │
└────────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────┐
│ Modal/Form FirmOSPreviewBlock.jsx                          │
│                                                             │
│ Campos solicitados:                                        │
│ - Nombre de firma                                          │
│ - NIT                                                      │
│ - Email                                                    │
│ - Teléfono                                                 │
│ - País                                                     │
│ - Plan: firm_growth / firm_enterprise                      │
│ - Nombre contacto                                          │
│ - Email contacto                                           │
│ - Teléfono contacto                                        │
│ - Documento contacto                                       │
│ - Tarjeta profesional                                      │
└────────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────┐
│ POST /api/firms/register (SIN AUTENTICACIÓN)               │
│                                                             │
│ Backend PASO 1: Validaciones                               │
│ - Email firma no duplicado                                 │
│ - NIT no duplicado                                         │
│ - Email contacto no duplicado                              │
│                                                             │
│ Backend PASO 2: Crear Firma con TRIAL                      │
│ {                                                          │
│   status: "PENDING_VERIFICATION",                          │
│   plan: "firm_growth",                                     │
│   trial_status: "active",            ← NUEVO              │
│   trial_started_at: NOW,              ← NUEVO              │
│   trial_ends_at: NOW + 7 días,        ← NUEVO              │
│   subscription_status: "trial",       ← NUEVO              │
│   subscription_plan: "trial"          ← NUEVO              │
│ }                                                          │
│                                                             │
│ Backend PASO 3: Crear Usuario firm_owner                   │
│ {                                                          │
│   role: "firm_owner",                                      │
│   status: "PENDING_ACTIVATION",                            │
│   password_hash: null                                      │
│ }                                                          │
│                                                             │
│ Backend PASO 4: Email de bienvenida                        │
│ "Tu firma fue registrada con PRUEBA GRATUITA DE 7 DÍAS"   │
│                                                             │
│ Retorna: FirmResponse + datos de trial                     │
└────────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────┐
│ Frontend: Muestra modal de éxito                           │
│ "¡Registro exitoso! Revisa tu email"                       │
└────────────────────────────────────────────────────────────┘
                         ↓
        ┌──────────────────────────────┐
        │ PARALELO: Admin ve firma     │
        │ en FirmsOverview.jsx         │
        │                              │
        │ Estado: PENDING_VERIFICATION │
        │ Trial: Activo                │
        │ Días: 7                      │
        │                              │
        │ Admin puede:                 │
        │ - Aprobar                    │
        │ - Rechazar                   │
        └──────────────────────────────┘
                         ↓
        ┌──────────────────────────────┐
        │ Admin: POST /api/firms/{id}/ │
        │   approve                    │
        │                              │
        │ Cambios:                     │
        │ - Firma: status = "ACTIVE"   │
        │ - User: activation_token     │
        │ - Email enviado con link     │
        └──────────────────────────────┘
                         ↓
        ┌──────────────────────────────┐
        │ Firma: Recibe email          │
        │ "Tu firma fue aprobada"      │
        │ Link: /activate-firm?token=X │
        │                              │
        │ Click → ActivateFirmPage     │
        │ - Crea contraseña            │
        │ - POST /api/firms/           │
        │    activate-account          │
        └──────────────────────────────┘
                         ↓
        ┌──────────────────────────────┐
        │ Backend:                     │
        │ - User: password_hash        │
        │ - User: status = "ACTIVE"    │
        │ - Firma: status = "ACTIVE"   │
        │                              │
        │ Trial sigue siendo:          │
        │ - trial_status: "active"     │
        │ - trial_ends_at: NOW+7d      │
        └──────────────────────────────┘
                         ↓
        ┌──────────────────────────────┐
        │ firm_owner hace LOGIN        │
        │ LoginPage.jsx                │
        │ email + password             │
        │                              │
        │ POST /api/auth/login         │
        │ JWT generado                 │
        └──────────────────────────────┘
                         ↓
        ┌──────────────────────────────┐
        │ ACCESO A FIRM OS             │
        │                              │
        │ FirmOSModule.jsx             │
        │ ├── Dashboard                │
        │ ├── Lawyers                  │
        │ ├── Cases                    │
        │ ├── Finance                  │
        │ ├── Analytics                │
        │ ├── Settings                 │
        │ └── Team                     │
        │                              │
        │ Durante 7 DÍAS: Trial activo │
        │ Acceso COMPLETO              │
        │ Sin restricciones            │
        └──────────────────────────────┘
                         ↓
        ┌──────────────────────────────┐
        │ CRON DIARIO (00:00 UTC)      │
        │ check_and_expire_trials()    │
        │                              │
        │ Busca: trial_ends_at <= NOW  │
        │ Actualiza:                   │
        │ - trial_status: "expired"    │
        │ - subscription_status:       │
        │    "expired"                 │
        │                              │
        │ Dashboard Admin:             │
        │ - Automáticamente cambia a   │
        │   "Expirado"                 │
        │ - Días = 0                   │
        └──────────────────────────────┘
                         ↓
        ┌──────────────────────────────┐
        │ OPCIONALES (No implementados)│
        │                              │
        │ - Bloqueo de acceso          │
        │ - Email de vencimiento       │
        │ - Upgrade page               │
        │ - Notificación al admin      │
        └──────────────────────────────┘
```

---

### 3.3 FLUJO ADMIN (Control Maestro)

```
┌────────────────────────────────────────────────────────────┐
│ START: Admin hace Login                                    │
└────────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────┐
│ LoginPage.jsx                                              │
│ Email (admin) + Password                                   │
│                                                             │
│ POST /api/auth/login                                       │
└────────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────┐
│ Backend: Valida en BD                                      │
│ user.role = "admin" o "admin_general"                      │
│ Genera JWT                                                 │
└────────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────┐
│ Frontend: AuthContext.setUser                              │
│ role = "admin_general" (acceso total)                      │
│                                                             │
│ Redirige a: AdminModule.jsx                                │
└────────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────┐
│ ADMIN OS (AdminModule.jsx)                                 │
│                                                             │
│ Sidebar Menu:                                              │
│ ├── Dashboard Ejecutivo                                    │
│ ├── Firmas                                                 │
│ │   ├── Overview (+ Trial columns)                         │
│ │   ├── Pendientes de Aprobación                          │
│ │   └── [Details]                                         │
│ ├── Usuarios                                               │
│ ├── Finanzas                                               │
│ ├── Pagos                                                  │
│ ├── IA & Automación                                        │
│ ├── Auditoría                                              │
│ └── Configuración                                          │
└────────────────────────────────────────────────────────────┘
                         ↓
        ┌──────────────────────────────────┐
        │ CASOS DE USO PRINCIPALES:        │
        │                                  │
        │ 1. GESTIÓN DE FIRMAS             │
        │    └─ FirmsOverview.jsx          │
        │       - Ver todas las firmas     │
        │       - Filtrar por trial status │
        │       - Ver días restantes       │
        │       - Aprobar/rechazar         │
        │                                  │
        │ 2. GESTIÓN DE USUARIOS           │
        │    └─ UsersDashboard.jsx         │
        │       - Listar usuarios          │
        │       - Cambiar rol              │
        │       - Resetear contraseña      │
        │                                  │
        │ 3. FINANCIERO                    │
        │    └─ FinancialDashboard.jsx     │
        │       - Ingresos                 │
        │       - Transacciones            │
        │       - Comisiones               │
        │                                  │
        │ 4. AUDITORÍA & LOGS              │
        │    └─ Acceso a audit_logs        │
        │       - Admin Master logs        │
        │       - Quién hizo qué           │
        │       - Cuándo                   │
        │                                  │
        │ 5. AUTOMATIZACIÓN                │
        │    └─ Ver status de:             │
        │       - Cron jobs                │
        │       - Webhooks                 │
        │       - IA scoring               │
        │       - Lead assignment          │
        └──────────────────────────────────┘
```

---

## 4. DASHBOARDS UNIFICADOS

### 4.1 Dashboard Universe Map

```
┌────────────────────────────────────────────────────────────┐
│                    DASHBOARD UNIVERSE                      │
└────────────────────────────────────────────────────────────┘
                         ↓
        ┌────────────────────────────────┐
        │   ADMIN DASHBOARDS (Nivel 0)   │
        │   (Admin OS - Control Global)   │
        └────────────────────────────────┘
                         ↓
        ┌─────────────────────────────────────────────────┐
        │ PRINCIPAL: ExecutiveDashboard.jsx               │
        │ - KPIs globales                                │
        │ - Gráficos de revenue                          │
        │ - Estado del sistema                           │
        │ - Acceso rápido a submódulos                   │
        └─────────────────────────────────────────────────┘
                         ↓
    ┌──────────────┬──────────────┬─────────────┐
    ↓              ↓              ↓             ↓
┌─────────────┐┌────────────┐┌──────────┐┌──────────┐
│FIRMAS       ││USUARIOS    ││FINANZAS  ││PAGOS     │
│             ││            ││          ││          │
│Overview     ││Users       ││Financial ││Billing   │
│(+ Trial)    ││Dashboard   ││Dashboard ││Admin     │
│             ││            ││          ││          │
│Pending      ││Roles       ││Revenue   ││Trans.    │
│Center       ││Perms       ││Invoices  ││Webhooks  │
└─────────────┘└────────────┘└──────────┘└──────────┘
                     ↓
        ┌─────────────────────────────┐
        │ SECONDARY: Sales, IA, etc    │
        │ - SalesCommandCenter         │
        │ - AICommandCenter            │
        │ - AutonomousControl          │
        │ - GlobalNetwork              │
        │ - LegalOS                    │
        │ - MasterControl              │
        └─────────────────────────────┘
                     ↓
        ┌────────────────────────────────┐
        │   FIRMA DASHBOARDS (Nivel 1)   │
        │   (Firm OS - Firma Individual)  │
        └────────────────────────────────┘
                     ↓
        ┌─────────────────────────────────────────────────┐
        │ PRINCIPAL: FirmDashboard.jsx                    │
        │ - KPIs de la firma                             │
        │ - Abogados activos                             │
        │ - Casos abiertos                               │
        │ - Ingresos del mes                             │
        │ - Trial status (si aplica)                      │
        └─────────────────────────────────────────────────┘
                     ↓
    ┌──────────┬──────────┬─────────┬──────────┐
    ↓          ↓          ↓         ↓          ↓
┌──────┐  ┌───────┐  ┌──────┐  ┌────────┐ ┌────────┐
│Cases ││Lawyers ││Finance ││Analytics ││Settings│
│      ││        ││        ││          ││        │
│List  ││Team    ││Bills   ││Reports   ││Config  │
│New   ││Invite  ││Invoices││Metrics   ││Users   │
│View  ││Manage  ││Payments││Charts    ││Trial   │
└──────┘└───────┘└──────┘└────────┘└────────┘
                     ↓
        ┌────────────────────────────────┐
        │   ABOGADO DASHBOARDS (Nivel 2) │
        │   (User Dashboard Individual)    │
        └────────────────────────────────┘
                     ↓
        ┌─────────────────────────────────────────────────┐
        │ PRINCIPAL: DashboardHome.jsx                    │
        │ - Mis casos activos                            │
        │ - Mis clientes                                 │
        │ - Invoices pendientes                          │
        │ - Próximas citas                               │
        │ - Comisiones                                   │
        └─────────────────────────────────────────────────┘
```

### 4.2 Tabla Comparativa de Dashboards

| Dashboard | Tipo | Archivo | Propósito Principal | Estado |
|-----------|------|---------|-------------------|--------|
| Executive | Admin | ExecutiveDashboard.jsx | Control global | Principal |
| Firms Overview | Admin | FirmsOverview.jsx | Gestión de firmas (+ Trial) | Principal |
| Pending Firms | Admin | PendingFirmsCenter.jsx | Aprobación de firmas | Secundario |
| Users | Admin | UsersDashboard.jsx | Gestión de usuarios | Secundario |
| Financial | Admin | FinancialDashboard.jsx | Finanzas consolidadas | Secundario |
| Sales | Admin | SalesCommandCenter.jsx | Ventas y comisiones | Avanzado |
| AI Control | Admin | AICommandCenter.jsx | Control de IA | Avanzado |
| Autonomous | Admin | AutonomousControl.jsx | Decisiones autónomas | Experimental |
| Cases Portal | Admin | CasesPortal.jsx | Vista de casos | Secundario |
| Global Network | Admin | GlobalNetwork.jsx | Red internacional | Avanzado |
| Legal OS | Admin | LegalOS.jsx | Sistema operativo legal | Experimental |
| Master Control | Admin | MasterControl.jsx | Control maestro | Crítico |
| Analytics | Admin | AnalyticsDashboard.jsx | Análisis consolidado | Secundario |
| Billing | Admin | BillingDashboard.jsx | Facturación | Secundario |
| Subscriptions | Admin | SubscriptionsDashboard.jsx | Suscripciones | Secundario |
| Organizations | Admin | OrganizationsDashboard.jsx | Multi-tenant | Secundario |
| Partners | Admin | PartnersDashboard.jsx | Partners | Secundario |
| Firm Dashboard | Firma | FirmDashboard.jsx | Dashboard de firma | Principal |
| Firm Cases | Firma | FirmCases.jsx | Casos de firma | Principal |
| Firm Lawyers | Firma | FirmLawyers.jsx | Abogados de firma | Principal |
| Firm Finance | Firma | FirmFinance.jsx | Finanzas de firma | Principal |
| Firm Analytics | Firma | FirmAnalytics.jsx | Análisis de firma | Secundario |
| Firm Settings | Firma | FirmSettings.jsx | Configuración | Secundario |
| Billing Enterprise | Firma | BillingEnterprise.jsx | Facturación empresarial | Secundario |
| CRM Enterprise | Firma | CRMEnterprise.jsx | CRM empresarial | Secundario |
| Dashboard Home | Abogado | DashboardHome.jsx | Dashboard personal | Principal |

### 4.3 Análisis de Duplicidad en Dashboards

**DUPLICIDADES DETECTADAS:**

| Dashboard A | Dashboard B | Tipo | Severidad |
|------------|-----------|------|-----------|
| FirmDashboard | DashboardHome | Parcial | MEDIA |
| *Razón:* Ambos muestran KPIs pero a nivel diferente (firma vs abogado) |
| FinancialDashboard | BillingDashboard | Alta | ALTA |
| *Razón:* Ambos muestran finanzas y facturación |
| Analytics | AnalyticsDashboard | Alta | ALTA |
| *Razón:* Dos dashboards de análisis con diferente scope |
| CRMEnterprise | SalesCommandCenter | Parcial | MEDIA |
| *Razón:* CRM en Firm OS vs Sales en Admin |
| Autonomous | MasterControl | Parcial | BAJA |
| *Razón:* Control automático vs control maestro |

**FRAGMENTACIÓN IDENTIFICADA:**

Dashboard similar funcionalidad pero distinta ubicación:
```
Analítica                  Cases
├── Admin: Analytics       ├── Admin: CasesPortal
├── Admin: AnalyticsDashboard ├── Firma: FirmCases
├── Firma: FirmAnalytics   └── Abogado: Cases (en DashboardHome)
└── Firma: Sales (en Finance)

Resultado: 3-4 dashboards haciendo cosas similares
           Sin clara jerarquía de uso
```

---

## 5. SISTEMA DE AUTENTICACIÓN UNIFICADO

### 5.1 Flujo de Autenticación Completo

```
┌──────────────────────────────────────────────────────────┐
│             AUTENTICACIÓN UNIFICADA                      │
└──────────────────────────────────────────────────────────┘
                         ↓
        ┌────────────────────────────────┐
        │ 1. LOGIN (Frontend)            │
        │                                │
        │ LoginPage.jsx                  │
        │ - Email input                  │
        │ - Password input               │
        │ - POST /api/auth/login         │
        └────────────────────────────────┘
                         ↓
        ┌────────────────────────────────┐
        │ 2. VALIDACIÓN (Backend)        │
        │                                │
        │ routes/auth.py                 │
        │ - Busca user by email en DB    │
        │ - Valida password con hash     │
        │ - Verifica status (ACTIVE)     │
        │ - Genera JWT token             │
        │   {                            │
        │     sub: email,                │
        │     user_id: str(_id),         │
        │     role: role,                │
        │     firm_id: firm_id,          │
        │     organization_id: org_id    │
        │   }                            │
        └────────────────────────────────┘
                         ↓
        ┌────────────────────────────────┐
        │ 3. TOKEN ALMACENADO (Frontend) │
        │                                │
        │ AuthContext.jsx                │
        │ - localStorage.setItem(        │
        │     'pcl_token',               │
        │     encrypted_jwt              │
        │   )                            │
        │ - AuthContext.user = {...}     │
        │ - AuthContext.role = role      │
        └────────────────────────────────┘
                         ↓
        ┌────────────────────────────────┐
        │ 4. ROUTING PROTEGIDO (Frontend)│
        │                                │
        │ ProtectedRoute.jsx             │
        │ if (!token) → redirect /login  │
        │ else → permitir acceso         │
        │                                │
        │ RoleRoute.jsx                  │
        │ if (role != requerido)         │
        │   → 403 Forbidden              │
        │ else → permitir acceso         │
        └────────────────────────────────┘
                         ↓
        ┌────────────────────────────────┐
        │ 5. MIDDLEWARE BACKEND          │
        │                                │
        │ get_current_user()             │
        │ (en auth.py)                   │
        │ - Extrae JWT del header        │
        │ - Valida firma y expiración    │
        │ - Retorna user dict            │
        │ - Si inválido → 401            │
        │                                │
        │ Si existe, cada endpoint       │
        │ recibe: current_user = {...}   │
        └────────────────────────────────┘
                         ↓
        ┌────────────────────────────────┐
        │ 6. SCOPING DE DATOS (Backend)  │
        │                                │
        │ Cada query automáticamente     │
        │ filtrada por:                  │
        │                                │
        │ if user.role == "admin":       │
        │   query = {}  # Ver todo       │
        │                                │
        │ elif user.role == "firm_owner":│
        │   query = {firm_id: user.fr..}│
        │   # Ver solo su firma          │
        │                                │
        │ elif user.role == "lawyer":    │
        │   query = {lawyer_id: user.id} │
        │   # Ver solo sus datos         │
        └────────────────────────────────┘
                         ↓
        ┌────────────────────────────────┐
        │ 7. RESPUESTA A REQUESTS        │
        │                                │
        │ Cada API call:                 │
        │ Authorization: Bearer <JWT>    │
        │                                │
        │ Backend valida en cada         │
        │ request (no sesión server)     │
        │                                │
        │ Stateless: no sesión en BD     │
        └────────────────────────────────┘
                         ↓
        ┌────────────────────────────────┐
        │ 8. LOGOUT                      │
        │                                │
        │ Frontend:                      │
        │ - localStorage.removeItem      │
        │   ('pcl_token')                │
        │ - AuthContext.clear()          │
        │ - Redirige a /login            │
        │                                │
        │ Backend:                       │
        │ - No hace nada (stateless)     │
        └────────────────────────────────┘
```

### 5.2 ROLES ENCONTRADOS EN EL SISTEMA

**ROLES GLOBALES:**

| Rol | Valor en BD | Acceso |
|-----|-------------|--------|
| Super Admin | `super_admin` | Acceso total (multi-tenant) |
| Admin General | `admin_general` | Acceso total (mono-tenant) |
| Admin Regular | `admin` | Acceso a Admin OS |

**ROLES DE FIRMA (Firm OS):**

| Rol | Valor | Permisos |
|-----|-------|----------|
| firm_owner | `firm_owner` | Acceso total a su firma |
| partner | `partner` | Co-propietario |
| senior_lawyer | `senior_lawyer` | Abogado sénior + supervisión |
| lawyer | `lawyer` | Abogado regular (casos propios) |
| paralegal | `paralegal` | Apoyo a abogados |
| assistant | `assistant` | Asistencia administrativa |
| finance | `finance` | Gestión de finanzas |
| hr | `hr` | Recursos humanos |

**ROLES DE PLATAFORMA:**

| Rol | Contexto | Permisos |
|-----|----------|----------|
| user | Abogado individual | Casos, clientes, invoices |
| organization_user | Punto Cero OS | Suscripciones, partners |

### 5.3 MATRIZ RBAC (Role-Based Access Control)

**NIVEL DE IMPLEMENTACIÓN: COMPLETO**

Definido en `models/rbac.py`:
- Enum de roles
- Enum de módulos
- Enum de permisos granulares
- ROLE_PERMISSIONS dict (mapeo rol → permisos)

**Ejemplo de permisos por rol:**

```python
FirmRole.FIRM_OWNER → [
  VIEW_DASHBOARD,
  MANAGE_LAWYERS, MANAGE_ROLES,
  CREATE/UPDATE/DELETE CASES,
  VIEW_FINANCES, PROCESS_PAYMENT,
  VIEW_ANALYTICS,
  MANAGE_CONFIGURATION
]

FirmRole.LAWYER → [
  VIEW_DASHBOARD,
  VIEW_CASES, CREATE_CASE,
  VIEW_CLIENTS,
  VIEW_FINANCES (limitado)
]
```

---

## 6. MULTI-TENANCY: IMPLEMENTACIÓN ACTUAL

### 6.1 Niveles de Tenancy Implementados

```
NIVEL 4 (Tope)          NIVEL 3             NIVEL 2           NIVEL 1 (Base)
┌─────────────────┐  ┌──────────────┐   ┌─────────────┐   ┌──────────────┐
│  Super Admin    │  │ Organization │   │    Firma    │   │   Abogado    │
│                 │  │  (Punto Cero │   │ (Firm OS)   │   │  Individual  │
│ Global Control  │  │     OS)      │   │             │   │              │
│                 │  │              │   │             │   │              │
│ Ve TODO         │  │ Usuarios,    │   │ Abogados,   │   │ Sus casos,   │
│                 │  │ Suscripciones│   │ Configuración│   │ sus clientes │
│ Acceso: Todos   │  │ Partners     │   │ Equipo      │   │              │
│ los datos       │  │              │   │             │   │ Acceso: Solo │
│                 │  │ Acceso:      │   │ Acceso:     │   │ sus datos    │
│ Acceso: Total   │  │ Usuarios de  │   │ firm_owner  │   │              │
│ sin filtrar     │  │ la org       │   │ + team      │   │ Acceso: Su   │
│                 │  │              │   │             │   │ folder       │
└─────────────────┘  └──────────────┘   └─────────────┘   └──────────────┘
     │                    │                   │                   │
     └────────────────────┴───────────────────┴───────────────────┘
                         Todos usuarios en la BD
                         pero separados por contexto
```

### 6.2 Aislamiento de Datos

**TIPO DE AISLAMIENTO: LÓGICO (en queries)**

```
Usuario ADMIN
├─ Query: {} (sin filtro)
└─ Ve: Todo en todas las colecciones

Usuario FIRM_OWNER
├─ Query: {firm_id: "xyz"}
└─ Ve: Solo documentos de su firma

Usuario LAWYER (individual)
├─ Query: {lawyer_id: str(_id)}
└─ Ve: Solo sus casos, clientes, invoices

Usuario ORGANIZATION_USER
├─ Query: {organization_id: "abc"}
└─ Ve: Solo datos de su organización
```

**NO ES DATABASE-LEVEL:** No hay separación física de BD
- Un MongoDB con múltiples tenants
- Aislamiento a través de queries

### 6.3 Scoping Automático en Backend

**Middleware/Utils que implementan scoping:**

- `security/tenant_scope.py` - Filterscope automático
- `utils/tenant.py` - Contexto de tenant
- `routes/*/` - Cada endpoint aplica filtros

**Ejemplo de scoping real:**

```python
# En routes/cases.py
@router.get("/")
async def get_cases(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Scoping automático según rol:
    if current_user.get("role") == "admin":
        query = {}  # Sin filtro
    elif current_user.get("role") == "firm_owner":
        query = {"firm_id": current_user.get("firm_id")}
    elif current_user.get("role") == "lawyer":
        query = {"lawyer_id": str(current_user["_id"])}
    
    # Ejecuta con el filtro:
    cases = await db.cases.find(query).to_list(None)
```

---

## 7. SISTEMA DE SUSCRIPCIONES Y TRIAL

### 7.1 Donde vive cada tipo de suscripción

```
PUNTO CERO OS SUBSCRIPTIONS          TRIAL DE FIRMA (NUEVO)
(Multi-tenant)                       (Embedded en Firma)

Colección: os_subscriptions          Colección: firms
Modelo: OSSubscription               Campos en: Firm model

Para: Organizaciones                 Para: Firmas individuales
Nivel: Punto Cero OS                 Nivel: Firm OS

Datos:                               Datos:
├─ tenantId                          ├─ trial_status
├─ companyName                       ├─ trial_started_at
├─ plan                              ├─ trial_ends_at
├─ status (trial|active|expired)     ├─ subscription_status
├─ billingCycle                      └─ subscription_plan
├─ monthlyAmount
├─ renewalDate
└─ expirationDate

Renovación automática:               Expiración automática:
├─ Cron job diario (renewal_service) ├─ Cron job diario (trial_service)
├─ Valida: expirationDate <= NOW     ├─ Valida: trial_ends_at <= NOW
├─ Genera payment intent             └─ Cambia trial_status a "expired"
└─ Intenta cobro
```

### 7.2 Ciclo de Vida del Trial de Firma

```
1. CREACIÓN (Cuando firma se registra)
   POST /api/firms/register
   ├─ trial_status = "active"
   ├─ trial_started_at = NOW
   ├─ trial_ends_at = NOW + 7 días
   ├─ subscription_status = "trial"
   └─ subscription_plan = "trial"
   
2. ALMACENAMIENTO
   MongoDB
   └─ Colección: firms
      └─ Documento: {_id, name, ..., trial_status, trial_started_at, ...}
   
3. VISUALIZACIÓN
   Frontend Dashboard (FirmsOverview.jsx)
   ├─ Columna "Trial": "Activo"
   ├─ Columna "Días Restantes": Calculado (trial_ends_at - NOW)
   └─ KPI: "Trials Activos" y "Próximos a Vencer"
   
4. MONITOREO
   Backend cron_jobs.py (00:00 UTC cada día)
   ├─ check_and_expire_trials()
   ├─ Busca: {trial_status: "active", trial_ends_at: {$lte: NOW}}
   └─ Para cada trial vencido:
      └─ UPDATE: trial_status = "expired"
              subscription_status = "expired"
   
5. ESTADO FINAL
   Dashboard muestra automáticamente:
   ├─ Columna "Trial": "Expirado"
   ├─ Columna "Días Restantes": "0"
   └─ Admin puede revisar o contactar firma
```

### 7.3 Partes Incompletas del Trial

**IMPLEMENTADO:**
- ✅ Creación automática al registrar firma
- ✅ Almacenamiento en BD
- ✅ Visualización en dashboard
- ✅ Expiración automática diaria
- ✅ Cálculo de días restantes
- ✅ Email de confirmación

**NO IMPLEMENTADO (Opcional):**
- ❌ Bloqueo de acceso al Firm OS cuando trial vence
- ❌ Email de alerta: "Tu trial vence en 3 días"
- ❌ Página de upgrade después del vencimiento
- ❌ Notificación al admin cuando trial vence
- ❌ Opción de extender trial manualmente (mencionado pero no activo)
- ❌ Tracking de conversión (trial → pagado)

---

## 8. MAPA DE MÓDULOS UNIFICADO

### 8.1 Estructura de Módulos del Sistema

```
PUNTO CERO LEGAL (Sistema Global)
├─ CORE PLATFORM
│  ├─ Authentication (routes/auth.py)
│  ├─ Authorization RBAC (models/rbac.py, utils/rbac.py)
│  ├─ Multi-Tenancy (security/tenant_scope.py)
│  ├─ Users Management (routes/users.py)
│  └─ Notifications (utils/notifier.py)
│
├─ ADMIN OS (Sistema Administrativo - Nivel 0)
│  ├─ Executive Control (ExecutiveDashboard.jsx)
│  ├─ Firms Management (FirmsOverview.jsx)
│  │  └─ + Trial Management (columnas, KPIs)
│  ├─ Users Management (UsersDashboard.jsx)
│  ├─ Financial Control (FinancialDashboard.jsx)
│  ├─ Sales (SalesCommandCenter.jsx)
│  ├─ AI Control (AICommandCenter.jsx)
│  ├─ Autonomous (AutonomousControl.jsx)
│  ├─ Analytics (AnalyticsDashboard.jsx)
│  └─ Master Control (MasterControl.jsx)
│     └─ Auditoría (audit_logs)
│
├─ FIRM OS (Sistema de Firma - Nivel 1)
│  ├─ Firm Dashboard (FirmDashboard.jsx)
│  ├─ Cases Management (FirmCases.jsx)
│  ├─ Lawyers Management (FirmLawyers.jsx)
│  ├─ Finance (FirmFinance.jsx)
│  ├─ Analytics (FirmAnalytics.jsx)
│  ├─ Settings & Config (FirmSettings.jsx)
│  ├─ Team Management (FirmTeam.jsx)
│  └─ Onboarding (OnboardingWizardFirm.jsx)
│
├─ USER SYSTEM (Abogado Individual - Nivel 2)
│  ├─ Dashboard (DashboardHome.jsx)
│  ├─ Cases (routes/cases.py)
│  ├─ Clients (routes/clients.py)
│  ├─ Invoices (routes/invoices.py)
│  ├─ Appointments (routes/appointments.py)
│  └─ Backup (routes/backup.py)
│
├─ BILLING & PAYMENTS (Sistema de Facturación)
│  ├─ Mercado Pago Integration (routes/payment.py)
│  ├─ PayPal Integration (routes/payment.py)
│  ├─ Invoices Management (routes/invoices.py)
│  ├─ Subscriptions (routes/subscriptions.py)
│  ├─ Billing Admin (routes/billing_admin.py)
│  ├─ Commissions (routes/commissions.py)
│  ├─ Trial Management (services/trial_service.py)
│  └─ Renewals (services/renewal_service.py)
│
├─ CASES & WORKFLOW
│  ├─ Cases Management (routes/cases.py)
│  ├─ Public Intake (routes/public_intake.py)
│  ├─ Case Activities (models/case_activity.py)
│  ├─ Expedientes (utils/expediente.py)
│  │  └─ Google Drive Integration (utils/drive_service.py)
│  └─ Documents (routes/documents.py)
│
├─ IA & AUTOMATION
│  ├─ Gemini Chat (routes/ai.py)
│  ├─ Scoring (services/ai_scoring_engine.py)
│  ├─ Lead Assignment (routes/ai_autopilot.py)
│  ├─ Operations (routes/ai_operations.py)
│  └─ Autonomous System (routes/autonomous.py)
│
├─ PUNTO CERO OS (Multi-tenant - Nivel Superior)
│  ├─ Organizations (routes/organizations.py)
│  ├─ Partners (routes/partners.py)
│  ├─ Implementations (routes/implementations.py)
│  ├─ Subscriptions OS (routes/subscriptions.py)
│  ├─ Billing OS (routes/billing.py)
│  └─ Analytics (routes/analytics.py)
│
├─ DATA & ANALYTICS
│  ├─ Dashboard Metrics (routes/dashboard.py)
│  ├─ Analytics (routes/analytics.py)
│  ├─ Sales Analytics (routes/sales_analytics.py)
│  ├─ Financial (routes/financial.py)
│  └─ Timeline (routes/timeline.py)
│
├─ INTEGRATIONS & EXTERNAL
│  ├─ Webhooks (services/webhook_handler.py)
│  ├─ Integration Module (routes/integration.py)
│  ├─ Global Network (routes/global_network.py)
│  └─ ChatBot (routes/chatbot.py)
│
└─ SYSTEM OPERATIONS
   ├─ Cron Jobs (services/cron_jobs.py)
   ├─ Migrations (migrations/)
   ├─ Seeds (seeds/)
   ├─ Audit (utils/audit.py)
   └─ Error Tracking (utils/error_tracker.py)
```

---

## 9. DEPENDENCIAS ENTRE MÓDULOS

### 9.1 Mapa de Dependencias

```
CORE PLATFORM
│
├─→ AUTH (necesario para todo)
├─→ RBAC (necesario para todo)
└─→ MULTI-TENANCY (necesario para todo)

        ↓ (Todo depende del CORE)

        ┌─────────────────┬──────────────┬────────────────┐
        ↓                 ↓              ↓                ↓

   ADMIN OS          FIRM OS         USER SYSTEM      PUNTO CERO OS
   (Independiente)   (Depende de)    (Depende de)     (Independiente)
        │            - USER SYSTEM   - CASES          
        │            - CASES         - BILLING        
        │            - BILLING       
        │            - IA            
        │                            
        ├─ Casos                     ├─ Casos
        ├─ Billing                   ├─ Billing
        ├─ IA                        └─ Notifications
        ├─ Analytics            
        └─ Auditoría

ACOPLAMIENTO REAL:

BILLING
├─→ depende de USER (crear invoices)
├─→ depende de CASES (facturar casos)
├─→ depende de PAYMENT GATEWAY (procesar)
└─→ depende de NOTIFICATIONS (confirmar)

CASES
├─→ depende de USER (asignar abogado)
├─→ depende de EXPEDIENTE (almacenar docs)
└─→ depende de NOTIFICATIONS (alertas)

IA
├─→ depende de CASES (analizar)
├─→ depende de LEADS (asignar)
└─→ depende de BILLING (scoring de clientes)

NOTIFICACIONES
└─→ depende de TODO (enviar alertas)

AUDITORÍA
└─→ depende de TODO (loguear acciones)
```

### 9.2 Matriz de Independencia

| Módulo | Depende de | Es Independiente | Crítico |
|--------|-----------|------------------|---------|
| Core Platform | Ninguno | SÍ | ✅ MUY |
| Auth | Core | SÍ | ✅ MUY |
| RBAC | Core + Auth | SÍ | ✅ CRÍTICO |
| Admin OS | Core + Auth | PARCIAL | ✅ CRÍTICO |
| Firm OS | Core + Auth + User | NO | ✅ CRÍTICO |
| User System | Core + Auth | SÍ | ✅ MUY |
| Billing | Payment Gateway + User + Cases | NO | ✅ MUY |
| Cases | User + Expediente | NO | ✅ CRÍTICO |
| IA | Cases + Leads | NO | ⚠️ MEDIA |
| Punto Cero OS | Core + Auth | PARCIAL | ✅ CRÍTICO |
| Notifications | Todo | NO | ⚠️ MEDIA |

---

## 10. DUPLICIDADES Y FRAGMENTACIÓN DETECTADAS

### 10.1 Dashboards Duplicados

```
DUPLICIDAD ALTA:
├─ AnalyticsDashboard (Admin)
├─ FirmAnalytics (Firma)
├─ DashboardHome (Abogado, contiene analytics)
└─ Problema: 3 dashboards de análisis, no clara la jerarquía

DUPLICIDAD MEDIA:
├─ FinancialDashboard (Admin)
├─ BillingDashboard (Admin)
└─ Problema: Financiero y facturación parecen lo mismo

DUPLICIDAD MEDIA:
├─ CRMEnterprise (Firm OS)
├─ SalesCommandCenter (Admin OS)
└─ Problema: CRM y ventas parcialmente superpuestos

FRAGMENTACIÓN:
├─ Casos se visualizan en:
│  ├─ CasesPortal (Admin)
│  ├─ FirmCases (Firma)
│  └─ DashboardHome (Abogado, parcial)
├─ Clientes se ven en:
│  ├─ Directorio (Abogado)
│  └─ Dentro de casos (Firma)
└─ Problema: No hay vista consolidada unificada
```

### 10.2 Endpoints Potencialmente Duplicados

```
USUARIOS:
├─ GET /api/users (Admin - listar)
├─ GET /api/users/{id} (Admin - detalle)
├─ Problema: Bajo, roles protegen acceso

FIRMAS:
├─ GET /api/firms (Admin - listar)
├─ GET /api/firms/{id} (Firma/Admin - detalle)
├─ GET /api/firms/{id}/trial (Nuevo - info de trial)
└─ Problema: Trial es info derivada, podría estar en {id}

CASOS:
├─ GET /api/cases (Abogado - sus casos)
├─ GET /api/firms/{id}/cases (Firma - casos de firma)
├─ GET /api/cases/{id} (Detalle)
└─ Problema: Dos formas de acceder, no coherente

PAGOS:
├─ GET /api/payment/status (Status de pago)
├─ GET /api/payment/config (Configuración)
├─ GET /api/billing (Billing info)
└─ Problema: Tres endpoints relacionados
```

### 10.3 Lógica Repetida

```
VALIDACIONES:
├─ Duplicadas en:
│  ├─ Frontend (antes de enviar)
│  └─ Backend (al recibir)
└─ Problema: Necesario para seguridad, pero mantenimiento doble

CÁLCULOS FINANCIEROS:
├─ Revenue calculation
│  ├─ En payment.py
│  ├─ En financial.py
│  ├─ En commissions.py
│  └─ Problema: Mismo cálculo en 3 lugares

NOTIFICACIONES:
├─ Email enviado por:
│  ├─ auth.py (registro)
│  ├─ firms.py (confirmación)
│  ├─ payment.py (confirmación pago)
│  └─ Problema: Lógica similar, no centralizada

FECHA CÁLCULO:
├─ Trial remaining days:
│  ├─ Frontend (JavaScript)
│  ├─ Backend (Python)
│  └─ Problema: Cálculo en ambos lados
```

### 10.4 Modelos Redundantes

```
SUBSCRIPCIÓN:
├─ os_subscription.py (Punto Cero OS)
├─ subscription.py (Abogado legacy)
├─ Campos en firms (Trial nuevo)
└─ Problema: 3 formas diferentes de representar suscripción

USUARIOS:
├─ Modelo único User
├─ Pero roles definen tipo:
│  ├─ admin_general
│  ├─ firm_owner
│  ├─ lawyer
│  └─ Problema: Podría haber subclases (Admin extends User)

CASOS:
├─ Modelo Case
├─ Pero case_activities es separado
├─ Y expediente es utilidad (no modelo)
└─ Problema: Relaciones anidadas vs colecciones separadas
```

---

## 11. MAPA FINAL UNIFICADO - SINGLE SOURCE OF TRUTH

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  PUNTO CERO LEGAL - UNIFIED ARCHITECTURE MAP                │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ PRESENTATION LAYER (React 19)                                        │  │
│  │  ┌────────────────┬──────────────┬──────────────┬────────────────┐   │  │
│  │  │ PUBLIC PAGES   │   AUTH       │  DASHBOARDS  │  MODULES (14+) │   │  │
│  │  │                │              │              │                │   │  │
│  │  │ Landing        │ Login        │ Admin OS (7)   Admin Module │   │  │
│  │  │ Register       │ Activation   │ Firm OS (10)   Firm Module  │   │  │
│  │  │ Portal         │ Password     │ User (1)       Others (12)  │   │  │
│  │  │ Public Profiles│ Change       │              │                │   │  │
│  │  │                │              │              │                │   │  │
│  │  └────────────────┴──────────────┴──────────────┴────────────────┘   │  │
│  │           ↓ Axios + Bearer Token (/api)                              │  │
│  │  ┌────────────────────────────────────────────────────────────────┐   │  │
│  │  │ STATE LAYER (Contexts)                                        │   │  │
│  │  │ AuthContext │ CaseContext │ SubscriptionContext │ TenantCtx  │   │  │
│  │  └────────────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ APPLICATION LAYER (FastAPI - 41 Routes)                              │  │
│  │  ┌─────────────┬──────────┬─────────┬─────────┬──────────┬────────┐ │  │
│  │  │  AUTH      │  FIRMS   │ CASES   │ PAYMENT │   IA    │ OTHERS │ │  │
│  │  │            │          │         │         │         │        │ │  │
│  │  │ /auth/*    │ /firms/* │ /cases/ │/payment │ /ai/*   │Webhooks│ │  │
│  │  │            │          │ /clients│ /billing│/autopilot│Docs    │ │  │
│  │  │ RBAC       │ + TRIAL  │ /invoices│/trans  │/scoring │ Meetings
│  │  │ AuthN      │          │         │        │         │        │ │  │
│  │  └─────────────┴──────────┴─────────┴─────────┴──────────┴────────┘ │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │  │
│  │  │ MIDDLEWARE LAYER                                               │ │  │
│  │  │ get_current_user (Auth) | RBAC Check | Tenant Scoping | Audit  │ │  │
│  │  └──────────────────────────────────────────────────────────────────┘ │  │
│  │           ↓ Motor (Async MongoDB Driver)                              │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │  │
│  │  │ SERVICES LAYER (20 Services)                                   │ │  │
│  │  │ ┌─────────────┬──────────────┬─────────┬──────────┬──────────┐ │ │  │
│  │  │ │ Billing     │ Subscription │ Trial   │   IA     │  Cron   │ │ │  │
│  │  │ │ Commission  │ Renewal      │ Service │ Services │ Jobs    │ │ │  │
│  │  │ │ Organization│ Analytics    │         │          │         │ │ │  │
│  │  │ └─────────────┴──────────────┴─────────┴──────────┴──────────┘ │ │  │
│  │  │                                                                  │ │  │
│  │  │ UTILS & HELPERS                                                │ │  │
│  │  │ Auth | RBAC | Tenant | Notifier | Expediente | Audit | Error │ │  │
│  │  └──────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ DATA LAYER (MongoDB - 25+ Collections)                              │  │
│  │  ┌────────────┬──────────┬────────┬──────────┬────────────────────┐ │  │
│  │  │   USERS    │  FIRMS   │ CASES  │ BILLING  │  SETTINGS          │ │  │
│  │  │            │ + TRIAL  │        │          │                    │ │  │
│  │  │ users      │ firms    │ cases  │invoices  │ firm_config        │ │  │
│  │  │ (all roles)│ (embed   │ clients│transact  │ organizations      │ │  │
│  │  │            │  trial)  │ leads  │comissions│ rbac               │ │  │
│  │  │            │          │ appts  │receipts  │ partners           │ │  │
│  │  │            │          │        │subscript │ implementations    │ │  │
│  │  │            │          │        │          │                    │ │  │
│  │  └────────────┴──────────┴────────┴──────────┴────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │  │
│  │  │ METADATA & LOGS                                                 │ │  │
│  │  │ audit_logs │ webhook_logs │ notifications │ timeline_events    │ │  │
│  │  └──────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ EXTERNAL INTEGRATIONS                                                │  │
│  │ ┌──────────────┬──────────────┬──────────────┬────────────────────┐ │  │
│  │ │ MERCADO PAGO │ GOOGLE DRIVE │ GEMINI API   │ WHATSAPP           │ │  │
│  │ │ (Payments)   │ (Expedientes)│ (IA Chat)    │ (Notifications)    │ │  │
│  │ └──────────────┴──────────────┴──────────────┴────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


FLUJO DE DATOS GENERAL:

1. Usuario se registra o hace login
          ↓
2. JWT token almacenado (localStorage)
          ↓
3. Cada request incluye: Authorization: Bearer <JWT>
          ↓
4. Backend valida token + extrae rol/tenant
          ↓
5. Middleware aplica RBAC y Tenant Scoping
          ↓
6. Endpoint ejecuta con queries filtradas
          ↓
7. Response retorna solo datos permitidos
          ↓
8. Frontend renderiza en dashboard correspondiente


ENTRADA AL SISTEMA (3 Puntos de Entrada):

A) PÚBLICO: Landing Page → Registro
   └─ Genera firma + trial automático

B) USUARIO: Login → Dashboard Personal
   └─ Acceso a sus datos (casos, clientes, invoices)

C) ADMIN: Login → Admin OS
   └─ Acceso total a todo el sistema


NIVELES DE AUTORIDAD:

Nivel 0: SUPER_ADMIN / ADMIN_GENERAL (todo)
Nivel 1: FIRM_OWNER (su firma)
Nivel 2: LAWYER / ROLES (sus datos)
Nivel 3: PUBLIC (solo lectura de perfiles públicos)
```

---

## 12. CONCLUSIÓN TÉCNICA

### ¿El sistema está unificado o fragmentado?

**RESPUESTA: FRAGMENTADO CON NÚCLEO UNIFICADO**

El sistema tiene:
- ✅ **Núcleo unificado:** Core Platform, Auth, RBAC, Multi-tenancy
- ✅ **Arquitectura coherente:** Capas claras (Presentation, Application, Data)
- ❌ **Fragmentación detectada:**
  - Múltiples dashboards haciendo cosas similares (análisis, finanzas)
  - Subscripción representada en 3 formas diferentes
  - Lógica repetida (cálculos, validaciones, notificaciones)
  - No hay consolidación clara entre Admin OS y Firm OS

### ¿Existe una arquitectura coherente o múltiples sistemas coexistiendo?

**RESPUESTA: ARQUITECTURA COHERENTE PERO CON SUBSISTEMAS PARALELOS**

Existe una arquitectura global coherente (FastAPI + MongoDB + React) pero con:
- **Punto Cero OS** (multi-tenant) coexistiendo con
- **Firm OS** (firma individual) coexistiendo con
- **User System** (abogado individual)

Estos 3 subsistemas comparten:
- Misma autenticación ✅
- Mismo RBAC ✅
- Misma BD ✅
- Mismas utilidades ✅

Pero mantienen:
- Datos separados (lógicamente) ✅
- Dashboards distintos ✅
- Flujos de negocio paralelos ⚠️

### ¿Cuál es la estructura real dominante del sistema?

**RESPUESTA: MULTI-TENANT CON JERARQUÍA DE 4 NIVELES**

```
NIVEL 0 (Tope)       SUPER_ADMIN / ADMIN_GENERAL
                     └─ Ve TODO sin filtros

NIVEL 1 (Alto)       ORGANIZATION (Punto Cero OS)
                     └─ Usuarios multi-tenant
                        - Suscripciones
                        - Partners
                        - Implementaciones

NIVEL 2 (Medio)      FIRM (Firm OS)
                     └─ firm_owner + equipo
                        - Abogados
                        - Casos
                        - Configuración
                        - Trial de 7 días

NIVEL 3 (Base)       INDIVIDUAL LAWYER
                     └─ lawyer individual
                        - Sus casos
                        - Sus clientes
                        - Sus invoices
```

**ESTRUCTURA DOMINANTE:**

El sistema está dominado por **multi-tenancy a nivel de Organización + Firma**.

- **Admin OS:** Control global (Punto Cero)
- **Firm OS:** Control de firma (Punto Cero Clients)
- **User Dashboard:** Control individual (Lawyer)

La **verdadera estructura** es **Firm-Centric** con **Admin-Oversight** global.

**PATRÓN ARQUITECTÓNICO:**

```
Monolito multitenant con separación lógica de datos
├─ Compartido: Auth, DB, Servicios
├─ Separado: Datos (via tenant_id/firm_id/lawyer_id)
└─ Resultado: Escalable pero requiere cuidado en queries
```

---

## CONCLUSIÓN FINAL

Punto Cero Legal es un **sistema coherente pero fragmentado**, con:

- **Fortalezas:**
  - Arquitectura clara y bien definida
  - Separación de responsabilidades
  - Multi-tenancy robusta
  - RBAC implementado completamente
  - Trial de 7 días integrado sin duplicación

- **Debilidades:**
  - Dashboards duplicados (análisis, finanzas)
  - Lógica repetida en multiple places
  - Subscripción definida 3 formas diferentes
  - No hay una "vista única" consolidada de datos

El sistema **funciona** y está **en producción**, pero tiene **oportunidades de consolidación** que podrían mejorar mantenibilidad sin requerirrefactorización mayor.

