# FIRM OS — ARQUITECTURA BACKEND ENTERPRISE

## REVISIÓN ARQUITECTÓNICA FINAL

**Fecha**: 2026  
**Revisor**: CTO Enterprise Architecture  
**Resultado**: Aprobación Condicional  
**Veredicto**: 55/100 — Fundación Sólida + Vacíos Críticos  

---

## RESUMEN EJECUTIVO

El documento `FIRM_OS_ENTERPRISE_BACKEND_ARCHITECTURE.md` es una **arquitectura bien estructurada** que proporciona una base excelente para Punto Cero Legal. Sin embargo, **NO está lista para convertirse en la Constitución Técnica sin completar 10 áreas críticas que faltan**.

### Calificación por Área

| Área | Calificación | Estado |
|------|-------------|--------|
| Multi-Tenancy | 9/10 | ✅ Excelente |
| RBAC | 8/10 | ✅ Bien diseñado |
| Modelo de Datos | 8/10 | ✅ Empresarial |
| Governance & Auditoría | 8/10 | ✅ Sólido |
| Seguridad | 6/10 | ⚠️ Básico |
| Billing & Suscripciones | 0/10 | 🔴 FALTA |
| Feature Flags | 0/10 | 🔴 FALTA |
| API Pública | 2/10 | 🔴 INCOMPLETA |
| Integration Hub | 0/10 | 🔴 FALTA |
| Motor IA | 4/10 | 🔴 VAGO |
| Almacenamiento Documental | 3/10 | 🔴 NO ABSTRACTO |
| DR & Backups | 2/10 | 🔴 VAGO |
| Internacionalización | 2/10 | 🔴 MÍNIMA |
| Escalabilidad | 5/10 | ⚠️ INCERTIDUMBRE |
| Observabilidad | 4/10 | ⚠️ BÁSICA |
| **PROMEDIO** | **4.5/10** | **REQUIERE MEJORAS** |

---

## ✅ LO QUE ESTÁ BIEN DISEÑADO

### 1. **Multi-Tenancy (Excelente — 9/10)**
- ✅ `firm_id` en cada tabla, no es bolted-on
- ✅ Índices en `firm_id` para aislamiento de queries
- ✅ Soft-delete con `deleted_at` para cumplimiento legal
- ✅ Garantiza zero data leakage entre firmas

**Recomendación**: Añadir **Row-Level Security (RLS)** en PostgreSQL como capa extra:
```sql
CREATE POLICY firm_isolation ON cases
  USING (firm_id = current_setting('app.firm_id')::uuid);
```

---

### 2. **RBAC con Herencia (Bien — 8/10)**
- ✅ 9 roles con rank jerárquico (0-110)
- ✅ Herencia de permisos por rank
- ✅ Permisos condicionales (JSONB): own_cases_only, department_scoped
- ✅ Matriz de permisos por módulo

**Recomendación**: Documentar explícitamente herencia:
- Owner > Managing Partner (rank 0 > 10)
- Managing Partner > Partner > Manager > Lawyer
- Las permisos se heredan si rank ≤ usuario

---

### 3. **Modelo de Datos (Empresarial — 8/10)**
- ✅ 40+ entidades bien relacionadas
- ✅ Documentos versionados con audit trail
- ✅ Casos con seguimiento de actividad
- ✅ Workflow con state machine

**Recomendación**: Añadir entidades de seguimiento:
- [ ] SLAPolicy (enforcement de deadlines legales)
- [ ] RiskAssessment (per case, per lawyer)

---

### 4. **Governance & Auditoría (Sólido — 8/10)**
- ✅ Completo AuditLog con severidad e IP
- ✅ DocumentAccess para trail de acceso
- ✅ GovernancePolicy + ApprovalRequest
- ✅ 7 años de retención especificado

**Recomendación**: Añadir:
- [ ] Audit logs a TimescaleDB (no PostgreSQL) para scale
- [ ] Alertas en tiempo real para accesos sospechosos

---

### 5. **Workflow Engine (Sofisticado — 8/10)**
- ✅ State machine con steps JSONB
- ✅ Soporte para MANUAL, APPROVAL, WEBHOOK, DELAY
- ✅ Versioning implícito (Workflow template vs. Execution)
- ✅ Event-driven integration

**Recomendación**: Añadir:
- [ ] WorkflowTemplate con control de versiones explícito
- [ ] WorkflowVersion para tracking de cambios

---

### 6. **Seguridad Base (6/10)**
- ✅ Encryption at rest (AES-256)
- ✅ MFA para Partners/Admins
- ✅ TLS 1.3 especificado
- ✅ Rate limiting definido

**Brecha**: Falta estrategia de:
- Rotación de claves (cómo y con qué frecuencia)
- Gestión de secretos (Vault vs. AWS Secrets)
- Penetration testing (cuándo y cómo)

---

## 🔴 VACÍOS CRÍTICOS (DEBEN RESOLVERSE ANTES DE DESARROLLO)

### 1. **BILLING & SUBSCRIPTION MODULE — COMPLETAMENTE AUSENTE**

**Riesgo**: ❌ No se puede monetizar, no se pueden enforcer límites de uso

**Lo que falta**:
- No hay entidad `Subscription`
- No hay `SubscriptionPlan` (STARTER, PROFESSIONAL, ENTERPRISE)
- No hay tracking de uso (seats, casos, API calls)
- No hay `Invoice` ni `Payment`
- No hay flujo de upgrade/downgrade
- No hay integración con proveedores de pago

**Cómo debería verse**:
```
Entidades obligatorias:
- Subscription (firm_id, plan_id, status, auto_renew, next_billing_date, trial_until)
- SubscriptionPlan (name, monthly_price, annual_price, max_users, max_cases, features_array)
- UsageMetric (firm_id, metric_type, period, current_usage, limit) — realtime
- Invoice (subscription_id, amount, due_date, payment_status, paid_at)
- Payment (invoice_id, provider, transaction_id, status, amount)
- BillingEvent (firm_id, event_type: UPGRADE/DOWNGRADE/RENEWAL/TRIAL_EXPIRED)

Endpoints mínimos:
POST   /api/firms/{firmId}/subscription/change-plan
GET    /api/firms/{firmId}/subscription/current
GET    /api/firms/{firmId}/usage
GET    /api/firms/{firmId}/invoices
POST   /api/billing/webhooks/stripe (for payment provider)

Enforcement:
- Pre-check before creating case: if current_usage >= max_cases → reject
- Pre-check before adding user: if seat_count >= max_users → reject
- Rate limit por plan: STARTER = 100 API calls/day, ENTERPRISE = unlimited

Providers a integrar:
- Stripe (primary)
- Mercado Pago (México/LATAM)
```

**Impacto**: Sin esto, no hay SaaS. Es bloqueante.

---

### 2. **FEATURE FLAGS & PROGRESSIVE ROLLOUT — NO EXISTE**

**Riesgo**: ❌ No se puede hacer rollout seguro de features, no se puede A/B test

**Lo que falta**:
- No hay sistema de feature flags
- No hay forma de desactivar módulos por plan
- No hay rollout gradual (10% → 50% → 100%)
- No hay A/B testing

**Cómo debería verse**:
```
Entidad: FeatureFlag
- id, name, description
- is_enabled: BOOLEAN (kill switch)
- enabled_for_percentage: INT (0-100 para rollout gradual)
- enabled_for_plan: ARRAY (qué planes tienen acceso)
- enabled_for_firm_ids: ARRAY (whitelist/blacklist de firmas)
- config: JSONB (settings específicos del feature)
- created_at, updated_at

Ejemplos de usage:
1. Desactivar "AI_INSIGHTS" para plan STARTER:
   enabled_for_plan = ['PROFESSIONAL', 'ENTERPRISE']

2. Rollout gradual de "AUTONOMOUS_MODE":
   enabled_for_percentage = 10 (solo 10% de firmas lo ven)

3. Desactivar feature buggy globalmente:
   is_enabled = false (kill switch)

4. A/B testing de dos versiones de workflow:
   enabled_for_firm_ids = ['firm-a', 'firm-b', ...] (grupo A)
   variante = 'v2' (grupo B usa versión 2)

Servicio: FeatureToggleService
- is_enabled_for_firm(firm_id, feature_name): boolean
- is_enabled_for_user(user_id, feature_name): boolean
- get_feature_config(firm_id, feature_name): dict
- record_variant_impression(firm_id, feature_name, variant): void

Endpoints:
GET    /api/features (listar todos los features disponibles para firm)
PATCH  /api/admin/features/{featureName} (enable/disable/adjust percentage)
```

**Impacto**: Sin esto, cada deploy es riesgoso. Bloqueante para múltiples features.

---

### 3. **PUBLIC API (API KEYS, OAUTH) — PARCIALMENTE FALTA**

**Riesgo**: ❌ No se puede exponer API a terceros, no se puede construir marketplace

**Lo que tiene el documento**: Endpoints genéricos, rate limiting

**Lo que falta**:
- No hay modelo de API Key (para acceso programático)
- No hay OAuth2 spec (para integración con terceros)
- No hay definición de scopes
- No hay rotación de keys
- No hay separación de rate limits (API key vs. usuario autenticado)

**Cómo debería verse**:
```
Entidad: APIKey
- id, firm_id, name, secret_hash (nunca plaintext)
- scope_list: ARRAY ['read_cases', 'write_cases', 'read_documents', 'manage_workflows']
- rate_limit_per_hour: INT (default based on plan)
- created_at, last_used_at, expires_at, is_active
- created_by_user_id, rotated_by_user_id

Endpoints:
POST   /api/api-keys (crear nueva key)
GET    /api/api-keys (listar keys de firm)
DELETE /api/api-keys/{keyId} (revocar key)
POST   /api/api-keys/{keyId}/rotate (generar nueva secret)
PATCH  /api/api-keys/{keyId} (cambiar permisos/rate limit)

OAuth2 Flow (para integrar con terceros como Zapier, Make):
1. Tercero redirige a: /oauth/authorize?client_id=...&scope=read_cases&redirect_uri=...
2. Usuario autoriza
3. Backend redirige a: redirect_uri?code=...
4. Tercero intercambia code por token: POST /oauth/token

Scopes:
- read_cases, write_cases, delete_cases
- read_documents, write_documents, delete_documents
- read_workflows, execute_workflows, approve_workflows
- read_reports, export_reports
- admin (full access)

Rate Limiting:
- Por API key: límite del plan (ej: 10K llamadas/día para PROFESSIONAL)
- Por usuario (UI): 100 req/min
- Por firma: 1000 req/min

Validación de seguridad:
- X-API-Key header o Bearer token en Authorization
- Cada request: verificar que key no haya expirado
- Cada request: verificar scope del endpoint
- Rate limit: trackear por (api_key_id, timestamp)
```

**Impacto**: Sin esto, no hay programmatic access. Importante para integraciones.

---

### 4. **INTEGRATION HUB — COMPLETAMENTE AUSENTE**

**Riesgo**: ❌ Firma está atrapada en Punto Cero, sin poder conectar herramientas existentes

**Lo que falta**:
- No hay entidad para integrations
- No hay OAuth para terceros (Gmail, Outlook, Slack, Teams)
- No hay webhook management
- No hay sincronización bidireccional

**Cómo debería verse**:
```
Entidad: Integration
- id, firm_id, provider_name (enum: SLACK, GMAIL, OUTLOOK, TEAMS, GOOGLE_CALENDAR, etc.)
- is_enabled: BOOLEAN
- auth_token_encrypted: VARCHAR (en Vault, no en DB)
- config: JSONB (provider-specific settings)
- sync_status: VARCHAR (SYNCED, SYNCING, FAILED)
- last_sync_at: TIMESTAMP
- error_message: TEXT (si falló)
- created_at, updated_at

Entidad: IntegrationEvent
- id, integration_id, event_type (ej: message_received, file_shared)
- payload: JSONB (evento original del tercero)
- status: VARCHAR (PENDING, PROCESSED, FAILED)
- retry_count: INT
- next_retry_at: TIMESTAMP
- processed_at: TIMESTAMP
- created_at

Providers a soportar (Priority):
P0 (MVP):
- Slack (enviar notificaciones)
- Gmail (enviar emails)
- Google Calendar (sincronizar deadlines)

P1 (Q2 2026):
- Microsoft Teams (enviar mensajes)
- Outlook (sincronizar calendarios)
- OneDrive (almacenamiento de documentos)

P2 (Q3 2026):
- WhatsApp (notificaciones por WhatsApp)
- Zapier (IFTTT integrations)
- Make (workflow automático)
- DocuSign (e-signature)
- Adobe Sign (e-signature)

Flujo OAuth2 (para Gmail):
1. Usuario va a: /integrations/install/gmail
2. Backend redirige a: https://accounts.google.com/o/oauth2/v2/auth?...
3. Usuario autoriza
4. Gmail redirige a: /integrations/callback/gmail?code=...
5. Backend intercambia code por refresh_token
6. Backend guarda refresh_token en Vault (encrypted)
7. Cada día: refrescar token, usar para sincronizar

Webhook Management (para Slack):
1. Firma instala Slack app
2. Backend obtiene webhook URL del usuario
3. Cuando hay caso nuevo: POST a webhook de Slack
4. Slack muestra notificación en canal
5. Si falla webhook: reintentos exponenciales (1min, 5min, 15min, 1h, etc.)

Endpoints:
GET    /api/integrations (listar integraciones disponibles)
POST   /api/integrations/install/{provider} (iniciar OAuth)
GET    /api/integrations/callback/{provider} (callback)
GET    /api/integrations (listar instaladas)
DELETE /api/integrations/{integrationId} (desinstalar)
POST   /api/integrations/{integrationId}/sync (sincronizar manual)
GET    /api/integrations/{integrationId}/status (estado)

Sincronización Bidireccional (ejemplo: Google Calendar):
- Evento en Punto Cero (caso asignado) → crea calendar event
- Evento en Google Calendar (deadline actualizado) → sincroniza a Punto Cero
- Conflicto: last-write-wins (el más reciente es la verdad)

Auditoria:
- Log: qué integración, qué datos se sincronizaron, cuándo
- Log: fallos de sincronización
- Alert: si sincronización fallando por > 24 horas
```

**Impacto**: Crítico para UX. Sin esto, la firma tiene que entrar a 10 sistemas diferentes.

---

### 5. **AI ENGINE (MENCIONADO PERO VAGO) — 4/10**

**Riesgo**: ⚠️ Vendor lock-in, cost overruns, without fallback

**Lo que tiene**: "Provider-agnostic" mentioned

**Lo que falta**:
- No hay lista explícita de providers (OpenAI, Claude, Gemini, Cohere, Ollama, etc.)
- No hay token/cost tracking
- No hay fallback si provider falla
- No hay model versioning
- No hay prompt versioning
- No hay confidence scoring

**Cómo debería verse**:
```
Entidad: AIProvider
- id, name (enum: OPENAI, CLAUDE, GEMINI, COHERE, OLLAMA, LOCAL_LLAMA)
- api_key_encrypted: VARCHAR (en Vault)
- model_id: VARCHAR (ej: gpt-4, claude-3-opus, gemini-pro)
- cost_per_1k_tokens: DECIMAL (para tracking de costos)
- is_enabled: BOOLEAN
- fallback_provider_id: UUID (qué hacer si falla)
- rate_limit_per_day: INT
- created_at, updated_at

Entidad: PromptTemplate
- id, name, version, content (ej: "Analyze this case for risk: {case_facts}")
- model_target: VARCHAR (para qué model está optimizado)
- temperature: DECIMAL (0-1, creatividad)
- max_tokens: INT
- is_active: BOOLEAN
- created_by_user_id, reviewed_by_user_id
- created_at, updated_at

Entidad: AICost
- id, firm_id, provider, model, input_tokens, output_tokens
- cost_calculated: DECIMAL (costo real)
- date: DATE
- created_at

Service: AIService
- analyze_case(case_id, insight_type): AIInsight
  - Intentar Provider A (OpenAI)
  - Si falla: intentar Provider B (Claude)
  - Si falla: usar heuristics local (no LLM)
  - Grabar todos los intentos en AuditLog

- generate_motion_draft(case_id, template_id): Document
  - Usar prompt_template
  - Usar modelo específico (gpt-4 para tarea legal crítica)
  - Retornar draft + confidence_score

- estimate_cost(insight_type): decimal
  - Basado en estimado de tokens
  - Ej: case analysis ≈ 0.50 USD (OpenAI gpt-4)

Fallback Strategy:
1. Primary provider: OpenAI (gpt-4-turbo)
2. Secondary provider: Claude 3 Opus
3. Tertiary provider: Gemini Pro
4. Final fallback: Local heuristics (no LLM, reglas)
5. If all fail: return error + suggest manual review

Cost Management:
- Track costo por firma, por día
- Alert: si costo diario > umbral (ej: $50/day)
- Cap: si firma llegó a límite mensual, rechazar requests

Model Versioning:
- Cuando OpenAI actualiza gpt-4 → gpt-4-turbo, guardar quién usó qué
- Permite reproducibilidad: "este insight fue generado con gpt-4 v20240101"

Endpoints:
GET    /api/firms/{firmId}/ai/config (qué provider está activo)
GET    /api/firms/{firmId}/ai/insights (listar insights generados)
POST   /api/firms/{firmId}/ai/analyze/case/{caseId} (request analysis)
POST   /api/firms/{firmId}/ai/analyze/workload (workload analysis)
GET    /api/firms/{firmId}/ai/cost-summary (costo acumulado este mes)
PATCH  /api/admin/ai/providers/{providerId} (enable/disable provider)

Ejemplos de insights a generar:
1. Case Risk Analysis: "Este caso tiene 75% probabilidad de ganar basado en X, Y, Z"
2. Workload Analysis: "El abogado Juan está sobrecargado (15 casos). Recomendación: asignar 3 a otro"
3. Motion Draft: "Basado en caso similar, aquí está un borrador de moción"
4. Deadline Alert: "Faltan 5 días para trial. Recomendación: completar discovery ahora"
5. Pattern Detection: "85% de nuestros casos de tipo X se resuelven en 18 meses"
```

**Impacto**: Crítico para diferenciación. Sin esto, no hay "AI" en el producto.

---

### 6. **DOCUMENT STORAGE ABSTRACTION — VAGO**

**Riesgo**: ⚠️ Vendor lock-in a AWS

**Lo que tiene**: "S3/GCS" en campo file_path

**Lo que falta**:
- No hay adapter pattern (no se puede cambiar S3 → GCS sin código)
- No hay multi-cloud DR
- No hay encriptación por documento
- No hay estrategia de versionado en storage

**Cómo debería verse**:
```
Interface: StorageAdapter
- upload(file_id: UUID, content: bytes, metadata: dict) → file_path: str
- download(file_id: UUID) → bytes
- delete(file_id: UUID) → void
- copy_to_backup(file_id: UUID, backup_adapter: StorageAdapter) → void
- list_versions(file_id: UUID) → list[Version]
- get_metadata(file_id: UUID) → dict

Implementaciones:
- S3StorageAdapter (AWS)
- GCSStorageAdapter (Google Cloud)
- AzureStorageAdapter (Microsoft Azure)
- MinIOStorageAdapter (on-premise / private cloud)
- LocalStorageAdapter (testing / development)

Configuración:
primary_provider = S3
backup_provider = GCS
replication_rule = "sync" (cada upload a ambos)

DR Strategy:
- Upload a S3
- Async: copiar a GCS
- Si falla copia: alertar, retry cada hora
- Encryption: AES-256, llaves en KMS (no en bucket)

No exponer en endpoints:
- AWS credentials
- Bucket names
- S3 URLs directas
- GCS URLs directas
→ Siempre dar /api/documents/{docId}/download (backend maneja storage)

Endpoints:
POST   /api/firms/{firmId}/documents/upload (retorna document_id)
GET    /api/firms/{firmId}/documents/{docId}/download
POST   /api/firms/{firmId}/documents/{docId}/backup (replicar manual)
GET    /api/admin/storage/status (health check de storages)

Storage Health Check:
- Cada hora: intentar leer documento aleatorio de cada provider
- Alert: si provider down por > 1 hora
- Failover: si primary down, usar backup
```

**Impacto**: Importante para lock-in prevention y disaster recovery.

---

### 7. **DISASTER RECOVERY & BACKUPS — VAGO**

**Riesgo**: ⚠️ Data loss en incident

**Lo que tiene**: "daily incremental, monthly full backups"

**Lo que falta**:
- No hay RPO (Recovery Point Objective) target
- No hay RTO (Recovery Time Objective) target
- No hay multi-region failover
- No hay procedures documentadas
- No hay testing schedule

**Cómo debería verse**:
```
Política DR:
- RPO: 1 hora (máximo 1 hora de datos perdidos)
- RTO: 4 horas (restaurar dentro de 4 horas)

Backup Strategy:
1. Hourly incremental snapshots → S3 (same region)
2. Daily full snapshot → GCS (different region)
3. Monthly archives → Glacier (7-year retention)
4. All encrypted with KMS keys

Automation:
- Lambda/Cloud Function cada hora: snapshot incremental
- CloudWatch/Cloud Monitoring: verificar éxito
- Alert: si backup > 1 hora de edad (RPO breach)

Monitoring:
- Cloudwatch metric: backup_age_minutes
- Alert: if backup_age > 60 min → page on-call engineer
- Alert: if restore_time > 240 min (4 hours) → escalate

Restore Procedure:
1. Identificar qué restaurar (firma específica? Todo?)
2. Spinup restore database (separate from production)
3. Restaurar from latest backup
4. Validation: checksum verification, row count check
5. Cutover: DNS pointing or data sync
6. Comunicación: notificar stakeholders

Testing:
- Monthly full restore drill (segundo domingo de cada mes)
- Restore a staging environment
- Validate data integrity
- Publish report: restore time, validation result
- Team review post-test

Runbooks:
- How to restore single firm's data (< 1 hour)
- How to restore entire platform (< 4 hours)
- How to verify data integrity post-restore
- How to communicate during incident
- Escalation path (on-call engineer → manager → CTO)

Documentación:
/docs/DISASTER_RECOVERY.md
- RPO/RTO targets
- Backup schedule (hourly/daily/monthly)
- Restore procedures (step-by-step)
- Testing calendar (monthly drills)
- Communication plan
- Infrastructure diagram (primary region + backup region)
```

**Impacto**: Crítico para compliance y customer trust.

---

### 8. **INTERNATIONALIZATION (I18N) — MÍNIMA**

**Riesgo**: ⚠️ No se puede servir firmas fuera de México

**Lo que tiene**: Timezone, currency, language en Preferences

**Lo que falta**:
- No hay entidad Jurisdiction
- No hay tax engine por país
- No hay compliance rules per region
- No hay RTL language support
- No hay date/number formatting per locale
- No hay legal format handling (case numbers, court names)

**Cómo debería verse**:
```
Entidad: Jurisdiction
- id, country_code (MX, US, ES, CO, AR, etc.)
- name, primary_language, default_currency, default_timezone
- tax_rates: JSONB {"VAT": 16, "IVT": 0}  # Mexico-specific
- legal_requirements: JSONB
- compliance_framework: VARCHAR (GDPR, CCPA, LGPD, etc.)
- privacy_policy_required: BOOLEAN
- data_residence_required: VARCHAR (MX, ES, etc.)
- case_number_format: VARCHAR (pattern: "2024-ABC-1234")
- created_at, updated_at

Entidad: LocalizationRule
- jurisdiction_id, rule_type (DATE_FORMAT, NUMBER_FORMAT, TAX_CALCULATION, etc.)
- field_name, format_pattern, validation_regex
- example: case_number in Mexico = YYYY-XXX-NNNN (año-juzgado-secuencial)

Services:
- format_date(date, jurisdiction_code): str
  - MX: "15/01/2026" (DD/MM/YYYY)
  - US: "01/15/2026" (MM/DD/YYYY)

- format_number(number, jurisdiction_code, currency): str
  - MX/ES: "1.234,56 MXN" (. as thousands, , as decimal)
  - US: "1,234.56 USD" (, as thousands, . as decimal)

- calculate_tax(amount, jurisdiction_code, tax_type): decimal
  - MEXICO: tax_type=VAT, rate=16%
  - US: rate varies by state

- validate_tax_id(tax_id, jurisdiction_code): bool
  - MX: RFC format (13 chars)
  - US: EIN format (11 chars)

Configuración:
supported_jurisdictions = [
  {
    code: "MX",
    name: "México",
    language: "es",
    currency: "MXN",
    timezone: "America/Mexico_City",
    vat_rate: 16,
    case_number_format: "YYYY-JJ-NNNN",
    gdpr_required: false,
    ccpa_required: false
  },
  {
    code: "US",
    name: "United States",
    language: "en",
    currency: "USD",
    timezone: "America/New_York",
    vat_rate: 0,  # No VAT, state sales tax instead
    case_number_format: "STATE-COUNTY-NNNNNN",
    gdpr_required: false,
    ccpa_required: true
  },
  ...
]

Endpoints:
GET    /api/jurisdictions (listar todas)
GET    /api/jurisdictions/{code} (detalles)
GET    /api/jurisdictions/{code}/compliance (qué reglas aplican)
GET    /api/jurisdictions/{code}/tax-rates (tasas de impuesto)
GET    /api/jurisdictions/{code}/case-number-format (formato de número de caso)

Uso en UI:
- Cuando firma selecciona jurisdicción: cargar compliance checklist
- Cuando crear caso: auto-formatear número de caso
- Cuando generar invoice: aplicar tax rate correcto
- Cuando formatear fechas: usar formato local
```

**Impacto**: Crítico para expansión regional.

---

## ⚠️ BRECHA IMPORTANTE (Debería añadirse Pronto)

### 1. **Escalabilidad Sin Rediseño**

**Pregunta**: ¿Escala a 10K firmas, 100K abogados, 1M casos?

**Riesgo**: Degradación de performance después de scale

**Recomendación**:
```
Database:
- Audit logs → TimescaleDB (not PostgreSQL) para time-series
- Use PostgreSQL partitioning: audit logs by month
- Archive old logs (> 1 year) to Glacier monthly

Indexes:
- (firm_id, created_at DESC) on all audit tables
- (firm_id, status, priority) on case
- Composite for common queries: (firm_id, assigned_lawyer_id, status)

Caching:
- User permissions: Redis, TTL 15 min, invalidate on role change
- Firm settings: Redis, TTL 1 hour
- Case search: Redis, TTL 5 min

Connection pooling:
- PgBouncer or pgpool-II
- 100 connections per server
- Prepared statements cached

Query limits:
- Max page size: 1000 rows
- Timeout: 30 seconds
- Cursor-based pagination for large result sets
```

### 2. **API Versioning (Section 9.2 vago)**

**Recomendación**:
```
Deprecation pattern:
- Deprecation header: X-Deprecation-Notice: "field 'case_owner' deprecated 2026-06-01, use 'assigned_lawyer_id'"
- Changelog: /docs/API_CHANGELOG.md
- Support: current + previous 2 versions (12-month window)

Breaking changes:
- Require /api/v2 for changes that break clients
- Document migration guide per breaking change
- Grandfather existing API clients (grandfathered_until date)
```

### 3. **Plugin/Extension Architecture**

**Recomendación**:
```
Plugin types:
- Workflow step plugins (custom step types)
- Automation action plugins
- Report plugins (custom dashboard widgets)
- Document template plugins
- AI analysis plugins

Plugin sandbox:
- Plugins run isolated (no access to all firm data)
- Explicit permission model (audit_log_read, case_read, etc.)
- Hooks available: on_case_created, on_workflow_completed, etc.

Plugin marketplace:
- Vendors build plugins
- Firms install from marketplace or upload custom
- Track which plugin accessed which data

Example: Custom motion generator
- Hook: on_workflow_step_assigned
- Trigger: if step.type == "draft_motion"
- Action: call plugin.generate_motion(case_id)
- Result: create document from output
```

---

## 💡 NICE-TO-HAVE (Puede Agregarse Después)

1. **Advanced Caching** — Cache coherency, TTL optimization
2. **Predictive Analytics** — Success rates por lawyer/tipo de caso
3. **Anomaly Detection** — Unusual billing, unauthorized access
4. **Client Portal** — Document sharing con clientes
5. **Legal Integrations** — LexisNexis, Bloomberg Law, bar verification
6. **Advanced Reports** — Scheduling, email delivery, custom widgets

---

## 🏗️ RECOMENDACIONES CONCRETAS

### Antes de Iniciar Desarrollo (Próximos 30 Días)

#### Semana 1-2: Diseñar Módulos Críticos
```
Tareas:
- [ ] BILLING_ARCHITECTURE.md (entidades, endpoints, flujos de pago)
- [ ] PUBLIC_API_DESIGN.md (API keys, OAuth2, scopes)
- [ ] FEATURE_FLAGS_DESIGN.md (kill switches, rollout gradual, A/B testing)
- [ ] INTEGRATION_HUB_DESIGN.md (providers, OAuth flow, webhook management)

Ownership:
- Billing: Product Manager + Backend Lead (5 días)
- Public API: Backend Architect (3 días)
- Feature Flags: Backend + DevOps (2 días)
- Integrations: Backend Architect (5 días)

Entregable: 4 documentos de diseño detallados
```

#### Semana 3: Revisión de Seguridad
```
Tareas:
- [ ] Security audit: encryption, secret management, audit logging
- [ ] Definir key rotation policy (freq: 90 días, quién)
- [ ] Definir secret management (Vault vs. AWS Secrets)
- [ ] Definir penetration testing schedule (quarterly)

Ownership:
- Security: Security Engineer + CTO (3 días)

Entregable: SECURITY_POLICIES.md
```

#### Semana 4: Planning & Validación
```
Tareas:
- [ ] Finalizar roadmap implementation (ahora: 40 semanas → 50+ con adiciones)
- [ ] Resource planning (2-3 engineers → 3-4 needed)
- [ ] Dependency planning (quién construye qué en paralelo)
- [ ] Infrastructure planning (PostgreSQL size, Redis nodes, S3 buckets)

Ownership:
- Engineering Manager + CTO (2 días)

Entregable: Updated IMPLEMENTATION_ROADMAP.md + resource allocation
```

### Documentos Obligatorios Antes de Phase 1

Estos **DEBEN** completarse y aprobarse antes de escribir una línea de código backend:

```
1. BILLING_ARCHITECTURE.md
   - Entidades: Subscription, SubscriptionPlan, UsageMetric, Invoice, Payment
   - Endpoints: 5+ (subscription management)
   - Payment flow diagram
   - Enforcement de límites

2. PUBLIC_API_DESIGN.md
   - Entidad: APIKey
   - OAuth2 spec
   - Scope definitions
   - Rate limiting strategy
   - 10+ endpoints

3. FEATURE_FLAGS_DESIGN.md
   - Entidad: FeatureFlag
   - Service: FeatureToggleService
   - Kill switch pattern
   - Gradual rollout (10% → 100%)
   - A/B testing support

4. INTEGRATION_HUB_DESIGN.md
   - Entidades: Integration, IntegrationEvent
   - Providers (Slack, Gmail, Teams, etc.)
   - OAuth2 flow per provider
   - Webhook management
   - Sync strategy (bidirectional)

5. AI_ENGINE_DETAILED.md
   - Entidades: AIProvider, PromptTemplate, AICost
   - Provider list (OpenAI, Claude, Gemini, local)
   - Fallback strategy
   - Cost tracking
   - Model versioning

6. STORAGE_ADAPTER_PATTERN.md
   - Interface: StorageAdapter
   - Implementaciones (S3, GCS, Azure, MinIO)
   - Multi-cloud DR
   - No credential exposure

7. DISASTER_RECOVERY.md
   - RPO: 1 hora, RTO: 4 horas
   - Backup schedule (hourly/daily/monthly)
   - Restore procedures
   - Testing calendar (monthly drills)
   - Runbooks por scenario

8. INTERNATIONALIZATION.md
   - Entidad: Jurisdiction, LocalizationRule
   - Jurisdicciones soportadas (MX, US, ES, CO, AR, etc.)
   - Tax engines per country
   - Compliance rules per region
   - Case number formats

9. SECURITY_POLICIES.md
   - Secret management (Vault, AWS Secrets)
   - Key rotation (90 días)
   - Penetration testing (quarterly)
   - Data classification (4 levels)
   - Incident response plan

10. SCALABILITY_BLUEPRINT.md
    - Database: partitioning, sharding, archival
    - Caching: invalidation patterns, TTLs
    - Connection pooling
    - Query limits
    - Monitoring & alerting

```

---

## 📊 VEREDICTO FINAL

### Evaluación Resumida

| Dimensión | Calificación | Veredicto |
|-----------|-------------|----------|
| Fundación (multi-tenancy, RBAC, data model) | 8/10 | ✅ Excelente |
| Governance & Auditoría | 8/10 | ✅ Excelente |
| Seguridad Base | 6/10 | ⚠️ Bueno, necesita profundidad |
| **Billing & Monetización** | 0/10 | 🔴 CRÍTICO |
| **Feature Flags** | 0/10 | 🔴 CRÍTICO |
| **Public API** | 2/10 | 🔴 CRÍTICO |
| **Integration Hub** | 0/10 | 🔴 CRÍTICO |
| AI Engine | 4/10 | 🔴 Necesita detalle |
| Storage Abstraction | 3/10 | 🔴 Necesita patrón |
| Disaster Recovery | 2/10 | 🔴 Necesita targets + procedures |
| Internationalization | 2/10 | 🔴 Mínima |
| Escalabilidad | 5/10 | ⚠️ Incertidumbre |

---

## 🎯 RECOMENDACIÓN FINAL

### ¿Puede convertirse en la Constitución Técnica de Punto Cero Legal?

**RESPUESTA: NO — AÚN NO. 60% COMPLETA, 40% CRÍTICO FALTANTE.**

---

### Aprobación Condicional: ✅ SÍ, CON CONDICIONES

**Este documento ES una excelente base arquitectónica** que salvará meses de diseño descendente.

**PERO requiere:**
1. ✅ 10 documentos de diseño adicionales (ver arriba)
2. ✅ Revisión de seguridad/compliance externo
3. ✅ Validación de escalabilidad (proof-of-concept con 100K firmas simuladas)
4. ✅ Roadmap extendido (40 semanas → 50+ semanas)
5. ✅ Planning de recursos (2-3 engineers → 3-4 needed)

---

### Timeline Sugerido

**Fase 0 — Design & Planning (4 semanas, sin código)**
- Completar 10 documentos de diseño
- Revisión de seguridad/compliance
- Finalizar resource plan
- **Gate**: Todos los documentos aprobados antes de Phase 1

**Fase 1-10 — Implementation (40 semanas + 10 semanas for new modules = 50 semanas)**
- Phase 1: Infrastructure (auth, RBAC, core data)
- Phase 2: Case management + documents
- Phase 3-5: Workflows, automation, governance
- **Phase 0.5** (NEW): Billing + Feature Flags (weeks 2-3 de Phase 1)
- **Phase 6** (EXPANDED): AI Engine (weeks 5-8)
- **Phase 7** (NEW): Integration Hub (weeks 9-12)
- Phase 8-9: Notifications, Dashboard
- Phase 10: Performance + Polish

---

## ✍️ VOTO FINAL

| Aspecto | Veredicto |
|---------|-----------|
| **Arquitectura Base** | ✅ Aprobada (excelente) |
| **Completitud** | ❌ Incompleta (falta 40%) |
| **Producción** | ❌ NO LISTA (críticos ausentes) |
| **Constitución Técnica** | ❌ NO AÚN (necesita adiciones) |
| **Recomendación** | ✅ APROBADA CON CONDICIONES |

---

### Próximos Pasos

1. **Semana 1**: Crear 10 documentos de diseño (en paralelo)
2. **Semana 3**: Security + compliance review
3. **Semana 4**: Final planning + gate approval
4. **Semana 5+**: Begin Phase 0.5 (Billing + Feature Flags) + Phase 1 (Backend core)

---

**Documento**: ARCHITECTURE_REVIEW_FINAL_VERDICT.md  
**Estado**: ✅ READY FOR DECISION  
**Próximo**: Esperar aprobación de CTO + PO para proceder con Phase 0 design

