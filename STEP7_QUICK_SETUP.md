# Step 7: Environment Variables - Quick Setup

**Fast reference guide for setting up your .env file**

---

## ⚡ Super Quick Version (5 minutes)

### 1. Generate JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copy the output** (32-character string)

---

### 2. Get Supabase Keys

**In your Supabase Dashboard:**

1. Go to **Settings** (bottom left)
2. Click **API** (left menu)
3. Copy these 3 values:
   - **URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_KEY`

---

### 3. Create .env File

**Location:** `C:\Users\rapha\Desktop\FJL\backend\.env`

**Copy this template:**

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=[paste-your-anon-key]
SUPABASE_SERVICE_KEY=[paste-your-service-key]
JWT_SECRET=[paste-your-generated-secret]
JWT_EXPIRE_ADMIN=7d
JWT_EXPIRE_USER=24h
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@fjlclothing.com
SUPABASE_STORAGE_BUCKET=product-images
SUPABASE_STORAGE_URL=https://[PROJECT].supabase.co/storage/v1/object/public/product-images/
NODE_ENV=production
PORT=5000
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

---

## 📋 Value Mapping

| Template | Your Value | Where From |
|----------|-----------|-----------|
| `[PROJECT]` | Your Supabase project ID | Supabase Settings → API (in URLs) |
| `[PASSWORD]` | Your DB password | Supabase Settings → Database |
| `[paste-your-anon-key]` | Long string starting with `eyJ...` | Supabase Settings → API → anon public |
| `[paste-your-service-key]` | Long string starting with `eyJ...` | Supabase Settings → API → service_role secret |
| `[paste-your-generated-secret]` | From step 1 above | Generated with node command |
| `re_xxxxxxxxxxxxxxxx` | Your Resend API key | https://resend.com/api-keys |

---

## 🔄 Real Example

**Here's what it should look like:**

```env
DATABASE_URL=postgresql://postgres:MyPassword123@abcdefghij.supabase.co:5432/postgres
SUPABASE_URL=https://abcdefghij.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc123...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz789...
JWT_SECRET=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0
JWT_EXPIRE_ADMIN=7d
JWT_EXPIRE_USER=24h
RESEND_API_KEY=re_abcdef1234567890
RESEND_FROM_EMAIL=noreply@fjlclothing.com
SUPABASE_STORAGE_BUCKET=product-images
SUPABASE_STORAGE_URL=https://abcdefghij.supabase.co/storage/v1/object/public/product-images/
NODE_ENV=production
PORT=5000
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

---

## ✅ Checklist

Before moving to Step 8:

- [ ] Generated JWT_SECRET with node command
- [ ] Got all 3 keys from Supabase
- [ ] Created `.env` file in backend folder
- [ ] Filled in all values (no placeholders left)
- [ ] Saved the file

---

## 📍 Where Exactly to Save

1. Open: `C:\Users\rapha\Desktop\FJL\backend`
2. Create new file
3. Name it: `.env` (dot-env, no extension)
4. Paste template above
5. Fill in your values
6. Save

---

## 🚀 Next Step

Once saved, go to: **Step 8: Test Connection from Backend**

```bash
cd backend
npm install
npm run test:db
```

---

**Done?** Move to Step 8! 🎯
