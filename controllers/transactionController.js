// ===========================================
// Controller: Transaction Controller
// CRUD manajemen transaksi + mutasi
// ===========================================

const Transaction = require('../models/transactionModel');
const Wallet = require('../models/walletModel');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * GET /api/transactions - Mengambil semua transaksi
 * Akses: admin, auditor
 */
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll();
    return successResponse(res, 'Data semua transaksi berhasil diambil', { transactions });
  } catch (error) {
    console.error('Get all transactions error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengambil data transaksi');
  }
};

/**
 * GET /api/transactions/my - Mengambil mutasi transaksi milik user yang login
 * Akses: user, admin, auditor
 */
const getMyTransactions = async (req, res) => {
  try {
    // Ambil wallet user yang login
    const wallet = await Wallet.findByUserId(req.user.id);
    if (!wallet) {
      return errorResponse(res, 'Wallet tidak ditemukan', 404);
    }

    const transactions = await Transaction.findByWalletId(wallet.id);
    return successResponse(res, 'Data mutasi transaksi berhasil diambil', {
      wallet_number: wallet.wallet_number,
      balance: wallet.balance,
      transactions,
    });
  } catch (error) {
    console.error('Get my transactions error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengambil mutasi transaksi');
  }
};

/**
 * GET /api/transactions/:id - Mengambil detail transaksi berdasarkan ID
 * Akses: admin, auditor (semua), user (hanya transaksi sendiri)
 */
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return errorResponse(res, 'Transaksi tidak ditemukan', 404);
    }

    // User biasa hanya bisa lihat transaksi milik wallet sendiri
    if (req.user.role === 'user') {
      const wallet = await Wallet.findByUserId(req.user.id);
      if (!wallet || (transaction.wallet_id !== wallet.id && transaction.recipient_wallet_id !== wallet.id)) {
        return errorResponse(res, 'Akses ditolak. Anda hanya bisa melihat transaksi sendiri', 403);
      }
    }

    return successResponse(res, 'Detail transaksi berhasil diambil', { transaction });
  } catch (error) {
    console.error('Get transaction by ID error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengambil detail transaksi');
  }
};

/**
 * POST /api/transactions/payment - Melakukan pembayaran
 * Akses: user, admin
 */
const payment = async (req, res) => {
  try {
    const { amount, description } = req.body;

    // Validasi input
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return errorResponse(res, 'Jumlah pembayaran harus berupa angka lebih dari 0', 400);
    }
    if (!description) {
      return errorResponse(res, 'Deskripsi pembayaran wajib diisi', 400);
    }

    const paymentAmount = parseFloat(amount);

    // Ambil wallet user
    const wallet = await Wallet.findByUserId(req.user.id);
    if (!wallet) {
      return errorResponse(res, 'Wallet tidak ditemukan', 404);
    }
    if (wallet.status !== 'active') {
      return errorResponse(res, 'Wallet tidak aktif. Hubungi admin', 400);
    }

    // Cek saldo cukup
    if (parseFloat(wallet.balance) < paymentAmount) {
      return errorResponse(res, 'Saldo tidak mencukupi', 400);
    }

    // Kurangi saldo
    const newBalance = parseFloat(wallet.balance) - paymentAmount;
    await Wallet.updateBalance(wallet.id, newBalance);

    // Buat reference number
    const refNumber = `PY${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Catat transaksi
    await Transaction.create({
      wallet_id: wallet.id,
      transaction_type: 'payment',
      amount: paymentAmount,
      description,
      reference_number: refNumber,
      recipient_wallet_id: null,
      status: 'success',
    });

    return successResponse(res, 'Pembayaran berhasil', {
      reference_number: refNumber,
      amount: paymentAmount,
      description,
      balance: newBalance,
    }, 201);
  } catch (error) {
    console.error('Payment error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat pembayaran');
  }
};

/**
 * PUT /api/transactions/:id/status - Update status transaksi
 * Akses: admin only
 */
const updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['pending', 'success', 'failed'];
    if (!status || !allowedStatuses.includes(status)) {
      return errorResponse(res, `Status tidak valid. Pilih: ${allowedStatuses.join(', ')}`, 400);
    }

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return errorResponse(res, 'Transaksi tidak ditemukan', 404);
    }

    await Transaction.updateStatus(id, status);
    const updatedTransaction = await Transaction.findById(id);

    return successResponse(res, 'Status transaksi berhasil diupdate', { transaction: updatedTransaction });
  } catch (error) {
    console.error('Update transaction status error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengupdate status transaksi');
  }
};

/**
 * DELETE /api/transactions/:id - Hapus data transaksi
 * Akses: admin only
 */
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return errorResponse(res, 'Transaksi tidak ditemukan', 404);
    }

    await Transaction.delete(id);
    return successResponse(res, 'Data transaksi berhasil dihapus');
  } catch (error) {
    console.error('Delete transaction error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat menghapus data transaksi');
  }
};

module.exports = {
  getAllTransactions, getMyTransactions, getTransactionById,
  payment, updateTransactionStatus, deleteTransaction,
};
