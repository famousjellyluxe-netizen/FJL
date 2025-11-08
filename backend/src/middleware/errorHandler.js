/**
 * Global error handling middleware
 * Must be the last middleware registered in app
 */
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error
  console.error(`[${new Date().toISOString()}] ${status} - ${message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.details || [{ message: message }]
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      details: [{ message: 'Invalid or missing authentication token' }]
    });
  }

  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      success: false,
      error: 'Access denied',
      details: [{ message: 'You do not have permission to access this resource' }]
    });
  }

  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      success: false,
      error: 'Not found',
      details: [{ message: message }]
    });
  }

  // Database errors
  if (err.code === '23505') {
    // Unique violation
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      details: [{ message: 'This record already exists' }]
    });
  }

  if (err.code === '23503') {
    // Foreign key violation
    return res.status(400).json({
      success: false,
      error: 'Invalid reference',
      details: [{ message: 'Referenced record does not exist' }]
    });
  }

  // Default error response
  const response = {
    success: false,
    error: message
  };

  // Include error details in development
  if (process.env.NODE_ENV !== 'production') {
    response.details = [{ message: err.message, stack: err.stack }];
  }

  res.status(status).json(response);
}

/**
 * 404 Not Found handler
 * Should be registered after all other routes
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'Not found',
    details: [{ message: `Route ${req.method} ${req.path} not found` }]
  });
}

/**
 * Async error wrapper for route handlers
 * Wraps async functions to catch errors and pass to error handler
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create custom error class
 */
export class AppError extends Error {
  constructor(message, status = 500, details = []) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = 'AppError';
  }
}

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(details) {
    super('Validation error');
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends Error {
  constructor(resource) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

/**
 * Unauthorized error class
 */
export class UnauthorizedError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden error class
 */
export class ForbiddenError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError
};
