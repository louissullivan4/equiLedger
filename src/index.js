const express = require('express');
const userRoutes = require('./routes/userRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const { Pool } = require('pg');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

app.use((req, res, next) => {
    req.pool = pool;
    next();
});

app.get('/', (req, res) => {
    res.send('Hello, welcome to EquiLedger!');
  });

app.use('/users', userRoutes);
app.use('/expenses', expenseRoutes);

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
