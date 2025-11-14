# Rate Limiting Documentation

## Overview

FJL backend implements rate limiting to prevent abuse and ensure fair resource usage across all clients. Rate limits are enforced at the endpoint level and vary based on user type and operation sensitivity.

## Configuration

Rate limiting is configured via environment variables:

```bash
# Global rate limit (requests per window)
RATE_LIMIT_REQUESTS=100

# Time window in minutes
RATE_LIMIT_WINDOW_MINUTES=15

# Enable/disable rate limiting (default: true)
RATE_LIMITING_ENABLED=true
```

## Rate Limit Tiers

### Public Endpoints (Unauthenticated)
- **Limit:** 30 requests per 15 minutes
- **Examples:** Product listing, category browsing, homepage
- **Purpose:** Prevent automated scraping and basic abuse

### User Endpoints (Authenticated)
- **Limit:** 100 requests per 15 minutes
- **Examples:** User profile, order history, cart operations
- **Purpose:** Allow normal user activity while preventing spam

### Admin Endpoints (Admin Only)
- **Limit:** 200 requests per 15 minutes
- **Examples:** Product management, user management, analytics
- **Purpose:** Allow admin workflows while detecting suspicious bulk operations

### Sensitive Operations
- **Limit:** 5 requests per 15 minutes
- **Examples:** Password change, payment verification, refunds
- **Backoff:** 30 second delay between attempts after limit reached
- **Purpose:** Prevent brute force attacks and accidental data loss

## Implementation Details

### Middleware

Rate limiting is implemented via the `rateLimit` middleware in `src/middleware/rateLimit.js`:

```javascript
import rateLimit from 'express-rate-limit';

// Create rate limiter instances
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: process.env.RATE_LIMIT_REQUESTS,
  message: 'Too many requests, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => !process.env.RATE_LIMITING_ENABLED
});
```

### Storage Backend

By default, rate limiting uses in-memory storage. For production deployments with multiple instances, configure Redis:

```bash
# Redis-based rate limiting
RATE_LIMIT_STORE=redis
REDIS_URL=redis://localhost:6379
```

### Response Headers

Rate limit information is returned in response headers:

```
RateLimit-Limit: 100          # Total requests allowed in window
RateLimit-Remaining: 45       # Requests remaining in current window
RateLimit-Reset: 1234567890   # Unix timestamp when window resets
```

## Examples

### Normal Request (Within Limit)
```bash
curl -i https://api.fjl.local/api/products
HTTP/1.1 200 OK
RateLimit-Limit: 30
RateLimit-Remaining: 29
RateLimit-Reset: 1234567890
```

### Rate Limit Exceeded
```bash
curl -i https://api.fjl.local/api/products
HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 30
RateLimit-Remaining: 0
RateLimit-Reset: 1234567890
Retry-After: 900

{
  "error": "Too many requests, please try again later"
}
```

## Best Practices

### For API Clients

1. **Check Rate Limit Headers:** Always inspect `RateLimit-Remaining` and `RateLimit-Reset` headers
2. **Implement Exponential Backoff:** Wait longer with each retry
3. **Cache Results:** Avoid redundant requests for frequently accessed data
4. **Batch Operations:** Use bulk endpoints when available

Example retry logic:

```javascript
async function makeRequest(url, options = {}) {
  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        const resetTime = response.headers.get('RateLimit-Reset');
        const waitTime = Math.max(1000, (resetTime * 1000) - Date.now());

        console.log(`Rate limited. Retrying in ${waitTime}ms...`);
        await new Promise(r => setTimeout(r, waitTime));
        attempt++;
        continue;
      }

      return response;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  throw new Error(`Max retries exceeded`);
}
```

### For Admin

1. **Monitor Rate Limits:** Check admin logs for repeated 429 errors
2. **Whitelist Trusted Clients:** Configure IP-based bypasses if needed
3. **Adjust Limits:** Modify environment variables during peak traffic
4. **Use Bulk Endpoints:** Always prefer batch operations for multiple items

## Troubleshooting

### "Too Many Requests" Error

**Cause:** Client exceeded rate limit for their tier

**Solution:**
- Wait until `RateLimit-Reset` time before retrying
- Implement exponential backoff in your client
- Cache frequently-accessed data
- Use bulk endpoints instead of individual requests

### Rate Limits Not Working

**Possible causes:**
1. `RATE_LIMITING_ENABLED` environment variable is `false`
2. Rate limiting middleware not applied to endpoint
3. Redis connection failed (if using Redis store)

**Debug:**
```bash
# Check if enabled
echo $RATE_LIMITING_ENABLED  # Should be 'true'

# Check middleware logs
tail -f logs/middleware.log | grep -i "rate"

# Test rate limit
for i in {1..10}; do curl https://api.fjl.local/api/products -s -o /dev/null -w "Status: %{http_code}\n"; done
```

### Unintended Rate Limiting

**Cause:** Shared IP addresses or localhost testing

**Solution:**
- Use unique user tokens for authentication
- Configure different rate limits for different user types
- Whitelist IP addresses for internal testing (in development only)

## Security Considerations

1. **DDoS Mitigation:** Rate limiting provides basic DDoS protection, not complete immunity
2. **Distributed Attacks:** Single-machine rate limiting doesn't prevent distributed attacks; use Redis + WAF
3. **Account Lockout:** Implement account lockout after suspicious failed auth attempts
4. **Monitoring:** Alert on unusual rate limit patterns (indicator of attacks)

## Future Improvements

- [ ] Implement Redis-based rate limiting for horizontal scaling
- [ ] Add per-user rate limiting instead of IP-based
- [ ] Implement sliding window rate limiting (more fair than fixed windows)
- [ ] Add rate limit bypass mechanism for VIP users
- [ ] Real-time rate limit metrics dashboard
