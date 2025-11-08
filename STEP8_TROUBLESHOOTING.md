# Step 8: Troubleshooting - Connection Issues

**Fixing the errors from `npm run dev`**

---

## ⚠️ Errors You Got

### Error 1: Port 3000 Already in Use
```
EADDRINUSE: address already in use :::3000
```

### Error 2: Database Connection Failed
```
⚠️ Database connection error: TypeError: fetch failed
```

---

## 🔧 Fix #1: Port 3000 Already in Use

### What This Means
Something else is already running on port 3000 (maybe another app, browser tool, etc.)

### Solution A: Kill the Process Using Port 3000

**On Windows (PowerShell):**

```powershell
# Find what's using port 3000
Get-NetTCPConnection -LocalPort 3000

# Kill the process (replace PID with actual number from above)
Stop-Process -Id [PID] -Force
```

**On Windows (Command Prompt):**

```cmd
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID [PID] /F
```

**Example:**
```cmd
C:\Users\rapha> netstat -ano | findstr :3000
  TCP    [::]:3000              [::]:0                 LISTENING       5432

C:\Users\rapha> taskkill /PID 5432 /F
SUCCESS: The process with PID 5432 has been terminated.
```

---

### Solution B: Change Port in .env

**Edit your .env file:**

```env
# Change from:
PORT=3000

# To:
PORT=5000
```

Then restart:
```bash
npm run dev
```

---

## 🔧 Fix #2: Database Connection Failed

### What This Means
```
Database connection error: TypeError: fetch failed
```

This could be:
1. **Network issue** - Can't reach Supabase servers
2. **Credentials wrong** - SUPABASE_URL or KEY incorrect
3. **Firewall** - Blocking connection to Supabase
4. **Supabase down** - Check status.supabase.com

---

### Solution A: Verify .env Values

**Check your .env file has:**

```env
SUPABASE_URL=https://youkrpmiaebulbbktpvu.supabase.co
SUPABASE_ANON_KEY=[actual-key-here]
SUPABASE_SERVICE_KEY=[actual-key-here]
```

**Verify:**
1. No extra spaces around `=`
2. URLs start with `https://`
3. Keys are long strings (not placeholders)

---

### Solution B: Test Connection Directly

**Create a test file: `C:\Users\rapha\Desktop\FJL\backend\test-connection.js`**

```javascript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', SUPABASE_URL);
console.log('Key exists:', !!SUPABASE_KEY);

try {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('✅ Supabase client created successfully');

  // Try to fetch from a table
  const { data, error } = await supabase
    .from('products')
    .select('id')
    .limit(1);

  if (error) {
    console.error('❌ Query error:', error.message);
  } else {
    console.log('✅ Database connection successful');
    console.log('Sample data:', data);
  }
} catch (error) {
  console.error('❌ Connection failed:', error.message);
}
```

**Run it:**
```bash
node test-connection.js
```

---

### Solution C: Network/Firewall Check

**Test if you can reach Supabase:**

```bash
# Test if server is reachable
ping youkrpmiaebulbbktpvu.supabase.co

# Expected: successful ping

# Or in PowerShell:
Test-NetConnection -ComputerName youkrpmiaebulbbktpvu.supabase.co -Port 443

# Expected: successful connection
```

---

### Solution D: Check Supabase Status

1. Go to: https://status.supabase.com
2. Check if all systems are operational
3. If red/yellow status, wait for Supabase to recover

---

## 📋 Step-by-Step Fix

### Step 1: Fix Port Issue

```bash
# Kill process on port 3000
taskkill /PID [PID] /F

# Or change PORT in .env to 5000
```

### Step 2: Verify .env

Open `C:\Users\rapha\Desktop\FJL\backend\.env`

Check:
- ✅ SUPABASE_URL is correct
- ✅ SUPABASE_ANON_KEY is filled in
- ✅ SUPABASE_SERVICE_KEY is filled in
- ✅ No spaces around = signs
- ✅ No placeholder text remains

### Step 3: Test Connection

```bash
node test-connection.js
```

Should show:
```
✅ Supabase client created successfully
✅ Database connection successful
Sample data: [...]
```

### Step 4: Restart Backend

```bash
npm run dev
```

Should show:
```
✅ Supabase client initialized successfully
📦 Testing database connection...
✅ Database connected - Ready to go!
Server running on port 5000
```

---

## ✅ Success Indicators

When everything works, you should see:

```
✅ Loaded environment variables: 23 variables
✅ Supabase client initialized successfully
📦 Testing database connection...
✅ Database connected - Ready to go!
📧 Email service initialized
Server running on port [PORT]
✅ All systems ready!
```

---

## 🚨 Common Issues & Fixes

### Issue: "EADDRINUSE: address already in use"

**Fix:** Kill the process or change PORT in .env

```bash
# Option 1: Kill process on port 3000
taskkill /PID [PID] /F

# Option 2: Change PORT in .env to 5000
```

---

### Issue: "Database connection error: TypeError: fetch failed"

**Possible causes:**
1. Network unreachable
2. Wrong SUPABASE_URL
3. Wrong SUPABASE_KEY
4. Firewall blocking
5. Supabase server down

**Fix:**
1. Check .env values
2. Test with test-connection.js
3. Check Supabase status
4. Check internet connection

---

### Issue: "SUPABASE_URL not found"

**Fix:** .env file not being read

```bash
# Verify .env exists
ls C:\Users\rapha\Desktop\FJL\backend\.env

# Verify it has content
cat C:\Users\rapha\Desktop\FJL\backend\.env

# Make sure path is correct in .env check
```

---

### Issue: "Cannot reach Supabase servers"

**Check:**
1. Internet connection working?
2. VPN blocking?
3. Firewall blocking?
4. Proxy issues?

**Solution:**
```bash
# Test internet
ping 8.8.8.8

# Test Supabase reachability
Test-NetConnection -ComputerName youkrpmiaebulbbktpvu.supabase.co -Port 443

# If fails, check firewall/proxy
```

---

## 📱 Quick Debug Checklist

- [ ] Port 3000 freed up (or changed to 5000)
- [ ] .env file exists and readable
- [ ] SUPABASE_URL has correct value
- [ ] SUPABASE_ANON_KEY has correct value
- [ ] SUPABASE_SERVICE_KEY has correct value
- [ ] No spaces around = in .env
- [ ] Internet connection working
- [ ] Firewall allows Supabase connection
- [ ] Supabase status is operational

---

## 🎯 Expected Success Output

After fixing, run `npm run dev` and you should see:

```
[nodemon] 3.1.10
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,cjs,json
[nodemon] starting `node src/index.js`

📝 Environment file path: C:\Users\rapha\Desktop\FJL\backend\.env
✅ Loaded environment variables: 23 variables
✅ Supabase client initialized successfully

╔═══════════════════════════════════════════════════════════╗
║     Famous Jelly Luxe (FJL) - Backend API Server         ║
║                    v1.0.0                                ║
╚═══════════════════════════════════════════════════════════╝

Environment: development
Port: 5000

📦 Testing database connection...
✅ Database connected - Ready to go!
📧 Email service initialized
✅ Server listening on port 5000

Ready to accept API requests!
```

---

## 🚀 Once Fixed

Your backend will be:
- ✅ Connected to Supabase
- ✅ Verified all tables exist
- ✅ Ready to accept API requests
- ✅ Running in development mode
- ✅ Auto-reloading on code changes

---

## 📞 Need Help?

1. **Port error?** → Kill the process or change PORT
2. **Database error?** → Check .env values
3. **Still stuck?** → Run test-connection.js for more details

---

**Try the fixes above and let me know what happens!** 🚀
