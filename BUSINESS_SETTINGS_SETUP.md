# Business Settings Implementation Guide

This document explains how to set up the dynamic business settings system for order emails.

## Overview

Business settings (bank account details, tax rate, currency, etc.) are now managed through an admin panel instead of being hardcoded. These settings are:
- Stored in Supabase database
- Managed by admin users via the admin panel
- Automatically used in order confirmation emails
- Cached for performance (5-minute cache)

## Setup Instructions

### Step 1: Create the Database Table in Supabase

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Create a new query and paste the SQL from `backend/migrations/001_create_business_settings.sql`
4. Click **Run** to execute the migration

The table will be created with default settings:
- **Account Name:** Famous Jolly Luxe
- **Bank Name:** Access Bank
- **Account Number:** 1770816426
- **Account Type:** Business Account
- **Store Email:** hello@fjlclothing.shop
- **Tax Rate:** 7.5%
- **Shipping Cost:** Free (0)
- **Currency:** NGN
- **Currency Symbol:** ₦

### Step 2: Verify Installation

1. The admin panel now has a **Business Settings** form under Settings
2. Log into the admin panel and navigate to **Settings**
3. You should see the **Bank Account Details** section with fields for:
   - Bank Name
   - Account Number
   - Account Holder Name
   - Account Type
   - Currency Code
   - Currency Symbol

### Step 3: Update Settings (Optional)

If you need to change any settings:

1. Go to Admin Panel → **Settings**
2. Scroll to **Bank Account Details** section
3. Update any fields (all fields are managed here)
4. Click **Save Bank Details**
5. You'll see a confirmation message

Changes take effect immediately for new orders.

## How It Works

### When a Customer Places an Order

1. Backend API calls `sendOrderConfirmation()`
2. Settings service fetches settings from database (with 5-minute caching)
3. Email template is populated with dynamic settings:
   - Customer receives order with your bank account details
   - Admin receives order notification at the email address in settings

### Environment Variables (Optional)

If you want to keep some settings in `.env` for security, you can add:

```env
BUSINESS_ACCOUNT_NAME=Famous Jolly Luxe
BUSINESS_BANK_NAME=Access Bank
BUSINESS_ACCOUNT_NUMBER=1770816426
BUSINESS_ACCOUNT_TYPE=Business Account
BUSINESS_STORE_EMAIL=hello@fjlclothing.shop
```

Settings service will fall back to these if database is unavailable.

## API Endpoints

### GET /api/settings
Fetch all business settings (public endpoint, used for emails)

**Response:**
```json
{
  "success": true,
  "data": {
    "account_name": "Famous Jolly Luxe",
    "bank_name": "Access Bank",
    "account_number": "1770816426",
    "account_type": "Business Account",
    "store_email": "hello@fjlclothing.shop",
    "tax_rate": 7.5,
    "shipping_cost": 0,
    "currency": "NGN",
    "currency_symbol": "₦"
  }
}
```

### GET /api/settings/:key
Fetch a specific setting (e.g., `/api/settings/account_name`)

**Response:**
```json
{
  "success": true,
  "key": "account_name",
  "value": "Famous Jolly Luxe"
}
```

### PUT /api/settings
Update business settings (admin only, requires authentication)

**Request:**
```json
{
  "account_name": "Famous Jolly Luxe",
  "bank_name": "Access Bank",
  "account_number": "1770816426",
  "account_type": "Business Account",
  "store_email": "hello@fjlclothing.shop",
  "tax_rate": 7.5,
  "shipping_cost": 0,
  "currency": "NGN",
  "currency_symbol": "₦"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": { /* updated settings */ }
}
```

## Files Modified/Created

### New Files
- `backend/src/services/settingsService.js` - Settings management service
- `backend/src/routes/settings.js` - API routes for settings
- `backend/migrations/001_create_business_settings.sql` - Database migration

### Modified Files
- `backend/src/index.js` - Added settings router
- `backend/src/services/emailService.js` - Now fetches settings dynamically
- `admin/settings.html` - Updated UI to manage business settings

## Troubleshooting

### Settings not loading in admin panel
- Check browser console for errors
- Verify you're logged in as an admin user
- Check network tab to see if API call is succeeding

### Emails still showing old details
- Clear the settings cache by restarting the backend server
- Or wait 5 minutes for cache to expire
- Or clear all browser localStorage and reload

### Can't update settings
- Verify you have admin privileges
- Check that you have `manage_settings` permission
- Look at browser console for error details

## Future Improvements

Potential enhancements to this system:
1. Add email template customization
2. Add multiple business accounts support
3. Add currency conversion rates
4. Add webhook URLs for payment notifications
5. Add email signature customization
