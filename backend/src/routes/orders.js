import express from 'express';
import { verifyJWT, requireAdmin, requirePermission } from '../middleware/auth.js';
import { validationChains, handleValidationErrors } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as orderService from '../services/orderService.js';
import * as emailService from '../services/emailService.js';
import * as auditService from '../services/auditService.js';
import * as orderNotesService from '../services/orderNotesService.js';

const router = express.Router();

/**
 * POST /api/orders
 * Create new order (public)
 */
router.post('/', validationChains.createOrder, handleValidationErrors, asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.body);

  // Send confirmation email asynchronously (fire-and-forget)
  // Don't await or block the response on email sending
  (async () => {
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
      // Log error but don't fail - email delivery is not critical to order creation
    }
  })();

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: order
  });
}));

/**
 * GET /api/orders/number/:orderNumber
 * Get order by order number (authenticated - verify ownership)
 * NOTE: This must come before /:id to prevent /:id from catching /number/:orderNumber
 */
router.get('/number/:orderNumber', verifyJWT, asyncHandler(async (req, res) => {
  const order = await orderService.getOrderByNumber(req.params.orderNumber);

  // Verify ownership: customer can only see own orders, admin can see all
  if (order.user_id !== req.user.id && req.user.role !== 'owner' && req.user.role !== 'manager' && req.user.role !== 'staff') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      details: [{ message: 'You do not have permission to view this order' }]
    });
  }

  res.json({
    success: true,
    data: order
  });
}));

/**
 * GET /api/orders/:id
 * Get order by ID (authenticated - verify ownership)
 */
router.get('/:id', verifyJWT, asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);

  // Verify ownership: customer can only see own orders, admin can see all
  if (order.user_id !== req.user.id && req.user.role !== 'owner' && req.user.role !== 'manager' && req.user.role !== 'staff') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      details: [{ message: 'You do not have permission to view this order' }]
    });
  }

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

  // Log audit trail for status change
  auditService.logOrderStatusChanged(req.params.id, req.user.id, order.order_status, status);

  // Send notifications based on status
  // Send status notification email asynchronously (fire-and-forget)
  if (status === 'shipped' || status === 'cancelled' || status === 'delivered') {
    (async () => {
      try {
        // Fetch complete order with items for email service
        const fullOrder = await orderService.getOrderById(req.params.id);
        const customer = {
          id: order.user_id,
          email: order.shipping_email,
          first_name: order.shipping_first_name,
          last_name: order.shipping_last_name
        };

        if (status === 'shipped') {
          console.log(`📧 Sending shipping notification for order ${fullOrder.order_number}...`);
          await emailService.sendShippingNotification(fullOrder, customer);
        } else if (status === 'cancelled') {
          console.log(`📧 Sending cancellation notification for order ${fullOrder.order_number}...`);
          await emailService.sendOrderCancelled(fullOrder, customer);
        } else if (status === 'delivered') {
          console.log(`📧 Sending delivery confirmation for order ${fullOrder.order_number}...`);
          await emailService.sendOrderDelivered(fullOrder, customer);
        }
      } catch (emailError) {
        console.error('❌ Error sending status notification:', emailError);
        // Log error but continue - email delivery is not critical
      }
    })();
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

  // Log audit trail for payment status change
  if (payment_status === 'verified') {
    auditService.logPaymentVerified(req.params.id, req.user.id);
  }

  // Send payment verified email asynchronously (fire-and-forget)
  if (payment_status === 'verified') {
    (async () => {
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
        // Log error but continue - email delivery is not critical
      }
    })();
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

/**
 * GET /api/orders/:id/audit
 * Get audit logs for an order (admin only)
 */
router.get('/:id/audit', verifyJWT, requireAdmin, requirePermission('manage_orders'), asyncHandler(async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;

  const result = await auditService.getOrderAuditLogs(req.params.id, { limit, offset });

  res.json({
    success: true,
    data: result.logs,
    pagination: {
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      page: result.page,
      pages: result.pages
    }
  });
}));

/**
 * POST /api/orders/:id/notes
 * Add a note to an order (customer or admin)
 */
router.post('/:id/notes', verifyJWT, asyncHandler(async (req, res) => {
  const { note, isInternal } = req.body;

  if (!note || note.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Note content is required',
      details: [{ field: 'note', message: 'Note cannot be empty' }]
    });
  }

  // Get order to verify user has access
  const order = await orderService.getOrderById(req.params.id);

  // Verify ownership: customer can only note on own orders
  if (order.user_id !== req.user.id && req.user.role !== 'owner' && req.user.role !== 'manager') {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  // Determine author type
  const authorType = (req.user.role === 'owner' || req.user.role === 'manager') ? 'admin' : 'customer';

  // Customers cannot create internal notes
  if (isInternal && authorType !== 'admin') {
    return res.status(403).json({ success: false, error: 'Only admins can create internal notes' });
  }

  const createdNote = await orderNotesService.addOrderNote(
    req.params.id,
    req.user.id,
    authorType,
    note,
    { isInternal: isInternal || false }
  );

  res.status(201).json({
    success: true,
    message: 'Note added successfully',
    data: createdNote
  });
}));

/**
 * GET /api/orders/:id/notes
 * Get notes for an order (visible to customer or admin)
 */
router.get('/:id/notes', verifyJWT, asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Verify user has access to order
  const order = await orderService.getOrderById(req.params.id);
  if (order.user_id !== req.user.id && req.user.role !== 'owner' && req.user.role !== 'manager') {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  const result = await orderNotesService.getOrderNotes(
    req.params.id,
    { userId: req.user.id, userRole: req.user.role },
    { limit: parseInt(limit), offset }
  );

  res.json({
    success: true,
    data: result.notes,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: Math.ceil(result.total / result.limit)
    }
  });
}));

/**
 * DELETE /api/orders/:id/notes/:noteId
 * Delete a note (admin only)
 */
router.delete('/:id/notes/:noteId', verifyJWT, requireAdmin, requirePermission('manage_orders'), asyncHandler(async (req, res) => {
  await orderNotesService.deleteOrderNote(req.params.noteId, req.user.id);

  res.json({
    success: true,
    message: 'Note deleted successfully'
  });
}));

export default router;
