# DARWIN DESIGN GUIDELINES

**Version:** 1.0  
**Purpose:** Visual and design standards for Darwin across all contexts  
**Status:** Official Guidelines  

---

## I. DESIGN PHILOSOPHY

### Core Principle

**Darwin's design is simple, professional, and human.**

Not:
- ❌ Cluttered or distracting
- ❌ Cutesy or cartoonish
- ❌ Futuristic or tech-heavy
- ❌ Corporate and cold
- ❌ Overly minimal or sterile

Yes:
- ✅ Clean and professional
- ✅ Warm and approachable
- ✅ Human and authentic
- ✅ Trustworthy and competent
- ✅ Modern and relevant

---

## II. COLOR SYSTEM

### Primary Brand Colors

```
DARWIN PROFESSIONAL BLUE
Hex: #1E3A5F | RGB: (30, 58, 95)
Usage: Primary avatar, authority, trust
Accessibility: WCAG AAA contrast-compliant
```

```
DARWIN WARM WHITE
Hex: #F8F7F4 | RGB: (248, 247, 244)
Usage: Avatar clothing, backgrounds, clarity
Accessibility: High contrast for readability
```

```
DARWIN ACCENT GOLD
Hex: #D4AF37 | RGB: (212, 175, 55)
Usage: Highlights, special moments, value
Accessibility: Use with sufficient contrast
```

### Accent Colors

```
SUCCESS (Green)
Hex: #10B981 | RGB: (16, 185, 129)
Usage: Success states, positive confirmations
Meaning: Growth, achievement, positive action

ALERT (Orange)
Hex: #F59E0B | RGB: (245, 158, 11)
Usage: Attention needed, caution
Meaning: Important, requires awareness

URGENT (Red)
Hex: #EF4444 | RGB: (239, 68, 68)
Usage: Critical issues, escalation
Meaning: Urgent, requires immediate action
```

### Color Usage Rules

**DO:**
- ✅ Use blue for professionalism
- ✅ Use white for clarity
- ✅ Use gold for special moments
- ✅ Use green for success
- ✅ Use orange for attention
- ✅ Use red for urgency only
- ✅ Maintain WCAG AA contrast minimum
- ✅ Ensure colorblind accessibility

**DON'T:**
- ❌ Add unnecessary colors
- ❌ Use bright, neon colors
- ❌ Create low-contrast combinations
- ❌ Use color alone to communicate
- ❌ Apply colors inconsistently
- ❌ Use colors as decoration

---

## III. TYPOGRAPHY

### Font Family

**Primary:** Open Sans (or equivalent professional sans-serif)
- Clean, modern, professional
- Highly readable at all sizes
- Good web performance
- Accessible (WCAG compliant)

**Fallback Stack:**
```css
font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 
             'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
```

### Type Scale

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| Display | 32-48px | Bold (700) | Darwin's name |
| Heading | 20-28px | Semi-Bold (600) | Main messages |
| Body | 14-16px | Regular (400) | Conversation |
| Caption | 12-14px | Regular (400) | Meta info |
| Small | 11-12px | Regular (400) | Timestamps |

### Line Height

| Context | Line Height | Usage |
|---------|-------------|-------|
| Display | 1.2 | Headings |
| Heading | 1.4 | Subheadings |
| Body | 1.6 | Main text |
| Caption | 1.5 | Small text |

### Text Styles

**Emphasis:** Bold (NOT italic)
- Use `<strong>` or font-weight: 600
- More readable than italics
- Better for web

**Links:** Color + underline
- Never rely on color alone
- Always underline for clarity
- Understandable to all

**Quotes:** Use quotation marks
- Never use color alone
- Include speaker attribution
- Professional context

---

## IV. SPACING & LAYOUT

### Spacing Scale

```
4px  = base unit
8px  = 2x base
12px = 3x base
16px = 4x base
24px = 6x base
32px = 8x base
48px = 12x base
64px = 16x base
```

### Layout Principles

**Breathing Room:**
- Allow space around Darwin
- Don't crowd the avatar
- White space is professional
- Supports focus and clarity

**Alignment:**
- Center Darwin in widget
- Align with grid system
- Consistent across channels
- Professional appearance

**Proportions:**
- Avatar width:height = 4:5 ratio
- Maintains proper proportions
- Works at all sizes
- Professional appearance

---

## V. BUTTON & INTERACTION STYLES

### Chat Button Style

**Primary Button:**
- Color: Darwin Professional Blue (#1E3A5F)
- Text: White or light color
- Hover: Slightly darker shade
- Active: Slightly darker shade
- Text: "Chat with Darwin" or "Habla con Darwin"

**Example:**
```css
.darwin-button {
  background-color: #1E3A5F;
  color: #F8F7F4;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 200ms ease;
}

.darwin-button:hover {
  background-color: #142942;
}
```

### Interactive States

**Hover:**
- Color darkens slightly
- Cursor changes to pointer
- Subtle transition (200ms)
- Clear affordance

**Active:**
- Color darkens more
- Depressed appearance optional
- Immediate feedback
- Confirms interaction

**Disabled:**
- Color becomes muted
- Opacity: 50%
- Cursor not-allowed
- Grayed out appearance

---

## VI. MESSAGE STYLING

### Chat Bubble Style

**Darwin Messages:**
- Background: Light gray or slightly tinted
- Text: Dark for readability
- Rounded corners: 12-16px
- Padding: 12-16px
- Alignment: Left (typical for assistant)

**User Messages:**
- Background: Darwin Professional Blue
- Text: White or light color
- Rounded corners: 12-16px
- Padding: 12-16px
- Alignment: Right

**Example:**
```css
.message-darwin {
  background-color: #F0F0F0;
  color: #1E3A5F;
  border-radius: 16px;
  padding: 12px 16px;
  max-width: 80%;
  margin: 8px 0;
}

.message-user {
  background-color: #1E3A5F;
  color: #F8F7F4;
  border-radius: 16px;
  padding: 12px 16px;
  max-width: 80%;
  margin: 8px 0;
  align-self: flex-end;
}
```

---

## VII. AVATAR SIZING & PLACEMENT

### Size Categories

| Category | Width x Height | Usage |
|----------|---|---|
| Tiny | 32x40px | Toolbar, status |
| Small | 64x80px | Widget, floating |
| Medium | 128x160px | Chat, dashboard |
| Large | 256x320px | Dashboard widget |
| Hero | 512x640px+ | Landing, hero |

### Placement Rules

**Landing Page:**
- Sidebar or hero section
- Not dominating center
- Professional positioning
- Clear call-to-action nearby

**Dashboard:**
- Right sidebar or widget
- Supporting role
- Integrated with UI
- Professional appearance

**Chat Widget:**
- Center or slightly left
- Adequate spacing
- Clear conversation flow
- Focus on chat area

**Mobile:**
- Top or center positioning
- Full width available
- Touch-friendly size
- Responsive scaling

---

## VIII. RESPONSIVE DESIGN

### Breakpoints

```css
/* Mobile */
@media (max-width: 480px) {
  .darwin-avatar { width: 64px; height: 80px; }
}

/* Tablet */
@media (min-width: 481px) and (max-width: 768px) {
  .darwin-avatar { width: 128px; height: 160px; }
}

/* Desktop */
@media (min-width: 769px) {
  .darwin-avatar { width: 256px; height: 320px; }
}

/* Large desktop */
@media (min-width: 1200px) {
  .darwin-avatar { width: 256px; height: 320px; }
}
```

### Mobile Optimization

**Do:**
- ✅ Scale appropriately for screen
- ✅ Touch-friendly sizing
- ✅ Readable text
- ✅ Quick load times
- ✅ Battery efficient

**Don't:**
- ❌ Oversized avatar
- ❌ Cluttered interface
- ❌ Poor scaling
- ❌ Heavy animations
- ❌ Battery drain

---

## IX. ANIMATION STANDARDS

### Animation Timing

| Animation | Duration | Easing | Use |
|-----------|---|---|---|
| Micro | 150-200ms | ease-out | State changes |
| Standard | 300-400ms | ease-in-out | Transitions |
| Extended | 500-800ms | ease-in-out | Thinking state |

### Animation Types

**Fade:**
- Opacity change: 0 to 1 or reverse
- Use: Expression changes
- Duration: 300-400ms

**Slide:**
- Position change: smooth movement
- Use: Entrance/exit
- Duration: 300-500ms

**Scale:**
- Size change: smooth grow/shrink
- Use: Emphasis
- Duration: 300-400ms

**Pulse:**
- Subtle breathing effect
- Use: Active state
- Duration: 1-2 second loop

### Animation Rules

**DO:**
- ✅ Use hardware-accelerated transforms
- ✅ Keep animations under 1 second (usually)
- ✅ Respect `prefers-reduced-motion`
- ✅ Test on real devices
- ✅ Optimize for performance

**DON'T:**
- ❌ Animate for decoration
- ❌ Use overly complex animations
- ❌ Ignore motion preferences
- ❌ Cause layout shifts
- ❌ Battery drain

---

## X. ACCESSIBILITY STANDARDS

### WCAG 2.1 AA Compliance

**Color Contrast:**
- Text vs background: 4.5:1 minimum
- Large text: 3:1 minimum
- Icons: Sufficient contrast
- Colorblind accessible

**Text:**
- Minimum 12px (14px preferred)
- Line height: 1.5 minimum
- Good spacing
- No blocks of all-caps

**Interactions:**
- Touch targets: 44x44px minimum
- Keyboard accessible
- Focus visible (outline)
- Labels for form fields

**Motion:**
- Respect `prefers-reduced-motion`
- No auto-playing animations
- Pause/play controls
- Safe animation timing

### Implementation

```html
<!-- Image accessibility -->
<img src="darwin.svg" 
     alt="Darwin avatar - listening state"
     role="img" />

<!-- Animation accessibility -->
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}

<!-- Focus visibility -->
.darwin-button:focus {
  outline: 2px solid #1E3A5F;
  outline-offset: 2px;
}
```

---

## XI. DARK MODE SUPPORT

### Color Adaptation

**Light Mode (Default):**
- Darwin Professional Blue: #1E3A5F
- Warm White: #F8F7F4
- Background: White or light gray
- Text: Dark gray or black

**Dark Mode:**
- Darwin Professional Blue: #2E5FA0 (lighter)
- Warm White: #E8E7E4 (slightly darker)
- Background: Dark gray or charcoal
- Text: Light gray or white

### Implementation

```css
@media (prefers-color-scheme: dark) {
  .darwin-avatar {
    background-color: #1A1A1A;
    color: #E8E7E4;
  }
  
  .darwin-button {
    background-color: #2E5FA0;
  }
}
```

---

## XII. DO'S AND DON'TS

### DO ✅

- Use professional colors
- Maintain consistent spacing
- Respect user preferences
- Optimize for performance
- Test across devices
- Follow accessibility standards
- Use simple, clean design
- Keep text readable
- Maintain brand consistency
- Respect animation guidelines

### DON'T ❌

- Use cutesy or cartoonish styles
- Add unnecessary effects
- Ignore accessibility
- Overcomplicate design
- Use distracting colors
- Violate spacing guidelines
- Add unauthorized elements
- Ignore responsive design
- Over-animate
- Break from brand identity

---

## XIII. BRAND CONSISTENCY CHECKLIST

Before any Darwin implementation, verify:

✓ Colors match official palette
✓ Typography uses Open Sans
✓ Spacing follows grid system
✓ Avatar proportions are correct
✓ Responsive sizing is correct
✓ Animations follow standards
✓ Accessibility meets WCAG AA
✓ Dark mode works correctly
✓ Mobile experience is optimized
✓ Brand identity is preserved

---

## XIV. FUTURE VARIANTS

### Vertical-Specific Styling (Future)

Darwin's core design remains consistent. Channels may adapt styling to context:

**Legal Vertical:**
- Professional, trustworthy appearance
- Authoritative but accessible

**Health Vertical:**
- Professional, caring appearance
- Calm, reassuring presence

**Education Vertical:**
- Professional, knowledgeable appearance
- Encouraging, supportive

**Accounting Vertical:**
- Professional, competent appearance
- Clear, organized presentation

All variants maintain Darwin's core brand identity.

---

## CONCLUSION

These guidelines ensure Darwin is consistently presented as a professional, trustworthy, and human advisor across all contexts and channels.

Adherence to these guidelines preserves Darwin's institutional identity and ensures a cohesive experience for all users.

---

**DARWIN DESIGN GUIDELINES**  
**Version 1.0 — Official Standards**  
**Status: EFFECTIVE IMMEDIATELY**
