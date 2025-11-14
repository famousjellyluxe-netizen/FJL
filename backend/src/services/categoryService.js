/**
 * Category Service
 * Handles all business logic for product categories
 * Manages CRUD operations, validation, and product associations
 */

import { supabase } from '../config/database.js';
import { NotFoundError, AppError } from '../middleware/errorHandler.js';

/**
 * Generate URL-friendly slug from category name
 * @param {string} name - Category name
 * @returns {string} URL-friendly slug
 */
export function generateSlug(name) {
  if (!name || typeof name !== 'string') return '';

  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Validate category name
 * @param {string} name - Category name
 * @throws {AppError}
 */
function validateCategoryName(name) {
  if (!name || typeof name !== 'string') {
    throw new AppError('Category name is required and must be a string');
  }

  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 100) {
    throw new AppError('Category name must be between 1 and 100 characters');
  }

  return trimmed;
}

/**
 * Validate category slug
 * @param {string} slug - Category slug
 * @throws {AppError}
 */
function validateCategorySlug(slug) {
  if (!slug || typeof slug !== 'string') {
    throw new AppError('Category slug is required and must be a string');
  }

  const trimmed = slug.trim();
  if (trimmed.length < 1 || trimmed.length > 100) {
    throw new AppError('Category slug must be between 1 and 100 characters');
  }

  // Check slug format: lowercase alphanumeric and hyphens only
  if (!/^[a-z0-9-]+$/.test(trimmed)) {
    throw new AppError('Category slug must contain only lowercase letters, numbers, and hyphens');
  }

  return trimmed;
}

/**
 * Transform category data - normalize product count from array to number
 * Supabase aggregations return arrays, but we want simple number format
 * @param {object|array} data - Category data from database
 * @returns {object|array} Transformed data with product_count as number
 */
function normalizeProductCount(data) {
  if (Array.isArray(data)) {
    return data.map(item => normalizeProductCount(item));
  }

  if (!data || typeof data !== 'object') return data;

  return {
    ...data,
    product_count: data.product_count && Array.isArray(data.product_count)
      ? (data.product_count[0]?.count || 0)
      : (data.product_count || 0)
  };
}

/**
 * Get all active categories with optional filters and pagination
 * @param {object} options - Query options
 * @param {boolean} options.includeArchived - Include archived categories
 * @param {string} options.sortBy - Sort field: 'name', 'sort_order', 'created_at'
 * @param {string} options.order - Sort direction: 'asc', 'desc'
 * @param {number} options.limit - Max number of results (default: 100, max: 1000)
 * @param {number} options.offset - Number of results to skip (default: 0)
 * @returns {Promise<object>} Object with data array, total count, and pagination info
 */
export async function getAllCategories(options = {}) {
  try {
    const {
      includeArchived = false,
      sortBy = 'sort_order',
      order = 'asc',
      limit = 100,
      offset = 0
    } = options;

    // Validate and sanitize pagination params
    const validLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 1000);
    const validOffset = Math.max(parseInt(offset) || 0, 0);

    let query = supabase
      .from('categories')
      .select('*, product_count:products(count)', { count: 'exact' });

    // Filter active/inactive
    if (!includeArchived) {
      query = query.eq('is_active', true);
    }

    // Sort
    const validSortFields = ['name', 'sort_order', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'sort_order';
    const sortOrder = order.toLowerCase() === 'desc' ? 'desc' : 'asc';

    // Apply pagination and sorting
    const { data, error, count } = await query
      .order(sortField, { ascending: sortOrder === 'asc' })
      .range(validOffset, validOffset + validLimit - 1);

    if (error) {
      console.error('Error fetching categories:', error);
      throw new AppError('Failed to fetch categories', 500);
    }

    // Normalize product counts from array to number format
    const normalizedData = normalizeProductCount(data) || [];

    return {
      data: normalizedData,
      total: count || 0,
      limit: validLimit,
      offset: validOffset,
      page: Math.floor(validOffset / validLimit) + 1,
      pages: Math.ceil((count || 0) / validLimit)
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in getAllCategories:', error);
    throw new AppError('Failed to fetch categories', 500);
  }
}

/**
 * Get single category by ID
 * @param {string} id - Category ID (UUID)
 * @returns {Promise<object>} Category with product count
 */
export async function getCategoryById(id) {
  try {
    if (!id) {
      throw new AppError('Category ID is required');
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*, product_count:products(count)')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundError('Category');
    }

    // Normalize product count from array to number format
    return normalizeProductCount(data);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AppError) throw error;
    console.error('Error fetching category by ID:', error);
    throw new AppError('Failed to fetch category', 500);
  }
}

/**
 * Get category by slug
 * @param {string} slug - Category slug
 * @returns {Promise<object>} Category object
 */
export async function getCategoryBySlug(slug) {
  try {
    if (!slug) {
      throw new AppError('Category slug is required');
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new NotFoundError('Category');
    }

    return data;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AppError) throw error;
    console.error('Error fetching category by slug:', error);
    throw new AppError('Failed to fetch category', 500);
  }
}

/**
 * Create new category
 * @param {object} data - Category data
 * @param {string} data.name - Category name (required)
 * @param {string} data.slug - Category slug (optional, auto-generated from name)
 * @param {string} data.description - Category description
 * @param {string} data.image_url - Category image URL
 * @returns {Promise<object>} Created category
 */
export async function createCategory(data) {
  try {
    // Validate required fields
    const name = validateCategoryName(data.name);

    // Generate or validate slug
    let slug = data.slug || generateSlug(name);
    slug = validateCategorySlug(slug);

    // Prepare insert data
    const insertData = {
      name,
      slug,
      is_active: true,
      sort_order: data.sort_order || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Optional fields
    if (data.description) insertData.description = String(data.description).substring(0, 1000);
    if (data.image_url) insertData.image_url = String(data.image_url);

    // Insert - Rely on database UNIQUE constraint for slug validation
    // This avoids race condition that could occur with check-then-insert pattern
    const { data: created, error } = await supabase
      .from('categories')
      .insert([insertData])
      .select()
      .single();

    // Handle database-level constraint violations
    if (error) {
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        // Unique constraint violation (PostgreSQL error code 23505)
        throw new AppError(`Category with slug "${slug}" already exists`, 409);
      }
      console.error('Error creating category:', error);
      throw new AppError('Failed to create category', 500);
    }

    if (!created) {
      throw new AppError('Failed to create category', 500);
    }

    console.log(`✓ Created category: ${created.name} (${created.slug})`);

    // Normalize product count in response
    return normalizeProductCount(created);
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in createCategory:', error);
    throw new AppError('Failed to create category', 500);
  }
}

/**
 * Update category
 * @param {string} id - Category ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated category
 */
export async function updateCategory(id, updates) {
  try {
    if (!id) {
      throw new AppError('Category ID is required');
    }

    // Verify category exists
    const existing = await getCategoryById(id);

    // Prepare update data
    const updateData = {
      updated_at: new Date()
    };

    if (updates.name !== undefined) {
      updateData.name = validateCategoryName(updates.name);
    }

    if (updates.slug !== undefined) {
      updateData.slug = validateCategorySlug(updates.slug);

      // Check for slug uniqueness (if changed)
      if (updateData.slug !== existing.slug) {
        const { data: slugExists } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', updateData.slug)
          .neq('id', id)
          .limit(1);

        if (slugExists && slugExists.length > 0) {
          throw new AppError(`Category with slug "${updateData.slug}" already exists`);
        }
      }
    }

    if (updates.description !== undefined) {
      updateData.description = updates.description ? String(updates.description).substring(0, 1000) : null;
    }

    if (updates.image_url !== undefined) {
      updateData.image_url = updates.image_url ? String(updates.image_url) : null;
    }

    if (updates.sort_order !== undefined && typeof updates.sort_order === 'number') {
      updateData.sort_order = updates.sort_order;
    }

    if (updates.is_active !== undefined && typeof updates.is_active === 'boolean') {
      updateData.is_active = updates.is_active;
    }

    // Update
    const { data: updated, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !updated) {
      console.error('Error updating category:', error);
      throw new AppError('Failed to update category', 500);
    }

    console.log(`✓ Updated category: ${updated.name}`);
    return updated;
  } catch (error) {
    if (error instanceof AppError || error instanceof NotFoundError || error instanceof AppError) throw error;
    console.error('Error in updateCategory:', error);
    throw new AppError('Failed to update category', 500);
  }
}

/**
 * Archive category (soft delete - sets is_active=false)
 * @param {string} id - Category ID
 * @returns {Promise<object>} Archived category with product count
 */
export async function archiveCategory(id) {
  try {
    if (!id) {
      throw new AppError('Category ID is required');
    }

    // Get category with product count
    const category = await getCategoryById(id);

    // Archive the category
    const { data: archived, error } = await supabase
      .from('categories')
      .update({
        is_active: false,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !archived) {
      console.error('Error archiving category:', error);
      throw new AppError('Failed to archive category', 500);
    }

    console.log(`✓ Archived category: ${archived.name}`);
    return archived;
  } catch (error) {
    if (error instanceof AppError || error instanceof NotFoundError || error instanceof AppError) throw error;
    console.error('Error in archiveCategory:', error);
    throw new AppError('Failed to archive category', 500);
  }
}

/**
 * Get products assigned to category
 * @param {string} categoryId - Category ID
 * @param {object} options - Query options
 * @returns {Promise<array>} Products in category
 */
export async function getProductsByCategory(categoryId, options = {}) {
  try {
    if (!categoryId) {
      throw new AppError('Category ID is required');
    }

    const { limit = 100, offset = 0 } = options;

    const { data, error, count } = await supabase
      .from('products')
      .select('id, name, sku, price, image_url, total_stock, is_active, created_at', { count: 'exact' })
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .range(offset, offset + limit - 1)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching products by category:', error);
      throw new AppError('Failed to fetch products', 500);
    }

    return {
      products: data || [],
      total: count || 0
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in getProductsByCategory:', error);
    throw new AppError('Failed to fetch products', 500);
  }
}

/**
 * Delete category and optionally reassign products to another category
 * NOTE: Supabase JS client doesn't support ACID transactions natively.
 * This function performs operations sequentially with error handling.
 * If reassignment or deletion fails, the category will not be deleted.
 *
 * @param {string} id - Category ID to delete
 * @param {object} options - Delete options
 * @param {string} options.reassignToCategoryId - Category ID to reassign products to
 * @param {boolean} options.deleteOrphans - Whether to delete products (if no reassign category)
 * @returns {Promise<object>} Deletion result with counts
 */
export async function deleteCategory(id, options = {}) {
  try {
    if (!id) {
      throw new AppError('Category ID is required');
    }

    // Get category with product count
    const category = await getCategoryById(id);

    // Get products in this category
    const { data: products, error: getError } = await supabase
      .from('products')
      .select('id')
      .eq('category_id', id);

    if (getError) {
      console.error('Error fetching products:', getError);
      throw new AppError('Failed to fetch products for deletion', 500);
    }

    const productCount = (products || []).length;

    // If products exist and no reassignment
    if (productCount > 0 && !options.reassignToCategoryId && !options.deleteOrphans) {
      throw new AppError(
        `Cannot delete category with ${productCount} assigned products. Either reassign products or enable deleteOrphans.`,
        400
      );
    }

    // Perform product handling operations BEFORE deleting the category
    // This ensures that if product operations fail, the category won't be deleted

    // Reassign products if specified
    if (options.reassignToCategoryId && productCount > 0) {
      // Verify target category exists
      const targetCategory = await getCategoryById(options.reassignToCategoryId);
      if (!targetCategory) {
        throw new AppError('Target category for reassignment does not exist');
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({
          category_id: options.reassignToCategoryId,
          updated_at: new Date().toISOString()
        })
        .eq('category_id', id);

      if (updateError) {
        console.error('Error reassigning products:', updateError);
        throw new AppError('Failed to reassign products', 500);
      }

      console.log(`✓ Reassigned ${productCount} products to category: ${targetCategory.name}`);
    }

    // Delete products if requested and no reassignment happened
    if (options.deleteOrphans && productCount > 0 && !options.reassignToCategoryId) {
      const { error: deleteProductsError } = await supabase
        .from('products')
        .delete()
        .eq('category_id', id);

      if (deleteProductsError) {
        console.error('Error deleting products:', deleteProductsError);
        throw new AppError('Failed to delete products', 500);
      }

      console.log(`✓ Deleted ${productCount} products`);
    }

    // Finally, delete the category (only if product operations succeeded)
    const { error: deleteCategoryError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (deleteCategoryError) {
      console.error('Error deleting category:', deleteCategoryError);
      throw new AppError('Failed to delete category', 500);
    }

    console.log(`✓ Deleted category: ${category.name}`);

    return {
      success: true,
      deleted_category: category.name,
      products_affected: productCount,
      action_taken: options.reassignToCategoryId ? 'reassigned' : (options.deleteOrphans ? 'deleted' : 'none')
    };
  } catch (error) {
    if (error instanceof AppError || error instanceof NotFoundError) throw error;
    console.error('Error in deleteCategory:', error);
    throw new AppError('Failed to delete category', 500);
  }
}

/**
 * Update category sort order
 * @param {array} categoryIds - Array of category IDs in desired order
 * @returns {Promise<object>} Update result
 */
export async function updateCategoryOrder(categoryIds) {
  try {
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      throw new AppError('Category IDs array is required');
    }

    // Create a mapping of category IDs to their new sort order
    const categoryOrderMap = Object.fromEntries(
      categoryIds.map((id, index) => [id, index])
    );

    // Get all categories to update
    const { data: categoriesToUpdate, error: fetchError } = await supabase
      .from('categories')
      .select('id')
      .in('id', categoryIds);

    if (fetchError) {
      console.error('Error fetching categories for reordering:', fetchError);
      throw new AppError('Failed to fetch categories for reordering', 500);
    }

    if (!categoriesToUpdate || categoriesToUpdate.length === 0) {
      throw new AppError('No categories found to update', 404);
    }

    // Batch update all categories in a single operation
    // Note: Since Supabase doesn't support true batch updates with conditional values,
    // we perform individual updates but in parallel to minimize latency
    const updatePromises = categoryIds.map(id =>
      supabase
        .from('categories')
        .update({
          sort_order: categoryOrderMap[id],
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
    );

    const updateResults = await Promise.all(updatePromises);

    // Check for any errors in the batch update
    const failedUpdates = updateResults.filter(result => result.error);
    if (failedUpdates.length > 0) {
      console.error('Errors during category reordering:', failedUpdates);
      throw new AppError('Failed to update one or more categories', 500);
    }

    console.log(`✓ Updated sort order for ${categoryIds.length} categories`);
    return { success: true, categories_updated: categoryIds.length };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in updateCategoryOrder:', error);
    throw new AppError('Failed to update category order', 500);
  }
}

export default {
  generateSlug,
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  archiveCategory,
  getProductsByCategory,
  deleteCategory,
  updateCategoryOrder
};
