# RELEASE 1.0 — SMOKE TEST PROTOCOL
**Date:** 2026-07-07  
**Status:** TEST PROCEDURES DOCUMENTED (NOT EXECUTED)  
**Scope:** Production validation tests  

---

## EXECUTIVE SUMMARY

**Total tests:** 12 critical paths  
**Estimated time:** 30-45 minutes  
**Pass/fail criteria:** All must PASS (no partial success)  
**Prerequisites:** App deployed to Render, migrations run, env vars set  

---

## PRE-TEST CHECKLIST

Before running any tests:

- [ ] Backend deployed to Render (https://puntocero-legal-api-xxx.onrender.com)
- [ ] Health check passes: `curl /api/health` → 200
- [ ] MongoDB connected: Check Render logs for "MongoDB client initialized"
- [ ] Migrations completed: `python migrations/*.py --status` shows APPLIED
- [ ] All environment variables set (see DEPLOY_ENVIRONMENT.md)
- [ ] Test user credentials available

---

## TEST EXECUTION ENVIRONMENT

**Base URL:** `https://puntocero-legal-api-xxx.onrender.com`  
**API version:** v1 (default)  
**Client:** curl / Postman / Thunder Client  

**Headers (required for all requests except auth):**
```
Authorization: Bearer <jwt-token>
X-Firm-ID: <firm_id>
X-Tenant-ID: <tenant_id>
Content-Type: application/json
```

---

## SMOKE TESTS (12 Critical Paths)

### TEST 1: HEALTH CHECK

**Objective:** Verify backend is running and responding

**Test:**
```bash
curl -i https://puntocero-legal-api-xxx.onrender.com/api/health
```

**Expected:**
- Status: 200 OK
- Response: `{"status": "ok"}` or similar
- Time: < 500ms

**Validation:**
- ✅ Can connect to backend
- ✅ Basic endpoint works
- ✅ No 500 errors

**If fails:**
- Check Render logs for startup errors
- Verify MongoDB connection
- Check environment variables

---

### TEST 2: REGISTRATION

**Objective:** New user can register

**Test:**
```bash
curl -X POST https://puntocero-legal-api-xxx.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-'$(date +%s)'@example.com",
    "password": "Test1234!",
    "name": "Test User",
    "country": "Colombia",
    "role": "lawyer"
  }'
```

**Expected:**
- Status: 201 Created
- Response: `{"user_id": "...", "email": "...", ...}`
- No 400/409 errors

**Validation:**
- ✅ User created
- ✅ Email stored
- ✅ Password hashed
- ✅ Tenant context created

**If fails:**
- Check Pydantic validation errors
- Verify MongoDB connection
- Check email validation

---

### TEST 3: LOGIN

**Objective:** User can authenticate and receive JWT

**Test:**
```bash
curl -X POST https://puntocero-legal-api-xxx.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-user@example.com",
    "password": "Test1234!"
  }'
```

**Expected:**
- Status: 200 OK
- Response: `{"access_token": "eyJ...", "token_type": "bearer"}`
- Token decodable (header.payload.signature)

**Validation:**
- ✅ JWT issued
- ✅ JWT valid (not corrupted)
- ✅ Contains sub (user ID)
- ✅ Contains firm_id / tenant_id

**Extract token for next tests:**
```bash
export TOKEN="<access_token_value>"
```

**If fails:**
- Check SECRET_KEY is set
- Check JWT_SECRET matches SECRET_KEY
- Verify user exists in database

---

### TEST 4: PROTECTED ENDPOINT (Auth check)

**Objective:** Verify authentication enforcement

**Test A - With valid token:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://puntocero-legal-api-xxx.onrender.com/api/users/me
```

**Expected:**
- Status: 200 OK
- Response: User info

**Test B - Without token:**
```bash
curl https://puntocero-legal-api-xxx.onrender.com/api/users/me
```

**Expected:**
- Status: 401 Unauthorized
- Response: {"detail": "Not authenticated"}

**Test C - With invalid token:**
```bash
curl -H "Authorization: Bearer invalid-token-here" \
  https://puntocero-legal-api-xxx.onrender.com/api/users/me
```

**Expected:**
- Status: 401 Unauthorized

**Validation:**
- ✅ Valid tokens accepted
- ✅ Missing token rejected
- ✅ Invalid tokens rejected
- ✅ No 500 errors (handled gracefully)

**If fails:**
- Check JWT validation in utils/auth.py
- Verify token format
- Check Authorization header parsing

---

### TEST 5: CREATE FIRM

**Objective:** User can create a law firm

**Test:**
```bash
curl -X POST https://puntocero-legal-api-xxx.onrender.com/api/firms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Firm-ID: $FIRM_ID" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "name": "Test Firm ' $(date +%s) '",
    "legal_name": "Test Firma Juridica S.A.S.",
    "country": "Colombia",
    "city": "Bogotá",
    "address": "Cra 7 #1234"
  }'
```

**Expected:**
- Status: 201 Created
- Response: `{"firm_id": "...", "name": "...", ...}`

**Validation:**
- ✅ Firm created
- ✅ Assigned to user
- ✅ Tenant isolation applied

**If fails:**
- Check firm creation route exists
- Verify tenant headers sent
- Check MongoDB write permissions

---

### TEST 6: CREATE CASE

**Objective:** Can create a legal case

**Test:**
```bash
curl -X POST https://puntocero-legal-api-xxx.onrender.com/api/cases \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Firm-ID: $FIRM_ID" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "title": "Case Test ' $(date +%s) '",
    "description": "Test case for smoke testing",
    "materia": "civil",
    "status": "abierto"
  }'
```

**Expected:**
- Status: 201 Created
- Response: `{"case_id": "...", "title": "...", ...}`

**Validation:**
- ✅ Case created
- ✅ Linked to firm
- ✅ Tenant isolation applied

**If fails:**
- Check case creation route
- Verify tenant context
- Check MongoDB indexes

---

### TEST 7: UPLOAD DOCUMENT

**Objective:** Can upload document to case

**Test:**
```bash
# Create test file
echo "Test document content" > /tmp/test.txt

# Upload
curl -X POST https://puntocero-legal-api-xxx.onrender.com/api/cases/$CASE_ID/documents \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Firm-ID: $FIRM_ID" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -F "file=@/tmp/test.txt"
```

**Expected:**
- Status: 201 Created
- Response: `{"document_id": "...", "filename": "...", "size": ...}`

**Validation:**
- ✅ File uploaded
- ✅ Stored in MongoDB or Drive
- ✅ Accessible to user
- ✅ Tenant isolation

**If fails:**
- Check multipart form handling
- Verify file storage configured
- Check storage permissions

---

### TEST 8: AI CHAT

**Objective:** AI legal assistant responds to queries

**Test:**
```bash
curl -X POST https://puntocero-legal-api-xxx.onrender.com/api/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Firm-ID: $FIRM_ID" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "message": "¿Qué es un contrato de arrendamiento?",
    "session_id": "test-session-' $(date +%s) '",
    "template": "legal_assistant",
    "lawyer_id": "'$USER_ID'",
    "country": "Colombia"
  }'
```

**Expected:**
- Status: 200 OK
- Response: `{"response": "Un contrato de arrendamiento...", "session_id": "...", ...}`
- Response time: 5-15 seconds (API call to Gemini)

**Validation:**
- ✅ Gemini API reachable
- ✅ JWT auth working
- ✅ Tenant isolation applied
- ✅ Rate limiting not triggered
- ✅ Session created/stored

**If fails:**
- Check GEMINI_API_KEY is set
- Check header binding fix (from RC)
- Check JWT_SECRET matches
- Verify rate limits not exceeded
- Check MongoDB ai_sessions collection

---

### TEST 9: AI USAGE TRACKING

**Objective:** Can retrieve AI usage stats

**Test:**
```bash
curl https://puntocero-legal-api-xxx.onrender.com/api/ai/usage/$USER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Firm-ID: $FIRM_ID" \
  -H "X-Tenant-ID: $TENANT_ID"
```

**Expected:**
- Status: 200 OK
- Response: `{"user_id": "...", "requests_this_month": 1, ...}`

**Validation:**
- ✅ Usage tracked
- ✅ Counters accurate
- ✅ Tenant isolation

**If fails:**
- Check ai_usage collection indexes
- Verify atomic increment operations
- Check tenant field mapping

---

### TEST 10: MERCADOPAGO PAYMENT

**Objective:** Payment initiation works

**Test:**
```bash
curl -X POST https://puntocero-legal-api-xxx.onrender.com/api/payment/init \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Firm-ID: $FIRM_ID" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "plan_id": "pro_monthly",
    "country": "Colombia",
    "currency": "COP"
  }'
```

**Expected:**
- Status: 200 OK
- Response: `{"preference_url": "https://www.mercadopago.com/...", ...}`
- URL is clickable and leads to MP portal

**Validation:**
- ✅ MP API reachable
- ✅ Token valid
- ✅ Preference created
- ✅ URL returned

**If fails:**
- Check MP_ACCESS_TOKEN is set
- Check APP_PUBLIC_URL is correct
- Verify MP API credentials (sandbox vs prod)
- Check webhook URL configuration

**Important:** Do NOT complete payment in sandbox  
(Unless testing payment webhook, see Rollback Plan)

---

### TEST 11: EMAIL CONFIGURATION

**Objective:** Verify email can be sent

**Test (simulate via admin action that triggers email):**
```bash
curl -X POST https://puntocero-legal-api-xxx.onrender.com/api/admin-ops/billing/$INVOICE_ID/reminder \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Firm-ID: $FIRM_ID" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{}'
```

**Expected:**
- Status: 200 OK
- Email received at `SMTP_FROM` address within 30 seconds
- Subject: "Invoice Reminder"
- Body: Contains invoice details

**Validation:**
- ✅ SMTP connection works
- ✅ Email sent
- ✅ No authentication errors
- ✅ No timeout errors

**If fails:**
- Check SMTP_HOST, SMTP_USER, SMTP_PASS
- Verify Gmail app password (not main password)
- Check firewall/security policies
- Check Render logs for SMTP errors

---

### TEST 12: LOGS AND SOC

**Objective:** System is logging events

**Test:**
```bash
# Check Render logs
curl https://puntocero-legal-api-xxx.onrender.com/api/health
# Then check Render dashboard → Logs

# Check SOC events (if accessible)
# Query MongoDB directly (or via admin endpoint)
db.soc_events.find().limit(5)
```

**Expected:**
- ✅ Logs appear in Render dashboard
- ✅ SOC events written to database
- ✅ Payment events in soc_events collection
- ✅ AI auth events logged
- ✅ No sensitive data in logs

**Validation:**
- ✅ Logging configured
- ✅ SOC integration working
- ✅ Payment events tracked
- ✅ Security audit trail created

**If fails:**
- Check logging.basicConfig in server.py
- Verify db.soc_events.insert working
- Check MongoDB write permissions

---

## SMOKE TEST RESULT MATRIX

| Test | Objective | Status | Notes |
|------|-----------|--------|-------|
| 1 | Health check | ⬜ | Required |
| 2 | Registration | ⬜ | Required |
| 3 | Login | ⬜ | Required (enables others) |
| 4 | Auth enforcement | ⬜ | Security critical |
| 5 | Create firm | ⬜ | Business flow |
| 6 | Create case | ⬜ | Business flow |
| 7 | Upload document | ⬜ | Feature |
| 8 | AI chat | ⬜ | Critical feature |
| 9 | AI usage | ⬜ | Tracking |
| 10 | Payment | ⬜ | Revenue critical |
| 11 | Email | ⬜ | Notification critical |
| 12 | Logs/SOC | ⬜ | Audit critical |

**Go/No-go decision:**
- ✅ GO if: All 12 tests pass
- ⚠️ GO WITH CONDITIONS if: Tests 1-4, 8, 10, 12 pass (others can be fixed after launch)
- ❌ NO-GO if: Any of tests 1-4, 8, 10, 12 fail

---

## TEST TROUBLESHOOTING REFERENCE

| Symptom | Likely Cause | Check |
|---------|--------------|-------|
| All tests fail with 5xx | App crashed | Render logs |
| 401 Unauthorized | JWT issues | JWT_SECRET, SECRET_KEY |
| 403 Forbidden | Tenant isolation | X-Firm-ID, X-Tenant-ID headers |
| Payment fails | MP config | MP_ACCESS_TOKEN, APP_PUBLIC_URL |
| Email not sent | SMTP config | SMTP_USER, SMTP_PASS, Gmail app password |
| AI returns error | Gemini/Claude | GEMINI_API_KEY, ANTHROPIC_API_KEY |
| Slow responses | Cold start or DB | Monitor memory, check indexes |

---

## NEXT STEP

After all tests pass:
→ See `.builder/ROLLBACK_PLAN.md` for disaster recovery

---

**Status:** Smoke test procedures documented.  
**Ready to execute after deployment.**
