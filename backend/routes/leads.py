from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime, date
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.lead import LeadCreate, Lead, LeadUpdate
from utils.case_number_generator import generate_case_number
from bson import ObjectId

from routes.auth import get_current_user
from security.ownership import require_owner
from security.tenant_scope import validate_org_ownership, build_org_filter
from services.commission_service import CommissionService

router = APIRouter(prefix="/leads", tags=["CRM - Leads"])


def _oid(lead_id: str) -> ObjectId:
    """Convierte el id de ruta a ObjectId; 404 si no es válido (evita 500)."""
    if not ObjectId.is_valid(lead_id):
        raise HTTPException(status_code=404, detail="Lead not found")
    return ObjectId(lead_id)


async def _get_lead_or_404(db, lead_id: str):
    lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


def _create_case_payload(lead: dict, client_id: str, lead_id: str) -> dict:
    return {
        "case_number": generate_case_number(),
        "lawyer_id": lead["lawyer_id"],
        "client_id": client_id,
        "title": f"Caso: {lead['description'][:50]}",
        "legal_area": lead["legal_area"],
        "description": lead["description"],
        "status": "open",
        "priority": "medium",
        "start_date": date.today(),
        "documents": [],
        "billable_hours": 0.0,
        "total_billed": 0.0,
        "tags": [],
        "lead_source_id": lead_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

async def get_db():
    from server import db
    return db

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_lead(
    lead_data: LeadCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    lead_dict = lead_data.model_dump()
    # Multi-tenant: asigna automaticamente la organización del usuario actual
    lead_dict["organization_id"] = current_user.get("organization_id")
    # El dueño se asigna desde el token, no desde el payload del cliente.
    lead_dict["lawyer_id"] = str(current_user["_id"])
    lead_dict["assigned_date"] = datetime.utcnow()
    lead_dict["created_at"] = datetime.utcnow()
    lead_dict["updated_at"] = datetime.utcnow()
    lead_dict["converted_to"] = None

    # FASE 8: If agent creates lead, register agent_id for commission tracking
    if current_user.get("role") == "socio_comercial":
        lead_dict["agent_id"] = str(current_user["_id"])

    # FASE 8: Register country if provided
    if "country" not in lead_dict or not lead_dict["country"]:
        lead_dict["country"] = current_user.get("country", "Unknown")

    # FASE 8: Register source (default to lead_source param or "crm")
    if "source" not in lead_dict or not lead_dict["source"]:
        lead_dict["source"] = "crm"

    result = await db.leads.insert_one(lead_dict)
    lead_dict["_id"] = str(result.inserted_id)

    # FASE 8: Create timeline event for lead creation
    try:
        await db.timeline_events.insert_one({
            "event_type": "LEAD_CREATED",
            "lead_id": str(result.inserted_id),
            "agent_id": lead_dict.get("agent_id"),
            "lawyer_id": lead_dict.get("lawyer_id"),
            "description": f"Lead creado: {lead_dict.get('client_name')}",
            "metadata": {
                "country": lead_dict.get("country"),
                "source": lead_dict.get("source"),
                "legal_area": lead_dict.get("legal_area"),
            },
            "created_at": datetime.utcnow(),
        })
    except Exception:
        pass  # Timeline event creation optional

    return lead_dict

@router.get("/", response_model=List[dict])
async def get_leads(
    status: str = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user_id = str(current_user["_id"])
    org_id = current_user.get("organization_id")
    # FASE 6 + Multi-tenant: Leads owned by current user AND in same organization
    query = {
        "$or": [{"lawyer_id": user_id}, {"agent_id": user_id}],
        "organization_id": org_id
    }
    if status:
        query["status"] = status

    leads = await db.leads.find(query).sort("created_at", -1).to_list(1000)
    for lead in leads:
        lead["_id"] = str(lead["_id"])
    return leads

@router.get("/{lead_id}", response_model=dict)
async def get_lead(
    lead_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    oid = _oid(lead_id)
    lead = await db.leads.find_one({"_id": oid})
    # 404 si no existe · 403 si no pertenece al abogado autenticado o al mismo org.
    validate_org_ownership(lead, current_user, "organization_id")
    require_owner(lead, current_user)
    lead["_id"] = str(lead["_id"])
    return lead

@router.patch("/{lead_id}", response_model=dict)
async def update_lead(
    lead_id: str,
    lead_update: LeadUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    oid = _oid(lead_id)
    lead = await db.leads.find_one({"_id": oid})
    validate_org_ownership(lead, current_user, "organization_id")
    require_owner(lead, current_user)

    update_data = {k: v for k, v in lead_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()

    await db.leads.update_one({"_id": oid}, {"$set": update_data})

    lead = await db.leads.find_one({"_id": oid})
    lead["_id"] = str(lead["_id"])
    return lead

@router.post("/{lead_id}/convert", response_model=dict)
async def convert_lead_to_case(
    lead_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    INTEGRACIÓN CRÍTICA: CRM → Gestión de Casos
    Convierte un lead en un caso automáticamente
    FASE 8: También crea comisión automática si es agente
    """
    oid = _oid(lead_id)
    lead = await db.leads.find_one({"_id": oid})
    validate_org_ownership(lead, current_user, "organization_id")
    require_owner(lead, current_user)

    if lead.get("status") == "converted":
        raise HTTPException(status_code=400, detail="Lead already converted")

    client_data = {
        "email": lead["client_email"],
        "full_name": lead["client_name"],
        "phone": lead["client_phone"],
        "role": "client",
        "status": "active",
        "password_hash": "pending",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    existing_client = await db.users.find_one({"email": lead["client_email"]})
    if existing_client:
        client_id = str(existing_client["_id"])
    else:
        client_result = await db.users.insert_one(client_data)
        client_id = str(client_result.inserted_id)

    case_data = _create_case_payload(lead, client_id, lead_id)
    case_data["client_name"] = lead.get("client_name")
    case_data["client_email"] = lead.get("client_email")
    case_data["client_phone"] = lead.get("client_phone")
    case_data["estado"] = "Activo"

    # FASE 8: Include organizationId if lawyer belongs to firm
    lawyer = await db.users.find_one({"_id": ObjectId(lead["lawyer_id"])})
    if lawyer and lawyer.get("organizationId"):
        case_data["organization_id"] = lawyer.get("organizationId")

    case_result = await db.cases.insert_one(case_data)
    case_id = str(case_result.inserted_id)

    # INTEGRACIÓN: crear automáticamente la Biblioteca de Expediente del caso
    from utils.expediente import init_expediente
    folders = await init_expediente(db, case_id, lead["lawyer_id"])

    # FASE 8: Create commission if lead was created by agent
    commission_id = None
    if lead.get("agent_id"):
        # Default commission: 10% of estimated case value (default $500)
        sale_value = lead.get("estimated_value", 500)
        commission_rate = 0.10
        commission_amount = sale_value * commission_rate

        commission_data = {
            "agent_id": lead.get("agent_id"),
            "case_id": case_id,
            "organization_id": case_data.get("organization_id"),
            "amount": commission_amount,
            "currency": "USD",
            "status": "pending",
            "commission_rate": commission_rate,
            "sale_value": sale_value,
            "created_at": datetime.utcnow(),
            "approved_at": None,
            "paid_at": None,
            "updated_at": datetime.utcnow(),
        }

        commission_result = await db.commissions.insert_one(commission_data)
        commission_id = str(commission_result.inserted_id)

        # FASE 8: Create timeline event for case creation
        await db.timeline_events.insert_one({
            "event_type": "CASE_CREATED",
            "lead_id": lead_id,
            "case_id": case_id,
            "agent_id": lead.get("agent_id"),
            "lawyer_id": lead.get("lawyer_id"),
            "organization_id": case_data.get("organization_id"),
            "description": f"Caso creado desde lead: {case_data.get('case_number')}",
            "metadata": {
                "client_name": lead.get("client_name"),
                "legal_area": lead.get("legal_area"),
            },
            "created_at": datetime.utcnow(),
        })

        # FASE 8: Create timeline event for commission
        await db.timeline_events.insert_one({
            "event_type": "COMMISSION_CREATED",
            "case_id": case_id,
            "commission_id": commission_id,
            "agent_id": lead.get("agent_id"),
            "organization_id": case_data.get("organization_id"),
            "description": f"Comisión creada: ${commission_amount:.2f}",
            "metadata": {
                "amount": commission_amount,
                "rate": commission_rate,
                "sale_value": sale_value,
            },
            "created_at": datetime.utcnow(),
        })

    await db.leads.update_one(
        {"_id": oid},
        {"$set": {
            "status": "converted",
            "converted_to": case_id,
            "updated_at": datetime.utcnow()
        }}
    )

    return {
        "message": "Lead converted successfully",
        "case_id": case_id,
        "case_number": case_data["case_number"],
        "client_id": client_id,
        "commission_id": commission_id,
        "expediente_folders": folders,
    }

@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(
    lead_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    oid = _oid(lead_id)
    lead = await db.leads.find_one({"_id": oid})
    # Misma validación de ownership que update.
    require_owner(lead, current_user)
    await db.leads.delete_one({"_id": oid})
    return None
