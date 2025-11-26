# Stock Message Upgrade - Implementation Plan

**Status**: In Progress
**Date**: 2025-11-26
**Target**: Amazon/Jumia-Grade Stock Messages

## Upgrade Strategy

### New Message Templates (Approved Style System)

```
A) Out of Stock:
   "This item ({{variant_name}}) is no longer available."

B) Maximum Quantity Exceeded:
   "Only {{stock}} left in stock."

C) Maximum Available Reached:
   "You've added the maximum available quantity ({{stock}})."

D) Stock Reduced After Existing Cart Item:
   "Quantity updated. Only {{stock}} left in stock."

E) Item Removed from Cart (Out of Stock):
   "This item is now out of stock and has been removed from your cart."

F) Checkout Validation Error:
   "One or more items are no longer available in the selected quantity."

G) Variant Unavailable:
   "{{color}} / {{size}} is currently out of stock."

H) Low Stock Warning:
   "Only {{stock}} left in stock. Hurry!"

I) Insufficient Stock on Add:
   "Sorry, only {{stock}} {{variant_name}} available."

J) Size Out of Stock (Product Page):
   "This size is no longer available."

K) Stock Status Badge:
   - In Stock: "In Stock"
   - Low Stock: "Limited Stock"
   - Out of Stock: "Out of Stock"

L) Button State:
   - In Stock: "Add to Cart"
   - Out of Stock: "Out of Stock"
   - Low Stock: "Add to Cart" (with warning below)
```

## Files to Update (Priority Order)

### Priority 1: Customer-Facing HTML/JS (Direct User Impact)

- [ ] product.html - Product detail page messages
- [ ] shop.html - Shop listing messages
- [ ] cart.html - Cart page messages
- [ ] checkout.html - Checkout validation messages
- [ ] index.html - Featured products messages

### Priority 2: Core Logic JS Files

- [ ] product-stock-updates.js - Real-time stock updates
- [ ] cart-drawer.js - Cart drawer notifications
- [ ] cart-manager.js - Cart business logic messages
- [ ] notifications.js - Notification system (if needed)

### Priority 3: Integration Files

- [ ] checkout-integration.js - Already fixed for error messages
- [ ] shop-integration.js - Shop page integration
- [ ] api-integration.js - API error messages

### Priority 4: Backend Messages (Error Responses)

- [ ] backend/orderService.js - Order validation errors
- [ ] backend/productService.js - Product validation errors
- [ ] backend/routes/products.js - API validation errors

---

## Mapping: Old → New Messages

### Product Detail Page (product.html)

| Old Message | New Message | Trigger | Location |
|-----------|-----------|---------|----------|
| `'Out of Stock'` (badge) | `'Out of Stock'` | total_stock === 0 | stockStatusBadge |
| `'Low Stock'` (badge) | `'Limited Stock'` | 1 ≤ stock ≤ 5 | stockStatusBadge |
| `'In Stock'` (badge) | `'In Stock'` | stock > 5 | stockStatusBadge |
| `'Out of stock'` (tooltip) | `'This size is no longer available.'` | size.stock === 0 | Size button title |
| `'This size is out of stock'` (toast) | `'This size is no longer available.'` | Click OOS size | Toast/Modal |
| ``Only ${availableStock} units...`` | `'Only {{stock}} left in stock.'` | Quantity increase | Toast/Modal |

### Shop Page (shop.html)

| Old Message | New Message | Trigger | Location |
|-----------|-----------|---------|---------|
| `'Out of stock'` (tooltip) | `'Out of Stock'` | Button title | Cart button |
| ``⚠️ Only {{count}} available...`` | `'Only {{stock}} left in stock. Hurry!'` | Modal low stock | Low stock modal |
| ``{{size}} size is out of stock`` | `'This size is no longer available.'` | Invalid selection | Toast |
| ``Only {{count}} available...`` | `'Only {{stock}} left in stock.'` | Quantity validate | Toast |

### Cart Page (cart.html)

| Old Message | New Message | Trigger | Location |
|-----------|-----------|---------|---------|
| ``{{stock}} available in stock...`` | `'{{stock}} in stock'` | Normal display | Cart item row |
| ``⚠️ Only {{stock}} available...`` | `'Only {{stock}} left in stock. Hurry!'` | Low stock display | Cart item row |
| `'Stock info unavailable'` | `'Stock information unavailable'` | Missing variant data | Cart item row |
| ``Cannot set quantity to {{qty}}...`` | `'Only {{max}} available. Quantity updated.'` | Quantity validation | Toast |
| ``Only {{max}} {{name}}...`` | `'Only {{max}} available.'` | Quantity exceeded | Toast |

### Checkout Page (checkout.html)

| Old Message | New Message | Trigger | Location |
|-----------|-----------|---------|---------|
| ``⚠️ Item is now out of stock`` | `'This item is now out of stock and has been removed from your cart.'` | Real-time OOS | Real-time alert |
| ``These items are now out of stock: {{list}}...`` | `'One or more items are no longer available in the selected quantity.'` | Pre-submit validation | Toast error |

### Stock Status Badges

| Old | New | When |
|-----|-----|------|
| "In Stock" | "In Stock" | stock > 5 |
| "Low Stock" | "Limited Stock" | 1 ≤ stock ≤ 5 |
| "Out of Stock" | "Out of Stock" | stock = 0 |

### Button Text

| State | Old | New |
|-------|-----|-----|
| In Stock | "Add to Cart" | "Add to Cart" |
| Low Stock | "Add to Cart" (+ warning) | "Add to Cart" (+ "Limited Stock" badge) |
| Out of Stock | "Out of Stock" | "Out of Stock" |

---

## Implementation Steps

1. **product.html** - Update stock badge messages
2. **shop.html** - Update modal and button messages
3. **cart.html** - Update cart display messages
4. **checkout.html** - Update validation messages
5. **index.html** - Update featured products
6. **product-stock-updates.js** - Update real-time handlers
7. **cart-drawer.js** - Update drawer notifications
8. **checkout-integration.js** - Update error display (ALREADY DONE)
9. **Backend files** - Update API error messages
10. **Test all pages** - Verify consistency

---

## Notes

- Keep all variable interpolation syntax consistent
- Use exact messages provided - no variations
- Maintain notification type consistency (error/warning/info)
- Ensure fallback messages work properly
- Test undefined/null stock values

