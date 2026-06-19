"""
Utilidades de autorización a nivel de objeto (ownership) — Punto Cero Legal.

`require_owner` verifica que un recurso pertenezca al usuario autenticado,
comparando el campo de propiedad del documento (por defecto ``lawyer_id``)
contra el id del usuario que viene del token (``get_current_user``).

Diseñado para reutilizarse en cualquier router que exponga recursos privados.
NO modifica datos: solo valida y lanza la excepción HTTP correspondiente.
"""
from typing import Optional
from fastapi import HTTPException, status


def require_owner(
    resource: Optional[dict],
    current_user: dict,
    owner_field: str = "lawyer_id",
) -> dict:
    """Valida la propiedad de ``resource`` por parte de ``current_user``.

    - 404 si el recurso no existe (``None``).
    - 403 si el recurso existe pero su ``owner_field`` no coincide con el id
      del usuario autenticado.

    Devuelve el propio ``resource`` para encadenar cómodamente.

    Nota: la comparación se hace contra ``str(current_user["_id"])`` porque la
    plataforma almacena los ids de propiedad como cadena (compatibilidad con la
    colección actual, donde ``lawyer_id`` es un string).
    """
    if resource is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurso no encontrado")

    owner_id = resource.get(owner_field)
    if owner_id != str(current_user.get("_id")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene autorización sobre este recurso",
        )
    return resource
