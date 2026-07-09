"""
Test webhook idempotency for exactly-once delivery.

CRITICAL FIX (S5.3-Finding#10): Ensures webhooks are processed
exactly once, preventing duplicate transactions.
"""
import pytest
from unittest.mock import AsyncMock, Mock, patch
from datetime import datetime
from utils.webhook_idempotency import (
    WebhookIdempotencyManager,
    WebhookProcessor,
    SUPPORTED_SERVICES,
)


@pytest.mark.asyncio
async def test_idempotency_manager_initialization():
    """Verify idempotency manager initialization."""
    mock_db = AsyncMock()
    mock_db.webhook_events = AsyncMock()
    
    manager = WebhookIdempotencyManager(mock_db)
    
    assert manager.db is mock_db
    assert manager.ttl_days == 30
    print("✓ Idempotency manager initialized")


@pytest.mark.asyncio
async def test_extract_idempotency_key_stripe():
    """Verify Stripe idempotency key extraction."""
    mock_db = AsyncMock()
    manager = WebhookIdempotencyManager(mock_db)
    
    event = {
        "id": "evt_123456",
        "type": "charge.succeeded",
        "data": {"object": {"id": "ch_123"}}
    }
    
    key = manager._extract_idempotency_key(event, "stripe")
    assert key == "evt_123456"
    print("✓ Stripe idempotency key extracted")


@pytest.mark.asyncio
async def test_extract_idempotency_key_mercadopago():
    """Verify MercadoPago idempotency key extraction."""
    mock_db = AsyncMock()
    manager = WebhookIdempotencyManager(mock_db)
    
    event = {
        "id": "mp_evt_789",
        "type": "payment.created",
        "data": {}
    }
    
    key = manager._extract_idempotency_key(event, "mercadopago")
    assert key == "mp_evt_789"
    print("✓ MercadoPago idempotency key extracted")


@pytest.mark.asyncio
async def test_extract_event_type():
    """Verify event type extraction."""
    mock_db = AsyncMock()
    manager = WebhookIdempotencyManager(mock_db)
    
    event = {
        "id": "evt_123",
        "type": "charge.succeeded"
    }
    
    event_type = manager._extract_event_type(event, "stripe")
    assert event_type == "charge.succeeded"
    print("✓ Event type extracted")


@pytest.mark.asyncio
async def test_has_been_processed():
    """Verify webhook processing detection."""
    mock_db = AsyncMock()
    mock_collection = AsyncMock()
    mock_db.webhook_events = mock_collection
    
    manager = WebhookIdempotencyManager(mock_db)
    
    # Mock: webhook already processed
    mock_collection.find_one.return_value = {"idempotency_key": "evt_123"}
    
    result = await manager.has_been_processed("evt_123", "stripe")
    assert result is True
    print("✓ Processed webhook detected")
    
    # Mock: webhook not processed
    mock_collection.find_one.return_value = None
    result = await manager.has_been_processed("evt_456", "stripe")
    assert result is False
    print("✓ New webhook detected")


@pytest.mark.asyncio
async def test_get_cached_response():
    """Verify cached response retrieval."""
    mock_db = AsyncMock()
    mock_collection = AsyncMock()
    mock_db.webhook_events = mock_collection
    
    manager = WebhookIdempotencyManager(mock_db)
    
    cached_result = {"status": "success", "transaction_id": "tx_123"}
    mock_collection.find_one.return_value = {
        "idempotency_key": "evt_123",
        "result": cached_result
    }
    
    result = await manager.get_cached_response("evt_123", "stripe")
    assert result == cached_result
    print("✓ Cached response retrieved")


@pytest.mark.asyncio
async def test_store_webhook():
    """Verify webhook storage."""
    mock_db = AsyncMock()
    mock_collection = AsyncMock()
    mock_db.webhook_events = mock_collection
    mock_collection.insert_one = AsyncMock()
    
    manager = WebhookIdempotencyManager(mock_db)
    
    event_data = {"id": "evt_123", "type": "charge.succeeded"}
    result = {"status": "ok", "transaction_id": "tx_123"}
    
    success = await manager.store_webhook(
        idempotency_key="evt_123",
        service="stripe",
        event_type="charge.succeeded",
        event_data=event_data,
        result=result
    )
    
    assert success is True
    assert mock_collection.insert_one.called
    print("✓ Webhook stored successfully")


@pytest.mark.asyncio
async def test_mark_retry():
    """Verify retry marking."""
    mock_db = AsyncMock()
    mock_collection = AsyncMock()
    mock_db.webhook_events = mock_collection
    
    manager = WebhookIdempotencyManager(mock_db)
    
    # Mock: update successful
    mock_result = Mock()
    mock_result.modified_count = 1
    mock_collection.update_one = AsyncMock(return_value=mock_result)
    
    success = await manager.mark_retry("evt_123", "stripe")
    assert success is True
    print("✓ Retry marked")


@pytest.mark.asyncio
async def test_webhook_processor_first_execution():
    """Verify webhook processor on first execution."""
    mock_db = AsyncMock()
    mock_db.client = AsyncMock()
    mock_db.webhook_events = AsyncMock()
    
    # Mock transaction
    mock_session = AsyncMock()
    mock_transaction = AsyncMock()
    mock_session.start_transaction = AsyncMock(return_value=mock_transaction)
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_transaction.__aenter__ = AsyncMock(return_value=None)
    mock_transaction.__aexit__ = AsyncMock(return_value=None)
    mock_db.client.start_session = AsyncMock(return_value=mock_session)
    
    processor = WebhookProcessor(mock_db)
    processor.idempotency.has_been_processed = AsyncMock(return_value=False)
    processor.idempotency.store_webhook = AsyncMock()
    
    event = {"id": "evt_123", "type": "charge.succeeded"}
    
    async def handler(event):
        return {"status": "ok", "tx_id": "tx_123"}
    
    result = await processor.process(
        event=event,
        service="stripe",
        handler=handler
    )
    
    assert result["status"] == "ok"
    assert result["cached"] is False
    print("✓ Webhook processed on first execution")


@pytest.mark.asyncio
async def test_webhook_processor_duplicate_detection():
    """Verify webhook processor detects duplicates."""
    mock_db = AsyncMock()
    
    processor = WebhookProcessor(mock_db)
    processor.idempotency.has_been_processed = AsyncMock(return_value=True)
    processor.idempotency.get_cached_response = AsyncMock(
        return_value={"status": "ok", "tx_id": "tx_123"}
    )
    
    event = {"id": "evt_123", "type": "charge.succeeded"}
    
    async def handler(event):
        # Should not be called for duplicate
        raise Exception("Handler should not be called")
    
    result = await processor.process(
        event=event,
        service="stripe",
        handler=handler
    )
    
    assert result["status"] == "ok"
    assert result["cached"] is True
    print("✓ Duplicate webhook detected and cached response returned")


def test_supported_services():
    """Verify supported services configuration."""
    assert "stripe" in SUPPORTED_SERVICES
    assert "mercadopago" in SUPPORTED_SERVICES
    assert "email_service" in SUPPORTED_SERVICES
    
    stripe_config = SUPPORTED_SERVICES["stripe"]
    assert stripe_config["idempotency_key_field"] == "id"
    assert stripe_config["event_type_field"] == "type"
    
    print("✓ Supported services configured")


@pytest.mark.asyncio
async def test_webhook_processor_handler_failure():
    """Verify webhook processor handles handler failures."""
    mock_db = AsyncMock()
    mock_db.client = AsyncMock()
    
    mock_session = AsyncMock()
    mock_transaction = AsyncMock()
    mock_session.start_transaction = AsyncMock(return_value=mock_transaction)
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_transaction.__aenter__ = AsyncMock(return_value=None)
    mock_transaction.__aexit__ = AsyncMock(return_value=None)
    mock_db.client.start_session = AsyncMock(return_value=mock_session)
    
    processor = WebhookProcessor(mock_db)
    processor.idempotency.has_been_processed = AsyncMock(return_value=False)
    processor.idempotency.mark_retry = AsyncMock()
    
    event = {"id": "evt_123", "type": "charge.succeeded"}
    
    async def failing_handler(event):
        raise Exception("Processing failed")
    
    with pytest.raises(Exception):
        await processor.process(
            event=event,
            service="stripe",
            handler=failing_handler
        )
    
    # Retry should be marked
    assert processor.idempotency.mark_retry.called
    print("✓ Handler failure handled correctly")


@pytest.mark.asyncio
async def test_webhook_processor_invalid_event():
    """Verify webhook processor rejects invalid events."""
    mock_db = AsyncMock()
    
    processor = WebhookProcessor(mock_db)
    
    # Event missing idempotency key
    event = {"type": "charge.succeeded"}  # Missing 'id'
    
    async def handler(event):
        return {}
    
    with pytest.raises(ValueError):
        await processor.process(
            event=event,
            service="stripe",
            handler=handler
        )
    
    print("✓ Invalid event rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
