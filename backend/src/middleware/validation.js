import { body, param, query, validationResult } from 'express-validator';

/**
 * Handle validation errors
 * Call this after validation chain
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const details = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: details
    });
  }

  next();
}

// ============================================================================
// REUSABLE VALIDATORS
// ============================================================================

export const validators = {
  // Email validation
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),

  // Password validation (for registration/creation)
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),

  // Login password validation (more lenient for existing passwords)
  loginPassword: body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required'),

  // Phone validation
  phone: body('phone')
    .optional()
    .matches(/^\+?[0-9]{10,}$/)
    .withMessage('Invalid phone number'),

  // Product validators
  productName: body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Product name must be between 3 and 255 characters'),

  productDescription: body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),

  productPrice: body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),

  productSKU: body('sku')
    .trim()
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('SKU must contain only uppercase letters, numbers, and hyphens'),

  productCategory: body('category_id')
    .optional()
    .if(() => body('category_id').exists())
    .isUUID()
    .withMessage('Invalid category ID'),

  // Order validators
  orderEmail: body('shipping_email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),

  orderPhone: body('shipping_phone')
    .matches(/^\+?[0-9]{10,}$/)
    .withMessage('Invalid phone number'),

  orderAddress: body('shipping_address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 5, max: 255 })
    .withMessage('Address must be between 5 and 255 characters'),

  orderCity: body('shipping_city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),

  orderState: body('shipping_state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),

  orderPostalCode: body('shipping_postal_code')
    .trim()
    .notEmpty()
    .withMessage('Postal code is required'),

  orderCountry: body('shipping_country')
    .trim()
    .notEmpty()
    .withMessage('Country is required'),

  // Customer validators
  firstName: body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters'),

  lastName: body('last_name')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters'),

  // UUID validators
  uuidParam: param('id')
    .isUUID()
    .withMessage('Invalid ID format'),

  // Pagination validators
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  // Filter validators
  searchQuery: query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),

  category: query('category')
    .optional()
    .trim(),

  sortBy: query('sort_by')
    .optional()
    .isIn(['name', 'price', 'created_at', 'popularity'])
    .withMessage('Invalid sort field'),

  sortOrder: query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  // Status validators
  orderStatus: body('status')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),

  paymentStatus: body('payment_status')
    .isIn(['pending', 'verified', 'failed'])
    .withMessage('Invalid payment status'),

  // Variant validators
  size: body('size')
    .trim()
    .notEmpty()
    .withMessage('Size is required')
    .isLength({ min: 1, max: 10 })
    .withMessage('Size must be between 1 and 10 characters'),

  color: body('color')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Color must not exceed 50 characters'),

  quantity: body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),

  stock: body('stock_quantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be 0 or greater')
};

// ============================================================================
// VALIDATION CHAINS FOR SPECIFIC ENDPOINTS
// ============================================================================

export const validationChains = {
  // Auth
  login: [
    validators.email,
    validators.loginPassword
  ],

  changePassword: [
    validators.password,
    body('new_password')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long'),
    body('confirm_password')
      .custom((value, { req }) => value === req.body.new_password)
      .withMessage('Passwords do not match')
  ],

  // Products
  createProduct: [
    validators.productName,
    validators.productDescription,
    validators.productPrice,
    validators.productSKU,
    validators.productCategory
  ],

  updateProduct: [
    validators.uuidParam,
    validators.productName,
    validators.productDescription,
    validators.productPrice
  ],

  // Orders
  createOrder: [
    body('items')
      .isArray({ min: 1 })
      .withMessage('Order must contain at least one item'),
    body('items.*.product_id')
      .isUUID()
      .withMessage('Invalid product ID'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
    validators.orderEmail,
    validators.orderPhone,
    validators.orderAddress,
    validators.orderCity,
    validators.orderState,
    validators.orderPostalCode,
    validators.orderCountry,
    body('buyer_name')
      .trim()
      .notEmpty()
      .withMessage('Buyer name is required')
  ],

  // Customers
  registerCustomer: [
    validators.email,
    validators.firstName,
    validators.lastName,
    validators.phone
  ],

  // Members (Newsletter)
  subscribeMember: [
    validators.email,
    body('full_name')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Name must not exceed 255 characters')
  ]
};

export default {
  handleValidationErrors,
  validators,
  validationChains
};
