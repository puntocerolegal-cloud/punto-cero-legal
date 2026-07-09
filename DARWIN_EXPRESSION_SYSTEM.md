# DARWIN EXPRESSION SYSTEM

**Version:** 1.0  
**Purpose:** Dynamic expression engine for avatar state changes  
**Status:** Architecture (Ready for Implementation)

---

## I. OVERVIEW

The Expression System controls how Darwin's avatar appears during conversations. Through facial expressions and body language, Darwin communicates emotion and context without using words.

This system transforms Darwin from static to living — responsive, human-like, and emotionally intelligent.

---

## II. CORE EXPRESSION STATES (13 Total)

### 1. IDLE STATE
**When:** Avatar waiting, conversation hasn't started
**Expression:** Neutral, professional, attentive
**Eye Contact:** Forward, comfortable
**Mouth:** Slight professional smile or neutral
**Posture:** Upright, open
**Animation:** Subtle breathing/blinking (life signs)
**Duration:** Continuous until user interaction
**Message:** "I'm ready to help when you are"

### 2. GREETING STATE
**When:** First contact with user
**Expression:** Warm, welcoming, open
**Eye Contact:** Direct, inviting
**Mouth:** Genuine smile (Duchenne smile)
**Posture:** Slight forward lean (approachable)
**Gesture:** Hand visible in welcoming position
**Animation:** Smile arrival (300ms fade-in)
**Duration:** 2-3 seconds or until user response
**Message:** "Welcome, you're in good hands"

### 3. LISTENING STATE
**When:** User is sharing information or concern
**Expression:** Focused, engaged, understanding
**Eye Contact:** Attentive, tracking user input
**Mouth:** Soft, closed, natural
**Posture:** Forward lean slightly (interested)
**Gesture:** Head tilt slight (suggests understanding)
**Animation:** Minimal (focus on appearing still)
**Duration:** Throughout user input
**Message:** "I'm fully present and understanding"

### 4. THINKING STATE
**When:** Processing user information before response
**Expression:** Thoughtful, concentrated
**Eye Contact:** Down slightly or contemplative
**Mouth:** Neutral, slight compression (thinking)
**Posture:** Still, composed, professional
**Gesture:** Hand to chin possible (universal thinking)
**Animation:** Pause, slight head movement (300-500ms)
**Duration:** 1-3 seconds (realistic processing)
**Message:** "I'm carefully considering your situation"

### 5. UNDERSTANDING STATE
**When:** Acknowledging and validating user's concern
**Expression:** Empathetic, recognizing
**Eye Contact:** Warm, connected
**Mouth:** Gentle smile, understanding
**Posture:** Relaxed, comfortable
**Gesture:** Subtle acknowledgment
**Animation:** Nod possible (200ms)
**Duration:** 1-2 seconds
**Message:** "I understand. You're not alone in this"

### 6. TYPING STATE
**When:** Darwin is composing response
**Expression:** Professional, focused
**Eye Contact:** Slightly down (composing)
**Mouth:** Neutral, concentrated
**Posture:** Slightly forward (engaged)
**Gesture:** Hands visible, movement possible
**Animation:** Typing indicator or subtle motion
**Duration:** Variable (realistic to message length)
**Message:** "Composing thoughtful response..."

### 7. SERIOUS STATE
**When:** Complex, urgent, or important matter
**Expression:** Professional, serious, focused
**Eye Contact:** Direct, unwavering
**Mouth:** Neutral, professional (no smile)
**Posture:** Upright, confident
**Gesture:** Composed, hands visible
**Animation:** Transition (200ms to seriousness)
**Duration:** Throughout serious discussion
**Message:** "This matters. You have my full focus"

### 8. EMPHATIC STATE
**When:** Validating emotion, supporting concern
**Expression:** Warm, connected, caring
**Eye Contact:** Soft, empathetic
**Mouth:** Gentle, understanding expression
**Posture:** Relaxed, open
**Gesture:** Slight lean forward (caring)
**Animation:** Smooth transition (300ms)
**Duration:** 2-4 seconds
**Message:** "Your concern is valid and understood"

### 9. HAPPY STATE
**When:** Positive news, progress, or achievement
**Expression:** Genuinely happy, warm
**Eye Contact:** Bright, engaged
**Mouth:** Genuine smile (Duchenne)
**Posture:** Relaxed, open
**Gesture:** Possible hand gesture of celebration
**Animation:** Smile arrival, slight brightening
**Duration:** 2-3 seconds or sustained
**Message:** "This is great news. I'm genuinely pleased"

### 10. SUCCESS STATE
**When:** User achieves goal, completes action
**Expression:** Proud, celebratory, professional
**Eye Contact:** Bright, affirming
**Mouth:** Proud smile (not cartoonish)
**Posture:** Upright, confident
**Gesture:** Hand gesture possible (thumbs up or similar)
**Animation:** Brief celebratory (500ms)
**Duration:** 1-2 seconds
**Message:** "Excellent. You made the right choice"

### 11. WARNING STATE
**When:** Alert needed, important information
**Expression:** Alert, serious, attentive
**Eye Contact:** Direct, communicating importance
**Mouth:** Serious, professional (no smile)
**Posture:** Upright, commanding attention
**Gesture:** Hand gesture possible (caution)
**Animation:** Transition (150ms to alert)
**Duration:** Throughout warning
**Message:** "Pay attention. This is important"

### 12. EXPLAINING STATE
**When:** Teaching, clarifying, guiding
**Expression:** Patient, clear, intelligent
**Eye Contact:** Engaging, educational
**Mouth:** Natural, speaking expression
**Posture:** Open, educational stance
**Gesture:** Hand gestures possible (illustrating)
**Animation:** Gestures with message (natural)
**Duration:** Throughout explanation
**Message:** "Let me help you understand this"

### 13. GOODBYE STATE
**When:** Closing conversation, escalating to human
**Expression:** Professional, warm, reassuring
**Eye Contact:** Warm, confident
**Mouth:** Professional smile, reassuring
**Posture:** Open, positive
**Gesture:** Hand gesture of handoff or wave
**Animation:** Smooth transition (300-500ms)
**Duration:** 1-2 seconds
**Message:** "You're in good hands. Take care"

---

## III. EXPRESSION TRANSITION RULES

### Transition Speed Guidelines

**Instant (0ms):**
- Emergency escalation
- Critical alerts
- Immediate state changes

**Fast (150-200ms):**
- Alert states
- Warning transitions
- Important shifts

**Normal (300-400ms):**
- Standard transitions
- Smile arrivals
- Expression changes

**Slow (500-800ms):**
- Thinking state
- Processing displays
- Deliberate pauses

**Never Instant (Always Smooth):**
- Greeting to listening
- Listening to thinking
- Thinking to responding

### Transition Combinations (Common Flows)

```
USER INITIATES CONVERSATION:
Idle → Greeting → Listening

USER SHARES PROBLEM:
Listening → Understanding → Thinking

DARWIN RESPONDS:
Typing → Speaking/Explaining → Listening

USER EXCITED ABOUT OUTCOME:
Thinking → Happy → Success

URGENT SITUATION:
Listening → Warning → Serious (Escalation)

DARWIN HANDS OFF TO HUMAN:
Serious → Goodbye → [Fade]
```

---

## IV. EXPRESSION BY CONVERSATION PHASE

### Phase 1: ARRIVAL
**User:** Just arriving at the platform
**Expression Flow:** Idle → Greeting

**Darwin's Expression:**
- Warm welcoming
- Open body language
- Genuine smile
- Eye contact

**Goal:** Make user feel welcomed and safe

### Phase 2: DISCOVERY
**User:** Explaining their situation
**Expression Flow:** Greeting → Listening → Understanding

**Darwin's Expression:**
- Full attention
- Head leaning slightly forward
- Empathetic eyes
- Validating expression

**Goal:** Show complete understanding and care

### Phase 3: ANALYSIS
**User:** Awaiting Darwin's analysis
**Expression Flow:** Listening → Thinking → Professional

**Darwin's Expression:**
- Thoughtful expression
- Concentrated look
- Pause showing careful consideration
- Professional focus

**Goal:** Demonstrate careful analysis

### Phase 4: GUIDANCE
**User:** Receiving recommendations
**Expression Flow:** Thinking → Explaining → Happy

**Darwin's Expression:**
- Clear, teaching expression
- Hand gestures possible
- Engagement and clarity
- Positive energy

**Goal:** Make guidance clear and encouraging

### Phase 5: DECISION
**User:** Making choice or taking action
**Expression Flow:** Explaining → Success

**Darwin's Expression:**
- Confident affirmation
- Celebratory warmth
- Professional pride
- Genuine smile

**Goal:** Affirm user's positive choice

### Phase 6: ESCALATION (if needed)
**User:** Needs professional referral
**Expression Flow:** Professional → Serious → Goodbye

**Darwin's Expression:**
- Professional confidence
- Serious but reassuring
- Smooth handoff expression
- Warmth despite escalation

**Goal:** Transition user with confidence

---

## V. EXPRESSION BY EMOTIONAL CONTEXT

### USER IS HAPPY/POSITIVE
**Trigger Words:** Excelente, perfecto, increíble, gracias
**Darwin Response Expression:** Happy/Success
**Duration:** Maintain 2-3 seconds
**Gesture:** Celebratory possible
**Message:** Share the joy

### USER IS CONFUSED
**Trigger Words:** No entiendo, ¿cómo?, confuso, perdido
**Darwin Response Expression:** Explaining
**Duration:** Throughout clarification
**Gesture:** Teaching gestures
**Message:** Clarity and simplicity

### USER IS WORRIED/ANXIOUS
**Trigger Words:** Preocupado, asustado, tengo miedo, problema
**Darwin Response Expression:** Empathetic/Serious
**Duration:** Throughout reassurance
**Gesture:** Reassuring body language
**Message:** "You're not alone"

### USER IS ANGRY/FRUSTRATED
**Trigger Words:** Molesto, furioso, incompetente, inaceptable
**Darwin Response Expression:** Serious/Professional
**Duration:** Maintain calmness
**Gesture:** Calm, composed
**Message:** Professional de-escalation

### USER IS URGENT/RUSHING
**Trigger Words:** Rápido, urgente, ahora, inmediato
**Darwin Response Expression:** Alert/Serious
**Duration:** Focused and quick
**Gesture:** Efficient, purposeful
**Message:** Escalate immediately if needed

---

## VI. EXPRESSION MAPPING TO AGENT TYPE

### Commercial Agent Expressions

**Greeting:** Warm, professional, open
**Listening:** Engaged, interested
**Thinking:** Professional, thoughtful
**Guidance:** Encouraging, clear
**Success:** Happy, genuine
**Escalation:** Serious, confident

### Support Agent Expressions

**Greeting:** Welcoming, calm
**Listening:** Patient, attentive
**Thinking:** Concentrated, focused
**Guidance:** Clear, step-by-step
**Success:** Satisfied, helping
**Escalation:** Serious, urgent

### Client Agent Expressions

**Greeting:** Warm, familiar (returning client)
**Listening:** Deeply attentive
**Thinking:** Concerned, focused
**Guidance:** Professional, knowledgeable
**Success:** Affirming, supportive
**Escalation:** Serious, connecting

### Lawyer Agent Expressions

**Greeting:** Professional, welcoming
**Listening:** Interested, evaluative
**Thinking:** Analytical, focused
**Guidance:** Educational, clear
**Success:** Confident, affirming
**Escalation:** Professional, connecting

### Firm Agent Expressions

**Greeting:** Professional, warm
**Listening:** Business-focused, attentive
**Thinking:** Strategic, concentrated
**Guidance:** Insightful, clear
**Success:** Confident, professional
**Escalation:** Serious, decisive

---

## VII. EXPRESSION ANIMATION SPECIFICATIONS

### Animation Components

**Micro-expressions (50-200ms):**
- Eyebrow raise/lower
- Eye widening/narrowing
- Mouth corner movement
- Nostril flare

**Standard Expressions (200-500ms):**
- Full smile arrival
- Expression transition
- Eye contact shift
- Head position change

**Extended Expressions (500-2000ms):**
- Thinking state
- Processing pause
- Narrative expressions
- Sustained emotional display

### Animation Quality Standards

**Smoothness:** Bezier easing, never linear
**Naturalness:** Human-like timing, no robotic
**Believability:** Microexpressions included
**Clarity:** Expression clearly communicates intent
**Consistency:** Same expressions feel consistent
**Accessibility:** Understandable even on small screens

### Prohibited Animation Types

❌ Extreme exaggerations
❌ Cartoonish movements
❌ Jerky or robotic transitions
❌ Meaningless fidgeting
❌ Disrespectful expressions
❌ Age-inappropriate styles

---

## VIII. EXPRESSION BY CHANNEL

### WhatsApp Expression

**Constraints:**
- Small avatar size possible
- Limited to essential expressions
- Clear, readable emotions
- Professional throughout

**Key Expressions:**
- Greeting (welcoming)
- Listening (attentive)
- Thinking (processing)
- Success (affirming)
- Goodbye (professional)

### Landing Page Expression

**Constraints:**
- Avatar may be widget-sized
- First impression critical
- Professional and trustworthy
- Welcoming but not aggressive

**Key Expressions:**
- Idle (professional, ready)
- Greeting (warm, inviting)
- Listening (engaged)
- Success (affirming)

### Dashboard Expression

**Constraints:**
- Avatar integrated into UI
- Professional context
- Contextual to user's task
- Supporting not dominating

**Key Expressions:**
- Idle (professional, available)
- Listening (focused)
- Explaining (helpful)
- Success (affirming)

### Mobile App Expression

**Constraints:**
- Full expressiveness possible
- Large avatar rendering
- All expressions available
- Rich interaction support

**Key Expressions:**
- All 13 expressions fully
- Rich transitions
- Detailed microexpressions
- Full animation suite

---

## IX. EXPRESSION CONSISTENCY TEST

For any new expression, verify:

✓ **Appropriate:** Matches context and moment
✓ **Professional:** Maintains professional standards
✓ **Readable:** Clear at all sizes
✓ **Consistent:** Matches Darwin's established style
✓ **Respectful:** Never mocking or disrespectful
✓ **Scalable:** Works across all channels
✓ **Authentic:** Feels genuine, not forced
✓ **Accessible:** Understandable to all users

If all are true, the expression is valid.

---

## X. EXPRESSION GUIDELINES

### DO

✅ Transition smoothly between expressions
✅ Match expression to conversation context
✅ Use microexpressions for authenticity
✅ Maintain professional standards
✅ Show genuine emotion
✅ Adapt to user's emotional state
✅ Use expressions to reinforce message
✅ Respect cultural expression norms

### DON'T

❌ Use cartoonish expressions
❌ Show disrespect through expression
❌ Exaggerate emotions
❌ Use culture-inappropriate expressions
❌ Jump between expressions randomly
❌ Show confusion through expression
❌ Express doubt or hesitation
❌ Maintain single expression throughout

---

## XI. FUTURE ENHANCEMENTS

### Planned (Not in Phase Ω.1)

**Phase 1 (Current):**
- 13-state expression system
- Standard animations
- Channel-specific adaptations

**Phase 2 (Future):**
- Eye tracking (user responsive)
- Voice-emotion matching
- Real-time sentiment response
- Advanced microexpressions

**Phase 3 (Future):**
- Machine learning response
- Adaptive expression timing
- Cultural expression variants
- Emotional intelligence layer

---

## XII. IMPLEMENTATION NOTES

This document is **architecture only**. Implementation will follow in future phases.

**Current Phase:** Design and specification
**Next Phase:** Avatar rendering system
**Future Phase:** Expression engine implementation

---

## CONCLUSION

Darwin's Expression System transforms a static avatar into a living, responsive presence. Through carefully designed expressions, Darwin communicates emotion, understanding, and professionalism without words.

This system makes Darwin human-like while remaining distinctly professional and trustworthy.

---

**DARWIN EXPRESSION SYSTEM**  
**Version 1.0 — Architecture Specification**  
**Status: Ready for Implementation**
