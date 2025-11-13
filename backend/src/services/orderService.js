import { supabase } from '../config/database.js';
import { AppError, NotFoundError } from '../middleware/errorHandler.js';

/**
 * Generate unique order number (ORD-XXXXXXX)
 */
function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-7);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `ORD-${timestamp}${random}`;
}

/**
 * Create new order
 */
export async function createOrder(orderData) {
  try {
    // Get or create customer
    let customer;
    if (orderData.user_id) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', orderData.user_id)
        .single();

      customer = existingUser;
    } else {
      // Check if user with this email already exists
      const { data: existingUserByEmail } = await supabase
        .from('users')
        .select('*')
        .eq('email', orderData.shipping_email)
        .single();

      if (existingUserByEmail) {
        // User exists, use existing user
        customer = existingUserByEmail;
      } else {
        // Create new customer only if email doesn't exist
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert([{
            email: orderData.shipping_email,
            first_name: orderData.shipping_first_name,
            last_name: orderData.shipping_last_name,
            phone: orderData.shipping_phone,
            address: orderData.shipping_address,
            city: orderData.shipping_city,
            state: orderData.shipping_state,
            postal_code: orderData.shipping_postal_code,
            country: orderData.shipping_country
          }])
          .select()
          .single();

        if (userError) throw userError;
        customer = newUser;
      }
    }

    // VALIDATION: Check stock availability for all items before creating order
    if (!orderData.items || orderData.items.length === 0) {
      throw new AppError('Order must contain at least one item', 400);
    }

    for (const item of orderData.items) {
      // Get current variant stock
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select('stock_quantity, size, color')
        .eq('id', item.variant_id)
        .single();

      if (variantError || !variant) {
        throw new AppError(
          `Variant not found for item: ${item.product_name}`,
          400
        );
      }

      // Check if requested quantity exceeds available stock
      if (item.quantity > variant.stock_quantity) {
        throw new AppError(
          `Insufficient stock for ${item.product_name} (${variant.color} - ${variant.size}). ` +
          `Requested: ${item.quantity}, Available: ${variant.stock_quantity}`,
          400
        );
      }

      // Warn if stock is getting low (less than 3 units after this order)
      if (variant.stock_quantity - item.quantity < 3 && variant.stock_quantity - item.quantity >= 0) {
        console.log(`⚠️  Low stock warning: ${item.product_name} (${variant.color} - ${variant.size}) will have only ${variant.stock_quantity - item.quantity} units left after this order`);
      }
    }

    console.log(`✅ Stock validation passed for all ${orderData.items.length} items`);

    // Create order
    const orderNumber = generateOrderNumber();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_number: orderNumber,
        user_id: customer.id,
        shipping_first_name: orderData.shipping_first_name,
        shipping_last_name: orderData.shipping_last_name,
        shipping_email: orderData.shipping_email,
        shipping_phone: orderData.shipping_phone,
        shipping_address: orderData.shipping_address,
        shipping_city: orderData.shipping_city,
        shipping_state: orderData.shipping_state,
        shipping_postal_code: orderData.shipping_postal_code,
        shipping_country: orderData.shipping_country,
        buyer_name: orderData.buyer_name,
        payment_method: orderData.payment_method || 'bank_transfer',
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        shipping_cost: orderData.shipping_cost || 0,
        total_amount: orderData.total_amount,
        order_status: 'pending',
        payment_status: 'pending'
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // Add order items
    const itemsData = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      product_name: item.product_name,
      product_sku: item.product_sku,
      size: item.size,
      color: item.color,
      unit_price: item.unit_price,
      quantity: item.quantity,
      total_price: item.total_price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsData);

    if (itemsError) throw itemsError;

    // NOTE: Stock is NOT reduced here anymore
    // Stock will be reduced when payment is verified (updatePaymentStatus)
    // This ensures stock is only affected by confirmed payments

    // Update customer stats
    const { error: updateError } = await supabase
      .from('users')
      .update({
        order_count: customer.order_count + 1,
        last_order_at: new Date()
      })
      .eq('id', customer.id);

    if (updateError) console.error('Error updating customer stats:', updateError);

    // Fetch complete order with items
    return getOrderById(order.id);
  } catch (error) {
    console.error('Error creating order:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      details: error?.details
    });
    throw error;
  }
}

/**
 * Get order by ID with items
 */
export async function getOrderById(id) {
  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        users(id, email, first_name, last_name),
        order_items(*)
      `)
      .eq('id', id)
      .single();

    if (orderError || !order) {
      throw new NotFoundError('Order');
    }

    // Normalize: convert order_items to items for email service compatibility
    if (order.order_items && !order.items) {
      order.items = order.order_items;
    }

    return order;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error('Error fetching order:', error);
    throw error;
  }
}

/**
 * Get order by order number
 */
export async function getOrderByNumber(orderNumber) {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        users(id, email, first_name, last_name),
        order_items(*)
      `)
      .eq('order_number', orderNumber)
      .single();

    if (error || !order) {
      throw new NotFoundError('Order');
    }

    // Normalize: convert order_items to items for email service compatibility
    if (order.order_items && !order.items) {
      order.items = order.order_items;
    }

    return order;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error('Error fetching order:', error);
    throw error;
  }
}

/**
 * List orders (admin)
 */
export async function listOrders(filters = {}) {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        users(id, email, first_name, last_name),
        order_items(id, product_id, product_name, product_sku, size, color, unit_price, quantity, total_price)
      `);

    // Apply filters
    if (filters.status) {
      query = query.eq('order_status', filters.status);
    }

    if (filters.payment_status) {
      query = query.eq('payment_status', filters.payment_status);
    }

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    // Sorting
    const sortField = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order === 'asc' ? true : false;
    query = query.order(sortField, { ascending: sortOrder });

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    };
  } catch (error) {
    console.error('Error listing orders:', error);
    throw error;
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(id, status) {
  try {
    const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Fetch order to check current state (needed for cancellation logic)
    const order = await getOrderById(id);

    const updateData = {
      order_status: status,
      updated_at: new Date()
    };

    // Add timestamp for shipped status
    if (status === 'shipped') {
      updateData.shipped_at = new Date();
    }

    // Add timestamp for delivered status
    if (status === 'delivered') {
      updateData.delivered_at = new Date();
    }

    // Handle cancellation - restore stock if it was deducted
    if (status === 'cancelled' && order.stock_deducted) {
      console.log(`🔄 Cancelling order ${id} via status update, restoring stock...`);

      try {
        // Restore stock for each item
        const productService = await import('./productService.js');
        const { restoreStock, checkAndMarkOutOfStock } = productService.default;

        for (const item of order.order_items) {
          if (item.variant_id) {
            try {
              await restoreStock(item.variant_id, item.quantity);
              console.log(`✓ Restored stock for variant ${item.variant_id} by ${item.quantity}`);
            } catch (error) {
              console.error(`Error restoring stock for variant ${item.variant_id}:`, error);
              throw error;
            }
          }
        }

        // Check if products should be marked as in stock
        const productIds = [...new Set(order.order_items.map(item => item.product_id))];
        for (const productId of productIds) {
          try {
            await checkAndMarkOutOfStock(productId);
          } catch (error) {
            console.error(`Error checking stock status for product ${productId}:`, error);
          }
        }

        // Reset stock deduction flags
        updateData.stock_deducted = false;
        updateData.stock_deducted_at = null;

        console.log(`✓ Stock restored and flags reset for order ${id}`);
      } catch (error) {
        console.error(`❌ Failed to restore stock for order ${id}:`, error.message);
        throw error;
      }
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundError('Order');
    }

    console.log(`✓ Order ${id} status updated to '${status}'`);
    return data;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AppError) throw error;
    console.error('Error updating order status:', error);
    throw error;
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(id, paymentStatus) {
  try {
    const validStatuses = ['pending', 'verified', 'failed'];

    if (!validStatuses.includes(paymentStatus)) {
      throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Get order first to check current status and items
    const order = await getOrderById(id);

    const updateData = {
      payment_status: paymentStatus,
      updated_at: new Date()
    };

    // Handle payment verification - REDUCE STOCK ATOMICALLY
    if (paymentStatus === 'verified' && order.payment_status !== 'verified') {
      console.log(`💳 Payment verified for order ${id}, reducing stock atomically...`);

      try {
        // Import atomic stock function
        const { reduceOrderStockAtomic } = await import('./productService.js');

        // Atomically reduce stock for ALL items in a single transaction
        // This prevents race conditions that occur with multi-item orders
        const stockResult = await reduceOrderStockAtomic(id);
        console.log(`✓ Atomically reduced stock for order ${id}: ${stockResult.reducedItems} items, ${stockResult.productIds.length} products affected`);

        updateData.paid_at = new Date();
        updateData.stock_deducted = true;
        updateData.stock_deducted_at = new Date();
      } catch (error) {
        console.error(`❌ Failed to reduce stock for order ${id}:`, error.message);
        throw error;
      }
    }

    // Handle payment failure - ENSURE NO STOCK CHANGES
    if (paymentStatus === 'failed' && order.stock_deducted) {
      console.log(`❌ Payment failed for order ${id}, restoring stock...`);

      // Import stock functions
      const productService = await import('./productService.js');
      const { restoreStock, checkAndMarkOutOfStock } = productService.default;

      // Restore stock if it was deducted
      for (const item of order.order_items) {
        if (item.variant_id) {
          try {
            await restoreStock(item.variant_id, item.quantity);
            console.log(`✓ Restored stock for variant ${item.variant_id} by ${item.quantity}`);
          } catch (error) {
            console.error(`Error restoring stock for variant ${item.variant_id}:`, error);
          }
        }
      }

      // Check if products should be marked as in stock
      const productIds = [...new Set(order.order_items.map(item => item.product_id))];
      for (const productId of productIds) {
        try {
          await checkAndMarkOutOfStock(productId);
        } catch (error) {
          console.error(`Error checking stock status for product ${productId}:`, error);
        }
      }

      updateData.stock_deducted = false;
      updateData.stock_deducted_at = null;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundError('Order');
    }

    console.log(`✓ Payment status updated to '${paymentStatus}' for order ${id}`);
    return data;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AppError) throw error;
    console.error('Error updating payment status:', error);
    throw error;
  }
}

/**
 * Cancel order and restore stock if it was deducted
 */
export async function cancelOrder(id) {
  try {
    const order = await getOrderById(id);

    if (order.order_status === 'cancelled') {
      throw new AppError('Order is already cancelled', 400);
    }

    console.log(`🔄 Cancelling order ${id}...`);

    // Restore stock only if it was deducted
    if (order.stock_deducted) {
      console.log(`📦 Restoring stock for cancelled order ${id}...`);

      // Import stock functions
      const productService = await import('./productService.js');
      const { restoreStock, checkAndMarkOutOfStock } = productService.default;

      // Restore stock for each item
      for (const item of order.order_items) {
        if (item.variant_id) {
          try {
            await restoreStock(item.variant_id, item.quantity);
            console.log(`✓ Restored stock for variant ${item.variant_id} by ${item.quantity}`);
          } catch (error) {
            console.error(`Error restoring stock for variant ${item.variant_id}:`, error);
            throw error;
          }
        }
      }

      // Check if products should be marked as in stock
      const productIds = [...new Set(order.order_items.map(item => item.product_id))];
      for (const productId of productIds) {
        try {
          await checkAndMarkOutOfStock(productId);
        } catch (error) {
          console.error(`Error checking stock status for product ${productId}:`, error);
        }
      }
    } else {
      console.log(`⚠️ Order ${id} was cancelled before payment was verified, no stock to restore`);
    }

    // Update order status and stock deduction flags
    const { data, error } = await supabase
      .from('orders')
      .update({
        order_status: 'cancelled',
        stock_deducted: false,
        stock_deducted_at: null,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundError('Order');
    }

    console.log(`✓ Order ${id} cancelled successfully`);
    return data;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AppError) throw error;
    console.error('Error cancelling order:', error);
    throw error;
  }
}

/**
 * Get customer order history
 */
export async function getCustomerOrders(userId, filters = {}) {
  try {
    let query = supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId);

    // Sorting
    const sortField = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order === 'asc' ? true : false;
    query = query.order(sortField, { ascending: sortOrder });

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    throw error;
  }
}

export default {
  createOrder,
  getOrderById,
  getOrderByNumber,
  listOrders,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  getCustomerOrders,
  generateOrderNumber
};
