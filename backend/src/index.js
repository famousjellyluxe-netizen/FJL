import dotenv from 'dotenv';
import path from 'path';
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

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;
const nodeEnv = process.env.NODE_ENV || 'development';

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

app.use(helmet()); // Set security HTTP headers

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
// HEALTH CHECK ENDPOINT
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: nodeEnv,
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/customers', customersRouter);

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
║     Famous Jelly Luxe (FJL) - Backend API Server         ║
║                    v1.0.0                                ║
╚═══════════════════════════════════════════════════════════╝
  `);

  console.log(`Environment: ${nodeEnv}`);
  console.log(`Port: ${port}`);

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
