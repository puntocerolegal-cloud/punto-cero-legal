from typing import Dict, List, Any, Optional
from datetime import datetime
from fastapi import HTTPException, status
from repositories.document_repository import DocumentRepository
from repositories.document_access_log_repository import DocumentAccessLogRepository
from utils.enterprise_exceptions import ValidationException


class DocumentService:
    def __init__(
        self,
        document_repo: DocumentRepository,
        access_log_repo: DocumentAccessLogRepository,
        audit_service=None
    ):
        self.document_repo = document_repo
        self.access_log_repo = access_log_repo
        self.audit_service = audit_service

    async def create_document(
        self,
        firm_id: str,
        case_id: str,
        owner_id: str,
        created_by: str,
        title: str,
        document_type: str,
        content_text: Optional[str] = None,
        is_confidential: bool = False,
        requires_signature: bool = False,
        tags: List[str] = None,
        request_id: str = ""
    ) -> Dict[str, Any]:
        if not title or len(title) > 300:
            raise ValidationException("Document title must be 1-300 characters")
        
        doc_data = {
            "firm_id": firm_id,
            "case_id": case_id,
            "owner_id": owner_id,
            "title": title,
            "document_type": document_type,
            "status": "draft",
            "content_text": content_text,
            "is_confidential": is_confidential,
            "requires_signature": requires_signature,
            "tags": tags or [],
            "version_number": 1,
            "versions": [],
            "access_list": {owner_id: "owner"},
            "review_count": 0,
            "created_by": created_by,
            "updated_by": created_by,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        doc = await self.document_repo.create(firm_id, doc_data, request_id)
        
        if self.audit_service:
            await self.audit_service.log_action(
                firm_id=firm_id,
                user_id=created_by,
                action="CREATE_DOCUMENT",
                resource_type="document",
                resource_id=str(doc.get("_id")),
                severity="info",
                request_id=request_id
            )
        
        return doc

    async def get_document(self, firm_id: str, document_id: str, user_id: str, request_id: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> Dict[str, Any]:
        doc = await self.document_repo.find_by_id(firm_id, document_id, request_id)
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
        access_level = doc.get("access_list", {}).get(user_id)
        if not access_level and doc.get("owner_id") != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
        await self.access_log_repo.log_access(
            firm_id=firm_id,
            log_data={
                "document_id": document_id,
                "case_id": doc.get("case_id"),
                "user_id": user_id,
                "action": "view",
                "access_level": access_level or "owner",
                "ip_address": ip_address,
                "user_agent": user_agent,
                "request_id": request_id
            },
            request_id=request_id
        )
        
        return doc

    async def list_documents_by_case(self, firm_id: str, case_id: str, user_id: str, request_id: str, skip: int = 0, limit: int = 100) -> Dict[str, Any]:
        docs = await self.document_repo.find_by_case(firm_id, case_id, request_id, skip, limit)
        accessible_docs = [
            doc for doc in docs
            if doc.get("owner_id") == user_id or user_id in doc.get("access_list", {})
        ]
        total = await self.document_repo.count_by_case(firm_id, case_id)
        
        return {
            "items": accessible_docs,
            "total": total,
            "skip": skip,
            "limit": limit
        }

    async def list_user_documents(self, firm_id: str, user_id: str, request_id: str, skip: int = 0, limit: int = 100) -> Dict[str, Any]:
        docs = await self.document_repo.find_user_accessible(firm_id, user_id, request_id, skip, limit)
        total = len(docs)
        
        return {
            "items": docs,
            "total": total,
            "skip": skip,
            "limit": limit
        }

    async def search_documents(self, firm_id: str, search_term: str, request_id: str, skip: int = 0, limit: int = 100) -> Dict[str, Any]:
        docs = await self.document_repo.search(firm_id, search_term, request_id, skip, limit)
        total = len(docs)
        
        return {
            "items": docs,
            "total": total,
            "skip": skip,
            "limit": limit
        }

    async def update_document(
        self,
        firm_id: str,
        document_id: str,
        updated_by: str,
        updates: Dict[str, Any],
        change_summary: Optional[str] = None,
        request_id: str = ""
    ) -> Dict[str, Any]:
        doc = await self.document_repo.find_by_id(firm_id, document_id, request_id)
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
        if doc.get("owner_id") != updated_by:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner can update")
        
        current_version = doc.get("version_number", 1)
        version_data = {
            "version": current_version,
            "file_url": doc.get("file_url"),
            "file_size": doc.get("file_size", 0),
            "created_by": updated_by,
            "change_summary": change_summary,
            "file_hash": doc.get("file_hash"),
            "created_at": datetime.utcnow()
        }
        
        await self.document_repo.add_version(firm_id, document_id, version_data, request_id)
        
        updates["updated_by"] = updated_by
        updates["updated_at"] = datetime.utcnow()
        
        updated_doc = await self.document_repo.update(firm_id, document_id, updates, request_id)
        
        if self.audit_service:
            await self.audit_service.log_action(
                firm_id=firm_id,
                user_id=updated_by,
                action="UPDATE_DOCUMENT",
                resource_type="document",
                resource_id=document_id,
                severity="info",
                request_id=request_id
            )
        
        return updated_doc

    async def grant_access(self, firm_id: str, document_id: str, user_id: str, access_level: str, granted_by: str, request_id: str) -> bool:
        doc = await self.document_repo.find_by_id(firm_id, document_id, request_id)
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
        if doc.get("owner_id") != granted_by:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner can grant access")
        
        success = await self.document_repo.grant_access(firm_id, document_id, user_id, access_level, request_id)
        
        if success and self.audit_service:
            await self.audit_service.log_action(
                firm_id=firm_id,
                user_id=granted_by,
                action="GRANT_DOCUMENT_ACCESS",
                resource_type="document",
                resource_id=document_id,
                severity="info",
                request_id=request_id
            )
        
        return success

    async def revoke_access(self, firm_id: str, document_id: str, user_id: str, revoked_by: str, request_id: str) -> bool:
        doc = await self.document_repo.find_by_id(firm_id, document_id, request_id)
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
        if doc.get("owner_id") != revoked_by:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner can revoke access")
        
        success = await self.document_repo.revoke_access(firm_id, document_id, user_id, request_id)
        
        if success and self.audit_service:
            await self.audit_service.log_action(
                firm_id=firm_id,
                user_id=revoked_by,
                action="REVOKE_DOCUMENT_ACCESS",
                resource_type="document",
                resource_id=document_id,
                severity="info",
                request_id=request_id
            )
        
        return success

    async def sign_document(self, firm_id: str, document_id: str, signed_by: str, request_id: str) -> bool:
        doc = await self.document_repo.find_by_id(firm_id, document_id, request_id)
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
        success = await self.document_repo.mark_signed(firm_id, document_id, signed_by, request_id)
        
        if success and self.audit_service:
            await self.audit_service.log_action(
                firm_id=firm_id,
                user_id=signed_by,
                action="SIGN_DOCUMENT",
                resource_type="document",
                resource_id=document_id,
                severity="info",
                request_id=request_id
            )
        
        return success

    async def soft_delete_document(self, firm_id: str, document_id: str, deleted_by: str, request_id: str) -> bool:
        doc = await self.document_repo.find_by_id(firm_id, document_id, request_id)
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
        success = await self.document_repo.soft_delete(firm_id, document_id, deleted_by, request_id)
        
        if success and self.audit_service:
            await self.audit_service.log_action(
                firm_id=firm_id,
                user_id=deleted_by,
                action="DELETE_DOCUMENT",
                resource_type="document",
                resource_id=document_id,
                severity="warning",
                request_id=request_id
            )
        
        return success

    async def get_document_access_log(self, firm_id: str, document_id: str, request_id: str, skip: int = 0, limit: int = 100) -> Dict[str, Any]:
        logs = await self.access_log_repo.find_by_document(firm_id, document_id, request_id, skip, limit)
        summary = await self.access_log_repo.find_document_access_summary(firm_id, document_id, request_id)
        
        return {
            "logs": logs,
            "summary": summary,
            "skip": skip,
            "limit": limit
        }

    async def ensure_indexes(self) -> None:
        await self.document_repo.ensure_indexes()
        await self.access_log_repo.ensure_indexes()
