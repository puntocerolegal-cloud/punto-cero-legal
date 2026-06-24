from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

class LeadScoringEngine:
    """AI engine for lead scoring and qualification"""
    
    @staticmethod
    async def score_lead(db: AsyncIOMotorDatabase, lead: dict) -> dict:
        """
        Score a lead from 0-100 based on conversion probability.
        Factors: legal area, client profile, contact attempts, response time
        """
        score = 0
        factors = {}
        
        # Factor 1: Status progression (0-30 points)
        status = lead.get("status", "new")
        status_scores = {"new": 0, "contacted": 10, "qualified": 25, "converted": 30}
        status_score = status_scores.get(status, 0)
        score += status_score
        factors["status"] = status_score
        
        # Factor 2: Lead age (0-20 points) - newer is better
        created_at = lead.get("created_at")
        if created_at:
            days_old = (datetime.utcnow() - created_at).days
            if days_old < 3:
                age_score = 20
            elif days_old < 7:
                age_score = 15
            elif days_old < 14:
                age_score = 10
            else:
                age_score = max(0, 20 - (days_old // 7))
        else:
            age_score = 15
        
        score += age_score
        factors["age"] = age_score
        
        # Factor 3: Legal area complexity (0-20 points)
        legal_area = lead.get("legal_area", "").lower()
        complexity_scores = {
            "corporate": 20,
            "contracts": 18,
            "family": 15,
            "labor": 15,
            "property": 18,
            "immigration": 12,
            "tax": 20,
            "other": 8,
        }
        area_score = complexity_scores.get(legal_area, 8)
        score += area_score
        factors["legal_area"] = area_score
        
        # Factor 4: Description quality (0-15 points)
        description = lead.get("description", "")
        if len(description) > 200:
            desc_score = 15
        elif len(description) > 100:
            desc_score = 10
        elif len(description) > 50:
            desc_score = 5
        else:
            desc_score = 0
        
        score += desc_score
        factors["description_quality"] = desc_score
        
        # Factor 5: Contact info completeness (0-15 points)
        contact_score = 0
        if lead.get("client_email"):
            contact_score += 5
        if lead.get("client_phone"):
            contact_score += 5
        if lead.get("country"):
            contact_score += 5
        
        score += contact_score
        factors["contact_info"] = contact_score
        
        # Classify
        if score >= 80:
            classification = "Muy Alto"
        elif score >= 60:
            classification = "Alto"
        elif score >= 40:
            classification = "Medio"
        else:
            classification = "Bajo"
        
        return {
            "score": min(100, score),
            "classification": classification,
            "conversion_probability": f"{min(100, score)}%",
            "estimated_value": LeadScoringEngine._estimate_value(legal_area),
            "urgency": LeadScoringEngine._calculate_urgency(days_old if created_at else 0),
            "factors": factors,
        }
    
    @staticmethod
    def _estimate_value(legal_area: str) -> float:
        """Estimate case value by legal area"""
        values = {
            "corporate": 5000,
            "contracts": 3000,
            "tax": 4500,
            "property": 3500,
            "family": 2500,
            "labor": 2000,
            "immigration": 1500,
            "other": 1000,
        }
        return values.get(legal_area.lower(), 1000)
    
    @staticmethod
    def _calculate_urgency(days_old: int) -> str:
        """Calculate urgency based on lead age"""
        if days_old < 2:
            return "Crítica"
        elif days_old < 7:
            return "Alta"
        elif days_old < 14:
            return "Media"
        else:
            return "Baja"


class AutoAssignmentEngine:
    """AI engine for automatic lead assignment to agents"""
    
    @staticmethod
    async def find_best_agent(
        db: AsyncIOMotorDatabase,
        lead: dict,
    ) -> Optional[str]:
        """
        Find best agent for a lead based on:
        - Country match
        - Legal specialty
        - Current workload
        - Conversion rate
        """
        # Get all active agents
        agents = await db.users.find({"role": "socio_comercial", "status": "ACTIVE"}).to_list(None)
        
        if not agents:
            return None
        
        scored_agents = []
        
        for agent in agents:
            score = 0
            agent_id = str(agent["_id"])
            
            # Factor 1: Country match (40 points)
            if agent.get("country") == lead.get("country"):
                score += 40
            
            # Factor 2: Workload balance (30 points)
            agent_leads = await db.leads.count_documents({"agent_id": agent_id, "status": {"$in": ["new", "contacted"]}})
            if agent_leads < 5:
                score += 30
            elif agent_leads < 10:
                score += 20
            elif agent_leads < 15:
                score += 10
            
            # Factor 3: Conversion rate (20 points)
            all_agent_leads = await db.leads.find({"agent_id": agent_id}).to_list(None)
            if len(all_agent_leads) > 0:
                converted = len([l for l in all_agent_leads if l.get("status") == "converted"])
                conversion_rate = (converted / len(all_agent_leads)) * 100
                if conversion_rate > 50:
                    score += 20
                elif conversion_rate > 30:
                    score += 15
                elif conversion_rate > 10:
                    score += 10
            
            # Factor 4: Recent activity (10 points)
            week_ago = datetime.utcnow() - timedelta(days=7)
            recent_activity = await db.leads.count_documents({
                "agent_id": agent_id,
                "created_at": {"$gte": week_ago}
            })
            if recent_activity > 0:
                score += 10
            
            if score > 0:
                scored_agents.append({
                    "agent_id": agent_id,
                    "score": score,
                    "workload": agent_leads,
                })
        
        if not scored_agents:
            return None
        
        # Return agent with highest score
        best_agent = sorted(scored_agents, key=lambda x: x["score"], reverse=True)[0]
        return best_agent["agent_id"]


class LawyerRecommendationEngine:
    """AI engine for recommending best lawyers for leads"""
    
    @staticmethod
    async def recommend_lawyers(
        db: AsyncIOMotorDatabase,
        lead: dict,
        org_id: Optional[str] = None,
        limit: int = 3,
    ) -> List[Dict[str, Any]]:
        """
        Recommend lawyers based on:
        - Specialty match
        - Country
        - Experience (case count)
        - Performance (conversion/satisfaction)
        """
        query = {"role": "lawyer", "status": "ACTIVE"}
        if org_id:
            query["organizationId"] = org_id
        
        lawyers = await db.users.find(query).to_list(None)
        
        if not lawyers:
            return []
        
        recommendations = []
        legal_area = lead.get("legal_area", "").lower()
        
        for lawyer in lawyers:
            score = 0
            lawyer_id = str(lawyer["_id"])
            
            # Factor 1: Specialty match (40 points)
            if legal_area in lawyer.get("specialty", "").lower():
                score += 40
            
            # Factor 2: Country match (25 points)
            if lawyer.get("country") == lead.get("country"):
                score += 25
            
            # Factor 3: Experience (20 points)
            lawyer_cases = await db.cases.count_documents({"lawyer_id": lawyer_id})
            if lawyer_cases > 50:
                score += 20
            elif lawyer_cases > 25:
                score += 15
            elif lawyer_cases > 10:
                score += 10
            
            # Factor 4: Availability (15 points)
            open_cases = await db.cases.count_documents({
                "lawyer_id": lawyer_id,
                "status": "open"
            })
            if open_cases < 5:
                score += 15
            elif open_cases < 10:
                score += 10
            elif open_cases < 15:
                score += 5
            
            if score > 0:
                recommendations.append({
                    "lawyer_id": lawyer_id,
                    "lawyer_name": lawyer.get("full_name"),
                    "specialty": lawyer.get("specialty"),
                    "country": lawyer.get("country"),
                    "experience": lawyer_cases,
                    "open_cases": open_cases,
                    "score": score,
                })
        
        # Sort by score and return top N
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        return recommendations[:limit]


class RevenueForecastEngine:
    """AI engine for revenue forecasting"""
    
    @staticmethod
    async def forecast_revenue(db: AsyncIOMotorDatabase) -> dict:
        """
        Forecast revenue for 30, 90, and 365 days.
        Based on: current leads, conversion rate, average case value, commission rate
        """
        # Get base metrics
        all_leads = await db.leads.find({}).to_list(None)
        all_commissions = await db.commissions.find({}).to_list(None)
        all_cases = await db.cases.find({}).to_list(None)
        
        total_leads = len(all_leads)
        total_commissions = sum(c.get("amount", 0) for c in all_commissions)
        total_cases = len(all_cases)
        
        # Calculate base metrics
        conversion_rate = (total_cases / total_leads * 100) if total_leads > 0 else 0
        avg_commission = (total_commissions / len(all_commissions)) if all_commissions else 0
        
        # Get leads per day average
        week_ago = datetime.utcnow() - timedelta(days=7)
        leads_this_week = await db.leads.count_documents({"created_at": {"$gte": week_ago}})
        leads_per_day = leads_this_week / 7
        
        # Forecast
        forecast_30 = leads_per_day * 30 * (conversion_rate / 100) * avg_commission
        forecast_90 = leads_per_day * 90 * (conversion_rate / 100) * avg_commission
        forecast_365 = leads_per_day * 365 * (conversion_rate / 100) * avg_commission
        
        return {
            "forecast_30_days": round(forecast_30, 2),
            "forecast_90_days": round(forecast_90, 2),
            "forecast_365_days": round(forecast_365, 2),
            "confidence": "Media",
            "based_on": {
                "leads_per_day": round(leads_per_day, 2),
                "conversion_rate": round(conversion_rate, 2),
                "avg_commission": round(avg_commission, 2),
            },
        }


class AIAlertsEngine:
    """AI engine for generating intelligent alerts"""
    
    @staticmethod
    async def generate_alerts(db: AsyncIOMotorDatabase) -> List[dict]:
        """Generate alerts based on AI analysis"""
        alerts = []
        
        # Alert 1: Stalled leads (no contact in 7+ days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        stalled_leads = await db.leads.find({
            "status": {"$in": ["new", "contacted"]},
            "updated_at": {"$lt": week_ago}
        }).to_list(None)
        
        if len(stalled_leads) > 0:
            alerts.append({
                "type": "stalled_leads",
                "severity": "warning",
                "message": f"{len(stalled_leads)} leads sin seguimiento > 7 días",
                "count": len(stalled_leads),
            })
        
        # Alert 2: Overloaded agents (>15 active leads)
        agents = await db.users.find({"role": "socio_comercial"}).to_list(None)
        overloaded = []
        
        for agent in agents:
            active_leads = await db.leads.count_documents({
                "agent_id": str(agent["_id"]),
                "status": {"$in": ["new", "contacted", "qualified"]}
            })
            if active_leads > 15:
                overloaded.append({
                    "agent_id": str(agent["_id"]),
                    "agent_name": agent.get("full_name"),
                    "active_leads": active_leads,
                })
        
        if overloaded:
            alerts.append({
                "type": "overloaded_agents",
                "severity": "alert",
                "message": f"{len(overloaded)} agentes con carga > 15 leads",
                "agents": overloaded,
            })
        
        # Alert 3: Low conversion rate
        all_leads = await db.leads.find({}).to_list(None)
        if len(all_leads) > 10:
            converted = len([l for l in all_leads if l.get("status") == "converted"])
            conversion_rate = (converted / len(all_leads)) * 100
            
            if conversion_rate < 10:
                alerts.append({
                    "type": "low_conversion",
                    "severity": "alert",
                    "message": f"Conversión global muy baja: {conversion_rate:.1f}%",
                    "rate": conversion_rate,
                })
        
        # Alert 4: No activity from overloaded firms
        organizations = await db.organizations.find({}).to_list(None)
        for org in organizations:
            month_ago = datetime.utcnow() - timedelta(days=30)
            org_id = str(org["_id"])
            
            recent_leads = await db.leads.find({
                "created_at": {"$gte": month_ago},
                "country": org.get("country")
            }).to_list(None)
            
            if len(recent_leads) == 0:
                alerts.append({
                    "type": "firm_no_activity",
                    "severity": "warning",
                    "message": f"Firma {org.get('name')} sin leads nuevos > 30 días",
                    "org_id": org_id,
                })
        
        return alerts
