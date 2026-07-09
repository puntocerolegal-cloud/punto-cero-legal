# MINIMAL RUNTIME FIX
## Punto Cero System OS — Backend

⚠️ **THIS IS A PLAN ONLY — DO NOT APPLY WITHOUT AUTHORIZATION** ⚠️

---

### Root Cause

`backend/server.py` line 153 uses `@app.lifespan` decorator, which was **removed** in FastAPI 0.110.0+. The installed FastAPI is 0.110.1 per `requirements.txt`.

### Option A: Change Code (Lower Risk)

**Files involved:**
- `backend/server.py` (lines 150-157)

**Change:**
Replace the `@app.lifespan` decorator with the `lifespan=` constructor parameter.

**Current code (lines 150-157):**
```python
app = FastAPI(title="Punto Cero Legal API", version="1.0.0")

# Setup graceful shutdown lifespan
@app.lifespan
async def lifespan(app: FastAPI):
    """Manage application lifecycle with graceful shutdown."""
    async with graceful_shutdown_context():
        yield
```

**Replacement code:**
```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle with graceful shutdown."""
    async with graceful_shutdown_context():
        yield

app = FastAPI(title="Punto Cero Legal API", version="1.0.0", lifespan=lifespan)
```

**Package changes required:** None
**Risk:** Low — the pattern is FastAPI 0.110.1's official API. All `@app.on_event()` handlers remain compatible.

### Option B: Downgrade FastAPI (Lower Code Risk)

**Files involved:**
- `backend/requirements.txt` (line 4)

**Change:**
```diff
- fastapi==0.110.1
+ fastapi==0.109.2
```

Then re-run `pip install -r requirements.txt`.

**Package changes required:**
- `fastapi==0.109.2`
- Automatically pulls `starlette==0.36.3`

**Risk:** Low — 0.109.2 is a micro version back. No API changes other than restoring `@app.lifespan`.

---

### Startup Command (Both Options)

After fix, start with:
```bash
cd backend
set PYTHONPATH=backend;.
uvicorn server:app --host 0.0.0.0 --port 8000
```

---

### Additional Requirements for Local Startup

| Issue | File | Fix |
|-------|------|-----|
| Missing `logs/` dir | `backend/security/audit_logger.py:30` | `mkdir backend\logs` |
| Secondary imports (bleach) | `backend/utils/xss_protection.py:9` | `pip install bleach` |
| Secondary imports (slowapi) | `backend/routes/ai.py:14` | Already installed: `slowapi 0.1.10` |

---

### Compatibility Impact

| Component | Option A (Code change) | Option B (Downgrade) |
|-----------|----------------------|---------------------|
| FastAPI | 0.110.1 (no change) | 0.109.2 |
| Starlette | 0.37.2 (no change) | 0.36.3 |
| Pydantic | 2.13.4 (no change) | 2.13.4 (no change) |
| Uvicorn | 0.29.0 (no change) | 0.29.0 (no change) |
| All other deps | No change | No change |

---

### Verification After Fix

1. Start uvicorn: App should load without AttributeError
2. Hit `GET /api/health` → Should return `{"status": "healthy"}`
3. Hit `POST /api/auth/login` → Should authenticate
4. Hit `POST /api/ai/chat` → Should respond via Gemini

---

### Rollback (If Option A Fails)

```bash
# Restore server.py from git
git checkout backend/server.py
# Then try Option B
pip install fastapi==0.109.2