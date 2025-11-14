/**
 * Category Routes
 * Handles all HTTP endpoints for category management
 * Public endpoints for reading categories, admin endpoints for CRUD
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import * as categoryService from '../services/categoryService.js';
import { verifyJWT, requireAdmin, requirePermission } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * ERROR HANDLER HELPER
 */
function handleAppErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
}

/**
 * GET /api/categories
 * Get all active categories with product counts and pagination
 * Public endpoint - no authentication required
 * Query params:
 *   - include_archived: Set to 'true' to include archived categories
 *   - sort_by: Sort field ('name', 'sort_order', 'created_at')
 *   - order: Sort direction ('asc', 'desc')
 *   - limit: Max results per page (default: 100, max: 1000)
 *   - offset: Number of results to skip (default: 0)
 */
router.get('/', asyncHandler(async (req, res) => {
  const { include_archived, sort_by, order, limit, offset } = req.query;

  const result = await categoryService.getAllCategories({
    includeArchived: include_archived === 'true',
    sortBy: sort_by || 'sort_order',
    order: order || 'asc',
    limit: limit ? parseInt(limit) : undefined,
    offset: offset ? parseInt(offset) : undefined
  });

  res.json({
    success: true,
    data: result.data,
    pagination: {
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      page: result.page,
      pages: result.pages
    }
  });
}));

/**
 * GET /api/categories/:id
 * Get single category by ID with product count
 * Public endpoint
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await categoryService.getCategoryById(id);

  // Get products in this category
  const { products, total } = await categoryService.getProductsByCategory(id, {
    limit: 100,
    offset: 0
  });

  res.json({
    success: true,
    data: {
      ...category,
      product_count: total,
      products
    }
  });
}));

/**
 * GET /api/categories/:slug/products
 * Get products assigned to a category by slug
 * Public endpoint
 */
router.get('/:slug/products', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { limit = 20, offset = 0 } = req.query;

  // Get category by slug
  const category = await categoryService.getCategoryBySlug(slug);

  // Get products in this category
  const { products, total } = await categoryService.getProductsByCategory(category.id, {
    limit: parseInt(limit) || 20,
    offset: parseInt(offset) || 0
  });

  res.json({
    success: true,
    data: {
      category,
      products,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total
      }
    }
  });
}));

/**
 * POST /api/categories
 * Create new category
 * Admin endpoint - requires JWT and admin permission
 */
router.post(
  '/',
  verifyJWT,
  requireAdmin,
  requirePermission('manage_categories'),
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Category name is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Category name must be between 1 and 100 characters'),
    body('slug')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Category slug must be between 1 and 100 characters')
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Category slug must contain only lowercase letters, numbers, and hyphens'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Category description must not exceed 1000 characters'),
    body('image_url')
      .optional()
      .trim()
      .isURL()
      .withMessage('Category image must be a valid URL'),
    body('sort_order')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Sort order must be a non-negative integer')
  ],
  asyncHandler(async (req, res) => {
    // Check validation errors
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors.array()
      });
    }

    const { name, slug, description, image_url, sort_order } = req.body;

    console.log(`📝 Creating new category: ${name}`);

    const category = await categoryService.createCategory({
      name,
      slug,
      description,
      image_url,
      sort_order
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  })
);

/**
 * PUT /api/categories/:id
 * Update category
 * Admin endpoint - requires JWT and admin permission
 */
router.put(
  '/:id',
  verifyJWT,
  requireAdmin,
  requirePermission('manage_categories'),
  [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Category name cannot be empty')
      .isLength({ min: 1, max: 100 })
      .withMessage('Category name must be between 1 and 100 characters'),
    body('slug')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Category slug must be between 1 and 100 characters')
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Category slug must contain only lowercase letters, numbers, and hyphens'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Category description must not exceed 1000 characters'),
    body('image_url')
      .optional()
      .trim()
      .isURL()
      .withMessage('Category image must be a valid URL'),
    body('sort_order')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Sort order must be a non-negative integer'),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('is_active must be a boolean')
  ],
  asyncHandler(async (req, res) => {
    // Check validation errors
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors.array()
      });
    }

    const { id } = req.params;
    const updates = req.body;

    console.log(`✏️ Updating category: ${id}`);

    const updated = await categoryService.updateCategory(id, updates);

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updated
    });
  })
);

/**
 * PATCH /api/categories/reorder
 * Update category sort order
 * Admin endpoint - requires JWT and admin permission
 * Body: { ids: ['category-id-1', 'category-id-2', ...] }
 * NOTE: This must be defined BEFORE the /:id routes to prevent route matching conflicts
 */
router.patch(
  '/reorder',
  verifyJWT,
  requireAdmin,
  requirePermission('manage_categories'),
  [
    body('ids')
      .isArray()
      .withMessage('ids must be an array of category IDs'),
    body('ids.*')
      .isUUID()
      .withMessage('Each id must be a valid UUID')
  ],
  asyncHandler(async (req, res) => {
    // Check validation errors
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors.array()
      });
    }

    const { ids } = req.body;

    console.log(`🔄 Reordering ${ids.length} categories`);

    const result = await categoryService.updateCategoryOrder(ids);

    res.json({
      success: true,
      message: 'Category order updated successfully',
      data: result
    });
  })
);

/**
 * PATCH /api/categories/:id/archive
 * Archive category (soft delete)
 * Admin endpoint - requires JWT and admin permission
 */
router.patch(
  '/:id/archive',
  verifyJWT,
  requireAdmin,
  requirePermission('manage_categories'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    console.log(`🗂️ Archiving category: ${id}`);

    // Get product count before archiving
    const { total: productCount } = await categoryService.getProductsByCategory(id);

    const archived = await categoryService.archiveCategory(id);

    res.json({
      success: true,
      message: 'Category archived successfully',
      data: archived,
      warning: productCount > 0 ? `${productCount} products are assigned to this category` : null
    });
  })
);

/**
 * DELETE /api/categories/:id
 * Delete category (hard delete)
 * Admin endpoint - requires JWT and admin permission
 * Query params:
 *   - reassign_to: Category ID to reassign products to
 *   - delete_orphans: If true, delete products with no new category
 * Validation: Either reassign_to OR delete_orphans must be specified if products exist, but NOT both
 */
router.delete(
  '/:id',
  verifyJWT,
  requireAdmin,
  requirePermission('manage_categories'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reassign_to, delete_orphans } = req.query;

    console.log(`🗑️ Deleting category: ${id}`);

    // Validate that both reassign_to and delete_orphans are not specified together
    if (reassign_to && delete_orphans === 'true') {
      return res.status(400).json({
        success: false,
        error: 'Invalid delete parameters',
        message: 'Cannot specify both reassign_to and delete_orphans. Choose one action: reassign products OR delete them.',
        details: 'reassign_to and delete_orphans are mutually exclusive'
      });
    }

    // Get category info for response
    const category = await categoryService.getCategoryById(id);
    const { total: productCount } = await categoryService.getProductsByCategory(id);

    // Validate delete request
    if (productCount > 0 && !reassign_to && delete_orphans !== 'true') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category with assigned products',
        message: `Category has ${productCount} products assigned. Either reassign them or enable delete_orphans.`,
        products_affected: productCount,
        action_required: 'Please specify reassign_to category or set delete_orphans=true'
      });
    }

    const result = await categoryService.deleteCategory(id, {
      reassignToCategoryId: reassign_to,
      deleteOrphans: delete_orphans === 'true'
    });

    res.json({
      success: true,
      message: 'Category deleted successfully',
      data: result
    });
  })
);

export default router;
