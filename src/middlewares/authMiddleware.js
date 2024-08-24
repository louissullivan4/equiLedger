const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) return res.status(403).json({ error: 'Access denied. Invalid bearer token.' });;
        req.user = user;
        next();
    });
};

const authoriseRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. You do not have the required role.' });
        }
        next();
    };
};

module.exports = {
    authenticateToken,
    authoriseRole
};