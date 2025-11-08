import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/database.js';
import { signAdminToken, verifyToken } from '../config/jwt.js';
import { verifyJWT } from '../middleware/auth.js';
import { validationChains, handleValidationErrors } from '../middleware/validation.js';
import { asyncHandler, AppError, NotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Admin login
 */
router.post('/login', validationChains.login, handleValidationErrors, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Get admin by email
  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('is_active', true)
    .single();

  if (adminError || !admin) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password',
      details: [{ message: 'Authentication failed' }]
    });
  }

  // Compare password
  const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password',
      details: [{ message: 'Authentication failed' }]
    });
  }

  // Update last login
  await supabase
    .from('admins')
    .update({ last_login_at: new Date() })
    .eq('id', admin.id);

  // Generate token
  const token = signAdminToken(admin.id, admin.email, admin.role);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role
      }
    }
  });
}));

/**
 * GET /api/auth/verify
 * Verify JWT token validity
 */
router.get('/verify', verifyJWT, asyncHandler(async (req, res) => {
  try {
    const decoded = verifyToken(req.token);

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        admin: {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role
        }
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
}));

/**
 * POST /api/auth/logout
 * Logout (client-side token removal)
 */
router.post('/logout', verifyJWT, asyncHandler(async (req, res) => {
  // Token is invalidated on client side, we just confirm
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

/**
 * POST /api/auth/change-password
 * Change admin password
 */
router.post('/change-password', verifyJWT, validationChains.changePassword, handleValidationErrors, asyncHandler(async (req, res) => {
  const { password, new_password } = req.body;
  const adminId = req.user.sub;

  // Get admin
  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('password_hash')
    .eq('id', adminId)
    .single();

  if (adminError || !admin) {
    throw new NotFoundError('Admin');
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: 'Current password is incorrect'
    });
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(new_password, 10);

  // Update password
  const { error: updateError } = await supabase
    .from('admins')
    .update({
      password_hash: hashedPassword,
      updated_at: new Date()
    })
    .eq('id', adminId);

  if (updateError) throw updateError;

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

export default router;
