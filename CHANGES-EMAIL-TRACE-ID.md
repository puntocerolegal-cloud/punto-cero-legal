# Email Trace ID Implementation

## Overview
Added unique email trace IDs to all SMTP logging for enhanced production debugging without modifying business logic.

## Changes Made

### File: `backend/utils/notifier.py`

#### Added Import
```python
import secrets
```

#### Enhanced `send_email()` Function

**New Features:**
1. Generate unique `email_trace_id` per call
   ```python
   email_trace_id = secrets.token_hex(6)
   # Example: "8f3a7d12bc91"
   ```

2. All logs include trace ID prefix
   ```
   [EMAIL_TRACE:8f3a7d12bc91] QA_PHASE1 | ...
   [EMAIL_TRACE:8f3a7d12bc91] QA_PHASE2 | ...
   ```

3. Complete exception handling without truncation
   - Captures `str(e)` (full message)
   - Captures `repr(e)` (complete representation)
   - Captures `type(e).__name__` (exception type)
   - Extracts `smtp_code` and `smtp_error` if available

4. Auto-detect failure phase
   - Connection
   - TLS
   - Login
   - Sendmail

5. Detailed failure summary
   ```
   [EMAIL_TRACE:8f3a7d12bc91] FAILURE_SUMMARY | Estado: FAILURE | Fase: Login | Tipo: SMTPAuthenticationError | Destinatario: user@example.com
   ```

## Log Format

### Success Path
```
[EMAIL_TRACE:8f3a7d12bc91] QA_PHASE1 | SMTP_HOST=smtp.gmail.com | SMTP_PORT=587 | SMTP_USER=al***...om | SMTP_FROM=noreply@domain.com | to_email=user@example.com | subject=Test
[EMAIL_TRACE:8f3a7d12bc91] QA_PHASE2 | Intentando conectar a SMTP smtp.gmail.com:587
[EMAIL_TRACE:8f3a7d12bc91] QA_PHASE2 | Conectado al servidor SMTP exitosamente
[EMAIL_TRACE:8f3a7d12bc91] QA_PHASE2 | TLS inicializado
[EMAIL_TRACE:8f3a7d12bc91] QA_PHASE2 | Intentando login con usuario: al***...om
[EMAIL_TRACE:8f3a7d12bc91] QA_PHASE2 | Autenticación SMTP exitosa
[EMAIL_TRACE:8f3a7d12bc91] QA_PHASE3 | Iniciando sendmail() desde noreply@domain.com a user@example.com
[EMAIL_TRACE:8f3a7d12bc91] QA_PHASE3 | Correo enviado correctamente a user@example.com
[EMAIL_TRACE:8f3a7d12bc91] QA_SUCCESS | Estado: SUCCESS | Servidor SMTP: OK | Autenticación: OK | Sendmail: OK | Destinatario: user@example.com
```

### Failure Path
```
[EMAIL_TRACE:8f3a7d12bc91] QA_PHASE1 | ...
[EMAIL_TRACE:8f3a7d12bc91] QA_PHASE2 | Conectado al servidor SMTP exitosamente
[EMAIL_TRACE:8f3a7d12bc91] QA_PHASE2 | TLS inicializado
[EMAIL_TRACE:8f3a7d12bc91] QA_PHASE2 | Intentando login con usuario: al***...om
[EMAIL_TRACE:8f3a7d12bc91] QA_FAILURE | Tipo de excepción: SMTPAuthenticationError
[EMAIL_TRACE:8f3a7d12bc91] QA_FAILURE | Fase donde falló: Login
[EMAIL_TRACE:8f3a7d12bc91] QA_FAILURE | Mensaje completo: (535, b'5.7.8 Username and Password not accepted')
[EMAIL_TRACE:8f3a7d12bc91] QA_FAILURE | Repr: SMTPAuthenticationError(535, b'5.7.8 Username and Password not accepted')
[EMAIL_TRACE:8f3a7d12bc91] QA_FAILURE | SMTP Code: 535
[EMAIL_TRACE:8f3a7d12bc91] QA_FAILURE | SMTP Error: b'5.7.8 Username and Password not accepted'
[EMAIL_TRACE:8f3a7d12bc91] FAILURE_SUMMARY | Estado: FAILURE | Fase: Login | Tipo: SMTPAuthenticationError | Destinatario: user@example.com
```

## Response Changes

Return value now includes `email_trace_id`:

```python
# Success
{"channel": "email", "sent": True, "email_trace_id": "8f3a7d12bc91"}

# Failure
{"channel": "email", "sent": False, "reason": "...", "email_trace_id": "8f3a7d12bc91"}
```

## No Logic Changes

- ✅ Email sending behavior unchanged
- ✅ HTTP endpoints unchanged
- ✅ Business logic preserved
- ✅ Error handling preserved
- ✅ Response codes unchanged
- ✅ Database operations unchanged

## Traceability in Production

Search Render logs by trace ID:
```
[EMAIL_TRACE:8f3a7d12bc91]
```

This will show the complete lifecycle of a single email send attempt without mixing with other requests.

## Diagnostic Value

With this implementation:
1. Identify exact point of SMTP failure
2. Capture complete error messages from Gmail/SMTP server
3. Distinguish connection vs authentication vs sending failures
4. Correlate logs across request lifecycle
5. No truncation of critical diagnostic information
