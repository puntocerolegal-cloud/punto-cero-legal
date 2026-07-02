from fastapi import APIRouter, Request, status, HTTPException
from typing import Optional
from datetime import datetime
from backend.middleware.tenant_isolation import require_tenant_context
from backend.models.enterprise_cases import CaseDTO, CaseStatus, LegalArea

router = APIRouter(prefix="/api/firms/{firm_id}/cases", tags=["Cases"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_case(
    firm_id: str,
    request: Request,
    title: str,
    legal_area: str,
    description: str = "",
    case_number: Optional[str] = None,
    priority: str = "medium",
    deadline: Optional[datetime] = None,
    tags: Optional[list] = None
):
    tenant = require_tenant_context(request)
    if tenant.firm_id != firm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant isolation violation")
    
    request_id = request.headers.get("X-Request-ID", "")
    case_service = request.app.state.case_service
    
    case = await case_service.create_case(
        firm_id=firm_id,
        case_owner_id=tenant.user_id,
        created_by=tenant.user_id,
        title=title,
        legal_area=legal_area,
        description=description,
        case_number=case_number,
        priority=priority,
        deadline=deadline,
        tags=tags,
        request_id=request_id
    )
    
    return {"case_id": str(case.get("_id")), "status": "created"}


@router.get("")
async def list_cases(
    firm_id: str,
    request: Request,
    skip: int = 0,
    limit: int = 50
):
    tenant = require_tenant_context(request)
    if tenant.firm_id != firm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant isolation violation")
    
    request_id = request.headers.get("X-Request-ID", "")
    case_service = request.app.state.case_service
    
    result = await case_service.list_cases(
        firm_id=firm_id,
        user_id=tenant.user_id,
        request_id=request_id,
        skip=skip,
        limit=limit
    )
    
    return result


@router.get("/{case_id}")
async def get_case(
    firm_id: str,
    case_id: str,
    request: Request
):
    tenant = require_tenant_context(request)
    if tenant.firm_id != firm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant isolation violation")
    
    request_id = request.headers.get("X-Request-ID", "")
    case_service = request.app.state.case_service
    
    case = await case_service.get_case(
        firm_id=firm_id,
        case_id=case_id,
        user_id=tenant.user_id,
        request_id=request_id
    )
    
    return case


@router.patch("/{case_id}")
async def update_case(
    firm_id: str,
    case_id: str,
    request: Request,
    title: Optional[str] = None,
    description: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    deadline: Optional[datetime] = None,
    tags: Optional[list] = None
):
    tenant = require_tenant_context(request)
    if tenant.firm_id != firm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant isolation violation")
    
    request_id = request.headers.get("X-Request-ID", "")
    case_service = request.app.state.case_service
    
    updates = {}
    if title is not None:
        updates["title"] = title
    if description is not None:
        updates["description"] = description
    if status is not None:
        updates["status"] = status
    if priority is not None:
        updates["priority"] = priority
    if deadline is not None:
        updates["deadline"] = deadline
    if tags is not None:
        updates["tags"] = tags
    
    updated_case = await case_service.update_case(
        firm_id=firm_id,
        case_id=case_id,
        updated_by=tenant.user_id,
        updates=updates,
        request_id=request_id
    )
    
    return {"updated": True, "case_id": case_id}


@router.post("/{case_id}/close", status_code=status.HTTP_200_OK)
async def close_case(
    firm_id: str,
    case_id: str,
    request: Request
):
    tenant = require_tenant_context(request)
    if tenant.firm_id != firm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant isolation violation")
    
    request_id = request.headers.get("X-Request-ID", "")
    case_service = request.app.state.case_service
    
    await case_service.close_case(
        firm_id=firm_id,
        case_id=case_id,
        closed_by=tenant.user_id,
        request_id=request_id
    )
    
    return {"closed": True, "case_id": case_id}


@router.post("/{case_id}/assign-user/{user_id}", status_code=status.HTTP_200_OK)
async def assign_user_to_case(
    firm_id: str,
    case_id: str,
    user_id: str,
    request: Request
):
    tenant = require_tenant_context(request)
    if tenant.firm_id != firm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant isolation violation")
    
    request_id = request.headers.get("X-Request-ID", "")
    case_service = request.app.state.case_service
    
    success = await case_service.assign_user_to_case(
        firm_id=firm_id,
        case_id=case_id,
        user_id=user_id,
        assigned_by=tenant.user_id,
        request_id=request_id
    )
    
    return {"assigned": success, "case_id": case_id, "user_id": user_id}


@router.post("/{case_id}/unassign-user/{user_id}", status_code=status.HTTP_200_OK)
async def unassign_user_from_case(
    firm_id: str,
    case_id: str,
    user_id: str,
    request: Request
):
    tenant = require_tenant_context(request)
    if tenant.firm_id != firm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant isolation violation")
    
    request_id = request.headers.get("X-Request-ID", "")
    case_service = request.app.state.case_service
    
    success = await case_service.unassign_user_from_case(
        firm_id=firm_id,
        case_id=case_id,
        user_id=user_id,
        unassigned_by=tenant.user_id,
        request_id=request_id
    )
    
    return {"unassigned": success, "case_id": case_id, "user_id": user_id}


@router.delete("/{case_id}", status_code=status.HTTP_200_OK)
async def delete_case(
    firm_id: str,
    case_id: str,
    request: Request
):
    tenant = require_tenant_context(request)
    if tenant.firm_id != firm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant isolation violation")
    
    request_id = request.headers.get("X-Request-ID", "")
    case_service = request.app.state.case_service
    
    success = await case_service.soft_delete_case(
        firm_id=firm_id,
        case_id=case_id,
        deleted_by=tenant.user_id,
        request_id=request_id
    )
    
    return {"deleted": success, "case_id": case_id}


@router.get("/search/query")
async def search_cases(
    firm_id: str,
    request: Request,
    q: str,
    skip: int = 0,
    limit: int = 50
):
    tenant = require_tenant_context(request)
    if tenant.firm_id != firm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant isolation violation")
    
    request_id = request.headers.get("X-Request-ID", "")
    case_service = request.app.state.case_service
    
    result = await case_service.search_cases(
        firm_id=firm_id,
        search_term=q,
        request_id=request_id,
        skip=skip,
        limit=limit
    )
    
    return result
