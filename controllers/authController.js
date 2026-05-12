// ===========================================
// Controller: Auth Controller
// Menangani logika register, login, dan profile
// ===========================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Wallet = require('../models/walletModel');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * Register - Mendaftarkan user baru
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Validasi input
    if (!name || !email || !password) {
      return errorResponse(res, 'Field name, email, dan password wajib diisi', 400);
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

    // Validasi role (hanya admin, user, auditor yang diperbolehkan)
    const allowedRoles = ['admin', 'user', 'auditor'];
    const userRole = role || 'user'; // Default role: user
    if (!allowedRoles.includes(userRole)) {
      return errorResponse(res, `Role tidak valid. Pilih: ${allowedRoles.join(', ')}`, 400);
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return errorResponse(res, 'Email sudah terdaftar', 409);
    }

    // Hash password menggunakan bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Simpan user baru ke database
    const result = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      role: userRole,
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
    const user = await User.findByEmail(email);
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
 * Get Profile - Mengambil data profil user yang sedang login
 * GET /api/auth/profile
 * Endpoint protected - membutuhkan token JWT valid
 */
const getProfile = async (req, res) => {
  try {
    // req.user diisi oleh middleware verifyToken
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

module.exports = { register, login, getProfile };
