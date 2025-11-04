# FJL Admin Panel - Production Implementation Checklist

## Overview
This document outlines everything you need to provide and configure to move the FJL admin panel from development to production using Supabase, Resend, and Railway.app.

---

## 1. Supabase Setup & Configuration

### 1.1 Supabase Project Creation
- [ ] Create a Supabase account (https://supabase.com)
- [ ] Create a new Supabase project
- [ ] Choose region (recommend closest to your users)
- [ ] Note the following credentials:
  - **Project URL**: `https://[project-id].supabase.co`
  - **Anon Key** (public key for client-side operations)
  - **Service Role Key** (secret key for server-side operations)
  - **Database Password** (for direct database connections if needed)

### 1.2 Database Schema & Tables
You need to create the following tables in Supabase:

#### **users** (Admin Users)
```sql
- id (UUID, primary key)
- email (text, unique)
- password_hash (text) - use bcrypt or argon2
- name (text)
- role (text) - 'admin', 'moderator', etc.
- is_active (boolean)
- last_login (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

#### **products**
```sql
- id (UUID, primary key)
- name (text)
- description (text)
- sku (text, unique)
- category (text)
- price (numeric)
- cost (numeric) - optional, for profit calculation
- stock_quantity (integer)
- low_stock_threshold (integer)
- images (text[] or jsonb) - array of image URLs
- sizes (jsonb) - if applicable, e.g. {"xs": 10, "s": 20}
- colors (jsonb) - if applicable
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
- created_by (UUID, foreign key to users)
```

#### **customers**
```sql
- id (UUID, primary key)
- email (text, unique)
- first_name (text)
- last_name (text)
- phone (text)
- address (jsonb or text)
- city (text)
- state (text)
- country (text)
- postal_code (text)
- is_subscribed_newsletter (boolean)
- total_spent (numeric)
- total_orders (integer)
- last_order_date (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

#### **orders**
```sql
- id (UUID, primary key)
- order_id (text, unique) - readable order number like "FJL-2025-001"
- customer_id (UUID, foreign key to customers)
- items (jsonb) - array of {product_id, quantity, price, size, color}
- subtotal (numeric)
- tax (numeric)
- shipping_cost (numeric)
- total (numeric)
- status (text) - 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
- payment_status (text) - 'pending', 'completed', 'failed', 'refunded'
- payment_method (text) - 'card', 'transfer', etc.
- shipping_address (jsonb)
- notes (text)
- created_at (timestamp)
- updated_at (timestamp)
- shipped_at (timestamp, nullable)
- delivered_at (timestamp, nullable)
```

#### **order_items** (normalized)
```sql
- id (UUID, primary key)
- order_id (UUID, foreign key to orders)
- product_id (UUID, foreign key to products)
- quantity (integer)
- price (numeric) - price at time of purchase
- size (text, nullable)
- color (text, nullable)
- created_at (timestamp)
```

#### **newsletter_subscribers**
```sql
- id (UUID, primary key)
- email (text, unique)
- first_name (text, nullable)
- last_name (text, nullable)
- status (text) - 'active', 'unsubscribed', 'bounced'
- subscribed_at (timestamp)
- unsubscribed_at (timestamp, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

#### **admin_settings**
```sql
- id (UUID, primary key)
- admin_id (UUID, foreign key to users)
- business_name (text)
- store_name (text)
- store_email (text)
- store_phone (text)
- store_address (text)
- tax_rate (numeric) - e.g., 7.5
- shipping_cost (numeric)
- bank_name (text)
- account_number (text, encrypted)
- account_holder (text)
- account_type (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### **audit_logs** (for compliance & security)
```sql
- id (UUID, primary key)
- admin_id (UUID, foreign key to users)
- action (text) - 'create', 'update', 'delete', 'login'
- resource_type (text) - 'product', 'order', 'customer'
- resource_id (UUID, nullable)
- changes (jsonb) - what changed
- ip_address (text)
- user_agent (text)
- created_at (timestamp)
```

### 1.3 Supabase Authentication
- [ ] Enable Supabase Auth (built-in authentication)
- [ ] Configure email provider:
  - Choose Supabase's default email provider OR
  - Configure custom SMTP (if you have your own email service)
- [ ] Set up email templates:
  - Password reset email
  - Confirmation email
  - Magic link (optional)
- [ ] Configure redirect URLs for password reset/confirm:
  - Development: `http://localhost:3000/auth/callback`
  - Production: `https://your-railway-domain.com/auth/callback`
- [ ] Generate and store API keys securely

### 1.4 Row Level Security (RLS) Policies
- [ ] Define RLS policies for each table:
  - Admins can only see/modify their own data and settings
  - Customers can only see their own orders
  - Public can only read active products
  - Audit logs are write-only for the application

---

## 2. Resend Email Setup

### 2.1 Resend Account & Configuration
- [ ] Create a Resend account (https://resend.com)
- [ ] Verify your domain:
  - Add DNS records (SPF, DKIM, DMARC) to your domain
  - Verify domain ownership
- [ ] Get your **Resend API Key** (keep this secret)
- [ ] Create email templates for:

#### **Newsletter Announcement Email**
- [ ] Design template for "New Item Announcement"
  - Include product image
  - Product name, description, price
  - CTA button to shop
  - Unsubscribe link
- [ ] Design template for "New Collection Drop"

#### **Transactional Emails** (if needed later)
- [ ] Order confirmation
- [ ] Order shipped notification
- [ ] Delivery confirmation

### 2.2 Resend Configuration in Code
- [ ] Store `RESEND_API_KEY` as environment variable
- [ ] Create email service functions:
  - `sendNewsletterEmail(subscriber, product)`
  - `sendBulkNewsletter(subscribers, product)`
  - Handle unsubscribe links with Resend's built-in suppression

---

## 3. Railway.app Deployment Setup

### 3.1 Railway Project & Environment
- [ ] Create Railway account (https://railway.app)
- [ ] Create a new Railway project
- [ ] Connect your GitHub repository (FJL project)
- [ ] Configure build settings:
  - Build command: `npm run build` (or your build script)
  - Start command: `npm start` or `npm run dev`
  - Root directory: `.` (if app is in root)

### 3.2 Environment Variables on Railway
Set the following variables in Railway dashboard:

```
# Supabase
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# Resend
RESEND_API_KEY=[your-resend-api-key]

# Application
NODE_ENV=production
PORT=3000

# Security
JWT_SECRET=[generate-a-secure-random-string]
NEXTAUTH_SECRET=[generate-a-secure-random-string]

# Admin Panel
NEXT_PUBLIC_APP_URL=https://your-railway-domain.com
NEXT_PUBLIC_ADMIN_URL=https://your-railway-domain.com/admin

# Database
DATABASE_URL=postgres://[user]:[password]@[host]:[port]/[database]
```

### 3.3 Domain Configuration
- [ ] Choose your Railway domain or connect custom domain:
  - Option 1: Use Railway's free domain: `your-app.railway.app`
  - Option 2: Connect your custom domain (e.g., `admin.fjl.com`)
- [ ] Update email callback URLs in Supabase Auth
- [ ] Set CORS origins if using separate domains

### 3.4 Database Connection on Railway
- [ ] Option A: Use Supabase as external database
  - Get connection string from Supabase
  - Add to `DATABASE_URL` variable
- [ ] Option B: Use Railway's PostgreSQL plugin
  - Add PostgreSQL plugin to Railway project
  - Supabase can replicate from this database

---

## 4. Backend API Implementation Requirements

### 4.1 Authentication Endpoints
- [ ] `POST /api/auth/login` - Admin login with email/password
- [ ] `POST /api/auth/logout` - Clear session
- [ ] `POST /api/auth/register` - Admin registration (if allowing)
- [ ] `POST /api/auth/refresh-token` - Token refresh
- [ ] `POST /api/auth/forgot-password` - Password reset request
- [ ] `GET /api/auth/me` - Get current admin info

### 4.2 Product Endpoints
- [ ] `GET /api/products` - List all products (with pagination)
- [ ] `GET /api/products/:id` - Get single product
- [ ] `POST /api/products` - Create product (admin only)
- [ ] `PUT /api/products/:id` - Update product (admin only)
- [ ] `DELETE /api/products/:id` - Delete product (admin only)
- [ ] `PATCH /api/products/:id/stock` - Update stock quantity

### 4.3 Order Endpoints
- [ ] `GET /api/orders` - List all orders (with filters, pagination)
- [ ] `GET /api/orders/:id` - Get order details
- [ ] `PATCH /api/orders/:id/status` - Update order status
- [ ] `GET /api/orders/search` - Search orders (by ID, customer, date range)
- [ ] `POST /api/orders/:id/export` - Export order as PDF/CSV

### 4.4 Customer Endpoints
- [ ] `GET /api/customers` - List all customers (with pagination)
- [ ] `GET /api/customers/:id` - Get customer details
- [ ] `GET /api/customers/search` - Search customers
- [ ] `PATCH /api/customers/:id` - Update customer info

### 4.5 Analytics Endpoints
- [ ] `GET /api/analytics/revenue` - Total revenue
- [ ] `GET /api/analytics/orders` - Order metrics
- [ ] `GET /api/analytics/customers` - Customer metrics
- [ ] `GET /api/analytics/products/top` - Top selling products
- [ ] `GET /api/analytics/revenue-by-month` - Revenue trend
- [ ] `GET /api/analytics/orders-by-status` - Order status breakdown

### 4.6 Newsletter Endpoints
- [ ] `POST /api/newsletter/subscribe` - Add subscriber
- [ ] `POST /api/newsletter/unsubscribe` - Remove subscriber
- [ ] `GET /api/newsletter/subscribers` - List all subscribers (admin only)
- [ ] `POST /api/newsletter/send` - Send newsletter to subscribers (admin only)
- [ ] `GET /api/newsletter/subscribers/export` - Export subscriber list

### 4.7 Settings Endpoints
- [ ] `GET /api/settings` - Get store settings
- [ ] `PUT /api/settings` - Update store settings (admin only)
- [ ] `PUT /api/settings/password` - Change password
- [ ] `GET /api/settings/bank` - Get bank details (encrypted)
- [ ] `PUT /api/settings/bank` - Update bank details (encrypted)

### 4.8 Audit Endpoints
- [ ] `GET /api/audit-logs` - List audit logs (admin only)
- [ ] `GET /api/audit-logs/export` - Export audit logs

---

## 5. Frontend Integration Requirements

### 5.1 API Client Library
- [ ] Choose HTTP client:
  - Option: `axios`, `fetch`, `react-query`, or `SWR`
- [ ] Create API service layer:
  - Initialize with Supabase URL and keys
  - Add JWT token to all requests
  - Handle token refresh automatically
  - Centralized error handling

### 5.2 State Management (if needed)
- [ ] Consider using:
  - React Context API (simple)
  - Zustand (lightweight)
  - Redux (if complex)
- [ ] Store:
  - Current admin user
  - Authentication state
  - API cache (products, orders, customers)

### 5.3 Environment Variables for Frontend
```
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
REACT_APP_API_URL=https://your-railway-domain.com/api
```

---

## 6. Security & Compliance

### 6.1 SSL/TLS Certificate
- [ ] Railway.app provides free SSL automatically for `.railway.app` domain
- [ ] If using custom domain:
  - Railway handles SSL via Let's Encrypt
  - Ensure HTTPS is enforced

### 6.2 Password Security
- [ ] Implement password hashing on backend:
  - Use bcrypt, argon2, or scrypt (NOT plaintext)
  - Hash database passwords for bank details
- [ ] Password requirements:
  - Minimum 12 characters
  - Mix of uppercase, lowercase, numbers, special characters

### 6.3 Session Management
- [ ] Use JWT tokens or secure sessions
- [ ] Token expiration: 24 hours (admin sessions)
- [ ] Refresh token: 7-30 days
- [ ] Clear tokens on logout

### 6.4 Data Encryption
- [ ] Encrypt sensitive fields:
  - Bank account numbers
  - Customer phone numbers (optional)
- [ ] Use Supabase's pgcrypto extension

### 6.5 Rate Limiting
- [ ] Implement rate limiting on:
  - Login endpoint (prevent brute force)
  - API endpoints (prevent abuse)
  - Newsletter sending (prevent spam)

### 6.6 CORS Configuration
- [ ] Set allowed origins:
  - Production: `https://your-railway-domain.com`
  - Admin: `https://admin.fjl.com` (if separate)
  - Local dev: `http://localhost:3000`

### 6.7 Security Headers
- [ ] Configure on Railway/backend:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security: max-age=31536000`
  - `Content-Security-Policy: ...`

---

## 7. Testing & Verification

### 7.1 Manual Testing Checklist
- [ ] Admin login/logout works
- [ ] Can create, read, update, delete products
- [ ] Can view and update orders
- [ ] Can view and export customers
- [ ] Analytics dashboard loads correctly
- [ ] Settings can be saved
- [ ] Newsletter sending works

### 7.2 Integration Testing
- [ ] Test Supabase connection
- [ ] Test Resend email sending
- [ ] Test order creation flow end-to-end
- [ ] Test product image uploads (if applicable)

### 7.3 Security Testing
- [ ] Test unauthorized access is blocked
- [ ] Test SQL injection prevention
- [ ] Test XSS prevention
- [ ] Test CSRF protection
- [ ] Test rate limiting

### 7.4 Performance Testing
- [ ] Load test with simulated admin users
- [ ] Check database query performance
- [ ] Optimize slow queries with indexes
- [ ] Test with large datasets (1000+ products, 10000+ orders)

---

## 8. Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured on Railway
- [ ] Database migrations run
- [ ] Email templates tested in Resend
- [ ] DNS records verified for custom domain
- [ ] SSL certificate configured
- [ ] Backup strategy in place

### Deployment
- [ ] Deploy main branch to Railway
- [ ] Verify all services are running
- [ ] Check application logs for errors
- [ ] Test all critical flows in production

### Post-Deployment
- [ ] Monitor error logs
- [ ] Verify email sending works
- [ ] Check database performance
- [ ] Set up automated backups
- [ ] Configure monitoring/alerting

---

## 9. Ongoing Maintenance

### 9.1 Monitoring & Alerts
- [ ] Set up error tracking (Sentry, Rollbar, etc.)
- [ ] Monitor API response times
- [ ] Monitor database performance
- [ ] Set up alerts for:
  - Failed authentication attempts
  - API errors > threshold
  - Database connection issues
  - Low disk space/resources

### 9.2 Regular Backups
- [ ] Supabase has automatic backups
- [ ] Configure backup retention: at least 7-14 days
- [ ] Test restore procedures monthly

### 9.3 Database Maintenance
- [ ] Analyze and vacuum tables regularly
- [ ] Monitor table sizes
- [ ] Add indexes for slow queries
- [ ] Archive old audit logs quarterly

### 9.4 Security Updates
- [ ] Keep dependencies updated
- [ ] Monitor for security vulnerabilities
- [ ] Rotate API keys annually
- [ ] Review and update security policies

---

## 10. Additional Integrations (Future)

### 10.1 Payment Processing (when frontend is ready)
- [ ] Choose payment provider: Stripe, Paystack, Flutterwave
- [ ] Set up merchant account
- [ ] Implement webhook handlers for payment confirmation
- [ ] Update order status automatically

### 10.2 SMS Notifications (optional)
- [ ] Choose SMS provider: Twilio, Africa's Talking, etc.
- [ ] Send order status updates via SMS

### 10.3 Analytics Tools (optional)
- [ ] Set up Mixpanel, Plausible, or similar
- [ ] Track key metrics: conversion, revenue, customer lifetime value

---

## Summary of Credentials to Provide

**Create a secure `.env.local` file or Railway environment variables with:**

1. **Supabase**
   - Project URL
   - Anon Key
   - Service Role Key
   - Database URL (if applicable)

2. **Resend**
   - API Key
   - Verified sender domain

3. **JWT/Security**
   - JWT_SECRET (generate: `openssl rand -base64 32`)
   - NEXTAUTH_SECRET (if using NextAuth)

4. **Application Config**
   - NODE_ENV=production
   - BASE_URL (your Railway domain)
   - PORT=3000

---

## Timeline Estimate

- **Week 1-2**: Supabase setup, schema design, API endpoint creation
- **Week 2-3**: Backend authentication, product & order APIs
- **Week 3-4**: Frontend integration with backend
- **Week 4**: Resend integration, newsletter functionality
- **Week 5**: Security hardening, testing, deployment
- **Week 6+**: Monitoring, bug fixes, optimization

---

**Questions?** Review the tech docs:
- Supabase: https://supabase.com/docs
- Resend: https://resend.com/docs
- Railway: https://docs.railway.app
