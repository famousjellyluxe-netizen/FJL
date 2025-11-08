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
    console.log('Cart items:', cart.items);

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => sum + (item.total_price || item.price * item.quantity), 0);
    const taxRate = 0.075; // 7.5%
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const shippingCost = 0; // Free shipping
    const totalAmount = subtotal + tax + shippingCost;

    // Get products from localStorage to find variant_id
    let products = [];
    const storedProducts = localStorage.getItem('fjl_products');
    if (storedProducts) {
      try {
        products = JSON.parse(storedProducts);
      } catch (e) {
        console.warn('Error parsing products:', e);
      }
    }

    // Prepare order items - find variant_id and ensure uniqueness
    const items = cart.items.map((item, index) => {
      // Find the product to get variant info
      const product = products.find(p => p.id === item.id);

      // Find the matching variant
      let variantId = item.variant_id;
      if (!variantId && product && product.variants && Array.isArray(product.variants)) {
        const matchingVariant = product.variants.find(v =>
          v.size === item.size &&
          (!item.color || v.color === item.color)
        );
        if (matchingVariant) {
          variantId = matchingVariant.id;
        }
      }

      // Generate unique SKU if not provided
      let sku = item.sku;
      if (!sku) {
        // Create SKU from product ID + size + color + index to ensure uniqueness
        const sizeStr = item.size ? item.size.substring(0, 2).toUpperCase() : 'XX';
        const colorStr = item.color ? item.color.substring(0, 2).toUpperCase() : 'XX';
        sku = `SKU-${item.id.substring(0, 6)}-${sizeStr}-${colorStr}-${index}`;
      }

      return {
        product_id: item.id,
        product_name: item.name,
        product_sku: sku,
        size: item.size || null,
        color: item.color || null,
        unit_price: item.price || 0,
        quantity: item.quantity || 1,
        total_price: item.total_price || (item.price * item.quantity),
        variant_id: variantId || null
      };
    });

    console.log('Prepared order items:', JSON.stringify(items, null, 2));
    console.log('Variant IDs found:', items.map(i => ({ sku: i.product_sku, variantId: i.variant_id })));

    // Handle form field names - check both with and without "shipping_" prefix
    const firstName = formData.shipping_first_name || formData.first_name;
    const lastName = formData.shipping_last_name || formData.last_name;
    const email = formData.shipping_email || formData.email;
    const phone = formData.shipping_phone || formData.phone;
    const address = formData.shipping_address || formData.address;
    const city = formData.shipping_city || formData.city;
    const state = formData.shipping_state || formData.state;
    const postalCode = formData.shipping_postal_code || formData.postal_code;
    const country = formData.shipping_country || formData.country;
    const buyerName = formData.buyer_name || `${firstName} ${lastName}`;

    // Build order data
    const orderData = {
      items: items,
      shipping_email: email,
      shipping_first_name: firstName,
      shipping_last_name: lastName,
      shipping_phone: phone,
      shipping_address: address,
      shipping_city: city,
      shipping_state: state,
      shipping_postal_code: postalCode,
      shipping_country: country,
      buyer_name: buyerName,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: tax,
      shipping_cost: shippingCost,
      total_amount: Math.round(totalAmount * 100) / 100,
      payment_method: 'bank_transfer'
    };

    console.log('📦 Complete order data:', JSON.stringify(orderData, null, 2));
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
        // Handle both direct order object and wrapped API response
        let order = result.data;
        if (order.data && order.data.order_number) {
          // Response is wrapped: { success: true, message: "...", data: order }
          order = order.data;
        }

        console.log(`✅ Order created: ${order.order_number}`);
        console.log('Order details:', order);

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
      console.log('Order data sent:', orderData);

      // Show detailed error
      if (window.notifications) {
        if (error.details && error.details.length > 0) {
          const detailMsg = error.details.map(d => d.message || d).join('\n');
          window.notifications.error(`Order failed:\n${detailMsg}`);
        } else if (error.message) {
          window.notifications.error(`Order failed: ${error.message}`);
        } else {
          window.notifications.error('Failed to create order. Please check your information and try again.');
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

    // Validate form fields - check both with and without "shipping_" prefix
    const firstName = formData.shipping_first_name || formData.first_name;
    const lastName = formData.shipping_last_name || formData.last_name;
    const email = formData.shipping_email || formData.email;
    const phone = formData.shipping_phone || formData.phone;
    const address = formData.shipping_address || formData.address;
    const city = formData.shipping_city || formData.city;
    const state = formData.shipping_state || formData.state;
    const postalCode = formData.shipping_postal_code || formData.postal_code;
    const country = formData.shipping_country || formData.country;

    if (!firstName?.trim()) errors.push('First name is required');
    if (!lastName?.trim()) errors.push('Last name is required');
    if (!email?.trim()) errors.push('Email is required');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format');
    if (!phone?.trim()) errors.push('Phone number is required');
    if (!address?.trim()) errors.push('Address is required');
    if (!city?.trim()) errors.push('City is required');
    if (!state?.trim()) errors.push('State is required');
    if (!postalCode?.trim()) errors.push('Postal code is required');
    if (!country?.trim()) errors.push('Country is required');

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
      console.log('Validation errors:', errors);
      console.log('Form data received:', formData);
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
