// ===========================================
// Middleware: Role Authorization
// Membatasi akses berdasarkan role user
// ===========================================

const { errorResponse } = require('../utils/responseHelper');

/**
 * Middleware untuk otorisasi berdasarkan role
 * @param  {...string} allowedRoles - Daftar role yang diizinkan
 * @returns {function} Middleware function
 * 
 * Contoh penggunaan:
 *   roleAuthorization('admin')          -> hanya admin
 *   roleAuthorization('admin', 'user')  -> admin dan user
 */
const roleAuthorization = (...allowedRoles) => {
  return (req, res, next) => {
    // Pastikan user sudah terautentikasi (middleware verifyToken sudah jalan)
    if (!req.user) {
      return errorResponse(res, 'Akses ditolak. Autentikasi diperlukan', 401);
    }

    // Cek apakah role user termasuk dalam daftar yang diizinkan
    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Akses ditolak. Role '${req.user.role}' tidak memiliki izin untuk mengakses resource ini`,
        403
      );
    }

    // Role diizinkan, lanjut ke handler berikutnya
    next();
  };
};

module.exports = roleAuthorization;
