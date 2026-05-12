// ===========================================
// Model: Wallet
// Query database untuk tabel wallets (CRUD)
// ===========================================

const { pool } = require('../config/database');

const Wallet = {
  /**
   * Membuat wallet baru untuk user (Create)
   */
  create: async (userId) => {
    const walletNumber = `WAL${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const query = `
      INSERT INTO wallets (user_id, wallet_number, balance) 
      VALUES (?, ?, 0.00)
    `;
    const [result] = await pool.execute(query, [userId, walletNumber]);
    return result;
  },

  /**
   * Mengambil semua wallet (Read - Admin only)
   */
  findAll: async () => {
    const query = `
      SELECT w.*, u.name as owner_name, u.email as owner_email 
      FROM wallets w 
      JOIN users u ON w.user_id = u.id 
      ORDER BY w.id DESC
    `;
    const [rows] = await pool.execute(query);
    return rows;
  },

  /**
   * Mencari wallet berdasarkan ID (Read)
   */
  findById: async (id) => {
    const query = `
      SELECT w.*, u.name as owner_name, u.email as owner_email 
      FROM wallets w 
      JOIN users u ON w.user_id = u.id 
      WHERE w.id = ?
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Mencari wallet berdasarkan user ID (Read)
   */
  findByUserId: async (userId) => {
    const query = 'SELECT * FROM wallets WHERE user_id = ?';
    const [rows] = await pool.execute(query, [userId]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Mencari wallet berdasarkan nomor wallet (Read)
   */
  findByWalletNumber: async (walletNumber) => {
    const query = 'SELECT * FROM wallets WHERE wallet_number = ?';
    const [rows] = await pool.execute(query, [walletNumber]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Update saldo wallet (Update)
   */
  updateBalance: async (id, newBalance) => {
    const query = 'UPDATE wallets SET balance = ? WHERE id = ?';
    const [result] = await pool.execute(query, [newBalance, id]);
    return result;
  },

  /**
   * Update status wallet (Update - Admin only)
   */
  updateStatus: async (id, status) => {
    const query = 'UPDATE wallets SET status = ? WHERE id = ?';
    const [result] = await pool.execute(query, [status, id]);
    return result;
  },

  /**
   * Hapus wallet (Delete - Admin only)
   */
  delete: async (id) => {
    const query = 'DELETE FROM wallets WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result;
  },
};

module.exports = Wallet;
