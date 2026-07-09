"""
ExternalTenantResolver
Resolves tenant (firm_id) from external events that arrive without user context.

Used in webhook processing where MercadoPago sends payment events
but doesn't include our firm_id in the payload.

PHASE 3 - TASK S1-03:
Controlled integration to eliminate firm_id="system" placeholders
and use real firm_id from transaction lookup.
"""

import logging
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


async def resolve_tenant_from_webhook_event(
    db: AsyncIOMotorDatabase,
    event_type: str,
    event_data: Dict[str, Any]
) -> Optional[str]:
    """
    Resolve firm_id from webhook event data.
    
    Supports:
    - payment events: use external_reference to find Transaction
    - refund events: use payment_id to find Transaction
    - chargeback events: use payment_id to find Transaction
    - subscription events: use email to find User
    
    Args:
        db: MongoDB database connection
        event_type: Type of event (payment.approved, refund.created, etc.)
        event_data: Event data from MercadoPago webhook
    
    Returns:
        firm_id if found, None otherwise
    
    MIGRATION NOTE (S1-03):
    - This resolver is called AFTER HMAC validation
    - Returns real firm_id instead of temporary "system" placeholder
    - Enables full tenant isolation in audit logs and event tracking
    """
    
    if "payment" in event_type:
        # Payment events: use external_reference (our payment_id)
        return await _resolve_from_payment_event(db, event_data)
    
    elif "refund" in event_type:
        # Refund events: use payment_id to find transaction
        return await _resolve_from_refund_event(db, event_data)
    
    elif "chargeback" in event_type:
        # Chargeback events: use payment_id to find transaction
        return await _resolve_from_chargeback_event(db, event_data)
    
    elif "subscription" in event_type:
        # Subscription events: use email from payer
        return await _resolve_from_subscription_event(db, event_data)
    
    else:
        logger.warning(f"Unknown event type for tenant resolution: {event_type}")
        return None


async def _resolve_from_payment_event(
    db: AsyncIOMotorDatabase,
    payment_data: Dict[str, Any]
) -> Optional[str]:
    """
    Resolve firm_id from payment event.
    
    Payment event contains external_reference which is our payment_id.
    Lookup Transaction to find the firm_id.
    """
    external_ref = payment_data.get("external_reference")
    
    if not external_ref:
        logger.debug("Payment event has no external_reference, cannot resolve tenant")
        return None
    
    try:
        tx = await db.transactions.find_one({"payment_id": external_ref})
        if tx:
            firm_id = tx.get("firm_id")
            if firm_id:
                logger.debug(f"Resolved firm_id from payment event: {firm_id}")
                return firm_id
        else:
            logger.debug(f"Transaction not found for payment_id: {external_ref}")
    
    except Exception as e:
        logger.error(f"Error resolving tenant from payment event: {e}")
    
    return None


async def _resolve_from_refund_event(
    db: AsyncIOMotorDatabase,
    refund_data: Dict[str, Any]
) -> Optional[str]:
    """
    Resolve firm_id from refund event.
    
    Refund event contains payment_id (MercadoPago's payment ID).
    Lookup Transaction with mp_payment_id to find the firm_id.
    """
    payment_id = refund_data.get("payment_id")
    
    if not payment_id:
        logger.debug("Refund event has no payment_id, cannot resolve tenant")
        return None
    
    try:
        tx = await db.transactions.find_one({"mp_payment_id": payment_id})
        if tx:
            firm_id = tx.get("firm_id")
            if firm_id:
                logger.debug(f"Resolved firm_id from refund event: {firm_id}")
                return firm_id
        else:
            logger.debug(f"Transaction not found for mp_payment_id: {payment_id}")
    
    except Exception as e:
        logger.error(f"Error resolving tenant from refund event: {e}")
    
    return None


async def _resolve_from_chargeback_event(
    db: AsyncIOMotorDatabase,
    chargeback_data: Dict[str, Any]
) -> Optional[str]:
    """
    Resolve firm_id from chargeback event.
    
    Chargeback event contains payment_id (MercadoPago's payment ID).
    Lookup Transaction to find the firm_id.
    """
    payment_id = chargeback_data.get("payment_id")
    
    if not payment_id:
        logger.debug("Chargeback event has no payment_id, cannot resolve tenant")
        return None
    
    try:
        tx = await db.transactions.find_one({"mp_payment_id": payment_id})
        if tx:
            firm_id = tx.get("firm_id")
            if firm_id:
                logger.debug(f"Resolved firm_id from chargeback event: {firm_id}")
                return firm_id
        else:
            logger.debug(f"Transaction not found for mp_payment_id: {payment_id}")
    
    except Exception as e:
        logger.error(f"Error resolving tenant from chargeback event: {e}")
    
    return None


async def _resolve_from_subscription_event(
    db: AsyncIOMotorDatabase,
    subscription_data: Dict[str, Any]
) -> Optional[str]:
    """
    Resolve firm_id from subscription event.
    
    Subscription event contains payer.email.
    Lookup User to find associated firm or plan.
    
    NOTE: Subscriptions may not have firm_id directly.
    Falls back to "system" for now (will be enhanced in future phases).
    """
    payer = subscription_data.get("payer", {})
    user_email = payer.get("email")
    
    if not user_email:
        logger.debug("Subscription event has no payer email, cannot resolve tenant")
        return None
    
    try:
        user = await db.users.find_one({"email": user_email})
        if user:
            # Try to get firm_id from user if they have one
            firm_id = user.get("firm_id")
            if firm_id:
                logger.debug(f"Resolved firm_id from subscription event: {firm_id}")
                return firm_id
        else:
            logger.debug(f"User not found for email: {user_email}")
    
    except Exception as e:
        logger.error(f"Error resolving tenant from subscription event: {e}")
    
    return None
