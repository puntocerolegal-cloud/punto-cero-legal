# DISCONNECTED_MODULES_REPORT.md
## Módulos huérfanos / desconectados / eliminados — evidencia (git + runtime)

Criterio por módulo: existe archivo · existe ruta · existe sidebar · existe endpoint · estado.

---

## 1. Communication / CommunicationPage
| Check | Resultado | Evidencia |
|---|---|---|
| Existe archivo | ✅ | `frontend/src/modules/firm-os/pages/CommunicationPage.jsx` |
| Existe ruta | ❌ **eliminada** | commit `b2aa893` borró `<Route path="communication">` de FirmShell.jsx |
| Existe sidebar | ❌ **eliminado** | commit `b2aa893` borró `{label:'Comunicación', path:'/firm-os/communication'}` de FirmOSSidebar.jsx |
| Existe endpoint backend | ⚠️ parcial | `messages.py` (`/api/messages/`, `/api/messages/{id}/mark-read`) existe pero **CommunicationPage NO lo llama** (datos hardcodeados CommunicationPage.jsx:35-80) |
| Estado runtime | inalcanzable | navegar a `/firm-os/communication` → catch-all FirmShell.jsx:41 → redirect a `/firm-os` |

**Diagnóstico:** **ELIMINADO del enrutado** (commit b2aa893, autor QA Bot, 2026-07-13, motivo "retirar módulos no listos") + contenido subyacente **MOCK** (nunca fue funcional; banner "preparada para integración futura con WebSockets", botones Enviar/Nueva/Buscar sin onClick). No fue terminado nunca.

---

## 2. FirmSettings.jsx
| Check | Resultado | Evidencia |
|---|---|---|
| Existe archivo | ✅ | `frontend/src/modules/firm-os/pages/FirmSettings.jsx` |
| Importado en algún lado | ❌ | grep `FirmSettings` en src = 0 referencias externas |
| Ruta | ❌ | `firmRegistry.settings` apunta a `@/pages/dashboard/SettingsPage` (el genérico), no a FirmSettings |
| Estado | **HUÉRFANO** | nunca se renderiza; el settings visible es el mock genérico |

---

## 3. Billing (facturación OS)
| Check | Resultado | Evidencia |
|---|---|---|
| Backend existe | ✅ | `billing.py` (prefix `/billing`), `subscriptions.py` (`/subscriptions`) montados (server.py:196,195) |
| Responde | ⚠️ **400** | `GET /billing/` y `/subscriptions/` → `Falta la cabecera X-Tenant-ID` (requieren header de tenant que el FE no envía) |
| Ruta frontend `/firm-os/billing` | ❌ | no existe; la facturación del FE vive en `/firm-os/invoices` (InvoicesPage → `/api/invoices/`, distinto de `/billing`) |
| Estado | **DESCONECTADO** | dos sistemas de facturación paralelos: `invoices.py` (usado por FE, funciona) vs `billing.py`+`subscriptions.py` (OS, gated por X-Tenant-ID, sin UI que los consuma) |

---

## 4. Rutas eliminadas por commit b2aa893 (todas fuera de enrutado y sidebar)
`OrganizationalStructure`, `ExpedientesPage`, `OfficesPage`, `DepartmentsPage`, `AssignmentsPage`, `CommunicationPage`. Archivos presentes en `frontend/src/modules/firm-os/pages/` pero sin `<Route>` ni enlace. Motivo del commit: "retirar módulos no listos". Estado: **ELIMINADOS del producto** (código muerto en disco).

---

## 5. Automatizaciones / clúster Enterprise (Automation, WorkflowBuilder, Scheduler, IntelligenceCenter, MissionControl, AutonomousOps, Governance)
| Check | Resultado |
|---|---|
| Archivos/rutas | ✅ existen (algunos solo por URL, no en sidebar) |
| Backend | ❌ **ninguno** — persisten solo en `localStorage` |
| Estado runtime | **SIMULADO** — no tocan el servidor (0 requests HTTP) |

---

## RESUMEN
| Módulo | Archivo | Ruta | Sidebar | Endpoint | Veredicto |
|---|---|---|---|---|---|
| Communication | ✅ | ❌ | ❌ | ⚠ (no usado) | ELIMINADO + MOCK |
| FirmSettings | ✅ | ❌ | ❌ | (PUT settings existe) | HUÉRFANO |
| Billing OS | — | ❌ | ❌ | ✅ (400 tenant) | DESCONECTADO |
| Structure/Expedientes/Offices/Departments/Assignments | ✅ | ❌ | ❌ | varía | ELIMINADOS (b2aa893) |
| Enterprise/Automatización | ✅ | parcial | parcial | ❌ | SIMULADO (localStorage) |
