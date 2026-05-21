const fs = require('fs').promises;
const path = require('path');
const AUDIT_FILE = path.join(__dirname, '../data/audit_logs.json');

const logAudit = async (userId, username, action, targetType, targetId, oldValue, newValue, description, ipAddress = "127.0.0.1") => {
  try {
    const data = await fs.readFile(AUDIT_FILE, 'utf8');
    const logs = JSON.parse(data);
    
    const newLog = {
      log_id: Date.now(),
      user_id: userId,
      username: username,
      action,
      target_type: targetType,
      target_id: targetId,
      old_value: oldValue ? JSON.stringify(oldValue) : null,
      new_value: newValue ? JSON.stringify(newValue) : null,
      description,
      ip_address: ipAddress,
      created_at: new Date().toISOString()
    };
    
    logs.unshift(newLog); // Add to beginning
    
    // Keep only last 5000 logs to prevent file bloat
    if (logs.length > 5000) logs.pop();
    
    await fs.writeFile(AUDIT_FILE, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};

module.exports = { logAudit };
