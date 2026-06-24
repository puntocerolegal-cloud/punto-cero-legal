# AGENT OFFICE BLUEPRINT
## Diseño de Oficina Virtual del Agente - Reutilizando Infraestructura Existente

**Documento de Diseño Funcional**  
**Fecha:** Junio 2026  
**Versión:** 1.0  
**Scope:** Arquitectura de Oficina Virtual del Agente sin reorganización

---

## 📋 TABLA DE CONTENIDOS

1. Visión General
2. Arquitectura de Reutilización
3. Dashboard Principal del Agente
4. Módulo Leads
5. Módulo Clientes
6. Módulo Comisiones
7. Módulo Países
8. Módulo Recursos
9. Integración con Admin OS
10. Flujo de Datos

---

## 1. VISIÓN GENERAL

### ¿Qué es la Oficina Virtual del Agente?

**Espacio centralizado donde agentes comerciales (abogados, partners, resellers) administran:**
- Leads asignados y generados
- Clientes activos y su estado
- Comisiones acumuladas y pagadas
- Performance por país
- Acceso a material comercial

### Principio de Diseño

**Reutilizar 100% de la infraestructura existente:**
```
Módulos Existentes          →  Oficina Virtual del Agente
─────────────────────────────────────────────────────
SalesRoomModule.jsx         → Dashboard (KPIs del agente)
LeadsModule (nuevo)         → Leads del agente
OrganizationsModule         → Clientes (son organizations)
PartnersDashboard           → Comisiones acumuladas
ReferralsDashboard          → Ingresos acumulados
CommissionsModule (nuevo)   → Estado de pagos
CountriesModule (nuevo)     → Rendimiento por territorio
ResourcesModule (nuevo)     → Material comercial
```

---

## 2. ARQUITECTURA DE REUTILIZACIÓN

### 2.1 Mapeo de Módulos → Oficina Virtual

```
INFRAESTRUCTURA EXISTENTE
════════════════════════════════════════════════════════

1. LEADS BACKEND
   Ubicación: backend/routes/leads.py + db.leads
   Datos: client_name, client_email, legal_area, status, created_at
   Relación: leads.lawyer_id = agente_id
   
   → USADO EN: Módulo Leads (listado de leads del agente)

2. TRANSACTIONS
   Ubicación: db.transactions
   Datos: user_email, plan_id, country, currency, amount_cop, amount_local
   Relación: transactions.user_email = cliente_email
   
   → USADO EN: Módulo Clientes (para identificar suscripciones)

3. CASES
   Ubicación: db.cases + backend/routes/cases.py
   Datos: client_id, lawyer_id, status, created_at, closed_at, value
   Relación: cases.lawyer_id = agente_id
   
   → USADO EN: Dashboard (ventas cerradas), Módulo Clientes

4. ORGANIZATIONS
   Ubicación: db.organizations + backend/routes/organizations.py
   Datos: name, vertical, plan, status, owner_id
   Relación: organizations.owner_id = agente_id (si es owner)
   
   → USADO EN: Módulo Clientes (si agente es owner de org)

5. PARTNERS (PARTNERS COMERCIALES)
   Ubicación: db.partners + backend/routes/partners.py
   Datos: companyName, contactName, commissionRate, projectedRevenue, status
   Relación: partners.createdBy = agente_id (si es partner)
   
   → USADO EN: Módulo Comisiones (comisión por partner)

6. USERS (REFERIDOS)
   Ubicación: db.users
   Datos: referral_code, free_months_credits, total_referrals, last_referral_at
   Relación: users.referral_code = código único del agente
   
   → USADO EN: Dashboard (referidos activos), Módulo Comisiones

7. SALES_CHAT
   Ubicación: db.sales_chat
   Datos: candidate_id, admin_id, content, created_at
   
   → USADO EN: Comunicación interna con admin

8. COUNTRIES (FUTURO)
   Ubicación: db.countries (será creada en Fase 1)
   Datos: code, name, region, currency, timezone
   
   → USADO EN: Módulo Países (filtros, configuración regional)
```

### 2.2 Flujo de Datos en Oficina Virtual

```
USUARIO AGENTE ACCEDE A /agent-office
│
├─→ GET /api/agents/me
│   └─ Response: { agent_id, name, type, commission_rate, country }
│
├─→ GET /api/agents/{agent_id}/dashboard
│   ├─ Llama leads.aggregate({ lawyer_id: agent_id })
│   ├─ Llama cases.countDocuments({ lawyer_id: agent_id })
│   ├─ Llama users.find({ referral_code: agent_code })
│   └─ Response: KPIs (leads, conversión, comisión)
│
├─→ GET /api/agents/{agent_id}/leads
│   ├─ Llama leads.find({ lawyer_id: agent_id }).sort({ created_at: -1 })
│   └─ Response: Array de leads asignados
│
├─→ GET /api/agents/{agent_id}/clients
│   ├─ Llama transactions.aggregate({ user_email })
│   ├─ Llama organizations.find({ owner_id: agent_id })
│   └─ Response: Array de clientes activos
│
├─→ GET /api/agents/{agent_id}/commissions
│   ├─ Llama commissions.find({ agent_id: agent_id })
│   ├─ Agrupa por status (pending, approved, paid)
│   └─ Response: Array de comisiones por estado
│
├─→ GET /api/agents/{agent_id}/countries-performance
│   ├─ Llama transactions.aggregate({ $group: { country, sum: revenue } })
│   ├─ Llama cases.aggregate({ $group: { country, count: closed_cases } })
│   └─ Response: Rendimiento por país
│
└─→ GET /api/resources/commercial
    ├─ Llama resources.find({ category: 'commercial' })
    └─ Response: Material compartido
```

---

## 3. DASHBOARD PRINCIPAL DEL AGENTE

### 3.1 Componentes del Dashboard

**Ubicación Conceptual:** `frontend/modules/agent-office/pages/AgentDashboard.jsx`  
**Datos Fuente:** Agregación de múltiples colecciones

#### Layout
```
┌─────────────────────────────────────────────────────────┐
│  BIENVENIDA: Hola [Nombre del Agente]                  │
│  Último acceso: [fecha]  │  País: [país del agente]    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              TARJETAS DE KPI (Grid 2x3)                 │
├──────────────────┬──────────────────┬──────────────────┤
│ Leads Totales    │ Conversión       │ Clientes Activos │
│ [número]         │ [%]              │ [número]         │
│ +[n] este mes    │ casos/leads      │ [n] organizaciones
├──────────────────┼──────────────────┼──────────────────┤
│ Comisión Pendiente│ Comisión Pagada │ Referidos Activos│
│ $[monto]         │ $[monto]         │ [número]         │
│ Esperando pago   │ Historial último │ Mes gratis x [n] │
│                  │ 90 días          │                  │
└──────────────────┴──────────────────┴──────────────────┘

┌─────────────────────────────────────────────────────────┐
│  GRÁFICO: Ingresos Últimos 6 Meses (Líneas)            │
│  X: mes  |  Y: monto (COP / divisa local)              │
│  Comisiones pagadas + comisión pendiente                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  RESUMEN RÁPIDO: Leads Recientes (últimas 5)            │
│  │ Cliente | Área Legal | Estado | Días en Pipeline │    │
├──┼─────────┼────────────┼────────┼──────────────────┤    │
│1.│ Acme Inc│ Laboral    │ Nuevo  │ 1 día            │    │
│2.│ XYZ LLC │ Corporativo│ En eval│ 5 días           │    │
└──┴─────────┴────────────┴────────┴──────────────────┘    │
```

### 3.2 KPIs Mostrados

**Datos extraídos de:**

```
1. LEADS TOTALES
   Fuente: db.leads.countDocuments({ lawyer_id: {agent_id} })
   Variación: Leads este mes
   
2. CONVERSIÓN
   Fuente: db.leads + db.cases
   Fórmula: (cases.count where lawyer_id = agent_id) / (leads.count) * 100%
   
3. CLIENTES ACTIVOS
   Fuente: db.transactions
   Filtro: transactions donde user.referral_code = agent.referral_code
           O organizations.owner_id = agent_id
   
4. COMISIÓN PENDIENTE
   Fuente: db.commissions
   Filtro: status = 'pending' OR status = 'approved'
   
5. COMISIÓN PAGADA
   Fuente: db.commissions
   Filtro: status = 'paid'
   Período: Últimos 90 días
   
6. REFERIDOS ACTIVOS
   Fuente: db.users
   Filtro: referral_code = agent.referral_code
   Total: users.total_referrals
   Beneficio: free_months_credits
```

### 3.3 Funcionalidades Dashboard

```
ACCIÓN                              DESTINO
────────────────────────────────────────────────────────
Click en "Leads Totales"       → Módulo Leads (filtrado)
Click en "Comisión Pendiente"  → Módulo Comisiones (pending)
Click en "Ver Clientes"        → Módulo Clientes
Click en "Countries"           → Módulo Países
Click en "Recursos"            → Módulo Recursos
Click en lead reciente         → Detalle del lead
```

---

## 4. MÓDULO LEADS

### 4.1 Vista Principal de Leads

**Ubicación Conceptual:** `frontend/modules/agent-office/pages/LeadsPage.jsx`

#### Estructura de Lista

```
┌─────────────────────────────────────────────────────────┐
│  MIS LEADS                                              │
│  Filtros: [Estado] [Área Legal] [Asignación] [Período]│
│  Búsqueda: [nombre del cliente]                        │
└─────────────────────────────────────────────────────────┘

VISTA: Kanban (Pipeline)
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ NUEVO    │CONTACTADO│EN EVAL   │PROPUESTA │ GANADO  │
│(count)   │ (count)  │ (count)  │ (count)  │(count)  │
├──────────┴──────────┴──────────┴──────────┴──────────┤
│                                                       │
│ ┌────────────┐    ┌────────────┐    ┌────────────┐  │
│ │ Acme Inc   │    │ XYZ LLC    │    │ Tech Corp  │  │
│ │ Laboral    │    │ IP         │    │ Corporativo│  │
│ │ 1 día      │    │ 10 días    │    │ 15 días    │  │
│ │ Est: $500  │    │ Est: $2000 │    │ Est: $5000 │  │
│ └────────────┘    └────────────┘    └────────────┘  │
│                                                       │
│ ┌────────────┐    ┌────────────┐    ┌────────────┐  │
│ │ MegaStore  │    │ StartupX   │    │ FinalCase  │  │
│ │ Tributario │    │ Laboral    │    │ Laboral    │  │
│ │ 2 días     │    │ 3 días     │    │ 20 días    │  │
│ │ Est: $800  │    │ Est: $1200 │    │ Ganado!    │  │
│ └────────────┘    └────────────┘    └────────────┘  │
│                                                       │
└───────────────────────────────────────────────────────┘

VISTA ALTERNATIVA: Tabla (Listado)
│ Cliente      │ Área Legal   │ Estado        │ Días │ Est.   │
├──────────────┼──────────────┼───────────────┼──────┼────────┤
│ Acme Inc     │ Laboral      │ Nuevo         │ 1    │ $500   │
│ XYZ LLC      │ IP           │ Contactado    │ 10   │ $2000  │
│ Tech Corp    │ Corporativo  │ En Evaluación │ 15   │ $5000  │
└──────────────┴──────────────┴───────────────┴──────┴────────┘
```

### 4.2 Datos Mostrados por Lead

**Fuente: db.leads**

```
CAMPO               REUTILIZACIÓN
────────────────────────────────────────
client_name        Título de la tarjeta
legal_area         Etiqueta de área
description        Tooltip al hover
status             Columna Kanban
created_at         "X días en pipeline"
estimated_value    "Est: $[monto]" (futuro campo)
notes               Acceso en drawer
lawyer_id          Filtro (solo mis leads)
```

### 4.3 Acciones en Módulo Leads

```
ACCIÓN                              UBICACIÓN            API
────────────────────────────────────────────────────────────────
Ver detalle lead            Drawer lateral           GET /leads/{id}
Cambiar estado lead         Dropdown en tarjeta      PUT /leads/{id}
Agregar nota interna        Textarea en drawer       PUT /leads/{id}/notes
Marcar como ganado          Botón en drawer          PUT /leads/{id} (status=won)
Cambiar assigned_to         Asignar a otro abogado   PUT /leads/{id}/assign
Filtrar por estado          Columnas Kanban          GET /leads?status=
Buscar por cliente          Input búsqueda           GET /leads?search=
Exportar leads              Botón export             GET /leads/export
```

### 4.4 Integración con Comisiones

```
Cuando status = 'won':
│
├─ Crear registro en db.commissions
│  ├─ agent_id = lawyer_id
│  ├─ lead_id = lead.id
│  ├─ case_id = caso creado
│  ├─ amount = valor_del_caso × commission_rate
│  └─ status = 'earned'
│
└─ Notificar al agente
   └─ "Comisión de $XXX generada por lead [cliente]"
```

---

## 5. MÓDULO CLIENTES

### 5.1 Vista de Clientes Activos

**Ubicación Conceptual:** `frontend/modules/agent-office/pages/ClientsPage.jsx`  
**Datos Fuente:** db.transactions + db.organizations + db.cases

#### Layout

```
┌─────────────────────────────────────────────────────────┐
│  MIS CLIENTES                                           │
│  Filtros: [País] [Plan] [Estado Suscripción] [Período]│
│  Búsqueda: [nombre del cliente]                        │
│  Total: [número] clientes activos                      │
└─────────────────────────────────────────────────────────┘

TABLA DE CLIENTES:
│ Cliente         │ País   │ Plan      │ Estado       │ Casos │
├─────────────────┼────────┼───────────┼──────────────┼───────┤
│ Acme Inc        │ COP    │ Enterprise│ Activo       │ 3     │
│ XYZ LLC         │ UYU    │ Pro       │ Activo       │ 1     │
│ Tech Corp       │ MXN    │ Starter   │ Activo       │ 5     │
│ StartupX        │ COP    │ Enterprise│ Vencimiento: │ 0     │
│                 │        │           │ 5 días       │       │
└─────────────────┴────────┴───────────┴──────────────┴───────┘
```

### 5.2 Datos por Cliente

**Fuente: Agregación de múltiples colecciones**

```
CAMPO                FUENTE                  DESCRIPCIÓN
──────────────────────────────────────────────────────────
Nombre Cliente       transactions.user_name  O organizations.name
País                 transactions.country    Código de país (COP, UYU)
Divisa               transactions.currency   ARS, MXN, etc.
Plan                 transactions.plan_id    Plan contratado
Estado Suscripción   organizations.status    Active, suspended, expired
Fecha Inicio         transactions.created_at Cuándo se suscribió
Casos Asociados      cases.count             Cuántos casos cerrados
Próximo Renovación   calc (created_at + 30d) Fecha de renovación
Ingresos (MRR)       transactions.amount     Monto recurrente
```

### 5.3 Acciones en Módulo Clientes

```
ACCIÓN                          UBICACIÓN              API
────────────────────────────────────────────────────────────
Ver perfil cliente       Click en fila             GET /organizations/{id}
Ver contratos cliente    Drawer lateral            GET /cases?org_id=
Agregar caso nuevo       Botón "+ Caso"           POST /cases
Cambiar plan cliente     Dropdown en fila          PUT /organizations/{id}
Enviar mensaje           Chat en drawer            POST /messages
Ver historial pagos      Pestaña en drawer         GET /transactions?user_id=
Crear factura            Botón en drawer           (futuro)
Exportar clientes        Botón export              GET /organizations/export
```

### 5.4 Alertas de Estado

```
CONDICIÓN                           ALERTA MOSTRADA
────────────────────────────────────────────────────────
Plan vencido hace 5+ días          "Suscripción expirada"
Plan vence en 5 días               "Vencimiento próximo"
Cliente sin casos en 30 días       "Oportunidad de venta"
Nuevo cliente (< 7 días)           "Bienvenida especial"
Cliente con 5+ casos cerrados      "Cliente VIP"
```

---

## 6. MÓDULO COMISIONES

### 6.1 Vista de Estado de Comisiones

**Ubicación Conceptual:** `frontend/modules/agent-office/pages/CommissionsPage.jsx`  
**Datos Fuente:** db.commissions (colección futura)

#### Layout

```
┌─────────────────────────────────────────────────────────┐
│  MIS COMISIONES                                         │
│  Período: [Mes/Año Selector]  │  Total: $[monto]       │
└─────────────────────────────────────────────────────────┘

TABS: [Pendiente] [Aprobada] [Pagada] [Historial]

TAB: PENDIENTE (comisiones no revisadas)
┌───────────────────────────────────────────────────────┐
│ Comisiones por Revisar: [número]                      │
├───────────────────────────────────────────────────────┤
│ Caso            │ Cliente      │ Monto     │ Desde   │
├─────────────────┼──────────────┼───────────┼─────────┤
│ #CAS-2024-001   │ Acme Inc     │ $1,500    │ 5 días  │
│ #CAS-2024-002   │ XYZ LLC      │ $500      │ 10 días │
│ #CAS-2024-003   │ Tech Corp    │ $3,000    │ 15 días │
│                                            Total: $5,000│
└───────────────────────────────────────────────────────┘

TAB: APROBADA (comisiones lisas para pago)
┌───────────────────────────────────────────────────────┐
│ Comisiones Aprobadas: [número]                        │
│ Próximo Pago: [fecha]                                 │
├───────────────────────────────────────────────────────┤
│ Caso            │ Cliente      │ Monto     │ Aprobada│
├─────────────────┼──────────────┼───────────┼─────────┤
│ #CAS-2024-004   │ MegaStore    │ $2,000    │ 2 días  │
│ #CAS-2024-005   │ StartupX     │ $1,200    │ 5 días  │
│                                   Total: $3,200│
└───────────────────────────────────────────────────────┘

TAB: PAGADA (dinero en cuenta)
┌───────────────────────────────────────────────────────┐
│ Comisiones Pagadas (Últimos 90 días): [número]       │
│ Total Pagado: $[suma total de período]               │
├───────────────────────────────────────────────────────┤
│ Caso            │ Cliente      │ Monto     │ Pagada  │
├─────────────────┼──────────────┼───────────┼─────────┤
│ #CAS-2024-006   │ Acme Inc     │ $1,500    │ 30 días │
│ #CAS-2024-007   │ XYZ LLC      │ $500      │ 25 días │
│ #CAS-2024-008   │ Tech Corp    │ $3,000    │ 20 días │
│ (...)           │ (...)        │ (...)     │ (...)   │
│                              Total (90d): $45,000│
└───────────────────────────────────────────────────────┘

GRÁFICO: Tendencia de Comisiones (Últimos 6 meses)
X-axis: Mes
Y-axis: Monto ($)
Línea: Comisión pendiente (naranja)
Línea: Comisión pagada (verde)
```

### 6.2 Datos por Comisión

**Fuente: db.commissions (colección futura en Fase 1)**

```
CAMPO               DESCRIPCIÓN
─────────────────────────────────────────────────
commission_id      ID único
agent_id           ID del agente (lawyer_id)
case_id            ID del caso cerrado
lead_id            ID del lead que generó
client_name        Nombre del cliente
amount             Monto de la comisión ($)
currency           Divisa (COP, UYU, MXN, etc.)
status             pending → approved → paid
created_at         Fecha de cálculo
approved_at        Fecha de aprobación
paid_at            Fecha de pago
payment_method     Transferencia, PayPal, etc.
notes              Notas del admin
```

### 6.3 Estados de Comisión

```
ESTADO      DESCRIPCIÓN                    MOSTRADO A AGENTE
──────────────────────────────────────────────────────────────
pending     Creada, esperando revisión     TAB "Pendiente"
approved    Revisada, aprobada             TAB "Aprobada"
paid        Dinero transferido             TAB "Pagada"
disputed    En revisión por discrepancia   TAB "Aprobada" (alerta)
reversed    Cancelada (reembolso cliente)  TAB "Pagada" (cancelada)
adjusted    Ajustada manualmente           TAB "Historial" (nota)
```

### 6.4 Funcionalidades

```
ACCIÓN                              UBICACIÓN          PERMISO
────────────────────────────────────────────────────────────────
Ver detalle comisión        Click en fila          Lectura
Descargar comprobante       Botón "PDF"            Lectura
Solicitar pago adelantado   Botón "Solicitar"      Solo agente
Ver estado de pago          Pestaña "Pagada"       Lectura
Filtrar por período         Selector de mes/año    Lectura
Ver promedio mensual        Gráfico tendencia      Lectura
Exportar historial          Botón "Export"         Lectura
Contactar admin             Botón "Consulta"       Lectura
```

---

## 7. MÓDULO PAÍSES

### 7.1 Vista de Rendimiento por País

**Ubicación Conceptual:** `frontend/modules/agent-office/pages/CountriesPage.jsx`  
**Datos Fuente:** db.countries (futura) + agregaciones de transactions, cases

#### Layout

```
┌─────────────────────────────────────────────────────────┐
│  RENDIMIENTO POR PAÍS                                   │
│  Período: [Mes/Año Selector]                           │
└─────────────────────────────────────────────────────────┘

TABLA: Rendimiento por País
│ País      │ Clientes │ Ventas  │ Comisión │ Tasa Conv. │ Trend │
├───────────┼──────────┼─────────┼──────────┼────────────┼───────┤
│ Colombia  │ 15       │ $45,000 │ $6,750   │ 45%        │ ↑ 12% │
│ Uruguay   │ 8        │ $18,000 │ $2,700   │ 38%        │ ↑ 5%  │
│ México    │ 10       │ $25,000 │ $3,750   │ 42%        │ ↓ 3%  │
│ Argentina │ 5        │ $12,000 │ $1,800   │ 35%        │ ↑ 8%  │
│ Chile     │ 3        │ $8,000  │ $1,200   │ 40%        │ ↓ 2%  │
│ Perú      │ 2        │ $5,000  │ $750     │ 30%        │ ↑ 1%  │
│ ────────────────────────────────────────────────────────────── │
│ TOTAL     │ 43       │ $113,000│ $16,950  │ 40%        │ ↑ 6%  │
└───────────┴──────────┴─────────┴──────────┴────────────┴───────┘

GRÁFICO: Ingresos por País (Pie Chart)
[Gráfico pastel con países coloreados y % de ingresos]

GRÁFICO: Evolución Mensual por País (Líneas)
X-axis: Mes
Y-axis: Ingresos ($)
Líneas: Una por cada país principales
```

### 7.2 Datos por País

**Fuente: Agregación + db.countries (futura)**

```
CAMPO                   FUENTE                  CÁLCULO
─────────────────────────────────────────────────────────
País                    db.countries.name       
Zona Horaria            db.countries.timezone   Para scheduling
Divisa                  db.countries.currency   MXN, UYU, etc.
Clientes Activos        COUNT(transactions)     Por país
Total Ventas            SUM(amount)             Últimos 30 días
Comisiones              SUM(commissions)        Acumuladas
Tasa Conversión         cases / leads * 100%    % de éxito
Promedio Ticket         total_sales / clientes  $ por cliente
Tendencia (YoY)         mes_actual / mes_ant    % crecimiento
```

### 7.3 Funcionalidades

```
ACCIÓN                              RESULTADO
────────────────────────────────────────────────────────
Click en país                 Expande detalles del país
Click en "Clientes"           Filtra Módulo Clientes por país
Click en "Leads"              Filtra Módulo Leads por país
Click en "Ver Casos"          Muestra casos cerrados en país
Cambiar período               Actualiza todos los gráficos
Exportar reporte              Descarga PDF con datos país
Comparar con período anterior Muestra delta (↑/↓)
Ver objetivos (futuro)        Muestra meta vs actual
```

---

## 8. MÓDULO RECURSOS

### 8.1 Vista de Material Comercial

**Ubicación Conceptual:** `frontend/modules/agent-office/pages/ResourcesPage.jsx`  
**Datos Fuente:** db.resources (colección futura)

#### Layout

```
┌─────────────────────────────────────────────────────────┐
│  CENTRO DE RECURSOS                                     │
│  Para Agentes Comerciales de Punto Cero Legal          │
└─────────────────────────────────────────────────────────┘

CATEGORÍAS (Tabs):
[Manuales] [Presentaciones] [Videos] [Templates] [Estudios]

TAB: MANUALES
┌───────────────────────────────────────────────────────┐
│ ┌──────────────────────┐  ┌──────────────────────┐    │
│ │ 📋 Manual Venta 2024 │  │ 📋 Guía de Servicio  │    │
│ │ PDF 2.3 MB           │  │ PDF 1.5 MB           │    │
│ │ Actualizado: Ene     │  │ Actualizado: Ene     │    │
│ │ [Ver] [Descargar]    │  │ [Ver] [Descargar]    │    │
│ └──────────────────────┘  └──────────────────────┘    │
│                                                       │
│ ┌──────────────────────┐  ┌──────────────────────┐    │
│ │ 📋 Preguntas Frecuentes│  │ 📋 Promo Abogados   │    │
│ │ PDF 0.8 MB           │  │ PDF 3.2 MB           │    │
│ │ Actualizado: Mar     │  │ Actualizado: Abr     │    │
│ │ [Ver] [Descargar]    │  │ [Ver] [Descargar]    │    │
│ └──────────────────────┘  └──────────────────────┘    │
└───────────────────────────────────────────────────────┘

TAB: PRESENTACIONES
┌───────────────────────────────────────────────────────┐
│ ┌──────────────────────┐  ┌──────────────────────┐    │
│ │ 🎬 Pitch Ejecutivo   │  │ 🎬 Webinar Precios  │    │
│ │ PowerPoint 15 MB     │  │ PDF 8.5 MB          │    │
│ │ Actualizado: Mar     │  │ Actualizado: Feb     │    │
│ │ [Ver] [Descargar]    │  │ [Ver] [Descargar]    │    │
│ └──────────────────────┘  └──────────────────────┘    │
└───────────────────────────────────────────────────────┘

TAB: VIDEOS
┌───────────────────────────────────────────────────────┐
│ ┌──────────────────────┐  ┌──────────────────────┐    │
│ │ ▶️ Cómo Usar Plataforma│ │ ▶️ Testimonios Clientes│
│ │ Video 12 min         │  │ Video 8 min         │    │
│ │ 2024                 │  │ 2024                │    │
│ │ [Ver] [Compartir]    │  │ [Ver] [Compartir]   │    │
│ └──────────────────────┘  └──────────────────────┘    │
│                                                       │
│ ┌──────────────────────┐  ┌──────────────────────┐    │
│ │ ▶️ Cierre de Casos   │  │ ▶️ FAQ Agentes      │    │
│ │ Video 15 min        │  │ Video 10 min        │    │
│ │ 2024                │  │ 2024                │    │
│ │ [Ver] [Compartir]   │  │ [Ver] [Compartir]   │    │
│ └──────────────────────┘  └──────────────────────┘    │
└───────────────────────────────────────────────────────┘

TAB: TEMPLATES
┌───────────────────────────────────────────────────────┐
│ ┌──────────────────────┐  ┌──────────────────────┐    │
│ │ 📄 Propuesta Estándar│  │ 📄 Contrato Laboral  │    │
│ │ Word 1.2 MB          │  │ Word 2.1 MB          │    │
│ │ [Descargar]          │  │ [Descargar]          │    │
│ └──────────────────────┘  └──────────────────────┘    │
│                                                       │
│ ┌──────────────────────┐  ┌──────────────────────┐    │
│ │ 📄 Email Seguimiento │  │ 📄 Factura Template  │    │
│ │ Texto 0.3 MB         │  │ Excel 0.8 MB         │    │
│ │ [Descargar]          │  │ [Descargar]          │    │
│ └──────────────────────┘  └──────────────────────┘    │
└───────────────────────────────────────────────────────┘
```

### 8.2 Tipo de Recursos

**Fuente: db.resources (colección futura)**

```
CATEGORÍA           TIPO DE CONTENIDO            FORMATO
──────────────────────────────────────────────────────────
Manual              Guías operativas             PDF, DOC
Presentación        Decks comerciales            PowerPoint
Video               Tutoriales, testimonios      MP4, YouTube
Template            Documentos reutilizables     Word, Excel
Estudio             Análisis de mercado          PDF, Informe
Plantilla Email     Correos estándar             TXT, HTML
Material Web        Gráficos, banners            JPG, PNG
Regulación          Normativas por país          PDF
```

### 8.3 Funcionalidades

```
ACCIÓN                          RESULTADO
────────────────────────────────────────────────────────────
Ver recurso                  Abre en ventana/previa
Descargar                    Descarga archivo local
Compartir en email           Envía enlace a contacto
Compartir en WhatsApp        Copia enlace para chat
Añadir a favoritos           Guarda en "Mi colección"
Buscar recurso               Filtra por keyword
Filtrar por fecha            Muestra nuevos primero
Solicitar nuevo recurso      Formulario → Admin
Enviar feedback              Comentarios sobre material
```

---

## 9. INTEGRACIÓN CON ADMIN OS

### 9.1 Qué Ve el Administrador

**Panel de Control Administrativo:**

```
VISTA ADMIN: Dashboard de Agentes
┌─────────────────────────────────────────────────────────┐
│  GESTIÓN DE AGENTES (Admin OS)                          │
│  Total de Agentes Activos: [número]                    │
└─────────────────────────────────────────────────────────┘

TABLA: Resumen de Agentes
│ Agente         │ Leads │ Conversión │ Comisión Pendiente│
├────────────────┼───────┼────────────┼──────────────────┤
│ Carlos López   │ 25    │ 48%        │ $8,500 (5 pendientes)
│ María García   │ 18    │ 52%        │ $5,200 (3 pendientes)
│ Juan Pérez     │ 12    │ 40%        │ $3,100 (2 pendientes)
│ Ana Martínez   │ 8     │ 35%        │ $1,800 (1 pendiente)
└────────────────┴───────┴────────────┴──────────────────┘

ACCIONES ADMIN:
├─ Click en Agente → Ver panel completo del agente
├─ Aprobar Comisiones → Cambiar status pending → approved
├─ Pagar Comisiones → Generar batch de transferencias
├─ Ver Leads del Agente → Auditar pipeline
└─ Editar Datos Agente → Cambiar commission_rate, país, etc.
```

### 9.2 Datos que Admin Recibe

**Endpoints que Admin OS monitorea:**

```
ENDPOINT                            DATOS DISPONIBLES
──────────────────────────────────────────────────────────
GET /api/admin/agents               Lista todos agentes
GET /api/admin/agents/{id}/summary  KPIs individuales
GET /api/admin/agents/{id}/leads    Leads del agente
GET /api/admin/agents/{id}/clients  Clientes del agente
GET /api/admin/agents/{id}/comissions  Comisiones pendientes
GET /api/admin/commissions/pending   Todas comisiones x pagar
GET /api/admin/commissions/stats    Estadísticas globales
GET /api/admin/agents/performance    Rankings y comparativas
```

### 9.3 Acciones que Admin Puede Hacer

```
ACCIÓN                          FUENTE/DESTINO
──────────────────────────────────────────────────────
Aprobar comisión               PUT /admin/commissions/{id}/approve
Rechazar comisión              PUT /admin/commissions/{id}/reject
Pagar comisión                 POST /admin/commissions/{id}/pay
Crear batch de pagos           POST /admin/commissions/batch-pay
Editar datos agente            PUT /admin/agents/{id}
Suspender agente               PUT /admin/agents/{id}/suspend
Ver auditoría de leads          GET /admin/agents/{id}/audit
Generar reporte                GET /admin/agents/report/pdf
Configurar commission_rate      PUT /admin/agents/{id}/rate
Reasignar leads                PUT /admin/leads/{id}/reassign
```

### 9.4 Alertas que Admin Recibe

```
ALERTA                          TRIGGER                  ACCIÓN
────────────────────────────────────────────────────────────
Comisión por aprobar           > 5 comisiones pending   Notif
Agente bajo rendimiento        conversión < 30%         Notif
Leads sin asignar              > 3 días sin atender     Notif
Pago de comisión atrasado      > 15 días sin pagar      Alerta
Agente con churn alto          > 3 clientes perdidos    Notif
Nueva comisión generada        status creada            Notif
Solicitud de adelanto          agente solicita pago     Notif
```

---

## 10. FLUJO DE DATOS COMPLETO

### 10.1 Ciclo Completo de un Lead

```
PASO 1: Lead Generado
┌─────────────────────────────────────┐
│ ADMIN crea lead en Sala de Ventas   │
│ Datos: cliente, área, abogado       │
│ → db.leads { status: 'new' }        │
│ → Notif al agente                   │
└─────────────────────────────────────┘
         ↓
PASO 2: Agente Ve en su Oficina Virtual
┌─────────────────────────────────────┐
│ Módulo Leads → Kanban → NEW column  │
│ Agente ve: "Acme Inc - Laboral"     │
│ Puede hacer drag-drop a CONTACTED   │
└─────────────────────────────────────┘
         ↓
PASO 3: Agente Avanza Lead
┌─────────────────────────────────────┐
│ Agente agrega notas, cambia estado  │
│ PUT /leads/{id} { status: won }     │
│ → db.leads { status: 'won' }        │
│ → db.cases crea caso nuevo          │
└─────────────────────────────────────┘
         ↓
PASO 4: Comisión Generada
┌─────────────────────────────────────┐
│ Backend calcula: caso.value × rate  │
│ → db.commissions { status: pending} │
│ → Notif al agente: "$X ganada"      │
└─────────────────────────────────────┘
         ↓
PASO 5: Admin Aprueba
┌─────────────────────────────────────┐
│ Admin OS ve en Comisiones Pendientes│
│ PUT /admin/commissions/{id}/approve │
│ → db.commissions { status: approved}│
│ → Notif al agente: "Aprobada"       │
└─────────────────────────────────────┘
         ↓
PASO 6: Pago Realizado
┌─────────────────────────────────────┐
│ Admin procesa batch de pagos        │
│ POST /admin/commissions/batch-pay   │
│ → db.commissions { status: paid }   │
│ → Notif al agente: "Pagada $X"      │
│ → Transferencia bancaria            │
└─────────────────────────────────────┘
         ↓
PASO 7: Agente Ve en Dashboard
┌─────────────────────────────────────┐
│ Dashboard Oficina Virtual actualiza │
│ Comisión Pagada: +$X                │
│ Módulo Comisiones → TAB Pagada      │
│ Agente puede descargar comprobante  │
└─────────────────────────────────────┘
```

### 10.2 Estructura de Bases de Datos Utilizada

```
TABLA / COLECCIÓN          CAMPOS RELEVANTES      RELACIONES
──────────────────────────────────────────────────────────────
db.leads
  ├─ _id
  ├─ lawyer_id (agente)   → users._id
  ├─ client_name
  ├─ status
  ├─ created_at
  └─ converted_to         → cases._id

db.cases
  ├─ _id
  ├─ lawyer_id (agente)   → users._id
  ├─ client_id            → users._id (cliente)
  ├─ status
  ├─ value
  ├─ created_at
  └─ closed_at

db.commissions (NUEVA en Fase 1)
  ├─ _id
  ├─ agent_id             → users._id
  ├─ case_id              → cases._id
  ├─ lead_id              → leads._id
  ├─ amount
  ├─ status (pending/approved/paid)
  ├─ created_at
  └─ paid_at

db.users
  ├─ _id
  ├─ email
  ├─ referral_code
  ├─ total_referrals
  ├─ role (lawyer, client, admin, etc.)
  └─ country

db.transactions
  ├─ _id
  ├─ user_email            → users.email
  ├─ country
  ├─ currency
  ├─ amount
  └─ created_at

db.organizations
  ├─ _id
  ├─ owner_id             → users._id (agente if owner)
  ├─ name
  ├─ status
  ├─ plan
  └─ created_at

db.countries (NUEVA en Fase 1)
  ├─ _id
  ├─ code (COP, UYU)
  ├─ name
  ├─ currency
  ├─ timezone
  └─ region

db.resources (NUEVA)
  ├─ _id
  ├─ category (manual, video, template)
  ├─ title
  ├─ url / file_path
  ├─ created_at
  └─ updated_at
```

---

## 11. SEGURIDAD Y PERMISOS

### 11.1 Matriz de Permisos

```
ACCIÓN                          AGENTE    ADMIN    CLIENTE
─────────────────────────────────────────────────────────────
Ver propio dashboard            ✅        ✅       ✗
Ver propios leads               ✅        ✅       ✗
Ver propios clientes            ✅        ✅       ✗
Ver propias comisiones          ✅        ✅       ✗
Editar lead                     ✅        ✅       ✗
Cambiar estado lead             ✅        ✅       ✗
Crear nueva comisión            ✗         ✅       ✗
Aprobar comisión                ✗         ✅       ✗
Pagar comisión                  ✗         ✅       ✗
Editar datos agente             ✗         ✅       ✗
Ver datos otros agentes         ✗         ✅       ✗
Descargar recursos              ✅        ✅       ✗
Solicitar nuevo recurso         ✅        ✅       ✗
```

### 11.2 Validaciones de Datos

```
DATO                            VALIDACIÓN
──────────────────────────────────────────────────────────
Email agente                    unique, valid email format
Comisión rate                   0-100%, número
Monto comisión                  positivo, máximo 2 decimales
Estatus lead                    enum (new, contacted, won, lost)
País                            código ISO válido
Cuenta bancaria                 validar formato por país
IVA/Impuestos                   formato por país
```

---

## 12. CONCLUSIONES

### Oficina Virtual del Agente = Agregación Inteligente de Módulos Existentes

**No requiere reorganización arquitectónica.**

```
COMPONENTES EXISTENTES          REUTILIZACIÓN        ESTADO
──────────────────────────────────────────────────────────────
Sala de Ventas                  Dashboard del agente  ✅
Leads (backend)                 Módulo Leads         ✅ (falta UI)
Cases                           Clientes             ✅ (agregación)
Organizations                   Clientes (owners)    ✅
Partners                        Comisiones           ✅ (extensión)
Referidos                        Ingresos adicionales ✅
Users (referral_code)           Tracking de leads    ✅
Transactions                    Historial de ventas  ✅
Sales Chat                      Comunicación         ✅
```

### Nuevas Colecciones Requeridas (Fase 1)

```
db.commissions      → Tracking de dinero (crítico)
db.countries        → Normalización regional (importante)
db.resources        → Contenido compartido (futuro)
```

### Endpoints Admin Requeridos (Fase 1)

```
GET  /api/admin/agents                  → Lista agentes
POST /api/admin/commissions/{id}/approve
POST /api/admin/commissions/{id}/pay
GET  /api/admin/commissions/pending     → Comisiones x pagar
```

### Implementación Gradual

**Fase 0:** Diseño (HECHO)  
**Fase 1:** Normalización de datos + endpoints admin  
**Fase 2:** Módulos de Oficina Virtual (UI)  
**Fase 3:** Recursos y comunicación  
**Fase 4+:** Automatización y expansión

---

**Blueprint Completado:** Junio 2026  
**Status:** LISTO PARA DESARROLLO  
**Riesgo Arquitectónico:** BAJO (reutilización total)

