/**
 * Checkout Page Integration
 * Handles order creation with backend API and fallback to localStorage
 */

(function() {
  'use strict';

  /**
   * Prepare order data from checkout form and cart
   */
  function prepareOrderData(formData, cart) {
    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => sum + item.total_price, 0);
    const taxRate = 0.075; // 7.5%
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const shippingCost = 0; // Free shipping
    const totalAmount = subtotal + tax + shippingCost;

    // Prepare order items
    const items = cart.items.map(item => ({
      product_id: item.id,
      product_name: item.name,
      product_sku: item.sku || `SKU-${item.id.substring(0, 8)}`,
      size: item.size,
      color: item.color || null,
      unit_price: item.price,
      quantity: item.quantity,
      total_price: item.total_price,
      variant_id: item.variant_id || null
    }));

    // Build order data
    const orderData = {
      items: items,
      shipping_email: formData.email,
      shipping_first_name: formData.first_name,
      shipping_last_name: formData.last_name,
      shipping_phone: formData.phone,
      shipping_address: formData.address,
      shipping_city: formData.city,
      shipping_state: formData.state,
      shipping_postal_code: formData.postal_code,
      shipping_country: formData.country,
      buyer_name: `${formData.first_name} ${formData.last_name}`,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: tax,
      shipping_cost: shippingCost,
      total_amount: Math.round(totalAmount * 100) / 100,
      payment_method: 'bank_transfer'
    };

    return orderData;
  }

  /**
   * Generate temporary order number (for offline fallback)
   */
  function generateOrderNumber() {
    const timestamp = Date.now().toString().slice(-7);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `FJL-${timestamp}${random}`;
  }

  /**
   * Create order via API with fallback to localStorage
   */
  window.createOrderWithAPI = async function(formData, cart) {
    console.log('📝 Creating order...');

    // Prepare order data
    const orderData = prepareOrderData(formData, cart);

    try {
      // Try API first
      const result = await apiManager.call('/orders', {
        method: 'POST',
        body: orderData
      }, false);

      if (result.success && result.data) {
        const order = result.data;
        console.log(`✅ Order created: ${order.order_number}`);

        // Store order in localStorage for offline access
        const orders = JSON.parse(localStorage.getItem('fjl_orders') || '[]');
        orders.push(order);
        localStorage.setItem('fjl_orders', JSON.stringify(orders));

        // Clear cart
        localStorage.removeItem('fjl_cart');
        if (window.cart) {
          window.cart.clear();
        }

        return {
          success: true,
          order: order,
          orderNumber: order.order_number,
          method: 'api'
        };
      }

      // API error - use fallback
      if (result.error && !apiManager.isOnline) {
        console.warn('⚠️  Offline - queuing order for later');
        return createOrderFallback(orderData);
      }

      throw new Error(result.error || 'Unknown error');
    } catch (error) {
      console.error('❌ Error creating order:', error);

      // Show detailed error
      if (window.notifications) {
        if (error.details && error.details.length > 0) {
          const detailMsg = error.details.map(d => d.message).join('\n');
          window.notifications.error(`Order failed:\n${detailMsg}`);
        } else {
          window.notifications.error(`Order failed: ${error.message}`);
        }
      }

      // Fallback to localStorage
      if (!apiManager.isOnline) {
        console.warn('⚠️  Using offline order creation');
        return createOrderFallback(orderData);
      }

      throw error;
    }
  };

  /**
   * Create order in localStorage as fallback
   */
  function createOrderFallback(orderData) {
    const orderNumber = generateOrderNumber();

    const order = {
      id: `local-${Date.now()}`,
      order_number: orderNumber,
      ...orderData,
      order_status: 'pending',
      payment_status: 'pending',
      created_at: new Date().toISOString(),
      offline: true
    };

    // Save to localStorage
    const orders = JSON.parse(localStorage.getItem('fjl_orders') || '[]');
    orders.push(order);
    localStorage.setItem('fjl_orders', JSON.stringify(orders));

    console.log(`📦 Order saved offline: ${orderNumber}`);

    if (window.notifications) {
      window.notifications.info(
        `Order saved offline. It will be sent to our server when you go online.`
      );
    }

    // Clear cart
    localStorage.removeItem('fjl_cart');
    if (window.cart) {
      window.cart.clear();
    }

    return {
      success: true,
      order: order,
      orderNumber: orderNumber,
      method: 'offline',
      queued: true
    };
  }

  /**
   * Validate order data
   */
  window.validateOrderData = function(formData, cart) {
    const errors = [];

    // Validate form fields
    if (!formData.first_name?.trim()) errors.push('First name is required');
    if (!formData.last_name?.trim()) errors.push('Last name is required');
    if (!formData.email?.trim()) errors.push('Email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.push('Invalid email format');
    if (!formData.phone?.trim()) errors.push('Phone number is required');
    if (!formData.address?.trim()) errors.push('Address is required');
    if (!formData.city?.trim()) errors.push('City is required');
    if (!formData.state?.trim()) errors.push('State is required');
    if (!formData.postal_code?.trim()) errors.push('Postal code is required');
    if (!formData.country?.trim()) errors.push('Country is required');

    // Validate cart
    if (!cart.items || cart.items.length === 0) {
      errors.push('Cart is empty');
    }

    if (errors.length > 0) {
      if (window.notifications) {
        window.notifications.error(
          'Please fix the following errors:\n' + errors.join('\n')
        );
      }
      return false;
    }

    return true;
  };

  /**
   * Process queued offline orders when coming online
   */
  async function processOfflineOrders() {
    const orders = JSON.parse(localStorage.getItem('fjl_orders') || '[]');
    const offlineOrders = orders.filter(o => o.offline === true);

    if (offlineOrders.length === 0) {
      return;
    }

    console.log(`📤 Processing ${offlineOrders.length} offline orders...`);

    for (const order of offlineOrders) {
      try {
        // Remove offline flag and temp ID
        const { id, offline, ...orderData } = order;

        // Try to create order on server
        const result = await apiManager.call('/orders', {
          method: 'POST',
          body: orderData
        }, false);

        if (result.success) {
          console.log(`✅ Synced order: ${order.order_number}`);

          // Update in localStorage with server version
          const updatedOrders = orders.filter(o => o.id !== order.id);
          updatedOrders.push(result.data);
          localStorage.setItem('fjl_orders', JSON.stringify(updatedOrders));

          if (window.notifications) {
            window.notifications.success(
              `Order ${order.order_number} synced with server`
            );
          }
        }
      } catch (error) {
        console.error('Error syncing order:', error);
      }
    }
  }

  /**
   * Initialize checkout integration
   */
  window.initializeCheckoutIntegration = function() {
    // Process offline orders when coming online
    window.addEventListener('online', processOfflineOrders);

    // Process any pending offline orders
    if (apiManager.isOnline) {
      processOfflineOrders();
    }
  };

  // Auto-initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initializeCheckoutIntegration);
  } else {
    window.initializeCheckoutIntegration();
  }
})();
