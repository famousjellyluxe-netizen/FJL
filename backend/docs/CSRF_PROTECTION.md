# CSRF Protection Guide

## Overview

CSRF (Cross-Site Request Forgery) protection prevents unauthorized state-changing requests from malicious websites. This guide explains how FJL implements and uses CSRF tokens.

## How It Works

1. **Token Generation:** Server generates unique token per session
2. **Token Distribution:** Token sent to frontend (form hidden field or response header)
3. **Token Validation:** For any POST/PUT/DELETE, server validates token matches session
4. **Token Rotation:** After successful use, token is invalidated

```
User Request Flow:
┌─────────────┐
│  Browser    │
└────────┬────┘
         │
         │ GET /form (generates token)
         ▼
┌─────────────┐
│   Server    │─ Response with _csrf=abc123xyz
└─────────────┘
         ▲
         │
         │ POST /submit with _csrf=abc123xyz
         │
┌─────────────┐
│  Browser    │
└─────────────┘
         │
         │ Attacker site tries POST (no token)
         ▼
         ❌ REJECTED - Missing token
```

## Implementation in FJL

### Backend Setup

The CSRF middleware is configured in the Express app:

```javascript
// src/app.js
import { csrfTokenMiddleware, validateCSRFTokenMiddleware } from './middleware/csrf.js';

// Generate token for all requests
app.use(csrfTokenMiddleware);

// Validate token for state-changing requests (POST/PUT/DELETE)
// Skips validation for:
// - GET/HEAD/OPTIONS requests
// - API requests with JWT Bearer token
app.use(validateCSRFTokenMiddleware);
```

### Middleware Functions

#### csrfTokenMiddleware
- Generates unique token for each request
- Stores token in `req.session.csrfToken`
- Makes token available as `res.locals.csrfToken`

```javascript
app.use(csrfTokenMiddleware);
```

#### validateCSRFTokenMiddleware
- Validates token in POST/PUT/DELETE requests
- Accepts token from:
  - `req.body._csrf` (form field)
  - `req.headers['x-csrf-token']` (HTTP header)
- Skips validation for JWT-authenticated API requests

```javascript
app.use(validateCSRFTokenMiddleware);
```

## Usage in Forms

### HTML Form Example

```html
<!-- Product Form -->
<form method="POST" action="/api/products" enctype="multipart/form-data">
  <!-- Include CSRF token as hidden field -->
  <input type="hidden" name="_csrf" value="<%= csrfToken %>">

  <label>Product Name:</label>
  <input type="text" name="name" required>

  <label>Price:</label>
  <input type="number" name="price" required>

  <button type="submit">Save Product</button>
</form>
```

### JavaScript Fetch Example

```javascript
// Get CSRF token from DOM
const getCsrfToken = () => {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute('content') : null;
};

// Make form submission
async function submitForm(formData) {
  const token = getCsrfToken();

  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'x-csrf-token': token  // Include in header
    },
    body: formData
  });

  return response.json();
}
```

### Store CSRF Token in Meta Tag

```html
<!-- Add to page head -->
<meta name="csrf-token" content="<%= csrfToken %>">
```

## API Usage

### For Form-Based Submissions

Include token in request body:

```bash
curl -X POST http://localhost:3000/api/products \
  -F "name=Test Product" \
  -F "price=100" \
  -F "_csrf=<token>"
```

### For JWT-Authenticated API Requests

No CSRF token needed (validation skipped):

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","price":100}'
```

### For JavaScript Fetch

```javascript
// With form
const formData = new FormData();
formData.append('_csrf', csrfToken);
formData.append('name', 'Product');

fetch('/api/products', {
  method: 'POST',
  body: formData
});

// With JSON
fetch('/api/products', {
  method: 'POST',
  headers: {
    'x-csrf-token': csrfToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: 'Product', price: 100 })
});
```

## Token Rotation

For sensitive multi-step forms, rotate tokens after each step:

```javascript
import { rotateCSRFToken } from './middleware/csrf.js';

// After successful step
router.post('/checkout/step1', (req, res) => {
  // Process step 1
  // ...

  // Rotate token for next step
  const newToken = rotateCSRFToken(req);

  res.json({
    success: true,
    csrfToken: newToken  // Send new token to client
  });
});
```

## Error Handling

### Missing Token Error

**Response:**
```json
{
  "success": false,
  "error": "CSRF token missing",
  "details": [{
    "field": "_csrf",
    "message": "CSRF protection token is required"
  }]
}
```

**Solution:**
- Ensure hidden input `<input name="_csrf">` is included in form
- Or set `x-csrf-token` header in AJAX requests

### Invalid Token Error

**Response:**
```json
{
  "success": false,
  "error": "Invalid CSRF token",
  "details": [{
    "field": "_csrf",
    "message": "CSRF protection validation failed. Please try again."
  }]
}
```

**Causes:**
- Token expired (older than 1 hour)
- Token doesn't match session
- Token already used (rotated)

**Solutions:**
- Refresh page to get new token
- Implement token refresh mechanism
- Use shorter timeout for sensitive operations

## Production Deployment

### Current Implementation
- In-memory token storage (suitable for single-server deployments)
- Tokens expire after 1 hour
- Automatic cleanup of expired tokens

### For Multi-Server Deployment

Upgrade to Redis-based storage:

```javascript
// src/middleware/csrf.js (modified)
import redis from 'redis';

const redisClient = redis.createClient(process.env.REDIS_URL);

export function generateCSRFToken() {
  const token = crypto.randomBytes(32).toString('hex');

  // Store in Redis with 1-hour expiry
  redisClient.setex(
    `csrf:${token}`,
    3600,  // 1 hour
    Date.now()
  );

  return token;
}
```

## Testing CSRF Protection

### Test Valid Request

```bash
# 1. Get token
TOKEN=$(curl -s http://localhost:3000/api/csrf-token | jq -r '.token')

# 2. Use token in request
curl -X POST http://localhost:3000/api/products \
  -H "x-csrf-token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","price":100}'
```

### Test Invalid Request

```bash
# Should fail with 403
curl -X POST http://localhost:3000/api/products \
  -H "x-csrf-token: invalid-token" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","price":100}'
```

### Test Missing Token

```bash
# Should fail with 403
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","price":100}'
```

## Exceptions to CSRF Protection

CSRF validation is **skipped for**:

1. **Safe Methods:** GET, HEAD, OPTIONS
2. **API Authentication:** Requests with `Authorization: Bearer <token>` header
3. **Health Checks:** Status endpoints

**Example:**
```javascript
// This REQUIRES CSRF token (form submission)
POST /api/products

// This DOESN'T require CSRF token (JWT authenticated)
POST /api/products
Authorization: Bearer eyJ...

// This DOESN'T require CSRF token (safe method)
GET /api/products
```

## Troubleshooting

### Tokens Expire Too Quickly
- Increase `TOKEN_EXPIRY_MS` in csrf.js
- Default: 1 hour (3600000 ms)

### Tokens Not Generated
- Ensure `csrfTokenMiddleware` is applied before routes
- Check `req.session` is initialized

### CSRF Errors in AJAX
- Ensure token is included in request headers: `x-csrf-token`
- Don't forget to set `Content-Type` header

### Multi-Page Form Issues
- Use token rotation between steps
- Or refresh token before each submission
