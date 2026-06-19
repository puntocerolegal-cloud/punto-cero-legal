"""
Sistema de Referidos Punto Cero Legal
"""
from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from utils.auth import decode_token
from bson import ObjectId
import secrets
import os

router = APIRouter(prefix="/referrals", tags=["Referral System"])

async def get_db():
    from server import db
    return db

async def get_current_user(authorization: Optional[str] = Header(None), db: AsyncIOMotorDatabase = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"email": payload["sub"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    return user

def generate_referral_code(name: str) -> str:
    """Genera código tipo: DARWIN-A3B7"""
    prefix = name.split()[0].upper()[:6] if name else "USER"
    suffix = secrets.token_hex(2).upper()
    return f"{prefix}-{suffix}"

@router.get("/my-code")
async def get_my_referral_code(user = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Devuelve el código de referido del usuario (lo genera si no existe)"""
    code = user.get("referral_code")
    if not code:
        code = generate_referral_code(user.get("full_name", "USER"))
        await db.users.update_one(
            {"_id": ObjectId(user["_id"])},
            {"$set": {"referral_code": code, "free_months_credits": 0, "total_referrals": 0}}
        )
    
    # Dominio público real del frontend (configurable). Sin referencias heredadas.
    base_url = os.environ.get("FRONTEND_URL", "https://punto-cero-legal.vercel.app").rstrip("/")
    share_url = f"{base_url}/register?ref={code}"
    
    return {
        "code": code,
        "share_url": share_url,
        "free_months_credits": user.get("free_months_credits", 0),
        "total_referrals": user.get("total_referrals", 0),
        "whatsapp_message": f"Únete a Punto Cero Legal con mi código y obtén el mejor SaaS legal de LATAM: {share_url}"
    }

@router.get("/my-rewards")
async def get_my_rewards(user = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Lista de referidos y recompensas obtenidas"""
    referrals = await db.transactions.find({
        "referrer_id": user["_id"],
        "reward_applied": True
    }).to_list(100)
    
    rewards = []
    for ref in referrals:
        rewards.append({
            "referred_user": ref.get("user_name"),
            "referred_email": ref.get("user_email"),
            "plan": ref.get("plan_id"),
            "country": ref.get("country"),
            "reward_date": ref.get("paid_at", ref.get("created_at")).isoformat() if isinstance(ref.get("paid_at", ref.get("created_at")), datetime) else "",
            "months_awarded": 1
        })
    
    return {
        "total_credits": user.get("free_months_credits", 0),
        "total_referrals": user.get("total_referrals", 0),
        "rewards": rewards
    }

@router.get("/notifications")
async def get_notifications(user = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Notificaciones de recompensas del usuario"""
    notifs = await db.notifications.find({
        "user_id": user["_id"]
    }).sort("created_at", -1).limit(20).to_list(20)
    
    for n in notifs:
        n["_id"] = str(n["_id"])
        if isinstance(n.get("created_at"), datetime):
            n["created_at"] = n["created_at"].isoformat()
    
    unread_count = sum(1 for n in notifs if not n.get("read", False))
    
    return {"notifications": notifs, "unread_count": unread_count}

@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await db.notifications.update_one(
        {"_id": ObjectId(notification_id), "user_id": user["_id"]},
        {"$set": {"read": True}}
    )
    return {"message": "Marcado como leído"}

@router.get("/validate/{code}")
async def validate_referral_code(code: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Valida un código antes del checkout"""
    referrer = await db.users.find_one({"referral_code": code})
    if not referrer:
        return {"valid": False, "message": "Código no válido"}
    return {
        "valid": True,
        "referrer_name": referrer.get("full_name", "Usuario"),
        "message": f"Código válido. {referrer.get('full_name')} obtendrá 1 mes gratis con tu pago."
    }
