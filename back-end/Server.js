const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const agentRoutes = require('./Routes/agentRoutes');
const spaceRoutes = require('./Routes/spaceRoutes');
const checklistRoutes = require('./Routes/checklistRoutes');
const itemRoutes = require('./Routes/itemRoutes');
const stepRoutes = require('./Routes/stepRoutes');
const categoryRoutes = require('./Routes/categoryRoutes');
const aggregationRoutes = require('./routes/aggregationRoutes');
// Import database connection
const connectDB = require('./config/db');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
connectDB();

// API Routes
app.use('/api/agents', agentRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/steps', stepRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/aggregation', aggregationRoutes);
// Health check endpoint
app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    const statusText = {
        0: 'Disconnected',
        1: 'Connected',
        2: 'Connecting',
        3: 'Disconnecting'
    };

    res.status(200).json({
        status: 'API is running',
        timestamp: new Date().toISOString(),
        database: statusText[dbStatus] || 'Unknown',
        uptime: process.uptime()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
    🚀 Server started successfully!
    📡 Port: ${PORT}
    🌐 URL: http://localhost:${PORT}
    📊 Health check: http://localhost:${PORT}/health
    📁 API Base: http://localhost:${PORT}/api
    
    📚 Available endpoints:
    👥 Agents:     /api/agents
    📁 Spaces:     /api/spaces
    📋 Checklists: /api/checklists
    ✅ Items:      /api/items
    🔢 Steps:      /api/steps
    🏷️  Categories: /api/categories
    `);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('\n👋 MongoDB connection closed. Goodbye!');
    process.exit(0);
});