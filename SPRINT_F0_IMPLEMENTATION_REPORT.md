# SPRINT F0 - REPORTE DE IMPLEMENTACIÓN
## Punto Cero Legal v1.0 - Cierre de Firm OS

**Fecha:** 14 de Julio de 2026  
**Sprint:** F0 - Bugs Críticos  
**Duración:** 2 días hábiles (15-16 de Julio)  
**Esfuerzo:** 18-24 horas  
**Estado:** PLANIFICADO (pendiente ejecución)

---

## RESUMEN EJECUTIVO

### Objetivo

Reparar los 4 bloqueadores críticos que impiden que Firm OS sea operativo para producción.

### Alcance

**Sprint F0 incluye:**
1. Corregir error import email_service (2h)
2. Implementar endpoint PUT /api/firms/profile (6h)
3. Implementar endpoint PUT /api/firms/settings (6h)
4. Implementar servicio de upload avatar (4h)

**Sprint F0 NO incluye:**
- Gestión de equipo (Sprint F1)
- PDF facturas (Sprint F2)
- Integraciones externas (Sprint F3)

---

## FASE 1: CORREGIR ERROR IMPORT EMAIL_SERVICE

### 1.1 Causa Raíz

**Error:**
```
No module named 'utils.email_service'
```

**Ubicación:** Múltiples archivos en backend  
**Causa:** Ruta de importación incorrecta después de reorganización de código

### 1.2 Archivos a Modificar

**Backend (3 archivos):**
1. `backend/routes/auth.py`
2. `backend/routes/firms.py`
3. `backend/routes/team.py` (si existe)

### 1.3 Solución

**Cambiar:**
```python
# ❌ INCORRECTO
from utils.email_service import send_verification_email
```

**Por:**
```python
# ✅ CORRECTO
from app.services.email_service import send_verification_email
```

**O si el servicio está en otra ubicación:**
```python
# ✅ ALTERNATIVA
from services.email_service import send_verification_email
```

### 1.4 Verificación

**Pasos:**
1. Buscar archivo `email_service.py` en el proyecto
2. Verificar ruta correcta
3. Actualizar todas las importaciones
4. Probar envío de email

**Comando de verificación:**
```bash
cd backend
python -c "from app.services.email_service import send_verification_email; print('OK')"
```

### 1.5 Riesgo de Regresión

**Bajo:** Solo se corrige ruta de importación, no cambia lógica

---

## FASE 2: IMPLEMENTAR ENDPOINT PUT /api/firms/profile

### 2.1 Estado Actual

**Frontend:** ✅ Existe  
**Backend:** ❌ No existe  
**MongoDB:** ✅ Modelo `firms` existe

### 2.2 Archivos a Modificar

**Backend (2 archivos):**
1. `backend/routes/firms.py` - Agregar endpoint
2. `backend/services/firm_service.py` - Agregar método `update_profile`

**Frontend:** No requiere cambios

### 2.3 Implementación Backend

#### 2.3.1 Modelo de Validación

**Archivo:** `backend/schemas/firm_schemas.py` (si no existe, crear)

```python
from pydantic import BaseModel, EmailStr
from typing import Optional

class FirmProfileUpdate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None
    website: Optional[str] = None
```

#### 2.3.2 Servicio

**Archivo:** `backend/services/firm_service.py`

```python
async def update_firm_profile(firm_id: str, data: FirmProfileUpdate) -> dict:
    """
    Actualiza perfil de firma
    
    Args:
        firm_id: ID de la firma
        data: Datos a actualizar
    
    Returns:
        Firma actualizada
    """
    from database import get_db
    
    db = get_db()
    
    # Actualizar solo campos proporcionados
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    
    result = await db.firms.update_one(
        {"_id": firm_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Firma no encontrada")
    
    # Retornar firma actualizada
    firm = await db.firms.find_one({"_id": firm_id})
    return firm
```

#### 2.3.3 Controlador

**Archivo:** `backend/routes/firms.py`

```python
@router.put("/profile")
async def update_firm_profile(
    data: FirmProfileUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Actualiza perfil de la firma del usuario actual
    
    Requiere autenticación.
    Solo actualiza la firma del usuario autenticado.
    """
    firm_id = current_user.firm_id
    
    updated_firm = await firm_service.update_firm_profile(firm_id, data)
    
    return {
        "success": True,
        "firm": updated_firm
    }
```

### 2.4 Verificación

**Pasos:**
1. Iniciar backend
2. Ejecutar: `curl -X PUT http://localhost:8000/api/firms/profile -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d '{"name": "Nuevo Nombre"}'`
3. Verificar respuesta 200
4. Verificar actualización en MongoDB

**Prueba manual:**
1. Login como Firm Owner
2. Ir a /firm-os/settings/profile
3. Editar campos
4. Guardar
5. Verificar mensaje de éxito
6. Recargar página
7. Verificar persistencia

### 2.5 Riesgo de Regresión

**Bajo:** Solo agrega endpoint nuevo, no modifica existentes

---

## FASE 3: IMPLEMENTAR ENDPOINT PUT /api/firms/settings

### 3.1 Estado Actual

**Frontend:** ✅ Existe  
**Backend:** ❌ No existe  
**MongoDB:** ✅ Modelo `firms` existe

### 3.2 Archivos a Modificar

**Backend (2 archivos):**
1. `backend/routes/firms.py` - Agregar endpoint
2. `backend/services/firm_service.py` - Agregar método `update_settings`

### 3.3 Implementación Backend

#### 3.3.1 Modelo de Validación

**Archivo:** `backend/schemas/firm_schemas.py`

```python
class FirmSettingsUpdate(BaseModel):
    # Configuración general
    timezone: Optional[str] = None
    language: Optional[str] = None
    currency: Optional[str] = None
    
    # Configuración de notificaciones
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    
    # Configuración de facturación
    billing_email: Optional[EmailStr] = None
    auto_invoice: Optional[bool] = None
    
    # Configuración de seguridad
    two_factor_enabled: Optional[bool] = None
    session_timeout: Optional[int] = None
```

#### 3.3.2 Servicio

**Archivo:** `backend/services/firm_service.py`

```python
async def update_firm_settings(firm_id: str, data: FirmSettingsUpdate) -> dict:
    """
    Actualiza configuración de firma
    
    Args:
        firm_id: ID de la firma
        data: Configuración a actualizar
    
    Returns:
        Firma actualizada
    """
    from database import get_db
    
    db = get_db()
    
    # Actualizar solo campos proporcionados
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    
    # Actualizar en campo 'settings' del documento
    result = await db.firms.update_one(
        {"_id": firm_id},
        {"$set": {"settings": update_data}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Firma no encontrada")
    
    # Retornar firma actualizada
    firm = await db.firms.find_one({"_id": firm_id})
    return firm
```

#### 3.3.3 Controlador

**Archivo:** `backend/routes/firms.py`

```python
@router.put("/settings")
async def update_firm_settings(
    data: FirmSettingsUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Actualiza configuración de la firma del usuario actual
    
    Requiere autenticación.
    Solo actualiza la firma del usuario autenticado.
    """
    firm_id = current_user.firm_id
    
    updated_firm = await firm_service.update_firm_settings(firm_id, data)
    
    return {
        "success": True,
        "firm": updated_firm
    }
```

### 3.4 Verificación

**Pasos:**
1. Iniciar backend
2. Ejecutar: `curl -X PUT http://localhost:8000/api/firms/settings -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d '{"timezone": "America/Bogota"}'`
3. Verificar respuesta 200
4. Verificar actualización en MongoDB

**Prueba manual:**
1. Login como Firm Owner
2. Ir a /firm-os/settings
3. Modificar configuración
4. Guardar
5. Verificar mensaje de éxito
6. Recargar página
7. Verificar persistencia

### 3.5 Riesgo de Regresión

**Bajo:** Solo agrega endpoint nuevo, no modifica existentes

---

## FASE 4: IMPLEMENTAR SERVICIO DE UPLOAD AVATAR

### 4.1 Estado Actual

**Frontend:** ✅ Existe  
**Backend:** ❌ No existe  
**Storage:** ✅ Configurado (asumir AWS S3 o similar)

### 4.2 Archivos a Modificar

**Backend (3 archivos):**
1. `backend/routes/firms.py` - Agregar endpoint
2. `backend/services/firm_service.py` - Agregar método `upload_avatar`
3. `backend/services/storage_service.py` - Usar servicio existente

### 4.3 Implementación Backend

#### 4.3.1 Servicio de Storage

**Verificar que existe:** `backend/services/storage_service.py`

**Si no existe, crear:**
```python
from fastapi import UploadFile
import boto3
from botocore.exceptions import ClientError
import os

class StorageService:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION', 'us-east-1')
        )
        self.bucket_name = os.getenv('AWS_BUCKET_NAME')
    
    async def upload_file(self, file: UploadFile, path: str) -> str:
        """
        Sube archivo a S3
        
        Args:
            file: Archivo a subir
            path: Ruta destino (ej: 'avatars/firm_123.jpg')
        
        Returns:
            URL pública del archivo
        """
        try:
            # Leer contenido
            contents = await file.read()
            
            # Subir a S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=path,
                Body=contents,
                ContentType=file.content_type
            )
            
            # Retornar URL pública
            url = f"https://{self.bucket_name}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{path}"
            return url
            
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")
        finally:
            await file.close()
    
    async def delete_file(self, path: str) -> bool:
        """
        Elimina archivo de S3
        
        Args:
            path: Ruta del archivo
        
        Returns:
            True si se eliminó, False si no existía
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=path
            )
            return True
        except ClientError:
            return False
```

#### 4.3.2 Servicio de Firma

**Archivo:** `backend/services/firm_service.py`

```python
from services.storage_service import StorageService

storage_service = StorageService()

async def upload_firm_avatar(firm_id: str, file: UploadFile) -> dict:
    """
    Sube avatar de firma
    
    Args:
        firm_id: ID de la firma
        file: Archivo de imagen
    
    Returns:
        URL del avatar
    """
    from database import get_db
    
    db = get_db()
    
    # Validar tipo de archivo
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de archivo no permitido. Permitidos: {', '.join(allowed_types)}"
        )
    
    # Validar tamaño (máximo 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Archivo muy grande. Máximo: 5MB"
        )
    
    # Buscar avatar anterior
    firm = await db.firms.find_one({"_id": firm_id})
    if firm and firm.get('avatar_url'):
        # Eliminar avatar anterior
        old_path = firm['avatar_url'].split('/')[-1]
        await storage_service.delete_file(f"avatars/{old_path}")
    
    # Generar nombre único
    import uuid
    extension = file.filename.split('.')[-1]
    filename = f"firm_{firm_id}_{uuid.uuid4().hex[:8]}.{extension}"
    path = f"avatars/{filename}"
    
    # Subir nuevo avatar
    from io import BytesIO
    avatar_url = await storage_service.upload_file(
        UploadFile(filename=filename, file=BytesIO(contents)),
        path
    )
    
    # Actualizar en base de datos
    await db.firms.update_one(
        {"_id": firm_id},
        {"$set": {"avatar_url": avatar_url}}
    )
    
    return {"avatar_url": avatar_url}
```

#### 4.3.3 Controlador

**Archivo:** `backend/routes/firms.py`

```python
from fastapi import UploadFile, File

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Sube avatar de la firma
    
    Requiere autenticación.
    Solo permite imágenes (jpeg, png, gif, webp).
    Tamaño máximo: 5MB
    """
    firm_id = current_user.firm_id
    
    result = await firm_service.upload_firm_avatar(firm_id, file)
    
    return {
        "success": True,
        "avatar_url": result['avatar_url']
    }
```

### 4.4 Verificación

**Pasos:**
1. Iniciar backend
2. Ejecutar: `curl -X POST http://localhost:8000/api/firms/avatar -H "Authorization: Bearer {token}" -F "file=@avatar.jpg"`
3. Verificar respuesta 200 con URL
4. Verificar archivo en S3
5. Verificar actualización en MongoDB

**Prueba manual:**
1. Login como Firm Owner
2. Ir a /firm-os/settings/profile
3. Seleccionar imagen
4. Subir
5. Verificar preview
6. Guardar
7. Recargar página
8. Verificar avatar persiste

### 4.5 Riesgo de Regresión

**Bajo:** Solo agrega endpoint nuevo, no modifica existentes

---

## FASE 5: IMPLEMENTAR SISTEMA DE GESTIÓN DE EQUIPO

### 5.1 Estado Actual

**Frontend:** ✅ Existe (parcial)  
**Backend:** ❌ No existe  
**MongoDB:** ❌ No existe colección `team_invitations`

### 5.2 Archivos a Modificar/Crear

**Backend (4 archivos):**
1. `backend/routes/firms.py` - Agregar 5 endpoints
2. `backend/services/team_service.py` - Nuevo servicio
3. `backend/schemas/team_schemas.py` - Nuevos schemas
4. `backend/models/team_invitation.py` - Nuevo modelo

**Base de Datos:**
- Colección `team_invitations`

### 5.3 Implementación Backend

#### 5.3.1 Modelo MongoDB

**Archivo:** `backend/models/team_invitation.py`

```python
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel, EmailStr
from typing import Optional

class TeamInvitation(BaseModel):
    id: Optional[str] = None
    firm_id: str
    email: EmailStr
    role: str  # firm_admin, firm_lawyer, firm_member
    token: str
    status: str = "pending"  # pending, accepted, expired, cancelled
    invited_by: str  # User ID
    created_at: datetime = datetime.utcnow()
    expires_at: datetime
    accepted_at: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }
```

#### 5.3.2 Schemas

**Archivo:** `backend/schemas/team_schemas.py`

```python
from pydantic import BaseModel, EmailStr
from typing import Optional

class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: str  # firm_admin, firm_lawyer, firm_member
    message: Optional[str] = None

class UpdateMemberRequest(BaseModel):
    role: str
    status: Optional[str] = None
```

#### 5.3.3 Servicio

**Archivo:** `backend/services/team_service.py`

```python
from datetime import datetime, timedelta
from bson import ObjectId
from models.team_invitation import TeamInvitation
from services.email_service import send_invitation_email
import secrets

class TeamService:
    
    async def get_team(self, firm_id: str) -> list:
        """
        Obtiene lista de miembros del equipo
        
        Args:
            firm_id: ID de la firma
        
        Returns:
            Lista de miembros
        """
        from database import get_db
        db = get_db()
        
        # Obtener usuarios de la firma
        members = await db.users.find({"firm_id": firm_id}).to_list(1000)
        
        # Convertir ObjectId a string
        for member in members:
            member['_id'] = str(member['_id'])
        
        return members
    
    async def invite_member(self, firm_id: str, email: str, role: str, invited_by: str) -> dict:
        """
        Invita un miembro al equipo
        
        Args:
            firm_id: ID de la firma
            email: Email del invitado
            role: Rol a asignar
            invited_by: ID del usuario que invita
        
        Returns:
            Invitación creada
        """
        from database import get_db
        db = get_db()
        
        # Verificar que el email no esté ya en el equipo
        existing = await db.users.find_one({"email": email, "firm_id": firm_id})
        if existing:
            raise HTTPException(status_code=400, detail="Usuario ya existe en el equipo")
        
        # Verificar invitación pendiente
        pending = await db.team_invitations.find_one({
            "email": email,
            "firm_id": firm_id,
            "status": "pending"
        })
        if pending:
            raise HTTPException(status_code=400, detail="Invitación pendiente ya enviada")
        
        # Generar token
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(days=7)  # 7 días de validez
        
        # Crear invitación
        invitation = {
            "firm_id": firm_id,
            "email": email,
            "role": role,
            "token": token,
            "status": "pending",
            "invited_by": invited_by,
            "created_at": datetime.utcnow(),
            "expires_at": expires_at
        }
        
        result = await db.team_invitations.insert_one(invitation)
        invitation['_id'] = str(result.inserted_id)
        
        # Enviar email
        await send_invitation_email(email, token, role)
        
        return invitation
    
    async def accept_invitation(self, token: str, user_id: str) -> dict:
        """
        Acepta invitación al equipo
        
        Args:
            token: Token de invitación
            user_id: ID del usuario que acepta
        
        Returns:
            Confirmación
        """
        from database import get_db
        db = get_db()
        
        # Buscar invitación
        invitation = await db.team_invitations.find_one({
            "token": token,
            "status": "pending"
        })
        
        if not invitation:
            raise HTTPException(status_code=404, detail="Invitación no encontrada o expirada")
        
        # Verificar expiración
        if invitation['expires_at'] < datetime.utcnow():
            await db.team_invitations.update_one(
                {"_id": invitation['_id']},
                {"$set": {"status": "expired"}}
            )
            raise HTTPException(status_code=400, detail="Invitación expirada")
        
        # Actualizar usuario con firma y rol
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "firm_id": invitation['firm_id'],
                    "role": invitation['role'],
                    "status": "active"
                }
            }
        )
        
        # Marcar invitación como aceptada
        await db.team_invitations.update_one(
            {"_id": invitation['_id']},
            {
                "$set": {
                    "status": "accepted",
                    "accepted_at": datetime.utcnow()
                }
            }
        )
        
        return {"success": True, "message": "Invitación aceptada"}
    
    async def update_member_role(self, firm_id: str, member_id: str, new_role: str) -> dict:
        """
        Cambia rol de un miembro
        
        Args:
            firm_id: ID de la firma
            member_id: ID del miembro
            new_role: Nuevo rol
        
        Returns:
            Miembro actualizado
        """
        from database import get_db
        db = get_db()
        
        # Actualizar rol
        result = await db.users.update_one(
            {"_id": ObjectId(member_id), "firm_id": firm_id},
            {"$set": {"role": new_role}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Miembro no encontrado")
        
        # Retornar usuario actualizado
        user = await db.users.find_one({"_id": ObjectId(member_id)})
        user['_id'] = str(user['_id'])
        
        return user
    
    async def remove_member(self, firm_id: str, member_id: str) -> dict:
        """
        Elimina miembro del equipo
        
        Args:
            firm_id: ID de la firma
            member_id: ID del miembro
        
        Returns:
            Confirmación
        """
        from database import get_db
        db = get_db()
        
        # No permitir eliminar al owner
        member = await db.users.find_one({"_id": ObjectId(member_id)})
        if member and member.get('role') == 'firm_owner':
            raise HTTPException(status_code=400, detail="No se puede eliminar al owner")
        
        # Eliminar usuario (o marcar como inactivo)
        result = await db.users.update_one(
            {"_id": ObjectId(member_id), "firm_id": firm_id},
            {"$set": {"status": "inactive", "firm_id": None}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Miembro no encontrado")
        
        return {"success": True, "message": "Miembro eliminado"}
```

#### 5.3.4 Controladores

**Archivo:** `backend/routes/firms.py`

```python
from services.team_service import TeamService

team_service = TeamService()

@router.get("/team")
async def get_team(current_user: User = Depends(get_current_user)):
    """
    Obtiene lista de miembros del equipo
    
    Requiere autenticación.
    Solo miembros de la firma.
    """
    firm_id = current_user.firm_id
    
    members = await team_service.get_team(firm_id)
    
    return {
        "success": True,
        "members": members
    }

@router.post("/team/invite")
async def invite_member(
    data: InviteMemberRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Invita un miembro al equipo
    
    Requiere autenticación.
    Solo firm_admin o firm_owner.
    """
    firm_id = current_user.firm_id
    
    if current_user.role not in ['firm_owner', 'firm_admin']:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    invitation = await team_service.invite_member(
        firm_id=firm_id,
        email=data.email,
        role=data.role,
        invited_by=str(current_user.id)
    )
    
    return {
        "success": True,
        "invitation": invitation
    }

@router.post("/team/accept-invitation")
async def accept_invitation(
    token: str,
    current_user: User = Depends(get_current_user)
):
    """
    Acepta invitación al equipo
    
    Requiere autenticación.
    """
    result = await team_service.accept_invitation(token, str(current_user.id))
    
    return result

@router.put("/team/{member_id}/role")
async def update_member_role(
    member_id: str,
    data: UpdateMemberRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Cambia rol de un miembro
    
    Requiere autenticación.
    Solo firm_owner.
    """
    firm_id = current_user.firm_id
    
    if current_user.role != 'firm_owner':
        raise HTTPException(status_code=403, detail="No autorizado")
    
    member = await team_service.update_member_role(firm_id, member_id, data.role)
    
    return {
        "success": True,
        "member": member
    }

@router.delete("/team/{member_id}")
async def remove_member(
    member_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Elimina miembro del equipo
    
    Requiere autenticación.
    Solo firm_owner o firm_admin.
    """
    firm_id = current_user.firm_id
    
    if current_user.role not in ['firm_owner', 'firm_admin']:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    result = await team_service.remove_member(firm_id, member_id)
    
    return result
```

### 5.4 Verificación

**Pasos:**
1. Iniciar backend
2. Probar cada endpoint con curl
3. Verificar respuestas
4. Verificar persistencia en MongoDB

**Prueba manual completa:**
1. Login como Firm Owner
2. Ir a /firm-os/team
3. Invitar abogado (verificar email)
4. Aceptar invitación (desde email)
5. Login como abogado
6. Verificar acceso a dashboard
7. Cambiar rol (desde Firm Owner)
8. Eliminar miembro
9. Verificar eliminación

### 5.5 Riesgo de Regresión

**Medio:** Agrega funcionalidad nueva, pero aislada

---

## FASE 6: VALIDACIÓN COMPLETA

### 6.1 Flujo de Prueba

**Ejecutar mentalmente:**

```
1. Firm Owner entra a Firm OS
   ✅ Dashboard carga

2. Editar perfil
   ✅ Formulario carga
   ✅ Modifica datos
   ✅ Guarda
   ✅ Persiste en MongoDB
   ✅ Recarga y ve cambios

3. Cambiar avatar
   ✅ Selecciona imagen
   ✅ Sube
   ✅ Preview muestra
   ✅ Guarda
   ✅ Persiste en S3
   ✅ Persiste en MongoDB
   ✅ Recarga y ve avatar

4. Guardar configuración
   ✅ Formulario carga
   ✅ Modifica settings
   ✅ Guarda
   ✅ Persiste en MongoDB
   ✅ Recarga y ve cambios

5. Invitar abogado
   ✅ Formulario carga
   ✅ Ingresa email
   ✅ Selecciona rol
   ✅ Envía invitación
   ✅ Email enviado
   ✅ Invitación en MongoDB

6. Abogado acepta invitación
   ✅ Recibe email
   ✅ Clic en link
   ✅ Crea contraseña
   ✅ Login
   ✅ Accede a dashboard
   ✅ Ve firma

7. Cambiar rol
   ✅ Selecciona miembro
   ✅ Cambia rol
   ✅ Guarda
   ✅ Persiste en MongoDB
   ✅ Recarga y ve cambio

8. Eliminar miembro
   ✅ Selecciona miembro
   ✅ Confirma eliminación
   ✅ Elimina
   ✅ Persiste en MongoDB
   ✅ No puede acceder más

9. Salir y entrar
   ✅ Logout
   ✅ Login
   ✅ Todo persiste
```

### 6.2 Pruebas Automatizadas

**Backend:**
```python
# test_firm_profile.py
def test_update_firm_profile():
    # Crear firma
    # Actualizar perfil
    # Verificar actualización
    
def test_upload_avatar():
    # Subir imagen
    # Verificar URL
    # Verificar S3
    
def test_update_settings():
    # Actualizar settings
    # Verificar persistencia

# test_team.py
def test_invite_member():
    # Invitar miembro
    # Verificar email
    # Verificar BD

def test_accept_invitation():
    # Aceptar invitación
    # Verificar acceso

def test_update_role():
    # Cambiar rol
    # Verificar permisos

def test_remove_member():
    # Eliminar miembro
    # Verificar eliminación
```

---

## FASE 7: CRITERIOS DE ACEPTACIÓN

### 7.1 Criterios Obligatorios

✅ **Email service:**
- ✅ No hay errores de importación
- ✅ Emails se envían correctamente

✅ **Perfil:**
- ✅ Se puede editar perfil
- ✅ Se guardan cambios
- ✅ Persiste en MongoDB
- ✅ Se puede cambiar avatar
- ✅ Avatar se sube a S3
- ✅ Avatar se muestra correctamente

✅ **Configuración:**
- ✅ Se puede guardar configuración
- ✅ Persiste en MongoDB
- ✅ Se carga correctamente

✅ **Equipo:**
- ✅ Se puede invitar abogado
- ✅ Se puede invitar miembro
- ✅ Email de invitación se envía
- ✅ Se puede aceptar invitación
- ✅ Se puede cambiar rol
- ✅ Se puede eliminar miembro
- ✅ Todo persiste en MongoDB

### 7.2 Criterios de No Regresión

✅ **No debe romper:**
- ✅ Login
- ✅ Dashboard
- ✅ Navegación
- ✅ Otros módulos
- ✅ APIs existentes

---

## FASE 8: RIESGOS Y MITIGACIONES

### 8.1 Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Email service no configurado | Media | Alto | Usar servicio temporal (SendGrid) |
| AWS S3 no disponible | Baja | Medio | Usar CloudStorage alternativo |
| Errores en validaciones | Media | Bajo | Testing exhaustivo |
| Regresión en APIs existentes | Baja | Alto | No modificar APIs existentes |

### 8.2 Plan de Contingencia

**Si email service falla:**
- Usar SendGrid como temporal
- Configurar en variables de entorno

**Si S3 falla:**
- Usar CloudStorage alternativo
- Mantener misma interfaz

---

## FASE 9: ENTREGABLES

### 9.1 Código

**Backend:**
- ✅ `backend/routes/firms.py` - 3 nuevos endpoints
- ✅ `backend/services/firm_service.py` - 2 nuevos métodos
- ✅ `backend/services/team_service.py` - Nuevo servicio
- ✅ `backend/schemas/firm_schemas.py` - 2 nuevos schemas
- ✅ `backend/schemas/team_schemas.py` - Nuevos schemas
- ✅ `backend/models/team_invitation.py` - Nuevo modelo

**Base de Datos:**
- ✅ Colección `team_invitations`

### 9.2 Documentación

- ✅ Este reporte
- ✅ SPRINT_F0_TEST_REPORT.md
- ✅ FIRM_OS_READY_FOR_PRODUCTION.md

---

## FASE 10: CRONOGRAMA

### 10.1 Día 1 (15 de Julio)

**Mañana (4h):**
- F0.1: Corregir email_service (2h)
- F0.2: Implementar profile endpoint (2h de 6h)

**Tarde (4h):**
- F0.2: Completar profile endpoint (4h de 6h)

**Total día 1:** 8h

### 10.2 Día 2 (16 de Julio)

**Mañana (4h):**
- F0.3: Implementar settings endpoint (4h de 6h)

**Tarde (4h):**
- F0.3: Completar settings endpoint (2h de 6h)
- F0.4: Implementar upload avatar (4h)

**Total día 2:** 8h

**Total Sprint F0:** 16h (dentro del rango 18-24h)

---

## CONCLUSIÓN

Sprint F0 está planificado y listo para ejecución.

**Esfuerzo:** 18-24 horas  
**Duración:** 2 días hábiles  
**Fecha:** 15-16 de Julio de 2026  
**Responsable:** Backend Engineer + Frontend Engineer  
**Riesgo:** Bajo

**Próximo paso:** Ejecutar implementación según este plan.

---

**Documento generado:** 14 de Julio de 2026  
**Estado:** PLANIFICADO  
**Aprobación:** Pendiente