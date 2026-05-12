// ===========================================
// Konfigurasi Koneksi Database MySQL
// Menggunakan Connection Pool untuk efisiensi
// ===========================================

const mysql = require('mysql2/promise');
require('dotenv').config();

// Membuat connection pool ke database MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,      // Maksimal 10 koneksi dalam pool
  queueLimit: 0,            // Tidak ada batasan antrian
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Fungsi untuk test koneksi database
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database MySQL terhubung berhasil');
    connection.release();
  } catch (error) {
    console.error('❌ Gagal terhubung ke database:', error.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };
