# SEO Testing Checklist - FJL Clothing

**Test Date:** _______________
**Tested By:** _______________
**Environment:** [ ] Local [ ] Staging [ ] Production
**Build Version:** _______________

---

## Pre-Deployment Checklist

### 1. Code Quality

- [ ] All files lint with zero errors: `npm run seo-lint`
- [ ] No console errors in browser (F12)
- [ ] No broken image links
- [ ] All links clickable and working
- [ ] Mobile responsive (test at 375px, 768px, 1024px, 1440px)

### 2. SEO Lint Validation

```bash
# Run automated SEO checks
node seo-lint.js --verbose

# Expected output:
# ✅ index.html passed
# ✅ product.html passed
# ✅ shop.html passed
# ✅ All SEO checks passed!
```

**Pass Criteria:**
- [ ] All critical checks pass
- [ ] Title tags present on all pages
- [ ] Meta descriptions complete (160 chars)
- [ ] OG tags (title, description, image, type) present
- [ ] Exactly one H1 per page
- [ ] All images have alt text

### 3. Sitemap Generation

```bash
# Generate sitemap
node sitemap-generator.js

# Verify output
ls -la sitemap.xml

# Expected: sitemap.xml created with all products + static pages
```

**Pass Criteria:**
- [ ] Sitemap generated successfully
- [ ] sitemap.xml is valid XML
- [ ] All static pages included (/, /shop.html, /about.html, /contact.html)
- [ ] All product pages included (at least 5 test products)
- [ ] URLs are absolute (https://fjlclothing.shop/...)
- [ ] lastmod dates are current
- [ ] Priority values between 0.0-1.0

---

## Metadata Testing

### 4. Home Page (index.html)

Open: `http://localhost:5173` or `https://fjlclothing.shop`

**Title Tag:**
- [ ] Visible in browser tab
- [ ] Contains "FJL" and "Premium Streetwear"
- [ ] Exactly 54-60 characters
- **Expected:** "FJL - Famous Jolly Luxe | Premium Streetwear Fashion"

**Meta Description:**
- [ ] Inspect in DevTools (F12 → Elements)
- [ ] Contains key terms: "streetwear", "fashion", "tees", "sleeveless", "pants", "headwears"
- [ ] Exactly 155-160 characters
- **Expected:** "Discover premium streetwear fashion at FJL (Famous Jolly Luxe). Shop exclusive tees, sleeveless tops, pants, and headwears..."

**OpenGraph Tags:**
```html
<!-- Check in page source (Ctrl+U) for: -->
<meta property="og:title" content="FJL - Famous Jolly Luxe | Premium Streetwear">
<meta property="og:description" content="Discover premium streetwear...">
<meta property="og:image" content="https://fjlclothing.shop/images/og-default.jpg">
<meta property="og:type" content="website">
<meta property="og:url" content="https://fjlclothing.shop/">
```

- [ ] og:title present and matches HTML title
- [ ] og:description matches meta description
- [ ] og:image is valid image URL
- [ ] og:type is "website"
- [ ] og:url is homepage

**Twitter Cards:**
- [ ] twitter:card is "summary_large_image"
- [ ] twitter:title present
- [ ] twitter:description present
- [ ] twitter:image present

**Canonical URL:**
- [ ] Present in page source: `<link rel="canonical" href="https://fjlclothing.shop/">`

**H1 Tag:**
- [ ] Exactly one H1 on page
- [ ] H1 text: "SHOP BEST SELLERS"
- [ ] Visually prominent

### 5. Product Page (product.html)

Open: `http://localhost:5173/product.html?id=<any-product-id>`

**Dynamic Title Update:**
- [ ] Title changes after product loads (wait 2-3 seconds)
- [ ] Format: "[Product Name] - FJL Clothing | Premium Streetwear"
- **Test Product:** Open DevTools → Elements, watch title element change

**Dynamic Metadata:**
- [ ] Meta description updates with product.description
- [ ] og:title becomes product name
- [ ] og:image becomes product.image_url
- [ ] og:type is "product"

**JSON-LD Product Schema:**
```bash
# Inspect page source (Ctrl+U) for JSON-LD block
# Look for: <script type="application/ld+json" data-seo-type="product">
```

- [ ] Product schema present in page source
- [ ] Contains: name, description, image, sku, price, priceCurrency, availability
- [ ] Price and priceCurrency correct
- [ ] Availability correctly set (InStock/OutOfStock)
- [ ] Image URL accessible

**Testing with Rich Results Tool:**
```
Visit: https://search.google.com/test/rich-results

1. Copy product page URL
2. Paste into tool
3. Wait for validation
4. Verify: "Product" appears in detected items
```

- [ ] Rich Results test shows no errors
- [ ] Product schema validates correctly
- [ ] BreadcrumbList schema validates

**Breadcrumb Navigation:**
- [ ] BreadcrumbList JSON-LD present (look in page source)
- [ ] Contains: Home → Shop → [Category] → Product
- [ ] All URLs correct

### 6. Shop Page (shop.html)

Open: `http://localhost:5173/shop.html`

**Title & Description:**
- [ ] Title updated (if modified) or default set
- [ ] Meta description present
- [ ] OG tags present

**H1 Structure:**
- [ ] Exactly one H1 on page
- [ ] H1 relates to shop/collection

---

## Social Media Preview Testing

### 7. Facebook Share Preview

Visit: https://developers.facebook.com/tools/debug/

1. Enter: `https://fjlclothing.shop` (or staging URL)
2. Wait for scraping
3. Verify:

- [ ] Title displays correctly
- [ ] Description visible
- [ ] Image preview shows
- [ ] No errors or warnings
- [ ] URL displays as canonical

**For Product Page:**
1. Enter: `https://fjlclothing.shop/product.html?id=<test-id>`
2. Verify:

- [ ] Product name shows as title
- [ ] Product description displays
- [ ] Product image shows in preview
- [ ] og:type is "product"

### 8. Twitter Card Validator

Visit: https://cards-dev.twitter.com/validator

1. Enter: `https://fjlclothing.shop`
2. Verify:

- [ ] Card type: "summary_large_image"
- [ ] Title present
- [ ] Description present
- [ ] Image preview shows
- [ ] No validation errors

**For Product Page:**
1. Enter: `https://fjlclothing.shop/product.html?id=<test-id>`
2. Verify same elements

### 9. LinkedIn Post Inspector

Visit: https://www.linkedin.com/post-inspector/

1. Enter: `https://fjlclothing.shop`
2. Verify:

- [ ] Title displays
- [ ] Description visible
- [ ] Image preview shows
- [ ] URL appears correct

---

## Image Optimization Testing

### 10. Image Alt Text

Open any page in browser, right-click images:

- [ ] Hero image has alt: "SNUG WORLD Hero Banner" (or similar)
- [ ] All product images have alt text (product name)
- [ ] No images show "image" or blank alt attributes
- [ ] Logo has appropriate alt: "FJL Logo" or similar

**Check in DevTools:**
```javascript
// Open F12 → Console, run:
Array.from(document.querySelectorAll('img')).forEach(img => {
  console.log(img.src, '→ alt:', img.alt || '❌ MISSING');
});
```

- [ ] All img tags have alt attribute
- [ ] No alt attributes are empty strings
- [ ] Alt text is descriptive (not just "image1.jpg")

### 11. Image Loading Attributes

```javascript
// Check lazy loading in console:
Array.from(document.querySelectorAll('img')).forEach(img => {
  console.log(img.src, '→ loading:', img.loading || 'not set');
});
```

- [ ] Non-critical images have `loading="lazy"`
- [ ] Hero/critical images don't have lazy loading
- [ ] No console warnings about image loading

---

## Performance & Core Web Vitals

### 12. Google PageSpeed Insights

Visit: https://pagespeed.web.dev/

1. Test: `https://fjlclothing.shop`
2. Check Desktop results:

- [ ] SEO Score: 90+ (accept 85+)
- [ ] Performance Score: 75+
- [ ] Accessibility Score: 90+
- [ ] Best Practices Score: 85+
- [ ] No critical issues listed

3. Check Mobile results:

- [ ] SEO Score: 90+ (accept 85+)
- [ ] Same other scores (may be slightly lower)

4. Review "Opportunities" section:

- [ ] Identify image optimization opportunities
- [ ] Check for unused JavaScript
- [ ] Verify font optimization suggestions
- [ ] Note deferred non-critical CSS

### 13. Lighthouse Audit

Open page in Chrome, F12 → Lighthouse:

```
Click "Analyze page load" button
Run desktop & mobile audits
```

**Desktop Audit:**
- [ ] Performance: 75+
- [ ] Accessibility: 90+
- [ ] Best Practices: 85+
- [ ] SEO: 90+

**Mobile Audit:**
- [ ] Performance: 70+
- [ ] All other scores 90+

**Review Diagnostics:**
- [ ] Largest Contentful Paint (LCP): < 2.5s
- [ ] Cumulative Layout Shift (CLS): < 0.1
- [ ] First Input Delay (FID): < 100ms (or Interaction to Next Paint < 200ms)

---

## Structured Data Validation

### 14. Google Rich Results Test

Visit: https://search.google.com/test/rich-results

**For Each Page:**

1. Homepage:
   - [ ] Organization schema detected
   - [ ] Website schema detected
   - [ ] No validation errors

2. Product Page:
   - [ ] Product schema detected
   - [ ] BreadcrumbList schema detected
   - [ ] Organization schema detected
   - [ ] No validation errors
   - [ ] Price and availability values correct

3. Shop Page:
   - [ ] Appropriate schemas detected
   - [ ] No errors

### 15. Schema.org Validator

Visit: https://validator.schema.org/

1. Validate homepage JSON-LD:
   - [ ] Paste index.html page source
   - [ ] Organization schema validates
   - [ ] Website schema validates
   - [ ] No critical issues

2. Validate product page:
   - [ ] Product schema validates
   - [ ] Breadcrumb validates
   - [ ] All required properties present

---

## Robots.txt & Crawling Rules

### 16. Robots.txt Validation

Visit: `http://localhost:5173/robots.txt`

**Check Content:**
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /checkout.html
Allow: /product.html
Allow: /shop.html
Sitemap: https://fjlclothing.shop/sitemap.xml
```

- [ ] File returns HTTP 200
- [ ] Contains Sitemap declaration
- [ ] Admin paths blocked
- [ ] Checkout/cart blocked
- [ ] Product/shop allowed
- [ ] Syntax is valid (no errors)

### 17. Robots.txt Tester

Visit: https://www.screaming-frog.co.uk/robots-txt-tester/ (optional)

1. Enter site: `https://fjlclothing.shop`
2. Test various URLs:

- [ ] `/index.html` → Allowed
- [ ] `/shop.html` → Allowed
- [ ] `/product.html?id=123` → Allowed
- [ ] `/admin/` → Disallowed
- [ ] `/checkout.html` → Disallowed
- [ ] `/cart.html` → Disallowed

---

## Sitemap Testing

### 18. Sitemap Validation

```bash
# Download and validate
curl -o /tmp/sitemap.xml https://fjlclothing.shop/sitemap.xml

# Check if valid XML (requires libxml2):
xmllint --noout /tmp/sitemap.xml
# Expected: /tmp/sitemap.xml validates
```

Or manually inspect `sitemap.xml`:

- [ ] File is valid XML
- [ ] `<?xml version="1.0"?>` declaration present
- [ ] All URLs wrapped in `<url>` tags
- [ ] Each URL has `<loc>`, `<lastmod>`, `<changefreq>`, `<priority>`
- [ ] All URLs are absolute (start with https://)
- [ ] No duplicate URLs
- [ ] Product URLs include `?id=<product-id>`

### 19. Sitemap Submission

Visit Google Search Console: https://search.google.com/search-console/

1. Go to Sitemaps section
2. Submit: `https://fjlclothing.shop/sitemap.xml`

- [ ] Submission accepted
- [ ] Status: "Success" (may take hours to process)
- [ ] Check again after 24 hours:
  - [ ] Sitemap processed
  - [ ] No errors
  - [ ] URLs indexed

### 20. Production Sitemap Updates

**Monthly Verification:**

```bash
# Check when sitemap was last generated
ls -la sitemap.xml
# Note: last modification date

# Regenerate if outdated
node sitemap-generator.js
git add sitemap.xml
git commit -m "chore: Regenerate sitemap with latest products"
git push
```

- [ ] Sitemap regenerated monthly
- [ ] New products added within a week
- [ ] Removed/inactive products excluded
- [ ] File committed to git

---

## Browser & Device Testing

### 21. Cross-Browser Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest, if Mac)
- [ ] Edge (latest)

**For Each Browser:**
- [ ] Page loads fully
- [ ] No console errors
- [ ] Metadata visible in page source
- [ ] Images display correctly
- [ ] Mobile version responsive
- [ ] Scrolling smooth

### 22. Mobile Testing

Test on:
- [ ] iPhone 12/13 (iOS)
- [ ] Android device (Chrome)
- [ ] Tablet (iPad or Android tablet)

**For Each Device:**
- [ ] Page loads in < 3 seconds
- [ ] Navigation tappable (min 48x48px touch targets)
- [ ] Text readable without pinch-zoom
- [ ] Images responsive
- [ ] No horizontal scrolling
- [ ] Form inputs accessible

### 23. Accessibility Testing

Open page, press F12:

1. **DevTools Audits:**
   - [ ] Run accessibility audit
   - [ ] Score 90+
   - [ ] Fix any flagged issues

2. **Keyboard Navigation:**
   - [ ] Tab through page → all interactive elements reachable
   - [ ] Buttons and links clearly focused
   - [ ] Modals properly trapped (can't tab out)

3. **Screen Reader (optional):**
   - [ ] Test with NVDA (Windows) or VoiceOver (Mac)
   - [ ] All text readable
   - [ ] Form labels associated correctly
   - [ ] Navigation structure logical

---

## Monitoring Post-Deployment

### 24. Google Search Console Monitoring

After deploying to production:

1. **Verify Indexing:**
   ```
   Site: https://fjlclothing.shop (site: search)
   # Should show indexed pages
   ```

2. **Check Coverage Report:**
   - [ ] No "Errors" pages
   - [ ] No "Valid with warnings" critical issues
   - [ ] "Valid" count matches expected pages

3. **Monitor Search Performance:**
   - [ ] Check daily for new impressions
   - [ ] Track click-through rate (CTR)
   - [ ] Monitor average position of key keywords
   - [ ] Look for any index issues

### 25. Analytics Tracking

Verify in Google Analytics 4:

- [ ] Events firing on page load
- [ ] Product page views tracked
- [ ] Conversions (add-to-cart, checkout) tracked
- [ ] Organic traffic visible in source/medium

**Useful Dimensions to Check:**
- Landing pages (should see /product.html with various IDs)
- Pages/screens (should see /shop.html, /product.html)
- Traffic source "organic" exists

---

## Issue Resolution

### Common Issues & Fixes

#### Issue: Meta tags not updating on product page
**Solution:**
1. Check browser console (F12) for errors
2. Verify `js/seo-utils.js` is loaded
3. Check if `product-data-service.js` is setting `currentProduct`
4. Wait 3-5 seconds after page load
5. If still failing, check DevTools Network tab for API errors

#### Issue: Sitemap 404 error
**Solution:**
1. Regenerate: `node sitemap-generator.js`
2. Check file exists: `ls -la sitemap.xml`
3. Ensure `vite.config.js` copies sitemap.xml to dist
4. For production, verify file deployed to server

#### Issue: Rich Results test shows errors
**Solution:**
1. Copy page URL into Rich Results test tool
2. Note specific errors in report
3. Check page source for JSON-LD validity
4. Use `seo-lint.js --verbose` for details
5. Fix missing required fields

#### Issue: Lighthouse score low
**Solution:**
1. Review "Opportunities" section in Lighthouse
2. Implement top suggestions (images usually #1 improvement)
3. Retest after changes
4. Track improvements over time

---

## Sign-Off

**Tester Name:** _____________________
**Date:** _____________________
**Environment:** [ ] Local [ ] Staging [ ] Production

**Overall Assessment:**
- [ ] All critical checks passed
- [ ] All important checks passed
- [ ] Acceptable warnings: _________________________

**Status:**
- [ ] **READY FOR PRODUCTION** - All tests passed
- [ ] **NEEDS FIXES** - Issues listed below
- [ ] **BLOCKED** - Critical failures prevent deployment

**Issues Blocking Deployment:**
```
1.
2.
3.
```

**Sign-Off:**

Approved by: _______________________ Date: __________

**Notes:**

_________________________________________________________________

_________________________________________________________________

---

## Appendix: Useful Commands

```bash
# SEO Validation
node seo-lint.js --verbose

# Sitemap Generation
node sitemap-generator.js
node sitemap-generator.js --local  # Use cache if API down

# Build & Test
npm run build

# Local Development
npm run dev
# Then visit: http://localhost:5173

# Check File Sizes
du -sh sitemap.xml robots.txt

# Validate JSON-LD
# Paste page source into: https://jsonld.org/playground/
```

---

**Last Updated:** December 2024
**Version:** 1.0

