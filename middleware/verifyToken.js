// ===========================================
// Middleware: Verifikasi Token JWT
// Memastikan request memiliki token yang valid
// ===========================================

const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/responseHelper');

/**
 * Middleware untuk memverifikasi JWT token
 * Token dikirim melalui header: Authorization: Bearer <token>
 */
const verifyToken = (req, res, next) => {
  try {
    // Ambil header authorization
    const authHeader = req.headers['authorization'];

    // Cek apakah header ada
    if (!authHeader) {
      return errorResponse(res, 'Akses ditolak. Token tidak ditemukan', 401);
    }

    // Cek format Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Format token tidak valid. Gunakan: Bearer <token>', 401);
    }

    // Ekstrak token (hilangkan prefix "Bearer ")
    const token = authHeader.split(' ')[1];

    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Simpan data user dari token ke request object
    req.user = decoded;

    // Lanjut ke handler berikutnya
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token sudah expired. Silakan login kembali', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Token tidak valid', 401);
    }
    return errorResponse(res, 'Gagal mengautentikasi token', 500);
  }
};

module.exports = verifyToken;
