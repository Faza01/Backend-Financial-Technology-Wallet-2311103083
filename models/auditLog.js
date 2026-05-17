const { pool } = require('../config/database');

const AuditLog = {
    // membuat log audit baru
    create: async (auditData) => {
        const { user_id, action, entity, entity_id, old_value, new_value, ip_address } = auditData;
        const query = `
        INSERT INTO audit_logs (user_id, action, entity, entity_id, old_value, new_value, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.execute(query, [
        user_id,
        action,
        entity,
        entity_id || null,
        old_value ? JSON.stringify(old_value) : null,
        new_value ? JSON.stringify(new_value) : null,
        ip_address || null,
        ]);
        return result;
    },

    // menampilkan semua log audit
    findAll: async () => {
        const query = `
        SELECT al.*, u.name as user_name, u.email as user_email, u.role as user_role
        FROM audit_logs al
        JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        `;
        const [rows] = await pool.execute(query);
        return rows;
    },

    // mencari log audit berdasarkan id
    findById: async (id) => {
        const query = `
        SELECT al.*, u.name as user_name, u.email as user_email, u.role as user_role
        FROM audit_logs al
        JOIN users u ON al.user_id = u.id
        WHERE al.id = ?
        `;
        const [rows] = await pool.execute(query, [id]);
        return rows.length > 0 ? rows[0] : null;
    },
};

module.exports = AuditLog;
