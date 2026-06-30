# PLAN DE VALIDACIÓN E2E - FIRM OS

## Objetivo
Comprobar que una firma creada puede operar completamente en Firm OS sin errores.

## Fases de Validación

### FASE 1: Creación de Firma
- [ ] Crear firma desde Admin OS (Directorio de Firmas)
- [ ] Verificar que se crea firma en DB
- [ ] Verificar que se crea usuario firm_owner
- [ ] Verificar que se envía email de activación

### FASE 2: Activación de Cuenta
- [ ] Hacer click en link de email
- [ ] Abrir página /activate-firm
- [ ] Asignar contraseña
- [ ] Verificar que contraseña se guarda en DB

### FASE 3: Login como Firm Owner
- [ ] Ir a /login
- [ ] Ingresar email + password de firm_owner
- [ ] Verificar que login es exitoso
- [ ] Verificar que se redirige a /firm-os

### FASE 4: Dashboard de Firma
- [ ] Verificar que carga FirmOSLayout
- [ ] Verificar que sidebar muestra módulos
- [ ] Verificar que no hay errores de consola
- [ ] Verificar que no hay errores de red

### FASE 5: Módulos Principales
Comprobar que cargan sin errores:
- [ ] Dashboard (/)
  - [ ] GET /api/firms/{id}/lawyers ✅
  - [ ] GET /api/firms/{id}/cases ✅
  - [ ] GET /api/firms/{id}/clients ✅
  - [ ] GET /api/firms/{id}/financial ✅
  
- [ ] Abogados (/lawyers)
  - [ ] Lista de abogados se carga
  - [ ] GET /api/firms/{id}/lawyers ✅
  
- [ ] Equipo (/team)
  - [ ] GET /api/rbac/team/{id} ✅
  - [ ] Datos de equipo se muestran
  
- [ ] Casos (/cases)
  - [ ] GET /api/firms/{id}/cases ✅
  - [ ] Lista de casos se carga
  
- [ ] Finanzas (/finance)
  - [ ] GET /api/firms/{id}/financial ✅
  - [ ] Datos financieros se muestran
  
- [ ] Configuración (/settings)
  - [ ] Datos de firma se cargan
  - [ ] Formulario es editable

### FASE 6: Sesión Persistente
- [ ] Recargar página (/firm-os)
- [ ] Verificar que sesión se mantiene
- [ ] Verificar que datos en localStorage están sincronizados
- [ ] Verificar que no hay redirección a /login

### FASE 7: Logout
- [ ] Click en botón logout
- [ ] Verificar que sesión se limpia
- [ ] Verificar que redirige a /login
- [ ] Verificar que localStorage se limpia

### FASE 8: Consola del Navegador
- [ ] ❌ No debe haber errores (rojo)
- [ ] ❌ No debe haber advertencias críticas (naranja)
- [ ] ✅ Puede haber warnings deprecados (amarillo)
- [ ] ✅ Puede haber logs informativos (gris)

### FASE 9: Red (DevTools - Network)
- [ ] ❌ No debe haber errores 500
- [ ] ❌ No debe haber errores 403 (permisos)
- [ ] ❌ No debe haber errores 404 (endpoints faltantes)
- [ ] ✅ Puede haber 422 si falta validación
- [ ] ✅ Todos los GET deben ser 200

### FASE 10: Permisos y RBAC
- [ ] Firm Owner tiene acceso a todos los módulos
- [ ] Firm Owner puede crear/editar/ver datos de firma
- [ ] No hay restricciones injustificadas
- [ ] Roles están configurados correctamente

---

## Criterios de Éxito

✅ **Firm OS está VALIDADO si:**
1. Firma se crea correctamente
2. Usuario firm_owner se activa sin problemas
3. Login funciona
4. Dashboard carga sin errores
5. Todos los módulos cargan datos correctamente
6. No hay errores de consola o red
7. Sesión persiste después de recargar
8. Logout limpia la sesión correctamente
9. Permisos funcionan como se espera

❌ **Firm OS NO está validado si:**
- Hay errores en consola (rojo)
- Hay endpoints que devuelven errores
- Datos no se cargan
- Sesión se pierde al recargar
- Módulos no funcionan

---

## Pruebas de Escenarios

### Escenario 1: Firma Nueva
```
1. Admin crea firma "Abogados del Sur"
2. Email enviado a founder@example.com
3. Click en link de activación
4. Asigna contraseña "Password123!"
5. Login con founder@example.com
6. Accede a /firm-os
7. ✅ Verifica que todo funciona
```

### Escenario 2: Múltiples Módulos
```
1. Logueado como firm_owner
2. Navega a Dashboard (/)
3. Navega a Abogados (/lawyers)
4. Navega a Casos (/cases)
5. Navega a Finanzas (/finance)
6. Navega a Configuración (/settings)
7. ✅ Verifica que cada módulo carga sin errores
```

### Escenario 3: Persistencia de Sesión
```
1. Logueado en /firm-os
2. Abre DevTools (F12)
3. Ve localStorage (pcl_user, pcl_token)
4. Recarga la página (Ctrl+R)
5. ✅ Verifica que sigue logueado
6. ✅ Verifica que localStorage no cambió
```

### Escenario 4: Seguridad
```
1. Logueado como firm_owner (Firma A)
2. Intenta cambiar URL a /firms/FIRMA_B_ID
3. ✅ Verifica que obtiene error 403
4. Logout
5. Intenta acceder a /firm-os sin login
6. ✅ Verifica que redirige a /login
```

---

## Herramientas de Validación

- Chrome DevTools (Console, Network)
- Postman para probar endpoints
- MongoDB Compass para verificar DB
- Render Dashboard para ver logs del backend
- Vercel Dashboard para ver logs del frontend

---

## Reporte Final

Cuando se completen todas las fases, generar reporte con:
- ✅/❌ Estado de cada fase
- Errores encontrados (si hay)
- Módulos funcionando correctamente
- Módulos con problemas (si hay)
- Recomendaciones
- Conclusión: VALIDADO o REQUIERE CORRECCIONES
