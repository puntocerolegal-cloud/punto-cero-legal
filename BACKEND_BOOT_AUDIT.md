# BACKEND_BOOT_AUDIT.md
## Fase 0.1 — Dejar el backend en estado ejecutable (solo boot, sin funcionalidades)
Fecha: 2026-07-15 · Comando: `venv/Scripts/python.exe -m uvicorn server:app --host 127.0.0.1 --port 8010` · Mongo: `mongodb://localhost:27017/puntocero_legal`

Alcance estricto: únicamente se agregaron imports faltantes para permitir el arranque. **No** se creó lógica, endpoints, ni se tocó negocio/UI/RBAC/auth/Mongo/Firm OS/Lawyer OS/Portal.

---

## 1. Errores encontrados

**Error de boot (único, bloqueante):**
```
NameError: name 'get_current_user' is not defined
  File "backend/routes/meetings.py", line 17, in <module>
    current_user: dict = Depends(get_current_user),
```
Uvicorn abortaba el import de `server.py` (que hace `from routes import ... meetings ...`) → `GET /api/ -> 000` (servidor caído).

**Causa raíz:** el commit `cc54e13` añadió el parámetro `current_user: dict = Depends(get_current_user)` a endpoints de varios routers, pero **no agregó el import** del símbolo. Como `Depends(get_current_user)` se evalúa al definir la función (valor por defecto), Python lanza `NameError` en tiempo de import. `py_compile` no lo detecta porque es válido sintácticamente.

**Escaneo completo — archivos que usaban `get_current_user` sin importarlo ni definirlo (4):**
| Archivo | Estado previo |
|---|---|
| `backend/routes/meetings.py` | ❌ usaba sin import (crash en boot) |
| `backend/routes/documents.py` | ❌ usaba sin import |
| `backend/routes/ai.py` | ❌ usaba sin import |
| `backend/routes/chatbot.py` | ❌ usaba sin import |

**Descartados (falsos positivos):** `routes/auth.py`, `routes/users.py`, `routes/referrals.py`, `routes/enterprise_auth_routes.py` **definen** su propio `get_current_user` (no necesitan import). Todos los demás routers que lo usan ya lo importaban correctamente con `from routes.auth import get_current_user`.

**Otros errores de boot:** ninguno. Tras los 4 imports el arranque quedó limpio (no aparecieron errores en cascada).

---

## 2. Archivos modificados (rutas exactas)

1. `backend/routes/meetings.py`
2. `backend/routes/documents.py`
3. `backend/routes/ai.py`
4. `backend/routes/chatbot.py`

**Total: 4 archivos, 1 línea añadida en cada uno. Cero líneas modificadas o eliminadas.**

---

## 3. Cambios realizados (línea por línea)

Se añadió **exactamente una línea** por archivo — el import canónico ya usado por el resto de routers (`cases.py`, `clients.py`, `firm_config.py`, etc.): `from routes.auth import get_current_user`. No se movió, renombró ni alteró ninguna otra línea.

**`backend/routes/meetings.py`** (insertada en línea 7, tras `from bson import ObjectId`):
```python
  from models.meeting import MeetingCreate, Meeting, MeetingUpdate
  from bson import ObjectId
+ from routes.auth import get_current_user
```

**`backend/routes/documents.py`** (línea 13, tras `from bson import ObjectId`):
```python
  from motor.motor_asyncio import AsyncIOMotorDatabase
  from bson import ObjectId
+ from routes.auth import get_current_user
```

**`backend/routes/ai.py`** (línea 12, tras `import logging`):
```python
  from bson import ObjectId
  import logging
+ from routes.auth import get_current_user
```

**`backend/routes/chatbot.py`** (línea 26, tras `from utils import notifier`):
```python
  from utils import notifier
+ from routes.auth import get_current_user
```

Verificación post-cambio (escaneo): **0 archivos** quedan usando `get_current_user` sin import/definición.

---

## 4. Confirmación

| Verificación | Resultado | Evidencia |
|---|---|---|
| **Backend inicia** | **SÍ** | `INFO: Application startup complete.` / `Uvicorn running on http://127.0.0.1:8010` |
| **Mongo conecta** | **SÍ** | `MongoDB client initialized` · `DB indexes created successfully` · `[OFFICIAL ACCOUNTS] All official accounts verified` |
| **FastAPI responde** | **SÍ** | `GET /api/ -> 200 (0.0014s)` · `GET /docs -> 200` · `GET /openapi.json -> 200` · **293 rutas** registradas |
| **Sin errores de importación** | **SÍ** | escaneo `get_current_user` sin import = 0 |
| **Sin errores de sintaxis** | **SÍ** | arranque completo sin traceback |
| **Sin errores de boot** | **SÍ** | log de startup sin excepciones que aborten |

**Warning no-bloqueante (informativo, no impide el arranque):** `Password field migration failed (non-critical): 'charmap' codec can't encode character '❌'`. Es un fallo de codificación al escribir un emoji en el log de una migración durante Windows/consola cp1252; está marcado como `non-critical` por el propio código y el startup completa después. No se tocó (fuera de alcance de esta fase).

---

## 5. Estado final

# ✅ BACKEND LISTO PARA AUDITORÍA DINÁMICA

El backend arranca completamente, MongoDB conecta y FastAPI responde. No hay errores de importación, sintaxis ni boot.

**Detención según lo instruido:** no se ejecutaron pruebas funcionales, endpoints de negocio, ni reparaciones de botones/uploads/perfiles/invitaciones. El servidor queda corriendo en `127.0.0.1:8010` a la espera de iniciar la auditoría dinámica completa (Firm OS, Lawyer OS, Client Portal, Mercado Pago, IA Jurídica, Jitsi).

---

## Nota de riesgo (no requiere acción en esta fase)
El fix de estos 4 imports está aplicado **solo en el working tree local** (no commiteado). El commit roto `cc54e13` está en `main`. Producción (Render) sigue viva con un build anterior; **el próximo deploy del backend desde `main` fallará el arranque** salvo que se lleve este fix. Decisión de commit/deploy queda para cuando lo indiques.
