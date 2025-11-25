/**
 * Main server file for MindCubes Backend
 */

// Load environment variables FIRST (before any other imports)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/database');
const { initPostgres } = require('./config/postgres');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');

// Routes
const agentRoutes = require('./routes/agentRoutes');
const taskRoutes = require('./routes/taskRoutes');
const modelRoutes = require('./routes/modelRoutes');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const n8nRoutes = require('./routes/n8nRoutes');

// Initialize Express app
const app = express();

const startDatabases = async () => {
  try {
    await initPostgres();
  } catch (error) {
    logger.error(`Failed to initialize PostgreSQL: ${error.message}`);
    process.exit(1);
  }

  try {
    await connectDB();
  } catch (error) {
    logger.warn(`Starting server without MongoDB connection: ${error.message}`);
  }
};

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// API Routes
const API_VERSION = process.env.API_VERSION || 'v1';

app.get('/', (req, res) => {
  res.json({
    name: 'MindCubes API',
    version: API_VERSION,
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/agents`, agentRoutes);
app.use(`/api/${API_VERSION}/tasks`, taskRoutes);
app.use(`/api/${API_VERSION}/models`, modelRoutes);
app.use(`/api/${API_VERSION}/chat`, chatRoutes);
app.use(`/api/${API_VERSION}/n8n`, n8nRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
let server;

startDatabases().then(() => {
  server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

module.exports = app;

