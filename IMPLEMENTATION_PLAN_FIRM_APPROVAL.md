# Manual Firm Approval Workflow - Implementation Plan

## Overview
Replace the automatic email-based firm activation flow with a manual Admin OS approval workflow. This ensures:
- Complete auditability and operational oversight
- No email-dependency for access
- Clear authorization chain
- Four-product isolation intact (User OS, Lawyer OS, Firm OS, Admin OS)

---

## Phase 1: Registration Creates PENDING_APPROVAL Request ✅ COMPLETED

**Endpoint**: `POST /api/firms/register`  
**Status**: Registration now creates a `PENDING_APPROVAL` request with no session/credentials  
**Key Changes**:
- Creates firm document with `status: "PENDING_APPROVAL"`
- Does NOT create `firm_owner` user
- Does NOT activate trial
- Does NOT send activation email
- Does NOT create session token
- Returns simple confirmation message only

**Request**:
```json
{
  "name": "Firma ABC",
  "nit": "900123456",
  "email": "info@firmabc.com",
  "phone": "+57123456789",
  "address": "Cra 7 #120",
  "city": "Bogotá",
  "country": "Colombia",
  "plan": "firm_growth",
  "founder_name": "Juan Pérez",
  "founder_email": "juan@firmabc.com",
  "founder_phone": "+57312345678",
  "founder_document": "1234567890",
  "founder_bar_number": "12345"
}
```

**Response** (HTTP 201):
```json
{
  "success": true,
  "message": "Gracias. Hemos recibido tu solicitud. Nuestro equipo revisará la información y se comunicará contigo.",
  "firm_id": "507f1f77bcf86cd799439011",
  "status": "PENDING_APPROVAL"
}
```

---

## Phase 2: Admin Approval Creates Owner + Temp Password ✅ COMPLETED

**Endpoint**: `POST /api/firms/{firm_id}/approve`  
**Status**: Approval now creates firm owner with temporary credentials  
**Key Changes**:
- Verifies firm is in `PENDING_APPROVAL` status
- Creates `firm_owner` user with temporary password
- Generates secure temp password: `secrets.token_urlsafe(16)` (22 chars)
- Hashes password with bcrypt (`get_password_hash()`)
- Sets `requires_password_change: true` (forced on first login)
- Activates firm: `status: "ACTIVE"`
- Activates trial: 7 days from approval
- Sends welcome email (non-blocking, does not prevent approval)
- Returns credentials in HTTP response for admin to deliver manually

**Request**:
```bash
POST /api/firms/507f1f77bcf86cd799439011/approve
Authorization: Bearer {admin_token}
```

**Response** (HTTP 200):
```json
{
  "success": true,
  "message": "Firma 'Firma ABC' aprobada exitosamente.",
  "firm_id": "507f1f77bcf86cd799439011",
  "owner_id": "507f1f77bcf86cd799439012",
  "credentials": {
    "email": "juan@firmabc.com",
    "temp_password": "abcd1234EfGhIjKlMn_-",
    "note": "Contraseña temporal válida para primer acceso. Usuario debe cambiarla al ingresar."
  },
  "trial": {
    "status": "active",
    "days": 7,
    "started_at": "2025-06-28T14:30:00Z",
    "ends_at": "2025-07-05T14:30:00Z"
  },
  "email_notification": {
    "sent": true,
    "trace_id": "a1b2c3d4e5f6",
    "note": "Email de bienvenida enviado (si SMTP está disponible). Admin debe comunicar credenciales manualmente."
  }
}
```

**Database Changes** (Firm Document):
```javascript
{
  status: "ACTIVE",
  approval_status: "approved",
  approval_date: ISODate("2025-06-28T14:30:00Z"),
  approved_by: ObjectId("admin_user_id"),
  owner_id: ObjectId("firm_owner_user_id"),
  trial_status: "active",
  trial_started_at: ISODate("2025-06-28T14:30:00Z"),
  trial_ends_at: ISODate("2025-07-05T14:30:00Z"),
  subscription_status: "trial",
  subscription_plan: "trial",
  updated_at: ISODate("2025-06-28T14:30:00Z")
}
```

**Database Changes** (User Document - firm_owner):
```javascript
{
  email: "juan@firmabc.com",
  full_name: "Juan Pérez",
  password_hash: "$2b$12$...",  // bcrypt hash
  role: "firm_owner",
  firm_id: "507f1f77bcf86cd799439011",
  status: "ACTIVE",
  is_verified: true,
  requires_password_change: true,  // Forced password change on first login
  created_at: ISODate("2025-06-28T14:30:00Z"),
  updated_at: ISODate("2025-06-28T14:30:00Z")
}
```

---

## Phase 3: Admin Rejection Endpoint ✅ COMPLETED

**Endpoint**: `POST /api/firms/{firm_id}/reject`  
**Status**: Rejection now properly records audit trail  
**Key Changes**:
- Validates firm is in `PENDING_APPROVAL` status
- Records rejection reason (required, min 5 chars, max 500 chars)
- Stores complete audit trail in firm document
- Sets `status: "REJECTED"`
- Deactivates any associated `firm_owner` user to status `"REJECTED"`
- Sends rejection notification email (non-blocking)
- Logs rejection in structured audit trail
- Preserves all records for compliance (does NOT delete)

**Request**:
```bash
POST /api/firms/507f1f77bcf86cd799439011/reject
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "reason": "Información de NIT incompleta o inválida. Por favor verificar documento de constitución."
}
```

**Response** (HTTP 200):
```json
{
  "success": true,
  "message": "Firma 'Firma ABC' rechazada exitosamente.",
  "firm_id": "507f1f77bcf86cd799439011",
  "firm_name": "Firma ABC",
  "rejection": {
    "reason": "Información de NIT incompleta o inválida. Por favor verificar documento de constitución.",
    "rejected_by_admin": "507f1f77bcf86cd799439099",
    "rejected_at": "2025-06-28T14:35:00Z",
    "audit_record": {
      "firm_status_before": "PENDING_APPROVAL",
      "firm_status_after": "REJECTED",
      "owner_id": null,
      "owner_status_after": null
    }
  },
  "email_notification": {
    "sent": true,
    "trace_id": "x1y2z3w4v5u6",
    "recipient": "juan@firmabc.com",
    "note": "Notificación enviada al propietario de la firma (si SMTP disponible)"
  }
}
```

**Database Changes** (Firm Document):
```javascript
{
  status: "REJECTED",
  approval_status: "rejected",
  rejection_reason: "Información de NIT incompleta o inválida. Por favor verificar documento de constitución.",
  rejected_by: ObjectId("admin_user_id"),
  rejected_at: ISODate("2025-06-28T14:35:00Z"),
  updated_at: ISODate("2025-06-28T14:35:00Z")
}
```

**Database Changes** (User Document - if owner existed):
```javascript
{
  status: "REJECTED",
  updated_at: ISODate("2025-06-28T14:35:00Z")
}
```

**Audit Logging**:
```
[REJECT_FIRM] firm_id=507f1f77bcf86cd799439011 | firm_name=Firma ABC | rejected_by=507f1f77bcf86cd799439099 | reason=Información de NIT incompleta...
[REJECT_FIRM_EMAIL] email_sent=true | trace_id=x1y2z3w4v5u6 | recipient=juan@firmabc.com
```

---

## Phase 4: Admin OS "Solicitudes de Firmas" Module (PENDING)

**Scope**: Create Admin OS UI to manage pending firm approvals  
**Features**:
- List all `PENDING_APPROVAL` firms with creation date, plan, contact info
- Individual firm detail view with full application data
- Approve button → shows modal with owner credentials (one-time display)
- Copy credentials button → copies email + temp password to clipboard
- Reject button → requires rejection reason input
- Filter by status: Pending, Approved, Rejected
- Search by firm name, email, NIT
- Audit log: who approved/rejected, when, reason

**Endpoints Used**:
- `GET /api/firms/status/pending` - List pending approvals
- `GET /api/firms/{firm_id}` - Get firm details
- `POST /api/firms/{firm_id}/approve` - Approve and get credentials
- `POST /api/firms/{firm_id}/reject` - Reject with reason
- `GET /api/firms/{firm_id}/trial` - Check trial status

---

## Phase 5: Landing Page Update (PENDING)

**Scope**: Update landing page registration to use new flow  
**Changes**:
- Remove automatic session creation on registration
- Update confirmation message to explain manual approval
- Remove "redirecting to Firm OS" messaging
- Add expected approval timeline (e.g., "Within 24 hours")
- Remove activation email dependency messaging

---

## Phase 6: First-Login Password Change (PENDING)

**Scope**: Implement forced password change on first login  
**Flow**:
1. `firm_owner` logs in with temp password
2. Frontend detects `requires_password_change: true`
3. Redirects to forced password change page
4. User cannot access Firm OS until password changed
5. After password set: `requires_password_change: false`, can proceed to dashboard

**Endpoint** (New):
```bash
POST /api/auth/change-password-first-login
Authorization: Bearer {temp_password_token}
{
  "current_password": "tempPassword123_",
  "new_password": "secureNewPassword456!"
}
```

---

## Phase 7: Admin Credentials Display/Copy UI (PENDING)

**Scope**: Create clean UI in Admin OS for credential delivery  
**Features**:
- Display credentials in admin-only modal after approval
- One-time visibility (encourage admin to copy immediately)
- Copy-to-clipboard buttons for email and password
- "Credentials Copied" toast notification
- Option to re-approve if credentials were not saved
- Audit log shows credential copy events

---

## Security & Compliance

### Audit Trail
- Every approval/rejection recorded with:
  - Admin who performed action (user_id)
  - Timestamp
  - Reason (for rejections)
  - Status changes
  - Related user IDs

### Temporary Passwords
- Generated with `secrets.token_urlsafe(16)` (22 chars, URL-safe)
- Hashed with bcrypt before storage
- Only displayed once in HTTP response
- Not logged in any form
- Marked for required change on first login

### Email Delivery
- All email sends are non-blocking
- Failures do not prevent approval/rejection
- Email trace ID logged for diagnostics
- Manual delivery option for admins

### Four-Product Isolation
- User OS: Standard user accounts only
- Lawyer OS: Lawyer-scoped access
- Firm OS: Firm owner + admin + lawyer roles (within firm_id)
- Admin OS: Global admin role only

---

## Status Summary

| Phase | Description | Status | Next Step |
|-------|-------------|--------|-----------|
| 1 | Registration → PENDING_APPROVAL | ✅ COMPLETED | Commit to backend |
| 2 | Approval → Create Owner + Temp Pwd | ✅ COMPLETED | Commit to backend |
| 3 | Rejection → Full Audit Trail | ✅ COMPLETED | Commit to backend |
| 4 | Admin OS Solicitudes Module | PENDING | Design UI mockup |
| 5 | Landing Page Update | PENDING | Remove session auto-create |
| 6 | First-Login Password Change | PENDING | Implement endpoint + frontend UI |
| 7 | Admin Credentials Display UI | PENDING | Build modal component |

---

## Testing Checklist (After All Phases)

- [ ] Registration creates PENDING_APPROVAL firm
- [ ] Admin approval creates firm_owner + temp password
- [ ] Admin can copy credentials from approval response
- [ ] Firm owner logs in with temp password
- [ ] First login forces password change
- [ ] After password change, can access Firm OS
- [ ] Admin rejection creates REJECTED status
- [ ] Rejection email sent with reason
- [ ] Rejected firm cannot log in
- [ ] All audit trails logged correctly
- [ ] Trial activates on approval
- [ ] Trial countdown works correctly

---

## Deployment Notes

1. Deploy Phase 1-3 together (registration, approval, rejection)
2. Update admin dashboard to use new approval endpoint
3. Keep old activation email flow disabled (but code remains for rollback)
4. Monitor rejection rates and email delivery
5. Phase 4-7 can be deployed incrementally after Phase 1-3 stabilizes
