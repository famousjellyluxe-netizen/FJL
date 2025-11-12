import express from 'express';
import crypto from 'crypto';
import { supabase } from '../config/database.js';
import { verifyJWT, requireAdmin, requirePermission } from '../middleware/auth.js';
import { validationChains, handleValidationErrors } from '../middleware/validation.js';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler.js';
import * as emailService from '../services/emailService.js';

const router = express.Router();

/**
 * POST /api/customers
 * Register new customer (public)
 */
router.post('/', validationChains.registerCustomer, handleValidationErrors, asyncHandler(async (req, res) => {
  const { email, first_name, last_name, phone } = req.body;

  // Check if customer already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'Customer with this email already exists'
    });
  }

  // Create customer
  const { data: customer, error } = await supabase
    .from('users')
    .insert([{
      email: email.toLowerCase(),
      first_name,
      last_name,
      phone: phone || null,
      is_member: false
    }])
    .select()
    .single();

  if (error) throw error;

  res.status(201).json({
    success: true,
    message: 'Customer registered successfully',
    data: {
      id: customer.id,
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name
    }
  });
}));

/**
 * GET /api/customers/:id
 * Get customer by ID (admin only)
 */
router.get('/:id', verifyJWT, requireAdmin, requirePermission('manage_customers'), asyncHandler(async (req, res) => {
  const { data: customer, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !customer) {
    throw new NotFoundError('Customer');
  }

  res.json({
    success: true,
    data: customer
  });
}));

/**
 * GET /api/customers/members/list
 * List all members (admin only)
 */
router.get('/members/list', verifyJWT, requireAdmin, requirePermission('manage_customers'), asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('members')
    .select('*', { count: 'exact' });

  if (req.query.subscribed !== undefined) {
    query = query.eq('is_subscribed', req.query.subscribed === 'true');
  }

  query = query.order('subscribed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  res.json({
    success: true,
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit)
    }
  });
}));

/**
 * GET /api/customers
 * List all customers (admin only)
 */
router.get('/', verifyJWT, requireAdmin, requirePermission('manage_customers'), asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('users')
    .select('*', { count: 'exact' });

  if (req.query.search) {
    query = query.or(`email.ilike.%${req.query.search}%,first_name.ilike.%${req.query.search}%,last_name.ilike.%${req.query.search}%`);
  }

  query = query.order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  res.json({
    success: true,
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit)
    }
  });
}));

/**
 * PUT /api/customers/:id
 * Update customer (admin only)
 */
router.put('/:id', verifyJWT, requireAdmin, requirePermission('manage_customers'), asyncHandler(async (req, res) => {
  const { first_name, last_name, phone, address, city, state, postal_code, country } = req.body;

  const updateData = {};
  if (first_name) updateData.first_name = first_name;
  if (last_name) updateData.last_name = last_name;
  if (phone) updateData.phone = phone;
  if (address) updateData.address = address;
  if (city) updateData.city = city;
  if (state) updateData.state = state;
  if (postal_code) updateData.postal_code = postal_code;
  if (country) updateData.country = country;

  const { data: customer, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !customer) {
    throw new NotFoundError('Customer');
  }

  res.json({
    success: true,
    message: 'Customer updated successfully',
    data: customer
  });
}));

/**
 * GET /api/customers/:userId/orders
 * Get customer order history (admin only)
 */
router.get('/:userId/orders', verifyJWT, requireAdmin, requirePermission('view_analytics'), asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .eq('user_id', req.params.userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  res.json({
    success: true,
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit)
    }
  });
}));

/**
 * POST /api/customers/members
 * Newsletter signup (public)
 */
router.post('/members/subscribe', validationChains.subscribeMember, handleValidationErrors, asyncHandler(async (req, res) => {
  const { email, full_name } = req.body;

  // Check if already subscribed
  const { data: existing } = await supabase
    .from('members')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'This email is already subscribed'
    });
  }

  // Generate unique unsubscribe token
  const unsubscribe_token = crypto.randomBytes(32).toString('hex');

  // Create member
  const { data: member, error } = await supabase
    .from('members')
    .insert([{
      email: email.toLowerCase(),
      full_name: full_name || null,
      is_subscribed: true,
      signup_source: req.body.source || 'homepage_modal',
      unsubscribe_token: unsubscribe_token
    }])
    .select()
    .single();

  if (error) throw error;

  // Send welcome email
  try {
    await emailService.sendMemberWelcome(member);
  } catch (emailError) {
    console.error('Error sending welcome email:', emailError);
  }

  res.status(201).json({
    success: true,
    message: 'Successfully subscribed to newsletter!',
    data: {
      id: member.id,
      email: member.email
    }
  });
}));

/**
 * GET /api/customers/members/unsubscribe
 * Public unsubscribe endpoint - no authentication required
 * Users can unsubscribe using the token from their email link
 */
router.get('/members/unsubscribe', asyncHandler(async (req, res) => {
  const { token } = req.query;

  // Validate token parameter
  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Unsubscribe token is required'
    });
  }

  // Find and update member by token
  const { data: member, error } = await supabase
    .from('members')
    .update({
      is_subscribed: false,
      unsubscribed_at: new Date().toISOString()
    })
    .eq('unsubscribe_token', token)
    .eq('is_subscribed', true) // Only unsubscribe if currently subscribed
    .select('id, email, full_name')
    .single();

  if (error || !member) {
    return res.status(404).json({
      success: false,
      error: 'Invalid or expired unsubscribe token, or already unsubscribed'
    });
  }

  console.log(`📭 Member unsubscribed: ${member.email}`);

  res.json({
    success: true,
    message: 'Successfully unsubscribed from newsletter',
    data: {
      email: member.email,
      full_name: member.full_name
    }
  });
}));

/**
 * PUT /api/customers/members/:id/unsubscribe
 * Unsubscribe member (admin only)
 */
router.put('/members/:id/unsubscribe', verifyJWT, requireAdmin, requirePermission('manage_customers'), asyncHandler(async (req, res) => {
  const { data: member, error } = await supabase
    .from('members')
    .update({
      is_subscribed: false,
      unsubscribed_at: new Date()
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !member) {
    throw new NotFoundError('Member');
  }

  res.json({
    success: true,
    message: 'Member unsubscribed successfully',
    data: member
  });
}));

/**
 * DELETE /api/customers/:id
 * Delete customer (admin only)
 */
router.delete('/:id', verifyJWT, requireAdmin, requirePermission('manage_customers'), asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', req.params.id);

  if (error) throw error;

  res.json({
    success: true,
    message: 'Customer deleted successfully'
  });
}));

export default router;
