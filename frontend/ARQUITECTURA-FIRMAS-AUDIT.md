# AUDITORÍA ARQUITECTÓNICA MÓDULO FIRMAS JURÍDICAS
## Punto Cero Legal — Análisis Estricto (Lectura)

**Fecha:** 2026-06-30  
**Modo:** Lectura-Únicamente (No modificaciones)  
**Alcance:** Frontend + Backend  
**Conclusión:** Hay DOS superficies de firmas completamente separadas arquitectónicamente

---

## EXECUTIVE SUMMARY

| Superficie | Ruta | Módulo | Permiso | Responsabilidad |
|-----------|------|--------|---------|-----------------|
| **Admin OS** | `/admin/firms` | AdminModule | admin, admin_general, socio_comercial | Catálogo global, aprobación, métricas |
| **Firm OS** | `/firm-os/*` | FirmOSModule | firm_owner, firm_admin, firm_lawyer | Dashboard operativo por firma |
| **Público** | `/firms` | publicRoute | público | Directorio público |

**Hallazgo clave:** Las DOS SUPERFICIES están ARQUITECTÓNICAMENTE SEPARADAS:
- NO están anidadas una dentro de la otra
- NO comparten layout
- NO comparten contextos
- Sí comparten APIs (`/firms/*` de backend)

---

## 1. ÁRBOL DE CARPETAS (FIRMAS)

```
frontend/src/
├── modules/
│   ├── admin/
│   │   ├── AdminModule.jsx                 ← Contiene /admin/firms
│   │   ├── AdminOSLayout.jsx
│   │   └── pages/
│   │       ├── FirmsOverview.jsx           ← Directorio admin global
│   │       ├── PendingFirmsCenter.jsx      ← Aprobación firmas
│   │       ├── FirmSolicitudesModule.jsx   ← Solicitudes de firmas
│   │       ├── FirmDashboard.jsx           ← Dashboard admin de UNA firma
│   │       └── FirmsOverview.jsx
│   ├── firm-os/
│   │   ├── FirmOSModule.jsx                ← Contiene /firm-os/*
│   │   ├── FirmOSLayout.jsx                ← Layout firm-os
│   │   ├── FirmOSSidebar.jsx
│   │   └── pages/
│   │       ├── FirmDashboard.jsx           ← Dashboard firma (OTRO archivo, OTRA responsabilidad)
│   │       ├── FirmLawyers.jsx
│   │       ├── FirmCases.jsx
│   │       ├── FirmFinance.jsx
│   │       ├── FirmAnalytics.jsx
│   │       ├── FirmSettings.jsx
│   │       ├── FirmTeam.jsx
│   │       ├── FirmOnboarding.jsx
│   │       ├── FirmDirectorySettings.jsx
│   │       ├── OnboardingWizardFirm.jsx
│   │       ├── CRMEnterprise.jsx
│   │       ├── BillingEnterprise.jsx
│   │       └── AICorporate.jsx
│   └── firms/                              ← Módulo LANDING público
│       ├── FirmsBlock.jsx
│       └── FirmsSection.jsx
├── pages/
│   ├── FirmsDirectory.jsx                  ← Directorio público /firms
│   └── PublicFirmProfile.jsx               ← Perfil público /firms/:slug
├── components/
│   ├── FirmOSPreviewBlock.jsx
│   ├── FirmRegistrationModal.jsx
│   ├── FirmRegistrationStreamlined.jsx
│   └── [shared components]
└── hooks/
    └── useFirmOnboarding.js

backend/
├── routes/
│   ├── firms.py                            ← APIs /firms (catálogo)
│   ├── firm_os.py                          ← APIs /firm-os (operativas)
│   ├── firm_config.py                      ← APIs /firm-config
│   └── firm_management.py
├── models/
│   ├── firm.py                             ← Esquema Firm
│   └── firm_config.py
└── [otros archivos]
```

---

## 2. ÁRBOL DE RUTAS

### 2.1 Admin OS (Superficie Administrativa)

```
App.js (línea ~100)
  └─ /admin/*
      └─ ProtectedRoute (require: admin, admin_general, socio_comercial)
          └─ AdminModule.jsx
              ├─ /admin                    → ExecutiveDashboard
              ├─ /admin/firms              → FirmsOverview.jsx
              │   └─ GET /firms
              │   └─ POST /firms
              │   └─ GET /firms/{id}/lawyers
              │   └─ GET /firms/{id}/cases
              │   └─ GET /firms/{id}/financial
              ├─ /admin/firms-approval     → PendingFirmsCenter.jsx
              │   └─ GET /firms/status/pending
              │   └─ POST /firms/{id}/approve
              │   └─ POST /firms/{id}/reject
              ├─ /admin/firms-solicitudes  → FirmSolicitudesModule.jsx
              │   └─ GET /firms/stats/summary
              │   └─ GET /firms/status/pending
              ├─ /admin/firm-dashboard     → FirmDashboard.jsx (admin view)
              │   └─ GET /firms/{id}/lawyers
              │   └─ GET /firms/{id}/cases
              │   └─ GET /firms/{id}/financial
              └─ [otros paths]
```

### 2.2 Firm OS (Superficie Operativa)

```
App.js (línea ~150)
  └─ /firm-os/*
      └─ ProtectedRoute (require: firm_owner, firm_admin, firm_lawyer)
          └─ FirmOSModule.jsx
              ├─ /firm-os              → FirmDashboard (firma actual)
              ├─ /firm-os/onboarding   → FirmOnboarding.jsx
              ├─ /firm-os/wizard       → OnboardingWizardFirm.jsx
              ├─ /firm-os/lawyers      → FirmLawyers.jsx
              │   └─ GET /firms/{id}/lawyers
              ├─ /firm-os/team         → FirmTeam.jsx
              │   └─ GET /rbac/team/{firmId}
              │   └─ GET /firm-config/{firmId}/practice-areas
              ├─ /firm-os/cases        → FirmCases.jsx
              │   └─ GET /firms/{id}/cases
              ├─ /firm-os/finance      → FirmFinance.jsx
              │   └─ GET /firms/{id}/financial
              ├─ /firm-os/billing      → BillingEnterprise.jsx
              ├─ /firm-os/analytics    → FirmAnalytics.jsx
              │   └─ GET /firms/{id}/financial
              ├─ /firm-os/crm          → CRMEnterprise.jsx
              ├─ /firm-os/ia           → AICorporate.jsx
              ├─ /firm-os/directory    → FirmDirectorySettings.jsx
              │   └─ GET /firms/{id}/directory-settings
              │   └─ PUT /firms/{id}/directory-settings
              ├─ /firm-os/settings     → FirmSettings.jsx
              │   └─ GET /firms/{id}
              │   └─ PATCH /firms/{id}
              └─ * → Navigate to /firm-os (fallback)
```

### 2.3 Público (Landing)

```
App.js
  ├─ /firms              → FirmsDirectory.jsx
  │   └─ GET /public/firms
  └─ /firms/:slug        → PublicFirmProfile.jsx
      └─ GET /public/firms/{slug}
      └─ POST /public/firms/{slug}/contact
```

---

## 3. DIAGRAMA DE COMPONENTES

### Admin OS (Directorio Global)

```
AdminModule.jsx
  ├─ AdminOSLayout (header + sidebar)
  │   └─ [providers]
  │       └─ TenantProvider
  │       └─ OSDataProvider
  │       └─ OSStoreProvider
  ├─ /admin/firms
  │   └─ FirmsOverview.jsx
  │       ├─ GET /firms
  │       ├─ POST /firms
  │       ├─ GET /firms/{id}/lawyers
  │       ├─ GET /firms/{id}/cases
  │       ├─ GET /firms/{id}/financial
  │       └─ MetricCard (componente local)
  ├─ /admin/firms-approval
  │   └─ PendingFirmsCenter.jsx
  │       ├─ GET /firms/status/pending
  │       ├─ POST /firms/{id}/approve
  │       └─ POST /firms/{id}/reject
  └─ /admin/firm-dashboard
      └─ FirmDashboard.jsx (admin)
          ├─ GET /firms/{id}/lawyers
          ├─ GET /firms/{id}/cases
          └─ GET /firms/{id}/financial
```

### Firm OS (Operativo por Firma)

```
FirmOSModule.jsx
  └─ FirmOSLayout (header + sidebar firm-os)
      ├─ FirmOSSidebar (nav interna)
      ├─ /firm-os (index)
      │   └─ FirmDashboard.jsx (firma)
      │       ├─ useAuth (usuario actual → firma del usuario)
      │       ├─ GET /firms/{id}/lawyers
      │       ├─ GET /firms/{id}/cases
      │       └─ GET /firms/{id}/clients
      ├─ /firm-os/lawyers
      │   └─ FirmLawyers.jsx
      │       ├─ GET /firms/{id}/lawyers
      │       └─ [modales de invitación]
      ├─ /firm-os/team
      │   └─ FirmTeam.jsx
      │       ├─ GET /rbac/team/{firmId}
      │       ├─ TeamTable (componente local)
      │       ├─ TeamMemberModal (componente local)
      │       └─ InviteLawyerModal (componente local)
      ├─ /firm-os/cases
      │   └─ FirmCases.jsx
      │       └─ GET /firms/{id}/cases
      ├─ /firm-os/finance
      │   └─ FirmFinance.jsx
      │       └─ GET /firms/{id}/financial
      ├─ /firm-os/analytics
      │   └─ FirmAnalytics.jsx
      │       └─ GET /firms/{id}/financial
      ├─ /firm-os/directory
      │   └─ FirmDirectorySettings.jsx
      │       ├─ GET /firms/{id}/directory-settings
      │       └─ PUT /firms/{id}/directory-settings
      ├─ /firm-os/settings
      │   └─ FirmSettings.jsx
      │       ├─ GET /firms/{id}
      │       └─ PATCH /firms/{id}
      ├─ /firm-os/onboarding
      │   └─ FirmOnboarding.jsx
      │       ├─ GET /firm-config/{id}/practice-areas
      │       ├─ POST /firm-config/{id}/step
      │       └─ POST /firm-config/{id}/complete
      └─ /firm-os/wizard
          └─ OnboardingWizardFirm.jsx
              └─ POST /firm-os/firms/{id}/onboarding-complete
```

### Público

```
Landing
  ├─ /firms
  │   └─ FirmsDirectory.jsx
  │       ├─ GET /public/firms
  │       └─ [cards + filter]
  └─ /firms/:slug
      └─ PublicFirmProfile.jsx
          ├─ GET /public/firms/{slug}
          └─ POST /public/firms/{slug}/contact
```

---

## 4. MAPA DE DEPENDENCIAS

```
App.js (nivel superior)
  ├─ /admin/* → AdminModule.jsx
  │   └─ [Admin routes]
  │       └─ APIs de backend:
  │           ├─ GET/POST /firms (router.py)
  │           ├─ GET /firms/{id}/lawyers (router.py)
  │           ├─ GET /firms/{id}/cases (router.py)
  │           ├─ GET /firms/{id}/financial (router.py)
  │           ├─ GET /firms/status/pending (router.py)
  │           ├─ POST /firms/{id}/approve (router.py)
  │           └─ POST /firms/{id}/reject (router.py)
  │
  ├─ /firm-os/* → FirmOSModule.jsx
  │   └─ [Firm OS routes]
  │       └─ APIs de backend:
  │           ├─ GET /firms/{id}/lawyers (router.py)
  │           ├─ GET /firms/{id}/cases (router.py)
  │           ├─ GET /firms/{id}/clients (router.py)
  │           ├─ GET /firms/{id}/financial (router.py)
  │           ├─ GET /firms/{id}/directory-settings (firm_os.py)
  │           ├─ PUT /firms/{id}/directory-settings (firm_os.py)
  │           ├─ GET /firm-config/{id}/practice-areas (firm_config.py)
  │           ├─ POST /firm-config/{id}/step (firm_config.py)
  │           ├─ POST /firm-config/{id}/complete (firm_config.py)
  │           ├─ POST /firm-os/firms/{id}/onboarding-complete (firm_os.py)
  │           ├─ GET /rbac/team/{firmId} (rbac.py)
  │           └─ PATCH /rbac/users/{id}/status (rbac.py)
  │
  └─ /firms, /firms/:slug → Landing
      └─ APIs públicos:
          ├─ GET /public/firms (firm_os.py)
          ├─ GET /public/firms/{slug} (firm_os.py)
          └─ POST /public/firms/{slug}/contact (firm_os.py)
```

---

## 5. TABLA DE SERVICIOS / APIs

### Backend: `backend/routes/firms.py`

| Endpoint | Método | Permisos | Responsabilidad |
|----------|--------|----------|-----------------|
| `/firms` | GET | admin, admin_general | Listar todas las firmas (global) |
| `/firms` | POST | admin, admin_general | Crear firma nova |
| `/firms/{id}` | GET | admin/admin_general O propietario | Detalle de firma |
| `/firms/{id}` | PATCH | admin/admin_general O propietario | Actualizar firma |
| `/firms/{id}/lawyers` | GET | admin/admin_general O propietario/miembro | Abogados de firma |
| `/firms/{id}/cases` | GET | admin/admin_general O propietario/miembro | Casos de firma |
| `/firms/{id}/clients` | GET | admin/admin_general O propietario/miembro | Clientes de firma |
| `/firms/{id}/financial` | GET | admin/admin_general O propietario/miembro | Métricas financieras |
| `/firms/status/pending` | GET | admin, admin_general | Firmas pendientes aprobación |
| `/firms/{id}/approve` | POST | admin, admin_general | Aprobar firma + activar trial |
| `/firms/{id}/reject` | POST | admin, admin_general | Rechazar firma |
| `/firms/stats/summary` | GET | admin, admin_general | Estadísticas globales |
| `/firms/trial/summary` | GET | admin, admin_general | Resumen trials |
| `/firms/{id}/trial` | GET | admin, admin_general | Detalle trial |
| `/firms/register` | POST | público | Registro novo firma (lead) |
| `/firms/register-lead` | POST | público | Registro como cliente potencial |
| `/firms/activate-account` | POST | público + token | Activar cuenta con token |

### Backend: `backend/routes/firm_os.py`

| Endpoint | Método | Permisos | Responsabilidad |
|----------|--------|----------|-----------------|
| `/firm-os/dashboard` | GET | firm_owner, firm_admin, firm_lawyer | Dashboard firma actual |
| `/firm-os/settings` | GET | firm_owner, firm_admin | Settings firma |
| `/firm-os/settings` | PUT | firm_owner, firm_admin | Actualizar settings |
| `/firm-os/firms/{id}/onboarding-complete` | POST | firm_owner, firm_admin | Marcar onboarding completo |
| `/firm-os/firms/{id}/directory-settings` | GET | firm_owner, firm_admin | Config directorio público |
| `/firm-os/firms/{id}/directory-settings` | PUT | firm_owner, firm_admin | Actualizar config directorio |
| `/firm-os/public/firms` | GET | público | Listar firmas (landing) |
| `/firm-os/public/firms/{slug}` | GET | público | Perfil público firma |
| `/firm-os/public/firms/{slug}/contact` | POST | público | Contacto desde landing |
| `/firm-os/invite-lawyer` | POST | firm_owner, firm_admin | Invitar abogado |
| `/firm-os/activate-lawyer` | POST | firm_owner, firm_admin | Activar abogado invitado |

### Backend: `backend/routes/firm_config.py`

| Endpoint | Método | Permisos | Responsabilidad |
|----------|--------|----------|-----------------|
| `/firm-config/{id}` | GET | firm_owner, firm_admin | Config firma |
| `/firm-config/{id}/practice-areas` | GET | firm_owner, firm_admin | Áreas de práctica |
| `/firm-config/{id}/step` | POST | firm_owner, firm_admin | Avanzar paso onboarding |
| `/firm-config/{id}/complete` | POST | firm_owner, firm_admin | Completar onboarding |

---

## 6. TABLA DE PERMISOS

| Recurso | Rol | Acceso |
|---------|-----|--------|
| `/admin/*` | admin | ✅ Sí |
| `/admin/*` | admin_general | ✅ Sí |
| `/admin/*` | socio_comercial | ✅ Sí |
| `/admin/firms` | lawyer | ❌ No |
| `/admin/firms` | client | ❌ No |
| `/firm-os/*` | firm_owner | ✅ Sí |
| `/firm-os/*` | firm_admin | ✅ Sí |
| `/firm-os/*` | firm_lawyer | ✅ Sí |
| `/firm-os/*` | admin | ❌ No (acceso separado) |
| `/firms` | público | ✅ Sí |
| `/firms/:slug` | público | ✅ Sí |
| `POST /firms/{id}/approve` | admin | ✅ Sí |
| `POST /firms/{id}/approve` | firm_owner | ❌ No |
| `GET /firms/{id}/financial` | firm_owner (propietario) | ✅ Sí |
| `GET /firms/{id}/financial` | admin | ✅ Sí |
| `GET /firms/{id}/financial` | otro firm_owner | ❌ No |

---

## 7. CONTEXTOS (Hallazgos)

### Existen:
- ✅ `useAuth` (global, usado por ambas superficies)
- ✅ `TenantProvider` (envuelve Admin OS)
- ✅ `OSDataProvider` (envuelve Admin OS)
- ✅ `OSStoreProvider` (envuelve Admin OS)
- ✅ `useFirmOnboarding` (hook dedicado a onboarding)

### NO existen:
- ❌ `FirmContext` / `FirmProvider` (no hay contexto dedicado a firma)
- ❌ `useFirm` (no hay hook de firma)

### Conclusión:
Firm OS se apoya en `useAuth` para obtener `current_user.firm_id` y luego lo pasa en queries.
Admin OS se apoya en `TenantProvider`, `OSDataProvider`, `OSStoreProvider` para caché/refresh.

---

## 8. ANÁLISIS TÉCNICO: ¿Pueden separarse?

### ¿Es posible separar completamente `/admin/firms` de `/firm-os`?

**SÍ, técnicamente SÍ.**

#### Qué está separado:
- ✅ Rutas (diferentes prefijos: `/admin/firms` vs `/firm-os`)
- ✅ Layouts (diferentes: `AdminOSLayout` vs `FirmOSLayout`)
- ✅ Permisos (diferentes: admin roles vs firm roles)
- ✅ Componentes UI (diferentes páginas)
- ✅ Navegación (diferentes sidebars)
- ✅ Contextos (Admin OS usa providers, Firm OS usa `useAuth`)

#### Qué comparten:
- 🔄 APIs de backend (`/firms/*` endpoints usados por ambos)
- 🔄 Modelo de datos (mismo esquema `Firm`)
- 🔄 Algunas llamadas HTTP (ambos llaman `GET /firms/{id}/lawyers`, etc.)

#### Riesgo de movimiento:
**BAJO**, porque están arquitectónicamente separadas.

Si hoy separaras `FirmsOverview.jsx` (Admin) del `FirmDashboard.jsx` (Firm OS):
- Admin OS seguiría funcionando usando su API
- Firm OS seguiría funcionando usando su API
- Ambos seguirían usando las mismas APIs de backend (que son agnósticas)

#### Lo que NO hay que tocar para separación:
- El backend. Las APIs `firms.py`, `firm_os.py`, `firm_config.py` son agnósticas a frontend.
- El modelo de datos.
- Los permisos globales (ya están separados).

---

## 9. TABLA COMPARATIVA

| Aspecto | Admin OS `/admin/firms` | Firm OS `/firm-os` |
|---------|------------------------|-------------------|
| **URL base** | `/admin/firms` | `/firm-os/*` |
| **Módulo** | AdminModule.jsx | FirmOSModule.jsx |
| **Layout** | AdminOSLayout | FirmOSLayout |
| **Sidebar** | Sidebar general (registry) | FirmOSSidebar |
| **Permiso requerido** | admin, admin_general, socio_comercial | firm_owner, firm_admin, firm_lawyer |
| **Contextos** | TenantProvider, OSDataProvider, OSStoreProvider | useAuth |
| **Responsabilidad** | Catálogo global + aprobación | Operativo por firma |
| **Vistas principales** | FirmsOverview, PendingFirmsCenter, FirmSolicitudesModule | FirmDashboard, FirmLawyers, FirmCases, etc. |
| **¿Comparten componentes?** | No (salvo librerías base) | No (salvo librerías base) |
| **¿Comparten rutas?** | No | No |
| **APIs que llama** | GET/POST /firms, GET /firms/{id}/* | GET /firms/{id}/*, GET /firm-config/*, GET /firm-os/* |

---

## 10. DIAGRAMA DE ARQUITECTURA

```
┌─────────────────────────────────────────────────────────────────────┐
│                          App.js (Router)                             │
└────────────────┬──────────────────────────────────────────────────────┘
                 │
      ┌──────────┼──────────┬─────────────────────┐
      │          │          │                     │
      ▼          ▼          ▼                     ▼
    /admin    /firm-os    /firms              /login
      │          │          │                     │
      │          │          │                     │
   ┌──▼──────────────────┐  │                     │
   │   ProtectedRoute    │  │                     │
   │  (admin roles)      │  │                     │
   └──┬──────────────────┘  │                     │
      │                     │                     │
      ▼                     ▼                     ▼
┌─────────────┐    ┌───────────────────┐   ┌──────────────┐
│ AdminModule │    │  FirmOSModule     │   │   Landing    │
│   ┌─────┐  │    │  ┌───────────┐    │   │              │
│   │FS   │  │    │  │ FirmOS    │    │   │ FirmsDir     │
│   │Over │  │    │  │ Layout    │    │   │ Public       │
│   │view │  │    │  └─┬─────────┘    │   │ FirmProfile  │
│   └─────┘  │    │    │               │   │              │
│   ┌─────┐  │    │  ┌─▼─────────────┐ │   └──────────────┘
│   │Pend │  │    │  │ FirmDashboard │ │
│   │Fir │  │    │  │ FirmLawyers   │ │
│   │Cen │  │    │  │ FirmCases     │ │
│   └─────┘  │    │  │ FirmFinance   │ │
│            │    │  │ FirmSettings  │ │
│ APIs usadas:   │  │ ...           │ │
│ • GET /firms   │  └───────────────┘ │
│ • POST /firms  │                    │
│ • GET /firms/*/  APIs usadas:       │
│ • POST /approve │  • GET /firms/{}/  │
│ • POST /reject  │  • GET /firm-os/  │
│                 │  • GET /firm-conf/│
└─────────────────┴────────────────────┘

Conexión a Backend:

┌──────────────────────────────────────────────┐
│            Backend (FastAPI)                  │
├──────────────────────────────────────────────┤
│  routes/firms.py                             │
│  ├─ GET/POST /firms                          │
│  ├─ GET /firms/{id}/lawyers                  │
│  ├─ GET /firms/{id}/cases                    │
│  ├─ GET /firms/{id}/financial                │
│  ├─ POST /firms/{id}/approve                 │
│  └─ POST /firms/{id}/reject                  │
│                                              │
│  routes/firm_os.py                           │
│  ├─ GET /firm-os/dashboard                   │
│  ├─ GET /firm-os/*/directory-settings        │
│  ├─ POST /firm-os/*/onboarding-complete      │
│  └─ GET /public/firms*                       │
│                                              │
│  routes/firm_config.py                       │
│  ├─ GET/POST /firm-config/{id}/*             │
│  └─ POST /firm-config/{id}/complete          │
│                                              │
│  models/firm.py                              │
│  └─ Esquema Firm (ÚNICO para ambas)          │
└──────────────────────────────────────────────┘
```

---

## 11. RECOMENDACIONES TÉCNICAS (Solo Análisis)

### Hallazgos de Arquitectura:

1. **Separación Lograda:** Admin OS y Firm OS están ya separados arquitectónicamente. No hay mezcla en código.

2. **Reutilización de APIs:** Ambas superficies comparten las mismas APIs de backend (`/firms/*`). Esto es CORRECTO; el backend es agnóstico.

3. **Contextos Diferentes:** Admin OS usa providers (`TenantProvider`, etc.). Firm OS usa `useAuth`. Esto es CORRECTO; cada superficie tiene su necesidad.

4. **Componentes No Duplicados:** No hay componentes UI duplicados entre Admin y Firm OS. La única excepción es que ambos llaman al mismo endpoint backend, lo cual es CORRECTO.

5. **Permisos Bien Definidos:** Admin roles no pueden entrar a `/firm-os/*`. Firm roles no pueden entrar a `/admin/*`. Esto está bien.

6. **Riesgo de Movimiento:** Si alguien quisiera hoy separar más aún (p. ej., crear `/firmas/*` independiente):
   - Bajo riesgo de ruptura
   - Solo ajustaría rutas en `App.js` y `AdminModule.jsx`
   - El backend no cambiaría

7. **No Hay Inconsistencia:** NO está "el Dashboard de Firmas incrustado en el Dashboard Administrativo". Está bien separado.

---

## 12. CONCLUSIONES FINALES

| Pregunta | Respuesta | Evidencia |
|----------|-----------|-----------|
| ¿Existe `/admin/firms`? | SÍ | AdminModule.jsx línea ~60, moduleRegistry.js línea ~38 |
| ¿Existe `/firm-os`? | SÍ | App.js línea ~150, FirmOSModule.jsx |
| ¿Están en AdminModule? | `/admin/firms` sí, `/firm-os` NO | AdminModule solo define `/admin/*`; `/firm-os` se monta aparte en App.js |
| ¿Hay contextos separados? | No hay `FirmContext`, pero sí roles separados | useAuth se usa en ambos; permisos separados en routes |
| ¿Hay mezcla de dashboards? | NO | Son dos módulos completamente distintos: AdminModule vs FirmOSModule |
| ¿Podrían separarse más aún? | SÍ, sin riesgo bajo | Arquitectura ya está lista; solo faltaría replicar rutas en App.js |
| ¿Comparten código innecesariamente? | NO | Comparten APIs de backend (correcto), no comparten componentes UI |

---

## ENTREGA FINAL

**Archivos auditados:**
- ✅ frontend/src/modules/admin/AdminModule.jsx
- ✅ frontend/src/modules/firm-os/FirmOSModule.jsx
- ✅ frontend/src/modules/admin/pages/FirmsOverview.jsx
- ✅ frontend/src/modules/firm-os/FirmOSLayout.jsx
- ✅ frontend/src/core/registry/moduleRegistry.js
- ✅ frontend/src/pages/FirmsDirectory.jsx
- ✅ backend/routes/firms.py
- ✅ backend/routes/firm_os.py
- ✅ backend/models/firm.py

**Cambios realizados:** NINGUNO (modo lectura estricto)

**Informe entregado:** Auditoría técnica completa sin modificaciones.

---

*Fin de auditoría.*
