# FJL (Famous Jolly Luxe) - Mobile-Responsive Design Guide

## Overview

The FJL website has been comprehensively redesigned to be fully responsive across all device sizes from small mobile phones (320px) to 4K ultra-wide displays (2560px+). This guide documents all responsive design improvements, breakpoints, and best practices implemented.

---

## Responsive Design Breakpoints

The website uses a **mobile-first approach** with the following standardized breakpoints:

| Breakpoint | Device Type | Width Range | Usage |
|-----------|------------|-------------|-------|
| **Mobile** | Phones | 320px - 639px | Default styles (no media query) |
| **Tablet Small** | Small tablets | 640px - 767px | Minor layout adjustments |
| **Tablet** | iPads, tablets | 768px - 1023px | Two-column layouts begin |
| **Desktop** | Laptops, desktops | 1024px - 1439px | Three-column grids, full features |
| **Large Desktop** | Large monitors | 1440px - 1919px | Optimized spacing and sizing |
| **4K & Ultra-Wide** | 4K displays | 1920px+ | Maximum content widths, enhanced spacing |

---

## Global Responsive Framework

### File: `responsive-framework.css`

A comprehensive CSS framework providing:
- **CSS Variables** for colors, spacing, typography, shadows, and transitions
- **Fluid Typography** using `clamp()` for automatic scaling
- **Responsive Grid Utilities** for flexible layouts
- **Spacing Utilities** for consistent padding/margin
- **Navigation Styles** for mobile menus and desktop navbars
- **Touch Device Optimizations** with reduced hover effects
- **Accessibility Features** including reduced motion support

#### Key CSS Variables

```css
/* Fluid Typography Examples */
--font-size-body: clamp(14px, 2vw, 16px);      /* Mobile 14px → Desktop 16px */
--font-size-lg: clamp(24px, 4vw, 32px);        /* Mobile 24px → Desktop 32px */
--font-size-3xl: clamp(36px, 7vw, 56px);       /* Mobile 36px → Desktop 56px */

/* Responsive Spacing Scale */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-xl: 24px;
--spacing-2xl: 32px;
```

---

## Page-by-Page Responsive Updates

### 1. Homepage (`index.html`)

**Responsive Features:**
- Full-viewport hero banner with proper image scaling
- Responsive modal dialogs (full-width on mobile, centered on desktop)
- Product grid: 1 column (mobile) → 3 columns (desktop)
- Touch-friendly mobile menu with smooth animations
- Hamburger menu for mobile, desktop navigation on larger screens

**Key Media Queries:**
- `max-width: 639px` - Extra small phones: Hero banner padding, modal adjustments
- `640px - 767px` - Tablets: Modal sizing, spacing adjustments
- `768px+` - Tablets and up: Navigation changes, hover effects enabled
- `1024px+` - Desktops: Enhanced shadows, larger spacing
- `1920px+` - 4K: Maximum sizing, premium spacing

**Touch Optimizations:**
```css
@media (hover: none) and (pointer: coarse) {
    /* Touch devices: Remove hover effects, use touch-friendly sizes */
    button, a { min-height: 48px; min-width: 48px; }
}
```

---

### 2. Shop Page (`shop.html`)

**Responsive Features:**
- Dynamic product grid: 2 columns (mobile) → 3 columns (tablet) → 4 columns (4K)
- Responsive filter container and view toggle
- List/Grid view switching with proper layout adjustments
- Product card sizing scales with viewport
- Sticky header that works on all sizes

**Product Grid Breakpoints:**

| Viewport | Columns | Gap | Card Padding |
|----------|---------|-----|--------------|
| 320px-639px | 2 | 8px | 6px |
| 640px-767px | 2 | 12px | 10px |
| 768px-1023px | 3 | 16px | 12px |
| 1024px-1439px | 3 | 20px | 14px |
| 1440px-1919px | 3 | 24px | 16px |
| 1920px+ | 4 | 28px | 16px |

**List View Responsiveness:**
- Mobile: Vertical stack (image full-width, details below)
- Tablet 640px+: Horizontal flex (image 280px, details flex)
- Desktop 768px+: Image 300-420px width depending on viewport

---

### 3. Product Details Page (`product.html`)

**Responsive Features:**
- Layout: 1 column (mobile) → 2 columns (tablet+)
- Gallery: Full-width mobile, proportional sizing on desktop
- Image modals: 90vw/90vh on mobile for proper fitting
- Size grid: 3 cols (mobile) → 5-6 cols (desktop)
- Product features: 1 column (mobile) → 2 columns (desktop)

**Typography Scaling:**
```css
@media (max-width: 639px) {
    .product-title { font-size: clamp(18px, 5vw, 24px); }
    .product-price { font-size: clamp(16px, 4vw, 20px); }
}

@media (min-width: 1024px) {
    .product-title { font-size: 28px; }
    .product-price { font-size: 22px; }
}

@media (min-width: 1920px) {
    .product-title { font-size: 32px; }
    .product-price { font-size: 24px; }
}
```

**Image Scaling:**
- Mobile: Thumbnail 50px, Modal 90vw max
- Tablet: Thumbnail 60-70px
- Desktop: Thumbnail 80-100px

---

### 4. Checkout Page (`checkout.html`)

**Responsive Features:**
- Form layout: Full-width mobile → 2-column form + sidebar (tablet+)
- Order summary: Full-width mobile, sticky sidebar at 768px+
- Form fields: Single column mobile → 2 columns (tablets+)
- Responsive form inputs and buttons

**Layout Changes:**
```css
@media (max-width: 767px) {
    .checkout-container { grid-template-columns: 1fr; }
    .order-summary { position: static; }
}

@media (min-width: 768px) {
    .checkout-container { grid-template-columns: 2fr 1fr; }
    .order-summary { position: sticky; top: 100px; }
}

@media (min-width: 1024px) {
    .checkout-container { max-width: 1200px; margin: 0 auto; }
}
```

---

### 5. Shopping Cart Page (`cart.html`)

**Responsive Features:**
- Cart layout: 1 column (mobile) → 2 columns (tablet+)
- Cart items: Vertical mobile (image full-width) → Horizontal (tablet+)
- Summary: Below items on mobile, sticky sidebar on tablet+
- Image sizing: 100%/200px (mobile) → 150px → 200px (4K)

**Item Layout Evolution:**
- **Mobile (320px):** Full-width image (200px height), details below, stacked buttons
- **Tablet (640px):** 150px image, flexed details, horizontal layout
- **Tablet+ (768px):** 180-200px image, sticky 1fr sidebar
- **Desktop (1024px):** 200-220px image, better spacing
- **4K (1920px):** 220px image, premium spacing

---

### 6. Info Pages (`about.html`, `contact.html`, `order-confirmation.html`)

**Responsive Features:**
- Consistent mobile menu across all pages
- Content sections stack vertically on mobile
- Responsive grids for content (1 col mobile → 2-3 col desktop)
- Touch-friendly forms on mobile

---

## Navigation & Headers

### Mobile Navigation Pattern

**Desktop (768px+):**
- Horizontal navigation visible by default
- Sticky header with logo centered
- Left nav items, right icon buttons

**Mobile (< 768px):**
- Hamburger menu button visible
- Full-screen overlay menu on open
- Touch-friendly tap targets (48px minimum)
- Smooth slide-in animation

```css
@media (max-width: 767px) {
    .mobile-menu-btn { display: flex; }
    .nav-desktop { display: none; }
}

@media (min-width: 768px) {
    .mobile-menu-btn { display: none; }
    .nav-desktop { display: flex; }
}
```

---

## Typography Scaling

### Fluid Typography with `clamp()`

All heading and text sizes use fluid typography for smooth scaling:

```css
h1 { font-size: clamp(28px, 6vw, 56px); }     /* Mobile 28px → Desktop 56px */
h2 { font-size: clamp(24px, 5vw, 40px); }
h3 { font-size: clamp(20px, 4vw, 32px); }
h4 { font-size: clamp(16px, 3vw, 24px); }

p { font-size: clamp(14px, 2vw, 16px); }      /* Subtle scaling for body text */
```

**Benefits:**
- No jarring jumps at breakpoints
- Smooth scaling across all viewports
- Less media queries needed
- Better readability at all sizes

---

## Touch Device Optimizations

### Pointer and Hover Media Queries

**For Touch Devices (no hover capability):**
```css
@media (hover: none) and (pointer: coarse) {
    /* Disable hover effects, use tap-friendly interactions */
    button, a { min-height: 48px; min-width: 48px; }

    .product-card:hover {
        transform: none;  /* No transform on touch */
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
}
```

**For Desktop/Precision Devices:**
```css
@media (hover: hover) and (pointer: fine) {
    /* Full hover effects enabled */
    .product-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 12px 32px rgba(0,0,0,0.18);
    }
}
```

### Touch-Friendly Sizing

- Minimum tap target: **48px × 48px** (recommended by WCAG)
- Button padding: Increased on mobile
- Spacing: Larger gaps between interactive elements
- Input fields: Larger padding, 16px minimum font size (prevents zoom on iOS)

---

## Accessibility Considerations

### Reduced Motion Support

For users who prefer reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

### Color Contrast

- Primary text: `#000` on white background (WCAG AAA)
- Accent color: `#E09F3E` used appropriately with sufficient contrast
- All interactive elements have clear visual states (focus, hover, active)

### Focus States

All interactive elements include proper focus states for keyboard navigation:
```css
.form-input:focus {
    outline: none;
    border-color: #E09F3E;
    box-shadow: 0 0 0 3px rgba(224, 159, 62, 0.1);
}
```

---

## Orientation Support

### Portrait vs. Landscape

**Portrait Orientation:**
- Default layout (full-height hero, stacked content)
- Primary layout for mobile devices

**Landscape Orientation (max-height: 600px):**
- Reduced header height
- Adjusted hero banner
- More compact modal dialogs
- Side-by-side layouts when possible

```css
@media (orientation: landscape) and (max-height: 600px) {
    .hero-banner { height: auto; min-height: 80vh; }
    .modal-content { max-height: 90vh; overflow-y: auto; }
}
```

---

## Performance Optimizations

### Mobile-First CSS

- Base styles apply to all sizes (mobile optimized)
- Progressively enhance with media queries
- Smaller CSS payload initially
- Conditional styles only load when needed

### Image Optimization

- Use `object-fit: cover` for consistent aspect ratios
- Implement `aspect-ratio` CSS property
- Responsive image sizing scales with viewport
- Modal images use viewport-relative sizing (`90vw`, `90vh`)

### Optimization Tips

1. **Avoid unnecessary reflows:** Group related CSS changes
2. **Use hardware acceleration:** `transform` for animations instead of `top`/`left`
3. **Minimize paint areas:** Limit box-shadow usage on scroll
4. **Optimize images:** Use appropriate formats and sizes for each breakpoint

---

## Testing Checklist

### Browser & Device Testing

- [ ] **Mobile Phones (320px - 479px):** iPhone SE, iPhone 8, Samsung Galaxy S9
- [ ] **Small Phones (480px - 639px):** iPhone XR, Galaxy S10
- [ ] **Tablets (640px - 1023px):** iPad, iPad Mini, Galaxy Tab
- [ ] **Desktops (1024px - 1919px):** 13", 15", 21" monitors
- [ ] **Large Displays (1920px+):** 27", 32", 4K monitors

### Breakpoint Verification

Test at these critical widths:
- 320px - Extra small phones
- 375px - iPhone standard
- 480px - Landscape phones
- 768px - Primary tablet breakpoint
- 1024px - Desktop cutoff
- 1440px - Large desktop
- 1920px - 4K displays
- 2560px - Ultra-wide

### Orientation Testing

- [ ] Portrait on all phones
- [ ] Landscape on all phones
- [ ] Landscape with short height (600px)
- [ ] iPad portrait and landscape
- [ ] Desktop ultrawide

### Interaction Testing

- [ ] Touch interactions (tap, long-press)
- [ ] Hover effects (desktop only)
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Focus states visible
- [ ] Mobile menu open/close
- [ ] Form submission on all sizes

### Content Verification

- [ ] Text is readable (no overflow)
- [ ] Images display properly
- [ ] Modals fit within viewport
- [ ] Navigation is accessible
- [ ] Buttons are touch-friendly (48px+)
- [ ] No horizontal scrolling on mobile
- [ ] Color contrast adequate

### Performance Checks

- [ ] Page loads under 3s on 4G (mobile)
- [ ] First Paint under 1.5s
- [ ] Largest Contentful Paint under 2.5s
- [ ] Cumulative Layout Shift < 0.1

---

## CSS Variable Reference

### Colors
```css
--color-primary: #000;          /* Black - text, buttons */
--color-secondary: #fff;        /* White - background */
--color-accent: #E09F3E;        /* Gold - highlights, CTAs */
--color-gray-light: #f5f5f5;    /* Light gray - backgrounds */
--color-gray-medium: #8b8b8b;   /* Medium gray - secondary text */
--color-border: #e5e5e5;        /* Light border color */
```

### Spacing Scale
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;       /* Primary spacing */
--spacing-xl: 24px;       /* Large spacing */
--spacing-2xl: 32px;
--spacing-3xl: 48px;
--spacing-4xl: 64px;
```

### Typography
```css
/* Fluid sizes automatically scale based on viewport */
--font-size-body: clamp(14px, 2vw, 16px);
--font-size-sm: clamp(16px, 2.2vw, 18px);
--font-size-base: clamp(18px, 2.5vw, 22px);
--font-size-md: clamp(20px, 3vw, 24px);
--font-size-lg: clamp(24px, 4vw, 32px);
--font-size-xl: clamp(28px, 5vw, 40px);
--font-size-2xl: clamp(32px, 6vw, 48px);
--font-size-3xl: clamp(36px, 7vw, 56px);
```

### Shadows
```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
```

---

## Maintenance & Future Updates

### Adding New Responsive Sections

1. Start with mobile-first base styles
2. Add breakpoints from smallest to largest:
   ```css
   /* Mobile (320px+) - Base */
   .new-element { font-size: 14px; padding: 12px; }

   /* Tablet (768px+) */
   @media (min-width: 768px) {
       .new-element { font-size: 16px; padding: 16px; }
   }

   /* Desktop (1024px+) */
   @media (min-width: 1024px) {
       .new-element { font-size: 18px; padding: 20px; }
   }
   ```

3. Test across all breakpoints
4. Verify touch interactions
5. Check accessibility (focus, contrast, etc.)

### Updating Media Queries

- Maintain consistent breakpoint values (320, 640, 768, 1024, 1440, 1920)
- Always include both `@media (max-width)` and `@media (min-width)` as needed
- Use CSS variables for shared values
- Document custom breakpoints if needed

### Browser Support

Current support target:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Android Chrome latest

Features like `clamp()`, CSS Grid, and Flexbox have excellent support in these versions.

---

## Quick Reference: Media Query Template

```css
/* MOBILE (320px - 639px) - Default styles */
.element {
    font-size: 14px;
    padding: 12px;
    grid-template-columns: 1fr;
}

/* TABLET SMALL (640px - 767px) */
@media (min-width: 640px) and (max-width: 767px) {
    .element {
        font-size: 15px;
        padding: 14px;
    }
}

/* TABLET (768px - 1023px) */
@media (min-width: 768px) {
    .element {
        font-size: 16px;
        padding: 16px;
        grid-template-columns: 1fr 1fr;
    }
}

/* DESKTOP (1024px - 1439px) */
@media (min-width: 1024px) {
    .element {
        font-size: 17px;
        padding: 18px;
        grid-template-columns: 1fr 1fr 1fr;
    }
}

/* LARGE DESKTOP (1440px - 1919px) */
@media (min-width: 1440px) {
    .element {
        font-size: 18px;
        padding: 20px;
    }
}

/* 4K+ (1920px+) */
@media (min-width: 1920px) {
    .element {
        font-size: 19px;
        padding: 24px;
    }
}

/* TOUCH DEVICES */
@media (hover: none) and (pointer: coarse) {
    .element { min-height: 48px; }
}

/* HOVER-CAPABLE DEVICES */
@media (hover: hover) and (pointer: fine) {
    .element:hover { transform: translateY(-4px); }
}

/* REDUCED MOTION */
@media (prefers-reduced-motion: reduce) {
    .element { transition: none !important; }
}
```

---

## Conclusion

The FJL website is now fully responsive with:
- ✅ Mobile-first CSS approach
- ✅ 6 optimized breakpoints (320px to 2560px+)
- ✅ Fluid typography with automatic scaling
- ✅ Touch-friendly interactions
- ✅ Full accessibility support
- ✅ Optimized performance across all devices

All responsive features maintain the luxury FJL brand aesthetic while ensuring excellent usability on every device size.

For questions or updates, refer to `responsive-framework.css` and page-specific media queries.
