# Legal OS Core - Arquitectura Unificada

## Objetivo

Consolidar Lawyer OS y Firm OS en una única plataforma con soporte para:
- **Modo Independiente**: Abogado individual, 1 usuario
- **Modo Firma**: Equipo de abogados, multiusuario con RBAC

**Meta**: 90% código compartido, 10% específico del modo

---

## 1. Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                   Legal OS Core                          │
│  (Plataforma unificada: independiente + firma)          │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Módulos Compartidos (90%)                              │
│  ├─ CRM (Contactos, leads, prospectos)                 │
│  ├─ Cases (Gestión de casos)                           │
│  ├─ Agenda (Calendario, eventos)                       │
│  ├─ Documents (Gestión de documentos)                  │
│  ├─ Billing & Finance (Facturación, pagos)            │
│  ├─ IA (Copilot, análisis, predicciones)              │
│  ├─ Analytics (Reportes, KPIs)                        │
│  ├─ Client Portal (Portal de clientes)                │
│  └─ Auth & RBAC (Autenticación, permisos)             │
│                                                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Modo: Independiente vs Firma (10%)                     │
│  ├─ Dashboard (específico del modo)                     │
│  ├─ Team Management (solo firma)                        │
│  ├─ Config (específica del modo)                        │
│  └─ Integrations (distintas por modo)                   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Modos de Operación

### Modo INDEPENDIENTE
- **Usuarios**: 1 (el abogado)
- **Rol**: `lawyer_independent`
- **Organización**: Sin estructura
- **RBAC**: Simplificado (sin roles específicos)
- **Almacenamiento**: Por usuario
- **Límites**: 50 casos, 1000 contactos (plan básico)

**Ruta frontend**: `/dashboard` (única entrada)

### Modo FIRMA
- **Usuarios**: N (equipo)
- **Roles**: 8 (firm_owner, partner, senior_lawyer, lawyer, paralegal, assistant, finance, hr)
- **Organización**: Estructura de firma
- **RBAC**: Completo (8 roles × módulos × permisos)
- **Almacenamiento**: Por firma
- **Límites**: Según plan (5-20 abogados)

**Ruta frontend**: `/firm-os` (interfaz separada)

---

## 3. Diagrama de Flujo

```
┌─────────────────────────────────┐
│   Usuario accede a Legal OS     │
└──────────────┬──────────────────┘
               │
        ┌──────▼──────┐
        │  Detectar   │
        │  modo       │
        └──────┬──────┘
               │
        ┌──────┴─────────┐
        │                │
   ┌────▼─────┐    ┌───▼────┐
   │ Indep.   │    │ Firma  │
   │ (1 user) │    │(N users)
   └────┬─────┘    └───┬────┘
        │               │
   ┌────▼─────┐    ┌───▼────────────┐
   │Dashboard │    │ Firm OS Layout │
   │ personal │    │(+sidebar team) │
   └────┬─────┘    └───┬────────────┘
        │               │
   ┌────▼──────────────▼────┐
   │ Módulos Compartidos    │
   │ (CRM, Cases, Billing)  │
   └────────────────────────┘
        │
   ┌────▼──────────────────┐
   │ Capa de Permisos      │
   │ Multiusuario/Firma    │
   └───────────────────────┘
```

---

## 4. Arquitectura Backend - Rutas Compartidas

### Estructura de Carpetas

```
backend/
├── models/
│   ├── shared/                 (NUEVO)
│   │   ├── case.py            (unificado)
│   │   ├── crm.py             (unificado)
│   │   ├── billing.py          (unificado)
│   │   ├── document.py         (unificado)
│   │   └── appointment.py      (unificado)
│   └── rbac.py                (existente)
│
├── routes/
│   ├── shared/                 (NUEVO)
│   │   ├── cases.py           (unificado)
│   │   ├── crm.py             (unificado)
│   │   ├── billing.py          (unificado)
│   │   └── documents.py        (unificado)
│   │
│   ├── independent/            (NUEVO)
│   │   └── dashboard.py        (solo independiente)
│   │
│   └── firm/                   (NUEVO - refactorizado)
│       ├── firm_os.py
│       ├── team.py
│       └── dashboard.py        (solo firma)
│
├── middleware/
│   ├── mode_resolver.py        (NUEVO - detecta modo)
│   ├── permission_layer.py     (NUEVO - multiusuario)
│   └── multi_tenant.py         (NUEVO - isolación)
│
└── utils/
    ├── shared_logic.py         (NUEVO - lógica compartida)
    └── rbac.py                 (existente)
```

### Rutas Compartidas (90%)

```
POST   /api/shared/cases              ✓ Ambos modos
GET    /api/shared/cases
PATCH  /api/shared/cases/{id}
DELETE /api/shared/cases/{id}

POST   /api/shared/crm/contacts       ✓ Ambos modos
GET    /api/shared/crm/contacts
POST   /api/shared/crm/leads

POST   /api/shared/documents          ✓ Ambos modos
GET    /api/shared/documents
DELETE /api/shared/documents/{id}

POST   /api/shared/appointments       ✓ Ambos modos
GET    /api/shared/appointments
PATCH  /api/shared/appointments/{id}

POST   /api/shared/invoices           ✓ Ambos modos
GET    /api/shared/invoices
PATCH  /api/shared/invoices/{id}

GET    /api/shared/analytics          ✓ Ambos modos
GET    /api/shared/analytics/kpis
```

### Rutas Específicas del Modo (10%)

```
# INDEPENDIENTE
GET    /api/independent/dashboard
GET    /api/independent/metrics
POST   /api/independent/settings

# FIRMA
POST   /api/firm/team/members
PATCH  /api/firm/team/{id}/role
GET    /api/firm/dashboard
GET    /api/firm/metrics
POST   /api/firm/config
```

---

## 5. Middleware - Mode Resolver

```python
# backend/middleware/mode_resolver.py

async def resolve_user_mode(current_user: dict) -> str:
    """
    Detecta el modo del usuario:
    - 'independent': usuario abogado independiente
    - 'firm': usuario parte de una firma
    """
    if current_user.get("firm_id"):
        return "firm"
    else:
        return "independent"

async def apply_mode_context(request, current_user: dict):
    """
    Adjunta contexto de modo a la solicitud:
    - mode: 'independent' | 'firm'
    - organization_id: user_id | firm_id
    - permission_scope: usuario | firma
    """
    mode = await resolve_user_mode(current_user)
    
    request.scope["mode"] = mode
    request.scope["organization_id"] = (
        current_user.get("firm_id") 
        if mode == "firm" 
        else current_user.get("_id")
    )
    request.scope["user_context"] = {
        "user_id": current_user.get("_id"),
        "mode": mode,
        "organization_id": request.scope["organization_id"],
        "role": current_user.get("role")
    }
```

---

## 6. Capa de Permisos Multiusuario

```python
# backend/middleware/permission_layer.py

class MultiUserPermissionValidator:
    """Valida permisos considerando modo y organización"""
    
    @staticmethod
    async def can_access_resource(
        user_context: dict,
        resource_type: str,      # 'case', 'contact', 'invoice'
        resource_data: dict,     # datos del recurso
        action: str              # 'read', 'write', 'delete'
    ) -> bool:
        """
        Valida acceso basado en:
        1. Modo (independiente/firma)
        2. Organización (su usuario/su firma)
        3. RBAC (si es firma)
        4. Propiedad (es propietario del recurso)
        """
        
        user_id = user_context["user_id"]
        mode = user_context["mode"]
        organization_id = user_context["organization_id"]
        
        # MODO INDEPENDIENTE: Solo sus propios recursos
        if mode == "independent":
            return resource_data.get("owner_id") == user_id
        
        # MODO FIRMA: Validar firma + RBAC
        if mode == "firm":
            # 1. Verificar que el recurso pertenece a su firma
            if resource_data.get("firm_id") != organization_id:
                return False
            
            # 2. Aplicar RBAC según acción
            role = user_context["role"]
            
            if action == "read":
                # Casi todos pueden leer
                return True
            elif action == "write":
                # Solo certain roles
                allowed = ["firm_owner", "partner", "senior_lawyer"]
                return role in allowed
            elif action == "delete":
                # Solo firm_owner
                return role == "firm_owner"
        
        return False
    
    @staticmethod
    async def filter_resources_by_mode(
        user_context: dict,
        resources: List[dict]
    ) -> List[dict]:
        """
        Filtra recursos que el usuario puede ver
        """
        mode = user_context["mode"]
        user_id = user_context["user_id"]
        organization_id = user_context["organization_id"]
        
        if mode == "independent":
            # Solo sus propios recursos
            return [r for r in resources if r.get("owner_id") == user_id]
        else:  # firm
            # Recursos de su firma
            return [r for r in resources if r.get("firm_id") == organization_id]
```

---

## 7. Modelos Compartidos

### Estructura Unificada

```python
# backend/models/shared/case.py

class CaseBase(BaseModel):
    """Modelo base compartido para casos"""
    case_number: str
    title: str
    description: Optional[str]
    status: str
    # ... más campos ...
    
    # Campo de organización (se llena automáticamente)
    owner_id: Optional[str]  # Para independiente
    firm_id: Optional[str]   # Para firma
    
    # RBAC
    lawyers_assigned: List[str] = []
    created_by: str
    created_at: datetime
    updated_at: datetime

class Case(CaseBase):
    id: Optional[str] = Field(None, alias="_id")
    
    class Config:
        populate_by_name = True
```

---

## 8. Rutas Compartidas - Ejemplo de Implementación

```python
# backend/routes/shared/cases.py

@router.post("/cases")
async def create_case(
    case_data: CaseCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    mode: str = Depends(get_mode),  # NUEVO
):
    """Crear caso - funciona en ambos modos"""
    
    # 1. Determinar organización
    if mode == "independent":
        organization_id = str(current_user.get("_id"))
        case_doc = {
            "owner_id": organization_id,
            "firm_id": None,
            ...
        }
    else:  # firm
        organization_id = current_user.get("firm_id")
        # Validar RBAC
        if not PermissionValidator.can_create_case(current_user):
            raise HTTPException(403, "No tienes permiso")
        case_doc = {
            "owner_id": None,
            "firm_id": organization_id,
            ...
        }
    
    # 2. Insertar caso
    result = await db.cases.insert_one(case_doc)
    
    # 3. Retornar respuesta unificada
    return CaseResponse(...).dict()


@router.get("/cases")
async def list_cases(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    mode: str = Depends(get_mode),
):
    """Listar casos - filtrado automático por modo"""
    
    # Filtro automático según modo
    if mode == "independent":
        query = {"owner_id": str(current_user.get("_id"))}
    else:  # firm
        query = {"firm_id": current_user.get("firm_id")}
    
    cases = await db.cases.find(query).to_list(None)
    
    # Filtro RBAC si es firma
    if mode == "firm":
        cases = filter_cases_by_role(current_user, cases)
    
    return {"data": cases}
```

---

## 9. Frontend - Arquitectura Compartida

### Estructura de Carpetas

```
frontend/src/
├── modules/
│   ├── core/                       (NUEVO - módulos compartidos)
│   │   ├── components/
│   │   │   ├── CaseTable.jsx
│   │   │   ├── CaseModal.jsx
│   │   │   ├── ContactForm.jsx
│   │   │   ├── InvoiceTable.jsx
│   │   │   └── ... más componentes compartidos
│   │   │
│   │   ├── pages/
│   │   │   ├── CasesPage.jsx
│   │   │   ├── CRMPage.jsx
│   │   │   ├── BillingPage.jsx
│   │   │   ├── DocumentsPage.jsx
│   │   │   └── AnalyticsPage.jsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useCases.js
│   │   │   ├── useCRM.js
│   │   │   ├── useBilling.js
│   │   │   └── useMode.js
│   │   │
│   │   └── styles/
│   │       └── shared.css
│   │
│   ├── independent/                (Específico independiente)
│   │   ├── pages/
│   │   │   ├── IndependentDashboard.jsx
│   │   │   └── MyStats.jsx
│   │   │
│   │   └── IndependentModule.jsx
│   │
│   └── firm-os/                    (Específico firma)
│       ├── pages/
│       │   ├── FirmTeam.jsx
│       │   ├── FirmDashboard.jsx
│       │   └── FirmSettings.jsx
│       │
│       └── FirmOSModule.jsx
│
├── hooks/
│   ├── useMode.js                 (NUEVO - detecta modo)
│   └── usePermission.js           (NUEVO - validación permisos)
│
└── contexts/
    └── ModeContext.jsx            (NUEVO - contexto de modo)
```

### Context de Modo

```jsx
// frontend/src/contexts/ModeContext.jsx

const ModeContext = createContext();

export function ModeProvider({ children }) {
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectMode = async () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Detectar modo
      const detectedMode = user.firm_id ? 'firm' : 'independent';
      setMode(detectedMode);
      setLoading(false);
    };
    
    detectMode();
  }, []);

  return (
    <ModeContext.Provider value={{ mode, loading }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  return useContext(ModeContext);
}
```

### Rutas Compartidas Frontend

```jsx
// frontend/src/App.js - Estructurado por modo

function App() {
  const { mode, loading } = useMode();

  if (loading) return <Spinner />;

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* Rutas específicas del modo */}
      {mode === 'independent' && (
        <>
          <Route path="/dashboard" element={<IndependentDashboard />} />
          <Route path="/my-stats" element={<MyStats />} />
        </>
      )}

      {mode === 'firm' && (
        <>
          <Route path="/firm-os/*" element={<FirmOSModule />} />
          <Route path="/admin/*" element={<AdminModule />} />
        </>
      )}

      {/* Rutas compartidas (90%) - accesibles desde cualquier modo */}
      <Route path="/cases/*" element={<core.CasesPage />} />
      <Route path="/crm/*" element={<core.CRMPage />} />
      <Route path="/documents/*" element={<core.DocumentsPage />} />
      <Route path="/billing/*" element={<core.BillingPage />} />
      <Route path="/analytics/*" element={<core.AnalyticsPage />} />
      <Route path="/agenda/*" element={<core.AgendaPage />} />
    </Routes>
  );
}
```

---

## 10. Flujos de Migración

### Fase 1: Refactoring de Módulos (Semana 1-2)
1. Crear `/backend/models/shared/`
2. Crear `/backend/routes/shared/`
3. Unificar modelos de casos, CRM, billing, documentos
4. Crear middleware de modo

### Fase 2: Middleware y Permisos (Semana 2-3)
1. Implementar `mode_resolver.py`
2. Implementar `permission_layer.py`
3. Crear `/backend/middleware/multi_tenant.py`
4. Refactorizar endpoints existentes

### Fase 3: Frontend Compartido (Semana 3-4)
1. Crear `/frontend/src/modules/core/`
2. Mover componentes reutilizables
3. Crear `ModeContext`
4. Actualizar rutas de App.js

### Fase 4: Testing y Optimización (Semana 4-5)
1. Tests de modo-switching
2. Tests de RBAC
3. Tests de isolación de datos
4. Optimización de performance

---

## 11. Beneficios

✅ **Eliminación de duplicación**: 90% código compartido
✅ **Mantenimiento simplificado**: Un único codebase
✅ **Escalabilidad**: Mismo código para 1 usuario o 100
✅ **Flexibilidad**: Usuario puede migrar de independiente a firma
✅ **Consistencia**: Interfaz y lógica idéntica en ambos modos
✅ **Reducción de bugs**: Una versión = menos bugs

---

## 12. Matriz de Módulos por Modo

```
MÓDULO           INDEPENDIENTE   FIRMA      COMPARTIDO
─────────────────────────────────────────────────────
CRM              ✓              ✓          95%
Cases            ✓              ✓          95%
Agenda           ✓              ✓          90%
Documents        ✓              ✓          95%
Billing          ✓              ✓          90%
IA               ✓              ✓          100%
Analytics        ✓              ✓          95%
Client Portal    ✓              ✓          90%
─────────────────────────────────────────────────────
Team Mgmt        ✗              ✓          Específico
Firm Config      ✗              ✓          Específico
Dashboard        ✗              ✓          Específico
─────────────────────────────────────────────────────
PROMEDIO                                   ~90%
```

---

## 13. Ejemplo: Refactoring de Casos

### Antes (Duplicación)

```
# Lawyer OS
backend/routes/lawyer/cases.py (100 líneas)
frontend/modules/dashboard/pages/CasesPage.jsx (150 líneas)

# Firm OS  
backend/routes/firms/cases.py (100 líneas, 80% duplicado)
frontend/modules/firm-os/pages/FirmCases.jsx (150 líneas, 80% duplicado)

TOTAL: 500 líneas, 80% duplicación
```

### Después (Compartido)

```
# Compartido
backend/routes/shared/cases.py (100 líneas, 1 source of truth)
frontend/modules/core/pages/CasesPage.jsx (150 líneas, 1 source of truth)

# Modo específico
backend/routes/independent/cases.py (10 líneas, delegación)
backend/routes/firm/cases.py (20 líneas, validaciones RBAC)

frontend/modules/independent/CasesIntegration.jsx (10 líneas)
frontend/modules/firm-os/CasesIntegration.jsx (20 líneas, + permisos)

TOTAL: 310 líneas, 0% duplicación
```

---

## 14. Pasos Iniciales

1. **Crear modelo compartido**
   ```python
   # backend/models/shared/case.py
   # Unificar estructuras
   ```

2. **Crear middleware**
   ```python
   # backend/middleware/mode_resolver.py
   # Detectar modo automáticamente
   ```

3. **Refactorizar una ruta**
   ```python
   # backend/routes/shared/cases.py
   # Implementar con soporte de modo
   ```

4. **Crear contexto frontend**
   ```jsx
   // frontend/src/contexts/ModeContext.jsx
   // Propagar modo a través de la app
   ```

5. **Actualizar App.js**
   ```jsx
   // Rutas condicionales por modo
   ```

---

## Conclusión

**Legal OS Core** es una arquitectura unificada que:
- ✅ Mantiene un único codebase
- ✅ Soporta dos modos de operación
- ✅ Reutiliza 90% del código
- ✅ Simplifica mantenimiento
- ✅ Permite escalar sin duplicación
