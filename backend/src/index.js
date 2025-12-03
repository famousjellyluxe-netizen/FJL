import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');

// Load environment variables FIRST before any other imports
const envPath = path.join(backendRoot, '.env');
const result = dotenv.config({ path: envPath });

console.log('📝 Environment file path:', envPath);
console.log('✅ Loaded environment variables:', result.parsed ? Object.keys(result.parsed).length : 0, 'variables');

if (result.error && result.error.code !== 'ENOENT') {
  console.error('Error loading .env file:', result.error);
}

// Debug: Log first few env vars to verify they're loaded
if (result.parsed) {
  console.log('SUPABASE_URL loaded:', !!result.parsed.SUPABASE_URL);
  console.log('SUPABASE_KEY loaded:', !!result.parsed.SUPABASE_KEY);
  console.log('process.env.SUPABASE_URL:', process.env.SUPABASE_URL);
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Use dynamic imports for modules that depend on env vars loaded by dotenv
const configDatabase = await import('./config/database.js');
const testDatabaseConnection = configDatabase.testDatabaseConnection;
const initializeDatabase = configDatabase.initializeDatabase;

const configResend = await import('./config/resend.js');
const testResendConnection = configResend.testResendConnection;

const errorHandlers = await import('./middleware/errorHandler.js');
const errorHandler = errorHandlers.errorHandler;
const notFoundHandler = errorHandlers.notFoundHandler;

// Initialize database connection NOW that dotenv has loaded environment variables
initializeDatabase();

const productsRouterModule = await import('./routes/products.js');
const productsRouter = productsRouterModule.default;

const ordersRouterModule = await import('./routes/orders.js');
const ordersRouter = ordersRouterModule.default;

const customersRouterModule = await import('./routes/customers.js');
const customersRouter = customersRouterModule.default;

const authRouterModule = await import('./routes/auth.js');
const authRouter = authRouterModule.default;

const settingsRouterModule = await import('./routes/settings.js');
const settingsRouter = settingsRouterModule.default;

const contactRouterModule = await import('./routes/contact.js');
const contactRouter = contactRouterModule.default;

const categoriesRouterModule = await import('./routes/categories.js');
const categoriesRouter = categoriesRouterModule.default;

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;
const nodeEnv = process.env.NODE_ENV || 'development';

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Configure Helmet with relaxed CSP to allow CDN scripts and inline scripts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https:", "wss:"],
      frameSrc: ["'self'"],
      scriptSrcAttr: ["'self'"],
    },
  },
}));

// CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(origin => origin.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '15000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests, please try again later',
});

app.use(limiter);

// ============================================================================
// BODY PARSING & COMPRESSION
// ============================================================================

app.use(compression()); // Compress responses
app.use(express.json({ limit: '10mb' })); // Parse JSON
app.use(express.urlencoded({ limit: '10mb', extended: true })); // Parse URL-encoded

// ============================================================================
// LOGGING
// ============================================================================

app.use(morgan(nodeEnv === 'production' ? 'combined' : 'dev'));

// ============================================================================
// STATIC FILE SERVING (Frontend)
// ============================================================================

// Serve static files from dist folder (frontend build)
const distPath = path.resolve(backendRoot, '../dist');
console.log(`📁 Frontend dist path: ${distPath}`);
console.log(`✓ Frontend files exist: ${fs.existsSync(distPath) ? 'YES' : 'NO'}`);
if (fs.existsSync(distPath)) {
  const files = fs.readdirSync(distPath).slice(0, 10);
  console.log(`📂 Sample files in dist/: ${files.join(', ')}`);
}
app.use(express.static(distPath));

// ============================================================================
// HEALTH CHECK ENDPOINTS
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: nodeEnv,
  });
});

// Newsletter health check endpoint
app.get('/api/health/newsletter', (req, res) => {
  const status = {
    newsletter_enabled: !!process.env.RESEND_API_KEY && !!process.env.STORE_EMAIL,
    database_configured: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_KEY,
    email_service_configured: !!process.env.RESEND_API_KEY,
    store_email_configured: !!process.env.STORE_EMAIL,
    issues: []
  };

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    status.issues.push('Database not configured - subscriptions cannot be saved');
  }
  if (!process.env.RESEND_API_KEY) {
    status.issues.push('RESEND_API_KEY not set - emails will not be sent');
  }
  if (!process.env.STORE_EMAIL) {
    status.issues.push('STORE_EMAIL not set - email service will crash when attempting to send');
  }

  res.json(status);
});

// ============================================================================
// API ROUTES
// ============================================================================

app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/contact', contactRouter);

// ============================================================================
// SPA FALLBACK ROUTING
// ============================================================================

// Fallback route for Single Page App - serve index.html for non-API requests
// This allows client-side routing to work properly
// MUST come AFTER static file serving and API routes
app.get('*', (req, res, next) => {
  // Serve index.html for all non-API requests (SPA routing)
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      // If index.html doesn't exist, let the error handler deal with it
      next();
    }
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use(notFoundHandler); // 404 handler
app.use(errorHandler); // Global error handler

// ============================================================================
// DATABASE & SERVICE INITIALIZATION
// ============================================================================

async function initialize() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║     Famous Jolly Luxe (FJL) - Backend API Server         ║
║                    v1.0.0                                ║
╚═══════════════════════════════════════════════════════════╝
  `);

  console.log(`Environment: ${nodeEnv}`);
  console.log(`Port: ${port}`);

  // ===== CRITICAL: Check required environment variables =====
  console.log('\n🔍 Checking critical environment variables...');
  const envChecks = {
    SUPABASE_URL: { required: true, status: !!process.env.SUPABASE_URL },
    SUPABASE_KEY: { required: true, status: !!process.env.SUPABASE_KEY },
    RESEND_API_KEY: { required: false, status: !!process.env.RESEND_API_KEY },
    STORE_EMAIL: { required: false, status: !!process.env.STORE_EMAIL },
    APP_URL: { required: false, status: !!process.env.APP_URL }
  };

  let criticalMissing = [];
  let warningMissing = [];

  Object.entries(envChecks).forEach(([key, { required, status }]) => {
    const symbol = status ? '✅' : '❌';
    const type = required ? 'CRITICAL' : 'OPTIONAL';
    console.log(`  ${symbol} ${key}: ${status ? 'SET' : `MISSING (${type})`}`);

    if (!status) {
      if (required) criticalMissing.push(key);
      else warningMissing.push(key);
    }
  });

  if (criticalMissing.length > 0) {
    console.error(`\n❌ CRITICAL: Missing required variables: ${criticalMissing.join(', ')}`);
    console.error('Newsletter system will NOT work without these variables in .env');
    if (nodeEnv === 'production') {
      console.error('❌ Production deployment blocked due to missing critical variables.');
      process.exit(1);
    }
  }

  if (warningMissing.length > 0) {
    console.warn(`\n⚠️  WARNING: Missing optional variables: ${warningMissing.join(', ')}`);
    if (warningMissing.includes('RESEND_API_KEY')) {
      console.warn('  → Email notifications will NOT be sent (RESEND_API_KEY missing)');
    }
    if (warningMissing.includes('STORE_EMAIL')) {
      console.warn('  → Email service will crash when attempting to send (STORE_EMAIL missing)');
    }
  }

  // Test database connection
  console.log('\n📦 Testing database connection...');
  const dbConnected = await testDatabaseConnection();

  if (!dbConnected) {
    console.warn('⚠️  Database not connected - API will have limited functionality');
    if (nodeEnv === 'production') {
      console.error('❌ Production requires database. Exiting.');
      process.exit(1);
    }
  }

  // Test Resend connection
  console.log('📧 Testing email service (Resend)...');
  const emailConnected = await testResendConnection();

  if (!emailConnected) {
    console.warn('⚠️  Email service may not be properly configured');
    console.warn('  → Newsletter subscriptions will be created but emails will NOT be sent');
  }

  // Start server
  app.listen(port, () => {
    console.log(`
✅ Server started successfully!
🌍 API running at: http://localhost:${port}
📚 API Documentation: http://localhost:${port}/api/docs (coming soon)
🏥 Health check: GET /health
    `);
  });
}

// ============================================================================
// ERROR HANDLING FOR UNHANDLED REJECTIONS
// ============================================================================

process.on('unhandledRejection', err => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start the application
initialize().catch(err => {
  console.error('Initialization failed:', err);
  process.exit(1);
});

export default app;
