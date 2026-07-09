# DARWIN CORE - Quick Reference

## Module Organization

### 📍 CORE (Routing)
**File:** `core/router.py`
- `ConversationRouter` - Route messages to agents based on intent
- Entry point for all conversations
- Identifies: channel, context, intention, agent

### 🔀 CHANNELS (Multi-Channel)
**Directory:** `channels/`
- `WhatsAppChannel` - WhatsApp integration
- `LandingChannel` - Landing page widget
- `DashboardChannel` - Internal dashboard
- `APIChannel` - REST API integration
- `MobileChannel` - Mobile app integration
- All inherit from `ChannelAdapter`

### 🤖 AGENTS (Specialization)
**Directory:** `agents/`
- `CommercialAgent` - Business & contracts
- `LawyerAgent` - Legal matters
- `FirmAgent` - Internal operations
- `SupportAgent` - Customer support
- `ClientAgent` - Client relations
- All inherit from `BaseAgent`

### 💾 MEMORY (State Management)
**Directory:** `memory/`
- `ConversationMemory` - Current conversation
- `ClientMemory` - Client profile & history
- `BusinessMemory` - Firm context
- `PreferencesMemory` - User preferences
- `MemoryManager` - Unified interface

### 👤 PERSONALITY (Identity)
**File:** `personality/darwin_personality.py`
- Single file containing all personality traits
- Mission, values, tone, rules, prohibitions
- System prompt generation for AI models

### 📝 PROMPTS (Instructions)
**Directory:** `prompts/`
- `commercial.md` - Commercial agent instructions
- `lawyer.md` - Lawyer agent instructions
- `firm.md` - Firm agent instructions
- `support.md` - Support agent instructions
- `client.md` - Client agent instructions

### 📊 SCHEMAS (Data Models)
**File:** `schemas/conversation_schemas.py`
- `ConversationContext` - User & interaction context
- `ConversationIntent` - Detected intention
- `ConversationChannel` - Channel capabilities
- `ConversationResponse` - Response structure
- `ConversationProfile` - User preferences

### ⚙️ SERVICES (Operations)
**Directory:** `services/`
- `ConversationEngine` - Main orchestrator
- `IntentDetector` - Intent classification
- `ResponseBuilder` - Response formatting
- `ConversationLogger` - Audit trail

---

## Conversation Flow

```
Message → Channel → Router → Agent → Memory → Response → Logger → Channel
```

1. **Channel** receives message
2. **Router** analyzes and selects agent
3. **Agent** processes with personality guidelines
4. **Memory** loads/saves context
5. **Response** formatted by ResponseBuilder
6. **Logger** records interaction
7. **Channel** delivers response

---

## Integration Points (Phase 2)

| Component | Current | Phase 2 |
|-----------|---------|---------|
| AI Models | Placeholder | Gemini/Claude |
| Database | In-memory | MongoDB |
| WhatsApp | Placeholder | Official API |
| Intent Detection | Framework | NLP/AI powered |
| Authentication | None | JWT/OAuth |

---

## Design Principles

✅ **Modular** - Each component independent
✅ **Multi-tenant** - firm_id isolation everywhere
✅ **Extensible** - Add agents, channels, intents easily
✅ **Interface-based** - All major classes have abstract base
✅ **Schema-validated** - Typed data throughout
✅ **Documented** - Code + this guide + main report

---

## Key Classes

| Class | Purpose | File |
|-------|---------|------|
| `ConversationRouter` | Route messages | `core/router.py` |
| `BaseAgent` | Agent interface | `agents/base_agent.py` |
| `ChannelAdapter` | Channel interface | `channels/channel_adapter.py` |
| `MemoryManager` | Memory coordination | `memory/memory_manager.py` |
| `DarwinPersonality` | Personality traits | `personality/darwin_personality.py` |
| `ConversationEngine` | Main orchestrator | `services/conversation_engine.py` |

---

## Phase 2 Checklist

- [ ] Connect AI models (Gemini, Claude)
- [ ] Implement intent detection
- [ ] Connect MongoDB for persistence
- [ ] Activate WhatsApp channel
- [ ] Implement agent response logic
- [ ] Add authentication (JWT)
- [ ] Create API endpoints
- [ ] Build web dashboard integration
- [ ] Add testing suite
- [ ] Performance optimization

---

**Status:** Phase 1 complete - Ready for integration
**Next:** Phase 2 - AI & persistence layer
