# Módulo EQUIPO - Firm OS

## Descripción

El módulo EQUIPO proporciona gestión completa del equipo de la firma jurídica, permitiendo a firm_owner y administradores gestionar roles, permisos, áreas de práctica y supervisores.

## Estructura

```
frontend/src/modules/firm-os/
├── pages/
│   ├── FirmTeam.jsx          (Página principal - Gestión de equipo)
│   └── FirmLawyers.jsx       (Ahora usa TeamTable reutilizable)
├── components/
│   ├── TeamTable.jsx         (Tabla reutilizable)
│   └── TeamMemberModal.jsx   (Modal de edición)
```

## Funcionalidades

### 1. Ver Equipo
- ✅ Listar todos los miembros del equipo
- ✅ Mostrar nombre, rol, estado
- ✅ Filtrar por búsqueda (nombre, email, rol)
- ✅ Métricas en tiempo real

### 2. Suspender Miembro
- ✅ Cambiar estado a `suspended`
- ✅ Confirmación antes de ejecutar
- ✅ Auditoría de cambio
- ✅ Botón de acción en tabla

### 3. Reactivar Miembro
- ✅ Cambiar estado a `ACTIVE`
- ✅ Confirmación antes de ejecutar
- ✅ Auditoría de cambio
- ✅ Botón de acción en tabla

### 4. Cambiar Rol
- ✅ Asignar uno de 8 roles (firm_owner, partner, senior_lawyer, lawyer, paralegal, assistant, finance, hr)
- ✅ Validación RBAC automática
- ✅ Auditoría registrada en `role_assignments`
- ✅ Modal de edición

### 5. Asignar Área de Práctica
- ✅ Seleccionar de las 7 áreas disponibles
- ✅ Cargadas desde `firm_configuration`
- ✅ Modal de edición
- ✅ Actualización en BD

### 6. Asignar Supervisor
- ✅ Seleccionar supervisor (partner, senior_lawyer, firm_owner)
- ✅ Validación de rol permitido
- ✅ Modal de edición
- ✅ Nombre del supervisor almacenado

## Métricas

### Tarjetas KPI
- **Total de Miembros**: Cantidad total de personas en la firma
- **Activos**: Miembros con status ACTIVE
- **Suspendidos**: Miembros con status suspended

### Distribución por Rol
- Grid dinámico mostrando cantidad por rol
- Actualización automática al cambiar roles

## Componentes Reutilizables

### TeamTable.jsx
Tabla configurable para mostrar datos de miembros.

**Props**:
```javascript
{
  members: Array,              // Array de miembros
  loading: boolean,            // Estado de carga
  onEdit: Function,            // Callback para editar
  onSuspend: Function,         // Callback para suspender
  onReactivate: Function,      // Callback para reactivar
  columns: Array<string>       // Columnas a mostrar: ['name', 'role', 'specialty', 'area', 'supervisor', 'cases', 'status', 'actions']
}
```

**Uso**:
```jsx
<TeamTable
  members={filteredTeam}
  loading={loading}
  onEdit={handleEdit}
  onSuspend={handleSuspend}
  onReactivate={handleReactivate}
  columns={['name', 'role', 'status', 'actions']}
/>
```

### TeamMemberModal.jsx
Modal reutilizable para editar miembros.

**Props**:
```javascript
{
  member: Object,              // Miembro a editar
  isOpen: boolean,             // Control de visibilidad
  onClose: Function,           // Callback para cerrar
  onSave: Function,            // Callback para guardar
  practiceAreas: Array         // Áreas disponibles
}
```

**Uso**:
```jsx
<TeamMemberModal
  member={selectedMember}
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  onSave={handleSaveChanges}
  practiceAreas={practiceAreas}
/>
```

## Sin Duplicación de Código

### FirmLawyers.jsx (Refactorizado)
Antes: Tabla HTML hardcodeada en el componente
Ahora: Usa `TeamTable` con configuración específica

```jsx
// Antes: ~100 líneas de código
<table className="w-full">
  <thead>
    <tr>
      <th>Nombre</th>
      <th>Especialidad</th>
      // ... más columnas
    </tr>
  </thead>
  <tbody>
    {lawyers.map((lawyer, idx) => (
      <tr key={idx}>
        // ... más código
      </tr>
    ))}
  </tbody>
</table>

// Ahora: 1 línea
<TeamTable
  members={lawyers}
  loading={loading}
  columns={['name', 'specialty', 'cases']}
/>
```

### FirmTeam.jsx
Usa los mismos componentes pero con más funcionalidades y columnas.

## Endpoints Backend

### PATCH /api/team/{user_id}/status
Cambiar estado de un miembro
```json
{
  "status": "suspended" | "ACTIVE"
}
```

### PATCH /api/team/{user_id}/practice-area
Asignar área de práctica
```json
{
  "practice_area": "laboral"
}
```

### PATCH /api/team/{user_id}/supervisor
Asignar supervisor
```json
{
  "supervisor_id": "user_id_supervisor"
}
```

### GET /api/team/{user_id}/metrics
Obtener métricas de un miembro
Respuesta:
```json
{
  "metrics": {
    "total_cases": 5,
    "active_cases": 3,
    "closed_cases": 2,
    "total_revenue": 5000.50,
    "joined_at": "2025-01-15",
    "status": "ACTIVE"
  }
}
```

### GET /api/team/stats/{firm_id}
Estadísticas del equipo completo
Respuesta:
```json
{
  "stats": {
    "total_members": 8,
    "active_members": 7,
    "suspended_members": 1,
    "by_role": {
      "firm_owner": 1,
      "partner": 2,
      "lawyer": 4,
      "assistant": 1
    },
    "total_cases": 20,
    "active_cases": 15
  }
}
```

## Flujos Principales

### Suspender Abogado
```
1. Usuario hace clic en botón Suspender
2. Confirmación
3. PATCH /api/team/{id}/status { status: "suspended" }
4. Actualizar tabla
5. Auditoría registrada
```

### Cambiar Rol
```
1. Usuario abre modal (clic en Editar)
2. Selecciona nuevo rol
3. Clic en "Guardar Cambios"
4. POST /api/rbac/users/{id}/assign-role { role: "partner" }
5. Modal se cierra
6. Tabla actualizada
7. Auditoría en role_assignments
```

### Asignar Supervisor
```
1. Usuario abre modal
2. Selecciona supervisor de dropdown (cargado dinámicamente)
3. Sistema valida que tenga rol permitido
4. PATCH /api/team/{id}/supervisor { supervisor_id: "..." }
5. Guardado en BD
```

## Validaciones

### En Frontend
- ✅ Búsqueda en tiempo real
- ✅ Confirmación antes de acciones destructivas
- ✅ Validación de campos en modal
- ✅ Estados de carga

### En Backend
- ✅ RBAC: Solo managers pueden gestionar equipo
- ✅ Validación de rol para supervisor
- ✅ Verificación de firma
- ✅ Auditoría de cambios

## Auditoría

Todos los cambios se registran en:
- `role_assignments` - Cambios de rol
- `team_audit_log` - Cambios de estado y supervisor

Campos registrados:
- firm_id
- user_id
- action (status_change, supervisor_assignment)
- old_status / new_status
- changed_by (ID del admin)
- changed_at (datetime)

## Integración con Otros Módulos

### RBAC
- Usa `PermissionValidator.can_manage_team()` para autorización
- Integrado con sistema de roles de 8 niveles

### Firm Configuration
- Carga áreas de práctica desde `/api/firm-config/{firm_id}/practice-areas`

### Dashboard
- Las métricas se pueden sincronizar con el dashboard principal

## Características Futuras

- 📅 Historial de cambios por miembro
- 📊 Gráficos de desempeño
- 🎓 Sistema de mentoría automatizado
- 📢 Notificaciones de cambio de rol
- 🎯 Asignación inteligente de casos
- 📋 Templates de onboarding por rol

## Notas de Desarrollo

- El módulo está completamente separado de `FirmLawyers`
- `TeamTable` es agnóstica a los datos
- `TeamMemberModal` se puede reutilizar en otros contextos
- Todos los endpoints tienen auditoría
- RBAC integrado en cada operación
