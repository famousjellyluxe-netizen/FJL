/**
 * Shop Page Integration
 * Loads products from backend API with localStorage fallback
 */

(function() {
  'use strict';

  // Get reference to global apiManager from api-integration.js
  const apiManager = window.apiManager;

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
   * @param {number} page - Page number for pagination
   * @param {number} limit - Items per page
   * @param {Object} filters - Additional filters (category, search, etc.)
   */
  async function loadProducts(page = 1, limit = 12, filters = {}) {
    console.log(`📦 Loading products... (page: ${page}, limit: ${limit})`);

    try {
      // Build query parameters
      const queryParams = {
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      };

      // Use lightweight endpoint for better performance
      // Fallback to regular /products if lightweight is not available
      const result = await apiManager.call('/products/list/lightweight', {
        method: 'GET',
        query: queryParams
      }).catch(() => {
        // Fallback to regular products endpoint
        console.log('⚠️  Lightweight endpoint not available, using regular endpoint');
        return apiManager.call('/products', { method: 'GET' });
      });

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

        // Get pagination info if available
        const pagination = result.data?.pagination || result.pagination;

        // Transform API products to match frontend format
        // Handles both lightweight format and full format
        const transformedProducts = productsArray.map(product => {
          // Lightweight format: {id, name, price, image, category}
          if (product.image && !product.images) {
            return {
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              images: [],
              sleeve: 'Sleeve',
              inStock: true, // Lightweight format doesn't include stock
              stock: 0,
              sizes: extractUniqueSizesFromVariants(product.variants),
              sizeInventory: transformVariantsToInventory(product.variants),
              sku: '',
              description: '',
              category: product.category,
              category_slug: '',
              variants: product.variants || []
            };
          }
          // Full format: includes all details
          return {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image_url || product.images?.[0],
            images: product.images || [],
            sleeve: product.sleeve_type === 'sleeveless' ? 'Sleeveless' : 'Sleeve',
            inStock: product.total_stock > 0,
            stock: product.total_stock,
            sizes: extractUniqueSizesFromVariants(product.variants),
            sizeInventory: transformVariantsToInventory(product.variants),
            sku: product.sku,
            description: product.description,
            category: product.categories?.name || product.category,
            category_slug: product.categories?.slug || '',
            variants: product.variants || []
          };
        });

        // Cache products in localStorage for offline access
        localStorage.setItem('fjl_products', JSON.stringify(transformedProducts));

        // Store pagination info if available
        if (pagination) {
          localStorage.setItem('fjl_pagination', JSON.stringify(pagination));
        }

        // Notify other tabs
        if (window.BroadcastChannel) {
          try {
            const bc = new BroadcastChannel('fjl_products');
            bc.postMessage({ type: 'refresh', source: 'api', pagination });
            bc.close();
          } catch (e) {
            // Broadcast Channel not supported
          }
        }

        return {
          products: transformedProducts,
          pagination: pagination
        };
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
   * Pagination state
   */
  const paginationState = {
    currentPage: 1,
    limit: 12,
    totalPages: 1,
    total: 0,
    filters: {}
  };

  /**
   * Initialize products on page load
   */
  window.initializeShopProducts = async function(filters = {}) {
    // Reset pagination for new filters
    paginationState.currentPage = 1;
    paginationState.filters = filters;

    // Load first page of products
    const result = await loadProducts(paginationState.currentPage, paginationState.limit, filters);
    const rawProducts = result.products || result;

    // Update pagination state
    if (result.pagination) {
      paginationState.currentPage = result.pagination.page;
      paginationState.limit = result.pagination.limit;
      paginationState.totalPages = result.pagination.pages;
      paginationState.total = result.pagination.total;
    }

    // Validate all products
    const validProducts = (Array.isArray(rawProducts) ? rawProducts : [])
      .map(validateProduct)
      .filter(p => p.id && p.name);

    // Store in window for shop.html to use
    window.productsFromAPI = validProducts;
    window.paginationState = paginationState;

    console.log(`✅ Initialized ${validProducts.length} products for shop (Page ${paginationState.currentPage}/${paginationState.totalPages})`);

    return validProducts;
  };

  /**
   * Load next page of products (for "Load More" button)
   */
  window.loadMoreProducts = async function() {
    if (paginationState.currentPage >= paginationState.totalPages) {
      console.warn('⚠️  Already on last page');
      return [];
    }

    paginationState.currentPage++;
    console.log(`📄 Loading page ${paginationState.currentPage}...`);

    const result = await loadProducts(paginationState.currentPage, paginationState.limit, paginationState.filters);
    const rawProducts = result.products || result;

    // Update pagination state
    if (result.pagination) {
      paginationState.currentPage = result.pagination.page;
      paginationState.limit = result.pagination.limit;
      paginationState.totalPages = result.pagination.pages;
      paginationState.total = result.pagination.total;
    }

    // Validate all products
    const validProducts = (Array.isArray(rawProducts) ? rawProducts : [])
      .map(validateProduct)
      .filter(p => p.id && p.name);

    console.log(`✅ Loaded ${validProducts.length} more products (Page ${paginationState.currentPage}/${paginationState.totalPages})`);

    return validProducts;
  };

  /**
   * Get current pagination state
   */
  window.getPaginationState = function() {
    return { ...paginationState };
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
   * Lazy loading utilities
   */
  const lazyLoadObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          lazyLoadObserver.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: '50px' // Start loading 50px before image enters viewport
  });

  /**
   * Initialize lazy loading for product images
   */
  window.initializeLazyLoading = function() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      lazyLoadObserver.observe(img);
    });
    console.log(`🖼️  Initialized lazy loading for ${images.length} images`);
  };

  /**
   * Add lazy loading to new images after dynamic load
   */
  window.addLazyLoadingToImages = function(container) {
    const images = container.querySelectorAll('img[data-src]');
    images.forEach(img => {
      lazyLoadObserver.observe(img);
    });
    if (images.length > 0) {
      console.log(`🖼️  Added lazy loading to ${images.length} new images`);
    }
  };

  /**
   * Listen for product updates in other tabs
   */
  if (window.BroadcastChannel) {
    try {
      const bc = new BroadcastChannel('fjl_products');
      bc.onmessage = (event) => {
        if (event.data.type === 'refresh') {
          console.log('📢 Products updated in another tab');
          loadProducts(1, paginationState.limit, paginationState.filters);
        }
      };
    } catch (e) {
      // Broadcast Channel not supported
    }
  }
})();
