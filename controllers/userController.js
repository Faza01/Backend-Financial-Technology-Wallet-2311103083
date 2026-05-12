// ===========================================
// Controller: User Controller
// CRUD manajemen user (khusus admin)
// ===========================================

const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Wallet = require('../models/walletModel');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * GET /api/users - Mengambil semua data user
 * Akses: admin
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    return successResponse(res, 'Data semua user berhasil diambil', { users });
  } catch (error) {
    console.error('Get all users error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengambil data user');
  }
};

/**
 * GET /api/users/:id - Mengambil data user berdasarkan ID
 * Akses: admin (semua user), user (hanya diri sendiri)
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validasi: user biasa hanya boleh lihat data sendiri
    if (req.user.role === 'user' && parseInt(id) !== req.user.id) {
      return errorResponse(res, 'Akses ditolak. Anda hanya bisa melihat data sendiri', 403);
    }

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }

    // Ambil wallet user
    const wallet = await Wallet.findByUserId(id);

    return successResponse(res, 'Data user berhasil diambil', { user, wallet });
  } catch (error) {
    console.error('Get user by ID error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengambil data user');
  }
};

/**
 * POST /api/users - Membuat user baru (admin bisa tentukan role)
 * Akses: admin
 */
const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Validasi input wajib
    if (!name || !email || !password) {
      return errorResponse(res, 'Field name, email, dan password wajib diisi', 400);
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, 'Format email tidak valid', 400);
    }

    // Validasi panjang password
    if (password.length < 6) {
      return errorResponse(res, 'Password minimal 6 karakter', 400);
    }

    // Validasi role
    const allowedRoles = ['admin', 'user', 'auditor'];
    const userRole = role || 'user';
    if (!allowedRoles.includes(userRole)) {
      return errorResponse(res, `Role tidak valid. Pilih: ${allowedRoles.join(', ')}`, 400);
    }

    // Cek email duplikat
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return errorResponse(res, 'Email sudah terdaftar', 409);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Simpan user
    const result = await User.create({
      name, email, password: hashedPassword,
      phone: phone || null, role: userRole,
    });

    // Buat wallet otomatis
    await Wallet.create(result.insertId);

    const newUser = await User.findById(result.insertId);
    return successResponse(res, 'User berhasil dibuat', { user: newUser }, 201);
  } catch (error) {
    console.error('Create user error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat membuat user');
  }
};

/**
 * PUT /api/users/:id - Update data user
 * Akses: admin (semua user), user (hanya diri sendiri, tidak bisa ubah role)
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role } = req.body;

    // Validasi: user biasa hanya boleh update data sendiri
    if (req.user.role === 'user' && parseInt(id) !== req.user.id) {
      return errorResponse(res, 'Akses ditolak. Anda hanya bisa mengubah data sendiri', 403);
    }

    // Cek apakah user ada
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }

    // Validasi input
    if (!name || !email) {
      return errorResponse(res, 'Field name dan email wajib diisi', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, 'Format email tidak valid', 400);
    }

    // Cek email duplikat (kecuali email milik user sendiri)
    const emailUser = await User.findByEmail(email);
    if (emailUser && emailUser.id !== parseInt(id)) {
      return errorResponse(res, 'Email sudah digunakan user lain', 409);
    }

    // User biasa tidak boleh ubah role sendiri
    const updatedRole = req.user.role === 'admin' ? (role || existingUser.role) : existingUser.role;

    await User.update(id, {
      name,
      email,
      phone: phone || existingUser.phone,
      role: updatedRole,
    });

    const updatedUser = await User.findById(id);
    return successResponse(res, 'Data user berhasil diupdate', { user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengupdate user');
  }
};

/**
 * DELETE /api/users/:id - Hapus user
 * Akses: admin only
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Admin tidak bisa hapus diri sendiri
    if (parseInt(id) === req.user.id) {
      return errorResponse(res, 'Tidak bisa menghapus akun sendiri', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }

    await User.delete(id);
    return successResponse(res, 'User berhasil dihapus');
  } catch (error) {
    console.error('Delete user error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat menghapus user');
  }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
