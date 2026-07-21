# MAPA DE NAVEGACIÓN DEL DASHBOARD ADMINISTRATIVO
## Auditoría Arquitectónica - Fase 3: Mapa de Navegación

---

## 📋 INFORMACIÓN GENERAL

**Documento:** Mapa de navegación del Dashboard Administrativo  
**Sistema:** Punto Cero Legal - Dashboard Administrativo  
**Fecha:** 18 de Julio de 2026  
**Método:** Análisis de rutas y flujos de navegación  
**Estado:** Análisis completado

---

## 1. FLUJO DE NAVEGACIÓN PRINCIPAL

### 1.1 Flujo Completo del Sistema

```
LOGIN
  ↓
[Autenticación]
  ↓
ADMIN MODULE (Router Principal)
  ↓
ADMIN OS LAYOUT (Layout Shell)
  ├── SIDEBAR (Navegación Dinámica)
  │   ├── OPERACIONES (14 módulos)
  │   ├── NEGOCIO (6 módulos)
  │   ├── RED Y TALENTO (6 módulos)
  │   └── SISTEMA (7 módulos)
  ├── HEADER (Título + Alertas + Notificaciones)
  └── CONTENIDO (Página seleccionada)
      └── Módulo activo
```

---

## 2. FLUJOS POR CATEGORÍA

### 2.1 Flujo de Operaciones

```
Punto Cero System OS (/admin)
  ├── Dashboard Principal
  │   ├── Ver métricas consolidadas
  │   ├── Ver Centro de Operaciones
  │   ├── Ver gráficos
  │   ├── Ver alertas
  │   ├── Ver actividad reciente
  │   └── Click en caso → ActivityDetailDrawer
  │
  ├── Financial OS (/admin/financial-os)
  │   └── Dashboard financiero
  │
  ├── AI Legal Autopilot (/admin/ai-copilot)
  │   └── Asistente de IA legal
  │
  ├── Autonomous & Global Legal OS (/admin/autonomous-control)
  │   └── Control autónomo global
  │
  ├── Legal Operating System (/admin/legal-os)
  │   └── Sistema operativo legal
  │
  ├── Directorio de Firmas (/admin/firms)
  │   └── Listado de firmas
  │
  ├── Dashboard de Firma (/admin/firm-dashboard)
  │   └── Dashboard individual de firma
  │
  ├── Sales Command Center (/admin/sales-command-center)
  │   ├── Ver métricas globales
  │   ├── Ver rankings (tab)
  │   ├── Ver funnel (tab)
  │   ├── Ver países (tab)
  │   └── Ver comisiones (tab)
  │
  ├── Copiloto IA (/admin/ai-command-center)
  │   └── Centro de comando IA
  │
  ├── Control Maestro (/admin/master)
  │   ├── Ver herramientas legacy (solo admin_general)
  │   ├── Ver lista de abogados
  │   ├── Acciones sobre abogados
  │   ├── Acciones sobre suscripciones
  │   └── Ver historial de auditoría
  │
  ├── Portal de Casos (/admin/cases-portal)
  │   └── Portal de casos
  │
  ├── Directorio de Abogados (/admin/sales-room)
  │   └── Directorio de abogados
  │
  ├── Segmentación por Países (/admin/countries)
  │   └── Dashboard de países
  │
  └── Analytics Empresarial (/admin/analytics)
      └── Analytics avanzado
```

---

### 2.2 Flujo de Negocio

```
Suscripciones (/admin/subscriptions)
  ├── Ver lista de suscripciones
  ├── Gestionar suscripciones
  └── Ver estados (pending, active, expired, suspended)

Planes (/admin/plans)
  ├── Ver planes disponibles
  ├── Crear/editar planes
  └── Gestionar features

Centro de Suscripciones (/admin/subscription-center)
  ├── Ver suscripciones activas
  ├── Cambiar plan
  ├── Extender trial
  └── Gestionar pagos

Facturación y Contabilidad (/admin/billing)
  ├── Ver facturas
  ├── Gestionar pagos
  └── Ver reportes contables

IA Comercial (/admin/commercial-ai)
  └── Asistente de IA comercial

Notificaciones (/admin/notifications)
  ├── Ver notificaciones
  ├── Crear notificaciones
  └── Gestionar templates
```

---

### 2.3 Flujo de Red y Talento

```
Red de Agentes (/admin/partners)
  ├── Ver agentes
  ├── Gestionar comisiones
  └── Ver rendimiento

Organizaciones (/admin/organizations)
  ├── Ver organizaciones
  ├── Crear/editar organizaciones
  └── Gestionar miembros

Usuarios (/admin/users)
  ├── Ver usuarios
  ├── Crear/editar usuarios
  ├── Asignar roles
  └── Gestionar permisos

Referidos (/admin/referrals)
  ├── Ver referidos
  ├── Gestionar recompensas
  └── Ver estadísticas

Implementaciones (/admin/implementations)
  ├── Ver implementaciones
  ├── Gestionar onboarding
  └── Ver progreso

Verticales (/admin/verticals)
  ├── Ver verticales
  ├── Crear/editar verticales
  └── Gestionar features
```

---

### 2.4 Flujo de Sistema

```
Roles (/admin/roles)
  ├── Ver roles
  ├── Crear/editar roles
  └── Asignar permisos

Permisos (/admin/permissions)
  ├── Ver permisos
  ├── Crear/editar permisos
  └── Gestionar accesos

Inventario SaaS (/admin/inventory)
  ├── Ver inventario
  ├── Gestionar features
  └── Ver uso

Seguridad (/admin/security)
  └── Dashboard de seguridad (requiere token)

Accesos de Soporte (/admin/support-access)
  ├── Generar tokens
  ├── Revocar tokens
  └── Ver historial

Observability (/admin/observability)
  └── Dashboard de monitoreo
```

---

## 3. FLUJOS ESPECÍFICOS

### 3.1 Flujo de Login

```
LoginPage (/login)
  ├── Ingresar credenciales
  ├── Validar autenticación
  └── Redirigir a /admin
```

---

### 3.2 Flujo de Control Maestro

```
Control Maestro (/admin/master)
  ├── Verificar rol (admin o admin_general)
  │
  ├── SI es admin_general:
  │   ├── Ver herramientas legacy
  │   ├── Acceder a AdminPanel heredado
  │   ├── Acceder a Consola Root
  │   └── Acceder a Herramientas Legacy
  │
  ├── Ver lista de abogados
  │   ├── Aprobar abogado
  │   ├── Rechazar abogado
  │   ├── Activar abogado
  │   ├── Suspender abogado
  │   ├── Bloquear abogado
  │   ├── Reactivar abogado
  │   └── Cambiar plan
  │
  ├── Ver lista de suscripciones
  │   ├── Otorgar plan gratis
  │   ├── Otorgar meses gratis
  │   ├── Extender trial
  │   ├── Congelar suscripción
  │   ├── Reactivar suscripción
  │   ├── Marcar como pagada
  │   └── Marcar como pendiente
  │
  └── Ver historial de auditoría
      └── Últimas 60 acciones
```

---

### 3.3 Flujo de Sales Command Center

```
Sales Command Center (/admin/sales-command-center)
  ├── Cargar métricas globales
  │   ├── Agentes activos
  │   ├── Leads totales
  │   ├── Leads este mes
  │   ├── Casos generados
  │   ├── Ventas cerradas
  │   ├── Conversión global
  │   ├── Comisiones pendientes
  │   ├── Comisiones pagadas
  │   ├── Ingresos generados
  │   ├── Organizaciones activas
  │   └── Países operativos
  │
  ├── Ver alertas (si existen)
  │
  └── Seleccionar tab:
      ├── RANKINGS
      │   ├── Ver top agentes
      │   └── Ver top países
      │
      ├── EMBUDO COMERCIAL
      │   └── Ver funnel de ventas
      │
      ├── PAÍSES
      │   ├── Ver leads por país
      │   └── Ver ingresos por país
      │
      └── COMISIONES
          ├── Ver comisiones pendientes
          ├── Ver comisiones aprobadas
          ├── Ver comisiones pagadas
          └── Ver resumen total
```

---

### 3.4 Flujo de Executive Dashboard

```
Executive Dashboard (/admin)
  ├── Cargar datos consolidados
  │   ├── Casos
  │   ├── Suscripciones
  │   └── Socios
  │
  ├── Ver 4 widgets maestros
  │   ├── MRR (ingresos recurrentes)
  │   ├── Casos (pendientes/en proceso/cerrados)
  │   ├── Salud de ventas (conversión)
  │   └── Socios activos
  │
  ├── Ver Centro de Operaciones
  │   ├── Casos sin asignar → /admin/cases-portal
  │   ├── Casos en proceso → /admin/cases-portal
  │   ├── Socios activos → /admin/partners
  │   └── Suscripciones pendientes → /admin/subscriptions
  │
  ├── Ver gráficos
  │   ├── Ingresos por vertical
  │   ├── Estado de casos
  │   └── Distribución geográfica
  │
  ├── Ver alertas (si existen)
  │
  ├── Ver monitor de socios
  │
  ├── Ver monitor de agentes
  │
  └── Ver actividad reciente
      └── Click en caso → ActivityDetailDrawer
```

---

## 4. FLUJOS DE REDIRECCIÓN (LEGACY)

### 4.1 Rutas Legacy

```
/admin/executive-intelligence
  └── → /admin (redirige a dashboard principal)

/admin/global-network
  └── → /admin/autonomous-control (integrado en Autonomous Legal OS)

/admin/upgrade
  └── → /admin/subscription-center (integrado en Centro de Suscripciones)
```

---

## 5. FLUJOS DE ACCESO

### 5.1 Filtros de Navegación

```
Usuario intenta acceder a módulo
  ↓
¿Tiene plan requerido? (Entitlement)
  ├── NO → Ocultar módulo
  └── SÍ → ¿Requiere token de soporte?
      ├── SÍ → ¿Token activo?
      │   ├── NO → Ocultar módulo
      │   └── SÍ → ¿Rol permitido?
      │       ├── NO → Ocultar módulo
      │       └── SÍ → Mostrar módulo
      └── NO → ¿Rol permitido?
          ├── NO → Ocultar módulo
          └── SÍ → Mostrar módulo
```

---

### 5.2 Roles y Accesos

```
admin
  ├── Acceso total a todos los módulos
  └── Puede ver todo

admin_general
  ├── Acceso a módulos de operaciones
  ├── Acceso a módulos de negocio
  ├── Acceso a módulos de red y talento
  ├── Acceso a módulos de sistema
  └── Puede ver herramientas legacy

lawyer
  ├── Acceso a casos
  ├── Acceso a referidos
  ├── Acceso a notificaciones
  └── Acceso a centro de suscripciones

socio_comercial
  ├── Acceso a referidos
  ├── Acceso a notificaciones
  ├── Acceso a centro de suscripciones
  ├── Acceso a IA comercial
  └── Acceso a directorio de abogados
```

---

## 6. FLUJOS DE DATOS

### 6.1 Flujo de Datos en Executive Dashboard

```
useDashboardState()
  ↓
Promise.allSettled([
  GET /api/cases,
  GET /api/subscriptions,
  GET /api/partners
])
  ↓
Datos consolidados
  ↓
useMemo calculations
  ├── MRR calculation
  ├── Cases statistics
  ├── Sales conversion
  └── Partners statistics
  ↓
Renderizado
  ├── 4 widgets maestros
  ├── Centro de operaciones
  ├── Gráficos
  ├── Alertas
  ├── Monitores
  └── Actividad reciente
```

---

### 6.2 Flujo de Datos en Sales Command Center

```
apiClient
  ↓
Promise.allSettled([
  GET /sales-analytics/global-metrics,
  GET /sales-analytics/top-agents,
  GET /sales-analytics/top-countries,
  GET /sales-analytics/sales-funnel,
  GET /sales-analytics/commission-summary,
  GET /sales-analytics/alerts
])
  ↓
Datos consolidados
  ↓
Estado local
  ├── metrics
  ├── topAgents
  ├── topCountries
  ├── funnel
  ├── commissions
  └── alerts
  ↓
Renderizado
  ├── Alertas
  ├── 11 métricas globales
  └── 4 tabs con datos
```

---

### 6.3 Flujo de Datos en Master Control

```
useAuth()
  ↓
Verificar rol (admin o admin_general)
  ↓
SI es master:
  ↓
Promise.allSettled([
  GET /admin-ops/sales/candidates,
  GET /admin-master/audit
])
  ↓
Datos cargados
  ↓
Renderizado
  ├── Herramientas legacy (solo admin_general)
  ├── Tabla de abogados con acciones
  ├── Tabla de suscripciones con acciones
  └── Historial de auditoría
```

---

## 7. DIAGRAMA DE FLUJO DE USUARIO

### 7.1 Flujo del Administrador

```
Login
  ↓
Dashboard Principal (Executive Dashboard)
  │
  ├── ¿Qué necesita hacer?
  │
  ├── Ver métricas generales
  │   └── Dashboard Principal (ya está aquí)
  │
  ├── Gestionar ventas
  │   └── Sales Command Center
  │
  ├── Gestionar abogados
  │   └── Control Maestro
  │
  ├── Ver casos
  │   └── Portal de Casos
  │
  ├── Gestionar suscripciones
  │   └── Centro de Suscripciones
  │
  ├── Gestionar usuarios
  │   └── Usuarios
  │
  ├── Ver analytics
  │   └── Analytics Empresarial
  │
  ├── Gestionar sistema
  │   └── Módulos de Sistema
  │
  └── Acciones avanzadas
      └── Control Maestro
```

---

### 7.2 Flujo del Socio Comercial

```
Login
  ↓
Dashboard Principal
  │
  ├── Ver casos asignados
  │   └── Portal de Casos
  │
  ├── Ver referidos
  │   └── Referidos
  │
  ├── Ver notificaciones
  │   └── Notificaciones
  │
  ├── Gestionar suscripción
  │   └── Centro de Suscripciones
  │
  └── Ver directorio de abogados
      └── Directorio de Abogados
```

---

### 7.3 Flujo del Abogado

```
Login
  ↓
Dashboard Principal
  │
  ├── Ver casos asignados
  │   └── Portal de Casos
  │
  ├── Ver notificaciones
  │   └── Notificaciones
  │
  └── Gestionar suscripción
      └── Centro de Suscripciones
```

---

## 8. PATRONES DE NAVEGACIÓN

### 8.1 Navegación por Tabs

**Módulos con tabs internos:**
- SalesCommandCenter (4 tabs: Rankings, Embudo, Países, Comisiones)

**Patrón:** Navegación interna sin cambiar de ruta

---

### 8.2 Navegación por Drawers

**Módulos con drawers:**
- ExecutiveDashboard (ActivityDetailDrawer)

**Patrón:** Navegación contextual sin cambiar de ruta

---

### 8.3 Navegación por Links Externos

**Módulos con links externos:**
- MasterControl (Herramientas Legacy)

**Patrón:** Navegación a rutas legacy

---

## 9. ESTADÍSTICAS DE NAVEGACIÓN

### 9.1 Métricas de Navegación

| Métrica | Valor |
|---------|-------|
| **Total rutas** | 33 (30 activas + 3 legacy) |
| **Total grupos** | 4 grupos |
| **Total items en sidebar** | 30 módulos |
| **Profundidad máxima** | 2 niveles (sidebar → contenido) |
| **Redirecciones** | 3 rutas legacy |
| **Módulos con tabs** | 1 (SalesCommandCenter) |
| **Módulos con drawers** | 1 (ExecutiveDashboard) |

---

### 9.2 Distribución de Accesos

| Grupo | Módulos | Porcentaje de acceso |
|-------|---------|----------------------|
| **Operaciones** | 14 | 47% |
| **Negocio** | 6 | 20% |
| **Red y Talento** | 6 | 20% |
| **Sistema** | 7 | 23% |

---

## 10. OBSERVACIONES

### 10.1 Aspectos Positivos

✅ **Navegación clara** - Estructura de grupos bien definida  
✅ **Filtrado dinámico** - Se adapta al rol y plan del usuario  
✅ **Redirecciones limpias** - Rutas legacy manejadas correctamente  
✅ **Navegación de un nivel** - Simple y directa  
✅ **Contexto preservado** - No pierde estado al navegar  

### 10.2 Aspectos a Mejorar

⚠️ **30 módulos en sidebar** - Puede ser abrumador  
⚠️ **Sin breadcrumbs** - No se muestra ruta actual  
⚠️ **Sin búsqueda** - No se puede buscar módulo  
⚠️ **Sin favoritos** - No se puede marcar módulos frecuentes  
⚠️ **Tabs en SalesCommandCenter** - Podría ser página separada  
⚠️ **Sin historial** - No se puede volver atrás fácilmente  

---

## 11. PRÓXIMOS PASOS

### 11.1 Fase 4: Clasificación Funcional

Se clasificarán los módulos en categorías funcionales:
- Operación diaria
- Administración
- Configuración
- Inteligencia
- Seguridad

---

**Documento generado:** 18 de Julio de 2026  
**Fase:** 3 de 9 - Mapa de Navegación  
**Próxima fase:** Clasificación Funcional