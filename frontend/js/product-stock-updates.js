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

      this.stockClient = new StockUpdateClient('/api');

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
          variant.stock_quantity = data.newQuantity;
        }
      }

      // Update size inventory if available
      if (data.size && window.currentProduct.sizeInventory) {
        window.currentProduct.sizeInventory[data.size] = data.newQuantity;
      }

      // Update total stock
      if (window.currentProduct.total_stock !== undefined) {
        window.currentProduct.total_stock = data.newQuantity;
      }

      // Refresh UI
      this.updateProductUI();

      // Trigger custom event for other listeners
      window.dispatchEvent(new CustomEvent('productStockUpdated', {
        detail: data
      }));
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
      } else if (actualTotalStock <= 10) {
        stockStatusElement.textContent = 'Low Stock';
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
        btn.title = 'Out of stock';
      } else {
        btn.disabled = false;
        btn.classList.remove('out-of-stock');
        btn.title = `${stockCount} available`;
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
   * Disconnect from SSE
   */
  disconnect() {
    if (this.stockClient) {
      this.stockClient.disconnect();
      console.log('✓ Stock updater disconnected');
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
