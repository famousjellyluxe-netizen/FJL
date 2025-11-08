# Complete FJL Backend-Database-Frontend Setup Guide

**Status: ✅ Backend Ready | ⏳ Database Connection Ready | 📝 Final Integration Pending**

**Time to Complete:** ~1-2 hours for full setup including database, email, and frontend integration

---

## 📊 Current Status

### ✅ COMPLETED
- Backend API server running on http://localhost:3000
- Supabase database credentials configured and connected
- Resend email service configured
- JWT authentication implemented
- All backend services created (products, orders, customers, email)
- Product image upload functionality added
- 5 frontend integration modules created

### ⏳ IN PROGRESS
- Frontend HTML integration (adding scripts to HTML files)
- Member/customer database storage setup

### 📋 TODO
- Test complete order flow
- Verify all integrations working
- Add sample products (optional)

---

## Phase 1: Setup Supabase Storage for Images (15 minutes)

### Step 1.1: Create Storage Bucket

1. **Login to Supabase:**
   - Go to https://supabase.com
   - Select your FJL project

2. **Create Bucket:**
   - Click "Storage" in left sidebar
   - Click "New Bucket"
   - Name: `product-images`
   - Set to PUBLIC ✅
   - Click "Create"

3. **Copy Storage URL:**
   - Click the bucket
   - Copy the public URL format:
     ```
     https://youkrpmiaebulbbktpvu.supabase.co/storage/v1/object/public/product-images/
     ```

### Step 1.2: Update Backend .env

Add to `backend/.env`:
```
SUPABASE_STORAGE_BUCKET=product-images
SUPABASE_STORAGE_URL=https://youkrpmiaebulbbktpvu.supabase.co/storage/v1/object/public/product-images/
```

**Status:** ✅ DONE - productService.js already updated with image upload functions

---

## Phase 2: Integrate Frontend with Backend API (30 minutes)

### Step 2.1: Add Integration Scripts to HTML Files

Add these scripts to the **bottom of the `<body>` tag** in each HTML file:

**For shop.html:**
```html
<!-- Backend API Integration -->
<script src="js/api-integration.js"></script>
<script src="js/shop-integration.js"></script>
```

**For checkout.html:**
```html
<!-- Backend API Integration -->
<script src="js/api-integration.js"></script>
<script src="js/checkout-integration.js"></script>
```

**For order-confirmation.html:**
```html
<!-- Backend API Integration -->
<script src="js/api-integration.js"></script>
<script src="js/order-confirmation-integration.js"></script>
```

**For index.html and all pages with newsletter:**
```html
<!-- Backend API Integration -->
<script src="js/api-integration.js"></script>
<script src="js/newsletter-integration.js"></script>
```

### Step 2.2: Update shop.html - Product Loading

Find the product loading code (around line 917-929):
```javascript
let products = [];
const storedProducts = localStorage.getItem('fjl_products');
if (storedProducts) {
  try {
    products = JSON.parse(storedProducts);
  }
}
```

**Replace with:**
```javascript
// Load products from API or localStorage
let products = [];
window.initializeShopProducts().then(loadedProducts => {
  products = loadedProducts || [];
  handleFilterChange();
  applyFiltersAndSort();
});

// Handle product refresh when coming back online
window.refreshShopProducts = function(newProducts) {
  products = newProducts || [];
  applyFiltersAndSort();
};
```

### Step 2.3: Update checkout.html - Order Creation

Find the form submit handler for the checkout form and replace the order creation code:

**Replace:**
```javascript
localStorage.setItem('fjl_orders', JSON.stringify(orderData));
// ... old code
```

**With:**
```javascript
// Validate order data
if (!window.validateOrderData(formData, window.cart)) {
  return; // Validation already shows error notification
}

// Create order via API
try {
  const result = await window.createOrderWithAPI(formData, window.cart);

  if (result.success) {
    // Redirect to confirmation page
    window.location.href = `/order-confirmation.html?order=${result.orderNumber}`;
  }
} catch (error) {
  console.error('Order creation failed:', error);
  window.showNotification('Failed to create order. Please try again.', 'error');
}
```

### Step 2.4: Update Newsletter Forms

Find all newsletter forms and add `data-newsletter-form` attribute:

**Change from:**
```html
<form id="newsletter-form">
  <input type="email" placeholder="Email">
  <button>Subscribe</button>
</form>
```

**Change to:**
```html
<form data-newsletter-form data-newsletter-source="homepage_modal">
  <input type="email" placeholder="Email" required>
  <button>Subscribe</button>
</form>
```

### Step 2.5: Order Confirmation - No Changes Needed!

The `order-confirmation.html` **auto-initializes** when the script is loaded. Just add the script tag, no code changes needed.

---

## Phase 3: Verify Backend Connectivity (10 minutes)

### Step 3.1: Check Backend Status

```bash
curl http://localhost:3000/health
# Should return: {"status":"ok",...}
```

### Step 3.2: Test API Endpoints

```bash
# Test products endpoint
curl http://localhost:3000/api/products

# Test health check
curl http://localhost:3000/health
```

### Step 3.3: Verify in Browser Console

Open browser console (F12) on any page and run:

```javascript
// Check if API manager is loaded
console.log('API Manager:', window.apiManager ? '✅' : '❌');

// Test API connection
apiManager.call('/products').then(result => {
  console.log('Products loaded:', result.success ? '✅' : '❌');
  console.log('Count:', result.data?.length || 0);
});
```

---

## Phase 4: Add Sample Products (Optional - 10 minutes)

### Option A: Via Database (Recommended)

1. **Login to Supabase Console**
2. **Go to Tables → products**
3. **Click "Insert row"**
4. **Fill in product details:**
   - name: "Classic White T-Shirt"
   - price: 8000
   - sku: "TSH-WHITE-001"
   - sleeve_type: "sleeve"
   - category: "shirts"
   - total_stock: 50
   - image_url: (can be any URL or empty for now)

### Option B: Via API (After Integration)

```javascript
const product = {
  name: "Classic White T-Shirt",
  price: 8000,
  sku: "TSH-WHITE-001",
  sleeve_type: "sleeve",
  category: "shirts",
  total_stock: 50,
  image_url: "https://example.com/image.jpg"
};

const result = await apiManager.call('/products', {
  method: 'POST',
  body: product
});
```

---

## Phase 5: Test Complete Flow (20 minutes)

### Test 1: Product Loading
1. Open `shop.html`
2. Check browser console (F12)
3. Should see products loading from API
4. Verify products display correctly

### Test 2: Order Creation
1. Add product to cart
2. Go to checkout
3. Fill out form with test data
4. Submit order
5. Should be redirected to order confirmation
6. Check console for success message

### Test 3: Newsletter Subscription
1. Open index.html
2. Find newsletter form
3. Subscribe with test email
4. Should see success notification
5. Check Supabase: customers → email_members table
6. Verify email in table

### Test 4: Offline Functionality
1. Open DevTools (F12) → Network
2. Check "Offline"
3. Try to subscribe to newsletter
4. Should show offline message
5. Uncheck "Offline"
6. Should auto-sync
7. Check console for sync message

### Test 5: Email Notifications
1. Create an order
2. Check Supabase: email_logs table
3. Verify email was logged
4. (Optional) Check actual email if Resend API key is valid

---

## Database Schema Reference

### Key Tables for This Setup:

**products**
```
- id (UUID)
- name (text)
- sku (text) - unique
- price (numeric)
- image_url (text)
- sleeve_type (text)
- total_stock (integer)
- is_active (boolean)
- created_at, updated_at
```

**product_variants**
```
- id (UUID)
- product_id (FK)
- size (text)
- color (text)
- stock_quantity (integer)
- created_at, updated_at
```

**customers**
```
- id (UUID)
- email (text) - unique
- first_name (text)
- last_name (text)
- phone (text)
- created_at, updated_at
```

**email_members** (Newsletter subscribers)
```
- id (UUID)
- email (text) - unique
- full_name (text)
- source (text) - where they subscribed
- is_subscribed (boolean)
- created_at
```

**orders**
```
- id (UUID)
- order_number (text) - unique
- customer_id (FK)
- total_amount (numeric)
- order_status (text)
- payment_status (text)
- created_at, updated_at
```

**email_logs**
```
- id (UUID)
- recipient_email (text)
- email_type (text)
- send_status (text)
- sent_at (timestamp)
- created_at
```

---

## File Structure After Integration

```
FJL/
├── js/
│   ├── api-integration.js                    ✅ READY (200+ lines)
│   ├── shop-integration.js                   ✅ READY (150+ lines)
│   ├── checkout-integration.js               ✅ READY (180+ lines)
│   ├── order-confirmation-integration.js     ✅ READY (200+ lines)
│   ├── newsletter-integration.js             ✅ READY (150+ lines)
│
├── shop.html                                  ⏳ NEEDS: Scripts + Product loading code
├── checkout.html                              ⏳ NEEDS: Scripts + Order creation code
├── order-confirmation.html                    ⏳ NEEDS: Scripts only
├── index.html                                 ⏳ NEEDS: Scripts + Newsletter forms
│
└── backend/
    ├── .env                                   ✅ CONFIGURED
    ├── src/
    │   ├── services/
    │   │   ├── productService.js              ✅ WITH IMAGE UPLOAD
    │   │   ├── emailService.js                ✅ CONFIGURED
    │   │   ├── orderService.js                ✅ READY
    │   │   └── customerService.js             ✅ READY
    │   └── ... other files
    └── node_modules/                          ✅ INSTALLED
```

---

## API Endpoints Reference

### Products
```
GET  /api/products                 → List all products
GET  /api/products/featured        → Featured products
GET  /api/products/:id             → Single product with variants
POST /api/products                 → Create product (admin)
PUT  /api/products/:id             → Update product (admin)
```

### Orders
```
POST /api/orders                   → Create order
GET  /api/orders/:id               → Get order by ID
GET  /api/orders/number/:number    → Get order by order number
```

### Customers
```
POST /api/customers/members/subscribe → Newsletter subscription
GET  /api/customers/:id            → Get customer (admin)
```

### Health
```
GET  /health                       → Health check
```

---

## Environment Variables Checklist

✅ **Already Configured:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon key
- `SUPABASE_SERVICE_KEY` - Supabase service key
- `RESEND_API_KEY` - Email API key
- `JWT_SECRET` - JWT signing key
- `STORE_NAME` - Store name
- `STORE_EMAIL` - Order confirmation email
- `TAX_RATE` - Tax percentage (7.5%)

---

## Troubleshooting

### Issue: "API Manager not found"
**Solution:** Add script tag to HTML:
```html
<script src="js/api-integration.js"></script>
```

### Issue: "Network error - API not responding"
**Solution:** Check if backend is running:
```bash
npm run dev  # in backend folder
```

### Issue: "Products not loading"
**Solution:**
1. Check Network tab (F12) for /api/products request
2. Should return 200 status
3. Check browser console for errors
4. Verify database has products

### Issue: "Order not syncing to database"
**Solution:**
1. Check order was sent to API
2. Check Network tab for POST /api/orders
3. Verify response contains order_number
4. Check Supabase orders table

### Issue: "Newsletter subscription failing"
**Solution:**
1. Verify form has `data-newsletter-form` attribute
2. Check email is valid format
3. Check Network tab for POST request
4. Verify Resend API key in .env

---

## Success Criteria

After completing all phases, you should have:

✅ Backend running at http://localhost:3000
✅ Database connected and working
✅ Products loading from API
✅ Orders creating and saving to database
✅ Newsletter subscriptions saving to email_members table
✅ Emails being logged in email_logs table
✅ Offline mode working (can queue data)
✅ Auto-sync working (data syncs when online)
✅ All images stored in Supabase Storage
✅ Complete data persistence (not in localStorage)

---

## Time Breakdown

| Phase | Task | Time |
|-------|------|------|
| 1 | Supabase Storage setup | 15 min |
| 2 | Frontend HTML integration | 30 min |
| 3 | Backend verification | 10 min |
| 4 | Sample products (optional) | 10 min |
| 5 | Complete flow testing | 20 min |
| **Total** | **All phases** | **85 min** |

---

## Next Steps

1. **Complete Phase 1:** Setup Supabase Storage (15 min)
2. **Complete Phase 2:** Add scripts to HTML files (30 min)
3. **Complete Phase 3:** Verify backend (10 min)
4. **Complete Phase 4:** Add sample products (10 min) - optional
5. **Complete Phase 5:** Test everything (20 min)

---

## Support Files

- `CURRENT_STATUS.md` - Quick status overview
- `SUPABASE_STORAGE_SETUP.md` - Detailed storage setup
- `TESTING_GUIDE.md` - Complete testing procedures
- `INTEGRATION_CHECKLIST.md` - Quick checklist
- `FRONTEND_BACKEND_INTEGRATION.md` - Technical details

---

**Status:** Backend ✅ Ready | Database ✅ Connected | Frontend ⏳ Needs HTML Integration

**Next Action:** Start Phase 1 - Setup Supabase Storage (15 minutes)
