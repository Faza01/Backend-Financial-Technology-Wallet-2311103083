// ===========================================
// Model: User
// Query database untuk tabel users (CRUD)
// ===========================================

const { pool } = require('../config/database');

const User = {
  /**
   * Membuat user baru (Create)
   */
  create: async (userData) => {
    const { name, email, password, phone, role } = userData;
    const query = `
      INSERT INTO users (name, email, password, phone, role) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [name, email, password, phone, role]);
    return result;
  },

  /**
   * Mengambil semua user (Read - Admin only)
   */
  findAll: async () => {
    const query = 'SELECT id, name, email, phone, role, created_at, updated_at FROM users ORDER BY id DESC';
    const [rows] = await pool.execute(query);
    return rows;
  },

  /**
   * Mencari user berdasarkan ID (Read)
   */
  findById: async (id) => {
    const query = 'SELECT id, name, email, phone, role, created_at, updated_at FROM users WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Mencari user berdasarkan email (Read)
   */
  findByEmail: async (email) => {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await pool.execute(query, [email]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Update data user (Update)
   */
  update: async (id, userData) => {
    const { name, email, phone, role } = userData;
    const query = `
      UPDATE users SET name = ?, email = ?, phone = ?, role = ?
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [name, email, phone, role, id]);
    return result;
  },

  /**
   * Update password user (Update)
   */
  updatePassword: async (id, hashedPassword) => {
    const query = 'UPDATE users SET password = ? WHERE id = ?';
    const [result] = await pool.execute(query, [hashedPassword, id]);
    return result;
  },

  /**
   * Hapus user berdasarkan ID (Delete)
   */
  delete: async (id) => {
    const query = 'DELETE FROM users WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result;
  },

  /**
   * Hitung total user (untuk statistik)
   */
  count: async () => {
    const query = 'SELECT COUNT(*) as total FROM users';
    const [rows] = await pool.execute(query);
    return rows[0].total;
  },
};

module.exports = User;
