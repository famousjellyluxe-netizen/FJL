import { supabase, supabaseService } from '../config/database.js';
import { AppError, NotFoundError } from '../middleware/errorHandler.js';
import * as stockUpdateService from './stockUpdateService.js';
import * as imageOptimizationService from './imageOptimizationService.js';
import cache from '../utils/cache.js';

// Storage configuration
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'product-images';
const STORAGE_URL = process.env.SUPABASE_STORAGE_URL ||
  'https://youkrpmiaebulbbktpvu.supabase.co/storage/v1/object/public/product-images/';

/**
 * Upload image to Supabase Storage with automatic optimization
 * Converts to WebP, compresses to <200KB, and generates responsive versions
 *
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Original filename
 * @param {string} mimetype - File mime type
 * @returns {Promise<Object>} - URLs for different image formats and sizes
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

    // Optimize image (convert to WebP, compress)
    console.log(`🖼️  Optimizing image: ${filename} (${Math.round(fileBuffer.length / 1024)}KB)`);
    const optimized = await imageOptimizationService.optimizeImage(fileBuffer, mimetype);

    // Generate unique base filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const baseFilename = `${timestamp}-${randomStr}`;
    const baseStoragePath = `products/${baseFilename}`;

    // Upload optimized WebP version (primary)
    const webpPath = `${baseStoragePath}.webp`;
    const { error: webpError } = await supabaseService.storage
      .from(STORAGE_BUCKET)
      .upload(webpPath, optimized.webp, {
        contentType: 'image/webp',
        upsert: false
      });

    if (webpError) {
      console.error('WebP upload error:', webpError);
      throw new AppError('Failed to upload optimized image', 500);
    }

    // Upload JPEG fallback version
    const jpegPath = `${baseStoragePath}.jpg`;
    const { error: jpegError } = await supabaseService.storage
      .from(STORAGE_BUCKET)
      .upload(jpegPath, optimized.jpeg, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (jpegError) {
      console.error('JPEG upload error:', jpegError);
      // Continue anyway, WebP is uploaded
    }

    console.log(`✅ Image optimization complete:`);
    console.log(`   Original: ${Math.round(optimized.originalSize / 1024)}KB (${optimized.format})`);
    console.log(`   WebP: ${Math.round(optimized.webpSize / 1024)}KB (Saved ${optimized.compressionRatio}%)`);
    console.log(`   JPEG: ${Math.round(optimized.jpegSize / 1024)}KB`);

    // Return URLs for both formats
    return {
      // Primary URL (WebP with JPEG fallback via picture element)
      primary: `${STORAGE_URL}${webpPath}`,
      // URLs for srcset
      webp: `${STORAGE_URL}${webpPath}`,
      jpeg: `${STORAGE_URL}${jpegPath}`,
      // Legacy - return primary URL for backward compatibility
      url: `${STORAGE_URL}${webpPath}`,
      // Optimization metadata
      optimization: {
        originalSize: optimized.originalSize,
        webpSize: optimized.webpSize,
        jpegSize: optimized.jpegSize,
        compressionRatio: optimized.compressionRatio
      }
    };
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
 * Get lightweight product list (minimal fields for list views)
 * Returns only essential fields: id, name, price, image_url, category
 * Dramatically reduces payload size (~10x smaller than full response)
 * @param {Object} filters - Filter object
 * @returns {Promise<Object>} Lightweight products with pagination
 */
export async function getLightweightProducts(filters = {}) {
  try {
    // Generate cache key
    const cacheKey = `products:light:${cache.constructor.generateProductListKey(filters)}`;

    // Check cache first (skip cache if search query)
    if (!filters.search && cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    let query = supabase
      .from('products')
      // Select ONLY essential fields - drastically reduces payload
      .select('id, name, price, image_url, category_id, categories(name, slug)');

    // Apply filters
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    } else {
      query = query.eq('is_active', true); // Default to active only
    }

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    // Sorting
    const sortField = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order === 'asc' ? true : false;
    query = query.order(sortField, { ascending: sortOrder });

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 12;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform to include category name at root level
    const products = (data || []).map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url,
      category: product.categories?.name || 'Uncategorized'
    }));

    const result = {
      data: products,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    };

    // Cache result (5 minutes) unless it's a search query
    if (!filters.search) {
      cache.set(cacheKey, result, 5 * 60 * 1000);
    }

    return result;
  } catch (error) {
    console.error('Error fetching lightweight products:', error);
    throw error;
  }
}

/**
 * Get all products with optional filtering
 * Implements caching for improved performance
 */
export async function getAllProducts(filters = {}) {
  try {
    // Generate cache key based on filters
    const cacheKey = cache.constructor.generateProductListKey(filters);

    // Check cache first (skip cache if search query to always get fresh results)
    if (!filters.search && cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    let query = supabase
      .from('products')
      .select('*, categories(name, slug), product_variants(*)');

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

    // Transform data to include variants array
    const products = (data || []).map(product => ({
      ...product,
      variants: Array.isArray(product.product_variants) ? product.product_variants : [],
      product_variants: undefined  // Remove the nested property
    }));

    const result = {
      data: products,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    };

    // Cache result (5 minutes) unless it's a search query
    if (!filters.search) {
      cache.set(cacheKey, result, 5 * 60 * 1000);
    }

    return result;
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

    // Extract unique sizes and colors from variants
    const sizes = new Set();
    const colors = new Set();

    if (variants && variants.length > 0) {
      variants.forEach(variant => {
        if (variant.size) sizes.add(variant.size);
        if (variant.color) colors.add(variant.color);
      });
    }

    return {
      ...product,
      variants: variants || [],
      // Include extracted sizes and colors for admin form compatibility
      available_sizes: Array.from(sizes),
      available_colors: Array.from(colors)
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error('Error fetching product:', error);
    throw error;
  }
}

/**
 * Create new product with variant stock distribution
 * Accepts:
 *   - distribution_mode: 'equal' (auto-distribute) or 'manual' (pre-assigned)
 *   - total_stock: total units to distribute
 *   - variant_stock: (manual mode only) { 'size-color': quantity }
 *   - available_sizes, available_colors: arrays for creating variants
 */
export async function createProduct(productData) {
  try {
    const {
      distribution_mode = 'equal',
      total_stock = 0,
      variant_stock = {},
      available_sizes = [],
      available_colors = []
    } = productData;

    // Validate inputs
    if (!productData.name) {
      throw new AppError('Product name is required', 400);
    }

    if (!productData.sku) {
      throw new AppError('Product SKU is required', 400);
    }

    if (total_stock < 0) {
      throw new AppError('Total stock cannot be negative', 400);
    }

    // Only manual distribution is supported
    if (distribution_mode && distribution_mode !== 'manual') {
      throw new AppError('Only manual stock distribution is supported', 400);
    }

    // Validate sizes and colors BEFORE creating product
    if (!available_sizes || available_sizes.length === 0) {
      throw new AppError('Product must have at least one size', 400);
    }

    if (!available_colors || available_colors.length === 0) {
      throw new AppError('Product must have at least one color', 400);
    }

    // Create product
    const { data: productArray, error: createError } = await supabaseService
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
        total_stock: 0, // Will be updated after variants are created
        is_active: productData.is_active !== false,
        // DEPRECATED: sleeve_type is deprecated. Use category_id instead. Keeping for backward compatibility.
        sleeve_type: productData.sleeve_type,
        available_colors: available_colors,
        available_sizes: available_sizes
      }])
      .select();

    if (createError) throw createError;

    const product = productArray?.[0];
    if (!product) {
      throw new AppError('Failed to create product', 500);
    }

    console.log(`✅ Created product: ${product.id}`);

    // Generate all variant combinations
    const variants = [];
    for (const size of available_sizes) {
      for (const color of available_colors) {
        const variantKey = `${color}-${size}`;
        variants.push({
          product_id: product.id,
          size,
          color,
          key: variantKey,
          stock_quantity: 0 // Will be set by distribution
        });
      }
    }

    if (variants.length === 0) {
      throw new AppError('Product must have at least one size and one color', 400);
    }

    console.log(`📦 Creating ${variants.length} variants for product ${product.id}`);

    // Manual distribution is required
    let assignedTotal = 0;
    const distributedVariants = variants.map(variant => {
      const assigned = variant_stock[variant.key] || 0;
      if (assigned < 0) {
        throw new AppError(`Stock for ${variant.key} cannot be negative`, 400);
      }
      assignedTotal += assigned;
      return {
        ...variant,
        stock_quantity: assigned
      };
    });

    if (assignedTotal !== total_stock) {
      throw new AppError(`Sum of variant stocks (${assignedTotal}) doesn't match total stock (${total_stock})`, 400);
    }

    console.log(`📊 Manual stock distribution validated: ${assignedTotal} units across ${variants.length} variants`);

    // Remove the 'key' field before inserting into database (it's only for internal tracking)
    const variantsToInsert = distributedVariants.map(({ key, ...rest }) => rest);

    // Create all variants
    const { data: createdVariants, error: variantError } = await supabaseService
      .from('product_variants')
      .insert(variantsToInsert)
      .select();

    if (variantError) {
      // Rollback: delete product if variant creation fails
      await supabaseService.from('products').delete().eq('id', product.id);
      throw new AppError(`Failed to create variants: ${variantError.message}`, 500);
    }

    console.log(`✅ Created ${createdVariants?.length || 0} variants`);

    // Update product total_stock to match sum of variants
    const { data: updatedProduct, error: updateError } = await supabaseService
      .from('products')
      .update({ total_stock })
      .eq('id', product.id)
      .select();

    if (updateError) throw updateError;

    console.log(`✅ Product created successfully with ${total_stock} total stock distributed across ${variants.length} variants`);

    // Invalidate related caches
    cache.clearAll(); // Clear all product caches since new product was created

    return updatedProduct?.[0];
  } catch (error) {
    console.error('Error creating product:', error);
    if (error instanceof AppError) throw error;
    if (error.code === '23505') {
      throw new AppError('SKU already exists', 409);
    }
    throw error;
  }
}

/**
 * Update product with optional stock redistribution
 * Handles:
 *   - Basic product fields (name, price, etc)
 *   - Variant changes (add/remove sizes or colors)
 *   - Stock redistribution (equal or manual)
 */
export async function updateProduct(id, updateData) {
  try {
    console.log('🔧 updateProduct called with:', { id, updateData });

    // Get current product to compare variants
    const { data: currentProduct, error: fetchError } = await supabaseService
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentProduct) {
      throw new NotFoundError('Product');
    }

    const {
      distribution_mode,
      total_stock,
      variant_stock = {},
      available_sizes = currentProduct.available_sizes || [],
      available_colors = currentProduct.available_colors || []
    } = updateData;

    // Update basic product fields
    const updateObject = {
      ...(updateData.name && { name: updateData.name }),
      ...(updateData.description !== undefined && { description: updateData.description }),
      ...(updateData.price && { price: updateData.price }),
      ...(updateData.original_price !== undefined && { original_price: updateData.original_price }),
      ...(updateData.image_url && { image_url: updateData.image_url }),
      ...(updateData.images && { images: updateData.images }),
      ...(updateData.is_active !== undefined && { is_active: updateData.is_active }),
      ...(updateData.is_featured !== undefined && { is_featured: updateData.is_featured }),
      ...(updateData.category_id !== undefined && { category_id: updateData.category_id }),
      // DEPRECATED: sleeve_type is deprecated. Use category_id instead. Keeping for backward compatibility.
      ...(updateData.sleeve_type && { sleeve_type: updateData.sleeve_type }),
      ...(available_sizes && { available_sizes }),
      ...(available_colors && { available_colors }),
      updated_at: new Date()
    };

    // Check if variants or stock distribution is being updated
    const isRedistributingStock = distribution_mode || total_stock !== undefined;

    if (isRedistributingStock) {
      console.log(`📊 Redistributing stock: mode=${distribution_mode}, total=${total_stock}`);

      // Delete old variants
      const { error: deleteError } = await supabaseService
        .from('product_variants')
        .delete()
        .eq('product_id', id);

      if (deleteError) {
        throw new AppError(`Failed to delete old variants: ${deleteError.message}`, 500);
      }

      // Generate new variant combinations
      const variants = [];
      for (const size of available_sizes) {
        for (const color of available_colors) {
          const variantKey = `${color}-${size}`;
          variants.push({
            product_id: id,
            size,
            color,
            key: variantKey,
            stock_quantity: 0
          });
        }
      }

      if (variants.length === 0) {
        throw new AppError('Product must have at least one size and one color', 400);
      }

      // Manual distribution is required
      const finalTotal = total_stock !== undefined ? total_stock : currentProduct.total_stock || 0;

      if (distribution_mode && distribution_mode !== 'manual') {
        throw new AppError('Only manual stock distribution is supported', 400);
      }

      let assignedTotal = 0;
      const distributedVariants = variants.map(variant => {
        const assigned = variant_stock[variant.key] || 0;
        if (assigned < 0) {
          throw new AppError(`Stock for ${variant.key} cannot be negative`, 400);
        }
        assignedTotal += assigned;
        return {
          ...variant,
          stock_quantity: assigned
        };
      });

      if (assignedTotal !== finalTotal) {
        throw new AppError(`Sum of variant stocks (${assignedTotal}) doesn't match total stock (${finalTotal})`, 400);
      }

      console.log(`📊 Manual stock distribution validated: ${assignedTotal} units`);

      // Remove the 'key' field before inserting into database (it's only for internal tracking)
      const variantsToInsert = distributedVariants.map(({ key, ...rest }) => rest);

      // Create new variants
      const { data: createdVariants, error: variantError } = await supabaseService
        .from('product_variants')
        .insert(variantsToInsert)
        .select();

      if (variantError) {
        throw new AppError(`Failed to create variants: ${variantError.message}`, 500);
      }

      console.log(`✅ Created ${createdVariants?.length || 0} new variants`);
      updateObject.total_stock = finalTotal;
    }

    // Update product
    const { data, error } = await supabaseService
      .from('products')
      .update(updateObject)
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }
    if (!data?.[0]) {
      throw new NotFoundError('Product');
    }

    console.log('✅ Product updated successfully');

    // Invalidate related caches
    cache.clearAll(); // Clear all product caches since product data changed

    return data[0];
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AppError) throw error;
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

    // Invalidate related caches
    cache.clearAll(); // Clear all product caches since product is now inactive

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
 * Reduce stock after order payment verification
 */
export async function reduceStock(variantId, quantity) {
  try {
    // Get current stock and product ID
    const { data: variant, error: getError } = await supabase
      .from('product_variants')
      .select('stock_quantity, product_id')
      .eq('id', variantId)
      .single();

    if (getError || !variant) {
      throw new NotFoundError('Variant');
    }

    const newQuantity = variant.stock_quantity - quantity;

    if (newQuantity < 0) {
      throw new AppError('Insufficient stock', 400);
    }

    const updatedVariant = await updateVariantStock(variantId, newQuantity);

    // Update product total stock
    if (variant.product_id) {
      await updateProductTotalStock(variant.product_id);
    }

    return updatedVariant;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AppError) throw error;
    console.error('Error reducing stock:', error);
    throw error;
  }
}

/**
 * Restore stock after order cancellation or payment failure
 */
export async function restoreStock(variantId, quantity) {
  try {
    // Get current stock
    const { data: variant, error: getError } = await supabase
      .from('product_variants')
      .select('stock_quantity, product_id')
      .eq('id', variantId)
      .single();

    if (getError || !variant) {
      throw new NotFoundError('Variant');
    }

    // Restore stock
    const newQuantity = variant.stock_quantity + quantity;
    const updatedVariant = await updateVariantStock(variantId, newQuantity);

    // Update product total stock
    if (variant.product_id) {
      await updateProductTotalStock(variant.product_id);
    }

    return updatedVariant;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error('Error restoring stock:', error);
    throw error;
  }
}

/**
 * Update product's total stock based on all its variants
 * Recalculates the denormalized total_stock column
 */
export async function updateProductTotalStock(productId) {
  try {
    // Get all variants for this product and sum their stock
    const { data: variants, error: variantError } = await supabase
      .from('product_variants')
      .select('stock_quantity')
      .eq('product_id', productId);

    if (variantError) throw variantError;

    // Calculate total stock
    const totalStock = (variants || []).reduce((sum, v) => sum + (v.stock_quantity || 0), 0);

    // Update product
    const { data, error } = await supabaseService
      .from('products')
      .update({
        total_stock: totalStock,
        updated_at: new Date()
      })
      .eq('id', productId)
      .select();

    if (error) throw error;

    console.log(`📦 Updated total_stock for product ${productId}: ${totalStock}`);
    return data?.[0];
  } catch (error) {
    console.error('Error updating product total stock:', error);
    throw error;
  }
}

/**
 * Check stock availability and mark product as out of stock if needed
 * Updates is_active status based on total_stock
 */
export async function checkAndMarkOutOfStock(productId) {
  try {
    // Get product and its total stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('total_stock, is_active')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      throw new NotFoundError('Product');
    }

    // Mark out of stock if total_stock is 0
    const shouldBeActive = product.total_stock > 0;
    const needsUpdate = product.is_active !== shouldBeActive;

    if (needsUpdate) {
      const { data, error } = await supabaseService
        .from('products')
        .update({
          is_active: shouldBeActive,
          updated_at: new Date()
        })
        .eq('id', productId)
        .select();

      if (error) throw error;

      const status = shouldBeActive ? 'In Stock' : 'Out of Stock';
      console.log(`✓ Marked product ${productId} as ${status}`);
      return data?.[0];
    }

    return product;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error('Error checking and marking stock status:', error);
    throw error;
  }
}

/**
 * Atomically reduce stock for all items in an order (prevents race conditions)
 * Uses database transaction to ensure consistency across multiple items
 */
export async function reduceOrderStockAtomic(orderId) {
  try {
    const { data, error } = await supabase.rpc('reduce_order_stock', {
      p_order_id: orderId
    });

    if (error) {
      console.error('Database RPC error:', error);
      throw new AppError(error.message || 'Failed to reduce stock', 400);
    }

    if (!data || data.length === 0) {
      throw new AppError('No response from stock reduction', 500);
    }

    const result = data[0];

    if (!result.success) {
      console.error('Stock reduction failed:', result.message);
      throw new AppError(result.message || 'Failed to reduce stock', 400);
    }

    console.log(`✓ Atomically reduced stock for order ${orderId}: ${result.reduced_items} items processed`);
    console.log(`  Affected products: ${result.product_ids.join(', ')}`);

    // Ensure product totals are recalculated (failsafe - RPC should handle this)
    if (result.product_ids && result.product_ids.length > 0) {
      console.log(`🔄 Recalculating product totals for ${result.product_ids.length} products...`);
      for (const productId of result.product_ids) {
        try {
          await updateProductTotalStock(productId);
          console.log(`✓ Recalculated totals for product ${productId}`);
        } catch (error) {
          console.error(`⚠️  Warning: Failed to recalculate totals for product ${productId}:`, error.message);
          // Don't fail the order - RPC should have already updated it
        }
      }

      // Broadcast stock updates to all connected clients via SSE
      console.log(`📡 Broadcasting stock updates to connected clients...`);
      try {
        // Fetch order items to get variant information
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('variant_id, product_id, quantity')
          .eq('order_id', orderId);

        if (itemsError) {
          console.error('⚠️  Warning: Failed to fetch order items for broadcasting:', itemsError.message);
        } else if (orderItems && orderItems.length > 0) {
          // Get unique variants and their current stock
          const variantIds = [...new Set(orderItems.map(item => item.variant_id))];
          const { data: variants, error: variantsError } = await supabase
            .from('product_variants')
            .select('id, product_id, size, stock_quantity')
            .in('id', variantIds);

          if (variantsError) {
            console.error('⚠️  Warning: Failed to fetch variants for broadcasting:', variantsError.message);
          } else if (variants && variants.length > 0) {
            // Broadcast each variant's updated stock
            for (const variant of variants) {
              try {
                await stockUpdateService.broadcastStockUpdate(variant.product_id, {
                  productId: variant.product_id,
                  variantId: variant.id,
                  size: variant.size,
                  newQuantity: variant.stock_quantity
                });
                console.log(`  ✓ Broadcasted update for variant ${variant.id}: ${variant.stock_quantity} units`);
              } catch (broadcastError) {
                console.error(`⚠️  Warning: Failed to broadcast update for variant ${variant.id}:`, broadcastError.message);
                // Don't fail the order - stock is already reduced in DB
              }
            }
          }
        }
      } catch (broadcastError) {
        console.error('⚠️  Warning: Error during stock broadcast:', broadcastError.message);
        // Don't fail the order - stock is already reduced in DB
      }
    }

    return {
      success: true,
      reducedItems: result.reduced_items,
      productIds: result.product_ids,
      message: result.message
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error reducing order stock atomically:', error);
    throw new AppError('Failed to process stock reduction', 500);
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
    // Generate cache key
    const cacheKey = cache.constructor.generateFeaturedProductsKey(limit);

    // Check cache first
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name, slug), product_variants(*)')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Transform data to include variants array
    const products = (data || []).map(product => ({
      ...product,
      variants: Array.isArray(product.product_variants) ? product.product_variants : [],
      product_variants: undefined  // Remove the nested property
    }));

    // Cache result (5 minutes)
    cache.set(cacheKey, products, 5 * 60 * 1000);

    return products;
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

/**
 * Get all products that haven't been announced to subscribers yet
 * @returns {Promise<Array>} - Array of unannounced products
 */
export async function getUnannouncedProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .is('announced_at', null)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching unannounced products:', error);
      throw error;
    }

    console.log(`📦 Found ${data?.length || 0} unannounced products`);
    return data || [];
  } catch (error) {
    console.error('Error in getUnannouncedProducts:', error);
    throw error;
  }
}

/**
 * Mark products as announced (sets announced_at to current timestamp)
 * @param {Array<string>} productIds - Array of product UUIDs
 * @returns {Promise<Object>} - { success: boolean, updated: number }
 */
export async function markProductsAsAnnounced(productIds) {
  console.log(`\n🔍 [MARK PRODUCTS] markProductsAsAnnounced called with ${productIds.length} product IDs`);
  console.log(`🔍 [MARK PRODUCTS] Product IDs:`, productIds);

  if (!productIds || productIds.length === 0) {
    console.error(`❌ [MARK PRODUCTS] No product IDs provided!`);
    throw new Error('No product IDs provided');
  }

  try {
    const now = new Date().toISOString();
    console.log(`🔍 [MARK PRODUCTS] Updating with announced_at = ${now}`);
    console.log(`🔍 [MARK PRODUCTS] Attempting to update ${productIds.length} products...`);

    // IMPORTANT: Use supabaseService (admin client) for updates
    // Regular supabase client has RLS restrictions that prevent this update
    // Step 1: Update the products with announced_at timestamp
    const updateResult = await supabaseService
      .from('products')
      .update({ announced_at: now })
      .in('id', productIds)
      .select('id, name, announced_at');

    const { data: updatedProducts, error: updateError, status } = updateResult;

    console.log(`🔍 [MARK PRODUCTS] Update response status: ${status}`);
    console.log(`🔍 [MARK PRODUCTS] Update error:`, updateError);
    console.log(`🔍 [MARK PRODUCTS] Updated products data:`, updatedProducts);

    if (updateError) {
      console.error('❌ [MARK PRODUCTS] Database update error:', updateError);
      throw updateError;
    }

    console.log(`✅ [MARK PRODUCTS] Database update completed. Updated rows: ${updatedProducts?.length || 0}`);

    if (!updatedProducts || updatedProducts.length === 0) {
      console.warn(`⚠️ [MARK PRODUCTS] Update returned 0 rows. Fetching products separately to verify...`);

      // Step 2: Fetch the products separately to check if they were actually updated
      const { data: fetchedProducts, error: fetchError } = await supabase
        .from('products')
        .select('id, name, announced_at')
        .in('id', productIds);

      if (fetchError) {
        console.error('❌ [MARK PRODUCTS] Database fetch error:', fetchError);
        throw fetchError;
      }

      console.log(`✅ [MARK PRODUCTS] Fetched products after update:`, {
        count: fetchedProducts?.length || 0,
        products: fetchedProducts?.map(p => ({ id: p.id, name: p.name, announced_at: p.announced_at }))
      });

      return {
        success: true,
        updated: fetchedProducts?.filter(p => p.announced_at !== null).length || 0,
        products: fetchedProducts || []
      };
    }

    console.log(`✅ [MARK PRODUCTS] Database response (update returned data):`, {
      updatedCount: updatedProducts?.length || 0,
      products: updatedProducts?.map(p => ({ id: p.id, name: p.name, announced_at: p.announced_at }))
    });

    console.log(`✅ [MARK PRODUCTS] Successfully marked ${updatedProducts?.length || 0} products as announced at ${now}`);
    return {
      success: true,
      updated: updatedProducts?.length || 0,
      products: updatedProducts || []
    };
  } catch (error) {
    console.error('Error in markProductsAsAnnounced:', error);
    throw error;
  }
}

/**
 * Distribute total product stock across variants
 * Supports two modes: 'equal' (auto-distribute) or 'manual' (pre-assigned)
 */
export async function distributeStockToVariants(variants, totalStock, distributionMode = 'equal') {
  try {
    if (!variants || variants.length === 0) {
      throw new AppError('At least one variant is required', 400);
    }

    if (totalStock < 0) {
      throw new AppError('Total stock cannot be negative', 400);
    }

    let variantStocks = [];

    if (distributionMode === 'equal') {
      // Auto-distribute equally across all variants
      const baseStock = Math.floor(totalStock / variants.length);
      const remainder = totalStock % variants.length;

      variantStocks = variants.map((variant, index) => ({
        ...variant,
        stock_quantity: baseStock + (index < remainder ? 1 : 0)
      }));

      console.log(`📊 Auto-distributed ${totalStock} units equally across ${variants.length} variants: ${variantStocks.map(v => v.stock_quantity).join(', ')}`);
    } else if (distributionMode === 'manual') {
      // Validate manual assignment: each variant must have stock_quantity
      const missingStock = variants.filter(v => v.stock_quantity === undefined || v.stock_quantity === null);
      if (missingStock.length > 0) {
        throw new AppError('All variants must have stock_quantity assigned in manual mode', 400);
      }

      // Validate sum matches total
      const assignedTotal = variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
      if (assignedTotal !== totalStock) {
        throw new AppError(`Sum of variant stocks (${assignedTotal}) doesn't match total stock (${totalStock})`, 400);
      }

      variantStocks = variants;
      console.log(`📊 Manual stock distribution validated: ${assignedTotal} units across ${variants.length} variants`);
    } else {
      throw new AppError(`Invalid distribution mode: ${distributionMode}. Use 'equal' or 'manual'`, 400);
    }

    return variantStocks;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error distributing stock to variants:', error);
    throw error;
  }
}

/**
 * Validate that all variants have stock assigned and sum matches total
 */
export async function validateVariantStockAssignment(variants, expectedTotal) {
  try {
    if (!variants || variants.length === 0) {
      throw new AppError('No variants provided for validation', 400);
    }

    // Check all variants have stock_quantity
    const missingStock = variants.filter(v => v.stock_quantity === undefined || v.stock_quantity === null);
    if (missingStock.length > 0) {
      throw new AppError(`${missingStock.length} variant(s) missing stock assignment`, 400);
    }

    // Check no negative stock
    const negativeStock = variants.filter(v => v.stock_quantity < 0);
    if (negativeStock.length > 0) {
      throw new AppError('Variant stock cannot be negative', 400);
    }

    // Check sum matches expected total
    const actualTotal = variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
    if (actualTotal !== expectedTotal) {
      throw new AppError(`Sum of variant stocks (${actualTotal}) doesn't match total stock (${expectedTotal})`, 400);
    }

    console.log(`✓ Variant stock validation passed: ${actualTotal} units across ${variants.length} variants`);
    return true;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error validating variant stock:', error);
    throw error;
  }
}

/**
 * Recalculate product total_stock as sum of all variant stocks
 * Called after variant stock changes to keep totals in sync
 */
export async function recalculateProductTotalStock(productId) {
  try {
    // Get all variants for this product
    const { data: variants, error: variantError } = await supabase
      .from('product_variants')
      .select('stock_quantity')
      .eq('product_id', productId);

    if (variantError) throw variantError;

    if (!variants || variants.length === 0) {
      // No variants means total stock is 0
      const { error: updateError } = await supabase
        .from('products')
        .update({
          total_stock: 0,
          updated_at: new Date()
        })
        .eq('id', productId);

      if (updateError) throw updateError;
      return 0;
    }

    // Calculate total from variant stocks
    const totalStock = variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);

    // Update product total_stock
    const { data, error } = await supabase
      .from('products')
      .update({
        total_stock: totalStock,
        updated_at: new Date()
      })
      .eq('id', productId)
      .select();

    if (error) throw error;

    console.log(`📦 Recalculated product ${productId} total_stock: ${totalStock} units from ${variants.length} variants`);
    return totalStock;
  } catch (error) {
    console.error('Error recalculating product total stock:', error);
    throw error;
  }
}

export default {
  getAllProducts,
  getLightweightProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductInventory,
  checkStockAvailability,
  updateVariantStock,
  reduceStock,
  restoreStock,
  updateProductTotalStock,
  checkAndMarkOutOfStock,
  createVariant,
  getFeaturedProducts,
  getLowStockProducts,
  uploadProductImage,
  deleteProductImage,
  validateProductImage,
  getUnannouncedProducts,
  markProductsAsAnnounced,
  distributeStockToVariants,
  validateVariantStockAssignment,
  recalculateProductTotalStock
};
