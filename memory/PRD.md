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

### Authentication
- /login - Login page
- /register - Registro con 7 días gratis
- AuthContext + ProtectedRoute
- JWT tokens en localStorage

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
- /auth/login, /auth/register
- /leads (con convert-to-case)
- /cases (con start-meeting)
- /meetings (con complete → updates billing)
- /appointments
- /messages
- /dashboard/kpis, /dashboard/alerts
- /ai/chat (OpenAI GPT-4o-mini) - FUNCIONAL

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
