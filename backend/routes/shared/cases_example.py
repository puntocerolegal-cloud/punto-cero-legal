"""
Ejemplo: Endpoints Compartidos para CASOS

Este archivo es un EJEMPLO de cómo refactorizar un endpoint existente
para que funcione en AMBOS modos (independiente y firma) sin duplicación.

Patrón:
1. Usar middleware/mode_resolver para detectar modo
2. Usar middleware/permission_layer para validar permisos
3. Filtrar datos automáticamente según modo
4. Retornar respuesta unificada
"""

from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional

# Imports de modo y permisos
from middleware.mode_resolver import get_mode_context, ModeAwareQuery, ModeAwareFilter
from middleware.permission_layer import ResourceAccessValidator, ResourceFilter, PermissionMatrix
from routes.auth import get_current_user

# Modelos
from models.case import Case, CaseCreate, CaseUpdate

router = APIRouter(prefix="/shared/cases", tags=["Cases - Shared"])


async def get_db():
    from server import db
    return db


# ============================================================================
# POST /shared/cases - CREAR CASO (funciona en ambos modos)
# ============================================================================

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_case(
    case_data: CaseCreate,
    current_user: dict = Depends(get_current_user),
    mode_context: dict = Depends(get_mode_context),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Crear caso - funciona en ambos modos
    
    Modo INDEPENDIENTE: crea caso con owner_id
    Modo FIRMA: crea caso con firm_id + valida RBAC
    """
    
    # Validar permisos según modo y rol
    if mode_context["is_firm"]:
        # En firma, validar RBAC
        if not PermissionMatrix.get_permission(
            "firm", "case", mode_context["role"], "create"
        ):
            raise HTTPException(
                status_code=403,
                detail="No tienes permiso para crear casos"
            )
    
    # Construir documento según modo
    case_doc = {
        "case_number": case_data.case_number,
        "title": case_data.title,
        "description": case_data.description,
        "status": "open",
        "lawyers_assigned": [mode_context["user_id"]] if mode_context["is_independent"] else [],
        "created_by": mode_context["user_id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    # Agregar campo de organización según modo
    if mode_context["is_independent"]:
        case_doc["owner_id"] = mode_context["user_id"]
        case_doc["firm_id"] = None
    else:  # firm
        case_doc["owner_id"] = None
        case_doc["firm_id"] = mode_context["organization_id"]
    
    # Insertar en BD
    result = await db.cases.insert_one(case_doc)
    case_id = str(result.inserted_id)
    
    return {
        "success": True,
        "case_id": case_id,
        "case_number": case_data.case_number,
        "mode": mode_context["mode"]
    }


# ============================================================================
# GET /shared/cases - LISTAR CASOS (filtrado automático por modo)
# ============================================================================

@router.get("", response_model=dict, status_code=status.HTTP_200_OK)
async def list_cases(
    current_user: dict = Depends(get_current_user),
    mode_context: dict = Depends(get_mode_context),
    db: AsyncIOMotorDatabase = Depends(get_db),
    status_filter: Optional[str] = None,
    limit: int = 50,
):
    """
    Listar casos - filtrado automático según modo
    
    INDEPENDIENTE: retorna solo sus casos
    FIRMA: retorna casos de su firma (filtrado por RBAC)
    """
    
    # Construir query según modo usando ModeAwareQuery
    query_builder = ModeAwareQuery(mode_context)
    query_builder.for_organization()
    
    if status_filter:
        query_builder.with_status(status_filter)
    
    query = query_builder.build()
    
    # Obtener casos de BD
    cases = await db.cases.find(query).limit(limit).sort("created_at", -1).to_list(None)
    
    # Filtrar según permisos RBAC (en firma, algunos pueden ver menos)
    if mode_context["is_firm"]:
        cases = ResourceFilter.filter_readable(mode_context, cases, "case")
    
    # Normalizar respuesta
    result = []
    for case in cases:
        result.append({
            "id": str(case["_id"]),
            "case_number": case.get("case_number"),
            "title": case.get("title"),
            "status": case.get("status"),
            "created_at": case.get("created_at"),
            "lawyers_assigned": case.get("lawyers_assigned", []),
            # No mostrar owner_id/firm_id (detalles internos)
        })
    
    return {
        "success": True,
        "mode": mode_context["mode"],
        "data": result,
        "count": len(result)
    }


# ============================================================================
# GET /shared/cases/{case_id} - OBTENER CASO (con validación de acceso)
# ============================================================================

@router.get("/{case_id}", response_model=dict, status_code=status.HTTP_200_OK)
async def get_case(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    mode_context: dict = Depends(get_mode_context),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Obtener caso específico con validación de acceso
    """
    from bson import ObjectId
    
    try:
        case_oid = ObjectId(case_id)
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    # Obtener caso
    case = await db.cases.find_one({"_id": case_oid})
    if not case:
        raise HTTPException(status_code=404, detail="Caso no encontrado")
    
    # Validar acceso
    await ResourceAccessValidator.validate_read_access(
        mode_context, case, "case"
    )
    
    return {
        "success": True,
        "id": str(case["_id"]),
        "case_number": case.get("case_number"),
        "title": case.get("title"),
        "description": case.get("description"),
        "status": case.get("status"),
        "lawyers_assigned": case.get("lawyers_assigned", []),
        "created_at": case.get("created_at"),
        "created_by": case.get("created_by"),
    }


# ============================================================================
# PATCH /shared/cases/{case_id} - ACTUALIZAR CASO
# ============================================================================

@router.patch("/{case_id}", response_model=dict, status_code=status.HTTP_200_OK)
async def update_case(
    case_id: str,
    update_data: CaseUpdate,
    current_user: dict = Depends(get_current_user),
    mode_context: dict = Depends(get_mode_context),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Actualizar caso - validación completa de acceso
    """
    from bson import ObjectId
    
    try:
        case_oid = ObjectId(case_id)
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    # Obtener caso
    case = await db.cases.find_one({"_id": case_oid})
    if not case:
        raise HTTPException(status_code=404, detail="Caso no encontrado")
    
    # Validar acceso de escritura
    await ResourceAccessValidator.validate_write_access(
        mode_context, case, "case"
    )
    
    # Actualizar
    update_fields = {}
    if update_data.title:
        update_fields["title"] = update_data.title
    if update_data.status:
        update_fields["status"] = update_data.status
    if update_data.description:
        update_fields["description"] = update_data.description
    
    update_fields["updated_at"] = datetime.utcnow()
    
    await db.cases.update_one(
        {"_id": case_oid},
        {"$set": update_fields}
    )
    
    return {
        "success": True,
        "message": "Caso actualizado",
        "case_id": case_id
    }


# ============================================================================
# DELETE /shared/cases/{case_id} - ELIMINAR CASO
# ============================================================================

@router.delete("/{case_id}", response_model=dict, status_code=status.HTTP_200_OK)
async def delete_case(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    mode_context: dict = Depends(get_mode_context),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Eliminar caso - solo firm_owner o propietario (independiente)
    """
    from bson import ObjectId
    
    try:
        case_oid = ObjectId(case_id)
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    # Obtener caso
    case = await db.cases.find_one({"_id": case_oid})
    if not case:
        raise HTTPException(status_code=404, detail="Caso no encontrado")
    
    # Validar acceso de eliminación
    await ResourceAccessValidator.validate_delete_access(
        mode_context, case, "case"
    )
    
    # Eliminar
    await db.cases.delete_one({"_id": case_oid})
    
    return {
        "success": True,
        "message": "Caso eliminado",
        "case_id": case_id
    }


# ============================================================================
# POST /shared/cases/{case_id}/assign - ASIGNAR CASO A ABOGADO
# ============================================================================

@router.post("/{case_id}/assign", response_model=dict, status_code=status.HTTP_200_OK)
async def assign_case(
    case_id: str,
    assignment_data: dict,
    current_user: dict = Depends(get_current_user),
    mode_context: dict = Depends(get_mode_context),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Asignar caso a abogado
    
    Independiente: No disponible
    Firma: Solo firm_owner y partner
    """
    from bson import ObjectId
    
    # En independiente, no puede asignar
    if mode_context["is_independent"]:
        raise HTTPException(
            status_code=403,
            detail="No puedes asignar casos en modo independiente"
        )
    
    target_user_id = assignment_data.get("user_id")
    
    try:
        case_oid = ObjectId(case_id)
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    # Obtener caso
    case = await db.cases.find_one({"_id": case_oid})
    if not case:
        raise HTTPException(status_code=404, detail="Caso no encontrado")
    
    # Validar permiso de asignación
    await ResourceAccessValidator.validate_assign_access(
        mode_context, target_user_id, case
    )
    
    # Agregar usuario a lista de asignados
    lawyers_assigned = case.get("lawyers_assigned", [])
    if target_user_id not in lawyers_assigned:
        lawyers_assigned.append(target_user_id)
    
    await db.cases.update_one(
        {"_id": case_oid},
        {"$set": {
            "lawyers_assigned": lawyers_assigned,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {
        "success": True,
        "message": "Caso asignado",
        "case_id": case_id,
        "assigned_to": target_user_id
    }


# ============================================================================
# Estadísticas de Casos (ambos modos)
# ============================================================================

@router.get("/stats", response_model=dict, status_code=status.HTTP_200_OK)
async def get_case_stats(
    current_user: dict = Depends(get_current_user),
    mode_context: dict = Depends(get_mode_context),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Obtener estadísticas de casos
    
    Independiente: sus casos
    Firma: casos de su firma (si tiene permisos)
    """
    
    # Query según modo
    query_builder = ModeAwareQuery(mode_context)
    query_builder.for_organization()
    query = query_builder.build()
    
    cases = await db.cases.find(query).to_list(None)
    
    # Contar por estado
    total = len(cases)
    open_cases = len([c for c in cases if c.get("status") == "open"])
    in_progress = len([c for c in cases if c.get("status") == "in_progress"])
    closed = len([c for c in cases if c.get("status") == "closed"])
    
    return {
        "success": True,
        "mode": mode_context["mode"],
        "stats": {
            "total": total,
            "open": open_cases,
            "in_progress": in_progress,
            "closed": closed,
            "open_percentage": (open_cases / total * 100) if total > 0 else 0
        }
    }
