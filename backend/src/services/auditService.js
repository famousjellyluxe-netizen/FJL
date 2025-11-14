/**
 * Audit Logging Service
 * Tracks all changes made to orders for compliance and troubleshooting
 */

import { supabase } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Log an order change to the audit trail
 * @param {string} orderId - Order ID
 * @param {string} adminId - Admin user ID making the change
 * @param {string} action - Type of action (e.g., 'status_updated', 'payment_verified')
 * @param {object} options - Additional options
 * @param {string} options.from_value - Previous value (optional)
 * @param {string} options.to_value - New value (optional)
 * @param {string} options.reason - Reason for change (optional, e.g., refund reason)
 * @param {object} options.metadata - Additional JSON data (optional)
 * @returns {Promise<object>} Created audit log entry
 */
export async function logOrderChange(orderId, adminId, action, options = {}) {
  try {
    if (!orderId || !adminId || !action) {
      throw new AppError('Order ID, admin ID, and action are required for audit logging');
    }

    const { from_value, to_value, reason, metadata } = options;

    // Prepare audit log entry
    const logEntry = {
      order_id: orderId,
      admin_id: adminId,
      action: String(action).toLowerCase(),
      from_value: from_value ? String(from_value) : null,
      to_value: to_value ? String(to_value) : null,
      reason: reason ? String(reason) : null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert audit log
    const { data, error } = await supabase
      .from('order_audit_logs')
      .insert([logEntry])
      .select()
      .single();

    if (error) {
      console.error('Error logging order audit:', error);
      // Don't throw - audit logging should not block main operations
      // Log the error but continue
      console.error('⚠️ Failed to create audit log for order', orderId, error);
      return null;
    }

    console.log(`✓ Audit log created: ${action} on order ${orderId} by admin ${adminId}`);
    return data;
  } catch (error) {
    // Don't throw errors from audit logging - it's not critical to business operations
    console.error('Error in logOrderChange:', error);
    return null;
  }
}

/**
 * Get audit logs for an order
 * @param {string} orderId - Order ID
 * @param {object} options - Query options
 * @returns {Promise<array>} Array of audit log entries
 */
export async function getOrderAuditLogs(orderId, options = {}) {
  try {
    if (!orderId) {
      throw new AppError('Order ID is required');
    }

    const { limit = 100, offset = 0 } = options;

    // Validate and sanitize pagination
    const validLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 1000);
    const validOffset = Math.max(parseInt(offset) || 0, 0);

    const { data, error, count } = await supabase
      .from('order_audit_logs')
      .select('*', { count: 'exact' })
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .range(validOffset, validOffset + validLimit - 1);

    if (error) {
      console.error('Error fetching audit logs:', error);
      throw new AppError('Failed to fetch audit logs', 500);
    }

    // Parse metadata JSON for each entry
    const logs = (data || []).map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null
    }));

    return {
      logs,
      total: count || 0,
      limit: validLimit,
      offset: validOffset,
      page: Math.floor(validOffset / validLimit) + 1,
      pages: Math.ceil((count || 0) / validLimit)
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in getOrderAuditLogs:', error);
    throw new AppError('Failed to fetch audit logs', 500);
  }
}

/**
 * Get audit logs for a specific admin
 * @param {string} adminId - Admin ID
 * @param {object} options - Query options
 * @returns {Promise<array>} Array of audit log entries
 */
export async function getAdminAuditLogs(adminId, options = {}) {
  try {
    if (!adminId) {
      throw new AppError('Admin ID is required');
    }

    const { limit = 100, offset = 0 } = options;

    const validLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 1000);
    const validOffset = Math.max(parseInt(offset) || 0, 0);

    const { data, error, count } = await supabase
      .from('order_audit_logs')
      .select('*', { count: 'exact' })
      .eq('admin_id', adminId)
      .order('created_at', { ascending: false })
      .range(validOffset, validOffset + validLimit - 1);

    if (error) {
      console.error('Error fetching admin audit logs:', error);
      throw new AppError('Failed to fetch audit logs', 500);
    }

    const logs = (data || []).map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null
    }));

    return {
      logs,
      total: count || 0,
      limit: validLimit,
      offset: validOffset
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in getAdminAuditLogs:', error);
    throw new AppError('Failed to fetch audit logs', 500);
  }
}

/**
 * Get audit logs by action type
 * @param {string} action - Action type to filter by
 * @param {object} options - Query options
 * @returns {Promise<array>} Array of audit log entries
 */
export async function getAuditLogsByAction(action, options = {}) {
  try {
    if (!action) {
      throw new AppError('Action is required');
    }

    const { limit = 100, offset = 0 } = options;

    const validLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 1000);
    const validOffset = Math.max(parseInt(offset) || 0, 0);

    const { data, error, count } = await supabase
      .from('order_audit_logs')
      .select('*', { count: 'exact' })
      .eq('action', String(action).toLowerCase())
      .order('created_at', { ascending: false })
      .range(validOffset, validOffset + validLimit - 1);

    if (error) {
      console.error('Error fetching audit logs by action:', error);
      throw new AppError('Failed to fetch audit logs', 500);
    }

    const logs = (data || []).map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null
    }));

    return {
      logs,
      total: count || 0,
      limit: validLimit,
      offset: validOffset
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in getAuditLogsByAction:', error);
    throw new AppError('Failed to fetch audit logs', 500);
  }
}

/**
 * Log common order actions with standard format
 */

export async function logOrderCreated(orderId, adminId) {
  return logOrderChange(orderId, adminId, 'created', {
    to_value: 'pending'
  });
}

export async function logOrderStatusChanged(orderId, adminId, fromStatus, toStatus) {
  return logOrderChange(orderId, adminId, 'status_updated', {
    from_value: fromStatus,
    to_value: toStatus
  });
}

export async function logPaymentVerified(orderId, adminId, metadata = {}) {
  return logOrderChange(orderId, adminId, 'payment_verified', {
    from_value: 'pending',
    to_value: 'verified',
    metadata
  });
}

export async function logOrderRefunded(orderId, adminId, refundAmount, reason = null) {
  return logOrderChange(orderId, adminId, 'refunded', {
    to_value: 'refunded',
    reason,
    metadata: { refund_amount: refundAmount }
  });
}

export async function logOrderCancelled(orderId, adminId, reason = null) {
  return logOrderChange(orderId, adminId, 'cancelled', {
    to_value: 'cancelled',
    reason
  });
}

export default {
  logOrderChange,
  getOrderAuditLogs,
  getAdminAuditLogs,
  getAuditLogsByAction,
  logOrderCreated,
  logOrderStatusChanged,
  logPaymentVerified,
  logOrderRefunded,
  logOrderCancelled
};
