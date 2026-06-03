"""
Facturación — Punto Cero Legal
CRUD de facturas por abogado. Colección db.invoices.
La pasarela de cobros (MercadoPago) se añade en routes/billing endpoints
de este mismo router (ver más abajo).
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import os
import uuid
import httpx

router = APIRouter(prefix="/invoices", tags=["Invoicing"])

MP_API = "https://api.mercadopago.com"
APP_URL = os.environ.get("APP_PUBLIC_URL", "https://app.puntocerolegal.com")


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


# ───────────── Pasarela de cobros MercadoPago (abogado → cliente) ─────────────
async def _create_mp_preference(invoice: dict, token: str) -> dict:
    """Crea una preferencia de Checkout Pro en MercadoPago."""
    payload = {
        "items": [{
            "title": f"Factura {invoice.get('invoice_number')} - {invoice.get('client_name', '')}".strip(),
            "description": invoice.get("description") or "Servicios jurídicos",
            "quantity": 1,
            "currency_id": "COP",
            "unit_price": float(invoice.get("amount", 0)),
        }],
        "external_reference": str(invoice["_id"]),
        "back_urls": {
            "success": f"{APP_URL}/dashboard/invoices?status=success",
            "pending": f"{APP_URL}/dashboard/invoices?status=pending",
            "failure": f"{APP_URL}/dashboard/invoices?status=failure",
        },
        "auto_return": "approved",
        "notification_url": f"{APP_URL}/api/invoices/webhook/mercadopago",
    }
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(
            f"{MP_API}/checkout/preferences",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        r.raise_for_status()
        return r.json()


@router.post("/{invoice_id}/pay-link", response_model=dict)
async def create_payment_link(invoice_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Genera un link de cobro MercadoPago para que el CLIENTE pague la factura.
    Si MP_ACCESS_TOKEN no está configurado, genera un link simulado (igual que payment.py).
    """
    invoice = await db.invoices.find_one({"_id": ObjectId(invoice_id)})
    if not invoice:
        raise HTTPException(404, "Factura no encontrada")

    token = os.environ.get("MP_ACCESS_TOKEN")
    if token:
        try:
            pref = await _create_mp_preference(invoice, token)
            payment_link = pref.get("init_point") or pref.get("sandbox_init_point")
            payment_id = pref.get("id")
            gateway = "mercado_pago"
        except Exception as e:
            raise HTTPException(502, f"Error creando preferencia en MercadoPago: {e}")
    else:
        # Modo simulado (sin credenciales) — coherente con payment.py
        payment_id = f"PCL-INV-{uuid.uuid4().hex[:12].upper()}"
        payment_link = f"https://www.mercadopago.com/checkout/v1/redirect?pref_id={payment_id}"
        gateway = "mercado_pago_sim"

    await db.invoices.update_one(
        {"_id": ObjectId(invoice_id)},
        {"$set": {
            "payment_link": payment_link,
            "payment_id": payment_id,
            "gateway": gateway,
            "status": "sent" if invoice.get("status") == "draft" else invoice.get("status"),
            "updated_at": datetime.utcnow(),
        }},
    )
    return {"payment_link": payment_link, "payment_id": payment_id, "gateway": gateway}


@router.post("/{invoice_id}/mark-paid", response_model=dict)
async def mark_invoice_paid(invoice_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Marca manualmente una factura como pagada (cobro fuera de línea o confirmación)."""
    res = await db.invoices.update_one(
        {"_id": ObjectId(invoice_id)},
        {"$set": {"status": "paid", "paid_date": datetime.utcnow(), "updated_at": datetime.utcnow()}},
    )
    if res.matched_count == 0:
        raise HTTPException(404, "Factura no encontrada")
    doc = await db.invoices.find_one({"_id": ObjectId(invoice_id)})
    return _serialize(doc)


@router.post("/webhook/mercadopago")
async def mercadopago_webhook(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Webhook de MercadoPago. Cuando un pago es aprobado, marca la factura pagada
    usando external_reference (= invoice_id). Tolerante a notificaciones de prueba.
    """
    token = os.environ.get("MP_ACCESS_TOKEN")
    try:
        body = await request.json()
    except Exception:
        body = {}
    params = dict(request.query_params)

    topic = body.get("type") or params.get("type") or params.get("topic")
    payment_id = (body.get("data") or {}).get("id") or params.get("id") or params.get("data.id")

    # Confirmación directa (modo simulado o manual): {invoice_id, status}
    invoice_id = body.get("invoice_id")
    if invoice_id and body.get("status") in (None, "approved", "paid"):
        await db.invoices.update_one(
            {"_id": ObjectId(invoice_id)},
            {"$set": {"status": "paid", "paid_date": datetime.utcnow(), "updated_at": datetime.utcnow()}},
        )
        return {"ok": True, "source": "direct"}

    # Notificación real de pago: consultar estado en MercadoPago
    if topic == "payment" and payment_id and token:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(
                f"{MP_API}/v1/payments/{payment_id}",
                headers={"Authorization": f"Bearer {token}"},
            )
            if r.status_code == 200:
                data = r.json()
                ext_ref = data.get("external_reference")
                if data.get("status") == "approved" and ext_ref:
                    await db.invoices.update_one(
                        {"_id": ObjectId(ext_ref)},
                        {"$set": {
                            "status": "paid",
                            "paid_date": datetime.utcnow(),
                            "mp_payment_id": payment_id,
                            "updated_at": datetime.utcnow(),
                        }},
                    )
    return {"ok": True}
