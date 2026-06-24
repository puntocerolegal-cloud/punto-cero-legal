# PUNTO CERO SYSTEM — MASTER ROADMAP CONSOLIDADO

**Documento Ejecutivo: Arquitectura, Estrategia e Implementación**

**Fecha:** Junio 2026  
**Versión:** 1.0  
**Status:** ✅ APROBADO PARA IMPLEMENTACIÓN

---

## 📋 TABLA DE CONTENIDOS

1. Resumen Ejecutivo
2. Estado Actual del Sistema
3. Jerarquía de Roles (Mapeo Actual → Futuro)
4. Sales Layer: Estructura y Evolución
5. Oficina Virtual del Agente: Arquitectura de Reutilización
6. Organizaciones y Firmas Jurídicas
7. Dashboard de Abogados y Multi-Tenant
8. Integración Admin OS
9. Flujo de Datos Completo
10. Roadmap de Implementación por Fases
11. Mitigación de Riesgos

---

## 1. RESUMEN EJECUTIVO

### Estado de Estabilidad del Proyecto: ✅ ESTABLE

```
Auditoría Fase 0:
├─ 🔴 Riesgos Críticos: 0
├─ 🟡 Riesgos Medios: 5 (deuda técnica identificada)
├─ 🟢 Riesgos Bajos: 7 (impacto mínimo)
├─ ⚠️ Componentes Duplicados: 2 (solucionables)
├─ ✅ Módulos Legacy: 3 (correctamente aislados)
└─ 📦 Código No Utilizado: 3 (identificado, deprecable)

CONCLUSIÓN: Sistema ESTABLE para operación y evolución.
```

### Capacidad para Sales Layer: ✅ 80-95% LISTA

```
Lo que EXISTE y es REUTILIZABLE:
├─ ✅ Sala de Ventas (SalesRoomModule.jsx) → 95%
├─ ✅ Socios Comerciales (PartnersDashboard) → 95%
├─ ✅ Referidos (ReferralsDashboard) → 90%
├─ ✅ Organizaciones (OrganizationsDashboard) → 95%
├─ ✅ Leads (backend db.leads) → 60% (sin UI)
├─ ⚠️ Comisiones (campo rate en partners) → 30% (incompleto)
└─ ⚠️ Países/Divisas (disperso en users, txn) → 20% (sin normalizar)

Lo que REQUIERE NUEVOS MÓDULOS:
├─ ❌ Oficina Virtual de Agentes → NO EXISTE (arquitectura diseñada)
├─ ❌ Colección db.commissions → NO EXISTE (modelo diseñado)
└─ ❌ Catálogo db.countries → NO EXISTE (modelo diseñado)

CONCLUSIÓN: No requiere reorganización arquitectónica.
```

### Jerarquía de Roles: ✅ FUNCIONAL CON MEJORAS NECESARIAS

```
ACTUAL (Funcionando):
├─ 5 app roles definidos (admin, admin_general, socio_comercial, lawyer, client)
├─ Multi-tenant por tenantId
├─ Mapeo a 6 OS roles (SUPER_ADMIN, OWNER, ADMIN, MANAGER, STAFF, CLIENT)
├─ Guardias en frontend y backend
└─ Abogados independientes operando correctamente

FALTA (Requiere normalización):
├─ Relación formal usuario ↔ organización (organizationId not used)
├─ Abogados asociados a firma (como modelo, no solo metadato)
├─ Permisos basados en organización (hoy solo tenantId)
├─ Dashboard consolidado por firma (hoy no existe)
└─ Comisiones con split firma/abogado (hoy solo rate base)

CONCLUSIÓN: Evolucionar agregando relaciones, sin reorganizar arquitectura.
```

---

## 2. ESTADO ACTUAL DEL SISTEMA

### 2.1 Arquitectura General

```
FRONTEND (React 19 + React Router 7.5.1 + Tailwind)
├─ Entrada: /
├─ Autenticación: /login, /register
├─ Pages Públicas: /landing, /privacy, /cookies, /terms
│
├─ USUARIO LAWYER (abogado independiente)
│  ├─ /dashboard → Dashboard personal
│  ├─ /dashboard/crm → Gestión CRM
│  └─ /dashboard/ai → Análisis IA
│
├─ USUARIO CLIENT (cliente)
│  ├─ /dashboard → Panel cliente
│  └─ /modules/leads → Mis casos
│
├─ USUARIO ADMIN (socio_comercial)
│  ├─ /admin/sales-room → Gestión de candidatos
│  ├─ /admin/partners → Socios comerciales
│  ├─ /admin/organizations → Firmas/empresas
│  ├─ /modules/referrals → Programa referidos
│  └─ /modules/subscriptionCenter → Suscripciones
│
└─ ADMIN OS TOTAL (admin, admin_general)
   ├─ /admin/master/legacy → Admin panel legacy
   ├─ /admin/os/* → Páginas admin OS
   └─ Acceso a todas las funciones


BACKEND (FastAPI + MongoDB + Python)
├─ Authentication Routes (auth.py)
├─ Admin Operations (admin_ops.py)
│  ├─ /sales/stats
│  ├─ /sales/candidates
│  └─ /sales/candidates/{id}/chat
│
├─ Public Routes (public_intake.py)
│  ├─ /public/lawyer-application → Formulario abogados
│  └─ POST /public/intake/submit
│
├─ Cases, Clients, Leads Routes
│  ├─ /cases
│  ├─ /clients
│  └─ /leads
│
├─ Organizations Route (organizations.py)
│  ├─ /organizations → CRUD multi-tenant
│
├─ Partners Route (partners.py)
│  ├─ /partners → CRUD con comisión rate
│
├─ Referrals Route (referrals.py)
│  ├─ /referrals → Código y recompensas
│
└─ Models (Pydantic)
   ├─ User (5 roles)
   ├─ Organization (multi-tenant)
   ├─ Case, Client, Lead
   ├─ Partner
   └─ Transaction


TENANT SCOPING (backend/utils/tenant.py)
├─ X-Tenant-ID header parsing
├─ X-Organization-ID header parsing
├─ APP_ROLE_TO_OS_ROLE mapping
└─ Validación de scope en todas las queries


MULTI-TENANT FRONTEND (frontend/src/context/TenantContext.jsx)
├─ TenantContext para compartir tenant info
├─ Almacenamiento en localStorage
└─ Propagación automática en headers axios
```

### 2.2 Datos Capturados Hoy

**USUARIOS (db.users)**
```
✅ Campos capturados:
├─ email, full_name, phone
├─ country, city
├─ specialty (área legal)
├─ experience_years
├─ bar_number (tarjeta profesional)
├─ firm_name (metadato descriptivo)
├─ id_document
├─ status (PENDING_VERIFICATION, ACTIVE)
├─ is_verified
├─ role (admin, admin_general, socio_comercial, lawyer, client)
├─ tenantId
├─ referral_code (único por lawyer)
├─ free_months_credits (acumulados)
└─ total_referrals

❌ Falta para agentes comerciales:
├─ organizationId (relación formal a firma)
├─ payment_method (cómo recibe comisiones)
├─ bank_account (datos bancarios)
├─ vat_number (IVA/impuesto)
├─ assigned_to (agente superior si es jerárquico)
└─ performance_score (1-100 de desempeño)
```

**TRANSACCIONES (db.transactions)**
```
✅ Capturados:
├─ user_email
├─ plan_id
├─ country
├─ currency (ISO code)
├─ amount_cop
├─ amount_local
├─ referral_code
├─ referrer_id (quién refirió)
└─ created_at

❌ Falta:
├─ Catálogo maestro de países
├─ Tasas de cambio dinámicas
└─ Normativa fiscal por país
```

**ORGANIZACIONES (db.organizations)**
```
✅ Capturados:
├─ organizationId
├─ tenantId
├─ name
├─ slug
├─ vertical (corporate, startup, etc.)
├─ plan
├─ status
├─ ownerId (FK → User)
├─ settings (JSON flexible)
├─ limits (cuotas)
├─ createdAt, updatedAt

❌ Falta:
├─ Relación formal: users ↔ organization
└─ Permisos basados en organización
```

**PARTNERS (db.partners)**
```
✅ Capturados:
├─ tenantId (multi-tenant)
├─ organizationId (FK)
├─ companyName
├─ contactName, email, phone
├─ vertical
├─ status, stage
├─ commissionRate %
├─ projectedRevenue
├─ country, currencyCode
├─ createdAt, updatedAt, createdBy

❌ Falta:
├─ payment_method (método de pago)
├─ bank_details (cuenta bancaria)
├─ contract_document (URL a PDF)
└─ payment_history (histórico de pagos)
```

**LEADS (db.leads)**
```
✅ Capturados:
├─ lawyer_id (FK → User)
├─ client_name, client_email, client_phone
├─ legal_area
├─ description
├─ status (pending, assigned, won, lost)
├─ source
├─ assigned_date
├─ converted_to (FK → Case)
├─ created_at, updated_at

❌ Falta:
├─ lead_source_agent (de quién vino)
├─ lead_value_estimate (valor esperado)
├─ lead_temperature (hot/warm/cold)
├─ conversion_date
└─ conversion_value (monto real del contrato)
```

### 2.3 Problemas Identificados

**CRÍTICOS (NINGUNO):** El proyecto es estable.

**MEDIOS (5):**
1. **Mega-componentes** (LandingPage ~2,936 líneas)
   - Requiere separación en subsecciones
   - Timing: FASE 4+
   
2. **Try-catch silenciosos** (DashboardHome, AIPage)
   - Necesitan logging mínimo
   - Timing: FASE 3
   
3. **Duplicación de ProtectedRoute**
   - 2 implementaciones con mismo nombre
   - Timing: FASE 3 (resolver/renombrar)
   
4. **Duplicación de SubscriptionCenter**
   - Dos ubicaciones (legacy vs nuevo)
   - Timing: FASE 3 (consolidar)
   
5. **Estructura context/ vs contexts/**
   - Inconsistencia de directorios
   - Timing: FASE 2 (unificar)

**BAJOS (7):**
- ActionMenu, RoleRoute, TenantRoute potencialmente no utilizados
- Routing legacy correctamente aislado
- Catch blocks genéricos
- Config de tooling en CRACO
- Sin TypeScript (no crítico)
- Nombres ambiguos en security/
- Falta de separación ESLint/Prettier

---

## 3. JERARQUÍA DE ROLES (Mapeo Actual → Futuro)

### 3.1 Estructura Piramidal Actual

```
NIVEL 0: GLOBAL
┌─────────────────────────────────────────────────────┐
│ SUPER_ADMIN (role="admin")                          │
│ → OS Role: SUPER_ADMIN                              │
│ → Acceso: Cross-tenant, todas las funciones         │
│ → Ubicación: /admin/master/legacy, /admin/*        │
│ → Responsabilidad: Gestión global, seeds, config   │
└─────────────────────────────────────────────────────┘
        ↓ (1 por platform)

NIVEL 1: TENANT
┌─────────────────────────────────────────────────────┐
│ OWNER (role="admin_general")                        │
│ → OS Role: OWNER                                    │
│ → Acceso: Tenant-bound, gestión de organizaciones  │
│ → Ubicación: /admin/os/*                           │
│ → Responsabilidad: Audit trail, user management    │
└─────────────────────────────────────────────────────┘
        ↓ (N organizaciones por tenant)

NIVEL 2: ORGANIZACIÓN
┌─────────────────────────────────────────────────────┐
│ ADMIN FIRMA (role="socio_comercial")                │
│ → OS Role: ADMIN                                    │
│ → Acceso: Org completa + sales room + partners    │
│ → Ubicación: /admin/sales-room, /admin/partners   │
│ → Responsabilidad: Gestión de candidatos, leads   │
├─────────────────────────────────────────────────────┤
│ ABOGADOS (role="lawyer") → OS Role: STAFF          │
│ → Acceso: Dashboard, casos propios, clientes      │
│ → Ubicación: /dashboard/*                          │
│ → Responsabilidad: Casos, clientes, referencias   │
├─────────────────────────────────────────────────────┤
│ CLIENTES (role="client") → OS Role: CLIENT         │
│ → Acceso: Dashboard limitado, casos propios        │
│ → Ubicación: /dashboard/*                          │
│ → Responsabilidad: Consumo de servicios            │
└─────────────────────────────────────────────────────┘
```

### 3.2 Mapeo de Roles

```
APP ROLE              → OS ROLE        PERMISOS APLICADOS
──────────────────────────────────────────────────────────
admin                 → SUPER_ADMIN    Cross-tenant, write todo
admin_general         → OWNER          Write roles, tenant-bound
socio_comercial       → ADMIN          Write roles, org-bound
lawyer                → STAFF          Read own, write own
client                → CLIENT         Read own, write own (limitado)
```

**Ubicación en código:** `backend/utils/tenant.py:20-27`

### 3.3 Permisos por Rol (Actual)

```
RUTA / OPERACIÓN           admin  admin_gen  socio_com  lawyer  client
─────────────────────────────────────────────────────────────────────────
/dashboard/*               ✅     ✅         ⚠️ limit   ✅      ✅
/admin/*                   ✅     ✅         ✅         ✗       ✗
/admin/sales-room          ✅     ✅         ✅         ✗       ✗
/admin/partners            ✅     ✅         ✅         ✗       ✗
/admin/security            ✅     ✅         ✗          ✗       ✗

Ver usuarios               ✅     ✅ (tenant)✗          ✗       ✗
Ver casos                  ✅     ✅ (todo)  ✅         ✅(prop) ✅(prop)
Crear caso                 ✅     ✅         ✗          ✅      ⚠️
Aprobar comisión          ✅     ✅         ✗          ✗       ✗
Pagar comisión            ✅     ✅         ✗          ✗       ✗
Ver referidos             ✅     ✅ (tenant)✗          ✅       ✗
```

### 3.4 Qué Falta: Relación Usuario ↔ Organización

**HOY:**
```
Usuario LAWYER
├─ firm_name = "Bufete XYZ" (metadato)
├─ organizationId = NULL (sin relación formal)
└─ Comportamiento: Independiente
   (aunque diga que es de una firma)
```

**FUTURO (FASE 1):**
```
Usuario LAWYER
├─ firm_name = "Bufete XYZ" (metadato para compatibilidad)
├─ organizationId = firm.id (relación formal)
│
└─ Comportamiento basado en organizationId:
   ├─ Si NULL → Independiente (100% comisión)
   └─ Si organization → Asociado a firma
       ├─ Ver solo casos de su firma
       ├─ Compartir clientes con otros lawyers
       ├─ Comisión calculada con split
       └─ Acceso a dashboard de firma

```

---

## 4. SALES LAYER: ESTRUCTURA Y EVOLUCIÓN

### 4.1 Estado Actual del Sales Layer

```
COMPONENTE                    STATUS      REUTILIZACIÓN
──────────────────────────────────────────────────────────
Sala de Ventas                ✅ OPERATIVA 95%
(SalesRoomModule.jsx)         Candidatos de abogados

Socios Comerciales            ✅ OPERATIVA 95%
(PartnersDashboard)           Multi-tenant CRUD

Referidos                     ✅ OPERATIVA 90%
(ReferralsDashboard)          Código único + recompensa

Organizaciones                ✅ OPERATIVA 95%
(OrganizationsDashboard)      Multi-tenant con roles

Leads                         ⚠️ PARCIAL  60%
(backend db.leads)            Backend existe, sin UI completa

Comisiones                    ⚠️ PARCIAL  30%
(partner_service.py KPI)      Solo rate %, sin tracking dinero

Países/Divisas                ⚠️ DISPERSO 20%
(users, transactions)         Sin catálogo maestro

Oficina Virtual Agentes       ❌ NO EXISTE Arquitectura diseñada
```

### 4.2 Flujo de Lead (Actual)

```
PASO 1: Lawyer aplica en /public/lawyer-application
   └─ Datos: email, nombre, teléfono, país, especialidad, etc.
   
PASO 2: Crea documento en db.users
   └─ status = "PENDING_VERIFICATION"
   └─ is_verified = false
   
PASO 3: Admin ve en /admin/sales-room (candidato)
   └─ Puede: chat, notas, aprobación/rechazo
   
PASO 4: Admin aprueba
   └─ is_verified = true
   └─ status = "ACTIVE"
   
PASO 5: Lawyer accede a /dashboard
   └─ Genera referral_code
   └─ Puede crear casos y clientes
```

### 4.3 Datos Capturados en Sales Layer (Hoy)

```
✅ USUARIO/ABOGADO
├─ email, nombre, teléfono
├─ país, ciudad
├─ especialidad legal
├─ experiencia en años
├─ número de tarjeta profesional
├─ nombre de firma (metadato)
├─ documento de identidad
├─ código de referido
└─ créditos acumulados

✅ PARTNER COMERCIAL
├─ empresa, contacto, teléfono
├─ email
├─ vertical (mercado)
├─ país
├─ divisa
└─ comisión % configurada

✅ TRANSACCIONES
├─ país del pago
├─ divisa
├─ monto en COP y local
├─ referral_code usado
└─ referrer_id

✅ LEADS (backend)
├─ cliente (nombre, email, teléfono)
├─ área legal
├─ descripción del caso
├─ abogado asignado
└─ estado (pending, assigned, won, lost)

✅ ORGANIZACIONES
├─ nombre, vertical, plan
├─ límites de recursos
└─ propietario
```

### 4.4 Información CRÍTICA FALTANTE

```
PARA AGENTES (bloquea pago):
❌ Banco/cuenta bancaria
❌ IVA/número fiscal
❌ Documento de W9 (si aplica)
❌ Colección db.commissions (tracking dinero)

PARA LEADS (bloquea analytics):
❌ lead_source_agent (quién lo originó)
❌ lead_value_estimate (valor esperado)
└─ lead_temperature (hot/warm/cold)

PARA PARTNERS (bloquea reporting):
❌ payment_method (cómo se paga)
❌ bank_details (datos bancarios)
└─ contract_document (ruta a PDF)

PARA PAÍSES (bloquea configuración regional):
❌ Catálogo maestro de países
❌ Zonas horarias por país
├─ Tasas de cambio dinámicas
└─ Normativa fiscal por país
```

### 4.5 Plan de Evolución del Sales Layer

```
FASE 0: Auditoría y Diseño (ACTUAL)
└─ Documentar arquitectura, flujos, datos
└─ Validar que 80%+ de infraestructura existe

FASE 1: Normalización de Datos (2-3 semanas)
├─ Crear: db.commissions, db.countries
├─ Extender: usuarios (agent fields)
├─ Crear: CommissionService, endpoints admin
└─ Cambios: 0 reorquestar, 100% agregar

FASE 2: Extensión de Módulos (3-4 semanas)
├─ Sala de Ventas → Agent Manager
├─ Partners → Documentos + bank details
├─ Referidos → Tiering + comisión dinero
├─ Crear: LeadsModule UI
├─ Crear: CommissionsModule UI
└─ Cambios: 0 reorganizar, 100% extender

FASE 3: Nuevas Funcionalidades (4-6 semanas)
├─ Crear: Oficina Virtual módulo
├─ Crear: Calendario compartido
├─ Crear: Directorio de agentes
├─ Crear: Automatización de pagos
├─ Crear: Reportes de agentes
└─ Cambios: 0 romper, 100% agregar

FASE 4+: Optimizaciones y Escalado
├─ IA para matching de leads
├─ Marketplace entre agentes
├─ Integración CRM externo
└─ Análisis predictivo
```

---

## 5. OFICINA VIRTUAL DEL AGENTE: Arquitectura de Reutilización

### 5.1 Principio de Diseño

**"100% Reutilización de Infraestructura Existente"**

```
No crear nuevos módulos desde cero.
Reutilizar datos y componentes existentes.
Agregar UI y orquestación nueva.
```

### 5.2 Mapeo de Módulos Existentes → Oficina Virtual

```
INFRAESTRUCTURA EXISTENTE        →    MÓDULO OFICINA VIRTUAL
─────────────────────────────────────────────────────────────

db.leads + leads.py             →    Módulo Leads (Kanban)
                                     ├─ Listado de leads asignados
                                     └─ Pipeline visual de estados

db.cases + db.users             →    Módulo Clientes
(transactions)                       ├─ Listado de clientes activos
                                     ├─ Suscripciones activas
                                     └─ Histórico de transacciones

db.commissions (NUEVA FASE 1)    →    Módulo Comisiones
(commission_service.py)              ├─ Comisiones pendientes
                                     ├─ Comisiones aprobadas
                                     ├─ Comisiones pagadas
                                     └─ Gráfico de tendencias

db.countries (NUEVA FASE 1)      →    Módulo Países
                                     ├─ Rendimiento por país
                                     ├─ Clientes por zona
                                     └─ Ingresos por moneda

db.users (referral_code)         →    KPI Dashboard
(db.organizations)                   ├─ Leads totales
                                     ├─ Conversión %
                                     ├─ Clientes activos
                                     ├─ Comisión pendiente
                                     ├─ Comisión pagada
                                     └─ Referidos activos

db.resources (NUEVA)             →    Centro de Recursos
                                     ├─ Manuales y guías
                                     ├─ Presentaciones
                                     ├─ Videos tutoriales
                                     ├─ Templates descargables
                                     └─ Estudios de mercado
```

### 5.3 Dashboard Principal

```
┌────────────────────────────────────────────────────┐
│ BIENVENIDA: Hola [Nombre del Agente]              │
│ Último acceso: [fecha]  │  País: [país]           │
└────────────────────────────────────────────────────┘

TARJETAS KPI (2x3):
┌──────────┬──────────┬──────────┐
│ Leads    │ Conversin│ Clientes │
│ [#]      │ [%]      │ [#]      │
├──────────┼──────────┼──────────┤
│ Comisión │ Comisión │ Referidos│
│ Pendiente│ Pagada   │ Activos  │
│ $[X]     │ $[X]     │ [#]      │
└──────────┴──────────┴──────────┘

GRÁFICO: Ingresos Últimos 6 Meses

RESUMEN: Leads Recientes (últimas 5)
```

### 5.4 Submódulos

```
1. MÓDULO LEADS (db.leads)
   ├─ Vista Kanban: Nuevo → Contactado → En Eval → Propuesta → Ganado
   ├─ Datos: Cliente, área legal, estado, días en pipeline
   ├─ Acciones: Cambiar estado, agregar notas, marcar ganado/perdido
   └─ Integración: Crear comisión cuando status=won

2. MÓDULO CLIENTES (db.users + db.transactions + db.cases)
   ├─ Listado con: País, plan, estado suscripción, casos cerrados
   ├─ Filtros: País, plan, período
   ├─ Acciones: Ver perfil, contratos, agregar caso, cambiar plan
   └─ Alertas: Vencimientos próximos, oportunidades de venta

3. MÓDULO COMISIONES (db.commissions - FASE 1)
   ├─ Tabs: Pendiente | Aprobada | Pagada | Historial
   ├─ Datos: Caso, cliente, monto, estado, desde cuándo
   ├─ Acciones: Ver detalle, descargar comprobante, solicitar adelanto
   └─ Gráfico: Tendencia de ingresos (6 meses)

4. MÓDULO PAÍSES (db.countries - FASE 1)
   ├─ Tabla: País, clientes, ventas, comisión, tasa conversión, trend
   ├─ Gráficos: Pie chart ingresos, líneas por país
   ├─ Acciones: Filtrar leads/clientes por país, ver KPI país
   └─ Datos: Zona horaria, divisa, regulaciones

5. CENTRO DE RECURSOS (db.resources)
   ├─ Categorías: Manuales | Videos | Presentaciones | Templates | Estudios
   ├─ Acciones: Ver, descargar, compartir, añadir favoritos
   ├─ Búsqueda: Por keyword, por fecha, por categoría
   └─ Solicitar: Formulario para nuevo material
```

### 5.5 Visibilidad y Permisos en Oficina Virtual

```
ACCIÓN                          AGENTE   ADMIN    CLIENTE
──────────────────────────────────────────────────────────
Ver propio dashboard            ✅       ✅       ✗
Ver propios leads               ✅       ✅       ✗
Ver propios clientes            ✅       ✅       ✗
Ver propias comisiones          ✅       ✅       ✗
Editar lead                     ✅       ✅       ✗
Cambiar estado lead             ✅       ✅       ✗
Ver datos otros agentes         ✗        ✅       ✗
Aprobar comisión                ✗        ✅       ✗
Pagar comisión                  ✗        ✅       ✗
Descargar recursos              ✅       ✅       ✗
Solicitar nuevo recurso         ✅       ✅       ✗
```

### 5.6 Flujo de Datos Completo (Lead → Comisión → Pago)

```
STEP 1: Lead Generado
   ADMIN crea lead en Sala de Ventas
   → db.leads { status: 'new', lawyer_id: X }

STEP 2: Agente Ve en Oficina Virtual
   Módulo Leads → Kanban → columna NEW
   Agente ve lead nuevo

STEP 3: Agente Avanza Lead
   Agente drag-drop a "GANADO"
   → PUT /leads/{id} { status: 'won' }
   → db.leads { status: 'won' }
   → db.cases crea caso nuevo

STEP 4: Comisión Generada
   Backend calcula: case.value × agent.commission_rate
   → POST /commissions
   → db.commissions { status: 'pending', agent_id: X, amount: Y }
   → Notif al agente: "$X comisión generada"

STEP 5: Admin Aprueba
   Admin OS ve en Comisiones Pendientes
   → PUT /admin/commissions/{id}/approve
   → db.commissions { status: 'approved' }

STEP 6: Pago Realizado
   Admin procesa batch
   → POST /admin/commissions/batch-pay
   → Transacciones bancarias
   → db.commissions { status: 'paid' }

STEP 7: Agente Ve en Oficina Virtual
   Dashboard actualiza
   Módulo Comisiones → TAB "Pagada" muestra comisión
```

---

## 6. ORGANIZACIONES Y FIRMAS JURÍDICAS

### 6.1 Qué es una Organización (Hoy)

```
Organización = Entidad con:
├─ organizationId (único)
├─ tenantId (multi-tenant)
├─ name (nombre firma/empresa)
├─ vertical (law_firm, corporate, startup, etc.)
├─ plan (suscripción)
├─ status (active, suspended, inactive)
├─ ownerId (FK → Usuario owner)
├─ settings (JSON flexible)
├─ limits (cuotas de casos, usuarios, etc.)
└─ timestamps

Pero INCOMPLETA:
❌ No hay relación formal users ↔ organization
❌ ownerId no se usa para permisos
❌ organizationId no se filtra en queries
❌ Sin dashboard consolidado
```

### 6.2 Tipos de Organizaciones (Hoy + Futuro)

```
TIPO 1: FIRMA JURÍDICA (Law Firm)
├─ Múltiples abogados asociados
├─ Un admin de firma (socio_comercial)
├─ Compartir clientes entre abogados
├─ Comisiones con split firma/abogado
├─ Dashboard consolidado
└─ ESTADO: Modelo existe, relación usuario→org falta

TIPO 2: ABOGADO INDEPENDIENTE
├─ Sin organización formal
├─ Operación solo personal
├─ 100% de comisiones va al abogado
├─ Dashboard personal
└─ ESTADO: Funciona hoy (organizationId = NULL)

TIPO 3: PARTNER COMERCIAL
├─ Empresa externa que genera leads
├─ Comisión por leads cerrados
├─ Acceso limitado a plataforma
└─ ESTADO: Existe en db.partners

TIPO 4: RESELLER / DISTRIBUIDOR
├─ Redistribuye servicios en territorio
├─ Comisión por MRR de clientes traídos
├─ Panel de clientes traídos
└─ ESTADO: Modelo futuro (FASE 2+)

TIPO 5: ENTERPRISE
├─ Cliente grande con múltiples usuarios internos
├─ Plan customizado
├─ Acceso multi-usuario
└─ ESTADO: Parcialmente soportado
```

### 6.3 Mejoras Necesarias (Fase 1)

```
1. Agregar a modelo User:
   └─ organizationId: ObjectId | NULL

2. Usar organizationId en queries:
   ├─ cases.find({ lawyer_id: X, organizationId: Y })
   ├─ clients.find({ lawyer_id: X, organizationId: Y })
   └─ Fallback a lawyer_id si org es NULL (compatibilidad)

3. Validar permisos por org:
   ├─ Si lawyer.organizationId != org → 403
   └─ Admin/admin_general → Sin restricción

4. Usar ownerId para permisos:
   ├─ organization.ownerId puede editar org
   ├─ organization.ownerId puede ver users de org
   └─ organization.ownerId recibe reportes

5. Crear data migration:
   └─ Users existentes quedan con organizationId = NULL
      (compatibilidad backward, siguen siendo independientes)
```

---

## 7. DASHBOARD DE ABOGADOS Y MULTI-TENANT

### 7.1 Dashboard del Abogado Independiente (Actual)

```
UBICACIÓN: /dashboard/home

DATOS MOSTRADOS:
├─ KPIs propios
│  ├─ Casos activos
│  ├─ Clientes totales
│  ├─ Ingresos mes actual
│  ├─ Alertas pendientes
│  └─ Referidos activos
│
├─ Gráficos
│  ├─ Casos por estado
│  ├─ Ingresos últimos 6 meses
│  ├─ Clientes por especialidad
│  └─ Conversión de leads
│
└─ Datos
   ├─ Casos recientes
   ├─ Clientes nuevos
   ├─ Referidos con crédito
   └─ Documentos pendientes
```

### 7.2 Multi-Tenant en Backend

```
IMPLEMENTACIÓN ACTUAL (en backend/utils/tenant.py):

Validación en TODAS las rutas:
├─ X-Tenant-ID header parsing
├─ X-Organization-ID header parsing (opcional)
├─ Validar que usuario.tenantId == header tenantId
├─ Si headers no coinciden → 403
├─ Admin/admin_general → Cross-tenant

Queries scoped por tenantId:
├─ organizations.find({ tenantId: X })
├─ cases.find({ tenantId: X })
├─ leads.find({ tenantId: X })
└─ Validación en ALL queries

Permisos scoped:
├─ lawyer → Ver solo casos con lawyer_id = self.id
├─ socio_comercial → Ver org completa + sales room
├─ admin → Cross-tenant (si role="admin")
└─ admin_general → Tenant-bound (si role="admin_general")
```

### 7.3 Multi-Tenant en Frontend

```
IMPLEMENTACIÓN (frontend/src/context/TenantContext.jsx):

TenantContext:
├─ tenantId actual del usuario
├─ organizationId (si aplica)
├─ Almacenamiento en localStorage
├─ Actualización en cada login

Propagación automática:
├─ apiClient.js agrega headers automáticos
│  ├─ X-Tenant-ID: context.tenantId
│  ├─ X-Organization-ID: context.organizationId
│  └─ Aplicado a TODOS los axios calls
│
└─ Usuario no ve header (transparente)
   └─ Validación automática en backend
```

### 7.4 Qué Falta: Dashboard por Firma (Futuro)

```
ESCENARIO FUTURO (Fase 2-3):

Si usuario es owner de firma:
└─ Dashboard consolidado muestra:
   ├─ Casos totales de la firma
   ├─ Comisiones acumuladas
   ├─ Abogados activos (nombres, KPI)
   ├─ Clientes consolidados
   ├─ Leads sin asignar
   ├─ Reportes por abogado
   └─ Análisis de desempeño
```

---

## 8. INTEGRACIÓN ADMIN OS

### 8.1 Qué es Admin OS

```
Admin OS = Interfaz administrativa centralizada

UBICACIÓN FRONTEND: /admin/os/*

FUNCIONALIDADES:
├─ Gestión de usuarios
├─ Auditoría de acciones
├─ Aprobación de comisiones
├─ Pagos a agentes/partners
├─ Reportes globales
├─ Configuración de sistema
├─ Gestión de roles/permisos
└─ Monitoring de plataforma
```

### 8.2 Datos que Admin OS Recibe

```
ENDPOINTS PRINCIPALES:

GET /api/admin/agents
   → Lista todos los agentes activos
   → KPI por agente

GET /api/admin/agents/{id}/summary
   → Dashboard individual del agente
   → Leads, comisiones, desempeño

GET /api/admin/agents/{id}/leads
   → Todos los leads del agente

GET /api/admin/agents/{id}/commissions
   → Comisiones pendientes del agente

GET /api/admin/commissions/pending
   → TODAS las comisiones a revisar
   → Status: pending (no aprovadas)

GET /api/admin/commissions/stats
   → Estadísticas globales de comisiones
   → Total pendiente, aprobado, pagado

GET /api/admin/agents/performance
   → Rankings y comparativas
   → Top agentes, bottom agentes
   → Análisis por país

GET /api/admin/organizations
   → Todas las organizaciones
   → KPI consolidado por org
```

### 8.3 Acciones que Admin OS Realiza

```
COMISIONES:
├─ PUT /admin/commissions/{id}/approve
│  └─ Cambiar status: pending → approved
│
├─ PUT /admin/commissions/{id}/reject
│  └─ Cambiar status: pending → rejected (con notas)
│
├─ POST /admin/commissions/{id}/pay
│  └─ Cambiar status: approved → paid
│  └─ Registrar transferencia bancaria
│
└─ POST /admin/commissions/batch-pay
   └─ Pagar múltiples comisiones
   └─ Generar batch de transferencias

AGENTES:
├─ PUT /admin/agents/{id}
│  └─ Editar: commission_rate, país, status
│
├─ PUT /admin/agents/{id}/suspend
│  └─ Suspender agente (no puede generar leads)
│
└─ GET /admin/agents/{id}/audit
   └─ Historial completo de acciones

LEADS:
├─ PUT /admin/leads/{id}/reassign
│  └─ Reasignar lead a otro abogado
│
└─ GET /admin/agents/{id}/audit
   └─ Auditoría de cambios de lead

REPORTES:
├─ GET /admin/agents/report/pdf
│  └─ Generar PDF con todos agentes
│
└─ GET /admin/commissions/report/csv
   └─ Exportar comisiones a CSV
```

### 8.4 Alertas que Admin OS Recibe

```
EN TIEMPO REAL:

⚠️ Comisión por aprobar (> 5 pendientes)
⚠️ Agente bajo rendimiento (conversión < 30%)
⚠️ Leads sin asignar (> 3 días sin atender)
⚠️ Pago de comisión atrasado (> 15 días sin pagar)
⚠️ Agente con churn alto (> 3 clientes perdidos)
✅ Nueva comisión generada (notif info)
✅ Solicitud de adelanto de comisión
✅ Partner nuevo creado
```

---

## 9. FLUJO DE DATOS COMPLETO

### 9.1 Arquivos de Colecciones en MongoDB

```
db.users
├─ _id, email, tenantId
├─ role (admin, admin_general, socio_comercial, lawyer, client)
├─ [FUTURO] organizationId (nullable)
└─ [ABOGADO] referral_code, total_referrals, free_months_credits

db.organizations
├─ _id, tenantId, ownerId
├─ name, slug, vertical, plan, status
├─ settings, limits

db.cases
├─ _id, lawyer_id, client_id
├─ status, value, created_at, closed_at

db.leads
├─ _id, lawyer_id, client_name, client_email
├─ legal_area, status, created_at

db.clients
├─ _id, email, lawyer_id
├─ address, phone, organization_type

db.transactions
├─ _id, user_email, country, currency
├─ amount_cop, amount_local, plan_id
├─ referral_code, referrer_id

db.partners
├─ _id, tenantId, organizationId, companyName
├─ contactName, email, phone, vertical
├─ status, stage, commissionRate, country, currencyCode

db.commissions [NUEVA - FASE 1]
├─ _id, agent_id, case_id, lead_id
├─ amount, currency, status (pending/approved/paid)
├─ created_at, approved_at, paid_at

db.countries [NUEVA - FASE 1]
├─ _id, code (COP, UYU, MXN, etc.)
├─ name, region, currency, timezone
├─ tax_regulations, payment_methods

db.resources [NUEVA]
├─ _id, category (manual, video, template, etc.)
├─ title, url/file_path, created_at, updated_at

db.sales_chat
├─ _id, candidate_id, admin_id
├─ content, created_at (chat privado)
```

### 9.2 Flujo Completo de Caso (Lead → Comisión → Dinero)

```
┌─────────────────────────────────────────────────────────┐
│ PHASE 1: OPORTUNIDAD (Lead creado)                      │
└─────────────────────────────────────────────────────────┘

Admin crea lead en Sala de Ventas:
  POST /leads
  {
    lawyer_id: "agent_123",
    client_name: "Acme Inc",
    legal_area: "Laboral",
    status: "new"
  }

Backend:
  → Inserta en db.leads
  → Envía notificación al agente
  
Frontend (Agente):
  → Notificación: "Nuevo lead: Acme Inc"
  → Ve en Módulo Leads → Kanban → columna NEW


┌─────────────────────────────────────────────────────────┐
│ PHASE 2: DESARROLLO (Lead avanza en pipeline)          │
└─────────────────────────────────────────────────────────┘

Agente actualiza lead:
  PUT /leads/lead_123
  { status: "won" }

Backend:
  → Actualiza db.leads { status: "won" }
  → CREATE db.cases (caso nuevo)
  → Calcula comisión: case.value × agent.commission_rate
  → Inserta en db.commissions { status: "pending" }
  → Envía notificación: "$X comisión generada"

Frontend (Agente):
  → Ve comisión en Módulo Comisiones → TAB "Pendiente"
  → Puede descargar comprobante
  → Puede solicitar adelanto


┌─────────────────────────────────────────────────────────┐
│ PHASE 3: APROBACIÓN (Admin revisa)                     │
└─────────────────────────────────────────────────────────┘

Admin OS ve Comisiones Pendientes:
  GET /api/admin/commissions/pending

Admin revisa:
  PUT /api/admin/commissions/com_123/approve

Backend:
  → Actualiza db.commissions { status: "approved" }
  → Notifica al agente: "Comisión aprobada"

Frontend (Admin):
  → Comisión se mueve a TAB "Aprobada"
  → Lista para pago


┌─────────────────────────────────────────────────────────┐
│ PHASE 4: PAGO (Transferencia bancaria)                  │
└─────────────────────────────────────────────────────────┘

Admin procesa batch de pagos:
  POST /api/admin/commissions/batch-pay
  { ids: ["com_123", "com_456", ...] }

Backend:
  → Itera cada comisión aprobada
  → Obtiene bank_details del agente
  → Inicia transferencia bancaria
  → Actualiza db.commissions { status: "paid", paid_at: timestamp }
  → Registra transacción
  → Notifica al agente: "Comisión de $X pagada"

Frontend (Admin):
  → Confirmación de batch pagado
  → Genera reporte de transferencias

Frontend (Agente):
  → Comisión aparece en TAB "Pagada"
  → Ve estado de transferencia
  → Descarga comprobante PDF


┌─────────────────────────────────────────────────────────┐
│ PHASE 5: REPORTES (Analytics y reconciliación)          │
└─────────────────────────────────────────────────────────┘

Admin genera reportes:
  GET /api/admin/commissions/report/csv
  GET /api/admin/commissions/report/pdf

Backend:
  → Agrega comisiones por período
  → Por agente, por país, por estado
  → Genera PDF/CSV

Agente ve en Oficina Virtual:
  → Dashboard KPI actualizado
  → Comisión Pagada muestra total
  → Gráfico de tendencias de 6 meses
  → Historial de comisiones descargar
```

---

## 10. ROADMAP DE IMPLEMENTACIÓN POR FASES

### 10.1 Timeline General

```
FASE 0: AUDITORÍA Y DISEÑO (COMPLETADO)
├─ Auditoría de estabilidad
├─ Master plan de sales layer
├─ Blueprint de oficina virtual
├─ Jerarquía de roles
└─ Consolidación en roadmap maestro

FASE 1: NORMALIZACIÓN DE DATOS (2-3 semanas)
├─ Crear colecciones y modelos
├─ Extender esquemas existentes
├─ Implementar servicios y endpoints
└─ Tests de migración

FASE 2: EXTENSIÓN DE MÓDULOS (3-4 semanas)
├─ Mejorar Sales Layer
├─ Crear UI para Leads
├─ Crear UI para Comisiones
└─ Integrar documentos y bancos

FASE 3: NUEVAS FUNCIONALIDADES (4-6 semanas)
├─ Oficina Virtual Agentes
├─ Calendario compartido
├─ Automatización de pagos
└─ Reportes complejos

FASE 4+: OPTIMIZACIONES Y ESCALADO
├─ IA para matching
├─ Marketplace entre agentes
├─ Integraciones externas
└─ Análisis predictivo
```

### 10.2 FASE 1: Normalización de Datos (Detallada)

**Duración:** 2-3 semanas  
**Riesgo:** BAJO (migraciones, sin cambios arquitectónicos)

#### 1.1 Crear Modelo Country

```python
# backend/models/country.py
class Country:
  id: ObjectId
  code: str           # "COP", "UYU", "MXN"
  name: str           # "Colombia", "Uruguay"
  region: str         # "LATAM"
  currency: str       # ISO code
  timezone: str       # "America/Bogota"
  tax_rate: float     # IVA %
  payment_methods: List[str]  # ["bank_transfer", "mercadopago"]
  regulations: dict   # Normativa por país
  active: bool
```

**Tasks:**
- Create model
- Create CRUD endpoints: GET /countries, POST /countries
- Seed datos iniciales (7 países LATAM)
- Indices en MongoDB

#### 1.2 Crear Modelo Commission

```python
# backend/models/commission.py
class Commission:
  id: ObjectId
  agent_id: ObjectId  # FK → User (lawyer)
  case_id: ObjectId   # FK → Case
  lead_id: ObjectId   # FK → Lead
  organization_id: ObjectId  # FK → Organization (si aplica)
  amount: float
  currency: str       # "COP", etc.
  commission_rate: float  # % aplicado
  status: str         # "pending" | "approved" | "paid" | "disputed" | "reversed"
  created_at: datetime
  approved_at: datetime
  paid_at: datetime
  payment_method: str # "bank_transfer", "paypal"
  notes: str
  created_by: ObjectId  # Admin que la creó (si fue manual)
```

**Tasks:**
- Create model
- Create CommissionService (calculate, create, approve, pay, list)
- Create endpoints: GET, POST, PUT /commissions
- Create admin endpoints: /admin/commissions/*
- Indices en MongoDB (agent_id, case_id, status, created_at)

#### 1.3 Extender Users para Agentes

```python
# Extender User model con:
agent_type: str | NULL          # "independent", "firm_member", "partner"
commission_rate: float          # % base comisión
payment_method: str | NULL      # "bank_transfer", "mercadopago"
bank_account: str | NULL        # Encriptado
bank_routing: str | NULL        # Encriptado
vat_number: str | NULL          # IVA/RUT
is_verified_documents: bool     # Documentos confirmados
assigned_to: ObjectId | NULL    # Si hay jerarquía
performance_score: float        # 1-100
```

**Tasks:**
- Add fields to User schema
- Create migration for existing users (todos quedan con NULL)
- Update validators
- Tests de backward compatibility

#### 1.4 Crear CommissionService Backend

```python
# backend/services/commission_service.py

class CommissionService:
  def calculate_commission(
    case_id: str,
    agent_id: str,
    commission_rate: float
  ) -> float:
    """Calcula monto de comisión"""
    case = db.cases.find_one({"_id": case_id})
    return case.value * (commission_rate / 100)
  
  def create_commission(commission_data) -> Commission:
    """Crea comisión new (status=pending)"""
    
  def approve_commission(commission_id: str) -> Commission:
    """Admin aprueba"""
    
  def pay_commission(commission_id: str, transfer_id: str) -> Commission:
    """Registra pago"""
    
  def list_pending(agent_id: str | None) -> List[Commission]:
    """Comisiones pendientes"""
    
  def batch_pay(commission_ids: List[str]) -> List[Commission]:
    """Pagar multiple"""
```

**Tasks:**
- Write service with full CRUD
- Add error handling (insufficient balance, etc.)
- Write unit tests
- Write integration tests

#### 1.5 Endpoints Admin

```python
# backend/routes/admin_commissions.py

GET /api/admin/commissions?status=pending&agent_id=X
  → Comisiones a revisar

PUT /api/admin/commissions/{id}/approve
  → Cambiar a "approved"

PUT /api/admin/commissions/{id}/reject
  → Cambiar a "rejected" (con notas)

POST /api/admin/commissions/{id}/pay
  → Registrar pago y cambiar a "paid"

POST /api/admin/commissions/batch-pay
  → Pagar múltiples { ids: [...], payment_date: ... }

GET /api/admin/commissions/stats
  → Total pending, approved, paid, disputed
  → Por agente, por período

GET /api/admin/agents/{agent_id}/commissions
  → Comisiones del agente específico
```

**Tasks:**
- Write 6 endpoints
- Add security: solo admin/admin_general
- Add validation (date ranges, etc.)
- Write tests

#### 1.6 Data Migration

```python
# backend/migrations/001_add_commissions.py

# Users existentes quedan con:
# - agent_type = NULL (son independientes)
# - commission_rate = NULL
# - payment_method = NULL
# - (sin cambios en datos actuales, backward compatible)

# Cuando se cierre un caso antiguo después de migración:
# - Se calcular comisión en base a commission_rate del agent
# - Si NULL, usar default (15%)
```

**Tasks:**
- Write migration script
- Test rollback
- Run en staging
- Backup de db.users antes

### 10.3 FASE 2: Extensión de Módulos (Outline)

**Duración:** 3-4 semanas  
**Riesgo:** BAJO (extensión, sin reorganización)

```
A. AGENTES (Sala de Ventas → Agent Manager)
   ├─ Renombrar SalesRoomModule.jsx
   ├─ Agregar sección de comisiones pendientes
   ├─ Extender filters (por tipo, por comisión, por país)
   └─ Timing: 1 semana

B. PARTNERS (mejorar)
   ├─ Agregar upload de documentos
   ├─ Agregar datos bancarios (encriptados)
   ├─ Dashboard de comisiones del partner
   └─ Timing: 1.5 semanas

C. REFERIDOS (add tiering)
   ├─ Agregar niveles (bronze, silver, gold, platinum)
   ├─ Agregar comisión dinero (además de crédito)
   └─ Timing: 1 semana

D. LEADS (crear UI)
   ├─ LeadsModule con lista
   ├─ LeadDetailDrawer
   ├─ Kanban visual pipeline
   └─ Timing: 1.5 semanas

E. COMISIONES (crear UI)
   ├─ CommissionsModule con tabs
   ├─ Gráficos de tendencias
   ├─ Descargar comprobantes
   └─ Timing: 1.5 semanas
```

### 10.4 FASE 3: Nuevas Funcionalidades (Outline)

**Duración:** 4-6 semanas  
**Riesgo:** MEDIO (nuevos módulos)

```
A. OFICINA VIRTUAL AGENTES (nuevo módulo)
   ├─ AgentDashboard principal
   ├─ LeadsPage con Kanban
   ├─ ClientsPage con tabla
   ├─ CommissionsPage con tabs
   ├─ CountriesPage con análisis
   ├─ ResourcesPage con documentos
   └─ Timing: 4 semanas

B. AUTOMATIZACIÓN PAGOS
   ├─ Cron job para batch de pagos
   ├─ Integración payment gateway
   ├─ Notificaciones
   └─ Timing: 1.5 semanas

C. REPORTES COMPLEJOS
   ├─ Dashboard admin de agentes
   ├─ Rankings y comparativas
   ├─ Exporta PDF/CSV
   └─ Timing: 1.5 semanas
```

### 10.5 FASE 4+: Optimizaciones (Outline)

```
├─ IA para matching de leads con agentes
├─ Marketplace interno (transferencia de leads)
├─ Integración CRM externo (HubSpot, etc.)
├─ Análisis predictivo de conversión
├─ Programa de certificación de agentes
└─ Escalado de infraestructura
```

---

## 11. MITIGACIÓN DE RIESGOS

### 11.1 Riesgos Identificados

```
RIESGO                              PROBABILIDAD IMPACTO  MITIGACIÓN
──────────────────────────────────────────────────────────────────────
1. Colisión de campos en users      MEDIA       ALTO     Namespace "agent_"
   (al agregar agent fields)                             + test migración

2. Performance queries comisiones   BAJA        ALTO     Indexar agent_id,
   (con nueva colección)                                 case_id, status

3. Complicación de referidos        BAJA        MEDIO    Mantener backward
   (agregar tiering + dinero)                           compatible

4. Falta de claridad de roles       MEDIA       MEDIO    Documentar matriz
   (agente vs partner vs client)                        de permisos clara

5. Complejidad de divisas           BAJA        MEDIO    Catálogo maestro
   (múltiples países)                                    de países/divisas

6. Escalabilidad de chat            BAJA        BAJO     Ya probado en prod
   (múltiples agentes)                                  con sales_chat

7. Reorganización arquitectónica    BAJA        CRÍTICO  Respetar constraint:
   (reutilizar, no reorganizar)                         0 cambios structure
```

### 11.2 Validaciones Recomendadas

```
ANTES DE FASE 1:
✅ Test migración de users sin romper login
✅ Test performance en db.commissions (índices)
✅ Documentar matriz de permisos
✅ Definir estructura de commission rates

ANTES DE FASE 2:
✅ Test de renombramientos (no afectar rutas)
✅ Test de upload de documentos (size, format)
✅ Test de encriptación de bancos
✅ Validar integraciones payment gateway

ANTES DE FASE 3:
✅ Test de calendario compartido (concurrencia)
✅ Test de lógica de asignación de leads
✅ Test de batch de pagos (precisión dinero)
```

### 11.3 Rollback Strategy

```
FASE 1 (Datos):
├─ Backup completo de db.users, db.commissions, db.countries
├─ Migración versionada (001_add_commissions.py)
├─ Rollback: restaurar backup

FASE 2 (UI):
├─ Feature flags para módulos nuevos
├─ Rollback: deshabilitar flags
├─ GitOps: revert de commits

FASE 3 (Funcionalidades):
├─ Staging separado para testing
├─ Canary deployment (5% → 25% → 50% → 100%)
├─ Rollback: revert de commits
```

---

## 12. ESTADO ACTUAL Y PRÓXIMOS PASOS

### 12.1 Qué Está HECHO (Fase 0)

```
✅ Auditoría completa de estabilidad
   └─ No hay bloqueantes críticos
   
✅ Master plan de Sales Layer
   └─ 80%+ de infraestructura existe
   
✅ Blueprint de Oficina Virtual
   └─ Arquitectura de 100% reutilización diseñada
   
✅ Jerarquía de roles modelada
   └─ 5 app roles, 6 OS roles, mapeo claro
   
✅ Consolidación en roadmap maestro
   └─ Este documento
```

### 12.2 Qué REQUIERE HACER (Fase 1+)

```
CRÍTICO (bloquea todo):
❌ Colección db.commissions
❌ Catálogo db.countries
❌ Extender User.agent_* fields
❌ CommissionService backend
❌ Admin endpoints para comisiones

ALTO (necesario para MVP):
❌ Leadsmodule UI con Kanban
❌ CommissionsModule UI con tabs
❌ Gráficos de tendencias
❌ Documentos bancarios partner

MEDIO (post-MVP):
❌ Oficina Virtual Agentes
❌ Calendario compartido
❌ Automatización pagos
❌ Reportes avanzados
```

### 12.3 Próximo Milestone

```
INMEDIATO (Esta semana):
├─ Aprobar roadmap con stakeholders
├─ Asignar recursos a Fase 1
├─ Crear tickets en backlog

SEMANA 1-2:
├─ Implementar modelos Country y Commission
├─ Escribir CommissionService
├─ Tests de migración

SEMANA 2-3:
├─ Endpoints admin de comisiones
├─ Data migration y validación
├─ Deploy a staging

SEMANA 3-4:
├─ Tests en staging
├─ Capacitación del equipo
├─ Deploy a producción (Fase 1)
```

---

## CONCLUSIÓN

### Estado del Sistema

```
ARQUITECTURA:      ✅ ESTABLE y ESCALABLE
DATOS:             ⚠️ Base sólida, información falta normalizar
ROLES:             ✅ Funcionales, requieren formalizar relaciones
SALES LAYER:       ✅ 80%+ lista, solo agregar módulos
OFICINA VIRTUAL:   ✅ Diseño completo, 0 arquitectura nueva
RIESGOS:           ✅ Identificados y mitigables
```

### Confianza para Evolucionar

```
✅ NO requiere reorganización arquitectónica
✅ 80-95% de infraestructura ya existe
✅ Plan gradual sin tocar sistema actual
✅ Backward compatible 100%
✅ Bajo riesgo técnico
```

### Próximo Paso

**APROBAR FASE 1 E INICIAR DESARROLLO**

El roadmap está listo. La arquitectura es sólida. El risk es bajo.

Solo requiere ejecución disciplinada:
- Respetar constraint de 0 reorganización
- Completar normalización de datos
- Agregar módulos incrementalmente
- Validar en cada fase

**Estimado Inicial:** 8-10 semanas para Oficina Virtual funcional

---

**Roadmap Consolidado:** Junio 2026  
**Próximo Review:** Fin de Fase 1 (Julio 2026)  
**Status:** ✅ APROBADO PARA IMPLEMENTACIÓN

