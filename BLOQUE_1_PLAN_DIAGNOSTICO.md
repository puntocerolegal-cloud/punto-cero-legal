# BLOQUE 1 — INFRAESTRUCTURA BASE
## Plan de Diagnóstico Sistemático

**Objetivo:** Certificar funcionamiento de servicios críticos  
**Restricción:** Solo diagnosticar y corregir bloqueadores. CERO cambios en UI/CSS/React  
**Fecha:** 4 de Julio, 2026

---

## ESTADO INICIAL VERIFICADO

✅ **Confirmado en inspección:**
```
FALLBACK_DB = True (línea 137 de server.py)
→ MongoDB NO conectado
→ InMemoryDB activo (datos NO persisten)
```

---

## PLAN DE DIAGNÓSTICO

### 1️⃣ MongoDB — Diagnóstico Completo

#### Verificar:
- [ ] Conexión a MongoDB
- [ ] Colecciones existentes y su estructura
- [ ] Índices creados
- [ ] Relaciones ObjectId
- [ ] Foreign keys lógicas (firm_id, owner_id, lawyer_id)

#### Evidencia requerida:
```
✅ MongoDB conectado: SÍ/NO
   Si NO → causa raíz
   
✅ Colecciones: [lista]
✅ Documentos por colección: [tabla]
✅ Índices: [cantidad y estado]
✅ Relaciones intactas: SÍ/NO
```

---

### 2️⃣ Autenticación — Flujo Jerárquico

#### Verificar cascada:
```
Admin Login → ✅/❌
  ↓
Firma Login → ✅/❌
  ↓
Abogado Login → ✅/❌
  ↓
Cliente Login → ✅/❌
```

#### Para cada rol:
- [ ] Registro funciona
- [ ] Login funciona
- [ ] JWT generado y válido
- [ ] Refresh token existe
- [ ] Roles asignados correctamente
- [ ] Permissions configurados
- [ ] RBAC middleware valida
- [ ] Tenant isolation activo

#### Evidencia:
```
[Tabla con 4 filas (Admin/Firma/Abogado/Cliente)]
Rol | Registro | Login | JWT | Refresh | RBAC | Tenant
```

---

### 3️⃣ Multiempresa — Aislamiento de Datos

#### Verificar:
- [ ] Empresa A vs Empresa B NO ven datos mutuamente
- [ ] firm_id en cada documento
- [ ] Queries filtran por firm_id correctamente
- [ ] Abogados de Empresa A NO ven casos de Empresa B
- [ ] Clientes aislados por empresa
- [ ] Documentos aislados por empresa
- [ ] Facturación aislada

#### Test concreto:
```
Empresa A → Admin crea Caso X
Empresa B → Admin INTENTA ver Caso X
Resultado: ❌ Acceso denegado / ✅ Ve los datos (FALLO)
```

---

### 4️⃣ FirmID — Flujo Completo

#### Cascade obligatorio:
```
1. Landing Page
   ↓
2. Registro de Firma (form)
   ↓
3. Crear usuario firm_owner
   ↓
4. Crear firma en BD
   ↓
5. Admin aprueba firma
   ↓
6. Asignar firm_id a usuario
   ↓
7. Login firm_owner
   ↓
8. Dashboard carga
   ↓
9. Crear abogados
   ↓
10. Crear oficinas
   ↓
11. Crear departamentos
   ↓
12. Crear casos
   ↓
13. Crear clientes
```

#### Evidencia por paso:
```
Paso | Resultado | Error | Solución
1    | ✅        | -     | -
2    | ❌        | Form no valida teléfono | Validar regex
3    | ✅        | -     | -
...
```

---

### 5️⃣ Variables de Entorno — Auditoría Completa

#### Verificar TODAS (no solo IA):

**Críticas:**
- [ ] MONGO_URL
- [ ] DB_NAME
- [ ] SECRET_KEY
- [ ] CORS_ORIGINS
- [ ] APP_PUBLIC_URL

**IA:**
- [ ] GEMINI_API_KEY
- [ ] GEMINI_MODEL
- [ ] ANTHROPIC_API_KEY

**Email:**
- [ ] SMTP_HOST
- [ ] SMTP_PORT
- [ ] SMTP_USER
- [ ] SMTP_PASS
- [ ] SMTP_FROM

**Google:**
- [ ] GOOGLE_SERVICE_ACCOUNT_JSON
- [ ] GOOGLE_DRIVE_FOLDER_ID

**Meta/WhatsApp:**
- [ ] META_APP_ID
- [ ] META_APP_SECRET
- [ ] META_PHONE_NUMBER_ID
- [ ] META_ACCESS_TOKEN
- [ ] META_VERIFY_TOKEN

**Pagos:**
- [ ] MP_ACCESS_TOKEN

**Otros:**
- [ ] TWILIO_ACCOUNT_SID
- [ ] TWILIO_AUTH_TOKEN

#### Tabla de resultado:
```
Variable | Estado | Tipo | Impacto
MONGO_URL | ❌ Placeholder | Config | Crítico
SECRET_KEY | ❌ Placeholder | Config | Alto
GEMINI_API_KEY | ❌ Placeholder | Config | Alto
SMTP_USER | ❌ Placeholder | Config | Medio
```

---

### 6️⃣ APIs — Clasificación de 337 Operaciones

#### Endpoints a clasificar:
- GET / POST / PUT / PATCH / DELETE
- Por código: 200, 201, 400, 401, 403, 404, 422, 500, 503

#### Resultado esperado:
```
Ruta | Método | Esperado | Actual | Status
/api/auth/register | POST | 201 | 201 | ✅
/api/auth/login | POST | 200 | 200 | ✅
/api/cases | GET | 200 | 200 | ✅
/api/cases | POST | 201 | 201 | ✅
/api/ai/chat | POST | 200 | 503 | ❌
...
```

---

### 7️⃣ Persistencia — Ciclo Completo

#### Test:
```
1. Crear usuario
   ↓
2. Editar usuario
   ↓
3. Consultar usuario (confirma datos editados)
   ↓
4. Reiniciar backend
   ↓
5. Consultar usuario nuevamente
   → ✅ Datos persisten / ❌ Datos perdidos
```

#### Repetir para:
- [ ] Users
- [ ] Firms
- [ ] Cases
- [ ] Clients
- [ ] Documents
- [ ] Invoices

---

### 8️⃣ Seguridad — 9 Aspectos

#### Verificar:
- [ ] JWT generado correctamente
- [ ] JWT expira después de N minutos
- [ ] Refresh token renueva JWT
- [ ] RBAC bloquea accesos no autorizados
- [ ] Tenant isolation previene data leakage
- [ ] CORS solo permite origins configurados
- [ ] Headers de seguridad presentes (X-Content-Type-Options, etc.)
- [ ] Rate limiting implementado
- [ ] Expiración de tokens funciona

#### Test concreto:
```
Admin login → obtiene JWT
Esperar 1 hora → intenta usar JWT
Resultado: ❌ 401 Unauthorized (correcto) / ✅ Funciona (FALLO)
```

---

### 9️⃣ IA — Diagnóstico sin Arreglarlo

#### Preguntas a responder:
1. ¿Está lista? NO (sin credenciales)
2. ¿Qué falta? GEMINI_API_KEY, ANTHROPIC_API_KEY
3. ¿Cuáles endpoints funcionan? NINGUNO (503)
4. ¿Cuáles no? Todos (/api/ai/*)
5. ¿Por qué? Sin credenciales API válidas

#### Clasificación:
```
Endpoint | Status | Motivo
/api/ai/chat | 503 | Sin GEMINI_API_KEY
/api/ai/usage | 200 | Funciona (no requiere IA)
/api/chatbot | 503 | Requiere Claude/Gemini
```

---

### 🔟 Tabla de Resultado Final

```
COMPONENTE          | % FUNCIONAL | STATUS
────────────────────┼─────────────┼──────────────
MongoDB             | 0%          | ❌ No conectado
Autenticación       | ?           | 🔍 A verificar
RBAC                | ?           | 🔍 A verificar
Multiempresa        | ?           | 🔍 A verificar
FirmID Flow         | ?           | 🔍 A verificar
Persistencia        | 0%          | ❌ InMemory
API (337 ops)       | ?           | 🔍 A verificar
Variables env       | 5%          | ❌ 95% placeholder
IA                  | 0%          | ❌ Sin credenciales
Servicios externos  | 0%          | ❌ Sin credenciales
────────────────────┴─────────────┴──────────────
TOTAL               | ~10%        | 🔴 NO APTO
```

---

## TABLA PRIORIDADES (Sera completada con diagnóstico)

```
Prioridad | Problema | Impacto | Tiempo Estimado
──────────┼──────────┼─────────┼─────────────────
P0        | (A determinar)
P1        | (A determinar)
P2        | (A determinar)
```

---

## PRÓXIMO PASO

**Comenzar diagnóstico de MongoDB (punto 1️⃣)**

