/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 1: backend/server.js
 * Production-ready Express Server for Password Vault
 * Includes: Security headers (Helmet), Rate Limiting, Morgan logger, 
 * JSON body parser, MongoDB integration (Mongoose) with graceful fallback, 
 * dynamic route loading, and comprehensive global error handling.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Ensure environmental variables are loaded from the project root
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { mongoose, isDbConnected } = require('./db/connection');

const app = express();
const PORT = 3000; // Hardcoded port specified by system environment constraints

// ==========================================
// 1. DATABASE CONNECTION
// ==========================================
// Handled by resilient adapter inside backend/db/connection.js


// ==========================================
// 2. MIDDLEWARE CONFIGURATIONS
// ==========================================

// Global Security Headers via Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https://*"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ✅ FIXED: CORS - Allow Vercel frontend + Render + Local dev
const allowedOrigins = [
  process.env.APP_URL,
  'https://password-vault-6b7loyap0-nathankiruba8-webs-projects.vercel.app',
  'https://password-vault-3in6.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    } else {
      return callback(new Error('Blocked by CORS policy. Origin: ' + origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Morgan HTTP request logging (Standard format for dev / Combined for prod)
const loggerFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(loggerFormat));

// Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Maximum of 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    error: 'Too many requests. Please try again later.'
  }
});
app.use('/api/', apiLimiter);

// ==========================================
// 3. ROUTE REGISTRATION (With Resilient Chaining)
// ==========================================

// Dynamic route loaders so the server runs during progressive files delivery
let authRouter = require('./routes/authRoutes');
let passwordRouter = require('./routes/passwordRoutes');
let securityRouter = require('./routes/securityRoutes');

// Prefix Registration
app.use('/api/auth', authRouter);
app.use('/api/passwords', passwordRouter);
app.use('/api/security', securityRouter);
app.use('/api/vault', passwordRouter); // Fallback alias in case any code references /api/vault

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: isDbConnected() ? 'connected' : 'local_fallback'
  });
});

// ==========================================
// 4. VITE SERVICE MIDDLEWARE & STATIC ASSETS
// ==========================================

if (process.env.NODE_ENV !== 'production') {
  // In development, serve front-end through Vite's dev server middleware
  try {
    const { createServer: createViteServer } = require('vite');
    createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    }).then((vite) => {
      app.use(vite.middlewares);
      console.log('Vite development server middleware integrated into Express.');
    }).catch((err) => {
      console.error('Initialization error during Vite compilation:', err);
    });
  } catch (err) {
    console.error('Failed to resolve Vite integration dependencies.', err);
  }
} else {
  // In production, serve absolute built assets
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ==========================================
// 5. ERROR HANDLING MIDDLEWARE
// ==========================================

// Handle API endpoints 404 falling through
app.use('/api', (req, res, next) => {
  res.status(404).json({ error: 'Endpoint requested does not exist.' });
});

// Centralized error recovery middleware
app.use((err, req, res, next) => {
  console.error('[Global Error]:', err.stack || err);
  
  const statusCode = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';
  
  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: statusCode,
      ...(isProd ? {} : { stack: err.stack })
    }
  });
});

// ==========================================
// 6. SERVER BOOTUP
// ==========================================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express server running on http://localhost:${PORT}`);
  console.log(`Environment mode: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = server;