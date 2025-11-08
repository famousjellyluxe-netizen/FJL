# 🧪 Admin → Client Product Sync Test Guide

## ✅ IMAGE UPLOAD NOW ADDED!

I've just added **image upload functionality** to the admin product creation form. Now you can:

✅ Upload images directly from your computer
✅ Use image URLs
✅ See image previews before saving
✅ Images sync to client-side automatically

---

## 🎯 COMPLETE TESTING FLOW

### **Step 1: Create Product in Admin**

1. Open **Admin Dashboard**: `http://localhost:5173/admin/`
2. Login if needed (email: `admin@fjl.com`, password: `admin123`)
3. Click **Products** in sidebar
4. Click **"+ Add Product"** button

### **Step 2: Fill in Product Form**

You'll now see a **"Product Image"** section with:
- **File Upload**: Click to select image from your computer
- **Image Preview**: Shows selected image before saving
- **Image URL (Optional)**: Or paste a URL instead

**Example Product to Create:**

```
Product Name:         FTG Test Jersey
Category:             Tops
SKU:                  TEST-001
Price (₦):            50000
Original Price (₦):   60000
Description:          Test product with image
Stock Quantity:       100
Available Sizes:      S, M, L, XL
Available Colors:     Black, Navy, Gold
In Stock:             ✓ Checked
Product Image:        [Upload or paste URL]
```

### **Step 3: Upload Image**

**Option A: Upload from Computer**
1. Click **"Product Image"** file input
2. Select an image from your computer (JPG, PNG, etc.)
3. See preview appear in the form
4. Click **"Save Product"**

**Option B: Use Image URL**
1. Paste image URL in **"Image URL (Optional)"** field
   - Example: `https://via.placeholder.com/300x400?text=Jersey`
2. Click **"Save Product"**

### **Step 4: Verify Product Saved**

After saving:
- Success message: `"Product created successfully!"`
- New product appears in the products table below
- Click **F12** → **Application** → **LocalStorage** → `fjl_products`
- You should see your product with image data

---

## 👀 STEP 5: View on Client Side

### **Open Shop Page**

1. Open **Shop**: `http://localhost:5173/shop.html`
2. Scroll through products
3. **Your new product should appear!** 🎉

### **Check Product Details**

1. Click on your product
2. Opens **product.html**
3. See:
   - Product image displayed
   - Product name
   - Price
   - Available sizes/colors
   - Description
   - Add to cart button

---

## 🛒 STEP 6: Test Full Flow

### **Add to Cart**

1. Select size (e.g., "M")
2. Select color (e.g., "Black")
3. Change quantity (optional)
4. Click **"Add to Cart"**
5. See item in cart drawer

### **View Cart**

1. Click **cart icon** in header
2. See your product with:
   - Image thumbnail
   - Name
   - Size & color
   - Price
   - Quantity
   - Remove button

### **Checkout**

1. Click **"Proceed to Checkout"**
2. Fill in shipping info
3. Click **"Place Order"**
4. See confirmation page

### **Verify Data in localStorage**

Check Browser DevTools (F12):
- **fjl_products** - Your product
- **fjl_cart** - Cart items
- **fjl_orders** - Order created

---

## 📊 TESTING CHECKLIST

- [ ] Admin dashboard loads without errors
- [ ] Can open "Add Product" modal
- [ ] Can upload image from computer
- [ ] Image preview shows in form
- [ ] Can use image URL instead
- [ ] Form submits successfully
- [ ] Success message appears
- [ ] Product appears in products table
- [ ] Product saved to localStorage
- [ ] Shop page loads
- [ ] Product appears on shop page
- [ ] Product image displays correctly
- [ ] Product detail page works
- [ ] Can add product to cart
- [ ] Cart displays product with image
- [ ] Checkout completes
- [ ] Order appears in localStorage

---

## 🔧 HOW IT WORKS

### **Image Storage**

Images are stored as **Base64 data** in localStorage:

```javascript
{
  id: "ftg-test-jersey",
  name: "FTG Test Jersey",
  price: 50000,
  image: "data:image/png;base64,iVBORw0KGgoAAAANS..." // Base64 image data
}
```

This works **perfectly for testing** but note:
- Base64 images are large (not ideal for production)
- In production, you'd upload to Supabase Storage or Cloudinary
- For now, this is great for localStorage testing

### **Image Flow**

```
Admin Uploads Image
    ↓
Browser reads file as Base64
    ↓
Saved to localStorage['fjl_products']
    ↓
Shop page loads products from localStorage
    ↓
Product images display on shop/product pages
    ↓
Images appear in cart & checkout
```

---

## 🎨 QUICK IMAGE SOURCES FOR TESTING

You can use these URLs without uploading:

```
https://via.placeholder.com/300x400?text=Jersey
https://via.placeholder.com/300x400?text=Polo
https://via.placeholder.com/300x400?text=Tracksuit
https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300
https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300
https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300
```

Just paste any of these in the **"Image URL (Optional)"** field!

---

## 🧪 FULL WORKFLOW EXAMPLE

### **Create "FTG Polo" Product**

```
1. Admin Dashboard → Products → + Add Product

2. Fill form:
   - Name: "FTG Rugby Polo"
   - Category: "Tops"
   - SKU: "POLO-001"
   - Price: 67000
   - Original Price: 75000
   - Description: "Premium rugby polo shirt"
   - Stock: 50
   - Sizes: S, M, L, XL, XXL
   - Colors: Black, Navy, Gold

3. Image URL:
   https://via.placeholder.com/300x400?text=Polo

4. Click "Save Product"

5. See success message

6. Open Shop: http://localhost:5173/shop.html

7. See "FTG Rugby Polo" with image!

8. Click product → Add to cart → Checkout

9. Check localStorage in F12 for all data
```

---

## ✨ FEATURES NOW ENABLED

✅ **Image Upload** - Upload images from computer
✅ **Image Preview** - See image before saving
✅ **Image URL** - Paste URLs for quick testing
✅ **Image Storage** - Saved to localStorage
✅ **Image Display** - Shows on shop/product pages
✅ **Image in Cart** - Product images in cart drawer
✅ **Image Persistence** - Survives page refreshes

---

## 🆘 TROUBLESHOOTING

### **"Image not showing on shop page"**

**Check:**
1. Product saved to localStorage (F12 → Application)
2. Image field has data (not empty)
3. Shop page is loading products: `JSON.parse(localStorage.getItem('fjl_products'))`
4. Reload shop page (Ctrl+R)

### **"Base64 image too large"**

For large images, use **Image URL** instead:
- Paste URL in "Image URL (Optional)"
- Doesn't convert to Base64
- Uses URL directly

### **"Preview not showing"**

Make sure:
1. File is selected (file input has file)
2. File is valid image (JPG, PNG, etc.)
3. Not too large (recommend < 5MB for testing)
4. Check browser console for errors (F12)

### **"Product not appearing on shop"**

Check:
1. Admin logout/login cycle
2. Clear localStorage if corrupted: `localStorage.clear()`
3. Reload both pages (Ctrl+R)
4. Check browser console for JS errors (F12 → Console)

---

## 📸 IMAGE FORMATS SUPPORTED

✅ JPEG / JPG
✅ PNG
✅ GIF
✅ WebP
✅ SVG
✅ BMP

---

## 🎯 NEXT STEPS

Once you confirm this works:

1. **Create multiple products** with different images
2. **Test filtering** (by category, sleeve type)
3. **Test product editing** (upload new images)
4. **Test bulk operations** (delete products)
5. **Test complete flow** (shop → cart → checkout)

---

## 💡 PRO TIPS

**For Quick Testing:**
- Use placeholder URLs (faster than uploading)
- Create 5-10 test products
- Test on multiple pages
- Test on mobile (responsive)

**For Realistic Testing:**
- Upload actual clothing images
- Test with different image sizes
- Test with slow internet (DevTools → Throttling)

---

## ✅ SUCCESS INDICATORS

You'll know it's working when:

1. ✅ Admin form has image upload section
2. ✅ Image preview appears when selecting file
3. ✅ Product saves with image
4. ✅ Shop page displays product image
5. ✅ Product detail page shows image
6. ✅ Cart shows product thumbnail
7. ✅ Image persists on page reload
8. ✅ Edit product shows existing image

---

**Made with ❤️ by FJL Team**
**Ready for testing!** 🚀
