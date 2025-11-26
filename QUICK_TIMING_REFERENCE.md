# Quick Timing Reference Table

## How Long Until Changes Appear on Client?

### ⚡ FAST (Real-Time Stock Updates)

| Operation | Same Tab | Other Tabs | Network | Details |
|-----------|----------|-----------|---------|---------|
| **Reduce stock from order** | <500ms | <100ms | SSE | Server-Sent Events, 500ms debounce |
| **Manually update variant stock (admin)** | <500ms | <100ms | SSE | Real-time, broadcasts to all tabs |
| **Update order status** | <500ms | <100ms | SSE | If stock was affected |

**Mechanism**: Server-Sent Events (SSE) with 500ms debounce
- **File**: `backend/src/services/stockUpdateService.js:22`
- **Frontend**: `frontend/js/lib/StockUpdateClient.js`

---

### 🐢 SLOW (Cache-Based Updates)

| Operation | Same Tab | Other Tabs | Must Do | Details |
|-----------|----------|-----------|---------|---------|
| **Add product** | 5-10 min | 5-10 min | Refresh or wait | localStorage TTL expires |
| **Delete product** | 5-10 min | 5-10 min | Refresh or wait | localStorage TTL expires |
| **Edit product (name, price, desc, images)** | 5-10 min | 5-10 min | Refresh or wait | Cache invalidation missing |
| **Add variant** | 5-10 min | 5-10 min | Refresh or wait | Product detail page cache |
| **Delete variant** | 5-10 min | 5-10 min | Refresh or wait | Product detail page cache |
| **Add category** | 5-10 min | 5-10 min | Refresh or wait | Category cache TTL |
| **Delete category** | 5-10 min | 5-10 min | Refresh or wait | Category cache TTL |

**Mechanism**: 5-minute TTL caching
- **File**: `js/api-integration.js:15` → `CACHE_DURATION = 5 * 60 * 1000`
- **Backend**: `backend/src/utils/cache.js` → automatic TTL expiration

**To Speed Up**:
```javascript
// Press these keys in browser console:
localStorage.clear()  // Clear all caches
location.reload()     // Refresh page
```

---

## Detailed Breakdown

### Stock Updates (REAL-TIME - SSE)

```
Timeline for "Reduce Stock from Order"

T+0ms:    Order placed
          ↓
T+0ms:    Stock deducted in product_variants table
          ↓
T+0ms:    broadcastStockUpdate() called
          ↓
T+0-500ms: Debounce timer running (to batch updates)
          ↓
T+500ms:  SSE message sent to all subscribed clients
          ↓
T+501ms:  Client A receives SSE event
          ↓
T+502ms:  Frontend updates UI (buttons, stock badge)
          ↓
T+503ms:  localStorage updated with new stock
          ↓
T+504ms:  Storage event triggered on other tabs
          ↓
T+505ms:  Other tabs (B, C) receive update via storage event
          ↓
T+506ms:  Other tabs update UI
```

**Total Time**: <1 second same tab, <100ms other tabs
**Cross-Device**: Requires page refresh for manual fetch

---

### Product/Category Updates (CACHE-BASED)

```
Timeline for "Add Product"

T+0ms:    Admin clicks "Create Product"
          ↓
T+0ms:    POST /api/products sent to backend
          ↓
T+10ms:   Server saves to database ✓
          ↓
T+20ms:   Response sent to admin panel
          ↓
T+100ms:  Admin sees product in admin dashboard
          ↓
T+100ms:  Other users on shop page see OLD product list
          ↓
          ... (5 minutes later) ...
          ↓
T+5min:   localStorage cache expires
          ↓
T+5min:   Next user interaction triggers API call
          ↓
T+5min+100ms: Shop refreshed with new product list
```

**Total Time**: 5-10 minutes
**Why**: `CACHE_DURATION = 5 * 60 * 1000` in api-integration.js

---

### Cross-Tab Synchronization (localStorage)

```
Timeline for "Stock Update Across Tabs"

Tab A (product.html) - User viewing product
  └─ Receives SSE: stock reduced from 10 → 9
  │
  ├─> Updates window.currentProduct.variants[0].stock_quantity = 9
  │
  ├─> localStorage.setItem('fjl_sync_product-123', {...})  [5ms]
  │
  └─> All other tabs get storage event [10-20ms]

Tab B (shop.html) - User on shop page
  ├─ Receives storage event [10-20ms]
  │
  ├─> Updates cached product in memory
  │
  └─> UI reflects new stock [20-50ms]

Tab C (cart.html) - User on cart
  ├─ Receives storage event [10-20ms]
  │
  └─> Validates cart against new inventory
```

**Total Time**: <100ms between tabs
**Mechanism**: localStorage storage events (localStorage event in Data Sync Bus)

---

## When to Expect Updates

### Immediate (Real-Time)
- ✅ Stock decreases from order
- ✅ Manual stock updates by admin
- ✅ Updates visible in same browser tab instantly
- ✅ Updates broadcast to other tabs in <100ms

### Eventually (5-10 minutes)
- ⏳ New products visible on shop
- ⏳ Deleted products disappear
- ⏳ Product name/price changes
- ⏳ Variant additions/deletions
- ⏳ Category changes

### Manual Refresh Required
- 🔄 Click browser refresh (Ctrl+R or F5)
- 🔄 Clear cache: `localStorage.clear()` then refresh
- 🔄 Hard refresh (Ctrl+Shift+R or Cmd+Shift+R on Mac)

---

## Cache TTL Configuration

| Component | TTL | Location |
|-----------|-----|----------|
| Backend Cache | 5 minutes | `backend/src/utils/cache.js:7` |
| Frontend API Cache | 5 minutes | `js/api-integration.js:15` |
| localStorage Cache | Persistent* | `js/shop-integration.js:148` |
| Lightweight API Response | 5 minutes | `backend/src/routes/products.js:75` |
| Product Detail Response | No Cache | `backend/src/routes/products.js:128` |
| Stock Status Response | No Cache | `backend/src/routes/products.js:452` |

*localStorage persists until manually cleared or browser storage wiped

---

## SSE Fallback to Polling

**When SSE Fails**:
1. SSE connection attempt fails
2. Retries with exponential backoff (up to 5 attempts)
3. Switches to polling mode
4. Polls every **10 seconds** for updates

**Polling Interval**: 10 seconds
**Location**: `frontend/js/lib/StockUpdateClient.js:48`

```javascript
this.pollingDelay = 10000; // 10 seconds
```

**Fallback Timeline**:
```
T+0:     SSE connection attempt
T+1s:    Retry #1 (wait 1s)
T+3s:    Retry #2 (wait 2s)
T+7s:    Retry #3 (wait 4s)
T+15s:   Retry #4 (wait 8s)
T+31s:   Retry #5 (wait 16s)
T+47s:   Give up, switch to polling
T+57s:   First poll (10s interval)
T+67s:   Second poll
```

**Timing in Polling Mode**: 0-10 seconds between updates

---

## Recommended Best Practices

### For Admin Operations
1. **After adding/editing/deleting products**:
   - Wait 5 minutes, OR
   - Tell users to refresh browser (F5), OR
   - Implement cache invalidation in admin panel

2. **For immediate reflection**:
   - Admin should manually call: `localStorage.clear()`
   - Then notify customers: "New products available, please refresh"

### For Users
1. **If you don't see new products**:
   - Refresh browser (Ctrl+R)
   - Wait 5 minutes
   - Check stock on product page (always fresh)

2. **Stock updates are always real-time**:
   - No refresh needed
   - Happens automatically
   - Works offline (queued until online)

---

## FAQ

**Q: Why is "Add Product" slow?**
A: Products are cached for 5 minutes to reduce database load. Cache expires automatically after 5 minutes.

**Q: Can I make it faster?**
A: Yes:
1. Admin: Manual cache clear + notify users
2. Code: Add cache invalidation when product is updated
3. Advanced: Real-time product updates via SSE (like stock)

**Q: Why is stock update instant but product add is slow?**
A: Stock uses Server-Sent Events (real-time), products use HTTP caching (optimized for scalability).

**Q: How do other tabs know about updates?**
A: Via localStorage storage events and DataSyncBus event emitter. Updates broadcast <100ms.

**Q: What happens offline?**
A: Requests are queued. When you reconnect, updates process in order.

**Q: Can I clear cache manually?**
A: Yes:
```javascript
// In browser console:
localStorage.clear()
location.reload()
```

---

## Performance Summary

| Metric | Value | Status |
|--------|-------|--------|
| Stock update latency | <500ms | ✅ Excellent |
| Cross-tab sync time | <100ms | ✅ Excellent |
| Product list cache | 5 min | ⚠️ By design (load balancing) |
| Polling fallback | 10s | ✅ Good |
| Offline queueing | Works | ✅ Good |
| Browser cache | Auto | ✅ Good |

---

**Last Updated**: 2025-11-25
**Accuracy**: Based on actual code analysis
**Version**: 1.0
