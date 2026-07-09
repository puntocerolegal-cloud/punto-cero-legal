# PUNTO CERO LEGAL — RELEASE 1.1
## Live Validation Checklist

**Date:** 2026-07-07  
**Purpose:** Validate all 5 bloqueadores work correctly in live environment  
**Status:** READY FOR EXECUTION (Post-migration)  
**Execution Level:** QA/Testing Team

---

## PRE-VALIDATION SETUP

Before running any tests, ensure:

- [ ] Database migration executed successfully (see R1_1_MIGRATION_GUIDE.md)
- [ ] All 12 indexes created (verified with `db.getIndexes()`)
- [ ] Backend server restarted with new code
- [ ] Frontend loaded (clear cache, refresh)
- [ ] Test user account created with proper permissions
- [ ] Test database isolated (use staging, not production)

---

## VALIDATION ENVIRONMENT

```
Frontend:  http://localhost:3000 (or staging URL)
Backend:   http://localhost:8000 (or staging URL)
Database:  MongoDB staging instance
User:      test.user@puntocero.local
JWT:       Generated from login endpoint
```

---

## BLOQUEADOR 1: AUTHENTICATION VALIDATION

### Test 1.1: Request without JWT

**Steps:**
1. Open browser dev tools (F12)
2. Open Network tab
3. Navigate to `/api/ai/chat`
4. Try to send a message to AI without logging in first

**Expected Result:**
- ❌ Request should fail with 401 Unauthorized
- Response: `{"detail": "Autorización requerida"}`

**Actual Result:**
- [ ] ✅ Got 401 Unauthorized
- [ ] ❌ Got different error (describe):
- [ ] ❌ Request succeeded (CRITICAL FAILURE)

---

### Test 1.2: Request with invalid JWT

**Steps:**
1. Log in normally to get valid JWT
2. Open dev tools → Application tab
3. Find JWT token in localStorage
4. Modify a few characters in the JWT
5. Save and refresh page
6. Try to ask AI a question

**Expected Result:**
- ❌ Request should fail with 401 Unauthorized
- Response: `{"detail": "Autenticación inválida"}`

**Actual Result:**
- [ ] ✅ Got 401 Unauthorized
- [ ] ❌ Got different error (describe):
- [ ] ❌ Request succeeded (CRITICAL FAILURE)

---

### Test 1.3: User permission check

**Steps:**
1. Create two test users: lawyer_1, lawyer_2
2. Ensure lawyer_1 has `ai_access` permission
3. Ensure lawyer_2 does NOT have `ai_access` permission
4. Log in as lawyer_1, ask a question (should work)
5. Log in as lawyer_2, try to ask a question

**Expected Result for lawyer_2:**
- ❌ Request should fail with 403 Forbidden
- Response: `{"detail": "Sin permisos para acceder a IA"}`

**Actual Result:**
- [ ] ✅ lawyer_1 can ask questions
- [ ] ✅ lawyer_2 gets 403 Forbidden
- [ ] ❌ lawyer_2 can also ask questions (SECURITY FAILURE)

---

## BLOQUEADOR 2: SESSION OWNERSHIP VALIDATION

### Test 2.1: Access own session

**Steps:**
1. Log in as user_1
2. Start a new conversation (create session_id)
3. Send message 1: "Hello"
4. Send message 2: "Can you help?"
5. Verify both messages in response

**Expected Result:**
- ✅ Both messages processed
- ✅ Session created with owner_user_id = user_1
- ✅ Session persisted in MongoDB

**Verify in MongoDB:**
```javascript
db.ai_sessions.findOne({ session_id: "your_session_id" })
// Should show: "owner_user_id": "user_1_id"
```

**Actual Result:**
- [ ] ✅ Messages processed correctly
- [ ] ✅ Database has owner_user_id set
- [ ] ❌ Database missing owner_user_id (CRITICAL)

---

### Test 2.2: Attempt to access another user's session

**Steps:**
1. Log in as user_1
2. Get user_1's session_id from /api/ai/usage/{user_1_id}
3. Log out
4. Log in as user_2
5. Try to use user_1's session_id in a new message

**Expected Result:**
- ❌ Request should fail with 403 Forbidden
- Response: `{"detail": "No tienes permiso para acceder a esta sesión"}`
- Event should be logged to `soc_events` table

**Verify in MongoDB:**
```javascript
db.soc_events.findOne({
  event_type: "unauthorized_session_access",
  user_id: "user_2_id"
})
// Should exist with severity: "high"
```

**Actual Result:**
- [ ] ✅ Got 403 Forbidden
- [ ] ✅ Event logged to SOC
- [ ] ❌ user_2 could access user_1's session (SECURITY FAILURE)
- [ ] ❌ No SOC event logged (LOGGING FAILURE)

---

### Test 2.3: Tenant isolation

**Steps:**
1. Create two organizations (firms): firm_A, firm_B
2. Create user_A assigned to firm_A (tenant_A)
3. Create user_B assigned to firm_B (tenant_B)
4. Log in as user_A
5. Start a conversation
6. Log in as user_B
7. Try to access user_A's session_id

**Expected Result:**
- ❌ Request should fail with 403 Forbidden
- ✅ Tenant mismatch detected

**Actual Result:**
- [ ] ✅ Cross-tenant access blocked
- [ ] ❌ user_B could access user_A's session (CRITICAL FAILURE)

---

## BLOQUEADOR 3: RATE LIMITING VALIDATION

### Test 3.1: Rate limit counter works

**Steps:**
1. Log in as user_1
2. Check /api/ai/usage/user_1_id
3. Note the current count (e.g., count=5)
4. Send 3 more messages
5. Check /api/ai/usage/user_1_id again

**Expected Result:**
- ✅ Count increased from 5 to 8
- ✅ Usage shows period (e.g., "2026-07")
- ✅ Usage shows daily limit (1000)

**Response format:**
```json
{
  "used": 8,
  "period": "2026-07",
  "limit_per_day": 1000,
  "free": true
}
```

**Actual Result:**
- [ ] ✅ Count incremented correctly
- [ ] ❌ Count not updated (RATE LIMIT FAILURE)
- [ ] ❌ Database shows wrong count (DATA INTEGRITY ISSUE)

---

### Test 3.2: Rate limiter enforces per-minute limit

**Environment:**
- Set `AI_RATE_LIMIT_MINUTE=5` (5 requests per minute)

**Steps:**
1. In quick succession, send 6 messages as fast as possible
2. Observe responses

**Expected Result:**
- ✅ First 5 requests succeed
- ❌ 6th request fails with 429 (rate limited)
- Response could include: `{"detail": "Rate limit exceeded"}`

**Actual Result:**
- [ ] ✅ Got rate limited on 6th request
- [ ] ❌ All 6 requests succeeded (RATE LIMITING NOT WORKING)
- [ ] ⚠️ Got different error (describe):

---

### Test 3.3: Rate limit abuse logged

**Steps:**
1. Set `AI_RATE_LIMIT_DAY=10` (low for testing)
2. Send 11 messages throughout the day
3. Check MongoDB rate_limit_logs

**Expected Result:**
- ✅ Events logged to `rate_limit_logs` when limit exceeded
- Event schema:
```json
{
  "timestamp": "ISO",
  "user_id": "...",
  "tenant_id": "...",
  "count": 11,
  "limit": 10,
  "period": "2026-07",
  "severity": "high"
}
```

**Actual Result:**
- [ ] ✅ Abuse logged correctly
- [ ] ❌ No logs created (LOGGING FAILURE)

---

## BLOQUEADOR 4: DATABASE INDEXES VALIDATION

### Test 4.1: Indexes exist

**Steps:**
```javascript
use puntocero_legal

// Check each collection
db.ai_sessions.getIndexes()
db.ai_usage.getIndexes()
db.rate_limit_logs.getIndexes()
db.soc_events.getIndexes()
db.ai_conversation_logs.getIndexes()
```

**Expected Result:**
All 12 indexes should be present:
- [ ] ✅ ai_sessions: 4 indexes (session_id, owner_tenant, tenant_updated, session_owner)
- [ ] ✅ ai_usage: 2 indexes (user_period, tenant_period)
- [ ] ✅ rate_limit_logs: 2 indexes
- [ ] ✅ soc_events: 2 indexes
- [ ] ✅ ai_conversation_logs: 2 indexes

**Actual Result:**
- [ ] ✅ All 12 indexes present
- [ ] ⚠️ Missing indexes (list):

---

### Test 4.2: Performance improvement

**Steps:**
1. Measure query time BEFORE optimization:
```javascript
var start = new Date()
db.ai_sessions.find({ session_id: "test" }).explain("executionStats")
var end = new Date()
console.log("Time:", end - start, "ms")
```

2. Now with index, it should be faster

**Expected Result:**
- ✅ Query uses index (check executionStats.executionStages.stage)
- ✅ COLLSCAN → IXSCAN (uses index scan instead of collection scan)
- ✅ Speed improvement: 10ms → 1ms

**Actual Result:**
- [ ] ✅ Query uses indexes (IXSCAN)
- [ ] ❌ Still doing collection scan (COLLSCAN)

---

## BLOQUEADOR 5: RACE CONDITION VALIDATION

### Test 5.1: Concurrent message append (2 concurrent requests)

**Steps:**
1. Open browser Developer Tools
2. Start a conversation (get session_id)
3. Prepare two identical chat requests
4. Send both simultaneously using Promise.all:
```javascript
Promise.all([
  fetch('/api/ai/chat', { method: 'POST', body: {...} }),
  fetch('/api/ai/chat', { method: 'POST', body: {...} })
])
```

5. Check MongoDB to verify both messages are in history

**Expected Result:**
- ✅ Both responses received successfully
- ✅ Both messages in session history (2 user + 2 model messages)
- ✅ No message loss

**Verify in MongoDB:**
```javascript
db.ai_sessions.findOne({ session_id: "..." })
// messages array should have 4 items, not 2
```

**Actual Result:**
- [ ] ✅ Both messages persisted (no race condition)
- [ ] ❌ Only 1 message in history (message loss - CRITICAL)

---

### Test 5.2: Concurrent message append (5 concurrent requests)

**Steps:**
1. Repeat test 5.1 but with 5 concurrent requests
2. All should add their messages without losing any

**Expected Result:**
- ✅ All 5 responses received
- ✅ All 10 messages in session (5 user + 5 model)

**Actual Result:**
- [ ] ✅ No message loss
- [ ] ❌ Some messages lost (CRITICAL - race condition not fixed)

---

## BLOQUEADOR 1+2+3: SECURITY FLOW INTEGRATION

### Test 6.1: Complete authentication + ownership + rate limit flow

**Steps:**
1. User_1 logs in
2. Sends message 1: "What is tort law?"
3. Sends message 2: "Define negligence"
4. Check that:
   - JWT validated ✅
   - Session owned by user_1 ✅
   - Messages counted in rate limit ✅
   - SOC logged successfully ✅

**Expected Result:**
- ✅ Message 1 processed
- ✅ Message 2 processed
- ✅ Session created with ownership
- ✅ Usage count = 2
- ✅ No unauthorized access events

**Actual Result:**
- [ ] ✅ All security layers working
- [ ] ❌ Missing (describe):

---

## FALLBACK & PROVIDER VALIDATION

### Test 7.1: Gemini provider response

**Prerequisites:**
- Set GEMINI_API_KEY

**Steps:**
1. Ask a question
2. Check response quality
3. Check MongoDB ai_conversation_logs for provider = "gemini"

**Expected Result:**
- ✅ Response from Gemini
- ✅ Log shows provider = "gemini"

**Actual Result:**
- [ ] ✅ Gemini responding
- [ ] ❌ Got Claude instead (fallback unexpected)
- [ ] ⚠️ Different issue:

---

### Test 7.2: Claude fallback

**Prerequisites:**
- Temporarily unset GEMINI_API_KEY (for testing)
- Keep ANTHROPIC_API_KEY set

**Steps:**
1. Ask a question
2. Should automatically use Claude
3. Check logs for provider = "claude"

**Expected Result:**
- ✅ Response from Claude
- ✅ Fallback transparent to user
- ✅ Log shows provider = "claude"

**Actual Result:**
- [ ] ✅ Claude fallback working
- [ ] ❌ Got error instead
- [ ] ❌ User saw "no provider" error

---

## ERROR HANDLING VALIDATION

### Test 8.1: Both providers down

**Prerequisites:**
- Unset both GEMINI_API_KEY and ANTHROPIC_API_KEY

**Steps:**
1. Try to ask a question
2. Check response

**Expected Result:**
- ❌ Request fails with 503 Service Unavailable
- Response includes helpful message (not stacktrace)

**Actual Result:**
- [ ] ✅ Got 503 with message
- [ ] ❌ Got 500 internal error
- [ ] ❌ Got stacktrace exposed

---

### Test 8.2: Invalid JWT error handling

**Steps:**
1. Try to call /api/ai/chat with Authorization: Bearer "invalid"
2. Check response

**Expected Result:**
- ❌ Request fails with 401
- Response: `{"detail": "Autenticación inválida"}`
- No stacktrace

**Actual Result:**
- [ ] ✅ Clean 401 response
- [ ] ❌ Got 500 error
- [ ] ❌ Got stacktrace

---

## PERFORMANCE VALIDATION

### Test 9.1: Response time (baseline)

**Steps:**
1. Ask a simple question
2. Measure time from request to response
3. Record response time

**Expected Result:**
- ~3-5 seconds (normal for Gemini/Claude)

**Actual Result:**
- [ ] ✅ 3-5 seconds (normal)
- [ ] ⚠️ 5-10 seconds (slower than expected)
- [ ] ❌ >10 seconds (performance degradation)
- Actual time: _____ seconds

---

### Test 9.2: Concurrent load (5 users)

**Steps:**
1. Have 5 test users each send 2 messages simultaneously
2. Observe response times
3. Check database load

**Expected Result:**
- ✅ All 10 messages processed
- ✅ Response times <10 seconds each
- ✅ No timeouts

**Actual Result:**
- [ ] ✅ All processed without timeout
- [ ] ❌ Some requests timed out
- [ ] ❌ Database became slow
- [ ] ❌ Server crashed (CRITICAL)

---

## OBSERVABILITY & LOGGING VALIDATION

### Test 10.1: Conversation logs created

**Steps:**
1. Send 3 messages
2. Check MongoDB ai_conversation_logs

**Expected Result:**
- 3 documents should exist
- Schema includes: user_id, tenant_id, session_id, provider, message_length, response_length

**Verify:**
```javascript
db.ai_conversation_logs.find({ user_id: "user_1" })
```

**Actual Result:**
- [ ] ✅ Logs created correctly
- [ ] ❌ No logs (LOGGING FAILURE)
- [ ] ❌ Logs incomplete

---

### Test 10.2: SOC events logged for security issues

**Steps:**
1. Try unauthorized session access
2. Try invalid JWT
3. Check MongoDB soc_events

**Expected Result:**
- Events logged with:
  - event_type: "unauthorized_session_access"
  - severity: "high"
  - user_id: attacker ID
  - timestamp: ISO format

**Actual Result:**
- [ ] ✅ Security events logged
- [ ] ❌ Events not created (SECURITY BLIND SPOT)

---

## FINAL VALIDATION SUMMARY

Total Tests: 24  
Expected Passes: 24

### Results:

**Bloqueador 1 (Authentication):**
- [ ] 3/3 passing
- [ ] 2/3 passing
- [ ] <2/3 passing (FAILED)

**Bloqueador 2 (Session Ownership):**
- [ ] 3/3 passing
- [ ] 2/3 passing
- [ ] <2/3 passing (FAILED)

**Bloqueador 3 (Rate Limiting):**
- [ ] 3/3 passing
- [ ] 2/3 passing
- [ ] <2/3 passing (FAILED)

**Bloqueador 4 (Database Indexes):**
- [ ] 2/2 passing
- [ ] 1/2 passing
- [ ] 0/2 passing (FAILED)

**Bloqueador 5 (Race Conditions):**
- [ ] 2/2 passing
- [ ] 1/2 passing
- [ ] 0/2 passing (FAILED)

**Additional Validations:**
- [ ] Fallback working: ✅
- [ ] Error handling: ✅
- [ ] Performance acceptable: ✅
- [ ] Logging complete: ✅

---

## FINAL CERTIFICATION

### All tests pass? ✅ YES

**Status:** ✅ **READY FOR PRODUCTION DEPLOYMENT**

**Next steps:**
1. Document any warnings
2. Update release notes
3. Deploy to production
4. Monitor for 24 hours

### Some tests fail? ⚠️ PARTIAL

**Status:** ⚠️ **CONDITIONAL GO** (if failures are non-critical)

**Issues found:**
- [ ] List issues:

**Can deploy with workarounds?** YES / NO

### Critical tests fail? ❌ NO

**Status:** ❌ **NO GO - DO NOT DEPLOY**

**Critical failures:**
- [ ] List failures:

**Blocker resolution required before deployment.**

---

**End of Validation Checklist**

Perform this validation in staging environment first.  
Only deploy to production if ALL tests pass.

---

Next step: Final deployment decision and production rollout.
