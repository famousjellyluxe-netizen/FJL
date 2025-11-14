# FJL API Reference (FIX-023)

**Base URL:** `http://localhost:5001/api` (development) or `https://api.fjl.com` (production)

**API Version:** 1.0
**Last Updated:** November 2025

---

## Table of Contents

1. [Authentication](#authentication)
2. [Products](#products)
3. [Categories](#categories)
4. [Orders](#orders)
5. [Customers](#customers)
6. [Settings](#settings)
7. [Contact](#contact)
8. [Webhooks](#webhooks)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)

---

## Authentication

### JWT Token Structure

```
Header: Authorization: Bearer {JWT_TOKEN}
```

**Token Expiry:** 7 days
**Scopes:**
- `admin` - Full admin access
- `customer` - Customer operations
- `anonymous` - No authentication needed

### Login (No Auth Required)

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@fjl.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "email": "user@fjl.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "owner"
    }
  }
}
```

### Verify Token

```http
GET /api/auth/verify
Authorization: Bearer {JWT_TOKEN}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user_id": "user-uuid"
  }
}
```

---

## Products

### Get All Products

```http
GET /api/products?category=cat-uuid&search=shirt&page=1&limit=20
```

**Query Parameters:**
- `category` (optional) - Filter by category UUID
- `search` (optional) - Search by name/description
- `sort_by` (optional) - `name`, `price`, `created_at` (default)
- `sort_order` (optional) - `asc` (default), `desc`
- `page` (optional, default: 1)
- `limit` (optional, default: 20, max: 100)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "product-uuid",
      "name": "Classic T-Shirt",
      "description": "Premium cotton blend",
      "price": 5000,
      "image": "https://cdn.fjl.com/products/...",
      "is_active": true,
      "is_featured": false,
      "category_id": "cat-uuid",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

### Get Product Details

```http
GET /api/products/{id}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "product-uuid",
    "name": "Classic T-Shirt",
    "description": "Premium cotton blend",
    "price": 5000,
    "image": "https://cdn.fjl.com/products/...",
    "is_active": true,
    "is_featured": false,
    "category_id": "cat-uuid",
    "colors": ["red", "blue", "white"],
    "sizes": ["XS", "S", "M", "L", "XL", "XXL"],
    "variants": [
      {
        "id": "variant-uuid",
        "size": "M",
        "color": "Red",
        "stock_quantity": 25,
        "sku": "TSHIRT-M-RED"
      }
    ],
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

### Create Product (Admin Only)

```http
POST /api/products
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "name": "New Product",
  "description": "Product description",
  "price": 10000,
  "category_id": "cat-uuid",
  "colors": ["Red", "Blue"],
  "sizes": ["S", "M", "L"],
  "is_featured": false
}
```

**Required Fields:** `name`, `price`, `category_id`
**Response (201):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": { /* product object */ }
}
```

### Update Product (Admin Only)

```http
PUT /api/products/{id}
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "name": "Updated Name",
  "price": 12000,
  "is_featured": true
}
```

**Response (200):** Returns updated product

### Delete Product (Admin Only)

```http
DELETE /api/products/{id}
Authorization: Bearer {JWT_TOKEN}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

### Get Featured Products

```http
GET /api/products/featured?limit=6
```

**Query Parameters:**
- `limit` (optional, default: 6, max: 50)

**Response (200):** Array of featured products

### Real-Time Stock Updates (SSE)

```
GET /api/products/stock/subscribe?productIds=id1,id2,id3
Accept: text/event-stream
```

**Streaming Response:**
```javascript
event: initial_stock
data: {
  "type": "initial_stock",
  "productId": "product-uuid",
  "variants": [
    { "id": "variant-uuid", "stock_quantity": 25 }
  ],
  "timestamp": 1234567890
}

event: stock_update
data: {
  "type": "stock_update",
  "productId": "product-uuid",
  "newQuantity": 24,
  "oldQuantity": 25,
  "lowStock": false
}
```

### Get Product Stock Status

```http
GET /api/products/stock/status?productId=product-uuid
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "productId": "product-uuid",
    "totalStock": 150,
    "variants": [
      {
        "id": "variant-uuid",
        "size": "M",
        "color": "Red",
        "stock_quantity": 25
      }
    ],
    "timestamp": 1234567890
  }
}
```

---

## Categories

### Get All Categories

```http
GET /api/categories
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat-uuid",
      "name": "T-Shirts",
      "slug": "t-shirts",
      "description": "All t-shirt products",
      "image": "https://cdn.fjl.com/categories/...",
      "is_active": true,
      "product_count": 45
    }
  ]
}
```

### Get Category Details

```http
GET /api/categories/{id}
```

**Response (200):** Returns single category with products

### Create Category (Admin Only)

```http
POST /api/categories
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "name": "Dresses",
  "description": "All dress products",
  "is_active": true
}
```

**Response (201):** Returns created category

### Update Category (Admin Only)

```http
PUT /api/categories/{id}
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response (200):** Returns updated category

### Delete Category (Admin Only)

```http
DELETE /api/categories/{id}
Authorization: Bearer {JWT_TOKEN}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

---

## Orders

### Create Order

```http
POST /api/orders
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "items": [
    {
      "product_id": "product-uuid",
      "variant_id": "variant-uuid",
      "quantity": 2
    }
  ],
  "shipping_name": "John Doe",
  "shipping_email": "john@example.com",
  "shipping_phone": "08012345678",
  "shipping_address": "123 Main St, Lagos",
  "city": "Lagos",
  "state": "Lagos",
  "postal_code": "100001",
  "country": "NG"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "order-uuid",
    "order_number": "ORD-ABC123XYZ",
    "total_amount": 25000,
    "order_status": "pending",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

### Get My Orders

```http
GET /api/orders?page=1&limit=10
Authorization: Bearer {JWT_TOKEN}
```

**Response (200):** Array of customer's orders

### Get Order Details

```http
GET /api/orders/{id}
Authorization: Bearer {JWT_TOKEN}
```

**Permissions:**
- Customer: Can only view own orders
- Admin: Can view any order

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "order_number": "ORD-ABC123XYZ",
    "user_id": "user-uuid",
    "items": [
      {
        "product_id": "product-uuid",
        "product_name": "Classic T-Shirt",
        "variant_id": "variant-uuid",
        "size": "M",
        "color": "Red",
        "quantity": 2,
        "unit_price": 5000,
        "subtotal": 10000
      }
    ],
    "total_amount": 25000,
    "tax": 3000,
    "shipping_cost": 0,
    "order_status": "pending",
    "payment_verified": false,
    "stock_deducted": false,
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

### Update Order Status (Admin Only)

```http
PUT /api/orders/{id}
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "status": "shipped"
}
```

**Valid Statuses:** `pending`, `processing`, `shipped`, `delivered`, `cancelled`

**Response (200):** Returns updated order

### Verify Order Payment (Admin Only)

```http
POST /api/orders/{id}/verify-payment
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "payment_reference": "trans_123456",
  "amount_paid": 25000
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "order_number": "ORD-ABC123XYZ",
    "payment_verified": true,
    "stock_deducted": true
  }
}
```

### Refund Order (Admin Only)

```http
POST /api/orders/{id}/refund
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "amount": 25000,
  "reason": "Customer requested refund"
}
```

**Response (200):** Refunds order and restores stock

### Get Order Audit Log

```http
GET /api/orders/{id}/audit
Authorization: Bearer {JWT_TOKEN}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "audit-uuid",
        "action": "status_updated",
        "from_value": "pending",
        "to_value": "shipped",
        "reason": null,
        "admin_id": "admin-uuid",
        "created_at": "2025-01-15T10:30:00Z"
      }
    ],
    "total": 5,
    "page": 1
  }
}
```

---

## Customers

### Get All Customers (Admin Only)

```http
GET /api/customers?page=1&limit=20&search=john
Authorization: Bearer {JWT_TOKEN}
```

**Response (200):** Array of customers

### Get Customer Details (Admin Only)

```http
GET /api/customers/{id}
Authorization: Bearer {JWT_TOKEN}
```

**Response (200):** Customer profile with order history

---

## Settings

### Get Settings (Admin Only)

```http
GET /api/settings
Authorization: Bearer {JWT_TOKEN}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "store_name": "Famous Jelly Luxe",
    "store_description": "Premium fashion brand",
    "tax_rate": 7.5,
    "shipping_cost": 500,
    "currency": "NGN",
    "business_email": "info@fjl.com",
    "business_phone": "08012345678"
  }
}
```

### Update Settings (Admin Only)

```http
PUT /api/settings
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "store_name": "New Store Name",
  "tax_rate": 10,
  "shipping_cost": 1000
}
```

**Response (200):** Returns updated settings

---

## Contact

### Submit Contact Form (No Auth Required)

```http
POST /api/contact
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Product inquiry",
  "message": "I have a question about your products"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Message received. We'll get back to you soon."
}
```

---

## Webhooks

### Handle Email Events

```http
POST /api/webhooks/resend
Content-Type: application/json
X-Resend-Signature: {SIGNATURE}
X-Resend-Timestamp: {TIMESTAMP}

{
  "type": "email.delivered",
  "data": {
    "email_id": "email-uuid",
    "to": "customer@example.com",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

**Authentication:** HMAC-SHA256 signature verification (see CSRF_PROTECTION.md)

**Response (200):**
```json
{
  "success": true,
  "message": "Event processed"
}
```

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": "Product not found",
  "details": [
    {
      "field": "product_id",
      "message": "Product with this ID does not exist"
    }
  ],
  "statusCode": 404
}
```

### Common Error Codes

| Code | Error | Meaning |
|------|-------|---------|
| 400 | Bad Request | Invalid parameters or missing required fields |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists (e.g., duplicate slug) |
| 422 | Unprocessable | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Maintenance or database down |

### Example Error Response

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "price",
      "message": "Price must be greater than 0"
    },
    {
      "field": "name",
      "message": "Name is required"
    }
  ],
  "statusCode": 422
}
```

---

## Rate Limiting

### Rate Limit Headers

All responses include:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

### Limits by Endpoint Category

| Category | Public Users | Authenticated | Admin |
|----------|--------------|---------------|-------|
| Products | 30/15min | 100/15min | 200/15min |
| Orders | 10/15min | 50/15min | 200/15min |
| Sensitive* | 5/15min | 10/15min | 50/15min |

*Sensitive: Payment verification, refunds, password changes

### Rate Limit Response

```http
HTTP/1.1 429 Too Many Requests

{
  "success": false,
  "error": "Rate limit exceeded",
  "details": {
    "limit": 30,
    "current": 31,
    "reset_in_seconds": 300
  }
}
```

---

## Pagination

Standard pagination format:

```json
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

**Parameters:**
- `page` (default: 1, min: 1)
- `limit` (default: 20, min: 1, max: 100)

---

## API Examples

### JavaScript/Fetch

```javascript
// Get products
const response = await fetch('/api/products');
const { data } = await response.json();

// Create order (authenticated)
const token = localStorage.getItem('auth_token');
const order = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    items: [{ product_id: 'id', quantity: 2 }],
    shipping_email: 'customer@example.com'
  })
});
```

### cURL

```bash
# Get products
curl -X GET "http://localhost:5001/api/products"

# Create order
curl -X POST "http://localhost:5001/api/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"product_id": "id", "quantity": 2}],
    "shipping_email": "customer@example.com"
  }'
```

### Python (requests)

```python
import requests

# Get products
response = requests.get('http://localhost:5001/api/products')
products = response.json()['data']

# Create order
headers = {'Authorization': f'Bearer {token}'}
response = requests.post(
  'http://localhost:5001/api/orders',
  json={
    'items': [{'product_id': 'id', 'quantity': 2}],
    'shipping_email': 'customer@example.com'
  },
  headers=headers
)
```

---

## Changelog

**Version 1.0** (November 2025)
- Initial API release
- All endpoints documented
- Real-time stock updates (SSE)
- Audit logging for orders

---

## Support

**Issues or Questions?**
- Email: api@fjl.com
- GitHub: github.com/fjl/api/issues
- Discord: discord.gg/fjl

**Documentation:**
- API Changes: [CHANGELOG.md](./CHANGELOG.md)
- Security: [SECURITY.md](../SECURITY.md)
- Rate Limiting: [RATE_LIMITING.md](./RATE_LIMITING.md)
