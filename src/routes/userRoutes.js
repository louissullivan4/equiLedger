const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken, authoriseRole } = require('../middlewares/authMiddleware');
const router = express.Router();

// POST /users - Create a new user
router.post('/', userController.createUser);

// GER /users - Get all users if you are authorised to with admin or accountant role
router.get('/', authenticateToken, authoriseRole(['admin', 'accountant']), userController.getAllUsers);

// GET /users/:id - Get a user by ID
router.get('/:id', authenticateToken, userController.getUser);

// GET /users/email/:email - Get a user by email
router.get('/email/:email', authenticateToken, userController.getUserByEmail);

// PUT /users/email/:email - Update user information (requires authentication)
router.put('/email/:email', authenticateToken, userController.updateUser);

// DELETE /users/email/:email - Delete a user by email (admin/accountant only)
router.delete('/email/:email', authenticateToken, userController.deleteUser);

// POST /login - Authenticate a user
router.post('/login', userController.login);

module.exports = router;
