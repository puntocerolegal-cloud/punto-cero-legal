# 🎨 FIRM OS — ENTERPRISE DESIGN SYSTEM v1.0
## Lead Product Designer Specification

**Status**: SPECIFICATION COMPLETE  
**Version**: 1.0  
**Date**: January 2025  
**Target**: Enterprise Premium Visual Experience

---

## EXECUTIVE VISION

Firm OS should feel like **professional enterprise software**: calm, confident, operational, and intentional. Every visual decision should reinforce trust and clarity, not distract from the work.

The design system unifies:
- One coherent visual language (no fragmentation)
- Accessible, keyboard-friendly interactions
- Responsive enterprise-grade layouts
- Clear operational status and feedback
- Subtle motion (not distracting)
- Token-based theming (not hardcoded colors)

---

## PART 1: COLOR SYSTEM

### Core Palette (Light Mode Variants)

#### Surfaces
```
surface-app         #0F172A   (darkest, app shell)
surface-panel       #111827   (container background)
surface-card        #1F2937   (raised card)
surface-muted       #334155   (subtle accent)
surface-inset       #0B1120   (sunken text input)
surface-overlay     rgba(15, 23, 42, 0.95) (modals, drawers)
```

#### Text
```
text-primary        #F8FAFC   (headlines, primary text)
text-secondary      #CBD5E1   (body text, descriptions)
text-muted          #94A3B8   (hints, meta, timestamps)
text-inverse        #0F172A   (on light backgrounds)
text-disabled       #64748B   (disabled states)
```

#### Interactive & Status
```
brand               #3B82F6   (primary action, active state)
brand-hover         #2563EB   (hover state)
brand-active        #1D4ED8   (pressed state)
brand-light         #DBEAFE   (light background)

success             #10B981   (confirmation, positive)
success-hover       #059669   (hover)
success-light       #D1FAE5   (background)

warning             #F59E0B   (caution, in-progress)
warning-hover       #D97706   (hover)
warning-light       #FEF3C7   (background)

danger              #EF4444   (error, destructive)
danger-hover        #DC2626   (hover)
danger-light        #FEE2E2   (background)

info                #06B6D4   (informational)
info-hover          #0891B2   (hover)
info-light          #CFFAFE   (background)
```

#### Borders & Dividers
```
border-subtle       rgba(255, 255, 255, 0.08)  (subtle divides)
border-strong       rgba(255, 255, 255, 0.16)  (card borders, section divides)
border-focus        #3B82F6                     (focus ring)
```

---

## PART 2: TYPOGRAPHY SYSTEM

### Scale & Usage

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|------------|-------|
| **Display** | 40px | 600 | 48px | Rare hero sections |
| **H1** | 32px | 700 | 40px | Page titles (e.g., "Mission Control") |
| **H2** | 24px | 600 | 32px | Section headers (e.g., "Executive Summary") |
| **H3** | 20px | 600 | 28px | Card titles, subsection headers |
| **H4** | 18px | 600 | 26px | Form labels, metric labels |
| **Body** | 16px | 400 | 24px | Primary content text |
| **Body-Small** | 14px | 400 | 20px | Secondary content, descriptions |
| **Label** | 12px | 600 | 16px | Form labels, badges, status text |
| **Caption** | 11px | 500 | 14px | Hints, timestamps, tertiary info |

### Special Patterns

**Uppercase Labels**
- Use only for:
  - Form field labels (optional)
  - Status badges (e.g., "ACTIVE", "PENDING")
  - Dashboard KPI labels (e.g., "EXECUTION RATE")
- Tracking: 0.05em (Tailwind `tracking-wide`)
- Color: `text-muted` (never pure white for uppercase)

**Links & Actions**
- Color: `brand` (#3B82F6)
- Underline: only on hover
- Weight: regular (inherit from context)

---

## PART 3: SPACING & LAYOUT

### Spacing Scale
```
4px    - Icon spacing, tight chip padding
8px    - Form input/select padding, small gaps
12px   - Card internals, tight section spacing
16px   - Default component padding, section headings
24px   - Section spacing, dialog padding
32px   - Page section separation, large gap
```

### Common Patterns

**Card Internals**
```
.card {
  padding: 16px;      // default
}
.card.dense {
  padding: 12px;
}
.card.expanded {
  padding: 24px;
}
```

**Form Groups**
```
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;           // label + input
}

.form-section {
  margin-bottom: 24px;
}
```

**Grid Spacing**
```
.grid-tight {
  gap: 12px;         // KPI cards, metric grids
}
.grid-default {
  gap: 16px;         // Standard card grid
}
.grid-loose {
  gap: 24px;         // Narrative/section grid
}
```

---

## PART 4: BORDER RADIUS & SHADOWS

### Radius Scale
```
radius-sm     8px       Buttons, inputs, small components
radius-md     12px      Cards, standard containers
radius-lg     16px      Modals, large popovers
radius-xl     24px      Hero sections, full-height dialogs
```

**Usage Pattern**:
- Buttons/form inputs: `radius-sm` (8px)
- Cards/panels: `radius-md` (12px)
- Modals/overlays: `radius-lg` or `radius-xl` (16–24px)

### Shadow Scale
```
shadow-none       no shadow (flat design)

shadow-subtle     box-shadow: 0 1px 2px 0 rgba(0,0,0,0.1)
                  Use for: raised cards, subtle elevation

shadow-elevated   box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2)
                  Use for: dialogs, popovers, floating panels

shadow-floating   box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3)
                  Use for: modals, drawers, hover/active cards
```

**Dark mode note**: Use subtle shadows with lower blur on dark shells. Prefer `border-strong` for card separation instead of heavy shadows.

---

## PART 5: COMPONENT LIBRARY

### Button Variants

**Primary**
- Background: `brand` (#3B82F6)
- Hover: `brand-hover` (#2563EB)
- Active: `brand-active` (#1D4ED8)
- Text: `text-primary` (#F8FAFC)
- Padding: 12px 16px
- Radius: 8px
- Font: 14px / 600 weight

**Secondary**
- Background: `surface-card` (#1F2937)
- Border: `border-strong`
- Hover: `surface-muted` (#334155)
- Text: `text-primary`
- Padding: 12px 16px
- Radius: 8px

**Tertiary / Ghost**
- Background: transparent
- Border: `border-subtle`
- Hover: `surface-muted` (0.5 opacity)
- Text: `text-secondary`
- Padding: 12px 16px

**Destructive**
- Background: `danger` (#EF4444)
- Hover: `danger-hover` (#DC2626)
- Text: white
- Padding: 12px 16px

**Icon Button**
- Size: 40px × 40px (minimum touch target)
- Icon: 20px
- Radius: 8px
- Hover: `surface-muted` (10% opacity)

**Disabled State (all)**
- Opacity: 50%
- Cursor: not-allowed
- No hover state

---

### Card Variants

**Solid Card**
- Background: `surface-card` (#1F2937)
- Border: `border-subtle`
- Radius: 12px
- Shadow: `shadow-subtle`
- Padding: 16px

**Glass / Frosted Card**
- Background: `surface-card` with 0.8 opacity
- Backdrop: blur(8px)
- Border: `border-strong`
- Radius: 12px
- Shadow: none (border provides visual separation)
- Padding: 16px

**Outlined Card**
- Background: transparent
- Border: `border-strong` (2px)
- Radius: 12px
- Padding: 16px

**Interactive Card**
- Inherit from solid
- Hover: `surface-muted` (10% opacity)
- Cursor: pointer
- Focus: `border-focus` (3px, blue)

**Status Card**
- Background: corresponding status color light variant (warning-light, danger-light, etc.)
- Border: status color
- Radius: 12px
- Padding: 16px

---

### Form Controls

**Text Input**
- Background: `surface-inset` (#0B1120)
- Border: `border-subtle` (1px)
- Text: `text-primary`
- Padding: 12px 16px
- Radius: 8px
- Font: 14px
- Focus: `border-focus` (2px)
- Placeholder: `text-muted` (60% opacity)

**Select / Dropdown**
- Same as text input
- Arrow icon: 20px, `text-secondary`

**Checkbox / Radio**
- Size: 20px × 20px
- Border: `border-strong`
- Checked: `brand` background, white checkmark
- Focus: `border-focus` (2px outer ring)

**Toggle**
- Width: 44px, height: 24px
- Off: `surface-muted` background
- On: `brand` background
- Knob: 20px circle, white, transition 120ms

**Label**
- Font: 12px / 600 weight
- Color: `text-muted`
- Uppercase, tracking-wide
- Margin-bottom: 8px

---

### Badge Variants

**Neutral**
- Background: `surface-muted` (50% opacity)
- Text: `text-primary`
- Padding: 6px 12px
- Radius: 8px
- Font: 12px / 600 weight

**Success**
- Background: `success-light` (#D1FAE5)
- Text: `success` (#10B981)
- Padding: 6px 12px
- Radius: 8px

**Warning**
- Background: `warning-light` (#FEF3C7)
- Text: `warning` (#F59E0B)
- Padding: 6px 12px
- Radius: 8px

**Danger**
- Background: `danger-light` (#FEE2E2)
- Text: `danger` (#EF4444)
- Padding: 6px 12px
- Radius: 8px

**Info**
- Background: `info-light` (#CFFAFE)
- Text: `info` (#06B6D4)
- Padding: 6px 12px
- Radius: 8px

---

### State Components

**Loading - Skeleton**
```
.skeleton {
  background: linear-gradient(90deg, 
    surface-card 0%, 
    surface-muted 50%, 
    surface-card 100%);
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;
}
```

**Loading - Spinner**
- Icon: 24px, `text-secondary`
- Animation: rotate 1s linear infinite
- Color: `brand`

**Empty State**
- Icon: 64px, `text-muted`
- Heading: "No data yet" (H3)
- Description: helpful next action (body-small)
- CTA Button: optional
- Padding: 64px 24px

**Error State**
- Background: `danger-light`
- Border: `danger` (left border, 4px)
- Icon: ⚠️ (danger color, 24px)
- Heading: "Something went wrong" (H3)
- Description: error detail or recovery step
- Action: "Retry" button (primary) or "Get help" (secondary)
- Padding: 24px

**Success State**
- Background: `success-light`
- Border: `success` (left border, 4px)
- Icon: ✓ (success color, 24px)
- Heading: "Saved successfully" (H3)
- Duration: auto-dismiss 3 seconds
- Padding: 24px

---

## PART 6: INTERACTION & MOTION

### Focus States
```
All interactive elements should have:
  - Visible focus ring: 2px border, brand color (#3B82F6)
  - Offset: 2px from element edge
  - No outline (use border instead)
```

**Example CSS**:
```css
button:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}
```

### Hover States
```
Cards:           +10% lightness on surface color
Buttons:         Primary → hover color, opacity 90%
Links:           Color: brand, underline appears
Icons:           Color: brand (if interactive)
Rows/items:      +10% lightness (subtle)
```

### Active / Pressed States
```
Buttons:         Darker color, slight inset (box-shadow: inset)
Toggles:         Color → active color, transition 100ms
Navigation:      Border-bottom or side highlight
```

### Keyboard Navigation
- Tab order should follow visual left-to-right, top-to-bottom
- Skip-to-content link at top (hide unless focused)
- Modals should trap focus
- Popovers should close on Escape

### Motion Durations
```
Hover/Fast UI:   100–150ms (translate, opacity)
Dialog entrance: 150–200ms (fade, slide)
Dismiss/Close:   100ms (quick feedback)
Animations:      200–400ms (progress, loading)
Avoid:           > 500ms (feels sluggish)
Easing:          ease-in-out (smooth, natural)
```

---

## PART 7: RESPONSIVE BREAKPOINTS

### Tailwind Breakpoints
```
sm:  640px    Tablets
md:  768px    Small laptops
lg:  1024px   Standard desktop
xl:  1280px   Large desktop
2xl: 1536px   Ultra-wide
```

### Component Breakpoints

**Sidebar Navigation**
- lg+: fixed sidebar (w-64)
- <lg: drawer on mobile, hidden by default

**Metric Grids**
- 2xl: grid-cols-6
- xl: grid-cols-4
- lg: grid-cols-3
- md: grid-cols-2
- sm: grid-cols-1

**Tables**
- lg+: full table
- <lg: card view or horizontal scroll

**Workflow Canvas**
- lg+: palette + canvas + inspector
- md: palette toggle + canvas
- <md: canvas only, minimized toolbar

**Modal Size**
- max-width: 95vw (mobile)
- max-width: 90vw (tablet)
- max-width: 640px (desktop)

---

## PART 8: ACCESSIBILITY STANDARDS

### Color Contrast (WCAG AA)
- Body text: minimum 4.5:1 contrast ratio
- UI components: minimum 3:1 contrast ratio
- Use WebAIM Contrast Checker or similar

### Touch Targets
- Minimum 44px × 44px for touch interactive elements
- 8px minimum padding around smaller icons

### Keyboard Navigation
- All interactive elements focusable via Tab
- Visible focus indicator on all focusable elements
- Meaningful tab order (left-to-right, top-to-bottom)
- Escape closes modals/popovers

### ARIA Labels
- Icon-only buttons: `aria-label="..."` or `title="..."`
- Toggle/checkbox: `aria-checked="..."` or `aria-pressed="..."`
- Expandable sections: `aria-expanded="..."`
- Dropdowns: `aria-haspopup="listbox"` + `aria-owns="..."`
- Loading states: `aria-busy="true"`

### Text Alternatives
- Charts/graphs should have text summary nearby
- Status icons should have title or label
- No information should be conveyed by color alone

---

## PART 9: IMPLEMENTATION GUIDELINES

### Token Usage (DO NOT hardcode colors)
```javascript
// ❌ WRONG
<div className="bg-blue-500 text-white">

// ✅ RIGHT
<div className="bg-brand text-primary">
```

### Component Composition
```javascript
// ✅ Reuse variants
<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>

// ❌ Avoid one-off styling
<button className="bg-blue-600 hover:bg-blue-700 ...">
```

### Form Layout
```jsx
// ✅ Use consistent spacing
<div className="form-group">
  <label>Email</label>
  <input type="email" />
</div>

// ✅ Use form sections
<div className="form-section">
  <h3>Contact Info</h3>
  {/* form fields */}
</div>
```

### Card Composition
```jsx
// ✅ Consistent card system
<Card>
  <Card.Header>
    <Card.Title>Execution Rate</Card.Title>
  </Card.Header>
  <Card.Body>
    {/* content */}
  </Card.Body>
</Card>
```

---

## PART 10: ROLLOUT PHASES

### Phase 1: Foundation (Week 1-2)
- [ ] Create Tailwind config with semantic tokens
- [ ] Export design tokens to CSS variables
- [ ] Create base button, card, input, badge variants
- [ ] Document color system in Storybook (optional)

### Phase 2: Core Pages (Week 3-4)
- [ ] Unify FirmDashboard colors and spacing
- [ ] Standardize table implementation
- [ ] Unify modal/dialog treatment
- [ ] Fix hero sections (H1, H2 hierarchy)

### Phase 3: Enterprise Modules (Week 5-6)
- [ ] Mission Control visual polish
- [ ] Workflow Builder layout responsive
- [ ] Scheduler table unification
- [ ] AI/Automation color harmony

### Phase 4: Accessibility & Polish (Week 7-8)
- [ ] Add focus rings everywhere
- [ ] Fix contrast issues
- [ ] Add keyboard navigation test
- [ ] Responsive refinement

---

## VALIDATION CHECKLIST

- [ ] All colors use semantic tokens (no hardcoded hex/rgb)
- [ ] All buttons use variant system
- [ ] All cards use base card + variant
- [ ] All form inputs use standardized styling
- [ ] All status indicators use unified badge system
- [ ] All interactive elements have focus rings
- [ ] All empty/loading/error/success states visible
- [ ] All pages pass WCAG AA contrast check
- [ ] All custom dropdowns have keyboard support
- [ ] All tables are consistent (headers, rows, pagination)
- [ ] Responsive behavior tested on sm/md/lg breakpoints
- [ ] Build passes without warnings
- [ ] Visual regression tested (no unintended changes)

---

## NEXT STEPS

1. **Review & Feedback**: Share this design system with team
2. **Tailwind Configuration**: Implement semantic tokens in tailwind.config.js
3. **Component Migration**: Update existing components phase by phase
4. **QA Testing**: Visual regression testing after each phase
5. **Documentation**: Create Storybook stories for all variant combinations

---

**Status**: SPECIFICATION COMPLETE  
**Prepared by**: Lead Product Designer  
**Target Implementation**: 8 weeks  
**Impact**: Enterprise-grade visual consistency
