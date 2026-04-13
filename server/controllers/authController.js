const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ─────────────────────────────────────────────
// Helper: Generate JWT Token
// ─────────────────────────────────────────────
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }   // Token valid for 7 days
    );
};

// ─────────────────────────────────────────────
// @route   POST /api/auth/register
// @desc    Register a new user (role: user only)
// @access  Public
// ─────────────────────────────────────────────
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Check all fields are provided
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email, and password.' });
        }

        // 2. Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }

        // 3. Hash the password (never store plain text!)
        const salt = await bcrypt.genSalt(10);       // Generate salt
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Create the new user in database
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'user',   // Public registration always creates "user" role
        });

        // 5. Generate JWT token
        const token = generateToken(newUser);

        // 6. Send response
        res.status(201).json({
            message: 'Registration successful!',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
            },
        });

    } catch (error) {
        console.error('Register error:', error.message);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

// ─────────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Login user or admin
// @access  Public
// ─────────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check fields are provided
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password.' });
        }

        // 2. Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // 3. Compare entered password with hashed password in database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // 4. Generate JWT token
        const token = generateToken(user);

        // 5. Send response with token and user info
        res.status(200).json({
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

// ─────────────────────────────────────────────
// @route   GET /api/auth/me
// @desc    Get currently logged-in user's info
// @access  Private (requires token)
// ─────────────────────────────────────────────
const getMe = async (req, res) => {
    try {
        // req.user is set by authMiddleware after token verification
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json({ user });
    } catch (error) {
        console.error('GetMe error:', error.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = { register, login, getMe };