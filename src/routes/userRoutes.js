const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken, authoriseRole } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/', userController.createUser);

router.get('/', authenticateToken, authoriseRole(['admin', 'accountant']), userController.getAllUsers);

router.get('/:id', authenticateToken, userController.getUser);

router.get('/email/:email', authenticateToken, userController.getUserByEmail);

router.put('/email/:email', authenticateToken, userController.updateUser);

router.delete('/email/:email', authenticateToken, userController.deleteUser);

router.post('/login', userController.login);

module.exports = router;
