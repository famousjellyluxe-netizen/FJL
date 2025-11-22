import express from 'express';
import path from 'path';
import { verifyJWT, requireAdmin, requirePermission } from '../middleware/auth.js';
import { validationChains, handleValidationErrors } from '../middleware/validation.js';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler.js';
import { uploadSingle } from '../middleware/upload.js';
import * as productService from '../services/productService.js';
import * as emailService from '../services/emailService.js';
import * as stockUpdateService from '../services/stockUpdateService.js';
import { supabase } from '../config/database.js';

const router = express.Router();

/**
 * GET /api/products
 * Get all products (public)
 */
router.get('/', asyncHandler(async (req, res) => {
  const filters = {
    is_active: true,
    category_id: req.query.category,
    search: req.query.search,
    sort_by: req.query.sort_by,
    sort_order: req.query.sort_order,
    page: req.query.page,
    limit: req.query.limit
  };

  const result = await productService.getAllProducts(filters);

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination
  });
}));

/**
 * GET /api/products/featured
 * Get featured products (public)
 * NOTE: This must come BEFORE the /:id route to avoid being caught by parameterized route matching
 */
router.get('/featured', asyncHandler(async (req, res) => {
  const limit = req.query.limit || 6;
  const products = await productService.getFeaturedProducts(limit);

  res.json({
    success: true,
    data: products
  });
}));

/**
 * GET /api/products/list/lightweight
 * Get lightweight product list (minimal fields for performance)
 * Returns only: id, name, price, image, category
 * Dramatically reduces payload size (~10x smaller than full response)
 * Perfect for product grids and lists
 * NOTE: Must come BEFORE /:id route to avoid parameterized route matching
 */
router.get('/list/lightweight', asyncHandler(async (req, res) => {
  const filters = {
    is_active: true,
    category_id: req.query.category,
    search: req.query.search,
    sort_by: req.query.sort_by,
    sort_order: req.query.sort_order,
    page: req.query.page,
    limit: req.query.limit
  };

  const result = await productService.getLightweightProducts(filters);

  // Set cache headers for lightweight products (more aggressive caching)
  res.set('Cache-Control', 'public, max-age=300'); // 5 minutes

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination
  });
}));

/**
 * POST /api/products/:id/upload
 * Upload product image (admin only)
 */
router.post('/:id/upload', verifyJWT, requireAdmin, requirePermission('manage_products'), uploadSingle, asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file provided',
      details: [{ field: 'image', message: 'Image file is required' }]
    });
  }

  // Upload file to Supabase Storage
  // SECURITY: Use path.basename() to prevent path traversal attacks
  // This strips any directory components from the filename (e.g., "../../evil.jpg" → "evil.jpg")
  const safeFilename = path.basename(req.file.originalname);
  const filename = `${req.params.id}/${Date.now()}-${safeFilename}`;
  const imageUrl = await productService.uploadProductImage(
    req.file.buffer,
    filename,
    req.file.mimetype
  );

  res.status(200).json({
    success: true,
    message: 'Image uploaded successfully',
    data: {
      url: imageUrl,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
}));

/**
 * GET /api/products/:id
 * Get single product by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);

  // Prevent caching to ensure fresh stock data
  res.set('Cache-Control', 'no-cache, max-age=0');

  res.json({
    success: true,
    data: product
  });
}));

/**
 * POST /api/products
 * Create new product (admin only)
 */
router.post('/', verifyJWT, requireAdmin, requirePermission('manage_products'), validationChains.createProduct, handleValidationErrors, asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product
  });
}));

/**
 * PUT /api/products/:id
 * Update product (admin only)
 */
router.put('/:id', verifyJWT, requireAdmin, requirePermission('manage_products'), validationChains.updateProduct, handleValidationErrors, asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: product
  });
}));

/**
 * DELETE /api/products/:id
 * Delete product (admin only)
 */
router.delete('/:id', verifyJWT, requireAdmin, requirePermission('manage_products'), asyncHandler(async (req, res) => {
  const product = await productService.deleteProduct(req.params.id);

  res.json({
    success: true,
    message: 'Product deleted successfully',
    data: product
  });
}));

/**
 * GET /api/products/:id/variants
 * Get product variants/inventory (admin only)
 * NOTE: This endpoint is sensitive - real-time stock levels should not be exposed to public/competitors
 */
router.get('/:id/variants', verifyJWT, requireAdmin, asyncHandler(async (req, res) => {
  const variants = await productService.getProductInventory(req.params.id);

  res.json({
    success: true,
    data: variants
  });
}));

/**
 * POST /api/products/:id/variants
 * Create product variant (admin only)
 */
router.post('/:id/variants', verifyJWT, requireAdmin, requirePermission('manage_products'), asyncHandler(async (req, res) => {
  const variant = await productService.createVariant(req.params.id, req.body);

  res.status(201).json({
    success: true,
    message: 'Variant created successfully',
    data: variant
  });
}));

/**
 * PUT /api/products/:id/variants/:variantId
 * Update variant stock (admin only)
 */
router.put('/:id/variants/:variantId', verifyJWT, requireAdmin, requirePermission('manage_products'), asyncHandler(async (req, res) => {
  const { stock_quantity } = req.body;

  if (stock_quantity === undefined || stock_quantity < 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid stock quantity',
      details: [{ field: 'stock_quantity', message: 'Must be 0 or greater' }]
    });
  }

  const variant = await productService.updateVariantStock(req.params.variantId, stock_quantity);

  res.json({
    success: true,
    message: 'Variant stock updated successfully',
    data: variant
  });
}));

/**
 * GET /api/products/low-stock
 * Get low stock products (admin only)
 */
router.get('/admin/low-stock', verifyJWT, requireAdmin, requirePermission('manage_products'), asyncHandler(async (req, res) => {
  const products = await productService.getLowStockProducts();

  res.json({
    success: true,
    data: products
  });
}));

/**
 * GET /api/products/admin/unannounced
 * Get products that haven't been announced to subscribers yet (admin only)
 */
router.get('/admin/unannounced', verifyJWT, requireAdmin, requirePermission('manage_products'), asyncHandler(async (req, res) => {
  const products = await productService.getUnannouncedProducts();

  res.json({
    success: true,
    data: products,
    count: products.length
  });
}));

/**
 * POST /api/products/admin/announce
 * Send product announcement emails to all subscribed members (admin only)
 * Body: { productIds: ['uuid1', 'uuid2', ...] } (optional - sends all unannounced if omitted)
 */
router.post('/admin/announce', verifyJWT, requireAdmin, requirePermission('manage_products'), asyncHandler(async (req, res) => {
  console.log('\n🔍 [ANNOUNCE ENDPOINT] Starting announcement process...');

  // Get products to announce
  let products;
  if (req.body.productIds && Array.isArray(req.body.productIds) && req.body.productIds.length > 0) {
    // Announce specific products
    console.log(`📦 [ANNOUNCE ENDPOINT] Fetching specific products: ${req.body.productIds.join(', ')}`);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .in('id', req.body.productIds)
      .is('announced_at', null);

    if (error) throw error;
    products = data || [];
  } else {
    // Announce all unannounced products
    console.log(`📦 [ANNOUNCE ENDPOINT] Fetching all unannounced products...`);
    products = await productService.getUnannouncedProducts();
  }

  console.log(`📦 [ANNOUNCE ENDPOINT] Found ${products.length} unannounced products:`, products.map(p => ({ id: p.id, name: p.name, announced_at: p.announced_at })));

  if (!products || products.length === 0) {
    console.log(`⚠️ [ANNOUNCE ENDPOINT] No unannounced products found, returning error`);
    return res.status(400).json({
      success: false,
      message: 'No unannounced products found'
    });
  }

  // Get all subscribed members
  console.log(`👥 [ANNOUNCE ENDPOINT] Fetching subscribed members...`);
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('*')
    .eq('is_subscribed', true);

  if (membersError) {
    console.error('❌ [ANNOUNCE ENDPOINT] Error fetching members:', membersError);
    throw membersError;
  }

  console.log(`👥 [ANNOUNCE ENDPOINT] Found ${members.length} subscribed members:`, members.map(m => ({ id: m.id, email: m.email })));

  if (!members || members.length === 0) {
    console.log(`⚠️ [ANNOUNCE ENDPOINT] No subscribed members found, returning error`);
    return res.status(400).json({
      success: false,
      message: 'No subscribed members found to send announcements to'
    });
  }

  console.log(`📢 [ANNOUNCE ENDPOINT] Sending announcement for ${products.length} products to ${members.length} members...`);

  // Send emails (AWAIT required here: Admin is actively waiting for announcement completion)
  // This is acceptable to block on since it's an intentional admin action that needs completion status
  const result = await emailService.sendProductAnnouncement(products, members);

  console.log(`📧 [ANNOUNCE ENDPOINT] Email service returned:`, {
    success: result.success,
    sent: result.sent,
    failed: result.failed,
    errors: result.errors
  });

  // If emails sent successfully, mark products as announced
  console.log(`🔍 [ANNOUNCE ENDPOINT] Checking condition: result.success=${result.success}, result.sent=${result.sent}`);
  if (result.success && result.sent > 0) {
    console.log(`✅ [ANNOUNCE ENDPOINT] Condition met, marking products as announced...`);
    const productIds = products.map(p => p.id);
    console.log(`📌 [ANNOUNCE ENDPOINT] Product IDs to mark:`, productIds);
    const markResult = await productService.markProductsAsAnnounced(productIds);
    console.log(`✅ [ANNOUNCE ENDPOINT] Mark result:`, markResult);
  } else {
    console.log(`❌ [ANNOUNCE ENDPOINT] Condition NOT met (success=${result.success}, sent=${result.sent}), NOT marking products as announced!`);
  }

  console.log(`📤 [ANNOUNCE ENDPOINT] Sending response with success=${result.success}`);
  res.json({
    success: result.success,
    message: `Product announcement sent to ${result.sent} members`,
    data: {
      products_announced: result.products,
      emails_sent: result.sent,
      emails_failed: result.failed,
      total_members: result.members,
      errors: result.errors
    }
  });
}));

/**
 * GET /api/products/stock/subscribe
 * Subscribe to real-time stock updates using Server-Sent Events (SSE)
 * Query params:
 *   - productIds: Comma-separated list of product IDs to monitor (optional)
 *
 * Response: Streaming SSE events
 *   event: stock_update
 *   data: { type, productId, variantId, newQuantity, oldQuantity, timestamp, lowStock }
 *
 * Example:
 *   const eventSource = new EventSource('/api/products/stock/subscribe?productIds=id1,id2,id3');
 *   eventSource.addEventListener('stock_update', (e) => {
 *     const data = JSON.parse(e.data);
 *     console.log(`Stock updated: ${data.productId} now has ${data.newQuantity} units`);
 *   });
 */
router.get('/stock/subscribe', asyncHandler(async (req, res) => {
  // Parse product IDs from query params
  const productIdsParam = req.query.productIds || '';
  const productIds = productIdsParam
    ? productIdsParam.split(',').filter(id => id.trim())
    : [];

  console.log(`🔌 Stock update subscription: ${productIds.length} products monitored`);

  // Register this client for stock updates
  const clientId = stockUpdateService.registerStockUpdateClient(res, productIds);

  // Send initial stock data for all subscribed products
  if (productIds.length > 0) {
    try {
      const stockData = await stockUpdateService.getMultipleProductsStock(productIds);

      for (const [productId, variants] of Object.entries(stockData)) {
        const message = JSON.stringify({
          type: 'initial_stock',
          productId,
          variants,
          timestamp: Date.now(),
        });

        res.write(`event: initial_stock\n`);
        res.write(`data: ${message}\n\n`);
      }
    } catch (error) {
      console.error('Error sending initial stock data:', error);
      // Continue anyway - client will request data if needed
    }
  }
}));

/**
 * POST /api/products/stock/subscribe
 * Update subscribed products for existing connection
 * Body: { clientId, productIds: [...] }
 */
router.post('/stock/subscribe', asyncHandler(async (req, res) => {
  const { clientId, productIds = [] } = req.body;

  if (!clientId) {
    return res.status(400).json({
      success: false,
      error: 'clientId required',
      details: [{ field: 'clientId', message: 'Client ID is required' }]
    });
  }

  stockUpdateService.updateSubscribedProducts(clientId, productIds);

  res.json({
    success: true,
    message: `Updated subscription to ${productIds.length} products`,
    clientId,
  });
}));

/**
 * GET /api/products/stock/status
 * Get real-time stock status for a product
 * Query params:
 *   - productId: Product UUID (required)
 */
router.get('/stock/status', asyncHandler(async (req, res) => {
  const { productId } = req.query;

  if (!productId) {
    return res.status(400).json({
      success: false,
      error: 'productId required',
      details: [{ field: 'productId', message: 'Product ID is required' }]
    });
  }

  const stock = await stockUpdateService.getProductStock(productId);

  // Prevent caching to ensure fresh stock data
  res.set('Cache-Control', 'no-cache, max-age=0');

  res.json({
    success: true,
    data: {
      productId,
      variants: stock,
      totalStock: stock.reduce((sum, v) => sum + v.stock_quantity, 0),
      timestamp: Date.now(),
    }
  });
}));

/**
 * GET /api/products/stock/stats
 * Get connection statistics (admin only)
 */
router.get('/stock/stats', verifyJWT, requireAdmin, asyncHandler(async (req, res) => {
  const stats = stockUpdateService.getConnectionStats();

  res.json({
    success: true,
    data: stats
  });
}));

export default router;
