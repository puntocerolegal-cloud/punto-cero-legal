# FIRM_OS_MINIMUM_GO_LIVE.md
## Mínimo Producto Operativo (MGO) — solo Firm OS exclusivo
**Fecha:** 2026-07-15 · Basado exclusivamente en la evidencia de las auditorías dinámicas ya realizadas (ejecución real). Sin nuevo código, sin re-auditar.

> **Premisa correctora:** los porcentajes anteriores estaban inflados porque mezclaban el **Núcleo Compartido (Punto Cero System OS)** con **Firm OS**. Aquí se separan y se calcula el avance **únicamente de lo exclusivo de una firma jurídica** — aquello que desaparecería si Firm OS desapareciera.

---

# FASE 1 — SEPARACIÓN ARQUITECTÓNICA

## A) NÚCLEO COMPARTIDO (System OS) — NO cuenta como avance de Firm OS
Estos módulos existen para todo el ecosistema (también Lawyer OS / Client Portal). Su estado runtime se conserva como contexto, pero **NO** entra en el % de Firm OS.

| Módulo compartido | Estado runtime (evidencia) |
|---|---|
| Autenticación / JWT | ✅ login 4 roles 200 (sin refresh token) |
| MongoDB / conexión | ✅ conecta, 36 colecciones |
| RBAC (motor) | ✅ roles desde constantes (200) |
| CRM (leads) | ✅ CRUD persistente probado (POST 201→DELETE 204) |
| Agenda (appointments) | ✅ 200 |
| Documentos | ✅ 200 (subida cifrada) |
| IA Jurídica (ai/chat) | 🟡 503 sin API key (shared) |
| Reuniones (Jitsi) | ✅ 200 |
| Clientes | 🟡 GET 403 (org) — módulo compartido |
| Casos | 🟡 GET 403 (org) — módulo compartido |
| Facturación base (`/invoices`) | ✅ 200 |
| Notificaciones / Alertas base | ✅ 200 (datos reales) |
| Dashboard base / KPIs | ✅ 200 |
| Portal base | 🟡 422 param (shared) |

**Nota:** que CRM/Agenda/Documentos/Reuniones funcionen **no** es mérito de Firm OS. Se excluyen del cálculo.

## B) FIRM OS EXCLUSIVO — lo único que cuenta
Funcionalidades que solo existen por la firma:

| # | Funcionalidad exclusiva | Evidencia runtime | Clasificación |
|---|---|---|---|
| 1 | Dashboard de firma (Centro de Operaciones) | datos reales 200; 2 botones muertos; BI en localStorage | **Parcial** |
| 2 | Perfil institucional del despacho | `PUT /firm-os/settings` 200 existe; FE `handleSave` falso | **Parcial** |
| 3 | Configuración del despacho | backend 200; FE no cableado | **Parcial** |
| 4 | Equipo (gestión de miembros) | `GET /rbac/team` 200; suspender 404 (URL mala); invitar muerto | **Parcial** |
| 5 | Control de Abogados | listado OK; invitar → 500 | **Parcial** |
| 6 | Invitaciones (abogado/miembro) | `POST /firm-os/invite-lawyer` → **500** (`utils/email_service` falta) | **No funcional** |
| 7 | Permisos/Roles internos de firma | constantes; sin UI de gestión | **Parcial** |
| 8 | Plan empresarial (actualizar/cambiar) | `/payment/change-plan` vivo (422); botón FE muerto | **Parcial** |
| 9 | Billing empresarial (OS) | `GET /billing/`,`/subscriptions/` → **400** X-Tenant-ID; sin UI | **Parcial** |
| 10 | Indicadores/Analytics de firma | `GET /firms/{id}/financial` 200 (lectura) | **Completado (lectura)** |
| 11 | Alertas de firma | computadas sobre datos reales de firma | **Completado (lectura)** |
| 12 | Onboarding de firma | `firm-config/onboarding-complete` existe | **Parcial** |
| 13 | Directorio público / Perfil público de firma | `firm-os/public/firms` existe | **Parcial** |
| 14 | Branding básico (logo/nombre/portada) | se guardan como strings; sin endpoint de subida | **Parcial** |
| 15 | Organigrama / Estructura organizacional | RETIRADO commit `b2aa893` | **No iniciado (retirado)** |
| 16 | Departamentos | RETIRADO `b2aa893` | **No iniciado (retirado)** |
| 17 | Sucursales / Oficinas | RETIRADO `b2aa893` | **No iniciado (retirado)** |
| 18 | Comunicación interna | RETIRADO `b2aa893` + contenido mock | **No implementado** |
| 19 | Automatizaciones internas / Enterprise | solo localStorage, sin backend | **No implementado (simulado)** |

---

# FASE 2 — PORCENTAJE REAL (solo Firm OS exclusivo)

Puntuación por evidencia (Completado=100 · Parcial=valor real observado · No iniciado/implementado=0):

| # | Funcionalidad | % |
|---|---|---|
| 1 | Dashboard de firma | 50 |
| 2 | Perfil institucional | 30 |
| 3 | Configuración despacho | 35 |
| 4 | Equipo | 45 |
| 5 | Control de Abogados | 40 |
| 6 | Invitaciones | 15 |
| 7 | Roles/Permisos internos | 30 |
| 8 | Plan empresarial | 40 |
| 9 | Billing empresarial | 30 |
| 10 | Indicadores/Analytics firma | 80 |
| 11 | Alertas de firma | 80 |
| 12 | Onboarding de firma | 50 |
| 13 | Directorio/Perfil público | 55 |
| 14 | Branding básico | 25 |
| 15 | Organigrama | 0 |
| 16 | Departamentos | 0 |
| 17 | Sucursales | 0 |
| 18 | Comunicación | 5 |
| 19 | Automatizaciones internas | 10 |

**Promedio 19 funcionalidades exclusivas = ~33%.**

| Clasificación | Cantidad | Funcionalidades |
|---|---|---|
| Completado | 2 | Indicadores/Analytics, Alertas (ambos solo lectura) |
| Parcial | 11 | Dashboard, Perfil, Config, Equipo, Abogados, Roles, Plan, Billing, Onboarding, Directorio, Branding |
| No funcional | 1 | Invitaciones (500) |
| No iniciado/retirado | 3 | Organigrama, Departamentos, Sucursales |
| No implementado | 2 | Comunicación, Automatizaciones |

> **% REAL de Firm OS exclusivo ≈ 30–35%.** (Si se excluyen los 5 módulos retirados/roadmap y se mide solo el subconjunto MGO — items 1-14 — sube a ~43%, pero ninguno de esos 14 está plenamente cerrado salvo las 2 vistas de solo lectura.)

---

# FASE 3 — MÍNIMO GO-LIVE (¿qué necesita una firma para operar a diario?)

**FUERA del MGO (eliminados):** Google Calendar, Outlook, Marketplace, Enterprise/Automatizaciones, 2FA, White Label avanzado, integraciones futuras, y los módulos retirados (Organigrama, Departamentos, Sucursales, Comunicación).

**MGO — lo indispensable exclusivo de firma:**
1. **Perfil del despacho** (identidad de la firma).
2. **Configuración del despacho** (datos operativos persistentes).
3. **Equipo** (ver/gestionar miembros: suspender/reactivar).
4. **Invitaciones** (incorporar abogados a la firma).
5. **Plan / Billing empresarial** (gestionar la suscripción de la firma).
6. **Branding básico** (logo + nombre de la firma en su espacio).
7. **Dashboard de firma consistente** (sin botones muertos, con datos de la firma).

*(Los módulos de trabajo diario CRM/Casos/Clientes/Agenda/Documentos/Facturación/Reuniones son del Núcleo Compartido: no son "desarrollo de Firm OS", pero deben estar accesibles; su único bloqueo es `organization_id`, que es prerequisito.)*

---

# FASE 4 — CHECKLIST MGO

## Funcionalidades exclusivas de Firm OS (obligatorias)
| Funcionalidad | Estado | Obligatorio | Horas | Acción de cierre |
|---|---|---|---|---|
| Perfil del despacho | Parcial | SÍ | 6 | cablear FE a `PUT /firm-os/settings` + campos controlados |
| Configuración del despacho | Parcial | SÍ | 4 | cablear "Guardar" (SettingsPage.jsx:185) al endpoint existente |
| Equipo | Parcial | SÍ | 4 | corregir URL suspender→`/team/{id}/status`; cablear "Invitar Miembro" |
| Invitaciones | No funcional | SÍ | 3 | crear `utils/email_service` o usar `utils/notifier` (firm_os.py:513) |
| Plan empresarial (cambiar) | Parcial | SÍ | 2 | cablear "Cambiar Plan" (SettingsPage.jsx:203) a `/payment/change-plan` |
| Billing empresarial | Parcial | SÍ | 4 | enviar header `X-Tenant-ID` a `/billing/` y `/subscriptions/` |
| Branding básico | Parcial | SÍ (mínimo) | 4 | persistir logo/nombre; subida de logo diferible |
| Dashboard de firma | Parcial | SÍ | 4 | cablear "Actualizar Plan"/"Administrar Equipo" (FirmDashboard.jsx:136,149) |

**Subtotal exclusivo Firm OS: 31 h.**

## Prerequisitos de Núcleo que BLOQUEAN el MGO de firma (obligatorios)
| Prerequisito | Estado | Horas | Motivo |
|---|---|---|---|
| Arranque backend (4 imports) | roto en `main` | 0.2 | sin esto no corre nada |
| `organization_id` en usuarios/firmas | ausente (None) | 6 | desbloquea Casos/Clientes y scoping de firma |
| Endurecer auth en endpoints de escritura | pendiente | 6 | seguridad antes de exponer datos de firma |

**Subtotal prerequisitos: ~12 h.**

## QA + deploy: ~8 h.

---

# FASE 5 — HORAS REALES (solo Go-Live, sin roadmap)

| Bloque | Horas |
|---|---|
| Firm OS exclusivo (8 tareas MGO) | 31 |
| Prerequisitos de núcleo (boot + org_id + auth) | 12 |
| QA + deploy | 8 |
| **TOTAL MGO REAL** | **≈ 51 h** |

**No incluido** (sale del cálculo): Calendar, Outlook, 2FA, Comunicaciones, Enterprise/Automatizaciones, White Label avanzado, Marketplace, refresh token, subida de avatar/logo avanzada, Sprint 2/3, roadmap.

> **Horas reales de cierre MGO: ~51 h** (≈ 6-7 días de 1 desarrollador enfocado, o ~3-4 días con 2). De esas, **solo ~31 h son propiamente de Firm OS**; el resto son prerequisitos de núcleo y QA.

---

# FASE 6 — DICTAMEN

**¿Cuánto está terminado Firm OS realmente (solo lo exclusivo)?**

## ≈ 30–35 %

**Justificación (únicamente funcionalidades exclusivas):**
- Solo **2 de 19** funcionalidades exclusivas están completas, y ambas son **de solo lectura** (Indicadores y Alertas de firma) — no representan operación real.
- Las funciones exclusivas que definen "gestionar una firma" (Perfil, Configuración, Equipo, Invitaciones, Plan/Billing, Branding) están **todas parciales o rotas**: en varios casos el **backend existe y responde**, pero el **frontend no está cableado** (botones muertos / `handleSave` falso), y una (Invitaciones) da **500**.
- **5 de 19** exclusivas fueron **retiradas o nunca implementadas** (Organigrama, Departamentos, Sucursales, Comunicación, Automatizaciones).

**Conclusión de cierre:**
- El bajo % **no** se debe a falta de backend, sino a **desconexión FE↔BE** y a un **prerequisito de datos** (`organization_id`). Es trabajo de **conexión y configuración**, no de construcción nueva.
- **Firm OS es cerrable a MGO en un solo ciclo** (~51 h reales), porque la mayoría de los endpoints exclusivos ya existen y responden; falta cablearlos, resolver `organization_id`, arreglar `email_service` y enviar el header de tenant.
- El "30-35%" mide construcción real de firma; el **esfuerzo restante es bajo** precisamente porque el núcleo compartido ya carga el peso funcional.

---
*Referencia oficial para el cierre de Firm OS. Separación System OS / Firm OS basada en evidencia de ejecución real (2026-07-15). Sin código, sin commits, sin nuevas auditorías.*
