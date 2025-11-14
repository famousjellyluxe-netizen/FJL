/**
 * Stock Update Service
 * Manages real-time stock updates for products
 * Uses Server-Sent Events (SSE) for efficient real-time updates
 *
 * Architecture:
 * - Maintains active SSE connections for each client
 * - Broadcasts stock changes to all subscribed clients
 * - Debounces rapid updates to reduce network overhead
 * - Automatic cleanup of stale connections
 */

import { supabase } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// In-memory store for active SSE connections
// Format: { clientId: { res, productIds: Set<string>, lastUpdate: timestamp } }
const activeConnections = new Map();

// Debounce timers to prevent flooding with updates
const debounceTimers = new Map();
const DEBOUNCE_DELAY_MS = 500; // Wait 500ms before sending update

/**
 * Generate unique client ID
 */
function generateClientId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Register a new SSE connection for stock updates
 * @param {object} res - Express response object
 * @param {string[]} productIds - Array of product IDs to monitor
 * @returns {string} Client ID for tracking
 */
export function registerStockUpdateClient(res, productIds = []) {
  const clientId = generateClientId();

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Send initial connection confirmation
  res.write(':connected\n\n');

  // Store connection info
  activeConnections.set(clientId, {
    res,
    productIds: new Set(productIds || []),
    lastUpdate: Date.now(),
  });

  console.log(`✓ Stock update client connected: ${clientId} (monitoring ${productIds?.length || 0} products)`);

  // Handle client disconnect
  res.on('close', () => {
    activeConnections.delete(clientId);
    console.log(`✓ Stock update client disconnected: ${clientId}`);
  });

  res.on('error', (error) => {
    console.error(`Error in stock update client ${clientId}:`, error);
    activeConnections.delete(clientId);
  });

  return clientId;
}

/**
 * Update product IDs for an existing connection
 * Allows client to dynamically change which products they monitor
 * @param {string} clientId - Client ID from registerStockUpdateClient
 * @param {string[]} productIds - New array of product IDs to monitor
 */
export function updateSubscribedProducts(clientId, productIds = []) {
  const connection = activeConnections.get(clientId);
  if (!connection) {
    console.warn(`Client ${clientId} not found for product subscription update`);
    return;
  }

  connection.productIds = new Set(productIds || []);
  console.log(`✓ Updated subscriptions for client ${clientId}: ${productIds?.length || 0} products`);
}

/**
 * Send stock update to all subscribed clients
 * Debounced to prevent network flooding
 * @param {string} productId - Product ID with changed stock
 * @param {object} stockData - Stock information { variant_id, product_id, new_quantity, old_quantity }
 */
export function broadcastStockUpdate(productId, stockData) {
  // Clear any existing debounce timer for this product
  if (debounceTimers.has(productId)) {
    clearTimeout(debounceTimers.get(productId));
  }

  // Set new debounce timer
  const timer = setTimeout(() => {
    sendStockUpdateToSubscribers(productId, stockData);
    debounceTimers.delete(productId);
  }, DEBOUNCE_DELAY_MS);

  debounceTimers.set(productId, timer);
}

/**
 * Send stock update to all clients subscribed to this product
 * @private
 */
function sendStockUpdateToSubscribers(productId, stockData) {
  let sendCount = 0;

  for (const [clientId, connection] of activeConnections.entries()) {
    // Only send to clients subscribed to this product
    if (!connection.productIds.has(productId)) {
      continue;
    }

    try {
      const message = JSON.stringify({
        type: 'stock_update',
        productId,
        variantId: stockData.variant_id,
        newQuantity: stockData.new_quantity,
        oldQuantity: stockData.old_quantity,
        timestamp: Date.now(),
        lowStock: stockData.new_quantity <= 5, // Flag items with low stock
      });

      // SSE format: event: type\ndata: json\n\n
      connection.res.write(`event: stock_update\n`);
      connection.res.write(`data: ${message}\n\n`);
      sendCount++;
    } catch (error) {
      console.error(`Error sending stock update to client ${clientId}:`, error);
      activeConnections.delete(clientId);
    }
  }

  if (sendCount > 0) {
    console.log(`📡 Stock update broadcast: sent to ${sendCount} clients`);
  }
}

/**
 * Get current stock for a product
 * Used to initialize client state on connection
 * @param {string} productId - Product ID
 * @returns {Promise<array>} Array of product variants with stock
 */
export async function getProductStock(productId) {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .select('id, product_id, size, color, stock_quantity')
      .eq('product_id', productId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching product stock:', error);
      throw new AppError('Failed to fetch product stock', 500);
    }

    return data || [];
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in getProductStock:', error);
    throw new AppError('Failed to fetch product stock', 500);
  }
}

/**
 * Get stock for multiple products
 * @param {string[]} productIds - Array of product IDs
 * @returns {Promise<object>} Object with product ID keys and stock arrays
 */
export async function getMultipleProductsStock(productIds = []) {
  try {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return {};
    }

    const { data, error } = await supabase
      .from('product_variants')
      .select('id, product_id, size, color, stock_quantity')
      .in('product_id', productIds)
      .order('product_id', { ascending: true });

    if (error) {
      console.error('Error fetching multiple products stock:', error);
      throw new AppError('Failed to fetch stock data', 500);
    }

    // Group by product ID
    const result = {};
    for (const productId of productIds) {
      result[productId] = data?.filter(v => v.product_id === productId) || [];
    }

    return result;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in getMultipleProductsStock:', error);
    throw new AppError('Failed to fetch stock data', 500);
  }
}

/**
 * Send heartbeat/ping to all connected clients
 * Prevents connections from being closed by proxies/firewalls
 * Should be called every 30 seconds
 */
export function sendHeartbeatToAllClients() {
  let count = 0;

  for (const [clientId, connection] of activeConnections.entries()) {
    try {
      connection.res.write(`:heartbeat\n\n`);
      count++;
    } catch (error) {
      console.error(`Error sending heartbeat to client ${clientId}:`, error);
      activeConnections.delete(clientId);
    }
  }

  if (count > 0) {
    console.log(`💓 Heartbeat sent to ${count} clients`);
  }
}

/**
 * Get connection statistics
 * Used for monitoring and debugging
 */
export function getConnectionStats() {
  let totalClients = 0;
  let totalMonitoredProducts = new Set();

  for (const connection of activeConnections.values()) {
    totalClients++;
    connection.productIds.forEach(p => totalMonitoredProducts.add(p));
  }

  return {
    activeConnections: totalClients,
    monitoredProducts: totalMonitoredProducts.size,
    timestamp: Date.now(),
  };
}

/**
 * Clean up stale connections (older than 5 minutes)
 * Called periodically to prevent memory leaks
 */
export function cleanupStaleConnections() {
  const now = Date.now();
  const STALE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  let cleanedCount = 0;

  for (const [clientId, connection] of activeConnections.entries()) {
    if (now - connection.lastUpdate > STALE_TIMEOUT_MS) {
      try {
        connection.res.end();
        activeConnections.delete(clientId);
        cleanedCount++;
      } catch (error) {
        console.error(`Error cleaning up stale connection ${clientId}:`, error);
        activeConnections.delete(clientId);
      }
    }
  }

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} stale connections`);
  }
}

/**
 * Initialize periodic maintenance tasks
 * Should be called once on server startup
 */
export function initializeMaintenanceTasks() {
  // Send heartbeat every 30 seconds to keep connections alive
  const heartbeatInterval = setInterval(() => {
    sendHeartbeatToAllClients();
  }, 30000);

  // Clean up stale connections every 5 minutes
  const cleanupInterval = setInterval(() => {
    cleanupStaleConnections();
  }, 5 * 60 * 1000);

  console.log('✓ Stock update service maintenance tasks initialized');

  // Return cleanup function for graceful shutdown
  return () => {
    clearInterval(heartbeatInterval);
    clearInterval(cleanupInterval);
  };
}

export default {
  registerStockUpdateClient,
  updateSubscribedProducts,
  broadcastStockUpdate,
  getProductStock,
  getMultipleProductsStock,
  sendHeartbeatToAllClients,
  getConnectionStats,
  cleanupStaleConnections,
  initializeMaintenanceTasks,
};
