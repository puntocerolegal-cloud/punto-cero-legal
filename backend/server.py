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
from routes import auth, leads, cases, meetings, appointments, messages, dashboard, ai, admin, payment, referrals, admin_ops, public_intake, accounting, clients, invoices, documents, portal, backup, chatbot, organizations, partners, implementations, subscriptions, billing, analytics, integration, admin_master, commissions, timeline, firm_management, sales_analytics, ai_operations, financial, ai_autopilot, autonomous, global_network, legal_os, firms, firm_config, rbac, team, users, firm_os, billing_admin

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging FIRST (before any logger usage)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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
    # Create dummy client that won't crash the app
    client = None
    db = None

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

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        # ─ Desarrollo local ─
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",

        # ─ Dominios de producción ─
        "https://puntocerolegal.com",
        "https://www.puntocerolegal.com",

        # ─ Vercel frontend (múltiples variantes) ─
        "https://punto-cero-legal.vercel.app",                    # Production
        "https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app",  # Preview

        # ─ Vercel preview deployments (patrón genérico) ─
        # Permite cualquier subdominio de vercel.app mientras sea del proyecto
        # Nota: Esto se maneja via CORS_ORIGINS env var en Render

        # ─ Render backend (para testing si es necesario) ─
        "https://puntocero-legal-api.onrender.com",
    ] if not os.environ.get('CORS_ORIGINS') else os.environ.get('CORS_ORIGINS', '').split(','),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=86400,  # 24 horas de cache para preflight
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
