const { pool } = require('../config/database');

const Transaction = {
    // membuat transaksi baru
    create: async (transactionData) => {
        const [result] = await pool.execute(
            `INSERT INTO transactions (wallet_id, transaction_type, amount, description, reference_number, recipient_wallet_id, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                transactionData.wallet_id,
                transactionData.transaction_type,
                transactionData.amount,
                transactionData.description,
                transactionData.reference_number,
                transactionData.recipient_wallet_id,
                transactionData.status
            ]
        );
        return result;
    },

    // menampilkan semua transaksi
    findAll: async () => {
        // SELECT semua transaksi join wallet dan user
        const [rows] = await pool.execute(
            `SELECT t.*, w.wallet_number as sender_wallet_number, u.name as sender_name,
            rw.wallet_number as recipient_wallet_number
            FROM transactions t
            JOIN wallets w ON t.wallet_id = w.id
            JOIN users u ON w.user_id = u.id
            LEFT JOIN wallets rw ON t.recipient_wallet_id = rw.id
            ORDER BY t.created_at DESC`
        );
        return rows;
    },

    // mencari transaksi berdasarkan id
    findById: async (id) => {
        // SELECT transaksi by id
        const [rows] = await pool.execute(
            ` SELECT t.*, w.wallet_number as sender_wallet_number, u.name as sender_name,
            rw.wallet_number as recipient_wallet_number
            FROM transactions t
            JOIN wallets w ON t.wallet_id = w.id
            JOIN users u ON w.user_id = u.id
            LEFT JOIN wallets rw ON t.recipient_wallet_id = rw.id
            WHERE t.id = ?`,
            [id]
        );
        return rows[0];
    },

    // mencari transaksi berdasarkan wallet_id
    findByWalletId: async (walletId) => {
        const [rows] = await pool.execute(
            `SELECT t.*, w.wallet_number as sender_wallet_number,
            rw.wallet_number as recipient_wallet_number
            FROM transactions t
            JOIN wallets w ON t.wallet_id = w.id
            LEFT JOIN wallets rw ON t.recipient_wallet_id = rw.id
            WHERE t.wallet_id = ? OR t.recipient_wallet_id = ?
            ORDER BY t.created_at DESC`,
            [walletId, walletId]
        );
        return rows;
    },

    // mencari transaksi berdasarkan reference_number
    findByReferenceNumber: async (referenceNumber) => {
        const [rows] = await pool.execute(
            'SELECT * FROM transactions WHERE reference_number = ?', 
            [referenceNumber]
        );
        return rows[0];
    },

    // mengubah status transaksi (pending/sukses/gagal)
    updateStatus: async (id, status) => {
        const [result] = await pool.execute(
            'UPDATE transactions SET status = ? WHERE id = ?',
            [status, id]
        );
        return result;
    },

    // menghapus transaksi
    delete: async (id) => {
        const [result] = await pool.execute('DELETE FROM transactions WHERE id = ?', [id]);
        return result;
    },

    // menghitung jumlah transaksi
    count: async () => {
        const [rows] = await pool.execute('SELECT COUNT(*) as total FROM transactions');
        return rows[0].total;
    },
};

module.exports = Transaction;
