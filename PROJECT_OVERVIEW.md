# FJL (Famous Jolly Luxe) - Complete Project Overview

## Executive Summary

FJL is a **modern, full-stack e-commerce platform** built for luxury streetwear retail. It combines a sophisticated frontend with a robust backend API, comprehensive admin dashboard, and database-driven product management. The platform emphasizes offline-first resilience, secure authentication, and merchant empowerment.

**Key Stats:**
- Frontend: Vanilla JavaScript + Tailwind CSS (No frameworks)
- Backend: Node.js + Express + PostgreSQL (Supabase)
- Database: 9 core tables with relationships
- Admin Panel: Full CRUD operations with role-based access
- Email Service: Resend integration for order notifications
- Authentication: JWT tokens with 7-day expiry for admins

---

## 1. Project Architecture Overview

### 1.1 Directory Structure

```
FJL/
├── Frontend (Root Directory)
│   ├── Core Pages
│   │   ├── index.html                    (Homepage with hero section)
│   │   ├── shop.html                     (Product catalog with filtering)
│   │   ├── product.html                  (Product detail view)
│   │   ├── cart.html                     (Shopping cart page)
│   │   ├── checkout.html                 (Checkout form)
│   │   └── order-confirmation.html       (Order success page)
│   ├── Static Pages
│   │   ├── about.html, contact.html
│   │   └── [Legal Pages]                 (Terms, Privacy, Refund, Shipping)
│   ├── JavaScript Modules (/js)
│   │   ├── api-integration.js            (API request handler - 250 lines)
│   │   ├── api-client.js                 (API endpoints - 330 lines)
│   │   ├── shop-integration.js           (Product loading - 230 lines)
│   │   ├── checkout-integration.js       (Order creation - 380 lines)
│   │   ├── cart-manager.js               (Cart CRUD - 130 lines)
│   │   ├── cart-drawer.js                (Cart UI - 570 lines)
│   │   ├── notifications.js              (Toast system - 320 lines)
│   │   ├── newsletter-integration.js     (Subscriber management)
│   │   └── config.js                     (API configuration)
│   ├── Admin Panel (/admin)
│   │   ├── index.html                    (Login page)
│   │   ├── dashboard.html                (Analytics dashboard)
│   │   ├── products.html                 (Product CRUD)
│   │   ├── categories.html               (Category management)
│   │   ├── orders.html                   (Order management)
│   │   ├── customers.html                (Customer database)
│   │   ├── settings.html                 (Store configuration)
│   │   ├── admin.js                      (Core service - 1200 lines)
│   │   ├── admin-categories.js           (Category UI - 400 lines)
│   │   └── styles.css                    (Admin styling)
│   └── Styling & Assets
│       └── [Tailwind CSS + Custom styles embedded in HTML]
│
├── Backend (/backend)
│   ├── src/
│   │   ├── index.js                      (Express server entry point)
│   │   ├── config/
│   │   │   ├── database.js               (Supabase initialization)
│   │   │   ├── jwt.js                    (Token signing/verification)
│   │   │   └── resend.js                 (Email service config)
│   │   ├── middleware/
│   │   │   ├── auth.js                   (JWT & role-based auth)
│   │   │   ├── errorHandler.js           (Global error handling)
│   │   │   ├── upload.js                 (Multer file upload)
│   │   │   └── validation.js             (Input validation chains)
│   │   ├── routes/
│   │   │   ├── auth.js                   (Authentication: login, verify)
│   │   │   ├── products.js               (Product CRUD + image upload)
│   │   │   ├── categories.js             (Category management)
│   │   │   ├── orders.js                 (Order CRUD)
│   │   │   ├── customers.js              (Customer data)
│   │   │   ├── settings.js               (Store configuration)
│   │   │   ├── contact.js                (Contact form)
│   │   │   └── webhooks.js               (External service webhooks)
│   │   └── services/
│   │       ├── productService.js         (1199 lines - product logic)
│   │       ├── orderService.js           (Order processing logic)
│   │       ├── categoryService.js        (619 lines - category logic)
│   │       ├── emailService.js           (1204 lines - email handling)
│   │       └── settingsService.js        (Settings with caching)
│   └── package.json
│
└── Database & Configuration
    ├── SUPABASE_SCHEMA.sql               (Complete DB schema)
    ├── .env                              (Backend environment variables)
    └── .env.example                      (Example configuration)
```

### 1.2 Technology Stack

**Frontend:**
- **HTML5** - Semantic markup
- **CSS3** - Tailwind CSS utility framework
- **JavaScript (ES6+)** - Vanilla JS, no frameworks
- **Vite** - Build tool and dev server
- **Lucide Icons** - SVG icon library

**Backend:**
- **Node.js** (v18+) - Runtime
- **Express.js** (v4.18.2) - Web framework
- **PostgreSQL** - Via Supabase
- **JWT** - Token-based authentication
- **Bcrypt** - Password hashing (cost=10)
- **Resend** - Email service

**Third-Party Services:**
- **Supabase** - PostgreSQL database + storage
- **Resend** - Email notifications
- **Multer** - File upload handling

---

## 2. Frontend Architecture

### 2.1 Page Structure & Navigation

```
Homepage (index.html)
├── Hero Section with CTA
├── Featured Products Carousel
├── Newsletter Signup
├── Featured Brands/Collections
├── Footer with Links
└── Navigation to:
    ├── Shop (shop.html)
    ├── About (about.html)
    ├── Contact (contact.html)
    ├── Legal Pages (terms, privacy, refund, shipping)
    └── Admin Panel (admin/index.html)

Shop Catalog (shop.html)
├── Product Grid (2-4 columns, responsive)
├── Filters:
│   ├── By Category (dropdown)
│   ├── By Availability (in stock, out of stock, all)
│   └── By Price Range
├── Sorting Options
│   ├── Newest
│   ├── Price: Low to High
│   ├── Price: High to Low
│   └── Popularity
├── Product Cards (clickable → product.html?id=XXX)
└── Cart Icon in Header (updated badge)

Product Detail (product.html)
├── Product Images (gallery with thumbnails)
├── Product Info:
│   ├── Name & SKU
│   ├── Price (with optional original price)
│   ├── Description (dynamic from admin panel)
│   ├── Stock Status
│   └── Category Tag
├── Variant Selection:
│   ├── Size Selector (S, M, L, XL, etc.)
│   ├── Color Selector (with color buttons)
│   └── Real-time Stock Display ("In Stock", "Out of Stock", etc.)
├── Quantity Selector (1-max available)
├── Add to Cart Button
├── "You Might Also Like" Section (category-based recommendations)
└── Related Products (first 4 from same category)

Shopping Cart (cart.html)
├── Cart Items List:
│   ├── Product Image, Name, SKU
│   ├── Size & Color Display
│   ├── Price per Unit
│   ├── Quantity Adjuster
│   └── Remove Button
├── Cart Summary:
│   ├── Subtotal
│   ├── Tax (7.5%)
│   ├── Shipping (₦0 - free)
│   └── Total
├── Proceed to Checkout Button
└── Continue Shopping Link

Checkout (checkout.html)
├── Shipping Address Form:
│   ├── First/Last Name
│   ├── Email
│   ├── Phone Number
│   ├── Address
│   ├── City, State, Postal Code, Country
│   └── Validation Messages
├── Payment Method Selection:
│   ├── Bank Transfer (default)
│   └── Other methods (placeholder)
├── Order Review:
│   ├── Items List
│   ├── Subtotal + Tax + Shipping
│   ├── Final Total
│   └── Customer Summary
├── Place Order Button
└── Terms & Privacy Links

Order Confirmation (order-confirmation.html)
├── Success Message
├── Order Number (ORD-XXXXXXX)
├── Bank Payment Details:
│   ├── Bank Name
│   ├── Account Number
│   ├── Account Type
│   └── Account Holder Name
├── Order Summary:
│   ├── Items Ordered
│   ├── Total Amount Due
│   └── Shipping Address
├── Next Steps Information
└── View Order Link

Admin Login (admin/index.html)
├── Email Input
├── Password Input
├── Login Button
├── Error Messages
└── Redirect on Success → admin/dashboard.html

Admin Dashboard (admin/dashboard.html)
├── Welcome & User Info
├── Analytics Cards:
│   ├── Total Sales (current month)
│   ├── Total Orders
│   ├── Pending Orders Count
│   └── Customer Count
├── Recent Orders Table
├── Navigation to:
│   ├── Products Management
│   ├── Categories Management
│   ├── Orders Management
│   ├── Customers Database
│   └── Settings

Products Management (admin/products.html)
├── Products Table:
│   ├── Product Name
│   ├── SKU
│   ├── Category
│   ├── Price
│   ├── Stock Level
│   ├── Status (Active/Inactive)
│   └── Action Buttons (Edit, Delete)
├── Search & Filter
├── Add New Product Button → Modal Form:
│   ├── Product Name
│   ├── SKU
│   ├── Description
│   ├── Price
│   ├── Category Dropdown
│   ├── Image Upload
│   ├── Color & Size Inputs
│   ├── Featured Toggle
│   └── Save/Cancel
├── Edit Product Modal
└── Bulk Actions (Enable, Disable, Delete)

Categories Management (admin/categories.html)
├── Categories List with Drag-to-Reorder
├── Category Cards:
│   ├── Category Name
│   ├── Product Count
│   ├── Sort Order
│   ├── Edit Button
│   └── Delete Button
├── Add New Category Button → Modal:
│   ├── Category Name (auto-generates slug)
│   ├── Description
│   ├── Image URL
│   └── Save/Cancel
└── Archive vs. Hard Delete Options

Orders Management (admin/orders.html)
├── Orders Table:
│   ├── Order Number
│   ├── Customer Email
│   ├── Order Total
│   ├── Order Status
│   ├── Payment Status
│   ├── Order Date
│   └── Action Button (View/Update)
├── Filter by:
│   ├── Status (Pending, Processing, Shipped, Delivered, Cancelled)
│   ├── Payment Status
│   └── Date Range
├── Search by Order Number
└── Order Details Modal:
    ├── Customer Info
    ├── Shipping Address
    ├── Items Ordered
    ├── Order Total Breakdown
    ├── Status Update Dropdown
    ├── Payment Verification Button
    └── Cancel/Refund Actions

Customers Database (admin/customers.html)
├── Customers Table:
│   ├── Customer Name
│   ├── Email
│   ├── Total Orders
│   ├── Total Spent
│   ├── Newsletter Status
│   └── View Orders Button
└── Customer Detail Modal (if available)

Settings (admin/settings.html)
├── Store Information:
│   ├── Store Name
│   ├── Contact Email
│   └── Contact Phone
├── Bank Account Details:
│   ├── Bank Name
│   ├── Account Number
│   ├── Account Type
│   └── Account Holder Name
├── Pricing Configuration:
│   ├── Tax Rate (%)
│   ├── Shipping Cost (₦)
│   └── Currency Display
└── Save Changes Button
```

### 2.2 State Management

**Client-Side Persistence (localStorage):**
- `fjl_cart` - Shopping cart items with variants
- `fjl_products` - Cached product list (5-min TTL)
- `fjl_admin_token` - JWT authentication token
- `fjl_admin` - Admin user profile data
- `fjl_members` - Newsletter subscribers

**Real-Time Synchronization:**
- `BroadcastChannel API` - Cross-tab product updates
- `online/offline events` - Network state detection
- `storage event listener` - Listen for changes in other tabs
- Custom events - `cartUpdated`, `inventoryError`, `productUpdated`

**Session Management:**
- Admin tokens auto-refresh before expiry
- Logout clears tokens and redirects to login
- Protected routes check token validity
- Automatic redirect to login on 401 errors

### 2.3 Key JavaScript Modules

| Module | Lines | Purpose |
|--------|-------|---------|
| `api-integration.js` | ~250 | HTTP request handler with retry, cache deduplication, offline detection |
| `api-client.js` | ~330 | Centralized API endpoint definitions |
| `shop-integration.js` | ~230 | Product loading from API with fallback |
| `checkout-integration.js` | ~380 | Order creation and payment processing |
| `order-confirmation-integration.js` | ~150 | Order display and tracking |
| `cart-manager.js` | ~130 | Cart CRUD operations and localStorage sync |
| `cart-drawer.js` | ~570 | Cart sidebar UI with animations |
| `notifications.js` | ~320 | Toast notification system |
| `newsletter-integration.js` | ~180 | Subscriber management |
| `admin/admin.js` | ~1200 | Core admin authentication and service |
| `admin/admin-categories.js` | ~400 | Category management UI and API |

### 2.4 API Integration Strategy

**APIIntegrationManager (api-integration.js):**
```javascript
Features:
- Request retry logic (3 attempts with exponential backoff)
- Response caching (5-minute TTL)
- Request deduplication (same request → same promise)
- Offline detection and fallback
- Automatic retry on network recovery
- Error handling with user-friendly messages
```

**Example Flow:**
```
User loads shop.html
  ↓
JavaScript calls shop-integration.js.loadProducts()
  ↓
APIIntegrationManager.call('/products', {...})
  ↓
Check cache (not expired?) → return cached
  ↓
Check if request in-flight? → return same promise
  ↓
Network offline? → return localStorage fallback
  ↓
Make HTTP request with retry logic
  ↓
Cache response for 5 minutes
  ↓
Return data to shop.html
```

### 2.5 Responsive Design

**Breakpoints:**
- **Mobile** (< 768px) - 2-column grid, hamburger menu
- **Tablet** (768px - 1024px) - 3-column grid
- **Desktop** (> 1024px) - 4-column grid

**Mobile Optimizations:**
- Hamburger navigation menu
- Touch-friendly buttons (44px minimum)
- Vertical form layout
- Stacked product details
- Full-width images

### 2.6 CSS Architecture

**Styling Approach:**
- **Tailwind CSS** - Utility-first CSS framework
- **Custom Embedded Styles** - In `<style>` tags per page
- **CSS Variables** - For colors, spacing, shadows
- **Component-Based** - Reusable button, card, form styles

**Key Color Scheme:**
- **Primary** - Luxury gold/accent color (#E09F3E)
- **Text** - Dark gray/black (#1F2937)
- **Background** - White/light gray (#F9FAFB)
- **Borders** - Light gray (#E5E7EB)

---

## 3. Backend Architecture

### 3.1 Express Server Setup

**Entry Point (src/index.js):**
- CORS configuration for frontend origins
- Helmet security headers
- Morgan HTTP logging
- Body parser for JSON/URL-encoded
- Static file serving
- Route mounting
- Global error handler
- 404 handler

**Middleware Stack (Order Matters):**
1. CORS middleware
2. Helmet security headers
3. Morgan logging
4. Body parser (JSON, URL-encoded, multipart)
5. Route-specific middleware (auth, validation)
6. Global error handler

### 3.2 API Routes Structure

**Base URL:** `http://localhost:5001/api`

#### **Authentication Routes (/api/auth)**
```
POST   /login
  Body: { email, password }
  Response: { success, token, admin }

GET    /verify
  Headers: Authorization: Bearer <token>
  Response: { success, admin }

POST   /logout
  Response: { success }
```

#### **Products Routes (/api/products)**
```
GET    /
  Query: ?category=slug&search=term&sort_by=field&page=1&limit=20
  Response: { success, data: [products], pagination }

GET    /featured
  Response: { success, data: [featured products] }

GET    /:id
  Response: { success, data: product with variants }

POST   /
  Headers: Authorization, require admin
  Body: { sku, name, description, price, category_id, ... }
  Response: { success, data: created product }

PUT    /:id
  Headers: Authorization, require admin
  Body: { partial product update }
  Response: { success, data: updated product }

DELETE /:id
  Headers: Authorization, require admin
  Response: { success }

POST   /:id/upload
  Headers: Authorization, multipart/form-data
  Files: image
  Response: { success, data: { imageUrl } }

GET    /:id/variants
  Response: { success, data: [variants] }

POST   /:id/variants
  Headers: Authorization, require admin
  Body: { size, color, stock_quantity }
  Response: { success, data: created variant }

PUT    /:id/variants/:vid
  Headers: Authorization, require admin
  Body: { stock_quantity }
  Response: { success, data: updated variant }
```

#### **Categories Routes (/api/categories)**
```
GET    /
  Query: ?page=1&limit=20
  Response: { success, data: [categories], pagination }

GET    /:id
  Response: { success, data: category with product count }

GET    /:slug/products
  Query: ?page=1&limit=20
  Response: { success, data: [products in category], pagination }

POST   /
  Headers: Authorization, require admin
  Body: { name, description, image_url }
  Response: { success, data: created category }

PUT    /:id
  Headers: Authorization, require admin
  Body: { name, description, image_url, is_active }
  Response: { success, data: updated category }

PATCH  /:id/archive
  Headers: Authorization, require admin
  Response: { success }

DELETE /:id
  Headers: Authorization, require admin
  Query: ?reassign_category_id=xxx (optional)
  Response: { success }

PATCH  /reorder
  Headers: Authorization, require admin
  Body: { categories: [{ id, sort_order }] }
  Response: { success }
```

#### **Orders Routes (/api/orders)**
```
POST   /
  Body: { user data, items, shipping address, payment_method }
  Response: { success, data: created order with order_number }

GET    /:id
  Response: { success, data: order with items }

GET    /number/:orderNumber
  Response: { success, data: order }

GET    /
  Headers: Authorization, require admin
  Query: ?status=pending&payment_status=pending&page=1
  Response: { success, data: [orders], pagination }

PUT    /:id/status
  Headers: Authorization, require admin
  Body: { order_status }
  Response: { success, data: updated order }

PUT    /:id/payment-status
  Headers: Authorization, require admin
  Body: { payment_status }
  Response: { success, data: updated order }

PUT    /:id/cancel
  Headers: Authorization, require admin
  Response: { success, data: cancelled order }

PUT    /:id/refund
  Headers: Authorization, require admin
  Body: { refund_amount }
  Response: { success, data: refunded order }
```

#### **Customers Routes (/api/customers)**
```
GET    /
  Headers: Authorization, require admin
  Query: ?page=1&limit=20&search=term
  Response: { success, data: [customers], pagination }

GET    /:id
  Response: { success, data: customer profile }

PUT    /:id
  Headers: Authorization
  Body: { first_name, last_name, phone, ... }
  Response: { success, data: updated customer }

GET    /:id/orders
  Headers: Authorization, require admin
  Response: { success, data: [customer orders] }
```

#### **Settings Routes (/api/settings)**
```
GET    /
  Response: { success, data: store settings (cached 5 min) }

PUT    /
  Headers: Authorization, require owner
  Body: { tax_rate, shipping_cost, bank details, ... }
  Response: { success, data: updated settings }
```

#### **Contact Routes (/api/contact)**
```
POST   /
  Body: { name, email, subject, message }
  Response: { success }
  (Sends email via Resend, stores in database)
```

### 3.3 Authentication & Authorization

**JWT Token Structure:**
```javascript
{
  sub: 'admin-uuid',
  email: 'admin@fjl.com',
  role: 'owner|manager|staff',
  type: 'admin',
  iat: timestamp,
  exp: timestamp + 7 days,
  aud: 'fjl-admin',
  iss: 'fjl-backend'
}
```

**Middleware Chain:**
```javascript
verifyJWT() → extract token, validate signature/expiry
requireAdmin() → ensure user is in admins table
requireRole('owner') → check role matches
requirePermission('manage_products') → check permission

Example:
router.put('/:id', verifyJWT, requireAdmin, requirePermission('manage_products'), updateProduct);
```

**Role Permissions Matrix:**

| Action | Owner | Manager | Staff |
|--------|-------|---------|-------|
| View Products | ✓ | ✓ | ✓ |
| Create Product | ✓ | ✓ | ✓ |
| Edit Product | ✓ | ✓ | ✓ |
| Delete Product | ✓ | ✓ | ✓ |
| Manage Categories | ✓ | ✓ | ✓ |
| Manage Orders | ✓ | ✓ | ✓ |
| Manage Customers | ✓ | ✓ | ✗ |
| Manage Admins | ✓ | ✗ | ✗ |
| Change Settings | ✓ | ✗ | ✗ |
| View Analytics | ✓ | ✓ | ✓ |

**Password Security:**
- Bcrypt hashing with cost=10 (10 iterations)
- Salting handled automatically
- Never return plain password hash
- Compare using bcrypt.compare() in auth middleware

### 3.4 Service Layer

**productService.js (1199 lines):**
```javascript
getAllProducts(filters, pagination)
  - Filter by: category, search, active status
  - Sort by: name, price, created_at, popularity
  - Pagination: limit & offset
  - Return with product_count aggregation

getFeaturedProducts(limit)
  - Featured products for homepage carousel

getProductById(id)
  - Include all variants with stock

createProduct(productData)
  - Validate SKU uniqueness
  - Create product record
  - Insert initial variants

updateProduct(id, updates)
  - Partial updates allowed
  - Validate if changing SKU
  - Update denormalized total_stock

deleteProduct(id)
  - Check order_items references
  - Delete product_variants cascade
  - Delete from Supabase storage

uploadProductImage(file, productId)
  - Upload to Supabase storage
  - Generate public URL
  - Store in database

deleteProductImage(imageKey)
  - Delete from Supabase storage
```

**categoryService.js (619 lines):**
```javascript
getAllCategories(pagination)
  - Include product_count per category
  - Paginate results

getCategoryById(id)
  - Full category with metadata

getCategoryBySlug(slug)
  - Find by URL-friendly slug

createCategory(categoryData)
  - Auto-generate slug from name
  - Set default sort_order

updateCategory(id, updates)
  - Update metadata
  - Toggle active status

archiveCategory(id)
  - Soft delete (set is_active = false)
  - Preserve data for queries

deleteCategory(id, reassignCategoryId)
  - Hard delete
  - Reassign products to new category OR delete products

updateCategoryOrder(categories)
  - Drag-and-drop reordering

getProductsByCategory(slug, pagination)
  - Products in category with pagination
```

**orderService.js:**
```javascript
createOrder(orderData)
  - Validate stock for all items
  - Get or create customer user
  - Create order record
  - Create order_items
  - Deduct inventory
  - Update user metrics
  - Send confirmation email

getOrderById(id)
  - Full order with items and customer

getOrdersByCustomer(customerId)
  - Customer order history

updateOrderStatus(id, newStatus)
  - Validate status transitions
  - Send email notifications

cancelOrder(id)
  - Restore inventory
  - Update order status
  - Send cancellation email

refundOrder(id, refundAmount)
  - Process refund
  - Update payment status
```

**emailService.js (1204 lines):**
```javascript
sendOrderConfirmation(order, customer)
  - Order number, items, total
  - Bank payment instructions
  - Tracking info link

sendPaymentVerificationEmail(order, customer)
  - Payment received notification
  - Order processing begins

sendShippingNotification(order, customer)
  - Shipment tracking details
  - Estimated delivery

sendDeliveryNotification(order, customer)
  - Delivery confirmation
  - Review request

Features:
  - Retry logic (3 attempts with exponential backoff)
  - Email validation
  - Database logging (email_logs table)
  - Error handling without blocking order
  - HTML template rendering
```

### 3.5 Input Validation

**Validation Chains (Express-Validator):**
```javascript
// Product validation
validateProduct = [
  body('sku').notEmpty().isString(),
  body('name').notEmpty().isString().trim(),
  body('price').isInt({ min: 0 }),
  body('category_id').notEmpty().isUUID(),
  body('description').optional().isString(),
  ...
];

// Order validation
validateOrder = [
  body('items').isArray({ min: 1 }),
  body('items.*.product_id').isUUID(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('first_name').notEmpty().isString().trim(),
  body('email').isEmail(),
  body('phone').optional().isMobilePhone(),
  body('address').notEmpty().isString(),
  ...
];

// Category validation
validateCategory = [
  body('name').notEmpty().isString().trim(),
  body('description').optional().isString(),
  body('image_url').optional().isURL(),
  ...
];
```

**Error Handling:**
```javascript
if (!validationResult(req).isEmpty()) {
  return res.status(400).json({
    success: false,
    errors: validationResult(req).array()
  });
}
```

---

## 4. Database Architecture

### 4.1 Database Schema (PostgreSQL via Supabase)

**9 Core Tables:**

#### **admins**
```sql
id            UUID PRIMARY KEY
email         VARCHAR(255) UNIQUE NOT NULL
password_hash VARCHAR(255) NOT NULL
first_name    VARCHAR(100)
last_name     VARCHAR(100)
role          VARCHAR(20) - owner|manager|staff
is_active     BOOLEAN DEFAULT true
last_login_at TIMESTAMP
created_at    TIMESTAMP DEFAULT NOW()
```

#### **categories**
```sql
id          UUID PRIMARY KEY
name        VARCHAR(255) NOT NULL
slug        VARCHAR(255) UNIQUE NOT NULL (auto-generated from name)
description TEXT
image_url   VARCHAR(255)
is_active   BOOLEAN DEFAULT true
sort_order  INTEGER DEFAULT 0 (for drag-drop reordering)
created_at  TIMESTAMP DEFAULT NOW()
updated_at  TIMESTAMP DEFAULT NOW()
```

#### **products**
```sql
id                 UUID PRIMARY KEY
sku                VARCHAR(100) UNIQUE NOT NULL
name               VARCHAR(255) NOT NULL
description        TEXT
price              INTEGER (in smallest unit, ₦100 = 10000)
original_price     INTEGER (strikethrough price, optional)
category_id        UUID FOREIGN KEY → categories.id
image_url          VARCHAR(255) (primary image)
images             TEXT[] (JSON array of additional images)
available_colors   TEXT[] (color options)
available_sizes    TEXT[] (size options)
total_stock        INTEGER (denormalized sum of variants)
is_active          BOOLEAN DEFAULT true
is_featured        BOOLEAN DEFAULT false
created_at         TIMESTAMP DEFAULT NOW()
updated_at         TIMESTAMP DEFAULT NOW()
```

#### **product_variants**
```sql
id               UUID PRIMARY KEY
product_id       UUID FOREIGN KEY → products.id (CASCADE)
size             VARCHAR(10) (XS, S, M, L, XL, XXL, etc.)
color            VARCHAR(50)
stock_quantity   INTEGER DEFAULT 0
cost_price       INTEGER (optional, for profit calculation)
created_at       TIMESTAMP DEFAULT NOW()
updated_at       TIMESTAMP DEFAULT NOW()

UNIQUE(product_id, size, color)
```

#### **users** (Customers)
```sql
id              UUID PRIMARY KEY
email           VARCHAR(255) UNIQUE NOT NULL
first_name      VARCHAR(100)
last_name       VARCHAR(100)
phone           VARCHAR(20)
address         VARCHAR(255)
city            VARCHAR(100)
state           VARCHAR(100)
postal_code     VARCHAR(20)
country         VARCHAR(100)
is_member       BOOLEAN DEFAULT false (newsletter)
order_count     INTEGER DEFAULT 0 (denormalized)
total_spent     INTEGER DEFAULT 0 (denormalized)
last_order_at   TIMESTAMP
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### **orders**
```sql
id              UUID PRIMARY KEY
order_number    VARCHAR(20) UNIQUE (format: ORD-XXXXXXX)
user_id         UUID FOREIGN KEY → users.id
shipping_name   VARCHAR(255)
shipping_email  VARCHAR(255)
shipping_phone  VARCHAR(20)
shipping_address VARCHAR(255)
shipping_city   VARCHAR(100)
shipping_state  VARCHAR(100)
shipping_postal_code VARCHAR(20)
shipping_country VARCHAR(100)
payment_method  VARCHAR(50) (bank_transfer, card, etc.)
subtotal        INTEGER
tax_amount      INTEGER
shipping_cost   INTEGER
total_amount    INTEGER
order_status    VARCHAR(20) (pending|processing|shipped|delivered|cancelled)
payment_status  VARCHAR(20) (pending|verified|completed|refunded)
notes           TEXT
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### **order_items** (Line Items)
```sql
id              UUID PRIMARY KEY
order_id        UUID FOREIGN KEY → orders.id (CASCADE)
product_id      UUID FOREIGN KEY → products.id
variant_id      UUID FOREIGN KEY → product_variants.id
product_name    VARCHAR(255)
sku             VARCHAR(100)
size            VARCHAR(10)
color           VARCHAR(50)
unit_price      INTEGER
quantity        INTEGER
total_price     INTEGER (unit_price * quantity)
created_at      TIMESTAMP DEFAULT NOW()
```

#### **members** (Newsletter Subscribers)
```sql
id             UUID PRIMARY KEY
email          VARCHAR(255) UNIQUE NOT NULL
full_name      VARCHAR(255)
is_subscribed  BOOLEAN DEFAULT true
signup_source  VARCHAR(100) (website, landing_page, etc.)
subscribed_at  TIMESTAMP DEFAULT NOW()
unsubscribed_at TIMESTAMP
```

#### **email_logs**
```sql
id              UUID PRIMARY KEY
recipient_email VARCHAR(255)
subject         VARCHAR(255)
email_type      VARCHAR(50) (order_confirmation, payment_verified, etc.)
status          VARCHAR(20) (sent, failed, bounced)
error_message   TEXT (if failed)
created_at      TIMESTAMP DEFAULT NOW()
```

#### **store_settings**
```sql
id              UUID PRIMARY KEY
setting_key     VARCHAR(100) UNIQUE
setting_value   TEXT (JSON-encoded if complex)
setting_type    VARCHAR(50) (string, integer, json)
updated_at      TIMESTAMP DEFAULT NOW()

Example Keys:
  - store_name
  - store_email
  - tax_rate
  - shipping_cost
  - bank_name
  - bank_account_number
  - bank_account_type
  - bank_account_holder
```

### 4.2 Database Relationships

```
categories (1) ──→ (M) products
products (1) ──→ (M) product_variants
products (1) ──→ (M) order_items

users (1) ──→ (M) orders
orders (1) ──→ (M) order_items
product_variants (1) ──→ (M) order_items
```

### 4.3 Indexing Strategy

**Primary Indexes:**
```sql
-- Products
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_sku ON products(sku);

-- Categories
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_is_active ON categories(is_active);

-- Orders
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_order_status ON orders(order_status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Users
CREATE INDEX idx_users_email ON users(email);

-- Product Variants
CREATE INDEX idx_variants_product_id ON product_variants(product_id);
CREATE UNIQUE INDEX idx_variants_unique ON product_variants(product_id, size, color);
```

---

## 5. Core Features & Functionality

### 5.1 Product Management

**Frontend (Admin Panel):**
- View all products in table with filtering
- Search by name, SKU, category
- Create new product with form validation
- Edit product details (name, price, description, category)
- Upload product images to Supabase storage
- Manage variants (size/color combinations)
- Set stock quantities per variant
- Toggle active/featured status
- Delete products with confirmation

**Backend:**
- CRUD operations with validation
- SKU uniqueness checking
- Image upload to Supabase storage
- Automatic total_stock calculation
- Product-variant relationship management
- Featured products filter for homepage

**Stock Management:**
- Variant-level stock tracking (size + color specific)
- Real-time stock validation during checkout
- Low stock warnings (< 3 units)
- Automatic deduction on order creation
- Stock restoration on order cancellation
- Inventory sync across tabs using BroadcastChannel

### 5.2 Dynamic Categories System

**Frontend:**
- View categories list with product counts
- Drag-and-drop reordering
- Create new category (auto-slug generation)
- Edit category metadata
- Archive (soft delete) categories
- Hard delete with product reassignment options

**Backend:**
- `getAllCategories()` with pagination and product counts
- `getCategoryBySlug()` for shop filtering
- `getProductsByCategory()` with pagination
- Automatic slug generation from category name
- Archive functionality (soft delete)
- Hard delete with reassignment or cascade delete options
- Reordering via PATCH /reorder endpoint

**Key Features:**
- URL-friendly slugs (e.g., "tracksuits" → shop.html?category=tracksuits)
- Product count aggregation
- Sort order customization
- Archive vs. hard delete distinction

### 5.3 Shopping Cart

**Implementation (cart-manager.js):**
```javascript
Cart class:
  constructor() - Initialize from localStorage
  addItem(product) - Add with size/color validation
  removeItem(productId, size, color) - Remove variant-specific
  updateQuantity(productId, quantity, size, color) - Update amount
  getTotal() - Calculate cart total
  getItemCount() - Count items
  clear() - Empty cart
  save() - Persist to localStorage
```

**Features:**
- Variant-aware (tracks size + color combinations)
- Real-time stock validation
- Price recalculation on updates
- Custom event dispatch (`cartUpdated`)
- Persistent across page reloads
- Local storage fallback for offline

**Cart UI (cart-drawer.js):**
- Slide-out sidebar from right
- Product cards with image, name, SKU
- Size & color display
- Price per unit
- Quantity adjuster with stock limits
- Remove button
- Cart summary with subtotal
- Tax calculation (7.5%)
- Proceed to checkout button

### 5.4 Checkout & Order Creation

**Checkout Form (checkout.html):**
1. **Shipping Address Section:**
   - First Name, Last Name
   - Email (for order confirmation)
   - Phone Number
   - Complete Address
   - City, State, Postal Code, Country
   - Real-time validation

2. **Payment Method:**
   - Bank Transfer (default) - displays bank details
   - Other payment methods (placeholder)

3. **Order Review:**
   - Cart items summary
   - Subtotal calculation
   - Tax (7.5%)
   - Shipping cost (₦0)
   - Final total

4. **Place Order:**
   - Validates all required fields
   - Calls `/api/orders` endpoint
   - Creates order with generated order_number
   - Stores order locally
   - Redirects to order confirmation

**Backend Order Processing (orderService.js):**
```javascript
createOrder(orderData):
  1. Get or create customer user (by email)
  2. Validate stock for all items
  3. Create order record
  4. Create order_items with variant IDs
  5. Deduct inventory from variants
  6. Update user.order_count & total_spent
  7. Send order confirmation email
  8. Return created order

Order Number Generation:
  - Format: ORD-XXXXXXX
  - Uses last 7 digits of timestamp + 3 random letters
  - Example: ORD-8642015XYZ
```

**Order Confirmation Page:**
- Order number display
- Bank account details (for manual payment)
- Order summary with items
- Shipping address
- Total amount due
- Next steps instructions
- View order button

### 5.5 Admin Dashboard

**Analytics & Metrics:**
- Total sales (current month)
- Total orders count
- Pending orders count
- Customer count
- Recent orders table (last 10)

**Features:**
- Welcome message with admin name
- Real-time metrics
- Quick links to management panels
- Status summary

### 5.6 Email Notifications (Resend)

**Order Confirmation Email:**
- Recipient: Customer email
- Includes: Order number, items, total, shipping address
- Bank payment instructions
- Order tracking link
- Styled HTML template

**Payment Verified Email:**
- Sent when admin marks payment as verified
- Confirms order is processing
- Estimated delivery timeline

**Shipping Notification Email:**
- Shipment tracking information
- Carrier and tracking number (if available)
- Estimated delivery date

**Delivery Notification Email:**
- Delivery confirmation
- Review request link

**Email Retry Logic:**
```javascript
sendEmail(recipient, subject, template):
  Try 1: Attempt send via Resend API
  If fails → Wait 2 seconds
  Try 2: Attempt send again
  If fails → Wait 5 seconds
  Try 3: Final attempt

  If all fail:
    - Log error in email_logs table
    - Don't block order creation
    - Alert admin of failed email
```

### 5.7 Related Products

**"You Might Also Like" Section:**
- Displays up to 4 products from same category
- Excludes current product
- Shows real product images, names, prices
- Clickable cards navigate to product pages
- Updates dynamically based on category

**Implementation:**
```javascript
loadRelatedProducts(currentProductId, categorySlug):
  1. Get all products from localStorage
  2. Filter: same category_slug
  3. Exclude: current product
  4. Take: first 4 products
  5. Render HTML with product cards
```

### 5.8 Product Filtering & Search

**Shop Page Filters:**
- **By Category** - Dropdown with all categories
- **By Availability** - All, In Stock, Out of Stock
- **By Search** - Text input searches product name/SKU

**Sorting Options:**
- Newest (by created_at DESC)
- Price: Low to High
- Price: High to Low
- Popularity (future implementation)

**Implementation:**
- Client-side filtering via JavaScript
- API call includes query parameters
- Results cached in localStorage
- Real-time inventory checks

---

## 6. Data Flow & Architecture

### 6.1 Product Display Flow

```
User visits shop.html
  ↓
JavaScript event: DOMContentLoaded
  ↓
Call: initializeShopProducts()
  ↓
API: GET /api/products?category=XXX&search=term
  ↓
APIIntegrationManager:
  ├── Check localStorage cache (5 min TTL)
  ├── Check if request in-flight (deduplication)
  ├── Check if offline (return cached data)
  ├── Make HTTP request (with retry logic)
  └── Cache response
  ↓
Backend: productService.getAllProducts()
  ├── Filter by category_id (join with categories)
  ├── Filter by search (ILIKE on name/description)
  ├── Join with product_variants for stock
  ├── Calculate total_stock per product
  ├── Sort results
  └── Paginate & return
  ↓
Frontend: shop-integration.js
  ├── Validate products
  ├── Store in window.productsFromAPI
  ├── Cache in localStorage.fjl_products
  └── Call displayProducts()
  ↓
Frontend: shop.html
  ├── Render product grid (2-4 columns)
  ├── Display images, names, prices
  ├── Show stock status
  └── Attach click handlers
  ↓
User clicks product → product.html?id=XXX
  ↓
API: GET /api/products/:id
  ↓
Backend returns product with:
  ├── All product details
  ├── All variants with stock
  ├── Related metadata
  └── Category info
  ↓
Frontend: product.html
  ├── Display full product details
  ├── Render image gallery
  ├── Show size/color selectors
  ├── Display stock status per variant
  ├── Load related products (same category)
  └── Ready for "Add to Cart"
```

### 6.2 Shopping & Checkout Flow

```
User clicks "Add to Cart"
  ↓
JavaScript: cart-manager.js
  ├── Validate size/color selected
  ├── Check variant stock
  ├── Create cart item object
  ├── Add to window.Cart
  ├── Save to localStorage.fjl_cart
  └── Dispatch cartUpdated event
  ↓
UI: cart-drawer.js
  ├── Listen for cartUpdated event
  ├── Update cart sidebar
  ├── Update badge count
  ├── Animate cart opening
  └── Display confirmation toast
  ↓
User clicks "View Summary" or "Proceed to Checkout"
  ↓
Redirect to checkout.html
  ↓
Form validation:
  ├── Shipping address required
  ├── Contact info required
  ├── Email format validation
  └── Show error messages
  ↓
User clicks "Place Order"
  ↓
Frontend: checkout-integration.js
  ├── Collect form data
  ├── Prepare order payload:
  │   ├── Customer info
  │   ├── Cart items
  │   ├── Calculate subtotal
  │   ├── Add tax (7.5%)
  │   ├── Add shipping (₦0)
  │   └── Map items to variant IDs
  ├── Show loading spinner
  └── POST /api/orders
  ↓
Backend: orderService.createOrder()
  ├── Get or create user (by email)
  ├── Validate stock one more time
  ├── Create order record with:
  │   ├── Generated order_number (ORD-XXXXXXX)
  │   ├── All order details
  │   ├── order_status: 'pending'
  │   └── payment_status: 'pending'
  ├── Create order_items for each cart item
  ├── Deduct stock from variants
  ├── Update user.order_count & total_spent
  ├── Call emailService.sendOrderConfirmation()
  └── Return created order
  ↓
Frontend receives order response
  ├── Store in localStorage (backup)
  ├── Clear cart (localStorage.fjl_cart)
  ├── Extract order_number
  └── Redirect to order-confirmation.html?order=ORDER_NUMBER
  ↓
Order confirmation page
  ├── Display order summary
  ├── Show bank payment details
  ├── Display order tracking link
  ├── Show next steps
  └── Allow customer to save/print
  ↓
Email: Order Confirmation Sent
  ├── Recipient: customer email
  ├── Subject: "Your order ORD-XXXXXXX"
  ├── Contents: Order details, bank info
  └── Can be tracked via email_logs table
  ↓
ADMIN FOLLOWS UP:
  ├── Checks email for bank transfer
  ├── Updates order payment_status → 'verified'
  ├── System sends payment verification email
  ├── Updates order_status → 'processing'
  ├── Prepares shipment
  ├── Updates order_status → 'shipped'
  ├── System sends shipping notification
  ├── After delivery:
  │   ├── Updates order_status → 'delivered'
  │   └── System sends delivery notification
  └── Customer can view order history
```

### 6.3 Admin Management Flow

```
Admin visits admin/index.html (Admin Login)
  ↓
Form submission:
  ├── Email input
  ├── Password input
  ├── Validation
  └── POST /api/auth/login
  ↓
Backend: auth.js middleware
  ├── Find admin by email
  ├── Compare password with bcrypt
  ├── Create JWT token (7 day expiry)
  ├── Return token + admin data
  └── Validate permissions
  ↓
Frontend: admin.js
  ├── Store token in localStorage.fjl_admin_token
  ├── Store admin data in localStorage.fjl_admin
  ├── Redirect to admin/dashboard.html
  └── Set Authorization header for future requests
  ↓
Admin Dashboard (admin/dashboard.html)
  ├── Display welcome message
  ├── Fetch analytics:
  │   ├── GET /api/orders (with status filters)
  │   ├── GET /api/customers
  │   ├── GET /api/products?is_active=true
  │   └── Calculate metrics
  ├── Display recent orders
  └── Show quick stats
  ↓
Admin clicks "Products" → admin/products.html
  ├── Fetch GET /api/products
  ├── Display products table
  ├── Features:
  │   ├── Search/filter
  │   ├── Add new product button
  │   ├── Edit button (open modal)
  │   ├── Delete button (with confirmation)
  │   ├── Manage variants
  │   └── Upload images
  ├── Create new product:
  │   ├── Fill form (name, SKU, price, category, description)
  │   ├── Upload image to Supabase
  │   ├── POST /api/products
  │   └── Reload products list
  ├── Edit product:
  │   ├── Load product data in form
  │   ├── Modify fields
  │   ├── PUT /api/products/:id
  │   └── Reload
  └── Delete product:
      ├── Confirm deletion
      ├── DELETE /api/products/:id
      └── Reload
  ↓
Admin clicks "Categories" → admin/categories.html
  ├── Fetch GET /api/categories
  ├── Display categories with product counts
  ├── Drag-to-reorder:
  │   ├── Reorder DOM elements
  │   ├── PATCH /api/categories/reorder with new order
  │   └── Persist to database
  ├── Create category:
  │   ├── Name input → auto-generate slug
  │   ├── Description, image URL
  │   ├── POST /api/categories
  │   └── Reload
  ├── Edit category:
  │   ├── Load data in form
  │   ├── Modify fields
  │   ├── PUT /api/categories/:id
  │   └── Reload
  └── Delete category:
      ├── Option 1: Archive (PATCH /api/categories/:id/archive)
      ├── Option 2: Hard delete with reassignment (DELETE /api/categories/:id?reassign_to=XXX)
      └── Reload
  ↓
Admin clicks "Orders" → admin/orders.html
  ├── Fetch GET /api/orders (with filters)
  ├── Display orders table with:
  │   ├── Order number (clickable)
  │   ├── Customer email
  │   ├── Total amount
  │   ├── Status badges
  │   └── Actions buttons
  ├── View order details:
  │   ├── Modal with full order info
  │   ├── Customer details
  │   ├── Items ordered
  │   ├── Shipping address
  │   └── Price breakdown
  ├── Update status:
  │   ├── Dropdown: pending → processing → shipped → delivered
  │   ├── PUT /api/orders/:id/status
  │   ├── System sends email to customer
  │   └── Reload order
  ├── Verify payment:
  │   ├── Check bank transfer receipt
  │   ├── PUT /api/orders/:id/payment-status (→ verified)
  │   ├── System sends payment email
  │   ├── Order moves to processing
  │   └── Admin prepares shipment
  └── Cancel order:
      ├── PUT /api/orders/:id/cancel
      ├── Restore inventory
      ├── Send cancellation email
      └── Reload
  ↓
Admin clicks "Customers" → admin/customers.html
  ├── Fetch GET /api/customers (with pagination)
  ├── Display customers table with:
  │   ├── Customer name
  │   ├── Email
  │   ├── Total orders
  │   ├── Total spent
  │   ├── Newsletter status
  │   └── View orders button
  ├── Click customer:
  │   ├── View customer orders
  │   ├── View order details
  │   └── Update customer info (optional)
  └── Manage newsletter subscriptions
  ↓
Admin clicks "Settings" → admin/settings.html
  ├── Fetch GET /api/settings (cached 5 min)
  ├── Display form with:
  │   ├── Store name
  │   ├── Contact email
  │   ├── Bank details:
  │   │   ├── Bank name
  │   │   ├── Account number
  │   │   ├── Account type
  │   │   └── Account holder
  │   ├── Tax rate (%)
  │   ├── Shipping cost (₦)
  │   └── Currency
  ├── Modify settings
  ├── PUT /api/settings
  └── Display confirmation message
```

---

## 7. Security Architecture

### 7.1 Authentication & Authorization

**Password Security:**
- Bcrypt hashing with cost=10
- Automatic salting
- Never store plain passwords
- Comparison using bcrypt.compare()

**JWT Tokens:**
- 7-day expiry for admin tokens
- Signed with JWT_SECRET (32+ char min)
- Claims include: sub, email, role, type, iat, exp, aud, iss
- Verified on every admin endpoint
- Revocation not implemented (clear localStorage to logout)

**Request Authentication:**
- Authorization header: `Bearer <token>`
- Token extracted and validated by verifyJWT middleware
- Invalid/expired tokens return 401 Unauthorized
- Automatic redirect to login on frontend

### 7.2 Authorization & Permissions

**Role-Based Access Control (RBAC):**
- Three roles: owner, manager, staff
- Permissions tied to roles
- Middleware: requireRole('owner')
- Fine-grained: requirePermission('manage_products')

**Protected Routes:**
- All /api/admin/* routes require verifyJWT + requireAdmin
- Admin routes check role permissions
- Restricted operations (settings) require owner role
- Customer endpoints (public) don't require auth

### 7.3 Input Validation & Sanitization

**Server-Side Validation (Express-Validator):**
- All request bodies validated
- Database constraints enforced
- Type checking (string, number, UUID, email, etc.)
- Length limits (VARCHAR, TEXT field limits)
- Format validation (email, URL, phone)
- SQL injection prevention via prepared statements

**Data Sanitization:**
- trim() on string inputs
- HTML escape in output
- No raw user input in SQL queries
- Parameterized queries throughout

### 7.4 Security Headers

**Helmet Middleware (Express):**
- Content-Security-Policy (CSP) - prevent XSS
- X-Frame-Options: DENY - prevent clickjacking
- X-Content-Type-Options: nosniff - prevent MIME sniffing
- Strict-Transport-Security (HSTS) - enforce HTTPS
- X-XSS-Protection - browser XSS protection
- Referrer-Policy - control referrer info

**CORS Configuration:**
- Whitelist specific origins
- Allow credentials in requests
- Specify allowed methods (GET, POST, PUT, DELETE)
- Expose custom headers

### 7.5 Rate Limiting

**Default Configuration:**
- 100 requests per 15 seconds per IP
- Applied globally to all endpoints
- Returns 429 Too Many Requests when exceeded

### 7.6 Database Security

**Access Control:**
- Supabase service key for elevated operations
- Row-level security (RLS) available but not currently used
- Constraints enforce referential integrity
- Cascading deletes prevent orphaned records

**Sensitive Data:**
- Password hashes only (never plain text)
- Email logged for contact/recovery (encrypted optional)
- JWT secrets stored in .env
- Supabase keys in .env (not in code)

---

## 8. Performance Optimization

### 8.1 Frontend Caching Strategy

**localStorage Caching:**
- Products: 5-minute TTL
- Settings: 5-minute TTL (on server)
- Cart: No expiry (persistent)
- Admin token: Until logout or expiry

**Cache Implementation:**
```javascript
APIIntegrationManager:
  - Store timestamp with cached data
  - Check: current_time - stored_time > TTL
  - If expired: fetch fresh data
  - If fresh: return cached
```

**Cache Invalidation:**
- Manual: User clears cache (future feature)
- Automatic: TTL expiry
- Real-time: BroadcastChannel notifications from admin updates

### 8.2 Request Deduplication

**In-Flight Request Detection:**
```javascript
If request for /api/products already in progress:
  Return same promise (avoid duplicate network calls)
Else:
  Create new promise and store
  Make HTTP request
  Return promise
```

### 8.3 Pagination

**Backend Implementation:**
- Products: Default limit=20, page=1
- Categories: Default limit=20, page=1
- Orders: Default limit=10, page=1
- Customers: Default limit=20, page=1

**Benefits:**
- Reduce data transfer
- Faster page load
- Better memory usage
- Database query optimization

### 8.4 Denormalized Fields

**Optimization for Fast Queries:**
- `users.order_count` - Avoid COUNT(*) join
- `users.total_spent` - Instant user metrics
- `products.total_stock` - Avoid SUM() calculation
- `categories.product_count` - Instant category stats

**Maintained By:**
- Triggers in database OR
- Backend service layer updates atomically

### 8.5 Image Optimization

**Storage:**
- Supabase storage for images
- Public URLs for frontend access
- No local file storage

**Lazy Loading:**
- Images load on demand
- Avoid loading all images at once
- Below-the-fold images deferred

**Compression:**
- Images uploaded to Supabase
- Supabase handles compression/optimization
- WebP conversion available

### 8.6 Compression & Transfer

**Gzip Compression:**
- Express compression middleware
- Reduces response size 60-80%
- Automatic on supported browsers

**Minification (Future):**
- CSS minification in build process
- JavaScript minification in build process
- HTML minification optional

### 8.7 Database Indexes

**Strategic Indexing:**
- Email lookups (users, admins, members)
- Category slug lookups (shop filtering)
- Order status filtering
- Product category filtering
- Variant lookups (product_id + size + color)
- Created date sorting

---

## 9. Admin Dashboard Capabilities

### 9.1 Product Management

**Create Product:**
- Form with all product details
- Category selection dropdown
- SKU uniqueness validation
- Price input (in smallest currency unit)
- Image upload to Supabase
- Auto-generate size/color variants

**Edit Product:**
- Pre-fill form with current data
- Change any field
- Update image
- Modify category
- Toggle active/featured status

**Manage Stock:**
- View all variants (size/color combos)
- Edit stock quantity per variant
- Low stock warnings (< 3 units)
- Total stock display

**Delete Product:**
- Confirmation dialog
- Prevents deletion of products with orders
- Cascade delete variants and images
- Cleanup Supabase storage

### 9.2 Category Management

**Create Category:**
- Name input (auto-generates slug)
- Description textarea
- Image URL input
- Sort order input

**Edit Category:**
- Change metadata
- Update image
- Modify sort order
- Toggle active status

**Reorder Categories:**
- Drag-and-drop interface
- Real-time reordering
- Affects shop.html display order
- PATCH request persists to database

**Archive vs Delete:**
- Archive: Soft delete, data retained
- Delete: Hard delete, product reassignment options

### 9.3 Order Management

**View Orders:**
- Table with all orders
- Columns: order number, customer, total, status, date
- Filter by status (pending, processing, shipped, delivered, cancelled)
- Filter by payment status
- Search by order number
- Pagination

**Update Order Status:**
- Status dropdown with valid transitions
- pending → processing → shipped → delivered
- Cancel option anytime
- System emails sent on status changes

**Payment Verification:**
- Manual verification after bank transfer
- Mark as "payment verified"
- Triggers payment confirmation email
- Order moves to processing
- Triggers shipment preparation

**Refund Processing:**
- Mark order as refunded
- Optional refund amount input
- Triggers refund email to customer

### 9.4 Customer Management

**View Customers:**
- Customer list with filtering
- Columns: name, email, orders, total spent, member status
- Search by name/email
- Pagination

**Customer History:**
- View customer's past orders
- Order details on click
- Repeat purchase tracking

**Contact:**
- Send message to customer (future feature)
- Newsletter management

### 9.5 Store Settings

**Business Information:**
- Store name
- Contact email
- Contact phone
- Business registration details

**Bank Details (displayed in order confirmation):**
- Bank name
- Account number
- Account type
- Account holder name

**Pricing Configuration:**
- Tax rate (default 7.5%)
- Shipping cost (default ₦0)
- Delivery time estimate

**Currency:**
- Primary currency (NGN)
- Currency symbol (₦)

---

## 10. Unique Features & Design Decisions

### 10.1 Offline-First Architecture

**Why?**
- Nigerian users often have unreliable internet
- App functions even during connectivity loss
- Better user experience in low-bandwidth areas

**How It Works:**
1. **Intelligent Caching:**
   - Products cached in localStorage
   - 5-minute TTL for freshness
   - Fallback when network unavailable

2. **Offline Detection:**
   - Uses `navigator.onLine`
   - Listens to online/offline events
   - Graceful degradation messages

3. **Request Queuing:**
   - Orders stored locally if offline
   - Queued for sync when online
   - Retry with exponential backoff

4. **User Feedback:**
   - "Offline - using cached data" warning
   - Loading indicators
   - Error messages with recovery suggestions

### 10.2 Luxury Streetwear Context

**Product Structure:**
- Color + Size variants (essential for clothing)
- Stock tracked per variant (e.g., "Black/XL" may be different from "Black/L")
- SKU management for inventory tracking
- Featured products for seasonal campaigns

**Category Organization:**
- Collections approach (Tracksuits, Polos, Jerseys, Caps)
- Sortable categories (drag-and-drop)
- Category-based recommendations

**Shopping Experience:**
- High-quality image galleries (multiple images per product)
- Detailed descriptions
- Size selection with stock display
- Color options with visual indicators

### 10.3 Role-Based Access Control

**Three-Tier System:**
- **Owner:** Full access, manage admins
- **Manager:** Most features, no admin/settings management
- **Staff:** Products, categories, orders, analytics only

**Benefits:**
- Delegate management tasks
- Maintain security hierarchy
- Scale team without compromising control

### 10.4 Email-Driven Order Flow

**Why Email?**
- Customers often have unreliable payment verification
- Manual bank transfer requires visibility
- Email provides paper trail
- Low-tech reliable communication

**Notification Sequence:**
1. Order confirmation → Payment instructions
2. Payment verified → Processing notification
3. Shipped → Tracking information
4. Delivered → Delivery confirmation + review request

### 10.5 Inventory by Variant

**Size/Color Combinations:**
```
Product: "FJL Tracksuit"
  - Black/XS: 5 units
  - Black/S: 10 units
  - Black/M: 8 units
  - Red/XS: 3 units
  - Red/S: 0 units (sold out)
  Total: 26 units
```

**Stock Validation:**
- Check variant stock before adding to cart
- Final validation during checkout
- Prevent overbooking
- Auto-deduction on order creation
- Restoration on cancellation

### 10.6 Denormalized Architecture

**For Performance:**
- `users.order_count` - Quick user metrics
- `users.total_spent` - Instant VIP identification
- `products.total_stock` - Fast availability display
- `email_logs` - Email tracking without joins

**Trade-off:**
- Faster reads
- More complex writes (must keep in sync)
- Triggers or service layer handles consistency

---

## 11. Environment Configuration

### 11.1 Backend Environment Variables

```
# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Email Service (Resend)
RESEND_API_KEY=your-resend-api-key

# Authentication
JWT_SECRET=your-secret-key-minimum-32-characters
JWT_EXPIRY=24h (internal tokens)
ADMIN_JWT_EXPIRY=7d (admin tokens)

# Server
NODE_ENV=development|production
PORT=5001
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://fjl.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=15000 (15 seconds)
RATE_LIMIT_MAX_REQUESTS=100

# File Storage (Supabase)
SUPABASE_STORAGE_BUCKET=product-images
SUPABASE_STORAGE_URL=https://project.supabase.co/storage/v1/object/public/product-images/

# Application Settings
ADMIN_EMAIL=admin@fjl.com (super admin)
STORE_CURRENCY=NGN
STORE_NAME=Famous Jolly Luxe
```

### 11.2 Frontend Configuration

**API Base URL (js/api-integration.js):**
```javascript
const API_BASE_URL = process.env.API_URL || 'http://localhost:5001/api';
```

**Configurable Per Environment:**
- Development: http://localhost:5001/api
- Production: https://api.fjl.com/api

---

## 12. Testing & Quality Assurance

### 12.1 Frontend Testing

**Tools Available:**
- Playwright (browser automation)
- Manual testing (recommended for UX)

**Test Scenarios:**
- Product display and filtering
- Cart operations (add, remove, update)
- Checkout flow
- Admin operations
- Offline functionality

### 12.2 Backend Testing

**Recommended Tools:**
- Jest (unit tests)
- Supertest (API testing)

**Test Coverage Areas:**
- Authentication (login, token validation)
- Authorization (role-based access)
- Product CRUD operations
- Category management
- Order creation and stock validation
- Email sending
- Error handling

### 12.3 Database Testing

**Validation:**
- Foreign key constraints
- Unique constraints
- Cascade delete rules
- Data type validation

---

## 13. Deployment Considerations

### 13.1 Frontend Deployment

**Build Process:**
```bash
npm run build  # Vite optimization
```

**Output:**
- Optimized HTML, CSS, JavaScript
- Minified assets
- Source maps (optional)

**Hosting:**
- Vercel, Netlify, AWS S3 + CloudFront
- Static file serving
- CORS headers configured

### 13.2 Backend Deployment

**Requirements:**
- Node.js v18+
- Supabase project
- Resend account (optional)

**Process:**
1. Install dependencies: `npm install`
2. Set environment variables
3. Start server: `npm start`
4. Configure reverse proxy (nginx/Apache)
5. SSL certificates (Let's Encrypt)

**Health Check:**
```
GET /api/health (suggested)
Response: { status: 'ok', uptime: 1234 }
```

### 13.3 Database Deployment

**Supabase Setup:**
1. Create project
2. Run SQL migration script (SUPABASE_SCHEMA.sql)
3. Create service role key
4. Configure storage buckets
5. Enable backups
6. Setup monitoring

### 13.4 Environment-Specific Configuration

**Development:**
- localhost URLs
- Verbose logging
- Hot reload
- Mock email (optional)

**Staging:**
- Production-like setup
- Real database
- Real email service
- Performance testing

**Production:**
- Optimized assets
- Rate limiting enabled
- HTTPS enforced
- CORS whitelist
- Database backups
- Error monitoring (Sentry, etc.)

---

## 14. Error Handling & Resilience

### 14.1 Backend Error Classes

**AppError:**
- Custom error class
- Includes status code and message
- Caught by global error handler

**NotFoundError:**
- 404 responses
- Resource not found

**ValidationError:**
- 400 responses
- Invalid input data

**UnauthorizedError:**
- 401 responses
- Invalid credentials or token

**ForbiddenError:**
- 403 responses
- Insufficient permissions

### 14.2 Global Error Handler

**Middleware Stack:**
```javascript
(error, req, res, next) => {
  if (error instanceof AppError) {
    return res.status(error.status).json({
      success: false,
      message: error.message
    });
  }

  // Default 500 error
  console.error(error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
}
```

### 14.3 Frontend Error Handling

**Try-Catch Blocks:**
- API calls wrapped in try-catch
- Graceful degradation to localStorage
- User-friendly error messages
- Toast notifications for errors

**Offline Fallback:**
- Network error → Return cached data
- Show "offline" warning
- Queue operations for retry

**Retry Logic:**
- HTTP 500/503 errors retried
- Exponential backoff (2s, 5s, 10s)
- Maximum 3 attempts
- Log failures for debugging

### 14.4 Email Failure Handling

**Resilience:**
- Email failure doesn't block order creation
- Logged in email_logs table
- Retry mechanism (3 attempts)
- Admin alerts for failures
- Manual resend capability (future)

---

## 15. Analytics & Business Metrics

### 15.1 Metrics Collected

**Sales Metrics:**
- Total revenue (sum of all orders)
- Orders by status
- Average order value
- Revenue by time period

**Customer Metrics:**
- Total customers
- Repeat purchase rate
- Customer lifetime value
- Newsletter subscription rate

**Product Metrics:**
- Product popularity (by order count)
- Best-selling categories
- Low stock items
- Featured product performance

**Email Metrics:**
- Email delivery success rate
- Failed email tracking
- Order confirmation delivery

### 15.2 Denormalized Fields for Performance

**users Table:**
- `order_count` - Quick stat without COUNT(*)
- `total_spent` - Instant VIP identification
- `last_order_at` - Recent customer detection

**products Table:**
- `total_stock` - Avoid SUM() on variants
- `is_featured` - Fast featured filter

**categories Table:**
- `product_count` - Display on category cards

### 15.3 Email Tracking

**email_logs Table:**
- Track every email sent
- Success/failure status
- Error messages
- Delivery confirmation (if available)
- Retry attempts

---

## 16. Project Summary

### What FJL Is:
- **E-commerce Platform** - Buy and sell fashion items
- **Admin-Powered** - Full control over products, categories, orders
- **Offline-First** - Works even with poor internet
- **Scalable** - Supports growth from small shop to franchise
- **Secure** - JWT auth, role-based access, input validation
- **Fashion-Focused** - Variants for size/color, luxury aesthetic

### Core Strengths:
1. **Separated Concerns** - Frontend, backend, database are independent
2. **Offline Resilience** - Works in low-connectivity environments
3. **Admin Control** - Comprehensive dashboard for merchant operations
4. **Performance** - Caching, pagination, denormalization
5. **Security** - JWT tokens, bcrypt hashing, input validation
6. **User Experience** - Smooth checkout, email notifications, cart management

### Technology Highlights:
- **Vanilla JavaScript** - No heavy frameworks, lightweight
- **Express.js** - Simple, fast, well-established
- **PostgreSQL** - Robust, relational, perfect for commerce
- **Supabase** - Managed PostgreSQL + storage
- **Resend** - Reliable email delivery
- **Tailwind CSS** - Utility-first styling, fast development

### Next Steps for Enhancements:
1. **Payment Gateway** - Integrate Paystack, Flutterwave for online payments
2. **SMS Notifications** - Complement email with SMS for urgency
3. **Wishlist** - Save products for later
4. **Reviews & Ratings** - Customer feedback on products
5. **Coupon System** - Discount codes and promotional campaigns
6. **Analytics Dashboard** - Visual charts and reports
7. **Shipping Integration** - Real-time shipping rates and tracking
8. **Multi-Currency** - Support international customers
9. **Push Notifications** - Keep customers engaged
10. **Subscription Orders** - Recurring purchases

---

## Appendix: File Reference

**Key Frontend Files:**
- `index.html` - Homepage (500+ lines)
- `shop.html` - Product catalog (1200+ lines)
- `product.html` - Product detail (1700+ lines)
- `checkout.html` - Checkout form (400+ lines)
- `admin/admin.js` - Admin service (1200+ lines)
- `js/api-integration.js` - HTTP handler (250 lines)
- `js/cart-manager.js` - Cart logic (130 lines)

**Key Backend Files:**
- `src/index.js` - Express server (100+ lines)
- `src/services/productService.js` - Product logic (1199 lines)
- `src/services/categoryService.js` - Category logic (619 lines)
- `src/services/emailService.js` - Email handler (1204 lines)
- `src/middleware/auth.js` - Authentication (150+ lines)
- `src/routes/products.js` - Product routes (150+ lines)
- `src/routes/categories.js` - Category routes (150+ lines)
- `src/routes/orders.js` - Order routes (200+ lines)

**Database:**
- `SUPABASE_SCHEMA.sql` - Complete schema with 9 tables

---

**Project Version:** 1.0
**Last Updated:** November 2025
**Status:** Active Development
**License:** Proprietary - Famous Jolly Luxe
