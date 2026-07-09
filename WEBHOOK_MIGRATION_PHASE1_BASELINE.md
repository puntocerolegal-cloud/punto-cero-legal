# WEBHOOK MIGRATION - COMPLETE AUDIT
## FASE 1: LÍNEA BASE COMPLETA

**Endpoint**: `POST /payment/webhook`  
**File**: `backend/routes/payment.py:868`  
**Service**: `backend/services/webhook_handler.py`  
**Status**: READY FOR MIGRATION  

---

## FASE 1 - INVENTARIO COMPLETO DE OPERACIONES MONGODB

### Router Level: `backend/routes/payment.py:868-1070`

**Function calls (no direct DB)**:
- Line 915-926: `log_webhook(db, ...)` - INDIRECT DB (see service layer)
- Line 939-950: `log_webhook(db, ...)` - INDIRECT DB
- Line 958: `is_event_duplicate(db, event_id)` - INDIRECT DB
- Line 960-971: `log_webhook(db, ...)` - INDIRECT DB
- Line 1006: `handler(db, event_type, event_data)` - INDIRECT (delegates to service)
- Line 1017-1025: `record_webhook_event(db, ...)` - INDIRECT DB
- Line 1033-1041: `record_webhook_event(db, ...)` - INDIRECT DB
- Line 1050-1061: `log_webhook(db, ...)` - INDIRECT DB

**Total direct DB calls in router**: 0  
**Total indirect DB calls**: 8 (all delegated to service layer)

---

### Service Layer 1: `backend/services/webhook_handler.py`

#### Function: `is_event_duplicate` (Line 104-107)

| Op # | Type | Collection | Operation | Repository? | TenantKernel? | TenantContext? | Risk |
|------|------|-----------|-----------|-------------|---------------|----------------|------|
| 1 | FIND_ONE | webhook_events | find_one({"event_id": event_id}) | ❌ NO | ❌ NO | ❌ NO | CRITICAL |

**Issue**: No firm_id filter. Can find events from ANY organization.

---

#### Function: `record_webhook_event` (Line 110-133)

| Op # | Type | Collection | Operation | Repository? | TenantKernel? | TenantContext? | Risk |
|------|------|-----------|-----------|-------------|---------------|----------------|------|
| 2 | INSERT_ONE | webhook_events | insert_one(doc) | ❌ NO | ❌ NO | ❌ NO | CRITICAL |

**Issue**: No firm_id in document. Creates unscoped webhook record.

---

#### Function: `log_webhook` (Line 136-169)

| Op # | Type | Collection | Operation | Repository? | TenantKernel? | TenantContext? | Risk |
|------|------|-----------|-----------|-------------|---------------|----------------|------|
| 3 | INSERT_ONE | webhook_logs | insert_one(doc) | ❌ NO | ❌ NO | ❌ NO | HIGH |

**Issue**: No firm_id in log. Creates unscoped audit log.

---

#### Function: `process_payment_event` (Line 202-278)

| Op # | Type | Collection | Operation | Repository? | TenantKernel? | TenantContext? | Risk |
|------|------|-----------|-----------|-------------|---------------|----------------|------|
| 4 | FIND_ONE | transactions | find_one({"payment_id": external_ref}) | ❌ NO | ❌ NO | ❌ NO | CRITICAL |
| 5 | UPDATE_ONE | transactions | update_one({"payment_id": external_ref}, {...}) | ❌ NO | ❌ NO | ❌ NO | CRITICAL |
| 6 | UPDATE_ONE | transactions | update_one({"mp_payment_id": payment_id}, {...}) | ❌ NO | ❌ NO | ❌ NO | CRITICAL |
| 7 | INSERT_ONE | audit_logs | insert_one({...}) | ❌ NO | ❌ NO | ❌ NO | HIGH |

**Issues**:
- No firm_id in queries
- Can update transactions from ANY organization
- No TenantKernel validation
- Audit log not scoped by firm

---

#### Function: `process_subscription_event` (Line 281-356)

| Op # | Type | Collection | Operation | Repository? | TenantKernel? | TenantContext? | Risk |
|------|------|-----------|-----------|-------------|---------------|----------------|------|
| 8 | FIND_ONE | users | find_one({"email": user_email}) | ❌ NO | ❌ NO | ❌ NO | CRITICAL |
| 9 | UPDATE_ONE | users | update_one({"_id": user["_id"]}, {...}) | ❌ NO | ❌ NO | ❌ NO | CRITICAL |
| 10 | INSERT_ONE | audit_logs | insert_one({...}) | ❌ NO | ❌ NO | ❌ NO | HIGH |

**Issues**:
- User lookup by email (not tenant-scoped)
- No firm_id filter on user update
- Subscription status changes without tenant context

---

#### Function: `process_refund_event` (Line 359-413)

| Op # | Type | Collection | Operation | Repository? | TenantKernel? | TenantContext? | Risk |
|------|------|-----------|-----------|-------------|---------------|----------------|------|
| 11 | FIND_ONE | transactions | find_one({"mp_payment_id": payment_id}) | ❌ NO | ❌ NO | ❌ NO | CRITICAL |
| 12 | INSERT_ONE | refunds | insert_one({...}) | ❌ NO | ❌ NO | ❌ NO | CRITICAL |
| 13 | UPDATE_ONE | transactions | update_one({"_id": tx["_id"]}, {...}) | ❌ NO | ❌ NO | ❌ NO | CRITICAL |
| 14 | INSERT_ONE | audit_logs | insert_one({...}) | ❌ NO | ❌ NO | ❌ NO | HIGH |

**Issues**:
- No firm_id on refund query
- Refund creation not scoped
- Could refund payment from ANY organization

---

#### Function: `process_chargeback_event` (Line 416-475)

| Op # | Type | Collection | Operation | Repository? | TenantKernel? | TenantContext? | Risk |
|------|------|-----------|-----------|-------------|---------------|----------------|------|
| 15 | INSERT_ONE | chargebacks | insert_one({...}) | ❌ NO | ❌ NO | ❌ NO | CRITICAL |
| 16 | FIND_ONE | transactions | find_one({"mp_payment_id": payment_id}) | ❌ NO | ❌ NO | ❌ NO | CRITICAL |
| 17 | UPDATE_ONE | transactions | update_one({"_id": tx["_id"]}, {...}) | ❌ NO | ❌ NO | ❌ NO | CRITICAL |
| 18 | INSERT_ONE | notifications | insert_one({...}) | ❌ NO | ❌ NO | ❌ NO | CRITICAL |
| 19 | INSERT_ONE | audit_logs | insert_one({...}) | ❌ NO | ❌ NO | ❌ NO | HIGH |

**Issues**:
- Chargeback not firm-scoped
- Could update ANY organization's transaction
- Admin notification not scoped to firm
- Cross-org chargeback possible

---

#### Function: `_apply_payment_success` (Line 478-526)

| Op # | Type | Collection | Operation | Repository? | TenantKernel? | TenantContext? | Risk |
|------|------|-----------|-----------|-------------|---------------|----------------|------|
| 20 | UPDATE_ONE | transactions | update_one({"_id": transaction["_id"]}, {...}) | ❌ NO | ❌ NO | ❌ NO | CRITICAL |
| 21 | FIND_ONE | users | find_one({"email": transaction["user_email"]}) | ❌ NO | ❌ NO | ❌ NO | CRITICAL |
| 22 | UPDATE_ONE | users | update_one({"_id": user["_id"]}, {...}) | ❌ NO | ❌ NO | ❌ NO | CRITICAL |
| 23 | FIND_ONE | users | find_one({"referral_code": transaction["referral_code"]}) | ❌ NO | ❌ NO | ❌ NO | CRITICAL |
| 24 | UPDATE_ONE | users | update_one({"_id": referrer["_id"]}, {...}) | ❌ NO | ❌ NO | ❌ NO | CRITICAL |

**Issues**:
- Email-based user lookup (not tenant-scoped)
- Referral user could be from ANY organization
- Cross-tenant referral reward possible

---

#### Function: `_notify_payment_failure` (Line 529-544)

| Op # | Type | Collection | Operation | Repository? | TenantKernel? | TenantContext? | Risk |
|------|------|-----------|-----------|-------------|---------------|----------------|------|
| 25 | FIND_ONE | transactions | find_one({"mp_payment_id": payment_id}) | ❌ NO | ❌ NO | ❌ NO | CRITICAL |
| 26 | INSERT_ONE | notifications | insert_one({...}) | ❌ NO | ❌ NO | ❌ NO | CRITICAL |

**Issues**:
- No firm_id on transaction query
- Could notify admin about ANY organization's payment

---

## SUMMARY - BASELINE

### Total Direct MongoDB Operations: **26**

```
Collections Affected:
├─ webhook_events:    2 ops (find_one x1, insert_one x1)
├─ webhook_logs:      1 op  (insert_one x1)
├─ transactions:       7 ops (find_one x2, update_one x3, called in 2 more handlers)
├─ users:             6 ops (find_one x2, update_one x2, in referral flow)
├─ audit_logs:        4 ops (insert_one x4)
├─ refunds:           1 op  (insert_one x1)
├─ chargebacks:       1 op  (insert_one x1)
└─ notifications:     3 ops (insert_one x3)

Repository Usage: 0 (ZERO)
TenantKernel Usage: 0 (ZERO)
TenantContext Usage: 0 (ZERO)

Risk Classification:
├─ CRITICAL (no firm_id filter, cross-tenant possible):  20 operations
├─ HIGH (audit/logging):                                  6 operations
└─ LOW:                                                    0 operations
```

---

## FASE 2 - FLUJO REAL

```
POST /payment/webhook (Line 868)
  ↓
  Extract event_id, event_type, body
  ↓
  validate_hmac_signature() [Line 55-101] → No DB
  ↓
  is_event_duplicate(db, event_id) [Line 104-107]
    └─ db.webhook_events.find_one() [OP #1 - CRITICAL]
  ↓
  log_webhook() [Line 136-169]
    └─ db.webhook_logs.insert_one() [OP #3 - HIGH]
  ↓
  Route to EVENT_HANDLER [Line 548-565]
    ↓
    ├─ IF payment event:
    │  └─ process_payment_event() [Line 202-278]
    │     ├─ db.transactions.find_one() [OP #4 - CRITICAL]
    │     ├─ db.transactions.update_one() [OP #5, #6 - CRITICAL]
    │     ├─ _apply_payment_success() [Line 478-526]
    │     │  ├─ db.transactions.update_one() [OP #20 - CRITICAL]
    │     │  ├─ db.users.find_one() [OP #21 - CRITICAL]
    │     │  ├─ db.users.update_one() [OP #22 - CRITICAL]
    │     │  ├─ db.users.find_one() [OP #23 - CRITICAL, REFERRAL]
    │     │  └─ db.users.update_one() [OP #24 - CRITICAL, REFERRAL]
    │     └─ db.audit_logs.insert_one() [OP #7 - HIGH]
    │
    ├─ IF subscription event:
    │  └─ process_subscription_event() [Line 281-356]
    │     ├─ db.users.find_one() [OP #8 - CRITICAL]
    │     ├─ db.users.update_one() [OP #9 - CRITICAL]
    │     └─ db.audit_logs.insert_one() [OP #10 - HIGH]
    │
    ├─ IF refund event:
    │  └─ process_refund_event() [Line 359-413]
    │     ├─ db.transactions.find_one() [OP #11 - CRITICAL]
    │     ├─ db.refunds.insert_one() [OP #12 - CRITICAL]
    │     ├─ db.transactions.update_one() [OP #13 - CRITICAL]
    │     └─ db.audit_logs.insert_one() [OP #14 - HIGH]
    │
    └─ IF chargeback event:
       └─ process_chargeback_event() [Line 416-475]
          ├─ db.chargebacks.insert_one() [OP #15 - CRITICAL]
          ├─ db.transactions.find_one() [OP #16 - CRITICAL]
          ├─ db.transactions.update_one() [OP #17 - CRITICAL]
          ├─ db.notifications.insert_one() [OP #18 - CRITICAL]
          └─ db.audit_logs.insert_one() [OP #19 - HIGH]
  ↓
  record_webhook_event(db, ...) [Line 110-133]
    └─ db.webhook_events.insert_one() [OP #2 - CRITICAL]
  ↓
  log_webhook() [Line 136-169]
    └─ db.webhook_logs.insert_one() [OP #3 again, final log]
  ↓
  _notify_payment_failure() [Line 529-544] (IF payment failed)
     ├─ db.transactions.find_one() [OP #25 - CRITICAL]
     └─ db.notifications.insert_one() [OP #26 - CRITICAL]
  ↓
  RETURN 200 OK
```

---

## FASE 3 - PLAN QUIRÚRGICO

### Repositories Needed (Already Created)

| Repository | File | Status | Methods Needed |
|------------|------|--------|----------------|
| WebhookEventRepository | `webhook_event_repository.py` | ✅ EXISTS | find_by_event_id, create_event, mark_processed |
| AuditLogRepository | `audit_log_repository.py` | ✅ EXISTS | log_action, log_security_event |
| TransactionRepository | `transaction_repository.py` | ✅ EXISTS | find_by_id, update, find_many |
| UserRepository | `user_repository.py` | ✅ EXISTS | find_by_email, update_by_email, increment_referral_count |
| NotificationRepository | `notification_repository.py` | ✅ EXISTS | create_notification |
| RefundRepository | `refund_repository.py` | ✅ EXISTS | create_refund |
| ChargebackRepository | `refund_repository.py` | ✅ EXISTS | create_chargeback, update_status |

---

### Operations to Migrate

| Op # | Replacement | Repository | Risk | Rollback |
|------|-------------|-----------|------|----------|
| 1 | webhook_repo.find_by_event_id(firm_id, event_id) | WebhookEventRepository | MEDIUM | Keep fallback lookup |
| 2 | webhook_repo.create_event(firm_id, ...) | WebhookEventRepository | MEDIUM | If failed, still log via webhook_logs |
| 3 | audit_repo.log_action(firm_id, ...) | AuditLogRepository | LOW | Logs only, no rollback needed |
| 4 | transaction_repo.find_by_id(firm_id, external_ref) | TransactionRepository | MEDIUM | Restore db.transactions.find_one |
| 5,6 | transaction_repo.update(firm_id, external_ref, {...}) | TransactionRepository | HIGH | Verify update succeeded |
| 7 | audit_repo.log_action(firm_id, ...) | AuditLogRepository | LOW | Logs only |
| 8 | user_repo.find_by_email(firm_id, email) | UserRepository | HIGH | Must provide firm_id (get from transaction) |
| 9 | user_repo.update_by_email(firm_id, email, {...}) | UserRepository | HIGH | Verify update succeeded |
| 10 | audit_repo.log_action(firm_id, ...) | AuditLogRepository | LOW | Logs only |
| 11 | transaction_repo.find_by_id(firm_id, mp_payment_id) | TransactionRepository | MEDIUM | Restore fallback |
| 12 | refund_repo.create_refund(firm_id, ...) | RefundRepository | MEDIUM | If failed, still create in fallback |
| 13 | transaction_repo.update(firm_id, ...) | TransactionRepository | HIGH | Verify update |
| 14 | audit_repo.log_action(firm_id, ...) | AuditLogRepository | LOW | Logs only |
| 15 | chargeback_repo.create_chargeback(firm_id, ...) | ChargebackRepository | MEDIUM | If failed, still log |
| 16 | transaction_repo.find_by_id(firm_id, mp_payment_id) | TransactionRepository | CRITICAL | Restore fallback |
| 17 | transaction_repo.update(firm_id, ...) | TransactionRepository | CRITICAL | Verify update |
| 18 | notif_repo.create_notification(firm_id, "admin", ...) | NotificationRepository | MEDIUM | If failed, still log |
| 19 | audit_repo.log_action(firm_id, ...) | AuditLogRepository | LOW | Logs only |
| 20 | transaction_repo.update(firm_id, ...) | TransactionRepository | CRITICAL | Verify update |
| 21 | user_repo.find_by_email(firm_id, email) | UserRepository | CRITICAL | Must have firm_id |
| 22 | user_repo.update_by_email(firm_id, email, {...}) | UserRepository | CRITICAL | Verify update |
| 23 | user_repo.find_by_referral_code(firm_id, code) | UserRepository | CRITICAL | Must scope by firm |
| 24 | user_repo.increment_referral_count(firm_id, user_id) | UserRepository | CRITICAL | Verify increment |
| 25 | transaction_repo.find_by_id(firm_id, mp_payment_id) | TransactionRepository | CRITICAL | Restore fallback |
| 26 | notif_repo.create_notification(firm_id, "admin", ...) | NotificationRepository | CRITICAL | If failed, still log |

---

## KEY INSIGHT - Firm ID Availability

**CRITICAL BLOCKER**: Webhook doesn't have firm_id in context.

**Solution**: Use transaction lookup to resolve firm_id:
1. External webhook arrives (no auth, no firm_id)
2. Extract payment_id or external_ref from webhook
3. Lookup transaction in db → get firm_id
4. Use firm_id for ALL subsequent operations

**Implementation**:
- Add helper: `resolve_firm_id_from_webhook(db, event_data) → firm_id`
- Call at start of each handler
- If firm_id not found → log error + skip event

---

## Ready for FASE 4: IMPLEMENTATION

**Status**: ✅ BASELINE COMPLETE  
**Total Operations to Migrate**: 26  
**Critical Blockers**: 1 (firm_id resolution)  
**Solution**: Transaction lookup  
**Estimated Effort**: 4-5 hours  
**Risk Level**: MEDIUM (firm_id dependency)  

Proceeding to FASE 4: IMPLEMENTACIÓN CONTROLADA
