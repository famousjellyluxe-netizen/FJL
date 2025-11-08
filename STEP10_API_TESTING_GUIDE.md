# Step 10: Complete API Endpoint Testing Guide

**Step 10 of 10: Test All API Endpoints - Ready to Begin**

---

## 🎯 Objective

Test and verify all FJL backend API endpoints to ensure:
- ✅ All endpoints respond correctly
- ✅ Authentication/authorization works
- ✅ Data validation functions properly
- ✅ Error handling is appropriate
- ✅ Database operations succeed
- ✅ File uploads work end-to-end
- ✅ System is production-ready

---

## 📋 Pre-Testing Checklist

Before starting tests, verify:

- [ ] Backend running: `npm run dev` on port 5001
- [ ] Database connected: Supabase project active
- [ ] Storage bucket: `product-image` created & public
- [ ] Environment variables: All configured in `.env`
- [ ] Admin user: Created in database
- [ ] Network: Internet connection stable

---

## 🔑 Authentication Setup

### Get Admin JWT Token

First, you'll need a JWT token for admin requests:

**Option 1: Login via API**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fjl.com",
    "password": "*fjlclothing#"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "uuid",
      "email": "admin@fjl.com",
      "full_name": "Admin Name",
      "role": "owner"
    }
  }
}
```

**Option 2: Use Postman**
1. Create new POST request
2. URL: `http://localhost:5001/api/auth/login`
3. Headers: `Content-Type: application/json`
4. Body:
```json
{
  "email": "admin@fjl.com",
  "password": "*fjlclothing#"
}
```

**Copy the token value for use in other requests**

---

## 📡 API Endpoints to Test

### 1. Health Check (Public)
```
GET http://localhost:5001/health

Expected: 200 OK
{
  "status": "ok",
  "timestamp": "2025-11-08T...",
  "environment": "development"
}
```

### 2. Authentication Endpoints

#### Login
```
POST http://localhost:5001/api/auth/login
Content-Type: application/json

{
  "email": "admin@fjl.com",
  "password": "*fjlclothing#"
}

Expected: 200 OK (returns JWT token)
```

#### Verify Token
```
POST http://localhost:5001/api/auth/verify
Authorization: Bearer <your-token>

Expected: 200 OK
{
  "success": true,
  "data": { admin details }
}
```

---

### 3. Product Endpoints

#### Get All Products (Public)
```
GET http://localhost:5001/api/products
Query Parameters (optional):
  - category: sleeve/sleeveless
  - search: product name
  - sort_by: name/price/created_at
  - sort_order: asc/desc
  - page: 1
  - limit: 20

Expected: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "price": 5000,
      "sku": "SKU-001",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

#### Get Featured Products (Public)
```
GET http://localhost:5001/api/products/featured?limit=6

Expected: 200 OK
{
  "success": true,
  "data": [featured products array]
}
```

#### Get Single Product (Public)
```
GET http://localhost:5001/api/products/{productId}

Expected: 200 OK
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Product Name",
    "price": 5000,
    ...
  }
}
```

#### Create Product (Admin Only)
```
POST http://localhost:5001/api/products
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "name": "Test Product",
  "sku": "TEST-001",
  "price": 5000,
  "description": "Test description",
  "category_id": null,
  "available_colors": ["Black", "White"],
  "available_sizes": ["M", "L", "XL"],
  "is_active": true
}

Expected: 201 Created
{
  "success": true,
  "message": "Product created successfully",
  "data": { created product object }
}
```

#### Update Product (Admin Only)
```
PUT http://localhost:5001/api/products/{productId}
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "name": "Updated Name",
  "price": 6000
}

Expected: 200 OK
{
  "success": true,
  "message": "Product updated successfully",
  "data": { updated product object }
}
```

#### Delete Product (Admin Only)
```
DELETE http://localhost:5001/api/products/{productId}
Authorization: Bearer <your-token>

Expected: 200 OK
{
  "success": true,
  "message": "Product deleted successfully",
  "data": { deleted product object }
}
```

#### Upload Product Image (Admin Only) ⭐
```
POST http://localhost:5001/api/products/{productId}/upload
Authorization: Bearer <your-token>
Content-Type: multipart/form-data

Form Data:
  - image: <select image file>

Expected: 200 OK
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://...product-image/[productId]/[filename]",
    "filename": "filename.jpg",
    "size": 12345,
    "mimetype": "image/jpeg"
  }
}
```

#### Get Product Variants (Public)
```
GET http://localhost:5001/api/products/{productId}/variants

Expected: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "size": "M",
      "color": "Black",
      "stock_quantity": 10
    }
  ]
}
```

#### Create Product Variant (Admin Only)
```
POST http://localhost:5001/api/products/{productId}/variants
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "size": "M",
  "color": "Black",
  "stock_quantity": 20
}

Expected: 201 Created
{
  "success": true,
  "message": "Variant created successfully",
  "data": { variant object }
}
```

#### Update Variant Stock (Admin Only)
```
PUT http://localhost:5001/api/products/{productId}/variants/{variantId}
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "stock_quantity": 15
}

Expected: 200 OK
{
  "success": true,
  "message": "Variant stock updated successfully",
  "data": { updated variant object }
}
```

---

### 4. Order Endpoints

#### Get All Orders (Admin Only)
```
GET http://localhost:5001/api/orders
Authorization: Bearer <your-token>
Query Parameters (optional):
  - status: pending/processing/shipped/delivered
  - page: 1
  - limit: 20

Expected: 200 OK
{
  "success": true,
  "data": [orders array],
  "pagination": { ... }
}
```

#### Get Single Order (Public)
```
GET http://localhost:5001/api/orders/{orderId}

Expected: 200 OK
{
  "success": true,
  "data": { order object }
}
```

#### Create Order (Public)
```
POST http://localhost:5001/api/orders
Content-Type: application/json

{
  "user_email": "customer@example.com",
  "shipping_address": "123 Main St",
  "shipping_city": "Lagos",
  "shipping_state": "Lagos",
  "shipping_postal_code": "100001",
  "shipping_country": "Nigeria",
  "items": [
    {
      "product_id": "uuid",
      "variant_id": "uuid",
      "quantity": 2
    }
  ]
}

Expected: 201 Created
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "uuid",
    "order_number": "ORD-XXXXXXX",
    "status": "pending",
    ...
  }
}
```

#### Update Order Status (Admin Only)
```
PUT http://localhost:5001/api/orders/{orderId}
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "status": "processing"
}

Expected: 200 OK
{
  "success": true,
  "message": "Order updated successfully",
  "data": { updated order object }
}
```

---

### 5. Customer Endpoints

#### Get All Customers (Admin Only)
```
GET http://localhost:5001/api/customers
Authorization: Bearer <your-token>

Expected: 200 OK
{
  "success": true,
  "data": [customers array]
}
```

#### Get Single Customer (Admin Only)
```
GET http://localhost:5001/api/customers/{customerId}
Authorization: Bearer <your-token>

Expected: 200 OK
{
  "success": true,
  "data": { customer object }
}
```

#### Create Customer (Public)
```
POST http://localhost:5001/api/customers
Content-Type: application/json

{
  "email": "customer@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+234800123456"
}

Expected: 201 Created
{
  "success": true,
  "message": "Customer created successfully",
  "data": { customer object }
}
```

---

## 🧪 Testing Workflow

### Step 1: Health Check
```bash
curl http://localhost:5001/health
```
✅ Should return status: ok

### Step 2: Authentication
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fjl.com","password":"*fjlclothing#"}'
```
✅ Should return JWT token

### Step 3: Get Products
```bash
curl http://localhost:5001/api/products
```
✅ Should return products array (may be empty)

### Step 4: Create Product
```bash
curl -X POST http://localhost:5001/api/products \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test Product",
    "sku":"TEST-001",
    "price":5000
  }'
```
✅ Should return created product with ID

### Step 5: Upload Image to Product
```bash
curl -X POST http://localhost:5001/api/products/<PRODUCT_ID>/upload \
  -H "Authorization: Bearer <TOKEN>" \
  -F "image=@/path/to/image.jpg"
```
✅ Should return public URL

### Step 6: Get Updated Product
```bash
curl http://localhost:5001/api/products/<PRODUCT_ID>
```
✅ Should show product with image URL

---

## 🛠️ Testing with Postman

### Setup:
1. Download Postman: https://www.postman.com/downloads/
2. Create new Collection: "FJL Backend Tests"
3. Set environment variable: `BASE_URL = http://localhost:5001`

### Create Requests:

**Collection Variables:**
```
base_url: http://localhost:5001
token: (empty - will be filled after login)
```

**Requests:**
1. Health Check (GET)
2. Login (POST) - Save token from response
3. Get Products (GET)
4. Create Product (POST)
5. Upload Image (POST)
6. Create Order (POST)
7. Get Orders (GET)

---

## ✅ Test Cases

### Positive Tests (Should Pass)

- [ ] Health check returns 200
- [ ] Login with correct credentials returns token
- [ ] Get products returns array
- [ ] Create product with valid data succeeds
- [ ] Update product succeeds
- [ ] Delete product succeeds
- [ ] Upload valid image succeeds
- [ ] Create order with valid data succeeds
- [ ] Get single product returns data
- [ ] Featured products endpoint works

### Negative Tests (Should Handle Gracefully)

- [ ] Login with wrong password returns 401
- [ ] Create product without required fields returns 400
- [ ] Upload non-image file returns 400
- [ ] Upload file > 5MB returns 413
- [ ] Access admin endpoint without token returns 401
- [ ] Get non-existent product returns 404
- [ ] Update with invalid data returns 400

---

## 📊 Expected Results Summary

| Endpoint | Method | Auth | Status | Response |
|----------|--------|------|--------|----------|
| /health | GET | No | 200 | Status OK |
| /api/auth/login | POST | No | 200 | JWT Token |
| /api/products | GET | No | 200 | Products array |
| /api/products | POST | Yes | 201 | Created product |
| /api/products/:id | GET | No | 200 | Product data |
| /api/products/:id | PUT | Yes | 200 | Updated product |
| /api/products/:id | DELETE | Yes | 200 | Deleted product |
| /api/products/:id/upload | POST | Yes | 200 | Image URL |
| /api/orders | GET | Yes | 200 | Orders array |
| /api/orders | POST | No | 201 | Created order |
| /api/customers | POST | No | 201 | Created customer |

---

## 🐛 Debugging Tips

### Check Backend Logs
- Look at terminal running `npm run dev`
- See request logs and errors
- Check database operations

### Use Browser DevTools
- Open DevTools (F12)
- Go to Network tab
- See all API calls
- Check response headers & body

### Enable Verbose Logging
- Add `console.log()` in routes
- Check response status codes
- Verify error messages

### Common Issues & Fixes

**404 Not Found**
- Check endpoint URL spelling
- Verify server is running
- Check route file

**401 Unauthorized**
- Verify token is included
- Check token hasn't expired
- Ensure correct auth header format

**400 Bad Request**
- Validate request body JSON
- Check required fields
- Verify data types

**500 Server Error**
- Check backend logs
- Verify database connection
- Check for syntax errors

---

## 📈 Test Results Template

```
Test Date: ___________
Tester: ___________
Backend Version: ___________

HEALTH CHECK
├─ Status: ___________
└─ Response Time: ___________

AUTHENTICATION
├─ Login: ___________
├─ Token Generated: ___________
└─ Verify Token: ___________

PRODUCTS
├─ Get All: ___________
├─ Get Single: ___________
├─ Create: ___________
├─ Update: ___________
├─ Delete: ___________
└─ Upload Image: ___________

ORDERS
├─ Get All: ___________
├─ Get Single: ___________
└─ Create: ___________

OVERALL STATUS: ___________
ISSUES FOUND: ___________
```

---

## 🎯 Success Criteria

✅ All endpoints respond with correct status codes
✅ All endpoints return properly formatted JSON
✅ Authentication/authorization works correctly
✅ Image upload succeeds and returns public URL
✅ Database operations persist data correctly
✅ Error handling returns appropriate messages
✅ No console errors or warnings
✅ Response times are reasonable (< 1 second)

---

## 🚀 Next Steps After Testing

If all tests pass:
1. ✅ Integration with frontend
2. ✅ Full end-to-end testing
3. ✅ Performance optimization
4. ✅ Production deployment

If issues found:
1. ❌ Document the issue
2. ❌ Identify root cause
3. ❌ Fix in code
4. ❌ Re-test

---

## 📞 Need Help?

**Backend not responding?**
- Check `npm run dev` is running
- Check port 5001 is available
- Check no firewall blocking

**Database connection error?**
- Check .env variables
- Verify Supabase project active
- Check internet connection

**Authentication fails?**
- Verify admin user exists
- Check password is correct
- Verify JWT_SECRET in .env

---

**Ready to start testing?** 🧪

Begin with the Health Check and follow the workflow step-by-step!
