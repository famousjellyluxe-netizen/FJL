/**
 * Shipment Tracking Service
 * Manages order shipment and delivery tracking
 *
 * Features:
 * - Create shipments with carrier integration
 * - Track package status and location
 * - Event timeline for detailed tracking
 * - Webhook support for carrier updates
 * - Estimated vs actual delivery
 */

import { supabase } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Create a shipment for an order
 * @param {string} orderId - Order ID
 * @param {object} shipmentData - Shipment details
 * @param {string} shipmentData.carrier - Carrier name (fedex, dhl, ghn, etc)
 * @param {string} shipmentData.tracking_number - Carrier tracking number
 * @param {string} shipmentData.carrier_service - Service type
 * @param {object} shipmentData.destination_address - Delivery address
 * @param {number} shipmentData.cost_amount - Shipping cost in cents
 * @param {string} shipmentData.cost_currency - Currency code (CAD, USD, etc)
 * @param {date} shipmentData.estimated_delivery_date - Expected delivery
 * @returns {Promise<object>} Created shipment
 */
export async function createShipment(orderId, shipmentData = {}) {
  try {
    if (!orderId) {
      throw new AppError('Order ID is required');
    }

    if (!shipmentData.carrier || !shipmentData.tracking_number) {
      throw new AppError('Carrier and tracking number are required');
    }

    // Verify order exists
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new AppError('Order not found', 404);
    }

    // Check for duplicate tracking number
    const { data: existing } = await supabase
      .from('shipments')
      .select('id')
      .eq('tracking_number', shipmentData.tracking_number)
      .single();

    if (existing) {
      throw new AppError('Tracking number already exists', 409);
    }

    // Create shipment
    const { data, error } = await supabase
      .from('shipments')
      .insert([{
        order_id: orderId,
        carrier: shipmentData.carrier?.toLowerCase(),
        tracking_number: shipmentData.tracking_number,
        carrier_service: shipmentData.carrier_service || null,
        status: 'pending',
        estimated_delivery_date: shipmentData.estimated_delivery_date || null,
        destination_address: JSON.stringify(shipmentData.destination_address || {}),
        origin_address: JSON.stringify(shipmentData.origin_address || {}),
        weight_kg: shipmentData.weight_kg || null,
        dimensions: JSON.stringify(shipmentData.dimensions || {}),
        contents: shipmentData.contents || null,
        cost_amount: shipmentData.cost_amount || null,
        cost_currency: shipmentData.cost_currency || 'CAD',
        signature_required: shipmentData.signature_required || false,
        insurance_amount: shipmentData.insurance_amount || null,
        metadata: shipmentData.metadata ? JSON.stringify(shipmentData.metadata) : null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating shipment:', error);
      throw new AppError('Failed to create shipment', 500);
    }

    console.log(`✓ Shipment created: ${data.tracking_number} for order ${orderId}`);
    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in createShipment:', error);
    throw new AppError('Failed to create shipment', 500);
  }
}

/**
 * Get shipment by tracking number (public - no auth needed)
 * Returns only public information
 * @param {string} trackingNumber - Carrier tracking number
 * @returns {Promise<object>} Shipment with events
 */
export async function getShipmentByTracking(trackingNumber) {
  try {
    if (!trackingNumber) {
      throw new AppError('Tracking number is required');
    }

    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select(`
        id,
        order_id,
        tracking_number,
        carrier,
        carrier_service,
        status,
        estimated_delivery_date,
        actual_delivery_date,
        destination_address,
        weight_kg,
        created_at,
        updated_at
      `)
      .eq('tracking_number', trackingNumber)
      .single();

    if (shipmentError || !shipment) {
      throw new AppError('Shipment not found', 404);
    }

    // Get events
    const { data: events, error: eventsError } = await supabase
      .from('shipment_events')
      .select('event_type, status, location, timestamp, description')
      .eq('shipment_id', shipment.id)
      .order('timestamp', { ascending: false });

    if (eventsError) {
      console.error('Error fetching shipment events:', eventsError);
    }

    return {
      ...shipment,
      destination_address: JSON.parse(shipment.destination_address || '{}'),
      events: events || [],
      total_events: events?.length || 0
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in getShipmentByTracking:', error);
    throw new AppError('Failed to fetch shipment', 500);
  }
}

/**
 * Get shipment for an order (authenticated)
 * @param {string} orderId - Order ID
 * @returns {Promise<object>} Shipment details
 */
export async function getOrderShipment(orderId) {
  try {
    if (!orderId) {
      throw new AppError('Order ID is required');
    }

    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching order shipment:', error);
      throw new AppError('Failed to fetch shipment', 500);
    }

    if (!data) return null;

    // Parse JSON fields
    data.destination_address = JSON.parse(data.destination_address || '{}');
    data.origin_address = JSON.parse(data.origin_address || '{}');
    data.dimensions = JSON.parse(data.dimensions || '{}');
    data.metadata = JSON.parse(data.metadata || '{}');

    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in getOrderShipment:', error);
    throw new AppError('Failed to fetch shipment', 500);
  }
}

/**
 * Add tracking event (called by webhook or manual update)
 * @param {string} shipmentId - Shipment ID
 * @param {object} eventData - Event details
 * @param {string} eventData.event_type - Type of event
 * @param {string} eventData.status - Updated status
 * @param {string} eventData.location - Where event occurred
 * @param {string} eventData.timestamp - When event occurred
 * @param {string} eventData.description - Human-readable description
 * @returns {Promise<object>} Created event
 */
export async function addTrackingEvent(shipmentId, eventData = {}) {
  try {
    if (!shipmentId || !eventData.event_type) {
      throw new AppError('Shipment ID and event type are required');
    }

    // Verify shipment exists
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('id, status')
      .eq('id', shipmentId)
      .single();

    if (shipmentError || !shipment) {
      throw new AppError('Shipment not found', 404);
    }

    // Create event
    const { data: event, error: eventError } = await supabase
      .from('shipment_events')
      .insert([{
        shipment_id: shipmentId,
        event_type: eventData.event_type,
        status: eventData.status || null,
        location: eventData.location || null,
        location_lat: eventData.location_lat || null,
        location_lng: eventData.location_lng || null,
        timestamp: eventData.timestamp || new Date().toISOString(),
        description: eventData.description || null,
        remarks: eventData.remarks || null
      }])
      .select()
      .single();

    if (eventError) {
      console.error('Error creating tracking event:', eventError);
      throw new AppError('Failed to add tracking event', 500);
    }

    // Update shipment status if provided
    if (eventData.status && eventData.status !== shipment.status) {
      await supabase
        .from('shipments')
        .update({
          status: eventData.status,
          actual_delivery_date: eventData.status === 'delivered' ? new Date().toISOString() : null
        })
        .eq('id', shipmentId);
    }

    console.log(`✓ Tracking event added: ${eventData.event_type} for shipment ${shipmentId}`);
    return event;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in addTrackingEvent:', error);
    throw new AppError('Failed to add tracking event', 500);
  }
}

/**
 * Get tracking timeline for a shipment
 * @param {string} shipmentId - Shipment ID
 * @param {object} options - Query options
 * @returns {Promise<array>} Events in chronological order
 */
export async function getTrackingTimeline(shipmentId, options = {}) {
  try {
    if (!shipmentId) {
      throw new AppError('Shipment ID is required');
    }

    const { limit = 50, offset = 0 } = options;

    const { data, error, count } = await supabase
      .from('shipment_events')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching tracking timeline:', error);
      throw new AppError('Failed to fetch timeline', 500);
    }

    return {
      events: data || [],
      total: count || 0,
      limit,
      offset
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in getTrackingTimeline:', error);
    throw new AppError('Failed to fetch tracking timeline', 500);
  }
}

/**
 * Update shipment status
 * @param {string} shipmentId - Shipment ID
 * @param {string} status - New status
 * @param {object} updates - Additional updates
 * @returns {Promise<object>} Updated shipment
 */
export async function updateShipmentStatus(shipmentId, status, updates = {}) {
  try {
    if (!shipmentId || !status) {
      throw new AppError('Shipment ID and status are required');
    }

    const updateData = {
      status,
      ...updates
    };

    // Mark as delivered if status is delivered
    if (status === 'delivered' && !updates.actual_delivery_date) {
      updateData.actual_delivery_date = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('shipments')
      .update(updateData)
      .eq('id', shipmentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating shipment:', error);
      throw new AppError('Failed to update shipment', 500);
    }

    console.log(`✓ Shipment ${shipmentId} status updated to: ${status}`);
    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in updateShipmentStatus:', error);
    throw new AppError('Failed to update shipment status', 500);
  }
}

/**
 * Get shipments pending delivery (admin dashboard)
 * @param {object} options - Query options
 * @returns {Promise<array>} In-transit and pending shipments
 */
export async function getPendingShipments(options = {}) {
  try {
    const { limit = 50, offset = 0 } = options;

    const { data, error, count } = await supabase
      .from('shipments')
      .select(`
        id,
        order_id,
        tracking_number,
        carrier,
        status,
        estimated_delivery_date,
        destination_address
      `)
      .in('status', ['pending', 'picked_up', 'in_transit', 'out_for_delivery'])
      .order('estimated_delivery_date', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching pending shipments:', error);
      throw new AppError('Failed to fetch shipments', 500);
    }

    return {
      shipments: data || [],
      total: count || 0,
      limit,
      offset
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in getPendingShipments:', error);
    throw new AppError('Failed to fetch pending shipments', 500);
  }
}

/**
 * Get shipments by status
 * @param {string} status - Status to filter by
 * @param {object} options - Query options
 * @returns {Promise<array>} Shipments matching status
 */
export async function getShipmentsByStatus(status, options = {}) {
  try {
    if (!status) {
      throw new AppError('Status is required');
    }

    const { limit = 50, offset = 0, days = 30 } = options;

    // Filter by date range if days specified
    let query = supabase
      .from('shipments')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Optionally filter by recent days
    if (days) {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', cutoffDate);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching shipments by status:', error);
      throw new AppError('Failed to fetch shipments', 500);
    }

    return {
      shipments: data || [],
      total: count || 0,
      limit,
      offset
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in getShipmentsByStatus:', error);
    throw new AppError('Failed to fetch shipments', 500);
  }
}

export default {
  createShipment,
  getShipmentByTracking,
  getOrderShipment,
  addTrackingEvent,
  getTrackingTimeline,
  updateShipmentStatus,
  getPendingShipments,
  getShipmentsByStatus,
};
