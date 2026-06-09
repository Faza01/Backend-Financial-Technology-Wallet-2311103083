const express = require('express');
const router = express.Router();
const { register, login, logout, getProfile, forgotPin, resetPin, forgotPassword, resetPassword } = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');

// Public routes (tidak perlu token)
router.post('/register', register);   // POST /api/auth/register
router.post('/login', login);         // POST /api/auth/login
router.post('/forgot-pin', forgotPin); // POST /api/auth/forgot-pin
router.post('/reset-pin', resetPin);   // POST /api/auth/reset-pin
router.post('/forgot-password', forgotPassword); // POST /api/auth/forgot-password
router.post('/reset-password', resetPassword);   // POST /api/auth/reset-password

// Protected routes (perlu token JWT valid)
router.get('/profile', authenticateToken, getProfile);  // GET /api/auth/profile
router.post('/logout', authenticateToken, logout);      // POST /api/auth/logout

module.exports = router;
