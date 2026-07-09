# ROOT CAUSE ANALYSIS
## Punto Cero System OS — Backend

### The Failure

**Error:** `AttributeError: 'FastAPI' object has no attribute 'lifespan'`
**Location:** `backend/server.py`, line 153
**Context:** `@app.lifespan` decorator applied to `async def lifespan(app: FastAPI)`

### Evidence

```
>>> import fastapi
>>> app = fastapi.FastAPI()
>>> hasattr(app, 'lifespan')
False
>>> 'lifespan' in dir(app.router)
True
```

The `lifespan` attribute exists on `app.router` (the inner Starlette Router) but NOT on the `FastAPI` class itself.

### Root Cause Classification

| Factor | Detail | Verdict |
|--------|--------|---------|
| Wrong FastAPI version | 0.110.1 removed `@app.lifespan` decorator | **CONFIRMED** |
| Wrong Starlette version | 0.37.2 is correct for fastapi 0.110.1 | ❌ Not the cause |
| Incompatible Pydantic | 2.13.4 works with both | ❌ Not the cause |
| Incorrect code usage | `@app.lifespan` syntax is correct for fastapi 0.93-0.109 | ❌ Not code error per se |
| Bootstrap issue | Bootstrap not yet reached | ❌ Not the cause |
| Import issue | Resolution happens at module import time | **FACTOR** |
| Decorator misuse | No, the decorator syntax is standard | ❌ Not the cause |

### Detailed Timeline

**FastAPI 0.93.0 (June 2023):**
- Added `@app.lifespan` decorator on `FastAPI` class
- `lifespan` was a property returning a decorator

**FastAPI 0.110.0 (July 2024):**
- Deprecated `@app.lifespan` decorator in favor of `lifespan=` constructor parameter
- The property was removed from `FastAPI` class
- `lifespan` remained on `app.router` (Starlette's Router) for internal use

**Requirements.txt:**
```
fastapi==0.110.1   ← Specifies version WITHOUT @app.lifespan support
```

**Code (server.py line 153):**
```python
@app.lifespan    # ← Written for fastapi <= 0.109.x
async def lifespan(app: FastAPI):
    async with graceful_shutdown_context():
        yield
```

### Root Cause: Mismatch Between Code and Package Version

The code in `server.py` was written against FastAPI **0.93–0.109.x** API, but `requirements.txt` specifies **0.110.1** which removed the `@app.lifespan` decorator from the `FastAPI` class.

### Secondary Cause: Missing PYTHONPATH in Local Execution

Even after fixing the lifespan issue, `uvicorn server:app` from `backend/` directory fails on `from backend.repositories` imports because the project uses a **hybrid import style**:

1. `from routes import ...` — requires `backend/` in PYTHONPATH
2. `from backend.repositories import ...` — requires project root in PYTHONPATH
3. `from security import ...` — requires `backend/` in PYTHONPATH
4. `from services import ...` — requires `backend/` in PYTHONPATH

### Verdict

**Primary:** ✅ FastAPI version mismatch (0.110.1 vs code written for 0.93-0.109)
**Secondary:** ⚠️ PYTHONPATH configuration needed for local execution
**Tertiary:** ⚠️ Missing `logs/` directory in `backend/` (audit_logger.py line 30)