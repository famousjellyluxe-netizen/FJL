/**
 * Product Data Service
 * Centralized data layer for product loading, transformation, caching, and enrichment
 *
 * Features:
 * - Unified product data loading from cache, API, or both
 * - Description enrichment (fetch full data when description is missing)
 * - Cache management with metadata tracking
 * - Error handling with graceful fallbacks
 * - Non-destructive cache updates (preserves existing data)
 */

(function() {
  'use strict';

  // Get reference to global apiManager from api-integration.js
  const apiManager = window.apiManager;

  /**
   * Extract unique sizes from variants
   * @param {Array} variants - Array of product variants
   * @returns {Array} Unique size values
   */
  function extractUniqueSizesFromVariants(variants) {
    if (!variants || !Array.isArray(variants)) {
      return [];
    }

    const sizes = new Set();
    variants.forEach(variant => {
      if (variant.size) {
        sizes.add(variant.size);
      }
    });

    return Array.from(sizes);
  }

  /**
   * Transform API variants to inventory format
   * Sums stock across all colors for each size
   * @param {Array} variants - Array of product variants
   * @returns {Object} Size -> stock quantity mapping
   */
  function transformVariantsToInventory(variants) {
    if (!variants || !Array.isArray(variants)) {
      return {};
    }

    const inventory = {};

    variants.forEach(variant => {
      const key = variant.size;
      if (!inventory[key]) {
        inventory[key] = 0;
      }
      // Sum stock across all colors for this size
      inventory[key] += (variant.stock_quantity || 0);
    });

    return inventory;
  }

  /**
   * Transform API product to frontend format
   * Handles both lightweight and full API response formats
   * @param {Object} apiProduct - Product from API
   * @returns {Object} Transformed product
   */
  function transformAPIProduct(apiProduct) {
    // Lightweight format: {id, name, price, image, category, variants}
    // Full format: {id, name, price, image_url, category_id, variants, total_stock, ...}
    const isLightweight = apiProduct.image && !apiProduct.image_url && !apiProduct.category_id;

    if (isLightweight) {
      return {
        id: apiProduct.id,
        name: apiProduct.name,
        price: apiProduct.price,
        original_price: apiProduct.original_price,
        image: apiProduct.image,
        images: [],
        sleeve: 'Sleeve',
        inStock: true,
        stock: 0,
        sizes: extractUniqueSizesFromVariants(apiProduct.variants),
        sizeInventory: transformVariantsToInventory(apiProduct.variants),
        sku: apiProduct.sku || '',
        description: apiProduct.description || '',
        category: apiProduct.category,
        category_slug: '',
        variants: apiProduct.variants || []
      };
    }

    // Full format (from /api/products/{id} endpoint)
    return {
      id: apiProduct.id,
      name: apiProduct.name,
      price: apiProduct.price,
      original_price: apiProduct.original_price,
      image: apiProduct.image_url || apiProduct.image || apiProduct.images?.[0],
      images: apiProduct.images || [],
      sleeve: apiProduct.sleeve_type === 'sleeveless' ? 'Sleeveless' : 'Sleeve',
      inStock: (apiProduct.total_stock || 0) > 0,
      stock: apiProduct.total_stock || 0,
      sizes: extractUniqueSizesFromVariants(apiProduct.variants),
      sizeInventory: transformVariantsToInventory(apiProduct.variants),
      sku: apiProduct.sku,
      description: apiProduct.description,
      category: apiProduct.categories?.name || apiProduct.category,
      category_slug: apiProduct.categories?.slug || '',
      variants: apiProduct.variants || []
    };
  }

  /**
   * Validate and sanitize product data
   * Ensures all required fields have valid values
   * @param {Object} product - Product to validate
   * @returns {Object} Validated product
   */
  function validateAndSanitize(product) {
    return {
      id: product.id || '',
      name: product.name || 'Unknown Product',
      price: Number(product.price) || 0,
      original_price: product.original_price ? Number(product.original_price) : undefined,
      image: product.image || '',
      images: Array.isArray(product.images) ? product.images : [],
      sleeve: product.sleeve || 'Sleeve',
      inStock: Boolean(product.inStock !== false),
      stock: Number(product.stock) || 0,
      sizeInventory: typeof product.sizeInventory === 'object' ? product.sizeInventory : {},
      sizes: Array.isArray(product.sizes) ? product.sizes : [],
      sku: product.sku || '',
      description: product.description || '',
      category: product.category || '',
      category_slug: product.category_slug || '',
      variants: Array.isArray(product.variants) ? product.variants : [],
      _cacheMetadata: product._cacheMetadata || {}
    };
  }

  /**
   * Get product from localStorage cache
   * @param {string} productId - Product ID to find
   * @returns {Object|null} Product if found, null otherwise
   */
  function getProductByIdFromCache(productId) {
    try {
      const storedProducts = localStorage.getItem('fjl_products');
      if (storedProducts) {
        const allProducts = JSON.parse(storedProducts);
        if (Array.isArray(allProducts)) {
          const product = allProducts.find(p => p.id === productId);
          if (product) {
            console.log(`✓ Cache HIT for product ${productId}`);
            return product;
          }
        }
      }
    } catch (e) {
      console.error('Error reading from localStorage:', e);
    }

    console.log(`✗ Cache MISS for product ${productId}`);
    return null;
  }

  /**
   * Fetch full product from API
   * @param {string} productId - Product ID to fetch
   * @returns {Promise<Object|null>} Transformed product or null
   */
  async function getProductByIdFromAPI(productId) {
    if (!apiManager) {
      console.error('API Manager not available');
      return null;
    }

    try {
      console.log(`→ Fetching full product from API: ${productId}`);

      const result = await apiManager.call(`/products/${productId}`, {
        method: 'GET'
      });

      if (result && result.success && result.data) {
        let apiProduct = result.data;

        // Handle double-wrapped response: if data is {success: true, data: {...}}, unwrap it
        if (apiProduct && apiProduct.success && apiProduct.data && typeof apiProduct.data === 'object') {
          apiProduct = apiProduct.data;
        }

        const transformedProduct = transformAPIProduct(apiProduct);
        console.log(`✓ Fetched full product from API: ${productId}`);
        return transformedProduct;
      }
    } catch (error) {
      console.error(`✗ API error fetching product ${productId}:`, error.message);
    }

    return null;
  }

  /**
   * Update localStorage cache with product
   * Non-destructive: only updates the specific product, preserves others
   * @param {Object} product - Product to cache
   */
  function cacheProduct(product) {
    try {
      const storedProducts = localStorage.getItem('fjl_products');
      let allProducts = [];

      if (storedProducts) {
        try {
          allProducts = JSON.parse(storedProducts);
          if (!Array.isArray(allProducts)) {
            allProducts = [];
          }
        } catch (e) {
          console.warn('Could not parse existing cache, starting fresh');
          allProducts = [];
        }
      }

      // Add or update metadata
      product._cacheMetadata = product._cacheMetadata || {};
      product._cacheMetadata.fetchedAt = Date.now();

      // Find and update existing product or add new one
      const existingIndex = allProducts.findIndex(p => p.id === product.id);
      if (existingIndex >= 0) {
        // Merge with existing product to preserve fields
        const existing = allProducts[existingIndex];
        allProducts[existingIndex] = { ...existing, ...product };
        console.log(`✓ Updated cached product: ${product.id} (merged fields)`);
      } else {
        allProducts.push(product);
        console.log(`✓ Added new cached product: ${product.id}`);
      }

      localStorage.setItem('fjl_products', JSON.stringify(allProducts));
    } catch (e) {
      console.error('Error caching product:', e);
    }
  }

  /**
   * Check if product has complete description
   * @param {Object} product - Product to check
   * @returns {boolean} True if description is present and non-empty
   */
  function hasCompleteDescription(product) {
    return product &&
           product.description &&
           product.description.trim().length > 0;
  }

  /**
   * Main function: Get full product data with automatic enrichment
   *
   * Strategy:
   * 1. Try cache first (fast)
   * 2. If cache has description: return it
   * 3. If cache exists but no description: enrich from API
   * 4. If no cache: fetch from API and cache
   * 5. On API error: return cached version if available
   *
   * @param {string} productId - Product ID to load
   * @returns {Promise<Object>} Complete product data
   */
  async function getFullProductData(productId) {
    console.log(`\n📦 Loading full product data for: ${productId}`);

    // Step 1: Try cache first
    let product = getProductByIdFromCache(productId);

    if (product) {
      // Step 2: Check if description is complete
      if (hasCompleteDescription(product)) {
        console.log(`✓ Product has complete description, returning from cache`);
        return validateAndSanitize(product);
      }

      // Step 3: Description missing, enrich from API
      console.log(`→ Description missing, enriching with full product data`);
      const fullProduct = await getProductByIdFromAPI(productId);

      if (fullProduct) {
        console.log(`→ API returned product with description: "${fullProduct.description}"`);
        // Merge full data into cached product (API data takes precedence)
        product = {
          ...product,
          ...fullProduct,
          _cacheMetadata: {
            ...product._cacheMetadata,
            source: 'enriched',
            enrichedAt: Date.now()
          }
        };
        console.log(`→ Merged product description before cache: "${product.description}"`);
        cacheProduct(product);
        console.log(`✓ Product enriched with full data from API`);
        const result = validateAndSanitize(product);
        console.log(`→ Final product description after sanitize: "${result.description}"`);
        return result;
      } else {
        // API call failed, return what we have from cache
        console.log(`⚠ API enrichment failed, returning cached version`);
        return validateAndSanitize(product);
      }
    }

    // Step 4: No cache, fetch from API
    console.log(`→ No cache available, fetching from API`);
    const apiProduct = await getProductByIdFromAPI(productId);

    if (apiProduct) {
      apiProduct._cacheMetadata = {
        source: 'api',
        fetchedAt: Date.now(),
        incomplete: !hasCompleteDescription(apiProduct)
      };
      cacheProduct(apiProduct);
      return validateAndSanitize(apiProduct);
    }

    // Step 5: API failed completely
    console.error(`✗ Failed to load product ${productId} from cache or API`);
    throw new Error(`Product not found: ${productId}`);
  }

  /**
   * Invalidate cache for a specific product
   * @param {string} productId - Product ID to remove from cache
   */
  function invalidateProductCache(productId) {
    try {
      const storedProducts = localStorage.getItem('fjl_products');
      if (storedProducts) {
        let allProducts = JSON.parse(storedProducts);
        if (Array.isArray(allProducts)) {
          allProducts = allProducts.filter(p => p.id !== productId);
          localStorage.setItem('fjl_products', JSON.stringify(allProducts));
          console.log(`✓ Invalidated cache for product: ${productId}`);
        }
      }
    } catch (e) {
      console.error('Error invalidating cache:', e);
    }
  }

  /**
   * Clear all product cache
   */
  function clearAllProductCache() {
    try {
      localStorage.removeItem('fjl_products');
      console.log(`✓ Cleared all product cache`);
    } catch (e) {
      console.error('Error clearing cache:', e);
    }
  }

  /**
   * Get cache metadata for debugging
   * @param {string} productId - Product ID
   * @returns {Object|null} Cache metadata if available
   */
  function getCacheMetadata(productId) {
    const product = getProductByIdFromCache(productId);
    return product?._cacheMetadata || null;
  }

  /**
   * Export service functions to window for global access
   */
  window.productDataService = {
    getFullProductData,
    getProductByIdFromCache,
    getProductByIdFromAPI,
    cacheProduct,
    invalidateProductCache,
    clearAllProductCache,
    getCacheMetadata,
    validateAndSanitize,
    transformAPIProduct,
    transformVariantsToInventory,
    extractUniqueSizesFromVariants
  };

  console.log('✓ ProductDataService initialized');

})();
