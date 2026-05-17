const Wallet = require('../models/wallet');
const User = require('../models/user');
const Transaction = require('../models/transaction');
const AuditLog = require('../models/auditLog');
const { successResponse, errorResponse } = require('../utils/response');
const { verifyTransactionPin } = require('../utils/pin');

/**
 * GET /api/wallets - Mengambil semua wallet
 * Akses: admin, auditor
 */
const getAllWallets = async (req, res) => {
  try {
    const wallets = await Wallet.findAll();
    return successResponse(res, 'Data semua wallet berhasil diambil', { wallets });
  } catch (error) {
    console.error('Get all wallets error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengambil data wallet');
  }
};

/**
 * GET /api/wallets/me - Mengambil wallet milik user yang login
 * Akses: user, admin, auditor
 */
const getMyWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findByUserId(req.user.id);
    if (!wallet) {
      return errorResponse(res, 'Wallet tidak ditemukan', 404);
    }
    return successResponse(res, 'Data wallet berhasil diambil', { wallet });
  } catch (error) {
    console.error('Get my wallet error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengambil data wallet');
  }
};

/**
 * GET /api/wallets/:id - Mengambil wallet berdasarkan ID
 * Akses: admin, auditor (semua), user (hanya wallet sendiri)
 */
const getWalletById = async (req, res) => {
  try {
    const { id } = req.params;
    const wallet = await Wallet.findById(id);

    if (!wallet) {
      return errorResponse(res, 'Wallet tidak ditemukan', 404);
    }

    // User biasa hanya bisa lihat wallet sendiri
    if (req.user.role === 'user' && wallet.user_id !== req.user.id) {
      return errorResponse(res, 'Akses ditolak. Anda hanya bisa melihat wallet sendiri', 403);
    }

    return successResponse(res, 'Data wallet berhasil diambil', { wallet });
  } catch (error) {
    console.error('Get wallet by ID error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengambil data wallet');
  }
};

/**
 * POST /api/wallets/topup - Top up saldo wallet
 * Akses: user (wallet sendiri), admin (wallet siapapun)
 */
const topUp = async (req, res) => {
  try {
    const { amount, description, transaction_pin } = req.body;

    // Validasi amount
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return errorResponse(res, 'Jumlah top up harus berupa angka lebih dari 0', 400);
    }

    const topUpAmount = parseFloat(amount);

    // Validasi batas top up
    if (topUpAmount < 10000) {
      return errorResponse(res, 'Minimal top up Rp 10.000', 400);
    }
    if (topUpAmount > 10000000) {
      return errorResponse(res, 'Maksimal top up Rp 10.000.000', 400);
    }

    const isPinValid = await verifyTransactionPin(req.user.id, transaction_pin);
    if (!isPinValid) {
      return errorResponse(res, 'PIN transaksi tidak valid', 401);
    }

    // Ambil wallet user yang login
    const wallet = await Wallet.findByUserId(req.user.id);
    if (!wallet) {
      return errorResponse(res, 'Wallet tidak ditemukan', 404);
    }

    if (wallet.status !== 'active') {
      return errorResponse(res, 'Wallet tidak aktif. Hubungi admin', 400);
    }

    // Hitung saldo baru
    const newBalance = parseFloat(wallet.balance) + topUpAmount;

    // Update saldo
    await Wallet.updateBalance(wallet.id, newBalance);

    // Buat reference number unik
    const refNumber = `TU${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Catat transaksi
    const transactionResult = await Transaction.create({
      wallet_id: wallet.id,
      transaction_type: 'topup',
      amount: topUpAmount,
      description: description || 'Top up saldo',
      reference_number: refNumber,
      recipient_wallet_id: null,
      status: 'success',
    });

    await AuditLog.create({
      user_id: req.user.id,
      action: 'TOPUP',
      entity: 'transactions',
      entity_id: transactionResult.insertId,
      old_value: { balance: wallet.balance },
      new_value: { balance: newBalance, amount: topUpAmount, reference_number: refNumber },
      ip_address: req.ip,
    });

    // Ambil data wallet terbaru
    const updatedWallet = await Wallet.findByUserId(req.user.id);

    return successResponse(res, 'Top up berhasil', {
      reference_number: refNumber,
      amount: topUpAmount,
      balance: updatedWallet.balance,
    }, 201);
  } catch (error) {
    console.error('Top up error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat top up');
  }
};

/**
 * POST /api/wallets/transfer - Transfer saldo ke wallet lain
 * Akses: user, admin
 */
const transfer = async (req, res) => {
  try {
    const { phone, amount, description, transaction_pin } = req.body;

    // Validasi input
    if (!phone) {
      return errorResponse(res, 'Nomor telepon tujuan wajib diisi', 400);
    }
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return errorResponse(res, 'Jumlah transfer harus berupa angka lebih dari 0', 400);
    }

    const transferAmount = parseFloat(amount);

    if (transferAmount < 1000) {
      return errorResponse(res, 'Minimal transfer Rp 1.000', 400);
    }

    const isPinValid = await verifyTransactionPin(req.user.id, transaction_pin);
    if (!isPinValid) {
      return errorResponse(res, 'PIN transaksi tidak valid', 401);
    }

    // Ambil wallet pengirim
    const senderWallet = await Wallet.findByUserId(req.user.id);
    if (!senderWallet) {
      return errorResponse(res, 'Wallet pengirim tidak ditemukan', 404);
    }
    if (senderWallet.status !== 'active') {
      return errorResponse(res, 'Wallet pengirim tidak aktif', 400);
    }

    const recipientUser = await User.findByPhone(phone);
    if (!recipientUser) {
      return errorResponse(res, 'User tujuan dengan nomor telepon tersebut tidak ditemukan', 404);
    }

    // Ambil wallet penerima berdasarkan user pemilik nomor telepon
    const recipientWallet = await Wallet.findByUserId(recipientUser.id);
    if (!recipientWallet) {
      return errorResponse(res, 'Wallet tujuan tidak ditemukan', 404);
    }
    if (recipientWallet.status !== 'active') {
      return errorResponse(res, 'Wallet tujuan tidak aktif', 400);
    }

    // Tidak bisa transfer ke diri sendiri
    if (senderWallet.id === recipientWallet.id) {
      return errorResponse(res, 'Tidak bisa transfer ke wallet sendiri', 400);
    }

    // Cek saldo cukup
    if (parseFloat(senderWallet.balance) < transferAmount) {
      return errorResponse(res, 'Saldo tidak mencukupi', 400);
    }

    // Proses transfer: kurangi saldo pengirim, tambah saldo penerima
    const newSenderBalance = parseFloat(senderWallet.balance) - transferAmount;
    const newRecipientBalance = parseFloat(recipientWallet.balance) + transferAmount;

    await Wallet.updateBalance(senderWallet.id, newSenderBalance);
    await Wallet.updateBalance(recipientWallet.id, newRecipientBalance);

    // Buat reference number
    const refNumber = `TF${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Catat transaksi
    const transactionResult = await Transaction.create({
      wallet_id: senderWallet.id,
      transaction_type: 'transfer',
      amount: transferAmount,
      description: description || `Transfer ke ${phone}`,
      reference_number: refNumber,
      recipient_wallet_id: recipientWallet.id,
      status: 'success',
    });

    await AuditLog.create({
      user_id: req.user.id,
      action: 'TRANSFER',
      entity: 'transactions',
      entity_id: transactionResult.insertId,
      old_value: {
        sender_balance: senderWallet.balance,
        recipient_balance: recipientWallet.balance,
      },
      new_value: {
        sender_balance: newSenderBalance,
        recipient_balance: newRecipientBalance,
        amount: transferAmount,
        reference_number: refNumber,
      },
      ip_address: req.ip,
    });

    return successResponse(res, 'Transfer berhasil', {
      reference_number: refNumber,
      amount: transferAmount,
      recipient_phone: phone,
      sender_balance: newSenderBalance,
    }, 201);
  } catch (error) {
    console.error('Transfer error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat transfer');
  }
};

/**
 * PUT /api/wallets/:id/status - Update status wallet
 * Akses: admin only
 */
const updateWalletStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validasi status
    const allowedStatuses = ['active', 'inactive', 'blocked'];
    if (!status || !allowedStatuses.includes(status)) {
      return errorResponse(res, `Status tidak valid. Pilih: ${allowedStatuses.join(', ')}`, 400);
    }

    const wallet = await Wallet.findById(id);
    if (!wallet) {
      return errorResponse(res, 'Wallet tidak ditemukan', 404);
    }

    await Wallet.updateStatus(id, status);
    const updatedWallet = await Wallet.findById(id);

    await AuditLog.create({
      user_id: req.user.id,
      action: 'UPDATE_WALLET_STATUS',
      entity: 'wallets',
      entity_id: parseInt(id),
      old_value: { status: wallet.status },
      new_value: { status: updatedWallet.status },
      ip_address: req.ip,
    });

    return successResponse(res, 'Status wallet berhasil diupdate', { wallet: updatedWallet });
  } catch (error) {
    console.error('Update wallet status error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengupdate status wallet');
  }
};

/**
 * DELETE /api/wallets/:id - Hapus wallet
 * Akses: admin only
 */
const deleteWallet = async (req, res) => {
  try {
    const { id } = req.params;

    const wallet = await Wallet.findById(id);
    if (!wallet) {
      return errorResponse(res, 'Wallet tidak ditemukan', 404);
    }

    // Cek saldo harus 0 sebelum dihapus
    if (parseFloat(wallet.balance) > 0) {
      return errorResponse(res, 'Tidak bisa menghapus wallet yang masih memiliki saldo', 400);
    }

    await Wallet.delete(id);

    await AuditLog.create({
      user_id: req.user.id,
      action: 'DELETE_WALLET',
      entity: 'wallets',
      entity_id: parseInt(id),
      old_value: wallet,
      new_value: null,
      ip_address: req.ip,
    });
    return successResponse(res, 'Wallet berhasil dihapus');
  } catch (error) {
    console.error('Delete wallet error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat menghapus wallet');
  }
};

module.exports = {
  getAllWallets, getMyWallet, getWalletById,
  topUp, transfer,
  updateWalletStatus, deleteWallet,
};
