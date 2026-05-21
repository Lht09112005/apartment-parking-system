const fs = require('fs').promises;
const path = require('path');
const AUDIT_FILE = path.join(__dirname, '../data/audit_logs.json');

const getLogs = async (req, res) => {
  try {
    const data = await fs.readFile(AUDIT_FILE, 'utf8');
    let logs = JSON.parse(data);
    
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
