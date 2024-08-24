const expenseModel = require('../models/expenseModel');
const upload = require('../middlewares/imageUpload');

const createExpense = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err });
        } else {
            try {
                const pool = req.pool; // Get the pool from the request
                const user_id = req.user.userId; // User ID from JWT
                const { title, description, category, amount, currency } = req.body;
                let receipt_image_url = null;

                // Check if an image file was uploaded and handle the URL
                if (req.file) {
                    receipt_image_url = `/uploads/${req.file.filename}`;
                }

                // Make sure all required fields are present
                if (!title || !category || !amount || !currency) {
                    return res.status(400).json({ error: 'Title, category, amount, and currency are required.' });
                }

                const newExpense = await expenseModel.createExpense(pool, {
                    user_id,
                    title,
                    description,
                    category,
                    amount,
                    currency,
                    receipt_image_url
                });

                res.status(201).json(newExpense);
            } catch (error) {
                console.error('Error creating expense:', error);
                res.status(500).json({ error: 'Internal server error.' });
            }
        }
    });
};



const getExpenses = async (req, res) => {
    try {
        const pool = req.pool; // Get the pool from the request
        const user_id = req.user.userId; // User ID from JWT
        const expenses = await expenseModel.getExpensesByUserId(pool, user_id);
        res.status(200).json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const getExpenseById = async (req, res) => {
    try {
        const pool = req.pool; // Get the pool from the request
        const { id } = req.params;
        const user_id = req.user.userId; // User ID from JWT
        const userRole = req.user.role;

        const expense = await expenseModel.getExpenseById(pool, id);

        if (!expense) {
            return res.status(404).json({ error: 'Expense not found.' });
        }

        // Check if the user is the owner or has the required role
        if (expense.user_id !== user_id && !['admin', 'accountant'].includes(userRole)) {
            return res.status(403).json({ error: 'Access denied. You do not have permission to view this expense.' });
        }

        res.status(200).json(expense);
    } catch (error) {
        console.error('Error fetching expense:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const updateExpense = async (req, res) => {
    try {
        const pool = req.pool; // Get the pool from the request
        const { id } = req.params;
        const user_id = req.user.userId; // User ID from JWT
        const userRole = req.user.role;
        const { title, description, category, amount, currency, receipt_image_url } = req.body;

        const expense = await expenseModel.getExpenseById(pool, id);

        if (!expense) {
            return res.status(404).json({ error: 'Expense not found.' });
        }

        // Check if the user is the owner or has the required role
        if (expense.user_id !== user_id && !['admin', 'accountant'].includes(userRole)) {
            return res.status(403).json({ error: 'Access denied. You do not have permission to update this expense.' });
        }

        const updatedExpense = await expenseModel.updateExpense(pool, id, {
            title,
            description,
            category,
            amount,
            currency,
            receipt_image_url
        });

        res.status(200).json(updatedExpense);
    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const deleteExpense = async (req, res) => {
    try {
        const pool = req.pool; // Get the pool from the request
        const { id } = req.params;
        const user_id = req.user.userId; // User ID from JWT
        const userRole = req.user.role;

        const expense = await expenseModel.getExpenseById(pool, id);

        if (!expense) {
            return res.status(404).json({ error: 'Expense not found.' });
        }

        // Check if the user is the owner or has the required role
        if (expense.user_id !== user_id && !['admin', 'accountant'].includes(userRole)) {
            return res.status(403).json({ error: 'Access denied. You do not have permission to delete this expense.' });
        }

        await expenseModel.deleteExpense(pool, id);
        res.status(200).json({ message: 'Expense deleted successfully.' });
    } catch (error) {
        console.error('Error deleting expense:', error);
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
