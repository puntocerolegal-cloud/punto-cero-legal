"""Formato de respuesta estándar — Punto Cero OS.

Estructura uniforme: { success, data, message, errors }.
"""
from typing import Any, Optional


def ok(data: Any = None, message: str = "") -> dict:
    return {"success": True, "data": data, "message": message, "errors": []}


def fail(message: str = "", errors: Optional[list] = None) -> dict:
    return {"success": False, "data": None, "message": message, "errors": errors or []}


class OrgError(Exception):
    """Error de dominio con código HTTP y mensaje para el envelope estándar."""

    def __init__(self, status_code: int, message: str, errors: Optional[list] = None):
        super().__init__(message)
        self.status_code = status_code
        self.message = message
        self.errors = errors or []
