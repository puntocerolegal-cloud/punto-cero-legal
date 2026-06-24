from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from bson import ObjectId

class AutonomousDecisionEngine:
    """FASE 13.1: Autonomous decision-making engine with rule-based automation"""
    
    @staticmethod
    async def run_decision_cycle(db: AsyncIOMotorDatabase) -> dict:
        """Execute full autonomous decision cycle globally"""
        
        actions = []
        
        # RULE 1: High-score leads auto-assignment
        high_score_leads = await db.leads.find({
            "ai_score": {"$gt": 80},
            "status": "new",
            "lawyer_id": None
        }).to_list(None)
        
        for lead in high_score_leads:
            # Find best lawyer
            best_lawyer = await AutonomousDecisionEngine._find_best_lawyer(
                db, lead.get("legal_area"), lead.get("country"), lead.get("organization_id")
            )
            
            if best_lawyer:
                await db.leads.update_one(
                    {"_id": lead["_id"]},
                    {"$set": {
                        "lawyer_id": best_lawyer["lawyer_id"],
                        "autonomous_assignment": True,
                        "updated_at": datetime.utcnow(),
                    }}
                )
                
                actions.append({
                    "type": "AUTONOMOUS_LEAD_ASSIGNED",
                    "lead_id": str(lead["_id"]),
                    "lawyer_id": best_lawyer["lawyer_id"],
                    "reason": "High-score lead auto-assignment",
                    "confidence": best_lawyer.get("confidence", 0),
                })
        
        # RULE 2: Stalled cases auto-reassignment
        stalled_cases = await db.cases.find({
            "status": "open",
            "created_at": {"$lt": datetime.utcnow() - timedelta(days=7)},
            "last_activity": {"$lt": datetime.utcnow() - timedelta(days=7)}
        }).to_list(None)
        
        for case in stalled_cases:
            # Find new lawyer (not the current one)
            new_lawyer = await AutonomousDecisionEngine._find_best_lawyer(
                db, case.get("type"), case.get("country"), case.get("organization_id"),
                exclude_lawyer_id=case.get("lawyer_id")
            )
            
            if new_lawyer:
                old_lawyer = case.get("lawyer_id")
                await db.cases.update_one(
                    {"_id": case["_id"]},
                    {"$set": {
                        "lawyer_id": new_lawyer["lawyer_id"],
                        "autonomous_reassignment": True,
                        "updated_at": datetime.utcnow(),
                    }}
                )
                
                actions.append({
                    "type": "AUTONOMOUS_CASE_REASSIGNED",
                    "case_id": str(case["_id"]),
                    "old_lawyer_id": old_lawyer,
                    "new_lawyer_id": new_lawyer["lawyer_id"],
                    "reason": "Stalled case detected (>7 days)",
                })
        
        # RULE 3: Low-conversion lawyer load reduction
        lawyers = await db.users.find({
            "role": "lawyer"
        }).to_list(None)
        
        for lawyer in lawyers:
            closed_cases = await db.cases.find({
                "lawyer_id": str(lawyer["_id"]),
                "status": "closed"
            }).to_list(None)
            
            total_cases = await db.cases.count_documents({"lawyer_id": str(lawyer["_id"])})
            
            if total_cases > 5:
                conversion_rate = len(closed_cases) / total_cases
                
                if conversion_rate < 0.25:  # Less than 25% conversion
                    # Reduce lead assignments
                    await db.users.update_one(
                        {"_id": lawyer["_id"]},
                        {"$set": {
                            "assignment_weight": 0.5,  # Reduce to 50%
                            "autonomous_weight_adjusted": True,
                            "updated_at": datetime.utcnow(),
                        }}
                    )
                    
                    actions.append({
                        "type": "AUTONOMOUS_LOAD_ADJUSTMENT",
                        "lawyer_id": str(lawyer["_id"]),
                        "adjustment": "reduce",
                        "reason": f"Low conversion rate: {conversion_rate*100:.1f}%",
                    })
        
        # RULE 4: Growing firm capacity expansion
        organizations = await db.organizations.find({}).to_list(None)
        
        for org in organizations:
            recent_leads = await db.leads.find({
                "organization_id": str(org["_id"]),
                "created_at": {"$gte": datetime.utcnow() - timedelta(days=30)}
            }).to_list(None)
            
            org_lead_limit = org.get("monthly_lead_limit", 100)
            
            if len(recent_leads) > org_lead_limit * 0.8:  # Over 80% capacity
                # Increase limit
                new_limit = int(org_lead_limit * 1.2)
                await db.organizations.update_one(
                    {"_id": org["_id"]},
                    {"$set": {
                        "monthly_lead_limit": new_limit,
                        "autonomous_limit_expanded": True,
                        "updated_at": datetime.utcnow(),
                    }}
                )
                
                actions.append({
                    "type": "AUTONOMOUS_CAPACITY_EXPANDED",
                    "organization_id": str(org["_id"]),
                    "old_limit": org_lead_limit,
                    "new_limit": new_limit,
                    "reason": "Firm growth detected",
                })
        
        return {
            "cycle_timestamp": datetime.utcnow(),
            "total_actions": len(actions),
            "actions": actions,
        }
    
    @staticmethod
    async def _find_best_lawyer(
        db: AsyncIOMotorDatabase,
        legal_area: Optional[str],
        country: Optional[str],
        organization_id: Optional[str],
        exclude_lawyer_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Find best lawyer for assignment"""
        
        query = {
            "role": "lawyer",
            "status": {"$ne": "SUSPENDED"}
        }
        
        if organization_id:
            query["organizationId"] = organization_id
        
        if exclude_lawyer_id:
            query["_id"] = {"$ne": ObjectId(exclude_lawyer_id)}
        
        lawyers = await db.users.find(query).to_list(None)
        
        if not lawyers:
            return None
        
        best_score = 0
        best_lawyer = None
        
        for lawyer in lawyers:
            score = 0
            
            # Specialty match
            specialties = [s.lower() for s in (lawyer.get("specialties") or [])]
            if legal_area and legal_area.lower() in specialties:
                score += 40
            else:
                score += 10
            
            # Workload
            open_cases = await db.cases.count_documents({
                "lawyer_id": str(lawyer["_id"]),
                "status": "open"
            })
            workload_score = max(0, 30 - (open_cases * 2))
            score += workload_score
            
            # Country
            if country and lawyer.get("country", "").lower() == country.lower():
                score += 20
            
            # Performance
            closed = await db.cases.count_documents({
                "lawyer_id": str(lawyer["_id"]),
                "status": "closed"
            })
            if closed > 0:
                score += min(10, closed / 10)
            
            if score > best_score:
                best_score = score
                best_lawyer = {
                    "lawyer_id": str(lawyer["_id"]),
                    "confidence": min(100, best_score)
                }
        
        return best_lawyer

class AutonomousRoutingSystem:
    """FASE 13.2: Smart routing system for leads and cases"""
    
    @staticmethod
    async def route_lead(db: AsyncIOMotorDatabase, lead: dict) -> dict:
        """Autonomously route lead to best entity"""
        
        lead_score = lead.get("ai_score", 50)
        legal_area = lead.get("legal_area", "corporativo")
        country = lead.get("country", "colombia")
        org_id = lead.get("organization_id")
        
        # Find best lawyer
        lawyer = await AutonomousDecisionEngine._find_best_lawyer(db, legal_area, country, org_id)
        
        # Find best agent if no firm
        agent = None
        if not org_id:
            agent = await AutonomousRoutingSystem._find_best_agent(db, country, lead_score)
        
        routing_confidence = min(100, (lead_score * 0.6) + (lawyer.get("confidence", 0) if lawyer else 0) * 0.4)
        
        return {
            "routed_lawyer_id": lawyer.get("lawyer_id") if lawyer else None,
            "routed_agent_id": agent.get("agent_id") if agent else None,
            "confidence_score": routing_confidence,
            "reason": "Autonomous routing executed",
            "timestamp": datetime.utcnow(),
        }
    
    @staticmethod
    async def _find_best_agent(db: AsyncIOMotorDatabase, country: str, lead_score: int) -> Optional[Dict]:
        """Find best commercial agent for lead"""
        
        agents = await db.users.find({
            "role": "socio_comercial",
            "country": country,
            "status": {"$ne": "SUSPENDED"}
        }).to_list(None)
        
        if not agents:
            return None
        
        best_agent = None
        best_score = 0
        
        for agent in agents:
            score = 50
            
            # Lead quality match
            if lead_score >= 71:
                score += 30
            elif lead_score >= 31:
                score += 15
            else:
                score += 5
            
            # Recent performance
            recent_leads = await db.leads.find({
                "agent_id": str(agent["_id"]),
                "created_at": {"$gte": datetime.utcnow() - timedelta(days=30)}
            }).to_list(None)
            
            converted = sum(1 for l in recent_leads if l.get("status") == "converted")
            conversion_rate = (converted / len(recent_leads)) if recent_leads else 0
            score += conversion_rate * 20
            
            if score > best_score:
                best_score = score
                best_agent = {
                    "agent_id": str(agent["_id"]),
                    "confidence": min(100, best_score)
                }
        
        return best_agent

class AutonomousRevenueEngine:
    """FASE 13.3: Self-optimizing revenue engine"""
    
    @staticmethod
    async def optimize_revenue_autonomous(db: AsyncIOMotorDatabase, org_id: str) -> dict:
        """Autonomously optimize revenue flow"""
        
        actions = []
        
        # Get all leads
        leads = await db.leads.find({"organization_id": org_id}).to_list(None)
        cases = await db.cases.find({"organization_id": org_id}).to_list(None)
        commissions = await db.commissions.find({"organization_id": org_id}).to_list(None)
        
        # Priority 1: High-value leads without lawyer
        high_value_unassigned = [
            l for l in leads
            if l.get("ai_score", 0) >= 71 and not l.get("lawyer_id")
        ]
        
        for lead in high_value_unassigned:
            lawyer = await AutonomousDecisionEngine._find_best_lawyer(db, lead.get("legal_area"), None, org_id)
            if lawyer:
                await db.leads.update_one(
                    {"_id": lead["_id"]},
                    {"$set": {"lawyer_id": lawyer["lawyer_id"], "autonomous_assignment": True}}
                )
                actions.append({
                    "action": "assign_high_value_lead",
                    "lead_id": str(lead["_id"]),
                    "estimated_value": lead.get("estimated_value", 0),
                })
        
        # Priority 2: Stalled cases
        stalled = [
            c for c in cases
            if c.get("status") == "open" and
            (datetime.utcnow() - (c.get("created_at") or datetime.utcnow())).days > 14
        ]
        
        for case in stalled:
            # Accelerate or reassign
            lawyer = await AutonomousDecisionEngine._find_best_lawyer(
                db, case.get("type"), None, org_id, exclude_lawyer_id=case.get("lawyer_id")
            )
            if lawyer:
                await db.cases.update_one(
                    {"_id": case["_id"]},
                    {"$set": {"lawyer_id": lawyer["lawyer_id"]}}
                )
                actions.append({
                    "action": "accelerate_stalled_case",
                    "case_id": str(case["_id"]),
                })
        
        # Priority 3: Pending commissions
        pending = [c for c in commissions if c.get("status") == "pending"]
        total_pending = sum(c.get("amount", 0) for c in pending)
        
        if pending:
            actions.append({
                "action": "process_commissions",
                "count": len(pending),
                "amount": total_pending,
            })
        
        expected_gain = sum(l.get("estimated_value", 0) or 0 for l in high_value_unassigned) * 0.5
        
        return {
            "organization_id": org_id,
            "actions_taken": len(actions),
            "expected_revenue_gain": expected_gain,
            "optimized_flow": actions,
            "timestamp": datetime.utcnow(),
        }
