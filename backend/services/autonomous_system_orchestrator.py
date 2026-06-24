from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta
from typing import Dict, Any, List

class AutonomousFirmsBalancer:
    """FASE 13.4: Autonomous firms load balancer"""
    
    @staticmethod
    async def balance_firms(db: AsyncIOMotorDatabase) -> dict:
        """Autonomously balance load across all firms"""
        
        actions = []
        
        # Get all organizations
        orgs = await db.organizations.find({}).to_list(None)
        
        org_metrics = []
        
        for org in orgs:
            org_id = str(org["_id"])
            
            # Calculate metrics
            leads = await db.leads.find({"organization_id": org_id}).to_list(None)
            cases = await db.cases.find({"organization_id": org_id}).to_list(None)
            commissions = await db.commissions.find({"organization_id": org_id}).to_list(None)
            lawyers = await db.users.find({"organizationId": org_id, "role": "lawyer"}).to_list(None)
            
            total_leads = len(leads)
            converted_leads = len([l for l in leads if l.get("status") == "converted"])
            total_cases = len(cases)
            closed_cases = len([c for c in cases if c.get("status") == "closed"])
            total_revenue = sum(c.get("amount", 0) for c in commissions)
            
            conversion_rate = (converted_leads / total_leads) if total_leads > 0 else 0
            case_completion = (closed_cases / total_cases) if total_cases > 0 else 0
            
            # Utilization score (0-100)
            utilization = min(100, (total_leads / max(100, len(lawyers) * 20)) * 100) if lawyers else 0
            
            org_metrics.append({
                "org_id": org_id,
                "org_name": org.get("name"),
                "leads": total_leads,
                "cases": total_cases,
                "lawyers": len(lawyers),
                "conversion_rate": conversion_rate,
                "case_completion": case_completion,
                "total_revenue": total_revenue,
                "utilization": utilization,
                "health_score": (conversion_rate * 0.3) + (case_completion * 0.3) + ((100 - utilization) / 100 * 0.4) * 100,
            })
        
        # Sort by health score
        org_metrics.sort(key=lambda x: x["health_score"])
        
        # Balance: redistribute leads from healthy to struggling
        if len(org_metrics) > 1:
            struggling = org_metrics[0]  # Lowest health score
            healthy = org_metrics[-1]  # Highest health score
            
            if struggling["utilization"] < 50 and healthy["utilization"] > 70:
                # Move some leads
                leads_to_move = await db.leads.find({
                    "organization_id": healthy["org_id"],
                    "status": "new",
                    "ai_score": {"$gte": 50}
                }).limit(5).to_list(None)
                
                for lead in leads_to_move:
                    await db.leads.update_one(
                        {"_id": lead["_id"]},
                        {"$set": {
                            "organization_id": struggling["org_id"],
                            "autonomous_redistribution": True,
                        }}
                    )
                    
                    actions.append({
                        "type": "LEAD_REDISTRIBUTED",
                        "lead_id": str(lead["_id"]),
                        "from_org": healthy["org_id"],
                        "to_org": struggling["org_id"],
                    })
        
        return {
            "balance_cycle_timestamp": datetime.utcnow(),
            "organizations_balanced": len(org_metrics),
            "actions_executed": len(actions),
            "actions": actions,
            "org_metrics": org_metrics,
        }

class GlobalSystemOrchestrator:
    """FASE 13.5: Global system orchestration"""
    
    @staticmethod
    async def orchestrate_global_system(db: AsyncIOMotorDatabase) -> dict:
        """Orchestrate entire system autonomously"""
        
        summary = {
            "timestamp": datetime.utcnow(),
            "orchestration_cycle": "global",
            "components": {},
        }
        
        # 1. Global lead distribution
        total_leads = await db.leads.count_documents({})
        new_leads = await db.leads.count_documents({"status": "new"})
        converted_leads = await db.leads.count_documents({"status": "converted"})
        
        summary["components"]["leads"] = {
            "total": total_leads,
            "new": new_leads,
            "converted": converted_leads,
            "conversion_rate": (converted_leads / total_leads * 100) if total_leads > 0 else 0,
        }
        
        # 2. Global cases flow
        total_cases = await db.cases.count_documents({})
        open_cases = await db.cases.count_documents({"status": "open"})
        closed_cases = await db.cases.count_documents({"status": "closed"})
        
        summary["components"]["cases"] = {
            "total": total_cases,
            "open": open_cases,
            "closed": closed_cases,
            "completion_rate": (closed_cases / total_cases * 100) if total_cases > 0 else 0,
        }
        
        # 3. Global revenue distribution
        all_commissions = await db.commissions.find({}).to_list(None)
        total_revenue = sum(c.get("amount", 0) for c in all_commissions)
        paid_revenue = sum(c.get("amount", 0) for c in all_commissions if c.get("status") == "paid")
        pending_revenue = sum(c.get("amount", 0) for c in all_commissions if c.get("status") == "pending")
        
        summary["components"]["revenue"] = {
            "total": total_revenue,
            "paid": paid_revenue,
            "pending": pending_revenue,
            "payment_rate": (paid_revenue / total_revenue * 100) if total_revenue > 0 else 0,
        }
        
        # 4. Global system health
        lawyers = await db.users.find({"role": "lawyer"}).to_list(None)
        active_lawyers = len([l for l in lawyers if l.get("status") != "SUSPENDED"])
        
        agents = await db.users.find({"role": "socio_comercial"}).to_list(None)
        active_agents = len([a for a in agents if a.get("status") != "SUSPENDED"])
        
        organizations = await db.organizations.find({}).to_list(None)
        
        summary["components"]["system_health"] = {
            "organizations": len(organizations),
            "active_lawyers": active_lawyers,
            "active_agents": active_agents,
            "health_status": "OPTIMAL" if summary["components"]["leads"]["conversion_rate"] > 30 else "DEGRADED",
        }
        
        # 5. Autonomous health checks
        health_checks = []
        
        # Check for bottlenecks
        if open_cases > (total_leads * 0.5):
            health_checks.append({
                "type": "BOTTLENECK_DETECTED",
                "message": "Case backlog detected",
                "severity": "MEDIUM",
            })
        
        # Check for underutilized resources
        if active_lawyers > 0 and (total_cases / active_lawyers) < 5:
            health_checks.append({
                "type": "UNDERUTILIZATION",
                "message": "Lawyers underutilized",
                "severity": "LOW",
            })
        
        summary["health_checks"] = health_checks
        
        return summary

class AutonomousSelfHealingSystem:
    """FASE 13.6: Self-healing system"""
    
    @staticmethod
    async def self_heal(db: AsyncIOMotorDatabase) -> dict:
        """Detect and fix system issues autonomously"""
        
        healing_actions = []
        
        # HEAL 1: Orphaned leads (no assignment)
        orphaned_leads = await db.leads.find({
            "status": "new",
            "lawyer_id": None,
            "created_at": {"$lt": datetime.utcnow() - timedelta(hours=24)}
        }).to_list(None)
        
        for lead in orphaned_leads:
            # Force assignment
            from services.autonomous_decision_engine import AutonomousDecisionEngine
            lawyer = await AutonomousDecisionEngine._find_best_lawyer(
                db, lead.get("legal_area"), lead.get("country"), lead.get("organization_id")
            )
            
            if lawyer:
                await db.leads.update_one(
                    {"_id": lead["_id"]},
                    {"$set": {
                        "lawyer_id": lawyer["lawyer_id"],
                        "self_healed": True,
                    }}
                )
                
                healing_actions.append({
                    "type": "HEALED_ORPHANED_LEAD",
                    "lead_id": str(lead["_id"]),
                })
        
        # HEAL 2: Inactive lawyers
        inactive_lawyers = await db.users.find({
            "role": "lawyer",
            "last_activity": {"$lt": datetime.utcnow() - timedelta(days=30)}
        }).to_list(None)
        
        for lawyer in inactive_lawyers:
            # Try to reactivate by redistributing loads
            open_cases = await db.cases.count_documents({
                "lawyer_id": str(lawyer["_id"]),
                "status": "open"
            })
            
            if open_cases == 0:
                healing_actions.append({
                    "type": "LAWYER_REACTIVATION_NEEDED",
                    "lawyer_id": str(lawyer["_id"]),
                    "action": "assign_new_leads",
                })
        
        # HEAL 3: Stuck cases (no movement in 14+ days)
        stuck_cases = await db.cases.find({
            "status": "open",
            "last_activity": {"$lt": datetime.utcnow() - timedelta(days=14)}
        }).to_list(None)
        
        for case in stuck_cases:
            from services.autonomous_decision_engine import AutonomousDecisionEngine
            lawyer = await AutonomousDecisionEngine._find_best_lawyer(
                db, case.get("type"), None, case.get("organization_id"),
                exclude_lawyer_id=case.get("lawyer_id")
            )
            
            if lawyer:
                await db.cases.update_one(
                    {"_id": case["_id"]},
                    {"$set": {
                        "lawyer_id": lawyer["lawyer_id"],
                        "self_healed": True,
                    }}
                )
                
                healing_actions.append({
                    "type": "HEALED_STUCK_CASE",
                    "case_id": str(case["_id"]),
                })
        
        # HEAL 4: Inactive firms
        inactive_orgs = await db.organizations.find({
            "last_activity": {"$lt": datetime.utcnow() - timedelta(days=60)}
        }).to_list(None)
        
        for org in inactive_orgs:
            # Reactivation alert
            healing_actions.append({
                "type": "FIRM_REACTIVATION_NEEDED",
                "organization_id": str(org["_id"]),
                "action": "contact_and_redistribute_leads",
            })
        
        return {
            "self_healing_cycle": datetime.utcnow(),
            "total_actions": len(healing_actions),
            "healing_actions": healing_actions,
        }
