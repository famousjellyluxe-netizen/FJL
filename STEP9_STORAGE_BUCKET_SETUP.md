# Step 9: Configure Storage Bucket - Quick Setup Guide

**Step 9 of 10: Set up Supabase Storage for product images**

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Go to Supabase Storage

1. Open: https://app.supabase.com
2. Select your **FJL project**
3. Click **Storage** (left sidebar)
4. Click **Create new bucket** (top right)

---

### Step 2: Create Bucket

**Fill in these details:**

| Field | Value |
|-------|-------|
| **Name** | `product-images` |
| **Public bucket** | ✅ Check this box |
| **Encryption** | Leave as default (unchecked) |

Click **Create bucket**

---

### Step 3: Verify Bucket Created

You should see a bucket named `product-images` in the list.

---

### Step 4: Test Upload (Optional)

1. Click on `product-images` bucket
2. Click **Upload file** (or drag & drop)
3. Select a test image (JPG/PNG)
4. Click **Upload**
5. You should see the file listed

---

### Step 5: Get Public URL (Verify)

1. Click on the uploaded file
2. Copy the public URL (should look like):
   ```
   https://kgkjbardkywvdjwseafe.supabase.co/storage/v1/object/public/product-images/[filename]
   ```

---

## 🔐 Bucket Configuration

**Your bucket settings:**

| Setting | Value |
|---------|-------|
| Bucket Name | `product-images` |
| Public Access | ✅ Enabled |
| Project ID | `kgkjbardkywvdjwseafe` |
| Base URL | `https://kgkjbardkywvdjwseafe.supabase.co/storage/v1/object/public/product-images/` |

---

## 📁 File Upload Path Structure (Recommended)

Organize product images in folders:

```
product-images/
├── product-1234/
│   ├── main.jpg
│   ├── angle-1.jpg
│   ├── angle-2.jpg
│   └── detail.jpg
├── product-5678/
│   ├── main.jpg
│   ├── angle-1.jpg
│   └── angle-2.jpg
└── category-banners/
    ├── electronics.jpg
    └── clothing.jpg
```

This keeps files organized by product ID.

---

## 🔗 Update Backend Configuration (If Needed)

Your `.env` file already has storage configuration:

```env
SUPABASE_STORAGE_BUCKET=product-images
SUPABASE_STORAGE_URL=https://kgkjbardkywvdjwseafe.supabase.co/storage/v1/object/public/product-images/
```

No changes needed! ✅

---

## 📤 Upload Files via API

Once bucket is created, your backend can upload files:

```javascript
// Example from backend
const uploadProductImage = async (file, productId) => {
  const filename = `${productId}/${Date.now()}-${file.originalname}`;

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filename, file.buffer);

  if (error) {
    console.error('Upload failed:', error);
    return null;
  }

  return {
    url: `${process.env.SUPABASE_STORAGE_URL}${filename}`,
    path: filename
  };
};
```

---

## ✅ Verification Checklist

- [ ] Bucket named `product-images` created
- [ ] Public access enabled
- [ ] Can upload test file
- [ ] Can view public URL
- [ ] .env has correct bucket configuration
- [ ] Backend is running (npm run dev)

---

## 🎯 After Storage Bucket is Set Up

You'll be able to:
- ✅ Upload product images
- ✅ Display images on product pages
- ✅ Store image URLs in database
- ✅ Ready for product creation via admin panel

---

## 🚀 Next: Step 10 - Test API Endpoints

Once storage is ready:
1. Start backend: `npm run dev`
2. Test endpoints with Postman or curl
3. Upload test images
4. Create test products
5. Verify everything works

---

## 💡 Pro Tips

1. **Delete test bucket if needed:**
   - Click bucket name → Empty bucket → Delete bucket

2. **Set up image optimization (optional):**
   - Supabase supports image transformations
   - Examples: `/image?width=400&height=300`

3. **Set up CDN cache (optional):**
   - Configure cache headers for better performance

4. **Monitor storage usage:**
   - Check Storage stats in project dashboard

---

## ⏱️ Time Estimate

- Creating bucket: 2 minutes
- Testing upload: 2 minutes
- Verifying configuration: 1 minute
- **Total: ~5 minutes**

---

## 📞 Need Help?

**Bucket not showing up?**
- Refresh page
- Clear browser cache
- Check project selection

**Can't upload files?**
- Check public access is enabled
- File size under 5MB
- Supported formats: jpeg, png, webp

**URL not working?**
- Check bucket is public
- Verify project ID in URL
- Check file was uploaded successfully

---

## 🎉 Summary

| Step | Task | Status |
|------|------|--------|
| 1 | Go to Storage | ✅ |
| 2 | Create bucket | ← YOU ARE HERE |
| 3 | Test upload | ⏳ |
| 4 | Verify URL | ⏳ |
| 5 | Move to Step 10 | ⏳ |

---

**Ready to create the storage bucket?** 🚀

After completion, message me and we'll move to **Step 10: Test API Endpoints**
