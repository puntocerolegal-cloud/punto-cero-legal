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

router = APIRouter(prefix="/clients", tags=["Client Directory"])


async def get_db():
    from server import db
    return db


class ClientIn(BaseModel):
    lawyer_id: str
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
async def list_clients(lawyer_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    docs = await db.clients.find({"lawyer_id": lawyer_id}).sort("created_at", -1).to_list(1000)
    return [await _serialize(d, db) for d in docs]


@router.post("/", response_model=dict, status_code=201)
async def create_client(payload: ClientIn, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = payload.model_dump()
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    res = await db.clients.insert_one(doc)
    doc["_id"] = res.inserted_id
    return await _serialize(doc, db)


@router.patch("/{client_id}", response_model=dict)
async def update_client(client_id: str, payload: ClientUpdate, db: AsyncIOMotorDatabase = Depends(get_db)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    update["updated_at"] = datetime.utcnow()
    res = await db.clients.update_one({"_id": ObjectId(client_id)}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(404, "Cliente no encontrado")
    doc = await db.clients.find_one({"_id": ObjectId(client_id)})
    return await _serialize(doc, db)


@router.delete("/{client_id}", status_code=204)
async def delete_client(client_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    res = await db.clients.delete_one({"_id": ObjectId(client_id)})
    if res.deleted_count == 0:
        raise HTTPException(404, "Cliente no encontrado")
    return None
