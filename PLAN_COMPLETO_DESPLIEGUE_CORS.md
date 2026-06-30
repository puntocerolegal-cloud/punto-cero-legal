# PLAN COMPLETO: Despliegue de Solución CORS en Render

## Estado Actual
✅ **Código actualizado**: `backend/server.py` tiene la configuración CORS correcta
❌ **Pendiente**: Redepliegue en Render para que los cambios tomen efecto

---

## PASO 1: Confirmar cambios en Git (LOCAL)

### Verificar estado de cambios
```bash
cd proyecto/
git status
```

**Deberías ver:**
- `backend/server.py` como modificado

### Revisar los cambios específicos
```bash
git diff backend/server.py | grep -A 20 "allow_origins"
```

**Deberías ver:**
- Las URLs de Vercel (producción y preview)
- Métodos explícitos incluyendo OPTIONS
- `max_age=86400`

---

## PASO 2: Hacer commit de cambios (si no está hecho)

```bash
git add backend/server.py
git commit -m "fix: Actualizar CORS middleware para soportar Vercel preview y producción

- Agregar URLs de Vercel (producción y preview)
- Métodos explícitos: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Cache preflight: 24 horas (max_age=86400)
- Soportar env var CORS_ORIGINS para flexibilidad en producción"
```

---

## PASO 3: Empujar cambios a GitHub (CRITICAL)

```bash
git push origin main
```

**Expected output:**
```
To github.com:puntocerolegal/punto-cero-legal.git
   abc1234..def5678  main -> main
```

⚠️ **IMPORTANTE**: Sin este push, Render no verá los cambios

---

## PASO 4: Redeplegar en Render

### Opción A: Redepliegue Automático (Recomendado)
Render debería detectar automáticamente el push a `main` y redeplegar en 1-2 minutos.

**Pasos:**
1. Ir a: https://dashboard.render.com
2. Seleccionar servicio: `puntocero-legal-api`
3. Esperar a que aparezca en el historial de depliegues
4. El estado debe cambiar a "Live" (verde) en 1-2 minutos

### Opción B: Redepliegue Manual (Si automático no funciona)
1. En el dashboard de Render
2. En el servicio `puntocero-legal-api`
3. Ir a "Manual Deploy"
4. Click en "Deploy latest commit"
5. Esperar status verde

### Monitorear redepliegue
```
Estado esperado: ✅ Live
Tiempo típico: 1-2 minutos
```

En el Render dashboard puedes ver:
- Logs en vivo
- Status del deploy
- Última actualización

---

## PASO 5: Validar Backend Conectividad (POST-DEPLOY)

### Test 1: Endpoint Health Check
```bash
curl -i https://puntocero-legal-api.onrender.com/api/health
```

**Esperado:**
```
HTTP/1.1 200 OK
{
  "status": "healthy",
  "database": "connected"
}
```

### Test 2: CORS Preflight (OPTIONS)
```bash
curl -i -X OPTIONS https://puntocero-legal-api.onrender.com/api/auth/login \
  -H "Origin: https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

**Esperado:**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: *
Access-Control-Max-Age: 86400
```

### Test 3: Login Real (POST)
```bash
curl -i -X POST https://puntocero-legal-api.onrender.com/api/auth/login \
  -H "Origin: https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@puntocerolegal.com", "password": "AdminPassword123!"}'
```

**Esperado:**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app
{
  "access_token": "eyJ0eXAiOi...",
  "token_type": "bearer",
  "user": {...}
}
```

---

## PASO 6: Validar en Navegador (Vercel Frontend)

### Test en Browser DevTools

1. Abrir frontend en Vercel:
   ```
   https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app
   ```

2. Abrir **DevTools** (F12 / Cmd+Opt+I)

3. Ir a **Console** y esperar cualquier error CORS

4. Ir a **Network** tab

5. Intentar **Login** con credenciales:
   - Email: `admin@puntocerolegal.com`
   - Password: `AdminPassword123!`

### Verificar en Network Tab
- Request a `/api/auth/login` debe ser **200 OK**
- **Response Headers** deben incluir:
  ```
  Access-Control-Allow-Origin: https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app
  ```
- **No debe haber error de CORS** en Console

### Resultado esperado
✅ Login exitoso
✅ Redirección a dashboard (según rol)
✅ Sin errores de CORS en console

---

## PASO 7: Validar Endpoints Adicionales (Opcional pero recomendado)

```bash
# Test: GET /api/payment/catalog
curl -i https://puntocero-legal-api.onrender.com/api/payment/catalog \
  -H "Origin: https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app"

# Test: GET /api/firms/status/pending (requiere auth)
curl -i https://puntocero-legal-api.onrender.com/api/firms/status/pending \
  -H "Origin: https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

## RESUMEN CHECKLIST

- [ ] **PASO 1**: `git status` muestra `backend/server.py` modificado
- [ ] **PASO 2**: Commit realizado con mensaje claro
- [ ] **PASO 3**: `git push origin main` exitoso
- [ ] **PASO 4**: Render redepliego completado (status "Live")
- [ ] **PASO 5.1**: `/api/health` retorna 200 + database connected
- [ ] **PASO 5.2**: `OPTIONS /api/auth/login` retorna headers CORS correctos
- [ ] **PASO 5.3**: `POST /api/auth/login` retorna 200 + token
- [ ] **PASO 6**: Frontend Vercel carga, login funciona sin errores CORS
- [ ] **PASO 7** (Opcional): Endpoints adicionales responden con CORS headers

---

## Tiempo estimado
- Git: 2 minutos
- Render redepliegue: 2-3 minutos
- Validación: 3-5 minutos
- **TOTAL: 7-10 minutos**

---

## Troubleshooting

### Si redepliegue falla en Render
**Síntomas**: Status "Failed" en dashboard
**Solución**:
1. Revisar logs: Dashboard → puntocero-legal-api → Logs
2. Buscar mensajes de error
3. Si hay error de importación: verificar `requirements.txt` está actualizado
4. Hacer redepliegue manual

### Si CORS aún falla después de redepliegue
**Síntomas**: Error "No 'Access-Control-Allow-Origin' header"
**Posibles causas**:
1. Render aún está cacheando versión vieja (espera 5 min más)
2. URL de Vercel cambió → agregar a allowlist
3. Middleware CORS no se reinició → verificar logs en Render

**Solución**:
```bash
# Forzar redepliegue desde CLI (si disponible)
# O manualmente en dashboard:
1. En Render dashboard
2. Clear build cache
3. Deploy latest commit
```

### Si CORS funciona localmente pero no en producción
**Verificar**:
- Vercel frontend está en la URL correcta
- Render está sirviendo desde `https://puntocero-legal-api.onrender.com`
- Env var `CORS_ORIGINS` no está definida (debe estar en blanco en Render)

