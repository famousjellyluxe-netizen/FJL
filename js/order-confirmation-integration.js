/**
 * Order Confirmation Page Integration
 * Displays order details from API or localStorage with real-time updates
 */

(function() {
  'use strict';

  // Get reference to global apiManager from api-integration.js
  const apiManager = window.apiManager;

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
        // Handle both direct order object and wrapped API response
        let order = result.data;
        if (order.data && order.data.order_number) {
          // Response is wrapped: { success: true, message: "...", data: order }
          order = order.data;
        }

        console.log(`✅ Loaded order from API: ${order.order_number}`);
        console.log('Order object with relationships:', JSON.stringify(order, null, 2));

        // Validate order has required fields
        if (!order.id || !order.order_number) {
          throw new Error('Invalid order response: missing id or order_number');
        }

        // Cache in localStorage
        const orders = JSON.parse(localStorage.getItem('fjl_orders') || '[]');
        const existingIndex = orders.findIndex(o =>
          o.id === order.id || o.order_number === order.order_number
        );

        if (existingIndex >= 0) {
          orders[existingIndex] = order;
        } else {
          orders.push(order);
        }

        localStorage.setItem('fjl_orders', JSON.stringify(orders));

        return {
          order: order,
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
          // Handle both direct order object and wrapped API response
          let newOrder = result.data;
          if (newOrder.data && newOrder.data.order_number) {
            newOrder = newOrder.data;
          }

          // Update localStorage
          const orders = JSON.parse(localStorage.getItem('fjl_orders') || '[]');
          const index = orders.findIndex(o => o.order_number === orderNumber);

          if (index >= 0) {
            const oldOrder = orders[index];

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
   * Display order confirmation on page
   */
  window.displayOrderConfirmation = function(order) {
    if (!order) {
      console.error('No order data to display');
      return;
    }

    console.log('Displaying order:', order);

    // Populate header with personalization
    const firstNameEl = document.getElementById('firstName');
    if (firstNameEl) {
      firstNameEl.textContent = order.shipping_first_name || 'Guest';
    }

    const orderDateEl = document.getElementById('orderDate');
    if (orderDateEl) {
      orderDateEl.textContent = order.orderDate || new Date(order.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    const orderNumberEl = document.getElementById('orderNumber');
    if (orderNumberEl) {
      orderNumberEl.textContent = order.order_number || order.orderNumber || 'Unknown';
    }

    // Populate shipping information
    const shippingNameEl = document.getElementById('shippingName');
    if (shippingNameEl) {
      shippingNameEl.textContent = order.customerName || `${order.shipping_first_name || ''} ${order.shipping_last_name || ''}`;
    }

    const shippingEmailEl = document.getElementById('shippingEmail');
    if (shippingEmailEl) {
      shippingEmailEl.textContent = order.shipping_email || '-';
    }

    const shippingPhoneEl = document.getElementById('shippingPhone');
    if (shippingPhoneEl) {
      shippingPhoneEl.textContent = order.shipping_phone || '-';
    }

    const shippingCountryEl = document.getElementById('shippingCountry');
    if (shippingCountryEl) {
      shippingCountryEl.textContent = order.shipping_country || '-';
    }

    const shippingAddressEl = document.getElementById('shippingAddress');
    if (shippingAddressEl) {
      shippingAddressEl.textContent = order.shippingAddress ||
        `${order.shipping_address || ''}, ${order.shipping_city || ''}, ${order.shipping_state || ''} ${order.shipping_postal_code || ''}`;
    }

    // Populate order items as table rows
    const orderItemsContainer = document.getElementById('orderItemsContainer');
    if (orderItemsContainer && order.items && order.items.length > 0) {
      orderItemsContainer.innerHTML = '';
      order.items.forEach(item => {
        const itemRow = document.createElement('tr');
        itemRow.style.borderBottom = '1px solid #e5e5e5';

        const productName = item.product_name || item.name || 'Unknown Product';
        const details = [];
        if (item.size) details.push(`Size: ${item.size}`);
        if (item.color) details.push(`Color: ${item.color}`);
        details.push(`Qty: ${item.quantity || 1}`);
        const detailsText = details.join(' · ');

        const totalPrice = item.totalDisplay || item.priceDisplay ||
          `₦${(item.total_price || item.unit_price * item.quantity).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

        itemRow.innerHTML = `
          <td style="padding: 12px 0; text-align: left; color: #333;">${productName}</td>
          <td style="padding: 12px 0; text-align: left; color: #8b8b8b; font-size: 12px;">${detailsText}</td>
          <td style="padding: 12px 0; text-align: right; color: #333; font-weight: 600;">${totalPrice}</td>
        `;
        orderItemsContainer.appendChild(itemRow);
      });
    }

    // Populate price summary
    const summarySubtotalEl = document.getElementById('summarySubtotal');
    if (summarySubtotalEl) {
      summarySubtotalEl.textContent = order.subtotalDisplay || `₦${(order.subtotal || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
    }

    const summaryTaxEl = document.getElementById('summaryTax');
    if (summaryTaxEl) {
      summaryTaxEl.textContent = order.taxDisplay || `₦${(order.tax || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
    }

    const summaryTotalEl = document.getElementById('summaryTotal');
    if (summaryTotalEl) {
      summaryTotalEl.textContent = order.totalDisplay || `₦${(order.total_amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
    }

    // Populate FJL business account details (where customer should send payment)
    const fjlPaymentNameEl = document.getElementById('fjlPaymentName');
    if (fjlPaymentNameEl) {
      fjlPaymentNameEl.textContent = 'Famous Jelly Luxe';
    }

    const fjlPaymentBankEl = document.getElementById('fjlPaymentBank');
    if (fjlPaymentBankEl) {
      fjlPaymentBankEl.textContent = 'Access Bank';
    }

    const fjlPaymentAccountEl = document.getElementById('fjlPaymentAccount');
    if (fjlPaymentAccountEl) {
      fjlPaymentAccountEl.textContent = '1770816426';
    }

    const fjlPaymentTypeEl = document.getElementById('fjlPaymentType');
    if (fjlPaymentTypeEl) {
      fjlPaymentTypeEl.textContent = 'Business Account';
    }

    // Populate confirmation total in both places
    const totalAmount = (order.total_amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });

    const confirmTotalEl = document.getElementById('confirmTotal');
    if (confirmTotalEl) {
      confirmTotalEl.textContent = totalAmount;
    }

    const confirmTotal2El = document.getElementById('confirmTotal2');
    if (confirmTotal2El) {
      confirmTotal2El.textContent = `₦${totalAmount}`;
    }

    console.log('✅ Order confirmation displayed');
  };

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
