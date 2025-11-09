import express from 'express';
import { verifyJWT, requireAdmin, requirePermission } from '../middleware/auth.js';
import { validationChains, handleValidationErrors } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as orderService from '../services/orderService.js';
import * as emailService from '../services/emailService.js';

const router = express.Router();

/**
 * POST /api/orders
 * Create new order (public)
 */
router.post('/', validationChains.createOrder, handleValidationErrors, asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.body);

  // Send confirmation email
  try {
    const customer = {
      id: order.users.id,
      email: order.users.email,
      first_name: order.users.first_name,
      last_name: order.users.last_name
    };
    console.log(`📧 Sending order confirmation email for order ${order.order_number} to ${customer.email}...`);
    await emailService.sendOrderConfirmation(order, customer);
    console.log(`✅ Order confirmation email sent successfully for order ${order.order_number}`);
  } catch (emailError) {
    console.error(`❌ Error sending confirmation email for order ${order.order_number}:`, emailError);
    // Don't fail the order creation if email fails
  }

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: order
  });
}));

/**
 * GET /api/orders/number/:orderNumber
 * Get order by order number (public)
 * NOTE: This must come before /:id to prevent /:id from catching /number/:orderNumber
 */
router.get('/number/:orderNumber', asyncHandler(async (req, res) => {
  const order = await orderService.getOrderByNumber(req.params.orderNumber);

  res.json({
    success: true,
    data: order
  });
}));

/**
 * GET /api/orders/:id
 * Get order by ID (public - can access own order)
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);

  res.json({
    success: true,
    data: order
  });
}));

/**
 * GET /api/orders
 * List all orders (admin only)
 */
router.get('/', verifyJWT, requireAdmin, requirePermission('manage_orders'), asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status,
    payment_status: req.query.payment_status,
    user_id: req.query.user_id,
    sort_by: req.query.sort_by,
    sort_order: req.query.sort_order,
    page: req.query.page,
    limit: req.query.limit
  };

  const result = await orderService.listOrders(filters);

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination
  });
}));

/**
 * PUT /api/orders/:id/status
 * Update order status (admin only)
 */
router.put('/:id/status', verifyJWT, requireAdmin, requirePermission('manage_orders'), asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      error: 'Status is required',
      details: [{ field: 'status', message: 'Status must be provided' }]
    });
  }

  const order = await orderService.updateOrderStatus(req.params.id, status);

  // Send shipping notification if status is shipped
  if (status === 'shipped') {
    try {
      // Fetch complete order with items for email service
      const fullOrder = await orderService.getOrderById(req.params.id);
      const customer = {
        id: order.user_id,
        email: order.shipping_email,
        first_name: order.shipping_first_name,
        last_name: order.shipping_last_name
      };
      console.log(`📧 Sending shipping notification for order ${fullOrder.order_number}...`);
      await emailService.sendShippingNotification(fullOrder, customer);
    } catch (emailError) {
      console.error('❌ Error sending shipping notification:', emailError);
    }
  }

  // Return full order with items for consistency
  const fullOrder = await orderService.getOrderById(req.params.id);

  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: fullOrder
  });
}));

/**
 * PUT /api/orders/:id/payment-status
 * Update payment status and verify payment (admin only)
 */
router.put('/:id/payment-status', verifyJWT, requireAdmin, requirePermission('manage_orders'), asyncHandler(async (req, res) => {
  const { payment_status } = req.body;

  if (!payment_status) {
    return res.status(400).json({
      success: false,
      error: 'Payment status is required',
      details: [{ field: 'payment_status', message: 'Payment status must be provided' }]
    });
  }

  const order = await orderService.updatePaymentStatus(req.params.id, payment_status);

  // Send payment verified email if status is verified
  if (payment_status === 'verified') {
    try {
      // Fetch complete order with items for email service
      const fullOrder = await orderService.getOrderById(req.params.id);
      const customer = {
        id: order.user_id,
        email: order.shipping_email,
        first_name: order.shipping_first_name,
        last_name: order.shipping_last_name
      };
      console.log(`📧 Sending payment verified email for order ${fullOrder.order_number}...`);
      await emailService.sendPaymentVerified(fullOrder, customer);
    } catch (emailError) {
      console.error('❌ Error sending payment verified email:', emailError);
    }
  }

  // Return full order with items for consistency
  const fullOrder = await orderService.getOrderById(req.params.id);

  res.json({
    success: true,
    message: 'Payment status updated successfully',
    data: fullOrder
  });
}));

/**
 * DELETE /api/orders/:id
 * Cancel order (admin only)
 */
router.delete('/:id', verifyJWT, requireAdmin, requirePermission('manage_orders'), asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.params.id);

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: order
  });
}));

/**
 * GET /api/orders/customer/:userId
 * Get customer order history (admin only)
 */
router.get('/customer/:userId', verifyJWT, requireAdmin, requirePermission('view_analytics'), asyncHandler(async (req, res) => {
  const filters = {
    sort_by: req.query.sort_by,
    sort_order: req.query.sort_order,
    page: req.query.page,
    limit: req.query.limit
  };

  const result = await orderService.getCustomerOrders(req.params.userId, filters);

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination
  });
}));

export default router;
