/**
 * Product Variation Service
 * Manages product colors and sizes with normalized database structure
 * Allows efficient filtering and querying by color/size
 */

import { supabase } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Add a color to a product
 * @param {string} productId - Product ID
 * @param {string} color - Color name
 * @returns {Promise<object>} Created color record
 */
export async function addProductColor(productId, color) {
  try {
    if (!productId || !color) {
      throw new AppError('Product ID and color are required');
    }

    const { data, error } = await supabase
      .from('product_colors')
      .insert([{
        product_id: productId,
        color: String(color).trim()
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation - color already exists for this product
        throw new AppError(`Color "${color}" already exists for this product`, 409);
      }
      throw error;
    }

    console.log(`✓ Added color "${color}" to product ${productId}`);
    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error adding product color:', error);
    throw new AppError('Failed to add product color', 500);
  }
}

/**
 * Remove a color from a product
 * @param {string} productId - Product ID
 * @param {string} color - Color to remove
 * @returns {Promise<boolean>} Success status
 */
export async function removeProductColor(productId, color) {
  try {
    if (!productId || !color) {
      throw new AppError('Product ID and color are required');
    }

    const { error } = await supabase
      .from('product_colors')
      .delete()
      .eq('product_id', productId)
      .eq('color', String(color).trim());

    if (error) throw error;

    console.log(`✓ Removed color "${color}" from product ${productId}`);
    return true;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error removing product color:', error);
    throw new AppError('Failed to remove product color', 500);
  }
}

/**
 * Get all colors for a product
 * @param {string} productId - Product ID
 * @returns {Promise<array>} Array of colors
 */
export async function getProductColors(productId) {
  try {
    if (!productId) {
      throw new AppError('Product ID is required');
    }

    const { data, error } = await supabase
      .from('product_colors')
      .select('color')
      .eq('product_id', productId)
      .order('color');

    if (error) throw error;

    return (data || []).map(item => item.color);
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error fetching product colors:', error);
    throw new AppError('Failed to fetch product colors', 500);
  }
}

/**
 * Add a size to a product
 * @param {string} productId - Product ID
 * @param {string} size - Size name
 * @returns {Promise<object>} Created size record
 */
export async function addProductSize(productId, size) {
  try {
    if (!productId || !size) {
      throw new AppError('Product ID and size are required');
    }

    const { data, error } = await supabase
      .from('product_sizes')
      .insert([{
        product_id: productId,
        size: String(size).trim().toUpperCase()
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError(`Size "${size}" already exists for this product`, 409);
      }
      throw error;
    }

    console.log(`✓ Added size "${size}" to product ${productId}`);
    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error adding product size:', error);
    throw new AppError('Failed to add product size', 500);
  }
}

/**
 * Remove a size from a product
 * @param {string} productId - Product ID
 * @param {string} size - Size to remove
 * @returns {Promise<boolean>} Success status
 */
export async function removeProductSize(productId, size) {
  try {
    if (!productId || !size) {
      throw new AppError('Product ID and size are required');
    }

    const { error } = await supabase
      .from('product_sizes')
      .delete()
      .eq('product_id', productId)
      .eq('size', String(size).trim().toUpperCase());

    if (error) throw error;

    console.log(`✓ Removed size "${size}" from product ${productId}`);
    return true;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error removing product size:', error);
    throw new AppError('Failed to remove product size', 500);
  }
}

/**
 * Get all sizes for a product
 * @param {string} productId - Product ID
 * @returns {Promise<array>} Array of sizes
 */
export async function getProductSizes(productId) {
  try {
    if (!productId) {
      throw new AppError('Product ID is required');
    }

    const { data, error } = await supabase
      .from('product_sizes')
      .select('size')
      .eq('product_id', productId)
      .order('size');

    if (error) throw error;

    return (data || []).map(item => item.size);
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error fetching product sizes:', error);
    throw new AppError('Failed to fetch product sizes', 500);
  }
}

/**
 * Set colors for a product (replaces all existing colors)
 * @param {string} productId - Product ID
 * @param {array} colors - Array of color names
 * @returns {Promise<array>} Updated colors
 */
export async function setProductColors(productId, colors) {
  try {
    if (!productId || !Array.isArray(colors)) {
      throw new AppError('Product ID and colors array are required');
    }

    // Delete existing colors
    const { error: deleteError } = await supabase
      .from('product_colors')
      .delete()
      .eq('product_id', productId);

    if (deleteError) throw deleteError;

    // Insert new colors
    if (colors.length > 0) {
      const colorRecords = colors.map(color => ({
        product_id: productId,
        color: String(color).trim()
      }));

      const { data, error: insertError } = await supabase
        .from('product_colors')
        .insert(colorRecords)
        .select();

      if (insertError) throw insertError;

      console.log(`✓ Set ${colors.length} colors for product ${productId}`);
      return (data || []).map(item => item.color);
    }

    return [];
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error setting product colors:', error);
    throw new AppError('Failed to set product colors', 500);
  }
}

/**
 * Set sizes for a product (replaces all existing sizes)
 * @param {string} productId - Product ID
 * @param {array} sizes - Array of size names
 * @returns {Promise<array>} Updated sizes
 */
export async function setProductSizes(productId, sizes) {
  try {
    if (!productId || !Array.isArray(sizes)) {
      throw new AppError('Product ID and sizes array are required');
    }

    // Delete existing sizes
    const { error: deleteError } = await supabase
      .from('product_sizes')
      .delete()
      .eq('product_id', productId);

    if (deleteError) throw deleteError;

    // Insert new sizes
    if (sizes.length > 0) {
      const sizeRecords = sizes.map(size => ({
        product_id: productId,
        size: String(size).trim().toUpperCase()
      }));

      const { data, error: insertError } = await supabase
        .from('product_sizes')
        .insert(sizeRecords)
        .select();

      if (insertError) throw insertError;

      console.log(`✓ Set ${sizes.length} sizes for product ${productId}`);
      return (data || []).map(item => item.size);
    }

    return [];
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error setting product sizes:', error);
    throw new AppError('Failed to set product sizes', 500);
  }
}

/**
 * Find all products with a specific color
 * @param {string} color - Color to search for
 * @param {object} options - Query options
 * @returns {Promise<array>} Array of product IDs
 */
export async function findProductsByColor(color, options = {}) {
  try {
    if (!color) {
      throw new AppError('Color is required');
    }

    const { limit = 100, offset = 0 } = options;

    const { data, error, count } = await supabase
      .from('product_colors')
      .select('product_id', { count: 'exact' })
      .eq('color', String(color).trim())
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      product_ids: (data || []).map(item => item.product_id),
      total: count || 0
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error finding products by color:', error);
    throw new AppError('Failed to find products by color', 500);
  }
}

/**
 * Find all products with a specific size
 * @param {string} size - Size to search for
 * @param {object} options - Query options
 * @returns {Promise<array>} Array of product IDs
 */
export async function findProductsBySize(size, options = {}) {
  try {
    if (!size) {
      throw new AppError('Size is required');
    }

    const { limit = 100, offset = 0 } = options;

    const { data, error, count } = await supabase
      .from('product_sizes')
      .select('product_id', { count: 'exact' })
      .eq('size', String(size).trim().toUpperCase())
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      product_ids: (data || []).map(item => item.product_id),
      total: count || 0
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error finding products by size:', error);
    throw new AppError('Failed to find products by size', 500);
  }
}

export default {
  addProductColor,
  removeProductColor,
  getProductColors,
  addProductSize,
  removeProductSize,
  getProductSizes,
  setProductColors,
  setProductSizes,
  findProductsByColor,
  findProductsBySize
};
