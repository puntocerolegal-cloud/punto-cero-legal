"""
Facturación — Punto Cero Legal
CRUD de facturas por abogado. Colección db.invoices.
La pasarela de cobros (MercadoPago) se añade en routes/billing endpoints
de este mismo router (ver más abajo).
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

router = APIRouter(prefix="/invoices", tags=["Invoicing"])


async def get_db():
    from server import db
    return db


STATUS_VALUES = ("draft", "sent", "paid", "overdue", "cancelled")


class InvoiceIn(BaseModel):
    lawyer_id: str
    client_id: Optional[str] = None
    client_name: str = Field(..., min_length=2, max_length=160)
    amount: float = Field(..., gt=0)
    description: Optional[str] = None
    due_date: Optional[str] = None  # ISO date
    status: str = "draft"


class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    due_date: Optional[str] = None


def _iso(v):
    if isinstance(v, (datetime, date)):
        return v.isoformat()
    return v


def _serialize(inv):
    return {
        "_id": str(inv["_id"]),
        "number": inv.get("invoice_number"),
        "lawyer_id": inv.get("lawyer_id"),
        "client_id": inv.get("client_id"),
        "client": inv.get("client_name"),
        "amount": inv.get("amount", 0),
        "description": inv.get("description"),
        "status": inv.get("status", "draft"),
        "date": _iso(inv.get("issue_date")),
        "dueDate": _iso(inv.get("due_date")),
        "payment_link": inv.get("payment_link"),
        "payment_id": inv.get("payment_id"),
        "gateway": inv.get("gateway"),
    }


async def _next_invoice_number(lawyer_id: str, db: AsyncIOMotorDatabase) -> str:
    year = datetime.utcnow().year
    count = await db.invoices.count_documents({"lawyer_id": lawyer_id})
    return f"INV-{year}-{str(count + 1).zfill(5)}"


@router.get("/", response_model=List[dict])
async def list_invoices(lawyer_id: str, status: Optional[str] = None, db: AsyncIOMotorDatabase = Depends(get_db)):
    q = {"lawyer_id": lawyer_id}
    if status and status != "all":
        q["status"] = status
    docs = await db.invoices.find(q).sort("created_at", -1).to_list(1000)
    return [_serialize(d) for d in docs]


@router.post("/", response_model=dict, status_code=201)
async def create_invoice(payload: InvoiceIn, db: AsyncIOMotorDatabase = Depends(get_db)):
    if payload.status not in STATUS_VALUES:
        raise HTTPException(400, "Estado inválido")
    due = None
    if payload.due_date:
        try:
            due = datetime.fromisoformat(payload.due_date.replace("Z", "+00:00"))
        except Exception:
            due = None
    doc = {
        "lawyer_id": payload.lawyer_id,
        "client_id": payload.client_id,
        "client_name": payload.client_name,
        "amount": payload.amount,
        "description": payload.description,
        "status": payload.status,
        "invoice_number": await _next_invoice_number(payload.lawyer_id, db),
        "issue_date": datetime.utcnow(),
        "due_date": due,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    res = await db.invoices.insert_one(doc)
    doc["_id"] = res.inserted_id
    return _serialize(doc)


@router.patch("/{invoice_id}", response_model=dict)
async def update_invoice(invoice_id: str, payload: InvoiceUpdate, db: AsyncIOMotorDatabase = Depends(get_db)):
    update = {}
    if payload.status is not None:
        if payload.status not in STATUS_VALUES:
            raise HTTPException(400, "Estado inválido")
        update["status"] = payload.status
        if payload.status == "paid":
            update["paid_date"] = datetime.utcnow()
    if payload.amount is not None:
        update["amount"] = payload.amount
    if payload.description is not None:
        update["description"] = payload.description
    if payload.due_date is not None:
        try:
            update["due_date"] = datetime.fromisoformat(payload.due_date.replace("Z", "+00:00"))
        except Exception:
            pass
    update["updated_at"] = datetime.utcnow()
    res = await db.invoices.update_one({"_id": ObjectId(invoice_id)}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(404, "Factura no encontrada")
    doc = await db.invoices.find_one({"_id": ObjectId(invoice_id)})
    return _serialize(doc)


@router.delete("/{invoice_id}", status_code=204)
async def delete_invoice(invoice_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    res = await db.invoices.delete_one({"_id": ObjectId(invoice_id)})
    if res.deleted_count == 0:
        raise HTTPException(404, "Factura no encontrada")
    return None
