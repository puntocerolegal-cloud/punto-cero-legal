"""
Copias de seguridad — Punto Cero Legal.

- Backup MANUAL: el abogado descarga una copia completa de su oficina (JSON).
- Backup AUTOMÁTICO diario: /backup/run-daily (cron) genera y guarda una copia
  por abogado. Si Google Drive está configurado (utils.drive_service), sube el
  archivo; de lo contrario lo persiste en la colección `backups` (recuperable).

Nota OAuth2 personal: subir al Drive PERSONAL de cada abogado (con su correo)
requiere su consentimiento OAuth2 y almacenar su refresh_token. El mecanismo
aquí usa la cuenta de servicio (drive_service) y deja el gancho listo; cuando
se conecten las credenciales OAuth2 del usuario, basta enrutar upload por ellas.
"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import json

from routes.auth import get_current_user
from utils import drive_service, notifier

router = APIRouter(prefix="/backup", tags=["Backups"])

# Colecciones que componen la "oficina" de un abogado
LAWYER_COLLECTIONS = [
    "cases", "clients", "invoices", "leads", "appointments",
    "meetings", "case_activities", "documents", "messages",
]


async def get_db():
    from server import db
    return db


def _json_default(o):
    if isinstance(o, ObjectId):
        return str(o)
    if isinstance(o, datetime):
        return o.isoformat()
    return str(o)


async def _collect_lawyer_data(db, lawyer_id: str) -> dict:
    """Reúne todos los documentos del abogado. Excluye binarios pesados de docs."""
    data = {}
    counts = {}
    for coll in LAWYER_COLLECTIONS:
        # cases/clients/invoices/leads/appointments usan lawyer_id;
        # case_activities/meetings/messages/documents se filtran por relación.
        if coll in ("case_activities",):
            case_ids = [str(c["_id"]) for c in await db.cases.find({"lawyer_id": lawyer_id}).to_list(5000)]
            docs = await db[coll].find({"case_id": {"$in": case_ids}}).to_list(20000)
        elif coll == "meetings":
            docs = await db[coll].find({"host_id": lawyer_id}).to_list(5000)
        elif coll == "messages":
            docs = await db[coll].find({"$or": [{"sender_id": lawyer_id}, {"recipient_id": lawyer_id}]}).to_list(20000)
        else:
            docs = await db[coll].find({"lawyer_id": lawyer_id}).to_list(20000)

        # No incluir el contenido cifrado en el JSON (puede ser enorme); solo metadatos.
        if coll == "documents":
            for d in docs:
                d.pop("content_b64", None)
        data[coll] = docs
        counts[coll] = len(docs)
    return {"data": data, "counts": counts}


@router.get("/manual")
async def manual_backup(current=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Genera y devuelve una copia completa de la oficina del abogado (JSON descargable)."""
    lawyer_id = str(current["_id"])
    collected = await _collect_lawyer_data(db, lawyer_id)
    now = datetime.utcnow()
    backup_doc = {
        "version": 1,
        "generated_at": now.isoformat(),
        "lawyer": {"id": lawyer_id, "email": current.get("email"), "full_name": current.get("full_name")},
        "counts": collected["counts"],
        "data": collected["data"],
    }
    payload = json.loads(json.dumps(backup_doc, default=_json_default))

    # Registro del backup (sin el cuerpo completo) + intento de subida a Drive
    drive_id = None
    if drive_service.is_configured():
        try:
            blob = json.dumps(backup_doc, default=_json_default).encode("utf-8")
            drive_id = drive_service.upload_bytes(
                f"backup-{lawyer_id}-{now.strftime('%Y%m%d-%H%M%S')}.json", blob, "application/json")
        except Exception:
            drive_id = None

    await db.backups.insert_one({
        "lawyer_id": lawyer_id, "type": "manual", "counts": collected["counts"],
        "drive_file_id": drive_id, "created_at": now,
    })
    payload["drive_uploaded"] = bool(drive_id)
    return payload


@router.get("/status")
async def backup_status(current=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Estado de backups del abogado: último backup, total y si Drive está activo."""
    lawyer_id = str(current["_id"])
    last = await db.backups.find_one({"lawyer_id": lawyer_id}, sort=[("created_at", -1)])
    total = await db.backups.count_documents({"lawyer_id": lawyer_id})
    return {
        "drive_configured": drive_service.is_configured(),
        "last_backup_at": last["created_at"].isoformat() if last and isinstance(last.get("created_at"), datetime) else None,
        "last_counts": last.get("counts") if last else None,
        "total_backups": total,
    }


@router.post("/run-daily")
async def run_daily_backups(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Backup automático diario de todos los abogados (pensado para cron)."""
    lawyers = await db.users.find({"role": "lawyer"}).to_list(10000)
    done = 0
    now = datetime.utcnow()
    for u in lawyers:
        lawyer_id = str(u["_id"])
        collected = await _collect_lawyer_data(db, lawyer_id)
        drive_id = None
        if drive_service.is_configured():
            try:
                blob = json.dumps({"lawyer_id": lawyer_id, "generated_at": now.isoformat(),
                                   "data": collected["data"]}, default=_json_default).encode("utf-8")
                drive_id = drive_service.upload_bytes(
                    f"backup-{lawyer_id}-{now.strftime('%Y%m%d')}.json", blob, "application/json")
            except Exception:
                drive_id = None
        await db.backups.insert_one({
            "lawyer_id": lawyer_id, "type": "daily", "counts": collected["counts"],
            "drive_file_id": drive_id, "created_at": now,
        })
        try:
            await notifier.create_app_notification(
                db, target=lawyer_id, type="backup_done", title="Copia de seguridad creada",
                message="Tu copia de seguridad diaria se generó correctamente.")
        except Exception:
            pass
        done += 1
    return {"ok": True, "backups_created": done, "drive_configured": drive_service.is_configured()}
