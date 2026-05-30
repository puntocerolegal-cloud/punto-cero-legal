# DIAGRAMA ENTIDAD-RELACIÓN (ERD) - PUNTO CERO LEGAL

## ENTIDADES Y RELACIONES

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ARQUITECTURA DE BASE DE DATOS                       │
│                          Portal Funcional para Abogados                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│      USERS       │ (Tabla Central de Usuarios)
├──────────────────┤
│ _id              │ PK
│ email            │ UNIQUE
│ password_hash    │
│ full_name        │
│ role             │ ENUM: admin, lawyer, client
│ phone            │
│ country          │
│ specialty        │ (para abogados)
│ bar_number       │ (matrícula profesional)
│ subscription_id  │ FK -> subscriptions._id
│ status           │ ENUM: active, inactive, suspended
│ created_at       │
│ updated_at       │
└──────────────────┘
         │
         │ 1:N
         ├──────────────────────────────────────────────┐
         │                                                │
         ▼                                                ▼
┌──────────────────┐                            ┌──────────────────┐
│      LEADS       │ (CRM - Pipeline de Ventas) │  SUBSCRIPTIONS   │
├──────────────────┤                            ├──────────────────┤
│ _id              │ PK                         │ _id              │ PK
│ lawyer_id        │ FK -> users._id            │ lawyer_id        │ FK -> users._id
│ client_name      │                            │ plan_type        │ ENUM: basic, pro, enterprise
│ client_email     │                            │ price            │
│ client_phone     │                            │ start_date       │
│ legal_area       │                            │ end_date         │
│ description      │                            │ status           │ ENUM: active, expired, cancelled
│ status           │ ENUM: new, contacted,      │ payment_method   │
│                  │       qualified, converted │ cases_limit      │
│ source           │                            │ storage_limit    │
│ assigned_date    │                            │ created_at       │
│ converted_to     │ FK -> cases._id (nullable) │ updated_at       │
│ created_at       │                            └──────────────────┘
│ updated_at       │
└──────────────────┘
         │
         │ 1:1 (al convertir)
         ▼
┌──────────────────┐
│      CASES       │ (Gestión de Expedientes Legales)
├──────────────────┤
│ _id              │ PK
│ case_number      │ UNIQUE (auto-generado)
│ lawyer_id        │ FK -> users._id
│ client_id        │ FK -> users._id
│ title            │
│ legal_area       │
│ description      │
│ status           │ ENUM: open, in_progress, closed, archived
│ priority         │ ENUM: low, medium, high, urgent
│ start_date       │
│ deadline         │
│ court            │
│ case_type        │
│ documents        │ Array of document objects
│ tags             │ Array
│ billable_hours   │
│ total_billed     │
│ lead_source_id   │ FK -> leads._id (nullable)
│ created_at       │
│ updated_at       │
└──────────────────┘
         │
         │ 1:N
         ├──────────────────────────────────────────────────────┐
         │                                                        │
         ▼                                                        ▼
┌──────────────────┐                                   ┌──────────────────┐
│ CASE_ACTIVITIES  │ (Log de Actividades por Caso)    │    INVOICES      │ (Finanzas)
├──────────────────┤                                   ├──────────────────┤
│ _id              │ PK                                │ _id              │ PK
│ case_id          │ FK -> cases._id                   │ case_id          │ FK -> cases._id
│ user_id          │ FK -> users._id                   │ lawyer_id        │ FK -> users._id
│ activity_type    │ ENUM: note, call, email,          │ client_id        │ FK -> users._id
│                  │       document, meeting, hearing  │ invoice_number   │ UNIQUE
│ description      │                                   │ description      │
│ duration_minutes │ (para facturación)                │ amount           │
│ billable         │ Boolean                           │ hours            │
│ meeting_id       │ FK -> meetings._id (nullable)     │ hourly_rate      │
│ created_at       │                                   │ status           │ ENUM: draft, sent, paid, overdue
└──────────────────┘                                   │ issue_date       │
                                                       │ due_date         │
         │                                              │ paid_date        │
         │ N:1                                          │ payment_method   │
         ▼                                              │ created_at       │
┌──────────────────┐                                   │ updated_at       │
│    MEETINGS      │ (Sala de Conferencias)            └──────────────────┘
├──────────────────┤                                             │
│ _id              │ PK                                          │ N:1
│ case_id          │ FK -> cases._id                             │
│ host_id          │ FK -> users._id                             │
│ title            │                                              │
│ participants     │ Array of user_ids                           │
│ scheduled_time   │                                              │
│ start_time       │                                              │
│ end_time         │                                              │
│ duration_minutes │ (calculado automáticamente)                 │
│ status           │ ENUM: scheduled, in_progress,               │
│                  │       completed, cancelled                  │
│ meeting_link     │                                              │
│ room_id          │                                              │
│ recording_url    │                                              │
│ notes            │                                              │
│ created_at       │                                              │
│ updated_at       │                                              │
└──────────────────┘                                              │
         │                                                        │
         │ 1:1                                                    │
         └────────────────────────────────────────────────────────┘


┌──────────────────┐
│   APPOINTMENTS   │ (Agenda Legal)
├──────────────────┤
│ _id              │ PK
│ lawyer_id        │ FK -> users._id
│ client_id        │ FK -> users._id (nullable)
│ case_id          │ FK -> cases._id (nullable)
│ title            │
│ description      │
│ event_type       │ ENUM: meeting, hearing, deadline, reminder
│ start_time       │
│ end_time         │
│ location         │
│ status           │ ENUM: scheduled, completed, cancelled
│ reminder_sent    │ Boolean
│ reminder_time    │
│ created_at       │
│ updated_at       │
└──────────────────┘


┌──────────────────┐
│    MESSAGES      │ (Centro de Mensajes Interno)
├──────────────────┤
│ _id              │ PK
│ case_id          │ FK -> cases._id (nullable)
│ sender_id        │ FK -> users._id
│ recipient_id     │ FK -> users._id
│ subject          │
│ message          │
│ thread_id        │ (para agrupar conversaciones)
│ read             │ Boolean
│ attachments      │ Array
│ created_at       │
│ updated_at       │
└──────────────────┘


┌──────────────────┐
│ LAWYER_DIRECTORY │ (Directorio Legal - Red de Abogados)
├──────────────────┤
│ _id              │ PK
│ lawyer_id        │ FK -> users._id
│ bio              │
│ years_experience │
│ specializations  │ Array
│ languages        │ Array
│ certifications   │ Array
│ rating           │
│ cases_won        │
│ cases_total      │
│ availability     │ Boolean
│ hourly_rate      │
│ location         │
│ profile_image    │
│ created_at       │
│ updated_at       │
└──────────────────┘


┌──────────────────┐
│    KPI_METRICS   │ (Dashboard - Métricas en Tiempo Real)
├──────────────────┤
│ _id              │ PK
│ lawyer_id        │ FK -> users._id
│ date             │
│ total_cases      │
│ active_cases     │
│ closed_cases     │
│ total_revenue    │
│ billable_hours   │
│ new_leads        │
│ conversion_rate  │
│ avg_case_duration│
│ client_satisfaction│
│ meetings_held    │
│ created_at       │
└──────────────────┘


┌──────────────────┐
│   ADMIN_LOGS     │ (Control Administrativo)
├──────────────────┤
│ _id              │ PK
│ admin_id         │ FK -> users._id (role=admin)
│ action           │ ENUM: subscription_change, user_suspend,
│                  │       case_access, lawyer_approve
│ target_user_id   │ FK -> users._id
│ description      │
│ metadata         │ JSON
│ created_at       │
└──────────────────┘
```

## RELACIONES CLAVE PARA INTEGRACIÓN

### 1. CRM → CASOS (Conversión Automática)
```
WHEN leads.status = 'converted'
THEN CREATE cases WHERE:
  - cases.client_id = NEW user created from lead
  - cases.lawyer_id = leads.lawyer_id
  - cases.title = leads.description
  - cases.legal_area = leads.legal_area
  - cases.lead_source_id = leads._id
AND UPDATE leads.converted_to = cases._id
```

### 2. CASOS → SALA DE CONFERENCIAS (Inicio de Reunión)
```
WHEN button "Iniciar Sala" clicked on case
THEN CREATE meetings WHERE:
  - meetings.case_id = cases._id
  - meetings.host_id = current_user._id
  - meetings.participants = [lawyer_id, client_id]
AND CREATE case_activities WHERE:
  - case_activities.case_id = cases._id
  - case_activities.activity_type = 'meeting'
  - case_activities.meeting_id = meetings._id
```

### 3. REUNIONES → FINANZAS (Facturación Automática)
```
WHEN meetings.status = 'completed'
THEN:
  - CALCULATE duration_minutes = end_time - start_time
  - UPDATE cases.billable_hours += duration_minutes/60
  - UPDATE cases.total_billed = billable_hours * hourly_rate
  - CREATE invoice IF case.total_billed >= threshold
  - UPDATE kpi_metrics for lawyer
```

### 4. TODAS LAS ACTIVIDADES → KPI DASHBOARD
```
Real-time aggregation queries:
  - COUNT(cases WHERE status='active' AND lawyer_id=X)
  - SUM(invoices.amount WHERE lawyer_id=X AND status='paid')
  - AVG(case_activities.duration_minutes WHERE billable=true)
  - COUNT(leads WHERE status='converted') / COUNT(leads) * 100
```

## ÍNDICES PARA OPTIMIZACIÓN

```javascript
// MongoDB Indexes
users: { email: 1 }, { role: 1 }
leads: { lawyer_id: 1, status: 1 }, { converted_to: 1 }
cases: { lawyer_id: 1, status: 1 }, { client_id: 1 }, { case_number: 1 }
meetings: { case_id: 1 }, { scheduled_time: 1 }
appointments: { lawyer_id: 1, start_time: 1 }
messages: { case_id: 1 }, { sender_id: 1, recipient_id: 1 }
invoices: { case_id: 1 }, { lawyer_id: 1, status: 1 }
```

## VALIDACIONES DE INTEGRIDAD

1. **No se puede eliminar un usuario si tiene casos activos**
2. **No se puede cerrar un caso si tiene invoices pendientes (status != 'paid')**
3. **Las reuniones deben estar vinculadas a un caso existente**
4. **Solo admins pueden modificar subscriptions**
5. **Los billable_hours deben coincidir entre case_activities y cases**

---

**Estado:** ✅ ERD Validado y Listo para Implementación
