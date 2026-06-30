# Fase 3: Implementación de Endpoint de Rechazo

**Fecha**: 28 de Junio, 2025  
**Estado**: ✅ COMPLETADO  
**Alcance**: Mejorado `POST /api/firms/{firm_id}/reject` con auditoría completa

---

## Resumen

Se mejoró el endpoint de rechazo de firma para implementar una auditoría completa de las solicitudes de firma rechazadas. El nuevo flujo garantiza que todos los rechazos se registren con contexto completo, responsabilidad del admin y notificaciones por email no bloqueantes.

---

## Cambios Realizados

### Archivo: `backend/routes/firms.py`

**Ubicación**: Líneas 668-757 (endpoint de rechazo)

**Mejoras**:

1. **Validación de Estado**
   - Solo permite rechazar firmas en estado `PENDING_APPROVAL`
   - Previene rechazo accidental de firmas activas/suspendidas
   - Retorna error claro si la firma está en estado incorrecto

2. **Registro de Auditoría**
   - Registra `rejected_by` (ID del admin que rechazó)
   - Registra `rejected_at` timestamp (formato ISO)
   - Almacena `rejection_reason` completa (5-500 caracteres, validado por Pydantic)
   - Preserva todos los registros anteriores (sin eliminación)

3. **Desactivación de Usuario**
   - Si la firma tenía un `firm_owner` asociado, configura su `status: "REJECTED"`
   - Previene que el propietario de la firma rechazada acceda al sistema
   - Preserva el registro del usuario para auditoría/cumplimiento

4. **Respuesta Estructurada**
   - Retorna confirmación con detalles completos del rechazo
   - Incluye registro de auditoría mostrando cambios de estado
   - Muestra qué admin realizó la acción
   - Confirma entrega de notificación por email

5. **Notificación por Email**
   - Envía email de notificación de rechazo al fundador
   - El email incluye el motivo del rechazo
   - No bloqueante: el rechazo se completa aunque falle el email
   - Registra ID de traza del email para diagnósticos

6. **Registro Comprensivo**
   - Registra rechazo con ID de firma, nombre, admin, motivo (truncado)
   - Registra estado de entrega de email por separado
   - Permite reconstruir fácilmente el registro de auditoría desde logs

---

## Especificación de API

### Endpoint
```
POST /api/firms/{firm_id}/reject
```

### Autenticación
- Requerido: Token de admin (Bearer)
- Roles: Solo `admin` o `admin_general`

### Cuerpo de Solicitud
```json
{
  "reason": "Información incompleta o inválida. Reenviar con documentación completa."
}
```

**Validación**:
- `reason`: requerido, mín 5 caracteres, máx 500 caracteres
- Base de datos valida en modelo `FirmRejectRequest`

### Respuesta Exitosa (HTTP 200)
```json
{
  "success": true,
  "message": "Firma 'Firma ABC' rechazada exitosamente.",
  "firm_id": "507f1f77bcf86cd799439011",
  "firm_name": "Firma ABC",
  "rejection": {
    "reason": "Información incompleta o inválida. Reenviar con documentación completa.",
    "rejected_by_admin": "507f1f77bcf86cd799439099",
    "rejected_at": "2025-06-28T14:35:00Z",
    "audit_record": {
      "firm_status_before": "PENDING_APPROVAL",
      "firm_status_after": "REJECTED",
      "owner_id": "507f1f77bcf86cd799439012",
      "owner_status_after": "REJECTED"
    }
  },
  "email_notification": {
    "sent": true,
    "trace_id": "x1y2z3w4v5u6",
    "recipient": "juan@firmabc.com",
    "note": "Notificación enviada al propietario de la firma (si SMTP disponible)"
  }
}
```

### Respuestas de Error

**401 Sin Autorización** (no es admin):
```json
{
  "detail": "Solo administradores pueden rechazar firmas"
}
```

**400 Solicitud Inválida** (firm_id inválido):
```json
{
  "detail": "ID de firma inválido"
}
```

**404 No Encontrado**:
```json
{
  "detail": "Firma no encontrada"
}
```

**400 Solicitud Inválida** (estado incorrecto):
```json
{
  "detail": "Firma no puede ser rechazada desde estado 'ACTIVE'. Solo se pueden rechazar firmas en PENDING_APPROVAL."
}
```

---

## Cambios en Base de Datos

### Documento de Firma
Antes:
```javascript
{
  status: "PENDING_APPROVAL",
  approval_status: "pending",
  approval_date: null,
  approved_by: null,
  rejection_reason: null,
  updated_at: ISODate("2025-06-28T12:00:00Z")
}
```

Después:
```javascript
{
  status: "REJECTED",
  approval_status: "rejected",
  approval_date: null,
  approved_by: null,
  rejection_reason: "Información incompleta o inválida. Reenviar con documentación completa.",
  rejected_by: ObjectId("507f1f77bcf86cd799439099"),
  rejected_at: ISODate("2025-06-28T14:35:00Z"),
  updated_at: ISODate("2025-06-28T14:35:00Z")
}
```

### Documento de Usuario (si firm_owner existía)
Antes:
```javascript
{
  status: "ACTIVE",
  updated_at: ISODate("2025-06-28T12:00:00Z")
}
```

Después:
```javascript
{
  status: "REJECTED",
  updated_at: ISODate("2025-06-28T14:35:00Z")
}
```

---

## Registro de Auditoría

### Formato de Log
```
[REJECT_FIRM] firm_id={firm_id} | firm_name={name} | rejected_by={user_id} | reason={reason_snippet}...
[REJECT_FIRM_EMAIL] email_sent={bool} | trace_id={trace_id} | recipient={email}
[REJECT_FIRM_EMAIL_FAILED] firm_id={firm_id} | error={error_msg}
```

### Ejemplo de Logs
```
[REJECT_FIRM] firm_id=507f1f77bcf86cd799439011 | firm_name=Firma ABC | rejected_by=507f1f77bcf86cd799439099 | reason=Información de NIT incompleta...
[REJECT_FIRM_EMAIL] email_sent=true | trace_id=x1y2z3w4v5u6 | recipient=juan@firmabc.com
```

---

## Puntos de Integración

### Admin OS (Fase 4)
- Utiliza este endpoint desde la vista de detalle de firma
- Muestra confirmación de rechazo con registro de auditoría
- Muestra qué admin rechazó + timestamp + motivo

### Sistema de Email
- Utiliza `send_email()` de `utils.notifier`
- No bloqueante: fallar el email no falla el rechazo
- Incluye ID de traza de email para diagnósticos
- Envía notificación de rechazo en formato HTML

### Cumplimiento y Auditoría
- Todos los rechazos son buscables por ID de admin, timestamp, motivo
- Registros de firma originales nunca se eliminan
- Los propietarios de firmas rechazadas no pueden iniciar sesión
- Registro de auditoría completo para revisiones de cumplimiento

---

## Escenarios de Prueba

### Prueba 1: Rechazar Firma PENDING_APPROVAL
```bash
POST /api/firms/507f1f77bcf86cd799439011/reject
Authorization: Bearer {admin_token}
{
  "reason": "Información incompleta de NIT"
}
```
✅ Esperado: HTTP 200, estado de firma = REJECTED

### Prueba 2: Rechazar Firma Previamente Rechazada
```bash
POST /api/firms/507f1f77bcf86cd799439011/reject
Authorization: Bearer {admin_token}
{
  "reason": "Otro motivo"
}
```
✅ Esperado: HTTP 200, actualiza motivo de rechazo (se puede rechazar de nuevo si es necesario)

### Prueba 3: Rechazar Firma ACTIVE
```bash
POST /api/firms/507f1f77bcf86cd799439011/reject
Authorization: Bearer {admin_token}
{
  "reason": "No debería funcionar"
}
```
❌ Esperado: HTTP 400, "Firma no puede ser rechazada desde estado 'ACTIVE'"

### Prueba 4: Intento de Rechazo no-Admin
```bash
POST /api/firms/507f1f77bcf86cd799439011/reject
Authorization: Bearer {firm_owner_token}
{
  "reason": "Intentando rechazar"
}
```
❌ Esperado: HTTP 403, "Solo administradores pueden rechazar firmas"

### Prueba 5: Fallo de Email (SMTP Inactivo)
- Deshabilitar SMTP o usar credenciales inválidas
- El rechazo debería completarse exitosamente
- La traza de email debería mostrar "email_failed"
- HTTP 200 aún se retorna
✅ Esperado: Rechazo exitoso, email_sent = false

---

## Próximos Pasos

1. **Confirmar Cambios**: Preparar y confirmar endpoint de rechazo de Fase 3
2. **Fase 4**: Construir módulo de UI "Solicitudes de Firmas" en Admin OS
3. **Fase 5**: Actualizar mensajería de registro de landing page
4. **Fase 6**: Implementar flujo de cambio de contraseña en primer login
5. **Fase 7**: Construir UI de visualización/copia de credenciales de admin

---

## Plan de Reversión

Si es necesario revertir la lógica de rechazo:
1. Restaurar versión anterior de `backend/routes/firms.py` (endpoint de rechazo)
2. Sin migración de base de datos necesaria (nuevos campos son aditivos solamente)
3. Los rechazos antiguos permanecen en DB con registro de auditoría parcial

---

## Monitoreo

### Métricas Clave a Rastrear
- Tasa de rechazo (rechazos / registros totales)
- Longitud/tipo promedio de motivo de rechazo
- Tasa de éxito de entrega de email para rechazos
- Tiempo desde registro hasta decisión de rechazo
- Admin que más frecuentemente aprueba/rechaza (para QA)

### Alertas a Configurar
- Tasa de fallo de rechazo > 5%
- Tasa de fallo de entrega de email > 10% para notificaciones de rechazo
- Patrones de rechazo inusuales (rechazos masivos en poco tiempo)

---

## Notas de Cumplimiento

- ✅ Motivo de rechazo almacenado (requisito regulatorio)
- ✅ Responsabilidad del admin (campo rejected_by)
- ✅ Timestamp para todas las acciones
- ✅ Sin eliminación de registros (registro de auditoría intacto)
- ✅ Los usuarios rechazados no pueden acceder al sistema
- ✅ Notificación por email proporcionada al solicitante
