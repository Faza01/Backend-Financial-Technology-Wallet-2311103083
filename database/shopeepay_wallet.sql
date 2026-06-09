CREATE DATABASE IF NOT EXISTS shopeepay_wallet;
USE shopeepay_wallet;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  transaction_pin VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  role ENUM('user', 'admin', 'auditor') DEFAULT 'user',
  reset_password_token VARCHAR(255) DEFAULT NULL,
  reset_password_expires TIMESTAMP DEFAULT NULL,
  reset_password_requested_at TIMESTAMP DEFAULT NULL,
  last_pin_reset_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  wallet_number VARCHAR(50) NOT NULL UNIQUE,
  balance DECIMAL(15,2) DEFAULT 0.00,
  status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  wallet_id INT NOT NULL,
  transaction_type ENUM('topup', 'transfer', 'payment') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description VARCHAR(255),
  reference_number VARCHAR(100) UNIQUE,
  recipient_wallet_id INT,
  status ENUM('pending', 'success', 'failed', 'reversed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_wallet_id) REFERENCES wallets(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id INT,
  old_value JSON,
  new_value JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
