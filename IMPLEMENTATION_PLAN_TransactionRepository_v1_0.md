# IMPLEMENTATION PLAN: TransactionRepository v1.0
## Primera Implementación Modelo — Punto Cero System OS

**Documento Técnico de Planificación**  
**Estado:** PRE-IMPLEMENTACIÓN (SIN CÓDIGO)  
**Versión:** 1.0  
**Autoridad:** Principal Software Architect + Lead Backend Engineer  

---

## INTRODUCCIÓN

Este documento define el plan técnico **COMPLETO Y VERIFICABLE** para implementar el **TransactionRepository**, el primer repositorio real del sistema siguiendo el Golden Repository Template v1.0.

**Objetivos:**
1. ✅ Migrar TODAS las operaciones MongoDB de transacciones a un repositorio centralizado
2. ✅ Garantizar aislamiento multi-tenant mediante firm_id (aunque transacciones hoy no están firmadas)
3. ✅ Estandarizar índices, validaciones y auditoría
4. ✅ Proporcionar blueprint exacto para los próximos 22+ repositorios
5. ✅ Demostrar que se pueden refactorizar operaciones existentes SIN romper funcionalidad

**Alcance:** Colección `transactions` + todas sus operaciones CRUD

---

## FASE 1: AUDITORÍA COMPLETA

### 1.1 Inventario de Colección

**Colección:** `transactions`

**Ubicación en Codebase:**
- `backend/routes/payment.py` (Router principal)
- `backend/services/webhook_handler.py` (Procesamiento de eventos)
- `backend/services/renewal_service.py` (Renovaciones automáticas)
- `backend/routes/billing_admin.py` (Dashboard admin)
- `backend/routes/referrals.py` (Consultas de referidos)

**Índices Actuales (server.py líneas 292-298):**
```
1. {"payment_id": 1} — unique=True
2. {"user_email": 1}
3. {"status": 1}
4. {"created_at": 1}
5. {"plan_id": 1}
6. {"type": 1}
```

**Estructura de Documento (Observada):**
```json
{
  "_id": ObjectId,
  "payment_id": "PCL-XXXXX" (string, unique),
  "user_email": "user@example.com",
  "user_name": "Full Name",
  "plan_id": "esencial|profesional|elite|ilimitado",
  "billing_cycle": "monthly|annual",
  "amount_cop": 112500.0,
  "amount_local": 112.5,
  "currency": "USD|COP|MXN|...",
  "country": "Colombia|México|...",
  "gateway": "mercado_pago|paypal",
  "status": "pending|paid|rejected|cancelled",
  "checkout_url": "https://...",
  "preference_id": "MP-pref-12345" (opcional),
  "mp_payment_id": "MP-payment-12345" (opcional, de webhook),
  "referral_code": "ref-code" (opcional),
  "referrer_id": ObjectId (opcional, si referido),
  "reward_applied": bool (opcional),
  "type": "payment|renewal|plan_change|reactivation" (opcional),
  "proration_days": int (optional, plan change),
  "old_plan_id": string (optional, plan change),
  "created_at": datetime,
  "expires_at": datetime,
  "paid_at": datetime (optional),
  "refund_reason": string (optional),
  "chargeback_reason": string (optional),
  "error_message": string (optional),
  "retry_count": int (optional)
}
```

---

### 1.2 Relaciones y Dependencias

| Colección | Campo | Tipo | Descripción |
|-----------|-------|------|-------------|
| transactions ↔ users | user_email | FK | Búsquedas por email de usuario |
| transactions ↔ users | referrer_id | FK | ObjectId del referidor |
| transactions ↔ webhook_events | event_id | Cross-ref | Eventos que triggerearon transacción |
| transactions ↔ webhook_logs | event_id | Cross-ref | Auditoría de webhooks |
| transactions ↔ receipts | user_id | Cross-ref | Comprobantes manuales (no es FK) |

**Importante:** `transactions.user_email` es la clave de búsqueda, NO `user_id`. Esto será un cambio arquitectónico.

---

### 1.3 Servicios que Consumen

| Servicio | Rol | Tipo |
|----------|-----|------|
| payment_provider_service | Base para integraciones futuras | Proveedor |
| webhook_handler | Procesa eventos Mercado Pago | Event Processor |
| renewal_service | Renueva suscripciones vencidas | Scheduler |
| notifier | Notificaciones a admin/user | Notifier |

**Nota:** `payment_provider_service.py` es estructura sin implementación; lo usan las rutas directamente.

---

## FASE 2: INVENTARIO DE OPERACIONES MONGODB

### 2.1 Mapa Exhaustivo de Operaciones

#### **OPERACIÓN 1: INSERT - Crear Transacción Inicial**

**Archivos:** `backend/routes/payment.py`  
**Líneas:** 784

**Código Actual:**
```python
await db.transactions.insert_one(transaction)
```

**Contexto:**
- Ruta: `POST /payment/init`
- Datos: `transaction = {...}`
- Validaciones: Datos básicos (plan_id, billing_cycle)
- Riesgo: ❌ NINGUNO (insert_one es safe)
- Dependencia: None

**Parámetros:**
```python
transaction = {
    "payment_id": payment_id,  # Único
    "user_email": request.user_email,
    "user_name": request.user_name,
    "plan_id": request.plan_id,
    "billing_cycle": request.billing_cycle,
    "amount_cop": cop_amount,
    "amount_local": local_amount,
    "currency": currency,
    "country": request.country,
    "gateway": gateway,
    "status": "pending",
    "checkout_url": checkout_url,
    "preference_id": preference_id,  # Optional
    "referral_code": request.referral_code,  # Optional
    "created_at": datetime.utcnow(),
    "expires_at": datetime.utcnow() + timedelta(hours=24)
}
```

---

#### **OPERACIÓN 2: FIND_ONE - Buscar por payment_id**

**Archivos:** 
- `backend/routes/payment.py` línea 805
- `backend/services/webhook_handler.py` línea 239
- `backend/services/webhook_handler.py` línea 376
- `backend/services/webhook_handler.py` línea 442
- `backend/services/webhook_handler.py` línea 532

**Código Actual:**
```python
transaction = await db.transactions.find_one({"payment_id": payment_id})
```

**Contexto:**
- Búsqueda: Por `payment_id` (único)
- Validaciones: Verifica existencia
- Riesgo: ❌ NINGUNO (clave única)
- Dependencia: Después, se actualiza o procesa

**Ocurrencias:**
- `/confirm/{payment_id}` → Valida transacción existe
- `webhook: payment.updated` → Busca por external_reference → payment_id
- `webhook: refund.updated` → Busca por mp_payment_id → payment_id mapping
- `webhook: chargeback` → Busca por mp_payment_id
- `handle_merchant_order` → Busca transacción relacionada

---

#### **OPERACIÓN 3: UPDATE_ONE - Marcar como Pagada**

**Archivos:**
- `backend/routes/payment.py` línea 421
- `backend/services/webhook_handler.py` línea 255
- `backend/services/webhook_handler.py` línea 390

**Código Actual:**
```python
await db.transactions.update_one(
    {"payment_id": payment_id},
    {"$set": {"status": "paid", "paid_at": datetime.utcnow()}}
)
```

**Contexto:**
- Filtro: `{"payment_id": payment_id}`
- Update: `{"$set": {...}}`
- Validaciones: Verifica matched_count > 0
- Riesgo: ⚠️ MEDIO (sin firma, no hay validación de tenant)
- Dependencia: Seguido por _apply_payment_success()

**Variantes:**
1. Marcar como pagada (status=paid, paid_at)
2. Marcar como rechazada (status=rejected, error_message)
3. Marcar como reembolsada (status=refunded, refund_reason)
4. Agregar retry_count (subscription.paused, reintento)

---

#### **OPERACIÓN 4: UPDATE_ONE - Agregar Datos de Pago**

**Archivos:** `backend/services/webhook_handler.py` línea 472

**Código Actual:**
```python
await db.transactions.update_one(
    {"payment_id": payment_id},
    {
        "$set": {
            "mp_payment_id": payment_id,  # Mapping MP
            "updated_at": datetime.utcnow()
        }
    }
)
```

**Contexto:**
- Agrega identificadores de pasarela (mp_payment_id)
- Updates incremental (un campo a la vez)
- Riesgo: ⚠️ BAJO (map MP → PCL)
- Dependencia: Webhooks de actualización

---

#### **OPERACIÓN 5: FIND_ONE - Última Transacción Pagada por Email**

**Archivos:**
- `backend/routes/payment.py` línea 1076
- `backend/routes/payment.py` línea 1132
- `backend/routes/payment.py` línea 1230
- `backend/services/renewal_service.py` línea 172

**Código Actual:**
```python
last_tx = await db.transactions.find_one(
    {"user_email": current["email"], "status": "paid", "plan_id": plan_id},
    sort=[("paid_at", -1)]
)
```

**Contexto:**
- Query: Email + status + plan_id
- Sort: Por paid_at DESC
- Uso: Obtener ciclo anterior (monthly/annual), calcular próxima renovación
- Riesgo: ⚠️ BAJO (sin firm_id, pero ok para email)
- Dependencia: Renovación, cambio de plan, reactivación

**Importante:** `plan_id` es opcional en algunos contextos:
```python
last_tx = await db.transactions.find_one(
    {"user_email": current["email"], "status": "paid"},
    sort=[("paid_at", -1)]
)
```

---

#### **OPERACIÓN 6: INSERT - Transacción de Renovación**

**Archivos:**
- `backend/routes/payment.py` línea 1188
- `backend/routes/payment.py` línea 1323
- `backend/routes/payment.py` línea 1474

**Código Actual:**
```python
transaction = {
    "payment_id": payment_id,
    ...,
    "type": "renewal" | "plan_change" | "reactivation",
    "created_at": datetime.utcnow(),
}
await db.transactions.insert_one(transaction)
```

**Contexto:**
- Similar a OPERACIÓN 1, pero con `type` específico
- Tipos: `renewal`, `plan_change`, `reactivation`
- Validaciones: Tipo + datos específicos (proration_days para cambios)
- Riesgo: ❌ NINGUNO
- Dependencia: None

---

#### **OPERACIÓN 7: FIND - Transacciones Pendientes de Renovación**

**Archivos:** `backend/services/renewal_service.py` línea 277

**Código Actual:**
```python
old_pending = await db.transactions.find({
    "type": "auto_renewal",
    "status": "pending",
    "created_at": {"$lt": datetime.utcnow() - timedelta(days=3)}
}).to_list(None)
```

**Contexto:**
- Query: Renovaciones automáticas + pending + > 3 días
- Sort: Ninguno (pero debería estar por created_at ASC)
- Uso: Reintentos fallidos
- Riesgo: ⚠️ BAJO (búsqueda general)
- Dependencia: Scheduler de reintentos

---

#### **OPERACIÓN 8: UPDATE_ONE - Incrementar retry_count**

**Archivos:** `backend/services/renewal_service.py` línea 292

**Código Actual:**
```python
await db.transactions.update_one(
    {"_id": tx["_id"]},
    {"$inc": {"retry_count": 1}}
)
```

**Contexto:**
- Incrementa contador de reintentos
- Guarda estado de reintento
- Riesgo: ⚠️ BAJO (simple increment)
- Dependencia: Lógica de reintentos

---

#### **OPERACIÓN 9: COUNT_DOCUMENTS - Pagos Pendientes (Admin)**

**Archivos:** `backend/routes/billing_admin.py` línea 171

**Código Actual:**
```python
pending_payments = await db.transactions.count_documents({
    "status": "pending",
})
```

**Contexto:**
- Query: Solo status
- Uso: Dashboard admin (últimas 24h implied)
- Riesgo: ⚠️ BAJO (lectura general)
- Dependencia: Admin dashboard

---

#### **OPERACIÓN 10: FIND - Pagos Recientes (Admin)**

**Archivos:** `backend/routes/billing_admin.py` línea 146

**Código Actual:**
```python
recent_payments = await db.transactions.find({
    "status": "paid",
    "created_at": {"$gt": month_ago}
}).to_list(None)
```

**Contexto:**
- Query: Status + rango de fechas
- Uso: Reportes admin (últimos 30 días)
- Riesgo: ⚠️ BAJO (lectura historial)
- Dependencia: Analytics, reporting

---

#### **OPERACIÓN 11: FIND - Renovaciones Automáticas Pendientes (Admin)**

**Archivos:** `backend/routes/billing_admin.py` línea 248

**Código Actual:**
```python
pending = await db.transactions.find({
    "type": "auto_renewal",
    "status": "pending",
}).to_list(None)
```

**Contexto:**
- Query: Tipo + status
- Uso: Panel de admin (renovaciones próximas)
- Riesgo: ⚠️ BAJO (lectura status)
- Dependencia: Admin monitoring

---

#### **OPERACIÓN 12: FIND - Referidos Pagados**

**Archivos:** `backend/routes/referrals.py` línea 64

**Código Actual:**
```python
referrals = await db.transactions.find({
    "referrer_id": user["_id"],
    "status": "paid"
}).to_list(None)
```

**Contexto:**
- Query: referrer_id + status
- Uso: Listar referidos que pagaron (para recompensas)
- Riesgo: ⚠️ BAJO (referrer_id es ObjectId de usuarios)
- Dependencia: Sistema de referidos

---

### 2.2 Matriz de Operaciones

| Op # | Tipo | Archivo | Línea | Colección | Query | Riesgo | Frecuencia |
|------|------|---------|-------|-----------|-------|--------|-----------|
| 1 | INSERT | payment.py | 784 | transactions | {} | ❌ None | Per request |
| 2 | FIND_ONE | payment.py | 805 | transactions | payment_id | ❌ None | Per request |
| 3 | UPDATE_ONE | payment.py | 421 | transactions | payment_id | ⚠️ Medium | Per confirm |
| 4 | UPDATE_ONE | webhook.py | 472 | transactions | payment_id | ⚠️ Low | Per webhook |
| 5 | FIND_ONE | payment.py | 1076 | transactions | email+status | ⚠️ Low | Per renew |
| 6 | INSERT | payment.py | 1188 | transactions | {} | ❌ None | Per renewal |
| 7 | FIND | renewal.py | 277 | transactions | type+status+date | ⚠️ Low | Per scheduler |
| 8 | UPDATE_ONE | renewal.py | 292 | transactions | _id | ⚠️ Low | Per retry |
| 9 | COUNT | billing.py | 171 | transactions | status | ⚠️ Low | Per dashboard |
| 10 | FIND | billing.py | 146 | transactions | status+date | ⚠️ Low | Per dashboard |
| 11 | FIND | billing.py | 248 | transactions | type+status | ⚠️ Low | Per dashboard |
| 12 | FIND | referrals.py | 64 | transactions | referrer_id+status | ⚠️ Low | Per user |

---

## FASE 3: CONTRATO ESPECÍFICO DE TransactionRepository

### 3.1 Métodos CRUD Base (Heredados de BaseRepository)

```
✅ OBLIGATORIO: create(firm_id, data, request_id) → Dict
✅ OBLIGATORIO: find_by_id(firm_id, resource_id, request_id) → Optional[Dict]
✅ OBLIGATORIO: find_many(firm_id, query, skip, limit, sort, request_id) → (List, int)
✅ OBLIGATORIO: update(firm_id, resource_id, update_data, request_id) → Optional[Dict]
✅ OBLIGATORIO: soft_delete(firm_id, resource_id, request_id) → bool
✅ OBLIGATORIO: hard_delete(firm_id, resource_id, request_id) → bool
✅ OBLIGATORIO: count_by_firm(firm_id) → int
✅ OBLIGATORIO: create_index(index_spec, **kwargs) → str
✅ OBLIGATORIO: ensure_indexes() → None
```

**NOTA IMPORTANTE:** Las transacciones NO tienen firm_id actualmente. El repositorio DEBE agregar firm_id como campo, pero será derivado de user_email → lookup en users.firm_id.

---

### 3.2 Métodos Especializados (TransactionRepository únicos)

#### **ESPECIALIZADO 1: find_by_payment_id(firm_id, payment_id, request_id)**

**Responsabilidad:** Buscar transacción por su ID único de pago.

**Parámetros:**
```python
firm_id: str              # Multi-tenant
payment_id: str          # Código único del pago (PCL-xxxxx)
request_id: str          # Auditoría
```

**Retorno:** `Optional[Dict]` — Documento o None

**Garantías:**
- Query: `{"payment_id": payment_id, "firm_id": firm_id}`
- Índice soportado: ✅ (unique index en payment_id)
- Auditoría: `[transactions] FIND_BY_PAYMENT_ID firm_id=X payment_id=Y found request_id=Z`

**Uso Esperado:**
```python
tx = await repo.find_by_payment_id(firm_id, "PCL-ABC123", request_id)
```

---

#### **ESPECIALIZADO 2: find_by_user_email(firm_id, user_email, skip, limit, request_id)**

**Responsabilidad:** Buscar todas las transacciones de un usuario (email).

**Parámetros:**
```python
firm_id: str              # Multi-tenant
user_email: str          # Email del usuario
skip: int = 0            # Paginación
limit: int = 50          # Paginación
request_id: str          # Auditoría
```

**Retorno:** `Tuple[List[Dict], int]` — (documentos, total)

**Garantías:**
- Query: `{"user_email": user_email, "firm_id": firm_id}`
- Índice soportado: ✅ (compound index: firm_id + user_email)
- Auditoría: `[transactions] FIND_BY_USER_EMAIL firm_id=X email=Y found=N total=M request_id=Z`

**Uso Esperado:**
```python
txs, total = await repo.find_by_user_email(firm_id, "user@example.com", 0, 50, request_id)
```

---

#### **ESPECIALIZADO 3: find_paid_by_user_and_plan(firm_id, user_email, plan_id, request_id)**

**Responsabilidad:** Buscar última transacción pagada de un usuario para un plan específico.

**Parámetros:**
```python
firm_id: str              # Multi-tenant
user_email: str          # Email del usuario
plan_id: str             # ID del plan (esencial, profesional, etc.)
request_id: str          # Auditoría
```

**Retorno:** `Optional[Dict]` — Última transacción pagada o None

**Garantías:**
- Query: `{"user_email": user_email, "plan_id": plan_id, "status": "paid", "firm_id": firm_id}`
- Sort: `[("paid_at", -1)]` (última primero)
- Índice soportado: ✅ (compound: firm_id + user_email + status, firm_id + plan_id)
- Auditoría: `[transactions] FIND_PAID_BY_USER_AND_PLAN firm_id=X email=Y plan=Z found request_id=REQ`

**Uso Esperado:**
```python
last_tx = await repo.find_paid_by_user_and_plan(firm_id, "user@example.com", "profesional", request_id)
# Uso: Obtener ciclo anterior, calcular próxima renovación
```

---

#### **ESPECIALIZADO 4: find_paid_by_user(firm_id, user_email, request_id)**

**Responsabilidad:** Buscar última transacción pagada de un usuario (cualquier plan).

**Parámetros:**
```python
firm_id: str              # Multi-tenant
user_email: str          # Email del usuario
request_id: str          # Auditoría
```

**Retorno:** `Optional[Dict]` — Última transacción pagada o None

**Garantías:**
- Query: `{"user_email": user_email, "status": "paid", "firm_id": firm_id}`
- Sort: `[("paid_at", -1)]`
- Índice soportado: ✅ (compound: firm_id + user_email + status)

**Uso Esperado:**
```python
last_tx = await repo.find_paid_by_user(firm_id, "user@example.com", request_id)
```

---

#### **ESPECIALIZADO 5: find_pending_by_type(firm_id, tx_type, skip, limit, request_id)**

**Responsabilidad:** Buscar transacciones pendientes de un tipo específico (renewal, plan_change, etc.).

**Parámetros:**
```python
firm_id: str              # Multi-tenant
tx_type: str             # "renewal" | "plan_change" | "reactivation" | "payment"
skip: int = 0            # Paginación
limit: int = 100         # Paginación
request_id: str          # Auditoría
```

**Retorno:** `Tuple[List[Dict], int]` — (documentos, total)

**Garantías:**
- Query: `{"type": tx_type, "status": "pending", "firm_id": firm_id}`
- Sort: `[("created_at", 1)]` (más antiguos primero, para reintentos)
- Índice soportado: ✅ (compound: firm_id + type + status)
- Auditoría: `[transactions] FIND_PENDING_BY_TYPE firm_id=X type=Y found=N request_id=Z`

**Uso Esperado:**
```python
pending_renewals, total = await repo.find_pending_by_type(firm_id, "auto_renewal", 0, 1000, request_id)
# Uso: Scheduler de reintentos
```

---

#### **ESPECIALIZADO 6: find_old_pending(firm_id, days_threshold=3, skip=0, limit=100, request_id=None)**

**Responsabilidad:** Buscar transacciones pendientes desde hace más de X días (para reintentos fallidos).

**Parámetros:**
```python
firm_id: str              # Multi-tenant
days_threshold: int = 3   # Días desde creación
skip: int = 0
limit: int = 100
request_id: str
```

**Retorno:** `Tuple[List[Dict], int]` — (documentos, total)

**Garantías:**
- Query: `{"status": "pending", "created_at": {"$lt": datetime.utcnow() - timedelta(days=days_threshold)}, "firm_id": firm_id}`
- Sort: `[("created_at", 1)]`
- Índice soportado: ✅ (compound: firm_id + status + created_at)

**Uso Esperado:**
```python
old_pending, total = await repo.find_old_pending(firm_id, days_threshold=3, request_id=request_id)
```

---

#### **ESPECIALIZADO 7: find_by_status(firm_id, status, skip, limit, request_id)**

**Responsabilidad:** Buscar todas las transacciones con un estado específico.

**Parámetros:**
```python
firm_id: str              # Multi-tenant
status: str             # "pending" | "paid" | "rejected" | "cancelled" | "refunded"
skip: int = 0
limit: int = 100
request_id: str
```

**Retorno:** `Tuple[List[Dict], int]` — (documentos, total)

**Garantías:**
- Query: `{"status": status, "firm_id": firm_id}`
- Índice soportado: ✅ (compound: firm_id + status)
- Auditoría: `[transactions] FIND_BY_STATUS firm_id=X status=Y found=N request_id=Z`

**Uso Esperado:**
```python
paid_txs, total = await repo.find_by_status(firm_id, "paid", 0, 1000, request_id)
```

---

#### **ESPECIALIZADO 8: count_by_status(firm_id, status, request_id)**

**Responsabilidad:** Contar transacciones por estado.

**Parámetros:**
```python
firm_id: str
status: str
request_id: str
```

**Retorno:** `int` — Conteo

**Garantías:**
- Query: `{"status": status, "firm_id": firm_id}`
- Índice soportado: ✅
- Auditoría: `[transactions] COUNT_BY_STATUS firm_id=X status=Y count=N request_id=Z`

---

#### **ESPECIALIZADO 9: find_referrals_paid(firm_id, referrer_id, request_id)**

**Responsabilidad:** Buscar todos los referidos que pagaron de un referidor específico.

**Parámetros:**
```python
firm_id: str              # Multi-tenant
referrer_id: ObjectId     # ID del usuario referidor
request_id: str
```

**Retorno:** `List[Dict]` — Transacciones pagadas de referidos

**Garantías:**
- Query: `{"referrer_id": referrer_id, "status": "paid", "firm_id": firm_id}`
- Índice soportado: ✅ (compound: firm_id + referrer_id + status)

---

#### **ESPECIALIZADO 10: mark_paid(firm_id, payment_id, request_id, paid_at=None)**

**Responsabilidad:** Marcar transacción como pagada (éxito).

**Parámetros:**
```python
firm_id: str
payment_id: str
request_id: str
paid_at: datetime = None  # Default: datetime.utcnow()
```

**Retorno:** `Optional[Dict]` — Documento actualizado o None

**Garantías:**
- Query: `{"payment_id": payment_id, "firm_id": firm_id}`
- Update: `{"$set": {"status": "paid", "paid_at": paid_at}}`
- Validaciones: matched_count > 0
- Auditoría: `[transactions] MARK_PAID firm_id=X payment_id=Y request_id=Z`

**Uso Esperado:**
```python
updated = await repo.mark_paid(firm_id, payment_id, request_id)
```

---

#### **ESPECIALIZADO 11: mark_rejected(firm_id, payment_id, error_message, request_id)**

**Responsabilidad:** Marcar como rechazada (error de pasarela).

**Parámetros:**
```python
firm_id: str
payment_id: str
error_message: str
request_id: str
```

**Retorno:** `Optional[Dict]`

**Garantías:**
- Update: `{"$set": {"status": "rejected", "error_message": error_message}}`

---

#### **ESPECIALIZADO 12: mark_refunded(firm_id, payment_id, refund_reason, request_id)**

**Responsabilidad:** Marcar como reembolsada.

**Parámetros:**
```python
firm_id: str
payment_id: str
refund_reason: str
request_id: str
```

**Retorno:** `Optional[Dict]`

**Garantías:**
- Update: `{"$set": {"status": "refunded", "refund_reason": refund_reason, "refunded_at": datetime.utcnow()}}`

---

#### **ESPECIALIZADO 13: add_mp_payment_id(firm_id, payment_id, mp_payment_id, request_id)**

**Responsabilidad:** Agregar mapping de Mercado Pago (mp_payment_id).

**Parámetros:**
```python
firm_id: str
payment_id: str
mp_payment_id: str
request_id: str
```

**Retorno:** `Optional[Dict]`

**Garantías:**
- Update: `{"$set": {"mp_payment_id": mp_payment_id}}`

---

#### **ESPECIALIZADO 14: increment_retry_count(firm_id, payment_id, request_id)**

**Responsabilidad:** Incrementar contador de reintentos.

**Parámetros:**
```python
firm_id: str
payment_id: str
request_id: str
```

**Retorno:** `Optional[Dict]`

**Garantías:**
- Update: `{"$inc": {"retry_count": 1}}`

---

### 3.3 Validaciones Automáticas

**En CREATE:**
```
✅ Validar: payment_id no es None
✅ Validar: user_email válido (formato email)
✅ Validar: plan_id en catálogo (esencial, profesional, elite, ilimitado)
✅ Validar: billing_cycle en (monthly, annual)
✅ Validar: amount_local > 0
✅ Validar: currency es código ISO válido
✅ Validar: status en (pending, paid, rejected, cancelled, refunded)
✅ Validar: gateway en (mercado_pago, paypal)
✅ Inyectar: firm_id (desde users.firm_id por email)
✅ Inyectar: created_at si no existe
✅ Inyectar: expires_at si no existe (created_at + 24h)
```

**En UPDATE:**
```
✅ Validar: payment_id existe
✅ Validar: firm_id match
✅ Prohibir: Cambiar payment_id (campo inmutable)
✅ Prohibir: Cambiar user_email (campo inmutable)
✅ Auditar: Todos los campos que cambian
✅ Actualizar: updated_at automáticamente
```

**En SOFT DELETE:**
```
✅ Validar: Documento existe
✅ Marcar: deleted_at = datetime.utcnow()
✅ Auditar: Registro de deletion
```

---

### 3.4 Índices Requeridos

**Índices Actuales (a Preservar):**
```
1. {"payment_id": 1} — unique=True (identificador único)
2. {"user_email": 1} — (búsquedas por usuario)
3. {"status": 1} — (reportes)
4. {"created_at": 1} — (ordenamiento)
5. {"plan_id": 1} — (filtros por plan)
6. {"type": 1} — (filtros por tipo)
```

**Índices Nuevos (Requeridos para Repositorio):**
```
7. {"firm_id": 1} — ✅ OBLIGATORIO (multi-tenant)
8. {"firm_id": 1, "user_email": 1} — Búsquedas por usuario+tenant
9. {"firm_id": 1, "payment_id": 1} — Búsqueda por tenant+pago
10. {"firm_id": 1, "status": 1} — Reportes por status+tenant
11. {"firm_id": 1, "type": 1, "status": 1} — Renovaciones automáticas
12. {"firm_id": 1, "referrer_id": 1, "status": 1} — Referidos pagados
13. {"firm_id": 1, "created_at": -1} — Ordenamiento por fecha
14. {"firm_id": 1, "user_email": 1, "status": 1} — Última transacción pagada
15. {"firm_id": 1, "user_email": 1, "plan_id": 1, "status": 1} — Última transacción pagada por plan
16. {"status": 1, "created_at": 1} — Reintentos antiguos
17. {"payment_id": 1, "expires_at": 1} — TTL cleanups (si aplica)
```

---

### 3.5 Integración con BaseRepository

**Métodos Heredados (Override Bloqueado):**
- ✅ create()
- ✅ find_by_id()
- ✅ find_many()
- ✅ update()
- ✅ soft_delete()
- ✅ hard_delete()
- ✅ count_by_firm()

**Métodos Base Usados (No Override):**
- ✅ create_index() — Llamado en ensure_indexes()
- ✅ _is_valid_object_id() — Helper para validaciones
- ✅ try/except + logger.error() — Patrón de manejo de errores

**Firma de Clase:**
```python
class TransactionRepository(BaseRepository[Transaction]):
    def __init__(self, collection: AsyncIOMotorCollection):
        super().__init__(collection, Transaction)
        self.collection = collection
```

---

### 3.6 Integración con TenantAwareQuery

**Uso Obligatorio:**
```python
# En todos los métodos derivados:
from backend.middleware.tenant_isolation import TenantAwareQuery

query = {"user_email": email, "status": "paid"}
query = TenantAwareQuery.add_firm_filter(query, firm_id)
# Result: {"user_email": email, "status": "paid", "firm_id": firm_id}
```

**Patrón:**
```python
# ❌ PROHIBIDO:
await self.collection.find_one({"payment_id": payment_id})

# ✅ PERMITIDO:
query = TenantAwareQuery.add_firm_filter({"payment_id": payment_id}, firm_id)
await self.collection.find_one(query)
```

---

## FASE 4: PLAN DE MIGRACIÓN

### 4.1 Archivos que Cambiarán

| Archivo | Cambio | Líneas | Impacto |
|---------|--------|--------|---------|
| backend/repositories/transaction/transaction_repository.py | **CREAR** | ~600 | NUEVA CLASE |
| backend/repositories/transaction/transaction_dto.py | **CREAR** | ~100 | DTOs Pydantic |
| backend/repositories/transaction/transaction_exceptions.py | **CREAR** | ~50 | Excepciones |
| backend/repositories/transaction/transaction_indexes.py | **CREAR** | ~50 | Index definitions |
| backend/repositories/__init__.py | **MODIFICAR** | +5 | Export TransactionRepository |
| backend/routes/payment.py | **MODIFICAR** | -40, +40 | Usar repo en lugar de db.transactions |
| backend/services/webhook_handler.py | **MODIFICAR** | -30, +30 | Usar repo en lugar de db.transactions |
| backend/services/renewal_service.py | **MODIFICAR** | -20, +20 | Usar repo en lugar de db.transactions |
| backend/routes/billing_admin.py | **MODIFICAR** | -20, +20 | Usar repo en lugar de db.transactions |
| backend/routes/referrals.py | **MODIFICAR** | -5, +5 | Usar repo en lugar de db.transactions |
| backend/server.py | **MODIFICAR** | -6, +0 | Remover índices de manual (serán creados por ensure_indexes) |

**Total de cambios:** ~5 archivos nuevos, ~5 archivos modificados, ~100 líneas reemplazadas

---

### 4.2 Estructura de Carpetas Nuevas

```
backend/repositories/transaction/
├── __init__.py
├── transaction_repository.py    (~600 líneas)
├── transaction_dto.py           (~100 líneas)
├── transaction_exceptions.py    (~50 líneas)
└── transaction_indexes.py       (~50 líneas)
```

---

### 4.3 Cambios Detallados por Archivo

#### **backend/routes/payment.py**

**Cambios:**
- **Línea 784:** `await db.transactions.insert_one(transaction)`
  - → `await transaction_repo.create(firm_id, transaction, request_id)`
  
- **Línea 805:** `transaction = await db.transactions.find_one({"payment_id": payment_id})`
  - → `transaction = await transaction_repo.find_by_payment_id(firm_id, payment_id, request_id)`

- **Línea 1076:** `last_tx = await db.transactions.find_one({...}, sort=[...])`
  - → `last_tx = await transaction_repo.find_paid_by_user_and_plan(firm_id, email, plan_id, request_id)`

- **Línea 421, 1188, 1323, 1474:** Similar, todos los `.insert_one()` → `.create()`

**Impacto:** 
- ✅ Cero cambio en lógica de negocios
- ✅ Todas las validaciones se transfieren a repo
- ✅ Auditoría centralizada

---

#### **backend/services/webhook_handler.py**

**Cambios:**
- **Línea 239:** `tx = await db.transactions.find_one(...)`
  - → `tx = await transaction_repo.find_by_payment_id(firm_id, payment_id, request_id)`

- **Línea 255, 390, etc:** Updates
  - → Usar métodos especializados: `mark_paid()`, `add_mp_payment_id()`, etc.

**Impacto:**
- ✅ Lógica de webhook intacta
- ✅ Solo los accesos a DB cambian
- ⚠️ Necesita inyección del repo (DI)

---

#### **backend/server.py**

**Cambios:**
- **Líneas 292-298:** Remover índices manuales
  ```python
  # ❌ REMOVER:
  await db.transactions.create_index([("payment_id", 1)], unique=True)
  await db.transactions.create_index([("user_email", 1)])
  ```

- **Agregar inicialización del repo:**
  ```python
  # ✅ AGREGAR:
  from backend.repositories.transaction import TransactionRepository
  transaction_repo = TransactionRepository(db.transactions)
  await transaction_repo.ensure_indexes()
  ```

**Impacto:**
- ✅ Índices ahora gestionados por repo
- ✅ Centralización de definiciones

---

### 4.4 Inyección de Dependencias (DI)

**Patrón Actual (Sin Repositorio):**
```python
@router.get("/status")
async def get_status(
    current=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    tx = await db.transactions.find_one({...})
```

**Patrón Nuevo (Con Repositorio):**
```python
@router.get("/status")
async def get_status(
    current=Depends(get_current_user),
    transaction_repo: TransactionRepository = Depends(get_transaction_repo),
    request: Request
):
    firm_id = get_tenant_context(request).firm_id
    request_id = get_tenant_context(request).request_id
    tx = await transaction_repo.find_by_payment_id(firm_id, payment_id, request_id)
```

**Función de Dependencia (Agregar a server.py u auth.py):**
```python
async def get_transaction_repo() -> TransactionRepository:
    from server import db
    from backend.repositories.transaction import TransactionRepository
    return TransactionRepository(db.transactions)
```

---

### 4.5 Estimación de Esfuerzo

| Tarea | Horas | Verificable |
|-------|-------|-------------|
| Implementar TransactionRepository | 8 | Tests pass |
| Refactorizar payment.py | 3 | No tests broken |
| Refactorizar webhook_handler.py | 3 | Webhooks funcionales |
| Refactorizar renewal_service.py | 2 | Renovaciones automáticas OK |
| Refactorizar billing_admin.py | 2 | Admin dashboard funcional |
| Refactorizar referrals.py | 1 | Referidos cálculos OK |
| Tests unitarios | 6 | 90%+ coverage |
| Tests E2E | 4 | Flujos de pago OK |
| Code review + fixes | 2 | Feedback resuelto |
| **TOTAL** | **31 horas** | |

---

## FASE 5: CERTIFICACIÓN Y PRUEBAS

### 5.1 Checklist de Certificación (Golden Template)

Todos los 50 criterios del Golden Template deben cumplirse:

#### SECCIÓN 1: Herencia y Estructura
- [ ] **1.1** TransactionRepository hereda de BaseRepository
- [ ] **1.2** Ubicación: `backend/repositories/transaction/transaction_repository.py`
- [ ] **1.3** `backend/repositories/transaction/__init__.py` exporta clase
- [ ] **1.4** Existe `transaction_dto.py` con modelos Pydantic
- [ ] **1.5** Existe `transaction_exceptions.py` con excepciones propias

#### SECCIÓN 2: Firma de Métodos
- [ ] **2.1** NO hay override de create(), find_by_id(), update(), soft_delete(), hard_delete()
- [ ] **2.2** Todos los métodos especializados tienen firma: (self, firm_id, ..., request_id, ...)
- [ ] **2.3** request_id en TODOS los métodos públicos

#### SECCIÓN 3: Aislamiento Tenant
- [ ] **3.1** create() inyecta firm_id (derivado de user_email)
- [ ] **3.2** TODAS las queries usan TenantAwareQuery.add_firm_filter() o query["firm_id"]
- [ ] **3.3** NINGUNA query sin firm_id (grep validation)
- [ ] **3.4** Métodos admin/system explícitamente documentados
- [ ] **3.5** Soft delete honrado: queries incluyen "deleted_at": None

#### SECCIÓN 4: Auditoría y Logs
- [ ] **4.1** create() loguea: `[transactions] CREATE firm_id=X id=Y request_id=Z`
- [ ] **4.2** find_* loguea: `[transactions] FIND firm_id=X found=N request_id=Z`
- [ ] **4.3** update() loguea: `[transactions] UPDATE firm_id=X id=Y request_id=Z`
- [ ] **4.4** delete() loguea: `[transactions] DELETE firm_id=X id=Y request_id=Z`
- [ ] **4.5** Errores loguean y relanza: `except Exception: logger.error(...); raise`
- [ ] **4.6** request_id en TODOS los logs

#### SECCIÓN 5: Índices
- [ ] **5.1** ensure_indexes() implementado
- [ ] **5.2** Índice firm_id como primer campo: `[("firm_id", 1)]`
- [ ] **5.3** Índices compuestos para cada query especializada
- [ ] **5.4** Índice soft_delete (si aplica): `[("firm_id", 1), ("deleted_at", 1)]`
- [ ] **5.5** Índices únicos marcados: unique=True, sparse=True
- [ ] **5.6** TTL indexes si aplica

#### SECCIÓN 6: Validaciones y Hooks
- [ ] **6.1** Validación de entrada (tipos, rangos)
- [ ] **6.2** Validación de firm_id (not None)
- [ ] **6.3** Hooks _before_create, _after_create, etc. (si aplica)
- [ ] **6.4** Validaciones de negocio (payment_id único, plan_id válido, etc.)

#### SECCIÓN 7: Manejo de Errores
- [ ] **7.1** try/except en TODOS los métodos públicos
- [ ] **7.2** Excepciones específicas (PaymentNotFound, DuplicatePayment, etc.)
- [ ] **7.3** DuplicateKeyError manejado (payment_id unique)
- [ ] **7.4** No silent failures (siempre logger.error + raise)
- [ ] **7.5** matched_count vs modified_count

#### SECCIÓN 8: Documentación
- [ ] **8.1** Docstring en clase TransactionRepository
- [ ] **8.2** Docstring en CADA método público
- [ ] **8.3** Comentarios solo para WHY (no code explanation)
- [ ] **8.4** Ejemplo de uso en docstring

#### SECCIÓN 9: Tests
- [ ] **9.1** Tests de CRUD base heredados
- [ ] **9.2** Tests de métodos especializados
- [ ] **9.3** Tests de aislamiento tenant (firma diferente → None/empty)
- [ ] **9.4** Tests de soft_delete (no retorna después)
- [ ] **9.5** Tests de índices
- [ ] **9.6** Tests de excepciones

#### SECCIÓN 10: Performance y Seguridad
- [ ] **10.1** Índices soportan queries (EXPLAIN: IXSCAN)
- [ ] **10.2** Conteos correctos (total_count = matches)
- [ ] **10.3** Límites de paginación (máximo 1000)
- [ ] **10.4** NO exponential queries
- [ ] **10.5** NO data leakage entre tenants
- [ ] **10.6** Proyecciones si excluyen datos sensibles

---

### 5.2 Pruebas E2E Requeridas

#### **Test E2E 1: Flujo Completo de Pago**

**Escenario:**
1. Cliente inicia pago: `POST /payment/init`
2. Transacción se crea en DB con status=pending
3. Cliente confirm pago: `POST /payment/confirm/{payment_id}`
4. Transacción marca como paid
5. Usuario suscripción se activa

**Validaciones:**
- ✅ Transacción existe en DB
- ✅ status cambió de pending → paid
- ✅ user.plan_id se actualizó
- ✅ Logs contienen request_id trazable end-to-end
- ✅ Auditoría completa en repositorio

**Pasos:**
```bash
1. POST /payment/init
   firm_id = tenant-1
   plan_id = "profesional"
   user_email = "user@example.com"
   
   → payment_id = "PCL-ABC123"
   → Transacción creada con status=pending

2. POST /payment/confirm/PCL-ABC123
   firm_id = tenant-1
   
   → status = pending → paid
   → paid_at se establece
   → user.plan_id = "profesional"

3. GET /payment/subscription-status
   → plan_id = "profesional"
   → subscription_status = "active"
```

---

#### **Test E2E 2: Webhook de Mercado Pago**

**Escenario:**
1. Mercado Pago envía webhook: `payment.approved`
2. Sistema valida HMAC
3. Transacción se marca como paid
4. Usuario suscripción se activa
5. Referidor (si existe) recibe recompensa

**Validaciones:**
- ✅ HMAC validado
- ✅ Evento no procesado dos veces (idempotencia)
- ✅ Transacción actualizada
- ✅ Referido procesado
- ✅ Webhook logs auditado

**Pasos:**
```bash
1. POST /payment/webhook
   X-Signature: hmac-signature
   Body: {
     "id": "webhook-event-123",
     "type": "payment.approved",
     "data": {"id": mp-payment-id}
   }
   
   → Validar HMAC ✅
   → Buscar transacción por mp_payment_id
   → Marcar como paid
   → webhook_events registrado

2. Reintento con mismo webhook
   → Detectar duplicado
   → Retornar 200 (idempotente)
```

---

#### **Test E2E 3: Renovación Automática**

**Escenario:**
1. Suscripción se vence
2. Scheduler detecta vencimiento
3. Crea nuevo payment intent
4. Usuario recibe notificación
5. Usuario paga renovación

**Validaciones:**
- ✅ Transacción tipo=renewal creada
- ✅ checkout_url generada
- ✅ Notificación enviada
- ✅ Status sigue activo hasta vencer

---

#### **Test E2E 4: Cambio de Plan con Prorrateo**

**Escenario:**
1. Usuario con plan esencial (112.500 COP/mes)
2. Cambia a plan profesional (210.000 COP/mes)
3. Sistema calcula diferencia prorrateada
4. Crea payment intent por la diferencia
5. Usuario paga
6. Plan cambia

**Validaciones:**
- ✅ Proration_amount calculado correctamente
- ✅ Transacción tipo=plan_change creada
- ✅ plan_id cambió
- ✅ Auditoría de cambio registrada

---

#### **Test E2E 5: Referidos y Recompensas**

**Escenario:**
1. Referidor A refiere a Usuario B
2. Usuario B paga suscripción con código de referido
3. Transacción se marca como paid
4. Referidor A recibe crédito (+1 mes gratis)
5. Notificación enviada a A

**Validaciones:**
- ✅ transacción.referrer_id = A._id
- ✅ transacción.reward_applied = true
- ✅ users[A].free_months_credits incrementado
- ✅ Notificación creada para A

---

### 5.3 Pruebas de Integridad de Datos

#### **Test 1: Aislamiento Multi-Tenant**

**Setup:**
- Firm 1, User A
- Firm 2, User B
- Ambos pagan

**Test:**
```python
# Firm 1 no puede ver transacciones de Firm 2
txs_f1 = await repo.find_by_user_email(firm_id="firm-1", user_email="b@example.com", ...)
assert txs_f1 == []  # Debe estar vacío

# Firm 2 no puede ver transacciones de Firm 1
txs_f2 = await repo.find_by_user_email(firm_id="firm-2", user_email="a@example.com", ...)
assert txs_f2 == []  # Debe estar vacío
```

**Validación:**
- ✅ Cross-tenant queries retornan empty
- ✅ firm_id SIEMPRE en WHERE

---

#### **Test 2: Integridad de payment_id Único**

**Setup:**
- Crear transacción con payment_id="PCL-123"
- Intentar crear otra con mismo payment_id

**Test:**
```python
# Primera creación OK
tx1 = await repo.create(firm_id, {"payment_id": "PCL-123", ...}, request_id)
assert tx1 is not None

# Segunda creación debe fallar (DuplicateKeyError)
try:
    tx2 = await repo.create(firm_id, {"payment_id": "PCL-123", ...}, request_id)
    assert False, "Debería haber lanzado excepción"
except DuplicatePaymentError:
    pass  # OK
```

---

#### **Test 3: Status Transitions**

**Validaciones:**
- ✅ pending → paid ✅
- ✅ pending → rejected ✅
- ✅ pending → cancelled ✅
- ✅ paid → refunded ✅
- ✅ ❌ paid → pending (prohibido)

---

#### **Test 4: Soft Delete**

**Test:**
```python
# Crear transacción
tx = await repo.create(firm_id, data, request_id)
original_id = tx["_id"]

# Soft delete
await repo.soft_delete(firm_id, original_id, request_id)

# find_many NO retorna
txs, total = await repo.find_many(firm_id, {"_id": original_id}, ...)
assert len(txs) == 0

# find_by_id SÍ retorna (porque no filtra deleted_at por defecto)
# (comportamiento a definir en ensure_indexes)
```

---

### 5.4 Pruebas de Performance

#### **Test 1: Query Performance con Índices**

**Setup:**
- 100.000 transacciones en DB
- Índices creados con ensure_indexes()

**Test:**
```python
# Búsqueda por payment_id (unique index) < 5ms
start = time.time()
tx = await repo.find_by_payment_id(firm_id, "PCL-ABC", request_id)
elapsed = (time.time() - start) * 1000
assert elapsed < 5, f"Expected < 5ms, got {elapsed}ms"

# Búsqueda por usuario + status (compound index) < 50ms
start = time.time()
txs, total = await repo.find_by_status(firm_id, "paid", 0, 10, request_id)
elapsed = (time.time() - start) * 1000
assert elapsed < 50, f"Expected < 50ms, got {elapsed}ms"
```

---

#### **Test 2: Índices sin COLLSCAN**

**Test:**
```python
# Verificar que EXPLAIN muestra IXSCAN, no COLLSCAN
explain = await db.transactions.aggregate([
    {"$match": {"firm_id": firm_id, "status": "paid"}},
    {"$explain": "executionStats"}
]).to_list(1)

stats = explain[0].get("executionStats", {})
assert stats.get("executionStages", {}).get("stage") == "IXSCAN", "COLLSCAN detected!"
```

---

### 5.5 Matriz de Aceptación (Pass/Fail)

| Prueba | Tipo | Resultado | Evidencia |
|--------|------|-----------|-----------|
| E2E: Pago completo | Functional | PASS/FAIL | Tests corrieron |
| E2E: Webhook | Functional | PASS/FAIL | Evento procesado |
| E2E: Renovación | Functional | PASS/FAIL | Transacción creada |
| E2E: Plan change | Functional | PASS/FAIL | Prorrateo correcto |
| E2E: Referidos | Functional | PASS/FAIL | Recompensa aplicada |
| Aislamiento tenant | Security | PASS/FAIL | Firm 1 no ve Firm 2 |
| payment_id único | Integrity | PASS/FAIL | DuplicateKeyError |
| Soft delete | Integrity | PASS/FAIL | Documento no retorna |
| Query < 5ms | Performance | PASS/FAIL | Tiempo medido |
| IXSCAN (no COLLSCAN) | Performance | PASS/FAIL | EXPLAIN output |
| Code coverage > 90% | Quality | PASS/FAIL | Coverage report |
| Checklist 50/50 items | Quality | PASS/FAIL | Todos checkmarks |

---

## FASE 4 (REVISED): PLAN DE MIGRACIÓN DETALLADO

### 4.6 Estrategia de Rollback

#### **Escenario 1: Error en Implementación del Repo**

**Si ocurre:** TransactionRepository no compila o falla en tests básicos

**Rollback:**
1. Mantener `backend/routes/payment.py` usando `db.transactions` directamente
2. NO refactorizar services/webhooks/renewal
3. TransactionRepository permanece como código no integrado
4. PRs no mergeado

**Tiempo de Rollback:** 0 minutos (nunca se publicó)

---

#### **Escenario 2: Error en Refactorización de payment.py**

**Si ocurre:** Cambios a payment.py rompen flujo de pago

**Rollback:**
1. Revert commit de refactorización de payment.py
2. TransactionRepository sigue sin usarse en payment.py
3. Otros servicios pueden seguir usando db.transactions

**Validación:** Flujo de pago E2E debe pasar

**Tiempo de Rollback:** 5 minutos (revert + test)

---

#### **Escenario 3: Error en Data Consistency**

**Si ocurre:** Transacciones corrompidas o firm_id derivado incorrectamente

**Prevention:** (Migración en dos pasos)
1. **Paso A:** Agregar firm_id a transacciones existentes (script de migración)
2. **Paso B:** Activar TransactionRepository después que Paso A 100% completo

**Script de Migración (Sin repositorio aún):**
```javascript
// Script MongoDB:
db.transactions.updateMany(
  { firm_id: { $exists: false } },
  [
    {
      $lookup: {
        from: "users",
        localField: "user_email",
        foreignField: "email",
        as: "user"
      }
    },
    {
      $set: {
        firm_id: { $arrayElemAt: ["$user.firm_id", 0] }
      }
    },
    {
      $unset: "user"
    }
  ]
)
```

**Validación Post-Migración:**
```bash
# Verificar que TODAS las transacciones tienen firm_id
db.transactions.countDocuments({ firm_id: { $exists: false } })
# Resultado: 0
```

**Rollback si falla:** Restaurar from backup (pre-migración)

---

#### **Escenario 4: Error en Índices**

**Si ocurre:** Índices nuevos ralentizan queries

**Prevention:**
1. Crear índices en background: `background=True`
2. Monitorear performance durante creación
3. Si degrada, drop índices nuevos en background

**Commands:**
```javascript
// Drop índices nuevos si es necesario
db.transactions.dropIndex("firm_id_1")
db.transactions.dropIndex("firm_id_1_user_email_1")
// ... resto de índices
```

---

### 4.7 Estrategia de Deployment (Staging → Production)

#### **Phase 1: Preparación (No usuario impactado)**

**Duración:** 2 días

```
Paso 1: Crear TransactionRepository (código + tests)
Paso 2: PR Review + aprobación
Paso 3: Merge a rama `staging` (sin usar todavía)
Paso 4: Deploy a staging DB (paralelo)
Paso 5: Tests E2E en staging (paralelo, no interfieren prod)
```

---

#### **Phase 2: Migración de Datos (Baja ventana, ~30 minutos)**

**Duración:** 30 minutos (ventana de mantenimiento)

```
Paso 1: Notificar usuarios (maintenance window)
Paso 2: Pausar crons de renovación
Paso 3: Ejecutar script de migración (agregar firm_id)
Paso 4: Validar migración (0 transacciones sin firm_id)
Paso 5: Reanudar crons
Paso 6: Confirmar prod DB
```

---

#### **Phase 3: Refactorización Gradual**

**Duración:** 3 semanas

**Week 1:** Refactorizar payment.py
- Cambiar `db.transactions.insert_one()` → `transaction_repo.create()`
- Tests E2E: Pago completoenumerator
- Monitorear logs/errores

**Week 2:** Refactorizar webhook_handler.py + renewal_service.py
- Cambiar accesos dirección a transacciones
- Tests de webhooks
- Tests de renovación automática

**Week 3:** Refactorizar billing_admin.py + referrals.py
- Dashboard debe funcionar igual
- Tests de referencias

---

#### **Phase 4: Validación y Cierre**

**Duración:** 1 semana

```
Paso 1: Auditoría: Verificar que TODAS las queries usan repo
Paso 2: Performance: Comparar índices old vs new
Paso 3: Seguridad: Validar aislamiento tenant
Paso 4: Cleanup: Remover código legacy de db.transactions en server.py
Paso 5: Documentación: Actualizar ADRs + runbooks
Paso 6: Celebrar 🎉
```

---

## RESUMEN EJECUTIVO

### Estadísticas del Plan

| Métrica | Valor |
|---------|-------|
| Archivos nuevos | 4 |
| Archivos modificados | 5 |
| Líneas de código nuevo | ~800 |
| Líneas refactorizadas | ~100 |
| Métodos base heredados | 9 |
| Métodos especializados | 14 |
| Índices nuevos | 11 |
| Casos de prueba E2E | 5 |
| Casos de prueba integridad | 4 |
| Casos de prueba performance | 2 |
| Tiempo de implementación | 31 horas |
| Tiempo de migración | 30 minutos (ventana) |
| Tiempo de refactorización | 3 semanas |
| Riesgo general | ⚠️ BAJO (bien mitigado) |

---

### Criterios de Éxito

✅ **DEBE CUMPLIR (Blockers):**
1. Todos los 50 criterios del checklist de certificación
2. 100% de tests E2E pasando
3. 0 transacciones corruptas post-migración
4. 0 cross-tenant data leakage
5. Performance ≥ original (índices optimizados)
6. Auditoría completa (request_id end-to-end)

✅ **DEBERÍA CUMPLIR (Nice to have):**
1. Code coverage > 90%
2. Todos los métodos documentados
3. ADR (Architecture Decision Record) actualizado
4. Runbooks de operaciones actualizados

---

### Riesgos Residuales

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|-----------|
| Índices mal diseñados | Baja | Medio | EXPLAIN testing + staging |
| firm_id derivado incorrecto | Muy Baja | Alto | Script de migración + validación |
| Cross-tenant leakage | Muy Baja | Crítico | Tests de aislamiento obligatorios |
| Performance degradation | Baja | Medio | Benchmarking antes/después |
| Webhook idempotencia | Muy Baja | Medio | Tests de duplicados |

---

### Próximos Pasos Inmediatos

1. ✅ Aprobación de este plan
2. ⏳ Crear rama `feature/transaction-repo`
3. ⏳ Implementar TransactionRepository (8 horas)
4. ⏳ Tests unitarios + E2E (6 horas)
5. ⏳ PR review
6. ⏳ Merge a staging
7. ⏳ Validar en staging DB (paralelo, sin prod impact)
8. ⏳ Programar ventana de migración
9. ⏳ Ejecutar migración + refactorización

---

**FIN DEL PLAN**

Versión: 1.0  
Fecha: 2024  
Autoridad: Principal Software Architect  
Estado: ✅ LISTO PARA IMPLEMENTACIÓN
