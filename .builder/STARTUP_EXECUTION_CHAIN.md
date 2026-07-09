# STARTUP EXECUTION CHAIN
## Punto Cero System OS — Backend

### Full Chain Trace

```
[STEP 1]  Python 3.11.9
          ↓
[STEP 2]  Uvicorn 0.29.0
          │  uvicorn server:app --host 0.0.0.0 --port 8000
          ↓
[STEP 3]  Import server module
          │  python -c "from server import app"
          ↓
[STEP 4]  server.py:4  — import load_dotenv
          ✅  python-dotenv 1.0.1
          ↓
[STEP 5]  server.py:12 — import routes (42 routes)
          ✅  routes/__init__.py exists (empty)
          ↓
[STEP 6]  server.py:15 — load_dotenv(ROOT_DIR / '.env')
          ✅  Reads backend/.env successfully
          ↓
[STEP 7]  server.py:18-21 — logging.basicConfig
          ✅  Logger initialized
          ↓
[STEP 8]  server.py:119-144 — MongoDB connection
          ✅  MONGO_URL=mongodb://localhost:27017
          ✅  AsyncIOMotorClient connected
          ✅  GuardedDB wrapper active
          ↓
[STEP 9]  server.py:150 — app = FastAPI(...)
          ✅  FastAPI 0.110.1
          ↓
[STEP 10] server.py:152-157 — @app.lifespan DECORATOR
          ❌  AttributeError: 'FastAPI' object has no attribute 'lifespan'
          ↓
          ╔══════════════════════════════════════════════════╗
          ║         🛑  EXECUTION STOPS HERE  🛑             ║
          ║      Module import FAILS at line 153              ║
          ║      Uvicorn cannot load the app                  ║
          ╚══════════════════════════════════════════════════╝
```

### What WOULD happen if STEP 10 passed

```
[STEP 11] server.py:159-173 — slowapi Limiter setup
          ✅  Rate limiting configured

[STEP 12] server.py:180-185 — Middleware registration
          ✅  SecurityEnforcerMiddleware
          ✅  TenantKernelMiddlewareWrapper
          ✅  TenantIsolationMiddleware

[STEP 13] server.py:188 — api_router = APIRouter(prefix="/api")
          ✅

[STEP 14] server.py:191-213 — Health endpoints
          ✅  GET /api/  → {"status": "healthy"}
          ✅  GET /api/health → {"database": "connected"}

[STEP 15] server.py:216-260 — Include 42 route modules
          ⚠️  All must import without errors

[STEP 16] server.py:263-289 — startup_bootstrap_enterprise()
          ⚠️  Calls bootstrap_enterprise(app, db)

[STEP 17]   bootstrap_enterprise.py:36-209
            ✅  Create 7 services (Audit, Permission, Auth, Tenant, User, Case, Document)
            ✅  Create indexes on MongoDB
            ✅  Attach services to app.state
            ✅  Register 6 enterprise route groups
            ✅  Register startup/shutdown hooks

[STEP 18] server.py:292-308 — init_cron_jobs()
          ⚠️  Starts scheduler (timeout 10s)

[STEP 19] server.py:324-424 — init_db_indexes()
          ⚠️  Creates MondoDB indexes (timeout 30s)

[STEP 20] server.py:428-437 — init_async_audit_pipeline()
          ✅  Starts audit pipeline

[STEP 21] server.py:454-523 — init_master_accounts()
          ⚠️  Creates test users (timeout 20s)

[STEP 22] server.py:526 — app.include_router(api_router)
          ✅  Main router mounted

[STEP 23] server.py:577-592 — CORSMiddleware
          ✅  CORS configured

[STEP 24] Application READY
          ✅  Listening on http://0.0.0.0:8000
```

### Other Potential Failure Points After Fix

| Step | Failure Risk | Evidence |
|------|-------------|----------|
| 15 (routes) | ⚠️ MID | Imports depend on PYTHONPATH configuration |
| 16 (bootstrap) | ⚠️ LOW | MongoDB must be running for enterprise services |
| 17 (services) | ⚠️ LOW | All use `db` parameter (already connected) |
| 18 (cron) | ✅ NONE | Timeout 10s, won't block |
| 19 (indexes) | ✅ NONE | Timeout 30s, continues on error |
| 20 (audit) | ⚠️ LOW | Requires db |
| 21 (accounts) | ⚠️ MED | Test users may already exist (handled) |

### PYTHONPATH Requirement

For routes to import correctly, PYTHONPATH must include:
- `c:\Users\darwi\Documents\punto-cero-legal\backend` (for `from routes import ...`)
- `c:\Users\darwi\Documents\punto-cero-legal` (for `from backend.repositories import ...`)

This is a dual-path requirement that creates fragility.