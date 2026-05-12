// ===========================================
// Model: Transaction
// Query database untuk tabel transactions (CRUD)
// ===========================================

const { pool } = require('../config/database');

const Transaction = {
  /**
   * Membuat transaksi baru (Create)
   */
  create: async (transactionData) => {
    const { wallet_id, transaction_type, amount, description, reference_number, recipient_wallet_id, status } = transactionData;
    const query = `
      INSERT INTO transactions (wallet_id, transaction_type, amount, description, reference_number, recipient_wallet_id, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [
      wallet_id, transaction_type, amount, description,
      reference_number, recipient_wallet_id || null, status || 'success',
    ]);
    return result;
  },

  /**
   * Mengambil semua transaksi (Read - Admin/Auditor)
   */
  findAll: async () => {
    const query = `
      SELECT t.*, w.wallet_number as sender_wallet_number, u.name as sender_name,
             rw.wallet_number as recipient_wallet_number
      FROM transactions t
      JOIN wallets w ON t.wallet_id = w.id
      JOIN users u ON w.user_id = u.id
      LEFT JOIN wallets rw ON t.recipient_wallet_id = rw.id
      ORDER BY t.created_at DESC
    `;
    const [rows] = await pool.execute(query);
    return rows;
  },

  /**
   * Mencari transaksi berdasarkan ID (Read)
   */
  findById: async (id) => {
    const query = `
      SELECT t.*, w.wallet_number as sender_wallet_number, u.name as sender_name,
             rw.wallet_number as recipient_wallet_number
      FROM transactions t
      JOIN wallets w ON t.wallet_id = w.id
      JOIN users u ON w.user_id = u.id
      LEFT JOIN wallets rw ON t.recipient_wallet_id = rw.id
      WHERE t.id = ?
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Mencari transaksi berdasarkan wallet ID / mutasi (Read)
   */
  findByWalletId: async (walletId) => {
    const query = `
      SELECT t.*, w.wallet_number as sender_wallet_number,
             rw.wallet_number as recipient_wallet_number
      FROM transactions t
      JOIN wallets w ON t.wallet_id = w.id
      LEFT JOIN wallets rw ON t.recipient_wallet_id = rw.id
      WHERE t.wallet_id = ? OR t.recipient_wallet_id = ?
      ORDER BY t.created_at DESC
    `;
    const [rows] = await pool.execute(query, [walletId, walletId]);
    return rows;
  },

  /**
   * Mencari transaksi berdasarkan reference number (Read)
   */
  findByReferenceNumber: async (referenceNumber) => {
    const query = 'SELECT * FROM transactions WHERE reference_number = ?';
    const [rows] = await pool.execute(query, [referenceNumber]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Update status transaksi (Update)
   */
  updateStatus: async (id, status) => {
    const query = 'UPDATE transactions SET status = ? WHERE id = ?';
    const [result] = await pool.execute(query, [status, id]);
    return result;
  },

  /**
   * Hapus transaksi (Delete - Admin only)
   */
  delete: async (id) => {
    const query = 'DELETE FROM transactions WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result;
  },

  /**
   * Hitung total transaksi (untuk statistik)
   */
  count: async () => {
    const query = 'SELECT COUNT(*) as total FROM transactions';
    const [rows] = await pool.execute(query);
    return rows[0].total;
  },
};

module.exports = Transaction;
