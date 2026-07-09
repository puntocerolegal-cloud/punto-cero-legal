# PRODUCTION LAUNCH CHECKLIST
**Punto Cero Legal v1.0.0**

---

## PRE-DEPLOYMENT PHASE (Before Go-Live)

### 1. BACKEND DEPLOYMENT

#### 1.1 Environment Configuration
- [ ] Set `JWT_SECRET` or `SECRET_KEY` in production environment
  - Value: Secure random string (32+ chars, alphanumeric + special)
  - Provider: Render dashboard / environment variables panel
  - Verify: Backend starts without RuntimeError

- [ ] Set `MONGO_URL` to production MongoDB
  - Value: mongodb+srv://user:pass@cluster.mongodb.net/
  - Provider: MongoDB Atlas connection string
  - Security: Use MongoDB username/password (not root)
  - Verify: Connection pooling active, no errors

- [ ] Set `DB_NAME` = `puntocero_legal`
  - Create database in MongoDB if not exists
  - Verify: Collections created on first request

- [ ] Set `CORS_ORIGINS` to frontend URL
  - Example: `https://puntocero-legal.vercel.app`
  - Security: No wildcard (*) in production
  - Verify: Frontend can call backend without CORS errors

- [ ] Set `GEMINI_API_KEY` (Google Gemini)
  - Source: Google Cloud Console > API & Services
  - Verify: API key has Generative Language API enabled
  - Verify: Rate limits set (20 requests/minute minimum)

- [ ] Set `ANTHROPIC_API_KEY` (Claude fallback, optional)
  - Source: Anthropic console (if using Claude)
  - Verify: API key valid and has remaining credits

- [ ] Set `APP_PUBLIC_URL` = Backend public URL
  - Example: `https://puntocero-legal-api.onrender.com`
  - Verify: Health endpoint accessible at this URL

#### 1.2 Backend Service Deployment
- [ ] Deploy to Render (or equivalent cloud provider)
  - Repository: Point to `staging` branch
  - Build command: `cd backend && pip install -r requirements.txt`
  - Start command: `uvicorn server:app --host 0.0.0.0 --port 8000`
  - Verify: Deployment successful, no build errors

- [ ] Verify backend starts without errors
  ```bash
  # Backend should start and log:
  # "Application startup complete"
  # No "FATAL: Neither JWT_SECRET nor SECRET_KEY" errors
  ```

- [ ] Test health endpoint
  ```bash
  curl https://puntocero-legal-api.onrender.com/health
  # Expected: 200 OK
  ```

- [ ] Monitor startup logs for 5 minutes
  - No JWT validation errors
  - No MongoDB connection errors
  - No API key validation errors

#### 1.3 Backend Verification
- [ ] POST /api/auth/login works
  - [ ] Create test user: `test@puntocero.com` + password
  - [ ] Login returns access_token
  - [ ] Token is valid JWT (can be decoded)

- [ ] JWT signature verification
  - [ ] Decode returned token
  - [ ] Verify signature using backend SECRET_KEY
  - [ ] Confirm payload contains: sub, user_id, role, firm_id, exp, v

- [ ] GET /api/auth/me works
  - [ ] Send token in Authorization header
  - [ ] Returns user data
  - [ ] Does NOT return 401 Unauthorized

- [ ] POST /api/ai/chat works
  - [ ] Send message to AI endpoint
  - [ ] JWT validated successfully
  - [ ] Gemini or Claude responds
  - [ ] Session created in ai_sessions collection

---

### 2. FRONTEND DEPLOYMENT

#### 2.1 Environment Configuration
- [ ] Set `VITE_API_URL` = Backend public URL
  - Value: `https://puntocero-legal-api.onrender.com`
  - Verify: Frontend API calls point to production backend
  - Security: HTTPS only (no HTTP)

- [ ] Set `VITE_APP_NAME` = "Punto Cero Legal"
  - Verify: Appears in page title and branding

- [ ] Disable debug mode
  - [ ] Remove `console.log()` statements (or set to production level)
  - [ ] Disable source maps in production build
  - [ ] Verify: Build optimized and minified

#### 2.2 Frontend Build & Deployment
- [ ] Build frontend optimized
  ```bash
  cd frontend
  npm run build
  # Expected: dist/ folder created, no build warnings
  ```

- [ ] Deploy to Vercel (or equivalent)
  - [ ] Repository: Point to `staging` branch
  - [ ] Build command: `npm run build`
  - [ ] Output directory: `dist`
  - [ ] Environment variables: Set VITE_API_URL
  - [ ] Verify: Deployment successful, no build errors

- [ ] Verify frontend loads
  ```bash
  curl https://puntocero-legal.vercel.app/
  # Expected: 200 OK, HTML with React app
  ```

#### 2.3 Frontend Verification
- [ ] Login page loads
  - [ ] Form displays correctly
  - [ ] Email + password fields present
  - [ ] Submit button functional

- [ ] Login flow works
  - [ ] Enter test credentials
  - [ ] Click login
  - [ ] Redirects to dashboard (if login successful)
  - [ ] JWT stored in localStorage
  - [ ] No 401 or CORS errors in console

- [ ] Dashboard loads
  - [ ] User context loaded
  - [ ] Firm name displayed
  - [ ] Navigation menu visible

- [ ] AI Chat page loads
  - [ ] Text input for message
  - [ ] Send button present
  - [ ] Can send message (if JWT valid)
  - [ ] Receives response from backend

---

### 3. DATABASE SETUP

#### 3.1 MongoDB Configuration
- [ ] Create production MongoDB cluster
  - Provider: MongoDB Atlas (recommended)
  - Region: Same as backend (for latency)
  - Security: Encryption at rest + TLS
  - Backup: Enable automated backups (daily)

- [ ] Create database: `puntocero_legal`
  - Verify: Accessible from backend service IP

- [ ] Create collections (will auto-create on first use, but verify):
  - [ ] `users` — User accounts + passwords
  - [ ] `firms` — Law firm information
  - [ ] `ai_sessions` — AI chat history + responses
  - [ ] `cases` — Legal cases
  - [ ] `documents` — Case documents

- [ ] Create indexes for performance
  ```javascript
  db.users.createIndex({ email: 1 }, { unique: true })
  db.users.createIndex({ firm_id: 1 })
  db.ai_sessions.createIndex({ user_id: 1, firm_id: 1 })
  db.ai_sessions.createIndex({ created_at: -1 })
  db.cases.createIndex({ firm_id: 1, user_id: 1 })
  db.documents.createIndex({ case_id: 1, firm_id: 1 })
  ```

- [ ] Set up database user (not root)
  - Username: `puntocero_app`
  - Password: Secure random (32+ chars)
  - Permissions: Read/write on `puntocero_legal` database only
  - Verify: Connection string works with new credentials

- [ ] Configure connection pooling
  - Min connections: 5
  - Max connections: 20
  - Idle timeout: 60 seconds

- [ ] Enable automated backups
  - Frequency: Daily
  - Retention: 30 days minimum
  - Destination: MongoDB Atlas or external storage
  - Test: Verify restore procedure works

#### 3.2 Initial Data
- [ ] Create first admin user
  ```javascript
  db.users.insertOne({
    email: "admin@puntocero.com",
    password_hash: "<bcrypt hash>",
    role: "admin",
    status: "ACTIVE",
    is_verified: true,
    full_name: "Admin Punto Cero",
    created_at: new Date(),
    updated_at: new Date()
  })
  ```

- [ ] Verify user can login with credentials

---

### 4. AI PROVIDER SETUP

#### 4.1 Google Gemini (Primary)
- [ ] Create Google Cloud project
  - [ ] Enable "Generative Language API"
  - [ ] Create API key (restricted to this API)
  - [ ] Set rate limits: 20 requests/minute

- [ ] Test API key
  ```bash
  curl -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent \
    -H "Content-Type: application/json" \
    -d '{
      "contents": [{"parts": [{"text": "Hola"}]}]
    }' \
    -H "x-goog-api-key: YOUR_API_KEY"
  # Expected: 200 OK with text response
  ```

- [ ] Verify API key in backend environment
  - [ ] No errors during startup
  - [ ] AI endpoint returns Gemini responses

#### 4.2 Claude Fallback (Anthropic)
- [ ] Create Anthropic account (if not using Gemini-only)
  - [ ] Generate API key
  - [ ] Set monthly spending limit (to prevent surprises)

- [ ] Verify in backend
  - [ ] ANTHROPIC_API_KEY set (optional)
  - [ ] Fallback mechanism tested (Gemini fails → Claude succeeds)

---

### 5. SECURITY VERIFICATION

#### 5.1 JWT Security
- [ ] JWT_SECRET/SECRET_KEY set securely
  - [ ] NOT visible in code
  - [ ] NOT in git history
  - [ ] Minimum 32 characters
  - [ ] Alphanumeric + special characters

- [ ] No hardcoded secrets in code
  ```bash
  grep -r "your-secret-key" backend/
  grep -r "sk-" frontend/  # No API keys
  grep -r "Bearer " frontend/  # No tokens in code
  # Expected: No results
  ```

- [ ] CORS configured restrictively
  - [ ] `CORS_ORIGINS` = frontend URL only (not *)
  - [ ] Verify: Frontend can call API, external sites cannot

#### 5.2 Database Security
- [ ] MongoDB user has minimal permissions
  - [ ] Can READ/WRITE on `puntocero_legal` only
  - [ ] Cannot access other databases
  - [ ] Cannot drop collections

- [ ] Password hashing verified
  - [ ] All passwords use bcrypt (not plaintext)
  - [ ] Hash algorithm: bcrypt (auto-generated salt)
  - [ ] Verify: `password_hash` field not empty in database

#### 5.3 Network Security
- [ ] HTTPS only (no HTTP)
  - [ ] Backend: https://puntocero-legal-api.onrender.com
  - [ ] Frontend: https://puntocero-legal.vercel.app
  - [ ] Browser: No mixed content warnings

- [ ] API endpoints require authentication
  - [ ] POST /api/ai/chat requires Bearer token
  - [ ] GET /api/users requires Bearer token
  - [ ] Verify: 401 if token missing/invalid

---

### 6. MONITORING & LOGGING

#### 6.1 Backend Logging
- [ ] Logs configured
  - [ ] Format: JSON or structured text with timestamps
  - [ ] Level: INFO (not DEBUG)
  - [ ] Rotation: Daily or by size (100MB)

- [ ] Health endpoint monitored
  - [ ] Set up health check: GET /api/health every 30 seconds
  - [ ] Alert if endpoint fails
  - [ ] Response time < 1 second

- [ ] Error logs monitored
  - [ ] JWT validation errors → Immediate alert
  - [ ] Database connection errors → Alert
  - [ ] AI provider errors → Alert (but fallback working)

#### 6.2 Application Monitoring
- [ ] Response time monitoring
  - [ ] POST /api/auth/login: < 500ms
  - [ ] GET /api/auth/me: < 200ms
  - [ ] POST /api/ai/chat: < 10s (AI processing time)

- [ ] Error rate monitoring
  - [ ] 401 Unauthorized: < 1% (normal authentication failures)
  - [ ] 500 Server error: < 0.1% (should be rare)
  - [ ] 403 Forbidden: < 0.5% (permission denials)

#### 6.3 Security Monitoring
- [ ] Rate limit monitoring
  - [ ] Alert if user exceeds 20 requests/minute
  - [ ] Track repeat offenders
  - [ ] Temporary IP ban if needed

- [ ] Database monitoring
  - [ ] Connection pool usage
  - [ ] Slow query logs (> 100ms queries)
  - [ ] Storage usage

---

### 7. DATA PRIVACY & COMPLIANCE

#### 7.1 User Data Protection
- [ ] Data encryption at rest
  - [ ] MongoDB encryption enabled
  - [ ] Passwords hashed (bcrypt)

- [ ] Data encryption in transit
  - [ ] HTTPS/TLS for all API calls
  - [ ] Certificate valid and not expired

- [ ] Access logging
  - [ ] Every AI API call logged with: user_id, firm_id, timestamp
  - [ ] Legal basis: Audit trail for compliance

#### 7.2 Privacy Policy
- [ ] Published privacy policy
  - [ ] Disclose: Data collection + storage
  - [ ] Disclose: Third-party AI providers (Google, Anthropic)
  - [ ] Disclose: User's right to data access/deletion

#### 7.3 GDPR Compliance (if EU users)
- [ ] Data retention policy
  - [ ] Define how long user data stored
  - [ ] Automated deletion after retention period

- [ ] Right to be forgotten
  - [ ] DELETE endpoint for user data
  - [ ] Removes: User profile, sessions, case data

---

### 8. PAYMENT SYSTEM (Optional for MVP)

#### 8.1 MercadoPago Setup (If Activated)
- [ ] Create MercadoPago business account
  - [ ] Verify: Business details correct
  - [ ] Get: Public key + Access token

- [ ] Test payment flow
  - [ ] Create test payment
  - [ ] Verify: Transaction recorded in database
  - [ ] Verify: User granted premium features

- [ ] Set up webhooks
  - [ ] Webhook URL: https://puntocero-legal-api.onrender.com/webhooks/mercadopago
  - [ ] Events: payment.created, payment.updated
  - [ ] Verify: Backend receives webhooks correctly

**Note:** Payment system optional for v1.0. Can be deployed after launch if needed.

---

### 9. EMAIL/SMS (Optional for MVP)

#### 9.1 SMTP Configuration (Email)
- [ ] Configure SMTP credentials
  - [ ] Provider: Gmail with app password
  - [ ] Verify: Test email sends successfully

- [ ] Email templates
  - [ ] Welcome email on registration
  - [ ] Password reset email
  - [ ] Notification emails

#### 9.2 WhatsApp/SMS (Optional)
- [ ] Meta WhatsApp Cloud API configured (if using)
  - [ ] OR Twilio configured (alternative provider)
  - [ ] Verify: Test message sends to phone

**Note:** Email/SMS optional for v1.0. Can be disabled for faster launch.

---

## GO-LIVE PHASE (Launch Day)

### 10. PRE-LAUNCH CHECKLIST (1 hour before)

- [ ] Final backend health check
  ```bash
  curl https://puntocero-legal-api.onrender.com/health
  # Expected: 200 OK
  ```

- [ ] Final frontend load test
  - [ ] Open https://puntocero-legal.vercel.app in browser
  - [ ] Page loads in < 2 seconds
  - [ ] No console errors

- [ ] Database backup taken
  ```bash
  # For MongoDB Atlas: Initiate on-demand backup
  ```

- [ ] Team notified
  - [ ] Email sent to team: "Launch in 1 hour"
  - [ ] Slack notification: "Production go-live at XX:XX UTC"

- [ ] Rollback procedure verified
  - [ ] Previous version tagged and ready
  - [ ] Team knows rollback steps (documented below)

### 11. LAUNCH EXECUTION

- [ ] DNS updated (if using custom domain)
  - [ ] Point to Vercel/Render frontend + backend

- [ ] Announce on social media (optional)
  - [ ] "Punto Cero Legal is live!"

- [ ] Email to early users
  - [ ] "You can now access the platform at [URL]"

### 12. POST-LAUNCH MONITORING (First 24 hours)

- [ ] Monitor error logs continuously
  - [ ] Alert on any JWT validation failures
  - [ ] Alert on database errors
  - [ ] Alert on AI provider failures

- [ ] Monitor uptime
  - [ ] Backend health check every 30 seconds
  - [ ] Frontend accessibility check every 1 minute
  - [ ] Alert if either goes down

- [ ] Monitor performance
  - [ ] API response times
  - [ ] Database query performance
  - [ ] Frontend load time

- [ ] Monitor user activity
  - [ ] Count of successful logins
  - [ ] Count of AI chat requests
  - [ ] Error rates

### 13. FIRST 24 HOURS RESPONSE PLAN

**If Issue Detected:**
1. Check: Is it user error or system error?
2. If system error: Trigger rollback (see below)
3. If user error: Document and notify users

**If No Issues After 24 Hours:**
- [ ] Mark launch as successful ✅
- [ ] Unfreeze branch (allow v1.1 development)
- [ ] Plan post-launch improvements

---

## ROLLBACK PROCEDURE (If Critical Issue)

### Immediate Actions (First 5 minutes)
1. [ ] Take system offline (set maintenance page)
2. [ ] Notify team in Slack/email
3. [ ] Do NOT attempt hotfix on production

### Rollback Steps (5-15 minutes)

**Backend Rollback:**
```bash
# On Render dashboard:
# 1. Go to Deployments
# 2. Find previous stable deployment
# 3. Click "Re-deploy"
# Expected: Service back online in 2-3 minutes
```

**Frontend Rollback:**
```bash
# On Vercel dashboard:
# 1. Go to Deployments
# 2. Find previous stable deployment
# 3. Click "Promote to Production"
# Expected: Service back online in 1 minute
```

**Database Rollback (if data corrupted):**
```bash
# On MongoDB Atlas:
# 1. Go to Backups
# 2. Find backup from before incident
# 3. Click "Restore"
# Expected: Data restored in 30-60 minutes
# Note: May lose data from incident period
```

### After Rollback (15+ minutes)
1. [ ] Verify system back online
2. [ ] Run health checks
3. [ ] Notify users: "Issue resolved, system restored"
4. [ ] Post-mortem meeting with team
5. [ ] Document root cause
6. [ ] Fix issue in separate branch
7. [ ] Re-test before re-deploying

---

## SUCCESS CRITERIA (To Consider Launch Successful)

### Technical Metrics
- ✅ Backend uptime: 99.5% (< 21 minutes downtime per month)
- ✅ API response time: < 500ms (p95)
- ✅ AI response time: < 10 seconds (including processing)
- ✅ Database latency: < 50ms (p95)
- ✅ Error rate: < 1% (excluding expected 4xx errors)

### Functional Metrics
- ✅ User registration works
- ✅ User login works (JWT generated correctly)
- ✅ AI chat works (Gemini or Claude responds)
- ✅ Sessions persisted in database
- ✅ Tenant isolation enforced (no data leakage)

### Security Metrics
- ✅ No 401 Unauthorized from valid tokens
- ✅ No cross-tenant data access
- ✅ No SQL/NoSQL injection attempts successful
- ✅ No XSS attacks detected
- ✅ No API keys leaked

### User Experience Metrics
- ✅ No user-reported bugs in first 24 hours
- ✅ All planned features working as expected
- ✅ No performance complaints
- ✅ Documentation clear and helpful

---

## Post-Launch Support (Week 1)

### Daily Tasks
- [ ] Review error logs
- [ ] Monitor performance metrics
- [ ] Check user feedback channels
- [ ] Respond to support tickets

### Weekly Retrospective
- [ ] What went well?
- [ ] What could be improved?
- [ ] Plan v1.1 improvements
- [ ] Unfreeze development branch

---

## Sign-Off

**Release Manager:** _____________________ (Signature)  
**Date:** _____________________________  
**Status:** ☐ APPROVED FOR LAUNCH  

**Team Lead:** _____________________ (Signature)  
**Operations Manager:** _____________________ (Signature)  

---

**This checklist must be completed before going live.**  
**All items marked [  ] must be verified.**  
**Do not skip items (every step is critical for production readiness).**

