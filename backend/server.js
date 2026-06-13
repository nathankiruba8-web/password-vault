/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { mongoose, isDbConnected } = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. DATABASE CONNECTION
// ==========================================

// ==========================================
// 2. MIDDLEWARE CONFIGURATIONS
// ==========================================

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

// ✅ FIXED: Allow ALL origins temporarily
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.options('*', cors());

const loggerFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(loggerFormat));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too many requests. Please try again later.'
  }
});
app.use('/api/', apiLimiter);

// ==========================================
// 3. ROUTE REGISTRATION
// ==========================================

let authRouter = require('./routes/authRoutes');
let passwordRouter = require('./routes/passwordRoutes');
let securityRouter = require('./routes/securityRoutes');

app.use('/api/auth', authRouter);
app.use('/api/passwords', passwordRouter);
app.use('/api/security', securityRouter);
app.use('/api/vault', passwordRouter);

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
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ==========================================
// 5. ERROR HANDLING MIDDLEWARE
// ==========================================

app.use('/api', (req, res, next) => {
  res.status(404).json({ error: 'Endpoint requested does not exist.' });
});

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
  console.log(`Express server running on port ${PORT}`);
  console.log(`Environment mode: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = server;