# CHECKLIST DE PRODUCCIÓN - PUNTO CERO LEGAL

## FASE 1: INFRAESTRUCTURA ✅

### Backend (Render.com)
- [x] `render.yaml` existe y válido
- [x] Build command correcto: `pip install -r requirements.txt`
- [x] Start command correcto: `uvicorn server:app --host 0.0.0.0 --port $PORT`
- [x] Health check configurado: `/api/health`
- [x] Endpoint health check implementado en FastAPI
- [ ] **PENDIENTE**: Probar en Render con variables reales
- [ ] **PENDIENTE**: Verificar logs post-deploy

### Frontend (Vercel)
- [x] `vercel.json` existe y válido
- [x] Build command correcto: `npm run build`
- [x] Output directory correcto: `build`
- [x] SPA rewrite configurado
- [ ] **PENDIENTE**: Probar en Vercel con variables reales
- [ ] **PENDIENTE**: Verificar logs post-deploy

### GitHub
- [ ] **NO ENCONTRADO**: .github/workflows/ (NO hay CI/CD automatizado)
- [ ] **NO ENCONTRADO**: Branch protection rules
- [ ] **ACCIÓN RECOMENDADA**: Configurar GitHub Actions para CI/CD si es crítico

---

## FASE 2: VARIABLES DE ENTORNO PRODUCCIÓN

### Backend (Render)
**Variables CRÍTICAS (deben estar configuradas):**

```
MONGO_URL=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>
SECRET_KEY=<cadena-larga-aleatoria-cambiar>
JWT_SECRET=<cadena-larga-aleatoria-cambiar>
CORS_ORIGINS=https://punto-cero-legal.vercel.app,https://www.puntocerolegal.com
APP_PUBLIC_URL=https://puntocero-legal-api.onrender.com
```

**Variables de INTEGRACIONES:**

```
GEMINI_API_KEY=<key-google-gemini>
ANTHROPIC_API_KEY=<key-anthropic>
META_APP_ID=<meta-app-id>
META_APP_SECRET=<meta-app-secret>
META_PHONE_NUMBER_ID=<phone-id>
META_ACCESS_TOKEN=<access-token-permanente>
META_WHATSAPP_NUMBER=+<numero>
META_VERIFY_TOKEN=<token-para-webhook>
META_GRAPH_VERSION=v21.0
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email@gmail.com>
SMTP_PASS=<contraseña-app-16-chars>
SMTP_FROM=<email@gmail.com>
MP_ACCESS_TOKEN=<mercadopago-token>
MP_PUBLIC_KEY=<mercadopago-public-key>
GOOGLE_SERVICE_ACCOUNT_JSON=<json-service-account>
GOOGLE_DRIVE_FOLDER_ID=<folder-id>
```

**Variables OPCIONALES (tienen defaults):**

```
DB_NAME=puntocero_legal (default: puntocero_legal)
GEMINI_MODEL=gemini-flash-latest (default)
CLAUDE_MODEL=claude-opus-4-8 (default)
JWT_ALGORITHM=HS256 (default)
JWT_EXPIRATION_HOURS=24 (default)
JWT_REFRESH_EXPIRATION_DAYS=7 (default)
AI_RATE_LIMIT_MINUTE=20 (default)
AI_RATE_LIMIT_HOUR=200 (default)
AI_RATE_LIMIT_DAY=1000 (default)
```

**Checklist de configuración:**
- [ ] MONGO_URL apunta a MongoDB Atlas
- [ ] SECRET_KEY y JWT_SECRET son cadenas seguras (>32 chars, aleatorias)
- [ ] CORS_ORIGINS incluye dominio de Vercel y dominio personalizado
- [ ] APP_PUBLIC_URL es URL exacta de Render
- [ ] GEMINI_API_KEY y ANTHROPIC_API_KEY configuradas (o IA deshabilitada)
- [ ] META_* configurados para WhatsApp (o WhatsApp deshabilitado)
- [ ] SMTP_* configurados para email (o email deshabilitado)
- [ ] MP_ACCESS_TOKEN configurado para Mercado Pago (o pagos deshabilitados)
- [ ] GOOGLE_* configurados si Drive backup es requerido

### Frontend (Vercel)
**Variables CRÍTICAS:**

```
REACT_APP_BACKEND_URL=https://puntocero-legal-api.onrender.com
```

**Variables OPCIONALES (tienen defaults):**

```
REACT_APP_STORAGE_KEY=<passphrase-encryption> (opcional)
REACT_APP_ENABLE_MOCKS=false (default)
REACT_APP_ENABLE_ORGANIZATIONS_API=true (default)
... (todos los REACT_APP_ENABLE_* = true por default)
```

**Checklist:**
- [ ] REACT_APP_BACKEND_URL apunta a Render backend en producción
- [ ] Variables de feature flags revisadas

---

## FASE 3: INTEGRACIONES

### Mercado Pago
- [x] Rutas detectadas: `/payment`, `/invoices`, `/webhook/mercadopago`
- [x] Servicios: `payment_provider_service.py`, `webhook_handler.py`
- [ ] **PENDIENTE**: Configurar MP_ACCESS_TOKEN en Render
- [ ] **PENDIENTE**: Configurar MP_PUBLIC_KEY en Render
- [ ] **PENDIENTE**: Probar flujo de pago en staging
- [ ] **PENDIENTE**: Configurar webhook en Mercado Pago apuntando a Render

### IA Legal (Gemini + Claude)
- [x] Rutas detectadas: `/ai/chat`, `/ai/usage`
- [x] Fallback Gemini→Claude configurado
- [ ] **PENDIENTE**: Configurar GEMINI_API_KEY
- [ ] **PENDIENTE**: Configurar ANTHROPIC_API_KEY (fallback)
- [ ] **PENDIENTE**: Probar chat IA en staging
- [ ] **PENDIENTE**: Verificar rate limiting (20/min, 200/h, 1000/día)

### WhatsApp (Meta Cloud API)
- [x] Rutas detectadas: `/chatbot/webhook/whatsapp` (GET/POST)
- [x] Notificador implementado en `backend/utils/notifier.py`
- [ ] **PENDIENTE**: Configurar META_* en Render
- [ ] **PENDIENTE**: Configurar webhook en Meta Apps Console
- [ ] **PENDIENTE**: Probar envío de mensaje por WhatsApp

### Email (SMTP)
- [x] Servicio implementado en `backend/utils/notifier.py`
- [x] Usa smtplib nativo
- [ ] **PENDIENTE**: Configurar SMTP_* en Render
- [ ] **PENDIENTE**: Usar contraseña de app (Google Apps: 16 caracteres)
- [ ] **PENDIENTE**: Probar envío de email en staging

### Google Drive (Backups)
- [x] Servicio en `backend/utils/drive_service.py`
- [x] Usado en rutas: `/documents`, `/backup`
- [ ] **PENDIENTE**: Configurar GOOGLE_SERVICE_ACCOUNT_JSON
- [ ] **PENDIENTE**: Configurar GOOGLE_DRIVE_FOLDER_ID
- [ ] **PENDIENTE**: Probar upload de documento en staging
- [ ] **PENDIENTE**: Probar backup automático

---

## FASE 4: SEGURIDAD

### JWT / Autenticación
- [x] Validación de Bearer token implementada
- [x] Token expiration: 24h (configurable)
- [x] Refresh token: 7 días (configurable)
- [x] Fallback seguro para desarrollo
- [ ] **VERIFICAR**: SECRET_KEY y JWT_SECRET son diferentes en producción
- [ ] **VERIFICAR**: Tokens no exponen información sensible

### Multi-tenancy
- [x] TenantIsolationMiddleware registrado en bootstrap
- [x] TenantKernel valida contexto antes de cada request
- [x] Índices de tenant en MongoDB
- [ ] **PROBAR**: Aislamiento entre tenants en staging
- [ ] **PROBAR**: No se filtra data cross-tenant

### CORS
- [x] Configurado en FastAPI
- [ ] **VERIFICAR**: CORS_ORIGINS no es "*" en producción
- [ ] **VERIFICAR**: Solo dominios autorizados

### Rate Limiting
- [x] slowapi configurado
- [x] Límites en `/ai/chat`: 20/min, 200/h, 1000/día
- [ ] **VERIFICAR**: Otros endpoints tienen rate limits si es necesario

### Validaciones
- [x] Pydantic models para inputs
- [x] Bleach para sanitización HTML
- [ ] **PROBAR**: XSS protection en formularios
- [ ] **PROBAR**: SQL injection imposible (MongoDB no tiene SQL)

---

## FASE 5: BASE DE DATOS

### MongoDB Local
- [x] docker-compose.yml válido
- [x] Volumen `mongodb_data` configurado
- [ ] **EJECUTAR**: `docker-compose up mongodb` para desarrollo

### MongoDB Atlas (Producción)
- [ ] Cluster creado en MongoDB Atlas
- [ ] Usuario creado con permisos correctos
- [ ] Connection string generado
- [ ] Network access permitido para Render
- [ ] Backups automáticos habilitados
- [ ] **CONFIGURAR**: MONGO_URL en Render

### Índices
- [x] Índices definidos en `server.py`
- [x] Índices definidos en migraciones
- [ ] **PROBAR**: Índices creados en producción MongoDB
- [ ] **VERIFICAR**: Performance de queries con índices

---

## FASE 6: DESPLIEGUE

### Render (Backend)
- [ ] Conectar repositorio GitHub a Render
- [ ] Seleccionar rama: `main` o `staging`
- [ ] Environment variables configuradas
- [ ] Deploy automático activado
- [ ] Verificar logs: `uvicorn server:app` inicia sin errores
- [ ] Probar `/api/health` retorna 200
- [ ] Probar `/api/auth/login` funciona

### Vercel (Frontend)
- [ ] Conectar repositorio GitHub a Vercel
- [ ] Seleccionar rama: `main` o `staging`
- [ ] Environment variables configuradas
- [ ] Deploy automático activado
- [ ] Build no tiene warnings/errors
- [ ] Verificar página carga sin errores JavaScript
- [ ] Verificar REACT_APP_BACKEND_URL resuelve correctamente

### GitHub
- [ ] Protecciones de rama configuradas (optional)
- [ ] Ramas `main` y `staging` protegidas (optional)
- [ ] Webhooks para Render/Vercel configurados

---

## FASE 7: SMOKE TESTS (POST-DEPLOY)

### Acceso y Autenticación
- [ ] Página de login carga sin errores
- [ ] Login con usuario válido funciona
- [ ] JWT token se genera correctamente
- [ ] Redirect a dashboard después de login
- [ ] Logout limpia sesión

### Dashboard Lawyer
- [ ] Dashboard carga sin errores
- [ ] Panel de expedientes visible
- [ ] Crear nuevo expediente funciona
- [ ] Ver detalles del expediente funciona
- [ ] Actualizar expediente funciona

### Panel Admin
- [ ] Admin panel carga sin errores
- [ ] System OS widgets visibles
- [ ] Data de usuarios/firmas/casos cargan

### IA Legal
- [ ] Chat IA carga sin errores (si key configurada)
- [ ] Enviar mensaje a IA funciona
- [ ] Respuesta de IA recibida correctamente

### Otros módulos
- [ ] Facturación carga y lista facturas
- [ ] Documentos carga y permite upload
- [ ] Calendario/Agenda funciona
- [ ] Configuración de usuario funciona

---

## FASE 8: MONITOREO POST-PRODUCCIÓN

### Logs
- [ ] Render: revisar logs de startup en dashboard
- [ ] Vercel: revisar logs de build y runtime
- [ ] Verificar no hay errores en logs
- [ ] Verificar bootstrap enterprise completado

### Errores
- [ ] Configurar alertas en Render para 5xx errors
- [ ] Configurar alertas en Vercel para build failures
- [ ] Revisar Sentry o equivalente si está configurado

### Performance
- [ ] Tiempo de respuesta de `/api/health` < 500ms
- [ ] Tiempo de load del frontend < 3s
- [ ] Verificar no hay N+1 queries en MongoDB

---

## ESTADO ACTUAL

| Componente | Status | Acción |
|-----------|--------|--------|
| Backend (Render) | ✅ Listo | Desplegar con variables |
| Frontend (Vercel) | ✅ Listo | Desplegar con variables |
| Código | ✅ Sin bloqueadores | N/A |
| Variables de entorno | ⏳ Parcial | Configurar en plataformas |
| Integraciones | ⏳ Detectadas | Configurar API keys |
| Seguridad | ✅ Implementada | Verificar en staging |
| Tests | ⏳ Existen | Ejecutar antes de prod |
| CI/CD | ❌ No existe | GitHub Actions (opcional) |

---

## SIGUIENTES PASOS

1. **Levantar MongoDB local**: `docker-compose up`
2. **Instalar dependencias**: 
   - Backend: `cd backend && pip install -r requirements.txt`
   - Frontend: `cd frontend && npm install`
3. **Pruebas locales**: Verificar que backend y frontend arrancan
4. **Configurar staging en Render/Vercel**: Con variables de desarrollo
5. **Smoke tests en staging**: Validar todas las integraciones
6. **Configurar producción**: Con variables y secrets reales
7. **Deploy a producción**: Primero backend, luego frontend
8. **Monitoreo**: Establecer alertas y logs

---

## NOTAS IMPORTANTES

- **Sin CI/CD**: El proyecto actualmente no tiene GitHub Actions. Los deploys son manuales vía UI de Render/Vercel.
- **Variables sensibles**: NUNCA comitear `.env` o secrets en GitHub.
- **Fallbacks en desarrollo**: El código tiene fallbacks seguros para desarrollo local (no aplica a producción).
- **Rate limiting**: IA está limitada a evitar costos excesivos.
- **MongoDB fallback**: Si Mongo no conecta, el backend cae a base de datos en memoria (solo para dev, no para producción).

---

**CERTIFICACIÓN**: Punto Cero Legal está **LISTO PARA DESPLIEGUE** una vez configuradas las variables de entorno en Render y Vercel.
