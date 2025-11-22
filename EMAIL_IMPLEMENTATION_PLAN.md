# Email Implementation Plan - FJL Admin Panel

**Last Updated:** November 9, 2025
**Status:** Planning Phase

---

## 📋 Overview

This document outlines the implementation plan for the remaining 3 email templates in the FJL e-commerce system:
1. ✅ **Order Confirmation** (ALREADY IMPLEMENTED - with bug fix applied)
2. 📋 **Payment Verified Email** (TO IMPLEMENT)
3. 📦 **Shipping Notification Email** (TO IMPLEMENT)
4. 👋 **Member Welcome Email** (TO IMPLEMENT)

---

## ✅ Bug Fixes Completed

### Fixed: Missing `last_name` in Email Customer Objects
- **Files Modified:** `/backend/src/routes/orders.js`
- **Changes:**
  - Line 23: Added `last_name: order.users.last_name` to order confirmation
  - Line 113: Added `last_name: order.shipping_last_name` to shipping notification
  - Line 152: Added `last_name: order.shipping_last_name` to payment verified email
- **Impact:** Email templates will now display full customer names instead of "John undefined"

---

## 🎯 Implementation Tasks

### Phase 1: Payment Verified Email

**File:** `/backend/src/services/emailService.js`
**Endpoint Triggered:** `PUT /api/orders/:id/payment-status` (with `payment_status: "verified"`)
**Recipients:** Customer only

#### 1.1 Email Content Requirements
```
✅ Order number (order.order_number)
✅ List of items purchased (order.items array)
✅ Total amount paid (order.total_amount + currency symbol)
✅ Expected delivery timeframe (5-7 business days - adjustable in settings)
✅ Next steps message (order processing status)
```

#### 1.2 Email Template Structure

**Subject Line:**
```
🎉 Payment Verified — Order #{order.order_number}
```

**Email Body Components:**
1. **Header:** Greeting with customer first name
2. **Confirmation Message:** "Thank you! We've received and verified your payment."
3. **Order Details Section:**
   - Order number
   - Order date
   - List of items with:
     - Product name
     - Size & Color (if applicable)
     - Quantity
     - Unit price
     - Subtotal
4. **Payment Summary:**
   - Subtotal
   - Tax amount (7.5% or from settings)
   - Shipping cost
   - Total amount (highlighted)
5. **Timeline Section:**
   - "Your order is now being processed"
   - "Expected delivery: [date]" (calculate as order.created_at + 5-7 days)
6. **Next Steps:**
   - "We'll notify you when your order ships with tracking information"
7. **Footer:**
   - Store contact email
   - FAQ link (if available)
   - Store policies link (if available)

#### 1.3 Implementation Details

**Function Signature:**
```javascript
async function sendPaymentVerified(order, customer, settings) {
  // order: complete order object
  // customer: { id, email, first_name, last_name }
  // settings: business settings (currency, delivery timeframe, etc.)
}
```

**Database Fields to Use:**
- `order.order_number` - Unique order ID
- `order.items` - Array of purchased items
- `order.subtotal` - Pre-tax total
- `order.tax` - Tax amount
- `order.shipping_cost` - Shipping fee
- `order.total_amount` - Final amount
- `order.created_at` - Order creation date
- `customer.first_name`, `customer.last_name` - Customer name
- `customer.email` - Email destination
- `settings.currency_symbol` - Currency (₦)
- `settings.store_email` - Sender email

**New Settings Field (If Not Exists):**
- `delivery_days` - Expected delivery timeframe (default: 5-7 days)

**Steps:**
1. Create `sendPaymentVerified()` function in emailService.js
2. Fetch business settings with `settingsService.getSettings()`
3. Format email content with HTML template
4. Send email via Resend API
5. Log email to `email_logs` table with `email_type: 'payment_verified'`
6. Handle and log any errors without failing the API call

---

### Phase 2: Shipping Notification Email

**File:** `/backend/src/services/emailService.js`
**Endpoint Triggered:** `PUT /api/orders/:id/status` (with `status: "shipped"`)
**Recipients:** Customer only

#### 2.1 Email Content Requirements
```
✅ Order number
✅ Estimated delivery date
✅ Carrier name (optional for now - default to "Standard Delivery")
✅ Tracking link (NOT IMPLEMENTED - use placeholder)
✅ Delivery instructions
```

#### 2.2 Email Template Structure

**Subject Line:**
```
📦 Your Order is on the Way! — Order #{order.order_number}
```

**Email Body Components:**
1. **Header:** Greeting with customer first name
2. **Notification Message:** "Great news! Your order has been shipped."
3. **Shipment Details Section:**
   - Order number
   - Shipped date (current date)
4. **Tracking Section:**
   - Carrier/Delivery Method: "Standard Delivery Service"
   - Tracking Number: (if `order.tracking_number` exists, display it)
   - Tracking Link: "Track your package: [link]" (placeholder for future implementation)
   - Note: "Tracking system coming soon!"
5. **Delivery Timeline:**
   - Estimated delivery date (shipped date + 5-7 business days)
   - "You'll receive your package between [start date] - [end date]"
6. **Delivery Instructions:**
   - "Ensure someone is available to receive the package"
   - "If you're not available, you can contact the delivery service to reschedule"
   - Provide delivery service contact info (generic for now)
7. **Items Summary:**
   - Quick list of what's being shipped
8. **Footer:**
   - Customer service contact
   - FAQ link
   - Return policy link

#### 2.3 Implementation Details

**Function Signature:**
```javascript
async function sendShippingNotification(order, customer, settings) {
  // order: complete order object (with optional tracking_number field)
  // customer: { id, email, first_name, last_name }
  // settings: business settings
}
```

**Database Fields to Use:**
- `order.order_number` - Order ID
- `order.updated_at` - Ship date (use as reference)
- `order.items` - Items being shipped
- `order.shipping_address` - Delivery address
- `order.shipping_city`, `shipping_state`, `shipping_postal_code` - Full address
- `order.tracking_number` - (if available) Tracking number
- `customer.first_name`, `customer.last_name`
- `customer.email`
- `settings.delivery_days` - Expected delivery window

**New Fields (If Not Exists):**
- `order.tracking_number` - Tracking number (nullable)
- `order.carrier` - Shipping carrier name (default: "Standard Delivery")

**API Enhancement Needed:**
- `PUT /api/orders/:id/status` should allow optional fields:
  ```javascript
  {
    status: "shipped",
    tracking_number: "optional_tracking_id",
    carrier: "optional_carrier_name"
  }
  ```

**Steps:**
1. Create `sendShippingNotification()` function in emailService.js
2. Format email with HTML template
3. Calculate estimated delivery date (order.updated_at + 5-7 business days)
4. Include tracking number if available, with note that tracking system is coming soon
5. Send via Resend API
6. Log to `email_logs` table with `email_type: 'shipping_notification'`
7. Handle errors gracefully

---

### Phase 3: Member Welcome Email

**File:** `/backend/src/services/emailService.js`
**Endpoint Triggered:** `POST /api/customers/members/subscribe`
**Recipients:** Newsletter subscriber email

#### 3.1 Email Content Requirements
```
✅ Warm welcome message with store name
✅ Discount code for first purchase (optional)
✅ Links to shop
✅ Social media links
✅ Newsletter frequency info
✅ Unsubscribe link (footer)
```

#### 3.2 Email Template Structure

**Subject Line:**
```
👋 Welcome to Famous Jolly Luxe! — Exclusive First Purchase Offer Inside
```

**Email Body Components:**
1. **Header:**
   - "Welcome to Famous Jolly Luxe!"
   - Tagline or brand message
2. **Greeting:**
   - "Hi [First Name]," (personalized if subscriber has name)
   - Or generic "Welcome!" if no name available
3. **Welcome Message:**
   - "We're thrilled to have you join our community!"
   - Brief description of what they'll get from newsletters
4. **Exclusive Offer (Optional):**
   - "As a token of our appreciation, here's a special welcome offer:"
   - Display discount code (if available from settings)
   - Code: [WELCOME10] or similar
   - "Use this code for 10% off your first purchase"
   - Expiration date (if applicable)
5. **What They'll Get:**
   - "🚀 New Product Launches - Be the first to know about our latest collections"
   - "💎 Exclusive Promotions - Members-only deals and early access to sales"
   - "✨ Style Tips & Inspiration - Fashion advice from our team"
   - "📦 Restock Alerts - Get notified when your favorites are back"
6. **Call to Action:**
   - "Shop Now" button/link to homepage
   - "Browse Categories" button/link to shop
7. **Social Media Section:**
   - "Follow us for daily inspiration:"
   - Instagram link
   - Facebook link
   - Twitter/X link (if applicable)
   - TikTok link (if applicable)
8. **Newsletter Frequency:**
   - "We respect your inbox - we'll only email you when new products drop or there's something special to share"
   - "Expect to hear from us once or twice a month"
9. **Footer:**
   - Store name
   - Store address (if available in settings)
   - Store contact email
   - Unsubscribe link (important for compliance)
   - Privacy policy link

#### 3.3 Implementation Details

**Function Signature:**
```javascript
async function sendMemberWelcome(subscriber, settings) {
  // subscriber: { email, first_name } (from POST request)
  // settings: business settings with discount code and social links
}
```

**Database Tables Involved:**
- Insert into `members` or `newsletter_subscribers` table (if not exists)
- Columns needed:
  - `id` (UUID, primary key)
  - `email` (VARCHAR, unique, indexed)
  - `first_name` (VARCHAR, optional)
  - `is_active` (BOOLEAN, default: true)
  - `subscribed_at` (TIMESTAMP)
  - `unsubscribed_at` (TIMESTAMP, nullable)
  - `unsubscribe_token` (VARCHAR, for unsubscribe links)

**New Settings Fields:**
- `welcome_discount_code` - Discount code for new subscribers (e.g., "WELCOME10")
- `welcome_discount_percentage` - Discount amount (e.g., 10)
- `instagram_url` - Instagram profile link
- `facebook_url` - Facebook profile link
- `twitter_url` - Twitter profile link
- `tiktok_url` - TikTok profile link
- `store_address` - Physical store address (optional)
- `newsletter_frequency` - How often emails are sent (default: "Once or twice a month")

**Existing Endpoint:**
- `POST /api/customers/members/subscribe` already exists at `/backend/src/routes/customers.js:217`

**Steps:**
1. Create `sendMemberWelcome()` function in emailService.js
2. Format welcome email template with HTML
3. Include discount code from settings if available
4. Generate unsubscribe token for this subscriber
5. Send email via Resend API
6. Log to `email_logs` table with `email_type: 'member_welcome'`
7. Ensure unsubscribe link is functional

---

### Phase 4: Newsletter Unsubscribe Functionality

**Files Involved:**
- `/backend/src/routes/customers.js` (new endpoint)
- `/backend/src/services/customerService.js` (new function)
- Email templates (all marketing emails)

#### 4.1 Unsubscribe Requirements
```
✅ Unsubscribe endpoint
✅ Token-based unsubscribe (secure, one-click)
✅ Database update to mark subscriber as unactive
✅ Confirmation message
✅ Unsubscribe link in every marketing email footer
```

#### 4.2 Implementation Details

**New Database Table (if not exists):**
```sql
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  unsubscribe_token VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_email (email),
  INDEX idx_unsubscribe_token (unsubscribe_token),
  INDEX idx_is_active (is_active)
);
```

**API Endpoint to Create:**
```
GET /api/customers/members/unsubscribe/:token
- No authentication required
- Validates token
- Sets is_active = false and unsubscribed_at = NOW()
- Returns confirmation page or message
```

**Implementation Steps:**
1. **Subscribe Endpoint Enhancement** (`POST /api/customers/members/subscribe`):
   - Generate unique `unsubscribe_token` for each subscriber
   - Store in database
   - Pass to email template

2. **New Unsubscribe Endpoint** (`GET /api/customers/members/unsubscribe/:token`):
   - Find subscriber by unsubscribe_token
   - Update `is_active = false` and `unsubscribed_at = NOW()`
   - Return HTML page with confirmation message
   - Log this action for audit

3. **Email Template Footer Update:**
   - Add to all marketing emails (Member Welcome, Newsletter, Product Launch, Promotion):
   ```html
   ---
   Want to unsubscribe? Click here: {unsubscribe_link}
   ```

4. **Email Filtering:**
   - When sending newsletters or marketing emails, only send to subscribers with `is_active = true`

---

## 📅 Implementation Timeline

### Week 1
- [ ] Day 1-2: Implement Payment Verified Email
- [ ] Day 3-4: Implement Shipping Notification Email
- [ ] Day 5: Testing and bug fixes

### Week 2
- [ ] Day 1-2: Implement Member Welcome Email
- [ ] Day 3-4: Implement Newsletter Unsubscribe Functionality
- [ ] Day 5: Full system testing and validation

---

## 🧪 Testing Checklist

### Payment Verified Email
- [ ] Email sent when payment_status is updated to "verified"
- [ ] Email contains correct order details
- [ ] Recipient receives email at correct address
- [ ] Email logged to email_logs table
- [ ] Formatting looks correct
- [ ] Links (if any) are clickable

### Shipping Notification Email
- [ ] Email sent when order status is changed to "shipped"
- [ ] Tracking number displayed if provided
- [ ] Estimated delivery date calculated correctly
- [ ] Customer name displayed correctly (with last_name)
- [ ] Email logged to email_logs table
- [ ] Formatting is correct

### Member Welcome Email
- [ ] Email sent when customer subscribes to newsletter
- [ ] Discount code displayed correctly (if available)
- [ ] Social media links are correct
- [ ] Unsubscribe link is present in footer
- [ ] Unsubscribe link works correctly
- [ ] Email logged to database

### Unsubscribe Functionality
- [ ] Unsubscribe link works one-click
- [ ] Subscriber marked as inactive in database
- [ ] Confirmation message displays
- [ ] Inactive subscribers don't receive marketing emails

---

## 🗄️ Database Changes Required

### New Tables to Create
```sql
-- Newsletter subscribers table
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  unsubscribe_token VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_token ON newsletter_subscribers(unsubscribe_token);
CREATE INDEX idx_newsletter_active ON newsletter_subscribers(is_active);
```

### New Settings Fields to Add to `store_settings`
```sql
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS delivery_days INT DEFAULT 5;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS welcome_discount_code VARCHAR(50);
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS welcome_discount_percentage INT DEFAULT 0;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255);
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255);
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255);
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS tiktok_url VARCHAR(255);
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS store_address VARCHAR(255);
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS newsletter_frequency VARCHAR(100);
```

### Optional Fields to Add to `orders` Table
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier VARCHAR(100) DEFAULT 'Standard Delivery';
```

---

## 📝 Code Structure

### Files to Modify
1. **`/backend/src/services/emailService.js`**
   - Add `sendPaymentVerified()` function (Phase 1)
   - Add `sendShippingNotification()` function (Phase 2)
   - Add `sendMemberWelcome()` function (Phase 3)
   - Update `logEmail()` if needed for new email types

2. **`/backend/src/routes/orders.js`**
   - Already has triggers for payment_verified and shipping (just needs email functions)

3. **`/backend/src/routes/customers.js`**
   - Enhance subscribe endpoint with token generation
   - Add new unsubscribe endpoint (Phase 4)

4. **`/backend/src/services/customerService.js`**
   - Add unsubscribe logic

5. **`/backend/src/services/settingsService.js`**
   - Ensure all new settings fields are retrieved and cached

6. **`/backend/migrations/`**
   - Create new migration file for database changes

---

## 🔐 Security Considerations

### Email Security
- All emails should use HTTPS links
- Unsubscribe tokens should be unique and non-guessable (use UUID)
- Validate all email addresses before sending
- Don't expose user IDs in email URLs (use tokens instead)

### Rate Limiting
- Implement rate limiting on subscribe/unsubscribe endpoints
- Prevent spam subscriptions
- Add CAPTCHA if needed

### Compliance
- Include unsubscribe link in all marketing emails (CAN-SPAM, GDPR, etc.)
- Log all email sends for audit purposes
- Implement proper consent tracking if needed

---

## 📊 Monitoring & Logging

### Email Logs to Track
- Email type sent
- Recipient email address
- Timestamp
- Status (sent, failed, bounced)
- Error message if failed
- Associated order/subscriber ID

### Metrics to Monitor
- Email delivery rate
- Bounce rate
- Unsubscribe rate
- Email open rate (if Resend provides webhooks)
- Click-through rate (if links are tracked)

---

## 🚀 Deployment Checklist

Before deploying to production:
- [ ] All 4 email templates implemented
- [ ] All tests passing
- [ ] Database migrations run successfully
- [ ] Settings updated with new fields
- [ ] RESEND_API_KEY configured in environment
- [ ] Email templates reviewed by non-technical team
- [ ] Test emails sent and verified
- [ ] Error handling tested
- [ ] Unsubscribe functionality tested
- [ ] Performance tested (no slow queries)
- [ ] Security reviewed (no email injection vulnerabilities)
- [ ] Documentation updated

---

## 📌 Notes & Assumptions

1. **Payment Method:** Currently only bank transfer, so no payment method variations needed
2. **Delivery Days:** Assuming 5-7 business days for delivery (configurable via settings)
3. **Tracking:** Not implementing full tracking system, just placeholder for future use
4. **Newsletter:** Using separate `newsletter_subscribers` table instead of reusing orders users
5. **Discount Code:** Optional - only displayed if configured in settings
6. **Social Links:** Optional - will display only if configured
7. **Email Format:** Maintaining consistency with existing order confirmation email styling
8. **Unsubscribe Token:** Using UUID for security, no expiration

---

## ❓ Questions for Clarification (If Needed Later)

1. Do you want welcome discount code to be configurable per subscriber or system-wide?
2. Should newsletter frequency be configurable by subscribers, or fixed?
3. Do you need email templates in different languages?
4. Should we track email open rates or click-through rates?
5. Do you want to implement SMS notifications in addition to email?
6. Should we support multiple store email addresses for different purposes?

---

**Next Step:** Review this plan and confirm you're ready to proceed with implementation!
