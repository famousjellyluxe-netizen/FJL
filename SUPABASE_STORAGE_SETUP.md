# Supabase Storage Setup for Product Images

## Step 1: Create Storage Bucket in Supabase

1. **Go to Supabase Dashboard:**
   - Login to https://supabase.com
   - Select your FJL project

2. **Navigate to Storage:**
   - Click "Storage" in left sidebar
   - Click "New Bucket"

3. **Create Bucket:**
   - **Bucket Name:** `product-images`
   - **Public bucket:** YES (toggle ON)
   - Click "Create bucket"

## Step 2: Get Storage Bucket Public URL

After creating the bucket:

1. Click on the bucket name: `product-images`
2. Copy the bucket URL (should be like):
   ```
   https://youkrpmiaebulbbktpvu.supabase.co/storage/v1/object/public/product-images/
   ```

3. Save this URL - you'll need it for configuration

## Step 3: Update Backend Configuration

### Add to `.env` file:

```
# Supabase Storage Configuration
SUPABASE_STORAGE_URL=https://youkrpmiaebulbbktpvu.supabase.co/storage/v1/object/public/product-images
SUPABASE_STORAGE_BUCKET=product-images
```

Replace `youkrpmiaebulbbktpvu` with your actual project ID from the URL.

## Step 4: Update productService.js

The product service will be updated to:

1. **Upload images to Supabase Storage** when creating products
2. **Store image URLs** in the products database
3. **Delete images** when products are deleted
4. **Serve images** with proper URLs

## Step 5: Using the API to Upload Products

### Create Product with Image (Client-Side Example):

```javascript
// After integration scripts are added to HTML
const formData = new FormData();

// Add product details
formData.append('name', 'Classic White T-Shirt');
formData.append('description', 'Premium cotton t-shirt');
formData.append('price', 8000);
formData.append('sku', 'TSH-001');
formData.append('sleeve_type', 'sleeve');
formData.append('category', 'shirts');
formData.append('total_stock', 50);

// Add image file
const imageInput = document.getElementById('productImage');
formData.append('image', imageInput.files[0]);

// Add variants
formData.append('variants', JSON.stringify([
  { size: 'S', color: 'White', stock: 10 },
  { size: 'M', color: 'White', stock: 15 },
  { size: 'L', color: 'White', stock: 15 },
  { size: 'XL', color: 'White', stock: 10 }
]));

// Upload to API
const result = await apiManager.call('/products', {
  method: 'POST',
  body: formData
});

if (result.success) {
  console.log('Product created with image:', result.data);
}
```

## Step 6: Direct Supabase Upload (Alternative)

If you want to upload images directly to Supabase via the UI:

1. **Go to Storage → product-images bucket**
2. **Click "Upload file"**
3. **Select your product image**
4. **Copy the file path** (e.g., `products/white-tshirt.jpg`)
5. **Use full URL in database:**
   ```
   https://youkrpmiaebulbbktpvu.supabase.co/storage/v1/object/public/product-images/products/white-tshirt.jpg
   ```

## Step 7: Image Serving

All product images will be served via:

```
https://youkrpmiaebulbbktpvu.supabase.co/storage/v1/object/public/product-images/{file-path}
```

This URL will be automatically generated when uploading via the API.

## Step 8: Verify Setup

Test storage access in browser console:

```javascript
// Verify storage is accessible
fetch('https://youkrpmiaebulbbktpvu.supabase.co/storage/v1/object/public/product-images')
  .then(r => console.log('Storage accessible:', r.status))
  .catch(e => console.error('Storage error:', e));
```

## Image Upload Best Practices

### Recommended Image Specifications:

- **Format:** JPG, PNG, WebP
- **Size:** Max 5MB per image
- **Dimensions:** 800x800 minimum for product images
- **Aspect Ratio:** 1:1 (square) recommended

### Naming Convention:

```
products/{product-id}/{timestamp}-{original-filename}
```

Example:
```
products/tsh-001/1731959485123-white-tshirt.jpg
```

## Troubleshooting

### "Storage bucket not found"
- Verify bucket name is exactly: `product-images`
- Check bucket visibility is set to "Public"

### "Permission denied" error
- Ensure bucket is marked as PUBLIC
- Check Supabase credentials are correct

### Images not loading
- Verify full image URL is correct
- Check image file exists in Supabase console
- Ensure product_image field contains full URL (not relative path)

## Configuration Summary

```
Project ID: youkrpmiaebulbbktpvu
Bucket Name: product-images
Bucket URL: https://youkrpmiaebulbbktpvu.supabase.co/storage/v1/object/public/product-images/
Bucket Visibility: PUBLIC
```

## Next Steps

After storage is set up:

1. ✅ Storage bucket created
2. 📝 Update productService with image upload
3. 📝 Update product creation routes
4. 📝 Test product upload with image
5. 📝 Add products to database

---

**Database Status:** ✅ Connected
**Storage Status:** ⏳ Waiting for bucket creation
**Email Service Status:** ✅ Configured (Resend)
