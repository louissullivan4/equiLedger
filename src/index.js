const express = require('express');
const userRoutes = require('./routes/userRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const path = require('path');
const logger = require('./utils/logger');
const pool = require('./utils/db');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
    req.pool = pool;
    next();
});

app.get('/', (req, res) => {
    res.send('Hello, welcome to EquiLedger!');
    logger.info('Root endpoint was accessed');
});

app.use('/users', userRoutes);
app.use('/expenses', expenseRoutes);

// Global error handler
app.use((err, req, res, next) => {
    logger.error('Unhandled error: %s', err.message);
    res.status(500).json({ error: 'Internal server error.' });
});

module.exports = app;
