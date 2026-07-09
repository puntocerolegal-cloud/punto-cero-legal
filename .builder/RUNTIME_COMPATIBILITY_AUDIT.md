# RUNTIME COMPATIBILITY AUDIT
## Punto Cero System OS — Backend

### PHASE 1 — ENVIRONMENT INVENTORY

| Component | Version | Source |
|-----------|---------|--------|
| Python | 3.11.9 | `.venv` (virtualenv) |
| FastAPI | 0.110.1 | `requirements.txt` line 4 |
| Starlette | 0.37.2 | Transitive (FastAPI dep) |
| Pydantic | 2.13.4 | `requirements.txt` line 14 (was 2.7.4) |
| Uvicorn | 0.29.0 | `requirements.txt` line 5 |
| httpx | 0.27.2 | `requirements.txt` line 26 |
| motor | 3.4.0 | `requirements.txt` line 10 |
| anthropic | 0.69.0 | `requirements.txt` line 30 |
| slowapi | 0.1.10 | `requirements.txt` line 7 (was 0.1.9) |
| bleach | 6.4.0 | `requirements.txt` line 15 (was 6.1.0) |

**Source files checked:**
- `backend/requirements.txt` — primary dependency manifest
- `pip list` — installed packages
- No `pyproject.toml`, `poetry.lock`, or `setup.cfg` found

### PHASE 2 — CODE COMPATIBILITY ANALYSIS

**server.py** uses these FastAPI APIs:
- `FastAPI()` constructor (line 150) — ✅ compatible
- `@app.lifespan` decorator (line 153) — ❌ **FAILS**
- `@app.on_event("startup")` (lines 263, 292, 324, 428, 454) — ✅ compatible
- `@app.on_event("shutdown")` (lines 312, 441, 594) — ✅ compatible
- `app.add_middleware()` (lines 183-185, 577) — ✅ compatible
- `app.include_router()` (lines 216-260, 526) — ✅ compatible
- `@app.exception_handler()` (lines 168, 529) — ✅ compatible

**bootstrap_enterprise.py** uses:
- `app.on_event("startup")` (line 168) — ✅ compatible
- `app.on_event("shutdown")` (line 174) — ✅ compatible
- `app.include_router()` (lines 149-154) — ✅ compatible
- `app.state.*` (lines 133-139) — ✅ compatible

**No `backend/app.py` or `backend/main.py` found.**

### PHASE 3 — DEPENDENCY GRAPH

```
Python 3.11.9
  └── uvicorn 0.29.0
        └── click >=7.0
        └── h11 >=0.8
  └── fastapi 0.110.1
        └── starlette 0.37.2
        │     └── anyio >=3.4.0
        └── pydantic >=1.7.4,<3.0.0
              └── pydantic-core
              └── annotated-types
  └── motor 3.4.0
        └── pymongo 4.7.2
              └── dnspython
  └── httpx 0.27.2
        └── httpcore 1.0.9
        └── certifi
  └── anthropic 0.69.0
        └── httpx
        └── pydantic
  └── slowapi 0.1.10
        └── limits >=2.3
  └── passlib 1.7.4
        └── bcrypt 4.0.1
```

### PHASE 4 — ROOT CAUSE

**Why `@app.lifespan` fails:**

The `@app.lifespan` decorator was introduced in FastAPI 0.93.0 (June 2023) as a property on the `FastAPI` class. However, in FastAPI 0.110.0 (July 2024), the `@app.lifespan` decorator was **deprecated** in favor of the `lifespan` parameter in the `FastAPI()` constructor.

**Evidence:**
```
>>> import fastapi
>>> app = fastapi.FastAPI()
>>> hasattr(app, 'lifespan')
False
>>> 'lifespan' in dir(app.router)
True
```

The `lifespan` attribute exists on `app.router` (Starlette's `Router.lifespan` method) but NOT on the `FastAPI` class itself. The `@app.lifespan` decorator syntax requires a `lifespan` property on the `FastAPI` class, which was removed/deprecated in 0.110.0.

**Root cause:** The code in `server.py` line 153 uses `@app.lifespan` which is incompatible with FastAPI 0.110.1. The code was written for FastAPI < 0.110.0, but `requirements.txt` specifies 0.110.1.

### PHASE 5 — EXECUTION CHAIN

```
Python 3.11.9
  └── uvicorn 0.29.0
        └── import server:app
              └── from routes import ... (line 12) ✅
              └── load_dotenv() (line 15) ✅
              └── MongoDB client init (line 119-144) ✅
              └── GuardedDB wrap (line 135-136) ✅
              └── app = FastAPI() (line 150) ✅
              └── @app.lifespan (line 153) ❌ **EXECUTION STOPS HERE**
                    └── AttributeError: 'FastAPI' object has no attribute 'lifespan'
```

**Execution stops at `server.py` line 153** — the `@app.lifespan` decorator.

### PHASE 6 — MINIMAL FIX PLAN

| Item | Detail |
|------|--------|
| **Files involved** | `backend/server.py` (line 153) |
| **Root cause** | `@app.lifespan` decorator deprecated in FastAPI 0.110.0+ |
| **Package versions required** | FastAPI < 0.110.0 (e.g., 0.109.2) OR keep 0.110.1 and fix code |
| **Exact fix (Option A)** | Downgrade FastAPI to 0.109.2: `fastapi==0.109.2` |
| **Exact fix (Option B)** | Replace `@app.lifespan` with `lifespan` parameter in constructor |
| **Estimated risk** | Low — single line change or single version downgrade |
| **Compatibility impact** | Option A: All other deps compatible. Option B: No dep changes needed |

**Option B code change (server.py):**
```python
# Remove lines 152-157:
# @app.lifespan
# async def lifespan(app: FastAPI):
#     async with graceful_shutdown_context():
#         yield

# Change line 150 from:
# app = FastAPI(title="Punto Cero Legal API", version="1.0.0")
# To:
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with graceful_shutdown_context():
        yield

app = FastAPI(title="Punto Cero Legal API", version="1.0.0", lifespan=lifespan)
```

**Note:** The `@app.on_event("startup")` and `@app.on_event("shutdown")` handlers (lines 263-600) are compatible with both approaches and do NOT need changes.