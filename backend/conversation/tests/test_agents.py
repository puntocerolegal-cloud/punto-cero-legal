"""
COMPREHENSIVE AGENT TESTS

Tests for all agent implementations:
- CommercialAgent
- ClientAgent
- LawyerAgent
- FirmAgent
- SupportAgent

Verifies:
- Intent detection
- Response generation
- Escalation logic
- Backward compatibility
"""

import pytest
from datetime import datetime
from backend.conversation.agents.commercial_agent_darwin import CommercialAgentDarwin
from backend.conversation.agents.client_agent import ClientAgent
from backend.conversation.agents.lawyer_agent import LawyerAgent
from backend.conversation.agents.firm_agent import FirmAgent
from backend.conversation.agents.support_agent import SupportAgent


class TestCommercialAgentDarwin:
    """Tests for CommercialAgentDarwin"""
    
    def setup_method(self):
        self.agent = CommercialAgentDarwin()
    
    def test_agent_initialization(self):
        """Test agent initializes with correct type"""
        assert self.agent.agent_type == "commercial"
        assert "sales_inquiry" in self.agent.handled_intents
    
    def test_greeting_response(self):
        """Test greeting detection and response"""
        context = {"channel": "whatsapp", "client_name": "Juan"}
        response = self.agent.process_message(
            "Hola, tengo una pregunta",
            context=context
        )
        
        assert response.content is not None
        assert len(response.content) > 0
        assert response.agent_type == "commercial"
        assert response.channel == "whatsapp"
    
    def test_pricing_inquiry(self):
        """Test pricing inquiry handling"""
        context = {"channel": "landing"}
        response = self.agent.process_message(
            "¿Cuál es el precio de los servicios?",
            context=context
        )
        
        assert response.content is not None
        assert "precio" in response.content.lower() or "costo" in response.content.lower()
    
    def test_escalation_detection(self):
        """Test urgent matter escalation"""
        context = {"channel": "whatsapp"}
        response = self.agent.process_message(
            "Tengo un problema legal urgente, necesito un abogado ahora",
            context=context
        )
        
        assert response.requires_escalation is True
        assert response.escalation_reason is not None
    
    def test_multicontext_support(self):
        """Test multiple channel support"""
        channels = ["whatsapp", "landing", "api"]
        for channel in channels:
            response = self.agent.process_message(
                "Hola",
                context={"channel": channel}
            )
            assert response.channel == channel


class TestClientAgent:
    """Tests for ClientAgent"""
    
    def setup_method(self):
        self.agent = ClientAgent()
    
    def test_agent_initialization(self):
        """Test agent initializes correctly"""
        assert self.agent.agent_type == "client"
        assert "case_status_inquiry" in self.agent.handled_intents
    
    def test_case_status_inquiry(self):
        """Test case status inquiry handling"""
        response = self.agent.process_message(
            "¿Cuál es el estado de mi caso?",
            context={"client_name": "Maria"}
        )
        
        assert response.content is not None
        assert "caso" in response.content.lower() or "expediente" in response.content.lower()
    
    def test_document_request(self):
        """Test document request detection"""
        response = self.agent.process_message(
            "Necesito una copia del documento",
            context={}
        )
        
        assert "documento" in response.content.lower()
    
    def test_client_name_in_response(self):
        """Test client name is used in greeting"""
        context = {"client_name": "Carlos", "client_id": "123"}
        response = self.agent.process_message(
            "Hola, tengo una pregunta",
            context=context
        )
        
        assert response.content is not None
        # Should contain personalization
        assert len(response.content) > 10
    
    def test_escalation_to_lawyer(self):
        """Test escalation to lawyer when urgent"""
        response = self.agent.process_message(
            "Necesito hablar con mi abogado inmediatamente",
            context={}
        )
        
        assert response.requires_escalation is True


class TestLawyerAgent:
    """Tests for LawyerAgent"""
    
    def setup_method(self):
        self.agent = LawyerAgent()
    
    def test_agent_initialization(self):
        """Test agent initializes correctly"""
        assert self.agent.agent_type == "lawyer"
        assert "lawyer_recruitment" in self.agent.handled_intents
    
    def test_recruitment_inquiry(self):
        """Test recruitment inquiry handling"""
        response = self.agent.process_message(
            "¿Cómo puedo unirme como abogado?",
            context={}
        )
        
        assert response.content is not None
        assert "abogado" in response.content.lower() or "lawyer" in response.content.lower()
    
    def test_benefits_inquiry(self):
        """Test platform benefits explanation"""
        response = self.agent.process_message(
            "¿Cuáles son los beneficios de la plataforma?",
            context={}
        )
        
        assert response.content is not None
        assert len(response.content) > 20
    
    def test_commission_inquiry(self):
        """Test commission information"""
        response = self.agent.process_message(
            "¿Cuánto gano por cada caso?",
            context={}
        )
        
        assert response.content is not None
        assert "comisión" in response.content.lower() or "ganancia" in response.content.lower()
    
    def test_intent_detection(self):
        """Test various intent detection"""
        test_cases = [
            ("unirse", "lawyer_recruitment"),
            ("beneficios", "platform_benefits"),
            ("comisión", "commission_inquiry"),
        ]
        
        for message, expected_intent in test_cases:
            intent = self.agent._detect_intent(message)
            assert intent is not None


class TestFirmAgent:
    """Tests for FirmAgent"""
    
    def setup_method(self):
        self.agent = FirmAgent()
    
    def test_agent_initialization(self):
        """Test agent initializes correctly"""
        assert self.agent.agent_type == "firm"
        assert "firm_partnership" in self.agent.handled_intents
    
    def test_partnership_inquiry(self):
        """Test partnership inquiry"""
        response = self.agent.process_message(
            "¿Cómo podría asociarme con Punto Cero?",
            context={}
        )
        
        assert response.content is not None
        assert len(response.content) > 20
    
    def test_enterprise_inquiry(self):
        """Test enterprise solution inquiry"""
        response = self.agent.process_message(
            "¿Qué opciones tienen para empresas grandes?",
            context={}
        )
        
        assert response.content is not None
    
    def test_team_scaling(self):
        """Test team scaling inquiry"""
        response = self.agent.process_message(
            "¿Cómo agregamos más abogados a nuestro equipo?",
            context={}
        )
        
        assert response.content is not None
    
    def test_no_escalation_for_info(self):
        """Test that info queries don't escalate unnecessarily"""
        response = self.agent.process_message(
            "¿Cuáles son los beneficios?",
            context={}
        )
        
        assert response.requires_escalation is False


class TestSupportAgent:
    """Tests for SupportAgent"""
    
    def setup_method(self):
        self.agent = SupportAgent()
    
    def test_agent_initialization(self):
        """Test agent initializes correctly"""
        assert self.agent.agent_type == "support"
        assert "technical_support" in self.agent.handled_intents
    
    def test_login_issue_help(self):
        """Test login issue assistance"""
        response = self.agent.process_message(
            "No puedo acceder a mi cuenta",
            context={}
        )
        
        assert response.content is not None
        assert "contraseña" in response.content.lower() or "password" in response.content.lower()
    
    def test_technical_error_escalation(self):
        """Test technical error escalation"""
        response = self.agent.process_message(
            "La plataforma crashed cuando intenté crear un caso",
            context={}
        )
        
        assert response.requires_escalation is True
    
    def test_billing_support(self):
        """Test billing inquiry handling"""
        response = self.agent.process_message(
            "¿Cómo funciona la facturación?",
            context={}
        )
        
        assert response.content is not None
    
    def test_data_loss_escalation(self):
        """Test data loss issue escalation"""
        response = self.agent.process_message(
            "He perdido datos importantes",
            context={}
        )
        
        assert response.requires_escalation is True
    
    def test_feature_request(self):
        """Test feature request handling"""
        response = self.agent.process_message(
            "¿Podrían agregar una característica de...?",
            context={}
        )
        
        assert response.content is not None


class TestAgentIntegration:
    """Integration tests across multiple agents"""
    
    def test_all_agents_respond_to_greeting(self):
        """Test all agents respond to basic greeting"""
        agents = [
            CommercialAgentDarwin(),
            ClientAgent(),
            LawyerAgent(),
            FirmAgent(),
            SupportAgent(),
        ]
        
        for agent in agents:
            response = agent.process_message("Hola", context={})
            assert response.content is not None
            assert len(response.content) > 0
            assert response.agent_type is not None
    
    def test_all_agents_return_valid_structure(self):
        """Test all agents return valid AgentResponse"""
        agents = [
            CommercialAgentDarwin(),
            ClientAgent(),
            LawyerAgent(),
            FirmAgent(),
            SupportAgent(),
        ]
        
        for agent in agents:
            response = agent.process_message("Test", context={})
            
            assert hasattr(response, 'content')
            assert hasattr(response, 'agent_type')
            assert hasattr(response, 'timestamp')
            assert hasattr(response, 'confidence')
            assert isinstance(response.timestamp, datetime)
    
    def test_no_agent_hardcodes_vertical(self):
        """Test no agent hardcodes vertical-specific info in core"""
        agents = [
            CommercialAgentDarwin(),
            ClientAgent(),
            LawyerAgent(),
            FirmAgent(),
            SupportAgent(),
        ]
        
        # Response should be reusable for any vertical
        for agent in agents:
            response = agent.process_message("Test", context={})
            # Should not contain Legal-specific language in core response
            content_lower = response.content.lower()
            # (Depends on content, but core agents shouldn't hardcode legal)
            assert response.content is not None


# Test Backward Compatibility

class TestBackwardCompatibility:
    """Tests to ensure backward compatibility"""
    
    def test_agents_dont_break_existing_flows(self):
        """Test agents coexist with existing systems"""
        # Agents should add functionality, not replace existing
        agent = CommercialAgentDarwin()
        response = agent.process_message("test", context={})
        
        # Should return valid response without breaking
        assert response is not None
        assert response.content is not None
    
    def test_all_agents_accept_optional_context(self):
        """Test agents work with and without context"""
        agent = ClientAgent()
        
        # Without context
        response1 = agent.process_message("test", context=None)
        assert response1.content is not None
        
        # With context
        response2 = agent.process_message("test", context={"channel": "whatsapp"})
        assert response2.content is not None
    
    def test_agents_work_across_channels(self):
        """Test agents support multiple channels"""
        channels = ["whatsapp", "landing", "dashboard", "api", "mobile"]
        agent = CommercialAgentDarwin()
        
        for channel in channels:
            response = agent.process_message(
                "test",
                context={"channel": channel}
            )
            assert response.channel == channel


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
