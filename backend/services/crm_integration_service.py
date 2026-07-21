"""
Servicio de Integración Notification Center ↔ CRM
Punto Cero Legal V1.0

Responsabilidad: Sincronizar eventos del sistema con el CRM existente.
NO es un CRM.
NO contiene reglas de negocio.
NO toma decisiones.

Reutiliza:
- db.leads
- db.timeline_events
- Modelos existentes (Lead, TimelineEvent)
"""
from datetime import datetime
from typing import Optional, Dict, Any
from bson import ObjectId


class CRMIntegrationService:
    """Servicio de integración entre Notification Center y CRM existente"""
    
    @staticmethod
    async def find_lead_by_email(db, email: str) -> Optional[Dict[str, Any]]:
        """
        Busca un lead por email.
        
        Args:
            db: Motor de base de datos
            email: Email del lead a buscar
            
        Returns:
            Dict con datos del lead o None si no existe
        """
        if not email:
            return None
            
        lead = await db.leads.find_one({"client_email": email})
        if lead:
            lead["_id"] = str(lead["_id"])
        return lead
    
    @staticmethod
    async def update_lead_status(
        db, 
        email: str, 
        status: str, 
        **kwargs
    ) -> bool:
        """
        Actualiza el estado de un lead por email.
        
        Args:
            db: Motor de base de datos
            email: Email del lead
            status: Nuevo estado
            **kwargs: Campos adicionales a actualizar
            
        Returns:
            True si se actualizó, False si no existe
        """
        if not email:
            return False
            
        # Buscar lead por email
        lead = await db.leads.find_one({"client_email": email})
        if not lead:
            return False
        
        # Preparar datos de actualización
        update_data = {
            "status": status,
            "updated_at": datetime.utcnow()
        }
        
        # Agregar campos adicionales si existen
        if kwargs:
            update_data.update(kwargs)
        
        # Actualizar lead
        await db.leads.update_one(
            {"_id": lead["_id"]},
            {"$set": update_data}
        )
        
        return True
    
    @staticmethod
    async def create_timeline_event(
        db,
        event_type: str,
        description: str,
        lead_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> str:
        """
        Crea un evento en el timeline.
        
        Args:
            db: Motor de base de datos
            event_type: Tipo de evento
            description: Descripción del evento
            lead_id: ID del lead (opcional)
            metadata: Metadatos adicionales (opcional)
            **kwargs: Campos adicionales
            
        Returns:
            ID del evento creado
        """
        event_data = {
            "event_type": event_type,
            "description": description,
            "created_at": datetime.utcnow(),
            **kwargs
        }
        
        if lead_id:
            event_data["lead_id"] = lead_id
        
        if metadata:
            event_data["metadata"] = metadata
        
        result = await db.timeline_events.insert_one(event_data)
        return str(result.inserted_id)
    
    @staticmethod
    async def register_activity(
        db,
        lead_id: str,
        activity_type: str,
        description: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Registra una actividad en el timeline del lead.
        
        Args:
            db: Motor de base de datos
            lead_id: ID del lead
            activity_type: Tipo de actividad
            description: Descripción de la actividad
            metadata: Metadatos adicionales (opcional)
            
        Returns:
            ID del evento creado
        """
        return await CRMIntegrationService.create_timeline_event(
            db=db,
            event_type=activity_type,
            description=description,
            lead_id=lead_id,
            metadata=metadata
        )
    
    @staticmethod
    async def update_plan_information(
        db,
        lead_id: str,
        plan_id: str,
        plan_name: Optional[str] = None
    ) -> bool:
        """
        Actualiza la información del plan seleccionado en el lead.
        
        Args:
            db: Motor de base de datos
            lead_id: ID del lead
            plan_id: ID del plan seleccionado
            plan_name: Nombre del plan (opcional)
            
        Returns:
            True si se actualizó, False si no existe
        """
        if not lead_id:
            return False
        
        # Verificar que el lead existe
        try:
            oid = ObjectId(lead_id)
        except Exception:
            return False
        
        lead = await db.leads.find_one({"_id": oid})
        if not lead:
            return False
        
        # Preparar metadata del plan
        plan_metadata = {
            "plan_id": plan_id,
            "plan_selected_at": datetime.utcnow().isoformat()
        }
        
        if plan_name:
            plan_metadata["plan_name"] = plan_name
        
        # Actualizar metadata del lead
        existing_metadata = lead.get("metadata", {})
        existing_metadata.update(plan_metadata)
        
        await db.leads.update_one(
            {"_id": oid},
            {
                "$set": {
                    "metadata": existing_metadata,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return True
    
    @staticmethod
    async def convert_lead_to_customer(
        db,
        lead_id: str,
        user_id: str
    ) -> bool:
        """
        Convierte un lead a cliente.
        
        Args:
            db: Motor de base de datos
            lead_id: ID del lead
            user_id: ID del usuario creado
            
        Returns:
            True si se convirtió, False si no existe
        """
        if not lead_id:
            return False
        
        # Verificar que el lead existe
        try:
            oid = ObjectId(lead_id)
        except Exception:
            return False
        
        lead = await db.leads.find_one({"_id": oid})
        if not lead:
            return False
        
        # Actualizar lead a estado convertido
        await db.leads.update_one(
            {"_id": oid},
            {
                "$set": {
                    "status": "converted",
                    "converted_to": user_id,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return True
    
    @staticmethod
    async def get_lead_history(
        db,
        lead_id: str,
        limit: int = 50
    ) -> list:
        """
        Obtiene el historial de eventos de un lead.

        Args:
            db: Motor de base de datos
            lead_id: ID del lead
            limit: Límite de eventos a retornar

        Returns:
            Lista de eventos del timeline
        """
        if not lead_id:
            return []

        try:
            oid = ObjectId(lead_id)
        except Exception:
            return []

        events = await db.timeline_events.find(
            {"lead_id": lead_id}
        ).sort("created_at", -1).limit(limit).to_list(limit)

        # Convertir ObjectId a string
        for event in events:
            event["_id"] = str(event["_id"])

        return events

    @staticmethod
    async def register_payment_pending(
        db,
        email: str,
        plan_id: str,
        plan_name: str,
        plan_price: float,
        currency: str = "USD",
        **kwargs
    ) -> bool:
        """
        Registra que el usuario está listo para pagar (intención de compra).

        Este evento se crea cuando el usuario completa el onboarding y ha
        seleccionado un plan, pero aún no ha realizado el pago.

        Args:
            db: Motor de base de datos
            email: Email del usuario
            plan_id: ID del plan seleccionado
            plan_name: Nombre del plan
            plan_price: Precio del plan
            currency: Moneda (default: USD)
            **kwargs: Metadatos adicionales (country, lead_source, organization_id, etc.)

        Returns:
            True si se registró, False si no existe el lead
        """
        if not email:
            return False

        # Buscar lead por email
        lead = await db.leads.find_one({"client_email": email})
        if not lead:
            return False

        lead_id = str(lead["_id"])
        now = datetime.utcnow().isoformat()

        # Preparar metadata comercial
        commercial_metadata = {
            "plan_id": plan_id,
            "plan_name": plan_name,
            "plan_price": plan_price,
            "currency": currency,
            "selected_at": kwargs.get("selected_at", now),
            "pending_payment_at": now,
            "country": kwargs.get("country"),
            "lead_source": kwargs.get("lead_source"),
            "organization_id": kwargs.get("organization_id"),
            "lawyer_id": kwargs.get("lawyer_id"),
            "firm_id": kwargs.get("firm_id"),
        }

        # Limpiar valores None
        commercial_metadata = {k: v for k, v in commercial_metadata.items() if v is not None}

        # Actualizar estado del lead
        update_data = {
            "status": "PENDING_PAYMENT",
            "updated_at": datetime.utcnow()
        }

        # Agregar metadata comercial
        existing_metadata = lead.get("metadata", {})
        existing_metadata.update(commercial_metadata)
        update_data["metadata"] = existing_metadata

        await db.leads.update_one(
            {"_id": lead["_id"]},
            {"$set": update_data}
        )

        # Crear timeline event
        await CRMIntegrationService.create_timeline_event(
            db=db,
            event_type="PAYMENT_PENDING",
            description=f"Intención de compra registrada: Plan {plan_name} (${plan_price} {currency})",
            lead_id=lead_id,
            metadata=commercial_metadata
        )

        # Registrar actividad comercial
        await CRMIntegrationService.register_activity(
            db=db,
            lead_id=lead_id,
            activity_type="PAYMENT_PENDING",
            description=f"Cliente listo para pagar: {plan_name}",
            metadata=commercial_metadata
        )

        return True

    @staticmethod
    async def register_payment_initiated(
        db,
        email: str,
        payment_id: str,
        plan_id: str,
        amount: float,
        currency: str,
        provider: str,
        **kwargs
    ) -> bool:
        """
        Registra el inicio de un intento de pago.

        Args:
            db: Motor de base de datos
            email: Email del usuario
            payment_id: ID del pago/transacción
            plan_id: ID del plan
            amount: Monto
            currency: Moneda
            provider: Proveedor de pago (mercado_pago, paypal)
            **kwargs: Metadatos adicionales (user_id, firm_id, organization_id, etc.)

        Returns:
            True si se registró, False si no existe el lead
        """
        if not email:
            return False

        # Buscar lead por email
        lead = await db.leads.find_one({"client_email": email})
        if not lead:
            return False

        lead_id = str(lead["_id"])

        # Preparar metadata
        metadata = {
            "payment_id": payment_id,
            "plan_id": plan_id,
            "amount": amount,
            "currency": currency,
            "provider": provider,
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": kwargs.get("user_id"),
            "firm_id": kwargs.get("firm_id"),
            "organization_id": kwargs.get("organization_id"),
        }

        # Limpiar valores None
        metadata = {k: v for k, v in metadata.items() if v is not None}

        # Actualizar estado del lead
        await db.leads.update_one(
            {"_id": lead["_id"]},
            {"$set": {
                "status": "PAYMENT_INITIATED",
                "updated_at": datetime.utcnow()
            }}
        )

        # Crear timeline event
        await CRMIntegrationService.create_timeline_event(
            db=db,
            event_type="PAYMENT_INITIATED",
            description=f"Intento de pago iniciado: {plan_id} - {amount} {currency} vía {provider}",
            lead_id=lead_id,
            metadata=metadata
        )

        return True

    @staticmethod
    async def register_payment_completed(
        db,
        email: str,
        payment_id: str,
        transaction_id: str,
        amount: float,
        currency: str,
        provider: str,
        plan_id: str,
        **kwargs
    ) -> bool:
        """
        Registra un pago completado exitosamente.

        Args:
            db: Motor de base de datos
            email: Email del usuario
            payment_id: ID del pago en el proveedor
            transaction_id: ID de la transacción interna
            amount: Monto
            currency: Moneda
            provider: Proveedor de pago
            plan_id: ID del plan
            **kwargs: Metadatos adicionales (subscription_id, invoice_id, paid_at, etc.)

        Returns:
            True si se registró, False si no existe el lead
        """
        if not email:
            return False

        # Buscar lead por email
        lead = await db.leads.find_one({"client_email": email})
        if not lead:
            return False

        lead_id = str(lead["_id"])

        # Preparar metadata
        metadata = {
            "payment_id": payment_id,
            "transaction_id": transaction_id,
            "amount": amount,
            "currency": currency,
            "provider": provider,
            "plan_id": plan_id,
            "paid_at": kwargs.get("paid_at", datetime.utcnow().isoformat()),
            "subscription_id": kwargs.get("subscription_id"),
            "invoice_id": kwargs.get("invoice_id"),
            "country": kwargs.get("country"),
            "organization_id": kwargs.get("organization_id"),
            "lawyer_id": kwargs.get("lawyer_id"),
            "firm_id": kwargs.get("firm_id"),
        }

        # Limpiar valores None
        metadata = {k: v for k, v in metadata.items() if v is not None}

        # Actualizar estado del lead
        await db.leads.update_one(
            {"_id": lead["_id"]},
            {"$set": {
                "status": "PAYMENT_COMPLETED",
                "updated_at": datetime.utcnow()
            }}
        )

        # Crear timeline event
        await CRMIntegrationService.create_timeline_event(
            db=db,
            event_type="PAYMENT_COMPLETED",
            description=f"Pago completado: {plan_id} - {amount} {currency} vía {provider}",
            lead_id=lead_id,
            metadata=metadata
        )

        return True

    @staticmethod
    async def register_payment_failed(
        db,
        email: str,
        payment_id: str,
        reason: str,
        provider: str,
        amount: float,
        currency: str,
        **kwargs
    ) -> bool:
        """
        Registra un pago fallido.

        Args:
            db: Motor de base de datos
            email: Email del usuario
            payment_id: ID del pago
            reason: Razón del fallo
            provider: Proveedor de pago
            amount: Monto
            currency: Moneda
            **kwargs: Metadatos adicionales (error_code, timestamp, etc.)

        Returns:
            True si se registró, False si no existe el lead
        """
        if not email:
            return False

        # Buscar lead por email
        lead = await db.leads.find_one({"client_email": email})
        if not lead:
            return False

        lead_id = str(lead["_id"])

        # Preparar metadata
        metadata = {
            "payment_id": payment_id,
            "reason": reason,
            "provider": provider,
            "amount": amount,
            "currency": currency,
            "timestamp": kwargs.get("timestamp", datetime.utcnow().isoformat()),
            "error_code": kwargs.get("error_code"),
        }

        # Limpiar valores None
        metadata = {k: v for k, v in metadata.items() if v is not None}

        # Actualizar estado del lead
        await db.leads.update_one(
            {"_id": lead["_id"]},
            {"$set": {
                "status": "PAYMENT_FAILED",
                "updated_at": datetime.utcnow()
            }}
        )

        # Crear timeline event
        await CRMIntegrationService.create_timeline_event(
            db=db,
            event_type="PAYMENT_FAILED",
            description=f"Pago fallido: {reason} - {amount} {currency} vía {provider}",
            lead_id=lead_id,
            metadata=metadata
        )

        return True

    @staticmethod
    async def register_subscription_cancelled(
        db,
        email: str,
        plan_id: str,
        **kwargs
    ) -> bool:
        """
        Registra la cancelación de una suscripción.

        Args:
            db: Motor de base de datos
            email: Email del usuario
            plan_id: ID del plan cancelado
            **kwargs: Metadatos adicionales (subscription_id, user_id, reason, cancelled_at, etc.)

        Returns:
            True si se registró, False si no existe el lead
        """
        if not email:
            return False

        # Buscar lead por email
        lead = await db.leads.find_one({"client_email": email})
        if not lead:
            return False

        lead_id = str(lead["_id"])

        # Preparar metadata
        metadata = {
            "plan_id": plan_id,
            "subscription_id": kwargs.get("subscription_id"),
            "user_id": kwargs.get("user_id"),
            "reason": kwargs.get("reason", "user_cancelled"),
            "cancelled_at": kwargs.get("cancelled_at", datetime.utcnow().isoformat()),
        }

        # Limpiar valores None
        metadata = {k: v for k, v in metadata.items() if v is not None}

        # Actualizar estado del lead
        await db.leads.update_one(
            {"_id": lead["_id"]},
            {"$set": {
                "status": "SUBSCRIPTION_CANCELLED",
                "updated_at": datetime.utcnow()
            }}
        )

        # Crear timeline event
        await CRMIntegrationService.create_timeline_event(
            db=db,
            event_type="SUBSCRIPTION_CANCELLED",
            description=f"Suscripción cancelada: {plan_id}",
            lead_id=lead_id,
            metadata=metadata
        )

        return True

    @staticmethod
    async def register_plan_changed(
        db,
        email: str,
        old_plan_id: str,
        new_plan_id: str,
        **kwargs
    ) -> bool:
        """
        Registra un cambio de plan.

        Args:
            db: Motor de base de datos
            email: Email del usuario
            old_plan_id: ID del plan anterior
            new_plan_id: ID del plan nuevo
            **kwargs: Metadatos adicionales (old_price, new_price, changed_at, etc.)

        Returns:
            True si se registró, False si no existe el lead
        """
        if not email:
            return False

        # Buscar lead por email
        lead = await db.leads.find_one({"client_email": email})
        if not lead:
            return False

        lead_id = str(lead["_id"])

        # Preparar metadata
        metadata = {
            "old_plan_id": old_plan_id,
            "new_plan_id": new_plan_id,
            "old_price": kwargs.get("old_price"),
            "new_price": kwargs.get("new_price"),
            "changed_at": kwargs.get("changed_at", datetime.utcnow().isoformat()),
        }

        # Limpiar valores None
        metadata = {k: v for k, v in metadata.items() if v is not None}

        # Actualizar estado del lead
        await db.leads.update_one(
            {"_id": lead["_id"]},
            {"$set": {
                "status": "PLAN_CHANGED",
                "updated_at": datetime.utcnow()
            }}
        )

        # Crear timeline event
        await CRMIntegrationService.create_timeline_event(
            db=db,
            event_type="PLAN_CHANGED",
            description=f"Cambio de plan: {old_plan_id} → {new_plan_id}",
            lead_id=lead_id,
            metadata=metadata
        )

        return True

    @staticmethod
    async def register_trial_activated(
        db,
        email: str,
        plan_id: str,
        trial_days: int = 7,
        **kwargs
    ) -> bool:
        """
        Registra la activación de un trial.

        Args:
            db: Motor de base de datos
            email: Email del usuario
            plan_id: ID del plan
            trial_days: Días de duración del trial
            **kwargs: Metadatos adicionales (user_id, trial_started_at, trial_ends_at, etc.)

        Returns:
            True si se registró, False si no existe el lead
        """
        if not email:
            return False

        # Buscar lead por email
        lead = await db.leads.find_one({"client_email": email})
        if not lead:
            return False

        lead_id = str(lead["_id"])

        # Preparar metadata
        metadata = {
            "plan_id": plan_id,
            "trial_days": trial_days,
            "trial_started_at": kwargs.get("trial_started_at", datetime.utcnow().isoformat()),
            "trial_ends_at": kwargs.get("trial_ends_at"),
            "user_id": kwargs.get("user_id"),
        }

        # Limpiar valores None
        metadata = {k: v for k, v in metadata.items() if v is not None}

        # Actualizar estado del lead
        await db.leads.update_one(
            {"_id": lead["_id"]},
            {"$set": {
                "status": "TRIAL_ACTIVATED",
                "updated_at": datetime.utcnow()
            }}
        )

        # Crear timeline event
        await CRMIntegrationService.create_timeline_event(
            db=db,
            event_type="TRIAL_ACTIVATED",
            description=f"Trial activado: {plan_id} por {trial_days} días",
            lead_id=lead_id,
            metadata=metadata
        )

        return True

    @staticmethod
    async def register_payment_refunded(
        db,
        email: str,
        payment_id: str,
        refund_id: str,
        amount: float,
        **kwargs
    ) -> bool:
        """
        Registra un reembolso de pago.

        Args:
            db: Motor de base de datos
            email: Email del usuario
            payment_id: ID del pago original
            refund_id: ID del reembolso
            amount: Monto reembolsado
            **kwargs: Metadatos adicionales (reason, refunded_at, etc.)

        Returns:
            True si se registró, False si no existe el lead
        """
        if not email:
            return False

        # Buscar lead por email
        lead = await db.leads.find_one({"client_email": email})
        if not lead:
            return False

        lead_id = str(lead["_id"])

        # Preparar metadata
        metadata = {
            "payment_id": payment_id,
            "refund_id": refund_id,
            "amount": amount,
            "reason": kwargs.get("reason"),
            "refunded_at": kwargs.get("refunded_at", datetime.utcnow().isoformat()),
        }

        # Limpiar valores None
        metadata = {k: v for k, v in metadata.items() if v is not None}

        # Actualizar estado del lead
        await db.leads.update_one(
            {"_id": lead["_id"]},
            {"$set": {
                "status": "PAYMENT_REFUNDED",
                "updated_at": datetime.utcnow()
            }}
        )

        # Crear timeline event
        await CRMIntegrationService.create_timeline_event(
            db=db,
            event_type="PAYMENT_REFUNDED",
            description=f"Pago reembolsado: {amount} {kwargs.get('currency', 'USD')}",
            lead_id=lead_id,
            metadata=metadata
        )

        return True
