# 📍 RUTAS DE TODOS LOS DASHBOARDS

**Base URL:** `http://127.0.0.1:3000`

**Credenciales:**
- Usuario: `admin@puntocerolegal.com`
- Contraseña: `Admin2025!`

---

## 🔐 AUTENTICACIÓN

| Ruta | Descripción |
|------|-------------|
| `http://127.0.0.1:3000/login` | Pantalla de login |
| `http://127.0.0.1:3000/register` | Registro de usuario |
| `http://127.0.0.1:3000/change-password-required` | Cambio de contraseña obligatorio |

---

## 🏠 LANDING & PÚBLICOS

| Ruta | Descripción |
|------|-------------|
| `http://127.0.0.1:3000/` | Landing page |
| `http://127.0.0.1:3000/firms` | Directorio público de firmas |
| `http://127.0.0.1:3000/firms/:slug` | Perfil público de firma |
| `http://127.0.0.1:3000/portal` | Portal público |
| `http://127.0.0.1:3000/portal/:code` | Portal con código |

---

## ⚖️ DASHBOARD LAWYER (Abogados)

**Requiere rol:** `lawyer` o `client`

| Ruta | Descripción |
|------|-------------|
| `http://127.0.0.1:3000/dashboard` | Home dashboard lawyer |
| `http://127.0.0.1:3000/dashboard/crm` | CRM Jurídico |
| `http://127.0.0.1:3000/dashboard/cases` | Gestión de casos |
| `http://127.0.0.1:3000/dashboard/clients` | Directorio de clientes |
| `http://127.0.0.1:3000/dashboard/agenda` | Calendario/Agenda |
| `http://127.0.0.1:3000/dashboard/ai` | Asistente IA Legal |
| `http://127.0.0.1:3000/dashboard/meetings` | Videoreuniones |
| `http://127.0.0.1:3000/dashboard/invoices` | Facturas y billing |
| `http://127.0.0.1:3000/dashboard/documents` | Gestión de documentos |
| `http://127.0.0.1:3000/dashboard/settings` | Configuración personal |

---

## 🏢 DASHBOARD FIRM OS (Firmas Empresariales)

**Requiere rol:** `firm_owner`, `firm_admin`, o `firm_lawyer`

### Core Features
| Ruta | Descripción |
|------|-------------|
| `http://127.0.0.1:3000/firm-os` | Home - Dashboard principal |
| `http://127.0.0.1:3000/firm-os/crm` | CRM Jurídico empresarial |
| `http://127.0.0.1:3000/firm-os/cases` | Gestión de casos |
| `http://127.0.0.1:3000/firm-os/clients` | Directorio de clientes |
| `http://127.0.0.1:3000/firm-os/agenda` | Calendario/Agenda |
| `http://127.0.0.1:3000/firm-os/ai` | IA Jurídica empresarial |
| `http://127.0.0.1:3000/firm-os/meetings` | Videoreuniones |
| `http://127.0.0.1:3000/firm-os/invoices` | Facturación y billing |
| `http://127.0.0.1:3000/firm-os/documents` | Gestión de documentos |
| `http://127.0.0.1:3000/firm-os/settings` | Configuración de firma |

### Enterprise Automation
| Ruta | Descripción |
|------|-------------|
| `http://127.0.0.1:3000/firm-os/automation` | Motor de automatización |
| `http://127.0.0.1:3000/firm-os/workflow-builder` | Constructor de workflows |
| `http://127.0.0.1:3000/firm-os/scheduler` | Programador de tareas |
| `http://127.0.0.1:3000/firm-os/intelligence` | Centro de inteligencia |
| `http://127.0.0.1:3000/firm-os/mission-control` | Control de misiones |
| `http://127.0.0.1:3000/firm-os/autonomous-operations` | Operaciones autónomas |
| `http://127.0.0.1:3000/firm-os/governance` | Gobernanza y cumplimiento |

---

## 👨‍💼 DASHBOARD ADMIN (Punto Cero System OS)

**Requiere rol:** `admin`, `admin_general`, o `socio_comercial`

### Control Principal
| Ruta | Descripción |
|------|-------------|
| `http://127.0.0.1:3000/admin` | PUNTO CERO SYSTEM OS - Dashboard principal |
| `http://127.0.0.1:3000/admin/master` | Control Maestro |
| `http://127.0.0.1:3000/admin/master/legacy` | AdminPanel heredado (acceso Maestro) |

### Gestión Empresarial
| Ruta | Descripción |
|------|-------------|
| `http://127.0.0.1:3000/admin/firms` | Directorio de firmas |
| `http://127.0.0.1:3000/admin/firm-dashboard` | Dashboard de firma |
| `http://127.0.0.1:3000/admin/organizations` | Organizaciones |
| `http://127.0.0.1:3000/admin/countries` | Segmentación por países |
| `http://127.0.0.1:3000/admin/verticals` | Motor multivertical |

### Gestión de Usuarios & Acceso
| Ruta | Descripción |
|------|-------------|
| `http://127.0.0.1:3000/admin/users` | Gestión de usuarios |
| `http://127.0.0.1:3000/admin/roles` | Gestión de roles |
| `http://127.0.0.1:3000/admin/permissions` | Gestión de permisos |
| `http://127.0.0.1:3000/admin/sales-room` | Directorio de abogados |

### Suscripciones & Facturación
| Ruta | Descripción |
|------|-------------|
| `http://127.0.0.1:3000/admin/subscriptions` | Suscripciones y facturación |
| `http://127.0.0.1:3000/admin/subscription-center` | Centro de suscripciones |
| `http://127.0.0.1:3000/admin/billing` | Facturación y contabilidad |
| `http://127.0.0.1:3000/admin/plans` | Motor de planes |
| `http://127.0.0.1:3000/admin/referrals` | Referidos |

### Ventas & Comercial
| Ruta | Descripción |
|------|-------------|
| `http://127.0.0.1:3000/admin/sales-command-center` | Sales Command Center |
| `http://127.0.0.1:3000/admin/commercial-ai` | IA Comercial |
| `http://127.0.0.1:3000/admin/implementations` | Implementaciones |
| `http://127.0.0.1:3000/admin/partners` | Red de agentes |

### Inteligencia & IA
| Ruta | Descripción |
|------|-------------|
| `http://127.0.0.1:3000/admin/financial-os` | Financial OS |
| `http://127.0.0.1:3000/admin/ai-copilot` | IA Legal Autopilot |
| `http://127.0.0.1:3000/admin/ai-command-center` | Copiloto IA |
| `http://127.0.0.1:3000/admin/legal-os` | Legal Operating System |
| `http://127.0.0.1:3000/admin/autonomous-control` | Autonomous & Global Legal OS |

### Operaciones & Casos
| Ruta | Descripción |
|------|-------------|
| `http://127.0.0.1:3000/admin/cases-portal` | Portal de casos |
| `http://127.0.0.1:3000/admin/inventory` | Inventario inteligente |

### Monitoreo & Seguridad
| Ruta | Descripción |
|------|-------------|
| `http://127.0.0.1:3000/admin/analytics` | Analytics Center |
| `http://127.0.0.1:3000/admin/observability` | Observability Dashboard |
| `http://127.0.0.1:3000/admin/security` | Seguridad |
| `http://127.0.0.1:3000/admin/support-access` | Accesos de soporte |
| `http://127.0.0.1:3000/admin/notifications` | Notificaciones |

---

## 📋 PÁGINAS LEGALES

| Ruta | Descripción |
|------|-------------|
| `http://127.0.0.1:3000/privacy` | Política de privacidad |
| `http://127.0.0.1:3000/cookies` | Política de cookies |
| `http://127.0.0.1:3000/terms` | Términos y condiciones |
| `http://127.0.0.1:3000/subscription-agreement` | Acuerdo de suscripción |

---

## 🔗 ONBOARDING & ACTIVACIÓN

| Ruta | Descripción |
|------|-------------|
| `http://127.0.0.1:3000/activate-firm` | Activación de firma |
| `http://127.0.0.1:3000/activate-lawyer` | Activación de abogado |
| `http://127.0.0.1:3000/verificacion-pendiente` | Verificación pendiente |
| `http://127.0.0.1:3000/checkout` | Página de checkout |

---

## 📊 RESUMEN DE DASHBOARDS

| Rol | Home | Cantidad | Rutas |
|-----|------|----------|-------|
| **Lawyer** | `/dashboard` | 10 | CRM, Cases, Clients, Agenda, AI, Meetings, Invoices, Documents, Settings |
| **Firm** | `/firm-os` | 17 | Core (10) + Automation (7) |
| **Admin** | `/admin` | 35+ | Master, Empresarial, Usuarios, Suscripciones, Ventas, IA, Ops, Monitoreo |

---

## 🚀 FLUJO DE NAVEGACIÓN RECOMENDADO

### Para Admin (Rol: admin@puntocerolegal.com)
1. **Login:** `http://127.0.0.1:3000/login`
2. **System OS:** `http://127.0.0.1:3000/admin`
3. Explorar módulos desde el sidebar

### Para Firma Empresarial
1. **Login:** `http://127.0.0.1:3000/login`
2. **Firm OS Home:** `http://127.0.0.1:3000/firm-os`
3. Navegar módulos: CRM, Cases, Automation, etc.

### Para Abogado Independiente
1. **Login:** `http://127.0.0.1:3000/login`
2. **Dashboard:** `http://127.0.0.1:3000/dashboard`
3. Navegar módulos: Cases, CRM, Documents, etc.

---

## 📌 NOTAS IMPORTANTES

- ✅ Todas las rutas requieren autenticación excepto `/`, `/login`, `/register`, `/firms`, `/privacy`, `/cookies`, `/terms`, `/subscription-agreement`
- ✅ Las rutas protegidas validan el rol del usuario automáticamente
- ✅ Si no tienes permiso para una ruta, serás redirigido al home correspondiente
- ✅ Los dashboards usan FeatureGate para controlar acceso a funcionalidades
- ✅ El backend en `http://127.0.0.1:8000` debe estar activo para que funcione completamente

---

**Última actualización:** 2025-01-21  
**Estado:** Todas las rutas documentadas desde fuente (App.js, LawyerShell, FirmShell, AdminShell)
