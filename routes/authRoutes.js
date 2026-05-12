// ===========================================
// Routes: Auth Routes
// Definisi endpoint untuk authentication
// ===========================================

const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const verifyToken = require('../middleware/verifyToken');

// Public routes (tidak perlu token)
router.post('/register', register);   // POST /api/auth/register
router.post('/login', login);         // POST /api/auth/login

// Protected routes (perlu token JWT valid)
router.get('/profile', verifyToken, getProfile);  // GET /api/auth/profile

module.exports = router;
