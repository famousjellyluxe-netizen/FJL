/**
 * Order Notes Service
 * Manages customer and admin notes on orders
 *
 * Features:
 * - Public notes (visible to both customer and admin)
 * - Internal notes (admin only, e.g., refund reason, issues)
 * - Audit trail for all communications
 * - Thread-like structure for conversations
 */

import { supabase } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Add a note to an order
 * @param {string} orderId - Order ID
 * @param {string} authorId - User ID who created the note
 * @param {string} authorType - 'admin' or 'customer'
 * @param {string} note - Note text content
 * @param {object} options - Additional options
 * @param {boolean} options.isInternal - If true, only admins see this note
 * @returns {Promise<object>} Created note
 */
export async function addOrderNote(orderId, authorId, authorType, note, options = {}) {
  try {
    // Validate inputs
    if (!orderId || !authorId || !authorType || !note) {
      throw new AppError('Order ID, author ID, author type, and note content are required');
    }

    if (!['admin', 'customer'].includes(authorType)) {
      throw new AppError('Author type must be either "admin" or "customer"');
    }

    if (note.trim().length === 0) {
      throw new AppError('Note content cannot be empty');
    }

    if (note.length > 5000) {
      throw new AppError('Note content cannot exceed 5000 characters');
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

    // Create note
    const { data, error } = await supabase
      .from('order_notes')
      .insert([{
        order_id: orderId,
        author_id: authorId,
        author_type: authorType,
        note: note.trim(),
        is_internal: options.isInternal || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating order note:', error);
      throw new AppError('Failed to create note', 500);
    }

    console.log(`✓ Note added to order ${orderId} by ${authorType} ${authorId}`);
    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in addOrderNote:', error);
    throw new AppError('Failed to add order note', 500);
  }
}

/**
 * Get notes for an order
 * Respects visibility rules based on user role
 * @param {string} orderId - Order ID
 * @param {object} context - User context { userId, userRole }
 * @param {object} options - Query options
 * @param {number} options.limit - Number of notes to fetch
 * @param {number} options.offset - Pagination offset
 * @returns {Promise<array>} Array of notes visible to user
 */
export async function getOrderNotes(orderId, context = {}, options = {}) {
  try {
    if (!orderId) {
      throw new AppError('Order ID is required');
    }

    const { limit = 50, offset = 0 } = options;
    const { userId, userRole } = context;

    // Verify user has access to this order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('user_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new AppError('Order not found', 404);
    }

    // Verify ownership: customer can only see own orders
    if (userRole !== 'owner' && userRole !== 'manager' && order.user_id !== userId) {
      throw new AppError('Access denied', 403);
    }

    // Build query
    let query = supabase
      .from('order_notes')
      .select('id, order_id, author_id, author_type, note, is_internal, created_at, updated_at')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    // Hide internal notes from customers
    if (userRole !== 'owner' && userRole !== 'manager') {
      query = query.eq('is_internal', false);
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching order notes:', error);
      throw new AppError('Failed to fetch notes', 500);
    }

    return {
      notes: data || [],
      total: count || 0,
      limit,
      offset,
      page: Math.floor(offset / limit) + 1
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in getOrderNotes:', error);
    throw new AppError('Failed to fetch order notes', 500);
  }
}

/**
 * Get all customer-visible notes for an order
 * For customer-facing endpoints
 * @param {string} orderId - Order ID
 * @returns {Promise<array>} Public notes only
 */
export async function getCustomerVisibleNotes(orderId) {
  try {
    if (!orderId) {
      throw new AppError('Order ID is required');
    }

    const { data, error } = await supabase
      .from('order_notes')
      .select('id, author_type, note, created_at')
      .eq('order_id', orderId)
      .eq('is_internal', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer notes:', error);
      throw new AppError('Failed to fetch notes', 500);
    }

    return data || [];
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in getCustomerVisibleNotes:', error);
    throw new AppError('Failed to fetch notes', 500);
  }
}

/**
 * Delete a note (admin only)
 * @param {string} noteId - Note ID
 * @param {string} adminId - Admin user ID deleting the note
 * @returns {Promise<void>}
 */
export async function deleteOrderNote(noteId, adminId) {
  try {
    if (!noteId || !adminId) {
      throw new AppError('Note ID and admin ID are required');
    }

    // Verify note exists
    const { data: note, error: noteError } = await supabase
      .from('order_notes')
      .select('id, order_id')
      .eq('id', noteId)
      .single();

    if (noteError || !note) {
      throw new AppError('Note not found', 404);
    }

    // Delete note
    const { error } = await supabase
      .from('order_notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      console.error('Error deleting note:', error);
      throw new AppError('Failed to delete note', 500);
    }

    console.log(`✓ Note ${noteId} deleted by admin ${adminId}`);
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in deleteOrderNote:', error);
    throw new AppError('Failed to delete note', 500);
  }
}

/**
 * Add a quick internal note (admin convenience function)
 * Common use: marking refund reason, issue tracking
 * @param {string} orderId - Order ID
 * @param {string} adminId - Admin user ID
 * @param {string} note - Note content
 * @returns {Promise<object>} Created note
 */
export async function addInternalNote(orderId, adminId, note) {
  return addOrderNote(orderId, adminId, 'admin', note, {
    isInternal: true
  });
}

/**
 * Get note statistics for an order
 * @param {string} orderId - Order ID
 * @returns {Promise<object>} Stats including counts, last note, etc
 */
export async function getOrderNoteStats(orderId) {
  try {
    if (!orderId) {
      throw new AppError('Order ID is required');
    }

    const { data, error, count } = await supabase
      .from('order_notes')
      .select('id, created_at, author_type, is_internal')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching note stats:', error);
      throw new AppError('Failed to fetch statistics', 500);
    }

    const notes = data || [];
    const adminNotes = notes.filter(n => n.author_type === 'admin').length;
    const customerNotes = notes.filter(n => n.author_type === 'customer').length;
    const internalNotes = notes.filter(n => n.is_internal).length;

    return {
      total_notes: notes.length,
      admin_notes: adminNotes,
      customer_notes: customerNotes,
      internal_notes: internalNotes,
      public_notes: notes.length - internalNotes,
      last_note: notes[0]?.created_at || null,
      has_recent_activity: notes.length > 0 && notes[0]?.created_at
        ? new Date() - new Date(notes[0].created_at) < 24 * 60 * 60 * 1000 // Within 24 hours
        : false
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in getOrderNoteStats:', error);
    throw new AppError('Failed to fetch note statistics', 500);
  }
}

/**
 * Search notes across orders (admin only)
 * @param {string} searchTerm - Text to search for
 * @param {object} options - Query options
 * @returns {Promise<array>} Matching notes
 */
export async function searchOrderNotes(searchTerm, options = {}) {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new AppError('Search term is required');
    }

    const { limit = 50, offset = 0 } = options;

    // Using Postgres text search
    const { data, error, count } = await supabase
      .from('order_notes')
      .select('id, order_id, author_type, note, created_at')
      .ilike('note', `%${searchTerm}%`) // Case-insensitive search
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error searching notes:', error);
      throw new AppError('Search failed', 500);
    }

    return {
      results: data || [],
      total: count || 0,
      limit,
      offset
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in searchOrderNotes:', error);
    throw new AppError('Failed to search notes', 500);
  }
}

export default {
  addOrderNote,
  getOrderNotes,
  getCustomerVisibleNotes,
  deleteOrderNote,
  addInternalNote,
  getOrderNoteStats,
  searchOrderNotes,
};
