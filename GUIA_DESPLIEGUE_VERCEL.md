# 🚀 GUÍA DE DESPLIEGUE AUTOMÁTICO — VERCEL FRONTEND

**Proyecto:** Punto Cero Legal  
**Fecha:** 27 de Junio de 2026  
**Objetivo:** Despliegue sin intervención manual usando Vercel + GitHub

---

## RESUMEN EJECUTIVO

```
Estado Actual: ✅ LISTO PARA DESPLIEGUE
├─ package.json: Configurado ✅
├─ vercel.json: Configurado ✅
├─ .env.example: Disponible ✅
├─ Build script: npm run build ✅
└─ SPA routing: Habilitado ✅

Próximo paso: Conectar repositorio a Vercel
```

---

## PASO 1: VERIFICACIÓN DE CONFIGURACIÓN

### ✅ Package.json

```json
{
  "scripts": {
    "start": "craco start",
    "build": "craco build",
    "test": "craco test"
  }
}
```

**Status:** ✅ Build script disponible
**Build Tool:** Craco + Create React App
**Output Dir:** `build/`

### ✅ Vercel.json

```json
{
  "framework": "create-react-app",
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "installCommand": "npm install",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Status:** ✅ Configurado correctamente
**Punto importante:** `rewrites` asegura que todas las rutas vuelvan a `/index.html` (SPA)

### ✅ Environment Variables

**En Vercel Dashboard:**
```
REACT_APP_BACKEND_URL = https://puntocero-legal-api.onrender.com
```

**Status:** ✅ Listo para configurar

---

## PASO 2: PREPARACIÓN DEL REPOSITORIO GIT

### A. VERIFICAR SI EXISTE REPOSITORIO GIT

```bash
cd punto-cero-legal
git status
```

**Si YES (repo existe):**
```bash
git branch -a
# Debe mostrar: main, develop, etc.
```

→ **Ir a PASO 3**

**Si NO (no existe repo):**

### B. INICIALIZAR REPOSITORIO GIT

```bash
cd punto-cero-legal
git init
git config user.email "admin@puntocerolegal.com"
git config user.name "Punto Cero Legal Admin"
```

### C. AGREGAR TODOS LOS ARCHIVOS

```bash
git add .
```

### D. CREAR COMMIT INICIAL

```bash
git commit -m "Initial commit: Punto Cero Legal - Backend + Frontend"
```

### E. AGREGAR REMOTE GITHUB

```bash
git remote add origin https://github.com/TU_USUARIO/punto-cero-legal.git
```

**Reemplazar:**
- `TU_USUARIO`: Tu usuario de GitHub

### F. PUSH A GITHUB (MAIN)

```bash
git branch -M main
git push -u origin main
```

---

## PASO 3: CONECTAR GITHUB A VERCEL

### A. CREAR PROYECTO EN VERCEL

1. Ve a https://vercel.com/dashboard
2. Click en **"Add New..."** → **"Project"**
3. Click en **"Import Git Repository"**
4. Selecciona **GitHub**
5. Conecta tu cuenta GitHub (si no está conectada)
6. Busca: `punto-cero-legal`
7. Click en **"Import"**

### B. CONFIGURAR PROYECTO

**Framework Preset:** Debe mostrar **"Create React App"** ✅
**Root Directory:** Debe mostrar **`frontend/`** ← ⚠️ IMPORTANTE

Si no está configurado:
- Click en **"Root Directory"**
- Selecciona **`./frontend`**

### C. AGREGAR VARIABLES DE ENTORNO

En el formulario **"Environment Variables"**:

```
REACT_APP_BACKEND_URL = https://puntocero-legal-api.onrender.com
```

**Aplicar a:** Production, Preview, Development

### D. CONFIGURAR BUILD SETTINGS

**Build Command:**
```
npm run build
```

**Output Directory:**
```
build
```

**Install Command:**
```
npm install
```

Estos ya están en `vercel.json`, pero verifica que Vercel los detecte.

### E. DEPLOY

Click en **"Deploy"**

**Esperado:**
- Building... (2-3 minutos)
- ✅ Build successful
- ✅ Deployment completed

**URL asignada por Vercel:**
```
https://punto-cero-legal-XXXXXX.vercel.app/
```

O si tienes dominio personalizado:
```
https://punto-cero-legal.vercel.app/
```

---

## PASO 4: VERIFICACIÓN POST-DESPLIEGUE

### A. TESTING DE RUTAS

```bash
# Test: Landing page
curl https://punto-cero-legal.vercel.app/

# Test: Login page
curl https://punto-cero-legal.vercel.app/login

# Test: 404 (fallback a /index.html)
curl https://punto-cero-legal.vercel.app/ruta-inexistente
# Debe retornar index.html, NO 404
```

### B. VERIFICACIÓN EN NAVEGADOR

1. **Landing Page**
   - URL: `https://punto-cero-legal.vercel.app/`
   - Debe mostrar: Hero, secciones, formularios
   - ✅ Sin errores en consola

2. **Login Page**
   - URL: `https://punto-cero-legal.vercel.app/login`
   - Debe mostrar: Formulario de login
   - ✅ Sin pantalla blanca
   - ✅ Inputs visibles

3. **Dashboard (Protegido)**
   - URL: `https://punto-cero-legal.vercel.app/dashboard`
   - Debe redirigir a `/login` (sin autenticación)
   - ✅ Redirección correcta

### C. TEST DE CONECTIVIDAD CON BACKEND

En la consola del navegador:
```javascript
// Test de conexión a backend
fetch('https://puntocero-legal-api.onrender.com/api/health')
  .then(r => r.json())
  .then(d => console.log('Backend OK:', d))
  .catch(e => console.log('Backend ERROR:', e))

// Esperado: {status: "healthy", database: "connected"}
```

### D. TEST DE LOGIN MANUAL

1. Ir a `/login`
2. Ingresar credenciales:
   - Email: `darwin@puntocerolegal.com`
   - Password: `Admin2025!`
3. Click en "Iniciar Sesión"
4. Debe redirigir a `/admin` (si es admin_general)
5. Recargar página (F5) → Sesión debe persistir
6. Ir a `/admin` → No debe dar 404 o pantalla blanca

---

## PASO 5: DESPLIEGUE AUTOMÁTICO FUTURO

### Cómo funciona:

1. **Developer hace push a `main`:**
   ```bash
   git push origin main
   ```

2. **GitHub notifica a Vercel**
   - Webhook automático

3. **Vercel inicia build:**
   - Descarga código
   - Ejecuta `npm install`
   - Ejecuta `npm run build`
   - Genera output en `build/`

4. **Vercel despliega:**
   - Sube `build/` a CDN
   - Asigna URLs
   - Configura routing SPA

5. **Resultado:** ✅ Nuevo deployment en vivo en ~3-5 minutos

**Sin intervención manual después del primer setup.**

---

## PASO 6: MONITOREO POST-DESPLIEGUE

### A. VERIFICACIÓN DIARIA

```bash
# Health check del frontend
curl https://punto-cero-legal.vercel.app/

# Health check del backend
curl https://puntocero-legal-api.onrender.com/api/health
```

Ambos deben retornar 200 OK.

### B. LOGS EN VERCEL

En Vercel Dashboard:
- Proyecto → **"Deployments"**
- Click en el deployment más reciente
- Tab **"Logs"** → Ver si hay errores

### C. MONITOREO DE ERRORES

**En navegador (devTools):**
- Console: ❌ Debe estar limpia (sin errores rojo)
- Network: ❌ Sin requests fallidas a backend
- Storage: Verificar que `pcl_token` se guarde en localStorage

---

## PASO 7: CONFIGURACIÓN AVANZADA (OPCIONAL)

### A. DOMINIO PERSONALIZADO

Si quieres `https://punto-cero-legal.com`:

1. Vercel Dashboard → Proyecto → **"Settings"**
2. Tab **"Domains"**
3. Agregar dominio
4. Apuntar DNS del registrador a Vercel

### B. CACHE HEADERS

Ya configurado en `vercel.json`:
```json
{
  "source": "/static/(.*)",
  "headers": [
    { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
  ]
}
```

**Beneficio:** Los assets estáticos se cachean 1 año en navegadores.

### C. REDIRECCIONAMIENTOS PERMANENTES

Si quieres redirigir URLs antiguas, agregar a `vercel.json`:

```json
"redirects": [
  { "source": "/old-page", "destination": "/new-page", "permanent": true }
]
```

---

## TROUBLESHOOTING

### Problema: "Build failed"

**Causa:** Error en build local

**Solución:**
```bash
cd frontend
npm install
npm run build
```

Revisar mensajes de error. Si hay conflictos, revisa:
- `REACT_APP_*` variables no configuradas
- Imports faltantes
- Dependencias no instaladas

### Problema: "Pantalla blanca en /login"

**Causa:** Error en componente React

**Solución:**
1. Ir a DevTools → Console
2. Buscar error rojo
3. Revisar archivo indicado
4. Fix en local, test con `npm start`
5. Push a GitHub → Vercel redeploy automático

### Problema: "API no conecta"

**Causa:** REACT_APP_BACKEND_URL mal configurada

**Solución:**
1. Vercel Dashboard → Proyecto → Settings → Environment Variables
2. Verificar: `REACT_APP_BACKEND_URL=https://puntocero-legal-api.onrender.com`
3. Click redeploy si cambió

### Problema: "Rutas 404"

**Causa:** Routing SPA no funciona

**Solución:**
Verificar `vercel.json` tiene:
```json
"rewrites": [
  { "source": "/(.*)", "destination": "/index.html" }
]
```

Si cambió, redeploy automáticamente.

---

## CHECKLIST FINAL

- [ ] Repository Git inicializado
- [ ] Código pushed a GitHub `main`
- [ ] Proyecto importado en Vercel
- [ ] Root directory: `frontend/`
- [ ] `REACT_APP_BACKEND_URL` configurada
- [ ] Build completado sin errores
- [ ] URL pública asignada
- [ ] `/login` carga sin errores
- [ ] `/dashboard` redirecciona correctamente
- [ ] Backend conecta (health check OK)
- [ ] Logs de Vercel limpios (sin errores)

---

## RESULTADO ESPERADO

```
URL en Vivo: https://punto-cero-legal-XXXXXX.vercel.app/
Status: ✅ Deployed successfully
Build: ✅ Completed (X minutes)
Health: ✅ Running
Backend: ✅ Connected to Render API
Routing: ✅ SPA working
Errors: ❌ None
```

---

## PRÓXIMOS DESPLIEGUES (AUTOMÁTICOS)

**Flujo:**
```
Developer: git push origin main
    ↓
GitHub: Notifica a Vercel
    ↓
Vercel: Auto-builds y despliega
    ↓
2-5 minutos después: ✅ Nuevo version en vivo
```

**Sin intervención manual necesaria.**

---

**Guía completada: 27 de Junio de 2026**
**Por: Senior DevOps Engineer**
**Status: ✅ LISTO PARA DESPLIEGUE**
