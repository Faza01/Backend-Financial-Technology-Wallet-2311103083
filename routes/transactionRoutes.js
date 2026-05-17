const express = require('express');
const router = express.Router();
const {
  getAllTransactions, getMyTransactions, getTransactionById,
  payment, updateTransactionStatus, deleteTransaction,
} = require('../controllers/transactionController');
const authenticateToken = require('../middleware/auth');
const roleAuthorization = require('../middleware/roleAuthorization');

// Semua route butuh token
router.use(authenticateToken);

// GET /api/transactions     - Admin/Auditor: lihat semua transaksi
router.get('/', roleAuthorization('admin', 'auditor'), getAllTransactions);

// GET /api/transactions/my  - Semua role: lihat mutasi sendiri
router.get('/my', roleAuthorization('admin', 'user', 'auditor'), getMyTransactions);

// POST /api/transactions/payment - User/Admin: bayar
router.post('/payment', roleAuthorization('admin', 'user'), payment);

// GET /api/transactions/:id - Admin/Auditor: semua, User: transaksi sendiri
router.get('/:id', roleAuthorization('admin', 'user', 'auditor'), getTransactionById);

// PUT /api/transactions/:id/status - Admin only: update status
router.put('/:id/status', roleAuthorization('admin'), updateTransactionStatus);

// DELETE /api/transactions/:id - Admin only: hapus transaksi
router.delete('/:id', roleAuthorization('admin'), deleteTransaction);

module.exports = router;
