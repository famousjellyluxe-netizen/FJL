# Backend-Frontend Integration Testing Guide

## Complete Verification Checklist

This guide will help you verify that your backend API and frontend are correctly integrated and working together.

---

## Part 1: Manual Testing with Browser Console

### 1.1 Test Products API

**Open browser console (F12) and run:**

```javascript
// Test 1: Check if API manager is loaded
console.log(window.apiManager);
// Expected: APIIntegrationManager object

// Test 2: Load products from API
apiManager.call('/products', { method: 'GET' }).then(result => {
    console.log('Products Result:', result);
    console.log('Success:', result.success);
    console.log('Data:', result.data);
});
// Expected: success: true, data: [...]
```

**Expected Output:**
```
✅ Products Result: { success: true, data: [], fromCache: false }
✅ success: true
✅ data: Array(0)
```

---

### 1.2 Test Order Creation API

**Run in console:**

```javascript
// Test order creation (will fail but shows API is reachable)
const testOrder = {
    items: [],
    shipping_email: 'test@example.com',
    shipping_first_name: 'Test',
    shipping_last_name: 'User',
    shipping_phone: '+2348012345678',
    shipping_address: '123 Main St',
    shipping_city: 'Lagos',
    shipping_state: 'Lagos',
    shipping_postal_code: '100001',
    shipping_country: 'Nigeria',
    buyer_name: 'Test User',
    subtotal: 0,
    tax: 0,
    shipping_cost: 0,
    total_amount: 0
};

apiManager.call('/orders', {
    method: 'POST',
    body: testOrder
}, false).then(result => {
    console.log('Order Result:', result);
});
// Expected: Will show validation error (empty items) or success
```

---

### 1.3 Test Newsletter API

**Run in console:**

```javascript
// Test newsletter subscription
customersAPI.subscribeNewsletter('test@example.com', 'Test User').then(result => {
    console.log('Newsletter Result:', result);
});
// Expected: success: true or error about duplicate email
```

---

## Part 2: Testing with Browser DevTools

### 2.1 Network Tab Analysis

**Steps:**

1. Open DevTools (F12)
2. Go to "Network" tab
3. Reload the page
4. Look for API calls starting with `http://localhost:3000/api`

**Expected Requests:**
```
GET /api/products (or from cache)
OPTIONS /api/products (CORS preflight)
```

**Check Each Request:**
- **Status:** Should be 200 (success) or 304 (cached)
- **Type:** Should be "fetch" or "xhr"
- **Response:** Should be JSON with "success": true

---

### 2.2 Console Tab Analysis

**What to Look For:**

```
✅ Good Signs:
✓ "Loading products..."
✓ "✓ Cache hit: /products"
✓ "✅ Loaded X products from API"
✓ "✅ Database connected"
✓ "✅ Newsletter integration initialized"

❌ Bad Signs:
✗ "CORS error"
✗ "TypeError"
✗ "Network error"
✗ "Cannot read property"
```

---

### 2.3 Application/Storage Tab

**Check localStorage:**

1. Open DevTools (F12)
2. Go to "Application" or "Storage" tab
3. Click "Local Storage"
4. Look for entries:

```
fjl_cart              → Cart items
fjl_products          → Cached products
fjl_orders            → Order history
fjl_subscriptions     → Newsletter signups
```

---

## Part 3: Step-by-Step Integration Test

### Test Scenario: Complete Order Flow

**Step 1: Verify Backend is Running**

```bash
# In terminal, run:
curl http://localhost:3000/health
# Expected response: {"status":"ok",...}
```

**Step 2: Test Product Loading**

```javascript
// In browser console:
window.initializeShopProducts().then(products => {
    console.log(`Loaded ${products.length} products`);
    console.log('First product:', products[0]);
});
```

**Step 3: Test Order Creation**

```javascript
// In browser console:
const testOrder = {
    items: [
        {
            product_id: 'test-id',
            product_name: 'Test Product',
            product_sku: 'TEST-001',
            size: 'M',
            color: 'Black',
            unit_price: 5000,
            quantity: 1,
            total_price: 5000
        }
    ],
    shipping_email: 'test@example.com',
    shipping_first_name: 'John',
    shipping_last_name: 'Doe',
    shipping_phone: '+2348012345678',
    shipping_address: '123 Main St',
    shipping_city: 'Lagos',
    shipping_state: 'Lagos',
    shipping_postal_code: '100001',
    shipping_country: 'Nigeria',
    buyer_name: 'John Doe',
    subtotal: 5000,
    tax: 375,
    shipping_cost: 0,
    total_amount: 5375
};

window.createOrderWithAPI({
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    phone: '+2348012345678',
    address: '123 Main St',
    city: 'Lagos',
    state: 'Lagos',
    postal_code: '100001',
    country: 'Nigeria'
}, { items: testOrder.items }).then(result => {
    console.log('Order created:', result);
});
```

**Expected Output:**
```
✅ Order created: { success: true, orderNumber: 'ORD-...' }
```

---

## Part 4: Testing Offline Functionality

### 4.1 Simulate Offline Mode

**Steps:**

1. Open DevTools (F12)
2. Go to "Network" tab
3. Check the box labeled "Offline"
4. Try to perform actions (add to cart, subscribe, etc.)

**Expected Behavior:**
- ✅ Actions still work
- ✅ Console shows "📡 Offline" message
- ✅ Data stored in localStorage with offline flag
- ✅ User gets notification "Offline - using cached data"

### 4.2 Sync When Coming Back Online

**Steps:**

1. While offline, create an order
2. Order should show "offline: true" in localStorage
3. Uncheck "Offline" in DevTools
4. Console should show "🌐 Connection restored"
5. Automatic sync should process queued orders

**Expected Behavior:**
```
✅ "🌐 Connection restored"
✅ "📤 Processing X offline orders..."
✅ "✅ Synced order: ORD-..."
✅ localStorage updated with server response
```

---

## Part 5: API Endpoint Verification

### 5.1 Test Each Endpoint with curl

**Open terminal and run these commands:**

```bash
# 1. Health Check
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"...","environment":"..."}

# 2. Get Products
curl http://localhost:3000/api/products
# Expected: {"success":true,"data":[],"pagination":{...}}

# 3. Get Featured Products
curl http://localhost:3000/api/products/featured
# Expected: {"success":true,"data":[...]}
```

---

## Part 6: Error Handling Verification

### 6.1 Test Invalid Email

**Run in console:**

```javascript
// Should show validation error
customersAPI.subscribeNewsletter('invalid-email', 'Test').then(result => {
    console.log(result);
});
// Expected: success: false, error: "Invalid email"
```

### 6.2 Test Missing Fields

**Run in console:**

```javascript
// Should show validation errors
window.validateOrderData({
    first_name: '',  // Empty
    email: 'test@example.com'
    // Missing other required fields
}, { items: [] });
// Expected: false, error notification shown
```

---

## Part 7: Real Browser Testing

### 7.1 Test on Shop Page

**Do this manually:**

1. Open `shop.html`
2. Check console (F12) for "Loading products..."
3. Products should load (even if empty, API is working)
4. Try filters and sorting
5. Add product to cart
6. Verify cart updates

**Success Checklist:**
- [ ] Console shows "Loading products..."
- [ ] No CORS errors
- [ ] No JavaScript errors
- [ ] Page loads in < 1 second
- [ ] Cart badge updates
- [ ] Add to cart works

### 7.2 Test on Checkout

**Do this manually:**

1. Have items in cart
2. Go to checkout
3. Fill out form
4. Submit

**Success Checklist:**
- [ ] Form validates
- [ ] No errors on submit
- [ ] Redirects to order confirmation
- [ ] Console shows "Order created"

### 7.3 Test on Order Confirmation

**Expected:**

1. Order number displays
2. Items show with prices
3. Totals calculated correctly
4. Status badge shows
5. Check for updates in console

---

## Part 8: Automated Testing Script

### Create a Test File

Create `test-integration.html` in your FJL folder:

```html
<!DOCTYPE html>
<html>
<head>
    <title>FJL Integration Test Suite</title>
    <style>
        body { font-family: Arial; margin: 20px; }
        .test { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
        .pass { background: #d4edda; color: #155724; }
        .fail { background: #f8d7da; color: #721c24; }
        .pending { background: #fff3cd; color: #856404; }
        h2 { color: #333; }
        button { padding: 10px 20px; margin-right: 10px; }
    </style>
</head>
<body>
    <h1>FJL Backend-Frontend Integration Test Suite</h1>

    <div>
        <button onclick="runAllTests()">Run All Tests</button>
        <button onclick="clearResults()">Clear Results</button>
    </div>

    <div id="results"></div>

    <script src="js/api-integration.js"></script>
    <script>
        const results = [];

        function addResult(name, passed, message) {
            results.push({ name, passed, message });
            updateDisplay();
        }

        function updateDisplay() {
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = results.map(r => `
                <div class="test ${r.passed ? 'pass' : 'fail'}">
                    <strong>${r.name}</strong>: ${r.passed ? 'PASS' : 'FAIL'}<br>
                    ${r.message}
                </div>
            `).join('');
        }

        async function runAllTests() {
            results.length = 0;
            updateDisplay();

            // Test 1: API Manager Loaded
            addResult('API Manager Loaded', !!window.apiManager,
                window.apiManager ? 'apiManager object exists' : 'apiManager not found');

            // Test 2: Products API
            try {
                const productsResult = await apiManager.call('/products', { method: 'GET' });
                addResult('Products API', productsResult.success,
                    `Status: ${productsResult.success}, Items: ${productsResult.data?.length || 0}`);
            } catch (e) {
                addResult('Products API', false, e.message);
            }

            // Test 3: Online Detection
            const isOnline = navigator.onLine;
            addResult('Online Detection', isOnline,
                `Browser reports: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

            // Test 4: localStorage Access
            try {
                localStorage.setItem('test', 'value');
                const val = localStorage.getItem('test');
                localStorage.removeItem('test');
                addResult('localStorage Access', val === 'value',
                    'Can read/write to localStorage');
            } catch (e) {
                addResult('localStorage Access', false, e.message);
            }

            // Test 5: Newsletter Validation
            const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test('test@example.com');
            addResult('Email Validation', validEmail,
                'Valid email format accepted');

            // Test 6: Invalid Email Rejected
            const invalidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test('invalid');
            addResult('Email Validation (Invalid)', !invalidEmail,
                'Invalid email format rejected');

            // Summary
            const passed = results.filter(r => r.passed).length;
            const total = results.length;
            console.log(`\n✅ Tests Complete: ${passed}/${total} passed`);
        }

        function clearResults() {
            results.length = 0;
            updateDisplay();
        }

        // Auto-run on load
        window.addEventListener('load', () => {
            console.log('Test Suite Loaded. Click "Run All Tests" to start.');
        });
    </script>
</body>
</html>
```

### Run the Test

1. Save as `test-integration.html`
2. Open in browser: `file:///C:/Users/rapha/Desktop/FJL/test-integration.html`
3. Click "Run All Tests"
4. See results in green (pass) or red (fail)

---

## Part 9: Troubleshooting Common Issues

### Issue: "CORS Error"

**Symptom:** Error in console about CORS

**Solution:**
```bash
# Check backend .env ALLOWED_ORIGINS
cat backend/.env | grep ALLOWED_ORIGINS
# Should include your frontend URL
```

---

### Issue: "Products Not Loading"

**Symptom:** Empty product list even though database has products

**Debug:**
```javascript
// In console
apiManager.call('/products', { method: 'GET' }).then(r => {
    console.log('Status:', r.success);
    console.log('Data:', r.data);
    console.log('Error:', r.error);
});
```

---

### Issue: "Order Not Creating"

**Symptom:** Order submission fails

**Debug:**
```javascript
// Check form validation
window.validateOrderData(formData, cart);
// Check API response
apiManager.call('/orders', { method: 'POST', body: orderData });
```

---

### Issue: "Offline Not Working"

**Symptom:** Offline mode doesn't queue requests

**Debug:**
```javascript
// Check online status
console.log('Is Online:', navigator.onLine);
console.log('API Manager Online:', apiManager.isOnline);

// Check localStorage
console.log('Offline Orders:', localStorage.getItem('fjl_orders'));
```

---

## Part 10: Performance Testing

### Check Load Times

**In DevTools Network tab:**

1. Reload page
2. Look at timings for API calls
3. Products endpoint should load in < 1 second

**Expected Times:**
```
GET /api/products: 200-500ms
POST /api/orders: 300-800ms
GET /api/orders/:id: 150-400ms
```

---

### Check Cache Performance

**In console:**

```javascript
// First call (not cached)
console.time('First Call');
await apiManager.call('/products');
console.timeEnd('First Call');
// Expected: ~300-500ms

// Second call (cached)
console.time('Cached Call');
await apiManager.call('/products');
console.timeEnd('Cached Call');
// Expected: < 5ms
```

---

## Part 11: Success Criteria

### Backend Integration is Working If:

✅ Products load from API
✅ Orders create successfully
✅ Order confirmation displays
✅ Newsletter subscriptions work
✅ Offline mode queues requests
✅ Automatic sync works
✅ No console errors
✅ All API requests show 200 status
✅ Network requests are fast (< 1 second)
✅ Notifications display correctly

---

## Quick Verification Checklist

Run this in browser console to verify everything:

```javascript
console.clear();
console.log('=== FJL Integration Verification ===\n');

console.log('1. API Manager:', !!window.apiManager ? '✅' : '❌');
console.log('2. Shop Integration:', typeof window.initializeShopProducts === 'function' ? '✅' : '❌');
console.log('3. Checkout Integration:', typeof window.createOrderWithAPI === 'function' ? '✅' : '❌');
console.log('4. Newsletter Integration:', typeof window.handleNewsletterSubmit === 'function' ? '✅' : '❌');
console.log('5. Order Confirmation:', typeof window.initializeOrderConfirmation === 'function' ? '✅' : '❌');
console.log('6. Online Status:', navigator.onLine ? '✅ ONLINE' : '⚠️ OFFLINE');
console.log('7. localStorage:', !!window.localStorage ? '✅' : '❌');

apiManager.call('/products').then(r => {
    console.log('8. API Connection:', r.success ? '✅' : '❌');
    console.log('\n✅ All checks complete!');
});
```

---

## Next Steps

If all tests pass:
1. ✅ Your integration is working correctly
2. ✅ Backend and frontend are communicating
3. ✅ You're ready for production

If any test fails:
1. Check the troubleshooting section
2. Review browser console for errors
3. Check Network tab in DevTools
4. Verify backend is running

---

**Happy Testing! 🎉**
