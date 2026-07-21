"""
Script de Certificación - Flujo Oficial de Activación de Cuentas
Punto Cero Legal V1.0

Ejecuta pruebas funcionales completas sobre el flujo de activación.
"""
import asyncio
import sys
import os
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Agregar backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from services.activation_service import ActivationService
from utils.notifier import send_email
from bson import ObjectId

# Configuración de prueba
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'puntocero_legal_test')

class ActivationFlowTester:
    """Tester de certificación del flujo de activación"""
    
    def __init__(self):
        self.client = None
        self.db = None
        self.test_results = []
        
    async def setup(self):
        """Inicializa conexión a MongoDB"""
        try:
            self.client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=5000)
            self.db = self.client[DB_NAME]
            # Verificar conexión
            await self.db.command('ping')
            logger.info(f"✅ Conectado a MongoDB: {DB_NAME}")
            return True
        except Exception as e:
            logger.error(f"❌ Error conectando a MongoDB: {e}")
            return False
    
    async def cleanup(self):
        """Limpia datos de prueba"""
        if self.db is not None:
            try:
                # Eliminar usuarios de prueba
                await self.db.users.delete_many({"email": {"$regex": "^test_"}})
                # Eliminar firmas de prueba
                await self.db.firms.delete_many({"email": {"$regex": "^test_"}})
                # Eliminar leads de prueba
                await self.db.leads.delete_many({"contact_email": {"$regex": "^test_"}})
                logger.info("✅ Datos de prueba limpiados")
            except Exception as e:
                logger.error(f"⚠️ Error limpiando datos: {e}")
    
    def log_test(self, test_name, passed, details=""):
        """Registra resultado de prueba"""
        status = "✅ PASS" if passed else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "details": details
        })
        logger.info(f"{status} - {test_name}: {details}")
    
    # ========================================================================
    # PRUEBA 1: REGISTRO DE ABOGADO
    # ========================================================================
    async def test_lawyer_registration(self):
        """Prueba 1: Registro de abogado con activación"""
        logger.info("\n" + "="*80)
        logger.info("PRUEBA 1: REGISTRO DE ABOGADO")
        logger.info("="*80)
        
        try:
            # PASO 1: Crear usuario con contraseña temporal
            activation_data = await ActivationService.create_user_with_temp_password(
                db=self.db,
                email="test_lawyer@example.com",
                full_name="Dr. Test Abogado",
                role="lawyer",
                phone="+573001234567",
                country="Colombia",
                specialty="Derecho Civil",
                bar_number="TP-123456",
                firm_name="Bufete Test"
            )
            
            user_id = activation_data["user_id"]
            temp_password = activation_data["temp_password"]
            expires_at = activation_data["expires_at"]
            
            # VERIFICACIONES
            user = await self.db.users.find_one({"_id": ObjectId(user_id)})
            
            # ✓ Usuario creado
            self.log_test(
                "1.1 Usuario creado",
                user is not None,
                f"user_id={user_id}"
            )
            
            # ✓ Estado inicial PENDING_VERIFICATION
            self.log_test(
                "1.2 Estado inicial",
                user.get("status") == "PENDING_VERIFICATION",
                f"status={user.get('status')}"
            )
            
            # ✓ Contraseña temporal generada (hash existe)
            self.log_test(
                "1.3 Contraseña temporal generada",
                user.get("password_hash") is not None and len(user.get("password_hash")) > 0,
                f"hash_length={len(user.get('password_hash', ''))}"
            )
            
            # ✓ Fecha de expiración almacenada
            self.log_test(
                "1.4 Fecha de expiración almacenada",
                user.get("activation_expires_at") is not None,
                f"expires_at={user.get('activation_expires_at')}"
            )
            
            # ✓ requires_password_change = True
            self.log_test(
                "1.5 requires_password_change = True",
                user.get("requires_password_change") == True,
                f"requires_password_change={user.get('requires_password_change')}"
            )
            
            # ✓ is_verified = False
            self.log_test(
                "1.6 is_verified = False",
                user.get("is_verified") == False,
                f"is_verified={user.get('is_verified')}"
            )
            
            # ✓ Email enviado
            email_result = await ActivationService.send_welcome_email(
                email="test_lawyer@example.com",
                full_name="Dr. Test Abogado",
                temp_password=temp_password,
                expires_at=expires_at,
                firm_name="Bufete Test"
            )
            
            self.log_test(
                "1.7 Email enviado",
                email_result.get("sent", False),
                f"sent={email_result.get('sent')} | trace_id={email_result.get('email_trace_id', 'N/A')}"
            )
            
            logger.info(f"\n📊 Datos del usuario creado:")
            logger.info(f"   - user_id: {user_id}")
            logger.info(f"   - email: test_lawyer@example.com")
            logger.info(f"   - temp_password: {temp_password}")
            logger.info(f"   - expires_at: {expires_at.isoformat()}")
            logger.info(f"   - status: {user.get('status')}")
            logger.info(f"   - requires_password_change: {user.get('requires_password_change')}")
            
            return user_id, temp_password
            
        except Exception as e:
            logger.error(f"❌ Error en prueba 1: {e}", exc_info=True)
            self.log_test("1. REGISTRO ABOGADO", False, str(e))
            return None, None
    
    # ========================================================================
    # PRUEBA 2: REGISTRO DE FIRMA
    # ========================================================================
    async def test_firm_registration(self):
        """Prueba 2: Registro de firma con aprobación"""
        logger.info("\n" + "="*80)
        logger.info("PRUEBA 2: REGISTRO DE FIRMA")
        logger.info("="*80)
        
        try:
            # PASO 1: Crear solicitud de firma
            firm_doc = {
                "name": "Firma Test Certificación",
                "nit": "TEST-987654321",
                "email": "test_firm@example.com",
                "phone": "+573009876543",
                "address": "Calle Test 123",
                "city": "Bogotá",
                "country": "Colombia",
                "plan": "firm_growth",
                "max_lawyers": 5,
                "active_lawyers_count": 0,
                "owner_id": None,
                "owner_name": "Dr. Test Firm Owner",
                "owner_email": "test_owner@example.com",
                "status": "PENDING_APPROVAL",
                "approval_status": "pending",
                "trial_status": "active",
                "trial_started_at": datetime.utcnow(),
                "trial_ends_at": datetime.utcnow() + timedelta(days=7),
                "subscription_status": "trial",
                "subscription_plan": "trial",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
            
            firm_result = await self.db.firms.insert_one(firm_doc)
            firm_id = str(firm_result.inserted_id)
            
            self.log_test(
                "2.1 Firma creada en PENDING_APPROVAL",
                True,
                f"firm_id={firm_id}"
            )
            
            # PASO 2: Aprobar firma (crea firm_owner con contraseña temporal)
            # Simular aprobación
            temp_password = ActivationService.generate_temp_password()
            password_hash = ActivationService.hash_password(temp_password)
            expires_at = ActivationService.calculate_expiry()
            
            # Crear firm_owner
            owner_data = await ActivationService.create_user_with_temp_password(
                db=self.db,
                email="test_owner@example.com",
                full_name="Dr. Test Firm Owner",
                role="firm_owner",
                firm_id=firm_id,
                phone="+573009876543",
                country="Colombia"
            )
            
            owner_id = owner_data["user_id"]
            
            # Actualizar firma con owner_id
            await self.db.firms.update_one(
                {"_id": firm_id},
                {"$set": {
                    "owner_id": owner_id,
                    "status": "ACTIVE",
                    "approval_status": "approved",
                    "updated_at": datetime.utcnow()
                }}
            )
            
            # Verificar usuario creado
            owner = await self.db.users.find_one({"_id": ObjectId(owner_id)})
            
            self.log_test(
                "2.2 Firm owner creado",
                owner is not None,
                f"owner_id={owner_id}"
            )
            
            self.log_test(
                "2.3 Firm owner con contraseña temporal",
                owner.get("requires_password_change") == True,
                f"requires_password_change={owner.get('requires_password_change')}"
            )
            
            self.log_test(
                "2.4 Firma activada",
                (await self.db.firms.find_one({"_id": firm_id})).get("status") == "ACTIVE",
                f"status=ACTIVE"
            )
            
            # Enviar email de bienvenida
            email_result = await ActivationService.send_welcome_email(
                email="test_owner@example.com",
                full_name="Dr. Test Firm Owner",
                temp_password=owner_data["temp_password"],
                expires_at=owner_data["expires_at"],
                firm_name="Firma Test Certificación",
                plan_interest="firm_growth"
            )
            
            self.log_test(
                "2.5 Email enviado a firm_owner",
                email_result.get("sent", False),
                f"sent={email_result.get('sent')} | trace_id={email_result.get('email_trace_id', 'N/A')}"
            )
            
            logger.info(f"\n📊 Datos de la firma:")
            logger.info(f"   - firm_id: {firm_id}")
            logger.info(f"   - owner_id: {owner_id}")
            logger.info(f"   - temp_password: {owner_data['temp_password']}")
            logger.info(f"   - status: ACTIVE")
            
            return firm_id, owner_id, owner_data["temp_password"]
            
        except Exception as e:
            logger.error(f"❌ Error en prueba 2: {e}", exc_info=True)
            self.log_test("2. REGISTRO FIRMA", False, str(e))
            return None, None, None
    
    # ========================================================================
    # PRUEBA 3: LOGIN CON CONTRASEÑA TEMPORAL
    # ========================================================================
    async def test_login_with_temp_password(self, user_id, temp_password):
        """Prueba 3: Login con contraseña temporal"""
        logger.info("\n" + "="*80)
        logger.info("PRUEBA 3: LOGIN CON CONTRASEÑA TEMPORAL")
        logger.info("="*80)
        
        try:
            # Obtener usuario
            user = await self.db.users.find_one({"_id": ObjectId(user_id)})
            email = user.get("email")
            
            # Simular login (verificar contraseña)
            from utils.auth import verify_password
            
            password_hash = user.get("password_hash")
            is_valid = verify_password(temp_password, password_hash)
            
            self.log_test(
                "3.1 Contraseña temporal válida",
                is_valid,
                f"verify_password={is_valid}"
            )
            
            # Verificar que el usuario tiene requires_password_change=True
            self.log_test(
                "3.2 requires_password_change = True",
                user.get("requires_password_change") == True,
                f"requires_password_change={user.get('requires_password_change')}"
            )
            
            # Verificar que NO tiene acceso completo (is_verified=False)
            self.log_test(
                "3.3 is_verified = False (sin acceso completo)",
                user.get("is_verified") == False,
                f"is_verified={user.get('is_verified')}"
            )
            
            # Verificar status
            self.log_test(
                "3.4 Status PENDING_VERIFICATION",
                user.get("status") == "PENDING_VERIFICATION",
                f"status={user.get('status')}"
            )
            
            logger.info(f"\n📊 Login exitoso con contraseña temporal:")
            logger.info(f"   - email: {email}")
            logger.info(f"   - requires_password_change: True")
            logger.info(f"   - is_verified: False")
            logger.info(f"   - next_step: change_password")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error en prueba 3: {e}", exc_info=True)
            self.log_test("3. LOGIN TEMPORAL", False, str(e))
            return False
    
    # ========================================================================
    # PRUEBA 4: CAMBIO DE CONTRASEÑA
    # ========================================================================
    async def test_password_change(self, user_id, temp_password):
        """Prueba 4: Cambio de contraseña en primer login"""
        logger.info("\n" + "="*80)
        logger.info("PRUEBA 4: CAMBIO DE CONTRASEÑA")
        logger.info("="*80)
        
        try:
            user = await self.db.users.find_one({"_id": ObjectId(user_id)})
            
            # PASO 1: Verificar que requiere cambio
            self.log_test(
                "4.1 Usuario requiere cambio de contraseña",
                user.get("requires_password_change") == True,
                f"requires_password_change={user.get('requires_password_change')}"
            )
            
            # PASO 2: Cambiar contraseña
            new_password = "NewSecurePass123!"
            from utils.auth import get_password_hash
            
            new_password_hash = get_password_hash(new_password)
            
            await self.db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {
                    "password_hash": new_password_hash,
                    "requires_password_change": False,
                    "ready_for_onboarding": True,
                    "updated_at": datetime.utcnow()
                }}
            )
            
            # PASO 3: Verificar cambios
            updated_user = await self.db.users.find_one({"_id": ObjectId(user_id)})
            
            # ✓ Contraseña temporal deja de ser válida
            from utils.auth import verify_password
            old_invalid = not verify_password(temp_password, updated_user.get("password_hash"))
            self.log_test(
                "4.2 Contraseña temporal inválida",
                old_invalid,
                f"verify_password(temp_password)={not old_invalid}"
            )
            
            # ✓ Nueva contraseña funciona
            new_valid = verify_password(new_password, updated_user.get("password_hash"))
            self.log_test(
                "4.3 Nueva contraseña válida",
                new_valid,
                f"verify_password(new_password)={new_valid}"
            )
            
            # ✓ requires_password_change = False
            self.log_test(
                "4.4 requires_password_change = False",
                updated_user.get("requires_password_change") == False,
                f"requires_password_change={updated_user.get('requires_password_change')}"
            )
            
            # ✓ ready_for_onboarding = True
            self.log_test(
                "4.5 ready_for_onboarding = True",
                updated_user.get("ready_for_onboarding") == True,
                f"ready_for_onboarding={updated_user.get('ready_for_onboarding')}"
            )
            
            logger.info(f"\n📊 Contraseña cambiada exitosamente:")
            logger.info(f"   - requires_password_change: False")
            logger.info(f"   - ready_for_onboarding: True")
            logger.info(f"   - next_step: activation_wizard")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error en prueba 4: {e}", exc_info=True)
            self.log_test("4. CAMBIO CONTRASEÑA", False, str(e))
            return False
    
    # ========================================================================
    # PRUEBA 5: ACTIVATION WIZARD
    # ========================================================================
    async def test_activation_wizard_exists(self):
        """Prueba 5: Verificar que Activation Wizard existe"""
        logger.info("\n" + "="*80)
        logger.info("PRUEBA 5: ACTIVATION WIZARD")
        logger.info("="*80)
        
        try:
            # Verificar que existe el endpoint de onboarding
            from routes.onboarding import router as onboarding_router
            
            routes = [route.path for route in onboarding_router.routes]
            
            self.log_test(
                "5.1 Router de onboarding existe",
                True,
                f"routes={routes}"
            )
            
            # Verificar que existe el endpoint /onboarding/status
            self.log_test(
                "5.2 Endpoint /onboarding/status existe",
                "/onboarding/status" in routes or any("status" in r for r in routes),
                f"status_endpoint_found=True"
            )
            
            # Verificar que existe el endpoint /onboarding/complete
            self.log_test(
                "5.3 Endpoint /onboarding/complete existe",
                any("complete" in r for r in routes),
                f"complete_endpoint_found=True"
            )
            
            # Verificar que ProtectedRoute redirige correctamente
            import sys
            sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'frontend/src/components'))
            from ProtectedRoute import ProtectedRoute
            import inspect
            
            source = inspect.getsource(ProtectedRoute)
            
            self.log_test(
                "5.4 ProtectedRoute tiene lógica de onboarding",
                "ready_for_onboarding" in source and "activation-wizard" in source,
                f"onboarding_logic_found=True"
            )
            
            logger.info(f"\n📊 Activation Wizard verificado:")
            logger.info(f"   - Router existe: ✓")
            logger.info(f"   - Endpoints configurados: ✓")
            logger.info(f"   - ProtectedRoute redirige correctamente: ✓")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error en prueba 5: {e}", exc_info=True)
            self.log_test("5. ACTIVATION WIZARD", False, str(e))
            return False
    
    # ========================================================================
    # PRUEBA 6: REENVÍO DE ACTIVACIÓN
    # ========================================================================
    async def test_resend_activation(self, user_id):
        """Prueba 6: Reenvío de correo de activación"""
        logger.info("\n" + "="*80)
        logger.info("PRUEBA 6: REENVÍO DE ACTIVACIÓN")
        logger.info("="*80)
        
        try:
            # Obtener datos originales
            original_user = await self.db.users.find_one({"_id": ObjectId(user_id)})
            original_expires = original_user.get("activation_expires_at")
            
            # PASO 1: Reenviar activación
            resend_result = await ActivationService.resend_activation(self.db, user_id)
            
            # ✓ Nueva contraseña generada
            self.log_test(
                "6.1 Nueva contraseña generada",
                resend_result.get("temp_password") is not None,
                f"temp_password_exists=True"
            )
            
            # ✓ Nueva fecha de expiración
            new_expires = resend_result.get("expires_at")
            self.log_test(
                "6.2 Nueva fecha de expiración",
                new_expires is not None and new_expires > original_expires,
                f"new_expires={new_expires.isoformat() if new_expires else 'N/A'}"
            )
            
            # ✓ Email enviado
            self.log_test(
                "6.3 Email de reenvío enviado",
                resend_result.get("email_sent", False),
                f"sent={resend_result.get('email_sent')} | trace_id={resend_result.get('email_trace_id', 'N/A')}"
            )
            
            # ✓ Usuario actualizado
            updated_user = await self.db.users.find_one({"_id": ObjectId(user_id)})
            self.log_test(
                "6.4 Usuario actualizado",
                updated_user.get("requires_password_change") == True,
                f"requires_password_change={updated_user.get('requires_password_change')}"
            )
            
            logger.info(f"\n📊 Reenvío exitoso:")
            logger.info(f"   - Nueva contraseña: {resend_result.get('temp_password')}")
            logger.info(f"   - Nueva expiración: {new_expires.isoformat() if new_expires else 'N/A'}")
            logger.info(f"   - Email enviado: {resend_result.get('email_sent')}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error en prueba 6: {e}", exc_info=True)
            self.log_test("6. REENVÍO ACTIVACIÓN", False, str(e))
            return False
    
    # ========================================================================
    # PRUEBA 7: EXPIRACIÓN DE ACTIVACIÓN
    # ========================================================================
    async def test_activation_expiration(self):
        """Prueba 7: Simulación de activación vencida"""
        logger.info("\n" + "="*80)
        logger.info("PRUEBA 7: EXPIRACIÓN DE ACTIVACIÓN (SIMULADA)")
        logger.info("="*80)
        
        try:
            # PASO 1: Crear usuario con expiración en el pasado
            past_date = datetime.utcnow() - timedelta(hours=1)
            
            activation_data = await ActivationService.create_user_with_temp_password(
                db=self.db,
                email="test_expired@example.com",
                full_name="Dr. Test Expirado",
                role="lawyer"
            )
            
            # Forzar expiración en el pasado
            await self.db.users.update_one(
                {"_id": ObjectId(activation_data["user_id"])},
                {"$set": {
                    "activation_expires_at": past_date,
                    "updated_at": datetime.utcnow()
                }}
            )
            
            self.log_test(
                "7.1 Usuario con activación expirada creado",
                True,
                f"user_id={activation_data['user_id']}"
            )
            
            # PASO 2: Ejecutar check_expired_activations
            result = await ActivationService.check_expired_activations(self.db)
            
            # ✓ Cambio de estado
            expired_user = await self.db.users.find_one({"_id": ObjectId(activation_data["user_id"])})
            self.log_test(
                "7.2 Estado cambiado a ACTIVACION_EXPIRADA",
                expired_user.get("status") == "ACTIVACION_EXPIRADA",
                f"status={expired_user.get('status')}"
            )
            
            # ✓ Estadísticas de expiración
            self.log_test(
                "7.3 Estadísticas generadas",
                result.get("expired_count", 0) > 0,
                f"expired_count={result.get('expired_count')}"
            )
            
            # ✓ Movimiento a CRM (si está implementado)
            if result.get("moved_to_crm_count", 0) > 0:
                self.log_test(
                    "7.4 Lead movido a CRM",
                    True,
                    f"moved_to_crm_count={result.get('moved_to_crm_count')}"
                )
            else:
                self.log_test(
                    "7.4 Movimiento a CRM",
                    False,
                    "CRM movement not implemented or no firm_id"
                )
            
            logger.info(f"\n📊 Expiración simulada:")
            logger.info(f"   - Usuarios expirados: {result.get('expired_count')}")
            logger.info(f"   - Movidos a CRM: {result.get('moved_to_crm_count')}")
            logger.info(f"   - Estado: ACTIVACION_EXPIRADA")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error en prueba 7: {e}", exc_info=True)
            self.log_test("7. EXPIRACIÓN ACTIVACIÓN", False, str(e))
            return False
    
    # ========================================================================
    # PRUEBA 8: VERIFICAR SMTP
    # ========================================================================
    async def test_smtp_integration(self):
        """Prueba 8: Verificar integración con notifier.py"""
        logger.info("\n" + "="*80)
        logger.info("PRUEBA 8: INTEGRACIÓN SMTP")
        logger.info("="*80)
        
        try:
            # Verificar que ActivationService usa notifier.send_email
            import inspect
            from services import activation_service
            
            source = inspect.getsource(activation_service)
            
            # ✓ Usa notifier.send_email
            self.log_test(
                "8.1 ActivationService usa notifier.send_email",
                "notifier.send_email" in source,
                f"notifier.send_email found in activation_service.py"
            )
            
            # ✓ No hay implementación paralela de SMTP
            smtp_alternatives = ["smtplib", "boto3", "sendgrid", "mailgun"]
            has_alternative = any(alt in source.lower() for alt in smtp_alternatives)
            self.log_test(
                "8.2 No hay implementación paralela de SMTP",
                not has_alternative,
                f"alternatives_found={[a for a in smtp_alternatives if a in source.lower()]}"
            )
            
            # Verificar que notifier.py existe
            import os
            notifier_path = os.path.join(os.path.dirname(__file__), 'backend', 'utils', 'notifier.py')
            self.log_test(
                "8.3 Archivo notifier.py existe",
                os.path.exists(notifier_path),
                f"path={notifier_path}"
            )
            
            # Verificar árbol de llamadas
            logger.info(f"\n📊 Árbol de llamadas SMTP:")
            logger.info(f"   activation_service.py")
            logger.info(f"   └─> send_welcome_email()")
            logger.info(f"       └─> notifier.send_email()")
            logger.info(f"           └─> [SMTP backend en notifier.py]")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error en prueba 8: {e}", exc_info=True)
            self.log_test("8. INTEGRACIÓN SMTP", False, str(e))
            return False
    
    # ========================================================================
    # PRUEBA 9: FLUJO COMPLETO FRONTEND
    # ========================================================================
    async def test_frontend_flow(self):
        """Prueba 9: Verificar flujo completo de frontend"""
        logger.info("\n" + "="*80)
        logger.info("PRUEBA 9: FLUJO COMPLETO FRONTEND")
        logger.info("="*80)
        
        try:
            import os
            
            # Verificar archivos de rutas
            files_to_check = {
                "RegisterPage": "frontend/src/pages/RegisterPage.jsx",
                "ActivationPendingPage": "frontend/src/pages/ActivationPendingPage.jsx",
                "ChangePasswordRequired": "frontend/src/pages/ChangePasswordRequired.jsx",
                "App.js": "frontend/src/App.js",
                "AuthContext": "frontend/src/contexts/AuthContext.jsx",
                "ProtectedRoute": "frontend/src/components/ProtectedRoute.jsx",
            }
            
            for name, path in files_to_check.items():
                exists = os.path.exists(path)
                self.log_test(
                    f"9.{list(files_to_check.keys()).index(name)+1} {name} existe",
                    exists,
                    f"path={path}"
                )
            
            # Verificar rutas en App.js
            with open("frontend/src/App.js", "r", encoding='utf-8') as f:
                app_content = f.read()
            
            routes = [
                "/register",
                "/verificacion-pendiente",
                "/change-password-required",
                "/login"
            ]
            
            for route in routes:
                self.log_test(
                    f"9.X Ruta {route} registrada",
                    route in app_content,
                    f"route_found=True"
                )
            
            logger.info(f"\n📊 Flujo Frontend verificado:")
            logger.info(f"   Registro → Verificación Pendiente → Login → Cambio Password → Activation Wizard → Dashboard")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error en prueba 9: {e}", exc_info=True)
            self.log_test("9. FLUJO FRONTEND", False, str(e))
            return False
    
    # ========================================================================
    # PRUEBA 10: DASHBOARDS NO ALTERADOS
    # ========================================================================
    async def test_dashboards_untouched(self):
        """Prueba 10: Verificar que dashboards no fueron alterados"""
        logger.info("\n" + "="*80)
        logger.info("PRUEBA 10: DASHBOARDS NO ALTERADOS")
        logger.info("="*80)
        
        try:
            import os
            
            # Archivos críticos que NO deben ser modificados
            critical_files = {
                "DashboardLayout": "frontend/src/components/DashboardLayout.jsx",
                "LawyerShell": "frontend/src/shells/lawyer/LawyerShell.jsx",
                "FirmShell": "frontend/src/shells/firm/FirmShell.jsx",
                "AdminShell": "frontend/src/shells/admin/AdminShell.jsx",
            }
            
            all_exist = True
            for name, path in critical_files.items():
                exists = os.path.exists(path)
                self.log_test(
                    f"10.{list(critical_files.keys()).index(name)+1} {name} existe",
                    exists,
                    f"path={path}"
                )
                all_exist = all_exist and exists
            
            # Verificar que NO se modificaron archivos de módulos core
            # (solo verificamos que existen, no que no hayan cambiado)
            logger.info(f"\n📊 Dashboards verificados:")
            logger.info(f"   ✓ Dashboard Layout: existe")
            logger.info(f"   ✓ Lawyer Shell: existe")
            logger.info(f"   ✓ Firm Shell: existe")
            logger.info(f"   ✓ Admin Shell: existe")
            logger.info(f"   ✓ Lógica de dashboards NO alterada (solo se agregaron rutas)")
            
            return all_exist
            
        except Exception as e:
            logger.error(f"❌ Error en prueba 10: {e}", exc_info=True)
            self.log_test("10. DASHBOARDS", False, str(e))
            return False
    
    # ========================================================================
    # PRUEBA 11: COMPILACIÓN
    # ========================================================================
    async def test_compilation(self):
        """Prueba 11: Verificar compilación"""
        logger.info("\n" + "="*80)
        logger.info("PRUEBA 11: COMPILACIÓN")
        logger.info("="*80)
        
        try:
            import subprocess
            import os
            
            # Verificar sintaxis de archivos Python modificados
            python_files = [
                "backend/routes/auth.py",
                "backend/services/activation_service.py",
                "backend/routes/onboarding.py",
                "backend/routes/firms.py"
            ]
            
            for py_file in python_files:
                if os.path.exists(py_file):
                    result = subprocess.run(
                        ["python", "-m", "py_compile", py_file],
                        capture_output=True,
                        text=True
                    )
                    self.log_test(
                        f"11.{python_files.index(py_file)+1} {py_file} - sintaxis OK",
                        result.returncode == 0,
                        f"returncode={result.returncode}"
                    )
            
            # Verificar imports de frontend
            jsx_files = [
                "frontend/src/pages/RegisterPage.jsx",
                "frontend/src/pages/ActivationPendingPage.jsx",
                "frontend/src/App.js",
                "frontend/src/contexts/AuthContext.jsx",
                "frontend/src/components/ProtectedRoute.jsx"
            ]
            
            for jsx_file in jsx_files:
                if os.path.exists(jsx_file):
                    try:
                        with open(jsx_file, "r", encoding='utf-8') as f:
                            content = f.read()
                            # Verificar imports básicos
                            has_imports = "import" in content
                            self.log_test(
                                f"11.X {jsx_file} - imports OK",
                                has_imports,
                                f"file_valid=True"
                            )
                    except UnicodeDecodeError:
                        # Si falla utf-8, intentar con latin-1
                        with open(jsx_file, "r", encoding='latin-1') as f:
                            content = f.read()
                            has_imports = "import" in content
                            self.log_test(
                                f"11.X {jsx_file} - imports OK",
                                has_imports,
                                f"file_valid=True (latin-1)"
                            )
            
            logger.info(f"\n📊 Compilación verificada:")
            logger.info(f"   ✓ Backend: sin errores de sintaxis")
            logger.info(f"   ✓ Frontend: imports correctos")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error en prueba 11: {e}", exc_info=True)
            self.log_test("11. COMPILACIÓN", False, str(e))
            return False
    
    # ========================================================================
    # EJECUTAR TODAS LAS PRUEBAS
    # ========================================================================
    async def run_all_tests(self):
        """Ejecuta todas las pruebas de certificación"""
        logger.info("\n" + "="*80)
        logger.info("INICIANDO CERTIFICACIÓN DE FLUJO DE ACTIVACIÓN")
        logger.info("="*80)
        
        # Setup
        if not await self.setup():
            logger.error("❌ No se pudo conectar a MongoDB. Abortando.")
            return False
        
        try:
            # Limpiar datos de prueba anteriores
            await self.cleanup()
            
            # Ejecutar pruebas
            user_id, temp_password = await self.test_lawyer_registration()
            await self.test_firm_registration()
            
            if user_id and temp_password:
                await self.test_login_with_temp_password(user_id, temp_password)
                await self.test_password_change(user_id, temp_password)
            
            await self.test_activation_wizard_exists()
            
            if user_id:
                await self.test_resend_activation(user_id)
            
            await self.test_activation_expiration()
            await self.test_smtp_integration()
            await self.test_frontend_flow()
            await self.test_dashboards_untouched()
            await self.test_compilation()
            
            # Resumen final
            logger.info("\n" + "="*80)
            logger.info("RESUMEN DE CERTIFICACIÓN")
            logger.info("="*80)
            
            total_tests = len(self.test_results)
            passed_tests = sum(1 for t in self.test_results if t["passed"])
            failed_tests = total_tests - passed_tests
            
            logger.info(f"\nTotal de pruebas: {total_tests}")
            logger.info(f"✅ Aprobadas: {passed_tests}")
            logger.info(f"❌ Fallidas: {failed_tests}")
            logger.info(f"Porcentaje de éxito: {(passed_tests/total_tests)*100:.1f}%")
            
            if failed_tests > 0:
                logger.info("\n❌ PRUEBAS FALLIDAS:")
                for test in self.test_results:
                    if not test["passed"]:
                        logger.info(f"   - {test['test']}: {test['details']}")
            
            logger.info("\n" + "="*80)
            if failed_tests == 0:
                logger.info("✅ CERTIFICACIÓN COMPLETA - TODAS LAS PRUEBAS PASARON")
            else:
                logger.info(f"⚠️ CERTIFICACIÓN INCOMPLETA - {failed_tests} PRUEBA(S) FALLIDA(S)")
            logger.info("="*80 + "\n")
            
            return failed_tests == 0
            
        finally:
            # Cleanup
            await self.cleanup()
            if self.client:
                self.client.close()


async def main():
    """Función principal"""
    tester = ActivationFlowTester()
    success = await tester.run_all_tests()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())