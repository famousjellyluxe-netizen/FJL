import { verifyToken, extractTokenFromHeader, isAdminToken } from '../config/jwt.js';

/**
 * Verify JWT token middleware
 * Extracts and validates JWT from Authorization header
 */
export function verifyJWT(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided',
        details: [{ message: 'Missing Authorization header' }]
      });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    req.token = token;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.message,
      details: [{ message: 'Invalid or expired token' }]
    });
  }
}

/**
 * Require admin authentication
 * Must call verifyJWT first
 */
export function requireAdmin(req, res, next) {
  if (!req.user || !isAdminToken(req.user)) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      details: [{ message: 'You do not have permission to access this resource' }]
    });
  }

  next();
}

/**
 * Require specific admin role
 * Must call verifyJWT first
 * @param {string|string[]} allowedRoles - Role or array of roles
 */
export function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user || !isAdminToken(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
        details: [{ message: 'You do not have permission to access this resource' }]
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        details: [{ message: `Required role: ${roles.join(' or ')}` }]
      });
    }

    next();
  };
}

/**
 * Permission checker middleware
 * @param {string} permission - Permission to check
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user || !isAdminToken(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const adminPermissions = {
      owner: [
        'manage_products',
        'manage_categories',
        'manage_orders',
        'manage_customers',
        'manage_admins',
        'view_analytics'
      ],
      manager: [
        'manage_products',
        'manage_categories',
        'manage_orders',
        'manage_customers',
        'view_analytics'
      ],
      staff: [
        'manage_products',
        'manage_categories',
        'manage_orders',
        'view_analytics'
      ]
    };

    const userPermissions = adminPermissions[req.user.role] || [];

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        details: [{ message: `Permission required: ${permission}` }]
      });
    }

    next();
  };
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyToken(token);
      req.user = decoded;
      req.token = token;
    }
  } catch (error) {
    // Token is invalid, but that's okay for optional auth
    // Just don't set req.user
  }

  next();
}

export default {
  verifyJWT,
  requireAdmin,
  requireRole,
  requirePermission,
  optionalAuth
};
