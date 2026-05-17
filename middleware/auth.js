const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/response');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Akses ditolak. Token JWT tidak ditemukan.', 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: Number(payload.id),
      name: payload.name,
      email: payload.email,
      role: payload.role
    };
    req.authUser = req.user;

    return next();
  } catch (error) {
    return errorResponse(res, 'Token JWT tidak valid atau kedaluwarsa.', 401);
  }
}

module.exports = authenticateToken;
