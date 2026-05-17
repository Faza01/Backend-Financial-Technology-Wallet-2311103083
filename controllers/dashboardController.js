const Dashboard = require('../models/dashboard');
const { successResponse, errorResponse } = require('../utils/response');

// menampilkan ringkasan data untuk dashboard admin
const getDashboard = async (req, res) => {
  try {
    const dashboard = await Dashboard.getSummary();
    return successResponse(res, 'Data dashboard berhasil diambil', { dashboard });
  } catch (error) {
    console.error('Get dashboard error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengambil dashboard');
  }
};

module.exports = { getDashboard };
