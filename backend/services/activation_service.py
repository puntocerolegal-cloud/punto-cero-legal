"""
Servicio de Activación Inteligente de Cuentas - Punto Cero Legal V1.0

Centraliza toda la lógica de activación para:
- Abogados
- Firmas

Flujo automático post-aprobación:
1. Crear cuenta
2. Generar contraseña temporal (72h)
3. Hashear contraseña
4. Guardar expiración
5. Activar requires_password_change
6. Enviar correo de bienvenida
7. Registrar auditoría
8. Registrar evento
"""
from datetime import datetime, timedelta
import secrets
import logging
from typing import Optional, Dict, Any
from bson import ObjectId

from utils.auth import get_password_hash
from utils import notifier

logger = logging.getLogger(__name__)


class ActivationService:
    """Servicio centralizado para activación de cuentas"""
    
    # Tiempo de expiración de contraseña temporal: 72 horas
    TEMP_PASSWORD_EXPIRY_HOURS = 72
    
    # Estados de activación
    STATUS_PENDING = "PENDING_VERIFICATION"
    STATUS_ACTIVE = "ACTIVE"
    STATUS_ACTIVATION_EXPIRED = "ACTIVACION_EXPIRADA"
    STATUS_REACTIVATION = "REACTIVACION"
    
    @staticmethod
    def generate_temp_password(length: int = 16) -> str:
        """
        Genera contraseña temporal segura aleatoria.
        
        Args:
            length: Longitud de la contraseña (default 16)
            
        Returns:
            Contraseña temporal en texto plano (SOLO para enviar por email)
        """
        return secrets.token_urlsafe(length)
    
    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hashea contraseña para almacenamiento seguro.
        
        Args:
            password: Contraseña en texto plano
            
        Returns:
            Hash de la contraseña
        """
        return get_password_hash(password)
    
    @staticmethod
    def calculate_expiry(hours: int = None) -> datetime:
        """
        Calcula fecha de expiración de contraseña temporal.
        
        Args:
            hours: Horas de vigencia (default 72)
            
        Returns:
            datetime de expiración
        """
        hours = hours or ActivationService.TEMP_PASSWORD_EXPIRY_HOURS
        return datetime.utcnow() + timedelta(hours=hours)
    
    @staticmethod
    async def create_user_with_temp_password(
        db,
        email: str,
        full_name: str,
        role: str,
        firm_id: Optional[str] = None,
        organization_id: Optional[str] = None,
        phone: Optional[str] = None,
        country: Optional[str] = None,
        specialty: Optional[str] = None,
        bar_number: Optional[str] = None,
        firm_name: Optional[str] = None,
        id_document: Optional[str] = None,
        extra_fields: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Crea usuario con contraseña temporal y configuración de activación.
        
        Args:
            db: Motor de base de datos
            email: Email del usuario (será el username)
            full_name: Nombre completo
            role: Rol del usuario
            firm_id: ID de firma (opcional)
            organization_id: ID de organización (opcional)
            phone: Teléfono (opcional)
            country: País (opcional)
            specialty: Especialidad (opcional)
            bar_number: Tarjeta profesional (opcional)
            firm_name: Nombre de firma (opcional)
            id_document: Documento de identidad (opcional)
            extra_fields: Campos adicionales (opcional)
            
        Returns:
            Dict con user_id, temp_password, expires_at
        """
        # Generar credenciales temporales
        temp_password = ActivationService.generate_temp_password()
        password_hash = ActivationService.hash_password(temp_password)
        expires_at = ActivationService.calculate_expiry()
        
        # Crear documento de usuario
        user_doc = {
            "email": email,
            "full_name": full_name,
            "password_hash": password_hash,
            "role": role,
            "firm_id": firm_id,
            "organizationId": organization_id or firm_id,
            "phone": phone,
            "country": country,
            "specialty": specialty,
            "bar_number": bar_number,
            "firm_name": firm_name,
            "id_document": id_document,
            "status": ActivationService.STATUS_PENDING,
            "is_verified": False,
            "requires_password_change": True,
            "activation_token": None,  # Se puede agregar token si se requiere
            "activation_expires_at": expires_at,
            "activated_at": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        # Agregar campos adicionales si existen
        if extra_fields:
            user_doc.update(extra_fields)
        
        # Insertar usuario
        user_result = await db.users.insert_one(user_doc)
        user_id = str(user_result.inserted_id)
        
        logger.info(
            f"[ACTIVATION_SERVICE] Usuario creado | user_id={user_id} | email={email} | role={role} | expires_at={expires_at.isoformat()}"
        )
        
        return {
            "user_id": user_id,
            "temp_password": temp_password,
            "expires_at": expires_at,
            "email": email
        }
    
    @staticmethod
    async def send_welcome_email(
        email: str,
        full_name: str,
        temp_password: str,
        expires_at: datetime,
        firm_name: Optional[str] = None,
        plan_interest: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Envía correo de bienvenida con credenciales temporales.
        
        Args:
            email: Email del destinatario
            full_name: Nombre del destinatario
            temp_password: Contraseña temporal
            expires_at: Fecha de expiración
            firm_name: Nombre de la firma (opcional)
            plan_interest: Plan de interés (opcional)
            
        Returns:
            Dict con resultado del envío
        """
        try:
            email_result = notifier.send_email_account_created(
                to_email=email,
                full_name=full_name,
                temp_password=temp_password,
                expires_at=expires_at,
                firm_name=firm_name
            )
            
            logger.info(
                f"[ACTIVATION_SERVICE] Email enviado | email={email} | sent={email_result.get('sent')} | trace_id={email_result.get('email_trace_id')}"
            )
            
            return email_result
        except Exception as e:
            logger.error(f"[ACTIVATION_SERVICE] Error enviando email a {email}: {str(e)}")
            return {"sent": False, "error": str(e)}
    
    @staticmethod
    async def send_activation_expired_email(email: str, full_name: str) -> Dict[str, Any]:
        """
        Envía correo notificando expiración de contraseña temporal.
        
        Args:
            email: Email del destinatario
            full_name: Nombre del destinatario
            
        Returns:
            Dict con resultado del envío
        """
        try:
            email_result = notifier.send_email_credentials_expired(
                to_email=email,
                full_name=full_name
            )
            
            logger.info(
                f"[ACTIVATION_SERVICE] Email expiración enviado | email={email} | sent={email_result.get('sent')}"
            )
            
            return email_result
        except Exception as e:
            logger.error(f"[ACTIVATION_SERVICE] Error enviando email expiración a {email}: {str(e)}")
            return {"sent": False, "error": str(e)}
    
    @staticmethod
    async def send_activation_resent_email(
        email: str,
        full_name: str,
        temp_password: str,
        expires_at: datetime
    ) -> Dict[str, Any]:
        """
        Envía correo de reenvío de activación con nuevas credenciales.
        
        Args:
            email: Email del destinatario
            full_name: Nombre del destinatario
            temp_password: Nueva contraseña temporal
            expires_at: Nueva fecha de expiración
            
        Returns:
            Dict con resultado del envío
        """
        try:
            email_result = notifier.send_email_credentials_resent(
                to_email=email,
                full_name=full_name,
                temp_password=temp_password,
                expires_at=expires_at
            )
            
            logger.info(
                f"[ACTIVATION_SERVICE] Email reenvío enviado | email={email} | sent={email_result.get('sent')}"
            )
            
            return email_result
        except Exception as e:
            logger.error(f"[ACTIVATION_SERVICE] Error enviando email reenvío a {email}: {str(e)}")
            return {"sent": False, "error": str(e)}
    
    @staticmethod
    async def resend_activation(db, user_id: str) -> Dict[str, Any]:
        """
        Reenvía correo de activación con nuevas credenciales.
        
        Args:
            db: Motor de base de datos
            user_id: ID del usuario
            
        Returns:
            Dict con resultado de la operación
        """
        # Buscar usuario
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise ValueError(f"Usuario no encontrado: {user_id}")
        
        # Verificar que el usuario esté en estado pendiente
        if user.get("status") not in [ActivationService.STATUS_PENDING, ActivationService.STATUS_ACTIVATION_EXPIRED]:
            raise ValueError(f"Usuario no está en estado de activación: {user.get('status')}")
        
        # Generar nuevas credenciales
        temp_password = ActivationService.generate_temp_password()
        password_hash = ActivationService.hash_password(temp_password)
        expires_at = ActivationService.calculate_expiry()
        
        # Actualizar usuario
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "password_hash": password_hash,
                "requires_password_change": True,
                "activation_expires_at": expires_at,
                "status": ActivationService.STATUS_PENDING,
                "updated_at": datetime.utcnow()
            }}
        )
        
        # Enviar correo de reenvío
        email_result = await ActivationService.send_activation_resent_email(
            email=user["email"],
            full_name=user["full_name"],
            temp_password=temp_password,
            expires_at=expires_at
        )
        
        logger.info(
            f"[ACTIVATION_SERVICE] Reenvío exitoso | user_id={user_id} | email={user['email']} | new_expires={expires_at.isoformat()}"
        )
        
        return {
            "success": True,
            "user_id": user_id,
            "email": user["email"],
            "temp_password": temp_password,
            "expires_at": expires_at,
            "email_sent": email_result.get("sent", False),
            "email_trace_id": email_result.get("email_trace_id")
        }
    
    @staticmethod
    async def check_expired_activations(db) -> Dict[str, Any]:
        """
        Verifica y marca activaciones expiradas.
        
        Args:
            db: Motor de base de datos
            
        Returns:
            Dict con estadísticas de expiraciones
        """
        now = datetime.utcnow()
        
        # Buscar usuarios con contraseña temporal expirada
        expired_users = await db.users.find({
            "requires_password_change": True,
            "activation_expires_at": {"$lt": now},
            "status": {"$in": [ActivationService.STATUS_PENDING, "ACTIVE"]}
        }).to_list(None)
        
        expired_count = 0
        moved_to_crm_count = 0
        
        for user in expired_users:
            user_id = str(user["_id"])
            firm_id = user.get("firm_id")
            
            # Marcar usuario como expirado
            await db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {
                    "status": ActivationService.STATUS_ACTIVATION_EXPIRED,
                    "updated_at": now
                }}
            )
            
            # Si tiene firma, marcar firma como expirada
            if firm_id:
                await db.firms.update_one(
                    {"_id": ObjectId(firm_id)},
                    {"$set": {
                        "status": ActivationService.STATUS_ACTIVATION_EXPIRED,
                        "updated_at": now
                    }}
                )
            
            # Enviar correo de expiración
            await ActivationService.send_activation_expired_email(
                email=user["email"],
                full_name=user["full_name"]
            )
            
            # Mover lead a CRM (si aplica)
            if firm_id:
                await ActivationService._move_lead_to_reactivation(db, firm_id, user_id)
                moved_to_crm_count += 1
            
            expired_count += 1
            
            logger.info(
                f"[ACTIVATION_SERVICE] Activación expirada | user_id={user_id} | email={user['email']} | firm_id={firm_id}"
            )
        
        return {
            "checked_at": now.isoformat(),
            "expired_count": expired_count,
            "moved_to_crm_count": moved_to_crm_count
        }
    
    @staticmethod
    async def _move_lead_to_reactivation(db, firm_id: str, user_id: str):
        """
        Mueve lead a estado REACTIVACIÓN en CRM.
        
        Args:
            db: Motor de base de datos
            firm_id: ID de la firma
            user_id: ID del usuario
        """
        try:
            # Buscar lead asociado a la firma
            lead = await db.leads.find_one({
                "source": "landing_firm_registration",
                "metadata.firm_id": firm_id
            })
            
            if lead:
                # Actualizar lead a estado REACTIVACIÓN
                await db.leads.update_one(
                    {"_id": lead["_id"]},
                    {"$set": {
                        "status": "reactivation",
                        "reactivation_reason": "account_activation_expired",
                        "reactivated_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }}
                )
                
                logger.info(
                    f"[ACTIVATION_SERVICE] Lead movido a REACTIVACIÓN | lead_id={str(lead['_id'])} | firm_id={firm_id}"
                )
        except Exception as e:
            logger.error(f"[ACTIVATION_SERVICE] Error moviendo lead a CRM: {str(e)}")
    
    @staticmethod
    async def complete_activation_onboarding(
        db,
        user_id: str,
        selected_plan: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Completa el onboarding después del cambio de contraseña.
        
        Args:
            db: Motor de base de datos
            user_id: ID del usuario
            selected_plan: Plan seleccionado (opcional)
            
        Returns:
            Dict con resultado de la operación
        """
        # Actualizar usuario
        update_data = {
            "status": ActivationService.STATUS_ACTIVE,
            "is_verified": True,
            "requires_password_change": False,
            "activated_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        if selected_plan:
            update_data["subscription_plan"] = selected_plan
        
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        # Si tiene firma, activar firma
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if user and user.get("firm_id"):
            await db.firms.update_one(
                {"_id": ObjectId(user["firm_id"])},
                {"$set": {
                    "status": ActivationService.STATUS_ACTIVE,
                    "is_verified": True,
                    "updated_at": datetime.utcnow()
                }}
            )
        
        logger.info(
            f"[ACTIVATION_SERVICE] Onboarding completado | user_id={user_id} | plan={selected_plan}"
        )
        
        return {
            "success": True,
            "user_id": user_id,
            "status": ActivationService.STATUS_ACTIVE,
            "selected_plan": selected_plan
        }