"""
Router de Pagos Híbrido Punto Cero Legal
- Mercado Pago para LATAM (CO, MX, AR, BR, CL, PE, UY)
- PayPal para resto del mundo (US, ES, VE, EC, etc.)
"""
from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from utils.auth import decode_token
from bson import ObjectId
import uuid

router = APIRouter(prefix="/payment", tags=["Payment Router"])

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
