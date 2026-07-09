# RELEASE CANDIDATE — EXECUTION CHAIN AUDIT
**Date:** 2026-07-07  
**Scope:** Complete frontend-to-SOC execution chain verification  
**Status:** AUDIT COMPLETE - FINDINGS DOCUMENTED  
**Note:** NO CODE MODIFICATIONS - AUDIT ONLY

---

## AUDIT METHODOLOGY

For each integration point in the execution chain:
- ✅ **EXISTE** — Code/integration present in codebase
- ✅ **IMPORTADO** — Module imported or referenced
- ✅ **CONFIGURADO** — Set up in startup/initialization
- ✅ **VARIABLE ENCONTRADA** — Environment variable defined
- ✅ **ENDPOINT CONECTADO** — API endpoint wired
- ✅ **CADENA COMPLETA** — Full flow from entry to exit
- ❌ **FALTA CONFIGURACIÓN** — What's missing

---

## 1. FRONTEND → API

### Verification

| Aspect | Status | Details |
|--------|--------|---------|
| EXISTE | ✅ | 60+ endpoints found in frontend code |
| IMPORTADO | ✅ | `apiClient`, `axios` throughout |
| CONFIGURADO | ✅ | `API_URL` in `frontend/src/config/api.js` |
| VARIABLE ENCONTRADA | ✅ | `VITE_BACKEND_URL` or `VITE_LOCAL_BACKEND` |
| ENDPOINT CONECTADO | ✅ | All major endpoints have matching routes |
| CADENA COMPLETA | ⚠️ | Most endpoints complete, some use direct axios |
| FALTA CONFIGURACIÓN | ⚠️ | Some UI files bypass centralized apiClient |

### Evidence

**API Client Setup:**
```
frontend/src/config/api.js:10-35          — API_URL resolution
frontend/src/config/api/apiClient.js:18-30 — axios with baseURL
frontend/src/config/api/apiClient.js:39-57 — Authorization header injection
frontend/src/security/tenantStorage.js:25-35 — Tenant headers (X-Firm-ID, X-Tenant-ID)
```

**Endpoints Found (Sample):**
- Auth: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`
- Payment: `/api/payment/init`, `/api/payment/receipt`, `/api/payment/methods`
- Cases: `/api/cases`, `/api/cases/{id}`, `/api/cases/{id}/accept`
- AI: `/api/ai/chat`, `/api/ai/usage/{userId}`
- Admin: `/api/admin-ops/*`, `/api/organizations/*`, `/api/subscriptions/*`

### Issue Found

❌ **NOT ALL ENDPOINTS USE CENTRALIZED CLIENT**
- Some files use direct `axios` calls instead of centralized `apiClient`
- This bypasses request logging and tenant header injection
- **Impact:** Tenant context not guaranteed on all requests
- **Example:** `frontend/src/pages/AdminPanel.jsx` uses direct axios

---

## 2. API → JWT

### Verification

| Aspect | Status | Details |
|--------|--------|---------|
| EXISTE | ✅ | JWT validation in multiple locations |
| IMPORTADO | ✅ | `jose.jwt.decode` imported |
| CONFIGURADO | ✅ | `SECRET_KEY` and `JWT_SECRET` available |
| VARIABLE ENCONTRADA | ⚠️ | `SECRET_KEY` in `.env.example`, `JWT_SECRET` NOT |
| ENDPOINT CONECTADO | ✅ | All protected endpoints validate JWT |
| CADENA COMPLETA | ⚠️ | Valid for main auth, issues for AI path |
| FALTA CONFIGURACIÓN | ❌ | `JWT_SECRET` missing from `.env.example` |

### Evidence

**JWT Validation Points:**
```
backend/utils/auth.py:15-89               — decode_token()
backend/routes/auth.py:20-40              — get_current_user()
backend/routes/admin_ops.py:33-48         — get_admin()
backend/kernel/tenant_kernel.py:97-225    — Primary JWT validation
```

**Invalid JWT Behavior:**
- `routes/auth.get_current_user`: Returns `401` or `404`
- `routes/admin_ops.get_admin`: Returns `401` or `403`
- `TenantKernelMiddlewareWrapper`: Returns `401`

### Critical Issue Found

🔴 **JWT CONFIG MISMATCH**
- `backend/utils/auth.py` uses `SECRET_KEY` for signing/decoding
- `backend/services/enterprise_auth_service.py` uses `JWT_SECRET`
- AI auth calls `decode_jwt_token()` from enterprise_auth_service
- `.env.example` defines `SECRET_KEY` but NOT `JWT_SECRET`
- **Impact:** If `JWT_SECRET` is not set to match `SECRET_KEY`, AI authentication will fail
- **Required Fix:** Either sync the configs or set `JWT_SECRET` in `.env`

---

## 3. JWT → TENANT

### Verification

| Aspect | Status | Details |
|--------|--------|---------|
| EXISTE | ✅ | Tenant resolution in JWT and headers |
| IMPORTADO | ✅ | TenantContext, tenant_isolation middleware |
| CONFIGURADO | ✅ | TenantKernelMiddlewareWrapper registered |
| VARIABLE ENCONTRADA | ✅ | `X-Firm-ID`, `X-Tenant-ID` headers sent |
| ENDPOINT CONECTADO | ✅ | Middleware active on all routes |
| CADEIA COMPLETA | ⚠️ | Two separate tenant vocabularies |
| FALTA CONFIGURACIÓN | ❌ | Inconsistent field naming |

### Evidence

**Tenant Resolution:**
```
backend/kernel/tenant_kernel.py:148-199   — Kernel-based (primary, firm_id from JWT)
backend/utils/tenant.py:37-69             — Legacy (tenant_id from DB/header)
backend/middleware/tenant_isolation.py    — Middleware enforcement
```

**Frontend Propagation:**
```
frontend/src/security/tenantStorage.js:25-35  — Sends both X-Firm-ID and X-Tenant-ID
frontend/src/config/api/apiClient.js:53-57    — Injects tenant headers on requests
```

### Issue Found

⚠️ **TENANT MODEL INCONSISTENCY**
- Kernel/payment routes use `firm_id` from JWT
- Legacy OS routes use `tenant_id` from header/DB
- Some user documents may not have both fields aligned
- Frontend sends both headers to work around this
- **Impact:** Some requests may fail if user record doesn't have required tenant fields
- **Validation Needed:** Verify all user records have both `firm_id` and `tenant_id` fields

---

## 4. TENANT → AI

### Verification

| Aspect | Status | Details |
|--------|--------|---------|
| EXISTE | ✅ | `get_current_user_for_ai` dependency exists |
| IMPORTADO | ✅ | Used in `/api/ai/chat` and `/api/ai/usage` |
| CONFIGURADO | ✅ | Rate limiter registered |
| VARIABLE ENCONTRADA | ⚠️ | `JWT_SECRET` required (see issue #2) |
| ENDPOINT CONECTADO | ✅ | Both endpoints protected |
| CADENA COMPLETA | ❌ | Header binding bug present |
| FALTA CONFIGURACIÓN | ❌ | Multiple issues |

### Evidence

**AI Authentication:**
```
backend/routes/ai.py:44-103              — get_current_user_for_ai()
backend/routes/ai.py:304                 — @limiter.limit() decorator
backend/routes/ai.py:312-314             — User context extraction
backend/routes/ai.py:333-341             — Session ownership validation
```

### Critical Issues Found

🔴 **HEADER BINDING BUG**
- Line 40-43 and 296-303: `authorization: Optional[str] = None`
- Should be: `authorization: str = Header(None)`
- **Impact:** FastAPI may not bind the Authorization header properly
- **Impact:** The dependency may receive None even with valid JWT
- **Required Fix:** Change parameter declaration to use `Header()`

🔴 **JWT SECRET MISMATCH** (from issue #2)
- AI auth uses `enterprise_auth_service.decode_jwt_token()`
- That function uses `JWT_SECRET` environment variable
- If `JWT_SECRET` is not set, decoding will fail
- **Required Fix:** Set `JWT_SECRET` to match `SECRET_KEY`

🟡 **TENANT FIELD REQUIREMENT**
- AI expects user document to have both `firm_id` AND `tenant_id`
- Some user records may only have one
- **Required Fix:** Migrate user records to have both fields

---

## 5. AI → MONGO

### Verification

| Aspect | Status | Details |
|--------|--------|---------|
| EXISTE | ✅ | 5 collections used by AI module |
| IMPORTADO | ✅ | Motor (async MongoDB driver) |
| CONFIGURADO | ✅ | Database indexes created via migration |
| VARIABLE ENCONTRADA | ✅ | `MONGO_URL` and `DB_NAME` |
| ENDPOINT CONECTADO | ✅ | Collections wired in code |
| CADENA COMPLETA | ⚠️ | Atomic operations, but rate limit check races |
| FALTA CONFIGURACIÓN | ⚠️ | Indexes required from migration |

### Evidence

**Collections Used:**
```
db.ai_sessions                — Session read/write (atomic)
db.ai_usage                   — Usage counting (atomic)
db.ai_conversation_logs       — Audit logging
db.rate_limit_logs           — Rate limit violation tracking
db.soc_events                — Security events
```

**Atomic Operations:**
```
backend/routes/ai.py:396-409   — find_one_and_update (atomic)
backend/routes/ai.py:441-450   — find_one_and_update with $inc (atomic)
```

### Issue Found

⚠️ **RATE LIMIT RACE CONDITION**
- Usage limit check is a separate `find_one()` before update
- Under concurrency, two requests can both pass the check and exceed limit
- **Impact:** Rate limiting can be bypassed under load
- **Workaround:** Rely on Slowapi limiter at HTTP level instead
- **Note:** Requires actual load testing to confirm impact

---

## 6. MONGO → STRIPE

### Verification

| Aspect | Status | Details |
|--------|--------|---------|
| EXISTE | ❌ | No live Stripe integration |
| IMPORTADO | ❌ | No `stripe` SDK imported |
| CONFIGURADO | ❌ | Only stub implementation |
| VARIABLE ENCONTRADA | ❌ | No STRIPE_* env vars in .env.example |
| ENDPOINT CONECTADO | ❌ | No Stripe routes |
| CADENA COMPLETA | ❌ | COMPLETELY MISSING |
| FALTA CONFIGURACIÓN | 🔴 CRITICAL | Everything |

### Evidence

**What Exists:**
```
backend/services/payment_provider_service.py:23-52  — StripePaymentProvider class
  - returns "Stripe integration not yet enabled"
backend/utils/webhook_idempotency.py:24-37         — Stripe mentioned in scaffolding
```

**What's Missing:**
- No SDK import (`import stripe`)
- No API key retrieval (`os.environ.get("STRIPE_API_KEY")`)
- No customer creation (`stripe.Customer.create()`)
- No payment intent creation
- No webhook handler for Stripe events
- No persistent Stripe payment records

### Status

❌ **NOT READY FOR PRODUCTION**
- Stripe is a complete stub
- Payment routes fall back to MercadoPago for LATAM, PayPal for others
- **If Stripe is required:** Full implementation needed (SDK, routes, webhooks, data model)
- **If optional:** Safe to skip for MVP (MercadoPago covers LATAM)

---

## 7. STRIPE ↔ MERCADOPAGO

### Verification

| Aspect | Status | Details |
|--------|--------|---------|
| EXISTE | ✅ | MercadoPago live, Stripe stub |
| IMPORTADO | ✅ | `mercadopago` SDK imported |
| CONFIGURADO | ✅ | `MERCADOPAGO_ACCESS_TOKEN` in `.env.example` |
| VARIABLE ENCONTRADA | ✅ | Access token, auth token |
| ENDPOINT CONECTADO | ✅ | Both `/payment/init` and webhook |
| CADENA COMPLETA | ⚠️ | MercadoPago complete, Stripe missing |
| FALTA CONFIGURACIÓN | ⚠️ | Stripe only |

### Evidence

**Payment Provider Selection:**
```
backend/routes/payment.py:498-506      — detect_gateway(country)
  - Returns MercadoPago for LATAM countries
  - Falls back to PayPal for others

backend/routes/payment.py:745-852      — POST /payment/init
  - Calls _create_mp_preference() for MercadoPago
  - Returns PayPal URL string for others
```

**Actual Live Integrations:**
- ✅ MercadoPago: full SDK, real requests, webhook handling
- ❌ Stripe: stub (returns "not enabled")
- ❌ PayPal: URL string only (no SDK integration)

### Status

⚠️ **PARTIAL - MERCADOPAGO WORKS, STRIPE DOESN'T**
- MercadoPago is production-ready for LATAM
- Stripe needs complete implementation for non-LATAM regions
- PayPal is placeholder only (no SDK)

---

## 8. MERCADOPAGO → EMAIL

### Verification

| Aspect | Status | Details |
|--------|--------|---------|
| EXISTE | ✅ | Email infrastructure complete |
| IMPORTADO | ✅ | `smtplib` and notifier module |
| CONFIGURADO | ✅ | SMTP settings in startup |
| VARIABLE ENCONTRADA | ✅ | SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS |
| ENDPOINT CONECTADO | ✅ | Email triggered on payment events |
| CADENA COMPLETA | ⚠️ | Admin email yes, customer email unclear |
| FALTA CONFIGURACIÓN | ⚠️ | Customer-facing payment email |

### Evidence

**Email Trigger on Payment:**
```
backend/routes/payment.py:445-453      — Payment success triggers notification
backend/routes/payment.py:1515-1522    — Subscription cancel triggers notification
backend/utils/notifier.py:63-68        — create_app_notification sends email to admin
```

**Email Implementation:**
```
backend/utils/notifier.py:72-157       — send_email() with SMTP
  - Logs TRACE ID for tracing
  - Handles connection, TLS, login, sendmail
  - Logs success/failure
```

### Issue Found

⚠️ **NO CUSTOMER-FACING PAYMENT EMAIL**
- Payment success sends admin notification (not customer)
- No customer payment receipt/confirmation email found
- **Impact:** Customer doesn't receive payment confirmation
- **Required Fix:** Add customer email on payment success in payment routes

---

## 9. EMAIL → LOGS

### Verification

| Aspect | Status | Details |
|--------|--------|---------|
| EXISTE | ✅ | Logging throughout email flow |
| IMPORTADO | ✅ | `logging` module configured |
| CONFIGURADO | ✅ | `logging.basicConfig()` in server.py |
| VARIABLE ENCONTRADA | ✅ | Log level set to INFO |
| ENDPOINT CONECTADO | N/A | Logging is internal |
| CADENA COMPLETA | ✅ | All email ops logged |
| FALTA CONFIGURAÇÃO | ❌ | None |

### Evidence

**Email Logging:**
```
backend/utils/notifier.py:83-119       — Connection logging
backend/utils/notifier.py:120-157      — Success/failure logging
backend/server.py:17-22                — Global logging configuration
```

**Log Trace Information:**
- EMAIL_TRACE ID for request tracking
- SMTP host, port, user, sender
- Connection phase, TLS, authentication, sendmail
- Severity levels: INFO, ERROR, CRITICAL

### Status

✅ **COMPLETE AND FUNCTIONAL**
- Email sends are fully logged
- Structured trace IDs for debugging
- Severity levels for monitoring

---

## 10. LOGS → SOC

### Verification

| Aspect | Status | Details |
|--------|--------|---------|
| EXISTE | ✅ | SOC infrastructure exists |
| IMPORTADO | ✅ | SOC modules imported in security layer |
| CONFIGURADO | ✅ | Indexes created for SOC collections |
| VARIABLE ENCONTRADA | ✅ | No env vars needed |
| ENDPOINT CONECTADO | ✅ | SOC endpoints exist |
| CADEIA COMPLETA | ❌ | Payment events not sent to SOC |
| FALTA CONFIGURACIÓN | ❌ | Missing payment → SOC integration |

### Evidence

**SOC Infrastructure:**
```
backend/security/soc_event_stream.py    — Event streaming
backend/security/soc_dashboard_api.py   — Dashboard endpoints
backend/migrations/*                    — Indexes on soc_events
```

**Events Sent to SOC:**
- ✅ AI security events (unauthorized session access)
- ✅ System security events (mitigation, circuit breaker)
- ❌ Payment events (missing)

**Where Payment Events Are Logged:**
- `notifications` collection (admin only)
- `transactions` collection (technical)
- `webhook_events` collection (webhooks)
- `audit` logs (implicit)
- **NOT** `soc_events` collection

### Issue Found

❌ **PAYMENT EVENTS NOT IN SOC**
- Payment events are logged in multiple places
- But none send to `soc_events` collection
- SOC dashboard won't show payment activities
- **Impact:** Security team can't see payment anomalies
- **Required Fix:** Add payment event logging to SOC on success/failure

---

## EXECUTION CHAIN STATUS SUMMARY

| Integration | Status | Issues |
|-------------|--------|--------|
| Frontend → API | ⚠️ Partial | Some endpoints bypass centralized client |
| API → JWT | ⚠️ Partial | JWT_SECRET missing from .env |
| JWT → Tenant | ⚠️ Partial | Inconsistent field naming (firm_id vs tenant_id) |
| Tenant → AI | ❌ Broken | Header binding bug + JWT config mismatch |
| AI → Mongo | ⚠️ Partial | Rate limit race condition |
| Mongo → Stripe | ❌ Missing | No implementation, stub only |
| Stripe ↔ MP | ⚠️ Partial | MercadoPago works, Stripe doesn't |
| MP → Email | ⚠️ Partial | Admin email yes, customer email no |
| Email → Logs | ✅ Complete | Working |
| Logs → SOC | ❌ Partial | Payment events not sent to SOC |

---

## BLOCKERS FOR LIVE TESTING

### CRITICAL (Blocking execution):

1. **JWT_SECRET not defined in .env.example**
   - AI auth will fail
   - Fix: Add `JWT_SECRET` to `.env.example` (or sync configs)

2. **AI header binding bug**
   - `authorization` parameter not declared as `Header()`
   - FastAPI won't bind the Authorization header
   - Fix: Change line 40 and 296 from `authorization: Optional[str] = None` to `authorization: str = Header(None)`

3. **Stripe not implemented**
   - Only stub exists
   - Non-LATAM payments will fail
   - Decision needed: Skip for MVP or implement

### HIGH (Limiting functionality):

4. **Tenant field inconsistency**
   - Some user records may not have both `firm_id` and `tenant_id`
   - AI auth will fail for affected users
   - Fix: Migrate all user records to have both fields

5. **No customer payment email**
   - Customers don't receive payment confirmation
   - Perceived as broken feature
   - Fix: Add customer email in payment success handler

6. **Payment events not in SOC**
   - Security team can't monitor payments
   - Fix: Add payment event logging to soc_events on success/failure

---

## WHAT TO DO BEFORE LIVE TESTING

- [ ] **Add `JWT_SECRET` to .env.example** (must equal `SECRET_KEY`)
- [ ] **Fix AI header binding** (`authorization: str = Header(None)`)
- [ ] **Migrate user records** to have both `firm_id` and `tenant_id`
- [ ] **Add customer payment email** on success
- [ ] **Wire payment → SOC logging** for payment events
- [ ] **Decision on Stripe:** Skip for MVP or implement
- [ ] **Verify MongoDB indexes** have been created (from R1.1 migration)

---

## FINAL STATUS

**🔴 RELEASE CANDIDATE NOT READY FOR LIVE TESTING**

**Blockers found:** 3 critical + 3 high  
**Full chain execution:** Broken in 4 places  
**Data in SOC:** Incomplete (payment events missing)

**To proceed with live testing:**
1. Fix the 3 critical blockers
2. Address at least 2 of the 3 high-priority issues
3. Run through validation checklist again

---

**This audit is complete. No code has been modified. All findings are based on static code analysis.**

**Next steps:** Execute the blocker fixes listed above, then re-run the validation checklist from `.builder/R1_1_LIVE_VALIDATION_CHECKLIST.md`.
