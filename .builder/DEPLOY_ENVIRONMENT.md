# RELEASE 1.0 — ENVIRONMENT VARIABLES AUDIT
**Date:** 2026-07-07  
**Status:** AUDIT ONLY (NO CODE MODIFICATIONS)  
**Scope:** All environment variables required for production deployment  

---

## EXECUTIVE SUMMARY

**Total variables:** 30+  
**Obligatorias (must-have):** 11  
**Opcionales (can be empty):** 12  
**Solo desarrollo:** 2  
**Solo producción:** 4  

**Critical findings:** 3 (documented below)

---

## PART 1: VARIABLE CATALOG

### OBLIGATORIAS (MUST-HAVE FOR PRODUCTION)

These variables **MUST** be set before going live. The app will fail without them.

#### 1. **MONGO_URL**
- **Type:** Connection String
- **Required:** YES (CRITICAL)
- **Default:** None (fails if missing)
- **Source:** `backend/.env.example`, `render.yaml`
- **Usage:** MongoDB connection
  - Location: `backend/server.py:120`
  - Fallback: None (will crash)
- **Format:** 
  ```
  mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
  ```
- **Where to get:**
  - MongoDB Atlas: https://www.mongodb.com/cloud/atlas
  - Create cluster → get connection string
  - Replace `<username>`, `<password>`, `<database>`
- **Set in Render:** Environment → Add Variable
- **Risk:** Without this, app cannot start
- **Test:** `backend/server.py` line 120-130 initializes client

---

#### 2. **DB_NAME**
- **Type:** String
- **Required:** YES
- **Default:** `puntocero_legal`
- **Source:** `render.yaml`, `.env.example`
- **Usage:** MongoDB database name
  - Used in: `backend/server.py:131`, `backend/migrations/run_migration.py:235`
  - Used in: `backend/seeds/`, `create_test_users.py`
- **Value:** `puntocero_legal` (keep as-is)
- **Risk:** Low (has sensible default)
- **Test:** App initializes MongoDB client successfully

---

#### 3. **SECRET_KEY**
- **Type:** Cryptographic Key (32+ chars, random)
- **Required:** YES (CRITICAL)
- **Default:** None — Render auto-generates via `generateValue: true`
- **Source:** `render.yaml`, `.env.example`
- **Usage:** JWT signing and verification
  - Location: `backend/utils/auth.py:10`
  - Used in: `backend/services/enterprise_auth_service.py:24` (as fallback)
- **Render setup:** `generateValue: true` → auto-generates secure value
  - ✅ Do NOT set manually
  - Render will create random 32-char key
- **Critical:** Must be cryptographically strong (Render handles this)
- **Test:** Tokens decode without error
- **⚠️ FINDING #1:** See "Critical Findings" section below

---

#### 4. **JWT_SECRET**
- **Type:** Cryptographic Key (32+ chars, random)
- **Required:** YES (CRITICAL)
- **Default:** None — MUST match SECRET_KEY
- **Source:** `backend/.env.example:16` (added in RC fix)
- **Usage:** JWT decode in enterprise auth service
  - Location: `backend/services/enterprise_auth_service.py:24`
  - Used in: `backend/routes/ai.py:55` (`decode_jwt_token()`)
- **Value:** Must equal `SECRET_KEY` exactly
- **Render setup:** Set to same value as `SECRET_KEY`
- **Test:** AI endpoint authentication succeeds
- **Risk:** If not set or different from SECRET_KEY, JWT validation fails
- **⚠️ FINDING #2:** See "Critical Findings" section below

---

#### 5. **CORS_ORIGINS**
- **Type:** Comma-separated URLs
- **Required:** YES (for security)
- **Default:** `*` (unsafe for production)
- **Source:** `render.yaml`, `backend/server.py:572-573`
- **Usage:** CORS whitelist for frontend requests
  - Used in: `backend/server.py:572` gets from env
  - Used in: FastAPI CORS middleware
- **Production value:**
  ```
  https://puntocerolegal.vercel.app,https://www.puntocerolegal.com
  ```
- **Do NOT use:** `*` in production (security risk)
- **Vercel URL:** Get from Vercel dashboard after deploying frontend
- **Format:** No spaces, comma-separated
- **Risk:** CRITICAL — Opens to CSRF if set to `*`
- **Test:** Frontend can call backend; other origins rejected

---

#### 6. **APP_PUBLIC_URL**
- **Type:** URL
- **Required:** YES (for webhooks, links)
- **Default:** None
- **Source:** `render.yaml`, `backend/routes/payment.py:345`, `backend/routes/invoices.py:24`
- **Usage:** 
  - Payment webhook callbacks (MercadoPago)
  - Email links (invoices, documents)
  - Frontend referral links
- **Render setup:** Render provides URL after deploy: `https://puntocero-legal-api-xxx.onrender.com`
- **Format:** Base URL, no trailing slash
- **Risk:** Without this, payment webhooks won't work
- **Test:** MercadoPago callbacks return 200 OK

---

#### 7. **GEMINI_API_KEY**
- **Type:** API Key
- **Required:** YES (for AI)
- **Default:** None (AI endpoint returns error if missing)
- **Source:** `backend/.env.example`, `render.yaml`
- **Usage:** Google Gemini API for legal assistant
  - Location: `backend/routes/ai.py:310`
  - Endpoint: `/api/ai/chat`
- **Where to get:**
  - Google Cloud Console: https://console.cloud.google.com/
  - Enable Generative Language API
  - Create API key (not OAuth)
  - Key format: `AIza...` (usually)
- **Risk:** HIGH — AI feature completely unavailable without this
- **Test:** `/api/ai/chat` responds with legal content

---

#### 8. **ANTHROPIC_API_KEY**
- **Type:** API Key
- **Required:** YES (for Claude fallback)
- **Default:** None (but Gemini primary, so app won't crash)
- **Source:** `backend/.env.example`, `render.yaml`
- **Usage:** Claude fallback if Gemini fails
  - Location: `backend/routes/ai.py:243`
  - Also used: `backend/routes/chatbot.py:198`
- **Where to get:**
  - Anthropic Console: https://console.anthropic.com/
  - Create API key
  - Key format: `sk-ant-...`
- **Fallback behavior:**
  - Gemini unavailable → falls back to Claude
  - Both unavailable → AI error
- **Risk:** MEDIUM — AI degrades if missing
- **Test:** Chatbot fallback works when Gemini down

---

#### 9. **SMTP_HOST**, **SMTP_PORT**, **SMTP_USER**, **SMTP_PASS**
- **Type:** String, Integer, String, String
- **Required:** YES (for email notifications)
- **Default (example):** `smtp.gmail.com`, `587`, email, app password
- **Source:** `backend/.env.example`, `render.yaml`
- **Usage:** Send email notifications
  - Payment confirmations: `backend/routes/payment.py:480`
  - Admin alerts: `backend/utils/notifier.py:77-82`
  - Case assignments: `backend/routes/cases.py`
- **Gmail setup (recommended):**
  1. Enable 2-Factor Authentication
  2. Generate App Password (16 chars): https://myaccount.google.com/apppasswords
  3. Set: `SMTP_USER=your-email@gmail.com`, `SMTP_PASS=generated-password`
- **Risk:** HIGH — Customer emails won't send without this
- **Test:** Email received after payment
- **Notes:**
  - `SMTP_FROM` = same as `SMTP_USER` (or configured separately)
  - Port 587 = TLS (standard)
  - Never use plaintext passwords in .env file directly

---

#### 10. **MP_ACCESS_TOKEN**
- **Type:** API Token
- **Required:** YES (for payments)
- **Default:** Empty string (payment init returns error)
- **Source:** `backend/.env.example`, `render.yaml`
- **Usage:** MercadoPago payment gateway
  - Location: `backend/routes/payment.py:341`
  - Used in: `/api/payment/init`, webhook handler
- **Where to get:**
  - MercadoPago Business Account: https://www.mercadopago.com.ar/
  - Credentials: Settings → Credentials
  - Copy "Access Token" (not Client ID)
  - Starts with: `TEST-...` (sandbox) or `APP_USR-...` (production)
- **Sandbox vs Production:**
  - Dev: Use `TEST-` token (sandbox)
  - Prod: Use `APP_USR-` token (live money)
- **Risk:** CRITICAL — Payments completely broken without this
- **Test:** Payment flow reaches MercadoPago portal

---

#### 11. **META_ACCESS_TOKEN** (if using WhatsApp)
- **Type:** API Token
- **Required:** Conditional (YES if using WhatsApp)
- **Default:** None
- **Source:** `backend/.env.example`, `render.yaml`
- **Usage:** Meta WhatsApp Cloud API
  - Location: `backend/utils/notifier.py:169-174`
  - Optional: Will skip if not set
- **Where to get:**
  - Meta Business Platform: https://business.facebook.com/
  - Apps → WhatsApp → Settings → API Access
  - Generate/copy Temporary Token
- **Related vars:**
  - `META_PHONE_NUMBER_ID` — Your WhatsApp number ID
  - `META_APP_ID` — Your app ID
  - `META_APP_SECRET` — Your app secret
  - `META_VERIFY_TOKEN` — Webhook verification (you create this)
  - `META_GRAPH_VERSION` — Usually `v21.0`
- **Risk:** MEDIUM — WhatsApp notifications skip silently if missing
- **Test:** WhatsApp message sent on case assignment (if enabled)

---

### OPCIONALES (CAN BE EMPTY)

These variables have graceful fallbacks or are not critical for MVP.

#### 12. **GEMINI_MODEL**
- **Type:** String
- **Default:** `gemini-flash-latest`
- **Usage:** Which Gemini model to use
- **Values:** `gemini-2.0-flash-exp`, `gemini-pro`, etc.
- **Risk:** LOW — sensible default
- **Source:** `backend/routes/ai.py:29`

---

#### 13. **CLAUDE_MODEL**
- **Type:** String
- **Default:** `claude-opus-4-8`
- **Usage:** Which Claude model for fallback
- **Risk:** LOW — only used if Gemini fails
- **Source:** `backend/routes/ai.py:32`

---

#### 14. **MP_PUBLIC_KEY**
- **Type:** API Key (public)
- **Default:** Empty (Render provides)
- **Usage:** MercadoPago client-side integration
  - Not currently used in code (scaffolding)
  - Kept for future frontend integration
- **Risk:** LOW — not required for backend
- **Source:** `render.yaml`, `backend/routes/payment.py:342`

---

#### 15. **GOOGLE_SERVICE_ACCOUNT_JSON** & **GOOGLE_DRIVE_FOLDER_ID**
- **Type:** JSON string, Folder ID
- **Default:** None (disabled)
- **Usage:** Optional Google Drive backup storage
  - Location: `backend/utils/drive_service.py:29-56`
  - Graceful fallback: Uses MongoDB if not configured
- **Risk:** LOW — optional feature
- **Source:** `backend/.env.example`

---

#### 16. **TWILIO_ACCOUNT_SID**, **TWILIO_AUTH_TOKEN**, **TWILIO_WHATSAPP_FROM**
- **Type:** Credentials
- **Default:** None (disabled, uses Meta if available)
- **Usage:** Alternative WhatsApp provider (not recommended)
  - Location: `backend/utils/notifier.py:190-193`
  - Only used if Meta not configured
- **Risk:** LOW — alternative only
- **Source:** `backend/.env.example` (commented out)

---

#### 17. **AI_RATE_LIMIT_MINUTE**, **AI_RATE_LIMIT_HOUR**, **AI_RATE_LIMIT_DAY**
- **Type:** Integer
- **Default:** 20 per minute, 200 per hour, 1000 per day
- **Usage:** Rate limiting for AI endpoint
  - Location: `backend/routes/ai.py:22-25`
  - Enforced by `slowapi` limiter
- **Risk:** LOW — has good defaults
- **Source:** Code defaults

---

#### 18-19. **ADMIN_EMAIL**, **ADMIN_WHATSAPP_NUMBER**
- **Type:** Email, Phone
- **Default:** `puntocerolegal@gmail.com`, `+573028322083`
- **Usage:** Alerts to admin
  - Location: `backend/utils/notifier.py:28-30`
  - Used when payment approved, case assigned
- **Risk:** LOW — has fallback defaults
- **Source:** `backend/.env.example` (not listed, but in code)

---

#### 20. **META_VERIFY_TOKEN**
- **Type:** String (you create this)
- **Default:** `puntocerolegal`
- **Usage:** Webhook verification from Meta
  - Location: `backend/routes/chatbot.py:492`
  - Meta sends this in handshake; you must match it
- **Setup:** Choose any string, set in Meta dashboard webhook settings
- **Risk:** LOW — optional (WhatsApp setup only)
- **Source:** `render.yaml`

---

### SOLO DESARROLLO (DEVELOPMENT ONLY)

These variables should **NOT** be set in production.

#### 21. **PYTHON_VERSION**
- **Value:** `3.11.11`
- **Where:** `render.yaml`, line 14
- **Purpose:** Specifies Python runtime version
- **Production:** Use same as local development
- **Note:** Currently pinned to 3.11.11 (good practice)

---

#### 22. **Uvicorn debug mode**
- **Current:** `uvicorn server:app --host 0.0.0.0 --port $PORT`
- **Issue:** No `--reload` flag (correct for production)
- **Risk:** NONE — configured correctly

---

### SOLO PRODUCCIÓN (PRODUCTION-ONLY)

#### 23. **RENDER_DEPLOY_HOOK** (optional)
- **Type:** URL
- **Purpose:** Trigger deploys via webhook
- **Risk:** LOW — optional feature
- **Current:** Not configured (OK)

---

#### 24. **SENTRY_DSN** (recommended but not required)
- **Type:** URL
- **Purpose:** Error tracking in production
- **Current:** Not configured
- **Recommendation:** Add in Release 1.1
- **⚠️ FINDING #3:** See "Critical Findings" section below

---

---

## PART 2: CRITICAL FINDINGS

### 🔴 FINDING #1: SECRET_KEY and JWT_SECRET Require Synchronization

**Severity:** CRITICAL  
**File:** `render.yaml` line 29, `backend/.env.example` line 15-16  
**Status:** DOCUMENTED, NOT FIXED (code change required would violate freeze)

**Problem:**
- `SECRET_KEY` is auto-generated by Render (`generateValue: true`)
- `JWT_SECRET` is NOT auto-generated; must be set manually
- If `JWT_SECRET` ≠ `SECRET_KEY`, JWT validation fails
- AI endpoint returns 401 errors

**Evidence:**
```
render.yaml:28-30
- key: SECRET_KEY
  generateValue: true        # ← Auto-generated
- key: CORS_ORIGINS
  sync: false
# JWT_SECRET is missing from render.yaml!

backend/utils/auth.py:10
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-...")

backend/services/enterprise_auth_service.py:24
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-...")
```

**How to fix (in Render panel):**
1. After first deploy, Render generates `SECRET_KEY`
2. Copy the value of `SECRET_KEY`
3. Paste into `JWT_SECRET` field (must be identical)
4. Redeploy

**Recommendation:** Add `JWT_SECRET` to `render.yaml` with `generateValue: true`

---

### 🔴 FINDING #2: CORS_ORIGINS Not Set for Production

**Severity:** CRITICAL (Security)  
**File:** `render.yaml` line 34  
**Status:** DOCUMENTED, NOT FIXED

**Problem:**
- Currently set to `sync: false` (empty in production)
- Will default to `CORS_ORIGINS=*` from `.env.example`
- This opens system to CSRF attacks
- Any origin can make requests

**Evidence:**
```
backend/server.py:572-573
if os.environ.get('CORS_ORIGINS'):
    return os.environ.get('CORS_ORIGINS', '').split(',')
# If not set, falls back to ['*']
```

**How to fix (before going live):**
1. Deploy frontend to Vercel first
2. Get frontend URL: `https://puntocerolegal.vercel.app` or custom domain
3. Set `CORS_ORIGINS` in Render:
   ```
   https://puntocerolegal.vercel.app,https://www.puntocerolegal.com
   ```
4. Redeploy backend

**Critical:** Must be done BEFORE accepting real traffic

---

### 🟡 FINDING #3: No Error Tracking in Production

**Severity:** MEDIUM (Operational)  
**Current Status:** Not configured  
**Recommendation:** Add in Release 1.1

**Missing integration:**
- No Sentry, LogRocket, or error tracking service
- Production errors only visible in Render logs
- Hard to trace user-reported issues
- Can't proactively catch bugs

**Recommended:** Set up Sentry
1. Create free account: https://sentry.io/
2. Create project (Python / FastAPI)
3. Get DSN (looks like: `https://xxx@ooo.ingest.sentry.io/123456`)
4. Set `SENTRY_DSN` in Render
5. Add to `backend/server.py`:
   ```python
   import sentry_sdk
   sentry_sdk.init(dsn=os.environ.get("SENTRY_DSN"))
   ```

**For MVP:** Optional (logs are sufficient for first 72 hours)

---

---

## PART 3: VARIABLE CHECKLIST FOR RENDER DEPLOYMENT

### Before Clicking "Deploy"

- [ ] **MONGO_URL** — Production MongoDB Atlas connection string set
- [ ] **DB_NAME** — `puntocero_legal` (verified)
- [ ] **SECRET_KEY** — Let Render generate automatically
- [ ] **JWT_SECRET** — Set to match SECRET_KEY (do after first deploy)
- [ ] **CORS_ORIGINS** — Set to frontend URL (production domain)
- [ ] **APP_PUBLIC_URL** — Will be provided by Render after deploy
- [ ] **GEMINI_API_KEY** — Google Gemini API key set
- [ ] **ANTHROPIC_API_KEY** — Claude API key set
- [ ] **SMTP_HOST** — `smtp.gmail.com`
- [ ] **SMTP_PORT** — `587`
- [ ] **SMTP_USER** — Your Gmail address
- [ ] **SMTP_PASS** — Gmail app password (16 chars)
- [ ] **SMTP_FROM** — Same as SMTP_USER
- [ ] **MP_ACCESS_TOKEN** — MercadoPago access token (APP_USR-... for production)
- [ ] **META_ACCESS_TOKEN** — Meta WhatsApp token (if using WhatsApp)
- [ ] **META_PHONE_NUMBER_ID** — Meta WhatsApp phone ID (if using WhatsApp)
- [ ] **META_APP_ID** — Meta app ID (if using WhatsApp)
- [ ] **META_APP_SECRET** — Meta app secret (if using WhatsApp)
- [ ] **META_VERIFY_TOKEN** — Your chosen webhook token (if using WhatsApp)
- [ ] **META_GRAPH_VERSION** — `v21.0`

---

## PART 4: ENVIRONMENT CLASSIFICATION MATRIX

| Variable | Category | Required | Default | Risk | Notes |
|----------|----------|----------|---------|------|-------|
| MONGO_URL | Database | YES | None | CRITICAL | No fallback |
| DB_NAME | Database | YES | puntocero_legal | LOW | Sensible default |
| SECRET_KEY | Security | YES | Generated | CRITICAL | Render auto-generates |
| JWT_SECRET | Security | YES | None | CRITICAL | ⚠️ Must match SECRET_KEY |
| CORS_ORIGINS | Security | YES | * | CRITICAL | ⚠️ Opens to CSRF |
| APP_PUBLIC_URL | Integration | YES | None | CRITICAL | Webhooks won't work |
| GEMINI_API_KEY | AI | YES | None | CRITICAL | AI feature unavailable |
| ANTHROPIC_API_KEY | AI | YES | None | MEDIUM | Fallback only |
| SMTP_HOST/USER/PASS | Email | YES | Gmail | CRITICAL | No email without this |
| MP_ACCESS_TOKEN | Payments | YES | None | CRITICAL | Payments broken |
| META_ACCESS_TOKEN | Messaging | Conditional | None | MEDIUM | WhatsApp only |
| GEMINI_MODEL | AI | NO | gemini-flash-latest | LOW | Good default |
| TWILIO_* | Messaging | NO | None | LOW | Alternative only |
| GOOGLE_* | Storage | NO | None | LOW | Optional backup |
| PYTHON_VERSION | Runtime | NO | 3.11.11 | LOW | Fixed value |

---

## PART 5: CONFIGURATION VERIFICATION SCRIPT

For Release Engineer to run before deployment:

```bash
#!/bin/bash
# Verify all critical variables are set in Render

echo "Checking critical variables..."
critical_vars=(
  "MONGO_URL"
  "SECRET_KEY"
  "JWT_SECRET"
  "CORS_ORIGINS"
  "APP_PUBLIC_URL"
  "GEMINI_API_KEY"
  "SMTP_USER"
  "SMTP_PASS"
  "MP_ACCESS_TOKEN"
)

for var in "${critical_vars[@]}"; do
  value=$(curl -s https://your-render-service.onrender.com/api/health | grep -o "\"$var\"" || echo "NOT SET")
  if [ "$value" = "NOT SET" ]; then
    echo "❌ $var is missing"
  else
    echo "✅ $var is set"
  fi
done
```

**Note:** Health endpoint doesn't expose env vars (correct for security). Manual verification required.

---

## CONCLUSION

**Status:** All variables identified and documented.  
**Action required:** Set 11 obligatory variables in Render panel before deploying.  
**Critical blockers:** 3 findings documented above.  
**Estimated setup time:** 30 minutes  

**Next:** See `.builder/DEPLOY_MIGRATIONS.md` for database setup.
