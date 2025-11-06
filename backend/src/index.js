import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { testDatabaseConnection } from './config/database.js';
import { testResendConnection } from './config/resend.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import customersRouter from './routes/customers.js';
import authRouter from './routes/auth.js';

// Load environment variables
dotenv.config();

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
    console.error('❌ Failed to connect to database. Exiting.');
    process.exit(1);
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
