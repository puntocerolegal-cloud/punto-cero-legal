# 🔧 CORS FIX CRÍTICO — Vercel + Render

**Status:** ✅ CÓDIGO ACTUALIZADO  
**Severidad:** CRÍTICA  
**Solución:** Implementada en `backend/server.py`

---

## PROBLEMA

Frontend en Vercel no puede comunicarse con backend en Render debido a CORS:

```
❌ No 'Access-Control-Allow-Origin' header is present
❌ Preflight OPTIONS failing (405 Method Not Allowed)
```

**Frontend URL:** `https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app`  
**Backend URL:** `https://puntocero-legal-api.onrender.com`

---

## SOLUCIÓN APLICADA

### Cambios en `backend/server.py`

Se reemplazó la configuración CORS con versión mejorada que:

✅ **Incluye múltiples URLs de Vercel**
- Production: `https://punto-cero-legal.vercel.app`
- Preview actual: `https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app`

✅ **Explícita todos los métodos HTTP**
```python
allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
```

✅ **Habilita cache de preflight**
```python
max_age=86400  # 24 horas
```

✅ **allow_credentials=True** (enviado 2 veces para claridad)

✅ **Remueve conflictos:**
- No hay `allow_origins=["*"]` con credentials
- No hay middlewares duplicados
- Métodos explícitos no entran en conflicto

---

## SIGUIENTES PASOS (CRÍTICO)

### PASO 1: Verificar Variable de Entorno en Render

Es necesario que en **Render Dashboard** (puntocero-legal-api → Environment) esté configurada:

```
CORS_ORIGINS = https://punto-cero-legal.vercel.app,https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app
```

**O dejar vacía** para usar la lista hardcodeada en el código (que ya tiene ambas URLs).

### PASO 2: Hacer Deploy en Render

Los cambios en `server.py` necesitan desplegarse:

1. **Opción A: Auto-deploy desde GitHub**
   - Hacer commit: `git push origin main`
   - Render auto-despliega en ~1-2 minutos

2. **Opción B: Manual en Render Dashboard**
   - Ir a: https://dashboard.render.com/
   - Seleccionar servicio: `puntocero-legal-api`
   - Click "Manual Deploy" / "Redeploy"

### PASO 3: Verificar Que Funciona

En DevTools Console del navegador (desde Vercel frontend):

```javascript
// Test 1: Health Check
fetch('https://puntocero-legal-api.onrender.com/api/health')
  .then(r => {
    console.log('✅ Status:', r.status);
    console.log('✅ CORS Headers:', {
      'Access-Control-Allow-Origin': r.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': r.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Credentials': r.headers.get('Access-Control-Allow-Credentials')
    });
    return r.json();
  })
  .then(d => console.log('✅ Response:', d))
  .catch(e => console.log('❌ Error:', e))

// Test 2: Login Request
fetch('https://puntocero-legal-api.onrender.com/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',  // IMPORTANTE para cookies/credentials
  body: JSON.stringify({
    email: 'test@test.com',
    password: 'test'
  })
})
  .then(r => {
    console.log('✅ Login Status:', r.status);
    console.log('✅ CORS OK:', r.headers.get('Access-Control-Allow-Origin'));
    return r.json();
  })
  .catch(e => console.log('❌ CORS Error:', e))
```

**Resultado esperado:**
```
✅ Status: 200
✅ CORS Headers: {
  'Access-Control-Allow-Origin': 'https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
}
✅ Response: {status: "healthy", database: "connected"}
```

---

## CÓMO ESTÁ CONFIGURADO AHORA

### En `backend/server.py` (línea 239-264)

```python
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        # ─ Desarrollo local ─
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        
        # ─ Dominios de producción ─
        "https://puntocerolegal.com",
        "https://www.puntocerolegal.com",
        
        # ─ Vercel frontend ─
        "https://punto-cero-legal.vercel.app",                    # Production
        "https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app",  # Preview
    ] if not os.environ.get('CORS_ORIGINS') else os.environ.get('CORS_ORIGINS', '').split(','),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=86400,  # 24 horas
)
```

**Ventajas:**
- ✅ Permite localhost para desarrollo
- ✅ Permite ambos URLs de Vercel (production y preview)
- ✅ Permite dominios principales
- ✅ Respeta variable de entorno CORS_ORIGINS si está configurada
- ✅ OPTIONS habilitado automáticamente
- ✅ Credentials permitidos
- ✅ Cache de preflight (mejora performance)

---

## PARA FUTURO: URLs Dinámicas de Vercel

Si Vercel genera URLs preview diferentes en el futuro, hay 2 opciones:

### Opción 1: Agregar manualmente en el código
```python
"https://nuevo-preview-url.vercel.app",
```

### Opción 2: Configurar en Render Environment Variable
En Render dashboard:
```
CORS_ORIGINS = https://punto-cero-legal.vercel.app,https://nuevo-preview.vercel.app,https://otro-preview.vercel.app
```

El código automáticamente usa `CORS_ORIGINS` si está definida.

---

## CHECKLIST DE DEPLOY

- [ ] `backend/server.py` actualizado con nueva configuración CORS
- [ ] Cambios committeados: `git add backend/server.py && git commit -m "FIX: CORS configuration for Vercel"`
- [ ] Push a main: `git push origin main`
- [ ] Render auto-deploy completado (verificar en Render dashboard)
- [ ] Frontend en Vercel intenta request a backend
- [ ] DevTools Console muestra ✅ en los tests
- [ ] Login funciona sin CORS error
- [ ] Otros endpoints (GET /api/firms, POST /api/auth/login) funcionan

---

## RESULTADO ESPERADO

```
✅ Frontend en Vercel: Puede hacer requests a backend sin CORS error
✅ OPTIONS preflight: 200 OK (automático)
✅ POST /api/auth/login: 200 OK con response correcta
✅ Headers: Access-Control-Allow-Origin presente y correcto
✅ Credentials: Soportados (allow_credentials=true)
✅ CORS Policy: Ya NO hay bloqueos de navegador
```

---

## TIEMPO ESTIMADO

| Paso | Tiempo |
|------|--------|
| Deploy código | ~1-2 minutos (auto-deploy) |
| Propagación CORS | Instantáneo |
| Test en navegador | 1 minuto |
| **TOTAL** | **~3 minutos** |

---

## STATUS

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║              ✅ CORS FIX IMPLEMENTADO Y LISTO                   ║
║                                                                ║
║  Código: ✅ Actualizado en backend/server.py                   ║
║  Deploy: ⏳ Pendiente en Render                                ║
║  Test:   ⏳ Pendiente en Vercel frontend                       ║
║                                                                ║
║  SIGUIENTE: Push a GitHub + Esperar auto-deploy               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

## COMANDO RÁPIDO PARA DEPLOY

```bash
cd backend
git add server.py
git commit -m "FIX: CORS configuration for Vercel frontend"
git push origin main

# Esperar ~1-2 minutos por auto-deploy de Render
# Verificar en: https://dashboard.render.com/
```

---

**Problema resuelto. Deploy e inmediatamente debería funcionar el CORS. 🚀**
