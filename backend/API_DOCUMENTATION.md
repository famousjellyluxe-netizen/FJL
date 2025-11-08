# FJL Backend - API Documentation

## 🔐 Authentication

All admin endpoints require JWT token:

```
Authorization: Bearer <JWT_TOKEN>
```

### POST /api/auth/login

Login to get JWT token.

**Request:**
```json
{
  "email": "admin@fjl.com",
  "password": "your-password"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "data": {
    "id": "uuid",
    "email": "admin@fjl.com",
    "role": "owner"
  }
}
```

### GET /api/auth/verify

Verify token validity.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@fjl.com",
    "full_name": "Admin Name",
    "is_active": true
  }
}
```

---

## 📦 Products API

### GET /api/products

List all products (public).

**Query Parameters:**
- `category_id` - Filter by category
- `sleeve_type` - "sleeveless" or "short-sleeve"
- `search` - Search in name/description

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sku": "FCJ-001",
      "name": "FTG Checkered Jersey",
      "price": 75300,
      "sleeve_type": "sleeveless",
      "available_sizes": ["S", "M", "L"],
      "total_stock": 50
    }
  ],
  "count": 10
}
```

### GET /api/products/:id

Get product details (public).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sku": "FCJ-001",
    "name": "FTG Jersey",
    "price": 75300,
    "description": "...",
    "category": { "id": "uuid", "name": "Tops" },
    "variants": [
      {
        "id": "uuid",
        "size": "M",
        "color": "Black",
        "stock_quantity": 15
      }
    ]
  }
}
```

### POST /api/products

Create product (admin only).

**Headers:**
```
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

**Request:**
```json
{
  "sku": "NEW-001",
  "name": "New Product",
  "category_id": "uuid",
  "price": 50000,
  "sleeve_type": "short-sleeve",
  "available_sizes": ["S", "M", "L"],
  "available_colors": ["Black", "White"]
}
```

**Response (201):** Created product object

---

## 🛒 Orders API

### POST /api/orders

Create new order (public).

**Request:**
```json
{
  "user_id": "uuid",
  "shipping_first_name": "John",
  "shipping_last_name": "Doe",
  "shipping_email": "john@example.com",
  "shipping_phone": "+2348012345678",
  "shipping_address": "123 Main St",
  "shipping_city": "Lagos",
  "shipping_state": "Lagos State",
  "shipping_postal_code": "100001",
  "shipping_country": "Nigeria",
  "buyer_name": "John Doe",
  "items": [
    {
      "product_id": "uuid",
      "product_name": "Jersey",
      "product_sku": "FCJ-001",
      "size": "M",
      "color": "Black",
      "unit_price": 75300,
      "quantity": 2
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_number": "ORD-XXXXX",
    "total_amount": 161895,
    "order_status": "pending",
    "payment_status": "pending"
  }
}
```

**Note:** Order confirmation email automatically sent.

### GET /api/orders/:id

Get order details (public).

**Response (200):** Order object with items

### GET /api/orders

List all orders (admin only).

**Query Parameters:**
- `order_status` - pending, processing, shipped, delivered, cancelled
- `payment_status` - pending, verified, failed
- `limit` - Default 50
- `offset` - Default 0

**Response (200):**
```json
{
  "success": true,
  "data": [ { order objects } ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

### PUT /api/orders/:id/status

Update order status (admin only).

**Request:**
```json
{
  "order_status": "processing"
}
```

Valid statuses: pending, processing, shipped, delivered, cancelled

**Response (200):** Updated order object

### PUT /api/orders/:id/payment-status

Verify payment (admin only).

**Request:**
```json
{
  "payment_status": "verified"
}
```

**Response (200):** Updated order object

**Note:** Payment verification email automatically sent when set to "verified".

---

## 👥 Customers API

### POST /api/customers

Register new customer (public).

**Request:**
```json
{
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+2348012345678",
  "city": "Lagos"
}
```

**Response (201):** Customer object

### GET /api/customers/:id

Get customer details (admin only).

**Response (200):** Customer object

### GET /api/customers

List all customers (admin only).

**Query Parameters:**
- `search` - Search by email/name
- `limit` - Default 50
- `offset` - Default 0

**Response (200):** Paginated customer list

### POST /api/customers/members

Newsletter signup (public).

**Request:**
```json
{
  "email": "john@example.com",
  "full_name": "John Doe",
  "signup_source": "homepage_modal"
}
```

**Response (201):** Member object

**Note:** Welcome email automatically sent.

### GET /api/customers/list/all

List newsletter members (admin only).

**Response (200):** Paginated member list

---

## 📊 Response Format

All responses follow this format:

**Success (2xx):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

**Error (4xx/5xx):**
```json
{
  "success": false,
  "error": "Error description",
  "details": [ { field, message } ]
}
```

---

## 📧 Email Automation

Automatic emails sent for:
- Order confirmation (immediately after order)
- Payment verification (when payment status = verified)
- Member welcome (when newsletter signup)

All emails tracked in `email_logs` table with:
- Delivery status
- Open/click counts
- Error messages

---

**Total**: 27 REST endpoints covering all operations

For implementation details, see SETUP.md and IMPLEMENTATION_SUMMARY.md
