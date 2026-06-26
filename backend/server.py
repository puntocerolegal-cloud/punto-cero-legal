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

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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
    return {"status": "healthy", "database": "connected"}

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
    from services.cron_jobs import init_cron_scheduler
    try:
        await init_cron_scheduler(db)
        logger.info("Cron scheduler initialized successfully")
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
    try:
        # Índices para transacciones de pago
        await db.transactions.create_index([("payment_id", 1)], unique=True)
        await db.transactions.create_index([("user_email", 1)])
        await db.transactions.create_index([("status", 1)])
        await db.transactions.create_index([("created_at", 1)])
        await db.transactions.create_index([("plan_id", 1)])
        await db.transactions.create_index([("type", 1)])  # renewal, plan_change, reactivation

        # Índices para usuarios (suscripción)
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

        # Índices para webhooks (FASE 2.2)
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
    except Exception as e:
        logger.warning(f"Algunos índices ya existen: {e}")


# Inicialización de cuentas maestras al arranque
@app.on_event("startup")
async def init_master_accounts():
    from passlib.context import CryptContext
    pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
    masters = [
        {"email": "darwin@puntocerolegal.com", "password": "Admin2025!", "name": "Dr. Darwin Gomez", "role": "admin_general"},
        {"email": "alejandro@puntocerolegal.com", "password": "Socio2025!", "name": "Dr. Alejandro Cetina", "role": "socio_comercial"},
    ]
    from datetime import datetime
    for m in masters:
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
            # Backfill seguro para cuentas maestras pre-existentes
            updates = {"status": "ACTIVE", "is_verified": True, "role": m["role"]}
            # Repara el hash de contraseña si quedó vacío/None (cuenta maestra
            # creada sin clave válida → de lo contrario el login es imposible).
            if not existing.get("password_hash"):
                updates["password_hash"] = pwd.hash(m["password"][:72])
            await db.users.update_one(
                {"email": m["email"]},
                {"$set": updates}
            )

    # Punto Cero OS — índices multi-tenant (idempotente).
    try:
        from services.organization_service import ensure_indexes as ensure_org_indexes
        from services.partner_service import ensure_indexes as ensure_partner_indexes
        from services.implementation_service import ensure_indexes as ensure_impl_indexes
        from services.subscription_service import ensure_indexes as ensure_sub_indexes
        await ensure_org_indexes(db)
        await ensure_partner_indexes(db)
        await ensure_impl_indexes(db)
        await ensure_sub_indexes(db)
    except Exception as e:
        logging.getLogger(__name__).warning("No se pudieron crear índices del OS: %s", e)

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
        "http://localhost:3000",      # Frontend desarrollo (port 3000)
        "http://127.0.0.1:3000",      # Frontend desarrollo (127.0.0.1)
        "http://localhost:5173",      # Vite dev server
        "http://127.0.0.1:5173",      # Vite dev server (127.0.0.1)
        "https://puntocero-legal.onrender.com",  # Producción Vercel/Render
        "https://puntocero-legal-frontend.vercel.app",  # Producción Vercel
    ] if not os.environ.get('CORS_ORIGINS') else os.environ.get('CORS_ORIGINS', '').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
