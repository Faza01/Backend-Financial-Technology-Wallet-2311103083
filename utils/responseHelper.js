// ===========================================
// Utility: Response Helper
// Standarisasi format response API
// ===========================================

/**
 * Mengirim response sukses
 * @param {object} res - Express response object
 * @param {string} message - Pesan sukses
 * @param {object} data - Data yang dikirim
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const successResponse = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
  };
  if (data !== null) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
};

/**
 * Mengirim response error
 * @param {object} res - Express response object
 * @param {string} message - Pesan error
 * @param {number} statusCode - HTTP status code (default: 500)
 */
const errorResponse = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = { successResponse, errorResponse };
