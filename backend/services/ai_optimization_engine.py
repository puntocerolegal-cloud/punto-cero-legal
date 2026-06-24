from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from bson import ObjectId

class AIRevenueOptimizationEngine:
    """FASE 12.4: AI-driven recommendations to optimize revenue"""
    
    @staticmethod
    async def optimize_revenue(db: AsyncIOMotorDatabase, organization_id: str) -> dict:
        """Generate revenue optimization recommendations"""
        
        # Get all leads for this firm
        leads = await db.leads.find({
            "organization_id": organization_id
        }).to_list(None)
        
        # Get all cases
        cases = await db.cases.find({
            "organization_id": organization_id
        }).to_list(None)
        
        # Get commissions
        commissions = await db.commissions.find({
            "organization_id": organization_id
        }).to_list(None)
        
        # Analyze leads by score
        high_value_leads = [l for l in leads if l.get("ai_score", 0) >= 71 and l.get("status") != "converted"]
        medium_value_leads = [l for l in leads if 31 <= l.get("ai_score", 0) < 71 and l.get("status") != "converted"]
        low_value_leads = [l for l in leads if l.get("ai_score", 0) < 31 and l.get("status") != "converted"]
        
        # Calculate potential revenue from leads
        high_value_potential = sum(l.get("estimated_value", 0) or 0 for l in high_value_leads)
        medium_value_potential = sum(l.get("estimated_value", 0) or 0 for l in medium_value_leads)
        
        # Find stalled cases
        stalled_cases = []
        for case in cases:
            created_at = case.get("created_at")
            if created_at and case.get("status") == "open":
                days_old = (datetime.utcnow() - created_at).days
                if days_old > 60:
                    stalled_cases.append({
                        "case_id": str(case["_id"]),
                        "days_stalled": days_old,
                        "value": case.get("estimated_value", 0),
                    })
        
        # Find pending commissions
        pending_commissions = [c for c in commissions if c.get("status") == "pending"]
        pending_amount = sum(c.get("amount", 0) for c in pending_commissions)
        
        # Generate recommendations
        recommendations = []
        
        if high_value_leads:
            recommendations.append({
                "priority": "CRITICAL",
                "action": "Priorizar leads de alto valor",
                "details": f"{len(high_value_leads)} leads de alto valor sin convertir",
                "expected_revenue_gain": high_value_potential * 0.4,  # Assume 40% conversion
                "action_items": [
                    "Contactar inmediatamente",
                    "Asignar a mejores abogados",
                    "Ofrecer descuentos si es necesario",
                ]
            })
        
        if stalled_cases:
            stalled_value = sum(c.get("value", 0) for c in stalled_cases)
            recommendations.append({
                "priority": "HIGH",
                "action": "Acelerar casos estancados",
                "details": f"{len(stalled_cases)} casos sin movimiento",
                "expected_revenue_gain": stalled_value * 0.3,
                "action_items": [
                    "Revisar progreso de casos",
                    "Asignar recursos adicionales",
                    "Contactar clientes",
                ]
            })
        
        if pending_commissions:
            recommendations.append({
                "priority": "MEDIUM",
                "action": "Cerrar comisiones pendientes",
                "details": f"${pending_amount:.2f} en comisiones sin pagar",
                "expected_revenue_gain": pending_amount,
                "action_items": [
                    "Procesar pagos pendientes",
                    "Verificar documentación",
                    "Contactar agentes",
                ]
            })
        
        if medium_value_leads:
            recommendations.append({
                "priority": "LOW",
                "action": "Desarrollar leads de valor medio",
                "details": f"{len(medium_value_leads)} leads en pipeline medio",
                "expected_revenue_gain": medium_value_potential * 0.2,
                "action_items": [
                    "Seguimiento regular",
                    "Educación del cliente",
                    "Propuestas de valor agregado",
                ]
            })
        
        expected_total_gain = sum(r.get("expected_revenue_gain", 0) for r in recommendations)
        
        return {
            "organization_id": organization_id,
            "analysis": {
                "total_leads": len(leads),
                "high_value_leads": len(high_value_leads),
                "potential_high_value": high_value_potential,
                "stalled_cases": len(stalled_cases),
                "pending_commissions": len(pending_commissions),
                "pending_amount": pending_amount,
            },
            "recommendations": recommendations,
            "expected_total_revenue_gain": expected_total_gain,
            "priority_list": sorted(
                [l for l in leads if l.get("status") != "converted"],
                key=lambda x: x.get("ai_score", 0),
                reverse=True
            )[:10],
        }

class AIAlertSystem:
    """FASE 12.5: Intelligent alerts for risks and opportunities"""
    
    @staticmethod
    async def generate_alerts(db: AsyncIOMotorDatabase, organization_id: str) -> list:
        """Generate AI-powered alerts"""
        
        alerts = []
        
        # Get data
        leads = await db.leads.find({
            "organization_id": organization_id
        }).to_list(None)
        cases = await db.cases.find({
            "organization_id": organization_id
        }).to_list(None)
        lawyers = await db.users.find({
            "organizationId": organization_id,
            "role": "lawyer"
        }).to_list(None)
        commissions = await db.commissions.find({
            "organization_id": organization_id
        }).to_list(None)
        
        # Alert 1: Hot leads not attended
        hot_leads_unatended = [
            l for l in leads
            if l.get("ai_score", 0) >= 71 and l.get("status") == "new"
        ]
        if hot_leads_unatended:
            alerts.append({
                "type": "CRITICAL",
                "title": "Leads calientes sin atender",
                "description": f"{len(hot_leads_unatended)} leads de alto valor sin contactar",
                "count": len(hot_leads_unatended),
                "recommended_action": "Contactar inmediatamente",
                "impact": "revenue_loss",
                "timestamp": datetime.utcnow(),
            })
        
        # Alert 2: Stalled cases
        stalled = [
            c for c in cases
            if c.get("status") == "open" and
            (datetime.utcnow() - (c.get("created_at") or datetime.utcnow())).days > 60
        ]
        if stalled:
            alerts.append({
                "type": "HIGH",
                "title": "Casos estancados",
                "description": f"{len(stalled)} casos sin movimiento por más de 60 días",
                "count": len(stalled),
                "recommended_action": "Revisar y acelerar",
                "impact": "delayed_revenue",
                "timestamp": datetime.utcnow(),
            })
        
        # Alert 3: Overloaded lawyers
        for lawyer in lawyers:
            open_cases = [c for c in cases if c.get("lawyer_id") == str(lawyer["_id"]) and c.get("status") == "open"]
            if len(open_cases) > 15:
                alerts.append({
                    "type": "MEDIUM",
                    "title": f"Abogado sobrecargado: {lawyer.get('full_name')}",
                    "description": f"{len(open_cases)} casos abiertos",
                    "count": len(open_cases),
                    "lawyer_id": str(lawyer["_id"]),
                    "recommended_action": "Redistribuir casos",
                    "impact": "quality_risk",
                    "timestamp": datetime.utcnow(),
                })
        
        # Alert 4: Low conversion rate
        closed_leads = [l for l in leads if l.get("status") == "converted"]
        total_leads = len([l for l in leads if l.get("status") != "new"])
        
        if total_leads > 0:
            conversion_rate = len(closed_leads) / total_leads
            if conversion_rate < 0.2:
                alerts.append({
                    "type": "HIGH",
                    "title": "Baja tasa de conversión",
                    "description": f"Conversión: {conversion_rate*100:.1f}% (objetivo: 20%+)",
                    "conversion_rate": round(conversion_rate * 100, 1),
                    "recommended_action": "Mejorar proceso de calificación",
                    "impact": "revenue_loss",
                    "timestamp": datetime.utcnow(),
                })
        
        # Alert 5: Pending commissions
        pending_comms = [c for c in commissions if c.get("status") == "pending"]
        if pending_comms:
            total_pending = sum(c.get("amount", 0) for c in pending_comms)
            if len(pending_comms) > 5 or total_pending > 10000:
                alerts.append({
                    "type": "MEDIUM",
                    "title": "Comisiones pendientes",
                    "description": f"${total_pending:.2f} en {len(pending_comms)} comisiones",
                    "count": len(pending_comms),
                    "amount": total_pending,
                    "recommended_action": "Procesar pagos",
                    "impact": "agent_satisfaction",
                    "timestamp": datetime.utcnow(),
                })
        
        # Alert 6: High-value case at risk
        high_value_open = [
            c for c in cases
            if c.get("status") == "open" and (c.get("estimated_value") or 0) > 50000
        ]
        if high_value_open:
            alerts.append({
                "type": "MEDIUM",
                "title": f"Casos de alto valor en progreso",
                "description": f"{len(high_value_open)} casos > $50K",
                "count": len(high_value_open),
                "recommended_action": "Monitoreo frecuente",
                "impact": "revenue_opportunity",
                "timestamp": datetime.utcnow(),
            })
        
        # Sort by severity
        severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        alerts.sort(key=lambda x: severity_order.get(x["type"], 99))
        
        return alerts
