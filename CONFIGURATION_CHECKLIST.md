# FJL Configuration Checklist

**Settings to configure later (after deployment)**

---

## ✅ Step 7 Complete: Environment Variables

Your `.env` file is set up with:
- ✅ Supabase credentials
- ✅ JWT secret
- ✅ Email service
- ✅ Storage configuration

---

## ⏳ To Configure Later (Optional but Recommended)

### 1. Tax Rate

**Current:** 7.5% (0.075)

**Location:** Supabase → store_settings table

**How to update:**
```sql
UPDATE store_settings
SET setting_value = '0.10'
WHERE setting_key = 'tax_rate';
-- Sets tax to 10%
```

**To disable tax:**
```sql
UPDATE store_settings
SET setting_value = '0'
WHERE setting_key = 'tax_rate';
-- No tax charged
```

---

### 2. Shipping Cost

**Current:** $0 (Free shipping)

**Location:** Supabase → store_settings table

**How to update:**
```sql
UPDATE store_settings
SET setting_value = '50.00'
WHERE setting_key = 'shipping_cost';
-- Sets shipping to $50
```

**To disable shipping:**
```sql
UPDATE store_settings
SET setting_value = '0'
WHERE setting_key = 'shipping_cost';
-- Free shipping
```

---

### 3. Bank/Payment Details

**Current:** Not configured

**Location:** Supabase → store_settings table (JSON format)

**To add bank details:**

```sql
INSERT INTO store_settings (setting_key, setting_value, setting_type)
VALUES (
  'bank_details',
  '{
    "bank_name": "Your Bank Name",
    "account_holder": "FJL Clothing",
    "account_number": "1234567890",
    "routing_number": "000000000",
    "account_type": "Checking",
    "swift_code": "XXXXX"
  }',
  'json'
);
```

**To update existing bank details:**
```sql
UPDATE store_settings
SET setting_value = '{
  "bank_name": "New Bank",
  "account_holder": "FJL Clothing",
  "account_number": "0987654321",
  "routing_number": "111111111"
}'
WHERE setting_key = 'bank_details';
```

---

### 4. Resend Email Configuration

**Current:** API key configured in `.env`

**To test email sending:**

Go to: https://resend.com/emails

All order confirmation emails will come from: `noreply@fjlclothing.com`

---

## 📊 All Configurable Settings

View all current settings:

```sql
SELECT setting_key, setting_value, setting_type
FROM store_settings;
```

**Current defaults:**
- `store_name`: "Famous Jelly Luxe"
- `tax_rate`: "0.075" (7.5%)
- `shipping_cost`: "0" (free)
- `currency`: "NGN"
- `currency_symbol`: "₦"
- `featured_products_limit`: "6"
- `low_stock_threshold`: "10"
- `orders_per_page`: "20"
- `products_per_page`: "20"
- `max_image_size_mb`: "5"

---

## 🔄 How Contingency Works

### Scenario 1: You don't want to charge tax or shipping

**Current setup:**
```
tax_rate = 0.075 (7.5%)
shipping_cost = 0 (free)
```

**To disable tax:**
```sql
UPDATE store_settings
SET setting_value = '0'
WHERE setting_key = 'tax_rate';
```

**How it works:**
- Orders calculated: subtotal = item prices only
- No tax added automatically
- Shipping = $0 (free)
- Total = subtotal only

---

### Scenario 2: You want to add tax later

**Just update the setting:**
```sql
UPDATE store_settings
SET setting_value = '0.15'
WHERE setting_key = 'tax_rate';
```

**Next order will have:**
- 15% tax automatically calculated
- Applied to subtotal
- No code changes needed

---

### Scenario 3: You want to charge shipping

**Just update the setting:**
```sql
UPDATE store_settings
SET setting_value = '100.00'
WHERE setting_key = 'shipping_cost';
```

**Next order will have:**
- ₦100 shipping cost
- Added to total
- No code changes needed

---

## 🛠️ How It's Implemented in Code

### Order Creation (Backend)

```javascript
// orders.js - Create order
const { data: settings } = await supabase
  .from('store_settings')
  .select('setting_value')
  .in('setting_key', ['tax_rate', 'shipping_cost']);

// Retrieve values
const taxRate = parseFloat(settings[0].setting_value);
const shippingCost = parseFloat(settings[1].setting_value);

// Calculate
const subtotal = items.reduce((sum, item) => sum + item.total, 0);
const tax = subtotal * taxRate;
const totalAmount = subtotal + tax + shippingCost;

// Automatic - no manual updates needed
```

---

## ✨ Contingency Features

✅ **Tax & Shipping are Optional**
- Set to 0 to disable
- Can be changed anytime
- No impact on order processing

✅ **No Code Changes Required**
- Just update database values
- Backend automatically uses new settings
- Takes effect immediately

✅ **Admin Panel Support**
- You can add settings form in admin panel
- Users won't see disabled features
- Clean separation of concerns

✅ **Easy to Toggle**
- Enable/disable tax by changing one number
- Same for shipping
- Can be toggled multiple times

---

## 📋 Action Items

**Before Going Live:**
- [ ] Decide on tax percentage (or keep 0)
- [ ] Decide on shipping cost (or keep free)
- [ ] Get bank account details (if accepting bank transfers)
- [ ] Verify Resend email configuration
- [ ] Test order creation with current settings

**To Update Tax Rate:**
```sql
UPDATE store_settings
SET setting_value = '[NEW_RATE]'
WHERE setting_key = 'tax_rate';
-- Example: '0.075' for 7.5%, '0' for no tax
```

**To Update Shipping Cost:**
```sql
UPDATE store_settings
SET setting_value = '[NEW_COST]'
WHERE setting_key = 'shipping_cost';
-- Example: '50.00' for ₦50, '0' for free
```

**To Add Bank Details:**
```sql
INSERT INTO store_settings (setting_key, setting_value, setting_type)
VALUES ('bank_details', '[JSON_DETAILS]', 'json');
-- See bank details section above for JSON format
```

---

## 🚀 Next Steps

1. ✅ Continue with Step 8: Backend Connection Test
2. ⏳ After deployment, come back to update these settings
3. ⏳ No rush - everything has sensible defaults

---

**All settings can be updated anytime without redeploying!** 🎉
