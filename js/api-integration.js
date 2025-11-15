/**
 * FJL API Integration Manager
 * Handles all backend API calls with:
 * - Automatic retry logic
 * - Offline detection and fallback
 * - Caching for performance
 * - Error handling and recovery
 * - Request deduplication
 */

class APIIntegrationManager {
  constructor() {
    // Determine API URL based on environment
    this.API_URL = this._getAPIUrl();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    this.RETRY_ATTEMPTS = 3;
    this.RETRY_DELAY = 1000; // ms
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.isOnline = navigator.onLine;
    this.requestQueue = [];
  }

  /**
   * Determine API URL based on current hostname
   */
  _getAPIUrl() {
    const hostname = window.location.hostname;

    // For local development
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168')) {
      return 'http://localhost:5001/api';
    }

    // For production on Render
    if (hostname.includes('onrender.com') || hostname.includes('fjl')) {
      return 'https://fjl-backend.onrender.com/api';
    }

    // Fallback to localhost
    return 'http://localhost:5001/api';
  }

    // Listen for online/offline events
    window.addEventListener('online', () => this._handleOnline());
    window.addEventListener('offline', () => this._handleOffline());
  }

  /**
   * Handle coming back online
   */
  _handleOnline() {
    console.log('🌐 Connection restored');
    this.isOnline = true;
    this._processQueue();
  }

  /**
   * Handle going offline
   */
  _handleOffline() {
    console.log('📡 Connection lost');
    this.isOnline = false;
  }

  /**
   * Get cache key
   */
  _getCacheKey(endpoint, options = {}) {
    return `${endpoint}:${JSON.stringify(options)}`;
  }

  /**
   * Get cached data if valid
   */
  _getCached(endpoint, options = {}) {
    const key = this._getCacheKey(endpoint, options);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`✓ Cache hit: ${endpoint}`);
      return cached.data;
    }

    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * Set cache
   */
  _setCache(endpoint, data, options = {}) {
    const key = this._getCacheKey(endpoint, options);
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Deduplicate identical pending requests
   */
  _getPendingRequest(endpoint, options = {}) {
    const key = this._getCacheKey(endpoint, options);
    return this.pendingRequests.get(key);
  }

  /**
   * Store pending request promise
   */
  _setPendingRequest(endpoint, promise, options = {}) {
    const key = this._getCacheKey(endpoint, options);
    this.pendingRequests.set(key, promise);

    promise.finally(() => {
      this.pendingRequests.delete(key);
    });

    return promise;
  }

  /**
   * Core fetch with retry logic
   */
  async _fetchWithRetry(endpoint, options = {}, attempt = 1) {
    try {
      const response = await fetch(`${this.API_URL}${endpoint}`, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: options.signal
      });

      // Check if response is ok
      if (!response.ok) {
        const error = await response.json();
        throw {
          status: response.status,
          message: error.error || `HTTP ${response.status}`,
          details: error.details || [],
          type: 'HTTP_ERROR'
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Network error - retry
      if (!error.type && attempt < this.RETRY_ATTEMPTS) {
        console.warn(`⚠️  Attempt ${attempt} failed, retrying...`);
        await new Promise(resolve =>
          setTimeout(resolve, this.RETRY_DELAY * attempt)
        );
        return this._fetchWithRetry(endpoint, options, attempt + 1);
      }

      // Final error
      throw {
        status: error.status || 0,
        message: error.message || 'Network error',
        details: error.details || [],
        type: error.type || 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Process queued requests when coming online
   */
  async _processQueue() {
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      try {
        const result = await this._fetchWithRetry(request.endpoint, request.options);
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    }
  }

  /**
   * Main API call handler
   */
  async call(endpoint, options = {}, useCache = true) {
    try {
      // Check cache first (for GET requests)
      if (options.method === 'GET' || !options.method) {
        const cached = this._getCached(endpoint, options);
        if (cached) {
          return { success: true, data: cached, fromCache: true };
        }
      }

      // Check for pending identical request
      const pending = this._getPendingRequest(endpoint, options);
      if (pending) {
        return pending;
      }

      // If offline and POST/PUT/DELETE, queue it
      if (!this.isOnline && (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE')) {
        return new Promise((resolve, reject) => {
          this.requestQueue.push({
            endpoint,
            options,
            resolve: (data) => resolve({ success: true, data, queued: true }),
            reject: (error) => reject(error)
          });
        });
      }

      // Make the request
      const promise = this._fetchWithRetry(endpoint, options)
        .then(data => {
          // Cache successful GET requests
          if (!options.method || options.method === 'GET') {
            this._setCache(endpoint, data, options);
          }
          return { success: true, data };
        });

      this._setPendingRequest(endpoint, promise, options);
      return await promise;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.details,
        type: error.type
      };
    }
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.clear();
    console.log('Cache cleared');
  }
}

// Create global instance
window.apiManager = new APIIntegrationManager();

/**
 * PRODUCTS API
 */
const productsAPI = {
  /**
   * Get all products with filters
   */
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiManager.call(`/products${query}`, { method: 'GET' });
  },

  /**
   * Get featured products
   */
  async getFeatured(limit = 6) {
    return apiManager.call(`/products/featured?limit=${limit}`, { method: 'GET' });
  },

  /**
   * Get single product
   */
  async getById(id) {
    return apiManager.call(`/products/${id}`, { method: 'GET' });
  },

  /**
   * Get product variants
   */
  async getVariants(productId) {
    return apiManager.call(`/products/${productId}/variants`, { method: 'GET' });
  }
};

/**
 * ORDERS API
 */
const ordersAPI = {
  /**
   * Create new order
   */
  async create(orderData) {
    return apiManager.call('/orders', {
      method: 'POST',
      body: orderData
    }, false); // Don't cache POST
  },

  /**
   * Get order by ID
   */
  async getById(id) {
    return apiManager.call(`/orders/${id}`, { method: 'GET' });
  },

  /**
   * Get order by order number
   */
  async getByNumber(orderNumber) {
    return apiManager.call(`/orders/number/${orderNumber}`, { method: 'GET' });
  }
};

/**
 * CUSTOMERS API
 */
const customersAPI = {
  /**
   * Register customer
   */
  async register(customerData) {
    return apiManager.call('/customers', {
      method: 'POST',
      body: customerData
    }, false);
  },

  /**
   * Subscribe to newsletter
   */
  async subscribeNewsletter(email, fullName = null, source = 'homepage_modal') {
    return apiManager.call('/customers/members/subscribe', {
      method: 'POST',
      body: { email, full_name: fullName, source }
    }, false);
  }
};

/**
 * NOTIFICATION HELPERS
 */
function showAPIError(message, details = []) {
  console.error('API Error:', message, details);

  if (window.notifications) {
    let errorMsg = message;
    if (details.length > 0) {
      errorMsg += '\n' + details.map(d => d.message || d).join('\n');
    }
    window.notifications.error(errorMsg);
  }
}

function showAPISuccess(message) {
  console.log('API Success:', message);

  if (window.notifications) {
    window.notifications.success(message);
  }
}

/**
 * FALLBACK HANDLER
 */
function useFallbackData(source) {
  console.warn(`⚠️  Using fallback data from ${source}`);

  if (window.notifications) {
    window.notifications.info('Using cached data - some features may be limited');
  }
}

/**
 * Export for use
 */
// Make globals available on window object for non-module usage
window.apiManager = apiManager;
window.productsAPI = productsAPI;
window.ordersAPI = ordersAPI;
window.customersAPI = customersAPI;
window.showAPIError = showAPIError;
window.showAPISuccess = showAPISuccess;
window.useFallbackData = useFallbackData;
