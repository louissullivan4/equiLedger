
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
require('dotenv').config();
const userModel = require('../models/userModel');
const logger = require('../utils/logger');

const jwtSecret = process.env.JWT_SECRET;
const frontendURL = process.env.FRONTEND_URL;

const createUser = async (req, res) => {
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
    } = req.body;

    if (token) {
        try {
            const decoded = jwt.verify(token, jwtSecret);

            if (decoded.email !== email) {
                return res.status(400).json({ error: 'Invalid invite token.' });
            }
        } catch (error) {
            logger.warn('Invalid invite token: %s', error.message);
            return res.status(400).json({ error: 'Invalid or expired invite token.' });
        }
    }

    if (!fname || !sname || !email || !password || !date_of_birth) {
        logger.warn('Missing required fields for creating user: %o', req.body);
        return res.status(400).json({ error: 'First name, surname, email, password, and date of birth are required.' });
    }

    try {
        const existingUser = await userModel.getUserByEmail(req.pool, email);
        if (existingUser) {
            logger.warn('Attempt to create a user with an existing email: %s', email);
            return res.status(400).json({ error: 'User with this email already exists.' });
        }

        const user = {
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
            role: role || 'client',
            subscription_level: subscription_level || 'free',
            account_status: account_status || 'active',
            last_login: last_login || null,
            is_auto_renew: is_auto_renew !== undefined ? is_auto_renew : true,
            payment_method,
            renewal_date,
        };

        const newUser = await userModel.createUser(req.pool, user);
        const token = jwt.sign({ userId: newUser.id, role: newUser.role }, jwtSecret, { expiresIn: '168h' });

        logger.info('User created successfully: %s', email);
        res.status(201).json({
            id: newUser.id,
            fname: newUser.fname,
            sname: newUser.sname,
            email: newUser.email,
            role: newUser.role,
            created_at: newUser.created_at,
            token,
        });
    } catch (error) {
        logger.error('Error creating user: %s', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const allUsers = { all_users: await userModel.getAllUsers(req.pool) };
        logger.info('Fetched all users.');
        res.status(200).json(allUsers);
    } catch (error) {
        logger.error('Error fetching users: %s', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const getUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await userModel.getUserById(req.pool, id);
        if (!user) {
            logger.warn('User not found with ID: %s', id);
            return res.status(404).json({ error: 'User not found.' });
        }
        logger.info('Fetched user with ID: %s', id);
        res.status(200).json(user);
    } catch (error) {
        logger.error('Error retrieving user: %s', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const getUserByEmail = async (req, res) => {
    const { email } = req.params;

    try {
        const user = await userModel.getUserByEmail(req.pool, email);
        if (!user) {
            logger.warn('User not found with email: %s', email);
            return res.status(404).json({ error: 'User not found.' });
        }
        logger.info('Fetched user with email: %s', email);
        res.status(200).json(user);
    } catch (error) {
        logger.error('Error retrieving user by email: %s', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const updateUser = async (req, res) => {
    const { email } = req.params;
    const {
        fname,
        mname,
        sname,
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
        role,
        subscription_level,
        account_status,
        is_auto_renew,
        payment_method,
        renewal_date
    } = req.body;
    const currentUserId = req.user.userId;

    if (!email) {
        logger.warn('Missing current email for updating user.');
        return res.status(400).json({ error: 'Current email is required.' });
    }

    try {
        const userToUpdate = await userModel.getUserByEmail(req.pool, email);
        if (!userToUpdate) {
            logger.warn('User not found for update with email: %s', email);
            return res.status(404).json({ error: 'User not found.' });
        }

        const currentUser = await userModel.getUserById(req.pool, currentUserId);

        if (currentUser.email !== email || !['admin', 'accountant'].includes(currentUser.role)) {
            logger.warn('Unauthorized update attempt by user: %s for user email: %s', currentUser.email, email);
            return res.status(403).json({ error: 'Access denied. You do not have the required permissions.' });
        }

        const updateFields = {
            fname,
            mname,
            sname,
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
            role,
            subscription_level,
            account_status,
            is_auto_renew,
            payment_method,
            renewal_date
        };

        const updatedUser = await userModel.updateUserByEmail(req.pool, email, updateFields);

        logger.info('User updated successfully: %s', email);
        res.status(200).json({
            id: updatedUser.id,
            fname: updatedUser.fname,
            sname: updatedUser.sname,
            email: updatedUser.email,
            role: updatedUser.role,
            updated_at: updatedUser.updated_at,
        });
    } catch (error) {
        logger.error('Error updating user: %s', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const deleteUser = async (req, res) => {
    const { email } = req.params;
    const currentUserId = req.user.userId;

    if (!email) {
        logger.warn('Missing email for deleting user.');
        return res.status(400).json({ error: 'Email is required.' });
    }

    try {
        const userToDelete = await userModel.getUserByEmail(req.pool, email);
        if (!userToDelete) {
            logger.warn('User not found for deletion with email: %s', email);
            return res.status(404).json({ error: 'User not found.' });
        }

        const currentUser = await userModel.getUserById(req.pool, currentUserId);

        if (currentUser.email !== email && !['admin', 'accountant'].includes(currentUser.role)) {
            logger.warn('Unauthorized delete attempt by user: %s for user email: %s', currentUser.email, email);
            return res.status(403).json({ error: 'Access denied. You do not have the required permissions.' });
        }

        await userModel.deleteUserByEmail(req.pool, email);

        logger.info('User deleted successfully: %s', email);
        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        logger.error('Error deleting user: %s', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        logger.warn('Missing email or password for login attempt.');
        return res.status(400).json({ error: 'Invalid email or password.' });
    }

    try {
        const user = await userModel.getUserByEmail(req.pool, email);
        if (!user) {
            logger.warn('Invalid login attempt for email: %s', email);
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            logger.warn('Invalid password for email: %s', email);
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, { expiresIn: '168h' });

        logger.info('User logged in successfully: %s', email);
        res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token,
        });
    } catch (error) {
        logger.error('Error during login: %s', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const dashboardLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        logger.warn('Missing email or password for login attempt.');
        return res.status(400).json({ error: 'Authentication requirements not fulfilled.' });
    }

    try {
        const user = await userModel.getUserByEmail(req.pool, email);
        if (!user) {
            logger.warn('Invalid login attempt for email: %s', email);
            return res.status(401).json({ error: 'Authentication requirements not fulfilled.' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            logger.warn('Invalid password for email: %s', email);
            return res.status(401).json({ error: 'Authentication requirements not fulfilled.' });
        }

        let roles = ['admin', 'accountant']
        if (!roles.includes(req.user.role)) {
            logger.warn('User %s does not have correct role for dashboard. Please contact an admin.', email);
            return res.status(401).json({ error: 'Authentication requirements not fulfilled.' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, { expiresIn: '168h' });

        logger.info('User logged in successfully: %s', email);
        res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token,
        });
    } catch (error) {
        logger.error('Error during login: %s', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const requestPasswordReset = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await userModel.getUserByEmail(req.pool, email);
        if (!user) {
            logger.warn('Password reset requested for non-existing user: %s', email);
            return res.status(404).json({ error: 'User not found.' });
        }

        const resetToken = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '1h' });

        const resetLink = `${frontendURL}/reset-password?token=${resetToken}`;
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: 'Password Reset',
            text: `You requested a password reset. Click the link to reset your password: ${resetLink}`,
        };
        
        await transporter.sendMail(mailOptions);

        logger.info('Password reset email sent to: %s', email);
        res.status(200).json({ message: 'Password reset email sent.' });
    } catch (error) {
        logger.error('Error requesting password reset: %s', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const decoded = jwt.verify(token, jwtSecret);
        const user = await userModel.getUserById(req.pool, decoded.userId);
        if (!user) {
            logger.warn('Password reset attempted for non-existing user: %s', decoded.userId);
            return res.status(404).json({ error: 'User not found.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userModel.updatePassword(req.pool, user.email, hashedPassword);

        logger.info('Password reset successfully for user: %s', user.email);
        res.status(200).json({ message: 'Password reset successfully.' });
    } catch (error) {
        logger.error('Error resetting password: %s', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const inviteUser = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        logger.warn('Email is required for inviting a user.');
        return res.status(400).json({ error: 'Email is required.' });
    }

    try {
        const existingUser = await userModel.getUserByEmail(req.pool, email);
        if (existingUser) {
            logger.warn('Invite attempted for existing user: %s', email);
            return res.status(400).json({ error: 'User with this email already exists.' });
        }

        const inviteToken = jwt.sign({ email }, jwtSecret, { expiresIn: '48h' });

        const inviteLink = `${frontendURL}/create-user?token=${inviteToken}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: 'You have been invited to create an account',
            text: `You have been invited to create an account. Click the link to create your account: ${inviteLink}`,
        };

        await transporter.sendMail(mailOptions);

        logger.info('Invitation email sent to: %s', email);
        res.status(200).json({ message: 'Invitation email sent successfully.' });
    } catch (error) {
        logger.error('Error sending invitation: %s', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

module.exports = {
    createUser,
    getAllUsers,
    getUser,
    getUserByEmail,
    updateUser,
    deleteUser,
    login,
    resetPassword,
    requestPasswordReset,
    inviteUser,
    dashboardLogin
};
