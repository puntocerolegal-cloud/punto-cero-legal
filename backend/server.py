from fastapi import FastAPI, APIRouter
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

# Import routes
from routes import auth, leads, cases, meetings, appointments, messages, dashboard, ai, admin, payment, referrals, admin_ops, public_intake, accounting, clients, invoices, documents, portal, backup, chatbot, organizations, partners, implementations, subscriptions, billing, analytics, integration, admin_master, commissions, timeline, firm_management, sales_analytics, ai_operations, financial, ai_autopilot, autonomous, global_network, legal_os, firms, firm_config, rbac, team, users, firm_os, billing_admin, onboarding

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging FIRST (before any logger usage)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
FALLBACK_DB = False

class InMemoryCollection:
    def __init__(self):
        self._documents = []
        self._next_id = 1

    async def find_one(self, query):
        for doc in self._documents:
            if all(doc.get(k) == v for k, v in query.items()):
                return doc
        return None

    async def insert_one(self, document):
        return self.insert_one_sync(document)

    def insert_one_sync(self, document):
        if '_id' not in document:
            document['_id'] = str(self._next_id)
            self._next_id += 1
        self._documents.append(document)
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(document['_id'])

    async def update_one(self, query, update, upsert=False):
        found = await self.find_one(query)
        if found:
            if '$set' in update:
                for key, value in update['$set'].items():
                    found[key] = value
            return type('UpdateResult', (), {'matched_count': 1, 'modified_count': 1})()
        if upsert:
            doc = query.copy()
            if '$set' in update:
                doc.update(update['$set'])
            return await self.insert_one(doc)
        return type('UpdateResult', (), {'matched_count': 0, 'modified_count': 0})()

    async def create_index(self, *args, **kwargs):
        return None

    async def delete_one(self, query):
        for index, doc in enumerate(self._documents):
            if all(doc.get(k) == v for k, v in query.items()):
                self._documents.pop(index)
                return type('DeleteResult', (), {'deleted_count': 1})()
        return type('DeleteResult', (), {'deleted_count': 0})()

class InMemoryDB:
    def __init__(self):
        self.users = InMemoryCollection()
        self._collections = {'users': self.users}
        self.is_fallback = True

    async def command(self, command_name, *args, **kwargs):
        if command_name == 'ping':
            return {'ok': 1}
        return {'ok': 1}

    def __getattr__(self, name):
        if name in self._collections:
            return self._collections[name]
        coll = InMemoryCollection()
        self._collections[name] = coll
        return coll


def create_fallback_db():
    fallback_db = InMemoryDB()
    try:
        from passlib.context import CryptContext
        from datetime import datetime

        pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
        password_hash = pwd_context.hash('Admin2025!')
        fallback_user = {
            '_id': 'fallback_admin',
            'email': 'admin@puntocerolegal.com',
            'password_hash': password_hash,
            'full_name': 'Fallback Admin',
            'role': 'admin_general',
            'status': 'ACTIVE',
            'is_verified': True,
            'requires_password_change': False,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
        }

        fallback_db.users.insert_one_sync(fallback_user)
    except Exception as exc:
        logger.warning(f"No se pudo crear usuario fallback en memoria: {exc}")
    return fallback_db

# MongoDB connection with graceful fallback
try:
    mongo_url = os.environ.get('MONGO_URL')
    if not mongo_url:
        logger.warning("MONGO_URL not set, using local fallback")
        mongo_url = "mongodb://localhost:27017"

    client = AsyncIOMotorClient(
        mongo_url,
        serverSelectionTimeoutMS=5000,  # 5 second timeout
        connectTimeoutMS=5000,
        retryWrites=False  # Disable retries to fail fast in dev
    )
    db = client[os.environ.get('DB_NAME', 'puntocero_legal')]
    logger.info("MongoDB client initialized")
except Exception as e:
    logger.error(f"MongoDB initialization failed: {e}")
    client = None
    db = create_fallback_db()
    FALLBACK_DB = True
    logger.warning("Usando modo degradado: fallback en memoria activo")

# Create the main app without a prefix
app = FastAPI(title="Punto Cero Legal API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Health check endpoints
@api_router.get("/")
async def root():
    # v2 - Force Render redeploy
    return {"message": "Punto Cero Legal API - Running", "status": "healthy"}

@api_router.get("/health")
async def health_check():
    """Health check that always returns 200 to prevent Render timeouts."""
    db_status = "disconnected"
    try:
        if db is not None:
            # Non-blocking ping with timeout
            await db.command('ping')
            db_status = "connected"
    except Exception as e:
        logger.warning(f"DB ping failed during health check: {e}")
        # Still return 200 - app is alive even if DB is temporarily down

    return {
        "status": "healthy",
        "database": db_status,
        "version": "1.0.0"
    }

# Include all module routers
api_router.include_router(auth.router)
api_router.include_router(leads.router)
api_router.include_router(cases.router)
api_router.include_router(meetings.router)
api_router.include_router(appointments.router)
api_router.include_router(messages.router)
api_router.include_router(dashboard.router)
api_router.include_router(ai.router)
api_router.include_router(admin.router)
api_router.include_router(payment.router)
api_router.include_router(referrals.router)
api_router.include_router(admin_ops.router)
api_router.include_router(public_intake.router)
api_router.include_router(accounting.router)
api_router.include_router(clients.router)
api_router.include_router(invoices.router)
api_router.include_router(documents.router)
api_router.include_router(portal.router)
api_router.include_router(backup.router)
api_router.include_router(chatbot.router)
api_router.include_router(organizations.router)  # Punto Cero OS — Organizaciones (multi-tenant)
api_router.include_router(partners.router)        # Punto Cero OS — Partners (multi-tenant)
api_router.include_router(implementations.router) # Punto Cero OS — Implementaciones (multi-tenant)
api_router.include_router(subscriptions.router)   # Punto Cero OS — Suscripciones (multi-tenant)
api_router.include_router(billing.router)         # Punto Cero OS — Facturación (multi-tenant)
api_router.include_router(billing_admin.router)   # Administración de Suscripciones y Facturación
api_router.include_router(analytics.router)       # Punto Cero OS — Analytics (consolidado, solo lectura)
api_router.include_router(integration.router)     # Organismo único — CRM↔Casos↔Factura↔Documentos
api_router.include_router(admin_master.router)    # Administrador Maestro — control total + auditoría
api_router.include_router(commissions.router)     # FASE 8 — Comisiones (ecosistema comercial)
api_router.include_router(timeline.router)        # FASE 8 — Timeline (eventos del ecosistema)
api_router.include_router(firm_management.router) # FASE 9 — Gestión de Firmas (centro de control)
api_router.include_router(sales_analytics.router) # FASE 10 — Analítica Global (centro de ventas)
api_router.include_router(ai_operations.router)   # FASE 11 — Operaciones IA (copiloto)
api_router.include_router(financial.router)       # FASE 11 — Financiero (pagos, facturación, splits)
api_router.include_router(ai_autopilot.router)    # FASE 12 — AI Autopilot (scoring, asignación, predicciones)
api_router.include_router(autonomous.router)      # FASE 13 — Autonomous System (decisiones, routing, self-healing)
api_router.include_router(global_network.router)  # FASE 14 — Global Network (multi-país, multi-moneda, cumplimiento)
api_router.include_router(legal_os.router)        # FASE 15 — Legal OS (sistema operativo autónomo global)
api_router.include_router(firms.router)           # FASE 16 — Firm OS (firmas en crecimiento y consolidación)
api_router.include_router(firm_config.router)     # FASE 16 — Firm OS Configuration (onboarding, áreas de práctica)
api_router.include_router(rbac.router)            # FASE 16 — Firm OS RBAC (roles, permisos, control de acceso)
api_router.include_router(team.router)            # FASE 16 — Firm OS Team (gestión de equipo)
api_router.include_router(firm_os.router)         # FASE 16 — Firm OS Enterprise (dashboard, settings, onboarding, directorio)
api_router.include_router(users.router)           # Users — Listar usuarios para admin
api_router.include_router(onboarding.router)      # Onboarding — Asistente de activación post-login

# Inicializar cron jobs
@app.on_event("startup")
async def init_cron_jobs():
    """Inicia el scheduler de tareas automáticas (renovaciones, limpieza, etc)."""
    if db is None:
        logger.warning("Skipping cron scheduler: DB not available")
        return

    from services.cron_jobs import init_cron_scheduler
    try:
        # Set timeout to prevent startup hanging
        import asyncio
        await asyncio.wait_for(init_cron_scheduler(db), timeout=10.0)
        logger.info("Cron scheduler initialized successfully")
    except asyncio.TimeoutError:
        logger.error("Cron scheduler initialization timed out after 10s")
    except Exception as e:
        logger.error(f"Error initializing cron scheduler: {e}")


# Detener cron jobs
@app.on_event("shutdown")
async def shutdown_cron_jobs():
    """Detiene el scheduler de tareas automáticas."""
    from services.cron_jobs import shutdown_cron_scheduler
    try:
        await shutdown_cron_scheduler()
        logger.info("Cron scheduler shutdown successfully")
    except Exception as e:
        logger.error(f"Error shutting down cron scheduler: {e}")


# Inicializar índices de bases de datos
@app.on_event("startup")
async def init_db_indexes():
    """Crea índices para optimizar queries en colecciones críticas."""
    if db is None:
        logger.warning("Skipping DB index creation: DB not available")
        return

    import asyncio

    async def create_indexes():
        try:
            # Índices para transacciones de pago
            await db.transactions.create_index([("payment_id", 1)], unique=True)
            await db.transactions.create_index([("user_email", 1)])
            await db.transactions.create_index([("status", 1)])
            await db.transactions.create_index([("created_at", 1)])
            await db.transactions.create_index([("plan_id", 1)])
            await db.transactions.create_index([("type", 1)])

            # Índices para usuarios
            await db.users.create_index([("email", 1)], unique=True)
            await db.users.create_index([("plan_id", 1)])
            await db.users.create_index([("subscription_status", 1)])
            await db.users.create_index([("created_at", 1)])

            # Índices para comprobantes de pago manual
            await db.receipts.create_index([("user_id", 1)])
            await db.receipts.create_index([("status", 1)])
            await db.receipts.create_index([("created_at", 1)])

            # Índices para auditoría de pagos
            await db.audit_logs.create_index([("action", 1)])
            await db.audit_logs.create_index([("created_at", 1)])

            # Índices para webhooks
            await db.webhook_events.create_index([("event_id", 1)], unique=True)
            await db.webhook_events.create_index([("type", 1)])
            await db.webhook_events.create_index([("processed", 1)])
            await db.webhook_events.create_index([("created_at", 1)])

            await db.webhook_logs.create_index([("event_id", 1)])
            await db.webhook_logs.create_index([("type", 1)])
            await db.webhook_logs.create_index([("result_status", 1)])
            await db.webhook_logs.create_index([("created_at", 1)])

            # Índices para reembolsos y chargebacks
            await db.refunds.create_index([("refund_id", 1)], unique=True)
            await db.refunds.create_index([("payment_id", 1)])
            await db.refunds.create_index([("created_at", 1)])

            await db.chargebacks.create_index([("chargeback_id", 1)], unique=True)
            await db.chargebacks.create_index([("payment_id", 1)])
            await db.chargebacks.create_index([("created_at", 1)])

            logger.info("DB indexes created successfully")
        except Exception as e:
            logger.warning(f"Error creating indexes (may already exist): {e}")

    try:
        await asyncio.wait_for(create_indexes(), timeout=30.0)
    except asyncio.TimeoutError:
        logger.error("DB index creation timed out after 30s, continuing anyway")


# Inicialización de cuentas maestras y de prueba al arranque
@app.on_event("startup")
async def init_master_accounts():
    if db is None:
        logger.warning("Skipping master account initialization: DB not available")
        return

    from passlib.context import CryptContext
    import asyncio
    from datetime import datetime

    pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
    test_users = [
        {"email": "darwin@puntocerolegal.com", "password": "Admin2025!", "name": "Dr. Darwin Gomez", "role": "admin_general"},
        {"email": "alejandro@puntocerolegal.com", "password": "Socio2025!", "name": "Dr. Alejandro Cetina", "role": "socio_comercial"},
        {"email": "lawyer@test.com", "password": "Lawyer2025!", "name": "Juan Abogado", "role": "lawyer"},
        {"email": "client@test.com", "password": "Client2025!", "name": "Carlos Cliente", "role": "client"},
    ]

    async def init_accounts():
        for m in test_users:
            try:
                existing = await db.users.find_one({"email": m["email"]})
                if not existing:
                    await db.users.insert_one({
                        "email": m["email"],
                        "password_hash": pwd.hash(m["password"][:72]),
                        "full_name": m["name"],
                        "role": m["role"],
                        "status": "ACTIVE",
                        "is_verified": True,
                        "country": "Colombia",
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    })
                else:
                    updates = {"status": "ACTIVE", "is_verified": True, "role": m["role"]}
                    if not existing.get("password_hash"):
                        updates["password_hash"] = pwd.hash(m["password"][:72])
                    await db.users.update_one(
                        {"email": m["email"]},
                        {"$set": updates}
                    )
            except Exception as e:
                logger.warning(f"Failed to init account {m['email']}: {e}")
        logger.info("Master accounts initialized")

    try:
        await asyncio.wait_for(init_accounts(), timeout=20.0)
    except asyncio.TimeoutError:
        logger.error("Master account initialization timed out after 20s")

    # Punto Cero OS — índices multi-tenant (idempotente).
    async def init_os_indexes():
        try:
            from services.organization_service import ensure_indexes as ensure_org_indexes
            from services.partner_service import ensure_indexes as ensure_partner_indexes
            from services.implementation_service import ensure_indexes as ensure_impl_indexes
            from services.subscription_service import ensure_indexes as ensure_sub_indexes
            await ensure_org_indexes(db)
            await ensure_partner_indexes(db)
            await ensure_impl_indexes(db)
            await ensure_sub_indexes(db)
            logger.info("Punto Cero OS indexes initialized")
        except Exception as e:
            logger.warning(f"No se pudieron crear índices del OS: {e}")

    try:
        await asyncio.wait_for(init_os_indexes(), timeout=20.0)
    except asyncio.TimeoutError:
        logger.error("OS index initialization timed out after 20s")

    # Hotfix: Normalize password field for old users (backward compatibility)
    async def run_migrations():
        try:
            from migrations.normalize_password_field import MigratePasswordField
            await MigratePasswordField.apply(db)
        except Exception as e:
            logger.warning(f"Password field migration failed (non-critical): {e}")

    try:
        await asyncio.wait_for(run_migrations(), timeout=10.0)
    except asyncio.TimeoutError:
        logger.error("Migration initialization timed out after 10s")

    # Ensure official accounts are always available (idempotent)
    async def ensure_official_accounts():
        """Ensures official system accounts exist and are properly configured."""
        try:
            official_accounts = [
                {
                    "email": "darwin@puntocerolegal.com",
                    "full_name": "Dr. Darwin Gomez",
                    "role": "admin_general",
                    "password": "Admin2025!"
                },
                {
                    "email": "alejandro@puntocerolegal.com",
                    "full_name": "Dr. Alejandro Cetina",
                    "role": "socio_comercial",
                    "password": "Socio2025!"
                },
                {
                    "email": "abogado@puntocerolegal.com",
                    "full_name": "Dr. Abogado Official",
                    "role": "lawyer",
                    "password": "Abogado2025!"
                },
                {
                    "email": "firma@puntocerolegal.com",
                    "full_name": "Firma Official",
                    "role": "firm_owner",
                    "password": "Firma2025!"
                }
            ]

            logger.info("[OFFICIAL ACCOUNTS] Verifying official system accounts...")

            for account in official_accounts:
                existing = await db.users.find_one({"email": account["email"]})

                if not existing:
                    # Account doesn't exist - create it
                    logger.warning(f"  {account['email']}: NOT FOUND - creating...")
                    await db.users.insert_one({
                        "email": account["email"],
                        "password_hash": pwd.hash(account["password"][:72]),
                        "full_name": account["full_name"],
                        "role": account["role"],
                        "status": "ACTIVE",
                        "is_verified": True,
                        "country": "Colombia",
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    })
                    logger.info(f"  ✅ {account['email']}: Created")
                else:
                    # Account exists - verify critical fields
                    needs_update = False
                    updates = {}

                    # Ensure not soft-deleted
                    if existing.get("deleted_at"):
                        logger.warning(f"  {account['email']}: Was soft-deleted, restoring...")
                        updates["deleted_at"] = None
                        needs_update = True

                    # Ensure ACTIVE status
                    if existing.get("status") not in ["ACTIVE", "active"]:
                        logger.warning(f"  {account['email']}: Status was {existing.get('status')}, fixing to ACTIVE...")
                        updates["status"] = "ACTIVE"
                        needs_update = True

                    # Ensure verified
                    if not existing.get("is_verified"):
                        logger.warning(f"  {account['email']}: Not verified, fixing...")
                        updates["is_verified"] = True
                        needs_update = True

                    # Ensure has password hash
                    if not existing.get("password_hash") and not existing.get("password"):
                        logger.warning(f"  {account['email']}: No password, setting...")
                        updates["password_hash"] = pwd.hash(account["password"][:72])
                        needs_update = True

                    # Ensure role is correct
                    if existing.get("role") != account["role"]:
                        logger.warning(f"  {account['email']}: Role was {existing.get('role')}, fixing to {account['role']}...")
                        updates["role"] = account["role"]
                        needs_update = True

                    if needs_update:
                        updates["updated_at"] = datetime.utcnow()
                        await db.users.update_one(
                            {"email": account["email"]},
                            {"$set": updates}
                        )
                        logger.info(f"  ✅ {account['email']}: Fixed ({', '.join(updates.keys())})")
                    else:
                        logger.info(f"  ✅ {account['email']}: OK")

            logger.info("[OFFICIAL ACCOUNTS] All official accounts verified")
        except Exception as e:
            logger.error(f"[OFFICIAL ACCOUNTS] Error: {e}")

    try:
        await asyncio.wait_for(ensure_official_accounts(), timeout=10.0)
    except asyncio.TimeoutError:
        logger.error("Official accounts verification timed out")

    # F-003: la cuenta oficial de firma (firm_owner) debe tener una firma REAL
    # asociada; si no, el Dashboard de Firma queda con firm_id=null y las rutas
    # firm-scoped (/firms/{firmId}/*) devuelven 400. Idempotente: vincula la
    # firma existente por owner_email si la hay, o crea la firma oficial usando
    # la MISMA estructura del registro (routes/firms.py). No crea datos mock.
    async def ensure_official_firm():
        try:
            owner = await db.users.find_one({"email": "firma@puntocerolegal.com"})
            if not owner or owner.get("role") != "firm_owner":
                return
            owner_id = str(owner["_id"])
            firm = await db.firms.find_one({"owner_email": "firma@puntocerolegal.com"})
            if not firm:
                firm_doc = {
                    "name": owner.get("full_name") or "Firma Oficial Punto Cero",
                    "email": owner.get("email"),
                    "phone": owner.get("phone"),
                    "address": None,
                    "city": None,
                    "country": owner.get("country") or "Colombia",
                    "plan": "firm_growth",
                    "max_lawyers": 5,
                    "active_lawyers_count": 0,
                    "owner_id": owner_id,
                    "owner_name": owner.get("full_name"),
                    "owner_email": owner.get("email"),
                    "status": "active",
                    "is_verified": True,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                }
                res = await db.firms.insert_one(firm_doc)
                firm_id = str(res.inserted_id)
                logger.info(f"[OFFICIAL FIRM] Firma oficial creada para firma@ -> {firm_id}")
            else:
                firm_id = str(firm["_id"])
                if firm.get("owner_id") != owner_id:
                    await db.firms.update_one({"_id": firm["_id"]}, {"$set": {"owner_id": owner_id, "updated_at": datetime.utcnow()}})
            if owner.get("firm_id") != firm_id:
                await db.users.update_one({"_id": owner["_id"]}, {"$set": {"firm_id": firm_id, "updated_at": datetime.utcnow()}})
                logger.info(f"[OFFICIAL FIRM] firma@ vinculada a firm_id={firm_id}")
            else:
                logger.info(f"[OFFICIAL FIRM] firma@ ya vinculada a firm_id={firm_id}")
        except Exception as e:
            logger.error(f"[OFFICIAL FIRM] Error: {e}")

    try:
        await asyncio.wait_for(ensure_official_firm(), timeout=10.0)
    except asyncio.TimeoutError:
        logger.error("Official firm verification timed out")

# Include the router in the main app
app.include_router(api_router)

# Exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """Convierte errores de validación de Pydantic a un format limpio para el frontend."""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(x) for x in error.get("loc", [])[1:]) or "unknown",
            "message": error.get("msg", "Validation error")
        })
    return JSONResponse(
        status_code=422,
        content={"detail": errors[0]["message"] if errors else "Validation error"}
    )

def get_cors_origins():
    """Generar lista de origins CORS permitidos, incluyendo todas las variantes de Vercel."""
    origins = [
        # ─ Desarrollo local ─
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",

        # ─ Dominios de producción ─
        "https://puntocerolegal.com",
        "https://www.puntocerolegal.com",

        # ─ Vercel production ─
        "https://punto-cero-legal.vercel.app",

        # ─ Render backend ─
        "https://puntocero-legal-api.onrender.com",
    ]

    # ─ Vercel preview deployments (patrón dinámico) ─
    # Permite CUALQUIER subdominio de vercel.app que contenga "puntocerolegal-3926s-projects"
    # Esto cubre todos los previews: me3ma4jnr, 1jqn23vb1, kz4s25i13, etc.
    vercel_preview_patterns = [
        "https://punto-cero-legal-*-puntocerolegal-3926s-projects.vercel.app",
    ]
    origins.extend(vercel_preview_patterns)

    # Si CORS_ORIGINS env var está definido, usarlo en lugar del hardcoded
    if os.environ.get('CORS_ORIGINS'):
        return os.environ.get('CORS_ORIGINS', '').split(',')

    return origins

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://punto-cero-legal.vercel.app",
        "https://puntocerolegal.com",
        "https://puntocero-legal-api.onrender.com",
    ],
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=86400,
)

@app.on_event("shutdown")
async def shutdown_db_client():
    if client is not None:
        try:
            client.close()
        except Exception as e:
            logger.warning(f"Error closing MongoDB client: {e}")
