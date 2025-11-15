# FJL Render Deployment Guide

This guide explains how to deploy the FJL (Famous Jelly Luxe) full-stack e-commerce application to Render.

## ⚠️ Important: This is NOT a Static Website

FJL is a **full-stack application** requiring:
- Node.js/Express backend server
- PostgreSQL database
- Environment variable configuration
- Both frontend and backend deployment

---

## Prerequisites

1. **Render Account** - Sign up at [render.com](https://render.com)
2. **GitHub Account** - Repository must be public or connected to Render
3. **Supabase Account** - Database already configured
4. **Resend Account** - Email service configured
5. **Domain Name** (optional) - For custom domain

---

## Deployment Architecture

```
┌─────────────────────────────────────┐
│   Frontend (Static Site)            │
│   - Vite build → dist/              │
│   - Served on fjl-frontend.onrender.com
│   - Points to backend API           │
└────────────────────┬────────────────┘
                     │
          ┌──────────▼──────────┐
          │  Backend (Web Service)
          │  - Node.js/Express  │
          │  - Port 5001        │
          │  - fjl-backend.onrender.com
          └──────────┬──────────┘
                     │
          ┌──────────▼──────────────────┐
          │  Supabase (PostgreSQL)      │
          │  - Database                 │
          │  - File Storage             │
          └─────────────────────────────┘
```

---

## Step 1: Prepare Your Repository

### 1.1 Verify Project Structure
```
FJL/
├── index.html
├── shop.html
├── product.html
├── package.json (frontend)
├── vite.config.js
├── render.yaml ← (already created)
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── index.js
│   │   ├── routes/
│   │   ├── services/
│   │   └── config/
│   └── .env.example
└── frontend/
    └── js/
```

### 1.2 Ensure .gitignore Includes Secrets
```bash
# Don't commit:
.env
.env.local
.env.*.local
backend/.env
node_modules/
dist/
backend/node_modules/
```

### 1.3 Commit and Push to GitHub
```bash
git add .
git commit -m "feat: Prepare for Render deployment"
git push origin main
```

---

## Step 2: Set Up Render Services

### 2.1 Connect GitHub Repository

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Select **Connect a repository**
4. Choose your FJL repository
5. Click **Connect**

### 2.2 Create Backend Service

**Service Settings:**

| Setting | Value |
|---------|-------|
| **Name** | `fjl-backend` |
| **Runtime** | `Node` |
| **Branch** | `main` |
| **Build Command** | `cd backend && npm install` |
| **Start Command** | `cd backend && npm start` |
| **Plan** | `Starter` (or higher) |
| **Region** | `Ohio` (closest to you) |

### 2.3 Create Frontend Service
"
1. Click **New +** → **Static Site**
2. Select your repository
3. **Service Settings:**

| Setting | Value |
|---------|-------|
| **Name** | `fjl-frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |
| **Plan** | `Starter` or `Free` |
| **Region** | `Ohio` |

---

## Step 3: Configure Environment Variables

### 3.1 Backend Environment Variables

In Render Dashboard → Backend Service → Environment:

```env
NODE_ENV=production
PORT=5001

# Database (from Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-public-key
SUPABASE_SERVICE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-super-secret-key-min-32-characters
JWT_EXPIRY=24h
ADMIN_JWT_EXPIRY=7d

# Email Service (from Resend)
RESEND_API_KEY=your-resend-api-key

# Store Configuration
STORE_NAME=Famous Jelly Luxe
STORE_EMAIL=hello@fjlclothing.shop

# CORS Origins (include localhost for local dev testing + production domains)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://fjl-frontend.onrender.com,https://fjl.com,https://www.fjl.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=15000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3.2 Frontend Environment Variables

In Render Dashboard → Frontend Service → Environment:

```env
VITE_API_URL=https://fjl-backend.onrender.com/api
```

⚠️ **Replace `fjl-backend` with your actual backend service URL**

### 3.3 Get Your Supabase Credentials

1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Select your FJL project
3. Go to **Project Settings** → **API**
4. Copy:
   - Project URL → `SUPABASE_URL`
   - Anon Public Key → `SUPABASE_KEY`
   - Service Role Key → `SUPABASE_SERVICE_KEY`

### 3.4 Get Your Resend API Key

1. Log in to [Resend Dashboard](https://resend.com)
2. Go to **API Keys**
3. Copy your API key → `RESEND_API_KEY`

### 3.5 Generate JWT Secret

Run this command to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use the output as `JWT_SECRET`

---

## Step 4: Deploy

### 4.1 Deploy Backend

1. In Render Dashboard → Backend Service
2. Click **Manual Deploy** or **Deploy** button
3. Wait for build to complete
4. Check logs for errors
5. Visit health check: `https://fjl-backend.onrender.com/health`

### 4.2 Deploy Frontend

1. In Render Dashboard → Frontend Service
2. Click **Manual Deploy** or **Deploy** button
3. Wait for build to complete
4. Verify site loads at `https://fjl-frontend.onrender.com`

---

## Step 5: Test Deployment

### 5.1 Test Backend API
```bash
# Health check
curl https://fjl-backend.onrender.com/health

# Test product endpoint
curl https://fjl-backend.onrender.com/api/products
```

### 5.2 Test Frontend
1. Visit `https://fjl-frontend.onrender.com`
2. Check browser console for errors
3. Test loading products from shop page
4. Verify API calls go to backend

### 5.3 Test Critical Features
- [ ] Load home page
- [ ] Load shop page with products
- [ ] Click "Add to Cart"
- [ ] View cart
- [ ] Complete checkout
- [ ] Verify order confirmation
- [ ] Check admin dashboard access

---

## Step 6: Set Up Custom Domain (Optional)

### 6.1 Frontend Domain

1. In Frontend Service → Settings → Custom Domain
2. Enter your domain (e.g., `fjl.com`)
3. Update DNS with provided CNAME record
4. Wait for SSL certificate

### 6.2 Backend Domain

1. In Backend Service → Settings → Custom Domain
2. Enter subdomain (e.g., `api.fjl.com`)
3. Update DNS with CNAME record
4. Wait for SSL certificate

### 6.3 Update ALLOWED_ORIGINS

After custom domains are set up, update `ALLOWED_ORIGINS`:

```env
ALLOWED_ORIGINS=https://fjl.com,https://www.fjl.com,https://api.fjl.com
```

### 6.4 Update Frontend API URL

If using custom backend domain:

```env
VITE_API_URL=https://api.fjl.com/api
```

---

## Step 7: Database Setup

### 7.1 Deploy Database Schema

The database schema is already set up in Supabase. No additional action needed.

If you need to run migrations:
```bash
# In backend directory
npm run migrate
```

### 7.2 Create Admin User

```bash
# SSH into backend (if needed)
# Create initial admin user through Supabase UI or API
```

---

## Troubleshooting

### Build Fails
- Check build command logs in Render
- Ensure `backend/package.json` has all dependencies
- Verify Node version (should be 18+)

### Backend Won't Start
- Check environment variables are set
- Verify database credentials in `SUPABASE_*` vars
- Check logs: `tail -f` in Render dashboard

### Frontend Can't Reach Backend
- Verify `VITE_API_URL` is correct
- Check CORS: `ALLOWED_ORIGINS` must include frontend URL
  - For local testing: Include `http://localhost:5173` and `http://localhost:3000`
  - For production: Include production domains like `https://fjl-frontend.onrender.com`
  - Keep ALL origins that need access separated by commas
- Check browser console for CORS errors (usually says "Access-Control-Allow-Origin")

### 502 Bad Gateway Errors
- Backend service crashed - check logs
- Database connection failed - verify Supabase vars
- Health check failed - verify `/health` endpoint

---

## Environment Variable Reference

### Backend (.env)
```env
NODE_ENV=production
PORT=5001
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_KEY=
JWT_SECRET=
JWT_EXPIRY=24h
ADMIN_JWT_EXPIRY=7d
RESEND_API_KEY=
STORE_NAME=Famous Jelly Luxe
STORE_EMAIL=hello@fjlclothing.shop
# Include localhost for local dev testing during early stages
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://fjl-frontend.onrender.com,https://fjl.com,https://www.fjl.com
RATE_LIMIT_WINDOW_MS=15000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env.production)
```env
VITE_API_URL=https://fjl-backend.onrender.com/api
```

---

## Monitoring & Maintenance

### Set Up Alerts
1. Render Dashboard → Settings → Alerts
2. Enable build/deploy failure notifications
3. Enable runtime error alerts

### Monitor Logs
- Backend logs: In service dashboard
- Frontend logs: Browser console
- Database logs: Supabase dashboard

### Scaling
- If traffic increases, upgrade Render plan
- Monitor database usage in Supabase
- Set up rate limiting appropriately

---

## Post-Deployment

### 1. Verify Everything Works
- [ ] Frontend loads
- [ ] Products display
- [ ] Cart works
- [ ] Checkout completes
- [ ] Orders appear in database
- [ ] Emails send
- [ ] Admin panel accessible

### 2. Monitor Initial Performance
- Check response times
- Monitor error rates
- Track database queries

### 3. Set Up Backups
- Enable automatic backups in Supabase
- Monitor database size

### 4. Security Checklist
- [ ] HTTPS enabled on all services
- [ ] JWT_SECRET is strong (32+ chars)
- [ ] ALLOWED_ORIGINS restricted to your domain
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Environment secrets not in code

---

## Rollback Instructions

If deployment causes issues:

```bash
# In Render Dashboard
1. Go to service
2. Click "Deployments"
3. Find previous working deployment
4. Click "Redeploy"
```

---

## Support & Resources

- **Render Docs**: https://render.com/docs
- **Node.js on Render**: https://render.com/docs/deploy-node-express-app
- **Supabase Docs**: https://supabase.com/docs
- **Resend Docs**: https://resend.com/docs

---

## Quick Deployment Checklist

- [ ] Repository connected to Render
- [ ] Backend service created
- [ ] Frontend service created
- [ ] All environment variables set
- [ ] Database schema deployed
- [ ] Backend service deployed successfully
- [ ] Frontend service deployed successfully
- [ ] Health check passes
- [ ] API endpoints responding
- [ ] Frontend loads and connects to backend
- [ ] Critical features tested
- [ ] Custom domain configured (optional)
- [ ] Monitoring enabled
- [ ] Alerts configured

---

**Last Updated**: 2024
**Status**: Production Ready
