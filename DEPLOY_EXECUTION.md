# DEPLOY Y VALIDACIÓN - GUÍA DE EJECUCIÓN
## Punto Cero Legal v1.0 - Checklist Ejecutable

**Fecha:** 14 de Julio de 2026  
**Objetivo:** Deploy y validación del sistema  
**Estado:** LISTO PARA EJECUTAR

---

## INSTRUCCIONES

Este documento contiene todos los comandos y pasos a ejecutar.  
Copia y pega cada comando en tu terminal.  
Marca ✅ cuando se complete exitosamente.  
Marca ❌ si falla y documenta el error.

---

## FASE 1: REVISIÓN PRE-DEPLOY

### 1.1 Verificar Archivos Modificados

```bash
cd c:/Users/darwi/Documents/punto-cero-legal

# Ver estado de git
git status
```

**Esperado:** Solo archivos de código, sin .md, sin node_modules, sin __pycache__

**Resultado:** 
- [ ] ✅ 
- [ ] ❌ 

**Observaciones:** 
```

---

### 1.2 Verificar Sintaxis Backend

```bash
cd backend

# Verificar compilación Python
python -m py_compile routes/firms.py
python -m py_compile services/firm_service.py
python -m py_compile schemas/firm_schemas.py
python -m py_compile routes/auth.py
```

**Esperado:** Sin errores

**Resultado:**
- [ ] ✅ 
- [ ] ❌ 

**Errores encontrados:**
```

---

### 1.3 Verificar Imports Backend

```bash
cd backend

# Verificar que los imports funcionan
python -c "from routes.firms import router; print('OK')"
python -c "from services.firm_service import FirmService; print('OK')"
python -c "from schemas.firm_schemas import FirmProfileUpdate, FirmSettingsUpdate; print('OK')"
python -c "from utils.email_service import send_verification_email; print('OK')"
```

**Esperado:** Todos imprimen "OK"

**Resultado:**
- [ ] ✅ 
- [ ] ❌ 

**Errores:**
```

---

### 1.4 Verificar Dependencias Backend

```bash
cd backend

# Verificar paquetes instalados
pip list | grep -E "fastapi|pydantic|boto3|pymongo"
```

**Esperado:** Todos los paquetes listados

**Resultado:**
- [ ] ✅ 
- [ ] ❌ 

**Paquetes faltantes:**
```

---

### 1.5 Verificar Variables de Entorno Backend

```bash
cd backend

# Verificar variables críticas
cat .env | grep -E "MONGODB_URL|JWT_SECRET|AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|AWS_BUCKET_NAME|EMAIL_SERVICE_API_KEY"
```

**Esperado:** Todas las variables presentes

**Resultado:**
- [ ] ✅ 
- [ ] ❌ 

**Variables faltantes:**
```

---

### 1.6 Verificar Build Frontend

```bash
cd frontend

# Instalar dependencias si es necesario
npm install

# Build
npm run build
```

**Esperado:** Build completa sin errores, carpeta build/ creada

**Resultado:**
- [ ] ✅ 
- [ ] ❌ 

**Errores:**
```

---

## FASE 2: PREPARAR COMMIT

### 2.1 Revisar Cambios

```bash
cd c:/Users/darwi/Documents/punto-cero-legal

# Ver diff
git diff backend/routes/firms.py
git diff backend/services/firm_service.py
git diff backend/schemas/firm_schemas.py
```

**Verificar:** Solo cambios relacionados con Sprint F0

**Resultado:**
- [ ] ✅ Cambios correctos
- [ ] ❌ Hay cambios no deseados

---

### 2.2 Agregar Archivos

```bash
# Agregar solo archivos de código
git add backend/routes/firms.py
git add backend/services/firm_service.py
git add backend/schemas/firm_schemas.py

# Verificar
git status
```

**Esperado:** Solo los 3 archivos de código

**Resultado:**
- [ ] ✅ 
- [ ] ❌ 

---

### 2.3 Commit

```bash
git commit -m "feat: Sprint F0 - Cerrar Firm OS

- Corregir error import email_service
- Implementar endpoint PUT /api/firms/profile
- Implementar endpoint PUT /api/firms/settings
- Implementar servicio upload avatar

Sprint: F0
Fecha: 14 de Julio de 2026"
```

**Esperado:** Commit exitoso

**Resultado:**
- [ ] ✅ 
- [ ] ❌ 

**Error:**
```

---

### 2.4 Push

```bash
git push origin main
```

**Esperado:** Push exitoso

**Resultado:**
- [ ] ✅ 
- [ ] ❌ 

**Error:**
```

---

## FASE 3: DEPLOY BACKEND

### 3.1 Deploy a Render

**Pasos:**
1. Ir a https://dashboard.render.com
2. Seleccionar servicio backend
3. Click "Manual Deploy"
4. Esperar despliegue

**URL Backend:** https://punto-cero-legal-backend.onrender.com

**Verificar logs:**
```bash
# En Render dashboard, verificar logs
```

**Resultado:**
- [ ] ✅ Deploy exitoso
- [ ] ❌ Deploy fallido

**Error:**
```

---

### 3.2 Verificar Backend en Producción

```bash
# Health check
curl https://punto-cero-legal-backend.onrender.com/health

# Verificar endpoint profile
curl https://punto-cero-legal-backend.onrender.com/api/firms/profile \
  -H "Authorization: Bearer {token}"
```

**Esperado:** 
- Health: 200 OK
- Profile: 401 (sin token) o 200 (con token)

**Resultado:**
- [ ] ✅ 
- [ ] ❌ 

**Respuesta:**
```

---

## FASE 4: DEPLOY FRONTEND

### 4.1 Deploy a Vercel

**Pasos:**
1. Ir a https://vercel.com
2. Seleccionar proyecto punto-cero-legal-frontend
3. Click "Deploy"
4. Esperar despliegue

**URL Frontend:** https://punto-cero-legal.vercel.app

**Resultado:**
- [ ] ✅ Deploy exitoso
- [ ] ❌ Deploy fallido

**Error:**
```

---

### 4.2 Verificar Frontend en Producción

```bash
# Verificar que carga
curl https://punto-cero-legal.vercel.app

# Verificar assets
curl https://punto-cero-legal.vercel.app/static/js/main.js
```

**Esperado:** 
- Página: 200 OK
- Assets: 200 OK

**Resultado:**
- [ ] ✅ 
- [ ] ❌ 

**Respuesta:**
```

---

## FASE 5: VALIDACIÓN OPERATIVA

### 5.1 Landing Page

**URL:** https://punto-cero-legal.vercel.app

**Pasos:**
1. Abrir URL en navegador
2. Verificar que carga
3. Verificar consola (F12)
4. Verificar botones

**Resultado:**
- [ ] ✅ 
- [ ] ❌ 

**Observaciones:**
```

---

### 5.2 Registro

**URL:** https://punto-cero-legal.vercel.app/register

**Pasos:**
1. Ir a /register
2. Completar formulario
3. Enviar
4. Verificar redirección

**Resultado:**
- [ ] ✅ 
- [ ] ❌ 

**Observaciones:**
```

---

### 5.3 Login

**URL:** https://punto-cero-legal.vercel.app/login

**Pasos:**
1. Ir a /login
2. Ingresar credenciales
3. Verificar login
4. Verificar redirección

**Resultado:**
- [ ] ✅ 
- [ ] ❌ 

**Observaciones:**
```

---

### 5.4 Lawyer OS

**URL:** https://punto-cero-legal.vercel.app/dashboard

**Pasos:**
1. Login como abogado
2. Verificar dashboard
3. Crear cliente
4. Crear expediente
5. Subir documento

**Resultado:**
- [ ] ✅ 
- [ ] ❌ 

**Observaciones:**
```

---

### 5.5 Firm OS

**URL:** https://punto-cero-legal.vercel.app/firm-os

**Pasos:**
1. Login como Firm Owner
2. Verificar dashboard
3. Editar perfil
4. Guardar cambios
5. Subir avatar
6. Guardar configuración

**Resultado:**
- [ ] ✅ 
- [ ] ❌ 

**Observaciones:**
```

---

### 5.6 Client Portal

**URL:** https://punto-cero-legal.vercel.app/portal

**Pasos:**
1. Login como cliente
2. Ver expedientes
3. Ver documentos
4. Ver reuniones

**Resultado:**
- [ ] ✅ 
- [ ] ❌ 

**Observaciones:**
```

---

### 5.7 Mercado Pago

**URL:** https://punto-cero-legal.vercel.app/plans

**Pasos:**
1. Ir a /plans
2. Seleccionar plan
3. Ir a checkout
4. Verificar redirección a Mercado Pago

**Resultado:**
- [ ] ✅ 
- [ ] ❌ 

**Observaciones:**
```

---

### 5.8 IA Jurídica

**URL:** https://punto-cero-legal.vercel.app/ai

**Pasos:**
1. Ir a /ai
2. Enviar pregunta
3. Verificar respuesta
4. Verificar historial

**Resultado:**
- [ ] ✅ 
- [ ] ❌ 

**Observaciones:**
```

---

### 5.9 Jitsi

**URL:** https://punto-cero-legal.vercel.app/dashboard/meetings

**Pasos:**
1. Crear reunión
2. Verificar creación
3. Entrar a reunión
4. Verificar Jitsi

**Resultado:**
- [ ] ✅ 
- [ ] ❌ 

**Observaciones:**
```

---

### 5.10 Seguridad Multi-Tenant

**Pasos:**
1. Verificar aislamiento de tenants
2. Verificar permisos
3. Verificar JWT

**Resultado:**
- [ ] ✅ 
- [ ] ❌ 

**Observaciones:**
```

---

## FASE 6: RESULTADO FINAL

### 6.1 Tabla de Resultados

| Área | Estado | Observación |
|------|--------|-------------|
| Frontend | ___ | _____________ |
| Backend | ___ | _____________ |
| Deploy | ___ | _____________ |
| Login | ___ | _____________ |
| Lawyer OS | ___ | _____________ |
| Firm OS | ___ | _____________ |
| Client Portal | ___ | _____________ |
| Mercado Pago | ___ | _____________ |
| IA Jurídica | ___ | _____________ |
| Jitsi | ___ | _____________ |
| Seguridad | ___ | _____________ |

---

### 6.2 Decisión Final

**Si todos los checks son ✅:**
🟢 SISTEMA LISTO PARA PRODUCCIÓN

**Si hay checks ❌:**
🔴 REQUIERE CORRECCIONES ANTES DE PRODUCCIÓN

**Errores encontrados:**
```
[Listar errores aquí]
```

**Acciones correctivas requeridas:**
```
[Listar acciones aquí]
```

---

## CONTACTO

**Si hay errores durante el deploy:**
1. Documentar error exacto
2. Capturar screenshot
3. Copiar logs
4. Contactar a DevOps Engineer

---

**Documento generado:** 14 de Julio de 2026  
**Instrucciones:** Ejecutar cada sección en orden  
**Próximo paso:** Comenzar con Fase 1