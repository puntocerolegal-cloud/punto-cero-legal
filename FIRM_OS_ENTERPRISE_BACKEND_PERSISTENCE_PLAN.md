# Plan de Ejecución — Migración de Persistencia de Firm OS a Backend Empresarial

## Objetivo

Migrar la persistencia actual de Firm OS, que depende en gran medida de almacenamiento local del navegador, hacia una capa de backend empresarial persistente, segura y compartida por firma, sin introducir nuevas funcionalidades y sin romper el comportamiento actual.

Este documento es un plan de ejecución de arquitectura y migración. No incluye implementación de backend ni cambios visuales. Su propósito es servir como base de aprobación previa a la ejecución.

---

## 1. Alcance y principio rector

### Alcance

- Inventariar los módulos de Firm OS que hoy persisten estado en browser storage.
- Definir el modelo de persistencia objetivo en backend empresarial.
- Establecer una matriz de migración priorizada por riesgo y dependencia.
- Definir fases, riesgos, criterios de aceptación y checklist de despliegue.

### Principio rector

La persistencia de Firm OS debe pasar de:

- almacenamiento temporal en localStorage/sessionStorage,

hacia:

- un modelo de recursos persistentes por firma y por usuario,
- con autenticación/autoridad del tenant,
- con trazabilidad, sincronización y recuperación.

### No se incluirá en esta fase

- nuevas funcionalidades de negocio,
- cambios de UI,
- escritura de backend,
- refactors visuales,
- cambios de experiencia de usuario que alteren el flujo actual.

---

## 2. Estado actual observado

### Evidencia técnica detectada

Los módulos de Firm OS aún usan almacenamiento local en hooks y páginas específicas:

- [frontend/src/modules/firm-os/hooks/usePreferences.js](frontend/src/modules/firm-os/hooks/usePreferences.js)
- [frontend/src/modules/firm-os/hooks/useWorkflows.js](frontend/src/modules/firm-os/hooks/useWorkflows.js)
- [frontend/src/modules/firm-os/hooks/useScheduler.js](frontend/src/modules/firm-os/hooks/useScheduler.js)
- [frontend/src/modules/firm-os/hooks/useAutomation.js](frontend/src/modules/firm-os/hooks/useAutomation.js)
- [frontend/src/modules/firm-os/hooks/useGovernance.js](frontend/src/modules/firm-os/hooks/useGovernance.js)
- [frontend/src/modules/firm-os/hooks/useNotifications.js](frontend/src/modules/firm-os/hooks/useNotifications.js)
- [frontend/src/modules/firm-os/hooks/useAutonomousEngine.js](frontend/src/modules/firm-os/hooks/useAutonomousEngine.js)
- [frontend/src/modules/firm-os/domain/preferencesDomain.js](frontend/src/modules/firm-os/domain/preferencesDomain.js)
- [frontend/src/modules/firm-os/utils/storage.js](frontend/src/modules/firm-os/utils/storage.js)

### Patrones actuales

- Persistencia local por módulo: workflows, scheduler, automation, governance, notifications, autonomous engine y preferences.
- Uso de serialización JSON manual.
- Ausencia de una capa de persistence unificada por tenant/firm.
- El estado se pierde al cambiar navegador, dispositivo o limpiar datos del navegador.
- La arquitectura actual no define un contrato único de backend para estado de operación y preferencias.

### Conclusión

Firm OS está operando como una experiencia de escritorio local con estado efímero. La migración debe convertir esa experiencia en un sistema persistente y empresarial con estado compartido por firma.

---

## 3. Inventario principal de módulos a migrar

| Módulo | Estado actual | Persistencia actual | Objetivo de migración |
|---|---|---|---|
| Preferences | Hook de preferencias por usuario/firm | localStorage | API de preferencias por firma/usuario |
| Workflows | Definición y ejecución | localStorage | API de workflows y workflow executions |
| Scheduler | Programación de tareas | localStorage | API de schedules y ejecución |
| Automation | Historial y resultados | localStorage | API de automation history / rule results |
| Governance | Eventos, políticas y explicaciones | localStorage | API de audit trail y policies |
| Notifications | Centro de notificaciones | localStorage | API de notifications |
| Autonomous Engine | Modo, historial, approvals | localStorage | API de autonomy state, decisions, approvals |
| Filters/Search | Estado temporal y preferencias de búsqueda | localStorage | Integración con preferencias o API de session state |

---

## 4. Modelo objetivo de persistencia empresarial

### 4.1 Principios del modelo objetivo

- Persistencia por tenant/firma.
- Persistencia por usuario cuando el estado sea personal.
- Separación de recursos operacionales y preferencias.
- Unificación de contratos de API para operaciones CRUD y estado.
- Soporte para sincronización y recuperación.

### 4.2 Recursos propuestos en backend

Los recursos deben exponerse como recursos de dominio, no como almacenamiento genérico de navegador:

- Preferences API
  - GET /api/firm-os/preferences
  - PUT /api/firm-os/preferences
  - DELETE /api/firm-os/preferences

- Workflows API
  - GET /api/firm-os/workflows
  - POST /api/firm-os/workflows
  - PATCH /api/firm-os/workflows/{id}
  - DELETE /api/firm-os/workflows/{id}
  - GET /api/firm-os/workflows/{id}/executions

- Scheduler API
  - GET /api/firm-os/schedules
  - POST /api/firm-os/schedules
  - PATCH /api/firm-os/schedules/{id}
  - DELETE /api/firm-os/schedules/{id}
  - POST /api/firm-os/schedules/{id}/record-execution

- Automation API
  - GET /api/firm-os/automation/history
  - POST /api/firm-os/automation/run
  - POST /api/firm-os/automation/rules/{ruleId}/run

- Governance API
  - GET /api/firm-os/governance/events
  - POST /api/firm-os/governance/events
  - GET /api/firm-os/governance/policies
  - POST /api/firm-os/governance/policies

- Notifications API
  - GET /api/firm-os/notifications
  - PATCH /api/firm-os/notifications/{id}/read
  - DELETE /api/firm-os/notifications/{id}

- Autonomous API
  - GET /api/firm-os/autonomy/state
  - PATCH /api/firm-os/autonomy/mode
  - POST /api/firm-os/autonomy/approvals
  - PATCH /api/firm-os/autonomy/approvals/{id}

### 4.3 Contratos de datos recomendados

Cada recurso debe mantener:

- firm_id
- user_id (cuando aplique)
- created_at / updated_at
- version / revision
- metadata de contexto operativo
- estado de sincronización

---

## 5. Matriz de migración priorizada

| Fase | Módulo | Riesgo | Complejidad | Orden recomendado | Observación |
|---|---|---|---|---|---|
| 1 | Preferences | Bajo | Baja | 1 | Es el punto de entrada más simple y de menor impacto |
| 2 | Notifications | Bajo | Baja | 2 | Estado derivado, fácil de rehidratar |
| 3 | Workflows | Medio | Media | 3 | Requiere historial y ejecución |
| 4 | Scheduler | Medio | Media | 4 | Depende de reglas de tiempo y ejecución |
| 5 | Automation | Medio | Media | 5 | Requiere historial y reglas |
| 6 | Governance | Medio/alto | Media | 6 | Debe preservar trazabilidad y auditoría |
| 7 | Autonomous Engine | Alto | Alta | 7 | Incluye aprobaciones, decisiones y estado de operación |

---

## 6. Fases de ejecución

### Fase 0 — Preparación y contrato

Objetivo: definir el modelo de datos y el contrato API sin tocar la experiencia actual.

Entregables:

- contrato de recursos por dominio,
- diseño de tablas/colecciones del backend,
- definición de tenant/firma y permisos,
- definición de estrategia de migración incremental.

Criterio de aceptación:

- todos los recursos tienen un contrato claro,
- cada recurso queda asociado a una firma y un usuario cuando aplique,
- se define el mecanismo de fallback temporal para no romper la UI.

### Fase 1 — Migración de preferencias y notificaciones

Objetivo: mover los datos menos sensibles y con menor complejidad.

Prioridad:

- Preferences
- Notifications

Motivo:

- son los estados más simples,
- generan menos riesgo operativo,
- sirven como prueba de concepto de la capa de persistence empresarial.

### Fase 2 — Migración de workflows y scheduler

Objetivo: mover el estado de automatización y de ejecución operacional.

Prioridad:

- Workflows
- Scheduler

Requisitos de interoperabilidad:

- conservar ids existentes para no romper referencias,
- preservar historial y ejecuciones,
- mantener compatibilidad con UI actual.

### Fase 3 — Migración de automation y governance

Objetivo: consolidar trazabilidad y reglas ejecutadas.

Prioridad:

- Automation history
- Governance events/policies
- Audit trail

Requisitos:

- preservar la integridad del historial,
- asegurar que los eventos de auditoría sean inmutables o versionados,
- definir retención y volumen máximo.

### Fase 4 — Migración de autonomous engine

Objetivo: mover el estado de decisiones y aprobaciones a un modelo persistente y auditable.

Prioridad:

- Autonomous mode
- Activity history
- Approvals
- Decision outcomes

Riesgo:

- mayor impacto porque integra varios dominios y depende de la coherencia entre workflows, automation y governance.

### Fase 5 — Cutover y retirada del storage local

Objetivo: eliminar la dependencia de localStorage para los recursos ya migrados.

Acciones:

- usar backend como fuente de verdad,
- mantener compatibilidad temporal de lectura,
- retirar el uso de localStorage por módulo migrado,
- documentar la estrategia de migración para futuras extensiones.

---

## 7. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Pérdida de estado al migrar | Alto | Implementar estrategia de fallback temporal y migración incremental |
| Inconsistencia entre UI local y backend | Alto | Definir versionado de recursos y rehidratación controlada |
| Estado compartido por firma no correctamente aislado | Alto | Aplicar scope por firm_id y permisos por rol |
| Volumen de historial excesivo | Medio | Definir límites, paginación y compresión de eventos |
| Dependencia de localStorage en múltiples hooks | Medio | Centralizar el adapter de persistence antes del cutover |
| Duplicación de lógica de estado | Medio | Introducir una capa de servicio/persistence compartida |

---

## 8. Dependencias técnicas y de negocio

### Dependencias técnicas

- backend con soporte de autenticación por firma,
- acceso a tenant/firma desde los endpoints,
- esquema de base de datos para recursos operacionales,
- mecanismo de sincronización y reintento.

### Dependencias de negocio

- definición del modelo de negocio por firma,
- claridad sobre qué estado es personal versus compartido,
- criterios de retención y auditoría,
- aprobación del alcance por parte de negocio/arquitectura.

---

## 9. Criterios de aceptación

La migración se considera lista cuando:

- los recursos de Firm OS ya no dependen de localStorage para persistencia principal,
- la UI puede rehidratar estado desde backend tras recargar la sesión,
- los cambios de estado son visibles en múltiples sesiones del mismo tenant,
- los eventos críticos quedan registrados en auditoría,
- la experiencia actual sigue siendo funcional sin regresiones de navegación ni de flujo.

---

## 10. Checklist operativo

### Preparación

- [ ] Confirmar alcance y no incluir nuevas funcionalidades.
- [ ] Definir contratos API por dominio.
- [ ] Definir permisos por firm_id y user_id.
- [ ] Definir estrategia de migración incremental.

### Fase 1

- [ ] Crear recursos de preferences y notifications en backend.
- [ ] Adaptar el frontend para consumir backend en modo lectura/escritura.
- [ ] Validar recuperación de datos tras recarga.

### Fase 2

- [ ] Crear recursos de workflows y scheduler.
- [ ] Migrar ejecución e historial.
- [ ] Validar continuidad del flujo y ejecución.

### Fase 3

- [ ] Crear recursos de automation y governance.
- [ ] Verificar trazabilidad y métricas.
- [ ] Validar que los eventos quedan persistidos.

### Fase 4

- [ ] Mover autonomous state, approvals y decisiones.
- [ ] Validar coherencia entre módulos.
- [ ] Confirmar que la UI sigue operando con el estado nuevo.

### Cutover

- [ ] Eliminar uso principal de localStorage para los módulos migrados.
- [ ] Mantener fallback temporal solo si se requiere.
- [ ] Verificar carga de datos y estabilidad.

---

## 11. Recomendación de ejecución

Se recomienda ejecutar esta migración en orden incremental, empezando por preferencias y notificaciones, y dejando el autonomous engine para el cierre porque concentra mayor riesgo y mayor cantidad de dependencias. Este orden reduce el riesgo operacional y permite validar la capa empresarial antes de mover el estado más complejo.

La implementación debe mantenerse alineada con el plan de consolidación arquitectónica descrito en [ENTERPRISE_ARCHITECTURE_CONSOLIDATION_PLAN.md](ENTERPRISE_ARCHITECTURE_CONSOLIDATION_PLAN.md) y con los principios de separación entre shells y dominio de Firm OS.
