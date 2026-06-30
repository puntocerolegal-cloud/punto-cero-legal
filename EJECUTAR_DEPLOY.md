# 🚀 EJECUTAR DESPLIEGUE AHORA — PUNTO CERO LEGAL

## OPCIÓN RÁPIDA (10 minutos a producción)

### PASO 1: Compilar Frontend

Abre tu terminal en la carpeta del proyecto y ejecuta:

```bash
cd frontend
npm install --legacy-peer-deps
npm run build
```

Esperado:
```
✅ Compiled successfully
📦 Build directory created (3-5 MB)
```

### PASO 2: Verificar Build

```bash
ls -la build/
# Debe mostrar: index.html, static/, favicon.ico, etc.
```

### PASO 3: Ir a Vercel Dashboard

1. **Ve a:** https://vercel.com/dashboard
2. **Click:** "Add New..." → "Project"
3. **Click:** "Import Git Repository"

### PASO 4: Conectar GitHub

1. **Click:** "Select Git Provider" → GitHub
2. **Conecta tu cuenta GitHub** (si no está conectada)
3. **Busca:** `punto-cero-legal`
4. **Click:** "Import"

### PASO 5: Configurar Proyecto

En el formulario de configuración:

```
Framework Preset: Create React App ✅
Root Directory: ./frontend  ← IMPORTANTE
```

### PASO 6: Variables de Entorno

En "Environment Variables", agrega:

```
Key: REACT_APP_BACKEND_URL
Value: https://puntocero-legal-api.onrender.com
```

Aplica a: **Production, Preview, Development**

### PASO 7: Deploy

**Click:** "Deploy"

### PASO 8: Espera (2-5 minutos)

Vercel mostrará:
- ✅ Building...
- ✅ Build successful
- ✅ Deployment completed

Tu URL aparecerá:
```
https://punto-cero-legal-XXXXXX.vercel.app/
```

---

## VERIFICACIÓN INMEDIATA

Después del deploy, abre en navegador:

### URL 1: Landing Page
```
https://punto-cero-legal-XXXXXX.vercel.app/
```

**Debe mostrar:**
- ✅ Hero section
- ✅ Navegación
- ✅ Sin errores en consola

### URL 2: Login
```
https://punto-cero-legal-XXXXXX.vercel.app/login
```

**Debe mostrar:**
- ✅ Formulario
- ✅ Inputs funcionales
- ✅ Botón submit

### URL 3: Probar Backend
En DevTools Console:

```javascript
fetch('https://puntocero-legal-api.onrender.com/api/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend OK:', d))
  .catch(e => console.log('❌ Backend Error:', e))
```

Esperado:
```json
{"status":"healthy","database":"connected"}
```

---

## SI TIENES VERCEL CLI (Alternativa más rápida)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Desplegar (desde la raíz del proyecto)
vercel --prod --cwd frontend

# Seguir los prompts:
# ? Set up and deploy "punto-cero-legal"? → yes
# ? Link to existing project? → yes (si lo ya existe) o no
# ? What's your project's name? → punto-cero-legal
# ? Which scope should contain your project? → Tu team
```

Resultado:
```
✅ Deployed to https://punto-cero-legal-XXXXXX.vercel.app/
```

---

## CHECKLIST FINAL

- [ ] `npm run build` completó sin errores
- [ ] Directorio `build/` existe
- [ ] Proyecto importado en Vercel
- [ ] Root directory configurado: `./frontend`
- [ ] `REACT_APP_BACKEND_URL` agregada
- [ ] Deploy iniciado (viendo "Building...")
- [ ] Deploy completó (viendo "Deployment completed")
- [ ] URL en vivo accesible
- [ ] `/login` carga correctamente
- [ ] Backend conecta (health check OK)

---

## ERRORES COMUNES

### ❌ "npm: command not found"
**Solución:** Instalar Node.js desde https://nodejs.org/

### ❌ "Build failed"
**Solución:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

### ❌ "Root directory not found"
**Solución:** Asegúrate que seleccionaste `./frontend` en Vercel, no `.`

### ❌ "REACT_APP_BACKEND_URL is undefined"
**Solución:** Verifica que la variable está en Vercel dashboard

### ❌ "Pantalla blanca en /login"
**Solución:** Abre DevTools (F12) → Console → busca errores rojos

---

## TIEMPO ESTIMADO

| Paso | Tiempo |
|------|--------|
| Build | 1-2 minutos |
| Import a Vercel | 2 minutos |
| Deploy | 2-5 minutos |
| Verificación | 2 minutos |
| **TOTAL** | **~10-15 minutos** |

---

## RESULTADO ESPERADO

```
✅ URL en vivo: https://punto-cero-legal-XXXXXX.vercel.app/
✅ Frontend: Cargando sin errores
✅ Login: Funcional
✅ Backend: Conectando
✅ Status: DEPLOYED SUCCESSFULLY
```

---

**¡Listo! A producción en 10-15 minutos. 🎉**
