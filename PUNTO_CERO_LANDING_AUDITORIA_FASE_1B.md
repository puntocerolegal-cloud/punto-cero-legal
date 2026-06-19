# PUNTO CERO — AUDITORÍA FUNCIONAL DE LANDING Y PAGOS (FASE 1B)

**Proyecto:** Punto Cero Legal
**Fecha:** 2026-06-11
**Alcance:** Landing comercial, captación (clientes/abogados), pagos (MercadoPago/PayPal), chatbot Meta WhatsApp
**Tipo:** Auditoría read-only — **no se modificó ningún archivo**

---

## 1. FORMULARIO DE CLIENTES (Consulta Prioritaria)

**Frontend:** `LandingPage.jsx` — `handleClientSubmit` (línea ~180), form `client-intake-form` (línea ~583, dentro de la Form Card del Hero, `id="consulta"`).
**Backend:** `POST /api/public/case-intake` → `routes/public_intake.py:37`.

### Flujo completo
1. Usuario llena: nombre, descripción, área legal, prioridad, país, ciudad, teléfono, email (`data-testid` client-name/area/priority/country/city/phone/email).
2. `axios.post(${API}/public/case-intake)` (línea ~195).
3. Backend valida con `ClientIntake` (Pydantic): `name` 2-120, `description` 8-2000, `legal_area` 2-80, `country` 2-80 — el resto opcional.
4. Genera `consultation_number` (`CON-2026-001`) y normaliza teléfono por país.
5. Inserta en **`cases`** con `status=PENDING_ASSIGNMENT`, `assignment_status=sin_asignar`, `lawyer_id=None`, `source=landing_intake`, timeline de 5 estados.
6. Inserta notificación admin (`new_client_case`) en **`notifications`**.
7. Llama `chatbot.start_intake_conversation()` (envuelto en `try/except: pass`).

### Datos almacenados
- Colección **`cases`**: datos del cliente embebidos (`client_name`, `client_phone`, `client_email`, `client_country`, `client_city`) + clasificación inicial.
- Colección **`notifications`**: alerta para el panel admin.
- Colección **`chat_sessions`**: sesión del chatbot (preguntas, historial).

### Notificaciones generadas
- ✅ Alerta in-app al admin (siempre, en DB).
- ⚠️ Email al cliente (`if email`) — depende de SMTP configurado.
- ⚠️ WhatsApp de bienvenida + timeline (`if phone`) — depende de Meta (ver §5).

### Integración WhatsApp Meta
Vía `chatbot.start_intake_conversation` → `notifier.send_whatsapp` → Graph API. **Mensaje free-form (`type:text`)** — sujeto a la restricción de ventana 24h (ver §5).

### Posibles errores
- 🟠 **Fallos de WhatsApp/email son silenciados** (`except Exception: pass` en `case_intake`, y `try/except` en `notifier`). El cliente recibe "Solicitud recibida" aunque el WhatsApp nunca llegue.
- 🟡 **Sin rate-limit ni captcha** → endpoint público vulnerable a spam (crearía casos basura).
- 🟡 Teléfono/email opcionales → un caso puede quedar **sin canal de contacto**.
- 🟢 Validación de longitud correcta vía Pydantic.

---

## 2. FORMULARIO DE ABOGADOS (Registro Profesional)

**Frontend:** `handleLawyerSubmit` (línea ~229), form `lawyer-application-form` (línea ~1760, sección `id="abogados"`, línea ~1582).
**Backend:** `POST /api/public/lawyer-application` → `public_intake.py:128`.

### Flujo completo
1. Campos: full_name, email, phone, specialty, country, city, experience (texto libre), bar_number, firm_name, id_document (`data-testid` lawyer-name/email/phone/specialty/country…).
2. `axios.post(${API}/public/lawyer-application)` (línea ~237).
3. Validación `LawyerApplication`: full_name 3-120, email válido, specialty 2-80, country 2-80, experience 4-2000.
4. **Chequeo de duplicado por email** → 409 si ya existe.
5. Antepone honorífico "Dr." al nombre (`_with_dr`).

### Datos almacenados
- Colección **`users`** con: `role="lawyer"`, `status="PENDING_VERIFICATION"`, `is_verified=False`, **`password_hash=None`**, `source="landing_application"`, `private_notes=""`.
- Colección **`notifications`**: alerta admin `new_lawyer_application` con `candidate_id`.

### Estado inicial del usuario
`PENDING_VERIFICATION` / `is_verified=False` / **sin contraseña** (`password_hash=None`). Por eso `login` rechaza explícitamente cuentas sin `password_hash` (no puede iniciar sesión hasta ser aprobado).

### Flujo de aprobación
1. Candidato aparece en la **Sala de Ventas** del Centro de Gestión (`AdminPanel` → `admin_ops`).
2. Admin revisa (chat de ventas, notas privadas) y aprueba/rechaza vía `admin-ops/sales/candidates/{id}/{action}`.
3. Tras aprobación, el admin debe **asignar contraseña / enviar invitación** (el `password_hash=None` debe poblarse). 
   - 🟠 **Hallazgo:** el código de intake comenta "se asigna tras aprobación" pero el mecanismo de invitación/seteo de contraseña debe verificarse en `admin_ops` — si no existe, el abogado aprobado **no podría loguearse**.

### Posibles errores
- 🟡 Sin rate-limit/captcha (igual que clientes).
- 🟢 Manejo de duplicados correcto (409 diferenciado por estado).

---

## 3. INTEGRACIÓN MERCADOPAGO

### Estado actual: 🔴 **SIMULADO (no operativo)**

**Backend:** `payment.py:594` (`/init`) y `payment.py:653` (`/confirm`).

### Funcionalidad real
- `/init` calcula precio/moneda/gateway y genera un `payment_id` = `PCL-<uuid>`.
- Construye una **URL de checkout falsa**:
  ```
  https://www.mercadopago.com/checkout/v1/redirect?pref_id=PCL-XXXX&country=CO
  ```
  El `pref_id` es un UUID propio, **no una preferencia real de MercadoPago**. Comentario explícito en línea 610: *"En producción aquí se integraría con SDK real de Mercado Pago/PayPal"*.
- `/confirm` es un **"webhook simulado"** (línea 655): marca la transacción como `paid` sin validar ningún pago real, y aplica lógica de referidos.

### Cobros operativos o simulados
🔴 **Simulados.** No hay SDK de MercadoPago, no se usa `MP_ACCESS_TOKEN` (está vacío en `.env`), no se crea preferencia ni se valida webhook firmado.

### El cobro que SÍ funciona
🟢 **Pago manual por comprobante:** `POST /api/payment/receipt` (línea 431) — el usuario sube imagen/PDF del pago, queda en `receipts`, y el admin lo verifica manualmente. **Este es el único flujo de cobro real hoy.**

### Dependencias faltantes para activar MercadoPago real
- `MP_ACCESS_TOKEN` válido (vacío actualmente).
- SDK `mercadopago` (no está en `requirements.txt`).
- Crear preferencia real (`/checkout/preferences`) y devolver su `init_point`.
- Webhook real validado (firma `x-signature`) reemplazando `/confirm` simulado.

---

## 4. VIABILIDAD DE INTEGRACIÓN PAYPAL

### Estado actual: 🔴 **También simulado** (`payment.py:614` genera URL falsa `paypal.com/checkoutnow?token=<uuid>`).

La arquitectura **ya está preparada** para PayPal: existe `PAYPAL_COUNTRIES`, el `detect-gateway` enruta no-LATAM a PayPal, y `/methods` ya expone el método PayPal (color `#003087`, `requires_receipt:False`).

### Backend requerido
- Dependencia: SDK PayPal o llamadas REST v2 (`/v2/checkout/orders`) vía `httpx` (ya importado).
- Env vars: `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_MODE` (sandbox/live).
- Reemplazar la URL falsa en `/init` por **Create Order** real → devolver `approve` link.
- Endpoint **Capture Order** + webhook (`PAYMENT.CAPTURE.COMPLETED`) que sustituya `/confirm`.

### Frontend requerido
- Opcional: SDK JS de PayPal (botones) o simple redirect al `approve` link (compatible con el flujo actual de `CheckoutPage` que ya hace `init` → redirige a `checkout_url`).
- No requiere rediseño: `CheckoutPage` ya consume `init`/`confirm` genéricamente.

### Compatibilidad con la estructura actual
🟢 **ALTA.** El router de pagos fue diseñado híbrido (MP + PayPal) desde el inicio: localización, detección de gateway, modelo `transactions` y `PaymentInitResponse` ya contemplan `gateway`. Integrar PayPal real es **sustituir el bloque simulado**, sin cambios estructurales. Es incluso más sencillo que MercadoPago (REST v2 estándar, sin dependencia de país-específico).

---

## 5. CHATBOT META (WhatsApp)

### Estado actual: ⚠️ **Implementado, pero el envío saliente automático probablemente falla**

**Endpoints:** `routes/chatbot.py`
- `GET /api/webhook/whatsapp` (453) — verificación de webhook (handshake con `META_VERIFY_TOKEN`).
- `POST /api/webhook/whatsapp` (468) — recepción de mensajes entrantes.
- Envío saliente: `utils/notifier.py:69` `send_whatsapp` → Graph API `POST /{phone_id}/messages`.

### Flujo de mensajes
1. Cliente envía formulario → `start_intake_conversation` crea `chat_sessions` y llama `send_whatsapp(phone, first_msg)` + timeline.
2. Cliente responde por WhatsApp → webhook entrante `POST /webhook/whatsapp` → avanza preguntas (`q_index`) → al terminar, `_finalize` clasifica con Claude y alerta al admin.
3. Follow-ups programados (`/chatbot/run-followups`).

### 🔴 Razón por la cual NO se envía el mensaje automático al teléfono registrado

**Causa principal — Política de ventana de 24h de Meta:** la WhatsApp Cloud API **prohíbe mensajes free-form iniciados por el negocio** a un usuario que no haya escrito a la empresa en las últimas 24h. El código envía `type:"text"` (línea 86-87 de `notifier.py`), que Meta **rechaza con error 131047/470** cuando es business-initiated fuera de la ventana. Para iniciar conversación se requiere una **plantilla (HSM) pre-aprobada** (`type:"template"`), que el código **no usa**.

**Causas concurrentes probables:**
- 🔴 **`META_ACCESS_TOKEN` temporal/expirado:** el token del `.env` parece un token de usuario (expiran en ~24h-60d). Si expiró → 401, no se envía.
- 🟠 **Número en modo prueba:** si el número de WhatsApp Business está en sandbox, solo entrega a destinatarios **pre-registrados** en el panel de Meta.
- 🟠 **Errores silenciados:** `send_whatsapp` captura toda excepción y devuelve `sent:False` sin propagar; `case_intake` además envuelve todo en `except: pass`. El fallo es **invisible** para el usuario y para la UI.

**Resumen:** el código de envío es correcto técnicamente, pero choca con la política de Meta (necesita **plantilla aprobada** para el primer contacto) y, muy probablemente, con un **token expirado** y/o **número en modo prueba**. La entrega entrante (webhook) sí funciona si el webhook está verificado en el panel de Meta.

---

## 6. ANÁLISIS DE BLOQUES — `LandingPage.jsx` (~2500 líneas)

| Bloque | Ubicación aprox. | Dependencias | Riesgo de modificación |
|--------|------------------|--------------|------------------------|
| **Header / Navbar** | 273-375 | `handleAccess`, anclas `#planes`, `#modulos` | 🟢 Bajo |
| **Hero + Bloque Clientes** | 377-883 (form en 553-882) | `handleClientSubmit`, `POST /public/case-intake`, validación de teléfono (`pv`), `data-testid` client-* | 🔴 **Alto** — toca captación real; los `data-testid` pueden estar referenciados por tests E2E |
| **Modules Section** | 884-1081 (`id="modulos"`) | Estático | 🟢 Bajo |
| **Confianza y Compromiso** | 1082-1143 (`id="servicios"`) | Estático (cards: Red de Confianza, etc.) | 🟢 Bajo |
| **Planes** | 1144-1487 (`id="planes"`) | Precios **hardcodeados** (75k/140k/195k/275k COP, línea 1236-1298), `billingCycle`, CTA → `/register?plan=X&cycle=Y` | 🟠 **Medio** — precios deben coincidir con `payment` backend; cambiar IDs rompe el registro |
| **Métodos de Pago** | 1488-1581 (`payment-methods-section`) | Estático/branding (MercadoPago 1528, PayPal 1548) | 🟡 Medio — comunica métodos que hoy son **simulados** (riesgo reputacional, no técnico) |
| **Bloque Abogados** | 1582-1731 (form en 1732-…) | `handleLawyerSubmit`, `POST /public/lawyer-application`, `data-testid` lawyer-* | 🔴 **Alto** — captación real + tests |
| **Consultoría Empresarial** | ~1296 (plan "Consolidación Empresarial") + `mailto:` Partner (línea 2284) | `mailto:puntocerolegal@gmail.com` (deep link) | 🟢 Bajo |
| **Footer** | 2320-2500+ | `wa.me/573028322083`, `wa.me/584246487378`, `mailto`, enlaces legales, redes (Instagram/Facebook lucide **deprecados**) | 🟢 Bajo (accesible, `role="contentinfo"`) |

### Notas de riesgo transversales
- **Archivo monolítico (~2500 líneas):** alto acoplamiento visual; cualquier edición amplia arriesga el error `removeChild` ya mitigado (ver auditoría Fase 1). Editar por bloques pequeños.
- **`data-testid`** abundantes → probable suite de tests E2E que se rompería si se renombran.
- **Precios hardcodeados** en el frontend (no provienen de `/payment/catalog`) → fuente de verdad duplicada.

---

## RESUMEN EJECUTIVO

| Área | Estado | Acción futura (Fase 2) |
|------|--------|------------------------|
| Form Clientes | ✅ Funcional (crea caso + notifica) | Añadir rate-limit/captcha; no silenciar fallos de notificación |
| Form Abogados | ✅ Funcional (crea candidato PENDING) | Verificar que la aprobación setee contraseña (si no, abogado no entra) |
| MercadoPago | 🔴 Simulado | Integrar SDK + token + webhook real |
| PayPal | 🔴 Simulado (pero arquitectura lista) | Integrar REST v2 — **viabilidad ALTA** |
| Cobro real hoy | 🟢 Solo comprobante manual (`/payment/receipt`) | Mantener como fallback |
| Chatbot Meta | ⚠️ Saliente falla | Usar **plantilla HSM aprobada** + token permanente + sacar número de modo prueba |
| LandingPage | ✅ Funcional | Servir precios desde backend; vigilar `data-testid` y tamaño del archivo |

**Conclusión:** la **captación** (clientes y abogados) funciona y persiste datos correctamente. Los **pagos automáticos están simulados** (solo el comprobante manual cobra de verdad). El **chatbot saliente** no entrega por la política de ventana 24h de Meta + token/modo-prueba. Nada de esto es un bug de código roto: son **integraciones pendientes de activar con credenciales y plantillas reales**.

---

*Documento generado en modo auditoría. No se modificó ningún archivo del sistema.*
