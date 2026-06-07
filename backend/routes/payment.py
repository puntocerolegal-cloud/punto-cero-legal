"""
Router de Pagos Híbrido Punto Cero Legal
- Mercado Pago para LATAM (CO, MX, AR, BR, CL, PE, UY)
- PayPal para resto del mundo (US, ES, VE, EC, etc.)
"""
from fastapi import APIRouter, HTTPException, Header, Depends, Request, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime, timedelta
import base64
import re
from motor.motor_asyncio import AsyncIOMotorDatabase
from utils.auth import decode_token
from routes.auth import get_current_user
from bson import ObjectId
import uuid
import time
import logging
import httpx

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payment", tags=["Payment Router"])

# ───────────── Localización por país (moneda, término legal, bandera) ─────────────
# `term`: cómo se refiere al profesional ("abogado" vs "licenciado").
# `decimals`: cuántos decimales mostrar (USD/EUR → 2, monedas locales → 0).
COUNTRY_CONFIG = {
    # ── Sudamérica ──
    "Colombia":             {"currency": "COP", "term": "abogado",    "flag": "🇨🇴", "code": "CO"},
    "Argentina":            {"currency": "ARS", "term": "abogado",    "flag": "🇦🇷", "code": "AR"},
    "Chile":                {"currency": "CLP", "term": "abogado",    "flag": "🇨🇱", "code": "CL"},
    "Perú":                 {"currency": "PEN", "term": "abogado",    "flag": "🇵🇪", "code": "PE"},
    "Ecuador":              {"currency": "USD", "term": "abogado",    "flag": "🇪🇨", "code": "EC"},
    "Bolivia":              {"currency": "BOB", "term": "abogado",    "flag": "🇧🇴", "code": "BO"},
    "Venezuela":            {"currency": "USD", "term": "abogado",    "flag": "🇻🇪", "code": "VE"},
    "Paraguay":             {"currency": "PYG", "term": "abogado",    "flag": "🇵🇾", "code": "PY"},
    "Uruguay":              {"currency": "UYU", "term": "abogado",    "flag": "🇺🇾", "code": "UY"},
    # ── Centroamérica ──
    "México":               {"currency": "MXN", "term": "licenciado", "flag": "🇲🇽", "code": "MX"},
    "Guatemala":            {"currency": "GTQ", "term": "licenciado", "flag": "🇬🇹", "code": "GT"},
    "Honduras":             {"currency": "HNL", "term": "licenciado", "flag": "🇭🇳", "code": "HN"},
    "El Salvador":          {"currency": "USD", "term": "licenciado", "flag": "🇸🇻", "code": "SV"},
    "Nicaragua":            {"currency": "NIO", "term": "licenciado", "flag": "🇳🇮", "code": "NI"},
    "Costa Rica":           {"currency": "CRC", "term": "licenciado", "flag": "🇨🇷", "code": "CR"},
    "Panamá":               {"currency": "USD", "term": "licenciado", "flag": "🇵🇦", "code": "PA"},
    # ── El Caribe ──
    "Cuba":                 {"currency": "CUP", "term": "abogado",    "flag": "🇨🇺", "code": "CU"},
    "República Dominicana": {"currency": "DOP", "term": "abogado",    "flag": "🇩🇴", "code": "DO"},
    "Puerto Rico":          {"currency": "USD", "term": "abogado",    "flag": "🇵🇷", "code": "PR"},
    # ── Europa ──
    "España":               {"currency": "EUR", "term": "abogado",    "flag": "🇪🇸", "code": "ES"},
}

DEFAULT_COUNTRY = "Colombia"

# Mapa inverso ISO-3166 alpha-2 → nombre del país (para geolocalización por IP).
CODE_TO_COUNTRY = {cfg["code"]: name for name, cfg in COUNTRY_CONFIG.items()}

# Honorífico habitual según el término legal.
HONORIFIC = {"abogado": "Dr.", "licenciado": "Lic."}

# Denominación EXACTA por país: símbolo (prefijo) + etiqueta (sufijo).
# Formato resultante: "{symbol}{importe} {code}"  → "$75.000 COP", "S/ 180 Soles".
DENOMINATION = {
    "Colombia":             {"symbol": "$",     "code": "COP"},
    "México":               {"symbol": "$",     "code": "MXN"},
    "Argentina":            {"symbol": "$",     "code": "ARS"},
    "Chile":                {"symbol": "$",     "code": "CLP"},
    "Perú":                 {"symbol": "S/ ",   "code": "Soles"},
    "Ecuador":              {"symbol": "$",     "code": "USD"},
    "Bolivia":              {"symbol": "Bs. ",  "code": "BOB"},
    "Venezuela":            {"symbol": "$",     "code": "USD"},
    "Paraguay":             {"symbol": "₲ ",    "code": "PYG"},
    "Uruguay":              {"symbol": "$",     "code": "UYU"},
    "Guatemala":            {"symbol": "Q ",    "code": "GTQ"},
    "Honduras":             {"symbol": "L ",    "code": "HNL"},
    "El Salvador":          {"symbol": "$",     "code": "USD"},
    "Nicaragua":            {"symbol": "C$ ",   "code": "NIO"},
    "Costa Rica":           {"symbol": "₡ ",    "code": "CRC"},
    "Panamá":               {"symbol": "B/. ",  "code": "USD"},
    "Cuba":                 {"symbol": "$",     "code": "CUP"},
    "República Dominicana": {"symbol": "RD$ ",  "code": "DOP"},
    "Puerto Rico":          {"symbol": "$",     "code": "USD"},
    "España":               {"symbol": "€ ",    "code": "EUR"},
}


def _currency_decimals(currency: str) -> int:
    return 2 if currency in ("USD", "EUR") else 0


def _fmt_number(value, decimals: int) -> str:
    """Formato es-LA: punto de miles y coma decimal (75000 → '75.000')."""
    s = f"{value:,.{decimals}f}"  # estilo en-US: 75,000.00
    return s.replace(",", "§").replace(".", ",").replace("§", ".")


def format_money(amount, country: str) -> str:
    """Cadena con la denominación exacta del país. Ej: '$75.000 COP'."""
    cfg = COUNTRY_CONFIG.get(country, COUNTRY_CONFIG[DEFAULT_COUNTRY])
    den = DENOMINATION.get(country, {"symbol": "$", "code": cfg["currency"]})
    decimals = _currency_decimals(cfg["currency"])
    return f"{den['symbol']}{_fmt_number(amount, decimals)} {den['code']}"

# Tasas de respaldo (1 COP → moneda) si la API en vivo falla. Aproximadas.
FALLBACK_RATES = {
    "COP": 1, "USD": 0.00025, "EUR": 0.00023, "ARS": 0.40, "CLP": 0.24,
    "PEN": 0.00094, "BOB": 0.0017, "PYG": 1.85, "UYU": 0.0105, "MXN": 0.0046,
    "GTQ": 0.0019, "HNL": 0.0062, "NIO": 0.0092, "CRC": 0.13, "CUP": 0.03,
    "DOP": 0.015,
}

# Caché en memoria de las tasas (base COP) con TTL.
_rate_cache = {"ts": 0.0, "rates": {}}
_RATE_TTL_SECONDS = 6 * 3600  # 6 horas


async def get_exchange_rates():
    """Devuelve tasas COP→moneda usando exchangerate-api.com (en vivo, cacheado 6h).

    Si la API falla y no hay caché, usa FALLBACK_RATES para no romper la UI.
    """
    now = time.time()
    if _rate_cache["rates"] and (now - _rate_cache["ts"]) < _RATE_TTL_SECONDS:
        return _rate_cache["rates"]
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get("https://api.exchangerate-api.com/v4/latest/COP")
            resp.raise_for_status()
            rates = resp.json().get("rates", {})
            if rates:
                _rate_cache["rates"] = rates
                _rate_cache["ts"] = now
                return rates
    except Exception as e:  # noqa: BLE001
        logger.warning("No se pudieron obtener tasas en vivo: %s", e)
    return _rate_cache["rates"] or FALLBACK_RATES


def _client_ip(request: Request) -> Optional[str]:
    """Extrae la IP real del cliente respetando proxies."""
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else None


async def detect_country_by_ip(request: Request) -> Optional[str]:
    """Geolocaliza el país por IP (fallback cuando el perfil no tiene país)."""
    ip = _client_ip(request)
    if not ip or ip.startswith(("127.", "10.", "192.168.", "172.")) or ip == "::1":
        return None
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"http://ip-api.com/json/{ip}?fields=status,countryCode")
            data = resp.json()
            if data.get("status") == "success":
                return CODE_TO_COUNTRY.get(data.get("countryCode"))
    except Exception as e:  # noqa: BLE001
        logger.warning("Geolocalización por IP falló: %s", e)
    return None


async def resolve_country(current: dict, request: Request) -> str:
    """Determina el país del abogado: perfil → IP → Colombia."""
    country = (current or {}).get("country")
    if country in COUNTRY_CONFIG:
        return country
    detected = await detect_country_by_ip(request)
    return detected if detected in COUNTRY_CONFIG else DEFAULT_COUNTRY


def build_locale(country: str) -> dict:
    """Construye los metadatos de localización para el frontend."""
    cfg = COUNTRY_CONFIG.get(country, COUNTRY_CONFIG[DEFAULT_COUNTRY])
    term = cfg["term"]
    return {
        "country": country,
        "country_code": cfg["code"],
        "flag": cfg["flag"],
        "currency": cfg["currency"],
        "term": term,                       # "abogado" | "licenciado"
        "term_cap": term.capitalize(),       # "Abogado" | "Licenciado"
        "term_plural": term + "s",           # "abogados" | "licenciados"
        "honorific": HONORIFIC[term],        # "Dr." | "Lic."
    }


def localize_plan(plan: dict, country: str, rates: dict) -> dict:
    """Añade precios (mensual y anual) en moneda local, con la denominación
    exacta del país y la bandera. El plan anual = 11 meses (1 mes gratis)."""
    cfg = COUNTRY_CONFIG.get(country, COUNTRY_CONFIG[DEFAULT_COUNTRY])
    den = DENOMINATION.get(country, {"symbol": "$", "code": cfg["currency"]})
    currency = cfg["currency"]
    rate = rates.get(currency) or FALLBACK_RATES.get(currency, 1)
    decimals = _currency_decimals(currency)

    def conv(cop_amount):
        raw = cop_amount * rate
        return round(raw, 2) if decimals else round(raw)

    monthly_cop = plan["price_cop"]
    annual_cop = monthly_cop * 11  # 12 meses al precio de 11 → 1 mes gratis

    monthly_local = conv(monthly_cop)
    annual_local = conv(annual_cop)
    annual_eq = round(annual_local / 12, 2) if decimals else round(annual_local / 12)

    return {
        **plan,
        "flag": cfg["flag"],
        "currency": currency,
        "symbol": den["symbol"],
        "code_label": den["code"],
        "decimals": decimals,
        # Compatibilidad: price_local/price_display = mensual
        "price_local": monthly_local,
        "price_display": format_money(monthly_local, country),
        "monthly": {
            "amount": monthly_local,
            "display": format_money(monthly_local, country),
        },
        "annual": {
            "amount": annual_local,
            "display": format_money(annual_local, country),
            "monthly_equivalent": annual_eq,
            "monthly_equivalent_display": format_money(annual_eq, country),
            "savings_amount": monthly_local,             # ahorro = 1 mes
            "savings_display": format_money(monthly_local, country),
        },
    }

# Catálogo comercial — fuente única de verdad de los planes (nombre, precio, features).
# La clave es el `plan_id` que se guarda en el perfil del abogado (users.plan_id).
PLAN_CATALOG = {
    "esencial": {
        "id": "esencial",
        "name": "El Despegue",
        "price_cop": 75000,
        "processes": "Hasta 50 casos",
        "color": "#3b82f6",
        "description": "Para abogados independientes que inician",
        "features": [
            "Directorio de Clientes", "Hasta 50 casos activos", "CRM Básico",
            "Agenda Personal", "IA Redacción",
        ],
    },
    "profesional": {
        "id": "profesional",
        "name": "El Salto Estratégico",
        "price_cop": 140000,
        "processes": "Hasta 150 casos",
        "color": "#f97316",
        "description": "La elección de los abogados exitosos",
        "features": [
            "Directorio de Clientes", "Hasta 150 casos activos", "CRM Avanzado",
            "Agenda Bidireccional", "IA Análisis de Documentos",
            "Sala de Conferencias HD", "Facturación Automática",
        ],
    },
    "elite": {
        "id": "elite",
        "name": "Firma en Crecimiento",
        "price_cop": 195000,
        "processes": "Procesos Ilimitados",
        "color": "#8b5cf6",
        "description": "Para firmas en crecimiento",
        "features": [
            "Directorio de Clientes", "Procesos Ilimitados", "CRM Pro Automatizado",
            "Multi Agenda", "IA Pro Jurisprudencia", "Conferencias HD con Grabación",
            "Inteligencia Financiera",
        ],
    },
    "ilimitado": {
        "id": "ilimitado",
        "name": "Consolidación Empresarial",
        "price_cop": 275000,
        "processes": "Procesos Ilimitados",
        "color": "#10b981",
        "description": "Para firmas y bufetes consolidados",
        "features": [
            "Directorio de Clientes", "Procesos Ilimitados", "CRM Empresarial",
            "API Personalizada", "IA Ilimitada", "Soporte Dedicado", "SLA Garantizado",
        ],
    },
}

# Países donde Mercado Pago opera de forma nativa
MERCADO_PAGO_COUNTRIES = {
    "Colombia": "CO", "México": "MX", "Argentina": "AR", "Brasil": "BR",
    "Chile": "CL", "Perú": "PE", "Uruguay": "UY"
}

# Resto va por PayPal
PAYPAL_COUNTRIES = {
    "Estados Unidos": "US", "España": "ES", "Venezuela": "VE", "Ecuador": "EC",
    "Bolivia": "BO", "Paraguay": "PY", "Costa Rica": "CR", "Panamá": "PA",
    "República Dominicana": "DO", "Guatemala": "GT", "El Salvador": "SV"
}

# Precios en COP por plan
PLAN_PRICES_COP = {
    "esencial": {"monthly": 75000, "annual": 75000 * 11, "processes": 20},
    "profesional": {"monthly": 140000, "annual": 140000 * 11, "processes": 60},
    "elite": {"monthly": 195000, "annual": 195000 * 11, "processes": 100},
    "ilimitado": {"monthly": 275000, "annual": 275000 * 11, "processes": -1},
}

# Conversiones aproximadas (en producción usar API real)
EXCHANGE_RATES = {
    "COP": 1, "USD": 0.00026, "MXN": 0.0044, "ARS": 0.26, "BRL": 0.0013,
    "CLP": 0.24, "PEN": 0.00096, "EUR": 0.00024
}

COUNTRY_CURRENCY = {
    "Colombia": "COP", "México": "MXN", "Argentina": "ARS", "Brasil": "BRL",
    "Chile": "CLP", "Perú": "PEN", "Uruguay": "USD",
    "Estados Unidos": "USD", "España": "EUR", "Venezuela": "USD",
    "Ecuador": "USD", "Bolivia": "USD", "Paraguay": "USD",
    "Costa Rica": "USD", "Panamá": "USD", "República Dominicana": "USD",
    "Guatemala": "USD", "El Salvador": "USD"
}

class PaymentInitRequest(BaseModel):
    plan_id: Literal["esencial", "profesional", "elite", "ilimitado"]
    billing_cycle: Literal["monthly", "annual"] = "monthly"
    country: str
    user_email: str
    user_name: str
    referral_code: Optional[str] = None

class PaymentInitResponse(BaseModel):
    gateway: Literal["mercado_pago", "paypal"]
    checkout_url: str
    payment_id: str
    amount_original: float
    amount_local: float
    currency: str
    plan: dict
    expires_at: str

async def get_db():
    from server import db
    return db

@router.get("/detect-gateway")
async def detect_gateway(country: str):
    """Detecta qué pasarela usar según el país"""
    if country in MERCADO_PAGO_COUNTRIES:
        return {"gateway": "mercado_pago", "country_code": MERCADO_PAGO_COUNTRIES[country], "supported": True}
    elif country in PAYPAL_COUNTRIES:
        return {"gateway": "paypal", "country_code": PAYPAL_COUNTRIES[country], "supported": True}
    else:
        return {"gateway": "paypal", "country_code": "INTL", "supported": True, "note": "Default fallback"}

# ───────────── Métodos de pago por país ─────────────
# Métodos alternativos (manuales) según el país. El gateway principal
# (Mercado Pago / PayPal) se antepone automáticamente.
COUNTRY_ALT_METHODS = {
    "Colombia":             ["Nequi", "Daviplata", "PSE", "Transferencia bancaria"],
    "México":               ["OXXO", "SPEI", "Transferencia bancaria"],
    "Argentina":            ["Transferencia CBU"],
    "Chile":                ["Webpay", "Transferencia bancaria"],
    "Perú":                 ["Yape", "Plin", "Transferencia bancaria"],
    "Ecuador":              ["Transferencia bancaria"],
    "Guatemala":            ["Tigo Money", "Transferencia bancaria"],
    "Honduras":             ["Tigo Money", "Transferencia bancaria"],
    "Nicaragua":            ["Tigo Money", "Transferencia bancaria"],
    "Costa Rica":           ["SINPE Móvil", "Transferencia bancaria"],
    "Panamá":               ["Yappy", "Transferencia bancaria"],
    "El Salvador":          ["Yappy", "Transferencia bancaria"],
    "República Dominicana": ["Transferencia bancaria"],
    "España":               ["Transferencia SEPA", "Bizum"],
}
DEFAULT_ALT_METHODS = ["Transferencia bancaria internacional"]


def _slug(name: str) -> str:
    s = name.lower()
    for a, b in {"á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u", "ñ": "n", "ü": "u"}.items():
        s = s.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "_", s).strip("_")


def build_payment_methods(country: str):
    """Devuelve (gateway_principal, lista_de_métodos) para el país."""
    methods = []
    if country in MERCADO_PAGO_COUNTRIES:
        gateway = "mercado_pago"
        methods.append({
            "id": "mercado_pago", "name": "Mercado Pago", "type": "gateway",
            "gateway": "mercado_pago", "requires_receipt": False,
            "description": "Tarjeta, débito y cuotas", "color": "#009ee3",
        })
    else:
        gateway = "paypal"
        methods.append({
            "id": "paypal", "name": "PayPal", "type": "gateway",
            "gateway": "paypal", "requires_receipt": False,
            "description": "Tarjeta o saldo PayPal", "color": "#003087",
        })

    for name in COUNTRY_ALT_METHODS.get(country, DEFAULT_ALT_METHODS):
        methods.append({
            "id": _slug(name), "name": name, "type": "manual",
            "requires_receipt": True,
            "description": "Paga y adjunta tu comprobante para verificación",
        })
    return gateway, methods


@router.get("/methods")
async def get_payment_methods(country: Optional[str] = None):
    """Métodos de pago disponibles para el país (gateway + alternativos)."""
    resolved = country if country in COUNTRY_CONFIG else DEFAULT_COUNTRY
    gateway, methods = build_payment_methods(resolved)
    return {
        "country": resolved,
        "flag": COUNTRY_CONFIG[resolved]["flag"],
        "gateway": gateway,
        "methods": methods,
    }


# ───────────── Comprobante de pago manual ─────────────
ALLOWED_RECEIPT_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"}
MAX_RECEIPT_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/receipt")
async def upload_payment_receipt(
    plan_id: str = Form(...),
    billing_cycle: str = Form("monthly"),
    method: str = Form(...),
    country: str = Form(...),
    amount: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Recibe el comprobante de un pago manual (transferencia, billetera, depósito),
    lo almacena y notifica al admin para verificación manual."""
    if file.content_type not in ALLOWED_RECEIPT_TYPES:
        raise HTTPException(400, "Formato no permitido. Sube una imagen (PNG/JPG/WEBP) o un PDF.")

    data = await file.read()
    if not data:
        raise HTTPException(400, "El archivo está vacío.")
    if len(data) > MAX_RECEIPT_BYTES:
        raise HTTPException(400, "El archivo supera el límite de 10 MB.")

    plan = PLAN_CATALOG.get(plan_id)
    now = datetime.utcnow()
    receipt = {
        "user_id": str(current["_id"]),
        "user_email": current.get("email"),
        "user_name": current.get("full_name"),
        "plan_id": plan_id,
        "plan_name": plan["name"] if plan else plan_id,
        "billing_cycle": billing_cycle,
        "method": method,
        "country": country,
        "amount": amount,
        "filename": file.filename,
        "content_type": file.content_type,
        "size_bytes": len(data),
        "content_b64": base64.b64encode(data).decode("ascii"),
        "status": "pending_verification",
        "created_at": now,
    }
    res = await db.receipts.insert_one(receipt)
    receipt_id = str(res.inserted_id)

    # Marcar la suscripción del abogado como "en revisión"
    await db.users.update_one(
        {"_id": current["_id"]},
        {"$set": {"subscription_status": "pending_verification", "pending_plan_id": plan_id}},
    )

    # Notificar al panel admin
    await db.notifications.insert_one({
        "target": "admin",
        "type": "payment_receipt",
        "title": "Comprobante de pago por verificar",
        "message": f"{current.get('full_name')} envió un comprobante para el plan "
                   f"{receipt['plan_name']} ({method}, {amount or 's/monto'}).",
        "receipt_id": receipt_id,
        "user_id": str(current["_id"]),
        "read": False,
        "created_at": now,
    })

    return {
        "ok": True,
        "receipt_id": receipt_id,
        "status": "pending_verification",
        "message": "Comprobante recibido. Nuestro equipo verificará tu pago y activará tu plan en breve.",
    }


@router.get("/catalog")
async def get_catalog(country: Optional[str] = None):
    """Catálogo de planes localizado por país (moneda local + bandera)."""
    resolved = country if country in COUNTRY_CONFIG else DEFAULT_COUNTRY
    rates = await get_exchange_rates()
    plans = [localize_plan(p, resolved, rates) for p in PLAN_CATALOG.values()]
    return {"locale": build_locale(resolved), "plans": plans}


@router.get("/my-plan")
async def get_my_plan(request: Request, current = Depends(get_current_user)):
    """Devuelve el plan contratado por el abogado autenticado, leído de su perfil,
    con precios en su moneda local y el vocabulario legal de su país.

    País: perfil del abogado → geolocalización por IP → Colombia (fallback).
    `users.plan_id` se establece al confirmarse el pago (ver /payment/confirm).
    Si aún no tiene plan (período de prueba), `has_plan=False`.
    """
    country = await resolve_country(current, request)
    rates = await get_exchange_rates()

    plan_id = current.get("plan_id")
    base_plan = PLAN_CATALOG.get(plan_id)
    plan = localize_plan(base_plan, country, rates) if base_plan else None

    subscription_status = current.get("subscription_status")
    if not subscription_status:
        subscription_status = "active" if plan else "trial"

    # Prueba gratuita de 7 días contada desde el registro (created_at).
    created = current.get("created_at")
    now = datetime.utcnow()
    trial_started_at = trial_ends_at = None
    trial_active = False
    if isinstance(created, datetime):
        # Sufijo 'Z' → el frontend lo interpreta como UTC (created_at es naive UTC).
        trial_started_at = created.isoformat() + "Z"
        ends = created + timedelta(days=7)
        trial_ends_at = ends.isoformat() + "Z"
        trial_active = (not plan) and (now < ends)

    return {
        "has_plan": bool(plan),
        "plan_id": plan_id,
        "subscription_status": subscription_status,
        "locale": build_locale(country),
        "plan": plan,
        "catalog": [localize_plan(p, country, rates) for p in PLAN_CATALOG.values()],
        "trial": {
            "started_at": trial_started_at,
            "ends_at": trial_ends_at,
            "active": trial_active,
            "duration_days": 7,
        },
        "server_time": now.isoformat(),
    }


@router.get("/plans")
async def get_plans(country: str = "Colombia", billing_cycle: str = "monthly"):
    """Devuelve precios localizados según país y ciclo"""
    currency = COUNTRY_CURRENCY.get(country, "USD")
    rate = EXCHANGE_RATES.get(currency, EXCHANGE_RATES["USD"])
    
    plans = []
    for plan_id, prices in PLAN_PRICES_COP.items():
        cop_price = prices[billing_cycle]
        local_price = round(cop_price * rate, 2) if currency != "COP" else cop_price
        
        # Anual: precio total con descuento (1 mes gratis)
        monthly_eq = local_price / 12 if billing_cycle == "annual" else local_price
        
        plans.append({
            "id": plan_id,
            "name": plan_id.capitalize(),
            "price_cop": cop_price,
            "price_local": local_price,
            "monthly_equivalent": round(monthly_eq, 2),
            "currency": currency,
            "billing_cycle": billing_cycle,
            "processes": prices["processes"],
            "savings_label": "1 mes gratis" if billing_cycle == "annual" else None
        })
    
    return {
        "country": country,
        "currency": currency,
        "billing_cycle": billing_cycle,
        "plans": plans,
        "gateway": "mercado_pago" if country in MERCADO_PAGO_COUNTRIES else "paypal"
    }

@router.post("/init", response_model=PaymentInitResponse)
async def init_payment(request: PaymentInitRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Inicializa un pago según país y plan. Router inteligente."""
    plan_data = PLAN_PRICES_COP.get(request.plan_id)
    if not plan_data:
        raise HTTPException(status_code=400, detail="Plan no válido")
    
    cop_amount = plan_data[request.billing_cycle]
    currency = COUNTRY_CURRENCY.get(request.country, "USD")
    rate = EXCHANGE_RATES.get(currency, EXCHANGE_RATES["USD"])
    local_amount = round(cop_amount * rate, 2) if currency != "COP" else cop_amount
    
    gateway = "mercado_pago" if request.country in MERCADO_PAGO_COUNTRIES else "paypal"
    payment_id = f"PCL-{uuid.uuid4().hex[:12].upper()}"
    
    # Generar URL de checkout según gateway
    # En producción aquí se integraría con SDK real de Mercado Pago/PayPal
    if gateway == "mercado_pago":
        checkout_url = f"https://www.mercadopago.com/checkout/v1/redirect?pref_id={payment_id}&country={MERCADO_PAGO_COUNTRIES[request.country]}"
    else:
        checkout_url = f"https://www.paypal.com/checkoutnow?token={payment_id}&country={request.country}"
    
    # Guardar transacción pendiente
    transaction = {
        "payment_id": payment_id,
        "user_email": request.user_email,
        "user_name": request.user_name,
        "plan_id": request.plan_id,
        "billing_cycle": request.billing_cycle,
        "amount_cop": cop_amount,
        "amount_local": local_amount,
        "currency": currency,
        "country": request.country,
        "gateway": gateway,
        "status": "pending",
        "checkout_url": checkout_url,
        "referral_code": request.referral_code,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=24)
    }
    
    await db.transactions.insert_one(transaction)
    
    return PaymentInitResponse(
        gateway=gateway,
        checkout_url=checkout_url,
        payment_id=payment_id,
        amount_original=cop_amount,
        amount_local=local_amount,
        currency=currency,
        plan={
            "id": request.plan_id,
            "name": request.plan_id.capitalize(),
            "processes": plan_data["processes"],
            "billing_cycle": request.billing_cycle
        },
        expires_at=transaction["expires_at"].isoformat()
    )

@router.post("/confirm/{payment_id}")
async def confirm_payment(payment_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Confirma pago (webhook simulado). Aplica lógica de referidos."""
    transaction = await db.transactions.find_one({"payment_id": payment_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    
    if transaction["status"] == "paid":
        return {"message": "Ya confirmado", "payment_id": payment_id}
    
    # Marcar como pagado
    await db.transactions.update_one(
        {"payment_id": payment_id},
        {"$set": {"status": "paid", "paid_at": datetime.utcnow()}}
    )
    
    # Crear/actualizar usuario
    user = await db.users.find_one({"email": transaction["user_email"]})
    if user:
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"plan_id": transaction["plan_id"], "subscription_status": "active"}}
        )
        user_id = str(user["_id"])
    else:
        user_id = None
    
    # APLICAR LÓGICA DE REFERIDOS
    reward_applied = False
    if transaction.get("referral_code") and user_id:
        referrer = await db.users.find_one({"referral_code": transaction["referral_code"]})
        if referrer and str(referrer["_id"]) != user_id:
            # Otorgar 1 mes gratis al referente
            current_credits = referrer.get("free_months_credits", 0)
            current_referrals = referrer.get("total_referrals", 0)
            
            await db.users.update_one(
                {"_id": referrer["_id"]},
                {"$set": {
                    "free_months_credits": current_credits + 1,
                    "total_referrals": current_referrals + 1,
                    "last_referral_at": datetime.utcnow()
                }}
            )
            
            # Crear notificación
            await db.notifications.insert_one({
                "user_id": str(referrer["_id"]),
                "type": "referral_reward",
                "title": "🎉 ¡Has ganado 1 mes gratis!",
                "message": f"{transaction['user_name']} completó su pago. Tu recompensa ya está activa.",
                "read": False,
                "created_at": datetime.utcnow()
            })
            
            # Marcar la transacción como referida
            await db.transactions.update_one(
                {"payment_id": payment_id},
                {"$set": {"referrer_id": str(referrer["_id"]), "reward_applied": True}}
            )
            
            reward_applied = True
    
    return {
        "message": "Pago confirmado exitosamente",
        "payment_id": payment_id,
        "status": "paid",
        "reward_applied_to_referrer": reward_applied
    }
