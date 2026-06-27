# Email Trace ID - Complete Documentation

## Overview

The Email Trace System provides end-to-end observability for every email sent by Punto Cero Legal. A unique identifier (`email_trace_id`) is generated for each send attempt and tracked through all system layers.

---

## Complete Recorrido (Journey)

```
Frontend (Landing Page)
    ↓ POST /api/firms/register
API Endpoint
    ↓ Validations + Firm Creation
send_email() Function
    ↓ Generate email_trace_id
    ↓ SMTP Connection → TLS → Login → Sendmail
SMTP Server (Gmail, Sendgrid, etc)
    ↓ Accept or Reject
Backend Logging
    ↓ Log all phases with trace_id
Database (MongoDB)
    ↓ firm_registrations collection
HTTP Response (201)
    ↓ Include email_notification object with trace_id
```

---

## Email Trace ID Explained

### What is it?
A unique 12-character hexadecimal identifier generated per email send attempt.

**Format:** `8f3a7d12bc91` (produced by `secrets.token_hex(6)`)

### Why?
- Track a single email from frontend to backend to SMTP to database
- Diagnose failures in < 1 minute without log-grepping
- Correlate client-side events with server-side failures
- Extract all diagnostic information with one search string

### Example
When a user registers a firm on `puntocerolegal.com`:

1. **Frontend:** User submits form
2. **API:** `POST /api/firms/register` creates firm + generates email_trace_id: `8f3a7d12bc91`
3. **Logging:** All subsequent logs include `[EMAIL_TRACE:8f3a7d12bc91]`
4. **Database:** Stores `email_trace_id: "8f3a7d12bc91"` in `firm_registrations`
5. **Response:** HTTP 201 includes `"trace_id": "8f3a7d12bc91"`
6. **SMTP Log:** Gmail/SMTP logs tied to this trace for diagnostics

---

## How to Find an Email Using Trace ID

### In Production Logs (Render)

1. Go to: https://dashboard.render.com
2. Select: `puntocero-legal-api` (backend service)
3. Navigate to: **Logs** tab
4. Search for: `[EMAIL_TRACE:8f3a7d12bc91`

**Result:** All logs related to that send attempt, in chronological order.

### In MongoDB

```javascript
// Find registration record with trace_id
db.firm_registrations.find({
    "email_trace_id": "8f3a7d12bc91"
})

// Returns:
{
    "_id": ObjectId("..."),
    "firm_id": "...",
    "owner_id": "...",
    "email": "founder@example.com",
    "status": "registered",
    "email_trace_id": "8f3a7d12bc91",
    "email_sent": true,
    "email_reason": null,
    "email_timestamp": ISODate("2026-06-27T..."),
    "email_provider": "smtp",
    "created_at": ISODate("2026-06-27T...")
}
```

### In HTTP Response

When client receives `201 Created`:

```json
{
    "id": "firm_id_...",
    "name": "Mi Firma Juridica",
    "email": "firma@example.com",
    "plan": "firm_growth",
    // ... other firm fields ...
    "email_notification": {
        "sent": true,
        "trace_id": "8f3a7d12bc91",
        "provider": "smtp",
        "reason": null
    }
}
```

---

## Log Output Examples

### SUCCESS Path

#### Phase 1: Configuration
```
[EMAIL_TRACE:8f3a7d12bc91] QA_PHASE1 | SMTP_HOST=smtp.gmail.com | SMTP_PORT=587 | SMTP_USER=al***...om | SMTP_FROM=noreply@puntocero-legal.com | to_email=founder@example.com | subject=Firma Registrada - Mi Firma
```

#### Phase 2: Connection & Authentication
```
[EMAIL_TRACE:8f3a7d12bc91] QA_PHASE2 | Intentando conectar a SMTP smtp.gmail.com:587
[EMAIL_TRACE:8f3a7d12bc91] QA_PHASE2 | Conectado al servidor SMTP exitosamente
[EMAIL_TRACE:8f3a7d12bc91] QA_PHASE2 | TLS inicializado
[EMAIL_TRACE:8f3a7d12bc91] QA_PHASE2 | Intentando login con usuario: al***...om
[EMAIL_TRACE:8f3a7d12bc91] QA_PHASE2 | Autenticación SMTP exitosa
```

#### Phase 3: Sending
```
[EMAIL_TRACE:8f3a7d12bc91] QA_PHASE3 | Iniciando sendmail() desde noreply@puntocero-legal.com a founder@example.com
[EMAIL_TRACE:8f3a7d12bc91] QA_PHASE3 | Correo enviado correctamente a founder@example.com
```

#### Success Summary
```
[EMAIL_TRACE:8f3a7d12bc91] QA_SUCCESS | Estado: SUCCESS | Servidor SMTP: OK | Autenticación: OK | Sendmail: OK | Destinatario: founder@example.com
```

#### Endpoint Log
```
[REGISTER_FIRM] email_trace_id=8f3a7d12bc91 | firm_id=507f1f77bcf86cd799439011 | email=founder@example.com | resultado=SUCCESS
```

#### Email Summary
```
[EMAIL_SUMMARY] Trace ID: 8f3a7d12bc91 | Firm ID: 507f1f77bcf86cd799439011 | Destinatario: founder@example.com | Resultado: SUCCESS | Provider: smtp | Sent: true
```

---

### FAILURE Path

#### Failure Sequence
```
[EMAIL_TRACE:9b4c2e8f5a71] QA_PHASE1 | SMTP_HOST=smtp.gmail.com | ...
[EMAIL_TRACE:9b4c2e8f5a71] QA_PHASE2 | Conectado al servidor SMTP exitosamente
[EMAIL_TRACE:9b4c2e8f5a71] QA_PHASE2 | TLS inicializado
[EMAIL_TRACE:9b4c2e8f5a71] QA_PHASE2 | Intentando login con usuario: al***...om
[EMAIL_TRACE:9b4c2e8f5a71] QA_FAILURE | Tipo de excepción: SMTPAuthenticationError
[EMAIL_TRACE:9b4c2e8f5a71] QA_FAILURE | Fase donde falló: Login
[EMAIL_TRACE:9b4c2e8f5a71] QA_FAILURE | Mensaje completo: (535, b'5.7.8 Username and Password not accepted. Learn more at 5.7.8  https://support.google.com/mail/answer/14257 sm...')
[EMAIL_TRACE:9b4c2e8f5a71] QA_FAILURE | Repr: SMTPAuthenticationError(535, b'5.7.8 Username and Password not accepted...')
[EMAIL_TRACE:9b4c2e8f5a71] QA_FAILURE | SMTP Code: 535
[EMAIL_TRACE:9b4c2e8f5a71] QA_FAILURE | SMTP Error: b'5.7.8 Username and Password not accepted. Learn more at...'
[EMAIL_TRACE:9b4c2e8f5a71] FAILURE_SUMMARY | Estado: FAILURE | Fase: Login | Tipo: SMTPAuthenticationError | Destinatario: founder@example.com
```

#### Endpoint Log (Failure)
```
[REGISTER_FIRM] email_trace_id=9b4c2e8f5a71 | firm_id=507f1f77bcf86cd799439012 | email=founder@example.com | resultado=FAILURE
```

#### Email Summary (Failure)
```
[EMAIL_SUMMARY] Trace ID: 9b4c2e8f5a71 | Firm ID: 507f1f77bcf86cd799439012 | Destinatario: founder@example.com | Resultado: FAILURE | Provider: smtp | Sent: false
```

#### Database Record (Failure)
```javascript
{
    "firm_id": "507f1f77bcf86cd799439012",
    "email": "founder@example.com",
    "email_trace_id": "9b4c2e8f5a71",
    "email_sent": false,
    "email_reason": "(535, b'5.7.8 Username and Password not accepted...')",
    "email_timestamp": ISODate("2026-06-27T..."),
    "email_provider": "smtp"
}
```

#### HTTP Response (Still 201, but with failure info)
```json
{
    "id": "firm_id_...",
    "name": "Mi Firma Juridica",
    "email": "firma@example.com",
    "email_notification": {
        "sent": false,
        "trace_id": "9b4c2e8f5a71",
        "provider": "smtp",
        "reason": "(535, b'5.7.8 Username and Password not accepted. Learn more at...')"
    }
}
```

---

## Quick Diagnostic Guide

### Problem: Email never arrived
1. Get trace_id from client response: `email_notification.trace_id`
2. Search Render logs: `[EMAIL_TRACE:8f3a7d12bc91`
3. Find `QA_SUCCESS` or `QA_FAILURE`
4. If `QA_SUCCESS`: Email sent, problem is in inbox/spam
5. If `QA_FAILURE`: Check failure phase (Login/TLS/Connection)

### Problem: Authentication rejected
Look for:
```
[EMAIL_TRACE:...] QA_FAILURE | Tipo de excepción: SMTPAuthenticationError
[EMAIL_TRACE:...] SMTP Code: 535
```
→ SMTP_USER or SMTP_PASS is incorrect

### Problem: Sender rejected
Look for:
```
[EMAIL_TRACE:...] QA_FAILURE | Tipo de excepción: SMTPSenderRefused
[EMAIL_TRACE:...] SMTP Code: 553
```
→ SMTP_FROM doesn't match authorized account

### Problem: Connection refused
Look for:
```
[EMAIL_TRACE:...] QA_FAILURE | Fase donde falló: Conexión
```
→ SMTP_HOST or SMTP_PORT is wrong, or firewall blocks it

---

## Data Stored Per Email Send

### In `firm_registrations` MongoDB Collection
```javascript
{
    "firm_id": "string",               // Firm identifier
    "owner_id": "string",              // User identifier
    "email": "string",                 // Destination email
    "status": "registered",            // Registration status
    "email_trace_id": "string",        // 12-char hex identifier ← KEY
    "email_sent": "boolean",           // true | false
    "email_reason": "string|null",     // Error message if failed
    "email_timestamp": "ISODate",      // When send was attempted
    "email_provider": "string",        // Always "smtp" currently
    "created_at": "ISODate"            // Record creation time
}
```

### In HTTP Response
```javascript
{
    // ... all standard FirmResponse fields ...
    "email_notification": {
        "sent": "boolean",             // true | false
        "trace_id": "string",          // 12-char hex identifier ← KEY
        "provider": "string",          // "smtp"
        "reason": "string|null"        // Error message or null if success
    }
}
```

---

## Locating a Complete Email Lifecycle

### Given only an email address and approximate time:

1. **Find in Logs (Render):**
   ```
   Filter by timestamp, search: "founder@example.com"
   Find: [REGISTER_FIRM] ... email=founder@example.com
   Copy: email_trace_id=8f3a7d12bc91
   ```

2. **Get all related logs:**
   ```
   Search: [EMAIL_TRACE:8f3a7d12bc91
   Result: All 15-20 log lines for that email send
   ```

3. **Verify in Database:**
   ```javascript
   db.firm_registrations.findOne({"email_trace_id": "8f3a7d12bc91"})
   ```

4. **Check Client Response:**
   If you have the API response, look for: `email_notification.trace_id`

### Total diagnostic time: < 1 minute

---

## Architecture Unchanged

This tracing system:
- ✅ Does NOT change business logic
- ✅ Does NOT alter endpoints
- ✅ Does NOT change HTTP status codes (201 remains 201)
- ✅ Does NOT modify request/response schema (only enriched)
- ✅ Does NOT alter email sending behavior
- ✅ Does NOT change database schema (only added fields)
- ✅ Is PURE observability and diagnostics

---

## Integration Points

### Frontend → API
Client receives trace_id in response and can log it:
```javascript
const response = await fetch('/api/firms/register', {...});
const data = await response.json();
console.log('Email Trace ID:', data.email_notification.trace_id);
```

### API → Logs
Endpoint logs include trace_id:
```
[REGISTER_FIRM] email_trace_id=8f3a7d12bc91 | ...
```

### API → Database
Trace_id persisted in firm_registrations:
```
email_trace_id: "8f3a7d12bc91"
```

### send_email() → Logs
All SMTP phases logged with trace_id:
```
[EMAIL_TRACE:8f3a7d12bc91] QA_PHASE1 | ...
[EMAIL_TRACE:8f3a7d12bc91] QA_PHASE2 | ...
```

### send_email() → Response
Trace_id returned in function result:
```python
return {"channel": "email", "sent": True, "email_trace_id": "8f3a7d12bc91"}
```

---

## Summary

With Email Trace ID, a single 12-character identifier provides:
- Complete visibility of email send lifecycle
- Sub-second diagnosis of failures
- Correlation across frontend/API/database/SMTP
- No changes to system behavior or architecture
- Production-ready observability
