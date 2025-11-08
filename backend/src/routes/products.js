import express from 'express';
import { verifyJWT, requireAdmin, requirePermission } from '../middleware/auth.js';
import { validationChains, handleValidationErrors } from '../middleware/validation.js';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler.js';
import { uploadSingle } from '../middleware/upload.js';
import * as productService from '../services/productService.js';

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
 * Get featured products
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
  const filename = `${req.params.id}/${Date.now()}-${req.file.originalname}`;
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
 * Get product variants/inventory
 */
router.get('/:id/variants', asyncHandler(async (req, res) => {
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

export default router;
