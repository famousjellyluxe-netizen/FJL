import { supabase, supabaseService } from '../config/database.js';
import { AppError, NotFoundError } from '../middleware/errorHandler.js';

// Storage configuration
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'product-images';
const STORAGE_URL = process.env.SUPABASE_STORAGE_URL ||
  'https://youkrpmiaebulbbktpvu.supabase.co/storage/v1/object/public/product-images/';

/**
 * Upload image to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Original filename
 * @param {string} mimetype - File mime type
 * @returns {Promise<string>} - Public URL of uploaded image
 */
export async function uploadProductImage(fileBuffer, filename, mimetype) {
  try {
    if (!supabaseService) {
      throw new AppError('Storage service not configured', 503);
    }

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (fileBuffer.length > maxSize) {
      throw new AppError('File size exceeds 5MB limit', 400);
    }

    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(mimetype)) {
      throw new AppError('Invalid file type. Only JPG, PNG, WebP allowed', 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const extension = filename.split('.').pop();
    const storagePath = `products/${timestamp}-${randomStr}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseService.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: mimetype,
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new AppError('Failed to upload image', 500);
    }

    // Return public URL
    const publicUrl = `${STORAGE_URL}${storagePath}`;
    return publicUrl;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error uploading product image:', error);
    throw new AppError('Image upload failed', 500);
  }
}

/**
 * Delete image from Supabase Storage
 * @param {string} imageUrl - Public URL of image
 * @returns {Promise<boolean>}
 */
export async function deleteProductImage(imageUrl) {
  try {
    if (!supabaseService || !imageUrl) return true;

    // Extract storage path from URL
    const storagePath = imageUrl.replace(STORAGE_URL, '');

    const { error } = await supabaseService.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

    if (error) {
      console.warn('Failed to delete image from storage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Error deleting product image:', error);
    return false;
  }
}

/**
 * Validate image file
 * @param {Object} file - File object with buffer, originalname, mimetype
 * @returns {Promise<boolean>}
 */
export function validateProductImage(file) {
  if (!file) {
    return false;
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return false;
  }

  const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validMimes.includes(file.mimetype)) {
    return false;
  }

  return true;
}

/**
 * Get all products with optional filtering
 */
export async function getAllProducts(filters = {}) {
  try {
    let query = supabase
      .from('products')
      .select('*, categories(name, slug)');

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Sorting
    const sortField = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order === 'asc' ? true : false;
    query = query.order(sortField, { ascending: sortOrder });

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

/**
 * Get single product by ID with variants
 */
export async function getProductById(id) {
  try {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('id', id)
      .single();

    if (productError || !product) {
      throw new NotFoundError('Product');
    }

    // Get variants/inventory
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', id);

    if (variantsError) throw variantsError;

    return {
      ...product,
      variants: variants || []
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error('Error fetching product:', error);
    throw error;
  }
}

/**
 * Create new product
 */
export async function createProduct(productData) {
  try {
    const { data, error } = await supabaseService
      .from('products')
      .insert([{
        sku: productData.sku,
        name: productData.name,
        description: productData.description,
        category_id: productData.category_id,
        price: productData.price,
        original_price: productData.original_price,
        image_url: productData.image_url,
        images: productData.images || [],
        total_stock: productData.total_stock || 0,
        is_active: productData.is_active !== false,
        sleeve_type: productData.sleeve_type,
        available_colors: productData.available_colors || [],
        available_sizes: productData.available_sizes || []
      }])
      .select();

    if (error) throw error;

    return data?.[0];
  } catch (error) {
    console.error('Error creating product:', error);
    if (error.code === '23505') {
      throw new AppError('SKU already exists', 409);
    }
    throw error;
  }
}

/**
 * Update product
 */
export async function updateProduct(id, updateData) {
  try {
    const { data, error } = await supabaseService
      .from('products')
      .update({
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.price && { price: updateData.price }),
        ...(updateData.original_price !== undefined && { original_price: updateData.original_price }),
        ...(updateData.image_url && { image_url: updateData.image_url }),
        ...(updateData.images && { images: updateData.images }),
        ...(updateData.is_active !== undefined && { is_active: updateData.is_active }),
        ...(updateData.sleeve_type && { sleeve_type: updateData.sleeve_type }),
        ...(updateData.available_colors && { available_colors: updateData.available_colors }),
        ...(updateData.available_sizes && { available_sizes: updateData.available_sizes }),
        updated_at: new Date()
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data?.[0]) {
      throw new NotFoundError('Product');
    }

    return data[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error('Error updating product:', error);
    throw error;
  }
}

/**
 * Soft delete product (mark as inactive)
 */
export async function deleteProduct(id) {
  try {
    const { data, error } = await supabaseService
      .from('products')
      .update({ is_active: false, updated_at: new Date() })
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data?.[0]) {
      throw new NotFoundError('Product');
    }

    return data[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error('Error deleting product:', error);
    throw error;
  }
}

/**
 * Get product inventory/variants
 */
export async function getProductInventory(productId) {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .order('size', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching inventory:', error);
    throw error;
  }
}

/**
 * Check product stock availability
 */
export async function checkStockAvailability(productId, size, color = null) {
  try {
    let query = supabase
      .from('product_variants')
      .select('stock_quantity')
      .eq('product_id', productId)
      .eq('size', size);

    if (color) {
      query = query.eq('color', color);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return { available: false, quantity: 0 };
    }

    return {
      available: data.stock_quantity > 0,
      quantity: data.stock_quantity
    };
  } catch (error) {
    console.error('Error checking stock:', error);
    throw error;
  }
}

/**
 * Update product variant stock
 */
export async function updateVariantStock(variantId, newQuantity) {
  try {
    const { data, error } = await supabaseService
      .from('product_variants')
      .update({
        stock_quantity: newQuantity,
        updated_at: new Date()
      })
      .eq('id', variantId)
      .select();

    if (error) throw error;
    if (!data?.[0]) {
      throw new NotFoundError('Variant');
    }

    return data[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error('Error updating variant stock:', error);
    throw error;
  }
}

/**
 * Reduce stock after order
 */
export async function reduceStock(variantId, quantity) {
  try {
    // Get current stock
    const { data: variant, error: getError } = await supabase
      .from('product_variants')
      .select('stock_quantity')
      .eq('id', variantId)
      .single();

    if (getError || !variant) {
      throw new NotFoundError('Variant');
    }

    const newQuantity = variant.stock_quantity - quantity;

    if (newQuantity < 0) {
      throw new AppError('Insufficient stock', 400);
    }

    return updateVariantStock(variantId, newQuantity);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AppError) throw error;
    console.error('Error reducing stock:', error);
    throw error;
  }
}

/**
 * Create product variant
 */
export async function createVariant(productId, variantData) {
  try {
    // Build variant object with only provided fields to avoid schema conflicts
    const variantToInsert = {
      product_id: productId,
      size: variantData.size,
      stock_quantity: variantData.stock_quantity || 0
    };

    // Only add optional fields if they're provided
    if (variantData.color) {
      variantToInsert.color = variantData.color;
    }
    if (variantData.variant_price) {
      variantToInsert.variant_price = variantData.variant_price;
    }
    if (variantData.reorder_level !== undefined) {
      variantToInsert.reorder_level = variantData.reorder_level;
    }

    const { data, error } = await supabaseService
      .from('product_variants')
      .insert([variantToInsert])
      .select();

    if (error) throw error;

    return data?.[0];
  } catch (error) {
    console.error('Error creating variant:', error);
    if (error.code === '23505') {
      throw new AppError('Variant already exists', 409);
    }
    throw error;
  }
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(limit = 6) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching featured products:', error);
    throw error;
  }
}

/**
 * Get low stock products (for admin)
 */
export async function getLowStockProducts() {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .select('*, products(name, sku)')
      .lte('stock_quantity', supabase.raw('reorder_level'))
      .order('stock_quantity', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    throw error;
  }
}

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductInventory,
  checkStockAvailability,
  updateVariantStock,
  reduceStock,
  createVariant,
  getFeaturedProducts,
  getLowStockProducts,
  uploadProductImage,
  deleteProductImage,
  validateProductImage
};
