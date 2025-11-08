# Step 7: Configure Environment Variables

**Complete guide for setting up your backend .env file**

---

## 🎯 Current Progress

```
✅ Step 1: Supabase Project
✅ Step 2: Connection Details
✅ Step 3: Deploy Schema
✅ Step 4: Verify Schema
✅ Step 5: RLS Configuration
✅ Step 6: Admin User
🔄 Step 7: Environment Variables ← YOU ARE HERE
⏳ Step 8: Backend Connection Test
⏳ Step 9: Storage Bucket
⏳ Step 10: Test APIs
```

---

## 📋 What You Need to Gather

Before creating the `.env` file, collect these values:

### From Supabase Dashboard:

**1. SUPABASE_URL**
- Go to: Project Settings → API
- Copy: "URL" field
- Example: `https://xxxxxxxxxxxxxx.supabase.co`

**2. SUPABASE_ANON_KEY**
- Go to: Project Settings → API
- Copy: "anon public" key
- Starts with: `eyJhbGc...`

**3. SUPABASE_SERVICE_KEY**
- Go to: Project Settings → API
- Copy: "service_role secret" key
- Starts with: `eyJhbGc...`

### From Your System:

**4. JWT_SECRET**
- Generate: 32+ random characters
- Use: Online generator or command below

**5. DATABASE_URL** (Optional - Supabase URL works too)
- Format: `postgresql://user:password@host:5432/postgres`
- Get from: Supabase Project Settings → Database

---

## 🔑 Step-by-Step Setup

### Step 1: Gather Supabase Credentials

**In Supabase Dashboard:**

1. Go to your FJL project
2. Click **"Settings"** (bottom left)
3. Click **"API"** in left menu
4. You'll see:

```
URL: https://xxxxxxxxxxxxxx.supabase.co
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Copy these THREE values and save them temporarily**

---

### Step 2: Generate JWT_SECRET

Run this command to generate a random 32-character secret:

**Option A: Using Node.js**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option B: Using OpenSSL** (if on Mac/Linux)

```bash
openssl rand -hex 32
```

**Option C: Online Generator**

Go to: https://randomkeygen.com/ and use the "128-bit WEP Key" (copy the hex part)

**Example output:**
```
a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0
```

**Save this value**

---

### Step 3: Create .env File

**Location:** `C:\Users\rapha\Desktop\FJL\backend\.env`

1. Open a text editor (VS Code, Notepad, etc.)
2. Create a new file
3. Paste the content below
4. Replace all `[placeholder]` values with your actual values
5. Save as `.env` in the backend folder

---

## 📄 Complete .env Template

```env
# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

# Supabase PostgreSQL Connection
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres

# Supabase Project Settings (from API section)
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=[your-anon-key-here]
SUPABASE_SERVICE_KEY=[your-service-key-here]

# ============================================================================
# AUTHENTICATION (JWT)
# ============================================================================

# JWT Secret for signing tokens (32+ character random string)
JWT_SECRET=[generate-random-32-char-string]

# Token expiration times
JWT_EXPIRE_ADMIN=7d
JWT_EXPIRE_USER=24h

# ============================================================================
# EMAIL SERVICE (Resend)
# ============================================================================

# Get from: https://resend.com/api-keys
RESEND_API_KEY=[your-resend-api-key]
RESEND_FROM_EMAIL=noreply@fjlclothing.com

# ============================================================================
# FILE STORAGE (Supabase)
# ============================================================================

SUPABASE_STORAGE_BUCKET=product-images
SUPABASE_STORAGE_URL=https://[PROJECT].supabase.co/storage/v1/object/public/product-images/

# ============================================================================
# SERVER CONFIGURATION
# ============================================================================

# Environment
NODE_ENV=production

# Server Port
PORT=5000

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting (requests per window)
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# ============================================================================
# END OF .env FILE
# ============================================================================
```

---

## 🔍 How to Fill In Each Value

### DATABASE_URL
```
Format: postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres

From Supabase:
1. Go to Settings → Database
2. Look for "Connection string"
3. Or construct from:
   - Host: [PROJECT].supabase.co
   - Database: postgres
   - User: postgres
   - Password: [your-database-password]

Example:
postgresql://postgres:AbCd1234xyz@xxxxxxxxxxxxxx.supabase.co:5432/postgres
```

### SUPABASE_URL
```
Example: https://xxxxxxxxxxxxxx.supabase.co

From Supabase:
1. Go to Settings → API
2. Copy the "URL" field
3. Should start with https://
```

### SUPABASE_ANON_KEY
```
Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

From Supabase:
1. Go to Settings → API
2. Copy "anon public" key
3. Long string starting with eyJ...
```

### SUPABASE_SERVICE_KEY
```
Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

From Supabase:
1. Go to Settings → API
2. Copy "service_role secret" key
3. Long string starting with eyJ...
```

### JWT_SECRET
```
Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Example: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0

Requirements:
- At least 32 characters
- Completely random
- Keep it SECRET (don't share)
- Same secret for all tokens
```

### RESEND_API_KEY
```
Get from: https://resend.com/api-keys

Steps:
1. Go to https://resend.com
2. Sign up or login
3. Go to API Keys section
4. Create a new API key
5. Copy the entire key

Example: re_xxxxxxxxxxxxxxxxxxxxxx
```

### SUPABASE_STORAGE_URL
```
Format: https://[PROJECT].supabase.co/storage/v1/object/public/product-images/

Replace [PROJECT] with your Supabase project ID

Example: https://xxxxxxxxxxxxxx.supabase.co/storage/v1/object/public/product-images/
```

---

## ✅ Complete Example .env

Here's a COMPLETE example (with fake values):

```env
# Database
DATABASE_URL=postgresql://postgres:Xy9mKq2pL8vN5jR@jxyzabcdefghijklmnop.supabase.co:5432/postgres
SUPABASE_URL=https://jxyzabcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4eXphYmNkZWZnaGlqa2xtbm9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTQ1MzIxMDIsImV4cCI6MTk5OTEwMjEwMn0.a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4eXphYmNkZWZnaGlqa2xtbm9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5NDUzMjEwMiwiZXhwIjoxOTk5MTAyMTAyfQ.x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4

# Authentication
JWT_SECRET=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0
JWT_EXPIRE_ADMIN=7d
JWT_EXPIRE_USER=24h

# Email
RESEND_API_KEY=re_abcdef1234567890abcdef1234567890
RESEND_FROM_EMAIL=noreply@fjlclothing.com

# Storage
SUPABASE_STORAGE_BUCKET=product-images
SUPABASE_STORAGE_URL=https://jxyzabcdefghijklmnop.supabase.co/storage/v1/object/public/product-images/

# Server
NODE_ENV=production
PORT=5000
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

---

## 🚀 Where to Save the .env File

**Location:** `C:\Users\rapha\Desktop\FJL\backend\.env`

**Steps:**
1. Open your `backend` folder
2. Create a new file named `.env` (just the filename, no extension)
3. Paste the configuration above
4. Replace all placeholders with your actual values
5. Save the file

**In VS Code:**
1. Open the backend folder in VS Code
2. Right-click in the file explorer
3. Select "New File"
4. Type `.env` as the filename
5. Paste the content

---

## ✅ Verification Checklist

Before moving to Step 8, verify your .env file:

- [ ] File is named `.env` (not `.env.txt` or `.txt`)
- [ ] File is in `backend` folder (not root)
- [ ] All `[PLACEHOLDER]` values are replaced
- [ ] No extra quotes around values
- [ ] `DATABASE_URL` includes password
- [ ] `SUPABASE_URL` starts with `https://`
- [ ] `SUPABASE_ANON_KEY` starts with `eyJ...`
- [ ] `SUPABASE_SERVICE_KEY` starts with `eyJ...`
- [ ] `JWT_SECRET` is 32+ characters, random
- [ ] `RESEND_API_KEY` starts with `re_`
- [ ] `SUPABASE_STORAGE_URL` ends with `/`
- [ ] `NODE_ENV=production` is set
- [ ] `PORT=5000` is set
- [ ] `CORS_ORIGIN` matches your frontend URL

---

## 🔐 Security Notes

⚠️ **IMPORTANT:**

1. **Never commit .env to git** - Add to `.gitignore`
2. **Never share .env values** - Keep keys secret
3. **Never post .env online** - Not even in issues/PRs
4. **Rotate keys regularly** - If compromised, regenerate
5. **Different values per environment** - Dev ≠ Prod

**Your .gitignore should have:**
```
.env
.env.local
.env.*.local
```

---

## 📊 Environment Variables Summary

| Variable | Purpose | Example |
|----------|---------|---------|
| DATABASE_URL | DB connection | `postgresql://...` |
| SUPABASE_URL | Supabase project | `https://...supabase.co` |
| SUPABASE_ANON_KEY | Public API key | `eyJ...` |
| SUPABASE_SERVICE_KEY | Admin API key | `eyJ...` |
| JWT_SECRET | Token signing | `a1b2c3...` |
| RESEND_API_KEY | Email service | `re_...` |
| NODE_ENV | Environment | `production` |
| PORT | Server port | `5000` |
| CORS_ORIGIN | Frontend URL | `http://localhost:3000` |

---

## 🚀 Next Steps

Once your `.env` file is created and saved:

1. ✅ Create `.env` file with all values
2. ✅ Save in `backend` folder
3. ✅ Verify all values are correct
4. → **Move to Step 8: Test Connection from Backend**

---

## 🆘 Troubleshooting

### Error: "Cannot find module 'bcryptjs'"
**Solution:** Run `npm install` in backend folder (Step 8)

### Error: "Missing environment variable"
**Solution:**
1. Check .env file exists in backend folder
2. Verify variable name matches exactly
3. Verify no spaces around `=` sign
4. Restart backend server

### Error: "Invalid JWT_SECRET"
**Solution:**
1. Regenerate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Must be 32+ characters
3. Must be random alphanumeric

### Error: "Cannot connect to database"
**Solution:**
1. Verify DATABASE_URL is correct
2. Verify password is included
3. Verify Supabase project is running
4. Check Supabase project settings

---

## ✨ Step 7 Status: Complete

Once you've created and filled the `.env` file, Step 7 is complete!

**Next:** Step 8 - Test Connection from Backend

---

**Ready to create your .env file?** 🎯

Follow the template above and replace all placeholders with your actual values!
