# FJL Backend - Quick Start Guide 🚀

## ⚡ Start Backend (2 minutes)

```bash
cd backend
npm run dev
```

✅ Server runs on: **http://localhost:3000**

Test it:
```bash
curl http://localhost:3000/health
```

---

## 📱 Frontend Integration (5 minutes)

### 1. Add API Client to HTML
```html
<script type="module">
  import { productsAPI, ordersAPI, customersAPI } from './js/api-client.js';
  // Your code here
</script>
```

### 2. Load Products
```javascript
const { data: products } = await productsAPI.getAll();
```

### 3. Create Order
```javascript
const order = await ordersAPI.create({
  items: cartItems,
  shipping_email: 'customer@example.com',
  shipping_first_name: 'John',
  shipping_last_name: 'Doe',
  shipping_phone: '+2348012345678',
  shipping_address: '123 Main St',
  shipping_city: 'Lagos',
  shipping_state: 'Lagos',
  shipping_postal_code: '100001',
  shipping_country: 'Nigeria',
  buyer_name: 'John Doe',
  subtotal: 10000,
  tax: 750,
  shipping_cost: 0,
  total_amount: 10750
});
```

### 4. Newsletter Signup
```javascript
await customersAPI.subscribeNewsletter('email@example.com', 'Full Name');
```

---

## 🔑 Admin Login (for testing)

### First, create an admin account in Supabase:

1. Go to Supabase dashboard
2. SQL Editor → Run this:
```sql
INSERT INTO admins (
  email,
  password_hash,
  full_name,
  role,
  is_active
) VALUES (
  'admin@fjl.com',
  '$2a$10$YourHashedPasswordHere',
  'Admin User',
  'owner',
  true
);
```

### Then login:
```javascript
const { data } = await authAPI.login('admin@fjl.com', 'password123');
console.log(data.token); // Use this token for admin endpoints
```

---

## 📊 27 API Endpoints

### Public Endpoints (No auth needed)
```
GET    /api/products              - List products
GET    /api/products/:id          - Get product
GET    /api/products/featured     - Featured products
GET    /api/products/:id/variants - Get variants
POST   /api/orders                - Create order
GET    /api/orders/:id            - Get order
GET    /api/orders/number/:num    - Get by number
POST   /api/customers             - Register customer
POST   /api/customers/members/subscribe - Newsletter
```

### Admin Endpoints (Need auth)
```
POST   /api/auth/login            - Admin login
GET    /api/auth/verify           - Verify token
POST   /api/auth/logout           - Logout
POST   /auth/change-password      - Change password
POST   /api/products              - Create product
PUT    /api/products/:id          - Update product
DELETE /api/products/:id          - Delete product
POST   /api/products/:id/variants - Create variant
PUT    /api/products/:id/variants/:vid - Update stock
GET    /api/orders                - List orders
PUT    /api/orders/:id/status     - Update status
PUT    /api/orders/:id/payment-status - Verify payment
DELETE /api/orders/:id            - Cancel order
GET    /api/customers             - List customers
GET    /api/customers/:id         - Get customer
PUT    /api/customers/:id         - Update customer
DELETE /api/customers/:id         - Delete customer
GET    /api/customers/:id/orders  - Customer orders
GET    /api/customers/members/list - List members
PUT    /api/customers/members/:id/unsubscribe - Unsubscribe
```

---

## 📧 Email System

Automatically sends emails for:
- ✅ Order confirmation
- ✅ Payment verified
- ✅ Shipping notification
- ✅ Newsletter welcome

Check `email_logs` table in Supabase to verify.

---

## 💾 Database

**11 Tables:**
- users, products, product_variants, orders, order_items
- categories, members, admins, store_settings
- email_campaigns, email_logs

**4 Views:**
- v_daily_revenue, v_order_status_summary, v_top_products
- v_customer_lifetime_value

---

## ⚙️ Environment Variables

Already configured in `.env`:
- Database: Supabase URL & keys
- Email: Resend API key
- JWT: Secret & expiry
- CORS: Allowed origins
- Rate Limit: 100 requests/15s

---

## 🧪 Test With Postman

### 1. Get Products
```
GET http://localhost:3000/api/products
```

### 2. Create Order
```
POST http://localhost:3000/api/orders
Content-Type: application/json

{
  "items": [{
    "product_id": "uuid",
    "product_name": "Shirt",
    "product_sku": "SKU123",
    "size": "M",
    "color": "Black",
    "unit_price": 5000,
    "quantity": 1,
    "total_price": 5000,
    "variant_id": "uuid"
  }],
  "shipping_email": "test@example.com",
  "shipping_first_name": "John",
  "shipping_last_name": "Doe",
  "shipping_phone": "+2348012345678",
  "shipping_address": "123 Main St",
  "shipping_city": "Lagos",
  "shipping_state": "Lagos",
  "shipping_postal_code": "100001",
  "shipping_country": "Nigeria",
  "buyer_name": "John Doe",
  "subtotal": 5000,
  "tax": 375,
  "shipping_cost": 0,
  "total_amount": 5375
}
```

### 3. Get Order
```
GET http://localhost:3000/api/orders/ORD-1234567ABC
```

### 4. Newsletter Signup
```
POST http://localhost:3000/api/customers/members/subscribe
Content-Type: application/json

{
  "email": "subscriber@example.com",
  "full_name": "John Doe"
}
```

---

## 🔒 Security

- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Input validation (40+ validators)
- ✅ Password hashing (bcrypt)
- ✅ CORS enabled
- ✅ Rate limiting
- ✅ Security headers (Helmet)
- ✅ Error handling

---

## 📝 Key Files

| File | Purpose |
|------|---------|
| `js/api-client.js` | Frontend API calls |
| `backend/src/config/` | Database, Email, JWT config |
| `backend/src/middleware/` | Auth, validation, errors |
| `backend/src/services/` | Business logic |
| `backend/src/routes/` | API endpoints |
| `backend/.env` | Configuration |

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 in use | Change PORT in .env |
| DB connection error | Check SUPABASE_URL & SUPABASE_KEY |
| CORS error | Ensure frontend on 5173, backend on 3000 |
| Email not sending | Verify RESEND_API_KEY is valid |
| Auth failing | Check admin exists in admins table |

---

## 📚 Full Documentation

- **BACKEND_INTEGRATION_GUIDE.md** - Complete setup guide
- **FRONTEND_API_INTEGRATION.md** - Code examples
- **IMPLEMENTATION_SUMMARY.md** - Full overview
- **backend/API_DOCUMENTATION.md** - Endpoint details

---

## ✅ Checklist

- [ ] Backend running (`npm run dev`)
- [ ] Database connected (check logs)
- [ ] Email service working (check logs)
- [ ] Products loading on frontend
- [ ] Order creation working
- [ ] Email confirmations being sent
- [ ] Admin login working
- [ ] Newsletter signup working

---

## 🚀 Ready to Deploy?

See **IMPLEMENTATION_SUMMARY.md** for deployment options:
- Railway.com (1 click from GitHub)
- Render.com (free tier)
- Heroku (flexible)
- DigitalOcean (full control)

---

**Status: ✅ READY TO USE**

Happy coding! 🎉
