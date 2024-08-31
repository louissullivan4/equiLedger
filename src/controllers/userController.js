const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');
require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;

const createUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        logger.warn('Missing required fields for creating user: %o', req.body);
        return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    try {
        const existingUser = await userModel.getUserByEmail(req.pool, email);
        if (existingUser) {
            logger.warn('Attempt to create a user with an existing email: %s', email);
            return res.status(400).json({ error: 'User with this email already exists.' });
        }

        const newUser = await userModel.createUser(req.pool, name, email, password, role);
        const token = jwt.sign({ userId: newUser.id, role: newUser.role }, jwtSecret, { expiresIn: '168h' });

        logger.info('User created successfully: %s', email);
        res.status(201).json({
            id: newUser.id,
            name: newUser.name,
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
        const allUsers = { 'all_users': await userModel.getAllUsers(req.pool) };
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
        res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
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
        res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        logger.error('Error retrieving user by email: %s', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const updateUser = async (req, res) => {
    const { email } = req.params;
    const { name, role, new_email } = req.body;
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

        if (currentUser.email !== email && !['admin', 'accountant'].includes(currentUser.role)) {
            logger.warn('Unauthorized update attempt by user: %s for user email: %s', currentUser.email, email);
            return res.status(403).json({ error: 'Access denied. You do not have the required permissions.' });
        }

        const updateFields = {};
        if (name) updateFields.name = name;

        if (new_email && new_email !== email) {
            const isUnique = await userModel.isEmailUnique(req.pool, new_email);
            if (!isUnique) {
                logger.warn('New email already in use: %s', new_email);
                return res.status(400).json({ error: 'The new email address is already in use.' });
            }
            updateFields.email = new_email;
        }

        if (role && currentUser.role === 'admin') {
            updateFields.role = role;
        }

        const updatedUser = await userModel.updateUserByEmail(req.pool, email, updateFields);

        logger.info('User updated successfully: %s', email);
        res.status(200).json({
            id: updatedUser.id,
            name: updatedUser.name,
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
        return res.status(400).json({ error: 'Email and password are required.' });
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

module.exports = {
    createUser,
    getAllUsers,
    getUser,
    getUserByEmail,
    updateUser,
    deleteUser,
    login
};
