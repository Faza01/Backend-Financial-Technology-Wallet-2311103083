-- ===========================================
-- Database: fintech_wallet (atau shopeepay)
-- SQL Script untuk membuat database dan tabel
-- Backend Financial Technology Wallet
-- ===========================================

-- Buat database (jika belum ada)
-- Ganti nama database sesuai .env (DB_NAME)
CREATE DATABASE IF NOT EXISTS fintech_wallet;
USE fintech_wallet;

-- ===========================================
-- Tabel: users
-- Menyimpan data user yang terdaftar
-- ===========================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  role ENUM('admin', 'user', 'auditor') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================================
-- Tabel: wallets
-- Menyimpan data wallet milik user
-- Relasi: 1 user memiliki 1 wallet
-- ===========================================
CREATE TABLE IF NOT EXISTS wallets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  wallet_number VARCHAR(50) NOT NULL UNIQUE,
  balance DECIMAL(15, 2) DEFAULT 0.00,
  status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_wallet_number (wallet_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================================
-- Tabel: transactions
-- Menyimpan data transaksi (topup, transfer, payment)
-- Relasi: 1 wallet memiliki banyak transaksi
-- ===========================================
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  wallet_id INT NOT NULL,
  transaction_type ENUM('topup', 'transfer', 'payment') NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  reference_number VARCHAR(100) UNIQUE,
  recipient_wallet_id INT DEFAULT NULL,
  status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_transaction_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
  CONSTRAINT fk_transaction_recipient FOREIGN KEY (recipient_wallet_id) REFERENCES wallets(id) ON DELETE SET NULL,
  INDEX idx_wallet_id (wallet_id),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================================
-- Tabel: audit_logs
-- Menyimpan log aktivitas untuk audit
-- Relasi: 1 user memiliki banyak audit log
-- ===========================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id INT DEFAULT NULL,
  old_value JSON DEFAULT NULL,
  new_value JSON DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
