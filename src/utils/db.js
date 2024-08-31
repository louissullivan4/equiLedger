const { Pool } = require('pg');
require('dotenv').config();

const connectionURL = process.env.DATABASE_URL;
console.log(connectionURL)
const pool = new Pool({
    connectionURL
});

// const pool = new Pool({
//     user: process.env.DB_USER,
//     host: process.env.DB_HOST,
//     database: process.env.DB_NAME,
//     password: process.env.DB_PASSWORD,
//     port: process.env.DB_PORT,
// });

module.exports = pool;
