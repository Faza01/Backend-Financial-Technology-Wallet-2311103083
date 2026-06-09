const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Wallet = require('../models/wallet');
const { successResponse, errorResponse } = require('../utils/response');
const { isValidTransactionPin, hashTransactionPin } = require('../utils/pin');

/**
 * Register - Mendaftarkan user baru
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, phone, role, transaction_pin } = req.body;

    // Validasi input
    if (!name || !email || !password || !transaction_pin) {
      return errorResponse(res, 'Field name, email, password, dan transaction_pin wajib diisi', 400);
    }

    // Validasi format email sederhana
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, 'Format email tidak valid', 400);
    }

    // Validasi panjang password
    if (password.length < 6) {
      return errorResponse(res, 'Password minimal 6 karakter', 400);
    }

    if (!isValidTransactionPin(transaction_pin)) {
      return errorResponse(res, 'PIN transaksi harus 6 digit angka', 400);
    }

    // Registrasi publik hanya diizinkan untuk role 'user'
    if (role && role !== 'user') {
      return errorResponse(res, 'Pendaftaran untuk role admin atau auditor tidak diperbolehkan secara publik', 403);
    }
    const userRole = 'user';

    // Cek apakah email sudah terdaftar
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return errorResponse(res, 'Email sudah terdaftar', 409);
    }

    if (phone) {
      const existingPhone = await User.findByPhone(phone);
      if (existingPhone) {
        return errorResponse(res, 'Nomor telepon sudah terdaftar', 409);
      }
    }

    // Hash password menggunakan bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const hashedPin = await hashTransactionPin(transaction_pin);

    // Simpan user baru ke database
    const result = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      role: userRole,
      transaction_pin: hashedPin,
    });

    // Buat wallet otomatis untuk user baru
    await Wallet.create(result.insertId);

    // Ambil data user yang baru dibuat (tanpa password)
    const newUser = await User.findById(result.insertId);

    return successResponse(res, 'Registrasi berhasil', { user: newUser }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat registrasi');
  }
};

/**
 * Login - Autentikasi user dan generate token JWT
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
      return errorResponse(res, 'Email dan password wajib diisi', 400);
    }

    // Cari user berdasarkan email
    const user = await User.findByEmailWithPassword(email);
    if (!user) {
      return errorResponse(res, 'Email atau password salah', 401);
    }

    // Bandingkan password dengan hash di database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return errorResponse(res, 'Email atau password salah', 401);
    }

    // Buat payload untuk JWT
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // Generate JWT token
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    return successResponse(res, 'Login berhasil', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat login');
  }
};

/**
 * Logout - Mengakhiri sesi di sisi client
 * POST /api/auth/logout
 * Endpoint protected - membutuhkan token JWT valid
 */
const logout = async (req, res) => {
  return successResponse(res, 'Logout berhasil. Silakan hapus token di sisi client.');
};

/**
 * Get Profile - Mengambil data profil user yang sedang login
 * GET /api/auth/profile
 * Endpoint protected - membutuhkan token JWT valid
 */
const getProfile = async (req, res) => {
  try {
    // req.user diisi oleh middleware auth
    const user = await User.findById(req.user.id);

    if (!user) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }

    // Ambil data wallet user
    const wallet = await Wallet.findByUserId(req.user.id);

    return successResponse(res, 'Data profil berhasil diambil', {
      user,
      wallet: wallet || null,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengambil profil');
  }
};

/**
 * resetPin - Mereset PIN transaksi menggunakan verifikasi password
 * PUT /api/auth/reset-pin (Protected)
 */
const resetPin = async (req, res) => {
  try {
    const { password, new_pin } = req.body;

    if (!password || !new_pin) {
      return errorResponse(res, 'Password login saat ini dan new_pin wajib diisi', 400);
    }

    if (!isValidTransactionPin(new_pin)) {
      return errorResponse(res, 'PIN transaksi baru harus 6 digit angka', 400);
    }

    // Cari user beserta password hash berdasarkan email di req.user
    const user = await User.findByEmailWithPassword(req.authUser.email);
    if (!user) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }

    // Pengecekan cooldown reset PIN (24 jam)
    if (user.last_pin_reset_at) {
      const timeDiff = Date.now() - new Date(user.last_pin_reset_at).getTime();
      const oneDayInMs = 24 * 60 * 60 * 1000;
      if (timeDiff < oneDayInMs) {
        const timeLeftMs = oneDayInMs - timeDiff;
        let hoursLeft = Math.floor(timeLeftMs / (60 * 60 * 1000));
        let minutesLeft = Math.ceil((timeLeftMs % (60 * 60 * 1000)) / (60 * 1000));
        
        if (minutesLeft === 60) {
          hoursLeft += 1;
          minutesLeft = 0;
        }
        
        let message = 'Anda hanya dapat mereset PIN transaksi sekali dalam 24 jam. ';
        if (hoursLeft > 0) {
          message += `Silakan tunggu ${hoursLeft} jam${minutesLeft > 0 ? ` ${minutesLeft} menit` : ''} lagi.`;
        } else {
          message += `Silakan tunggu ${minutesLeft} menit lagi.`;
        }
        return errorResponse(res, message, 429);
      }
    }

    // Bandingkan password login yang dimasukkan dengan hash di database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return errorResponse(res, 'Password login salah', 401);
    }

    // Hash PIN baru
    const hashedPin = await hashTransactionPin(new_pin);

    // Update PIN transaksi beserta timestamp reset terakhir
    const lastPinResetAt = new Date();
    await User.updateTransactionPinWithTimestamp(user.id, hashedPin, lastPinResetAt);

    return successResponse(res, 'PIN transaksi berhasil diperbarui');
  } catch (error) {
    console.error('Reset PIN error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mereset PIN');
  }
};

/**
 * forgotPassword - Meminta token reset password (dengan cooldown 60 detik)
 * POST /api/auth/forgot-password (Public)
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 'Email wajib diisi', 400);
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return errorResponse(res, 'User dengan email tersebut tidak ditemukan', 404);
    }

    // Pengecekan cooldown spam request (60 detik)
    if (user.reset_password_requested_at) {
      const timeDiff = Date.now() - new Date(user.reset_password_requested_at).getTime();
      const secondsLeft = Math.ceil((60000 - timeDiff) / 1000);
      if (secondsLeft > 0) {
        return errorResponse(res, `Silakan tunggu ${secondsLeft} detik sebelum meminta token reset password kembali.`, 429);
      }
    }

    // Generate random 6-digit number token for password reset
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 menit dari sekarang
    const requestedAt = new Date();

    await User.saveResetPasswordToken(email, token, expiresAt, requestedAt);

    // Simulasi pengiriman email ke terminal console (aman dari intip response JSON)
    console.log(`\n🔑 [RESET PASSWORD TOKEN] Email: ${email} | Token: ${token}\n`);

    return successResponse(res, 'Token reset password telah dikirim. Silakan cek konsol/log terminal server Anda untuk menyalin token tersebut.');
  } catch (error) {
    console.error('Forgot password error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat memproses forgot password');
  }
};

/**
 * resetPassword - Mereset password menggunakan token reset
 * POST /api/auth/reset-password (Public)
 */
const resetPassword = async (req, res) => {
  try {
    const { email, token, new_password } = req.body;

    if (!email || !token || !new_password) {
      return errorResponse(res, 'Email, token, dan new_password wajib diisi', 400);
    }

    if (new_password.length < 6) {
      return errorResponse(res, 'Password baru minimal 6 karakter', 400);
    }

    const user = await User.findByEmailAndResetPasswordToken(email, token);
    if (!user) {
      return errorResponse(res, 'Token reset password tidak valid untuk email tersebut', 400);
    }

    // Periksa kedaluwarsa token
    const expires = new Date(user.reset_password_expires);
    if (expires < new Date()) {
      return errorResponse(res, 'Token reset password sudah kedaluwarsa', 400);
    }

    // Hash password baru
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // Update password dan bersihkan token
    await User.updatePassword(user.id, hashedPassword);
    await User.clearResetPasswordToken(user.id);

    return successResponse(res, 'Password berhasil direset');
  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mereset password');
  }
};

module.exports = { register, login, logout, getProfile, resetPin, forgotPassword, resetPassword };
