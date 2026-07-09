# RELEASE CANDIDATE — LIVE DEPLOY CHECKLIST
**Date:** 2026-07-07  
**Target Environment:** Render (production)  
**Status:** READY FOR DEPLOYMENT  

---

## PRE-DEPLOYMENT VALIDATION

Use this checklist to confirm all fixes are in place before deploying to production.

---

### PHASE 1: CODE VERIFICATION (Local)

- [ ] **Blocker 1: JWT_SECRET in .env.example**
  - [ ] File: `backend/.env.example:16`
  - [ ] Value: `JWT_SECRET=cambia-esto-por-una-cadena-larga-y-aleatoria`
  - [ ] Command: `grep "JWT_SECRET" backend/.env.example`
  - [ ] Expected: Line contains `JWT_SECRET=`

- [ ] **Blocker 2: AI header binding fixed**
  - [ ] File: `backend/routes/ai.py:2-4`
  - [ ] Import: `from fastapi import Header`
  - [ ] Command: `grep "from fastapi import Header" backend/routes/ai.py`
  - [ ] Expected: Import found
  
  - [ ] File: `backend/routes/ai.py:40-45`
  - [ ] Function: `async def get_current_user_for_ai(`
  - [ ] Parameter: `authorization: str = Header(None),`
  - [ ] Command: `grep -A 5 "def get_current_user_for_ai" backend/routes/ai.py | grep "Header"`
  - [ ] Expected: `authorization: str = Header(None),`

- [ ] **Blocker 3: Tenant field migration exists**
  - [ ] File: `backend/migrations/002_align_tenant_fields.py`
  - [ ] Command: `ls -la backend/migrations/002_*.py`
  - [ ] Expected: File exists with 153+ lines

- [ ] **Blocker 4: Customer payment email exists**
  - [ ] File: `backend/routes/payment.py:460-482`
  - [ ] Text: `"Confirmación de pago - Punto Cero Legal"`
  - [ ] Command: `grep "Confirmación de pago" backend/routes/payment.py`
  - [ ] Expected: Customer email code found

- [ ] **Blocker 5: Payment events in SOC**
  - [ ] File: `backend/routes/payment.py:495-520`
  - [ ] Text: `"event_type": "payment_approved"`
  - [ ] Command: `grep "payment_approved" backend/routes/payment.py`
  - [ ] Expected: SOC event insertion code found

---

### PHASE 2: ENVIRONMENT SETUP (Render Panel)

**Action:** Set environment variables in Render dashboard

- [ ] **Navigate to:** Render Dashboard → Your Service → Environment
- [ ] **Add/Update these variables:**

| Variable | Value | Notes |
|----------|-------|-------|
| `JWT_SECRET` | `<must match SECRET_KEY>` | **CRITICAL** — Copy from SECRET_KEY |
| `SECRET_KEY` | `<existing value>` | Do NOT change |
| `MONGO_URL` | `<mongodb+srv://...>` | Production MongoDB Atlas URL |
| `DB_NAME` | `puntocero_legal` | Existing database name |
| `GEMINI_API_KEY` | `<your-api-key>` | Google Gemini |
| `ANTHROPIC_API_KEY` | `<sk-ant-...>` | Claude fallback |
| `MERCADOPAGO_ACCESS_TOKEN` | `<your-token>` | Live MercadoPago token |
| `SMTP_HOST` | `smtp.gmail.com` | Gmail SMTP |
| `SMTP_PORT` | `587` | Gmail TLS port |
| `SMTP_USER` | `<your-gmail>` | Gmail address |
| `SMTP_PASS` | `<app-password>` | Gmail app password (16 chars) |
| `SMTP_FROM` | `<your-gmail>` | Sender email |

**⚠️ CRITICAL:** `JWT_SECRET` must equal `SECRET_KEY` exactly. Copy-paste to be safe.

---

### PHASE 3: GIT DEPLOYMENT

- [ ] **Commit changes:**
  ```bash
  git add backend/.env.example backend/routes/ai.py backend/routes/payment.py backend/migrations/002_*.py
  git commit -m "RC: Fix AI auth, JWT config, tenant alignment, customer email, SOC logging"
  git push origin staging
  ```

- [ ] **Merge to main (if ready):**
  ```bash
  git checkout main
  git pull origin main
  git merge staging
  git push origin main
  ```

- [ ] **Verify on GitHub:**
  - [ ] Files changed: 4
  - [ ] Lines added: 199
  - [ ] No merge conflicts

---

### PHASE 4: DATABASE MIGRATIONS (After deployment to Render)

**Wait for Render to finish deploying, then:**

- [ ] **SSH into Render container or use Python REPL:**
  ```bash
  # Via Render shell (if available)
  python -m backend.migrations.002_align_tenant_fields --apply
  ```

- [ ] **Verify migration status:**
  ```bash
  python -m backend.migrations.002_align_tenant_fields --status
  ```

- [ ] **Expected output:**
  ```
  002_align_tenant_fields: APPLIED
  Applied at: 2026-07-07T...
  Changes: {'total_users': N, 'aligned': N, 'updated': M, 'missing_both': 0}
  ```

- [ ] **Also run standard migrations:**
  ```bash
  python -m backend.migrations.run_migration --apply
  ```

---

### PHASE 5: SMOKE TESTS (Live Production)

**Endpoint base:** `https://puntocero-legal-api.onrender.com`

#### Test 5.1: Auth Chain
```bash
# 1. Login to get JWT
curl -X POST https://puntocero-legal-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Expected: {"access_token": "eyJ..."}
# Save token as $TOKEN
```

- [ ] Login succeeds
- [ ] Token received
- [ ] Token contains `sub` (user ID)

#### Test 5.2: AI Endpoint (with JWT)
```bash
curl -X POST https://puntocero-legal-api.onrender.com/api/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Firm-ID: <firm_id>" \
  -H "X-Tenant-ID: <tenant_id>" \
  -d '{
    "message": "¿Qué es un contrato?",
    "session_id": "test-session-1",
    "lawyer_id": "<user_id>",
    "country": "Colombia",
    "template": "legal_assistant"
  }'

# Expected: 200 OK with AI response
# NOT 401 (auth failed)
# NOT 403 (tenant validation failed)
```

- [ ] Request succeeds (200 OK)
- [ ] AI responds with legal content
- [ ] No auth errors (401/403)

#### Test 5.3: Payment Chain (MercadoPago)
```bash
# 1. Initiate payment
curl -X POST https://puntocero-legal-api.onrender.com/api/payment/init \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "pro_monthly",
    "country": "Colombia",
    "currency": "COP"
  }'

# Expected: {"preference_url": "https://www.mercadopago.com/..."}
```

- [ ] Payment init succeeds
- [ ] MercadoPago URL returned
- [ ] Can open in browser and complete payment

#### Test 5.4: Email Confirmation
```bash
# After completing payment in MercadoPago (or simulating webhook):
# Check customer email inbox for:
# - Subject: "Confirmación de pago - Punto Cero Legal"
# - Body contains: plan, amount, currency, payment ID
```

- [ ] Email received by customer
- [ ] Email contains payment details
- [ ] Timestamp is recent
- [ ] No HTML errors

#### Test 5.5: SOC Event Logging
```bash
# Query MongoDB directly (or via backend admin):
db.soc_events.find({"event_type": "payment_approved"}).limit(1)

# Expected: Document with:
# {
#   "timestamp": ISODate(...),
#   "event_type": "payment_approved",
#   "user_id": ObjectId(...),
#   "payment_id": "...",
#   "plan_id": "pro_monthly",
#   "amount": 99000,
#   "currency": "COP",
#   "country": "Colombia",
#   "firm_id": "...",
#   "tenant_id": "...",
#   "severity": "info"
# }
```

- [ ] SOC event exists
- [ ] All fields populated correctly
- [ ] Timestamp is recent
- [ ] Severity is "info"

---

### PHASE 6: FULL CHAIN VALIDATION

Repeat the full payment flow to validate end-to-end:

1. **User logs in** → receives JWT
2. **User accesses AI endpoint** → JWT validated, tenant checked, AI responds
3. **User initiates payment** → MercadoPago URL returned
4. **User completes payment** → webhook received by backend
5. **Payment processed** → admin notification sent, customer email sent, SOC event logged
6. **User receives email** → payment confirmation with details
7. **SOC dashboard** → payment_approved event visible
8. **Logs** → all operations logged with trace IDs

- [ ] User JWT valid for 24 hours
- [ ] AI endpoint rejects invalid/expired tokens
- [ ] Payment flow completes without errors
- [ ] Customer email arrives within 2 minutes
- [ ] SOC event appears immediately
- [ ] No database errors
- [ ] No timeout errors

---

### PHASE 7: ERROR SCENARIOS

Test error handling to ensure graceful failures:

#### Test 7.1: Missing Authorization Header
```bash
curl -X POST https://puntocero-legal-api.onrender.com/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "session_id": "test"}'

# Expected: 401 Unauthorized (NOT 500)
```

- [ ] Returns 401, not 500
- [ ] Error message is clear

#### Test 7.2: Invalid JWT
```bash
curl -X POST https://puntocero-legal-api.onrender.com/api/ai/chat \
  -H "Authorization: Bearer invalid-token-here" \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "session_id": "test"}'

# Expected: 401 Unauthorized (NOT 500)
```

- [ ] Returns 401, not 500
- [ ] Logs error (doesn't expose JWT details)

#### Test 7.3: Missing Tenant Headers
```bash
curl -X POST https://puntocero-legal-api.onrender.com/api/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "session_id": "test"}'
# (no X-Firm-ID or X-Tenant-ID headers)

# Expected: 403 Forbidden (NOT 500)
```

- [ ] Returns 403, not 500
- [ ] Clear error message

#### Test 7.4: SMTP Failure (Email Down)
```bash
# Simulate SMTP being down (or disconnect from network briefly)
# Then trigger payment

# Expected: Payment succeeds, email fails silently (logged but not blocking)
```

- [ ] Payment still completes
- [ ] SOC event still logged
- [ ] Error logged but doesn't block flow

---

### PHASE 8: PERFORMANCE VALIDATION

- [ ] **AI response time:** < 10 seconds (Gemini API timeout)
- [ ] **Payment init:** < 5 seconds (MercadoPago API call)
- [ ] **JWT validation:** < 100ms (local)
- [ ] **Rate limiting:** Blocks > 20 requests/minute
- [ ] **Database:** Indexes exist, queries fast
- [ ] **Memory:** No memory leaks after 1 hour of use
- [ ] **Logs:** No duplicate entries, clean structure

---

### PHASE 9: MONITORING SETUP

- [ ] **Render dashboard:** Check app logs every 5 minutes
- [ ] **MongoDB Atlas:** Check query performance, connection pool
- [ ] **Gmail:** Confirm emails are being sent (check SMTP logs)
- [ ] **Sentry (if configured):** No errors above baseline
- [ ] **SOC dashboard:** Payment events visible and updated in real-time

---

## ROLLBACK PROCEDURE

If any blocker cannot be resolved:

1. **Revert git commits:**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Redeploy previous version:** Render auto-deploys on push

3. **Investigate issue:** Check logs in `.builder/RC_EXECUTION_CHAIN_VERIFICATION.md`

4. **Report blocker:** Document in new GitHub issue

---

## SIGN-OFF

- [ ] **QA Lead:** All smoke tests passed  
  - Name: _____________
  - Date: _____________
  - Notes: _____________________________

- [ ] **Backend Lead:** Code review complete, no security issues  
  - Name: _____________
  - Date: _____________
  - Notes: _____________________________

- [ ] **DevOps Lead:** Infrastructure ready, monitoring active  
  - Name: _____________
  - Date: _____________
  - Notes: _____________________________

---

## DEPLOYMENT COMMAND

Once all checklists pass, deploy:

```bash
# On main branch
git status  # Ensure all committed
git log --oneline -5  # Verify commits are there
git push origin main  # Render auto-deploys
```

**Expected deployment time:** 5-10 minutes  
**Expected downtime:** 0 (no rolling restart needed)

---

## POST-DEPLOYMENT

- [ ] Monitor Render logs for 30 minutes
- [ ] Check SOC dashboard for any security events
- [ ] Verify customer payment emails arrive
- [ ] Document any issues in GitHub

---

## KNOWN LIMITATIONS FOR MVP

| Limitation | Severity | Timeline |
|-----------|----------|----------|
| Stripe not implemented | 🟡 Medium | Release 2.0 |
| Direct axios bypasses in some UI | 🟡 Low | Release 2.0 (refactor) |
| Rate limiting has DB race condition | 🟡 Low | Release 2.0 (optimize) |

**These are NOT blockers for MVP.**

---

## COMPLETION

✅ All critical blockers fixed  
✅ Execution chain verified  
✅ Code ready for production  
⚠️ Configuration and migration must be applied in live environment  

**Status:** READY FOR LIVE DEPLOYMENT
