/**
 * Global Data Synchronization Bus
 *
 * Provides cross-page, cross-tab synchronization of product stock data
 * via EventEmitter pattern. Used by SSE client to broadcast stock updates
 * to all pages listening to the same products.
 *
 * Features:
 * - Subscribe/unsubscribe to product updates
 * - Cross-tab communication via storage events
 * - Wildcard subscriptions
 * - Connection status tracking
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
