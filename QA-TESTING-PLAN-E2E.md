# QA Testing Plan E2E - Complete Flow Validation

**Documento**: Plan de Testing E2E  
**Estado**: LISTO PARA EJECUTAR  
**Total de Test Cases**: 14  
**Estimated Duration**: 1.5-2 horas  
**Date**: 28 de Junio, 2025

---

## Pre-Testing Setup

### Requisitos
1. ✅ Backend corriendo (puerto 8000)
2. ✅ Frontend corriendo (puerto 3000 o similar)
3. ✅ MongoDB disponible
4. ✅ SMTP configurado (o mock)
5. ✅ Navegador con DevTools abierto (F12)
6. ✅ Postman o similar para inspeccionar requests

### Credenciales Admin
```
Email: demo@puntocero.local (o admin creado)
Contraseña: [admin password]
```

### Test Data
Crear una firma de prueba para rechazar:
```json
{
  "name": "Firma Test Rechazo",
  "nit": "900111222",
  "email": "firma-rechazo@test.com",
  "phone": "+573001111111",
  "address": "Cra 1 #1-1",
  "city": "Bogotá",
  "country": "Colombia",
  "plan": "firm_growth",
  "founder_name": "Juan Rechazado",
  "founder_email": "juan-rechazo@test.com",
  "founder_phone": "+573001111111",
  "founder_document": "1111111111",
  "founder_bar_number": "11111"
}
```

Crear una firma de prueba para aprobar:
```json
{
  "name": "Firma Test Aprobación",
  "nit": "900222333",
  "email": "firma-aprobacion@test.com",
  "phone": "+573002222222",
  "address": "Cra 2 #2-2",
  "city": "Medellín",
  "country": "Colombia",
  "plan": "firm_enterprise",
  "founder_name": "María Aprobada",
  "founder_email": "maria-aprobacion@test.com",
  "founder_phone": "+573002222222",
  "founder_document": "2222222222",
  "founder_bar_number": "22222"
}
```

---

## TEST CASE 1: Landing → Registro

### Objetivo
Validar que se puede registrar una firma desde landing sin errores.

### Pasos
1. Abrir navegador en `http://localhost:3000`
2. Navegar a sección de registro de firmas (o landing page)
3. Llenar formulario con datos de "Firma Test Aprobación"
4. Hacer submit

### Validaciones

#### Frontend
- ✅ Formulario carga sin errores JavaScript
- ✅ Inputs aceptan datos
- ✅ Botón submit habilitado
- ✅ No hay errores en console (F12)

#### Network
```bash
POST /api/firms/register
Status: 201
Response: {
  "success": true,
  "firm_id": "xxxxx",
  "status": "PENDING_APPROVAL"
}
```

#### Console
- ✅ Sin errores
- ✅ Sin warnings críticos
- ✅ No hay XSS attempts

#### LocalStorage
- ✅ No se crea sesión (no hay pcl_token para firma owner)

**Result**: ✅ PASS / ❌ FAIL

---

## TEST CASE 2: Solicitud Creada en BD

### Objetivo
Validar que la firma fue creada correctamente en MongoDB

### Validaciones

#### MongoDB Query
```javascript
db.firms.findOne({
  "email": "firma-aprobacion@test.com"
})
```

Verificar:
- ✅ `status: "PENDING_APPROVAL"`
- ✅ `approval_status: "pending"`
- ✅ `owner_id: null`
- ✅ `trial_status: "inactive"`
- ✅ `created_at: ISODate(...)`
- ✅ Todos los datos coinciden con registro

#### Logs Backend
```
[REGISTER_FIRM_NEW_FLOW] firm_id=xxxxx | email=firma-aprobacion@test.com | status=PENDING_APPROVAL
```

**Result**: ✅ PASS / ❌ FAIL

---

## TEST CASE 3: Admin OS - Visualizar Solicitud

### Objetivo
Validar que la solicitud aparece en Admin OS y puede verse correctamente

### Pasos
1. Login como admin (si no está logueado)
2. Navegar a `/admin/firms-solicitudes`
3. Esperar carga de datos

### Validaciones

#### Frontend - Carga
- ✅ Página carga sin errores
- ✅ 5 tarjetas de estadísticas visibles
- ✅ Tabla muestra la firma registrada
- ✅ Contador "Pendientes" aumentó en 1
- ✅ No hay errores JavaScript en console

#### Tabla - Datos Correctos
- ✅ Columna "Firma": muestra nombre + NIT
- ✅ Columna "Responsable": "María Aprobada"
- ✅ Columna "Email": "firma-aprobacion@test.com"
- ✅ Columna "Teléfono": "+573002222222"
- ✅ Columna "País": "Colombia"
- ✅ Columna "Plan": "Enterprise (10)"
- ✅ Columna "Estado": "Pendiente" (amarillo)

#### Network
```bash
GET /api/firms/stats/summary
Status: 200

GET /api/firms/status/pending
Status: 200
Response contains: {
  "id": "xxxxx",
  "name": "Firma Test Aprobación",
  "email": "firma-aprobacion@test.com",
  "status": "PENDING_APPROVAL"
}
```

#### LocalStorage
- ✅ `pcl_token` presente (admin logueado)
- ✅ `pcl_user` contiene admin user data

**Result**: ✅ PASS / ❌ FAIL

---

## TEST CASE 4: Ver Detalle

### Objetivo
Validar que el modal de detalles muestra información completa y correcta

### Pasos
1. En tabla, hacer click en icono "Ver Detalles"
2. Modal debe abrirse

### Validaciones

#### Modal Visualización
- ✅ Modal abre sin errors
- ✅ Modal muestra titulo "Detalles de la Solicitud"
- ✅ Subtítulo muestra nombre firma
- ✅ Botón X cierra el modal
- ✅ Modal es scrolleable (max-h-[90vh])

#### Contenido - Información Firma
- ✅ Nombre: "Firma Test Aprobación"
- ✅ NIT: "900222333"
- ✅ Email: "firma-aprobacion@test.com"
- ✅ Plan: "Consolidación Empresarial (10 abogados)"
- ✅ País: "Colombia"
- ✅ Ciudad: "Medellín"
- ✅ Dirección: "Cra 2 #2-2"

#### Contenido - Socio Fundador
- ✅ Nombre: "María Aprobada"
- ✅ Email: "maria-aprobacion@test.com"

#### Contenido - Registro
- ✅ Fecha está presente
- ✅ Formato es correcto (es-CO)
- ✅ Última actualización presente

#### Botones
- ✅ Botón "APROBAR FIRMA" (verde)
- ✅ Botón "RECHAZAR" (rojo)
- ✅ Botón "Cerrar" (gris)

**Result**: ✅ PASS / ❌ FAIL

---

## TEST CASE 5: Rechazar

### Objetivo
Validar que se puede rechazar una firma con motivo registrado

### Pasos
1. Abrir detalles de "Firma Test Rechazo"
2. Click "RECHAZAR"
3. Modal de rechazo aparece
4. Escribir motivo: "Información de NIT incompleta. Reenviar con documento de constitución."
5. Click "Confirmar Rechazo"

### Validaciones

#### Modal Rechazo - UI
- ✅ Modal aparece
- ✅ Textarea está vacío inicialmente
- ✅ Contador caracteres: "0 / 500"
- ✅ Botón "Confirmar Rechazo" DESHABILITADO inicialmente

#### Modal Rechazo - Tipeo
- ✅ Textarea acepta texto
- ✅ Contador actualiza en tiempo real
- ✅ Botón "Confirmar Rechazo" se HABILITA (>= 5 chars)
- ✅ No se puede escribir más de 500 chars

#### Modal Rechazo - Botones
- ✅ "Cancelar" cierra modal sin cambios
- ✅ "Confirmar Rechazo" deshabilitado si motivo < 5 chars

#### API Request
```bash
POST /api/firms/{firm_id}/reject
Content-Type: application/json
Authorization: Bearer {token}

{
  "reason": "Información de NIT incompleta..."
}

Status: 200
Response: {
  "success": true,
  "rejection": {
    "reason": "Información de NIT incompleta...",
    "rejected_by_admin": "xxxxx",
    "rejected_at": "2025-06-28T..."
  }
}
```

#### Frontend - Post Rechazo
- ✅ Modal se cierra
- ✅ Tabla se recarga
- ✅ Firma rechazada desaparece de tabla
- ✅ Contador "Rechazadas" aumenta en 1
- ✅ Contador "Pendientes" disminuye en 1

#### Database
```javascript
db.firms.findOne({
  "email": "firma-rechazo@test.com"
})
```
Verificar:
- ✅ `status: "REJECTED"`
- ✅ `approval_status: "rejected"`
- ✅ `rejection_reason: "Información de NIT incompleta..."`
- ✅ `rejected_by: ObjectId(...)`
- ✅ `rejected_at: ISODate(...)`

#### Logs Backend
```
[REJECT_FIRM] firm_id=xxxxx | rejected_by=xxxxx | reason=Información de NIT incompleta...
```

**Result**: ✅ PASS / ❌ FAIL

---

## TEST CASE 6: Aprobar

### Objetivo
Validar que se puede aprobar una firma y se generan credenciales

### Pasos
1. Abrir detalles de "Firma Test Aprobación"
2. Click "APROBAR FIRMA"
3. Modal de credenciales debe aparecer

### Validaciones

#### API Request
```bash
POST /api/firms/{firm_id}/approve
Authorization: Bearer {token}
Body: {}

Status: 200
Response: {
  "success": true,
  "firm_id": "xxxxx",
  "owner_id": "xxxxx",
  "credentials": {
    "email": "maria-aprobacion@test.com",
    "temp_password": "xxxxx..." (22 chars),
    "note": "Contraseña temporal válida..."
  },
  "trial": {
    "status": "active",
    "days": 7,
    "started_at": "2025-06-28T...",
    "ends_at": "2025-07-05T..."
  }
}
```

#### Frontend - Modal Credenciales
- ✅ Modal aparece después de aprobación
- ✅ Título: "¡Firma Aprobada!"
- ✅ Mensaje indica que credenciales se muestran una sola vez
- ✅ ⚠️ Advertencia visible

#### Campos Credenciales
- ✅ Email input readonly: "maria-aprobacion@test.com"
- ✅ Contraseña input readonly: "xxxxx..." (no en plaintext, enmascarado)
- ✅ Botones Copiar funcionan en cada campo
- ✅ Botón "Copiar Email y Contraseña"

#### Database
```javascript
db.firms.findOne({
  "email": "firma-aprobacion@test.com"
})
```
Verificar:
- ✅ `status: "ACTIVE"`
- ✅ `approval_status: "approved"`
- ✅ `approved_by: ObjectId(...)`
- ✅ `approval_date: ISODate(...)`
- ✅ `owner_id: ObjectId(...)`
- ✅ `trial_status: "active"`
- ✅ `trial_started_at: ISODate(...)`
- ✅ `trial_ends_at: ISODate(...) + 7 días`
- ✅ `subscription_status: "trial"`

```javascript
db.users.findOne({
  "email": "maria-aprobacion@test.com",
  "role": "firm_owner"
})
```
Verificar:
- ✅ Usuario creado
- ✅ `password_hash` presente (hasheada, no plaintext)
- ✅ `status: "ACTIVE"`
- ✅ `is_verified: true`
- ✅ `requires_password_change: true`
- ✅ `firm_id: "xxxxx"`
- ✅ `created_at` es reciente
- ✅ `role: "firm_owner"`

#### Logs Backend
```
[APPROVE_FIRM] firm_id=xxxxx | owner_id=xxxxx | email_sent=true|false | email_trace=xxxxx
```

**Result**: ✅ PASS / ❌ FAIL

---

## TEST CASE 7: Copiar Credenciales

### Objetivo
Validar que se pueden copiar credenciales al clipboard

### Pasos
1. Modal de credenciales abierto
2. Click en botón Copiar (email)
3. Verificar cambio visual
4. Pegar en editor de texto
5. Repetir para contraseña y ambas

### Validaciones

#### Copiar Email
- ✅ Botón cambia a verde
- ✅ Aparece "✓ Copiado"
- ✅ Texto copiado: "maria-aprobacion@test.com"
- ✅ Feedback desaparece después de 2 segundos
- ✅ Botón vuelve a gris

#### Copiar Contraseña
- ✅ Botón cambia a verde
- ✅ Aparece "✓ Copiado"
- ✅ Texto copiado: contraseña correcta (22 chars)
- ✅ Feedback desaparece después de 2 segundos

#### Copiar Ambas
- ✅ Botón cambia a verde
- ✅ Aparece "✓ Ambas Copiadas"
- ✅ Texto copiado en formato: "Email: xxx\nContraseña: xxx"
- ✅ Ambos datos correctos

#### Console
- ✅ Sin errores JavaScript
- ✅ Sin warnings de seguridad

**Result**: ✅ PASS / ❌ FAIL

---

## TEST CASE 8: Login Firm Owner

### Objetivo
Validar que firm owner puede iniciar sesión con credenciales temporales

### Pasos
1. Abrir `/login`
2. Ingresar:
   - Email: "maria-aprobacion@test.com"
   - Contraseña: [temp_password copiada]
3. Click "Iniciar Sesión"

### Validaciones

#### API Request
```bash
POST /api/auth/login
{
  "email": "maria-aprobacion@test.com",
  "password": "xxxxx..."
}

Status: 200
Response: {
  "access_token": "eyJ...",
  "user": {
    "id": "xxxxx",
    "email": "maria-aprobacion@test.com",
    "full_name": "María Aprobada",
    "role": "firm_owner",
    "status": "ACTIVE",
    "is_verified": true,
    "requires_password_change": true,  // ✅ IMPORTANTE
    "firm_id": "xxxxx"
  }
}
```

#### Console
- ✅ Sin errores JavaScript
- ✅ AUTH DEBUG logs muestran login exitoso

#### LocalStorage
- ✅ `pcl_token` se guarda
- ✅ `pcl_user` se guarda con `requires_password_change: true`

#### Frontend - Post Login
- ⚠️ IMPORTANTE: NO debe redirigir a `/firm-os` aún
- ✅ Debe redirigir a `/change-password-required` 

**Result**: ✅ PASS / ❌ FAIL

---

## TEST CASE 9: Cambio Obligatorio de Contraseña

### Objetivo
Validar que firma owner es redirigido a cambio de contraseña y puede cambiarla

### Pasos
1. Después del login (TEST CASE 8), debe estar en `/change-password-required`
2. Llenar formulario:
   - Contraseña Actual: [temp_password copiada]
   - Nueva Contraseña: "NuevaContra123!"
   - Confirmar: "NuevaContra123!"
3. Click "Actualizar Contraseña"

### Validaciones

#### Página Carga
- ✅ Página carga correctamente
- ✅ Título: "Actualizar Contraseña"
- ✅ Mensaje indica cambio obligatorio
- ✅ ⚠️ Advertencia visible
- ✅ Inputs visibles y habilitados

#### Validaciones Forma
- ✅ Botón deshabilitado si campos vacíos
- ✅ Botón deshabilitado si < 8 caracteres
- ✅ Botón deshabilitado si contraseñas no coinciden
- ✅ Error: "Todos los campos son requeridos"
- ✅ Error: "Contraseñas no coinciden"
- ✅ Error: "Mínimo 8 caracteres"

#### API Request
```bash
POST /api/auth/change-password-first-login
Authorization: Bearer {old_token}
{
  "current_password": "xxxxx...",
  "new_password": "NuevaContra123!"
}

Status: 200
Response: {
  "success": true,
  "message": "Contraseña actualizada exitosamente",
  "user": {
    "requires_password_change": false
  }
}
```

#### Database
```javascript
db.users.findOne({
  "email": "maria-aprobacion@test.com"
})
```
Verificar:
- ✅ `password_hash` cambió (nuevo hash)
- ✅ `requires_password_change: false`
- ✅ `updated_at` actualizado
- ✅ Contraseña antigua no funciona

#### Frontend - Post Cambio
- ✅ Modal de éxito aparece
- ✅ Spinner visible
- ✅ Mensaje: "¡Contraseña Actualizada!"
- ✅ Después de 2 segundos: logout automático
- ✅ Redirige a `/login`

#### Logs Backend
```
[CHANGE_PASSWORD] user_id=xxxxx | success=true
```

**Result**: ✅ PASS / ❌ FAIL

---

## TEST CASE 10: Onboarding Firm OS

### Objetivo
Validar que firma owner accede al onboarding de Firm OS

### Pasos
1. Login de nuevo con nueva contraseña
2. Sistema debe redirigir a `/firm-os/onboarding` (o dashboard si no hay onboarding)

### Validaciones

#### Login
- ✅ Email: "maria-aprobacion@test.com"
- ✅ Contraseña: "NuevaContra123!"
- ✅ API devuelve `requires_password_change: false`
- ✅ Redirige a `/firm-os` (NO a cambio de contraseña)

#### Onboarding Page (si existe)
- ✅ Página carga correctamente
- ✅ Interfaz visible
- ✅ Datos de firma pre-llenados (opcional)

**Result**: ✅ PASS / ❌ FAIL

---

## TEST CASE 11: Dashboard Firm OS

### Objetivo
Validar que firma owner puede acceder a Firm OS dashboard

### Pasos
1. Completar onboarding (o skip)
2. Sistema redirige a `/firm-os`
3. Dashboard debe mostrar

### Validaciones

#### Acceso
- ✅ `/firm-os` accesible sin errores 403
- ✅ ProtectedRoute permite acceso (role = firm_owner)
- ✅ No redirige a `/login`

#### Dashboard
- ✅ FirmOSLayout carga correctamente
- ✅ Sidebar visible
- ✅ Header visible
- ✅ Datos de firma presentes

#### AuthContext
- ✅ `user.role == "firm_owner"`
- ✅ `user.firm_id == "xxxxx"`
- ✅ `user.requires_password_change == false`

#### Console
- ✅ Sin errores JavaScript
- ✅ Sin advertencias CORS

**Result**: ✅ PASS / ❌ FAIL

---

## TEST CASE 12: Logout

### Objetivo
Validar que logout funciona correctamente

### Pasos
1. En Firm OS, hacer click en "Cerrar Sesión" (o botón logout)
2. Sistema debe redirigir

### Validaciones

#### Frontend
- ✅ Redirige a `/` o `/login`
- ✅ Sin errores

#### LocalStorage
- ✅ `pcl_token` eliminado
- ✅ `pcl_user` eliminado
- ✅ `token` eliminado (legacy)
- ✅ `user` eliminado (legacy)

#### AuthContext
- ✅ `user == null`
- ✅ `token == null`
- ✅ `isAuthenticated == false`

**Result**: ✅ PASS / ❌ FAIL

---

## TEST CASE 13: Segundo Login

### Objetivo
Validar que se puede hacer login de nuevo después de logout

### Pasos
1. Ir a `/login`
2. Ingresar credenciales (nueva contraseña)
3. Click login

### Validaciones

#### Login
- ✅ Email: "maria-aprobacion@test.com"
- ✅ Contraseña: "NuevaContra123!"
- ✅ Status 200
- ✅ Token recibido
- ✅ User data guardado
- ✅ NO requiere cambio de contraseña (requires_password_change = false)

#### Redirección
- ✅ Redirige a `/firm-os` (NO a cambio de contraseña)

#### Firma Owner Access
- ✅ Puede acceder a Firm OS
- ✅ Dashboard muestra datos
- ✅ Menu completo funcional

**Result**: ✅ PASS / ❌ FAIL

---

## TEST CASE 14: RBAC - Solo Admin Accede a Admin OS

### Objetivo
Validar que solo admins pueden acceder a `/admin/firms-solicitudes`

### Pasos
1. Logout firma owner
2. Ir a `/admin/firms-solicitudes` como firma owner (sin logout)
3. O intentar sin autenticación

### Validaciones

#### Acceso No Autenticado
- ✅ Redirige a `/login` (ProtectedRoute)
- ✅ HTTP 401 en API calls

#### Acceso Firma Owner
- ✅ HTTP 403 en `/api/firms/stats/summary`
- ✅ HTTP 403 en `/api/firms/status/pending`
- ✅ Error message: "Solo administradores pueden..."

#### Acceso Admin
- ✅ Admin puede acceder sin problemas
- ✅ Datos cargan correctamente

**Result**: ✅ PASS / ❌ FAIL

---

## Final Checklist

### Todos los Test Cases Ejecutados
- [ ] TEST CASE 1: Landing → Registro
- [ ] TEST CASE 2: Solicitud Creada en BD
- [ ] TEST CASE 3: Admin OS - Visualizar
- [ ] TEST CASE 4: Ver Detalle
- [ ] TEST CASE 5: Rechazar
- [ ] TEST CASE 6: Aprobar
- [ ] TEST CASE 7: Copiar Credenciales
- [ ] TEST CASE 8: Login Firm Owner
- [ ] TEST CASE 9: Cambio Obligatorio de Contraseña
- [ ] TEST CASE 10: Onboarding Firm OS
- [ ] TEST CASE 11: Dashboard Firm OS
- [ ] TEST CASE 12: Logout
- [ ] TEST CASE 13: Segundo Login
- [ ] TEST CASE 14: RBAC - Solo Admin

### Validaciones Transversales

#### Network (DevTools → Network)
- [ ] Todos los requests HTTP/200 (excepto intentos fallidos esperados)
- [ ] Ningún request HTTP/500
- [ ] CORS headers correctos
- [ ] JWT tokens válidos
- [ ] Content-Type correcto

#### Console (DevTools → Console)
- [ ] Sin errores JavaScript (solo warnings aceptables)
- [ ] Sin errores de CORS
- [ ] Sin XSS warnings
- [ ] AUTH DEBUG logs presentes

#### LocalStorage
- [ ] pcl_token presente cuando autenticado
- [ ] pcl_user presente cuando autenticado
- [ ] Campos correctos guardados
- [ ] Sin sensibl data en plaintext

#### SessionStorage
- [ ] Si se usa, contiene datos transitorios
- [ ] Se limpia en logout

#### JWT Tokens
- [ ] Token válido después de login
- [ ] Token contiene claims correctos (email, role)
- [ ] Token actualizado después de cambio de contraseña
- [ ] Token expirado redirige a login

#### Database
- [ ] Firmas creadas con estado correcto
- [ ] Usuarios creados con roles correctos
- [ ] Passwords hasheadas (no plaintext)
- [ ] Timestamps correctos (created_at, updated_at)
- [ ] Auditoría registrada (approved_by, rejected_by)

### Problemas Encontrados
```
Problema | Severidad | Solución | Estado
---------|-----------|----------|-------
[...]    | [....]    | [...]    | [...]
```

---

## Sign-Off

- **Tester**: _____________
- **Date**: _____________
- **Overall Status**: ✅ ALL PASS / ⚠️ SOME FAILURES / ❌ CRITICAL FAILURES
- **Approval**: _____________

---

## Next Actions

### If All Tests Pass ✅
1. [ ] Commit changes
2. [ ] Push to origin
3. [ ] Deploy to staging
4. [ ] Deploy to production

### If Tests Fail ❌
1. [ ] Document all failures
2. [ ] Identify root causes
3. [ ] Create tickets/issues
4. [ ] Fix in code
5. [ ] Re-run failing tests

---

**Testing Duration**: _____ hours  
**Tests Passed**: _____ / 14  
**Tests Failed**: _____ / 14  
**Success Rate**: _____%
