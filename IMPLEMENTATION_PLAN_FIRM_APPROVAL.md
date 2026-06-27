# Implementation Plan: Manual Firm Approval Flow

## Objective
Replace email-based activation with manual approval from Admin OS.

## Current State Analysis

### What exists today:
- `POST /api/firms/register` creates firm + firm_owner + sends activation email
- `POST /api/firms/{id}/approve` generates activation token, sends email with activation link
- Firm Owner activates via `/activate-firm?token=...` endpoint
- Trial starts on registration, not on approval

### What needs to change:
- Registration should NOT create firm_owner
- Registration should NOT send emails
- Registration state: PENDING_APPROVAL
- Approval creates firm_owner + generates temp password
- Admin OS needs UI to list and approve solicitudes
- First login after approval must force password change

---

## Implementation Phases

### Phase 1: Backend - Modify Registration Endpoint
**File:** `backend/routes/firms.py`
**Function:** `register_firm()`

**Changes:**
- Remove firm_owner creation from registration
- Set state to "PENDING_APPROVAL" instead of "PENDING_VERIFICATION"
- Remove email sending from registration
- Return simple success message
- Keep trial_status = "inactive" (starts on approval)

**Affected endpoints:**
- `POST /api/firms/register` (modified)

---

### Phase 2: Backend - Enhance Approval Endpoint
**File:** `backend/routes/firms.py`
**Function:** `approve_firm()` (enhance existing)

**Changes:**
- Change from sending activation token to generating temp password
- Create firm_owner if doesn't exist
- Mark account as ACTIVE
- Generate secure temp password (`secrets.token_urlsafe(16)`)
- Set flag: `requires_password_change = True`
- Activate trial (set trial_started_at to now)
- Attempt email send but don't block on failure
- Return credentials to admin UI

**Affected endpoints:**
- `POST /api/firms/{id}/approve` (enhanced)

---

### Phase 3: Backend - Add Rejection Endpoint
**File:** `backend/routes/firms.py`
**Function:** `reject_firm()` (enhance existing)

**Changes:**
- Accept rejection reason
- Set status to "REJECTED"
- Store rejection_reason field
- Don't delete record

**Affected endpoints:**
- `POST /api/firms/{id}/reject` (enhance)

---

### Phase 4: Backend - Force Password Change on First Login
**File:** `backend/routes/auth.py`
**Function:** `login()` (modify)

**Changes:**
- Check if user has `requires_password_change = True`
- If yes: return special response with flag
- Don't return session token yet
- Client redirects to password change form

**New endpoint:**
- `POST /auth/change-password-first-login` (new)

---

### Phase 5: Frontend - Update Landing Registration
**File:** `frontend/src/pages/LandingPage.jsx`
**Component:** `FirmRegistrationStreamlined`

**Changes:**
- After successful registration, don't login
- Show message: "Gracias. Hemos recibido tu solicitud. Nuestro equipo revisará la información y se comunicará contigo."
- Clear form
- Don't redirect to Firm OS
- No session creation

---

### Phase 6: Frontend - Create Admin OS Module (Solicitudes de Firmas)
**New files:**
- `frontend/src/modules/admin/pages/FirmSolicitudes.jsx`
- `frontend/src/modules/admin/components/SolicitudesTable.jsx`
- `frontend/src/modules/admin/components/ApprovalModal.jsx`

**Features:**
- List all PENDING_APPROVAL firms
- Show: name, founder, email, phone, country, plan, date, status
- Actions: View, Approve, Reject
- ApprovalModal shows temp credentials
- Copy button for credentials

---

### Phase 7: Frontend - Password Change on First Login
**New file:**
- `frontend/src/pages/ChangePasswordFirstLogin.jsx`

**Features:**
- Mandatory password change form
- Only access after login with temp password
- Redirect to Firm OS after successful change

---

## Data Model Changes

### Firm collection updates:
- Add/update fields:
  - `status`: PENDING_APPROVAL | ACTIVE | REJECTED | SUSPENDED
  - `trial_status`: inactive | active | expired
  - `rejection_reason`: string (optional)
  - `approved_at`: datetime (optional)
  - `approved_by`: string (optional)

### User (firm_owner) collection updates:
- Add field:
  - `requires_password_change`: boolean (default: false)

---

## Database Queries to Add

```javascript
// Get pending solicitudes
db.firms.find({"status": "PENDING_APPROVAL"})

// Get firm with full details
db.firms.findOne({"_id": ObjectId(firm_id)})

// Get users with requires_password_change
db.users.find({"requires_password_change": true})
```

---

## API Endpoints Affected

| Method | Endpoint | Change | Impact |
|--------|----------|--------|--------|
| POST | `/api/firms/register` | Modified | No email, state=PENDING_APPROVAL |
| POST | `/api/firms/{id}/approve` | Enhanced | Gen temp pwd, create owner |
| POST | `/api/firms/{id}/reject` | Enhanced | Store reason, no deletion |
| POST | `/auth/login` | Modified | Check requires_password_change |
| POST | `/auth/change-password-first-login` | New | Force pwd change before access |
| GET | `/api/firms/pending` | New | List PENDING_APPROVAL for admin |

---

## Frontend Routes Affected

| Route | Component | Change |
|-------|-----------|--------|
| `/` | LandingPage | Remove auto-login after registration |
| `/admin/solicitudes` | New | Admin solicitudes listing |
| `/change-password` | New | Mandatory password change |
| `/login` | Modified | Handle requires_password_change |

---

## Testing Strategy

### E2E Tests:
1. **Registration Flow**
   - Register firm → verify PENDING_APPROVAL
   - Verify no email sent
   - Verify no session created

2. **Approval Flow**
   - Admin approves firm
   - Verify firm_owner created
   - Verify temp password generated
   - Verify trial activated
   - Verify credentials shown to admin

3. **First Login Flow**
   - Login with temp password
   - Verify redirect to password change
   - Change password
   - Verify redirect to Firm OS

4. **Rejection Flow**
   - Admin rejects firm
   - Verify status = REJECTED
   - Verify reason stored
   - Verify record not deleted

---

## Files to Modify

**Backend:**
1. `backend/routes/firms.py` (3 functions)
2. `backend/routes/auth.py` (1 function, 1 new endpoint)
3. `backend/models/firm.py` (optional - if adding new fields)
4. `backend/models/user.py` (optional - if adding new fields)

**Frontend:**
1. `frontend/src/pages/LandingPage.jsx`
2. `frontend/src/modules/admin/AdminModule.jsx` (add route)
3. `frontend/src/modules/admin/pages/FirmSolicitudes.jsx` (new)
4. `frontend/src/modules/admin/components/SolicitudesTable.jsx` (new)
5. `frontend/src/modules/admin/components/ApprovalModal.jsx` (new)
6. `frontend/src/pages/ChangePasswordFirstLogin.jsx` (new)
7. `frontend/src/pages/LoginPage.jsx` (modify)

---

## Rollback Strategy

If issues found:
1. Revert commits
2. Restore email-based activation
3. Keep git history for reference

---

## Success Criteria

- ✅ Registration creates PENDING_APPROVAL firm
- ✅ No automatic firm_owner creation
- ✅ No email sent during registration
- ✅ Admin OS shows solicitudes list
- ✅ Admin can approve with temp credentials
- ✅ Admin can reject with reason
- ✅ First login forces password change
- ✅ Trial activates on approval, not registration
- ✅ All E2E tests pass
- ✅ Architecture isolation maintained
- ✅ RBAC not modified
- ✅ No cross-product access added

---

## Next Step

Begin **Phase 1: Backend - Modify Registration**

Estimated total time: 4-6 hours for complete implementation + testing.
