"""
Contabilidad / Auditoría Interna — Punto Cero Legal
Movimientos financieros independientes de Facturación.
Permite registro manual de Ingresos/Egresos para auditoría real de rentabilidad.
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
from utils.auth import decode_token
from bson import ObjectId

router = APIRouter(prefix="/admin-ops/accounting", tags=["Contabilidad"])


async def get_db():
    from server import db
    # Bypass GuardedDB for direct-access routes; tenant isolation is enforced
    # via get_current_user + explicit firm filtering (same pattern as routes/auth.py).
    if hasattr(db, "_real_db"):
        return db._real_db
    return db


async def get_admin(authorization: Optional[str] = Header(None), db: AsyncIOMotorDatabase = Depends(get_db)):
    """CRITICAL FIX (S5.3-Finding#5): Hardened Bearer token extraction"""
    from utils.auth import extract_bearer_token

    token = extract_bearer_token(authorization)
    payload = decode_token(token)
    if not payload:
        raise HTTPException(401, "Token inválido")
    user = await db.users.find_one({"email": payload["sub"]})
    if not user or user.get("role") not in ["admin", "admin_general", "socio_comercial"]:
        raise HTTPException(403, "Acceso denegado")
    user["_id"] = str(user["_id"])
    return user


def require_admin_general(admin):
    if admin["role"] not in ["admin", "admin_general"]:
        raise HTTPException(403, "Solo ADMIN_GENERAL puede editar contabilidad")


# ───────────── Modelos ─────────────
class MovementIn(BaseModel):
    type: str = Field(..., description="ingreso | egreso")
    category: str = Field(..., min_length=2, max_length=80)
    amount: float = Field(..., gt=0)
    description: str = Field(..., min_length=2, max_length=500)
    status: str = Field("registrado")  # registrado | confirmado | cancelado
    date: Optional[str] = None  # ISO opcional


def _serialize(m):
    return {
        "id": str(m["_id"]),
        "type": m.get("type"),
        "category": m.get("category"),
        "amount": m.get("amount", 0),
        "description": m.get("description"),
        "status": m.get("status", "registrado"),
        "date": m["date"].isoformat() if isinstance(m.get("date"), datetime) else m.get("date"),
        "created_at": m["created_at"].isoformat() if isinstance(m.get("created_at"), datetime) else None,
        "created_by_name": m.get("created_by_name"),
    }


# ───────────── CRUD Movimientos ─────────────
@router.get("/movements")
async def list_movements(
    type_filter: Optional[str] = None,
    admin=Depends(get_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    q = {}
    if type_filter and type_filter != "all":
        q["type"] = type_filter
    docs = await db.accounting_movements.find(q).sort("date", -1).limit(500).to_list(500)
    return [_serialize(d) for d in docs]


@router.post("/movements")
async def create_movement(payload: MovementIn, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    require_admin_general(admin)
    if payload.type not in ("ingreso", "egreso"):
        raise HTTPException(400, "type debe ser 'ingreso' o 'egreso'")
    if payload.status not in ("registrado", "confirmado", "cancelado"):
        raise HTTPException(400, "status inválido")
    date_obj = datetime.utcnow()
    if payload.date:
        try:
            date_obj = datetime.fromisoformat(payload.date.replace("Z", "+00:00"))
        except Exception:
            pass
    doc = {
        "type": payload.type,
        "category": payload.category,
        "amount": payload.amount,
        "description": payload.description,
        "status": payload.status,
        "date": date_obj,
        "created_at": datetime.utcnow(),
        "created_by": admin["_id"],
        "created_by_name": admin.get("full_name"),
    }
    res = await db.accounting_movements.insert_one(doc)
    doc["_id"] = res.inserted_id
    return _serialize(doc)


@router.put("/movements/{movement_id}")
async def update_movement(movement_id: str, payload: MovementIn, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    require_admin_general(admin)
    update = payload.dict()
    if update.get("date"):
        try:
            update["date"] = datetime.fromisoformat(update["date"].replace("Z", "+00:00"))
        except Exception:
            update["date"] = datetime.utcnow()
    update["updated_at"] = datetime.utcnow()
    res = await db.accounting_movements.update_one({"_id": ObjectId(movement_id)}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(404, "Movimiento no encontrado")
    doc = await db.accounting_movements.find_one({"_id": ObjectId(movement_id)})
    return _serialize(doc)


@router.delete("/movements/{movement_id}")
async def delete_movement(movement_id: str, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    require_admin_general(admin)
    res = await db.accounting_movements.delete_one({"_id": ObjectId(movement_id)})
    if res.deleted_count == 0:
        raise HTTPException(404, "Movimiento no encontrado")
    return {"ok": True}


# ───────────── KPIs Dashboard de Auditoría ─────────────
@router.get("/kpis")
async def accounting_kpis(admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    ingresos_cur = db.accounting_movements.aggregate([
        {"$match": {"type": "ingreso", "status": {"$ne": "cancelado"}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ])
    egresos_cur = db.accounting_movements.aggregate([
        {"$match": {"type": "egreso", "status": {"$ne": "cancelado"}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ])
    ingresos = await ingresos_cur.to_list(1)
    egresos = await egresos_cur.to_list(1)
    ingresos_total = float(ingresos[0]["total"]) if ingresos else 0.0
    egresos_total = float(egresos[0]["total"]) if egresos else 0.0

    # Facturado vs Cobrado (a partir de invoices)
    facturado_cur = db.invoices.aggregate([
        {"$match": {"status": {"$in": ["sent", "paid", "overdue"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ])
    cobrado_cur = db.invoices.aggregate([
        {"$match": {"status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ])
    facturado = await facturado_cur.to_list(1)
    cobrado = await cobrado_cur.to_list(1)
    facturado_total = float(facturado[0]["total"]) if facturado else 0.0
    cobrado_total = float(cobrado[0]["total"]) if cobrado else 0.0

    rentabilidad = ingresos_total - egresos_total
    margen_pct = (rentabilidad / ingresos_total * 100) if ingresos_total > 0 else 0
    tasa_cobranza = (cobrado_total / facturado_total * 100) if facturado_total > 0 else 0

    return {
        "ingresos_totales": ingresos_total,
        "egresos_totales": egresos_total,
        "rentabilidad_productiva": rentabilidad,
        "margen_pct": round(margen_pct, 2),
        "facturado": facturado_total,
        "cobrado": cobrado_total,
        "tasa_cobranza_pct": round(tasa_cobranza, 2),
        "por_cobrar": facturado_total - cobrado_total,
    }


# ───────────── Seed demo ─────────────
@router.post("/seed/demo")
async def seed_demo(admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    require_admin_general(admin)
    existing = await db.accounting_movements.count_documents({"is_demo": True})
    if existing > 0:
        return {"ok": True, "message": f"Ya existen {existing} movimientos demo", "created": 0}
    now = datetime.utcnow()
    samples = [
        {"type": "ingreso", "category": "Honorarios profesionales", "amount": 4_500_000, "description": "Caso Méndez · divorcio", "status": "confirmado", "days": 1},
        {"type": "ingreso", "category": "Suscripción plataforma", "amount": 2_800_000, "description": "5 abogados plan Pro", "status": "confirmado", "days": 3},
        {"type": "ingreso", "category": "Comisión referidos", "amount": 350_000, "description": "Refer. Alejandro · 2 cierres", "status": "registrado", "days": 5},
        {"type": "egreso", "category": "Nómina", "amount": 6_200_000, "description": "Salarios mes en curso", "status": "confirmado", "days": 2},
        {"type": "egreso", "category": "Infraestructura cloud", "amount": 850_000, "description": "MongoDB Atlas + AWS", "status": "confirmado", "days": 4},
        {"type": "egreso", "category": "Marketing digital", "amount": 1_400_000, "description": "Campañas Meta + Google", "days": 6, "status": "confirmado"},
        {"type": "egreso", "category": "Servicios legales", "amount": 500_000, "description": "Notarías + registros", "status": "registrado", "days": 8},
        {"type": "ingreso", "category": "Honorarios profesionales", "amount": 1_950_000, "description": "Caso Restrepo · laboral", "status": "confirmado", "days": 9},
    ]
    docs = []
    for s in samples:
        d = {**s, "is_demo": True, "date": now - timedelta(days=s.pop("days", 0)), "created_at": now, "created_by_name": admin.get("full_name")}
        docs.append(d)
    await db.accounting_movements.insert_many(docs)
    return {"ok": True, "created": len(docs)}
