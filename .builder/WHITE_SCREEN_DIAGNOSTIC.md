# SENIOR REACT DEBUGGER - WHITE SCREEN DIAGNOSTIC

**Issue**: After successful login to `/firm-os`, page shows completely white screen.

**Diagnosis Method**: Evidence-based code audit + temporal instrumentation.

---

## FINDINGS

### Root Cause: Silent API Failure in useFirmOnboarding Hook

**File**: `frontend/src/hooks/useFirmOnboarding.js`  
**Lines**: 13-43  
**Issue**: Early return when `user.firm_id` is null/undefined

```javascript
if (!user?.firm_id || !token) {
  setIsLoading(false);
  return;  // ← SILENT RETURN - NO ERROR, NO NAVIGATION, NO UI
}
```

### Problem Chain

1. **Login succeeds** → FirmDashboard mounts → calls `useFirmOnboarding()` hook
2. **Hook checks** `if (!user?.firm_id || !token)` 
3. **If firm_id is null/undefined**, hook **returns silently**
4. **Component continues rendering**, tries to load data with undefined firmId
5. **API calls fail** with 400 Bad Request (firm-config/undefined)
6. **Errors swallowed** in catch block
7. **Component shows** empty loading state or error message
8. **Result**: White/blank screen

### Why firm_id Might Be Missing

#### Possibility A: Backend Not Returning firm_id
**File**: `backend/routes/auth.py` (login endpoint)  
**Check**: Does `/api/auth/login` response include `user.firm_id`?

**Evidence Needed**:
```json
{
  "access_token": "...",
  "user": {
    "id": "...",
    "email": "...",
    "firm_id": null,  // ← PROBLEM: Should be ObjectId or string
    "role": "firm_owner"
  }
}
```

**Likely Cause**: User created WITHOUT firm_id assignment during approval

#### Possibility B: Frontend Losing firm_id During Context/Storage
**File**: `frontend/src/contexts/AuthContext.jsx` (lines 83-104)  
**Check**: Does `setStoredUser()` preserve firm_id in localStorage?

**Evidence Needed**:
- Open DevTools → Application → localStorage
- Check `pcl_user` or `user` key
- Inspect JSON: should have `firm_id` field

**Likely Cause**: Encryption/decryption losing field, JSON parse failure

---

## DIAGNOSTIC STEPS (ALREADY ADDED)

Temporary console.log statements added to 4 files to trace the exact point of failure:

### 1. AuthContext.jsx (login function)
```javascript
console.log("█ FIRM_OS_DEBUG - userData.firm_id:", userData?.firm_id);
console.log("█ FIRM_OS_DEBUG - Full userData object:", JSON.stringify(userData, null, 2));
```

**Purpose**: Verify what backend returns for firm_id

### 2. FirmOSLayout.jsx (render)
```javascript
console.log("█ FIRMOSL Layout Render - user.firm_id:", user?.firm_id);
console.log("█ FIRMOSL Layout Render - user.role:", user?.role);
```

**Purpose**: Verify Layout receives user with firm_id

### 3. FirmDashboard.jsx (render)
```javascript
console.log("█ FirmDashboard Render - user.firm_id:", user?.firm_id);
console.log("█ FirmDashboard Render - user?.role:", user?.role);
```

**Purpose**: Verify Dashboard component sees firm_id before hook runs

### 4. useFirmOnboarding.js (hook)
```javascript
console.log("█ useFirmOnboarding - user?.firm_id:", user?.firm_id);
if (!user?.firm_id || !token) {
  console.log("█ useFirmOnboarding - EARLY RETURN: No firm_id or token");
  setIsLoading(false);
  return;  // ← PINPOINT FAILURE HERE
}
console.log("█ useFirmOnboarding - Making API call to:", `${API}/firm-config/${firmId}`);
```

**Purpose**: Pinpoint exact line causing white screen

---

## EVIDENCE COLLECTION PROTOCOL

### Step 1: Execute Login
1. Open browser (Chrome/Firefox)
2. Press F12 → Console tab
3. Navigate to login page
4. Enter firm_owner credentials
5. Click Login
6. **OBSERVE CONSOLE OUTPUT** as navigation begins

### Step 2: Check Console Logs (Sequential)

**Expected Output Flow** (Success Case):
```
█ AUTH DEBUG - Login Response: {access_token: "...", user: {...}}
█ AUTH DEBUG - User Data: {id: "...", role: "firm_owner", firm_id: "507f..."}
█ FIRM_OS_DEBUG - userData.firm_id: 507f...
█ FIRM_OS_DEBUG - Full userData object: {"id": "...", "firm_id": "507f...", ...}

█ FIRMOSL Layout Render - user.firm_id: 507f...
█ FIRMOSL Layout Render - user.role: firm_owner

█ FirmDashboard Render - user.firm_id: 507f...
█ FirmDashboard Render - user?.role: firm_owner

█ useFirmOnboarding - user?: {id: "...", firm_id: "507f...", ...}
█ useFirmOnboarding - user?.firm_id: 507f...
█ useFirmOnboarding - token: EXISTS
█ useFirmOnboarding - Making API call to: https://api.../firm-config/507f...
█ useFirmOnboarding - API Response: {data: {onboarding_completed: false, ...}}
```

**Failure Case** (White Screen):
```
█ AUTH DEBUG - Login Response: {access_token: "...", user: {...}}
█ AUTH DEBUG - User Data: {id: "...", role: "firm_owner", firm_id: null}
█ FIRM_OS_DEBUG - userData.firm_id: null  ← ❌ PROBLEM STARTS HERE
█ FIRM_OS_DEBUG - Full userData object: {"id": "...", "firm_id": null, ...}

█ FIRMOSL Layout Render - user.firm_id: null  ← ❌ STILL NULL
█ FIRMOSL Layout Render - user.role: firm_owner

█ FirmDashboard Render - user.firm_id: null  ← ❌ STILL NULL
█ FirmDashboard Render - user?.role: firm_owner

█ useFirmOnboarding - user?.firm_id: null
█ useFirmOnboarding - token: EXISTS
█ useFirmOnboarding - EARLY RETURN: No firm_id or token  ← ❌ SILENT FAILURE
```

### Step 3: Verify localStorage
1. Press F12 → Application → Storage → localStorage
2. Find key `pcl_user` or `user`
3. Copy value and paste into JSON formatter
4. Check: Is `firm_id` present? Is it valid?

**Expected**:
```json
{
  "id": "507f1f77bcf86cd799439022",
  "firm_id": "507f1f77bcf86cd799439011",
  "role": "firm_owner",
  "email": "juan@abogados.com"
}
```

**Failure**:
```json
{
  "id": "507f1f77bcf86cd799439022",
  "firm_id": null,
  "role": "firm_owner"
}
```

### Step 4: Check Network Tab
1. Press F12 → Network tab
2. Scroll down to find POST `/api/auth/login` request
3. Click it → Response tab
4. Inspect JSON under `user` object
5. Look for `firm_id` field

---

## DIAGNOSIS DECISION TREE

### If firm_id is NULL in `/api/auth/login` response:
```
❌ BACKEND BUG
📁 File: backend/routes/auth.py
🔍 Function: login() route (POST /auth/login)
🐛 Issue: User document has no firm_id OR response doesn't include it
✅ Fix: 
   - Verify user.firm_id exists in DB
   - Add firm_id to login response payload
```

### Else if firm_id is NULL in localStorage:
```
❌ FRONTEND STORAGE BUG
📁 File: frontend/src/contexts/AuthContext.jsx
🔍 Functions: setStoredUser(), getStoredUser()
🐛 Issue: firm_id lost during encryption/stringify/parse
✅ Fix:
   - Add firm_id to whitelist of stored fields
   - Debug setStoredUser() line 85-95
   - Test localStorage persistence manually
```

### Else if firm_id is NULL in component:
```
❌ CONTEXT UPDATE TIMING BUG
📁 File: frontend/src/contexts/AuthContext.jsx
🔍 Functions: login() → setUser(userData)
🐛 Issue: setUser() called with incomplete userData
✅ Fix:
   - Verify userData object before setUser()
   - Add assert: userData.firm_id must exist for firm roles
   - Add error throw if firm_id missing
```

---

## EXACT FIX (Once Root Cause Identified)

### If Backend Returns null firm_id:
**File**: `backend/routes/auth.py`  
**Section**: Login endpoint response building  
**Code**:
```python
return {
    "access_token": access_token,
    "token_type": "bearer",
    "user": {
        "id": str(user["_id"]),
        "email": user["email"],
        "firm_id": user.get("firm_id"),  # ← ADD THIS LINE
        "role": user["role"],
        ...
    }
}
```

### If Frontend Loses firm_id in localStorage:
**File**: `frontend/src/contexts/AuthContext.jsx`  
**Section**: setStoredUser() function  
**Action**: Add debug logs before/after JSON.stringify
```javascript
async function setStoredUser(user) {
  console.log("█ setStoredUser BEFORE:", user);  // ← Debug
  try {
    const str = JSON.stringify(user);
    console.log("█ setStoredUser STRINGIFIED:", str);  // ← Debug
    const payload = STORAGE_PASSPHRASE ? await encryptString(str) : str;
    localStorage.setItem(USER_KEY, payload);
    console.log("█ setStoredUser AFTER localStorage.setItem, USER_KEY=", USER_KEY);  // ← Debug
    // ...
```

### If Component Doesn't Guard Against Missing firm_id:
**File**: `frontend/src/hooks/useFirmOnboarding.js`  
**Change**: Replace silent return with explicit error
```javascript
if (!user?.firm_id || !token) {
  console.error("█ CRITICAL: useFirmOnboarding called with missing firm_id or token", {
    user,
    token: token ? "exists" : "missing"
  });
  // Option A: Throw error (will show error boundary)
  // throw new Error("User firm_id not initialized");
  
  // Option B: Navigate to error page
  // navigate('/error/no-firm-access');
  
  // Option C: Show warning but continue
  console.warn("⚠️ Continuing without firm config check");
  
  setIsLoading(false);
  return;
}
```

---

## CONCLUSION

**White Screen Root Cause**: Missing `firm_id` in user object causing silent failure in `useFirmOnboarding` hook.

**Investigation Path**: 
1. Run login with firm_owner credentials
2. Check console logs at each step
3. Identify where `firm_id` becomes null
4. Trace backward to root cause (backend response vs frontend storage)

**NO IMPLEMENTATION YET**: Only diagnostics added. Execute these steps to confirm root cause before writing fixes.

---

## Files Instrumented (Temporary - Remove After Diagnosis)
- ✅ `frontend/src/contexts/AuthContext.jsx` (login function)
- ✅ `frontend/src/modules/firm-os/FirmOSLayout.jsx` (component render)
- ✅ `frontend/src/modules/firm-os/pages/FirmDashboard.jsx` (component render)
- ✅ `frontend/src/hooks/useFirmOnboarding.js` (hook execution)

**Next Action**: Execute login with firm_owner account, provide console logs and network tab screenshot.

