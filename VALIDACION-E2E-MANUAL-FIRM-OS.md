# VALIDACIÓN E2E MANUAL DEL FIRM OS
## Demostración de Independencia Operacional

**Objetivo:** Comprobar que una Firma puede utilizar Punto Cero Legal de forma completamente independiente, sin intervención del Administrador Global.

**Evidencia obligatoria:** Capturas, Network, Consola, APIs

---

## FASE 1: REGISTRAR FIRMA DESDE LANDING

### Objetivo
Crear una firma mediante el formulario público, sin intervención de Admin.

### Pasos

1. **Abre `https://puntocerolegal.com`** (o localhost:3000 si estás en desarrollo)

2. **Scroll hasta "Comienza tu prueba gratuita"**
   - Sección: "Programa para Firmas Jurídicas"
   - Bloque: "FirmOSPreviewBlock"

3. **Llena el formulario con datos reales:**
   ```
   Nombre de la firma: [NOMBRE_UNICO] (ej: Abogados Test 2025)
   Nombre completo: [TU_NOMBRE]
   Correo corporativo: [EMAIL_VALIDO] (ej: test-firma@example.com)
   WhatsApp: +57 300 1234567 (o tu número real)
   País: Colombia (o tu país)
   ```

4. **Click en "Iniciar prueba gratuita de 7 días"**

### Verificaciones

#### Validación de Formulario
- [ ] Validación en tiempo real de email
- [ ] Validación de teléfono según país
- [ ] Botón deshabilitado hasta llenar todos campos
- [ ] Mensajes de error claros si falta algo

#### Llamada de Red
**Abre DevTools (F12) → Network**

- [ ] Busca `POST` a `/api/firms/register`
- [ ] Status: **201 Created** ✅
- [ ] Headers Request:
  ```json
  {
    "name": "Abogados Test 2025",
    "nit": "TRIAL-1234567890",
    "email": "test-firma@example.com",
    "phone": "+57 300 1234567",
    "address": "A completar en onboarding",
    "city": "A completar en onboarding",
    "country": "Colombia",
    "plan": "firm_growth",
    "founder_name": "Tu Nombre",
    "founder_email": "test-firma@example.com",
    "founder_phone": "+57 300 1234567",
    "founder_document": "TRIAL-PENDING",
    "founder_bar_number": "TRIAL-PENDING"
  }
  ```
- [ ] Response:
  ```json
  {
    "id": "...",
    "name": "Abogados Test 2025",
    "status": "PENDING_VERIFICATION",
    "trial_status": "active",
    "subscription_status": "trial"
  }
  ```

#### Consola del Navegador
**DevTools → Console**

- [ ] ❌ No debe haber errores rojos
- [ ] ✅ Puede haber logs informativos
- [ ] ❌ No debe haber advertencias críticas

#### Confirmación Visual
- [ ] Aparece mensaje: "¡Firma registrada!"
- [ ] Dice: "Un email de activación ha sido enviado a [EMAIL]"
- [ ] Formulario se limpia después

### Evidencia a Capturar
1. **Captura del formulario lleno**
2. **Captura del mensaje de éxito**
3. **Screenshot de Network → POST /firms/register (Status 201)**
4. **Screenshot de Console (sin errores rojos)**
5. **Email recibido en [EMAIL]** (captura del link de activación)

### Resultado
- ✅ **COMPLETADA:** Si firma se crea, email se envía, y no hay errores
- ❌ **FALLIDA:** Si hay error 500, 422 o errores de consola

---

## FASE 2: ACTIVAR CUENTA MEDIANTE EMAIL

### Objetivo
Activar la cuenta del Firm Owner usando el enlace de email.

### Pasos

1. **Abre el email recibido en [EMAIL]**
   - Remitente: noreply@puntocerolegal.com (o similar)
   - Asunto: "¡Firma registrada!" o similar

2. **Busca el enlace de activación**
   - Texto: "Un especialista se pondrá en contacto..."
   - O busca la URL que contiene `/activate-firm?token=...`

3. **Copia el enlace completo**
   ```
   https://puntocerolegal.com/activate-firm?token=abc123xyz...
   ```

4. **Abre el enlace en navegador**

5. **Página /activate-firm debe mostrar:**
   - [ ] Titulo: "Activar tu Firma"
   - [ ] Campo para crear contraseña
   - [ ] Validaciones de contraseña (mayúscula, número, etc.)
   - [ ] Botón "Activar Cuenta"

6. **Completa la activación:**
   ```
   Contraseña: TestPassword123! (fuerte)
   Confirmar: TestPassword123!
   ```

7. **Click en "Activar Cuenta"**

### Verificaciones

#### Validación de Contraseña
- [ ] Requiere mayúsculas
- [ ] Requiere números
- [ ] Requiere caracteres especiales
- [ ] Mínimo 8 caracteres
- [ ] Validación en tiempo real

#### Llamada de Network
**DevTools → Network**

- [ ] Busca `POST` a `/api/firms/activate-account`
- [ ] Status: **200 OK** ✅
- [ ] Headers Request:
  ```json
  {
    "token": "abc123xyz...",
    "password": "TestPassword123!"
  }
  ```
- [ ] Response:
  ```json
  {
    "success": true,
    "message": "Cuenta activada exitosamente.",
    "email": "test-firma@example.com"
  }
  ```

#### Redirección
- [ ] Automáticamente redirige a `/login`
- [ ] Mensaje: "Cuenta activada. Inicia sesión para continuar."

#### Consola
- [ ] ❌ No debe haber errores rojos
- [ ] ✅ Puede haber logs de redirección

### Base de Datos (Verificación Optional)
Si tienes acceso a MongoDB:
```javascript
// Buscar usuario
db.users.findOne({ email: "test-firma@example.com" })

// Debe mostrar:
{
  _id: ObjectId("..."),
  email: "test-firma@example.com",
  role: "firm_owner",
  status: "ACTIVE",
  is_verified: true,
  password_hash: "$2b$12..." (hasheada, no en texto plano)
}
```

### Evidencia a Capturar
1. **Captura del email recibido con link**
2. **Captura de la página /activate-firm**
3. **Captura del formulario de contraseña lleno**
4. **Screenshot de Network → POST /activate-account (Status 200)**
5. **Captura de la redirección a /login**

### Resultado
- ✅ **COMPLETADA:** Si contraseña se activa, redirige a /login, sin errores
- ❌ **FALLIDA:** Si falla la activación o no redirige a /login

---

## FASE 3: LOGIN COMO FIRM OWNER

### Objetivo
Verificar que el Firm Owner puede iniciar sesión y obtener JWT válido.

### Pasos

1. **Abre `/login`** (ya deberías estar aquí tras activación)

2. **Ingresa credenciales:**
   ```
   Email: test-firma@example.com
   Contraseña: TestPassword123!
   ```

3. **Click en "Iniciar Sesión"**

4. **Espera a que procese**

### Verificaciones

#### Llamada de Network
**DevTools → Network**

- [ ] Busca `POST` a `/api/auth/login`
- [ ] Status: **200 OK** ✅
- [ ] Headers Request:
  ```json
  {
    "email": "test-firma@example.com",
    "password": "TestPassword123!"
  }
  ```
- [ ] Response:
  ```json
  {
    "access_token": "eyJhbGc...",
    "token_type": "bearer",
    "user": {
      "id": "...",
      "email": "test-firma@example.com",
      "full_name": "Tu Nombre",
      "role": "firm_owner",
      "firm_id": "...",
      "status": "ACTIVE",
      "is_verified": true
    }
  }
  ```

#### LocalStorage (Verificar sesión)
**DevTools → Application → Local Storage**

- [ ] `pcl_token`: contiene JWT válido
- [ ] `pcl_user`: contiene JSON con usuario
  ```json
  {
    "id": "...",
    "email": "test-firma@example.com",
    "role": "firm_owner",
    "firm_id": "..." // IMPORTANTE: DEBE ESTAR AQUÍ
  }
  ```
- [ ] `token`: copia de `pcl_token` (sincronización)
- [ ] `user`: copia de `pcl_user` (sincronización)

#### JWT Token (Decodificar)
Usa https://jwt.io para decodificar el token:

```javascript
// Header
{
  "alg": "HS256",
  "typ": "JWT"
}

// Payload
{
  "sub": "test-firma@example.com",
  "role": "firm_owner",
  "firm_id": "...",
  "exp": 1719360000, // Expira en 24 horas
  "iat": 1719276000  // Emitido ahora
}
```

#### Redirección
- [ ] Redirige automáticamente a `/firm-os`
- [ ] URL debe ser exactamente: `https://puntocerolegal.com/firm-os`

#### Consola
- [ ] ❌ No debe haber errores rojos
- [ ] ✅ Puede haber logs de login

### Evidencia a Capturar
1. **Captura de la página /login**
2. **Screenshot de Network → POST /auth/login (Status 200)**
3. **Captura de LocalStorage mostrando tokens**
4. **Captura de jwt.io decodificando el token**
5. **Captura de la URL redirección a /firm-os**

### Resultado
- ✅ **COMPLETADA:** Si login es exitoso, JWT válido, redirección correcta
- ❌ **FALLIDA:** Si login falla, token no aparece, o no redirige a /firm-os

---

## FASE 4: INGRESAR AL FIRM OS

### Objetivo
Verificar que el Dashboard del Firm OS carga correctamente.

### Pasos

1. **Deberías estar en `https://puntocerolegal.com/firm-os`**

2. **Espera a que cargue completamente** (2-3 segundos)

3. **Observa la pantalla**

### Verificaciones

#### Elementos Visibles
- [ ] **Sidebar izquierdo** con módulos:
  - Dashboard
  - Abogados
  - Equipo
  - Casos
  - CRM
  - Finanzas
  - Facturación
  - Analytics
  - IA
  - Configuración

- [ ] **Header superior** con:
  - Logo de Punto Cero
  - Nombre de la firma
  - Nombre del usuario logueado
  - Botón de logout

- [ ] **Dashboard principal** mostrando:
  - KPIs (Abogados, Casos, Clientes, Ingresos)
  - Widgets de datos
  - Gráficos (si existen)

#### Red (Network)
**DevTools → Network**

Debe haber varios GET requests:
- [ ] `GET /api/firms/{firm_id}` - Status 200
- [ ] `GET /api/firms/{firm_id}/lawyers` - Status 200
- [ ] `GET /api/firms/{firm_id}/cases` - Status 200
- [ ] `GET /api/firms/{firm_id}/clients` - Status 200
- [ ] `GET /api/firms/{firm_id}/financial` - Status 200

Todos deben ser **200 OK** ✅

#### Consola
**DevTools → Console**

- [ ] ❌ No debe haber errores rojos
- [ ] ✅ Puede haber logs informativos tipo "Auth DEBUG..."
- [ ] ❌ No debe haber advertencias 403 (forbidden)
- [ ] ❌ No debe haber advertencias 404 (not found)

#### Estructura de Respuestas
Verifica cada response en Network:

**GET /api/firms/{firm_id}**
```json
{
  "id": "...",
  "name": "Abogados Test 2025",
  "status": "ACTIVE",
  "trial_status": "active",
  "subscription_status": "trial",
  "plan": "firm_growth"
}
```

**GET /api/firms/{firm_id}/lawyers**
```json
{
  "success": true,
  "data": [],  // Puede estar vacío
  "count": 0
}
```

**GET /api/firms/{firm_id}/cases**
```json
{
  "success": true,
  "data": [],  // Puede estar vacío
  "count": 0
}
```

**GET /api/firms/{firm_id}/financial**
```json
{
  "success": true,
  "data": {
    "firm_id": "...",
    "total_revenue": 0.00,
    "pending_revenue": 0.00,
    "paid_revenue": 0.00
  }
}
```

### Evidencia a Capturar
1. **Captura full de la pantalla /firm-os**
2. **Captura del sidebar mostrando módulos**
3. **Captura del dashboard con widgets**
4. **Screenshot de Network mostrando 5 GET requests con Status 200**
5. **Captura de Console (sin errores rojos)**

### Resultado
- ✅ **COMPLETADA:** Si dashboard carga, módulos visibles, requests exitosos
- ❌ **FALLIDA:** Si hay errores 500/403/404, elementos no cargan, consola tiene errores

---

## FASE 5: VALIDAR CADA MÓDULO

### Objetivo
Verificar que cada módulo del Firm OS funciona sin errores.

### Para cada módulo, registra:

#### 5.1 DASHBOARD (/)

**Acceso:** Click en "Dashboard" en el sidebar (o ya está aquí)

**Verificaciones:**
- [ ] Página carga en menos de 3 segundos
- [ ] Muestra KPIs (Abogados, Casos, Clientes, Ingresos)
- [ ] Network: GET /api/firms/{id}/lawyers → 200
- [ ] Network: GET /api/firms/{id}/cases → 200
- [ ] Network: GET /api/firms/{id}/clients → 200
- [ ] Network: GET /api/firms/{id}/financial → 200
- [ ] Console: ❌ Sin errores rojos
- [ ] Console: ✅ Sin advertencias 403/404

**Captura:**
- Pantalla del dashboard
- Network tab mostrando los 4 requests
- Console limpia

---

#### 5.2 ABOGADOS (/lawyers)

**Acceso:** Click en "Abogados" en el sidebar

**Verificaciones:**
- [ ] Página carga en menos de 2 segundos
- [ ] Muestra tabla vacía (o abogados si existen)
- [ ] Network: GET /api/firms/{id}/lawyers → 200
- [ ] Response contiene array `data: []` o `data: [...]`
- [ ] Console: ❌ Sin errores rojos

**Captura:**
- Pantalla de módulo Abogados
- Network tab con GET /lawyers
- Console

---

#### 5.3 EQUIPO (/team)

**Acceso:** Click en "Equipo" en el sidebar

**Verificaciones:**
- [ ] Página carga
- [ ] Network: GET /api/rbac/team/{firm_id} → 200
- [ ] Muestra usuarios del equipo (o vacío)
- [ ] Console: ❌ Sin errores rojos

**Captura:**
- Pantalla de módulo Equipo
- Network tab
- Console

---

#### 5.4 CASOS (/cases)

**Acceso:** Click en "Casos" en el sidebar

**Verificaciones:**
- [ ] Página carga
- [ ] Network: GET /api/firms/{id}/cases → 200
- [ ] Muestra tabla de casos (o vacío)
- [ ] Console: ❌ Sin errores rojos

**Captura:**
- Pantalla de módulo Casos
- Network tab
- Console

---

#### 5.5 FINANZAS (/finance)

**Acceso:** Click en "Finanzas" en el sidebar

**Verificaciones:**
- [ ] Página carga
- [ ] Network: GET /api/firms/{id}/financial → 200
- [ ] Muestra KPIs financieros (Ingresos, Pagos, Balance)
- [ ] Console: ❌ Sin errores rojos

**Captura:**
- Pantalla de módulo Finanzas
- Network tab
- Console

---

#### 5.6 CONFIGURACIÓN (/settings)

**Acceso:** Click en "Configuración" en el sidebar

**Verificaciones:**
- [ ] Página carga
- [ ] Muestra formulario con datos de la firma
- [ ] Campos editables (nombre, email, teléfono, etc.)
- [ ] Botón "Guardar" presente
- [ ] Console: ❌ Sin errores rojos

**Captura:**
- Pantalla de Configuración
- Formulario visible
- Console

---

### Resumen Modulos Validados

| Módulo | Endpoint | Status | Errores | ✅/❌ |
|--------|----------|--------|---------|-------|
| Dashboard | GET /firms/{id}/lawyers | 200 | No | |
| Abogados | GET /firms/{id}/lawyers | 200 | No | |
| Equipo | GET /rbac/team/{id} | 200 | No | |
| Casos | GET /firms/{id}/cases | 200 | No | |
| Finanzas | GET /firms/{id}/financial | 200 | No | |
| Configuración | - | - | No | |

---

## FASE 6: VALIDAR OPERACIÓN DE LA FIRMA

### Objetivo
Comprobar que la firma puede realizar operaciones básicas sin intervención de Admin.

### Operaciones a Validar

#### 6.1 ACTUALIZAR INFORMACIÓN DE LA FIRMA

**En /settings (Configuración):**

1. **Edita el nombre:**
   ```
   Nombre original: Abogados Test 2025
   Nuevo nombre: Abogados Test 2025 - Actualizado
   ```

2. **Click en "Guardar"**

3. **Verificaciones:**
   - [ ] Network: PUT/PATCH a `/api/firms/{id}` → 200
   - [ ] Mensaje "Guardado exitosamente"
   - [ ] Nombre actualizado en tiempo real
   - [ ] Console: ❌ Sin errores

**Captura:**
- Antes y después del cambio
- Network tab con PUT/PATCH
- Console

#### 6.2 SUBIR LOGO (si existe el formulario)

**En /settings:**

1. **Si hay campo para subir logo:**
   - Selecciona una imagen pequeña (< 1MB)
   - Click en "Subir"

2. **Verificaciones:**
   - [ ] Network: POST a `/api/firms/{id}/logo` → 200
   - [ ] Logo se muestra en la interfaz
   - [ ] Imagen se guarda correctamente

**Captura:**
- Campo de carga
- Network tab
- Logo mostrándose

#### 6.3 ACCEDER A TODOS LOS MÓDULOS SIN RESTRICCIÓN

Navega por cada módulo (sin hacer cambios):
1. Dashboard → ✅ Acceso
2. Abogados → ✅ Acceso
3. Equipo → ✅ Acceso
4. Casos → ✅ Acceso
5. Finanzas → ✅ Acceso
6. Configuración → ✅ Acceso

**Verificaciones:**
- [ ] No hay error 403 (Forbidden) en ningún módulo
- [ ] No hay redirección a /admin
- [ ] No requiere aprobación de Admin para cada acción

**Captura:**
- Navegación por módulos sin errores

---

## FASE 7: VALIDAR AISLAMIENTO

### Objetivo
Confirmar que el Firm OS funciona de forma completamente independiente sin intervención de Admin OS.

### Verificaciones

#### 7.1 DATOS AISLADOS POR firm_id

**Network tab:**

Verifica que TODOS los requests incluyen el firm_id correcto:

- [ ] `GET /api/firms/{firm_id}/lawyers` - firm_id es correcto
- [ ] `GET /api/firms/{firm_id}/cases` - firm_id es correcto
- [ ] `GET /api/firms/{firm_id}/financial` - firm_id es correcto
- [ ] PUT `/api/firms/{firm_id}` - firm_id es correcto

**Expectativa:** Nunca debería permitir acceso a datos de otra firma

#### 7.2 NO REQUIERE INTERVENCIÓN DE ADMIN

**Comprobar que:**
- [ ] No hay botón "Solicitar aprobación de Admin"
- [ ] No hay mensajes "Espera aprobación de administrador"
- [ ] No hay redirección a /admin para ninguna acción
- [ ] Todas las operaciones son inmediatas

#### 7.3 SESSIÓN PERSISTENTE SIN ADMIN

1. **En /firm-os:**
   - Verifica que estás logueado como firm_owner
   - Abre nuevamente la pestaña con /firm-os
   - Recarga la página (Ctrl+R)

2. **Verificaciones:**
   - [ ] Sigue logueado
   - [ ] No redirige a /login
   - [ ] localStorage sigue teniendo tokens válidos
   - [ ] No es necesario login de Admin

**Captura:**
- Antes y después de recargar
- LocalStorage mostrando tokens

#### 7.4 LOGOUT DESDE FIRM OS

1. **Busca botón de logout** (generalmente arriba a la derecha)

2. **Click en Logout**

3. **Verificaciones:**
   - [ ] Redirige a /login
   - [ ] localStorage limpio (sin tokens)
   - [ ] No redirige a Admin OS
   - [ ] Debe poder hacer login nuevamente

**Captura:**
- Botón logout
- Redirección a /login
- LocalStorage limpio

---

## CONCLUSIÓN

### Resultado Final

Marca si TODAS las fases fueron completadas:

- [ ] FASE 1: Registro desde Landing - ✅ COMPLETADA
- [ ] FASE 2: Activación por Email - ✅ COMPLETADA
- [ ] FASE 3: Login como Firm Owner - ✅ COMPLETADA
- [ ] FASE 4: Dashboard Carga Correctamente - ✅ COMPLETADA
- [ ] FASE 5: Módulos Funcionan - ✅ COMPLETADA
- [ ] FASE 6: Operaciones de Firma - ✅ COMPLETADA
- [ ] FASE 7: Aislamiento Verificado - ✅ COMPLETADA

### Veredicto

**Si TODAS las fases están ✅:**
```
✅ FIRM OS VALIDADO COMPLETAMENTE
- Funciona como producto independiente
- No requiere intervención de Admin OS
- Datos aislados correctamente
- Listo para Prioridad 2 (Onboarding)
```

**Si ALGUNA fase está ❌:**
```
❌ FIRM OS REQUIERE CORRECCIONES
- Listar qué fase falló
- Listar errores específicos
- Esperar correcciones
- Revalidar esa fase
```

---

## Archivos a Adjuntar

Cuando reportes resultados, adjunta:
1. Carpeta con capturas de pantalla nombradas por fase
2. Archivo de texto con hallazgos
3. Cualquier error en consola (copiar/pegar)
4. Network responses importantes (copiar/pegar JSON)
