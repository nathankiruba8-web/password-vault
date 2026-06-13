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

// CORS FIRST
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.options('*', cors());

// Helmet AFTER CORS
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

const authRouter = require('./routes/authRoutes');
const passwordRouter = require('./routes/passwordRoutes');
const securityRouter = require('./routes/securityRoutes');

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

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint requested does not exist.' });
});

app.use((err, req, res, next) => {
  console.error('[Global Error]:', err.stack || err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: statusCode
    }
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express server running on port ${PORT}`);
});

module.exports = server;