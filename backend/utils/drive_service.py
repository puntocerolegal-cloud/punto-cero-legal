"""
Google Drive — almacenamiento de blobs CIFRADOS (Zero-Knowledge).

IMPORTANTE: el servidor solo maneja ciphertext. La clave de cifrado se deriva
en el navegador del abogado (PBKDF2 + AES-GCM) y NUNCA llega al backend ni a
Google Drive. Aquí solo subimos/bajamos bytes opacos.

Activación: definir la variable de entorno GOOGLE_SERVICE_ACCOUNT_JSON con el
JSON de credenciales de una cuenta de servicio y (opcional) GOOGLE_DRIVE_FOLDER_ID.
Si no está configurado, las funciones devuelven None y el caller hace fallback
a almacenamiento en MongoDB.
"""
import os
import io
import json
import logging

logger = logging.getLogger(__name__)

_SCOPES = ["https://www.googleapis.com/auth/drive.file"]
_service = None


def _get_service():
    """Crea (y cachea) el cliente de Drive. Devuelve None si no hay credenciales."""
    global _service
    if _service is not None:
        return _service
    raw = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    if not raw:
        return None
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        info = json.loads(raw)
        creds = service_account.Credentials.from_service_account_info(info, scopes=_SCOPES)
        _service = build("drive", "v3", credentials=creds, cache_discovery=False)
        return _service
    except Exception as e:  # pragma: no cover - depende de credenciales externas
        logger.warning("Google Drive no disponible: %s", e)
        return None


def is_configured() -> bool:
    return _get_service() is not None


def upload_bytes(name: str, data: bytes, mime: str = "application/octet-stream"):
    """Sube bytes cifrados a Drive. Devuelve el file_id o None si no hay servicio."""
    service = _get_service()
    if not service:
        return None
    try:
        from googleapiclient.http import MediaIoBaseUpload
        metadata = {"name": name}
        folder_id = os.environ.get("GOOGLE_DRIVE_FOLDER_ID")
        if folder_id:
            metadata["parents"] = [folder_id]
        media = MediaIoBaseUpload(io.BytesIO(data), mimetype=mime, resumable=False)
        created = service.files().create(body=metadata, media_body=media, fields="id").execute()
        return created.get("id")
    except Exception as e:  # pragma: no cover
        logger.error("Error subiendo a Drive: %s", e)
        return None


def download_bytes(file_id: str):
    """Descarga bytes cifrados desde Drive. Devuelve bytes o None."""
    service = _get_service()
    if not service or not file_id:
        return None
    try:
        from googleapiclient.http import MediaIoBaseDownload
        request = service.files().get_media(fileId=file_id)
        buffer = io.BytesIO()
        downloader = MediaIoBaseDownload(buffer, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()
        return buffer.getvalue()
    except Exception as e:  # pragma: no cover
        logger.error("Error descargando de Drive: %s", e)
        return None


def delete_drive_file(file_id: str) -> bool:
    service = _get_service()
    if not service or not file_id:
        return False
    try:
        service.files().delete(fileId=file_id).execute()
        return True
    except Exception as e:  # pragma: no cover
        logger.error("Error borrando de Drive: %s", e)
        return False
