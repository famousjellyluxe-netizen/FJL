/**
 * Error Logging Service
 * Centralizes error logging, tracking, and alerting
 * Helps identify patterns and debug production issues
 */

import { supabase } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Log an error to the database
 * @param {Error} error - Error object
 * @param {object} context - Additional context
 * @returns {Promise<object>} Logged error record
 */
export async function logError(error, context = {}) {
  try {
    const errorLog = {
      error_type: error.constructor.name,
      error_message: error.message,
      error_stack: error.stack,
      endpoint: context.endpoint || null,
      method: context.method || null,
      user_id: context.userId || null,
      user_role: context.userRole || null,
      status_code: context.statusCode || 500,
      request_body: context.body ? JSON.stringify(context.body) : null,
      user_agent: context.userAgent || null,
      ip_address: context.ipAddress || null,
      severity: context.severity || getSeverity(error),
      metadata: context.metadata ? JSON.stringify(context.metadata) : null,
      created_at: new Date().toISOString()
    };

    const { data, error: dbError } = await supabase
      .from('error_logs')
      .insert([errorLog])
      .select()
      .single();

    if (dbError) {
      console.error('Failed to log error to database:', dbError);
      // Don't throw - error logging should not block main operations
      return null;
    }

    console.error(`✓ Error logged: ${error.message} (ID: ${data.id})`);
    return data;
  } catch (error) {
    console.error('Error in logError:', error);
    // Silently fail - don't want error logging to cause cascading errors
    return null;
  }
}

/**
 * Determine error severity based on type and status code
 * @param {Error} error - Error object
 * @param {number} statusCode - HTTP status code
 * @returns {string} Severity level: critical, high, medium, low
 */
export function getSeverity(error, statusCode = 500) {
  // Critical: 5xx errors, database failures, auth failures
  if (statusCode >= 500 || error.message.includes('database') || error.message.includes('auth')) {
    return 'critical';
  }

  // High: 4xx client errors with auth context
  if (statusCode >= 400 && statusCode < 500) {
    return 'high';
  }

  // Medium: Validation errors
  if (error instanceof AppError && statusCode === 400) {
    return 'medium';
  }

  // Low: Warnings and non-critical issues
  return 'low';
}

/**
 * Get error logs with optional filters
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Error logs and pagination info
 */
export async function getErrorLogs(filters = {}) {
  try {
    const {
      limit = 100,
      offset = 0,
      severity = null,
      endpoint = null,
      userId = null,
      startDate = null,
      endDate = null
    } = filters;

    // Validate and sanitize pagination
    const validLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 1000);
    const validOffset = Math.max(parseInt(offset) || 0, 0);

    let query = supabase
      .from('error_logs')
      .select('*', { count: 'exact' });

    // Apply filters
    if (severity) {
      query = query.eq('severity', severity);
    }

    if (endpoint) {
      query = query.ilike('endpoint', `%${endpoint}%`);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', new Date(endDate).toISOString());
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(validOffset, validOffset + validLimit - 1);

    if (error) throw error;

    return {
      logs: data || [],
      total: count || 0,
      limit: validLimit,
      offset: validOffset,
      page: Math.floor(validOffset / validLimit) + 1,
      pages: Math.ceil((count || 0) / validLimit)
    };
  } catch (error) {
    console.error('Error in getErrorLogs:', error);
    throw new AppError('Failed to fetch error logs', 500);
  }
}

/**
 * Get error statistics (for monitoring dashboard)
 * @param {object} options - Options for stats
 * @returns {Promise<object>} Error statistics
 */
export async function getErrorStats(options = {}) {
  try {
    const { timePeriod = '24h' } = options;

    // Calculate start date based on time period
    const startDate = getStartDateForPeriod(timePeriod);

    // Get total errors in period
    const { data: totalErrors, error: totalError } = await supabase
      .from('error_logs')
      .select('id', { count: 'exact' })
      .gte('created_at', startDate.toISOString());

    // Get errors by severity
    const { data: bySeverity, error: severityError } = await supabase
      .from('error_logs')
      .select('severity')
      .gte('created_at', startDate.toISOString());

    // Get top errors
    const { data: topErrors, error: topError } = await supabase
      .from('error_logs')
      .select('error_message, count')
      .gte('created_at', startDate.toISOString())
      .order('count', { ascending: false })
      .limit(10);

    // Get errors by endpoint
    const { data: byEndpoint, error: endpointError } = await supabase
      .from('error_logs')
      .select('endpoint')
      .gte('created_at', startDate.toISOString())
      .not('endpoint', 'is', null);

    if (totalError || severityError || topError || endpointError) {
      throw new AppError('Failed to fetch error statistics', 500);
    }

    // Process data
    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    (bySeverity || []).forEach(log => {
      severityCounts[log.severity] = (severityCounts[log.severity] || 0) + 1;
    });

    const endpointCounts = {};
    (byEndpoint || []).forEach(log => {
      endpointCounts[log.endpoint] = (endpointCounts[log.endpoint] || 0) + 1;
    });

    return {
      period: timePeriod,
      startDate,
      totalErrors: totalErrors?.count || 0,
      bySeverity: severityCounts,
      topErrors: topErrors || [],
      byEndpoint: endpointCounts,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in getErrorStats:', error);
    throw new AppError('Failed to get error statistics', 500);
  }
}

/**
 * Get start date for time period
 * @param {string} period - Time period ('1h', '24h', '7d', '30d')
 * @returns {Date} Start date
 */
function getStartDateForPeriod(period) {
  const now = new Date();

  switch (period) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
}

/**
 * Clear old error logs (older than days)
 * @param {number} days - Days to keep
 * @returns {Promise<number>} Number of logs deleted
 */
export async function clearOldErrorLogs(days = 30) {
  try {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('error_logs')
      .delete()
      .lt('created_at', cutoffDate);

    if (error) throw error;

    console.log(`✓ Deleted error logs older than ${days} days`);
    return (data || []).length;
  } catch (error) {
    console.error('Error in clearOldErrorLogs:', error);
    throw new AppError('Failed to clear old error logs', 500);
  }
}

/**
 * Search error logs by text
 * @param {string} query - Search query
 * @param {object} options - Search options
 * @returns {Promise<array>} Matching error logs
 */
export async function searchErrorLogs(query, options = {}) {
  try {
    if (!query) {
      throw new AppError('Search query is required');
    }

    const { limit = 50, offset = 0 } = options;

    let searchQuery = supabase
      .from('error_logs')
      .select('*')
      .or(`error_message.ilike.%${query}%,endpoint.ilike.%${query}%,error_type.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await searchQuery;

    if (error) throw error;

    return data || [];
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in searchErrorLogs:', error);
    throw new AppError('Failed to search error logs', 500);
  }
}

/**
 * Create error notification/alert
 * @param {string} errorId - Error log ID
 * @param {object} alertConfig - Alert configuration
 * @returns {Promise<object>} Alert record
 */
export async function createErrorAlert(errorId, alertConfig = {}) {
  try {
    const {
      severity = 'critical',
      notifyEmail = process.env.ERROR_ALERT_EMAIL,
      title = 'Error Alert',
      message = null
    } = alertConfig;

    if (!notifyEmail) {
      console.warn('ERROR_ALERT_EMAIL not configured - skipping alert notification');
      return null;
    }

    // In production, this would send email via email service
    console.error(`🚨 ERROR ALERT (${severity}): ${title}`);
    if (message) {
      console.error(`   ${message}`);
    }
    console.error(`   Error ID: ${errorId}`);

    return {
      id: errorId,
      severity,
      title,
      message,
      notified_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in createErrorAlert:', error);
    return null;
  }
}

export default {
  logError,
  getSeverity,
  getErrorLogs,
  getErrorStats,
  clearOldErrorLogs,
  searchErrorLogs,
  createErrorAlert
};
