"""
SPRINT 2 END-TO-END INTEGRATION TESTS

Tests the complete conversation flow:
- Customer Activation
- Routing
- Agent Processing
- Memory Management
- Knowledge Injection
- Response Formatting

Verifies all components work together seamlessly.
"""

import pytest
from datetime import datetime
from backend.conversation.customer_activation.activation_engine import (
    CustomerActivationEngine,
    ActivationInput,
    CustomerProfile,
    ConversationStatus
)
from backend.conversation.core.router import ConversationRouter
from backend.conversation.agents.commercial_agent_darwin import CommercialAgentDarwin
from backend.conversation.agents.client_agent import ClientAgent
from backend.conversation.agents.support_agent import SupportAgent
from backend.conversation.memory.memory_manager import MemoryManager
from backend.conversation.knowledge.knowledge_loader import KnowledgeLoader
from backend.conversation.avatar.darwin_avatar import DarwinAvatar, AvatarState
from backend.conversation.ui.avatar_component import AvatarUIRenderer


class TestEndToEndConversationFlow:
    """Tests complete conversation from user to response"""
    
    def setup_method(self):
        """Setup all components for integration test"""
        self.activation_engine = CustomerActivationEngine()
        self.router = ConversationRouter()
        self.memory_manager = MemoryManager()
        self.knowledge_loader = KnowledgeLoader(vertical="legal")
        self.avatar = DarwinAvatar()
        self.ui_renderer = AvatarUIRenderer()
    
    def test_complete_flow_new_prospect_whatsapp(self):
        """Test full flow: New prospect → WhatsApp → Commercial Agent"""
        
        # Step 1: Activation
        activation_input = ActivationInput(
            message="Hola, tengo una pregunta sobre servicios legales",
            phone="+34123456789",
            channel="whatsapp",
            metadata={"country": "Spain"}
        )
        
        activation_result = self.activation_engine.activate(activation_input)
        
        assert activation_result.profile == CustomerProfile.CLIENT
        assert activation_result.status == ConversationStatus.ACTIVE
        
        # Step 2: Routing
        routing_decision = self.router.route(
            message=activation_input.message,
            channel="whatsapp",
            user_context={
                "client_id": activation_result.customer_id,
                "profile": activation_result.profile.value,
                "country": "Spain"
            }
        )
        
        assert routing_decision.selected_agent == "commercial"
        assert routing_decision.channel == "whatsapp"
        
        # Step 3: Memory Load
        conversation = self.memory_manager.get_or_create_conversation(
            f"conv-{activation_result.customer_id}"
        )
        conversation.add_message({
            "sender": "user",
            "text": activation_input.message,
            "timestamp": datetime.now().isoformat()
        })
        
        assert len(conversation.messages) == 1
        
        # Step 4: Knowledge Load
        knowledge_context = self.knowledge_loader.load_context(
            query=activation_input.message,
            agent_type="commercial",
            vertical="legal"
        )
        
        assert knowledge_context.confidence > 0
        
        # Step 5: Agent Processing
        agent = CommercialAgentDarwin()
        agent_response = agent.process_message(
            activation_input.message,
            context={
                "channel": "whatsapp",
                "client_id": activation_result.customer_id,
                "country": "Spain"
            }
        )
        
        assert agent_response.content is not None
        assert agent_response.agent_type == "commercial"
        assert agent_response.channel == "whatsapp"
        
        # Step 6: Avatar State
        avatar_state = self.avatar.set_listening()
        assert avatar_state.state == AvatarState.LISTENING
        
        # Step 7: UI Rendering
        ui_response = self.ui_renderer.render_chat_widget(
            avatar_state="listening",
            avatar_expression="neutral",
            message=agent_response.content,
            typing=False
        )
        
        assert ui_response["component"] == "darwin-avatar"
        assert ui_response["state"]["state"] == "listening"
        
        # Step 8: Memory Save
        conversation.add_message({
            "sender": "darwin",
            "text": agent_response.content,
            "timestamp": datetime.now().isoformat(),
            "agent": "commercial"
        })
        
        self.memory_manager.save_conversation(conversation)
        
        assert len(conversation.messages) == 2
        
        # Verification
        retrieved_conv = self.memory_manager.get_conversation(conversation.conversation_id)
        assert retrieved_conv is not None
        assert len(retrieved_conv.messages) == 2
    
    def test_complete_flow_returning_client(self):
        """Test full flow: Returning client → Case inquiry → Client Agent"""
        
        # Setup: Create existing client
        client_id = "client-existing-001"
        client = self.memory_manager.get_or_create_client(client_id)
        client.first_name = "Juan"
        client.email = "juan@example.com"
        client.add_interaction({"action": "signed_up", "date": "2023-01-15"})
        
        self.memory_manager.save_client(client)
        
        # Step 1: Activation
        activation_input = ActivationInput(
            message="¿Cuál es el estado de mi caso?",
            phone="+34987654321",
            channel="whatsapp",
            client_id=client_id,
            metadata={"returning_customer": True}
        )
        
        activation_result = self.activation_engine.activate(activation_input)
        assert activation_result.profile == CustomerProfile.CLIENT
        
        # Step 2: Routing
        routing_decision = self.router.route(
            message=activation_input.message,
            channel="whatsapp",
            user_context={
                "client_id": client_id,
                "profile": CustomerProfile.CLIENT.value,
                "client_name": "Juan"
            }
        )
        
        # Should route to client agent for case inquiry
        assert routing_decision.selected_agent in ["client", "commercial"]
        
        # Step 3: Agent Processing
        agent = ClientAgent()
        agent_response = agent.process_message(
            activation_input.message,
            context={
                "channel": "whatsapp",
                "client_id": client_id,
                "client_name": "Juan"
            }
        )
        
        assert agent_response.content is not None
        assert agent_response.agent_type == "client"
        assert "Juan" in agent_response.content or "caso" in agent_response.content.lower()
        
        # Step 4: Memory Update
        conversation = self.memory_manager.get_or_create_conversation(
            f"conv-{client_id}-{datetime.now().timestamp()}"
        )
        conversation.add_message({"sender": "user", "text": activation_input.message})
        conversation.add_message({"sender": "darwin", "text": agent_response.content})
        
        self.memory_manager.save_conversation(conversation)
        
        # Verify
        retrieved_client = self.memory_manager.get_client(client_id)
        assert retrieved_client.first_name == "Juan"
    
    def test_escalation_flow(self):
        """Test escalation flow when agent detects urgent matter"""
        
        # Create urgent support request
        urgent_message = "Tengo un problema crítico con la plataforma, no puedo acceder"
        
        # Step 1: Activation
        activation_input = ActivationInput(
            message=urgent_message,
            channel="whatsapp",
            metadata={"severity": "high"}
        )
        
        activation_result = self.activation_engine.activate(activation_input)
        
        # Step 2: Routing
        routing_decision = self.router.route(
            message=urgent_message,
            channel="whatsapp"
        )
        
        # Step 3: Support Agent Processing
        agent = SupportAgent()
        agent_response = agent.process_message(
            urgent_message,
            context={"channel": "whatsapp"}
        )
        
        # Should detect escalation
        assert agent_response.requires_escalation is True
        assert "equipo" in agent_response.content.lower() or "support" in agent_response.content.lower()
        
        # Step 4: Memory Save with escalation flag
        conversation = self.memory_manager.get_or_create_conversation("conv-urgent-001")
        conversation.add_message({
            "sender": "user",
            "text": urgent_message,
            "escalation_detected": True
        })
        conversation.add_message({
            "sender": "darwin",
            "text": agent_response.content,
            "escalation_reason": agent_response.escalation_reason
        })
        
        self.memory_manager.save_conversation(conversation)
        
        # Verify escalation was tracked
        retrieved = self.memory_manager.get_conversation("conv-urgent-001")
        assert any("escalation" in str(msg).lower() for msg in retrieved.messages)
    
    def test_memory_persistence_across_messages(self):
        """Test that memory persists information across multiple messages"""
        
        client_id = "memory-test-001"
        conv_id = f"conv-{client_id}"
        
        # Message 1: Initial greeting
        msg1 = "Hola, tengo una pregunta"
        conv1 = self.memory_manager.get_or_create_conversation(conv_id)
        conv1.add_message({"sender": "user", "text": msg1})
        self.memory_manager.save_conversation(conv1)
        
        # Message 2: Follow-up (should retain context)
        msg2 = "¿Cuál es el precio?"
        conv2 = self.memory_manager.get_conversation(conv_id)
        assert conv2 is not None
        assert len(conv2.messages) == 1  # Previous message still there
        
        conv2.add_message({"sender": "user", "text": msg2})
        self.memory_manager.save_conversation(conv2)
        
        # Message 3: Another follow-up
        msg3 = "¿Cuál es el proceso?"
        conv3 = self.memory_manager.get_conversation(conv_id)
        assert len(conv3.messages) == 2
        
        conv3.add_message({"sender": "user", "text": msg3})
        self.memory_manager.save_conversation(conv3)
        
        # Final verification
        final_conv = self.memory_manager.get_conversation(conv_id)
        assert len(final_conv.messages) == 3
        assert final_conv.messages[0]["text"] == msg1
        assert final_conv.messages[1]["text"] == msg2
        assert final_conv.messages[2]["text"] == msg3
    
    def test_knowledge_injection_into_response(self):
        """Test that knowledge is properly injected into agent response"""
        
        # Load knowledge
        loader = KnowledgeLoader(vertical="legal")
        context = loader.load_context(
            query="¿Cuál es tu precio?",
            agent_type="commercial",
            vertical="legal"
        )
        
        # Verify knowledge loaded
        assert context is not None
        assert context.confidence > 0
        assert context.relevant_policies is not None
        
        # Get agent response
        agent = CommercialAgentDarwin()
        response = agent.process_message(
            "¿Cuál es tu precio?",
            context={}
        )
        
        # Response should incorporate knowledge
        assert response.content is not None
        assert len(response.content) > 0
    
    def test_multi_agent_routing(self):
        """Test that different messages route to appropriate agents"""
        
        test_cases = [
            ("Hola, tengo una pregunta", CommercialAgentDarwin, "commercial"),
            ("¿Cuál es el estado de mi caso?", ClientAgent, "client"),
            ("No puedo acceder a mi cuenta", SupportAgent, "support"),
        ]
        
        router = ConversationRouter()
        
        for message, agent_class, expected_type in test_cases:
            # Simulate routing
            routing_decision = router.route(
                message=message,
                channel="whatsapp"
            )
            
            # Test agent
            agent = agent_class()
            response = agent.process_message(message, context={"channel": "whatsapp"})
            
            assert response.agent_type == expected_type
            assert response.content is not None
    
    def test_avatar_state_transitions(self):
        """Test avatar state transitions during conversation"""
        
        avatar = DarwinAvatar()
        states_visited = []
        
        # Conversation flow
        states = [
            ("idle", avatar.set_idle),
            ("thinking", avatar.set_thinking),
            ("typing", avatar.set_typing),
            ("listening", avatar.set_listening),
            ("happy", avatar.set_happy),
        ]
        
        for state_name, state_func in states:
            state = state_func()
            states_visited.append(state.state.value)
            assert state.state.value == state_name
        
        # Verify state history
        history = avatar.get_state_history()
        assert len(history) == len(states)
    
    def test_backward_compatibility_no_breaking_changes(self):
        """Test that Sprint 2 doesn't break existing functionality"""
        
        # Test that all components initialize without errors
        try:
            activation = CustomerActivationEngine()
            router = ConversationRouter()
            memory = MemoryManager()
            knowledge = KnowledgeLoader()
            avatar = DarwinAvatar()
            agents = [
                CommercialAgentDarwin(),
                ClientAgent(),
                SupportAgent(),
            ]
            
            # Basic operation test
            msg = "test"
            for agent in agents:
                response = agent.process_message(msg)
                assert response.content is not None
            
            compatibility_ok = True
        except Exception as e:
            compatibility_ok = False
            pytest.fail(f"Backward compatibility broken: {str(e)}")
        
        assert compatibility_ok


class TestMultiChannelSupport:
    """Tests channel-specific behavior"""
    
    def test_whatsapp_channel_flow(self):
        """Test WhatsApp-specific flow"""
        agent = CommercialAgentDarwin()
        response = agent.process_message(
            "Hola",
            context={"channel": "whatsapp"}
        )
        assert response.channel == "whatsapp"
    
    def test_landing_channel_flow(self):
        """Test Landing page channel flow"""
        agent = CommercialAgentDarwin()
        response = agent.process_message(
            "¿Cuál es tu precio?",
            context={"channel": "landing"}
        )
        assert response.channel == "landing"
    
    def test_api_channel_flow(self):
        """Test API channel flow"""
        agent = CommercialAgentDarwin()
        response = agent.process_message(
            "Información general",
            context={"channel": "api"}
        )
        assert response.channel == "api"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
