# REPORTE DE PARCHE DE SEGURIDAD - FASE 1
## Punto Cero Legal - Feature Freeze

**Fecha:** 14 de Julio de 2026  
**Fase:** 1 - Parches Críticos de Seguridad  
**Tipo:** Parches Mínimos de Seguridad  
**Estado:** FEATURE FREEZE - Solo correcciones de seguridad

---

## LISTA DE CAMBIOS A APLICAR

### Archivos Afectados

1. **backend/routes/documents.py** (4 vulnerabilidades)
2. **backend/routes/meetings.py** (3 vulnerabilidades)
3. **backend/routes/cases.py** (4 vulnerabilidades)

### Líneas a Modificar

#### documents.py
- Línea 83-89: GET /documents/ - Agregar autenticación
- Línea 92-109: GET /documents/storage/{lawyer_id} - Agregar autenticación
- Línea 134-176: POST /documents/upload - Usar lawyer_id del token
- Línea 179-211: GET /documents/{document_id}/content - Agregar validación de tenant

#### meetings.py
- Línea 14-27: POST /meetings/ - Agregar autenticación
- Línea 29-47: GET /meetings/ - Agregar autenticación
- Línea 49-55: GET /meetings/{meeting_id} - Agregar autenticación y validación de tenant

#### cases.py
- Línea 248-275: GET /cases/ - Mejorar validación de organization_id
- Línea 291-314: GET /cases/{case_id} - Incluir filtro de tenant en query
- Línea 317-340: GET /cases/{case_id}/timeline - Agregar validación de tenant
- Línea 485-511: PATCH /cases/{case_id} - Agregar validación de tenant

---

## CAMBIOS A APLICAR

### 1. documents.py - GET /documents/

**Vulnerabilidad:** 3.1 - Sin autenticación  
**Riesgo:** CRÍTICO  
**Línea:** 83-89

**Cambio:**
```python
# ANTES
@router.get("/", response_model=List[dict])
async def list_documents(lawyer_id: str, folder: Optional[str] = None, db: AsyncIOMotorDatabase = Depends(get_db)):
    q = {"lawyer_id": lawyer_id}
    if folder:
        q["folder"] = folder
    docs = await db.documents.find(q).sort("created_at", -1).to_list(1000)
    return [_serialize(d) for d in docs]

# DESPUÉS
@router.get("/", response_model=List[dict])
async def list_documents(
    lawyer_id: str,
    folder: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Validar que el usuario accede a sus propios documentos
    if lawyer_id != str(current_user["_id"]):
        raise HTTPException(403, "No autorizado")
    
    q = {"lawyer_id": lawyer_id}
    if folder:
        q["folder"] = folder
    docs = await db.documents.find(q).sort("created_at", -1).to_list(1000)
    return [_serialize(d) for d in docs]
```

---

### 2. documents.py - GET /documents/storage/{lawyer_id}

**Vulnerabilidad:** 3.2 - Sin autenticación  
**Riesgo:** CRÍTICO  
**Línea:** 92-109

**Cambio:**
```python
# ANTES
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

# DESPUÉS
@router.get("/storage/{lawyer_id}", response_model=dict)
async def storage_summary(
    lawyer_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Validar que el usuario accede a sus propias métricas
    if lawyer_id != str(current_user["_id"]):
        raise HTTPException(403, "No autorizado")
    
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
```

---

### 3. documents.py - POST /documents/upload

**Vulnerabilidad:** 3.3 - lawyer_id manipulable  
**Riesgo:** MAYOR  
**Línea:** 134-176

**Cambio:**
```python
# ANTES
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

# DESPUÉS
@router.post("/upload", response_model=dict, status_code=201)
async def upload_encrypted_document(
    payload: EncryptedUpload,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
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

    # Usar el lawyer_id del token, NO del payload
    lawyer_id = str(current_user["_id"])

    doc = {
        "lawyer_id": lawyer_id,
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
```

---

### 4. documents.py - GET /documents/{document_id}/content

**Vulnerabilidad:** 3.4 - Sin validación de tenant  
**Riesgo:** CRÍTICO  
**Línea:** 179-211

**Cambio:**
```python
# ANTES
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

# DESPUÉS
@router.get("/{document_id}/content", response_model=dict)
async def get_encrypted_content(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Devuelve el ciphertext y los parámetros públicos (iv, salt) para que el
    navegador descifre localmente con la frase del abogado.
    """
    import base64
    from utils import drive_service

    # Validar que el documento pertenece al usuario autenticado
    doc = await db.documents.find_one({
        "_id": ObjectId(document_id),
        "lawyer_id": str(current_user["_id"])
    })
    if not doc:
        raise HTTPException(404, "Documento no encontrado")
    if not doc.get("encrypted"):
        raise HTTPException(400, "El documento no tiene contenido cifrado")
```

---

### 5. meetings.py - POST /meetings/

**Vulnerabilidad:** 5.1 - Sin autenticación  
**Riesgo:** CRÍTICO  
**Línea:** 14-27

**Cambio:**
```python
# ANTES
@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_meeting(meeting_data: MeetingCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    import uuid
    
    meeting_dict = meeting_data.model_dump()
    meeting_dict["room_id"] = str(uuid.uuid4())
    meeting_dict["meeting_link"] = f"https://meet.puntocero.legal/room/{meeting_dict['room_id']}"
    meeting_dict["created_at"] = datetime.utcnow()
    meeting_dict["updated_at"] = datetime.utcnow()
    
    result = await db.meetings.insert_one(meeting_dict)
    meeting_dict["_id"] = str(result.inserted_id)
    
    return meeting_dict

# DESPUÉS
@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_meeting(
    meeting_data: MeetingCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    import uuid
    
    # Validar que el caso pertenece al usuario
    case = await db.cases.find_one({
        "_id": ObjectId(meeting_data.case_id),
        "organization_id": current_user.get("organization_id")
    })
    if not case:
        raise HTTPException(403, "No autorizado: caso no pertenece a su organización")
    
    meeting_dict = meeting_data.model_dump()
    meeting_dict["room_id"] = str(uuid.uuid4())
    meeting_dict["meeting_link"] = f"https://meet.puntocero.legal/room/{meeting_dict['room_id']}"
    meeting_dict["created_at"] = datetime.utcnow()
    meeting_dict["updated_at"] = datetime.utcnow()
    
    result = await db.meetings.insert_one(meeting_dict)
    meeting_dict["_id"] = str(result.inserted_id)
    
    return meeting_dict
```

---

### 6. meetings.py - GET /meetings/

**Vulnerabilidad:** 5.2 - Sin autenticación  
**Riesgo:** CRÍTICO  
**Línea:** 29-47

**Cambio:**
```python
# ANTES
@router.get("/", response_model=List[dict])
async def get_meetings(
    case_id: str = None,
    host_id: str = None,
    status: str = None,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    query = {}
    if case_id:
        query["case_id"] = case_id
    if host_id:
        query["host_id"] = host_id
    if status:
        query["status"] = status
    
    meetings = await db.meetings.find(query).sort("scheduled_time", -1).to_list(1000)
    for meeting in meetings:
        meeting["_id"] = str(meeting["_id"])
    return meetings

# DESPUÉS
@router.get("/", response_model=List[dict])
async def get_meetings(
    case_id: str = None,
    host_id: str = None,
    status: str = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Siempre filtrar por organización del usuario
    query = {"organization_id": current_user.get("organization_id")}
    
    if case_id:
        # Validar que el caso pertenece a la organización
        case = await db.cases.find_one({
            "_id": ObjectId(case_id),
            "organization_id": current_user.get("organization_id")
        })
        if not case:
            raise HTTPException(403, "No autorizado: caso no pertenece a su organización")
        query["case_id"] = case_id
    
    if host_id:
        query["host_id"] = host_id
    if status:
        query["status"] = status
    
    meetings = await db.meetings.find(query).sort("scheduled_time", -1).to_list(1000)
    for meeting in meetings:
        meeting["_id"] = str(meeting["_id"])
    return meetings
```

---

### 7. meetings.py - GET /meetings/{meeting_id}

**Vulnerabilidad:** 5.3 - Sin autenticación  
**Riesgo:** CRÍTICO  
**Línea:** 49-55

**Cambio:**
```python
# ANTES
@router.get("/{meeting_id}", response_model=dict)
async def get_meeting(meeting_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    meeting = await db.meetings.find_one({"_id": ObjectId(meeting_id)})
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    meeting["_id"] = str(meeting["_id"])
    return meeting

# DESPUÉS
@router.get("/{meeting_id}", response_model=dict)
async def get_meeting(
    meeting_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Validar que la reunión pertenece a la organización del usuario
    meeting = await db.meetings.find_one({
        "_id": ObjectId(meeting_id),
        "organization_id": current_user.get("organization_id")
    })
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    meeting["_id"] = str(meeting["_id"])
    return meeting
```

---

### 8. cases.py - GET /cases/

**Vulnerabilidad:** 1.1 - Sin validación de organization_id  
**Riesgo:** CRÍTICO  
**Línea:** 248-275

**Cambio:**
```python
# ANTES
@router.get("/", response_model=List[dict])
async def get_cases(
    lawyer_id: str = None,
    client_id: str = None,
    status: str = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Devolución automática (3h sin aceptar) — verificación perezosa al listar.
    await auto_return_expired(db)
    query = {"organization_id": current_user.get("organization_id")}
    if lawyer_id:
        query["lawyer_id"] = lawyer_id
    if client_id:
        query["client_id"] = client_id
    if status:
        query["status"] = status

    cases = await db.cases.find(query).sort("created_at", -1).to_list(1000)
    out = []
    for case in cases:
        c = _serialize_case(case)
        if not c.get("client_name") and case.get("client_id"):
            cl = await _lookup_name(db, case["client_id"])
            if cl:
                c["client_name"] = cl
        out.append(c)
    return out

# DESPUÉS
@router.get("/", response_model=List[dict])
async def get_cases(
    lawyer_id: str = None,
    client_id: str = None,
    status: str = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Devolución automática (3h sin aceptar) — verificación perezosa al listar.
    await auto_return_expired(db)
    
    # Usar organization_id del token como fuente de verdad
    organization_id = current_user.get("organization_id")
    if not organization_id:
        raise HTTPException(403, "Usuario sin organización asignada")
    
    query = {"organization_id": organization_id}
    if lawyer_id:
        query["lawyer_id"] = lawyer_id
    if client_id:
        query["client_id"] = client_id
    if status:
        query["status"] = status

    cases = await db.cases.find(query).sort("created_at", -1).to_list(1000)
    out = []
    for case in cases:
        c = _serialize_case(case)
        if not c.get("client_name") and case.get("client_id"):
            cl = await _lookup_name(db, case["client_id"])
            if cl:
                c["client_name"] = cl
        out.append(c)
    return out
```

---

### 9. cases.py - GET /cases/{case_id}

**Vulnerabilidad:** 1.2 - Validación llega tarde  
**Riesgo:** CRÍTICO  
**Línea:** 291-314

**Cambio:**
```python
# ANTES
@router.get("/{case_id}", response_model=dict)
async def get_case(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    case = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    validate_org_ownership(case, current_user, "organization_id")
    out = _serialize_case(case)

    activities = await db.case_activities.find({"case_id": case_id}).sort("created_at", -1).to_list(200)
    for a in activities:
        a["_id"] = str(a["_id"])
        if isinstance(a.get("created_at"), datetime):
            a["created_at"] = a["created_at"].isoformat()
    out["activities"] = activities

    meetings = await db.meetings.find({"case_id": case_id}).to_list(100)
    for m in meetings:
        m["_id"] = str(m["_id"])
    out["meetings"] = meetings
    return out

# DESPUÉS
@router.get("/{case_id}", response_model=dict)
async def get_case(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Incluir filtro de tenant en la query inicial
    case = await db.cases.find_one({
        "_id": ObjectId(case_id),
        "organization_id": current_user.get("organization_id")
    })
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    out = _serialize_case(case)

    activities = await db.case_activities.find({"case_id": case_id}).sort("created_at", -1).to_list(200)
    for a in activities:
        a["_id"] = str(a["_id"])
        if isinstance(a.get("created_at"), datetime):
            a["created_at"] = a["created_at"].isoformat()
    out["activities"] = activities

    meetings = await db.meetings.find({"case_id": case_id}).to_list(100)
    for m in meetings:
        m["_id"] = str(m["_id"])
    out["meetings"] = meetings
    return out
```

---

### 10. cases.py - GET /cases/{case_id}/timeline

**Vulnerabilidad:** 1.3 - Sin validación de tenant  
**Riesgo:** CRÍTICO  
**Línea:** 317-340

**Cambio:**
```python
# ANTES
@router.get("/{case_id}/timeline", response_model=dict)
async def case_timeline(case_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Línea de tiempo visual del caso: cada etapa/hito en orden cronológico."""
    case = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not case:
        raise HTTPException(404, "Case not found")
    acts = await db.case_activities.find({"case_id": case_id}).sort("created_at", 1).to_list(500)
    timeline = []
    for a in acts:
        ts = a.get("created_at")
        timeline.append({
            "stage": a.get("stage") or a.get("activity_type", "Actividad").capitalize(),
            "type": a.get("activity_type", "note"),
            "description": a.get("description", ""),
            "date": ts.isoformat() if isinstance(ts, datetime) else ts,
        })
    return {
        "case_id": case_id,
        "case_number": case.get("case_number"),
        "title": case.get("title"),
        "current_stage": case.get("estado", case.get("status")),
        "client_name": case.get("client_name"),
        "timeline": timeline,
    }

# DESPUÉS
@router.get("/{case_id}/timeline", response_model=dict)
async def case_timeline(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Línea de tiempo visual del caso: cada etapa/hito en orden cronológico."""
    # Validar que el caso pertenece al tenant
    case = await db.cases.find_one({
        "_id": ObjectId(case_id),
        "organization_id": current_user.get("organization_id")
    })
    if not case:
        raise HTTPException(404, "Case not found")
    acts = await db.case_activities.find({"case_id": case_id}).sort("created_at", 1).to_list(500)
    timeline = []
    for a in acts:
        ts = a.get("created_at")
        timeline.append({
            "stage": a.get("stage") or a.get("activity_type", "Actividad").capitalize(),
            "type": a.get("activity_type", "note"),
            "description": a.get("description", ""),
            "date": ts.isoformat() if isinstance(ts, datetime) else ts,
        })
    return {
        "case_id": case_id,
        "case_number": case.get("case_number"),
        "title": case.get("title"),
        "current_stage": case.get("estado", case.get("status")),
        "client_name": case.get("client_name"),
        "timeline": timeline,
    }
```

---

### 11. cases.py - PATCH /cases/{case_id}

**Vulnerabilidad:** 1.4 - Sin validación antes de update  
**Riesgo:** MAYOR  
**Línea:** 485-511

**Cambio:**
```python
# ANTES
@router.patch("/{case_id}", response_model=dict)
async def update_case(case_id: str, updates: dict, db: AsyncIOMotorDatabase = Depends(get_db)):
    allowed = {"title", "legal_area", "materia", "description", "summary", "estado", "status",
               "priority", "priority_label", "deadline", "court", "assigned_to", "counterparty_name",
               "key_dates"}
    update_data = {k: v for k, v in updates.items() if k in allowed and v is not None}
    # Si cambia 'estado', sincroniza status interno + hito en timeline
    if "estado" in update_data:
        update_data["status"] = ESTADO_TO_STATUS.get(update_data["estado"], "open")
    if isinstance(update_data.get("deadline"), str):
        try:
            update_data["deadline"] = datetime.fromisoformat(update_data["deadline"].replace("Z", "+00:00"))
        except Exception:
            update_data.pop("deadline", None)
    update_data["updated_at"] = datetime.utcnow()
    result = await db.cases.update_one({"_id": ObjectId(case_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    if "estado" in update_data:
        await db.case_activities.insert_one({
            "case_id": case_id, "user_id": (updates.get("user_id")), "activity_type": "note",
            "stage": f"Cambio de estado → {update_data['estado']}", "billable": False,
            "duration_minutes": 0, "description": f"El caso pasó a estado «{update_data['estado']}».",
            "created_at": datetime.utcnow(),
        })
    case = await db.cases.find_one({"_id": ObjectId(case_id)})
    return _serialize_case(case)

# DESPUÉS
@router.patch("/{case_id}", response_model=dict)
async def update_case(
    case_id: str,
    updates: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Validar que el caso pertenece al tenant antes de actualizar
    case = await db.cases.find_one({
        "_id": ObjectId(case_id),
        "organization_id": current_user.get("organization_id")
    })
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    allowed = {"title", "legal_area", "materia", "description", "summary", "estado", "status",
               "priority", "priority_label", "deadline", "court", "assigned_to", "counterparty_name",
               "key_dates"}
    update_data = {k: v for k, v in updates.items() if k in allowed and v is not None}
    # Si cambia 'estado', sincroniza status interno + hito en timeline
    if "estado" in update_data:
        update_data["status"] = ESTADO_TO_STATUS.get(update_data["estado"], "open")
    if isinstance(update_data.get("deadline"), str):
        try:
            update_data["deadline"] = datetime.fromisoformat(update_data["deadline"].replace("Z", "+00:00"))
        except Exception:
            update_data.pop("deadline", None)
    update_data["updated_at"] = datetime.utcnow()
    result = await db.cases.update_one({"_id": ObjectId(case_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    if "estado" in update_data:
        await db.case_activities.insert_one({
            "case_id": case_id, "user_id": (updates.get("user_id")), "activity_type": "note",
            "stage": f"Cambio de estado → {update_data['estado']}", "billable": False,
            "duration_minutes": 0, "description": f"El caso pasó a estado «{update_data['estado']}».",
            "created_at": datetime.utcnow(),
        })
    case = await db.cases.find_one({"_id": ObjectId(case_id)})
    return _serialize_case(case)
```

---

## RESUMEN DE CAMBIOS

### Total de archivos modificados: 3

1. **backend/routes/documents.py** - 4 cambios
2. **backend/routes/meetings.py** - 3 cambios
3. **backend/routes/cases.py** - 4 cambios

### Total de líneas modificadas: 11

### Vulnerabilidades corregidas: 11

- 7 CRÍTICAS
- 4 MAYORES

---

## PRUEBAS A REALIZAR

### 1. Prueba de autenticación en documents.py

**Test:** Intentar acceder sin token  
**Resultado esperado:** HTTP 401 Unauthorized  
**Endpoints:**
- GET /documents/
- GET /documents/storage/{lawyer_id}

### 2. Prueba de validación de tenant en documents.py

**Test:** Intentar acceder a documento de otro usuario  
**Resultado esperado:** HTTP 403 Forbidden  
**Endpoints:**
- GET /documents/{document_id}/content

### 3. Prueba de autenticación en meetings.py

**Test:** Intentar crear/ver reuniones sin token  
**Resultado esperado:** HTTP 401 Unauthorized  
**Endpoints:**
- POST /meetings/
- GET /meetings/
- GET /meetings/{meeting_id}

### 4. Prueba de validación de tenant en cases.py

**Test:** Intentar acceder a caso de otra organización  
**Resultado esperado:** HTTP 404 Not Found  
**Endpoints:**
- GET /cases/{case_id}
- GET /cases/{case_id}/timeline
- PATCH /cases/{case_id}

### 5. Prueba de validación de organization_id en cases.py

**Test:** Intentar listar casos con organization_id manipulado  
**Resultado esperado:** Solo retorna casos de la organización del usuario  
**Endpoints:**
- GET /cases/

---

## RIESGO RESIDUAL

### Riesgo Bajo

Después de aplicar estos parches:

1. **Autenticación garantizada** en todos los endpoints críticos
2. **Validación de tenant** en todas las consultas por ID
3. **Filtrado por organization_id** en listados

### Riesgo Residual Identificado

1. **Validación de firm_id** - No implementada en esta fase
   - Se requiere análisis de roles y estructura de firmas
   - Se implementará en Fase 2

2. **Validación de lawyer_id** - Parcialmente implementada
   - Se usa el ID del token como fuente de verdad
   - Se requiere validación adicional de roles

3. **Webhook de chatbot** - Sin validación de firma
   - Se implementará en Fase 2
   - Requiere configuración de claves de Meta/Twilio

---

## CHECKLIST DE VALIDACIÓN

### Antes de aplicar cambios

- [x] Lista de archivos identificada
- [x] Líneas a modificar identificadas
- [x] Cambios documentados
- [x] Pruebas definidas

### Después de aplicar cambios

- [ ] Verificar que los archivos se modificaron correctamente
- [ ] Ejecutar pruebas de autenticación
- [ ] Ejecutar pruebas de validación de tenant
- [ ] Verificar que no hay errores de sintaxis
- [ ] Verificar que la aplicación inicia correctamente
- [ ] Verificar que los endpoints retornan códigos correctos

---

## PRÓXIMOS PASOS

1. **Aplicar cambios** en los 3 archivos
2. **Ejecutar pruebas** de validación
3. **Verificar** que no hay regresiones
4. **Documentar** en este reporte
5. **Proceder a Fase 2** (chatbot.py y ai.py)

---

## NOTA IMPORTANTE

Estos parches son **mínimos y quirúrgicos**:

- Solo agregan autenticación donde falta
- Solo agregan validación de tenant donde falta
- No modifican lógica de negocio
- No modifican arquitectura
- No agregan funcionalidades
- No refactorizan código

**Objetivo:** Cerrar vulnerabilidades críticas manteniendo la estabilidad del sistema.

---

**Preparado por:** Senior Security Auditor  
**Fecha:** 14 de Julio de 2026  
**Fase:** 1 de 3  
**Estado:** 📋 PLANIFICADO - Listo para aplicar