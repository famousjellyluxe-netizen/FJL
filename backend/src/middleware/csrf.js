/**
 * CSRF (Cross-Site Request Forgery) Protection Middleware
 * Generates and validates CSRF tokens to prevent unauthorized state changes
 */

import crypto from 'crypto';

// Store valid tokens (in production, use Redis or database)
const validTokens = new Map();

// Token expiry time (1 hour)
const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

/**
 * Generate a unique CSRF token
 * @returns {string} CSRF token
 */
export function generateCSRFToken() {
  const token = crypto.randomBytes(32).toString('hex');

  // Store token with expiry timestamp
  validTokens.set(token, Date.now() + TOKEN_EXPIRY_MS);

  // Cleanup old tokens every 10 minutes
  if (Math.random() < 0.1) {
    cleanupExpiredTokens();
  }

  return token;
}

/**
 * Cleanup expired CSRF tokens
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, expiry] of validTokens.entries()) {
    if (expiry < now) {
      validTokens.delete(token);
    }
  }
}

/**
 * Validate a CSRF token
 * @param {string} token - Token to validate
 * @returns {boolean} True if valid
 */
export function validateCSRFToken(token) {
  if (!token) return false;

  const expiry = validTokens.get(token);
  if (!expiry) return false;

  // Check if token has expired
  if (expiry < Date.now()) {
    validTokens.delete(token);
    return false;
  }

  return true;
}

/**
 * Invalidate a CSRF token (use after successful form submission)
 * @param {string} token - Token to invalidate
 */
export function invalidateCSRFToken(token) {
  validTokens.delete(token);
}

/**
 * Middleware to generate CSRF token for GET requests
 * Adds token to locals for template rendering
 */
export function csrfTokenMiddleware(req, res, next) {
  // Generate token for all requests (stored in session/cookie)
  if (!req.session) {
    req.session = {};
  }

  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCSRFToken();
  }

  // Make token available to templates and responses
  res.locals.csrfToken = req.session.csrfToken;

  next();
}

/**
 * Middleware to validate CSRF token for POST/PUT/DELETE requests
 * Skips validation for API endpoints with JWT authentication
 */
export function validateCSRFTokenMiddleware(req, res, next) {
  // Skip validation for GET/HEAD/OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip validation for authenticated API requests with JWT
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return next();
  }

  // Get token from request
  const token = req.body._csrf || req.headers['x-csrf-token'];

  if (!token) {
    console.warn(`⚠️ CSRF token missing for ${req.method} ${req.path}`);
    return res.status(403).json({
      success: false,
      error: 'CSRF token missing',
      details: [{
        field: '_csrf',
        message: 'CSRF protection token is required'
      }]
    });
  }

  // Validate token
  if (!validateCSRFToken(token)) {
    console.error(`❌ Invalid CSRF token for ${req.method} ${req.path}`);
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token',
      details: [{
        field: '_csrf',
        message: 'CSRF protection validation failed. Please try again.'
      }]
    });
  }

  next();
}

/**
 * Get current session CSRF token
 * @param {object} req - Express request object
 * @returns {string|null} Current token or null
 */
export function getCSRFToken(req) {
  return req.session?.csrfToken || null;
}

/**
 * Generate new CSRF token and invalidate old one
 * (Useful for multi-step forms)
 * @param {object} req - Express request object
 * @returns {string} New CSRF token
 */
export function rotateCSRFToken(req) {
  if (req.session?.csrfToken) {
    invalidateCSRFToken(req.session.csrfToken);
  }

  const newToken = generateCSRFToken();
  if (!req.session) {
    req.session = {};
  }
  req.session.csrfToken = newToken;

  return newToken;
}

export default {
  generateCSRFToken,
  validateCSRFToken,
  invalidateCSRFToken,
  csrfTokenMiddleware,
  validateCSRFTokenMiddleware,
  getCSRFToken,
  rotateCSRFToken
};
