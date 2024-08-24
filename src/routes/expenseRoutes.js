const express = require('express');
const expenseController = require('../controllers/expenseController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const injectPool = require('../middlewares/poolMiddleware');

const router = express.Router();

// Apply the pool middleware to all routes
router.use(injectPool);

// Routes for managing expenses
router.get('/', authenticateToken, expenseController.getExpenses);
router.get('/:id', authenticateToken, expenseController.getExpenseById);
router.post('/', authenticateToken, expenseController.createExpense);
router.put('/:id', authenticateToken, expenseController.updateExpense);
router.delete('/:id', authenticateToken, expenseController.deleteExpense);

module.exports = router;
