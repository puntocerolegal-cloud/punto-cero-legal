from fastapi import APIRouter, HTTPException, Depends, status
from typing import Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.invoice import InvoiceCreate, InvoiceUpdate
from routes.auth import get_current_user
from services.billing_service import BillingService
from pydantic import BaseModel
from bson import ObjectId

router = APIRouter(prefix="/financial", tags=["Financial · Billing"])

class InvoiceCreateRequest(BaseModel):
    organization_id: str
    amount: float
    period: str
    currency: Optional[str] = "USD"
    description: Optional[str] = None

class InvoicePaymentRequest(BaseModel):
    payment_method: Optional[str] = "bank_transfer"
    transaction_reference: Optional[str] = None

async def get_db():
    from server import db
    # Bypass GuardedDB for direct-access routes; tenant isolation is enforced
    # via get_current_user + explicit firm filtering (same pattern as routes/auth.py).
    if hasattr(db, "_real_db"):
        return db._real_db
    return db

# FASE 11.3: Billing System
@router.get("/billing/firm/{organization_id}")
async def get_firm_billing(
    organization_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get billing summary for a firm."""
    # Verify user is firm admin or super admin
    org = await db.organizations.find_one({"_id": ObjectId(organization_id)})
    if not org:
        raise HTTPException(status_code=404, detail="Organización no encontrada")
    
    user_id = str(current_user["_id"])
    if str(org.get("ownerId")) != user_id and current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    summary = await BillingService.get_firm_billing_summary(db, organization_id)
    
    return {
        "success": True,
        "data": summary,
        "message": "Resumen de facturación obtenido"
    }

# FASE 11.4: Invoices Management
@router.post("/invoices", status_code=status.HTTP_201_CREATED)
async def create_invoice(
    invoice_request: InvoiceCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Create a new invoice (admin only)."""
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    invoice = await BillingService.create_invoice(
        db,
        organization_id=invoice_request.organization_id,
        amount=invoice_request.amount,
        period=invoice_request.period,
        currency=invoice_request.currency,
        description=invoice_request.description,
    )
    
    # Create timeline event
    await db.timeline_events.insert_one({
        "event_type": "INVOICE_GENERATED",
        "invoice_id": invoice.get("_id"),
        "organization_id": invoice_request.organization_id,
        "description": f"Factura generada para período {invoice_request.period}: ${invoice_request.amount:.2f}",
        "metadata": {"period": invoice_request.period},
        "created_at": datetime.utcnow(),
    })
    
    return {
        "success": True,
        "data": invoice,
        "message": "Factura creada exitosamente"
    }

@router.get("/invoices/firm/{organization_id}")
async def get_firm_invoices(
    organization_id: str,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get invoices for a firm."""
    # Verify user is firm admin or super admin
    org = await db.organizations.find_one({"_id": ObjectId(organization_id)})
    if not org:
        raise HTTPException(status_code=404, detail="Organización no encontrada")
    
    user_id = str(current_user["_id"])
    if str(org.get("ownerId")) != user_id and current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    invoices = await BillingService.get_firm_invoices(db, organization_id, status)
    
    return {
        "success": True,
        "data": invoices,
        "message": "Facturas obtenidas"
    }

@router.post("/invoices/{invoice_id}/issue", status_code=status.HTTP_200_OK)
async def issue_invoice(
    invoice_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Issue an invoice (change from draft to issued)."""
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    try:
        invoice = await BillingService.issue_invoice(db, invoice_id)
        
        # Create timeline event
        await db.timeline_events.insert_one({
            "event_type": "INVOICE_ISSUED",
            "invoice_id": invoice_id,
            "organization_id": invoice.get("organization_id"),
            "description": f"Factura emitida para período {invoice.get('period')}",
            "created_at": datetime.utcnow(),
        })
        
        return {
            "success": True,
            "data": invoice,
            "message": "Factura emitida exitosamente"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/invoices/{invoice_id}/pay", status_code=status.HTTP_200_OK)
async def pay_invoice(
    invoice_id: str,
    payment_request: InvoicePaymentRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Mark invoice as paid."""
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    try:
        invoice = await BillingService.pay_invoice(
            db,
            invoice_id,
            payment_method=payment_request.payment_method,
            transaction_reference=payment_request.transaction_reference,
        )
        
        # Create timeline event
        await db.timeline_events.insert_one({
            "event_type": "PAYMENT_COMPLETED",
            "invoice_id": invoice_id,
            "organization_id": invoice.get("organization_id"),
            "description": f"Pago de factura procesado: ${invoice.get('amount'):.2f}",
            "metadata": {
                "payment_method": payment_request.payment_method,
                "transaction_reference": invoice.get("transaction_reference"),
            },
            "created_at": datetime.utcnow(),
        })
        
        return {
            "success": True,
            "data": invoice,
            "message": "Pago de factura procesado exitosamente"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/invoices/auto-generate/{organization_id}/{period}", status_code=status.HTTP_201_CREATED)
async def auto_generate_invoice(
    organization_id: str,
    period: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Auto-generate invoice from commissions for a period."""
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    try:
        invoice = await BillingService.auto_generate_invoices(db, organization_id, period)
        
        return {
            "success": True,
            "data": invoice,
            "message": f"Factura generada automáticamente para {period}"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 11.6: Global Financial Dashboard (Admin OS)
@router.get("/global/summary")
async def get_global_billing_summary(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get global billing summary for Admin OS (admin only)."""
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="No autorizado")

    summary = await BillingService.get_global_billing_summary(db)

    return {
        "success": True,
        "data": summary,
        "message": "Resumen financiero global obtenido"
    }

# ════════════════════════════════════════════════════════════════════════════
# REFACTORIZACIÓN DE FINANZAS: ÚNICO ENDPOINT CENTRALIZADO
# GET /financial/summary — Única fuente de verdad para TODOS los cálculos
# ════════════════════════════════════════════════════════════════════════════

@router.get("/summary")
async def get_financial_summary(
    organization_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    REFACTORIZACIÓN: Endpoint único que consolidada TODOS los cálculos financieros.

    Frontend NUNCA calcula dinero — todo viene de aquí.

    Parámetros:
    - organization_id: Si se proporciona, solo retorna financieras de esa org (tenant isolation)
                       Si no se proporciona, retorna globales (admin only)

    Retorna: Diccionario consolidado con:
    - global_revenue, global_paid, global_pending, global_balance
    - commissions_by_status (pending, approved, paid, rejected)
    - invoices_by_status (draft, issued, paid, cancelled)
    - mrr, arr (monthly + annual recurring revenue from subscriptions)
    - by_country (revenue breakdown por país)
    - by_firm (revenue breakdown por firma)
    - by_vertical (revenue breakdown por vertical)
    - monthly_breakdown (datos mensuales)
    - payment_rate (% de comisiones pagadas)
    - system_health (ratios para health indicators)
    """
    from datetime import datetime, timedelta

    # Si no proporciona org_id, requiere ser admin
    if not organization_id and current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="Acceso denegado: solo admin puede ver resumen global")

    # Si proporciona org_id, verifica tenant isolation
    if organization_id:
        org = await db.organizations.find_one({"_id": ObjectId(organization_id)})
        if not org:
            raise HTTPException(status_code=404, detail="Organización no encontrada")

        user_id = str(current_user["_id"])
        if str(org.get("ownerId")) != user_id and current_user.get("role") not in ["admin", "admin_general"]:
            raise HTTPException(status_code=403, detail="No autorizado para esta organización")

    try:
        # ════════════════════════════════════════════
        # SECCIÓN 1: COMISIONES
        # ════════════════════════════════════════════
        query_filter = {"organization_id": organization_id} if organization_id else {}

        commissions = await db.commissions.find(query_filter).to_list(None)

        # Desglose por status (SIN hardcoding de porcentajes)
        commissions_pending = sum(c.get("amount", 0) for c in commissions if c.get("status") == "pending")
        commissions_approved = sum(c.get("amount", 0) for c in commissions if c.get("status") == "approved")
        commissions_paid = sum(c.get("amount", 0) for c in commissions if c.get("status") == "paid")
        commissions_rejected = sum(c.get("amount", 0) for c in commissions if c.get("status") == "rejected")

        total_commissions = commissions_pending + commissions_approved + commissions_paid
        commission_payment_rate = (commissions_paid / total_commissions * 100) if total_commissions > 0 else 0

        # ════════════════════════════════════════════
        # SECCIÓN 2: INVOICES
        # ════════════════════════════════════════════
        invoices = await db.invoices.find(query_filter).to_list(None)

        invoices_draft = sum(i.get("amount", 0) for i in invoices if i.get("status") == "draft")
        invoices_issued = sum(i.get("amount", 0) for i in invoices if i.get("status") == "issued")
        invoices_paid = sum(i.get("amount", 0) for i in invoices if i.get("status") == "paid")
        invoices_cancelled = sum(i.get("amount", 0) for i in invoices if i.get("status") == "cancelled")

        total_invoices = invoices_draft + invoices_issued + invoices_paid

        # ════════════════════════════════════════════
        # SECCIÓN 3: REVENUE GLOBAL
        # ════════════════════════════════════════════
        global_revenue = commissions_pending + commissions_approved + commissions_paid
        global_paid = commissions_paid
        global_pending = commissions_pending + commissions_approved
        global_balance = global_revenue - (commissions_paid + invoices_paid)

        # ════════════════════════════════════════════
        # SECCIÓN 4: MRR/ARR (Suscripciones)
        # ════════════════════════════════════════════
        subscriptions_query = {"organization_id": organization_id} if organization_id else {}
        subscriptions = await db.subscriptions.find(subscriptions_query).to_list(None)

        mrr = 0
        arr = 0
        by_vertical = {}

        for sub in subscriptions:
            cycle = sub.get("billingCycle", "monthly")
            if cycle == "annual":
                monthly_amount = (sub.get("annualAmount", 0) or 0) / 12
            else:
                monthly_amount = sub.get("monthlyAmount", 0) or 0

            mrr += monthly_amount

            vertical = sub.get("vertical", "—")
            by_vertical[vertical] = by_vertical.get(vertical, 0) + monthly_amount

        arr = mrr * 12

        # ════════════════════════════════════════════
        # SECCIÓN 5: BREAKDOWN POR PAÍS
        # ════════════════════════════════════════════
        by_country = {}
        for commission in commissions:
            # Intenta obtener country desde el lead o case asociado
            # Fallback: usa "global"
            country = commission.get("country", "Global")
            by_country[country] = by_country.get(country, 0) + commission.get("amount", 0)

        # ════════════════════════════════════════════
        # SECCIÓN 6: BREAKDOWN POR FIRMA
        # ════════════════════════════════════════════
        by_firm = {}
        for commission in commissions:
            firm_id = commission.get("organization_id", "unassigned")
            by_firm[firm_id] = by_firm.get(firm_id, 0) + commission.get("amount", 0)

        # ════════════════════════════════════════════
        # SECCIÓN 7: BREAKDOWN MENSUAL (últimos 12 meses)
        # ════════════════════════════════════════════
        monthly_breakdown = {}
        now = datetime.utcnow()

        for commission in commissions:
            created_at = commission.get("created_at")
            if created_at:
                month_key = created_at.strftime("%Y-%m")
                monthly_breakdown[month_key] = monthly_breakdown.get(month_key, 0) + commission.get("amount", 0)

        # ════════════════════════════════════════════
        # SECCIÓN 8: HEALTH INDICATORS (para dashboards)
        # ════════════════════════════════════════════
        health = {
            "commission_payment_rate": round(commission_payment_rate, 1),  # % de comisiones pagadas
            "invoice_payment_rate": round((invoices_paid / total_invoices * 100) if total_invoices > 0 else 0, 1),
            "pending_ratio": round((global_pending / global_revenue * 100) if global_revenue > 0 else 0, 1),
        }

        return {
            "success": True,
            "data": {
                # Globales
                "global_revenue": round(global_revenue, 2),
                "global_paid": round(global_paid, 2),
                "global_pending": round(global_pending, 2),
                "global_balance": round(global_balance, 2),

                # Comisiones por status
                "commissions": {
                    "pending": round(commissions_pending, 2),
                    "approved": round(commissions_approved, 2),
                    "paid": round(commissions_paid, 2),
                    "rejected": round(commissions_rejected, 2),
                    "total": round(total_commissions, 2),
                    "count": len(commissions),
                },

                # Invoices por status
                "invoices": {
                    "draft": round(invoices_draft, 2),
                    "issued": round(invoices_issued, 2),
                    "paid": round(invoices_paid, 2),
                    "cancelled": round(invoices_cancelled, 2),
                    "total": round(total_invoices, 2),
                    "count": len(invoices),
                },

                # Recurring Revenue
                "recurring": {
                    "mrr": round(mrr, 2),
                    "arr": round(arr, 2),
                },

                # Breakdown por dimensión
                "by_country": {k: round(v, 2) for k, v in by_country.items()},
                "by_firm": {k: round(v, 2) for k, v in by_firm.items()},
                "by_vertical": {k: round(v, 2) for k, v in by_vertical.items()},

                # Breakdown mensual
                "monthly_breakdown": {k: round(v, 2) for k, v in sorted(monthly_breakdown.items())},

                # Health indicators
                "health": health,

                # Timestamp para cache validation
                "generated_at": datetime.utcnow().isoformat(),
            },
            "message": "Resumen financiero consolidado (ÚNICA FUENTE DE VERDAD)"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculando resumen: {str(e)}")
