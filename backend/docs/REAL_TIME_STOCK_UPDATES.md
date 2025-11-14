# Real-Time Stock Updates (FIX-018)

## Overview

Implements Server-Sent Events (SSE) for real-time product stock updates. Clients can subscribe to changes on specific products and receive instant notifications when stock quantities change.

**Technology:** Server-Sent Events (SSE) - Middle ground between polling and WebSocket
- ✅ Real-time updates (no polling delays)
- ✅ Simple HTTP-based (works through firewalls)
- ✅ Lower overhead than WebSocket
- ✅ Automatic reconnection
- ✅ Browser built-in support

## Architecture

### Backend Components

#### `stockUpdateService.js`
Central service managing all SSE connections and stock broadcasts.

**Key Functions:**

- `registerStockUpdateClient(res, productIds)` - Create SSE connection
- `broadcastStockUpdate(productId, stockData)` - Send update to subscribers
- `getProductStock(productId)` - Get current stock (for initialization)
- `sendHeartbeatToAllClients()` - Keep connections alive
- `cleanupStaleConnections()` - Remove dead connections

**Features:**
- In-memory connection tracking
- Debounced updates (500ms) to prevent flooding
- Automatic stale connection cleanup
- Heartbeat mechanism for proxy/firewall compatibility

### Frontend Components

#### `StockUpdateClient.js`
Browser client for consuming real-time stock updates.

**Key Methods:**

```javascript
// Create client
const stockClient = new StockUpdateClient();

// Subscribe to products
await stockClient.subscribe(['product-id-1', 'product-id-2']);

// Listen for updates
stockClient.onStockUpdate((data) => {
  console.log(`Product ${data.productId}: ${data.newQuantity} units`);
});

// Get current stock
const stock = await stockClient.getProductStock('product-id-1');
console.log(stock); // { variants: [...], totalStock: 100 }

// Check stock status
const inStock = stockClient.isInStock('product-id-1', 'variant-id');
const lowStock = stockClient.isLowStock('product-id-1');

// Cleanup
stockClient.disconnect();
```

## API Endpoints

### 1. Subscribe to Stock Updates (SSE Stream)

```
GET /api/products/stock/subscribe?productIds=id1,id2,id3
```

Establishes Server-Sent Events connection for real-time stock updates.

**Query Parameters:**
- `productIds` (optional): Comma-separated product IDs to monitor

**Response:** Streaming event stream (text/event-stream)

**Events:**
```javascript
// Initial stock data
event: initial_stock
data: {
  "type": "initial_stock",
  "productId": "uuid",
  "variants": [
    { "id": "variant-uuid", "size": "M", "color": "Red", "stock_quantity": 10 }
  ],
  "timestamp": 1234567890
}

// Stock change notification
event: stock_update
data: {
  "type": "stock_update",
  "productId": "uuid",
  "variantId": "variant-uuid",
  "newQuantity": 9,
  "oldQuantity": 10,
  "timestamp": 1234567890,
  "lowStock": false
}

// Server heartbeat (keeps connection alive)
:heartbeat
```

**Example (JavaScript):**

```javascript
const eventSource = new EventSource('/api/products/stock/subscribe?productIds=prod-123,prod-456');

eventSource.addEventListener('initial_stock', (e) => {
  const data = JSON.parse(e.data);
  console.log(`Initial stock for ${data.productId}:`, data.variants);
});

eventSource.addEventListener('stock_update', (e) => {
  const data = JSON.parse(e.data);
  console.log(`Stock changed: ${data.newQuantity} units (was ${data.oldQuantity})`);

  if (data.lowStock) {
    console.warn('⚠️ Low stock alert!');
  }
});

eventSource.addEventListener('error', (e) => {
  console.error('Connection error:', e);
  // Browser will auto-reconnect
});
```

### 2. Update Subscriptions

```
POST /api/products/stock/subscribe
Content-Type: application/json

{
  "clientId": "1234567890-abcdef",
  "productIds": ["product-id-1", "product-id-2"]
}
```

Update which products an existing connection monitors.

**Request Body:**
- `clientId` (required): Client ID from subscribe endpoint
- `productIds` (array): Product IDs to monitor

**Response:**
```json
{
  "success": true,
  "message": "Updated subscription to 3 products",
  "clientId": "1234567890-abcdef"
}
```

### 3. Get Product Stock Status

```
GET /api/products/stock/status?productId=product-uuid
```

Get current stock level for a product (snapshot, not real-time).

**Query Parameters:**
- `productId` (required): Product UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "productId": "uuid",
    "variants": [
      {
        "id": "variant-uuid",
        "size": "M",
        "color": "Red",
        "stock_quantity": 10
      }
    ],
    "totalStock": 10,
    "timestamp": 1234567890
  }
}
```

### 4. Get Connection Statistics (Admin Only)

```
GET /api/products/stock/stats
Authorization: Bearer {JWT_TOKEN}
```

Get real-time connection and subscription statistics.

**Authentication:** Required (admin)

**Response:**
```json
{
  "success": true,
  "data": {
    "activeConnections": 15,
    "monitoredProducts": 42,
    "timestamp": 1234567890
  }
}
```

## Frontend Implementation

### Basic Setup

```html
<script type="module">
  import StockUpdateClient from '/js/lib/StockUpdateClient.js';

  // Create client
  const stockClient = new StockUpdateClient('/api');

  // Show product stock
  async function showProductStock(productId) {
    const stock = await stockClient.getProductStock(productId);
    document.getElementById('stock').textContent = stock.totalStock;

    if (stock.totalStock === 0) {
      document.getElementById('add-to-cart').disabled = true;
    }
  }

  // Listen for updates
  stockClient.onStockUpdate((data) => {
    if (data.productId === currentProductId) {
      document.getElementById('stock').textContent = data.newQuantity;

      if (data.lowStock) {
        document.getElementById('stock-warning').style.display = 'block';
      }
    }
  });

  // Subscribe to current product
  await stockClient.subscribe([currentProductId]);

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    stockClient.disconnect();
  });
</script>
```

### Product Listing with Stock Badges

```html
<div id="products" class="grid">
  <!-- Products rendered here -->
</div>

<script type="module">
  import StockUpdateClient from '/js/lib/StockUpdateClient.js';

  const stockClient = new StockUpdateClient('/api');
  const productIds = document.querySelectorAll('[data-product-id]');

  // Get product IDs
  const ids = Array.from(productIds).map(el => el.dataset.productId);

  // Subscribe to all products
  await stockClient.subscribe(ids);

  // Update display on stock change
  stockClient.onStockUpdate((data) => {
    const element = document.querySelector(`[data-product-id="${data.productId}"]`);
    if (element) {
      const badge = element.querySelector('.stock-badge');
      if (badge) {
        badge.textContent = data.newQuantity === 0 ? 'Out of Stock' : `${data.newQuantity} in stock`;
        badge.className = data.newQuantity <= 5 ? 'stock-badge low' : 'stock-badge';
      }
    }
  });
</script>
```

### Shopping Cart Stock Validation

```javascript
async function validateCartStock(cartItems) {
  const productIds = cartItems.map(item => item.productId);

  // Get current stock for all items
  const allStock = {};
  for (const productId of productIds) {
    const stock = await stockClient.getProductStock(productId);
    allStock[productId] = stock;
  }

  // Check each item
  const issues = [];
  for (const item of cartItems) {
    const inStock = allStock[item.productId]?.totalStock || 0;
    if (item.quantity > inStock) {
      issues.push({
        productId: item.productId,
        requested: item.quantity,
        available: inStock
      });
    }
  }

  if (issues.length > 0) {
    console.error('Stock validation failed:', issues);
    return false;
  }

  return true;
}

// When placing order
document.getElementById('place-order-btn').addEventListener('click', async () => {
  const isValid = await validateCartStock(cart.items);
  if (!isValid) {
    alert('Some items are no longer in stock. Please update your cart.');
    return;
  }

  // Proceed with checkout
  submitOrder();
});
```

## Backend Integration

### Triggering Stock Updates

When stock is modified (order placed, stock adjusted, etc.), call:

```javascript
import * as stockUpdateService from '../services/stockUpdateService.js';

// After updating product_variants table
await supabase
  .from('product_variants')
  .update({ stock_quantity: newQuantity })
  .eq('id', variantId);

// Broadcast update to all subscribed clients
stockUpdateService.broadcastStockUpdate(productId, {
  variant_id: variantId,
  product_id: productId,
  new_quantity: newQuantity,
  old_quantity: oldQuantity
});
```

### Server Initialization

In your main app.js/index.js:

```javascript
import * as stockUpdateService from './services/stockUpdateService.js';

// Initialize maintenance tasks (heartbeat, cleanup)
const stopMaintenance = stockUpdateService.initializeMaintenanceTasks();

// On graceful shutdown
process.on('SIGTERM', () => {
  stopMaintenance();
  // ... other cleanup
});
```

## Performance Considerations

### Debouncing

Stock updates are debounced (500ms) to prevent network flooding if multiple orders are placed rapidly.

```javascript
// Multiple orders in quick succession:
// T=0ms:   Order 1 → triggers update (queued)
// T=50ms:  Order 2 → update debounced (queued)
// T=100ms: Order 3 → update debounced (queued)
// T=500ms: All updates sent to subscribers in single batch
```

### Heartbeat

Server sends `:heartbeat` every 30 seconds to:
- Keep connection alive through firewalls/proxies
- Detect dead connections

### Connection Cleanup

Stale connections (no activity for 5 minutes) are automatically closed to free memory.

## Scalability

### Single Server
- ✅ Good for < 1000 concurrent clients
- ✅ Simple in-memory connection tracking
- ✅ No database queries for updates

### Multiple Servers (Load Balanced)
For multi-server deployment, implement Redis-based pub/sub:

```javascript
// In stockUpdateService.js
import redis from 'redis';

const pubClient = redis.createClient();
const subClient = redis.createClient();

export async function broadcastStockUpdate(productId, stockData) {
  // Publish to Redis channel
  await pubClient.publish(`stock:${productId}`, JSON.stringify(stockData));
}

// Subscribe to Redis on startup
subClient.subscribe(`stock:*`, (message, channel) => {
  const productId = channel.replace('stock:', '');
  const stockData = JSON.parse(message);
  sendStockUpdateToSubscribers(productId, stockData);
});
```

## Testing

### Manual Browser Test

```javascript
// Open browser console on product page

// Create client
const stockClient = new StockUpdateClient();

// Subscribe to all products
const productIds = ['product-id-1', 'product-id-2'];
await stockClient.subscribe(productIds);

// Watch for updates
stockClient.onStockUpdate((data) => {
  console.log('📡 Stock update:', data);
});

// Simulate stock change from another terminal:
// curl -X PUT http://localhost:5001/api/products/variants/variant-id \
//   -H "Authorization: Bearer $TOKEN" \
//   -H "Content-Type: application/json" \
//   -d '{"stock_quantity": 5}'

// Should see update appear in console
```

### Load Test

```bash
# Test with 100 concurrent clients
ab -c 100 -t 60 "http://localhost:5001/api/products/stock/subscribe?productIds=id1,id2"

# Monitor connection stats
while true; do
  curl http://localhost:5001/api/products/stock/stats
  sleep 1
done
```

## Troubleshooting

### Connections Not Receiving Updates

1. **Check subscription:** Verify product IDs are correct
2. **Check server logs:** Look for "Stock update broadcast" messages
3. **Verify route ordering:** `/stock/subscribe` must come before `/`

### Stale Connections

Connections are cleaned up after 5 minutes of inactivity. If clients aren't receiving heartbeats:
- Check firewall/proxy timeout settings
- Reduce `DEBOUNCE_DELAY_MS` if updates seem slow

### High Memory Usage

If memory grows unbounded:
1. Check `cleanupStaleConnections()` is running
2. Verify clients are properly calling `disconnect()`
3. Check for connection leaks in event listeners

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome 26+ | ✅ Full |
| Firefox 6+ | ✅ Full |
| Safari 5.1+ | ✅ Full |
| Edge 17+ | ✅ Full |
| IE | ❌ Not supported |

## Security

- ✅ No authentication required for stock subscribe (public data)
- ✅ Admin stats endpoint requires `verifyJWT + requireAdmin`
- ✅ Updates are read-only (can't modify stock via SSE)
- ✅ Debouncing prevents network-based DoS

## Migration from Polling

If you currently have polling code:

**Before (5-minute cache):**
```javascript
// Poll every 5 minutes for stock changes
setInterval(async () => {
  const response = await fetch('/api/products/stock/status?productId=...');
  updateUI(response.data);
}, 5 * 60 * 1000);
```

**After (real-time):**
```javascript
import StockUpdateClient from '/js/lib/StockUpdateClient.js';

const stockClient = new StockUpdateClient();
await stockClient.subscribe(['product-id']);

stockClient.onStockUpdate((data) => {
  updateUI(data);
});
```

## Related Issues

- **FIX-017:** Product colors/sizes normalization (required for efficient variant queries)
- **FIX-022:** Error logging (logs connection errors)
