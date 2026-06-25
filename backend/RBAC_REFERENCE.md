# RBAC Quick Reference - Firm OS

## 8 Roles de Firm OS

| Rol | Descripción | Módulos | Permisos |
|-----|-------------|---------|----------|
| **firm_owner** | Acceso total | Todos (10) | Todos (40+) |
| **partner** | Gestión jurídica | 8 | 24 |
| **senior_lawyer** | Casos senior | 5 | 13 |
| **lawyer** | Casos asignados | 5 | 9 |
| **paralegal** | Soporte en casos | 4 | 8 |
| **assistant** | Agenda y docs | 3 | 6 |
| **finance** | Facturación | 3 | 6 |
| **hr** | RR.HH. | 3 | 6 |

## Permisos por Categoría

### 🏢 Dashboard
- `view_dashboard` - Ver dashboard principal

### 👥 Lawyers/Team
- `view_lawyers` - Ver abogados
- `create_lawyer` - Crear abogado
- `update_lawyer` - Actualizar abogado
- `delete_lawyer` - Eliminar abogado
- `manage_roles` - Asignar roles

### 📋 Cases
- `view_cases` - Ver casos
- `create_case` - Crear caso
- `update_case` - Actualizar caso
- `delete_case` - Eliminar caso
- `assign_case` - Asignar caso
- `close_case` - Cerrar caso

### 💰 Finance
- `view_finances` - Ver finanzas
- `create_invoice` - Crear factura
- `update_invoice` - Actualizar factura
- `delete_invoice` - Eliminar factura
- `process_payment` - Procesar pago
- `view_payments` - Ver pagos

### 📊 Analytics
- `view_analytics` - Ver analytics
- `export_analytics` - Exportar datos

### 📄 Documents
- `view_documents` - Ver documentos
- `upload_document` - Subir documento
- `delete_document` - Eliminar documento
- `share_document` - Compartir documento

### 📅 Agenda
- `view_agenda` - Ver agenda
- `create_event` - Crear evento
- `update_event` - Actualizar evento
- `delete_event` - Eliminar evento

### ⚙️ Configuration
- `view_settings` - Ver configuración
- `update_settings` - Actualizar configuración
- `manage_integrations` - Gestionar integraciones
- `manage_configuration` - Gestionar config avanzada

### 👔 HR/Team
- `view_team` - Ver equipo
- `manage_team` - Gestionar equipo
- `view_payroll` - Ver nómina
- `manage_payroll` - Gestionar nómina

## Matriz de Acceso Rápida

```
MÓDULO              | owner | partner | sr_lawyer | lawyer | paralegal | asst | fin | hr
--------------------|-------|---------|-----------|--------|-----------|------|-----|----
dashboard           | ✓     | ✓       | ✓         | ✓      | ✓         | ✓    | ✓   | ✓
lawyers/team        | ✓     | ✓       | ✓         | ✓      | ✗         | ✗    | ✗   | ✓
cases               | ✓     | ✓       | ✓         | ✓      | ✓         | ✗    | ✗   | ✗
finance             | ✓     | ✓       | ✗         | ✗      | ✗         | ✗    | ✓   | ✗
analytics           | ✓     | ✓       | ✓         | ✓      | ✗         | ✗    | ✓   | ✓
documents           | ✓     | ✓       | ✓         | ✓      | ✓         | ✓    | ✗   | ✗
agenda              | ✓     | ✓       | ✓         | ✓      | ✓         | ✓    | ✗   | ✗
settings            | ✓     | ✓       | ✗         | ✗      | ✗         | ✗    | ✗   | ✗
configuration       | ✓     | ✗       | ✗         | ✗      | ✗         | ✗    | ✗   | ✗
```

## Decoradores Disponibles

```python
# Requerir rol
@require_firm_role(FirmRole.FIRM_OWNER, FirmRole.PARTNER)

# Requerir permiso
@require_permission(Permission.DELETE_CASE)

# Requerir módulo
@require_module_access(Module.FINANCE)

# Requerir firm_owner
@require_firm_owner()

# Casos específicos
@require_case_manager()
@require_finance_manager()
@require_team_manager()
```

## Funciones de Validación

```python
# Verificar permisos
check_permission(role, permission)           # bool
check_module_access(role, module)            # bool

# Validar acceso
verify_firm_access(user, firm_id)            # bool
check_case_access(user, case_data)           # bool

# Filtrar datos
filter_cases_by_role(user, cases)            # List[case]

# Validadores
PermissionValidator.can_manage_lawyers()
PermissionValidator.can_manage_team()
PermissionValidator.can_manage_finances()
PermissionValidator.can_view_analytics()
PermissionValidator.can_update_case()
PermissionValidator.can_close_case()
PermissionValidator.can_process_payment()
PermissionValidator.can_manage_payroll()
```

## Endpoints RBAC

```
GET    /api/rbac/roles                              # Listar roles
GET    /api/rbac/roles/{role_id}/permissions        # Permisos de rol
GET    /api/rbac/matrix                             # Matriz completa
POST   /api/rbac/users/{user_id}/assign-role        # Asignar rol
GET    /api/rbac/users/{user_id}/permissions        # Permisos de usuario
GET    /api/rbac/users/{user_id}/check-permission   # Verificar permiso
GET    /api/rbac/team/{firm_id}                     # Equipo con roles
```

## Casos de Uso Comunes

### ✅ Permitir solo firm_owner gestionar configuración
```python
@router.post("/settings")
async def update_settings(
    settings: dict,
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "firm_owner":
        raise HTTPException(403, "Solo firm_owner")
```

### ✅ Partner ve todos los casos, lawyer solo los suyos
```python
@router.get("/cases")
async def list_cases(current_user: dict = Depends(get_current_user)):
    user_cases = filter_cases_by_role(current_user, all_cases)
```

### ✅ Validar que finance pueda procesar pagos
```python
@router.post("/payments")
@require_permission(Permission.PROCESS_PAYMENT)
async def process_payment(...): ...
```

### ✅ Validar acceso a una firma específica
```python
if not verify_firm_access(current_user, firm_id):
    raise HTTPException(403, "No tienes acceso")
```

## Reglas de Acceso a Casos

| Rol | Ver Todos | Ver Asignados | Crear | Actualizar | Cerrar | Eliminar |
|-----|-----------|---------------|-------|------------|--------|----------|
| firm_owner | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| partner | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| senior_lawyer | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| lawyer | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ |
| paralegal | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ |
| assistant | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| finance | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| hr | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

## Reglas de Acceso a Equipo/Nómina

| Rol | Ver Equipo | Gestionar | Ver Nómina | Gestionar |
|-----|-----------|-----------|-----------|-----------|
| firm_owner | ✓ | ✓ | ✓ | ✓ |
| partner | ✓ | ✗ | ✗ | ✗ |
| senior_lawyer | ✓ | ✗ | ✗ | ✗ |
| lawyer | ✗ | ✗ | ✗ | ✗ |
| paralegal | ✗ | ✗ | ✗ | ✗ |
| assistant | ✗ | ✗ | ✗ | ✗ |
| finance | ✗ | ✗ | ✗ | ✗ |
| hr | ✓ | ✓ | ✓ | ✓ |

## Auditoría

Cada asignación de rol se registra:
```python
{
    "firm_id": "...",
    "user_id": "...",
    "role": "partner",
    "assigned_by": "...",
    "assigned_at": datetime
}
```

## Notas Importantes

- ✅ firm_owner es el único que puede asignar roles
- ✅ partner tiene acceso a la mayoría de operaciones jurídicas
- ✅ Lawyer solo ve casos en los que está asignado
- ✅ Finance no puede ver casos ni gestionar equipo
- ✅ HR no puede ver casos ni finanzas
- ✅ Assistant es rol más restrictivo (solo agenda y documentos)
