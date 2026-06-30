const db = require("../config/db");
const fs = require("fs").promises;
const path = require("path");
const AUDIT_FILE = path.join(__dirname, '../data/audit_logs.json');

const getStats = async (req, res) => {
  try {
    const [[{ totalResidents }]] = await db.query(
      `SELECT COUNT(*) as totalResidents FROM residents`,
    );

    const [[{ totalVehicles }]] = await db.query(
      `SELECT COUNT(*) as totalVehicles FROM vehicles`,
    );

    const [[{ activeSessions }]] = await db.query(
      `SELECT COUNT(*) as activeSessions FROM parking_session WHERE status = 'parking'`,
    );

    const [[{ monthlyActive }]] = await db.query(
      `SELECT COUNT(*) as monthlyActive FROM monthly_parking WHERE status = 'active' AND end_date >= CURDATE()`,
    );

    const [[{ activeAdminCount }]] = await db.query(
      `SELECT COUNT(*) as activeAdminCount FROM users WHERE status = 'active' AND role_id IN (1, 2)`,
    );

    let totalLogs = 0;
    try {
      const logData = await fs.readFile(AUDIT_FILE, 'utf8');
      const logs = JSON.parse(logData);
      const [adminUsers] = await db.query(
        `SELECT user_id FROM users WHERE role_id IN (1, 2)`,
      );
      const adminUserIds = new Set(adminUsers.map(user => Number(user.user_id)));
      totalLogs = Array.isArray(logs)
        ? logs.filter(log => {
            if (log.role_id !== undefined && log.role_id !== null) {
              return [1, 2].includes(Number(log.role_id));
            }
            return adminUserIds.has(Number(log.user_id));
          }).length
        : 0;
    } catch (e) {
      console.error("Failed to read audit logs for dashboard stats:", e);
    }

    res.json({
      totalResidents,
      totalVehicles,
      activeSessions,
      monthlyActive,
      activeAdminCount,
      totalLogs
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = { getStats };
