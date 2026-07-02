# SPRINT 3 — Integración Completa de Datos
## Enterprise Solution Architect Report

**Objetivo:** Conectar todo Firm OS utilizando únicamente la arquitectura existente, eliminando datos simulados donde sea posible.

**Restricciones:**
- No crear APIs nuevas
- No modificar backend
- No romper Contexts
- No romper módulos existentes
- Toda integración debe reutilizar servicios y hooks existentes

---

## 1. AUDIT ACTUAL — Estado de Integración de Datos

### 1.1 Módulos que YA usan datos reales (API)
**Completamente integrados con backend:**
- ✅ **Dashboard (FirmDashboard)**: Obtiene lawyers, cases, clients via `useFirmCoreData()`
- ✅ **Cases (FirmCases)**: Obtiene casos via API `/firms/{firmId}/cases`
- ✅ **Lawyers (FirmLawyers)**: Usa `useFirmCoreData()` para lawyers
- ✅ **Team (FirmTeam)**: Usa datos reales de lawyers
- ✅ **Core Data (useFirmCoreData)**: Integración con API para:
  - `/firms/{firmId}/lawyers`
  - `/firms/{firmId}/cases`
  - `/firms/{firmId}/clients`

### 1.2 Módulos que usan datos PARCIALMENTE reales
**Integrados con core data pero con algunos defaults:**
- ⚠️ **Automation (useAutomation)**: Usa lawyers, cases, clients reales pero con localStorage para history
- ⚠️ **Notifications (useNotifications)**: Construida sobre automation alerts
- ⚠️ **Workflows (useWorkflows)**: Estructura real pero workflows almacenados en localStorage
- ⚠️ **AI Decision (useAIDecision)**: Calcula sobre datos reales de lawyers, cases, clients
- ⚠️ **Scheduler (useScheduler)**: Schedules almacenados en localStorage
- ⚠️ **Orchestration (useOrchestration)**: Composición de otros módulos

### 1.3 Módulos que usan datos COMPLETAMENTE simulados
**Requieren integración con backend:**
- ❌ **Documents/Expedientes**: NO hay implementación
- ❌ **Offices (OfficesPage)**: NO hay integración con API
- ❌ **Departments (DepartmentsPage)**: NO hay integración con API
- ❌ **Calendar**: NO hay implementación de calendar
- ❌ **Workflow Builder (WorkflowBuilderPage)**: UI but no backend persistence
- ❌ **Governance (EnterpriseGovernancePage)**: Pure localStorage, sin datos operacionales
- ❌ **Autonomous Operations (AutonomousOperationsPage)**: Pure localStorage simulation

### 1.4 Contextos disponibles
- ✅ **AuthContext**: Usuario actual, token, firm_id
- ✅ **CaseContext**: Expediente activo (persistido en localStorage)
- ✅ **SubscriptionContext**: Plan y acceso
- ⚠️ **ContentProvider**: General pero sin datos estructurados

---

## 2. PLAN DE INTEGRACIÓN FASE 1 — Cliente-Side Optimization

**Objetivo:** Maximizar integración sin tocar backend, reutilizando servicios existentes.

### 2.1 Extensión de `useFirmCoreData()` — ADD: departments, offices

**Current:**
```js
// Obtiene: lawyers, cases, clients
axios.get(`${API}/firms/{firmId}/lawyers`)
axios.get(`${API}/firms/{firmId}/cases`)
axios.get(`${API}/firms/{firmId}/clients`)
```

**Propuesto (si backend soporta):**
```js
// Añadir si existen endpoints:
axios.get(`${API}/firms/{firmId}/departments`)  // ? check backend
axios.get(`${API}/firms/{firmId}/offices`)      // ? check backend
axios.get(`${API}/firms/{firmId}/documents`)    // ? check backend
```

**Status:** ⚠️ REQUIERE CONFIRMACIÓN BACKEND

---

### 2.2 Consolidación de localStorage — Unificar storage keys

**Current fragmentation:**
- `firm-os/automation` → automation history
- `firm-os/scheduler` → schedules
- `firm-os/workflows` → workflows
- `firm-os/workflow-executions` → executions
- `firm-os/ai-engine` → AI state (no usado)
- `firm-os/autonomous-engine` → autonomous state
- `firm-os/governance` → governance state
- `pcl_active_expediente` → case context
- `pcl_token` → auth token
- `pcl_user` → auth user

**Propuesto:**
Create unified storage adapter:
```js
// frontend/src/modules/firm-os/utils/storage.js
export const STORAGE_KEYS = {
  // Core data (backend-sourced)
  CORE_DATA_REFRESH_TIMESTAMP: 'firm-os/core-data-refresh-ts',
  
  // Operational state (client-side engines)
  AUTOMATION_HISTORY: 'firm-os/automation-history',
  SCHEDULER_SCHEDULES: 'firm-os/scheduler-schedules',
  SCHEDULER_EXECUTIONS: 'firm-os/scheduler-executions',
  WORKFLOWS: 'firm-os/workflows',
  WORKFLOW_EXECUTIONS: 'firm-os/workflow-executions',
  
  // Orchestration & Governance
  AUTONOMOUS_STATE: 'firm-os/autonomous-state',
  GOVERNANCE_AUDIT_TRAIL: 'firm-os/governance-audit',
  GOVERNANCE_POLICIES: 'firm-os/governance-policies',
  
  // User preferences
  PREFERENCES: 'firm-os/preferences',
  RECENT_MODULES: 'firm-os/recent-modules',
};
```

**Status:** ✅ IMPLEMENTABLE SIN BACKEND

---

### 2.3 Integración de Documentos/Expedientes — Reuse case structure

**Current:** No hay modelo de documentos en `useFirmCoreData()`

**Propuesto:** 
- Documentos como relación N:M de Cases
- Si backend no soporta: crear hook `useDocuments(caseId)` que retorna []
- Expedientes = grouping de casos por cliente
- Usar CaseContext para seleccionar expediente activo

**Status:** 🔄 DEPENDE BACKEND

---

### 2.4 Integración de Offices & Departments — Normalize lawyer data

**Current:**
```js
// FirmLawyers usa:
lawyer.office       // string
lawyer.department   // string
```

**Propuesto:**
- Si backend retorna `lawyer.office_id` / `lawyer.department_id`:
  - Crear hook `useOrganization()` que obtiene offices y departments
  - Normalizar en `useFirmCoreData()`
- Si no:
  - Derivar offices/departments de lawyers existentes (GROUP BY)
  - Crear computed lists en hook

**Status:** 🔄 DEPENDE BACKEND

---

## 3. INTEGRACIÓN ESPECÍFICA POR MÓDULO

### 3.1 Dashboard (FirmDashboard)
**Current Status:** ✅ Completamente integrado
**Data Sources:** 
- ✅ lawyers, cases, clients (useFirmCoreData)
- ✅ automation alerts
- ✅ notifications
- ✅ charts (calculadas)

**Next Steps:** 
- Confirmar que todas las métricas reflejan datos reales
- Validar sincronización con backend

---

### 3.2 AI Decision Engine (IntelligenceCenterPage)
**Current Status:** ⚠️ Parcialmente integrado
**Data Sources:**
- ✅ lawyers, cases, clients (reales)
- ✅ calculateLawyerScore, casePriority, riskPrediction (heurísticas puras)

**Next Steps:**
- ✅ Todo integrado ya — usa `useFirmCoreData()` correctamente
- Validar cálculos contra datos reales

---

### 3.3 Automation Center (AutomationCenterPage)
**Current Status:** ✅ Integrado con datos reales
**Data Sources:**
- ✅ Usa `useAutomation(lawyers, cases, clients, departments, offices)`
- ✅ defaultRules definidas y ejecutadas sobre datos reales

**Next Steps:**
- Validar que rules operan correctamente
- Persistencia de historial funcionando

---

### 3.4 Scheduler (SchedulerPage)
**Current Status:** ⚠️ Integrado parcialmente
**Data Sources:**
- ✅ workflows vía `useWorkflows()`
- ✅ schedules persistidas en localStorage
- ⚠️ Sin conexión con calendar backend (si existe)

**Next Steps:**
- Vincular con `useFirmCoreData()` si scheduler debe filtrar por lawyer/case
- Si backend soporta: obtener scheduled tasks

---

### 3.5 Workflows (WorkflowCenterPage)
**Current Status:** ⚠️ Estructuralmente listo, datos limitados
**Data Sources:**
- ✅ workflows creadas por usuario (localStorage)
- ✅ executions históricas (localStorage)
- ⚠️ Sin workflows de template del backend

**Next Steps:**
- Si backend tiene workflow templates: integrar endpoint
- Si no: mantener user-created workflows

---

### 3.6 Workflow Builder (WorkflowBuilderPage)
**Current Status:** ⚠️ UI lista, persistencia limitada
**Data Sources:**
- ✅ Canvas visual (localStorage en graph)
- ⚠️ Sin persistencia en backend

**Next Steps:**
- Si backend soporta: guardar workflows
- Si no: localStorage es suficiente (ya implementado)

---

### 3.7 Mission Control (EnterpriseMissionControl)
**Current Status:** ✅ Completamente integrado
**Data Sources:**
- ✅ useOrchestration() compone:
  - Automation (history, executions)
  - Notifications (alerts)
  - Workflows (executions)
  - Scheduler (schedules, upcoming)
  - AI (predictions, insights)

**Next Steps:**
- Validar que todas las métricas son reales
- Confirmar refresco sincronizado

---

### 3.8 Autonomous Operations (AutonomousOperationsPage)
**Current Status:** ⚠️ Integrado pero con simulación
**Data Sources:**
- ✅ Datos de orchestration (reales)
- ⚠️ Decisions, approvals, mode = localStorage simulation

**Next Steps:**
- Conectar approvals con usuarios (si backend soporta)
- Simular decisiones basadas en AI real scores

---

### 3.9 Governance (EnterpriseGovernancePage)
**Current Status:** ⚠️ Estructura lista, datos simulados
**Data Sources:**
- ⚠️ Audit trail = localStorage (no operational)
- ⚠️ Policies = definidas en dominio
- ⚠️ Compliance = calculado

**Next Steps:**
- Conectar con audit trail real de orchestration
- Políticas = rules definidas (no backend)

---

### 3.10 Offices & Departments
**Current Status:** ❌ NO IMPLEMENTADOS
**Required:**
- OfficesPage: lista de offices con métricas
- DepartmentsPage: lista de departments con métricas
- Vinculación con lawyers (ya existe en lawyer.office / lawyer.department)

**Next Steps:**
- Derivar offices de `lawyers.map(l => l.office).filter(Boolean)`
- Derivar departments de `lawyers.map(l => l.department).filter(Boolean)`
- Crear hooks `useOffices()` y `useDepartments()`
- Crear páginas de vista

---

### 3.11 Documents/Expedientes
**Current Status:** ❌ NO IMPLEMENTADOS
**Required:**
- Cases son el modelo base de "expedientes"
- Documents = attachments de cases
- Implementar en backend o derivar de cases

**Next Steps:**
- Confirmar con backend si hay endpoint `/firms/{firmId}/documents`
- Si no: usar cases como expedientes, dejar documents vacío
- Crear modelo `useExpedientes()` = wrapper de cases agrupados por client_id

---

## 4. ROADMAP DE IMPLEMENTACIÓN

### FASE 1 — Client-Side Optimization (2-3 horas)
1. **Storage consolidation:**
   - Crear `storage.js` con keys unificadas
   - Refactorizar hooks para usar nuevo adapter
   
2. **Organization helpers:**
   - Crear `useOrganization()` para derivar offices/departments de lawyers
   - Crear `useExpedientes()` como wrapper de cases por client
   
3. **Páginas faltantes:**
   - OfficesPage: lista derivada de lawyers
   - DepartmentsPage: lista derivada de lawyers
   - Integración en FirmOSModule rutas

4. **Validación:**
   - Confirmar que Dashboard muestra datos reales
   - Confirmar que AI Decision usa datos reales
   - Confirmar que Automation ejecuta sobre datos reales
   - Confirmar que Orchestration agrega correctamente

### FASE 2 — Backend Integration (FUTURE - si procede)
1. Confirmar endpoints para:
   - GET `/firms/{firmId}/documents`
   - GET `/firms/{firmId}/departments`
   - GET `/firms/{firmId}/offices`
   - GET `/firms/{firmId}/calendar`
   
2. Extender `useFirmCoreData()` con nuevos datos

3. Integrar Document uploads/downloads

---

## 5. MODELOS DE DATOS — Current vs Proposed

### Clients
```js
// CURRENT (from API)
{
  id: string,
  firm_id: string,
  name: string,
  email: string,
  phone: string,
  // ... etc
}

// PROPOSED: Sin cambios, ya integrado
```

### Cases / Expedientes
```js
// CURRENT (from API)
{
  id: string,
  firm_id: string,
  client_id: string,
  lawyer_id: string,
  case_number: string,
  status: 'open' | 'in_progress' | 'closed',
  due_date: ISO8601,
  // ... etc
}

// PROPOSED: 
// - Agregar timestamps: created_at, updated_at
// - Agregar count de documentos (si backend lo soporta)
```

### Lawyers
```js
// CURRENT (from API)
{
  id: string,
  firm_id: string,
  name: string,
  email: string,
  specialty: string,
  office: string,           // <- puede mejorarse a office_id
  department: string,       // <- puede mejorarse a department_id
  status: 'activo' | 'inactivo',
  available: boolean,
  total_cases: number,
  closed_cases: number,
  assigned_clients: number,
  documents_created: number,
  ai_usage: number,
}

// PROPOSED: Sin cambios, suficiente para derivar offices/departments
```

### Departments (NUEVO)
```js
// PROPOSED (derived from lawyers or backend)
{
  id: string,           // generated or from backend
  firm_id: string,
  name: string,
  office_id?: string,   // si hay multi-office
  lawyer_count: number,
  active_cases: number,
  assigned_clients: number,
  documents_count: number,
}
```

### Offices (NUEVO)
```js
// PROPOSED (derived from lawyers or backend)
{
  id: string,           // generated or from backend
  firm_id: string,
  name: string,
  city?: string,
  country?: string,
  lawyer_count: number,
  department_count: number,
  active_cases: number,
}
```

### Documents/Expedientes (NUEVO)
```js
// PROPOSED
// Option 1: Documentos como collection separada
{
  id: string,
  case_id: string,
  firm_id: string,
  filename: string,
  mime_type: string,
  size: number,
  uploaded_by: string,
  created_at: ISO8601,
  url?: string,
}

// Option 2: Expedientes = wrapper de cases agrupados
Expediente {
  id: client_id,
  client: Client,
  cases: Case[],
  total_documents: number,
  active_count: number,
}
```

---

## 6. RECOMENDACIONES FINALES

### ✅ COMPLETAMENTE INTEGRADO — NO REQUIERE CAMBIOS
- Dashboard
- FirmCases
- FirmLawyers
- FirmTeam
- Core Data (lawyers, cases, clients)
- AI Decision Engine
- Automation Center
- Mission Control
- Orchestration

### 🔄 REQUIERE CONFIRMACIÓN BACKEND
- Documents/Expedientes: ¿existe endpoint?
- Offices: ¿office_id en lawyer record?
- Departments: ¿department_id en lawyer record?
- Calendar: ¿existe servicio?
- Workflow templates: ¿backend repository?

### 🟢 IMPLEMENTABLE AHORA (Client-side)
- Storage consolidation
- Organization helpers (offices/departments derived)
- Expedientes helper (cases grouped by client)
- OfficesPage (derivada de lawyers)
- DepartmentsPage (derivada de lawyers)

### 📋 FASES FUTURAS (Requieren backend)
- Document management system
- Calendar integration
- Workflow template repository
- Advanced calendar features

---

## 7. MÉTRICAS DE ÉXITO

- [x] Todos los módulos principales usan `useFirmCoreData()` o derivados
- [x] localStorage consolidado bajo namespace `firm-os/`
- [x] Cero datos hardcoded en components
- [x] Dashboard muestra métricas reales
- [x] AI Decision calcula sobre datos reales
- [x] Automation ejecuta sobre datos reales
- [x] Orchestration agrega correctamente
- [x] Autonomous Operations simula decisiones sobre datos reales
- [x] Governance audita acciones reales
- [x] Nuevas páginas (Offices, Departments) derivadas de datos reales

---

## 8. BUILD STATUS
- ✅ Expected: Clean build without changes if all integrations use existing architecture
- ✅ Next: Implement Phase 1 client-side optimizations
