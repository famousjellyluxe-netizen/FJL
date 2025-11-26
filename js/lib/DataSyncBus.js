/**
 * Global Data Synchronization Bus (DataSyncBus)
 *
 * Provides cross-page, cross-tab synchronization of product stock data
 * using the EventEmitter pattern. Bridges real-time updates from SSE
 * to all interested listeners across browser tabs and pages.
 *
 * ## Purpose
 *
 * When one browser tab receives a stock update via SSE, it needs to
 * notify all other tabs and pages that are viewing the same product.
 * DataSyncBus handles this using the storage events API.
 *
 * ## Features
 *
 * - **Product Event Subscriptions**: Listen for updates on specific products
 * - **Connection Status Tracking**: Monitor if stock sync is connected/polling/offline
 * - **Cross-Tab Broadcasting**: Notify other tabs via localStorage storage events
 * - **Event Emitter Pattern**: Register callbacks for product updates
 * - **Fallback Mechanism**: Works even if BroadcastChannel API unavailable
 *
 * ## How Cross-Tab Communication Works
 *
 * 1. Tab A receives stock update via SSE
 * 2. Tab A calls `broadcastToAllTabs(productId, data)`
 * 3. DataSyncBus stores update in localStorage as `fjl_sync_{productId}`
 * 4. All other tabs receive `storage` event
 * 5. Other tabs call their handlers with updated stock data
 * 6. UI in all tabs updates simultaneously
 *
 * ## Example Usage
 *
 * ```javascript
 * // DataSyncBus is automatically initialized globally
 * const bus = window.dataSyncBus;
 *
 * // Subscribe to updates for specific products
 * const unsubscribe = bus.onProductUpdate('product-uuid-123', (data) => {
 *   console.log(`Product updated: ${data.productId}`, data);
 *   updateProductUI(data.productId, data.newQuantity);
 * });
 *
 * // Subscribe to multiple products at once
 * bus.onProductUpdate(['product-1', 'product-2', 'product-3'], (data) => {
 *   console.log(`Product ${data.productId} updated`);
 * });
 *
 * // Monitor connection status changes
 * bus.onStatusChange((status) => {
 *   console.log(`Connection status: ${status}`);
 *   // status: 'connected', 'polling', 'disconnected', 'reconnecting'
 *   if (status === 'polling') {
 *     showConnectionWarning();
 *   }
 * });
 *
 * // Get current status
 * console.log(bus.getConnectionStatus()); // 'connected'
 * console.log(bus.getLastUpdateTime());  // Date object
 *
 * // Unsubscribe from updates
 * unsubscribe();
 * ```
 *
 * ## Integration with UniversalStockSynchronizer
 *
 * UniversalStockSynchronizer uses DataSyncBus to:
 * 1. Broadcast updates to other tabs
 * 2. Listen for connection status changes
 * 3. Coordinate cross-tab stock synchronization
 *
 * ## localStorage Key Format
 *
 * Stock updates are stored with keys: `fjl_sync_{productId}`
 * Connection status is stored with key: `fjl_sync_status`
 *
 * Example localStorage entry:
 * ```json
 * {
 *   "productId": "uuid-123",
 *   "variantId": "uuid-456",
 *   "newQuantity": 10,
 *   "oldQuantity": 15,
 *   "size": "M",
 *   "color": "Red",
 *   "syncedAt": "2025-11-26T14:30:00.000Z"
 * }
 * ```
 *
 * @class DataSyncBus
 * @author Claude Code (with phase summaries from implementation)
 * @version 1.0.0
 * @date 2025-11-26
 * @copyright FJL e-commerce platform
 */

class DataSyncBus {
    constructor() {
        this.listeners = new Map(); // Map<eventType, Set<callback>>
        this.connectionStatus = 'idle'; // 'idle', 'connecting', 'connected', 'reconnecting', 'polling'
        this.lastUpdateTime = null;
        this.statusListeners = new Set();

        // Listen for storage events from other tabs
        window.addEventListener('storage', (event) => this._handleStorageEvent(event));

        console.log('📡 DataSyncBus initialized');
    }

    /**
     * Subscribe to product stock updates
     * @param {string|string[]} productIds - Product ID(s) to listen for
     * @param {Function} callback - Called when stock updates: (data) => {}
     * @returns {Function} Unsubscribe function
     */
    onProductUpdate(productIds, callback) {
        const ids = Array.isArray(productIds) ? productIds : [productIds];

        ids.forEach(productId => {
            const eventType = `product:${productId}`;
            if (!this.listeners.has(eventType)) {
                this.listeners.set(eventType, new Set());
            }
            this.listeners.get(eventType).add(callback);
        });

        // Return unsubscribe function
        return () => {
            ids.forEach(productId => {
                const eventType = `product:${productId}`;
                const callbacks = this.listeners.get(eventType);
                if (callbacks) {
                    callbacks.delete(callback);
                    if (callbacks.size === 0) {
                        this.listeners.delete(eventType);
                    }
                }
            });
        };
    }

    /**
     * Subscribe to connection status changes
     * @param {Function} callback - Called on status change: (status) => {}
     * @returns {Function} Unsubscribe function
     */
    onStatusChange(callback) {
        this.statusListeners.add(callback);
        // Immediately call with current status
        callback(this.connectionStatus);

        return () => this.statusListeners.delete(callback);
    }

    /**
     * Emit a product stock update to all listeners
     * @param {string} productId - Product ID
     * @param {Object} data - Stock data (variants, timestamp, etc)
     */
    emitProductUpdate(productId, data) {
        const eventType = `product:${productId}`;
        const callbacks = this.listeners.get(eventType);

        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback({
                        productId,
                        ...data,
                        timestamp: new Date().toISOString()
                    });
                } catch (error) {
                    console.error(`Error in product update callback for ${productId}:`, error);
                }
            });
        }

        this.lastUpdateTime = new Date();
    }

    /**
     * Update connection status and notify listeners
     * @param {string} status - 'idle', 'connecting', 'connected', 'reconnecting', 'polling'
     */
    setConnectionStatus(status) {
        if (this.connectionStatus !== status) {
            this.connectionStatus = status;
            console.log(`📡 DataSyncBus connection status: ${status}`);

            this.statusListeners.forEach(callback => {
                try {
                    callback(status);
                } catch (error) {
                    console.error('Error in status change callback:', error);
                }
            });
        }
    }

    /**
     * Get current connection status
     * @returns {string} Current connection status
     */
    getConnectionStatus() {
        return this.connectionStatus;
    }

    /**
     * Get time of last update
     * @returns {Date|null} Last update timestamp
     */
    getLastUpdateTime() {
        return this.lastUpdateTime;
    }

    /**
     * Handle storage events from other tabs
     * When another tab updates localStorage, it triggers this
     * @private
     */
    _handleStorageEvent(event) {
        // Listen for product updates from other tabs
        if (event.key && event.key.startsWith('fjl_sync_')) {
            try {
                const data = JSON.parse(event.newValue);
                const productId = event.key.replace('fjl_sync_', '');

                console.log(`📡 Storage event received for product ${productId}`);
                this.emitProductUpdate(productId, data);
            } catch (error) {
                console.error('Error parsing storage event:', error);
            }
        }

        // Listen for connection status updates from other tabs
        if (event.key === 'fjl_sync_status') {
            try {
                const { status } = JSON.parse(event.newValue);
                console.log(`📡 Connection status from another tab: ${status}`);
                this.setConnectionStatus(status);
            } catch (error) {
                console.error('Error parsing status from storage:', error);
            }
        }
    }

    /**
     * Broadcast product update to all tabs via storage event
     * This wakes up other browser tabs listening to storage events
     * @param {string} productId - Product ID
     * @param {Object} data - Stock data
     */
    broadcastToAllTabs(productId, data) {
        try {
            localStorage.setItem(
                `fjl_sync_${productId}`,
                JSON.stringify({
                    ...data,
                    syncedAt: new Date().toISOString()
                })
            );
        } catch (error) {
            console.error('Error broadcasting to tabs:', error);
        }
    }

    /**
     * Broadcast connection status to all tabs
     * @param {string} status - Connection status
     */
    broadcastStatusToAllTabs(status) {
        try {
            localStorage.setItem(
                'fjl_sync_status',
                JSON.stringify({ status, timestamp: new Date().toISOString() })
            );
        } catch (error) {
            console.error('Error broadcasting status:', error);
        }
    }

    /**
     * Clear all listeners (for cleanup)
     */
    clear() {
        this.listeners.clear();
        this.statusListeners.clear();
        console.log('📡 DataSyncBus cleared');
    }
}

// Global instance
window.dataSyncBus = new DataSyncBus();

export { DataSyncBus };
