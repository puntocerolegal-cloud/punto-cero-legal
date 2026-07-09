# EXTERNAL EVENT TENANT RESOLUTION ARCHITECTURE
## Diseño Oficial para Eventos Externos

**Status**: ARQUITECTURA ÚNICAMENTE (No implementación)  
**Scope**: Patrón reutilizable para todos los eventos externos del sistema  
**Version**: v1.0 (Proposal)  

---

## FASE 1: ANÁLISIS DE ESTRATEGIAS PARA RESOLVER FIRM_ID

### Estrategia A: Lookup por Transaction (PRIMARY)

**Descripción**:
```
External Event (payment_id o external_reference)
  ↓
lookup: db.transactions.find_one({payment_id: X})
  ↓
Extract: firm_id from transaction document
```

**Ventajas**:
- ✅ Transaction siempre existe antes del webhook (usuario lo creó)
- ✅ Firm_id garantizado en documento
- ✅ Source of truth: pago iniciado por usuario autenticado en contexto de firm
- ✅ No requiere cambios en Mercado Pago
- ✅ Funciona para refunds (payment_id disponible)
- ✅ Funciona para chargebacks (payment_id disponible)

**Riesgos**:
- ⚠️ Si transaction no existe: ¿qué firm_id usar?
- ⚠️ Webhook malicioso con payment_id falso: ¿quién valida que pertenece a esa firma?
- ⚠️ Double lookup: primero sin firm_id, después con
- ⚠️ Race condition: transaction creada pero aún no en DB

**Mitigación**:
- Usar transaction lookup como fuente primaria pero SIEMPRE validar con external signature
- HMAC signature de Mercado Pago ya valida integridad del evento
- Si transaction no existe: Dead Letter Queue (no resolver firm_id)

**Score**: 8/10 (Mejor opción para pagos)

---

### Estrategia B: Lookup por Invoice

**Descripción**:
```
External Event (invoice_id o reference)
  ↓
lookup: db.invoices.find_one({invoice_id: X})
  ↓
Extract: firm_id from invoice
```

**Ventajas**:
- ✅ Invoice también vinculada a firm_id
- ✅ Funciona para invoice payments
- ✅ Separación de concerns (invoice vs transaction)

**Riesgos**:
- ❌ No todos los webhooks tienen invoice_id
- ❌ Requiere mapping adicional invoice → payment
- ❌ Más datos para coordinar
- ❌ No funciona para refunds/chargebacks

**Score**: 4/10 (Demasiado específico, no reutilizable)

---

### Estrategia C: Lookup por Subscription

**Descripción**:
```
External Event (subscription_id)
  ↓
lookup: db.subscriptions.find_one({subscription_id: X})
  ↓
Extract: firm_id from subscription
```

**Ventajas**:
- ✅ Funciona para eventos de suscripción
- ✅ Subscription vinculada a firm desde inicio

**Riesgos**:
- ❌ No funciona para pagos puntuales
- ❌ No funciona para refunds
- ❌ No funciona para chargebacks
- ❌ Solo 1 tipo de evento soportado

**Score**: 3/10 (Muy específico, no escalable)

---

### Estrategia D: Lookup por Metadata / External Reference

**Descripción**:
```
External Event (metadata: {firm_id: "xyz", ...})
  ↓
Extract firm_id directamente del payload
  ↓
NO lookup necesario
```

**Ventajas**:
- ✅ MÁS RÁPIDO (sin lookup)
- ✅ Firm_id en payload (Mercado Pago permite)
- ✅ No depende de BD

**Riesgos**:
- ❌ CRÍTICO: Confiar en metadata del webhook (puede ser spoofed)
- ❌ Cliente puede pasar firm_id falso
- ❌ Si firma HMAC es válida pero firm_id falso: ¿validar contra BD?
- ❌ Requiere cambio en sistema que genera webhooks

**Score**: 2/10 (Riesgo de seguridad demasiado alto)

---

### Estrategia E: Lookup por Organization / Account

**Descripción**:
```
External Event (organization_id o account)
  ↓
lookup: db.organizations.find_one({external_id: X})
  ↓
Extract: firm_id from organization
```

**Ventajas**:
- ✅ Funciona si existe integración organization-level

**Riesgos**:
- ❌ No todos los eventos tienen organization_id
- ❌ Requiere mapping externo → interno
- ❌ Adicional complexity

**Score**: 5/10 (Secundario, no primario)

---

### Estrategia F: Lookup por Payment Intent

**Descripción**:
```
External Event (payment_intent_id)
  ↓
lookup: db.payment_intents.find_one({payment_intent_id: X})
  ↓
Extract: firm_id from intent
```

**Ventajas**:
- ✅ Intents creados por usuario autenticado
- ✅ Firma_id garantizado

**Riesgos**:
- ❌ Requiere tabla payment_intents adicional
- ❌ No todos los eventos llegan con intent_id
- ❌ Mercado Pago no siempre proporciona

**Score**: 6/10 (Posible pero requiere schema adicional)

---

### Estrategia G: Dead Letter Queue (No resolver firm_id)

**Descripción**:
```
External Event
  ↓
¿Puede resolverse firm_id? → NO
  ↓
Enviar a Dead Letter Queue
  ↓
Manual review por admin
```

**Ventajas**:
- ✅ SEGURO: No asume firm_id incorrecto
- ✅ Auditable: Cada evento rechazado registrado
- ✅ Máximo control
- ✅ No pierde eventos (quedan en cola)

**Riesgos**:
- ❌ Requiere monitoreo
- ❌ Requiere intervención manual
- ❌ No es automático

**Score**: 7/10 (Buena para fallbacks, no para path crítico)

---

## FASE 2: ESTRATEGIA OFICIAL ÚNICA

### Decisión Arquitectónica

**ESTRATEGIA PRIMARIA**: Lookup por Transaction (Estrategia A)

**ESTRATEGIA FALLBACK**: Dead Letter Queue (Estrategia G)

### Justificación

1. **Transacción es la fuente de verdad**
   - Usuario autenticado crea transacción en contexto de firm
   - Firm_id es atributo obligatorio
   - Garantizado estar en BD ANTES del webhook

2. **Validación de origen**
   - HMAC signature de Mercado Pago ya valida integridad
   - No es necesario validar nuevamente contra firma falsa
   - External_reference vinculado criptográficamente al evento

3. **Reutilizable para todos los eventos**
   - Pagos: payment_id → transaction
   - Refunds: payment_id → transaction → refund
   - Chargebacks: payment_id → transaction → chargeback
   - Subscriptions: también tienen transaction asociada

4. **Escalable a otros providers**
   - Stripe: invoice/charge → transaction
   - PayPal: transaction_id → transaction
   - Twilio: message_id → puede vincular a case → firm
   - Mismo patrón: hallar el documento de origen con firm_id

### Contrato Oficial

```
RULE 1: SIEMPRE lookup por documento de origen (transaction, invoice, case, etc.)
RULE 2: Si lookup falla → Dead Letter Queue (NO usar default, NO inventar firm_id)
RULE 3: Cada lookup debe incluir validación de integridad
RULE 4: HMAC/Signature debe ser validado ANTES de lookup
RULE 5: Firm_id es el ÚNICO identificador de tenant
RULE 6: Todos los eventos posteriores deben pasar firm_id a repositories
```

---

## FASE 3: COMPONENTE EXTERNALTENANTRESOLVER

### Responsabilidades

```
ExternalTenantResolver:
├─ Input: evento externo (payload completo)
├─ Processing:
│  ├─ 1. Extraer identificador primario (payment_id, external_ref, etc.)
│  ├─ 2. Lookup en BD por documento de origen
│  ├─ 3. Extraer firm_id del documento
│  ├─ 4. Validar integridad (HMAC si aplica)
│  └─ 5. Retornar TenantContext
└─ Output: (firm_id, request_id) o Exception
```

### Entradas (Inputs)

```python
resolve_external_event(
    event_payload: Dict[str, Any],           # Payload completo del webhook
    event_type: str,                          # "payment.approved", "refund.created", etc.
    event_signature: str,                     # HMAC signature para validación
    event_id: str,                            # event_id para idempotencia
    ip_address: str = None                    # Para auditoría
) -> ExternalTenantContext

Donde ExternalTenantContext:
  ├─ firm_id: str
  ├─ source_document_id: str                 # ID de transaction/invoice/case
  ├─ source_collection: str                  # "transactions", "invoices", "cases"
  ├─ request_id: str                         # UUID para tracing
  ├─ event_id: str                           # Event ID de proveedor (para idempotencia)
  ├─ resolved_at: datetime
  ├─ resolution_method: str                  # "transaction_lookup", "invoice_lookup", etc.
  └─ metadata: Dict[str, Any]                # Información adicional
```

### Salidas (Outputs)

**Caso Exitoso**:
```python
ExternalTenantContext(
    firm_id="firm-123",
    source_document_id="tx-456",
    source_collection="transactions",
    request_id="req-789",
    event_id="mp-999",
    resolved_at=datetime.utcnow(),
    resolution_method="transaction_lookup",
    metadata={"payment_id": "pay-xxx", "status": "approved"}
)
```

**Caso Fallido**:
```python
raise ExternalTenantResolutionError(
    event_id="mp-999",
    reason="TRANSACTION_NOT_FOUND",  # o SIGNATURE_VALIDATION_FAILED, AMBIGUOUS_MATCH
    original_exception=None,
    should_retry=False,  # True si es transient (timeout), False si es permanente
    require_manual_review=True
)
```

### Errores (Exceptions)

```python
class ExternalTenantResolutionError(Exception):
    """Base exception"""
    pass

class TransactionNotFoundError(ExternalTenantResolutionError):
    """Transaction lookup falló"""
    HTTP_STATUS = 409  # Conflict - no se puede resolver tenant
    SHOULD_RETRY = False
    REQUIRE_DLQ = True

class SignatureValidationError(ExternalTenantResolutionError):
    """HMAC signature no válida"""
    HTTP_STATUS = 401  # Unauthorized - evento rechazado
    SHOULD_RETRY = False
    REQUIRE_DLQ = True

class AmbiguousResolutionError(ExternalTenantResolutionError):
    """Multiple matches - no se puede determinar firm_id único"""
    HTTP_STATUS = 409  # Conflict
    SHOULD_RETRY = False
    REQUIRE_DLQ = True

class TemporaryResolutionError(ExternalTenantResolutionError):
    """Database timeout, transient error"""
    HTTP_STATUS = 503  # Service Unavailable
    SHOULD_RETRY = True
    REQUIRE_DLQ = False  # Retry internally, don't send to DLQ
```

### Validaciones

```
VALIDACIONES OBLIGATORIAS:

1. HMAC Signature Validation
   ├─ Verificar firma del evento (si proveedor lo soporta)
   └─ Si inválida → SignatureValidationError

2. Event ID Idempotence
   ├─ Verificar que event_id no fue procesado antes
   └─ Si duplicado → Log como "DUPLICATE", retornar cached result

3. Source Document Lookup
   ├─ Find by primary key (payment_id, invoice_id, etc.)
   └─ Si no encuentra → TransactionNotFoundError

4. Firm ID Extraction
   ├─ Verificar que firm_id existe en documento
   └─ Si falta → SystemError (documento corrupto)

5. Unambiguous Match
   ├─ Verificar que lookup retorna EXACTLY 1 documento
   └─ Si multiple matches → AmbiguousResolutionError

6. Timestamp Validation (Opcional)
   ├─ Verificar que evento no es demasiado viejo
   └─ Si >24h → Log warning, procesar igual
```

### Seguridad

```
PRINCIPIOS DE SEGURIDAD:

1. NO Trust Metadata
   ├─ Nunca extraer firm_id directamente del payload
   └─ SIEMPRE lookup en BD

2. HMAC-First
   ├─ Validar firma ANTES de cualquier lookup
   └─ Si inválida, rechazar inmediatamente

3. Fail Secure
   ├─ Si hay duda sobre firm_id → Dead Letter Queue
   └─ Mejor perder evento que procesar con firm_id incorrecto

4. Immutable Resolution
   ├─ Una vez resuelto firm_id, no puede cambiar
   └─ Congelarlo en TenantContext

5. No Lateral Movement
   ├─ Validar que request_ip (si viene) es válida para proveedor
   └─ (Opcional, pero recomendado para IP spoofing detection)
```

### Auditoría

```
AUDITORÍA OBLIGATORIA:

Cada resolución debe loguear:
├─ resolution_timestamp
├─ event_id
├─ event_type
├─ resolved_firm_id
├─ resolution_method (transaction_lookup, invoice_lookup, etc.)
├─ lookup_result (found, not_found, ambiguous)
├─ signature_validation (valid, invalid, skipped)
├─ request_id (para correlacionar con payload real)
└─ ip_address (si disponible)

Errores deben loguear adicional:
├─ error_type (TRANSACTION_NOT_FOUND, SIGNATURE_VALIDATION_FAILED, etc.)
├─ should_retry (true/false)
├─ require_manual_review (true/false)
└─ original_exception (stack trace si aplica)
```

---

## FASE 4: FLUJO OFICIAL PASO A PASO

```
┌─────────────────────────────────────────────────────────────┐
│                 EXTERNAL EVENT ARRIVES                      │
│              (POST /payment/webhook, etc.)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│            PHASE 1: BASIC VALIDATION                        │
│  ├─ Extract event_id, event_type from payload             │
│  ├─ Validate structure (not null, valid types)            │
│  └─ Return 200 OK immediately (acuso de recibo)           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│   PHASE 2: SIGNATURE VALIDATION (Mercado Pago, etc.)       │
│  ├─ Extract signature from headers                         │
│  ├─ Extract HMAC secret from environment                   │
│  ├─ Compute expected signature                             │
│  ├─ Compare (timing-safe)                                  │
│  └─ On failure: Log + reject, continue async              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│   PHASE 3: TENANT RESOLUTION                               │
│   (ExternalTenantResolver)                                 │
│  ├─ extract_primary_identifier(payload) → payment_id      │
│  ├─ lookup_source_document(db, payment_id)                │
│  │  ├─ Query: db.transactions.find_one({payment_id})      │
│  │  ├─ If found: Continue                                 │
│  │  └─ If NOT found: ExternalTenantResolutionError        │
│  ├─ extract_firm_id(document) → "firm-123"               │
│  ├─ validate_HMAC(event_payload, signature)              │
│  ├─ check_idempotence(event_id) → is_duplicate?          │
│  └─ Create ExternalTenantContext                          │
│                                                            │
│  ╔══════════════════════════════════════════════════════╗  │
│  ║ IF Error in Resolution:                             ║  │
│  ║  └─ raise ExternalTenantResolutionError              ║  │
│  ║     ├─ Log with event_id, error_type                ║  │
│  ║     ├─ Send to Dead Letter Queue                     ║  │
│  ║     └─ Return 409 (Conflict) or 401 (Invalid Sig)   ║  │
│  ╚══════════════════════════════════════════════════════╝  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│   PHASE 4: TENANT CONTEXT CREATION                         │
│  ├─ Create TenantContext(frozen)                          │
│  │  ├─ firm_id (from ExternalTenantContext)              │
│  │  ├─ user_id = "webhook"                               │
│  │  ├─ user_email = "webhook@system"                     │
│  │  ├─ user_role = "system"                              │
│  │  ├─ request_id (from ExternalTenantContext)           │
│  │  ├─ ip_address (from http request)                    │
│  │  └─ timestamp = now()                                 │
│  └─ Attach to request (NOT TenantKernel, but similar)    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│   PHASE 5: IDEMPOTENCE CHECK                               │
│  ├─ Check db.webhook_events({event_id})                   │
│  ├─ If exists: Log "DUPLICATE" + return cached result     │
│  └─ If new: Proceed to processing                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│   PHASE 6: EVENT PROCESSING                                │
│  ├─ Route to appropriate handler (payment, refund, etc.)   │
│  ├─ Pass TenantContext to handler                         │
│  ├─ Handler calls Repository methods:                     │
│  │  ├─ transaction_repo.find(firm_id, payment_id)        │
│  │  ├─ transaction_repo.update(firm_id, ...)             │
│  │  ├─ audit_repo.log_action(firm_id, ...)               │
│  │  └─ refund_repo.create(firm_id, ...)                  │
│  └─ All DB operations are firm-scoped                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│   PHASE 7: AUDIT LOGGING                                   │
│  ├─ Record webhook_event (for idempotence)                │
│  ├─ Record webhook_logs (for audit)                       │
│  ├─ Record audit_logs (for business events)               │
│  └─ ALL with firm_id + request_id                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│   RETURN 200 OK (Already sent in Phase 1)                  │
│   Processing continues asynchronously                       │
└─────────────────────────────────────────────────────────────┘
```

---

## FASE 5: CUANDO NO PUEDE RESOLVERSE FIRM_ID

### Matriz de Decisión

| Scenario | Error Type | Resolution | HTTP Status | Action |
|----------|-----------|-----------|-----------|--------|
| Transaction not found | TransactionNotFoundError | Cannot resolve firm_id | 409 Conflict | Dead Letter Queue |
| Invalid HMAC signature | SignatureValidationError | Event rejected | 401 Unauthorized | Dead Letter Queue + Alert |
| Multiple matching docs | AmbiguousResolutionError | Ambiguous firm_id | 409 Conflict | Dead Letter Queue + Admin Alert |
| DB Timeout | TemporaryResolutionError | Transient error | 503 Service Unavailable | Retry (internal queue) |
| Missing firm_id in doc | SystemError | Data corruption | 500 Internal Error | Dead Letter Queue + Critical Alert |
| Duplicate event_id | DuplicateEventError | OK (idempotent) | 200 OK | Return cached result |

### Dead Letter Queue Strategy

```
Dead Letter Queue (DLQ):
├─ Purpose: Manual review of unresolvable events
├─ Storage: Separate collection (webhook_dlq)
├─ Fields:
│  ├─ event_id
│  ├─ event_type
│  ├─ error_type (TransactionNotFoundError, etc.)
│  ├─ payload (full webhook payload)
│  ├─ signature (for re-validation)
│  ├─ attempted_at
│  ├─ retry_count
│  ├─ last_error (exception message)
│  └─ status (pending, reviewed, resolved, dismissed)
├─ Monitoring:
│  ├─ Alert if DLQ has events older than 1 hour
│  ├─ Alert if retry_count > 3
│  └─ Dashboard for manual review
└─ Resolution:
   ├─ Admin reviews event
   ├─ Determines correct firm_id (if possible)
   ├─ Manually triggers processing OR
   ├─ Dismisses event (invalid/duplicate)
   └─ Logs decision in audit trail
```

### NO Fallback Behavior

```
❌ PROHIBIDO:

- use_default_firm_id("default") ← Security hole
- use_first_firm_found() ← Arbitrary isolation violation
- skip_tenant_validation() ← Defeats entire system
- log_and_continue_without_firm_id() ← Silently processes cross-tenant
- assume_firm_from_payment_method() ← Unverified assumption

✅ CORRECTO:

- Reject event (409 / 401)
- Send to Dead Letter Queue
- Alert admin for manual review
- Log everything with event_id
- Maintain audit trail
```

---

## FASE 6: CONTRATO PARA TODOS LOS WEBHOOKS FUTUROS

### Standard Webhook Processing Flow

Cualquier nuevo webhook (Stripe, PayPal, Twilio, etc.) DEBE seguir:

```python
@router.post("/webhook/{provider}")
async def webhook_handler(
    request: Request,
    provider: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    STEP 1: Parse payload
    """
    try:
        body = await request.json()
        event_id = body.get("id")
        event_type = body.get("type")
    except:
        return {"received": False}
    
    """
    STEP 2: Validate signature
    """
    signature = request.headers.get("x-signature", "")
    if not await validate_signature(body, signature, provider):
        await log_webhook(db, event_id, event_type, "invalid_signature", 401)
        return {"received": False, "error": "Invalid signature"}
    
    """
    STEP 3: Resolve tenant using ExternalTenantResolver
    """
    try:
        external_tenant_ctx = await ExternalTenantResolver.resolve(
            event_payload=body,
            event_type=event_type,
            event_signature=signature,
            event_id=event_id,
            provider=provider,
            ip_address=request.client.host
        )
        firm_id = external_tenant_ctx.firm_id
        request_id = external_tenant_ctx.request_id
    except ExternalTenantResolutionError as e:
        await send_to_dlq(db, event_id, event_type, body, str(e))
        return {"received": False, "error": str(e.reason)}
    
    """
    STEP 4: Check idempotence
    """
    if await is_event_duplicate(db, firm_id, event_id):
        return {"received": True, "status": "duplicate"}
    
    """
    STEP 5: Process event with firm_id in context
    """
    try:
        handler = get_handler(provider, event_type)
        await handler(
            db=db,
            event_id=event_id,
            event_type=event_type,
            event_data=body.get("data", {}),
            firm_id=firm_id,  # ← MANDATORY
            request_id=request_id  # ← MANDATORY
        )
    except Exception as e:
        await audit_repo.log_action(
            firm_id=firm_id,
            action=f"webhook_error_{provider}",
            user_id="system",
            details={"error": str(e), "event_id": event_id},
            request_id=request_id
        )
        raise
    
    """
    STEP 6: Record webhook event (idempotence)
    """
    await webhook_repo.mark_processed(firm_id, event_id)
    
    """
    RETURN immediately (processing done asynchronously)
    """
    return {"received": True, "event_id": event_id}
```

### Developer Rules

```
OBLIGATORIO para todo nuevo webhook:

1. NO extraer firm_id del payload
2. SIEMPRE usar ExternalTenantResolver
3. SIEMPRE pasar firm_id a handlers
4. SIEMPRE pasar request_id a repositories
5. SIEMPRE validar HMAC signature
6. SIEMPRE check idempotence
7. NO asumir tenant
8. NO usar fallback firm_id
9. NO procesar sin firm_id resuelto
10. Documentar el resolution_method (transaction lookup, etc.)
```

---

## FASE 7: RESPONSIBILITY MATRIX

### ¿Quién es Owner del Tenant?

| Component | Role | Responsibility |
|-----------|------|-----------------|
| **ExternalTenantResolver** | **Owner** | ✅ Resolve firm_id from external event |
| | | ✅ Validate signature |
| | | ✅ Handle resolution errors |
| | | ✅ Route to Dead Letter Queue |
| **TenantContext** | **Carrier** | ✅ Hold firm_id immutably |
| | | ✅ Provide to all layers |
| | | ❌ Resolve firm_id (not its job) |
| **TransactionRepository** | **Source** | ✅ Provide lookup method |
| | | ✅ Return document with firm_id |
| | | ❌ Own tenant enforcement |
| **Handler (process_payment)** | **Consumer** | ✅ Use firm_id from context |
| | | ✅ Pass firm_id to all repositories |
| | | ❌ Resolve or validate firm_id |
| **Middleware/Kernel** | **Enforcer** | ✅ Verify all DB ops are firm-scoped |
| | | ✅ Prevent bypass |
| | | ❌ Resolve tenant in external events |

### Key Distinction

```
INTERNAL REQUESTS (with JWT):
  TenantKernel → Resolves firm_id from JWT
             → Creates immutable TenantContext
             → Enforces in repositories

EXTERNAL EVENTS (no JWT):
  ExternalTenantResolver → Resolves firm_id from source document
                        → Creates ExternalTenantContext
                        → Passed to handler
                        → Handler passes to repositories
                        → Repositories enforce isolation
```

---

## FASE 8: EXTERNAL EVENT TENANT RESOLUTION STANDARD v1.0

### Official Standard for Punto Cero System OS

#### 1. SCOPE

This standard defines how to safely resolve `firm_id` for external, unauthenticated events from:
- Payment providers (Mercado Pago, Stripe, PayPal)
- Communication services (Twilio, WhatsApp, SendGrid)
- Background jobs (Cron, Workers, Schedulers)
- Event queues (RabbitMQ, Kafka)
- Async webhooks

#### 2. PRINCIPLES

```
PRINCIPLE 1: Primary Source of Truth
├─ firm_id is resolved from source document (transaction, invoice, case)
└─ Never extracted directly from external payload

PRINCIPLE 2: Fail Secure
├─ If firm_id cannot be resolved → Dead Letter Queue
└─ Better to lose event than process with wrong tenant

PRINCIPLE 3: Signature Validation First
├─ Validate HMAC signature BEFORE any lookup
└─ Prevent tampering and spoofing

PRINCIPLE 4: Immutable Context
├─ Once firm_id is resolved, it cannot change
└─ Frozen in context for duration of request

PRINCIPLE 5: Full Audit Trail
├─ Every resolution attempt must be logged
├─ Success, failure, errors all recorded
└─ Tracing via event_id and request_id

PRINCIPLE 6: No Lateral Movement
├─ Event can only update documents in its own firm
└─ Repository isolation is mandatory
```

#### 3. REQUIRED COMPONENTS

**ExternalTenantResolver**
- Responsibility: Resolve firm_id from external event
- Input: Event payload + signature + metadata
- Output: ExternalTenantContext (firm_id + request_id) or Exception
- Must be used for ALL external events

**ExternalTenantContext**
- Immutable container for resolved tenant
- Fields: firm_id, source_document_id, request_id, event_id, resolved_at
- Passed to all subsequent processing

**Dead Letter Queue**
- Destination for unresolvable events
- Manual review required
- Alert mechanism for stale events

#### 4. RESOLUTION METHOD MATRIX

| Provider | Primary Lookup | Secondary | Validation |
|----------|---------------|-----------|------------|
| Mercado Pago | `transactions.find_one({payment_id})` | external_ref | HMAC signature |
| Stripe | `db.stripe_events.find({stripe_event_id})` → linked transaction | amount | Webhook signature |
| PayPal | `transactions.find_one({paypal_tx_id})` | email | Webhook ID verification |
| Twilio | `cases.find_one({twilio_sid})` | phone | Auth token |
| Cron Job | Iterate by `firm_id` | N/A | System-internal |
| Kafka Event | Payload `firm_id` (VALIDATED against lookup) | source doc | Event source |

#### 5. ERROR HANDLING

| Error | HTTP Status | Action |
|-------|------------|--------|
| Transaction not found | 409 Conflict | DLQ + Manual Review |
| Invalid signature | 401 Unauthorized | Reject + DLQ |
| Ambiguous resolution | 409 Conflict | DLQ + Alert |
| Database timeout | 503 Service Unavailable | Retry (3x) |
| Data corruption | 500 Internal Error | DLQ + Critical Alert |

#### 6. IMPLEMENTATION CHECKLIST

For every external event integration:

```
☐ Define primary lookup method
☐ Implement signature validation
☐ Create ExternalTenantResolver adapter
☐ Add to resolution_method_matrix
☐ Implement error handling
☐ Set up DLQ monitoring
☐ Write tests (success + failure cases)
☐ Document in this standard
☐ Train team on resolution method
☐ Set up alerts for unresolvable events
☐ Verify all repositories receive firm_id
☐ Audit trail verified in logs
```

#### 7. SECURITY CHECKLIST

```
☐ NO trust external firm_id claim
☐ ALWAYS validate signature first
☐ ALWAYS lookup source document
☐ ALWAYS freeze firm_id in context
☐ ALWAYS pass firm_id to repositories
☐ ALWAYS check for idempotence
☐ NO fallback firm_id
☐ NO default tenant
☐ NO assumption-based resolution
☐ ALERT on any resolution errors
```

#### 8. MONITORING

```
Metrics to track:
├─ % Events resolved successfully
├─ % Events sent to DLQ
├─ Time to resolve (avg, p95, p99)
├─ Error types (signature, not found, ambiguous)
├─ DLQ aging (events waiting >1h)
└─ Manual reviews completed

Alerts to configure:
├─ DLQ has events older than 1 hour
├─ Resolution failure rate > 0.1%
├─ Signature validation failures > 1%
└─ Duplicate event rate > 2%
```

#### 9. FUTURE PROVIDERS

When adding new external provider:

1. Identify source document (transaction, invoice, case, etc.)
2. Add to resolution_method_matrix
3. Implement ExternalTenantResolver adapter
4. Register error handling
5. Set up monitoring
6. Document in this standard
7. Get architecture review

---

## CONCLUSION

This standard ensures that Punto Cero System OS maintains strict multi-tenant isolation even for external, unauthenticated events.

**Key Achievement**:
- All external events follow ONE standard pattern
- firm_id is always resolved, never assumed
- Failed resolutions are always visible (DLQ)
- No silent cross-tenant operations
- Full audit trail for compliance

**No developer should ever resolve tenant manually in external events.**
