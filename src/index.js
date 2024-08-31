const express = require('express');
const userRoutes = require('./routes/userRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const { Pool } = require('pg');
const path = require('path');
const logger = require('./utils/logger');
const pool = require('./utils/db')
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

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

app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
});
