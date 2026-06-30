# E2E Validation Checklist - Firm OS Production Certification

**Status**: Ready for Full Testing  
**Date**: 2025-01-15  
**Scope**: Complete lifecycle from landing page to firm owner dashboard and second login

---

## Architecture Overview

### Four-Product Isolation (PRESERVED)
- **Firma OS**: Firm owner/admin/lawyer UX (routes: `/firm-os/*`)
- **Admin OS**: Admin approval/management UX (routes: `/admin/*`, module: `FirmSolicitudesModule`)
- **Lawyer OS**: Lawyer-specific UX (routes: `/legal-os/*`) [Not part of this validation]
- **Public Portal**: Landing, registration, login

### Approval Flow
```
[Landing] → [Register] → [PENDING_APPROVAL in DB]
                ↓ (Admin only)
           [Admin OS] → [View Request] → [Approve|Reject]
                ↓ (Approve)
           [Create firm_owner] → [Generate temp password] → [Set requires_password_change=true]
                ↓
           [Activate firm & trial]
                ↓
           [Firm owner login with temp creds]
                ↓
           [Redirect to /change-password-required]
                ↓
           [Change password]
                ↓
           [Logout → Login with new password]
                ↓
           [Onboarding or Dashboard]
```

---

## Phase-by-Phase Validation

### PHASE 0: Environment Setup
- [ ] Dev server running on port 3000
- [ ] Backend API available on configured `API` endpoint
- [ ] MongoDB connected and accessible
- [ ] Build compiles without errors
- [ ] No console errors on page load

**Evidence**:
- Screenshot of browser console (no errors)
- Screenshot of network tab (API responding)
- MongoDB document sample (firms collection exists)

---

### PHASE 1: Landing & Registration

#### 1.1: Landing Page
- [ ] Landing page loads without errors
- [ ] "Registrar Firma" button visible and clickable
- [ ] Page styling intact (no layout breaks)

**Evidence**:
- Screenshot of landing page

#### 1.2: Registration Form
- [ ] Form loads with all fields visible:
  - Nombre de Firma
  - NIT
  - Email de Contacto
  - Nombre del Propietario
  - Email del Propietario
  - Teléfono
  - Dirección
  - Ciudad
  - País
  - Plan (Crecimiento/Enterprise)
  - Direccion
- [ ] Form validation works (required fields, email format, NIT uniqueness)
- [ ] Submit button enabled only when form valid
- [ ] Submit action calls `POST /api/firms/register` with correct payload

**Evidence**:
- Screenshot of registration form
- Network tab showing POST request body and response
- Response shows `status: "PENDING_APPROVAL"` and `firm_id`

#### 1.3: Registration Success
- [ ] User sees success message: "Gracias. Hemos recibido tu solicitud..."
- [ ] No automatic login or redirect
- [ ] API response includes `firm_id`

**Evidence**:
- Screenshot of success page
- Console log of response JSON

---

### PHASE 2: Admin OS - Request Management

#### 2.1: Admin Login
- [ ] Admin can login with admin credentials
- [ ] Redirect to `/admin` after login
- [ ] Admin dashboard loads

**Evidence**:
- Screenshot of admin dashboard
- Network tab showing successful auth

#### 2.2: Firm Solicitudes Module
- [ ] Navigation shows "Solicitudes de Firmas" link in Admin OS sidebar
- [ ] Clicking link loads `FirmSolicitudesModule` at `/admin/firms-solicitudes`
- [ ] Module loads without errors

**Evidence**:
- Screenshot of sidebar
- Screenshot of Solicitudes module loading

#### 2.3: Statistics Dashboard
- [ ] Stats box shows:
  - Pendientes: 1+ (includes the registered firm)
  - Aprobadas: 0 (or existing count)
  - Rechazadas: 0 (or existing count)
  - Total: correct count
  - Trials Activos: correct count
- [ ] Stats update after actions

**Evidence**:
- Screenshot of stats box
- Network tab showing `GET /api/firms/stats/summary`

#### 2.4: Solicitudes Table
- [ ] Table loads with pending firms
- [ ] Columns visible: Firma, Responsable, Email, Teléfono, País, Plan, Fecha, Estado, Acciones
- [ ] Registered firm appears in table with correct data
- [ ] Status shows "Pendiente"

**Evidence**:
- Screenshot of table with registered firm

#### 2.5: Filters and Search
- [ ] Search by firm name filters results
- [ ] Search by email filters results
- [ ] Search by NIT filters results
- [ ] Plan filter works
- [ ] Country filter works
- [ ] "Limpiar Filtros" button resets all filters

**Evidence**:
- Screenshots showing filters in action

#### 2.6: View Details
- [ ] Click "Ver Detalles" (eye icon) opens detail modal
- [ ] Modal shows full firm information:
  - Nombre de Firma
  - Email
  - Teléfono
  - Dirección
  - Ciudad
  - País
  - Plan
  - Responsable
  - Email del Responsable
  - Fecha de Registro
  - Última Actualización
- [ ] Modal has buttons:
  - "APROBAR FIRMA" (green)
  - "RECHAZAR" (red)
  - "Cerrar" (gray)

**Evidence**:
- Screenshot of detail modal

---

### PHASE 3: Admin OS - Approval

#### 3.1: Click Approve
- [ ] Click "APROBAR FIRMA" button
- [ ] Button shows loading state ("Aprobando...")
- [ ] API call: `POST /api/firms/{firm_id}/approve`
- [ ] Request includes auth header with Bearer token

**Evidence**:
- Network tab showing POST request
- Console log of response

#### 3.2: Approve Response
- [ ] Response includes:
  ```json
  {
    "success": true,
    "firm_id": "...",
    "owner_id": "...",
    "credentials": {
      "email": "...",
      "temp_password": "..." (16-char secure token),
      "note": "Contraseña temporal válida..."
    },
    "trial": {
      "status": "active",
      "days": 7,
      "started_at": "...",
      "ends_at": "..."
    },
    "email_notification": {
      "sent": true|false,
      "trace_id": "...",
      "note": "..."
    }
  }
  ```
- [ ] HTTP status 200

**Evidence**:
- Network tab showing full response JSON

#### 3.3: Credentials Modal
- [ ] After approval, credentials modal appears
- [ ] Modal shows:
  - Success icon and "¡Firma Aprobada!" heading
  - Yellow warning box: "Estas credenciales se muestran una sola vez..."
  - Email field (readonly, copyable)
  - Temp password field (readonly, copyable) **IF** `temp_password` exists
  - Or blue info box: "El propietario ya tiene acceso..." **IF** `temp_password` is null
  - "Copiar Email y Contraseña" button (only if temp_password exists)
  - "Entendido, Cerrar" button

**Evidence**:
- Screenshot of credentials modal
- Screenshot showing temp_password case
- Screenshot showing no temp_password case (if applicable)

#### 3.4: Copy Actions
- [ ] Click copy icon next to email → button turns green + "✓ Copiado"
- [ ] Clipboard contains email
- [ ] Click copy icon next to password → button turns green + "✓ Copiado"
- [ ] Clipboard contains temp_password
- [ ] Click "Copiar Email y Contraseña" → button turns green
- [ ] Clipboard contains "Email: ...\nContraseña: ..."

**Evidence**:
- Screenshots showing copy feedback
- Paste content into editor to verify

#### 3.5: Close Modal
- [ ] Click "Entendido, Cerrar"
- [ ] Modal closes
- [ ] Table refreshes (firm status may change or table reloads)

**Evidence**:
- Screenshot after modal closes

#### 3.6: Database Verification
- [ ] Firm status changed to "ACTIVE"
- [ ] Firm approval_status: "approved"
- [ ] Firm approval_date: current timestamp
- [ ] Firm approved_by: admin user ID
- [ ] Firm trial_status: "active"
- [ ] Firm trial_started_at: timestamp
- [ ] Firm trial_ends_at: 7 days from now
- [ ] Firm owner_id: set to created user ID
- [ ] New user created with:
  - email: firm's owner_email
  - full_name: firm's owner_name
  - role: "firm_owner"
  - firm_id: firm's ID
  - status: "ACTIVE"
  - is_verified: true
  - requires_password_change: true
  - password_hash: hashed temp_password

**Evidence**:
- MongoDB query results showing firm document
- MongoDB query results showing user document

---

### PHASE 3b: Admin OS - Rejection (Alternative Path)

#### 3b.1: Click Reject
- [ ] From detail modal, click "RECHAZAR" button
- [ ] Rejection modal appears
- [ ] Modal shows:
  - "Rechazar Solicitud" heading
  - Confirmation text: "Está a punto de rechazar..."
  - Textarea for rejection reason (min 5 chars, max 500)
  - "Cancelar" and "Confirmar Rechazo" buttons

**Evidence**:
- Screenshot of rejection modal

#### 3b.2: Submit Rejection
- [ ] Enter rejection reason (e.g., "Documentación incompleta")
- [ ] Click "Confirmar Rechazo"
- [ ] API call: `POST /api/firms/{firm_id}/reject` with rejection_reason
- [ ] Response includes success confirmation

**Evidence**:
- Network tab showing POST request with reason
- Console log of response

#### 3b.3: Database Verification
- [ ] Firm status changed to "REJECTED"
- [ ] Firm approval_status: "rejected"
- [ ] Firm rejection_reason: provided text
- [ ] Firm rejected_by: admin user ID
- [ ] Firm rejected_at: timestamp

**Evidence**:
- MongoDB query showing firm document

---

### PHASE 4: Firm Owner Login

#### 4.1: Login Page
- [ ] Navigate to `/login`
- [ ] Form shows:
  - Email input
  - Password input
  - "Iniciar Sesión" button

**Evidence**:
- Screenshot of login page

#### 4.2: Login with Temp Credentials
- [ ] Enter firm owner's email (from credentials modal)
- [ ] Enter temp_password (from credentials modal)
- [ ] Click "Iniciar Sesión"
- [ ] API call: `POST /api/auth/login` with credentials

**Evidence**:
- Network tab showing POST request
- Console log showing response

#### 4.3: Login Response
- [ ] HTTP 200 response with:
  ```json
  {
    "access_token": "...",
    "token_type": "bearer",
    "user": {
      "id": "...",
      "email": "...",
      "full_name": "...",
      "role": "firm_owner",
      "status": "ACTIVE",
      "is_verified": true,
      "requires_password_change": true,  // CRITICAL
      "firm_id": "...",
      ...
    }
  }
  ```
- [ ] `requires_password_change` is `true`

**Evidence**:
- Network tab showing full response JSON
- Screenshot showing requires_password_change in response

#### 4.4: Auto-Redirect to Password Change
- [ ] After login, **automatically** redirected to `/change-password-required`
- [ ] No intermediate page load or dashboard view

**Evidence**:
- Screenshot showing redirect
- Network tab showing redirect
- URL changes to `/change-password-required`

---

### PHASE 5: First-Login Password Change

#### 5.1: Password Change Page
- [ ] Page loads with:
  - "Cambio Obligatorio de Contraseña" heading
  - Blue info box explaining requirement
  - Three password fields:
    - "Contraseña Actual" (temp password)
    - "Nueva Contraseña"
    - "Confirmar Contraseña"
  - "Actualizar Contraseña" button
  - Support email link

**Evidence**:
- Screenshot of password change page

#### 5.2: Validation
- [ ] Entering nothing keeps button disabled
- [ ] New password < 8 chars shows error: "debe tener al menos 8 caracteres"
- [ ] Passwords don't match shows error: "no coinciden"
- [ ] New password = current shows error: "debe ser diferente"

**Evidence**:
- Screenshots showing each validation error

#### 5.3: Submit Password Change
- [ ] Enter temp_password in "Contraseña Actual"
- [ ] Enter new strong password (e.g., "NuevaPassword123!")
- [ ] Confirm new password
- [ ] Click "Actualizar Contraseña"
- [ ] API call: `POST /api/auth/change-password-first-login`
  - Payload: `{ current_password: "...", new_password: "..." }`
  - Headers: `Authorization: Bearer {token}`

**Evidence**:
- Network tab showing POST request
- Console log showing response

#### 5.4: Success Page
- [ ] Success page appears:
  - Green check icon
  - "¡Contraseña Actualizada!" heading
  - "Serás redirigido al login..."
  - Spinner
- [ ] After ~2 seconds, auto-redirect to `/login`

**Evidence**:
- Screenshot of success page
- Screenshot showing redirect to login

#### 5.5: Database Verification
- [ ] User document:
  - password_hash updated to hash of new password
  - requires_password_change: **false** (changed from true)
  - updated_at: current timestamp

**Evidence**:
- MongoDB query showing updated user document

---

### PHASE 6: Second Login (After Password Change)

#### 6.1: Login with New Password
- [ ] Navigate to `/login` (if not auto-redirected)
- [ ] Enter firm owner's email
- [ ] Enter **new password** (not temp password)
- [ ] Click "Iniciar Sesión"

**Evidence**:
- Screenshot of login page with new creds being entered

#### 6.2: Second Login Response
- [ ] HTTP 200 response with:
  - access_token
  - user object with:
    - requires_password_change: **false** (critical difference from first login)
    - role: "firm_owner"
    - firm_id: (set)

**Evidence**:
- Network tab showing response with requires_password_change=false

#### 6.3: Auto-Redirect to Firm OS
- [ ] After login, automatically redirected to `/firm-os`
- [ ] No redirect to `/change-password-required` (since requires_password_change=false)

**Evidence**:
- Screenshot showing redirect to `/firm-os`
- URL changes to `/firm-os` or `/firm-os/dashboard`

---

### PHASE 7: Firm OS - Onboarding Check

#### 7.1: Onboarding Requirement Check
- [ ] If firm config has `onboarding_completed=false`, redirect to `/firm-os/onboarding`
- [ ] If firm config has `onboarding_completed=true`, redirect to `/firm-os/dashboard`

**Evidence**:
- Screenshot of onboarding page OR dashboard (depending on config)

#### 7.2: Onboarding Page (if shown)
- [ ] Page loads with:
  - "Bienvenido a Punto Cero Legal" or similar
  - Step indicators (1/N steps)
  - Form fields for firm setup:
    - Practice areas selection
    - Firm details
    - Team structure
  - "Siguiente" button

**Evidence**:
- Screenshot of onboarding page
- Evidence of completing steps

#### 7.3: Onboarding Completion
- [ ] After completing all steps:
  - firm_config.onboarding_completed: true
  - Auto-redirect to `/firm-os/dashboard`

**Evidence**:
- Network tab showing PATCH request to save config
- MongoDB query showing onboarding_completed=true

---

### PHASE 8: Firm OS - Dashboard

#### 8.1: Dashboard Loads
- [ ] Dashboard page (`/firm-os/dashboard`) loads without errors
- [ ] No blank white screen
- [ ] Layout visible:
  - Sidebar with navigation
  - Main content area
  - Header

**Evidence**:
- Screenshot of full dashboard
- Browser console (no errors)

#### 8.2: Dashboard Metrics
- [ ] Metrics cards visible:
  - Total Abogados (count)
  - Casos Activos (count)
  - Clientes (count)
  - Ingresos Mensuales (amount)
- [ ] Numbers load correctly (0 or actual count if seed data exists)

**Evidence**:
- Screenshot of metrics
- Network tab showing GET requests to firm data APIs

#### 8.3: Navigation
- [ ] Sidebar shows menu items:
  - Dashboard (active)
  - Abogados
  - Casos
  - Clientes
  - Finanzas
  - Analytics
  - Configuración
  - Equipo
  - Logout

**Evidence**:
- Screenshot of sidebar

#### 8.4: Navigation to Other Pages
- [ ] Click "Abogados" → loads `/firm-os/lawyers`
  - Shows list of firm lawyers (empty or populated)
- [ ] Click "Configuración" → loads `/firm-os/settings`
  - Shows firm settings form with save button
  - Form data loads from `GET /api/firms/{firm_id}`
- [ ] Click "Finanzas" → loads `/firm-os/finance`
  - Shows financial metrics
- [ ] Click "Analytics" → loads `/firm-os/analytics`
  - Shows analytics data

**Evidence**:
- Screenshots of each page
- Network tabs showing API calls

#### 8.5: Firm Settings Save
- [ ] On Settings page, edit firm data (e.g., phone, address)
- [ ] Click "Guardar Cambios"
- [ ] Button shows loading state
- [ ] API call: `PATCH /api/firms/{firm_id}` with updated fields
- [ ] Response shows success
- [ ] Page shows "✓ Cambios guardados"

**Evidence**:
- Screenshot of settings page with changes
- Network tab showing PATCH request
- Screenshot showing success message

---

### PHASE 9: Logout & Second Session

#### 9.1: Logout
- [ ] Click user menu (dropdown)
- [ ] Click "Logout" or "Cerrar Sesión"
- [ ] Logged out (token cleared from localStorage)
- [ ] Redirected to `/` or `/login`

**Evidence**:
- Screenshot after logout
- localStorage cleared (checked in DevTools)

#### 9.2: Login Again (Third Time)
- [ ] Navigate to `/login`
- [ ] Enter email and new password
- [ ] Click login
- [ ] No redirect to `/change-password-required` (already changed once)
- [ ] Direct redirect to `/firm-os` or onboarding (if not completed)

**Evidence**:
- Screenshot showing direct login without password change requirement

#### 9.3: Verify Session Persistence
- [ ] Refresh page while on `/firm-os/dashboard`
- [ ] Dashboard remains visible (token in localStorage)
- [ ] `GET /api/auth/me` returns correct user with requires_password_change=false

**Evidence**:
- Network tab showing successful /me request after refresh
- Dashboard remains visible after refresh

---

## Critical Checks (Must Pass)

### Authentication & Authorization
- [ ] Login endpoint returns `requires_password_change` flag correctly
- [ ] Token stored in localStorage correctly
- [ ] Bearer auth headers sent on all protected routes
- [ ] Admin-only endpoints reject non-admin users (403)
- [ ] Firm owner can only access own firm_id's resources

### Business Logic
- [ ] Registration creates PENDING_APPROVAL firm (no owner, no trial)
- [ ] Approval creates firm_owner with requires_password_change=true
- [ ] Rejection stores rejection_reason and audit fields
- [ ] First login redirects to password change **if** requires_password_change=true
- [ ] Second login skips password change **if** requires_password_change=false
- [ ] Temp password is cryptographically secure (16+ char alphanumeric)
- [ ] Password hashing uses bcrypt or similar (not plaintext)

### Data Integrity
- [ ] firm_id matches between firms and users.firm_id
- [ ] owner_id matches between firms.owner_id and user._id
- [ ] Timestamps (created_at, updated_at, trial_ends_at) are valid ISO 8601
- [ ] Enum fields (status, role, plan) match expected values
- [ ] No null or undefined values in critical fields

### UI/UX
- [ ] No blank white screens
- [ ] No console errors on any page
- [ ] Loading states show spinner + disabled buttons
- [ ] Error messages display readable text (not stack traces)
- [ ] Mobile responsive (sidebar collapses on small screens)

### API Responses
- [ ] All endpoints return consistent response format:
  ```json
  {
    "success": boolean,
    "data" or "message": "...",
    "error": (only on 4xx/5xx)
  }
  ```
- [ ] HTTP status codes correct (201 for POST create, 200 for others, 4xx for errors)
- [ ] No exposed sensitive data (temp passwords only shown once, never in logs)

---

## Test Environment

### Browser Setup
- Open Chrome DevTools (F12)
- Keep Console tab open (watch for errors)
- Keep Network tab open (monitor API calls)
- Check Application > Storage > localStorage (verify token storage)

### Network Monitoring
- All API calls should be HTTPS (or http:// in local dev)
- Bearer tokens should be in Authorization header, not URL
- Content-Type headers correct (application/json)
- CORS headers present on responses (if cross-origin)

### Database Inspection
- MongoDB connection string: `MONGODB_URI`
- Database: likely `punto_cero_legal` or configured name
- Collections: `users`, `firms`, `firm_config`
- Commands:
  ```
  db.firms.findOne({ status: "PENDING_APPROVAL" })
  db.users.findOne({ role: "firm_owner" })
  db.firm_config.findOne({ firm_id: "..." })
  ```

---

## Troubleshooting Guide

### Issue: Blank Firm OS Screen
**Root Causes**:
1. user from context is null/undefined
2. firm_id not in user object
3. API call fails silently
4. Component doesn't handle loading state

**Fix**:
1. Check browser console for errors
2. Inspect `user` object: `console.log(useAuth())` in component
3. Check Network tab for 401/403 errors on API calls
4. Check if token in localStorage (DevTools > Application > Storage)

### Issue: Stuck on Password Change Page
**Root Causes**:
1. `requires_password_change` never set to false after submission
2. Logout call fails, token not cleared
3. Redirect logic broken

**Fix**:
1. Check Network tab for POST to `/auth/change-password-first-login`
2. Verify response includes success=true
3. Check user document in MongoDB: requires_password_change=false
4. Manually clear localStorage and try login again

### Issue: Can't Copy Credentials
**Root Causes**:
1. `credentials.temp_password` is null/undefined
2. Copy button click handler not wired
3. Browser clipboard API not available

**Fix**:
1. Check if existing_owner found in approval logic
2. Verify temp_password_for_display assigned
3. Check response includes temp_password
4. Try manually selecting and copying text

### Issue: Admin Approval Returns 403
**Root Causes**:
1. User role not "admin" or "admin_general"
2. Token expired
3. Wrong role in database

**Fix**:
1. Verify user role in MongoDB: db.users.findOne({ email: "..." })
2. Verify token not expired: decode JWT at jwt.io
3. Test with /auth/me to check current user state
4. Re-login as admin user

### Issue: Onboarding Infinite Loop
**Root Causes**:
1. onboarding_completed never saved to firm_config
2. Hook checks stale value
3. Redirect logic broken

**Fix**:
1. Check Network tab for PATCH to `/firm-config/{firm_id}`
2. Verify response includes onboarding_completed=true
3. Check firm_config document in MongoDB
4. Force clear localStorage and hard refresh

---

## Sign-Off Checklist

When all phases pass:

- [ ] All 9 phases completed without critical errors
- [ ] All critical checks passed
- [ ] No console errors across any page
- [ ] Network tab shows all API calls returning 2xx status
- [ ] Database state is consistent (no orphaned records)
- [ ] Screenshots/evidence collected for documentation
- [ ] Performance acceptable (no hangs or slowness)
- [ ] Mobile/responsive design verified
- [ ] Ready for production deployment

---

## Approved By

- [ ] QA Engineer: ________________  Date: ________
- [ ] Lead Engineer: ________________  Date: ________
- [ ] DevOps/Deployment: ________________  Date: ________

---

