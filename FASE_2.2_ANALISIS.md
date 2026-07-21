# FASE 2.2 - ANÁLISIS PREVIO A IMPLEMENTACIÓN
## Integración Notification Center ↔ CRM

**Fecha:** 2026-07-21  
**Objetivo:** Integrar el Notification Center con el CRM existente  
**Alcance:** Solo análisis y planificación - NO se implementa código aún

---

## 1. ESTRUCTURA CRM EXISTENTE

### Modelo Lead (`backend/models/lead.py`)

**Estados actuales:**
```python
status: Literal["new", "contacted", "qualified", "converted"] = "new"
```

**Campos disponibles:**
- `lawyer_id` - Abogado asignado
- `client_name` - Nombre del cliente
- `client_email` - Email del cliente
- `client_phone` - Teléfono del cliente
- `legal_area` - Área legal
- `description` - Descripción
- `status` - Estado del lead
- `source` - Fuente del lead
- `agent_id` - Agente comercial (FASE 8)
- `converted_to` - ID del caso convertido
- `organization_id` - Organización multi-tenant

**❌ PROBLEMA:** No tiene estados para:
- APROBADO
- RECHAZADO
- CUENTA CREADA
- ONBOARDING_COMPLETED
- PLAN_SELECTED

### Timeline Events (`backend/models/timeline_event.py`)

**Eventos actuales:**
```python
LEAD_CREATED, LEAD_QUALIFIED, LEAD_CONVERTED,
CASE_CREATED, COMMISSION_CREATED, COMMISSION_APPROVED, COMMISSION_PAID,
CASE_CLOSED, PAYMENT_INITIATED, PAYMENT_COMPLETED,
INVOICE_GENERATED, INVOICE_ISSUED, COMMISSION_SPLIT_APPLIED,
AI_LEAD_SCORED, AI_LEAD_ASSIGNED, AI_CASE_PREDICTED, AI_RECOMMENDATION_GENERATED,
AUTONOMOUS_LEAD_ASSIGNED, AUTONOMOUS_LEAD_ROUTED, AUTONOMOUS_CASE_REASSIGNED,
AUTONOMOUS_CASE_ROUTED, AUTONOMOUS_REBALANCE_EXECUTED, AUTONOMOUS_OPTIMIZATION_APPLIED,
AUTONOMOUS_SELF_HEAL_TRIGGERED, GLOBAL_CASE_ROUTED, CROSS_BORDER_ASSIGNMENT,
INTERNATIONAL_PAYMENT, GLOBAL_FIRM_CONNECTED, COUNTRY_LIMIT_TRIGGERED,
LEGAL_OS_CYCLE_EXECUTED, EVENT_CASCADE_TRIGGERED, ZERO_ADMIN_MODE_ENABLED,
SYSTEM_SELF_HEALING_EXECUTED, OPERATING_SYSTEM_ACTIVE
```

**❌ PROBLEMA:** No tiene eventos para:
- FIRM_REGISTRATION_RECEIVED
- FIRM_APPROVED
- FIRM_REJECTED
- ACCOUNT_CREATED
- FIRST_LOGIN
- PASSWORD_CHANGED
- ONBOARDING_COMPLETED
- PLAN_SELECTED
- CREDENTIALS_EXPIRED
- CREDENTIALS_RESENT

### Rutas de Leads (`backend/routes/leads.py`)

**Funcionalidades existentes:**
- `create_lead()` - Crea lead con timeline event
- `get_leads()` - Lista leads
- `get_lead()` - Obtiene lead específico
- `update_lead()` - Actualiza lead
- `convert_lead_to_case()` - Convierte lead a caso

**✅ POSITIVO:** Ya usa `timeline_events` para registrar historial

**❌ PROBLEMA:** No hay integración con eventos de firma o activación

---

## 2. PUNTOS DE INTEGRACIÓN IDENTIFICADOS

### Evento 1: Solicitud Recibida
**Ubicación:** `backend/routes/firms.py` - `register_firm_lead()` línea 107  
**Acción:** Ya crea lead en CRM (línea 190)  
**❌ FALTA:** 
- Actualizar estado del lead a algo como "PENDING_APPROVAL"
- Crear timeline event específico

### Evento 2: Solicitud Aprobada
**Ubicación:** `backend/routes/firms.py` - `approve_firm()` línea 480  
**Acción:** NO actualiza el lead  
**❌ FALTA:**
- Buscar lead por email/firma
- Actualizar estado a "APPROVED"
- Crear timeline event

### Evento 3: Solicitud Rechazada
**Ubicación:** `backend/routes/firms.py` - `reject_firm()` línea 627  
**Acción:** NO actualiza el lead  
**❌ FALTA:**
- Buscar lead por email/firma
- Actualizar estado a "REJECTED"
- Guardar motivo de rechazo
- Crear timeline event

### Evento 4: Cuenta Creada
**Ubicación:** `backend/routes/auth.py` - `register()` línea 78  
**Acción:** NO actualiza el lead  
**❌ FALTA:**
- Buscar lead por email
- Actualizar estado a "ACCOUNT_CREATED"
- Crear timeline event

### Evento 5: Primer Login
**Ubicación:** `backend/routes/auth.py` - `login()` línea 191  
**Acción:** NO registra actividad  
**❌ FALTA:**
- Crear timeline event "FIRST_LOGIN"

### Evento 6: Cambio de Contraseña
**Ubicación:** `backend/routes/auth.py` - `change_password_first_login()` línea 277  
**Acción:** NO registra actividad  
**❌ FALTA:**
- Crear timeline event "PASSWORD_CHANGED"

### Evento 7: Onboarding Completado
**Ubicación:** `backend/routes/onboarding.py` - `complete_onboarding()` línea 219  
**Acción:** NO actualiza el lead  
**❌ FALTA:**
- Buscar lead por user_id
- Actualizar estado a "ONBOARDING_COMPLETED"
- Crear timeline event

### Evento 8: Selección de Plan
**Ubicación:** `backend/routes/onboarding.py` - `select_plan()` línea 89  
**Acción:** NO registra plan seleccionado  
**❌ FALTA:**
- Actualizar metadata del lead con plan seleccionado
- Crear timeline event

### Evento 9: Compra del Plan
**Ubicación:** No identificada aún  
**Acción:** NO convierte lead a cliente  
**❌ FALTA:**
- Buscar lead por user_id
- Actualizar estado a "CONVERTED"
- Crear cliente en colección users
- Crear timeline event

---

## 3. ESTRATEGIA DE IMPLEMENTACIÓN

### Opción A: Extender Modelos Existentes (RECOMENDADA)
**Ventajas:**
- No crea nuevas tablas/colecciones
- Reutiliza estructura existente
- Mantiene compatibilidad

**Cambios necesarios:**

1. **Lead Model:** Agregar estados adicionales
   ```python
   status: Literal[
       "new", "contacted", "qualified", "converted",
       "PENDING_APPROVAL", "APPROVED", "REJECTED",
       "ACCOUNT_CREATED", "ONBOARDING_COMPLETED"
   ] = "new"
   ```

2. **TimelineEvent Model:** Agregar eventos de Notification Center
   ```python
   event_type: Literal[
       # ... eventos existentes ...
       "FIRM_REGISTRATION_RECEIVED",
       "FIRM_APPROVED",
       "FIRM_REJECTED",
       "ACCOUNT_CREATED",
       "FIRST_LOGIN",
       "PASSWORD_CHANGED",
       "ONBOARDING_COMPLETED",
       "PLAN_SELECTED",
       "CREDENTIALS_EXPIRED",
       "CREDENTIALS_RESENT"
   ]
   ```

3. **Agregar campo `rejection_reason` a Lead:**
   ```python
   rejection_reason: Optional[str] = None
   ```

### Opción B: Usar Metadata
**Ventajas:**
- No modifica modelo existente
- Más flexible

**Desventajas:**
- Menos estructurado
- Más difícil de consultar

**Implementación:**
```python
# En lugar de modificar status, usar metadata
metadata = {
    "crm_status": "APPROVED",
    "crm_rejection_reason": "...",
    "crm_plan_selected": "firm_growth"
}
```

---

## 4. FUNCIONES A CREAR

### En `backend/services/crm_integration_service.py` (NUEVO)

```python
class CRMIntegrationService:
    """Servicio de integración entre Notification Center y CRM"""
    
    @staticmethod
    async def update_lead_status(db, email: str, status: str, **kwargs):
        """Actualiza estado de lead por email"""
        
    @staticmethod
    async def create_timeline_event(db, event_type: str, **kwargs):
        """Crea evento en timeline"""
        
    @staticmethod
    async def find_lead_by_email(db, email: str):
        """Busca lead por email"""
        
    @staticmethod
    async def convert_lead_to_customer(db, lead_id: str, user_id: str):
        """Convierte lead a cliente"""
```

### Modificaciones en archivos existentes

1. **backend/routes/firms.py**
   - `register_firm_lead()` - Actualizar estado lead
   - `approve_firm()` - Actualizar estado lead
   - `reject_firm()` - Actualizar estado lead con motivo

2. **backend/routes/auth.py**
   - `register()` - Actualizar estado lead
   - `login()` - Crear timeline event
   - `change_password_first_login()` - Crear timeline event

3. **backend/routes/onboarding.py**
   - `complete_onboarding()` - Actualizar estado lead
   - `select_plan()` - Registrar plan en metadata

4. **backend/services/activation_service.py**
   - `check_expired_activations()` - Crear timeline event
   - `resend_activation()` - Crear timeline event

---

## 5. REUTILIZACIÓN DE CÓDIGO EXISTENTE

### ✅ Reutilizar:
1. **`db.leads`** - Colección de leads
2. **`db.timeline_events`** - Colección de timeline
3. **`TimelineEvent`** - Modelo de timeline
4. **`Lead`** - Modelo de lead
5. **Patrón de timeline events** de `leads.py` línea 87-102

### ❌ NO crear:
- Nuevo modelo Lead
- Nueva colección
- Nuevo servicio CRM paralelo
- Nueva tabla de historial

---

## 6. POSIBLES BLOQUEOS

### Bloqueo 1: Estados de Lead
**Problema:** El modelo Lead tiene estados limitados  
**Solución:** Extender el Literal con nuevos estados  
**Riesgo:** Bajo - es solo agregar valores

### Bloqueo 2: Relación Lead-User
**Problema:** No hay relación directa entre leads y users  
**Solución:** Buscar por email (campo común)  
**Riesgo:** Bajo - email es único

### Bloqueo 3: Lead de Firma vs Lead de Abogado
**Problema:** `register_firm_lead()` crea lead con `source: "landing_firm_registration"`  
**Solución:** Usar `source` o `metadata` para diferenciar  
**Riesgo:** Bajo - ya está diferenciado

### Bloqueo 4: Compra de Plan
**Problema:** No está claro dónde se ejecuta la compra  
**Solución:** Implementar cuando se identifique el punto de compra  
**Riesgo:** Medio - requiere investigación adicional

---

## 7. PLAN DE IMPLEMENTACIÓN

### Paso 1: Modificar Modelos (sin breaking changes)
1. Agregar nuevos estados a Lead.status
2. Agregar nuevos eventos a TimelineEvent.event_type
3. Agregar campo `rejection_reason` a Lead

### Paso 2: Crear Servicio de Integración
1. Crear `backend/services/crm_integration_service.py`
2. Implementar funciones básicas:
   - `update_lead_status()`
   - `create_timeline_event()`
   - `find_lead_by_email()`

### Paso 3: Integrar Eventos
1. **Solicitud Recibida** - firms.py
2. **Solicitud Aprobada** - firms.py
3. **Solicitud Rechazada** - firms.py
4. **Cuenta Creada** - auth.py
5. **Primer Login** - auth.py
6. **Cambio de Contraseña** - auth.py
7. **Onboarding Completado** - onboarding.py
8. **Selección de Plan** - onboarding.py
9. **Compra de Plan** - Por definir

### Paso 4: Testing
1. Verificar que leads se actualicen correctamente
2. Verificar que timeline events se creen
3. Verificar que no se rompan funcionalidades existentes

### Paso 5: Documentación
1. Documentar eventos integrados
2. Documentar flujos completos
3. Generar certificación

---

## 8. ARCHIVOS A MODIFICAR

### Archivos Principales:
1. **backend/models/lead.py** - Agregar estados
2. **backend/models/timeline_event.py** - Agregar eventos
3. **backend/services/crm_integration_service.py** - NUEVO
4. **backend/routes/firms.py** - Integrar eventos 1, 2, 3
5. **backend/routes/auth.py** - Integrar eventos 4, 5, 6
6. **backend/routes/onboarding.py** - Integrar eventos 7, 8

### Archivos de Soporte:
7. **backend/services/activation_service.py** - Integrar eventos 10, 11

---

## 9. ESTIMACIÓN

- **Modelos:** 30 minutos
- **Servicio CRM:** 1 hora
- **Integración firms.py:** 1 hora
- **Integración auth.py:** 1 hora
- **Integración onboarding.py:** 1 hora
- **Testing:** 1 hora
- **Documentación:** 30 minutos

**Total:** ~6 horas

---

## 10. PRÓXIMOS PASOS

1. ✅ Análisis completado
2. ⏳ Esperando aprobación para implementar
3. ⏳ Modificar modelos
4. ⏳ Crear servicio CRM
5. ⏳ Integrar eventos
6. ⏳ Testing
7. ⏳ Certificación

---

**FIN DEL ANÁLISIS - FASE 2.2**