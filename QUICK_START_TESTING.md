# 🚀 Quick Start Testing Guide

## ⚡ 5-Minute Test (No Backend Needed)

### Step 1: Open Admin (1 min)
```
http://localhost:5173/admin/
```
- Login: admin@fjl.com / admin123
- Click "Products" in sidebar

### Step 2: Create Product (2 min)
```
Click "+ Add Product"

Fill in:
- Name: "Test Jersey"
- Category: "Tops"
- SKU: "TEST-001"
- Price: 50000
- Stock: 100
- Sizes: S, M, L
- Colors: Black, Navy

Image URL (paste):
https://via.placeholder.com/300x400?text=TestJersey

Click "Save Product"
```

### Step 3: View on Shop (1 min)
```
http://localhost:5173/shop.html
```
See your product appear with image!

### Step 4: Test Flow (1 min)
```
- Click product
- Add to cart
- View cart
- Go to checkout
- Complete order
```

---

## 📋 Complete Testing Checklist

### Admin Side ✅
- [ ] Can login
- [ ] Can create product
- [ ] Can upload image
- [ ] Can see image preview
- [ ] Can save product
- [ ] Product appears in table

### Shop Side ✅
- [ ] Shop loads
- [ ] Product appears
- [ ] Image displays
- [ ] Can click product
- [ ] Product details show

### Cart & Checkout ✅
- [ ] Can add to cart
- [ ] Cart shows image
- [ ] Can checkout
- [ ] Order created
- [ ] Order confirmation shows

---

## 🖼️ Quick Image URLs (Copy & Paste)

```
https://via.placeholder.com/300x400?text=Jersey
https://via.placeholder.com/300x400?text=Polo
https://via.placeholder.com/300x400?text=Tracksuit
https://via.placeholder.com/300x400?text=Shorts
https://via.placeholder.com/300x400?text=Jacket
```

---

## 🔍 Check LocalStorage

Open Browser DevTools (F12):
```
1. Application tab
2. LocalStorage
3. Look for 'fjl_products'
4. See your product with image data
```

---

## 📱 What Works Without Backend

✅ Admin create/edit/delete products
✅ Product images upload & display
✅ Shop page product listing
✅ Product filtering & search
✅ Shopping cart
✅ Checkout form
✅ Order creation
✅ Order history

❌ Email confirmations (need Resend)
❌ Real payment (need backend)
❌ Admin login (hardcoded only)

---

## 🧪 Test Scenarios

### Scenario 1: Create Product
```
Admin → Create product → Shop → See product ✅
```

### Scenario 2: Add to Cart
```
Shop → Click product → Add to cart → Cart shows item ✅
```

### Scenario 3: Complete Order
```
Shop → Add item → Cart → Checkout → Order confirmation ✅
```

### Scenario 4: Edit Product
```
Admin → Products → Click Edit → Change details → Save ✅
```

### Scenario 5: Delete Product
```
Admin → Products → Click Delete → Confirm ✅
```

---

## 📖 Full Guides

- **ADMIN_TO_CLIENT_TEST.md** - Detailed testing guide
- **IMAGE_UPLOAD_ADDED.txt** - Image upload details
- **README.md** - General overview

---

## 🆘 Issues?

**Product not showing on shop:**
1. F12 → Application → LocalStorage → Check 'fjl_products'
2. Reload shop page (Ctrl+R)
3. Check browser console (F12 → Console) for errors

**Image not uploading:**
1. Check file size (< 5MB recommended)
2. Supported formats: JPG, PNG, GIF, WebP
3. Try using Image URL instead

**Cart/Checkout not working:**
1. Check browser console (F12 → Console)
2. Clear localStorage and try again
3. Disable browser extensions (ad blockers, etc.)

---

## ✅ Success Indicators

When you see this, you know it's working:

1. ✅ Products appear in admin table
2. ✅ Products show on shop page
3. ✅ Images display correctly
4. ✅ Can add items to cart
5. ✅ Checkout completes
6. ✅ Order shows in localStorage

---

## 🎯 Next Steps

After testing works locally:

1. **Add more products** (5-10 test products)
2. **Test on mobile** (responsive testing)
3. **Test full flow** multiple times
4. **Set up Supabase** (when ready)
5. **Set up Resend** (when ready)
6. **Deploy backend** (when ready)

---

**Ready? Open http://localhost:5173/admin/ and start testing!** 🚀
