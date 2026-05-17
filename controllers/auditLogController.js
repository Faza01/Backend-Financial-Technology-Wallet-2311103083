const AuditLog = require('../models/auditLog');
const { successResponse, errorResponse } = require('../utils/response');

// mendapatkan semua log audit
const getAllAuditLogs = async (req, res) => {
  try {
    const audit_logs = await AuditLog.findAll();
    return successResponse(res, 'Data audit log berhasil diambil', { audit_logs });
  } catch (error) {
    console.error('Get all audit logs error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengambil audit log');
  }
};

// mendapatkan detail audit log berdasarkan id
const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const audit_log = await AuditLog.findById(id);

    if (!audit_log) {
      return errorResponse(res, 'Audit log tidak ditemukan', 404);
    }

    return successResponse(res, 'Detail audit log berhasil diambil', { audit_log });
  } catch (error) {
    console.error('Get audit log by ID error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengambil detail audit log');
  }
};

module.exports = { getAllAuditLogs, getAuditLogById };
