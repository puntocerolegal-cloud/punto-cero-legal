# FIRM_OS_GAP_ANALYSIS_FINAL.md
## Auditoría de Brechas — Firm OS vs Arquitectura Empresarial de Punto Cero System OS
**Fecha:** 2026-07-15 · Rol: CTO / Enterprise & Multi-Tenant & White Label & Security & SaaS Architect / PO / QA Lead / BA.

> No es una auditoría de bugs ni de botones. Compara **lo que existe** (evidencia de ejecución real ya obtenida + confirmaciones de superficie vía OpenAPI/Mongo) contra la **visión empresarial** que definen las 13 capas. Clasificación: 🟢 Completo · 🟡 Parcial · 🔴 Inexistente · ⚪ Desconectado.

**Evidencia base clave (runtime 2026-07-15):** `organizations`=**0 docs**; `firms`=5 (solo `name/nit/address/phone`; sin logo/colores/razón social/tax_id/redes/especialidades); `firm_settings`=1 cascarón (`firm_id/created/updated`); **0 endpoints** white-label/branding; **0 colecciones** de consentimiento/términos; `audit_logs`=19; existe superficie `/organizations` (11) y `/global` (13: countries, cross-border, firm-network, currency).

---

## CAPA 1 — IDENTIDAD DE LA FIRMA · 🟡 Parcial (~25%)
| Elemento | Existe | Persiste | Evidencia |
|---|---|---|---|
| Nombre firma | ✅ | ✅ | `firms.name` |
| NIT | ✅ | ✅ | `firms.nit` |
| Teléfono / Dirección | ✅ | ✅ | `firms.phone/address` |
| Razón social / RIF / datos fiscales (tax_id) | 🔴 | ❌ | campos ausentes en `firms` |
| Logo / Avatar / Portada | 🔴 | ❌ | `logo_url/cover_image_url` ausentes; sin endpoint de subida |
| Colores / Branding | 🔴 | ❌ | sin `colors/primary_color` |
| Especialidades / Redes sociales | 🔴 | ❌ | ausentes |
| Información institucional | 🟡 | ❌ | `firm_settings` es cascarón vacío; FE `handleSave` falso (SettingsPage.jsx:57-60) |
- **Brecha:** solo persiste identidad mínima. Todo lo institucional/fiscal/branding no se guarda. **Backend:** `PUT /firm-os/settings` existe pero el modelo de firma no tiene esos campos. **FE:** SettingsPage "Despacho" no cablea. **Impacto:** una firma no puede configurar su identidad. **Prioridad:** P0. **Horas:** 12. **Dependencia:** modelo de firma + persistencia.

## CAPA 2 — WHITE LABEL · 🔴 Inexistente (~10%)
| Elemento | Estado |
|---|---|
| Logo/Nombre dinámico, Colores, Favicon, Sidebar/Header/Breadcrumbs branded | 🔴 **0 endpoints** de branding/theme en OpenAPI |
| Portal cliente branded | 🔴 sin branding por firma |
| Emails / Facturas / PDF branded | 🔴 sin plantillas por firma |
| WhatsApp / Notificaciones branded | 🔴 |
| "Punto Cero" desaparece para el cliente | ❌ **NO** |
- **Brecha:** White Label es **conceptual, no implementado**. Existe `firm-os/directory-settings` (slug/logo como strings) pero las firmas no los guardan y no hay motor de theming. **Impacto:** no se puede vender como marca blanca. **Prioridad:** P2/Roadmap (no MGO). **Horas:** 60. **Dependencia:** Capa 1 (identidad) + sistema de theming.

## CAPA 3 — SEGURIDAD EMPRESARIAL · 🟡 estructura sí, funciona no (~35%)
| Elemento | ¿Existe? | ¿Funciona? | Evidencia |
|---|---|---|---|
| firm_id | ✅ | ✅ | en token-response y BD |
| organization_id | ✅ (campo) | 🔴 **NO** | =None en todos; `organizations`=0 docs |
| tenant_id / Tenant Isolation | ✅ (middleware/kernel) | 🟡 | kernel exige tenant; org vacía → aislamiento no efectivo |
| JWT | ✅ | 🟡 | solo `sub/role/exp` (sin firm/tenant en token; sin refresh) |
| RBAC / Policy Matrix | ✅ | 🟡 | desde constantes `ROLE_PERMISSIONS`, no gestionable |
| Guarded Repository | ✅ | 🔴 | rutas usan `db._real_db` (guard bypass, ver memoria de proyecto) |
| Audit Logger | ✅ | 🟡 | `audit_logs`=19; parcial (access-audit admin) |
| X-Tenant-ID / X-Firm-ID | ✅ | 🟡 | exigido por `/billing`,`/subscriptions` (400 sin header); FE no lo envía |
| Permisos cruzados / Escalamiento / Delegación | 🟡 | 🔴 | `team.py` supervisor existe; sin enforcement real de aislamiento |
- **Brecha:** el multi-tenant está **diseñado pero no operativo** (org vacía, guard bypass, 403 es bloqueo tosco, no scoping). **Impacto:** riesgo de aislamiento de datos entre firmas. **Prioridad:** P0. **Horas:** 40. **Dependencia:** poblar organization_id → activar isolation sin romper kernel.

## CAPA 4 — SUSCRIPCIÓN · 🟡 backend fuerte / FE-cuotas débil (~45%)
| Elemento | Estado |
|---|---|
| Plan actual / Trial / Estado | 🟡 `GET /payment/my-plan` 200 (`has_plan`, `trial`); Firm OS FE muestra nombre pero sin contadores (tarjeta revertida `c1dc11a`) |
| Días restantes / Usuarios/Expedientes/IA/Almacenamiento usados vs disponibles | 🔴 **no hay contadores de cuota** en Firm OS |
| Renovación/Upgrade/Downgrade/Cancelar | 🟡 endpoints existen (`/payment/renew|change-plan|cancel|reactivate`) pero **botón FE muerto** |
| Historial / Facturación | 🟡 `/payment/subscription-status`, `transactions` |
| MercadoPago | 🟡 real (requiere `MP_ACCESS_TOKEN`) |
| Stripe | 🔴 FE lo muestra "Conectado" hardcodeado; sin backend real confirmado |
| Límites reales (enforcement) | 🔴 no se aplican cuotas |
- **Brecha:** backend de pago robusto (41 endpoints) pero **sin visualización de cuotas ni enforcement de límites** en Firm OS, y los botones no cablean. **Impacto:** no se puede gestionar la suscripción empresarial. **Prioridad:** P1. **Horas:** 24. **Dependencia:** Capa 3 (tenant) + cableado FE.

## CAPA 5 — EXPERIENCIA EMPRESARIAL (vs ERP) · 🟡 (~40%)
| Elemento | Estado |
|---|---|
| Dashboard ejecutivo / KPIs / Indicadores | 🟡 FirmDashboard + FirmAnalytics leen datos reales (`/firms/{id}/financial` 200) |
| Productividad | 🟡 `/firm-management/productivity/{id}` existe |
| Alertas / Riesgos | 🟡 AlertsCenter (lectura, computa en cliente) |
| Equipo / Crecimiento / Rentabilidad / Pipeline | 🟡 pipeline en admin comercial; rentabilidad/crecimiento en motores localStorage |
- **Brecha:** hay tablero pero la "inteligencia" (riesgos, rentabilidad, forecast) es **heurística en cliente/localStorage**, no ERP real. **Impacto:** experiencia ejecutiva superficial. **Prioridad:** P1/P2. **Horas:** 40. **Dependencia:** datos reales de firma (Capa 3).

## CAPA 6 — PERFIL DE FIRMA (persistencia) · 🔴 (~20%)
| Elemento | Persiste |
|---|---|
| Guardar perfil / configuración / despacho | ❌ `handleSave` falso (SettingsPage.jsx:57-60); `firm_settings` cascarón |
| Logo / Avatar | ❌ sin endpoint de subida |
| Información tributaria / datos legales | ❌ campos ausentes |
| Firma digital / Plantillas / Branding | 🔴 inexistente |
- **Brecha:** **nada de perfil persiste desde el FE** (aunque `PUT /firm-os/settings` responde 200 si se llama). **Impacto:** crítico — la firma no puede guardar su configuración. **Prioridad:** P0. **Horas:** 16. **Dependencia:** Capa 1.

## CAPA 7 — ONBOARDING · 🟡 (~50%)
- Existe `FirmOnboarding` (FE) + `firm-config/{id}/step` y `/complete` + `firm-os/.../onboarding-complete` (backend). Hook `useFirmOnboarding` en Dashboard.
- **Brecha:** existe el asistente pero su efectividad end-to-end (carga de datos, aceptación, finalización real) no está verificada y depende de que la identidad/persistencia (Capas 1/6) funcionen. **Prioridad:** P1. **Horas:** 12. **Dependencia:** Capas 1, 6, 8.

## CAPA 8 — LEGAL (consentimiento) · 🔴 Inexistente (~5%) — OBLIGATORIO
| Elemento | Estado |
|---|---|
| Aceptación de términos / Privacidad / Habeas Data / Consentimiento empresarial | 🔴 **0 colecciones** (`consents/terms_acceptances/legal_acceptances` no existen) |
| Registro de aceptación (fecha / IP / auditoría) | 🔴 no existe |
| Páginas legales | 🟡 existen (Privacy/Terms/Cookies/SubscriptionAgreement) pero sin registro de aceptación |
- **Brecha:** **no hay trazabilidad de consentimiento** (obligatorio legal). **Impacto:** riesgo legal/regulatorio (Habeas Data). **Prioridad:** P0 (obligatorio). **Horas:** 24. **Dependencia:** onboarding + audit logger.

## CAPA 9 — ADMINISTRACIÓN · 🟡 (~35%)
| Elemento | Estado |
|---|---|
| Equipo / Abogados | 🟡 `rbac/team` 200; `firm-management` (20 endpoints) |
| Roles / Permisos | 🟡 constantes, sin UI de gestión |
| Invitaciones | 🔴 500 (`utils/email_service` falta) |
| Jerarquías / Delegaciones | 🟡 `team.py` supervisor |
| Departamentos / Sucursales / Organigrama | 🔴 **RETIRADOS** (commit `b2aa893`) |
| Workflow | 🔴 localStorage |
- **Brecha:** gestión de equipo básica existe; la estructura organizacional (organigrama/depts/sucursales) fue **retirada**. **Impacto:** una firma mediana/grande no puede modelar su estructura. **Prioridad:** P1 (equipo/invitaciones) / P2 (estructura). **Horas:** 40. **Dependencia:** Capa 3, email_service.

## CAPA 10 — COMUNICACIONES · ⚪ Desconectado (~10%)
| Elemento | Estado |
|---|---|
| CommunicationPage | ⚪ existe archivo, **ruta+sidebar eliminados** (b2aa893), contenido mock |
| Backend mensajería | 🟡 `messages.py` (2 endpoints) existe pero **no lo usa nadie** |
| WhatsApp | 🟡 `chatbot.py` webhook (intake), no chat interno de firma |
| Email | 🟡 `utils/notifier` (no `email_service`) |
| SMS / Chat interno | 🔴 inexistente |
- **Brecha:** módulo **desconectado + mock**; backend de mensajes huérfano. **Ubicación exacta:** `frontend/src/modules/firm-os/pages/CommunicationPage.jsx` (mock, L35-80); `routes/messages.py` (backend sin consumidor). **Prioridad:** P2/Roadmap. **Horas:** 40. **Dependencia:** WebSocket/notificaciones.

## CAPA 11 — AUTOMATIZACIÓN · 🔴 (~10%)
- Clúster Enterprise (Automation/WorkflowBuilder/Scheduler/AutonomousOps/Governance) = **solo localStorage, sin backend**. Existe `services/cron_jobs` (scheduler arranca en boot) pero no vinculado a reglas de firma.
- **Brecha:** flujos/reglas/triggers **simulados en cliente**. **Impacto:** ninguna automatización real persiste. **Prioridad:** P3/Roadmap. **Horas:** 60. **Dependencia:** backend de workflows.

## CAPA 12 — INTEGRACIONES · 🟡 (~40%)
| Integración | Estado |
|---|---|
| MercadoPago | 🟡 real (requiere token) |
| Stripe | 🔴 FE hardcodeado "Conectado"; sin backend real |
| Gemini / Claude | 🟡 `ai.py` (503 sin API key) |
| Jitsi | 🟢 client-side, funciona |
| Google Drive | 🟡 `drive_service` opcional en documentos |
| Google Calendar / Outlook / Microsoft | 🔴 **0 endpoints OAuth** |
- **Brecha:** integraciones de pago/IA/video existen (con config); calendario/Outlook/Microsoft **inexistentes**. **Prioridad:** P2/Roadmap (calendar/outlook fuera de MGO). **Horas:** 80. **Dependencia:** OAuth.

## CAPA 13 — ESCALABILIDAD · 🟡 andamiaje sin datos (~30%)
| Visión | Estado |
|---|---|
| Multiempresa | 🟡 `/organizations` (11 endpoints) pero **0 docs** |
| Multipaís | 🟡 `/global/countries`, `cross-border`, `convert-currency`, `firm-network/{firm_id}` |
| Franquicias / Holding / Ecosistema | 🟡 `partners`, `referrals`, `commissions`, `global-orchestrator` (andamiaje) |
| Marketplace | 🔴 inexistente |
- **Brecha:** existe **estructura** para multiempresa/multipaís pero **sin datos ni cableado** (org vacía). Marketplace no existe. **Impacto:** la visión de ecosistema está esbozada, no activa. **Prioridad:** P3/Roadmap. **Horas:** 80. **Dependencia:** Capa 3 (org_id) primero.

---

## MATRIZ ÚNICA

| Capa | Estado | % | Horas | Prioridad | Dependencias |
|---|---|---|---|---|---|
| 1. Identidad de la firma | 🟡 | 25% | 12 | P0 | modelo firma + persistencia |
| 2. White Label | 🔴 | 10% | 60 | P2/Roadmap | Capa 1 + theming |
| 3. Seguridad empresarial | 🟡 | 35% | 40 | P0 | organization_id, kernel |
| 4. Suscripción | 🟡 | 45% | 24 | P1 | Capa 3 + cableado FE |
| 5. Experiencia empresarial (ERP) | 🟡 | 40% | 40 | P1/P2 | datos reales firma |
| 6. Perfil de firma (persistencia) | 🔴 | 20% | 16 | P0 | Capa 1 |
| 7. Onboarding | 🟡 | 50% | 12 | P1 | Capas 1,6,8 |
| 8. Legal / consentimiento | 🔴 | 5% | 24 | **P0 (obligatorio)** | onboarding + audit |
| 9. Administración | 🟡 | 35% | 40 | P1/P2 | Capa 3, email_service |
| 10. Comunicaciones | ⚪ | 10% | 40 | P2/Roadmap | WebSocket |
| 11. Automatización | 🔴 | 10% | 60 | P3/Roadmap | backend workflows |
| 12. Integraciones | 🟡 | 40% | 80 | P2/Roadmap | OAuth |
| 13. Escalabilidad | 🟡 | 30% | 80 | P3/Roadmap | Capa 3 |

**Promedio ponderado de madurez empresarial ≈ 28%.**

### Lectura por horizonte
- **Bloque MGO / obligatorio (P0-P1):** Capas 1, 3, 4, 6, 7, 8, 9 → ~**168 h** (incluye lo legal obligatorio y la seguridad multi-tenant real). El subconjunto estrictamente MGO ya definido eran ~51 h; la diferencia es que el **gap empresarial completo** (multi-tenant real + legal/consentimiento + suscripción con cuotas) es mayor que el MGO mínimo.
- **Roadmap (P2-P3):** Capas 2, 5(avanzado), 10, 11, 12, 13 → ~**360+ h** (White Label real, Comunicaciones, Automatización, Integraciones OAuth, Escalabilidad/Marketplace).

### Hallazgos arquitectónicos de fondo
1. **El multi-tenant es el eje que falta:** `organization_id=None` + `organizations`=0 + Guarded bypass ⇒ la promesa empresarial (aislamiento, cuotas, escalabilidad) **no está activa**. Es la dependencia raíz de las capas 3, 4, 5, 9, 13.
2. **White Label es aspiracional, no real** (0 endpoints de branding) — no vendible como marca blanca hoy.
3. **Vacío legal crítico:** sin registro de consentimiento/Habeas Data (obligatorio).
4. **Patrón repetido:** backend frecuentemente existe; falta **cableado FE + poblar datos (org) + persistir identidad**. La brecha es de integración/datos, no de construir todo desde cero — salvo White Label, Comunicaciones y Automatización, que sí requieren desarrollo real.

---
*Última auditoría antes del Sprint definitivo de cierre. Evidencia de ejecución real + confirmaciones OpenAPI/Mongo (2026-07-15). Sin código, sin correcciones, sin ocultar módulos.*
