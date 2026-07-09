# DARWIN AVATAR ARCHITECTURE

**Version:** 1.0  
**Purpose:** Technical architecture for Darwin avatar across all channels  
**Status:** Specification (Ready for Implementation)

---

## I. OVERVIEW

Darwin's avatar must be consistently rendered across 8+ channels while adapting to each channel's constraints and opportunities.

This architecture ensures:
- ✅ Consistent identity
- ✅ Channel optimization
- ✅ Technical flexibility
- ✅ Performance efficiency
- ✅ Future scalability

---

## II. ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│        DARWIN AVATAR ASSET LIBRARY                      │
│  (SVG/PNG/WebP formats, multiple resolutions)           │
│                                                          │
│  ├─ darwin_base.{svg,png}                              │
│  ├─ darwin_idle.{svg,png}                              │
│  ├─ darwin_typing.{svg,png}                            │
│  ├─ darwin_listening.{svg,png}                         │
│  ├─ darwin_thinking.{svg,png}                          │
│  ├─ darwin_happy.{svg,png}                             │
│  ├─ darwin_success.{svg,png}                           │
│  ├─ darwin_warning.{svg,png}                           │
│  ├─ darwin_serious.{svg,png}                           │
│  ├─ darwin_speaking.{svg,png}                          │
│  ├─ darwin_explaining.{svg,png}                        │
│  ├─ darwin_greeting.{svg,png}                          │
│  └─ darwin_goodbye.{svg,png}                           │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│    DARWIN AVATAR RENDERING ENGINE (Frontend)            │
│                                                          │
│  ├─ AvatarComponent (base)                             │
│  ├─ ExpressionController                               │
│  ├─ StateManager                                        │
│  ├─ AnimationEngine                                     │
│  └─ ResponsiveRenderer                                 │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│         CHANNEL-SPECIFIC IMPLEMENTATIONS                │
│                                                          │
│  ├─ WhatsApp (Web & Desktop)                           │
│  ├─ Landing Page                                        │
│  ├─ Dashboard                                           │
│  ├─ CRM                                                 │
│  ├─ Mobile App (iOS/Android)                           │
│  ├─ Client Portal                                       │
│  ├─ Lawyer Portal                                       │
│  ├─ Firm Portal                                         │
│  └─ Admin Portal                                        │
└─────────────────────────────────────────────────────────┘
```

---

## III. ASSET LIBRARY SPECIFICATIONS

### Asset Organization

```
assets/
  avatars/
    darwin/
      ├── base/
      │   ├── darwin_base_32.png        (32x40px)
      │   ├── darwin_base_64.png        (64x80px)
      │   ├── darwin_base_128.png       (128x160px)
      │   ├── darwin_base_256.png       (256x320px)
      │   └── darwin_base.svg           (scalable)
      │
      ├── states/
      │   ├── darwin_idle/              (all sizes)
      │   ├── darwin_greeting/          (all sizes)
      │   ├── darwin_listening/         (all sizes)
      │   ├── darwin_thinking/          (all sizes)
      │   ├── darwin_typing/            (all sizes)
      │   ├── darwin_happy/             (all sizes)
      │   ├── darwin_success/           (all sizes)
      │   ├── darwin_warning/           (all sizes)
      │   ├── darwin_serious/           (all sizes)
      │   ├── darwin_speaking/          (all sizes)
      │   ├── darwin_explaining/        (all sizes)
      │   └── darwin_goodbye/           (all sizes)
      │
      └── animations/
          ├── greeting_animation.webm
          ├── thinking_animation.webm
          ├── typing_animation.webm
          ├── success_animation.webm
          └── transition_animations.webm
```

### Asset Specifications

**SVG Assets (Preferred):**
- Scalable to any size
- Small file size
- High quality at all resolutions
- CSS animation support
- Lightweight

**PNG Assets (Fallback):**
- 32, 64, 128, 256px sizes minimum
- WebP format for modern browsers
- PNG fallback for older browsers
- Optimized for compression
- Clear at all sizes

**Animation Assets:**
- WebM format (VP9 codec)
- MP4 fallback
- Optimized for web
- 30fps or 60fps
- Loop-capable

### File Size Targets

| Asset Type | Target Size | Note |
|------------|------------|------|
| SVG Base | <20KB | Single source |
| PNG 256px | <50KB | Highest res |
| Animation | <200KB | Optimized |
| Total Suite | <500KB | All assets |

---

## IV. CORE AVATAR COMPONENT

### Component API

```javascript
class DarwinAvatar {
  constructor(options = {})
  
  // State management
  setState(state: string)
  getState(): string
  
  // Expression control
  setExpression(expression: string)
  getExpression(): string
  
  // Animation control
  playAnimation(name: string, duration?: number)
  stopAnimation()
  
  // Rendering
  render(container: HTMLElement, size: 'small' | 'medium' | 'large')
  dispose()
  
  // Events
  on(event: string, callback: Function)
  off(event: string, callback: Function)
  
  // Configuration
  setConfig(config: AvatarConfig)
  getConfig(): AvatarConfig
}
```

### Component Properties

```javascript
{
  // Display
  width: number,
  height: number,
  scale: number,
  
  // State
  currentState: string,
  currentExpression: string,
  
  // Animation
  animationSpeed: float (0.5 - 2.0),
  transitionDuration: number (ms),
  
  // Appearance
  theme: 'default' | 'light' | 'dark',
  colorScheme: { [key]: color },
  
  // Behavior
  interactive: boolean,
  responsive: boolean,
  autoDetectSize: boolean,
  
  // Context
  vertical: string,
  channel: string,
}
```

---

## V. CHANNEL-SPECIFIC IMPLEMENTATIONS

### 1. WhatsApp (Web & Desktop)

**Constraints:**
- Avatar may be hidden on mobile
- Widget-sized on desktop
- Limited animation space
- Fast load required

**Implementation:**
```
Platform: WhatsApp Web
Avatar Size: 64x80px (widget)
Container: 100x120px bubble
Format: WebP (PNG fallback)
Animation: None (static)
Update: Instant state changes
Cache: 24-hour browser cache
```

**Features:**
- Greeting on initial contact
- State change on messages
- Goodbye on escalation
- Professional appearance

### 2. Landing Page

**Constraints:**
- Hero or sidebar placement
- Must not dominate
- Professional appearance
- Fast page load

**Implementation:**
```
Platform: Web (React/Vue)
Avatar Size: 128x160px or 256x320px
Container: Sidebar or widget
Format: SVG (responsive)
Animation: Welcome animation on load
Update: State changes per interaction
Cache: CDN cached
```

**Features:**
- Welcome animation on page load
- Responsive sizing
- Click-to-chat functionality
- Professional branding

### 3. Dashboard

**Constraints:**
- Integrated into UI
- Supporting role
- Professional context
- Performance critical

**Implementation:**
```
Platform: Web (React)
Avatar Size: 64x80px or 128x160px
Container: Widget or sidebar
Format: SVG (reactive)
Animation: Smooth transitions
Update: Real-time state changes
Cache: Component-level caching
```

**Features:**
- Contextual assistance
- State responsiveness
- Integrated controls
- Dashboard-consistent styling

### 4. CRM

**Constraints:**
- Operational focus
- Professional setting
- Firm context
- Performance critical

**Implementation:**
```
Platform: Web (custom framework)
Avatar Size: 48x60px or 64x80px
Container: Compact widget
Format: SVG + CSS
Animation: Minimal
Update: Context-driven
Cache: Aggressive caching
```

**Features:**
- Firm user assistance
- Client context display
- Operational guidance
- Compact professional appearance

### 5. Mobile App (iOS/Android)

**Constraints:**
- Full feature support
- Touch optimization
- Battery efficiency
- Offline capability

**Implementation:**
```
Platform: React Native / Flutter
Avatar Size: Full-featured (256x320px+)
Container: Full screen possible
Format: Native image handling
Animation: Full suite
Update: Real-time
Cache: Device storage
```

**Features:**
- Full expression suite
- Gesture support
- Responsive design
- Offline conversations

### 6. Client Portal

**Constraints:**
- Professional context
- Case/matter related
- Service support
- Responsive design

**Implementation:**
```
Platform: Web (custom)
Avatar Size: 128x160px
Container: Integrated widget
Format: SVG + CSS
Animation: Smooth transitions
Update: Real-time
Cache: CDN cached
```

**Features:**
- Case-specific guidance
- Status updates
- Professional support
- Portal-consistent styling

### 7. Lawyer Portal

**Constraints:**
- Professional context
- Operational focus
- Business context
- Performance critical

**Implementation:**
```
Platform: Web (custom)
Avatar Size: 64x80px or 128x160px
Container: Compact widget
Format: SVG
Animation: Minimal, functional
Update: Context-driven
Cache: Aggressive
```

**Features:**
- Operational assistance
- Client context
- Case guidance
- Professional appearance

### 8. Admin Portal

**Constraints:**
- System context
- Operational
- Firm management
- Performance critical

**Implementation:**
```
Platform: Web (custom)
Avatar Size: 48x60px (compact)
Container: Minimal widget
Format: SVG + CSS
Animation: None
Update: Operational
Cache: Aggressive
```

**Features:**
- System notifications
- Administrative guidance
- Operational support
- Minimal presence

---

## VI. RENDERING STRATEGY

### Progressive Enhancement

**Step 1: HTML/CSS**
- Placeholder div with Darwin styling
- Accessible structure
- Works without JavaScript

**Step 2: SVG Assets**
- Enhanced with SVG avatar
- CSS-based animations
- Works with CSS support

**Step 3: JavaScript Animation**
- Advanced transitions
- State management
- Full interactivity

**Step 4: WebGL (Future)**
- High-performance rendering
- Complex animations
- Advanced features

### Responsive Sizing

```javascript
const SIZES = {
  tiny: { width: 32, height: 40, scale: 0.8 },
  small: { width: 64, height: 80, scale: 0.9 },
  medium: { width: 128, height: 160, scale: 1.0 },
  large: { width: 256, height: 320, scale: 1.2 },
  hero: { width: 512, height: 640, scale: 1.5 },
}

function getOptimalSize(containerWidth) {
  if (containerWidth < 100) return SIZES.small
  if (containerWidth < 200) return SIZES.medium
  if (containerWidth < 400) return SIZES.large
  return SIZES.hero
}
```

---

## VII. STATE MANAGEMENT

### State Machine

```
┌──────────┐
│  IDLE    │───────┐
└────┬─────┘       │
     │             │
     ▼             ▼
┌──────────┐   ┌──────────┐
│GREETING  │   │LISTENING │
└────┬─────┘   └────┬─────┘
     │             │
     └─────┬───────┘
           ▼
      ┌──────────┐
      │THINKING  │
      └────┬─────┘
           ▼
      ┌──────────┐
      │EXPLAINING│
      └────┬─────┘
           │
     ┌─────┼─────┐
     ▼     ▼     ▼
  HAPPY SUCCESS WARNING
```

### State Transition Logic

```javascript
class StateManager {
  allowedTransitions = {
    'idle': ['greeting', 'listening'],
    'greeting': ['listening', 'idle'],
    'listening': ['thinking', 'understanding', 'idle'],
    'thinking': ['explaining', 'serious', 'happy'],
    'explaining': ['listening', 'success', 'warning'],
    'happy': ['idle', 'listening', 'goodbye'],
    'success': ['idle', 'listening'],
    'warning': ['serious', 'goodbye'],
    'serious': ['warning', 'explaining', 'goodbye'],
    'goodbye': ['idle'],
  }
  
  canTransition(from, to) {
    return this.allowedTransitions[from]?.includes(to) || false
  }
}
```

---

## VIII. PERFORMANCE OPTIMIZATION

### Load Optimization

**Critical:**
- Base avatar (SVG): Inline or async
- Default state: Essential
- Landing only: Lazy load

**Non-Critical:**
- Additional states: Preload after main
- Animations: Load on demand
- Portal-specific: Conditional load

### Rendering Optimization

```javascript
// Use CSS transforms (hardware accelerated)
avatar.style.transform = `scale(${scale})`

// Batch DOM updates
requestAnimationFrame(() => {
  avatar.setState(newState)
  avatar.setExpression(newExpression)
})

// Debounce state changes
const debouncedSetState = debounce(setState, 100)
```

### Caching Strategy

| Asset | Cache Duration | Strategy |
|-------|---|---|
| SVG Assets | 30 days | CDN + Browser |
| State Images | 7 days | Browser |
| Animations | 7 days | Browser |
| Config | 1 day | LocalStorage |

---

## IX. API INTEGRATION

### Backend Communication

```javascript
// Get avatar state for context
GET /api/avatar/state/{conversation_id}
Response: {
  state: "listening",
  expression: "understanding",
  animation: null
}

// Update avatar state
POST /api/avatar/state/{conversation_id}
Body: {
  state: "thinking",
  expression: "focused",
  animation: "thinking"
}

// Get avatar assets
GET /api/avatar/assets/{version}
Response: {
  assets: [
    { name: "darwin_base", url: "/assets/avatars/darwin/..." },
    // ...
  ]
}
```

---

## X. ACCESSIBILITY SPECIFICATIONS

### WCAG 2.1 AA Compliance

**Images:**
- Alt text for static states
- Description for animations
- Meaningful semantics

**Animations:**
- `prefers-reduced-motion` support
- Pause/resume controls
- Safe animation timing

**Colors:**
- WCAG AA contrast ratio
- Not color-dependent
- Clear differentiation

### Implementation

```html
<div 
  role="img" 
  aria-label="Darwin avatar - currently thinking"
  aria-busy="true"
>
  <svg class="darwin-avatar" ... />
</div>

<!-- Respect user motion preferences -->
@media (prefers-reduced-motion: reduce) {
  .darwin-avatar {
    animation: none;
  }
}
```

---

## XI. FUTURE ENHANCEMENTS

### Phase 2 (Planned)
- Eye tracking / responsive to user
- Voice integration
- Advanced gesture recognition
- Real-time sentiment response

### Phase 3 (Planned)
- Machine learning expressions
- Adaptive animations
- Cultural expression variants
- Emotional intelligence

---

## XII. TESTING SPECIFICATIONS

### Unit Tests
- Component initialization
- State transitions
- Expression changes
- Event handling

### Integration Tests
- Multi-channel rendering
- State persistence
- Animation playback
- Performance benchmarks

### E2E Tests
- User interactions
- Real-world flows
- Cross-device testing
- Performance under load

---

## CONCLUSION

Darwin's Avatar Architecture provides a scalable, performant, and consistent presence across all Punto Cero channels.

The architecture ensures:
- ✅ Technical flexibility
- ✅ Performance optimization
- ✅ Accessibility compliance
- ✅ Future scalability

Ready for implementation.

---

**DARWIN AVATAR ARCHITECTURE**  
**Version 1.0 — Technical Specification**  
**Status: Ready for Implementation**
