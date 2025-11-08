import jwt from 'jsonwebtoken';

let JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const ADMIN_JWT_EXPIRY = process.env.ADMIN_JWT_EXPIRY || '7d';

// Use default for development if not set, throw error for production
if (!JWT_SECRET) {
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv === 'production') {
    throw new Error('JWT_SECRET must be set in environment variables for production');
  }
  // Default for development
  JWT_SECRET = 'dev-jwt-secret-key-at-least-32-chars-long-for-testing';
  console.warn('⚠️  Using default JWT_SECRET for development - set JWT_SECRET in .env for production');
} else if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

/**
 * Sign a JWT token for admin authentication
 * @param {string} adminId - Admin UUID
 * @param {string} email - Admin email
 * @param {string} role - Admin role (owner, manager, staff)
 * @returns {string} JWT token
 */
export function signAdminToken(adminId, email, role = 'staff') {
  try {
    const token = jwt.sign(
      {
        sub: adminId,
        email: email,
        role: role,
        type: 'admin'
      },
      JWT_SECRET,
      {
        expiresIn: ADMIN_JWT_EXPIRY,
        issuer: 'fjl-backend',
        audience: 'fjl-admin'
      }
    );
    return token;
  } catch (error) {
    console.error('Error signing token:', error.message);
    throw error;
  }
}

/**
 * Sign a JWT token for customer/user
 * @param {string} userId - User UUID
 * @param {string} email - User email
 * @returns {string} JWT token
 */
export function signUserToken(userId, email) {
  try {
    const token = jwt.sign(
      {
        sub: userId,
        email: email,
        type: 'user'
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRY,
        issuer: 'fjl-backend',
        audience: 'fjl-user'
      }
    );
    return token;
  } catch (error) {
    console.error('Error signing user token:', error.message);
    throw error;
  }
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'fjl-backend'
    });
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null if not found
 */
export function extractTokenFromHeader(authHeader) {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  return null;
}

/**
 * Check if token is admin token
 * @param {object} decoded - Decoded token payload
 * @returns {boolean}
 */
export function isAdminToken(decoded) {
  return decoded.type === 'admin';
}

/**
 * Check if token is user token
 * @param {object} decoded - Decoded token payload
 * @returns {boolean}
 */
export function isUserToken(decoded) {
  return decoded.type === 'user';
}

export default {
  signAdminToken,
  signUserToken,
  verifyToken,
  extractTokenFromHeader,
  isAdminToken,
  isUserToken
};
