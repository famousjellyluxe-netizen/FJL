# FJL Admin Panel - Design System Documentation

## Overview
This document outlines the complete design system for the FJL Admin Panel, extracted from the client-side application and existing admin styles. All colors, typography, spacing, and component patterns are defined here to ensure brand consistency.

---

## Color Palette

### Primary Colors
| Variable | Value | Usage |
|----------|-------|-------|
| `--color-primary` | `#000` (Black) | Main text, darkbackgrounds, primary UI |
| `--color-secondary` | `#fff` (White) | Light backgrounds, text on dark backgrounds |
| `--color-bg` | `#fafafa` | Page background color |

### Accent Colors
| Variable | Value | Usage | Context |
|----------|-------|-------|---------|
| `--color-accent` | `#E09F3E` (Gold/Orange) | Admin-specific accent | **ADMIN ONLY** |
| `--color-accent-hover` | `#d4891b` | Hover state | **ADMIN ONLY** |
| `--color-accent-client` | `#1d9625` (Green) | Client-side accent | **Reference only - don't use** |

### Status Colors
| Variable | Value | Usage |
|----------|-------|-------|
| `--color-success` | `#2ECC40` (Green) | Success messages, positive actions |
| `--color-warning` | `#FF851B` (Orange) | Warnings, caution states |
| `--color-danger` | `#FF4136` (Red) | Errors, delete actions |
| `--color-info` | `#0074D9` (Blue) | Information, help text |

### Grayscale
| Variable | Value | Usage |
|----------|-------|-------|
| `--color-gray` | `#8b8b8b` | Secondary text, labels |
| `--color-gray-light` | `#f5f5f5` | Light backgrounds, borders |
| `--color-gray-dark` | `#333` | Dark text, secondary headers |
| `--color-border` | `#e5e5e5` | Borders, dividers |

---

## Typography

### Font Families

```css
--font-body: 'Inter', sans-serif;          /* Body text, buttons, labels */
--font-heading: 'Poppins', sans-serif;     /* Headings h1-h6 */
--font-logo: 'Bubbler One', sans-serif;    /* Logo text (FJL) */
```

All fonts are imported from Google Fonts API:
```html
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;500;600;700&family=Bubbler+One&display=swap" rel="stylesheet">
```

### Font Weights

| Variable | Value | Usage |
|----------|-------|-------|
| `--font-weight-regular` | 400 | Body text |
| `--font-weight-medium` | 500 | Secondary text, navigation |
| `--font-weight-semibold` | 600 | Labels, small headings |
| `--font-weight-bold` | 700 | Headings, emphasis |

### Font Sizes

#### Headings (Responsive using clamp)
| Element | Size | CSS |
|---------|------|-----|
| h1 | 24px - 28px | `clamp(24px, 6vw, 28px)` |
| h2 | 18px - 24px | `clamp(18px, 5vw, 24px)` |
| h3 | 16px - 20px | `clamp(16px, 4vw, 20px)` |
| h4 | 14px - 16px | `clamp(14px, 3vw, 16px)` |
| h5 | 14px | Static |
| h6 | 12px | Static |

#### Body Text
| Variable | Size | Usage |
|----------|------|-------|
| `--font-size-base` | 14px | Default body text |
| `--font-size-lg` | 16px | Large text |
| `--font-size-sm` | 12px | Small text, captions |
| `--font-size-xs` | 11px | Extra small, fine print |

### Line Heights
| Variable | Value | Usage |
|----------|-------|-------|
| `--line-height-tight` | 1.2 | Headings, dense content |
| `--line-height-normal` | 1.4 | Default body text |
| `--line-height-relaxed` | 1.6 | Descriptions, long-form text |

---

## Spacing Scale

All spacing uses an 8px base unit for consistency:

| Variable | Value | Usage |
|----------|-------|-------|
| `--spacing-xs` | 4px | Tight spacing, small gaps |
| `--spacing-sm` | 8px | Compact spacing |
| `--spacing-md` | 12px | Standard spacing |
| `--spacing-lg` | 16px | Comfortable spacing, default |
| `--spacing-xl` | 24px | Large spacing, containers |
| `--spacing-2xl` | 32px | Extra large spacing |
| `--spacing-3xl` | 48px | Huge spacing, major sections |
| `--spacing-4xl` | 64px | Maximum spacing |

### Usage Examples
- **Padding**: Cards use `var(--spacing-xl)` (24px)
- **Margins**: Section separations use `var(--spacing-2xl)` (32px)
- **Gaps**: Flex/grid gaps use `var(--spacing-lg)` (16px)
- **Small elements**: Icons/avatars use `var(--spacing-md)` to `var(--spacing-lg)`

---

## Shadows

| Variable | Value | Usage |
|----------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Standard cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, popovers |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.1)` | Maximum elevation |

### Usage
- **Cards at rest**: `var(--shadow-sm)`
- **Cards on hover**: `var(--shadow-md)`
- **Modals/overlays**: `var(--shadow-lg)`
- **Floating elements**: `var(--shadow-lg)` to `var(--shadow-xl)`

---

## Border Radius

| Variable | Value | Usage |
|----------|-------|-------|
| `--radius-sm` | 4px | Small buttons, inputs |
| `--radius-md` | 6px | Default elements |
| `--radius-lg` | 8px | Cards, containers |
| `--radius-xl` | 12px | Large cards, major containers |
| `--radius-full` | 9999px | Fully rounded (avatars, pills) |

---

## Transitions & Animations

| Variable | Value | Usage |
|----------|-------|-------|
| `--transition` | `all 0.3s ease` | Default transition |
| `--transition-fast` | `all 0.15s ease` | Quick interactions |
| `--transition-slow` | `all 0.5s ease` | Large animations |

---

## Layout Dimensions

| Variable | Value | Purpose |
|----------|-------|---------|
| `--sidebar-width` | 260px | Desktop sidebar width |
| `--header-height` | 60px | Top header height |
| `--mobile-nav-height` | 56px | Mobile navigation height |

---

## Responsive Design Strategy

### Breakpoints (Mobile-First Approach)

```css
/* Mobile-first: < 768px */
@media (max-width: 767px) { ... }

/* Tablet: 768px - 1024px */
@media (min-width: 768px) and (max-width: 1024px) { ... }

/* Desktop: > 1024px */
@media (min-width: 1025px) { ... }
```

### Mobile-First Layout Changes

#### Sidebar Navigation
- **Mobile**: Hidden, hamburger menu opens drawer
- **Tablet & Desktop**: Always visible, 260px width

#### Content Layout
- **Mobile**: Single column, full width
- **Tablet**: 2-column grid where appropriate
- **Desktop**: 3-4 column grid, multi-column layouts

#### Tables (Strategy A)
- **Mobile**: Key columns only (image, name, price, status, actions)
- **Tablet**: Add secondary columns as space allows
- **Desktop**: Show all columns

#### Forms
- **Mobile**: Single column, full-width inputs
- **Desktop**: Multi-column layouts, compact spacing

---

## Touch Target Sizes (Mobile Accessibility)

| Variable | Value | Usage |
|----------|-------|-------|
| `--touch-target-min` | 44px | Minimum for mobile |
| `--touch-target-default` | 48px | Recommended |
| `--touch-target-large` | 56px | Primary actions |

All interactive elements must be at least 44x44px on mobile devices.

---

## Z-Index Scale

| Variable | Value | Purpose |
|----------|-------|---------|
| `--z-dropdown` | 10 | Dropdown menus |
| `--z-sticky` | 20 | Sticky headers |
| `--z-fixed` | 30 | Fixed positioning |
| `--z-modal-backdrop` | 40 | Modal dark overlay |
| `--z-modal` | 50 | Modal dialogs |
| `--z-popover` | 60 | Popovers, tooltips |
| `--z-tooltip` | 70 | Tooltips |
| `--z-notification` | 80 | Toast notifications |
| `--z-menu` | 100 | Hamburger menu |

---

## Component Patterns

### Buttons

#### Sizes
- **Regular**: 40px min-height, 12-16px padding
- **Small**: 36px min-height, 10-12px padding
- **Touch-friendly**: Minimum 44px for mobile

#### Variants
1. **Primary** (`.btn-primary`): Black background, white text
2. **Accent** (`.btn-accent`): Gold/orange background, black text
3. **Secondary** (`.btn-secondary`): Light gray background, bordered
4. **Danger** (`.btn-danger`): Red background, white text
5. **Success** (`.btn-success`): Green background, white text

#### States
- **Default**: Normal appearance
- **Hover**: Shadow increase, slight color shift
- **Active/Pressed**: Darker shade
- **Disabled**: 60% opacity, cursor not-allowed

### Cards

- **Background**: White (`--color-secondary`)
- **Border**: 1px solid `--color-border`
- **Border Radius**: `var(--radius-lg)` (8px)
- **Padding**: `var(--spacing-xl)` (24px)
- **Shadow**: `var(--shadow-sm)` default, `var(--shadow-md)` on hover
- **Transition**: `var(--transition)`

### Input Fields

- **Background**: `var(--color-light-gray)` (#f5f5f5)
- **Border**: 1px solid `var(--color-border)`
- **Border Radius**: `var(--radius-md)` (6px)
- **Padding**: 10-12px vertical, 14-16px horizontal
- **Font Size**: 14px minimum
- **Min Height**: 40px (touch-friendly)

### Status Badges

```css
.badge-success { background: rgba(46, 204, 64, 0.1); color: var(--color-success); }
.badge-warning { background: rgba(255, 133, 27, 0.1); color: var(--color-warning); }
.badge-danger { background: rgba(255, 65, 54, 0.1); color: var(--color-danger); }
.badge-info { background: rgba(0, 116, 217, 0.1); color: var(--color-info); }
```

---

## Brand Assets

### Logo Files
- **File**: `/fjl-logo-favicon.svg`
- **Format**: SVG (scalable)
- **Style**: "FJL" text with double border rectangle
- **Variants**:
  - White version (favicon, for dark backgrounds)
  - Black version (for light backgrounds)

### Logo Usage
- **Sidebar**: 32x32px or 40x40px
- **Header**: 32x32px next to title
- **Favicon**: Use as-is, handled by browser

### Favicon Setup
```html
<link rel="icon" type="image/svg+xml" href="/fjl-logo-favicon.svg">
```

---

## Implementation Checklist

- [ ] Import `design-tokens.css` in all admin pages
- [ ] Use CSS custom properties (variables) consistently
- [ ] No hardcoded colors or spacing values
- [ ] All interactive elements have proper touch targets (44px+)
- [ ] Responsive design follows mobile-first approach
- [ ] Fonts imported from Google Fonts API
- [ ] Logo and favicon match client-side exactly
- [ ] Shadows and transitions used consistently
- [ ] Border radius applied uniformly
- [ ] Z-index follows the documented scale

---

## Color Reference Comparison

### Client-Side Application
- **Primary Accent**: `#1d9625` (Green with neon glow)
- **Main Accent Color**: Used throughout frontend

### Admin Panel (DIFFERENT by design)
- **Primary Accent**: `#E09F3E` (Gold/Orange)
- **Reason**: Visual differentiation between client and admin areas

**IMPORTANT**: Do NOT use client-side green (#1d9625) in the admin panel. Use the gold/orange (#E09F3E) consistently.

---

## Quick Reference

### Essential Variables
```css
/* Colors */
--color-primary: #000;
--color-secondary: #fff;
--color-accent: #E09F3E;          /* ADMIN ONLY */
--color-success: #2ECC40;
--color-danger: #FF4136;

/* Typography */
--font-body: 'Inter', sans-serif;
--font-heading: 'Poppins', sans-serif;

/* Spacing */
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-xl: 24px;

/* Responsive Breakpoints */
@media (max-width: 767px) { /* Mobile */ }
@media (min-width: 768px) { /* Tablet & Desktop */ }
@media (min-width: 1025px) { /* Desktop */ }
```

---

## Resources

- **Google Fonts**: https://fonts.googleapis.com
- **Color Tool**: https://chir.mn/projects/ntc
- **Responsive Design Testing**: Chrome DevTools mobile emulation
- **Accessibility Testing**: WAVE, Lighthouse, axe DevTools

---

**Document Version**: 1.0
**Last Updated**: Phase 0 - Design System Extraction
**Status**: Complete ✅
