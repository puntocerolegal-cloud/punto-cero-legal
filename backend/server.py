from fastapi import FastAPI, APIRouter
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# JWT Runtime Fix: load_dotenv() MUST happen before any module that reads JWT_SECRET/SECRET_KEY
# Import routes (these may import utils.auth which reads env vars at module load time)
from routes import auth, leads, cases, meetings, appointments, messages, dashboard, ai, admin, payment, referrals, admin_ops, public_intake, accounting, clients, invoices, documents, portal, backup, chatbot, organizations, partners, implementations, subscriptions, billing, analytics, integration, admin_master, commissions, timeline, firm_management, sales_analytics, ai_operations, financial, ai_autopilot, autonomous, global_network, legal_os, firms, firm_config, rbac, team, users, firm_os, billing_admin

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
    real_db = client[os.environ.get('DB_NAME', 'puntocero_legal')]
    logger.info("MongoDB client initialized")

    # S2.5 Hardening: Wrap in GuardedDB to block direct access
    from security.guarded_db import create_guarded_db
    db = create_guarded_db(real_db)
    logger.info("MongoDB wrapped in GuardedDB hard barrier")

except Exception as e:
    logger.error(f"MongoDB initialization failed: {e}")
    client = None
    db = create_fallback_db()
    FALLBACK_DB = True
    logger.warning("Usando modo degradado: fallback en memoria activo")

# CRITICAL FIX (S5.3-Finding#9): Graceful shutdown management
from utils.graceful_shutdown import get_shutdown_manager, graceful_shutdown_context

# Create the main app without a prefix
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle with graceful shutdown."""
    async with graceful_shutdown_context():
        yield

app = FastAPI(title="Punto Cero Legal API", version="1.0.0", lifespan=lifespan)

# CRITICAL FIX (S5.3-Finding#9): Enterprise rate limiting on public endpoints
# Prevents brute-force attacks on intake, login, and token endpoints
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request, exc):
    """Handle rate limit exceeded with proper HTTP 429 response."""
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."}
    )

# PHASE 5: TenantKernel middleware (primary - FIRST execution)
# PHASE 9: Legacy TenantIsolationMiddleware (fallback/compatibility)
# PHASE 10: Security Enforcer (global authorization enforcement)
# All must be registered BEFORE startup events
from kernel.tenant_kernel_middleware import TenantKernelMiddlewareWrapper
from middleware.tenant_isolation import TenantIsolationMiddleware
from middleware.security_enforcer import SecurityEnforcerMiddleware
app.add_middleware(SecurityEnforcerMiddleware)
app.add_middleware(TenantKernelMiddlewareWrapper)
app.add_middleware(TenantIsolationMiddleware)

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

# [BLOCK 1] Wire enterprise infrastructure during startup
@app.on_event("startup")
async def startup_bootstrap_enterprise():
    """
    Initialize enterprise infrastructure: middleware, services, repositories, indexes.
    This is CRITICAL for multi-tenant isolation.
    MUST execute before any request is processed.
    """
    from bootstrap_enterprise import bootstrap_enterprise

    if db is None:
        logger.critical("[BLOCK 1] Cannot bootstrap enterprise: database not connected. "
                       "Multi-tenant isolation UNAVAILABLE.")
        raise RuntimeError("Database not available for enterprise bootstrap")

    try:
        logger.info("[BLOCK 1] Starting enterprise infrastructure bootstrap...")
        result = await bootstrap_enterprise(app, db)
        logger.info("[BLOCK 1] Enterprise bootstrap completed successfully")
        logger.info(f"[BLOCK 1] Services registered: {list(result.get('services', {}).keys())}")
        logger.info(f"[BLOCK 1] Middleware registered: {result.get('middleware', [])}")
        logger.info("[BLOCK 1] ✓ TenantIsolationMiddleware ACTIVE - Multi-tenant isolation ENABLED")
    except Exception as e:
        logger.critical(f"[BLOCK 1] CRITICAL: Enterprise bootstrap failed: {e}", exc_info=True)
        logger.critical("[BLOCK 1] ✗ TenantIsolationMiddleware NOT registered - "
                       "Multi-tenant isolation DISABLED")
        logger.critical("[BLOCK 1] Application will NOT be operational for multi-tenant access")
        raise  # Fail fast - don't hide critical infrastructure errors

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

            # CRITICAL FIX (S5.3-Finding#4): Missing indexes for query-heavy operations
            # These indexes prevent full collection scans on frequent queries

            # Timeline events - Case/Lead/Agent queries
            await db.timeline_events.create_index([("case_id", 1), ("created_at", -1)])
            await db.timeline_events.create_index([("lead_id", 1), ("created_at", -1)])
            await db.timeline_events.create_index([("agent_id", 1), ("created_at", -1)])

            # Chat sessions - Case queries
            await db.chat_sessions.create_index([("case_id", 1), ("status", 1)])
            await db.chat_sessions.create_index([("session_id", 1)], unique=True)

            # Messages - Case queries
            await db.messages.create_index([("case_id", 1), ("created_at", -1)])

            # Invoices - Case and status queries
            await db.invoices.create_index([("case_id", 1), ("status", 1)])
            await db.invoices.create_index([("organization_id", 1), ("status", 1)])

            # Users - Role and status queries
            await db.users.create_index([("role", 1), ("status", 1)])
            await db.users.create_index([("firm_id", 1), ("role", 1)])

            # Documents - Case owner queries
            await db.documents.create_index([("case_id", 1)])
            await db.documents.create_index([("firm_id", 1), ("case_id", 1), ("name", 1)], unique=True)
            await db.documents.create_index([("owner_id", 1), ("created_at", -1)])

            # Accounting movements - Type and date queries
            await db.accounting_movements.create_index([("type", 1), ("date", -1)])

            # Cases - Common filter queries
            await db.cases.create_index([("lawyer_id", 1), ("created_at", -1)])
            await db.cases.create_index([("status", 1), ("created_at", -1)])

            # Appointments - Scheduled and reminder queries
            await db.appointments.create_index([("lawyer_id", 1), ("start_time", 1)])
            await db.appointments.create_index([("status", 1), ("reminder_sent", 1)])

            logger.info("DB indexes created successfully")
        except Exception as e:
            logger.warning(f"Error creating indexes (may already exist): {e}")

    try:
        await asyncio.wait_for(create_indexes(), timeout=30.0)
    except asyncio.TimeoutError:
        logger.error("DB index creation timed out after 30s, continuing anyway")


# S2.5 Hardening: Initialize async audit pipeline on startup
@app.on_event("startup")
async def init_async_audit_pipeline():
    """Start background async audit logging pipeline."""
    try:
        from security.async_audit_pipeline import initialize_audit_pipeline
        pipeline = initialize_audit_pipeline(db=db)
        await pipeline.start()
        logger.info("Async audit pipeline started")
    except Exception as e:
        logger.error(f"Failed to start async audit pipeline: {e}")


# S2.5 Hardening: Shutdown async audit pipeline gracefully
@app.on_event("shutdown")
async def shutdown_async_audit_pipeline():
    """Stop async audit pipeline and flush remaining events."""
    try:
        from security.async_audit_pipeline import get_audit_pipeline
        pipeline = get_audit_pipeline()
        await pipeline.stop()
        logger.info("Async audit pipeline stopped gracefully")
    except Exception as e:
        logger.error(f"Error shutting down audit pipeline: {e}")


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
