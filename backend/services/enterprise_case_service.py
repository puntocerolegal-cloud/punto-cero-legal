from typing import Dict, List, Any, Optional
from datetime import datetime
from fastapi import HTTPException, status
from repositories.case_repository import CaseRepository
from utils.enterprise_exceptions import ValidationException, BusinessLogicException


class CaseService:
    def __init__(self, case_repo: CaseRepository, audit_service=None):
        self.case_repo = case_repo
        self.audit_service = audit_service

    async def create_case(
        self,
        firm_id: str,
        case_owner_id: str,
        created_by: str,
        title: str,
        legal_area: str,
        description: str = "",
        case_number: Optional[str] = None,
        priority: str = "medium",
        deadline: Optional[datetime] = None,
        tags: List[str] = None,
        request_id: str = ""
    ) -> Dict[str, Any]:
        if not title or len(title) > 200:
            raise ValidationException("Case title must be 1-200 characters")
        
        if case_number:
            existing = await self.case_repo.find_by_case_number(firm_id, case_number, request_id)
            if existing:
                raise ValidationException(f"Case number {case_number} already exists in this firm")
        
        case_data = {
            "firm_id": firm_id,
            "case_owner_id": case_owner_id,
            "title": title,
            "legal_area": legal_area,
            "description": description,
            "case_number": case_number,
            "priority": priority,
            "deadline": deadline,
            "tags": tags or [],
            "assigned_users": [case_owner_id],
            "status": "open",
            "document_count": 0,
            "total_billable_hours": 0.0,
            "total_billed": 0.0,
            "created_by": created_by,
            "updated_by": created_by,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        case = await self.case_repo.create(firm_id, case_data, request_id)
        
        if self.audit_service:
            await self.audit_service.log_action(
                firm_id=firm_id,
                user_id=created_by,
                action="CREATE_CASE",
                resource_type="case",
                resource_id=str(case.get("_id")),
                severity="info",
                request_id=request_id
            )
        
        return case

    async def get_case(self, firm_id: str, case_id: str, user_id: str, request_id: str) -> Dict[str, Any]:
        case = await self.case_repo.find_by_id(firm_id, case_id, request_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
        
        if user_id not in case.get("assigned_users", []) and case.get("case_owner_id") != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
        return case

    async def list_cases(self, firm_id: str, user_id: str, request_id: str, skip: int = 0, limit: int = 50) -> Dict[str, Any]:
        cases = await self.case_repo.find_assigned_to_user(firm_id, user_id, request_id, skip, limit)
        total = await self.case_repo.count_by_firm(firm_id)
        
        return {
            "items": cases,
            "total": total,
            "skip": skip,
            "limit": limit
        }

    async def search_cases(self, firm_id: str, search_term: str, request_id: str, skip: int = 0, limit: int = 50) -> Dict[str, Any]:
        cases = await self.case_repo.search(firm_id, search_term, request_id, skip, limit)
        total = await self.case_repo.count_active(firm_id)
        
        return {
            "items": cases,
            "total": total,
            "skip": skip,
            "limit": limit
        }

    async def update_case(
        self,
        firm_id: str,
        case_id: str,
        updated_by: str,
        updates: Dict[str, Any],
        request_id: str
    ) -> Dict[str, Any]:
        case = await self.case_repo.find_by_id(firm_id, case_id, request_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
        
        if case.get("case_owner_id") != updated_by:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only case owner can update")
        
        updates["updated_by"] = updated_by
        updates["updated_at"] = datetime.utcnow()
        
        updated_case = await self.case_repo.update(firm_id, case_id, updates, request_id)
        
        if self.audit_service:
            await self.audit_service.log_action(
                firm_id=firm_id,
                user_id=updated_by,
                action="UPDATE_CASE",
                resource_type="case",
                resource_id=case_id,
                severity="info",
                request_id=request_id
            )
        
        return updated_case

    async def close_case(self, firm_id: str, case_id: str, closed_by: str, request_id: str) -> Dict[str, Any]:
        case = await self.case_repo.find_by_id(firm_id, case_id, request_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

        updated_case = await self.case_repo.close_case(firm_id, case_id, request_id)
        
        if self.audit_service:
            await self.audit_service.log_action(
                firm_id=firm_id,
                user_id=closed_by,
                action="CLOSE_CASE",
                resource_type="case",
                resource_id=case_id,
                severity="info",
                request_id=request_id
            )
        
        return updated_case

    async def assign_user_to_case(self, firm_id: str, case_id: str, user_id: str, assigned_by: str, request_id: str) -> bool:
        case = await self.case_repo.find_by_id(firm_id, case_id, request_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
        
        success = await self.case_repo.assign_user(firm_id, case_id, user_id, request_id)
        
        if success and self.audit_service:
            await self.audit_service.log_action(
                firm_id=firm_id,
                user_id=assigned_by,
                action="ASSIGN_USER_TO_CASE",
                resource_type="case",
                resource_id=case_id,
                severity="info",
                request_id=request_id
            )
        
        return success

    async def unassign_user_from_case(self, firm_id: str, case_id: str, user_id: str, unassigned_by: str, request_id: str) -> bool:
        case = await self.case_repo.find_by_id(firm_id, case_id, request_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
        
        success = await self.case_repo.unassign_user(firm_id, case_id, user_id, request_id)
        
        if success and self.audit_service:
            await self.audit_service.log_action(
                firm_id=firm_id,
                user_id=unassigned_by,
                action="UNASSIGN_USER_FROM_CASE",
                resource_type="case",
                resource_id=case_id,
                severity="info",
                request_id=request_id
            )
        
        return success

    async def soft_delete_case(self, firm_id: str, case_id: str, deleted_by: str, request_id: str) -> bool:
        case = await self.case_repo.find_by_id(firm_id, case_id, request_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
        
        success = await self.case_repo.soft_delete(firm_id, case_id, deleted_by, request_id)
        
        if success and self.audit_service:
            await self.audit_service.log_action(
                firm_id=firm_id,
                user_id=deleted_by,
                action="DELETE_CASE",
                resource_type="case",
                resource_id=case_id,
                severity="warning",
                request_id=request_id
            )
        
        return success

    async def ensure_indexes(self) -> None:
        await self.case_repo.ensure_indexes()
