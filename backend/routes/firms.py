from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.firm import Firm, FirmCreate, FirmUpdate, FirmResponse
from routes.auth import get_current_user
from bson import ObjectId

router = APIRouter(prefix="/firms", tags=["Firm OS"])

async def get_db():
    from server import db
    return db

# GET /firms - Listar todas las firmas (admin only)
@router.get("/", response_model=List[FirmResponse], status_code=status.HTTP_200_OK)
async def list_firms(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Listar todas las firmas registradas (solo admin)"""
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden listar firmas")
    
    firms = await db.firms.find().sort("created_at", -1).to_list(None)
    return [
        FirmResponse(
            id=str(firm["_id"]),
            name=firm["name"],
            email=firm["email"],
            plan=firm["plan"],
            max_lawyers=firm["max_lawyers"],
            active_lawyers_count=firm.get("active_lawyers_count", 0),
            owner_name=firm["owner_name"],
            owner_email=firm["owner_email"],
            status=firm["status"],
            is_verified=firm["is_verified"],
            created_at=firm["created_at"].isoformat() if isinstance(firm["created_at"], datetime) else firm["created_at"],
            updated_at=firm["updated_at"].isoformat() if isinstance(firm["updated_at"], datetime) else firm["updated_at"]
        )
        for firm in firms
    ]

# POST /firms - Crear nueva firma
@router.post("/", response_model=FirmResponse, status_code=status.HTTP_201_CREATED)
async def create_firm(
    firm_data: FirmCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Crear nueva firma (solo admin)"""
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden crear firmas")
    
    # Verificar que el owner existe
    owner = await db.users.find_one({"_id": ObjectId(firm_data.owner_id)})
    if not owner:
        raise HTTPException(status_code=404, detail="Usuario propietario no encontrado")
    
    # Verificar que no exista firma con mismo email
    existing = await db.firms.find_one({"email": firm_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una firma con este email")
    
    firm_doc = {
        "name": firm_data.name,
        "email": firm_data.email,
        "phone": firm_data.phone,
        "address": firm_data.address,
        "city": firm_data.city,
        "country": firm_data.country or "Colombia",
        "plan": firm_data.plan,
        "max_lawyers": 5 if firm_data.plan == "firm_growth" else 20,
        "active_lawyers_count": 0,
        "owner_id": firm_data.owner_id,
        "owner_name": owner.get("full_name", ""),
        "owner_email": owner.get("email", ""),
        "status": "active",
        "is_verified": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    result = await db.firms.insert_one(firm_doc)
    
    # Actualizar usuario propietario: asignar firm_id y role = firm_owner
    await db.users.update_one(
        {"_id": ObjectId(firm_data.owner_id)},
        {"$set": {
            "firm_id": str(result.inserted_id),
            "role": "firm_owner",
            "updated_at": datetime.utcnow()
        }}
    )
    
    return FirmResponse(
        id=str(result.inserted_id),
        name=firm_doc["name"],
        email=firm_doc["email"],
        plan=firm_doc["plan"],
        max_lawyers=firm_doc["max_lawyers"],
        active_lawyers_count=0,
        owner_name=firm_doc["owner_name"],
        owner_email=firm_doc["owner_email"],
        status=firm_doc["status"],
        is_verified=False,
        created_at=firm_doc["created_at"].isoformat(),
        updated_at=firm_doc["updated_at"].isoformat()
    )

# GET /firms/:id - Obtener firma por ID
@router.get("/{firm_id}", response_model=FirmResponse, status_code=status.HTTP_200_OK)
async def get_firm(
    firm_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener detalles de una firma"""
    try:
        oid = ObjectId(firm_id)
    except:
        raise HTTPException(status_code=400, detail="ID de firma inválido")
    
    firm = await db.firms.find_one({"_id": oid})
    if not firm:
        raise HTTPException(status_code=404, detail="Firma no encontrada")
    
    # Validación: solo owner, admin de la firma o admin global pueden ver
    if current_user.get("role") not in ["admin", "admin_general"]:
        if current_user.get("firm_id") != firm_id and str(current_user.get("_id")) != firm.get("owner_id"):
            raise HTTPException(status_code=403, detail="No tienes permiso para ver esta firma")
    
    return FirmResponse(
        id=str(firm["_id"]),
        name=firm["name"],
        email=firm["email"],
        plan=firm["plan"],
        max_lawyers=firm["max_lawyers"],
        active_lawyers_count=firm.get("active_lawyers_count", 0),
        owner_name=firm["owner_name"],
        owner_email=firm["owner_email"],
        status=firm["status"],
        is_verified=firm["is_verified"],
        created_at=firm["created_at"].isoformat() if isinstance(firm["created_at"], datetime) else firm["created_at"],
        updated_at=firm["updated_at"].isoformat() if isinstance(firm["updated_at"], datetime) else firm["updated_at"]
    )

# PATCH /firms/:id - Actualizar firma
@router.patch("/{firm_id}", response_model=FirmResponse, status_code=status.HTTP_200_OK)
async def update_firm(
    firm_id: str,
    firm_update: FirmUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Actualizar detalles de una firma"""
    try:
        oid = ObjectId(firm_id)
    except:
        raise HTTPException(status_code=400, detail="ID de firma inválido")
    
    firm = await db.firms.find_one({"_id": oid})
    if not firm:
        raise HTTPException(status_code=404, detail="Firma no encontrada")
    
    # Solo owner o admin puede actualizar
    if current_user.get("role") not in ["admin", "admin_general"]:
        if str(current_user.get("_id")) != firm.get("owner_id"):
            raise HTTPException(status_code=403, detail="No tienes permiso para actualizar esta firma")
    
    update_data = {k: v for k, v in firm_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.firms.update_one({"_id": oid}, {"$set": update_data})
    
    updated_firm = await db.firms.find_one({"_id": oid})
    return FirmResponse(
        id=str(updated_firm["_id"]),
        name=updated_firm["name"],
        email=updated_firm["email"],
        plan=updated_firm["plan"],
        max_lawyers=updated_firm["max_lawyers"],
        active_lawyers_count=updated_firm.get("active_lawyers_count", 0),
        owner_name=updated_firm["owner_name"],
        owner_email=updated_firm["owner_email"],
        status=updated_firm["status"],
        is_verified=updated_firm["is_verified"],
        created_at=updated_firm["created_at"].isoformat() if isinstance(updated_firm["created_at"], datetime) else updated_firm["created_at"],
        updated_at=updated_firm["updated_at"].isoformat() if isinstance(updated_firm["updated_at"], datetime) else updated_firm["updated_at"]
    )

# GET /firms/:id/lawyers - Obtener abogados de una firma
@router.get("/{firm_id}/lawyers", status_code=status.HTTP_200_OK)
async def get_firm_lawyers(
    firm_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener todos los abogados de una firma"""
    try:
        oid = ObjectId(firm_id)
    except:
        raise HTTPException(status_code=400, detail="ID de firma inválido")

    firm = await db.firms.find_one({"_id": oid})
    if not firm:
        raise HTTPException(status_code=404, detail="Firma no encontrada")

    # Access control
    if current_user.get("role") not in ["admin", "admin_general"]:
        if current_user.get("firm_id") != firm_id and str(current_user.get("_id")) != firm.get("owner_id"):
            raise HTTPException(status_code=403, detail="No tienes permiso para ver estos abogados")

    # Get lawyers from this firm
    lawyers = await db.users.find({
        "firm_id": firm_id,
        "role": {"$in": ["firm_lawyer", "lawyer"]}
    }).to_list(None)

    result = []
    for lawyer in lawyers:
        # Get lawyer's cases
        cases = await db.cases.find({"lawyer_id": str(lawyer["_id"])}).to_list(None)

        # Calculate revenue from commissions
        case_ids = [str(c["_id"]) for c in cases]
        commissions = await db.commissions.find({
            "case_id": {"$in": case_ids}
        }).to_list(None) if case_ids else []

        revenue = sum(c.get("amount", 0) for c in commissions)

        result.append({
            "id": str(lawyer["_id"]),
            "name": lawyer.get("full_name"),
            "specialty": lawyer.get("specialty"),
            "email": lawyer.get("email"),
            "phone": lawyer.get("phone"),
            "active_cases": len([c for c in cases if c.get("status") in ["open", "in_progress"]]),
            "total_cases": len(cases),
            "revenue": round(revenue, 2),
        })

    return {
        "success": True,
        "data": result,
        "count": len(result),
    }

# GET /firms/:id/cases - Obtener casos de una firma
@router.get("/{firm_id}/cases", status_code=status.HTTP_200_OK)
async def get_firm_cases(
    firm_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener todos los casos de una firma"""
    try:
        oid = ObjectId(firm_id)
    except:
        raise HTTPException(status_code=400, detail="ID de firma inválido")

    firm = await db.firms.find_one({"_id": oid})
    if not firm:
        raise HTTPException(status_code=404, detail="Firma no encontrada")

    # Access control
    if current_user.get("role") not in ["admin", "admin_general"]:
        if current_user.get("firm_id") != firm_id and str(current_user.get("_id")) != firm.get("owner_id"):
            raise HTTPException(status_code=403, detail="No tienes permiso para ver estos casos")

    # Get lawyers from this firm
    lawyers = await db.users.find({
        "firm_id": firm_id,
        "role": {"$in": ["firm_lawyer", "lawyer"]}
    }).to_list(None)
    lawyer_ids = [str(l["_id"]) for l in lawyers]

    # Get cases for these lawyers
    cases = await db.cases.find({
        "lawyer_id": {"$in": lawyer_ids}
    }).sort("created_at", -1).to_list(None)

    result = []
    for case in cases:
        result.append({
            "id": str(case["_id"]),
            "case_number": case.get("case_number", ""),
            "client_name": case.get("client_name", ""),
            "matter": case.get("matter", ""),
            "status": case.get("status", "open"),
            "estado": case.get("estado", ""),
            "lawyer_id": case.get("lawyer_id"),
            "created_at": case.get("created_at").isoformat() if isinstance(case.get("created_at"), datetime) else case.get("created_at"),
        })

    return {
        "success": True,
        "data": result,
        "count": len(result),
    }

# GET /firms/:id/clients - Obtener clientes de una firma
@router.get("/{firm_id}/clients", status_code=status.HTTP_200_OK)
async def get_firm_clients(
    firm_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener todos los clientes únicos de una firma"""
    try:
        oid = ObjectId(firm_id)
    except:
        raise HTTPException(status_code=400, detail="ID de firma inválido")

    firm = await db.firms.find_one({"_id": oid})
    if not firm:
        raise HTTPException(status_code=404, detail="Firma no encontrada")

    # Access control
    if current_user.get("role") not in ["admin", "admin_general"]:
        if current_user.get("firm_id") != firm_id and str(current_user.get("_id")) != firm.get("owner_id"):
            raise HTTPException(status_code=403, detail="No tienes permiso para ver estos clientes")

    # Get lawyers from this firm
    lawyers = await db.users.find({
        "firm_id": firm_id,
        "role": {"$in": ["firm_lawyer", "lawyer"]}
    }).to_list(None)
    lawyer_ids = [str(l["_id"]) for l in lawyers]

    # Get cases for these lawyers
    cases = await db.cases.find({
        "lawyer_id": {"$in": lawyer_ids}
    }).to_list(None)

    # Collect unique clients
    unique_clients = {}
    for case in cases:
        client_id = case.get("client_id")
        client_name = case.get("client_name")

        if client_id and client_id not in unique_clients:
            unique_clients[client_id] = {
                "id": client_id,
                "name": client_name,
                "cases_count": 0,
            }

        if client_id:
            unique_clients[client_id]["cases_count"] += 1

    return {
        "success": True,
        "data": list(unique_clients.values()),
        "count": len(unique_clients),
    }

# GET /firms/:id/financial - Obtener resumen financiero de una firma
@router.get("/{firm_id}/financial", status_code=status.HTTP_200_OK)
async def get_firm_financial(
    firm_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener resumen financiero de una firma"""
    try:
        oid = ObjectId(firm_id)
    except:
        raise HTTPException(status_code=400, detail="ID de firma inválido")

    firm = await db.firms.find_one({"_id": oid})
    if not firm:
        raise HTTPException(status_code=404, detail="Firma no encontrada")

    # Access control
    if current_user.get("role") not in ["admin", "admin_general"]:
        if current_user.get("firm_id") != firm_id and str(current_user.get("_id")) != firm.get("owner_id"):
            raise HTTPException(status_code=403, detail="No tienes permiso para ver finanzas de esta firma")

    # Get lawyers from this firm
    lawyers = await db.users.find({
        "firm_id": firm_id,
        "role": {"$in": ["firm_lawyer", "lawyer"]}
    }).to_list(None)
    lawyer_ids = [str(l["_id"]) for l in lawyers]

    # Get cases for these lawyers
    cases = await db.cases.find({
        "lawyer_id": {"$in": lawyer_ids}
    }).to_list(None)
    case_ids = [str(c["_id"]) for c in cases]

    # Get commissions for these cases
    commissions = await db.commissions.find({
        "case_id": {"$in": case_ids}
    }).to_list(None)

    # Calculate financial metrics
    total_revenue = sum(c.get("amount", 0) for c in commissions)
    pending_revenue = sum(c.get("amount", 0) for c in commissions if c.get("status") in ["pending", "approved"])
    paid_revenue = sum(c.get("amount", 0) for c in commissions if c.get("status") == "paid")
    rejected_revenue = sum(c.get("amount", 0) for c in commissions if c.get("status") == "rejected")

    commission_payment_rate = (paid_revenue / total_revenue * 100) if total_revenue > 0 else 0

    # Get invoices for this firm (if any)
    invoices = await db.invoices.find({
        "firm_id": firm_id
    }).to_list(None) if hasattr(db, 'invoices') else []

    total_invoiced = sum(i.get("amount", 0) for i in invoices)
    paid_invoices = sum(i.get("amount", 0) for i in invoices if i.get("status") == "paid")

    return {
        "success": True,
        "data": {
            "firm_id": firm_id,
            "firm_name": firm.get("name"),
            "total_revenue": round(total_revenue, 2),
            "pending_revenue": round(pending_revenue, 2),
            "paid_revenue": round(paid_revenue, 2),
            "rejected_revenue": round(rejected_revenue, 2),
            "commission_payment_rate": round(commission_payment_rate, 2),
            "total_invoiced": round(total_invoiced, 2),
            "paid_invoices": round(paid_invoices, 2),
            "balance": round(total_revenue - paid_revenue, 2),
            "commissions_count": len(commissions),
            "active_cases": len([c for c in cases if c.get("status") in ["open", "in_progress"]]),
            "avg_revenue_per_case": round(total_revenue / max(len(cases), 1), 2),
        },
    }
