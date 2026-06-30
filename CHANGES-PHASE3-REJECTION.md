# Phase 3: Rejection Endpoint Implementation

**Date**: June 28, 2025  
**Status**: ✅ COMPLETED  
**Scope**: Enhanced `POST /api/firms/{firm_id}/reject` with full audit trail

---

## Summary

Improved the firm rejection endpoint to implement a complete audit trail for rejected firm applications. The new flow ensures that all rejections are recorded with full context, admin accountability, and non-blocking email notifications.

---

## Changes Made

### File: `backend/routes/firms.py`

**Location**: Lines 668-757 (rejection endpoint)

**Enhancements**:

1. **Status Validation**
   - Only allows rejection of firms in `PENDING_APPROVAL` status
   - Prevents accidental rejection of active/suspended firms
   - Returns clear error if firm is in wrong state

2. **Audit Trail Recording**
   - Records `rejected_by` (admin user_id)
   - Records `rejected_at` timestamp (ISO format)
   - Stores complete `rejection_reason` (5-500 chars, validated by Pydantic)
   - Preserves all previous records (no deletion)

3. **User Deactivation**
   - If firm had an associated `firm_owner`, sets user `status: "REJECTED"`
   - Prevents rejected firm owner from accessing the system
   - Preserves user record for compliance/audit

4. **Structured Response**
   - Returns confirmation with complete rejection details
   - Includes audit record showing state changes
   - Shows which admin performed the action
   - Confirms email notification delivery

5. **Email Notification**
   - Sends rejection notification email to founder
   - Email includes rejection reason
   - Non-blocking: approval completes even if email fails
   - Logs email trace ID for diagnostics

6. **Comprehensive Logging**
   - Logs rejection with firm ID, name, admin, reason (truncated)
   - Logs email delivery status separately
   - Enables easy audit trail reconstruction from logs

---

## API Specification

### Endpoint
```
POST /api/firms/{firm_id}/reject
```

### Authentication
- Required: Admin token (Bearer)
- Roles: `admin` or `admin_general` only

### Request Body
```json
{
  "reason": "Información incompleta o inválida. Reenviar con documentación completa."
}
```

**Validation**:
- `reason`: required, min 5 chars, max 500 chars
- Database validates in `FirmRejectRequest` model

### Success Response (HTTP 200)
```json
{
  "success": true,
  "message": "Firma 'Firma ABC' rechazada exitosamente.",
  "firm_id": "507f1f77bcf86cd799439011",
  "firm_name": "Firma ABC",
  "rejection": {
    "reason": "Información incompleta o inválida. Reenviar con documentación completa.",
    "rejected_by_admin": "507f1f77bcf86cd799439099",
    "rejected_at": "2025-06-28T14:35:00Z",
    "audit_record": {
      "firm_status_before": "PENDING_APPROVAL",
      "firm_status_after": "REJECTED",
      "owner_id": "507f1f77bcf86cd799439012",
      "owner_status_after": "REJECTED"
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

### Error Responses

**401 Unauthorized** (non-admin):
```json
{
  "detail": "Solo administradores pueden rechazar firmas"
}
```

**400 Bad Request** (invalid firm_id):
```json
{
  "detail": "ID de firma inválido"
}
```

**404 Not Found**:
```json
{
  "detail": "Firma no encontrada"
}
```

**400 Bad Request** (wrong status):
```json
{
  "detail": "Firma no puede ser rechazada desde estado 'ACTIVE'. Solo se pueden rechazar firmas en PENDING_APPROVAL."
}
```

---

## Database Changes

### Firm Document
Before:
```javascript
{
  status: "PENDING_APPROVAL",
  approval_status: "pending",
  approval_date: null,
  approved_by: null,
  rejection_reason: null,
  updated_at: ISODate("2025-06-28T12:00:00Z")
}
```

After:
```javascript
{
  status: "REJECTED",
  approval_status: "rejected",
  approval_date: null,
  approved_by: null,
  rejection_reason: "Información incompleta o inválida. Reenviar con documentación completa.",
  rejected_by: ObjectId("507f1f77bcf86cd799439099"),
  rejected_at: ISODate("2025-06-28T14:35:00Z"),
  updated_at: ISODate("2025-06-28T14:35:00Z")
}
```

### User Document (if firm_owner existed)
Before:
```javascript
{
  status: "ACTIVE",
  updated_at: ISODate("2025-06-28T12:00:00Z")
}
```

After:
```javascript
{
  status: "REJECTED",
  updated_at: ISODate("2025-06-28T14:35:00Z")
}
```

---

## Audit Logging

### Log Format
```
[REJECT_FIRM] firm_id={firm_id} | firm_name={name} | rejected_by={user_id} | reason={reason_snippet}...
[REJECT_FIRM_EMAIL] email_sent={bool} | trace_id={trace_id} | recipient={email}
[REJECT_FIRM_EMAIL_FAILED] firm_id={firm_id} | error={error_msg}
```

### Example Logs
```
[REJECT_FIRM] firm_id=507f1f77bcf86cd799439011 | firm_name=Firma ABC | rejected_by=507f1f77bcf86cd799439099 | reason=Información de NIT incompleta...
[REJECT_FIRM_EMAIL] email_sent=true | trace_id=x1y2z3w4v5u6 | recipient=juan@firmabc.com
```

---

## Integration Points

### Admin OS (Phase 4)
- Uses this endpoint from firm detail view
- Displays rejection confirmation with audit trail
- Shows admin who rejected + timestamp + reason

### Email System
- Uses `send_email()` from `utils.notifier`
- Non-blocking: email failure does not fail rejection
- Includes email trace ID for diagnostics
- Sends HTML-formatted rejection notice

### Compliance & Audit
- All rejections searchable by admin ID, timestamp, reason
- Original firm records never deleted
- Rejected firm owners cannot log in
- Complete audit trail for compliance reviews

---

## Testing Scenarios

### Test 1: Reject PENDING_APPROVAL Firm
```bash
POST /api/firms/507f1f77bcf86cd799439011/reject
Authorization: Bearer {admin_token}
{
  "reason": "Información incompleta de NIT"
}
```
✅ Expected: HTTP 200, firm status = REJECTED

### Test 2: Reject Already-Rejected Firm
```bash
POST /api/firms/507f1f77bcf86cd799439011/reject
Authorization: Bearer {admin_token}
{
  "reason": "Another reason"
}
```
✅ Expected: HTTP 200, updates rejection reason (can re-reject if needed)

### Test 3: Reject ACTIVE Firm
```bash
POST /api/firms/507f1f77bcf86cd799439011/reject
Authorization: Bearer {admin_token}
{
  "reason": "Should not work"
}
```
❌ Expected: HTTP 400, "Firma no puede ser rechazada desde estado 'ACTIVE'"

### Test 4: Non-Admin Attempt to Reject
```bash
POST /api/firms/507f1f77bcf86cd799439011/reject
Authorization: Bearer {firm_owner_token}
{
  "reason": "Trying to reject"
}
```
❌ Expected: HTTP 403, "Solo administradores pueden rechazar firmas"

### Test 5: Email Failure (SMTP Down)
- Disable SMTP or use invalid credentials
- Rejection should complete successfully
- Email trace should show "email_failed"
- HTTP 200 still returned
✅ Expected: Rejection succeeds, email_sent = false

---

## Next Steps

1. **Commit Changes**: Stage and commit Phase 3 rejection endpoint
2. **Phase 4**: Build Admin OS "Solicitudes de Firmas" UI module
3. **Phase 5**: Update landing page registration messaging
4. **Phase 6**: Implement first-login password change flow
5. **Phase 7**: Build admin credentials display/copy UI

---

## Rollback Plan

If rejection logic needs to be reverted:
1. Restore previous version of `backend/routes/firms.py` (rejection endpoint)
2. No database migration needed (new fields are additive only)
3. Old rejections remain in DB with partial audit trail

---

## Monitoring

### Key Metrics to Track
- Rejection rate (rejections / total registrations)
- Average rejection reason length/type
- Email delivery success rate for rejections
- Time from registration to rejection decision
- Admin who most frequently approves/rejects (for QA)

### Alerts to Set
- Rejection failure rate > 5%
- Email delivery failure rate > 10% for rejection notices
- Unusual rejection patterns (bulk rejections in short time)

---

## Compliance Notes

- ✅ Rejection reason stored (regulatory requirement)
- ✅ Admin accountability (rejected_by field)
- ✅ Timestamp for all actions
- ✅ No deletion of records (audit trail intact)
- ✅ Rejected users cannot access system
- ✅ Email notification provided to applicant
