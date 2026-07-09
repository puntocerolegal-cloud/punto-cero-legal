"""
DARWIN E2E Tests

Comprehensive end-to-end tests for DARWIN system.
Tests all user types, channels, and scenarios.

FASE 12: Pruebas E2E
"""

import unittest
from datetime import datetime
from typing import Dict, Any

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from conversation.services.conversation_engine import ConversationEngine
from conversation.customer_activation.activation_engine import CustomerActivationEngine, ActivationInput
from conversation.core.router import ConversationRouter
from conversation.services.response_generator import ResponseGenerator
from conversation.services.darwin_decision_engine import DarwinDecisionEngine
from conversation.services.intelligent_escalation import IntelligentEscalation
from conversation.services.conversational_learning import ConversationalLearning


class TestDarwinE2E(unittest.TestCase):
    """
    End-to-end tests for DARWIN system.
    Tests complete conversation flows for all user types.
    """
    
    def setUp(self):
        """Set up test fixtures"""
        self.engine = ConversationEngine(firm_id="test_firm")
        self.activation_engine = CustomerActivationEngine()
        self.router = ConversationRouter()
        self.response_generator = ResponseGenerator()
        self.decision_engine = DarwinDecisionEngine()
        self.escalation_system = IntelligentEscalation()
        self.learning_system = ConversationalLearning()
    
    # ==================== CUSTOMER TESTS ====================
    
    def test_new_customer_inquiry(self):
        """Test new customer inquiry flow"""
        result = self.engine.process_conversation(
            message="Hola, necesito información sobre servicios legales",
            conversation_id="test_conv_001",
            context={
                "channel": "whatsapp",
                "phone": "+573001234567",
                "country": "Colombia",
                "is_returning_customer": False
            }
        )
        
        self.assertEqual(result["status"], "success")
        self.assertIsNotNone(result["response"])
        self.assertIsNotNone(result["intent"])
        self.assertIsNotNone(result["agent"])
        self.assertIn(result["agent"], ["commercial", "legal_ai", "support"])
    
    def test_existing_client_case_status(self):
        """Test existing client checking case status"""
        result = self.engine.process_conversation(
            message="¿Cuál es el estado de mi caso?",
            conversation_id="test_conv_002",
            context={
                "channel": "whatsapp",
                "phone": "+573001234567",
                "customer_id": "client_123",
                "is_returning_customer": True,
                "profile": "active_client",
                "intent": "case_status_inquiry"
            }
        )
        
        self.assertEqual(result["status"], "success")
        self.assertIsNotNone(result["response"])
        # When intent is explicitly case_status_inquiry, should route to client agent
        self.assertEqual(result["agent"], "client")
    
    def test_client_urgent_matter(self):
        """Test client with urgent matter"""
        result = self.engine.process_conversation(
            message="URGENTE: Necesito hablar con un abogado ahora mismo",
            conversation_id="test_conv_003",
            context={
                "channel": "whatsapp",
                "phone": "+573001234567",
                "customer_id": "client_123",
                "is_returning_customer": True,
                "profile": "active_client"
            }
        )
        
        self.assertEqual(result["status"], "success")
        self.assertTrue(result["should_escalate"])
        self.assertIsNotNone(result["escalation_reason"])
    
    # ==================== LAWYER TESTS ====================
    
    def test_lawyer_recruitment(self):
        """Test lawyer recruitment inquiry"""
        result = self.engine.process_conversation(
            message="Quiero registrarme como abogado en la plataforma",
            conversation_id="test_conv_004",
            context={
                "channel": "whatsapp",
                "phone": "+573001234568",
                "country": "Colombia",
                "is_returning_customer": False
            }
        )
        
        self.assertEqual(result["status"], "success")
        self.assertIsNotNone(result["response"])
        self.assertEqual(result["agent"], "lawyer")
    
    def test_lawyer_commission_inquiry(self):
        """Test lawyer commission inquiry"""
        result = self.engine.process_conversation(
            message="¿Cuánto ganan los abogados en la plataforma?",
            conversation_id="test_conv_005",
            context={
                "channel": "whatsapp",
                "phone": "+573001234568",
                "country": "Colombia",
                "is_returning_customer": False
            }
        )
        
        self.assertEqual(result["status"], "success")
        self.assertIsNotNone(result["response"])
    
    # ==================== FIRM TESTS ====================
    
    def test_firm_partnership_inquiry(self):
        """Test firm partnership inquiry"""
        result = self.engine.process_conversation(
            message="Somos una firma de abogados interesados en partnership",
            conversation_id="test_conv_006",
            context={
                "channel": "whatsapp",
                "phone": "+573001234569",
                "country": "Colombia",
                "is_returning_customer": False
            }
        )
        
        self.assertEqual(result["status"], "success")
        self.assertIsNotNone(result["response"])
        self.assertEqual(result["agent"], "firm")
    
    def test_firm_scaling_inquiry(self):
        """Test firm scaling inquiry"""
        result = self.engine.process_conversation(
            message="Queremos escalar nuestro equipo de 10 a 20 abogados",
            conversation_id="test_conv_007",
            context={
                "channel": "whatsapp",
                "phone": "+573001234569",
                "country": "Colombia",
                "is_returning_customer": False
            }
        )
        
        self.assertEqual(result["status"], "success")
        self.assertIsNotNone(result["response"])
    
    # ==================== SUPPORT TESTS ====================
    
    def test_technical_support(self):
        """Test technical support inquiry"""
        result = self.engine.process_conversation(
            message="No puedo acceder a mi cuenta, error de login",
            conversation_id="test_conv_008",
            context={
                "channel": "whatsapp",
                "phone": "+573001234570",
                "country": "Colombia",
                "is_returning_customer": False
            }
        )
        
        self.assertEqual(result["status"], "success")
        self.assertIsNotNone(result["response"])
        self.assertEqual(result["agent"], "support")
    
    def test_billing_support(self):
        """Test billing support inquiry"""
        result = self.engine.process_conversation(
            message="Tengo un problema con mi factura y pago",
            conversation_id="test_conv_009",
            context={
                "channel": "whatsapp",
                "phone": "+573001234570",
                "country": "Colombia",
                "is_returning_customer": False
            }
        )
        
        self.assertEqual(result["status"], "success")
        self.assertIsNotNone(result["response"])
    
    # ==================== LEGAL CASE TESTS ====================
    
    def test_legal_case_inquiry(self):
        """Test legal case inquiry"""
        result = self.engine.process_conversation(
            message="Necesito ayuda con un divorcio",
            conversation_id="test_conv_010",
            context={
                "channel": "whatsapp",
                "phone": "+573001234571",
                "country": "Colombia",
                "is_returning_customer": False
            }
        )
        
        self.assertEqual(result["status"], "success")
        self.assertIsNotNone(result["response"])
        # Should create case decision
        self.assertTrue(any(d["type"] == "create_case" for d in result.get("decisions", [])))
    
    def test_urgent_legal_matter(self):
        """Test urgent legal matter"""
        result = self.engine.process_conversation(
            message="URGENTE: Necesito un abogado penalista ahora",
            conversation_id="test_conv_011",
            context={
                "channel": "whatsapp",
                "phone": "+573001234571",
                "country": "Colombia",
                "is_returning_customer": False
            }
        )
        
        self.assertEqual(result["status"], "success")
        self.assertTrue(result["should_escalate"])
        # Should escalate to lawyer
        self.assertTrue(any(d["type"] == "escalate_lawyer" for d in result.get("decisions", [])))
    
    # ==================== ACTIVATION ENGINE TESTS ====================
    
    def test_profile_classification_lawyer(self):
        """Test lawyer profile classification"""
        activation_input = ActivationInput(
            conversation_id="test_act_001",
            channel="whatsapp",
            user_id=None,
            customer_id=None,
            message_content="Quiero ser abogado en la plataforma",
            message_timestamp=datetime.now(),
            user_metadata={"is_returning": False}
        )
        
        decision = self.activation_engine.activate(activation_input)
        
        self.assertEqual(decision.detected_profile.value, "lawyer")
        self.assertGreater(decision.confidence_profile, 0.5)
    
    def test_profile_classification_firm(self):
        """Test firm profile classification"""
        activation_input = ActivationInput(
            conversation_id="test_act_002",
            channel="whatsapp",
            user_id=None,
            customer_id=None,
            message_content="Somos una firma de abogados",
            message_timestamp=datetime.now(),
            user_metadata={"is_returning": False}
        )
        
        decision = self.activation_engine.activate(activation_input)
        
        self.assertEqual(decision.detected_profile.value, "firm")
        self.assertGreater(decision.confidence_profile, 0.5)
    
    def test_profile_classification_client(self):
        """Test client profile classification"""
        activation_input = ActivationInput(
            conversation_id="test_act_003",
            channel="whatsapp",
            user_id=None,
            customer_id=None,
            message_content="Necesito un abogado para mi caso",
            message_timestamp=datetime.now(),
            user_metadata={"is_returning": False}
        )
        
        decision = self.activation_engine.activate(activation_input)
        
        self.assertIn(decision.detected_profile.value, ["potential_client", "active_client"])
        self.assertGreater(decision.confidence_profile, 0.5)
    
    def test_intent_detection_urgent(self):
        """Test urgent intent detection"""
        activation_input = ActivationInput(
            conversation_id="test_act_004",
            channel="whatsapp",
            user_id=None,
            customer_id=None,
            message_content="URGENTE: Necesito ayuda ahora",
            message_timestamp=datetime.now(),
            user_metadata={"is_returning": False}
        )
        
        decision = self.activation_engine.activate(activation_input)
        
        self.assertEqual(decision.detected_intent, "urgent")
        self.assertGreater(decision.confidence_intent, 0.9)
    
    def test_intent_detection_sales(self):
        """Test sales intent detection"""
        activation_input = ActivationInput(
            conversation_id="test_act_005",
            channel="whatsapp",
            user_id=None,
            customer_id=None,
            message_content="¿Cuánto cuesta el servicio? Quiero contratar",
            message_timestamp=datetime.now(),
            user_metadata={"is_returning": False}
        )
        
        decision = self.activation_engine.activate(activation_input)
        
        self.assertEqual(decision.detected_intent, "sales")
        self.assertGreater(decision.confidence_intent, 0.7)
    
    # ==================== ROUTER TESTS ====================
    
    def test_router_urgent_intent(self):
        """Test router detects urgent intent"""
        routing_decision = self.router.route(
            message="URGENTE: Necesito ayuda inmediata",
            channel="whatsapp",
            user_context={"profile": "client"}
        )
        
        self.assertEqual(routing_decision.intention, "urgent")
        self.assertEqual(routing_decision.selected_agent, "escalation")
        self.assertGreater(routing_decision.confidence, 0.7)
    
    def test_router_sales_intent(self):
        """Test router detects sales intent"""
        routing_decision = self.router.route(
            message="¿Cuánto cuesta el servicio? Quiero contratar",
            channel="whatsapp",
            user_context={"profile": "potential_client"}
        )
        
        self.assertEqual(routing_decision.intention, "sales")
        self.assertEqual(routing_decision.selected_agent, "commercial")
        self.assertGreater(routing_decision.confidence, 0.7)
    
    def test_router_partnership_intent(self):
        """Test router detects partnership intent"""
        routing_decision = self.router.route(
            message="Somos una firma interesada en partnership",
            channel="whatsapp",
            user_context={"profile": "firm"}
        )
        
        self.assertEqual(routing_decision.intention, "partnership")
        self.assertEqual(routing_decision.selected_agent, "firm")
        self.assertGreater(routing_decision.confidence, 0.7)
    
    def test_router_lawyer_intent(self):
        """Test router detects lawyer recruitment intent"""
        routing_decision = self.router.route(
            message="Quiero registrarme como abogado",
            channel="whatsapp",
            user_context={"profile": "lawyer"}
        )
        
        self.assertEqual(routing_decision.intention, "lawyer_recruitment")
        self.assertEqual(routing_decision.selected_agent, "lawyer")
        self.assertGreater(routing_decision.confidence, 0.7)
    
    # ==================== DECISION ENGINE TESTS ====================
    
    def test_decision_create_lead(self):
        """Test decision engine creates lead for sales"""
        decisions = self.decision_engine.make_decision(
            profile="potential_client",
            intent="sales",
            priority="normal",
            context={"confidence": 0.8},
            message="¿Cuánto cuesta el servicio?"
        )
        
        self.assertTrue(any(d.decision_type.value == "create_lead" for d in decisions))
    
    def test_decision_create_case(self):
        """Test decision engine creates case for legal matters"""
        decisions = self.decision_engine.make_decision(
            profile="potential_client",
            intent="legal_case",
            priority="normal",
            context={"confidence": 0.9},
            message="Necesito ayuda con un divorcio"
        )
        
        self.assertTrue(any(d.decision_type.value == "create_case" for d in decisions))
    
    def test_decision_escalate_lawyer(self):
        """Test decision engine escalates urgent matters"""
        decisions = self.decision_engine.make_decision(
            profile="client",
            intent="urgent",
            priority="critical",
            context={"confidence": 0.95},
            message="URGENTE: Necesito un abogado ahora"
        )
        
        self.assertTrue(any(d.decision_type.value == "escalate_lawyer" for d in decisions))
    
    # ==================== ESCALATION TESTS ====================
    
    def test_escalation_urgent(self):
        """Test escalation for urgent matters"""
        decision = self.escalation_system.should_escalate(
            profile="active_client",
            intent="urgent",
            priority="critical",
            message="URGENTE: Emergencia legal",
            context={"is_vip": True}
        )
        
        self.assertTrue(decision.should_escalate)
        self.assertEqual(decision.urgency, "critical")
        self.assertEqual(decision.target_team, "legal")
    
    def test_escalation_high_value(self):
        """Test escalation for high-value clients"""
        decision = self.escalation_system.should_escalate(
            profile="company",
            intent="sales",
            priority="normal",
            message="Quiero contratar servicios para mi empresa",
            context={"estimated_value": 100000, "is_vip": True, "is_enterprise": True}
        )
        
        self.assertTrue(decision.should_escalate)
        # High-value deals ($100k+) trigger high_value escalation reason
        self.assertEqual(decision.reason.value, "high_value")
    
    def test_no_escalation_normal(self):
        """Test no escalation for normal inquiries"""
        decision = self.escalation_system.should_escalate(
            profile="potential_client",
            intent="inquiry",
            priority="normal",
            message="¿Qué servicios ofrecen?",
            context={}
        )
        
        self.assertFalse(decision.should_escalate)
    
    # ==================== LEARNING TESTS ====================
    
    def test_learning_from_conversation(self):
        """Test learning system learns from conversation"""
        context = self.learning_system.learn_from_conversation(
            user_id="user_123",
            conversation_id="conv_123",
            message="¿Cuánto cuesta el servicio?",
            response="Nuestros servicios empiezan desde $50",
            context={"intent": "sales", "profile": "potential_client"},
            decisions=[{"type": "create_lead", "parameters": {}}]
        )
        
        self.assertEqual(context.user_id, "user_123")
        self.assertEqual(context.total_interactions, 1)
        # Learning system should have recorded the interaction
        self.assertIsNotNone(context)
    
    def test_learning_preferences(self):
        """Test learning system learns preferences"""
        context = self.learning_system.learn_from_conversation(
            user_id="user_456",
            conversation_id="conv_456",
            message="Prefiero comunicarme por email",
            response="Perfecto, te contactaremos por correo",
            context={"intent": "inquiry", "profile": "potential_client"},
            decisions=[]
        )
        
        self.assertEqual(context.preferences.get("preferred_channel"), "email")
    
    def test_personalization_context(self):
        """Test personalization context generation"""
        # First conversation
        self.learning_system.learn_from_conversation(
            user_id="user_789",
            conversation_id="conv_789",
            message="Hola, necesito información",
            response="Hola, ¿en qué puedo ayudarte?",
            context={"intent": "inquiry", "profile": "potential_client"},
            decisions=[]
        )
        
        # Get personalization context
        personalization = self.learning_system.get_personalization_context("user_789")
        
        self.assertFalse(personalization.get("is_returning_user", False))
        
        # Second conversation
        self.learning_system.learn_from_conversation(
            user_id="user_789",
            conversation_id="conv_790",
            message="Quiero saber sobre precios",
            response="Nuestros precios son...",
            context={"intent": "sales", "profile": "potential_client"},
            decisions=[]
        )
        
        # Now should be returning user
        personalization = self.learning_system.get_personalization_context("user_789")
        self.assertTrue(personalization.get("is_returning_user", False))
        self.assertIn("pricing", personalization.get("previous_topics", []))
    
    # ==================== RESPONSE GENERATOR TESTS ====================
    
    def test_response_generator_initialization(self):
        """Test response generator initializes correctly"""
        status = self.response_generator.get_provider_status()
        
        self.assertIsNotNone(status)
        self.assertIn("providers", status)
        self.assertIn("default_provider", status)
        self.assertEqual(status["status"], "operational")
    
    def test_response_generator_fallback(self):
        """Test response generator fallback when no AI providers"""
        # Response generator should work even without API keys
        response = self.response_generator.generate_response(
            message="Test message",
            agent_type="commercial",
            context={"profile": "potential_client", "intent": "sales"}
        )
        
        self.assertIsNotNone(response)
        self.assertIsNotNone(response["content"])
        self.assertIsNotNone(response["confidence"])
    
    # ==================== INTEGRATION TESTS ====================
    
    def test_full_flow_new_client(self):
        """Test complete flow for new client"""
        result = self.engine.process_conversation(
            message="Hola, necesito un abogado para un caso de divorcio",
            conversation_id="integration_001",
            context={
                "channel": "whatsapp",
                "phone": "+573001234572",
                "country": "Colombia",
                "is_returning_customer": False
            }
        )
        
        # Verify complete flow
        self.assertEqual(result["status"], "success")
        self.assertIsNotNone(result["response"])
        self.assertIsNotNone(result["intent"])
        self.assertIsNotNone(result["agent"])
        self.assertIsNotNone(result["confidence"])
        self.assertIsNotNone(result["decisions"])
        self.assertTrue(len(result["decisions"]) > 0)
        
        # Should create case
        self.assertTrue(any(d["type"] == "create_case" for d in result["decisions"]))
    
    def test_full_flow_lawyer_recruitment(self):
        """Test complete flow for lawyer recruitment"""
        result = self.engine.process_conversation(
            message="Quiero unirme como abogado a la plataforma",
            conversation_id="integration_002",
            context={
                "channel": "whatsapp",
                "phone": "+573001234573",
                "country": "Colombia",
                "is_returning_customer": False,
                "profile": "lawyer"
            }
        )
        
        # Verify complete flow
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["agent"], "lawyer")
        self.assertIsNotNone(result["response"])
        
        # Should create lead for lawyer
        self.assertTrue(any(d["type"] == "create_lead" for d in result["decisions"]))
    
    def test_full_flow_firm_partnership(self):
        """Test complete flow for firm partnership"""
        result = self.engine.process_conversation(
            message="Somos una firma de 15 abogados, queremos partnership",
            conversation_id="integration_003",
            context={
                "channel": "whatsapp",
                "phone": "+573001234574",
                "country": "Colombia",
                "is_returning_customer": False,
                "profile": "firm"
            }
        )
        
        # Verify complete flow
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["agent"], "firm")
        self.assertIsNotNone(result["response"])
        
        # Should create partnership opportunity
        self.assertTrue(any(d["type"] == "create_lead" for d in result["decisions"]))
    
    def test_full_flow_urgent_escalation(self):
        """Test complete flow with urgent escalation"""
        result = self.engine.process_conversation(
            message="URGENTE: Emergencia legal, necesito abogado penalista ahora",
            conversation_id="integration_004",
            context={
                "channel": "whatsapp",
                "phone": "+573001234575",
                "country": "Colombia",
                "is_returning_customer": False
            }
        )
        
        # Verify complete flow
        self.assertEqual(result["status"], "success")
        self.assertTrue(result["should_escalate"])
        self.assertIsNotNone(result["escalation_reason"])
        
        # Should escalate to lawyer
        self.assertTrue(any(d["type"] == "escalate_lawyer" for d in result["decisions"]))


class TestDarwinComponents(unittest.TestCase):
    """Test individual DARWIN components"""
    
    def test_memory_manager(self):
        """Test memory manager functionality"""
        from conversation.memory.memory_manager import MemoryManager
        
        manager = MemoryManager()
        
        # Test get_or_create
        memory = manager.get_or_create("conv_123", memory_type="conversation")
        self.assertIsNotNone(memory)
        
        # Test retrieval
        memory2 = manager.get_or_create("conv_123", memory_type="conversation")
        self.assertEqual(memory, memory2)
    
    def test_knowledge_loader(self):
        """Test knowledge loader functionality"""
        from conversation.knowledge.knowledge_loader import KnowledgeLoader
        
        loader = KnowledgeLoader(vertical="legal")
        
        # Test load context
        context = loader.load_context(
            query="precio servicios legales",
            agent_type="commercial"
        )
        
        self.assertIsNotNone(context)
        self.assertIsNotNone(context.retrieved_documents)
    
    def test_conversation_logger(self):
        """Test conversation logger functionality"""
        from conversation.services.conversation_logger import ConversationLogger
        
        logger = ConversationLogger()
        
        # Test logging
        logger.log_agent_response(
            conversation_id="test_123",
            agent_type="commercial",
            response_content="Test response",
            confidence=0.85
        )
        
        # Test retrieval
        logs = logger.get_conversation_logs("test_123")
        self.assertEqual(len(logs), 1)
        self.assertEqual(logs[0].agent_type, "commercial")


if __name__ == "__main__":
    unittest.main()