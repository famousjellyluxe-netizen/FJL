# Global Notification System - Implementation Guide

## Overview

The Famous Jolly Luxe (FJL) website now includes a comprehensive global notification system that displays all user and system messages in a unified, elegant notification box positioned at the top-center of the screen.

## Features

✅ **Top-Center Position** - Notifications appear centered at the top of the viewport (20px from top)
✅ **Automatic Stacking** - Multiple notifications stack vertically with 10px spacing
✅ **Smooth Animations** - Slide down (400ms) on entry, slide up (300ms) on exit
✅ **Auto-Dismiss** - Notifications automatically close after 3-4 seconds (configurable)
✅ **Manual Close** - Close button (×) for immediate dismissal
✅ **Responsive Design** - Works seamlessly on mobile (280px min), tablet, and desktop
✅ **Accessibility** - ARIA labels, role attributes, and keyboard support (Esc to close modals)
✅ **FJL Branding** - Black background, white text, gold/red/amber/blue accents
✅ **Multiple Types** - Success (gold), Error (red), Warning (amber), Info (blue)
✅ **Modal Support** - Confirmation dialogs with animations and focus management

## API Reference

### Notification Methods

```javascript
// Success notification (3 second duration)
notifications.success(message, duration = 3000);

// Error notification (4 second duration)
notifications.error(message, duration = 4000);

// Warning notification (4 second duration)
notifications.warning(message, duration = 4000);

// Info notification (3 second duration)
notifications.info(message, duration = 3000);

// Generic notification
notifications.show(message, type = 'info', duration = 3000);

// Confirmation modal
notifications.confirm(message, onConfirm, onCancel);

// Clear all notifications
notifications.clearAll();

// Get count of active notifications
notifications.getCount();
```

### Parameters

- **message** (string): The notification text to display
- **type** (string): 'success', 'error', 'warning', 'info'
- **duration** (number): Auto-dismiss time in milliseconds (0 = no auto-dismiss)
- **onConfirm** (function): Callback when user confirms modal
- **onCancel** (function): Callback when user cancels modal

## Styling

### Visual Design

| Type | Icon | Color | Border | Use Case |
|------|------|-------|--------|----------|
| Success | ✓ | #E09F3E (Gold) | 4px solid #E09F3E | Item added, saved successfully |
| Error | ✕ | #d32f2f (Red) | 4px solid #d32f2f | Out of stock, form errors |
| Warning | ⚠ | #ffa726 (Amber) | 4px solid #ffa726 | Low stock, incomplete form |
| Info | ℹ | #1976d2 (Blue) | 4px solid #1976d2 | Loading, fetching data |

### Styling Details

- **Background**: Black (#000) for luxury appearance
- **Text Color**: White (#fff) for contrast
- **Font**: Inter 14px, weight 500
- **Padding**: 16px 20px
- **Border Radius**: 6px
- **Shadow**: 0 8px 24px rgba(0, 0, 0, 0.2)
- **Min Width**: 320px
- **Max Width**: 500px (responsive to 90vw on mobile)

## Integration Points

### 1. Cart Operations

**File**: `cart-drawer.js`

```javascript
// Remove item notification
notifications.info('Item removed from cart');

// Clear cart confirmation
notifications.confirm(
    'Are you sure you want to clear your cart?',
    () => {
        cart.clear();
        notifications.success('Cart cleared successfully!');
    }
);
```

### 2. Product Page - Add to Cart

**File**: `product.html` (lines 2063-2066)

```javascript
// Success notification
notifications.success(`${product.name} added to cart!`, 3000);

// Validation errors
notifications.warning('Please select a size');
notifications.error(inventoryCheck.message);
```

### 3. Shop Page - Quick Add

**File**: `shop.html` (lines 1511-1542)

```javascript
// Quick add success
notifications.success(`${productName} (Size: ${size}) added to cart!`);

// Size selection warning
notifications.warning('Please select a size first');

// Product updates
notifications.info('Products updated!');
```

### 4. Checkout Form

**File**: `checkout.html` (lines 1082-1153)

```javascript
// Validation error
notifications.error('Please fill in all required fields', 4000);

// Success notification
notifications.success(`Order ${orderNumber} created successfully!`, 3000);

// Error handling
notifications.error('An error occurred while processing your order. Please try again.', 4000);
```

### 5. Contact Form

**File**: `contact.html` (lines 705-765)

```javascript
// Validation errors
notifications.error('Please fill in all fields', 4000);
notifications.error('Please enter a valid email address', 4000);

// Success notification
notifications.success('Message sent successfully! We\'ll get back to you soon.', 4000);

// Error handling
notifications.error('An error occurred. Please try again later.', 4000);
```

## CSS Classes & Animations

### CSS Classes

```css
.fjl-notification              /* Main notification element */
.fjl-notification.removing     /* Class added when dismissing */
.fjl-notification-close-btn    /* Close button styling */
.fjl-modal-overlay             /* Confirmation modal overlay */
.fjl-modal-content             /* Confirmation modal content */
```

### Animations

```css
@keyframes fjlSlideDown        /* Notification entry: 400ms */
@keyframes fjlSlideUp          /* Notification exit: 300ms */
@keyframes fjlModalFadeIn      /* Modal appearance: 300ms */
@keyframes fjlModalScaleIn     /* Modal scale: 300ms */
```

## Responsive Design

### Desktop (768px+)
- Container: 500px max width
- Position: 20px from top
- Padding: 0 16px

### Tablet/Mobile (< 768px)
- Container: min(calc(100vw - 32px), 90vw)
- Position: 10px from top
- Notification: 280px min width, 100% max width

## Accessibility Features

- **ARIA Labels**: `role="region"`, `aria-live="polite"`, `aria-label="Notifications"`
- **Status Roles**: Each notification has `role="status"` and `aria-live="polite"`
- **Keyboard Support**:
  - Escape key closes confirmation modals
  - Tab navigation through buttons
  - Focus management on modal appearance
- **Focus Outline**: Close button has visible outline on focus
- **Semantic HTML**: Proper button elements with type attributes

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Android)

## Performance

- **Lightweight**: ~15KB file size
- **No Dependencies**: Pure vanilla JavaScript
- **Efficient DOM**: Event delegation, minimal repaints
- **Memory Management**: Proper cleanup on dismissal, Map-based tracking

## Example Usage

### Basic Success Notification

```javascript
notifications.success('Item saved successfully!');
```

### Error with Longer Duration

```javascript
notifications.error('Network error. Please check your connection.', 5000);
```

### Confirmation Dialog

```javascript
notifications.confirm(
    'Delete this item permanently?',
    () => {
        // Confirmed - delete item
        deleteItem();
        notifications.success('Item deleted');
    },
    () => {
        // Cancelled
        notifications.info('Deletion cancelled');
    }
);
```

### Multiple Concurrent Notifications

```javascript
notifications.info('Loading products...');
notifications.warning('This action cannot be undone');
notifications.success('Product added!');
// All three will stack vertically
```

## File Locations

| File | Description | Lines |
|------|-------------|-------|
| `notifications.js` | Core notification system | 1-497 |
| `cart-drawer.js` | Cart notifications | 243-250, 450-452 |
| `product.html` | Product page notifications | 2004-2065 |
| `shop.html` | Shop page notifications | 1511-1542, 1562-1564 |
| `checkout.html` | Checkout form notifications | 1082-1153 |
| `contact.html` | Contact form notifications | 705-765 |

## Future Enhancements

- Sound notifications (optional)
- Toast notification positioning options (top, bottom, corner)
- Notification action buttons (Undo, Retry, etc.)
- Notification persistence option
- Custom color schemes
- Progress bar for auto-dismiss
- Notification history/log
- Analytics integration
- Integration with backend error handling

## Troubleshooting

### Notifications Not Appearing

1. Ensure `notifications.js` is loaded before other scripts
2. Wait for `DOMContentLoaded` event
3. Check console for errors
4. Verify `notifications` global variable exists

### Notifications Hidden Behind Elements

- Check z-index values (notification container: 9999, modal: 9998)
- Ensure no other elements have higher z-index
- Verify no CSS overflow hidden on parent

### Animations Not Smooth

- Check browser support for CSS animations
- Verify GPU acceleration enabled
- Check for CSS conflicts with other stylesheets

### Modal Not Responsive

- Ensure viewport meta tag present in HTML
- Check media query support
- Test on actual devices

## Best Practices

1. ✅ Use appropriate notification types for context
2. ✅ Keep messages concise and actionable
3. ✅ Use consistent messaging across the site
4. ✅ Avoid notification spam (max 3-4 concurrent)
5. ✅ Provide clear success/error feedback
6. ✅ Include relevant details (product names, order numbers)
7. ✅ Test across different screen sizes
8. ✅ Ensure keyboard accessibility
9. ✅ Clear notifications before navigation
10. ✅ Use promises/async for form submissions

## Testing

### Manual Testing Checklist

- [ ] Notifications appear at top-center
- [ ] Notifications stack vertically
- [ ] Auto-dismiss after specified duration
- [ ] Close button works
- [ ] Color/styling matches design
- [ ] Works on mobile (320px+)
- [ ] Works on tablet (768px)
- [ ] Works on desktop (1024px+)
- [ ] Keyboard support (Tab, Escape)
- [ ] No console errors
- [ ] Multiple notifications display correctly
- [ ] Modals are accessible

### Browser Testing

```bash
# Test on different browsers
Chrome, Firefox, Safari, Edge, Mobile Safari, Chrome Mobile
```

## Support

For issues or questions about the notification system:
1. Check the browser console for errors
2. Verify all files are loaded in correct order
3. Test in different browser
4. Check responsive design on target device
5. Review implementation in files listed above

---

**Last Updated**: November 2025
**Version**: 1.0
**Status**: Production Ready ✅
