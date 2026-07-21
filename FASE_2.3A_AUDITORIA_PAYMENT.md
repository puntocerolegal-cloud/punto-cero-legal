# FASE 2.3A — AUDITORÍA COMPLETA DEL MOTOR DE PAYMENT
## Análisis Técnico para Integración CRM → Payment

**Fecha:** 2026-07-21  
**Objetivo:** Mapeo completo del sistema de pagos antes de integrar con CRM  
**Modo:** Auditoría exclusiva - NO se implementan cambios

---

## 1. INVENTARIO COMPLETO DE ARCHIVOS

### Archivos Principales

| Archivo | Líneas | Responsabilidad | Estado |
|---------|--------|-----------------|--------|
| `backend/routes/payment.py` | 1527 | Router principal de pagos | ✅ Activo |
| `backend/services/webhook_handler.py` | 565 | Controlador de webhooks MP | ✅ Activo |
| `backend/services/payment_provider_service.py` | - | Factory de proveedores de pago | ✅ Activo |
| `backend/services/subscription_service.py` | - | Gestión de suscripciones | ✅ Activo |
| `backend/services/billing_service.py` | - | Gestión de facturación | ✅ Activo |
| `backend/services/trial_service.py` | - | Gestión de trials | ✅ Activo |

### Archivos de Modelos

| Archivo | Clases | Responsabilidad |
|---------|--------|-----------------|
| `backend/models/billing.py` | InvoiceCreate, InvoiceUpdate, Invoice | Modelos de facturación |
| `backend/models/subscription.py` | SubscriptionBase, SubscriptionCreate, Subscription | Modelos de suscripción |
| `backend/models/os_subscription.py` | SubscriptionCreate, SubscriptionUpdate, Subscription | Modelos OS suscripción |
| `backend/models/invoice.py` | InvoiceBase, InvoiceCreate, Invoice, InvoiceUpdate | Modelos de invoice |
| `backend/models/enterprise_core.py` | SubscriptionPlan (Enum) | Catálogo de planes |

### Archivos de Rutas Relacionadas

| Archivo | Responsabilidad |
|---------|-----------------|
| `backend/routes/billing.py` | CRUD de facturas |
| `backend/routes/billing_admin.py` | Administración de billing |
| `backend/routes/subscriptions.py` | CRUD de suscripciones |
| `backend/routes/commissions.py` | Procesamiento de pagos de comisiones |
| `backend/routes/admin_master.py` | Acciones maestras de suscripción |
| `backend/routes/financial.py` | Gestión financiera |

---

## 2. MAPA COMPLETO DE FUNCIONES

### backend/routes/payment.py

| Función | Línea | Responsabilidad | Quién la llama | Devuelve | Colecciones | Servicios |
|---------|-------|-----------------|----------------|----------|-------------|-----------|
| `detect_gateway()` | 501 | Detecta pasarela según país | Frontend | `{gateway, country_code, supported}` | - | - |
| `get_payment_methods()` | 567 | Métodos de pago disponibles | Frontend | `{country, flag, gateway, methods}` | - | - |
| `upload_payment_receipt()` | 585 | Recibe comprobante manual | Frontend | `{ok, receipt_id, status}` | `receipts`, `users`, `notifications` | - |
| `get_catalog()` | 661 | Catálogo de planes localizado | Frontend | `{locale, plans}` | - | - |
| `get_my_plan()` | 670 | Plan contratado por usuario | Frontend | `{has_plan, plan_id, subscription_status, ...}` | - | - |
| `get_plans()` | 719 | Precios localizados | Frontend | `{country, currency, plans}` | - | - |
| `init_payment()` | 755 | Inicializa pago (checkout) | Frontend | `PaymentInitResponse` | `transactions` | Mercado Pago API |
| `confirm_payment()` | 831 | Confirma pago (webhook simulado) | Admin/Testing | `{message, payment_id, status}` | `transactions` | `_apply_payment_success()` |
| `mp_webhook()` | 852 | Webhook oficial MP | Mercado Pago | `{received, event_id, ...}` | `webhook_events`, `webhook_logs`, `transactions`, `users`, `notifications` | `webhook_handler` |
| `get_subscription_status()` | 1089 | Estado de suscripción | Frontend | `SubscriptionStatusResponse` | `transactions` | - |
| `renew_subscription()` | 1142 | Renueva suscripción | Frontend | `{payment_id, checkout_url, ...}` | `transactions` | Mercado Pago API |
| `change_plan()` | 1235 | Cambia plan con prorrateo | Frontend | `{message, new_plan_id, ...}` | `transactions`, `users` | Mercado Pago API |
| `cancel_subscription()` | 1384 | Cancela suscripción | Frontend | `{message, plan_id, status}` | `users`, `audit_logs`, `notifications` | - |
| `reactivate_subscription()` | 1440 | Reactiva suscripción | Frontend | `{payment_id, checkout_url, ...}` | `transactions`, `audit_logs` | Mercado Pago API |

### backend/services/webhook_handler.py

| Función | Línea | Responsabilidad | Quién la llama | Devuelve | Colecciones |
|---------|-------|-----------------|----------------|----------|-------------|
| `validate_hmac_signature()` | 55 | Valida firma HMAC de MP | `mp_webhook()` | `bool` | - |
| `is_event_duplicate()` | 104 | Verifica idempotencia | `mp_webhook()` | `bool` | `webhook_events` |
| `record_webhook_event()` | 110 | Registra evento para idempotencia | `mp_webhook()` | `str` (ID) | `webhook_events` |
| `log_webhook()` | 136 | Registra en auditoría | `mp_webhook()` | `str` (ID) | `webhook_logs` |
| `process_payment_event()` | 202 | Procesa eventos de pago | `mp_webhook()` | `bool` | `transactions`, `audit_logs` |
| `process_subscription_event()` | 281 | Procesa eventos de suscripción | `mp_webhook()` | `bool` | `users`, `audit_logs` |
| `process_refund_event()` | 359 | Procesa reembolsos | `mp_webhook()` | `bool` | `refunds`, `transactions`, `audit_logs` |
| `process_chargeback_event()` | 416 | Procesa contracargos | `mp_webhook()` | `bool` | `chargebacks`, `transactions`, `notifications`, `audit_logs` |
| `_apply_payment_success()` | 478 | Activa suscripción + referidos | `process_payment_event()`, `confirm_payment()` | `bool` | `transactions`, `users` |
| `_notify_payment_failure()` | 529 | Notifica fallo de pago | `process_payment_event()` | `None` | `notifications` |

---

## 3. FLUJO ACTUAL COMPLETO

### Flujo 1: Compra Inicial (Checkout)

```
Usuario (Frontend)
    ↓
1. POST /payment/init (payment.py:755)
   - Recibe: plan_id, billing_cycle, country, user_email, user_name
   - Crea transacción en db.transactions (status: "pending")
   - Si Mercado Pago: crea preferencia real en MP API
   - Si PayPal: genera checkout_url simulada
    ↓
2. Retorna: PaymentInitResponse
   - checkout_url (redirige a MP o PayPal)
   - payment_id (PCL-XXXXXXXXXXXX)
    ↓
3. Usuario completa pago en Mercado Pago/PayPal
    ↓
4. Mercado Pago envía webhook a /payment/webhook (payment.py:852)
   - Validación HMAC (webhook_handler.py:55)
   - Verificación idempotencia (webhook_handler.py:104)
   - Procesamiento evento (webhook_handler.py:202)
    ↓
5. process_payment_event() (webhook_handler.py:202)
   - Actualiza transacción a "paid"
   - Llama a _apply_payment_success()
    ↓
6. _apply_payment_success() (webhook_handler.py:478)
   - Marca transacción como "paid"
   - Actualiza usuario: plan_id, subscription_status="active"
   - Aplica lógica de referidos (si existe referral_code)
    ↓
7. Notificación a admin (payment.py:448-458)
   - Crea notificación en db.notifications
    ↓
8. Fin del flujo
```

### Flujo 2: Renovación

```
Usuario autenticado
    ↓
1. POST /payment/renew (payment.py:1142)
   - Verifica que tenga plan_id
   - Verifica que subscription_status sea "expired" o "trial"
   - Crea nueva transacción (type: "renewal")
   - Genera checkout_url
    ↓
2. Usuario completa pago
    ↓
3. Webhook MP → process_payment_event() → _apply_payment_success()
    ↓
4. Usuario actualizado: plan_id, subscription_status="active"
```

### Flujo 3: Cambio de Plan

```
Usuario autenticado (plan activo)
    ↓
1. POST /payment/change-plan (payment.py:1235)
   - Verifica subscription_status="active"
   - Calcula prorrateo
   - Si precio igual: cambia plan directamente
   - Si precio mayor: crea transacción de diferencia
   - Si precio menor: crea crédito (account_credit)
    ↓
2. Si requiere pago:
   - Usuario completa checkout
   - Webhook → _apply_payment_success()
   - Plan actualizado
```

### Flujo 4: Cancelación

```
Usuario autenticado (plan activo)
    ↓
1. POST /payment/cancel (payment.py:1384)
   - Verifica subscription_status="active"
   - Actualiza usuario: subscription_status="cancelled", cancelled_at
   - Registra en audit_logs
   - Notifica admin
    ↓
2. Fin (no requiere pago)
```

### Flujo 5: Reactivación

```
Usuario autenticado (plan cancelado)
    ↓
1. POST /payment/reactivate (payment.py:1440)
   - Verifica subscription_status="cancelled"
   - Crea transacción de reactivación
   - Genera checkout_url
    ↓
2. Usuario completa pago
    ↓
3. Webhook → _apply_payment_success()
    ↓
4. Usuario actualizado: subscription_status="active"
```

### Flujo 6: Comprobante Manual

```
Usuario autenticado
    ↓
1. POST /payment/receipt (payment.py:585)
   - Recibe archivo (imagen/PDF)
   - Almacena en db.receipts (base64)
   - Actualiza usuario: subscription_status="pending_verification"
   - Crea notificación en db.notifications (admin)
    ↓
2. Admin verifica comprobante (manual)
    ↓
3. Admin actualiza estado (manual)
    ↓
4. Fin
```

---

## 4. PROVEEDORES DE PAGO

### Mercado Pago

**Archivos:**
- `backend/routes/payment.py` (líneas 327-334, 360-411, 414-433)
- `backend/services/webhook_handler.py` (líneas 1-565)

**Configuración:**
```python
MP_ACCESS_TOKEN = os.environ.get("MP_ACCESS_TOKEN", "")
MP_PUBLIC_KEY = os.environ.get("MP_PUBLIC_KEY", "")
MP_API = "https://api.mercadopago.com"
MP_SANDBOX = MP_ACCESS_TOKEN.startswith("TEST-")
```

**Países soportados:**
```python
MERCADO_PAGO_COUNTRIES = {
    "Colombia": "CO", "México": "MX", "Argentina": "AR", "Brasil": "BR",
    "Chile": "CL", "Perú": "PE", "Uruguay": "UY"
}
```

**Funciones:**
- `_create_mp_preference()` - Crea preferencia de pago real
- `_fetch_mp_payment()` - Consulta estado de pago en MP
- `mp_webhook()` - Procesa webhooks de MP

**Estado:** ✅ ACTIVO (usa credenciales reales)

**Eventos soportados:**
- payment.created
- payment.updated
- payment.approved
- payment.rejected
- payment.cancelled
- payment.refunded
- merchant_order.opened
- merchant_order.closed
- merchant_order.expired
- subscription.created
- subscription.updated
- subscription.cancelled
- subscription.paused
- subscription.resumed
- subscription.expired
- invoice.created
- invoice.updated
- invoice.paid
- invoice.cancelled
- refund.created
- refund.updated
- chargeback.created
- chargeback.resolved

### PayPal

**Archivos:**
- `backend/routes/payment.py` (líneas 298-302, 791, 1201, 1335, 1488)

**Configuración:**
```python
PAYPAL_COUNTRIES = {
    "Estados Unidos": "US", "España": "ES", "Venezuela": "VE", "Ecuador": "EC",
    "Bolivia": "BO", "Paraguay": "PY", "Costa Rica": "CR", "Panamá": "PA",
    "República Dominicana": "DO", "Guatemala": "GT", "El Salvador": "SV"
}
```

**Funciones:**
- Genera checkout_url simulada (no implementa API real de PayPal)

**Estado:** ⚠️ PARCIAL (solo checkout_url simulada, no integración real)

### Otros Proveedores

**Wompi, ePayco, Bold, Stripe:**
- ❌ NO EXISTEN
- No hay archivos, no hay código, no hay referencias

---

## 5. MODELOS

### Transaction (implícito en payment.py)

**Colección:** `db.transactions`

**Campos principales:**
```python
{
    "payment_id": str,              # PCL-XXXXXXXXXXXX o RENEW-XXXXXXXXXXXX
    "user_email": str,
    "user_name": str,
    "plan_id": str,                 # esencial, profesional, elite, ilimitado
    "billing_cycle": str,           # monthly, annual
    "amount_cop": float,            # Monto en COP
    "amount_local": float,          # Monto en moneda local
    "currency": str,                # COP, USD, MXN, etc.
    "country": str,
    "gateway": str,                 # mercado_pago, paypal
    "status": str,                  # pending, paid, rejected, cancelled, refunded
    "checkout_url": str,
    "preference_id": str,           # ID de preferencia MP
    "referral_code": str,           # Código de referido
    "type": str,                    # initial, renewal, plan_change, reactivation
    "old_plan_id": str,             # Para cambios de plan
    "proration_days": int,          # Días de prorrateo
    "mp_payment_id": str,           # ID de pago en MP
    "mp_subscription_id": str,      # ID de suscripción en MP
    "status_at_mp": str,            # Estado en MP
    "paid_at": datetime,
    "created_at": datetime,
    "expires_at": datetime,
    "reward_applied": bool,         # Si se aplicó recompensa de referido
    "referrer_id": str,             # ID del referidor
}
```

**Relaciones:**
- `user_email` → `users.email`
- `payment_id` → Referenciado en webhooks

### Receipt (implícito en payment.py)

**Colección:** `db.receipts`

**Campos principales:**
```python
{
    "user_id": str,
    "user_email": str,
    "user_name": str,
    "plan_id": str,
    "plan_name": str,
    "billing_cycle": str,
    "method": str,                  # Método de pago manual
    "country": str,
    "amount": str,
    "filename": str,
    "content_type": str,
    "size_bytes": int,
    "content_b64": str,             # Archivo en base64
    "status": str,                  # pending_verification, approved, rejected
    "created_at": datetime,
}
```

### Webhook Events (webhook_handler.py)

**Colección:** `db.webhook_events`

**Campos principales:**
```python
{
    "event_id": str,
    "type": str,
    "action": str,
    "processed": bool,
    "processed_at": datetime,
    "retries": int,
    "payload_hash": str,
    "error": str,
    "created_at": datetime,
}
```

**Propósito:** Idempotencia - evitar procesar el mismo evento dos veces

### Webhook Logs (webhook_handler.py)

**Colección:** `db.webhook_logs`

**Campos principales:**
```python
{
    "event_id": str,
    "type": str,
    "action": str,
    "headers": dict,
    "payload": dict,
    "result_status": str,           # success, duplicate, invalid_signature, error
    "execution_time_ms": float,
    "ip_address": str,
    "user_agent": str,
    "error": str,
    "created_at": datetime,
}
```

**Propósito:** Auditoría completa de webhooks

### Invoice (models/billing.py, models/invoice.py)

**Colección:** `db.invoices`

**Campos principales:**
```python
{
    "invoice_number": str,
    "clientName": str,
    "amount": float,
    "status": str,                  # draft, issued, sent, paid, overdue, cancelled
    "due_date": datetime,
    "paymentMethod": str,
    "lawyer_id": str,
    "case_id": str,
    "organization_id": str,
    "country": str,
    "description": str,
    "is_demo": bool,
    "created_at": datetime,
    "updated_at": datetime,
}
```

### Subscription (models/subscription.py, models/os_subscription.py)

**Colección:** `db.os_subscriptions` (Firm OS) o `db.subscriptions` (Lawyer OS)

**Campos principales:**
```python
{
    "companyName": str,
    "vertical": str,
    "plan": str,
    "status": str,                  # trial, active, inactive, frozen, expired
    "billingCycle": str,            # monthly, annual
    "autoRenew": bool,
    "start_date": date,
    "end_date": date,
    "created_at": datetime,
    "updated_at": datetime,
}
```

### Refund (webhook_handler.py)

**Colección:** `db.refunds`

**Campos principales:**
```python
{
    "refund_id": str,
    "payment_id": str,
    "transaction_id": str,
    "amount": float,
    "status": str,
    "user_email": str,
    "created_at": datetime,
}
```

### Chargeback (webhook_handler.py)

**Colección:** `db.chargebacks`

**Campos principales:**
```python
{
    "chargeback_id": str,
    "payment_id": str,
    "status": str,
    "reason": str,
    "amount": float,
    "created_at": datetime,
}
```

---

## 6. SERVICIOS

### PaymentProviderService

**Archivo:** `backend/services/payment_provider_service.py`

**Clases:**
- `PaymentProviderBase` (ABC) - Clase base abstracta
- `PaymentProviderFactory` - Factory para instanciar proveedores

**Estado:** ✅ Existe pero no se usa en payment.py (todo está en el router)

**Funciones:** No analizadas en detalle (no se encontró en búsqueda)

### SubscriptionService

**Archivo:** `backend/services/subscription_service.py`

**Funciones principales:**
- `_tenant_filter()` - Filtro de tenant
- `_monthly_value()` - Calcula valor mensual
- `CYCLE_TO_MONTHLY` - Mapeo de ciclos a meses
- `list_subscriptions()` - Lista suscripciones
- `get_subscription()` - Obtiene suscripción
- `create_subscription()` - Crea suscripción
- `update_subscription()` - Actualiza suscripción
- `delete_subscription()` - Elimina suscripción
- `renew_subscription()` - Renueva suscripción

**Estado:** ✅ Activo (usado por routes/subscriptions.py)

### BillingService

**Archivo:** `backend/services/billing_service.py`

**Clase:** `BillingService`

**Funciones principales:**
- `_tenant_filter()` - Filtro de tenant
- `_sum()` - Suma campos
- `RECEIVABLE_STATES` - Estados de cobranza
- `get_invoices()` - Obtiene facturas
- `create_invoice()` - Crea factura
- `update_invoice()` - Actualiza factura
- `delete_invoice()` - Elimina factura
- `pay_invoice()` - Marca factura como pagada

**Estado:** ✅ Activo (usado por routes/billing.py)

### TrialService

**Archivo:** `backend/services/trial_service.py`

**Funciones principales:**
- `check_and_expire_trials()` - Expira trials vencidos
- `get_trial_summary_by_status()` - Resumen de trials
- `calculate_trial_remaining_days()` - Calcula días restantes
- `is_trial_active()` - Verifica si trial está activo

**Estado:** ✅ Activo (usado por routes/firms.py, cron_jobs.py)

### WebhookHandler

**Archivo:** `backend/services/webhook_handler.py`

**Funciones principales:**
- `validate_hmac_signature()` - Valida firma HMAC
- `is_event_duplicate()` - Verifica idempotencia
- `record_webhook_event()` - Registra evento
- `log_webhook()` - Registra en auditoría
- `process_payment_event()` - Procesa pagos
- `process_subscription_event()` - Procesa suscripciones
- `process_refund_event()` - Procesa reembolsos
- `process_chargeback_event()` - Procesa contracargos
- `_apply_payment_success()` - Activa suscripción
- `_notify_payment_failure()` - Notifica fallo

**Estado:** ✅ Activo (usado por routes/payment.py)

---

## 7. WEBHOOKS

### Ruta

**Endpoint:** `POST /api/payment/webhook` (payment.py:852)

**Función:** `mp_webhook()`

### Validaciones

1. **HMAC Signature** (webhook_handler.py:55)
   - Valida firma X-Signature de Mercado Pago
   - Usa MP_ACCESS_TOKEN como secret
   - Comparación timing-safe

2. **Idempotencia** (webhook_handler.py:104)
   - Verifica si event_id ya existe en `db.webhook_events`
   - Si existe, retorna 200 con status "duplicate"

3. **Eventos soportados** (webhook_handler.py:28-52)
   - 22 tipos de eventos de Mercado Pago

### Flujo de procesamiento

```
1. Recibir webhook
    ↓
2. Validar HMAC
    ↓
3. Verificar idempotencia
    ↓
4. Buscar handler según event_type
    ↓
5. Ejecutar handler
    ↓
6. Registrar en webhook_events
    ↓
7. Registrar en webhook_logs
    ↓
8. Retornar 200 OK
```

### Proveedores con webhook

| Proveedor | Estado | Ruta | Validación |
|-----------|--------|------|------------|
| Mercado Pago | ✅ Activo | `/api/payment/webhook` | HMAC |
| PayPal | ❌ No implementado | - | - |

---

## 8. ACTIVACIÓN DE PLANES

### ¿Dónde se activa un plan?

**Función:** `_apply_payment_success()` (webhook_handler.py:478)

**Llamada desde:**
- `process_payment_event()` (webhook_handler.py:241) - Cuando pago es "approved"
- `confirm_payment()` (payment.py:842) - Webhook simulado

**Qué actualiza:**
```python
# 1. Marca transacción como pagada
await db.transactions.update_one(
    {"_id": transaction["_id"]},
    {"$set": {"status": "paid", "paid_at": datetime.utcnow()}}
)

# 2. Actualiza usuario
await db.users.update_one(
    {"_id": user["_id"]},
    {"$set": {
        "plan_id": transaction["plan_id"],
        "subscription_status": "active",
        "subscription_activated_at": datetime.utcnow(),
    }}
)
```

**Colecciones modificadas:**
- `db.transactions` - Actualiza status a "paid"
- `db.users` - Actualiza plan_id y subscription_status

**NO modifica:**
- `db.organizations`
- `db.firms`
- `db.leads`
- `db.timeline_events`

### Lógica de referidos (en la misma función)

```python
# Si existe referral_code
if transaction.get("referral_code") and user_id:
    referrer = await db.users.find_one({"referral_code": transaction["referral_code"]})
    if referrer and str(referrer["_id"]) != user_id:
        # Acredita 1 mes gratis
        await db.users.update_one(
            {"_id": referrer["_id"]},
            {"$inc": {
                "free_months_credits": 1,
                "total_referrals": 1,
            }}
        )
```

---

## 9. CREACIÓN DE TRIAL

### ¿Dónde se crea el trial?

**NO existe una función específica de creación de trial.**

El trial se crea implícitamente en dos lugares:

### 1. Registro de usuario (auth.py)

**Archivo:** `backend/routes/auth.py`

**Lógica:**
```python
# Para roles no-admin
user_dict["status"] = "PENDING_VERIFICATION"
user_dict["is_verified"] = False
user_dict["requires_password_change"] = True
# NO se crea trial explícitamente
```

**Trial implícito:** 7 días desde `created_at` (calculado en `/payment/my-plan`)

### 2. Registro de firma (firms.py)

**Archivo:** `backend/routes/firms.py` (línea 83)

**Lógica:**
```python
now = datetime.utcnow()
trial_ends = now + timedelta(days=7)

firm_doc = {
    "trial_status": "active",
    "trial_started_at": now,
    "trial_ends_at": trial_ends,
    "subscription_status": "trial",
    "subscription_plan": "trial",
}
```

### 3. Verificación de trial (payment.py)

**Archivo:** `backend/routes/payment.py` (línea 690-700)

**Lógica:**
```python
# Prueba gratuita de 7 días contada desde el registro (created_at)
created = current.get("created_at")
now = datetime.utcnow()
if isinstance(created, datetime):
    trial_started_at = created.isoformat() + "Z"
    ends = created + timedelta(days=7)
    trial_ends_at = ends.isoformat() + "Z"
    trial_active = (not plan) and (now < ends)
```

### TrialService

**Archivo:** `backend/services/trial_service.py`

**Funciones:**
- `check_and_expire_trials()` - Expira trials vencidos (usado en cron)
- `get_trial_summary_by_status()` - Resumen de trials
- `calculate_trial_remaining_days()` - Calcula días restantes
- `is_trial_active()` - Verifica si está activo

**Duración:** 7 días (hardcodeado en múltiples lugares)

---

## 10. ACTUALIZACIÓN DE ORGANIZACIÓN

### ¿Dónde se actualiza la organización?

**NO existe actualización de organización durante el pago.**

Cuando se activa un plan (`_apply_payment_success()`), solo se actualiza:
- `db.users` - plan_id, subscription_status
- `db.transactions` - status, paid_at

**NO se actualiza:**
- `db.organizations` - No se modifica
- `db.firms` - No se modifica
- `db.leads` - No se modifica

### Actualización de Firm OS

**Archivo:** `backend/routes/firms.py`

**Lógica:** Cuando se aprueba una firma, se actualiza el plan:
```python
await db.firms.update_one(
    {"_id": ObjectId(current_user["firm_id"])},
    {"$set": {
        "plan": plan_data.plan_id,
        "updated_at": datetime.utcnow()
    }}
)
```

**Pero esto pasa en onboarding, NO en payment.**

---

## 11. NOTIFICATION CENTER

### ¿Payment envía correos?

**NO.** Payment NO envía correos directamente.

### ¿Cómo notifica Payment?

**Usa `notifier.py` para notificaciones in-app:**

1. **Pago aprobado** (payment.py:448-458)
   ```python
   await notifier.create_app_notification(
       db, target="admin", type="payment_approved",
       title="Nuevo pago aprobado",
       message=f"{transaction.get('user_name')} pagó el plan {transaction.get('plan_id')}..."
   )
   ```

2. **Suscripción cancelada** (payment.py:1423-1430)
   ```python
   await notifier.create_app_notification(
       db, target="admin", type="subscription_cancelled",
       title="Suscripción cancelada",
       message=f"{current.get('full_name')} canceló su suscripción..."
   )
   ```

3. **Comprobante recibido** (payment.py:636-646)
   ```python
   await db.notifications.insert_one({
       "target": "admin",
       "type": "payment_receipt",
       "title": "Comprobante de pago por verificar",
       "message": f"{current.get('full_name')} envió un comprobante..."
   })
   ```

4. **Contracargo** (webhook_handler.py:453-461)
   ```python
   await db.notifications.insert_one({
       "target": "admin",
       "type": "chargeback_received",
       "title": "Contracargo recibido",
       "message": f"Se recibió un contracargo por el pago {payment_id}."
   })
   ```

**NO usa:**
- `send_email()` de notifier.py
- `send_email_request_received()`
- `send_email_request_approved()`
- etc.

**Solo usa:** `create_app_notification()` para notificaciones in-app

---

## 12. CRM

### ¿Actualmente Payment conoce al CRM?

**NO.** Payment NO tiene integración con CRM.

### ¿Existe alguna llamada al CRM?

**NO.** No hay referencias a:
- `CRMIntegrationService`
- `db.leads`
- `db.timeline_events`
- `crm_integration_service`

### ¿Existe integración con Timeline?

**NO.** Payment no crea eventos en Timeline.

### ¿Existe integración con Lead?

**NO.** Payment no actualiza leads.

### ¿Qué información del CRM necesita Payment?

**NINGUNA.** Payment funciona completamente aislado del CRM.

---

## 13. DUPLICIDADES

### Código duplicado

#### 1. `_apply_payment_success()` duplicado

**Ubicación 1:** `backend/routes/payment.py` (líneas 436-499)
**Ubicación 2:** `backend/services/webhook_handler.py` (líneas 478-526)

**Código idéntico:**
```python
async def _apply_payment_success(db, transaction: dict) -> bool:
    if transaction.get("status") == "paid":
        return False
    await db.transactions.update_one(...)
    user = await db.users.find_one({"email": transaction["user_email"]})
    if user:
        await db.users.update_one(...)
    # Lógica de referidos
    ...
```

**Riesgo:** 🔴 ALTO - Si se modifica en un lugar y no en el otro, se desincroniza

#### 2. Notificación de pago aprobado duplicada

**Ubicación 1:** `backend/routes/payment.py` (líneas 448-458)
**Ubicación 2:** `backend/services/webhook_handler.py` (NO tiene notificación)

**Riesgo:** 🟡 MEDIO - Solo se ejecuta en `confirm_payment()`, no en webhook

#### 3. Lógica de creación de transacción duplicada

**Ubicaciones:**
- `init_payment()` (payment.py:755)
- `renew_subscription()` (payment.py:1142)
- `change_plan()` (payment.py:1235)
- `reactivate_subscription()` (payment.py:1440)

**Código similar:**
```python
transaction = {
    "payment_id": payment_id,
    "user_email": ...,
    "plan_id": ...,
    "amount_local": ...,
    "currency": ...,
    "status": "pending",
    "created_at": datetime.utcnow(),
    "expires_at": datetime.utcnow() + timedelta(hours=24)
}
await db.transactions.insert_one(transaction)
```

**Riesgo:** 🟡 MEDIO - Código repetido, pero con variaciones menores

### Funciones repetidas

| Función | Archivo 1 | Archivo 2 | ¿Idéntica? |
|---------|-----------|-----------|------------|
| `_apply_payment_success()` | payment.py:436 | webhook_handler.py:478 | ✅ SÍ |
| `_create_mp_preference()` | payment.py:360 | - | Única |
| `_fetch_mp_payment()` | payment.py:414 | - | Única |

### Código muerto

**No se detectó código muerto** en los archivos analizados.

### Rutas legacy

**No se detectaron rutas legacy** en los archivos analizados.

### Providers abandonados

**No se detectaron providers abandonados.**

---

## 14. RIESGOS

| RIESGO | ARCHIVO | MOTIVO | IMPACTO | PROBABILIDAD |
|--------|---------|--------|---------|--------------|
| 🔴 CRÍTICO | `payment.py` + `webhook_handler.py` | `_apply_payment_success()` duplicada | Desincronización de lógica | ALTA |
| 🔴 CRÍTICO | `payment.py:852` | Webhook no valida si el usuario existe en DB antes de actualizar | Error en webhook si usuario no existe | MEDIA |
| 🟡 ALTO | `payment.py:436-499` | Lógica de referidos hardcodeada en múltiples lugares | Dificultad para modificar lógica de referidos | MEDIA |
| 🟡 ALTO | `payment.py:585-653` | Comprobantes almacenados en base64 (10MB max) | Performance de DB | MEDIA |
| 🟡 MEDIO | `payment.py:755-829` | Transacciones expiran en 24h pero no hay limpieza automática | Acumulación de transacciones vencidas | MEDIA |
| 🟡 MEDIO | `payment.py:1235-1381` | Cambio de plan con prorrateo complejo | Errores de cálculo | BAJA |
| 🟡 MEDIO | `webhook_handler.py:202-278` | No hay retry automático si falla el webhook | Eventos perdidos | BAJA |
| 🟢 BAJO | `payment.py:327-334` | Credenciales MP en variables de entorno | Exposición si .env se filtra | BAJA |
| 🟢 BAJO | `payment.py:291-302` | Países hardcodeados | Difícil agregar nuevos países | BAJA |
| 🟢 BAJO | `payment.py:238-241` | No hay validación de monto antes de activar suscripción | Posible fraude | BAJA |

---

## 15. RECOMENDACIÓN ARQUITECTÓNICA

### Opción A: Integración Directa (Recomendada)

**Descripción:** Agregar llamadas a `CRMIntegrationService` directamente en `_apply_payment_success()` y eventos clave de payment.py.

**Ventajas:**
- ✅ Reutiliza lógica existente de CRM
- ✅ No requiere cambios arquitectónicos mayores
- ✅ Centraliza integración en un solo lugar
- ✅ Fácil de mantener

**Desventajas:**
- ⚠️ Acopla Payment con CRM (pero ya están acoplados por diseño)
- ⚠ Requiere modificar `_apply_payment_success()` que está duplicado

**Cambios requeridos:**
1. Modificar `_apply_payment_success()` en `payment.py` (línea 436)
2. Modificar `_apply_payment_success()` en `webhook_handler.py` (línea 478)
3. Agregar llamadas a CRM en:
   - `init_payment()` - Registrar PAYMENT_INITIATED
   - `_apply_payment_success()` - Registrar PAYMENT_COMPLETED
   - `cancel_subscription()` - Registrar SUBSCRIPTION_CANCELLED
   - `change_plan()` - Registrar PLAN_CHANGED

### Opción B: Event Sourcing

**Descripción:** Crear un event bus que escuche eventos de Payment y publique a CRM.

**Ventajas:**
- ✅ Desacopla Payment de CRM
- ✅ Escalable
- ✅ Permite múltiples consumidores

**Desventajas:**
- ❌ Requiere crear infraestructura nueva (event bus)
- ❌ Mayor complejidad
- ❌ Overhead para el alcance actual

**Cambios requeridos:**
1. Crear event bus
2. Modificar Payment para publicar eventos
3. Crear consumer de CRM
4. Modificar webhook_handler para publicar eventos

### Opción C: Webhook CRM

**Descripción:** Crear un webhook en CRM que Payment llame cuando ocurran eventos.

**Ventajas:**
- ✅ Desacopla sistemas
- ✅ No requiere modificar Payment

**Desventajas:**
- ❌ Requiere exponer endpoint de CRM
- ❌ Mayor latencia
- ❌ Complejidad de red

**Cambios requeridos:**
1. Crear endpoint en CRM para recibir webhooks
2. Modificar Payment para llamar a CRM webhook
3. Validar autenticación entre servicios

---

## DICTAMEN FINAL

### ✅ APTO PARA INTEGRAR PAYMENT

**Recomendación:** Opción A (Integración Directa)

**Justificación:**

1. ✅ **Arquitectura simple:** Payment ya tiene toda la lógica en un solo archivo (payment.py)
2. ✅ **Punto de entrada claro:** `_apply_payment_success()` es el único lugar donde se activan planes
3. ✅ **Webhook centralizado:** `webhook_handler.py` procesa todos los eventos de MP
4. ✅ **Sin dependencias externas:** No requiere crear infraestructura nueva
5. ✅ **Bajo riesgo:** Solo se agregan llamadas a CRM, no se modifica lógica existente
6. ✅ **Reutilizable:** Usa `CRMIntegrationService` ya existente

**Riesgos aceptables:**
- Código duplicado en `_apply_payment_success()`: Se puede resolver en una fase posterior
- Falta de idempotencia en algunos eventos: No es crítico para el flujo de pago

**Próximos pasos:**
1. Integrar CRM en `_apply_payment_success()` (duplicado en 2 archivos)
2. Integrar CRM en eventos de: init_payment, cancel_subscription, change_plan
3. Agregar validaciones de idempotencia
4. Probar flujo completo end-to-end

---

## EVIDENCIA DE CÓDIGO

### Ejemplo 1: Activación de plan

**Archivo:** `backend/services/webhook_handler.py`  
**Función:** `_apply_payment_success()`  
**Línea:** 478-526

```python
async def _apply_payment_success(db: AsyncIOMotorDatabase, transaction: dict) -> bool:
    """Activa suscripción y aplica lógica de referidos (reutilizado de payment.py)."""
    
    if transaction.get("status") == "paid":
        return False  # Ya procesado
    
    try:
        # Marcar como pagado
        await db.transactions.update_one(
            {"_id": transaction["_id"]},
            {"$set": {
                "status": "paid",
                "paid_at": datetime.utcnow()
            }}
        )
        
        # Crear/actualizar usuario (activación de suscripción)
        user = await db.users.find_one({"email": transaction["user_email"]})
        if user:
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {
                    "plan_id": transaction["plan_id"],
                    "subscription_status": "active",
                    "subscription_activated_at": datetime.utcnow(),
                }}
            )
            user_id = str(user["_id"])
        else:
            return False
        
        # Aplicar lógica de referidos
        if transaction.get("referral_code") and user_id:
            referrer = await db.users.find_one({"referral_code": transaction["referral_code"]})
            if referrer and str(referrer["_id"]) != user_id:
                await db.users.update_one(
                    {"_id": referrer["_id"]},
                    {"$inc": {
                        "free_months_credits": 1,
                        "total_referrals": 1,
                    },
                    "$set": {"last_referral_at": datetime.utcnow()}}
                )
        
        return True
    
    except Exception as e:
        logger.error(f"Error applying payment success: {e}")
        return False
```

### Ejemplo 2: Webhook de Mercado Pago

**Archivo:** `backend/routes/payment.py`  
**Función:** `mp_webhook()`  
**Línea:** 852-1060

```python
@router.post("/webhook")
async def mp_webhook(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Webhook Oficial Consolidado de Mercado Pago.
    
    Procesa TODOS los eventos:
    - payment.*, subscription.*, refund.*, chargeback.*, invoice.*, merchant_order.*
    
    Características:
    - Validación HMAC de firma
    - Idempotencia por event_id
    - Auditoría completa en webhook_logs
    - Sincronización MongoDB automática
    
    Devuelve siempre 200 OK (acuso de recibo).
    """
    # ... validaciones ...
    
    # FASE 2: VALIDACIÓN HMAC
    if not await validate_hmac_signature(hmac_payload, signature):
        # ... log y retornar error
    
    # FASE 3: VERIFICAR DUPLICADOS
    if await is_event_duplicate(db, event_id):
        # ... log y retornar duplicate
    
    # FASE 1: PROCESAR EVENTO
    if event_type in EVENT_HANDLERS:
        handler, action = EVENT_HANDLERS[event_type]
        # ... extraer datos ...
        success = await handler(db, event_type, event_data)
    
    # FASE 4: AUDITORÍA
    await log_webhook(...)
    
    return {"received": True, ...}
```

### Ejemplo 3: Inicialización de pago

**Archivo:** `backend/routes/payment.py`  
**Función:** `init_payment()`  
**Línea:** 755-829

```python
@router.post("/init", response_model=PaymentInitResponse)
async def init_payment(request: PaymentInitRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Inicializa un pago según país y plan. Router inteligente."""
    plan_data = PLAN_PRICES_COP.get(request.plan_id)
    if not plan_data:
        raise HTTPException(status_code=400, detail="Plan no válido")
    
    # ... cálculo de montos ...
    
    # Mercado Pago: preferencia REAL
    preference_id = None
    if gateway == "mercado_pago":
        pref = await _create_mp_preference(tx_base, plan_name)
        if not pref or not pref.get("url"):
            raise HTTPException(status_code=502, detail="No se pudo crear la preferencia de Mercado Pago")
        checkout_url = pref["url"]
        preference_id = pref["preference_id"]
    else:
        checkout_url = f"https://www.paypal.com/checkoutnow?token={payment_id}"
    
    # Guardar transacción pendiente
    transaction = {
        "payment_id": payment_id,
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
        "preference_id": preference_id,
        "referral_code": request.referral_code,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=24)
    }
    
    await db.transactions.insert_one(transaction)
    
    return PaymentInitResponse(...)
```

---

## CONCLUSIONES

1. ✅ **Payment está listo para integrar con CRM**
2. ✅ **No requiere cambios arquitectónicos mayores**
3. ✅ **Punto de integración claro:** `_apply_payment_success()`
4. ⚠️ **Código duplicado debe resolverse** antes de integrar
5. ✅ **Webhook tiene idempotencia** (webhook_events)
6. ✅ **Notificaciones usan notifier.py** (create_app_notification)
7. ❌ **NO hay integración CRM actualmente** (esperando esta fase)
8. ✅ **Proveedor principal activo:** Mercado Pago
9. ⚠️ **PayPal parcial** (solo checkout simulado)
10. ✅ **Flujo de activación claro y funcional**

---

**Documento generado:** FASE_2.3A_AUDITORIA_PAYMENT.md  
**Próxima fase:** Integración CRM → Payment (Fase 2.3B)