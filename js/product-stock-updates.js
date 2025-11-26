/**
 * Product Details Page - Real-time Stock Updates
 * Integrates with StockUpdateClient to provide live stock updates via SSE
 *
 * Features:
 * - Real-time stock updates without page refresh
 * - Automatic size button enable/disable based on stock
 * - Stock status badge updates (In Stock, Low Stock, Out of Stock)
 * - Fallback to localStorage if SSE fails
 */

class ProductStockUpdater {
  constructor() {
    this.stockClient = null;
    this.currentProductId = null;
    this.updateCallbacks = [];
    this.initialized = false;
    this.dataSyncBusUnsubscribe = null;

    // Listen for storage events from other tabs
    this._setupStorageListener();
  }

  /**
   * Listen for storage events from other pages/tabs
   * @private
   */
  _setupStorageListener() {
    window.addEventListener('storage', (event) => {
      if (event.key === 'fjl_products' && event.newValue) {
        try {
          const products = JSON.parse(event.newValue);
          const updatedProduct = products.find(p => p.id === this.currentProductId);
          if (updatedProduct && window.currentProduct) {
            console.log(`📡 Storage event: Product ${this.currentProductId} updated from another tab`);
            // Merge the updated product data
            Object.assign(window.currentProduct, updatedProduct);
            // Refresh UI
            this.updateProductUI();
          }
        } catch (error) {
          console.error('Error parsing products from storage event:', error);
        }
      }
    });
  }

  /**
   * Initialize the stock updater for current product
   */
  async init() {
    try {
      // Get current product ID from URL
      const params = new URLSearchParams(window.location.search);
      this.currentProductId = params.get('id');

      // Dynamically import StockUpdateClient
      // Using dynamic import for better code splitting
      const { StockUpdateClient } = await import('./lib/StockUpdateClient.js');

      this.stockClient = new StockUpdateClient();

      // Register callback for stock updates
      this.stockClient.onStockUpdate((data) => {
        this.handleStockUpdate(data);
      });

      // Register callback for initial stock data
      this.stockClient.onInitialStock((data) => {
        this.handleInitialStock(data);
      });

      // Subscribe to current product
      await this.stockClient.subscribe([this.currentProductId]);

      // Also subscribe to DataSyncBus if available (for cross-tab sync)
      if (window.dataSyncBus) {
        this.dataSyncBusUnsubscribe = window.dataSyncBus.onProductUpdate(
          this.currentProductId,
          (data) => {
            console.log(`📡 DataSyncBus update for product ${this.currentProductId}:`, data);
            // Only update if not coming from same source
            if (data && data.productId === this.currentProductId) {
              this._syncToLocalStorage(data);
            }
          }
        );
      }

      this.initialized = true;
      console.log(`✓ Stock updater initialized for product: ${this.currentProductId}`);
    } catch (error) {
      console.warn('⚠️  Failed to initialize real-time stock updates:', error);
      console.log('Falling back to localStorage synchronization');
    }
  }

  /**
   * Handle stock update events from SSE
   */
  handleStockUpdate(data) {
    console.log(`📊 Stock update received for product ${data.productId}:`, data);

    // Update the product data in memory
    if (window.currentProduct && window.currentProduct.id === data.productId) {
      // Update variant stock
      if (window.currentProduct.variants) {
        const variant = window.currentProduct.variants.find(v => v.id === data.variantId);
        if (variant) {
          const oldQuantity = variant.stock_quantity;
          variant.stock_quantity = data.newQuantity;
          console.log(`  ✓ Updated variant ${data.variantId}: ${oldQuantity} → ${data.newQuantity}`);
        }
      }

      // CRITICAL FIX: Recalculate sizeInventory from ALL variants
      // This ensures stale cache is fixed by aggregating correct values
      if (window.currentProduct.variants && Array.isArray(window.currentProduct.variants)) {
        const inventory = {};
        window.currentProduct.variants.forEach(v => {
          const sizeKey = v.size;
          if (!inventory[sizeKey]) {
            inventory[sizeKey] = 0;
          }
          // Sum stock across all colors for this size
          inventory[sizeKey] += (v.stock_quantity || 0);
        });
        window.currentProduct.sizeInventory = inventory;
        console.log(`  ✓ Recalculated sizeInventory:`, inventory);
      }

      // Recalculate total stock from all variants
      if (window.currentProduct.variants && Array.isArray(window.currentProduct.variants)) {
        const totalStock = window.currentProduct.variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
        window.currentProduct.total_stock = totalStock;
        console.log(`  ✓ Recalculated total_stock: ${totalStock} units`);
      }

      // CRITICAL: Sync to localStorage so other pages get notified
      this._syncToLocalStorage(data);

      // Refresh UI
      this.updateProductUI();

      // Trigger custom event for other listeners
      window.dispatchEvent(new CustomEvent('productStockUpdated', {
        detail: data
      }));
    }
  }

  /**
   * Sync product stock update to localStorage and notify other pages
   * @private
   */
  _syncToLocalStorage(data) {
    try {
      // Update the products list in localStorage
      const products = JSON.parse(localStorage.getItem('fjl_products') || '[]');
      const productIndex = products.findIndex(p => p.id === this.currentProductId);

      if (productIndex >= 0) {
        const product = products[productIndex];

        // Update variants with new stock
        if (product.variants && Array.isArray(product.variants)) {
          const variant = product.variants.find(v => v.id === data.variantId);
          if (variant) {
            variant.stock_quantity = data.newQuantity;
          }
        }

        // Recalculate total_stock
        if (product.variants && Array.isArray(product.variants)) {
          product.total_stock = product.variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
        }

        // Save back to localStorage
        localStorage.setItem('fjl_products', JSON.stringify(products));

        console.log(`✅ Updated localStorage for product ${this.currentProductId}`);

        // Dispatch storage event to notify other tabs
        // Create a synthetic storage event for same-origin communication
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'fjl_products',
          newValue: JSON.stringify(products),
          oldValue: null,
          storageArea: localStorage
        }));

        console.log(`📡 Dispatched storage event for product ${this.currentProductId}`);
      }
    } catch (error) {
      console.error('Error syncing to localStorage:', error);
    }
  }

  /**
   * Handle initial stock data
   */
  handleInitialStock(data) {
    console.log(`📦 Initial stock data received for product ${data.productId}:`, data);
    // This is called on first connection, stock data is cached
  }

  /**
   * Update all UI elements based on current product stock
   */
  updateProductUI() {
    if (!window.currentProduct) return;

    const product = window.currentProduct;

    // Update stock status badge
    this.updateStockStatusBadge(product);

    // Update size buttons availability
    this.updateSizeButtons(product);

    // Update add to cart button
    this.updateAddToCartButton(product);
  }

  /**
   * Update the stock status badge (In Stock, Low Stock, Out of Stock)
   */
  updateStockStatusBadge(product) {
    const sizeInventory = product.sizeInventory || {};
    const totalStock = Object.values(sizeInventory).reduce((sum, stock) => sum + stock, 0);
    const hasOverallStock = product.total_stock > 0 || product.inStock === true;
    const actualTotalStock = totalStock > 0 ? totalStock : (hasOverallStock ? (product.total_stock || 1) : 0);

    const stockStatusElement = document.querySelector('.stock-status');
    if (stockStatusElement) {
      if (actualTotalStock <= 0) {
        stockStatusElement.textContent = 'Out of Stock';
        stockStatusElement.className = 'stock-status out-of-stock';
      } else if (actualTotalStock <= 5) {
        stockStatusElement.textContent = 'Limited Stock';
        stockStatusElement.className = 'stock-status low-stock';
      } else {
        stockStatusElement.textContent = 'In Stock';
        stockStatusElement.className = 'stock-status in-stock';
      }
    }
  }

  /**
   * Update size button states based on stock
   */
  updateSizeButtons(product) {
    const sizeInventory = product.sizeInventory || {};

    // Update all size buttons
    const sizeButtons = document.querySelectorAll('.size-btn');
    sizeButtons.forEach(btn => {
      const size = btn.textContent.trim();
      const stockCount = sizeInventory[size] || 0;
      const isOutOfStock = stockCount <= 0;

      if (isOutOfStock) {
        btn.disabled = true;
        btn.classList.add('out-of-stock');
        btn.title = 'This size is no longer available.';
      } else {
        btn.disabled = false;
        btn.classList.remove('out-of-stock');
        btn.title = `${stockCount} left in stock`;
      }
    });
  }

  /**
   * Update add to cart button state
   */
  updateAddToCartButton(product) {
    // Try both selectors for compatibility (.add-to-cart-btn from product.html, [data-action] from other pages)
    const addToCartBtn = document.querySelector('.add-to-cart-btn') ||
                         document.querySelector('[data-action="add-to-cart"]');

    if (addToCartBtn) {
      // Use sizeInventory sum for consistency with product.html calculation
      // This ensures the button state matches the actual available stock
      const sizeInventory = product.sizeInventory || {};
      const totalStock = Object.values(sizeInventory).reduce((sum, stock) => sum + stock, 0);

      if (totalStock <= 0) {
        addToCartBtn.disabled = true;
        addToCartBtn.textContent = 'Out of Stock';
      } else {
        addToCartBtn.disabled = false;
        addToCartBtn.textContent = 'Add to Cart';
      }
    }
  }

  /**
   * Disconnect from SSE and cleanup
   */
  disconnect() {
    if (this.stockClient) {
      this.stockClient.disconnect();
      console.log('✓ Stock updater disconnected');
    }

    // Unsubscribe from DataSyncBus
    if (this.dataSyncBusUnsubscribe) {
      this.dataSyncBusUnsubscribe();
      this.dataSyncBusUnsubscribe = null;
    }
  }

  /**
   * Register a callback for stock updates
   */
  onUpdate(callback) {
    this.updateCallbacks.push(callback);
  }
}

// Initialize stock updater when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeStockUpdater();
  });
} else {
  initializeStockUpdater();
}

/**
 * Initialize the stock updater
 */
async function initializeStockUpdater() {
  try {
    window.productStockUpdater = new ProductStockUpdater();
    await window.productStockUpdater.init();
  } catch (error) {
    console.error('Error initializing stock updater:', error);
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.productStockUpdater) {
    window.productStockUpdater.disconnect();
  }
});
