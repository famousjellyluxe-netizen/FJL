# Payment & Bank Details Configuration

**How to add and manage payment/bank information in FJL**

---

## 📍 Where Bank Details Are Stored

**Database:** Supabase → `store_settings` table

**Key:** `bank_details`

**Format:** JSON (flexible structure)

---

## 💾 How to Add Bank Details

### Option 1: Direct SQL Insert

**Run in Supabase SQL Editor:**

```sql
INSERT INTO store_settings (setting_key, setting_value, setting_type)
VALUES (
  'bank_details',
  '{
    "bank_name": "First Bank Nigeria",
    "account_holder": "FJL Clothing Limited",
    "account_number": "1234567890",
    "account_type": "Current Account",
    "routing_number": "000000000",
    "swift_code": "FIBLNG22",
    "sort_code": "000000"
  }',
  'json'
);
```

---

### Option 2: Via Admin Panel (Recommended)

**Once you have an admin panel:**

1. Add "Settings" page
2. Create form with fields:
   - Bank Name
   - Account Holder
   - Account Number
   - Account Type
   - Routing Number
   - SWIFT Code
3. Save to `store_settings` table

---

## 🔄 How to Update Bank Details

**Run in Supabase SQL Editor:**

```sql
UPDATE store_settings
SET setting_value = '{
  "bank_name": "GTBank",
  "account_holder": "FJL Clothing Limited",
  "account_number": "2468013579",
  "account_type": "Savings",
  "routing_number": "111111111",
  "swift_code": "GTBINGLA"
}'
WHERE setting_key = 'bank_details';
```

---

## 📋 Bank Details Fields

| Field | Required | Example | Notes |
|-------|----------|---------|-------|
| bank_name | Yes | "First Bank Nigeria" | Bank name |
| account_holder | Yes | "FJL Clothing Limited" | Business name |
| account_number | Yes | "1234567890" | 10 digits (Nigeria) |
| account_type | No | "Current Account" | Type of account |
| routing_number | No | "000000000" | Bank routing code |
| swift_code | No | "FIBLNG22" | SWIFT/BIC code |
| sort_code | No | "000000" | Sort code (UK format) |

---

## 🏦 Nigeria Bank Examples

### First Bank Nigeria
```json
{
  "bank_name": "First Bank Nigeria",
  "account_holder": "Your Business Name",
  "account_number": "1234567890",
  "account_type": "Current Account",
  "routing_number": "000000000",
  "swift_code": "FIBLNG22"
}
```

### GTBank
```json
{
  "bank_name": "Guaranty Trust Bank",
  "account_holder": "Your Business Name",
  "account_number": "0123456789",
  "account_type": "Savings",
  "routing_number": "111111111",
  "swift_code": "GTBINGLA"
}
```

### Zenith Bank
```json
{
  "bank_name": "Zenith Bank",
  "account_holder": "Your Business Name",
  "account_number": "9876543210",
  "account_type": "Current Account",
  "routing_number": "222222222",
  "swift_code": "ZEIBNGLA"
}
```

---

## 🔐 Security Considerations

### Current Setup:
- Stored in `store_settings` table
- Visible to database admins
- Not encrypted in database
- Should only be viewed by authorized staff

### For Production:
Consider adding:
1. **Encryption** - Encrypt sensitive fields
2. **Access Control** - Limit who can view
3. **Audit Logging** - Track changes
4. **Backup Security** - Secure backup of sensitive data

---

## 🛠️ How to Use Bank Details in Code

### Display on Payment Instructions Page

```javascript
// Frontend - Display bank details to customer
const { data: settings } = await supabase
  .from('store_settings')
  .select('setting_value')
  .eq('setting_key', 'bank_details')
  .single();

const bankDetails = JSON.parse(settings.setting_value);

// Display to customer:
// Account Holder: bankDetails.account_holder
// Account Number: bankDetails.account_number
// Bank: bankDetails.bank_name
// SWIFT: bankDetails.swift_code
```

---

## 📨 Email Integration

### In Order Confirmation Email

```html
<h3>Bank Transfer Instructions</h3>
<p>Please transfer ₦[TOTAL] to:</p>
<p>
  <strong>Bank:</strong> [bank_name]<br>
  <strong>Account Holder:</strong> [account_holder]<br>
  <strong>Account Number:</strong> [account_number]<br>
  <strong>SWIFT Code:</strong> [swift_code]
</p>
```

---

## ✅ Verification

### Check if Bank Details Are Saved

```sql
SELECT * FROM store_settings
WHERE setting_key = 'bank_details';
```

**Expected output:**
```
setting_key  | setting_value (JSON)
-------------|----------------------
bank_details | {"bank_name": "...", ...}
```

---

## 📋 Typical Payment Flow

```
1. Customer completes order
   ↓
2. Backend retrieves bank_details from store_settings
   ↓
3. Email sent with:
   - Order confirmation
   - Bank transfer instructions
   - Bank account details
   ↓
4. Customer transfers money
   ↓
5. Admin receives payment
   ↓
6. Admin marks order as paid in dashboard
   ↓
7. Order processing begins
```

---

## 🔄 When to Update Bank Details

### If you:
- [ ] Change banks
- [ ] Change account type
- [ ] Correct account information
- [ ] Add new payment method

**Just update in store_settings:**
```sql
UPDATE store_settings
SET setting_value = '[NEW_JSON]'
WHERE setting_key = 'bank_details';
```

**Changes take effect immediately for new orders!**

---

## 🚀 Next Steps

1. ✅ Complete Step 8: Backend connection test
2. ✅ Complete Step 9: Storage bucket setup
3. ✅ Complete Step 10: Test APIs
4. ⏳ Before going live: Add bank details
5. ⏳ Optional: Create admin panel for managing settings

---

## 💡 Pro Tips

1. **Test bank details** - Verify transfer works with provided details
2. **Multiple payment methods** - Can add more settings (e.g., `paypal_details`, `stripe_details`)
3. **Display format** - Consider how bank details show to customers
4. **Backup details** - Keep separate backup of bank account info
5. **Admin access** - Limit who can update bank details

---

## 📞 Support

If you need to display bank details:
- On a "Payment Instructions" page
- In order confirmation email
- In admin dashboard

Just retrieve from `store_settings` with key `bank_details` and parse the JSON!

---

**Ready to configure when you are!** 🏦
