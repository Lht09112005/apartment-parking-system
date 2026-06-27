const fs = require('fs').promises;
const path = require('path');
const SETTINGS_FILE = path.join(__dirname, '../data/settings.json');

const checkMaintenanceMode = async (req, res, next) => {
  // Allow login and admin/superadmin actions even in maintenance mode
  const isBypass = req.path.startsWith('/api/auth') || (req.user && [1, 2].includes(req.user.role_id));

  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);
    
    console.log(`[Maintenance Check] Path: ${req.path}, User Role: ${req.user?.role_id || 'None'}, Mode: ${settings.maintenance_mode}, Bypass: ${isBypass}`);
    
    if (settings.maintenance_mode === true && !isBypass) {
      console.log(`[Maintenance Active] Blocking request to ${req.path}`);
      return res.status(503).json({ message: 'Hệ thống đang bảo trì, vui lòng quay lại sau.' });
    }
  } catch (err) {
    console.error('Error reading settings for maintenance check:', err);
    // Proceed if file error so we don't break everything
  }

  next();
};

module.exports = { checkMaintenanceMode };
