const express = require('express');
const router = express.Router();
const { getAllAuditLogs, getAuditLogById } = require('../controllers/auditLogController');
const authenticateToken = require('../middleware/auth');
const roleAuthorization = require('../middleware/roleAuthorization');

router.use(authenticateToken);

router.get('/', roleAuthorization('admin', 'auditor'), getAllAuditLogs);
router.get('/:id', roleAuthorization('admin', 'auditor'), getAuditLogById);

module.exports = router;
