"""
Gestor Documental — Punto Cero Legal
Metadatos de documentos por abogado (colección db.documents).
El contenido cifrado (Zero-Knowledge) y la integración con Google Drive
se manejan en los endpoints /documents/upload y /documents/{id}/content.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

router = APIRouter(prefix="/documents", tags=["Document Manager"])


async def get_db():
    from server import db
    return db


def _human_size(num_bytes: int) -> str:
    size = float(num_bytes or 0)
    for unit in ("B", "KB", "MB", "GB"):
        if size < 1024 or unit == "GB":
            return f"{size:.1f} {unit}" if unit != "B" else f"{int(size)} B"
        size /= 1024
    return f"{size:.1f} GB"


def _serialize(d):
    name = d.get("name", "")
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else "file"
    return {
        "_id": str(d["_id"]),
        "lawyer_id": d.get("lawyer_id"),
        "name": name,
        "type": ext,
        "size": _human_size(d.get("size_bytes", 0)),
        "size_bytes": d.get("size_bytes", 0),
        "date": d["created_at"].date().isoformat() if isinstance(d.get("created_at"), datetime) else None,
        "client": d.get("client_name") or "—",
        "client_id": d.get("client_id"),
        "case_id": d.get("case_id"),
        "expediente_id": d.get("expediente_id"),
        "folder": d.get("folder"),
        "encrypted": d.get("encrypted", False),
        "storage": d.get("storage", "metadata"),
    }


class DocumentMeta(BaseModel):
    lawyer_id: str
    name: str = Field(..., min_length=1, max_length=300)
    size_bytes: int = 0
    client_id: Optional[str] = None
    client_name: Optional[str] = None
    case_id: Optional[str] = None
    expediente_id: Optional[str] = None
    folder: Optional[str] = None


class EncryptedUpload(BaseModel):
    """
    Payload Zero-Knowledge: el contenido ya viene cifrado desde el navegador.
    El servidor NUNCA recibe la frase ni la clave; solo ciphertext + parámetros
    públicos (iv, salt) necesarios para que el cliente descifre al descargar.
    """
    lawyer_id: str
    name: str = Field(..., min_length=1, max_length=300)
    size_bytes: int = 0           # tamaño original (plaintext) para cuotas/UI
    mime: Optional[str] = "application/octet-stream"
    ciphertext_b64: str           # bytes cifrados en base64
    iv_b64: str                   # vector de inicialización AES-GCM
    salt_b64: str                 # salt PBKDF2 usado para derivar la clave
    client_id: Optional[str] = None
    client_name: Optional[str] = None
    case_id: Optional[str] = None
    expediente_id: Optional[str] = None
    folder: Optional[str] = None


@router.get("/", response_model=List[dict])
async def list_documents(lawyer_id: str, folder: Optional[str] = None, db: AsyncIOMotorDatabase = Depends(get_db)):
    q = {"lawyer_id": lawyer_id}
    if folder:
        q["folder"] = folder
    docs = await db.documents.find(q).sort("created_at", -1).to_list(1000)
    return [_serialize(d) for d in docs]


@router.get("/storage/{lawyer_id}", response_model=dict)
async def storage_summary(lawyer_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    pipeline = [
        {"$match": {"lawyer_id": lawyer_id}},
        {"$group": {"_id": None, "total": {"$sum": "$size_bytes"}, "count": {"$sum": 1}}},
    ]
    res = await db.documents.aggregate(pipeline).to_list(1)
    used = res[0]["total"] if res else 0
    count = res[0]["count"] if res else 0
    quota = 50 * 1024 * 1024 * 1024  # 50 GB
    return {
        "used_bytes": used,
        "used_human": _human_size(used),
        "quota_bytes": quota,
        "quota_human": "50 GB",
        "percent": round(used / quota * 100, 1) if quota else 0,
        "count": count,
    }


@router.get("/folders/{lawyer_id}", response_model=List[dict])
async def list_folders(lawyer_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    pipeline = [
        {"$match": {"lawyer_id": lawyer_id, "folder": {"$ne": None}}},
        {"$group": {"_id": "$folder", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    rows = await db.documents.aggregate(pipeline).to_list(100)
    return [{"name": r["_id"], "count": r["count"]} for r in rows]


@router.post("/", response_model=dict, status_code=201)
async def create_document_meta(payload: DocumentMeta, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = payload.model_dump()
    doc["encrypted"] = False
    doc["storage"] = "metadata"
    doc["created_at"] = datetime.utcnow()
    res = await db.documents.insert_one(doc)
    doc["_id"] = res.inserted_id
    return _serialize(doc)


@router.post("/upload", response_model=dict, status_code=201)
async def upload_encrypted_document(payload: EncryptedUpload, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Recibe un documento YA CIFRADO en el cliente (Zero-Knowledge) y lo persiste.
    - Si Google Drive está configurado, sube el ciphertext a Drive (storage=drive).
    - Si no, guarda el ciphertext en MongoDB (storage=mongo).
    En ambos casos el backend solo ve bytes opacos.
    """
    import base64
    from utils import drive_service

    try:
        cipher_bytes = base64.b64decode(payload.ciphertext_b64)
    except Exception:
        raise HTTPException(400, "ciphertext_b64 inválido")

    doc = {
        "lawyer_id": payload.lawyer_id,
        "name": payload.name,
        "size_bytes": payload.size_bytes,
        "mime": payload.mime,
        "client_id": payload.client_id,
        "client_name": payload.client_name,
        "case_id": payload.case_id,
        "expediente_id": payload.expediente_id,
        "folder": payload.folder or "Casos Activos",
        "encrypted": True,
        "iv_b64": payload.iv_b64,
        "salt_b64": payload.salt_b64,
        "created_at": datetime.utcnow(),
    }

    drive_id = drive_service.upload_bytes(payload.name, cipher_bytes, payload.mime or "application/octet-stream")
    if drive_id:
        doc["storage"] = "drive"
        doc["drive_file_id"] = drive_id
    else:
        doc["storage"] = "mongo"
        doc["content_b64"] = payload.ciphertext_b64

    res = await db.documents.insert_one(doc)
    doc["_id"] = res.inserted_id
    return _serialize(doc)


@router.get("/{document_id}/content", response_model=dict)
async def get_encrypted_content(document_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Devuelve el ciphertext y los parámetros públicos (iv, salt) para que el
    navegador descifre localmente con la frase del abogado.
    """
    import base64
    from utils import drive_service

    doc = await db.documents.find_one({"_id": ObjectId(document_id)})
    if not doc:
        raise HTTPException(404, "Documento no encontrado")
    if not doc.get("encrypted"):
        raise HTTPException(400, "El documento no tiene contenido cifrado")

    if doc.get("storage") == "drive" and doc.get("drive_file_id"):
        data = drive_service.download_bytes(doc["drive_file_id"])
        if data is None:
            raise HTTPException(502, "No se pudo recuperar el contenido desde Drive")
        ciphertext_b64 = base64.b64encode(data).decode("ascii")
    else:
        ciphertext_b64 = doc.get("content_b64")
        if not ciphertext_b64:
            raise HTTPException(404, "Contenido no disponible")

    return {
        "_id": str(doc["_id"]),
        "name": doc.get("name"),
        "mime": doc.get("mime", "application/octet-stream"),
        "ciphertext_b64": ciphertext_b64,
        "iv_b64": doc.get("iv_b64"),
        "salt_b64": doc.get("salt_b64"),
    }


class DocumentEdit(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=300)
    folder: Optional[str] = None
    client_name: Optional[str] = None
    case_id: Optional[str] = None


@router.patch("/{document_id}", response_model=dict)
async def edit_document(document_id: str, payload: DocumentEdit, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Edita metadatos del documento (renombrar, mover de carpeta, vincular a caso/cliente).
    El contenido cifrado no se toca: la edición es solo de metadatos (Zero-Knowledge intacto)."""
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(400, "Nada que actualizar")
    update["updated_at"] = datetime.utcnow()
    res = await db.documents.update_one({"_id": ObjectId(document_id)}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(404, "Documento no encontrado")
    doc = await db.documents.find_one({"_id": ObjectId(document_id)})
    return _serialize(doc)


@router.delete("/{document_id}", status_code=204)
async def delete_document(document_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await db.documents.find_one({"_id": ObjectId(document_id)})
    if not doc:
        raise HTTPException(404, "Documento no encontrado")
    # Si está en Drive, intentar borrarlo allí también (best-effort)
    if doc.get("drive_file_id"):
        try:
            from utils.drive_service import delete_drive_file
            delete_drive_file(doc["drive_file_id"])
        except Exception:
            pass
    await db.documents.delete_one({"_id": ObjectId(document_id)})
    return None
