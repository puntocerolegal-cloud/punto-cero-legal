"""
SOC Dashboard API — Real-Time Security Monitoring Endpoints
═══════════════════════════════════════════════════════════════════

Purpose:
  FastAPI endpoints for SOC dashboard visualization.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional

router = APIRouter(prefix="/soc", tags=["Security Operations Center"])


# Dependency for SOC authentication (admin only)
async def require_soc_admin(current_user: dict = None):
    """Verify SOC access (admin only)."""
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="SOC access denied")
    return current_user


@router.get("/overview")
async def get_soc_overview(_: dict = Depends(require_soc_admin)):
    """
    Get global security overview.
    
    Returns:
    - System health score (0-100)
    - Active incident count
    - Critical events
    - Top attack vectors
    """
    from security.soc_aggregation_engine import get_soc_aggregation
    
    aggregation = get_soc_aggregation()
    metrics = aggregation.get_metrics()
    
    return {
        "system_health": metrics["system_health_score"],
        "active_incidents": metrics["active_incidents"],
        "critical_events": metrics["critical_events"],
        "total_events": metrics["event_count"],
        "attack_vectors": metrics["attack_vectors"],
        "timestamp": metrics["timestamp"],
    }


@router.get("/incidents")
async def get_incidents(_: dict = Depends(require_soc_admin)):
    """Get all active incidents."""
    from security.soc_incident_manager import get_incident_manager
    
    manager = get_incident_manager()
    return {
        "active": manager.get_active_incidents(),
        "critical": manager.get_critical_incidents(),
    }


@router.get("/incidents/{incident_id}")
async def get_incident(
    incident_id: str,
    _: dict = Depends(require_soc_admin),
):
    """Get specific incident details."""
    from security.soc_incident_manager import get_incident_manager
    
    manager = get_incident_manager()
    incident = manager.get_incident(incident_id)
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    return incident


@router.get("/events")
async def get_recent_events(
    limit: int = 100,
    severity: Optional[str] = None,
    _: dict = Depends(require_soc_admin),
):
    """Get recent security events."""
    from security.soc_event_stream import get_soc_stream
    
    stream = get_soc_stream()
    events = stream.get_recent_events(limit=limit)
    
    if severity:
        events = [e for e in events if e.get("severity") == severity]
    
    return {"events": events}


@router.get("/tenant/{tenant_id}/risk")
async def get_tenant_risk(
    tenant_id: str,
    _: dict = Depends(require_soc_admin),
):
    """Get risk metrics for tenant."""
    from security.soc_aggregation_engine import get_soc_aggregation
    
    aggregation = get_soc_aggregation()
    risk = aggregation.get_tenant_risk(tenant_id)
    
    return {
        "tenant_id": tenant_id,
        "risk_score": risk,
        "status": "high_risk" if risk > 70 else "medium_risk" if risk > 40 else "low_risk",
    }


@router.get("/user/{user_id}/risk")
async def get_user_risk(
    user_id: str,
    _: dict = Depends(require_soc_admin),
):
    """Get risk metrics for user."""
    from security.soc_aggregation_engine import get_soc_aggregation
    
    aggregation = get_soc_aggregation()
    risk = aggregation.get_user_risk(user_id)
    
    return {
        "user_id": user_id,
        "risk_score": risk,
        "status": "high_risk" if risk > 70 else "medium_risk" if risk > 40 else "low_risk",
    }


@router.get("/health")
async def get_system_health(_: dict = Depends(require_soc_admin)):
    """Get system security health."""
    from security.soc_aggregation_engine import get_soc_aggregation
    
    aggregation = get_soc_aggregation()
    metrics = aggregation.get_metrics()
    
    health = metrics["system_health_score"]
    
    if health >= 90:
        status = "excellent"
    elif health >= 70:
        status = "good"
    elif health >= 50:
        status = "fair"
    else:
        status = "poor"
    
    return {
        "health_score": health,
        "status": status,
        "metrics": metrics,
    }
