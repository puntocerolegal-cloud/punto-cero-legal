# 📋 INSTRUCCIONES PASO A PASO: Despliegue CORS

## ✅ LO QUE YA ESTÁ HECHO
- ✓ Código CORS actualizado en `backend/server.py`
- ✓ URLs de Vercel (producción y preview) agregadas a allowlist
- ✓ Métodos explícitos: GET, POST, PUT, PATCH, DELETE, OPTIONS
- ✓ Cache preflight configurado: 24 horas

## ❌ LO QUE FALTA
- ❌ Push de cambios a GitHub (`main` branch)
- ❌ Redepliegue en Render
- ❌ Validación de CORS en producción

---

## PASO 1️⃣: EMPUJAR CÓDIGO A GITHUB

### En tu terminal local o ambiente:
```bash
# Navega a la raíz del proyecto
cd /ruta/al/proyecto

# Verifica que backend/server.py está modificado
git status

# Agrega el archivo
git add backend/server.py

# Realiza commit
git commit -m "fix: Actualizar CORS middleware para Vercel preview y producción

- Agregar URLs de Vercel (producción y preview)  
- Métodos explícitos: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Cache preflight: 24 horas (max_age=86400)"

# Empuja a GitHub
git push origin main
```

### ✅ Deberías ver:
```
To github.com:puntocerolegal/punto-cero-legal.git
   abc1234..def5678  main -> main
```

**⏱️ Tiempo: 1 minuto**

---

## PASO 2️⃣: REDEPLEGAR EN RENDER

### Opción A: Automático (RECOMENDADO)
Render detectará automáticamente el push y redepliegará en 1-2 minutos.

1. Ve a: https://dashboard.render.com
2. Selecciona `puntocero-legal-api`
3. Mira en "Deploys" → aparecerá un nuevo deploy
4. Espera a que el status sea **"Live"** (verde)

### Opción B: Manual (Si automático no funciona)
1. Ve a: https://dashboard.render.com
2. Selecciona `puntocero-legal-api`
3. Click en **"Manual Deploy"**
4. Click en **"Deploy latest commit"**
5. Espera a que sea **"Live"**

**⏱️ Tiempo: 2-3 minutos**

### 📊 Monitorear en Render Dashboard:
- Status debe pasar de "Building" → "Live" (verde)
- Puedes ver logs en vivo
- Una vez "Live", los cambios están en producción

---

## PASO 3️⃣: VALIDAR QUE CORS FUNCIONA

### Opción A: Usar el script de validación
```bash
bash test_cors_validacion.sh
```

### Opción B: Validación manual en terminal

**Test 1: Health Check**
```bash
curl https://puntocero-legal-api.onrender.com/api/health
```
Deberías ver: `{"status": "healthy", "database": "connected"}`

**Test 2: CORS Preflight**
```bash
curl -i -X OPTIONS https://puntocero-legal-api.onrender.com/api/auth/login \
  -H "Origin: https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```
Deberías ver en response headers:
```
Access-Control-Allow-Origin: https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

**Test 3: Login Real**
```bash
curl -X POST https://puntocero-legal-api.onrender.com/api/auth/login \
  -H "Origin: https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@puntocerolegal.com", "password": "AdminPassword123!"}'
```
Deberías ver: `{"access_token": "...", "token_type": "bearer", "user": {...}}`

**⏱️ Tiempo: 2-3 minutos**

---

## PASO 4️⃣: VALIDAR EN NAVEGADOR (FRONTEND VERCEL)

### En el navegador:

1. **Abre la URL de frontend**:
   ```
   https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app
   ```

2. **Abre DevTools**: Presiona `F12` (Windows/Linux) o `Cmd + Opt + I` (Mac)

3. **Ve a la pestaña "Console"**:
   - No debe haber errores de CORS
   - Busca mensajes como "No 'Access-Control-Allow-Origin' header"
   - Si ves eso, todavía hay un problema

4. **Ve a la pestaña "Network"**:
   - Filtra por "auth" o "api"

5. **Intenta hacer Login**:
   - Email: `admin@puntocerolegal.com`
   - Password: `AdminPassword123!`
   - Click "Ingresar"

6. **Mira el Network tab**:
   - Busca la request a `/api/auth/login`
   - Status debe ser **200 OK** (no 401, 403, o CORS error)
   - En "Response Headers" debe aparecer:
     ```
     access-control-allow-origin: https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app
     ```

7. **Resultado esperado**:
   - ✅ Login exitoso
   - ✅ Redirección a dashboard (según tu rol)
   - ✅ Sin errores de CORS en Console

**⏱️ Tiempo: 2 minutos**

---

## 📊 RESUMEN CHECKLIST

- [ ] Paso 1: Code pusheado a GitHub (`git push origin main`)
- [ ] Paso 2: Render redepliegue completado (status "Live")
- [ ] Paso 3: Validación de CORS OK (health, preflight, login)
- [ ] Paso 4: Frontend Vercel carga y login funciona sin errores CORS

---

## ⏱️ TIEMPO TOTAL ESTIMADO
- Paso 1 (Push): 1 minuto
- Paso 2 (Redepliegue): 2-3 minutos
- Paso 3 (Validación): 2-3 minutos
- Paso 4 (Frontend): 2 minutos
- **TOTAL: 7-9 minutos**

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### "Aún no veo el deploy en Render"
**Espera 2-3 minutos** después del `git push` — Render automáticamente detecta cambios

### "Redepliegue está en 'Failed'"
1. Ve a dashboard.render.com
2. Abre `puntocero-legal-api`
3. Abre pestaña **"Logs"**
4. Busca mensajes de error (Python, import, etc.)
5. Intenta "Manual Deploy" → "Deploy latest commit"

### "CORS aún no funciona después de redepliegue"
1. **Espera 2-3 minutos más** (a veces Render cachea)
2. **Limpia cache del navegador**: Abre DevTools, click derecho en reload, "Empty cache and hard refresh"
3. **Verifica que Vercel frontend está en la URL correcta**:
   - Debe ser: `https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app`
   - Si cambió, hay que actualizar la allowlist de CORS

### "No puedo hacer push a GitHub"
- Verifica que tienes credenciales guardadas o SSH key configurada
- `git status` debe mostrar los archivos modificados
- Si no, algo interfirió con los cambios

---

## ✨ REFERENCIAS RÁPIDAS

**URLs importantes:**
- Render Dashboard: https://dashboard.render.com
- Vercel Frontend: https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app
- Backend Render: https://puntocero-legal-api.onrender.com

**Credenciales de testing:**
- Email: `admin@puntocerolegal.com`
- Password: `AdminPassword123!`

**Endpoint de login:**
- POST `https://puntocero-legal-api.onrender.com/api/auth/login`
- Content-Type: `application/json`
- Body: `{"email": "...", "password": "..."}`
