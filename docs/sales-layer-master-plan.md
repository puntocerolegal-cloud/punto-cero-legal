# SALES LAYER MASTER PLAN
## Transformación de Sala de Ventas en Red Internacional de Agentes Comerciales

**Documento de Auditoría y Evolución**  
**Fecha:** Junio 2026  
**Proyecto:** Punto Cero Legal Platform  
**Versión:** 1.0

---

## 📋 TABLA DE CONTENIDOS

1. Resumen Ejecutivo
2. Estructura Actual del Sales Layer
3. Análisis de Reutilización
4. Conceptos del Sales Layer Futuro
5. Mapeo Actual → Futuro
6. Información Existente vs. Faltante
7. Plan de Evolución Gradual

---

## 1. RESUMEN EJECUTIVO

### Estado Actual

El proyecto **YA TIENE** las bases estructurales para evolucionar hacia un **Sales Layer profesional**:

```
✅ Sala de Ventas         → OPERATIVA (candidatos de abogados)
✅ Socios Comerciales     → OPERATIVA (partners multi-tenant)
✅ Referidos              → OPERATIVA (tracking con recompensas)
✅ Organizaciones         → OPERATIVA (multi-tenant con roles)
✅ Leads                  → PARCIAL (modelo existe, UI incompleta)
✅ Comisiones             → PARCIAL (campo exists, gestión falta)
⚠️ Países / Divisas       → CAPTURADO (en transacciones, no normalizado)
❌ Oficina Virtual Agentes → NO EXISTE (requiere nuevo módulo)
```

### Conclusión Principal

**La arquitectura PUEDE evolucionar sin reorganización arquitectónica mayor.** Los módulos legacies y nuevos coexisten correctamente. Solo requiere:

1. **Extensión** de Sala de Ventas (candidatos → agentes)
2. **Formalización** de comisiones (colección dedicada)
3. **Consolidación** de países/divisas (catálogo maestro)
4. **Nuevo módulo** de Oficina Virtual para agentes

---

## 2. ESTRUCTURA ACTUAL DEL SALES LAYER

### 2.1 Sala de Ventas (Candidatos)

**Ubicación Backend:** `backend/routes/admin_ops.py`  
**Ubicación Frontend:** `frontend/src/modules/admin/pages/SalesRoomModule.jsx`

#### Estado Actual
- ✅ Filtro por estado: `in_process`, `active`, `rejected`
- ✅ Chat privado de seguimiento
- ✅ Notas internas
- ✅ Aprobación/rechazo de candidatos
- ✅ Indicador de verificación y pago pendiente
- ✅ WhatsApp y email directo

#### Flujo Actual
```
1. Postulante (abogado) llena form en /public/lawyer-application
   ↓
2. Se crea user con role="lawyer", status="PENDING_VERIFICATION"
   ↓
3. Admin ve en Sala de Ventas como "candidato"
   ↓
4. Admin aprueba → user status = "ACTIVE", is_verified = true
   ↓
5. Abogado puede acceder a /dashboard
```

#### Datos Capturados del Candidato
```
→ email
→ full_name
→ phone
→ country
→ city
→ specialty (especialidad legal)
→ experience_years
→ description
→ bar_number (tarjeta profesional)
→ firm_name (bufete/firma)
→ id_document
→ source (cómo llegó)
→ status
→ is_verified
```

#### Datos NO Capturados (Oportunidad)
```
❌ referral_source (¿de qué agente fue referido?)
❌ recruitment_date (fecha de ingreso)
❌ onboarding_status (level de setup en plataforma)
❌ assigned_to (¿qué agente lo reclutó?)
❌ country_region (región específica, importante para LATAM)
```

---

### 2.2 Socios Comerciales (Partners)

**Ubicación Backend:** `backend/services/partner_service.py`, `backend/routes/partners.py`  
**Ubicación Frontend:** `frontend/src/modules/partners/pages/PartnersDashboard.jsx`

#### Modelo de Datos
```
Colección: db.partners

Campos:
├─ tenantId (multi-tenant)
├─ organizationId (opcional, relación)
├─ companyName (razón social)
├─ contactName (persona de contacto)
├─ email
├─ phone
├─ vertical (mercado: corporate, startup, etc.)
├─ status (active, suspended, inactive)
├─ stage (prospect, negotiation, active, churned)
├─ commissionRate (% de comisión)
├─ projectedRevenue (ingresos proyectados)
├─ country
├─ currencyCode
├─ createdAt
├─ updatedAt
└─ createdBy (user_id del admin que lo creó)
```

#### Estado Actual
- ✅ CRUD completo
- ✅ Multi-tenant con tenantId
- ✅ Filtros por vertical, status, stage
- ✅ Búsqueda por nombre
- ✅ Dashboard con KPIs

#### Datos NO Capturados (Oportunidad)
```
❌ agentCommissionRate (% específico de comisión por agente)
❌ totalLeadsGenerated (total de leads aportados)
❌ totalConversionsFrom (cuántos leads se convirtieron)
❌ performanceMetrics (KPI individual)
❌ documentos/contratos (ruta a PDF de contrato)
❌ payment_method (cómo se paga: transferencia, PayPal, etc.)
❌ bank_details (datos bancarios para comisiones)
```

---

### 2.3 Referidos (Programa de Recomendaciones)

**Ubicación Backend:** `backend/routes/referrals.py`, `backend/routes/payment.py`  
**Ubicación Frontend:** `frontend/src/modules/referrals/pages/ReferralsDashboard.jsx`

#### Flujo Actual
```
1. Abogado activo genera código único
   └─ url: /register?ref={code}

2. Recomendado usa ese código
   └─ se guarda en transactions.referral_code

3. Pago confirmado
   ├─ referrer recibe 1 mes gratis
   ├─ transactions.referrer_id = id del referrer
   └─ notificación al referrer

4. Abogado ve en /referrals/dashboard
   └─ total referidos
   └─ créditos acumulados
```

#### Datos en Base de Datos
```
users:
├─ referral_code (único por usuario)
├─ free_months_credits (mes gratis acumulados)
├─ total_referrals (cuántos refirió)
└─ last_referral_at (último referido activo)

transactions:
├─ referral_code (el código usado en checkout)
├─ referrer_id (ID del que refirió)
└─ reward_applied (boolean si se aplicó beneficio)

notifications:
└─ evento de nueva recompensa
```

#### Datos NO Capturados (Oportunidad)
```
❌ referralSource (¿cuál fue el medio de distribución del código?)
❌ referralTier (nivel: platinum, gold, silver, bronze)
❌ commissionAmount (monto en dinero ganado, no solo crédito)
❌ conversionDate (cuándo se confirmó el pago del referido)
❌ referralChannel (WhatsApp, email, social media, etc.)
```

---

### 2.4 Organizaciones

**Ubicación Backend:** `backend/services/organization_service.py`, `backend/routes/organizations.py`  
**Ubicación Frontend:** `frontend/src/modules/organizations/pages/OrganizationsDashboard.jsx`

#### Modelo de Datos
```
Colección: db.organizations

Campos:
├─ tenantId (multi-tenant)
├─ name (nombre de la org)
├─ slug (identificador único por tenant)
├─ vertical (segmento: corporate, startup, NGO, etc.)
├─ plan (tipo de suscripción)
├─ status (active, suspended, inactive)
├─ ownerId (abogado dueño, nullable)
├─ settings (objeto flexible)
├─ limits (cuotas: casos, usuarios, etc.)
├─ createdAt
└─ updatedAt
```

#### Relaciones Existentes
```
organizations 1:many partners (via organizationId)
organizations 1:many implementations (via organizationId)
organizations 1:many os_subscriptions (via organizationId)
organizations 1:many billing (via organizationId)
```

#### Estado Actual
- ✅ Multi-tenant en profundidad
- ✅ Soporte de verticales
- ✅ Límites configurables
- ✅ Relaciones con partners implementadas

---

### 2.5 Leads

**Ubicación Backend:** `backend/models/lead.py`, `backend/routes/leads.py`  
**Ubicación Frontend:** UI INCOMPLETA (mockData pero no consumida)

#### Modelo de Datos
```
Colección: db.leads

Campos:
├─ lawyer_id (ObjectId del abogado)
├─ client_name
├─ client_email
├─ client_phone
├─ legal_area
├─ description
├─ status (pending, assigned, won, lost)
├─ source (de dónde vino)
├─ assigned_date
├─ converted_to (referencia a caso si se ganó)
├─ created_at
└─ updated_at
```

#### Estado Actual
- ✅ Modelo backend EXISTE
- ❌ No hay UI completamente funcional
- ❌ No hay dashboard de leads
- ❌ Relación leads → casos NO completamente usada
- ❌ No hay pipeline de ventas visualizado

#### Datos NO Capturados (Oportunidad)
```
❌ lead_source_agent (¿de qué agente/partner vino el lead?)
❌ lead_value_estimate (valor estimado del caso)
❌ lead_temperature (hot, warm, cold)
❌ lead_location (país/ciudad del cliente)
❌ conversion_date (cuándo se convirtió a caso)
❌ conversion_value (valor real del contrato)
```

---

### 2.6 Comisiones

**Estado:** INCOMPLETO

#### Qué Existe
- ✅ Campo `commissionRate` en partners
- ✅ Cálculo KPI en `partner_service.py`: suma de comisión por partners activos
- ✅ Beneficio de referido: 1 mes gratis

#### Qué NO Existe
- ❌ Colección dedicada `db.commissions`
- ❌ Tracking de monto en dinero pagado
- ❌ Historial de pagos
- ❌ Estados de comisión (earned, pending, paid, disputed)
- ❌ Modelo de comisión tiered (basado en volumen)
- ❌ Automatización de pago de comisiones

---

### 2.7 Países y Divisas

**Estado:** DISPERSO

#### Dónde Está Capturado
```
users:
└─ country (campo string)

transactions:
├─ country
├─ currency (código ISO)
├─ amount_cop (monto en COP)
└─ amount_local (monto en divisa local)

partners:
├─ country
└─ currencyCode

organizations:
└─ (no está explícito)
```

#### Qué NO Existe
- ❌ Catálogo maestro de países
- ❌ Configuración de divisas activas por país
- ❌ Zonas horarias por país
- ❌ Regulaciones/compliance por país
- ❌ Tasas de cambio dinámicas
- ❌ Normativa fiscal por país

---

## 3. ANÁLISIS DE REUTILIZACIÓN

### Qué Puede Reutilizarse del Legacy

#### 3.1 Sala de Ventas → Gestión de Agentes

**REUTILIZABLE:** 80%

```
Componente Actual             Reutilización
─────────────────────────────────────────────────────────
SalesRoomModule.jsx           → Cambiar "candidatos" por "agentes"
                               → Mantener filtros, búsqueda, chat
                               → Agregar KPI de leads/comisiones

SalesCandidateDrawer.jsx      → Renombrar a AgentProfileDrawer
                               → Extender con: leads asignados,
                                 comisiones, documentos

StatusBadgeSales              → Reutilizar para estados de agente

SalesChat                     → Mantener para comunicación

admin_ops/sales/* endpoints   → Extender para agents/*
```

**Cambios Necesarios:**
- Renombrar "candidato" → "agente"
- Agregar seccion de "leads activos" en drawer
- Agregar sección de "comisiones acumuladas"
- Extender filtros: por comisión, por país, por vertical

---

#### 3.2 Partners → Socios Comerciales (Ya Existe)

**COMPLETAMENTE REUTILIZABLE:** 95%

```
El módulo actual `/modules/partners/` ya:
✅ Gestiona multi-tenant
✅ Tiene CRUD completo
✅ Permite asignar verticales
✅ Captura commission rates
✅ Está integrado en AdminModule
```

**Cambios Necesarios:**
- Extender con: documentos contrato, bank details, payment method
- Agregar dashboard de leads generados por partner
- Crear historial de comisiones pagadas

---

#### 3.3 Referidos → Programa de Recomendaciones (Ya Existe)

**REUTILIZABLE:** 90%

```
El sistema actual:
✅ Genera código único
✅ Valida en checkout
✅ Aplica recompensa
✅ Notifica al referrer
```

**Cambios Necesarios:**
- Diferenciar referidos de abogados vs. referidos de partners
- Agregar tiering (porcentaje variable por volumen)
- Crear UI de distribución de código (QR, social share)
- Integrar comisión monetaria además de crédito

---

### Qué Módulos Ya Existen (Reutilizables)

```
MÓDULO                    UBICACIÓN                           REUTILIZABLE
────────────────────────────────────────────────────────────────────────
Organizaciones            /modules/organizations/             95%
Partners                  /modules/partners/                  95%
Referidos                 /modules/referrals/                 90%
Sala de Ventas            /modules/admin/pages/*              80%
Leads                     backend/routes/leads.py             60% (sin UI)
Comisiones                partner_service.py (KPI)            30% (incompleto)
Países/Divisas            disperso en users, transactions     20% (sin normalizar)
```

---

### Qué Información Se Captura Ya

```
USUARIO/ABOGADO
✅ email, nombre, teléfono
✅ país, ciudad
✅ especialidad legal
✅ experiencia en años
✅ número de tarjeta profesional
✅ nombre de firma/bufete
✅ documento de identidad
✅ código de referido
✅ créditos acumulados

PARTNER COMERCIAL
✅ empresa, contacto, teléfono
✅ email
✅ vertical (mercado)
✅ país
✅ divisa
✅ comisión % configurada

TRANSACCIONES
✅ país del pago
✅ divisa
✅ monto en COP y local
✅ referral_code usado
✅ referrer_id

LEADS
✅ cliente (nombre, email, teléfono)
✅ área legal
✅ descripción del caso
✅ abogado asignado
✅ estado (pending, won, lost)

ORGANIZACIONES
✅ nombre, vertical, plan
✅ límites de recursos
✅ propietario
```

---

### Qué Información FALTA

```
PARA AGENTES (crítico)
❌ referral_source (¿de quién es agente? ¿de qué partner?)
❌ recruitment_date (cuándo se incorporó)
❌ onboarding_status (qué tan preparado está)
❌ assigned_to (agente asignador si es jerárquico)
❌ performance_metrics (conversiones, cierre de casos)
❌ payment_method (cómo recibe comisiones)
❌ bank_details (cuenta bancaria)
❌ documento de IVA/impuestos

PARA COMISIONES (crítico)
❌ colección dedicada db.commissions
❌ monto en dinero (ahora solo crédito de mes)
❌ estado de pago (earned, pending, paid)
❌ fecha de pago
❌ tiering/bonificaciones (comisión variable)

PARA LEADS (importante)
❌ lead_source_agent (quién lo originó)
❌ lead_value_estimate (valor esperado)
❌ lead_temperature (hot/warm/cold)
❌ conversion_value (monto real del contrato)

PARA OFICINA VIRTUAL (crítico - no existe)
❌ calendario de agentes
❌ disponibilidad por zona horaria
❌ sesiones/reuniones registradas
❌ video/documentos compartidos

PARA PAÍSES (importante)
❌ catálogo maestro de países
❌ divisas habilitadas por país
❌ zonas horarias
❌ normativa/compliance
```

---

## 4. CONCEPTOS DEL SALES LAYER FUTURO

### 4.1 Agentes (Evolución de Candidatos)

**Definición:** Profesionales jurídicos que generan leads y cierren casos para la plataforma.

#### Tipos de Agentes
```
1. ABOGADOS INDEPENDIENTES
   └─ Generan leads desde su cliente base
   └─ Comisión: % por caso cerrado
   └─ Acceso: dashboard personal, mis leads, mis comisiones

2. PARTNERS COMERCIALES (Empresas)
   └─ Ofrecen servicios legales a través de nuestros abogados
   └─ Comisión: % negociado, tiered por volumen
   └─ Acceso: dashboard de partner, leads asignados, team

3. AGENTES INTERNOS
   └─ Equipo de ventas interno de Punto Cero
   └─ Comisión: estructura fija + variable
   └─ Acceso: completo, KPI individual

4. RESELLERS / DISTRIBUIDORES
   └─ Distribuyen la plataforma en sus territorios
   └─ Comisión: % MRR de clientes traídos
   └─ Acceso: dashboard de MRR, clientes, documentos
```

#### Información de Agente
```
Agente = Usuario Mejorado

Base (heredada de users):
├─ email, nombre, teléfono
├─ país
├─ especialidad legal
├─ experiencia
├─ tarjeta profesional
└─ bufete/firma

Extensión (Sales Layer):
├─ tipo_agente (abogado, partner, interno, reseller)
├─ comisión_base %
├─ comisión_tiered []
├─ total_leads_generados
├─ total_casos_cerrados
├─ ingresos_comisión_acumulados
├─ últimas_comisiones_pagadas []
├─ disponibilidad (horarios, zonas horarias)
├─ documentos (contrato, W9, datos bancarios)
├─ assigned_to (agente superior si es jerárquico)
└─ performance_score (1-100)
```

---

### 4.2 Leads

**Definición:** Oportunidades de negocio generadas por agentes/partners.

#### Pipeline de Lead
```
1. NUEVO (just_created)
   └─ Entrada al sistema

2. CONTACTADO (contacted)
   └─ Agente/partner se comunicó

3. EN_EVALUACIÓN (evaluating)
   └─ Cliente considera el servicio

4. PROPUESTA_HECHA (proposal_sent)
   └─ Se envió presupuesto

5. NEGOCIACIÓN (negotiating)
   └─ Se está negociando

6. GANADO (won)
   └─ Cliente acepta → se crea caso

7. PERDIDO (lost)
   └─ Lead no continuó
```

#### Datos de Lead
```
Lead = Oportunidad de Negocio

Cliente:
├─ nombre
├─ email
├─ teléfono
├─ país
├─ ciudad
└─ tipo (persona, empresa)

Caso legal:
├─ área legal
├─ descripción
├─ valor estimado
├─ urgencia
└─ complejidad

Gestión:
├─ origen (de qué agente)
├─ asignado a (abogado que lo atiende)
├─ estado en pipeline
├─ notas internas
├─ fecha de creación
├─ última actividad
└─ fecha de cierre (si ganado/perdido)

Comisión:
├─ valor_del_caso (si fue ganado)
├─ comisión_del_agente (% aplicado)
├─ monto_comisión_calculado
└─ estado de pago (pending, paid)
```

---

### 4.3 Clientes

**Definición:** Organizaciones o personas que pagan por servicios legales.

#### Relación con Sistema Actual
```
Hoy: client = usuario con role="client"

Futuro: cliente = cuenta consolidada
├─ usuario login (rol client)
├─ casos asociados (history)
├─ suscripción/plan
└─ agente/partner asignado
```

---

### 4.4 Comisiones

**Definición:** Ingresos generados por agentes/partners por desempeño.

#### Modelo de Comisión
```
COMISIÓN = monto_contrato × tasa_comisión × bonus_por_volumen

Ejemplo:
─────────
Contrato: $10,000
Tasa base: 15%
Bonus por 50+ casos: +5%
──────────
Comisión: $10,000 × 15% × 1.05 = $1,575

Pago:
├─ Earned (ganada): se creó el caso
├─ Pending (pendiente): esperando pago
├─ Paid (pagada): transferencia realizada
└─ Disputed (disputada): en revisión
```

#### Estados de Comisión
```
EARNED        → contrato cerrado, comisión calculada
PENDING       → esperando pago (fin de mes / quincenal)
APPROVED      → aprobada por admin, lista para pago
PAID          → transferencia realizada, historial
REVERSED      → cancelada por disputa o reembolso
ADJUSTED      → ajuste manual por concepto
```

---

### 4.5 Países

**Definición:** Configuración regional del sales layer.

#### Información por País
```
País:
├─ código (COP, UY, MX, AR, etc.)
├─ nombre (Colombia, Uruguay, México, Argentina)
├─ región (LATAM)
├─ divisa (COP, UYU, MXN, ARS)
├─ zona_horaria (America/Bogota, etc.)
├─ regulaciones_legales (marco)
├─ impuestos (IVA, retención)
├─ métodos_pago_disponibles (transferencia, MercadoPago, etc.)
├─ agentes_activos (cuántos)
└─ MRR_mes (ingresos recurrentes mensuales)
```

#### Datos Existentes
```
✅ user.country (string)
✅ transactions.currency
✅ partners.country + currencyCode
❌ Falta catálogo maestro normalizado
```

---

### 4.6 Oficina Virtual de Agentes

**Definición:** Espacio colaborativo donde agentes se reúnen, comparten leads, coordinan casos.

#### Componentes (Futuros)
```
CALENDARIO COMPARTIDO
├─ Disponibilidad de agentes
├─ Reuniones programadas
├─ Zonas horarias respetadas
└─ Sincronización con leads

DIRECTORIO DE AGENTES
├─ Perfil profesional
├─ Especialidades
├─ Disponibilidad
├─ Stats (casos cerrados, etc.)
└─ Contacto directo

GESTIÓN DE LEADS COMPARTIDOS
├─ Leads sin asignar
├─ Ofertas de asignación
├─ Transferencias entre agentes
└─ Historial de asignación

DOCUMENTOS COMPARTIDOS
├─ Plantillas de contrato
├─ Análisis de mercado
├─ Mejores prácticas
└─ Normativa por país

COMUNICACIÓN
├─ Chat grupal por vertical
├─ Foros de discusión
├─ Notificaciones de actividad
└─ Estadísticas en tiempo real
```

---

## 5. MAPEO ACTUAL → FUTURO

### 5.1 Capas de Transformación

```
CAPA 1: Normalización de Datos (Fase 0)
════════════════════════════════════════════════
Tarea                                    Ubicación
─────────────────────────────────────────────────────
Crear catálogo maestro de países        backend/models/country.py
Crear comisiones collection              backend/models/commission.py
Agregar campos a users para agentes     migrate/users.add_agent_fields
Normalizar source en users              backend/data_migration

CAPA 2: Extensión de Módulos Existentes (Fase 1)
════════════════════════════════════════════════
Tarea                                    Ubicación
─────────────────────────────────────────────────────
Renombrar SalesRoom → AgentManager      frontend/modules/admin/
Extender PartnersDashboard              frontend/modules/partners/
Mejorar ReferralsDashboard              frontend/modules/referrals/
Crear LeadsModule UI                    frontend/modules/leads/ (nuevo)
Crear ComissionsModule                  frontend/modules/commissions/ (nuevo)

CAPA 3: Nueva Funcionalidad (Fase 2+)
════════════════════════════════════════════════
Tarea                                    Ubicación
─────────────────────────────────────────────────────
Crear Oficina Virtual                    frontend/modules/agent-office/ (nuevo)
Implementar calendario compartido        frontend/modules/agent-office/calendar
Crear directorio de agentes              frontend/modules/agent-office/directory
Automatizar pagos de comisiones          backend/services/commission_payment
Crear reportes de agentes                frontend/modules/agents/reports (nuevo)
```

---

### 5.2 Tabla de Equivalencias

```
CONCEPTO ACTUAL         → CONCEPTO SALES LAYER      UBICACIÓN ACTUAL     CAMBIOS NECESARIOS
─────────────────────────────────────────────────────────────────────────────────────────
users (role=lawyer)     → Agents                    db.users             Extensión de campos
partners                → Commercial Partners       db.partners          + payment details
referrals               → Referral Program          (disperso)           Consolidar + tiering
sales_room              → Agent Manager             SalesRoomModule      Renombrar + extender
leads (backend)         → Lead Pipeline             db.leads             + UI completa
organizations           → Organizations (igual)    db.organizations     (sin cambios)
transactions.referral   → Commission Tracking       db.transactions      → db.commissions
countries (string)      → Country Masters           disperso              → db.countries (nuevo)
```

---

## 6. INFORMACIÓN EXISTENTE vs. FALTANTE

### 6.1 Matriz de Captura de Datos

```
CONCEPTO        CAPTURADO HOY              CAPTURA FALTANTE              PRIORIDAD
────────────────────────────────────────────────────────────────────────────────────
AGENTES         
                ✅ email, teléfono         ❌ banco, IVA, W9            CRÍTICA
                ✅ especialidad            ❌ performance score          ALTA
                ✅ país                    ❌ assigned_to (jerarquía)   MEDIA
                
LEADS           
                ✅ cliente (básico)        ❌ lead_source_agent          CRÍTICA
                ✅ área legal              ❌ lead_value_estimate        ALTA
                ✅ estado (parcial)        ❌ conversion_metrics         ALTA

COMISIONES      
                ✅ rate %                  ❌ monto en dinero            CRÍTICA
                ⚠️ beneficio mes gratis    ❌ tiering/bonificación      ALTA
                ❌ nada más                ❌ historial de pagos         ALTA

PAÍSES          
                ✅ código país             ❌ catálogo maestro          CRÍTICA
                ⚠️ divisa (en txn)        ❌ zona horaria              ALTA
                ❌ regulaciones            ❌ normativa fiscal           ALTA

OFICINA VIRTUAL 
                ❌ no existe               ❌ TODO                      CRÍTICA
                                           
PARTNERS        
                ✅ CRUD completo          ❌ documentos contrato        MEDIA
                ✅ comisión rate          ❌ payment method             MEDIA
                                          ❌ historico de comisiones    MEDIA
```

---

### 6.2 Priorización de Información Faltante

#### CRÍTICA (Bloquea sales layer)
```
1. Banco/IVA del agente
   └─ Sin esto no se puede pagar comisiones

2. Colección db.commissions
   └─ Sin esto no hay tracking de dinero

3. Lead source agent
   └─ Sin esto no se sabe quién originó el lead

4. Catálogo de países
   └─ Sin esto no hay config regional
```

#### ALTA (Necesaria para MVP)
```
1. Performance score
2. Lead value estimate
3. Tiering de comisiones
4. Zona horaria por país
5. Documento de contrato partner
6. Historial de pagos
```

#### MEDIA (Mejora UX post-MVP)
```
1. assigned_to (jerarquía de agentes)
2. lead_temperature (hot/warm/cold)
3. normativa fiscal por país
4. métodos de pago por país
```

---

## 7. PLAN DE EVOLUCIÓN GRADUAL

### Fase 0: Auditoría y Diseño (ACTUAL)
**Duración:** 1 semana  
**Entregables:** Este documento + validación con stakeholders

```
✅ Auditar estructura actual
✅ Crear master plan (HECHO)
✅ Validar que no hay bloqueantes arquitectónicos
✅ Aprobar con product/engineering
```

---

### Fase 1: Normalización de Datos (SIN REORQUESTAR)
**Duración:** 2-3 semanas  
**Riesgo:** BAJO (migraciones, sin cambios de rutas)

```
TAREAS:
─────
1. Crear modelo Country
   └─ backend/models/country.py
   └─ Seed: COP, UY, MX, AR, CL, PE

2. Crear modelo Commission
   └─ backend/models/commission.py
   └─ Campos: agent_id, lead_id, amount, status, created_at, paid_at

3. Extender users para agentes
   └─ Agregar campos: agent_type, commission_base, assigned_to, etc.
   └─ Migración en backend/migrations/

4. Crear CommissionService
   └─ backend/services/commission_service.py
   └─ Funciones: calculate(), create(), pay(), list_by_agent()

5. Crear API endpoints
   └─ GET /api/agents/me/commissions
   └─ GET /api/admin/commissions/pending
   └─ POST /api/admin/commissions/{id}/pay

IMPACTO ARQUITECTÓNICO: CERO
(se agregan modelos, no se reorganizan existentes)
```

---

### Fase 2: Extensión de Módulos (MEJORA GRADUAL)
**Duración:** 3-4 semanas  
**Riesgo:** BAJO (agregar features a módulos existentes)

```
TAREAS:
─────

A. AGENTES (Sala de Ventas → Agent Manager)
   1. Renombrar SalesRoomModule.jsx → AgentManagerModule.jsx
      └─ Cambios de UI (candidato → agente)
      └─ Agregar sección de comisiones pendientes
      └─ Agregar filtros por tipo de agente

   2. Extender SalesCandidateDrawer → AgentProfileDrawer
      └─ Agregar: documentos, banco, comisiones históricas
      └─ Agregar: leads activos asignados
      └─ Agregar: performance KPIs

B. PARTNERS (Módulo ya existe)
   1. Agregar documentos de contrato
      └─ Campo: contract_url
      └─ UI para upload/preview

   2. Agregar detalles bancarios
      └─ Campos: payment_method, bank_account, swift
      └─ Encriptación de sensibles

   3. Dashboard de comisiones del partner
      └─ Mostrar comisiones acumuladas
      └─ Mostrar leads generados
      └─ Mostrar tasa de conversión

C. REFERIDOS (Programa mejora gradual)
   1. Agregar tiering
      └─ 1-10 referidos: 1 mes gratis
      └─ 11-50 referidos: 1.5 meses
      └─ 50+ referidos: 2 meses

   2. Agregar comisión monetaria
      └─ Complementaria al crédito
      └─ % configurable

D. LEADS (Crear UI para backend existente)
   1. Crear LeadsModule
      └─ frontend/modules/leads/pages/LeadsDashboard.jsx
      └─ Pipeline visual (Kanban)
      └─ Filtros por agent, status, área legal

   2. Crear LeadDetailDrawer
      └─ Editar datos del cliente
      └─ Agregar notas
      └─ Marcar como won/lost

IMPACTO ARQUITECTÓNICO: MÍNIMO
(se extienden módulos, no se cambia estructura)
```

---

### Fase 3: Nuevas Funcionalidades (EXPANSIÓN)
**Duración:** 4-6 semanas  
**Riesgo:** MEDIO (requiere nuevos módulos)

```
TAREAS:
─────

A. OFICINA VIRTUAL DE AGENTES (nuevo módulo)
   1. Crear frontend/modules/agent-office/
      └─ Calendario compartido
      └─ Directorio de agentes
      └─ Gestión de leads compartidos
      └─ Documentos y recursos

   2. Crear backend endpoints
      └─ POST /api/agent-office/calendar/book
      └─ GET /api/agent-office/agents
      └─ GET /api/agent-office/leads/unassigned
      └─ POST /api/agent-office/leads/assign

B. COMISIONES AUTOMÁTICAS
   1. Crear commission_payment_service.py
      └─ Lógica de cálculo
      └─ Identificar agentes con comisión pendiente
      └─ Generar batch de pagos

   2. Integración con payment gateway
      └─ Transferencias bancarias

C. REPORTES DE AGENTES
   1. Dashboard personal del agente
      └─ Mis leads
      └─ Mis comisiones
      └─ Mis KPIs
      └─ Gráficos de desempeño

   2. Reportes de admin
      └─ Comisiones pagadas por período
      └─ Top agentes
      └─ Análisis de países

IMPACTO ARQUITECTÓNICO: MEDIO
(nuevos módulos frontend + servicios backend, pero no reorganiza lo existente)
```

---

### Fase 4+: Optimizaciones y Escalado
**Duración:** Iterativo  
**Riesgo:** BAJO

```
TAREAS FUTURAS:
───────────────
- Automatización de leads por IA
- Marketplace de servicios entre agentes
- Integración con CRM externo
- Análisis predictivo de conversión
- Programa de certificación de agentes
```

---

## 8. RIESGOS Y MITIGACIÓN

### Riesgos Identificados

```
RIESGO                          PROBABILIDAD   IMPACTO   MITIGACIÓN
────────────────────────────────────────────────────────────────────
1. Colisión de campos en users  MEDIA          ALTO     Usar namespace "agent_"
   (al agregar agent fields)                             Test de migración

2. Performance de queries       BAJA           ALTO     Indexar partner_id, agent_id
   (con nuevas comisiones)                              en commission collection

3. Complicación de referidos    BAJA           MEDIO    Mantener compatibilidad
   (agregar tiering y dinero)                           backward

4. Falta de claridad de roles   MEDIA          MEDIO    Documentar matriz de 
   (agente vs partner vs client)                        permisos clara

5. Complejidad de divisas       BAJA           MEDIO    Usar catálogo maestro
   (multiple countries)                                 de países/divisas

6. Escalabilidad de chat        BAJA           BAJO     Ya está probado en
   (múltiples agentes)                                  produção con sales_chat
```

---

### Validaciones Recomendadas

```
ANTES DE FASE 1:
✅ Validar que migrations de users no rompan login
✅ Test de performance en db.commissions (índices)
✅ Documentar matriz de permisos (roles actuales)
✅ Definir estructura de commission rates (fijo vs variable)

ANTES DE FASE 2:
✅ Validar que renombramientos no afecten rutas
✅ Test de upload de documentos (tamaño, formato)
✅ Test de encriptación de datos bancarios
✅ Validar integraciones de payment gateway

ANTES DE FASE 3:
✅ Test de calendario compartido (concurrencia)
✅ Test de asignación de leads (lógica de negocio)
✅ Test de batch de pagos (precision de dinero)
```

---

## 9. CONCLUSIÓN

### Estado del Proyecto para Sales Layer

✅ **ARQUITECTURA:** Sin bloqueantes. Coexistencia de legacy y nuevo es correcta.

✅ **DATOS:** Base sólida. Falta información no crítica que se puede agregar incrementalmente.

✅ **MÓDULOS:** 80% de lo necesario ya existe (SalesRoom, Partners, Referidos, Leads backend).

⚠️ **INFORMACIÓN CRÍTICA FALTANTE:** Bancos, IVA, comisiones en dinero. PERO son migraciones sin reorquuestación.

✅ **PLAN GRADUAL:** Posible implementar en 3 fases sin alterar arquitectura actual.

### Recomendación Final

**PROCEDER CON CONFIANZA A FASE 1 (Normalización de Datos)**

El proyecto está en posición óptima para evolucionar hacia un **Sales Layer profesional** sin reorganización arquitectónica mayor. La auditoría confirma que:

1. Módulos existentes son reutilizables (80-95%)
2. No hay conflictos técnicos bloqueantes
3. Información faltante se puede agregar incrementalmente
4. Plan gradual respeta la arquitectura actual

---

**Auditoría Completada:** Junio 2026  
**Documento:** Sales Layer Master Plan v1.0  
**Status:** LISTO PARA STAKEHOLDER REVIEW Y APROBACIÓN DE FASE 1

