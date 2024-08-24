const { authorisePassword } = require('../middlewares/authMiddleware');
const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

const createUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    try {
        const existingUser = await userModel.getUserByEmail(req.pool, email);
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists.' });
        }

        const newUser = await userModel.createUser(req.pool, name, email, password, role);
        const token = jwt.sign({ userId: newUser.id, role: newUser.role }, jwtSecret, { expiresIn: '168h' });

        res.status(201).json({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            created_at: newUser.created_at,
            token,
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const allUsers = {
            'all_users' : await userModel.getAllUsers(req.pool)
        }
        res.status(200).json(allUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};


const getUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await userModel.getUserById(req.pool, id);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        console.error('Error retrieving user:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const getUserByEmail = async (req, res) => {
    const { email } = req.params;

    try {
        const user = await userModel.getUserByEmail(req.pool, email);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        console.error('Error retrieving user by email:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const updateUser = async (req, res) => {
    const { email } = req.params; // current email
    const { name, role, new_email } = req.body; // new_email is the new email address if user wants to change it
    const currentUserId= req.user.userId;
    console.log(req.body)
    if (!email) {
        return res.status(400).json({ error: 'Current email is required.' });
    }

    try {
        // Find the user by current email
        const userToUpdate = await userModel.getUserByEmail(req.pool, email);

        if (!userToUpdate) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const currentUser = await userModel.getUserById(req.pool, currentUserId);

        // Check if the current user is the owner or has an admin/accountant role
        if (currentUser.email !== email && !['admin', 'accountant'].includes(currentUserRole)) {
            return res.status(403).json({ error: 'Access denied. You do not have the required permissions.' });
        }
        // Prepare the fields to be updated
        const updateFields = {};
        if (name) updateFields.name = name;

        // Handle email update
        if (new_email) {
            if (new_email !== email) {
                const isUnique = await userModel.isEmailUnique(req.pool, new_email);
                if (!isUnique) {
                    return res.status(400).json({ error: 'The new email address is already in use.' });
                }
                updateFields.email = new_email; // Set the new email for update
            }
        }

        // Handle role update, only admin can do this
        if (role && currentUser.role === 'admin') {
            updateFields.role = role;
        }

        // Update the user in the database
        const updatedUser = await userModel.updateUserByEmail(req.pool, email, updateFields);

        res.status(200).json({
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            updated_at: updatedUser.updated_at,
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const deleteUser = async (req, res) => {
    const { email } = req.params;
    const currentUserId = req.user.userId;

    if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
    }

    try {
        // Find the user by email
        const userToDelete = await userModel.getUserByEmail(req.pool, email);

        if (!userToDelete) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const currentUser = await userModel.getUserById(req.pool, currentUserId);

        // Check if the current user is the owner or has an admin/accountant role
        if (currentUser.email !== email && !['admin', 'accountant'].includes(currentUserRole)) {
            return res.status(403).json({ error: 'Access denied. You do not have the required permissions.' });
        }

        // Delete the user from the database
        await userModel.deleteUserByEmail(req.pool, email);

        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        // Find the user by email
        const user = await userModel.getUserByEmail(req.pool, email);

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Compare the password with the stored hash
        const validPassword = await bcrypt.compare(password, user.password_hash);
        // const validPassword = await authorisePassword(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Generate a JWT token
        const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '168h' });

        res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token,
        });
    } catch (error) {
        console.error('Error during login:', error);
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

