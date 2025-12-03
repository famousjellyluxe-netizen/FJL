/**
 * FJL Admin Panel - API Service Layer
 * Centralized API communication with existing backend
 * Handles authentication, error handling, and request management
 */

// Get API base URL from environment or config
const API_BASE_URL = window.location.origin.includes('localhost')
    ? 'http://localhost:5001/api'
    : 'https://fjl-backend.onrender.com/api';

/**
 * API Client - Core fetch wrapper with error handling
 */
class APIClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }

    /**
     * Get auth token from localStorage
     * Checks both 'adminToken' and 'fjl_admin_token' for compatibility
     */
    getAuthToken() {
        // Check new format first, then fallback to old format
        return localStorage.getItem('adminToken') || localStorage.getItem('fjl_admin_token');
    }

    /**
     * Set auth token in localStorage
     * Uses the standard 'adminToken' key
     */
    setAuthToken(token) {
        if (token) {
            localStorage.setItem('adminToken', token);
        } else {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('fjl_admin_token');
        }
    }

    /**
     * Build headers with auth token
     */
    buildHeaders(customHeaders = {}) {
        const headers = { ...this.defaultHeaders, ...customHeaders };
        const token = this.getAuthToken();

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    /**
     * Handle API errors
     */
    async handleError(response, body) {
        let errorMessage = 'An error occurred';

        try {
            if (response.status === 401) {
                // Unauthorized - clear token and redirect to login
                // Use a flag to prevent multiple redirects
                if (!window._redirectingToLogin) {
                    window._redirectingToLogin = true;
                    this.setAuthToken(null);
                    setTimeout(() => {
                        window.location.href = '/admin/index.html';
                    }, 100);
                }
                return;
            }

            if (response.status === 403) {
                errorMessage = 'You do not have permission to perform this action';
            } else if (response.status === 404) {
                errorMessage = 'Resource not found';
            } else if (response.status === 422) {
                // Validation error - extract field errors
                const data = typeof body === 'string' ? JSON.parse(body) : body;
                errorMessage = data.message || 'Validation failed';
            } else if (response.status >= 500) {
                errorMessage = 'Server error. Please try again later.';
            } else if (typeof body === 'string') {
                const data = JSON.parse(body);
                errorMessage = data.message || data.error || errorMessage;
            } else {
                errorMessage = body.message || body.error || errorMessage;
            }
        } catch (e) {
            console.error('Error parsing error response:', e);
        }

        throw new Error(errorMessage);
    }

    /**
     * Make HTTP request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method: options.method || 'GET',
            headers: this.buildHeaders(options.headers),
            ...options,
        };

        // Remove headers from options to avoid duplication
        if (config.headers === options.headers) {
            delete options.headers;
        }

        try {
            const response = await fetch(url, config);
            const contentType = response.headers.get('content-type');
            const body = contentType?.includes('application/json')
                ? await response.json()
                : await response.text();

            if (!response.ok) {
                await this.handleError(response, body);
            }

            return body;
        } catch (error) {
            console.error(`API Request failed: ${config.method} ${endpoint}`, error);
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    /**
     * PATCH request
     */
    async patch(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

/**
 * Initialize API Client
 */
const apiClient = new APIClient();

/**
 * Product Service - Manage products
 */
const productService = {
    /**
     * Get all products with optional filters
     */
    getProducts: (filters = {}) => {
        const params = new URLSearchParams(filters);
        return apiClient.get(`/products?${params.toString()}`);
    },

    /**
     * Get single product by ID
     */
    getProduct: (id) => {
        return apiClient.get(`/products/${id}`);
    },

    /**
     * Create new product
     */
    createProduct: (data) => {
        return apiClient.post('/products', data);
    },

    /**
     * Update product
     */
    updateProduct: (id, data) => {
        return apiClient.put(`/products/${id}`, data);
    },

    /**
     * Delete product
     */
    deleteProduct: (id) => {
        return apiClient.delete(`/products/${id}`);
    },

    /**
     * Get featured products
     */
    getFeaturedProducts: () => {
        return apiClient.get('/products/featured');
    },

    /**
     * Update product stock
     */
    updateStock: (id, quantity) => {
        return apiClient.patch(`/products/${id}`, { stock: quantity });
    },

    /**
     * Bulk delete products
     */
    bulkDelete: (ids) => {
        return apiClient.post('/products/bulk-delete', { ids });
    },
};

/**
 * Category Service - Manage categories
 */
const categoryService = {
    /**
     * Get all categories
     */
    getCategories: (filters = {}) => {
        const params = new URLSearchParams(filters);
        return apiClient.get(`/categories?${params.toString()}`);
    },

    /**
     * Get single category
     */
    getCategory: (id) => {
        return apiClient.get(`/categories/${id}`);
    },

    /**
     * Create category
     */
    createCategory: (data) => {
        return apiClient.post('/categories', data);
    },

    /**
     * Update category
     */
    updateCategory: (id, data) => {
        return apiClient.put(`/categories/${id}`, data);
    },

    /**
     * Delete category
     */
    deleteCategory: (id) => {
        return apiClient.delete(`/categories/${id}`);
    },
};

/**
 * Order Service - Manage orders
 */
const orderService = {
    /**
     * Get all orders with filters
     */
    getOrders: (filters = {}) => {
        const params = new URLSearchParams(filters);
        return apiClient.get(`/orders?${params.toString()}`);
    },

    /**
     * Get single order
     */
    getOrder: (id) => {
        return apiClient.get(`/orders/${id}`);
    },

    /**
     * Create order
     */
    createOrder: (data) => {
        return apiClient.post('/orders', data);
    },

    /**
     * Update order
     */
    updateOrder: (id, data) => {
        return apiClient.put(`/orders/${id}`, data);
    },

    /**
     * Update order status
     */
    updateOrderStatus: (id, status) => {
        return apiClient.patch(`/orders/${id}`, { status });
    },

    /**
     * Get order statistics
     */
    getStats: () => {
        return apiClient.get('/orders/stats');
    },

    /**
     * Delete order
     */
    deleteOrder: (id) => {
        return apiClient.delete(`/orders/${id}`);
    },
};

/**
 * Customer Service - Manage customers
 */
const customerService = {
    /**
     * Get all customers
     */
    getCustomers: (filters = {}) => {
        const params = new URLSearchParams(filters);
        return apiClient.get(`/customers?${params.toString()}`);
    },

    /**
     * Get single customer
     */
    getCustomer: (id) => {
        return apiClient.get(`/customers/${id}`);
    },

    /**
     * Create customer
     */
    createCustomer: (data) => {
        return apiClient.post('/customers', data);
    },

    /**
     * Update customer
     */
    updateCustomer: (id, data) => {
        return apiClient.put(`/customers/${id}`, data);
    },

    /**
     * Delete customer
     */
    deleteCustomer: (id) => {
        return apiClient.delete(`/customers/${id}`);
    },

    /**
     * Get customer order history
     */
    getOrderHistory: (customerId) => {
        return apiClient.get(`/customers/${customerId}/orders`);
    },

    /**
     * Subscribe to newsletter
     */
    subscribeNewsletter: (customerId) => {
        return apiClient.post(`/customers/${customerId}/newsletter`);
    },

    /**
     * Unsubscribe from newsletter
     */
    unsubscribeNewsletter: (customerId) => {
        return apiClient.delete(`/customers/${customerId}/newsletter`);
    },
};

/**
 * Settings Service - Manage admin settings
 */
const settingsService = {
    /**
     * Get all settings from database
     */
    getSettings: () => {
        return apiClient.get('/settings');
    },

    /**
     * Update all settings in database
     */
    updateSettings: (data) => {
        return apiClient.put('/settings', data);
    },

    /**
     * Get store settings
     */
    getStoreSettings: () => {
        return apiClient.get('/settings/store');
    },

    /**
     * Update store settings
     */
    updateStoreSettings: (data) => {
        return apiClient.put('/settings/store', data);
    },

    /**
     * Get bank settings
     */
    getBankSettings: () => {
        return apiClient.get('/settings/bank');
    },

    /**
     * Update bank settings
     */
    updateBankSettings: (data) => {
        return apiClient.put('/settings/bank', data);
    },

    /**
     * Change password
     */
    changePassword: (currentPassword, newPassword) => {
        return apiClient.put('/settings/password', { currentPassword, newPassword });
    },

    /**
     * Get system info
     */
    getSystemInfo: () => {
        return apiClient.get('/settings/system');
    },
};

/**
 * Dashboard Service - Get dashboard data
 */
const dashboardService = {
    /**
     * Get dashboard summary stats
     */
    getSummary: () => {
        return apiClient.get('/dashboard/summary');
    },

    /**
     * Get recent activity
     */
    getActivity: (limit = 10) => {
        return apiClient.get(`/dashboard/activity?limit=${limit}`);
    },

    /**
     * Get revenue data
     */
    getRevenue: (period = 'month') => {
        return apiClient.get(`/dashboard/revenue?period=${period}`);
    },

    /**
     * Get sales by category
     */
    getSalesByCategory: () => {
        return apiClient.get('/dashboard/sales-by-category');
    },

    /**
     * Get top products
     */
    getTopProducts: (limit = 5) => {
        return apiClient.get(`/dashboard/top-products?limit=${limit}`);
    },
};

/**
 * Export services for use in admin pages
 */
window.apiServices = {
    apiClient,
    productService,
    categoryService,
    orderService,
    customerService,
    settingsService,
    dashboardService,
};

/**
 * Utility function for showing errors
 */
function showError(message) {
    console.error(message);
    // TODO: Integrate with notification system
    alert(`Error: ${message}`);
}

/**
 * Utility function for showing success
 */
function showSuccess(message) {
    console.log(message);
    // TODO: Integrate with notification system
}

/**
 * Utility function to format API errors
 */
function formatError(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return !!apiClient.getAuthToken();
}

/**
 * Redirect to login if not authenticated
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/admin/index.html';
    }
}

// Export utilities and client
window.apiUtils = {
    showError,
    showSuccess,
    formatError,
    isAuthenticated,
    requireAuth,
};

// Export API client and services globally
window.apiClient = apiClient;
window.apiServices = {
    productService,
    categoryService,
    orderService,
    customerService,
    settingsService,
    dashboardService
};

// Also export APIClient class for direct instantiation if needed
window.APIClient = APIClient;
