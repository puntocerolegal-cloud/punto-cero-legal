"""
Servicio de Gestión de Trials de 7 Días para Firmas

Funciones auxiliares para:
1. Calcular días restantes de un trial
2. Verificar si un trial está activo o expirado
3. Expirar automáticamente trials vencidos
4. Notificar sobre vencimiento próximo
"""
from datetime import datetime, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

logger = logging.getLogger(__name__)


def calculate_trial_remaining_days(trial_ends_at: datetime) -> int:
    """Calcula los días restantes del trial basado en la fecha de vencimiento.
    
    Retorna:
    - > 0: días restantes
    - 0: vence hoy
    - < 0: ya expiró (valor negativo)
    """
    if not trial_ends_at:
        return 0
    
    remaining = (trial_ends_at - datetime.utcnow()).days
    return remaining


def is_trial_active(trial_status: str, trial_ends_at: datetime) -> bool:
    """Verifica si el trial está activo.
    
    Condiciones:
    - trial_status == "active"
    - trial_ends_at > ahora
    """
    if not trial_status or trial_status != "active":
        return False
    
    if not trial_ends_at:
        return False
    
    return datetime.utcnow() < trial_ends_at


def should_expire_trial(trial_status: str, trial_ends_at: datetime) -> bool:
    """Verifica si el trial debería estar expirado.
    
    Condiciones:
    - trial_status == "active"
    - trial_ends_at <= ahora
    """
    if not trial_status or trial_status != "active":
        return False
    
    if not trial_ends_at:
        return False
    
    return datetime.utcnow() >= trial_ends_at


async def expire_firm_trial(db: AsyncIOMotorDatabase, firm_id: str) -> dict:
    """Expira el trial de una firma.
    
    Cambios realizados:
    - trial_status: "active" → "expired"
    - subscription_status: "trial" → "expired"
    - updated_at: ahora
    
    Retorna: datos actualizados de la firma
    """
    try:
        result = await db.firms.update_one(
            {"_id": ObjectId(firm_id)},
            {
                "$set": {
                    "trial_status": "expired",
                    "subscription_status": "expired",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 1:
            firm = await db.firms.find_one({"_id": ObjectId(firm_id)})
            logger.info(f"Trial expirado para firma {firm_id}: {firm['name']}")
            return {"success": True, "message": f"Trial expirado para {firm['name']}", "firm_id": firm_id}
        else:
            return {"success": False, "message": "Firma no encontrada", "firm_id": firm_id}
    
    except Exception as e:
        logger.error(f"Error expirando trial para firma {firm_id}: {str(e)}")
        return {"success": False, "message": f"Error: {str(e)}", "firm_id": firm_id}


async def check_and_expire_trials(db: AsyncIOMotorDatabase) -> dict:
    """Verifica todos los trials activos y expira los que hayan vencido.
    
    Se ejecuta diariamente desde el cron job.
    
    Retorna: estadísticas de la operación
    """
    try:
        # Buscar todas las firmas con trial activo
        active_trials = await db.firms.find({"trial_status": "active"}).to_list(None)
        
        expired_count = 0
        still_active = 0
        
        for firm in active_trials:
            trial_ends_at = firm.get("trial_ends_at")
            
            if trial_ends_at and should_expire_trial("active", trial_ends_at):
                await expire_firm_trial(db, str(firm["_id"]))
                expired_count += 1
            else:
                still_active += 1
        
        return {
            "total_checked": len(active_trials),
            "expired": expired_count,
            "still_active": still_active,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error en check_and_expire_trials: {str(e)}")
        return {"error": str(e), "timestamp": datetime.utcnow().isoformat()}


async def get_trial_summary_by_status(db: AsyncIOMotorDatabase) -> dict:
    """Obtiene resumen de trials por estado.
    
    Útil para dashboard de admin.
    """
    try:
        total_trials = await db.firms.count_documents({"trial_status": {"$in": ["active", "expired"]}})
        active_trials = await db.firms.count_documents({"trial_status": "active"})
        expired_trials = await db.firms.count_documents({"trial_status": "expired"})
        
        # Trials que vencen en los próximos 3 días
        three_days_from_now = datetime.utcnow() + timedelta(days=3)
        expiring_soon = await db.firms.count_documents({
            "trial_status": "active",
            "trial_ends_at": {"$lte": three_days_from_now, "$gt": datetime.utcnow()}
        })
        
        return {
            "total": total_trials,
            "active": active_trials,
            "expired": expired_trials,
            "expiring_soon_3_days": expiring_soon,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error en get_trial_summary_by_status: {str(e)}")
        return {"error": str(e)}
