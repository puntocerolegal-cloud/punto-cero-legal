"""Service layer de Analytics — Punto Cero OS (solo lectura, multi-tenant).

Agrega en tiempo real organizations, partners, implementations, os_subscriptions
y billing. NO crea colecciones ni almacena métricas. Toda consulta pasa por
_tenant_filter (tenant obligatorio; SUPER_ADMIN cross-tenant).
"""
from datetime import datetime, timedelta
from typing import Optional

from utils.responses import OrgError

ACTIVE_SUB_STATES = ("active", "trial")
PAID = "paid"
RECEIVABLE_STATES = ("pending", "overdue", "review")
COMPLETED_IMPL = ("operation",)
PAYMENT_METHOD_LABELS = {
    "transfer": "Transferencia bancaria", "pse": "PSE",
    "card": "Tarjeta crédito/débito", "cash": "Efectivo",
}


def _tenant_filter(ctx: dict, extra: Optional[dict] = None) -> dict:
    q = dict(extra or {})
    if ctx.get("tenant_id"):
        q["tenantId"] = str(ctx["tenant_id"])
    elif not ctx.get("is_super_admin"):
        raise OrgError(400, "Operación sin tenant no permitida")
    return q


async def _audit(db, action: str, ctx: dict):
    try:
        await db.audit_logs.insert_one({
            "action": action, "module": "analytics",
            "user": ctx.get("user", {}).get("email", "—"),
            "user_id": ctx.get("user_id"), "tenant_id": ctx.get("tenant_id"),
            "created_at": datetime.utcnow(),
        })
    except Exception:
        pass


def _monthly_value(sub: dict) -> float:
    monthly = float(sub.get("monthlyAmount", 0) or 0)
    if monthly:
        return monthly
    annual = float(sub.get("annualAmount", 0) or 0)
    return annual / 12.0 if annual else 0.0


def _amount(i: dict) -> float:
    return float(i.get("amount", 0) or 0)


async def _load(db, ctx: dict) -> dict:
    """Carga (filtrada por tenant) las 5 colecciones del OS, una sola vez."""
    f = _tenant_filter(ctx)
    return {
        "organizations": await db.organizations.find(f).to_list(5000),
        "partners": await db.partners.find(f).to_list(5000),
        "implementations": await db.implementations.find(f).to_list(5000),
        "subscriptions": await db.os_subscriptions.find(f).to_list(5000),
        "billing": await db.billing.find(f).to_list(10000),
    }


def _recent(items: list, days: int = 30) -> int:
    cutoff = datetime.utcnow() - timedelta(days=days)
    n = 0
    for it in items:
        ts = it.get("createdAt")
        if isinstance(ts, datetime) and ts >= cutoff:
            n += 1
    return n


# ───────── Cálculos por dominio ─────────
def _compute_revenue(data: dict) -> dict:
    subs = data["subscriptions"]
    bills = data["billing"]
    mrr = sum(_monthly_value(s) for s in subs if s.get("status") in ACTIVE_SUB_STATES)
    arr = mrr * 12
    total_revenue = sum(_amount(b) for b in bills)
    paid_amount = sum(_amount(b) for b in bills if b.get("status") == PAID)
    receivable = sum(_amount(b) for b in bills if b.get("status") in RECEIVABLE_STATES)
    avg_ticket = round(total_revenue / len(bills)) if bills else 0
    collection_rate = round((paid_amount / total_revenue) * 100, 2) if total_revenue else 0

    by_vertical = {}
    for b in bills:
        v = b.get("vertical") or "Otro"
        by_vertical[v] = by_vertical.get(v, 0) + _amount(b)

    pm = {}
    for b in bills:
        if b.get("status") != PAID:
            continue
        k = b.get("paymentMethod") or "transfer"
        pm.setdefault(k, {"transactions": 0, "amount": 0})
        pm[k]["transactions"] += 1
        pm[k]["amount"] += _amount(b)

    return {
        "MRR": round(mrr), "ARR": round(arr),
        "monthlyRevenue": round(paid_amount), "totalRevenue": round(total_revenue),
        "averageTicket": avg_ticket, "collectionRate": collection_rate,
        "accountsReceivable": round(receivable),
        "revenueByVertical": [{"label": k, "value": round(v)} for k, v in by_vertical.items()],
        "paymentMethods": [
            {"key": k, "label": PAYMENT_METHOD_LABELS.get(k, k), "transactions": v["transactions"], "amount": round(v["amount"])}
            for k, v in pm.items()
        ],
    }


def _compute_growth(data: dict) -> dict:
    return {
        "newOrganizations": _recent(data["organizations"]),
        "newPartners": _recent(data["partners"]),
        "newImplementations": _recent(data["implementations"]),
        "newSubscriptions": _recent(data["subscriptions"]),
        "growthTrend": [],  # serie temporal: requiere histórico; se calcula real cuando exista
        "growthPercentage": 0,
    }


def _compute_funnel(data: dict) -> dict:
    leads = len(data["partners"])
    impls = len(data["implementations"])
    subs = len(data["subscriptions"])
    customers = len([b for b in data["billing"] if b.get("status") == PAID])
    active_orgs = len([o for o in data["organizations"] if o.get("status") == "active"])
    seq = [
        ("leads", leads), ("implementations", impls), ("subscriptions", subs),
        ("customers", customers), ("activeOrganizations", active_orgs),
    ]
    stages = []
    base = leads or 1
    for label, value in seq:
        stages.append({"label": label, "value": value, "conversionPercentage": round((value / base) * 100, 1) if base else 0})
    return {"leads": leads, "implementations": impls, "subscriptions": subs,
            "customers": customers, "activeOrganizations": active_orgs, "stages": stages}


def _compute_verticals(data: dict) -> list:
    verticals = set()
    for key in ("organizations", "subscriptions", "implementations", "partners", "billing"):
        for it in data[key]:
            if it.get("vertical"):
                verticals.add(it["vertical"])

    result = []
    for v in sorted(verticals):
        orgs = [o for o in data["organizations"] if o.get("vertical") == v]
        subs = [s for s in data["subscriptions"] if s.get("vertical") == v]
        impls = [i for i in data["implementations"] if i.get("vertical") == v]
        bills = [b for b in data["billing"] if b.get("vertical") == v]
        parts = [p for p in data["partners"] if p.get("vertical") == v]
        revenue = sum(_amount(b) for b in bills)
        converted = len([p for p in parts if p.get("stage") == "convertido"])
        conv = round((converted / len(parts)) * 100, 1) if parts else 0
        at_risk = any(o.get("status") in ("at_risk", "suspended") for o in orgs)
        result.append({
            "name": v,
            "organizations": len(orgs),
            "revenue": round(revenue),
            "subscriptions": len(subs),
            "implementations": len(impls),
            "growth": _recent(orgs) + _recent(subs),
            "conversionRate": conv,
            "health": "riesgo" if at_risk else "normal",
        })
    return result


def _compute_insights(verticals: list, revenue: dict) -> dict:
    def top(metric):
        return max(verticals, key=lambda v: v.get(metric, 0))["name"] if verticals else None
    risks, opportunities, recommendations = [], [], []
    for v in verticals:
        if v["health"] == "riesgo":
            risks.append(f"Vertical {v['name']} con organizaciones en riesgo.")
        if v["conversionRate"] >= 25:
            opportunities.append(f"Alta conversión en {v['name']} ({v['conversionRate']}%): ampliar captación.")
    if revenue["accountsReceivable"] > 0:
        recommendations.append(f"Gestionar cobranza: ${revenue['accountsReceivable']:,} en cuentas por cobrar.")
    if not risks:
        risks.append("Sin riesgos críticos detectados.")
    return {
        "topRevenueVertical": top("revenue"),
        "fastestGrowingVertical": top("growth"),
        "bestConversionVertical": top("conversionRate"),
        "highestMRRVertical": top("subscriptions"),
        "highestRiskVertical": next((v["name"] for v in verticals if v["health"] == "riesgo"), None),
        "risks": risks, "opportunities": opportunities, "recommendations": recommendations,
    }


def _compute_kpis(data: dict, revenue: dict, funnel: dict, growth: dict) -> dict:
    subs = data["subscriptions"]
    active_subs = len([s for s in subs if s.get("status") in ACTIVE_SUB_STATES])
    completed = len([i for i in data["implementations"] if i.get("stage") in COMPLETED_IMPL])
    go_lives = len([i for i in data["implementations"] if i.get("stage") == "go_live"])
    leads = funnel["leads"] or 1
    conversion = round((funnel["customers"] / leads) * 100, 1) if leads else 0
    return {
        "totalOrganizations": len(data["organizations"]),
        "totalPartners": len(data["partners"]),
        "totalImplementations": len(data["implementations"]),
        "totalSubscriptions": len(subs),
        "activeSubscriptions": active_subs,
        "MRR": revenue["MRR"], "ARR": revenue["ARR"],
        "monthlyRevenue": revenue["monthlyRevenue"], "totalRevenue": revenue["totalRevenue"],
        "averageTicket": revenue["averageTicket"], "collectionRate": revenue["collectionRate"],
        "implementationsCompleted": completed, "goLivesThisMonth": go_lives,
        "conversionRate": conversion,
        "growthRate": growth["growthPercentage"],
    }


# ───────── API pública del servicio ─────────
async def get_revenue_metrics(db, ctx):
    await _audit(db, "analytics_revenue_viewed", ctx)
    return _compute_revenue(await _load(db, ctx))


async def get_growth_metrics(db, ctx):
    await _audit(db, "analytics_growth_viewed", ctx)
    return _compute_growth(await _load(db, ctx))


async def get_funnel_metrics(db, ctx):
    await _audit(db, "analytics_funnel_viewed", ctx)
    return _compute_funnel(await _load(db, ctx))


async def get_vertical_performance(db, ctx):
    await _audit(db, "analytics_verticals_viewed", ctx)
    return _compute_verticals(await _load(db, ctx))


async def get_executive_insights(db, ctx):
    await _audit(db, "analytics_insights_viewed", ctx)
    data = await _load(db, ctx)
    return _compute_insights(_compute_verticals(data), _compute_revenue(data))


async def get_kpis(db, ctx):
    await _audit(db, "analytics_kpis_viewed", ctx)
    data = await _load(db, ctx)
    return _compute_kpis(data, _compute_revenue(data), _compute_funnel(data), _compute_growth(data))


def _compute_operations(data: dict, verticals: list, growth: dict) -> dict:
    impls = data["implementations"]
    pending_impl = len([i for i in impls if i.get("stage") not in ("operation",)])
    upcoming_renewals = len([s for s in data["subscriptions"] if s.get("status") in ACTIVE_SUB_STATES])
    overdue = len([b for b in data["billing"] if b.get("status") == "overdue"])
    risks = len([v for v in verticals if v.get("health") == "riesgo"])
    return {
        "newOrgs": growth["newOrganizations"],
        "newPartners": growth["newPartners"],
        "pendingImplementations": pending_impl,
        "upcomingRenewals": upcoming_renewals,
        "overdueInvoices": overdue,
        "detectedRisks": risks,
    }


async def get_dashboard(db, ctx):
    await _audit(db, "analytics_dashboard_viewed", ctx)
    data = await _load(db, ctx)
    revenue = _compute_revenue(data)
    growth = _compute_growth(data)
    funnel = _compute_funnel(data)
    verticals = _compute_verticals(data)
    insights = _compute_insights(verticals, revenue)
    kpis = _compute_kpis(data, revenue, funnel, growth)
    operations = _compute_operations(data, verticals, growth)
    return {
        "metrics": kpis,
        "revenue": revenue,
        "growth": growth,
        "verticals": verticals,
        "insights": insights,
        "funnel": funnel,
        "operations": operations,
    }
