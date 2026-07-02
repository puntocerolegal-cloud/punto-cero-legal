import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException, status
from backend.services.enterprise_case_service import CaseService
from backend.services.enterprise_document_service import DocumentService
from backend.repositories.case_repository import CaseRepository
from backend.repositories.document_repository import DocumentRepository
from backend.repositories.document_access_log_repository import DocumentAccessLogRepository
from backend.utils.enterprise_exceptions import ValidationException


@pytest.fixture
def mock_case_repo():
    return AsyncMock(spec=CaseRepository)


@pytest.fixture
def mock_document_repo():
    return AsyncMock(spec=DocumentRepository)


@pytest.fixture
def mock_access_log_repo():
    return AsyncMock(spec=DocumentAccessLogRepository)


@pytest.fixture
def mock_audit_service():
    return AsyncMock()


@pytest.fixture
def case_service(mock_case_repo, mock_audit_service):
    return CaseService(case_repo=mock_case_repo, audit_service=mock_audit_service)


@pytest.fixture
def document_service(mock_document_repo, mock_access_log_repo, mock_audit_service):
    return DocumentService(
        document_repo=mock_document_repo,
        access_log_repo=mock_access_log_repo,
        audit_service=mock_audit_service
    )


@pytest.mark.asyncio
class TestCaseService:
    
    async def test_create_case_success(self, case_service, mock_case_repo, mock_audit_service):
        """Test creating a case successfully"""
        mock_case_repo.create.return_value = {
            "_id": "case-123",
            "firm_id": "firm-001",
            "title": "Smith v. Jones",
            "case_owner_id": "user-001"
        }
        
        result = await case_service.create_case(
            firm_id="firm-001",
            case_owner_id="user-001",
            created_by="user-001",
            title="Smith v. Jones",
            legal_area="litigation",
            description="Contract dispute",
            request_id="req-123"
        )
        
        assert result["_id"] == "case-123"
        assert result["firm_id"] == "firm-001"
        mock_case_repo.create.assert_called_once()
        mock_audit_service.log_action.assert_called_once()

    async def test_create_case_invalid_title(self, case_service):
        """Test creating case with invalid title"""
        with pytest.raises(ValidationException):
            await case_service.create_case(
                firm_id="firm-001",
                case_owner_id="user-001",
                created_by="user-001",
                title="",
                legal_area="litigation",
                request_id="req-123"
            )

    async def test_create_case_duplicate_case_number(self, case_service, mock_case_repo):
        """Test creating case with duplicate case number"""
        mock_case_repo.find_by_case_number.return_value = {"_id": "existing"}
        
        with pytest.raises(ValidationException):
            await case_service.create_case(
                firm_id="firm-001",
                case_owner_id="user-001",
                created_by="user-001",
                title="Smith v. Jones",
                legal_area="litigation",
                case_number="2024-001",
                request_id="req-123"
            )

    async def test_get_case_success(self, case_service, mock_case_repo):
        """Test retrieving a case"""
        mock_case_repo.find_by_id.return_value = {
            "_id": "case-123",
            "firm_id": "firm-001",
            "case_owner_id": "user-001",
            "assigned_users": ["user-001"]
        }
        
        result = await case_service.get_case(
            firm_id="firm-001",
            case_id="case-123",
            user_id="user-001",
            request_id="req-123"
        )
        
        assert result["_id"] == "case-123"

    async def test_get_case_not_found(self, case_service, mock_case_repo):
        """Test retrieving non-existent case"""
        mock_case_repo.find_by_id.return_value = None
        
        with pytest.raises(HTTPException) as exc:
            await case_service.get_case(
                firm_id="firm-001",
                case_id="case-999",
                user_id="user-001",
                request_id="req-123"
            )
        assert exc.value.status_code == status.HTTP_404_NOT_FOUND

    async def test_get_case_access_denied(self, case_service, mock_case_repo):
        """Test accessing case without permission"""
        mock_case_repo.find_by_id.return_value = {
            "_id": "case-123",
            "case_owner_id": "user-002",
            "assigned_users": []
        }
        
        with pytest.raises(HTTPException) as exc:
            await case_service.get_case(
                firm_id="firm-001",
                case_id="case-123",
                user_id="user-001",
                request_id="req-123"
            )
        assert exc.value.status_code == status.HTTP_403_FORBIDDEN

    async def test_assign_user_to_case(self, case_service, mock_case_repo, mock_audit_service):
        """Test assigning user to case"""
        mock_case_repo.find_by_id.return_value = {"_id": "case-123"}
        mock_case_repo.assign_user.return_value = True
        
        result = await case_service.assign_user_to_case(
            firm_id="firm-001",
            case_id="case-123",
            user_id="user-002",
            assigned_by="user-001",
            request_id="req-123"
        )
        
        assert result is True
        mock_case_repo.assign_user.assert_called_once()
        mock_audit_service.log_action.assert_called_once()

    async def test_close_case_success(self, case_service, mock_case_repo, mock_audit_service):
        """Test closing a case"""
        mock_case_repo.find_by_id.return_value = {"_id": "case-123"}
        mock_case_repo.update.return_value = {"_id": "case-123", "status": "closed"}
        
        result = await case_service.close_case(
            firm_id="firm-001",
            case_id="case-123",
            closed_by="user-001",
            request_id="req-123"
        )
        
        assert result["status"] == "closed"
        mock_case_repo.update.assert_called_once()
        mock_audit_service.log_action.assert_called_once()


@pytest.mark.asyncio
class TestDocumentService:
    
    async def test_create_document_success(self, document_service, mock_document_repo, mock_audit_service):
        """Test creating a document"""
        mock_document_repo.create.return_value = {
            "_id": "doc-123",
            "firm_id": "firm-001",
            "case_id": "case-001",
            "title": "Discovery Brief"
        }
        
        result = await document_service.create_document(
            firm_id="firm-001",
            case_id="case-001",
            owner_id="user-001",
            created_by="user-001",
            title="Discovery Brief",
            document_type="brief",
            request_id="req-123"
        )
        
        assert result["_id"] == "doc-123"
        mock_document_repo.create.assert_called_once()
        mock_audit_service.log_action.assert_called_once()

    async def test_create_document_invalid_title(self, document_service):
        """Test creating document with invalid title"""
        with pytest.raises(ValidationException):
            await document_service.create_document(
                firm_id="firm-001",
                case_id="case-001",
                owner_id="user-001",
                created_by="user-001",
                title="",
                document_type="brief",
                request_id="req-123"
            )

    async def test_get_document_success(self, document_service, mock_document_repo, mock_access_log_repo):
        """Test retrieving a document"""
        mock_document_repo.find_by_id.return_value = {
            "_id": "doc-123",
            "firm_id": "firm-001",
            "owner_id": "user-001",
            "access_list": {"user-001": "owner"}
        }
        mock_access_log_repo.log_access.return_value = {"logged": True}
        
        result = await document_service.get_document(
            firm_id="firm-001",
            document_id="doc-123",
            user_id="user-001",
            request_id="req-123"
        )
        
        assert result["_id"] == "doc-123"
        mock_access_log_repo.log_access.assert_called_once()

    async def test_get_document_not_found(self, document_service, mock_document_repo):
        """Test retrieving non-existent document"""
        mock_document_repo.find_by_id.return_value = None
        
        with pytest.raises(HTTPException) as exc:
            await document_service.get_document(
                firm_id="firm-001",
                document_id="doc-999",
                user_id="user-001",
                request_id="req-123"
            )
        assert exc.value.status_code == status.HTTP_404_NOT_FOUND

    async def test_get_document_access_denied(self, document_service, mock_document_repo):
        """Test accessing document without permission"""
        mock_document_repo.find_by_id.return_value = {
            "_id": "doc-123",
            "owner_id": "user-002",
            "access_list": {}
        }
        
        with pytest.raises(HTTPException) as exc:
            await document_service.get_document(
                firm_id="firm-001",
                document_id="doc-123",
                user_id="user-001",
                request_id="req-123"
            )
        assert exc.value.status_code == status.HTTP_403_FORBIDDEN

    async def test_grant_access_success(self, document_service, mock_document_repo, mock_audit_service):
        """Test granting document access"""
        mock_document_repo.find_by_id.return_value = {
            "_id": "doc-123",
            "owner_id": "user-001"
        }
        mock_document_repo.grant_access.return_value = True
        
        result = await document_service.grant_access(
            firm_id="firm-001",
            document_id="doc-123",
            user_id="user-002",
            access_level="editor",
            granted_by="user-001",
            request_id="req-123"
        )
        
        assert result is True
        mock_document_repo.grant_access.assert_called_once()
        mock_audit_service.log_action.assert_called_once()

    async def test_grant_access_denied_not_owner(self, document_service, mock_document_repo):
        """Test granting access when not owner"""
        mock_document_repo.find_by_id.return_value = {
            "_id": "doc-123",
            "owner_id": "user-002"
        }
        
        with pytest.raises(HTTPException) as exc:
            await document_service.grant_access(
                firm_id="firm-001",
                document_id="doc-123",
                user_id="user-003",
                access_level="editor",
                granted_by="user-001",
                request_id="req-123"
            )
        assert exc.value.status_code == status.HTTP_403_FORBIDDEN

    async def test_sign_document_success(self, document_service, mock_document_repo, mock_audit_service):
        """Test signing a document"""
        mock_document_repo.find_by_id.return_value = {"_id": "doc-123"}
        mock_document_repo.mark_signed.return_value = True
        
        result = await document_service.sign_document(
            firm_id="firm-001",
            document_id="doc-123",
            signed_by="user-001",
            request_id="req-123"
        )
        
        assert result is True
        mock_document_repo.mark_signed.assert_called_once()
        mock_audit_service.log_action.assert_called_once()

    async def test_update_document_creates_version(self, document_service, mock_document_repo, mock_audit_service):
        """Test updating document creates a version"""
        mock_document_repo.find_by_id.return_value = {
            "_id": "doc-123",
            "owner_id": "user-001",
            "version_number": 1,
            "file_url": "http://example.com/doc.pdf",
            "file_size": 1024,
            "file_hash": "abc123"
        }
        mock_document_repo.add_version.return_value = True
        mock_document_repo.update.return_value = {
            "_id": "doc-123",
            "version_number": 2
        }
        
        result = await document_service.update_document(
            firm_id="firm-001",
            document_id="doc-123",
            updated_by="user-001",
            updates={"title": "Updated Brief"},
            change_summary="Added new section",
            request_id="req-123"
        )
        
        assert result["version_number"] == 2
        mock_document_repo.add_version.assert_called_once()
        mock_audit_service.log_action.assert_called_once()

    async def test_list_documents_by_case(self, document_service, mock_document_repo):
        """Test listing documents by case"""
        mock_document_repo.find_by_case.return_value = [
            {"_id": "doc-1", "owner_id": "user-001", "access_list": {"user-001": "owner"}},
            {"_id": "doc-2", "owner_id": "user-002", "access_list": {"user-001": "viewer"}}
        ]
        mock_document_repo.count_by_case.return_value = 2
        
        result = await document_service.list_documents_by_case(
            firm_id="firm-001",
            case_id="case-001",
            user_id="user-001",
            request_id="req-123"
        )
        
        assert len(result["items"]) == 2
        assert result["total"] == 2

    async def test_get_document_access_log(self, document_service, mock_access_log_repo):
        """Test retrieving document access log"""
        mock_access_log_repo.find_by_document.return_value = [
            {"_id": "log-1", "user_id": "user-001", "action": "view"},
            {"_id": "log-2", "user_id": "user-002", "action": "download"}
        ]
        mock_access_log_repo.find_document_access_summary.return_value = {
            "total_accesses": 2,
            "unique_users": 2,
            "actions": {"view": 1, "download": 1}
        }
        
        result = await document_service.get_document_access_log(
            firm_id="firm-001",
            document_id="doc-123",
            request_id="req-123"
        )
        
        assert result["summary"]["total_accesses"] == 2
        assert len(result["logs"]) == 2


@pytest.mark.asyncio
class TestCaseAndDocumentIntegration:
    
    async def test_case_and_document_lifecycle(self, case_service, document_service, mock_case_repo, mock_document_repo, mock_access_log_repo):
        """Test complete case and document lifecycle"""
        firm_id = "firm-001"
        user_id = "user-001"
        request_id = "req-123"
        
        # Create case
        mock_case_repo.create.return_value = {
            "_id": "case-123",
            "firm_id": firm_id,
            "title": "Smith v. Jones"
        }
        case = await case_service.create_case(
            firm_id=firm_id,
            case_owner_id=user_id,
            created_by=user_id,
            title="Smith v. Jones",
            legal_area="litigation",
            request_id=request_id
        )
        assert case["_id"] == "case-123"
        
        # Create document
        mock_document_repo.create.return_value = {
            "_id": "doc-123",
            "firm_id": firm_id,
            "case_id": "case-123",
            "title": "Discovery Brief"
        }
        doc = await document_service.create_document(
            firm_id=firm_id,
            case_id="case-123",
            owner_id=user_id,
            created_by=user_id,
            title="Discovery Brief",
            document_type="brief",
            request_id=request_id
        )
        assert doc["_id"] == "doc-123"
        
        # Verify creation calls
        mock_case_repo.create.assert_called_once()
        mock_document_repo.create.assert_called_once()
