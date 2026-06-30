const fs = require('fs').promises;
const path = require('path');
const db = require('../config/db');
const AUDIT_FILE = path.join(__dirname, '../data/audit_logs.json');
const AUDIT_ROLE_IDS = [1, 2];

const logAudit = async (userId, username, action, targetType, targetId, oldValue, newValue, description, ipAddress = "127.0.0.1") => {
  try {
    // Nhật ký kiểm toán của Super Admin chỉ theo dõi tài khoản quản trị.
    // Kiểm tra bằng role_id thay vì username để tránh ghi nhầm khi đổi tên tài khoản.
    const [users] = await db.query(
      'SELECT role_id FROM users WHERE user_id = ? LIMIT 1',
      [userId]
    );
    const roleId = Number(users[0]?.role_id);
    if (!AUDIT_ROLE_IDS.includes(roleId)) return;

    const data = await fs.readFile(AUDIT_FILE, 'utf8');
    const logs = JSON.parse(data);
    
    const newLog = {
      log_id: Date.now(),
      user_id: userId,
      username: username,
      role_id: roleId,
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
