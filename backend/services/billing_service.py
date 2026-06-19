"""Service layer de Facturación — Punto Cero OS (multi-tenant).

Mismo patrón que organization/partner/implementation/subscription:
_tenant_filter en toda consulta, invoiceNumber único por tenant, auditoría
(incl. invoice_paid / invoice_overdue) y dashboard con métricas financieras.
"""
from datetime import datetime
from typing import Optional

from bson import ObjectId
from pymongo import ASCENDING
from pymongo.errors import DuplicateKeyError

from utils.responses import OrgError

RECEIVABLE_STATES = ("pending", "overdue", "review")
PAYMENT_METHOD_LABELS = {
    "transfer": "Transferencia bancaria", "pse": "PSE",
    "card": "Tarjeta crédito/débito", "cash": "Efectivo",
}


def _oid(iid: str) -> ObjectId:
    if not ObjectId.is_valid(iid):
        raise OrgError(404, "Factura no encontrada")
    return ObjectId(iid)


def _serialize(doc: dict) -> dict:
    if not doc:
        return doc
    return {**doc, "_id": str(doc["_id"])}


async def ensure_indexes(db):
    """Fase 5 — índices: tenantId, organizationId, status, source, issueDate,
    dueDate, paymentMethod, invoiceNumber y compuesto único tenantId+invoiceNumber."""
    await db.billing.create_index([("tenantId", ASCENDING)])
    await db.billing.create_index([("organizationId", ASCENDING)])
    await db.billing.create_index([("status", ASCENDING)])
    await db.billing.create_index([("source", ASCENDING)])
    await db.billing.create_index([("issueDate", ASCENDING)])
    await db.billing.create_index([("dueDate", ASCENDING)])
    await db.billing.create_index([("paymentMethod", ASCENDING)])
    await db.billing.create_index([("invoiceNumber", ASCENDING)])
    await db.billing.create_index(
        [("tenantId", ASCENDING), ("invoiceNumber", ASCENDING)], unique=True, name="uniq_tenant_invoice"
    )


def _tenant_filter(ctx: dict, extra: Optional[dict] = None) -> dict:
    q = dict(extra or {})
    if ctx.get("tenant_id"):
        q["tenantId"] = str(ctx["tenant_id"])
    elif not ctx.get("is_super_admin"):
        raise OrgError(400, "Operación sin tenant no permitida")
    return q


async def _audit(db, action: str, ctx: dict, detail: str = ""):
    try:
        await db.audit_logs.insert_one({
            "action": action,
            "module": "billing",
            "user": ctx.get("user", {}).get("email", "—"),
            "user_id": ctx.get("user_id"),
            "tenant_id": ctx.get("tenant_id"),
            "detail": detail,
            "created_at": datetime.utcnow(),
        })
    except Exception:
        pass


async def _next_invoice_number(db, tenant_id: str) -> str:
    year = datetime.utcnow().year
    count = await db.billing.count_documents({"tenantId": str(tenant_id)})
    return f"FAC-{year}-{count + 1:04d}"


async def create_invoice(db, ctx: dict, payload) -> dict:
    tenant_id = ctx.get("tenant_id")
    if not tenant_id:
        raise OrgError(400, "Se requiere tenant para crear una factura")

    number = payload.invoiceNumber or await _next_invoice_number(db, tenant_id)
    existing = await db.billing.find_one({"tenantId": str(tenant_id), "invoiceNumber": number})
    if existing:
        raise OrgError(409, f"Ya existe la factura '{number}' en este tenant")

    now = datetime.utcnow()
    doc = {
        "tenantId": str(tenant_id),
        "organizationId": payload.organizationId,
        "invoiceNumber": number,
        "clientName": payload.clientName,
        "source": payload.source,
        "status": payload.status,
        "amount": payload.amount,
        "issueDate": payload.issueDate,
        "dueDate": payload.dueDate,
        "paidDate": payload.paidDate,
        "paymentMethod": payload.paymentMethod,
        "vertical": payload.vertical,
        "notes": payload.notes,
        "createdAt": now,
        "updatedAt": now,
        "createdBy": ctx.get("user_id"),
    }
    try:
        res = await db.billing.insert_one(doc)
    except DuplicateKeyError:
        raise OrgError(409, f"Ya existe la factura '{number}' en este tenant")
    doc["_id"] = res.inserted_id
    await _audit(db, "invoice_created", ctx, number)
    return _serialize(doc)


async def update_invoice(db, ctx: dict, iid: str, payload) -> dict:
    oid = _oid(iid)
    current = await db.billing.find_one(_tenant_filter(ctx, {"_id": oid}))
    if not current:
        raise OrgError(404, "Factura no encontrada")

    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if "invoiceNumber" in updates:
        clash = await db.billing.find_one({
            "tenantId": str(ctx["tenant_id"]), "invoiceNumber": updates["invoiceNumber"], "_id": {"$ne": oid},
        })
        if clash:
            raise OrgError(409, f"El número '{updates['invoiceNumber']}' ya está en uso en este tenant")
    updates["updatedAt"] = datetime.utcnow()

    await db.billing.update_one({"_id": oid}, {"$set": updates})

    new_status = updates.get("status")
    if new_status and new_status != current.get("status"):
        if new_status == "paid":
            await _audit(db, "invoice_paid", ctx, current.get("invoiceNumber", iid))
        elif new_status == "overdue":
            await _audit(db, "invoice_overdue", ctx, current.get("invoiceNumber", iid))
    await _audit(db, "invoice_updated", ctx, iid)

    doc = await db.billing.find_one({"_id": oid})
    return _serialize(doc)


async def pay_invoice(db, ctx: dict, iid: str, payment_method: Optional[str] = None, paid_date: Optional[str] = None) -> dict:
    oid = _oid(iid)
    current = await db.billing.find_one(_tenant_filter(ctx, {"_id": oid}))
    if not current:
        raise OrgError(404, "Factura no encontrada")
    updates = {"status": "paid", "updatedAt": datetime.utcnow(),
               "paidDate": paid_date or datetime.utcnow().date().isoformat()}
    if payment_method:
        updates["paymentMethod"] = payment_method
    await db.billing.update_one({"_id": oid}, {"$set": updates})
    await _audit(db, "invoice_paid", ctx, current.get("invoiceNumber", iid))
    doc = await db.billing.find_one({"_id": oid})
    return _serialize(doc)


async def delete_invoice(db, ctx: dict, iid: str) -> None:
    oid = _oid(iid)
    res = await db.billing.delete_one(_tenant_filter(ctx, {"_id": oid}))
    if res.deleted_count == 0:
        raise OrgError(404, "Factura no encontrada")
    await _audit(db, "invoice_deleted", ctx, iid)


async def get_invoice(db, ctx: dict, iid: str) -> dict:
    oid = _oid(iid)
    doc = await db.billing.find_one(_tenant_filter(ctx, {"_id": oid}))
    if not doc:
        raise OrgError(404, "Factura no encontrada")
    await _audit(db, "invoice_viewed", ctx, iid)
    return _serialize(doc)


async def get_invoices(db, ctx: dict, status: Optional[str] = None, source: Optional[str] = None) -> list:
    extra = {}
    if status:
        extra["status"] = status
    if source:
        extra["source"] = source
    q = _tenant_filter(ctx, extra or None)
    docs = await db.billing.find(q).sort("issueDate", -1).to_list(2000)
    return [_serialize(d) for d in docs]


# ───────── Métricas ─────────
def _sum(items, pred):
    return sum(float(i.get("amount", 0) or 0) for i in items if pred(i))


async def get_revenue_summary(db, ctx: dict) -> dict:
    items = await get_invoices(db, ctx)
    paid = _sum(items, lambda i: i.get("status") == "paid")
    by_vertical = {}
    for i in items:
        v = i.get("vertical") or "Otro"
        by_vertical[v] = by_vertical.get(v, 0) + float(i.get("amount", 0) or 0)
    return {
        "totalRevenue": _sum(items, lambda i: True),
        "monthlyRevenue": paid,  # proxy: recaudo pagado (sin parseo de fechas)
        "averageTicket": round(_sum(items, lambda i: True) / len(items)) if items else 0,
        "revenueByVertical": [{"label": k, "value": round(v)} for k, v in by_vertical.items()],
    }


async def get_collections_summary(db, ctx: dict) -> dict:
    items = await get_invoices(db, ctx)
    receivable = _sum(items, lambda i: i.get("status") in RECEIVABLE_STATES)
    # Aging por estado (proxy sin parseo de fechas): pending=0-30, review=31-60, overdue=60+.
    aging = {
        "0-30": _sum(items, lambda i: i.get("status") == "pending"),
        "31-60": _sum(items, lambda i: i.get("status") == "review"),
        "60+": _sum(items, lambda i: i.get("status") == "overdue"),
    }
    return {"accountsReceivable": round(receivable), "agingBuckets": {k: round(v) for k, v in aging.items()}}


async def get_dashboard(db, ctx: dict) -> dict:
    """Lista + métricas financieras (Fase 3) + KPIS shape UI."""
    items = await get_invoices(db, ctx)
    total = len(items)
    paid = [i for i in items if i.get("status") == "paid"]
    pending = [i for i in items if i.get("status") == "pending"]
    overdue = [i for i in items if i.get("status") == "overdue"]
    total_amount = _sum(items, lambda i: True)
    paid_amount = _sum(items, lambda i: i.get("status") == "paid")
    collection_rate = round((paid_amount / total_amount) * 100, 2) if total_amount else 0

    revenue = await get_revenue_summary(db, ctx)
    collections = await get_collections_summary(db, ctx)

    # Métodos de pago (conteo + monto por método sobre pagadas).
    pm = {}
    for i in paid:
        key = i.get("paymentMethod") or "transfer"
        pm.setdefault(key, {"transactions": 0, "amount": 0})
        pm[key]["transactions"] += 1
        pm[key]["amount"] += float(i.get("amount", 0) or 0)
    payment_methods = [
        {"key": k, "label": PAYMENT_METHOD_LABELS.get(k, k), "transactions": v["transactions"], "amount": round(v["amount"])}
        for k, v in pm.items()
    ]

    metrics = {
        "totalInvoices": total,
        "paidInvoices": len(paid),
        "pendingInvoices": len(pending),
        "overdueInvoices": len(overdue),
        "monthlyRevenue": round(revenue["monthlyRevenue"]),
        "totalRevenue": round(total_amount),
        "averageTicket": revenue["averageTicket"],
        "collectionRate": collection_rate,
        "accountsReceivable": collections["accountsReceivable"],
        "revenueByVertical": revenue["revenueByVertical"],
        "paymentMethods": payment_methods,
        "agingBuckets": collections["agingBuckets"],
    }

    return {
        "INVOICES": items,
        "metrics": metrics,
        # KPIS en el shape que consume la UI (BillingDashboard).
        "KPIS": {
            "totalBilled": round(total_amount),
            "issued": total,
            "paid": len(paid),
            "overdue": len(overdue),
            "accountsReceivable": collections["accountsReceivable"],
            "monthlyCollection": round(paid_amount),
        },
    }
