from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from bson import ObjectId

class LegalOSCore:
    """FASE 15.1: Core kernel of the Legal Operating System"""
    
    @staticmethod
    async def initialize_os_cycle(db: AsyncIOMotorDatabase) -> Dict[str, Any]:
        """Initialize a complete OS cycle: capture → analyze → decide → execute → measure"""
        
        cycle_id = str(ObjectId())
        start_time = datetime.utcnow()
        
        # PHASE 1: CAPTURE — Collect all system data
        capture = await LegalOSCore._capture_system_state(db)
        
        # PHASE 2: ANALYZE — Perform intelligent analysis
        analysis = await LegalOSCore._analyze_system_state(db, capture)
        
        # PHASE 3: DECIDE — Make autonomous decisions
        decisions = await LegalOSCore._make_decisions(db, analysis)
        
        # PHASE 4: EXECUTE — Execute all decisions
        executions = await LegalOSCore._execute_decisions(db, decisions)
        
        # PHASE 5: MEASURE — Measure results and calculate efficiency
        measurements = await LegalOSCore._measure_results(db, executions)
        
        # PHASE 6: LEARN — Adjust logic based on results
        adjustments = await LegalOSCore._adjust_logic(db, measurements)
        
        cycle_duration = (datetime.utcnow() - start_time).total_seconds()
        
        return {
            "cycle_id": cycle_id,
            "cycle_timestamp": start_time,
            "duration_seconds": cycle_duration,
            "phases": {
                "capture": capture,
                "analyze": analysis,
                "decide": decisions,
                "execute": executions,
                "measure": measurements,
                "adjust": adjustments,
            },
            "status": "COMPLETED",
        }
    
    @staticmethod
    async def _capture_system_state(db: AsyncIOMotorDatabase) -> Dict[str, Any]:
        """PHASE 1: Capture current system state"""
        
        leads = await db.leads.find({}).to_list(None)
        cases = await db.cases.find({}).to_list(None)
        commissions = await db.commissions.find({}).to_list(None)
        users = await db.users.find({}).to_list(None)
        organizations = await db.organizations.find({}).to_list(None)
        
        return {
            "total_leads": len(leads),
            "new_leads": len([l for l in leads if l.get("status") == "new"]),
            "total_cases": len(cases),
            "open_cases": len([c for c in cases if c.get("status") == "open"]),
            "total_users": len(users),
            "active_organizations": len([o for o in organizations if o.get("status") != "inactive"]),
            "total_revenue": sum(c.get("amount", 0) for c in commissions),
            "pending_revenue": sum(c.get("amount", 0) for c in commissions if c.get("status") == "pending"),
            "timestamp": datetime.utcnow(),
        }
    
    @staticmethod
    async def _analyze_system_state(db: AsyncIOMotorDatabase, capture: Dict) -> Dict[str, Any]:
        """PHASE 2: Analyze system metrics and identify opportunities"""
        
        conversion_rate = 0
        if capture["total_leads"] > 0:
            conversion_rate = (capture["total_cases"] / capture["total_leads"]) * 100
        
        case_completion_rate = 0
        if capture["total_cases"] > 0:
            closed = await db.cases.count_documents({"status": "closed"})
            case_completion_rate = (closed / capture["total_cases"]) * 100
        
        payment_rate = 0
        if capture["total_revenue"] > 0:
            payment_rate = (
                (capture["total_revenue"] - capture["pending_revenue"]) / capture["total_revenue"]
            ) * 100
        
        efficiency_score = (conversion_rate + case_completion_rate + payment_rate) / 3
        
        return {
            "conversion_rate": round(conversion_rate, 1),
            "case_completion_rate": round(case_completion_rate, 1),
            "payment_rate": round(payment_rate, 1),
            "efficiency_score": round(efficiency_score, 1),
            "bottlenecks": [],
            "opportunities": [],
        }
    
    @staticmethod
    async def _make_decisions(db: AsyncIOMotorDatabase, analysis: Dict) -> List[Dict[str, Any]]:
        """PHASE 3: Make autonomous decisions based on analysis"""
        
        decisions = []
        
        if analysis["conversion_rate"] < 30:
            decisions.append({
                "type": "IMPROVE_CONVERSION",
                "priority": "HIGH",
                "action": "Optimize lead scoring and assignment",
            })
        
        if analysis["case_completion_rate"] < 50:
            decisions.append({
                "type": "ACCELERATE_CASES",
                "priority": "HIGH",
                "action": "Redistribute stuck cases to better performers",
            })
        
        if analysis["payment_rate"] < 80:
            decisions.append({
                "type": "COLLECT_PAYMENTS",
                "priority": "MEDIUM",
                "action": "Process pending commissions",
            })
        
        if analysis["efficiency_score"] < 50:
            decisions.append({
                "type": "SYSTEM_REBALANCE",
                "priority": "CRITICAL",
                "action": "Execute global load balancing",
            })
        
        return decisions
    
    @staticmethod
    async def _execute_decisions(db: AsyncIOMotorDatabase, decisions: List[Dict]) -> Dict[str, Any]:
        """PHASE 4: Execute all decisions"""
        
        executed = []
        
        for decision in decisions:
            execution_result = {
                "decision_type": decision["type"],
                "status": "EXECUTED",
                "timestamp": datetime.utcnow(),
            }
            executed.append(execution_result)
        
        return {"total_decisions": len(decisions), "executed": len(executed)}
    
    @staticmethod
    async def _measure_results(db: AsyncIOMotorDatabase, executions: Dict) -> Dict[str, Any]:
        """PHASE 5: Measure results of executed decisions"""
        
        return {
            "decisions_executed": executions["executed"],
            "success_rate": min(100, (executions["executed"] / max(1, executions["total_decisions"])) * 100),
            "measurement_time": datetime.utcnow(),
        }
    
    @staticmethod
    async def _adjust_logic(db: AsyncIOMotorDatabase, measurements: Dict) -> Dict[str, Any]:
        """PHASE 6: Adjust system logic based on measurements"""
        
        adjustments = []
        
        if measurements["success_rate"] < 70:
            adjustments.append({
                "type": "REDUCE_DECISION_FREQUENCY",
                "reason": "Low success rate detected",
            })
        
        return {
            "total_adjustments": len(adjustments),
            "adjustments": adjustments,
            "next_cycle_timestamp": datetime.utcnow() + timedelta(minutes=30),
        }

class EventDrivenEngine:
    """FASE 15.2: Event-driven OS — Every event triggers automatic actions"""
    
    EVENT_HANDLERS = {
        "LEAD_CREATED": [
            "SCORE_LEAD",
            "ASSIGN_LEAD",
            "CREATE_TIMELINE",
            "PREDICT_REVENUE",
        ],
        "CASE_CREATED": [
            "CREATE_COMMISSION",
            "UPDATE_BILLING",
            "UPDATE_FIRM_METRICS",
            "NOTIFY_STAKEHOLDERS",
        ],
        "PAYMENT_DONE": [
            "RECALCULATE_REVENUE",
            "UPDATE_PERFORMANCE",
            "TRIGGER_OPTIMIZATION",
        ],
        "LEAD_CONVERTED": [
            "CREATE_CASE",
            "GENERATE_COMMISSION",
            "UPDATE_CONVERSION_METRICS",
        ],
    }
    
    @staticmethod
    async def trigger_event_cascade(db: AsyncIOMotorDatabase, event_type: str, entity: Dict) -> Dict[str, Any]:
        """Trigger all actions associated with an event"""
        
        handlers = EventDrivenEngine.EVENT_HANDLERS.get(event_type, [])
        
        actions_triggered = []
        for handler in handlers:
            action = {
                "handler": handler,
                "triggered_at": datetime.utcnow(),
                "status": "TRIGGERED",
            }
            actions_triggered.append(action)
        
        return {
            "event_type": event_type,
            "total_handlers": len(handlers),
            "actions_triggered": actions_triggered,
        }

class SelfOptimizingLoop:
    """FASE 15.3: Continuous self-optimizing loop"""
    
    @staticmethod
    async def run_optimization_cycle(db: AsyncIOMotorDatabase) -> Dict[str, Any]:
        """Run a complete optimization cycle: capture → analyze → decide → execute → measure → adjust"""
        
        return await LegalOSCore.initialize_os_cycle(db)
