/**
 * UniversalStockSynchronizer.js
 *
 * Singleton that manages real-time stock updates across all FJL pages
 * (shop.html, index.html, cart.html, checkout.html).
 *
 * ## Architecture
 *
 * This class coordinates between:
 * - **StockUpdateClient**: Handles SSE connection and polling fallback
 * - **DataSyncBus**: Provides cross-tab communication via storage events
 * - **Page Handlers**: Page-specific callbacks that update UI when stock changes
 * - **Stock Cache**: Local cache of product variants for quick lookups
 * - **localStorage**: Persistent storage of product data across sessions
 *
 * ## How It Works
 *
 * 1. **Initialization**: When getInstance() is called, creates singleton instance
 * 2. **Subscription**: Pages subscribe to specific product IDs
 * 3. **Stock Updates**: StockUpdateClient receives updates via SSE, passes to synchronizer
 * 4. **Distribution**: Synchronizer calls registered page handlers to update UI
 * 5. **Cross-Tab Sync**: Updates broadcast to other tabs via localStorage
 * 6. **Cross-Tab Handlers**: Storage events trigger handlers in other tabs
 *
 * ## Example Usage
 *
 * ```javascript
 * // Get singleton instance
 * const sync = await UniversalStockSynchronizer.getInstance();
 *
 * // Enable debug logging
 * sync.setDebugMode(true);
 *
 * // Register page handler (e.g., for shop page)
 * sync.registerPageHandler('shop', (data) => {
 *   const card = document.querySelector(`[data-product-id="${data.productId}"]`);
 *   if (card) {
 *     card.querySelector('.stock-value').textContent = data.newQuantity;
 *     if (data.newQuantity === 0) {
 *       card.classList.add('sold-out');
 *     }
 *   }
 * });
 *
 * // Subscribe to products
 * await sync.subscribe(['product-uuid-1', 'product-uuid-2']);
 *
 * // Optional: Get current stock
 * const stock = await sync.getProductStock('product-uuid-1');
 *
 * // Optional: Set error handler
 * sync.setErrorCallback((error) => {
 *   console.error('Stock sync error:', error);
 *   showErrorNotification(error.message);
 * });
 *
 * // On page unload
 * sync.disconnect();
 * ```
 *
 * ## Stock Update Data Format
 *
 * Stock updates from backend have this structure:
 * ```javascript
 * {
 *   productId: 'uuid-string',      // Product identifier
 *   variantId: 'uuid-string',      // Variant identifier
 *   newQuantity: 15,               // New stock quantity
 *   oldQuantity: 20,               // Previous quantity (optional)
 *   size: 'M',                     // Variant size (optional)
 *   color: 'Red',                  // Variant color (optional)
 *   lowStock: false,               // Flag if stock ≤ 5 (optional)
 *   timestamp: '2025-11-26T...'   // Update timestamp (optional)
 * }
 * ```
 *
 * @class UniversalStockSynchronizer
 * @author Claude Code (with phase summaries from implementation)
 * @version 1.0.0
 * @date 2025-11-26
 * @copyright FJL e-commerce platform
 */

class UniversalStockSynchronizer {
  /**
   * Global singleton instance - one per browser tab
   * @type {UniversalStockSynchronizer|null}
   */
  static instance = null;

  /**
   * Factory method to get or create singleton instance
   * @returns {Promise<UniversalStockSynchronizer>}
   */
  static async getInstance() {
    if (!UniversalStockSynchronizer.instance) {
      UniversalStockSynchronizer.instance = new UniversalStockSynchronizer();
      await UniversalStockSynchronizer.instance.initialize();
    }
    return UniversalStockSynchronizer.instance;
  }

  /**
   * Constructor - initializes properties
   */
  constructor() {
    this.stockClient = null;
    this.pageHandlers = new Map(); // pageType → handler function
    this.subscribedProductIds = new Set(); // Track what we're subscribed to
    this.isInitialized = false;
    this.stockCache = new Map(); // Local stock cache: productId → { variants: [...] }
    this.errorCallback = null;
    this.debugMode = false;
  }

  /**
   * Initialize the synchronizer and connect to SSE
   * @private
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      if (this.isInitialized) return;

      // Dynamically import StockUpdateClient
      const { StockUpdateClient } = await import('./StockUpdateClient.js');

      this.stockClient = new StockUpdateClient();

      // Setup event listeners on StockUpdateClient
      this.stockClient.onStockUpdate((data) => {
        this.handleStockUpdate(data);
      });

      this.stockClient.onInitialStock((data) => {
        this.handleInitialStock(data);
      });

      // Setup DataSyncBus integration if available
      if (window.dataSyncBus) {
        window.dataSyncBus.onProductUpdate((productId, data) => {
          this._log(`[DataSyncBus] Product update received for ${productId}`);
          this.handleStockUpdate(data);
        });
      }

      // Listen for storage events (cross-tab synchronization)
      window.addEventListener('storage', (event) => {
        if (event.key && event.key.startsWith('fjl_sync_')) {
          const productId = event.key.replace('fjl_sync_', '');
          if (event.newValue) {
            try {
              const data = JSON.parse(event.newValue);
              this._log(`[Storage Event] Product ${productId} updated from another tab`);
              this.handleStockUpdate(data);
            } catch (e) {
              this._error(`Failed to parse storage event: ${e.message}`);
            }
          }
        }
      });

      // Cleanup on page unload
      window.addEventListener('beforeunload', () => {
        this.disconnect();
      });

      this.isInitialized = true;
      this._log('UniversalStockSynchronizer initialized successfully');
    } catch (error) {
      this._error(`Initialization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Register a page-specific handler for stock updates
   * Handlers are called whenever stock changes for subscribed products
   *
   * @param {string} pageType - Type of page (e.g., 'shop', 'cart', 'featured', 'checkout')
   * @param {Function} handler - Callback: (data) => void, where data = { productId, newQuantity, ... }
   * @returns {void}
   *
   * @example
   * synchronizer.registerPageHandler('shop', (data) => {
   *   const elem = document.querySelector(`[data-product-id="${data.productId}"]`);
   *   if (elem) {
   *     elem.querySelector('.stock').textContent = data.newQuantity;
   *   }
   * });
   */
  registerPageHandler(pageType, handler) {
    if (typeof handler !== 'function') {
      throw new Error(`Handler for page type "${pageType}" must be a function`);
    }
    this.pageHandlers.set(pageType, handler);
    this._log(`Page handler registered for: ${pageType}`);
  }

  /**
   * Unregister a page handler
   * @param {string} pageType - Type of page
   * @returns {void}
   */
  unregisterPageHandler(pageType) {
    this.pageHandlers.delete(pageType);
    this._log(`Page handler unregistered for: ${pageType}`);
  }

  /**
   * Subscribe to stock updates for specific products
   * Automatically connects to SSE if not already connected
   *
   * @param {string|string[]} productIds - Single product ID or array of product IDs
   * @returns {Promise<void>}
   *
   * @example
   * await synchronizer.subscribe('product-uuid-123');
   * await synchronizer.subscribe(['product-1', 'product-2', 'product-3']);
   */
  async subscribe(productIds) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Normalize to array
      const ids = Array.isArray(productIds) ? productIds : [productIds];

      // Filter out already subscribed products
      const newIds = ids.filter(id => !this.subscribedProductIds.has(id));

      if (newIds.length === 0) {
        this._log('All products already subscribed');
        return;
      }

      // Add to subscribed set
      newIds.forEach(id => this.subscribedProductIds.add(id));

      // Subscribe via StockUpdateClient
      if (this.stockClient && typeof this.stockClient.subscribe === 'function') {
        await this.stockClient.subscribe(newIds);
        this._log(`Subscribed to ${newIds.length} product(s): ${newIds.join(', ')}`);
      }
    } catch (error) {
      this._error(`Subscribe failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Unsubscribe from stock updates for specific products
   *
   * @param {string|string[]} productIds - Single product ID or array of product IDs
   * @returns {Promise<void>}
   */
  async unsubscribe(productIds) {
    try {
      const ids = Array.isArray(productIds) ? productIds : [productIds];

      ids.forEach(id => {
        this.subscribedProductIds.delete(id);
        this.stockCache.delete(id);
      });

      if (this.stockClient && typeof this.stockClient.unsubscribe === 'function') {
        await this.stockClient.unsubscribe(ids);
        this._log(`Unsubscribed from ${ids.length} product(s)`);
      }
    } catch (error) {
      this._error(`Unsubscribe failed: ${error.message}`);
    }
  }

  /**
   * Handle initial stock data received when first connecting to a product
   * Caches the variant data for quick lookups
   *
   * @private
   * @param {Object} data - Initial stock data from backend
   * @returns {void}
   */
  handleInitialStock(data) {
    try {
      this._log(`[Initial Stock] Product ${data.productId}:`, data);

      // Cache the initial stock data
      if (data.productId && data.variants) {
        this.stockCache.set(data.productId, {
          variants: data.variants,
          lastUpdate: Date.now(),
          type: 'initial'
        });
      }

      // Update localStorage
      this._updateLocalStorage(data);

      // Broadcast to all registered page handlers
      this._callPageHandlers(data);

      // Broadcast to other tabs via DataSyncBus
      this._broadcastToAllTabs(data);
    } catch (error) {
      this._error(`Handle initial stock failed: ${error.message}`);
    }
  }

  /**
   * Handle stock update when inventory changes
   * Updates local cache, localStorage, and notifies page handlers
   *
   * @param {Object} data - Stock update data from backend
   * @param {string} data.productId - Product UUID
   * @param {string} data.variantId - Variant UUID (if specific variant)
   * @param {number} data.newQuantity - New stock quantity
   * @param {number} [data.oldQuantity] - Previous quantity (optional)
   * @param {string} [data.size] - Size of variant (optional)
   * @param {string} [data.color] - Color of variant (optional)
   * @returns {Promise<void>}
   */
  async handleStockUpdate(data) {
    try {
      if (!data || !data.productId) {
        this._error('Invalid stock update data - missing productId');
        return;
      }

      this._log(`[Stock Update] ${data.productId}: ${data.oldQuantity || '?'} → ${data.newQuantity}`);

      // Update local cache if we have variant data
      if (this.stockCache.has(data.productId)) {
        const cached = this.stockCache.get(data.productId);
        if (cached.variants && data.variantId) {
          const variant = cached.variants.find(v => v.id === data.variantId);
          if (variant) {
            variant.stock_quantity = data.newQuantity;
            cached.lastUpdate = Date.now();
          }
        }
      }

      // Update localStorage with new stock
      this._updateLocalStorage(data);

      // Call all registered page handlers
      this._callPageHandlers(data);

      // Broadcast to other tabs
      this._broadcastToAllTabs(data);
    } catch (error) {
      this._error(`Handle stock update failed: ${error.message}`);
    }
  }

  /**
   * Get current stock quantity for a specific product/variant
   * Checks cache first, then falls back to fetch from API if needed
   *
   * @param {string} productId - Product UUID
   * @param {string} [size] - Variant size (optional)
   * @param {string} [color] - Variant color (optional)
   * @returns {Promise<number>} Current stock quantity
   */
  async getProductStock(productId, size = null, color = null) {
    try {
      // Check cache first
      if (this.stockCache.has(productId)) {
        const cached = this.stockCache.get(productId);
        if (cached.variants) {
          if (size && color) {
            const variant = cached.variants.find(v => v.size === size && v.color === color);
            if (variant) return variant.stock_quantity || 0;
          } else {
            // Return total stock across all variants
            return cached.variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
          }
        }
      }

      // If not in cache, try to fetch from API (if apiManager available)
      if (window.apiManager && typeof window.apiManager.call === 'function') {
        const response = await window.apiManager.call(`/products/${productId}/stock/status`);
        if (response && response.data) {
          return response.data.total_stock || 0;
        }
      }

      // Fallback: return 0 if we can't determine
      this._log(`Stock lookup failed for ${productId}, returning 0`);
      return 0;
    } catch (error) {
      this._error(`Get product stock failed: ${error.message}`);
      return 0;
    }
  }

  /**
   * Update localStorage with new stock data
   * Called after every stock update to keep cached products in sync
   *
   * @private
   * @param {Object} data - Stock update data
   * @returns {void}
   */
  _updateLocalStorage(data) {
    try {
      const storageKey = 'fjl_products';
      const cached = localStorage.getItem(storageKey);

      if (cached) {
        try {
          const products = JSON.parse(cached);
          const product = products.find(p => p.id === data.productId);

          if (product && product.variants && data.variantId) {
            const variant = product.variants.find(v => v.id === data.variantId);
            if (variant) {
              variant.stock_quantity = data.newQuantity;

              // Update localStorage
              localStorage.setItem(storageKey, JSON.stringify(products));
              this._log(`[localStorage] Updated product ${data.productId}`);
            }
          }
        } catch (parseError) {
          this._error(`Failed to parse products from localStorage: ${parseError.message}`);
        }
      }
    } catch (error) {
      this._error(`Update localStorage failed: ${error.message}`);
    }
  }

  /**
   * Call all registered page handlers with stock update
   * Handlers are responsible for updating their specific UI
   *
   * @private
   * @param {Object} data - Stock update data
   * @returns {void}
   */
  _callPageHandlers(data) {
    for (const [pageType, handler] of this.pageHandlers.entries()) {
      try {
        // Call handler asynchronously to prevent blocking
        Promise.resolve().then(() => handler(data)).catch(error => {
          this._error(`Page handler error (${pageType}): ${error.message}`);
        });
      } catch (error) {
        this._error(`Failed to call handler for ${pageType}: ${error.message}`);
      }
    }
  }

  /**
   * Broadcast stock update to all tabs via DataSyncBus
   * Uses localStorage storage events for cross-tab communication
   *
   * @private
   * @param {Object} data - Stock update data
   * @returns {void}
   */
  _broadcastToAllTabs(data) {
    try {
      if (window.dataSyncBus && typeof window.dataSyncBus.broadcastToAllTabs === 'function') {
        window.dataSyncBus.broadcastToAllTabs(data.productId, {
          ...data,
          broadcastAt: new Date().toISOString()
        });
        this._log(`[Broadcast] Stock update sent to all tabs for ${data.productId}`);
      }
    } catch (error) {
      this._error(`Broadcast to all tabs failed: ${error.message}`);
    }
  }

  /**
   * Get current connection status
   * @returns {string} Connection status: 'connected', 'polling', 'disconnected', 'error'
   */
  getStatus() {
    if (!this.stockClient) return 'disconnected';
    if (typeof this.stockClient.getStatus === 'function') {
      return this.stockClient.getStatus();
    }
    return 'unknown';
  }

  /**
   * Get all subscribed product IDs
   * @returns {Array<string>} Array of subscribed product IDs
   */
  getSubscribedProducts() {
    return Array.from(this.subscribedProductIds);
  }

  /**
   * Get cached stock data for a product
   * @param {string} productId - Product UUID
   * @returns {Object|null} Cached stock data or null if not cached
   */
  getCachedProduct(productId) {
    return this.stockCache.get(productId) || null;
  }

  /**
   * Enable debug logging to console
   * @param {boolean} enabled - Enable or disable debug mode
   * @returns {void}
   */
  setDebugMode(enabled = true) {
    this.debugMode = enabled;
    this._log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set custom error callback for handling errors
   * @param {Function} callback - Error handler: (error) => void
   * @returns {void}
   */
  setErrorCallback(callback) {
    if (typeof callback === 'function') {
      this.errorCallback = callback;
    }
  }

  /**
   * Disconnect from SSE and cleanup resources
   * Should be called before page unload
   *
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      this._log('Disconnecting UniversalStockSynchronizer...');

      // Close SSE connection
      if (this.stockClient && typeof this.stockClient.disconnect === 'function') {
        await this.stockClient.disconnect();
      }

      // Clear handlers
      this.pageHandlers.clear();

      // Clear cache
      this.stockCache.clear();

      // Clear subscriptions
      this.subscribedProductIds.clear();

      this.isInitialized = false;
      this._log('UniversalStockSynchronizer disconnected successfully');
    } catch (error) {
      this._error(`Disconnect failed: ${error.message}`);
    }
  }

  /**
   * Log debug message
   * @private
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments to log
   */
  _log(message, ...args) {
    if (this.debugMode || false) { // Set to true to enable logging
      console.log(`[UniversalStockSync] ${message}`, ...args);
    }
  }

  /**
   * Log error message
   * @private
   * @param {string} message - Error message
   * @param {...any} args - Additional arguments to log
   */
  _error(message, ...args) {
    console.error(`[UniversalStockSync] ${message}`, ...args);

    // Call error callback if set
    if (this.errorCallback) {
      try {
        this.errorCallback(new Error(message));
      } catch (e) {
        console.error('Error callback failed:', e);
      }
    }
  }
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UniversalStockSynchronizer };
}
