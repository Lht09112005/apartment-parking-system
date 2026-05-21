const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { verifyToken, authorizeRoles } = require('../middleware/auth.middleware');

router.get('/', verifyToken, authorizeRoles('Super Admin', 'Admin'), settingsController.getSettings);
router.put('/', verifyToken, authorizeRoles('Super Admin'), settingsController.updateSettings);

module.exports = router;
