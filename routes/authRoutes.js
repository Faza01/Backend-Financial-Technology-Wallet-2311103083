const express = require('express');
const router = express.Router();
const { register, login, logout, getProfile } = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');

// Public routes (tidak perlu token)
router.post('/register', register);   // POST /api/auth/register
router.post('/login', login);         // POST /api/auth/login

// Protected routes (perlu token JWT valid)
router.get('/profile', authenticateToken, getProfile);  // GET /api/auth/profile
router.post('/logout', authenticateToken, logout);      // POST /api/auth/logout

module.exports = router;
