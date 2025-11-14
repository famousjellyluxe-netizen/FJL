# API Getting Started Guide

Quick start guide for integrating with the FJL API.

## Quick Start (5 Minutes)

### 1. Get Your API Token

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fjl.com",
    "password": "your_password"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "email": "admin@fjl.com",
      "role": "owner"
    }
  }
}
```

Save the token for subsequent requests.

### 2. Make an API Call

```bash
# Set token as variable
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get all products
curl -X GET "http://localhost:5001/api/products" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Create a Resource

```bash
# Create a product
curl -X POST "http://localhost:5001/api/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Product",
    "price": 5000,
    "category_id": "category-uuid",
    "description": "Product description"
  }'
```

## Common Tasks

### Get a Product by ID

```bash
curl -X GET "http://localhost:5001/api/products/product-uuid"
```

### Search Products

```bash
# Search by name
curl -X GET "http://localhost:5001/api/products?search=shirt"

# Filter by category
curl -X GET "http://localhost:5001/api/products?category=category-uuid"

# Sort by price (descending)
curl -X GET "http://localhost:5001/api/products?sort_by=price&sort_order=desc"

# Paginate results
curl -X GET "http://localhost:5001/api/products?page=2&limit=50"
```

### Get My Orders (as Customer)

```bash
curl -X GET "http://localhost:5001/api/orders" \
  -H "Authorization: Bearer $TOKEN"
```

### Place an Order

```bash
curl -X POST "http://localhost:5001/api/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "product_id": "product-uuid",
        "variant_id": "variant-uuid",
        "quantity": 2
      }
    ],
    "shipping_name": "John Doe",
    "shipping_email": "john@example.com",
    "shipping_phone": "08012345678",
    "shipping_address": "123 Main St",
    "city": "Lagos",
    "state": "Lagos",
    "postal_code": "100001",
    "country": "NG"
  }'
```

### Update Order Status (Admin)

```bash
curl -X PUT "http://localhost:5001/api/orders/order-uuid" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "shipped"}'
```

### Get Real-Time Stock Updates

```bash
# SSE stream for products
curl -X GET "http://localhost:5001/api/products/stock/subscribe?productIds=id1,id2" \
  -H "Accept: text/event-stream"

# In JavaScript:
const eventSource = new EventSource('/api/products/stock/subscribe?productIds=id1,id2');
eventSource.addEventListener('stock_update', (e) => {
  const update = JSON.parse(e.data);
  console.log(`Stock: ${update.newQuantity} units`);
});
```

## Frontend Integration

### React Example

```jsx
import { useState, useEffect } from 'react';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get products
    fetch('/api/products')
      .then(res => res.json())
      .then(({ data }) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading products:', error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="product-grid">
      {products.map(product => (
        <div key={product.id} className="product-card">
          <img src={product.image} alt={product.name} />
          <h3>{product.name}</h3>
          <p>₦{product.price.toLocaleString()}</p>
          <button>Add to Cart</button>
        </div>
      ))}
    </div>
  );
}
```

### Vue Example

```vue
<template>
  <div class="products">
    <div v-if="loading">Loading...</div>
    <div v-else class="product-grid">
      <div v-for="product in products" :key="product.id" class="product-card">
        <img :src="product.image" :alt="product.name" />
        <h3>{{ product.name }}</h3>
        <p>₦{{ formatPrice(product.price) }}</p>
        <button @click="addToCart(product)">Add to Cart</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      products: [],
      loading: true
    }
  },
  mounted() {
    this.fetchProducts();
  },
  methods: {
    async fetchProducts() {
      try {
        const res = await fetch('/api/products');
        const { data } = await res.json();
        this.products = data;
      } finally {
        this.loading = false;
      }
    },
    formatPrice(price) {
      return price.toLocaleString();
    },
    addToCart(product) {
      this.$emit('product-added', product);
    }
  }
}
</script>
```

## Authentication

### Session Management

```javascript
class API {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  async login(email, password) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) throw new Error('Login failed');

    const { data } = await response.json();
    this.token = data.token;
    localStorage.setItem('auth_token', data.token);
    return data;
  }

  async logout() {
    localStorage.removeItem('auth_token');
    this.token = null;
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(
      `${this.baseUrl}${endpoint}`,
      { ...options, headers }
    );

    if (response.status === 401) {
      // Token expired
      this.logout();
      window.location.href = '/login';
    }

    return response.json();
  }

  async get(endpoint) {
    return this.request(endpoint);
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Usage:
const api = new API();
await api.login('user@fjl.com', 'password');
const products = await api.get('/products');
await api.post('/orders', orderData);
```

## Error Handling

### Handle API Errors

```javascript
async function placeOrder(orderData) {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    if (!response.ok) {
      // Handle error
      console.error('Order failed:', result.error);
      if (result.details) {
        // Show field-specific errors
        result.details.forEach(detail => {
          console.error(`${detail.field}: ${detail.message}`);
        });
      }
      return null;
    }

    return result.data;
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
}
```

### Retry with Backoff

```javascript
async function retryRequest(fn, maxAttempts = 3, delay = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxAttempts - 1) throw error;
      console.warn(`Attempt ${i + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}

// Usage:
const products = await retryRequest(() => fetch('/api/products'));
```

## Rate Limiting

### Check Rate Limits

```javascript
function checkRateLimit(response) {
  const limit = parseInt(response.headers.get('X-RateLimit-Limit'));
  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining'));
  const reset = parseInt(response.headers.get('X-RateLimit-Reset'));

  console.log(`Rate limit: ${remaining}/${limit}`);
  console.log(`Resets at: ${new Date(reset * 1000)}`);

  if (remaining < 10) {
    console.warn('⚠️ Approaching rate limit!');
  }

  return { limit, remaining, reset };
}

// Usage:
const response = await fetch('/api/products');
checkRateLimit(response);
```

## Testing

### Manual Testing with cURL

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fjl.com",
    "password": "password"
  }' | jq -r '.data.token')

# 2. List products
curl -X GET "http://localhost:5001/api/products" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 3. Create product
curl -X POST "http://localhost:5001/api/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "price": 5000,
    "category_id": "cat-uuid"
  }' | jq '.'
```

### Postman Collection

Import [api-collection.postman.json](./api-collection.postman.json) for pre-built requests.

**Steps:**
1. Open Postman
2. File > Import > Choose `api-collection.postman.json`
3. Set `{{base_url}}` to `http://localhost:5001/api`
4. Set `{{token}}` to your JWT token
5. Start making requests

## Webhooks

### Verify Webhook Signature

```javascript
import crypto from 'crypto';

function verifyWebhookSignature(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64');

  return hash === signature;
}

// Express middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api/webhooks')) {
    const signature = req.headers['x-resend-signature'];
    const payload = req.rawBody; // Raw request body
    const secret = process.env.RESEND_WEBHOOK_SECRET;

    if (!verifyWebhookSignature(payload, signature, secret)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }
  next();
});
```

## Debugging

### Enable Request Logging

```javascript
// Log all requests (fetch)
const originalFetch = window.fetch;
window.fetch = (...args) => {
  console.log('📤 Request:', args[0], args[1]);
  return originalFetch(...args).then(res => {
    console.log('📥 Response:', res.status, res.statusText);
    return res;
  });
};
```

### Browser DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Click request to see headers and response
5. Use Console to make test calls

## Best Practices

1. **Always use HTTPS** in production
2. **Store tokens securely** (httpOnly cookies, not localStorage)
3. **Validate input** before sending to API
4. **Handle errors gracefully** with user-friendly messages
5. **Implement request/response caching** to reduce API calls
6. **Use pagination** for large datasets
7. **Monitor rate limits** and implement backoff
8. **Test thoroughly** before deploying to production

## Need Help?

- **API Reference:** [API_REFERENCE.md](./API_REFERENCE.md)
- **Authentication:** [AUTH_SETUP.md](./AUTH_SETUP.md)
- **Real-Time Updates:** [REAL_TIME_STOCK_UPDATES.md](./REAL_TIME_STOCK_UPDATES.md)
- **Issues:** GitHub Issues or api@fjl.com
