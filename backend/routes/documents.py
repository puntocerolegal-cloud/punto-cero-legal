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
