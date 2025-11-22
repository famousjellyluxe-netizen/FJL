# Resend Email Service Setup & Implementation Guide

**Last Updated:** November 9, 2025
**Project:** Famous Jolly Luxe (FJL) Admin Panel
**Email Service:** Resend

---

## 📋 Table of Contents

1. [What is Resend](#what-is-resend)
2. [Full Setup Scope](#full-setup-scope)
3. [Backend Configuration](#backend-configuration)
4. [Best Practices](#best-practices)
5. [Advantages](#advantages)
6. [Disadvantages](#disadvantages)
7. [Limitations](#limitations)
8. [Troubleshooting](#troubleshooting)

---

## What is Resend

**Resend** is a modern email sending platform built specifically for developers. It provides:
- Simple API for sending transactional emails
- Email templates with React support (optional)
- Webhook support for delivery tracking
- Email domain verification for custom sender addresses
- Detailed analytics and monitoring
- Easy integration with Node.js/JavaScript applications

**Official Website:** https://resend.com

---

## Full Setup Scope

### 1. Create Resend Account

**Step-by-Step:**
1. Go to https://resend.com
2. Click "Sign up" button
3. Create account with email address
4. Verify email address
5. Complete account setup with business info
6. Agree to terms and conditions

**What You Get:**
- Free tier: 100 emails/day
- Paid tier: Unlimited emails
- Default sender domain: `onboarding@resend.dev` (for testing)

### 2. Create API Key

**Location:** Dashboard → API Keys → Create API Key

**Steps:**
1. Log in to Resend dashboard
2. Navigate to Settings → API Keys
3. Click "Create API Key" button
4. Name it something descriptive (e.g., "FJL-Backend-Production")
5. Copy the key immediately (you won't see it again)
6. Store securely in your `.env` file

**Key Format:**
```
re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Verify Your Domain (Optional but Recommended)

**Why:**
- Send emails from your own domain instead of `onboarding@resend.dev`
- Better deliverability rates
- More professional appearance
- Required for production use

**Important:** DNS records are added in **Namecheap** (your domain registrar), NOT in Resend. Resend only provides the record values.

**Step 1: Add Domain in Resend Dashboard**
1. Log in to https://resend.com dashboard
2. Go to Settings → Domains
3. Click "Add Domain"
4. Enter your domain (e.g., `mail.fjlclothing.shop`)
5. Resend will display 3 DNS records you need to add

**Step 2: Get DNS Records from Resend**
Resend will provide:
- **SPF Record:** `v=spf1 include:resend.com ~all`
- **DKIM Record:** `default._domainkey` CNAME to `[random-id].dkim.resend.domains`
- **DMARC Record:** `v=DMARC1; p=none;` (or stricter)

**Step 3: Add DNS Records in Namecheap**
1. Log in to Namecheap account
2. Go to Domain List
3. Click "Manage" next to `fjlclothing.shop`
4. Go to "Advanced DNS" tab
5. Add the DNS records:

```
Record Type    Host                            Value
─────────────────────────────────────────────────────────────────
TXT            mail                            v=spf1 include:resend.com ~all
CNAME          default._domainkey.mail         [resend-provided-value].dkim.resend.domains
TXT            _dmarc.mail                     v=DMARC1; p=none;
```

**Step-by-Step in Namecheap:**

For each record:
1. Click "Add Record"
2. Select Type (TXT or CNAME)
3. Enter Host (e.g., `mail`)
4. Enter Value (from Resend)
5. Click checkmark
6. Save all changes

**Step 4: Verify in Resend**
1. Go back to Resend dashboard
2. DNS propagation takes 15 minutes to 48 hours
3. Resend will automatically detect and verify
4. You'll see "✓ Verified" when complete

**Expected DNS Setup in Namecheap:**
```
Type    Host                        Value
TXT     mail                        v=spf1 include:resend.com ~all
CNAME   default._domainkey.mail     [id].dkim.resend.domains
TXT     _dmarc.mail                 v=DMARC1; p=none;
```

**Troubleshooting DNS in Namecheap:**
- Make sure you're in "Advanced DNS" tab (not "Basic DNS")
- Use exact host names including subdomain (e.g., `mail` not `mail.fjlclothing.shop`)
- Wait 24-48 hours for DNS propagation
- Use `nslookup` or `dig` to verify:
  ```bash
  nslookup -type=TXT mail.fjlclothing.shop
  dig TXT mail.fjlclothing.shop
  ```

### 4. Configure Environment Variables

**File:** `.env` (Backend)

```bash
# Resend Email Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STORE_EMAIL=hello@fjlclothing.shop

# Optional: Custom domain email
STORE_EMAIL=noreply@mail.fjlclothing.shop
```

**Important:**
- Never commit `.env` file to git
- Use environment variables in production
- Rotate API keys periodically
- Use different keys for dev/staging/production

### 5. Test Email Sending

**Initial Testing (Using Default Domain):**

```javascript
import { Resend } from 'resend';

const resend = new Resend('re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');

const response = await resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'your-email@example.com',
  subject: 'Test Email',
  html: '<strong>Hello World</strong>'
});

console.log(response);
// Expected: { id: 'xxxxx', from: '...', to: '...', created_at: '...' }
```

**After Domain Verification:**

```javascript
const response = await resend.emails.send({
  from: 'noreply@mail.fjlclothing.shop',
  to: 'customer@example.com',
  subject: 'Order Confirmation',
  html: '<h1>Your order is confirmed</h1>'
});
```

---

## Backend Configuration

### 1. Install Resend Package

```bash
npm install resend
```

**Version Compatibility:**
- Node.js: 14.0+
- Works with Express, Next.js, Fastify, etc.

### 2. Create Resend Configuration File

**File:** `/backend/src/config/resend.js`

```javascript
import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Email types enum
export const EMAIL_TYPES = {
  ORDER_CONFIRMATION: 'order_confirmation',
  PAYMENT_VERIFIED: 'payment_verified',
  SHIPPING_NOTIFICATION: 'shipping_notification',
  DELIVERY_NOTIFICATION: 'delivery_notification',
  MEMBER_WELCOME: 'member_welcome',
  NEWSLETTER: 'newsletter',
  PRODUCT_LAUNCH: 'product_launch',
  PROMOTION: 'promotion',
  PASSWORD_RESET: 'password_reset',
  ACCOUNT_VERIFICATION: 'account_verification'
};

export { resend };
export default resend;
```

### 2. Update Email Service Implementation

**File:** `/backend/src/services/emailService.js`

**Key Patterns:**

```javascript
import { resend, EMAIL_TYPES } from '../config/resend.js';

// Check if Resend is configured
if (!resend) {
  console.warn('⚠️  Email service not configured');
  return { success: false, error: 'Email service not configured' };
}

// Send email
const response = await resend.emails.send({
  from: process.env.STORE_EMAIL,        // Your domain/email
  to: customer.email,                    // Recipient
  subject: 'Email Subject',              // Subject line
  html: htmlContent,                     // HTML content
  text: textContent,                     // Optional: Plain text fallback
  headers: {                             // Optional: Custom headers
    'X-Order-ID': order.id
  },
  tags: [                                // Optional: For tracking/filtering
    { name: 'order_id', value: order.id },
    { name: 'customer_id', value: customer.id }
  ]
});

// Check response
if (response.error) {
  console.error('Email sending failed:', response.error);
  // Handle error
} else {
  console.log('✅ Email sent:', response.id);
  // Log to database
}
```

### 3. Implement Email Logging

**Database Table:** `email_logs`

```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_message_id VARCHAR(255),      -- Resend's unique message ID
  recipient_email VARCHAR(255) NOT NULL,
  recipient_id UUID,
  email_type VARCHAR(100) NOT NULL,
  subject VARCHAR(255),
  template_data JSONB,
  send_status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  resend_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES users(id)
);

CREATE INDEX idx_email_logs_message_id ON email_logs(resend_message_id);
CREATE INDEX idx_email_logs_status ON email_logs(send_status);
CREATE INDEX idx_email_logs_type ON email_logs(email_type);
CREATE INDEX idx_email_logs_created ON email_logs(created_at DESC);
```

### 4. Implement Error Handling

**Best Practice Pattern:**

```javascript
export async function sendOrderConfirmation(order, customer) {
  if (!resend) {
    console.warn('⚠️  Email service not configured');
    // Don't block order creation if email fails
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await resend.emails.send({
      from: process.env.STORE_EMAIL,
      to: customer.email,
      subject: `Order #${order.order_number}`,
      html: htmlContent
    });

    // Log success
    await logEmail({
      resend_message_id: response.id,
      recipient_email: customer.email,
      email_type: EMAIL_TYPES.ORDER_CONFIRMATION,
      send_status: response.id ? 'sent' : 'failed',
      sent_at: new Date(),
      order_id: order.id,
      resend_response: response
    });

    console.log(`✅ Email sent: ${response.id}`);
    return { success: true, messageId: response.id };

  } catch (error) {
    console.error('Error sending email:', error);

    // Log failure
    await logEmail({
      recipient_email: customer.email,
      email_type: EMAIL_TYPES.ORDER_CONFIRMATION,
      send_status: 'failed',
      error_message: error.message,
      order_id: order.id,
      resend_response: error
    });

    // Don't throw - let order creation succeed
    return { success: false, error: error.message };
  }
}
```

### 5. Optional: Implement Webhooks for Tracking

**Resend Webhooks provide:**
- Email delivery status (sent, delivered, bounced, etc.)
- Open tracking
- Click tracking
- Complaint notifications

**Webhook Events:**

```javascript
// POST /api/webhooks/resend
export async function handleResendWebhook(req, res) {
  const event = req.body;

  switch (event.type) {
    case 'email.sent':
      // Email was accepted by Resend
      await updateEmailLog(event.data.email_id, 'sent');
      break;

    case 'email.delivered':
      // Email was delivered to recipient
      await updateEmailLog(event.data.email_id, 'delivered');
      break;

    case 'email.bounced':
      // Email bounced
      await updateEmailLog(event.data.email_id, 'bounced', event.data.error);
      break;

    case 'email.complained':
      // Recipient marked as spam
      await updateEmailLog(event.data.email_id, 'complained');
      await unsubscribeEmail(event.data.email);
      break;

    case 'email.opened':
      // Email was opened (if tracking enabled)
      await logEmailOpen(event.data.email_id);
      break;

    case 'email.clicked':
      // Link in email was clicked
      await logEmailClick(event.data.email_id, event.data.link);
      break;
  }

  res.json({ received: true });
}
```

---

## Best Practices

### 1. Email Content

#### Subject Lines
```javascript
// ✅ Good: Clear, personalized, action-oriented
subject: `🎉 Payment Verified — Order #${order.order_number}`,

// ❌ Bad: Generic, vague
subject: 'Your Order'
```

#### From Address
```javascript
// ✅ Good: Consistent, recognizable
from: 'noreply@mail.fjlclothing.shop',

// ❌ Bad: Changing, unprofessional
from: process.env.ADMIN_EMAIL // keeps changing
```

#### HTML Content
```javascript
// ✅ Good: Plain text + HTML, inline styles
{
  html: htmlContent,
  text: plainTextContent,  // Fallback for text-only clients
  // Inline styles for email clients that don't support <style>
}

// ❌ Bad: Only HTML, external stylesheets
{
  html: htmlContent  // No fallback
}
```

#### Personalization
```javascript
// ✅ Good: Use customer data
`Hi ${customer.first_name},`

// ❌ Bad: Generic greeting
`Hi there,`
```

### 2. Error Handling

```javascript
// ✅ Good: Don't block main flow on email failure
try {
  await sendEmail(...);
} catch (error) {
  console.error('Email failed:', error);
  // Continue - email is non-critical for order creation
}

// ❌ Bad: Throw error and block order creation
if (!email.sent) {
  throw new Error('Email sending failed');
}
```

### 3. Rate Limiting

```javascript
// ✅ Good: Batch emails, use queue system
const emailQueue = [];
const processBatch = async () => {
  for (const email of emailQueue) {
    await resend.emails.send(email);
    await delay(100); // Small delay between emails
  }
};

// ❌ Bad: Send unlimited emails simultaneously
for (const customer of customers) {
  await resend.emails.send({ to: customer.email, ... });
}
```

### 4. API Key Management

```javascript
// ✅ Good: Use environment variables
const apiKey = process.env.RESEND_API_KEY;

// ✅ Good: Different keys for different environments
const apiKey = process.env.NODE_ENV === 'production'
  ? process.env.RESEND_API_KEY_PROD
  : process.env.RESEND_API_KEY_DEV;

// ❌ Bad: Hardcoded API key
const apiKey = 're_xxxxxxxxxxxxx';

// ❌ Bad: Exposed in logs
console.log('API Key:', apiKey);
```

### 5. Email Validation

```javascript
// ✅ Good: Validate before sending
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(customer.email)) {
  throw new Error('Invalid email address');
}

// ✅ Good: Check for common issues
if (customer.email.includes('example.com')) {
  // Skip test email addresses
  return;
}
```

### 6. Logging and Monitoring

```javascript
// ✅ Good: Comprehensive logging
await logEmail({
  resend_message_id: response.id,
  recipient_email: customer.email,
  email_type: EMAIL_TYPES.ORDER_CONFIRMATION,
  send_status: 'sent',
  sent_at: new Date(),
  order_id: order.id,
  resend_response: response  // Store full response
});

// ✅ Good: Monitor email metrics
const sentToday = await emailLogs.count({
  where: { created_at: { gte: today } }
});
```

### 7. Testing

```javascript
// ✅ Good: Test with Resend sandbox
const testResponse = await resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'delivered@resend.dev',  // Always succeeds in dev
  subject: 'Test',
  html: '<p>Test</p>'
});

// ✅ Good: Mock in unit tests
jest.mock('resend', () => ({
  Resend: jest.fn(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'test-123' })
    }
  }))
}));
```

---

## Advantages

### 1. **Simplicity**
- Minimal setup required
- Clean, intuitive API
- Works out of the box
- No infrastructure management

### 2. **Developer-Friendly**
- Built for developers
- Excellent documentation
- React email template support
- JavaScript/Node.js native

### 3. **Reliability**
- High email deliverability rates
- Redundant infrastructure
- SLA guarantees (paid plans)
- 99.9% uptime
- Professional reputation

### 4. **Affordability**
- Free tier: 100 emails/day
- Pay-as-you-go pricing
- No setup fees
- Transparent pricing
- Good value for startups

### 5. **Features**
- Email templates with React support
- Webhooks for delivery tracking
- Email domain verification
- Analytics and monitoring
- Custom headers support
- Email tagging for organization

### 6. **Scalability**
- Handles high volume
- No rate limiting concerns (paid)
- Automatic retry on failure
- Load balancing

### 7. **Security**
- Industry-standard encryption
- PII protection
- GDPR compliant
- SOC 2 Type II certified
- No logging of email content

---

## Disadvantages

### 1. **Cost at Scale**
- Free tier limited to 100/day
- ~$20/month for higher volumes
- ~$99/month for enterprise features
- Costs increase with volume
- Paid plans require credit card

**Impact for FJL:**
- If you send 1000 emails/month: ~$20-30/month
- If you scale to 10,000/month: ~$50-100/month
- Consider this in pricing strategy

### 2. **Limited Customization**
- Less control than self-hosted solutions
- No access to SMTP servers
- Template options limited compared to Mailgun
- Cannot customize delivery behavior

### 3. **Vendor Lock-in**
- Tightly coupled to Resend API
- Switching providers requires code changes
- Email logs stored in their system
- Limited data export options

### 4. **Email Template Support**
- Requires React knowledge for advanced templates
- Learning curve for React email
- Not ideal for complex designs
- Limited CSS support in emails

### 5. **Webhook Reliability**
- Webhooks not guaranteed delivery
- May need retry logic
- No webhook queuing
- Potential race conditions

### 6. **Limited Analytics**
- Basic metrics only (sent, delivered, bounced)
- No advanced segmentation
- Limited A/B testing
- No built-in CRM integration

### 7. **Domain Requirements**
- Custom domain verification takes 24-48 hours
- DNS configuration required
- SPF/DKIM/DMARC setup needed
- Potential issues with ISP blocking

---

## Limitations

### 1. **Volume Limitations**
- Free tier: 100 emails/day
- No batch API (send one at a time)
- Rate limiting on free tier
- Per-recipient limits on sends

**Current Impact:**
- 100 orders/day on free tier is realistic for FJL
- No issue for current scale
- Will need paid plan if you scale significantly

### 2. **Email Content Limitations**
- Max email size: 25MB
- Limited image embedding
- No advanced CSS support
- AMP for email not supported

### 3. **Recipient Limitations**
- No blind CC (BCC)
- No multiple recipients in To field (use loop)
- No reply-to header manipulation
- Limited header customization

### 4. **Feature Limitations**
- No scheduled email sending
- No email queuing/deferral
- No authentication headers (DKIM already applied)
- No partial delivery options

### 5. **Account Limitations**
- Free tier subject to account review
- Suspicious activity may result in suspension
- No guaranteed support on free tier
- Limited API documentation on some features

### 6. **Compliance Limitations**
- GDPR compliant but requires implementation
- CCPA compliant but requires implementation
- No built-in unsubscribe management
- You manage consent/compliance

---

## Current FJL Setup Status

### ✅ What's Already Done
1. Created `/backend/src/config/resend.js` - Configuration file
2. Implemented `sendOrderConfirmation()` - Customer + Admin emails
3. Implemented `sendPaymentVerified()` - Payment confirmation
4. Implemented `sendShippingNotification()` - Shipping tracking
5. Implemented `sendMemberWelcome()` - Newsletter signup
6. Database logging for all emails
7. Error handling and retry logic

### ⚙️ What You Need to Do
1. Sign up for Resend account
2. Create API key
3. Add `RESEND_API_KEY` to `.env` file
4. Set `STORE_EMAIL` in `.env` file
5. Optional: Verify custom domain
6. Test email sending with admin panel
7. Monitor email logs in database

### 🔧 Next Steps
1. Create Resend account: https://resend.com
2. Get API key from dashboard
3. Add to `.env`:
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   STORE_EMAIL=hello@fjlclothing.shop
   ```
4. Restart backend server
5. Test payment verified email via admin panel

---

## Troubleshooting

### Issue: "Email service not configured"

**Cause:** `RESEND_API_KEY` not set in `.env`

**Solution:**
```bash
# In .env file
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Restart backend
npm run dev
```

### Issue: "Invalid from address"

**Cause:** Using unverified domain or wrong email format

**Solution:**
```javascript
// ✅ Use default domain initially
from: 'onboarding@resend.dev',

// OR ✅ Use verified domain
from: 'noreply@mail.fjlclothing.shop',

// ❌ Don't use random email
from: 'hello@example.com',
```

### Issue: "Email bounced"

**Cause:** Recipient email invalid or marked as spam

**Solution:**
1. Check email log in database
2. Validate email format
3. Check bounce reason in Resend dashboard
4. Add to unsubscribe list if complained

### Issue: "Rate limit exceeded"

**Cause:** Sending too many emails on free tier

**Solution:**
```javascript
// Add delay between sends
for (const email of emails) {
  await resend.emails.send(email);
  await new Promise(resolve => setTimeout(resolve, 100));
}

// OR upgrade to paid plan
```

### Issue: "Domain verification failed"

**Cause:** DNS records not propagated or incorrect

**Solution:**
1. Wait 24-48 hours for DNS propagation
2. Verify DNS records in domain registrar
3. Check exact record values from Resend
4. Use `nslookup` or `dig` to verify:
   ```bash
   nslookup mail.fjlclothing.shop
   dig TXT mail.fjlclothing.shop
   ```

---

## Security Checklist

- [ ] API key stored in `.env` file (not committed)
- [ ] API key rotated every 90 days
- [ ] Different keys for dev/staging/production
- [ ] Email validation before sending
- [ ] Error messages don't expose sensitive data
- [ ] Email logs encrypted in database
- [ ] Webhook signature verification implemented
- [ ] Rate limiting implemented
- [ ] GDPR consent tracking implemented
- [ ] Unsubscribe functionality working
- [ ] Email logs retention policy set
- [ ] Monitor for suspicious activity

---

## Recommended Reading

- **Official Docs:** https://resend.com/docs
- **API Reference:** https://resend.com/docs/api-reference
- **Emails Guide:** https://resend.com/docs/emails
- **Best Practices:** https://resend.com/guides
- **React Email:** https://react.email (optional templates)
- **Email Standards:** https://www.rfc-editor.org/rfc/rfc5322

---

## Summary Table

| Aspect | Details |
|--------|---------|
| **Setup Time** | 15-30 minutes |
| **Cost** | Free (100/day) or ~$20/month |
| **API Complexity** | Very Simple |
| **Email Volume** | 1,000-100,000/month |
| **Best For** | Startups, SaaS, E-commerce |
| **Delivery Rate** | 98-99% |
| **Support** | Community (free), Email (paid) |
| **Uptime SLA** | 99.9% |

---

## Action Items for FJL

### Immediate (This Week)
1. [ ] Create Resend account at https://resend.com
2. [ ] Create and copy API key
3. [ ] Add `RESEND_API_KEY` to `.env`
4. [ ] Restart backend server
5. [ ] Test payment verified email in admin panel

### Short Term (Next Week)
1. [ ] Verify custom domain (mail.fjlclothing.shop)
2. [ ] Switch from onboarding@resend.dev to custom domain
3. [ ] Set up webhook for delivery tracking
4. [ ] Monitor email logs in database
5. [ ] Test all email types

### Medium Term (Next Month)
1. [ ] Implement unsubscribe functionality
2. [ ] Set up email analytics dashboard
3. [ ] Create email templates in React
4. [ ] Implement A/B testing for email subject lines
5. [ ] Monitor bounce rates and adjust

---

**This guide will be updated as FJL scales and requirements change.**
