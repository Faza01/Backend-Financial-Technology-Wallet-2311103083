const express = require('express');
const router = express.Router();
const {
  getAllWallets, getMyWallet, getWalletById,
  topUp, transfer,
  updateWalletStatus, deleteWallet,
} = require('../controllers/walletController');
const authenticateToken = require('../middleware/auth');
const roleAuthorization = require('../middleware/roleAuthorization');

// Semua route butuh token
router.use(authenticateToken);

// GET /api/wallets          - Admin/Auditor: lihat semua wallet
router.get('/', roleAuthorization('admin', 'auditor'), getAllWallets);

// GET /api/wallets/me       - Semua role: lihat wallet sendiri
router.get('/me', roleAuthorization('admin', 'user', 'auditor'), getMyWallet);

// POST /api/wallets/topup   - User/Admin: top up saldo
router.post('/topup', roleAuthorization('admin', 'user'), topUp);

// POST /api/wallets/transfer - User/Admin: transfer saldo
router.post('/transfer', roleAuthorization('admin', 'user'), transfer);

// GET /api/wallets/:id      - Admin/Auditor: lihat semua, User: hanya wallet sendiri
router.get('/:id', roleAuthorization('admin', 'user', 'auditor'), getWalletById);

// PUT /api/wallets/:id/status - Admin only: update status wallet
router.put('/:id/status', roleAuthorization('admin'), updateWalletStatus);

// DELETE /api/wallets/:id   - Admin only: hapus wallet
router.delete('/:id', roleAuthorization('admin'), deleteWallet);

module.exports = router;
