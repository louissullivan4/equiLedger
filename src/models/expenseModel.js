// expenseModel.js
const createExpense = async (pool, expense) => {
    const { user_id, title, description, category, amount, currency, receipt_image_url } = expense;
    const result = await pool.query(
        'INSERT INTO expenses (user_id, title, description, category, amount, currency, receipt_image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [user_id, title, description, category, amount, currency, receipt_image_url]
    );
    return result.rows[0];
};

const getExpensesByUserId = async (pool, user_id) => {
    const result = await pool.query("SELECT * FROM expenses WHERE user_id = $1 AND category != 'income'", [user_id]);
    return result.rows;
};

const getExpenseById = async (pool, id) => {
    const result = await pool.query('SELECT * FROM expenses WHERE id = $1', [id]);
    return result.rows[0];
};

const getExpenseByCategory = async (pool, id, category) => {
    const result = await pool.query('SELECT * FROM expenses WHERE user_id = $1 AND category = $2', [id, category]);
    return result.rows;
};

const updateExpense = async (pool, id, expense) => {
    const { title, description, category, amount, currency, receipt_image_url } = expense;
    const result = await pool.query(
        'UPDATE expenses SET title = $1, description = $2, category = $3, amount = $4, currency = $5, receipt_image_url = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
        [title, description, category, amount, currency, receipt_image_url, id]
    );
    return result.rows[0];
};

const deleteExpense = async (pool, id) => {
    await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
};

module.exports = {
    createExpense,
    getExpensesByUserId,
    getExpenseByCategory,
    getExpenseById,
    updateExpense,
    deleteExpense,
};