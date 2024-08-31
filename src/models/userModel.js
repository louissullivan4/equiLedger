const bcrypt = require('bcrypt');
const logger = require('../utils/logger')

const createUser = async (pool, name, email, password, role) => {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, email, hashedPassword, role]
        );
        logger.info('User created successfully', { email });
        return result.rows[0];
    } catch (error) {
        logger.error('Error creating user', { email, error: error.message });
        throw error;
    }
};

const getAllUsers = async (pool) => {
    try {
        const result = await pool.query('SELECT id, name, email, role, created_at FROM users');
        logger.info('Fetched all users');
        return result.rows;
    } catch (error) {
        logger.error('Error fetching users', { error: error.message });
        throw error;
    }
};

const getUserByEmail = async (pool, email) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            logger.info('User fetched successfully', { email });
            return result.rows[0];
        } else {
            logger.warn('User not found', { email });
            return null;
        }
    } catch (error) {
        logger.error('Error fetching user by email', { email, error: error.message });
        throw error;
    }
};

const getUserById = async (pool, id) => {
    try {
        const result = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            logger.info('User fetched successfully', { id });
            return result.rows[0];
        } else {
            logger.warn('User not found', { id });
            return null;
        }
    } catch (error) {
        logger.error('Error fetching user by ID', { id, error: error.message });
        throw error;
    }
};

const isEmailUnique = async (pool, email) => {
    try {
        const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        const isUnique = result.rows.length === 0;
        if (isUnique) {
            logger.info('Email is unique', { email });
        } else {
            logger.warn('Email is already in use', { email });
        }
        return isUnique;
    } catch (error) {
        logger.error('Error checking email uniqueness', { email, error: error.message });
        throw error;
    }
};

const updateUserByEmail = async (pool, currentEmail, updateFields) => {
    try {
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
        if (result.rows.length > 0) {
            logger.info('User updated successfully', { email: currentEmail });
            return result.rows[0];
        } else {
            logger.warn('User not found for update', { email: currentEmail });
            return null;
        }
    } catch (error) {
        logger.error('Error updating user by email', { email: currentEmail, error: error.message });
        throw error;
    }
};

const deleteUserByEmail = async (pool, email) => {
    try {
        const result = await pool.query('DELETE FROM users WHERE email = $1', [email]);
        if (result.rowCount > 0) {
            logger.info('User deleted successfully', { email });
        } else {
            logger.warn('User not found for deletion', { email });
        }
    } catch (error) {
        logger.error('Error deleting user by email', { email, error: error.message });
        throw error;
    }
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
