const bcrypt = require('bcrypt');

const createUser = async (pool, name, email, password, role) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, email, hashedPassword, role]
    );
    return result.rows[0];
};

const getAllUsers = async (pool) => {
    const result = await pool.query('SELECT id, name, email, role, created_at FROM users');
    return result.rows;
};

const getUserByEmail = async (pool, email) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
};

const getUserById = async (pool, id) => {
    const result = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [id]);
    return result.rows[0];
};

const isEmailUnique = async (pool, email) => {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    return result.rows.length === 0;
};

const updateUserByEmail = async (pool, currentEmail, updateFields) => {
    const updates = [];
    const values = [];
    let valueIndex = 1;

    for (const [key, value] of Object.entries(updateFields)) {
        updates.push(`${key} = $${valueIndex}`);
        values.push(value);
        valueIndex++;
    }

    values.push(currentEmail);
    
    const query = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE email = $${valueIndex} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
};

const deleteUserByEmail = async (pool, email) => {
    await pool.query('DELETE FROM users WHERE email = $1', [email]);
};

module.exports = {
    createUser,
    getAllUsers,
    getUserByEmail,
    getUserById,
    isEmailUnique,
    updateUserByEmail,
    deleteUserByEmail
};
