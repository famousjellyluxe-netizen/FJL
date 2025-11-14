/**
 * Shop Page Integration
 * Loads products from backend API with localStorage fallback
 */

(function() {
  'use strict';

  /**
   * Extract unique sizes from variants
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
   */
  function transformVariantsToInventory(variants) {
    if (!variants || !Array.isArray(variants)) {
      return {};
    }

    const inventory = {};

    variants.forEach(variant => {
      // Use only size as key (not including color) for proper lookup
      // This way sizeInventory['XS'] returns the stock count for that size
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
   * Load products from API or fallback to localStorage
   */
  async function loadProducts() {
    console.log('📦 Loading products...');

    try {
      // Try to load from API first
      const result = await apiManager.call('/products', { method: 'GET' });

      console.log('API Result:', result);

      // Extract the products array from the API response
      // The API returns {success: true, data: [...], pagination: {...}}
      // But apiManager wraps it as {success: true, data: {success: true, data: [...], pagination: {...}}}
      let productsArray = null;

      if (result.success && result.data) {
        // Check if result.data.data exists (nested API response)
        if (Array.isArray(result.data.data)) {
          productsArray = result.data.data;
        } else if (Array.isArray(result.data)) {
          productsArray = result.data;
        }
      }

      if (productsArray && Array.isArray(productsArray)) {
        console.log(`✅ Loaded ${productsArray.length} products from API`);

        // Transform API products to match frontend format
        const transformedProducts = productsArray.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image_url || product.images?.[0],
          images: product.images || [],
          sleeve: product.sleeve_type === 'sleeveless' ? 'Sleeveless' : 'Sleeve',
          inStock: product.total_stock > 0,
          stock: product.total_stock,
          sizes: extractUniqueSizesFromVariants(product.variants), // Extract sizes from variants
          sizeInventory: transformVariantsToInventory(product.variants),
          sku: product.sku,
          description: product.description,
          category: product.categories?.name,
          category_slug: product.categories?.slug,
          variants: product.variants || []
        }));

        // Cache products in localStorage for offline access
        localStorage.setItem('fjl_products', JSON.stringify(transformedProducts));

        // Notify other tabs
        if (window.BroadcastChannel) {
          try {
            const bc = new BroadcastChannel('fjl_products');
            bc.postMessage({ type: 'refresh', source: 'api' });
            bc.close();
          } catch (e) {
            // Broadcast Channel not supported
          }
        }

        return transformedProducts;
      }

      // API returned no data, use fallback
      console.warn('⚠️  API returned no products, using localStorage fallback');
      return getProductsFallback();
    } catch (error) {
      console.error('❌ Error loading products from API:', error);

      // Show user-friendly error
      if (error.type === 'NETWORK_ERROR') {
        console.log('📡 Network offline, using cached products');
        showNetworkWarning();
      }

      // Fallback to localStorage
      return getProductsFallback();
    }
  }

  /**
   * Get products from localStorage fallback
   */
  function getProductsFallback() {
    const storedProducts = localStorage.getItem('fjl_products');

    if (storedProducts) {
      try {
        const products = JSON.parse(storedProducts);
        console.log(`📦 Using ${products.length} cached products from localStorage`);
        return products;
      } catch (e) {
        console.error('Error parsing cached products:', e);
      }
    }

    console.warn('⚠️  No cached products available');
    return [];
  }

  /**
   * Show warning that we're offline
   */
  function showNetworkWarning() {
    if (window.notifications) {
      window.notifications.warning(
        'You are offline. Viewing cached products. Some features may be limited.'
      );
    }
  }

  /**
   * Validate and sanitize product before rendering
   */
  function validateProduct(product) {
    return {
      id: product.id || '',
      name: product.name || 'Unknown Product',
      price: Number(product.price) || 0,
      image: product.image || '',
      images: Array.isArray(product.images) ? product.images : [],
      sleeve: product.sleeve || 'Sleeve',
      inStock: Boolean(product.inStock !== false),
      stock: Number(product.stock) || 0,
      sizeInventory: typeof product.sizeInventory === 'object' ? product.sizeInventory : {},
      sku: product.sku || '',
      description: product.description || '',
      category: product.category || '',
      category_slug: product.category_slug || '',
      variants: Array.isArray(product.variants) ? product.variants : []
    };
  }

  /**
   * Initialize products on page load
   */
  window.initializeShopProducts = async function() {
    // Load products
    const rawProducts = await loadProducts();

    // Validate all products
    const validProducts = rawProducts
      .map(validateProduct)
      .filter(p => p.id && p.name);

    // Store in window for shop.html to use
    window.productsFromAPI = validProducts;

    console.log(`✅ Initialized ${validProducts.length} products for shop`);

    return validProducts;
  };

  /**
   * Sync products when coming back online
   */
  window.addEventListener('online', async () => {
    console.log('🌐 Online - refreshing products');
    const products = await loadProducts();

    if (window.refreshShopProducts) {
      window.refreshShopProducts(products);
    }
  });

  /**
   * Listen for product updates in other tabs
   */
  if (window.BroadcastChannel) {
    try {
      const bc = new BroadcastChannel('fjl_products');
      bc.onmessage = (event) => {
        if (event.data.type === 'refresh') {
          console.log('📢 Products updated in another tab');
          loadProducts();
        }
      };
    } catch (e) {
      // Broadcast Channel not supported
    }
  }
})();
