# FJL Backend - Famous Jelly Luxe API Server

Production-ready Node.js + Express backend for the FJL e-commerce platform, integrated with Supabase and Resend email service.

## 🌟 Features

✅ **Complete REST API** - 27 endpoints for all operations
✅ **Supabase Integration** - PostgreSQL database with real-time capabilities
✅ **Resend Email Service** - Transactional and campaign emails
✅ **JWT Authentication** - Secure admin access
✅ **Role-Based Access Control** - Fine-grained permissions (Owner, Manager, Staff)
✅ **Input Validation** - Express-validator for all requests
✅ **Security** - Helmet, CORS, rate limiting
✅ **Error Handling** - Global error handling with logging
✅ **Logging** - Morgan request logging
✅ **Docker Ready** - Containerized deployment
✅ **Railway Compatible** - One-click deployment

## 📦 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT + bcryptjs
- **Email**: Resend API
- **Validation**: express-validator
- **Security**: Helmet, CORS, express-rate-limit
- **Containerization**: Docker
- **Deployment**: Railway.com

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ and npm 9+
- Supabase account (free tier works)
- Resend account (free tier works)
- Git

### 2. Clone & Install

```bash
cd backend
npm install
```

### 3. Set Up Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
RESEND_API_KEY=your-resend-key
JWT_SECRET=your-secret-32-chars-min
```

### 4. Create Database

1. Log in to Supabase dashboard
2. SQL Editor → New Query
3. Copy entire contents of `schema.sql`
4. Execute to create all tables

### 5. Create Admin User

In Supabase SQL Editor:

```sql
-- Hash password first using bcryptjs
-- Example hash for "admin123": $2a$10$nOQm8jy7ZKYXh.V1VVZKheJb.P3xWZjGzqI.5ybmNx1iW0QLfWyHC

INSERT INTO admins (
  email,
  password_hash,
  full_name,
  role,
  is_active
) VALUES (
  'admin@fjl.com',
  '$2a$10$...',  -- Your bcrypt hash
  'FJL Admin',
  'owner',
  true
);
```

### 6. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will start on `http://localhost:3000`

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Authentication (4 endpoints)
```
POST   /api/auth/login              - Admin login
GET    /api/auth/verify             - Verify token
POST   /api/auth/logout             - Logout
POST   /api/auth/change-password    - Change password
```

### Products (8 endpoints)
```
GET    /api/products                - List all
GET    /api/products/:id            - Get details
POST   /api/products                - Create (admin)
PUT    /api/products/:id            - Update (admin)
DELETE /api/products/:id            - Delete (admin)
GET    /api/products/:id/variants   - Get inventory (admin)
POST   /api/products/:id/variants   - Create variant (admin)
PUT    /api/products/:id/variants/:v - Update variant (admin)
```

### Orders (7 endpoints)
```
POST   /api/orders                  - Create order
GET    /api/orders/:id              - Get order
GET    /api/orders/number/:num      - Get by number
GET    /api/orders                  - List all (admin)
PUT    /api/orders/:id/status       - Update status (admin)
PUT    /api/orders/:id/payment-stat - Verify payment (admin)
DELETE /api/orders/:id              - Cancel (admin)
```

### Customers (8 endpoints)
```
POST   /api/customers               - Register
GET    /api/customers/:id           - Get (admin)
GET    /api/customers               - List (admin)
PUT    /api/customers/:id           - Update (admin)
GET    /api/customers/:id/orders    - Order history (admin)
POST   /api/customers/members       - Newsletter signup
GET    /api/customers/list/all      - List members (admin)
PUT    /api/customers/:id/unsubscr  - Unsubscribe (admin)
```

## 🔐 Authentication

All admin endpoints require JWT token:

```bash
# 1. Login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fjl.com",
    "password": "your-password"
  }'

# Response includes token:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs..."
}

# 2. Use token in requests
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/products
```

## 📧 Email Automation

Emails are automatically sent for:
- Order confirmations
- Payment verification
- Member welcome
- Order status updates

All emails are logged in `email_logs` table with:
- Delivery status
- Open/click tracking
- Bounce handling
- Resend API responses

## 🗄️ Database Schema

**11 Tables**:
- `users` - Customer profiles
- `products` - Product catalog
- `product_variants` - Inventory by size/color
- `orders` - Order transactions
- `order_items` - Order line items
- `categories` - Product categories
- `members` - Newsletter subscribers
- `admins` - Staff accounts
- `store_settings` - Configuration
- `email_campaigns` - Bulk campaigns
- `email_logs` - Email tracking

**4 Views**:
- `v_daily_revenue` - Revenue summary
- `v_order_status_summary` - Order stats
- `v_top_products` - Best sellers
- `v_customer_lifetime_value` - Customer stats

See `schema.sql` for details.

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t fjl-backend:latest .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e SUPABASE_URL=... \
  -e SUPABASE_KEY=... \
  -e RESEND_API_KEY=... \
  fjl-backend:latest
```

## 🚢 Railway Deployment

### 1. Connect Repository

```bash
git init
git add .
git commit -m "FJL backend"
git push origin main
```

### 2. Deploy to Railway

1. Go to railway.app
2. New Project → Deploy from GitHub
3. Select your repository
4. Railway auto-detects Dockerfile and deploys

### 3. Add Environment Variables

In Railway Dashboard → Variables:

```
SUPABASE_URL=your-url
SUPABASE_KEY=your-key
SUPABASE_SERVICE_KEY=your-service-key
RESEND_API_KEY=your-key
JWT_SECRET=your-secret-32-chars
NODE_ENV=production
```

### 4. Test Deployment

Once deployed, test the health endpoint:

```bash
curl https://your-railway-url/health
```

## 📊 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration
│   │   ├── database.js   # Supabase client
│   │   ├── resend.js     # Email service
│   │   └── jwt.js        # JWT handling
│   ├── middleware/       # Express middleware
│   │   ├── auth.js       # Authentication
│   │   ├── validation.js # Input validation
│   │   └── errorHandler.js
│   ├── services/         # Business logic
│   │   ├── emailService.js
│   │   ├── productService.js
│   │   └── orderService.js
│   ├── routes/           # API endpoints
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   └── customers.js
│   └── index.js          # Main app
├── .env.example          # Environment template
├── package.json          # Dependencies
├── schema.sql            # Database schema
├── Dockerfile            # Container config
├── railway.json          # Railway config
├── README.md             # This file
├── SETUP.md              # Setup guide
├── API_DOCUMENTATION.md  # API reference
└── DEPLOYMENT.md         # Deploy guide
```

## 🧪 Testing

### Test Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-05T...",
  "environment": "development"
}
```

### Test Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fjl.com",
    "password": "admin123"
  }'
```

### Test Products

```bash
curl http://localhost:3000/api/products
```

## 📚 Documentation

- **SETUP.md** - Complete setup instructions
- **API_DOCUMENTATION.md** - Full API reference with examples
- **DEPLOYMENT.md** - Step-by-step deployment guide
- **IMPLEMENTATION_SUMMARY.md** - Architecture overview

## 🔧 Configuration

### Environment Variables

See `.env.example` for all required variables:

```
SUPABASE_URL          # Supabase project URL
SUPABASE_KEY          # Anon public key
SUPABASE_SERVICE_KEY  # Service role key
RESEND_API_KEY        # Resend email API key
JWT_SECRET            # JWT signing secret (min 32 chars)
NODE_ENV              # development or production
PORT                  # Server port (default 3000)
TAX_RATE              # Tax percentage (default 7.5)
SHIPPING_COST         # Shipping cost (default 0)
```

### Rate Limiting

Default: 100 requests per 15 seconds

Configure in `.env`:
```
RATE_LIMIT_WINDOW_MS=15000      # Time window
RATE_LIMIT_MAX_REQUESTS=100     # Max requests
```

### CORS

Configure allowed origins in `.env`:
```
ALLOWED_ORIGINS=http://localhost:5173,https://fjl.com
```

## 🆘 Troubleshooting

### "Database connection error"
- Verify SUPABASE_URL and SUPABASE_KEY
- Check database schema is created
- Test connection manually in Supabase

### "Email not sending"
- Verify RESEND_API_KEY is valid
- Check email_logs table for errors
- Review Resend dashboard for bounces

### "Authentication failed"
- Verify JWT_SECRET is set (min 32 chars)
- Check admin user exists: `SELECT * FROM admins`
- Verify password is bcrypt hashed

### "CORS errors"
- Check ALLOWED_ORIGINS includes frontend URL
- Ensure http:// or https:// is included
- Restart server after changing CORS

## 📞 Support

- **Issues**: Review error logs in console/Railway
- **Database**: Check Supabase SQL Editor
- **Emails**: View email_logs table for delivery status
- **API**: See API_DOCUMENTATION.md for endpoint details

## 🎯 Roadmap

- [ ] Swagger/OpenAPI documentation
- [ ] GraphQL API option
- [ ] Payment gateway integration
- [ ] Advanced analytics
- [ ] Webhook system
- [ ] Redis caching
- [ ] API key system
- [ ] Admin dashboard backend

## 📄 License

MIT License - See LICENSE file

## 👥 Team

Built by FJL Team
Created: November 5, 2025
Version: 1.0.0

---

## 🚀 Getting Started

1. **Read** SETUP.md for detailed setup
2. **Create** Supabase project and run schema.sql
3. **Configure** .env with your credentials
4. **Install** dependencies: `npm install`
5. **Start** server: `npm run dev`
6. **Test** API: `curl http://localhost:3000/health`
7. **Deploy** to Railway following DEPLOYMENT.md

---

Made with ❤️ by FJL Team
**Status**: Production Ready ✅
