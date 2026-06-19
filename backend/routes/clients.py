"""
Directorio de Clientes — Punto Cero Legal
CRUD de clientes propios de cada abogado. Colección db.clients.
Enriquece cada cliente con conteo de casos y documentos vinculados.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from routes.auth import get_current_user
from security.ownership import require_owner

router = APIRouter(prefix="/clients", tags=["Client Directory"])


async def get_db():
    from server import db
    return db


def _oid(client_id: str) -> ObjectId:
    """Convierte el id de ruta a ObjectId; 404 si no es un id válido
    (evita un 500 por ObjectId inválido)."""
    if not ObjectId.is_valid(client_id):
        raise HTTPException(404, "Cliente no encontrado")
    return ObjectId(client_id)


class ClientIn(BaseModel):
    # lawyer_id ya NO se acepta desde el cliente: se deriva del token.
    name: str = Field(..., min_length=2, max_length=160)
    document: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    country: str = "Colombia"
    address: Optional[str] = None
    status: str = "active"
    observations: Optional[str] = None


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    document: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None
    observations: Optional[str] = None


async def _serialize(c, db: AsyncIOMotorDatabase):
    cid = str(c["_id"])
    cases_count = await db.cases.count_documents({"client_id": cid})
    docs_count = await db.documents.count_documents({"client_id": cid})
    return {
        "_id": cid,
        "lawyer_id": c.get("lawyer_id"),
        "name": c.get("name"),
        "document": c.get("document"),
        "email": c.get("email"),
        "phone": c.get("phone"),
        "city": c.get("city"),
        "country": c.get("country"),
        "address": c.get("address"),
        "status": c.get("status", "active"),
        "observations": c.get("observations"),
        "cases": cases_count,
        "documents": docs_count,
        "registerDate": c["created_at"].date().isoformat() if isinstance(c.get("created_at"), datetime) else None,
    }


@router.get("/", response_model=List[dict])
async def list_clients(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    # La identidad viene del token, NO de un query param manipulable.
    lawyer_id = str(current_user["_id"])
    docs = await db.clients.find({"lawyer_id": lawyer_id}).sort("created_at", -1).to_list(1000)
    return [await _serialize(d, db) for d in docs]


@router.post("/", response_model=dict, status_code=201)
async def create_client(
    payload: ClientIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = payload.model_dump()
    # El dueño se asigna automáticamente desde el usuario autenticado.
    doc["lawyer_id"] = str(current_user["_id"])
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    res = await db.clients.insert_one(doc)
    doc["_id"] = res.inserted_id
    return await _serialize(doc, db)


@router.patch("/{client_id}", response_model=dict)
async def update_client(
    client_id: str,
    payload: ClientUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    oid = _oid(client_id)
    client = await db.clients.find_one({"_id": oid})
    # 404 si no existe · 403 si el cliente no pertenece al abogado autenticado.
    require_owner(client, current_user)
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    update["updated_at"] = datetime.utcnow()
    await db.clients.update_one({"_id": oid}, {"$set": update})
    doc = await db.clients.find_one({"_id": oid})
    return await _serialize(doc, db)


@router.delete("/{client_id}", status_code=204)
async def delete_client(
    client_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    oid = _oid(client_id)
    client = await db.clients.find_one({"_id": oid})
    # Misma validación de ownership que update.
    require_owner(client, current_user)
    await db.clients.delete_one({"_id": oid})
    return None
