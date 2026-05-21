const fs = require('fs').promises;
const path = require('path');
const SETTINGS_FILE = path.join(__dirname, '../data/settings.json');

const checkMaintenanceMode = async (req, res, next) => {
  // Allow login and superadmin actions even in maintenance mode
  if (req.path.startsWith('/api/auth') || (req.user && req.user.role_id === 1)) {
    return next();
  }

  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);
    
    if (settings.maintenance_mode === true) {
      return res.status(503).json({ message: 'Hệ thống đang bảo trì, vui lòng quay lại sau.' });
    }
  } catch (err) {
    console.error('Error reading settings for maintenance check:', err);
    // Proceed if file error so we don't break everything
  }

  next();
};

module.exports = { checkMaintenanceMode };
