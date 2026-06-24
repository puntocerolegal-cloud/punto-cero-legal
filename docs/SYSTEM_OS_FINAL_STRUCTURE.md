# FASE 5 — SYSTEM OS FINAL STRUCTURE

**Jerarquía Definitiva del Menú Lateral por Rol**

**Fecha:** Junio 2026  
**Status:** DESIGN COMPLETE (No Code Implementation)  
**Objetivo:** Estructura final del navegador para 5 tipos de usuarios

---

## 1. RESUMEN EJECUTIVO

### 1.1 Estructura de Usuarios

```
1. ABOGADO INDEPENDIENTE
   └─ Accede: /dashboard (DashboardHome)
   └─ NO accede a /admin

2. FIRMA JURÍDICA (Admin de Firma)
   └─ role = socio_comercial
   └─ Accede: /admin/organization/{org_id}/*
   └─ Menú acotado: Team, Dashboard, Billing, Cases

3. AGENTE COMERCIAL
   └─ role = lawyer (con commission tracking)
   └─ Accede: /agent-office (futuro, FASE 2)
   └─ Menú: Leads, Clients, Commissions, Countries, Resources

4. PARTNER CORPORATIVO
   └─ role = socio_comercial (tipo partner)
   └─ Accede: /admin/partner/{partner_id}/*
   └─ Menú: Leads generados, Comisiones, Performance

5. ADMIN OS (Platform Admin)
   └─ role = admin, admin_general
   └─ Accede: /admin (PUNTO CERO SYSTEM OS)
   └─ Menú: COMPLETO (20 módulos)
```

### 1.2 Regla de Oro

```
NO hay cambio de código.
NO hay cambios de rutas.
NO hay movimiento de archivos.

SÍ hay:
├─ Visibilidad condicional por rol (SidebarNav)
├─ Agrupación lógica en secciones
├─ Ocultamiento de opciones no aplicables
└─ Flujos de navegación diferenciados
```

---

## 2. MÓDULOS ACTUALES (inventario)

### 2.1 Módulos del Sistema (23 total)

```
OPERACIONES (5):
├─ ExecutiveDashboard        (Index: /)
├─ MasterControl             (/master)
├─ CasesPortal               (/cases-portal)
├─ SalesRoomModule           (/sales-room)
└─ CountrySegmentation       (/countries)

NEGOCIO (7):
├─ SubscriptionsDashboard    (/subscriptions)
├─ SubscriptionCenter        (/subscription-center)
├─ UpgradeCenter             (/upgrade)
├─ BillingDashboard          (/billing)
├─ PlansDashboard            (/plans)
├─ CommercialAIDashboard     (/commercial-ai)
└─ NotificationsDashboard    (/notifications)

RED Y TALENTO (6):
├─ PartnersDashboard         (/partners)
├─ OrganizationsDashboard    (/organizations)
├─ UsersDashboard            (/users)
├─ ReferralsDashboard        (/referrals)
├─ ImplementationsDashboard  (/implementations)
└─ VerticalsDashboard        (/verticals)

SISTEMA (4):
├─ RolesDashboard            (/roles)
├─ PermissionsDashboard      (/permissions)
├─ InventoryModule           (/inventory)
└─ SecurityDashboard         (/security)

ESPECIAL (1):
└─ SupportAccessPanel        (/support-access)
```

---

## 3. MENÚ LATERAL DEFINITIVO PARA ADMIN OS

### 3.1 Estructura Jerárquica (ADMIN COMPLETO)

```
PUNTO CERO SYSTEM OS
├─ OPERACIONES
│  ├─ Dashboard Ejecutivo      → /admin (INDEX)
│  ├─ Control Maestro          → /admin/master
│  ├─ Portal de Casos          → /admin/cases-portal
│  ├─ Sala de Ventas           → /admin/sales-room
│  └─ Segmentación por Países  → /admin/countries
│
├─ NEGOCIO
│  ├─ Suscripciones            → /admin/subscriptions
│  ├─ Planes                   → /admin/plans
│  ├─ Centro de Suscripción    → /admin/subscription-center
│  ├─ Actualizar Plan          → /admin/upgrade
│  ├─ Facturación & Contabilidad → /admin/billing
│  ├─ IA Comercial             → /admin/commercial-ai
│  └─ Notificaciones           → /admin/notifications
│
├─ RED Y TALENTO
│  ├─ Socios Comerciales       → /admin/partners
│  ├─ Organizaciones           → /admin/organizations
│  ├─ Usuarios                 → /admin/users
│  ├─ Referidos                → /admin/referrals
│  ├─ Implementaciones         → /admin/implementations
│  └─ Motor Multivertical      → /admin/verticals
│
├─ SISTEMA
│  ├─ Roles                    → /admin/roles
│  ├─ Permisos                 → /admin/permissions
│  ├─ Inventario Inteligente   → /admin/inventory
│  └─ Seguridad                → /admin/security
│
├─ PROTECCIÓN
│  └─ Accesos de Soporte       → /admin/support-access
│
└─ [Cerrar Sesión]
```

### 3.2 Nombres de Módulos (CONSERVAN IDENTIDAD)

```
¿Qué CONSERVA su nombre?
├─ Dashboard Ejecutivo          ← ExecutiveDashboard
├─ Control Maestro              ← MasterControl
├─ Portal de Casos              ← CasesPortal
├─ Sala de Ventas               ← SalesRoomModule
├─ Segmentación por Países      ← CountrySegmentation
├─ Suscripciones                ← SubscriptionsDashboard
├─ Planes                       ← PlansDashboard
├─ Centro de Suscripción        ← SubscriptionCenter
├─ Actualizar Plan              ← UpgradeCenter
├─ Facturación & Contabilidad   ← BillingDashboard
├─ IA Comercial                 ← CommercialAIDashboard
├─ Notificaciones               ← NotificationsDashboard
├─ Socios Comerciales           ← PartnersDashboard
├─ Organizaciones               ← OrganizationsDashboard
├─ Usuarios                     ← UsersDashboard
├─ Referidos                    ← ReferralsDashboard
├─ Implementaciones             ← ImplementationsDashboard
├─ Motor Multivertical          ← VerticalsDashboard
├─ Roles                        ← RolesDashboard
├─ Permisos                     ← PermissionsDashboard
├─ Inventario Inteligente       ← InventoryModule
├─ Seguridad                    ← SecurityDashboard
└─ Accesos de Soporte           ← SupportAccessPanel

TOTAL: 23 módulos, 23 nombres. Sin cambios lingüísticos.
```

---

## 4. MENÚ CONDITIONAL POR ROL

### 4.1 ADMIN OS (role=admin, admin_general)

**Acceso:** Menú COMPLETO (23 módulos)

```
SIDEBAR NAVIGATION:
├─ Dashboard Ejecutivo                    ✅ Visible
├─ ▸ OPERACIONES
│  ├─ Control Maestro                    ✅
│  ├─ Portal de Casos                    ✅
│  ├─ Sala de Ventas                     ✅
│  └─ Segmentación por Países            ✅
├─ ▸ NEGOCIO
│  ├─ Suscripciones                      ✅
│  ├─ Planes                             ✅
│  ├─ Centro de Suscripción              ✅
│  ├─ Actualizar Plan                    ✅
│  ├─ Facturación & Contabilidad         ✅
│  ├─ IA Comercial                       ✅
│  └─ Notificaciones                     ✅
├─ ▸ RED Y TALENTO
│  ├─ Socios Comerciales                 ✅
│  ├─ Organizaciones                     ✅
│  ├─ Usuarios                           ✅
│  ├─ Referidos                          ✅
│  ├─ Implementaciones                   ✅
│  └─ Motor Multivertical                ✅
├─ ▸ SISTEMA
│  ├─ Roles                              ✅
│  ├─ Permisos                           ✅
│  ├─ Inventario Inteligente             ✅
│  └─ Seguridad                          ✅
├─ ▸ PROTECCIÓN
│  └─ Accesos de Soporte                 ✅
└─ Cerrar Sesión                         ✅

PERMISOS: Write en todo (SUPER_ADMIN, OWNER)
ACCIONES: Create, Edit, Delete, Approve, Pay, Suspend
```

---

### 4.2 ADMIN DE FIRMA (role=socio_comercial, organizationId=firm_id)

**Acceso:** Menú REDUCIDO (6 módulos firm-specific)

```
SIDEBAR NAVIGATION:
├─ Dashboard de Firma           ✅ (nuevo, /admin/organization/{org_id})
├─ ▸ EQUIPO
│  ├─ Usuarios (Abogados)       ✅ Crear, editar, suspender
│  ├─ Roles (internos)          ✅ Configurar roles de firma
│  └─ Permisos (internos)       ✅ Asignar permisos
├─ ▸ OPERACIONES
│  ├─ Casos Consolidados        ✅ Ver casos de todos sus abogados
│  └─ Leads Asignados           ✅ Ver leads sin asignar
├─ ▸ NEGOCIO
│  ├─ Facturación (Firma)       ✅ MRR, ARR, clientes
│  └─ Comisiones (Abogados)     ✅ Pendientes, aprobadas, pagadas
└─ Cerrar Sesión                ✅

OCULTOS (si intenta acceder):
├─ Dashboard Ejecutivo          ❌ (cross-tenant)
├─ Control Maestro              ❌ (cross-tenant)
├─ Portal de Casos (global)     ❌ (solo el suyo)
├─ Sala de Ventas (global)      ❌ (solo el suya)
├─ Segmentación Países          ❌ (cross-tenant)
├─ Suscripciones (global)       ❌ (cross-tenant)
├─ Planes                       ❌ (cross-tenant)
├─ IA Comercial                 ❌ (cross-tenant)
├─ Socios Comerciales           ❌ (cross-tenant)
├─ Organizaciones (global)      ❌ (solo la suya)
├─ Usuarios (global)            ❌ (solo los suyos)
├─ Referidos (global)           ❌ (cross-tenant)
├─ Implementaciones             ❌ (cross-tenant)
├─ Motor Multivertical          ❌ (cross-tenant)
├─ Inventario                   ❌ (system-only)
├─ Seguridad                    ❌ (system-only)
└─ Accesos de Soporte           ❌ (system-only)

PERMISOS: Write en su firma, Read su data, NO cross-tenant
ACCIONES: Manage team, View metrics, Approve comisiones firma
```

---

### 4.3 AGENTE COMERCIAL (role=lawyer, commission tracking)

**Acceso:** Menú PERSONAL AGENT OFFICE (6 módulos)

```
UBICACIÓN: /agent-office/* (NO /admin)

SIDEBAR NAVIGATION:
├─ Dashboard Agente             ✅ (KPIs personales)
├─ ▸ VENTAS
│  ├─ Mis Leads                 ✅ Kanban pipeline (nuevo→ganado)
│  ├─ Mis Clientes              ✅ Tabla + detalles
│  └─ Comisiones                ✅ Pendientes, aprobadas, pagadas
├─ ▸ ANÁLISIS
│  ├─ Rendimiento por País      ✅ Geografía de clientes
│  └─ Tendencias (6 meses)      ✅ Ingresos, conversión
├─ ▸ RECURSOS
│  ├─ Centro de Recursos        ✅ Manuales, videos, templates
│  └─ Referidos                 ✅ Código único, programa
└─ Cerrar Sesión                ✅

OCULTOS (NO ACCEDE A /ADMIN):
├─ Todo el System OS            ❌ (role=lawyer, NO admin role)
├─ Dashboard Ejecutivo          ❌
├─ Control Maestro              ❌
├─ (... resto de módulos)       ❌

PERMISOS: Read own, Write own
ACCIONES: Create lead, Change status, See comisiones, Download resource
```

---

### 4.4 PARTNER CORPORATIVO (role=socio_comercial, partner=true)

**Acceso:** Menú PARTNER-SPECIFIC (4 módulos)

```
UBICACIÓN: /admin/partner/{partner_id}/* (variante de /admin)

SIDEBAR NAVIGATION:
├─ Dashboard Partner            ✅ (KPIs partner)
├─ ▸ LEADS & SALES
│  ├─ Leads Generados           ✅ Leads que originó
│  ├─ Conversiones              ✅ Leads → Casos
│  └─ Pipeline                  ✅ Estado visual
├─ ▸ NEGOCIO
│  ├─ Comisiones Ganadas        ✅ Pending, approved, paid
│  ├─ Performance               ✅ MRR, ARR, trend
│  └─ Documentos                ✅ Contrato, datos bancarios
└─ Cerrar Sesión                ✅

OCULTOS (restricción partner):
├─ Usuarios (NO gestiona team)  ❌
├─ Roles/Permisos               ❌
├─ Facturación (NO edita)       ❌
├─ (resto de admin)             ❌

PERMISOS: Read own leads/comisiones, Generate referral code, Download docs
ACCIONES: View KPIs, Share leads, Upload bank details
```

---

### 4.5 ABOGADO INDEPENDIENTE (role=lawyer, organizationId=NULL)

**Acceso:** NO ACCEDE A /ADMIN, Solo /dashboard

```
UBICACIÓN: /dashboard (DashboardHome)

NO VE SIDEBAR ADMIN.
VE DASHBOARD PERSONAL:

DASHBOARD HOME (/dashboard):
├─ KPIs Personales (casos, clientes, ingresos)
├─ Expedientes (tabla de casos)
├─ Referidos (código + recompensas)
├─ Activity Timeline (notificaciones)
└─ Plan Info (suscripción actual)

PERMISOS: Read own, Write own
ACCIONES: View cases, Create case, Generate referral code, See ingresos
```

---

## 5. FLUJOS DE NAVEGACIÓN POR ROL

### 5.1 ADMIN OS (role=admin)

```
LOGIN (email/password)
  ↓
GET /auth/me
  ├─ role = "admin"
  ├─ tenantId = null (cross-tenant)
  └─ organizationId = null (cross-tenant)
  ↓
REDIRECT /admin
  ↓
SIDEBAR COMPLETO (23 módulos)
  ├─ Dashboard Ejecutivo (index)
  ├─ 4 secciones (Operaciones, Negocio, Red, Sistema)
  └─ Cada sección con múltiples módulos
  ↓
ACCIONES:
├─ Ver todo
├─ Crear usuarios, orgs, roles, permisos
├─ Editar, eliminar
├─ Aprobar comisiones (global)
├─ Pagar comisiones (global)
├─ Suspender usuarios/firmas
├─ Configurar verticales, planes
└─ Acceso a Seguridad (support tokens)
  ↓
CLICK MÓDULO → Navega a /admin/{module}
  ↓
[VOLVER] → Regresa a Dashboard Ejecutivo
```

---

### 5.2 ADMIN DE FIRMA (role=socio_comercial, firm_admin=true)

```
LOGIN (email/password)
  ↓
GET /auth/me
  ├─ role = "socio_comercial"
  ├─ organizationId = "firm_123"
  └─ tenantId = "tenant_X"
  ↓
REDIRECT /admin/organization/firm_123
  ↓
SIDEBAR REDUCIDO (6 módulos firm-specific)
  ├─ Dashboard de Firma (index)
  ├─ Equipo (users, roles, permisos internos)
  ├─ Operaciones (casos, leads consolidados)
  └─ Negocio (facturación, comisiones)
  ↓
INTENTAR ACCEDER /admin/sales-room (global)
  → REDIRECT /admin/organization/firm_123 (acotado)
  ↓
ACCIONES (limitadas a su firma):
├─ Ver usuarios de su firma
├─ Crear abogado asociado
├─ Editar roles internos
├─ Ver casos consolidados de su firma
├─ Ver facturación (MRR, ARR)
├─ Aprobar comisiones de sus abogados
├─ Ver performance de sus abogados
└─ NO ver: usuarios globales, orgs, otros partners
  ↓
CLICK "Cerrar Sesión" → Logout
```

---

### 5.3 AGENTE COMERCIAL (role=lawyer, agent_mode=true)

```
LOGIN (email/password)
  ↓
GET /auth/me
  ├─ role = "lawyer"
  ├─ organizationId = NULL o firm_id
  ├─ commission_rate = 15%
  └─ tenantId = "tenant_X"
  ↓
¿Intenta acceder /admin?
  → BLOCK (403 Forbidden, role ≠ admin)
  ↓
REDIRECT /agent-office (Agent Office Module)
  ↓
SIDEBAR AGENTE (6 módulos personales)
  ├─ Dashboard Agente
  ├─ Leads (Mis Leads Kanban)
  ├─ Clientes (Mis Clientes)
  ├─ Comisiones (Pendiente, Aprobada, Pagada)
  ├─ Análisis (Por País, Tendencias)
  └─ Recursos (Manuales, Videos, Programa Referidos)
  ↓
ACCIONES:
├─ Create lead → POST /leads
├─ Change lead status → PUT /leads/{id}
├─ See my clients → GET /clients?lawyer_id=me
├─ View commissions → GET /agents/me/commissions
├─ Download resource → GET /resources/{id}/download
├─ Share referral code → GET /referrals/my-code
└─ See trends → GET /agents/me/dashboard
  ↓
COMMISSION LIFECYCLE:
├─ Lead convertido → Case creado → Commission generada
├─ Commission aparece en "Pendiente"
├─ Admin aprueba → Mueve a "Aprobada"
├─ Admin paga → Mueve a "Pagada" + Email
└─ Agente ve comprobante
```

---

### 5.4 PARTNER CORPORATIVO (role=socio_comercial, partner_type=true)

```
LOGIN (email/password)
  ↓
GET /auth/me
  ├─ role = "socio_comercial"
  ├─ partner_id = "partner_456"
  └─ tenantId = "tenant_X"
  ↓
REDIRECT /admin/partner/partner_456
  ↓
SIDEBAR PARTNER (4 módulos partner-specific)
  ├─ Dashboard Partner
  ├─ Leads Generados (leads que originó)
  ├─ Conversiones (Leads → Cases)
  ├─ Comisiones (Ganadas, Performance)
  └─ Documentos (Contrato, Banco)
  ↓
ACCIONES:
├─ Ver leads que generó
├─ Ver conversion rate
├─ See comisiones ganadas
├─ Download contrato
├─ Update bank details (encriptado)
├─ Share referral code
└─ NO puede: crear usuarios, editar roles, ver otros partners
  ↓
COMMISSION TRACKING:
├─ Leads generados → Tracked in db.leads (source=partner)
├─ Lead → Case → Commission
├─ Commission.partner_id = partner_456
├─ Partner ve en dashboard
└─ Admin aprueba y paga
```

---

### 5.5 ABOGADO INDEPENDIENTE (role=lawyer, no org)

```
LOGIN (email/password)
  ↓
GET /auth/me
  ├─ role = "lawyer"
  ├─ organizationId = NULL
  └─ tenantId = "tenant_X"
  ↓
¿Intenta acceder /admin?
  → BLOCK (403 Forbidden)
  ↓
REDIRECT /dashboard (DashboardHome)
  ↓
NO VE SIDEBAR ADMIN.
VE: Personal Dashboard

DASHBOARD HOME:
├─ Personal KPIs (my cases, my clients, my referrals)
├─ Expedientes (my cases list)
├─ Referral Program (my code + rewards)
├─ Activity Timeline (my notifications)
└─ Plan Info (my subscription)
  ↓
ACCIONES:
├─ View my cases
├─ Create case
├─ View my clients
├─ Generate referral code
├─ See my referrals
├─ See referral rewards (crédito/dinero)
└─ NO puede: ver admin panel, ver otros users, crear firmas
  ↓
REFERRAL FLOW:
├─ Generate code: GET /referrals/my-code
├─ Comparte URL: /register?ref={code}
├─ Referido compra → Commission creada
├─ Commission appears en próximo statement
└─ Admin paga al mes
```

---

## 6. VISIBILIDAD CONDICIONAL (SIDEBAR LOGIC)

### 6.1 Dónde Vive la Lógica

```
ARCHIVO: frontend/src/components/layout/Sidebar.jsx (SidebarNav)

LÓGICA PSEUDOCÓDIGO:

interface User {
  _id: string
  role: "admin" | "admin_general" | "socio_comercial" | "lawyer" | "client"
  organizationId: string | null
  tenantId: string
  partner_id?: string
}

const getVisibleSections = (user: User) => {
  switch (user.role) {
    case "admin":
    case "admin_general":
      return ALL_SECTIONS  // 5 secciones, 23 módulos
    
    case "socio_comercial":
      if (user.partner_id) {
        return PARTNER_SECTIONS  // 4 modules partner-specific
      } else if (user.organizationId) {
        return FIRM_SECTIONS  // 6 modules firm-specific
      }
      break
    
    case "lawyer":
      return null  // NO sidebar, /agent-office en lugar de /admin
    
    case "client":
      return null  // NO admin access
  }
}

const renderSidebar = (user: User) => {
  const sections = getVisibleSections(user)
  if (!sections) {
    // Redirect /agent-office si lawyer
    // Redirect /dashboard si client
    return null
  }
  
  // Renderizar sections dinámicamente
  return sections.map(section => (
    <SectionGroup key={section.id} items={section.items} />
  ))
}
```

### 6.2 Módulos por Rol (Matriz)

```
MÓDULO                      ADMIN  FIRM   PARTNER AGENT  INDEP  CLIENT
─────────────────────────────────────────────────────────────────────
Dashboard Ejecutivo         ✅     ❌     ❌      ❌     ❌     ❌
Control Maestro             ✅     ❌     ❌      ❌     ❌     ❌
Portal de Casos (global)    ✅     ❌     ❌      ❌     ❌     ❌
Sala de Ventas              ✅     ❌     ❌      ❌     ❌     ❌
Segmentación Países         ✅     ❌     ❌      ❌     ❌     ❌
Suscripciones               ✅     ❌     ❌      ❌     ❌     ❌
Planes                      ✅     ❌     ❌      ❌     ❌     ❌
Centro Suscripción          ✅     ❌     ❌      ❌     ❌     ❌
Actualizar Plan             ✅     ❌     ❌      ❌     ❌     ❌
Facturación                 ✅     ⚠️*    ⚠️*    ❌     ❌     ❌
IA Comercial                ✅     ❌     ❌      ❌     ❌     ❌
Notificaciones              ✅     ❌     ❌      ❌     ❌     ❌
Socios Comerciales          ✅     ❌     ❌      ❌     ❌     ❌
Organizaciones              ✅     ⚠️*    ❌      ❌     ❌     ❌
Usuarios                    ✅     ⚠️*    ❌      ❌     ❌     ❌
Referidos                   ✅     ❌     ❌      ❌     ❌     ❌
Implementaciones            ✅     ❌     ❌      ❌     ❌     ❌
Motor Multivertical         ✅     ❌     ❌      ❌     ❌     ❌
Roles                       ✅     ⚠️*    ❌      ❌     ❌     ❌
Permisos                    ✅     ⚠️*    ❌      ❌     ❌     ❌
Inventario                  ✅     ❌     ❌      ❌     ❌     ❌
Seguridad                   ✅     ❌     ❌      ❌     ❌     ❌
Accesos Soporte             ✅     ❌     ❌      ❌     ❌     ❌
Recurso Dashboard (agente)  ❌     ❌     ❌      ✅     ❌     ❌
Mis Leads (agente)          ❌     ❌     ❌      ✅     ❌     ❌
Mis Clientes (agente)       ❌     ❌     ❌      ✅     ❌     ❌
Comisiones (agente)         ❌     ❌     ❌      ✅     ❌     ❌
Performance (agente)        ❌     ❌     ❌      ✅     ❌     ❌
Recursos (agente)           ❌     ❌     ❌      ✅     ❌     ❌

LEYENDA:
✅ = Acceso completo
⚠️* = Acceso scoped a su org/firma/partner (data filtered)
❌ = No accede (hidden + 403 si intenta)
```

---

## 7. CAMBIOS DE UBICACIÓN (SIN CAMBIO DE CÓDIGO)

### 7.1 Módulos que CONSERVAN ruta

```
SIN CAMBIOS:
├─ /admin/                    → ExecutiveDashboard (index)
├─ /admin/master              → MasterControl
├─ /admin/cases-portal        → CasesPortal
├─ /admin/sales-room          → SalesRoomModule
├─ /admin/countries           → CountrySegmentation
├─ /admin/subscriptions       → SubscriptionsDashboard
├─ /admin/plans               → PlansDashboard
├─ /admin/subscription-center → SubscriptionCenter
├─ /admin/upgrade             → UpgradeCenter
├─ /admin/billing             → BillingDashboard
├─ /admin/commercial-ai       → CommercialAIDashboard
├─ /admin/notifications       → NotificationsDashboard
├─ /admin/partners            → PartnersDashboard
├─ /admin/organizations       → OrganizationsDashboard
├─ /admin/users               → UsersDashboard
├─ /admin/referrals           → ReferralsDashboard
├─ /admin/implementations     → ImplementationsDashboard
├─ /admin/verticals           → VerticalsDashboard
├─ /admin/roles               → RolesDashboard
├─ /admin/permissions         → PermissionsDashboard
├─ /admin/inventory           → InventoryModule
├─ /admin/security            → SecurityDashboard
└─ /admin/support-access      → SupportAccessPanel

RUTAS NUEVAS (SCOPED, no tocan originales):
├─ /admin/organization/{org_id}/*     → Firma-specific dashboards
├─ /admin/partner/{partner_id}/*      → Partner-specific dashboards
└─ /agent-office/*                    → Agent Office Module

CAMBIO EN SIDEBAR: Lógica de visibilidad, NO rutas.
```

---

## 8. ESTRUCTURA JERÁRQUICA FINAL (VISUAL)

### 8.1 Jerarquía de Menú (ADMIN OS COMPLETO)

```
┌─ PUNTO CERO SYSTEM OS ─────────────────┐
│                                         │
│ ◆ Dashboard Ejecutivo                  │
│                                         │
│ ▸ OPERACIONES (5)                      │
│   ├─ Control Maestro                   │
│   ├─ Portal de Casos                   │
│   ├─ Sala de Ventas                    │
│   └─ Segmentación por Países           │
│                                         │
│ ▸ NEGOCIO (7)                          │
│   ├─ Suscripciones                     │
│   ├─ Planes                            │
│   ├─ Centro de Suscripción             │
│   ├─ Actualizar Plan                   │
│   ├─ Facturación & Contabilidad        │
│   ├─ IA Comercial                      │
│   └─ Notificaciones                    │
│                                         │
│ ▸ RED Y TALENTO (6)                    │
│   ├─ Socios Comerciales                │
│   ├─ Organizaciones                    │
│   ├─ Usuarios                          │
│   ├─ Referidos                         │
│   ├─ Implementaciones                  │
│   └─ Motor Multivertical               │
│                                         │
│ ▸ SISTEMA (4)                          │
│   ├─ Roles                             │
│   ├─ Permisos                          │
│   ├─ Inventario Inteligente            │
│   └─ Seguridad                         │
│                                         │
│ ▸ PROTECCIÓN (1)                       │
│   └─ Accesos de Soporte                │
│                                         │
│ ⟲ Cerrar Sesión                        │
└─────────────────────────────────────────┘

Secciones: 5
Módulos: 23
Grupos: Colapsibles
Iconografía: Lucide React
```

---

## 9. IMPLEMENTACIÓN (SIN CÓDIGO)

### 9.1 Dónde Vive la Lógica

```
ARCHIVO PRINCIPAL:
└─ frontend/src/components/layout/Sidebar.jsx (SidebarNav)

CAMBIOS NECESARIOS:
├─ Importar user desde useAuth()
├─ Definir moduleRegistry (array de módulos)
├─ Implementar función getVisibleModules(user)
├─ Filtrar módulos por role + organizationId
├─ Renderizar dinámicamente
└─ Mantener styling, animaciones, UX actual

RUTAS (NO CAMBIAN):
├─ /admin/* → AdminModule.jsx (existing)
├─ /admin/organization/{org_id}/* → Nueva ruta (scoped)
├─ /admin/partner/{partner_id}/* → Nueva ruta (scoped)
├─ /agent-office/* → AgentOfficeModule (nuevo, FASE 2)
└─ /dashboard → DashboardHome (existing, personal)

COMPONENTES (NO CAMBIAN):
├─ AdminModule.jsx ← routes (no modificar)
├─ AdminOSLayout.jsx ← shell (no modificar)
├─ Cada módulo en pages/ ← content (no modificar)
└─ Sidebar.jsx ← SOLO visibilidad condicional

FLUJO VISUAL:
User logs in → GET /auth/me → Check role + organizationId
  ↓
Redirect a /admin, /agent-office, o /dashboard
  ↓
Sidebar renderiza módulos visibles
  ↓
Click módulo → Navigate to /admin/{module} (existing route)
```

### 9.2 No Code Needed para

```
❌ No tocar AdminModule.jsx
   └─ Rutas ya existen
   └─ Solo visibilidad condicional en Sidebar

❌ No tocar AdminOSLayout.jsx
   └─ Shell ya existe
   └─ Solo referencias al SidebarNav

❌ No mover archivos
   └─ Estructura directorio: igual

❌ No cambiar nombres de módulos
   └─ Naming: igual en UI + código

❌ No crear nuevos componentes
   └─ Reutilizar componentes existentes

✅ SOLO cambio necesario:
   └─ Sidebar.jsx: Lógica de visibilidad condicional
```

---

## 10. CHECKLIST DE VALIDACIÓN

```
NOMBRES:
☑ Todos los 23 módulos conservan identidad
☑ Sin cambios de naming
☑ Sin cambios de traducción
☑ Consistencia con backend routes

RUTAS:
☑ Todas las /admin/* rutas sin cambios
☑ Nuevas rutas (/admin/organization/{id}/*) fuera de conflict
☑ /agent-office/* con rutas nuevas (FASE 2)
☑ /dashboard → personal (sin cambios)

VISIBILIDAD:
☑ ADMIN: 23 módulos visibles
☑ FIRMA ADMIN: 6 módulos (team, ops, billing)
☑ AGENT: 6 módulos (agent-office, NO /admin)
☑ PARTNER: 4 módulos (partner-specific)
☑ INDEPENDIENTE: NO /admin, solo /dashboard
☑ CLIENT: NO /admin, solo /dashboard

FLUJOS:
☑ Login → role check → redirect correcto
☑ Intentar acceso forbidden → 403 (si aplica)
☑ Sidebar renderiza módulos visibles
☑ Click módulo → navigate (ruta existente)

COMPATIBILIDAD:
☑ 0 cambios a código de módulos
☑ 0 movimiento de archivos
☑ 0 cambios de rutas existentes
☑ 100% backward compatible
```

---

## 11. RESUMEN EJECUTIVO

### Matriz de Roles Final

```
┌──────────────────┬─────────┬─────────────┬──────────────────┬──────────────┐
│ TIPO DE USUARIO  │ ROLE    │ ACCESO      │ MÓDULOS VISIBLES │ UBICACIÓN    │
├──────────────────┼─────────┼─────────────┼──────────────────┼──────────────┤
│ Admin OS         │ admin   │ Cross-      │ 23 (COMPLETO)    │ /admin       │
│                  │ admin_  │ tenant      │                  │              │
│                  │ general │             │                  │              │
├──────────────────┼─────────┼─────────────┼──────────────────┼──────────────┤
│ Admin de Firma   │ socio_  │ Org scoped  │ 6 (Firm-spec)    │ /admin/org   │
│ Jurídica         │ comercl │             │                  │ /{org_id}    │
│                  │ al      │             │                  │              │
├──────────────────┼─────────┼─────────────┼──────────────────┼──────────────┤
│ Admin de Partner │ socio_  │ Partner     │ 4 (Partner-spec) │ /admin/      │
│ Corporativo      │ comercl │ scoped      │                  │ partner/{id} │
│                  │ al      │             │                  │              │
├──────────────────┼─────────┼─────────────┼──────────────────┼──────────────┤
│ Agente Comercial │ lawyer  │ Personal    │ 6 (Agent office) │ /agent-      │
│ (con comisiones) │         │             │                  │ office       │
├──────────────────┼─────────┼─────────────┼──────────────────┼──────────────┤
│ Abogado Independ │ lawyer  │ Personal    │ 0 (NO /admin)    │ /dashboard   │
│                  │         │             │ Dashboard only   │              │
├──────────────────┼─────────┼─────────────┼──────────────────┼──────────────┤
│ Cliente          │ client  │ Limitado    │ 0 (NO /admin)    │ /dashboard   │
│                  │         │             │ Dashboard only   │              │
└──────────────────┴─────────┴─────────────┴──────────────────┴──────────────┘
```

---

## CONCLUSIÓN

### Estructura Final es:

```
✅ 23 módulos: Nombres sin cambios
✅ 5 secciones: Operaciones, Negocio, Red, Sistema, Protección
✅ Menú dinámico: Visibilidad condicional por rol
✅ 5 tipos de usuario: Cada uno ve lo apropiado
✅ 0 cambios de código: Puro scoping lógico
✅ 0 movimiento de archivos: Rutas idénticas
✅ 100% compatible: Con todos los cambios anteriores (FASE 1-4)
```

---

**Documento Completado:** Junio 2026  
**Status:** ✅ STRUCTURE FINAL — READY FOR SIDEBAR IMPLEMENTATION  
**Breaking Changes:** ZERO ✅  
**Backward Compatibility:** 100% ✅

