/**
 * API Client for FJL Backend
 * Centralized API communication module
 */

const API_BASE_URL = 'http://localhost:5001/api';

/**
 * Base fetch wrapper with error handling
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  // Add auth token if available
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.error || 'API Error',
        details: data.details || []
      };
    }

    return data;
  } catch (error) {
    if (error.status) {
      throw error;
    }
    throw {
      status: 0,
      message: error.message || 'Network error',
      details: []
    };
  }
}

// ============================================================================
// PRODUCTS API
// ============================================================================

export const productsAPI = {
  /**
   * Get all products with optional filters
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
    return fetchAPI(`/products${query}`);
  },

  /**
   * Get featured products
   */
  async getFeatured(limit = 6) {
    return fetchAPI(`/products/featured?limit=${limit}`);
  },

  /**
   * Get single product by ID
   */
  async getById(id) {
    return fetchAPI(`/products/${id}`);
  },

  /**
   * Get product variants
   */
  async getVariants(productId) {
    return fetchAPI(`/products/${productId}/variants`);
  },

  /**
   * Create product (admin only)
   */
  async create(productData) {
    return fetchAPI('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  /**
   * Update product (admin only)
   */
  async update(id, updateData) {
    return fetchAPI(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  },

  /**
   * Delete product (admin only)
   */
  async delete(id) {
    return fetchAPI(`/products/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Create product variant (admin only)
   */
  async createVariant(productId, variantData) {
    return fetchAPI(`/products/${productId}/variants`, {
      method: 'POST',
      body: JSON.stringify(variantData)
    });
  },

  /**
   * Update variant stock (admin only)
   */
  async updateVariantStock(productId, variantId, stockQuantity) {
    return fetchAPI(`/products/${productId}/variants/${variantId}`, {
      method: 'PUT',
      body: JSON.stringify({ stock_quantity: stockQuantity })
    });
  }
};

// ============================================================================
// ORDERS API
// ============================================================================

export const ordersAPI = {
  /**
   * Create new order (public)
   */
  async create(orderData) {
    return fetchAPI('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },

  /**
   * Get order by ID (public)
   */
  async getById(id) {
    return fetchAPI(`/orders/${id}`);
  },

  /**
   * Get order by order number (public)
   */
  async getByNumber(orderNumber) {
    return fetchAPI(`/orders/number/${orderNumber}`);
  },

  /**
   * List all orders (admin only)
   */
  async list(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.payment_status) params.append('payment_status', filters.payment_status);
    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/orders${query}`);
  },

  /**
   * Update order status (admin only)
   */
  async updateStatus(id, status) {
    return fetchAPI(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  /**
   * Update payment status (admin only)
   */
  async updatePaymentStatus(id, paymentStatus) {
    return fetchAPI(`/orders/${id}/payment-status`, {
      method: 'PUT',
      body: JSON.stringify({ payment_status: paymentStatus })
    });
  },

  /**
   * Cancel order (admin only)
   */
  async cancel(id) {
    return fetchAPI(`/orders/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Get customer order history (admin only)
   */
  async getCustomerOrders(userId, filters = {}) {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/orders/customer/${userId}${query}`);
  }
};

// ============================================================================
// CUSTOMERS API
// ============================================================================

export const customersAPI = {
  /**
   * Register new customer (public)
   */
  async register(customerData) {
    return fetchAPI('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData)
    });
  },

  /**
   * Get customer by ID (admin only)
   */
  async getById(id) {
    return fetchAPI(`/customers/${id}`);
  },

  /**
   * List all customers (admin only)
   */
  async list(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/customers${query}`);
  },

  /**
   * Update customer (admin only)
   */
  async update(id, updateData) {
    return fetchAPI(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  },

  /**
   * Delete customer (admin only)
   */
  async delete(id) {
    return fetchAPI(`/customers/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Get customer orders (admin only)
   */
  async getOrders(userId, filters = {}) {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/customers/${userId}/orders${query}`);
  },

  /**
   * Subscribe to newsletter (public)
   */
  async subscribeNewsletter(email, fullName = null, source = 'homepage_modal') {
    return fetchAPI('/customers/members/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        email,
        full_name: fullName,
        source
      })
    });
  },

  /**
   * List newsletter members (admin only)
   */
  async listMembers(filters = {}) {
    const params = new URLSearchParams();
    if (filters.subscribed !== undefined) params.append('subscribed', filters.subscribed);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/customers/members/list${query}`);
  },

  /**
   * Unsubscribe member (admin only)
   */
  async unsubscribeMember(id) {
    return fetchAPI(`/customers/members/${id}/unsubscribe`, {
      method: 'PUT',
      body: JSON.stringify({})
    });
  }
};

// ============================================================================
// AUTHENTICATION API
// ============================================================================

export const authAPI = {
  /**
   * Admin login
   */
  async login(email, password) {
    const response = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (response.data && response.data.token) {
      localStorage.setItem('adminToken', response.data.token);
    }

    return response;
  },

  /**
   * Verify token
   */
  async verify() {
    return fetchAPI('/auth/verify');
  },

  /**
   * Logout
   */
  async logout() {
    const response = await fetchAPI('/auth/logout', {
      method: 'POST'
    });

    localStorage.removeItem('adminToken');
    return response;
  },

  /**
   * Change password
   */
  async changePassword(currentPassword, newPassword, confirmPassword) {
    return fetchAPI('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      })
    });
  },

  /**
   * Get stored token
   */
  getToken() {
    return localStorage.getItem('adminToken');
  },

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    return !!localStorage.getItem('adminToken');
  }
};

/**
 * Show API error notification
 */
export function showAPIError(error) {
  const message = error.message || 'An error occurred';
  const details = error.details || [];

  console.error('API Error:', message, details);

  // You can integrate with your notification system here
  if (typeof showNotification === 'function') {
    showNotification(message, 'error');
  }

  return { message, details };
}

/**
 * Show API success notification
 */
export function showAPISuccess(message) {
  console.log('API Success:', message);

  if (typeof showNotification === 'function') {
    showNotification(message, 'success');
  }
}

export default {
  productsAPI,
  ordersAPI,
  customersAPI,
  authAPI,
  showAPIError,
  showAPISuccess,
  fetchAPI
};
