"""
Cron Jobs — Punto Cero Legal

Tareas automatizadas que se ejecutan en horarios regulares:
1. Renovación automática de suscripciones (diariamente)
2. Reintento de renovaciones fallidas (diariamente)
3. Limpieza de eventos de webhook antiguos (semanalmente)
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from services.renewal_service import check_and_renew_subscriptions, retry_failed_renewals

logger = logging.getLogger(__name__)


class CronScheduler:
    """Planificador de tareas cron."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.is_running = False
        self.task = None
    
    async def start(self):
        """Inicia el planificador de cron jobs."""
        if self.is_running:
            logger.warning("Cron scheduler already running")
            return
        
        self.is_running = True
        self.task = asyncio.create_task(self._run_scheduler())
        logger.info("Cron scheduler started")
    
    async def stop(self):
        """Detiene el planificador de cron jobs."""
        self.is_running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        logger.info("Cron scheduler stopped")
    
    async def _run_scheduler(self):
        """Loop principal del planificador."""
        while self.is_running:
            try:
                now = datetime.utcnow()
                
                # Ejecutar diariamente a las 00:00 UTC
                if now.hour == 0 and now.minute == 0:
                    await self._run_daily_jobs()
                
                # Ejecutar cada 6 horas
                if now.hour % 6 == 0 and now.minute == 0:
                    await self._run_6hourly_jobs()
                
                # Ejecutar semanalmente (lunes a las 02:00 UTC)
                if now.weekday() == 0 and now.hour == 2 and now.minute == 0:
                    await self._run_weekly_jobs()
                
                # Dormir 1 minuto antes de chequear de nuevo
                await asyncio.sleep(60)
            
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.exception("Cron scheduler error")
                await asyncio.sleep(60)
    
    async def _run_daily_jobs(self):
        """Tareas que se ejecutan diariamente."""
        logger.info("Running daily cron jobs...")

        try:
            # Renovación automática
            stats = await check_and_renew_subscriptions(self.db)
            logger.info(f"Daily renewal check: {stats}")
        except Exception as e:
            logger.error(f"Daily renewal check failed: {e}")

        try:
            # Reintento de renovaciones fallidas
            stats = await retry_failed_renewals(self.db)
            logger.info(f"Daily retry failed renewals: {stats}")
        except Exception as e:
            logger.error(f"Daily retry failed renewals failed: {e}")

        try:
            # Actualizar estado de suscripciones expiradas
            await self._mark_expired_subscriptions()
        except Exception as e:
            logger.error(f"Mark expired subscriptions failed: {e}")

        try:
            # Expirar trials de firmas que hayan vencido
            from services.trial_service import check_and_expire_trials
            stats = await check_and_expire_trials(self.db)
            logger.info(f"Daily trial expiration check: {stats}")
        except Exception as e:
            logger.error(f"Daily trial expiration check failed: {e}")
    
    async def _run_6hourly_jobs(self):
        """Tareas que se ejecutan cada 6 horas."""
        logger.info("Running 6-hourly cron jobs...")
        
        try:
            # Detectar suscripciones próximas a vencer (próximas 48 horas)
            await self._notify_near_expiration()
        except Exception as e:
            logger.error(f"Notify near expiration failed: {e}")
    
    async def _run_weekly_jobs(self):
        """Tareas que se ejecutan semanalmente."""
        logger.info("Running weekly cron jobs...")
        
        try:
            # Limpiar webhook_logs antiguos (guardar últimos 30 días)
            await self._cleanup_old_webhook_logs()
        except Exception as e:
            logger.error(f"Cleanup webhook logs failed: {e}")
        
        try:
            # Limpiar webhook_events procesados (guardar últimos 30 días)
            await self._cleanup_old_webhook_events()
        except Exception as e:
            logger.error(f"Cleanup webhook events failed: {e}")
        
        try:
            # Generar reporte de salud
            await self._generate_health_report()
        except Exception as e:
            logger.error(f"Generate health report failed: {e}")
    
    async def _mark_expired_subscriptions(self):
        """Marca suscripciones como expiradas si ya pasó la fecha."""
        cutoff = datetime.utcnow()
        
        result = await self.db.users.update_many(
            {
                "subscription_status": "active",
                "subscription_expires_at": {"$lt": cutoff},
            },
            {
                "$set": {
                    "subscription_status": "expired",
                    "expired_at": datetime.utcnow(),
                }
            }
        )
        
        logger.info(f"Marked {result.modified_count} subscriptions as expired")
    
    async def _notify_near_expiration(self):
        """Notifica a usuarios sobre suscripciones próximas a vencer."""
        now = datetime.utcnow()
        cutoff = now + timedelta(days=2)  # Próximas 48 horas
        
        users = await self.db.users.find({
            "subscription_status": "active",
            "subscription_expires_at": {"$gte": now, "$lte": cutoff},
            "last_expiration_notice": {"$lt": now - timedelta(days=1)},  # Máximo una vez al día
        }).to_list(None)
        
        for user in users:
            try:
                await self.db.notifications.insert_one({
                    "user_id": str(user["_id"]),
                    "type": "subscription_expiring_soon",
                    "title": "Tu suscripción vence pronto",
                    "message": f"Tu plan {user.get('plan_id')} vence el {user['subscription_expires_at'].strftime('%Y-%m-%d')}.",
                    "read": False,
                    "created_at": datetime.utcnow(),
                })
                
                await self.db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"last_expiration_notice": datetime.utcnow()}}
                )
            except Exception as e:
                logger.warning(f"Failed to notify user {user.get('email')}: {e}")
        
        logger.info(f"Notified {len(users)} users about expiring subscriptions")
    
    async def _cleanup_old_webhook_logs(self):
        """Elimina webhook logs más antiguos que 30 días."""
        cutoff = datetime.utcnow() - timedelta(days=30)
        
        result = await self.db.webhook_logs.delete_many({"created_at": {"$lt": cutoff}})
        
        logger.info(f"Deleted {result.deleted_count} old webhook logs")
    
    async def _cleanup_old_webhook_events(self):
        """Elimina webhook events procesados más antiguos que 30 días."""
        cutoff = datetime.utcnow() - timedelta(days=30)
        
        result = await self.db.webhook_events.delete_many({
            "created_at": {"$lt": cutoff},
            "processed": True,
        })
        
        logger.info(f"Deleted {result.deleted_count} old webhook events")
    
    async def _generate_health_report(self):
        """Genera reporte de salud del sistema de pagos."""
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)
        
        # Contar eventos y errores
        total_webhooks = await self.db.webhook_logs.count_documents({"created_at": {"$gte": week_ago}})
        failed_webhooks = await self.db.webhook_logs.count_documents({
            "created_at": {"$gte": week_ago},
            "result_status": "error"
        })
        
        # Contar suscripciones por estado
        active = await self.db.users.count_documents({"subscription_status": "active"})
        expired = await self.db.users.count_documents({"subscription_status": "expired"})
        pending = await self.db.users.count_documents({"subscription_status": "pending_payment"})
        
        # Guardar reporte
        report = {
            "generated_at": now,
            "period": "last_7_days",
            "webhooks": {
                "total": total_webhooks,
                "failed": failed_webhooks,
                "success_rate": f"{((total_webhooks - failed_webhooks) / total_webhooks * 100):.1f}%" if total_webhooks > 0 else "—",
            },
            "subscriptions": {
                "active": active,
                "expired": expired,
                "pending_payment": pending,
            }
        }
        
        await self.db.system_reports.insert_one(report)
        
        logger.info(f"Health report generated: {active} active, {expired} expired, {pending} pending")


# Instancia global del scheduler (singleton)
_scheduler: Optional[CronScheduler] = None
_scheduler_lock = asyncio.Lock()


async def init_cron_scheduler(db: AsyncIOMotorDatabase):
    """Inicializa el scheduler de cron jobs (singleton pattern).

    Garantiza:
    - Una sola instancia del scheduler
    - Sin tareas duplicadas
    - Sobrevive reinicios del servidor
    """
    global _scheduler

    async with _scheduler_lock:
        # Si ya existe y está corriendo, no hacer nada
        if _scheduler and _scheduler.is_running:
            logger.info("Cron scheduler already running, skipping initialization")
            return

        # Crear nueva instancia
        if _scheduler is None:
            _scheduler = CronScheduler(db)

        # Iniciar
        await _scheduler.start()
        logger.info("Cron scheduler initialized (singleton pattern)")


async def shutdown_cron_scheduler():
    """Detiene el scheduler de cron jobs de forma segura."""
    global _scheduler

    async with _scheduler_lock:
        if _scheduler and _scheduler.is_running:
            await _scheduler.stop()
            logger.info("Cron scheduler shutdown complete")


def get_cron_scheduler() -> CronScheduler:
    """Obtiene la instancia del scheduler."""
    return _scheduler
