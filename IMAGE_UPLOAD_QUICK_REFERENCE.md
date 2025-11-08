# Image Upload Feature - Quick Reference Guide

**Quick access guide for the complete image upload integration**

---

## 📋 Quick Summary

✅ **Status:** Complete & Working
✅ **Bucket Name:** `product-image`
✅ **Base URL:** `https://kgkjbardkywvdjwseafe.supabase.co/storage/v1/object/public/product-image/`
✅ **File Size:** Max 5MB
✅ **Formats:** JPEG, PNG, WebP
✅ **Backend:** Running on port 5001

---

## 🚀 Quick Start

### 1. Start Backend
```bash
cd C:\Users\rapha\Desktop\FJL\backend
npm run dev
```

### 2. Create Product with Image
- Go to Admin Panel
- Click "Add New Product"
- Fill in product details
- Select image file
- Click "Save Product"
- Image uploads automatically ✅

### 3. Verify Upload
- Go to Supabase Storage → product-image bucket
- See image files organized by product ID
- Copy public URL if needed

---

## 📁 Key Files

### Backend
| File | Purpose |
|------|---------|
| `backend/.env` | Storage configuration variables |
| `backend/src/middleware/upload.js` | Multer file upload middleware |
| `backend/src/routes/products.js` | Updated with `/upload` endpoint |

### Frontend
| File | Purpose |
|------|---------|
| `admin/admin.js` | Updated with async API calls & uploadProductImage() |
| `admin/products.html` | Updated form with file upload handling |

---

## 🔌 API Endpoint

### Upload Product Image
```
POST /api/products/:productId/upload

Headers:
- Authorization: Bearer <jwt-token>
- Content-Type: multipart/form-data

Body:
- image: <file>

Response:
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://...product-image/[productId]/[filename]",
    "filename": "original-name.jpg",
    "size": 12345,
    "mimetype": "image/jpeg"
  }
}
```

---

## 💻 Code Examples

### Upload Image from Frontend
```javascript
// In admin.js - already implemented
const uploadedUrl = await adminDataService.uploadProductImage(productId, file);
console.log('Image uploaded:', uploadedUrl);
```

### Upload Image from Backend
```javascript
// In productService.js - already implemented
const imageUrl = await uploadProductImage(
  fileBuffer,
  'product-123/image.jpg',
  'image/jpeg'
);
```

---

## 🔐 Permissions

- ✅ Public: View images (anyone with URL)
- ✅ Admin: Upload images
- ✅ Admin: Delete images
- ✅ Admin: Manage products

---

## 📊 Storage Structure

```
product-image/
├── [productId-1]/
│   ├── 1730982345-main-image.jpg
│   ├── 1730982346-angle-view.jpg
│   └── 1730982347-detail.jpg
├── [productId-2]/
│   ├── 1730982348-featured.jpg
│   └── 1730982349-back-view.jpg
└── [productId-3]/
    └── 1730982350-white-version.png
```

---

## ✅ Testing Checklist

Quick checklist for verification:

- [ ] Backend running on port 5001
- [ ] Admin panel loads without errors
- [ ] Can create product with image
- [ ] Image file uploads to Supabase
- [ ] Public URL works in browser
- [ ] Image appears in Storage bucket
- [ ] Can update product with new image
- [ ] Can delete products
- [ ] No console errors

---

## 🛠️ Troubleshooting

### Image won't upload
- Check file size < 5MB
- Check format: JPEG, PNG, or WebP only
- Check backend running
- Check JWT token valid
- Check browser console for errors

### Can't see storage bucket
- Go to https://app.supabase.com
- Select FJL project
- Click Storage
- Bucket should be named: `product-image`

### URL not working
- Check bucket is public
- Check file actually uploaded
- Check path in URL is correct
- Try copying full URL to test

---

## 📈 Performance Tips

1. **Compress Images Before Upload**
   - Reduce file size for faster uploads
   - Smaller storage usage

2. **Use Proper Formats**
   - WebP: Best quality/size ratio
   - PNG: For transparency
   - JPEG: For photos

3. **Organize Files**
   - Use product ID in path
   - Keep related images together
   - Easy to find and manage

---

## 🔗 Related Documentation

- `STEP9_IMAGE_UPLOAD_INTEGRATION_COMPLETE.md` - Full technical details
- `STEP9_STORAGE_BUCKET_SETUP.md` - Storage bucket setup guide
- `STEP8_COMPLETION_SUMMARY.md` - Backend setup info

---

## 📞 Quick Support

### Common Tasks

**Upload an image to a product:**
```
Admin Panel → Products → Edit Product → Select File → Save
```

**Get image public URL:**
```
Supabase → Storage → product-image → Find file → Copy URL
```

**Delete an image:**
```
Supabase → Storage → product-image → Right-click file → Delete
```

---

## 🎯 Integration Summary

```
Admin Form
    ↓
    ├─ Create/Update Product (API)
    └─ Upload Image File (API)
           ↓
        Backend Routes
           ↓
        Multer Middleware
           ↓
        Supabase Storage
           ↓
        Public URL
           ↓
        Display in Frontend
```

---

## ✨ Current Status

**All Features:**
- ✅ Image upload endpoint
- ✅ File validation
- ✅ Storage bucket configured
- ✅ Admin panel integrated
- ✅ Error handling
- ✅ JWT authentication
- ✅ Public URL generation

**Ready for:**
- ✅ Product creation/update with images
- ✅ Image gallery display
- ✅ Frontend integration

---

*Last Updated: November 8, 2025*
*Integration Status: Complete ✅*
