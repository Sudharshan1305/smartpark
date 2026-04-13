const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────
// Public Routes (no token needed)
// ─────────────────────────────────────────────

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// ─────────────────────────────────────────────
// Protected Routes (token required)
// ─────────────────────────────────────────────

// GET /api/auth/me
router.get('/me', authMiddleware, getMe);

module.exports = router;