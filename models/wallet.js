const { pool } = require('../config/database');

const Wallet = {
    // membuat wallet untuk user baru
    create: async (userId) => {
        const walletNumber = 'SPAY' + Date.now();
        const [result] = await pool.execute(
            'INSERT INTO wallets (user_id, wallet_number, balance) VALUES (?, ?, ?)',
            [userId, walletNumber, 0.00]
        );
        return result;  
    },

    // menampilkan semua wallet
    findAll: async () => {
        const [rows] = await pool.execute(
            `SELECT w.*, u.name as owner_name, u.email as owner_email 
            FROM wallets w 
            JOIN users u ON w.user_id = u.id 
            ORDER BY w.id DESC`
        );
        return rows;
    },

    // mencari wallet berdasarkan id
    findById: async (id) => {
        // SELECT wallet by id
        const [rows] = await pool.execute(
            `SELECT w.*, u.name as owner_name, u.email as owner_email 
            FROM wallets w 
            JOIN users u ON w.user_id = u.id 
            WHERE w.id = ?`,
            [id]
        );
        return rows[0];
    },

    // mencari wallet berdasarkan user_id
    findByUserId: async (userId) => {
        const [rows] = await pool.execute(
            'SELECT * FROM wallets WHERE user_id = ?',
            [userId]
        );
        return rows[0];
    },

    // mencari wallet berdasarkan wallet_number
    findByWalletNumber: async (walletNumber) => {
        const [rows] = await pool.execute(
            'SELECT * FROM wallets WHERE wallet_number = ?',
            [walletNumber]
        );
        return rows[0];
    },

    // mengubah isi wallet
    updateBalance: async (id, newBalance) => {
        const [result] = await pool.execute(
            'UPDATE wallets SET balance = ? WHERE id = ?',
            [newBalance, id]
        );
        return result;
    },

    // mengubah status wallet (aktif/non-aktif)
    updateStatus: async (id, status) => {
        const [result] = await pool.execute(
            'UPDATE wallets SET status = ? WHERE id = ?',
            [status, id]
        );
        return result;
    },

    // menghapus wallet
    delete: async (id) => {
        const [result] = await pool.execute('DELETE FROM wallets WHERE id = ?', [id]);
        return result;
    },
};

module.exports = Wallet;