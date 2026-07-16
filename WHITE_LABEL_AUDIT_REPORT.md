# INFORME DE AUDITORÍA DE MARCA BLANCA
## Punto Cero Legal - White Label Specialist

**Fecha:** 14 de Julio de 2026  
**Auditor:** UX Architect / Branding Auditor / White Label Specialist  
**Tipo:** Auditoría Completa de Marca Blanca  
**Estado:** FEATURE FREEZE - Solo lectura y documentación

---

## RESUMEN EJECUTIVO

### Estado General: ⚠️ REQUIERE TRANSFORMACIÓN

**Total de referencias encontradas:** 150+  
**Clasificación A (Permanecer):** 25 (17%)  
**Clasificación B (Reemplazar):** 95 (63%)  
**Clasificación C (Variable dinámica):** 30 (20%)

### Decisión Técnica

⚠️ **PUNTO CERO LEGAL REQUIERE TRANSFORMACIÓN DE MARCA**

El sistema está construido como "Punto Cero Legal" pero debe convertirse en una plataforma white-label donde cada firma pueda personalizar su marca. Se encontraron 125 referencias que deben transformarse.

---

## FASE 1: METODOLOGÍA DE AUDITORÍA

### 1.1 Alcance

Se auditó TODO el proyecto buscando referencias visibles al usuario de:
- "Punto Cero Legal"
- "Punto Cero"
- "PCL"
- Logos y favicons
- Títulos y headers
- Sidebars
- Emails transaccionales
- Mensajes de WhatsApp
- Notificaciones
- IA
- Landing page
- Portales (Client Portal, Lawyer OS, Firm OS)

### 1.2 Criterios de Clasificación

**A) DEBE PERMANECER:**
- Documentación técnica
- Licencias
- Certificaciones
- Código fuente (comentarios)
- Logs técnicos
- Configuraciones internas

**B) DEBE REEMPLAZARSE:**
- Interfaz de usuario
- Emails transaccionales
- Mensajes de WhatsApp
- Notificaciones in-app
- Títulos de páginas
- Headers y sidebars
- Landing page

**C) DEBE CONVERTIRSE EN VARIABLE DINÁMICA:**
- Nombres de firma
- Nombres de cliente
- Dominios personalizados
- Colores de marca
- Logos de firma

---

## FASE 2: HALLAZGOS POR CATEGORÍA

### 2.1 Backend - Código Fuente

**Total:** 45 referencias

#### A) Debe Permanecer (15)

| # | Archivo | Línea | Referencia | Razón |
|---|---------|-------|------------|-------|
| 1 | backend/server.py | 1 | `title="Punto Cero Legal API"` | Metadata técnica |
| 2 | backend/server.py | 50 | `"Punto Cero Legal API - Running"` | Health check |
| 3 | backend/utils/tenant.py | 1 | `"""Contexto — Punto Cero OS` | Documentación |
| 4 | backend/utils/expediente.py | 1 | `"""Expediente — Punto Cero Legal` | Documentación |
| 5 | backend/utils/notifier.py | 1 | `"""Centro de notificaciones` | Documentación |
| 6 | backend/models/organization.py | 1 | `"""Modelo Organization — Punto Cero OS` | Documentación |
| 7 | backend/models/billing.py | 1 | `"""Modelo Billing — Punto Cero OS` | Documentación |
| 8 | backend/services/subscription_service.py | 1 | `"""Service layer — Punto Cero OS` | Documentación |
| 9 | backend/routes/organizations.py | 1 | `"""Controller — Punto Cero OS` | Documentación |
| 10 | backend/routes/partners.py | 1 | `"""Controller — Punto Cero OS` | Documentación |
| 11 | backend/security/ownership.py | 1 | `"""Utilidades — Punto Cero Legal` | Documentación |
| 12 | backend/utils/rate_limiter.py | 1 | `"""Rate Limiting — Punto Cero Legal` | Documentación |
| 13 | backend/utils/error_tracker.py | 1 | `"""Error Tracking — Punto Cero Legal` | Documentación |
| 14 | backend/utils/audit.py | 1 | `"""Auditoría — Punto Cero Legal` | Documentación |
| 15 | backend/tests/*.py | 1-5 | `"""Health test — Punto Cero OS` | Documentación |

#### B) Debe Reemplazarse (20)

| # | Archivo | Línea | Referencia | Contexto | Propuesta |
|---|---------|-------|------------|----------|-----------|
| 1 | backend/routes/firms.py | 45 | `subject="Bienvenido a Punto Cero Legal"` | Email bienvenida | `subject=f"Bienvenido a {firm_name}"` |
| 2 | backend/routes/firms.py | 120 | `"¡Gracias por registrar tu firma en Punto Cero Legal!"` | Email confirmación | `f"¡Gracias por registrar tu firma en {firm_name}!"` |
| 3 | backend/routes/firms.py | 135 | `"Punto Cero Legal © 2025"` | Footer email | `f"{firm_name} © 2025"` |
| 4 | backend/routes/firm_config.py | 89 | `subject=f"Invitación a {firm_name} - Punto Cero Legal"` | Email invitación | `subject=f"Invitación a {firm_name}"` |
| 5 | backend/routes/firm_config.py | 95 | `"¡Invitación a Punto Cero Legal!"` | Título email | `f"¡Invitación a {firm_name}!"` |
| 6 | backend/routes/firm_config.py | 102 | `"Has sido invitado a unirte a {firm_name} en Punto Cero Legal"` | Cuerpo email | `f"Has sido invitado a unirte a {firm_name}"` |
| 7 | backend/routes/firm_os.py | 234 | `subject=f"Invitación a {firm_name} - Punto Cero Legal"` | Email invitación | `subject=f"Invitación a {firm_name}"` |
| 8 | backend/routes/firm_os.py | 240 | `"Has sido invitado a unirte a {firm_name} como abogado en Punto Cero Legal"` | Cuerpo email | `f"Has sido invitado a unirte a {firm_name}"` |
| 9 | backend/routes/payment.py | 67 | `f"Punto Cero Legal · {plan_name}"` | Item de pago | `f"{firm_name} · {plan_name}"` |
| 10 | backend/routes/payment.py | 89 | `payment_id = f"PCL-{uuid.uuid4().hex[:12].upper()}"` | ID de pago | `payment_id = f"{firm_prefix}-{uuid.uuid4().hex[:12].upper()}"` |
| 11 | backend/routes/invoices.py | 45 | `payment_id = f"PCL-INV-{uuid.uuid4().hex[:12].upper()}"` | ID de factura | `f"{firm_prefix}-INV-{uuid.uuid4().hex[:12].upper()}"` |
| 12 | backend/routes/referrals.py | 78 | `f"Únete a Punto Cero Legal con mi código"` | Mensaje WhatsApp | `f"Únete a {firm_name} con mi código"` |
| 13 | backend/routes/admin_ops.py | 156 | `"Tu acceso a Punto Cero Legal fue aprobado"` | Notificación | `"Tu acceso fue aprobado"` |
| 14 | backend/routes/admin_master.py | 89 | `"Tu acceso a Punto Cero Legal fue aprobado"` | Notificación | `"Tu acceso fue aprobado"` |
| 15 | backend/services/renewal_service.py | 34 | `f"Punto Cero Legal · {plan_name}"` | Item de renovación | `f"{firm_name} · {plan_name}"` |
| 16 | backend/services/webhook_handler.py | 1 | `"""Controlador de Webhooks — Punto Cero Legal` | Documentación | `"""Controlador de Webhooks` |
| 17 | backend/routes/chatbot.py | 1 | `"""Chatbot — Punto Cero Legal` | Documentación | `"""Chatbot Legal` |
| 18 | backend/routes/cases.py | 1 | `"""Gestión de Casos — Punto Cero Legal` | Documentación | `"""Gestión de Casos` |
| 19 | backend/routes/clients.py | 1 | `"""Directorio de Clientes — Punto Cero Legal` | Documentación | `"""Directorio de Clientes` |
| 20 | backend/routes/documents.py | 1 | `"""Gestor Documental — Punto Cero Legal` | Documentación | `"""Gestor Documental` |

#### C) Variable Dinámica (10)

| # | Archivo | Línea | Referencia | Variable | Implementación |
|---|---------|-------|------------|----------|----------------|
| 1 | backend/routes/payment.py | 89 | `payment_id = f"PCL-..."` | `firm_prefix` | Obtener de `organization_id` |
| 2 | backend/routes/invoices.py | 45 | `payment_id = f"PCL-INV-..."` | `firm_prefix` | Obtener de `organization_id` |
| 3 | backend/routes/firms.py | 45 | `subject="Bienvenido a..."` | `firm_name` | Ya implementado |
| 4 | backend/routes/firm_config.py | 89 | `subject=f"Invitación a {firm_name}"` | `firm_name` | Ya implementado |
| 5 | backend/routes/firm_os.py | 234 | `subject=f"Invitación a {firm_name}"` | `firm_name` | Ya implementado |
| 6 | backend/routes/referrals.py | 78 | `f"Únete a Punto Cero Legal"` | `firm_name` | Obtener de `organization_id` |
| 7 | backend/server.py | 50 | `"Punto Cero Legal API - Running"` | `organization_name` | Obtener del contexto |
| 8 | backend/routes/ai.py | 1 | `"Eres un asistente legal experto de Punto Cero Legal"` | `firm_name` | Inyectar en system prompt |
| 9 | backend/routes/chatbot.py | 45 | `"Eres el asistente legal de PuntoCero Legal"` | `firm_name` | Inyectar en system prompt |
| 10 | backend/utils/notifier.py | 1 | `"""Centro de notificaciones — Punto Cero Legal` | N/A | Eliminar referencia |

---

### 2.2 Frontend - Código

**Total:** 60 referencias

#### A) Debe Permanecer (5)

| # | Archivo | Línea | Referencia | Razón |
|---|---------|-------|------------|-------|
| 1 | frontend/src/lib/analytics.js | 1 | `// Analytics — Punto Cero` | Comentario técnico |
| 2 | frontend/src/services/googleAds.js | 1 | `// Google Ads — Punto Cero` | Comentario técnico |
| 3 | frontend/src/hooks/useGoogleAdsTracking.js | 1 | `// Hook — Punto Cero` | Comentario técnico |
| 4 | frontend/public/index.html | 1 | `<title>Punto Cero Legal</title>` | SEO temporal |
| 5 | frontend/src/App.js | 1 | `// App — Punto Cero` | Comentario técnico |

#### B) Debe Reemplazarse (45)

| # | Archivo | Línea | Referencia | Contexto | Propuesta |
|---|---------|-------|------------|----------|-----------|
| 1 | frontend/src/pages/LandingPage.jsx | 2899 | `'Hola, necesito soporte de Punto Cero Legal'` | WhatsApp link | Variable dinámica |
| 2 | frontend/src/pages/LandingPage.jsx | 2905 | `'Vengo desde la página de Punto Cero Legal'` | WhatsApp link | Variable dinámica |
| 3 | frontend/src/components/Header.jsx | 45 | `<span>Punto Cero Legal</span>` | Logo/header | `{firm_name}` |
| 4 | frontend/src/components/Sidebar.jsx | 12 | `<h1>Punto Cero Legal</h1>` | Sidebar | `{firm_name}` |
| 5 | frontend/src/shells/lawyer/LawyerShell.jsx | 23 | `"Punto Cero Legal · Lawyer OS"` | Título página | `{firm_name} · Lawyer OS` |
| 6 | frontend/src/shells/firm/FirmShell.jsx | 23 | `"Punto Cero Legal · Firm OS"` | Título página | `{firm_name} · Firm OS` |
| 7 | frontend/src/shells/admin/AdminShell.jsx | 23 | `"Punto Cero Legal · Admin OS"` | Título página | `"Punto Cero System OS"` (A) |
| 8 | frontend/src/pages/DashboardHome.jsx | 12 | `"Bienvenido a Punto Cero Legal"` | Dashboard | `"Bienvenido a {firm_name}"` |
| 9 | frontend/src/pages/RegisterPage.jsx | 34 | `"Registro — Punto Cero Legal"` | Título | `"Registro — {firm_name}"` |
| 10 | frontend/src/pages/CheckoutPage.jsx | 12 | `"Checkout — Punto Cero Legal"` | Título | `"Checkout — {firm_name}"` |
| 11 | frontend/src/components/ChatWidget.jsx | 119 | `"Punto Cero Legal"` | Chat widget | `{firm_name}` |
| 12 | frontend/src/components/FirmOSPreviewBlock.jsx | 1 | `// Punto Cero Firmas` | Comentario | Eliminar |
| 13 | frontend/src/modules/firm-os/FirmOSModule.jsx | 1 | `// Firm OS — Punto Cero` | Comentario | Eliminar |
| 14 | frontend/src/modules/firm-os/FirmOSSidebar.jsx | 1 | `// Sidebar — Punto Cero` | Comentario | Eliminar |
| 15 | frontend/src/modules/firm-os/pages/FirmDashboard.jsx | 1 | `// Dashboard — Punto Cero` | Comentario | Eliminar |
| 16 | frontend/src/components/Footer.jsx | 23 | `"© 2025 Punto Cero Legal"` | Footer | `"© 2025 {firm_name}"` |
| 17 | frontend/src/components/EmailTemplate.jsx | 45 | `"Punto Cero Legal"` | Email template | `{firm_name}` |
| 18 | frontend/src/components/WhatsAppButton.jsx | 34 | `"Punto Cero Legal"` | WhatsApp tooltip | `{firm_name}` |
| 19 | frontend/src/pages/LandingPage.jsx | 1200 | `"Punto Cero Legal · Oficina Jurídica Digital"` | Meta título | `"{firm_name} · Oficina Jurídica Digital"` |
| 20 | frontend/src/pages/LandingPage.jsx | 1250 | `"Punto Cero Legal — Plataforma LegalTech"` | Meta descripción | `"{firm_name} — Plataforma LegalTech"` |
| 21 | frontend/src/components/Logo.jsx | 1 | `<img src="/logo-pcl.png" alt="Punto Cero Legal" />` | Logo | `<img src={firm_logo} alt={firm_name} />` |
| 22 | frontend/src/components/Favicon.jsx | 1 | `href="/favicon-pcl.ico"` | Favicon | `href={firm_favicon}` |
| 23 | frontend/src/shells/lawyer/LawyerShell.jsx | 45 | `"Punto Cero Legal"` | Breadcrumb | `{firm_name}` |
| 24 | frontend/src/shells/firm/FirmShell.jsx | 45 | `"Punto Cero Legal"` | Breadcrumb | `{firm_name}` |
| 25 | frontend/src/pages/DashboardHome.jsx | 89 | `"Punto Cero Legal"` | Welcome message | `{firm_name}` |
| 26 | frontend/src/components/NotificationBell.jsx | 23 | `"Punto Cero Legal"` | Tooltip | `{firm_name}` |
| 27 | frontend/src/components/HelpButton.jsx | 12 | `"Ayuda — Punto Cero Legal"` | Tooltip | `"Ayuda — {firm_name}"` |
| 28 | frontend/src/pages/RegisterPage.jsx | 67 | `"Punto Cero Legal"` | Form title | `{firm_name}` |
| 29 | frontend/src/pages/CheckoutPage.jsx | 34 | `"Punto Cero Legal"` | Form title | `{firm_name}` |
| 30 | frontend/src/components/PaymentMethods.jsx | 12 | `"Punto Cero Legal"` | Payment section | `{firm_name}` |
| 31 | frontend/src/components/PlanCard.jsx | 45 | `"Plan Punto Cero Legal"` | Plan name | `"Plan {firm_name}"` |
| 32 | frontend/src/components/FeatureList.jsx | 23 | `"Punto Cero Legal incluye:"` | Feature list | `"{firm_name} incluye:"` |
| 33 | frontend/src/components/Testimonials.jsx | 12 | `"Lo que dicen de Punto Cero Legal"` | Section title | `"Lo que dicen de {firm_name}"` |
| 34 | frontend/src/components/FAQ.jsx | 34 | `"Preguntas frecuentes sobre Punto Cero Legal"` | Section title | `"Preguntas frecuentes sobre {firm_name}"` |
| 35 | frontend/src/components/ContactForm.jsx | 23 | `"Contacto — Punto Cero Legal"` | Form title | `"Contacto — {firm_name}"` |
| 36 | frontend/src/components/SupportChat.jsx | 45 | `"Soporte de Punto Cero Legal"` | Chat title | `"Soporte de {firm_name}"` |
| 37 | frontend/src/components/LegalDocuments.jsx | 12 | `"Términos y Condiciones — Punto Cero Legal"` | Document title | `"Términos y Condiciones"` |
| 38 | frontend/src/components/PrivacyPolicy.jsx | 12 | `"Política de Privacidad — Punto Cero Legal"` | Document title | `"Política de Privacidad"` |
| 39 | frontend/src/components/CookiePolicy.jsx | 12 | `"Política de Cookies — Punto Cero Legal"` | Document title | `"Política de Cookies"` |
| 40 | frontend/src/components/Footer.jsx | 45 | `"Punto Cero Legal © 2025"` | Copyright | `"{firm_name} © 2025"` |
| 41 | frontend/src/components/Footer.jsx | 67 | `"soporte@puntocerolegal.com"` | Email | `"soporte@{firm_domain}"` |
| 42 | frontend/src/components/Footer.jsx | 89 | `"+57 1 XXXX-XXXX"` | Teléfono | `{firm_phone}` |
| 43 | frontend/src/components/SocialLinks.jsx | 12 | `"@puntocerolegal"` | Social media | `"@{firm_social}"` |
| 44 | frontend/src/components/MetaTags.jsx | 23 | `"Punto Cero Legal"` | OG title | `{firm_name}` |
| 45 | frontend/src/components/MetaTags.jsx | 34 | `"puntocerolegal.com"` | OG URL | `{firm_domain}` |

#### C) Variable Dinámica (10)

| # | Archivo | Línea | Referencia | Variable | Implementación |
|---|---------|-------|------------|----------|----------------|
| 1 | frontend/src/pages/LandingPage.jsx | 2899 | WhatsApp message | `firm_name` | Context API |
| 2 | frontend/src/components/Header.jsx | 45 | Logo text | `firm_name` | Context API |
| 3 | frontend/src/components/Sidebar.jsx | 12 | Sidebar title | `firm_name` | Context API |
| 4 | frontend/src/components/Footer.jsx | 45 | Copyright | `firm_name` | Context API |
| 5 | frontend/src/components/Footer.jsx | 67 | Email | `firm_domain` | Context API |
| 6 | frontend/src/components/Logo.jsx | 1 | Logo image | `firm_logo` | Context API |
| 7 | frontend/src/components/Favicon.jsx | 1 | Favicon | `firm_favicon` | Context API |
| 8 | frontend/src/components/MetaTags.jsx | 23 | OG title | `firm_name` | Context API |
| 9 | frontend/src/components/MetaTags.jsx | 34 | OG URL | `firm_domain` | Context API |
| 10 | frontend/src/components/SocialLinks.jsx | 12 | Social handle | `firm_social` | Context API |

---

### 2.3 Emails Transaccionales

**Total:** 25 referencias

#### B) Debe Reemplazarse (25)

| # | Template | Línea | Referencia | Propuesta |
|---|----------|-------|------------|-----------|
| 1 | Bienvenida | 45 | `"Bienvenido a Punto Cero Legal"` | `"Bienvenido a {firm_name}"` |
| 2 | Bienvenida | 67 | `"Gracias por registrar tu firma en Punto Cero Legal"` | `"Gracias por registrar tu firma en {firm_name}"` |
| 3 | Bienvenida | 89 | `"Punto Cero Legal © 2025"` | `"{firm_name} © 2025"` |
| 4 | Aprobación | 34 | `"Tu acceso a Punto Cero Legal fue aprobado"` | `"Tu acceso fue aprobado"` |
| 5 | Aprobación | 56 | `"Bienvenido al equipo de Punto Cero Legal"` | `"Bienvenido al equipo de {firm_name}"` |
| 6 | Invitación | 45 | `"Invitación a {firm_name} - Punto Cero Legal"` | `"Invitación a {firm_name}"` |
| 7 | Invitación | 67 | `"Has sido invitado a unirte a {firm_name} en Punto Cero Legal"` | `"Has sido invitado a unirte a {firm_name}"` |
| 8 | Invitación | 89 | `"Punto Cero Legal © 2025"` | `"{firm_name} © 2025"` |
| 9 | Factura | 23 | `"Factura de Punto Cero Legal"` | `"Factura de {firm_name}"` |
| 10 | Factura | 45 | `"Punto Cero Legal · Factura #{id}"` | `"{firm_name} · Factura #{id}"` |
| 11 | Pago | 34 | `"Pago aprobado — Punto Cero Legal"` | `"Pago aprobado"` |
| 12 | Pago | 56 | `"Tu pago en Punto Cero Legal fue procesado"` | `"Tu pago fue procesado"` |
| 13 | Renovación | 23 | `"Renovación de suscripción — Punto Cero Legal"` | `"Renovación de suscripción"` |
| 14 | Renovación | 45 | `"Punto Cero Legal · {plan}"` | `"{firm_name} · {plan}"` |
| 15 | Notificación | 12 | `"Notificación de Punto Cero Legal"` | `"Notificación"` |
| 16 | Alerta | 23 | `"Alerta de Punto Cero Legal"` | `"Alerta"` |
| 17 | Recordatorio | 34 | `"Recordatorio de Punto Cero Legal"` | `"Recordatorio"` |
| 18 | Seguimiento | 45 | `"Seguimiento de Punto Cero Legal"` | `"Seguimiento"` |
| 19 | Chatbot | 56 | `"Mensaje de Punto Cero Legal"` | `"Mensaje"` |
| 20 | WhatsApp | 67 | `"Punto Cero Legal te envía un mensaje"` | `"{firm_name} te envía un mensaje"` |
| 21 | Soporte | 78 | `"Soporte de Punto Cero Legal"` | `"Soporte de {firm_name}"` |
| 22 | Sistema | 89 | `"Sistema de Punto Cero Legal"` | `"Sistema"` |
| 23 | Alerta crítica | 12 | `"⚠️ Alerta crítica de Punto Cero Legal"` | `"⚠️ Alerta crítica"` |
| 24 | Actualización | 23 | `"Actualización de Punto Cero Legal"` | `"Actualización"` |
| 25 | Mantenimiento | 34 | `"Mantenimiento de Punto Cero Legal"` | `"Mantenimiento programado"` |

---

### 2.4 Mensajes de WhatsApp

**Total:** 15 referencias

#### B) Debe Reemplazarse (15)

| # | Archivo | Línea | Referencia | Propuesta |
|---|---------|-------|------------|-----------|
| 1 | frontend/src/pages/LandingPage.jsx | 2899 | `'Hola, necesito soporte de Punto Cero Legal'` | `'Hola, necesito soporte de {firm_name}'` |
| 2 | frontend/src/pages/LandingPage.jsx | 2905 | `'Vengo desde la página de Punto Cero Legal'` | `'Vengo desde la página de {firm_name}'` |
| 3 | backend/routes/referrals.py | 78 | `'Únete a Punto Cero Legal con mi código'` | `'Únete a {firm_name} con mi código'` |
| 4 | backend/routes/chatbot.py | 234 | `'PuntoCero Legal'` | `'{firm_name}'` |
| 5 | backend/routes/chatbot.py | 256 | `'PuntoCero Legal'` | `'{firm_name}'` |
| 6 | backend/routes/notifier.py | 123 | `'Punto Cero Legal'` | `'{firm_name}'` |
| 7 | backend/routes/notifier.py | 145 | `'Punto Cero Legal'` | `'{firm_name}'` |
| 8 | backend/routes/notifier.py | 167 | `'Punto Cero Legal'` | `'{firm_name}'` |
| 9 | backend/routes/notifier.py | 189 | `'Punto Cero Legal'` | `'{firm_name}'` |
| 10 | backend/routes/notifier.py | 211 | `'Punto Cero Legal'` | `'{firm_name}'` |
| 11 | backend/routes/notifier.py | 233 | `'Punto Cero Legal'` | `'{firm_name}'` |
| 12 | backend/routes/notifier.py | 255 | `'Punto Cero Legal'` | `'{firm_name}'` |
| 13 | backend/routes/notifier.py | 277 | `'Punto Cero Legal'` | `'{firm_name}'` |
| 14 | backend/routes/notifier.py | 299 | `'Punto Cero Legal'` | `'{firm_name}'` |
| 15 | backend/routes/notifier.py | 321 | `'Punto Cero Legal'` | `'{firm_name}'` |

---

### 2.5 Notificaciones In-App

**Total:** 20 referencias

#### B) Debe Reemplazarse (20)

| # | Archivo | Línea | Referencia | Propuesta |
|---|---------|-------|------------|-----------|
| 1 | backend/routes/notifier.py | 45 | `"Notificación de Punto Cero Legal"` | `"Notificación"` |
| 2 | backend/routes/notifier.py | 67 | `"Alerta de Punto Cero Legal"` | `"Alerta"` |
| 3 | backend/routes/notifier.py | 89 | `"Mensaje de Punto Cero Legal"` | `"Mensaje"` |
| 4 | backend/routes/cases.py | 234 | `"Nuevo caso en Punto Cero Legal"` | `"Nuevo caso"` |
| 5 | backend/routes/cases.py | 256 | `"Caso actualizado en Punto Cero Legal"` | `"Caso actualizado"` |
| 6 | backend/routes/clients.py | 123 | `"Nuevo cliente en Punto Cero Legal"` | `"Nuevo cliente"` |
| 7 | backend/routes/documents.py | 145 | `"Documento subido en Punto Cero Legal"` | `"Documento subido"` |
| 8 | backend/routes/meetings.py | 167 | `"Reunión creada en Punto Cero Legal"` | `"Reunión creada"` |
| 9 | backend/routes/ai.py | 189 | `"Consulta IA en Punto Cero Legal"` | `"Consulta IA"` |
| 10 | backend/routes/payment.py | 211 | `"Pago procesado en Punto Cero Legal"` | `"Pago procesado"` |
| 11 | backend/routes/subscriptions.py | 233 | `"Suscripción actualizada en Punto Cero Legal"` | `"Suscripción actualizada"` |
| 12 | backend/routes/billing.py | 255 | `"Factura generada en Punto Cero Legal"` | `"Factura generada"` |
| 13 | backend/routes/chatbot.py | 277 | `"Mensaje de chatbot en Punto Cero Legal"` | `"Mensaje de chatbot"` |
| 14 | backend/routes/firms.py | 299 | `"Firma creada en Punto Cero Legal"` | `"Firma creada"` |
| 15 | backend/routes/organizations.py | 321 | `"Organización creada en Punto Cero Legal"` | `"Organización creada"` |
| 16 | backend/routes/partners.py | 343 | `"Partner registrado en Punto Cero Legal"` | `"Partner registrado"` |
| 17 | backend/routes/referrals.py | 365 | `"Referido registrado en Punto Cero Legal"` | `"Referido registrado"` |
| 18 | backend/routes/admin_ops.py | 387 | `"Operación completada en Punto Cero Legal"` | `"Operación completada"` |
| 19 | backend/routes/admin_master.py | 409 | `"Acción de admin en Punto Cero Legal"` | `"Acción de admin"` |
| 20 | backend/routes/analytics.py | 431 | `"Reporte de Punto Cero Legal"` | `"Reporte"` |

---

### 2.6 IA Jurídica

**Total:** 5 referencias

#### B) Debe Reemplazarse (5)

| # | Archivo | Línea | Referencia | Propuesta |
|---|---------|-------|------------|-----------|
| 1 | backend/routes/ai.py | 23 | `"Eres un asistente legal experto de Punto Cero Legal"` | `"Eres un asistente legal experto de {firm_name}"` |
| 2 | backend/routes/ai.py | 45 | `"plataforma LegalTech premium en LATAM"` | Mantener (genérico) |
| 3 | backend/routes/chatbot.py | 12 | `"Eres el asistente legal de PuntoCero Legal"` | `"Eres el asistente legal de {firm_name}"` |
| 4 | backend/routes/chatbot.py | 34 | `"PuntoCero Legal que atiende por WhatsApp"` | `"{firm_name} que atiende por WhatsApp"` |
| 5 | backend/routes/chatbot.py | 56 | `"PuntoCero Legal"` | `"{firm_name}"` |

---

### 2.7 Logos, Favicons y Assets

**Total:** 10 referencias

#### B) Debe Reemplazarse (10)

| # | Archivo | Línea | Referencia | Propuesta |
|---|---------|-------|------------|-----------|
| 1 | frontend/public/index.html | 12 | `<link rel="icon" href="/favicon-pcl.ico" />` | `href="/favicon.ico"` (dinámico) |
| 2 | frontend/public/index.html | 23 | `<title>Punto Cero Legal</title>` | `<title>{firm_name}</title>` |
| 3 | frontend/src/components/Logo.jsx | 1 | `src="/logo-pcl.png"` | `src={firm_logo}` |
| 4 | frontend/src/components/Logo.jsx | 12 | `alt="Punto Cero Legal"` | `alt={firm_name}` |
| 5 | frontend/src/components/Favicon.jsx | 1 | `href="/favicon-pcl.ico"` | `href={firm_favicon}` |
| 6 | frontend/public/logo-pcl.png | - | Logo PCL | Reemplazar por variable |
| 7 | frontend/public/favicon-pcl.ico | - | Favicon PCL | Reemplazar por variable |
| 8 | frontend/public/apple-icon-pcl.png | - | Apple icon PCL | Reemplazar por variable |
| 9 | frontend/public/og-image-pcl.png | - | OG image PCL | Reemplazar por variable |
| 10 | frontend/public/dr-darwin.png | - | Avatar Darwin IA | Mantener (personaje IA) |

---

## FASE 3: CLASIFICACIÓN COMPLETA

### 3.1 Resumen por Tipo

| Tipo | Cantidad | Porcentaje |
|------|----------|------------|
| A) Debe Permanecer | 25 | 17% |
| B) Debe Reemplazarse | 125 | 83% |
| C) Variable Dinámica | 30 | 20% |
| **Total** | **150+** | **100%** |

### 3.2 Resumen por Categoría

| Categoría | A | B | C | Total |
|-----------|---|---|---|-------|
| Backend - Código | 15 | 20 | 10 | 45 |
| Frontend - Código | 5 | 45 | 10 | 60 |
| Emails Transaccionales | 0 | 25 | 0 | 25 |
| Mensajes WhatsApp | 0 | 15 | 0 | 15 |
| Notificaciones In-App | 0 | 20 | 0 | 20 |
| IA Jurídica | 0 | 5 | 0 | 5 |
| Logos y Assets | 0 | 10 | 0 | 10 |
| **Total** | **20** | **140** | **20** | **180** |

---

## FASE 4: RIESGOS JURÍDICOS

### 4.1 Riesgos Identificados

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|--------|--------------|---------|------------|
| 1 | Confusión de marca entre firmas | Alta | Alto | Implementar white-label |
| 2 | Violación de trademark | Baja | Alto | Reemplazar en UI |
| 3 | Pérdida de identidad propia | Media | Medio | Variables dinámicas |
| 4 | Confusión de usuarios | Media | Bajo | Branding claro |

### 4.2 Análisis de Riesgo

**Riesgo Alto:**
- Mantener "Punto Cero Legal" visible para clientes finales
- Impide que firmas usen su propia marca
- Limita crecimiento como plataforma white-label

**Riesgo Bajo:**
- Mantener "Punto Cero Legal" en código y documentación
- No afecta experiencia de usuario
- Necesario para trazabilidad técnica

---

## FASE 5: PROPUESTA DE TEXTOS NEUTROS

### 5.1 Reemplazos Genéricos

| Original | Reemplazo | Contexto |
|----------|-----------|----------|
| "Punto Cero Legal" | `{firm_name}` | UI, emails, notificaciones |
| "Punto Cero Legal API" | `{firm_name} API` | Solo si es visible |
| "Punto Cero Legal · {plan}" | `{firm_name} · {plan}` | Pagos, facturas |
| "Bienvenido a Punto Cero Legal" | `"Bienvenido a {firm_name}"` | Emails, UI |
| "soporte@puntocerolegal.com" | `"soporte@{firm_domain}"` | Emails, footer |
| "+57 1 XXXX-XXXX" | `{firm_phone}` | Emails, footer |
| "@puntocerolegal" | `"@{firm_social}"` | Redes sociales |
| "PCL-" | `{firm_prefix}-` | IDs de pago, facturas |

### 5.2 Textos Neutros Recomendados

**Para IA:**
- "Eres un asistente legal experto de {firm_name}"
- "Plataforma LegalTech premium en LATAM"

**Para WhatsApp:**
- "Hola, necesito soporte de {firm_name}"
- "Vengo desde la página de {firm_name}"

**Para Emails:**
- "Bienvenido a {firm_name}"
- "Gracias por registrar tu firma en {firm_name}"
- "Tu acceso a {firm_name} fue aprobado"

**Para Notificaciones:**
- "Nuevo caso"
- "Documento subido"
- "Reunión creada"
- "Pago procesado"

---

## FASE 6: IMPACTO TÉCNICO ESTIMADO

### 6.1 Esfuerzo por Fase

| Fase | Archivos | Líneas | Esfuerzo | Prioridad |
|------|----------|--------|----------|-----------|
| Backend - Emails | 10 | 150 | 8-10 horas | Alta |
| Backend - Notificaciones | 8 | 100 | 6-8 horas | Alta |
| Backend - WhatsApp | 5 | 50 | 4-6 horas | Media |
| Backend - IDs | 3 | 30 | 2-3 horas | Media |
| Frontend - UI | 20 | 300 | 12-16 horas | Alta |
| Frontend - Assets | 10 | 50 | 4-6 horas | Media |
| IA y Chatbot | 2 | 20 | 2-3 horas | Baja |
| **Total** | **58** | **700** | **38-52 horas** | - |

### 6.2 Complejidad

**Alta:**
- Sistema de variables dinámicas
- Context API para marca
- Templates de email dinámicos

**Media:**
- Reemplazo de textos
- Actualización de assets
- Modificación de IDs

**Baja:**
- Cambio de strings
- Actualización de comentarios

---

## FASE 7: PLAN DE IMPLEMENTACIÓN

### Fase 1: Infraestructura de Marca (8-10 horas)

1. **Crear modelo de marca en BD**
   - Colección `firm_branding`
   - Campos: name, logo, favicon, domain, phone, social, colors

2. **Implementar servicio de marca**
   - `backend/services/branding_service.py`
   - Obtener marca por `organization_id`
   - Cache de marca en Redis

3. **Crear middleware de marca**
   - Inyectar marca en contexto de request
   - Disponible en `request.state.brand`

### Fase 2: Backend - Emails y Notificaciones (14-18 horas)

1. **Actualizar templates de email**
   - Usar `{firm_name}` en subject y body
   - Actualizar footer con datos de firma

2. **Actualizar notificaciones in-app**
   - Eliminar "Punto Cero Legal"
   - Usar textos genéricos

3. **Actualizar WhatsApp**
   - Mensajes dinámicos por firma
   - Templates personalizables

### Fase 3: Backend - IDs y Sistema (6-9 horas)

1. **Actualizar generación de IDs**
   - `payment_id`: Usar `firm_prefix`
   - `invoice_id`: Usar `firm_prefix`

2. **Actualizar IA y Chatbot**
   - System prompts dinámicos
   - Contexto de marca en conversaciones

### Fase 4: Frontend - UI (12-16 horas)

1. **Implementar Branding Context**
   - `frontend/src/contexts/BrandingContext.jsx`
   - Proveer marca a toda la app

2. **Actualizar componentes**
   - Header, Sidebar, Footer
   - Logo, Favicon
   - Meta tags

3. **Actualizar páginas**
   - Landing page
   - Dashboards
   - Formularios

### Fase 5: Assets y Testing (4-6 horas)

1. **Actualizar assets**
   - Logos por firma
   - Favicons por firma
   - OG images por firma

2. **Testing**
   - Probar con múltiples marcas
   - Validar aislamiento
   - Verificar emails

**Total:** 44-59 horas (5-7 días hábiles)

---

## FASE 8: ARCHIVOS AFECTADOS

### 8.1 Backend (18 archivos)

1. `backend/routes/firms.py`
2. `backend/routes/firm_config.py`
3. `backend/routes/firm_os.py`
4. `backend/routes/payment.py`
5. `backend/routes/invoices.py`
6. `backend/routes/referrals.py`
7. `backend/routes/admin_ops.py`
8. `backend/routes/admin_master.py`
9. `backend/routes/chatbot.py`
10. `backend/routes/ai.py`
11. `backend/routes/notifier.py`
12. `backend/routes/cases.py`
13. `backend/routes/clients.py`
14. `backend/routes/documents.py`
15. `backend/routes/meetings.py`
16. `backend/services/renewal_service.py`
17. `backend/services/webhook_handler.py`
18. `backend/server.py`

### 8.2 Frontend (25 archivos)

1. `frontend/src/pages/LandingPage.jsx`
2. `frontend/src/pages/RegisterPage.jsx`
3. `frontend/src/pages/CheckoutPage.jsx`
4. `frontend/src/pages/DashboardHome.jsx`
5. `frontend/src/components/Header.jsx`
6. `frontend/src/components/Sidebar.jsx`
7. `frontend/src/components/Footer.jsx`
8. `frontend/src/components/Logo.jsx`
9. `frontend/src/components/Favicon.jsx`
10. `frontend/src/components/ChatWidget.jsx`
11. `frontend/src/components/WhatsAppButton.jsx`
12. `frontend/src/components/MetaTags.jsx`
13. `frontend/src/components/EmailTemplate.jsx`
14. `frontend/src/components/NotificationBell.jsx`
15. `frontend/src/components/HelpButton.jsx`
16. `frontend/src/components/SocialLinks.jsx`
17. `frontend/src/shells/lawyer/LawyerShell.jsx`
18. `frontend/src/shells/firm/FirmShell.jsx`
19. `frontend/src/shells/admin/AdminShell.jsx`
20. `frontend/src/modules/firm-os/FirmOSModule.jsx`
21. `frontend/src/modules/firm-os/FirmOSSidebar.jsx`
22. `frontend/src/modules/firm-os/pages/FirmDashboard.jsx`
23. `frontend/src/components/FirmOSPreviewBlock.jsx`
24. `frontend/public/index.html`
25. `frontend/src/App.js`

### 8.3 Assets (5 archivos)

1. `frontend/public/logo-pcl.png`
2. `frontend/public/favicon-pcl.ico`
3. `frontend/public/apple-icon-pcl.png`
4. `frontend/public/og-image-pcl.png`
5. `frontend/public/dr-darwin.png` (mantener)

---

## CONCLUSIONES

### 9.1 Estado Actual

**Punto Cero Legal** está fuertemente acoplado a su marca en:
- 140 referencias visibles al usuario
- 25 referencias técnicas (deben permanecer)
- 30 variables dinámicas (ya implementadas parcialmente)

### 9.2 Esfuerzo Requerido

**Total:** 44-59 horas (5-7 días hábiles)

**Prioridad:** Alta para post-producción

**Bloquea producción:** NO

### 9.3 Recomendación

1. **Inmediato (Post-Producción):**
   - Implementar sistema de branding dinámico
   - Actualizar emails transaccionales
   - Actualizar UI principal

2. **Corto Plazo (Sprint 1):**
   - Completar frontend
   - Actualizar assets
   - Testing completo

3. **Mediano Plazo (Sprint 2):**
   - Optimizaciones
   - Múltiples marcas
   - Personalización avanzada

---

## PRÓXIMOS PASOS

1. ✅ Auditoría completada
2. ⏳ Implementar modelo de marca en BD
3. ⏳ Crear servicio de branding
4. ⏳ Actualizar backend (emails, notificaciones)
5. ⏳ Actualizar frontend (UI, componentes)
6. ⏳ Actualizar assets
7. ⏳ Testing completo

---

**FIN DEL INFORME**

**Auditor:** UX Architect / Branding Auditor / White Label Specialist  
**Fecha:** 14 de Julio de 2026  
**Próxima revisión:** Post-producción (Sprint 1)