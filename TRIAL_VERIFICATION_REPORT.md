# VERIFICACIÓN DEL TRIAL DE 7 DÍAS - INFORME COMPLETO

Fecha: 2025-06-26
Objetivo: Verificar si el sistema implementa un "Trial de 7 días" para nuevas firmas registradas desde la landing page.

---

## RESUMEN EJECUTIVO

**CONCLUSIÓN CRÍTICA:**

El Trial de 7 días **NO está completamente implementado de extremo a extremo**. Existe:
- ✅ Lógica de **cálculo** de 7 días (en `payment.py`)
- ✅ Descripción en la landing y en comentarios del código
- ❌ **FALTA:** Almacenamiento en base de datos
- ❌ **FALTA:** Visualización en dashboard
- ❌ **FALTA:** Proceso automático de expiración
- ❌ **FALTA:** Control de acceso basado en estado del trial

---

## 1. ENDPOINT POST /firms/register (Backend)

**Archivo:** `backend/routes/firms.py:18-200`

### Descripción en Comentarios vs Implementación Real

```python
"""Registro público de firma (sin autenticación requerida)

FLUJO:
1. Valida que no existan duplicados (email, NIT)
2. Crea firma en colección 'firms'
3. Crea usuario 'firm_owner' automáticamente
4. Crea suscripción inicial    ← DESCRITO PERO NO IMPLEMENTADO
5. Crea configuración inicial de Firm OS   ← DESCRITO PERO NO IMPLEMENTADO
6. Envía correo de bienvenida
"""
```

### Implementación Actual (Lo que REALMENTE Ocurre)

```python
@router.post("/register", response_model=FirmResponse, status_code=status.HTTP_201_CREATED)
async def register_firm(
    firm_data: FirmCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    # PASO 1: Valida duplicados ✓
    existing_firm_email = await db.firms.find_one({"email": firm_data.email})
    existing_firm_nit = await db.firms.find_one({"nit": firm_data.nit})
    existing_user = await db.users.find_one({"email": firm_data.founder_email})

    # PASO 2: Crea firma en PENDING_VERIFICATION ✓
    firm_doc = {
        "name": firm_data.name,
        "nit": firm_data.nit,
        "email": firm_data.email,
        "phone": firm_data.phone,
        "address": firm_data.address,
        "city": firm_data.city,
        "country": firm_data.country or "Colombia",
        "plan": firm_data.plan,
        "max_lawyers": 5 if firm_data.plan == "firm_growth" else 10,
        "active_lawyers_count": 0,
        "owner_id": None,
        "owner_name": firm_data.founder_name,
        "owner_email": firm_data.founder_email,
        "status": "PENDING_VERIFICATION",  # ← SIN TRIAL FIELDS
        "approval_status": "pending",
        "approval_date": None,
        "approved_by": None,
        "rejection_reason": None,
        "is_verified": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    # PASO 3: Crea usuario firm_owner ✓
    user_doc = {
        "email": firm_data.founder_email,
        "full_name": firm_data.founder_name,
        "password_hash": None,  # SIN CONTRASEÑA HASTA APROBACIÓN
        "phone": firm_data.founder_phone,
        "id_document": firm_data.founder_document,
        "bar_number": firm_data.founder_bar_number,
        "role": "firm_owner",
        "firm_id": firm_id,
        "status": "PENDING_ACTIVATION",  # ← SIN TRIAL FIELDS
        "is_verified": False,
        "activation_token": None,
        "activation_expires_at": None,
        "activated_at": None,
        "country": firm_data.country or "Colombia",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    # PASO 4: ❌ NO EXISTE - No se crea suscripción trial
    # PASO 5: ❌ NO EXISTE - No se crea configuración inicial
    # PASO 6: ✓ Envía correo (sí existe)
```

**CONCLUSIÓN PASO 1:** El endpoint descibe crear suscripción pero **NO lo hace**.

---

## 2. MODELO DE DATOS: Firm

**Archivo:** `backend/models/firm.py`

### Campos Actuales

```python
class Firm(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    nit: Optional[str]
    email: str
    phone: Optional[str]
    address: Optional[str]
    city: Optional[str]
    country: Optional[str] = "Colombia"
    
    # Plan Information
    plan: str = Field(default="firm_growth")
    max_lawyers: int = Field(default=5)
    active_lawyers_count: int = Field(default=0)
    
    # Owner Information
    owner_id: Optional[str]
    owner_name: Optional[str]
    owner_email: Optional[str]
    
    # Status
    status: str = Field(default="PENDING_VERIFICATION")
    is_verified: bool = Field(default=False)
    
    # Approval Information
    approval_status: Optional[str]
    approval_date: Optional[datetime]
    approved_by: Optional[str]
    rejection_reason: Optional[str]
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # ❌ CAMPOS FALTANTES PARA TRIAL:
    # - trial_started_at: datetime
    # - trial_ends_at: datetime
    # - trial_status: Literal["active", "expired", "not_started"]
    # - trial_days_remaining: int
    # - subscription_type: Literal["trial", "paid"]
```

**CONCLUSIÓN PASO 2:** El modelo `Firm` **NO tiene campos para almacenar información de trial**.

---

## 3. BASE DE DATOS: Colecciones

**Colección `firms`**

Campos actuales según código:
```javascript
{
  _id: ObjectId,
  name: String,
  nit: String,
  email: String,
  phone: String,
  address: String,
  city: String,
  country: String,
  plan: String,              // "firm_growth" o "firm_enterprise"
  max_lawyers: Number,
  active_lawyers_count: Number,
  owner_id: String,
  owner_name: String,
  owner_email: String,
  status: String,            // "PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "REJECTED"
  is_verified: Boolean,
  approval_status: String,   // "pending", "approved", "rejected"
  approval_date: Date | null,
  approved_by: String | null,
  rejection_reason: String | null,
  created_at: Date,
  updated_at: Date
  
  // ❌ CAMPOS FALTANTES:
  // trial_started_at: Date (cuándo comienza el trial)
  // trial_ends_at: Date (cuándo vence el trial)
  // trial_status: String (estado del trial: "active", "expired")
  // subscription_status: String (tipo de suscripción: "trial", "paid", "grace_period")
}
```

**Colecciones Relacionadas**

- `users` - Almacena el firm_owner, pero SIN campos de trial
- `leads` - Existe para `/firms/register-lead`, pero no se usa en `/firms/register`

**CONCLUSIÓN PASO 3:** La base de datos **NO almacena información de trial**.

---

## 4. DASHBOARD DE FIRMAS (Frontend)

**Archivo:** `frontend/src/modules/admin/pages/FirmsOverview.jsx`

### Columnas de la Tabla Actual

```jsx
<thead className="bg-gray-900 border-b border-gray-700">
  <tr>
    <th>Firma</th>         {/* Nombre + Email */}
    <th>Plan</th>          {/* firm_growth, firm_enterprise */}
    <th>Abogados</th>       {/* Conteo de abogados */}
    <th>Casos Activos</th>  {/* Número de casos */}
    <th>Ingresos</th>       {/* Ingresos totales */}
    <th>Cobranza</th>       {/* % de comisiones pagadas */}
    <th>Estado</th>         {/* "Activa" o "Inactiva" */}
    <th>Acciones</th>       {/* Ver Detalles */}
  </tr>
</thead>
```

### Campos que Mostrar (Requeridos para Trial)

❌ **FALTA:** `Trial Activo / Expirado`
❌ **FALTA:** `Días Restantes`
❌ **FALTA:** `Fecha de Vencimiento del Trial`
❌ **FALTA:** `Suscripción (Trial / Pagada)`
❌ **FALTA:** `Estado de Prueba`

**CONCLUSIÓN PASO 4:** El dashboard **NO muestra información de trial**.

---

## 5. LÓGICA DE TRIAL: Dónde Existe

**Archivo:** `backend/routes/payment.py:660-690`

Existe cálculo de trial **SOLO para el endpoint de pagos** (NO para firmas):

```python
# En una función de payment status:
subscription_status = "active" if plan else "trial"

# Prueba gratuita de 7 días contada desde el registro (created_at).
created = current.get("created_at")
now = datetime.utcnow()
trial_started_at = trial_ends_at = None
trial_active = False
if isinstance(created, datetime):
    trial_started_at = created.isoformat() + "Z"
    ends = created + timedelta(days=7)
    trial_ends_at = ends.isoformat() + "Z"
    trial_active = (not plan) and (now < ends)

return {
    "has_plan": bool(plan),
    "plan_id": plan_id,
    "subscription_status": subscription_status,
    "trial": {
        "started_at": trial_started_at,
        "ends_at": trial_ends_at,
        "active": trial_active,
        "duration_days": 7,
    },
    ...
}
```

**Interpretación:**
- Esto es para **usuarios/organizaciones** (en el módulo de pagos), **NO para firmas**
- Calcula trial de forma **temporal** (sin persistencia)
- Si refrescas la página, el cálculo se repite (no hay estado guardado)

**CONCLUSIÓN PASO 5:** El cálculo de 7 días existe en `payment.py`, pero NO en `firms.py`.

---

## 6. PROCESO DE EXPIRACIÓN AUTOMÁTICA

**Búsqueda:** ¿Existe un proceso que expire automáticamente el trial después de 7 días?

### Hallazgos

```bash
$ grep -r "trial" backend/routes/ | grep -i "expir\|extend\|cron\|job\|schedule"
```

Resultados:
```
backend/routes/admin_master.py:74-78:
    elif action == "extend-trial":
        days = int(payload.get("days", 7) or 7)
        # ... código para extender trial manualmente
```

**Interpretación:** Existe UNA acción manual (`extend-trial`) en admin, pero:
- ❌ NO existe un **proceso automático** (cron job, scheduler, etc.)
- ❌ NO existe cambio automático de `trial_status` a `expired`
- ❌ NO existe desactivación automática de acceso
- ❌ NO existe notificación automática al admin

**CONCLUSIÓN PASO 6:** **NO hay expiración automática**.

---

## 7. FLUJO DE FIRMA REGISTRADA (Verificación End-to-End)

### Secuencia Actual

```
1. Usuario rellena formulario en landing
   ↓
2. POST /firms/register (Frontend → Backend)
   ↓
3. Backend crea Firm en PENDING_VERIFICATION
   ↓
4. Backend crea User (firm_owner) en PENDING_ACTIVATION
   ↓
5. Backend envía email "Tu solicitud está siendo revisada"
   ↓
6. Admin revisa firma en Dashboard de Firmas
   ↓
7. Admin hace click en "Aprobar" (POST /firms/{id}/approve)
   ↓
8. Firma pasa a ACTIVE
   ↓
9. User recibe email con token de activación
   ↓
10. User crea contraseña usando token
    ↓
11. Acceso a Firm OS
```

### ¿DÓNDE ENTRA EL TRIAL?

❌ **No entra en ningún lado**. El trial se promete en la landing ("Prueba gratuita de 7 días"), pero:

- No se registra en `Firm.trial_started_at`
- No se calcula en el estado de la firma
- No bloquea ni permite acceso basado en trial
- No muestra días restantes en dashboard
- No expira automáticamente

---

## 8. RESUMEN: QUÉ ESTÁ IMPLEMENTADO vs QUÉ FALTA

### ✅ IMPLEMENTADO

| Elemento | Estado |
|----------|--------|
| Landing promete 7 días | ✅ Existe |
| Endpoint `/firms/register` | ✅ Crea firma |
| Comentarios describen trial | ✅ Existen |
| Lógica de 7 días en payment | ✅ Existe (pero para otro módulo) |
| Envío de email | ✅ Existe |
| Aprobación manual por admin | ✅ Existe |

### ❌ FALTA

| Elemento | Crítico | Archivo | Línea |
|----------|---------|---------|-------|
| Campo `trial_started_at` en Firm | ALTA | `backend/models/firm.py` | N/A |
| Campo `trial_ends_at` en Firm | ALTA | `backend/models/firm.py` | N/A |
| Campo `trial_status` en Firm | ALTA | `backend/models/firm.py` | N/A |
| Creación de suscripción en `/firms/register` | ALTA | `backend/routes/firms.py:29` | Comentario sin código |
| Cálculo y almacenamiento de trial | ALTA | `backend/routes/firms.py` | No existe |
| Visualización en dashboard | MEDIA | `frontend/src/modules/admin/pages/FirmsOverview.jsx` | Columnas |
| Proceso automático de expiración | MEDIA | `backend/` | No existe |
| Bloqueo de acceso cuando trial vence | MEDIA | `backend/` | No existe |
| Notificación de vencimiento | BAJA | `backend/` | No existe |

---

## 9. ARCHIVOS INVOLUCRADOS

### Backend

- `backend/models/firm.py` - **Necesita actualización** (agregar campos trial)
- `backend/routes/firms.py` - **Necesita actualización** (agregar lógica de creación de trial en `/firms/register`)
- `backend/models/os_subscription.py` - Modelos de suscripción (posible referencia)
- `backend/routes/payment.py` - Contiene lógica de cálculo de 7 días (NO usada para firmas)
- `backend/` - **Necesita:** Nuevo archivo o ruta para expiración automática

### Frontend

- `frontend/src/modules/admin/pages/FirmsOverview.jsx` - **Necesita actualización** (agregar columnas de trial)
- `frontend/src/components/FirmOSPreviewBlock.jsx` - Puede mostrar "Prueba activada" después de register

---

## 10. CÁLCULO: DATOS QUE SE NECESITAN

Si se implementa el trial de 7 días, cada firma debe almacenar:

```python
{
    "trial_started_at": datetime.utcnow(),          # Momento de creación
    "trial_ends_at": datetime.utcnow() + timedelta(days=7),  # 7 días después
    "trial_status": "active",                        # "active" | "expired" | "grace_period"
    "subscription_type": "trial",                    # "trial" | "paid"
    "trial_remaining_days": int,                     # 7, 6, 5, ... 0
    "grace_period_days": 3,                          # Opcional: días adicionales después de expiración
    "trial_email_sent": bool,                        # Ya se envió email de vencimiento?
}
```

---

## 11. PLAN DE IMPLEMENTACIÓN (Si se decide activar)

### Fase 1: Base de Datos y Modelo
1. Agregar campos trial a `Firm` model
2. Agregar campos trial a `db.firms` colección
3. Ejecutar migración para firmas existentes

### Fase 2: Backend
1. Actualizar `/firms/register` para crear suscripción trial
2. Crear nuevo endpoint `/firms/{id}/check-trial-status`
3. Crear task scheduler para expiración automática
4. Actualizar `POST /firms/{id}/approve` para inicializar trial si es nuevo

### Fase 3: Frontend
1. Agregar columnas a FirmsOverview (Trial Activo, Días Restantes, Vencimiento)
2. Agregar filtros por estado de trial
3. Mostrar alerta visual para trials próximos a vencer

### Fase 4: Automación
1. Crear cronjob que expire trials diariamente
2. Implementar notificaciones de vencimiento
3. Agregar restricciones de acceso basadas en trial

---

## 12. CONCLUSIÓN FINAL

**El Trial de 7 días es SOLO una promesa en la landing page, NO una funcionalidad implementada de extremo a extremo.**

Lo que existe:
- Un comentario en el código que describe crear suscripción ✓
- Lógica matemática de 7 días en otro módulo (pagos) ✓
- Promesa visual en la UI ✓

Lo que **NO existe:**
- Almacenamiento en base de datos ✗
- Cálculo y persistencia en `firms.py` ✗
- Visualización en dashboard ✗
- Expiración automática ✗
- Control de acceso basado en trial ✗
- Notificaciones de vencimiento ✗

**Recomendación:** Antes de registrar nuevas firmas con este flujo, completar la implementación del trial de 7 días. De lo contrario, las firmas se registran pero la "prueba gratuita" no es real.
