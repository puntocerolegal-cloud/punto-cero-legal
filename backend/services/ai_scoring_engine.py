from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from bson import ObjectId

class AIScoringEngine:
    """FASE 12.1: Lead scoring based on heuristic rules"""
    
    LEGAL_AREAS_PRIORITY = {
        "corporativo": 0.9,
        "mercantil": 0.9,
        "penal": 0.7,
        "laboral": 0.8,
        "civil": 0.6,
        "familiar": 0.5,
        "otro": 0.3,
    }
    
    COUNTRY_PRIORITY = {
        "colombia": 1.0,
        "mexico": 0.95,
        "argentina": 0.9,
        "chile": 0.9,
        "perú": 0.85,
    }
    
    @staticmethod
    async def score_lead(db: AsyncIOMotorDatabase, lead: dict) -> dict:
        """Calculate lead score (0-100) based on heuristic rules"""
        
        # Factor 1: Legal area priority (0-30 points)
        legal_area = (lead.get("legal_area", "otro") or "otro").lower()
        area_score = AIScoringEngine.LEGAL_AREAS_PRIORITY.get(legal_area, 0.3) * 30
        
        # Factor 2: Country priority (0-20 points)
        country = (lead.get("country", "colombia") or "colombia").lower()
        country_score = AIScoringEngine.COUNTRY_PRIORITY.get(country, 0.5) * 20
        
        # Factor 3: Estimated value (0-30 points)
        estimated_value = lead.get("estimated_value", 0) or 0
        value_score = min(30, (estimated_value / 5000) * 30)
        
        # Factor 4: Lead source urgency (0-15 points)
        source = (lead.get("source", "website") or "website").lower()
        source_urgency = {
            "referral": 15,
            "direct": 12,
            "website": 8,
            "social": 6,
            "crm": 5,
        }
        source_score = source_urgency.get(source, 5)
        
        # Factor 5: Age of lead - urgency (0-5 points)
        created_at = lead.get("created_at")
        age_score = 0
        if created_at:
            days_old = (datetime.utcnow() - created_at).days
            if days_old == 0:
                age_score = 5
            elif days_old <= 7:
                age_score = 3
            elif days_old <= 30:
                age_score = 1
        
        total_score = min(100, area_score + country_score + value_score + source_score + age_score)
        
        # Classify
        if total_score >= 71:
            classification = "ALTO_VALOR"
        elif total_score >= 31:
            classification = "MEDIO"
        else:
            classification = "BAJO_VALOR"
        
        # Estimate conversion probability based on classification
        conversion_probs = {
            "ALTO_VALOR": 65,
            "MEDIO": 40,
            "BAJO_VALOR": 15,
        }
        
        return {
            "score": round(total_score, 1),
            "classification": classification,
            "conversion_probability": conversion_probs[classification],
            "factors": {
                "legal_area_score": round(area_score, 1),
                "country_score": round(country_score, 1),
                "value_score": round(value_score, 1),
                "source_score": source_score,
                "age_score": age_score,
            },
        }

class AIAssignmentEngine:
    """FASE 12.2: Auto-assign leads to lawyers based on rules"""
    
    @staticmethod
    async def assign_lead(db: AsyncIOMotorDatabase, lead: dict, organization_id: Optional[str] = None) -> dict:
        """Assign a lead to the best lawyer"""
        
        legal_area = (lead.get("legal_area", "corporativo") or "corporativo").lower()
        country = (lead.get("country", "colombia") or "colombia").lower()
        lead_score = lead.get("ai_score", 50)
        
        # Get lawyers for organization
        query = {}
        if organization_id:
            query["organizationId"] = organization_id
        
        lawyers = await db.users.find({
            **query,
            "role": "lawyer",
            "status": {"$ne": "SUSPENDED"}
        }).to_list(None)
        
        if not lawyers:
            return {
                "assigned_lawyer_id": None,
                "reason": "No lawyers available",
                "confidence_score": 0,
            }
        
        # Score each lawyer
        lawyer_scores = []
        for lawyer in lawyers:
            score = 0
            reasons = []
            
            # Factor 1: Specialty match (0-40)
            specialties = (lawyer.get("specialties") or [])
            if legal_area in [s.lower() for s in specialties]:
                score += 40
                reasons.append("Especialidad coincide")
            else:
                score += 15
                reasons.append("Especialidad parcial")
            
            # Factor 2: Workload (0-30)
            open_cases = await db.cases.count_documents({
                "lawyer_id": str(lawyer["_id"]),
                "status": "open"
            })
            workload_score = max(0, 30 - (open_cases * 3))
            score += workload_score
            if open_cases < 5:
                reasons.append(f"Carga baja ({open_cases} casos)")
            
            # Factor 3: Country match (0-20)
            lawyer_country = (lawyer.get("country") or "colombia").lower()
            if lawyer_country == country:
                score += 20
                reasons.append("País coincide")
            else:
                score += 5
            
            # Factor 4: Performance (0-10)
            recent_cases = await db.cases.find({
                "lawyer_id": str(lawyer["_id"]),
                "status": "closed",
                "closed_at": {"$gte": datetime.utcnow() - timedelta(days=90)}
            }).to_list(None)
            
            if len(recent_cases) > 0:
                success_rate = sum(1 for c in recent_cases if c.get("outcome") == "success") / len(recent_cases)
                score += success_rate * 10
                reasons.append(f"Performance: {success_rate*100:.0f}%")
            
            lawyer_scores.append({
                "lawyer_id": str(lawyer["_id"]),
                "lawyer_name": lawyer.get("full_name", "Unknown"),
                "score": round(score, 1),
                "reasons": reasons,
            })
        
        # Sort by score
        lawyer_scores.sort(key=lambda x: x["score"], reverse=True)
        best = lawyer_scores[0]
        
        confidence = min(100, best["score"])
        
        return {
            "assigned_lawyer_id": best["lawyer_id"],
            "lawyer_name": best["lawyer_name"],
            "confidence_score": confidence,
            "reason": " | ".join(best["reasons"]),
            "alternatives": [
                {
                    "lawyer_id": l["lawyer_id"],
                    "lawyer_name": l["lawyer_name"],
                    "score": l["score"],
                }
                for l in lawyer_scores[1:3]
            ],
        }

class AICasePredictionEngine:
    """FASE 12.3: Predict case outcome success probability"""
    
    @staticmethod
    async def predict_case_outcome(db: AsyncIOMotorDatabase, case: dict) -> dict:
        """Predict probability of case success"""
        
        score = 0
        factors = {}
        
        # Factor 1: Case type difficulty (0-25)
        case_type = (case.get("type") or "civil").lower()
        type_difficulty = {
            "corporativo": 0.85,
            "penal": 0.6,
            "laboral": 0.75,
            "civil": 0.7,
            "familiar": 0.65,
        }
        type_score = type_difficulty.get(case_type, 0.5) * 25
        score += type_score
        factors["case_type_factor"] = round(type_score, 1)
        
        # Factor 2: Lawyer performance (0-30)
        lawyer_id = case.get("lawyer_id")
        if lawyer_id:
            lawyer = await db.users.find_one({"_id": ObjectId(lawyer_id)})
            if lawyer:
                similar_cases = await db.cases.find({
                    "lawyer_id": lawyer_id,
                    "type": case_type,
                    "status": "closed",
                }).to_list(None)
                
                if similar_cases:
                    success_rate = sum(1 for c in similar_cases if c.get("outcome") == "success") / len(similar_cases)
                    lawyer_score = success_rate * 30
                    score += lawyer_score
                    factors["lawyer_performance"] = round(lawyer_score, 1)
                else:
                    score += 15
                    factors["lawyer_performance"] = 15
        else:
            score += 10
            factors["lawyer_performance"] = 10
        
        # Factor 3: Case value estimation (0-20)
        case_value = case.get("estimated_value", 1000) or 1000
        if case_value > 100000:
            value_score = 20
        elif case_value > 50000:
            value_score = 15
        elif case_value > 10000:
            value_score = 10
        else:
            value_score = 5
        score += value_score
        factors["case_value_factor"] = value_score
        
        # Factor 4: Case duration (0-15)
        created_at = case.get("created_at")
        duration_score = 10
        if created_at:
            days_open = (datetime.utcnow() - created_at).days
            if days_open < 30:
                duration_score = 15
            elif days_open > 180:
                duration_score = 5
        score += duration_score
        factors["duration_factor"] = duration_score
        
        # Factor 5: Complexity (0-10) — based on description length
        description = case.get("description", "")
        complexity = min(10, max(0, (len(description) / 200) * 10))
        score += complexity
        factors["complexity_factor"] = round(complexity, 1)
        
        total = min(100, score)
        
        # Classification
        if total >= 75:
            outcome = "MUY_PROBABLE"
            recommendation = "Priorizar este caso"
        elif total >= 60:
            outcome = "PROBABLE"
            recommendation = "Gestión estándar"
        elif total >= 40:
            outcome = "INCIERTO"
            recommendation = "Preparar estrategia alternativa"
        else:
            outcome = "IMPROBABLE"
            recommendation = "Considerar acuerdo"
        
        return {
            "success_probability": round(total, 1),
            "outcome_classification": outcome,
            "recommendation": recommendation,
            "factors": factors,
        }
