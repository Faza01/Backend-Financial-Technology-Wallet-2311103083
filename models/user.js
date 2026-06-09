const { pool } = require('../config/database');

const User = {
    
    // membuat user
    create: async (userData) => {
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password, phone, role, transaction_pin) VALUES (?, ?, ?, ?, ?, ?)',
            [userData.name, userData.email, userData.password, userData.phone, userData.role, userData.transaction_pin]
        );
        return result;
    },
    
    // menampilkan semua user (opsional filter berdasarkan role)
    findAll: async (role = null) => {
        if (role) {
            const [rows] = await pool.execute(
                'SELECT id, name, email, phone, role, created_at, updated_at FROM users WHERE role = ? ORDER BY id DESC',
                [role]
            );
            return rows;
        } else {
            const [rows] = await pool.execute(
                'SELECT id, name, email, phone, role, created_at, updated_at FROM users ORDER BY id DESC'
            );
            return rows;
        }
    },

    // mencari user berdasarkan id
    findById: async (id) => {
        const [rows] = await pool.execute(
            'SELECT id, name, email, phone, role, created_at, updated_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    },

    // mencari user berdasarkan email
    findByEmail: async (email) => {
        const [rows] = await pool.execute(
            'SELECT id, name, email, phone, role, reset_password_requested_at, reset_password_token, reset_password_expires, created_at, updated_at FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    },

    // mencari user berdasarkan email termasuk password untuk login
    findByEmailWithPassword: async (email) => {
        const [rows] = await pool.execute(
            'SELECT id, name, email, password, phone, role, last_pin_reset_at, created_at, updated_at FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    },

    // mencari user berdasarkan nomor telepon
    findByPhone: async (phone) => {
        const [rows] = await pool.execute(
            'SELECT id, name, email, phone, role, created_at, updated_at FROM users WHERE phone = ?',
            [phone]
        );
        return rows[0];
    },

    // mengubah data user
    update: async (id, userData) => {
        const [result] = await pool.execute(
            'UPDATE users SET name = ?, email = ?, phone = ?, role = ? WHERE id = ?',
            [userData.name, userData.email, userData.phone, userData.role, id]
        );
        return result;
    },

    // mengubah password user
    updatePassword: async (id, hashedPassword) => {
        const [result] = await pool.execute(
            'UPDATE users SET password = ? WHERE id = ?', 
            [hashedPassword, id]
        );
        return result;
    },

    // mengambil transaction pin
    getTransactionPinById: async (id) => {
        const [rows] = await pool.execute(
            'SELECT transaction_pin FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    },

    // mengubah transaction pin
    updateTransactionPin: async (id, hashedPin) => {
        const [result] = await pool.execute(
            'UPDATE users SET transaction_pin = ? WHERE id = ?',
            [hashedPin, id]
        );
        return result;
    },

    // mengubah transaction pin beserta timestamp
    updateTransactionPinWithTimestamp: async (id, hashedPin, lastPinResetAt) => {
        const [result] = await pool.execute(
            'UPDATE users SET transaction_pin = ?, last_pin_reset_at = ? WHERE id = ?',
            [hashedPin, lastPinResetAt, id]
        );
        return result;
    },

    // menghapus user 
    delete: async (id) => {
        const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        return result;
    },

    // menghitung jumlah user
    count: async () => {
        const [rows] = await pool.execute('SELECT COUNT(*) as total FROM users');
        return rows[0].total;
    },

    // menyimpan token reset password beserta waktu permintaan
    saveResetPasswordToken: async (email, token, expiresAt, requestedAt) => {
        const [result] = await pool.execute(
            'UPDATE users SET reset_password_token = ?, reset_password_expires = ?, reset_password_requested_at = ? WHERE email = ?',
            [token, expiresAt, requestedAt, email]
        );
        return result;
    },

    // mencari user berdasarkan email dan token reset password
    findByEmailAndResetPasswordToken: async (email, token) => {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ? AND reset_password_token = ?',
            [email, token]
        );
        return rows[0];
    },

    // menghapus token reset password
    clearResetPasswordToken: async (id) => {
        const [result] = await pool.execute(
            'UPDATE users SET reset_password_token = NULL, reset_password_expires = NULL, reset_password_requested_at = NULL WHERE id = ?',
            [id]
        );
        return result;
    },
};

module.exports = User;
