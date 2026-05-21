const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backup.controller');
const { verifyToken, authorizeRoles } = require('../middleware/auth.middleware');

router.use(verifyToken, authorizeRoles('Super Admin'));

router.get('/', backupController.listBackups);
router.post('/create', backupController.createBackup);
router.post('/restore/:filename', backupController.restoreBackup);
router.delete('/purge', backupController.purgeData);

module.exports = router;
