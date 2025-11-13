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
 * Get all active categories with optional filters
 * @param {object} options - Query options
 * @param {boolean} options.includeArchived - Include archived categories
 * @param {string} options.sortBy - Sort field: 'name', 'sort_order', 'created_at'
 * @param {string} options.order - Sort direction: 'asc', 'desc'
 * @returns {Promise<array>} Categories array
 */
export async function getAllCategories(options = {}) {
  try {
    const {
      includeArchived = false,
      sortBy = 'sort_order',
      order = 'asc'
    } = options;

    let query = supabase
      .from('categories')
      .select('*, product_count:products(count)');

    // Filter active/inactive
    if (!includeArchived) {
      query = query.eq('is_active', true);
    }

    // Sort
    const validSortFields = ['name', 'sort_order', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'sort_order';
    const sortOrder = order.toLowerCase() === 'desc' ? 'desc' : 'asc';

    const { data, error } = await query.order(sortField, { ascending: sortOrder === 'asc' });

    if (error) {
      console.error('Error fetching categories:', error);
      throw new AppError('Failed to fetch categories', 500);
    }

    return data || [];
  } catch (error) {
    if (error instanceof AppError || error instanceof AppError) throw error;
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

    return data;
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

    // Check for slug uniqueness
    const { data: existing, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .limit(1);

    if (checkError) {
      console.error('Error checking slug uniqueness:', checkError);
      throw new AppError('Failed to validate slug uniqueness', 500);
    }

    if (existing && existing.length > 0) {
      throw new AppError(`Category with slug "${slug}" already exists`);
    }

    // Prepare insert data
    const insertData = {
      name,
      slug,
      is_active: true,
      sort_order: data.sort_order || 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Optional fields
    if (data.description) insertData.description = String(data.description).substring(0, 1000);
    if (data.image_url) insertData.image_url = String(data.image_url);

    // Insert
    const { data: created, error } = await supabase
      .from('categories')
      .insert([insertData])
      .select()
      .single();

    if (error || !created) {
      console.error('Error creating category:', error);
      throw new AppError('Failed to create category', 500);
    }

    console.log(`✓ Created category: ${created.name} (${created.slug})`);
    return created;
  } catch (error) {
    if (error instanceof AppError || error instanceof AppError) throw error;
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
    if (error instanceof AppError || error instanceof AppError) throw error;
    console.error('Error in getProductsByCategory:', error);
    throw new AppError('Failed to fetch products', 500);
  }
}

/**
 * Delete category and optionally reassign products to another category
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

    // Reassign products if specified
    if (options.reassignToCategoryId && productCount > 0) {
      // Verify target category exists
      const targetCategory = await getCategoryById(options.reassignToCategoryId);
      if (!targetCategory) {
        throw new AppError('Target category for reassignment does not exist');
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({ category_id: options.reassignToCategoryId, updated_at: new Date() })
        .eq('category_id', id);

      if (updateError) {
        console.error('Error reassigning products:', updateError);
        throw new AppError('Failed to reassign products', 500);
      }

      console.log(`✓ Reassigned ${productCount} products to category: ${targetCategory.name}`);
    }

    // Delete products if requested and no reassignment happened
    if (options.deleteOrphans && productCount > 0 && !options.reassignToCategoryId) {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('category_id', id);

      if (deleteError) {
        console.error('Error deleting products:', deleteError);
        throw new AppError('Failed to delete products', 500);
      }

      console.log(`✓ Deleted ${productCount} products`);
    }

    // Delete category
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting category:', deleteError);
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
    if (error instanceof AppError || error instanceof NotFoundError || error instanceof AppError) throw error;
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

    // Update sort_order for each category
    const updates = categoryIds.map((id, index) => ({
      id,
      sort_order: index,
      updated_at: new Date()
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('categories')
        .update({ sort_order: update.sort_order, updated_at: update.updated_at })
        .eq('id', update.id);

      if (error) {
        console.error(`Error updating sort order for category ${update.id}:`, error);
        throw new AppError('Failed to update category order', 500);
      }
    }

    console.log(`✓ Updated sort order for ${updates.length} categories`);
    return { success: true, categories_updated: updates.length };
  } catch (error) {
    if (error instanceof AppError || error instanceof AppError) throw error;
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
