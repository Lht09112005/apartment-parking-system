const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { verifyToken, authorizeRoles } = require('../middleware/auth.middleware');

router.get('/logs', verifyToken, authorizeRoles('Super Admin'), auditController.getLogs);

module.exports = router;
