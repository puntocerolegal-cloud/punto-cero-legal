# SPRINT F0 - REPORTE DE PRUEBAS
## Punto Cero Legal v1.0 - Sprint F0: Bugs Críticos

**Fecha:** 14 de Julio de 2026  
**Sprint:** F0 - Bugs Críticos  
**Estado:** PLANIFICADO (pendiente ejecución)

---

## RESUMEN EJECUTIVO

### Objetivo

Validar que los 4 bloqueadores críticos de Firm OS han sido reparados correctamente.

### Alcance de Pruebas

**Se probarán:**
1. Corrección de error import email_service
2. Endpoint PUT /api/firms/profile
3. Endpoint PUT /api/firms/settings
4. Servicio de upload avatar

**NO se probarán en Sprint F0:**
- Gestión de equipo (Sprint F1)
- PDF facturas (Sprint F2)
- Integraciones externas (Sprint F3)

---

## FASE 1: PRUEBAS DE EMAIL_SERVICE

### 1.1 Prueba de Importación

**Objetivo:** Verificar que no hay errores de importación

**Pasos:**
1. Iniciar backend
2. Verificar logs de inicio
3. Buscar errores de importación

**Resultado esperado:**
- ✅ No hay errores de importación
- ✅ Servicio carga correctamente

**Comando:**
```bash
cd backend
python -c "from app.services.email_service import send_verification_email; print('OK')"
```

**Criterio de aceptación:**
- ✅ No aparece "No module named 'utils.email_service'"

### 1.2 Prueba de Envío de Email

**Objetivo:** Verificar que los emails se envían correctamente

**Pasos:**
1. Registrar nuevo usuario
2. Verificar que se envía email de verificación
3. Verificar que se envía email de bienvenida

**Resultado esperado:**
- ✅ Email de verificación enviado
- ✅ Email de bienvenida enviado
- ✅ No hay errores en logs

**Criterio de aceptación:**
- ✅ Emails se envían sin errores
- ✅ Contenido del email es correcto

---

## FASE 2: PRUEBAS DE PERFIL DE FIRMA

### 2.1 Prueba de Actualización de Perfil

**Objetivo:** Verificar que el endpoint PUT /api/firms/profile funciona

**Pasos:**
1. Login como Firm Owner
2. Obtener token JWT
3. Ejecutar PUT /api/firms/profile con datos actualizados
4. Verificar respuesta 200
5. Verificar actualización en MongoDB

**Request:**
```bash
curl -X PUT http://localhost:8000/api/firms/profile \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nuevo Nombre de Firma",
    "email": "nuevo@email.com",
    "phone": "+573001234567",
    "address": "Calle 123 # 45-67",
    "city": "Bogotá",
    "country": "Colombia",
    "tax_id": "123456789",
    "website": "https://nuevofirma.com"
  }'
```

**Response esperada:**
```json
{
  "success": true,
  "firm": {
    "_id": "...",
    "name": "Nuevo Nombre de Firma",
    "email": "nuevo@email.com",
    "phone": "+573001234567",
    "address": "Calle 123 # 45-67",
    "city": "Bogotá",
    "country": "Colombia",
    "tax_id": "123456789",
    "website": "https://nuevofirma.com"
  }
}
```

**Criterios de aceptación:**
- ✅ Status code: 200
- ✅ Respuesta contiene datos actualizados
- ✅ MongoDB contiene datos actualizados
- ✅ No hay errores en logs

### 2.2 Prueba de Validación

**Objetivo:** Verificar que las validaciones funcionan

**Pasos:**
1. Intentar actualizar con email inválido
2. Intentar actualizar con campos vacíos
3. Verificar errores 400

**Criterio de aceptación:**
- ✅ Retorna error 400 para datos inválidos
- ✅ Mensaje de error es claro

### 2.3 Prueba de Persistencia

**Objetivo:** Verificar que los datos persisten

**Pasos:**
1. Actualizar perfil
2. Cerrar sesión
3. Volver a login
4. Obtener perfil
5. Verificar datos guardados

**Criterio de aceptación:**
- ✅ Datos persisten después de cerrar sesión
- ✅ Datos se cargan correctamente

---

## FASE 3: PRUEBAS DE CONFIGURACIÓN

### 3.1 Prueba de Actualización de Configuración

**Objetivo:** Verificar que el endpoint PUT /api/firms/settings funciona

**Pasos:**
1. Login como Firm Owner
2. Obtener token JWT
3. Ejecutar PUT /api/firms/settings con configuración actualizada
4. Verificar respuesta 200
5. Verificar actualización en MongoDB

**Request:**
```bash
curl -X PUT http://localhost:8000/api/firms/settings \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "timezone": "America/Bogota",
    "language": "es",
    "currency": "COP",
    "email_notifications": true,
    "push_notifications": false,
    "billing_email": "facturacion@firma.com",
    "auto_invoice": true,
    "two_factor_enabled": false,
    "session_timeout": 3600
  }'
```

**Response esperada:**
```json
{
  "success": true,
  "firm": {
    "_id": "...",
    "settings": {
      "timezone": "America/Bogota",
      "language": "es",
      "currency": "COP",
      "email_notifications": true,
      "push_notifications": false,
      "billing_email": "facturacion@firma.com",
      "auto_invoice": true,
      "two_factor_enabled": false,
      "session_timeout": 3600
    }
  }
}
```

**Criterios de aceptación:**
- ✅ Status code: 200
- ✅ Respuesta contiene configuración actualizada
- ✅ MongoDB contiene configuración actualizada
- ✅ No hay errores en logs

### 3.2 Prueba de Validación

**Objetivo:** Verificar que las validaciones funcionan

**Pasos:**
1. Intentar actualizar con valores inválidos
2. Verificar errores 400

**Criterio de aceptación:**
- ✅ Retorna error 400 para datos inválidos

### 3.3 Prueba de Persistencia

**Objetivo:** Verificar que la configuración persiste

**Pasos:**
1. Actualizar configuración
2. Cerrar sesión
3. Volver a login
4. Obtener configuración
5. Verificar datos guardados

**Criterio de aceptación:**
- ✅ Configuración persiste después de cerrar sesión

---

## FASE 4: PRUEBAS DE UPLOAD AVATAR

### 4.1 Prueba de Upload de Avatar

**Objetivo:** Verificar que el endpoint POST /api/firms/avatar funciona

**Pasos:**
1. Login como Firm Owner
2. Obtener token JWT
3. Seleccionar imagen válida (jpg, png, gif, webp)
4. Ejecutar POST /api/firms/avatar
5. Verificar respuesta 200
6. Verificar archivo en S3
7. Verificar actualización en MongoDB

**Request:**
```bash
curl -X POST http://localhost:8000/api/firms/avatar \
  -H "Authorization: Bearer {token}" \
  -F "file=@avatar.jpg"
```

**Response esperada:**
```json
{
  "success": true,
  "avatar_url": "https://bucket.s3.amazonaws.com/avatars/firm_123_abc12345.jpg"
}
```

**Criterios de aceptación:**
- ✅ Status code: 200
- ✅ Respuesta contiene URL del avatar
- ✅ Archivo existe en S3
- ✅ MongoDB contiene URL del avatar
- ✅ No hay errores en logs

### 4.2 Prueba de Validación de Tipo de Archivo

**Objetivo:** Verificar que solo se aceptan imágenes

**Pasos:**
1. Intentar subir archivo .pdf
2. Intentar subir archivo .doc
3. Intentar subir archivo .txt
4. Verificar errores 400

**Criterio de aceptación:**
- ✅ Retorna error 400 para tipos no permitidos
- ✅ Mensaje de error es claro

### 4.3 Prueba de Validación de Tamaño

**Objetivo:** Verificar que se rechazan archivos > 5MB

**Pasos:**
1. Intentar subir imagen de 6MB
2. Verificar error 400

**Criterio de aceptación:**
- ✅ Retorna error 400 para archivos > 5MB
- ✅ Mensaje de error es claro

### 4.4 Prueba de Reemplazo de Avatar

**Objetivo:** Verificar que se reemplaza el avatar anterior

**Pasos:**
1. Subir avatar_1.jpg
2. Verificar URL en MongoDB
3. Subir avatar_2.jpg
4. Verificar que avatar_1.jpg fue eliminado de S3
5. Verificar que MongoDB tiene URL de avatar_2.jpg

**Criterio de aceptación:**
- ✅ Avatar anterior se elimina de S3
- ✅ MongoDB tiene URL del nuevo avatar
- ✅ No hay avatares huérfanos en S3

### 4.5 Prueba de Renderizado

**Objetivo:** Verificar que el avatar se muestra correctamente

**Pasos:**
1. Subir avatar
2. Ir a perfil en frontend
3. Verificar que avatar se muestra
4. Recargar página
5. Verificar que avatar persiste

**Criterio de aceptación:**
- ✅ Avatar se muestra correctamente
- ✅ Avatar persiste después de recargar

---

## FASE 5: PRUEBAS DE GESTIÓN DE EQUIPO (Sprint F1)

**Nota:** Estas pruebas se ejecutarán en Sprint F1, no en Sprint F0.

---

## FASE 6: PRUEBAS DE INTEGRACIÓN

### 6.1 Prueba de Flujo Completo

**Objetivo:** Verificar que el flujo completo de Firm Owner funciona

**Pasos:**
1. Login como Firm Owner
2. Editar perfil
3. Guardar cambios
4. Subir avatar
5. Guardar configuración
6. Cerrar sesión
7. Volver a login
8. Verificar que todo persiste

**Criterio de aceptación:**
- ✅ Todos los pasos funcionan sin errores
- ✅ Todo persiste correctamente

### 6.2 Prueba de Multi-Usuario

**Objetivo:** Verificar que múltiples usuarios pueden usar el sistema

**Pasos:**
1. Firm Owner edita perfil
2. Abogado login
3. Abogado edita su perfil
4. Verificar que no hay conflictos

**Criterio de aceptación:**
- ✅ No hay conflictos entre usuarios
- ✅ Cada usuario ve sus propios datos

---

## FASE 7: PRUEBAS DE REGRESIÓN

### 7.1 Prueba de No Regresión en APIs Existentes

**Objetivo:** Verificar que no se rompieron APIs existentes

**Pasos:**
1. Probar GET /api/firms/{id}
2. Probar GET /api/firms/settings
3. Probar otros endpoints de firms
4. Verificar que todos funcionan

**Criterio de aceptación:**
- ✅ Todos los endpoints existentes funcionan
- ✅ No hay errores 500

### 7.2 Prueba de No Regresión en Frontend

**Objetivo:** Verificar que el frontend no se rompió

**Pasos:**
1. Cargar Firm OS
2. Navegar por todas las secciones
3. Verificar que no hay errores en consola

**Criterio de aceptación:**
- ✅ No hay errores en consola
- ✅ Todas las secciones cargan correctamente

---

## FASE 8: PRUEBAS DE PERFORMANCE

### 8.1 Prueba de Tiempo de Respuesta

**Objetivo:** Verificar que los endpoints responden en tiempo aceptable

**Métricas:**
- PUT /api/firms/profile: < 500ms
- PUT /api/firms/settings: < 500ms
- POST /api/firms/avatar: < 2000ms

**Criterio de aceptación:**
- ✅ Todos los endpoints responden en tiempo aceptable

### 8.2 Prueba de Carga

**Objetivo:** Verificar que el sistema soporta múltiples requests

**Pasos:**
1. Ejecutar 100 requests simultáneos
2. Verificar que no hay errores
3. Verificar tiempos de respuesta

**Criterio de aceptación:**
- ✅ No hay errores
- ✅ Tiempos de respuesta aceptables

---

## FASE 9: CHECKLIST DE PRUEBAS

### 9.1 Checklist por Funcionalidad

**Email Service:**
- [ ] No hay errores de importación
- [ ] Emails se envían correctamente
- [ ] Contenido de emails es correcto

**Perfil de Firma:**
- [ ] Se puede actualizar nombre
- [ ] Se puede actualizar email
- [ ] Se puede actualizar teléfono
- [ ] Se puede actualizar dirección
- [ ] Se puede actualizar ciudad
- [ ] Se puede actualizar país
- [ ] Se puede actualizar tax_id
- [ ] Se puede actualizar website
- [ ] Validaciones funcionan
- [ ] Persistencia funciona

**Configuración:**
- [ ] Se puede actualizar timezone
- [ ] Se puede actualizar language
- [ ] Se puede actualizar currency
- [ ] Se puede actualizar email_notifications
- [ ] Se puede actualizar push_notifications
- [ ] Se puede actualizar billing_email
- [ ] Se puede actualizar auto_invoice
- [ ] Se puede actualizar two_factor_enabled
- [ ] Se puede actualizar session_timeout
- [ ] Validaciones funcionan
- [ ] Persistencia funciona

**Upload Avatar:**
- [ ] Se puede subir imagen JPG
- [ ] Se puede subir imagen PNG
- [ ] Se puede subir imagen GIF
- [ ] Se puede subir imagen WEBP
- [ ] Se rechazan archivos no imagen
- [ ] Se rechazan archivos > 5MB
- [ ] Avatar se muestra correctamente
- [ ] Avatar anterior se elimina
- [ ] Persistencia funciona

**Integración:**
- [ ] Flujo completo funciona
- [ ] No hay errores en consola
- [ ] No hay errores en logs
- [ ] No hay regresiones

### 9.2 Checklist de Aceptación

**Obligatorio para aprobar Sprint F0:**
- [ ] Email service funciona
- [ ] Perfil se puede editar y guardar
- [ ] Avatar se puede subir y mostrar
- [ ] Configuración se puede guardar
- [ ] No hay errores de importación
- [ ] No hay errores 500
- [ ] No hay regresiones
- [ ] Todo persiste correctamente

---

## FASE 10: CRITERIOS DE APROBACIÓN

### 10.1 Criterios Mínimos

✅ **Sprint F0 se aprueba si:**
- ✅ Email service funciona sin errores
- ✅ Perfil se puede editar y guardar
- ✅ Avatar se puede subir
- ✅ Configuración se puede guardar
- ✅ No hay errores de importación
- ✅ No hay regresiones
- ✅ Todo persiste en MongoDB

### 10.2 Criterios de Rechazo

❌ **Sprint F0 se rechaza si:**
- ❌ Hay errores de importación
- ❌ Endpoints no funcionan
- ❌ No hay persistencia
- ❌ Hay regresiones
- ❌ Hay errores 500

---

## FASE 11: INSTRUCCIONES DE EJECUCIÓN

### 11.1 Preparación

1. Aplicar cambios de código según SPRINT_F0_IMPLEMENTATION_REPORT.md
2. Iniciar backend
3. Iniciar frontend
4. Verificar que no hay errores en logs

### 11.2 Ejecución de Pruebas

1. Ejecutar pruebas automatizadas (si existen)
2. Ejecutar pruebas manuales según este documento
3. Documentar resultados
4. Reportar bugs encontrados

### 11.3 Criterio de Aprobación

- ✅ Todos los criterios de aceptación se cumplen
- ✅ No hay bugs críticos
- ✅ No hay regresiones

---

## CONCLUSIÓN

Este documento define las pruebas que deben ejecutarse para validar Sprint F0.

**Responsable de ejecución:** QA Engineer  
**Fecha de ejecución:** 15-16 de Julio de 2026  
**Duración estimada:** 4 horas

**Próximo paso:** Ejecutar pruebas después de implementar código.

---

**Documento generado:** 14 de Julio de 2026  
**Estado:** PLANIFICADO