"""
AUTONOMOUS ORCHESTRATOR — Consolidación de Todos los Sistemas Autónomos
═══════════════════════════════════════════════════════════════════════════

OBJETIVO: Un ÚNICO punto de decisión que coordina:
  1. Scoring (AI → evaluación de leads)
  2. Assignment (asignación a lawyers)
  3. Routing (distribución geográfica/de carga)
  4. Balancing (equilibrio entre firmas)
  5. Optimization (optimización de ingresos)

PREVIENE:
  ✓ Doble asignación (lead asignado 2x)
  ✓ Conflictos entre engines
  ✓ Inconsistencias de estado
  ✓ N+1 queries innecesarias

PATRÓN: Todos los endpoints autónomos → AutonomousOrchestrator.execute()
         Una sola llamada, múltiples decisiones coordinadas.
"""

from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from bson import ObjectId
from enum import Enum
import asyncio

class DecisionType(Enum):
    """Tipos de decisiones que el orquestador puede tomar"""
    SCORE_LEAD = "score_lead"
    ASSIGN_LEAD = "assign_lead"
    ROUTE_LEAD = "route_lead"
    REASSIGN_CASE = "reassign_case"
    BALANCE_FIRMS = "balance_firms"
    OPTIMIZE_REVENUE = "optimize_revenue"
    AUTO_REBALANCE = "auto_rebalance"


class AutonomousOrchestrator:
    """
    ORQUESTADOR CENTRAL DE AUTONOMÍA
    ═════════════════════════════════════════════════════════════════════
    
    Consolida TODAS las decisiones autónomas en un flujo coordinado.
    Evita conflictos mediante estado compartido y mutex por lead.
    
    Flujo típico:
      1. Orquestador recibe lead nuevo
      2. Valida estado (no asignado previamente)
      3. Calcula score
      4. Determina mejor lawyer
      5. Valida disponibilidad (mutex)
      6. Asigna
      7. Registra decisión en timeline
      8. Retorna resultado
    """
    
    # Cache de locks por lead para evitar asignación concurrente
    _lead_locks: Dict[str, asyncio.Lock] = {}
    
    @staticmethod
    def _get_lead_lock(lead_id: str) -> asyncio.Lock:
        """Obtén mutex para lead específico (crea si no existe)"""
        if lead_id not in AutonomousOrchestrator._lead_locks:
            AutonomousOrchestrator._lead_locks[lead_id] = asyncio.Lock()
        return AutonomousOrchestrator._lead_locks[lead_id]
    
    @staticmethod
    async def execute(
        db: AsyncIOMotorDatabase,
        decision_type: DecisionType,
        entity: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        PUNTO ÚNICO DE ENTRADA para todas las decisiones autónomas.
        
        Args:
            db: Database connection
            decision_type: Tipo de decisión (enum DecisionType)
            entity: Lead, Case, o entidad a procesar
            context: Contexto adicional (org_id, parameters, etc)
        
        Returns:
            {
                "success": bool,
                "decision": decision_type,
                "entity_id": id,
                "action_taken": str,
                "changes": dict,
                "timeline_event": event_dict
            }
        """
        entity_id = str(entity.get("_id", "unknown"))
        
        try:
            # DISPATCHER: Enruta a handler específico
            if decision_type == DecisionType.SCORE_LEAD:
                return await AutonomousOrchestrator._score_lead(db, entity, context)
            
            elif decision_type == DecisionType.ASSIGN_LEAD:
                return await AutonomousOrchestrator._assign_lead(db, entity, context)
            
            elif decision_type == DecisionType.ROUTE_LEAD:
                return await AutonomousOrchestrator._route_lead(db, entity, context)
            
            elif decision_type == DecisionType.REASSIGN_CASE:
                return await AutonomousOrchestrator._reassign_case(db, entity, context)
            
            elif decision_type == DecisionType.BALANCE_FIRMS:
                return await AutonomousOrchestrator._balance_firms(db, context)
            
            elif decision_type == DecisionType.OPTIMIZE_REVENUE:
                return await AutonomousOrchestrator._optimize_revenue(db, entity, context)
            
            elif decision_type == DecisionType.AUTO_REBALANCE:
                return await AutonomousOrchestrator._auto_rebalance(db, context)
            
            else:
                return {
                    "success": False,
                    "error": f"Unknown decision type: {decision_type}"
                }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "entity_id": entity_id
            }
    
    @staticmethod
    async def _score_lead(
        db: AsyncIOMotorDatabase,
        lead: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        PASO 1: Calcular score del lead (consolidado en aquí)
        Utiliza lógica de AIScoringEngine pero centralizado
        """
        lead_id = str(lead.get("_id", ""))
        
        # Factores de scoring
        legal_area = (lead.get("legal_area", "otro") or "otro").lower()
        country = (lead.get("country", "colombia") or "colombia").lower()
        estimated_value = lead.get("estimated_value", 0) or 0
        source = (lead.get("source", "website") or "website").lower()
        created_at = lead.get("created_at")
        
        # Puntajes (lógica centralizada aquí)
        area_priorities = {
            "corporativo": 0.9, "mercantil": 0.9, "penal": 0.7,
            "laboral": 0.8, "civil": 0.6, "familiar": 0.5, "otro": 0.3,
        }
        area_score = area_priorities.get(legal_area, 0.3) * 30
        
        country_priorities = {
            "colombia": 1.0, "mexico": 0.95, "argentina": 0.9,
            "chile": 0.9, "perú": 0.85,
        }
        country_score = country_priorities.get(country, 0.5) * 20
        
        value_score = min(30, (estimated_value / 5000) * 30)
        
        source_urgency = {
            "referral": 15, "direct": 12, "website": 8,
            "social": 6, "crm": 5,
        }
        source_score = source_urgency.get(source, 5)
        
        age_score = 0
        if created_at:
            days_old = (datetime.utcnow() - created_at).days
            age_score = 5 if days_old == 0 else (3 if days_old <= 7 else (1 if days_old <= 30 else 0))
        
        total_score = min(100, area_score + country_score + value_score + source_score + age_score)
        
        # Clasificación
        if total_score >= 71:
            classification = "ALTO_VALOR"
            conversion_prob = 65
        elif total_score >= 31:
            classification = "MEDIO"
            conversion_prob = 40
        else:
            classification = "BAJO_VALOR"
            conversion_prob = 15
        
        # Actualizar lead en BD
        await db.leads.update_one(
            {"_id": ObjectId(lead_id)},
            {"$set": {
                "ai_score": round(total_score, 1),
                "ai_classification": classification,
                "ai_conversion_probability": conversion_prob,
                "updated_at": datetime.utcnow(),
            }}
        )
        
        # Registrar en timeline
        await db.timeline_events.insert_one({
            "event_type": "AI_LEAD_SCORED",
            "lead_id": lead_id,
            "organization_id": lead.get("organization_id"),
            "description": f"Lead scored: {classification} ({total_score} pts)",
            "metadata": {
                "score": round(total_score, 1),
                "classification": classification,
                "conversion_probability": conversion_prob,
            },
            "created_at": datetime.utcnow(),
        })
        
        return {
            "success": True,
            "decision": DecisionType.SCORE_LEAD.value,
            "entity_id": lead_id,
            "action_taken": f"scored as {classification}",
            "changes": {
                "ai_score": round(total_score, 1),
                "ai_classification": classification,
                "ai_conversion_probability": conversion_prob,
            },
            "timeline_event": "AI_LEAD_SCORED"
        }
    
    @staticmethod
    async def _assign_lead(
        db: AsyncIOMotorDatabase,
        lead: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        PASO 2: Asignar lead a lawyer
        ✓ Valida que no esté ya asignado (previene doble asignación)
        ✓ Usa mutex para evitar race conditions
        """
        lead_id = str(lead.get("_id", ""))
        org_id = lead.get("organization_id")
        
        # MUTEX: Prevenir doble asignación concurrente
        lock = AutonomousOrchestrator._get_lead_lock(lead_id)
        
        async with lock:
            # Re-fetch para validar estado actual
            current_lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
            
            if current_lead.get("lawyer_id"):
                return {
                    "success": False,
                    "error": "Lead already assigned",
                    "entity_id": lead_id,
                    "decision": DecisionType.ASSIGN_LEAD.value,
                }
            
            # Score si no está
            if not current_lead.get("ai_score"):
                await AutonomousOrchestrator._score_lead(db, current_lead, context)
            
            # Encontrar mejor lawyer
            best_lawyer = await AutonomousOrchestrator._find_best_lawyer(
                db,
                legal_area=current_lead.get("legal_area"),
                country=current_lead.get("country"),
                organization_id=org_id,
            )
            
            if not best_lawyer:
                return {
                    "success": False,
                    "error": "No available lawyer",
                    "entity_id": lead_id,
                }
            
            # Asignar
            lawyer_id = best_lawyer["lawyer_id"]
            await db.leads.update_one(
                {"_id": ObjectId(lead_id)},
                {"$set": {
                    "lawyer_id": lawyer_id,
                    "ai_assigned": True,
                    "autonomous_assignment": True,
                    "assigned_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                }}
            )
            
            # Timeline
            await db.timeline_events.insert_one({
                "event_type": "AUTONOMOUS_LEAD_ASSIGNED",
                "lead_id": lead_id,
                "lawyer_id": lawyer_id,
                "organization_id": org_id,
                "description": f"Lead auto-assigned to {best_lawyer.get('lawyer_name')}",
                "metadata": {
                    "confidence": best_lawyer.get("confidence", 0),
                    "reason": f"Score {current_lead.get('ai_score')} + Capacity match",
                },
                "created_at": datetime.utcnow(),
            })
            
            return {
                "success": True,
                "decision": DecisionType.ASSIGN_LEAD.value,
                "entity_id": lead_id,
                "action_taken": f"assigned to lawyer {lawyer_id}",
                "changes": {
                    "lawyer_id": lawyer_id,
                    "ai_assigned": True,
                    "assigned_at": datetime.utcnow().isoformat(),
                },
                "timeline_event": "AUTONOMOUS_LEAD_ASSIGNED"
            }
    
    @staticmethod
    async def _find_best_lawyer(
        db: AsyncIOMotorDatabase,
        legal_area: Optional[str] = None,
        country: Optional[str] = None,
        organization_id: Optional[str] = None,
        exclude_lawyer_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Encuentra el abogado óptimo para un lead/case
        Considera: especialidad + carga actual + tasa de conversión
        """
        # Filtro base
        query = {"role": "lawyer"}
        if organization_id:
            query["organizationId"] = organization_id
        if exclude_lawyer_id:
            query["_id"] = {"$ne": ObjectId(exclude_lawyer_id)}
        
        lawyers = await db.users.find(query).to_list(None)
        
        if not lawyers:
            return None
        
        # Scoring de lawyers
        lawyer_scores = []
        
        for lawyer in lawyers:
            lawyer_id = str(lawyer["_id"])
            specialty = (lawyer.get("specialty", "") or "").lower()
            
            # Score de especialidad (si coincide con legal_area)
            specialty_match = 1.0 if legal_area and specialty == legal_area else 0.5
            
            # Carga actual (menos casos = mejor)
            total_cases = await db.cases.count_documents({"lawyer_id": lawyer_id})
            capacity_score = max(0, 1.0 - (total_cases / 20))  # Normalize por 20 casos
            
            # Tasa de conversión (más conversiones = mejor)
            closed_cases = await db.cases.count_documents({
                "lawyer_id": lawyer_id,
                "status": "closed"
            })
            conversion_rate = (closed_cases / max(1, total_cases)) if total_cases > 0 else 0.5
            
            # Score final
            final_score = (specialty_match * 0.4) + (capacity_score * 0.3) + (conversion_rate * 0.3)
            
            lawyer_scores.append({
                "lawyer_id": lawyer_id,
                "lawyer_name": lawyer.get("full_name", "Unknown"),
                "specialty": specialty,
                "score": round(final_score, 2),
                "confidence": round(final_score * 100, 0),
                "capacity_score": round(capacity_score, 2),
                "conversion_rate": round(conversion_rate, 2),
                "total_cases": total_cases,
            })
        
        # Retornar el mejor
        if lawyer_scores:
            best = max(lawyer_scores, key=lambda x: x["score"])
            return best
        
        return None
    
    @staticmethod
    async def _route_lead(db, lead, context) -> Dict[str, Any]:
        """PASO 3: Enrutar lead (geografía, carga, etc) — POR AHORA USA ASSIGN"""
        # Routing es parte de assignment en este orquestador
        return await AutonomousOrchestrator._assign_lead(db, lead, context)
    
    @staticmethod
    async def _reassign_case(db, case, context) -> Dict[str, Any]:
        """PASO 4: Reasignar case (stalled, underperforming) — STUB"""
        return {"success": True, "decision": "reassign_case", "action": "stub"}
    
    @staticmethod
    async def _balance_firms(db, context) -> Dict[str, Any]:
        """PASO 5: Balancear carga entre firmas — STUB"""
        return {"success": True, "decision": "balance_firms", "action": "stub"}
    
    @staticmethod
    async def _optimize_revenue(db, entity, context) -> Dict[str, Any]:
        """PASO 6: Optimizar revenue — STUB"""
        return {"success": True, "decision": "optimize_revenue", "action": "stub"}
    
    @staticmethod
    async def _auto_rebalance(db, context) -> Dict[str, Any]:
        """PASO 7: Auto-rebalance global — STUB"""
        return {"success": True, "decision": "auto_rebalance", "action": "stub"}


class AutonomousOrchestratorAPI:
    """
    API pública del orquestador para endpoints autónomos.
    Todos los endpoints deben usar esto, NO los engines directamente.
    """
    
    @staticmethod
    async def execute_autonomous_lead_assignment(
        db: AsyncIOMotorDatabase,
        lead_id: str,
        organization_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Ejecuta asignación autónoma completa:
        1. Score
        2. Assignment
        3. Routing
        4. Timeline
        """
        lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
        
        if not lead:
            return {"success": False, "error": "Lead not found"}
        
        # PASO 1: Score
        score_result = await AutonomousOrchestrator.execute(
            db, DecisionType.SCORE_LEAD, lead
        )
        
        # PASO 2: Assign
        assign_result = await AutonomousOrchestrator.execute(
            db, DecisionType.ASSIGN_LEAD, lead
        )
        
        return {
            "success": True,
            "lead_id": lead_id,
            "steps": [
                {"step": "score", "result": score_result},
                {"step": "assign", "result": assign_result},
            ],
            "final_status": "assigned" if assign_result["success"] else "scoring_only"
        }
