# ARQUITECTURA CONGELADA - FIRM OS v1.0
## Diagrama Textual del Sistema

---

## FLUJO COMPLETO

```
┌─────────────────────────────────────────────────────────────┐
│                         LANDING PAGE                         │
│                    (frontend/src/pages/)                     │
│                                                              │
│  • Información de servicios                                  │
│  • Formulario de consulta                                    │
│  • Botón: "Iniciar Sesión" → /login                          │
│  • Botón: "Registrar Firma" → /register                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      REGISTRO DE FIRMA                       │
│                    (frontend/src/components/)                │
│                                                              │
│  • FirmRegistrationStreamlined                               │
│  • Validación de datos                                       │
│  • Selección de plan                                         │
│  • Pago con Mercado Pago                                     │
│  • Creación de firma en MongoDB                              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                          LOGIN                               │
│                    (frontend/src/pages/)                     │
│                                                              │
│  • Email + Password                                          │
│  • Autenticación JWT                                         │
│  • Redirección según rol:                                    │
│    - firm_owner/admin → /firm-os                            │
│    - firm_lawyer → /firm-os                                 │
│    - admin → /admin                                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                        FIRM SHELL                            │
│                  (frontend/src/shells/firm/)                 │
│                                                              │
│  • Layout principal de Firm OS                               │
│  • FirmOSLayout component                                    │
│  • FirmOSSidebar component                                   │
│  • Protección de rutas (ProtectedRoute)                      │
│  • RBAC por roles                                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                         DASHBOARD                            │
│              (frontend/src/modules/firm-os/pages/)           │
│                                                              │
│  • Ruta: /firm-os                                           │
│  • Métricas en tiempo real:                                  │
│    - Total abogados                                          │
│    - Clientes activos                                        │
│    - Casos activos                                           │
│    - Ingresos mensuales                                      │
│    - Tareas pendientes                                       │
│  • Backend: GET /api/firm-os/dashboard                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    16 MÓDULOS MVP                             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  OPERACIONES JURÍDICAS (10 módulos - Lawyer OS)      │  │
│  │  Reutilizados directamente desde Lawyer OS           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  1.  CRM              /firm-os/crm                          │
│  2.  Cases            /firm-os/cases                        │
│  3.  Clients          /firm-os/clients                      │
│  4.  Agenda           /firm-os/agenda                       │
│  5.  AI               /firm-os/ai                           │
│  6.  Meetings         /firm-os/meetings                     │
│  7.  Invoices         /firm-os/invoices                     │
│  8.  Documents        /firm-os/documents                    │
│  9.  Settings         /firm-os/settings                     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  GESTIÓN EMPRESARIAL (6 módulos - Firm OS)           │  │
│  │  Específicos de Firm OS                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  10. Alerts Center    /firm-os/alerts                       │
│  11. Automation       /firm-os/automation                   │
│  12. Firm Team        /firm-os/team                         │
│  13. Firm Lawyers     /firm-os/lawyers                      │
│  14. Firm Analytics   /firm-os/analytics                    │
│  15. Directory        /firm-os/directory                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

---

## COMPONENTES PRINCIPALES

### Frontend
```
frontend/
├── src/
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   ├── shells/
│   │   └── firm/
│   │       ├── FirmShell.jsx
│   │       ├── FirmOSLayout.jsx
│   │       ├── FirmOSSidebar.jsx
│   │       └── firmRegistry.js
│   ├── modules/
│   │   └── firm-os/
│   │       ├── FirmOSModule.jsx
│   │       ├── pages/
│   │       │   ├── FirmDashboard.jsx
│   │       │   ├── AlertsCenter.jsx
│   │       │   ├── AutomationCenterPage.jsx
│   │       │   ├── FirmTeam.jsx
│   │       │   ├── FirmLawyers.jsx
│   │       │   ├── FirmAnalytics.jsx
│   │       │   └── FirmDirectorySettings.jsx
│   │       ├── hooks/
│   │       │   ├── useFirmCoreData.js
│   │       │   ├── useAutomation.js
│   │       │   └── useNotifications.js
│   │       └── components/
│   │           └── shared/
│   │               ├── LoadingState.jsx
│   │               └── SectionCard.jsx
│   └── contexts/
│       └── AuthContext.jsx
```

### Backend
```
backend/
├── routes/
│   ├── firm_os.py (Dashboard, Settings, Directory, Onboarding)
│   ├── auth.py (Login, Registro)
│   ├── payment.py (Mercado Pago)
│   ├── cases.py (Lawyer OS)
│   ├── clients.py (Lawyer OS)
│   ├── appointments.py (Lawyer OS)
│   ├── documents.py (Lawyer OS)
│   ├── invoices.py (Lawyer OS)
│   ├── meetings.py (Lawyer OS)
│   └── ai.py (Lawyer OS)
├── models/
│   ├── firm_models.py
│   └── [Lawyer OS models]
├── services/
│   ├── firm_service.py
│   └── [Lawyer OS services]
├── repositories/
│   ├── firm_repository.py
│   └── [Lawyer OS repositories]
└── server.py
```

### Base de Datos
```
MongoDB:
├── firms (configuración de firma)
├── firm_lawyers (abogados de la firma)
├── firm_clients (clientes de la firma)
├── firm_cases (casos de la firma)
├── firm_settings (configuraciones)
├── lawyer_invitations (invitaciones)
├── firm_contacts (contactos públicos)
├── users (usuarios)
├── clients (Lawyer OS)
├── cases (Lawyer OS)
├── appointments (Lawyer OS)
├── documents (Lawyer OS)
├── invoices (Lawyer OS)
├── meetings (Lawyer OS)
├── ai_conversations (Lawyer OS)
└── ai_messages (Lawyer OS)
```

---

## FLUJO DE DATOS

### Autenticación
```
Login → POST /api/auth/login
  ↓
Validación JWT
  ↓
Token de acceso + Refresh token
  ↓
Redirección a /firm-os
```

### Dashboard
```
FirmDashboard → useFirmCoreData()
  ↓
GET /api/firm-os/dashboard
  ↓
Queries a MongoDB:
  - firm_lawyers (count)
  - firm_clients (count)
  - firm_cases (count)
  - firm_clients (aggregate revenue)
  - firm_cases (count pending)
  ↓
Métricas calculadas
  ↓
Renderización en tiempo real
```

### Módulos Lawyer OS
```
CRMPage → useCRM()
  ↓
GET /api/crm/*
  ↓
MongoDB: clients, leads
  ↓
Datos reales
```

### Módulos Firm OS
```
AlertsCenter → useAutomation(lawyers, cases, clients)
  ↓
Procesamiento en memoria
  ↓
Reglas de automatización
  ↓
Alertas y notificaciones
```

---

## SEGURIDAD

### Autenticación
- JWT con access token (15 min)
- Refresh token (7 días)
- BCrypt para passwords
- Email verification

### Autorización
- RBAC por roles
- firm_owner: Acceso total
- firm_admin: Acceso administrativo
- firm_lawyer: Acceso a casos

### Aislamiento
- Multi-tenant por firm_id
- Cada firma ve solo sus datos
- Queries filtradas por firm_id
- Middleware de aislamiento

---

## ESTADO CONGELADO

### NO INCLUYE
- ❌ 12 módulos Enterprise (BACKLOG)
- ❌ Funcionalidades experimentales
- ❌ Mocks o datos de prueba
- ❌ Rutas sin backend

### INCLUYE
- ✅ 16 módulos MVP funcionando
- ✅ Backend real para todos
- ✅ MongoDB operativa
- ✅ Seguridad implementada
- ✅ Flujo completo funcional
- ✅ Build sin errores

---

## DEPENDENCIAS

### Externas
- Mercado Pago API
- Email Service (SMTP)
- Google Analytics
- WhatsApp API (opcional)

### Internas
- MongoDB 6.0
- FastAPI Backend
- React Frontend

---

## ESCALABILIDAD

### Horizontal
- Backend: Escalable con múltiples workers
- Frontend: CDN para assets estáticos
- MongoDB: Sharding disponible

### Vertical
- Backend: Mejora de hardware
- MongoDB: Réplicas para read scaling
- Frontend: Code splitting implementado

---

## MONITOREO

### Métricas
- Tiempo de respuesta API
- Tiempo de carga frontend
- Uso de memoria
- Conexiones MongoDB
- Errores 500
- Latencia de red

### Alertas
- Service down
- Error rate > 1%
- Response time > 500ms
- MongoDB connections > 80%
- Disk usage > 85%

---

## BACKUP

### Estrategia
- MongoDB: Backup diario automático
- Código: Git repository
- Configuración: Variables de entorno documentadas
- Base de datos: Retención 30 días

### Recuperación
- RTO: 4 horas
- RPO: 24 horas
- Procedimiento documentado
- Pruebas trimestrales

---

## FIN DE LA ARQUITECTURA

**Estado:** CONGELADA
**Versión:** 1.0.0
**Fecha:** 2026-07-11
**Commit:** 988c658