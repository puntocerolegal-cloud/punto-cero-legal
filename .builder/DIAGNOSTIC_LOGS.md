# DIAGNOSTIC LOGS - React White Screen Issue

## Issue
After successful login, route `/firm-os` shows completely white screen.

## Root Cause Hypothesis
The `useFirmOnboarding()` hook in `FirmDashboard.jsx` calls `axios.get('${API}/firm-config/undefined/practice-areas')` when `user.firm_id` is null/undefined, causing a silent API failure.

## Evidence Collection Points

### 1. AuthContext.jsx (Line 175-177)
**Action**: Log what the backend returns for `user.firm_id` on login

```javascript
// Inside login() function, after line 176:
console.log("█ FIRM_OS_DEBUG - userData.firm_id:", userData?.firm_id);
console.log("█ FIRM_OS_DEBUG - userData.role:", userData?.role);
console.log("█ FIRM_OS_DEBUG - userData:", JSON.stringify(userData, null, 2));
```

### 2. FirmOSLayout.jsx (Top of component)
**Action**: Log user state when layout renders

```javascript
export function FirmOSLayout({ title, children }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ADD THESE LOGS:
  console.log("█ FIRMOSL Layout Render - user:", user);
  console.log("█ FIRMOSL Layout Render - user.firm_id:", user?.firm_id);
  console.log("█ FIRMOSL Layout Render - user.role:", user?.role);

  // ... rest of component
```

### 3. FirmDashboard.jsx (Top of component)
**Action**: Log immediately when component mounts

```javascript
export function FirmDashboard() {
  const { user } = useAuth();
  
  // ADD THESE LOGS FIRST:
  console.log("█ FirmDashboard Render - user:", user);
  console.log("█ FirmDashboard Render - user.firm_id:", user?.firm_id);
  console.log("█ FirmDashboard Render - user?.role:", user?.role);

  useFirmOnboarding(); // Redirigir a onboarding...
  
  // ...
```

### 4. useFirmOnboarding.js (Inside checkOnboardingStatus)
**Action**: Log the firmId value and what happens

```javascript
const checkOnboardingStatus = async () => {
  try {
    console.log("█ useFirmOnboarding - user:", user);
    console.log("█ useFirmOnboarding - user?.firm_id:", user?.firm_id);
    console.log("█ useFirmOnboarding - token:", token ? "EXISTS" : "MISSING");

    if (!user?.firm_id || !token) {
      console.log("█ useFirmOnboarding - EARLY RETURN: No firm_id or token");
      setIsLoading(false);
      return;  // ← THIS IS THE PROBLEM LINE
    }

    const firmId = user.firm_id;
    console.log("█ useFirmOnboarding - Making API call to:", `${API}/firm-config/${firmId}`);

    const res = await axios.get(`${API}/firm-config/${user.firm_id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log("█ useFirmOnboarding - API Response:", res.data);

    const config = res.data?.data;
    console.log("█ useFirmOnboarding - config.onboarding_completed:", config?.onboarding_completed);
    // ...
```

## Expected Console Output (Successful Case)

```
█ AUTH DEBUG - Login Response: {...}
█ AUTH DEBUG - User Data: {id: "...", role: "firm_owner", firm_id: "507f...", ...}
█ auth DEBUG - user.firm_id from /auth/login: 507f...

█ FIRMOSL Layout Render - user: {id: "...", role: "firm_owner", firm_id: "507f...", ...}
█ FIRMOSL Layout Render - user.firm_id: 507f...
█ FIRMOSL Layout Render - user.role: firm_owner

█ FirmDashboard Render - user: {id: "...", role: "firm_owner", firm_id: "507f...", ...}
█ FirmDashboard Render - user.firm_id: 507f...
█ FirmDashboard Render - user?.role: firm_owner

█ useFirmOnboarding - user: {id: "...", role: "firm_owner", firm_id: "507f...", ...}
█ useFirmOnboarding - user?.firm_id: 507f...
█ useFirmOnboarding - token: EXISTS
█ useFirmOnboarding - Making API call to: https://api.../firm-config/507f...
█ useFirmOnboarding - API Response: {data: {onboarding_completed: false, ...}}
```

## Expected Console Output (Failure Case - WHITE SCREEN)

```
█ AUTH DEBUG - Login Response: {...}
█ AUTH DEBUG - User Data: {id: "...", role: "firm_owner", firm_id: null, ...}  ← firm_id is NULL
█ AUTH DEBUG - user.firm_id from /auth/login: null

█ FIRMOSL Layout Render - user: {id: "...", role: "firm_owner", firm_id: null, ...}
█ FIRMOSL Layout Render - user.firm_id: null  ← PROBLEM
█ FIRMOSL Layout Render - user.role: firm_owner

█ FirmDashboard Render - user: {id: "...", role: "firm_owner", firm_id: null, ...}
█ FirmDashboard Render - user.firm_id: null  ← PROBLEM
█ FirmDashboard Render - user?.role: firm_owner

█ useFirmOnboarding - user: {id: "...", role: "firm_owner", firm_id: null, ...}
█ useFirmOnboarding - user?.firm_id: null
█ useFirmOnboarding - token: EXISTS
█ useFirmOnboarding - EARLY RETURN: No firm_id or token  ← SILENT RETURN
```

## Steps to Execute
1. Open browser DevTools (F12)
2. Go to Console tab
3. Login with firm_owner credentials
4. Observe console logs above
5. Check if `firm_id` is present in user object

## Critical Question
**Is `firm_id` in the user object returned by `/api/auth/login`?**

If NO → Backend bug (login endpoint not returning firm_id)  
If YES → Frontend context issue (not storing firm_id correctly)

---

## Next Actions After Diagnosis

### If firm_id is NULL in backend response:
- File: `backend/routes/auth.py`
- Function: `login()` endpoint
- Check if user document has `firm_id` field
- Check if response payload includes `firm_id`
- **FIX**: Ensure response includes `firm_id` in user object

### If firm_id is NULL in frontend context:
- File: `frontend/src/contexts/AuthContext.jsx`
- Check if `setStoredUser()` is corrupting firm_id
- Check if JSON.stringify/parse is losing firm_id
- **FIX**: Trace the exact line where firm_id is lost

### If firm_id is UNDEFINED in component:
- File: `frontend/src/modules/firm-os/pages/FirmOnboarding.jsx`
- The hook returns silently without error
- **FIX**: Add error boundary or explicit null check guard

---

