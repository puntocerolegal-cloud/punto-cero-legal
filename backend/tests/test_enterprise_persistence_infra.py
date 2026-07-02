import pytest

from services.enterprise_persistence_service import EnterprisePersistenceService
from utils.enterprise_permissions import can_access_resource
from utils.enterprise_validators import validate_persistence_payload
from utils.enterprise_audit import record_enterprise_event
from utils.enterprise_serializers import serialize_enterprise_resource


class FakeRepository:
    def __init__(self):
        self.records = []

    async def create(self, collection, document):
        document = dict(document)
        document.setdefault("_id", f"doc-{len(self.records) + 1}")
        self.records.append(document)
        return document

    async def list(self, collection, query=None):
        return [doc for doc in self.records if all(doc.get(k) == v for k, v in (query or {}).items())]


@pytest.mark.asyncio
async def test_service_creates_and_serializes_resource():
    service = EnterprisePersistenceService(repository=FakeRepository())

    saved = await service.create_resource(
        resource_type="preferences",
        firm_id="firm-1",
        user_id="user-1",
        payload={"theme": "dark"},
    )

    assert saved["resource_type"] == "preferences"
    assert saved["firm_id"] == "firm-1"
    assert saved["data"]["theme"] == "dark"
    assert saved["id"] == "doc-1"


def test_validator_rejects_unknown_resource_and_invalid_payload():
    with pytest.raises(ValueError):
        validate_persistence_payload("unknown", {})

    with pytest.raises(ValueError):
        validate_persistence_payload("preferences", {"theme": 42})


def test_permissions_check_tenant_scope():
    assert can_access_resource("firm_owner", "firm-1", "firm-1", False) is True
    assert can_access_resource("firm_owner", "firm-1", "firm-2", False) is False
    assert can_access_resource("firm_owner", "firm-1", "firm-2", True) is True


@pytest.mark.asyncio
async def test_audit_and_serialization_helpers():
    class FakeDB:
        def __init__(self):
            self.audit_entries = []

        async def enterprise_audit_logs(self):
            return self

        async def insert_one(self, document):
            self.audit_entries.append(document)
            return type("Result", (), {"inserted_id": "audit-1"})()

    db = FakeDB()
    audit_id = await record_enterprise_event(db, actor="user-1", action="create", resource_type="preferences", firm_id="firm-1")

    assert audit_id == "audit-1"
    assert db.audit_entries[0]["action"] == "create"

    serialized = serialize_enterprise_resource({"_id": "abc", "data": {"theme": "dark"}, "resource_type": "preferences"})
    assert serialized["id"] == "abc"
    assert serialized["data"]["theme"] == "dark"
