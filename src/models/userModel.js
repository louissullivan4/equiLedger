const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

const createUser = async (pool, user) => {
    const {
        fname,
        mname,
        sname,
        email,
        phone_number,
        date_of_birth,
        ppsno,
        id_image_url,
        currency,
        address_line1,
        address_line2,
        city,
        state,
        country,
        tax_status,
        marital_status,
        postal_code,
        occupation,
        password,
        role,
        subscription_level,
        account_status,
        last_login,
        is_auto_renew,
        payment_method,
        renewal_date
    } = user;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (
                fname, mname, sname, email, phone_number, date_of_birth, ppsno, id_image_url, currency,
                address_line1, address_line2, city, state, country, tax_status, marital_status,
                postal_code, occupation, password_hash, role, subscription_level, account_status,
                last_login, is_auto_renew, payment_method, renewal_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
                $18, $19, $20, $21, $22, $23, $24, $25)
            RETURNING *`,
            [
                fname, mname, sname, email, phone_number, date_of_birth, ppsno, id_image_url, currency,
                address_line1, address_line2, city, state, country, tax_status, marital_status,
                postal_code, occupation, hashedPassword, role, subscription_level, account_status,
                last_login, is_auto_renew, payment_method, renewal_date
            ]
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
        const result = await pool.query('SELECT id, fname, sname, email, role, created_at FROM users');
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
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
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

const updateUserPassword = async (pool, email, newPasswordHash) => {
    try {
        const result = await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2 RETURNING *',
            [newPasswordHash, email]
        );
        return result.rows[0];
    } catch (error) {
        logger.error('Error updating password for email: %s', email, { error: error.message });
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

const saveInviteToken = async (pool, email, token) => {
    try {
        await pool.query(
            `INSERT INTO user_invites (email, invite_token, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP)`,
            [email, token]
        );
        logger.info('Invite token saved successfully for email: %s', email);
    } catch (error) {
        logger.error('Error saving invite token for email: %s', email, { error: error.message });
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
    updateUserPassword,
    deleteUserByEmail,
    saveInviteToken
};
