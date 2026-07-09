# RELEASE 1.0 — ROLLBACK PLAN
**Date:** 2026-07-07  
**Status:** DISASTER RECOVERY PROCEDURES  
**Scope:** How to recover if production fails  

---

## EXECUTIVE SUMMARY

**Rollback time:** 5-15 minutes  
**Data recovery:** Automatic (no manual DB restore needed for most issues)  
**Service restore:** Immediate (Render redeploy)  
**Risk level:** LOW (simple git revert)  

---

## ROLLBACK DECISION MATRIX

When to rollback:

| Scenario | Severity | Action |
|----------|----------|--------|
| App won't start (500 on all endpoints) | 🔴 CRITICAL | Rollback immediately |
| Database unreachable | 🔴 CRITICAL | Rollback immediately |
| JWT validation broken (401 on all auth) | 🔴 CRITICAL | Rollback immediately |
| Payment flow broken (webhook fails) | 🔴 CRITICAL | Rollback immediately |
| AI completely unavailable | 🟡 HIGH | Rollback if > 1 hour |
| Email not sending | 🟡 HIGH | Do NOT rollback (config issue) |
| Single endpoint broken | 🟡 MEDIUM | Debug first, rollback if widespread |
| Performance degradation | 🟡 MEDIUM | Monitor 30 min, then decide |

---

## PROCEDURE: FULL ROLLBACK

### Step 1: Stop Taking Traffic (Optional - only if critical)

If system is completely broken and causing harm:

```bash
# In Render dashboard:
# Service → Settings → Destroy
# (This immediately stops serving requests)

# OR: Just redeploy previous version (see Step 3)
```

**Note:** Destroying service deletes logs. Prefer redeploy.

---

### Step 2: Identify Last Good Commit

```bash
# View recent commits
git log --oneline -20

# Expected output:
# a1b2c3d Release 1.0: Smoke test failed (CURRENT - BAD)
# 9z8y7x6 Release 1.0: Initial deploy (GOOD)
# ...

# Identify the good commit hash
GOOD_COMMIT="9z8y7x6"
```

---

### Step 3: Revert to Last Good Version

**Option A: Revert one commit**
```bash
git revert <current-commit-hash>
git push origin main

# Render auto-deploys the revert
# Service comes back online in 5-10 minutes
```

**Option B: Reset to known good**
```bash
git reset --hard <good-commit-hash>
git push --force origin main

# ⚠️ CAREFUL: Force push rewrites history
# Only use if revert doesn't work

# Render redeploys
```

**Option C: Manual (if git fails)**

1. In Render dashboard → Service → Trigger Deploy
2. Render re-downloads and re-builds current branch
3. If issue is environmental (bad env var), fix variable and redeploy

---

### Step 4: Verify Service Is Back

```bash
# Test health endpoint
curl https://puntocero-legal-api-xxx.onrender.com/api/health

# Expected: 200 OK response

# Check logs
# Render dashboard → Logs
# Should show: "Application startup complete"
```

**If still broken:**
- Check Render logs for errors
- Verify environment variables
- Check MongoDB connection

---

### Step 5: Verify Data Integrity

**Nothing breaks in MongoDB:**
- ✅ Data is safe (no code drops collections)
- ✅ Migrations are idempotent (safe to run again)
- ✅ Users can still login (JWT still valid)

**Check:**
```bash
# Test authentication still works
curl -X POST https://puntocero-legal-api-xxx.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Expected: 200 OK with JWT token
```

---

### Step 6: Post-Rollback Analysis

**What to do after rollback:**

1. **Root cause:** Why did it fail?
   - Analyze Render logs
   - Check what changed
   - Review code diff

2. **Fix the issue** (if obvious)
   - Do NOT deploy immediately
   - Test locally first
   - Get code review
   - Document the fix

3. **Re-deploy** (when ready)
   - Push fix to separate branch
   - Get approval
   - Merge to main
   - Monitor deployment

---

## SCENARIO-SPECIFIC ROLLBACKS

### Scenario 1: App crashes on startup

**Symptoms:**
```
ERROR: Application failed to start
ERROR: cannot import X module
ERROR: NameError: name 'Y' is not defined
```

**Root causes:**
- Syntax error in code
- Missing import
- Bad environment variable
- Corrupted requirements.txt

**Rollback:**
```bash
git revert HEAD
git push origin main
# Render redeploys previous version
```

**Analysis:**
1. Check Render build logs
2. Find the syntax error
3. Fix locally, test, re-deploy

---

### Scenario 2: Database connection fails

**Symptoms:**
```
ERROR: MongoDB connection timeout
ERROR: MONGO_URL not found
```

**Root causes:**
- MongoDB credentials expired
- Network unreachable (IP whitelist issue)
- Wrong connection string
- Database doesn't exist

**Rollback (choice):**
- **Better:** Do NOT rollback (code didn't change)
- **Instead:** Fix MONGO_URL in Render → Environment → Save
- Render automatically redeploys

**If still broken:**
```bash
# Test locally if MongoDB is reachable
mongodb+srv://user:pass@cluster.mongodb.net/
# Replace with your actual connection string
```

---

### Scenario 3: Payment webhook fails

**Symptoms:**
```
ERROR: Payment webhook signature invalid
ERROR: MP_ACCESS_TOKEN invalid
```

**Root causes:**
- MP token expired/revoked
- Webhook URL changed (app URL)
- MP API version changed

**Rollback (choice):**
- **Better:** Do NOT rollback (not a code issue)
- **Instead:** Update MP_ACCESS_TOKEN in Render
- Or update webhook URL in MercadoPago dashboard

---

### Scenario 4: JWT validation broken

**Symptoms:**
```
401 Unauthorized on all auth endpoints
JWT_SECRET mismatch
```

**Root causes:**
- JWT_SECRET ≠ SECRET_KEY
- SECRET_KEY not set
- JWT algorithm mismatch

**Rollback (choice):**
- **Better:** Do NOT rollback (config issue)
- **Instead:** Fix JWT_SECRET = SECRET_KEY in Render
- Redeploy

**If still broken:**
```bash
# Check both are set:
# Render → Environment
# SECRET_KEY = <value>
# JWT_SECRET = <same value>
```

---

### Scenario 5: Partial rollback (single endpoint broken)

**Symptoms:**
```
GET /api/users/me → 500 Internal Server Error
GET /api/health → 200 OK
GET /api/auth/login → 200 OK
```

**Root cause:**
- Bug in one route only
- Broken feature, not app-wide

**Rollback:**
- **Better:** Do NOT rollback entire app
- **Instead:** Fix specific route and re-deploy
- Or temporarily disable the route

**If must rollback:**
```bash
git revert HEAD
git push origin main
# Full rollback (overkill, but safe)
```

---

## WHAT NEVER NEEDS ROLLBACK

✅ **Database issues** — Fix in environment, don't rollback code  
✅ **Configuration issues** — Update in Render, don't rollback code  
✅ **Payment failures** — Check MP token, don't rollback code  
✅ **Email not sending** — Fix SMTP config, don't rollback code  
✅ **Slow responses** — Scale plan, don't rollback code  
✅ **Rate limiting triggered** — Wait 1 minute, don't rollback code  

**Key:** Only rollback if code change caused the failure

---

## PREVENTION: AVOID NEEDING ROLLBACK

**Best practices for Release 1.0:**

1. **Test before deploy:**
   - Run locally: `python server.py`
   - Test key flows locally
   - Smoke test procedures before go-live

2. **Small, reversible changes:**
   - Don't deploy multiple features at once
   - Each commit should be deployable
   - Avoid major architecture changes

3. **Monitor first 72 hours:**
   - Watch logs constantly
   - Alert on errors
   - Quick response to issues

4. **Have escape plan:**
   - Know rollback procedure
   - Test rollback locally
   - Practice with git revert

---

## CHECKLISTS

### Pre-Rollback Checklist

- [ ] Confirmed app is actually broken (not just slow)
- [ ] Checked environment variables (might be config)
- [ ] Reviewed Render logs for error details
- [ ] Identified last good commit
- [ ] Notified team that rollback is happening

### Post-Rollback Checklist

- [ ] Service is healthy: `/api/health` → 200
- [ ] Users can login
- [ ] Database still accessible
- [ ] Data is intact (spot check)
- [ ] Team notified rollback is complete

### Before Re-Deploying After Rollback

- [ ] Root cause identified and documented
- [ ] Fix developed locally
- [ ] Fix tested locally
- [ ] Code reviewed
- [ ] Commit message clear
- [ ] Verify it's not a config issue (don't redeploy same code)

---

## COMMUNICATION TEMPLATE

### During Rollback

To communicate to users/stakeholders:

```
🚨 INCIDENT ALERT 🚨

We've detected an issue with the production system.
We are rolling back to the last known good version.

Expected service restoration: 10 minutes

Status updates: [status page link]
```

### After Rollback

```
✅ INCIDENT RESOLVED ✅

The production system has been restored.
All services are now operational.

Root cause: [brief description]
Fix being prepared: [timeline]
Follow-up: [next steps]
```

---

## DISASTER SCENARIOS

### Nuclear Option: Complete Service Destruction & Rebuild

If even rollback doesn't work:

1. **Destroy service:**
   ```
   Render → Service → Settings → Danger Zone → Destroy
   ```

2. **Wait 5 minutes** (let cleanup complete)

3. **Recreate service:**
   ```
   Render → New → Web Service
   Select repo, configure as before
   ```

4. **Restore environment variables:**
   ```
   Copy from backup or from git history
   ```

5. **Trigger deploy:** Service redeploys

**Risk:** 30-60 minute recovery time  
**Use only if:** Normal rollback doesn't work

---

## TESTING ROLLBACK (BEFORE GO-LIVE)

**Recommended:** Simulate rollback procedure locally before launch

```bash
# Create "bad" commit
echo "BAD CODE" > backend/server.py
git add backend/server.py
git commit -m "Broken deployment"

# Simulate rollback
git revert HEAD
# OR
git reset --hard HEAD~1

# Verify revert works
git log --oneline -5  # Should show revert commit or reset

# Push (but do this on test branch, NOT main)
git push origin test-rollback --force
```

---

## ESCALATION

If rollback doesn't work:

1. **Pause:** Stop deploying anything
2. **Document:** Record error messages, timestamps
3. **Investigate:** Check:
   - Render infrastructure status
   - MongoDB status
   - Network connectivity
4. **Contact support:**
   - Render support (if infrastructure issue)
   - Database provider (if MongoDB down)
   - Your team lead (for code issues)

---

## FINAL NOTES

✅ **Rollbacks are safe** — git makes it simple  
✅ **Data is safe** — no code drops collections  
✅ **Recovery is fast** — 5-15 minutes  
⚠️ **Prevention is better** — test before deploy  

---

**Status:** Rollback procedures documented.  
**Ready for emergency use.**
