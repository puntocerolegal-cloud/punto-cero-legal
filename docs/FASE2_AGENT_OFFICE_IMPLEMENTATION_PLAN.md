# FASE 2 — AGENT OFFICE IMPLEMENTATION PLAN

**Estructura Segura para Oficina Virtual del Agente**

**Fecha:** Junio 2026  
**Status:** PLANNING & AUDIT COMPLETE  
**Objetivo:** Preparar extensiones de módulos existentes sin refactoring ni reorganización

---

## 📋 TABLA DE CONTENIDOS

1. Resumen Ejecutivo
2. Auditoría de Módulos Existentes
3. Mapa de Reutilización (Módulo Actual → Futuro)
4. Estructura Lógica de Oficina Virtual
5. Modelos y Contratos de Datos Necesarios
6. Mapeo de Componentes Reutilizables
7. Dependencias e Integraciones
8. Riesgos y Mitigaciones
9. Roadmap de Implementación Detallado
10. Checklist de Preparación

---

## 1. RESUMEN EJECUTIVO

### 1.1 Estado Actual

```
MÓDULOS EXISTENTES:
├─ Sala de Ventas (SalesRoomModule.jsx)      ✅ OPERATIVA
├─ Socios Comerciales (PartnersDashboard)    ✅ OPERATIVA
├─ Referidos (ReferralsDashboard)            ✅ OPERATIVA
└─ Organizaciones (OrganizationsDashboard)   ✅ OPERATIVA

INFRAESTRUCTURA BACKEND:
├─ /admin-ops/sales/*                        ✅ OPERATIVA
├─ /partners                                 ✅ OPERATIVA
├─ /referrals                                ✅ OPERATIVA
├─ /organizations                            ✅ OPERATIVA
├─ /cases, /leads, /clients                  ✅ PARCIAL
└─ Índices en MongoDB                        ✅ LISTOS (FASE 1)

OFICINA VIRTUAL AGENTES:
├─ Componentes necesarios                    ⏳ PREPARAR (FASE 2)
├─ Rutas backend necesarias                  ⏳ PREPARAR (FASE 2)
├─ Modelos de datos necesarios               ⏳ PREPARAR (FASE 2)
└─ Integración con sistemas                  ⏳ PREPARAR (FASE 2)

RIESGO ARQUITECTÓNICO:
├─ Reorganización: NO
├─ Refactoring: NO
├─ UI changes: MÍNIMAS
├─ Route changes: EXTENSIÓN (no reordenamiento)
└─ Total: ✅ SEGURO
```

### 1.2 Estrategia de FASE 2

```
NO:
❌ Crear dashboards nuevos desde cero
❌ Refactorizar módulos existentes
❌ Mover archivos o cambiar estructura
❌ Modificar Admin OS o Dashboard de Abogados
❌ Tocar rutas existentes

SÍ:
✅ Extender módulos existentes con datos nuevos
✅ Crear endpoints que agreguen datos existentes
✅ Preparar componentes para Oficina Virtual
✅ Documentar dependencias y contratos
✅ Crear estructura lógica segura
```

---

## 2. AUDITORÍA DE MÓDULOS EXISTENTES

### 2.1 Sala de Ventas (SalesRoomModule.jsx)

**Ubicación:** `frontend/src/modules/admin/pages/SalesRoomModule.jsx`

**Estado Actual:**
```
Líneas:     ~250+
Propósito:  Gestión de candidatos (abogados solicitantes)
Datos:      /admin-ops/sales/candidates
Funciones:
├─ Listado con filtros (in_process, active, rejected)
├─ Búsqueda por nombre/email/especialidad
├─ Drawer detallado (SalesCandidateDrawer)
├─ Acciones: Aprobar, Rechazar, Pago pendiente
├─ Chat privado con candidatos
└─ KPIs: Total, En proceso, Activos, Rechazados
```

**Componentes Internos:**
```
├─ SalesCandidateDrawer (fichas detalladas)
│  ├─ Info básica (email, teléfono, país)
│  ├─ Especialidades (specialty)
│  ├─ Documentos (bar_number, id_document)
│  ├─ Chat de seguimiento
│  └─ Notas internas
│
└─ Métodos reutilizables:
   ├─ Filtrado por status
   ├─ Búsqueda con regex
   ├─ Carga de KPIs
   └─ Acciones (approve, reject, mark pending)
```

**Reutilización para Agent Office:**
```
✅ Patrón de fichas (SalesCandidate → AgentProfile)
✅ Componente Drawer (mismo para agentes)
✅ Estructura de KPIs (aplicable a leads, comisiones)
✅ Sistema de filtros (reutilizable)
✅ Chat/notas (transfeible a agentes)
✅ Gestión de estado (status helpers)

Estimado: 70% reutilizable
```

### 2.2 Partners Dashboard (PartnersDashboard.jsx)

**Ubicación:** `frontend/src/modules/partners/pages/PartnersDashboard.jsx`

**Estado Actual:**
```
Líneas:     ~250+
Propósito:  Gestión de socios comerciales
Datos:      /partners (MongoDB backend)
Funciones:
├─ KPIs: Leads, Empresas, Verticales, Partners, Conversiones, Comisiones
├─ Centro de Operaciones (6 métricas)
├─ Pipeline de vendas (Kanban-ready)
├─ Tabla de partners (empresa, contacto, vertical, estado, comisión)
├─ Gráficos: Funnel, Conversión, Revenue by Partner
└─ Agent Manager (componente embebido)
```

**Componentes Reutilizables:**
```
├─ OperationsCenter (lista de operaciones con contadores)
│  → Reutilizable para Leads, Comisiones
│
├─ MetricCard (tarjetas de KPI)
│  → Mismo patrón para agentes
│
├─ DataTable (tabla genérica)
│  → Base para tabla de clientes, leads
│
├─ Charts (FunnelChart, RevenueChart, ConversionChart)
│  → Reutilizables para países, comisiones
│
├─ StatusBadge (badges de estado)
│  → Mismo patrón para leads/comisiones
│
└─ PartnerPipeline (Kanban visual)
   → Base para Lead Pipeline

Estimado: 85% reutilizable (más que SalesRoom)
```

### 2.3 Referrals Dashboard (ReferralsDashboard.jsx)

**Ubicación:** `frontend/src/modules/referrals/pages/ReferralsDashboard.jsx`

**Estado Actual:**
```
Líneas:     ~150
Propósito:  Motor de referidos (código + recompensas)
Datos:      /referrals (backend)
Funciones:
├─ KPIs: Registrados, Convertidos, Meses ganados, Clicks
├─ Centro de Operaciones (4 métricas)
├─ Card de compartición (código, QR, social share)
├─ Directorio de referidos (lista tabular)
├─ Timeline de actividad
└─ Gráfico de estado (casos chart)
```

**Reutilización para Agent Office:**
```
✅ OperationsCenter (ya visto en Partners)
✅ MetricCard (patrón similar)
✅ ReferralShareCard (adaptable a recursos)
✅ ReferralDirectory (similar a tablas de agentes)
✅ ReferralTimeline (actividad, conversion)
✅ Charts (conversión, estado, ingresos)

Estimado: 80% reutilizable
```

### 2.4 Organizations Dashboard (OrganizationsDashboard.jsx)

**Ubicación:** `frontend/src/modules/organizations/pages/OrganizationsDashboard.jsx`

**Estado Actual:**
```
Propósito:  Gestión de organizaciones (firmas, empresas, verticales)
Datos:      /organizations (MongoDB backend)
Funciones:
├─ Listado de organizaciones
├─ Filtros por vertical, plan, status
├─ Cards de organización (KPI individual)
├─ Vista de usuarios por organización
├─ Health check (estados, alertas)
└─ Gestión de límites y configuración
```

**Reutilización para Agent Office:**
```
✅ OrganizationCard (patrón para cliente cards)
✅ Estructura de filtros (país, tipo, estado)
✅ OrganizationHealth (adaptable a desempeño de agente)
✅ OrganizationUsers (similar a leads de agente)

Estimado: 65% reutilizable
```

### 2.5 Backend Routes Auditoría

#### admin_ops.py
```
Endpoints existentes:
├─ GET /admin-ops/header/stats          → KPIs en header
├─ GET /admin-ops/notifications         → Notificaciones
├─ GET /admin-ops/sales/stats           → Stats de candidatos
├─ GET /admin-ops/sales/candidates      → Listado de candidatos
├─ POST /admin-ops/sales/candidates/{id}/approve
├─ POST /admin-ops/sales/candidates/{id}/reject
├─ POST /admin-ops/sales/candidates/{id}/pending-payment
├─ GET /admin-ops/sales/candidates/{id}/chat
└─ POST /admin-ops/sales/candidates/{id}/chat

Patrón identificado:
├─ Autenticación vía JWT (admin, admin_general, socio_comercial)
├─ Validación de rol
├─ Stats → KPIs
├─ CRUD con status handling
├─ Chat privado con notificaciones
└─ Respuestas JSON estructuradas

Reutilizable para:
✅ /agents/{id}/leads (similar a candidates)
✅ /agents/{id}/clients (similar a chat)
✅ /agents/{id}/commissions (similar a stats)
```

#### partners.py
```
Endpoints existentes:
├─ GET /partners                         → Listado (con filters)
├─ POST /partners                        → Crear partner
├─ GET /partners/{id}                    → Detalle
├─ PUT /partners/{id}                    → Actualizar
├─ DELETE /partners/{id}                 → Eliminar
├─ GET /partners/stats                   → KPIs consolidadas
└─ GET /partners/{id}/performance        → Metricas por partner

Patrón:
├─ CRUD estándar de FastAPI
├─ Agregaciones MongoDB
├─ Scoping multi-tenant (tenantId header)
├─ Validación de schema Pydantic
└─ Response models tipados

Reutilizable para:
✅ /agents (mismo patrón CRUD)
✅ /commissions (mismo scoping, agregaciones)
✅ /countries (similar, pero con datos maestros)
```

#### referrals.py
```
Endpoint: GET /referrals (listado + stats)

Características:
├─ Generación de código único
├─ Validación de referral_code
├─ Cálculo de recompensas
├─ Tracking de actividad
└─ Estado de conversión

Reutilizable:
✅ /agents/{id}/referrals (modelo ya existe)
✅ Patrón de código único (aplicable a otros recursos)
```

#### organizations.py
```
Endpoints:
├─ CRUD estándar de organizaciones
├─ Filtros por tenant, vertical, plan
├─ Slug uniqueness per tenant
└─ Owner assignment

Patrón importante:
├─ Multi-tenant scoping
├─ Slug generation
├─ Ownership validation
└─ Relationship management

Reutilizable para:
✅ Modelar "Firmas" como Organizations
✅ Validación de permisos por org
```

---

## 3. MAPA DE REUTILIZACIÓN (Módulo Actual → Futuro)

### 3.1 Mapeo Completo

```
FRONTEND COMPONENTS:

Sala de Ventas → Agent Manager
├─ SalesRoomModule.jsx         → AgentManagerModule.jsx (extensión)
│  ├─ Candidatos               → Agentes (mismo patrón)
│  ├─ Filtros                  → Igual (status, país, tipo)
│  ├─ Búsqueda                 → Igual (nombre, email, especialidad)
│  └─ Drawer                   → AgentProfileDrawer (reutilizar)
│
└─ SalesCandidateDrawer        → AgentProfileDrawer (extiende)
   ├─ Info básica              → Igual (email, teléfono, país)
   ├─ Documentos               → Igual (bar_number, id_document)
   ├─ Chat                     → Igual (comunicación con admin)
   ├─ Notas                    → Igual (seguimiento)
   └─ AGREGAR: Comisiones, leads activos, documentos bancarios

Partners Dashboard → Commissions + Performance
├─ OperationsCenter            → REUTILIZAR (mismos componentes)
├─ MetricCard                  → REUTILIZAR (KPIs agente)
├─ DataTable                   → REUTILIZAR (tabla de comisiones)
├─ Charts (Funnel, Revenue)    → ADAPTAR (por país, por período)
├─ StatusBadge                 → REUTILIZAR (estado comisión)
└─ PartnerPipeline             → ADAPTAR (Lead Pipeline Kanban)

Referrals Dashboard → Agent Income Dashboard
├─ OperationsCenter            → REUTILIZAR (referidos activos)
├─ MetricCard                  → REUTILIZAR (KPI generales)
├─ ReferralShareCard           → ADAPTAR (código compartible)
├─ ReferralDirectory           → ADAPTAR (directorio de agentes)
├─ ReferralTimeline            → REUTILIZAR (actividad)
└─ Charts (Conversion)         → REUTILIZAR (conversion rate)

Organizations → Clients Module
├─ OrganizationCard            → ClientCard (adaptación menor)
├─ Filtros                     → REUTILIZAR (país, plan, estado)
├─ OrganizationHealth          → ClientHealth (adaptación)
└─ OrganizationUsers           → ClientCases (similar)


BACKEND ENDPOINTS:

admin_ops.py → agents/* (extensión)
├─ /admin-ops/sales/candidates      → /agents (listado)
│  └─ Patrón: GET con status filter  → Mismo patrón
│
├─ /admin-ops/sales/stats           → /agents/stats (KPIs)
│  └─ Patrón: Agregaciones          → Aplicable
│
└─ /admin-ops/sales/candidates/{id} → /agents/{id} (CRUD)
   └─ Patrón: POST para acciones    → Mismo pattern para comisiones

partners.py → commissions/* (nuevo, pero patrón similar)
├─ GET /partners               → GET /commissions
│  └─ Patrón: listado + filtros
│
├─ GET /partners/{id}          → GET /commissions/{id}
│  └─ Patrón: detalle
│
└─ GET /partners/stats         → GET /commissions/stats
   └─ Patrón: agregaciones

referrals.py → agents/{id}/referrals (extensión)
├─ GET /referrals              → GET /agents/{id}/referrals
│  └─ Patrón: listado + stats

organizations.py → unchanged (ya es genérico)
├─ Relación: users.organizationId ← FASE 1
└─ Validación: ownerId → permissions (FASE 2)
```

### 3.2 Reutilización Porcentaje

```
FRONTEND:
├─ Componentes reutilizables:     85% (MetricCard, Cards, Charts, Tables, Badges)
├─ Patrones reutilizables:        90% (Drawer, Filters, Search, Pagination)
├─ Código totalmente nuevo:       15% (Lógica de comisiones, gráfico de países)
└─ TOTAL REUTILIZACIÓN:          85%

BACKEND:
├─ Patrones reutilizables:        90% (CRUD, Auth, Scoping, Response models)
├─ Endpoints a extender:         70% (admin_ops, partners routes)
├─ Endpoints nuevos necesarios:  30% (commissions, countries endpoints)
└─ TOTAL REUTILIZACIÓN:          70%

INFRAESTRUCTURA:
├─ Índices MongoDB:              100% (creados en FASE 1)
├─ TenantContext:                100% (reutilizar tal cual)
├─ APIClient:                    100% (sin cambios)
└─ Auth:                         100% (sin cambios)
```

---

## 4. ESTRUCTURA LÓGICA DE OFICINA VIRTUAL

### 4.1 Arquitectura de Componentes

```
frontend/src/modules/agent-office/ (NUEVA CARPETA, FASE 2)
├─ pages/
│  ├─ AgentDashboard.jsx           (Orquestador principal)
│  ├─ LeadsModule.jsx              (Extensión de leads)
│  ├─ ClientsModule.jsx            (Agregación de clientes)
│  ├─ CommissionsModule.jsx        (Nuevo, backend de FASE 1)
│  ├─ CountriesModule.jsx          (Nuevo, data de transactions)
│  └─ ResourcesModule.jsx          (Nuevo, db.resources)
│
├─ components/
│  ├─ KPISection.jsx               (Reutilizar MetricCard)
│  ├─ LeadKanban.jsx               (Adaptar PartnerPipeline)
│  ├─ ClientTable.jsx              (Reutilizar DataTable)
│  ├─ CommissionTabs.jsx           (Nuevo, pero patrón Tab simple)
│  ├─ CountryAnalysis.jsx          (Nuevo, gráficos)
│  ├─ ResourceGrid.jsx             (Nuevo, grid de tarjetas)
│  └─ AgentProfileDrawer.jsx       (Reutilizar SalesCandidateDrawer)
│
└─ hooks/
   ├─ useAgentDashboard.js         (Data fetching)
   ├─ useLeads.js                  (Leads data)
   ├─ useClients.js                (Clients data)
   ├─ useCommissions.js            (Commissions data)
   ├─ useCountries.js              (Countries performance)
   └─ useResources.js              (Resources sharing)
```

### 4.2 Flujo de Datos

```
User accede a /agent-office
    ↓
AgentDashboard (page)
    ├─ GET /auth/me (token)
    ├─ GET /agents/me/dashboard
    │  ├─ useAgentDashboard()      → KPIs, leads, clientes
    │  ├─ useLeads()               → db.leads aggregation
    │  ├─ useClients()             → db.transactions aggregation
    │  ├─ useCommissions()         → db.commissions (FASE 1)
    │  └─ useCountries()           → transactions grouped by country
    │
    └─ Rendered:
       ├─ KPI Section              (MetricCards)
       ├─ Leads Kanban             (Visual pipeline)
       ├─ Clients Table            (Listado)
       ├─ Commissions Tabs         (pending/approved/paid)
       ├─ Countries Analysis       (Pie chart, líneas)
       └─ Resources Grid           (Compartidos)
```

### 4.3 Módulos Detallados (No código, solo estructura)

#### Module 1: Leads (LeadsModule.jsx)

**Ubicación:** `frontend/src/modules/agent-office/pages/LeadsModule.jsx`

**Estructura:**
```
Header:
├─ Filtros: [Estado] [Área Legal] [Período]
├─ Búsqueda: [nombre cliente]
└─ Total: [contador]

Body (Kanban):
├─ Columna 1: NUEVO
│  └─ Cards de leads sin atender
│
├─ Columna 2: CONTACTADO
│  └─ Cards con fechas de follow-up
│
├─ Columna 3: EN_EVALUACIÓN
│  └─ Cards con notas de progreso
│
├─ Columna 4: PROPUESTA
│  └─ Cards con presupuestos
│
└─ Columna 5: GANADO
   └─ Cards con monto del contrato

Components usado:
├─ PartnerPipeline (patrón base, adaptar)
├─ Cards (click abre Drawer)
├─ Drawer detallado (editar, notas, marcar ganado)
└─ Toast notifications (estado)

Data fuente:
├─ db.leads (lawyer_id = current_user._id)
├─ Status: new, contacted, evaluating, proposal, won, lost
└─ Ordenado por created_at DESC
```

#### Module 2: Clients (ClientsModule.jsx)

**Ubicación:** `frontend/src/modules/agent-office/pages/ClientsModule.jsx`

**Estructura:**
```
Header:
├─ Filtros: [País] [Plan] [Estado Suscripción] [Período]
├─ Búsqueda: [nombre cliente]
└─ Total clientes activos

Table:
├─ Columna: Cliente (nombre, email)
├─ Columna: País (código divisa)
├─ Columna: Plan (Essential/Pro/Enterprise)
├─ Columna: Estado (Activo/Vencimiento próximo)
├─ Columna: Casos (contador)
└─ Columna: Acciones (Ver, Agregar caso, Cambiar plan)

Components usado:
├─ DataTable (reutilizar completamente)
├─ StatusBadge (reutilizar)
├─ Drawer detallado (perfil cliente, contratos, historial)
└─ Alerts (vencimientos, oportunidades)

Data fuente:
├─ db.transactions (user_email filter)
├─ db.organizations (owner_id = current_user._id si aplica)
├─ db.cases (lawyer_id = current_user._id)
└─ Agregación: count cases, last purchase date
```

#### Module 3: Commissions (CommissionsModule.jsx)

**Ubicación:** `frontend/src/modules/agent-office/pages/CommissionsModule.jsx`

**Estructura:**
```
Header:
├─ Período selector (mes/año)
├─ Total acumulado
└─ Próxima fecha de pago (admin estima)

Tabs:
├─ TAB 1: PENDIENTE
│  ├─ Comisiones sin revisar (status=pending)
│  ├─ Tabla: Caso | Cliente | Monto | Desde
│  ├─ Total pendiente
│  └─ Botón: Solicitar adelanto
│
├─ TAB 2: APROBADA
│  ├─ Comisiones aprobadas (status=approved)
│  ├─ Tabla con mismas columnas
│  ├─ Total aprobado
│  └─ Nota: "Próximo pago: [fecha]"
│
├─ TAB 3: PAGADA
│  ├─ Comisiones pagadas (status=paid)
│  ├─ Últimos 90 días
│  ├─ Tabla + PDF comprobante
│  ├─ Total período
│  └─ Botón: Descargar reporte PDF
│
└─ TAB 4: HISTORIAL
   ├─ Todas las comisiones (last 12 months)
   ├─ Gráfico de línea: ingresos por mes
   ├─ Filtro por período
   └─ Exportar CSV

Components usado:
├─ Tabs (native React)
├─ Table (reutilizar DataTable)
├─ StatusBadge
├─ MetricCard (para totales)
├─ LineChart (gráfico ingresos)
└─ PDF/CSV exporters

Data fuente:
├─ db.commissions (agent_id = current_user._id)
├─ Status: pending, approved, paid, disputed, reversed
├─ Filtered by period (created_at, paid_at)
└─ Ordenado by created_at DESC
```

#### Module 4: Countries (CountriesModule.jsx)

**Ubicación:** `frontend/src/modules/agent-office/pages/CountriesModule.jsx`

**Estructura:**
```
Header:
├─ Período selector
├─ Total global
└─ Trend (comparación con período anterior)

Main View:
├─ Table: País | Clientes | Ventas | Comisión | Tasa Conv | Trend
│  └─ Click en país filtra otros módulos
│
├─ Gráfico 1 (Pie): Ingresos por país (%)
├─ Gráfico 2 (Lines): Evolución mensual por país
└─ KPI Cards: País TOP, Conversión TOP, Crecimiento TOP

Components usado:
├─ DataTable (reutilizar)
├─ PieChart (gráfico distribución)
├─ LineChart (gráfico evolución)
├─ MetricCard (KPI top)
└─ Tooltip (información por país)

Data fuente:
├─ db.transactions aggregation (group by country)
├─ db.cases aggregation (filter by lawyer_id, group by country)
├─ db.countries (maestro, optional FASE 2)
├─ Calculated: count clientes, sum amount, conversion %, trend
└─ Ordenado by revenue DESC
```

#### Module 5: Resources (ResourcesModule.jsx)

**Ubicación:** `frontend/src/modules/agent-office/pages/ResourcesModule.jsx`

**Estructura:**
```
Header:
├─ Título: "Centro de Recursos - Agentes"
└─ Búsqueda por keyword

Categories (Tabs):
├─ MANUALES
│  ├─ Cards: Documento, size, fecha, botones [Ver] [Descargar]
│  └─ Grid 2 cols
│
├─ PRESENTACIONES
│  ├─ Cards: Decks, botones [Ver] [Descargar] [Compartir]
│  └─ Grid 2 cols
│
├─ VIDEOS
│  ├─ Cards: Thumbnail, duración, botones [Ver] [Compartir]
│  └─ Grid 2 cols
│
├─ TEMPLATES
│  ├─ Cards: Documento descargable
│  └─ Grid 3 cols
│
└─ ESTUDIOS
   ├─ Cards: PDF, fecha, botones
   └─ Grid 2 cols

Components usado:
├─ Tabs
├─ Grid de Cards (reutilizar de ReferralShareCard patrón)
├─ Icons (archivo, video, documento)
├─ Buttons (Ver, Descargar, Compartir, Favorito)
└─ Modal (para previsualizaciones)

Data fuente:
├─ db.resources (nuevo, FASE 2)
├─ Campos: category, title, url/file_path, created_at, updated_at
├─ Filtrado por categoría (tabs)
└─ Búsqueda por keyword en title
```

---

## 5. MODELOS Y CONTRATOS DE DATOS NECESARIOS

### 5.1 Modelos MongoDB (Backend)

#### Collections Existentes a Extender:

**db.users** (ya tiene organizationId de FASE 1)
```
Campos usados en Oficina Virtual:
├─ _id (agent_id)
├─ email
├─ full_name
├─ role
├─ organizationId (relación a firma, FASE 1)
├─ country
├─ specialty
├─ phone
├─ bar_number
├─ firm_name
└─ status

Extensiones futuras (no FASE 2, pero documentar):
├─ commission_rate % (base comisión)
├─ payment_method (banco, paypal)
├─ bank_account (encriptado)
└─ performance_score (1-100)
```

**db.leads** (existente, usado por agentes)
```
Estructura actual:
├─ _id
├─ lawyer_id (FK → users._id)
├─ client_name
├─ client_email
├─ client_phone
├─ legal_area
├─ description
├─ status (pending, assigned, won, lost)
├─ source
├─ assigned_date
├─ converted_to (FK → cases._id)
├─ created_at
└─ updated_at

Para Oficina Virtual (agregar índice):
└─ Index: {lawyer_id: 1, status: 1} (si no existe)
```

**db.cases** (existente, usado para clientes)
```
Estructura actual:
├─ _id
├─ lawyer_id
├─ client_id
├─ status
├─ title
├─ description
├─ value (monto del contrato)
├─ created_at
├─ closed_at
└─ otros campos

Para Oficina Virtual:
└─ Index: {lawyer_id: 1, created_at: -1} (si no existe)
```

**db.transactions** (existente, usado para clientes)
```
Estructura actual:
├─ _id
├─ user_email (cliente)
├─ plan_id
├─ country
├─ currency
├─ amount_cop
├─ amount_local
├─ created_at
└─ otros campos

Para Oficina Virtual:
└─ Index: {user_email: 1, country: 1, created_at: -1}
```

#### Collections Nuevas (FASE 2):

**db.commissions** (creada en FASE 1, extendida en FASE 2 para UI)
```
Estructura:
├─ _id
├─ agent_id (FK → users._id)
├─ case_id (FK → cases._id)
├─ lead_id (FK → leads._id)
├─ organization_id (FK → organizations._id, nullable)
├─ amount (monto de comisión)
├─ currency
├─ commission_rate % (tasa aplicada)
├─ status (pending, approved, paid, disputed, reversed)
├─ created_at
├─ approved_at
├─ paid_at
├─ payment_method
├─ notes
└─ created_by (admin que creó, si fue manual)

Índices necesarios:
├─ {agent_id: 1, status: 1}
├─ {agent_id: 1, created_at: -1}
├─ {status: 1, approved_at: -1}
└─ {organization_id: 1} (sparse)
```

**db.countries** (nuevo, maestro de países)
```
Estructura:
├─ _id
├─ code (COP, UYU, MXN, etc.)
├─ name
├─ region (LATAM, etc.)
├─ currency
├─ timezone
├─ tax_regulations (object)
├─ payment_methods (array)
└─ active (boolean)

Índices:
└─ {code: 1} (unique)

Datos iniciales:
├─ COP: Colombia
├─ UYU: Uruguay
├─ MXN: México
├─ ARS: Argentina
├─ CLP: Chile
└─ PEN: Perú
```

**db.resources** (nuevo, centro de recursos compartidos)
```
Estructura:
├─ _id
├─ category (manual, video, template, presentation, study)
├─ title
├─ description (optional)
├─ url (HTTP link o file_path en storage)
├─ file_type (pdf, docx, xlsx, mp4, pptx)
├─ file_size (en bytes)
├─ created_at
├─ updated_at
├─ created_by (admin user_id)
├─ tags (array de strings)
└─ access_level (public, agents, partners)

Índices:
├─ {category: 1, created_at: -1}
├─ {tags: 1}
└─ {access_level: 1}

Datos iniciales:
└─ Seed de 5-10 recursos por categoría
```

### 5.2 Modelos Pydantic (Backend)

**Commission (para responses)**
```python
class Commission(BaseModel):
    id: str = Field(alias="_id")
    agent_id: str
    case_id: str
    amount: float
    currency: str
    status: Literal["pending", "approved", "paid", "disputed"]
    created_at: datetime
    approved_at: Optional[datetime]
    paid_at: Optional[datetime]
    
    class Config:
        populate_by_name = True
```

**Country (para responses)**
```python
class Country(BaseModel):
    id: str = Field(alias="_id")
    code: str
    name: str
    region: str
    currency: str
    timezone: str
    
    class Config:
        populate_by_name = True
```

**Resource (para responses)**
```python
class Resource(BaseModel):
    id: str = Field(alias="_id")
    category: str
    title: str
    url: str
    file_type: str
    created_at: datetime
    tags: List[str] = []
    
    class Config:
        populate_by_name = True
```

**Lead (extender respuesta existente)**
```python
class LeadResponse(BaseModel):
    id: str = Field(alias="_id")
    lawyer_id: str
    client_name: str
    client_email: str
    legal_area: str
    description: str
    status: str
    created_at: datetime
    
    # AGREGAR (FASE 2):
    # days_in_pipeline: int  # Calculado
    # converted_case_value: Optional[float]  # Si status=won
```

### 5.3 Contratos de Response API

**GET /agents/me/dashboard**
```json
{
  "kpis": {
    "leads_total": 25,
    "leads_this_month": 5,
    "conversion_rate": 48,
    "clients_active": 15,
    "commission_pending": 8500,
    "commission_paid": 45000,
    "referrals_active": 8
  },
  "leads_by_status": {
    "new": 3,
    "contacted": 5,
    "evaluating": 4,
    "proposal": 2,
    "won": 11
  },
  "commission_trend": [
    {"month": "2026-01", "amount": 5000},
    {"month": "2026-02", "amount": 7500},
    ...
  ],
  "top_countries": [
    {"code": "COP", "clients": 10, "revenue": 45000},
    {"code": "UYU", "clients": 3, "revenue": 12000},
    ...
  ]
}
```

**GET /agents/me/leads**
```json
[
  {
    "id": "lead_123",
    "client_name": "Acme Inc",
    "legal_area": "Laboral",
    "status": "new",
    "created_at": "2026-06-10T14:30:00",
    "days_in_pipeline": 1,
    "estimated_value": null
  },
  ...
]
```

**GET /agents/me/commissions?status=pending**
```json
{
  "total": 3,
  "amount_total": 8500,
  "commissions": [
    {
      "id": "com_123",
      "case_id": "cas_456",
      "client_name": "Acme Inc",
      "amount": 3000,
      "status": "pending",
      "created_at": "2026-06-05",
      "days_pending": 5
    },
    ...
  ]
}
```

**GET /agents/me/countries-performance**
```json
[
  {
    "country": "Colombia",
    "code": "COP",
    "clients": 15,
    "revenue": 45000,
    "conversion_rate": 48,
    "cases_closed": 7,
    "trend": 12  // % crecimiento
  },
  ...
]
```

---

## 6. MAPEO DE COMPONENTES REUTILIZABLES

### 6.1 Tabla de Reutilización

| Componente Existente | Ubicación Actual | Reutilizar Para | Cambios Necesarios | Esfuerzo |
|---|---|---|---|---|
| MetricCard | shared/components | KPI Section | Propiedades iguales | 0% |
| DataTable | shared/components | Leads, Clients, Commissions | Filtros nuevos | 10% |
| StatusBadge | shared/components | Status lead, commission | Colores nuevos | 5% |
| OperationsCenter | admin/components | Center operaciones | Datos nuevos | 15% |
| Drawer | (patrón) | AgentProfileDrawer | Extender con nuevas secciones | 30% |
| FunnelChart | shared/charts | Lead pipeline | Datos nuevos | 5% |
| LineChart | shared/charts | Ingresos, países | Datos nuevos | 5% |
| PieChart | shared/charts | Países distribución | Datos nuevos | 5% |
| Card (genérico) | shared/components | Resource cards, Client cards | Estilos menores | 10% |
| Tabs | (native) | Commission module | Estructura estándar | 0% |
| PartnerPipeline | partners/components | Lead Kanban | Adaptar datos | 40% |
| ReferralDirectory | referrals/components | Agent directory | Adaptar datos | 20% |

### 6.2 Componentes sin Reutilización (Nuevos)

```
CountryAnalysisMap      (visualización geográfica de ingresos)
CommissionTimeline      (línea de tiempo de pagos)
ResourceSearch          (búsqueda y filtro de recursos)
AgentPerformanceScore   (gráfico de desempeño 1-100)
LeadTemperatureGauge    (indicador hot/warm/cold)
CommissionSplitChart    (pie chart firma vs agente)
```

---

## 7. DEPENDENCIAS E INTEGRACIONES

### 7.1 Dependencias Entre Módulos

```
AgentDashboard (orquestador)
├─ Depende de: useAgentDashboard hook
│  └─ Que depende de: GET /agents/me/dashboard
│
├─ Depende de: LeadsModule
│  └─ Que depende de: GET /agents/me/leads
│
├─ Depende de: ClientsModule
│  └─ Que depende de: db.transactions (aggregation)
│
├─ Depende de: CommissionsModule
│  └─ Que depende de: GET /agents/me/commissions (FASE 1 backend)
│
├─ Depende de: CountriesModule
│  └─ Que depende de: db.countries (FASE 2 seed)
│
└─ Depende de: ResourcesModule
   └─ Que depende de: db.resources (FASE 2 seed)

TenantContext (ya existe)
├─ Usado por: Todos los modules
└─ Headers: X-Tenant-ID, X-Organization-ID

AuthProvider (ya existe)
├─ Usado por: Protección de rutas
└─ Token: JWT Bearer
```

### 7.2 Integración con Sistemas Existentes

```
MULTI-TENANT:
├─ UserTenantId del token
├─ X-Tenant-ID header (automático)
└─ Scoping en queries (automático)

AUTENTICACIÓN:
├─ JWT Bearer token
├─ Validación en /auth/me
└─ Roles: lawyer, admin, socio_comercial (unchanged)

PERMISOS:
├─ Abogado: Ve solo sus leads, clientes, comisiones
├─ socio_comercial: Ve todos en su org (FASE 2)
└─ admin: Ve todo

ANALYTICS:
├─ Eventos: security_badge_view, security_badge_click (existentes)
├─ Nuevos: agent_dashboard_view, lead_status_change, commission_paid
└─ Via: trackEvent (existente)

NOTIFICACIONES:
├─ New commission: ✅ (via POST /notifications)
├─ Lead status change: ✅ (via POST /notifications)
├─ Commission approved: ✅ (via POST /notifications)
└─ Payment done: ✅ (via POST /notifications)
```

### 7.3 Dependencias de Datos Críticas

```
FASE 1 COMPLETADA:
├─ users.organizationId campo ✅
├─ Índice sparse en organizationId ✅
├─ Migration 001 ejecutada ✅
└─ backend/migrations/__init__.py updated ✅

FASE 2 REQUIERE:
├─ db.commissions collection + índices
├─ db.countries seed data
├─ db.resources seed data
├─ Backend endpoints para agents/*
├─ Backend endpoints para commissions/*
├─ Backend endpoints para countries/*
├─ Backend endpoints para resources/*
└─ Índices en todas las nuevas collections

FASE 2 REUTILIZA:
├─ db.leads (existente)
├─ db.cases (existente)
├─ db.transactions (existente)
├─ db.organizations (existente)
├─ db.users (extendido FASE 1)
└─ All existing indices (unchanged)
```

---

## 8. RIESGOS Y MITIGACIONES

### 8.1 Matriz de Riesgos

| # | Riesgo | Severidad | Prob. | Mitigación | Estado |
|---|--------|-----------|-------|------------|--------|
| 1 | Leads duplicados (mismo client) | MEDIA | BAJA | Validar unique en backend | ✅ Mitigado |
| 2 | Comisiones calculadas mal | MEDIA | MEDIA | Tests de cálculo, auditoría | ⚠️ Requerir validación |
| 3 | Performance de queries leads | BAJA | BAJA | Índices (lawyer_id, status) | ✅ Mitigado (FASE 1) |
| 4 | Datos vacíos (sin leads/clientes) | BAJA | MEDIA | Empty states UI | ✅ Handled |
| 5 | Moneda incorrecta en países | BAJA | BAJA | Catálogo maestro | ✅ db.countries |
| 6 | Organización null causa error | MEDIA | BAJA | Nullable fields, null checks | ✅ Mitigado |
| 7 | Admin modificar comisiones de otro | ALTA | BAJA | Validación role + ownership | ⚠️ Requerir permisos |
| 8 | Frontend viejo no soporta nuevo response | BAJA | BAJA | Backward compatible response | ✅ Diseñado |
| 9 | Rutas nuevas colisioñan con existentes | MEDIA | MUY BAJA | Prefijo /agents/me/* único | ✅ Mitigado |
| 10 | Migración de comisiones no corre | MEDIA | BAJA | Script idempotente + rollback | ✅ (FASE 1) |

### 8.2 Testing Strategy

```
UNIT TESTS:
├─ Models (Commission, Country, Resource)
├─ Schemas (Request/Response validation)
├─ Aggregations (queries de leads, clientes)
└─ Calculations (comisiones, conversión %)

INTEGRATION TESTS:
├─ GET /agents/me/dashboard (full flow)
├─ GET /agents/me/leads (filtering, sorting)
├─ GET /agents/me/commissions (status filtering)
├─ GET /agents/me/countries-performance
├─ GET /resources (search, category filter)
└─ Multi-tenant scoping (usuario vee solo su data)

E2E TESTS:
├─ Login → AgentDashboard → Ver leads
├─ Lead change status → Comisión created
├─ Commission approved → Agente ve en Pagada
├─ Filter by country → Leads filtered
└─ Descargar resource → Archivo válido

REGRESSION TESTS:
├─ Sala de Ventas sigue funcionando
├─ Partners Dashboard sigue funcionando
├─ Referrals Dashboard sigue funcionando
├─ Organizations sigue funcionando
├─ Abogados independientes (organizationId=NULL) funcionan
└─ Clientes siguen viendo sus casos
```

---

## 9. ROADMAP DE IMPLEMENTACIÓN DETALLADO

### 9.1 Semana 1: Preparación Backend

**Tareas:**
```
1. Crear modelos Pydantic
   ├─ Commission.py (modelo + schema)
   ├─ Country.py (modelo + schema)
   └─ Resource.py (modelo + schema)
   Esfuerzo: 2 días

2. Crear migration 002: seed countries
   ├─ Insertar 7 países LATAM
   ├─ Crear índices
   └─ Tracking en migrations_log
   Esfuerzo: 1 día

3. Crear migration 003: seed resources
   ├─ Insertar 10-15 recursos
   ├─ Categorías: manual, video, template, presentation, study
   └─ Tags y acceso_level
   Esfuerzo: 1 día

4. Crear migration 004: create commissions indices
   ├─ Índices en agent_id, status, created_at
   ├─ Compound indices para queries rápidas
   └─ Stats
   Esfuerzo: 1 día

Subtotal: 5 días
```

### 9.2 Semana 2: Endpoints Backend

**Tareas:**
```
1. Crear /agents/* endpoints (nueva ruta)
   ├─ GET /agents/me (usuario actual)
   ├─ GET /agents/me/dashboard (KPIs agregadas)
   ├─ GET /agents/me/leads (listado + filtros)
   ├─ GET /agents/me/clients (agregación transactions)
   └─ GET /agents/me/commissions (listado + filtros)
   Esfuerzo: 3 días

2. Crear /commissions/* endpoints
   ├─ GET /commissions (listado + filtros)
   ├─ GET /commissions/{id}
   ├─ POST /commissions/{id}/request-advance (abogado solicita adelanto)
   └─ GET /commissions/stats (agregaciones)
   Esfuerzo: 2 días

3. Crear /countries/* endpoints
   ├─ GET /countries (listado simple)
   ├─ GET /countries/{code}/performance (análisis del agente en ese país)
   └─ GET /agents/me/countries-performance (consolidado)
   Esfuerzo: 1.5 días

4. Crear /resources/* endpoints
   ├─ GET /resources (listado + filtros por categoría)
   ├─ GET /resources/{id}/download
   ├─ GET /resources/search (búsqueda por keyword)
   └─ POST /resources/request (agente solicita nuevo)
   Esfuerzo: 1.5 días

Subtotal: 8 días
```

### 9.3 Semana 3: Frontend Components

**Tareas:**
```
1. Crear hooks (data fetching)
   ├─ useAgentDashboard.js
   ├─ useLeads.js
   ├─ useClients.js
   ├─ useCommissions.js
   ├─ useCountries.js
   └─ useResources.js
   Esfuerzo: 3 días

2. Crear página AgentDashboard.jsx
   ├─ Orquestador principal
   ├─ KPI Section (reutilizar MetricCard)
   ├─ Lead Kanban (adaptar PartnerPipeline)
   ├─ Clients table preview (reutilizar DataTable)
   ├─ Commissions summary (reutilizar StatusBadge)
   └─ Countries top 3 (gráfico)
   Esfuerzo: 3 días

3. Crear submódulos
   ├─ LeadsModule.jsx (full Kanban)
   ├─ ClientsModule.jsx (full table)
   ├─ CommissionsModule.jsx (tabs + gráfico)
   ├─ CountriesModule.jsx (table + gráficos)
   └─ ResourcesModule.jsx (grid de categorías)
   Esfuerzo: 5 días

4. Crear componentes nuevos (mínimos)
   ├─ CommissionTabs.jsx (estructura simple)
   ├─ ResourceGrid.jsx (cards genéricas)
   ├─ CountryAnalysis.jsx (gráficos)
   └─ LeadDrawer.jsx (detalles, solo actualizar status)
   Esfuerzo: 2 días

Subtotal: 13 días
```

### 9.4 Semana 4: Integration & Testing

**Tareas:**
```
1. Integración con TenantContext
   ├─ Verificar headers se envían
   ├─ Verificar data scoping
   └─ Tests multi-tenant
   Esfuerzo: 2 días

2. Testing
   ├─ Unit tests (models, aggregations)
   ├─ Integration tests (endpoints)
   ├─ E2E tests (flujos completos)
   └─ Regression tests (módulos existentes)
   Esfuerzo: 4 días

3. Deployment a staging
   ├─ Crear rama feature/agent-office
   ├─ PR review
   ├─ Tests en staging
   ├─ Validación de performance
   └─ Sign-off
   Esfuerzo: 2 días

4. Documentación
   ├─ API documentation (endpoints)
   ├─ Component documentation (Storybook)
   ├─ Data flow diagrams
   └─ Troubleshooting guide
   Esfuerzo: 2 días

Subtotal: 10 días
```

### 9.5 Timeline Total

```
FASE 2 TIMELINE:
├─ Semana 1 (Backend preparation): 5 días
├─ Semana 2 (Backend endpoints): 8 días
├─ Semana 3 (Frontend components): 13 días
└─ Semana 4 (Integration & testing): 10 días

TOTAL: 36 días ≈ 7-8 semanas (con paralelización)

Hitos:
├─ Fin Semana 2: Backend ready, frontend puede empezar
├─ Fin Semana 3: Todas las páginas funcionales
├─ Fin Semana 4: Tests completos, deployment ready
└─ Deployment a Prod: Semana 5
```

---

## 10. CHECKLIST DE PREPARACIÓN

### 10.1 Pre-Implementation Checklist

```
ARQUITECTURA:
☐ Documentos de diseño aprobados (FASE2_*.md)
☐ Mapeo de reutilización validado
☐ Modelos de datos diseñados
☐ Contratos API definidos
☐ Dependencias identificadas

INFRAESTRUCTURA:
☐ FASE 1 completada (organizationId + migración)
☐ Índices MongoDB creados
☐ Migrations scripts preparados
☐ Rollback strategy documentado
☐ Backup procedure en place

EQUIPO:
☐ Backend engineer asignado
☐ Frontend engineer asignado
☐ QA engineer asignado
☐ Reunión de kick-off completada
☐ Responsabilidades claras

AMBIENTE:
☐ Staging env con FASE 1 deployed
☐ Migrations pueden ejecutarse
☐ API client configurado
☐ TenantContext funcionando
☐ Auth tokens disponibles para testing

DOCUMENTACIÓN:
☐ API specs escritas (endpoints, schemas)
☐ Component specs escritas (props, usage)
☐ Data flow diagrams creados
☐ Dependency matrix actualizada
☐ Rollback procedures documentadas
```

### 10.2 Sprint Planning Checklist

```
ANTES DE SEMANA 1:
☐ Tickets creados en backlog
☐ Estimaciones completadas
☐ Sprint goal definido
☐ Recursos asignados
☐ Testing plan listo

DURANTE CADA SEMANA:
☐ Daily standups
☐ Code reviews
☐ Tests pasando
☐ Documentación actualizada
☐ Bloqueadores identificados

AL FIN DE CADA SEMANA:
☐ Sprint review (demo)
☐ Sprint retrospective
☐ Documentación completada
☐ Tests coverage >= 80%
☐ Feedback incorporado
```

### 10.3 Code Quality Checklist

```
ANTES DE MERGE:
☐ Code review approval
☐ All tests passing (unit + integration)
☐ No console.error/warnings
☐ TypeScript/Linting compliant
☐ Documentación actualizada

ANTES DE DEPLOYMENT:
☐ Staging tests passed (E2E)
☐ Performance validated (no regressions)
☐ Multi-tenant scoping verified
☐ Rollback plan tested
☐ Security review passed
```

---

## CONCLUSIÓN

### Estado de Preparación

```
✅ AUDITORÍA COMPLETADA:
├─ Módulos existentes analizados
├─ Componentes reutilizables identificados
├─ 85% reutilización estimada (frontend)
├─ 70% reutilización estimada (backend)
└─ 0 refactoring necesario

✅ ESTRUCTURA LÓGICA DEFINIDA:
├─ Oficina Virtual en 5 módulos
├─ Componentes mapeados
├─ Data flow documentado
├─ Índices identificados
└─ Migraciones planificadas

✅ RIESGOS IDENTIFICADOS:
├─ 10 riesgos documentados
├─ 8 totalmente mitigados
├─ 2 requieren validación en tests
└─ 0 bloqueantes arquitectónicos

✅ IMPLEMENTACIÓN PLANIFICADA:
├─ 36 días de desarrollo (7-8 semanas)
├─ 4 semanas desglozadas
├─ Hitos claros
├─ Equipo definido
└─ Tests strategy completa

📋 PRÓXIMO PASO: Code Implementation (FASE 2 Start)
```

---

**Documento Completado:** Junio 2026  
**Status:** ✅ READY FOR DEVELOPMENT  
**Aprobación Requerida:** Product, Engineering, QA

