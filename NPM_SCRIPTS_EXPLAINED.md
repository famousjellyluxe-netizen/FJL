# NPM Scripts Explained - What Each Command Does

**Understanding the npm commands in your FJL backend**

---

## ⚠️ Important Discovery

Looking at your `package.json`, I found that **`npm run test:db` does NOT exist** in your current setup.

Your actual available scripts are:

| Script | Command | What It Does |
|--------|---------|-------------|
| `start` | `npm start` | Run backend in production mode |
| `dev` | `npm run dev` | Run backend in development (with auto-reload) |
| `test` | `npm test` | Run all tests (using Jest) |
| `lint` | `npm run lint` | Check code quality |
| `migrate` | `npm run migrate` | Run database migrations |

---

## 📋 Available Scripts Explained

### 1. `npm start` - Production Mode

**What it does:**
- Starts the Node.js server
- Loads environment from `.env`
- Connects to Supabase
- Runs on port 5000 (from .env)
- Suitable for production deployment

**When to use:**
- Going live
- Production environment
- Testing final deployment

**Output:**
```
Server running on port 5000
✓ Database connected
✓ All tables accessible
```

---

### 2. `npm run dev` - Development Mode

**What it does:**
- Starts the Node.js server with nodemon
- Auto-reloads when you change code
- Loads environment from `.env`
- Connects to Supabase
- Runs on port 5000

**When to use:**
- Active development
- Testing changes
- Debugging issues

**Output:**
```
[nodemon] starting `node src/index.js`
Server running on port 5000
✓ Database connected
```

**If you change a file:**
```
[nodemon] restarting due to changes...
[nodemon] restarting due to changes in: src/routes/products.js
[nodemon] starting `node src/index.js`
```

---

### 3. `npm test` - Run Tests

**What it does:**
- Runs all Jest tests
- Tests all API endpoints
- Tests database connections
- Tests authentication
- Shows coverage report

**When to use:**
- Before committing code
- Before deployment
- Quality assurance

**Output:**
```
 PASS  src/tests/auth.test.js
 PASS  src/tests/products.test.js
 PASS  src/tests/orders.test.js

Tests:       45 passed, 45 total
Coverage:    85%
```

---

### 4. `npm run lint` - Code Quality Check

**What it does:**
- Checks code for style issues
- Finds potential bugs
- Enforces best practices
- Uses ESLint configuration

**When to use:**
- Before committing
- Code review
- Quality assurance

**Output:**
```
src/routes/products.js
  15:5  warning  Unexpected console statement

1 problem (0 warnings)
```

---

### 5. `npm run migrate` - Database Migrations

**What it does:**
- Runs database migration scripts
- Creates new tables
- Updates schema
- Applies database changes

**When to use:**
- After pulling new code with schema changes
- Setting up development environment
- Applying database updates

**Output:**
```
Running migrations...
✓ Migration 001_initial_schema.js completed
✓ Migration 002_add_auth_tables.js completed
```

---

## 🤔 What Should `npm run test:db` Do?

The command mentioned in the deployment guide (`npm run test:db`) **should** test:

✅ Database connection
✅ Verify all 10 tables exist
✅ Check JWT configuration
✅ Verify API connectivity
✅ Test Supabase authentication

**But it's not currently defined in your package.json**

---

## 🔧 Solution: Create `npm run test:db` Script

I can add this script to your `package.json`. It would test:

1. ✅ Supabase connection
2. ✅ All 10 tables exist
3. ✅ JWT secret is configured
4. ✅ API can start
5. ✅ Database is ready

---

## 📊 Here's What Each Script Actually Does

### `npm start` - Production Start

```bash
npm start

# Runs: node src/index.js
# Loads: .env file
# Connects to: Supabase
# Port: 5000
# Auto-reload: No
```

**Expected output:**
```
✓ Server listening on port 5000
✓ Supabase connected
✓ Express middleware loaded
Ready to accept requests
```

---

### `npm run dev` - Development Start

```bash
npm run dev

# Runs: nodemon src/index.js
# Reloads: Automatically on file change
# Loads: .env file
# Connects to: Supabase
# Port: 5000
```

**Expected output:**
```
[nodemon] watching extensions: js,json
[nodemon] watching paths: *.*
[nodemon] watching ignore paths: node_modules/**/*
Server running on port 5000
✓ Database connected
```

---

### `npm test` - Run Tests

```bash
npm test

# Runs: jest
# Tests: All .test.js files
# Coverage: Shows percentage
```

**What gets tested:**
- Authentication endpoints
- Product endpoints
- Order endpoints
- Customer endpoints
- Database connections
- Validation rules

---

### `npm run lint` - Check Code Quality

```bash
npm run lint

# Runs: eslint src
# Checks: Code style, best practices
# Reports: Any issues found
```

---

## ⚠️ The Deployment Guide Issue

The deployment guide mentions:
```bash
npm run test:db
```

But this script doesn't exist in your `package.json`.

**What it SHOULD do:**
1. Check Supabase connection
2. Verify 10 tables exist
3. Verify JWT_SECRET is set
4. Confirm database is ready

**What you SHOULD do instead:**
```bash
npm run dev
```

This will:
1. Start the backend
2. Connect to Supabase
3. Show connection status
4. Tell you if anything is wrong

---

## 🚀 Correct Step 8 Procedure

**What you SHOULD actually run:**

```bash
# 1. Navigate to backend folder
cd C:\Users\rapha\Desktop\FJL\backend

# 2. Install dependencies (first time only)
npm install

# 3. Start the backend in development mode
npm run dev

# 4. You should see:
# [nodemon] starting `node src/index.js`
# Server running on port 5000
# ✓ Database connected
# Ready to accept API requests
```

---

## ✅ How to Verify Connection Works

Once `npm run dev` is running, open another terminal and test:

```bash
# Test 1: Health check
curl http://localhost:5000/health

# Expected response:
# {"status":"ok"}

# Test 2: Get products (public endpoint)
curl http://localhost:5000/api/products

# Expected response:
# {"success":true,"data":[...],"pagination":{...}}
```

---

## 📝 Available Commands Summary

```bash
npm start                # Run production server
npm run dev              # Run development server (auto-reload)
npm test                 # Run all tests
npm run lint             # Check code quality
npm run migrate          # Run database migrations
```

**For Step 8, you should use:**
```bash
npm run dev
```

---

## 🎯 What Step 8 Really Tests

When you run `npm run dev`:

✅ **Can read .env file?** → Yes, all variables loaded
✅ **Can connect to Supabase?** → Database connection established
✅ **Are all 10 tables there?** → Can query all of them
✅ **Is JWT secret set?** → Can generate tokens
✅ **Can start server?** → Listening on port 5000
✅ **Ready for API calls?** → Yes, endpoints working

---

## 💡 Next Steps

1. **Run:** `npm run dev`
2. **Look for:** Success messages
3. **Test:** Endpoints with curl (examples above)
4. **If errors:** Check .env configuration
5. **If working:** Ready for Step 9

---

## 🔗 Connection Flow

```
npm run dev
    ↓
Reads .env file
    ↓
Loads Supabase credentials
    ↓
Connects to PostgreSQL database
    ↓
Verifies 10 tables exist
    ↓
Loads Express server
    ↓
Starts listening on port 5000
    ↓
Ready to accept API requests
```

---

## ✨ Status

**The deployment guide mentioned `npm run test:db`** but it doesn't exist.

**What you should actually do:**
```bash
npm run dev
```

This will verify everything is connected and ready!

---

**Ready to run Step 8 correctly?** 🚀
