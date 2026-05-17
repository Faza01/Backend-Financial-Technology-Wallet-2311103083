const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardController');
const authenticateToken = require('../middleware/auth');
const roleAuthorization = require('../middleware/roleAuthorization');

router.use(authenticateToken);

router.get('/', roleAuthorization('admin', 'auditor'), getDashboard);

module.exports = router;
