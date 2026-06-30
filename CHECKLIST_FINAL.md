# ✅ CHECKLIST FINAL DE EJECUCIÓN

## 📋 PREPARACIÓN (5 minutos)

- [ ] Leíste **GUIA_RAPIDA.txt** (orientación general)
- [ ] Leíste **INSTRUCCIONES_PASOS_A_PASOS.md** (pasos detallados)
- [ ] Tienes terminal abierta en raíz del proyecto
- [ ] Tienes acceso a https://dashboard.render.com
- [ ] Tienes navegador listo para probar Vercel

---

## 🚀 EJECUCIÓN (7-10 minutos)

### ✏️ PASO 1: Verificación (1 minuto)

```bash
git status
```

**Checklist:**
- [ ] Ves `modified: backend/server.py`
- [ ] No hay otros cambios sin commitear que no quieras

**Si no ves los cambios:**
- El archivo ya fue commitado antes
- Ir directo a PASO 4

---

### 📤 PASO 2: Commit y Push (1 minuto)

```bash
git add backend/server.py
git commit -m "fix: Actualizar CORS middleware para soportar Vercel preview y producción

- Agregar URLs de Vercel (producción y preview)
- Métodos explícitos: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Cache preflight: 24 horas (max_age=86400)
- Soportar env var CORS_ORIGINS para flexibilidad en producción"
git push origin main
```

**Checklist:**
- [ ] Commit fue exitoso (ves output con commit hash)
- [ ] Push fue exitoso (ves "To github.com:...")
- [ ] No hay errores de autenticación Git

**Si hay error:**
- Verifica credenciales GitHub
- Intenta: `git remote -v` (debe mostrar GitHub URL)
- Si no, contacta al equipo DevOps

---

### 🔄 PASO 3: Redepliegue Render (2-3 minutos)

1. **Abre Dashboard Render:**
   ```
   https://dashboard.render.com
   ```
   - [ ] Dashboard cargó correctamente
   - [ ] Estás loggeado

2. **Busca el servicio:**
   - [ ] Ves `puntocero-legal-api` en la lista
   - [ ] Click en el servicio

3. **Mira el historial de depliegues:**
   - [ ] En la pestaña "Deploys" (a la derecha)
   - [ ] Deberías ver un nuevo deploy que dice "Building"
   - [ ] [ ] Status es "Building" (naranja) → espera
   - [ ] Status cambió a "Live" (verde) ✅

4. **Si status es "Failed":**
   - Abre pestaña "Logs"
   - Busca mensajes de error
   - Contacta al equipo DevOps

**Tiempo esperado:** 1-3 minutos después del push

---

### ✅ PASO 4: Validación Backend (2-3 minutos)

#### Test 4.1: Health Check

```bash
curl https://puntocero-legal-api.onrender.com/api/health
```

**Esperado:**
```json
{"status": "healthy", "database": "connected"}
```

**Checklist:**
- [ ] Comando ejecutó sin errores
- [ ] Viste JSON con "healthy"
- [ ] Database está "connected"

---

#### Test 4.2: CORS Preflight

```bash
curl -i -X OPTIONS https://puntocero-legal-api.onrender.com/api/auth/login \
  -H "Origin: https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

**Esperado en response headers:**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://punto-cero-legal-me3ma4jnr-...
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: *
Access-Control-Max-Age: 86400
```

**Checklist:**
- [ ] Status es 200 (no 4xx o 5xx)
- [ ] Ves `Access-Control-Allow-Origin` header
- [ ] Incluye el método OPTIONS
- [ ] Incluye max-age 86400

---

#### Test 4.3: Login Real

```bash
curl -X POST https://puntocero-legal-api.onrender.com/api/auth/login \
  -H "Origin: https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@puntocerolegal.com", "password": "AdminPassword123!"}'
```

**Esperado:**
```json
{
  "access_token": "eyJ0eXAi...",
  "token_type": "bearer",
  "user": {
    "id": "...",
    "email": "admin@puntocerolegal.com",
    "role": "admin",
    ...
  }
}
```

**Checklist:**
- [ ] Status es 200 (no 401, 403, o error CORS)
- [ ] Ves `access_token` en response
- [ ] User data está presente
- [ ] Role es `admin` (o correcto)

---

### 🌐 PASO 5: Validación Frontend Vercel (2 minutos)

#### 5.1: Abrir Frontend

1. **Navega a:**
   ```
   https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app
   ```
   - [ ] Frontend cargó (ves página de login)
   - [ ] No ves errores en la pantalla

#### 5.2: Abrir DevTools

- [ ] Presionaste F12 (Windows/Linux) o Cmd+Opt+I (Mac)
- [ ] DevTools abrió correctamente

#### 5.3: Ir a Console

- [ ] Pestaña "Console" abierta
- [ ] Mira cualquier error
- [ ] **NO DEBE HABER ERRORES CORS** (como "No Access-Control-Allow-Origin")
- [ ] [ ] Console está limpia (no hay errores)

#### 5.4: Ir a Network

- [ ] Pestaña "Network" abierta
- [ ] Checkbox "Preserve log" está checkeado (opcional pero útil)

#### 5.5: Intentar Login

1. Email: `admin@puntocerolegal.com`
   - [ ] Campo email lleno
2. Password: `AdminPassword123!`
   - [ ] Campo password lleno
3. Click en "Ingresar"
   - [ ] Button fue clickeado

#### 5.6: Observar Network

- [ ] En Network tab, ves una request a `/api/auth/login`
- [ ] Status de esa request es **200 OK** (no CORS error, no 401, no 403)
- [ ] Click en la request → "Response" tab:
  - [ ] Ves `access_token` en la respuesta
  - [ ] Ves `user` data en la respuesta
- [ ] Click en la request → "Headers" → "Response Headers":
  - [ ] Ves: `access-control-allow-origin: https://punto-cero-legal-me3ma4jnr-...`
  - [ ] Ves: `access-control-allow-credentials: true`

#### 5.7: Resultado Final

Después de login, deberías ver una de:
- [ ] Redirección a `/admin` (si eres admin)
- [ ] Redirección a `/dashboard` (si eres lawyer)
- [ ] Redirección a `/firm-os` (si eres firm_owner)
- [ ] Redirección a `/portal` (si eres client)

**Y MÁS IMPORTANTE:**
- [ ] **CERO errores CORS en Console**
- [ ] **Network tab muestra POST /api/auth/login = 200 OK**
- [ ] **No hay mensajes de "No Access-Control-Allow-Origin header"**

---

## 🎉 ÉXITO FINAL

**Si completaste TODOS los checkboxes arriba:**

```
✅ ✅ ✅ CORS ESTÁ SOLUCIONADO ✅ ✅ ✅
```

**Lo que significa:**
- ✅ Frontend Vercel puede conectarse a Backend Render
- ✅ Login funciona desde producción
- ✅ Preflight OPTIONS funciona correctamente
- ✅ CORS headers están presentes en responses

---

## 🆘 TROUBLESHOOTING

### Si algo no funciona:

**Problema: "No veo nuevo deploy en Render"**
- [ ] Espera 2-3 minutos más después de `git push`
- [ ] Actualiza la página de Render (Ctrl+R)
- [ ] Verifica que push fue exitoso (sin errores)

**Problema: "Render deploy está en 'Failed'"**
- [ ] Abre dashboard.render.com
- [ ] Click en puntocero-legal-api → Logs
- [ ] Busca mensajes de error (busca "Error" en rojo)
- [ ] Lee el error completo
- [ ] Si es Python import error: contacta DevOps
- [ ] Si es otra cosa: intenta "Manual Deploy" → "Deploy latest commit"

**Problema: "CORS aún falla en navegador después de Deploy Live"**
- [ ] Espera 2-3 minutos adicionales (cacheo de Render)
- [ ] Limpia cache del navegador:
  - Windows: Ctrl+Shift+Delete
  - Mac: Cmd+Shift+Delete
- [ ] Hard refresh (no cache):
  - Windows: Ctrl+Shift+R
  - Mac: Cmd+Shift+R
- [ ] Cierra DevTools y abre de nuevo (F12)
- [ ] Intenta login nuevamente

**Problema: "Health check retorna error"**
- [ ] Render deploy aún está en "Building" → espera
- [ ] Verifica URL: `https://puntocero-legal-api.onrender.com/api/health`
- [ ] Si sigue fallando: Render está down, contacta soporte

**Problema: "Preflight OPTIONS retorna 4xx o 5xx"**
- [ ] Verifica que status es 200 (algunos 204 es válido también)
- [ ] Si es 405 Method Not Allowed: OPTIONS no está permitido (recheck código)
- [ ] Si es 500: Error interno de Render, contacta DevOps

**Problema: "Login retorna 401 Unauthorized"**
- [ ] Credenciales pueden estar mal
- [ ] Intenta con: `admin@puntocerolegal.com` / `AdminPassword123!`
- [ ] Si sigue sin funcionar: base de datos puede estar vacía, contacta DevOps

**Problema: "No puedo hacer git push"**
- [ ] Verifica: `git status` (debe mostrar cambios)
- [ ] Si no muestra nada: cambios fueron commitados antes
- [ ] Verifica autenticación: `git remote -v` (debe mostrar GitHub URL)
- [ ] Intenta push nuevamente: `git push origin main`

---

## 📞 CONTACTOS

Si nada funciona después de intentar troubleshooting:
- Contacta al equipo DevOps
- Proporciona:
  - [ ] Output completo del error
  - [ ] Screenshot de DevTools
  - [ ] Log de Render (desde dashboard)
  - [ ] URL exacta que estabas usando

---

## ✨ NEXT STEPS DESPUÉS DE ÉXITO

Una vez que CORS está funcionando:

1. [ ] Documenta que CORS fue solucionado
2. [ ] Comunica a stakeholders que login funciona
3. [ ] Prueba otros endpoints (GET /api/payment/catalog, etc.)
4. [ ] Considera agregar monitoreo CORS en producción
5. [ ] Revisa logs de Render regularmente

---

**Creado:** Solución CORS Vercel/Render Completa
**Versión:** 1.0
**Estado:** Lista para ejecutar
