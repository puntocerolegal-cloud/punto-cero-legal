# Fase 4: Testing Checklist - Módulo "Solicitudes de Firmas"

**Fecha**: 28 de Junio, 2025  
**Módulo**: Admin OS → Solicitudes de Firmas  
**Ruta**: `/admin/firms-solicitudes`  
**Estado**: Listo para pruebas E2E

---

## Pre-Test Setup

### 1. Verificar Backend Endpoints

Antes de ejecutar pruebas, confirmar que estos endpoints funcionan:

```bash
# Obtener estadísticas
curl -H "Authorization: Bearer {admin_token}" \
  https://api.puntocerolegal.com/api/firms/stats/summary

# Obtener firmas pendientes
curl -H "Authorization: Bearer {admin_token}" \
  https://api.puntocerolegal.com/api/firms/status/pending

# Aprobar firma
curl -X POST -H "Authorization: Bearer {admin_token}" \
  https://api.puntocerolegal.com/api/firms/{firm_id}/approve

# Rechazar firma
curl -X POST -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Información incompleta"}' \
  https://api.puntocerolegal.com/api/firms/{firm_id}/reject
```

### 2. Crear Firmas de Prueba

Crear 3-5 firmas en estado `PENDING_APPROVAL` usando el endpoint de registro:

```bash
curl -X POST https://api.puntocerolegal.com/api/firms/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Firma Test 1",
    "nit": "900123456",
    "email": "contact@firmatest1.com",
    "phone": "+573001234567",
    "address": "Cra 7 #120-50",
    "city": "Bogotá",
    "country": "Colombia",
    "plan": "firm_growth",
    "founder_name": "Juan Pérez",
    "founder_email": "juan@firmatest1.com",
    "founder_phone": "+573001234567",
    "founder_document": "1234567890",
    "founder_bar_number": "12345"
  }'
```

---

## Test Suite

### TEST 1: Carga de Página y Estadísticas

**Objetivo**: Verificar que el módulo carga correctamente y muestra estadísticas exactas

**Pasos**:
1. Navegar a `/admin/firms-solicitudes` como admin
2. Esperar a que cargue completamente
3. Verificar que se muestren las 5 tarjetas de estadísticas

**Validaciones**:
- [ ] No hay errores JavaScript en consola
- [ ] Las tarjetas muestran números correctos:
  - [ ] Pendientes = número de firmas con status "PENDING_APPROVAL"
  - [ ] Aprobadas = número de firmas con status "ACTIVE"
  - [ ] Rechazadas = número de firmas con status "REJECTED"
  - [ ] Total = suma de todas las firmas
  - [ ] Trials Activos = firmas con "trial_status" = "active" Y "status" = "ACTIVE"
- [ ] Las tarjetas tienen colores correctos:
  - [ ] Pendientes: amarillo
  - [ ] Aprobadas: verde
  - [ ] Rechazadas: rojo
  - [ ] Total: azul
  - [ ] Trials Activos: púrpura
- [ ] No hay HTTP 500

**Resultado**: ✅ / ❌

---

### TEST 2: Tabla Principal - Visualización de Datos

**Objetivo**: Verificar que la tabla muestra todas las columnas correctamente

**Pasos**:
1. Permanecer en `/admin/firms-solicitudes`
2. Observar la tabla de firmas pendientes
3. Verificar cada columna

**Validaciones**:
- [ ] Columna "Firma": muestra nombre y NIT
- [ ] Columna "Responsable": muestra owner_name
- [ ] Columna "Email": muestra email corporativo
- [ ] Columna "Teléfono": muestra phone
- [ ] Columna "País": muestra country
- [ ] Columna "Plan": muestra badge con plan correcto
  - [ ] "Crecimiento (5)" para firm_growth
  - [ ] "Enterprise (10)" para firm_enterprise
- [ ] Columna "Fecha": muestra fecha formateada en es-CO
- [ ] Columna "Estado": muestra badge "Pendiente" (amarillo)
- [ ] Columna "Acciones": muestra botón Ver Detalles (ícono ojo)
- [ ] No hay datos truncados o cortados
- [ ] La tabla es responsive en mobile

**Resultado**: ✅ / ❌

---

### TEST 3: Filtros - Búsqueda por Texto

**Objetivo**: Verificar que el filtro de búsqueda funciona correctamente

**Pasos**:
1. En la sección de filtros, escribir el nombre de una firma en "Buscar"
2. Verificar que la tabla se actualiza
3. Limpiar la búsqueda
4. Buscar por email
5. Buscar por NIT
6. Buscar por nombre del responsable

**Validaciones**:
- [ ] Búsqueda por nombre: filtra firmas que contienen el texto (case-insensitive)
- [ ] Búsqueda por email: filtra por email corporativo (case-insensitive)
- [ ] Búsqueda por NIT: filtra por NIT
- [ ] Búsqueda por responsable: filtra por owner_name
- [ ] El contador de filtros se actualiza correctamente
- [ ] Búsqueda vacía muestra todas las firmas

**Resultado**: ✅ / ❌

---

### TEST 4: Filtros - Por Plan

**Objetivo**: Verificar que el filtro de plan funciona correctamente

**Pasos**:
1. Hacer click en el dropdown "Todos los Planes"
2. Seleccionar "Crecimiento (5)"
3. Verificar que solo muestra firmas con ese plan
4. Seleccionar "Enterprise (10)"
5. Seleccionar "Todos los Planes"

**Validaciones**:
- [ ] Filtro por "Crecimiento (5)" muestra solo firmas con plan = "firm_growth"
- [ ] Filtro por "Enterprise (10)" muestra solo firmas con plan = "firm_enterprise"
- [ ] "Todos los Planes" muestra todas las firmas
- [ ] El contador se actualiza correctamente

**Resultado**: ✅ / ❌

---

### TEST 5: Filtros - Por País

**Objetivo**: Verificar que el filtro de país funciona correctamente

**Pasos**:
1. Hacer click en el dropdown "Todos los Países"
2. Seleccionar "Colombia"
3. Verificar que solo muestra firmas de ese país
4. Seleccionar otro país si existe
5. Seleccionar "Todos los Países"

**Validaciones**:
- [ ] El dropdown contiene todos los países únicos de las firmas
- [ ] Seleccionar un país filtra las firmas correctamente
- [ ] "Todos los Países" muestra todas las firmas
- [ ] Los países están en orden alfabético

**Resultado**: ✅ / ❌

---

### TEST 6: Botón Limpiar Filtros

**Objetivo**: Verificar que limpiar filtros resetea todo

**Pasos**:
1. Aplicar múltiples filtros (búsqueda + plan + país)
2. Hacer click en "Limpiar Filtros"
3. Verificar estado de filtros

**Validaciones**:
- [ ] Campo de búsqueda se limpia
- [ ] Plan vuelve a "Todos los Planes"
- [ ] País vuelve a "Todos los Países"
- [ ] La tabla muestra todas las firmas nuevamente

**Resultado**: ✅ / ❌

---

### TEST 7: Modal de Detalles - Lectura (Sin Edición)

**Objetivo**: Verificar que el modal de detalles muestra info correcta en solo-lectura

**Pasos**:
1. Hacer click en "Ver Detalles" de una firma
2. Observar el modal que se abre
3. Intentar editar un campo (no debería ser posible)

**Validaciones**:
- [ ] Modal muestra:
  - [ ] Nombre, NIT, Email, Teléfono, Dirección, Ciudad, País, Plan
  - [ ] Nombre del socio fundador, Email del socio
  - [ ] Fecha de registro, Última actualización
- [ ] Los datos mostrados coinciden con los de la tabla
- [ ] Los campos NO son editables (input readonly o texto plano)
- [ ] Modal es responsive
- [ ] Botón X cierra el modal

**Resultado**: ✅ / ❌

---

### TEST 8: Aprobar Firma - Obtener Credenciales

**Objetivo**: Verificar que la aprobación genera credenciales y las muestra

**Pasos**:
1. Abrir modal de detalles de una firma
2. Hacer click en "APROBAR FIRMA"
3. Esperar a que se procese
4. Verificar que aparece modal de credenciales

**Validaciones**:
- [ ] El botón "APROBAR FIRMA" muestra spinner mientras procesa
- [ ] Aparece modal de credenciales con:
  - [ ] Email (usuario)
  - [ ] Contraseña temporal (22 caracteres, URL-safe)
  - [ ] Nota informativa sobre cambio de contraseña en primer login
- [ ] Los campos de credenciales son readonly
- [ ] No hay errores HTTP 500

**Resultado**: ✅ / ❌

---

### TEST 9: Copiar Credenciales - Email

**Objetivo**: Verificar que el botón de copiar email funciona

**Pasos**:
1. En el modal de credenciales, hacer click en botón Copiar del Email
2. Pegar en un editor de texto
3. Verificar que se copió correctamente

**Validaciones**:
- [ ] El botón cambia de color a verde momentáneamente
- [ ] Aparece texto "✓ Copiado" debajo del campo
- [ ] El email se copia exactamente como se muestra
- [ ] El indicador de copia desaparece después de 2 segundos

**Resultado**: ✅ / ❌

---

### TEST 10: Copiar Credenciales - Contraseña

**Objetivo**: Verificar que el botón de copiar contraseña funciona

**Pasos**:
1. En el modal de credenciales, hacer click en botón Copiar de la Contraseña
2. Pegar en un editor de texto
3. Verificar que se copió correctamente

**Validaciones**:
- [ ] El botón cambia de color a verde momentáneamente
- [ ] Aparece texto "✓ Copiado" debajo del campo
- [ ] La contraseña se copia exactamente como se muestra
- [ ] El indicador de copia desaparece después de 2 segundos

**Resultado**: ✅ / ❌

---

### TEST 11: Copiar Credenciales - Ambas

**Objetivo**: Verificar que el botón de copiar ambas funciona

**Pasos**:
1. En el modal de credenciales, hacer click en "Copiar Email y Contraseña"
2. Pegar en un editor de texto
3. Verificar que se copió correctamente

**Validaciones**:
- [ ] El botón cambia de color a verde momentáneamente
- [ ] Aparece texto "✓ Ambas Copiadas"
- [ ] Se copia en formato: "Email: usuario@email.com\nContraseña: pass123..."
- [ ] Ambos datos están completos y correctos
- [ ] El indicador de copia desaparece después de 2 segundos

**Resultado**: ✅ / ❌

---

### TEST 12: Rechazar Firma - Modal de Rechazo

**Objetivo**: Verificar que el flujo de rechazo funciona correctamente

**Pasos**:
1. Abrir modal de detalles de una firma
2. Hacer click en "RECHAZAR"
3. Aparecerá modal de rechazo
4. Escribir motivo (menos de 5 caracteres primero)
5. Verificar que el botón está deshabilitado
6. Escribir motivo válido (5+ caracteres)
7. Hacer click en "Confirmar Rechazo"

**Validaciones**:
- [ ] Modal de rechazo aparece con:
  - [ ] Advertencia clara sobre la acción
  - [ ] Campo de textarea para motivo
  - [ ] Contador de caracteres (ej: 30 / 500)
  - [ ] Botón "Cancelar"
  - [ ] Botón "Confirmar Rechazo"
- [ ] El botón "Confirmar Rechazo" está deshabilitado si:
  - [ ] El textarea está vacío
  - [ ] El motivo tiene menos de 5 caracteres
- [ ] El botón se habilita cuando el motivo tiene 5+ caracteres
- [ ] El máximo es 500 caracteres
- [ ] Botón "Cancelar" cierra el modal sin cambios

**Resultado**: ✅ / ❌

---

### TEST 13: Rechazar Firma - Procesar Rechazo

**Objetivo**: Verificar que el rechazo se procesa correctamente en backend

**Pasos**:
1. Completar el flujo de rechazo (TEST 12)
2. Hacer click en "Confirmar Rechazo"
3. Esperar a que se procese
4. Verificar que la firma desaparece de la tabla

**Validaciones**:
- [ ] El botón muestra spinner "Rechazando..."
- [ ] No hay error HTTP 500
- [ ] La firma desaparece de la tabla (se recargó la lista)
- [ ] El contador de "Pendientes" disminuye en 1
- [ ] El contador de "Rechazadas" aumenta en 1
- [ ] No hay errores JavaScript en consola

**Resultado**: ✅ / ❌

---

### TEST 14: Estado Vacío - Sin Firmas Pendientes

**Objetivo**: Verificar el estado cuando no hay firmas pendientes

**Pasos**:
1. En una cuenta con todas las firmas ya procesadas (o rechazar todas)
2. Navegar a `/admin/firms-solicitudes`
3. Observar el estado vacío

**Validaciones**:
- [ ] Muestra icono de CheckCircle (verde)
- [ ] Mensaje: "No hay solicitudes pendientes"
- [ ] Submensaje: "Todas las solicitudes han sido procesadas"
- [ ] Las tarjetas de estadísticas aún se muestran correctamente
- [ ] Las estadísticas reflejan "Pendientes: 0"

**Resultado**: ✅ / ❌

---

### TEST 15: Estado Filtrado Vacío

**Objetivo**: Verificar el estado cuando los filtros no devuelven resultados

**Pasos**:
1. Aplicar un filtro que no tenga resultados (ej: plan que no existe)
2. Observar el estado de tabla vacía

**Validaciones**:
- [ ] Muestra icono de AlertCircle
- [ ] Mensaje: "No hay solicitudes que coincidan con los filtros"
- [ ] Submensaje: "Intenta ajustar los criterios de búsqueda"
- [ ] Las estadísticas superiores aún muestran los totales correctos

**Resultado**: ✅ / ❌

---

### TEST 16: RBAC - Acceso No Autorizado

**Objetivo**: Verificar que solo admins pueden acceder

**Pasos**:
1. Abrir sesión como usuario NO-admin (ej: firm_owner)
2. Intentar navegar a `/admin/firms-solicitudes`
3. Intentar hacer requests a los endpoints

**Validaciones**:
- [ ] El acceso es denegado / redirigido a /dashboard
- [ ] Los endpoints retornan HTTP 403
- [ ] El error menciona que solo administradores pueden acceder

**Resultado**: ✅ / ❌

---

### TEST 17: Auditoría - Registro de Aprobación

**Objetivo**: Verificar que se registra la aprobación en logs/BD

**Pasos**:
1. Aprobar una firma desde el módulo
2. Revisar los logs del backend (Render)
3. Verificar registro en BD

**Validaciones**:
- [ ] Log contiene: `[APPROVE_FIRM]`
- [ ] Log incluye: firm_id, owner_id, email_sent, email_trace
- [ ] BD registra: approved_by, approval_date, owner_id
- [ ] El usuario firm_owner fue creado en DB
- [ ] El usuario tiene `requires_password_change: true`

**Resultado**: ✅ / ❌

---

### TEST 18: Auditoría - Registro de Rechazo

**Objetivo**: Verificar que se registra el rechazo en logs/BD

**Pasos**:
1. Rechazar una firma desde el módulo
2. Revisar los logs del backend
3. Verificar registro en BD

**Validaciones**:
- [ ] Log contiene: `[REJECT_FIRM]`
- [ ] Log incluye: firm_id, rejected_by, reason
- [ ] BD registra: status = "REJECTED", rejected_by, rejected_at, rejection_reason
- [ ] El motivo del rechazo está completo y sin truncar

**Resultado**: ✅ / ❌

---

### TEST 19: Performance - Carga con Muchas Firmas

**Objetivo**: Verificar que el módulo funciona bien con 100+ firmas

**Pasos**:
1. Crear 100+ firmas en estado PENDING_APPROVAL
2. Navegar a `/admin/firms-solicitudes`
3. Aplicar filtros múltiples
4. Buscar

**Validaciones**:
- [ ] La página carga en menos de 3 segundos
- [ ] Los filtros responden en menos de 500ms
- [ ] Buscar responde en menos de 500ms
- [ ] No hay lag o freeze en la UI
- [ ] No hay memory leaks (revisar DevTools)
- [ ] Los modales abren rápidamente

**Resultado**: ✅ / ❌

---

### TEST 20: Responsividad - Mobile

**Objetivo**: Verificar que el módulo es responsive en mobile

**Pasos**:
1. Abrir DevTools (F12)
2. Activar modo responsive (tablet 768px, mobile 375px)
3. Navegar a `/admin/firms-solicitudes`
4. Probar todas las características

**Validaciones**:
- [ ] Las tarjetas de estadísticas se apilan en una columna
- [ ] La tabla es scrolleable horizontalmente
- [ ] Los filtros están en una columna
- [ ] Los modales se adaptan al tamaño de pantalla
- [ ] Los botones son clickeables (min 44px)
- [ ] El sidebar se oculta en mobile (hamburger menu)
- [ ] No hay overflow horizontal
- [ ] No hay elementos cortados

**Resultado**: ✅ / ❌

---

## Test Results Summary

| # | Test | Status | Notes |
|---|------|--------|-------|
| 1 | Carga de página y estadísticas | ✅/❌ | |
| 2 | Tabla principal - visualización | ✅/❌ | |
| 3 | Filtros - búsqueda por texto | ✅/❌ | |
| 4 | Filtros - por plan | ✅/❌ | |
| 5 | Filtros - por país | ✅/❌ | |
| 6 | Botón limpiar filtros | ✅/❌ | |
| 7 | Modal detalles - lectura | ✅/❌ | |
| 8 | Aprobar firma - credenciales | ✅/❌ | |
| 9 | Copiar email | ✅/❌ | |
| 10 | Copiar contraseña | ✅/❌ | |
| 11 | Copiar ambas | ✅/❌ | |
| 12 | Modal rechazo | ✅/❌ | |
| 13 | Procesar rechazo | ✅/❌ | |
| 14 | Estado vacío | ✅/❌ | |
| 15 | Estado filtrado vacío | ✅/❌ | |
| 16 | RBAC - no autorizado | ✅/❌ | |
| 17 | Auditoría - aprobación | ✅/❌ | |
| 18 | Auditoría - rechazo | ✅/❌ | |
| 19 | Performance - 100+ firmas | ✅/❌ | |
| 20 | Responsividad - mobile | ✅/❌ | |

**Total Passed**: ___ / 20  
**Total Failed**: ___ / 20  
**Success Rate**: ___ %

---

## Issues Found

### Issue Template

**ID**: PHASE4-ISSUE-001  
**Severity**: High/Medium/Low  
**Component**: [Module/Feature]  
**Description**: [What is broken]  
**Steps to Reproduce**: [How to see it]  
**Expected**: [What should happen]  
**Actual**: [What actually happens]  
**Fix**: [Solution implemented]  
**Status**: [Open/Fixed/Verified]

---

## Sign-Off

- **Tester**: _______________
- **Date**: _______________
- **Overall Status**: ✅ PASS / ❌ FAIL
- **Approval**: _______________

---

## Next Steps After Testing

1. Fix any issues found
2. Re-run failing tests
3. Get approval from team lead
4. Commit changes to backend + frontend
5. Proceed with Phase 5 (Landing Page Update)

---

## Appendix: API Endpoints Used

### 1. Get Statistics
```
GET /api/firms/stats/summary
```

### 2. Get Pending Firms
```
GET /api/firms/status/pending
```

### 3. Approve Firm
```
POST /api/firms/{firm_id}/approve
Returns: credentials with temp_password
```

### 4. Reject Firm
```
POST /api/firms/{firm_id}/reject
Body: { "reason": "string" }
```

---

## Appendix: Sample Test Data

```json
{
  "firm_test_1": {
    "name": "Firma Jurídica ABC",
    "nit": "900123456",
    "email": "contact@abc-firma.com",
    "phone": "+573001234567",
    "country": "Colombia",
    "plan": "firm_growth",
    "owner_name": "Juan Pérez González",
    "owner_email": "juan@abc-firma.com"
  },
  "firm_test_2": {
    "name": "Despacho XYZ Abogados",
    "nit": "900789012",
    "email": "info@xyz-abogados.com",
    "phone": "+573007654321",
    "country": "Colombia",
    "plan": "firm_enterprise",
    "owner_name": "María García López",
    "owner_email": "maria@xyz-abogados.com"
  }
}
```
