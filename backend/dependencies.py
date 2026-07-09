"""
Repository Dependency Injection
FastAPI Depends() functions for all repositories

Use in route handlers:
    @router.get("/something")
    async def my_endpoint(
        webhook_repo: WebhookEventRepository = Depends(get_webhook_repo),
        audit_repo: AuditLogRepository = Depends(get_audit_repo),
        ...
    ):
        ...
"""

from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from repositories import (
    TransactionRepository,
    WebhookEventRepository,
    AuditLogRepository,
    UserRepository,
    NotificationRepository,
    RefundRepository,
    ChargebackRepository,
)


async def get_db() -> AsyncIOMotorDatabase:
    """Dependency injection for MongoDB database."""
    from server import db
    return db


async def get_transaction_repo(
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> TransactionRepository:
    """Dependency injection for TransactionRepository."""
    return TransactionRepository(db.transactions)


async def get_webhook_repo(
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> WebhookEventRepository:
    """Dependency injection for WebhookEventRepository."""
    return WebhookEventRepository(db.webhook_events)


async def get_audit_repo(
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> AuditLogRepository:
    """Dependency injection for AuditLogRepository."""
    return AuditLogRepository(db.audit_logs)


async def get_user_repo(
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> UserRepository:
    """Dependency injection for UserRepository."""
    return UserRepository(db.users)


async def get_notification_repo(
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> NotificationRepository:
    """Dependency injection for NotificationRepository."""
    return NotificationRepository(db.notifications)


async def get_refund_repo(
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> RefundRepository:
    """Dependency injection for RefundRepository."""
    return RefundRepository(db.refunds)


async def get_chargeback_repo(
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> ChargebackRepository:
    """Dependency injection for ChargebackRepository."""
    return ChargebackRepository(db.chargebacks)
