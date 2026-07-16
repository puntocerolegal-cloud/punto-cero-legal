# HTTP_TRACE_REPORT.md
## Trazas HTTP reales — ejecución 2026-07-15 contra `http://127.0.0.1:8010`

Todas las peticiones con `Authorization: Bearer <JWT real>`. Tiempos y códigos son de ejecución real. Cuerpos truncados a ~90 chars.

---

### AUTH
| Rol | Método | Endpoint | Payload | Status | Tiempo | Respuesta |
|---|---|---|---|---|---|---|
| ADMIN | POST | /api/auth/login | `{email,password}` | 200 | 465ms | `access_token` (role=admin_general) |
| LAWYER | POST | /api/auth/login | idem | 200 | 407ms | role=lawyer |
| FIRM | POST | /api/auth/login | idem | 200 | 432ms | role=firm_owner, user.firm_id=6a5250… |
| CLIENT | POST | /api/auth/login | idem | 200 | 445ms | role=client |
| (todos) | GET | /api/auth/me | Bearer | 200 | ~210ms | perfil |
| — | POST | /api/auth/refresh | `{}` | **404** | — | Not Found (no existe refresh) |

**JWT claims reales:** `{"sub":"<email>","role":"<role>","exp":1784240xxx}`. Sin firm_id/org/tenant en el token.

---

### ADMIN (darwin@)
| Método | Endpoint | Status | Tiempo | Respuesta |
|---|---|---|---|---|
| GET | /api/admin/me | 200 | 210ms | perfil admin |
| GET | /api/admin/dashboard/general | 200 | 250ms | `{"kpis":{"mrr":39105000,"total_users":395,"active_users":343,"conversion_rate":24.6,...}}` |
| GET | /api/admin/dashboard/comercial | 200 | 260ms | `{"pipeline":[{"stage":"Visita Landing","count":1247,...}]}` |

### LAWYER (abogado@, _id 6a46e957…243)
| Método | Endpoint | Status | Tiempo | Respuesta |
|---|---|---|---|---|
| GET | /api/leads/?lawyer_id=… | 200 | 215ms | `[]` |
| GET | /api/cases/?lawyer_id=… | **403** | 215ms | `{"detail":"Usuario sin organización asignada"}` |
| GET | /api/clients/?lawyer_id=… | **403** | 231ms | idem |
| GET | /api/appointments/?lawyer_id=… | 200 | 233ms | `[]` |
| GET | /api/invoices/?lawyer_id=… | 200 | 217ms | `[]` |
| GET | /api/documents/?lawyer_id=… | 200 | 226ms | `[]` |
| GET | /api/dashboard/kpis/… | 200 | 229ms | `{"total_cases":0,"active_cases":0,"total_revenue":0.0,...}` |
| GET | /api/dashboard/notifications/… | 200 | 236ms | `{"notifications":[{"type":"agenda_event","title":"Evento…"}]}` |
| GET | /api/ai/usage/… | 200 | 228ms | `{"used":0,"model":"gemini-flash-latest","free":true}` |

### CLIENT (client@)
| Método | Endpoint | Status | Tiempo | Respuesta |
|---|---|---|---|---|
| GET | /api/portal/cases | **422** | 241ms | `{"detail":"Field required"}` (falta param) |

### FIRM (firma@, firm_id 6a5250…, _id 6a46e957…244)
| Método | Endpoint | Status | Tiempo | Respuesta |
|---|---|---|---|---|
| GET | /api/firms/{firm}/lawyers | 200 | 218ms | `{"success":true,"data":[],"count":0}` |
| GET | /api/firms/{firm}/cases | 200 | 224ms | `count:0` |
| GET | /api/firms/{firm}/financial | 200 | 213ms | `{"total_revenue":0,...}` |
| GET | /api/rbac/team/{firm} | 200 | 214ms | `team:[{firma@…}]` (1) |
| GET | /api/rbac/roles | 200 | 219ms | roles desde constantes |
| GET | /api/firm-os/settings | 200 | 237ms | settings con firm_id |
| GET | /api/leads/?lawyer_id=… | 200 | 220ms | `[]` |
| GET | /api/cases/?lawyer_id=… | **403** | 213ms | sin organización |
| GET | /api/clients/?lawyer_id=… | **403** | 208ms | sin organización |
| GET | /api/invoices/?lawyer_id=… | 200 | 234ms | `[]` |
| GET | /api/payment/my-plan | 200 | 934ms | `{"has_plan":false,"subscription_status":"trial",...}` |
| GET | /api/payment/catalog | 200 | 214ms | catálogo real (COP) |
| GET | /api/billing/ | **400** | 227ms | `{"detail":"Falta la cabecera X-Tenant-ID"}` |
| GET | /api/subscriptions/ | **400** | 220ms | `{"detail":"Falta la cabecera X-Tenant-ID"}` |

### ESCRITURAS (FIRM)
| Método | Endpoint | Payload | Status | Tiempo | Mongo Δ | Respuesta |
|---|---|---|---|---|---|---|
| PATCH | /api/rbac/users/{id}/status | `{status:suspended}` | **404** | 236ms | — | Not Found (ruta del FE inexistente) |
| PATCH | /api/team/{id}/status | `{status:ACTIVE}` | **200** | 221ms | users Δ | `Estado actualizado a ACTIVE` (ruta real) |
| POST | /api/firm-os/invite-lawyer | `{email}` | **500** | 234ms | invitations Δ0 | `No module named 'utils.email_service'` |
| PUT | /api/firm-os/settings | `{audit_probe}` | **200** | 213ms | settings Δ | `modified_count:1` |
| POST | /api/payment/change-plan | `{}` | **422** | 231ms | — | `Field required` (vivo) |
| POST | /api/leads/ | lead válido | **201** | 221ms | leads Δ+1 | lead creado |
| DELETE | /api/leads/{id} | — | **204** | 234ms | leads Δ-1 | — |
| POST | /api/cases/ | caso | **201** | 251ms | cases Δ+1 | CAS-2026-005 |
| POST | /api/clients/ | cliente | **201** | 234ms | clients Δ+1 | _id |
| POST | /api/ai/chat | `{message}` | **503** | 1422ms | — | `Gemini sin clave/caído` |

**Distribución de códigos observada:** 200 (mayoría GET + writes válidos), 201 (creates), 204 (delete), 400 (X-Tenant-ID: billing/subscriptions), 403 (org: cases/clients), 404 (ruta suspender FE), 422 (validación: change-plan/portal/create con payload parcial), 500 (invite-lawyer), 503 (IA sin key). **No hay 401** (JWT válido aceptado en todas).
