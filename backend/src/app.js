const express = require('express');
const cors = require('cors');
const { getAppInfo } = require('./utils/helpers');
require('dotenv').config();

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logging (Development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ==========================================
// ROUTES
// ==========================================

// Import main routes
const routes = require('./routes');

// Mount API routes
app.use('/api', routes);

// Root endpoint - Simplified response
app.get('/', (req, res) => {
  // For testing/development - show basic info
  if (process.env.NODE_ENV === 'development') {
    const appInfo = getAppInfo();
    res.json({
      success: true,
      ...appInfo
    });
  } else {
    // For production - minimal response
    res.status(200).json({
      success: true,
      message: 'OK',
      status: 200
    });
  }
});

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(err.status || 500).json({
    success: false,
    message: errorMessage,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
