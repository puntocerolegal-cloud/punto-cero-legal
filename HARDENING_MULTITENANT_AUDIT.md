# HARDENING MULTI-TENANT — AUDITORÍA COMPLETA

## ESTADO: Hardening Parcial en Progreso

---

## MATRIZ DE ENDPOINTS — CRITICIDAD

### 🔴 CRÍTICO — Faltan Validaciones (REQUIERE PARCHE INMEDIATO)

| Endpoint | Ruta | Problema | Impacto | Estado |
|----------|------|----------|--------|--------|
| **apply_commission_split** | `POST /commissions/{id}/apply-split` | NO valida org_id | Firma A puede splitear comisiones de Firma B | ✅ PARCHEADO |
| **pay_commission** | `POST /commissions/{id}/pay` | NO valida org_id | Firma A puede pagar comisiones de Firma B | ✅ PARCHEADO |
| **update_lead** | `PATCH /leads/{id}` | NO valida organization_id | Abogado A puede cambiar leads de Abogado B | ⏳ PENDIENTE |
| **convert_lead** | `POST /leads/{id}/convert` | NO valida organization_id | Lead puede convertirse en case de otra org | ⏳ PENDIENTE |
| **update_case** | `PATCH /cases/{id}` | NO valida organization_id | Abogado A puede modificar casos de Abogado B | ⏳ PENDIENTE |
| **create_invoice** | `POST /invoices` | Aceptaelaborable cualquier org_id | Factura puede crearse para otra org sin validación | ⏳ PENDIENTE |
| **update_invoice** | `PATCH /invoices/{id}` | NO valida organization_id | Otra org puede modificar facturas | ⏳ PENDIENTE |

### 🟡 MEDIO — Validación Incompleta (REQUIERE REVISIÓN)

| Endpoint | Ruta | Problema | Impacto | Solución |
|----------|------|----------|--------|----------|
| **get_agent_commissions** | `GET /commissions/agent/{id}` | Solo valida agent_id, NO org_id | Agent de Firma A puede ver comisiones de Firma B si conoce agent_id | Agregar filtro organization_id en query |
| **get_leads** | `GET /leads` | Filtra por lawyer_id pero NO valida org_id | Lead podría tener lawyer_id de otra org | Agregar validación de organization_id |
| **get_cases** | `GET /cases` | Similar a leads | Cases podría tener lawyer_id de otra org | Agregar validación de organization_id |

### 🟢 OK — Tiene Validación

| Endpoint | Validación | Nota |
|----------|-----------|------|
| `GET /financial/summary?organization_id=X` | ✅ Verifica org_id = user.organization_id | Correcto |
| `GET /commissions/firm/{org_id}` | ✅ Verifica ownerId | Correcto |
| `POST /commissions` | ✅ Role check | Correcto (admin only) |
| `GET /commission/{id}` | ✅ agent_id check | Parcialmente correcto (falta org_id) |

---

## PARCHES IMPLEMENTADOS

### 1. ✅ Middleware de Tenant Scope (`backend/security/tenant_scope.py`)

**Ubicación:** `backend/security/tenant_scope.py` (líneas 1-146)

**Funciones:**
- `require_org_scope()` — Valida organization_id desde query/body
- `get_org_id_from_path()` — Valida organization_id desde path
- `build_org_filter()` — Crea filter MongoDB automático
- `validate_org_ownership()` — Valida que recurso pertenece a org

**Uso en endpoints:**
```python
from security.tenant_scope import validate_org_ownership

@router.post("/{id}/pay")
async def pay(id: str, current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    # Validar ownership antes de cualquier operación
    resource = await db.table.find_one({"_id": ObjectId(id)})
    resource = validate_org_ownership(resource, current_user, "organization_id")
    # Ahora es seguro operar sobre `resource`
```

### 2. ✅ Endpoints Parcheados

#### `backend/routes/commissions.py`
- ✅ `pay_commission()` — Ahora valida org_id
- ✅ `apply_commission_split()` — Ahora valida org_id (crítico)

---

## PARCHES PENDIENTES

### Prioridad 1 — CRÍTICO (Esta semana)

#### `backend/routes/leads.py`

**Problema:** `update_lead()` no valida organization_id

```python
# ❌ ANTES
@router.patch("/{lead_id}")
async def update_lead(lead_id: str, updates: dict, current_user: dict, db):
    await db.leads.update_one({"_id": ObjectId(lead_id)}, {"$set": updates})
    # ❌ Firma A puede updatear lead de Firma B si conoce el ID

# ✅ DESPUÉS
@router.patch("/{lead_id}")
async def update_lead(lead_id: str, updates: dict, current_user: dict, db):
    lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
    lead = validate_org_ownership(lead, current_user)
    await db.leads.update_one({"_id": ObjectId(lead_id)}, {"$set": updates})
```

**Archivo:** `backend/routes/leads.py` línea 133

---

#### `backend/routes/leads.py`

**Problema:** `convert_lead_to_case()` no valida organization_id

**Archivo:** `backend/routes/leads.py` línea 154

**Solución:** Agregar `validate_org_ownership()` antes de crear case

---

#### `backend/routes/cases.py`

**Problema:** `update_case()` no valida organization_id

**Archivo:** `backend/routes/cases.py` (revisar POST/PATCH endpoints)

**Solución:** Validar que case.organization_id = user.organization_id

---

#### `backend/routes/invoices.py`

**Problema:** `create_invoice()` acepta cualquier organization_id

```python
# ❌ ANTES
@router.post("/")
async def create_invoice(payload: InvoiceIn, db):
    invoice = {
        "organization_id": payload.organization_id,  # ❌ Sin validación
        "amount": payload.amount,
    }
    await db.invoices.insert_one(invoice)

# ✅ DESPUÉS
@router.post("/")
async def create_invoice(payload: InvoiceIn, current_user: dict, db):
    if payload.organization_id != current_user.get("organizationId"):
        if current_user.get("role") not in ["admin", "admin_general"]:
            raise HTTPException(403, "No autorizado")
    # Ahora validado
```

**Archivo:** `backend/routes/invoices.py` línea 113

---

### Prioridad 2 — ALTO (Esta semana)

#### `backend/routes/invoices.py`

**Problema:** `update_invoice()` no valida organization_id

**Archivo:** `backend/routes/invoices.py` línea 156

---

#### `backend/routes/cases.py`

**Problema:** Todos los endpoints de cases necesitan filtrar por organization_id

**Soluciones:**
1. Agregar `organization_id` a model Case
2. En queries: `{"_id": ObjectId(id), "organization_id": user_org_id}`
3. En creación: asignar automáticamente `organization_id` del usuario

---

### Prioridad 3 — MEDIO (Próximas 2 semanas)

#### `backend/routes/appointments.py`

Faltan validaciones de organization_id en todos los endpoints

---

#### `backend/routes/messages.py`

Faltan validaciones de organization_id

---

## CHECKLIST DE HARDENING

```
✅ Crear middleware de tenant scope (HECHO)
✅ Parchear commissions.pay (HECHO)
✅ Parchear commissions.apply-split (HECHO)
⏳ Parchear leads.update
⏳ Parchear leads.convert
⏳ Parchear cases.update
⏳ Parchear invoices.create
⏳ Parchear invoices.update
⏳ Auditar appointments
⏳ Auditar messages
⏳ Crear tests de multi-tenant security
⏳ Documentar patrón de validación
```

---

## PATRÓN ESTÁNDAR DE VALIDACIÓN

**Usar este patrón en TODOS los endpoints que toquen datos organizacionales:**

```python
from security.tenant_scope import validate_org_ownership

@router.patch("/{resource_id}")
async def update_resource(
    resource_id: str,
    updates: dict,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db),
):
    """Update a resource (auto-validates organization_id)"""
    
    # 1. Buscar recurso
    resource = await db.table.find_one({"_id": ObjectId(resource_id)})
    
    # 2. VALIDAR OWNERSHIP (previene cross-org access)
    resource = validate_org_ownership(resource, current_user, "organization_id")
    
    # 3. Actualizar (ahora es seguro)
    await db.table.update_one(
        {"_id": ObjectId(resource_id)},
        {"$set": updates}
    )
    
    return {"success": True, "data": resource}
```

---

## TESTING RECOMENDADO

```python
# Test 1: Firm A cannot access Firm B's commission
def test_commission_org_isolation():
    # Create commission for Firm A
    comm_a = create_commission(org_id="firm-a", amount=1000)
    
    # Try to pay as Firm B user
    user_b = {"organizationId": "firm-b", "role": "admin_general"}
    response = pay_commission(comm_a.id, user=user_b)
    
    assert response.status_code == 403  # ✅ Access denied
    assert "Acceso denegado" in response.detail

# Test 2: Firm A cannot split Firm B's commission
def test_commission_split_org_isolation():
    comm_b = create_commission(org_id="firm-b", amount=1000)
    user_a = {"organizationId": "firm-a", "role": "admin_general"}
    
    response = apply_split(comm_b.id, splits={...}, user=user_a)
    assert response.status_code == 403

# Test 3: Admin can access all orgs
def test_admin_cross_org_access():
    comm_a = create_commission(org_id="firm-a")
    admin = {"organizationId": None, "role": "admin"}
    
    response = pay_commission(comm_a.id, user=admin)
    assert response.status_code == 200  # ✅ Admin can access
```

---

## REFERENCIAS

- **Middleware:** `backend/security/tenant_scope.py`
- **Commissions parcheados:** `backend/routes/commissions.py` líneas 1-10, 190-210, 237-260
- **Próximos targets:** `backend/routes/leads.py`, `cases.py`, `invoices.py`

---

## CONCLUSIÓN

✅ **Fase 1 Completada:** Middleware de tenant scope creado + endpoints críticos de comisiones parcheados

⏳ **Fase 2 Pendiente:** Parchear endpoints de leads, cases, invoices (esta semana)

⏳ **Fase 3 Pendiente:** Crear tests de seguridad multi-tenant

**Riesgo Residual:** MEDIO — Leads, Cases e Invoices aún son vulnerables a cross-org access
