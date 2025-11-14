/**
 * Shipment Tracking Routes
 * Customer-facing and admin tracking endpoints
 */

import express from 'express';
import { verifyJWT, requireAdmin, requirePermission } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import * as shipmentService from '../services/shipmentService.js';
import * as orderService from '../services/orderService.js';

const router = express.Router();

/**
 * GET /api/shipments/track/:trackingNumber
 * Get shipment details by tracking number (public - no auth)
 */
router.get('/track/:trackingNumber', asyncHandler(async (req, res) => {
  const shipment = await shipmentService.getShipmentByTracking(req.params.trackingNumber);

  res.json({
    success: true,
    data: shipment
  });
}));

/**
 * GET /api/shipments/:shipmentId/events
 * Get tracking events timeline
 */
router.get('/:shipmentId/events', asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const result = await shipmentService.getTrackingTimeline(
    req.params.shipmentId,
    { limit: parseInt(limit), offset }
  );

  res.json({
    success: true,
    data: result.events,
    pagination: {
      total: result.total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(result.total / parseInt(limit))
    }
  });
}));

/**
 * POST /api/orders/:orderId/shipments
 * Create a shipment for an order (admin only)
 */
router.post('/:orderId/shipments', verifyJWT, requireAdmin, requirePermission('manage_orders'), asyncHandler(async (req, res) => {
  // Verify order exists
  const order = await orderService.getOrderById(req.params.orderId);

  const {
    carrier,
    tracking_number,
    carrier_service,
    estimated_delivery_date,
    destination_address,
    origin_address,
    cost_amount,
    cost_currency,
    weight_kg,
    dimensions,
    contents,
    signature_required,
    insurance_amount,
    metadata
  } = req.body;

  if (!carrier || !tracking_number) {
    return res.status(400).json({
      success: false,
      error: 'Carrier and tracking number are required',
      details: [
        { field: 'carrier', message: 'Carrier is required' },
        { field: 'tracking_number', message: 'Tracking number is required' }
      ]
    });
  }

  const shipment = await shipmentService.createShipment(req.params.orderId, {
    carrier,
    tracking_number,
    carrier_service,
    estimated_delivery_date,
    destination_address,
    origin_address,
    cost_amount,
    cost_currency,
    weight_kg,
    dimensions,
    contents,
    signature_required,
    insurance_amount,
    metadata
  });

  res.status(201).json({
    success: true,
    message: 'Shipment created successfully',
    data: shipment
  });
}));

/**
 * GET /api/orders/:orderId/shipments
 * Get shipment for an order
 */
router.get('/:orderId/shipments', verifyJWT, asyncHandler(async (req, res) => {
  // Verify user has access to order
  const order = await orderService.getOrderById(req.params.orderId);

  if (order.user_id !== req.user.id && req.user.role !== 'owner' && req.user.role !== 'manager') {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  const shipment = await shipmentService.getOrderShipment(req.params.orderId);

  if (!shipment) {
    return res.status(404).json({
      success: false,
      error: 'Shipment not found',
      message: 'No shipment has been created for this order yet'
    });
  }

  // Get timeline events
  const { data: events } = await supabase
    .from('shipment_events')
    .select('*')
    .eq('shipment_id', shipment.id)
    .order('timestamp', { ascending: false });

  res.json({
    success: true,
    data: {
      ...shipment,
      events: events || []
    }
  });
}));

/**
 * PUT /api/shipments/:shipmentId/status
 * Update shipment status (admin only)
 */
router.put('/:shipmentId/status', verifyJWT, requireAdmin, requirePermission('manage_orders'), asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      error: 'Status is required',
      details: [{ field: 'status', message: 'Status is required' }]
    });
  }

  const validStatuses = ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  const updated = await shipmentService.updateShipmentStatus(req.params.shipmentId, status);

  res.json({
    success: true,
    message: `Shipment status updated to: ${status}`,
    data: updated
  });
}));

/**
 * POST /api/shipments/:shipmentId/events
 * Add tracking event (admin or webhook)
 */
router.post('/:shipmentId/events', asyncHandler(async (req, res) => {
  // Allow webhook calls without auth (verify signature in production)
  // For authenticated calls, require admin
  if (req.headers.authorization) {
    await new Promise((resolve, reject) => {
      verifyJWT(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (req.user.role !== 'owner' && req.user.role !== 'manager') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
  }

  const {
    event_type,
    status,
    location,
    location_lat,
    location_lng,
    timestamp,
    description,
    remarks
  } = req.body;

  if (!event_type) {
    return res.status(400).json({
      success: false,
      error: 'Event type is required',
      details: [{ field: 'event_type', message: 'Event type is required' }]
    });
  }

  const event = await shipmentService.addTrackingEvent(req.params.shipmentId, {
    event_type,
    status,
    location,
    location_lat,
    location_lng,
    timestamp,
    description,
    remarks
  });

  res.status(201).json({
    success: true,
    message: 'Tracking event added',
    data: event
  });
}));

/**
 * GET /api/admin/shipments/pending
 * Get pending shipments (admin only)
 */
router.get('/admin/pending', verifyJWT, requireAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const result = await shipmentService.getPendingShipments({
    limit: parseInt(limit),
    offset
  });

  res.json({
    success: true,
    data: result.shipments,
    pagination: {
      total: result.total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(result.total / parseInt(limit))
    }
  });
}));

/**
 * GET /api/admin/shipments/status/:status
 * Get shipments by status (admin only)
 */
router.get('/admin/status/:status', verifyJWT, requireAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, days } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const result = await shipmentService.getShipmentsByStatus(req.params.status, {
    limit: parseInt(limit),
    offset,
    days: days ? parseInt(days) : null
  });

  res.json({
    success: true,
    data: result.shipments,
    pagination: {
      total: result.total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(result.total / parseInt(limit))
    }
  });
}));

export default router;
