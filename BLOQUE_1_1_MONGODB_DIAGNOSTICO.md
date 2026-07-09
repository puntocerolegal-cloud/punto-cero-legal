# BLOQUE 1.1 — MongoDB Diagnóstico Exhaustivo

**Objetivo:** Certificar estado completo de base de datos  
**Estado Actual:** InMemoryDB (fallback activo)  
**Fecha:** 4 de Julio, 2026

---

## DIAGNÓSTICO DE CONECTIVIDAD

### Verificación Actual

```
backend/server.py línea 120-138:
  MONGO_URL = mongodb://localhost:27017 (template)
  ↓
  Intenta conectar con timeout 5s
  ↓
  FALLA (MongoDB no está ejecutándose)
  ↓
  create_fallback_db()
  ↓
  FALLBACK_DB = True
  ↓
  InMemoryDB activo
```

### Estado: ❌ MongoDB NO CONECTADO

**Causa raíz:** MongoDB no está levantado en localhost:27017 (o no está instalado)

**Impacto:**
```
✅ Backend funciona (con InMemoryDB)
✅ Endpoints responden 200
❌ Persistencia: CERO (datos se pierden en restart)
❌ Multi-usuario: NO sincroniza datos
❌ Índices: NO se crean
❌ Validaciones: NO se aplican
❌ Queries complejas: NO funcionan
```

---

## COLECCIONES ESPERADAS

Del análisis de modelos y código, el sistema espera estas colecciones:

### Administrativas (6)
1. **users** (Admin, Firm Owner, Lawyer, Client)
2. **firms** (Firmas jurídicas)
3. **organizations** (Organizaciones / Tenants)
4. **rbac** (Roles y permisos)
5. **audit_logs** (Auditoría)
6. **global_config** (Configuración global)

### Operacionales (6)
7. **cases** (Casos jurídicos)
8. **clients** (Clientes)
9. **leads** (Prospectos)
10. **documents** (Documentos)
11. **expedientes** (Expedientes)
12. **case_activity** (Timeline de casos)

### Comunicación (5)
13. **meetings** (Reuniones)
14. **appointments** (Citas)
15. **messages** (Mensajes)
16. **timeline** (Timeline eventos)
17. **notifications** (Notificaciones)

### Comercial (7)
18. **subscriptions** (Suscripciones de usuarios)
19. **os_subscription** (Suscripciones de Firm OS)
20. **invoices** (Facturas)
21. **transactions** (Transacciones de pago)
22. **refunds** (Reembolsos)
23. **chargebacks** (Chargebacks)
24. **billing** (Facturación multi-tenant)

### IA (3)
25. **ai_usage** (Conteo mensual de uso IA)
26. **ai_chat_history** (Historial de chats)
27. **ai_prompts** (Templates de prompts)

### Integraciones (4)
28. **webhook_events** (Eventos webhook)
29. **webhook_logs** (Logs de webhooks)
30. **receipts** (Recibos de pago manual)
31. **implementation** (Implementaciones)

### Enterprise (6)
32. **firm_lawyers** (Abogados de firma)
33. **firm_clients** (Clientes de firma)
34. **firm_cases** (Casos de firma)
35. **firm_config** (Config de firma)
36. **departments** (Departamentos)
37. **offices** (Oficinas)

**Total:** 37 colecciones esperadas

---

## ÍNDICES ESPERADOS

Del análisis de `server.py` líneas 260-305:

### Índices de Transacciones
```
transactions:
  ✅ payment_id (unique)
  ✅ user_email
  ✅ status
  ✅ created_at
  ✅ plan_id
  ✅ type
```

### Índices de Usuarios
```
users:
  ✅ email (unique)
  ✅ plan_id
  ✅ subscription_status
  ✅ created_at
```

### Índices de Recibos
```
receipts:
  ✅ user_id
  ✅ status
  ✅ created_at
```

### Índices de Auditoría
```
audit_logs:
  ✅ action
  ✅ created_at
```

### Índices de Webhooks
```
webhook_events:
  ✅ event_id (unique)
  ✅ type
  ✅ processed
  ✅ created_at

webhook_logs:
  ✅ event_id
  ✅ type
  ✅ result_status
  ✅ created_at
```

### Índices de Reembolsos/Chargebacks
```
refunds:
  ✅ refund_id (unique)
  ✅ payment_id
  ✅ created_at

chargebacks:
  ✅ chargeback_id (unique)
  ✅ payment_id
  ✅ created_at
```

**Total:** 24 índices esperados

---

## RELACIONES DE DATOS (Foreign Keys Lógicas)

### Jerarquía User-Firm-Abogado

```
users (Admin)
  └─ organizations (multi-tenant)
       └─ users (Firm Owner)
            └─ firms
                 ├─ users (firm_lawyer)
                 ├─ firm_clients
                 ├─ firm_cases
                 ├─ departments
                 └─ offices
                      └─ users (abogados en oficina)
```

### Verificación de Campos Críticos

**Documento User:**
```javascript
{
  _id: ObjectId,
  email: String (UNIQUE),
  role: Enum ["admin", "firm_owner", "firm_lawyer", "lawyer", "client"],
  firm_id: ObjectId (referencia a firms),
  organizationId: ObjectId (referencia a organizations),
  status: Enum ["ACTIVE", "PENDING_VERIFICATION", "SUSPENDED"],
  is_verified: Boolean
}
```

**Documento Firm:**
```javascript
{
  _id: ObjectId,
  name: String,
  owner_id: ObjectId (referencia a users),
  owner_email: String,
  status: Enum ["ACTIVE", "PENDING_VERIFICATION", "SUSPENDED"],
  plan: Enum ["firm_growth", "firm_enterprise"],
  max_lawyers: Number
}
```

**Documento Case:**
```javascript
{
  _id: ObjectId,
  lawyer_id: ObjectId (referencia a users),
  client_id: ObjectId (referencia a clients),
  firm_id: ObjectId (referencia a firms) - ← CRÍTICO PARA MULTI-EMPRESA
  status: Enum ["open", "in_progress", "closed", "archived"]
}
```

**Documento Document:**
```javascript
{
  _id: ObjectId,
  case_id: ObjectId (referencia a cases),
  lawyer_id: ObjectId (referencia a users),
  firm_id: ObjectId (referencia a firms) - ← CRÍTICO
}
```

---

## TESTING DE REFERENCIAS

### Test de Integridad ObjectId

**Paso 1: Crear estructura mínima**
```javascript
// Si MongoDB está conectado, ejecutar:
db.users.insertOne({
  _id: ObjectId(),
  email: "test@example.com",
  role: "admin"
})

db.firms.insertOne({
  _id: ObjectId(),
  name: "Test Firm",
  owner_id: db.users.findOne().\_id
})

db.cases.insertOne({
  _id: ObjectId(),
  lawyer_id: db.users.findOne().\_id,
  firm_id: db.firms.findOne().\_id
})
```

**Paso 2: Validar referencias**
```javascript
db.cases.findOne()
// Esperado: lawyer_id y firm_id contienen ObjectId válidos
// Actual: (a completar con ejecución real)
```

---

## ESTADO ACTUAL (EN MEMORIA)

### Datos Presentes en InMemoryDB

Del análisis de `server.py` líneas 92-116:

```python
fallback_db.users.insert_one_sync({
    "email": "admin@puntocerolegal.com",
    "password_hash": "<bcrypt hash>",
    "full_name": "Admin Principal",
    "role": "admin",
    "status": "ACTIVE",
    "is_verified": True
})
```

**Usuarios en fallback:**
```
✅ admin@puntocerolegal.com (admin)
```

**Datos que SE PIERDEN en restart:**
```
❌ Cualquier usuario creado después del startup
❌ Cualquier firma creada
❌ Cualquier caso creado
❌ Cualquier documento subido
❌ Cualquier factura creada
```

---

## SOLUCIÓN: CONFIGURAR MONGODB

### Opción A: MongoDB Local

**Instalación (macOS):**
```bash
brew install mongodb-community
brew services start mongodb-community

# Verificar conexión
mongosh --eval "db.adminCommand('ping')"
# Esperado: { ok: 1 }
```

**Instalación (Linux):**
```bash
sudo apt-get install mongodb
sudo systemctl start mongod

# Verificar
mongosh --eval "db.adminCommand('ping')"
```

**Instalación (Windows):**
```bash
# Descargar desde: https://www.mongodb.com/try/download/community
# Instalar MSI
# Services → MongoDB se inicia automáticamente

# Verificar
mongosh --eval "db.adminCommand('ping')"
```

**Actualizar backend/.env:**
```bash
MONGO_URL=mongodb://localhost:27017
DB_NAME=puntocero_legal
```

### Opción B: MongoDB Atlas (Recomendado para Producción)

**Pasos:**
1. https://www.mongodb.com/cloud/atlas
2. Sign up → Create Free Account
3. Create cluster (M0 tier, free)
4. Whitelist IP (0.0.0.0/0 para desarrollo)
5. Database User → Create user
6. Connection string → Copy

**Actualizar backend/.env:**
```bash
MONGO_URL=mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/puntocero_legal?retryWrites=true&w=majority
DB_NAME=puntocero_legal
```

### Opción C: Docker

```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest

# Connection string:
# mongodb://admin:password@localhost:27017/puntocero_legal?authSource=admin
```

---

## VERIFICACIÓN POST-CONEXIÓN

Una vez conectado MongoDB, ejecutar:

```bash
# 1. Verificar conexión
mongosh --eval "db.adminCommand('ping')"

# 2. Iniciar backend (se crearán índices automáticamente)
cd backend && python server.py

# 3. Ejecutar seed (población de datos)
python backend/seeds/02_seed_firms.py

# 4. Verificar colecciones
mongosh puntocero_legal --eval "db.getCollectionNames()"
# Esperado: [users, firms, cases, ...]

# 5. Verificar índices
mongosh puntocero_legal --eval "db.users.getIndexes()"
# Esperado: 4+ índices

# 6. Verificar documentos
mongosh puntocero_legal --eval "db.users.countDocuments()"
# Esperado: > 0
```

---

## CHECKLIST MONGODB

- [ ] MongoDB instalado y ejecutándose
- [ ] Conexión desde mongosh exitosa
- [ ] backend/.env actualizado con MONGO_URL
- [ ] Backend inicia sin errores
- [ ] Índices creados automáticamente
- [ ] Datos persisten después de restart
- [ ] Multi-usuario sincroniza datos
- [ ] Queries complejas funcionan

---

## ESTIMACIÓN DE TIEMPO

| Tarea | Tiempo |
|-------|--------|
| Instalar MongoDB | 10-30 min |
| Configurar .env | 5 min |
| Ejecutar seed | 2 min |
| Validar índices | 5 min |
| **Total** | **25-45 min** |

**Status:** 🔴 BLOQUEADOR CRÍTICO - Requiere resolución inmediata

