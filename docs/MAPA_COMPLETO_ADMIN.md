# MAPA COMPLETO DEL DASHBOARD ADMINISTRATIVO
## Auditoría Arquitectónica - Fase 1: Inventario General

---

## 📋 INFORMACIÓN GENERAL

**Documento:** Mapa completo de estructura del Dashboard Administrativo  
**Sistema:** Punto Cero Legal - Dashboard Administrativo  
**Fecha:** 18 de Julio de 2026  
**Método:** Análisis estático de código fuente  
**Estado:** Análisis completado

---

## 1. ÁRBOL JERÁRQUICO COMPLETO

### 1.1 Estructura de Módulos del Admin

```
ADMIN (Punto Cero System OS)
│
├── OPERACIONES (Cian #06b6d4)
│   ├── Punto Cero System OS (Dashboard Principal)
│   ├── Financial OS
│   ├── AI Legal Autopilot
│   ├── Autonomous & Global Legal OS
│   ├── Legal Operating System
│   ├── Directorio de Firmas
│   ├── Dashboard de Firma
│   ├── Sales Command Center
│   ├── Copiloto IA
│   ├── Control Maestro
│   ├── Portal de Casos
│   ├── Directorio de Abogados
│   ├── Segmentación por Países
│   └── Analytics Empresarial
│
├── NEGOCIO (Oro #f59e0b)
│   ├── Suscripciones
│   ├── Planes
│   ├── Centro de Suscripciones
│   ├── Facturación y Contabilidad
│   ├── IA Comercial
│   └── Notificaciones
│
├── RED Y TALENTO (Violeta #8b5cf6)
│   ├── Red de Agentes
│   ├── Organizaciones
│   ├── Usuarios
│   ├── Referidos
│   ├── Implementaciones
│   └── Verticales
│
└── SISTEMA (Gris #64748b)
    ├── Roles
    ├── Permisos
    ├── Inventario SaaS
    ├── Seguridad (Protegido)
    ├── Accesos de Soporte
    └── Observability
```

---

## 2. INVENTARIO DE MÓDULOS

### 2.1 Resumen Ejecutivo

| Categoría | Cantidad | Porcentaje |
|-----------|----------|------------|
| **Operaciones** | 14 | 47% |
| **Negocio** | 6 | 20% |
| **Red y Talento** | 6 | 20% |
| **Sistema** | 7 | 23% |
| **TOTAL** | **30** | **100%** |

**Nota:** Hay 30 módulos únicos registrados (algunos comparten icono pero son funcionalmente distintos).

---

### 2.2 Módulos por Grupo

#### OPERACIONES (14 módulos)

| # | Módulo | Ruta | Icono | Estado |
|---|--------|------|-------|--------|
| 1 | Punto Cero System OS | `/admin` | LayoutDashboard | ✅ Activo |
| 2 | Financial OS | `/admin/financial-os` | CreditCard | ✅ Activo |
| 3 | AI Legal Autopilot | `/admin/ai-copilot` | Brain | ✅ Activo |
| 4 | Autonomous & Global Legal OS | `/admin/autonomous-control` | Zap | ✅ Activo |
| 5 | Legal Operating System | `/admin/legal-os` | Cpu | ✅ Activo |
| 6 | Directorio de Firmas | `/admin/firms` | Building2 | ✅ Activo |
| 7 | Dashboard de Firma | `/admin/firm-dashboard` | Building2 | ✅ Activo |
| 8 | Sales Command Center | `/admin/sales-command-center` | TrendingUp | ✅ Activo |
| 9 | Copiloto IA | `/admin/ai-command-center` | Bot | ✅ Activo |
| 10 | Control Maestro | `/admin/master` | ShieldCheck | ✅ Activo |
| 11 | Portal de Casos | `/admin/cases-portal` | FolderKanban | ✅ Activo |
| 12 | Directorio de Abogados | `/admin/sales-room` | Megaphone | ✅ Activo |
| 13 | Segmentación por Países | `/admin/countries` | Globe | ✅ Activo |
| 14 | Analytics Empresarial | `/admin/analytics` | BarChart3 | ✅ Activo |

#### NEGOCIO (6 módulos)

| # | Módulo | Ruta | Icono | Estado |
|---|--------|------|-------|--------|
| 1 | Suscripciones | `/admin/subscriptions` | CreditCard | ✅ Activo |
| 2 | Planes | `/admin/plans` | Tag | ✅ Activo |
| 3 | Centro de Suscripciones | `/admin/subscription-center` | BadgeCheck | ✅ Activo |
| 4 | Facturación y Contabilidad | `/admin/billing` | Receipt | ✅ Activo |
| 5 | IA Comercial | `/admin/commercial-ai` | Bot | ✅ Activo |
| 6 | Notificaciones | `/admin/notifications` | Bell | ✅ Activo |

#### RED Y TALENTO (6 módulos)

| # | Módulo | Ruta | Icono | Estado |
|---|--------|------|-------|--------|
| 1 | Red de Agentes | `/admin/partners` | Handshake | ✅ Activo |
| 2 | Organizaciones | `/admin/organizations` | Building2 | ✅ Activo |
| 3 | Usuarios | `/admin/users` | UsersRound | ✅ Activo |
| 4 | Referidos | `/admin/referrals` | Gift | ✅ Activo |
| 5 | Implementaciones | `/admin/implementations` | Rocket | ✅ Activo |
| 6 | Verticales | `/admin/verticals` | Layers | ✅ Activo |

#### SISTEMA (7 módulos)

| # | Módulo | Ruta | Icono | Estado |
|---|--------|------|-------|--------|
| 1 | Roles | `/admin/roles` | ShieldCheck | ✅ Activo |
| 2 | Permisos | `/admin/permissions` | KeyRound | ✅ Activo |
| 3 | Inventario SaaS | `/admin/inventory` | Boxes | ✅ Activo |
| 4 | Seguridad | `/admin/security` | ShieldCheck | ✅ Activo (Protegido) |
| 5 | Accesos de Soporte | `/admin/support-access` | Lock | ✅ Activo |
| 6 | Observability | `/admin/observability` | Activity | ✅ Activo |
| 7 | **Rutas Legacy** | - | - | ⚠️ Redirecciones |

---

## 3. RUTAS LEGACY (REDIRECCIONES)

### 3.1 Rutas Legacy Detectadas

| Ruta Legacy | Redirige a | Razón |
|-------------|------------|-------|
| `/admin/executive-intelligence` | `/admin` | PR-08.1: Integrado en System OS |
| `/admin/global-network` | `/admin/autonomous-control` | PR-08.1: Integrado en Autonomous Legal OS |
| `/admin/upgrade` | `/admin/subscription-center` | PR-08.1: Actualizar Plan integrado |

**Total rutas legacy:** 3  
**Estado:** ✅ Redirigen correctamente

---

## 4. LAYOUTS

### 4.1 Layouts Identificados

| Layout | Archivo | Uso | Estado |
|--------|---------|-----|--------|
| **AdminOSLayout** | `modules/admin/AdminOSLayout.jsx` | Layout principal del Admin | ✅ Activo |
| **DashboardLayout** | `components/DashboardLayout.jsx` | Layout genérico | ⚠️ Legacy |
| **FirmShell** | `shells/firm/FirmShell.jsx` | Shell para firmas | ✅ Activo |
| **LawyerShell** | `shells/lawyer/LawyerShell.jsx` | Shell para abogados | ✅ Activo |

**Layout principal del Admin:** AdminOSLayout  
**Características:**
- Sidebar dinámico (SidebarNav)
- Header con alertas y notificaciones
- Toggle móvil
- Usuario y rol en sidebar
- Botón de logout

---

## 5. MENÚS Y SUBMENÚS

### 5.1 Estructura de Navegación

**Tipo:** Navegación de un solo nivel (sin submenús)

**Grupos:**
1. **Operaciones** (Cian) - 14 items
2. **Negocio** (Oro) - 6 items
3. **Red y Talento** (Violeta) - 6 items
4. **Sistema** (Gris) - 7 items (incluyendo 3 legacy)

**Total items en menú:** 30 módulos + 3 legacy = 33 items

**Características:**
- ✅ Agrupados por categoría
- ✅ Iconos por módulo
- ✅ Colores por grupo
- ✅ Filtrado por entitlement
- ✅ Filtrado por rol
- ✅ Filtrado por token de soporte
- ✅ Navegación activa resaltada

---

## 6. PÁGINAS DEL ADMIN

### 6.1 Páginas en `modules/admin/pages/`

| Página | Ruta | Tipo | Estado |
|--------|------|------|--------|
| ExecutiveDashboard | `/admin` | Dashboard | ✅ Activo |
| FinancialDashboard | `/admin/financial-os` | Dashboard | ✅ Activo |
| AICopilot | `/admin/ai-copilot` | Dashboard | ✅ Activo |
| AutonomousControl | `/admin/autonomous-control` | Dashboard | ✅ Activo |
| LegalOS | `/admin/legal-os` | Dashboard | ✅ Activo |
| FirmDashboard | `/admin/firm-dashboard` | Dashboard | ✅ Activo |
| FirmsOverview | `/admin/firms` | Listado | ✅ Activo |
| PendingFirmsCenter | `/admin/firms-approval` | Centro de aprobación | ✅ Activo |
| FirmSolicitudesModule | `/admin/firms-solicitudes` | Módulo | ✅ Activo |
| SalesCommandCenter | `/admin/sales-command-center` | Centro de comando | ✅ Activo |
| AICommandCenter | `/admin/ai-command-center` | Centro de comando | ✅ Activo |
| SalesRoomModule | `/admin/sales-room` | Directorio | ✅ Activo |
| CasesPortal | `/admin/cases-portal` | Portal | ✅ Activo |
| MasterControl | `/admin/master` | Control | ✅ Activo |
| CountrySegmentation | `/admin/countries` | Dashboard | ✅ Activo |
| ExecutiveIntelligenceCenter | N/A | Legacy | ⚠️ Redirige |
| TestAuditScenario | N/A | Testing | ⚠️ Desarrollo |

**Total páginas:** 16 páginas + 1 legacy + 1 testing = 18 archivos

---

## 7. COMPONENTES PRINCIPALES

### 7.1 Componentes del Admin

| Componente | Archivo | Tipo | Estado |
|-------------|---------|------|--------|
| AdminModule | `AdminModule.jsx` | Módulo principal | ✅ Activo |
| AdminOSLayout | `AdminOSLayout.jsx` | Layout | ✅ Activo |
| OperationsCenter | `components/OperationsCenter.jsx` | Componente | ✅ Activo |
| ActivityDetailDrawer | `components/ActivityDetailDrawer.jsx` | Drawer | ✅ Activo |
| ConnectionState | `components/ConnectionState.jsx` | Componente | ✅ Activo |
| SalesCandidateDrawer | `components/SalesCandidateDrawer.jsx` | Drawer | ✅ Activo |

**Total componentes:** 6 componentes principales

---

## 8. MÓDULOS EXTERNOS INTEGRADOS

### 8.1 Módulos Importados en AdminModule

| Módulo | Ruta | Origen | Estado |
|--------|------|--------|--------|
| InventoryModule | `/admin/inventory` | `modules/inventory` | ✅ Activo |
| VerticalsDashboard | `/admin/verticals` | `modules/verticals` | ✅ Activo |
| UsersDashboard | `/admin/users` | `modules/users` | ✅ Activo |
| RolesDashboard | `/admin/roles` | `modules/roles` | ✅ Activo |
| PermissionsDashboard | `/admin/permissions` | `modules/permissions` | ✅ Activo |
| PlansDashboard | `/admin/plans` | `modules/plans` | ✅ Activo |
| SubscriptionCenter | `/admin/subscription-center` | `modules/subscriptionCenter` | ✅ Activo |
| ReferralsDashboard | `/admin/referrals` | `modules/referrals` | ✅ Activo |
| NotificationsDashboard | `/admin/notifications` | `modules/notifications` | ✅ Activo |
| CommercialAIDashboard | `/admin/commercial-ai` | `modules/commercialAi` | ✅ Activo |
| PartnersDashboard | `/admin/partners` | `modules/partners` | ✅ Activo |
| ImplementationsDashboard | `/admin/implementations` | `modules/implementations` | ✅ Activo |
| SubscriptionsDashboard | `/admin/subscriptions` | `modules/subscriptions` | ✅ Activo |
| OrganizationsDashboard | `/admin/organizations` | `modules/organizations` | ✅ Activo |
| BillingDashboard | `/admin/billing` | `modules/billing` | ✅ Activo |
| AnalyticsDashboard | `/admin/analytics` | `modules/analytics` | ✅ Activo |
| SecurityDashboard | `/admin/security` | `modules/security` | ✅ Activo (Protegido) |
| ObservabilityDashboard | `/admin/observability` | `pages/system` | ✅ Activo |

**Total módulos externos:** 18 módulos

---

## 9. ESTADÍSTICAS GENERALES

### 9.1 Métricas del Sistema

| Métrica | Valor |
|---------|-------|
| **Total módulos Admin** | 30 |
| **Total rutas** | 33 (30 activas + 3 legacy) |
| **Total páginas** | 18 archivos |
| **Total componentes** | 6 componentes |
| **Total módulos externos** | 18 módulos |
| **Total grupos** | 4 grupos |
| **Total rutas legacy** | 3 redirecciones |
| **Total layouts** | 4 layouts |
| **Total iconos únicos** | 24 iconos |

### 9.2 Distribución por Estado

| Estado | Cantidad | Porcentaje |
|--------|----------|------------|
| **Activo** | 30 | 91% |
| **Legacy (redirección)** | 3 | 9% |
| **Testing** | 1 | - |
| **Obsoleto** | 0 | 0% |

---

## 10. ARQUITECTURA DE NAVEGACIÓN

### 10.1 Flujo de Navegación

```
Login
  ↓
AdminModule (Router Principal)
  ↓
AdminOSLayout (Layout Shell)
  ├── SidebarNav (Navegación Dinámica)
  │   └── MODULE_REGISTRY (Fuente de verdad)
  │       └── MODULE_GROUPS (Agrupación)
  ├── Header (Título + Alertas + Notificaciones)
  └── Children (Contenido dinámico)
      └── Ruta seleccionada
```

### 10.2 Filtros de Navegación

**Capa 1: Entitlement (Plan)**
```javascript
canAccess(m.requiredFeature) // Filtra por plan del usuario
```

**Capa 2: Token de Soporte**
```javascript
!m.requiresSupportToken || supportActive // Filtra módulos de soporte
```

**Capa 3: Rol**
```javascript
!m.visibleToRoles || m.visibleToRoles.includes(user?.role) // Filtra por rol
```

**Resultado:** El usuario ve solo los módulos permitidos por su plan, token y rol.

---

## 11. OBSERVACIONES INICIALES

### 11.1 Aspectos Positivos

✅ **Arquitectura modular** - Separación clara de módulos  
✅ **Registro centralizado** - MODULE_REGISTRY como fuente de verdad  
✅ **Navegación dinámica** - Se genera automáticamente desde registry  
✅ **Filtrado por entitlement** - Control de acceso por plan  
✅ **Filtrado por rol** - Control de acceso por rol  
✅ **Agrupación visual** - 4 grupos con colores distintos  
✅ **Iconografía** - Iconos de Lucide React  
✅ **Responsive** - Toggle móvil en sidebar  
✅ **Legacy manejado** - Redirecciones limpias  

### 11.2 Aspectos a Analizar

⚠️ **30 módulos en sidebar** - Puede ser mucho para un solo menú  
⚠️ **Duplicación de iconos** - Building2 usado 2 veces  
⚠️ **Rutas legacy** - 3 redirecciones que podrían eliminarse  
⚠️ **Módulos externos** - 18 módulos importados de otros directorios  
⚠️ **Sin submenús** - Todo en un solo nivel de navegación  

---

## 12. PRÓXIMOS PASOS

### 12.1 Fase 2: Análisis de Cada Módulo

Se analizará cada módulo para determinar:
- Archivo principal
- Componentes utilizados
- Servicios consumidos
- APIs utilizadas
- Estado de implementación
- Dependencias
- Observaciones

### 12.2 Fase 3: Mapa de Navegación

Se generará el flujo visual completo de navegación.

### 12.3 Fase 4: Clasificación Funcional

Se clasificarán los módulos en categorías funcionales.

---

**Documento generado:** 18 de Julio de 2026  
**Fase:** 1 de 9 - Inventario General  
**Próxima fase:** Análisis de Cada Módulo