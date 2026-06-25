# Guía de Implementación RBAC en Firm OS

## Estructura de Roles

```
firm_owner          → Acceso total al sistema
partner             → Gestión jurídica y casos
senior_lawyer       → Casos senior y mentoría
lawyer              → Casos asignados
paralegal           → Soporte en casos
assistant           → Agenda y documentos
finance             → Facturación y pagos
hr                  → Equipo y talento
```

## Implementación en Endpoints

### Patrón 1: Decorador de Rol Requerido

```python
from fastapi import APIRouter, Depends
from utils.rbac import require_firm_role
from models.rbac import FirmRole
from routes.auth import get_current_user

@router.post("/cases")
@require_firm_role(FirmRole.FIRM_OWNER, FirmRole.PARTNER)
async def create_case(
    case_data: dict,
    current_user: dict = Depends(get_current_user),
):
    """Solo firm_owner y partner pueden crear casos"""
    # implementación
```

### Patrón 2: Decorador de Permiso Específico

```python
from utils.rbac import require_permission
from models.rbac import Permission

@router.delete("/cases/{case_id}")
@require_permission(Permission.DELETE_CASE)
async def delete_case(
    case_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Requiere permiso DELETE_CASE"""
    # implementación
```

### Patrón 3: Validación Manual en Función

```python
from utils.rbac import PermissionValidator

@router.get("/cases/{case_id}")
async def get_case(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener caso con validación de acceso granular"""
    case = await db.cases.find_one({"_id": ObjectId(case_id)})
    
    # Validar acceso: solo quien está asignado o managers
    if not PermissionValidator.can_update_case(current_user, case):
        raise HTTPException(status_code=403, detail="No tienes acceso a este caso")
    
    return case
```

### Patrón 4: Filtrado de Datos por Rol

```python
from utils.rbac import filter_cases_by_role

@router.get("/cases")
async def list_cases(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Listar casos con filtrado automático por rol"""
    all_cases = await db.cases.find().to_list(None)
    
    # Filtrar según rol
    user_cases = filter_cases_by_role(current_user, all_cases)
    
    return {"success": True, "data": user_cases}
```

### Patrón 5: Validación de Acceso a Firma

```python
from utils.rbac import verify_firm_access

@router.get("/firms/{firm_id}/finances")
async def get_firm_finances(
    firm_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Acceso a finanzas solo de la firma del usuario"""
    if not verify_firm_access(current_user, firm_id):
        raise HTTPException(status_code=403, detail="No tienes acceso a esta firma")
    
    # implementación
```

## Matriz de Permisos por Rol

### firm_owner
- ✅ Todos los permisos
- ✅ Acceso a todos los módulos
- ✅ Puede asignar roles
- ✅ Puede gestionar configuración

### partner
- ✅ Ver y crear casos
- ✅ Asignar casos
- ✅ Ver finanzas (solo lectura)
- ✅ Ver analytics
- ✅ Gestionar abogados
- ❌ No puede procesar pagos
- ❌ No puede gestionar nómina

### senior_lawyer
- ✅ Ver todos los casos
- ✅ Crear/actualizar casos
- ✅ Cerrar casos
- ✅ Mentoría de otros abogados
- ❌ No puede eliminar casos
- ❌ No puede gestionar finanzas

### lawyer
- ✅ Ver casos asignados
- ✅ Actualizar casos asignados
- ✅ Ver documentos
- ✅ Crear eventos en agenda
- ❌ No puede crear casos nuevos
- ❌ No puede cerrar casos
- ❌ No puede ver casos de otros

### paralegal
- ✅ Ver casos asignados
- ✅ Actualizar casos asignados
- ✅ Subir documentos
- ✅ Ver agenda
- ❌ No puede crear casos
- ❌ No puede ver finanzas

### assistant
- ✅ Ver agenda
- ✅ Crear eventos
- ✅ Subir documentos
- ❌ No puede ver casos
- ❌ No puede ver finanzas
- ❌ No puede gestionar equipo

### finance
- ✅ Ver finanzas
- ✅ Crear facturas
- ✅ Procesar pagos
- ✅ Ver analytics
- ❌ No puede ver casos (a menos que sea también lawyer)
- ❌ No puede gestionar equipo
- ❌ No puede cerrar casos

### hr
- ✅ Ver equipo
- ✅ Gestionar roles
- ✅ Ver nómina
- ✅ Gestionar payroll
- ❌ No puede ver casos
- ❌ No puede ver finanzas
- ❌ No puede gestionar configuración

## Endpoints RBAC Disponibles

### Gestión de Roles

```bash
# Listar roles disponibles
GET /api/rbac/roles

# Obtener permisos de un rol
GET /api/rbac/roles/{role_id}/permissions

# Obtener matriz completa de permisos
GET /api/rbac/matrix

# Asignar rol a usuario
POST /api/rbac/users/{user_id}/assign-role
Body: { "role": "partner" }

# Obtener permisos de un usuario
GET /api/rbac/users/{user_id}/permissions

# Verificar permiso específico
GET /api/rbac/users/{user_id}/check-permission/{permission}

# Obtener equipo de una firma con roles
GET /api/rbac/team/{firm_id}
```

## Validación de Permisos Comunes

### Casos
```python
PermissionValidator.can_update_case(user)      # Actualizar caso
PermissionValidator.can_close_case(user)       # Cerrar caso
```

### Equipo
```python
PermissionValidator.can_manage_team(user)      # Gestionar equipo
PermissionValidator.can_manage_payroll(user)   # Gestionar nómina
```

### Finanzas
```python
PermissionValidator.can_manage_finances(user)  # Gestionar finanzas
PermissionValidator.can_process_payment(user)  # Procesar pago
```

### Analytics
```python
PermissionValidator.can_view_analytics(user)   # Ver analytics
```

## Casos de Uso Comunes

### 1. Validar que solo firm_owner pueda asignar roles

```python
@router.post("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role_data: dict,
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "firm_owner":
        raise HTTPException(status_code=403, detail="Solo firm_owner")
```

### 2. Permitir que partner vea todos los casos, pero lawyer solo los suyos

```python
@router.get("/cases")
async def list_cases(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user_role = current_user.get("role")
    
    if user_role in ["firm_owner", "partner", "senior_lawyer"]:
        cases = await db.cases.find().to_list(None)
    else:
        user_id = str(current_user.get("_id"))
        cases = await db.cases.find({
            "lawyers_assigned": user_id
        }).to_list(None)
    
    return cases
```

### 3. Validar acceso a firma antes de operación

```python
@router.post("/firms/{firm_id}/settings")
async def update_firm_settings(
    firm_id: str,
    settings: dict,
    current_user: dict = Depends(get_current_user),
):
    if not verify_firm_access(current_user, firm_id, 
                            allowed_roles=["firm_owner", "partner"]):
        raise HTTPException(status_code=403)
```

## Extendiendo RBAC

### Agregar nuevo rol

1. Agregar a `FirmRole` enum en `models/rbac.py`
2. Agregar a `ROLE_PERMISSIONS` dict
3. Definir permisos específicos
4. Actualizar validaciones si es necesario

### Agregar nuevo permiso

1. Agregar a `Permission` enum en `models/rbac.py`
2. Agregar a roles en `ROLE_PERMISSIONS` que deben tenerlo
3. Usar en decorador `@require_permission(Permission.NEW_PERMISSION)`

### Agregar nuevo módulo

1. Agregar a `Module` enum en `models/rbac.py`
2. Agregar a módulos de roles en `ROLE_PERMISSIONS`
3. Usar en decorador `@require_module_access(Module.NEW_MODULE)`

## Testing RBAC

```python
# Test: Verificar que lawyer no puede eliminar casos
def test_lawyer_cannot_delete_case():
    user_role = FirmRole.LAWYER
    assert not check_permission(user_role, Permission.DELETE_CASE)

# Test: Verificar que partner puede cerrar casos
def test_partner_can_close_case():
    assert PermissionValidator.can_close_case(
        {"role": "partner"}
    )
```

## Logs y Auditoría

Todo cambio de rol se registra en `role_assignments`:
```python
{
    "firm_id": "...",
    "user_id": "...",
    "role": "partner",
    "assigned_by": "...",
    "assigned_at": datetime.utcnow()
}
```

## Migración de Usuarios Existentes

Para usuarios sin rol especificado:
```python
# Asignar automáticamente basado en contexto
if user.get("firm_lawyer"):
    role = "lawyer"
elif user.get("firm_admin"):
    role = "firm_admin"
else:
    role = "assistant"  # default
```
