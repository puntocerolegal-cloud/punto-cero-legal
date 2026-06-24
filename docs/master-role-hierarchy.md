# MASTER ROLE HIERARCHY
## Modelo Definitivo de Jerarquía, Usuarios y Permisos del Sistema

**Documento de Arquitectura**  
**Fecha:** Junio 2026  
**Versión:** 1.0  
**Scope:** Auditoría actual + Diseño futuro sin cambios estructurales

---

## 📋 TABLA DE CONTENIDOS

1. Visión General del Modelo
2. Jerarquía Completa del Sistema
3. Roles: Mapeo Actual y Futuro
4. Matriz de Permisos por Rol
5. Estructura de Organizaciones
6. Modos de Operación del Abogado
7. Estructura de Firmas Jurídicas
8. Visibilidad de Datos por Rol
9. Relaciones y Flujos
10. Plan de Evolución

---

## 1. VISIÓN GENERAL DEL MODELO

### Principios de Diseño

```
PRINCIPIO 1: Multi-tenant por defecto
└─ Cada usuario pertenece a un tenant
└─ Cada tenant puede tener múltiples organizaciones

PRINCIPIO 2: Jerarquía de roles clara
└─ 5 roles de aplicación (app roles)
└─ 6 roles del OS (OS roles)
└─ Mapping explícito entre ambos

PRINCIPIO 3: Separación de responsabilidades
└─ Admin OS: gestión global
└─ Owner/ADMIN: gestión de tenant/organización
└─ STAFF (abogado): gestión de casos propios
└─ CLIENT: consumo de servicios

PRINCIPIO 4: Reutilizar, no reorganizar
└─ Los 5 app roles ya existen
└─ Solo agregar: relaciones formales
└─ No crear: nuevos roles core
```

---

## 2. JERARQUÍA COMPLETA DEL SISTEMA

### 2.1 Estructura Piramidal

```
┌───────────────────────────────────────────────────────────┐
│                     NIVEL 0: GLOBAL                       │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  ADMIN OS (Punto Cero Platform)                     │ │
│  │  role: "admin"                                      │ │
│  │  → OS Role: SUPER_ADMIN                             │ │
│  │  → Acceso: Toda la plataforma, cross-tenant         │ │
│  │  → Responsabilidad: Gestión global, seeds, config  │ │
│  │  → Ubicación: /admin/master/legacy, /admin/*        │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
└───────────────────────────────────────────────────────────┘
         │
         ├─ (1 por platform)
         │
         ↓
┌───────────────────────────────────────────────────────────┐
│              NIVEL 1: TENANT (Punto Cero OS)              │
│                                                           │
│  ┌──────────────────┐     ┌──────────────────┐          │
│  │ OWNER/Admin OS   │     │ Organización     │          │
│  │                  │     │                  │          │
│  │ role: "admin_gen"│     │ - Firma Jurídica │          │
│  │ → OS: OWNER      │     │ - Empresa        │          │
│  │ → Acceso: Tenant │     │ - Partner        │          │
│  │ → Gestión: Org   │     │ - Reseller       │          │
│  │ → Ubicación:     │     │ - Enterprise     │          │
│  │   /admin/os/*    │     │                  │          │
│  └──────────────────┘     └──────────────────┘          │
│                                                           │
└───────────────────────────────────────────────────────────┘
         │
         ├─ (N organizaciones por tenant)
         │
         ↓
┌───────────────────────────────────────────────────────────┐
│          NIVEL 2: ORGANIZACIÓN (Firma / Empresa)          │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐│
│  │ ADMIN FIRMA (socio_comercial en admin OS)            ││
│  │ role: "socio_comercial"                              ││
│  │ → OS Role: ADMIN                                     ││
│  │ → Acceso: Org completa, sales room, dashboards      ││
│  │ → Límite: No puede aprobar comisiones               ││
│  │ → Ubicación: /admin/sales-room, /admin/partners    ││
│  └──────────────────────────────────────────────────────┘│
│                                                           │
│  Usuarios de la Organización:                            │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ ABOGADO      │  │ ABOGADO      │  │ ABOGADO      │   │
│  │              │  │              │  │              │   │
│  │ role: lawyer │  │ role: lawyer │  │ role: lawyer │   │
│  │ → OS: STAFF  │  │ → OS: STAFF  │  │ → OS: STAFF  │   │
│  │ → Acceso:    │  │ → Acceso:    │  │ → Acceso:    │   │
│  │   Dashboard  │  │   Dashboard  │  │   Dashboard  │   │
│  │   Casos      │  │   Casos      │  │   Casos      │   │
│  │   Clientes   │  │   Clientes   │  │   Clientes   │   │
│  │              │  │              │  │              │   │
│  │ Modo 1:      │  │ Modo 2:      │  │ Modo 3:      │   │
│  │ Independ.   │  │ Asociado     │  │ Partner      │   │
│  │ (sin org)    │  │ (de firma)   │  │ Comercial    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                           │
│  Clientes de la Organización:                            │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │ CLIENTE      │  │ CLIENTE      │                     │
│  │              │  │              │                     │
│  │ role: client │  │ role: client │                     │
│  │ → OS: CLIENT │  │ → OS: CLIENT │                     │
│  │ → Acceso:    │  │ → Acceso:    │                     │
│  │   Dashboard  │  │   Dashboard  │                     │
│  │ (limitado)   │  │ (limitado)   │                     │
│  │ → Ver:       │  │ → Ver:       │                     │
│  │   Casos      │  │   Casos      │                     │
│  │              │  │              │                     │
│  └──────────────┘  └──────────────┘                     │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 2.2 Relaciones Formales

```
USUARIO (Nivel 0)
    ├─ id
    ├─ email
    ├─ role (app role)
    ├─ tenantId (1:1)
    │   └─ Tenant OS
    │       ├─ tenantId
    │       └─ ownerId (ref → Usuario OWNER)
    │
    ├─ organizationId (0:many)
    │   └─ Organization
    │       ├─ organizationId
    │       ├─ tenantId
    │       ├─ ownerId (ref → Usuario OWNER del tenant)
    │       ├─ name (nombre de firma/empresa)
    │       └─ vertical (tipo de organización)
    │
    ├─ cases (0:many)
    │   └─ Case
    │       ├─ case_id
    │       ├─ lawyer_id (ref → Usuario LAWYER)
    │       └─ client_id (ref → Usuario CLIENT)
    │
    └─ referral_code (único por usuario LAWYER)
        └─ Referidos y comisiones
```

---

## 3. ROLES: MAPEO ACTUAL Y FUTURO

### 3.1 Los 5 App Roles Existentes

```
ROLE (base de datos)   DESCRIPCIÓN                    UBICACIÓN EN CÓDIGO
─────────────────────────────────────────────────────────────────────────
admin                  Administrador de plataforma   backend/models/user.py:24
                       (Punto Cero OS)

admin_general          Owner de tenant / Admin OS    backend/models/user.py:24
                       segunda línea

socio_comercial        Admin de firma comercial      backend/models/user.py:24
                       (sales, operations)

lawyer                 Abogado (independiente o      backend/models/user.py:24
                       asociado a firma)

client                 Cliente de servicios legales  backend/models/user.py:24
```

### 3.2 Los 6 Roles del OS (Punto Cero System OS)

```
OS ROLE             MAPEO                  PERMISOS APLICADOS
─────────────────────────────────────────────────────────────
SUPER_ADMIN         ← admin                Cross-tenant
                                          Write a todo
                                          No requiere tenant propio

OWNER               ← admin_general        Write roles
                                          Tenant-bound si lo tiene

ADMIN               ← socio_comercial      Write roles
                                          Tenant-bound

MANAGER             [SIN MAPEO]            (Definido pero no usado)

STAFF               ← lawyer               Read own
                                          Write own

CLIENT              ← client               Read own
                                          Write own (limitado)
```

### 3.3 Mapeo en Código

**Ubicación:** `backend/utils/tenant.py:20-27`

```python
APP_ROLE_TO_OS_ROLE = {
    "admin": "SUPER_ADMIN",
    "admin_general": "OWNER",
    "socio_comercial": "ADMIN",
    "lawyer": "STAFF",
    "client": "CLIENT",
}
```

### 3.4 Validación de Roles

**Frontend:** `frontend/src/App.js`

```javascript
const ADMIN_ROLES = ['admin', 'admin_general', 'socio_comercial'];
const LAWYER_ROLES = ['lawyer', 'client'];
```

**Backend:** `backend/routes/auth.py:70-76`

```python
if user["role"] not in ["admin", "admin_general"]:
    raise HTTPException(status_code=403, detail="Admin only")
```

---

## 4. MATRIZ DE PERMISOS POR ROL

### 4.1 Acceso a Rutas Frontend

```
RUTA                      admin  admin_general  socio_comercial  lawyer  client
──────────────────────────────────────────────────────────────────────────────
/                         ✅     ✅             ✅              ✅      ✅
/login                    ✅     ✅             ✅              ✅      ✅
/register                 ✅     ✅             ✅              ✅      ✅

/dashboard/*              ✅     ✅             ⚠️ (limitado)   ✅      ✅
/dashboard/crm            ✅     ✅             ⚠️ (no acceso)  ✅      ✗
/dashboard/ai             ✅     ✅             ⚠️ (limitado)   ✅      ⚠️

/admin/*                  ✅     ✅             ✅              ✗       ✗
/admin/sales-room         ✅     ✅             ✅              ✗       ✗
/admin/partners           ✅     ✅             ✅              ✗       ✗
/admin/organizations      ✅     ✅             ✅              ✗       ✗
/admin/security           ✅     ✅             ✗               ✗       ✗
/admin/master/legacy      ✅     ⚠️ (ver only)  ✗               ✗       ✗

LEYENDA:
✅ = Acceso completo
⚠️ = Acceso parcial (limitaciones)
✗  = No tiene acceso
```

### 4.2 Operaciones CRUD

```
OPERACIÓN           admin  admin_general  socio_comercial  lawyer  client
──────────────────────────────────────────────────────────────────────────
Read Organizations  ✅     ✅             ✅              ✗       ✗
Create Org          ✅     ✅             ✗               ✗       ✗
Update Org          ✅     ✅             ⚠️ (propia org) ✗       ✗
Delete Org          ✅     ✅             ✗               ✗       ✗

Read Partners       ✅     ✅             ✅              ✗       ✗
Create Partner      ✅     ✅             ✅              ✗       ✗
Update Partner      ✅     ✅             ✅              ✗       ✗
Delete Partner      ✅     ✅             ✗               ✗       ✗

Approve Commission  ✅     ✅             ✗               ✗       ✗
Pay Commission      ✅     ✅             ✗               ✗       ✗

Read Cases          ✅     ✅             ✅              ✅ (propios) ✅ (propios)
Create Case         ✅     ✅             ✗               ✅      ⚠️ (con lawyer)
Update Case         ✅     ✅             ✗               ✅ (propios) ⚠️
Close Case          ✅     ✅             ✗               ✅ (propios) ✗

Read Clients        ✅     ✅             ✅              ✅ (propios) ✅ (propios)
Create Client       ✅     ✅             ✗               ✅      ✗
Update Client       ✅     ✅             ✗               ✅ (propios) ⚠️
Delete Client       ✅     ✅             ✗               ✗       ✗

Read Leads          ✅     ✅             ✅              ✅ (propios) ✗
Assign Lead         ✅     ✅             ✅              ✗       ✗
Update Lead Status  ✅     ✅             ✅              ✅ (propios) ✗

Execute Seed/Demo   ✅     ✗              ✗               ✗       ✗
```

### 4.3 Acciones Sensibles (Restricciones)

```
ACCIÓN                                  REQUIERE ROLE
──────────────────────────────────────────────────────
Seed demo data                          admin (solo)
Edit global config                      admin (solo)
Delete organization                     admin (solo)
Approve commission                      admin, admin_general
Pay commission                          admin, admin_general
Suspend user                            admin, admin_general
See all users cross-tenant              admin (solo)
See all cases cross-tenant              admin, admin_general
See all commissions                     admin, admin_general
Create marketing campaign               admin, admin_general
Edit platform branding                  admin (solo)
Suspend partner                         admin, admin_general
```

---

## 5. ESTRUCTURA DE ORGANIZACIONES

### 5.1 ¿Qué es una Organización?

**Definición:** Entidad legal de operación que agrupa usuarios y define el contexto de negocio.

```
Organización = Espacio de negocio

TIPOS DE ORGANIZACIONES:
├─ Firma Jurídica (Law Firm)
│  └─ Múltiples abogados de la misma firma
│  └─ Panel admin (socio_comercial) gestionando leads/comisiones
│
├─ Abogado Independiente (sin org formal)
│  └─ Un usuario lawyer operando solo
│  └─ Sin admin de firma
│
├─ Partner Comercial
│  └─ Empresa externa que genera leads para Punto Cero
│  └─ Comisión por lead
│
├─ Reseller / Distribuidor
│  └─ Redistribuye servicios en su territorio
│  └─ Comisión por MRR de clientes traídos
│
└─ Enterprise (cliente grande)
   └─ Múltiples usuarios internos
   └─ Plan customizado
```

### 5.2 Campos de Organización

**Modelo:** `backend/models/organization.py`

```
Organización:
├─ organizationId              (único por tenant)
├─ tenantId                    (FK → Tenant)
├─ name                        (nombre de la firma/empresa)
├─ slug                        (identificador único)
├─ vertical                    (tipo: corporate, startup, ngojuris, ngosocial, etc.)
├─ plan                        (suscripción: Essential, Pro, Enterprise)
├─ status                      (active, suspended, inactive)
├─ ownerId                     (FK → Usuario propietario, opcional)
├─ settings                    (JSON flexible)
├─ limits                       (cuotas: casos, usuarios, etc.)
├─ createdAt
└─ updatedAt
```

### 5.3 Relación Usuario → Organización (ACTUAL)

**Hoy está INCOMPLETA:**

```
Usuario:
├─ id
├─ email
├─ role
├─ tenantId
├─ firm_name             ← Solo campo descriptivo
└─ [NO HAY organizationId]

Organización:
├─ organizationId
├─ tenantId
├─ ownerId              ← Apunta a Usuario (pero no se usa para permisos)
└─ [NO HAY users array]
```

**Problema:** No hay relación formal entre usuarios y organizaciones.

---

## 6. MODOS DE OPERACIÓN DEL ABOGADO

### 6.1 Modo 1: Abogado Independiente (ACTUAL)

```
Estructura:
┌──────────────────────────────────┐
│ Usuario LAWYER (role=lawyer)     │
├──────────────────────────────────┤
│ id, email, tenantId              │
│ firm_name = "Mi Bufete Personal" │
│ organizationId = NULL            │
└──────────────────────────────────┘
         │
         ├─ CREATE Cases (lawyer_id = su id)
         ├─ CREATE Clients (lawyer_id = su id)
         ├─ CREATE Leads (lawyer_id = su id)
         ├─ Ver Dashboard personal
         └─ Generar código de referido
             └─ Ganar comisiones por referencias

Permisos:
✅ Ver propio dashboard
✅ Crear casos propios
✅ Ver clientes propios
✅ Generar referencias
✅ Ver comisiones propias

❌ Ver casos de otros abogados
❌ Crear leads para otros
❌ Aprobar comisiones
❌ Ver otros abogados
```

### 6.2 Modo 2: Abogado Asociado a Firma (ACTUAL - SIN RELACIÓN FORMAL)

```
Estructura:
┌──────────────────────────────────┐
│ Usuario LAWYER (role=lawyer)     │
├──────────────────────────────────┤
│ id, email, tenantId              │
│ firm_name = "Bufete XYZ"         │
│ organizationId = NULL [PROBLEMA] │
└──────────────────────────────────┘
         │
         └─ (Mismo comportamiento que independiente)
             └─ No hay diferencia en permisos
             └─ firm_name es solo metadato

PROBLEMA REAL: No hay forma de agrupar abogados de una firma
en backend, así que no hay:
❌ Dashboard por firma (consolidado)
❌ Comisiones por firma
❌ Leads reasignados entre abogados
❌ Acceso jerárquico
```

### 6.3 Modo 3: Agente Comercial (Actual - socio_comercial)

```
Estructura:
┌──────────────────────────────────┐
│ Usuario SOCIO_COMERCIAL (admin)  │
├──────────────────────────────────┤
│ id, email, tenantId              │
│ role = socio_comercial           │
│ OS role = ADMIN                  │
└──────────────────────────────────┘
         │
         ├─ Acceso a /admin/sales-room
         ├─ Ver leads sin asignar
         ├─ Asignar leads a abogados
         ├─ Agregar notas a candidatos
         ├─ Acceso a /admin/partners
         ├─ Crear partners
         ├─ Ver comisiones pendientes
         │
         ❌ Aprobar comisiones
         ❌ Pagar comisiones
         ❌ Crear usuarios
         ❌ Editar datos de otros abogados
```

---

## 7. ESTRUCTURA DE FIRMAS JURÍDICAS

### 7.1 ¿Qué Falta Hoy?

```
HOY NO EXISTE:
❌ Modelo formal de Firma/LawFirm
❌ Relación usuarios ↔ firma
❌ Dashboard por firma (consolidado)
❌ Permisos por firma (solo tenantId existe)
❌ Comisiones por firma
❌ Límites por firma (solo por tenant)
```

### 7.2 Cómo Debería Ser (Futuro)

```
FIRMA JURÍDICA = Organization con vertical="law_firm"

Estructura propuesta (FUTURA):
┌─────────────────────────────────────────────────┐
│ Organization (LawFirm)                          │
├─────────────────────────────────────────────────┤
│ organizationId                                  │
│ tenantId                                        │
│ name = "Bufete XYZ"                             │
│ vertical = "law_firm"                           │
│ ownerId = user_id (socio founder)              │
│ settings:                                       │
│   - commission_rule: "split_equal" | "tiered"  │
│   - commission_base: 15%                        │
│   - max_concurrent_cases: 100                   │
│ limits:                                         │
│   - max_users: 10                               │
│   - max_cases: 500                              │
│   - max_clients: 1000                           │
└─────────────────────────────────────────────────┘
         │
         ├─ USUARIOS DE LA FIRMA
         │
         ├─ Usuario A (lawyer, firm_user=true)
         │  ├─ organizationId = firm.id
         │  ├─ cases (abogado A)
         │  └─ comisiones
         │
         ├─ Usuario B (lawyer, firm_user=true)
         │  ├─ organizationId = firm.id
         │  ├─ cases (abogado B)
         │  └─ comisiones
         │
         └─ Usuario ADMIN (socio_comercial)
            ├─ organizationId = firm.id
            ├─ permisos: gestión de la firma
            └─ acceso: dashboard consolidado
```

### 7.3 Relaciones (Futuro)

```
Firma → Abogados (1:many)
  ├─ Organization.id
  └─ User.organizationId = Organization.id

Firma → Comisiones (1:many)
  ├─ Commission.firm_id
  └─ Commission.lawyer_id
  └─ Commission.amount
  └─ Commission.firm_share (% para la firma)
  └─ Commission.lawyer_share (% para el abogado)

Firma → Dashboard Consolidado
  ├─ Casos totales de la firma
  ├─ Abogados activos
  ├─ Comisiones acumuladas
  ├─ Clientes de la firma
  └─ Leads asignables
```

---

## 8. VISIBILIDAD DE DATOS POR ROL

### 8.1 Tabla de Visibilidad: ¿QUÉ PUEDO VER?

```
DATO                              admin  admin_gen  socio_com  lawyer  client
─────────────────────────────────────────────────────────────────────────────
Todos los usuarios                ✅     ❌         ❌        ❌      ❌
Usuarios del tenant               ✅     ✅         ❌        ❌      ❌
Usuarios de mi org                ✅     ✅         ✅        ❌      ❌
Mi propio usuario                 ✅     ✅         ✅        ✅      ✅

Todas las organizaciones          ✅     ❌         ❌        ❌      ❌
Orgs del tenant                   ✅     ✅         ❌        ❌      ❌
Mi org                            ✅     ✅         ✅        ❌      ❌

Todos los casos                   ✅     ❌         ❌        ❌      ❌
Casos del tenant                  ✅     ✅         ✅        ❌      ❌
Casos de mi org                   ✅     ✅         ✅        ❌      ❌
Mis casos (lawyer_id)             ✅     ✅         ❌        ✅      ✅ (propios)

Todos los clientes                ✅     ❌         ❌        ❌      ❌
Clientes del tenant               ✅     ✅         ✅        ❌      ❌
Clientes de mi org                ✅     ✅         ✅        ❌      ❌
Mis clientes                      ✅     ✅         ❌        ✅      ✅ (propios)

Todas las comisiones              ✅     ❌         ❌        ❌      ❌
Comisiones del tenant             ✅     ✅         ✅        ❌      ❌
Mis comisiones                    ✅     ✅         ❌        ✅      ❌

Todos los leads                   ✅     ❌         ❌        ❌      ❌
Leads del tenant                  ✅     ✅         ✅        ❌      ❌
Leads sin asignar                 ✅     ✅         ✅        ❌      ❌
Mis leads (asignados a mí)        ✅     ✅         ❌        ✅      ❌

Todas las transacciones           ✅     ❌         ❌        ❌      ❌
Transacciones del tenant          ✅     ✅         ❌        ❌      ❌
Mis transacciones                 ✅     ✅         ❌        ✅      ✅

Datos analytics globales          ✅     ❌         ❌        ❌      ❌
Analytics del tenant              ✅     ✅         ✅        ❌      ❌
Analytics de mi org               ✅     ✅         ✅        ❌      ❌
Mis analytics                     ✅     ✅         ❌        ✅      ❌

Leyenda:
✅ Puede ver
❌ No puede ver
```

### 8.2 Restricciones Específicas

```
RESTRICCIÓN                                    APLICADA A
─────────────────────────────────────────────────────────────
"lawyer_id = current_user.id"                  lawyer
"client_id = current_user.id"                  client
"tenantId = current_user.tenantId"             admin_general, socio_comercial
"organizationId = current_user.organizationId" [FUTURO: firma users]
"ownershipCheck(resource)"                     require_owner decorator
```

---

## 9. RELACIONES Y FLUJOS

### 9.1 Flujo de Creación de Usuario

```
Usuario se registra en /register
  │
  ├─ Email validation
  │
  ├─ Rol: "client" o "lawyer"
  │  │
  │  └─ lawyer?
  │     ├─ "Nombre de Bufete" = firm_name (campo descriptivo)
  │     ├─ specialties
  │     ├─ bar_number
  │     └─ experience_years
  │
  ├─ Crear documento en db.users
  │  └─ status = "PENDING_VERIFICATION"
  │  └─ is_verified = false
  │
  ├─ Enviar email de verificación
  │
  └─ Usuario entra en Sala de Ventas (candidato)
     └─ Admin ve en /admin/sales-room
     └─ Admin aprueba (is_verified=true)
     └─ Usuario accede a /dashboard
```

### 9.2 Flujo Actual vs Flujo Futuro

**ACTUAL (Hoy):**
```
Usuario LAWYER
    │
    ├─ firm_name = metadato
    ├─ organizationId = NULL
    │
    └─ Comportamiento: Independiente
       (aunque diga que es de una firma)
```

**FUTURO (Propuesto):**
```
Usuario LAWYER
    │
    ├─ firm_name = metadato (para compatibilidad)
    ├─ organizationId = firm.id
    │
    ├─ Comportamiento: Asociado a firma
    │  ├─ Ver solo casos de su firma
    │  ├─ Compartir clientes con otros lawyers
    │  ├─ Comisiones calculadas con split
    │  └─ Dashboard firmado puede agregar acceso
    │
    └─ O organizationId = NULL
       └─ Comportamiento: Independiente
          ├─ Ver solo sus casos
          ├─ Clientes solo suyos
          └─ 100% comisión
```

---

## 10. PLAN DE EVOLUCIÓN

### 10.1 Fase Actual (Hoy) - Estado Real

```
✅ EXISTE
├─ 5 app roles definidos
├─ Multi-tenant por tenantId
├─ Organizaciones con ownerId
├─ Guards de frontend/backend
├─ Jerarquía funcional dispersa
├─ Abogados independientes
└─ Agentes comerciales (socio_comercial)

❌ NO EXISTE / ESTÁ ROTO
├─ Relación formal usuario ↔ firma
├─ Abogados asociados a firma (modelado)
├─ Membresía de usuarios a org
├─ Dashboard por firma
├─ Permisos basados en org
└─ Comisiones con split firma/abogado
```

### 10.2 Fase 1 (Próxima) - Normalización

**Objetivo:** Formalizar relaciones sin reorganizar.

```
CAMBIOS NECESARIOS (MÍNIMOS):

1. Agregar a User
   ├─ organizationId: ObjectId | NULL
   └─ is_firm_member: bool (false = independiente)

2. Usar organizationId en queries
   ├─ cases.find({ "lawyer_id": X, "firm_id": Y })
   ├─ clients.find({ "lawyer_id": X, "firm_id": Y })
   └─ (si firm_id es null → independiente)

3. Validar permisos por org
   ├─ Si lawyer.organizationId != org → 403
   └─ Excepto admin/admin_general

4. Actualizar ownerId → gobiernar permisos
   ├─ organization.ownerId puede editar org
   └─ organization.ownerId puede ver users de org

NO REQUIERE:
❌ Cambios arquitectónicos
❌ Nuevos roles
❌ Nueva tabla de membresía
❌ Nuevas rutas
```

### 10.3 Fase 2 - Comisiones Firmadas

```
Agregar a Commission:
├─ firm_id (nullable)
├─ firm_share % (si existe firm)
├─ lawyer_share %
└─ split_amount { firm, lawyer }

Flujo:
└─ Caso cerrado por lawyer asociado
   ├─ Calcular comisión base
   ├─ Si firm_id exists:
   │  └─ split = { firm: X%, lawyer: Y% }
   └─ Crear 2 registros de comisión
      (una para firma, otra para lawyer)
```

### 10.4 Fase 3 - Dashboard Firmado

```
Si usuario.organizationId is set:
├─ Dashboard muestra datos de la firma
├─ Cases consolidados
├─ Comisiones consolidadas
├─ Abogados de la firma
└─ Clientes de la firma

Si usuario es firm admin (socio_comercial):
└─ Acceso completo a org
   ├─ Ver todos los users
   ├─ Ver todos los cases
   └─ Gestionar comisiones
```

---

## 11. CONCLUSIONES

### Modelo Actual es ESTABLE pero INCOMPLETO

```
✅ FORTALEZAS
├─ Multi-tenant bien implementado
├─ Jerarquía de roles funcional
├─ Guards en frontend y backend
├─ Separación de data por lawyer_id
└─ Escalable a firmas sin reorganizar

⚠️ DEBILIDADES
├─ Relaciones usuario ↔ org no formales
├─ organizationId no se usa para filtros
├─ ownerId no se usa para permisos
├─ Abogados asociados = indistinguibles de independientes
└─ Sin dashboard por firma
```

### Plan de Evolución es SEGURO

```
REQUISITO 1: Sin reorganización arquitectónica
✅ Solo agregar: organizationId a User
✅ Solo cambiar: queries para filtrar por org
✅ No tocar: roles, multi-tenant, auth

REQUISITO 2: Reutilizar infraestructura existente
✅ Usar Organization como Firma
✅ Usar ownerId para permisos
✅ Usar commission model para split

REQUISITO 3: Mantener compatibilidad
✅ organizationId nullable (= independiente)
✅ Métodos deprecated sin borrar
✅ Queries fallback a lawyer_id
```

### Próximo Paso: Implementación Fase 1

```
1. Actualizar modelo User
   └─ Agregar organizationId: ObjectId | NULL

2. Crear data migration
   └─ Existentes Users quedan con organizationId = NULL (independientes)

3. Actualizar queries para filtrar por org
   └─ Si User.organizationId exists, filtrar por ese

4. Validar permisos basados en org
   └─ Si intentas ver org ajena → 403
   └─ Si eres admin → OK

5. Test suite
   └─ Abogado independiente (sin org)
   └─ Abogado asociado (con org)
   └─ Admin viendo todo
```

---

**Master Role Hierarchy Completado:** Junio 2026  
**Status:** LISTO PARA IMPLEMENTACIÓN FASE 1  
**Riesgo Arquitectónico:** BAJO (reutilización + compatibilidad)

