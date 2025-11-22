IMPORTANT — READ AND APPLY COMPLETELY

I need you to audit my entire website project (both frontend and backend) and fix the performance issues that cause slow loading of products from the database.

Your job is to check everything you have built so far and make improvements wherever necessary based on the rules below.

✅ 1. Backend API Speed Optimization

Go through all backend routes that return products (list, featured, collections, product details, etc.) and verify:

CHECK & FIX:

If queries are slow or unindexed → add proper indexes (category, slug, id, etc.)

If the API fetches unnecessary fields → return only essential fields for product lists

Implement API-level caching using simple in-memory cache:

Cache list responses for 5 minutes

Auto-clear cache after timeout

Make sure DB queries use .lean() where possible (MongoDB)

If anything is missing, implement the fix immediately.

✅ 2. Pagination & Lightweight API Responses
CHECK & FIX:

Product listing endpoints MUST use pagination (page & limit)

Default limit should be 12 items

The response for product lists should include ONLY:

id

name

price

image

category

Move all heavy data (long descriptions, variants, etc.) to a separate full-details API.

If not implemented correctly → apply the correction.

✅ 3. Image Optimization

Check how product images are being served.

CHECK & FIX:

Ensure all images are converted to WebP

Apply image compression where needed (< 200KB per file)

Add loading="lazy" to ALL product images

Confirm images load from the correct optimized path

If any of these are missing → implement them immediately.

✅ 4. Frontend Rendering Optimization
CHECK & FIX:

Add skeleton loaders while products are loading

Ensure API fetch functions are efficient (no unnecessary loops)

Verify that product grids do NOT rerender more than needed

Use pagination or “load more”, NOT full data loading

If these are wrong → fix every file accordingly.

✅ 5. Render Deployment Fixes (Backend)
CHECK & FIX:

Ensure no route triggers expensive operations on each request

Verify the backend is not making duplicate database queries

Ensure environment settings are correctly configured:

Pooled connections

No unnecessary logs

Free-tier-friendly cold start mitigation (cache)

🔍 6. Summary Checklist for You to Follow

When optimizing, confirm that ALL of these are correctly implemented:

 Database indexes

 Query .lean() usage

 In-memory caching

 Pagination on product list

 Lightweight API responses

 WebP images

 Lazy loading images

 Skeleton loaders

 No unnecessary re-renders

 No large blocking operations in routes

 Loading state optimized

If ANY of these are missing, fix them.

🛠️ Final Directive

Do a complete audit FIRST.
Then implement the missing improvements across ALL relevant files:

Backend routes

Controllers

Utilities

Database models

Frontend fetch logic

Frontend rendering components

Image assets pipeline

Note:
1. Create a new branch for this implementation
2. Do not break existing functionality.
3. Refactor cleanly, safely, and systematically.