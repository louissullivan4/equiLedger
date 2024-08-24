const pool = require('../utils/db'); // Adjust the path to your db configuration

const injectPool = (req, res, next) => {
    req.pool = pool;
    next();
};

module.exports = injectPool;