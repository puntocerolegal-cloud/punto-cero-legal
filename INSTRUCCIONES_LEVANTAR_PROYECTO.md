# INSTRUCCIONES PRÁCTICAS: LEVANTAR PUNTO CERO LEGAL

## REQUISITOS PREVIOS

### 1. Node.js & npm
```bash
node --version  # Debe ser v16+ (probablemente tienes v18+)
npm --version   # Debe ser v8+
```

### 2. Python & pip
```bash
python --version  # Debe ser 3.11
pip --version
```

### 3. MongoDB (Opcional)
- **Si quieres persistencia:** Instala MongoDB local en puerto 27017
- **Si solo quieres demo:** Backend caerá a InMemoryDB (datos en RAM)

```bash
# En macOS con Homebrew
brew services start mongodb-community

# En Windows (si instalaste MongoDB)
# Ejecuta mongod.exe o arranca desde Services

# En Linux
sudo systemctl start mongod
```

---

## PASO 1: VERIFICAR ESTRUCTURA

```bash
cd punto-cero-legal
ls -la

# Debe ver:
# backend/
# frontend/
# AUDITORIA_POST_INTEGRACION_COMPLETA.md
# SPRINT_VALIDACION_FINAL_REPORTE.md
```

---

## PASO 2: BACKEND

### 2.1 Preparar virtualenv

```bash
cd backend

# Crear virtualenv si no existe
python -m venv .venv

# Activar virtualenv
# En macOS/Linux:
source .venv/bin/activate
# En Windows (PowerShell):
.\.venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r requirements.txt
```

### 2.2 Configurar .env

Opción A: Dejar template (usará InMemoryDB)
```bash
# backend/.env ya existe con valores template
# Ningún cambio requerido (usará fallback)
```

Opción B: Configurar MongoDB local
```bash
# Editar backend/.env
MONGO_URL=mongodb://localhost:27017
DB_NAME=puntocero_legal
SECRET_KEY=tu-clave-secreta-aqui
CORS_ORIGINS=*
```

### 2.3 Iniciar backend

```bash
cd backend
python server.py
```

**Resultado esperado:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
INFO: MongoDB client initialized  (o: MongoDB initialization failed [fallback a memory])
```

**Verificar salud:**
```bash
curl http://127.0.0.1:8000/api/health
# Respuesta: {"status":"healthy","database":"connected",...}
```

**Mantener esta terminal abierta**

---

## PASO 3: FRONTEND

### 3.1 En una NUEVA terminal

```bash
cd frontend  # IMPORTANTE: Nueva terminal, directorio frontend

# Instalar dependencias (si no se hizo antes)
npm install

# Verificar variables de entorno
cat .env
# Debe tener: REACT_APP_BACKEND_URL=http://127.0.0.1:8000
```

### 3.2 Iniciar frontend

```bash
npm start
```

**Resultado esperado:**
```
Compiled successfully!
webpack 5.95.0 compiled with no warnings

Compiled application is ready on the following URLs:

Local:   http://localhost:3000
```

**Se abrirá automáticamente en http://localhost:3000**

---

## PASO 4: PRUEBAS MANUALES

### 4.1 Pantalla de login
```
URL: http://localhost:3000/login
Credenciales:
  Email:    admin@puntocerolegal.com
  Password: Admin2025!
```

**Resultado esperado:**
- ✅ Formulario carga
- ✅ Puedes escribir en campos
- ✅ Botón "Ingresar" es clickeable
- Después del submit: Redirige a /dashboard

### 4.2 Dashboard Lawyer
```
URL: http://localhost:3000/dashboard
```

**Resultado esperado:**
- ✅ Sidebar carga con menú Lawyer OS
- ✅ Contenido principal renderiza
- ✅ Links de navegación funcionan

**Subpáginas:**
- `/dashboard/crm` → Debe cargar
- `/dashboard/cases` → Intenta cargar casos (puede estar vacío)
- `/dashboard/documents` → Intenta cargar documentos (puede estar vacío)
- `/dashboard/agenda` → Debe cargar
- `/dashboard/ai` → Debe cargar
- `/dashboard/settings` → Debe cargar

### 4.3 Firm OS
```
URL: http://localhost:3000/firm-os
```

**Resultado esperado:**
- ✅ FirmShell carga
- ✅ Sidebar Firm OS renderiza
- ⚠️ Dashboard muestra UI pero sin datos reales (mock/localStorage)
- ⚠️ Workflows, Scheduler, Automation sin backend

**Subpáginas:**
- `/firm-os/crm` → Reúsa página Lawyer
- `/firm-os/cases` → Reúsa página Lawyer
- `/firm-os/automation` → Carga pero mock
- `/firm-os/workflow-builder` → Carga pero localStorage
- `/firm-os/scheduler` → Carga pero localStorage

### 4.4 Admin OS
```
URL: http://localhost:3000/admin
```

**Resultado esperado:**
- ✅ AdminShell carga
- ✅ Sidebar Admin renderiza
- ✅ Dashboard principal carga

**Subpáginas:**
- `/admin/users` → Debe funcionar
- `/admin/roles` → Debe funcionar
- `/admin/firms` → Debe funcionar
- `/admin/billing` → Debe funcionar

---

## PASO 5: REVISAR CONSOLA (DevTools)

Abre **F12 → Console** en el navegador

### ✅ Que debería ver
```
Download the React DevTools for a better development experience
```

### ❌ Que NO debería ver (crítico)
```
Uncaught SyntaxError: ...
Uncaught ReferenceError: ... is not defined
Uncaught TypeError: Cannot read properties of null
```

### ⚠️ Que PODRÍA ver (no crítico)
```
Compiled with warnings (ver qué son)
Deprecation warnings
LF vs CRLF warnings
```

---

## PASO 6: REVISAR NETWORK (DevTools)

Abre **F12 → Network** y recarga página

### Requests que deberían ser 200 ✅
```
GET /api/health           → 200
GET /api/cases/           → 200 (puede estar vacío)
GET /api/documents/       → 200 (puede estar vacío)
GET /api/auth/me          → 200 (usuario logueado)
```

### Requests que PODRÍAN ser 404 (no crítico) ⚠️
```
GET /api/firms/{firm_id}/cases → 404 (no registrado, es enterprise)
GET /api/firms/{firm_id}/documents → 404
```

### CORS Errors ❌ Crítico
```
Access to XMLHttpRequest at 'http://127.0.0.1:8000/api/...' from origin 'http://localhost:3000'
has been blocked by CORS policy
```

Si ves esto, backend no tiene CORS habilitado. Verifica `backend/.env`:
```
CORS_ORIGINS=*
```

---

## PASO 7: CHECKLIST DE VALIDACIÓN

- [ ] Backend inicia sin errores (puerto 8000)
- [ ] Frontend compila sin errores (puerto 3000)
- [ ] `/login` carga correctamente
- [ ] Puedo loguearme con admin@puntocerolegal.com / Admin2025!
- [ ] `/dashboard` carga después del login
- [ ] `/dashboard/cases` renderiza (aunque esté vacío)
- [ ] `/dashboard/documents` renderiza (aunque esté vacío)
- [ ] `/firm-os` carga
- [ ] `/admin` carga
- [ ] Sidebar navega sin errores
- [ ] Console muestra React DevTools (sin errores críticos)
- [ ] Network: requests a `/api/` reciben 200 (o 404 para enterprise)

---

## PASO 8: POSIBLES PROBLEMAS & SOLUCIONES

### Problema: "Port 3000 is already in use"
```bash
# Solución: Kill proceso en puerto 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Problema: "Port 8000 is already in use"
```bash
# Solución: Kill proceso en puerto 8000
# macOS/Linux:
lsof -ti:8000 | xargs kill -9

# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Problema: "CORS Error"
```
Backend no tiene CORS habilitado.
Edita backend/.env:
CORS_ORIGINS=*
Reinicia backend (Ctrl+C, python server.py)
```

### Problema: "MongoDB initialization failed"
```
Esto es OK. Backend caerá a InMemoryDB.
Datos no persistirán en restart, pero frontend funcionará.
Para persistencia, instala MongoDB local:
  brew services start mongodb-community  (macOS)
  sudo systemctl start mongod            (Linux)
Luego edita backend/.env:
  MONGO_URL=mongodb://localhost:27017
Reinicia backend.
```

### Problema: "npm: command not found"
```
Node.js no está instalado.
Descarga e instala desde: https://nodejs.org/
Requiere v16+, recomendado v18+
```

### Problema: "python: command not found"
```
Python no está instalado.
Descarga e instala desde: https://www.python.org/
Requiere Python 3.11
```

### Problema: "ModuleNotFoundError: No module named 'fastapi'"
```
Dependencies no instaladas en backend.
cd backend
python -m venv .venv
source .venv/bin/activate  (o .\.venv\Scripts\Activate.ps1 en Windows)
pip install -r requirements.txt
```

### Problema: "Blank white screen en frontend"
```
Causas posibles:
1. Backend no está levantado (verificar localhost:8000/api/health)
2. Token no se propaga correctamente
3. AuthContext no inicializó user

Abre DevTools (F12):
- Console: ¿Hay errores?
- Network: ¿Las requests se están haciendo?
- Application: ¿Está el token en localStorage?

Si todo está bien, actualiza la página (F5).
Si persiste, ve a /login y loguéate de nuevo.
```

---

## PASO 9: NAVEGACIÓN ESPERADA

Después de hacer login, deberías poder:

1. **Ir a Dashboard**
   - `/dashboard` → Lawyer OS home
   - Ver sidebar con opciones Lawyer

2. **Ver casos (vacío o con datos)**
   - `/dashboard/cases` → CasesPage
   - Mostrará lista de casos (o vacío si no hay en BD)

3. **Ver documentos (vacío o con datos)**
   - `/dashboard/documents` → DocumentsPage
   - Mostrará lista de documentos (o vacío)

4. **Ir a Firm OS**
   - `/firm-os` → FirmDashboard
   - Verá sidebar Firm OS
   - ⚠️ Datos serán mock/localStorage (sin backend)

5. **Ir a Admin OS**
   - `/admin` → AdminDashboard
   - Verá sidebar Admin OS
   - ✅ Debería funcionar (datos de backend)

6. **Volver a LandingPage**
   - `/` → LandingPage pública
   - O logout y volver a `/login`

---

## RESUMEN: TIEMPO ESTIMADO

```
Instalación de dependencias:     3-5 minutos (primer vez)
Levantar backend:                30 segundos
Levantar frontend:               45 segundos
Verificación manual:             5 minutos
───────────────────────────────
Total:                          10-15 minutos
```

---

## ¿QUÉ ESPERAR?

### ✅ Funcionará
- Login
- Navegación entre Lawyer OS, Firm OS, Admin OS
- Dashboards cargando
- Casos/Documentos listando (o vacío)
- Sidebar completo
- Links internos

### ⚠️ Funcionará pero limitado
- Firm OS features (workflows, scheduler) sin datos reales
- Datos solo en memoria (si no hay MongoDB)
- Endpoint enterprise no disponibles (need bootstrap call)

### ❌ NO funcionará
- Workflows reales (sin backend)
- Persistencia de datos (sin MongoDB)
- Enterprise features (sin bootstrap)

---

## PRÓXIMOS PASOS

Una vez que todo funcione visualmente:

1. **Revisar qué endpoints se llaman en Console → Network**
2. **Verificar si hay datos en MongoDB (si está configurado)**
3. **Revisar si enterprise bootstrap debería estar activo**
4. **Documentar qué features necesitan backend real**

---

**Estado para inicio:** 🟡 **LISTO PARA INSPECCIÓN VISUAL**

El proyecto funciona visualmente. Falta completar la integración de features enterprise.
