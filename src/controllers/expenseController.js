const expenseModel = require('../models/expenseModel');
const logger = require('../utils/logger');
const { upload, uploadToCloudinary } = require('../middlewares/imageUpload');

const createExpense = async (req, res) => {
    const pool = req.pool;

    upload(req, res, async (err) => {
        if (err) {
            logger.error('Image upload error: %s', err.message);
            return res.status(400).json({ error: err.message });
        }

        if (req.file) {
            uploadToCloudinary(req, res, async (cloudinaryErr) => {
                if (cloudinaryErr) {
                    return res.status(500).json({ error: cloudinaryErr.message });
                }
                await proceedWithExpenseCreation(req, res);
            });
        } else {
            await proceedWithExpenseCreation(req, res);
        }
    });
};

async function proceedWithExpenseCreation(req, res) {
    const user_id = (req.user ? req.user.userId : '').toString();
    const { title, description, category, amount, currency } = req.body;
    const receipt_image_url = req.file ? req.file.path : null;

    if (!user_id || !title || !category || !amount || !currency) {
        logger.warn('Invalid input data for creating expense: %o', req.body);
        return res.status(400).json({ error: 'User ID, Title, category, amount, and currency are required.' });
    }

    const newExpense = {
        user_id,
        title,
        description,
        category,
        amount,
        currency,
        receipt_image_url,
    };

    try {
        const newExpenseAdded = await expenseModel.createExpense(req.pool, newExpense);
        logger.info('Expense created successfully: %o', newExpenseAdded);
        res.status(201).json(newExpenseAdded);
    } catch (dbErr) {
        logger.error('Database error while creating expense: %s', dbErr.message);
        res.status(500).json({ error: 'Failed to save expense to database.' });
    }
}

const getExpenses = async (req, res) => {
    try {
        const pool = req.pool;
        const user_id = req.user.userId;
        const category = req.query?.category;
        let expenses;

        if (category) {
            expenses = await expenseModel.getExpenseByCategory(pool, user_id, category);
            logger.info('Expenses fetched by category: %s for user: %s', category, user_id);
        } else {
            expenses = await expenseModel.getExpensesByUserId(pool, user_id);
            logger.info('Expenses fetched for user: %s', user_id);
        }

        res.status(200).json(expenses);
    } catch (error) {
        logger.error('Error fetching expenses: %s', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const getExpenseById = async (req, res) => {
    try {
        const pool = req.pool;
        const { id } = req.params;
        const user_id = req.user.userId;
        const userRole = req.user.role;

        const expense = await expenseModel.getExpenseById(pool, id);

        if (!expense) {
            logger.warn('Expense not found with ID: %s', id);
            return res.status(404).json({ error: 'Expense not found.' });
        }

        if (expense.user_id !== user_id && !['admin', 'accountant'].includes(userRole)) {
            logger.warn('Unauthorized access attempt by user: %s for expense ID: %s', user_id, id);
            return res.status(403).json({ error: 'Access denied. You do not have permission to view this expense.' });
        }

        logger.info('Expense fetched with ID: %s by user: %s', id, user_id);
        res.status(200).json(expense);
    } catch (error) {
        logger.error('Error fetching expense by ID: %s', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const updateExpense = async (req, res) => {
    try {
        const pool = req.pool;
        const { id } = req.params;
        const user_id = req.user.userId;
        const userRole = req.user.role;
        const { title, description, category, amount, currency, receipt_image_url } = req.body;

        const expense = await expenseModel.getExpenseById(pool, id);

        if (!expense) {
            logger.warn('Expense not found with ID: %s', id);
            return res.status(404).json({ error: 'Expense not found.' });
        }

        if (expense.user_id !== user_id && !['admin', 'accountant'].includes(userRole)) {
            logger.warn('Unauthorized update attempt by user: %s for expense ID: %s', user_id, id);
            return res.status(403).json({ error: 'Access denied. You do not have permission to update this expense.' });
        }

        const updatedExpense = await expenseModel.updateExpense(pool, id, {
            title,
            description,
            category,
            amount,
            currency,
            receipt_image_url,
        });

        logger.info('Expense updated successfully with ID: %s', id);
        res.status(200).json(updatedExpense);
    } catch (error) {
        logger.error('Error updating expense: %s', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const deleteExpense = async (req, res) => {
    try {
        const pool = req.pool;
        const { id } = req.params;
        const user_id = req.user.userId;
        const userRole = req.user.role;

        const expense = await expenseModel.getExpenseById(pool, id);

        if (!expense) {
            logger.warn('Expense not found with ID: %s', id);
            return res.status(404).json({ error: 'Expense not found.' });
        }

        if (expense.user_id !== user_id && !['admin', 'accountant'].includes(userRole)) {
            logger.warn('Unauthorized delete attempt by user: %s for expense ID: %s', user_id, id);
            return res.status(403).json({ error: 'Access denied. You do not have permission to delete this expense.' });
        }

        await expenseModel.deleteExpense(pool, id);
        logger.info('Expense deleted successfully with ID: %s', id);
        res.status(200).json({ message: 'Expense deleted successfully.' });
    } catch (error) {
        logger.error('Error deleting expense: %s', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

module.exports = {
    createExpense,
    getExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense,
};
