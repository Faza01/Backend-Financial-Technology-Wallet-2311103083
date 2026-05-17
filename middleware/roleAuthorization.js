const { errorResponse } = require('../utils/response');

function roleAuthorization(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Akses ditolak. User belum terautentikasi.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 'Akses ditolak. Role tidak memiliki izin.', 403);
    }

    return next();
  };
}

module.exports = roleAuthorization;
