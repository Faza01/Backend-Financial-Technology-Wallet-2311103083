const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const User = require('../models/user');
const Wallet = require('../models/wallet');
const { hashTransactionPin } = require('../utils/pin');

async function seed() {
  try {
    console.log('🌱 Starting database seeding & auto-migration...');

    // 1. Auto-migration check: Check if new columns exist
    const dbName = process.env.DB_NAME || 'shopeepay_wallet';
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME IN ('reset_password_token', 'reset_password_expires', 'reset_password_requested_at', 'last_pin_reset_at')
    `, [dbName]);

    const existingColumns = columns.map(c => c.COLUMN_NAME);

    if (!existingColumns.includes('reset_password_token')) {
      console.log('⚡ Adding reset_password_token column to users table...');
      await pool.execute('ALTER TABLE users ADD COLUMN reset_password_token VARCHAR(255) DEFAULT NULL');
      console.log('✅ Column reset_password_token added.');
    }

    if (!existingColumns.includes('reset_password_expires')) {
      console.log('⚡ Adding reset_password_expires column to users table...');
      await pool.execute('ALTER TABLE users ADD COLUMN reset_password_expires TIMESTAMP DEFAULT NULL');
      console.log('✅ Column reset_password_expires added.');
    }

    if (!existingColumns.includes('reset_password_requested_at')) {
      console.log('⚡ Adding reset_password_requested_at column to users table...');
      await pool.execute('ALTER TABLE users ADD COLUMN reset_password_requested_at TIMESTAMP DEFAULT NULL');
      console.log('✅ Column reset_password_requested_at added.');
    }

    if (!existingColumns.includes('last_pin_reset_at')) {
      console.log('⚡ Adding last_pin_reset_at column to users table...');
      await pool.execute('ALTER TABLE users ADD COLUMN last_pin_reset_at TIMESTAMP DEFAULT NULL');
      console.log('✅ Column last_pin_reset_at added.');
    }

    // 2. Seed Admin User
    const adminEmail = 'admin@wallet.com';
    const existingAdmin = await User.findByEmail(adminEmail);
    if (!existingAdmin) {
      console.log('⚡ Seeding admin user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      const hashedPin = await hashTransactionPin('123456');

      const result = await User.create({
        name: 'Admin ShopeePay',
        email: adminEmail,
        password: hashedPassword,
        phone: '081111111111',
        role: 'admin',
        transaction_pin: hashedPin
      });
      
      // Create wallet for admin
      await Wallet.create(result.insertId);
      console.log('✅ Admin user & wallet seeded successfully (admin@wallet.com / admin123)');
    } else {
      console.log('ℹ️ Admin user already exists.');
    }

    // 3. Seed Auditor User
    const auditorEmail = 'auditor@wallet.com';
    const existingAuditor = await User.findByEmail(auditorEmail);
    if (!existingAuditor) {
      console.log('⚡ Seeding auditor user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('auditor123', salt);
      const hashedPin = await hashTransactionPin('123456');

      const result = await User.create({
        name: 'Auditor ShopeePay',
        email: auditorEmail,
        password: hashedPassword,
        phone: '082222222222',
        role: 'auditor',
        transaction_pin: hashedPin
      });
      
      // Create wallet for auditor
      await Wallet.create(result.insertId);
      console.log('✅ Auditor user & wallet seeded successfully (auditor@wallet.com / auditor123)');
    } else {
      console.log('ℹ️ Auditor user already exists.');
    }

    console.log('🌱 Seeding & Migration process completed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding & Migration failed:', error);
    process.exit(1);
  }
}

// Jalankan seed
seed();
