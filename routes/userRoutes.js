const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, createUser, updateUser, deleteUser } = require('../controllers/userController');
const authenticateToken = require('../middleware/auth');
const roleAuthorization = require('../middleware/roleAuthorization');

// Semua route butuh token
router.use(authenticateToken);

// GET /api/users       - Admin: lihat semua user
router.get('/', roleAuthorization('admin'), getAllUsers);

// POST /api/users      - Admin: buat user baru
router.post('/', roleAuthorization('admin'), createUser);

// GET /api/users/:id   - Admin: lihat semua, User: hanya diri sendiri
router.get('/:id', roleAuthorization('admin', 'user', 'auditor'), getUserById);

// PUT /api/users/:id   - Admin: update semua, User: update diri sendiri
router.put('/:id', roleAuthorization('admin', 'user'), updateUser);

// DELETE /api/users/:id - Admin only: hapus user
router.delete('/:id', roleAuthorization('admin'), deleteUser);

module.exports = router;
