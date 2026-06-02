# PUNTO CERO LEGAL - PRD

## Problem Statement
Plataforma LegalTech SaaS premium para abogados en LATAM. Landing page + Dashboard profesional para gestión de la práctica legal.

## Tech Stack
- Frontend: React + React Router + Framer Motion + Tailwind + Shadcn UI
- Backend: FastAPI + MongoDB + Motor (async)
- Auth: JWT con bcrypt
- IA: Emergent LLM Key + OpenAI GPT-4o-mini (vía emergentintegrations)

## What's been implemented (2025-12-12)

### Landing Page (/)
- Hero con título emocional "¿Cansado de que tus problemas legales no reciban la atención que merecen?"
- 6 módulos visuales con imágenes reales
- Sección "Confianza y Compromiso" (Trayectoria, Trabajamos para Ti, Red de Confianza)
- Sección de Planes (Esencial $49k / Profesional $99k / Empresarial)
- Sección Abogados Aliados con formulario WhatsApp
- Footer con contacto Colombia (+57 3028322083) y Venezuela (+58 04246487378)
- Redes sociales (Instagram, Facebook, TikTok)
- Etiquetas semánticas + ARIA labels

### Authentication (Auditado 2026-02)
- /login - Login con redirect por rol (admin → /admin · lawyer → /dashboard)
- /register - Registro con campos obligatorios: Cédula/Documento, Nombre del Bufete/Firma, Tarjeta Profesional
- /verificacion-pendiente - Pantalla con botón "Verificar estado" + polling 30s
- AuthContext con refreshUser() que consume /api/auth/me
- ProtectedRoute con RBAC estricto: admin→/dashboard redirige a /admin, lawyer→/admin redirige a /dashboard, pendiente→/verificacion-pendiente
- JWT tokens en localStorage
- Cuentas maestras seed (server.py startup): is_verified=true, status=ACTIVE explícitos con backfill

### Dashboard (/dashboard)
- Bienvenida personalizada con saludo según hora
- Ficha profesional completa con datos del abogado
- 6 tarjetas de estadísticas en tiempo real
- Actividad reciente y alertas inteligentes

### 9 Módulos Funcionales
1. CRM Jurídico - Gestión de leads con pipeline (new/contacted/qualified/converted)
2. Portal de Casos - Vistas Kanban + Tabla, prioridades, progreso
3. Directorio Clientes - Fichas completas con casos vinculados
4. Agenda Inteligente - Calendario con audiencias/reuniones/vencimientos
5. IA Jurídica - Chat con 6 plantillas (Demanda/Tutela/Contrato/Petición/Análisis/General) - FUNCIONAL CON OPENAI
6. Sala de Conferencias - Videollamadas simuladas con controles
7. Facturación - Dashboard financiero con estado de facturas
8. Documentos - Gestor con carpetas y búsqueda
9. Configuración - 6 tabs (Perfil/Seguridad/Notificaciones/Despacho/Suscripción/Integraciones)

### Backend API (`/api/`)
- /auth/login, /auth/register, /auth/me (NUEVO 2026-02 - fuente de verdad para is_verified)
- /admin/access-audit/pending, /approve, /reject (solo admin_general)
- /admin/dashboard/general (KPIs LATAM), /admin/dashboard/comercial (pipeline)
- /leads (con convert-to-case)
- /cases (con start-meeting)
- /meetings (con complete → updates billing)
- /appointments
- /messages
- /dashboard/kpis, /dashboard/alerts
- /ai/chat (OpenAI GPT-4o-mini) - FUNCIONAL
- /payment/* y /referrals/* — MOCKED (UI/lógica de router lista; SDKs reales pendientes)

## Tests (regresión)
- /app/backend/tests/test_auth_rbac.py — 17 tests E2E auth + RBAC (100% passing 2026-02-01)

## Changelog 2026-02-01
- Auditoría completa de auth (Task 1): refresh /auth/me, normalización status/is_verified, fuente de verdad única.
- Master seeds explícitos (is_verified=true, status=ACTIVE) con backfill idempotente.
- VerificacionPendiente: botón "Verificar estado" + polling 30s + redirección automática al aprobarse.
- Landing footer: texto sutil "Bajo la firma comercial Inversiones y Variedades DJGG 2013".
- Landing footer: doble TikTok @Puntoceroconsultores + @PuntoceromultiserviciosLATAM.
- Landing #planes: sección "Métodos de pago seguros" con logos monocromos MercadoPago + PayPal (modo informativo).

## Changelog 2026-02-01 (parte 2) — Centro de Gestión doble flujo
- Nuevo router `/api/admin-ops/*` (admin_ops.py): header stats, sales (candidatos/approve/reject/pending-payment/notes/chat), operations (cases/auto-assign/attended/notes/priority), talent CRUD (admin_general), billing (list/reminder/send), seed demo.
- AdminPanel reescrito: Header global (reloj live + counters tiempo real Casos Pendientes & Socios en Espera + notificaciones drawer) + 4 tabs (Sala Ventas / Monitor Operaciones / Gestión Talento / Facturación).
- **Sala de Ventas**: tabla candidatos con filtros (En proceso/Activos/Rechazados/Todos), drawer ficha con acciones de cierre (Aprobar y Activar / Rechazar / Pendiente Pago — solo ADMIN_GENERAL), WhatsApp directo, notas privadas, chat seguimiento.
- **Monitor de Operaciones**: tabla de casos con semáforo por prioridad (alta/media/baja), Routing Inteligente (`POST /auto-assign` → matching specialty + is_online, fail-safe sin_asignar=rojo si no hay match, notifica al abogado vía db.notifications), drawer con WA directo cliente, Marcar como Atendido, notas.
- **Gestión de Talento** (solo ADMIN_GENERAL): CRUD completo abogados con modal edición (full_name, specialty, experience, status, is_verified, is_online).
- **Facturación**: filtros pendiente/finalizada/no_terminada, totalizadores por estado, botones Recordatorio/Enviar (MOCKED hasta SMTP).
- RBAC riguroso: SOCIO_COMERCIAL no ve tab-talent, recibe 403 en approve/reject/pending-payment/talent CRUD/seed.
- Tests: `/app/backend/tests/test_admin_ops.py` (27 passing) + `test_auth_rbac.py` (17 passing).

## Backlog (P1)
- Persistir datos de módulos en backend (actualmente mockeados en frontend)
- WebRTC real para videollamadas
- Multi-tenancy estricto con RLS
- Integración real con Google Calendar / Outlook
- Stripe para suscripciones
- Subida real de archivos en Documentos

## Backlog (P2)
- Plantillas adicionales en IA Jurídica
- Exportación de reportes PDF en Facturación
- Sistema de notificaciones push
- Modo oscuro/claro toggle
