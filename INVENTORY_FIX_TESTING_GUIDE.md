# Inventory Fix - Testing Guide

## Quick Summary

**Problem Fixed:** Products showed "Out of stock" on product detail page even though they were available on shop page.

**Root Cause:** Product detail page was using stale default database instead of live inventory data, and validation was inconsistent between the two pages.

**Solution:** Both pages now validate against the same live inventory source (`localStorage['fjl_products']`) using `adminDataService.checkInventory()`.

---

## Testing Checklist

### Prerequisites
- [ ] Admin panel is accessible (admin@fjl.com / admin123)
- [ ] Shop page loads correctly
- [ ] Product detail pages load correctly
- [ ] localStorage is enabled

### Test 1: Basic Shop Page Add to Cart

**Steps:**
1. Go to shop.html
2. Click "Add to Cart" on any product
3. Select a size with stock (should be enabled)
4. Click "Add to Cart" in modal
5. Verify item appears in cart

**Expected Result:** ✅ Item added successfully, cart badge updates

---

### Test 2: Basic Product Detail Page Add to Cart

**Steps:**
1. Go to shop.html
2. Click on product name/image to open product detail page
3. Click "Add to Cart" button
4. Select a size with stock
5. Click "Add to Cart"
6. Verify item appears in cart

**Expected Result:** ✅ Item added successfully (Previously failed with "Out of stock" error)

---

### Test 3: Inventory Consistency Across Pages

**Steps:**
1. In admin panel, create a product with specific inventory:
   - Product Name: "Test Item"
   - Size M: 3 units
   - Size L: 0 units (out of stock)

2. Go to shop.html
3. Find "Test Item" product
4. Click "Add to Cart"
5. In modal:
   - Verify M is enabled, L is disabled
   - Select M, quantity 1
   - Click "Add to Cart" → ✅ Should succeed
   - Click "Add to Cart" again
   - Select M, quantity 3 → ✅ Should succeed (3 total units available)
   - Try quantity 4 → ❌ Should fail with "Only 3 items available"

6. Go to product detail page for "Test Item"
7. Verify same behavior:
   - M is enabled, L is disabled
   - Can add qty 1 → ✅
   - Cannot add qty 3 (already 3 in cart) → ❌

**Expected Result:** ✅ Both pages enforce same inventory limits

---

### Test 4: Out of Stock Product

**Steps:**
1. In admin, update product inventory to 0 for all sizes
2. Go to shop.html
3. Find product
4. Click "Add to Cart" → Button should be disabled or show "Out of Stock"
5. Go to product detail page
6. All size buttons should be disabled
7. Try clicking "Add to Cart" → Should show error

**Expected Result:** ✅ Both pages block "Out of Stock" products

---

### Test 5: Admin Update Reflects Immediately

**Steps:**
1. Open product.html in browser for "Test Product"
2. Open admin panel in another window
3. Update "Test Product" inventory (increase stock)
4. Back in product.html - storage event should trigger reload
5. Check if newly available sizes become enabled

**Expected Result:** ✅ Real-time update without page refresh

---

### Test 6: Multiple Sizes

**Product:** FJG Tracksuit (has multiple sizes)

**Steps:**
1. In admin, set inventory:
   - XS: 0
   - S: 5
   - M: 3
   - L: 10
   - XL: 2
   - XXL: 0

2. On shop.html modal:
   - XS, L, XXL should be enabled (have stock) ✅
   - Wait... the example shows XS: 0, so XS should be disabled

3. Try to add:
   - S qty 5 → ✅ Success (exactly at limit)
   - M qty 4 → ❌ Fail ("Only 3 available")
   - L qty 10 → ✅ Success
   - XL qty 3 → ❌ Fail ("Only 2 available")

4. Repeat on product detail page - same results

**Expected Result:** ✅ Correct inventory validation per size

---

### Test 7: Cart Deduction Accuracy

**Steps:**
1. In admin, set product A inventory to 5 units (size M)
2. Add product A qty 2 from shop page
3. Check admin panel - inventory should now be 3
4. Add product A qty 1 from product detail page
5. Check admin panel - inventory should now be 2
6. Try to add qty 3 from shop page → ❌ Should fail ("Only 2 available")

**Expected Result:** ✅ Inventory deducts correctly after each cart addition

---

### Test 8: Error Messages are Clear

**Steps:**
1. Create scenario where inventory is exactly 1
2. Try to add qty 2
3. Check error message

**Expected Result:** ✅ Error says "Only 1 item available" (or similar - clear, specific)

---

### Test 9: Cart Does Not Exceed Inventory

**Setup:** Product has 10 units available

**Steps:**
1. Add qty 7 from shop page
2. Go to product detail page
3. Try to add qty 5 → ❌ Should fail ("Only 3 available")

**Expected Result:** ✅ Total cart quantity never exceeds available inventory

---

### Test 10: Edge Case - Exactly At Limit

**Setup:** Product has 5 units available, cart is empty

**Steps:**
1. Try to add qty 5 → ✅ Success
2. Try to add qty 1 more → ❌ Fail

**Expected Result:** ✅ Can add exactly available quantity, no more

---

## Debugging Tips

### If Test Fails

1. **Check console errors:** Open browser DevTools (F12), go to Console
2. **Check localStorage:** In DevTools Console, run:
   ```javascript
   JSON.parse(localStorage.getItem('fjl_products'))
   .find(p => p.id === 'product-id').sizeInventory
   ```
3. **Verify adminDataService:** Check if it's loaded:
   ```javascript
   typeof adminDataService !== 'undefined' // Should be true
   ```
4. **Check cart:** See what's in cart:
   ```javascript
   JSON.parse(localStorage.getItem('fjl_cart'))
   ```

### Common Issues

| Issue | Check |
|-------|-------|
| Products always show as out of stock | localStorage product data missing inventory |
| Shop page works but product page fails | product.html not syncing live inventory |
| Inventory not updating after admin change | storage event listener not working |
| Cart exceeds available stock | adminDataService.deductInventory() not called |

---

## Performance Checks

### Should Be Fast
- ✅ Modal opening: < 500ms
- ✅ Inventory validation: < 100ms (reads from cache)
- ✅ Cart addition: < 300ms
- ✅ Real-time sync: immediate (via storage event)

### Should NOT cause lag
- ✅ No API calls (localStorage only in current version)
- ✅ No DOM manipulation overhead
- ✅ No synchronous blocking operations

---

## Browser Compatibility

Test in:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

All use standard Web APIs:
- localStorage
- CustomEvent
- Array methods (find, filter, etc.)

---

## Regression Testing

### Ensure No Breaking Changes

1. **Existing functionality preserved:**
   - [ ] Cart add/remove works
   - [ ] Quantity increment/decrement works
   - [ ] Cart total calculation correct
   - [ ] Checkout process unchanged

2. **Admin panel still works:**
   - [ ] Can create products
   - [ ] Can edit products
   - [ ] Can update inventory
   - [ ] Changes reflect in storefront

3. **No new console errors:**
   - [ ] No JavaScript errors on load
   - [ ] No missing resources (404s)
   - [ ] No CORS errors

---

## Acceptance Criteria

### The Fix is Successful When:

✅ **Shop Page:** User can add products to cart respecting inventory limits

✅ **Product Detail Page:** User can add same products with same limits

✅ **Consistency:** Both pages enforce identical inventory rules

✅ **Real-Time:** Admin updates immediately visible in storefront

✅ **Error Handling:** Clear, specific error messages when out of stock

✅ **No Regressions:** All existing functionality works

✅ **Performance:** No slowdowns or lag introduced

---

## Rollback Plan (if needed)

If issues arise:
```bash
# Go back to previous version
git revert 7de715c

# Or manually restore from backup
git checkout HEAD~1 -- product.html shop.html
```

---

## Contact & Documentation

- Full technical documentation: `INVENTORY_FIX_DOCUMENTATION.md`
- Commit reference: `7de715c`
- Files modified: `product.html`, `shop.html`
