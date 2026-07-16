# PLAN DE DEPLOY Y VALIDACIÓN
## Punto Cero Legal v1.0 - Deploy a Staging/Producción

**Fecha:** 14 de Julio de 2026  
**Objetivo:** Preparar y ejecutar deploy del sistema  
**Estado:** PENDIENTE DE EJECUCIÓN

---

## FASE 1: REVISIÓN PRE-DEPLOY

### 1.1 Archivos Modificados Hoy

**Documentación generada (NO incluir en deploy):**
- ❌ BUTTONS_VISUAL_AUDIT.md
- ❌ FIRM_OS_OPERATIONAL_AUDIT.md
- ❌ PRODUCTION_DECISION_MATRIX.md
- ❌ GO_LIVE_OPERATIONAL_CERTIFICATION.md
- ❌ UAT_FINAL_GO_LIVE_CERTIFICATION.md
- ❌ FIRM_OS_PRODUCTION_BACKLOG.md
- ❌ SPRINT_F0_IMPLEMENTATION_REPORT.md
- ❌ SPRINT_F0_TEST_REPORT.md
- ❌ FIRM_OS_READY_FOR_PRODUCTION.md
- ❌ DEPLOY_AND_VALIDATION_PLAN.md

**Código modificado (INCLUIR en deploy):**
- ✅ Backend: Verificar cambios en `backend/routes/firms.py`
- ✅ Backend: Verificar cambios en `backend/services/firm_service.py`
- ✅ Backend: Verificar cambios en `backend/schemas/firm_schemas.py`
- ✅ Backend: Verificar corrección de imports

### 1.2 Verificación de Código

**Comandos de verificación:**

```bash
# 1. Verificar sintaxis Python
cd backend
python -m py_compile routes/firms.py
python -m py_compile services/firm_service.py
python -m py_compile schemas/firm_schemas.py

# 2. Verificar imports
python -c "from routes.firms import router; print('OK')"
python -c "from services.firm_service import FirmService; print('OK')"
python -c "from schemas.firm_schemas import FirmProfileUpdate, FirmSettingsUpdate; print('OK')"

# 3. Verificar que no hay errores de sintaxis
python -m py_compile routes/auth.py
python -c "from routes.auth import router; print('OK')"
```

**Resultado esperado:**
- ✅ Todos los archivos compilan sin errores
- ✅ No hay imports rotos
- ✅ No hay errores de sintaxis

### 1.3 Verificación de Dependencias

**Backend:**
```bash
cd backend
pip list | grep -E "fastapi|pydantic|boto3|pymongo"
```

**Verificar:**
- ✅ fastapi instalado
- ✅ pydantic instalado
- ✅ boto3 instalado (para S3)
- ✅ pymongo instalado

**Frontend:**
```bash
cd frontend
npm list --depth=0
```

**Verificar:**
- ✅ react instalado
- ✅ axios instalado
- ✅ react-router-dom instalado

### 1.4 Verificación de Variables de Entorno

**Backend (.env):**
```bash
cd backend
cat .env | grep -E "MONGODB|JWT|AWS|EMAIL"
```

**Verificar que existen:**
- ✅ MONGODB_URL
- ✅ JWT_SECRET
- ✅ AWS_ACCESS_KEY_ID
- ✅ AWS_SECRET_ACCESS_KEY
- ✅ AWS_BUCKET_NAME
- ✅ EMAIL_SERVICE_API_KEY

**Frontend (.env):**
```bash
cd frontend
cat .env | grep -E "REACT_APP_API|REACT_APP_URL"
```

**Verificar que existen:**
- ✅ REACT_APP_API_URL
- ✅ REACT_APP_URL

---

## FASE 2: BUILD

### 2.1 Build Backend

**Comando:**
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Verificar:**
- ✅ Backend inicia sin errores
- ✅ No hay errores de importación
- ✅ Logs muestran "Application startup complete"
- ✅ Puerto 8000 escuchando

**Si hay errores:**
- ❌ Detener deploy
- ❌ Documentar error exacto
- ❌ Corregir antes de continuar

### 2.2 Build Frontend

**Comando:**
```bash
cd frontend
npm run build
```

**Verificar:**
- ✅ Build completa sin errores
- ✅ No hay errores de TypeScript
- ✅ No hay errores de React
- ✅ Carpeta `build/` se crea correctamente

**Si hay errores:**
- ❌ Detener deploy
- ❌ Documentar error exacto
- ❌ Corregir antes de continuar

### 2.3 Verificación de Compilación

**Backend:**
```bash
# Verificar que no hay errores
python -c "import sys; sys.path.insert(0, '.'); from main import app; print('Backend OK')"
```

**Frontend:**
```bash
# Verificar que el build existe
ls -la build/
# Debe mostrar: index.html, static/, etc.
```

---

## FASE 3: PREPARAR DEPLOY

### 3.1 Git Status

**Comando:**
```bash
git status
```

**Verificar:**
- ✅ Solo archivos de código modificados
- ✅ No hay archivos temporales
- ✅ No hay archivos de documentación .md
- ✅ No hay node_modules
- ✅ No hay __pycache__
- ✅ No hay .env

**Si hay archivos no deseados:**
```bash
# Agregar a .gitignore
echo "*.md" >> .gitignore
echo "node_modules/" >> .gitignore
echo "__pycache__/" >> .gitignore
echo ".env" >> .gitignore
```

### 3.2 Archivos a Incluir en Deploy

**Backend:**
```
backend/
├── main.py
├── routes/
│   ├── auth.py
│   ├── firms.py (modificado)
│   ├── clients.py
│   ├── cases.py
│   ├── documents.py
│   ├── meetings.py
│   ├── ai.py
│   └── payment.py
├── services/
│   ├── firm_service.py (modificado)
│   ├── email_service.py
│   └── ...
├── schemas/
│   ├── firm_schemas.py (modificado)
│   └── ...
├── models/
│   └── ...
├── requirements.txt
└── .env (NO incluir, usar variables de entorno en producción)
```

**Frontend:**
```
frontend/
├── build/ (carpeta compilada)
│   ├── index.html
│   ├── static/
│   └── ...
└── package.json
```

### 3.3 Commit y Push

**Comandos:**
```bash
# 1. Agregar solo archivos de código
git add backend/routes/firms.py
git add backend/services/firm_service.py
git add backend/schemas/firm_schemas.py

# 2. Commit
git commit -m "feat: Sprint F0 - Cerrar Firm OS

- Corregir error import email_service
- Implementar endpoint PUT /api/firms/profile
- Implementar endpoint PUT /api/firms/settings
- Implementar servicio upload avatar

Sprint: F0
Fecha: 14 de Julio de 2026"

# 3. Push
git push origin main
```

**Verificar:**
- ✅ Push exitoso
- ✅ No hay errores
- ✅ Commit tiene mensaje claro

---

## FASE 4: DESPLIEGUE

### 4.1 Deploy Backend

**Opción A: Render (recomendado)**

**Comando:**
```bash
# Si usas Render CLI
render deploy
```

**O manual:**
1. Ir a https://dashboard.render.com
2. Seleccionar servicio backend
3. Click "Manual Deploy"
4. Esperar despliegue

**Verificar:**
- ✅ Deploy exitoso
- ✅ URL de backend funcionando
- ✅ Logs sin errores

**Opción B: VPS/Docker**

**Comando:**
```bash
# SSH al servidor
ssh usuario@servidor

# Pull de código
cd /app/backend
git pull origin main

# Instalar dependencias
pip install -r requirements.txt

# Reiniciar servicio
sudo systemctl restart backend

# Verificar logs
sudo journalctl -u backend -f
```

**Verificar:**
- ✅ Servicio reiniciado
- ✅ Sin errores en logs
- ✅ Puerto escuchando

### 4.2 Deploy Frontend

**Opción A: Vercel (recomendado)**

**Comando:**
```bash
# Si usas Vercel CLI
vercel --prod
```

**O manual:**
1. Ir a https://vercel.com
2. Seleccionar proyecto frontend
3. Click "Deploy"
4. Esperar despliegue

**Verificar:**
- ✅ Deploy exitoso
- ✅ URL de frontend funcionando
- ✅ Página carga correctamente

**Opción B: Netlify**

**Comando:**
```bash
# Si usas Netlify CLI
netlify deploy --prod --dir=frontend/build
```

### 4.3 Verificación de Deploy

**Backend:**
```bash
# Verificar health check
curl https://tu-backend-url.com/health

# Verificar endpoint nuevo
curl https://tu-backend-url.com/api/firms/profile \
  -H "Authorization: Bearer {token}"
```

**Frontend:**
```bash
# Verificar que carga
curl https://tu-frontend-url.com

# Verificar que no hay errores 404
curl https://tu-frontend-url.com/static/js/main.js
```

**Verificar:**
- ✅ Backend responde
- ✅ Frontend carga
- ✅ No hay errores 500
- ✅ No hay errores 404

---

## FASE 5: VALIDACIÓN OPERATIVA

### 5.1 Checklist de Validación

**Landing:**
- [ ] Acceder a https://tu-frontend-url.com
- [ ] Verificar que landing page carga
- [ ] Verificar que no hay errores en consola
- [ ] Verificar que botones funcionan

**Registro:**
- [ ] Ir a /register
- [ ] Completar formulario
- [ ] Verificar que se crea usuario
- [ ] Verificar que se crea firma
- [ ] Verificar redirección a dashboard

**Login:**
- [ ] Ir a /login
- [ ] Ingresar credenciales
- [ ] Verificar que login funciona
- [ ] Verificar que redirige a dashboard
- [ ] Verificar que JWT se guarda

**Lawyer OS:**
- [ ] Acceder como abogado
- [ ] Verificar dashboard carga
- [ ] Crear cliente
- [ ] Crear expediente
- [ ] Subir documento
- [ ] Crear reunión
- [ ] Usar IA jurídica
- [ ] Verificar que todo funciona

**Firm OS:**
- [ ] Acceder como Firm Owner
- [ ] Verificar dashboard carga
- [ ] Editar perfil
- [ ] Guardar cambios
- [ ] Subir avatar
- [ ] Guardar configuración
- [ ] Verificar que todo persiste

**Client Portal:**
- [ ] Acceder como cliente
- [ ] Ver expedientes
- [ ] Ver documentos
- [ ] Ver reuniones
- [ ] Verificar que todo funciona

**Mercado Pago:**
- [ ] Ir a /plans
- [ ] Seleccionar plan
- [ ] Ir a checkout
- [ ] Verificar que redirige a Mercado Pago
- [ ] Completar pago (test)
- [ ] Verificar webhook

**IA Jurídica:**
- [ ] Ir a /ai
- [ ] Enviar pregunta
- [ ] Verificar que responde
- [ ] Verificar que guarda historial

**Jitsi:**
- [ ] Crear reunión
- [ ] Verificar que se crea
- [ ] Entrar a reunión
- [ ] Verificar que Jitsi carga

**Seguridad Multi-Tenant:**
- [ ] Verificar que usuario no puede acceder a otra firma
- [ ] Verificar que permisos funcionan
- [ ] Verificar que JWT funciona

### 5.2 Comandos de Validación

**Backend:**
```bash
# Verificar health
curl https://tu-backend-url.com/health

# Verificar registro
curl -X POST https://tu-backend-url.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test"}'

# Verificar login
curl -X POST https://tu-backend-url.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

**Frontend:**
```bash
# Verificar que carga
curl https://tu-frontend-url.com

# Verificar assets
curl https://tu-frontend-url.com/static/js/main.js
```

---

## FASE 6: RESULTADO

### 6.1 Tabla de Resultados

| Área | Estado | Observación |
|------|--------|-------------|
| Frontend | ⏳ Pendiente | Esperando deploy |
| Backend | ⏳ Pendiente | Esperando deploy |
| Deploy | ⏳ Pendiente | Esperando ejecución |
| Login | ⏳ Pendiente | Pendiente de validación |
| Lawyer OS | ⏳ Pendiente | Pendiente de validación |
| Firm OS | ⏳ Pendiente | Pendiente de validación |
| Client Portal | ⏳ Pendiente | Pendiente de validación |
| Mercado Pago | ⏳ Pendiente | Pendiente de validación |
| IA Jurídica | ⏳ Pendiente | Pendiente de validación |
| Jitsi | ⏳ Pendiente | Pendiente de validación |
| Seguridad | ⏳ Pendiente | Pendiente de validación |

### 6.2 Próximos Pasos

**Inmediatos:**
1. Ejecutar Fase 1: Revisión de cambios
2. Ejecutar Fase 2: Build
3. Ejecutar Fase 3: Preparar deploy
4. Ejecutar Fase 4: Deploy
5. Ejecutar Fase 5: Validación operativa
6. Completar tabla de resultados

**Si hay errores:**
- Documentar error exacto
- Corregir antes de continuar
- Re-ejecutar fase fallida

---

## NOTAS IMPORTANTES

### Variables de Entorno en Producción

**Backend (Render/VPS):**
```env
MONGODB_URL=mongodb://...
JWT_SECRET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=...
EMAIL_SERVICE_API_KEY=...
```

**Frontend (Vercel/Netlify):**
```env
REACT_APP_API_URL=https://tu-backend-url.com
REACT_APP_URL=https://tu-frontend-url.com
```

### Servicios Externos

**Verificar que estén funcionando:**
- ✅ MongoDB (Atlas/local)
- ✅ AWS S3
- ✅ Email Service (SendGrid/Mailgun)
- ✅ Mercado Pago
- ✅ Gemini API
- ✅ Jitsi

### Monitoreo Post-Deploy

**Verificar logs:**
- Backend logs
- Frontend logs
- MongoDB logs
- S3 logs

**Verificar métricas:**
- Tiempo de respuesta
- Errores 500
- Errores 404
- Uso de CPU/memoria

---

## CONTACTO

**Responsable de deploy:**
- DevOps Engineer
- Release Manager

**Escalación:**
- Nivel 1: Errores de frontend
- Nivel 2: Errores de backend
- Nivel 3: Servicios externos

---

**Documento generado:** 14 de Julio de 2026  
**Estado:** PENDIENTE DE EJECUCIÓN  
**Próximo paso:** Ejecutar Fase 1