const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import konfigurasi database
const { testConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Inisialisasi Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON request body
app.use(express.json());

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true }));

// Aktifkan CORS (Cross-Origin Resource Sharing)
app.use(cors());

// Route utama - health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Backend Financial Technology Wallet API',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      wallets: '/api/wallets',
      transactions: '/api/transactions',
      audit_logs: '/api/audit-logs',
      dashboard: '/api/dashboard',
    },
  });
});

// Auth routes (register, login, profile)
app.use('/api/auth', authRoutes);

// User CRUD routes
app.use('/api/users', userRoutes);

// Wallet CRUD routes (topup, transfer, dll)
app.use('/api/wallets', walletRoutes);

// Transaction CRUD routes (payment, mutasi, dll)
app.use('/api/transactions', transactionRoutes);

// Audit log routes
app.use('/api/audit-logs', auditLogRoutes);

// Dashboard routes
app.use('/api/dashboard', dashboardRoutes);

// ===========================================
// Error Handling
// ===========================================

// Handle 404 - Route tidak ditemukan
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} tidak ditemukan`,
  });
});

// Handle error global
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan internal server',
  });
});

// ===========================================
// Jalankan Server
// ===========================================

const startServer = async () => {
  // Test koneksi database terlebih dahulu
  await testConnection();

  app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();
