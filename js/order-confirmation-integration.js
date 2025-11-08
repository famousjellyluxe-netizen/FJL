/**
 * Order Confirmation Page Integration
 * Displays order details from API or localStorage with real-time updates
 */

(function() {
  'use strict';

  /**
   * Get order from API or localStorage
   */
  async function getOrder(orderIdOrNumber) {
    console.log(`🔍 Loading order: ${orderIdOrNumber}`);

    try {
      // Determine if it's an ID or order number
      const isOrderNumber = orderIdOrNumber.includes('-') || orderIdOrNumber.startsWith('FJL');

      // Try API first
      let result;
      if (isOrderNumber) {
        result = await apiManager.call(`/orders/number/${orderIdOrNumber}`, { method: 'GET' });
      } else {
        result = await apiManager.call(`/orders/${orderIdOrNumber}`, { method: 'GET' });
      }

      if (result.success && result.data) {
        console.log(`✅ Loaded order from API: ${result.data.order_number}`);

        // Cache in localStorage
        const orders = JSON.parse(localStorage.getItem('fjl_orders') || '[]');
        const existingIndex = orders.findIndex(o =>
          o.id === result.data.id || o.order_number === result.data.order_number
        );

        if (existingIndex >= 0) {
          orders[existingIndex] = result.data;
        } else {
          orders.push(result.data);
        }

        localStorage.setItem('fjl_orders', JSON.stringify(orders));

        return {
          order: result.data,
          source: 'api'
        };
      }

      // API failed, use fallback
      console.warn('⚠️  API unavailable, using localStorage');
      return getOrderFallback(orderIdOrNumber);
    } catch (error) {
      console.error('Error fetching order from API:', error);

      if (error.type === 'NETWORK_ERROR') {
        console.log('📡 Offline - using cached order');
      }

      return getOrderFallback(orderIdOrNumber);
    }
  }

  /**
   * Get order from localStorage
   */
  function getOrderFallback(orderIdOrNumber) {
    const orders = JSON.parse(localStorage.getItem('fjl_orders') || '[]');

    let order = orders.find(o =>
      o.id === orderIdOrNumber ||
      o.order_number === orderIdOrNumber ||
      o.order_number === `FJL${orderIdOrNumber}`
    );

    if (order) {
      console.log(`📦 Loaded order from cache: ${order.order_number}`);
      return { order, source: 'cache' };
    }

    console.error('❌ Order not found');
    return { order: null, source: 'none' };
  }

  /**
   * Format order data for display
   */
  function formatOrderForDisplay(order) {
    if (!order) return null;

    return {
      ...order,
      // Format amounts
      subtotalDisplay: `₦${(order.subtotal || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      taxDisplay: `₦${(order.tax || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      shippingDisplay: `₦${(order.shipping_cost || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      totalDisplay: `₦${(order.total_amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,

      // Format dates
      orderDate: order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown',
      paidDate: order.paid_at ? new Date(order.paid_at).toLocaleDateString() : 'Pending',
      shippedDate: order.shipped_at ? new Date(order.shipped_at).toLocaleDateString() : 'Not shipped',

      // Status badges
      orderStatusBadge: formatStatusBadge(order.order_status),
      paymentStatusBadge: formatStatusBadge(order.payment_status),

      // Full name
      customerName: `${order.shipping_first_name} ${order.shipping_last_name}`,

      // Shipping address
      shippingAddress: `${order.shipping_address}\n${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}\n${order.shipping_country}`,

      // Items
      items: (order.order_items || []).map(item => ({
        ...item,
        priceDisplay: `₦${item.unit_price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        totalDisplay: `₦${item.total_price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
      }))
    };
  }

  /**
   * Format status badge
   */
  function formatStatusBadge(status) {
    const badges = {
      pending: { class: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      processing: { class: 'bg-blue-100 text-blue-800', text: 'Processing' },
      shipped: { class: 'bg-purple-100 text-purple-800', text: 'Shipped' },
      delivered: { class: 'bg-green-100 text-green-800', text: 'Delivered' },
      cancelled: { class: 'bg-red-100 text-red-800', text: 'Cancelled' },
      verified: { class: 'bg-green-100 text-green-800', text: 'Verified' },
      failed: { class: 'bg-red-100 text-red-800', text: 'Failed' }
    };

    return badges[status] || badges.pending;
  }

  /**
   * Subscribe to order updates via polling
   */
  async function subscribeToOrderUpdates(orderNumber) {
    if (!apiManager.isOnline) {
      return;
    }

    // Poll for updates every 30 seconds
    const interval = setInterval(async () => {
      try {
        const result = await apiManager.call(`/orders/number/${orderNumber}`, { method: 'GET' });

        if (result.success && result.data) {
          // Update localStorage
          const orders = JSON.parse(localStorage.getItem('fjl_orders') || '[]');
          const index = orders.findIndex(o => o.order_number === orderNumber);

          if (index >= 0) {
            const oldOrder = orders[index];
            const newOrder = result.data;

            // Check for status changes
            if (oldOrder.order_status !== newOrder.order_status) {
              console.log(`📢 Order status changed: ${newOrder.order_status}`);

              if (window.notifications) {
                const messages = {
                  processing: 'Your order is being processed',
                  shipped: 'Your order has been shipped!',
                  delivered: 'Your order has been delivered!',
                  cancelled: 'Your order has been cancelled'
                };

                window.notifications.success(
                  messages[newOrder.order_status] || 'Order status updated'
                );
              }
            }

            if (oldOrder.payment_status !== newOrder.payment_status) {
              console.log(`💳 Payment status changed: ${newOrder.payment_status}`);

              if (window.notifications && newOrder.payment_status === 'verified') {
                window.notifications.success('Your payment has been verified!');
              }
            }

            // Update order
            orders[index] = newOrder;
            localStorage.setItem('fjl_orders', JSON.stringify(orders));

            // Trigger display update
            if (window.displayOrderConfirmation) {
              window.displayOrderConfirmation(newOrder);
            }
          }
        }
      } catch (error) {
        console.error('Error polling for updates:', error);
      }
    }, 30000); // Every 30 seconds

    // Stop polling when page unloads
    window.addEventListener('beforeunload', () => clearInterval(interval));

    return interval;
  }

  /**
   * Initialize order confirmation page
   */
  window.initializeOrderConfirmation = async function() {
    // Get order from URL
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('id') || params.get('order_id');
    const orderNumber = params.get('order') || params.get('order_number');

    const identifier = orderId || orderNumber;

    if (!identifier) {
      console.error('No order identifier found');
      if (window.notifications) {
        window.notifications.error('Order not found');
      }
      return;
    }

    // Load order
    const { order, source } = await getOrder(identifier);

    if (!order) {
      console.error('Order not found');
      if (window.notifications) {
        window.notifications.error('Order not found');
      }
      document.body.innerHTML = '<div class="text-center p-8"><h1>Order Not Found</h1></div>';
      return;
    }

    // Format for display
    const displayOrder = formatOrderForDisplay(order);

    // Store in window for HTML to access
    window.orderData = displayOrder;

    // Display order
    if (window.displayOrderConfirmation) {
      window.displayOrderConfirmation(displayOrder);
    }

    // Show where data came from
    if (source === 'cache') {
      if (window.notifications) {
        window.notifications.info('Viewing cached order. Fetching latest updates...');
      }
    }

    // Subscribe to updates if online
    if (apiManager.isOnline) {
      subscribeToOrderUpdates(order.order_number);
    }

    console.log(`✅ Order confirmation loaded: ${order.order_number}`);
  };

  // Auto-initialize when this script loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initializeOrderConfirmation);
  } else {
    window.initializeOrderConfirmation();
  }
})();
