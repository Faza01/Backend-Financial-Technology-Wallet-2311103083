const Transaction = require('../models/transaction');
const Wallet = require('../models/wallet');
const AuditLog = require('../models/auditLog');
const { successResponse, errorResponse } = require('../utils/response');
const { verifyTransactionPin } = require('../utils/pin');

// melakukan reverse transaksi
const reverseTransaction = async (transaction, actorUserId, ipAddress) => {
  const amount = parseFloat(transaction.amount);
  const senderWallet = await Wallet.findById(transaction.wallet_id);

  if (!senderWallet) {
    return { success: false, message: 'Wallet transaksi tidak ditemukan' };
  }

  const oldValue = {
    transaction_status: transaction.status,
    sender_balance: senderWallet.balance,
  };

  if (transaction.transaction_type === 'topup') {
    if (parseFloat(senderWallet.balance) < amount) {
      return { success: false, message: 'Saldo wallet tidak cukup untuk reverse top up' };
    }

    const newBalance = parseFloat(senderWallet.balance) - amount;
    await Wallet.updateBalance(senderWallet.id, newBalance);
    await Transaction.updateStatus(transaction.id, 'reversed');

    await AuditLog.create({
      user_id: actorUserId,
      action: 'REVERSE_TRANSACTION',
      entity: 'transactions',
      entity_id: transaction.id,
      old_value: oldValue,
      new_value: { transaction_status: 'reversed', sender_balance: newBalance },
      ip_address: ipAddress,
    });

    return { success: true };
  }

  if (transaction.transaction_type === 'payment') {
    const newBalance = parseFloat(senderWallet.balance) + amount;
    await Wallet.updateBalance(senderWallet.id, newBalance);
    await Transaction.updateStatus(transaction.id, 'reversed');

    await AuditLog.create({
      user_id: actorUserId,
      action: 'REVERSE_TRANSACTION',
      entity: 'transactions',
      entity_id: transaction.id,
      old_value: oldValue,
      new_value: { transaction_status: 'reversed', sender_balance: newBalance },
      ip_address: ipAddress,
    });

    return { success: true };
  }

  if (transaction.transaction_type === 'transfer') {
    const recipientWallet = await Wallet.findById(transaction.recipient_wallet_id);
    if (!recipientWallet) {
      return { success: false, message: 'Wallet penerima transaksi tidak ditemukan' };
    }
    if (parseFloat(recipientWallet.balance) < amount) {
      return { success: false, message: 'Saldo wallet penerima tidak cukup untuk reverse transfer' };
    }

    const newSenderBalance = parseFloat(senderWallet.balance) + amount;
    const newRecipientBalance = parseFloat(recipientWallet.balance) - amount;
    await Wallet.updateBalance(senderWallet.id, newSenderBalance);
    await Wallet.updateBalance(recipientWallet.id, newRecipientBalance);
    await Transaction.updateStatus(transaction.id, 'reversed');

    await AuditLog.create({
      user_id: actorUserId,
      action: 'REVERSE_TRANSACTION',
      entity: 'transactions',
      entity_id: transaction.id,
      old_value: {
        ...oldValue,
        recipient_balance: recipientWallet.balance,
      },
      new_value: {
        transaction_status: 'reversed',
        sender_balance: newSenderBalance,
        recipient_balance: newRecipientBalance,
      },
      ip_address: ipAddress,
    });

    return { success: true };
  }

  return { success: false, message: 'Tipe transaksi tidak dapat di-reverse' };
};

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
    const { amount, description, transaction_pin } = req.body;

    // Validasi input
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return errorResponse(res, 'Jumlah pembayaran harus berupa angka lebih dari 0', 400);
    }
    if (!description) {
      return errorResponse(res, 'Deskripsi pembayaran wajib diisi', 400);
    }

    const paymentAmount = parseFloat(amount);

    const isPinValid = await verifyTransactionPin(req.user.id, transaction_pin);
    if (!isPinValid) {
      return errorResponse(res, 'PIN transaksi tidak valid', 401);
    }

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
    const transactionResult = await Transaction.create({
      wallet_id: wallet.id,
      transaction_type: 'payment',
      amount: paymentAmount,
      description,
      reference_number: refNumber,
      recipient_wallet_id: null,
      status: 'success',
    });

    await AuditLog.create({
      user_id: req.user.id,
      action: 'PAYMENT',
      entity: 'transactions',
      entity_id: transactionResult.insertId,
      old_value: { balance: wallet.balance },
      new_value: {
        balance: newBalance,
        amount: paymentAmount,
        description,
        reference_number: refNumber,
      },
      ip_address: req.ip,
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

    const allowedStatuses = ['pending', 'success', 'failed', 'reversed'];
    if (!status || !allowedStatuses.includes(status)) {
      return errorResponse(res, `Status tidak valid. Pilih: ${allowedStatuses.join(', ')}`, 400);
    }

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return errorResponse(res, 'Transaksi tidak ditemukan', 404);
    }

    if (status === 'reversed') {
      if (transaction.status !== 'success') {
        return errorResponse(res, 'Hanya transaksi berstatus success yang dapat di-reverse', 400);
      }

      const reverseResult = await reverseTransaction(transaction, req.user.id, req.ip);
      if (!reverseResult.success) {
        return errorResponse(res, reverseResult.message, 400);
      }

      const reversedTransaction = await Transaction.findById(id);
      return successResponse(res, 'Transaksi berhasil di-reverse', { transaction: reversedTransaction });
    }

    await Transaction.updateStatus(id, status);
    const updatedTransaction = await Transaction.findById(id);

    await AuditLog.create({
      user_id: req.user.id,
      action: 'UPDATE_TRANSACTION_STATUS',
      entity: 'transactions',
      entity_id: parseInt(id),
      old_value: { status: transaction.status },
      new_value: { status: updatedTransaction.status },
      ip_address: req.ip,
    });

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

    await AuditLog.create({
      user_id: req.user.id,
      action: 'DELETE_TRANSACTION',
      entity: 'transactions',
      entity_id: parseInt(id),
      old_value: transaction,
      new_value: null,
      ip_address: req.ip,
    });
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
