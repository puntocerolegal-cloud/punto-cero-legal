# JWT Runtime Fix Report

## Fecha
2026-07-07

## Incidencia
**Signature verification failed** al llamar `/api/ai/chat` después de login.

## Causa Raíz
Inconsistencia en la fuente del secreto JWT entre creación y validación del token:

| Archivo | Variable usada | Fallback hardcodeado |
|---------|---------------|---------------------|
| `backend/utils/auth.py` L10 | `SECRET_KEY` | `your-secret-key-change-this-in-production` |
| `backend/services/enterprise_auth_service.py` L24 | `JWT_SECRET` | `your-secret-key-change-in-production` |
| `backend/kernel/tenant_kernel.py` L87 | `SECRET_KEY` | `your-secret-key-change-this-in-production` |

### Problema concreto
1. `utils/auth.py` (`create_access_token`) firmaba usando `SECRET_KEY` del entorno, o el fallback hardcodeado.
2. `enterprise_auth_service.py` (_generate_access_token / verify_token) firmaba y validaba usando `JWT_SECRET` del entorno (o su propio fallback hardcodeado "your-secret-key-change-in-production").
3. `tenant_kernel.py` validaba JWT usando `SECRET_KEY` con su propio fallback hardcodeado.

**Si `JWT_SECRET` y `SECRET_KEY` no eran idénticos (o si uno estaba ausente y cada archivo caía a su fallback distinto), los tokens firmados por un módulo no podían ser validados por el otro**, causando `Signature verification failed`.

## Archivos Modificados

### 1. `backend/utils/auth.py`
- **Línea original:** `SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-change-this-in-production")`
- **Solución:** Se reemplazó con un resolver unificado que prioriza `JWT_SECRET` > `SECRET_KEY`, y lanza `RuntimeError` al arranque si ninguna está definida.

### 2. `backend/services/enterprise_auth_service.py`
- **Línea original:** `JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")`
- **Solución:** Mismo patrón: resolver unificado con `JWT_SECRET` > `SECRET_KEY`, sin fallback hardcodeado.

### 3. `backend/kernel/tenant_kernel.py`
- **Línea original:** `self.secret_key = os.environ.get("SECRET_KEY", "your-secret-key-change-this-in-production")`
- **Solución:** Mismo patrón: resolver unificado con `JWT_SECRET` > `SECRET_KEY`, sin fallback hardcodeado.

## Solución Aplicada

```python
# En los 3 archivos se aplicó el mismo patrón:
_JWT_SECRET = os.environ.get("JWT_SECRET") or os.environ.get("SECRET_KEY")
if not _JWT_SECRET:
    raise RuntimeError(
        "FATAL: Neither JWT_SECRET nor SECRET_KEY is set in environment. "
        "JWT signing/validation cannot proceed."
    )
# La variable concreta (SECRET_KEY / JWT_SECRET / self.secret_key) se asigna = _JWT_SECRET
```

Esto garantiza:
1. **Fuente única:** Todos los módulos usan exactamente el mismo valor de secreto en runtime.
2. **Compatibilidad hacia atrás:** Si el .env solo define `SECRET_KEY`, todos lo usan. Si define `JWT_SECRET`, tiene prioridad.
3. **Fail-fast:** Si falta la variable de entorno, el servidor no arranca (RuntimeError), en lugar de producir tokens inválidos silenciosamente.
4. **Sin fallback hardcodeado:** Nunca se usará una cadena hardcodeada como secreto.

## Validación Realizada

- [x] Se verificó que `.env` contiene `SECRET_KEY` (no `JWT_SECRET`): los 3 módulos resuelven al mismo valor.
- [x] Se confirmó que `check_env_vars.py` ya valida ambas variables (`JWT_SECRET`, `SECRET_KEY`).
- [x] El servidor arranca correctamente con la variable existente.
- [x] No se modificó estructura de payload JWT (sub, role, user_id, firm_id, exp, v se mantienen).
- [x] No se modificó lógica de login ni registro.

## Compatibilidad

- Usuarios con tokens existentes: **No se rompen**, porque el secreto efectivo no cambió (sigue siendo `SECRET_KEY` del .env).
- Si en producción se define `JWT_SECRET`, este tendrá prioridad, pero se debe migrar todos los tokens existentes (o mantener ambas variables iguales durante la transición).