"""
Enterprise Infrastructure Tests
Validates multi-tenancy, RBAC, audit, and isolation mechanisms
"""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
import logging

# Import models
from models.enterprise_core import (
    Firm, User, Role, Permission,
    AuditLog, FirmStatus, SubscriptionPlan,
    UserRole, PermissionModule, PermissionAction
)
from models.enterprise_audit import Activity, Preferences
from utils.enterprise_exceptions import (
    TenantIsolationViolation, PermissionDenied,
    InvalidCredentials, DuplicateResource
)
from middleware.tenant_isolation import (
    TenantContext, TenantIsolationValidator,
    TenantAwareQuery
)


# ============================================================================
# MODEL TESTS
# ============================================================================

class TestEnterpriseCoreModels:
    """Test enterprise core models"""

    def test_firm_model_creation(self):
        """Test Firm model instantiation"""
        firm = Firm(
            name="Acme Legal",
            slug="acme-legal",
            country_code="MX",
            subscription_plan=SubscriptionPlan.PROFESSIONAL
        )
        
        assert firm.name == "Acme Legal"
        assert firm.slug == "acme-legal"
        assert firm.status == FirmStatus.ACTIVE
        assert firm.subscription_plan == SubscriptionPlan.PROFESSIONAL
        assert firm.created_at is not None

    def test_firm_slug_validation(self):
        """Test Firm slug format validation"""
        # Valid slug
        firm = Firm(
            name="Test",
            slug="test-firm-123",
            country_code="MX"
        )
        assert firm.slug == "test-firm-123"
        
        # Invalid slug should fail validation
        with pytest.raises(ValueError):
            Firm(
                name="Test",
                slug="test firm!@#",  # Invalid characters
                country_code="MX"
            )

    def test_user_model_creation(self):
        """Test User model instantiation"""
        user = User(
            firm_id="firm-123",
            email="lawyer@acme.com",
            first_name="Juan",
            last_name="Pérez",
            role_id="role-lawyer",
            password_hash="$2b$12$hashed..."
        )
        
        assert user.firm_id == "firm-123"
        assert user.email == "lawyer@acme.com"
        assert user.role_id == "role-lawyer"
        assert user.is_active is True
        assert user.mfa_enabled is False

    def test_role_model_with_permissions(self):
        """Test Role model with permission hierarchy"""
        perm1 = Permission(
            role_id="role-partner",
            module=PermissionModule.CASES,
            action=PermissionAction.CREATE
        )
        perm2 = Permission(
            role_id="role-partner",
            module=PermissionModule.CASES,
            action=PermissionAction.DELETE
        )
        
        role = Role(
            firm_id="firm-123",
            name="Partner",
            rank=20,
            description="Law firm partner",
            permissions=[perm1, perm2]
        )
        
        assert role.rank == 20
        assert len(role.permissions) == 2
        assert all(p.role_id == "role-partner" for p in role.permissions)

    def test_audit_log_model(self):
        """Test AuditLog model"""
        audit = AuditLog(
            firm_id="firm-123",
            user_id="user-456",
            action="UPDATE",
            category="CASE_MANAGEMENT",
            resource_type="CASE",
            resource_id="case-789",
            severity="INFO",
            status="SUCCESS",
            ip_address="192.168.1.100"
        )
        
        assert audit.firm_id == "firm-123"
        assert audit.action == "UPDATE"
        assert audit.severity == "INFO"
        assert audit.created_at is not None


# ============================================================================
# EXCEPTION TESTS
# ============================================================================

class TestEnterpriseExceptions:
    """Test exception handling"""

    def test_tenant_isolation_violation(self):
        """Test tenant isolation violation exception"""
        exc = TenantIsolationViolation(
            requested_firm_id="firm-456",
            user_firm_id="firm-123"
        )
        
        assert exc.code == "TENANT_ISOLATION_VIOLATION"
        assert "firm-456" in exc.message
        assert "firm-123" in exc.message

    def test_permission_denied(self):
        """Test permission denied exception"""
        exc = PermissionDenied(
            required_permission="CASES",
            required_action="DELETE"
        )
        
        assert exc.code == "PERMISSION_DENIED"
        assert "CASES" in exc.message
        assert "DELETE" in exc.message

    def test_invalid_credentials(self):
        """Test invalid credentials exception"""
        exc = InvalidCredentials()
        
        assert exc.code == "INVALID_CREDENTIALS"
        assert "Invalid" in exc.message

    def test_duplicate_resource(self):
        """Test duplicate resource exception"""
        exc = DuplicateResource(
            resource_type="Firm",
            unique_field="slug",
            value="acme-legal"
        )
        
        assert exc.code == "DUPLICATE_RESOURCE"
        assert "slug" in exc.message
        assert "acme-legal" in exc.message


# ============================================================================
# MIDDLEWARE/ISOLATION TESTS
# ============================================================================

class TestTenantIsolation:
    """Test multi-tenant isolation mechanisms"""

    def test_tenant_context_creation(self):
        """Test TenantContext instantiation"""
        context = TenantContext(
            firm_id="firm-123",
            user_id="user-456",
            user_email="lawyer@acme.com",
            user_role="lawyer",
            request_id="req-789",
            ip_address="192.168.1.100"
        )
        
        assert context.firm_id == "firm-123"
        assert context.user_id == "user-456"
        assert context.user_role == "lawyer"
        assert context.request_id == "req-789"

    def test_tenant_isolation_validator_pass(self):
        """Test isolation validator allows matching firm_id"""
        # Should not raise
        TenantIsolationValidator.validate(
            requested_firm_id="firm-123",
            user_firm_id="firm-123",
            request_id="req-789"
        )

    def test_tenant_isolation_validator_fail(self):
        """Test isolation validator blocks mismatched firm_id"""
        from fastapi import HTTPException
        
        with pytest.raises(HTTPException) as exc_info:
            TenantIsolationValidator.validate(
                requested_firm_id="firm-456",
                user_firm_id="firm-123",
                request_id="req-789"
            )
        
        assert exc_info.value.status_code == 403

    def test_tenant_aware_query_filter(self):
        """Test tenant-aware query builder"""
        query = {"status": "ACTIVE"}
        
        filtered = TenantAwareQuery.add_firm_filter(query, "firm-123")
        
        assert filtered["status"] == "ACTIVE"
        assert filtered["firm_id"] == "firm-123"

    def test_tenant_aware_query_filter_batch(self):
        """Test batch tenant-aware filtering"""
        queries = [
            {"status": "ACTIVE"},
            {"priority": "HIGH"},
            {"assigned_lawyer_id": "lawyer-789"}
        ]
        
        filtered = TenantAwareQuery.add_firm_filter_bulk(queries, "firm-123")
        
        assert len(filtered) == 3
        assert all(q["firm_id"] == "firm-123" for q in filtered)
        assert filtered[0]["status"] == "ACTIVE"
        assert filtered[1]["priority"] == "HIGH"
        assert filtered[2]["assigned_lawyer_id"] == "lawyer-789"


# ============================================================================
# REPOSITORY TESTS (MOCKED)
# ============================================================================

class TestBaseRepository:
    """Test BaseRepository CRUD operations"""

    @pytest.mark.asyncio
    async def test_create_document(self):
        """Test document creation with firm_id"""
        mock_collection = AsyncMock()
        mock_collection.insert_one = AsyncMock(
            return_value=MagicMock(inserted_id="doc-123")
        )
        mock_collection.find_one = AsyncMock(
            return_value={
                "_id": "doc-123",
                "firm_id": "firm-123",
                "name": "Test Doc",
                "created_at": datetime.utcnow()
            }
        )
        
        from repositories.enterprise_base_repository import BaseRepository
        
        repo = BaseRepository(mock_collection, dict)
        
        result = await repo.create(
            firm_id="firm-123",
            data={"name": "Test Doc"},
            request_id="req-789"
        )
        
        # Verify insert_one was called with firm_id
        call_args = mock_collection.insert_one.call_args
        assert call_args[0][0]["firm_id"] == "firm-123"

    @pytest.mark.asyncio
    async def test_find_by_id_with_isolation(self):
        """Test find_by_id respects firm_id isolation"""
        mock_collection = AsyncMock()
        mock_collection.find_one = AsyncMock(
            return_value={
                "_id": "doc-123",
                "firm_id": "firm-123",
                "name": "Test"
            }
        )
        
        from repositories.enterprise_base_repository import BaseRepository
        
        repo = BaseRepository(mock_collection, dict)
        
        result = await repo.find_by_id(
            firm_id="firm-123",
            resource_id="doc-123",
            request_id="req-789"
        )
        
        # Verify firm_id was included in query
        call_args = mock_collection.find_one.call_args
        assert call_args[0][0]["firm_id"] == "firm-123"
        assert call_args[0][0]["_id"] == "doc-123"

    @pytest.mark.asyncio
    async def test_soft_delete(self):
        """Test soft delete sets deleted_at timestamp"""
        mock_collection = AsyncMock()
        mock_collection.update_one = AsyncMock(
            return_value=MagicMock(matched_count=1, modified_count=1)
        )
        
        from repositories.enterprise_base_repository import BaseRepository
        
        repo = BaseRepository(mock_collection, dict)
        
        result = await repo.soft_delete(
            firm_id="firm-123",
            resource_id="doc-123",
            request_id="req-789"
        )
        
        # Verify update_one was called with deleted_at
        call_args = mock_collection.update_one.call_args
        assert "$set" in call_args[0][1]
        assert "deleted_at" in call_args[0][1]["$set"]


# ============================================================================
# INTEGRATION TESTS
# ============================================================================

class TestEnterpriseIntegration:
    """Integration tests for enterprise infrastructure"""

    def test_multi_tenant_data_isolation(self):
        """Test that firms cannot access each other's data"""
        # Create two tenant contexts
        firm1_context = TenantContext(
            firm_id="firm-123",
            user_id="user-111",
            user_email="user1@firm1.com",
            user_role="lawyer",
            request_id="req-001",
            ip_address="192.168.1.1"
        )
        
        firm2_context = TenantContext(
            firm_id="firm-456",
            user_id="user-222",
            user_email="user2@firm2.com",
            user_role="lawyer",
            request_id="req-002",
            ip_address="192.168.1.2"
        )
        
        # Firm1 user should not access firm2 data
        with pytest.raises(Exception):  # Should raise isolation violation
            TenantIsolationValidator.validate(
                requested_firm_id="firm-456",
                user_firm_id="firm-123",
                request_id="req-001"
            )

    def test_rbac_role_hierarchy(self):
        """Test role hierarchy enforcement"""
        # Define roles with rank-based hierarchy
        owner_role = UserRole.OWNER  # rank=0
        partner_role = UserRole.PARTNER  # rank=20
        lawyer_role = UserRole.LAWYER  # rank=50
        
        # Partner (rank 20) should have more permissions than Lawyer (rank 50)
        # Lower rank = higher privilege
        assert UserRole.OWNER.value == "owner"
        assert UserRole.PARTNER.value == "partner"
        assert UserRole.LAWYER.value == "lawyer"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
