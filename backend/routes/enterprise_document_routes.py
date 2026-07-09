from fastapi import APIRouter, Request, status, HTTPException
from typing import Optional
from datetime import datetime
from middleware.tenant_isolation import require_tenant_context

router = APIRouter(prefix="/api/firms/{firm_id}/documents", tags=["Documents"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_document(
    firm_id: str,
    request: Request,
    case_id: str,
    title: str,
    document_type: str,
    content_text: Optional[str] = None,
    is_confidential: bool = False,
    requires_signature: bool = False,
    tags: Optional[list] = None
):
    tenant = require_tenant_context(request)
    if tenant.firm_id != firm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant isolation violation")
    
    request_id = request.headers.get("X-Request-ID", "")
    document_service = request.app.state.document_service
    
    doc = await document_service.create_document(
        firm_id=firm_id,
        case_id=case_id,
        owner_id=tenant.user_id,
        created_by=tenant.user_id,
        title=title,
        document_type=document_type,
        content_text=content_text,
        is_confidential=is_confidential,
        requires_signature=requires_signature,
        tags=tags,
        request_id=request_id
    )
    
    return {"document_id": str(doc.get("_id")), "status": "created"}


@router.get("")
async def list_documents(
    firm_id: str,
    request: Request,
    case_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    tenant = require_tenant_context(request)
    if tenant.firm_id != firm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant isolation violation")
    
    request_id = request.headers.get("X-Request-ID", "")
    document_service = request.app.state.document_service
    
    if case_id:
        result = await document_service.list_documents_by_case(
            firm_id=firm_id,
            case_id=case_id,
            user_id=tenant.user_id,
            request_id=request_id,
            skip=skip,
            limit=limit
        )
    else:
        result = await document_service.list_user_documents(
            firm_id=firm_id,
            user_id=tenant.user_id,
            request_id=request_id,
            skip=skip,
            limit=limit
        )
    
    return result


@router.get("/{document_id}")
async def get_document(
    firm_id: str,
    document_id: str,
    request: Request
):
    tenant = require_tenant_context(request)
    if tenant.firm_id != firm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant isolation violation")
    
    request_id = request.headers.get("X-Request-ID", "")
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")
    
    document_service = request.app.state.document_service
    
    doc = await document_service.get_document(
        firm_id=firm_id,
        document_id=document_id,
        user_id=tenant.user_id,
        request_id=request_id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return doc


@router.patch("/{document_id}")
async def update_document(
    firm_id: str,
    document_id: str,
    request: Request,
    title: Optional[str] = None,
    content_text: Optional[str] = None,
    status: Optional[str] = None,
    tags: Optional[list] = None,
    change_summary: Optional[str] = None
):
    tenant = require_tenant_context(request)
    if tenant.firm_id != firm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant isolation violation")
    
    request_id = request.headers.get("X-Request-ID", "")
    document_service = request.app.state.document_service
    
    updates = {}
    if title is not None:
        updates["title"] = title
    if content_text is not None:
        updates["content_text"] = content_text
    if status is not None:
        updates["status"] = status
    if tags is not None:
        updates["tags"] = tags
    
    updated_doc = await document_service.update_document(
        firm_id=firm_id,
        document_id=document_id,
        updated_by=tenant.user_id,
        updates=updates,
        change_summary=change_summary,
        request_id=request_id
    )
    
    return {"updated": True, "document_id": document_id}


@router.post("/{document_id}/grant-access/{user_id}", status_code=status.HTTP_200_OK)
async def grant_access(
    firm_id: str,
    document_id: str,
    user_id: str,
    request: Request,
    access_level: str = "viewer"
):
    tenant = require_tenant_context(request)
    if tenant.firm_id != firm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant isolation violation")
    
    request_id = request.headers.get("X-Request-ID", "")
    document_service = request.app.state.document_service
    
    success = await document_service.grant_access(
        firm_id=firm_id,
        document_id=document_id,
        user_id=user_id,
        access_level=access_level,
        granted_by=tenant.user_id,
        request_id=request_id
    )
    
    return {"granted": success, "document_id": document_id, "user_id": user_id}


@router.post("/{document_id}/revoke-access/{user_id}", status_code=status.HTTP_200_OK)
async def revoke_access(
    firm_id: str,
    document_id: str,
    user_id: str,
    request: Request
):
    tenant = require_tenant_context(request)
    if tenant.firm_id != firm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant isolation violation")
    
    request_id = request.headers.get("X-Request-ID", "")
    document_service = request.app.state.document_service
    
    success = await document_service.revoke_access(
        firm_id=firm_id,
        document_id=document_id,
        user_id=user_id,
        revoked_by=tenant.user_id,
        request_id=request_id
    )
    
    return {"revoked": success, "document_id": document_id, "user_id": user_id}


@router.post("/{document_id}/sign", status_code=status.HTTP_200_OK)
async def sign_document(
    firm_id: str,
    document_id: str,
    request: Request
):
    tenant = require_tenant_context(request)
    if tenant.firm_id != firm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant isolation violation")
    
    request_id = request.headers.get("X-Request-ID", "")
    document_service = request.app.state.document_service
    
    success = await document_service.sign_document(
        firm_id=firm_id,
        document_id=document_id,
        signed_by=tenant.user_id,
        request_id=request_id
    )
    
    return {"signed": success, "document_id": document_id}


@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
async def delete_document(
    firm_id: str,
    document_id: str,
    request: Request
):
    tenant = require_tenant_context(request)
    if tenant.firm_id != firm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant isolation violation")
    
    request_id = request.headers.get("X-Request-ID", "")
    document_service = request.app.state.document_service
    
    success = await document_service.soft_delete_document(
        firm_id=firm_id,
        document_id=document_id,
        deleted_by=tenant.user_id,
        request_id=request_id
    )
    
    return {"deleted": success, "document_id": document_id}


@router.get("/{document_id}/access-log")
async def get_document_access_log(
    firm_id: str,
    document_id: str,
    request: Request,
    skip: int = 0,
    limit: int = 100
):
    tenant = require_tenant_context(request)
    if tenant.firm_id != firm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant isolation violation")
    
    request_id = request.headers.get("X-Request-ID", "")
    document_service = request.app.state.document_service
    
    result = await document_service.get_document_access_log(
        firm_id=firm_id,
        document_id=document_id,
        request_id=request_id,
        skip=skip,
        limit=limit
    )
    
    return result


@router.get("/search/query")
async def search_documents(
    firm_id: str,
    request: Request,
    q: str,
    skip: int = 0,
    limit: int = 100
):
    tenant = require_tenant_context(request)
    if tenant.firm_id != firm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant isolation violation")
    
    request_id = request.headers.get("X-Request-ID", "")
    document_service = request.app.state.document_service
    
    result = await document_service.search_documents(
        firm_id=firm_id,
        search_term=q,
        request_id=request_id,
        skip=skip,
        limit=limit
    )
    
    return result
