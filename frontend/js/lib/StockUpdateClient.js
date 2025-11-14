/**
 * Stock Update Client
 * Real-time stock updates using Server-Sent Events (SSE)
 *
 * Usage:
 *   const client = new StockUpdateClient();
 *   client.onStockUpdate((data) => {
 *     console.log(`Product ${data.productId} updated: ${data.newQuantity} units`);
 *   });
 *
 *   // Subscribe to products
 *   client.subscribe(['product-id-1', 'product-id-2']);
 *
 *   // Later, update subscriptions
 *   client.updateSubscriptions(['product-id-1', 'product-id-3']);
 *
 *   // Get current stock for a product
 *   const stock = await client.getProductStock('product-id-1');
 *   console.log(stock); // { variants: [...], totalStock: 100 }
 *
 *   // Cleanup
 *   client.disconnect();
 */

export class StockUpdateClient {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
    this.eventSource = null;
    this.clientId = null;
    this.subscribedProducts = new Set();
    this.stockCache = new Map(); // Local cache of stock data
    this.updateCallbacks = [];
    this.initialStockCallbacks = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // ms
  }

  /**
   * Register callback for stock updates
   * @param {function} callback - Called with { productId, variantId, newQuantity, oldQuantity, timestamp, lowStock }
   */
  onStockUpdate(callback) {
    this.updateCallbacks.push(callback);
  }

  /**
   * Register callback for initial stock data
   * @param {function} callback - Called with { productId, variants, timestamp }
   */
  onInitialStock(callback) {
    this.initialStockCallbacks.push(callback);
  }

  /**
   * Subscribe to stock updates for products
   * @param {string[]} productIds - Array of product IDs to monitor
   */
  async subscribe(productIds = []) {
    if (!Array.isArray(productIds)) {
      console.error('productIds must be an array');
      return;
    }

    // Add to subscription set
    productIds.forEach(id => this.subscribedProducts.add(id));

    // If already connected, update subscriptions on server
    if (this.clientId && this.eventSource) {
      await this.updateSubscriptions(Array.from(this.subscribedProducts));
    } else {
      // Otherwise, establish new connection
      await this.connect();
    }
  }

  /**
   * Update subscriptions to new set of products
   * @param {string[]} productIds - New array of product IDs to monitor
   */
  async updateSubscriptions(productIds = []) {
    this.subscribedProducts = new Set(productIds);

    // If connected, tell server about new subscriptions
    if (this.clientId) {
      try {
        const response = await fetch(`${this.baseUrl}/products/stock/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: this.clientId,
            productIds: Array.from(this.subscribedProducts)
          })
        });

        if (!response.ok) {
          console.error('Failed to update subscriptions:', response.statusText);
        }
      } catch (error) {
        console.error('Error updating subscriptions:', error);
      }
    }
  }

  /**
   * Establish SSE connection
   * @private
   */
  async connect() {
    if (this.eventSource) {
      this.disconnect();
    }

    const productIds = Array.from(this.subscribedProducts);
    const queryString = productIds.length > 0
      ? `?productIds=${productIds.join(',')}`
      : '';

    const url = `${this.baseUrl}/products/stock/subscribe${queryString}`;

    console.log(`🔌 Connecting to stock updates: ${url}`);

    try {
      this.eventSource = new EventSource(url);

      // Handle initial stock data
      this.eventSource.addEventListener('initial_stock', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`📦 Initial stock received for ${data.productId}:`, data.variants);
          this.stockCache.set(data.productId, data.variants);

          // Call callbacks
          this.initialStockCallbacks.forEach(cb => {
            try {
              cb(data);
            } catch (error) {
              console.error('Error in initial_stock callback:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing initial stock data:', error);
        }
      });

      // Handle stock updates
      this.eventSource.addEventListener('stock_update', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`📡 Stock update: ${data.productId} = ${data.newQuantity} units`);

          // Update cache
          this.updateCache(data.productId, data);

          // Call callbacks
          this.updateCallbacks.forEach(cb => {
            try {
              cb(data);
            } catch (error) {
              console.error('Error in update callback:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing stock update:', error);
        }
      });

      // Handle errors
      this.eventSource.addEventListener('error', (event) => {
        console.error('Stock update connection error:', event);
        this.reconnect();
      });

      // Reset reconnect attempts on successful connection
      this.reconnectAttempts = 0;
      console.log('✅ Connected to stock updates');
    } catch (error) {
      console.error('Error establishing stock update connection:', error);
      this.reconnect();
    }
  }

  /**
   * Reconnect with exponential backoff
   * @private
   */
  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Update local stock cache
   * @private
   */
  updateCache(productId, stockData) {
    const cached = this.stockCache.get(productId) || [];
    const variantIndex = cached.findIndex(v => v.id === stockData.variantId);

    if (variantIndex >= 0) {
      cached[variantIndex].stock_quantity = stockData.newQuantity;
    }

    this.stockCache.set(productId, cached);
  }

  /**
   * Get current stock for a product
   * @param {string} productId - Product ID
   * @returns {Promise<object>} { variants: [...], totalStock: number }
   */
  async getProductStock(productId) {
    // First try cache
    const cached = this.stockCache.get(productId);
    if (cached) {
      return {
        variants: cached,
        totalStock: cached.reduce((sum, v) => sum + v.stock_quantity, 0)
      };
    }

    // Fetch from server
    try {
      const response = await fetch(`${this.baseUrl}/products/stock/status?productId=${productId}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        this.stockCache.set(productId, result.data.variants);
        return {
          variants: result.data.variants,
          totalStock: result.data.totalStock
        };
      }

      throw new Error(result.error || 'Unknown error');
    } catch (error) {
      console.error(`Error fetching stock for ${productId}:`, error);
      return { variants: [], totalStock: 0 };
    }
  }

  /**
   * Check if a variant is in stock
   * @param {string} productId - Product ID
   * @param {string} variantId - Variant ID
   * @returns {boolean} True if in stock
   */
  isInStock(productId, variantId) {
    const variants = this.stockCache.get(productId) || [];
    const variant = variants.find(v => v.id === variantId);
    return variant ? variant.stock_quantity > 0 : null;
  }

  /**
   * Check if stock is low (≤ 5 units)
   * @param {string} productId - Product ID
   * @returns {boolean} True if low stock
   */
  isLowStock(productId) {
    const variants = this.stockCache.get(productId) || [];
    return variants.some(v => v.stock_quantity <= 5);
  }

  /**
   * Disconnect from stock updates
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.clientId = null;
      console.log('🔌 Disconnected from stock updates');
    }
  }

  /**
   * Clear all cached stock data
   */
  clearCache() {
    this.stockCache.clear();
  }
}

// Export as default and named export
export default StockUpdateClient;
