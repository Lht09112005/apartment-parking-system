const fs = require('fs').promises;
const path = require('path');
const db = require('../config/db');
const AUDIT_FILE = path.join(__dirname, '../data/audit_logs.json');
const AUDIT_ROLE_IDS = [1, 2];

const getLogs = async (req, res) => {
  try {
    const data = await fs.readFile(AUDIT_FILE, 'utf8');
    let logs = JSON.parse(data);

    // Log mới có role_id; log cũ được đối chiếu với vai trò hiện tại trong database.
    const [adminUsers] = await db.query(
      'SELECT user_id FROM users WHERE role_id IN (?, ?)',
      AUDIT_ROLE_IDS
    );
    const adminUserIds = new Set(adminUsers.map(user => Number(user.user_id)));
    logs = logs.filter(log => {
      if (log.role_id !== undefined && log.role_id !== null) {
        return AUDIT_ROLE_IDS.includes(Number(log.role_id));
      }
      return adminUserIds.has(Number(log.user_id));
    });
    
    // Simple filtering
    const { action, target_type } = req.query;
    if (action) logs = logs.filter(l => l.action === action);
    if (target_type) logs = logs.filter(l => l.target_type === target_type);
    
    res.json(logs);
  } catch (err) {
    console.error('Error reading audit logs:', err);
    res.status(500).json({ message: 'Lỗi server khi đọc nhật ký' });
  }
};

module.exports = { getLogs };
